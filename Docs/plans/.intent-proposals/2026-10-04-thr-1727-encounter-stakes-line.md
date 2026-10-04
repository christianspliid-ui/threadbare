# Action proposal — 2026-10-04-thr-1727-encounter-stakes-line

## intent_quote

> the encounter summary text template/formula should  be reworked across encounters - lets have a design session on how to do that together.

(Christian, chat 2026-10-04, feedback on https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge.)

The session then proposed one stakes line `[why they're here], [mortal] must [goal] — or [risk].` replacing both the summary and the "why they're here" motive line, and asked three questions: A) stakes line rather than no summary at all, B) the second half is always the "— or" fork, C) the line turns into a result line when the encounter ends, reused by the badge, Chapter Ledger and thread row. Christian's answer:

> A yes, B yes, C yes

> lets do the design now to finish this off

## scope (what this plan does)

Adds structured `stakes` (goal, risk, won, lost) to encounter templates and a pure module that assembles the opening stakes line (motive lead + actor + goal + risk) and the result line (by outcome band). The veil shows the stakes line in place of the description subtitle and the motive intro line; the Chapter Ledger, encounter badge and agent thread row reuse it. Ships the mechanism plus stakes for the five vertical-slice encounters, with a validator in report mode; a follow-on ticket migrates every remaining encounter template and makes the field required.

## scope (what this plan does NOT do — explicit non-goals)

- Does not restyle the veil header (THR-1724 owns the layout pass; sequenced first).
- Does not rewrite scene prose, step prose or aftermath prose.
- Does not delete `template.description` (kept as fallback and for other readers).
- Does not change chronicle entries or consequence chips.
- Does not change motive classification itself; it only reuses it.
- Does not author stakes for the non-slice encounters in this ticket (follow-on).

## impact_class

Reversible

## evidence cited

- **Linear issue:** THR-1727 (parent context THR-1220)
- **Vision premises invoked:** none changed; the plan follows `Docs/canon/prose.md` rule zero (game register)
- **UL terms touched:** "stakes line" is new player-facing vocabulary only in code/docs; UL-proposal filed at handoff for "stakes line" and "result line"
- **Canon pages consulted:** `Docs/canon/encounters.md`, `Docs/canon/prose.md`, `Docs/design-system/laws.md`
- **Prior plan docs this builds on:** THR-1220 checkpoint; motive receipt work (motive intro variants, THR-1478-era nudge stage content)
- **Rejected approaches considered and dismissed:** no summary at all (Christian chose the stakes line, A); free second clause (Christian chose the "— or" fork, B); keeping a hand-written blurb with tighter style rules (no shape; drifts)

## load-bearing decisions touched

- "Relationships between entities are graph edges, not property fields" — respected: `stakesContext` is data internal to the action (motive source, mission name string, location name string for display), not a relationship; the mission and location remain graph nodes read through existing helpers.
- Seeded determinism (NFP #3) — variant selection hashes the action id.

## high-impact files touched (from Codesight)

- `src/types/unifiedAction.ts` (hundreds of importers) — two optional fields. Plan carries a Blast Radius section.

## kill criteria

- If Christian, on the checkpoint routes, finds the formula sentence repetitive across encounters after the slice migration, stop the follow-on migration and revisit the lead/forms tables (they are constants, so the fix is data).
- If more than a handful of encounters cannot express their failure as a single "— or" verb phrase within 60 characters, the formula is too narrow: raise it with Christian before forcing them.
- If the result line contradicts the aftermath chips in playtests (e.g. "crossed" while the chips show a fall), the band→form table is wrong and must be revised before the follow-on migration.
