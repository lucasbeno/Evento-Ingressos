package com.eventoingressos.backend.payment;

import com.eventoingressos.backend.auth.AuthenticatedPrincipal;
import com.eventoingressos.backend.common.exception.InvalidReservationStateException;
import com.eventoingressos.backend.event.EventRepository;
import com.eventoingressos.backend.payment.dto.PaymentRequest;
import com.eventoingressos.backend.payment.dto.PaymentResponse;
import com.eventoingressos.backend.reservation.Reservation;
import com.eventoingressos.backend.reservation.ReservationService;
import com.eventoingressos.backend.reservation.ReservationStatus;
import com.eventoingressos.backend.reservation.dto.ReservationResponse;
import com.eventoingressos.backend.ticket.QrCodeService;
import com.eventoingressos.backend.ticket.Ticket;
import com.eventoingressos.backend.ticket.TicketRepository;
import com.eventoingressos.backend.ticket.TicketStatus;
import com.eventoingressos.backend.ticket.dto.TicketResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class PaymentService {

    private static final String DECLINE_SUFFIX = "0002";

    private final ReservationService reservationService;
    private final EventRepository eventRepository;
    private final TicketRepository ticketRepository;
    private final QrCodeService qrCodeService;

    public PaymentService(
            ReservationService reservationService,
            EventRepository eventRepository,
            TicketRepository ticketRepository,
            QrCodeService qrCodeService) {
        this.reservationService = reservationService;
        this.eventRepository = eventRepository;
        this.ticketRepository = ticketRepository;
        this.qrCodeService = qrCodeService;
    }

    @Transactional
    public PaymentResponse pay(UUID reservationId, AuthenticatedPrincipal customerPrincipal, PaymentRequest request) {
        Reservation reservation = reservationService.getOwned(reservationId, customerPrincipal);

        if (reservation.getStatus() != ReservationStatus.PENDING_PAYMENT) {
            throw new InvalidReservationStateException("Esta reserva já foi paga, recusada ou cancelada");
        }

        boolean approved = !request.cardNumber().endsWith(DECLINE_SUFFIX);

        if (!approved) {
            reservation.setStatus(ReservationStatus.PAYMENT_FAILED);
            eventRepository.releaseStock(reservation.getEvent().getId(), reservation.getQuantity());
            return new PaymentResponse(
                    false, "Pagamento recusado pela operadora do cartão", ReservationResponse.from(reservation), List.of());
        }

        reservation.setStatus(ReservationStatus.PAID);

        List<TicketResponse> tickets = new ArrayList<>();
        for (int i = 0; i < reservation.getQuantity(); i++) {
            UUID ticketId = UUID.randomUUID();
            String qrCode = qrCodeService.generate(ticketId, reservation.getEvent().getId());

            Ticket ticket = Ticket.builder()
                    .id(ticketId)
                    .reservation(reservation)
                    .event(reservation.getEvent())
                    .qrCode(qrCode)
                    .status(TicketStatus.VALID)
                    .build();

            tickets.add(TicketResponse.from(ticketRepository.save(ticket)));
        }

        return new PaymentResponse(true, "Pagamento aprovado", ReservationResponse.from(reservation), tickets);
    }
}
