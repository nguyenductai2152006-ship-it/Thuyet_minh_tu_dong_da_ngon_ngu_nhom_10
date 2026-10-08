package com.sgu.audio.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class CreateAudioRequest {

    @NotNull(message = "POI ID must not be null")
    @Positive(message = "POI ID must be positive")
    private Long poiId;

    @NotBlank(message = "Language code must not be blank")
    @Pattern(
            regexp = "^[a-zA-Z]{2,10}$",
            message = "Language code must contain 2 to 10 letters"
    )
    private String languageCode;

    @NotBlank(message = "Audio URL must not be blank")
    private String audioUrl;

    @NotNull(message = "Duration must not be null")
    @PositiveOrZero(message = "Duration must be zero or positive")
    private Integer durationSeconds;
}