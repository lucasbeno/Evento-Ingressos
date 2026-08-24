package com.eventoingressos.backend.gate.dto;

import com.eventoingressos.backend.gate.GateValidationResult;

import java.time.Instant;
import java.util.UUID;

public record GateValidationResponse(
        GateValidationResult result,
        String message,
        UUID ticketId,
        String eventTitle,
        String customerName,
        Instant usedAt) {

    public static GateValidationResponse of(GateValidationResult result, String message) {
        return new GateValidationResponse(result, message, null, null, null, null);
    }
}
