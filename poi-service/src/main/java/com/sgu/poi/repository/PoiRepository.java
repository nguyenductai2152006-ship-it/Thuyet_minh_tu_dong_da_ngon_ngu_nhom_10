package com.sgu.poi.repository;

import com.sgu.poi.entity.Poi;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PoiRepository extends JpaRepository<Poi, Long> {

    Optional<Poi> findByQrCode(String qrCode);
}