# Plano de Implementação — Redesign Coup (handoff `design_handoff_coup/`)

> Documento de referência para sessões futuras. Descreve a estratégia, os commits atômicos previstos, os arquivos afetados, riscos e o agente/modelo Claude Code recomendado para cada fase.

---

## Contexto

- **Codebase**: Next.js 16 + React 19 + Tailwind v4 + socket.io-client. Backend autoritativo já existente (`@coup/shared` define `GamePhase`, `ClientGameState`, `PendingAction`).
- **Handoff**: pasta `design_handoff_coup/` contém protótipo React+Babel inline com **CSS puro** (OKLCH, gradientes em camadas, pseudo-elements, animações). High-fidelity — cores, tipografia, espaçamento e animações são finais.
- **Telas/arquivos do handoff**:
  - `styles.css` (442 linhas) — tokens, superfícies, cards, botões, animações
  - `styles-layout.css` (640 linhas) — mesa, seats, modais, chronicle, lobby, home
  - `components/home.jsx`, `lobby.jsx`, `game.jsx`, `characters.jsx`, `shared.jsx`, `mock-state.jsx`
- **Telas existentes a reskinar**:
  - `apps/frontend/src/app/page.tsx` — Home
  - `apps/frontend/src/app/room/[roomId]/page.tsx` — Lobby (entrada por nome + lobby ativo)
  - `apps/frontend/src/components/game-board.tsx` — Mesa principal (substancial refator estrutural)
  - Subcomponentes: `action-bar`, `reaction-bar`, `block-challenge-bar`, `exchange-selector`, `influence-card-selector`, `winner-overlay`, `player-seat`, `player-panel`, `character-card`, `game-log`, `connection-badge`

---

## Decisões de arquitetura (alinhadas com o usuário)

1. **Estratégia CSS**: portar `styles.css` + `styles-layout.css` quase como CSS plano para `globals.css`, mantendo classes `.btn.primary`, `.coup-card`, `.felt`, `.frame`, `.parchment`, `.filigree`. Tailwind v4 só para layout fino (flex, gap, min-h).
2. **Fontes**: trocar `Cinzel` por `Cormorant Garamond` + `Cormorant SC` via `next/font/google`. `Inter` permanece para UI.
3. **Home**: manter fluxo existente de **link de convite** (sem código curto). Remover bloco "Entrar com código" do handoff. Só "Criar sala" + nome.
4. **Mesa**: refator estrutural (sidebar+main → mesa oval com seats + treasury central + action panel embaixo + chronicle absoluto). Subcomponentes mantêm seus contratos de props.
5. **Ilustrações**: usar SVGs do handoff (placeholder estilizado). Substituir por arte comissionada é trabalho futuro.
6. **Testes**: atualizar `character-card.test.tsx` e `player-seat.test.tsx`.
7. **Escopo**: commits atômicos locais. Push e PR só após confirmação explícita do usuário (regra do `CLAUDE.md`).

---

## Recomendação de modelos

Sugestões para minimizar custo sem comprometer qualidade. Critérios:
- **Haiku 4.5** (`claude-haiku-4-5-20251001`): tarefas mecânicas de tradução CSS/JSX, sem decisões arquiteturais.
- **Sonnet 4.6** (`claude-sonnet-4-6`): tarefas com decisões locais (mapeamento de props, ajustes de testes, conexão de subcomponentes, refator com risco médio).
- **Opus 4.7** (`claude-opus-4-7`): refator estrutural, planejamento e auditoria final — onde raciocínio profundo paga o custo.

Trocar de modelo via `/model` antes de iniciar a fase, ou passar `model` ao spawnar agente.

---

## Status global

- [x] Fase 1 — Tokens, fontes e superfícies base
- [x] Fase 2 — Componentes atômicos compartilhados
- [x] Fase 3 — CharacterCard renascentista
- [x] Fase 4 — Home (parchment frame)
- [x] Fase 5 — Lobby (antecâmara + aside)
- [x] Fase 6 — Mesa (refator estrutural)
- [x] Fase 7 — Action panel + reaction bar com cores heráldicas
- [x] Fase 8 — Overlays dramáticos
- [ ] Fase 9 — Atualização de testes
- [ ] Fase 10 — Verificação visual e UX (opcional)

