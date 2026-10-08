package com.project.doclens_backend.service;

import com.project.doclens_backend.exception.DocumentProcessingException;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.document.Document;
import org.springframework.ai.reader.pdf.PagePdfDocumentReader;
import org.springframework.ai.reader.pdf.config.PdfDocumentReaderConfig;
import org.springframework.ai.reader.tika.TikaDocumentReader;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DocumentParserService {

    private static final Logger logger = LoggerFactory.getLogger(DocumentParserService.class);


    public List<Document> parse(MultipartFile file) {

        String fileName =  file.getOriginalFilename() != null ? file.getOriginalFilename() : "document";
        String contentType = file.getContentType() != null ? file.getContentType() : "";

        logger.info("Parsing document : {}, size : {} bytes, contentType : {}", fileName, file.getSize(), contentType);

        try{
            Resource resource = new ByteArrayResource(file.getBytes()){
                @Override
                public String getFilename() {
                    return fileName;
                }
            };

            if(fileName.toLowerCase().endsWith(".pdf") || contentType.toLowerCase().endsWith(".pdf")){
                return parsePdf(resource);
            }else {
                return parseGenericFile(resource);
            }

        }catch (IOException e) {
            logger.error("Failed to read file bytes : {}", fileName, e);
            throw new DocumentProcessingException("Could not read uploaded file : " + fileName, e);
        }
        catch (Exception e){
            logger.error("Error during parsing document : {}",fileName, e);
            throw new DocumentProcessingException("Error during parsing document : " + fileName, e);
        }
    }

    private List<Document> parsePdf(Resource resource) {

        PdfDocumentReaderConfig config = PdfDocumentReaderConfig.builder()
                .withPageTopMargin(0)
                .withPageBottomMargin(0)
                .build();
        PagePdfDocumentReader documentReader =  new PagePdfDocumentReader(resource, config);

        return documentReader.read();
    }

    private List<Document> parseGenericFile(Resource resource) {

        TikaDocumentReader tikaDocumentReader = new TikaDocumentReader(resource);
        return tikaDocumentReader.read();
    }


}
