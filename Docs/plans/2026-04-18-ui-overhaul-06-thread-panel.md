# Issue 6 — Thread / Retinue Panel Redesign

**Parent project:** [UI Visual Overhaul — Design System v1](./2026-04-18-ui-overhaul-project.md)
**Phase:** 6 of 7 (depends on 3, 4, 5)
**Suggested model:** `opus`
**Parallel-safe with:** (none — this is the keystone composition)
**Mutex with:** Issue 7 (viewport audit waits for this to land)
**Codex review:** **required** — touches a 849-line existing file with complex data surfaces; regressions are easy

---

## Goal

Rewrite `src/components/Game/ThreadsPanel.tsx` against the new primitives, ActivityIcon, SphereIcon, and sphere-colored left border treatment per `Design/Claudedesignhandooffs/new-hexmap-sidebars/project/src/Threads.jsx`.

**This is the only component where information architecture is redesigned in this project.** Every data surface the current panel exposes must continue to work — they migrate into the new visual shell.

## Authoritative sources

- **Visual spec:** `Design/Claudedesignhandooffs/new-hexmap-sidebars/project/src/Threads.jsx` (197 lines)
- **Existing implementation (preserve all behavior):** `src/components/Game/ThreadsPanel.tsx` (849 lines)
- **Consumed primitives:** `SectionHeading`, `Card`, `ListRow`-ish row layout (the thread row is a bespoke composition, not a direct `ListRow`), `Button`
- **Consumed icons:** `ActivityIcon`, `SphereIcon`
- **Sphere mapping:** `sphereFromReach()` from issue 5

## Data surfaces that MUST be preserved

Audit the current `ThreadsPanel.tsx` before rewriting. At minimum the new shell must surface:

1. **Agent identity** — name, portrait placeholder
2. **Location + destination** — current and heading (shown as `location · destination` or destination only)
3. **Activity** — what the agent is doing (→ `ActivityIcon`)
4. **Bound sphere/reach** — colored left border + inline SphereIcon
5. **Encounter pool** — the "Pool X/Y" button and its modal (raw vs grouped view, template names, reach/type/threat/steps/ticks/reward meta, score + completion)
6. **Strategic summary** — the badge with glyph + color-mix background
7. **Attention mode toggle** — Pause / Auto button (refactor to the new `AutoToggle` styling from Threads.jsx)
8. **Thread strength bar** — 2px bar with strengthen/weaken/break animations
9. **Encounter badge / StepDots** — in-flight encounter progress
10. **Zoom-to-location button** — the magnifier-plus icon on each row
11. **Category sections** — agent, location, faction, army, artifact (preserve the 5 sections)
12. **Selection state** — selected row highlight + accent

If you can't tell whether something in the current file is load-bearing, **preserve it**. Dead code removal is out of scope here.

## Row layout (from Threads.jsx spec)

Bespoke composition — not a plain `ListRow`:

```
┌──────┬─────────────────────────────────────────────────┐
│  52  │  Name (Cinzel 17 upper) · ActIcon · Zoom · Sphr │
│  px  ├─────────────────────────────────────────────────┤
│ port │  Destination (text-tertiary, truncated)         │
│      ├─────────────────────────────────────────────────┤
│      │  [ActionChip ⇢ label]           [Auto toggle]   │
└──────┴─────────────────────────────────────────────────┘
   ▌ 3px sphere-colored left border (bright when selected)
```

Three rows in a flex column on the right of the 52px portrait.

### Where the preserved surfaces go

- **Encounter pool button** — goes in the ActionChip slot OR as a secondary chip below the destination line. Choose whichever matches the density feel — if both must coexist, stack them vertically in row 3.
- **Strategic summary badge** — floats to the right of the name row OR lives inline with the ActionChip row. Prefer name-row trailing (near zoom button) so it scans alongside identity.
- **Thread strength bar** — a 2px band below the entire row, full width, below the 3 content rows (before the row separator). Animations from the current implementation preserved.
- **StepDots / encounter badge** — inline with ActionChip when an encounter is active (the chip shows the encounter step progression instead of the default action label).

Use `SectionHeading ornamental count={agents.length}` for each of the 5 category headers (agent / location / faction / army / artifact).

## Color binding

- Row left border: `3px solid var(--sphere-<sphere>)` using `sphereFromReach(agent.reach)` or `agent.sphere` if already present. When `selected`, use `-bright` variant.
- Background: default `var(--bg-surface)`; hover `var(--bg-hover)`; selected `var(--accent-gold-glow)` + `outline: 1px solid var(--border-accent)`.
- Fallback: if neither reach nor sphere resolvable → use `var(--accent-gold-dim)` as left border.

## ThreadPortrait

Port `ThreadPortrait` from `Threads.jsx`:

- 52px SVG with sphere-tinted radial-gradient disc, gold ring, initials (2 letters uppercase, Cinzel display), deterministic rotation by `id` hash.
- If the current panel has its own portrait system (`<AgentPortrait>` or similar), keep both available — use the new `ThreadPortrait` here but do not retire the old one in this issue.

## AutoToggle

