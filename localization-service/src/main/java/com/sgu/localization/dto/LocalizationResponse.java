package com.sgu.localization.dto;

import com.sgu.localization.entity.PoiLocalization;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
public class LocalizationResponse {

    private Long id;
    private Long poiId;
    private String languageCode;
    private String localizedName;
    private String localizedDescription;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static LocalizationResponse fromEntity(PoiLocalization entity) {
        LocalizationResponse response = new LocalizationResponse();

        response.setId(entity.getId());
        response.setPoiId(entity.getPoiId());
        response.setLanguageCode(entity.getLanguageCode());
        response.setLocalizedName(entity.getLocalizedName());
        response.setLocalizedDescription(entity.getLocalizedDescription());
        response.setCreatedAt(entity.getCreatedAt());
        response.setUpdatedAt(entity.getUpdatedAt());

        return response;
    }
}