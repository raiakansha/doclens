package com.project.doclens_backend.exception;


public class DocumentProcessingException extends RuntimeException{


    public DocumentProcessingException(String message) {
        super(message);
    }

    public DocumentProcessingException(){
        super("Error in processing documents !!");
    }


    public DocumentProcessingException(String message, Throwable cause) {
        super(message, cause);
    }
}
