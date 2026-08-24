package com.eventoingressos.backend.ticket;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TicketRepository extends JpaRepository<Ticket, UUID> {

    Optional<Ticket> findByQrCode(String qrCode);

    Optional<Ticket> findByShareToken(UUID shareToken);

    List<Ticket> findByReservationCustomerIdOrderByCreatedAtDesc(UUID customerId);

    List<Ticket> findByEventIdAndStatus(UUID eventId, TicketStatus status);

    /**
     * Mesmo princípio do EventRepository.tryReserveStock: um UPDATE
     * condicional atômico, não um "ler status, decidir, gravar" em duas
     * idas ao banco — senão dois porteiros escaneando o mesmo ingresso ao
     * mesmo tempo poderiam ambos ver "válido". Retorna 0 se o ingresso já
     * não estava VALID no momento do update (idempotência real).
     */
    @Modifying
    @Query("UPDATE Ticket t SET t.status = com.eventoingressos.backend.ticket.TicketStatus.USED, t.usedAt = :usedAt " +
            "WHERE t.id = :id AND t.status = com.eventoingressos.backend.ticket.TicketStatus.VALID")
    int tryMarkUsed(@Param("id") UUID id, @Param("usedAt") Instant usedAt);
}
