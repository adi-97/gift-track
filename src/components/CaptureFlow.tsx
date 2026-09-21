import { useEffect, useState } from "react";
import CameraView from "./CameraView";
import PhotoImage from "./PhotoImage";
import { addItem, createList } from "../db";
import { recognizePhoto } from "../ocr";
import { useSettings } from "../hooks/useSettings";
import { useToast } from "../hooks/useToast";
import { IconClose } from "./icons";
import type { EntryType } from "../types";
import "./CaptureFlow.css";

interface CaptureFlowProps {
  mode: "new-list" | "add-item";
  listId?: string;
  onDone: (listId: string) => void;
  onCancel: () => void;
}

type Phase = "camera" | "review";
type OcrPhase = "idle" | "reading" | "done" | "skipped" | "error";

export default function CaptureFlow({ mode, listId, onDone, onCancel }: CaptureFlowProps) {
  const { settings } = useSettings();
  const { showToast } = useToast();
  const [phase, setPhase] = useState<Phase>("camera");
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [ocrPhase, setOcrPhase] = useState<OcrPhase>("idle");
  const [manualScanning, setManualScanning] = useState(false);
  const [ocrText, setOcrText] = useState("");
  const [caption, setCaption] = useState("");
  const [listName, setListName] = useState("");
  const [entryType, setEntryType] = useState<EntryType>("gift");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (phase !== "review" || !photoBlob) return;

    if (!settings.ocrEnabled) {
      setOcrPhase("skipped");
      return;
    }

    let cancelled = false;
    setOcrPhase("reading");
    recognizePhoto(photoBlob)
      .then((result) => {
        if (cancelled) return;
        setOcrText(result.fullText);
        const best = result.bestLine || "";
        setCaption(best);
        if (mode === "new-list") setListName(best);
        setOcrPhase("done");
      })
      .catch(() => {
        if (cancelled) return;
        setOcrPhase("error");
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, photoBlob]);

  function handleCapture(blob: Blob) {
    setPhotoBlob(blob);
    setPhase("review");
  }

  function handleRetake() {
    setPhotoBlob(null);
    setCaption("");
    setListName("");
    setOcrPhase("idle");
    setEntryType("gift");
    setPhase("camera");
  }

  async function handleManualScan() {
    if (!photoBlob || manualScanning || isReading) return;
    setManualScanning(true);
    try {
      const result = await recognizePhoto(photoBlob);
      setOcrText(result.fullText);
      const best = result.bestLine || "";
      setCaption(best);
      if (mode === "new-list") setListName(best);
      setOcrPhase("done");
    } catch {
      setOcrPhase("error");
    } finally {
      setManualScanning(false);
    }
  }

  async function handleSave() {
    if (!photoBlob || saving) return;
    setSaving(true);
    try {
      const finalCaption = caption.trim() || "Untitled photo";
      let targetListId = listId;
      if (mode === "new-list") {
        const list = await createList(listName.trim() || "Untitled list");
        targetListId = list.id;
      }
      if (!targetListId) throw new Error("Missing list id");
      const item = await addItem({
        listId: targetListId,
        photoBlob,
        caption: finalCaption,
        ocrText,
        entryType,
      });
      showToast(`Saved #${item.number} · ${finalCaption}`);
      onDone(targetListId);
    } finally {
      setSaving(false);
    }
  }

  if (phase === "camera") {
    return <CameraView onCapture={handleCapture} onClose={onCancel} />;
  }

  const isReading = ocrPhase === "reading";

  return (
    <div className="capture-review">
      <div className="capture-review__photo-wrap">
        {photoBlob && (
          <PhotoImage blob={photoBlob} alt="Captured photo" className="capture-review__photo" />
        )}
        <button type="button" className="capture-review__close" onClick={onCancel} aria-label="Cancel">
          <IconClose />
        </button>
      </div>

      <div className="capture-review__form">
        {isReading && (
          <div className="capture-review__reading">
            <span className="capture-review__reading-dot" />
            Reading text…
          </div>
        )}

        {mode === "new-list" && (
          <label className="field">
            <span className="field__label">List name</span>
            <input
              className="field__input field__input--heading"
              value={listName}
              onChange={(e) => setListName(e.target.value)}
              placeholder="Untitled list"
              disabled={isReading}
            />
          </label>
        )}

        <label className="field">
          <span className="field__label">Caption</span>
          <input
            className="field__input field__input--heading"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Untitled photo"
            disabled={isReading}
          />
        </label>

        <button
          type="button"
          className="capture-review__scan-btn"
          onClick={handleManualScan}
          disabled={isReading || manualScanning}
        >
          {manualScanning
            ? "Reading text…"
            : ocrPhase === "done" || ocrPhase === "error"
            ? "Re-scan text"
            : "Scan text"}
        </button>

        <div className="field">
          <span className="field__label">Type</span>
          <div className="entry-type" role="radiogroup" aria-label="Gift or cash">
            <button
              type="button"
              role="radio"
              aria-checked={entryType === "gift"}
              className={`entry-type__option ${entryType === "gift" ? "entry-type__option--active" : ""}`}
              onClick={() => setEntryType("gift")}
            >
              🎁 Gift
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={entryType === "cash"}
              className={`entry-type__option ${entryType === "cash" ? "entry-type__option--active" : ""}`}
              onClick={() => setEntryType("cash")}
            >
              💵 Cash
            </button>
          </div>
        </div>

        <div className="capture-review__actions">
          <button type="button" className="btn btn--ghost" onClick={handleRetake} disabled={saving}>
            Retake
          </button>
          <button
            type="button"
            className="btn btn--primary"
            onClick={handleSave}
            disabled={isReading || saving}
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
