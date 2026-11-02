# Action proposal — Legibility 1, the shared blocks (THR-2122)

## intent_quote

> "get the design lane to focus on UI and UX improvements for the next period. specifically legibility and usability of the different UI modules: are we using tried and true ux patterns for how humans read UI panels..."

(Christian, chat 2026-11-01, recorded in `.claude/skills/design-lane/SKILL.md` § Period focus.)

> "I think we have reached a state of the game where you can probably iterate and progress designs without me in many situations, for example where we have agreed on a wayfinder map."

(Christian, chat 2026-09-25 — the design lane's mandate.)

The ticket (THR-2122) was filed by the design lane's close of the map THR-2114 as the first of four plan docs. Its Done-when: "A plan doc in `Docs/plans/` is handed off to Ready for Dev."

## scope (what this plan does)

Plans one UI slice: `src/components/shared/Section.tsx` moves to the spacing tokens and the decided type ladder, its facts block (`panel` kind) becomes a two-column grid with right-aligned labels, its section label becomes the one heading implementation that `SectionHeading` and the hand's "Your cards" heading delegate to (count inline, "Retinue · 3"), and Detail sections stop drawing gold headings. It adds one CSS token (`--measure-ui: 26em`) with a TS mirror, and writes the decided rules into four design-system canon files (typography, layout, primitives, component-selection).

## scope (what this plan does NOT do — explicit non-goals)

- No per-page anatomy (Who / Now / Act / Detail / Out order per Inspector kind) — Legibility 2 (THR-2123).
- No Stage, dialog, Ledger rail or god-rail frame removals (depth 4 → 2) — Legibility 3 and 4 (THR-2124, THR-2125).
- No change to the Act-row and index headings' gold in `InspectorParts.tsx` (not Detail sections; Legibility 2).
- No tile caption change (tiles are cards).
- No engine or type change; no sentence or tooltip copy change.
- No new review probe or ratchet (pipeline freeze THR-1946 until 2026-11-13).
- Does not revisit the decided rules (type ladder, text positions, blocks) — they passed their veto windows.

## impact_class

Reversible — a style-only UI change on shared primitives, one PR, revertible; no data or save-format change.

## evidence cited

- **Linear issue:** THR-2122 (map THR-2114; decisions THR-2118, THR-2119, THR-2120)
- **Vision premises invoked:** none changed; period focus on legibility
- **UL terms touched:** none new (Inspector, Stage, god rail, Ledger rail are existing UL)
- **Canon pages consulted:** `Docs/design-system/typography.md`, `layout.md`, `primitives.md`, `component-selection.md`, `laws.md`
- **Prior plan docs this builds on:** `Docs/audits/2026-11-01-ui-type-hierarchy.md`, `Docs/audits/2026-11-01-ui-text-positions.md`, `Docs/audits/2026-11-01-ui-modules-and-composition.md`, `Docs/plans/2026-10-31-art-led-ui-pass.md` (R1–R8)
- **Rejected approaches considered and dismissed:** an exported `Block` primitive family (THR-2120: duplicates `Section`); flipping the engine `gold: true` sites (engine-scope diff for the same result); a parent-owned `gap` (several hosts would each need it)

## load-bearing decisions touched

None. No graph, engine cache, position or awareness logic is involved.

## high-impact files touched (from Codesight)

None ≥100 importers. `shared/Section` has 5 non-test importers; `shared/SectionHeading` 6; `index.css` is global but only gains one token; `layoutContract.ts` gains one constant.

## kill criteria

If the docked person Inspector at 1920×1080 scrolls where it did not before because of the 24 px gaps (Law 33), the between-block distance drops to `--space-5` in the shell's one line (THR-2120's own fallback). If a playtest shows players miss sections whose 16 px headings sit over 18 px body, THR-2118 § 5's fallback (label rule at `--text-sm`) applies.

## explicit user sign-off

Not required (Reversible).

## author notes for the judge

- Four small decisions are made in the plan itself (pole word in the label column; no per-row rule in facts; event-card framed only when clickable; "Retinue · 3" count form). Each applies an already-decided rule; they are listed in the plan and will go to Christian as veto lines.
- Measurements quoted in the plan were taken on `main` @ `fd15490d` in this run. The census's "39 px literals" figure differs from my grep (48) because my pattern also counts size literals; the plan says so.
- The "Canon pillar" section is the docs half of the ticket's scope; it lands in the executor's PR, not in this plan-doc PR.
