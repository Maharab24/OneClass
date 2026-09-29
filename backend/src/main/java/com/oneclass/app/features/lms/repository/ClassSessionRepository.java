package com.oneclass.app.features.lms.repository;

import com.oneclass.app.features.lms.model.ClassSession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ClassSessionRepository extends JpaRepository<ClassSession, Long> {
    List<ClassSession> findByClassroomIdOrderByStartsAtDesc(Long classroomId);
}
