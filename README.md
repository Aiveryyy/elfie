# Elfie

Elfie is a minimalist, local-first, privacy-first state logging app.

It is designed to feel calm, light, and deliberate: a reflective logging tool first, with optional AI support second. Core logging, history, patterns, settings, and export/import all work without sign-in and without a cloud database.

## What v1 includes

- Dashboard
- Log State wizard
- History grouped by date
- Patterns view with descriptive summaries
- JSON / CSV / Markdown / Notion-friendly Markdown exports
- Full backup export and restore
- Local settings
- Optional AI reflections through a server-only OpenAI route

## Stack

- Next.js 16 App Router
- TypeScript with strict mode
- Tailwind CSS v4
- shadcn/ui-style local primitives
- Zustand for lightweight wizard state
- Dexie + IndexedDB for local persistence
- Zod for schemas and import validation
- OpenAI official JavaScript SDK with the Responses API on the server only
- Vitest for unit tests
- Playwright for the critical browser flow
- ESLint + Prettier

## Local setup

1. Install Node.js 20.9+.
2. Install dependencies:

```bash
npm install
```

3. Create an env file:

```bash
cp .env.example .env.local
```

4. Start the app:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000).

## Environment variables

`OPENAI_API_KEY`
- Optional.
- Enables server-side AI reflections.
- If missing, Elfie keeps all non-AI features fully usable and shows a clean unavailable state instead of breaking.

`OPENAI_MODEL_LIGHT`
- Optional.
- Defaults to `gpt-5.4-mini`.
- Used for brief reflection and tiny next-move actions.

`OPENAI_MODEL_PATTERN`
- Optional.
- Defaults to `OPENAI_MODEL_LIGHT`.
- Used for pattern naming.

`OPENAI_MODEL_DEEP`
- Optional.
- Defaults to `gpt-5.4`.
- Used for deeper descriptive analysis.

`AUTH_SECRET` / `NEXTAUTH_SECRET`
- Required for Google sign-in.
- Use a long random value and keep it server-only.

`AUTH_URL` / `NEXTAUTH_URL`
- Required for production Google sign-in callback URLs.
- Use your deployed origin, for example `https://example.com`.

`GOOGLE_CLIENT_ID`
`GOOGLE_CLIENT_SECRET`
- Required for optional Google sign-in and Drive sync.
- The Google OAuth client must allow the app callback URL and Drive app-data scope.

## How local-first storage works

- Logs are stored in IndexedDB through Dexie.
- Settings are stored locally in the same database.
- Optional Google Drive sync stores a versioned Elfie backup in the account's hidden Drive app data folder.
- Each log saves both:
  - structured JSON
  - the canonical string line

Canonical format:

```text
YYYY-MM-DD | Log N | E:x | T:xxx | A:xxx | M:xxx | D:xxx | B:xxx
```

Rules:

- numbering resets each local day
- the first log of a day is `Log 1`
- raw values are preserved as entered
- omitted body signal is stored as `B:none`

## Export and restore

Elfie supports:

- JSON export
- CSV export
- Markdown export
- Notion-friendly Markdown export
- Full backup export

Only the full backup format is restorable in v1.

Backup shape:

```json
{
  "app": "elfie",
  "version": 1,
  "exportedAt": "ISO timestamp",
  "settings": {
    "accentTheme": "lavender",
    "reducedMotion": false,
    "defaultExportFormat": "backup",
    "aiEnabled": false,
    "updatedAt": "ISO timestamp"
  },
  "logs": []
}
```

Restore validation checks:

- schema version
- malformed JSON
- duplicate log ids
- broken daily numbering
- canonical line mismatches
- energy raw/value mismatches

Restore replaces the full local dataset in v1. Merge import is intentionally out of scope.

## AI wiring

AI is optional and server-only.

Route:

- `POST /api/ai/insight`

Supported modes:

- `reflect`
- `pattern`
- `tiny-next-move`

The route:

- validates input with Zod
- uses the OpenAI Responses API structured output path
- returns a compact JSON response
- never exposes API keys to the client

The prompt and schema deliberately constrain tone:

- no diagnosis
- no therapist framing
- no manipulative motivation
- no exaggerated certainty

## Scripts

```bash
npm run dev
npm run lint
npm run test
npm run test:e2e
npm run build
```

## Verification

Verified during implementation:

- `npm run lint`
- `npm run test` in WSL
- `npm run build` in WSL
- `npm run test:e2e`

WSL was used for unit/build verification because Vite and Next optional native packages behaved more reliably there during setup.

## Tradeoffs in v1

- Light-only theme to keep the visual system restrained.
- Restore is replace-only, not merge-aware.
- Patterns are descriptive summaries instead of charts or predictive analysis.
- AI is dashboard-triggered and intentionally narrow in scope.
- IndexedDB keeps the product private and simple, but it also means no sync across devices in v1.

## Future roadmap

- Safer cross-device sync with explicit user control
- Merge-aware restore and conflict handling
- Better long-history virtualization and richer filters
- More refined pattern language for longer datasets
- Optional saved AI prompts per mode
- Share/export templates for specific external workflows

## Project structure

```text
app/
components/
db/
features/
hooks/
lib/
tests/
types/
```

## Notes

- The app is intentionally small in surface area and avoids auth, billing, analytics, cloud sync, and server-side state management.
- If you want to move this build into a separate WSL folder later, the app is already self-contained and can be copied as a normal Next.js project.
