package com.eventoingressos.backend.catalog;

import com.eventoingressos.backend.catalog.dto.raw.TicketmasterEvent;
import com.eventoingressos.backend.catalog.dto.raw.TicketmasterSearchResponse;
import com.eventoingressos.backend.common.exception.CatalogIntegrationException;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.List;

@Component
public class TicketmasterClient {

    private final RestClient restClient;
    private final TicketmasterProperties properties;

    public TicketmasterClient(RestClient ticketmasterRestClient, TicketmasterProperties properties) {
        this.restClient = ticketmasterRestClient;
        this.properties = properties;
    }

    public List<TicketmasterEvent> search(String keyword) {
        requireApiKey();
        try {
            TicketmasterSearchResponse response = restClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/events.json")
                            .queryParam("apikey", properties.apiKey())
                            .queryParam("keyword", keyword)
                            .queryParam("size", 20)
                            .build())
                    .retrieve()
                    .body(TicketmasterSearchResponse.class);

            return response == null ? List.of() : response.events();
        } catch (RestClientException e) {
            throw new CatalogIntegrationException(
                    "Não foi possível buscar o catálogo da Ticketmaster: " + e.getMessage(), e);
        }
    }

    public TicketmasterEvent getById(String externalId) {
        requireApiKey();
        try {
            TicketmasterEvent event = restClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/events/{id}.json")
                            .queryParam("apikey", properties.apiKey())
                            .build(externalId))
                    .retrieve()
                    .body(TicketmasterEvent.class);

            if (event == null) {
                throw new CatalogIntegrationException("Evento não encontrado no catálogo da Ticketmaster: " + externalId);
            }
            return event;
        } catch (RestClientException e) {
            throw new CatalogIntegrationException(
                    "Não foi possível buscar o evento " + externalId + " na Ticketmaster: " + e.getMessage(), e);
        }
    }

    private void requireApiKey() {
        if (properties.apiKey() == null || properties.apiKey().isBlank()) {
            throw new CatalogIntegrationException(
                    "TICKETMASTER_API_KEY não configurada — gere uma chave gratuita em developer.ticketmaster.com");
        }
    }
}
