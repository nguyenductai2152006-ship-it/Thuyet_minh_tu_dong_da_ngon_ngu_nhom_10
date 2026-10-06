package com.sgu.localization.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class UpdateLocalizationRequest {

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