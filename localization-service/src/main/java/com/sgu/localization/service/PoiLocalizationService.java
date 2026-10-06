package com.sgu.localization.service;

import com.sgu.localization.dto.CreateLocalizationRequest;
import com.sgu.localization.dto.LocalizationResponse;
import com.sgu.localization.dto.UpdateLocalizationRequest;
import com.sgu.localization.entity.PoiLocalization;
import com.sgu.localization.exception.DuplicateLocalizationException;
import com.sgu.localization.exception.ResourceNotFoundException;
import com.sgu.localization.repository.PoiLocalizationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class PoiLocalizationService {

    private final PoiLocalizationRepository repository;

    public PoiLocalizationService(PoiLocalizationRepository repository) {
        this.repository = repository;
    }

    public LocalizationResponse create(CreateLocalizationRequest request) {
        String languageCode = normalizeLanguageCode(request.getLanguageCode());

        if (repository.existsByPoiIdAndLanguageCode(
                request.getPoiId(),
                languageCode
        )) {
            throw new DuplicateLocalizationException(
                    "Localization already exists for POI "
                            + request.getPoiId()
                            + " and language "
                            + languageCode
            );
        }

        PoiLocalization entity = new PoiLocalization();
        entity.setPoiId(request.getPoiId());
        entity.setLanguageCode(languageCode);
        entity.setLocalizedName(request.getLocalizedName().trim());
        entity.setLocalizedDescription(
                request.getLocalizedDescription().trim()
        );

        return LocalizationResponse.fromEntity(
                repository.save(entity)
        );
    }

    @Transactional(readOnly = true)
    public LocalizationResponse findById(Long id) {
        PoiLocalization entity = repository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Localization not found with id: " + id
                        )
                );

        return LocalizationResponse.fromEntity(entity);
    }

    @Transactional(readOnly = true)
    public LocalizationResponse findByPoiIdAndLanguage(
            Long poiId,
            String languageCode
    ) {
        String normalizedLanguage =
                normalizeLanguageCode(languageCode);

        PoiLocalization entity =
                repository.findByPoiIdAndLanguageCode(
                        poiId,
                        normalizedLanguage
                ).orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Localization not found for POI "
                                        + poiId
                                        + " and language "
                                        + normalizedLanguage
                        )
                );

        return LocalizationResponse.fromEntity(entity);
    }

    @Transactional(readOnly = true)
    public List<LocalizationResponse> findByPoiId(Long poiId) {
        return repository.findByPoiIdOrderByLanguageCodeAsc(poiId)
                .stream()
                .map(LocalizationResponse::fromEntity)
                .toList();
    }

    public LocalizationResponse update(
            Long id,
            UpdateLocalizationRequest request
    ) {
        PoiLocalization entity = repository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Localization not found with id: " + id
                        )
                );

        String languageCode =
                normalizeLanguageCode(request.getLanguageCode());

        if (!entity.getLanguageCode().equals(languageCode)
                && repository.existsByPoiIdAndLanguageCodeAndIdNot(
                        entity.getPoiId(),
                        languageCode,
                        id
        )) {
            throw new DuplicateLocalizationException(
                    "Localization already exists for POI "
                            + entity.getPoiId()
                            + " and language "
                            + languageCode
            );
        }

        entity.setLanguageCode(languageCode);
        entity.setLocalizedName(request.getLocalizedName().trim());
        entity.setLocalizedDescription(
                request.getLocalizedDescription().trim()
        );

        return LocalizationResponse.fromEntity(
                repository.save(entity)
        );
    }

    public void delete(Long id) {
        PoiLocalization entity = repository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Localization not found with id: " + id
                        )
                );

        repository.delete(entity);
    }

    private String normalizeLanguageCode(String languageCode) {
        return languageCode.trim().toLowerCase();
    }
}