# Phase 7: UX Polish and Deployment - Research

**Researched:** 2026-04-05
**Domain:** Deployment (Railway + Vercel), mobile responsive layout, React component polish
**Confidence:** HIGH

## Summary

Phase 7 delivers the project to production. All visual polish for the friend-group use case is already implemented — the phase has three concrete code changes (ActionBar pending indicator, GameBoard log toggle, backend build/start scripts) and two deployment configurations (Railway for backend, Vercel for frontend).

The backend is a Node.js Express + Socket.IO service in an npm monorepo. Railway's config-as-code (`railway.json`) at `apps/backend/railway.json` is the cleanest approach for specifying build/start commands without relying on dashboard-only settings. Vercel auto-detects Next.js from a monorepo root directory setting; the `NEXT_PUBLIC_BACKEND_URL` env var must be set in the Vercel dashboard.

The code changes are surgical: `action-bar.tsx` needs a "Aguardando" indicator using the already-passed `pendingReactions` prop; `game-board.tsx` needs a responsive log layout using Tailwind visibility classes. The backend already uses `process.env["FRONTEND_URL"]` and `process.env["PORT"]` correctly — only the missing `build` and `start` scripts need to be added.

**Primary recommendation:** Configure Railway via `apps/backend/railway.json` (build: `tsc`, start: `node dist/index.js`); configure Vercel via dashboard with root directory `apps/frontend` and `NEXT_PUBLIC_BACKEND_URL` env var. Code changes are minimal and well-scoped.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Deployment — Frontend**
- Platform: Vercel (auto-deploy from GitHub, zero-config for Next.js)
- Set `NEXT_PUBLIC_BACKEND_URL` env var in Vercel dashboard pointing to the Railway backend URL
- Auto-deploy on push to `main` branch

**Deployment — Backend**
- Platform: Railway with `npm start` script (no Docker needed — Railway detects Node.js automatically)
- `npm start` runs `node dist/index.js` (requires build step: `tsc`)
- Set `PORT` env var via Railway (backend must read `process.env.PORT`)
- Set `FRONTEND_URL` env var in Railway for CORS (pointing to Vercel URL)
- Auto-deploy on push to `main` branch via Railway GitHub integration

**Environment Variables**
- Frontend (Vercel): `NEXT_PUBLIC_BACKEND_URL=https://<railway-app>.up.railway.app`
- Backend (Railway): `PORT` (set by Railway), `FRONTEND_URL=https://<vercel-app>.vercel.app`, `NODE_ENV=production`
- Backend must use `process.env.PORT ?? 3001` (already using this pattern or needs to be added)
- CORS must allow Vercel domain in production

**Mobile Layout**
- `game-board.tsx`: always show `GameLog` on desktop (right panel, no toggle needed for `md:` and larger); keep "Ver Log" toggle only for mobile (`< md`)
- PlayerPanel and hand cards stack vertically on mobile (already via `flex-col md:flex-row`) — verify no overflow
- Action bars are fixed-bottom so they work on mobile as-is
- Minimum touch target for all buttons: 44px tall (already using shadcn Button defaults)

**Pending Reaction Indicator for Actor**
- In `action-bar.tsx`: when `pendingReactions` has entries with status `"WAITING"`, show "Aguardando: {names}" text above/below the action buttons
- Actor sees who still hasn't decided in real time (same data that's already passed as prop)
- Hide this indicator when there are no WAITING entries (normal turn state)

**Visual Polish — Already Implemented (no changes needed)**
- Active player: `ring-2 ring-primary` highlight in PlayerPanel
- Eliminated players: `line-through opacity-50` + "Eliminado" badge
- Per-player coin counts and card counts: always visible in PlayerPanel badges
- Reaction window pending indicator: shown in ReactionBar for reactors

### Claude's Discretion

None defined in CONTEXT.md.

### Deferred Ideas (OUT OF SCOPE)

