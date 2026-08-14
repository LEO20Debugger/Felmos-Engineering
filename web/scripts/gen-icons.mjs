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

/* The apple icon is the one output that must NOT be transparent. iOS does not
   composite a home-screen icon onto the wallpaper — it flattens it onto black,
   so the two navy masses would vanish into the ground and the mark would lose
   its plinth. Flattened onto white here, which is the ground the supplied
   artwork was drawn on, and it costs nothing elsewhere: iOS then applies its
   own rounded-rect mask to the square, which is why this file carries no
   corner radius of its own for it to cut twice.

   The favicon below stays transparent — that is the whole point of the change,
   and every browser that reads it draws it over its own chrome. */
await sharp(svg, { density: 384 })
  .resize(180, 180)
  .flatten({ background: "#ffffff" })
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
