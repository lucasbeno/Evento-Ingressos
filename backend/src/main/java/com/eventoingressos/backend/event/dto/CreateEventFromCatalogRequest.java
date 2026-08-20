package com.eventoingressos.backend.event.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;

/**
 * Título, imagem, local e data vêm do catálogo (fonte de verdade é a
 * Ticketmaster); o organizador só define o que a Ticketmaster não sabe —
 * quantos ingressos e por quanto.
 */
public record CreateEventFromCatalogRequest(
        @NotBlank(message = "ID do evento no catálogo é obrigatório") String externalId,
        @NotNull @Positive(message = "Capacidade deve ser maior que zero") Integer capacity,
        @NotNull @PositiveOrZero(message = "Preço não pode ser negativo") BigDecimal price) {
}