> **Convenção**: ao concluir uma fase, marcar `[x]` aqui e adicionar bloco `**Status**: ✅ Concluída em YYYY-MM-DD — commit \`<hash>\`` no fim da seção da fase correspondente. Anotar desvios do plano se houver.

---

## Fases / commits atômicos

Cada fase = 1 commit no padrão Conventional Commits, sem co-authored-by. Após cada fase, pedir confirmação antes de avançar.

### Fase 1 — Tokens, fontes e superfícies base
**Commit**: `feat(design): tokens, fonts e superfícies (parchment/felt/frame/filigree)`

**Escopo**:
- Substituir Cinzel por Cormorant Garamond + Cormorant SC em `app/layout.tsx` (next/font/google).
- Reescrever `app/globals.css`:
  - Variáveis `:root` em OKLCH (parchment, ink, gold, wine, felt, house-*).
  - Utilities `.sc`, `.display`, `.eyebrow`, `.title-xl/lg/md`.
  - Superfícies `.parchment`, `.felt` (com `::before` linhas, `::after` vignette), `.filigree`, `.frame` (+ `.frame-corner-tr` / `.frame-corner-bl`).
  - Inputs `.coup-input`.
  - Botões `.btn` + variantes (`.primary`, `.ghost`, `.danger`, `.gold`, `.house-*`, `.lg`, `.sm`).
  - Animações: `sway`, `flicker`, `pulse-ring`, `coin-fly`, `shake`, `deal-in`, `fade-up`, `blade`, `smoke`.
  - Scrollbar dourada.

**Arquivos**: `apps/frontend/src/app/globals.css`, `apps/frontend/src/app/layout.tsx`.

**Agente recomendado**: nenhum — execução direta. Tarefa de tradução CSS, sem decisões.
**Modelo recomendado**: **Haiku 4.5** — tradução mecânica de CSS, alto volume, baixa ambiguidade.

**Status**: ✅ Concluída em 2026-04-29 — commit `0a31c1b`. Desvio: adicionado alias temporário `--font-cinzel` apontando para Cormorant para não quebrar componentes que ainda referenciam `font-cinzel` antes do reskin (fases 3–8). Remover ao final.

---

### Fase 2 — Componentes atômicos compartilhados
**Commit**: `feat(design): atomic components (Coin, Filigree, Crest)`

**Escopo**:
- `components/ui/coin.tsx` — `<Coin size={n}>` (default 22, `.lg` 34) com gradiente radial dourado, anel tracejado interno, drop shadow.
- `components/ui/filigree.tsx` — `<Filigree>{children}</Filigree>` com ornamento `❦` central e linha dourada que desaparece nas pontas.
- `components/ui/crest.tsx` — `<Crest size={42}>` SVG escudo + cruz de espadas (usado na Home).

**Arquivos novos**: 3 acima.

**Agente recomendado**: nenhum — execução direta.
**Modelo recomendado**: **Haiku 4.5** — componentes pequenos isolados, sem dependências cruzadas.

**Status**: ✅ Concluída em 2026-04-29 — commit `66151e7`.

---

### Fase 3 — CharacterCard renascentista
**Commit**: `refactor(design): CharacterCard com portraits SVG e moldura heráldica`

**Escopo**:
- Reescrever `components/character-card.tsx`:
  - Variantes `xs` (44×64), `sm` (78×114), `md` (120×176), `lg` (180×264).
  - `.card-face` com moldura interna em `var(--house)` via `::before`/`::after`.
  - Cantos TL/BR com inicial + símbolo heráldico.
  - Center: `<Portrait>` SVG + name banner + subtitle italiano.
  - `.card-back` (verso vinho com filigree dourado em `repeating-linear-gradient`).
  - `.flipper` com `flip-inner` e rotação 0.7s.
  - `.revealed` com grayscale + X vermelho diagonal.
- Mover SVGs de portrait do handoff (`characters.jsx`) para `components/portraits/{duke,captain,assassin,ambassador,contessa}.tsx` ou inline.
- Tabela `CHARACTERS` com `name`, `subtitle`, `color`, `initial`, `symbol`, `ability`, `counter`.

