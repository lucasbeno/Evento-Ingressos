package com.eventoingressos.backend.ticket;

import com.eventoingressos.backend.event.Event;
import com.eventoingressos.backend.reservation.Reservation;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

/**
 * Cada unidade de um {@link Reservation} vira um Ticket próprio: a portaria
 * valida ingresso a ingresso, não a reserva inteira.
 */
@Entity
@Table(name = "tickets")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Ticket {

    // Sem @GeneratedValue: o id precisa existir *antes* do insert, porque
    // entra na assinatura HMAC do QR code (ver QrCodeService). O gerador de
    // UUID do Hibernate só atribui o valor no momento do insert, tarde
    // demais para isso — o id é sempre setado explicitamente pelo chamador.
    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "reservation_id", nullable = false)
    private Reservation reservation;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @Column(name = "qr_code", nullable = false, unique = true, length = 255)
    private String qrCode;

    @Column(name = "share_token", nullable = false, unique = true)
    private UUID shareToken;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private TicketStatus status = TicketStatus.VALID;

    @Column(name = "used_at")
    private Instant usedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
        if (shareToken == null) {
            shareToken = UUID.randomUUID();
        }
    }
}
