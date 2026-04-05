---
phase: 7
slug: ux-polish-and-deployment
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-05
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.2 |
| **Config file** | `apps/backend/vitest.config.ts`, `apps/frontend/vitest.config.ts` |
| **Quick run command** | `npm run test --workspace=apps/frontend` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test --workspace=apps/frontend`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 07-pending-01 | pending-indicator | 1 | UI polish | — | N/A | unit | `npm run test --workspace=apps/frontend` | ❌ W0 | ⬜ pending |
| 07-pending-02 | pending-indicator | 1 | UI polish | — | N/A | unit | `npm run test --workspace=apps/frontend` | ❌ W0 | ⬜ pending |
| 07-log-01 | game-log-layout | 1 | Responsive | — | N/A | visual/manual | n/a | Manual only | ⬜ pending |
| 07-build-01 | backend-deployment | 1 | Deployment | — | N/A | build | `npm run build --workspace=apps/backend` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `apps/frontend/src/__tests__/action-bar.test.tsx` — unit tests for ActionBar pending indicator: WAITING reactions shown as names, hidden when empty/all-PASSED

*Framework already installed — no new installs needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| GameLog visible on desktop, hidden on mobile with toggle | Responsive UI | CSS breakpoint — not unit-testable | Open on mobile viewport (375px), verify toggle shows/hides; on desktop verify always visible |
| App accessible at public URL | Deployment SC-1 | Requires live deployment | Visit Railway/Vercel URL, confirm game loads without localhost |
| Mobile playable without scrolling | Responsive SC-2 | Visual layout | Open on 375px mobile, play through a turn, confirm no horizontal scroll |
| Active/eliminated player visual distinction | Visual SC-3 | Visual rendering | Eliminate a player, confirm visual treatment differs from active |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
