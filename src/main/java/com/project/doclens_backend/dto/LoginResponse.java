package com.project.doclens_backend.dto;

import lombok.*;

@Builder
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class LoginResponse {

    private String accessToken;
    private UserDto user;
}
