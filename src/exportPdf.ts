import { jsPDF } from "jspdf";
import { Capacitor } from "@capacitor/core";
import { Directory, Filesystem } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { formatAmount } from "./format";
import type { FieldItem, FieldList } from "./types";

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 15;
const GAP = 8;
const COL_W = (PAGE_W - MARGIN * 2 - GAP) / 2;
const MEDIA_H = COL_W * 0.75;
const CELL_H = MEDIA_H + 24;
const MAX_PHOTO_PX = 1000;

const BLACK: [number, number, number] = [18, 18, 18];
const GOLD: [number, number, number] = [245, 197, 24];
const CREAM: [number, number, number] = [255, 248, 225];
const SOFT: [number, number, number] = [110, 100, 80];

interface PreparedPhoto {
  dataUrl: string;
  width: number;
  height: number;
}

async function preparePhoto(blob: Blob): Promise<PreparedPhoto> {
  const bitmap = await createImageBitmap(blob);
  const scale = Math.min(1, MAX_PHOTO_PX / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  return { dataUrl: canvas.toDataURL("image/jpeg", 0.8), width, height };
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  return `${formatDate(ts)} · ${d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`;
}

function fileNameFor(list: FieldList): string {
  const slug = list.name
    .replace(/[^\w\- ]+/g, "")
    .trim()
    .replace(/\s+/g, "-");
  return `${slug || "gift-track-list"}.pdf`;
}

function drawHeader(doc: jsPDF, list: FieldList, items: FieldItem[]): number {
  const gifts = items.filter((it) => it.entryType !== "cash").length;
  const cash = items.length - gifts;
  const amounts = items.filter((it) => it.entryType === "cash" && it.amount != null);
  const cashTotal = amounts.reduce((sum, it) => sum + (it.amount ?? 0), 0);

  doc.setFillColor(...BLACK);
  doc.rect(0, 0, PAGE_W, 34, "F");
  doc.setFillColor(...GOLD);
  doc.rect(0, 34, PAGE_W, 1.5, "F");

  doc.setTextColor(...GOLD);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(doc.splitTextToSize(list.name, PAGE_W - MARGIN * 2)[0], MARGIN, 17);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(
    `${items.length} item${items.length === 1 ? "" : "s"}  ·  ${gifts} gift${gifts === 1 ? "" : "s"}  ·  ${cash} cash${amounts.length > 0 ? ` (total ${formatAmount(cashTotal)})` : ""}  ·  Exported ${formatDate(Date.now())}`,
    MARGIN,
    26
  );

  return 34 + 1.5 + 10;
}

function drawCell(doc: jsPDF, item: FieldItem, photo: PreparedPhoto | null, x: number, y: number) {
  doc.setDrawColor(212, 178, 74);
  doc.setLineWidth(0.3);
  doc.setFillColor(...CREAM);
  doc.roundedRect(x, y, COL_W, MEDIA_H, 2, 2, "FD");

  if (photo) {
    const ratio = Math.min((COL_W - 2) / photo.width, (MEDIA_H - 2) / photo.height);
    const w = photo.width * ratio;
    const h = photo.height * ratio;
    doc.addImage(photo.dataUrl, "JPEG", x + (COL_W - w) / 2, y + (MEDIA_H - h) / 2, w, h);
  } else {
    doc.setTextColor(...BLACK);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(13);
    const lines: string[] = doc.splitTextToSize(item.caption, COL_W - 14);
    const shown = lines.slice(0, 6);
    const lineH = 6;
    const startY = y + MEDIA_H / 2 - ((shown.length - 1) * lineH) / 2 + 2;
    doc.text(shown, x + COL_W / 2, startY, { align: "center", lineHeightFactor: 1.3 });
  }

  const badge = `#${item.number}`;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  const badgeW = doc.getTextWidth(badge) + 5;
  doc.setFillColor(...BLACK);
  doc.roundedRect(x + 3, y + 3, badgeW, 6, 3, 3, "F");
  doc.setTextColor(...GOLD);
  doc.text(badge, x + 3 + badgeW / 2, y + 7.2, { align: "center" });

  const typeLabel =
    item.entryType === "cash"
      ? item.amount != null
        ? `CASH · ${formatAmount(item.amount)}`
        : "CASH"
      : "GIFT";
  const typeW = doc.getTextWidth(typeLabel) + 5;
  doc.setFillColor(...GOLD);
  doc.roundedRect(x + COL_W - 3 - typeW, y + 3, typeW, 6, 3, 3, "F");
  doc.setTextColor(...BLACK);
  doc.text(typeLabel, x + COL_W - 3 - typeW / 2, y + 7.2, { align: "center" });

  doc.setTextColor(...BLACK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  const captionLines: string[] = doc.splitTextToSize(photo ? item.caption : "Text entry", COL_W);
  doc.text(captionLines.slice(0, 2), x, y + MEDIA_H + 6, { lineHeightFactor: 1.25 });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...SOFT);
  doc.text(formatTimestamp(item.createdAt), x, y + MEDIA_H + 19);
}

export async function buildListPdf(list: FieldList, items: FieldItem[]): Promise<jsPDF> {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = drawHeader(doc, list, items);

  for (let i = 0; i < items.length; i += 2) {
    if (y + CELL_H > PAGE_H - MARGIN) {
      doc.addPage();
      y = MARGIN;
    }
    const row = items.slice(i, i + 2);
    const photos = await Promise.all(row.map((it) => (it.photoBlob ? preparePhoto(it.photoBlob) : null)));
    row.forEach((item, col) => drawCell(doc, item, photos[col], MARGIN + col * (COL_W + GAP), y));
    y += CELL_H + GAP;
  }

  if (items.length === 0) {
    doc.setTextColor(...SOFT);
    doc.setFontSize(11);
    doc.text("No entries yet.", MARGIN, y + 4);
  }

  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...SOFT);
    doc.text(`Gift Track  ·  Page ${p} of ${pages}`, PAGE_W / 2, PAGE_H - 7, { align: "center" });
  }

  return doc;
}

export async function exportListPdf(list: FieldList, items: FieldItem[]): Promise<"saved" | "shared"> {
  const doc = await buildListPdf(list, items);
  const fileName = fileNameFor(list);

  if (Capacitor.isNativePlatform()) {
    const base64 = doc.output("datauristring").split(",")[1];
    const { uri } = await Filesystem.writeFile({
      path: fileName,
      data: base64,
      directory: Directory.Cache,
    });
    await Share.share({ title: list.name, files: [uri] });
    return "shared";
  }

  const blob = doc.output("blob");
  const file = new File([blob], fileName, { type: "application/pdf" });
  const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
  if (coarsePointer && navigator.canShare?.({ files: [file] })) {
    await navigator.share({ title: list.name, files: [file] });
    return "shared";
  }

  doc.save(fileName);
  return "saved";
}
