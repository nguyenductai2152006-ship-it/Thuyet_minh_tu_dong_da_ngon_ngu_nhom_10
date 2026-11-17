package com.sgu.poi.service;

import com.sgu.poi.dto.CreatePoiRequest;
import com.sgu.poi.dto.PoiResponse;
import com.sgu.poi.dto.UpdatePoiRequest;
import com.sgu.poi.entity.Poi;
import com.sgu.poi.entity.PoiStatus;
import com.sgu.poi.exception.PoiNotFoundException;
import com.sgu.poi.repository.PoiRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional
public class PoiService {

    private final PoiRepository poiRepository;
    private final RelatedContentGuard relatedContentGuard;
    private final PoiMutationLock mutationLock;

    public PoiService(PoiRepository poiRepository, RelatedContentGuard relatedContentGuard,PoiMutationLock mutationLock) {
        this.poiRepository = poiRepository;
        this.relatedContentGuard = relatedContentGuard;
        this.mutationLock=mutationLock;
    }

    @Transactional(readOnly = true)
    public List<PoiResponse> getAll() {
        return poiRepository.findByStatus(PoiStatus.ACTIVE)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PoiResponse> getAllForAdmin() {
        return poiRepository.findAll().stream().map(this::toResponse).toList();
    }

    private void requireVisible(Poi poi) {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        boolean admin = authentication != null && authentication.getAuthorities().stream()
                .anyMatch(authority -> "ROLE_ADMIN".equals(authority.getAuthority()));
        if (poi.getStatus() != PoiStatus.ACTIVE && !admin) throw new PoiNotFoundException(poi.getId());
    }

    @Transactional(readOnly = true)
    public PoiResponse getById(Long id) {
        Poi poi = poiRepository.findById(id)
                .orElseThrow(() -> new PoiNotFoundException(id));

        requireVisible(poi);
        return toResponse(poi);
    }

    /**
     * Tìm POI bằng mã QR.
     *
     * Ví dụ:
     * HOIANGUIDE_POI_3
     * HOIANGUIDE_POI_4
     */
    @Transactional(readOnly = true)
    public PoiResponse getByQrCode(String qrCode) {
        Poi poi = poiRepository.findByQrCode(qrCode.trim())
                .orElseThrow(() -> new PoiNotFoundException(-1L));

        requireVisible(poi);
        return toResponse(poi);
    }

    public PoiResponse create(CreatePoiRequest request) {
        Poi poi = new Poi();

        poi.setName(request.getName().trim());
        poi.setDescription(request.getDescription().trim());
        poi.setLatitude(request.getLatitude());
        poi.setLongitude(request.getLongitude());
        poi.setRadius(request.getRadius());
        poi.setQrCode(request.getQrCode().trim());
        poi.setImageUrl(request.getImageUrl());
        poi.setCategory(request.getCategory()==null ? "heritage" : request.getCategory());

        poi.setStatus(
                request.getStatus() != null
                        ? request.getStatus()
                        : PoiStatus.ACTIVE
        );

        Poi savedPoi = poiRepository.saveAndFlush(poi);

        return toResponse(savedPoi);
    }

    public PoiResponse update(Long id, UpdatePoiRequest request) {
        mutationLock.acquire(id);
        Poi poi = poiRepository.findById(id)
                .orElseThrow(() -> new PoiNotFoundException(id));

        poi.setName(request.getName().trim());
        poi.setDescription(request.getDescription().trim());
        poi.setLatitude(request.getLatitude());
        poi.setLongitude(request.getLongitude());
        poi.setRadius(request.getRadius());
        poi.setQrCode(request.getQrCode().trim());
        if(request.getCategory()!=null)poi.setCategory(request.getCategory());
        if (request.hasImageUrl()) poi.setImageUrl(request.getImageUrl());
        poi.setStatus(request.getStatus());

        Poi updatedPoi = poiRepository.saveAndFlush(poi);

        return toResponse(updatedPoi);
    }

    public void delete(Long id) {
        mutationLock.acquire(id);
        Poi poi = poiRepository.findById(id)
                .orElseThrow(() -> new PoiNotFoundException(id));

        relatedContentGuard.requireEmpty(id);
        poiRepository.delete(poi);
    }

    private PoiResponse toResponse(Poi poi) {
        return new PoiResponse(
                poi.getId(),
                poi.getName(),
                poi.getDescription(),
                poi.getLatitude(),
                poi.getLongitude(),
                poi.getRadius(),
                poi.getQrCode(),
                poi.getImageUrl(),
                poi.getStatus(),poi.getCategory()
        );
    }
}