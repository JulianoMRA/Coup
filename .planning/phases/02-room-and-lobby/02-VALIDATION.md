---
phase: 02
slug: room-and-lobby
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-02
---

# Phase 02 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.2 |
| **Backend config** | `apps/backend/vitest.config.ts` — environment: node, globals: true |
| **Frontend config** | `apps/frontend/vitest.config.ts` — environment: jsdom, globals: true, alias `@/` → `./src` |
| **Quick run command** | `cd apps/backend && npm test` |
| **Full suite command** | `npm test` from repo root |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd apps/backend && npm test`
- **After every plan wave:** Run `npm test` from repo root
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-W0-01 | W0 | 0 | ROOM-01 | unit | `cd apps/backend && npm test` | ❌ Wave 0 | ⬜ pending |
| 02-W0-02 | W0 | 0 | ROOM-02/03/05/06 | unit | `cd apps/backend && npm test` | ❌ Wave 0 | ⬜ pending |
| 02-W0-03 | W0 | 0 | ROOM-02 (frontend) | unit | `cd apps/frontend && npm test` | ❌ Wave 0 | ⬜ pending |
| 02-01-01 | 01 | 1 | ROOM-01 | unit | `cd apps/backend && npm test` | ❌ W0 | ⬜ pending |
| 02-01-02 | 01 | 1 | ROOM-02/03 | unit | `cd apps/backend && npm test` | ❌ W0 | ⬜ pending |
| 02-02-01 | 02 | 2 | ROOM-05/06 | unit | `cd apps/backend && npm test` | ❌ W0 | ⬜ pending |
| 02-03-01 | 03 | 3 | ROOM-01/02 | e2e-manual | browser | N/A | ⬜ pending |
| 02-03-02 | 03 | 3 | ROOM-05/06 | e2e-manual | browser | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `apps/backend/src/__tests__/room-store.test.ts` — stubs for ROOM-01, ROOM-03 (room creation, ID uniqueness, capacity)
- [ ] `apps/backend/src/__tests__/room-handler.test.ts` — stubs for ROOM-02, ROOM-03, ROOM-05, ROOM-06 (socket event handlers)
- [ ] `apps/frontend/src/__tests__/room-page.test.ts` — stubs for ROOM-02 (username localStorage read)
- [ ] `cd apps/backend && npm install nanoid` — 8-char room ID generation
- [ ] `cd apps/frontend && npx shadcn add button input card badge` — UI components
- [ ] `cd apps/backend && npm install cors && npm install --save-dev @types/cors` — CORS for `/api/rooms`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Invite link copies to clipboard | ROOM-01 | Clipboard API not testable in jsdom | Click "Copiar link", check clipboard contains correct URL |
| "Copiado!" feedback appears | ROOM-01 | UI animation timing | Click button, confirm text changes for ~2s |
| Badge shows Conectado in lobby | ROOM-05 | Requires running server | Open lobby, confirm ConnectionBadge shows green |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
