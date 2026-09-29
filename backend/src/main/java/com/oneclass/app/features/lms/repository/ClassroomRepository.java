package com.oneclass.app.features.lms.repository;

import com.oneclass.app.features.lms.model.Classroom;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ClassroomRepository extends JpaRepository<Classroom, Long> {
    Optional<Classroom> findByInviteCode(String inviteCode);
    List<Classroom> findByCreatorId(Long creatorId);
    boolean existsByInviteCode(String inviteCode);
}
