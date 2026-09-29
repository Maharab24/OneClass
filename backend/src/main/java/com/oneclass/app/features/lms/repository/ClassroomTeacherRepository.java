package com.oneclass.app.features.lms.repository;

import com.oneclass.app.features.lms.model.ClassroomTeacher;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ClassroomTeacherRepository extends JpaRepository<ClassroomTeacher, Long> {
    List<ClassroomTeacher> findByUserId(Long userId);
    List<ClassroomTeacher> findByClassroomId(Long classroomId);
    Optional<ClassroomTeacher> findByClassroomIdAndUserId(Long classroomId, Long userId);
    boolean existsByClassroomIdAndUserId(Long classroomId, Long userId);
    @org.springframework.data.jpa.repository.Modifying(clearAutomatically = true)
    void deleteByClassroomIdAndUserId(Long classroomId, Long userId);
}
