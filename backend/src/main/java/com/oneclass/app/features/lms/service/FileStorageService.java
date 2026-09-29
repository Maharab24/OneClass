package com.oneclass.app.features.lms.service;

import com.oneclass.app.features.auth.model.User;
import com.oneclass.app.features.lms.dto.LmsDtos;
import com.oneclass.app.features.lms.model.StoredFile;
import com.oneclass.app.features.lms.repository.StoredFileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FileStorageService {

    private final StoredFileRepository storedFileRepository;

    @Value("${app.upload-dir:${java.io.tmpdir}/oneclass-uploads}")
    private String uploadDir;

    @Transactional
    public LmsDtos.FileDto store(MultipartFile file, User user) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File is required");
        }
        try {
            Path dir = Path.of(uploadDir);
            Files.createDirectories(dir);
            String storedName = UUID.randomUUID() + "-" + sanitize(file.getOriginalFilename());
            Path target = dir.resolve(storedName);
            file.transferTo(target.toFile());

            StoredFile saved = storedFileRepository.save(StoredFile.builder()
                    .originalName(file.getOriginalFilename())
                    .contentType(file.getContentType())
                    .storedName(storedName)
                    .sizeBytes(file.getSize())
                    .uploadedById(user.getId())
                    .build());
            return toDto(saved);
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to store file");
        }
    }

    public Resource load(Long id) {
        StoredFile stored = storedFileRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "File not found"));
        Path path = Path.of(uploadDir).resolve(stored.getStoredName());
        if (!Files.exists(path)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "File missing on disk");
        }
        return new FileSystemResource(path);
    }

    public StoredFile requireMeta(Long id) {
        return storedFileRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "File not found"));
    }

    public LmsDtos.FileDto toDto(StoredFile stored) {
        return LmsDtos.FileDto.builder()
                .id(stored.getId())
                .originalName(stored.getOriginalName())
                .contentType(stored.getContentType())
                .url("/api/lms/files/" + stored.getId())
                .sizeBytes(stored.getSizeBytes())
                .build();
    }

    private String sanitize(String name) {
        if (name == null || name.isBlank()) {
            return "file";
        }
        return name.replaceAll("[^a-zA-Z0-9._-]", "_");
    }
}
