package com.sgu.localization.dto;

import jakarta.validation.constraints.NotBlank;
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
            regexp = "^[a-zA-Z]{2,10}$",
            message = "Language code must contain 2 to 10 letters"
    )
    private String languageCode;

    @NotBlank(message = "Localized name must not be blank")
    private String localizedName;

    @NotBlank(message = "Localized description must not be blank")
    private String localizedDescription;
}