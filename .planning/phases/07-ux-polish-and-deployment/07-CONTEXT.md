# Phase 7: UX Polish and Deployment - Context

**Gathered:** 2026-04-05
**Status:** Ready for planning
**Mode:** Smart discuss (batch proposals, all areas accepted or user-selected)

<domain>
## Phase Boundary

The app is deployed to production and accessible via a public URL; the UI is responsive on mobile browsers; visual indicators make the game state unambiguous; the app is ready for the friend group to use.

Requirements: no new requirements — this phase delivers the project constraints (responsive web, public deployment, polish of previously built features).

</domain>

<decisions>
## Implementation Decisions

### Deployment — Frontend
- **Platform:** Vercel (auto-deploy from GitHub, zero-config for Next.js)
- Set `NEXT_PUBLIC_BACKEND_URL` env var in Vercel dashboard pointing to the Railway backend URL
- Auto-deploy on push to `main` branch

### Deployment — Backend
- **Platform:** Railway with `npm start` script (no Docker needed — Railway detects Node.js automatically)
- `npm start` runs `node dist/index.js` (requires build step: `tsc`)
- Set `PORT` env var via Railway (backend must read `process.env.PORT`)
- Set `FRONTEND_URL` env var in Railway for CORS (pointing to Vercel URL)
- Auto-deploy on push to `main` branch via Railway GitHub integration

### Environment Variables
- Frontend (Vercel): `NEXT_PUBLIC_BACKEND_URL=https://<railway-app>.up.railway.app`
- Backend (Railway): `PORT` (set by Railway), `FRONTEND_URL=https://<vercel-app>.vercel.app`, `NODE_ENV=production`
- Backend must use `process.env.PORT ?? 3001` (already using this pattern or needs to be added)
- CORS must allow Vercel domain in production

### Mobile Layout
- `game-board.tsx`: always show `GameLog` on desktop (right panel, no toggle needed for `md:` and larger); keep "Ver Log" toggle only for mobile (`< md`)
- PlayerPanel and hand cards stack vertically on mobile (already via `flex-col md:flex-row`) — verify no overflow
- Action bars are fixed-bottom so they work on mobile as-is
- Minimum touch target for all buttons: 44px tall (already using shadcn Button defaults)

### Pending Reaction Indicator for Actor
- In `action-bar.tsx`: when `pendingReactions` has entries with status `"WAITING"`, show "Aguardando: {names}" text above/below the action buttons
- Actor sees who still hasn't decided in real time (same data that's already passed as prop)
- Hide this indicator when there are no WAITING entries (normal turn state)

### Visual Polish — Already Implemented (no changes needed)
- Active player: `ring-2 ring-primary` highlight in PlayerPanel ✓
- Eliminated players: `line-through opacity-50` + "Eliminado" badge ✓
- Per-player coin counts and card counts: always visible in PlayerPanel badges ✓
- Reaction window pending indicator: shown in ReactionBar for reactors ✓

</decisions>

<code_context>
## Existing Code Insights

**Already working:**
- `player-panel.tsx`: active ring, eliminated strikethrough, coin/card badges — no changes needed
- `reaction-bar.tsx`: "Aguardando: {names}" already shown to reactors — no changes needed
- `game-board.tsx`: layout is `flex-col md:flex-row` — correct; the log toggle needs to become desktop-always/mobile-toggle
- `action-bar.tsx`: receives `pendingReactions` prop but doesn't display it — needs pending indicator added
- `apps/backend/src/index.ts`: need to check if PORT and CORS are production-ready

**Needs changes:**
- `apps/backend/src/index.ts`: read `process.env.PORT`, add CORS config for production Vercel URL (env var based)
- `apps/backend/package.json`: add `"start": "node dist/index.js"` and `"build": "tsc"` scripts if missing
- `apps/frontend/src/components/game-board.tsx`: make log always visible on desktop, toggle only on mobile
- `apps/frontend/src/components/action-bar.tsx`: add pending reaction indicator for the actor
- `apps/frontend/src/lib/socket.ts`: ensure backend URL comes from `NEXT_PUBLIC_BACKEND_URL` env var (already does via `process.env.NEXT_PUBLIC_BACKEND_URL`)

**New files:**
- `railway.json` or `railway.toml` in root/backend for Railway config (optional, auto-detected)
- `.env.example` at root documenting required env vars

</code_context>

<specifics>
## Specific Ideas

- Keep changes minimal — this is a friend-group app, not a public product
- Do not add animations, splash screens, or onboarding flows
- The "Aguardando" text in ActionBar should match the style of the one in ReactionBar (`text-xs text-muted-foreground text-center`)
- On mobile, game log as a toggle button is sufficient — no need for a modal or slide-up panel
- Railway uses the `PORT` env var automatically; backend must not hardcode 3001 as the only option

</specifics>

<deferred>
## Deferred Ideas

- UXP-01 (card flip animation on challenge) — deferred, too complex for v1
- UXP-02 (quick rules panel) — deferred
- UXP-03 (auto-timeout configuration) — deferred
- UXP-04 (confirmation before costly actions) — deferred
- Custom domain (coup.amigos.com style) — deferred, default Railway/Vercel URLs are sufficient for friends
- CI/CD pipeline changes — Railway and Vercel auto-deploy from GitHub; no pipeline changes needed
</deferred>
