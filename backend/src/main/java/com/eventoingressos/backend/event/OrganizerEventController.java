package com.eventoingressos.backend.event;

import com.eventoingressos.backend.auth.AuthenticatedPrincipal;
import com.eventoingressos.backend.event.dto.CreateEventFromCatalogRequest;
import com.eventoingressos.backend.event.dto.CreateEventRequest;
import com.eventoingressos.backend.event.dto.EventResponse;
import com.eventoingressos.backend.event.dto.UpdateEventRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Gestão de eventos pelo organizador dono deles. Path separado de /events
 * (navegação pública) para que a regra de autorização no SecurityConfig seja
 * um simples prefixo, sem colidir com o /events/{id} público.
 */
@RestController
@RequestMapping("/organizer/events")
public class OrganizerEventController {

    private final EventService eventService;

    public OrganizerEventController(EventService eventService) {
        this.eventService = eventService;
    }

    @PostMapping
    public ResponseEntity<EventResponse> create(
            @AuthenticationPrincipal AuthenticatedPrincipal organizer,
            @Valid @RequestBody CreateEventRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(eventService.create(organizer, request));
    }

    @PostMapping("/from-catalog")
    public ResponseEntity<EventResponse> createFromCatalog(
            @AuthenticationPrincipal AuthenticatedPrincipal organizer,
            @Valid @RequestBody CreateEventFromCatalogRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(eventService.createFromCatalog(organizer, request));
    }

    @GetMapping
    public List<EventResponse> listMine(@AuthenticationPrincipal AuthenticatedPrincipal organizer) {
        return eventService.listMine(organizer);
    }

    @GetMapping("/{id}")
    public EventResponse getMine(
            @AuthenticationPrincipal AuthenticatedPrincipal organizer, @PathVariable UUID id) {
        return eventService.getMine(id, organizer);
    }

    @PutMapping("/{id}")
    public EventResponse update(
            @AuthenticationPrincipal AuthenticatedPrincipal organizer,
            @PathVariable UUID id,
            @Valid @RequestBody UpdateEventRequest request) {
        return eventService.update(id, organizer, request);
    }

    @PostMapping("/{id}/publish")
    public EventResponse publish(
            @AuthenticationPrincipal AuthenticatedPrincipal organizer, @PathVariable UUID id) {
        return eventService.publish(id, organizer);
    }
}
