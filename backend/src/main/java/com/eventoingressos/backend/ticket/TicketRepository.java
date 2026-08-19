package com.eventoingressos.backend.ticket;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TicketRepository extends JpaRepository<Ticket, UUID> {

    Optional<Ticket> findByQrCode(String qrCode);

    Optional<Ticket> findByShareToken(UUID shareToken);

    List<Ticket> findByReservationCustomerIdOrderByCreatedAtDesc(UUID customerId);
}
