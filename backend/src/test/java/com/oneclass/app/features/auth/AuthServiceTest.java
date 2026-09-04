package com.oneclass.app.features.auth;

import com.oneclass.app.config.security.JwtUtil;
import com.oneclass.app.features.auth.dto.*;
import com.oneclass.app.features.auth.exception.EmailNotVerifiedException;
import com.oneclass.app.features.auth.exception.InvalidCredentialsException;
import com.oneclass.app.features.auth.exception.InvalidOtpException;
import com.oneclass.app.features.auth.exception.UserAlreadyExistsException;
import com.oneclass.app.features.auth.model.Role;
import com.oneclass.app.features.auth.model.User;
import com.oneclass.app.features.auth.repository.UserRepository;
import com.oneclass.app.features.auth.service.AuthService;
import com.oneclass.app.features.auth.service.EmailService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtUtil jwtUtil;

    @Mock
    private EmailService emailService;

    @InjectMocks
    private AuthService authService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(authService, "otpExpirationMinutes", 10L);
    }

    @Test
    void register_Success() {
        RegisterRequest request = new RegisterRequest();
        request.setFullName("John Doe");
        request.setEmail("john@example.com");
        request.setPhone("+1234567890");
        request.setPassword("password123");
        request.setRole("TEACHER");

        when(userRepository.existsByEmail("john@example.com")).thenReturn(false);
        when(userRepository.existsByPhone("+1234567890")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("encodedPassword");

        MessageResponse response = authService.register(request);

        assertNotNull(response);
        assertTrue(response.getMessage().contains("Registration successful"));
        verify(userRepository, times(1)).save(any(User.class));
        verify(emailService, times(1)).sendOtpEmail(eq("john@example.com"), anyString());
    }

    @Test
    void register_EmailAlreadyExists_ThrowsException() {
        RegisterRequest request = new RegisterRequest();
        request.setFullName("John Doe");
        request.setEmail("john@example.com");
        request.setPhone("+1234567890");
        request.setPassword("password123");
        request.setRole("TEACHER");

        when(userRepository.existsByEmail("john@example.com")).thenReturn(true);

        assertThrows(UserAlreadyExistsException.class, () -> authService.register(request));
        verify(userRepository, never()).save(any());
    }

    @Test
    void verifyOtp_Success() {
        VerifyOtpRequest request = new VerifyOtpRequest();
        request.setEmail("john@example.com");
        request.setOtpCode("123456");

        User user = User.builder()
                .id(1L)
                .fullName("John Doe")
                .email("john@example.com")
                .role(Role.TEACHER)
                .emailVerified(false)
                .otpCode("123456")
                .otpExpiry(LocalDateTime.now().plusMinutes(5))
                .build();

        when(userRepository.findByEmail("john@example.com")).thenReturn(Optional.of(user));
        when(jwtUtil.generateToken("john@example.com", 1L, "TEACHER")).thenReturn("mockToken");

        AuthResponse response = authService.verifyOtp(request);

        assertNotNull(response);
        assertEquals("mockToken", response.getToken());
        assertEquals("John Doe", response.getFullName());
        assertTrue(user.isEmailVerified());
        assertNull(user.getOtpCode());
        verify(userRepository).save(user);
    }

    @Test
    void verifyOtp_IncorrectCode_ThrowsException() {
        VerifyOtpRequest request = new VerifyOtpRequest();
        request.setEmail("john@example.com");
        request.setOtpCode("999999");

        User user = User.builder()
                .id(1L)
                .fullName("John Doe")
                .email("john@example.com")
                .role(Role.TEACHER)
                .emailVerified(false)
                .otpCode("123456")
                .otpExpiry(LocalDateTime.now().plusMinutes(5))
                .build();

        when(userRepository.findByEmail("john@example.com")).thenReturn(Optional.of(user));

        assertThrows(InvalidOtpException.class, () -> authService.verifyOtp(request));
    }

    @Test
    void login_Success() {
        LoginRequest request = new LoginRequest();
        request.setIdentifier("john@example.com");
        request.setPassword("password123");
        request.setRole("TEACHER");

        User user = User.builder()
                .id(1L)
                .fullName("John Doe")
                .email("john@example.com")
                .password("encodedPassword")
                .role(Role.TEACHER)
                .emailVerified(true)
                .build();

        when(userRepository.findByEmailAndRole("john@example.com", Role.TEACHER))
                .thenReturn(Optional.of(user));
        when(passwordEncoder.matches("password123", "encodedPassword")).thenReturn(true);
        when(jwtUtil.generateToken("john@example.com", 1L, "TEACHER")).thenReturn("mockJwtToken");

        AuthResponse response = authService.login(request);

        assertNotNull(response);
        assertEquals("mockJwtToken", response.getToken());
    }

    @Test
    void login_EmailNotVerified_ThrowsException() {
        LoginRequest request = new LoginRequest();
        request.setIdentifier("john@example.com");
        request.setPassword("password123");
        request.setRole("TEACHER");

        User user = User.builder()
                .id(1L)
                .fullName("John Doe")
                .email("john@example.com")
                .password("encodedPassword")
                .role(Role.TEACHER)
                .emailVerified(false)
                .build();

        when(userRepository.findByEmailAndRole("john@example.com", Role.TEACHER))
                .thenReturn(Optional.of(user));
        when(passwordEncoder.matches("password123", "encodedPassword")).thenReturn(true);

        assertThrows(EmailNotVerifiedException.class, () -> authService.login(request));
    }
}
