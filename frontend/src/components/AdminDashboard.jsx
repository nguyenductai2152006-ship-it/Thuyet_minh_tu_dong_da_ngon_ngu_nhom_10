import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import api, {
    getAdminPois,
    createPoi,
    updatePoi,
    deletePoi,
    getLocalizationsForPoi,
    createLocalization,
    updateLocalization,
    deleteLocalization,
    getAudiosForPoi,
    createAudio,
    updateAudio,
    deleteAudio,
} from "../api/api";
import "./AdminDashboard.css";
import Pagination from "./Pagination";
import { usePagination } from "../hooks/usePagination";
import { ACTIVE_SECONDS, errorMessage, isRecentlyActive, normalizeSearch, safeAssetUrl, validAudioUrl, validCoordinates } from "../utils/admin";

const LANGUAGES = [
    { value: "vi", label: "Tiếng Việt" },
    { value: "en", label: "English" },
    { value: "zh", label: "中文" },
    { value: "ko", label: "한국어" },
    { value: "ja", label: "日本語" },
];
const EMPTY_POI = { name: "", description: "", qrCode: "", latitude: "", longitude: "", radius: "80", category:"heritage", status: "ACTIVE", imageUrl: "" };
const EMPTY_LOCALIZATION = { poiId: "", languageCode: "vi", localizedName: "", localizedDescription: "" };
const EMPTY_AUDIO = { poiId: "", languageCode: "vi", audioUrl: "", durationSeconds: "" };

function rowsFrom(value, fallbackPoiId = null) {
    const source = value?.data ?? value;
    const list = Array.isArray(source)
        ? source
        : Array.isArray(source?.items)
            ? source.items
            : Array.isArray(source?.content)
                ? source.content
                : Array.isArray(source?.results)
                    ? source.results
                    : source && typeof source === "object" && (source.id != null || source.poiId != null)
                        ? [source]
                        : [];
    return list.map((row) => ({ ...row, poiId: row.poiId ?? fallbackPoiId }));
}

const messageFromError = errorMessage;

function displayDate(value) {
    if (!value) return "—";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString("vi-VN");
}

function extractListResponse(response, keys = []) {
    const body = response?.data ?? response;
    if (Array.isArray(body)) return body;
    for (const key of keys) {
        if (Array.isArray(body?.[key])) return body[key];
    }
    return [];
}

function StatCard({ label, value, detail, icon, tone = "blue" }) {
    return (
        <article className={`hag-stat hag-stat--${tone}`}>
            <span className="hag-stat__icon" aria-hidden="true">{icon}</span>
            <div className="hag-stat__content">
                <span className="hag-stat__label">{label}</span>
                <strong className="hag-stat__value">{value ?? "—"}</strong>
                {detail && <span className="hag-stat__detail">{detail}</span>}
            </div>
        </article>
    );
}

function Field({ label, children, hint }) {
    return (
        <label className="hag-field">
            <span className="hag-field__label">{label}</span>
            {children}
            {hint && <small className="hag-field__hint">{hint}</small>}
        </label>
    );
}

function DataNotice({ kind = "info", children }) {
    return <div className={`hag-notice hag-notice--${kind}`} role={kind === "error" ? "alert" : "status"}>{children}</div>;
}

