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

Sem uma `TICKETMASTER_API_KEY` configurada, os dois endpoints respondem `502` com uma mensagem
clara em vez de travar ou devolver `500` — é uma falha de dependência externa, não um bug da
aplicação. Testado contra a API real com chave válida: busca por palavra-chave e criação de evento
a partir de um item real do catálogo, com título/imagem/local/data vindos corretos.

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

## Compartilhamento

`GET /tickets/shared/{shareToken}` é público (sem login) — quem recebe o link de alguém não tem
conta necessariamente. `shareToken` é um UUID à parte do id do ingresso (gerado em `Ticket`), então
adivinhar um não revela o outro, e o link pode ser compartilhado sem expor o id "de verdade" usado
internamente pelas rotas autenticadas.

## Validação na portaria

Mesmo princípio da reserva de estoque, de novo: marcar o ingresso como usado é um **UPDATE
condicional atômico** (`TicketRepository.tryMarkUsed`, só aplica se `status = VALID`), não um
"ler, decidir na aplicação, gravar" — dois porteiros escaneando o mesmo ingresso ao mesmo tempo não
podem os dois ver "válido". Já tinha resolvido esse exato problema de concorrência para
`sold_count` na etapa de reserva; aqui é a mesma lição aplicada de novo, não descoberta do zero.

`POST /gate/validate` recebe `eventId` (qual evento esta portaria está fazendo check-in agora) e
`code` — a mesma string, venha da câmera ou digitada à mão, então a leitura por câmera no
front-end não precisa de nenhum endpoint separado do fallback manual. O código é
`"{ticketId}.{assinatura}"`; a portaria recomputa a assinatura via `QrCodeService.isValid` em vez
de só buscar o id no banco — um `code` com id válido mas assinatura trocada retorna `INVALID`, não
`VALID`. Devolve sempre `200` com um campo `result` (`VALID`/`INVALID`/`ALREADY_USED`/
`WRONG_EVENT`), nunca um `4xx` — essas são as quatro respostas de negócio esperadas de uma
validação, não erros de requisição.

Testados os quatro estados de ponta a ponta: ingresso do evento certo mas escaneado no evento
errado (`WRONG_EVENT`), código com assinatura adulterada (`INVALID`), validação correta
(`VALID`, marca como usado) e a mesma validação repetida (`ALREADY_USED`, idempotente).

## Dados de teste

Seed via migration Flyway (`V2__seed_data.sql`) em vez de um `CommandLineRunner` condicional —
já temos a infra de migrations versionadas, então é mais simples e mais consistente usar o mesmo
mecanismo, sem precisar de lógica de "só popula se estiver vazio" na aplicação. IDs fixos e
legíveis (`11111111-...`) só pra facilitar debug manual durante o desenvolvimento; não têm
significado além disso. Hash da senha gerado com o mesmo `BCryptPasswordEncoder` usado em
runtime, não hardcoded de outra fonte.

## Deploy

Front-end na Vercel; back-end no Render via Docker, banco continua no Neon (já hospedado desde o
início). Render não tem runtime nativo para Java (só JS/TS, Python, Ruby, Go, Rust, Elixir —
conferido na documentação deles antes de decidir, não assumido), então o back-end precisa de um
`Dockerfile` — o motivo real de reintroduzir Docker no projeto depois de ter descartado ele lá no
início por falta de Docker Desktop na máquina de dev: aqui quem builda a imagem é o Render, não
minha máquina, então a ausência local deixa de ser um bloqueio. Escolhido Render em vez de Railway
porque tem free tier sem pedir cartão de crédito (a instância grátis dorme após ~15min sem uso;
documentado no README que a primeira requisição depois disso demora pra acordar).

`render.yaml` na raiz do repo como Blueprint — define o serviço, aponta pro `Dockerfile`, e marca
os secrets (`DATABASE_URL`, `JWT_SECRET`, etc.) como `sync: false` ou `generateValue: true` em vez
de deixar valores no arquivo versionado. CORS precisou de configuração nova no back-end
(`SecurityConfig`, origem lida de `CORS_ALLOWED_ORIGINS`) — não existia até agora porque front e
back sempre rodaram na mesma origem lógica em dev (proxy do Vite); front e back publicados em
domínios diferentes é a primeira vez que isso importa de verdade.

Não consegui testar o `Dockerfile` localmente — a mesma ausência de Docker Desktop que motivou
usar Postgres hospedado desde o início. A primeira validação real foi o build do próprio Render, e
o build em si funcionou de primeira; o que falhou foi a aplicação não subir por causa de uma
variável de ambiente (`JWT_SECRET`) que não ficou salva certinho ao preencher manualmente no
dashboard do Render (sem `render.yaml` como Blueprint, cada variável precisa ser digitada uma por
uma na UI). Diagnosticado pelo próprio log de erro do Spring
(`PlaceholderResolutionException: Could not resolve placeholder 'JWT_SECRET'`) — recadastrando a
variável, resolveu.

