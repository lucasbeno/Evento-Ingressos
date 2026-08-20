package com.eventoingressos.backend.catalog.dto.raw;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record TicketmasterDateStart(String dateTime, String localDate) {
}
