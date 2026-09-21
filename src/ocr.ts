import { createWorker, type Worker } from "tesseract.js";

let workerPromise: Promise<Worker> | null = null;

function getWorker(): Promise<Worker> {
  if (!workerPromise) {
    // Worker + wasm core are self-hosted (see scripts/copy-tesseract-assets.mjs)
    // so OCR keeps working offline once installed; only the language data
    // (eng.traineddata, fetched once and then cached by the service worker)
    // needs a network round-trip on first use.
    workerPromise = createWorker("eng", 1, {
      workerPath: "/tesseract/worker.min.js",
      corePath: "/tesseract/",
    });
  }
  return workerPromise;
}

/** Picks the single best line of detected text to use as a caption. */
function pickBestLine(lines: { text: string; confidence: number }[]): string {
  const candidates = lines
    .map((l) => ({ text: l.text.trim(), confidence: l.confidence }))
    .filter((l) => l.text.length >= 2 && /[a-zA-Z0-9]/.test(l.text));

  if (candidates.length === 0) return "";

  // Prefer confident, longer lines — a simple score balances both.
  candidates.sort((a, b) => {
    const scoreA = a.confidence + Math.min(a.text.length, 40);
    const scoreB = b.confidence + Math.min(b.text.length, 40);
    return scoreB - scoreA;
  });

  return candidates[0].text;
}

export interface OcrResult {
  bestLine: string;
  fullText: string;
}

export async function recognizePhoto(image: Blob): Promise<OcrResult> {
  const worker = await getWorker();
  const { data } = await worker.recognize(image, {}, { blocks: true, text: true });
  const lines = (data.blocks ?? []).flatMap((block) =>
    block.paragraphs.flatMap((paragraph) =>
      paragraph.lines.map((line) => ({ text: line.text, confidence: line.confidence }))
    )
  );
  return {
    bestLine: pickBestLine(lines),
    fullText: data.text?.trim() ?? "",
  };
}

export async function terminateOcr(): Promise<void> {
  if (workerPromise) {
    const worker = await workerPromise;
    await worker.terminate();
    workerPromise = null;
  }
}
