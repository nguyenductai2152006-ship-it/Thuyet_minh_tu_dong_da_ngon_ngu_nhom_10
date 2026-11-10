export const PAGE_SIZE = 5;
export const ACTIVE_SECONDS = 30;

export function pageSlice(rows, requestedPage, size = PAGE_SIZE) {
    const pageCount = Math.max(1, Math.ceil(rows.length / size));
    const page = Math.max(1, Math.min(Number(requestedPage) || 1, pageCount));
    const start = (page - 1) * size;
    return { rows: rows.slice(start, start + size), page, pageCount, total: rows.length,
        from: rows.length ? start + 1 : 0, to: Math.min(start + size, rows.length) };
}

export function normalizeSearch(value) {
    return String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/gi, "d").toLowerCase().trim();
}

export function validCoordinates(latitude, longitude) {
    if ([latitude, longitude].some((value) => value == null || String(value).trim() === "")) return false;
    const lat = Number(latitude), lon = Number(longitude);
    return Number.isFinite(lat) && Number.isFinite(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
}

export function validAudioUrl(value) {
    const text = String(value ?? "").trim();
    if (!text || text.length > 500) return false;
    if (/^\/audio\/[A-Za-z0-9_-]+\.mp3(?:[?#][^\s]*)?$/i.test(text)) return true;
    try { return ["http:", "https:"].includes(new URL(text).protocol) && !/\s/.test(text); }
    catch { return false; }
}

export function safeAssetUrl(value) {
    const text = String(value ?? "").trim();
    if (/^\/(?!\/)[^\s\\]*$/.test(text)) return text;
    try { return ["http:", "https:"].includes(new URL(text).protocol) ? text : null; }
    catch { return null; }
}

// Never turn a missing/unknown server flag into an active device. Epoch time
// avoids browser/server timezone disagreement for SQL DATETIME strings.
export function isRecentlyActive(row, now, fetchedAt, seconds = ACTIVE_SECONDS) {
    const epoch = Number(row.lastSeenEpochMs);
    if (row.lastSeenEpochMs != null && Number.isFinite(epoch)) {
        const age = now - epoch;
        return age >= -5000 && age <= seconds * 1000;
    }
    const lastSeen = Date.parse(row.lastSeen ?? "");
    if (Number.isFinite(lastSeen)) {
        const age = now - lastSeen;
        return age >= -5000 && age <= seconds * 1000;
    }
    const active = row.active === true || row.active === 1 || row.active === "true";
    return active && Number.isFinite(fetchedAt) && now - fetchedAt >= 0 && now - fetchedAt < seconds * 1000;
}

export function errorMessage(error) {
    const body = error?.response?.data;
    const fields = body?.fieldErrors ?? body?.errors;
    const details = fields && typeof fields === "object" ? Object.values(fields).join("; ") : "";
    if (error?.response?.status === 401) return "Phiên đăng nhập hết hạn. Hãy đăng nhập lại.";
    if (error?.response?.status === 403) return "Tài khoản không có quyền thực hiện thao tác này.";
    return details || body?.message || body?.error || error?.message || "Không thể kết nối máy chủ.";
}
