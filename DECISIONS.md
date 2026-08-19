# Decisões do projeto

Este arquivo registra as decisões tomadas ao longo do desenvolvimento e o motivo de cada uma,
para dar contexto a escolhas que, sem explicação, poderiam parecer arbitrárias.

## Escopo e domínio

O desafio pede uma plataforma de eventos e ingressos com três papéis (Organizador, Cliente,
Portaria). Optei por implementar o fluxo de **pista** (reserva por quantidade) em vez de mapa de
assentos. O enunciado permite escolher um dos dois, e pista cobre o mesmo problema central —
controle de concorrência para não vender o mesmo lugar duas vezes — sem a complexidade extra
de um grid de assentos, que tomaria tempo que prefiro investir em fazer o fluxo completo (busca →
reserva → pagamento → ingresso → validação) funcionar bem de ponta a ponta, como pede a seção
"Dica" do desafio.

## Stack

- **Back-end: Java + Spring Boot.** Entre as opções permitidas (Node/Python/Java), Spring Boot
  força uma separação de camadas mais explícita (controller/service/repository), o que ajuda a
  manter regras de negócio sensíveis — como impedir overselling e revalidação de ingresso —
  isoladas e testáveis.
- **Front-end: React (Vite + TypeScript).** Vite em vez de Next.js porque o projeto não precisa de
  SSR/rotas de servidor — é uma SPA consumindo uma API própria. Menos configuração, build mais
  rápido.
- **Banco de dados: PostgreSQL hospedado** (Neon ou Supabase, free tier) desde o desenvolvimento
  local, em vez de Docker Compose. A máquina de desenvolvimento não tinha Docker instalado, e
  como o deploy final já ia precisar de um Postgres hospedado mesmo assim, optei por usar a mesma
  connection string em dev e produção — evita divergência de ambiente e simplifica o README (quem
  for rodar o projeto só precisa criar uma instância gratuita e colar a connection string). O acesso é
  via `.env` (não versionado, com `.env.example` como referência), importado nativamente pelo
  Spring Boot via `spring.config.import=optional:file:.env[.properties]` (a lib `spring-dotenv`
  que eu tinha usado inicialmente não é compatível com o Spring Boot 4 — troquei por esse
  mecanismo nativo depois de validar que o boot falhava silenciosamente). Migrations com Flyway
  para o histórico de schema ficar versionado junto com o código.

## API externa

Escolhi **Ticketmaster Discovery API** em vez de TMDb. O domínio do desafio é "eventos e
ingressos" — um catálogo de shows mapeia mais diretamente para o fluco de negócio (local, data,
capacidade) do que um catálogo de filmes, que exigiria inventar conceitos como sessão e sala que
não existem na API do TMDb.

## Modelagem de domínio

`Event` guarda `capacity` e `sold_count` diretamente (em vez de uma tabela de "estoque" separada),
com um `CHECK` no banco garantindo `sold_count <= capacity`. A reserva (etapa seguinte) vai
incrementar esse contador com um `UPDATE` condicional atômico (`WHERE sold_count + :qty <=
capacity`), que é a garantia real contra overselling — não um lock otimista no objeto JPA, que
falharia sob concorrência real sem retry manual.

Cada unidade de uma `Reservation` vira um `Ticket` individual (reserva de 3 ingressos gera 3
`Ticket`s). A portaria valida ingresso a ingresso, então cada um precisa do próprio QR e do próprio
estado (`VALID`/`USED`/`CANCELLED`) — validar a reserva como um todo não permitiria detectar
que só 2 das 3 pessoas já entraram.

## Autenticação

JWT com um campo de papel (`role`) no token: `ORGANIZER`, `CUSTOMER`, `GATE`. Sem
recuperação de senha (explicitamente fora do escopo pedido). Endpoints protegidos por papel via
guarda de autorização no back-end, não só escondendo botões no front.

## Ingresso e QR

O código do QR não é um UUID aleatório exposto puro: é um token assinado (HMAC) contendo o id
do ingresso, para que a portaria consiga validar autenticidade sem precisar de round-trip
adicional, e para que não seja possível forjar um ingresso apenas adivinhando um id sequencial.
A validação na portaria é idempotente — a segunda tentativa de validar o mesmo ingresso retorna
"já utilizado", não um novo sucesso.

## Deploy

Front-end na Vercel; back-end e banco em um serviço com suporte a container Java de longa duração
(Render/Railway — decisão final registrada quando a etapa de deploy acontecer), já que o desafio
pede publicação para facilitar a avaliação (+1 ponto) e Spring Boot não é serverless-friendly como
uma função Node/Python seria.

## Uso de IA

Este projeto foi construído em par com Claude (Anthropic), usado como assistente de
desenvolvimento dentro do editor. O README final vai detalhar em que partes a IA foi usada
(scaffolding, boilerplate repetitivo) e quais decisões de arquitetura, UX e trade-offs foram
minhas, conforme pedido no desafio.

*(este arquivo será atualizado a cada etapa do desenvolvimento)*
