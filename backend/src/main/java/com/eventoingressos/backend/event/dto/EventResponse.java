package com.eventoingressos.backend.event.dto;

import com.eventoingressos.backend.event.Event;
import com.eventoingressos.backend.event.EventSource;
import com.eventoingressos.backend.event.EventStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record EventResponse(
        UUID id,
        UUID organizerId,
        String organizerName,
        String title,
        String description,
        EventSource externalSource,
        String imageUrl,
        String venueName,
        String venueCity,
        Instant eventDatetime,
        Integer capacity,
        Integer soldCount,
        Integer availableTickets,
        BigDecimal price,
        EventStatus status,
        Instant createdAt) {

    public static EventResponse from(Event event) {
        return new EventResponse(
                event.getId(),
                event.getOrganizer().getId(),
                event.getOrganizer().getName(),
                event.getTitle(),
                event.getDescription(),
                event.getExternalSource(),
                event.getImageUrl(),
                event.getVenueName(),
                event.getVenueCity(),
                event.getEventDatetime(),
                event.getCapacity(),
                event.getSoldCount(),
                event.getAvailableTickets(),
                event.getPrice(),
                event.getStatus(),
                event.getCreatedAt());
    }
}
