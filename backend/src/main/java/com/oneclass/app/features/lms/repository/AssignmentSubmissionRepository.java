package com.oneclass.app.features.lms.repository;

import com.oneclass.app.features.lms.model.AssignmentSubmission;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AssignmentSubmissionRepository extends JpaRepository<AssignmentSubmission, Long> {
    List<AssignmentSubmission> findByAssignmentId(Long assignmentId);
    Optional<AssignmentSubmission> findByAssignmentIdAndStudentId(Long assignmentId, Long studentId);
    List<AssignmentSubmission> findByStudentId(Long studentId);
}
