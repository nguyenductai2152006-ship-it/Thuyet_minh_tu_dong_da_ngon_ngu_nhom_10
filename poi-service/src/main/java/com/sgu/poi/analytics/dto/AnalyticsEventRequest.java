package com.sgu.poi.analytics.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

/**
 * Public analytics event payload. Device metadata is optional so older clients
 * remain compatible while browser clients upgrade.
 */
public record AnalyticsEventRequest(
        @NotBlank @Size(max = 32) String eventType,
        @Size(max = 36) String visitorId,
        @NotBlank @Size(max = 36) String sessionId,
        @Positive Long poiId,
        @NotBlank @Size(max = 255) String pagePath,
        @Size(max = 32) String source,
        @Pattern(regexp = "(?i)[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}")
        String deviceId,
        @Size(max = 24) String deviceType,
        @Size(max = 32) String platform,
        @Size(max = 48) String browserName
) {
}