**Arquivos**: `components/character-card.tsx` (rewrite), novos arquivos de portraits.

**Agente recomendado**: nenhum — execução direta. Trabalho de tradução JSX→TSX.
**Modelo recomendado**: **Sonnet 4.6** — tipagem TS dos props (tipos `CardType`, `Size`) e mapeamento ao `@coup/shared` exigem mais cuidado que Haiku.

**Status**: ✅ Concluída em 2026-04-29 — commit `e6a86de`. Desvio: adicionado shim `CHARACTER_CONFIG` exportado para compatibilidade com `block-claim-selector.tsx` (remover na Fase 7). Portraits SVG inline (sem arquivos separados). CSS de layout da carta adicionado a `globals.css`.

---

### Fase 4 — Home (parchment frame)
**Commit**: `feat(design): Home parchment frame com crest e tipografia display`

**Escopo**:
- Reescrever `app/page.tsx`:
  - Wrapper `.felt` em tela cheia.
  - Card central `.parchment.frame` (max-width ~520px).
  - `<Crest>`, título `.home-title` "COUP" 72px, subtítulo small caps "Manipulação · Blefe · Poder", tagline italic.
  - `<Filigree>` separador.
  - Label "Seu nome" + `.coup-input` + botão `.btn.primary.lg` "Criar Sala".
  - Manter lógica de `getOrCreatePlayerId`, `savePlayerName`, fetch `/api/rooms`.
  - Remover bloco "Entrar com código" do handoff (manter só link de convite).

**Arquivos**: `app/page.tsx`.

**Agente recomendado**: nenhum — execução direta.
**Modelo recomendado**: **Haiku 4.5** — reskin direto, lógica preservada.

**Status**: ✅ Concluída em 2026-04-30 — commit `427f78c`. Sem desvios.

---

### Fase 5 — Lobby (antecâmara + aside)
**Commit**: `feat(design): Lobby com top-bar, antecâmara e aside de convite`

**Escopo**:
- Reescrever `app/room/[roomId]/page.tsx` mantendo as três sub-telas (sala não encontrada, entrada-de-nome, lobby ativo).
- Para a **entrada-de-nome**: mesma estética da Home (parchment frame menor).
- Para o **lobby ativo**:
  - Wrapper `.felt` + `.top-bar` (crest + COUP + meta `SALA · {roomId} ◆ AGUARDANDO`).
  - `.lobby-shell` grid 2 colunas: `.lobby-main` (esquerda) + `.lobby-aside` (direita 420px).
  - Main: `.lobby-hero` com eyebrow "Antecâmara", título "A corte se reúne", grid `.lobby-seats` (3 colunas) com `.lobby-seat-card` (avatar inicial + nome + badge ANFITRIÃO).
  - Slots vazios = `.lobby-seat-card.empty` com tracejado e "Assento livre".
  - Aside: bloco Convite (input readonly + botão "Copiar"), filigree, lista de regras, botões "Iniciar Partida" / "Sair da sala".
- Manter lógica `useLobby`, `socket.emit("SET_READY"|"START_GAME")`, `handleCopyLink` com fallback.
- Badge "Pronto" / "Aguardando" → integrar como sub-badge nos `.lobby-seat-card`.

**Arquivos**: `app/room/[roomId]/page.tsx`.

**Agente recomendado**: nenhum — execução direta.
**Modelo recomendado**: **Sonnet 4.6** — três sub-telas com fluxo condicional + integração ready/host requer atenção a estados.

**Status**: ✅ Concluída em 2026-04-30 — commit `7a224d3`. Desvio: botão "Estou Pronto!" mantido no aside (não existia no handoff original, mas preservado da lógica existente do socket).

---

### Fase 6 — Mesa (refator estrutural)
**Commit**: `feat(design): Mesa oval com seats, treasury central e top-bar`

