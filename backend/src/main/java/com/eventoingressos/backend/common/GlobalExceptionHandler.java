package com.eventoingressos.backend.common;

import com.eventoingressos.backend.common.exception.CatalogIntegrationException;
import com.eventoingressos.backend.common.exception.EmailAlreadyRegisteredException;
import com.eventoingressos.backend.common.exception.EventNotFoundException;
import com.eventoingressos.backend.common.exception.ForbiddenOperationException;
import com.eventoingressos.backend.common.exception.InvalidEventStateException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> fieldErrors = new LinkedHashMap<>();
        ex.getBindingResult().getFieldErrors()
                .forEach(error -> fieldErrors.put(error.getField(), error.getDefaultMessage()));

        return ResponseEntity.badRequest().body(ApiError.of("Dados inválidos", fieldErrors));
    }

    @ExceptionHandler(EmailAlreadyRegisteredException.class)
    public ResponseEntity<ApiError> handleEmailAlreadyRegistered(EmailAlreadyRegisteredException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(ApiError.of(ex.getMessage()));
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiError> handleBadCredentials(BadCredentialsException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiError.of(ex.getMessage()));
    }

    @ExceptionHandler(EventNotFoundException.class)
    public ResponseEntity<ApiError> handleEventNotFound(EventNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiError.of(ex.getMessage()));
    }

    @ExceptionHandler(ForbiddenOperationException.class)
    public ResponseEntity<ApiError> handleForbidden(ForbiddenOperationException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiError.of(ex.getMessage()));
    }

    @ExceptionHandler(InvalidEventStateException.class)
    public ResponseEntity<ApiError> handleInvalidState(InvalidEventStateException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(ApiError.of(ex.getMessage()));
    }

    @ExceptionHandler(CatalogIntegrationException.class)
    public ResponseEntity<ApiError> handleCatalogIntegration(CatalogIntegrationException ex) {
        return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(ApiError.of(ex.getMessage()));
    }
}
