import { StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import RootPage from "./RootPage";
import "./index.css";

createRoot(document.getElementById("root")).render(
    <StrictMode><Suspense fallback={<p>Đang tải ứng dụng…</p>}><RootPage /></Suspense></StrictMode>
);
