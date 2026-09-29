package com.oneclass.app.features.lms.repository;

import com.oneclass.app.features.lms.model.QuizAnswer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuizAnswerRepository extends JpaRepository<QuizAnswer, Long> {
    List<QuizAnswer> findByAttemptId(Long attemptId);
}
