package com.sgu.localization.repository;

import com.sgu.localization.entity.PoiLocalization;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PoiLocalizationRepository
        extends JpaRepository<PoiLocalization, Long> {

    Optional<PoiLocalization> findByPoiIdAndLanguageCode(
            Long poiId,
            String languageCode
    );

    List<PoiLocalization> findByPoiIdOrderByLanguageCodeAsc(
            Long poiId
    );

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