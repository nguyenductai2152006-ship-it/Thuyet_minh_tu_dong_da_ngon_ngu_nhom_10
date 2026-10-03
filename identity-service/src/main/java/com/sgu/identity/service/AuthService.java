package com.sgu.identity.service;

import com.sgu.identity.dto.AuthDto.AuthResponse;
import com.sgu.identity.dto.AuthDto.LoginRequest;
import com.sgu.identity.dto.AuthDto.RegisterRequest;
import com.sgu.identity.entity.User;
import com.sgu.identity.exception.ConflictException;
import com.sgu.identity.exception.UnauthorizedException;
import com.sgu.identity.repository.UserRepository;
import com.sgu.identity.security.JwtUtils;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtUtils jwtUtils) {

        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtils = jwtUtils;
    }

    /**
     * Đăng ký tài khoản mới.
     */
    public AuthResponse register(RegisterRequest req) {

        String email = req.getEmail().trim().toLowerCase();

        // Kiểm tra email đã tồn tại
        if (userRepository.existsByEmail(email)) {
            throw new ConflictException("Email already exists");
        }

        // Người đăng ký mặc định là USER
        String role = "USER";

        // Tạo User
        User user = new User();
        user.setEmail(email);
        user.setPassword(
                passwordEncoder.encode(req.getPassword())
        );
        user.setFullName(req.getFullName().trim());
        user.setRole(role);

        userRepository.save(user);

        // Response
        AuthResponse response = new AuthResponse();
        response.setEmail(user.getEmail());
        response.setFullName(user.getFullName());
        response.setRole(user.getRole());
        response.setMessage("Registration successful");

        return response;
    }

    /**
     * Đăng nhập.
     */
    public AuthResponse login(LoginRequest req) {

        String email = req.getEmail().trim().toLowerCase();

        // Tìm user
        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new UnauthorizedException(
                                "Invalid email or password"
                        )
                );

        // Kiểm tra password
        if (!passwordEncoder.matches(
                req.getPassword(),
                user.getPassword())) {

            throw new UnauthorizedException(
                    "Invalid email or password"
            );
        }

        // Tạo JWT
        String token = jwtUtils.generateToken(
                user.getEmail(),
                user.getRole()
        );

        // Response
        AuthResponse response = new AuthResponse();
        response.setAccessToken(token);
        response.setEmail(user.getEmail());
        response.setFullName(user.getFullName());
        response.setRole(user.getRole());
        response.setMessage("Login successful");

        return response;
    }
}