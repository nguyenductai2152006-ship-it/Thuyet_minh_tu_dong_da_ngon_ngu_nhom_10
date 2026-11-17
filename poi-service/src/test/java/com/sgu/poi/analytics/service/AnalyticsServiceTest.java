package com.sgu.poi.analytics.service;
import com.sgu.poi.analytics.repository.AnalyticsEventRepository;
import org.junit.jupiter.api.Test;
import java.util.*;
import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;
class AnalyticsServiceTest {
    @Test void keepsLandingPoiAndLegacyQrMetricsSeparateWithoutRewritingEvents() {
        var repository = mock(AnalyticsEventRepository.class);
        when(repository.countQrOpenEvents()).thenReturn(2L);
        when(repository.countQrEventsBySource("qr_poi_verified")).thenReturn(3L);
        when(repository.countQrEventsBySource("qr_verified")).thenReturn(7L);
        var result = new AnalyticsService(repository, mock(com.sgu.poi.repository.PoiRepository.class)).getSummary();
        assertEquals(2, result.qrOpens()); assertEquals(3, result.qrPoiOpens()); assertEquals(7, result.legacyQrOpens());
        verify(repository, never()).save(any());
    }
    @Test void mapsSessionEpochIndependentlyOfLegacyDateString() {
        var repository = mock(AnalyticsEventRepository.class);
        Object[] row = {"s", "v", "poi_view", 3L, "/", 2L, "2026-10-28T10:00:00", 1, "d", "MOBILE", "Phone", "Android", "Chrome", 1_790_000_000_000L};
        when(repository.findRecentSessions(100, 30)).thenReturn(Collections.singletonList(row));
        var result = new AnalyticsService(repository, mock(com.sgu.poi.repository.PoiRepository.class)).getRecentSessions(100, 30).get(0);
        assertEquals(1_790_000_000_000L, result.lastSeenEpochMs()); assertTrue(result.active());
    }
    @Test void mapsDeviceEpochAndClampsRequestedLimit() {
        var repository = mock(AnalyticsEventRepository.class);
        Object[] row = {"d", "MOBILE", "Phone", "Android", "Chrome", "s", "v", 2L, "2026-10-28T10:00:00", 0, 1_790_000_000_000L};
        when(repository.findRecentDevices(100, 30)).thenReturn(Collections.singletonList(row));
        var result = new AnalyticsService(repository, mock(com.sgu.poi.repository.PoiRepository.class)).getRecentDevices(999, 30).get(0);
        assertEquals(1_790_000_000_000L, result.lastSeenEpochMs()); assertFalse(result.active());
    }
    @Test void mapsNumericStringActivityFromJdbc() {
        var repository = mock(AnalyticsEventRepository.class);
        Object[] row = {"d", "MOBILE", "Phone", "Android", "Chrome", "s", "v", 2L, "2026-10-30T10:00:00", "1", 1_790_000_000_000L};
        when(repository.findRecentDevices(100, 30)).thenReturn(Collections.singletonList(row));
        assertTrue(new AnalyticsService(repository, mock(com.sgu.poi.repository.PoiRepository.class)).getRecentDevices(100, 30).get(0).active());
        row[9] = "0";
        assertFalse(new AnalyticsService(repository, mock(com.sgu.poi.repository.PoiRepository.class)).getRecentDevices(100, 30).get(0).active());
    }
}
