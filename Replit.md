# Claims IQ Voice Inspector

## Overview
Claims IQ Voice Inspector is an AI-powered voice-driven field inspection assistant for insurance adjusters. It aims to streamline the insurance claims process by automating document analysis, guiding inspections, and facilitating report generation. The project's core purpose is to enhance accuracy, reduce manual effort, and accelerate claim processing, providing significant value to insurance companies and adjusters.

Key capabilities include: AI-powered document parsing of claim reports and policy forms, guided voice inspections using real-time AI, multi-structure inspection support, AI-enhanced photo capture and damage annotation, moisture reading logging, and comprehensive review-and-export functionalities (ESX/Xactimate, PDF).

## User Preferences
- Professional insurance app styling
- Clean, minimal aesthetic
- Database must be Supabase only — never use local Replit PostgreSQL
- Never use execute_sql_tool for Supabase operations
- All schema changes via psql with SUPABASE_DATABASE_URL
- Use user's own `OPENAI_API_KEY` — not Replit AI Integrations key
- pdf-parse must stay at v1.1.1 (v2 has incompatible API)

## System Architecture

### Tech Stack
- **Frontend:** React 19, Vite 7, TypeScript, Tailwind CSS v4, shadcn/ui, wouter, TanStack React Query, Framer Motion
- **Backend:** Express 5
- **Auth:** Supabase Auth with JWT token validation, role-based access control (adjuster/supervisor/admin)
- **Database:** Drizzle ORM with Supabase PostgreSQL (postgres.js driver)
- **File Storage:** Supabase Storage
- **AI:** OpenAI GPT-4o (document parsing, briefing, photo analysis), OpenAI Realtime API (voice inspection via WebRTC)
- **Voice:** Browser WebRTC for OpenAI Realtime API integration
- **PWA:** Vite PWA plugin with Workbox

### Project Structure
The project is organized into `client/` for the React frontend, `server/` for the Express backend, and `shared/` for common Drizzle schemas and types.

### Frontend Routes
The application features a multi-screen workflow with authentication:
- Login/Register (shown when unauthenticated)
- `/`: Claims List (filtered by role — supervisors see all, adjusters see assigned)
- `/dashboard`: Supervisor Dashboard (supervisor role only)
- `/documents`: Documents Hub
- `/settings`: Settings
- `/upload/:id`: Document Upload
- `/review/:id`: Extraction Review
- `/briefing/:id`: Inspection Briefing
- `/inspection/:id`: Active Voice Inspection
- `/inspection/:id/review`: Review & Finalize
- `/inspection/:id/export`: Export

### Authentication & Authorization
- **Supabase Auth:** Email/password authentication via Supabase Auth SDK
- **Role-Based Access Control (RBAC):** Three roles — `adjuster` (default), `supervisor`, `admin`
- **Auth Middleware (`server/auth.ts`):** JWT token validation by decoding Supabase JWT `sub` claim, role-checking middleware
- **Auth Context (`client/src/contexts/AuthContext.tsx`):** Global React context providing `useAuth()` hook with `signIn`, `signUp`, `signOut`, `refreshSession`, `isAuthenticated`, `user`, `role`, and `loading` state
- **User Sync:** On Supabase login, users are synced to the local `users` table via `POST /api/auth/sync`
- **Protected Routes:** All routes require authentication; supervisor dashboard requires `supervisor` or `admin` role
- **Claim Assignment:** Claims can be assigned to specific adjusters via `assigned_to` field; supervisors can assign claims via `POST /api/admin/claims/assign`
- **Inspector Tracking:** Inspection sessions track which inspector started them via `inspector_id` field

### Core Features
- **Claims Management:** Creation and status tracking of claims (draft to exported).
- **Document Processing:** Upload and AI-powered parsing of FNOLs, policies, and endorsements with batch support.
- **AI Confidence Scoring:** Visual indicators for AI extraction confidence (high/medium/low).
- **Inspection Briefing:** AI-generated briefings covering property, coverage, peril, and inspection checklists.
- **Active Voice Inspection:** A three-panel interface for voice-guided inspections using OpenAI Realtime API, featuring floor plans, real-time transcription, and a photo gallery. Voice AI tools facilitate actions like setting context, creating rooms, adding damages, capturing photos, and logging moisture readings. The `add_line_item` tool supports `catalogCode` for automatic Xactimate pricing lookup.
- **Multi-Structure Inspections:** Support for detailed exterior inspections of multiple structures, including roof slopes and elevations, aligned with Xactimate patterns.
- **Review & Finalize:** A comprehensive review stage with tabs for estimate details (including Material/Labor/Equipment breakdown and O&P eligibility display), photos, completeness checks with AI scope gap detection, and notes.
- **Export:** Options for ESX/Xactimate XML, PDF report generation, and a "Submit for Review" workflow.

