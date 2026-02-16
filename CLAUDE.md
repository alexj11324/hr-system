# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install          # Install dependencies
npm run dev          # Start Vite dev server on port 3000
npm run build        # Production build (outputs to dist/)
npm start            # Run production Express server (serves dist/ on port 8080)
```

No test framework is configured. No linter is configured.

## Deployment

Push to `main` triggers GitHub Actions (`.github/workflows/deploy.yml`) which deploys to Google Cloud Run via `gcloud run deploy --source .`. The Dockerfile does a multi-stage build: Vite builds the frontend, then a slim Node.js image runs `server.js` to serve it.

Environment variables required on Cloud Run:
- `SUPABASE_SERVICE_ROLE_KEY` — needed for passkey auth and admin DB operations
- `WEBAUTHN_RP_ID` — WebAuthn relying party ID (production domain)
- `WEBAUTHN_ORIGIN` — full origin URL for WebAuthn verification

## Architecture

This is a single-repo HR system with two distinct user portals served from one React SPA:

**HR Admin Portal** — internal dashboard for managing jobs, candidates, employees. Auth is a simple name-based login stored in localStorage (`currentUser` state). The allowed names are in `constants.ts:ALLOWED_USERS`.

**Applicant Portal** — external-facing careers page where candidates browse jobs, create accounts, and apply. Auth uses Supabase email/password with optional WebAuthn passkey support. Views are prefixed with `external_` in the `ViewState` type.

Both portals share the same `App.tsx` which acts as a router via a `currentView` state machine (no React Router). The `renderContent()` switch statement maps `ViewState` values to page components. Portal detection uses `isExternalPortalView` to toggle between sidebar layout (admin) and standalone layout (applicant).

### Auth Flow (Critical Complexity)

`App.tsx` has two parallel auth mechanisms that must both resolve before rendering:
1. **Sync**: localStorage check for HR admin (`isAuthLoading` flag)
2. **Async**: Supabase session check for applicants (`authChecked` flag)

The render guard `if (isAuthLoading || (!currentUser && !authChecked))` prevents white-screen bugs. Both flags must be true before the app decides what to show.

Passkey auth flow: `lib/passkey.ts` (client) → `server.js` `/api/passkey/*` endpoints → Supabase admin API generates a magic link → client calls `supabase.auth.verifyOtp()` to establish session.

### Backend

`server.js` is an Express 5 server that:
1. Serves the Vite-built SPA from `dist/` with proper cache headers (immutable for `/assets`, no-cache for `index.html`)
2. Provides WebAuthn passkey API endpoints (`/api/passkey/*`)
3. Uses in-memory challenge store with 5-min TTL (not suitable for multi-instance scaling)

The server needs `SUPABASE_SERVICE_ROLE_KEY` to create admin Supabase client for passkey operations. Without it, passkey auth is disabled.

### Database (Supabase)

Three main tables with RLS enabled:
- `profiles` — user profiles (linked to `auth.users`)
- `jobs` — job postings (publicly readable)
- `job_applications` — applications with denormalized candidate info
- `passkey_credentials` — WebAuthn credential storage

Migrations are in `supabase/migrations/`. The schema evolved: initial migration created base tables, second migration added missing columns to profiles and job_applications, plus created the jobs table.

Frontend uses `supabase` anon client (`lib/supabase.ts`). Server uses both anon and admin clients.

### Key Patterns

- Job data maps between DB snake_case and frontend camelCase via `lib/utils.ts` (`mapDbJobToFrontend`/`mapFrontendJobToDb`)
- Candidate name resolution: application snapshot fields → profile table fallback → email fallback
- HR evaluations stored in localStorage (`cg_hr_evaluations` key), not in Supabase
- `CandidatesPage.tsx` normalizes various status strings to `CandidateStage` enum via `normalizeStage()`
- Employees are mock data only (`constants.ts:MOCK_EMPLOYEES`)

### Dead Code

- `nginx.conf` — not used (Dockerfile runs Node, not nginx)
- `app.yaml` — App Engine config, not used (deployed to Cloud Run)
- `index.html` importmap entries — CDN imports for react/supabase/jszip that duplicate bundled dependencies
