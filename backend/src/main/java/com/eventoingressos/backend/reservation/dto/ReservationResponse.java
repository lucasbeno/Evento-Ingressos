package com.eventoingressos.backend.reservation.dto;

import com.eventoingressos.backend.reservation.Reservation;
import com.eventoingressos.backend.reservation.ReservationStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record ReservationResponse(
        UUID id,
        UUID eventId,
        String eventTitle,
        Instant eventDatetime,
        Integer quantity,
        BigDecimal unitPrice,
        BigDecimal totalPrice,
        ReservationStatus status,
        Instant createdAt) {

    public static ReservationResponse from(Reservation reservation) {
        return new ReservationResponse(
                reservation.getId(),
                reservation.getEvent().getId(),
                reservation.getEvent().getTitle(),
                reservation.getEvent().getEventDatetime(),
                reservation.getQuantity(),
                reservation.getUnitPrice(),
                reservation.getTotalPrice(),
                reservation.getStatus(),
                reservation.getCreatedAt());
    }
}