### Data Model
The system uses 14 PostgreSQL tables in Supabase, structured around core claim data, document processing, detailed inspection sessions, rooms, damages, line items, photos, moisture readings, and a pricing catalog. Key schema extensions:
- **users table:** Extended with `email`, `full_name`, `role` (adjuster/supervisor/admin), `supabase_auth_id`, `last_login_at`, `is_active`
- **claims table:** Added `assigned_to` (FK to users) for claim assignment
- **inspection_sessions table:** Added `inspector_id` (FK to users) to track who runs inspections

The two catalog tables are:
- **scope_line_items:** ~100 Xactimate-compatible catalog items across 14 trades (MIT, DEM, DRY, PNT, FLR, INS, CAR, CAB, CTR, RFG, WIN, EXT, ELE, PLM) with codes, units, waste factors, and companion rules.
- **regional_price_sets:** Regional pricing with separate material/labor/equipment cost breakdown per catalog item (currently US_NATIONAL region).

### Xactimate Pricing Engine (`server/estimateEngine.ts`)
A dedicated pricing engine provides:
- Catalog lookup by code and regional price retrieval
- Line item price calculation: `unitPrice = (Material + Labor + Equipment) x (1 + wasteFactor%)`
- Estimate totals with material/labor/equipment subtotals, tax (default 8%), and waste tracking
- Overhead & Profit (O&P) eligibility: 10% overhead + 10% profit when 3+ trades are involved
- Estimate validation for scope gaps (missing companion items, duplicate detection)
- Companion item suggestions (e.g., underlayment with roofing, house wrap with siding)

### Seed Catalog (`server/seed-catalog.ts`)
Seed data for ~100 line items with realistic Verisk-style pricing. Seeded via `POST /api/pricing/seed`.

### API Endpoints
Approximately 55 RESTful endpoints manage the workflow, grouped into Auth, Admin, Document Flow, Inspection, Pricing Catalog, and Review/Export phases.

**Auth & Admin endpoints:**
- `POST /api/auth/sync` — Sync Supabase user to local DB (creates or updates)
- `GET /api/auth/me` — Get current user profile (requires auth)
- `GET /api/admin/users` — List team members (supervisor/admin only)
- `POST /api/admin/claims/assign` — Assign claim to adjuster (supervisor/admin only)
- `GET /api/admin/dashboard` — Team metrics (supervisor/admin only)
- `GET /api/admin/active-sessions` — Active inspections overview (supervisor/admin only)

**Pricing endpoints include:**
- `GET /api/pricing/catalog` — Full catalog listing
- `GET /api/pricing/catalog/search?q=` — Search catalog by code or description
- `GET /api/pricing/catalog/:tradeCode` — Items by trade
- `POST /api/pricing/scope` — Price a list of items with regional pricing, returns M/L/E breakdown and totals
- `POST /api/pricing/validate` — Validate an estimate for scope gaps
- `GET /api/pricing/regions` — Available pricing regions
- `POST /api/pricing/seed` — Seed the catalog (idempotent)

### UI/UX and Design System
The UI/UX emphasizes a professional insurance app aesthetic using Primary Purple, Deep Purple, and Gold color schemes, Work Sans and Source Sans 3 fonts. Responsive design is implemented using a `useIsMobile` hook, adapting layouts for mobile devices with sheet drawers, icon-only navigation, and scaled elements. Visual indicators are used for voice states (listening, speaking, processing, error, disconnected).

### Error Recovery
The system includes mechanisms for voice disconnection auto-reconnect, error state auto-clearing, export validation, photo upload failure guards, and filename sanitization.

### Environment Variables
- `VITE_SUPABASE_URL` — Supabase project URL (frontend, used for Auth SDK)
- `VITE_SUPABASE_ANON_KEY` — Supabase anonymous key (frontend, used for Auth SDK)
- `OPENAI_API_KEY` — OpenAI API key (backend)
- `SUPABASE_DATABASE_URL` — Supabase PostgreSQL connection URL (backend)

## External Dependencies
- **Supabase:** Used for PostgreSQL database, file storage (`claim-documents`, `inspection-photos` buckets), and user authentication (Supabase Auth).
- **OpenAI API:** Utilized for GPT-4o capabilities (document parsing, briefing, photo analysis) and the Realtime API for voice interactions (`gpt-4o-realtime-preview`).
- **pdf-parse:** Version 1.1.1 is used on the backend for PDF text extraction.
- **Drizzle ORM:** Employed for database schema management and querying.
- **Framer Motion:** Used for UI animations and transitions.
- **Vite PWA:** Provides Progressive Web App features, including offline caching.