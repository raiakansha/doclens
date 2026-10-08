package com.project.doclens_backend.service;

import com.project.doclens_backend.config.AppProperties;
import com.project.doclens_backend.dto.*;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.ai.vectorstore.filter.FilterExpressionBuilder;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RagService {

    private static final Logger log = LoggerFactory.getLogger(RagService.class);
    private final VectorStore vectorStore;
    private final AppProperties appProperties;
    private final ChatClient chatClient;


    public ChatResponseDto askQuestion(ChatRequestDto request){

        long startTime = System.currentTimeMillis();
        log.info("Processing query : '{}' scoped documentId: {}", request.getQuestion(), request.getDocumentId());

        List<Document> similarDocuments = this.retrieveRelevantDocuments(request.getQuestion(), request.getDocumentId(), request.getTopK(), request.getMinSimilarity());

        List<CitationDto> citations = similarDocuments.stream()
                .map(this::mapToCitation)
                .toList();

        String contextText = buildContextString(similarDocuments);
        String conversationId = request.getConversationId() != null ? request.getConversationId() : UUID.randomUUID().toString();

        String answer = this.chatClient.prompt()
                .system(s -> s.param("doc_context", contextText))
                .user(request.getQuestion())
                .advisors(a -> a.param(ChatMemory.CONVERSATION_ID, conversationId))
                .call()
                .content();

        long responseTime = System.currentTimeMillis() - startTime;
        return ChatResponseDto.builder()
                .answer(answer)
                .citations(citations)
                .conversationId(conversationId)
                .responseTimeMs(responseTime)
                .build();


    }

    // this streams
    public Flux<String> streamQuestionAnswer(ChatRequestDto requestDto) {
        log.info("Streaming query: '{}'", requestDto.getQuestion());
        String conversationId = requestDto.getConversationId() != null ? requestDto.getConversationId() : UUID.randomUUID().toString();
        requestDto.setConversationId(conversationId);
//        ensureConversationExists(conversationId, user, requestDto.getQuestion());

        List<Document> relevantDocuments = retrieveRelevantDocuments(
                requestDto.getQuestion(),
                requestDto.getDocumentId(),
                requestDto.getTopK(),
                requestDto.getMinSimilarity()
        );
        String contextText = buildContextString(relevantDocuments);
        String userPrompt = buildPrompt(requestDto.getQuestion(), contextText);
        return chatClient.prompt()
                .system(s-> s.param("doc_context",contextText))
                .user(requestDto.getQuestion())
                .advisors(a -> a.param(ChatMemory.CONVERSATION_ID, requestDto.getConversationId()))
                .stream()
                .content()
                .concatWith(Flux.just("[DONE]"));


    }

    private String buildPrompt(@NotBlank(message = "Question cannot be empty.") String question, String contextText) {
        if (contextText != null && !contextText.isBlank()) {
            return String.format("""
                           Document Context:
                           User Message / Question: %s            \s
                           Instructions:
                           - If the user's question relates to the document context above, prioritize answering using that context and reference key sections.
                           - If the user is asking a general question, greeting, or discussing topics beyond the document context, respond helpfully and conversationally using your general knowledge while weaving in relevant document context if applicable
                   \s
                   \s""", contextText, question);
        }else {
            return String.format("""
                       User Message / Question:
                       %s                        \s
                       Instructions:
                          - Respond helpfully, accurately, and conversationally to the user's message using your broad knowledge base.
                   \s
                   \s""", question);
        }
    }

    private String buildContextString(List<Document> similarDocuments) {

        if (similarDocuments == null || similarDocuments.isEmpty()) {
            return "";
        }

        return similarDocuments.stream()
                .map(document -> {
                    String fileName = (String) document.getMetadata().getOrDefault("fileName", "Unknown File");
                    Object page = document.getMetadata().getOrDefault("pageNumber", "N/A");
                    return String.format("[Source: %s | Page: %s]\n%s", fileName, page, document.getText());
                })
                .collect(Collectors.joining("\n\n---\n\n"));
    }

    public SearchResultDto searchSimilarChunks(SearchRequestDto request){

        List<Document> matchedDocs  = retrieveRelevantDocuments(request.getQuery(),
                request.getDocumentId(),
                request.getTopK(),
                request.getSimilaritySearch());

       List<CitationDto> citations =  matchedDocs.stream()
                .map(this::mapToCitation)
                .toList();

       return SearchResultDto.builder()
               .query(request.getQuery())
               .totalMatches(citations.size())
               .matches(citations)
               .build();
    }

    private CitationDto mapToCitation(Document document) {
        Map<String, Object> metadata = document.getMetadata();
        UUID docId = null;
        if(metadata.get("documentId") != null) {
            try{
                docId = UUID.fromString((String) metadata.get("documentId"));
            }catch (Exception ignored){

            }
        }
        Integer chunkIndex = null;
        if(metadata.get("chunkIndex") instanceof Number n) {
            chunkIndex = n.intValue();
        }

        Integer pageNumber = null;
        if(metadata.get("pageNumber") instanceof Number n) {
            pageNumber = n.intValue();
        }else if(metadata.get("page_number") instanceof Number n) {
            pageNumber = n.intValue();
        }

        Double score = null;
        if(metadata.get("distance") instanceof Number n) {
            score = 1.0 - n.doubleValue();
        }

        return  CitationDto.builder()
                .documentId(docId)
                .pageNumber(pageNumber)
                .chunkIndex(chunkIndex)
                .fileName((String) metadata.getOrDefault("fileName", "unknown"))
                .snippet(document.getText())
                .similarityScore(score)
                .metadata(metadata)
                .build();
    }

    private List<Document> retrieveRelevantDocuments(@NotBlank(message = "Query cannot be empty") String query, UUID documentId, Integer topK, Double similaritySearch) {

        int effectiveTopK = (topK != null && topK > 0) ? topK : appProperties.getRag().getTopK();
        double effectiveSimilarity = (similaritySearch != null) ? similaritySearch : appProperties.getRag().getSimilarityThreshold();

        SearchRequest.Builder searchRequestBuilder = SearchRequest
                .builder()
                .query(query)
                .topK(effectiveTopK);

        if(effectiveSimilarity > 0.0 ){
            searchRequestBuilder.similarityThreshold(effectiveSimilarity);
        }

        if(documentId != null){
            FilterExpressionBuilder b = new FilterExpressionBuilder();
            searchRequestBuilder.filterExpression(b.eq("documentId", documentId.toString()).build());
        }

        try
        {
            List<Document> documents = vectorStore.similaritySearch(searchRequestBuilder.build());
            log.info("similarity search result: {}", documents);
            return documents;
        }catch (Exception e){
            log.error(e.getMessage());
            return Collections.emptyList();
        }
    }


}
