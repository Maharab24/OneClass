package com.oneclass.app.features.lms.repository;

import com.oneclass.app.features.lms.model.Announcement;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AnnouncementRepository extends JpaRepository<Announcement, Long> {
    List<Announcement> findByClassroomIdOrderByPinnedDescCreatedAtDesc(Long classroomId);
}
