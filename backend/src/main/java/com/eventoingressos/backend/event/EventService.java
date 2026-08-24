package com.eventoingressos.backend.event;

import com.eventoingressos.backend.auth.AuthenticatedPrincipal;
import com.eventoingressos.backend.catalog.TicketmasterClient;
import com.eventoingressos.backend.catalog.dto.raw.TicketmasterEvent;
import com.eventoingressos.backend.common.exception.CatalogIntegrationException;
import com.eventoingressos.backend.common.exception.EventNotFoundException;
import com.eventoingressos.backend.common.exception.ForbiddenOperationException;
import com.eventoingressos.backend.common.exception.InvalidEventStateException;
import com.eventoingressos.backend.event.dto.CreateEventFromCatalogRequest;
import com.eventoingressos.backend.event.dto.CreateEventRequest;
import com.eventoingressos.backend.event.dto.EventResponse;
import com.eventoingressos.backend.event.dto.UpdateEventRequest;
import com.eventoingressos.backend.reservation.Reservation;
import com.eventoingressos.backend.reservation.ReservationRepository;
import com.eventoingressos.backend.reservation.ReservationStatus;
import com.eventoingressos.backend.ticket.Ticket;
import com.eventoingressos.backend.ticket.TicketRepository;
import com.eventoingressos.backend.ticket.TicketStatus;
import com.eventoingressos.backend.user.User;
import com.eventoingressos.backend.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Métodos mapeiam para EventResponse aqui dentro, ainda na transação —
 * "organizer" é LAZY, e devolver a entidade Event pro controller acessar
 * organizer.getName() fora da transação estoura LazyInitializationException.
 */
@Service
public class EventService {

    private final EventRepository eventRepository;
    private final UserRepository userRepository;
    private final TicketmasterClient ticketmasterClient;
    private final ReservationRepository reservationRepository;
    private final TicketRepository ticketRepository;

    public EventService(
            EventRepository eventRepository,
            UserRepository userRepository,
            TicketmasterClient ticketmasterClient,
            ReservationRepository reservationRepository,
            TicketRepository ticketRepository) {
        this.eventRepository = eventRepository;
        this.userRepository = userRepository;
        this.ticketmasterClient = ticketmasterClient;
        this.reservationRepository = reservationRepository;
        this.ticketRepository = ticketRepository;
    }

    @Transactional
    public EventResponse create(AuthenticatedPrincipal organizerPrincipal, CreateEventRequest request) {
        User organizer = userRepository.findById(organizerPrincipal.userId())
                .orElseThrow(() -> new IllegalStateException("Usuário autenticado não encontrado"));

        Event event = Event.builder()
                .organizer(organizer)
                .title(request.title())
                .description(request.description())
                .externalSource(EventSource.MANUAL)
                .imageUrl(request.imageUrl())
                .venueName(request.venueName())
                .venueCity(request.venueCity())
                .eventDatetime(request.eventDatetime())
                .capacity(request.capacity())
                .price(request.price())
                .status(EventStatus.DRAFT)
                .build();

        return EventResponse.from(eventRepository.save(event));
    }

    @Transactional
    public EventResponse createFromCatalog(
            AuthenticatedPrincipal organizerPrincipal, CreateEventFromCatalogRequest request) {
        User organizer = userRepository.findById(organizerPrincipal.userId())
                .orElseThrow(() -> new IllegalStateException("Usuário autenticado não encontrado"));

        TicketmasterEvent catalogEvent = ticketmasterClient.getById(request.externalId());

        if (catalogEvent.startDateTime() == null) {
            throw new CatalogIntegrationException(
                    "Este evento do catálogo não tem uma data/hora definida — escolha outro ou crie manualmente");
        }
        if (catalogEvent.venueName() == null) {
            throw new CatalogIntegrationException(
                    "Este evento do catálogo não tem um local definido — escolha outro ou crie manualmente");
        }

        Event event = Event.builder()
                .organizer(organizer)
                .title(catalogEvent.name())
                .externalSource(EventSource.TICKETMASTER)
                .externalId(catalogEvent.id())
                .imageUrl(catalogEvent.imageUrl())
                .venueName(catalogEvent.venueName())
                .venueCity(catalogEvent.venueCity())
                .eventDatetime(Instant.parse(catalogEvent.startDateTime()))
                .capacity(request.capacity())
                .price(request.price())
                .status(EventStatus.DRAFT)
                .build();

        return EventResponse.from(eventRepository.save(event));
    }

