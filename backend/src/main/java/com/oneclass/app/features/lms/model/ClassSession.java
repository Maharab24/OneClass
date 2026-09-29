package com.oneclass.app.features.lms.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "lms_class_sessions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClassSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long classroomId;

    @Column(nullable = false)
    private String title;

    @Column(length = 4000)
    private String description;

    private LocalDateTime startsAt;

    private LocalDateTime endsAt;

    private String meetingNote;

    private Long createdById;
}
