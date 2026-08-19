package com.eventoingressos.backend.auth.dto;

import com.eventoingressos.backend.user.User;
import com.eventoingressos.backend.user.UserRole;

import java.util.UUID;

public record AuthResponse(String token, UUID userId, String name, String email, UserRole role) {

    public static AuthResponse of(String token, User user) {
        return new AuthResponse(token, user.getId(), user.getName(), user.getEmail(), user.getRole());
    }
}
