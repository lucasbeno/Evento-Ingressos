package com.eventoingressos.backend.auth;

import com.eventoingressos.backend.user.UserRole;

import java.util.UUID;

/**
 * Principal montado a partir das claims do JWT, sem round-trip ao banco a
 * cada requisição autenticada.
 */
public record AuthenticatedPrincipal(UUID userId, String email, UserRole role) {
}
