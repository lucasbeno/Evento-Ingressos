package com.eventoingressos.backend.event.dto;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Só é aceito enquanto o evento está em DRAFT — depois de publicado, mudar
 * capacidade/preço por baixo dos pés de quem já viu o evento publicado não é
 * uma operação que faz sentido oferecer neste escopo.
 */
public record UpdateEventRequest(
        @NotBlank(message = "Título é obrigatório") String title,
        String description,
        @NotBlank(message = "Local é obrigatório") String venueName,
        @NotBlank(message = "Cidade é obrigatória") String venueCity,
        @NotNull(message = "Data é obrigatória") @Future(message = "Data deve ser no futuro") Instant eventDatetime,
        @NotNull @Positive(message = "Capacidade deve ser maior que zero") Integer capacity,
        @NotNull @PositiveOrZero(message = "Preço não pode ser negativo") BigDecimal price) {
}
