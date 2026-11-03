import { useCallback, useEffect, useRef, useState } from "react";
import "../styles/AnalyticsDashboard.css";

const POLL_INTERVAL_MS = 5000;

function firstValue(object, keys, fallback = 0) {
  for (const key of keys) {
    if (object && object[key] !== undefined && object[key] !== null) {
      return object[key];
    }
  }
  return fallback;
}

function numberValue(object, keys) {
  const value = Number(firstValue(object, keys, 0));
  return Number.isFinite(value) ? value : 0;
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString("vi-VN");
}

async function getJson(url, token, signal) {
  const headers = { Accept: "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(url, {
    method: "GET",
    headers,
    cache: "no-store",
    signal,
  });

  if (!response.ok) {
    let detail = "";
    try {
      detail = await response.text();
    } catch {
      // Ignore an unavailable error body.
    }
    const error = new Error(
      `HTTP ${response.status} khi tải thống kê (${url})${detail ? `: ${detail.slice(0, 180)}` : ""}`
    );
    error.status = response.status;
    throw error;
  }

  return response.json();
}

function extractRows(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.content)) return value.content;
  if (Array.isArray(value?.data)) return value.data;
  return [];
}

export default function AnalyticsDashboard() {
  const [summary, setSummary] = useState(null);
  const [topPois, setTopPois] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [updatedAt, setUpdatedAt] = useState(null);
  const inFlightRef = useRef(false);
  const mountedRef = useRef(false);
  const firstLoadRef = useRef(true);

  const load = useCallback(async (manual = false) => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;

    if (firstLoadRef.current) {
      setLoading(true);
    } else if (manual) {
      setRefreshing(true);
    }

    const controller = new AbortController();
    try {
      const token = window.localStorage.getItem("accessToken");
      if (!token) {
        const authError = new Error("Bạn chưa đăng nhập ADMIN.");
        authError.status = 401;
        throw authError;
      }

      const [summaryResult, topResult] = await Promise.all([
        getJson("/api/analytics/admin/summary", token, controller.signal),
        getJson("/api/analytics/admin/pois/top?limit=10", token, controller.signal),
      ]);

      if (!mountedRef.current) return;
      setSummary(summaryResult || {});
      setTopPois(extractRows(topResult));
      setUpdatedAt(new Date());
      setError("");
    } catch (loadError) {
      if (!mountedRef.current || loadError?.name === "AbortError") return;
      if (loadError?.status === 401 || loadError?.status === 403) {
        setError("Không thể xem thống kê: hãy đăng nhập bằng tài khoản ADMIN và kiểm tra quyền truy cập endpoint Analytics.");
      } else {
        setError(`${loadError?.message || "Không tải được số liệu Analytics."} Kiểm tra API Gateway, poi-service và log backend.`);
      }
    } finally {
      firstLoadRef.current = false;
      inFlightRef.current = false;
      if (mountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    void load();

    const timer = window.setInterval(() => {
      // Skip background polling when the tab is hidden; refresh on the next visible tick.
      if (document.visibilityState === "visible") void load();
    }, POLL_INTERVAL_MS);

    const handleVisible = () => {
      if (document.visibilityState === "visible") void load();
    };
    document.addEventListener("visibilitychange", handleVisible);

    return () => {
      mountedRef.current = false;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", handleVisible);
    };
  }, [load]);

  const metrics = [
    {
      label: "Khách truy cập ẩn danh",
      value: numberValue(summary, [  "estimatedUniqueVisitors","uniqueVisitors", "uniqueVisitorCount", "unique_visitors", "estimatedVisitors", "estimated_visitors", "totalVisitors", "visitorCount", "visitors"]),
    },
    {

      label: "Lượt xem trang",
      value: numberValue(summary, ["pageViews", "totalPageViews", "page_views", "total_page_views"]),
    },
    {
      label: "Phiên truy cập",
      value: numberValue(summary, ["sessions", "totalSessions", "uniqueSessions", "unique_sessions", "sessions", "total_sessions"]),
    },
    {
      label: "Mở QR trang chủ",
      value: numberValue(summary, ["qrOpens", "qrOpenCount", "totalQrOpens", "qr_opens", "total_qr_opens"]),
    },
    {
      label: "Lượt xem địa điểm",
      value: numberValue(summary, ["poiViews", "poiViewCount", "totalPoiViews", "poi_views", "total_poi_views"]),
    },
    {
      label: "Lượt phát thuyết minh",
      value: numberValue(summary, ["audioPlays", "audioPlayCount", "totalAudioPlays", "audio_plays", "total_audio_plays"]),
    },
  ];

  return (
    <section className="analytics-dashboard" aria-labelledby="analytics-title">
      <div className="analytics-header">
        <div>
          <h2 id="analytics-title">Thống kê lượt truy cập HoiAnGuide</h2>
          <p>Khách tham quan không cần đăng nhập. Số liệu tự cập nhật khoảng mỗi 5 giây khi trang ADMIN đang mở.</p>
        </div>
        <button type="button" onClick={() => void load(true)} disabled={loading || refreshing}>
          {loading ? "Đang tải..." : refreshing ? "Đang cập nhật..." : "Làm mới ngay"}
        </button>
      </div>

      <div className="analytics-live-status" role="status" aria-live="polite">
        <span className="analytics-live-dot" />
        <span>{error ? "Không đồng bộ được dữ liệu" : "Tự động đồng bộ đang bật"}</span>
        <span className="analytics-live-separator">•</span>
        <span>{updatedAt ? `Cập nhật lúc ${updatedAt.toLocaleTimeString("vi-VN")}` : "Đang chờ dữ liệu đầu tiên"}</span>
      </div>

      {error && <p className="analytics-error" role="alert">{error}</p>}

      <div className="analytics-metrics">
        {metrics.map((metric) => (
          <article className="analytics-metric" key={metric.label}>
            <span>{metric.label}</span>
            <strong>{formatNumber(metric.value)}</strong>
          </article>
        ))}
      </div>

      <div className="analytics-top-pois">
        <h3>Địa điểm được xem nhiều</h3>
        {topPois.length === 0 ? (
          <p>{loading ? "Đang tải dữ liệu..." : "Chưa có lượt xem địa điểm hoặc API chưa trả về danh sách."}</p>
        ) : (
          <div className="analytics-table-wrap">
            <table>
              <thead>
                <tr><th>Địa điểm</th><th>Mã POI</th><th>Lượt xem</th></tr>
              </thead>
              <tbody>
                {topPois.map((item, index) => (
                  <tr key={item.poiId ?? item.poi_id ?? item.id ?? index}>
                    <td>{firstValue(item, ["poiName", "name", "poi_name", "title"], "Địa điểm")}</td>
                    <td>{firstValue(item, ["poiId", "poi_id", "id"], "—")}</td>
                    <td>{formatNumber(firstValue(item, ["viewCount", "views", "count", "total", "totalViews"], 0))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="analytics-disclaimer">
        “Khách truy cập ẩn danh” là số mã trình duyệt khác nhau, không phải số người thật đã xác minh. Dữ liệu test cũng sẽ được tính nếu backend chưa loại nguồn test ra khỏi thống kê.
      </p>
    </section>
  );
}
