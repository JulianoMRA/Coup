# Feature Landscape

**Domain:** Online multiplayer card game — Coup (bluff/deduction, 2–6 players)
**Researched:** 2026-04-01
**Confidence:** HIGH (rules-based analysis; Coup mechanics are fully deterministic)

---

## Table Stakes

Features the game cannot function without. Missing any of these = game is broken or unplayable.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Room creation with shareable invite link | Entry point for all games; the social contract starts here | Low | Generate a short URL with random room code; no auth required |
| Join room by link without mandatory signup | Friction to entry is a game killer for friend groups | Low | Username prompt on join is acceptable; email/password is not |
| Full card set: Duke, Assassin, Captain, Ambassador, Contessa | Game rules are defined by these 5 roles | Low | 3 copies of each = 15-card deck for 2–6 players |
| Hidden hand — each player sees only their own cards | Core bluff mechanic; exposing others' cards breaks the game | Medium | Server must never send opponent card identities to clients |
| Coin economy (Income +1, Foreign Aid +2, Coup costs 7) | All actions are gated by coins | Low | Server-side authoritative state; client only displays |
| Character actions (Duke: Tax, Assassin: Assassinate, Captain: Steal, Ambassador: Exchange) | Without these, the game collapses to coin-flipping | Medium | Each action has prerequisites and counter-options |
| Blocking mechanism — player can claim a card to block an action | Half the game's depth lives here | High | See challenge/block flow section below |
| Challenging mechanism — any player can call a bluff | The other half of the game's depth | High | Challenge resolves immediately: loser flips a card |
| Reaction window — all players must have a chance to react before action resolves | Without this, challenges/blocks become a race condition | High | Fixed timeout OR explicit "pass" from all non-acting players |
| Influence loss — flip a card face-up when losing a challenge or paying Coup cost | Visual elimination progress | Medium | Flipped cards are visible to all; revealed identity confirmed |
| Player elimination — player with 0 influence is out | Game termination logic | Low | Eliminated players must still be visible (spectator-adjacent) |
| Win condition detection — last surviving player wins | Game end state | Low | Auto-detect after each elimination |
| Turn enforcement — only the active player can initiate actions | Without this, the game becomes chaos | Medium | Server authoritative; UI disables buttons for non-active players |
| 2–6 player support | Defined by game rules | Low | Deck has 15 cards; valid player count is strictly 2–6 |
| Game log / action history | Players need to track what happened; Coup is a deduction game | Medium | Append-only log visible to all; shows public info only (not hidden cards) |
| Real-time sync via WebSocket | Game requires instant reaction windows | High | All state transitions push to all clients immediately |
| Reconnection handling | Browser refreshes happen; should not destroy a game | Medium | Session-based identity; rejoin restores player state |

---

## The Challenge/Block Flow — Special Attention Required

This is the most complex feature in the game and deserves explicit design up-front. It governs the reaction window and has several sub-states.

### Turn Flow State Machine

```
ACTIVE_PLAYER_ANNOUNCES_ACTION
         |
         v
REACTION_WINDOW (all other players)
    |              |
    v              v
CHALLENGE       BLOCK_CLAIM
    |              |
    v              v
CHALLENGE_RESOLVES   BLOCK_REACTION_WINDOW
(card reveal,           (active player or others
 gain/lose influence)    can now challenge the block)
         |
         v
ACTION_RESOLVES or CANCELLED
```

### States requiring explicit UI:

| State | Who Acts | Complexity | Notes |
|-------|----------|------------|-------|
| Reaction window — challenge | Any other player | High | First challenge wins; others' window closes. Button: "Challenge" |
| Reaction window — block | Any player who can block (depends on action) | High | Block is a separate claim; can also be challenged |
| Block challenge | Active player (or anyone for some blocks) | Medium | "Do you challenge this block?" window |
| Losing a challenge — card selection | Loser picks which influence to flip | Medium | If 2 cards remain, player chooses which to reveal |
| Exchange — card selection | Ambassador user picks 2 of 4 to keep | High | Requires a card-picker UI with exactly 2-from-4 semantics |
| Assassination target | Active player picks a target | Low | Same as "which player" selection |
| Steal target | Active player picks a target | Low | Same |

**Key design decision:** Reaction windows need a clear time model. Options:
1. **Timeout-based**: 15–30 second window; auto-passes if no response. Keeps game moving.
2. **Explicit pass**: Each non-acting player must click "Pass" before action resolves. Slower but cleaner for friends.
3. **Hybrid**: Timeout with explicit pass. Best for async friends.

Recommendation: Explicit pass + visible "who hasn't decided yet" indicator. Friend games expect deliberation, not clock pressure.

---

## Differentiators

