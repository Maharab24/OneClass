package com.oneclass.app.features.lms.repository;

import com.oneclass.app.features.lms.model.QuizQuestion;
import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface QuizQuestionRepository extends JpaRepository<QuizQuestion, Long> {
    List<QuizQuestion> findByQuizIdOrderBySortOrderAscIdAsc(Long quizId);

    @Modifying(clearAutomatically = true)
    @Query("delete from QuizQuestion q where q.quizId = :quizId")
    void deleteByQuizId(@Param("quizId") Long quizId);
}
