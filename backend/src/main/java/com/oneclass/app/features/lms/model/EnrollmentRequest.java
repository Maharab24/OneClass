package com.oneclass.app.features.lms.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "lms_enrollment_requests")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EnrollmentRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long courseId;

    @Column(nullable = false)
    private Long classroomId;

    @Column(nullable = false)
    private Long studentId;

    @Column(nullable = false)
    private String paymentPhone;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EnrollmentStatus status;

    @Column(length = 2000)
    private String studentNote;

    @Column(length = 2000)
    private String reviewNote;

    private Long reviewedById;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime reviewedAt;

    @PrePersist
    void onCreate() {
        createdAt = LocalDateTime.now();
        if (status == null) {
            status = EnrollmentStatus.PENDING;
        }
    }
}
