package com.eventoingressos.backend.event;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface EventRepository extends JpaRepository<Event, UUID> {

    List<Event> findByStatusOrderByEventDatetimeAsc(EventStatus status);

    List<Event> findByOrganizerIdOrderByEventDatetimeDesc(UUID organizerId);
}
