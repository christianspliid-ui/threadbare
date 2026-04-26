# UI Visual Overhaul — Design System v1 Adoption

**Created:** 2026-04-18
**Owner:** Cowork (design/planning) → Claude Code (implementation)
**Status:** Implementation Planning — ready to kick off
**Linear project:** UI Visual Overhaul — Design System v1 *(new project created 2026-04-18; replaces completed "UI/UX Design Infrastructure")*

---

## What this project is

A system-wide visual refresh of Threadbearer's in-game UI, adopting the design language produced by the Claude Design session shipped to `Design/Claudedesignhandooffs/`. The output of that session is the authoritative **visual language** (tokens, typography, primitives, icon set) and a single component redesign (**Thread/Retinue panel**).

This project applies the visual language **everywhere**, but only touches **data/information architecture** in components that have an explicit redesign spec. Every other panel gets the new tokens, type, and primitives and nothing more — their data surfaces remain identical until their own Claude Design pass produces a redesign brief.

## What this project is NOT

- **Not a ground-up rewrite.** The existing repo (`src/index.css`, `src/components/shared/Button.tsx`, etc.) already implements ~70% of the design system. This project is additive and migratory, not destructive.
- **Not a data-model overhaul.** The `agent.sphere` field, creation-sphere engine work, and elder-magic progression all remain on the roadmap for their own designs. We piggyback on existing cosmology data via a CSS-layer reach→foundation-sphere token mapping.
- **Not a re-IA of unspec'd panels.** TopBar, AgentDetail, RightRail, and InterventionModal get visual token parity, but their data layouts are NOT redesigned here. Attempting that without a data spec would strip working information surfaces the player relies on.
- **Not a map/terrain overhaul.** The HexMapV2 renderer, terrain palette (`paletteTheme.ts`), and Three.js layer stack are out of scope. Only overlay chrome (labels, frames, fog, HUD) inherits the new tokens.

---

## Cosmology context (required reading before implementation)

Authoritative reference: `C:\Users\chris\Dev\Projects\TheFantasyWorldSimulator\cosmology-symmetry.html`.

- **Foundation spheres** (8 — chargen-available, "worldly currency"): `force`, `matter`, `energy`, `life`, `mind`, `spirit`, `time`, `entropy`.
- **Creation spheres** (4 — elder magic, discovered mid/late game, NOT available at chargen): `chaos`, `order`, `light`, `darkness`. Each creation sphere governs two foundation spheres:
  - Chaos → Force + Entropy
  - Order → Matter + Energy
  - Light → Life + Mind
  - Darkness → Spirit + Time
- **Reaches** (8 — skill families, orthogonal axis): `iron`, `stone`, `eye`, `gold`, `veil`, `heart`, `star`, `shadow`.
- **Reach ↔ foundation-sphere power-source pairing is 1:1 and deliberate** (not coincidence). This is an architectural decision from the cosmology-symmetry refactor:
  - `iron ↔ force`, `stone ↔ matter`, `eye ↔ energy`, `gold ↔ life`, `veil ↔ mind`, `heart ↔ spirit`, `star ↔ time`, `shadow ↔ entropy`.
  - Because the pairing is fixed, the design system's 12 `--sphere-*` CSS tokens can drive reach coloring through a CSS-layer mapping — no `agent.sphere` field or engine change required for v1.

Relevant memory: `project_elder_magic.md` documents that creation-sphere CSS tokens exist for future content ship.

---

## Scope (12 issues: 7 active + 5 deferred)

### Active — ship in this project

