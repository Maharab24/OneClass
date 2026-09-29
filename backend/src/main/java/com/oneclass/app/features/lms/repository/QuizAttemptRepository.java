package com.oneclass.app.features.lms.repository;

import com.oneclass.app.features.lms.model.QuizAttempt;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface QuizAttemptRepository extends JpaRepository<QuizAttempt, Long> {
    List<QuizAttempt> findByQuizId(Long quizId);
    List<QuizAttempt> findByQuizIdAndStudentIdOrderByAttemptNumberDesc(Long quizId, Long studentId);
    Optional<QuizAttempt> findByIdAndStudentId(Long id, Long studentId);
    long countByQuizIdAndStudentId(Long quizId, Long studentId);
}