Port from `Threads.jsx`. Replace whatever the current attention-mode toggle is styled as. Must still wire to the existing `onToggleAttentionMode` handler (inspect props in current file).

## ThreadActionChip

Port from `Threads.jsx`: gold italic text inside `bg-raised` pill with `⇢` prefix. Replaces whatever text chip currently shows the action label.

## Encounter Pool modal

- **Keep the existing modal implementation** (`EncounterPoolModal` in the current file). Apply tokens and type only. Do NOT redesign its IA — it's rich, functional, and not covered by the design brief.
- If any modal content uses hardcoded font sizes, migrate to tokens as part of issue 2's sweep (if issue 2 hasn't covered it, cover it here).

## What to do — step-by-step

1. **Audit pass.** Before writing code, list every prop that `ThreadsPanel` accepts and every piece of state it surfaces. Produce a short checklist in the commit message or a tmp file. Cross-check against the "Data surfaces that MUST be preserved" list above. Anything discovered that isn't on that list: **preserve by default**.
2. **Port sub-components.** Add `ThreadPortrait`, `ThreadActionChip`, `AutoToggle` as local components at the top of `ThreadsPanel.tsx` (or split into neighboring files — author's choice, but prefer local at first unless sizing forces split).
3. **Rewrite row layout.** Replace the current `CompactThreadRow` body with the 3-row flex composition. Preserve all event handlers, refs, and animation hooks.
4. **Rewrite section headings.** Swap TIER_COLORS usage (from `uiColorPalette`) for `SectionHeading ornamental`. Keep the category structure.
5. **Apply color binding.** Replace whatever `accentColor` computation exists with `sphereFromReach(agent.reach)` → `var(--sphere-<name>)`.
6. **Test at `?view=game&seeded`.** Every row renders. Click a row — selection works. Click encounter pool button — modal still opens. Attention-mode toggle still toggles. Zoom button still calls `onCenterOnHex` / `onZoomToLocation`.
7. **Snapshot for the user.** Take a screenshot via Claude-in-Chrome at 1920×1080 to include in the completion comment.

## What NOT to do

- Don't delete data fields from the panel because the mockup doesn't show them. User directive: _"i don't want you too look at a design system mockup that is made without understanding the backend systems, and think, oh now i need to delete half of what the component exposes."_
- Don't redesign the encounter pool modal.
- Don't refactor props of `<ThreadsPanel>` itself — consumers in `GameView.tsx` must continue calling it with the same signature.
- Don't rename `ThreadsPanel` or create a `ThreadsPanelV2`. Edit in place.
- Don't remove the 5-category grouping (agent/location/faction/army/artifact). That structure is load-bearing for the player's mental model.

## Acceptance criteria

- [ ] `?view=game&seeded` renders the panel with new visual language.
- [ ] All 5 categories present, each with ornamental SectionHeading + count.
- [ ] Each row has: 52px portrait, name (Cinzel uppercase), activity icon, zoom button, sphere icon, destination line, action chip, auto toggle, sphere-colored left border.
- [ ] Thread strength bar still animates on strengthen/weaken/break.
- [ ] Encounter pool button opens modal; modal still shows raw vs grouped view.
- [ ] Strategic summary badge still present.
- [ ] Selection visual still works (gold glow + accent border).
- [ ] Prop signature of `ThreadsPanel` unchanged.
- [ ] `npx tsc --noEmit` clean.
- [ ] `npx vite build` succeeds.
- [ ] `npm test` green (run Threads-related tests explicitly if any exist).
- [ ] Screenshot attached to completion comment.
- [ ] Commit message includes `Fixes THR-XX`.

## Three-pillar

- **Engine:** None — no orchestrator, graph, tick, or trace changes.
- **Content:** None — no template or prose changes.
- **UI:** Entire scope — visual rewrite of the keystone panel.

## NFP

| NFP | Status |
|-----|--------|
| Tunability | PASS — all colors, sizes, spacing via tokens. |
| Inspectability | PASS — same props, same data flow; tracing untouched. |
| Determinism | PASS — ThreadPortrait deterministic by agent id hash. |
| Fail-soft | PASS — unknown sphere → fallback color; missing destination → existing fallback strings; missing encounter → chip shows action label. |
| Narrative over mechanical | PASS with note — prose-first row (action chip italic, destination as location words, no raw numbers except Pool X/Y which is preserved intentionally). |
| Additive | PASS with note — existing `CompactThreadRow` body is replaced, not deleted from a shared abstraction. All data surfaces preserved. |
| Performance | PASS with note — 50+ rows × new SVG portraits + sphere icons. Verify frame rate at `?view=game&seeded`; if regression, memoize ThreadPortrait SVG by id. |

## Wiring

- Update `Docs/plans/wiring-checklist.md`: Thread panel now depends on shared primitives + icons.
- Run the CLI smoke: `npm run cli -- --seed 42 -- run 10 then agents` — confirms engine still emits agents the panel consumes.
- After merge: take 3 screenshots at `?view=game&seeded` (full panel, single row hovered, single row selected) and attach to Linear issue.
