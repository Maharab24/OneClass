package com.oneclass.app.features.lms.repository;

import com.oneclass.app.features.lms.model.LiveClassSession;
import com.oneclass.app.features.lms.model.LiveClassStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface LiveClassSessionRepository extends JpaRepository<LiveClassSession, Long> {
    List<LiveClassSession> findByClassroomIdOrderByScheduledAtDesc(Long classroomId);
    List<LiveClassSession> findByClassroomIdAndStatus(Long classroomId, LiveClassStatus status);
    Optional<LiveClassSession> findFirstByClassroomIdAndStatusOrderByStartedAtDesc(Long classroomId, LiveClassStatus status);
}
