package com.project.doclens_backend.dto;

import com.project.doclens_backend.entity.DocumentStatus;
import lombok.*;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentResponseDto {

    private UUID id;
    private String fileName;
    private Long fileSize;
    private String fileType;
    private DocumentStatus status;
    private Integer chunksCreated;
    private String message;
}
