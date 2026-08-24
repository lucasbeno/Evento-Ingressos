package com.eventoingressos.backend.ticket;

import com.eventoingressos.backend.auth.AuthenticatedPrincipal;
import com.eventoingressos.backend.ticket.dto.TicketResponse;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/tickets")
public class TicketController {

    private final TicketService ticketService;

    public TicketController(TicketService ticketService) {
        this.ticketService = ticketService;
    }

    @GetMapping("/mine")
    public List<TicketResponse> listMine(@AuthenticationPrincipal AuthenticatedPrincipal customer) {
        return ticketService.listMine(customer);
    }

    @GetMapping("/shared/{shareToken}")
    public TicketResponse getShared(@PathVariable UUID shareToken) {
        return ticketService.getByShareToken(shareToken);
    }
}
