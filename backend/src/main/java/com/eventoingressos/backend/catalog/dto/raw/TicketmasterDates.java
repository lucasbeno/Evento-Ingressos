package com.eventoingressos.backend.catalog.dto.raw;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record TicketmasterDates(TicketmasterDateStart start) {
}
