package com.eventoingressos.backend.reservation;

import com.eventoingressos.backend.auth.AuthenticatedPrincipal;
import com.eventoingressos.backend.common.exception.EventNotFoundException;
import com.eventoingressos.backend.common.exception.ForbiddenOperationException;
import com.eventoingressos.backend.common.exception.InsufficientAvailabilityException;
import com.eventoingressos.backend.common.exception.InvalidEventStateException;
import com.eventoingressos.backend.common.exception.ReservationNotFoundException;
import com.eventoingressos.backend.event.Event;
import com.eventoingressos.backend.event.EventRepository;
import com.eventoingressos.backend.event.EventStatus;
import com.eventoingressos.backend.reservation.dto.CreateReservationRequest;
import com.eventoingressos.backend.reservation.dto.ReservationResponse;
import com.eventoingressos.backend.user.User;
import com.eventoingressos.backend.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class ReservationService {

    private final ReservationRepository reservationRepository;
    private final EventRepository eventRepository;
    private final UserRepository userRepository;

    public ReservationService(
            ReservationRepository reservationRepository,
            EventRepository eventRepository,
            UserRepository userRepository) {
        this.reservationRepository = reservationRepository;
        this.eventRepository = eventRepository;
        this.userRepository = userRepository;
    }

    /**
     * A reserva do estoque acontece aqui, antes do pagamento — não no
     * momento do pagamento — para que o lugar fique garantido enquanto o
     * cliente está no checkout, e ninguém mais consiga reservar o mesmo
     * ingresso nesse meio-tempo. Se o pagamento for recusado, o estoque
     * reservado é devolvido (ver ReservationPaymentService).
     */
    @Transactional
    public ReservationResponse create(AuthenticatedPrincipal customerPrincipal, CreateReservationRequest request) {
        Event event = eventRepository.findById(request.eventId())
                .orElseThrow(() -> new EventNotFoundException(request.eventId()));

        if (event.getStatus() != EventStatus.PUBLISHED) {
            throw new InvalidEventStateException("Este evento não está disponível para reserva");
        }

        int updatedRows = eventRepository.tryReserveStock(event.getId(), request.quantity());
        if (updatedRows == 0) {
            throw new InsufficientAvailabilityException(
                    "Não há ingressos suficientes disponíveis para este evento");
        }

        User customer = userRepository.findById(customerPrincipal.userId())
                .orElseThrow(() -> new IllegalStateException("Usuário autenticado não encontrado"));

        Reservation reservation = Reservation.builder()
                .event(event)
                .customer(customer)
                .quantity(request.quantity())
                .unitPrice(event.getPrice())
                .status(ReservationStatus.PENDING_PAYMENT)
                .build();

        return ReservationResponse.from(reservationRepository.save(reservation));
    }

    @Transactional(readOnly = true)
    public List<ReservationResponse> listMine(AuthenticatedPrincipal customerPrincipal) {
        return reservationRepository.findByCustomerIdOrderByCreatedAtDesc(customerPrincipal.userId()).stream()
                .map(ReservationResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public Reservation getOwned(UUID reservationId, AuthenticatedPrincipal customerPrincipal) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new ReservationNotFoundException(reservationId));
        if (!reservation.getCustomer().getId().equals(customerPrincipal.userId())) {
            throw new ForbiddenOperationException("Esta reserva pertence a outro cliente");
        }
        return reservation;
    }
}
