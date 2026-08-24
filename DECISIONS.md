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

### Dois bugs sutis na configuração do Spring Security

Ao testar o login/JWT de ponta a ponta contra o Neon, toda requisição autenticada continuava
voltando 401, mesmo com um token válido. Duas causas, encontradas com log temporário:

1. `JwtAuthenticationFilter` é um `@Component` que também implementa `Filter`. O Spring Boot o
   registra automaticamente como filtro de servlet *global* (fora da cadeia do Spring Security),
   rodando cedo demais. Como `OncePerRequestFilter` só executa uma vez por requisição, quando a
   cadeia do Spring Security chegava nele (via `addFilterBefore`), ele já tinha "rodado" e era
   pulado — a autenticação nunca era setada dentro da cadeia de verdade. Resolvido desabilitando
   o registro automático com um `FilterRegistrationBean` (`setEnabled(false)`), mantendo só o
   registro explícito na posição certa.
2. Depois de corrigir isso, o token válido *ainda* voltava 401 — mas para uma rota inexistente,
   que deveria dar 404. A causa: quando o Spring não encontra um handler, ele faz um *forward*
   interno para `/error`, e esse forward passa pela mesma cadeia do Spring Security. Como esse
   forward chega sem o header `Authorization`, ele é avaliado como anônimo e barrado por
   `anyRequest().authenticated()`, sobrescrevendo o 404 real por um 401. Resolvido liberando
   `/error` explicitamente (`permitAll()`), do mesmo jeito que `/auth/**`.

Guardo esse histórico aqui porque a causa não é óbvia lendo só o código final, e um leitor
poderia achar que o `FilterRegistrationBean` é código morto — não é.

## Gestão de eventos pelo organizador

Endpoints de organizador ficam sob `/organizer/events/**`, separados de `/events/**` (navegação
pública). Isso evita que a regra de autorização precise decidir "GET /events/{id} é público, mas
GET /organizer/events/{id} não" caso os dois compartilhassem o mesmo prefixo — com prefixos
diferentes, a regra no `SecurityConfig` é só `hasRole("ORGANIZER")` num path inteiro.

Edição (`PUT`) e publicação só são aceitas enquanto o evento está `DRAFT`. Depois de publicado, o
evento não pode ser editado por este endpoint — mudar capacidade ou preço depois que o evento já
está visível (e pode já ter reservas) abriria um espaço de bugs que não faz sentido cobrir neste
escopo; cancelamento é o item opcional listado no desafio para lidar com "mudei de ideia depois de
publicar".

Outra causa de `LazyInitializationException`: `EventService` monta o `EventResponse` (que lê
`organizer.getName()`) *dentro* dos métodos `@Transactional`, não no controller. `organizer` é
`FetchType.LAZY` no `Event`; se o controller recebesse a entidade `Event` e só montasse o DTO
depois, a transação já teria fechado e o acesso ao proxy lazy falharia. Os serviços sempre
devolvem DTOs prontos, nunca entidades JPA cruas.

## Integração com Ticketmaster

O organizador busca no catálogo (`GET /organizer/catalog/search?keyword=`) e escolhe um item; ao
criar o evento a partir dele (`POST /organizer/events/from-catalog`), o servidor busca o item de
novo pelo ID (fonte de verdade, evita que o cliente forje título/local/data) e usa **título,
imagem, local e data vindos da Ticketmaster** — o organizador só informa capacidade e preço, que a
Ticketmaster não tem porque não é ela quem está vendendo esses ingressos. Continua indo pro estado
`DRAFT`, publicado manualmente como qualquer outro evento.

Sem uma `TICKETMASTER_API_KEY` configurada (dev sem chave ainda, ou avaliador sem gerar uma), os
dois endpoints respondem `502` com uma mensagem clara em vez de travar ou devolver `500` — é uma
falha de dependência externa, não um bug da aplicação. Testei contra a API real da Ticketmaster
sem chave e com chave inválida (401 deles, repassado como 502 com o motivo) — não tenho uma chave
válida ainda, então **o parsing do JSON de resultado real (busca e detalhe de evento) não foi
validado ponta a ponta**, só revisado contra a documentação da Discovery API. Isso fica registrado
aqui porque é exatamente o tipo de coisa que o README pede pra sinalizar quando não dá pra
confirmar que está funcionando.

## Fluxo de reserva

O estoque é reservado (`sold_count` incrementado) no momento da **criação da reserva**, não no
pagamento — assim o lugar fica garantido enquanto o cliente está no checkout simulando o
pagamento, e ninguém mais consegue reservar o mesmo ingresso nesse meio-tempo. Se o pagamento for
recusado (próxima etapa), o estoque reservado é devolvido. Não há expiração automática de reserva
pendente (ex: liberar depois de 10 minutos sem pagar) — como o pagamento aqui é simulado e
instantâneo, não existe o cenário de alguém abandonar o checkout no meio, então implementar um job
de expiração seria complexidade sem contrapartida real neste escopo.

Limite de 10 ingressos por reserva: não é um requisito do desafio, mas é o tipo de limite que
qualquer plataforma de ingressos real tem (mitigar cambismo/bot buying) e que "ninguém pensou em
colocar" é exatamente o tipo de detalhe que grita "gerado por IA sem revisão".

Testado sob concorrência real (não só logicamente): 10 requisições simultâneas contra um evento
com capacidade 5 resultaram em exatamente 5 reservas confirmadas e 5 recusadas, com `sold_count`
final igual a 5 — validando que o UPDATE condicional atômico (`EventRepository.tryReserveStock`)
realmente impede overselling sob carga, não só na leitura do código.

## Pagamento simulado

`POST /reservations/{id}/pay` recebe dados de cartão com formato validado (não processados por
gateway nenhum) e simula recusa quando o número do cartão termina em `0002` — convenção de sandbox
de pagamento (cartões de teste do Stripe usam o mesmo padrão), então quem for avaliar já reconhece
o gatilho sem eu precisar inventar uma UI de "forçar erro". Documentado no README em "dados de
teste". Reserva paga/recusada não pode ser paga de novo (`409`); recusa devolve o estoque reservado
(`EventRepository.releaseStock`), senão o lugar ficaria preso pra sempre numa reserva morta.

## Ingresso e QR

O código do QR não é o UUID puro do ingresso: é `"{id}.{assinatura HMAC-SHA256}"`
(`QrCodeService`), assinado com um segredo do servidor (`TICKET_QR_SECRET`, separado do
`JWT_SECRET` — segredos com propósitos diferentes não devem compartilhar chave). Sem o segredo,
não dá pra forjar um QR válido mesmo sabendo o id de um ingresso real — a portaria (próxima etapa)
recomputa a assinatura em vez de confiar no que veio no código escaneado.

O id do `Ticket` não usa `@GeneratedValue`: ele precisa existir *antes* do insert porque entra na
assinatura do QR, e o gerador de UUID do Hibernate só atribui o valor no momento do insert — tarde
demais. O id é gerado em `PaymentService` (`UUID.randomUUID()`) e setado explicitamente.

Cada unidade de uma reserva paga vira um `Ticket` individual com seu próprio QR — testado: reserva
de 2 ingressos aprovada gera exatamente 2 tickets com QR codes distintos.

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
