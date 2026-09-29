package com.oneclass.app.features.lms.repository;

import com.oneclass.app.features.lms.model.CourseReview;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CourseReviewRepository extends JpaRepository<CourseReview, Long> {
    List<CourseReview> findByCourseIdOrderByCreatedAtDesc(Long courseId);
    Optional<CourseReview> findByCourseIdAndStudentId(Long courseId, Long studentId);
}
