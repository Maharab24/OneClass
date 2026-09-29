package com.oneclass.app.features.lms.service;

import com.oneclass.app.features.auth.model.Role;
import com.oneclass.app.features.auth.model.User;
import com.oneclass.app.features.auth.repository.UserRepository;
import com.oneclass.app.features.lms.dto.LmsDtos;
import com.oneclass.app.features.lms.model.Classroom;
import com.oneclass.app.features.lms.model.ClassroomPermission;
import com.oneclass.app.features.lms.model.ClassroomStudent;
import com.oneclass.app.features.lms.model.ClassroomTeacher;
import com.oneclass.app.features.lms.model.EnrollmentStatus;
import com.oneclass.app.features.lms.model.LiveClassStatus;
import com.oneclass.app.features.lms.model.NotificationType;
import com.oneclass.app.features.lms.repository.AssignmentRepository;
import com.oneclass.app.features.lms.repository.ClassroomRepository;
import com.oneclass.app.features.lms.repository.ClassroomStudentRepository;
import com.oneclass.app.features.lms.repository.ClassroomTeacherRepository;
import com.oneclass.app.features.lms.repository.EnrollmentRequestRepository;
import com.oneclass.app.features.lms.repository.LiveClassSessionRepository;
import com.oneclass.app.features.lms.repository.QuizRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class ClassroomService {

    private static final String CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    private final ClassroomRepository classroomRepository;
    private final ClassroomTeacherRepository teacherRepository;
    private final ClassroomStudentRepository studentRepository;
    private final EnrollmentRequestRepository enrollmentRequestRepository;
    private final LiveClassSessionRepository liveClassSessionRepository;
    private final AssignmentRepository assignmentRepository;
    private final QuizRepository quizRepository;
    private final UserRepository userRepository;
    private final LmsAccessService accessService;
    private final NotificationService notificationService;

    @Transactional
    public LmsDtos.ClassroomDto create(User user, LmsDtos.ClassroomCreateRequest request) {
        if (user.getRole() != Role.TEACHER) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only teachers can create classrooms");
        }
        Classroom classroom = Classroom.builder()
                .name(request.getName().trim())
                .description(request.getDescription())
                .subject(request.getSubject())
                .coverImageUrl(request.getCoverImageUrl())
                .creatorId(user.getId())
                .inviteCode(generateInviteCode())
                .timezone(request.getTimezone() != null ? request.getTimezone() : "UTC")
                .allowStudentDiscussion(Boolean.TRUE.equals(request.getAllowStudentDiscussion()))
                .published(request.getPublished() == null || request.getPublished())
                .build();
        classroom = classroomRepository.save(classroom);

        teacherRepository.save(ClassroomTeacher.builder()
                .classroomId(classroom.getId())
                .userId(user.getId())
                .permissions(EnumSet.of(ClassroomPermission.ADMIN))
                .build());
        return toDto(classroom, user);
    }

    @Transactional(readOnly = true)
    public List<LmsDtos.ClassroomDto> listForUser(User user) {
        if (user.getRole() == Role.TEACHER) {
            return teacherRepository.findByUserId(user.getId()).stream()
                    .map(t -> classroomRepository.findById(t.getClassroomId()).orElse(null))
                    .filter(c -> c != null)
                    .map(c -> toDto(c, user))
                    .toList();
        }
        return studentRepository.findByUserIdAndStatus(user.getId(), EnrollmentStatus.APPROVED).stream()
                .map(s -> classroomRepository.findById(s.getClassroomId()).orElse(null))
                .filter(c -> c != null)
                .map(c -> toDto(c, user))
                .toList();
    }

    @Transactional(readOnly = true)
    public LmsDtos.ClassroomDto get(Long id, User user) {
        Classroom classroom = accessService.requireClassroom(id);
        accessService.requireMember(id, user);
        return toDto(classroom, user);
    }

    @Transactional
    public LmsDtos.ClassroomDto update(Long id, User user, LmsDtos.ClassroomCreateRequest request) {
        accessService.requirePermission(id, user, ClassroomPermission.MANAGE_SETTINGS);
        Classroom classroom = accessService.requireClassroom(id);
        if (request.getName() != null && !request.getName().isBlank()) {
            classroom.setName(request.getName().trim());
        }
        if (request.getDescription() != null) {
            classroom.setDescription(request.getDescription());
        }
        if (request.getSubject() != null) {
            classroom.setSubject(request.getSubject());
        }
        if (request.getCoverImageUrl() != null) {
            classroom.setCoverImageUrl(request.getCoverImageUrl());
        }
        if (request.getTimezone() != null) {
            classroom.setTimezone(request.getTimezone());
        }
        if (request.getAllowStudentDiscussion() != null) {
            classroom.setAllowStudentDiscussion(request.getAllowStudentDiscussion());
        }
        if (request.getPublished() != null) {
            classroom.setPublished(request.getPublished());
        }
        return toDto(classroomRepository.save(classroom), user);
    }

    @Transactional(readOnly = true)
    public List<LmsDtos.TeacherDto> listTeachers(Long classroomId, User user) {
        accessService.requireMember(classroomId, user);
        return teacherRepository.findByClassroomId(classroomId).stream()
                .map(this::toTeacherDto)
                .toList();
    }

    @Transactional
    public LmsDtos.TeacherDto addTeacher(Long classroomId, User actor, LmsDtos.TeacherAddRequest request) {
        accessService.requireAdmin(classroomId, actor);
        User teacher = userRepository.findByEmail(request.getEmail().trim())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Teacher account not found"));
        if (teacher.getRole() != Role.TEACHER) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "User is not a teacher");
        }
        if (teacherRepository.existsByClassroomIdAndUserId(classroomId, teacher.getId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Teacher already in classroom");
        }
        Set<ClassroomPermission> permissions = request.getPermissions();
        if (permissions == null || permissions.isEmpty()) {
            permissions = EnumSet.of(
                    ClassroomPermission.MANAGE_STUDENTS,
                    ClassroomPermission.MANAGE_COURSES,
                    ClassroomPermission.MANAGE_LIVE,
                    ClassroomPermission.MANAGE_ASSIGNMENTS,
                    ClassroomPermission.MANAGE_QUIZZES,
                    ClassroomPermission.MANAGE_CALENDAR,
                    ClassroomPermission.MANAGE_ANNOUNCEMENTS
            );
        }
        ClassroomTeacher saved = teacherRepository.save(ClassroomTeacher.builder()
                .classroomId(classroomId)
                .userId(teacher.getId())
                .permissions(permissions)
                .build());
        notificationService.notifyUser(teacher.getId(), NotificationType.GENERAL,
                "Added to classroom",
                "You were added as a teacher to " + accessService.requireClassroom(classroomId).getName(),
                "/teacher/dashboard/classrooms/" + classroomId,
                classroomId);
        return toTeacherDto(saved);
    }

    @Transactional
    public LmsDtos.TeacherDto updatePermissions(Long classroomId, Long teacherUserId, User actor, LmsDtos.PermissionUpdateRequest request) {
        accessService.requireAdmin(classroomId, actor);
        Classroom classroom = accessService.requireClassroom(classroomId);
        if (classroom.getCreatorId().equals(teacherUserId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot change the classroom creator's admin role");
        }
        ClassroomTeacher membership = teacherRepository.findByClassroomIdAndUserId(classroomId, teacherUserId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Teacher not found in classroom"));
        membership.setPermissions(request.getPermissions());
        return toTeacherDto(teacherRepository.save(membership));
    }

    @Transactional
    public void removeTeacher(Long classroomId, Long teacherUserId, User actor) {
        accessService.requireAdmin(classroomId, actor);
        Classroom classroom = accessService.requireClassroom(classroomId);
        if (classroom.getCreatorId().equals(teacherUserId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot remove the classroom creator");
        }
        teacherRepository.deleteByClassroomIdAndUserId(classroomId, teacherUserId);
    }

    @Transactional(readOnly = true)
    public List<LmsDtos.StudentDto> listStudents(Long classroomId, User user) {
        accessService.requireMember(classroomId, user);
        return studentRepository.findByClassroomId(classroomId).stream()
                .map(this::toStudentDto)
                .toList();
    }

    @Transactional
    public LmsDtos.StudentDto addStudent(Long classroomId, User actor, LmsDtos.StudentAddRequest request) {
        accessService.requirePermission(classroomId, actor, ClassroomPermission.MANAGE_STUDENTS);
        User student = userRepository.findByEmail(request.getEmail().trim())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Student account not found"));
        if (student.getRole() != Role.STUDENT) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "User is not a student");
        }
        ClassroomStudent existing = studentRepository.findByClassroomIdAndUserId(classroomId, student.getId()).orElse(null);
        if (existing != null) {
            existing.setStatus(EnrollmentStatus.APPROVED);
            if (request.getPaymentPhone() != null) {
                existing.setPaymentPhone(request.getPaymentPhone());
            }
            return toStudentDto(studentRepository.save(existing));
        }
        ClassroomStudent saved = studentRepository.save(ClassroomStudent.builder()
                .classroomId(classroomId)
                .userId(student.getId())
                .status(EnrollmentStatus.APPROVED)
                .paymentPhone(request.getPaymentPhone())
                .build());
        notificationService.notifyUser(student.getId(), NotificationType.ENROLLMENT,
                "Classroom access granted",
                "You now have access to " + accessService.requireClassroom(classroomId).getName(),
                "/student/dashboard/classrooms/" + classroomId,
                classroomId);
        return toStudentDto(saved);
    }

    @Transactional
    public void removeStudent(Long classroomId, Long studentUserId, User actor) {
        accessService.requirePermission(classroomId, actor, ClassroomPermission.MANAGE_STUDENTS);
        studentRepository.findByClassroomIdAndUserId(classroomId, studentUserId)
                .ifPresent(studentRepository::delete);
    }

    @Transactional(readOnly = true)
    public LmsDtos.ClassroomActivityDto activity(Long classroomId, User user) {
        accessService.requireMember(classroomId, user);
        boolean live = !liveClassSessionRepository.findByClassroomIdAndStatus(classroomId, LiveClassStatus.LIVE).isEmpty();
        return LmsDtos.ClassroomActivityDto.builder()
                .approvedStudents(studentRepository.countByClassroomIdAndStatus(classroomId, EnrollmentStatus.APPROVED))
                .pendingEnrollments(enrollmentRequestRepository.findByClassroomIdAndStatus(classroomId, EnrollmentStatus.PENDING).size())
                .assignmentCount(assignmentRepository.findByClassroomIdOrderByCreatedAtDesc(classroomId).size())
                .quizCount(quizRepository.findByClassroomIdOrderByCreatedAtDesc(classroomId).size())
                .unreadNotifications(0)
                .liveNow(live)
                .build();
    }

    public LmsDtos.ClassroomDto toDto(Classroom classroom, User viewer) {
        var live = liveClassSessionRepository.findFirstByClassroomIdAndStatusOrderByStartedAtDesc(classroom.getId(), LiveClassStatus.LIVE);
        ClassroomTeacher teacher = teacherRepository.findByClassroomIdAndUserId(classroom.getId(), viewer.getId()).orElse(null);
        return LmsDtos.ClassroomDto.builder()
                .id(classroom.getId())
                .name(classroom.getName())
                .description(classroom.getDescription())
                .subject(classroom.getSubject())
                .coverImageUrl(classroom.getCoverImageUrl())
                .creatorId(classroom.getCreatorId())
                .creatorName(userRepository.findById(classroom.getCreatorId()).map(User::getFullName).orElse("Teacher"))
                .inviteCode(teacher != null ? classroom.getInviteCode() : null)
                .timezone(classroom.getTimezone())
                .allowStudentDiscussion(classroom.isAllowStudentDiscussion())
                .published(classroom.isPublished())
                .createdAt(classroom.getCreatedAt())
                .updatedAt(classroom.getUpdatedAt())
                .admin(teacher != null && teacher.isAdmin())
                .myPermissions(teacher != null ? teacher.getPermissions() : Set.of())
                .studentCount(studentRepository.countByClassroomIdAndStatus(classroom.getId(), EnrollmentStatus.APPROVED))
                .teacherCount(teacherRepository.findByClassroomId(classroom.getId()).size())
                .pendingEnrollments(enrollmentRequestRepository.findByClassroomIdAndStatus(classroom.getId(), EnrollmentStatus.PENDING).size())
                .hasLiveClass(live.isPresent())
                .liveRoomCode(live.map(l -> l.getWhiteboardRoomCode()).orElse(null))
                .build();
    }

    private LmsDtos.TeacherDto toTeacherDto(ClassroomTeacher membership) {
        User user = userRepository.findById(membership.getUserId()).orElse(null);
        return LmsDtos.TeacherDto.builder()
                .id(membership.getId())
                .userId(membership.getUserId())
                .fullName(user != null ? user.getFullName() : "Unknown")
                .email(user != null ? user.getEmail() : "")
                .permissions(membership.getPermissions())
                .admin(membership.isAdmin())
                .addedAt(membership.getAddedAt())
                .build();
    }

    private LmsDtos.StudentDto toStudentDto(ClassroomStudent membership) {
        User user = userRepository.findById(membership.getUserId()).orElse(null);
        return LmsDtos.StudentDto.builder()
                .id(membership.getId())
                .userId(membership.getUserId())
                .fullName(user != null ? user.getFullName() : "Unknown")
                .email(user != null ? user.getEmail() : "")
                .status(membership.getStatus())
                .paymentPhone(membership.getPaymentPhone())
                .joinedAt(membership.getJoinedAt())
                .build();
    }

    private String generateInviteCode() {
        String code;
        do {
            StringBuilder sb = new StringBuilder(8);
            for (int i = 0; i < 8; i++) {
                sb.append(CODE_CHARS.charAt(RANDOM.nextInt(CODE_CHARS.length())));
            }
            code = sb.toString();
        } while (classroomRepository.existsByInviteCode(code));
        return code;
    }
}
