package com.oneclass.app.features.lms.service;

import com.oneclass.app.features.auth.model.Role;
import com.oneclass.app.features.auth.model.User;
import com.oneclass.app.features.auth.repository.UserRepository;
import com.oneclass.app.features.lms.dto.LmsDtos;
import com.oneclass.app.features.lms.model.CartItem;
import com.oneclass.app.features.lms.model.ClassroomPermission;
import com.oneclass.app.features.lms.model.Course;
import com.oneclass.app.features.lms.model.CourseReview;
import com.oneclass.app.features.lms.model.EnrollmentStatus;
import com.oneclass.app.features.lms.repository.CartItemRepository;
import com.oneclass.app.features.lms.repository.ClassroomRepository;
import com.oneclass.app.features.lms.repository.ClassroomStudentRepository;
import com.oneclass.app.features.lms.repository.CourseRepository;
import com.oneclass.app.features.lms.repository.CourseReviewRepository;
import com.oneclass.app.features.lms.repository.EnrollmentRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CourseService {

    private static final String CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    private final CourseRepository courseRepository;
    private final ClassroomRepository classroomRepository;
    private final ClassroomStudentRepository classroomStudentRepository;
    private final CourseReviewRepository reviewRepository;
    private final CartItemRepository cartItemRepository;
    private final EnrollmentRequestRepository enrollmentRequestRepository;
    private final UserRepository userRepository;
    private final LmsAccessService accessService;

    @Transactional
    public LmsDtos.CourseCardDto create(User user, LmsDtos.CourseUpsertRequest request) {
        if (request.getClassroomId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "classroomId is required");
        }
        accessService.requirePermission(request.getClassroomId(), user, ClassroomPermission.MANAGE_COURSES);
        Course course = Course.builder()
                .courseCode(generateCourseCode())
                .title(request.getTitle().trim())
                .description(request.getDescription())
                .category(request.getCategory())
                .subject(request.getSubject())
                .keywords(request.getKeywords())
                .thumbnailUrl(request.getThumbnailUrl())
                .price(request.getPrice() != null ? request.getPrice() : BigDecimal.ZERO)
                .currency(request.getCurrency() != null ? request.getCurrency() : "USD")
                .classroomId(request.getClassroomId())
                .instructorId(user.getId())
                .published(Boolean.TRUE.equals(request.getPublished()))
                .averageRating(0.0)
                .reviewCount(0)
                .build();
        return toCard(courseRepository.save(course), user);
    }

    @Transactional
    public LmsDtos.CourseCardDto update(Long courseId, User user, LmsDtos.CourseUpsertRequest request) {
        Course course = requireCourse(courseId);
        accessService.requirePermission(course.getClassroomId(), user, ClassroomPermission.MANAGE_COURSES);
        if (request.getTitle() != null && !request.getTitle().isBlank()) {
            course.setTitle(request.getTitle().trim());
        }
        if (request.getDescription() != null) course.setDescription(request.getDescription());
        if (request.getCategory() != null) course.setCategory(request.getCategory());
        if (request.getSubject() != null) course.setSubject(request.getSubject());
        if (request.getKeywords() != null) course.setKeywords(request.getKeywords());
        if (request.getThumbnailUrl() != null) course.setThumbnailUrl(request.getThumbnailUrl());
        if (request.getPrice() != null) course.setPrice(request.getPrice());
        if (request.getCurrency() != null) course.setCurrency(request.getCurrency());
        if (request.getPublished() != null) course.setPublished(request.getPublished());
        return toCard(courseRepository.save(course), user);
    }

    @Transactional
    public void delete(Long courseId, User user) {
        Course course = requireCourse(courseId);
        accessService.requirePermission(course.getClassroomId(), user, ClassroomPermission.MANAGE_COURSES);
        courseRepository.delete(course);
    }

    @Transactional(readOnly = true)
    public List<LmsDtos.CourseCardDto> searchCatalog(User user, String q, String category, String subject) {
        return courseRepository.searchPublished(q, category, subject).stream()
                .map(c -> toCard(c, user))
                .toList();
    }

    @Transactional(readOnly = true)
    public LmsDtos.CourseCardDto get(Long id, User user) {
        Course course = requireCourse(id);
        if (!course.isPublished() && (user.getRole() != Role.TEACHER || !accessService.isTeacher(course.getClassroomId(), user.getId()))) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found");
        }
        return toCard(course, user);
    }

    @Transactional(readOnly = true)
    public List<LmsDtos.CourseCardDto> listByClassroom(Long classroomId, User user) {
        accessService.requireMember(classroomId, user);
        return courseRepository.findByClassroomId(classroomId).stream()
                .map(c -> toCard(c, user))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<LmsDtos.CourseCardDto> listMine(User user) {
        if (user.getRole() == Role.TEACHER) {
            return courseRepository.findByInstructorId(user.getId()).stream()
                    .map(c -> toCard(c, user))
                    .toList();
        }
        return listEnrolled(user);
    }

    @Transactional(readOnly = true)
    public List<LmsDtos.CourseCardDto> listEnrolled(User user) {
        return classroomStudentRepository.findByUserIdAndStatus(user.getId(), EnrollmentStatus.APPROVED).stream()
                .flatMap(s -> courseRepository.findByClassroomId(s.getClassroomId()).stream())
                .map(c -> toCard(c, user))
                .toList();
    }

    @Transactional
    public List<LmsDtos.CourseCardDto> addToCart(User user, Long courseId) {
        if (user.getRole() != Role.STUDENT) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only students can use the course cart");
        }
        Course course = requireCourse(courseId);
        if (!course.isPublished()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Course is not available");
        }
        if (cartItemRepository.findByStudentIdAndCourseId(user.getId(), courseId).isEmpty()) {
            cartItemRepository.save(CartItem.builder().studentId(user.getId()).courseId(courseId).build());
        }
        return listCart(user);
    }

    @Transactional
    public void removeFromCart(User user, Long courseId) {
        cartItemRepository.deleteByStudentIdAndCourseId(user.getId(), courseId);
    }

    @Transactional(readOnly = true)
    public List<LmsDtos.CourseCardDto> listCart(User user) {
        return cartItemRepository.findByStudentIdOrderByAddedAtDesc(user.getId()).stream()
                .map(item -> courseRepository.findById(item.getCourseId()).orElse(null))
                .filter(c -> c != null)
                .map(c -> toCard(c, user))
                .toList();
    }

    @Transactional
    public LmsDtos.ReviewDto upsertReview(User user, Long courseId, LmsDtos.ReviewRequest request) {
        Course course = requireCourse(courseId);
        if (!accessService.isApprovedStudent(course.getClassroomId(), user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only enrolled students can review this course");
        }
        if (request.getRating() < 1 || request.getRating() > 5) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Rating must be 1-5");
        }
        CourseReview review = reviewRepository.findByCourseIdAndStudentId(courseId, user.getId())
                .orElse(CourseReview.builder().courseId(courseId).studentId(user.getId()).build());
        review.setRating(request.getRating());
        review.setComment(request.getComment());
        review = reviewRepository.save(review);
        refreshRatings(course);
        return toReview(review);
    }

    @Transactional(readOnly = true)
    public List<LmsDtos.ReviewDto> listReviews(Long courseId) {
        requireCourse(courseId);
        return reviewRepository.findByCourseIdOrderByCreatedAtDesc(courseId).stream()
                .map(this::toReview)
                .toList();
    }

    public Course requireCourse(Long id) {
        return courseRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found"));
    }

    private void refreshRatings(Course course) {
        List<CourseReview> reviews = reviewRepository.findByCourseIdOrderByCreatedAtDesc(course.getId());
        course.setReviewCount(reviews.size());
        course.setAverageRating(reviews.isEmpty() ? 0.0 :
                reviews.stream().mapToInt(CourseReview::getRating).average().orElse(0.0));
        courseRepository.save(course);
    }

    public LmsDtos.CourseCardDto toCard(Course course, User viewer) {
        EnrollmentStatus myStatus = null;
        boolean enrolled = false;
        boolean inCart = false;
        if (viewer != null) {
            myStatus = enrollmentRequestRepository.findFirstByCourseIdAndStudentIdOrderByCreatedAtDesc(course.getId(), viewer.getId())
                    .map(r -> r.getStatus())
                    .orElse(null);
            enrolled = accessService.isApprovedStudent(course.getClassroomId(), viewer.getId());
            inCart = cartItemRepository.findByStudentIdAndCourseId(viewer.getId(), course.getId()).isPresent();
        }
        String classroomName = classroomRepository.findById(course.getClassroomId()).map(c -> c.getName()).orElse("");
        String instructorName = userRepository.findById(course.getInstructorId()).map(User::getFullName).orElse("Instructor");
        return LmsDtos.CourseCardDto.builder()
                .id(course.getId())
                .courseCode(course.getCourseCode())
                .title(course.getTitle())
                .description(course.getDescription())
                .category(course.getCategory())
                .subject(course.getSubject())
                .keywords(course.getKeywords())
                .thumbnailUrl(course.getThumbnailUrl())
                .price(course.getPrice())
                .currency(course.getCurrency())
                .classroomId(course.getClassroomId())
                .classroomName(classroomName)
                .instructorId(course.getInstructorId())
                .instructorName(instructorName)
                .published(course.isPublished())
                .averageRating(course.getAverageRating())
                .reviewCount(course.getReviewCount())
                .createdAt(course.getCreatedAt())
                .myEnrollmentStatus(myStatus)
                .inCart(inCart)
                .enrolled(enrolled)
                .build();
    }

    private LmsDtos.ReviewDto toReview(CourseReview review) {
        return LmsDtos.ReviewDto.builder()
                .id(review.getId())
                .courseId(review.getCourseId())
                .studentId(review.getStudentId())
                .studentName(userRepository.findById(review.getStudentId()).map(User::getFullName).orElse("Student"))
                .rating(review.getRating())
                .comment(review.getComment())
                .createdAt(review.getCreatedAt())
                .build();
    }

    private String generateCourseCode() {
        String code;
        do {
            StringBuilder sb = new StringBuilder("OC-");
            for (int i = 0; i < 6; i++) {
                sb.append(CODE_CHARS.charAt(RANDOM.nextInt(CODE_CHARS.length())));
            }
            code = sb.toString();
        } while (courseRepository.existsByCourseCode(code));
        return code;
    }
}
