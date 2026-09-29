package com.oneclass.app.features.lms.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "lms_quiz_answers")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuizAnswer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long attemptId;

    @Column(nullable = false)
    private Long questionId;

    private Integer selectedOptionIndex;

    @Column(length = 4000)
    private String shortAnswer;

    private Double marksAwarded;

    private boolean graded;
}
