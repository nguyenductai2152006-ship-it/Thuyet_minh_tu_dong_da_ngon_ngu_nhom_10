import { useState } from "react";
import { login } from "../api/api";

function LoginForm({ onLoginSuccess }) {
    const [email, setEmail] = useState("poitest@example.com");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleSubmit(event) {
        event.preventDefault();

        setError("");
        setLoading(true);

        try {
            const data = await login(email, password);
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
            <p>Đăng nhập để sử dụng hệ thống thuyết minh.</p>

            <form onSubmit={handleSubmit}>
                <div>
                    <label>Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        required
                    />
                </div>

                <div>
                    <label>Mật khẩu</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        required
                    />
                </div>

                {error && <p>{error}</p>}

                <button type="submit" disabled={loading}>
                    {loading ? "Đang đăng nhập..." : "Đăng nhập"}
                </button>
            </form>
        </div>
    );
}

export default LoginForm;