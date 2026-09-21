// Generates the source images Capacitor's asset generator (`npx capacitor-assets
// generate`, see package.json's "native:assets" script) reads from `assets/` to
// produce every iOS/Android icon size, adaptive-icon layer, and splash screen.
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { PAPER, masterSvg, glyphSvg } from "./icon-svg.mjs";

// Matches src/index.css's :root[data-theme="dark"] --paper, so the native
// splash screen doesn't flash a mismatched color before the web view paints.
const PAPER_DARK = "#1c1914";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const assetsDir = path.join(__dirname, "..", "assets");

async function main() {
  await mkdir(assetsDir, { recursive: true });

  // Full app icon (iOS + Android legacy/round icons).
  await sharp(Buffer.from(masterSvg()), { density: 384 })
    .resize(1024, 1024)
    .png()
    .toFile(path.join(assetsDir, "icon.png"));

  // Android adaptive icon: separate foreground glyph (scaled down so it
  // survives the OS's circle/squircle/rounded-square crop masks) and a flat
  // background layer.
  await sharp(Buffer.from(glyphSvg({ size: 1024, scale: 0.62 })), { density: 384 })
    .resize(1024, 1024)
    .png()
    .toFile(path.join(assetsDir, "icon-foreground.png"));

  await sharp({
    create: { width: 1024, height: 1024, channels: 3, background: PAPER },
  })
    .png()
    .toFile(path.join(assetsDir, "icon-background.png"));

  // Splash screens: centered glyph on the app's paper/teal tones, light and
  // dark, sized to Capacitor's recommended 2732x2732 canvas.
  const splashGlyph = await sharp(Buffer.from(glyphSvg({ size: 820, scale: 1 })))
    .resize(820, 820)
    .png()
    .toBuffer();

  await sharp({
    create: { width: 2732, height: 2732, channels: 3, background: PAPER },
  })
    .composite([{ input: splashGlyph, gravity: "center" }])
    .png()
    .toFile(path.join(assetsDir, "splash.png"));

  await sharp({
    create: { width: 2732, height: 2732, channels: 3, background: PAPER_DARK },
  })
    .composite([{ input: splashGlyph, gravity: "center" }])
    .png()
    .toFile(path.join(assetsDir, "splash-dark.png"));

  console.log("Native (iOS/Android) icon + splash source assets generated in assets/.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