**Escopo** (maior fase, mais delicada):
- Reescrever `components/game-board.tsx`:
  - Layout `.felt.game-shell` grid `auto 1fr auto` (top-bar / stage / action-panel).
  - Top-bar com `SALA · {roomId} ◆ RODADA · {n} ◆ {n} em jogo`.
  - `.game-stage` com seats absolutos numa elipse via função `computeSeatPositions(n, myId, players)`.
  - `<TableCenter>` no centro absoluto: `.court-deck` (5 deck-cards empilhadas + label `BARALHO · {deckCount}`) + `.treasury` (stack de moedas + amount + label).
  - `<Chronicle>` absoluto top-right com entries do `game.log`.
  - Bottom: `<ActionBar>` (renomeado mentalmente para `<ActionPanel>`).
- Refator de `player-seat.tsx`:
  - `.seat` com `seat-hand` (cards `.sm` em leque com rotação), avatar circular dourado, nome display, `.seat-coins` pill, badges `SUA VEZ` / `EXILADO`.
  - Estados `.active` (pulse-ring), `.eliminated` (opacity), `.targeted` (anel tracejado dourado).
  - Variante `.is-me` horizontal (avatar+nome esquerda, cards direita).
- Aposentar `<PlayerPanel>` (lista lateral) — substituído pelos seats.
- Criar `components/table-center.tsx` (deck + treasury) e `components/chronicle.tsx` (substitui `<GameLog>` no layout absoluto; `GameLog` pode virar adapter).
- Mapear `disconnectedPlayers` para badge no seat.

**Arquivos**: `game-board.tsx` (rewrite estrutural), `player-seat.tsx` (rewrite), `player-panel.tsx` (remover ou adapter), novos `table-center.tsx`, `chronicle.tsx`.

**Agente recomendado**: **Plan** (subagent_type=Plan) antes de codar a fase, para mapear precisamente como os subcomponentes (`ActionBar`, `ReactionBar`, `BlockChallengeBar`, `CoupTargetSelector`, `InfluenceCardSelector`, `ExchangeSelector`) se conectam ao novo layout sem quebrar contratos.
**Modelo recomendado**: **Opus 4.7** — refator estrutural com muitas dependências cruzadas e estado de UI local (`selectingCoupTarget`, etc). Maior risco de regressão; raciocínio profundo paga o custo.

**Status**: ✅ Concluída em 2026-04-30 — commit `3cf7503`. Desvios: `position` em `PlayerSeatProps` ficou opcional (default `50%/50%`) para não quebrar typecheck de `player-seat.test.tsx` (será reescrito na Fase 9). `treasuryCoins` omitido (sem dado de backend). Bloco de testes `PlayerPanel` removido de `frontend-reconnect.test.ts` (componente deletado; Fase 9 cobre comportamento equivalente via `PlayerSeat`).

---

### Fase 7 — Action panel + reaction bar com cores heráldicas
**Commit**: `feat(design): action panel e reaction bar com cores heráldicas`

**Escopo**:
- Reskinar `components/action-bar.tsx`:
  - Wrapper `.action-panel` (gradiente + filete dourado superior).
  - Título `.action-title` italic com nome do jogador ativo.
  - Grid `.action-grid` 7 colunas com `.action-btn` por ação.
  - Cada botão: `.sc-label` (Duque/Capitão/etc.), label display, descrição italic, `.cost` dourado com `<Coin>` quando aplicável.
  - Variantes `.house-duke/captain/assassin/ambassador`.
  - Aviso "Você tem 10+ moedas — deve dar um Golpe" quando `coins >= 10`.
- Reskinar `reaction-bar.tsx` e `block-challenge-bar.tsx`:
  - Mesma `.action-panel` shell.
  - Botões `.btn` ("Permitir"), `.btn.danger` ("⚔ Contestar"), `.btn.house-*` ("Bloquear como Duque" etc.).
  - Banner com status "Aguardando reação de X, Y..." quando o jogador já reagiu ou é o ator.
- Reskinar `coup-target-selector.tsx`: mesma `.action-panel` com botões `.btn` por alvo + "Cancelar" ghost.

**Arquivos**: `action-bar.tsx`, `reaction-bar.tsx`, `block-challenge-bar.tsx`, `coup-target-selector.tsx`.

**Agente recomendado**: nenhum — execução direta.
**Modelo recomendado**: **Sonnet 4.6** — vários componentes que tocam a lógica do socket, estado de turno e reações precisam coerência.

