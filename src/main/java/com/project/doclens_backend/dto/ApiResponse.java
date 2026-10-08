package com.project.doclens_backend.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ApiResponse<T> {

    private String message;
    private T data;
    private Boolean success;
    private LocalDateTime timestamp;
}
