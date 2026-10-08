package com.project.doclens_backend.repository;

import com.project.doclens_backend.entity.DocumentMetadata;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DocumentMetaDataRepository extends JpaRepository<DocumentMetadata, UUID> {

    List<DocumentMetadata> findAllByOrderByCreatedAtDesc();
}
