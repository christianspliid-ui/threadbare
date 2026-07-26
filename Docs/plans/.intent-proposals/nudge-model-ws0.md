# Action proposal — Nudge Model WS0 engine substrate

**Plan doc:** `Docs/plans/2026-07-26-nudge-model-ws0-engine-substrate.md`
**Issue:** THR-773 (+ THR-779 folded in)
**Impact class:** External (engine substrate for the blessed program pivot; user sign-off anchors: "i bless the concept", "do it. this rework is the most valuable we have right now")

## Originating intent (verbatim anchors)

- Christian, 2026-07-26: "i don't think it works with having the player be able to choose between two different futures for the agent … instead … the ascendant can influence the encounter through adding resources or traits, that pull the outcome in certain directions … the choice is not picked by the player, but an outcome of fate, however gently pushed by a spell, or a sleight of hand." / "all in all i bless the concept."
- Rulings recorded in the program plan (THR-772): stacking allowed; words-only odds; per-encounter authored hands; hidden unavailable options; quintessence stakes with rare death; rebuild encounters per Reach; god restore action unlock-gated; Discord review gates.
- "do it. this rework is the most valuable we have right now" (mandate for this design pass).

## What the plan proposes to do

Engine-only substrate: additive `nudges[]`/`traitVariants` schema, forecast-modifier + band-rider integration, broken-state behavioral consequence with hysteresis + scaled erosion, four-way motive classification, `__DEBUG` surfaces, `[DESIGN]`-tagged rulebook update, UL proposals; THR-779 verdicts (wire 17 progression/monster/faction templates via the cache path, delete 44 dead verbs in WS5).

## What the plan deliberately does NOT do

No UI (WS2), no content authoring (WS1/WS5), no image work (WS4), no deletion in this ticket, no background-sim nudges, no new node types, no essence economy changes.

## Risk the judge should weigh

Whether the attended-only scope and the broken-state pacing defaults faithfully implement "sometimes your agent is in dire straits … a failure has consequence even though maybe death should be very rare", and whether folding THR-779 verdicts here oversteps the audit's "wire-or-delete decision" remit.
