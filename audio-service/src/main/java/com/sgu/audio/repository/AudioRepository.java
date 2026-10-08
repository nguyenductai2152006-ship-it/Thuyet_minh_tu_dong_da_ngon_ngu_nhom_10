package com.sgu.audio.repository;

import com.sgu.audio.entity.Audio;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AudioRepository extends JpaRepository<Audio, Long> {

    Optional<Audio> findByPoiIdAndLanguageCode(
            Long poiId,
            String languageCode
    );

    List<Audio> findByPoiIdOrderByLanguageCodeAsc(Long poiId);

    boolean existsByPoiIdAndLanguageCode(
            Long poiId,
            String languageCode
    );

    boolean existsByPoiIdAndLanguageCodeAndIdNot(
            Long poiId,
            String languageCode,
            Long id
    );
}