**Status**: ✅ Concluída em 2026-04-30. Desvios: shim `CHARACTER_CONFIG` removido de `character-card.tsx` e `block-claim-selector.tsx` reescrito para usar classes `.btn.house-*` direto. `BlockClaimSelector` mantido como componente (usado inline em `reaction-bar.tsx`). Os 13 testes falhando são pré-existentes das Fases 3/6 (cobertos pela Fase 9).

---

### Fase 8 — Overlays dramáticos
**Commit**: `feat(design): overlays dramáticos (lose influence, exchange, winner, coup animation)`

**Escopo**:
- Reskinar `influence-card-selector.tsx`:
  - `.dramatic-backdrop` + `.dramatic-panel`.
  - Eyebrow vermelho "◆ Influência Perdida ◆", título display "Escolha quem cai em desgraça", cards `.lg` lado a lado.
- Reskinar `exchange-selector.tsx`:
  - Eyebrow "◆ Embaixador ◆", título "Troque com o Baralho da Corte".
  - Cards selecionáveis com ring dourado + translateY ao escolher.
  - Counter `{selected} / {keepCount} escolhidas`, botão `.btn.primary.lg` "Confirmar Troca".
- Reskinar `winner-overlay.tsx`:
  - `.winner-crest` ❦ flicker + "Última Família de Pé" + nome em title-lg + "domina a cidade-estado" + `<Filigree>` + botões "Nova Partida" / "Sair".
- Criar `components/coup-animation.tsx`:
  - Trigger via `GamePhase.RESOLVING_COUP` (ou equivalente; verificar enum).
  - `.dramatic-backdrop` com tint vermelho + `.slash-effect` (lâmina dourada `keyframes blade` 0.6s) + texto "GOLPE" 72px display.

**Arquivos**: `influence-card-selector.tsx`, `exchange-selector.tsx`, `winner-overlay.tsx`, novo `coup-animation.tsx`. Conectar `coup-animation` no `game-board.tsx`.

**Agente recomendado**: nenhum — execução direta. Verificar antes os valores de `GamePhase` em `@coup/shared` para gatilhar a animação no momento certo.
**Modelo recomendado**: **Sonnet 4.6** — gatilho da `coup-animation` exige inspecionar o enum `GamePhase` e decidir a transição correta sem novo phase no backend.

**Status**: ✅ Concluída em 2026-04-30. Desvios: `CoupAnimation` dispara em `AWAITING_COUP_TARGET && !needsInfluenceChoice` (ator e espectadores veem a animação; a vítima já vê o seletor de influência). Botão "Revanche" renomeado para "Nova Partida" conforme handoff — teste em `frontend-reconnect.test.ts` atualizado. `keepCount` no `ExchangeSelector` calculado dinamicamente da mão viva (não hardcoded 2).

---

### Fase 9 — Atualização de testes
**Commit**: `test(design): atualiza testes para nova estrutura de CharacterCard e Seat`

**Escopo**:
- `__tests__/character-card.test.tsx`: ajustar asserts para a nova estrutura (`.coup-card`, `.card-face`, `.corner-initial`, `.card-name-banner`).
- `__tests__/player-seat.test.tsx`: ajustar para `.seat`, `.seat-avatar`, `.seat-coins`, `.seat-badge`.
- Rodar `npm test` e `npm run typecheck` no final.

**Arquivos**: `__tests__/*`.

**Agente recomendado**: nenhum — execução direta.
**Modelo recomendado**: **Sonnet 4.6** — ajustar asserts a uma estrutura nova exige interpretar saída de testes e iterar.

---

## Fase 10 (opcional) — Verificação visual e UX
**Commit**: nenhum (apenas verificação).

**Escopo**:
- `npm run dev` e navegar pelos fluxos: home → criar sala → lobby → iniciar jogo → ações → reações → perda de influência → exchange → coup → game over.
- Verificar responsividade no breakpoint 900px (do `styles-layout.css`).
- Verificar animações reais em browser (deal-in das cartas, pulse-ring no seat ativo, flicker no winner).

