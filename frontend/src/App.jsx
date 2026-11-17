import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { parseQrCode } from "./utils/qr";
import { isConfidentlyInside } from "./utils/geofence";
import { trackAnalytics } from "./api/analytics";
import { useGeoNarration } from "./hooks/useGeoNarration";
const QrScanner=lazy(()=>import("./components/QrScanner"));
import AudioPlayerCard from "./components/AudioPlayerCard";
import ExploreLanding from "./components/ExploreLanding";
const InteractiveMap=lazy(()=>import("./components/InteractiveMap"));
const ChatbotPanel=lazy(()=>import("./components/ChatbotPanel"));
import {
    getAllPois,
    getAudio,
    getCurrentUser,
    getLocalization,
    getPoiByQrCode,
    logout,
} from "./api/api";
import {
    getGoogleMapsDirectionsUrl,
    getPoiDisplayName,
} from "./utils/googleMaps";
import "./App.css";

const LANGUAGES = [
    { code: "vi", name: "🇻🇳 VN", speechCode: "vi-VN" },
    { code: "en", name: "🇬🇧 EN", speechCode: "en-US" },
    { code: "zh", name: "🇨🇳 ZH", speechCode: "zh-CN" },
    { code: "ko", name: "🇰🇷 KO", speechCode: "ko-KR" },
    { code: "ja", name: "🇯🇵 JA", speechCode: "ja-JP" },
];

const VIEW_TEXT = {
    vi: { explore: "Khám phá", map: "Bản đồ", assistant: "Trợ lý AI", admin: "Quản trị" },
    en: { explore: "Explore", map: "Map", assistant: "AI Assistant", admin: "Admin" },
    zh: { explore: "探索", map: "地图", assistant: "AI 助手", admin: "管理" },
    ko: { explore: "탐색", map: "지도", assistant: "AI 도우미", admin: "관리" },
    ja: { explore: "探索", map: "地図", assistant: "AIアシスタント", admin: "管理" },
};

function distanceBetweenMeters(lat1, lon1, lat2, lon2) {
    const toRadians = (degrees) => (degrees * Math.PI) / 180;
    const earthRadiusMeters = 6371000;
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRadians(lat1)) *
        Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) ** 2;
    const safeA = Math.min(1, Math.max(0, a));
    return earthRadiusMeters * 2 * Math.atan2(Math.sqrt(safeA), Math.sqrt(1 - safeA));
}

function hasValidCoordinates(latitude, longitude) {
    if (
        latitude === null || latitude === undefined ||
        longitude === null || longitude === undefined ||
        latitude === "" || longitude === ""
    ) return false;

    const lat = Number(latitude);
    const lon = Number(longitude);
    return Number.isFinite(lat) && Number.isFinite(lon) &&
        lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
}

function getGeolocationErrorMessage(error) {
    if (error?.code === 1) {
        return "Bạn chưa cho phép truy cập vị trí. Hãy cấp quyền Location cho trình duyệt rồi thử lại.";
    }
    if (error?.code === 2) {
        return "Không xác định được vị trí hiện tại. Hãy bật GPS hoặc kiểm tra kết nối thiết bị.";
    }
    if (error?.code === 3) {
        return "Lấy vị trí quá thời gian chờ. Hãy thử lại ở nơi có tín hiệu GPS tốt hơn.";
    }
    return error?.message || "Không thể xác định địa điểm gần bạn. Hãy thử quét mã QR.";
}

