# Requirements: Coup Online

**Defined:** 2026-04-01
**Core Value:** Amigos conseguem jogar Coup online de forma simples: cria sala, compartilha link, joga.

## v1 Requirements

### Session & Room

- [x] **ROOM-01**: Jogador pode criar uma sala e receber um link de convite compartilhável
- [x] **ROOM-02**: Jogador pode entrar na sala via link sem cadastro (apenas digita um nome)
- [x] **ROOM-03**: Sala suporta de 2 a 6 jogadores
- [x] **ROOM-04**: Identidade do jogador persiste via UUID no localStorage (reconexão restaura o slot)
- [x] **ROOM-05**: Lobby exibe todos os jogadores presentes com botão "Pronto"
- [x] **ROOM-06**: Criador da sala inicia o jogo quando todos estão prontos

### Game Initialization

- [x] **INIT-01**: Baralho de 15 cartas (3× Duke, Assassin, Captain, Ambassador, Contessa) é embaralhado no servidor
- [x] **INIT-02**: Cada jogador recebe 2 cartas de influência ocultas e 2 moedas ao iniciar
- [x] **INIT-03**: O servidor nunca envia cartas ocultas de um jogador para outros clientes
- [x] **INIT-04**: Ordem de turnos é definida aleatoriamente no início

### Turn Loop

- [ ] **TURN-01**: Apenas o jogador ativo pode iniciar uma ação no seu turno
- [ ] **TURN-02**: Ações disponíveis por estado de moedas: Income (+1), Foreign Aid (+2), Coup (7 moedas, obrigatório com 10+)
- [ ] **TURN-03**: Ações de personagem: Duke (Tax +3), Assassin (Assassinate, custa 3), Captain (Steal), Ambassador (Exchange)
- [ ] **TURN-04**: Alvo deve ser selecionado para ações que requerem alvo (Coup, Assassinate, Steal)

### Reaction Window

- [ ] **REAC-01**: Após anúncio de ação, todos os outros jogadores têm uma janela para Desafiar ou Bloquear (se aplicável)
- [ ] **REAC-02**: Modelo de passe explícito: cada jogador deve clicar "Passar" para fechar sua janela
- [ ] **REAC-03**: Indicador visual mostra quem ainda não decidiu na janela de reação
- [ ] **REAC-04**: Ação só resolve após todos os demais jogadores passarem ou reagirem

### Challenge & Block

- [ ] **CHAL-01**: Qualquer jogador pode desafiar uma ação (ou bloqueio) que requer um personagem
- [ ] **CHAL-02**: Desafiado deve revelar a carta — se tiver, o desafiante perde influência; se não tiver, o desafiado perde
- [ ] **CHAL-03**: Qualquer jogador elegível pode bloquear com a carta correta (Duke bloqueia FA; Contessa bloqueia Assassinate; Captain/Ambassador bloqueiam Steal)
- [ ] **CHAL-04**: Bloqueio também pode ser desafiado pelo jogador ativo (ou outros, conforme regras)
- [ ] **CHAL-05**: Após revelar carta ao ser desafiado com sucesso, jogador que provou seu personagem compra nova carta do baralho e descarta a revelada

### Influence & Elimination

- [ ] **INFL-01**: Jogador perde influência ao perder desafio, ser assassinado ou sofrer Coup
- [ ] **INFL-02**: Quando perde influência com 2 cartas, jogador escolhe qual carta revelar/descartar
- [ ] **INFL-03**: Carta descartada é virada face-up visível a todos (identidade revelada)
- [ ] **INFL-04**: Jogador com 0 influência é eliminado e vira espectador (permanece na sala visualizando)
- [ ] **INFL-05**: Último jogador com influência é declarado vencedor

### Ambassador Exchange

- [ ] **AMBX-01**: Ao usar Exchange, jogador recebe 2 cartas do baralho e deve escolher 2 de 4 para manter
- [ ] **AMBX-02**: UI de seleção de cartas permite escolher exatamente 2 de 4 cartas
- [ ] **AMBX-03**: Cartas devolvidas são embaralhadas de volta ao baralho

### Game Log

- [ ] **LOG-01**: Log de ações visível a todos exibe cada evento público em ordem cronológica
- [ ] **LOG-02**: Log nunca expõe cartas ocultas (ex: "Jogador A perdeu uma influência" e não "Jogador A perdeu seu Duke")
- [ ] **LOG-03**: Coins e contagem de influências de cada jogador são públicos e visíveis a todos

