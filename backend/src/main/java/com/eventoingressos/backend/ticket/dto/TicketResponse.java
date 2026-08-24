package com.eventoingressos.backend.ticket.dto;

import com.eventoingressos.backend.ticket.Ticket;
import com.eventoingressos.backend.ticket.TicketStatus;

import java.time.Instant;
import java.util.UUID;

public record TicketResponse(
        UUID id,
        UUID eventId,
        String eventTitle,
        Instant eventDatetime,
        String venueName,
        String venueCity,
        String qrCode,
        UUID shareToken,
        TicketStatus status,
        Instant usedAt,
        Instant createdAt) {

    public static TicketResponse from(Ticket ticket) {
        return new TicketResponse(
                ticket.getId(),
                ticket.getEvent().getId(),
                ticket.getEvent().getTitle(),
                ticket.getEvent().getEventDatetime(),
                ticket.getEvent().getVenueName(),
                ticket.getEvent().getVenueCity(),
                ticket.getQrCode(),
                ticket.getShareToken(),
                ticket.getStatus(),
                ticket.getUsedAt(),
                ticket.getCreatedAt());
    }
}
