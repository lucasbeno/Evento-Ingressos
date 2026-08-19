CREATE TABLE users (
    id             UUID PRIMARY KEY,
    name           VARCHAR(150) NOT NULL,
    email          VARCHAR(180) NOT NULL UNIQUE,
    password_hash  VARCHAR(255) NOT NULL,
    role           VARCHAR(20)  NOT NULL CHECK (role IN ('ORGANIZER', 'CUSTOMER', 'GATE')),
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE events (
    id               UUID PRIMARY KEY,
    organizer_id     UUID NOT NULL REFERENCES users (id),
    title            VARCHAR(200) NOT NULL,
    description      TEXT,
    external_source  VARCHAR(20)  NOT NULL DEFAULT 'MANUAL' CHECK (external_source IN ('TICKETMASTER', 'MANUAL')),
    external_id      VARCHAR(100),
    image_url        TEXT,
    venue_name       VARCHAR(200) NOT NULL,
    venue_city       VARCHAR(120) NOT NULL,
    event_datetime   TIMESTAMPTZ  NOT NULL,
    capacity         INTEGER      NOT NULL CHECK (capacity > 0),
    sold_count       INTEGER      NOT NULL DEFAULT 0 CHECK (sold_count >= 0 AND sold_count <= capacity),
    price            NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    status           VARCHAR(20)  NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PUBLISHED', 'CANCELLED')),
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_events_status_datetime ON events (status, event_datetime);
CREATE INDEX idx_events_organizer ON events (organizer_id);

CREATE TABLE reservations (
    id           UUID PRIMARY KEY,
    event_id     UUID NOT NULL REFERENCES events (id),
    customer_id  UUID NOT NULL REFERENCES users (id),
    quantity     INTEGER NOT NULL CHECK (quantity > 0),
    unit_price   NUMERIC(10, 2) NOT NULL,
    status       VARCHAR(20) NOT NULL DEFAULT 'PENDING_PAYMENT'
                     CHECK (status IN ('PENDING_PAYMENT', 'PAID', 'PAYMENT_FAILED', 'CANCELLED')),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_reservations_customer ON reservations (customer_id);
CREATE INDEX idx_reservations_event ON reservations (event_id);

CREATE TABLE tickets (
    id              UUID PRIMARY KEY,
    reservation_id  UUID NOT NULL REFERENCES reservations (id),
    event_id        UUID NOT NULL REFERENCES events (id),
    qr_code         VARCHAR(255) NOT NULL UNIQUE,
    share_token     UUID NOT NULL UNIQUE,
    status          VARCHAR(20) NOT NULL DEFAULT 'VALID' CHECK (status IN ('VALID', 'USED', 'CANCELLED')),
    used_at         TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tickets_reservation ON tickets (reservation_id);
CREATE INDEX idx_tickets_event ON tickets (event_id);
