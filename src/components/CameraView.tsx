import { useEffect, useRef, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { useSettings } from "../hooks/useSettings";
import { IconClose } from "./icons";
import "./CameraView.css";

interface CameraViewProps {
  onCapture: (blob: Blob) => void;
  onClose: () => void;
}

type CameraStatus = "starting" | "ready" | "blocked" | "unsupported";

function isLikelyEmbeddedWebview(): boolean {
  const ua = navigator.userAgent || "";
  return /FBAN|FBAV|Instagram|Line\/|MicroMessenger|Twitter|TikTok|wv\)/i.test(ua);
}

export default function CameraView({ onCapture, onClose }: CameraViewProps) {
  const { settings, setOcrEnabled } = useSettings();
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<CameraStatus>("starting");
  const [errorDetail, setErrorDetail] = useState<string>("");
  const [flashing, setFlashing] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        if (!cancelled) setStatus("unsupported");
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        if (!cancelled) setStatus("ready");
      } catch (err) {
        if (cancelled) return;
        const name = err instanceof DOMException ? err.name : "Unknown";
        setErrorDetail(name);
        setStatus("blocked");
      }
    }

    start();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  function handleShutter() {
    const video = videoRef.current;
    if (!video || status !== "ready") return;
    setFlashing(true);
    setTimeout(() => setFlashing(false), 220);
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (blob) onCapture(blob);
      },
      "image/jpeg",
      0.9
    );
  }

  function handleFileFallback(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onCapture(file);
    e.target.value = "";
  }

  const embedded = isLikelyEmbeddedWebview();
  const isNative = Capacitor.isNativePlatform();

  return (
    <div className="camera-view">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="camera-view__hidden-input"
        onChange={handleFileFallback}
      />

      <video
        ref={videoRef}
        className={`camera-view__video ${status === "ready" ? "" : "camera-view__video--hidden"}`}
        autoPlay
        playsInline
        muted
      />

      {flashing && <div className="camera-view__flash" aria-hidden="true" />}

      {status === "starting" && (
        <div className="camera-view__status">
          <div className="camera-view__spinner" aria-hidden="true" />
          <p>Opening camera…</p>
        </div>
      )}

      {(status === "blocked" || status === "unsupported") && (
        <div className="camera-view__status camera-view__status--error">
          <p className="camera-view__error-title">Camera access unavailable</p>
          <p className="camera-view__error-body">
            {isNative
              ? "Gift Track doesn't have permission to use the camera. Open your device Settings, find Gift Track, and allow Camera access, then come back and try again."
              : embedded
              ? "This looks like an in-app browser (e.g. Instagram, Facebook, TikTok, or a chat app's built-in browser), which often blocks camera access. Open Gift Track in Chrome or Safari instead, or use the button below to try your device's camera app directly."
              : status === "unsupported"
              ? "Your browser doesn't support in-page camera access. Use the button below to try your device's camera app directly."
              : "Gift Track was denied access to your camera. Check your browser's site settings and allow camera access, then try again — or use the button below to try your device's camera app directly."}
          </p>
          {errorDetail && <p className="camera-view__error-code stamp">{errorDetail}</p>}
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => fileInputRef.current?.click()}
          >
            Open camera app
          </button>
        </div>
      )}

      <button
        type="button"
        role="switch"
        aria-checked={settings.ocrEnabled}
        className={`camera-view__ocr-pill ${settings.ocrEnabled ? "camera-view__ocr-pill--on" : ""}`}
        onClick={() => setOcrEnabled(!settings.ocrEnabled)}
      >
        <span className="camera-view__ocr-pill-dot" />
        Text scan {settings.ocrEnabled ? "on" : "off"}
      </button>

      <div className="camera-view__controls">
        <button type="button" className="camera-view__close" onClick={onClose} aria-label="Cancel">
          <IconClose />
        </button>
        {status === "ready" && (
          <button
            type="button"
            className="camera-view__shutter"
            onClick={handleShutter}
            aria-label="Take photo"
          />
        )}
      </div>
    </div>
  );
}
