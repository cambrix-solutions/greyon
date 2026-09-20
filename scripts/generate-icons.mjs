/**
 * Generate Greyon favicon / PWA / apple icons from public/logo/logo.png
 * (circular brand badge). Run: npm run icons:generate
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const src = path.join(root, "public/logo/logo.png");
const markOut = path.join(root, "public/logo/greyon-mark.png");
const iconsDir = path.join(root, "public/icons");

const fullSizes = [
  ["favicon-96x96.png", 96],
  ["favicon-128x128.png", 128],
  ["icon-128x128.png", 128],
  ["icon-192x192.png", 192],
  ["icon-256x256.png", 256],
  ["icon-384x384.png", 384],
  ["icon-512x512.png", 512],
  ["apple-icon-120x120.png", 120],
  ["apple-icon-152x152.png", 152],
  ["apple-icon-167x167.png", 167],
  ["apple-icon-180x180.png", 180],
  ["ms-icon-144x144.png", 144]
];

const favSizes = [
  ["favicon-16x16.png", 16],
  ["favicon-32x32.png", 32],
  ["favicon-48x48.png", 48]
];

function pngsToIco(pngBuffers) {
  const n = pngBuffers.length;
  const header = Buffer.alloc(6 + 16 * n);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(n, 4);

  let offset = 6 + 16 * n;
  const chunks = [header];

  pngBuffers.forEach((png, i) => {
    const w = png.readUInt32BE(16);
    const h = png.readUInt32BE(20);
    const entry = 6 + i * 16;
    header.writeUInt8(w >= 256 ? 0 : w, entry);
    header.writeUInt8(h >= 256 ? 0 : h, entry + 1);
    header.writeUInt8(0, entry + 2);
    header.writeUInt8(0, entry + 3);
    header.writeUInt16LE(1, entry + 4);
    header.writeUInt16LE(32, entry + 6);
    header.writeUInt32LE(png.length, entry + 8);
    header.writeUInt32LE(offset, entry + 12);
    offset += png.length;
    chunks.push(png);
  });

  return Buffer.concat(chunks);
}

/** Square resize of the circular badge. */
async function resizeLogo(size) {
  return sharp(src).resize(size, size, { fit: "cover" }).png().toBuffer();
}

async function main() {
  if (!fs.existsSync(src)) {
    throw new Error(`Missing logo: ${src}`);
  }
  fs.mkdirSync(iconsDir, { recursive: true });

  const markBuf = await resizeLogo(512);
  fs.writeFileSync(markOut, markBuf);
  console.log("wrote greyon-mark.png");

  const favPngs = [];
  for (const [name, size] of favSizes) {
    const buf = await resizeLogo(size);
    fs.writeFileSync(path.join(iconsDir, name), buf);
    favPngs.push(buf);
    console.log("wrote", name);
  }

  for (const [name, size] of fullSizes) {
    fs.writeFileSync(path.join(iconsDir, name), await resizeLogo(size));
    console.log("wrote", name);
  }

  const ico = pngsToIco(favPngs);
  fs.writeFileSync(path.join(root, "public/favicon.ico"), ico);
  fs.writeFileSync(path.join(iconsDir, "favicon.ico"), ico);
  console.log("wrote favicon.ico (", ico.length, "bytes)");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
