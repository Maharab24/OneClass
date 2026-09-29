package com.oneclass.app.features.lms.dto;

import com.oneclass.app.features.lms.model.CalendarEventType;
import com.oneclass.app.features.lms.model.ClassroomPermission;
import com.oneclass.app.features.lms.model.EnrollmentStatus;
import com.oneclass.app.features.lms.model.LiveClassStatus;
import com.oneclass.app.features.lms.model.NotificationType;
import com.oneclass.app.features.lms.model.QuestionType;
import com.oneclass.app.features.lms.model.QuizAttemptStatus;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

public final class LmsDtos {
    private LmsDtos() {}

    @Data
    public static class ClassroomCreateRequest {
        @NotBlank
        private String name;
        private String description;
        private String subject;
        private String coverImageUrl;
        private String timezone;
        private Boolean allowStudentDiscussion;
        private Boolean published;
    }

    @Data
    public static class TeacherAddRequest {
        @NotBlank
        private String email;
        private Set<ClassroomPermission> permissions;
    }

    @Data
    public static class PermissionUpdateRequest {
        @NotNull
        private Set<ClassroomPermission> permissions;
    }

    @Data
    public static class StudentAddRequest {
        @NotBlank
        private String email;
        private String paymentPhone;
    }

    @Data
    public static class CourseUpsertRequest {
        @NotBlank
        private String title;
        private String description;
        private String category;
        private String subject;
        private String keywords;
        private String thumbnailUrl;
        private BigDecimal price;
        private String currency;
        private Long classroomId;
        private Boolean published;
    }

    @Data
    public static class EnrollRequest {
        @NotBlank
        private String paymentPhone;
        private String studentNote;
    }

    @Data
    public static class EnrollmentDecisionRequest {
        private String reviewNote;
    }

    @Data
    public static class ReviewRequest {
        @Min(1)
        @Max(5)
        private int rating;
        private String comment;
    }

    @Data
    public static class LiveClassCreateRequest {
        @NotBlank
        private String title;
        private String description;
        private Long courseId;
        private LocalDateTime scheduledAt;
    }

    @Data
    public static class ClassSessionRequest {
        @NotBlank
        private String title;
        private String description;
        private LocalDateTime startsAt;
        private LocalDateTime endsAt;
        private String meetingNote;
    }

    @Data
    public static class AssignmentRequest {
        @NotBlank
        private String title;
        private String description;
        private LocalDateTime deadline;
        private Integer maxMarks;
        private Boolean published;
        private String questionFileName;
        private String questionFileUrl;
    }

    @Data
    public static class SubmissionRequest {
        private String content;
        private String fileName;
        private String fileUrl;
    }

    @Data
    public static class GradeRequest {
        @NotNull
        private Double grade;
        private String feedback;
    }

    @Data
    public static class QuizRequest {
        @NotBlank
        private String title;
        private String description;
        private Integer durationMinutes;
        private LocalDateTime deadline;
        private Integer maxAttempts;
        private Boolean published;
        private LocalDateTime scheduledAt;
        private Boolean showResultsToStudents;
        private List<QuestionRequest> questions;
    }

    @Data
    public static class QuestionRequest {
        @NotNull
        private QuestionType type;
        @NotBlank
        private String prompt;
        @NotNull
        private Integer marks;
        private List<String> options;
        private Integer correctOptionIndex;
        private String sampleAnswer;
        private Integer sortOrder;
    }

    @Data
    public static class QuizAnswerSubmit {
        @NotNull
        private Long questionId;
        private Integer selectedOptionIndex;
        private String shortAnswer;
    }

    @Data
    public static class QuizSubmitRequest {
        private List<QuizAnswerSubmit> answers;
    }

    @Data
    public static class ShortGradeRequest {
        @NotNull
        private Long answerId;
        @NotNull
        private Double marksAwarded;
    }

    @Data
    public static class CalendarEventRequest {
        @NotBlank
        private String title;
        private String description;
        @NotNull
        private CalendarEventType type;
        private LocalDateTime startsAt;
        private LocalDateTime endsAt;
        private Long relatedId;
    }

