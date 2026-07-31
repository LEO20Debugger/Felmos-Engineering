/**
 * Turning an uploaded file into a set of web-ready images on disk.
 *
 * Everything here is deliberately defensive about the input, because an upload
 * endpoint is the one place where a stranger's bytes reach the server.
 */

import { BadRequestException } from "@nestjs/common";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, resolve, sep } from "node:path";
import sharp from "sharp";

import { mediaRoot } from "@/common/media-root";

/** The widths the site actually requests, from next.config.ts's deviceSizes. */
export const VARIANTS = [360, 640, 1080, 1600, 2000] as const;

/**
 * Identify a file by its leading bytes.
 *
 * Hand-rolled rather than pulled from a library for two reasons: the `file-type`
 * package is ESM-only and this service compiles to CommonJS, and the check
 * itself is four fixed byte patterns. A dependency for twenty lines is a poor
 * trade when the alternative is this legible.
 *
 * The header is the only trustworthy signal. `Content-Type` and the filename
 * are both supplied by whoever is uploading, so a file called `photo.jpg`
 * declared as `image/jpeg` can contain anything at all.
 *
 * What this is really guarding against is SVG. Browsers execute script inside
 * SVG, so an SVG served back from our own origin is stored cross-site
 * scripting. sharp will happily parse one, so it has to be rejected here —
 * before the bytes reach an image decoder.
 */
function sniffMime(buffer: Buffer): string | null {
  const b = (i: number): number => buffer[i] ?? -1;

  if (b(0) === 0xff && b(1) === 0xd8 && b(2) === 0xff) return "image/jpeg";

  if (
    b(0) === 0x89 && b(1) === 0x50 && b(2) === 0x4e && b(3) === 0x47 &&
    b(4) === 0x0d && b(5) === 0x0a && b(6) === 0x1a && b(7) === 0x0a
  ) {
    return "image/png";
  }

  /* RIFF....WEBP — the four-byte size sits between the two markers. */
  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }

  /* ISO-BMFF: "ftyp" at offset 4, then a brand. AVIF and HEIC share the
     container, so the brand is what distinguishes them. */
  if (buffer.length >= 12 && buffer.toString("ascii", 4, 8) === "ftyp") {
    const brand = buffer.toString("ascii", 8, 12);
    if (brand === "avif" || brand === "avis") return "image/avif";
  }

  return null;
}

export type StoredImage = {
  storageKey: string;
  mime: string;
  width: number;
  height: number;
  bytes: number;
  blurDataUrl: string;
};

/**
 * Validate, re-encode and write every variant.
 *
 * The type is sniffed from the file's magic bytes rather than trusted from the
 * `Content-Type` header or the extension, both of which the client controls. A
 * .jpg that is actually an SVG would otherwise reach sharp, and SVG is a script
 * carrier — served back to a browser it is a stored cross-site scripting hole.
 */
export async function storeImage(
  buffer: Buffer,
  companyId: number
): Promise<StoredImage> {
  const sniffed = sniffMime(buffer);

  if (!sniffed) {
    throw new BadRequestException(
      "That file is not a supported image. Use JPEG, PNG, WebP or AVIF."
    );
  }

  /* `.rotate()` with no argument applies the EXIF orientation and then drops
     the metadata. Without it, phone photos taken in portrait appear sideways —
     the pixels are landscape and only the EXIF tag says otherwise. It also
     strips GPS coordinates, which phone cameras embed by default and which
     have no business being republished on a public website. */
  const source = sharp(buffer, { failOn: "error" }).rotate();
  const meta = await source.metadata();

  const width = meta.width ?? 0;
  const height = meta.height ?? 0;
  if (width < 1 || height < 1) {
    throw new BadRequestException("That image could not be read.");
  }

  const key = `media/${companyId}/${new Date().getFullYear()}/${randomKey()}`;
  const dir = join(mediaRoot(), key);
  await mkdir(dir, { recursive: true });

  /* Never upscale: a 500px original re-encoded at 2000px is a bigger file
     carrying no more detail. Always emit at least one variant, so a very small
     image still has something to serve. */
  const widths = VARIANTS.filter((w) => w <= width);
  if (widths.length === 0) widths.push(VARIANTS[0]);

  let bytes = 0;
  for (const w of widths) {
    const out = await source
      .clone()
      .resize({ width: w, withoutEnlargement: true })
      .webp({ quality: 78 })
      .toBuffer();

    await writeFile(join(dir, `${w}.webp`), out);
    bytes += out.length;
  }

  /* A 16px preview inlined as a data URI, for next/image's blur placeholder.
     Small enough to sit in the HTML without meaningfully affecting page size. */
  const blur = await source
    .clone()
    .resize({ width: 16 })
    .webp({ quality: 30 })
    .toBuffer();

  return {
    storageKey: key,
    mime: "image/webp",
    width,
    height,
    bytes,
    blurDataUrl: `data:image/webp;base64,${blur.toString("base64")}`,
  };
}

/**
 * Read a variant, generating an arbitrary crop on demand and caching it.
 *
 * The on-demand path exists because several layouts ask for a specific aspect
 * ratio of an image that is landscape everywhere else — the portrait service
 * panels, for instance. The stock photo providers did that server-side via URL
 * parameters, and dropping the capability would letterbox those images.
 *
 * Dimensions are clamped rather than taken as given: an open resize endpoint is
 * a trivial denial-of-service, since each unique size costs a sharp render and
 * a file on the volume.
 */
export async function readVariant(
  storageKey: string,
  width?: number,
  height?: number
): Promise<Buffer | null> {
  const root = mediaRoot();
  const dir = resolve(root, storageKey);

  /* Containment check. storageKey comes from the database rather than the URL,
     but this function is one refactor away from being called with user input,
     and the cost of being wrong is reading arbitrary files off the server.

     Both sides are resolved absolute paths — comparing a normalised join
     against a relative root silently fails for every legitimate key, which is
     exactly the bug this replaced. */
  if (!dir.startsWith(root + sep) && dir !== root) return null;

  if (!width) {
    for (const w of [...VARIANTS].reverse()) {
      const path = join(dir, `${w}.webp`);
      if (existsSync(path)) return readFile(path);
    }
    return null;
  }

  const w = clamp(width, 16, 2400);

  if (!height) {
    const exact = join(dir, `${w}.webp`);
    if (existsSync(exact)) return readFile(exact);

    /* Nearest variant at or above the request, resized down. */
    const source = nearestVariant(dir, w);
    if (!source) return null;
    return sharp(await readFile(source))
      .resize({ width: w, withoutEnlargement: true })
      .webp({ quality: 78 })
      .toBuffer();
  }

  const h = clamp(height, 16, 2400);
  const cached = join(dir, `${w}x${h}.webp`);
  if (existsSync(cached)) return readFile(cached);

  const source = nearestVariant(dir, w);
  if (!source) return null;

  const out = await sharp(await readFile(source))
    .resize({ width: w, height: h, fit: "cover", position: "attention" })
    .webp({ quality: 78 })
    .toBuffer();

  await writeFile(cached, out);
  return out;
}

function nearestVariant(dir: string, width: number): string | null {
  for (const w of VARIANTS) {
    if (w >= width) {
      const path = join(dir, `${w}.webp`);
      if (existsSync(path)) return path;
    }
  }
  for (const w of [...VARIANTS].reverse()) {
    const path = join(dir, `${w}.webp`);
    if (existsSync(path)) return path;
  }
  return null;
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, Math.round(value)));

/** Short, URL-safe, collision-resistant enough for a per-company namespace. */
function randomKey(): string {
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  for (let i = 0; i < 12; i += 1) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}
