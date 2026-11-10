package com.sgu.poi.controller;
import com.sgu.poi.dto.PoiResponse;
import com.sgu.poi.service.PoiService;
import org.springframework.web.bind.annotation.*;
import java.util.List;
@RestController
@RequestMapping("/api/admin/pois")
public class AdminPoiController {
    private final PoiService service;
    public AdminPoiController(PoiService service) { this.service = service; }
    @GetMapping public List<PoiResponse> getAll() { return service.getAllForAdmin(); }
}
