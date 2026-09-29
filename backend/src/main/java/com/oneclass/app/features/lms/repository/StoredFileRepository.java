package com.oneclass.app.features.lms.repository;

import com.oneclass.app.features.lms.model.StoredFile;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StoredFileRepository extends JpaRepository<StoredFile, Long> {
}
