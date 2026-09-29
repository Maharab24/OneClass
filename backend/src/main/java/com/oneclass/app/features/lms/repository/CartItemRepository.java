package com.oneclass.app.features.lms.repository;

import com.oneclass.app.features.lms.model.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;

import java.util.List;
import java.util.Optional;

public interface CartItemRepository extends JpaRepository<CartItem, Long> {
    List<CartItem> findByStudentIdOrderByAddedAtDesc(Long studentId);
    Optional<CartItem> findByStudentIdAndCourseId(Long studentId, Long courseId);
    @Modifying(clearAutomatically = true)
    void deleteByStudentIdAndCourseId(Long studentId, Long courseId);
}