Features that are not required for the game to function but significantly improve experience for a small friend group.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| "Who still needs to act" indicator | Removes anxiety about waiting; clarity on reaction window state | Medium | Show avatars/names with pending/passed status |
| Eliminated player spectating in-room | Friends want to watch after they lose; leaving feels bad | Low | Eliminated players stay in room as read-only observers |
| Reveal animation when a card is challenged | Tactile moment; heightens the bluff tension | Medium | CSS transition or card flip; not required for correctness |
| Rematch button | Friend groups play multiple rounds; room reset without new link | Low | Reset game state; keep player roster |
| Configurable reaction timeout | Some groups want fast play; others deliberate | Low | Room creator sets timeout; default to no timeout for v1 |
| Action confirmation dialog | Prevent fat-finger Coup or Assassinate mistakes | Low | Simple "Are you sure?" for irreversible costly actions |
| Per-player coin/card count visible to all | Coup (7 coin mandatory) and card count (2 vs 1 left) are public info | Low | These are already public by rule; just need clear UI |
| Visual distinction for eliminated vs active players | Reduces confusion about who can still act | Low | Greyed-out player area; crossed-out name |
| Room lobby — ready check before game starts | Ensures all players are present before dealing | Low | "Ready" button per player; creator starts when all ready |
| Game rules quick-reference in UI | Coup has many interactions; new players forget | Low | Collapsible panel or tooltip per action button |

---

## Anti-Features

Features to deliberately NOT build for v1. Explicitly out of scope to avoid scope creep.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| User accounts with email/password | Adds auth complexity, DB schema, password reset flows; unnecessary for a private friend group | Username typed on join; stored in session/localStorage |
| Ranking / ELO / leaderboards | Requires persistent user identity across sessions; adds competitive pressure to a social game | Not needed for friends; add in v2 if demanded |
| Public matchmaking lobby | Requires moderation, scaling, strangers trust model; completely different product | Private invite link only |
| Chat / voice | External tools (Discord) already solve this for the target group | Point users to use Discord in parallel |
| Mobile native app | Web responsive covers the use case | Responsive CSS; no React Native |
| Game replay / recording | Requires event sourcing architecture from the start; high complexity for low v1 value | Log current game events; replay is a future feature |
| Expansion cards (Reformation, Inquisitor, Anarchy) | Increases rule complexity, card state, and testing surface; v1 should validate core loop | Architect card system to be extensible; implement in v2 |
| Spectator rooms (strangers watching) | Public streaming use case; irrelevant for friends | Eliminated players watch; that's sufficient |
| Profile pictures / avatars | Cosmetic; not needed for gameplay | Color-coded player indicators |
| Push notifications | Web sockets cover real-time; push adds PWA complexity | In-page browser tab title update ("Your turn!") is sufficient |
| Tournament / bracket management | Multi-game orchestration is a separate product | Single game sessions only |

---

## Feature Dependencies

```
Room creation
  └─→ Join via invite link
        └─→ Lobby (ready check)
              └─→ Game initialization (deal cards, assign coins)
                    └─→ Turn loop
                          ├─→ Action announcement
                          │     └─→ Reaction window (challenge / block)
                          │           ├─→ Challenge resolution (card reveal)
                          │           │     └─→ Influence loss (card flip)
                          │           └─→ Block → Block-challenge window
                          │                 └─→ Action resolves or cancels
                          └─→ Post-action state update
                                └─→ Elimination check
                                      └─→ Win condition check
                                            └─→ Game over / rematch
```

WebSocket real-time sync is a horizontal dependency across ALL steps above. Every state transition must push to all clients.

Game log is also a horizontal dependency — it receives an append on every state transition.

---

## MVP Recommendation

Prioritize in this order:

1. Room creation + invite link + join without signup
2. Game initialization (deal cards, assign coins, seat players)
3. Basic action loop (Income, Foreign Aid, Coup) — no blocking/challenging yet
4. Add character actions (Duke Tax, Assassin, Captain, Ambassador)
5. Add reaction window + challenge mechanic
6. Add block mechanic + block-challenge mechanic
7. Influence loss, elimination, win detection
8. Game log (public actions)
9. Reconnection handling
10. Eliminated player stays as spectator + rematch button

**Defer to v2:**
- Configurable timeout
- Reveal animations
- Quick-reference rules panel
- Any expansion content

**Critical complexity flag:** Steps 5–6 (challenge + block flow) are where most implementation bugs will occur. The state machine has at least 8 distinct sub-states and the server must be the single source of truth for all of them. Plan for a dedicated implementation and testing phase for this flow.

---

## Sources

- Coup rulebook (Indie Boards & Cards): game rules are fully deterministic and well-documented
- Confidence: HIGH for table stakes (rules-derived, no ambiguity)
- Confidence: MEDIUM for differentiators (UX patterns from online board game platforms — Board Game Arena, Tabletopia patterns applied to this scope)
- Confidence: HIGH for anti-features (directly aligned with PROJECT.md Out of Scope declarations)
