# Evento-Ingressos

Plataforma de eventos e ingressos — desafio Elite Dev (Verzel).

Um organizador monta eventos a partir do catálogo da **Ticketmaster Discovery API**, definindo
data, local, capacidade e preço. O cliente navega pelos eventos publicados, reserva ingressos,
paga de forma simulada e recebe um ingresso com QR Code, que pode compartilhar por link. Na
entrada, a portaria valida o ingresso.

As decisões de arquitetura e escopo, e o porquê de cada uma, estão em [DECISIONS.md](./DECISIONS.md).

## Stack

- **Back-end:** Java + Spring Boot, PostgreSQL, Flyway
- **Front-end:** React + Vite + TypeScript
- **Infra local:** Docker Compose

## Status

Projeto em desenvolvimento. Progresso:

- [x] Estrutura do repositório e decisões iniciais
- [ ] Modelagem de domínio e banco de dados
- [ ] Autenticação (Organizador / Cliente / Portaria)
- [ ] Integração com Ticketmaster Discovery
- [ ] Fluxo de reserva e pagamento simulado
- [ ] Geração e validação de ingresso (QR)
- [ ] Front-end
- [ ] Dados de teste (seed)
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
./mvnw spring-boot:run
```

A API sobe em `http://localhost:8080`.

> Requer JDK 21 ou superior. Se o `java` do seu PATH for uma versão antiga, aponte `JAVA_HOME`
> para um JDK 21+ antes de rodar o `mvnw`.

### Front-end

Instruções serão adicionadas quando o front-end for implementado.

## Uso de IA

Detalhes de como e onde a IA foi usada no desenvolvimento estão em [DECISIONS.md](./DECISIONS.md#uso-de-ia).
