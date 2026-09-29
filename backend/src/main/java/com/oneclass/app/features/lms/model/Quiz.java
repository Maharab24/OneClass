package com.oneclass.app.features.lms.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "lms_quizzes")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Quiz {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long classroomId;

    @Column(nullable = false)
    private String title;

    @Column(length = 4000)
    private String description;

    private Integer durationMinutes;

    private LocalDateTime deadline;

    @Builder.Default
    private Integer maxAttempts = 1;

    private boolean published;

    private LocalDateTime scheduledAt;

    private boolean showResultsToStudents;

    private Long createdById;

    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        createdAt = LocalDateTime.now();
        if (maxAttempts == null) {
            maxAttempts = 1;
        }
    }

    public boolean isOpen() {
        if (!published) {
            return false;
        }
        LocalDateTime now = LocalDateTime.now();
        if (scheduledAt != null && now.isBefore(scheduledAt)) {
            return false;
        }
        return deadline == null || !now.isAfter(deadline);
    }
}
