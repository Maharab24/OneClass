package com.oneclass.app.features.lms.repository;

import com.oneclass.app.features.lms.model.Assignment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AssignmentRepository extends JpaRepository<Assignment, Long> {
    List<Assignment> findByClassroomIdOrderByCreatedAtDesc(Long classroomId);
}
