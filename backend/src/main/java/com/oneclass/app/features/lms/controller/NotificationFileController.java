package com.oneclass.app.features.lms.controller;

import com.oneclass.app.features.lms.dto.LmsDtos;
import com.oneclass.app.features.lms.model.StoredFile;
import com.oneclass.app.features.lms.service.CurrentUserService;
import com.oneclass.app.features.lms.service.FileStorageService;
import com.oneclass.app.features.lms.service.LearningService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/lms")
@RequiredArgsConstructor
public class NotificationFileController {

    private final LearningService learningService;
    private final FileStorageService fileStorageService;
    private final CurrentUserService currentUserService;

    @GetMapping("/notifications")
    public List<LmsDtos.NotificationDto> notifications(Authentication auth) {
        return learningService.myNotifications(currentUserService.require(auth));
    }

    @PostMapping("/notifications/{id}/read")
    public void markRead(@PathVariable Long id, Authentication auth) {
        learningService.markRead(id, currentUserService.require(auth));
    }

    @PostMapping("/notifications/read-all")
    public void markAll(Authentication auth) {
        learningService.markAllRead(currentUserService.require(auth));
    }

    @PostMapping(value = "/files", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public LmsDtos.FileDto upload(@RequestParam("file") MultipartFile file, Authentication auth) {
        return fileStorageService.store(file, currentUserService.require(auth));
    }

    @GetMapping("/files/{id}")
    public ResponseEntity<Resource> download(@PathVariable Long id) {
        StoredFile meta = fileStorageService.requireMeta(id);
        Resource resource = fileStorageService.load(id);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + meta.getOriginalName() + "\"")
                .contentType(meta.getContentType() != null ? MediaType.parseMediaType(meta.getContentType()) : MediaType.APPLICATION_OCTET_STREAM)
                .body(resource);
    }
}
