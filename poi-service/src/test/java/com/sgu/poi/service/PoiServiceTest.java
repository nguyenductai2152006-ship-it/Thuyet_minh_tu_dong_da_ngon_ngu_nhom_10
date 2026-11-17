package com.sgu.poi.service;
import com.sgu.poi.dto.UpdatePoiRequest;
import com.sgu.poi.entity.Poi;
import com.sgu.poi.entity.PoiStatus;
import com.sgu.poi.exception.PoiNotFoundException;
import com.sgu.poi.repository.PoiRepository;
import org.junit.jupiter.api.*;
import org.springframework.security.core.context.SecurityContextHolder;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class PoiServiceTest {
    PoiRepository repository;
    RelatedContentGuard guard;
    PoiService service;
    Poi poi;
    @BeforeEach void setup() {
        repository = mock(PoiRepository.class); guard = mock(RelatedContentGuard.class);
        service = new PoiService(repository, guard, mock(PoiMutationLock.class));
        poi = new Poi(); poi.setId(3L); poi.setStatus(PoiStatus.ACTIVE); poi.setImageUrl("/Images/keep.jpg");
        when(repository.findById(3L)).thenReturn(Optional.of(poi));
        when(repository.saveAndFlush(any(Poi.class))).thenAnswer(invocation -> invocation.getArgument(0));
    }
    @AfterEach void cleanup() { SecurityContextHolder.clearContext(); }
    @Test void omittedImagePreservesExistingAsset() {
        service.update(3L, filled());
        assertEquals("/Images/keep.jpg", poi.getImageUrl());
    }
    @Test void explicitNullClearsImage() {
        var request = filled(); request.setImageUrl(null);
        service.update(3L, request);
        assertNull(poi.getImageUrl());
    }
    @Test void publicCatalogueExcludesInactiveAndAdminCatalogueIncludesIt() {
        var hidden = new Poi(); hidden.setId(4L); hidden.setStatus(PoiStatus.INACTIVE);
        when(repository.findAll()).thenReturn(List.of(poi, hidden));
        when(repository.findByStatus(PoiStatus.ACTIVE)).thenReturn(List.of(poi));
        assertEquals(1, service.getAll().size());
        assertEquals(2, service.getAllForAdmin().size());
    }
    @Test void publicDirectLookupRejectsInactive() {
        poi.setStatus(PoiStatus.INACTIVE);
        assertThrows(PoiNotFoundException.class, () -> service.getById(3L));
    }
    @Test void refusesDeletionWhenGuardRejects() {
        doThrow(new IllegalStateException("related content")).when(guard).requireEmpty(3L);
        assertThrows(IllegalStateException.class, () -> service.delete(3L));
        verify(repository, never()).delete(any());
    }
    @Test void deletesEmptyPoiAfterCheckingDependencies() {
        service.delete(3L);
        var order = inOrder(guard, repository);
        order.verify(guard).requireEmpty(3L); order.verify(repository).delete(poi);
    }
    @Test void omittedCategoryPreservesExistingCategory() {
        poi.setCategory("market"); service.update(3L, filled());
        assertEquals("market", poi.getCategory());
    }
    @Test void explicitCategoryChangesExistingCategory() {
        poi.setCategory("market"); var request = filled(); request.setCategory("history");
        service.update(3L, request); assertEquals("history", poi.getCategory());
    }
    private UpdatePoiRequest filled() { var r = new UpdatePoiRequest(); r.setName("POI"); r.setDescription("Description"); r.setQrCode("QR3"); r.setStatus(PoiStatus.ACTIVE); return r; }
}
