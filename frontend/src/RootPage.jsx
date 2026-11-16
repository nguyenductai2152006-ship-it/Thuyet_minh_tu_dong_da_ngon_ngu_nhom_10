import { lazy } from "react";

const App = lazy(() => import("./App.jsx"));
const AdminPage = lazy(() => import("./pages/AdminPage.jsx"));

export default function RootPage() {
    const path = window.location.pathname.replace(/\/+$/, "") || "/";
    return path === "/admin" ? <AdminPage /> : <App />;
}
