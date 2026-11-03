const ANALYTICS_ENDPOINT = "/api/analytics/events";
const STORAGE = {
    visitor: "hoianguide.analytics.visitorId.v1",
    device: "hoianguide.analytics.deviceId.v1",
    session: "hoianguide.analytics.sessionId.v1",
};

function uuidV4() {
    if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
        const random = Math.floor(Math.random() * 16);
        return (char === "x" ? random : ((random & 0x3) | 0x8)).toString(16);
    });
}

function readOrCreate(storage, key) {
    try {
        const oldValue = storage.getItem(key);
        if (oldValue && oldValue.length <= 36) return oldValue;
        const value = uuidV4();
        storage.setItem(key, value);
        return value;
    } catch {
        // Storage can be blocked in privacy modes. An ephemeral ID is still valid for this event.
        return uuidV4();
    }
}

function detectPlatform() {
    const ua = navigator.userAgent || "";
    const uaPlatform = navigator.userAgentData?.platform || navigator.platform || "";
    const probe = `${uaPlatform} ${ua}`.toLowerCase();
    if (/iphone|ipad|ipod/.test(probe)) return "iOS";
    if (/android/.test(probe)) return "Android";
    if (/windows/.test(probe)) return "Windows";
    if (/macintosh|mac os|macintel|macos/.test(probe)) return "macOS";
    if (/cros|chrome os|chromeos/.test(probe)) return "ChromeOS";
    if (/linux/.test(probe)) return "Linux";
    return "Unknown";
}

function detectDeviceType(platform) {
    const ua = navigator.userAgent || "";
    if (/ipad|tablet|playbook|silk/i.test(ua) || (/android/i.test(ua) && !/mobile/i.test(ua))) {
        return "TABLET";
    }
    if (/mobi|iphone|ipod|android.*mobile|windows phone/i.test(ua) || platform === "iOS" || platform === "Android") {
        return "MOBILE";
    }
    return "DESKTOP";
}

function detectBrowser() {
    const ua = navigator.userAgent || "";
    if (/SamsungBrowser/i.test(ua)) return "Samsung Internet";
    if (/Edg\//i.test(ua)) return "Edge";
    if (/OPR\//i.test(ua) || /Opera/i.test(ua)) return "Opera";
    if (/Firefox\//i.test(ua) || /FxiOS/i.test(ua)) return "Firefox";
    if (/CriOS/i.test(ua) || (/Chrome\//i.test(ua) && !/Edg\//i.test(ua))) return "Chrome";
    if (/Safari\//i.test(ua)) return "Safari";
    return "Unknown";
}

function getDeviceMetadata() {
    const platform = detectPlatform();
    return {
        deviceId: readOrCreate(window.localStorage, STORAGE.device),
        deviceType: detectDeviceType(platform),
        platform,
        browserName: detectBrowser(),
    };
}

function safePath(value) {
    const path = value || window.location.pathname || "/";
    return String(path).slice(0, 255);
}

/**
 * Track a whitelisted HoiAnGuide event. IDs identify a browser installation/session
 * pseudonymously; they do not identify a verified human or a physical device.
 * Full User-Agent and IP address are intentionally not transmitted/stored here.
 */
export async function trackAnalytics(eventType, options = {}) {
    try {
        const normalizedEvent = String(eventType || "").trim().toLowerCase();
        if (!normalizedEvent) return;

        const visitorId = readOrCreate(window.localStorage, STORAGE.visitor);
        const sessionId = readOrCreate(window.sessionStorage, STORAGE.session);
        const device = getDeviceMetadata();
        const payload = {
            eventType: normalizedEvent,
            visitorId,
            sessionId,
            poiId: options.poiId == null ? null : Number(options.poiId),
            pagePath: safePath(options.pagePath),
            source: options.source == null ? "direct" : String(options.source).slice(0, 32),
            ...device,
        };

        const response = await fetch(ANALYTICS_ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
            keepalive: true,
            credentials: "same-origin",
        });
        if (!response.ok) {
            // Analytics must not block the main visitor experience.
            console.warn("HoiAnGuide analytics event was not accepted", response.status);
        }
    } catch (error) {
        // Analytics is best-effort; never break navigation/narration if it fails.
        console.warn("HoiAnGuide analytics unavailable", error);
    }
}

export function getLocalDeviceMetadataForDiagnostics() {
    return getDeviceMetadata();
}
