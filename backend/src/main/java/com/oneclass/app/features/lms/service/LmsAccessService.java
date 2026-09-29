package com.oneclass.app.features.lms.service;

import com.oneclass.app.features.auth.model.Role;
import com.oneclass.app.features.auth.model.User;
import com.oneclass.app.features.lms.model.Classroom;
import com.oneclass.app.features.lms.model.ClassroomPermission;
import com.oneclass.app.features.lms.model.ClassroomStudent;
import com.oneclass.app.features.lms.model.ClassroomTeacher;
import com.oneclass.app.features.lms.model.EnrollmentStatus;
import com.oneclass.app.features.lms.repository.ClassroomRepository;
import com.oneclass.app.features.lms.repository.ClassroomStudentRepository;
import com.oneclass.app.features.lms.repository.ClassroomTeacherRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class LmsAccessService {

    private final ClassroomRepository classroomRepository;
    private final ClassroomTeacherRepository teacherRepository;
    private final ClassroomStudentRepository studentRepository;

    public Classroom requireClassroom(Long id) {
        return classroomRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Classroom not found"));
    }

    public ClassroomTeacher requireTeacher(Long classroomId, User user) {
        if (user.getRole() != Role.TEACHER) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Teacher role required");
        }
        return teacherRepository.findByClassroomIdAndUserId(classroomId, user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not a teacher in this classroom"));
    }

    public ClassroomTeacher requirePermission(Long classroomId, User user, ClassroomPermission permission) {
        ClassroomTeacher membership = requireTeacher(classroomId, user);
        if (!membership.has(permission)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Missing permission: " + permission);
        }
        return membership;
    }

    public ClassroomTeacher requireAdmin(Long classroomId, User user) {
        ClassroomTeacher membership = requireTeacher(classroomId, user);
        if (!membership.isAdmin()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Classroom admin required");
        }
        return membership;
    }

    public ClassroomStudent requireApprovedStudent(Long classroomId, User user) {
        ClassroomStudent membership = studentRepository.findByClassroomIdAndUserId(classroomId, user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not enrolled in this classroom"));
        if (membership.getStatus() != EnrollmentStatus.APPROVED) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Enrollment is not approved");
        }
        return membership;
    }

    public void requireMember(Long classroomId, User user) {
        if (user.getRole() == Role.TEACHER) {
            requireTeacher(classroomId, user);
            return;
        }
        requireApprovedStudent(classroomId, user);
    }

    public boolean isApprovedStudent(Long classroomId, Long userId) {
        return studentRepository.existsByClassroomIdAndUserIdAndStatus(classroomId, userId, EnrollmentStatus.APPROVED);
    }

    public boolean isTeacher(Long classroomId, Long userId) {
        return teacherRepository.existsByClassroomIdAndUserId(classroomId, userId);
    }
}
