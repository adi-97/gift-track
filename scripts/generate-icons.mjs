import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { PAPER, masterSvg } from "./icon-svg.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, "..", "public");
const iconsDir = path.join(publicDir, "icons");

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

async function main() {
  await mkdir(iconsDir, { recursive: true });
  const svg = Buffer.from(masterSvg());

  await Promise.all(
    sizes.map((size) =>
      sharp(svg, { density: 384 })
        .resize(size, size)
        .png()
        .toFile(path.join(iconsDir, `icon-${size}.png`))
    )
  );

  // maskable: same full-bleed artwork works directly since the glyph already
  // sits within the safe zone
  await sharp(svg, { density: 384 })
    .resize(512, 512)
    .png()
    .toFile(path.join(iconsDir, "icon-maskable-512.png"));

  await sharp(svg, { density: 384 })
    .resize(180, 180)
    .flatten({ background: PAPER })
    .png()
    .toFile(path.join(publicDir, "apple-touch-icon.png"));

  await sharp(svg, { density: 384 })
    .resize(32, 32)
    .png()
    .toFile(path.join(publicDir, "favicon-32.png"));

  await sharp(svg, { density: 384 })
    .resize(16, 16)
    .png()
    .toFile(path.join(publicDir, "favicon-16.png"));

  await writeFile(path.join(publicDir, "favicon.svg"), masterSvg().trim());

  console.log("PWA icons generated.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
