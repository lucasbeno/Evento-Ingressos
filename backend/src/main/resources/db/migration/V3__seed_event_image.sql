-- Evento manual não tinha campo de imagem até esta etapa; agora que
-- CreateEventRequest/UpdateEventRequest aceitam imageUrl, dá pra semear o
-- evento de demonstração com uma foto de verdade em vez de placeholder.
UPDATE events
SET image_url = 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=800&q=80'
WHERE id = '55555555-5555-5555-5555-555555555555';
