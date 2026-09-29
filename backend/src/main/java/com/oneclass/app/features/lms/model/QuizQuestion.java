package com.oneclass.app.features.lms.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "lms_quiz_questions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuizQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long quizId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private QuestionType type;

    @Column(nullable = false, length = 4000)
    private String prompt;

    @Column(nullable = false)
    private Integer marks;

    /** JSON array of option strings for MCQ. */
    @Column(length = 4000)
    private String optionsJson;

    private Integer correctOptionIndex;

    @Column(length = 4000)
    private String sampleAnswer;

    private Integer sortOrder;
}
