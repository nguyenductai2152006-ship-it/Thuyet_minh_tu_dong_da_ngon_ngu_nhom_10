package com.sgu.audio.service;

import com.sgu.audio.dto.AudioResponse;
import com.sgu.audio.dto.CreateAudioRequest;
import com.sgu.audio.dto.UpdateAudioRequest;
import com.sgu.audio.entity.Audio;
import com.sgu.audio.exception.DuplicateAudioException;
import com.sgu.audio.exception.ResourceNotFoundException;
import com.sgu.audio.repository.AudioRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class AudioService {

    private final AudioRepository repository;

    public AudioService(AudioRepository repository) {
        this.repository = repository;
    }

    public AudioResponse create(CreateAudioRequest request) {

        String languageCode =
                normalizeLanguageCode(request.getLanguageCode());

        if (repository.existsByPoiIdAndLanguageCode(
                request.getPoiId(),
                languageCode
        )) {
            throw new DuplicateAudioException(
                    "Audio already exists for POI "
                            + request.getPoiId()
                            + " and language "
                            + languageCode
            );
        }

        Audio entity = new Audio();

        entity.setPoiId(request.getPoiId());
        entity.setLanguageCode(languageCode);
        entity.setAudioUrl(request.getAudioUrl().trim());
        entity.setDurationSeconds(request.getDurationSeconds());

        return AudioResponse.fromEntity(
                repository.save(entity)
        );
    }

    @Transactional(readOnly = true)
    public AudioResponse findById(Long id) {

        Audio entity = repository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Audio not found with id: " + id
                        )
                );

        return AudioResponse.fromEntity(entity);
    }

    @Transactional(readOnly = true)
    public AudioResponse findByPoiIdAndLanguage(
            Long poiId,
            String languageCode
    ) {

        String normalizedLanguage =
                normalizeLanguageCode(languageCode);

        Audio entity =
                repository.findByPoiIdAndLanguageCode(
                                poiId,
                                normalizedLanguage
                        )
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Audio not found for POI "
                                                + poiId
                                                + " and language "
                                                + normalizedLanguage
                                )
                        );

        return AudioResponse.fromEntity(entity);
    }

    @Transactional(readOnly = true)
    public List<AudioResponse> findByPoiId(Long poiId) {

        return repository
                .findByPoiIdOrderByLanguageCodeAsc(poiId)
                .stream()
                .map(AudioResponse::fromEntity)
                .toList();
    }

    public AudioResponse update(
            Long id,
            UpdateAudioRequest request
    ) {

        Audio entity = repository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Audio not found with id: " + id
                        )
                );

        String languageCode =
                normalizeLanguageCode(request.getLanguageCode());

        if (repository.existsByPoiIdAndLanguageCodeAndIdNot(
                entity.getPoiId(),
                languageCode,
                id
        )) {
            throw new DuplicateAudioException(
                    "Audio already exists for POI "
                            + entity.getPoiId()
                            + " and language "
                            + languageCode
            );
        }

        entity.setLanguageCode(languageCode);
        entity.setAudioUrl(request.getAudioUrl().trim());
        entity.setDurationSeconds(request.getDurationSeconds());

        return AudioResponse.fromEntity(
                repository.save(entity)
        );
    }

    public void delete(Long id) {

        Audio entity = repository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Audio not found with id: " + id
                        )
                );

        repository.delete(entity);
    }

    private String normalizeLanguageCode(String languageCode) {

        return languageCode.trim().toLowerCase();
    }
}