# Technology Stack

**Analysis Date:** 2026-03-30

## Languages

**Primary:**
- TypeScript ~5.9.3 - Type-safe implementation of all runtime code and build scripts
- JavaScript (ES2020) - Runtime environment targeting browser ES2020 spec

**Secondary:**
- Python 3.x - Hex tile asset generation and offline development tools (in `scripts/`)

## Runtime

**Environment:**
- Node.js 22+ (specified in CLAUDE.md "Prerequisites")

**Package Manager:**
- npm 10+ (specified in CLAUDE.md "Prerequisites")
- Lockfile: `package-lock.json` present

## Frameworks

**Core:**
- React 19.2.0 - UI framework for game views and components
- Vite 7.3.1 - Build tool and dev server with hot reload (` npm run dev`)

**Styling:**
- Tailwind CSS 4.2.1 - Utility-first CSS framework
- @tailwindcss/vite 4.2.1 - Vite integration for Tailwind (via `vite.config.ts`)

**Testing:**
- Vitest 4.0.18 - TypeScript-native test runner
- @testing-library/react 16.3.2 - React component testing utilities
- @testing-library/jest-dom 6.9.1 - DOM matchers for assertions
- jsdom 28.1.0 - Node.js DOM environment for component tests

**Build/Dev:**
- @vitejs/plugin-react 5.1.1 - React Fast Refresh for hot reload
- TypeScript compiler - Type checking via `npm run typecheck`
- ESLint 9.39.1 with TypeScript support - Linting and code quality
- eslint-plugin-react-hooks - React hooks rules enforcement
- eslint-plugin-react-refresh - React Fast Refresh validation

## Graphics & 3D

**WebGL/3D Rendering:**
- Three.js 0.183.2 - 3D graphics library for hex map (HexMapV2)
  - Location: `src/components/HexMapV2/` - Canvas-based InstancedMesh rendering
  - No React Three Fiber (R3F) — raw Three.js with direct canvas ref and custom render loop
  - Uses CanvasTexture for agent portraits and activity icons (`src/components/HexMapV2/agents/`)

**D3 Integration:**
- d3 7.9.0 - Geometric utilities for hex math and zoom/pan transforms
- @types/d3 7.4.3 - Type definitions

**Graphics Utilities:**
- sharp 0.34.5 - Image processing for hex tile resizing (`scripts/resize-hex-tiles.ts`)
- Pillow (Python) - Image masking and clipping for hex tile generation (`scripts/generate-hex-tile.py`)

## Key Dependencies

**Critical:**
- kokoro-js 1.2.1 - JavaScript client for Kokoro TTS (text-to-speech narration)
  - Connects to local TTS server at `http://localhost:3001/api/tts` (defined in `src/services/narration/narrationConstants.ts`)
  - Server: `tts-server.py` (in project root, started separately for dev)
  - Status: Feature flagged via `NARRATION_ENABLED` constant

**Procedural Generation:**
- simplex-noise 4.0.3 - Perlin noise for terrain generation in world gen pipeline
- custom kokoro-js - Integrated TTS client for narration system

**Accessibility:**
- lucide-react 0.577.0 - Icon library for UI controls

## Configuration

**Environment:**
- Environment variables configured via `.env` file (note: secrets file present, not read here)
- Single `NANOBANANANA_API_KEY` required for offline hex tile generation (Google Gemini API)
  - Only used by `scripts/generate-hex-tile.py` — development tool only, not in runtime
  - Example provided in `.env.example`
- `import.meta.env.DEV` used for dev-only features (debug bridge, validation)

**Build:**
- `vite.config.ts` - Vite configuration with React plugin, Tailwind CSS plugin, and custom constant-writer plugin
- `tsconfig.json` - Composite TypeScript config referencing `tsconfig.app.json` and `tsconfig.node.json`
- `eslint.config.js` - Flat ESLint config with React and TypeScript rules
- `vercel.json` - Production build command: `vite build`
- `vitest.config.ts` and `vitest.config.isolated.ts` - Test runner configuration (node environment with jsdom available)

**Development Scripts:**
- `npm run dev` - Start Vite dev server with hot reload (default port 5173)
- `npm run build` - Type-check + production build (outputs to `dist/`)
- `npm run typecheck` - TypeScript type checking only
- `npm run lint` - ESLint validation
- `npm test` - Run all tests once
- `npm run test:watch` - Run tests in watch mode
- Custom scripts for hex tile generation, world validation, and CLI REPL

## Platform Requirements

**Development:**
- Node.js 22+
- npm 10+
- (Optional) Python 3.x for hex tile generation scripts
- (Optional) Local TTS server (`tts-server.py`) for narration feature

**Production (Vercel):**
- Deployment target: Vercel (configured via `vercel.json`)
- Build command: `vite build`
- Output directory: `dist/`
- No server-side runtime required — static SPA deployment

**Browser Support:**
- ES2020+ JavaScript (modern browsers only)
- WebGL/Three.js support required for hex map rendering
- Web Audio API required for narration and theme music

## Fonts

**Google Fonts (loaded in `src/index.css`):**
- Cinzel 400/600/700 - Display font for headings (serif, fantasy aesthetic)
- Alegreya Sans 400/500/700 (italic variants) - Body text font (warm, readable)

---

*Stack analysis: 2026-03-30*
