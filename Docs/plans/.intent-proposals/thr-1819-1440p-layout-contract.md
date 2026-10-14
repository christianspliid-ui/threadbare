# Action proposal — THR-1819, the 1440p layout contract

Plan doc: `Docs/plans/2026-10-14-thr-1819-1440p-layout-contract.md`
Brainstorm companion: `Docs/plans/2026-10-14-thr-1819-1440p-layout-contract-brainstorm.md`

## intent_quote

From the THR-1819 issue description (Christian, 2026-10-11 UI review):

> "design primarily for minimum 1440p landscape"

The issue's required design output, verbatim:

> 1. Primary target 2560×1440, supported floor 1920×1080 landscape (portrait and <1920 are out of scope). Update INDEX.md, layout.md, layout-zones.md, Law 33, CLAUDE.md viewport line, the frontend-ui skill.
> 2. A layout token set that scales at 1920 / 2560 / 3440: `--rail-left-w`, `--inspector-w`, `--sidebar-w`, `--tooltip-max-w`, `--toast-w`, plus the missing `--bp-*` and panel-padding steps.
> 3. A type scale with real steps and a root step-up at 2560 (e.g. base 18 → 20), and a ratchet that only lets the literal-font-size count go down.
> 4. One modal height rule (recommend 85vh) applied everywhere.

> **Done when:** plan doc in `Docs/plans/` names every token with its value at each breakpoint and every file that adopts it, and the 75/85vh conflict is resolved in all four places.

THR-1823 map body (standing preference, human gate satisfied via chat review 2026-10-11):

> 2560×1440 landscape is the primary screen; 1920×1080 is the supported floor.

The spawning (attended, 2026-10-14) session's settled brief adds: three `min-width` blocks at 1920 / 2560 / 3440 with `--bp-*` retired in favour of one TS module; root 16 px → 18 px at ≥ 2560; one modal height rule of 85vh; one shared ratchet script owned by THR-1821, to which this ticket contributes the literal-font-size pattern and its measured baseline.

## scope (what this plan does)

It designs the layout contract the new frame, Inspector and Stage are built on. The plan:
- sets six type steps with no two adjacent steps closer than 2 px, with prose one step above UI text and the 16 px floor at 1080p;
- adds a root step-up of 112.5% at ≥ 2560 wide (with a 1200 px minimum-height guard);
- names every frame width token (top bar, god rail, Ledger rail, fold strip, Inspector docked/wide/full columns, Stage window/left column/gutter) with its value in four tiers, and every text-container token (tooltip, hover card, toast, Stage compact column, prose measure, panel padding) in rem;
- deletes `--sidebar-width` for `--rail-right-w`;
- adds `--modal-max-h: 85vh` and lists every code and doc place that moves to it;
- specifies `src/components/shared/layoutContract.ts` (breakpoints and token table for JS) with a CSS↔TS parity test and a map-share budget test;
- gives each of today's fixed widths a disposition;
- lists every adopting file;
- writes the Law 33 amendment text and the CLAUDE.md viewport line;
- adds a `getLayoutContract()` debug accessor;
- specifies the `literal-font-size` ratchet pattern with a measured baseline of 198.

## scope (what this plan does NOT do — explicit non-goals)

- No dialog size tiers (S/M/L/XL) — THR-1820, which this blocks.
- No ratchet script — THR-1821 owns `scripts/check-ui-debt.ts`; this plan only contributes a pattern.
- No migration of existing literal font sizes (the god rail and encounter shells are rebuilt by the frame / Stage builds; brief decision 10).
- No face changes (Alegreya for prose, Cinzel ≥ 22 px rules) — the map's type-and-icons plan doc; this plan sets sizes, line-height and measure only.
- No frame, Inspector or Stage build — their tokens are defined, their components are not.
- No work below 1920 px wide, no portrait, no 4K-at-100% tier.
- No `useLayoutTier()` hook (no consumer yet).
- No Codex sidebar, DebugPanel or SettingsPanel width changes (Codex placement undecided; dev surface; THR-1820 tier).
- No change to HexMapV2 label sizes.

## impact_class

