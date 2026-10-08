package com.project.doclens_backend.service;

import com.project.doclens_backend.config.AppProperties;
import com.project.doclens_backend.entity.DocumentMetadata;
import com.project.doclens_backend.entity.DocumentStatus;
import com.project.doclens_backend.exception.DocumentProcessingException;
import com.project.doclens_backend.repository.DocumentMetaDataRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.document.Document;
import org.springframework.ai.transformer.splitter.TokenTextSplitter;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class DocumentIngestionService {

    private static final Logger logger = LoggerFactory.getLogger(DocumentIngestionService.class);
    private final VectorStore vectorStore;
    private final DocumentMetaDataRepository documentMetaDataRepository;
    private final AppProperties appProperties;

    public int ingest(DocumentMetadata documentMetadata, List<Document> parsedDocs) {
        logger.info("Ingesting document [id={}, name= {}, pageSize= {}]", documentMetadata.getId(), documentMetadata.getFilename(), documentMetadata.getFileSize());

        try {
            documentMetadata.setStatus(DocumentStatus.PROCESSING);
            documentMetadata.setTotalPages(parsedDocs.size());

            //1. Token Text spit
            TokenTextSplitter tokenTextSplitter = TokenTextSplitter.builder()
                    .withChunkSize(appProperties.getRag().getChunkSize())
                    .withMaxNumChunks(appProperties.getRag().getMaxNumChunks())
                    .withMinChunkLengthToEmbed(appProperties.getRag().getMinChunkLengthToEmbed())
                    .withMinChunkSizeChars(appProperties.getRag().getMinChunkSizeChars())
                    .withKeepSeparator(true)
                    .build();

            List<Document> chunks = tokenTextSplitter.apply(parsedDocs);
            if(chunks.isEmpty()){
                documentMetadata.setStatus(DocumentStatus.FAILED);
                documentMetadata.setTotalPages(0);
                documentMetadata.setErrorMessage("Document appears to be empty or unscannable");
                documentMetaDataRepository.save(documentMetadata);
                return 0;
            }

            //2. Metadata enrichment to each chunk
            List<Document> enrichChunks = new ArrayList<>();
            for (int i = 0; i < chunks.size(); i++) {
                Document chunk = chunks.get(i);
                Map<String, Object> enrichedMetadata = new HashMap<>(chunk.getMetadata());
                enrichedMetadata.put("documentId", documentMetadata.getId().toString());
                enrichedMetadata.put("fileName", documentMetadata.getFilename());
                enrichedMetadata.put("fileSize", documentMetadata.getFileSize());
                enrichedMetadata.put("contentType", documentMetadata.getContentType());
                enrichedMetadata.put("chunkId", i);

                //Preserve or calculate page number if available
                Object pageNumber = chunk.getMetadata().get("page_number");
                if(pageNumber == null){
                    enrichedMetadata.put("pageNumber", pageNumber);
                }

                if (pageNumber != null) {
                    enrichedMetadata.put("pageNumber", pageNumber);
                }

                Document enrichDoc = new Document(chunk.getText(), enrichedMetadata);
                enrichChunks.add(enrichDoc);
            }

            //3. write chunks and embedding to pgvector
            logger.info("Writing vector chunk to vector store");

            vectorStore.add(enrichChunks);

            documentMetadata.setStatus(DocumentStatus.INDEXED);
            documentMetadata.setTotalChunks(enrichChunks.size());
            documentMetadata.setErrorMessage(null);
            documentMetaDataRepository.save(documentMetadata);
            logger.info("Vector store written successfully");

            return enrichChunks.size();
        }catch (Exception e){
            logger.error("Error while writing vector chunk to vector store: {}", e.getMessage(), e);
            documentMetadata.setStatus(DocumentStatus.FAILED);
            documentMetadata.setErrorMessage(e.getMessage());
            documentMetaDataRepository.save(documentMetadata);
            throw new DocumentProcessingException("Error while writing vector chunk to vector store: " + e.getMessage());
        }
    }
}
