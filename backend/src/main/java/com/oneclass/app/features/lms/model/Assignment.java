package com.oneclass.app.features.lms.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "lms_assignments")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Assignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long classroomId;

    @Column(nullable = false)
    private String title;

    @Column(length = 8000)
    private String description;

    private LocalDateTime deadline;

    private Integer maxMarks;

    private boolean published;

    private String questionFileName;

    private String questionFileUrl;

    private Long createdById;

    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
