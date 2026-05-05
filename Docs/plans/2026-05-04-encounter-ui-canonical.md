# Encounter UI — Canonical Specification (2026-05-04)

**Status:** Canonical specification for the encounter player-facing UI surface. Promotion target: `Systems/Encounter UI.md` after THR-301 implementation lands. Currently lives as a plan doc.

**Audience:** Implementation executors (CC / Codex) working THR-301 and child issues. Designers iterating on the surface. Content authors composing encounters that render here.

**Inputs (read these in this order):**
1. `Docs/plans/2026-05-04-encounter-experience-design-plan.md` — the long-form design plan; this doc is its UI pillar made executable
2. `Docs/plans/2026-05-04-encounter-experience-v7.html` — the v7 layout reference (open in browser at 1080p)
3. `Docs/plans/v7-design-pass/` — the design pass deliverable from claude.ai/design (browseable preview at `index.html`, includes JSX components, design tokens, fonts, motion + sound briefs)
4. `Brainstorms/brainstorm-cosmological-symmetry.md` — the cosmological pattern (8 reaches × spheres × archetype poles)
5. `Vision/taste-profile.md`, `STYLE.md` — aesthetic constraints

**Viewport contract:** 1920×1080 minimum, 2560×1440 optimal. Desktop only. No mobile, no responsive.

---

## 1. The layout

The encounter screen is a single full-viewport surface with three load-bearing zones plus a slim bottom strip. Layout proportions for 1920×1080:

