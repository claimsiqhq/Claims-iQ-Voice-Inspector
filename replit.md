# Claims IQ Voice Inspector

## Overview
Claims IQ Voice Inspector is an AI-powered voice-driven field inspection assistant for insurance adjusters. Its primary purpose is to streamline the insurance claims process by automating document analysis, guiding inspections via real-time voice AI, and facilitating report generation. This project aims to enhance accuracy, reduce manual effort, and accelerate claim processing for insurance companies and adjusters. Key capabilities include AI-powered document parsing, guided voice inspections, multi-structure inspection support, AI-enhanced photo capture and damage annotation, moisture reading logging, architectural property sketches, and comprehensive review-and-export functionalities (ESX/Xactimate, PDF, Photo Reports).

## User Preferences
- Professional insurance app styling
- Clean, minimal aesthetic
- Database must be Supabase only — never use local Replit PostgreSQL
- Never use execute_sql_tool for Supabase operations
- All schema changes via psql with SUPABASE_DATABASE_URL
- Use user's own `OPENAI_API_KEY` — not Replit AI Integrations key
- pdf-parse must stay at v1.1.1 (v2 has incompatible API)
- Claims must remain "in progress" until user explicitly marks them complete — no auto-completion on finishing inspection or voice agent complete_inspection tool
- Property sketches must look like real architectural drawings (floor plans, elevations, roof plans) — not abstract boxes

## System Architecture

### Tech Stack
- **Frontend:** React 19, Vite 7, TypeScript, Tailwind CSS v4, shadcn/ui, wouter, TanStack React Query, Framer Motion
- **Backend:** Express 5
- **Database:** Drizzle ORM with Supabase PostgreSQL (postgres.js driver)
- **File Storage:** Supabase Storage
- **AI:** OpenAI GPT-4o (document parsing, briefing, photo analysis), OpenAI Realtime API (voice inspection)
- **Voice:** Browser WebRTC for OpenAI Realtime API integration
- **PWA:** Vite PWA plugin with Workbox
- **Document Generation:** PDFKit, docx, archiver

### Core Features
- **Claims Management:** Creation, assignment, and status tracking of claims with user-explicit completion.
- **Document Processing:** AI-powered parsing of claim documents with batch support and confidence scoring.
- **Inspection Briefing:** AI-generated briefings for property details, coverage, and checklists.
- **Active Voice Inspection:** Real-time voice-guided inspections using OpenAI Realtime API, supporting various AI tools like `add_damage`, `capture_photo`, and `add_line_item`.
- **Multi-Structure Inspections:** Detailed exterior inspections, including roofs and elevations.
- **Property Sketch (FloorPlanSketch):** SVG architectural sketches for floor plans, roof plans, elevations, and other exterior elements, with responsive design and status color coding.
- **Review & Finalize:** Multi-tab review for estimate details, photos, completeness (AI scope gap detection), notes, and expanded sketches.
- **Export:** ESX/Xactimate XML, configurable PDF reports, Xactimate-style Photo Reports (PDF and Word), and "Submit for Review" workflow.
- **Supplemental Claims:** Management of supplemental line items with provenance tracking and delta ESX export.
- **Photo Reports:** Xactimate-style Photo Sheets with embedded photos, metadata, and AI analysis captions.

### Data Model
The system uses 12 PostgreSQL tables in Supabase for managing users, claims, inspection data, and pricing. Key tables include `claims`, `inspection_sessions`, `line_items`, and `inspection_photos`.

### Security Architecture
- **Authentication:** Supabase JWT tokens with cryptographic validation.
- **Authorization:** Role-based access control.
- **Rate Limiting:** Three-tiered rate limiting for general, auth, and AI API endpoints.
- **Error Handling:** Generic 500 error messages with server-side logging.

### UI/UX and Design System
Professional insurance app aesthetic with a primary purple and gold color scheme, Work Sans and Source Sans 3 fonts. Responsive design with mobile-specific UI elements. Features error boundaries, React Query configuration for data fetching, and an onboarding wizard.

## External Dependencies
- **Supabase:** PostgreSQL database and file storage (`claim-documents`, `inspection-photos` buckets).
- **OpenAI API:** GPT-4o for AI analysis and Realtime API (`gpt-4o-realtime-preview`) for voice interactions.
- **pdf-parse:** Version 1.1.1 for backend PDF text extraction.
- **PDFKit:** PDF report generation.
- **docx:** Word document (.docx) generation for photo reports.
- **archiver:** ZIP file creation for exports.
- **Drizzle ORM:** Database schema management and querying.
- **Framer Motion:** UI animations.
- **Vite PWA:** Progressive Web App features.
- **express-rate-limit:** API rate limiting.
- **recharts:** Dashboard charts.
- **pdfjs-dist:** Client-side PDF viewing.