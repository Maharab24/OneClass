package com.oneclass.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ResendOtpRequest {

    @NotBlank(message = "Email is required")
    private String email;
}
