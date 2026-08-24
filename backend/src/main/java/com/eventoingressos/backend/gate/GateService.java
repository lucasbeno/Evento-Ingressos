package com.eventoingressos.backend.gate;

import com.eventoingressos.backend.gate.dto.GateValidationRequest;
import com.eventoingressos.backend.gate.dto.GateValidationResponse;
import com.eventoingressos.backend.ticket.QrCodeService;
import com.eventoingressos.backend.ticket.Ticket;
import com.eventoingressos.backend.ticket.TicketRepository;
import com.eventoingressos.backend.ticket.TicketStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Service
public class GateService {

    private final TicketRepository ticketRepository;
    private final QrCodeService qrCodeService;

    public GateService(TicketRepository ticketRepository, QrCodeService qrCodeService) {
        this.ticketRepository = ticketRepository;
        this.qrCodeService = qrCodeService;
    }

    @Transactional
    public GateValidationResponse validate(GateValidationRequest request) {
        UUID ticketId = parseTicketId(request.code());
        if (ticketId == null) {
            return GateValidationResponse.of(GateValidationResult.INVALID, "Código ilegível");
        }

        Optional<Ticket> ticketOpt = ticketRepository.findById(ticketId);
        if (ticketOpt.isEmpty()) {
            return GateValidationResponse.of(GateValidationResult.INVALID, "Ingresso não encontrado");
        }
        Ticket ticket = ticketOpt.get();

        if (!qrCodeService.isValid(request.code(), ticket.getId(), ticket.getEvent().getId())) {
            return GateValidationResponse.of(GateValidationResult.INVALID, "Assinatura do código não confere");
        }

        if (!ticket.getEvent().getId().equals(request.eventId())) {
            return new GateValidationResponse(
                    GateValidationResult.WRONG_EVENT,
                    "Este ingresso é de outro evento: " + ticket.getEvent().getTitle(),
                    ticket.getId(),
                    ticket.getEvent().getTitle(),
                    ticket.getReservation().getCustomer().getName(),
                    ticket.getUsedAt());
        }

        if (ticket.getStatus() == TicketStatus.CANCELLED) {
            return GateValidationResponse.of(GateValidationResult.INVALID, "Ingresso cancelado");
        }

        Instant now = Instant.now();
        int updated = ticketRepository.tryMarkUsed(ticket.getId(), now);

        if (updated == 0) {
            return new GateValidationResponse(
                    GateValidationResult.ALREADY_USED,
                    "Ingresso já utilizado" + (ticket.getUsedAt() != null ? " em " + ticket.getUsedAt() : ""),
                    ticket.getId(),
                    ticket.getEvent().getTitle(),
                    ticket.getReservation().getCustomer().getName(),
                    ticket.getUsedAt());
        }

        return new GateValidationResponse(
                GateValidationResult.VALID,
                "Ingresso válido — entrada liberada",
                ticket.getId(),
                ticket.getEvent().getTitle(),
                ticket.getReservation().getCustomer().getName(),
                now);
    }

    private UUID parseTicketId(String code) {
        String[] parts = code.split("\\.", 2);
        if (parts.length != 2) {
            return null;
        }
        try {
            return UUID.fromString(parts[0]);
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}
