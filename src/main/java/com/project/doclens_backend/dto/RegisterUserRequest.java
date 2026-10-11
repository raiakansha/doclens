package com.project.doclens_backend.dto;

public record RegisterUserRequest(
        String username,
        String email,
        String password
) {
}
