# Base44 Dev Environment

## Overview
ZF Operativa Ostrov — a shift management tool for the PICK department at ZF Aftermarket Ostrov.
Single-service Vite + React + Express app. The Express server (`server.ts`) runs Vite in middleware mode for dev.

## Architecture
- **Frontend**: React 19 + Vite 6 + Tailwind CSS 4 (via `@tailwindcss/vite`)
- **Backend**: Express server (`server.ts`) using `tsx` for dev, serves Vite middleware
- **Data**: localStorage for local persistence; optional Firebase Firestore sync (public config in `firebase-applet-config.json`, no secret needed)
- **AI**: Google Gemini API for OCR extraction of operators from shift photos (optional — text-input fallback when key absent)
- **Auth**: Firebase Auth with Google sign-in popup (for Firestore sync and Google Drive features)

## Running
```bash
docker compose -f docker-compose.base44.yml up -d
```
- App listens on port 3000
- Health check: `GET /api/health` → `{"status":"ok","hasGeminiKey":true|false}`
- Dev server serves live source (Vite middleware mode) — edits hot-reload automatically

## Secrets
- `GEMINI_API_KEY` — Google Gemini API key for OCR. Optional for boot; app has text-input fallback. Get from Google AI Studio (aistudio.google.com). A development placeholder is generated automatically; replace with a real key for OCR to work.

## Key Files
- `server.ts` — Express + Vite middleware server, Gemini OCR endpoint (`POST /api/extract-operators`)
- `src/App.tsx` — main app component
- `src/services/firebase.ts` — Firebase init (Firestore + Auth)
- `src/services/firestoreSync.ts` — real-time Firestore sync for operators/history/templates/departments
- `src/utils/storage.ts` — localStorage persistence layer
- `firebase-applet-config.json` — public Firebase config (projectId, apiKey, etc.)

## Notes
- The project uses `bun.lock` but runs via `npm install` + `npx tsx server.ts` in the Base44 compose (node:22-slim image)
- `vite.config.ts` disables HMR when `DISABLE_HMR=true` (AI Studio convention); Base44 leaves HMR enabled for live reload
- Firebase config is public/client-side (no server-side Firebase credentials needed)
- The app is in Czech language
