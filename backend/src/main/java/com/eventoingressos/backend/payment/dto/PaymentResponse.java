package com.eventoingressos.backend.payment.dto;

import com.eventoingressos.backend.reservation.dto.ReservationResponse;
import com.eventoingressos.backend.ticket.dto.TicketResponse;

import java.util.List;

public record PaymentResponse(
        boolean approved, String message, ReservationResponse reservation, List<TicketResponse> tickets) {
}
