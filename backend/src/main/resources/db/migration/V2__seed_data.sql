-- Dados de teste pedidos no desafio: um organizador, dois clientes, um
-- usuário de portaria e um evento publicado com ingressos disponíveis.
-- Senha de todas as contas: Senha123!
-- Hash gerado com BCryptPasswordEncoder (mesmo algoritmo usado em runtime).

INSERT INTO users (id, name, email, password_hash, role) VALUES
    ('11111111-1111-1111-1111-111111111111', 'Organizador Demo', 'organizador@evento-ingressos.com',
     '$2a$10$5inp5b.lSsATpDkmS.hmeOsUio/rJOuM4Fs3inSjB7HpmffhciAaS', 'ORGANIZER'),
    ('22222222-2222-2222-2222-222222222222', 'Cliente Demo Um', 'cliente1@evento-ingressos.com',
     '$2a$10$5inp5b.lSsATpDkmS.hmeOsUio/rJOuM4Fs3inSjB7HpmffhciAaS', 'CUSTOMER'),
    ('33333333-3333-3333-3333-333333333333', 'Cliente Demo Dois', 'cliente2@evento-ingressos.com',
     '$2a$10$5inp5b.lSsATpDkmS.hmeOsUio/rJOuM4Fs3inSjB7HpmffhciAaS', 'CUSTOMER'),
    ('44444444-4444-4444-4444-444444444444', 'Portaria Demo', 'portaria@evento-ingressos.com',
     '$2a$10$5inp5b.lSsATpDkmS.hmeOsUio/rJOuM4Fs3inSjB7HpmffhciAaS', 'GATE');

INSERT INTO events (
    id, organizer_id, title, description, external_source, venue_name, venue_city,
    event_datetime, capacity, sold_count, price, status
) VALUES (
    '55555555-5555-5555-5555-555555555555',
    '11111111-1111-1111-1111-111111111111',
    'Noite de Rock no Recife Antigo',
    'Show semeado para avaliação — evento publicado com ingressos disponíveis.',
    'MANUAL',
    'Marco Zero',
    'Recife',
    '2027-12-31 22:00:00+00',
    100,
    0,
    120.00,
    'PUBLISHED'
);
