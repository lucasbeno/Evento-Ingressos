package com.eventoingressos.backend.event;

import com.eventoingressos.backend.user.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "events")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Event {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "organizer_id", nullable = false)
    private User organizer;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "text")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "external_source", nullable = false, length = 20)
    private EventSource externalSource;

    @Column(name = "external_id", length = 100)
    private String externalId;

    @Column(name = "image_url", columnDefinition = "text")
    private String imageUrl;

    @Column(name = "venue_name", nullable = false, length = 200)
    private String venueName;

    @Column(name = "venue_city", nullable = false, length = 120)
    private String venueCity;

    @Column(name = "event_datetime", nullable = false)
    private Instant eventDatetime;

    @Column(nullable = false)
    private Integer capacity;

    @Column(name = "sold_count", nullable = false)
    @Builder.Default
    private Integer soldCount = 0;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private EventStatus status = EventStatus.DRAFT;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }

    @Transient
    public int getAvailableTickets() {
        return capacity - soldCount;
    }
}
