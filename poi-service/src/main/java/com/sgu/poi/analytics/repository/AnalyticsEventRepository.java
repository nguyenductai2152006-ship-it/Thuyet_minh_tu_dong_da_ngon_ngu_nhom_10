package com.sgu.poi.analytics.repository;

import com.sgu.poi.analytics.entity.AnalyticsEvent;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface AnalyticsEventRepository extends JpaRepository<AnalyticsEvent, Long> {

    @Query("select count(e) from AnalyticsEvent e " +
            "where e.eventType = :eventType " +
            "and (e.source is null or lower(trim(e.source)) not in ('test', 'browser-test'))")
    long countByEventType(@Param("eventType") String eventType);

    /** Count only QR-open events written by the corrected tracker; legacy source='qr' events are intentionally excluded because prior attribution could count ordinary POI navigation. */
    @Query("select count(e) from AnalyticsEvent e " +
            "where e.eventType = 'qr_open' and lower(trim(e.source)) = 'qr_landing_verified' " +
            "and (e.source is null or lower(trim(e.source)) not in ('test', 'browser-test'))")
    long countQrOpenEvents();

    @Query("select count(e) from AnalyticsEvent e where e.eventType = 'qr_open' and lower(trim(e.source)) = :source")
    long countQrEventsBySource(@Param("source") String source);

    @Query("select count(distinct e.visitorId) from AnalyticsEvent e " +
            "where e.eventType = :eventType and e.visitorId is not null " +
            "and (e.source is null or lower(trim(e.source)) not in ('test', 'browser-test'))")
    long countDistinctVisitorsByEventType(@Param("eventType") String eventType);

    @Query("select count(distinct e.sessionId) from AnalyticsEvent e " +
            "where e.eventType = :eventType " +
            "and (e.source is null or lower(trim(e.source)) not in ('test', 'browser-test'))")
    long countDistinctSessionsByEventType(@Param("eventType") String eventType);

    /** Count all valid tracked events using the same test-source exclusion as each KPI. */
    @Query("select count(e) from AnalyticsEvent e " +
            "where e.source is null or lower(trim(e.source)) not in ('test', 'browser-test')")
    long countAllNonTestEvents();

    /** Distinct sessions with at least one non-test event in the last thirty seconds. */
    @Query(value = """
            SELECT COUNT(DISTINCT session_id)
            FROM analytics_events
            WHERE created_at BETWEEN TIMESTAMPADD(SECOND, -30, CURRENT_TIMESTAMP(6)) AND CURRENT_TIMESTAMP(6)
              AND (source IS NULL OR LOWER(TRIM(source)) NOT IN ('test', 'browser-test'))
            """, nativeQuery = true)
    long countActiveSessionsLast30Seconds();

    @Query("select e.poiId, count(e) from AnalyticsEvent e " +
            "where e.eventType = 'poi_view' and e.poiId is not null " +
            "and (e.source is null or lower(trim(e.source)) not in ('test', 'browser-test')) " +
            "group by e.poiId order by count(e) desc")
    List<Object[]> findTopPoiViews(Pageable pageable);

    /** Result columns: session_id, visitor_id, event_type, poi_id, page_path,
     * event_count, last_seen, active, device_id, device_type, device_name, platform, browser_name. */
    @Query(value = """
            SELECT ranked.session_id, ranked.visitor_id, ranked.event_type, ranked.poi_id,
                   ranked.page_path, ranked.event_count,
                   DATE_FORMAT(ranked.created_at, '%Y-%m-%dT%H:%i:%s') AS last_seen,
                   CASE WHEN ranked.created_at BETWEEN TIMESTAMPADD(SECOND, -:activeWithinSeconds, CURRENT_TIMESTAMP(6)) AND CURRENT_TIMESTAMP(6)
                        THEN 1 ELSE 0 END AS active,
                   ranked.device_id, ranked.device_type, ranked.device_name, ranked.platform, ranked.browser_name,
                   UNIX_TIMESTAMP(ranked.created_at) * 1000 AS last_seen_epoch_ms
            FROM (
                SELECT ae.id, ae.session_id, ae.visitor_id, ae.event_type, ae.poi_id, ae.page_path,
                       ae.created_at, ae.device_id, ae.device_type, ae.device_name, ae.platform, ae.browser_name,
                       COUNT(*) OVER (PARTITION BY ae.session_id) AS event_count,
                       ROW_NUMBER() OVER (PARTITION BY ae.session_id ORDER BY ae.created_at DESC, ae.id DESC) AS rn
                FROM analytics_events ae
                WHERE ae.source IS NULL OR LOWER(TRIM(ae.source)) NOT IN ('test', 'browser-test')
            ) ranked
            WHERE ranked.rn = 1
            ORDER BY ranked.created_at DESC, ranked.id DESC
            LIMIT :limit
            """, nativeQuery = true)
    List<Object[]> findRecentSessions(@Param("limit") int limit,
                                      @Param("activeWithinSeconds") int activeWithinSeconds);

    /** Result columns: device_id, device_type, device_name, platform, browser_name,
     * session_id, visitor_id, event_count, last_seen, active. */
    @Query(value = """
            SELECT ranked.device_id, ranked.device_type, ranked.device_name, ranked.platform,
                   ranked.browser_name, ranked.session_id, ranked.visitor_id, ranked.event_count,
                   DATE_FORMAT(ranked.created_at, '%Y-%m-%dT%H:%i:%s') AS last_seen,
                   CASE WHEN ranked.created_at BETWEEN TIMESTAMPADD(SECOND, -:activeWithinSeconds, CURRENT_TIMESTAMP(6)) AND CURRENT_TIMESTAMP(6)
                        THEN 1 ELSE 0 END AS active,
                   UNIX_TIMESTAMP(ranked.created_at) * 1000 AS last_seen_epoch_ms
            FROM (
                SELECT ae.id, ae.device_id, ae.device_type, ae.device_name, ae.platform, ae.browser_name,
                       ae.session_id, ae.visitor_id, ae.created_at,
                       COUNT(*) OVER (PARTITION BY ae.device_id) AS event_count,
                       ROW_NUMBER() OVER (PARTITION BY ae.device_id ORDER BY ae.created_at DESC, ae.id DESC) AS rn
                FROM analytics_events ae
                WHERE ae.device_id IS NOT NULL
                  AND (ae.source IS NULL OR LOWER(TRIM(ae.source)) NOT IN ('test', 'browser-test'))
            ) ranked
            WHERE ranked.rn = 1
            ORDER BY ranked.created_at DESC, ranked.id DESC
            LIMIT :limit
            """, nativeQuery = true)
    List<Object[]> findRecentDevices(@Param("limit") int limit,
                                     @Param("activeWithinSeconds") int activeWithinSeconds);
}
