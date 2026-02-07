# Claims IQ Voice Inspector

## Overview
Voice-driven field inspection assistant for insurance adjusters. Supports document upload, AI-powered document parsing (FNOL, Policy, Endorsements), extraction review, inspection briefing generation, and voice-guided active inspections with OpenAI Realtime API.

## Important Notes
- **Database is Supabase PostgreSQL only** — never use local Replit database or execute_sql_tool. All schema changes must target Supabase via psql with SUPABASE_DATABASE_URL.
- `drizzle.config.ts` uses DATABASE_URL (local) — do NOT use `npm run db:push` as it targets the wrong database. Create tables directly in Supabase via psql.

## Recent Changes
- **Feb 7, 2026**: Implemented Voice Inspection Engine (Act 2) — 7 new inspection tables (inspection_sessions, inspection_rooms, damage_observations, line_items, inspection_photos, moisture_readings, voice_transcripts), full storage layer, REST API for all inspection operations, OpenAI Realtime API integration via WebRTC, ActiveInspection.tsx rewritten with live voice connection, tool call execution, transcript display, camera capture, and three-panel inspection layout.
- **Feb 7, 2026**: Migrated data layer to Supabase — database now hosted on Supabase PostgreSQL (via SUPABASE_DATABASE_URL), file storage uses Supabase Storage bucket `claim-documents`. Removed multer, switched to base64 JSON uploads. DB driver changed from @neondatabase/serverless to postgres.js.
- **Feb 7, 2026**: Implemented Act 1 backend - database schema, storage layer, OpenAI document parsing (FNOL/Policy/Endorsements), briefing generation, full REST API, and wired all frontend pages to real API endpoints.

## Architecture

### Tech Stack
- **Frontend:** React 19, Vite 7, TypeScript, Tailwind CSS v4, shadcn/ui, wouter routing, TanStack React Query, Framer Motion
- **Backend:** Express 5, pdf-parse (PDF text extraction), @supabase/supabase-js (Storage)
- **Database:** Drizzle ORM + Supabase PostgreSQL (via postgres.js driver)
- **File Storage:** Supabase Storage buckets `claim-documents` (PDFs) and `inspection-photos` (images)
- **AI:** OpenAI GPT-4o via Replit AI Integrations for document parsing; OpenAI Realtime API (gpt-4o-realtime-preview) for voice inspection via WebRTC
- **Voice:** Browser WebRTC PeerConnection + DataChannel → OpenAI Realtime API. Ephemeral key pattern (server creates session, browser connects directly).

### Environment Variables
- `SUPABASE_DATABASE_URL` - Supabase PostgreSQL connection string (preferred over DATABASE_URL)
- `SUPABASE_URL` - Supabase project URL (https://xxx.supabase.co)
- `SUPABASE_SERVICE_ROLE_KEY` - Server-side Supabase key (bypasses RLS)
- `SUPABASE_ANON_KEY` - Public Supabase key
- `AI_INTEGRATIONS_OPENAI_API_KEY` - OpenAI API key (used for both chat completions and Realtime sessions)

### Key Files
- `shared/schema.ts` - Database schema (claims, documents, extractions, briefings + 7 inspection tables)
- `server/db.ts` - Database connection (postgres.js + Drizzle)
- `server/supabase.ts` - Supabase client for Storage operations + bucket init
- `server/storage.ts` - DatabaseStorage class (Drizzle CRUD for all tables)
- `server/openai.ts` - OpenAI extraction & briefing generation functions
- `server/realtime.ts` - OpenAI Realtime API system instructions builder + 10 tool definitions
- `server/routes.ts` - REST API endpoints (Act 1 + inspection + realtime)
- `client/src/pages/ActiveInspection.tsx` - Voice inspection UI with WebRTC, tool execution, camera capture
- `client/src/pages/` - 5 main screens (ClaimsList, DocumentUpload, ExtractionReview, InspectionBriefing, ActiveInspection)

### API Endpoints — Act 1
- `GET/POST /api/claims` - List/create claims
- `GET/PATCH /api/claims/:id` - Get/update claim
- `POST /api/claims/:id/documents/upload` - Upload PDF (base64 JSON body)
- `POST /api/claims/:id/documents/:type/parse` - Parse document with AI
- `GET /api/claims/:id/extractions` - Get all extractions
- `PUT /api/claims/:id/extractions/:type` - Update extraction
- `POST /api/claims/:id/extractions/confirm-all` - Confirm all extractions
- `POST /api/claims/:id/briefing/generate` - Generate inspection briefing
- `GET /api/claims/:id/briefing` - Get briefing

### API Endpoints — Act 2 (Inspection)
- `POST /api/claims/:id/inspection/start` - Start inspection session
- `GET/PATCH /api/inspection/:sessionId` - Get/update session state
- `POST /api/inspection/:sessionId/complete` - Complete inspection
- `POST/GET /api/inspection/:sessionId/rooms` - Create/list rooms
- `PATCH /api/inspection/:sessionId/rooms/:roomId` - Update room status
- `POST /api/inspection/:sessionId/rooms/:roomId/complete` - Complete room
- `POST/GET /api/inspection/:sessionId/damages` - Create/list damage observations
- `POST/GET /api/inspection/:sessionId/line-items` - Create/list line items
- `GET /api/inspection/:sessionId/estimate-summary` - Running estimate totals
- `PATCH/DELETE /api/inspection/:sessionId/line-items/:id` - Update/delete line item
- `POST/GET /api/inspection/:sessionId/photos` - Upload/list photos
- `POST/GET /api/inspection/:sessionId/moisture` - Create/list moisture readings
- `POST/GET /api/inspection/:sessionId/transcript` - Append/get voice transcript
- `POST /api/realtime/session` - Create OpenAI Realtime ephemeral session for WebRTC

### Design System
- Primary: #342A4F (purple), Secondary: #C6A54E (gold)
- Fonts: Work Sans (display), Source Sans 3 (body), Space Mono (mono)

## User Preferences
- Professional insurance app styling
- Clean, minimal aesthetic
- Database must be Supabase only — never use local Replit PostgreSQL
