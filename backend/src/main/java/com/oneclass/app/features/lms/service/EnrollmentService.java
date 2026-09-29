package com.oneclass.app.features.lms.service;

import com.oneclass.app.features.auth.model.Role;
import com.oneclass.app.features.auth.model.User;
import com.oneclass.app.features.auth.repository.UserRepository;
import com.oneclass.app.features.lms.dto.LmsDtos;
import com.oneclass.app.features.lms.model.ClassroomPermission;
import com.oneclass.app.features.lms.model.ClassroomStudent;
import com.oneclass.app.features.lms.model.Course;
import com.oneclass.app.features.lms.model.EnrollmentRequest;
import com.oneclass.app.features.lms.model.EnrollmentStatus;
import com.oneclass.app.features.lms.model.NotificationType;
import com.oneclass.app.features.lms.repository.CartItemRepository;
import com.oneclass.app.features.lms.repository.ClassroomRepository;
import com.oneclass.app.features.lms.repository.ClassroomStudentRepository;
import com.oneclass.app.features.lms.repository.ClassroomTeacherRepository;
import com.oneclass.app.features.lms.repository.EnrollmentRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class EnrollmentService {

    private final EnrollmentRequestRepository enrollmentRequestRepository;
    private final ClassroomStudentRepository studentRepository;
    private final ClassroomTeacherRepository teacherRepository;
    private final ClassroomRepository classroomRepository;
    private final CartItemRepository cartItemRepository;
    private final UserRepository userRepository;
    private final CourseService courseService;
    private final LmsAccessService accessService;
    private final NotificationService notificationService;

    @Transactional
    public LmsDtos.EnrollmentDto submit(User student, Long courseId, LmsDtos.EnrollRequest request) {
        if (student.getRole() != Role.STUDENT) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only students can enroll");
        }
        Course course = courseService.requireCourse(courseId);
        if (!course.isPublished()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Course is not available for enrollment");
        }
        if (accessService.isApprovedStudent(course.getClassroomId(), student.getId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "You already have access to this classroom");
        }
        if (enrollmentRequestRepository.existsByCourseIdAndStudentIdAndStatus(courseId, student.getId(), EnrollmentStatus.PENDING)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "An enrollment request is already pending");
        }
        EnrollmentRequest saved = enrollmentRequestRepository.save(EnrollmentRequest.builder()
                .courseId(courseId)
                .classroomId(course.getClassroomId())
                .studentId(student.getId())
                .paymentPhone(request.getPaymentPhone().trim())
                .studentNote(request.getStudentNote())
                .status(EnrollmentStatus.PENDING)
                .build());

        teacherRepository.findByClassroomId(course.getClassroomId()).forEach(t ->
                notificationService.notifyUser(t.getUserId(), NotificationType.ENROLLMENT,
                        "New enrollment request",
                        student.getFullName() + " requested enrollment in " + course.getTitle() + " (" + course.getCourseCode() + ")",
                        "/teacher/dashboard/classrooms/" + course.getClassroomId() + "?tab=enrollments",
                        course.getClassroomId()));
        return toDto(saved);
    }

    @Transactional
    public LmsDtos.EnrollmentDto approve(Long enrollmentId, User teacher, LmsDtos.EnrollmentDecisionRequest request) {
        EnrollmentRequest enrollment = require(enrollmentId);
        accessService.requirePermission(enrollment.getClassroomId(), teacher, ClassroomPermission.MANAGE_STUDENTS);
        if (enrollment.getStatus() != EnrollmentStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request already reviewed");
        }
        enrollment.setStatus(EnrollmentStatus.APPROVED);
        enrollment.setReviewNote(request != null ? request.getReviewNote() : null);
        enrollment.setReviewedById(teacher.getId());
        enrollment.setReviewedAt(LocalDateTime.now());
        enrollmentRequestRepository.save(enrollment);

        ClassroomStudent membership = studentRepository.findByClassroomIdAndUserId(enrollment.getClassroomId(), enrollment.getStudentId())
                .orElse(ClassroomStudent.builder()
                        .classroomId(enrollment.getClassroomId())
                        .userId(enrollment.getStudentId())
                        .build());
        membership.setStatus(EnrollmentStatus.APPROVED);
        membership.setPaymentPhone(enrollment.getPaymentPhone());
        studentRepository.save(membership);
        cartItemRepository.deleteByStudentIdAndCourseId(enrollment.getStudentId(), enrollment.getCourseId());

        Course course = courseService.requireCourse(enrollment.getCourseId());
        notificationService.notifyUser(enrollment.getStudentId(), NotificationType.ENROLLMENT,
                "Enrollment approved",
                "You now have access to " + course.getTitle() + " (" + course.getCourseCode() + ")",
                "/student/dashboard/classrooms/" + enrollment.getClassroomId(),
                enrollment.getClassroomId());
        return toDto(enrollment);
    }

    @Transactional
    public LmsDtos.EnrollmentDto reject(Long enrollmentId, User teacher, LmsDtos.EnrollmentDecisionRequest request) {
        EnrollmentRequest enrollment = require(enrollmentId);
        accessService.requirePermission(enrollment.getClassroomId(), teacher, ClassroomPermission.MANAGE_STUDENTS);
        if (enrollment.getStatus() != EnrollmentStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request already reviewed");
        }
        enrollment.setStatus(EnrollmentStatus.REJECTED);
        enrollment.setReviewNote(request != null ? request.getReviewNote() : null);
        enrollment.setReviewedById(teacher.getId());
        enrollment.setReviewedAt(LocalDateTime.now());
        enrollmentRequestRepository.save(enrollment);

        Course course = courseService.requireCourse(enrollment.getCourseId());
        notificationService.notifyUser(enrollment.getStudentId(), NotificationType.ENROLLMENT,
                "Enrollment declined",
                "Your request for " + course.getTitle() + " (" + course.getCourseCode() + ") was declined.",
                "/student/dashboard/courses/" + course.getId(),
                enrollment.getClassroomId());
        return toDto(enrollment);
    }

    @Transactional(readOnly = true)
    public List<LmsDtos.EnrollmentDto> listForClassroom(Long classroomId, User user) {
        accessService.requireTeacher(classroomId, user);
        return enrollmentRequestRepository.findByClassroomIdOrderByCreatedAtDesc(classroomId).stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<LmsDtos.EnrollmentDto> listMine(User student) {
        return enrollmentRequestRepository.findByStudentIdOrderByCreatedAtDesc(student.getId()).stream()
                .map(this::toDto)
                .toList();
    }

    private EnrollmentRequest require(Long id) {
        return enrollmentRequestRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Enrollment request not found"));
    }

    private LmsDtos.EnrollmentDto toDto(EnrollmentRequest enrollment) {
        Course course = courseService.requireCourse(enrollment.getCourseId());
        User student = userRepository.findById(enrollment.getStudentId()).orElse(null);
        return LmsDtos.EnrollmentDto.builder()
                .id(enrollment.getId())
                .courseId(enrollment.getCourseId())
                .courseCode(course.getCourseCode())
                .courseTitle(course.getTitle())
                .classroomId(enrollment.getClassroomId())
                .classroomName(classroomRepository.findById(enrollment.getClassroomId()).map(c -> c.getName()).orElse(""))
                .studentId(enrollment.getStudentId())
                .studentName(student != null ? student.getFullName() : "Student")
                .studentEmail(student != null ? student.getEmail() : "")
                .paymentPhone(enrollment.getPaymentPhone())
                .status(enrollment.getStatus())
                .studentNote(enrollment.getStudentNote())
                .reviewNote(enrollment.getReviewNote())
                .createdAt(enrollment.getCreatedAt())
                .reviewedAt(enrollment.getReviewedAt())
                .build();
    }
}
