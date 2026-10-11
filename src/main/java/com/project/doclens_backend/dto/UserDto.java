package com.project.doclens_backend.dto;

import com.project.doclens_backend.entity.Role;
import lombok.*;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class UserDto {
    private String username;
    private String email;
    private Role role;
    private Long id;

}