    @Transactional
    public EventResponse update(UUID eventId, AuthenticatedPrincipal organizerPrincipal, UpdateEventRequest request) {
        Event event = getOwnedByOrganizer(eventId, organizerPrincipal);

        if (event.getStatus() != EventStatus.DRAFT) {
            throw new InvalidEventStateException("Só é possível editar um evento enquanto ele está em rascunho");
        }

        event.setTitle(request.title());
        event.setDescription(request.description());
        event.setImageUrl(request.imageUrl());
        event.setVenueName(request.venueName());
        event.setVenueCity(request.venueCity());
        event.setEventDatetime(request.eventDatetime());
        event.setCapacity(request.capacity());
        event.setPrice(request.price());

        return EventResponse.from(event);
    }

    @Transactional
    public EventResponse publish(UUID eventId, AuthenticatedPrincipal organizerPrincipal) {
        Event event = getOwnedByOrganizer(eventId, organizerPrincipal);

        if (event.getStatus() != EventStatus.DRAFT) {
            throw new InvalidEventStateException("Só é possível publicar um evento que está em rascunho");
        }

        event.setStatus(EventStatus.PUBLISHED);
        return EventResponse.from(event);
    }

    /**
     * "Retirar" um evento. Cancela junto as reservas pendentes de pagamento
     * (o cliente não pode pagar por um evento que não vai mais acontecer —
     * é aqui que entra a "devolução ao estoque") e os ingressos já pagos
     * (para a portaria não validar como se o evento ainda estivesse de pé).
     * Reservas já pagas continuam com status PAID — é fato histórico que
     * foram pagas, isso não muda; só o ingresso em si é invalidado.
     */
    @Transactional
    public EventResponse cancel(UUID eventId, AuthenticatedPrincipal organizerPrincipal) {
        Event event = getOwnedByOrganizer(eventId, organizerPrincipal);

        if (event.getStatus() == EventStatus.CANCELLED) {
            throw new InvalidEventStateException("Este evento já está cancelado");
        }

        for (Reservation reservation : reservationRepository.findByEventIdAndStatus(
                eventId, ReservationStatus.PENDING_PAYMENT)) {
            reservation.setStatus(ReservationStatus.CANCELLED);
        }

        for (Ticket ticket : ticketRepository.findByEventIdAndStatus(eventId, TicketStatus.VALID)) {
            ticket.setStatus(TicketStatus.CANCELLED);
        }

        event.setStatus(EventStatus.CANCELLED);
        return EventResponse.from(event);
    }

    @Transactional(readOnly = true)
    public List<EventResponse> listPublished() {
        return eventRepository.findByStatusOrderByEventDatetimeAsc(EventStatus.PUBLISHED).stream()
                .map(EventResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public EventResponse getPublished(UUID eventId) {
        Event event = eventRepository.findById(eventId).orElseThrow(() -> new EventNotFoundException(eventId));
        if (event.getStatus() != EventStatus.PUBLISHED) {
            // Não revela que um rascunho de outro organizador existe.
            throw new EventNotFoundException(eventId);
        }
        return EventResponse.from(event);
    }

    @Transactional(readOnly = true)
    public List<EventResponse> listMine(AuthenticatedPrincipal organizerPrincipal) {
        return eventRepository.findByOrganizerIdOrderByEventDatetimeDesc(organizerPrincipal.userId()).stream()
                .map(EventResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public EventResponse getMine(UUID eventId, AuthenticatedPrincipal organizerPrincipal) {
        return EventResponse.from(getOwnedByOrganizer(eventId, organizerPrincipal));
    }

    private Event getOwnedByOrganizer(UUID eventId, AuthenticatedPrincipal organizerPrincipal) {
        Event event = eventRepository.findById(eventId).orElseThrow(() -> new EventNotFoundException(eventId));
        if (!event.getOrganizer().getId().equals(organizerPrincipal.userId())) {
            throw new ForbiddenOperationException("Este evento pertence a outro organizador");
        }
        return event;
    }
}
