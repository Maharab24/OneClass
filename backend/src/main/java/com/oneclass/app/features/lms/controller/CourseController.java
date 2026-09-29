package com.oneclass.app.features.lms.controller;

import com.oneclass.app.features.lms.dto.LmsDtos;
import com.oneclass.app.features.lms.service.CourseService;
import com.oneclass.app.features.lms.service.CurrentUserService;
import com.oneclass.app.features.lms.service.EnrollmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/lms")
@RequiredArgsConstructor
public class CourseController {

    private final CourseService courseService;
    private final EnrollmentService enrollmentService;
    private final CurrentUserService currentUserService;

    @PostMapping("/courses")
    @ResponseStatus(HttpStatus.CREATED)
    public LmsDtos.CourseCardDto create(@Valid @RequestBody LmsDtos.CourseUpsertRequest request, Authentication auth) {
        return courseService.create(currentUserService.require(auth), request);
    }

    @PutMapping("/courses/{id}")
    public LmsDtos.CourseCardDto update(@PathVariable Long id, @RequestBody LmsDtos.CourseUpsertRequest request, Authentication auth) {
        return courseService.update(id, currentUserService.require(auth), request);
    }

    @DeleteMapping("/courses/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id, Authentication auth) {
        courseService.delete(id, currentUserService.require(auth));
    }

    @GetMapping("/courses")
    public List<LmsDtos.CourseCardDto> search(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String subject,
            Authentication auth
    ) {
        return courseService.searchCatalog(currentUserService.require(auth), q, category, subject);
    }

    @GetMapping("/courses/mine")
    public List<LmsDtos.CourseCardDto> mine(Authentication auth) {
        return courseService.listMine(currentUserService.require(auth));
    }

    @GetMapping("/courses/enrolled")
    public List<LmsDtos.CourseCardDto> enrolled(Authentication auth) {
        return courseService.listEnrolled(currentUserService.require(auth));
    }

    @GetMapping("/courses/{id}")
    public LmsDtos.CourseCardDto get(@PathVariable Long id, Authentication auth) {
        return courseService.get(id, currentUserService.require(auth));
    }

    @GetMapping("/classrooms/{classroomId}/courses")
    public List<LmsDtos.CourseCardDto> byClassroom(@PathVariable Long classroomId, Authentication auth) {
        return courseService.listByClassroom(classroomId, currentUserService.require(auth));
    }

    @GetMapping("/courses/{id}/reviews")
    public List<LmsDtos.ReviewDto> reviews(@PathVariable Long id) {
        return courseService.listReviews(id);
    }

    @PostMapping("/courses/{id}/reviews")
    public LmsDtos.ReviewDto review(@PathVariable Long id, @Valid @RequestBody LmsDtos.ReviewRequest request, Authentication auth) {
        return courseService.upsertReview(currentUserService.require(auth), id, request);
    }

    @GetMapping("/cart")
    public List<LmsDtos.CourseCardDto> cart(Authentication auth) {
        return courseService.listCart(currentUserService.require(auth));
    }

    @PostMapping("/cart/{courseId}")
    public List<LmsDtos.CourseCardDto> addCart(@PathVariable Long courseId, Authentication auth) {
        return courseService.addToCart(currentUserService.require(auth), courseId);
    }

    @DeleteMapping("/cart/{courseId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeCart(@PathVariable Long courseId, Authentication auth) {
        courseService.removeFromCart(currentUserService.require(auth), courseId);
    }

    @PostMapping("/courses/{id}/enroll")
    public LmsDtos.EnrollmentDto enroll(@PathVariable Long id, @Valid @RequestBody LmsDtos.EnrollRequest request, Authentication auth) {
        return enrollmentService.submit(currentUserService.require(auth), id, request);
    }
}
