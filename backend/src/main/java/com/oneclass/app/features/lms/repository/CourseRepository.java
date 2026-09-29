package com.oneclass.app.features.lms.repository;

import com.oneclass.app.features.lms.model.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CourseRepository extends JpaRepository<Course, Long> {
    Optional<Course> findByCourseCode(String courseCode);
    boolean existsByCourseCode(String courseCode);
    List<Course> findByClassroomId(Long classroomId);
    List<Course> findByInstructorId(Long instructorId);
    List<Course> findByPublishedTrue();

    @Query("""
            SELECT c FROM Course c
            WHERE c.published = true
              AND (
                    :q IS NULL OR :q = ''
                    OR LOWER(c.title) LIKE LOWER(CONCAT('%', :q, '%'))
                    OR LOWER(c.courseCode) LIKE LOWER(CONCAT('%', :q, '%'))
                    OR LOWER(COALESCE(c.keywords, '')) LIKE LOWER(CONCAT('%', :q, '%'))
                    OR LOWER(COALESCE(c.subject, '')) LIKE LOWER(CONCAT('%', :q, '%'))
                    OR LOWER(COALESCE(c.category, '')) LIKE LOWER(CONCAT('%', :q, '%'))
                    OR LOWER(COALESCE(c.description, '')) LIKE LOWER(CONCAT('%', :q, '%'))
              )
              AND (:category IS NULL OR :category = '' OR LOWER(c.category) = LOWER(:category))
              AND (:subject IS NULL OR :subject = '' OR LOWER(c.subject) = LOWER(:subject))
            ORDER BY c.createdAt DESC
            """)
    List<Course> searchPublished(@Param("q") String q, @Param("category") String category, @Param("subject") String subject);
}
