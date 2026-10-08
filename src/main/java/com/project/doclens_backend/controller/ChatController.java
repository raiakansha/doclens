package com.project.doclens_backend.controller;

import com.project.doclens_backend.dto.*;
import com.project.doclens_backend.service.RagService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;

import java.time.LocalDateTime;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/chat")
public class ChatController {

    private final RagService ragService;

    @PostMapping("/query")
    @Operation(summary = "Ask question against all documents or a specific document with citations")
    public ResponseEntity<ApiResponse<ChatResponseDto>> query(@Valid @RequestBody ChatRequestDto chatRequestDto) {
        ChatResponseDto chatResponseDto = ragService.askQuestion(chatRequestDto);

        return ResponseEntity.ok(
                ApiResponse.
                        <ChatResponseDto>
                        builder()
                        .success(true)
                        .message(null)
                        .data(chatResponseDto)
                        .timestamp(LocalDateTime.now())
                        .build()
        );
    }

    @PostMapping("/stream")
    @Operation(summary = "Stream real-time Q&A answer tokens via Server-sent Events(SSE)")
    public Flux<String> streamQuestion(@Valid @RequestBody ChatRequestDto chatRequestDto) {
        return ragService.streamQuestionAnswer(chatRequestDto);
    }

    @PostMapping("/search/similarity")
    @Operation(summary = "Perform semantic similarity search on stored document vectors")
    public ResponseEntity<ApiResponse<SearchResultDto>> searchSimilar(
            @Valid @RequestBody SearchRequestDto request

    ) {
        SearchResultDto results = ragService.searchSimilarChunks(request);
        return ResponseEntity.ok(
                ApiResponse.
                        <SearchResultDto>
                        builder()
                        .success(true)
                        .message(null)
                        .data(results)
                        .timestamp(LocalDateTime.now())
                        .build()
        );
    }
}