- UXP-01 (card flip animation on challenge) — deferred, too complex for v1
- UXP-02 (quick rules panel) — deferred
- UXP-03 (auto-timeout configuration) — deferred
- UXP-04 (confirmation before costly actions) — deferred
- Custom domain — deferred, default Railway/Vercel URLs sufficient for friends
- CI/CD pipeline changes — Railway and Vercel auto-deploy from GitHub; no pipeline changes needed
</user_constraints>

---

## Project Constraints (from CLAUDE.md)

- TypeScript mandatory; avoid `any`
- `camelCase` variables/functions, `PascalCase` components/types, `kebab-case` file names
- Tests required — use Vitest (already configured in this project)
- Commits must be atomic with Conventional Commits message format
- Never commit/push without explicit confirmation
- No co-authored-by Claude in commit messages
- No refactoring outside task scope
- No new dependencies without justification

---

## Standard Stack

### Core — Already in Project

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | ^16.2.2 | Frontend framework | Installed; Vercel auto-detects |
| Express | ^5.2.1 | Backend HTTP server | Installed |
| Socket.IO | ^4.8.3 | WebSocket transport | Installed |
| TypeScript | ^6.0.2 | Compiler for `tsc` build step | Installed |
| Tailwind CSS | ^4.2.2 | Utility CSS for responsive layout | Installed |
| shadcn Button | installed | Touch-target compliant interactive elements | Installed |

[VERIFIED: apps/backend/package.json, apps/frontend/package.json — read in this session]

### No New Dependencies Required

This phase adds no new npm packages. All needed libraries are already installed.

---

## Architecture Patterns

### Backend: Build + Start for Railway

Railway's Node.js auto-detection runs `npm install && npm run build` then `npm run start`. The `build` script must compile TypeScript to `dist/`; `start` must run the compiled output.

**Pattern — `apps/backend/package.json` scripts:**
```json
{
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "vitest run"
  }
}
```
[VERIFIED: apps/backend/tsconfig.json confirms `outDir: ./dist` and `rootDir: ./src`]

### Backend: railway.json for Monorepo

Because this is a monorepo (root `package.json` with `workspaces`), Railway needs to know the service root is `apps/backend`. The cleanest approach is a `railway.json` placed at `apps/backend/railway.json` with the build and start commands explicitly set. Railway also supports setting root directory in the dashboard — but config-as-code is preferable for reproducibility.

