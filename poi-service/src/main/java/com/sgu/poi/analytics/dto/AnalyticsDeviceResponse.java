package com.sgu.poi.analytics.dto;

/** Device is a pseudonymous browser installation, not a verified physical-device identity. */
public record AnalyticsDeviceResponse(
        String deviceId,
        String deviceType,
        String deviceName,
        String platform,
        String browserName,
        String lastSessionId,
        String lastVisitorId,
        Long eventCount,
        String lastSeen,
        boolean active,
        String status,
        Long lastSeenEpochMs
) {
}
