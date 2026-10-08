package com.project.doclens_backend.controller;

import com.project.doclens_backend.dto.ApiResponse;
import com.project.doclens_backend.dto.DocumentResponseDto;
import com.project.doclens_backend.service.DocumentMetaDatService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/documents")
public class DocumentController {

    private final DocumentMetaDatService documentMetaDatService;

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(
            summary = "Upload and index a document(PDF, DOC, TEXT, MD, CSV)",
            description = "This api is used to upload and index the document file."
    )
    public ResponseEntity<ApiResponse<DocumentResponseDto>> upload(@RequestParam("file") MultipartFile file) {

        DocumentResponseDto documentResponseDto = documentMetaDatService.uploadAndProcess(file);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.<DocumentResponseDto>builder()
                        .success(true)
                        .data(documentResponseDto)
                        .timestamp(LocalDateTime.now())
                        .message("Document uploaded successfully.")
                        .build());

    }

    @PostMapping(value = "/upload-mutiple", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(
            summary = "Upload and index multiple documents simultaneously",
            description = "This api is used to upload and index multiple documents."
    )
    public ResponseEntity<ApiResponse<List<DocumentResponseDto>>> uploadMutiple(@RequestParam("files") List<MultipartFile> files) {
        List<DocumentResponseDto> response = documentMetaDatService.uploadMultipleDocuments(files);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(
                        ApiResponse.<List<DocumentResponseDto>>
                                builder()
                                .message("Document Uploaded Successfully")
                                .success(true)
                                .timestamp(LocalDateTime.now())
                                .data(response)
                                .build()

                );
    }

    @GetMapping
    @Operation(summary = "List all uploaded documents and their indexing status")
    public ResponseEntity<ApiResponse<List<DocumentResponseDto>>> getAllDocuments(){
        List<DocumentResponseDto> documents =documentMetaDatService.getAllDocuments();
        return ResponseEntity.ok(
                ApiResponse.<List<DocumentResponseDto>>
                                builder()
                        .message("All documents is here")
                        .success(true)
                        .timestamp(LocalDateTime.now())
                        .data(documents)
                        .build()
        );
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get metadata of a specific document by ID")
    public ResponseEntity<ApiResponse<DocumentResponseDto>> getDocumentById(@PathVariable UUID id) {
        DocumentResponseDto document = documentMetaDatService.getDocumentById(id);
        return ResponseEntity.ok(
                ApiResponse.<DocumentResponseDto>
                                builder()
                        .message("Single document is here")
                        .success(true)
                        .timestamp(LocalDateTime.now())
                        .data(document)
                        .build()
        );
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a document and purge its vector embeddings from vector store")
    public ResponseEntity<ApiResponse<Void>> deleteDocument(@PathVariable UUID id) {
        documentMetaDatService.deleteDocument(id);
        return ResponseEntity.ok(
                ApiResponse.<Void>
                                builder()
                        .message("Document deleted successfully")
                        .success(true)
                        .timestamp(LocalDateTime.now())
                        .data(null)
                        .build()
        );
    }
}
