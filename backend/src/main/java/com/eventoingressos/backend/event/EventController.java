package com.eventoingressos.backend.event;

import com.eventoingressos.backend.event.dto.EventResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

/**
 * Navegação pública de eventos — sem autenticação, só mostra o que está
 * PUBLISHED. Gestão do evento pelo organizador está em OrganizerEventController.
 */
@RestController
@RequestMapping("/events")
public class EventController {

    private final EventService eventService;

    public EventController(EventService eventService) {
        this.eventService = eventService;
    }

    @GetMapping
    public List<EventResponse> list() {
        return eventService.listPublished();
    }

    @GetMapping("/{id}")
    public EventResponse get(@PathVariable UUID id) {
        return eventService.getPublished(id);
    }
}
