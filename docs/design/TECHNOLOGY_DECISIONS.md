# Technology Decisions

**Status:** Working baseline based on the application audit; final decisions require repository inspection and team approval.

## Observed application baseline

The Copilot Stage 1 report describes an existing TypeScript application with React-style frontend source and Vite build tooling. The exact backend framework, runtime versions and package scripts must be confirmed from the actual application `package.json` and source before being recorded as final. The current workspace could not run TypeScript or production-build checks because dependencies were not installed.

The audit reports that the active runtime uses an in-memory store. PostgreSQL is the intended persistent database but is not yet connected to the running application. This is a production blocker, not a completed integration.

## Current technology direction

| Area | Current direction | Status |
|---|---|---|
| Frontend | Preserve the existing React + TypeScript application | Reported by audit; verify source and dependencies |
| Build tooling | Vite | Reported by audit; build not verified in this workspace |
| Backend | Existing TypeScript server | Framework/runtime details require source inspection |
| Database | PostgreSQL | Required target; not connected to active runtime |
| File storage | Persistent server-side storage | Path, permissions and backup strategy to be confirmed |
| API | Versioned REST/JSON under `/api/v1/` | Required design target; contract review pending |
| PWA | Manifest, service worker and secure HTTPS origin | App shell reported; full offline sync missing |
| Hosting | Linux VPS, registered domain and HTTPS | Provider/cost/deployment not yet verified |
| Collaboration | GitHub Issues, branches and reviewed pull requests | Existing team workflow |

## Engineering decisions and rationale

- Keep one React frontend and one backend API. Do not create a second frontend or migrate frameworks without an approved engineering reason.
- Use PostgreSQL as the central authoritative store for all clients. Do not use an in-memory fallback for production data.
- Keep uploaded files in persistent storage and protect every download route with server-side authorization.
- Treat desktop and Android installed PWAs as clients of the same API and database, not independent applications with separate data stores.
- Treat offline data as a restricted local cache. Queued mutations need authorization re-checks, idempotency, retries and conflict handling when synchronized.
- Keep secrets in environment configuration, never in source control or frontend bundles.

## Decisions still required

1. Confirm the exact backend framework, Node.js version and package scripts from the application source.
2. Review PostgreSQL schema, migration tool and every runtime query before enabling the database.
3. Confirm persistent file storage, upload limits and backup/restore process.
4. Confirm authentication/token lifecycle and role/permission matrix.
5. Select hosting provider, capacity, cost, monitoring and backup retention.
6. Define offline data eligibility, cache expiry, queued actions and conflict resolution.
7. Confirm AI provider/model, privacy handling, API budget and fallback behavior.

Do not describe a proposed technology as implemented until the repository and running system provide evidence.
