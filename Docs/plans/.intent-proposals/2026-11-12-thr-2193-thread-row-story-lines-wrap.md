# Action Proposal — THR-2193 thread row story lines wrap

## intent_quote

Christian, chat 2026-11-01 (the design lane's period focus, recorded in `.claude/skills/design-lane/SKILL.md`):

> "get the design lane to focus on UI and UX improvements for the next period. specifically legibility and usability of the different UI modules: are we using tried and true ux patterns for how humans read UI panels..."

The ticket (filed by the weekly UX review 2026-11-12, THR-2193), its design question verbatim:

> "Should the rail's story lines wrap to a second line (Law 57), with a two-line clamp as the limit? Or should they stay on one line with a shorter, authored short form of the phrase? Either answer is small to build. The choice is whether rail rows may grow taller."

Its Done-when verbatim:

> "The *Mid-game notables* (or *Mid-game table*) frame on the next ux-review shows The First's doing line with the whole phrase readable (what he is working on, not "raising a p…"), and his latest result line readable without hovering, while the rail still fits 1920×1080 without page scroll."

## scope (what this plan does)

Decides the ticket's design question (wrap, capped at 3 lines, over authored short forms) and specifies the
UI change in `src/components/Game/ThreadsPanel.tsx`: one exported constant and one shared clamp style replace
`truncate` on the thread row's five prose lines (doing, appointment, stakes/result, location claim-status,
sustained-control status), keeping the progress word unbroken (THR-1962) and the 24 px hit area (Law 46),
and correcting code comments that cite Law 49 for the one-line shape.

## scope (what this plan does NOT do — explicit non-goals)

- No authored short forms or any new player-facing words.
- No change to row 2's `secondaryInfo` line or to the row name (already wraps).
- No change to rail widths (settled in THR-1828).
- No change to the tooltip content (it still carries the whole sentence).
- No engine, data or type change.

## impact_class

Reversible.

## evidence cited

- **Linear issue:** THR-2193
- **Vision premises invoked:** the god reads mortals' lives from the table (`game-design-direction`)
- **UL terms touched:** none new (Thread row, Threads rail, The First — existing)
- **Canon pages consulted:** `Docs/design-system/laws.md` (Laws 29, 33, 46, 49, 55, 57), `Docs/canon/rulebook-quick-reference.md`
- **Prior plan docs this builds on:** THR-2125 R2.3 / THR-2165 (row name wraps), THR-1962 (progress word never cuts), THR-1828 (rail widths)
- **Rejected approaches considered and dismissed:** authored short forms (content table that drifts; Law 57 already decides), no cap (freak sentence), cap 2 (estimated to cut longer result lines), widen rail (settled elsewhere)

## load-bearing decisions touched

None. Presentation-only change in one component.

## high-impact files touched (from Codesight)

`src/components/Game/ThreadsPanel.tsx` — 32 files reference it (grep), under the 100-importer threshold. No Blast Radius section needed.

## kill criteria

- If the 1920×1080 browser check shows the rail pushing the Chronicle out of view with the usual mid-game
  thread count, drop the cap to 2.
- If Christian says rail rows must stay one line, revert and file a content ticket for short forms.
- If the frame-11 lines still clip at 3, raise the constant (one number).

## explicit user sign-off

Not required (Reversible).

## author notes for the judge

- The character-per-line and sentence-length figures are estimates (rail width 280 px is measured from
  `src/index.css:383`); the plan says so and the Done-when's DOM check measures the real fit.
- The "palisade at Wraithwood" sample in the player-facing text table is illustrative; the real phrase is cut
  in the frame, which is the bug. The executor's capture records the actual phrase.
- The ticket proposed a two-line clamp; the plan takes three, with the reason stated.
