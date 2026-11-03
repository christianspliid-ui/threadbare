# Action proposal — Legibility 3, the Stage and the dialogs (THR-2124)

## intent_quote

> "get the design lane to focus on UI and UX improvements for the next period. specifically legibility and usability of the different UI modules: are we using tried and true ux patterns for how humans read UI panels..."

(Christian, chat, 2026-11-01. The ticket [THR-2124](https://linear.app/threadbare/issue/THR-2124) is one of four plan-doc tickets carved from the closed map THR-2114. Its body asks for: **Stage** — the title becomes the header's strongest text (Cinzel `--text-xl`, primary); the stakes line is the Now slot (Text, upright, primary); scene prose takes `--type-body-prose` instead of 16 px italic; the fixed 14 / 12 / 11 px sizes and Palatino go to tokens and the token faces; the drop cap becomes em-relative; the step column loses its frame (depth 4 → ≤ 2). **Dialogs** (choice, Chapter Ledger, Read the Threads, receipts, court, settings) — the title appears once, at the left edge; the question or news is one Now line; act comes last; fixed 11 / 14 px go to tokens; the choice dialog's inner panel loses its frame. A UX-review comment on the ticket adds that two Stage moments fill only the top half of the panel and that the review will judge this plan's result on them.)

## scope (what this plan does)

On the Stage: the encounter title (and the aftermath title) becomes Cinzel `--text-xl` in the veil's primary colour, without uppercase or letter-spacing. The stakes line becomes upright `--text-sm` primary. Scene paragraphs take `--type-body-prose`. The Palatino constant in five files is deleted and each use maps by role to Cinzel or Alegreya Sans. Every use of the undefined `--text-2xs` becomes `--text-xs`, and the 12 px legend glyph rises to `--text-xs`. The veil's columns stop painting a second surface inside the Stage panel. In the dialogs: `Modal.Header` becomes `--text-xl` with an optional kind line; Settings and the court move onto it; the receipt title matches; the choice dialog drops its repeated banner and its framed quote; Read the Threads' intro becomes an upright Now line. The debug bridge reports the Stage's fold and title, and each dialog's title count and alignment. Three canon pages record it.

## scope (what this plan does NOT do — explicit non-goals)

- No engine, type or data change.
- No new words; the only text change is that a title repeated as an eyebrow is drawn once.
- No change to `RevealCard` itself or to the ceremonies (MeetTheFirst, Remembrance, ThreadingRite).
- No change to the Stage's geometry (Law 57), the art column, the canonical flow (Law 38) or the card-face layout.
- No change to the Inspector (Legibility 2) or the rails and lists (Legibility 4).

## impact_class

Reversible

## evidence cited

- **Linear issue:** THR-2124
- **Vision premises invoked:** vault `Vision/taste-profile.md` ("Prose-first UI, no numbers visible"); art-led rule R1 (`Docs/plans/2026-10-31-art-led-ui-pass.md`)
- **UL terms touched:** none new (Stage, encounter, stakes line, Chapter Ledger, Read the Threads, Divine Court are existing terms)
- **Canon pages consulted:** `Docs/design-system/laws.md` (Laws 11, 31, 33, 37, 38, 45, 57), `typography.md`, `layout.md`, `layout-zones.md`; audits `2026-11-01-ui-panel-anatomy.md`, `-type-hierarchy.md`, `-text-positions.md`, `-modules-and-composition.md`, `-legibility-census.md`
- **Prior plan docs this builds on:** `Docs/plans/2026-11-02-thr-2122-legibility-shared-blocks.md` (merged), `Docs/plans/2026-11-03-thr-2123-legibility-inspector-pages.md`, `Docs/plans/2026-11-01-thr-2100-art-led-stage.md`, `Docs/plans/2026-11-01-art-led-dialogs.md`
- **Rejected approaches considered and dismissed:** defining `--text-2xs`; keeping Palatino; italic scene prose; a transparent Stage panel; a new DialogTitle component; editing `RevealCard`. All in the brainstorm companion.

## load-bearing decisions touched

None. Presentation only; no graph, cache, position or awareness decision.

## high-impact files touched (from Codesight)

None with 100 or more importers. `shared/Modal.tsx` and `shared/CardFace.tsx` are shared but under that bar; `Modal.Header`'s change is an optional prop plus one size.

## kill criteria

- If the new `getStage().anatomy.fold` reports any of title, Now, first scene line, first hand row or commit below the fold at 1920×1080 on the census route, the drop cap shrinks to 2.4em and the stakes margin tightens; if still folded, the prose size change is left out and the slice returns to the design lane.
- If a card name at `--text-lg` wraps to three lines, card names take Text 700 `--text-sm` instead.

## explicit user sign-off

Not required (Reversible).

## author notes for the judge

- The ticket says "the drop cap becomes em-relative". Measured, it already is (`fontSize: '3.4em'`, `EncounterVeil.tsx:2535`); the 54.4 px the census saw is 3.4 × 16. The plan keeps 3.4em and changes its face, and states this in the substrate list rather than claiming a change.
- The ticket says "fixed 14 / 12 / 11 px". Measured: 11 px is `var(--text-2xs, 11px)` with `--text-2xs` undeclared; 12 px is `LEGEND_GLYPH_PX`; the 14 px the census saw on cards is the price and odds pip size, `CARD_COST_PIP_PX = 14` and `CARD_ODDS_PIP_PX = 14` (`CardFace.tsx:146, :148`), Law 11 glyph constants at the floor, which the plan leaves alone because glyph sizes are meant to be named constants. One glyph sits below the floor (`OddsPips … size={10}`, `CardFace.tsx:662`); the plan raises it to `CARD_ODDS_PIP_PX`.
- Decision 6 (the choice dialog stops using RevealCard's Title, Banner and Quote zones) is the largest visible change in the dialogs. It follows Text positions § 2 (the choice dialog's centred title moves to the left edge) and Modules § 3 (its inner panel loses its frame). If you read the choice dialog as a ceremony (where centring is allowed), say so.
- I did not run a browser this run. The fold and title claims are gated in the Done-when through the new reader.
