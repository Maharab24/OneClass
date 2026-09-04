package com.oneclass.app.features.auth.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    public void sendOtpEmail(String toEmail, String otpCode) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject("OneClass — Verify your email");
        message.setText(
                "Your OneClass verification code is: " + otpCode +
                        "\n\nThis code expires in 10 minutes. If you didn't request this, ignore this email."
        );

        try {
            mailSender.send(message);
        } catch (MailException ex) {
            log.warn("Could not send OTP email to {} (SMTP not configured?). " +
                    "DEV FALLBACK — OTP code is: {}", toEmail, otpCode);
        }
    }
}
