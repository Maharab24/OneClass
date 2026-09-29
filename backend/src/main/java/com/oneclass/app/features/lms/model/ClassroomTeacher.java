package com.oneclass.app.features.lms.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(
        name = "lms_classroom_teachers",
        uniqueConstraints = @UniqueConstraint(columnNames = {"classroom_id", "user_id"})
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClassroomTeacher {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "classroom_id", nullable = false)
    private Long classroomId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "lms_classroom_teacher_permissions", joinColumns = @JoinColumn(name = "classroom_teacher_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "permission")
    @Builder.Default
    private Set<ClassroomPermission> permissions = new HashSet<>();

    private LocalDateTime addedAt;

    @PrePersist
    void onCreate() {
        if (addedAt == null) {
            addedAt = LocalDateTime.now();
        }
    }

    public boolean isAdmin() {
        return permissions != null && permissions.contains(ClassroomPermission.ADMIN);
    }

    public boolean has(ClassroomPermission permission) {
        if (permissions == null) {
            return false;
        }
        return permissions.contains(ClassroomPermission.ADMIN) || permissions.contains(permission);
    }
}
