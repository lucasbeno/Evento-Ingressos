package com.eventoingressos.backend.gate.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

/**
 * eventId é o evento que esta portaria está fazendo check-in agora — é o
 * que permite distinguir "ingresso válido, mas de outro evento" de
 * "ingresso inválido". code vem da câmera (leitura do QR) ou digitado à
 * mão; os dois casos chegam aqui como a mesma string.
 */
public record GateValidationRequest(
        @NotNull(message = "Evento é obrigatório") UUID eventId,
        @NotBlank(message = "Código é obrigatório") String code) {
}