**Pattern — `apps/backend/railway.json`:**
```json
{
  "$schema": "https://railway.com/railway.schema.json",
  "build": {
    "buildCommand": "npm install && npm run build"
  },
  "deploy": {
    "startCommand": "node dist/index.js"
  }
}
```
[CITED: https://docs.railway.com/reference/config-as-code]

**Railway dashboard settings (manual, one-time):**
- Root Directory: `apps/backend`
- The `railway.json` path must match the root directory (Railway resolves it relative to the configured root)
- Connect GitHub repo, select `main` branch for auto-deploy
- Set env vars: `FRONTEND_URL`, `NODE_ENV=production` (Railway sets `PORT` automatically)

[CITED: https://docs.railway.com/deployments/monorepo]

### Backend: CORS is Already Production-Ready

`apps/backend/src/index.ts` already reads `process.env["FRONTEND_URL"] ?? "http://localhost:3000"` for both the Express CORS middleware and Socket.IO CORS config. Setting `FRONTEND_URL` in Railway to the Vercel URL is sufficient — no code change needed.

[VERIFIED: apps/backend/src/index.ts — read in this session]

`PORT` is already read as `process.env["PORT"] ?? 3001` — no code change needed.

[VERIFIED: apps/backend/src/index.ts line 36 — read in this session]

### Frontend: Vercel Monorepo Setup

Vercel auto-detects Next.js when the root directory is set to `apps/frontend`. The monorepo root (`package.json` with `workspaces`) must be the repository root — Vercel needs it to resolve workspace dependencies (`@coup/shared`).

**Vercel dashboard settings (manual, one-time):**
- Import Git Repository from GitHub
- Root Directory: `apps/frontend`
- Framework: Next.js (auto-detected)
- Build Command: `next build` (auto-detected)
- Set env var: `NEXT_PUBLIC_BACKEND_URL=https://<railway-app>.up.railway.app`
- Auto-deploy: on push to `main` (default behavior)

[CITED: https://vercel.com/docs/monorepos — Root Directory setting confirmed]

`apps/frontend/src/lib/socket.ts` already reads `process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3001"` — no code change needed.

[VERIFIED: apps/frontend/src/lib/socket.ts — read in this session]

### Frontend: GameBoard Responsive Log Layout

Current state: a single `<div className="flex-1">` containing a toggle button and conditionally rendered `<GameLog>`. This works only on mobile — desktop has no always-visible log.

**Pattern — responsive log using Tailwind visibility (from UI-SPEC.md):**
```tsx
// Source: 07-UI-SPEC.md responsive layout contract
<div className="flex-1">
  {/* Mobile toggle — hidden on md+ */}
  <div className="md:hidden">
    <Button variant="ghost" onClick={() => setShowMobileLog(!showMobileLog)}>
      {showMobileLog ? "Ocultar Log" : "Ver Log"}
    </Button>
    {showMobileLog && <GameLog log={game.log} />}
  </div>
  {/* Desktop always-visible — hidden on mobile */}
  <div className="hidden md:block">
    <GameLog log={game.log} />
  </div>
</div>
```

No new component needed — this is a layout restructure within the existing `flex-1` div. The `showMobileLog` state stays in `GameBoard` but is only used by the mobile branch.

[VERIFIED: apps/frontend/src/components/game-board.tsx — read in this session; pattern from 07-UI-SPEC.md]

### Frontend: ActionBar Pending Indicator

Current state: `ActionBar` receives `pendingReactions` prop but the value is destructured away in the function signature — it's declared in the interface but not used.

**Pattern — pending indicator (matches ReactionBar style):**
```tsx
// Source: reaction-bar.tsx line 52-55 — existing "Aguardando" pattern
const waitingNames = Object.entries(pendingReactions ?? {})
  .filter(([, status]) => status === "WAITING")
  .map(([id]) => players.find((p) => p.id === id)?.name ?? id)
  .join(", ")

// Render above the button rows, inside the fixed-bottom container:
{waitingNames && (
  <p className="text-xs text-muted-foreground text-center">
    Aguardando: {waitingNames}
  </p>
)}
```

**Note:** `ActionBar` currently does not receive a `players` prop to resolve player names from IDs. Two options:
1. Pass player names directly from `pendingReactions` (if names are included in state) — not the case; only IDs are keys
2. Pass the `players` array as a new prop to `ActionBar`

The `GameBoard` already has `game.players` available where it renders `ActionBar`. Adding `players` prop to `ActionBar` is the correct approach. This is a one-line prop addition with no downstream complexity.

[VERIFIED: apps/frontend/src/components/action-bar.tsx — prop interface and destructuring read in this session]
[VERIFIED: apps/frontend/src/components/reaction-bar.tsx — same pattern already implemented]

### Environment Variables Documentation

**Pattern — `.env.example` at repo root:**
```bash
# Backend (Railway)
# PORT is set by Railway automatically
FRONTEND_URL=https://<vercel-app>.vercel.app
NODE_ENV=production

# Frontend (Vercel)
NEXT_PUBLIC_BACKEND_URL=https://<railway-app>.up.railway.app
```

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| TypeScript compilation | Custom build script | `tsc` (already installed) | Handles paths, strict mode, declaration maps |
| Responsive breakpoints | Custom CSS media queries | Tailwind `md:` prefix | Already used throughout codebase; consistent with existing patterns |
| Pending player name resolution | String concatenation ad-hoc | Same pattern as `reaction-bar.tsx` | Already solved — copy exact pattern |

**Key insight:** Every problem in this phase has already been solved once in the codebase. The pending indicator pattern exists in `reaction-bar.tsx`; the responsive pattern exists elsewhere in the layout; `tsc` is already the compiler. Research and copy, don't reinvent.

---

## Common Pitfalls

### Pitfall 1: Railway Cannot Find `dist/index.js` (Missing Build Step)

**What goes wrong:** Railway runs `npm start` → `node dist/index.js` fails with `MODULE_NOT_FOUND` because `dist/` was never created.

**Why it happens:** `tsc` must run before `npm start`. If the `build` script is missing from `package.json`, Railway's default behavior may not compile TypeScript.

**How to avoid:** Add `"build": "tsc"` to `apps/backend/package.json`. Confirm `railway.json` `buildCommand` includes the build step, or Railway's auto-detection of `npm run build` handles it.

**Warning signs:** Deployment log shows "Cannot find module '/app/dist/index.js'" or similar.

### Pitfall 2: Vercel Cannot Resolve `@coup/shared` Workspace Package

**What goes wrong:** Vercel build fails with "Cannot find module '@coup/shared'" because it cannot resolve the local workspace package.

**Why it happens:** If Vercel only installs dependencies from `apps/frontend/package.json` in isolation (without workspace context), it misses `packages/shared`.

**How to avoid:** Set Root Directory to `apps/frontend` in Vercel — Vercel then uses the monorepo root for `npm install`, which resolves workspace packages. The `next.config.ts` already has `transpilePackages: ["@coup/shared"]` which is required for Next.js to compile the shared package.

[VERIFIED: apps/frontend/next.config.ts — transpilePackages already set]

**Warning signs:** Build logs show "Cannot find module '@coup/shared'" or TypeScript errors about missing types.

### Pitfall 3: CORS Rejection in Production (Wrong FRONTEND_URL)

**What goes wrong:** Browser receives `Access-Control-Allow-Origin` error for the Vercel domain; WebSocket connection fails.

**Why it happens:** `FRONTEND_URL` env var is not set in Railway before the first deploy, so CORS defaults to `http://localhost:3000`.

**How to avoid:** Set `FRONTEND_URL` in Railway dashboard **before** the first production deploy. The chicken-and-egg issue (need Vercel URL to set Railway env, need Railway URL to set Vercel env) is resolved by: deploy Railway first (get its URL), then deploy Vercel (get its URL), then update `FRONTEND_URL` in Railway and redeploy.

**Warning signs:** Game page loads but socket events never fire; browser console shows CORS errors.

### Pitfall 4: `pendingReactions` Shows Indicator When Not Actor's Turn

**What goes wrong:** The "Aguardando" indicator appears in `ActionBar` even when `game.phase` is `AWAITING_REACTIONS` and it's not the actor's turn — because `ActionBar` is always rendered in the else-branch.

**Why it happens:** `GameBoard` renders `ActionBar` as the fallback when no other bar is shown. During `AWAITING_REACTIONS`, the actor sees `ActionBar` (not `ReactionBar`) — this is correct. Non-actors see `ReactionBar`. So the indicator is actor-only by construction.

**How to avoid:** No special guard needed — the `ActionBar` is only shown to the actor during `AWAITING_REACTIONS`. Verify this by checking the `needsReaction` condition in `game-board.tsx`: it only shows `ReactionBar` when `pendingReactions[playerId]` exists, meaning the actor (who is not in `pendingReactions`) sees `ActionBar`.

[VERIFIED: apps/frontend/src/components/game-board.tsx lines 51-53 — needsReaction condition]

### Pitfall 5: Mobile Touch Target Below 44px

**What goes wrong:** Small buttons on mobile are tappable but miss-tap rate is high; Apple HIG and WCAG require 44×44px minimum.

**Why it happens:** shadcn Button default is `h-10` (40px). With default border this is very close to 44px but may be under on some browsers.

**How to avoid:** The UI-SPEC recommends `min-h-[44px]` override if verification shows undersize. This phase should verify on mobile before marking complete. Action bars are fixed-bottom which helps but individual buttons still need 44px height.

[CITED: 07-UI-SPEC.md — Touch target exception note]

---

## Code Examples

### ActionBar: Adding `players` Prop and Pending Indicator

```tsx
// Source: Based on reaction-bar.tsx lines 52-55 (existing pattern)
interface ActionBarProps {
  roomId: string
  playerId: string
  isMyTurn: boolean
  myCoins: number
  phase: GamePhase
  players: PublicPlayerState[]  // NEW — needed for name resolution
  pendingReactions?: Record<string, "WAITING" | "PASSED" | "CHALLENGED" | "BLOCKED"> | null
  onSelectCoupTarget: () => void
  onSelectStealTarget: () => void
  onSelectAssassinateTarget: () => void
}

// Inside the component, above the button rows:
const waitingNames = Object.entries(pendingReactions ?? {})
  .filter(([, status]) => status === "WAITING")
  .map(([id]) => players.find((p) => p.id === id)?.name ?? id)
  .join(", ")

// In JSX:
{waitingNames && (
  <p className="text-xs text-muted-foreground text-center">
    Aguardando: {waitingNames}
  </p>
)}
```

### GameBoard: Passing `players` to ActionBar

```tsx
// Source: game-board.tsx — existing ActionBar usage, add players prop
<ActionBar
  roomId={roomId}
  playerId={playerId}
  isMyTurn={isMyTurn}
  myCoins={myCoins}
  phase={game.phase}
  players={game.players}  // NEW
  pendingReactions={game.pendingAction?.pendingReactions}
  onSelectCoupTarget={() => setSelectingCoupTarget(true)}
  onSelectStealTarget={() => setSelectingStealTarget(true)}
  onSelectAssassinateTarget={() => setSelectingAssassinateTarget(true)}
/>
```

### railway.json

```json
{
  "$schema": "https://railway.com/railway.schema.json",
  "build": {
    "buildCommand": "npm install && npm run build"
  },
  "deploy": {
    "startCommand": "node dist/index.js"
  }
}
```
[CITED: https://docs.railway.com/reference/config-as-code]

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Backend runtime | Yes | v24.12.0 | — |
| npm | Package manager | Yes | 11.12.1 | — |
| TypeScript (`tsc`) | Backend build | Yes | 6.0.2 | — |
| Railway CLI | Deployment (optional) | No | — | Dashboard manual setup (sufficient for one-time config) |
| Vercel CLI | Deployment (optional) | No | — | Dashboard manual setup (sufficient for one-time config) |

[VERIFIED: node --version, npm --version, npx tsc --version run in this session]

**Missing dependencies with no fallback:** None — CLI tools are optional for this use case. Railway and Vercel GitHub integrations handle auto-deploy without CLIs.

**Missing dependencies with fallback:**
- Railway CLI: Not installed. Not required — the dashboard + `railway.json` config-as-code covers all needed setup for a first deploy.
- Vercel CLI: Not installed. Not required — the dashboard covers project import and env var configuration.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.2 |
| Config file | `apps/backend/vitest.config.ts`, `apps/frontend/vitest.config.ts` |
| Quick run command | `npm run test --workspace=apps/backend` |
| Full suite command | `npm test` (root vitest config runs all workspaces) |

### Phase Requirements → Test Map

This phase has no new feature requirements from REQUIREMENTS.md. It delivers deployment configuration and UI polish for already-implemented features.

| Area | Behavior | Test Type | Automated Command | File Exists? |
|------|----------|-----------|-------------------|-------------|
| ActionBar pending indicator | Shows "Aguardando: {names}" when WAITING reactions exist | Unit | `npm run test --workspace=apps/frontend` | No — Wave 0 |
| ActionBar pending indicator | Hidden when no WAITING reactions | Unit | `npm run test --workspace=apps/frontend` | No — Wave 0 |
| GameBoard log layout | GameLog rendered when `md:` breakpoint (desktop) | Visual/manual | n/a | Manual only |
| Backend build | `tsc` compiles without errors | Manual / CI | `npm run build --workspace=apps/backend` | Verified by build success |

### Wave 0 Gaps

- [ ] `apps/frontend/src/__tests__/action-bar.test.tsx` — unit tests for pending indicator logic (WAITING entries shown, empty/all-PASSED hidden)

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Railway auto-detects Node.js and runs `npm run build` then `npm run start` when both scripts exist | Architecture Patterns | Build step skipped → deployment fails; mitigation: `railway.json` `buildCommand` makes this explicit |
| A2 | Vercel resolves workspace packages when Root Directory is set to `apps/frontend` (because Vercel uses the monorepo root for install) | Common Pitfalls | Build fails with missing `@coup/shared` module; mitigation: `transpilePackages` in `next.config.ts` is already set |

---

## Open Questions

1. **Circular URL dependency at first deploy**
   - What we know: Railway URL is needed for Vercel env var; Vercel URL is needed for Railway env var
   - What's unclear: Whether placeholder values during first deploy cause visible errors to users
   - Recommendation: Deploy Railway first, get the `.up.railway.app` URL, then deploy Vercel with `NEXT_PUBLIC_BACKEND_URL` set. After Vercel URL is known, set `FRONTEND_URL` in Railway and trigger a redeploy. The first deploy of Vercel will have CORS blocked until Railway's `FRONTEND_URL` is updated — but since this is not a user-facing production incident (friend group, controlled rollout), this is acceptable.

2. **`players` prop addition to `ActionBar` — test coverage**
   - What we know: `ActionBar` interface needs a `players: PublicPlayerState[]` prop added
   - What's unclear: Whether existing ActionBar tests (if any) will break with the new required prop
   - Recommendation: Check `apps/frontend/src/__tests__/` for any ActionBar test file. If none, no breakage risk. Add the prop and mock it in Wave 0 test.

---

## Sources

### Primary (HIGH confidence)
- `apps/backend/src/index.ts` — verified PORT and CORS config
- `apps/backend/package.json` — verified missing build/start scripts
- `apps/backend/tsconfig.json` — verified outDir: ./dist
- `apps/frontend/src/lib/socket.ts` — verified NEXT_PUBLIC_BACKEND_URL usage
- `apps/frontend/src/components/action-bar.tsx` — verified pendingReactions prop unused
- `apps/frontend/src/components/reaction-bar.tsx` — verified existing "Aguardando" pattern
- `apps/frontend/src/components/game-board.tsx` — verified current log toggle implementation
- `apps/frontend/next.config.ts` — verified transpilePackages
- `.planning/phases/07-ux-polish-and-deployment/07-UI-SPEC.md` — verified responsive layout contract

### Secondary (MEDIUM confidence)
- [Railway Config as Code docs](https://docs.railway.com/reference/config-as-code) — `railway.json` format verified
- [Railway Monorepo docs](https://docs.railway.com/deployments/monorepo) — root directory and watch paths
- [Vercel Monorepos docs](https://vercel.com/docs/monorepos) — root directory setting for Next.js in monorepo

### Tertiary (LOW confidence)
- None — all critical claims verified via codebase inspection or official docs

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages already installed and verified in package.json files
- Architecture: HIGH — backend config verified in source; Railway/Vercel docs consulted for deploy patterns
- Pitfalls: HIGH — CORS, missing build, and workspace resolution verified against actual code

**Research date:** 2026-04-05
**Valid until:** 2026-05-05 (Railway/Vercel APIs stable; Tailwind utility classes stable)
