/*
 * Renders the raster icons from app/icon.svg.
 *
 * app/icon.svg is the source of truth and covers the address bar on every
 * browser that supports SVG favicons — Chrome, Edge, Firefox. It does not
 * cover:
 *
 *   Safari (all versions)   ignores SVG favicons outright and needs the .ico
 *   Windows shortcuts,      .ico
 *   some feed readers
 *   iOS "Add to Home"       apple-icon.png, 180x180
 *
 * Next.js picks these up from app/ by filename and emits the <link> tags
 * itself; there is nothing to wire up. Chrome still prefers the SVG when both
 * are offered, because it is typed image/svg+xml — the .ico is a fallback, not
 * a downgrade.
 *
 * Run after changing the brand colours or the mark:
 *   node scripts/gen-icons.mjs
 */
import sharp from "sharp";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const appDir = join(dirname(fileURLToPath(import.meta.url)), "..", "app");
const svg = readFileSync(join(appDir, "icon.svg"));

/* iOS applies its own rounded-rect mask to a home-screen icon. Feeding it our
   own rx=13 tile means the corner gets cut twice and the result reads as a
   slightly shrunken, double-rounded square — so the apple icon is rendered
   from a squared-off copy of the same artwork. */
const squared = Buffer.from(String(svg).replace(' rx="13"', ""));

await sharp(squared, { density: 384 })
  .resize(180, 180)
  .png()
  .toFile(join(appDir, "apple-icon.png"));

/* sharp has no .ico encoder, but it does not need one: an ICO may carry a PNG
   payload verbatim (every browser since IE11 and Windows since Vista reads
   it). The container is a 6-byte ICONDIR plus one 16-byte ICONDIRENTRY, so it
   is cheaper to write the header than to take on a dependency for it. */
const png = await sharp(svg, { density: 384 }).resize(32, 32).png().toBuffer();

const ico = Buffer.alloc(22);
ico.writeUInt16LE(0, 0); // reserved
ico.writeUInt16LE(1, 2); // type 1 = icon
ico.writeUInt16LE(1, 4); // one image
ico.writeUInt8(32, 6); // width
ico.writeUInt8(32, 7); // height
ico.writeUInt8(0, 8); // palette size — 0 for truecolour
ico.writeUInt8(0, 9); // reserved
ico.writeUInt16LE(1, 10); // colour planes
ico.writeUInt16LE(32, 12); // bits per pixel
ico.writeUInt32LE(png.length, 14); // payload size
ico.writeUInt32LE(22, 18); // payload offset — straight after this header

writeFileSync(join(appDir, "favicon.ico"), Buffer.concat([ico, png]));

console.log("wrote app/favicon.ico (32px) and app/apple-icon.png (180px)");
