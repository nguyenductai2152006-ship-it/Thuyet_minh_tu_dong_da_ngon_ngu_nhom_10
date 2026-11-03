package com.sgu.poi.analytics.dto;

/**
 * All-time analytics counters backed by poi_db.analytics_events.
 * Test sources "test" and "browser-test" are excluded consistently.
 */
public record AnalyticsSummaryResponse(
        long pageViews,
        long uniqueVisitors,
        long sessions,
        long activeSessions,
        long qrOpens,
        long poiViews,
        long tourStarts,
        long audioPlays,
        long totalEvents,
        long qrPoiOpens,
        long legacyQrOpens
) {
}
