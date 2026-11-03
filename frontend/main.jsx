import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import AdminPage from "./pages/AdminPage.jsx";
import "./index.css";

const normalizedPath = window.location.pathname.replace(/\/+$/, "") || "/";
const isAdminPage = normalizedPath === "/admin";

createRoot(document.getElementById("root")).render(
    <StrictMode>{isAdminPage ? <AdminPage /> : <App />}</StrictMode>
);
