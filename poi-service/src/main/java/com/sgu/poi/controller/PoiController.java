package com.sgu.poi.controller;

import com.sgu.poi.dto.CreatePoiRequest;
import com.sgu.poi.dto.PoiResponse;
import com.sgu.poi.dto.UpdatePoiRequest;
import com.sgu.poi.service.PoiService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/pois")
public class PoiController {

    private final PoiService poiService;

    public PoiController(PoiService poiService) {
        this.poiService = poiService;
    }

    @GetMapping
    public ResponseEntity<List<PoiResponse>> getAll() {
        return ResponseEntity.ok(poiService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PoiResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(poiService.getById(id));
    }

    @PostMapping
    public ResponseEntity<PoiResponse> create(
            @Valid @RequestBody CreatePoiRequest request
    ) {
        PoiResponse response = poiService.create(request);

        return ResponseEntity
                .created(URI.create("/api/pois/" + response.getId()))
                .body(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<PoiResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody UpdatePoiRequest request
    ) {
        return ResponseEntity.ok(poiService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        poiService.delete(id);

        return ResponseEntity.noContent().build();
    }
}