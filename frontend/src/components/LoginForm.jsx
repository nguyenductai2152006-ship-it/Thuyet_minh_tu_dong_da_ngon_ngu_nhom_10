import { useState } from "react";
import { login, logout } from "../api/api";

function LoginForm({ onLoginSuccess, onCancel }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleSubmit(event) {
        event.preventDefault();

        setError("");
        setLoading(true);

        try {
            const data = await login(email.trim(), password);
            if (String(data?.role || "").toUpperCase() !== "ADMIN") {
                // Do not retain a normal USER token after an admin-portal attempt.
                logout();
                setError("Tài khoản này không có quyền ADMIN. Khách tham quan không cần đăng nhập.");
                return;
            }
            onLoginSuccess(data);
        } catch (err) {
            console.error(err);

            if (err.response?.status === 401) {
                setError("Email hoặc mật khẩu không đúng.");
            } else {
                setError("Không thể kết nối tới Identity Service.");
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="login-container">
            <h1>HoiAnGuide</h1>
            <p className="login-subtitle">Đăng nhập quản trị</p>
            <p className="login-description">Khách tham quan có thể sử dụng chức năng thuyết minh mà không cần tài khoản. Chỉ quản trị viên mới cần đăng nhập tại đây.</p>

            <form onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="admin-email">Email quản trị</label>
                    <input
                        id="admin-email"
                        type="email"
                        autoComplete="username"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        required
                    />
                </div>

                <div>
                    <label htmlFor="admin-password">Mật khẩu</label>
                    <input
                        id="admin-password"
                        type="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        required
                    />
                </div>

                {error && <p className="login-error" role="alert">{error}</p>}

                <button type="submit" disabled={loading}>
                    {loading ? "Đang xác thực..." : "Đăng nhập quản trị"}
                </button>
                {onCancel && (
                    <button type="button" className="login-cancel-button" onClick={onCancel}>
                        Quay lại trang tham quan
                    </button>
                )}
            </form>
        </div>
    );
}

export default LoginForm;
