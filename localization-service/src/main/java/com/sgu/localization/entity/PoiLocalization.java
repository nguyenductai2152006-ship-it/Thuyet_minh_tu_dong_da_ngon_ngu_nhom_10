package com.sgu.localization.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "poi_localizations",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_poi_language",
                        columnNames = {"poi_id", "language_code"}
                )
        }
)
@Getter
@Setter
@NoArgsConstructor
public class PoiLocalization {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * ID của POI thuộc POI Service.
     * Không tạo Foreign Key sang poi_db.
     */
    @Column(name = "poi_id", nullable = false)
    private Long poiId;

    /**
     * Mã ngôn ngữ: vi, en, ja, ko...
     */
    @Column(name = "language_code", nullable = false, length = 10)
    private String languageCode;

    /**
     * Tên POI theo ngôn ngữ.
     */
    @Column(name = "localized_name", nullable = false, length = 200)
    private String localizedName;

    /**
     * Mô tả POI theo ngôn ngữ.
     */
    @Column(
            name = "localized_description",
            nullable = false,
            columnDefinition = "TEXT"
    )
    private String localizedDescription;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}