package com.sgu.poi.analytics.dto;

/** A pseudonymous analytics session aggregated from events. */
public record AnalyticsSessionResponse(
        String sessionId,
        String visitorId,
        String eventType,
        Long poiId,
        String pagePath,
        Long eventCount,
        String lastSeen,
        boolean active,
        String status,
        String deviceId,
        String deviceType,
        String deviceName,
        String platform,
        String browserName,
        Long lastSeenEpochMs
) {
}
