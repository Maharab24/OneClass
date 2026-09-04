package com.oneclass.backend.exception;

import com.oneclass.backend.dto.ApiError;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.List;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(UserAlreadyExistsException.class)
    public ResponseEntity<ApiError> handleUserExists(UserAlreadyExistsException ex) {
        return build(HttpStatus.CONFLICT, ex.getMessage(), null);
    }

    @ExceptionHandler({InvalidCredentialsException.class, BadCredentialsException.class})
    public ResponseEntity<ApiError> handleBadCredentials(RuntimeException ex) {
        return build(HttpStatus.UNAUTHORIZED, "Invalid email/phone or password", null);
    }

    @ExceptionHandler(EmailNotVerifiedException.class)
    public ResponseEntity<ApiError> handleEmailNotVerified(EmailNotVerifiedException ex) {
        return build(HttpStatus.FORBIDDEN, ex.getMessage(), null);
    }

    @ExceptionHandler(InvalidOtpException.class)
    public ResponseEntity<ApiError> handleInvalidOtp(InvalidOtpException ex) {
        return build(HttpStatus.BAD_REQUEST, ex.getMessage(), null);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleValidation(MethodArgumentNotValidException ex) {
        List<String> details = ex.getBindingResult().getFieldErrors().stream()
                .map(f -> f.getField() + ": " + f.getDefaultMessage())
                .toList();
        return build(HttpStatus.BAD_REQUEST, "Validation failed", details);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleGeneric(Exception ex) {
        return build(HttpStatus.INTERNAL_SERVER_ERROR, "Something went wrong: " + ex.getMessage(), null);
    }

    private ResponseEntity<ApiError> build(HttpStatus status, String message, List<String> details) {
        ApiError error = ApiError.builder()
                .timestamp(LocalDateTime.now())
                .status(status.value())
                .message(message)
                .details(details)
                .build();
        return ResponseEntity.status(status).body(error);
    }
}
