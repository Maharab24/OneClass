package com.oneclass.backend.controller;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class DashboardController {

    // Reachable only with a valid TEACHER JWT
    @GetMapping("/api/teacher/dashboard")
    public Map<String, String> teacherDashboard(Authentication auth) {
        return Map.of("message", "Welcome Teacher " + auth.getName());
    }

    // Reachable only with a valid STUDENT JWT
    @GetMapping("/api/student/dashboard")
    public Map<String, String> studentDashboard(Authentication auth) {
        return Map.of("message", "Welcome Student " + auth.getName());
    }
}
