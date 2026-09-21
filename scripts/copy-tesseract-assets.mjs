import { cp, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const destDir = path.join(root, "public", "tesseract");

// Gift Track always initializes the worker with OEM.LSTM_ONLY (see src/ocr.ts),
// so only the "*-lstm" core variants can ever be loaded — the plain/legacy
// OCR engine variants are skipped to keep the installed app several MB smaller.
const files = [
  ["node_modules/tesseract.js/dist/worker.min.js", "worker.min.js"],
  ["node_modules/tesseract.js-core/tesseract-core-lstm.wasm.js", "tesseract-core-lstm.wasm.js"],
  ["node_modules/tesseract.js-core/tesseract-core-lstm.wasm", "tesseract-core-lstm.wasm"],
  [
    "node_modules/tesseract.js-core/tesseract-core-simd-lstm.wasm.js",
    "tesseract-core-simd-lstm.wasm.js",
  ],
  [
    "node_modules/tesseract.js-core/tesseract-core-simd-lstm.wasm",
    "tesseract-core-simd-lstm.wasm",
  ],
  [
    "node_modules/tesseract.js-core/tesseract-core-relaxedsimd-lstm.wasm.js",
    "tesseract-core-relaxedsimd-lstm.wasm.js",
  ],
  [
    "node_modules/tesseract.js-core/tesseract-core-relaxedsimd-lstm.wasm",
    "tesseract-core-relaxedsimd-lstm.wasm",
  ],
];

async function main() {
  await mkdir(destDir, { recursive: true });
  await Promise.all(
    files.map(([from, to]) => cp(path.join(root, from), path.join(destDir, to)))
  );
  console.log("Copied Tesseract worker/core assets to public/tesseract.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
