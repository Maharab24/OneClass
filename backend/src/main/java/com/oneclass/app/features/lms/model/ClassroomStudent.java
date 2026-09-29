package com.oneclass.app.features.lms.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "lms_classroom_students",
        uniqueConstraints = @UniqueConstraint(columnNames = {"classroom_id", "user_id"})
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClassroomStudent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "classroom_id", nullable = false)
    private Long classroomId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EnrollmentStatus status;

    private String paymentPhone;

    private LocalDateTime joinedAt;

    @PrePersist
    void onCreate() {
        if (joinedAt == null) {
            joinedAt = LocalDateTime.now();
        }
    }
}
