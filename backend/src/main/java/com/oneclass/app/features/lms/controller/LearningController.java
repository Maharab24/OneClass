package com.oneclass.app.features.lms.controller;

import com.oneclass.app.features.lms.dto.LmsDtos;
import com.oneclass.app.features.lms.service.CurrentUserService;
import com.oneclass.app.features.lms.service.LearningService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/lms/classrooms/{classroomId}")
@RequiredArgsConstructor
public class LearningController {

    private final LearningService learningService;
    private final CurrentUserService currentUserService;

    @GetMapping("/live-classes")
    public List<LmsDtos.LiveClassDto> liveClasses(@PathVariable Long classroomId, Authentication auth) {
        return learningService.listLive(classroomId, currentUserService.require(auth));
    }

    @GetMapping("/live-classes/current")
    public ResponseEntity<LmsDtos.LiveClassDto> currentLive(@PathVariable Long classroomId, Authentication auth) {
        LmsDtos.LiveClassDto current = learningService.currentLive(classroomId, currentUserService.require(auth));
        if (current == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(current);
    }

    @PostMapping("/live-classes")
    public LmsDtos.LiveClassDto createLive(@PathVariable Long classroomId, @Valid @RequestBody LmsDtos.LiveClassCreateRequest request, Authentication auth) {
        return learningService.createLiveClass(classroomId, currentUserService.require(auth), request);
    }

    @PostMapping("/live-classes/start")
    public Map<String, Object> startImmediate(@PathVariable Long classroomId, @Valid @RequestBody LmsDtos.LiveClassCreateRequest request, Authentication auth) {
        var result = learningService.startImmediate(classroomId, currentUserService.require(auth), request);
        return Map.of("liveClass", result.liveClass(), "room", result.room());
    }

    @PostMapping("/live-classes/{liveId}/start")
    public Map<String, Object> start(@PathVariable Long classroomId, @PathVariable Long liveId, Authentication auth) {
        var result = learningService.startLiveClass(classroomId, liveId, currentUserService.require(auth));
        return Map.of("liveClass", result.liveClass(), "room", result.room());
    }

    @PostMapping("/live-classes/{liveId}/end")
    public LmsDtos.LiveClassDto end(@PathVariable Long classroomId, @PathVariable Long liveId, Authentication auth) {
        return learningService.endLiveClass(classroomId, liveId, currentUserService.require(auth));
    }

    @GetMapping("/classes")
    public List<LmsDtos.ClassSessionDto> classes(@PathVariable Long classroomId, Authentication auth) {
        return learningService.listClasses(classroomId, currentUserService.require(auth));
    }

    @PostMapping("/classes")
    public LmsDtos.ClassSessionDto createClass(@PathVariable Long classroomId, @Valid @RequestBody LmsDtos.ClassSessionRequest request, Authentication auth) {
        return learningService.createClassSession(classroomId, currentUserService.require(auth), request);
    }

    @GetMapping("/assignments")
    public List<LmsDtos.AssignmentDto> assignments(@PathVariable Long classroomId, Authentication auth) {
        return learningService.listAssignments(classroomId, currentUserService.require(auth));
    }

    @PostMapping("/assignments")
    public LmsDtos.AssignmentDto createAssignment(@PathVariable Long classroomId, @Valid @RequestBody LmsDtos.AssignmentRequest request, Authentication auth) {
        return learningService.createAssignment(classroomId, currentUserService.require(auth), request);
    }

    @PutMapping("/assignments/{assignmentId}")
    public LmsDtos.AssignmentDto updateAssignment(@PathVariable Long classroomId, @PathVariable Long assignmentId,
                                                  @RequestBody LmsDtos.AssignmentRequest request, Authentication auth) {
        return learningService.updateAssignment(classroomId, assignmentId, currentUserService.require(auth), request);
    }

    @PostMapping("/assignments/{assignmentId}/submit")
    public LmsDtos.AssignmentSubmissionDto submit(@PathVariable Long classroomId, @PathVariable Long assignmentId,
                                                  @RequestBody LmsDtos.SubmissionRequest request, Authentication auth) {
        return learningService.submitAssignment(classroomId, assignmentId, currentUserService.require(auth), request);
    }

    @GetMapping("/assignments/{assignmentId}/submissions")
    public List<LmsDtos.AssignmentSubmissionDto> submissions(@PathVariable Long classroomId, @PathVariable Long assignmentId, Authentication auth) {
        return learningService.listSubmissions(classroomId, assignmentId, currentUserService.require(auth));
    }

    @PostMapping("/submissions/{submissionId}/grade")
    public LmsDtos.AssignmentSubmissionDto grade(@PathVariable Long classroomId, @PathVariable Long submissionId,
                                                 @Valid @RequestBody LmsDtos.GradeRequest request, Authentication auth) {
        return learningService.gradeSubmission(classroomId, submissionId, currentUserService.require(auth), request);
    }

    @GetMapping("/quizzes")
    public List<LmsDtos.QuizDto> quizzes(@PathVariable Long classroomId, Authentication auth) {
        return learningService.listQuizzes(classroomId, currentUserService.require(auth));
    }

    @PostMapping("/quizzes")
    public LmsDtos.QuizDto createQuiz(@PathVariable Long classroomId, @Valid @RequestBody LmsDtos.QuizRequest request, Authentication auth) {
        return learningService.createQuiz(classroomId, currentUserService.require(auth), request);
    }

    @PutMapping("/quizzes/{quizId}")
    public LmsDtos.QuizDto updateQuiz(@PathVariable Long classroomId, @PathVariable Long quizId,
                                      @RequestBody LmsDtos.QuizRequest request, Authentication auth) {
        return learningService.updateQuiz(classroomId, quizId, currentUserService.require(auth), request);
    }

    @PostMapping("/quizzes/{quizId}/start")
    public LmsDtos.QuizAttemptDto startQuiz(@PathVariable Long classroomId, @PathVariable Long quizId, Authentication auth) {
        return learningService.startQuiz(classroomId, quizId, currentUserService.require(auth));
    }

    @PostMapping("/quiz-attempts/{attemptId}/submit")
    public LmsDtos.QuizAttemptDto submitQuiz(@PathVariable Long classroomId, @PathVariable Long attemptId,
                                             @RequestBody LmsDtos.QuizSubmitRequest request, Authentication auth) {
        return learningService.submitQuiz(classroomId, attemptId, currentUserService.require(auth), request);
    }

    @GetMapping("/quizzes/{quizId}/attempts")
    public List<LmsDtos.QuizAttemptDto> attempts(@PathVariable Long classroomId, @PathVariable Long quizId, Authentication auth) {
        return learningService.listAttempts(classroomId, quizId, currentUserService.require(auth));
    }

    @PostMapping("/quiz-attempts/{attemptId}/grade")
    public LmsDtos.QuizAttemptDto gradeQuiz(@PathVariable Long classroomId, @PathVariable Long attemptId,
                                            @RequestBody List<LmsDtos.ShortGradeRequest> grades, Authentication auth) {
        return learningService.gradeShort(classroomId, attemptId, currentUserService.require(auth), grades);
    }

    @GetMapping("/calendar")
    public List<LmsDtos.CalendarEventDto> calendar(@PathVariable Long classroomId, Authentication auth) {
        return learningService.listEvents(classroomId, currentUserService.require(auth));
    }

    @PostMapping("/calendar")
    public LmsDtos.CalendarEventDto createEvent(@PathVariable Long classroomId, @Valid @RequestBody LmsDtos.CalendarEventRequest request, Authentication auth) {
        return learningService.createEvent(classroomId, currentUserService.require(auth), request);
    }

    @DeleteMapping("/calendar/{eventId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteEvent(@PathVariable Long classroomId, @PathVariable Long eventId, Authentication auth) {
        learningService.deleteEvent(classroomId, eventId, currentUserService.require(auth));
    }

    @GetMapping("/announcements")
    public List<LmsDtos.AnnouncementDto> announcements(@PathVariable Long classroomId, Authentication auth) {
        return learningService.listAnnouncements(classroomId, currentUserService.require(auth));
    }

    @PostMapping("/announcements")
    public LmsDtos.AnnouncementDto announce(@PathVariable Long classroomId, @Valid @RequestBody LmsDtos.AnnouncementRequest request, Authentication auth) {
        return learningService.createAnnouncement(classroomId, currentUserService.require(auth), request);
    }
}