// Gets a good one-time position for the existing "Tìm quanh tôi" action.
function getBestCurrentPosition({ targetAccuracyMeters = 30, waitMs = 12000, timeoutMs = 18000 } = {}) {
    return new Promise((resolve, reject) => {
        let watchId = null;
        let timerId = null;
        let bestPosition = null;
        let settled = false;

        const finish = (callback, value) => {
            if (settled) return;
            settled = true;
            if (watchId !== null) navigator.geolocation.clearWatch(watchId);
            if (timerId !== null) window.clearTimeout(timerId);
            callback(value);
        };

        try {
            watchId = navigator.geolocation.watchPosition(
                (position) => {
                    const currentAccuracy = Number(position.coords.accuracy);
                    const bestAccuracy = bestPosition
                        ? Number(bestPosition.coords.accuracy)
                        : Number.POSITIVE_INFINITY;
                    if (!bestPosition || (Number.isFinite(currentAccuracy) && currentAccuracy < bestAccuracy)) {
                        bestPosition = position;
                    }
                    if (Number.isFinite(currentAccuracy) && currentAccuracy > 0 && currentAccuracy <= targetAccuracyMeters) {
                        finish(resolve, position);
                    }
                },
                (error) => bestPosition ? finish(resolve, bestPosition) : finish(reject, error),
                { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 0 }
            );
            timerId = window.setTimeout(() => {
                if (bestPosition) finish(resolve, bestPosition);
                else finish(reject, {
                    code: 3,
                    message: "Chưa nhận được vị trí GPS. Hãy thử lại hoặc quét mã QR.",
                });
            }, waitMs);
        } catch (error) {
            finish(reject, error);
        }
    });
}