**Agente recomendado**: **gsd-ui-auditor** (`subagent_type=gsd-ui-auditor`) para auditoria retrospectiva de 6 pilares (color, typography, spacing, motion, states, content). Justificativa: o handoff é high-fidelity e merece verificação formal de fidelidade pixel-perfect antes de fechar o trabalho.
**Modelo recomendado**: **Opus 4.7** — auditoria com julgamento qualitativo cruzando 6 pilares contra um handoff hifi.

---

## Riscos e mitigações

| Risco | Mitigação |
|---|---|
| Conflito do `<GameLog>` (sidebar) com `.chronicle` (absoluto canto) | Consolidar num único componente `<Chronicle>` posicionado conforme handoff, com adapter de dados do `game.log`. |
| `disconnectedPlayers` / reações pendentes sem lugar visual óbvio | Mapear para badges nos seats (`AUSENTE`, estados WAITING/PASSED/CHALLENGED como pulso ou cor). |
| Tailwind v4 conflitando com classes CSS plain | Manter Tailwind só para layout fino; classes do design ficam em `globals.css` com escopo próprio. |
| Animações CSS puras vs. Framer Motion | Seguir o handoff (CSS puro, sem dependência nova). |
| Tipografia (Cormorant) em fallback durante carregamento | `next/font` com `display: "swap"` + `Georgia, serif` como fallback declarado nas vars. |
| Testes rompendo silenciosamente | `npm test` e `npm run typecheck` antes de cada commit. |
| `GamePhase` para `COUP_ANIMATION` pode não existir no backend | Animação dispara client-side por transição de estado (detectar quando `pendingAction.actionType === "COUP"` resolve), sem depender de novo phase. |

---

## Convenções de execução

- 1 fase = 1 commit atômico, mensagem em Conventional Commits.
- Sem co-authored-by Claude (regra do `CLAUDE.md`).
- **Não fazer push, não abrir PR** sem confirmação explícita do usuário.
- Manter `.claude/` no `.gitignore`.
- Não instalar dependências novas. Se necessário (ex: alguma fonte ou util), pedir confirmação antes.
- Após cada fase, reportar resumo curto (2 linhas) e aguardar "ok" para seguir.
- **Ao concluir uma fase**: marcar `[x]` no Status global, adicionar `**Status**: ✅ Concluída em YYYY-MM-DD — commit \`<hash>\`` no fim da seção da fase, anotar desvios se houver.

---

## Quando este plano deve ser revisitado

- Se o usuário aprovar arte definitiva dos personagens (substituir SVGs placeholder).
- Se o backend ganhar novos `GamePhase` que mudem o gatilho de overlays.
- Se decidirmos migrar para Framer Motion (atualmente: CSS puro).
- Se aparecerem requisitos mobile-first além do breakpoint 900px atual.

---

## Mapa rápido handoff → codebase

| Handoff | Codebase destino |
|---|---|
| `styles.css` + `styles-layout.css` | `apps/frontend/src/app/globals.css` |
| `components/home.jsx` | `apps/frontend/src/app/page.tsx` |
| `components/lobby.jsx` | `apps/frontend/src/app/room/[roomId]/page.tsx` |
| `components/game.jsx` (GameScreen) | `apps/frontend/src/components/game-board.tsx` |
| `components/game.jsx` (ActionPanel) | `apps/frontend/src/components/action-bar.tsx` |
| `components/game.jsx` (ReactionOverlay) | `reaction-bar.tsx` + `block-challenge-bar.tsx` |
| `components/game.jsx` (LoseInfluenceOverlay) | `influence-card-selector.tsx` |
| `components/game.jsx` (ExchangeOverlay) | `exchange-selector.tsx` |
| `components/game.jsx` (WinnerOverlay) | `winner-overlay.tsx` |
| `components/game.jsx` (CoupAnimation) | novo `coup-animation.tsx` |
| `components/characters.jsx` (CoupCard, Portrait, CHARACTERS) | `character-card.tsx` + `components/portraits/*` |
| `components/shared.jsx` (Coin, Filigree, Crest) | `components/ui/{coin,filigree,crest}.tsx` |
| `components/shared.jsx` (Seat) | `player-seat.tsx` |
| `components/shared.jsx` (TableCenter) | novo `table-center.tsx` |
| `components/shared.jsx` (Chronicle) | novo `chronicle.tsx` (consolidar com `game-log.tsx`) |
