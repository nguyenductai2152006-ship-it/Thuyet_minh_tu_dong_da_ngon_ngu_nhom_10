package com.sgu.audio.dto;

import com.sgu.audio.entity.Audio;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
public class AudioResponse {

    private Long id;
    private Long poiId;
    private String languageCode;
    private String audioUrl;
    private Integer durationSeconds;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static AudioResponse fromEntity(Audio entity) {
        AudioResponse response = new AudioResponse();

        response.setId(entity.getId());
        response.setPoiId(entity.getPoiId());
        response.setLanguageCode(entity.getLanguageCode());
        response.setAudioUrl(entity.getAudioUrl());
        response.setDurationSeconds(entity.getDurationSeconds());
        response.setCreatedAt(entity.getCreatedAt());
        response.setUpdatedAt(entity.getUpdatedAt());

        return response;
    }
}