export default function AdminDashboard({ onDataChanged }) {
    const [activeTab, setActiveTab] = useState("overview");
    const [pois, setPois] = useState([]);
    const [localizations, setLocalizations] = useState([]);
    const [audios, setAudios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [contentLoading, setContentLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [poiEditor, setPoiEditor] = useState(null);
    const [poiForm, setPoiForm] = useState(EMPTY_POI);
    const [localizationEditor, setLocalizationEditor] = useState(null);
    const [localizationForm, setLocalizationForm] = useState(EMPTY_LOCALIZATION);
    const [audioEditor, setAudioEditor] = useState(null);
    const [audioForm, setAudioForm] = useState(EMPTY_AUDIO);
    const [monitorLoading, setMonitorLoading] = useState(false);
    const [monitorUpdatedAt, setMonitorUpdatedAt] = useState(null);
    const [monitorSummary, setMonitorSummary] = useState(null);
    const [sessions, setSessions] = useState([]);
    const [devices, setDevices] = useState([]);
    const [sessionsApiState, setSessionsApiState] = useState("unknown");
    const [devicesApiState, setDevicesApiState] = useState("unknown");
    const [monitorError, setMonitorError] = useState("");
    const [contentError, setContentError] = useState("");
    const [topPois, setTopPois] = useState([]);
    const [clock, setClock] = useState(() => Date.now());
    const monitorFlight = useRef(false);
    const contentVersion = useRef(0);
    const mutationFlight = useRef(false);
    useEffect(() => {
        const timer = window.setInterval(() => setClock(Date.now()), 1000);
        return () => window.clearInterval(timer);
    }, []);

    const loadPois = useCallback(async ({ quiet = false } = {}) => {
        if (!quiet) setLoading(true);
        setError("");
        try {
            const result = await getAdminPois();
            const list = rowsFrom(result).sort((a, b) => Number(a.id) - Number(b.id));
            setPois(list);
            return list;
        } catch (loadError) {
            setError(`Không tải được danh sách địa điểm từ API: ${messageFromError(loadError)}`);
            throw loadError;
        } finally {
            if (!quiet) setLoading(false);
        }
    }, []);

    const loadContent = useCallback(async (poiList) => {
        const version = ++contentVersion.current;
        setContentError("");
        if (!poiList.length) {
            setContentLoading(false);
            setLocalizations([]);
            setAudios([]);
            return;
        }
        setContentLoading(true);
        try {
            const localizationResults = await Promise.allSettled(
                poiList.map(async (poi) => ({ poiId: poi.id, data: await getLocalizationsForPoi(poi.id) }))
            );
            const localizationRows = localizationResults.flatMap((result) => {
                if (result.status !== "fulfilled") return [];
                return rowsFrom(result.value.data, result.value.poiId);
            });
            if (version !== contentVersion.current) return;
            setLocalizations(localizationRows);

            const audioResults = await Promise.allSettled(
                poiList.map(async (poi) => ({ poiId: poi.id, data: await getAudiosForPoi(poi.id) }))
            );
            const audioRows = audioResults.flatMap((result) => {
                if (result.status !== "fulfilled") return [];
                return rowsFrom(result.value.data, result.value.poiId);
            });
            if (version !== contentVersion.current) return;
            setAudios(audioRows);
            const failures = [...localizationResults, ...audioResults].filter((item) => item.status === "rejected");
            if (failures.length) setContentError(`Có ${failures.length} yêu cầu nội dung thất bại. Số lượng bên dưới chưa đầy đủ. ${messageFromError(failures[0].reason)}`);
        } finally {
            if (version === contentVersion.current) setContentLoading(false);
        }
    }, []);

    const refreshAll = useCallback(async ({ quiet = false } = {}) => {
        const list = await loadPois({ quiet });
        await loadContent(list);
        return list;
    }, [loadContent, loadPois]);

    useEffect(() => {
        const timer = window.setTimeout(() => void refreshAll().catch(() => {}), 0);
        return () => window.clearTimeout(timer);
    }, [refreshAll]);

    const loadMonitoring = useCallback(async ({ quiet = false } = {}) => {
        if (monitorFlight.current) return;
        monitorFlight.current = true;
        if (!quiet) setMonitorLoading(true);
        try {
            const params = { activeWithinSeconds: ACTIVE_SECONDS, limit: 100 };
            const results = await Promise.allSettled([
                api.get("/api/analytics/admin/summary"),
                api.get("/api/analytics/admin/sessions", { params }),
                api.get("/api/analytics/admin/devices", { params }),
                api.get("/api/analytics/admin/pois/top", { params: { limit: 50 } }),
            ]);
            const [summary, session, device, top] = results;
            setMonitorSummary(summary.status === "fulfilled" ? summary.value.data : null);
            setSessions(session.status === "fulfilled" ? extractListResponse(session.value, ["sessions", "items", "content"]) : []);
            setDevices(device.status === "fulfilled" ? extractListResponse(device.value, ["devices", "items", "content"]) : []);
            setTopPois(top.status === "fulfilled" ? extractListResponse(top.value) : []);
            setSessionsApiState(session.status === "fulfilled" ? "ready" : session.reason?.response?.status === 404 ? "missing" : "error");
            setDevicesApiState(device.status === "fulfilled" ? "ready" : device.reason?.response?.status === 404 ? "missing" : "error");
            const names = ["thống kê", "phiên", "thiết bị", "top POI"];
            setMonitorError(results.flatMap((result, index) => result.status === "rejected" ? [`Không tải được ${names[index]}: ${messageFromError(result.reason)}`] : []).join(" · "));
            if (results.some((result) => result.status === "fulfilled")) setMonitorUpdatedAt(new Date());
        } finally {
            monitorFlight.current = false;
            setMonitorLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!["monitoring", "devices", "overview"].includes(activeTab)) return undefined;
        const refresh = () => { if (document.visibilityState === "visible") void loadMonitoring({ quiet: true }); };
        refresh();
        const timer = window.setInterval(refresh, 10000);
        document.addEventListener("visibilitychange", refresh);
        return () => { window.clearInterval(timer); document.removeEventListener("visibilitychange", refresh); };
    }, [activeTab, loadMonitoring]);

    const filteredPois = useMemo(() => {
        const query = normalizeSearch(search);
        return pois.filter((poi) => {
            const matchesQuery = !query || [poi.name, poi.description, poi.qrCode, poi.id]
                .some((value) => normalizeSearch(value).includes(query));
            const matchesStatus = statusFilter === "ALL" || String(poi.status ?? "").toUpperCase() === statusFilter;
            return matchesQuery && matchesStatus;
        });
    }, [pois, search, statusFilter]);

    const activePoisCount = pois.filter((poi) => String(poi.status ?? "").toUpperCase() === "ACTIVE").length;
    const missingCoordinateCount = pois.filter((poi) => !validCoordinates(poi.latitude, poi.longitude)).length;

    const poiPage = usePagination(filteredPois, `${search}:${statusFilter}`);
    const localizationPage = usePagination(localizations);
    const audioPage = usePagination(audios);
    const sessionPage = usePagination(sessions);
    const devicePage = usePagination(devices);
    const topPage = usePagination(topPois);
    const fetchedAt = monitorUpdatedAt?.getTime();
    const recent = (row) => isRecentlyActive(row, clock, fetchedAt);
    const activityBadge = (row) => <span className={`hag-status ${recent(row) ? "hag-status--active" : "hag-status--inactive"}`}><i />{recent(row) ? "Gần đây" : "Không hoạt động gần đây"}</span>;

    const runMutation = useCallback(async (action, successText, reload = "all") => {
        if (mutationFlight.current) return false;
        mutationFlight.current = true;
        setSaving(true);
        setError("");
        setSuccess("");
        let committed = false;
        try {
            await action();
            committed = true;
            // A success message is emitted only after the API mutation returns successfully.
            // Reloading from GET means the UI reflects server data rather than local optimistic state.
            if (reload === "pois") await loadPois({ quiet: true });
            else await refreshAll({ quiet: true });
            if (typeof onDataChanged === "function") await onDataChanged();
            setSuccess(successText);
            return true;
        } catch (mutationError) {
            setError(committed ? `Thay đổi đã được API chấp nhận nhưng tải lại dữ liệu thất bại. Hãy làm mới trước khi thao tác lại. ${messageFromError(mutationError)}` : !mutationError.response ? `Không xác nhận được kết quả do lỗi mạng. Hãy làm mới và kiểm tra dữ liệu trước khi thử lại. ${messageFromError(mutationError)}` : `Không thể lưu thay đổi: ${messageFromError(mutationError)}`);
            return false;
        } finally {
            mutationFlight.current = false;
            setSaving(false);
        }
    }, [loadPois, onDataChanged, refreshAll]);

    const openNewPoi = () => {
        setPoiEditor("create");
        setPoiForm({ ...EMPTY_POI });
        setError("");
        setSuccess("");
    };

    const openEditPoi = (poi) => {
        setPoiEditor("edit");
        setPoiForm({
            imageUrl: poi.imageUrl ?? "",
            category:poi.category??"heritage",
            name: poi.name ?? "",
            description: poi.description ?? "",
            qrCode: poi.qrCode ?? "",
            latitude: poi.latitude ?? "",
            longitude: poi.longitude ?? "",
            radius: poi.radius ?? 80,
            status: String(poi.status ?? "ACTIVE").toUpperCase(),
        });
        setLocalizationForm((current) => ({ ...current, poiId: String(poi.id) }));
        setAudioForm((current) => ({ ...current, poiId: String(poi.id) }));
        setPoiEditorId(poi.id);
        setError("");
        setSuccess("");
    };
    const [poiEditorId, setPoiEditorId] = useState(null);

    const savePoi = async (event) => {
        event.preventDefault();
        if (!validCoordinates(poiForm.latitude, poiForm.longitude)) return setError("Nhập tọa độ hợp lệ; không để trống vĩ độ/kinh độ.");
        if (!poiForm.description.trim()) return setError("Mô tả địa điểm là bắt buộc.");
        if (!poiForm.qrCode.trim()) return setError("Mã QR là bắt buộc.");
        if (poiForm.imageUrl.trim() && !safeAssetUrl(poiForm.imageUrl)) return setError("Ảnh phải là đường dẫn nội bộ /Images/... hoặc URL HTTP/HTTPS.");
        const latitude = Number(poiForm.latitude);
        const longitude = Number(poiForm.longitude);
        const radius = Number(poiForm.radius);
        if (!poiForm.name.trim()) return setError("Tên địa điểm không được để trống.");
        if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) return setError("Vĩ độ phải nằm trong khoảng -90 đến 90.");
        if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) return setError("Kinh độ phải nằm trong khoảng -180 đến 180.");
        if (!Number.isFinite(radius) || radius < 1 || radius > 5000) return setError("Bán kính GPS phải từ 1 đến 5000 mét.");
        const payload = {
            category:poiForm.category,
            name: poiForm.name.trim(),
            description: poiForm.description.trim(),
            qrCode: poiForm.qrCode.trim(),
            imageUrl: poiForm.imageUrl.trim() || null,
            latitude,
            longitude,
            radius,
            status: poiForm.status,
        };
        const succeeded = await runMutation(
            () => poiEditor === "edit" ? updatePoi(poiEditorId, payload) : createPoi(payload),
            poiEditor === "edit" ? "Đã cập nhật địa điểm và tải lại dữ liệu từ API." : "Đã tạo địa điểm và tải lại dữ liệu từ API.",
            "pois"
        );
        if (succeeded) setPoiEditor(null);
    };

    const removePoi = async (poi) => {
        if (!window.confirm(`Xóa địa điểm “${poi.name}” (ID ${poi.id})? Thao tác này sẽ gọi API DELETE và có thể ảnh hưởng nội dung liên quan.`)) return;
        await runMutation(() => deletePoi(poi.id), `Đã gửi yêu cầu xóa POI ${poi.id}; danh sách đã được tải lại.`, "pois");
    };

    const openNewLocalization = () => {
        setLocalizationEditor("create");
        setLocalizationForm({ ...EMPTY_LOCALIZATION, poiId: pois[0]?.id ? String(pois[0].id) : "" });
        setError("");
        setSuccess("");
    };
    const openEditLocalization = (row) => {
        setLocalizationEditor("edit");
        setLocalizationEditorId(row.id);
        setLocalizationForm({
            poiId: String(row.poiId ?? ""),
            languageCode: row.languageCode ?? row.lang ?? "vi",
            localizedName: row.localizedName ?? "",
            localizedDescription: row.localizedDescription ?? "",
        });
        setError("");
        setSuccess("");
    };
    const [localizationEditorId, setLocalizationEditorId] = useState(null);
    const saveLocalization = async (event) => {
        event.preventDefault();
        if (!localizationForm.poiId) return setError("Hãy chọn địa điểm cho nội dung dịch.");
        if (!localizationForm.localizedName.trim()) return setError("Tên địa điểm đã dịch không được để trống.");
        if (!localizationForm.localizedDescription.trim()) return setError("Mô tả đã dịch là bắt buộc.");
        const payload = {
            poiId: Number(localizationForm.poiId),
            languageCode: localizationForm.languageCode,
            localizedName: localizationForm.localizedName.trim(),
            localizedDescription: localizationForm.localizedDescription.trim(),
        };
        const succeeded = await runMutation(
            () => localizationEditor === "edit" ? updateLocalization(localizationEditorId, payload) : createLocalization(payload),
            localizationEditor === "edit" ? "Đã cập nhật nội dung đa ngôn ngữ." : "Đã tạo nội dung đa ngôn ngữ.",
            "all"
        );
        if (succeeded) setLocalizationEditor(null);
    };
    const removeLocalization = async (row) => {
        if (!window.confirm(`Xóa bản dịch ${row.languageCode ?? row.lang ?? "này"} của POI ${row.poiId}?`)) return;
        await runMutation(() => deleteLocalization(row.id), "Đã gửi yêu cầu xóa bản dịch; dữ liệu đã được tải lại.", "all");
    };

    const openNewAudio = () => {
        setAudioEditor("create");
        setAudioForm({ ...EMPTY_AUDIO, poiId: pois[0]?.id ? String(pois[0].id) : "" });
        setError("");
        setSuccess("");
    };
    const openEditAudio = (row) => {
        setAudioEditor("edit");
        setAudioEditorId(row.id);
        setAudioForm({
            poiId: String(row.poiId ?? ""),
            languageCode: row.languageCode ?? row.lang ?? "vi",
            audioUrl: row.audioUrl ?? "",
            durationSeconds: row.durationSeconds ?? "",
        });
        setError("");
        setSuccess("");
    };
    const [audioEditorId, setAudioEditorId] = useState(null);
    const saveAudio = async (event) => {
        event.preventDefault();
        if (!audioForm.poiId) return setError("Hãy chọn địa điểm cho audio.");
        if (!audioForm.audioUrl.trim()) return setError("URL audio không được để trống.");
        if (!validAudioUrl(audioForm.audioUrl)) return setError("Audio phải là /audio/ten-file.mp3 hoặc URL HTTP/HTTPS, tối đa 500 ký tự.");
        const duration = Number(audioForm.durationSeconds);
        if (String(audioForm.durationSeconds).trim() === "" || !Number.isInteger(duration) || duration < 0 || duration > 2147483647) return setError("Thời lượng là số nguyên từ 0 đến 2147483647 giây.");
        const payload = {
            poiId: Number(audioForm.poiId),
            languageCode: audioForm.languageCode,
            audioUrl: audioForm.audioUrl.trim(),
            durationSeconds: duration,
        };
        const succeeded = await runMutation(
            () => audioEditor === "edit" ? updateAudio(audioEditorId, payload) : createAudio(payload),
            audioEditor === "edit" ? "Đã cập nhật metadata audio." : "Đã tạo metadata audio.",
            "all"
        );
        if (succeeded) setAudioEditor(null);
    };
    const removeAudio = async (row) => {
        if (!window.confirm(`Xóa metadata audio ID ${row.id} của POI ${row.poiId}? File vật lý tại URL có thể không bị xóa.`)) return;
        await runMutation(() => deleteAudio(row.id), "Đã gửi yêu cầu xóa metadata audio; dữ liệu đã được tải lại.", "all");
    };
    const changeTab = (nextTab) => {
        if (saving) return;
        setActiveTab(nextTab);
        setPoiEditor(null);
        setLocalizationEditor(null);
        setAudioEditor(null);
        setError("");
        setSuccess("");
        if (nextTab === "pois") void loadPois({ quiet: true }).catch(() => {});
        if (nextTab === "localizations" || nextTab === "audio") void refreshAll({ quiet: true }).catch(() => {});

    };

    const stats = [
        { label: "Tổng địa điểm", value: pois.length, icon: "⌖", tone: "blue", detail: "POI từ API quản trị" },
        { label: "Đang hoạt động", value: activePoisCount, icon: "●", tone: "green", detail: "status = ACTIVE" },
        { label: "Bản dịch", value: localizations.length, icon: "文", tone: "violet", detail: "Metadata tải từ API localization" },
        { label: "Audio metadata", value: audios.length, icon: "♫", tone: "amber", detail: "URL audio không đồng nghĩa file đã phát được" },
    ];

    const tabs = [
        ["overview", "Tổng quan", "◫"],
        ["pois", "Địa điểm POI", "⌖"],
        ["localizations", "Đa ngôn ngữ", "文"],
        ["audio", "Âm thanh", "♫"],
        ["monitoring", "Giám sát truy cập", "⌁"],
        ["devices", "Thiết bị & phiên", "▤"],
    ];

    return (
        <section className="hag-admin" aria-label="Quản trị HoiAnGuide">
            <header className="hag-admin__header">
                <div className="hag-admin__brand">
                    <span className="hag-admin__brand-mark" aria-hidden="true">H</span>
                    <div>
                        <p className="hag-admin__eyebrow">HOIANGUIDE · ADMIN CONSOLE</p>
                        <h2>Trung tâm quản trị</h2>
                        <p>Quản lý điểm tham quan, nội dung thuyết minh và theo dõi hoạt động hệ thống.</p>
                    </div>
                </div>
                <div className="hag-admin__header-actions">
                    <span className="hag-admin__connection"><i /> API · dữ liệu trực tiếp</span>
                    <button type="button" className="hag-btn hag-btn--soft" onClick={() => void refreshAll().catch(() => {})} disabled={loading || saving}>
                        ↻ Làm mới dữ liệu
                    </button>
                </div>
            </header>

            <nav className="hag-tabs" aria-label="Các phân hệ quản trị">
                {tabs.map(([key, label, icon]) => (
                    <button key={key} type="button" className={`hag-tab${activeTab === key ? " is-active" : ""}`} disabled={saving} onClick={() => changeTab(key)} aria-current={activeTab === key ? "page" : undefined}>
                        <span aria-hidden="true">{icon}</span>{label}
                    </button>
                ))}
            </nav>

            {contentError && <DataNotice kind="warning">{contentError}</DataNotice>}
            {monitorError && ["overview", "devices"].includes(activeTab) && <DataNotice kind="warning">{monitorError}</DataNotice>}
            {(error || success) && (
                <div className={`hag-flash ${error ? "hag-flash--error" : "hag-flash--success"}`} role={error ? "alert" : "status"}>
                    <span>{error ? "!" : "✓"}</span><p>{error || success}</p>
                    <button type="button" aria-label="Đóng thông báo" onClick={() => { setError(""); setSuccess(""); }}>×</button>
                </div>
            )}

            {activeTab === "overview" && (
                <div className="hag-page">
                    <div className="hag-page__title-row">
                        <div><p className="hag-section-kicker">TỔNG QUAN HỆ THỐNG</p><h3>Trạng thái nội dung HoiAnGuide</h3><p>Số liệu nội dung được đọc từ backend; số liệu truy cập chỉ hiển thị khi API analytics phản hồi.</p></div>
                        <span className="hag-refresh-time">Cập nhật: {monitorUpdatedAt ? monitorUpdatedAt.toLocaleTimeString("vi-VN") : "chưa có"}</span>
                    </div>
                    <div className="hag-stat-grid">
                        {stats.map((stat) => <StatCard key={stat.label} {...stat} />)}
                    </div>
                    <div className="hag-overview-grid">
                        <article className="hag-card">
                            <div className="hag-card__heading"><div><p className="hag-section-kicker">CHẤT LƯỢNG DỮ LIỆU</p><h3>Kiểm tra nội dung</h3></div><span className="hag-card__heading-icon">✓</span></div>
                            <div className="hag-quality-list">
                                <div><span>Địa điểm thiếu/không có tọa độ hợp lệ</span><strong>{missingCoordinateCount}</strong></div>
                                <div><span>POI thiếu mã QR</span><strong>{pois.filter((poi) => !poi.qrCode).length}</strong></div>
                                <div><span>POI chưa hoạt động</span><strong>{pois.length - activePoisCount}</strong></div>
                            </div>
                            <p className="hag-muted">Kiểm tra chất lượng dữ liệu frontend dựa trên phản hồi API hiện có; không thay thế validation ở backend.</p>
                        </article>
                        <article className="hag-card">
                            <div className="hag-card__heading"><div><p className="hag-section-kicker">GIÁM SÁT</p><h3>Chỉ số truy cập</h3></div><span className="hag-card__heading-icon hag-card__heading-icon--blue">⌁</span></div>
                            {monitorSummary ? (
                                <div className="hag-mini-metrics">
                                    <div><span>Lượt xem trang</span><strong>{monitorSummary.pageViews ?? "—"}</strong></div>
                                    <div><span>QR trang chủ</span><strong>{monitorSummary.qrOpens ?? "—"}</strong></div>
                                    <div><span>Khách ước tính</span><strong>{monitorSummary.uniqueVisitors ?? "—"}</strong></div>
                                    <div><span>Phiên có page_view</span><strong>{monitorSummary.sessions ?? "—"}</strong></div>
                                </div>
                            ) : <DataNotice kind="warning">Chưa có dữ liệu summary từ API analytics. Kiểm tra đăng nhập ADMIN và endpoint backend.</DataNotice>}
                            <button type="button" className="hag-btn hag-btn--primary" onClick={() => changeTab("monitoring")}>Mở giám sát truy cập →</button>
                        </article>
                    </div>
                    {loading && <DataNotice>Đang tải dữ liệu từ API…</DataNotice>}
                    {!loading && pois.length === 0 && <DataNotice kind="warning">API chưa trả về địa điểm nào. Nếu database có dữ liệu, hãy kiểm tra API Gateway và quyền truy cập.</DataNotice>}
                </div>
            )}

            {activeTab === "pois" && (
                <div className="hag-page">
                    <div className="hag-page__title-row">
                        <div><p className="hag-section-kicker">NỘI DUNG BẢN ĐỒ</p><h3>Quản lý địa điểm (POI)</h3><p>Tạo, chỉnh sửa và xóa thông qua API. Sau mỗi thao tác, danh sách được tải lại từ máy chủ.</p></div>
                        <button type="button" className="hag-btn hag-btn--primary" disabled={saving} onClick={openNewPoi}>＋ Thêm địa điểm</button>
                    </div>
                    <div className="hag-toolbar">
                        <label className="hag-search"><span aria-hidden="true">⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm theo tên, ID hoặc mã QR…" /></label>
                        <select aria-label="Lọc trạng thái địa điểm" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="ALL">Tất cả trạng thái</option><option value="ACTIVE">Đang hoạt động</option><option value="INACTIVE">Ngừng hoạt động</option></select>
                        <span className="hag-result-count">{filteredPois.length} / {pois.length} địa điểm</span>
                    </div>
                    {poiEditor && (
                        <form className="hag-card hag-editor" onSubmit={savePoi}>
                            <div className="hag-card__heading"><div><p className="hag-section-kicker">{poiEditor === "edit" ? `CHỈNH SỬA POI #${poiEditorId}` : "POI MỚI"}</p><h3>{poiEditor === "edit" ? "Cập nhật địa điểm" : "Thêm địa điểm vào bản đồ"}</h3></div><button type="button" className="hag-icon-btn" aria-label="Đóng form" disabled={saving} onClick={() => setPoiEditor(null)}>×</button></div>
                            <fieldset className="hag-form-grid hag-form-fields" disabled={saving}>
                                <Field label="Danh mục"><select value={poiForm.category} onChange={e=>setPoiForm({...poiForm,category:e.target.value})}>{[["heritage","Di sản"],["history","Lịch sử"],["oldhouse","Nhà cổ"],["assembly","Hội quán"],["market","Chợ"]].map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></Field>
<Field label="Tên địa điểm *"><input required maxLength={200} value={poiForm.name} onChange={(event) => setPoiForm({ ...poiForm, name: event.target.value })} /></Field>
                                <Field label="Mã QR *"><input required maxLength={100} value={poiForm.qrCode} onChange={(event) => setPoiForm({ ...poiForm, qrCode: event.target.value })} placeholder="HOIANGUIDE_POI_10" /></Field>
                                <Field label="Vĩ độ (latitude) *"><input required type="number" min="-90" max="90" step="any" value={poiForm.latitude} onChange={(event) => setPoiForm({ ...poiForm, latitude: event.target.value })} placeholder="15.8770873" /></Field>
                                <Field label="Kinh độ (longitude) *"><input required type="number" min="-180" max="180" step="any" value={poiForm.longitude} onChange={(event) => setPoiForm({ ...poiForm, longitude: event.target.value })} placeholder="108.3260704" /></Field>
                                <Field label="Bán kính GPS (m) *"><input required type="number" min="1" max="5000" step="0.01" value={poiForm.radius} onChange={(event) => setPoiForm({ ...poiForm, radius: event.target.value })} /></Field>
                                <Field label="Trạng thái"><select value={poiForm.status} onChange={(event) => setPoiForm({ ...poiForm, status: event.target.value })}><option value="ACTIVE">ACTIVE — hiển thị công khai</option><option value="INACTIVE">INACTIVE — tạm ẩn</option></select></Field>
                                <div className="hag-form-span-2"><Field label="Ảnh địa điểm" hint="Đường dẫn /Images/... hoặc URL HTTP/HTTPS, tối đa 500 ký tự."><input maxLength={500} value={poiForm.imageUrl} onChange={(event) => setPoiForm({ ...poiForm, imageUrl: event.target.value })} /></Field></div>
                                <div className="hag-form-span-2"><Field label="Mô tả *"><textarea required rows="3" maxLength={5000} value={poiForm.description} onChange={(event) => setPoiForm({ ...poiForm, description: event.target.value })} placeholder="Giới thiệu ngắn về địa điểm…" /></Field></div>
                            </fieldset>
                            <div className="hag-form-actions"><button type="button" className="hag-btn hag-btn--soft" onClick={() => setPoiEditor(null)} disabled={saving}>Hủy</button><button type="submit" className="hag-btn hag-btn--primary" disabled={saving}>{saving ? "Đang lưu…" : "Lưu vào database"}</button></div>
                        </form>
                    )}
                    <div className="hag-card hag-table-card">
                        <div className="hag-table-wrap"><table className="hag-table"><thead><tr><th>ID</th><th>Địa điểm</th><th>Tọa độ</th><th>QR</th><th>Trạng thái</th><th className="hag-align-right">Thao tác</th></tr></thead><tbody>
                            {loading ? <tr><td colSpan="6" className="hag-empty-cell">Đang tải…</td></tr> : filteredPois.length === 0 ? <tr><td colSpan="6" className="hag-empty-cell">Không tìm thấy địa điểm. Nếu danh sách bất ngờ rỗng, kiểm tra phản hồi API.</td></tr> : poiPage.rows.map((poi) => (
                                <tr key={poi.id}><td className="hag-mono">#{poi.id}</td><td><strong>{poi.name || "Chưa đặt tên"}</strong><small className="hag-cell-subtitle">{poi.description || "Không có mô tả"}</small></td><td className="hag-mono">{Number.isFinite(Number(poi.latitude)) ? Number(poi.latitude).toFixed(6) : "—"}<br />{Number.isFinite(Number(poi.longitude)) ? Number(poi.longitude).toFixed(6) : "—"}</td><td><span className="hag-code-pill">{poi.qrCode || "Chưa có QR"}</span></td><td><span className={`hag-status ${String(poi.status).toUpperCase() === "ACTIVE" ? "hag-status--active" : "hag-status--inactive"}`}><i />{String(poi.status || "UNKNOWN").toUpperCase()}</span></td><td className="hag-align-right"><div className="hag-row-actions"><button type="button" className="hag-btn hag-btn--tiny" disabled={saving} onClick={() => openEditPoi(poi)}>Sửa</button><button type="button" className="hag-btn hag-btn--tiny hag-btn--danger" onClick={() => void removePoi(poi)} disabled={saving}>Xóa</button></div></td></tr>
                            ))}
                        </tbody></table></div>
                        <Pagination data={poiPage} label="địa điểm" disabled={loading || saving} />
                    </div>
                </div>
            )}

            {activeTab === "localizations" && (
                <div className="hag-page">
                    <div className="hag-page__title-row"><div><p className="hag-section-kicker">NỘI DUNG ĐA NGÔN NGỮ</p><h3>Quản lý bản dịch</h3><p>Mỗi bản dịch gắn với một POI và mã ngôn ngữ. Kiểm tra unique POI + language ở backend.</p></div><button type="button" className="hag-btn hag-btn--primary" disabled={saving} onClick={openNewLocalization}>＋ Thêm bản dịch</button></div>
                    {localizationEditor && <form className="hag-card hag-editor" onSubmit={saveLocalization}><div className="hag-card__heading"><div><p className="hag-section-kicker">{localizationEditor === "edit" ? `BẢN DỊCH #${localizationEditorId}` : "BẢN DỊCH MỚI"}</p><h3>{localizationEditor === "edit" ? "Chỉnh sửa bản dịch" : "Thêm nội dung ngôn ngữ"}</h3></div><button type="button" className="hag-icon-btn" aria-label="Đóng form" disabled={saving} onClick={() => setLocalizationEditor(null)}>×</button></div><fieldset className="hag-form-grid hag-form-fields" disabled={saving}><Field label="Địa điểm *"><select required disabled={localizationEditor === "edit"} value={localizationForm.poiId} onChange={(event) => setLocalizationForm({ ...localizationForm, poiId: event.target.value })}><option value="">Chọn POI</option>{pois.map((poi) => <option key={poi.id} value={poi.id}>#{poi.id} — {poi.name}</option>)}</select></Field><Field label="Ngôn ngữ *"><select value={localizationForm.languageCode} onChange={(event) => setLocalizationForm({ ...localizationForm, languageCode: event.target.value })}>{LANGUAGES.map((language) => <option key={language.value} value={language.value}>{language.label} ({language.value})</option>)}</select></Field><Field label="Tên đã dịch *"><input required maxLength={200} value={localizationForm.localizedName} onChange={(event) => setLocalizationForm({ ...localizationForm, localizedName: event.target.value })} /></Field><div className="hag-form-span-2"><Field label="Mô tả đã dịch *"><textarea required rows="4" maxLength={10000} value={localizationForm.localizedDescription} onChange={(event) => setLocalizationForm({ ...localizationForm, localizedDescription: event.target.value })} /></Field></div></fieldset><div className="hag-form-actions"><button type="button" className="hag-btn hag-btn--soft" onClick={() => setLocalizationEditor(null)} disabled={saving}>Hủy</button><button type="submit" className="hag-btn hag-btn--primary" disabled={saving}>{saving ? "Đang lưu…" : "Lưu bản dịch"}</button></div></form>}
                    <div className="hag-card hag-table-card"><div className="hag-table-wrap"><table className="hag-table"><thead><tr><th>ID</th><th>POI</th><th>Ngôn ngữ</th><th>Tên bản dịch</th><th>Mô tả</th><th className="hag-align-right">Thao tác</th></tr></thead><tbody>{contentLoading ? <tr><td colSpan="6" className="hag-empty-cell">Đang tải bản dịch…</td></tr> : localizations.length === 0 ? <tr><td colSpan="6" className="hag-empty-cell">Chưa có bản dịch trả về từ API hoặc endpoint chưa hỗ trợ danh sách bản dịch.</td></tr> : localizationPage.rows.map((row, index) => <tr key={row.id ?? `${row.poiId}-${row.languageCode}-${index}`}><td className="hag-mono">{row.id ?? "—"}</td><td>#{row.poiId} · {pois.find((poi) => Number(poi.id) === Number(row.poiId))?.name ?? "POI"}</td><td><span className="hag-code-pill">{row.languageCode ?? row.lang ?? "—"}</span></td><td><strong>{row.localizedName ?? "—"}</strong></td><td><span className="hag-table-description">{row.localizedDescription ?? "—"}</span></td><td className="hag-align-right"><div className="hag-row-actions"><button type="button" className="hag-btn hag-btn--tiny" onClick={() => openEditLocalization(row)} disabled={saving || row.id == null}>Sửa</button><button type="button" className="hag-btn hag-btn--tiny hag-btn--danger" onClick={() => void removeLocalization(row)} disabled={saving || row.id == null}>Xóa</button></div></td></tr>)}</tbody></table></div><Pagination data={localizationPage} label="bản dịch" disabled={contentLoading || saving} /></div>
                </div>
            )}

            {activeTab === "audio" && (
                <div className="hag-page">
                    <div className="hag-page__title-row"><div><p className="hag-section-kicker">THUYẾT MINH BẰNG ÂM THANH</p><h3>Quản lý metadata audio</h3><p>Quản lý URL và ngôn ngữ. Xóa metadata không đồng nghĩa xóa file âm thanh tại máy chủ lưu trữ.</p></div><button type="button" className="hag-btn hag-btn--primary" disabled={saving} onClick={openNewAudio}>＋ Thêm audio</button></div>
                    {audioEditor && <form className="hag-card hag-editor" onSubmit={saveAudio}><div className="hag-card__heading"><div><p className="hag-section-kicker">{audioEditor === "edit" ? `AUDIO #${audioEditorId}` : "AUDIO MỚI"}</p><h3>{audioEditor === "edit" ? "Chỉnh sửa metadata" : "Thêm liên kết âm thanh"}</h3></div><button type="button" className="hag-icon-btn" aria-label="Đóng form" disabled={saving} onClick={() => setAudioEditor(null)}>×</button></div><fieldset className="hag-form-grid hag-form-fields" disabled={saving}><Field label="Địa điểm *"><select required disabled={audioEditor === "edit"} value={audioForm.poiId} onChange={(event) => setAudioForm({ ...audioForm, poiId: event.target.value })}><option value="">Chọn POI</option>{pois.map((poi) => <option key={poi.id} value={poi.id}>#{poi.id} — {poi.name}</option>)}</select></Field><Field label="Ngôn ngữ *"><select value={audioForm.languageCode} onChange={(event) => setAudioForm({ ...audioForm, languageCode: event.target.value })}>{LANGUAGES.map((language) => <option key={language.value} value={language.value}>{language.label} ({language.value})</option>)}</select></Field><div className="hag-form-span-2"><Field label="URL audio *" hint="Đảm bảo URL truy cập được, CORS phù hợp và trình duyệt phát được định dạng audio."><input required type="text" maxLength={500} value={audioForm.audioUrl} onChange={(event) => setAudioForm({ ...audioForm, audioUrl: event.target.value })} placeholder="/audio/3-vi.mp3 hoặc https://.../guide.mp3" /></Field></div><Field label="Thời lượng (giây) *"><input required type="number" min="0" max="2147483647" step="1" value={audioForm.durationSeconds} onChange={(event) => setAudioForm({ ...audioForm, durationSeconds: event.target.value })} /></Field></fieldset><div className="hag-form-actions"><button type="button" className="hag-btn hag-btn--soft" onClick={() => setAudioEditor(null)} disabled={saving}>Hủy</button><button type="submit" className="hag-btn hag-btn--primary" disabled={saving}>{saving ? "Đang lưu…" : "Lưu metadata audio"}</button></div></form>}
                    <div className="hag-card hag-table-card"><div className="hag-table-wrap"><table className="hag-table"><thead><tr><th>ID</th><th>POI</th><th>Ngôn ngữ</th><th>URL audio</th><th>Thời lượng</th><th className="hag-align-right">Thao tác</th></tr></thead><tbody>{contentLoading ? <tr><td colSpan="6" className="hag-empty-cell">Đang tải metadata audio…</td></tr> : audios.length === 0 ? <tr><td colSpan="6" className="hag-empty-cell">Chưa có audio metadata trả về từ API hoặc endpoint chưa hỗ trợ danh sách.</td></tr> : audioPage.rows.map((row, index) => <tr key={row.id ?? `${row.poiId}-${row.languageCode}-${index}`}><td className="hag-mono">{row.id ?? "—"}</td><td>#{row.poiId} · {pois.find((poi) => Number(poi.id) === Number(row.poiId))?.name ?? "POI"}</td><td><span className="hag-code-pill">{row.languageCode ?? row.lang ?? "—"}</span></td><td><a className="hag-audio-link" href={safeAssetUrl(row.audioUrl) || undefined} target="_blank" rel="noopener noreferrer">{row.audioUrl ?? "—"}</a></td><td>{row.durationSeconds != null ? `${row.durationSeconds}s` : "—"}</td><td className="hag-align-right"><div className="hag-row-actions"><button type="button" className="hag-btn hag-btn--tiny" onClick={() => openEditAudio(row)} disabled={saving || row.id == null}>Sửa</button><button type="button" className="hag-btn hag-btn--tiny hag-btn--danger" onClick={() => void removeAudio(row)} disabled={saving || row.id == null}>Xóa</button></div></td></tr>)}</tbody></table></div><Pagination data={audioPage} label="audio" disabled={contentLoading || saving} /></div>
                </div>
            )}

            {activeTab === "monitoring" && (
                <div className="hag-page">
                    <div className="hag-page__title-row"><div><p className="hag-section-kicker">LIVE ACCESS MONITORING</p><h3>Giám sát truy cập thời gian thực</h3><p>Tự làm mới mỗi 10 giây khi tab hiển thị. Trạng thái gần đây xét 30 giây, không xác nhận kết nối trực tiếp.</p></div><button type="button" className="hag-btn hag-btn--soft" onClick={() => void loadMonitoring()} disabled={monitorLoading}>↻ {monitorLoading ? "Đang cập nhật…" : "Cập nhật ngay"}</button></div>
                    <div className="hag-stat-grid hag-stat-grid--monitor">
                        <StatCard label="Tổng lượt xem trang" value={monitorSummary?.pageViews ?? "—"} detail="COUNT(page_view) · toàn thời gian" icon="⌁" tone="blue" />
                        <StatCard label="Khách truy cập ước tính" value={monitorSummary?.uniqueVisitors ?? "—"} detail="visitor_id phân biệt trong sự kiện page_view" icon="♙" tone="green" />
                        <StatCard label="Phiên đang hoạt động" value={sessionsApiState === "ready" ? sessions.filter(recent).length : "—"} detail="Trong tối đa 100 phiên gần nhất, cửa sổ 30 giây" icon="▣" tone="violet" />
                        <StatCard label="Mở QR trang chủ" value={monitorSummary?.qrOpens ?? "—"} detail="Nguồn qr_landing_verified" icon="▦" tone="amber" />
                        <StatCard label="Mở QR địa điểm" value={monitorSummary?.qrPoiOpens ?? "—"} detail="Nguồn qr_poi_verified" icon="⌖" tone="blue" />
                        <StatCard label="Lượt bắt đầu nghe" value={monitorSummary?.audioPlays ?? "—"} detail="MP3 hoặc TTS phát thành công" icon="♫" tone="green" />
                    </div>
                    <p className="hag-muted">QR lịch sử chưa phân loại: {monitorSummary?.legacyQrOpens ?? "—"}. Các sự kiện qr_verified cũ được giữ nguyên, không tự gán lại thành QR trang chủ hoặc địa điểm.</p>
                    {monitorError && <DataNotice kind="warning">{monitorError}</DataNotice>}
                    {sessionsApiState === "missing" && <DataNotice kind="warning">Backend hiện không có endpoint <code>GET /api/analytics/admin/sessions</code> (404). Bảng bên dưới không dùng dữ liệu giả; muốn hiện phiên online thật cần bổ sung endpoint tổng hợp session từ sự kiện analytics.</DataNotice>}
                    {sessionsApiState === "error" && <DataNotice kind="error">Không thể tải danh sách phiên. Kiểm tra JWT ADMIN, API Gateway và log poi-service.</DataNotice>}
                    <article className="hag-card hag-table-card"><div className="hag-card__heading"><div><p className="hag-section-kicker">SESSION ACTIVITY</p><h3>Nhật ký người dùng gần đây</h3></div><span className="hag-live-badge"><i /> Polling 10s</span></div><div className="hag-table-wrap"><table className="hag-table"><thead><tr><th>Mã phiên</th><th>Trạng thái & địa điểm</th><th>Thiết bị</th><th>Hoạt động gần nhất</th><th>Cập nhật</th></tr></thead><tbody>{sessionsApiState !== "ready" ? <tr><td colSpan="5" className="hag-empty-cell">Chưa có endpoint phiên được xác nhận. Không hiển thị dữ liệu minh họa như dữ liệu thật.</td></tr> : sessions.length === 0 ? <tr><td colSpan="5" className="hag-empty-cell">Không có phiên trong khoảng thời gian trả về từ API.</td></tr> : sessionPage.rows.map((session, index) => <tr key={session.sessionId ?? session.id ?? index}><td className="hag-mono">{String(session.sessionId ?? session.id ?? "—").slice(0, 16)}</td><td><strong>{session.currentPoiName ?? session.poiName ?? session.pagePath ?? "Đang duyệt"}</strong><small className="hag-cell-subtitle">{session.lastEvent ?? session.eventType ?? "—"} · visitor {String(session.visitorId ?? "—").slice(0, 10)}</small></td><td>{session.deviceName ?? "Chưa nhận diện"}<small className="hag-cell-subtitle">{[session.platform, session.browserName].filter(Boolean).join(" · ") || "Sự kiện cũ hoặc trình duyệt chưa gửi metadata"}</small></td><td>{displayDate(session.lastSeenEpochMs ?? session.lastSeen ?? session.lastEventAt ?? session.updatedAt)}</td><td>{activityBadge(session)}</td></tr>)}</tbody></table></div><Pagination data={sessionPage} label="phiên truy cập" disabled={monitorLoading} /></article>
                    <article className="hag-card hag-table-card">
                        <div className="hag-card__heading"><h3>Địa điểm được xem nhiều</h3><span>Top 50 · loại nguồn test</span></div>
                        <div className="hag-table-wrap"><table className="hag-table"><thead><tr><th>POI</th><th>Tên địa điểm</th><th>Lượt xem</th></tr></thead>
                            <tbody>{topPois.length ? topPage.rows.map((row) => <tr key={row.poiId}><td>#{row.poiId}</td><td>{pois.find((poi) => Number(poi.id) === Number(row.poiId))?.name || "POI đã xóa hoặc chưa tải"}</td><td>{row.views}</td></tr>) : <tr><td colSpan="3" className="hag-empty-cell">Chưa có dữ liệu top POI.</td></tr>}</tbody>
                        </table></div><Pagination data={topPage} label="top địa điểm" disabled={monitorLoading} />
                    </article>
                    <p className="hag-privacy-note">Bảo mật: nên chỉ lưu sessionId/visitorId giả danh, thời gian hoạt động và thông tin thiết bị tối thiểu; che IP; đặt retention phù hợp. Không suy diễn visitorId thành danh tính người thật.</p>
                </div>
            )}

            {activeTab === "devices" && (
                <div className="hag-page">
                    <div className="hag-page__title-row"><div><p className="hag-section-kicker">DEVICE & SESSION CONTROL</p><h3>Nhận diện thiết bị truy cập</h3><p>Thiết bị được gom theo mã trình duyệt giả danh do backend lưu từ các sự kiện analytics.</p></div><button type="button" className="hag-btn hag-btn--soft" onClick={() => void loadMonitoring()} disabled={monitorLoading}>↻ Làm mới</button></div>
                    <div className="hag-stat-grid hag-stat-grid--monitor"><StatCard label="Thiết bị trong danh sách" value={devicesApiState === "ready" ? devices.length : "—"} detail="Tối đa 100 trình duyệt gần nhất" icon="▣" tone="blue" /><StatCard label="Hoạt động 30 giây" value={devicesApiState === "ready" ? devices.filter(recent).length : "—"} detail="Có sự kiện trong 30 giây gần nhất" icon="●" tone="green" /><StatCard label="Không hoạt động gần đây" value={devicesApiState === "ready" ? devices.filter((device) => !recent(device)).length : "—"} detail="Không có sự kiện trong khoảng hoạt động" icon="◷" tone="red" /><StatCard label="Sự kiện trên danh sách" value={devicesApiState === "ready" ? devices.reduce((total, device) => total + Number(device.eventCount ?? 0), 0) : "—"} detail="Tổng các sự kiện của thiết bị đang hiển thị" icon="↗" tone="amber" /></div>
                    {devicesApiState === "missing" && <DataNotice kind="warning">API <code>GET /api/analytics/admin/devices</code> chưa tồn tại trong backend đang chạy. Build lại poi-service và kiểm tra route / quyền ADMIN.</DataNotice>}
                    {devicesApiState === "error" && <DataNotice kind="error">Không tải được thiết bị. Kiểm tra JWT ADMIN, schema analytics, API Gateway và log poi-service.</DataNotice>}
                    {devicesApiState === "ready" && devices.length === 0 && <DataNotice kind="info">Chưa có sự kiện thiết bị mới. Mở/refresh site sau khi cập nhật để ghi metadata; các sự kiện lịch sử không có device_id không thể nhận diện ngược lại.</DataNotice>}
                    <div className="hag-card hag-table-card"><div className="hag-table-wrap"><table className="hag-table"><thead><tr><th>Mã trình duyệt</th><th>Loại thiết bị</th><th>Nền tảng</th><th>Trình duyệt</th><th>Số sự kiện</th><th>Hoạt động cuối</th><th>Trạng thái</th></tr></thead><tbody>{devicesApiState !== "ready" ? <tr><td colSpan="7" className="hag-empty-cell">Đang chờ dữ liệu thiết bị từ backend. Không dùng dữ liệu giả.</td></tr> : devices.length === 0 ? <tr><td colSpan="7" className="hag-empty-cell">Chưa có thiết bị được ghi nhận sau khi bật tính năng nhận diện.</td></tr> : devicePage.rows.map((device, index) => <tr key={device.deviceId ?? index}><td className="hag-mono">{String(device.deviceId ?? "—").slice(0, 18)}</td><td>{device.deviceType ?? "UNKNOWN"}</td><td>{device.platform ?? "Unknown"}</td><td>{device.browserName ?? "Unknown"}</td><td>{device.eventCount ?? 0}</td><td>{displayDate(device.lastSeenEpochMs ?? device.lastSeen)}</td><td>{activityBadge(device)}</td></tr>)}</tbody></table></div><Pagination data={devicePage} label="thiết bị" disabled={monitorLoading} /></div>
                    <p className="hag-muted">Mã thiết bị là ID giả danh của cài đặt trình duyệt, không phải số serial hoặc xác minh phần cứng. Chưa có chức năng khóa thiết bị trong bản này.</p>
                </div>
            )}
            <footer className="hag-admin__footer"><span>HoiAnGuide Admin Console</span><span>{monitorUpdatedAt ? `Analytics cập nhật ${monitorUpdatedAt.toLocaleTimeString("vi-VN")}` : "Dữ liệu lấy từ API backend"}</span></footer>
        </section>
    );
}
