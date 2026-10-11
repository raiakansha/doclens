package com.project.doclens_backend.controller;


import com.project.doclens_backend.dto.LoginRequest;
import com.project.doclens_backend.dto.LoginResponse;
import com.project.doclens_backend.dto.RegisterUserRequest;
import com.project.doclens_backend.dto.UserDto;
import com.project.doclens_backend.entity.User;
import com.project.doclens_backend.repository.UserRepository;
import com.project.doclens_backend.service.CustomUserDetail;
import com.project.doclens_backend.service.JwtService;
import com.project.doclens_backend.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;
    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final JwtService jwtService;

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(
            @RequestBody LoginRequest loginRequest
    ) {
        Authentication authentication = new UsernamePasswordAuthenticationToken(
                loginRequest.getUsername(),
                loginRequest.getPassword()
        );
        Authentication authenticated = authenticationManager.authenticate(authentication);
        User user = userRepository.findByUsername(loginRequest.getUsername()).orElseThrow(() -> new RuntimeException("User not found"));

        String token = jwtService.generateToken(new CustomUserDetail(user));
        var response = LoginResponse.builder()
                .accessToken(token)
                .user(UserDto
                        .builder()
                        .id(user.getId())
                        .username(user.getUsername())
                        .email(user.getEmail())
                        .role(user.getRole())
                        .build())
                .build();
        return ResponseEntity.ok(response);
    }

    @PostMapping("/register")
    public ResponseEntity<UserDto> register(
            @Valid @RequestBody RegisterUserRequest registerUserRequest
    ) {
        UserDto userDto = userService.registerUser(registerUserRequest);
        return ResponseEntity.status(HttpStatus.CREATED).body(userDto);

    }
}
