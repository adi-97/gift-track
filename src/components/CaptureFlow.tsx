import { useEffect, useState } from "react";
import CameraView from "./CameraView";
import PhotoImage from "./PhotoImage";
import { addItem } from "../db";
import { useSettings } from "../hooks/useSettings";
import { useToast } from "../hooks/useToast";
import { IconCamera, IconClose, IconMoney } from "./icons";
import { parseAmount } from "../format";
import type { EntryType } from "../types";
import "./CaptureFlow.css";

async function recognizePhoto(image: Blob) {
  const ocr = await import("../ocr");
  return ocr.recognizePhoto(image);
}

interface CaptureFlowProps {
  listId: string;
  onDone: () => void;
  onCancel: () => void;
}

type Phase = "camera" | "form";
type OcrPhase = "idle" | "reading" | "done" | "skipped" | "error";

export default function CaptureFlow({ listId, onDone, onCancel }: CaptureFlowProps) {
  const { settings } = useSettings();
  const { showToast } = useToast();
  const [phase, setPhase] = useState<Phase>("form");
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [ocrPhase, setOcrPhase] = useState<OcrPhase>("idle");
  const [manualScanning, setManualScanning] = useState(false);
  const [ocrText, setOcrText] = useState("");
  const [caption, setCaption] = useState("");
  const [entryType, setEntryType] = useState<EntryType>("gift");
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!photoBlob) return;

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
        setCaption((current) => (current.trim() ? current : result.bestLine || ""));
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
  }, [photoBlob]);

  function handleCapture(blob: Blob) {
    setPhotoBlob(blob);
    setPhase("form");
  }

  function handleRemovePhoto() {
    setPhotoBlob(null);
    setOcrText("");
    setOcrPhase("idle");
  }

  async function handleManualScan() {
    if (!photoBlob || manualScanning || isReading) return;
    setManualScanning(true);
    try {
      const result = await recognizePhoto(photoBlob);
      setOcrText(result.fullText);
      setCaption(result.bestLine || "");
      setOcrPhase("done");
    } catch {
      setOcrPhase("error");
    } finally {
      setManualScanning(false);
    }
  }

  async function handleSave() {
    if (saving) return;
    setSaving(true);
    try {
      const finalCaption = caption.trim() || (photoBlob ? "Untitled photo" : "Untitled entry");
      const item = await addItem({
        listId,
        photoBlob,
        caption: finalCaption,
        ocrText,
        entryType,
        amount: parseAmount(amount),
      });
      showToast(`Saved #${item.number} · ${finalCaption}`);
      onDone();
    } finally {
      setSaving(false);
    }
  }

  if (phase === "camera") {
    return <CameraView onCapture={handleCapture} onClose={() => setPhase("form")} />;
  }

  const isReading = ocrPhase === "reading";

  return (
    <div className="capture-review">
      <header className="app-header">
        <div className="app-header__inner">
          <button type="button" className="icon-btn" onClick={onCancel} aria-label="Cancel">
            <IconClose />
          </button>
          <h2 className="capture-review__title">New entry</h2>
        </div>
      </header>

      <div className="capture-review__body">
        {photoBlob ? (
          <div className="capture-review__photo-block">
            <div className="capture-review__photo-wrap">
              <PhotoImage blob={photoBlob} alt="Captured photo" className="capture-review__photo" />
            </div>
            <div className="capture-review__photo-actions">
              <button type="button" className="capture-review__chip" onClick={() => setPhase("camera")}>
                Retake
              </button>
              <button type="button" className="capture-review__chip" onClick={handleRemovePhoto}>
                Remove photo
              </button>
              <button
                type="button"
                className="capture-review__chip"
                onClick={handleManualScan}
                disabled={isReading || manualScanning}
              >
                {manualScanning || isReading
                  ? "Reading text…"
                  : ocrPhase === "done" || ocrPhase === "error"
                  ? "Re-scan text"
                  : "Scan text"}
              </button>
            </div>
          </div>
        ) : (
          <button type="button" className="capture-review__add-photo" onClick={() => setPhase("camera")}>
            <IconCamera />
            <span>Add photo</span>
            <span className="capture-review__add-photo-hint">Optional</span>
          </button>
        )}

        {isReading && (
          <div className="capture-review__reading">
            <span className="capture-review__reading-dot" />
            Reading text…
          </div>
        )}

        <label className="field">
          <span className="field__label">Description</span>
          <textarea
            className="field__input field__input--heading capture-review__description"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="e.g. Silver photo frame from Aunt Meera"
            rows={3}
          />
        </label>

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

        {entryType === "cash" && (
          <label className="field">
            <span className="field__label">Amount (optional)</span>
            <span className="amount-input">
              <IconMoney className="amount-input__icon" />
              <input
                className="field__input amount-input__field"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^\d.,]/g, ""))}
                inputMode="decimal"
                placeholder="0"
              />
            </span>
          </label>
        )}
      </div>

      <div className="capture-review__actions">
        <button type="button" className="btn btn--ghost" onClick={onCancel} disabled={saving}>
          Cancel
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
  );
}
