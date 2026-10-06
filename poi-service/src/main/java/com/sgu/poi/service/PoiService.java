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

@Service
@Transactional
public class PoiService {

    private final PoiRepository poiRepository;

    public PoiService(PoiRepository poiRepository) {
        this.poiRepository = poiRepository;
    }

    @Transactional(readOnly = true)
    public List<PoiResponse> getAll() {
        return poiRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public PoiResponse getById(Long id) {
        Poi poi = poiRepository.findById(id)
                .orElseThrow(() -> new PoiNotFoundException(id));

        return toResponse(poi);
    }

    public PoiResponse create(CreatePoiRequest request) {
        Poi poi = new Poi();

        poi.setName(request.getName().trim());
        poi.setDescription(request.getDescription().trim());
        poi.setLatitude(request.getLatitude());
        poi.setLongitude(request.getLongitude());
        poi.setRadius(request.getRadius());
        poi.setImageUrl(request.getImageUrl());

        poi.setStatus(
                request.getStatus() != null
                        ? request.getStatus()
                        : PoiStatus.ACTIVE
        );

        Poi savedPoi = poiRepository.save(poi);

        return toResponse(savedPoi);
    }

    public PoiResponse update(Long id, UpdatePoiRequest request) {
        Poi poi = poiRepository.findById(id)
                .orElseThrow(() -> new PoiNotFoundException(id));

        poi.setName(request.getName().trim());
        poi.setDescription(request.getDescription().trim());
        poi.setLatitude(request.getLatitude());
        poi.setLongitude(request.getLongitude());
        poi.setRadius(request.getRadius());
        poi.setImageUrl(request.getImageUrl());
        poi.setStatus(request.getStatus());

        Poi updatedPoi = poiRepository.save(poi);

        return toResponse(updatedPoi);
    }

    public void delete(Long id) {
        Poi poi = poiRepository.findById(id)
                .orElseThrow(() -> new PoiNotFoundException(id));

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
                poi.getImageUrl(),
                poi.getStatus()
        );
    }
}