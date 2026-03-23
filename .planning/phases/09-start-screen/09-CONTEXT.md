# Phase 9: Start Screen - Context

**Gathered:** 2026-03-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Atmospheric main menu screen with title art, dark ambient audio, narrative lore fragment, and navigation to the existing worldgen flow. Player sees this first when opening the game (no URL params). Dev shortcuts bypass it. Settings and Credits modals available as overlays.

</domain>

<decisions>
## Implementation Decisions

### Title screen art
- Generate 3 concept art variants using image generation, pick the best
- **Style:** Concept art inspired by Endless Legend / Humankind aesthetic — ancient world, mystery over epic high-fantasy. Not D&D bombastic — quiet, vast, strange
- **Landscape:** Salt flats with shallow water shoals (thin pools and rivulets across the flat), misty mountains in far distance
- **Ruin:** Semi-submerged ancient structure, subtle enough to look like natural rock at first glance, with faint glowing energy veins/cracks embedded in it (the sphere energy is embedded in the ruin, NOT in the sky)
- **Wanderer:** Tiny cloaked silhouette with walking staff, back to camera, walking into the vast landscape — emphasizes scale of the world
- **Wildlife:** A few seagulls
- **Lighting variants:** Generate 3 versions, pick best:
  1. Cool dawn — blue-grey with pale gold horizon
  2. Golden hour — warm amber, long shadows
  3. Overcast twilight — muted grey-purple, desaturated
- **Aspect:** 16:9 landscape, full-bleed viewport background
- **Composition:** Wanderer and ruin should be mid-frame or upper-third, leaving the bottom third naturally dark/simple for the gradient text overlay
- Output as `public/title-screen.png`

### Layout & typography
- All decisions locked in the design doc (see canonical refs)
- Full-bleed title-screen.png with CSS gradient darkening the lower third
- "THREADBARE" in Cinzel, gold, wide letter-spacing
- Two-line lore fragment in italic Alegreya Sans
- Plain text menu items (no buttons/boxes/icons): New World, Continue (hidden until save system), Settings, Credits
- Version stamp bottom-right, mute toggle bottom-left

### Audio behavior
- All decisions locked in the design doc
- `public/audio/theme-drone.mp3` already exists
- HTMLAudioElement with `useThemeMusic` hook
- Play on first user interaction (browser autoplay policy), fade in over 3s
- Fade out on "New World" over 1.5s, then transition
- Mute persists to localStorage

### App.tsx integration
- Add `'start'` to GamePhase union type as the new default phase
- `?view=game` and `?view=hexv2` continue to skip start screen (dev fast path)
- "New World" sets phase to `worldgen` with a 600ms fade-out transition

### Settings & Credits modals
- Use existing `Modal` primitive (`src/components/shared/Modal.tsx`)
- Settings stub: volume slider (wired to audio hook), fog default toggle, version/seed display
- Credits: game title, author, technology credits, closing lore line

### Claude's Discretion
- Transition choreography details (loading state between start and worldgen, or simple fade)
- Exact gradient opacity curve tuning
- Settings modal layout
- Credits modal scroll behavior and content ordering
- Loading skeleton or spinner during worldgen mount
- Test coverage approach (unit vs snapshot vs integration)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Start page design (primary spec)
- `Docs/plans/2026-03-23-start-page-design.md` — Complete design doc: layout, typography, audio system, transitions, constants table, NFP compliance, fail-soft table, accessibility, implementation notes. This is the authoritative spec for everything except title screen art (which is captured in decisions above).

### Visual style
- `STYLE.md` — Threadbare aesthetic, color tokens, typography scale. Title screen must use these tokens.

### UI patterns
- `Docs/ui-patterns.md` — Modal patterns, component conventions

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/shared/Modal.tsx` — Modal primitive with dark backdrop, max-height 85vh. Use for Settings and Credits overlays.
- `public/audio/theme-drone.mp3` — Audio file already exists in the repo. Ready for the audio system.

### Established Patterns
- `App.tsx` uses a `GamePhase` union type with `useState` for phase management. No router library — all state-based.
- Dev view shortcuts check `?view=` param before mounting any state. Start screen must be skipped the same way.
- Design tokens in CSS custom properties (`--bg-abyss`, `--accent-gold`, `--text-secondary`, etc.) — all defined in `index.css`.
- Fonts: Cinzel (`--font-display`) and Alegreya Sans (`--font-body`) already loaded.

### Integration Points
- `src/App.tsx` line 22-25: `GamePhase` type needs `'start'` variant added
- `src/App.tsx` line 58-59: Default phase changes from `worldgen` to `start`
- `src/App.tsx` line 40-56: Dev view shortcuts remain unchanged (they return early before state init)

</code_context>

<specifics>
## Specific Ideas

- Art style: "Endless Legend, not D&D" — mystery and vastness over bombastic high-fantasy
- The wanderer is tiny, walking INTO the picture — camera behind, identity hidden (cloak, staff, no face)
- The ruin should be ambiguous — "could almost look like a piece of rock, but if you look carefully you can see it was something"
- Salt flats with "wavy shallow water coming in, small ponds and flows" — not a dry desert, but wet and reflective
- Sphere energy is embedded in the ruin as faint glowing veins, NOT floating in the sky
- Generate 3 lighting variants, user picks the best

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 09-start-screen*
*Context gathered: 2026-03-23*
