import { useSettings } from "../hooks/useSettings";
import { IconClose } from "./icons";
import "./SettingsSheet.css";

interface SettingsSheetProps {
  onClose: () => void;
}

export default function SettingsSheet({ onClose }: SettingsSheetProps) {
  const { settings, setOcrEnabled, setTheme } = useSettings();

  return (
    <div className="settings-sheet__backdrop" onClick={onClose}>
      <div className="settings-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="settings-sheet__header">
          <h2>Settings</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <IconClose />
          </button>
        </div>

        <div className="settings-sheet__row">
          <div>
            <div className="settings-sheet__row-title">On-device text detection</div>
            <div className="settings-sheet__row-body">
              Reads visible text in each photo to suggest a caption. Runs fully on your
              device via Tesseract.js — nothing leaves your phone.
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={settings.ocrEnabled}
            className={`toggle ${settings.ocrEnabled ? "toggle--on" : ""}`}
            onClick={() => setOcrEnabled(!settings.ocrEnabled)}
          >
            <span className="toggle__knob" />
          </button>
        </div>

        <div className="settings-sheet__row settings-sheet__row--column">
          <div className="settings-sheet__row-title">Appearance</div>
          <div className="settings-sheet__theme-options">
            {(["system", "light", "dark"] as const).map((option) => (
              <button
                key={option}
                type="button"
                className={`settings-sheet__theme-btn ${
                  settings.theme === option ? "settings-sheet__theme-btn--active" : ""
                }`}
                onClick={() => setTheme(option)}
              >
                {option === "system" ? "System" : option === "light" ? "Light" : "Dark"}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
