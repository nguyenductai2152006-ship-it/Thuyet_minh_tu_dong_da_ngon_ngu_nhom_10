import { useCallback, useEffect, useState } from "react";
import AdminDashboard from "../components/AdminDashboard";
import { getCurrentUser, login, logout } from "../api/api";
import "./AdminPage.css";

function errorText(error) {
    return error?.response?.data?.message
        || error?.response?.data?.error
        || error?.message
        || "Không thể đăng nhập hoặc xác minh quyền quản trị.";
}

export default function AdminPage() {
    const [authState, setAuthState] = useState(() =>
        localStorage.getItem("accessToken") ? "checking" : "login"
    );
    const [user, setUser] = useState(null);
    const [email, setEmail] = useState(localStorage.getItem("userEmail") || "");
    const [password, setPassword] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    const verifyAdmin = useCallback(async () => {
        const currentUser = await getCurrentUser();
        if (String(currentUser?.role || "").toUpperCase() !== "ADMIN") {
            logout();
            throw new Error("Tài khoản này không có quyền ADMIN.");
        }
        return currentUser;
    }, []);

    useEffect(() => {
        let cancelled = false;
        if (!localStorage.getItem("accessToken")) return undefined;
        verifyAdmin()
            .then((currentUser) => {
                if (cancelled) return;
                setUser(currentUser);
                setAuthState("ready");
            })
            .catch((reason) => {
                if (cancelled) return;
                logout();
                setError(errorText(reason));
                setAuthState("login");
            });
        return () => { cancelled = true; };
    }, [verifyAdmin]);

    useEffect(() => {
        const expired = () => {
            logout();
            setUser(null);
            setAuthState("login");
            setError("Phiên đăng nhập hết hạn. Hãy đăng nhập lại.");
        };
        window.addEventListener("hoianguide:unauthorized", expired);
        return () => window.removeEventListener("hoianguide:unauthorized", expired);
    }, []);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setBusy(true);
        setError("");
        try {
            const result = await login(email.trim(), password);
            if (String(result?.role || "").toUpperCase() !== "ADMIN") {
                logout();
                throw new Error("Tài khoản này không có quyền ADMIN.");
            }
            const currentUser = await verifyAdmin();
            setUser(currentUser);
            setPassword("");
            setAuthState("ready");
        } catch (reason) {
            logout();
            setError(errorText(reason));
            setAuthState("login");
        } finally {
            setBusy(false);
        }
    };

    const handleLogout = () => {
        logout();
        setUser(null);
        setPassword("");
        setError("");
        setAuthState("login");
    };

    if (authState === "checking") {
        return <main className="hag-admin-page"><div className="hag-admin-page__loading">Đang xác minh quyền quản trị…</div></main>;
    }

    if (authState !== "ready") {
        return (
            <main className="hag-admin-page hag-admin-page--login">
                <header className="hag-admin-page__topbar">
                    <a className="hag-admin-page__brand" href="/" aria-label="Quay lại HoiAnGuide">
                        <span className="hag-admin-page__brand-mark">H</span>
                        <span><strong>HoiAnGuide</strong><small>ADMIN CONSOLE</small></span>
                    </a>
                    <a className="hag-admin-page__back" href="/">← Về trang tham quan</a>
                </header>
                <section className="hag-admin-login-card">
                    <p className="hag-admin-page__eyebrow">KHU VỰC QUẢN TRỊ RIÊNG</p>
                    <h1>Đăng nhập quản trị</h1>
                    <p>Quản lý địa điểm, nội dung đa ngôn ngữ, âm thanh và dữ liệu truy cập HoiAnGuide.</p>
                    {error && <div className="hag-admin-page__error" role="alert">{error}</div>}
                    <form onSubmit={handleSubmit} className="hag-admin-login-form">
                        <label>Email quản trị
                            <input type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} />
                        </label>
                        <label>Mật khẩu
                            <input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} />
                        </label>
                        <button type="submit" disabled={busy}>{busy ? "Đang xác minh…" : "Đăng nhập vào Admin"}</button>
                    </form>
                    <p className="hag-admin-page__security">Trang này xác minh quyền ADMIN bằng API backend. Không chỉ dựa vào trạng thái giao diện để phân quyền.</p>
                </section>
                <footer className="hag-admin-page__footer">HoiAnGuide · Khám phá di sản, kết nối văn hóa</footer>
            </main>
        );
    }

    return (
        <main className="hag-admin-page">
            <header className="hag-admin-page__topbar">
                <a className="hag-admin-page__brand" href="/" aria-label="Quay lại HoiAnGuide">
                    <span className="hag-admin-page__brand-mark">H</span>
                    <span><strong>HoiAnGuide</strong><small>ADMIN CONSOLE</small></span>
                </a>
                <div className="hag-admin-page__account">
                    <span className="hag-admin-page__account-name">{user?.fullName || user?.email || email || "Quản trị viên"} <b>ADMIN</b></span>
                    <a className="hag-admin-page__back" href="/">← Trang tham quan</a>
                    <button type="button" onClick={handleLogout}>Đăng xuất</button>
                </div>
            </header>
            <section className="hag-admin-page__content">
                <AdminDashboard />
            </section>
            <footer className="hag-admin-page__footer">HoiAnGuide · Trang quản trị độc lập · Số liệu được truy xuất từ backend</footer>
        </main>
    );
}
