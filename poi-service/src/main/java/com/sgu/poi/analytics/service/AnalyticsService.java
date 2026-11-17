package com.sgu.poi.analytics.service;

import com.sgu.poi.analytics.dto.AnalyticsDeviceResponse;
import com.sgu.poi.analytics.dto.AnalyticsEventRequest;
import com.sgu.poi.analytics.dto.AnalyticsSessionResponse;
import com.sgu.poi.analytics.dto.AnalyticsSummaryResponse;
import com.sgu.poi.analytics.dto.PoiViewCountResponse;
import com.sgu.poi.analytics.entity.AnalyticsEvent;
import com.sgu.poi.analytics.repository.AnalyticsEventRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
public class AnalyticsService {

    private static final Set<String> ALLOWED_EVENTS = Set.of(
            "page_view", "qr_open", "poi_view", "tour_start", "audio_play"
    );
    private static final Set<String> DEVICE_TYPES = Set.of("MOBILE", "TABLET", "DESKTOP", "UNKNOWN");
    private static final Set<String> PLATFORMS = Set.of("Android", "iOS", "Windows", "macOS", "Linux", "ChromeOS", "Unknown");
    private static final Set<String> BROWSERS = Set.of("Chrome", "Edge", "Firefox", "Safari", "Opera", "Samsung Internet", "Unknown");

    private final AnalyticsEventRepository repository;
    private final com.sgu.poi.repository.PoiRepository pois;

    public AnalyticsService(AnalyticsEventRepository repository,com.sgu.poi.repository.PoiRepository pois) {
        this.repository = repository;this.pois=pois;
    }

    @Transactional
    public void record(AnalyticsEventRequest request) {
        String eventType = request.eventType().trim().toLowerCase(Locale.ROOT);
        if (!ALLOWED_EVENTS.contains(eventType)) {
            throw new IllegalArgumentException("Unsupported analytics event type");
        }

        if ((eventType.equals("poi_view") || eventType.equals("audio_play")) && request.poiId()==null) throw new IllegalArgumentException("poiId is required");
        if(request.poiId()!=null && !pois.existsById(request.poiId())) throw new IllegalArgumentException("POI does not exist");
        String source = request.source() == null ? null : request.source().trim();
        if (source != null && source.isEmpty()) source = null;

        String deviceId = normalizeUuid(request.deviceId());
        String deviceType = deviceId == null ? null : normalize(request.deviceType(), DEVICE_TYPES, true);
        String platform = deviceId == null ? null : normalize(request.platform(), PLATFORMS, false);
        String browserName = deviceId == null ? null : normalize(request.browserName(), BROWSERS, false);
        String deviceName = deviceId == null ? null : buildDeviceName(deviceType, platform, browserName);

        repository.save(new AnalyticsEvent(
                eventType,
                blankToNull(request.visitorId()),
                request.sessionId().trim(),
                request.poiId(),
                request.pagePath().trim(),
                source,
                deviceId,
                deviceType,
                deviceName,
                platform,
                browserName
        ));
    }

    @Transactional(readOnly = true)
    public AnalyticsSummaryResponse getSummary() {
        return new AnalyticsSummaryResponse(
                repository.countByEventType("page_view"),
                repository.countDistinctVisitorsByEventType("page_view"),
                repository.countDistinctSessionsByEventType("page_view"),
                repository.countActiveSessionsLast30Seconds(),
                repository.countQrOpenEvents(),
                repository.countByEventType("poi_view"),
                repository.countByEventType("tour_start"),
                repository.countByEventType("audio_play"),
                repository.countAllNonTestEvents(),
                repository.countQrEventsBySource("qr_poi_verified"),
                repository.countQrEventsBySource("qr_verified")
        );
    }

    @Transactional(readOnly = true)
    public List<PoiViewCountResponse> getTopPoiViews(int requestedLimit) {
        int limit = Math.max(1, Math.min(requestedLimit, 50));
        return repository.findTopPoiViews(PageRequest.of(0, limit)).stream()
                .map(row -> new PoiViewCountResponse(((Number) row[0]).longValue(), ((Number) row[1]).longValue()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AnalyticsSessionResponse> getRecentSessions(int requestedLimit, int requestedActiveSeconds) {
        int limit = Math.max(1, Math.min(requestedLimit, 100));
        int activeSeconds = Math.max(1, Math.min(requestedActiveSeconds, 24 * 60 * 60));
        return repository.findRecentSessions(limit, activeSeconds).stream().map(this::toSessionResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<AnalyticsDeviceResponse> getRecentDevices(int requestedLimit, int requestedActiveSeconds) {
        int limit = Math.max(1, Math.min(requestedLimit, 100));
        int activeSeconds = Math.max(1, Math.min(requestedActiveSeconds, 24 * 60 * 60));
        return repository.findRecentDevices(limit, activeSeconds).stream().map(this::toDeviceResponse).toList();
    }

    private AnalyticsSessionResponse toSessionResponse(Object[] row) {
        boolean active = booleanValue(row[7]);
        return new AnalyticsSessionResponse(
                stringValue(row[0]), stringValue(row[1]), stringValue(row[2]), longValue(row[3]),
                stringValue(row[4]), longValue(row[5]), stringValue(row[6]), active,
                active ? "ACTIVE" : "OFFLINE",
                stringValue(row[8]), stringValue(row[9]), stringValue(row[10]),
                stringValue(row[11]), stringValue(row[12]), longValue(row[13])
        );
    }

    private AnalyticsDeviceResponse toDeviceResponse(Object[] row) {
        boolean active = booleanValue(row[9]);
        return new AnalyticsDeviceResponse(
                stringValue(row[0]), stringValue(row[1]), stringValue(row[2]),
                stringValue(row[3]), stringValue(row[4]), stringValue(row[5]),
                stringValue(row[6]), longValue(row[7]), stringValue(row[8]),
                active, active ? "ACTIVE" : "OFFLINE", longValue(row[10])
        );
    }

    private static String normalizeUuid(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            return UUID.fromString(value.trim()).toString();
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }

    private static String normalize(String value, Set<String> allowed, boolean uppercase) {
        if (value == null || value.isBlank()) return uppercase ? "UNKNOWN" : "Unknown";
        String trimmed = value.trim();
        if (uppercase) trimmed = trimmed.toUpperCase(Locale.ROOT);
        for (String option : allowed) {
            if (option.equalsIgnoreCase(trimmed)) return option;
        }
        return uppercase ? "UNKNOWN" : "Unknown";
    }

    private static String buildDeviceName(String type, String platform, String browser) {
        String typeLabel = switch (type == null ? "UNKNOWN" : type) {
            case "MOBILE" -> "Mobile";
            case "TABLET" -> "Tablet";
            case "DESKTOP" -> "Desktop";
            default -> "Device";
        };
        return (typeLabel + " · " + (platform == null ? "Unknown" : platform)
                + " · " + (browser == null ? "Unknown" : browser));
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private static String stringValue(Object value) {
        return value == null ? null : value.toString();
    }

    private static Long longValue(Object value) {
        if (value == null) return null;
        if (value instanceof Number number) return number.longValue();
        return Long.parseLong(value.toString());
    }

    private static boolean booleanValue(Object value) {
        if (value instanceof Number number) return number.intValue() != 0;
        return "1".equals(stringValue(value)) || Boolean.parseBoolean(stringValue(value));
    }
}
