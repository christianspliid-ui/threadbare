# External Integrations

**Analysis Date:** 2026-03-30

## APIs & External Services

**Text-to-Speech (TTS):**
- Kokoro TTS (local server) - Speech synthesis for game narration
  - SDK/Client: `kokoro-js` 1.2.1 npm package
  - Server endpoint: `http://localhost:3001/api/tts` (localhost development only)
  - Implementation: `src/services/narration/NarrationService.ts` wraps Kokoro client with AudioContext fallback
  - Feature flag: `NARRATION_ENABLED` in `src/services/narration/narrationConstants.ts`
  - Status: Feature-complete but optional (graceful degradation if server unavailable)
  - Usage: `src/components/Game/HexChronicle.tsx` renders narration button for chronicle entries

**Image Generation (Offline Dev Tool):**
- Google Gemini API (Imagen) - Hex tile terrain art generation
  - SDK/Client: Direct HTTP calls in Python
  - Auth: `NANOBANANANA_API_KEY` env var (optional, dev tool only)
  - Reference: `https://aistudio.google.com/apikey`
  - Implementation: `scripts/generate-hex-tile.py` (offline utility, not in runtime)
  - Scope: Development asset pipeline only, not called from browser

## Data Storage

**Databases:**
- None — fully client-side single-page application

**File Storage:**
- Local filesystem only
  - Public assets: `public/hex-tiles/` (pre-generated hex tile images)
  - Audio files: `public/audio/` (theme music, ambient sounds)
  - Portraits: `public/portraits/` (character art)
  - Models: `public/models/` (3D GLB files for HexMapV2)

**Caching:**
- Browser localStorage (no server-side session)
  - Theme music mute state: `localStorage.getItem(THEME_MUTE_STORAGE_KEY)` in `src/audio/themeAudio.ts`
  - Notification preferences: `localStorage.getItem(NOTIFICATION_PREFS_STORAGE_KEY)` in `src/components/Game/hooks/useNotificationPreferences.ts`
  - Fog-of-war default: `localStorage.getItem(FOG_DEFAULT_STORAGE_KEY)` in `src/components/StartPage/SettingsModal.tsx`
  - Implementation: Best-effort persistence, graceful fallback to defaults if unavailable

**Game State:**
- In-memory only (no persistence)
  - Managed via React hooks in `src/components/Game/GameView.tsx`
  - Initialized via `initializeGameState()` from `src/engine/gameInit.ts`
  - Serializable for CLI exports but not persisted to storage

## Authentication & Identity

**Auth Provider:**
- None — no user accounts or login system
- Game is anonymous, single-player, stateless

## Monitoring & Observability

**Error Tracking:**
- None — local error handling only

**Logs:**
- Browser console (development)
- Debug bridge: `window.__DEBUG` (dev-only API, tree-shaken in production)
  - Location: `src/debug-bridge.ts` and `src/debug-bridge.d.ts`
  - Exports: Tracing API, health reports, encounter log exports, diagnostics
  - CLI: `npm run cli` for headless game state inspection

**Tracing:**
- Engine-level trace system (`src/engine/trace.ts`)
  - Captured during tick loop for causal event inspection
  - Accessible via debug panel (DebugPanel.tsx) or CLI `traces` command

## CI/CD & Deployment

**Hosting:**
- Vercel (static SPA hosting)

**CI Pipeline:**
- None configured in codebase — relies on Vercel git integration
- Build command: `vite build` (defined in `vercel.json`)
- Auto-deployed on push to `main` branch

**Pre-Commit Verification:**
- Local checks (defined in CLAUDE.md):
  1. `npm test` — all tests pass
  2. `npx tsc --noEmit` — type check clean
  3. `npx vite build` — production build succeeds

## Environment Configuration

**Required env vars:**
- `NANOBANANANA_API_KEY` (optional, dev tool only) - Google Gemini API key for hex tile generation

**Optional env vars:**
- `.env` file present (not read here — contains configuration, not code)
- `.env.local` file present (local dev overrides, not committed)

**Secrets location:**
- `.env` file (contains non-secret configuration)
- `.env.local` file (local dev secrets, gitignored)
- No committed secrets in repository

## Webhooks & Callbacks

**Incoming:**
- None

**Outgoing:**
- None

## Browser APIs

**Used:**
- Web Audio API - Theme music playback and TTS audio synthesis
  - Requires user gesture (interaction) to enable due to autoplay policy
  - Managed via `ensureAudioContext()` in `src/services/narration/NarrationService.ts`
- WebGL/Canvas API - Three.js hex map rendering in `src/components/HexMapV2/HexMapV2.tsx`
- localStorage - Light-weight client-side preferences persistence
- Web Workers - (Potential) Narration generation in separate thread via `src/services/narration/NarrationWorker.ts`

## Development Server Integration

**Local Services:**
- Vite dev server: `http://localhost:5173` (via `npm run dev`)
- TTS server: `http://localhost:3001/api/tts` (optional, started separately)
- Playwright MCP integration: `.playwright-mcp/` for preview/screenshot verification

## Asset Pipeline

**Image Generation:**
- Python script: `scripts/generate-hex-tile.py`
  - Generates hex terrain tiles via Gemini API + Pillow masking
  - Commands: `npm run generate-hex` (single), `npm run generate-hex:batch` (all), `npm run generate-hex:audit`
  - Output: `public/hex-tiles/`

**Image Processing:**
- Sharp (Node.js): `scripts/resize-hex-tiles.ts` for batch tile resizing

**3D Models:**
- Blender → GLB export pipeline (wired via MCP `blender-to-hexmap` skill)
- Output: `public/models/` (imported in HexMapV2)

## Content Delivery

**Static Assets:**
- `public/` directory served by Vite dev server and Vercel
- Hex tile images pre-generated and committed
- Audio files (theme, ambient) included
- No CDN required — all assets co-located

---

*Integration audit: 2026-03-30*
