package com.sgu.audio.service;

import com.sgu.audio.dto.AudioResponse;
import com.sgu.audio.dto.CreateAudioRequest;
import com.sgu.audio.entity.Audio;
import com.sgu.audio.exception.DuplicateAudioException;
import com.sgu.audio.repository.AudioRepository;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.doThrow;

@ExtendWith(MockitoExtension.class)
class AudioServiceTest {

    @Mock
    private AudioRepository repository;

    @Mock
    private PoiReferenceValidator poiValidator;

    @Mock
    private AudioPoiMutationLock mutationLock;

    @InjectMocks
    private AudioService audioService;

    private CreateAudioRequest createRequest;

    @BeforeEach
    void setUp() {
        createRequest = new CreateAudioRequest();
        createRequest.setPoiId(10L);
        createRequest.setLanguageCode("EN");
        createRequest.setAudioUrl(" https://example.com/audio.mp3 ");
        createRequest.setDurationSeconds(120);
    }

    @Test
    void shouldCreateAudioSuccessfully() {

        when(repository.existsByPoiIdAndLanguageCode(10L, "en"))
                .thenReturn(false);

        when(repository.save(any(Audio.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        AudioResponse response = audioService.create(createRequest);

        verify(mutationLock).acquire(10L);
        verify(poiValidator).requireExisting(10L);

        assertEquals(10L, response.getPoiId());
        assertEquals("en", response.getLanguageCode());
        assertEquals(
                "https://example.com/audio.mp3",
                response.getAudioUrl()
        );
        assertEquals(120, response.getDurationSeconds());
    }

    @Test
    void shouldRejectAudioWhenPoiCannotBeVerified() {

doThrow(new ResponseStatusException(
        HttpStatus.BAD_REQUEST,
        "POI does not exist"
)).when(poiValidator).requireExisting(10L);

        assertThrows(
                ResponseStatusException.class,
                () -> audioService.create(createRequest)
        );

        verify(mutationLock).acquire(10L);
        verify(repository, never()).save(any(Audio.class));
    }

    @Test
    void shouldRejectDuplicateAudioLanguage() {

        when(repository.existsByPoiIdAndLanguageCode(10L, "en"))
                .thenReturn(true);

        assertThrows(
                DuplicateAudioException.class,
                () -> audioService.create(createRequest)
        );

        verify(repository, never()).save(any(Audio.class));
    }

    @Test
    void shouldHideAudioWhenPoiIsNotReadable() {

        Audio audio = new Audio();
        audio.setId(1L);
        audio.setPoiId(10L);
        audio.setLanguageCode("en");
        audio.setAudioUrl("https://example.com/audio.mp3");
        audio.setDurationSeconds(120);

        when(repository.findById(1L))
                .thenReturn(Optional.of(audio));

doThrow(new ResponseStatusException(
        HttpStatus.NOT_FOUND,
        "POI not found"
)).when(poiValidator).requireReadable(10L);

        assertThrows(
                ResponseStatusException.class,
                () -> audioService.findById(1L)
        );

        verify(poiValidator).requireReadable(10L);
    }

    @Test
    void shouldAcquireLockAndVerifyPoiBeforeDelete() {

        Audio audio = new Audio();
        audio.setId(1L);
        audio.setPoiId(10L);

        when(repository.findById(1L))
                .thenReturn(Optional.of(audio));

        audioService.delete(1L);

        verify(mutationLock).acquire(10L);
        verify(poiValidator).requireExisting(10L);
        verify(repository).delete(audio);
    }
}
