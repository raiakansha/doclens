package com.project.doclens_backend.repository;

import com.project.doclens_backend.dto.DocumentResponseDto;
import com.project.doclens_backend.entity.DocumentMetadata;
import com.project.doclens_backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DocumentMetaDataRepository extends JpaRepository<DocumentMetadata, UUID> {

    List<DocumentMetadata> findAllByOrderByCreatedAtDesc();

    List<DocumentMetadata> findByUserOrderByCreatedAtDesc(User user);

    Optional<DocumentMetadata> findByIdAndUser(UUID id, User user);
}