```
┌────────────────────┬─────────────────────────────────────┬───────────────────────────┐
│                    │                                     │  CAST IN THE SCENE        │
│  THE PROTAGONIST   │  BEAT N · NOW                       │  ─────────────────────    │
│  (Eira Hero Panel) │  Title                              │  Veiren · Trader · Halren │
│                    │                                     │                           │
│  Portrait          │  Place painting (full-width banner) │                           │
│  Identity + state  │                                     │  YOUR HAND                │
│  Capability strips │  Outcome forecast band              │  ─────────────────────    │
│  Items + active vow│  Callback note (when invoked)       │  Send a sign · Veil ·     │
│  Recent moments    │  Prose with tooltipped terms        │  Mark her with fate       │
│                    │                                     │                           │
│                    │  Encounter choices (3 cards)        │  THE STATE OF THE SCENE   │
│                    │                                     │  ─────────────────────    │
│  440px wide        │  ~860px wide, full body height,     │  Threads · factions ·     │
│                    │  prose-flexible (scrolls within)    │  conditions               │
│                    │                                     │  540px wide               │
├────────────────────┴─────────────────────────────────────┴───────────────────────────┤
│  Quintessence · scene pacing · Watch only                                  100px tall │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

The center column is **prose-flexible**: when prose runs long, the active card scrolls internally. Choices push down naturally. The cast tiles, hand cards, and scene state in the right rail stay anchored — they don't move with prose length.

---

## 2. Component inventory

Build by extending these existing primitives — don't rebuild from scratch:

| Existing primitive | Source file | Encounter UI use |
|---|---|---|
| `Modal` | `src/components/shared/Modal.tsx` | Detail pages (Moment 3) — extend for stack support |
| `Tooltip` | `src/components/shared/Tooltip.tsx` | Hover tooltips on dotted-underline terms |
| `TooltipChain` | `src/components/shared/TooltipChain` (test in `__tests__`) | Layered tooltip resolution; chaining already supported |
| `ProseKeyword` | `src/components/ProseKeyword.tsx` | IPK-style underlined term rendering |
| `EmergenceDilemmaModal` | `src/components/ruins/EmergenceDilemmaModal.tsx` | Reference example of a modal-based interaction surface |

Build new components extending these:

| New component | Replaces / extends | Purpose |
|---|---|---|
| `EncounterChoiceCard` | new | The three choice cards in the active card. Reach + cost + god-verb + agent reaction + tilts-toward + moral-axis-pole + fail-forward |
| `OutcomeForecastBand` | new | Five-tier qualitative read above the prose, computed from sigmoid output |
| `EiraHeroPanel` | new | Left rail protagonist view (portrait, identity, capability strips, items, recent moments) |
| `AscendantHand` | extends `ActionDrawer` (existing) | Right rail "Your Hand" — scene-relevance filter on the unified action template pool |
| `CastTile` | new | Single cast member tile (right rail) — portrait, name, sphere, scene-disposition, "to her" relationship |
| `SceneStatePanel` | new | Threads + factions + place conditions + drift/detection indicators |
| `ThreadOverlay` | new | The dice/threads tension SVG component (Moment 1) |
| `EffectRegistration` | new | Aftermath effect-card landing animations (Moment 2) — one per effect kind |
| `DetailModal` | extends `Modal` | The click-through detail page shell (Moment 3) |

Reference implementations of all of the above exist in `Docs/plans/v7-design-pass/parts/*.jsx`. Treat as **visual + behavioural reference**, not as drop-in code — the production version uses TypeScript, the actual design tokens, and the project's React patterns.

---

## 3. Motion + sound — Tension reveal (Moment 1)

When the player commits an encounter choice, the world resolves through a five-beat held-breath sequence. Total duration: **1.6 seconds**. Source spec: `Docs/plans/v7-design-pass/parts/moment1-reveal.jsx` (see `MotionSoundBrief` component for the full prose).

### 3.1 Beat structure

| Beat | Duration | What happens |
|---|---|---|
| Commit | 60ms | Card highlight on chosen choice; the world acknowledges the click |
| Inhale | 380ms | Page dims by 8%; held breath; ambient thrum begins |
| Threads draw | 520ms | Three sphere-coloured threads emerge from below the choice cards (player-hand origin) and draw upward via Bézier paths to each card. `stroke-dashoffset` animation, ease-out |
| Tension (taut) | 420ms | All three threads pulse subtly along their length (1px width oscillation, single cycle). Dust motes drift upward at 30% opacity. **The player's hand is off the mouse.** |
| Resolve | 240ms | Two threads slack and dim to 15% opacity. Chosen thread brightens by 30% and its card receives a single one-shot `pulseGoldFlare` ring. Dimmed cards desaturate to 35%/35%. Next-beat affordance fades in below at +400ms |

### 3.2 Visual constraints

- **The cards do not move.** No layout shift during the entire sequence.
- **Threads are 1.2px maximum**, intensely bright but never thick. They do NOT cast ambient glow on adjacent surfaces.
- **One bright node per thread** at each card's top — breathes during taut beat (radius 3→5→3, 900ms ease-in-out).
- **Sphere colours** per thread: Iron force-red (`--sphere-force-bright`), Eye mind-blue (`--sphere-mind-bright`), Heart spirit-violet (`--sphere-spirit-bright`), or whichever 3 reaches the encounter author selected.
- **Dust motes** during taut beat: 8 motes drift upward along thread paths, opacity 30% peak, 1.6–2.5s duration each, staggered.
- **Reuse** the existing `pulseGoldFlare` keyframe in `tokens.css` / `index.css` — do not invent a new glow. Other choice cards desaturate via `filter: saturate(0.35) opacity(0.35)`; do not transition the layout.

### 3.3 Sound design

Three layered cues, total cue length ≤ visual sequence so the prose log lands in silence:

| Cue | Timing | Specification |
|---|---|---|
| Inhale | 0–380ms | Held breath at -28dB, mono center, low-pass at 800Hz |
| Thrum | 380ms–1.32s | Cello drone fading in across draw + tension beats. Root only, no harmony. Peaks at -16dB on the taut beat |
| Resolve | 1.32s–1.56s | Single struck-string node, sphere-tinted: low fourth on Iron, open fifth on Eye, soft minor third on Heart. Slackening threads emit a barely-audible *release* — fingertip leaving wet thread |

**No drum. No riser. No vocalisation.**

### 3.4 Phase machine

```
idle → committed → drawing → taut → resolving → settled
```

- `idle` — no choice committed, cards interactive
- `committed` — click registered, transitions to drawing on next frame
- `drawing` — threads animating in, 520ms
- `taut` — threads held, motes drifting, 420ms
- `resolving` — winner brightens, others slack, 240ms
- `settled` — overlay unmounts at +600ms; existing post-resolve UI takes over

Implementation lives in a single `<ThreadOverlay>` SVG component drawn over the choice card row. State machine is internal to the component; engine fires `committed` event with the chosen reach + computed outcome band.

---

## 4. Motion + sound — Aftermath registration (Moment 2)

When the encounter resolves, **changes crystallise visually inside the protagonist's hero panel** — *not* as a banner, *not* as a list. Each effect lands where the eye already is. Source spec: `Docs/plans/v7-design-pass/parts/moment2-aftermath.jsx`.

### 4.1 Nine effect kinds — landing specification

| Effect kind | Sphere coding | Lands in | Motion |
|---|---|---|---|
| `intelligence` | eye / mind-blue | Items rail · hero panel | Card-flip in (rotateX 80→0, 420ms ease-out). Mind-blue thread draws from choice node into the slot at +120ms. One `pulseGoldFlare` ring on settle. |
| `condition_attachment` | spirit / spirit-violet | Disposition strip · beneath the protagonist's name | Old condition pill cross-fades out 200ms; new pill fades up + 4px slide, 240ms; spirit-violet thread tugs from chest in portrait into the new pill on settle. |
| `reputation_tally` | iron / force-red | Cast tile · right rail | Sphere-coloured 3px left border pulses once (`pulseGoldFlare` retinted). Old disposition phrase fades out 160ms; new phrase types in 280ms (one character at a time). Never a numeric tick. |
| `reputation_score` | iron / force-red | Cast tile · prose band | Old band-word fades through a thread of force-red (180ms); new band-word lands. Soft horizontal pull (taut→relax, single cycle) along the cast tile. |
| `encounter_seed` | time / time-orange | Bottom of hero panel · "moments that could echo" strip | Slide-up 8px + fade, 360ms. Time-orange node pulses once at the corner. Strip auto-scrolls so the new card is visible. |
| `hidden_mark` | darkness / dark-violet | Portrait · hero panel | Single dark-violet thread draws around portrait edge (700ms). Pill appears beneath portrait with player-only treatment (dotted outline, 35% opacity background). **Always lands last** — the world resolves before the secret does. |
| `recent_event` | heart / spirit-violet | "Moments that could echo" strip | Card-flip-in into the echo strip; gold callback ring pulses on settle (same primitive used for active callbacks above prose). |
| `spawn_artifact` | matter / matter-umber | Items rail · hero panel | Card-flip-in (rotateX 80→0, 460ms — slightly heavier than intelligence). Faint matter-umber rim glow holds 600ms then settles to none. |
| `faction_*` | order / order-gold | Scene state · right rail | Faction chip border pulses once with sphere colour (single cycle, 800ms). Cross-fade between old and new tone-words, 200ms. If the change is large enough, chip swaps colour-class (allied → opposed). |
| `archetype_drift_register` | chaos / chaos-grey | Capability bands · hero panel | Sphere-coloured dot fills (240ms ease-out). Italic phrase fades through and lands. Faint chaos-grey particle drifts up from the band — drift, never a stat-up animation. |

### 4.2 Sequencing plan

A single resolution can fire 1–N effects. They cannot all land at once — the eye splits, the dopamine flattens. **Order is fixed by scope: tightest first, widest last.** Player-only effects always land last.

**Lane assignments and timing windows** (timeline in seconds from resolution):

| Lane | Time window | What lands |
|---|---|---|
| PROSE LOG | 0.0s → 1.0s | The line that resolved |
| CHOICE CARDS | 0.0s → 0.6s | Winner brightens · others slack |
| HERO PANEL | 0.6s → 1.5s, 1.7s → 2.4s | First registration · card flip → second registration |
| RIGHT RAIL · CAST | 1.0s → 1.7s | Reputation tally |
| RIGHT RAIL · STATE | 1.4s → 2.0s | Faction chip · scene threads |
| ECHO STRIP | 2.4s → 3.2s | `recent_event` for this beat |
| PLAYER-ONLY | 3.2s → 4.0s | `hidden_mark` last |

Total resolution-to-final-effect window: **~4.0 seconds**. Player can start the next beat after the prose-log line lands; subsequent registrations animate concurrently with the next beat's setup.

### 4.3 Discipline rules

- **No two card-flips overlap by more than 50%.** If a second effect would land within 50% of the first's flip duration, delay it by 220ms.
- **Pulse rings never stack.** If a `pulseGoldFlare` is mid-decay, the second is suppressed (or queued to fire after settle).
- **Audio is cued only on the *first* registration.** Further effects land in the silence the resolve cue leaves behind. No cumulative jingle.
- **More than 5 effects from one resolution → second-breath gate.** Effects 6+ wait for the first 5 to fully complete, then a single line `… more is settling` fades into the prose log, then the second wave begins.

---

## 5. Detail page pattern (Moment 3)

Per Rule 4 (every primitive clickable, every node has a detail page). Source spec: `Docs/plans/v7-design-pass/parts/moment3-detail.jsx`.

### 5.1 Architecture

A single `DetailModal` component (extends `shared/Modal.tsx`) is the canonical container. Five typed instances:

| Type | Trigger | Header | Sphere coding |
|---|---|---|---|
| Actor | Click any cast tile, any agent reference in prose | Name + role + sphere descriptor | Actor's primary reach sphere |
| Item | Click any item in items rail, any item reference in prose | Item name + category + position | Item's sphere alignment (matter for physical, mind for knowledge, etc.) |
| Faction | Click any faction chip, any faction reference in prose | Faction name + alignment + headquarters | Faction's order/sphere |
| Place | Click place caption above prose, any place reference in prose | Place name + ambient state | Place's sphere alignment (or time/order if mundane) |
| Event | Click any callback note, any event reference in "moments that could echo" | Event name + when + sphere flavour | Event's sphere from when it occurred |

### 5.2 Modal shell anatomy

```
┌─────────────────────────────────────────────────────────┐
│  ENCOUNTER · CAPTAIN VEIREN                    ← back ✕│ ← Breadcrumb trail + ESC/back/close
│  ACTOR                                                  │ ← Type label, sphere-coloured
│  Captain Veiren                                         │ ← Display name, Cinzel
│  IRON · CIVIC GUARD · HONOUR-BOUND                      │ ← Subtitle (sphere/role/disposition)
├─────────────────────────────────────────────────────────┤
│  [scrollable body — multiple Section blocks]            │
│                                                         │
│  DISPOSITION TOWARD HER  (gold label = primary section) │
│  prose...                                               │
│                                                         │
│  WHAT SHE IS TO HIM                                     │
│  prose...                                               │
│                                                         │
│  THREADS BETWEEN THEM                                   │
│  [chip row]                                             │
│                                                         │
│  WHEN THIS THREAD LAST PULLED                           │
│  [event card]                                           │
├─────────────────────────────────────────────────────────┤
│  ESC closes · ← steps back · the encounter remains     │
│  paused                          [open her sheet ↗]    │
└─────────────────────────────────────────────────────────┘
```

Default size: 720×620 desktop. Larger sizes acceptable for Place (which contains a place painting) and Event (which may show a worked-example narrative).

### 5.3 Stacking behaviour

- **Modal-on-modal stacking is supported.** Click a cast tile → actor detail opens. Click "Captain Veiren" inside that detail → his actor detail opens on top. Up to **4 deep**.
- **Each modal tints the layer beneath by 28% black.** Visible dimming so the player knows the parent is behind.
- **Beyond depth 4**, the breadcrumb collapses — earliest crumbs become a single `…` entry. Click `…` to see and jump to any prior level.
- **The encounter underneath is paused.** Beat indicator dims to 50% opacity. No auto-advance. Ambient sound ducks 6dB. Time does not pass — turn-based contract is preserved.
- **ESC** closes the topmost modal. **←** walks the breadcrumb back one level (functionally identical to ESC for one-level-deep, distinct for stacked).

### 5.4 Section primitives within detail pages

- **`Section` blocks** with an ALLCAPS Cinzel label. Gold-coloured label = primary section (the most important thing about this entity). Default tertiary text otherwise.
- **`<span class="term">`** for dotted-underline coloured terms inside detail prose. Hover for nested tooltip; click to open another detail modal (stacks).
- **Place painting** in Place detail uses the same `PlacePainting` component the active card uses — different content, same component.
- **Portrait** in Actor detail is the same character art used in the cast tile, scaled up to 180×220.
- **Chip rows** for thread relationships, faction allegiances, faction-held reputations.

### 5.5 Detail page prose

**Long prose is intentional and supported.** Per project principle: Threadbearer's audience includes readers and TTS listeners. Detail pages are where lore lives.

- Detail page prose runs as long as the moment earns. Multi-paragraph backstory is fine. Nested relationships, prior encounter recaps, and historical context all belong here.
- The reference examples in `parts/moment3-detail.jsx` set the **floor** for craft — content authors aspire to that voice. Lower-effort fallback templates exist for cases where craft prose hasn't yet been authored.
- Detail page body scrolls vertically when content runs long. The header and footer stay anchored.
- TTS button on each detail page reads the body aloud in Kokomoro voice. The cadence and word choice should serve spoken delivery as well as visual scanning.

---

## 6. Engineering notes

### 6.1 Tokens

All visual styles must reference design tokens — never hardcoded colours, fonts, or animation timings. Token source: `src/index.css` (existing). The design pass at `Docs/plans/v7-design-pass/tokens.css` mirrors these tokens; treat the repo's `index.css` as authoritative.

Key tokens used by the encounter UI:

```css
/* backgrounds */
--bg-abyss      /* page background, modal overlays */
--bg-deep       /* hero panel, sidebar */
--bg-surface    /* cards, panels */
--bg-raised     /* rows, chips */

