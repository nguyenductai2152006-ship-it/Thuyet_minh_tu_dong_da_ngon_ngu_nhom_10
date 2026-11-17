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
    private final PoiReferenceValidator poiValidator;
    private final AudioPoiMutationLock mutationLock;

    public AudioService(
            AudioRepository repository,
            PoiReferenceValidator poiValidator,
            AudioPoiMutationLock mutationLock
    ) {
        this.repository = repository;
        this.poiValidator = poiValidator;
        this.mutationLock = mutationLock;
    }

    public AudioResponse create(CreateAudioRequest request) {

        Long poiId = request.getPoiId();

        mutationLock.acquire(poiId);
        poiValidator.requireExisting(poiId);

        String languageCode =
                normalizeLanguageCode(request.getLanguageCode());

        if (repository.existsByPoiIdAndLanguageCode(
                poiId,
                languageCode
        )) {
            throw new DuplicateAudioException(
                    "Audio already exists for POI "
                            + poiId
                            + " and language "
                            + languageCode
            );
        }

        Audio entity = new Audio();
        entity.setPoiId(poiId);
        entity.setLanguageCode(languageCode);
        entity.setAudioUrl(request.getAudioUrl().trim());
        entity.setDurationSeconds(request.getDurationSeconds());

        return AudioResponse.fromEntity(repository.save(entity));
    }

    @Transactional(readOnly = true)
    public AudioResponse findById(Long id) {

        Audio entity = getAudioOrThrow(id);

        poiValidator.requireReadable(entity.getPoiId());

        return AudioResponse.fromEntity(entity);
    }

    @Transactional(readOnly = true)
    public AudioResponse findByPoiIdAndLanguage(
            Long poiId,
            String languageCode
    ) {

        poiValidator.requireReadable(poiId);

        String normalizedLanguage =
                normalizeLanguageCode(languageCode);

        Audio entity = repository.findByPoiIdAndLanguageCode(
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

        poiValidator.requireReadable(poiId);

        return repository.findByPoiIdOrderByLanguageCodeAsc(poiId)
                .stream()
                .map(AudioResponse::fromEntity)
                .toList();
    }

    public AudioResponse update(
            Long id,
            UpdateAudioRequest request
    ) {

        Audio existing = getAudioOrThrow(id);

        Long poiId = existing.getPoiId();

        mutationLock.acquire(poiId);

        Audio entity = getAudioOrThrow(id);

        if (!poiId.equals(entity.getPoiId())) {
            throw new ResourceNotFoundException(
                    "Audio association changed. Please retry."
            );
        }

        poiValidator.requireExisting(poiId);

        String languageCode =
                normalizeLanguageCode(request.getLanguageCode());

        if (repository.existsByPoiIdAndLanguageCodeAndIdNot(
                poiId,
                languageCode,
                id
        )) {
            throw new DuplicateAudioException(
                    "Audio already exists for POI "
                            + poiId
                            + " and language "
                            + languageCode
            );
        }

        entity.setLanguageCode(languageCode);
        entity.setAudioUrl(request.getAudioUrl().trim());
        entity.setDurationSeconds(request.getDurationSeconds());

        return AudioResponse.fromEntity(repository.save(entity));
    }

    public void delete(Long id) {

        Audio existing = getAudioOrThrow(id);

        Long poiId = existing.getPoiId();

        mutationLock.acquire(poiId);

        Audio entity = getAudioOrThrow(id);

        if (!poiId.equals(entity.getPoiId())) {
            throw new ResourceNotFoundException(
                    "Audio association changed. Please retry."
            );
        }

        poiValidator.requireExisting(poiId);

        repository.delete(entity);
    }

    private Audio getAudioOrThrow(Long id) {

        return repository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Audio not found with id: " + id
                        )
                );
    }

    private String normalizeLanguageCode(String languageCode) {
        return languageCode.trim().toLowerCase();
    }
}
