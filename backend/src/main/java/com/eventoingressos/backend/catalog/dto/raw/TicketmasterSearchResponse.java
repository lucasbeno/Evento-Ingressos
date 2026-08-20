package com.eventoingressos.backend.catalog.dto.raw;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public record TicketmasterSearchResponse(@JsonProperty("_embedded") TicketmasterEmbedded embedded) {

    public java.util.List<TicketmasterEvent> events() {
        return embedded == null || embedded.events() == null ? java.util.List.of() : embedded.events();
    }
}
