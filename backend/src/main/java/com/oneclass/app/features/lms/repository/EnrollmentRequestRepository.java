package com.oneclass.app.features.lms.repository;

import com.oneclass.app.features.lms.model.EnrollmentRequest;
import com.oneclass.app.features.lms.model.EnrollmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EnrollmentRequestRepository extends JpaRepository<EnrollmentRequest, Long> {
    List<EnrollmentRequest> findByStudentIdOrderByCreatedAtDesc(Long studentId);
    List<EnrollmentRequest> findByClassroomIdOrderByCreatedAtDesc(Long classroomId);
    List<EnrollmentRequest> findByClassroomIdAndStatus(Long classroomId, EnrollmentStatus status);
    Optional<EnrollmentRequest> findFirstByCourseIdAndStudentIdOrderByCreatedAtDesc(Long courseId, Long studentId);
    boolean existsByCourseIdAndStudentIdAndStatus(Long courseId, Long studentId, EnrollmentStatus status);
}
