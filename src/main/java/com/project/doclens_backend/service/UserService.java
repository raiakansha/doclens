package com.project.doclens_backend.service;

import com.project.doclens_backend.dto.RegisterUserRequest;
import com.project.doclens_backend.dto.UserDto;
import com.project.doclens_backend.entity.Role;
import com.project.doclens_backend.entity.User;
import com.project.doclens_backend.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserDto registerUser(@Valid RegisterUserRequest registerUserRequest) {

        //validation
        if(registerUserRequest.username().isBlank()){
            throw new IllegalArgumentException("Username cannot be blank");
        }
        if(userRepository.existsByUsername(registerUserRequest.username())){
            throw new IllegalArgumentException("Username already exists");
        }

        User user = new User();
        user.setUsername(registerUserRequest.username());
        user.setEmail(registerUserRequest.email());
        user.setPassword(passwordEncoder.encode(registerUserRequest.password()));
        user.setRole(Role.USER);
        User savedUser = userRepository.save(user);
        return new UserDto(savedUser.getUsername(), savedUser.getEmail(), savedUser.getRole(), savedUser.getId());
    }
}
