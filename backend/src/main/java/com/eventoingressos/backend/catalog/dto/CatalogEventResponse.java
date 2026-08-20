package com.eventoingressos.backend.catalog.dto;

import com.eventoingressos.backend.catalog.dto.raw.TicketmasterEvent;

import java.time.Instant;

public record CatalogEventResponse(
        String externalId,
        String title,
        String imageUrl,
        String venueName,
        String venueCity,
        Instant eventDatetime) {

    public static CatalogEventResponse from(TicketmasterEvent event) {
        Instant start = event.startDateTime() == null ? null : Instant.parse(event.startDateTime());
        return new CatalogEventResponse(
                event.id(),
                event.name(),
                event.imageUrl(),
                event.venueName(),
                event.venueCity(),
                start);
    }
}
