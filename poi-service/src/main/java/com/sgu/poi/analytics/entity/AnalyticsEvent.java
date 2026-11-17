package com.sgu.poi.analytics.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.Generated;
import org.hibernate.generator.EventType;

import java.time.LocalDateTime;

@Entity
@Table(name = "analytics_events")
public class AnalyticsEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "event_type", nullable = false, length = 32)
    private String eventType;

    @Column(name = "visitor_id", length = 36)
    private String visitorId;

    @Column(name = "session_id", nullable = false, length = 36)
    private String sessionId;

    @Column(name = "device_id", length = 36)
    private String deviceId;

    @Column(name = "device_type", length = 24)
    private String deviceType;

    @Column(name = "device_name", length = 80)
    private String deviceName;

    @Column(name = "platform", length = 32)
    private String platform;

    @Column(name = "browser_name", length = 48)
    private String browserName;

    @Column(name = "poi_id")
    private Long poiId;

    @Column(name = "page_path", nullable = false, length = 255)
    private String pagePath;

    @Column(name = "source", length = 32)
    private String source;

    // Use whole-second DB time explicitly. MySQL legacy TIMESTAMP(0) columns
    // otherwise round fractional values into the next second, making new events
    // appear to come from the future to the active-session queries.
    @Generated(event = EventType.INSERT, sql = "CURRENT_TIMESTAMP(0)")
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    protected AnalyticsEvent() {
    }

    /** Kept for source compatibility with code that still creates events without device data. */
    public AnalyticsEvent(String eventType, String visitorId, String sessionId,
                          Long poiId, String pagePath, String source) {
        this(eventType, visitorId, sessionId, poiId, pagePath, source,
                null, null, null, null, null);
    }

    public AnalyticsEvent(String eventType, String visitorId, String sessionId,
                          Long poiId, String pagePath, String source,
                          String deviceId, String deviceType, String deviceName,
                          String platform, String browserName) {
        this.eventType = eventType;
        this.visitorId = visitorId;
        this.sessionId = sessionId;
        this.poiId = poiId;
        this.pagePath = pagePath;
        this.source = source;
        this.deviceId = deviceId;
        this.deviceType = deviceType;
        this.deviceName = deviceName;
        this.platform = platform;
        this.browserName = browserName;
    }
}
