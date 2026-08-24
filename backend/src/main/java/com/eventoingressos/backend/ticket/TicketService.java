package com.eventoingressos.backend.ticket;

import com.eventoingressos.backend.auth.AuthenticatedPrincipal;
import com.eventoingressos.backend.common.exception.TicketNotFoundException;
import com.eventoingressos.backend.ticket.dto.TicketResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class TicketService {

    private final TicketRepository ticketRepository;

    public TicketService(TicketRepository ticketRepository) {
        this.ticketRepository = ticketRepository;
    }

    @Transactional(readOnly = true)
    public List<TicketResponse> listMine(AuthenticatedPrincipal customerPrincipal) {
        return ticketRepository.findByReservationCustomerIdOrderByCreatedAtDesc(customerPrincipal.userId()).stream()
                .map(TicketResponse::from)
                .toList();
    }

    /**
     * Rota pública (sem autenticação) por trás do link de compartilhamento —
     * quem recebe o link não precisa ter conta. O share_token é um UUID
     * separado do id do ingresso, então descobrir um não revela o outro.
     */
    @Transactional(readOnly = true)
    public TicketResponse getByShareToken(UUID shareToken) {
        return ticketRepository.findByShareToken(shareToken)
                .map(TicketResponse::from)
                .orElseThrow(() -> new TicketNotFoundException("Ingresso não encontrado"));
    }
}