/* text */
--text-primary    /* warm parchment, main text */
--text-secondary  /* dimmer body text */
--text-tertiary   /* labels, captions */
--text-muted      /* placeholders, very low priority */

/* accent (use sparingly) */
--accent-gold       /* important, never pretty */
--accent-gold-dim   /* alpha 60% of gold */
--accent-gold-glow  /* alpha 30% of gold */

/* sphere colours (12 total — see tokens.css) */
--sphere-force-bright   /* Iron */
--sphere-mind-bright    /* Eye */
--sphere-spirit-bright  /* Heart */
--sphere-time-bright    /* Star */
--sphere-matter-bright  /* Stone */
--sphere-life-bright    /* Gold */
--sphere-energy-bright  /* (paired with Eye/Energy) */
--sphere-entropy-bright /* Shadow */
/* + chaos, order, light, darkness for foundation */

/* motion */
--anim-fast   /* 150ms */
--anim-normal /* 200ms */
--anim-slow   /* 400ms */
```

### 6.2 Animation primitives

Reuse existing keyframes — do not invent new ones except where this spec explicitly defines them (`thread-draw`, `thread-pulse`, `mote-drift`, `card-flip-in`, `mark-pulse`).

Existing keyframes available:
- `fadeInOnly`, `fadeOutOnly`, `fadeSlideUpIn`, `fadeSlideUpOut`, `fadeSlideDownIn`, `fadeSlideDownOut`
- `breathe`, `pulseGoldFlare` (the gold ring)
- `shakeNo` (negative confirmation)

New keyframes to add (definitions in `Docs/plans/v7-design-pass/index.html` `<style>` block):
- `thrum-fade`, `thread-draw`, `mote-drift`, `pull-taut`, `hold-glow` (Moment 1)
- `card-flip-in`, `mark-pulse` (Moment 2)

Promote these to `src/index.css` when implementation begins.

### 6.3 Typography

- **Cinzel** for display, names, ALLCAPS section labels, narrative-weight titles
- **Alegreya Sans** for body prose, captions, chip labels
- **Minimum body size**: 16px. Never smaller.
- **ALLCAPS labels** always letter-spaced 0.12em–0.18em.
- **Italic** reserved for: dialogue inside prose, "to her" relationship lines, flavor descriptors, callback notes.

Font files bundled in `Docs/plans/v7-design-pass/fonts/` for offline preview. Production loads from `src/assets/fonts/` (existing).

### 6.4 Reuse-first discipline

Before introducing a new component, check if an existing one fits. The encounter UI is rich but most of its visual primitives (Modal, Tooltip, ProseKeyword, button styles, panel patterns) already exist. New components are a last resort, not a default.

This is especially true for the click-through detail pages (Moment 3) — they extend `Modal`, they don't replace it.

### 6.5 Performance

- **Animation budget**: 60fps at 1920×1080 with the encounter UI fully rendered + active animations. The dice tension reveal (3 SVG paths drawing simultaneously) is the worst case. Profile before shipping.
- **Modal stacking**: at depth 4, the dimmed background layers should be cheap (CSS opacity + filter, not re-rendered React subtrees).
- **Detail page open**: should feel instant (<100ms perceived latency from click to modal visible). Use entrance animation to mask any data fetching.

---

## 7. Reference materials

All living inside `Docs/plans/v7-design-pass/`:

- `index.html` — browseable design canvas (open in any browser at file://)
- `index.inlined.html` — same, with all JSX inlined for offline rendering
- `tokens.css` — design tokens (mirror of `src/index.css`)
- `design-canvas.jsx` — the Figma-ish canvas wrapper (predecessor reference, not production)
- `parts/encounter-shell.jsx` — recreation of v7 layout in React (visual reference)
- `parts/moment1-reveal.jsx` — five-frame storyboard + ThreadOverlay component + motion brief
- `parts/moment2-aftermath.jsx` — nine effect tiles + sequencing plan + discipline rules
- `parts/moment3-detail.jsx` — five detail page mockups + ModalShell + stacking diagram
- `fonts/` — Cinzel + Alegreya Sans web fonts
- `assets/` — region screenshots from v7 (the input I sent to claude.ai/design)
- `review-screenshots/` — full-canvas renders of the design pass output

The design canvas page (open `index.html` in a browser) is the most useful single artefact — it shows all three moments side by side with live animations.

---

## 8. What this doc does NOT cover

- **Engine concerns** — sigmoid → d100 resolution math, drift accumulator logic, detection escalation algorithm. See `Docs/plans/2026-05-04-encounter-experience-design-plan.md` §3.
- **Content authoring contract** — what fields encounter authors write. See design plan §4.
- **Scene state and primitives** — the graph entity vocabulary the UI reads from. See `Docs/plans/2026-05-04-encounter-build-toolkit.md`.
- **The Ascendant intervention system itself** — what cards exist, what they do mechanically. The encounter UI's hand is a *filter surface* on whatever the Ascendant system is. See decision 2.6 in design plan.

---

## 9. Done when

This doc is no longer a plan doc but a Systems doc — promotion to `Systems/Encounter UI.md` happens when:

- THR-301 implementation lands (encounter UI components built, integrated, tested)
- Animation primitives migrated from `Docs/plans/v7-design-pass/` into `src/index.css`
- Component inventory matches what's actually in `src/components/Game/Encounter/` (or wherever it lands)
- This doc has been updated to reflect any deviations during implementation
- Linker check: every component referenced here exists; every primitive referenced here is in use
