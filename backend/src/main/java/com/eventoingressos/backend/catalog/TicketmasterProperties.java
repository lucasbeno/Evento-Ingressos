package com.eventoingressos.backend.catalog;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.ticketmaster")
public record TicketmasterProperties(String apiKey, String baseUrl) {
}
