import { HashRouter, Routes, Route } from "react-router-dom";
import { SettingsProvider } from "./hooks/useSettings";
import { ToastProvider } from "./hooks/useToast";
import RunningGifts from "./components/RunningGifts";
import "./App.css";
import HomeScreen from "./screens/HomeScreen";
import ListScreen from "./screens/ListScreen";

export default function App() {
  return (
    <SettingsProvider>
      <ToastProvider>
        <RunningGifts />
        <HashRouter>
          <Routes>
            <Route path="/" element={<HomeScreen />} />
            <Route path="/list/:id" element={<ListScreen />} />
          </Routes>
        </HashRouter>
      </ToastProvider>
    </SettingsProvider>
  );
}