    @Data
    public static class AnnouncementRequest {
        @NotBlank
        private String title;
        @NotBlank
        private String body;
        private Boolean pinned;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserSummary {
        private Long id;
        private String fullName;
        private String email;
        private String role;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ClassroomDto {
        private Long id;
        private String name;
        private String description;
        private String subject;
        private String coverImageUrl;
        private Long creatorId;
        private String creatorName;
        private String inviteCode;
        private String timezone;
        private boolean allowStudentDiscussion;
        private boolean published;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
        private boolean admin;
        private Set<ClassroomPermission> myPermissions;
        private long studentCount;
        private long teacherCount;
        private long pendingEnrollments;
        private boolean hasLiveClass;
        private String liveRoomCode;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TeacherDto {
        private Long id;
        private Long userId;
        private String fullName;
        private String email;
        private Set<ClassroomPermission> permissions;
        private boolean admin;
        private LocalDateTime addedAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StudentDto {
        private Long id;
        private Long userId;
        private String fullName;
        private String email;
        private EnrollmentStatus status;
        private String paymentPhone;
        private LocalDateTime joinedAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CourseCardDto {
        private Long id;
        private String courseCode;
        private String title;
        private String description;
        private String category;
        private String subject;
        private String keywords;
        private String thumbnailUrl;
        private BigDecimal price;
        private String currency;
        private Long classroomId;
        private String classroomName;
        private Long instructorId;
        private String instructorName;
        private boolean published;
        private Double averageRating;
        private Integer reviewCount;
        private LocalDateTime createdAt;
        private EnrollmentStatus myEnrollmentStatus;
        private boolean inCart;
        private boolean enrolled;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EnrollmentDto {
        private Long id;
        private Long courseId;
        private String courseCode;
        private String courseTitle;
        private Long classroomId;
        private String classroomName;
        private Long studentId;
        private String studentName;
        private String studentEmail;
        private String paymentPhone;
        private EnrollmentStatus status;
        private String studentNote;
        private String reviewNote;
        private LocalDateTime createdAt;
        private LocalDateTime reviewedAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReviewDto {
        private Long id;
        private Long courseId;
        private Long studentId;
        private String studentName;
        private Integer rating;
        private String comment;
        private LocalDateTime createdAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LiveClassDto {
        private Long id;
        private Long classroomId;
        private Long courseId;
        private String title;
        private String description;
        private LiveClassStatus status;
        private String whiteboardRoomCode;
        private Long startedById;
        private String startedByName;
        private LocalDateTime scheduledAt;
        private LocalDateTime startedAt;
        private LocalDateTime endedAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ClassSessionDto {
        private Long id;
        private Long classroomId;
        private String title;
        private String description;
        private LocalDateTime startsAt;
        private LocalDateTime endsAt;
        private String meetingNote;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AssignmentDto {
        private Long id;
        private Long classroomId;
        private String title;
        private String description;
        private LocalDateTime deadline;
        private Integer maxMarks;
        private boolean published;
        private String questionFileName;
        private String questionFileUrl;
        private LocalDateTime createdAt;
        private AssignmentSubmissionDto mySubmission;
        private long submissionCount;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AssignmentSubmissionDto {
        private Long id;
        private Long assignmentId;
        private Long studentId;
        private String studentName;
        private String studentEmail;
        private String content;
        private String fileName;
        private String fileUrl;
        private Double grade;
        private String feedback;
        private LocalDateTime submittedAt;
        private LocalDateTime gradedAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QuestionDto {
        private Long id;
        private QuestionType type;
        private String prompt;
        private Integer marks;
        private List<String> options;
        private Integer correctOptionIndex;
        private String sampleAnswer;
        private Integer sortOrder;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QuizDto {
        private Long id;
        private Long classroomId;
        private String title;
        private String description;
        private Integer durationMinutes;
        private LocalDateTime deadline;
        private Integer maxAttempts;
        private boolean published;
        private LocalDateTime scheduledAt;
        private boolean showResultsToStudents;
        private boolean open;
        private List<QuestionDto> questions;
        private Integer myAttemptsUsed;
        private QuizAttemptDto latestAttempt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QuizAnswerDto {
        private Long id;
        private Long questionId;
        private Integer selectedOptionIndex;
        private String shortAnswer;
        private Double marksAwarded;
        private boolean graded;
        private QuestionType questionType;
        private String prompt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QuizAttemptDto {
        private Long id;
        private Long quizId;
        private Long studentId;
        private String studentName;
        private Integer attemptNumber;
        private QuizAttemptStatus status;
        private Double score;
        private Double maxScore;
        private LocalDateTime startedAt;
        private LocalDateTime submittedAt;
        private List<QuizAnswerDto> answers;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CalendarEventDto {
        private Long id;
        private Long classroomId;
        private String title;
        private String description;
        private CalendarEventType type;
        private LocalDateTime startsAt;
        private LocalDateTime endsAt;
        private Long relatedId;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AnnouncementDto {
        private Long id;
        private Long classroomId;
        private String title;
        private String body;
        private boolean pinned;
        private Long createdById;
        private String createdByName;
        private LocalDateTime createdAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class NotificationDto {
        private Long id;
        private NotificationType type;
        private String title;
        private String body;
        private String link;
        private Long classroomId;
        private boolean read;
        private LocalDateTime createdAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FileDto {
        private Long id;
        private String originalName;
        private String contentType;
        private String url;
        private Long sizeBytes;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ClassroomActivityDto {
        private long approvedStudents;
        private long pendingEnrollments;
        private long assignmentCount;
        private long quizCount;
        private long unreadNotifications;
        private boolean liveNow;
    }
}
