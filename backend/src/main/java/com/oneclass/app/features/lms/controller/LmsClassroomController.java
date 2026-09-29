package com.oneclass.app.features.lms.controller;

import com.oneclass.app.features.lms.dto.LmsDtos;
import com.oneclass.app.features.lms.service.ClassroomService;
import com.oneclass.app.features.lms.service.CurrentUserService;
import com.oneclass.app.features.lms.service.EnrollmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/lms")
@RequiredArgsConstructor
public class LmsClassroomController {

    private final CurrentUserService currentUserService;
    private final ClassroomService classroomService;
    private final EnrollmentService enrollmentService;

    @GetMapping("/classrooms")
    public List<LmsDtos.ClassroomDto> list(Authentication auth) {
        return classroomService.listForUser(currentUserService.require(auth));
    }

    @PostMapping("/classrooms")
    public LmsDtos.ClassroomDto create(Authentication auth, @Valid @RequestBody LmsDtos.ClassroomCreateRequest request) {
        return classroomService.create(currentUserService.require(auth), request);
    }

    @GetMapping("/classrooms/{id}")
    public LmsDtos.ClassroomDto get(Authentication auth, @PathVariable Long id) {
        return classroomService.get(id, currentUserService.require(auth));
    }

    @PutMapping("/classrooms/{id}")
    public LmsDtos.ClassroomDto update(Authentication auth, @PathVariable Long id, @RequestBody LmsDtos.ClassroomCreateRequest request) {
        return classroomService.update(id, currentUserService.require(auth), request);
    }

    @GetMapping("/classrooms/{id}/activity")
    public LmsDtos.ClassroomActivityDto activity(Authentication auth, @PathVariable Long id) {
        return classroomService.activity(id, currentUserService.require(auth));
    }

    @GetMapping("/classrooms/{id}/teachers")
    public List<LmsDtos.TeacherDto> teachers(Authentication auth, @PathVariable Long id) {
        return classroomService.listTeachers(id, currentUserService.require(auth));
    }

    @PostMapping("/classrooms/{id}/teachers")
    public LmsDtos.TeacherDto addTeacher(Authentication auth, @PathVariable Long id, @Valid @RequestBody LmsDtos.TeacherAddRequest request) {
        return classroomService.addTeacher(id, currentUserService.require(auth), request);
    }

    @PutMapping("/classrooms/{id}/teachers/{userId}/permissions")
    public LmsDtos.TeacherDto permissions(Authentication auth, @PathVariable Long id, @PathVariable Long userId,
                                          @RequestBody LmsDtos.PermissionUpdateRequest request) {
        return classroomService.updatePermissions(id, userId, currentUserService.require(auth), request);
    }

    @DeleteMapping("/classrooms/{id}/teachers/{userId}")
    public void removeTeacher(Authentication auth, @PathVariable Long id, @PathVariable Long userId) {
        classroomService.removeTeacher(id, userId, currentUserService.require(auth));
    }

    @GetMapping("/classrooms/{id}/students")
    public List<LmsDtos.StudentDto> students(Authentication auth, @PathVariable Long id) {
        return classroomService.listStudents(id, currentUserService.require(auth));
    }

    @PostMapping("/classrooms/{id}/students")
    public LmsDtos.StudentDto addStudent(Authentication auth, @PathVariable Long id, @Valid @RequestBody LmsDtos.StudentAddRequest request) {
        return classroomService.addStudent(id, currentUserService.require(auth), request);
    }

    @DeleteMapping("/classrooms/{id}/students/{userId}")
    public void removeStudent(Authentication auth, @PathVariable Long id, @PathVariable Long userId) {
        classroomService.removeStudent(id, userId, currentUserService.require(auth));
    }

    @GetMapping("/classrooms/{id}/enrollments")
    public List<LmsDtos.EnrollmentDto> enrollments(Authentication auth, @PathVariable Long id) {
        return enrollmentService.listForClassroom(id, currentUserService.require(auth));
    }

    @PostMapping("/enrollments/{enrollmentId}/approve")
    public LmsDtos.EnrollmentDto approve(Authentication auth, @PathVariable Long enrollmentId,
                                         @RequestBody(required = false) LmsDtos.EnrollmentDecisionRequest request) {
        return enrollmentService.approve(enrollmentId, currentUserService.require(auth),
                request != null ? request : new LmsDtos.EnrollmentDecisionRequest());
    }

    @PostMapping("/enrollments/{enrollmentId}/reject")
    public LmsDtos.EnrollmentDto reject(Authentication auth, @PathVariable Long enrollmentId,
                                        @RequestBody(required = false) LmsDtos.EnrollmentDecisionRequest request) {
        return enrollmentService.reject(enrollmentId, currentUserService.require(auth),
                request != null ? request : new LmsDtos.EnrollmentDecisionRequest());
    }

    @GetMapping("/enrollments/mine")
    public List<LmsDtos.EnrollmentDto> myEnrollments(Authentication auth) {
        return enrollmentService.listMine(currentUserService.require(auth));
    }
}
