package com.eventoingressos.backend.event;

import com.eventoingressos.backend.auth.AuthenticatedPrincipal;
import com.eventoingressos.backend.common.exception.EventNotFoundException;
import com.eventoingressos.backend.common.exception.ForbiddenOperationException;
import com.eventoingressos.backend.common.exception.InvalidEventStateException;
import com.eventoingressos.backend.event.dto.CreateEventRequest;
import com.eventoingressos.backend.event.dto.EventResponse;
import com.eventoingressos.backend.event.dto.UpdateEventRequest;
import com.eventoingressos.backend.user.User;
import com.eventoingressos.backend.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    public EventService(EventRepository eventRepository, UserRepository userRepository) {
        this.eventRepository = eventRepository;
        this.userRepository = userRepository;
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
    public EventResponse update(UUID eventId, AuthenticatedPrincipal organizerPrincipal, UpdateEventRequest request) {
        Event event = getOwnedByOrganizer(eventId, organizerPrincipal);

        if (event.getStatus() != EventStatus.DRAFT) {
            throw new InvalidEventStateException("Só é possível editar um evento enquanto ele está em rascunho");
        }

        event.setTitle(request.title());
        event.setDescription(request.description());
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
