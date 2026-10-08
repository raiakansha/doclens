package com.project.doclens_backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Getter
@Service
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Data
public class ChatRequestDto {

    @NotBlank(message = "Question cannot be empty.")
    private String question;
    private UUID documentId;
    private Integer topK;
    private Double minSimilarity;
    private Double maxSimilarity;
    private String conversationId;
}
