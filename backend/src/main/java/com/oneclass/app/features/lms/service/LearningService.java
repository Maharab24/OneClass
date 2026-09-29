package com.oneclass.app.features.lms.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.oneclass.app.features.auth.model.Role;
import com.oneclass.app.features.auth.model.User;
import com.oneclass.app.features.auth.repository.UserRepository;
import com.oneclass.app.features.lms.dto.LmsDtos;
import com.oneclass.app.features.lms.model.*;
import com.oneclass.app.features.lms.repository.*;
import com.oneclass.app.features.whiteboard.room.dto.CreateRoomRequest;
import com.oneclass.app.features.whiteboard.room.dto.RoomResponse;
import com.oneclass.app.features.whiteboard.room.service.RoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LearningService {

    private final LiveClassSessionRepository liveClassRepository;
    private final ClassSessionRepository classSessionRepository;
    private final AssignmentRepository assignmentRepository;
    private final AssignmentSubmissionRepository submissionRepository;
    private final QuizRepository quizRepository;
    private final QuizQuestionRepository questionRepository;
    private final QuizAttemptRepository attemptRepository;
    private final QuizAnswerRepository answerRepository;
    private final CalendarEventRepository calendarEventRepository;
    private final AnnouncementRepository announcementRepository;
    private final AppNotificationRepository notificationRepository;
    private final ClassroomStudentRepository classroomStudentRepository;
    private final UserRepository userRepository;
    private final LmsAccessService accessService;
    private final NotificationService notificationService;
    private final RoomService roomService;
    private final ObjectMapper objectMapper;

    @Transactional
    public LmsDtos.LiveClassDto createLiveClass(Long classroomId, User teacher, LmsDtos.LiveClassCreateRequest request) {
        accessService.requirePermission(classroomId, teacher, ClassroomPermission.MANAGE_LIVE);
        LiveClassSession session = liveClassRepository.save(LiveClassSession.builder()
                .classroomId(classroomId)
                .courseId(request.getCourseId())
                .title(request.getTitle())
                .description(request.getDescription())
                .status(request.getScheduledAt() != null && request.getScheduledAt().isAfter(LocalDateTime.now())
                        ? LiveClassStatus.SCHEDULED : LiveClassStatus.SCHEDULED)
                .startedById(teacher.getId())
                .scheduledAt(request.getScheduledAt())
                .build());
        calendarEventRepository.save(CalendarEvent.builder()
                .classroomId(classroomId)
                .title(request.getTitle())
                .description(request.getDescription())
                .type(CalendarEventType.LIVE_CLASS)
                .startsAt(request.getScheduledAt() != null ? request.getScheduledAt() : LocalDateTime.now())
                .relatedId(session.getId())
                .createdById(teacher.getId())
                .build());
        notifyStudents(classroomId, NotificationType.LIVE_CLASS, "Live class scheduled",
                request.getTitle() + " was scheduled.", "/student/dashboard/classrooms/" + classroomId + "?tab=live");
        return toLiveDto(session);
    }

    public record LiveStartResult(LmsDtos.LiveClassDto liveClass, RoomResponse room) {}

    @Transactional
    public LiveStartResult startLiveClass(Long classroomId, Long liveId, User teacher) {
        accessService.requirePermission(classroomId, teacher, ClassroomPermission.MANAGE_LIVE);
        LiveClassSession session = requireLive(liveId, classroomId);
        RoomResponse room;
        if (session.getStatus() == LiveClassStatus.LIVE && session.getWhiteboardRoomCode() != null) {
            room = roomService.getRoomByCode(session.getWhiteboardRoomCode())
                    .map(this::toRoomResponse)
                    .orElse(null);
            if (room == null) {
                room = roomService.createRoom(new CreateRoomRequest(teacher.getFullName()));
                session.setWhiteboardRoomCode(room.getRoomCode());
                liveClassRepository.save(session);
            }
            return new LiveStartResult(toLiveDto(session), room);
        }
        room = roomService.createRoom(new CreateRoomRequest(teacher.getFullName()));
        session.setStatus(LiveClassStatus.LIVE);
        session.setWhiteboardRoomCode(room.getRoomCode());
        session.setStartedAt(LocalDateTime.now());
        session.setStartedById(teacher.getId());
        liveClassRepository.save(session);
        notifyStudents(classroomId, NotificationType.LIVE_CLASS, "Live class started",
                session.getTitle() + " is live now. Join the interactive whiteboard.",
                "/student/dashboard/classrooms/" + classroomId + "?tab=live");
        return new LiveStartResult(toLiveDto(session), room);
    }

    @Transactional
    public LiveStartResult startImmediate(Long classroomId, User teacher, LmsDtos.LiveClassCreateRequest request) {
        LmsDtos.LiveClassDto created = createLiveClass(classroomId, teacher, request);
        return startLiveClass(classroomId, created.getId(), teacher);
    }

    @Transactional
    public LmsDtos.LiveClassDto endLiveClass(Long classroomId, Long liveId, User teacher) {
        accessService.requirePermission(classroomId, teacher, ClassroomPermission.MANAGE_LIVE);
        LiveClassSession session = requireLive(liveId, classroomId);
        session.setStatus(LiveClassStatus.ENDED);
        session.setEndedAt(LocalDateTime.now());
        return toLiveDto(liveClassRepository.save(session));
    }

    @Transactional(readOnly = true)
    public List<LmsDtos.LiveClassDto> listLive(Long classroomId, User user) {
        accessService.requireMember(classroomId, user);
        return liveClassRepository.findByClassroomIdOrderByScheduledAtDesc(classroomId).stream()
                .map(this::toLiveDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public LmsDtos.LiveClassDto currentLive(Long classroomId, User user) {
        accessService.requireMember(classroomId, user);
        return liveClassRepository.findFirstByClassroomIdAndStatusOrderByStartedAtDesc(classroomId, LiveClassStatus.LIVE)
                .map(this::toLiveDto)
                .orElse(null);
    }

    @Transactional
    public LmsDtos.ClassSessionDto createClassSession(Long classroomId, User teacher, LmsDtos.ClassSessionRequest request) {
        accessService.requirePermission(classroomId, teacher, ClassroomPermission.MANAGE_CALENDAR);
        ClassSession saved = classSessionRepository.save(ClassSession.builder()
                .classroomId(classroomId)
                .title(request.getTitle())
                .description(request.getDescription())
                .startsAt(request.getStartsAt())
                .endsAt(request.getEndsAt())
                .meetingNote(request.getMeetingNote())
                .createdById(teacher.getId())
                .build());
        calendarEventRepository.save(CalendarEvent.builder()
                .classroomId(classroomId)
                .title(request.getTitle())
                .description(request.getDescription())
                .type(CalendarEventType.CLASS)
                .startsAt(request.getStartsAt())
                .endsAt(request.getEndsAt())
                .relatedId(saved.getId())
                .createdById(teacher.getId())
                .build());
        return toClassDto(saved);
    }

    @Transactional(readOnly = true)
    public List<LmsDtos.ClassSessionDto> listClasses(Long classroomId, User user) {
        accessService.requireMember(classroomId, user);
        return classSessionRepository.findByClassroomIdOrderByStartsAtDesc(classroomId).stream()
                .map(this::toClassDto)
                .toList();
    }

    @Transactional
    public LmsDtos.AssignmentDto createAssignment(Long classroomId, User teacher, LmsDtos.AssignmentRequest request) {
        accessService.requirePermission(classroomId, teacher, ClassroomPermission.MANAGE_ASSIGNMENTS);
        Assignment saved = assignmentRepository.save(Assignment.builder()
                .classroomId(classroomId)
                .title(request.getTitle())
                .description(request.getDescription())
                .deadline(request.getDeadline())
                .maxMarks(request.getMaxMarks())
                .published(request.getPublished() == null || request.getPublished())
                .questionFileName(request.getQuestionFileName())
                .questionFileUrl(request.getQuestionFileUrl())
                .createdById(teacher.getId())
                .build());
        if (saved.getDeadline() != null) {
            calendarEventRepository.save(CalendarEvent.builder()
                    .classroomId(classroomId)
                    .title("Assignment: " + saved.getTitle())
                    .type(CalendarEventType.ASSIGNMENT)
                    .startsAt(saved.getDeadline())
                    .endsAt(saved.getDeadline())
                    .relatedId(saved.getId())
                    .createdById(teacher.getId())
                    .build());
        }
        if (saved.isPublished()) {
            notifyStudents(classroomId, NotificationType.ASSIGNMENT, "New assignment",
                    saved.getTitle() + (saved.getDeadline() != null ? " — due " + saved.getDeadline() : ""),
                    "/student/dashboard/classrooms/" + classroomId + "?tab=assignments");
        }
        return toAssignmentDto(saved, teacher);
    }

    @Transactional
    public LmsDtos.AssignmentDto updateAssignment(Long classroomId, Long assignmentId, User teacher, LmsDtos.AssignmentRequest request) {
        accessService.requirePermission(classroomId, teacher, ClassroomPermission.MANAGE_ASSIGNMENTS);
        Assignment assignment = requireAssignment(assignmentId, classroomId);
        if (request.getTitle() != null) assignment.setTitle(request.getTitle());
        if (request.getDescription() != null) assignment.setDescription(request.getDescription());
        if (request.getDeadline() != null) assignment.setDeadline(request.getDeadline());
        if (request.getMaxMarks() != null) assignment.setMaxMarks(request.getMaxMarks());
        if (request.getPublished() != null) assignment.setPublished(request.getPublished());
        if (request.getQuestionFileName() != null) assignment.setQuestionFileName(request.getQuestionFileName());
        if (request.getQuestionFileUrl() != null) assignment.setQuestionFileUrl(request.getQuestionFileUrl());
        return toAssignmentDto(assignmentRepository.save(assignment), teacher);
    }

    @Transactional(readOnly = true)
    public List<LmsDtos.AssignmentDto> listAssignments(Long classroomId, User user) {
        accessService.requireMember(classroomId, user);
        return assignmentRepository.findByClassroomIdOrderByCreatedAtDesc(classroomId).stream()
                .filter(a -> a.isPublished() || user.getRole() == Role.TEACHER)
                .map(a -> toAssignmentDto(a, user))
                .toList();
    }

    @Transactional
    public LmsDtos.AssignmentSubmissionDto submitAssignment(Long classroomId, Long assignmentId, User student, LmsDtos.SubmissionRequest request) {
        accessService.requireApprovedStudent(classroomId, student);
        Assignment assignment = requireAssignment(assignmentId, classroomId);
        if (!assignment.isPublished()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Assignment is not published");
        }
        if (assignment.getDeadline() != null && LocalDateTime.now().isAfter(assignment.getDeadline())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Deadline has passed");
        }
        AssignmentSubmission submission = submissionRepository.findByAssignmentIdAndStudentId(assignmentId, student.getId())
                .orElse(AssignmentSubmission.builder().assignmentId(assignmentId).studentId(student.getId()).build());
        submission.setContent(request.getContent());
        submission.setFileName(request.getFileName());
        submission.setFileUrl(request.getFileUrl());
        submission.setSubmittedAt(LocalDateTime.now());
        return toSubmissionDto(submissionRepository.save(submission));
    }

    @Transactional(readOnly = true)
    public List<LmsDtos.AssignmentSubmissionDto> listSubmissions(Long classroomId, Long assignmentId, User teacher) {
        accessService.requirePermission(classroomId, teacher, ClassroomPermission.MANAGE_ASSIGNMENTS);
        requireAssignment(assignmentId, classroomId);
        return submissionRepository.findByAssignmentId(assignmentId).stream().map(this::toSubmissionDto).toList();
    }

    @Transactional
    public LmsDtos.AssignmentSubmissionDto gradeSubmission(Long classroomId, Long submissionId, User teacher, LmsDtos.GradeRequest request) {
        accessService.requirePermission(classroomId, teacher, ClassroomPermission.MANAGE_ASSIGNMENTS);
        AssignmentSubmission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Submission not found"));
        Assignment assignment = requireAssignment(submission.getAssignmentId(), classroomId);
        submission.setGrade(request.getGrade());
        submission.setFeedback(request.getFeedback());
        submission.setGradedAt(LocalDateTime.now());
        submission.setGradedById(teacher.getId());
        submissionRepository.save(submission);
        notificationService.notifyUser(submission.getStudentId(), NotificationType.RESULT,
                "Assignment graded",
                assignment.getTitle() + " scored " + request.getGrade()
                        + (assignment.getMaxMarks() != null ? " / " + assignment.getMaxMarks() : ""),
                "/student/dashboard/classrooms/" + classroomId + "?tab=assignments",
                classroomId);
        return toSubmissionDto(submission);
    }

    @Transactional
    public LmsDtos.QuizDto createQuiz(Long classroomId, User teacher, LmsDtos.QuizRequest request) {
        accessService.requirePermission(classroomId, teacher, ClassroomPermission.MANAGE_QUIZZES);
        Quiz quiz = quizRepository.save(Quiz.builder()
                .classroomId(classroomId)
                .title(request.getTitle())
                .description(request.getDescription())
                .durationMinutes(request.getDurationMinutes())
                .deadline(request.getDeadline())
                .maxAttempts(request.getMaxAttempts() != null ? request.getMaxAttempts() : 1)
                .published(Boolean.TRUE.equals(request.getPublished()))
                .scheduledAt(request.getScheduledAt())
                .showResultsToStudents(Boolean.TRUE.equals(request.getShowResultsToStudents()))
                .createdById(teacher.getId())
                .build());
        saveQuestions(quiz.getId(), request.getQuestions());
        if (quiz.getDeadline() != null) {
            calendarEventRepository.save(CalendarEvent.builder()
                    .classroomId(classroomId)
                    .title("Quiz: " + quiz.getTitle())
                    .type(CalendarEventType.QUIZ)
                    .startsAt(quiz.getScheduledAt() != null ? quiz.getScheduledAt() : quiz.getDeadline())
                    .endsAt(quiz.getDeadline())
                    .relatedId(quiz.getId())
                    .createdById(teacher.getId())
                    .build());
        }
        if (quiz.isPublished() && (quiz.getScheduledAt() == null || !quiz.getScheduledAt().isAfter(LocalDateTime.now()))) {
            notifyStudents(classroomId, NotificationType.QUIZ, "New quiz",
                    quiz.getTitle(), "/student/dashboard/classrooms/" + classroomId + "?tab=quizzes");
        }
        return toQuizDto(quiz, teacher, true);
    }

    @Transactional
    public LmsDtos.QuizDto updateQuiz(Long classroomId, Long quizId, User teacher, LmsDtos.QuizRequest request) {
        accessService.requirePermission(classroomId, teacher, ClassroomPermission.MANAGE_QUIZZES);
        Quiz quiz = requireQuiz(quizId, classroomId);
        if (request.getTitle() != null) quiz.setTitle(request.getTitle());
        if (request.getDescription() != null) quiz.setDescription(request.getDescription());
        if (request.getDurationMinutes() != null) quiz.setDurationMinutes(request.getDurationMinutes());
        if (request.getDeadline() != null) quiz.setDeadline(request.getDeadline());
        if (request.getMaxAttempts() != null) quiz.setMaxAttempts(request.getMaxAttempts());
        if (request.getPublished() != null) quiz.setPublished(request.getPublished());
        if (request.getScheduledAt() != null) quiz.setScheduledAt(request.getScheduledAt());
        if (request.getShowResultsToStudents() != null) quiz.setShowResultsToStudents(request.getShowResultsToStudents());
        quizRepository.save(quiz);
        if (request.getQuestions() != null) {
            questionRepository.deleteByQuizId(quizId);
            saveQuestions(quizId, request.getQuestions());
        }
        return toQuizDto(quiz, teacher, true);
    }

    @Transactional(readOnly = true)
    public List<LmsDtos.QuizDto> listQuizzes(Long classroomId, User user) {
        accessService.requireMember(classroomId, user);
        boolean teacher = user.getRole() == Role.TEACHER;
        return quizRepository.findByClassroomIdOrderByCreatedAtDesc(classroomId).stream()
                .filter(q -> teacher || q.isPublished())
                .map(q -> toQuizDto(q, user, teacher))
                .toList();
    }

    @Transactional
    public LmsDtos.QuizAttemptDto startQuiz(Long classroomId, Long quizId, User student) {
        accessService.requireApprovedStudent(classroomId, student);
        Quiz quiz = requireQuiz(quizId, classroomId);
        if (!quiz.isOpen()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Quiz is not open");
        }
        long used = attemptRepository.countByQuizIdAndStudentId(quizId, student.getId());
        if (used >= quiz.getMaxAttempts()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No attempts remaining");
        }
        QuizAttempt attempt = attemptRepository.save(QuizAttempt.builder()
                .quizId(quizId)
                .studentId(student.getId())
                .attemptNumber((int) used + 1)
                .status(QuizAttemptStatus.IN_PROGRESS)
                .startedAt(LocalDateTime.now())
                .build());
        return toAttemptDto(attempt, true, student.getRole() == Role.TEACHER || quiz.isShowResultsToStudents());
    }

    @Transactional
    public LmsDtos.QuizAttemptDto submitQuiz(Long classroomId, Long attemptId, User student, LmsDtos.QuizSubmitRequest request) {
        QuizAttempt attempt = attemptRepository.findByIdAndStudentId(attemptId, student.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Attempt not found"));
        Quiz quiz = requireQuiz(attempt.getQuizId(), classroomId);
        accessService.requireApprovedStudent(classroomId, student);
        if (attempt.getStatus() != QuizAttemptStatus.IN_PROGRESS) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Attempt already submitted");
        }
        if (quiz.getDurationMinutes() != null && attempt.getStartedAt() != null
                && LocalDateTime.now().isAfter(attempt.getStartedAt().plusMinutes(quiz.getDurationMinutes() + 1))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Time is up for this quiz");
        }
        Map<Long, QuizQuestion> questions = questionRepository.findByQuizIdOrderBySortOrderAscIdAsc(quiz.getId())
                .stream().collect(Collectors.toMap(QuizQuestion::getId, q -> q));
        double score = 0;
        double max = questions.values().stream().mapToInt(QuizQuestion::getMarks).sum();
        boolean hasUngradedShort = false;
        if (request.getAnswers() != null) {
            for (LmsDtos.QuizAnswerSubmit ans : request.getAnswers()) {
                QuizQuestion q = questions.get(ans.getQuestionId());
                if (q == null) continue;
                QuizAnswer entity = QuizAnswer.builder()
                        .attemptId(attempt.getId())
                        .questionId(q.getId())
                        .selectedOptionIndex(ans.getSelectedOptionIndex())
                        .shortAnswer(ans.getShortAnswer())
                        .graded(false)
                        .build();
                if (q.getType() == QuestionType.MCQ) {
                    boolean correct = Objects.equals(q.getCorrectOptionIndex(), ans.getSelectedOptionIndex());
                    entity.setMarksAwarded(correct ? q.getMarks().doubleValue() : 0.0);
                    entity.setGraded(true);
                    score += entity.getMarksAwarded();
                } else {
                    hasUngradedShort = true;
                    entity.setMarksAwarded(0.0);
                }
                answerRepository.save(entity);
            }
        }
        attempt.setMaxScore(max);
        attempt.setScore(score);
        attempt.setSubmittedAt(LocalDateTime.now());
        attempt.setStatus(hasUngradedShort ? QuizAttemptStatus.SUBMITTED : QuizAttemptStatus.GRADED);
        attemptRepository.save(attempt);
        notificationService.notifyUser(quiz.getCreatedById(), NotificationType.QUIZ,
                "Quiz submitted",
                student.getFullName() + " submitted " + quiz.getTitle(),
                "/teacher/dashboard/classrooms/" + classroomId + "?tab=quizzes",
                classroomId);
        return toAttemptDto(attempt, true, quiz.isShowResultsToStudents() || !hasUngradedShort);
    }

    @Transactional
    public LmsDtos.QuizAttemptDto gradeShort(Long classroomId, Long attemptId, User teacher, List<LmsDtos.ShortGradeRequest> grades) {
        accessService.requirePermission(classroomId, teacher, ClassroomPermission.MANAGE_QUIZZES);
        QuizAttempt attempt = attemptRepository.findById(attemptId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Attempt not found"));
        Quiz quiz = requireQuiz(attempt.getQuizId(), classroomId);
        Map<Long, QuizAnswer> answers = answerRepository.findByAttemptId(attemptId).stream()
                .collect(Collectors.toMap(QuizAnswer::getId, a -> a));
        for (LmsDtos.ShortGradeRequest g : grades) {
            QuizAnswer answer = answers.get(g.getAnswerId());
            if (answer == null) continue;
            answer.setMarksAwarded(g.getMarksAwarded());
            answer.setGraded(true);
            answerRepository.save(answer);
        }
        List<QuizAnswer> all = answerRepository.findByAttemptId(attemptId);
        double score = all.stream().mapToDouble(a -> a.getMarksAwarded() == null ? 0 : a.getMarksAwarded()).sum();
        boolean allGraded = all.stream().allMatch(QuizAnswer::isGraded);
        attempt.setScore(score);
        if (allGraded) {
            attempt.setStatus(QuizAttemptStatus.GRADED);
            notificationService.notifyUser(attempt.getStudentId(), NotificationType.RESULT,
                    "Quiz graded",
                    quiz.getTitle() + " scored " + score + (attempt.getMaxScore() != null ? " / " + attempt.getMaxScore() : ""),
                    "/student/dashboard/classrooms/" + classroomId + "?tab=quizzes",
                    classroomId);
        }
        return toAttemptDto(attemptRepository.save(attempt), true, true);
    }

    @Transactional(readOnly = true)
    public List<LmsDtos.QuizAttemptDto> listAttempts(Long classroomId, Long quizId, User teacher) {
        accessService.requirePermission(classroomId, teacher, ClassroomPermission.MANAGE_QUIZZES);
        requireQuiz(quizId, classroomId);
        return attemptRepository.findByQuizId(quizId).stream()
                .map(a -> toAttemptDto(a, true, true))
                .toList();
    }

    @Transactional
    public LmsDtos.CalendarEventDto createEvent(Long classroomId, User teacher, LmsDtos.CalendarEventRequest request) {
        accessService.requirePermission(classroomId, teacher, ClassroomPermission.MANAGE_CALENDAR);
        CalendarEvent saved = calendarEventRepository.save(CalendarEvent.builder()
                .classroomId(classroomId)
                .title(request.getTitle())
                .description(request.getDescription())
                .type(request.getType())
                .startsAt(request.getStartsAt())
                .endsAt(request.getEndsAt())
                .relatedId(request.getRelatedId())
                .createdById(teacher.getId())
                .build());
        notifyStudents(classroomId, NotificationType.CALENDAR, "Calendar update",
                request.getTitle(), "/student/dashboard/classrooms/" + classroomId + "?tab=calendar");
        return toCalDto(saved);
    }

    @Transactional
    public void deleteEvent(Long classroomId, Long eventId, User teacher) {
        accessService.requirePermission(classroomId, teacher, ClassroomPermission.MANAGE_CALENDAR);
        CalendarEvent event = calendarEventRepository.findById(eventId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Event not found"));
        if (!event.getClassroomId().equals(classroomId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Event not found");
        }
        calendarEventRepository.delete(event);
    }

    @Transactional(readOnly = true)
    public List<LmsDtos.CalendarEventDto> listEvents(Long classroomId, User user) {
        accessService.requireMember(classroomId, user);
        return calendarEventRepository.findByClassroomIdOrderByStartsAtAsc(classroomId).stream()
                .map(this::toCalDto)
                .toList();
    }

    @Transactional
    public LmsDtos.AnnouncementDto createAnnouncement(Long classroomId, User teacher, LmsDtos.AnnouncementRequest request) {
        accessService.requirePermission(classroomId, teacher, ClassroomPermission.MANAGE_ANNOUNCEMENTS);
        Announcement saved = announcementRepository.save(Announcement.builder()
                .classroomId(classroomId)
                .title(request.getTitle())
                .body(request.getBody())
                .pinned(Boolean.TRUE.equals(request.getPinned()))
                .createdById(teacher.getId())
                .build());
        notifyStudents(classroomId, NotificationType.ANNOUNCEMENT, request.getTitle(), request.getBody(),
                "/student/dashboard/classrooms/" + classroomId + "?tab=overview");
        return toAnnDto(saved);
    }

    @Transactional(readOnly = true)
    public List<LmsDtos.AnnouncementDto> listAnnouncements(Long classroomId, User user) {
        accessService.requireMember(classroomId, user);
        return announcementRepository.findByClassroomIdOrderByPinnedDescCreatedAtDesc(classroomId).stream()
                .map(this::toAnnDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<LmsDtos.NotificationDto> myNotifications(User user) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId()).stream()
                .map(this::toNotifDto)
                .toList();
    }

    @Transactional
    public void markRead(Long id, User user) {
        AppNotification n = notificationRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification not found"));
        if (!n.getUserId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your notification");
        }
        n.setReadFlag(true);
        notificationRepository.save(n);
    }

    @Transactional
    public void markAllRead(User user) {
        notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId()).forEach(n -> {
            n.setReadFlag(true);
            notificationRepository.save(n);
        });
    }

    private void saveQuestions(Long quizId, List<LmsDtos.QuestionRequest> questions) {
        if (questions == null) return;
        int order = 0;
        for (LmsDtos.QuestionRequest q : questions) {
            if (q.getType() != QuestionType.MCQ && q.getType() != QuestionType.SHORT) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only MCQ and SHORT questions are supported");
            }
            if (q.getType() == QuestionType.MCQ && (q.getOptions() == null || q.getOptions().size() < 2)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "MCQ questions need at least two options");
            }
            try {
                questionRepository.save(QuizQuestion.builder()
                        .quizId(quizId)
                        .type(q.getType())
                        .prompt(q.getPrompt())
                        .marks(q.getMarks())
                        .optionsJson(q.getOptions() == null ? null : objectMapper.writeValueAsString(q.getOptions()))
                        .correctOptionIndex(q.getCorrectOptionIndex())
                        .sampleAnswer(q.getSampleAnswer())
                        .sortOrder(q.getSortOrder() != null ? q.getSortOrder() : order)
                        .build());
            } catch (Exception e) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid question options");
            }
            order++;
        }
    }

    private void notifyStudents(Long classroomId, NotificationType type, String title, String body, String link) {
        List<Long> ids = classroomStudentRepository.findByClassroomId(classroomId).stream()
                .filter(s -> s.getStatus() == EnrollmentStatus.APPROVED)
                .map(ClassroomStudent::getUserId)
                .toList();
        notificationService.notifyUsers(ids, type, title, body, link, classroomId);
    }

    private RoomResponse toRoomResponse(com.oneclass.app.features.whiteboard.room.model.Room room) {
        com.oneclass.app.common.model.User host = room.getUsers().get(room.getHostUserId());
        return new RoomResponse(
                room.getRoomCode(),
                room.getHostUserId(),
                host,
                room.getUsers().values(),
                room.getElements(),
                room.getMessages()
        );
    }

    private LiveClassSession requireLive(Long id, Long classroomId) {
        LiveClassSession session = liveClassRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Live class not found"));
        if (!session.getClassroomId().equals(classroomId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Live class not found");
        }
        return session;
    }

    private Assignment requireAssignment(Long id, Long classroomId) {
        Assignment assignment = assignmentRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Assignment not found"));
        if (!assignment.getClassroomId().equals(classroomId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Assignment not found");
        }
        return assignment;
    }

    private Quiz requireQuiz(Long id, Long classroomId) {
        Quiz quiz = quizRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Quiz not found"));
        if (!quiz.getClassroomId().equals(classroomId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Quiz not found");
        }
        return quiz;
    }

    private LmsDtos.LiveClassDto toLiveDto(LiveClassSession s) {
        return LmsDtos.LiveClassDto.builder()
                .id(s.getId())
                .classroomId(s.getClassroomId())
                .courseId(s.getCourseId())
                .title(s.getTitle())
                .description(s.getDescription())
                .status(s.getStatus())
                .whiteboardRoomCode(s.getWhiteboardRoomCode())
                .startedById(s.getStartedById())
                .startedByName(userRepository.findById(s.getStartedById()).map(User::getFullName).orElse("Teacher"))
                .scheduledAt(s.getScheduledAt())
                .startedAt(s.getStartedAt())
                .endedAt(s.getEndedAt())
                .build();
    }

    private LmsDtos.ClassSessionDto toClassDto(ClassSession s) {
        return LmsDtos.ClassSessionDto.builder()
                .id(s.getId())
                .classroomId(s.getClassroomId())
                .title(s.getTitle())
                .description(s.getDescription())
                .startsAt(s.getStartsAt())
                .endsAt(s.getEndsAt())
                .meetingNote(s.getMeetingNote())
                .build();
    }

    private LmsDtos.AssignmentDto toAssignmentDto(Assignment a, User viewer) {
        LmsDtos.AssignmentSubmissionDto mine = null;
        if (viewer.getRole() == Role.STUDENT) {
            mine = submissionRepository.findByAssignmentIdAndStudentId(a.getId(), viewer.getId())
                    .map(this::toSubmissionDto)
                    .orElse(null);
        }
        return LmsDtos.AssignmentDto.builder()
                .id(a.getId())
                .classroomId(a.getClassroomId())
                .title(a.getTitle())
                .description(a.getDescription())
                .deadline(a.getDeadline())
                .maxMarks(a.getMaxMarks())
                .published(a.isPublished())
                .questionFileName(a.getQuestionFileName())
                .questionFileUrl(a.getQuestionFileUrl())
                .createdAt(a.getCreatedAt())
                .mySubmission(mine)
                .submissionCount(submissionRepository.findByAssignmentId(a.getId()).size())
                .build();
    }

    private LmsDtos.AssignmentSubmissionDto toSubmissionDto(AssignmentSubmission s) {
        User student = userRepository.findById(s.getStudentId()).orElse(null);
        return LmsDtos.AssignmentSubmissionDto.builder()
                .id(s.getId())
                .assignmentId(s.getAssignmentId())
                .studentId(s.getStudentId())
                .studentName(student != null ? student.getFullName() : "Student")
                .studentEmail(student != null ? student.getEmail() : "")
                .content(s.getContent())
                .fileName(s.getFileName())
                .fileUrl(s.getFileUrl())
                .grade(s.getGrade())
                .feedback(s.getFeedback())
                .submittedAt(s.getSubmittedAt())
                .gradedAt(s.getGradedAt())
                .build();
    }

    private LmsDtos.QuizDto toQuizDto(Quiz quiz, User viewer, boolean revealAnswers) {
        List<LmsDtos.QuestionDto> questions = questionRepository.findByQuizIdOrderBySortOrderAscIdAsc(quiz.getId())
                .stream()
                .map(q -> toQuestionDto(q, revealAnswers))
                .toList();
        List<QuizAttempt> mine = attemptRepository.findByQuizIdAndStudentIdOrderByAttemptNumberDesc(quiz.getId(), viewer.getId());
        LmsDtos.QuizAttemptDto latest = mine.isEmpty() ? null : toAttemptDto(mine.get(0),
                quiz.isShowResultsToStudents() || viewer.getRole() == Role.TEACHER,
                quiz.isShowResultsToStudents() || viewer.getRole() == Role.TEACHER);
        return LmsDtos.QuizDto.builder()
                .id(quiz.getId())
                .classroomId(quiz.getClassroomId())
                .title(quiz.getTitle())
                .description(quiz.getDescription())
                .durationMinutes(quiz.getDurationMinutes())
                .deadline(quiz.getDeadline())
                .maxAttempts(quiz.getMaxAttempts())
                .published(quiz.isPublished())
                .scheduledAt(quiz.getScheduledAt())
                .showResultsToStudents(quiz.isShowResultsToStudents())
                .open(quiz.isOpen())
                .questions(questions)
                .myAttemptsUsed(mine.size())
                .latestAttempt(latest)
                .build();
    }

    private LmsDtos.QuestionDto toQuestionDto(QuizQuestion q, boolean reveal) {
        List<String> options = new ArrayList<>();
        if (q.getOptionsJson() != null) {
            try {
                options = objectMapper.readValue(q.getOptionsJson(), new TypeReference<>() {});
            } catch (Exception ignored) {
                options = List.of();
            }
        }
        return LmsDtos.QuestionDto.builder()
                .id(q.getId())
                .type(q.getType())
                .prompt(q.getPrompt())
                .marks(q.getMarks())
                .options(options)
                .correctOptionIndex(reveal ? q.getCorrectOptionIndex() : null)
                .sampleAnswer(reveal ? q.getSampleAnswer() : null)
                .sortOrder(q.getSortOrder())
                .build();
    }

    private LmsDtos.QuizAttemptDto toAttemptDto(QuizAttempt attempt, boolean includeAnswers, boolean revealMarks) {
        List<QuizAnswer> answers = includeAnswers ? answerRepository.findByAttemptId(attempt.getId()) : List.of();
        Map<Long, QuizQuestion> questions = questionRepository.findByQuizIdOrderBySortOrderAscIdAsc(attempt.getQuizId())
                .stream().collect(Collectors.toMap(QuizQuestion::getId, q -> q));
        User student = userRepository.findById(attempt.getStudentId()).orElse(null);
        return LmsDtos.QuizAttemptDto.builder()
                .id(attempt.getId())
                .quizId(attempt.getQuizId())
                .studentId(attempt.getStudentId())
                .studentName(student != null ? student.getFullName() : "Student")
                .attemptNumber(attempt.getAttemptNumber())
                .status(attempt.getStatus())
                .score(revealMarks ? attempt.getScore() : null)
                .maxScore(revealMarks ? attempt.getMaxScore() : null)
                .startedAt(attempt.getStartedAt())
                .submittedAt(attempt.getSubmittedAt())
                .answers(answers.stream().map(a -> {
                    QuizQuestion q = questions.get(a.getQuestionId());
                    return LmsDtos.QuizAnswerDto.builder()
                            .id(a.getId())
                            .questionId(a.getQuestionId())
                            .selectedOptionIndex(a.getSelectedOptionIndex())
                            .shortAnswer(a.getShortAnswer())
                            .marksAwarded(revealMarks ? a.getMarksAwarded() : null)
                            .graded(a.isGraded())
                            .questionType(q != null ? q.getType() : null)
                            .prompt(q != null ? q.getPrompt() : null)
                            .build();
                }).toList())
                .build();
    }

    private LmsDtos.CalendarEventDto toCalDto(CalendarEvent e) {
        return LmsDtos.CalendarEventDto.builder()
                .id(e.getId())
                .classroomId(e.getClassroomId())
                .title(e.getTitle())
                .description(e.getDescription())
                .type(e.getType())
                .startsAt(e.getStartsAt())
                .endsAt(e.getEndsAt())
                .relatedId(e.getRelatedId())
                .build();
    }

    private LmsDtos.AnnouncementDto toAnnDto(Announcement a) {
        return LmsDtos.AnnouncementDto.builder()
                .id(a.getId())
                .classroomId(a.getClassroomId())
                .title(a.getTitle())
                .body(a.getBody())
                .pinned(a.isPinned())
                .createdById(a.getCreatedById())
                .createdByName(userRepository.findById(a.getCreatedById()).map(User::getFullName).orElse("Teacher"))
                .createdAt(a.getCreatedAt())
                .build();
    }

    private LmsDtos.NotificationDto toNotifDto(AppNotification n) {
        return LmsDtos.NotificationDto.builder()
                .id(n.getId())
                .type(n.getType())
                .title(n.getTitle())
                .body(n.getBody())
                .link(n.getLink())
                .classroomId(n.getClassroomId())
                .read(n.isReadFlag())
                .createdAt(n.getCreatedAt())
                .build();
    }
}
