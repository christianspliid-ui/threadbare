# Action proposal — A Story row says when the deed was done to the subject (THR-2191)

Plan doc: `Docs/plans/2026-11-17-thr-2191-story-rows-say-whose-deed.md`

## intent_quote

The ticket (filed by the design lane 2026-11-07 while planning THR-2145, on the intent judge's prompt), verbatim:

> **Question for design:** should Story rows carry a role word from the edge (for example "against them" / "by them", or a verb per role), and in what words? That is a whole-list legibility change, so it fits the UI legibility period (map UI legibility and usability's text-position decision governs where a row's secondary word sits).
>
> **Done when** a plan doc in `Docs/plans/` names the role words, which rows get one, and where the word sits on the row.

The period focus that makes this the lane's unit, Christian in chat 2026-11-01:

> "get the design lane to focus on UI and UX improvements for the next period. specifically legibility and usability of the different UI modules: are we using tried and true ux patterns for how humans read UI panels..."

## scope (what this plan does)

Adds a short role word to Story rows on the person, faction and relic pages when the subject was not the doer of
the event (target, fight opponent, battle defender, war dead), read from the existing `participated_in.role` edge
property through one word table. The word goes in the row's existing fact slot after the name. The THR-2223 repeat
fold keys on the role too, so a subject's own runs and runs done to them fold into separate rows, and the role word
and the repeat word share the fact. Engine view code and a data table only; no component change.

## scope (what this plan does NOT do — explicit non-goals)

- No "by them" word on the subject's own deeds (decided against; 96% of rows are own deeds).
- No outcome words (won / lost) on Story rows.
- No naming of the other party on the row.
- No change to the record page's "who took part" rows, to event writers, or to any edge schema.
- No per-chapter verbs.
- No icon.

## impact_class

Reversible.

## evidence cited

- **Linear issue:** THR-2191
- **Vision premises invoked:** the god reads mortals' lives from the table (`game-design-direction`)
- **UL terms touched:** none new (plain words "done to them", "set upon", "defending", "fell in it")
- **Canon pages consulted:** `Docs/design-system/laws.md` (Laws 13/14, 16, 25, 42, 55, 56), the UI legibility map's text-position decision (THR-2119, `Docs/audits/2026-11-01-ui-text-positions.md`)
- **Prior plan docs this builds on:** `Docs/plans/2026-11-07-thr-2145-story-rows-name-the-deed.md`, THR-2223 (story repeats fold), `Docs/plans/2026-10-14-thr-1876-the-inspector.md` § D8 (Connections)
- **Rejected approaches considered and dismissed:** mark every row; per-chapter verbs; "against them"; word before the name; icon; mixed fold — see the brainstorm companion

## load-bearing decisions touched

- "Relationships between entities are graph edges, not property fields" — respected: the role is read from the existing edge.
- "No inventing node types" — none invented.

## high-impact files touched (from Codesight)

None at ≥100 importers: `src/engine/views/connections.ts` has 7 importing files, `src/data/view-content.ts` 62 (grep of `src/`).

## kill criteria

- A warm-round tester still reads a target row as the mortal's own deed → move the role word before the name.
- Christian asks for every row to be marked, or for outcome words → extend the table / open a new slice.

## explicit user sign-off

Not required (Reversible; decided under the 2026-09-11 delegation, veto invited in the lane report).

## author notes for the judge

Every substrate claim in the plan quotes a line number on `origin/main` `38acd7fb` or the CLI census output
(seed 42, medium map, tick 300). The census of chapter names for `target` edges is also quoted.

Revision 2 (after pass 1, Revise): the `connections.ts` anchors were copied from the ticket's 2026-11-07 text and were
stale; they are now re-measured on `38acd7fb` with `grep -n` (person `:81`, location `:97`, faction `:117`, artifact
`:132`, `FactRule` `:51`, fold `:282-305` / overwrite `:302`, `templateKey` `:496-499`, instance replace `:463`). The
`push` replace path is named. The class label is now PC-6 (one fact told two ways), with the other surfaces named, and
a PC-5 paragraph covers the fold.
