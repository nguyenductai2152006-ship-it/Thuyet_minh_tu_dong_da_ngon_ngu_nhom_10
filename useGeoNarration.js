import { useCallback, useEffect, useRef, useState } from "react";

import { isConfidentlyInside } from "../utils/geofence";

function validPoi(poi) {
    if (!poi || typeof poi.qrCode !== "string" || !poi.qrCode.trim()) {
        return false;
    }

    if (String(poi.status || "ACTIVE").toUpperCase() !== "ACTIVE") {
        return false;
    }

    const parseNumber = (value) => {
        if (typeof value !== "number" && typeof value !== "string") {
            return NaN;
        }

        if (typeof value === "string" && value.trim() === "") {
            return NaN;
        }

        return Number(value);
    };

    const latitude = parseNumber(poi.latitude);
    const longitude = parseNumber(poi.longitude);
    const radius = parseNumber(poi.radius);

    return (
        Number.isFinite(latitude) &&
        latitude >= -90 &&
        latitude <= 90 &&
        Number.isFinite(longitude) &&
        longitude >= -180 &&
        longitude <= 180 &&
        Number.isFinite(radius) &&
        radius > 0
    );
}

function distanceMeters(lat1, lon1, lat2, lon2) {
  const radians = (degrees) => (degrees * Math.PI) / 180;
  const earthRadius = 6371000;
  const dLat = radians(lat2 - lat1);
  const dLon = radians(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(radians(lat1)) * Math.cos(radians(lat2)) * Math.sin(dLon / 2) ** 2;
  const safeA = Math.min(1, Math.max(0, a));
  return 2 * earthRadius * Math.atan2(Math.sqrt(safeA), Math.sqrt(1 - safeA));
}

/**
 * Watches the phone position and calls onEnterPoi only when the visitor enters
 * a POI geofence. Radius is assumed to be metres, matching the existing App.
 * GPS requires permission and HTTPS (localhost is allowed for development).
 */
export function useGeoNarration({ pois = [], onEnterPoi, onPosition } = {}) {
  const [enabled, setEnabled] = useState(true);
  const [retryKey, setRetryKey] = useState(0);
  const [status, setStatus] = useState("Đang chuẩn bị theo dõi GPS...");
  const lastTriggeredAt = useRef(new Map());
  const activePoiKey = useRef(null);

  const retry = useCallback(() => {
    setStatus("Đang yêu cầu quyền vị trí GPS...");
    setEnabled(true);
    setRetryKey((value) => value + 1);
  }, []);

  const stop = useCallback(() => {
    setEnabled(false);
    setStatus("Đã tạm dừng thuyết minh tự động. Nhấn bật lại để tiếp tục.");
  }, []);

  useEffect(() => {
    if (!enabled) return undefined;

    if (!navigator.geolocation) {
      const timer = window.setTimeout(() => setStatus("Trình duyệt không hỗ trợ GPS. Hãy dùng Chrome/Edge hoặc quét QR địa điểm."), 0);
      return () => window.clearTimeout(timer);
    }

    const isLocalhost = ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
    if (!window.isSecureContext && !isLocalhost) {
      const timer = window.setTimeout(() => setStatus("GPS cần HTTPS. Hãy mở HoiAnGuide bằng đường dẫn HTTPS công khai."), 0);
      return () => window.clearTimeout(timer);
    }

    let watchId;
    let disposed = false;
    let pending=false;
    let lastStatusUpdate = 0;

    try {
      watchId = navigator.geolocation.watchPosition(
        async (position) => {
          if (disposed) return;
          const { latitude, longitude, accuracy } = position.coords;
          if (typeof onPosition === "function") {
            onPosition({ latitude, longitude, accuracy });
          }

          const now = Date.now();
          if (now - lastStatusUpdate > 8000) {
            const acc = Number.isFinite(Number(accuracy)) ? Math.round(Number(accuracy)) : null;
            setStatus(
              `GPS đã bật${acc ? ` (sai số ước tính ±${acc} m)` : ""}. Đi vào bán kính của một địa điểm để nghe thuyết minh tự động.`
            );
            lastStatusUpdate = now;
          }

          const candidates = (Array.isArray(pois) ? pois : [])
            .filter(validPoi)
            .map((poi) => {
              const distance = distanceMeters(
                latitude,
                longitude,
                Number(poi.latitude),
                Number(poi.longitude)
              );
              return { poi, distance, radius: Number(poi.radius) };
            });
          const rawAccuracy = Number(accuracy);
          if (!Number.isFinite(rawAccuracy) || rawAccuracy <= 0) return;

          // Keep the acknowledged POI while its region might still contain the
          // visitor. A 10 m exit margin prevents boundary jitter from switching
          // narration to another overlapping region on the next GPS update.
          const active = candidates.find(({ poi }) => String(poi.id ?? poi.qrCode) === activePoiKey.current);
          if (active && active.distance - rawAccuracy <= active.radius + 10) return;
          activePoiKey.current = null;
          const inside = candidates
            .filter((entry) => isConfidentlyInside(entry.distance, rawAccuracy, entry.radius))
            .sort((a, b) => a.distance - b.distance);
          if (pending || !inside.length || typeof onEnterPoi !== "function") return;

          const selected = inside[0].poi;
          const poiKey = String(selected.id ?? selected.qrCode);
          const lastTime = lastTriggeredAt.current.get(poiKey) || 0;
          // Avoid duplicate narration caused by GPS jitter or watch restart.
          if (now - lastTime < 90_000) return;
          pending=true;
          try {if(await onEnterPoi(selected)===true && !disposed){lastTriggeredAt.current.set(poiKey,now);activePoiKey.current=poiKey;}}
          catch {if(!disposed)setStatus("Chưa mở được POI. GPS sẽ thử lại ở lần cập nhật sau.");}
          finally {pending=false;}
        },
        (error) => {
          if (disposed) return;
          if (error?.code === 1) {
            setStatus("Bạn chưa cấp quyền vị trí. Hãy cho phép Location trong trình duyệt rồi nhấn thử lại.");
          } else if (error?.code === 2) {
            setStatus("Chưa xác định được vị trí. Hãy bật GPS/Location trên điện thoại và thử lại.");
          } else if (error?.code === 3) {
            setStatus("GPS quá thời gian chờ. Hãy ra nơi thoáng hơn và nhấn thử lại.");
          } else {
            setStatus(error?.message || "Không thể lấy vị trí. Bạn vẫn có thể chọn địa điểm trên bản đồ.");
          }
        },
        {
          enableHighAccuracy: true,
          maximumAge: 5000,
          timeout: 20000,
        }
      );
    } catch (error) {
      queueMicrotask(() => {
        if (!disposed) setStatus(error?.message || "Không thể khởi động GPS. Hãy thử lại hoặc dùng bản đồ.");
      });
    }

    return () => {
      disposed = true;
      if (watchId !== undefined) navigator.geolocation.clearWatch(watchId);
    };
  }, [enabled, retryKey, pois, onEnterPoi, onPosition]);

  return { enabled, status, retry, stop };
}
