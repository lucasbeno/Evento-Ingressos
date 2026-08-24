package com.eventoingressos.backend.auth;

import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * JwtAuthenticationFilter é um @Component, então o Spring Boot tentaria
     * registrá-lo também como filtro de servlet global (fora da cadeia do
     * Spring Security). Isso o faria rodar cedo demais — antes do
     * SecurityContextHolderFilter recarregar o contexto da requisição — e ser
     * pulado quando a cadeia de segurança chegasse nele (OncePerRequestFilter
     * só executa uma vez por requisição). Desabilita esse registro
     * automático; ele continua ativo via addFilterBefore, na posição certa.
     */
    @Bean
    public FilterRegistrationBean<JwtAuthenticationFilter> disableAutoRegistration(
            JwtAuthenticationFilter filter) {
        FilterRegistrationBean<JwtAuthenticationFilter> registration = new FilterRegistrationBean<>(filter);
        registration.setEnabled(false);
        return registration;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)
                .formLogin(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/auth/**", "/error").permitAll()
                        .requestMatchers(HttpMethod.GET, "/events", "/events/*").permitAll()
                        .requestMatchers("/organizer/**").hasRole("ORGANIZER")
                        .requestMatchers("/reservations/**").hasRole("CUSTOMER")
                        .anyRequest().authenticated())
                .exceptionHandling(handling -> handling
                        .authenticationEntryPoint((request, response, ex) -> {
                            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                            response.setCharacterEncoding("UTF-8");
                            response.setStatus(401);
                            response.getWriter().write("{\"message\":\"Autenticação necessária.\"}");
                        })
                        .accessDeniedHandler((request, response, ex) -> {
                            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                            response.setCharacterEncoding("UTF-8");
                            response.setStatus(403);
                            response.getWriter().write("{\"message\":\"Sem permissão para este recurso.\"}");
                        }))
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
