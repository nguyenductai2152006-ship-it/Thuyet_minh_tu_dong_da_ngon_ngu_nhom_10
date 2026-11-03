package com.sgu.poi.analytics.controller;

import com.sgu.poi.analytics.dto.AnalyticsDeviceResponse;
import com.sgu.poi.analytics.dto.AnalyticsEventRequest;
import com.sgu.poi.analytics.dto.AnalyticsSessionResponse;
import com.sgu.poi.analytics.dto.AnalyticsSummaryResponse;
import com.sgu.poi.analytics.dto.PoiViewCountResponse;
import com.sgu.poi.analytics.service.AnalyticsService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    /** Public event collection. Rate-limit before production exposure. */
    @PostMapping("/events")
    public ResponseEntity<Void> recordEvent(@Valid @RequestBody AnalyticsEventRequest request) {
        analyticsService.record(request);
        return ResponseEntity.accepted().build();
    }

    /** SecurityConfig must restrict /admin/** to ADMIN. */
    @GetMapping("/admin/summary")
    public ResponseEntity<AnalyticsSummaryResponse> getSummary() {
        return ResponseEntity.ok(analyticsService.getSummary());
    }

    @GetMapping("/admin/pois/top")
    public ResponseEntity<List<PoiViewCountResponse>> getTopPoiViews(
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(analyticsService.getTopPoiViews(limit));
    }

    @GetMapping("/admin/sessions")
    public ResponseEntity<List<AnalyticsSessionResponse>> getRecentSessions(
            @RequestParam(defaultValue = "100") int limit,
            @RequestParam(defaultValue = "30") int activeWithinSeconds) {
        return ResponseEntity.ok(analyticsService.getRecentSessions(limit, activeWithinSeconds));
    }

    @GetMapping("/admin/devices")
    public ResponseEntity<List<AnalyticsDeviceResponse>> getRecentDevices(
            @RequestParam(defaultValue = "100") int limit,
            @RequestParam(defaultValue = "30") int activeWithinSeconds) {
        return ResponseEntity.ok(analyticsService.getRecentDevices(limit, activeWithinSeconds));
    }
}
