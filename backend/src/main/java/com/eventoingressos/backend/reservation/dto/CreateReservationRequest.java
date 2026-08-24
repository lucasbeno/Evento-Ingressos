package com.eventoingressos.backend.reservation.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.util.UUID;

public record CreateReservationRequest(
        @NotNull(message = "Evento é obrigatório") UUID eventId,
        @NotNull @Positive(message = "Quantidade deve ser maior que zero")
        @Max(value = 10, message = "Máximo de 10 ingressos por reserva") Integer quantity) {
}
