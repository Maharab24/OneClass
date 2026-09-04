package com.oneclass.app.features.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginRequest {

    @NotBlank(message = "Email or phone is required")
    private String identifier; // email OR phone

    @NotBlank(message = "Password is required")
    private String password;

    @NotBlank(message = "Role is required")
    private String role; // "TEACHER" or "STUDENT"
}
