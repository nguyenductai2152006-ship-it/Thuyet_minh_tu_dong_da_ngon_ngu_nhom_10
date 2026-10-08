package com.sgu.audio.controller;

import com.sgu.audio.dto.AudioResponse;
import com.sgu.audio.dto.CreateAudioRequest;
import com.sgu.audio.dto.UpdateAudioRequest;
import com.sgu.audio.service.AudioService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/audio")
public class AudioController {

    private final AudioService service;

    public AudioController(AudioService service) {
        this.service = service;
    }

    @GetMapping("/{id}")
    public ResponseEntity<AudioResponse> findById(
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(
                service.findById(id)
        );
    }

    @GetMapping
    public ResponseEntity<?> find(
            @RequestParam(required = false) Long poiId,
            @RequestParam(required = false) String lang
    ) {
        if (poiId == null) {
            return ResponseEntity
                    .badRequest()
                    .body("poiId is required");
        }

        if (lang != null && !lang.isBlank()) {
            return ResponseEntity.ok(
                    service.findByPoiIdAndLanguage(
                            poiId,
                            lang
                    )
            );
        }

        return ResponseEntity.ok(
                service.findByPoiId(poiId)
        );
    }

    @GetMapping("/poi/{poiId}")
    public ResponseEntity<List<AudioResponse>> findByPoiId(
            @PathVariable Long poiId
    ) {
        return ResponseEntity.ok(
                service.findByPoiId(poiId)
        );
    }

    @PostMapping
    public ResponseEntity<AudioResponse> create(
            @Valid @RequestBody CreateAudioRequest request
    ) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(service.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AudioResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody UpdateAudioRequest request
    ) {
        return ResponseEntity.ok(
                service.update(id, request)
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id
    ) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}