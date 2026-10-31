# Action proposal — encounter story text, slice 1 (THR-2105)

## intent_quote

> "we need the design lane to look at the quality of the story text in the encounters."
> — Christian, chat 2026-10-31 (quoted in THR-2105's description)

> "we can do that by looking at current examples and then we can discuss whether the evals are missing or we have some that are giving us trouble"
> — Christian, chat 2026-10-31 (THR-2105 Done-when 1b)

THR-2105 Done-when 2: "A plan doc in `Docs/plans/` for the fix, handed to Ready for Dev with the coordination block — a rewrite wave and/or authoring-chain changes (brief, factory prompts, composers) that stop the pattern coming back. Changes to the checks themselves wait for the eval discussion and are out of scope here … split into slices if it runs past one plan doc (≤250 lines each)."

## scope (what this plan does)

Two artifacts. (1) The audit `Docs/audits/2026-10-31-encounter-story-text-quality.md`: 136 templates read, demand re-measured today, eight failure patterns with quoted examples, counts and sources, and one row per writing check with a catches/misses/gets-in-the-way verdict (Done-when 1 and 1b). (2) Slice-1 plan `Docs/plans/2026-10-31-thr-2105-encounter-story-text-slice-1.md`: rewrite from scratch the ten board encounters players meet most (22.6% of all encounters met), giving them the doctrine's three-paragraph opening without moving placement. Fix the factory's golden exemplar card lines (strength tags, second person). Fix six `{they} find`-style pronoun seams, including the one in the doctrine's own approved spine.

## scope (what this plan does NOT do — explicit non-goals)

- No change to any writing check (waits for THR-2106).
- No change to Prose Doctrine v2 itself.
- No change to chip wording that Christian's 2026-08-23 / 2026-09-12 rulings require.
- No new cast bindings on board templates; no placement change.
- Old-board wave 2, the factory-chain habits (P3, P6 sweep, P8) and the five novel-prose templates (P4) are filed as separate tickets, not done here.
- No encounter mechanics, rewards or art.

## impact_class

Reversible — data strings and two optional fields in ten templates, one fixture, one spec line.

## evidence cited

- **Linear issue:** THR-2105 (blocks THR-2106)
- **Vision premises invoked:** none changed. Narrative over mechanical perfection (NFP 5).
- **UL terms touched:** none new
- **Canon pages consulted:** `.claude/skills/encounter-pipeline/reference/nudge-authoring-spec.md` § Prose doctrine v2 and § The communication pivot; Christian's verdicts from THR-883 and THR-1223 comments; chip rulings 2026-08-23, 2026-09-12
- **Prior plan docs this builds on:** `Docs/plans/2026-09-28-thr-1634-finish-the-encounters-the-player-meets.md` (demand ranking method, completion list)
- **Rejected approaches considered and dismissed:** cast-binding the board's role figures (structural, 168 templates); narrowing `settings` per THR-1222 (moves placement); editing old prose toward the doctrine (Christian 2026-08-25: rewrite from scratch).

## load-bearing decisions touched

None. Encounter awareness, graph and placement are untouched; Done-when 5 asserts placement is unchanged.

## high-impact files touched (from Codesight)

`src/data/encounter-content.ts`: 104 importers. Covered by the plan's Blast Radius section (string fields only).

## kill criteria

In the plan: cold read still failing after one round → stop, add a board exemplar before wave 2. Any firing count moving → revert `settings`. A veto of full openings for background encounters → drop C2.1.