function App() {
    // Tourist content is public. Only an ADMIN token unlocks management.
    const [authenticated, setAuthenticated] = useState(() =>
        Boolean(localStorage.getItem("accessToken")) &&
        String(localStorage.getItem("userRole") || "").toUpperCase() === "ADMIN"
    );
    const [user, setUser] = useState(() => {
        const isStoredAdmin = Boolean(localStorage.getItem("accessToken")) &&
            String(localStorage.getItem("userRole") || "").toUpperCase() === "ADMIN";
        const email = isStoredAdmin ? localStorage.getItem("userEmail") : null;
        return email ? { email, role: "ADMIN" } : null;
    });
    const [role, setRole] = useState(() => {
        const isStoredAdmin = Boolean(localStorage.getItem("accessToken")) &&
            String(localStorage.getItem("userRole") || "").toUpperCase() === "ADMIN";
        return isStoredAdmin ? "ADMIN" : "GUEST";
    });
    const [activeView, setActiveView] = useState(() =>
        window.location.pathname.toLowerCase().startsWith("/admin") ? "admin" : "explore"
    );
    const [pois, setPois] = useState([]);
    const [catalogueLoading,setCatalogueLoading]=useState(true);
    const [catalogueError,setCatalogueError]=useState("");
    const [language, setLanguage] = useState("vi");
    const [poi, setPoi] = useState(null);
    const [localization, setLocalization] = useState(null);
    const [audio, setAudio] = useState(null);
    const [narrationSource, setNarrationSource] = useState("direct");
    // Requests AudioPlayerCard to try playing a real audio file after a POI is loaded.
    const [autoPlayAudioRequested, setAutoPlayAudioRequested] = useState(false);
    const [loading, setLoading] = useState(false);
    const [gpsLoading, setGpsLoading] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [gpsPosition, setGpsPosition] = useState(null);
    const [nearestGpsResult, setNearestGpsResult] = useState(null);

    const loadingRef = useRef(loading);
    const languageRef = useRef(language);
    const entryTrackedRef = useRef(false);
    const initialQrHandled = useRef(false);
    useEffect(() => { loadingRef.current = loading; }, [loading]);
    useEffect(() => { languageRef.current = language; document.documentElement.lang = language; }, [language]);

    const selectedLanguage = LANGUAGES.find((item) => item.code === language) || LANGUAGES[0];
    const isAdmin = authenticated && String(role || "").toUpperCase() === "ADMIN";
    const viewText = VIEW_TEXT[language] || VIEW_TEXT.vi;

    const refreshPois = useCallback(async () => {
        setCatalogueLoading(true);setCatalogueError("");
        try {const rows=await getAllPois();const safeRows=Array.isArray(rows)?rows:[];setPois(safeRows);return safeRows;}
        catch {setCatalogueError("Không tải được danh sách địa điểm. Hãy thử lại.");return [];}
        finally {setCatalogueLoading(false);}
    }, []);

    // Count one initial page load per mounted app, without requiring a visitor login.
    useEffect(() => {
        if (entryTrackedRef.current) return;
        entryTrackedRef.current = true;

        const params = new URLSearchParams(window.location.search);
        const pathname = window.location.pathname;
        const pathMatch = pathname.match(/^\/poi\/([^/]+)\/?$/i);
        const queryCode = params.get("qr");
        const hasSpecificPoiCode = Boolean(pathMatch || queryCode);
        const sourceParam = String(params.get("source") || "").trim().toLowerCase();
        const isQrGateEntry = sourceParam === "qr" && !hasSpecificPoiCode;
        const isQrEntry = sourceParam === "qr" || hasSpecificPoiCode;
        const source = params.get("source") || (isQrEntry ? "qr" : "direct");

        void trackAnalytics("page_view", { source });
        // Gate QR has no specific POI code. Specific POI QR opens are tracked only after lookup succeeds.
        if (isQrGateEntry) void trackAnalytics("qr_open", { source: "qr_landing_verified", pagePath: `${pathname}${window.location.search}` });
    }, []);

    // Revalidate a saved ADMIN token after refresh.
    useEffect(() => {
        if (!authenticated) return undefined;
        let cancelled = false;
        getCurrentUser()
            .then((currentUser) => {
                if (cancelled) return;
                if (String(currentUser?.role || "").toUpperCase() !== "ADMIN") {
                    logout();
                    setAuthenticated(false);
                    setUser(null);
                    setRole("GUEST");
                    return;
                }
                setUser(currentUser);
                setRole("ADMIN");
            })
            .catch(() => {
                if (cancelled) return;
                logout();
                setAuthenticated(false);
                setUser(null);
                setRole("GUEST");
            });
        return () => { cancelled = true; };
    }, [authenticated]);

    useEffect(() => {
        const timer = window.setTimeout(() => void refreshPois(), 0);
        return () => window.clearTimeout(timer);
    }, [refreshPois]);

    const speechText = [
        getPoiDisplayName(poi, language, localization?.localizedName),
        localization?.localizedDescription || poi?.description,
    ].filter(Boolean).join(". ");

    // Shared speech function for auto narration, map selections and the manual play button.
    const speakNarrationText = useCallback((text, languageCode, poiId = null, source = "direct") => {
        if (!("speechSynthesis" in window)) {
            setError("Trình duyệt không hỗ trợ đọc văn bản. Hãy thử Microsoft Edge hoặc Google Chrome.");
            return false;
        }
        if (!String(text || "").trim()) {
            setError("Địa điểm chưa có nội dung thuyết minh.");
            return false;
        }

        const lang = LANGUAGES.find((item) => item.code === languageCode) || LANGUAGES[0];
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang.speechCode;
        utterance.rate = 1;
        utterance.pitch = 1;

        const voices = window.speechSynthesis.getVoices();
        const voice = voices.find((item) => item.lang.toLowerCase() === lang.speechCode.toLowerCase())
            || voices.find((item) => item.lang.toLowerCase().startsWith(lang.code.toLowerCase()));
        if (voice) utterance.voice = voice;

        utterance.onstart = () => {
            setIsSpeaking(true);
            setError("");
            setSuccess("Đang phát thuyết minh.");
            if (poiId !== null && poiId !== undefined) {
                void trackAnalytics("audio_play", { poiId: Number(poiId), source });
            }
        };
        utterance.onend = () => {
            setIsSpeaking(false);
            setSuccess("Đã đọc xong nội dung thuyết minh.");
        };
        utterance.onerror = (event) => {
            setIsSpeaking(false);
            if (event.error !== "canceled" && event.error !== "interrupted") {
                setError("Không thể phát thuyết minh tự động. Hãy chạm nút Nghe thuyết minh để cho phép phát.");
            }
        };

        window.speechSynthesis.speak(utterance);
        return true;
    }, []);
const handleStopSpeaking = useCallback(() => {
        if ("speechSynthesis" in window) window.speechSynthesis.cancel();
        setIsSpeaking(false);
    }, []);

    const handleLogout = useCallback(() => {
        handleStopSpeaking();
        logout();
        setAuthenticated(false);
        setUser(null);
        setRole("GUEST");
        setActiveView("explore");
        setPoi(null);
        setLocalization(null);
        setAudio(null);
        setAutoPlayAudioRequested(false);
        setGpsPosition(null);
        setNearestGpsResult(null);
        setSuccess("");
        setError("");
    }, [handleStopSpeaking]);

    const handleSpeak = useCallback(() => {
        const source = ["test", "browser-test"].includes(narrationSource) ? narrationSource : "manual";
        speakNarrationText(speechText, language, poi?.id, source);
    }, [speakNarrationText, speechText, language, poi?.id, narrationSource]);

    const handleAudioAutoplayHandled = useCallback(() => {
        setAutoPlayAudioRequested(false);
    }, []);

    useEffect(() => () => {
        if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    }, []);

    // Load a POI by QR code; optionally start narration after its localized text is ready.
    const handleScanSuccess = useCallback(async (qrCode, { source = "qr", autoSpeak = false } = {}) => {
        if(loadingRef.current)return false;
        const parsedCode=parseQrCode(qrCode);
        if(!parsedCode){setError("Mã QR không hợp lệ. Hãy quét mã địa điểm khác.");return false;}

        loadingRef.current = true;
        setLoading(true);
        setError("");
        setSuccess("");
        setLocalization(null);
        setAudio(null);
        setAutoPlayAudioRequested(false);
        handleStopSpeaking();

        try {
            const poiData = await getPoiByQrCode(parsedCode);
            setPoi(poiData);
            setNarrationSource(String(source).trim().toLowerCase());
            const resolvedPoiPath = `/poi/${encodeURIComponent(poiData.qrCode || poiData.id)}`;
            if (String(source).toLowerCase() === "qr") {
                void trackAnalytics("qr_open", {
                    poiId: Number(poiData.id),
                    source: "qr_poi_verified",
                    pagePath: resolvedPoiPath,
                });
            }
            void trackAnalytics("poi_view", {
                poiId: Number(poiData.id),
                source,
                pagePath: resolvedPoiPath,
            });

            const [localizationResult, audioResult] = await Promise.allSettled([
                getLocalization(poiData.id, languageRef.current),
                getAudio(poiData.id, languageRef.current),
            ]);

            let resolvedLocalization = null;
            if (localizationResult.status === "rejected") {
                setError("Không tìm thấy bản dịch cho địa điểm này. Hệ thống sẽ thử đọc mô tả gốc nếu có.");
            } else {
                resolvedLocalization = localizationResult.value;
                setLocalization(resolvedLocalization);
            }

            let resolvedAudio = null;
            if (audioResult.status === "fulfilled") {
                resolvedAudio = audioResult.value;
                setAudio(resolvedAudio);
            } else {
                setAudio(null);
                console.warn("Chưa tải được dữ liệu audio:", audioResult.reason);
            }

            setSuccess(`Đã nhận diện địa điểm: ${getPoiDisplayName(poiData, languageRef.current, resolvedLocalization?.localizedName)}`);

            if (autoSpeak) {
                const activeLanguage = languageRef.current;
                const narration = [
                    getPoiDisplayName(poiData, activeLanguage, resolvedLocalization?.localizedName),
                    resolvedLocalization?.localizedDescription || poiData?.description,
                ].filter(Boolean).join(". ");
                const audioUrl = typeof resolvedAudio?.audioUrl === "string"
                    ? resolvedAudio.audioUrl.trim()
                    : "";
                const hasPlayableAudio = Boolean(
                    audioUrl &&
                    !/example\.com/i.test(audioUrl) &&
                    (/^https?:\/\/\S+$/i.test(audioUrl) ||
                        /^\/audio\/[A-Za-z0-9_-]+\.mp3(?:[?#].*)?$/i.test(audioUrl))
                );

                if (hasPlayableAudio) {
                    // The audio player makes the actual play() attempt and reports if
                    // browser autoplay policy requires a manual Play click.
                    setAutoPlayAudioRequested(true);
                } else {
                    // No real recording for this POI/language: fall back to browser TTS.
                    speakNarrationText(narration, activeLanguage, poiData.id, source);
                }
            }
            return true;
        } catch (err) {
            console.error("Không tải được POI:", err);
            if (err.response?.status === 401) {
                setError("Không thể truy cập dữ liệu thuyết minh. Hãy tải lại trang hoặc thử lại sau.");
            } else if (err.response?.status === 404) {
                setError("Không tìm thấy địa điểm trong hệ thống.");
            } else {
                setError("Không thể kết nối đến máy chủ. Hãy kiểm tra lại.");
            }
            setPoi(null);
            setLocalization(null);
            setAudio(null);
            return false;
        } finally {
            loadingRef.current = false;
            setLoading(false);
        }
    }, [handleStopSpeaking, speakNarrationText]);

    const handleOpenPoi = useCallback((selectedPoi, source = "map") => {
        if (!selectedPoi?.qrCode) return;
        setActiveView("explore");
        setNearestGpsResult(null);
        return handleScanSuccess(selectedPoi.qrCode, { source, autoSpeak: true });
    }, [handleScanSuccess]);

    // Geofence callback: called when the live GPS watcher detects entry into a POI radius.
    const handleGpsEnterPoi = useCallback((selectedPoi) => {
        if (!selectedPoi?.qrCode) return;
        setActiveView("explore");
        setNearestGpsResult(null);
        return handleScanSuccess(selectedPoi.qrCode, { source: "gps", autoSpeak: true });
    }, [handleScanSuccess]);

    const handleGpsPositionUpdate = useCallback((position) => {
        setGpsPosition({ latitude: position.latitude, longitude: position.longitude, accuracy: position.accuracy });
    }, []);

    const { status: geoGuideStatus, retry: retryGeoGuide, stop:stopGeoGuide, enabled:geoGuideEnabled } = useGeoNarration({
        pois,
        onEnterPoi: handleGpsEnterPoi,
        onPosition: handleGpsPositionUpdate,
    });

    const handleFindNearestPoi = useCallback(async () => {
        if (!navigator.geolocation) {
            setError("Trình duyệt không hỗ trợ GPS. Hãy thử Microsoft Edge hoặc Google Chrome.");
            return;
        }
        if (loadingRef.current) return;

        loadingRef.current = true;
        setLoading(true);
        setGpsLoading(true);
        setError("");
        setSuccess("");
        setPoi(null);
        setLocalization(null);
        setAudio(null);
        setNearestGpsResult(null);
        handleStopSpeaking();

        try {
            const position = await getBestCurrentPosition({ targetAccuracyMeters: 30, waitMs: 12000, timeoutMs: 18000 });
            const { latitude, longitude, accuracy } = position.coords;
            setGpsPosition({ latitude, longitude, accuracy });

            const allPois = await getAllPois();
            setPois(Array.isArray(allPois) ? allPois : []);
            const candidates = (Array.isArray(allPois) ? allPois : []).filter((item) =>
                item && String(item.status || "").toUpperCase() === "ACTIVE" &&
                hasValidCoordinates(item.latitude, item.longitude) && Number(item.radius) > 0
            );
            if (!candidates.length) throw new Error("Không có địa điểm ACTIVE với tọa độ và bán kính hợp lệ.");

            const ranked = candidates.map((item) => ({
                poi: item,
                distanceMeters: distanceBetweenMeters(latitude, longitude, Number(item.latitude), Number(item.longitude)),
                radiusMeters: Math.max(0, Number(item.radius) || 0),
            })).sort((a, b) => a.distanceMeters - b.distanceMeters);

            const nearest = ranked[0];
            const distance = Math.round(nearest.distanceMeters);
            const radius = Math.round(nearest.radiusMeters);
            const rawAccuracy = Number(accuracy);
            const hasAccuracy = Number.isFinite(rawAccuracy) && rawAccuracy > 0;
            const accuracyMeters = hasAccuracy ? Math.round(rawAccuracy) : null;
            const confidentlyInside = isConfidentlyInside(nearest.distanceMeters,rawAccuracy,nearest.radiusMeters);
            const uncertaintyOverlapsRadius = hasAccuracy
                ? nearest.distanceMeters - rawAccuracy <= nearest.radiusMeters
                : nearest.distanceMeters <= nearest.radiusMeters;
            const resultStatus = confidentlyInside ? "inside" : uncertaintyOverlapsRadius ? "uncertain" : "outside";

            setNearestGpsResult({
                poi: nearest.poi,
                distanceMeters: nearest.distanceMeters,
                radiusMeters: nearest.radiusMeters,
                accuracyMeters: hasAccuracy ? rawAccuracy : null,
                status: resultStatus,
            });

            if (confidentlyInside) {
                loadingRef.current = false;
                setLoading(false);
                setGpsLoading(false);
                await handleScanSuccess(nearest.poi.qrCode, { source: "gps", autoSpeak: true });
                setSuccess(`GPS xác nhận bạn đang trong bán kính của ${getPoiDisplayName(nearest.poi, languageRef.current)} (khoảng ${distance} m, sai số ±${accuracyMeters} m).`);
                return;
            }
            if (uncertaintyOverlapsRadius) {
                setSuccess(`Bạn có thể đang gần ${getPoiDisplayName(nearest.poi, languageRef.current)} (khoảng ${distance} m), nhưng GPS chưa đủ chính xác${hasAccuracy ? ` (sai số ±${accuracyMeters} m)` : ""} để xác nhận bán kính ${radius} m. Hãy thử GPS lại ở nơi thoáng hơn hoặc quét mã QR.`);
                return;
            }
            setSuccess(`Đã xác định vị trí GPS${hasAccuracy ? ` (sai số ước tính ±${accuracyMeters} m)` : " (chưa xác định được sai số GPS)"}. Địa điểm gần nhất là ${getPoiDisplayName(nearest.poi, languageRef.current)}, cách khoảng ${distance} m; bán kính nhận diện là ${radius} m. Bạn có thể xem đường đi trên Google Maps hoặc chờ tự thuyết minh khi vào vùng.`);
        } catch (err) {
            console.error("GPS locate error:", err);
            setError(err?.code ? getGeolocationErrorMessage(err) : err?.message || "Không thể tìm địa điểm gần bạn. Hãy thử quét mã QR.");
        } finally {
            loadingRef.current = false;
            setLoading(false);
            setGpsLoading(false);
        }
    }, [handleScanSuccess, handleStopSpeaking]);

    const handleMapOpenPoi = useCallback((selectedPoi) => handleOpenPoi(selectedPoi, "map"), [handleOpenPoi]);

    const handleLanguageChange = useCallback(async (event) => {
        if(loadingRef.current)return;
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
        setAutoPlayAudioRequested(false);
        try {
            const [localizationResult, audioResult] = await Promise.allSettled([
                getLocalization(poi.id, newLanguage),
                getAudio(poi.id, newLanguage),
            ]);
            if (localizationResult.status === "rejected") {
                setError("Chưa có bản dịch cho ngôn ngữ này.");
            } else {
                setLocalization(localizationResult.value);
            }
            if (audioResult.status === "fulfilled") setAudio(audioResult.value);
            else {
                setAudio(null);
                console.warn("Chưa tải được dữ liệu audio:", audioResult.reason);
            }
            const languageName = LANGUAGES.find((item) => item.code === newLanguage)?.name || newLanguage;
            setSuccess(`Đã chuyển sang ngôn ngữ: ${languageName}. Nhấn Nghe thuyết minh để đọc lại bằng ngôn ngữ mới.`);
        } catch (err) {
            console.error(err);
            setError(err.response?.status === 401
                ? "Không thể truy cập dữ liệu thuyết minh. Hãy tải lại trang hoặc thử lại sau."
                : "Có lỗi xảy ra khi tải dữ liệu ngôn ngữ mới.");
            setLocalization(null);
            setAudio(null);
            return false;
        } finally {
            loadingRef.current = false;
            setLoading(false);
        }
    }, [poi, handleStopSpeaking]);

    const handleClosePlayer = useCallback(() => {
        handleStopSpeaking();
        setPoi(null);
        setLocalization(null);
        setAudio(null);
        setAutoPlayAudioRequested(false);
        setError("");
        setSuccess("Bạn có thể tiếp tục khám phá địa điểm khác.");
    }, [handleStopSpeaking]);

    const handleQrScan = useCallback((qrCode) => {
        setActiveView("explore");
        setNearestGpsResult(null);
        return handleScanSuccess(qrCode, { source: "qr", autoSpeak: true });
    }, [handleScanSuccess]);

    // Handle direct entry URLs /poi/<qrCode> or ?qr=<qrCode>. The gate QR uses ?source=qr
    // and intentionally leaves visitors on the map/explore landing while GPS tracking starts.
    useEffect(() => {
        if (initialQrHandled.current) return;
        const pathMatch = window.location.pathname.match(/^\/poi\/([^/]+)\/?$/i);
        const queryCode = new URLSearchParams(window.location.search).get("qr");
        const encodedCode = pathMatch?.[1] || queryCode;
        if (!encodedCode) return;

        const timer = window.setTimeout(() => {
            initialQrHandled.current = true;
            const qrCode = window.location.href;
            setActiveView("explore");
            setNearestGpsResult(null);
            void handleScanSuccess(qrCode, { source: "qr", autoSpeak: true });
        }, 0);
        return () => window.clearTimeout(timer);
    }, [handleScanSuccess]);

    return (
        <div className="mobile-app-container">
            <header className="app-header">
                <div className="header-info">
                    <h2>
                        <span className="brand-mark" aria-hidden="true">
                            <svg viewBox="0 0 32 30" role="presentation">
                                <path d="M3 11 16 3 29 11H3Z" />
                                <path d="M6 12h20M8 13v11m5-11v11m6-11v11m5-11v11M5 25h22M3 28h26" />
                                <path d="M13 25v-7q3-4 6 0v7" />
                            </svg>
                        </span>
                        <span>HoiAnGuide</span>
                    </h2>
                    <p>Khám phá di sản · Kết nối văn hóa</p>
                </div>
                <div className="header-actions">
                    <a href="/admin" className="admin-page-link" title={isAdmin ? `Đã đăng nhập quản trị: ${user?.fullName || user?.email || "ADMIN"}` : "Mở trang quản trị"}>Quản trị ↗</a>
                    <select value={language} onChange={handleLanguageChange} disabled={loading} className="lang-select-mini" title="Chọn ngôn ngữ thuyết minh">
                        {LANGUAGES.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}
                    </select>
                    {isAdmin && <button type="button" className="logout-btn-mini" onClick={handleLogout} title="Đăng xuất quản trị">Đăng xuất</button>}
                </div>
            </header>

            <nav className="app-view-nav" aria-label="Điều hướng HoiAnGuide">
                <button type="button" className={activeView === "explore" ? "active" : ""} aria-current={activeView === "explore" ? "page" : undefined} onClick={() => setActiveView("explore")}>
                    <span className="nav-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5" /><path d="m15.8 8.2-2.7 5.4-5.4 2.7 2.7-5.4 5.4-2.7Z" /></svg></span><span>{viewText.explore}</span>
                </button>
                <button type="button" className={activeView === "map" ? "active" : ""} aria-current={activeView === "map" ? "page" : undefined} onClick={() => setActiveView("map")}>
                    <span className="nav-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m3 6 5-3 8 3 5-3v15l-5 3-8-3-5 3V6Z" /><path d="M8 3v15m8-12v15" /></svg></span><span>{viewText.map}</span>
                </button>
                <button type="button" className={activeView === "assistant" ? "active" : ""} aria-current={activeView === "assistant" ? "page" : undefined} onClick={() => setActiveView("assistant")}>
                    <span className="nav-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5 8 8 0 0 1-3.7-.9L4 20l1.7-4.1A7.5 7.5 0 1 1 20 11.5Z" /><path d="M8.5 11.5h.01m3.5 0h.01m3.5 0h.01" /></svg></span><span>{viewText.assistant}</span>
                </button>

            </nav>

            <main className="app-main"><Suspense fallback={<p role="status">Đang tải…</p>}>
                <section className="geo-guide-status" aria-live="polite">
                    <div><strong>🧭 Thuyết minh tự động:</strong> {geoGuideStatus}</div>
                    <button type="button" onClick={geoGuideEnabled?stopGeoGuide:retryGeoGuide}>{geoGuideEnabled?"Tắt GPS tự động":"Bật lại GPS"}</button>
                </section>


                {error && <div className="message error" role="alert">{error}</div>}
                {success && <div className="message success" role="status">{success}</div>}
                {loading && <div className="loading" role="status">{gpsLoading ? "Đang xác định vị trí và tìm địa điểm gần bạn..." : "Đang tải thông tin Hội An..."}</div>}



                <div key={activeView} className={`view-transition view-${activeView}`}>
                {activeView === "map" && <InteractiveMap pois={pois} language={language} gpsPosition={gpsPosition} onOpenPoi={handleMapOpenPoi} />}

                {activeView === "assistant" && <ChatbotPanel pois={pois} language={language} currentPoi={poi} onShowMap={() => setActiveView("map")} onOpenPoi={(selectedPoi) => handleOpenPoi(selectedPoi, "assistant")} />}



                {activeView === "explore" && (!poi && !loading ? (
                    <>
                        {catalogueLoading && <p role="status">Đang tải danh sách địa điểm…</p>}
                        {catalogueError && <div role="alert">{catalogueError}<button type="button" onClick={refreshPois}>Thử tải lại danh sách</button></div>}
                        {!catalogueLoading && !catalogueError && !pois.length && <p>Chưa có địa điểm đang hoạt động.</p>}
                        <ExploreLanding
                            pois={pois}
                            language={language}
                            onOpenPoi={(selectedPoi) => handleOpenPoi(selectedPoi, "explore")}
                            onFindNearest={handleFindNearestPoi}
                            onShowMap={() => setActiveView("map")}
                        />
                        <section id="explore-tools" className="card scanner-card">
                            <div className="scanner-gps-column"><div className="scanner-header">
                                <h3>📍 Kết quả định vị GPS</h3>
                                <p>Nhấn “Tìm quanh tôi” ở banner phía trên để xác định vị trí. Theo dõi tự động sẽ kích hoạt thuyết minh khi vào bán kính POI.</p>
                            </div>
                            {nearestGpsResult && <div className="nearest-result-card">
                                <h4>📍 Địa điểm gần nhất: {getPoiDisplayName(nearestGpsResult.poi, language)}</h4>
                                <p>Khoảng cách ước tính: {Math.round(nearestGpsResult.distanceMeters).toLocaleString("vi-VN")} m</p>
                                <p>Bán kính nhận diện: {Math.round(nearestGpsResult.radiusMeters)} m{nearestGpsResult.accuracyMeters !== null && ` · Sai số GPS ước tính ±${Math.round(nearestGpsResult.accuracyMeters)} m`}</p>
                                {nearestGpsResult.status === "inside" ? <p>GPS đã xác nhận vị trí nằm trong bán kính địa điểm.</p>
                                    : nearestGpsResult.status === "uncertain" ? <p>Vị trí có thể nằm gần địa điểm, nhưng sai số GPS chưa đủ để xác nhận.</p>
                                        : <p>Bạn chưa ở trong bán kính nhận diện; vẫn có thể mở đường đi trên Google Maps.</p>}
                                <a href={getGoogleMapsDirectionsUrl(nearestGpsResult.poi, gpsPosition)} target="_blank" rel="noopener noreferrer" className="map-directions-button">🗺️ Chỉ đường đến địa điểm trên Google Maps</a>
                            </div>}
                            </div><div className="scanner-qr-column"><div className="scanner-header">
                                <h3>📷 Quét mã QR địa điểm</h3>
                                <p>QR ở cổng chỉ cần dùng để mở website. Bạn có thể quét QR riêng của địa điểm nếu có.</p>
                            </div>
                            <QrScanner onScanSuccess={handleQrScan} /></div>
                            {import.meta.env.DEV && <div className="dev-qr-tools">
                                <h4>🔧 Kiểm thử nhanh địa điểm</h4>
                                <div className="dev-qr-list">{pois.filter((item) => item.status === "ACTIVE").map((item) => <button key={item.id} type="button" onClick={() => handleScanSuccess(item.qrCode, { source: "browser-test", autoSpeak: true })}>POI {item.id}</button>)}</div>
                            </div>}
                        </section>
                    </>
                ) : poi && !loading ? (
                    <div className="poi-player-layout">
                        <AudioPlayerCard poi={poi} localization={localization} audio={audio} selectedLanguage={selectedLanguage} onSpeak={handleSpeak} onStopSpeaking={handleStopSpeaking} isSpeaking={isSpeaking} onClose={handleClosePlayer} autoPlayRequested={autoPlayAudioRequested} onAutoPlayHandled={handleAudioAutoplayHandled} analyticsSource={["test", "browser-test"].includes(narrationSource) ? narrationSource : "audio_file"} />
                        <a href={getGoogleMapsDirectionsUrl(poi, gpsPosition)} target="_blank" rel="noopener noreferrer" className="map-directions-button">🗺️ Chỉ đường trên Google Maps</a>
                    </div>
                ) : null)}
                </div>
            </Suspense></main>
            <footer className="app-footer"><strong>HoiAnGuide</strong><span>Hội An · Việt Nam &nbsp; / &nbsp; VI · EN · 中文 · 한국어 · 日本語</span></footer>
        </div>
    );
}

export default App;