1. **Design tokens foundation** — extend `src/index.css` with the missing tokens: 12 `--sphere-*` + `-bright` variants, semantic `--type-*` tokens, `--accent-gold-glow`, local `@font-face` for Cinzel + Alegreya Sans (replace Google Fonts `@import`).
2. **Typography migration (16px floor)** — replace all hard-coded font sizes in `src/components/` with the `--type-*` or `--text-*` tokens. Enforce 16px floor: nothing renders smaller than `--text-xs` (1rem). Accept density regression — user has explicitly endorsed "everything should grow."
3. **Primitives library** — introduce `SectionHeading`, `Card`, `ListRow`, `ProgressBand`, `Divider` as shared React components matching `Design/Claudedesignhandooffs/.../Primitives.jsx`. Refine existing `Button.tsx` to match (scale 0.98 on mousedown, exact variant color refresh). Expose via `?view=styleguide`.
4. **ActivityIcon component** — ship 6 activity glyphs (boot, swords, coin, hammer, bandage, hourglass) as `src/components/shared/ActivityIcon.tsx`. Props: `kind`, `size = 18`, `color = 'var(--text-secondary)'`. Used by the Thread panel and anywhere agent activity is surfaced.
5. **SphereIcon component** — ship primitive-based SphereIcon (not ink-on-vellum) at `src/components/shared/SphereIcon.tsx`. Props: `sphere` (all 12 names), `size`. Uses the new `--sphere-*` tokens. Low per-instance render cost because the Thread panel will render dozens at once.
6. **Thread/Retinue panel redesign** — re-implement the thread list using `ThreadPortrait`, `ThreadActionChip`, `AutoToggle`, sphere-colored left border, 3-row flex layout (name + activity icon + zoom + sphere glyph / destination / action chip + Auto toggle) per `Design/Claudedesignhandooffs/new-hexmap-sidebars/project/src/Threads.jsx`. **This is the only component where IA is redesigned.** Preserves all data surfaces from the current 849-line `ThreadsPanel.tsx` (encounter pool, strategic summary, thread strength, attention mode) — they migrate into the new visual shell, they do not disappear.
7. **Viewport-contract audit** — after 1–6 ship, run `preview_resize 1920 1080` verification on every primary view (`?view=game&seeded`, `?view=game`, `?view=codex`, `?view=styleguide`). Nothing scrolls. Nothing renders below the fold. Fix any density regressions that break the contract.

### Deferred — tracked but not worked on until triggered

8. **`agent.sphere` field + engine schema** — adds a real sphere field on agents to replace the CSS-layer reach→sphere mapping. Trigger: creation-sphere content ships, or an encounter/template needs sphere as an independent axis from reach.
9. **TopBar redesign** — awaiting Claude Design spec. Tokens/type only applied in v1.
10. **AgentDetail modal redesign** — awaiting Claude Design spec. Tokens/type only applied in v1.
11. **RightRail redesign** — awaiting Claude Design spec. Tokens/type only applied in v1.
12. **InterventionModal redesign** — awaiting Claude Design spec. Tokens/type only applied in v1.

---

## Phase dependencies

```
                 ┌──────────────────────┐
                 │ 1. Tokens foundation │
                 └──────────┬───────────┘
                            │
                 ┌──────────▼──────────┐
                 │ 2. Typography floor │
                 └──────────┬──────────┘
                            │
                 ┌──────────▼──────────┐
                 │ 3. Primitives       │
                 └────┬────────────┬───┘
                      │            │
             ┌────────▼───┐  ┌─────▼─────┐
             │ 4. Activity │  │ 5. Sphere │  (parallel after 1)
             │    Icon     │  │   Icon    │
             └────────┬───┘  └─────┬─────┘
                      │            │
                      └──────┬─────┘
                             │
                 ┌───────────▼────────────┐
                 │ 6. Thread panel redesign │
                 └───────────┬────────────┘
                             │
                 ┌───────────▼────────────┐
                 │ 7. Viewport audit      │
                 └────────────────────────┘
```

- **1 → 2 → 3** are strictly sequential (each needs the previous).
- **4 and 5** can run in parallel after **1**. They don't need **2/3** — their only dependency is the `--sphere-*` and `--text-*` tokens.
- **6** consumes **3, 4, 5** — it's the first composition.
- **7** is the final gate; it can't start until **6** lands.

