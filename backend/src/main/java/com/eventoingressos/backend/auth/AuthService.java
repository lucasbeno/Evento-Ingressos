package com.eventoingressos.backend.auth;

import com.eventoingressos.backend.auth.dto.AuthResponse;
import com.eventoingressos.backend.auth.dto.LoginRequest;
import com.eventoingressos.backend.auth.dto.RegisterRequest;
import com.eventoingressos.backend.common.exception.EmailAlreadyRegisteredException;
import com.eventoingressos.backend.user.User;
import com.eventoingressos.backend.user.UserRepository;
import com.eventoingressos.backend.user.UserRole;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    /**
     * Cadastro público é só para clientes. Organizador e portaria são
     * provisionados via seed — não faz sentido alguém se autopromover a
     * dono de evento ou a operador de portaria só preenchendo um formulário.
     */
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new EmailAlreadyRegisteredException(request.email());
        }

        User user = User.builder()
                .name(request.name())
                .email(request.email())
                .passwordHash(passwordEncoder.encode(request.password()))
                .role(UserRole.CUSTOMER)
                .build();

        userRepository.save(user);

        return AuthResponse.of(jwtService.generateToken(user), user);
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new BadCredentialsException("E-mail ou senha inválidos"));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new BadCredentialsException("E-mail ou senha inválidos");
        }

        return AuthResponse.of(jwtService.generateToken(user), user);
    }
}
