package com.sgu.poi.dto;

import com.sgu.poi.entity.PoiStatus;

import java.math.BigDecimal;

public class PoiResponse {

    private Long id;
    private String name;
    private String description;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private BigDecimal radius;
    private String imageUrl;
    private PoiStatus status;

    public PoiResponse() {
    }

    public PoiResponse(
            Long id,
            String name,
            String description,
            BigDecimal latitude,
            BigDecimal longitude,
            BigDecimal radius,
            String imageUrl,
            PoiStatus status
    ) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.latitude = latitude;
        this.longitude = longitude;
        this.radius = radius;
        this.imageUrl = imageUrl;
        this.status = status;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public BigDecimal getLatitude() {
        return latitude;
    }

    public void setLatitude(BigDecimal latitude) {
        this.latitude = latitude;
    }

    public BigDecimal getLongitude() {
        return longitude;
    }

    public void setLongitude(BigDecimal longitude) {
        this.longitude = longitude;
    }

    public BigDecimal getRadius() {
        return radius;
    }

    public void setRadius(BigDecimal radius) {
        this.radius = radius;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public PoiStatus getStatus() {
        return status;
    }

    public void setStatus(PoiStatus status) {
        this.status = status;
    }
}