package com.project.doclens_backend.service;


import com.project.doclens_backend.dto.DocumentResponseDto;
import com.project.doclens_backend.entity.DocumentMetadata;
import com.project.doclens_backend.entity.DocumentStatus;
import com.project.doclens_backend.exception.DocumentProcessingException;
import com.project.doclens_backend.exception.ResourceNotFoundException;
import com.project.doclens_backend.repository.DocumentMetaDataRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.document.Document;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DocumentMetaDatService {

    private static final Logger logger = LoggerFactory.getLogger(DocumentMetaDatService.class);
    private final DocumentMetaDataRepository documentMetaDataRepository;
    private final ModelMapper modelMapper;
    private final JdbcTemplate jdbcTemplate;
    private final DocumentParserService documentParserService;
    private final DocumentIngestionService documentIngestionService;

    @Transactional
    public DocumentResponseDto uploadAndProcess(MultipartFile file) {

       String fileName =  file.getOriginalFilename() != null ? file.getOriginalFilename() : "document";
       String contentType = file.getContentType() != null ? file.getContentType() : "application/octat-stream";

       //DocumentMeta data create
        DocumentMetadata documentMetadata = DocumentMetadata.builder()
                .filename(fileName)
                .contentType(contentType)
                .status(DocumentStatus.UPLOADING)
                .fileSize(file.getSize())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        //Save the documentMetadata
        documentMetadata = documentMetaDataRepository.save(documentMetadata);
        List<Document> parsedDocs = new ArrayList<>();
        int chunksCreated = 0;

        try{
            //parse the file
            parsedDocs = documentParserService.parse(file);
            //ingest service
            chunksCreated = documentIngestionService.ingest(documentMetadata, parsedDocs);

        }catch (DocumentProcessingException ex){
            logger.error("Error while processing file {} delete due to fail, {}", fileName, ex.getMessage());
            documentMetaDataRepository.delete(documentMetadata);
            throw ex;
        }

        return DocumentResponseDto.builder()
                .id(documentMetadata.getId())
                .fileName(documentMetadata.getFilename())
                .fileSize(documentMetadata.getFileSize())
                .chunksCreated(chunksCreated)
                .status(documentMetadata.getStatus())
                .message("Document Successfully processed.")
                .build();
    }

    public List<DocumentResponseDto> uploadMultipleDocuments(List<MultipartFile> files) {

        List<DocumentResponseDto> response = new ArrayList<>();
        for (MultipartFile file : files) {
            DocumentResponseDto result = this.uploadAndProcess(file);
            response.add(result);
        }

        return response;
    }

    public List<DocumentResponseDto> getAllDocuments() {
        List<DocumentMetadata> allDocuments = documentMetaDataRepository.findAllByOrderByCreatedAtDesc();
        return allDocuments.stream()
                .map(documentMetadata -> modelMapper.map(documentMetadata, DocumentResponseDto.class))
                .toList();
    }

    public DocumentResponseDto getDocumentById(UUID id) {
        DocumentMetadata documentMetadata = documentMetaDataRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Document with given id not found !!"));
        return modelMapper.map(documentMetadata, DocumentResponseDto.class);


    }

    @Transactional
    public void deleteDocument(UUID id) {
        DocumentMetadata documentMetadata = documentMetaDataRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Document with given id not found !!"));


        documentMetaDataRepository.delete(documentMetadata);
        //delete the vector entries
        try {
            String deleteVectorsSql = "DELETE FROM vector_store WHERE metadata->>'documentId' = ?";
            int deletedCount = jdbcTemplate.update(deleteVectorsSql, id.toString());
            logger.info("Deleted {} vector chunks for document id {} ", deletedCount, id);

        } catch (Exception e) {
            logger.warn("could not delete vectors from vector store directly: {}", e.getMessage());
        }

    }
}
