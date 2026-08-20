package com.eventoingressos.backend.catalog.dto.raw;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record TicketmasterEvent(
        String id,
        String name,
        List<TicketmasterImage> images,
        TicketmasterDates dates,
        @JsonProperty("_embedded") TicketmasterVenueEmbedded embedded) {

    public String venueName() {
        return firstVenue().map(TicketmasterVenue::name).orElse(null);
    }

    public String venueCity() {
        return firstVenue()
                .map(TicketmasterVenue::city)
                .map(TicketmasterCity::name)
                .orElse(null);
    }

    public String imageUrl() {
        return images == null || images.isEmpty() ? null : images.get(0).url();
    }

    public String startDateTime() {
        return dates == null || dates.start() == null ? null : dates.start().dateTime();
    }

    private java.util.Optional<TicketmasterVenue> firstVenue() {
        if (embedded == null || embedded.venues() == null || embedded.venues().isEmpty()) {
            return java.util.Optional.empty();
        }
        return java.util.Optional.of(embedded.venues().get(0));
    }
}
