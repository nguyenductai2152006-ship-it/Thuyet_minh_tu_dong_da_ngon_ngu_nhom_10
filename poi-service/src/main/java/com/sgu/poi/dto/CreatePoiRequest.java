package com.sgu.poi.dto;

import com.sgu.poi.entity.PoiStatus;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public class CreatePoiRequest {

    @NotBlank(message = "Name must not be blank")
    @Size(max = 200, message = "Name must not exceed 200 characters")
    private String name;

    @NotBlank(message = "Description must not be blank")
    @Size(max=10000)
    private String description;

    @NotNull(message = "Latitude is required")
    @DecimalMin(value = "-90.0", message = "Latitude must be >= -90")
    @DecimalMax(value = "90.0", message = "Latitude must be <= 90")
    @jakarta.validation.constraints.Digits(integer=3,fraction=7)
    private BigDecimal latitude;

    @NotNull(message = "Longitude is required")
    @DecimalMin(value = "-180.0", message = "Longitude must be >= -180")
    @DecimalMax(value = "180.0", message = "Longitude must be <= 180")
    @jakarta.validation.constraints.Digits(integer=3,fraction=7)
    private BigDecimal longitude;

    @NotNull(message = "Radius is required")
    @DecimalMin(
            value = "1.0",
            inclusive = true,
            message = "Radius must be greater than 0"
    )
    @DecimalMax("5000")
    @jakarta.validation.constraints.Digits(integer=4,fraction=2)
    private BigDecimal radius;

    @NotBlank(message = "QR Code must not be blank")
    @Size(max = 100, message = "QR Code must not exceed 100 characters")
    @jakarta.validation.constraints.Pattern(regexp="^[^\\s/?#:\\\\]+$")
    private String qrCode;

    @Size(max = 500, message = "Image URL must not exceed 500 characters")
    private String imageUrl;

    private PoiStatus status;

    @jakarta.validation.constraints.Pattern(regexp="^(history|oldhouse|assembly|market|heritage)$")
    private String category;
    public String getCategory(){return category;}
    public void setCategory(String value){category=value;}
    public CreatePoiRequest() {
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

    public String getQrCode() {
        return qrCode;
    }

    public void setQrCode(String qrCode) {
        this.qrCode = qrCode;
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