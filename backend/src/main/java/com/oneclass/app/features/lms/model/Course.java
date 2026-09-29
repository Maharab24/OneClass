package com.oneclass.app.features.lms.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "lms_courses",
        indexes = {
                @Index(name = "idx_lms_course_code", columnList = "courseCode", unique = true),
                @Index(name = "idx_lms_course_published", columnList = "published")
        }
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Course {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 16)
    private String courseCode;

    @Column(nullable = false)
    private String title;

    @Column(length = 8000)
    private String description;

    private String category;

    private String subject;

    private String keywords;

    private String thumbnailUrl;

    @Column(precision = 12, scale = 2)
    private BigDecimal price;

    @Builder.Default
    private String currency = "USD";

    @Column(nullable = false)
    private Long classroomId;

    @Column(nullable = false)
    private Long instructorId;

    private boolean published;

    @Builder.Default
    private Double averageRating = 0.0;

    @Builder.Default
    private Integer reviewCount = 0;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = createdAt;
        if (price == null) {
            price = BigDecimal.ZERO;
        }
        if (currency == null) {
            currency = "USD";
        }
        if (averageRating == null) {
            averageRating = 0.0;
        }
        if (reviewCount == null) {
            reviewCount = 0;
        }
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
