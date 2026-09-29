package com.oneclass.app.features.lms.repository;

import com.oneclass.app.features.lms.model.CalendarEvent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CalendarEventRepository extends JpaRepository<CalendarEvent, Long> {
    List<CalendarEvent> findByClassroomIdOrderByStartsAtAsc(Long classroomId);
}