**Parallel-safe pairs** for CC (for 2-worktree planning):
- **1 + nothing** (foundation, must land first alone)
- **4 + 5** after 1 lands
- **6 + nothing** (touches the panel others don't)
- **7 + nothing** (audit pass)

---

## Three-pillar breakdown

The visual overhaul is UI-led by design. Engine and Content work is minimal and additive, documented here so the Three-Pillar Rule is satisfied.

### Engine
- **Issue 1 only.** Add no new runtime behavior; only widen `src/index.css` and move fonts to local `@font-face`. Zero changes to tick phases, resolution, graph types, or traces.
- **Deferred issue 8** is where an `agent.sphere` field lands if/when needed.
- **No NFP compliance changes.** Constants are CSS tokens, not runtime values; tracing unchanged; PRNG unchanged; fail-soft unchanged.

### Content
- **No new content in this project.** Encounter templates, prose tables, attachment content are untouched. The design system does not change what the game says — only how it looks saying it.
- The Thread panel redesign preserves the existing `strategicSummary` / `activityLabel` / `encounterPool` data surfaces — these are content-fed and continue to flow through their current producers.

### UI
- **Issues 1–7 all live in the UI pillar.** Full-stack UI work: tokens (1), typography migration (2), primitives (3), icon components (4, 5), panel composition (6), viewport audit (7).
- **Player-facing display:** Thread panel gains sphere-colored left borders, activity icons, action chip styling. Every other panel inherits new type and token colors but keeps current data layout.
- **Debug inspection:** `?view=styleguide` gets the new primitives added to it (issue 3).
- **Visual presence:** The hex map itself (HexMapV2 terrain, signifiers, fog shader) is out of scope. Overlay chrome (labels, panels on top of the canvas) inherits new tokens.

---

## NFP Compliance

| NFP | Status | Notes |
|-----|--------|-------|
| 1. Tunability | **PASS** | Every visual value is a CSS custom property in `--sphere-*`, `--text-*`, `--space-*`, etc. No hex codes or px values buried inline after issue 2 completes. |
| 2. Inspectability | **PASS (no change)** | This project emits no new traces and removes none. `?view=styleguide` becomes more useful because primitives live there. |
| 3. Determinism | **PASS (no change)** | No runtime logic. CSS is pure. |
| 4. Fail-soft | **PASS** | Missing `--sphere-*` token on an unknown sphere name falls back to CSS `initial` — the agent renders ungoldened instead of crashing. `SphereIcon` should accept unknown sphere strings and no-op rather than throw. |
| 5. Narrative over mechanical | **PASS** | The visual language is prose-first by construction (Cinzel display, italic flavor text, progress bands with prose labels instead of numbers). Reinforces `feedback_prose_first_ui.md`. |
| 6. Additive | **PASS** | Nearly pure addition — new tokens, new primitives, new icon components. Thread panel is the one refactor; old `ThreadsPanel.tsx` data flow is preserved, only the presentation shell swaps. |
| 7. Performance budget | **PASS with note** | 16px floor means denser screens lose rows visible at once. User has explicitly endorsed this (`"everything should grow"`). Viewport contract audit (issue 7) catches any regression that breaks the 1920×1080 no-scroll rule. Sphere glyphs render inline SVG; at ~50 retinue rows this is well under budget. |

---

## Default decisions

Locked in so CC doesn't need to ask:

1. **Reach → foundation sphere mapping is done in CSS**, not in data. A `[data-reach="iron"]` selector (or reach class) resolves to `var(--sphere-force)` via a single mapping rule. Shipping `agent.sphere` is deferred.
2. **Use the primitive SphereIcon**, not ink-on-vellum. Primitive is cheaper to render dozens at once and matches the existing repo's iconography pattern.
3. **Primitives live in `src/components/shared/`** alongside existing `Button.tsx`. No new `/design-system/` subtree — we don't need a third ownership boundary.
4. **Fonts move to local woff2** (`/public/fonts/` or `/src/fonts/`) per `@font-face` in `colors_and_type.css`. Drop the Google Fonts `@import` in `src/index.css`.
5. **Thread panel migration is in-place** — edit `src/components/Game/ThreadsPanel.tsx`, don't create `ThreadsPanelV2.tsx`. Old code gets replaced, not dualed.
6. **Styleguide view is the acceptance surface** for issues 3, 4, 5 — each component must render with sample data at `?view=styleguide` before the issue is Done.

---

## Wiring checklist (per `Docs/plans/wiring-checklist.md`)

- [ ] **Tokens (issue 1):** `src/index.css` — 12 sphere tokens, semantic type tokens, accent-gold-glow, local fonts.
- [ ] **Typography (issue 2):** Every `src/components/**/*.tsx` audited for hardcoded `fontSize`; replaced with token references.
- [ ] **Primitives (issue 3):** Exported from `src/components/shared/index.ts`; added to `?view=styleguide`.
- [ ] **ActivityIcon (issue 4):** Exported from `src/components/shared/`; consumed by Thread panel (issue 6) and available for future encounter/agent detail surfaces.
- [ ] **SphereIcon (issue 5):** Exported from `src/components/shared/`; consumed by Thread panel; reach-to-sphere CSS mapping rule lives with the tokens (issue 1) but SphereIcon accepts either reach *or* sphere names via a mapping helper.
- [ ] **Thread panel (issue 6):** `src/components/Game/ThreadsPanel.tsx` rewritten against primitives; existing `encounterPool`, `strategicSummary`, attention-mode, thread-strength surfaces preserved.
- [ ] **Viewport audit (issue 7):** `preview_resize 1920 1080` verification scripts added under `scripts/qa/` or a `QA.md` reference; every primary view captured.

---

## Trace categories

This project adds no new trace categories. Existing traces (encounter resolution, decision, balance events) flow through unchanged into the redesigned Thread panel.

---

## Fail-soft table

| Failure case | Fallback |
|--------------|----------|
| Unknown `sphere` name passed to `SphereIcon` | Render nothing (return null); log once in dev. |
| Unknown `kind` passed to `ActivityIcon` | Render nothing (return null); log once in dev. |
| Local font file missing | Browser falls back through `font-family` stack to system serif/sans. `@font-face` uses `font-display: swap`. |
| Reach value on agent doesn't match any known reach | CSS mapping has a default `--sphere-force` fallback to avoid uncolored borders. |
| Thread row receives agent with no `location` / `destination` | Existing ThreadsPanel fallback strings ("wandering", "no destination") preserved in the new shell. |

---

## Constants (issue 1 seed — not exhaustive)

New tokens to add to `src/index.css`:

```css
/* Foundation sphere tokens */
--sphere-force:   #b54a2a;  --sphere-force-bright:   #d66a44;
--sphere-matter:  #6b8e4e;  --sphere-matter-bright:  #8bb268;
--sphere-energy:  #d4a040;  --sphere-energy-bright:  #f0bd5e;
--sphere-life:    #4a8e5e;  --sphere-life-bright:    #68b27e;
--sphere-mind:    #4a6e8e;  --sphere-mind-bright:    #6890b2;
--sphere-spirit:  #7a4a8e;  --sphere-spirit-bright:  #9868b2;
--sphere-time:    #8e6e4a;  --sphere-time-bright:    #b29068;
--sphere-entropy: #4a4a5e;  --sphere-entropy-bright: #6868a0;

/* Creation sphere tokens (reserved for elder magic content) */
--sphere-chaos:    ...;  --sphere-chaos-bright:    ...;
--sphere-order:    ...;  --sphere-order-bright:    ...;
--sphere-light:    ...;  --sphere-light-bright:    ...;
--sphere-darkness: ...;  --sphere-darkness-bright: ...;

/* Semantic type tokens */
--type-display-xl: 600 1.9375rem/1.2 'Cinzel', serif;
--type-display-lg: 600 1.5rem/1.25 'Cinzel', serif;
--type-display-md: 500 1.25rem/1.3 'Cinzel', serif;
--type-section-label: 500 1rem/1 'Cinzel', serif; /* allcaps, letter-spacing 0.12em */
--type-body-prose: 400 1.0625rem/1.5 'Alegreya Sans', sans-serif;
--type-body: 400 1rem/1.45 'Alegreya Sans', sans-serif;
--type-body-small: 400 0.9375rem/1.4 'Alegreya Sans', sans-serif;
--type-flavor: italic 400 0.9375rem/1.4 'Alegreya Sans', sans-serif;

/* Glow & motion */
--accent-gold-glow: rgba(212, 160, 64, 0.14);
```

Exact hex values for creation spheres will be copied verbatim from `Design/Claudedesignhandooffs/threadbearer-design-system/project/colors_and_type.css`. Foundation values above are representative — CC must copy authoritative values from the same file during implementation.

---

## Rejected / explicitly out-of-scope

- ❌ **Kit copy-paste.** Don't wholesale replace `src/components/**` with `Design/Claudedesignhandooffs/**/*.jsx`. Kits are visual specs, not production components; the repo's existing Button, shared hooks, and state wiring must be preserved.
- ❌ **Stripping data surfaces from unspec'd panels.** TopBar/AgentDetail/RightRail/InterventionModal keep every data field they currently show. Only tokens and type migrate.
- ❌ **HexMapV2 palette changes.** Terrain colors in `paletteTheme.ts` stay. The note in `colors_and_type.css` labeling terrain tokens "⚠️ NOT AUTHORITATIVE" is correct — repo owns terrain.
- ❌ **Adding `agent.sphere` for coloring in v1.** Defer to issue 8. Use CSS mapping from reach instead.
- ❌ **New trace categories, new graph node types, new edges.** None of this project changes the engine surface.

---

## Open questions / trigger conditions for deferred issues

- Issue 8 (agent.sphere field) unblocks when creation-sphere content starts shipping, OR when a template needs sphere as an axis independent of reach.
- Issues 9–12 (TopBar/AgentDetail/RightRail/InterventionModal redesigns) unblock when Claude Design produces their respective component specs. User has stated these will be commissioned only after v1 ships successfully.

---

## Linear coordination

- Each issue below includes a **coordination block** with `Suggested model`, `Parallel-safe with`, `Mutex with`, `Codex review` lines per `Docs/plans/2026-04-13-linear-coordination-protocol.md`.
- All active issues land under Linear project **UI Visual Overhaul — Design System v1**.
- Per-issue plan docs live at `Docs/plans/2026-04-18-thr-XX-<slug>.md` and are linked from the Linear issue description.
- Issue 1 (tokens foundation) is promoted to **Ready for Dev** at project kick-off; all others sit in **Implementation Planning** until their dependencies clear.

---

## Success criteria

- `?view=styleguide` renders all primitives with sample data at 1920×1080, no scroll, correct tokens.
- `?view=game&seeded` renders with new Thread panel; all encounter-pool, strategic summary, attention mode controls still function.
- `?view=codex` inherits typography with no data regressions.
- `npx vite build` succeeds, `npx tsc --noEmit` clean, `npm test` green.
- Viewport audit passes at 1920×1080 — nothing scrolls, nothing below the fold.
- Local fonts load (no Google Fonts network dependency at runtime).

---

## Change log

| Date | What | Why |
|------|------|-----|
| 2026-04-18 | Plan created, 12 issues scoped | Kick off of Design System v1 adoption — replaces completed "UI/UX Design Infrastructure" project. |
