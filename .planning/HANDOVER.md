# Handover Notes

> Written by Cowork sessions for Claude Code to pick up. Read this at session start.
>
> **Format:** Each entry has a date, context (what was discussed/decided), and action items.
> **Lifecycle:** Claude Code acts on entries, then moves them to the "Completed" section below.

---

---

## 2026-03-23: Implement start page (main menu)

**Context:** The game currently drops players straight into cosmology setup with no introduction. Designed a full start page with title, lore fragment, main menu (New World / Continue / Settings / Credits), and theme music system. Narrative-mysterious tone — text over the existing title-screen.png art with a darkening gradient. Dark ambient drone plays on first interaction, fades out on "New World". Full design doc with layout mockup, audio system spec, token usage, constants table, NFP compliance, accessibility notes, and implementation file list.

**What Cowork already did:** Wrote complete design doc at `Docs/plans/2026-03-23-start-page-design.md`.

**Action for Claude Code:**
- [ ] Create `StartPage.tsx` component per design doc layout and token spec
- [ ] Create `startPageConstants.ts` with tunable constants from the design (includes audio constants)
- [ ] Create `useThemeMusic.ts` hook — HTMLAudioElement, fade-in on first interaction, fade-out on "New World", mute toggle with localStorage persistence, graceful failure on blocked play()
- [ ] Create stub `SettingsModal.tsx` (master volume slider wired to theme music, fog toggle, version)
- [ ] Create `CreditsModal.tsx` (scrollable credits list)
- [ ] Add mute/unmute toggle icon (Lucide Volume2/VolumeX) in bottom-left corner
- [ ] Create placeholder silent MP3 at `public/audio/theme-drone.mp3` (user will replace with real file)
- [ ] Modify `App.tsx`: add `start` phase as default, "New World" transitions to `worldgen`, dev view params (`?view=game`, `?view=hexv2`, etc.) skip start page
- [ ] Write unit tests: renders title/lore/menu, "Continue" hidden without save, "New World" triggers phase change, dev views bypass start page, audio hook fade/mute/failure
- [ ] Visual verification at 1920×1080: text legible over gradient, menu items respond to hover/focus, image fallback works, mute icon visible

**Files changed:** `Docs/plans/2026-03-23-start-page-design.md` (new + updated with audio), `.planning/HANDOVER.md` (this entry)

---

---

## Completed

### 2026-03-25: Fixed-slot hex layout (completed 2026-03-25)

All action items done:
- Added `BALANCED_SLOT_INDICES` lookup table and `getFixedSlotOffset()` to `movementPath.ts`
- Added `SLOT_RING_RADIUS`, `VERTEX_ANGLES_DEG`, `EDGE_MID_ANGLES_DEG` to `agent-visual-content.ts`; deprecated `LOCATION_RING_ROTATION_DEG`
- Updated `AgentSpriteMesh.ts`: `getFixedSlotOffset` with `EDGE_MID_ANGLES_DEG` (both create and update functions)
- Updated `LocationIconMesh.ts`: `getFixedSlotOffset` with `VERTEX_ANGLES_DEG`; removed rotation offset logic
- Updated `HexMapV2.tsx`: animation bezier endpoints and trail location offsets use `getFixedSlotOffset`
- 14 unit tests for `getFixedSlotOffset` (angles, balanced distribution 1-6, edge cases, determinism, no agent/location overlap)
- Visual verification pending (user must run `npm run dev` and check `?view=game`)

### 2026-03-23: Kokoro TTS narration prototype (completed 2026-03-23)

All action items done:
- Installed kokoro-js (v1.2.1) — 82M param model, Apache 2.0, client-side WASM
- Created `src/services/narration/` with 4 files: narrationConstants.ts, NarrationWorker.ts, NarrationService.ts, useNarration.ts
- NarrationWorker runs kokoro-js inference in Web Worker (off main thread)
- NarrationService wraps worker with AudioContext playback, singleton pattern
- useNarration React hook with useSyncExternalStore for zero-re-render subscriptions
- HexChronicle: narrate button in hero section with icon states (Volume2 → Loader2 spinner → Square stop)
- Auto-stops narration on hex change
- Feature flag off by default (NARRATION_ENABLED = false)
- All 5798 tests pass, build succeeds, type-check clean

### 2026-03-23: Rename game title from "Threadbare" to "Threadbearer" (completed 2026-03-23)

All action items done:
- Changed START_PAGE_TITLE, CreditsModal heading, MagicGlowTiles h1, STYLE.md heading + text rules, index.html title
- Updated localStorage keys (threadbare_muted → threadbearer_muted, threadbare_fog_default → threadbearer_fog_default) and test todo text
- Internal aesthetic references ("Threadbare aesthetic") left unchanged per design intent
- Visual verification: letter-spacing looks great at 1920×1080

### 2026-03-23: Complete stencil coastline wiring (completed 2026-03-23)

All action items done:
- Wired stencil test on land mesh material (EqualStencilFunc, ref=1)
- Rewrote CoastlineMesh: stencil write pass from land contour loops (colorWrite: false)
- Disabled shallow band overlays (they covered land area with light blue — root cause of the all-blue map)
- Updated CoastlineMesh tests for stencil behavior
- Visual verification: per-hex terrain colors visible on both `?view=hexv2` and `http://localhost:5173/`
- Remaining TODO: re-add shallow band with stencil test (only render where stencil=0)

### 2026-03-22: Documentation cleanup + Notion migration (completed 2026-03-22)

All action items done:
- Committed all Cowork documentation changes
- Verified and cleaned Notion backlog URLs from GDD outline, gamedocumenter evals
- Updated gamedocumenter eval cases (removed Notion, now reference BACKLOG.md)
- Deleted stale `state-of-game-design-SKILL.md` from repo root
- Removed stale `.skills/` and `skills/` directories (canonical skills in `.claude/skills/`)
- Removed `CLAUDE.md.proposed` and `CLAUDE.md.backup`
- Pruned stale git worktrees and removed local worktree directories

### 2026-03-22: Skill improvements for Claude Code (completed 2026-03-22)

Done:
- Merged `frontend-ui` loose file into folder-based SKILL.md (design-system loading, primitives, verification)
- Created `hexmap-renderer` skill from Hex Map V2 Phases 1-4 decisions

Deferred (when time permits):
- Write evals for `state-of-game-design` and `engine-architecture` skills
