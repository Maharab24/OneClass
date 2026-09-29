package com.oneclass.app.features.lms.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "lms_live_classes")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LiveClassSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long classroomId;

    private Long courseId;

    @Column(nullable = false)
    private String title;

    @Column(length = 2000)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private LiveClassStatus status;

    private String whiteboardRoomCode;

    @Column(nullable = false)
    private Long startedById;

    private LocalDateTime scheduledAt;

    private LocalDateTime startedAt;

    private LocalDateTime endedAt;
}