### Real-Time Sync

- [x] **SYNC-01**: Todas as transições de estado são enviadas via WebSocket a todos os clientes instantaneamente
- [x] **SYNC-02**: Cada cliente recebe apenas a projeção de estado filtrada para seu jogador (cartas ocultas de outros nunca trafegam)
- [ ] **SYNC-03**: Jogador que reconecta (atualiza a página) recupera seu estado de jogo via UUID da sessão

### Post-Game

- [ ] **POST-01**: Após fim de jogo, botão "Rematch" reinicia a partida com os mesmos jogadores sem gerar novo link
- [ ] **POST-02**: Tela de vitória exibe o vencedor claramente

---

## v2 Requirements

### UX & Polish

- **UXP-01**: Animação de reveal ao desafiar uma carta (flip visual)
- **UXP-02**: Painel de regras rápidas consultável durante o jogo
- **UXP-03**: Configuração de timeout automático por sala (criador define)
- **UXP-04**: Confirmação antes de ações custosas/irreversíveis (Coup, Assassinate)

### Expansões

- **EXP-01**: Suporte a cartas de expansão (Inquisitor, Reformation, Anarchy)
- **EXP-02**: Modo de seleção de cartas ativas por sala

---

## Out of Scope

| Feature | Reason |
|---------|--------|
| Contas com e-mail/senha | Adiciona complexidade de auth desnecessária para grupo privado |
| Ranking / ELO | Requer identidade persistente entre sessões; fora do escopo social do projeto |
| Matchmaking público | Produto diferente; plataforma é privada por design |
| Chat / voz integrado | Grupo de amigos já usa Discord; duplicar seria overhead |
| App mobile nativo | Web responsivo cobre o caso de uso |
| Replay de partidas | Requer event sourcing desde o início; alto custo, baixo valor no v1 |
| Espectadores externos (strangers) | Eliminados assistem; caso público é diferente produto |
| Notificações push | WebSocket cobre real-time; título da aba ("Sua vez!") é suficiente |
| Torneios / brackets | Orquestração multi-jogo é produto separado |

---

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| ROOM-01 | Phase 2 | Complete |
| ROOM-02 | Phase 2 | Complete |
| ROOM-03 | Phase 2 | Complete |
| ROOM-04 | Phase 1 | Complete |
| ROOM-05 | Phase 2 | Complete |
| ROOM-06 | Phase 2 | Complete |
| INIT-01 | Phase 3 | Complete |
| INIT-02 | Phase 3 | Complete |
| INIT-03 | Phase 1 | Complete |
| INIT-04 | Phase 3 | Complete |
| TURN-01 | Phase 4 | Pending |
| TURN-02 | Phase 4 | Pending |
| TURN-03 | Phase 4 | Pending |
| TURN-04 | Phase 4 | Pending |
| REAC-01 | Phase 5 | Pending |
| REAC-02 | Phase 5 | Pending |
| REAC-03 | Phase 5 | Pending |
| REAC-04 | Phase 5 | Pending |
| CHAL-01 | Phase 5 | Pending |
| CHAL-02 | Phase 5 | Pending |
| CHAL-03 | Phase 5 | Pending |
| CHAL-04 | Phase 5 | Pending |
| CHAL-05 | Phase 5 | Pending |
| INFL-01 | Phase 4 | Pending |
| INFL-02 | Phase 4 | Pending |
| INFL-03 | Phase 4 | Pending |
| INFL-04 | Phase 4 | Pending |
| INFL-05 | Phase 4 | Pending |
| AMBX-01 | Phase 4 | Pending |
| AMBX-02 | Phase 4 | Pending |
| AMBX-03 | Phase 4 | Pending |
| LOG-01 | Phase 4 | Pending |
| LOG-02 | Phase 4 | Pending |
| LOG-03 | Phase 4 | Pending |
| SYNC-01 | Phase 1 | Complete |
| SYNC-02 | Phase 1 | Complete |
| SYNC-03 | Phase 6 | Pending |
| POST-01 | Phase 6 | Pending |
| POST-02 | Phase 6 | Pending |

**Coverage:**
- v1 requirements: 39 total
- Mapped to phases: 39
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-01*
*Last updated: 2026-04-01 after initial definition*
