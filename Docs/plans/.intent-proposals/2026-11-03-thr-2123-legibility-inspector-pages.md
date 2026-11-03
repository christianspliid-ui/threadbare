# Action proposal — Legibility 2, Inspector pages (THR-2123)

## intent_quote

> "get the design lane to focus on UI and UX improvements for the next period. specifically legibility and usability of the different UI modules: are we using tried and true ux patterns for how humans read UI panels..."

(Christian, chat, 2026-11-01. The ticket [THR-2123](https://linear.app/threadbare/issue/THR-2123) is one of four plan-doc tickets carved from the closed map THR-2114. Its body asks for: `SubjectHeader` at wide and Full with the kind label and name above the portrait, left-aligned, and the where-line and chips under it; the wide title's 2.5rem becoming `--text-2xl`; one Now slot under Who and above Act (the R5 highlight at `--text-lg` or the R4 bond strip, moved from the top of the main column; pages with no deciding state leave it empty); frames on the person page from depth 4 to ≤ 2; and the above-the-fold check at 1920×1080 swept over every kind at `?view=inspector-lab`.)

## scope (what this plan does)

The plan re-orders and re-weights the Inspector page at docked, wide and Full. The header at wide and Full puts the kind label and name above the picture, left-aligned, at `--text-2xl`. A Now slot, chosen in the UI from the existing view model (the highlight first, the bond strip as fallback), renders under the header and above the Act row. The page stops drawing a second frame inside its host at docked and wide. The Act and *In this land* headings lose gold. Page slots are spaced on the token rhythm. A fold report on the debug bridge lets the Done-when check anatomy § 4 on every kind. Three design-system canon files record the order. Touched: `SubjectHeader.tsx`, `InspectorPage.tsx`, `InspectorParts.tsx`, one new test, three canon pages.

## scope (what this plan does NOT do — explicit non-goals)

- No engine, type or data-registry change. Section orders stay as they are, and no `slot` field is added.
- No word changes.
- No change to the Stage, dialogs, rails, lists or hover tier (Legibility 3 and 4).
- No change to the docked header layout (thumbnail beside name).
- No change to the gold god-title line under a mortal shape (identity, not a section).
- No change to Section.tsx block styles (Legibility 1 shipped them).

## impact_class

Reversible

## evidence cited

- **Linear issue:** THR-2123
- **Vision premises invoked:** vault `Vision/taste-profile.md` ("Prose-first UI, no numbers visible"); art-led rule R1 (`Docs/plans/2026-10-31-art-led-ui-pass.md`)
- **UL terms touched:** none new (Inspector, The First, Mandate, ambition are existing terms)
- **Canon pages consulted:** `Docs/design-system/laws.md`, `layout.md`, `layout-zones.md`, `entity-visual-header.md`; audits `2026-11-01-ui-panel-anatomy.md`, `-type-hierarchy.md`, `-text-positions.md`, `-modules-and-composition.md`, `-legibility-census.md`
- **Prior plan docs this builds on:** `Docs/plans/2026-11-02-thr-2122-legibility-shared-blocks.md` (merged), `Docs/plans/2026-10-31-art-led-ui-pass.md`
- **Rejected approaches considered and dismissed:** a registry `slot: 'now'` field (widens into types and data for a choice the existing fields express); bond-first precedence; stacking both lines; the host dropping its frame instead of the page; the name overlaid on the portrait. All are in the brainstorm companion.

## load-bearing decisions touched

None. The plan is presentation-only. It touches no graph, engine cache, position or awareness decision.

## high-impact files touched (from Codesight)

None. The three inspector components each have fewer than 10 importers; no file with 100 or more importers is touched.

## kill criteria

- If the Now slot pushes the Act row or the tab row below the fold on any kind's docked page at 1920×1080 (the new fold report shows `act` or `tabs` false), the Now sentence clamps to two lines with the full text in its tooltip.
- If a playtest shows testers read the wide portrait before the name, the order goes to Christian (anatomy § 7), not silently back.

## explicit user sign-off

Not required (Reversible).

## author notes for the judge

- Decision 1 (highlight over bond) is the one judgement call. Anatomy § 1 says "R5's highlighted line, or R4's bond strip when the tie to the god is the news". I read "is the news" as "when nothing else is". On The First's page the bond is permanent and the ambition changes. If you think this is a fork in what the game means, say so: the lane would reserve it for Christian instead.
- The ticket body says "frames: the person page goes from depth 4 to ≤ 2". The census counted the host aside and the page Panel as two levels for one surface. The plan removes the inner one; the highlight is the card. I did not re-measure in a browser this run, so the Done-when asserts the inline styles in a test and measures depth in the browser evidence.
- The Act heading was already hidden at docked (`compact`); only wide and Full drew it in gold.
