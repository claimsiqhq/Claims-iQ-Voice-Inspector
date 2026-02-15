# Claims IQ Voice Inspector

## Overview

Claims IQ is a voice-driven property inspection platform for insurance field adjusters. It enables adjusters to conduct hands-free property inspections using an AI voice agent powered by OpenAI's Realtime API, while automatically generating Xactimate-compatible estimates, scope items, and export documents (PDF, ESX).

The core workflow is: **Document Upload → AI Parsing → Inspection Briefing → Voice Inspection → Review & Finalize → Export**

The platform targets iPad users in the field who need glanceable, voice-first interactions while documenting property damage for insurance claims.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework:** React 19 with TypeScript, bundled by Vite 7
- **Styling:** Tailwind CSS v4 with a custom Claims IQ brand system (Deep Purple #342A4F, Primary Purple #7763B7, Gold #C6A54E)
- **UI Components:** shadcn/ui (Radix-based) component library
- **Routing:** wouter (lightweight React router)
- **State Management:** TanStack React Query for server state
- **Animations:** Framer Motion
- **Charts:** Recharts
- **Fonts:** Work Sans (headings), Source Sans 3 (body), Space Mono (data/measurements)

### Backend
- **Runtime:** Node.js with Express 5
- **Language:** TypeScript, executed in dev via `tsx`
- **Entry point:** `server/index.ts` → routes defined in `server/routes.ts`
- **API pattern:** RESTful JSON endpoints under `/api/*`
- **Dev command:** `npm run dev` (runs `tsx server/index.ts`)

### Database
- **Host:** Supabase PostgreSQL (connection via `SUPABASE_DATABASE_URL` or `DATABASE_URL`)
- **ORM:** Drizzle ORM with type-safe schema definitions in `shared/schema.ts`
- **Migrations:** Drizzle Kit (`drizzle.config.ts` at project root, outputs to `./migrations/`)
- **Migration commands:** `npm run db:generate` (generate), `npm run db:migrate` (apply), `npm run db:push:force` (push directly)
- **Schema location:** `shared/schema.ts` — this is the single source of truth for all database tables

### Key Database Tables
The schema includes 15+ tables covering the full inspection lifecycle:
- `claims` — insurance claim records
- `documents` — uploaded PDFs with extracted text
- `extractions` — AI-parsed data from documents
- `briefings` — pre-inspection briefing data
- `inspectionSessions` — active voice inspection sessions
- `inspectionRooms` — rooms within an inspection
- `damageObservations` — damage findings per room
- `lineItems` — estimate line items with pricing
- `inspectionPhotos` — photos with AI analysis and annotations
- `voiceTranscripts` — voice conversation logs
- `scopeLineItems` — Xactimate-compatible pricing catalog (122+ items)
- `regionalPriceSets` — regional M/L/E pricing
- `roomOpenings` — doors, windows, wall deductions
- `roomAdjacencies` — which rooms share walls
- `userSettings` — per-user configuration

### Voice Inspection Engine (Core Feature)
- **Protocol:** Browser-to-OpenAI direct WebRTC connection (audio never touches the Express server)
- **Session creation:** Express server creates ephemeral tokens via OpenAI's `/v1/realtime/sessions` endpoint
- **Tool execution:** OpenAI sends function calls over WebRTC data channel → browser executes them by calling Express REST API → results sent back via data channel
- **System instructions:** Built dynamically in `server/realtime.ts` with claim context, briefing data, and 18+ tool definitions
- **Voice model:** OpenAI Realtime API with voice activity detection

### File Storage
- **Provider:** Supabase Storage
- **Buckets:** `claim-documents` (PDFs), `inspection-photos` (inspection photos)
- **Client:** `@supabase/supabase-js` used only for Storage operations; all database queries go through Drizzle ORM

### Estimate & Pricing Engine
- **Catalog:** 122+ Xactimate-compatible line items across 16 trades
- **Pricing:** Regional price sets with material/labor/equipment separation
- **Settlement:** RCV → O&P → Tax → Depreciation → ACV → Deductible → Net Claim pipeline
- **Export formats:** PDF (via `pdfkit`), ESX (Xactimate-compatible ZIP with XML)
- **Key modules:** `server/estimateEngine.ts`, `server/esxGenerator.ts`, `server/pdfGenerator.ts`

### Authentication
- **Provider:** Supabase Auth
- **Roles:** Adjuster, Supervisor, Admin
- **Middleware:** `server/auth.ts` handles token validation and role-based access control
- **Client:** Auth context in `client/src/contexts/AuthContext.tsx`

### Project Structure
```
client/              — React frontend (Vite)
  src/
    pages/           — Route-level page components
    components/      — Reusable UI components (including shadcn/ui)
    hooks/           — Custom React hooks
    lib/             — Utilities, query client, Supabase client
    contexts/        — React context providers (Auth)
server/              — Express backend
  index.ts           — Server entry point
  routes.ts          — All API route definitions (~51 endpoints)
  storage.ts         — IStorage interface and implementation
  db.ts              — Drizzle database connection
  supabase.ts        — Supabase client for Storage
  openai.ts          — GPT-4o document extraction
  realtime.ts        — Voice agent system instructions + tool definitions
  estimateEngine.ts  — Pricing calculations
  esxGenerator.ts    — Xactimate ESX export
  pdfGenerator.ts    — PDF report generation
shared/
  schema.ts          — Drizzle ORM schema (single source of truth)
docs/                — Design prompts and architecture docs
test/                — Vitest test suite
migrations/          — Drizzle Kit generated migrations
```

### Testing
- **Framework:** Vitest with `@vitest/coverage-v8`
- **Config:** `vitest.config.ts` at project root
- **Test location:** `test/` directory
- **Commands:** `npm test` (run), `npm run test:watch` (watch), `npm run test:coverage` (coverage)
- **Coverage targets:** `estimateEngine.ts`, `esxGenerator.ts`, `pdfGenerator.ts`

### Mobile (Secondary)
- **Framework:** Expo / React Native (in `packages/mobile`)
- **Status:** Early stage, workspace configured in `package.json`
- **Not the primary platform** — the main app is the web/iPad client

## External Dependencies

### Supabase (Critical)
- **PostgreSQL database** — all application data
- **Storage** — PDF documents and inspection photos
- **Auth** — user authentication and session management
- **Required env vars:** `SUPABASE_DATABASE_URL` (or `DATABASE_URL`), `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

### OpenAI (Critical)
- **GPT-4o** — document parsing and extraction (Act 1)
- **Realtime API** — voice inspection agent via WebRTC (Act 2)
- **Vision API** — photo analysis during inspections
- **Required env var:** `OPENAI_API_KEY`

### npm Dependencies (Key)
- `drizzle-orm` + `drizzle-kit` — database ORM and migration tooling
- `@supabase/supabase-js` — Supabase client (Storage + Auth)
- `express` v5 — HTTP server
- `pdfkit` — server-side PDF generation
- `pdf-parse` — PDF text extraction
- `zod` — runtime schema validation
- `postgres` — PostgreSQL driver for Drizzle

### Frontend Dependencies (via Vite)
- React 19, TanStack React Query, wouter, Framer Motion, Recharts
- Tailwind CSS v4, shadcn/ui (Radix), PostCSS + Autoprefixer