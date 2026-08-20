package com.eventoingressos.backend.catalog.dto.raw;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record TicketmasterEmbedded(List<TicketmasterEvent> events) {
}