High-risk (corrected by the intent judge from the author's Reversible, 2026-10-14). The plan rewrites the CLAUDE.md viewport line and edits `.claude/skills/frontend-ui/SKILL.md` and `Docs/canon/verification-gates.md`. The code side is reversible: CSS values, a small TS module, docs and a law text that encodes an existing ruling. Visual change at 1080p: +1 px on `--text-sm`, +2 px on `--text-base`, +1 px on lg and 2xl; rails 360/360 → 320/340.

## evidence cited

- **Linear issue:** THR-1819 (blocks THR-1820; related THR-1823 map, THR-1827, THR-1828, THR-1831, THR-1833)
- **Vision premises invoked:** direction B "The Map Is the Table" (THR-1823 map body); the god reads the world
- **UL terms touched:** none new (god rail, Ledger rail, Inspector, Stage are the decision records' terms)
- **Canon pages consulted:** `Docs/design-system/laws.md`, `INDEX.md`, `layout.md`, `layout-zones.md`, `typography.md`, `tokens.md`; `Docs/canon/design-governance.md`; `Docs/canon/verification-gates.md`
- **Prior plan docs / decision records this builds on:** `Docs/audits/2026-10-12-thr-1828-screen-frame-decision.md`, `Docs/audits/2026-10-11-thr-1827-inspector-decision.md`, `Docs/audits/2026-10-14-thr-1829-encounter-stage-decision.md`, `Docs/audits/2026-10-13-thr-1833-type-system-decision.md`, `Docs/audits/2026-10-11-thr-1831-map-chrome-decision.md`, `Docs/plans/2026-10-02-thr-1586-dialogue-palettes-by-context.md` (the index.css parity-test pattern)
- **Rejected approaches considered and dismissed:** none of CLAUDE.md's rejected approaches apply; plan-level alternatives are in the brainstorm companion

## load-bearing decisions touched

None of CLAUDE.md's load-bearing architectural decisions (all engine/graph). The plan touches no engine cache, no graph, no world mutation.

## high-impact files touched (from Codesight)

None ≥ 100 importers. Measured by grep: `Tooltip.tsx` 84, `Modal.tsx` 29, `types/detailPage.ts` 24, `types/tooltip.ts` 13. `src/index.css` is imported once, from `main.tsx`, but its type scale is global: every surface at 1080p shifts by 0–2 px. The plan's kill criteria and Done-when browser checks cover that visual blast radius.

## kill criteria

- The 1080p main view gains a cut-off panel, row or button after the scale change → fix that surface, never revert to 1 px steps.
- Christian still finds the chrome small at 2560×1440 → raise the root step (one number).
- A later frame addition fails the budget test → the addition yields; the floors are THR-1828's.
- A 2560×1080 player reports small type → drop the height guard.

## explicit user sign-off

The CLAUDE.md viewport line, the Law 33 amendment and the frontend-ui skill edits all encode Christian's 2026-10-11 ruling, recorded on THR-1823 under "Standing preferences and prior rulings":

> 2560×1440 landscape is the primary screen; 1920×1080 is the supported floor.

The map's direction is recorded there as "human gate satisfied via chat review 2026-10-11", and THR-1819's own design output names "Law 33, CLAUDE.md viewport line, the frontend-ui skill" as edit targets. The 85vh value is existing Law 33 canon. The 2560×1440 capture duty is gate calibration, which CLAUDE.md assigns to the agent.

## author notes for the judge

- The issue suggested "base 18 → 20" as the *root step-up* example. The brief settled 16 → 18 px root (×1.125), which takes UI text 18 → 20.25 at 1440p. The issue's example is satisfied in spirit, and the brief governs.
- The issue lists `--sidebar-w`; the plan names the rail family `--rail-left-w` / `--rail-right-w` / `--rail-strip-w` (the spawning session's list used `--rail-right-w`) and deletes `--sidebar-width`. The frame decision's working name `--sidebar-w` is superseded in the plan text.
- The issue asks for "the missing `--bp-*` and panel-padding steps". The brief retires `--bp-*` (CSS custom properties cannot drive media queries) for a TS module. The plan also retires the promised 2560/3440 panel-padding steps, because the root step already scales a rem padding ×1.125 and a second step would double-scale. Both are doc corrections the issue's own problem statement names ("Docs promise tokens that do not exist").
- "75/85vh conflict resolved in all four places": the issue's four are Law 33 (already 85vh, unchanged value), `Modal.tsx`, CLAUDE.md and the frontend-ui skill. The plan also lists `ScryOverlay`, two literal-85vh dialogs, the StyleGuide copy and five more docs. The skill edit may be refused by the auto-mode classifier; the plan's fallback is a linked follow-up issue.
- One addition beyond the brief's literal text: the root step-up has a `min-height: 1200px` guard. It changes nothing on the three supported screens and is reported to the parent session as a veto point.
- The ratchet registration is conditional on THR-1821's script being on `main`. Otherwise a comment on THR-1821 carries the spec, which keeps 1819 from being blocked by 1821 (they are parallel-safe by the brief).
