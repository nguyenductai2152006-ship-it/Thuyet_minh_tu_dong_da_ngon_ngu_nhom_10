package com.sgu.localization.controller;

import com.sgu.localization.dto.CreateLocalizationRequest;
import com.sgu.localization.dto.LocalizationResponse;
import com.sgu.localization.dto.UpdateLocalizationRequest;
import com.sgu.localization.service.PoiLocalizationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/localizations")
public class PoiLocalizationController {

    private final PoiLocalizationService service;

    public PoiLocalizationController(PoiLocalizationService service) {
        this.service = service;
    }

    /**
     * GET /api/localizations/{id}
     *
     * Lấy một bản dịch theo ID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<LocalizationResponse> findById(
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(service.findById(id));
    }

    /**
     * GET /api/localizations?poiId=3&lang=en
     *
     * Lấy bản dịch của một POI theo ngôn ngữ.
     *
     * Nếu chỉ có poiId:
     * GET /api/localizations?poiId=3
     * → trả tất cả ngôn ngữ của POI.
     */
    @GetMapping
    public ResponseEntity<?> find(
            @RequestParam(required = false) Long poiId,
            @RequestParam(required = false) String lang
    ) {
        if (poiId == null) {
            return ResponseEntity.badRequest().body(
                    "poiId is required"
            );
        }

        if (lang != null && !lang.isBlank()) {
            return ResponseEntity.ok(
                    service.findByPoiIdAndLanguage(poiId, lang)
            );
        }

        return ResponseEntity.ok(
                service.findByPoiId(poiId)
        );
    }

    /**
     * GET /api/localizations/poi/3
     *
     * Lấy tất cả bản dịch của POI.
     */
    @GetMapping("/poi/{poiId}")
    public ResponseEntity<List<LocalizationResponse>> findByPoiId(
            @PathVariable Long poiId
    ) {
        return ResponseEntity.ok(
                service.findByPoiId(poiId)
        );
    }

    /**
     * POST /api/localizations
     *
     * Tạo bản dịch mới.
     */
    @PostMapping
    public ResponseEntity<LocalizationResponse> create(
            @Valid @RequestBody CreateLocalizationRequest request
    ) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(service.create(request));
    }

    /**
     * PUT /api/localizations/{id}
     *
     * Cập nhật bản dịch.
     */
    @PutMapping("/{id}")
    public ResponseEntity<LocalizationResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody UpdateLocalizationRequest request
    ) {
        return ResponseEntity.ok(
                service.update(id, request)
        );
    }

    /**
     * DELETE /api/localizations/{id}
     *
     * Xóa bản dịch.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id
    ) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}