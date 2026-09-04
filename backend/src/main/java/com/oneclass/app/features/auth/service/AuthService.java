package com.oneclass.app.features.auth.service;

import com.oneclass.app.config.security.JwtUtil;
import com.oneclass.app.features.auth.dto.*;
import com.oneclass.app.features.auth.exception.*;
import com.oneclass.app.features.auth.model.Role;
import com.oneclass.app.features.auth.model.User;
import com.oneclass.app.features.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final EmailService emailService;

    @Value("${app.otp.expiration-minutes}")
    private long otpExpirationMinutes;

    private static final SecureRandom RANDOM = new SecureRandom();

    @Transactional
    public MessageResponse register(RegisterRequest request) {
        Role role = parseRole(request.getRole());

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new UserAlreadyExistsException("An account with this email already exists");
        }
        if (userRepository.existsByPhone(request.getPhone())) {
            throw new UserAlreadyExistsException("An account with this phone number already exists");
        }

        String otp = generateOtp();

        User user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(role)
                .enabled(true)
                .emailVerified(false)
                .otpCode(otp)
                .otpExpiry(LocalDateTime.now().plusMinutes(otpExpirationMinutes))
                .build();

        userRepository.save(user);
        emailService.sendOtpEmail(user.getEmail(), otp);

        return MessageResponse.builder()
                .message("Registration successful. A verification code was sent to " + user.getEmail())
                .build();
    }

    @Transactional
    public AuthResponse verifyOtp(VerifyOtpRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new InvalidOtpException("No account found for this email"));

        if (user.isEmailVerified()) {
            throw new InvalidOtpException("Email is already verified");
        }
        if (user.getOtpCode() == null || user.getOtpExpiry() == null) {
            throw new InvalidOtpException("No verification code pending — request a new one");
        }
        if (LocalDateTime.now().isAfter(user.getOtpExpiry())) {
            throw new InvalidOtpException("Verification code expired — request a new one");
        }
        if (!user.getOtpCode().equals(request.getOtpCode().trim())) {
            throw new InvalidOtpException("Incorrect verification code");
        }

        user.setEmailVerified(true);
        user.setOtpCode(null);
        user.setOtpExpiry(null);
        userRepository.save(user);

        String token = jwtUtil.generateToken(user.getEmail(), user.getId(), user.getRole().name());

        return AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .build();
    }

    @Transactional
    public MessageResponse resendOtp(ResendOtpRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new InvalidOtpException("No account found for this email"));

        if (user.isEmailVerified()) {
            throw new InvalidOtpException("Email is already verified");
        }

        String otp = generateOtp();
        user.setOtpCode(otp);
        user.setOtpExpiry(LocalDateTime.now().plusMinutes(otpExpirationMinutes));
        userRepository.save(user);

        emailService.sendOtpEmail(user.getEmail(), otp);

        return MessageResponse.builder()
                .message("A new verification code was sent to " + user.getEmail())
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        Role role = parseRole(request.getRole());
        String identifier = request.getIdentifier().trim();

        User user = (identifier.contains("@")
                ? userRepository.findByEmailAndRole(identifier, role)
                : userRepository.findByPhoneAndRole(identifier, role))
                .orElseThrow(() -> new InvalidCredentialsException("Invalid credentials"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new InvalidCredentialsException("Invalid credentials");
        }

        if (!user.isEmailVerified()) {
            throw new EmailNotVerifiedException("Please verify your email before logging in");
        }

        String token = jwtUtil.generateToken(user.getEmail(), user.getId(), user.getRole().name());

        return AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .build();
    }

    private String generateOtp() {
        int code = 100000 + RANDOM.nextInt(900000);
        return String.valueOf(code);
    }

    private Role parseRole(String raw) {
        try {
            return Role.valueOf(raw.trim().toUpperCase());
        } catch (Exception e) {
            throw new IllegalArgumentException("Role must be TEACHER or STUDENT");
        }
    }
}
