package com.eventoingressos.backend.event;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface EventRepository extends JpaRepository<Event, UUID> {

    List<Event> findByStatusOrderByEventDatetimeAsc(EventStatus status);

    List<Event> findByOrganizerIdOrderByEventDatetimeDesc(UUID organizerId);

    /**
     * UPDATE condicional atômico: incrementa sold_count só se ainda couber
     * dentro de capacity, tudo numa única ida ao banco. É essa query — não
     * um lock otimista no objeto JPA — que garante que o mesmo lugar não
     * seja vendido duas vezes sob concorrência real. Retorna quantas linhas
     * mudaram: 0 significa "não havia estoque suficiente".
     */
    @Modifying
    @Query("UPDATE Event e SET e.soldCount = e.soldCount + :quantity " +
            "WHERE e.id = :eventId AND e.soldCount + :quantity <= e.capacity")
    int tryReserveStock(@Param("eventId") UUID eventId, @Param("quantity") int quantity);

    @Modifying
    @Query("UPDATE Event e SET e.soldCount = e.soldCount - :quantity WHERE e.id = :eventId")
    void releaseStock(@Param("eventId") UUID eventId, @Param("quantity") int quantity);
}
