import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { getSettings, updateSettings } from "../db";
import type { AppSettings } from "../types";

interface SettingsContextValue {
  settings: AppSettings;
  loading: boolean;
  setOcrEnabled: (enabled: boolean) => Promise<void>;
  setTheme: (theme: AppSettings["theme"]) => Promise<void>;
}

const defaultSettings: AppSettings = { key: "app", ocrEnabled: true, theme: "system" };

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSettings().then((s) => {
      setSettings(s);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const apply = (theme: AppSettings["theme"]) => {
      if (theme === "system") {
        root.removeAttribute("data-theme");
      } else {
        root.setAttribute("data-theme", theme);
      }
    };
    apply(settings.theme);
  }, [settings.theme]);

  const setOcrEnabled = useCallback(async (enabled: boolean) => {
    const next = await updateSettings({ ocrEnabled: enabled });
    setSettings(next);
  }, []);

  const setTheme = useCallback(async (theme: AppSettings["theme"]) => {
    const next = await updateSettings({ theme });
    setSettings(next);
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, loading, setOcrEnabled, setTheme }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
