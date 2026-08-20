package com.eventoingressos.backend.catalog;

import com.eventoingressos.backend.catalog.dto.CatalogEventResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Catálogo externo (Ticketmaster) que o organizador usa como ponto de
 * partida para montar um evento — não é navegação pública de eventos
 * (isso é /events).
 */
@RestController
@RequestMapping("/organizer/catalog")
public class CatalogController {

    private final TicketmasterClient ticketmasterClient;

    public CatalogController(TicketmasterClient ticketmasterClient) {
        this.ticketmasterClient = ticketmasterClient;
    }

    @GetMapping("/search")
    public List<CatalogEventResponse> search(@RequestParam String keyword) {
        return ticketmasterClient.search(keyword).stream().map(CatalogEventResponse::from).toList();
    }
}
