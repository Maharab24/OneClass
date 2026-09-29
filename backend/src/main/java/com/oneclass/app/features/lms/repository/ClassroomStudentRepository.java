package com.oneclass.app.features.lms.repository;

import com.oneclass.app.features.lms.model.ClassroomStudent;
import com.oneclass.app.features.lms.model.EnrollmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ClassroomStudentRepository extends JpaRepository<ClassroomStudent, Long> {
    List<ClassroomStudent> findByClassroomId(Long classroomId);
    List<ClassroomStudent> findByUserId(Long userId);
    List<ClassroomStudent> findByUserIdAndStatus(Long userId, EnrollmentStatus status);
    Optional<ClassroomStudent> findByClassroomIdAndUserId(Long classroomId, Long userId);
    boolean existsByClassroomIdAndUserIdAndStatus(Long classroomId, Long userId, EnrollmentStatus status);
    long countByClassroomIdAndStatus(Long classroomId, EnrollmentStatus status);
}
