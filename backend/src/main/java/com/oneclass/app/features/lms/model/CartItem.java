package com.oneclass.app.features.lms.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "lms_cart_items",
        uniqueConstraints = @UniqueConstraint(columnNames = {"student_id", "course_id"})
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CartItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "student_id", nullable = false)
    private Long studentId;

    @Column(name = "course_id", nullable = false)
    private Long courseId;

    private LocalDateTime addedAt;

    @PrePersist
    void onCreate() {
        if (addedAt == null) {
            addedAt = LocalDateTime.now();
        }
    }
}
