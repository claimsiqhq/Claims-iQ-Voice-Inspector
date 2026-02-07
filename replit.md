# Claims IQ Voice Inspector

## Overview
Claims IQ Voice Inspector is a voice-driven field inspection assistant designed for insurance adjusters. Its primary purpose is to streamline the insurance claims process by providing AI-powered tools for document analysis, inspection guidance, and report generation. The project aims to reduce manual effort, improve accuracy, and accelerate claim processing for insurance companies and adjusters. Key capabilities include document upload and AI parsing (FNOL, Policy, Endorsements), extraction review, inspection briefing generation, voice-guided active inspections using OpenAI's Realtime API, and a comprehensive review-and-finalize workflow with export options (ESX, PDF, Submit for Review).

## User Preferences
- Professional insurance app styling
- Clean, minimal aesthetic
- Database must be Supabase only — never use local Replit PostgreSQL
- Never use execute_sql_tool for Supabase operations
- All schema changes via psql with SUPABASE_DATABASE_URL
- Use user's own `OPENAI_API_KEY` — not Replit AI Integrations key

## System Architecture

### Tech Stack
- **Frontend:** React 19, Vite 7, TypeScript, Tailwind CSS v4, shadcn/ui, wouter, TanStack React Query, Framer Motion
- **Backend:** Express 5, pdf-parse, @supabase/supabase-js
- **Database:** Drizzle ORM with Supabase PostgreSQL (postgres.js driver)
- **File Storage:** Supabase Storage (claim-documents, inspection-photos buckets)
- **AI:** OpenAI GPT-4o for document parsing and briefing; OpenAI Realtime API for voice inspection via WebRTC
- **Voice:** Browser WebRTC PeerConnection + DataChannel for OpenAI Realtime API integration.

### Core Features
The application supports a comprehensive workflow:
1.  **Claims Management:** List and create claims.
2.  **Document Processing:** Upload and AI-parse FNOL, Policy, and Endorsement PDFs. Review and confirm extracted data.
3.  **Inspection Briefing:** AI-generated briefings based on parsed documents.
4.  **Active Voice Inspection:** Live voice-guided inspections using OpenAI Realtime API, enabling creation of rooms, damages, line items, photo capture, and moisture readings. Features a three-panel layout and robust voice indicator with various states.
5.  **Review & Finalize:** A dedicated page (Screen 7) with four tabs:
    *   **Estimate:** Collapsible hierarchy with inline editing.
    *   **Photos:** Gallery grouped by room with filters.
    *   **Completeness:** Circular score with AI scope gap detection.
    *   **Notes:** Adjuster notes and voice transcript viewer. Includes a slide-over `ProgressMap` for navigation and status overview, and a `MoistureMap` for SVG-based moisture reading visualization, IICRC classification, and drying equipment calculation.
6.  **Export:** Supports ESX/Xactimate export, PDF report generation, and a "Submit for Review" workflow with status tracking.

### Data Model
The system uses 12 PostgreSQL tables in Supabase, structured into two main acts:
-   **Act 1 (Core):** `users`, `claims`, `documents`, `extractions`, `briefings`
-   **Act 2 (Inspection):** `inspection_sessions`, `inspection_rooms`, `damage_observations`, `line_items`, `inspection_photos`, `moisture_readings`, `voice_transcripts`

### API Design
A RESTful API supports all application functionalities, covering Act 1 (document flow), Act 2 (inspection), and Act 3 (review/export), including endpoints for OpenAI Realtime session management.

### UI/UX and Design System
-   **Colors:** Primary Purple (`#7763B7`), Deep Purple (`#342A4F`), Gold (`#C6A54E`), Secondary Purple (`#9D8BBF`).
-   **Fonts:** Work Sans (headings), Source Sans 3 (body), Space Mono (monospace).
-   **Radius:** 0.5rem default.
-   **Voice States:** Visual indicators for listening (Purple), speaking (Gold), processing (Secondary Purple), error (Gold warning), and disconnected (Red).

### Error Recovery
The system includes mechanisms for voice disconnection auto-reconnect, manual reconnect options, error state auto-clearing, and export validation to prevent incomplete exports.

## External Dependencies
-   **Supabase:** PostgreSQL database and Storage buckets (`claim-documents`, `inspection-photos`).
-   **OpenAI API:** GPT-4o for document parsing, briefing generation, and Realtime API for voice interactions (`gpt-4o-realtime-preview`).
-   **pdf-parse:** For extracting text from PDF documents on the backend.