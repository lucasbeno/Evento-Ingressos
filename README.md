# Evento-Ingressos

Plataforma de eventos e ingressos — desafio Elite Dev (Verzel).

Um organizador monta eventos a partir do catálogo da **Ticketmaster Discovery API**, definindo
data, local, capacidade e preço. O cliente navega pelos eventos publicados, reserva ingressos,
paga de forma simulada e recebe um ingresso com QR Code, que pode compartilhar por link. Na
entrada, a portaria valida o ingresso.

As decisões de arquitetura e escopo, e o porquê de cada uma, estão em [DECISIONS.md](./DECISIONS.md).

## Stack

- **Back-end:** Java + Spring Boot, PostgreSQL (hospedado), Flyway, JWT
- **Front-end:** React + Vite + TypeScript

## Status

Projeto em desenvolvimento. Progresso:

- [x] Estrutura do repositório e decisões iniciais
- [x] Modelagem de domínio e banco de dados
- [x] Autenticação (Organizador / Cliente / Portaria)
- [x] Gestão de eventos pelo organizador (criar, editar, publicar)
- [x] Integração com Ticketmaster Discovery ⚠️ ver nota abaixo
- [x] Fluxo de reserva (controle de concorrência testado sob carga real)
- [x] Pagamento simulado + geração de ingresso com QR assinado
- [x] Compartilhamento de ingresso por link + validação na portaria
- [x] Dados de teste (seed)
- [ ] Front-end
- [ ] Deploy

## Como rodar

### Banco de dados

O projeto usa PostgreSQL hospedado (não precisa instalar Postgres localmente). Crie uma instância
gratuita em um destes provedores:

- [Neon](https://neon.tech)
- [Supabase](https://supabase.com)

Copie a connection string gerada.

### Back-end (Java 21+ / Spring Boot)

```bash
cd backend
cp .env.example .env
# edite .env com os dados da sua instância Postgres (DATABASE_URL, DATABASE_USERNAME, DATABASE_PASSWORD)
# gere um JWT_SECRET aleatório, ex: openssl rand -base64 48
./mvnw spring-boot:run
```

A API sobe em `http://localhost:8080`. A migration do Flyway roda automaticamente na primeira
inicialização.

> Requer JDK 21 ou superior. Se o `java` do seu PATH for uma versão antiga, aponte `JAVA_HOME`
> para um JDK 21+ antes de rodar o `mvnw`.

#### Autenticação

- `POST /auth/register` — cadastro público, sempre como Cliente (`{"name", "email", "password"}`)
- `POST /auth/login` — retorna um JWT (`{"email", "password"}`)

Contas de Organizador e Portaria não têm cadastro público — são criadas via seed (etapa
futura). O token vai no header `Authorization: Bearer <token>` nas demais requisições.

#### Eventos

- `GET /events` / `GET /events/{id}` — navegação pública, só eventos publicados
- `POST /organizer/events` — cria evento manualmente como rascunho (Organizador)
- `GET /organizer/catalog/search?keyword=` — busca no catálogo da Ticketmaster (Organizador)
- `POST /organizer/events/from-catalog` — cria evento a partir de um item do catálogo
  (`{"externalId", "capacity", "price"}` — título/local/data vêm da Ticketmaster)
- `GET /organizer/events` / `GET /organizer/events/{id}` — eventos do organizador logado, em
  qualquer status
- `PUT /organizer/events/{id}` — edita (só enquanto `DRAFT`)
- `POST /organizer/events/{id}/publish` — publica (só a partir de `DRAFT`)

#### Reservas

- `POST /reservations` — reserva ingressos (`{"eventId", "quantity"}`, máx. 10, Cliente)
- `GET /reservations` — minhas reservas
- `POST /reservations/{id}/pay` — paga a reserva (dados de cartão simulados, ver abaixo)
- `GET /tickets/mine` — meus ingressos, com QR code
- `GET /tickets/shared/{shareToken}` — visualização pública de um ingresso compartilhado (sem login)
- `POST /gate/validate` — valida um ingresso na entrada (`{"eventId", "code"}`, Portaria).
  `code` é o mesmo texto tanto para leitura de câmera quanto digitação manual. Resposta sempre
  `200` com `result`: `VALID`, `INVALID`, `ALREADY_USED` ou `WRONG_EVENT`.

#### Pagamento simulado

`{"cardNumber", "cardHolderName", "expiry" (MM/AA), "cvv"}`. Nenhum dado é enviado a um gateway
real. **Cartão terminado em `0002` simula recusa** (convenção de cartão de teste do Stripe);
qualquer outro número de 13–19 dígitos aprova o pagamento.

> ⚠️ **Integração com a Ticketmaster não testada ponta a ponta.** A chamada, o tratamento de erro
> (chave ausente/inválida) e o parsing foram implementados e revisados contra a documentação da
> Discovery API, mas eu não tinha uma API key válida disponível durante o desenvolvimento pra
> confirmar o parsing de um resultado real. Gere uma chave gratuita em
> [developer.ticketmaster.com](https://developer.ticketmaster.com) e coloque em
> `TICKETMASTER_API_KEY` no `.env` pra testar. Sem chave, os endpoints respondem `502` com uma
> mensagem clara em vez de quebrar.

### Front-end

Instruções serão adicionadas quando o front-end for implementado.

## Dados de teste

A migration `V2__seed_data.sql` cria automaticamente, em qualquer banco novo, um organizador,
dois clientes, um usuário de portaria e um evento publicado com ingressos disponíveis — não
precisa montar nada manualmente para percorrer o fluxo.

| Papel | E-mail | Senha |
|---|---|---|
| Organizador | `organizador@evento-ingressos.com` | `Senha123!` |
| Cliente 1 | `cliente1@evento-ingressos.com` | `Senha123!` |
| Cliente 2 | `cliente2@evento-ingressos.com` | `Senha123!` |
| Portaria | `portaria@evento-ingressos.com` | `Senha123!` |

Evento semeado: "Noite de Rock no Recife Antigo", Marco Zero (Recife), 100 ingressos, R$120,00.

## Uso de IA

Detalhes de como e onde a IA foi usada no desenvolvimento estão em [DECISIONS.md](./DECISIONS.md#uso-de-ia).
