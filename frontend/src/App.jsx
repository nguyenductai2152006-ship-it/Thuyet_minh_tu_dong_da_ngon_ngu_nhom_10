import { useCallback, useEffect, useRef, useState } from "react";
import {
    getAudio,
    getLocalization,
    getPoiByQrCode,
    logout,
} from "./api/api";
import LoginForm from "./components/LoginForm";
import QrScanner from "./components/QrScanner";
import AudioPlayerCard from "./components/AudioPlayerCard";
import "./App.css";

const LANGUAGES = [
    { code: "vi", name: "🇻🇳 VN", speechCode: "vi-VN" },
    { code: "en", name: "🇬🇧 EN", speechCode: "en-US" },
    { code: "zh", name: "🇨🇳 ZH", speechCode: "zh-CN" },
    { code: "ko", name: "🇰🇷 KO", speechCode: "ko-KR" },
    { code: "ja", name: "🇯🇵 JA", speechCode: "ja-JP" },
];

function App() {
    const [authenticated, setAuthenticated] = useState(
        Boolean(localStorage.getItem("accessToken"))
    );
    const [user, setUser] = useState(() => {
        const email = localStorage.getItem("userEmail");
        return email ? { email } : null;
    });
    const [language, setLanguage] = useState("vi");

    const [poi, setPoi] = useState(null);
    const [localization, setLocalization] = useState(null);
    const [audio, setAudio] = useState(null);

    const [loading, setLoading] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const loadingRef = useRef(loading);
    const languageRef = useRef(language);
    loadingRef.current = loading;
    languageRef.current = language;

    const selectedLanguage =
        LANGUAGES.find((item) => item.code === language) || LANGUAGES[0];

    const speechText = [
        localization?.localizedName || poi?.name,
        localization?.localizedDescription || poi?.description,
    ]
        .filter(Boolean)
        .join(". ");

    const handleLoginSuccess = useCallback((data) => {
        setAuthenticated(true);
        setUser(data);
        setError("");
        setSuccess("Đăng nhập thành công.");
    }, []);

    const handleStopSpeaking = useCallback(() => {
        if ("speechSynthesis" in window) {
            window.speechSynthesis.cancel();
        }
        setIsSpeaking(false);
    }, []);

    const handleLogout = useCallback(() => {
        handleStopSpeaking();
        logout();
        setAuthenticated(false);
        setUser(null);
        setPoi(null);
        setLocalization(null);
        setAudio(null);
        setSuccess("");
        setError("");
    }, [handleStopSpeaking]);

    const handleSpeak = useCallback(() => {
        if (!("speechSynthesis" in window)) {
            setError(
                "Trình duyệt không hỗ trợ đọc văn bản. Hãy thử Microsoft Edge hoặc Google Chrome."
            );
            return;
        }

        if (!speechText.trim()) {
            setError("Chưa có nội dung để thuyết minh.");
            return;
        }

        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(speechText);
        utterance.lang = selectedLanguage.speechCode;
        utterance.rate = 1;
        utterance.pitch = 1;

        const voices = window.speechSynthesis.getVoices();
        const languagePrefix = language.toLowerCase();
        const matchingVoice =
            voices.find(
                (voice) =>
                    voice.lang.toLowerCase() ===
                    selectedLanguage.speechCode.toLowerCase()
            ) ||
            voices.find((voice) =>
                voice.lang.toLowerCase().startsWith(languagePrefix)
            );

        if (matchingVoice) {
            utterance.voice = matchingVoice;
        }

        utterance.onstart = () => {
            setIsSpeaking(true);
            setError("");
            setSuccess("Đang phát thuyết minh bằng giọng trình duyệt.");
        };

        utterance.onend = () => {
            setIsSpeaking(false);
            setSuccess("Đã đọc xong nội dung thuyết minh.");
        };

        utterance.onerror = (event) => {
            setIsSpeaking(false);
            if (event.error !== "canceled" && event.error !== "interrupted") {
                setError(
                    "Không thể đọc thuyết minh. Hãy kiểm tra giọng đọc của trình duyệt."
                );
            }
        };

        setError("");
        window.speechSynthesis.speak(utterance);
    }, [speechText, selectedLanguage, language]);

    useEffect(() => {
        return () => {
            if ("speechSynthesis" in window) {
                window.speechSynthesis.cancel();
            }
        };
    }, []);

    const handleScanSuccess = useCallback(
        async (qrCode) => {
            if (!qrCode || loadingRef.current) return;

            loadingRef.current = true;
            setLoading(true);
            setError("");
            setSuccess("");
            setLocalization(null);
            setAudio(null);
            handleStopSpeaking();

            try {
                const poiData = await getPoiByQrCode(qrCode.trim());
                setPoi(poiData);

                const [localizationResult, audioResult] =
                    await Promise.allSettled([
                        getLocalization(poiData.id, languageRef.current),
                        getAudio(poiData.id, languageRef.current),
                    ]);

                if (localizationResult.status === "rejected") {
                    setError("Không tìm thấy bản dịch cho địa điểm này.");
                } else {
                    setLocalization(localizationResult.value);
                }

                if (audioResult.status === "fulfilled") {
                    setAudio(audioResult.value);
                } else {
                    setAudio(null);
                    console.warn(
                        "Chưa tải được dữ liệu audio:",
                        audioResult.reason
                    );
                }

                setSuccess(`Đã nhận diện địa điểm: ${poiData.name}`);
            } catch (err) {
                console.error(err);
                if (err.response?.status === 401) {
                    setError(
                        "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."
                    );
                } else if (err.response?.status === 404) {
                    setError(
                        "Không tìm thấy địa điểm trong hệ thống."
                    );
                } else {
                    setError(
                        "Không thể kết nối đến máy chủ. Hãy kiểm tra lại."
                    );
                }
                setPoi(null);
                setLocalization(null);
                setAudio(null);
            } finally {
                loadingRef.current = false;
                setLoading(false);
            }
        },
        [handleStopSpeaking]
    );

    const handleLanguageChange = useCallback(
        async (event) => {
            const newLanguage = event.target.value;
            languageRef.current = newLanguage;
            setLanguage(newLanguage);
            setError("");
            setSuccess("");
            handleStopSpeaking();

            if (!poi) return;

            setLoading(true);
            loadingRef.current = true;
            setLocalization(null);
            setAudio(null);

            try {
                const [localizationResult, audioResult] =
                    await Promise.allSettled([
                        getLocalization(poi.id, newLanguage),
                        getAudio(poi.id, newLanguage),
                    ]);

                if (localizationResult.status === "rejected") {
                    setError("Chưa có bản dịch cho ngôn ngữ này.");
                } else {
                    setLocalization(localizationResult.value);
                }

                if (audioResult.status === "fulfilled") {
                    setAudio(audioResult.value);
                } else {
                    setAudio(null);
                    console.warn(
                        "Chưa tải được dữ liệu audio:",
                        audioResult.reason
                    );
                }

                const languageName =
                    LANGUAGES.find((item) => item.code === newLanguage)?.name ||
                    newLanguage;
                setSuccess(`Đã chuyển sang ngôn ngữ: ${languageName}.`);
            } catch (err) {
                console.error(err);
                if (err.response?.status === 401) {
                    setError(
                        "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."
                    );
                } else {
                    setError(
                        "Có lỗi xảy ra khi tải dữ liệu ngôn ngữ mới."
                    );
                }
                setLocalization(null);
                setAudio(null);
            } finally {
                loadingRef.current = false;
                setLoading(false);
            }
        },
        [poi, handleStopSpeaking]
    );

    const handleClosePlayer = useCallback(() => {
        handleStopSpeaking();
        setPoi(null);
        setLocalization(null);
        setAudio(null);
        setError("");
        setSuccess("Bạn có thể quét địa điểm tiếp theo.");
    }, [handleStopSpeaking]);

    if (!authenticated) {
        return (
            <div className="mobile-app-container">
                <LoginForm onLoginSuccess={handleLoginSuccess} />
            </div>
        );
    }

    return (
        <div className="mobile-app-container">
            {/* HEADER MỚI (TÍCH HỢP CHỌN NGÔN NGỮ) */}
            <header className="app-header">
                <div className="header-info">
                    <h2>HoiAnGuide</h2>
                    <p>Khám phá di sản</p>
                </div>
                <div className="header-actions">
                    <select
                        value={language}
                        onChange={handleLanguageChange}
                        disabled={loading}
                        className="lang-select-mini"
                        title="Chọn ngôn ngữ thuyết minh"
                    >
                        {LANGUAGES.map((item) => (
                            <option key={item.code} value={item.code}>
                                {item.name}
                            </option>
                        ))}
                    </select>
                    <button
                        type="button"
                        className="logout-btn-mini"
                        onClick={handleLogout}
                        title="Đăng xuất khỏi hệ thống"
                    >
                        ✖
                    </button>
                </div>
            </header>

            {/* NỘI DUNG CHÍNH */}
            <main className="app-main">
                <p className="welcome-text">Xin chào, {user?.email || "Du khách"}!</p>

                {error && (
                    <div className="message error" role="alert">
                        {error}
                    </div>
                )}
                {success && (
                    <div className="message success" role="status">
                        {success}
                    </div>
                )}
                {loading && (
                    <div className="loading" role="status">
                        Đang kết nối cơ sở dữ liệu...
                    </div>
                )}

                {/* KHU VỰC QUÉT MÃ QR HOẶC THẺ THUYẾT MINH */}
                {!poi && !loading ? (
                    <section className="card scanner-card">
                        <div className="scanner-header">
                            <h3>📷 Quét mã QR</h3>
                            <p>Đưa mã QR của địa điểm vào khung camera bên dưới.</p>
                        </div>
                        <QrScanner onScanSuccess={handleScanSuccess} />

                        {/* BỘ NÚT DEV GIẢ LẬP QUÉT QR */}
                        <div style={{ marginTop: '30px', padding: '15px', background: '#f8fafc', borderRadius: '10px', border: '1px dashed #cbd5e1' }}>
                            <h4 style={{ margin: '0 0 10px 0', color: '#64748b', fontSize: '13px' }}>🔧 Dev Tools: Giả lập QR ID</h4>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                {[3, 4, 5, 6, 7, 8, 9].map(id => (
                                    <button
                                        key={id}
                                        style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', background: 'white', cursor: 'pointer'}}
                                        onClick={() => handleScanSuccess(id.toString())}
                                    >
                                        POI {id}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </section>
                ) : (
                    poi && !loading && (
                        <AudioPlayerCard
                            poi={poi}
                            localization={localization}
                            audio={audio}
                            selectedLanguage={selectedLanguage}
                            onSpeak={handleSpeak}
                            onStopSpeaking={handleStopSpeaking}
                            isSpeaking={isSpeaking}
                            onClose={handleClosePlayer}
                        />
                    )
                )}
            </main>
        </div>
    );
}

export default App;