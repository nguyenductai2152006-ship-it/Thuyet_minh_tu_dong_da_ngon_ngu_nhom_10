package com.sgu.localization.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class CreateLocalizationRequest {

    @NotNull(message = "POI ID must not be null")
    @Positive(message = "POI ID must be positive")
    private Long poiId;

    @NotBlank(message = "Language code must not be blank")
    @Pattern(
            regexp = "(?i)^(vi|en|zh|ko|ja)$",
            message = "Language code must be vi, en, zh, ko or ja"
    )
    private String languageCode;

    @NotBlank(message = "Localized name must not be blank")
    @Size(max = 200)
    private String localizedName;

    @NotBlank(message = "Localized description must not be blank")
    @Size(max=10000)
    private String localizedDescription;
}