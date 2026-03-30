---
phase: 09-start-screen
plan: 01
subsystem: ui
tags: [react, typescript, html-audio, lucide-react, start-screen, theme-music]

# Dependency graph
requires:
  - phase: 08-integration
    provides: HexMapV2 fully integrated as sole renderer, App.tsx stable GamePhase type
provides:
  - Full-bleed start screen at localhost:5173 (no URL params) with title art, gradient, THREADBARE title, lore, menu
  - useThemeMusic hook with fade in/out (Promise-based), mute persistence to localStorage
  - StartPage component with stub SettingsModal and CreditsModal for Plan 02 replacement
  - App.tsx GamePhase union extended with 'start' variant as default entry point
affects:
  - 09-02 (will replace stub SettingsModal/CreditsModal with full implementations)

# Tech tracking
tech-stack:
  added: [lucide-react]
  patterns:
    - Audio fade via setInterval stepping HTMLAudioElement.volume (not CSS transitions)
    - fadeOut returns Promise<void> using plain closure interval to survive component unmount
    - First-interaction pattern using useRef(false) to gate audio play on user gesture

key-files:
  created:
    - src/components/StartPage/useThemeMusic.ts
    - src/components/StartPage/StartPage.tsx
    - src/components/StartPage/StartPage.css
    - src/components/StartPage/SettingsModal.tsx
    - src/components/StartPage/CreditsModal.tsx
  modified:
    - src/App.tsx

key-decisions:
  - "lucide-react installed for Volume2/VolumeX icons — not previously in package.json"
  - "fadeOut interval stored in plain closure variable (not useRef) so it survives component unmount during transition"
  - "Audio play() called only on first user interaction (click/keydown) — never on mount (browser autoplay policy)"
  - "App.tsx default phase changed from 'worldgen' to 'start'; dev shortcuts (?view=game) still bypass start screen via early return"

patterns-established:
  - "BEM-style CSS class names for start page: .start-page, .start-page__title, .start-page--fading etc."
  - "Stub modal pattern: SettingsModal/CreditsModal compile-safe stubs replaced by Plan 02"

requirements-completed: []

# Metrics
duration: 12min
completed: 2026-03-23
---

# Phase 09 Plan 01: Start Screen Core Summary

**Atmospheric start screen with HTMLAudioElement theme music hook (fade in/out via setInterval), full-bleed layout with gradient overlay and gold Cinzel title, and App.tsx phase integration with 'start' as default entry point**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-03-23T07:18:03Z
- **Completed:** 2026-03-23T07:30:00Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- useThemeMusic hook with HTMLAudioElement lifecycle, fade-in over 3s, Promise-based fadeOut surviving unmount, localStorage mute persistence, and setVolume for Plan 02 wiring
- StartPage component with full-bleed background image (fail-soft onError), gradient overlay, THREADBARE title in gold, lore fragment, plain-text menu buttons, mute toggle, version stamp
- App.tsx GamePhase union extended with 'start' variant as default; dev shortcuts (?view=game, ?view=hexv2) still bypass via early return
- Stub SettingsModal and CreditsModal compile-safe placeholders for Plan 02 replacement

## Task Commits

Each task was committed atomically:

1. **Task 1: Create useThemeMusic hook** - `662b43a` (feat)
2. **Task 2: Create StartPage component, CSS, stub modals, wire App.tsx** - `f528f0e` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `src/components/StartPage/useThemeMusic.ts` - Audio hook: HTMLAudioElement lifecycle, fade in/out, mute with localStorage
- `src/components/StartPage/StartPage.tsx` - Full-bleed start page layout with gradient overlay, title, lore, menu, mute toggle, version stamp
- `src/components/StartPage/StartPage.css` - All start page CSS: full-bleed bg, gradient, content positioning, menu item hover/focus states
- `src/components/StartPage/SettingsModal.tsx` - Stub modal for Plan 02 replacement
- `src/components/StartPage/CreditsModal.tsx` - Stub modal for Plan 02 replacement
- `src/App.tsx` - GamePhase union with 'start' variant, default phase changed from worldgen to start

## Decisions Made

- lucide-react installed for Volume2/VolumeX icons (missing from package.json, blocking build)
- fadeOut interval uses plain closure variable not useRef — survives component unmount during the 600ms page transition
- Audio play() only called from first user interaction handler, never on mount (browser autoplay policy)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Installed missing lucide-react dependency**
- **Found during:** Task 2 (StartPage component creation)
- **Issue:** Plan specified `import { Volume2, VolumeX } from 'lucide-react'` but lucide-react was not in package.json. Build failed: "Rollup failed to resolve import 'lucide-react'"
- **Fix:** Ran `npm install lucide-react`
- **Files modified:** package.json, package-lock.json
- **Verification:** `npx vite build` succeeds after install
- **Committed in:** f528f0e (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking dependency)
**Impact on plan:** Essential for build to succeed. No scope creep.

## Issues Encountered

None beyond the missing lucide-react dependency (handled via Rule 3 auto-fix above).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Start screen is live as default entry point at localhost:5173 (no URL params)
- useThemeMusic exposes setVolume() for Plan 02 Settings volume slider wiring
- SettingsModal and CreditsModal stubs are compile-safe, ready for Plan 02 content replacement
- Audio file at /audio/theme-drone.mp3 and background image at /screens/title-screen.png are optional — both fail softly

---
*Phase: 09-start-screen*
*Completed: 2026-03-23*