**Publicado e testado em produção**: front-end na Vercel (https://evento-ingressos.vercel.app),
back-end no Render (https://evento-ingressos-backend.onrender.com), ambos consumindo o mesmo
Postgres no Neon. Validado depois do ar: navegação pública, login, e rota profunda do React
Router acessada direto pela URL (não só navegação client-side) — confirma que o rewrite do
`vercel.json` está funcionando.

## Imagem do evento na criação manual

`CreateEventRequest`/`UpdateEventRequest` ganharam um campo `imageUrl` opcional. Antes disso, só
evento montado a partir do catálogo da Ticketmaster tinha imagem (vem pronta da API); criação
manual deixava `image_url` sempre nulo, e a tela pública mostrava um placeholder ("ROLÊ") em texto.
Aceitar uma URL colada pelo organizador é a solução mais simples que resolve o problema real (não
ter nenhuma imagem sem catálogo) sem implicar upload de arquivo, storage, ou infraestrutura nova —
fora de escopo pra este desafio.

## Front-end: direção visual

"Fuja do AI slop" foi levado a sério na escolha de direção: em vez do visual SaaS genérico, 
fui para uma estética de **casa de show/festival**: fundo quase preto,
duo de cor vibrante (verde-limão como ação primária, magenta como destaque secundário), tipografia
condensada e alta (Bebas Neue) para títulos, Inter pro resto. O nome do produto na interface
("ROLÊ") também é deliberado — não é o nome do repositório, é uma escolha de marca.

Um detalhe que só faz sentido dentro dessa referência: o card de ingresso (`TicketStub`) tem um
recorte de meio-círculo em cada lateral (`.ticket-perforation` no `index.css`, via `mask-image`
com dois `radial-gradient`), imitando o canhoto picotado de um ingresso de papel de verdade — um
detalhe pequeno, mas é exatamente o tipo de coisa que "ninguém pensa em fazer" quando só pede pra
IA gerar uma tela.

## Front-end: stack e arquitetura

- **Vite + React + TypeScript**, sem framework full-stack (Next.js): é uma SPA consumindo uma API
  própria, sem necessidade de SSR/rotas de servidor.
- **Tailwind CSS v4** (`@tailwindcss/vite`, config só em CSS via `@theme` — sem `tailwind.config.js`
  separado): define os tokens de design (cores, fontes) uma vez, usados em todo o app.
- **TanStack Query** para dados do servidor (cache, loading/error state) em vez de
  `useEffect`+`useState` manual espalhado pelos componentes.
- **react-hook-form + zod** nos formulários (login, cadastro, checkout) — validação no cliente
  espelhando as mesmas regras do back-end (ex: cartão de 13–19 dígitos), sem reimplementar
  validação por componente.
- Autenticação: token + dados do usuário em `localStorage`, restaurado no load. Sem refresh token
  — o JWT dura 24h (configurável), e se expirar no meio de uma sessão o usuário só precisa
  logar de novo. Implementar refresh token seria complexidade desproporcional ao escopo.
- `vite.config.ts` faz proxy de `/api` pro backend local em dev (evita CORS); em produção, a
  origem vem de `VITE_API_URL` (ver `.env.example`), então o backend precisa liberar CORS pra
  origem do front-end publicado — a fazer na etapa de deploy.

## Ambiente: Node.js

A máquina de desenvolvimento não tinha Node.js instalado (só o backend Java já tinha sido
configurado até então). Instalado via `winget install OpenJS.NodeJS.LTS`, com autorização
explícita antes de instalar software no sistema.

## Dois bugs reais encontrados testando no navegador de verdade

Peço desculpa pela repetição, mas ela é o ponto: o mesmo bug de `LazyInitializationException` (ver
"Gestão de eventos pelo organizador" acima) apareceu de novo, desta vez em `GET /reservations/{id}`
— endpoint que eu tinha acabado de adicionar especificamente para a tela de checkout poder buscar
a reserva de forma resiliente a refresh de página (antes disso, o front dependia só do estado de
navegação do React Router, que se perde num F5). Só apareceu porque testei o fluxo de checkout de
verdade num navegador contra o backend real — lendo o código isolado, os dois pareciam corretos.
Corrigido do mesmo jeito que da primeira vez: o service devolve o DTO já mapeado dentro da
transação (`getOwnedResponse`), não a entidade JPA crua.

## Cancelamento de evento

Item opcional do desafio ("cancelamento com devolução ao estoque"), adicionado depois do deploy —
não fazia parte do escopo mínimo, mas era um buraco real: não existia nenhuma forma de tirar um
evento do ar depois de publicado. `POST /organizer/events/{id}/cancel` marca o evento como
`CANCELLED` e, em cascata: cancela reservas com pagamento pendente daquele evento (é aí que entra
a "devolução ao estoque" — ninguém paga por um evento que não vai mais acontecer) e invalida os
ingressos já pagos (`VALID` → `CANCELLED`), pra portaria não continuar aceitando ingresso de um
evento cancelado — o `GateService` já tinha essa checagem pronta desde a etapa de portaria, só
precisava que algo de fato marcasse o ticket como `CANCELLED`.

Reserva que já foi **paga** continua com status `PAID` — isso é fato histórico, não muda; só o
ingresso em si vira inválido. Não implementei estorno porque o pagamento é simulado (não há
dinheiro de verdade circulando) e o desafio explicitamente não pede nota fiscal nem esse tipo de
fluxo financeiro.

Testado ponta a ponta: evento com um ingresso pago e uma reserva pendente, cancelado — reserva
pendente vira `CANCELLED`, evento some da navegação pública, e o ingresso que era `VALID` passa a
ser rejeitado na portaria com "Ingresso cancelado" em vez de validar incorretamente.

## Front-end: painel do organizador e portaria

Criação de evento tem duas abas — manual e "do catálogo" — em vez de duas telas separadas, porque
é a mesma ação (criar um rascunho de evento) com origem diferente dos dados; forçar duas rotas
separadas criaria navegação sem necessidade. Ao escolher um item do catálogo, o formulário só pede
capacidade e preço — título/imagem/local/data já vêm prontos da Ticketmaster (mesma lógica do
back-end: são a fonte de verdade).

Evento publicado não é mais editável pela tela de edição (mostra uma view somente leitura) —
reflete a mesma regra que o back-end já impõe (`PUT` só aceita em `DRAFT`); a tela não devia
oferecer um formulário que o servidor vai rejeitar.

Portaria: câmera e digitação manual convergem pro mesmo estado (`code`), então o back-end nunca
soube nem precisa saber qual dos dois foi usado. Leitura de câmera via `@zxing/browser`
(`BrowserQRCodeReader.decodeFromVideoDevice`), carregada com `React.lazy` — só quem entra em
`/portaria` baixa essa lib (usar câmera é peso que ninguém navegando eventos como cliente deveria
pagar). Testado pela UI de verdade: seleção de evento, validação manual de um ingresso real pago
(`VÁLIDO`) e revalidação do mesmo código (`JÁ UTILIZADO`) — a leitura por câmera em si não foi
testada neste ambiente de desenvolvimento (sem acesso a uma câmera real aqui), só verificada
contra a definição de tipos da biblioteca instalada.

## Uso de IA

Todo o código deste projeto foi feito com a ajuda do Claude . Foi trabalho
dividido em etapas, com minhas deciões no início ou no meio de
cada uma.

**O que era meu, não da IA:**
- Toda escolha de stack e escopo: Java/Spring Boot em vez de Node/Python, Ticketmaster em vez de
  TMDb, pista em vez de mapa de assentos, Render em vez de Railway para o back-end — a IA sempre
  apresentava as opções e o trade-off de cada uma, eu decidia.
- A direção visual do front-end ("casa de show", verde-limão + magenta, Bebas Neue, o nome "ROLÊ"
  em vez do nome do repositório) — pedi explicitamente pra fugir do visual SaaS genérico antes de
  qualquer tela ser desenhada.
- A ordem de prioridade (fluxo do cliente antes do painel do organizador, por exemplo) e quando
  parar pra eu testar manualmente antes de seguir.
- As contas em serviços externos (Neon, Ticketmaster, Render, Vercel) — a IA não cria contas nem
  processa pagamento sozinha; eu criei cada uma e colei as chaves.
- Toda a implementação: entidades, migrations, endpoints, componentes React, configuração de
  deploy.

**O que foi a IA, sob minha direção:**
- Testar o próprio trabalho de verdade (não só ler o código): rodar a aplicação localmente,
  bater requisições reais contra o banco no Neon, disparar 10 requisições concorrentes pra provar
  que o controle de estoque aguenta concorrência, dirigir o fluxo inteiro num navegador antes de
  marcar qualquer etapa como pronta. Isso pegou bugs reais (alguns documentados acima) que não
  apareceriam só lendo o código e essa disciplina de "testar antes de dizer que terminou" foi
  seguida a etapa inteira, não só quando pedi.
- Identificar e explicar trade-offs técnicos nos pontos de decisão (ex: por que UPDATE condicional
  atômico em vez de lock otimista, por que DTOs em vez de devolver entidades JPA cruas).

Este arquivo (`DECISIONS.md`) foi escrito nesse processo, etapa por etapa, não depois — é o
registro real das decisões conforme elas aconteceram, incluindo os bugs e os motivos de cada
escolha, exatamente pra defender que decisão nenhuma aqui foi arbitrária.
