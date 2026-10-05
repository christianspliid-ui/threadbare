# Pass 3b — Package critic: The Restless Charnel House

> Slug: restless-ossuary · Batch: master-everyday, slot 8 (THR-1688) · Date: 2026-10-05
> Inputs: `restless-ossuary-final.md`, `master-everyday-brief.md` (slot 8), and the actual package `restless-ossuary.package.json` (chips judged as declared there).

templateId: encounter.town.restless_ossuary
packageVerdict: connected
packageLeaves: The mortal's standing with the town goes up or down on the record the Location Profile shows, a ruling that holds puts a #relic possession on their sheet, the night of the laying leaves a good or bad omen that tilts later encounter draws and reaches the chronicle, and the reactions move the weavers' warden Orrin Vasse's feelings toward them, so a later meeting with the warden starts warm or cold.

## Package vs final

The package matches the final. The two unreachable `critical_failure` carryover lines that the final asked to drop (step 1 keyed on step 0, step 2 keyed on step 1) are already gone from `restless-ossuary.package.json`. The chip ids, titles, details, stateNouns, anchors, reactions and step writes all match § 13–15 of the final.

## Half A — anchoring

| Chip | Referent | In the catalog? | Prose names it? | Verdict |
|---|---|---|---|---|
| critical_success · BOND · `reputation with {location}` (gain) "Well Regarded" (`ossuary.crit.the_dead_lie_quiet`) | The mortal's `reputation_with` edge toward the town the scene resolved in | `reputation_with` edge, named. The anchor is the counterparty: the `location` node, linked (`entityId: $here`, `visualKind: location`) | Yes. The tag and the detail both render the town's name ("{location} thinks well of {actor} now.") | anchored |
| success · BOND · `reputation with {location}` (gain) "Well Regarded" (`ossuary.win.the_dead_lie_quiet`) | Same edge, same town | Same | Yes | anchored |
| success_at_cost · BOND · `reputation with {location}` (gain) "Well Regarded" (`ossuary.cost.the_dead_lie_quiet`) | Same edge, same town | Same | Yes | anchored |
| failure · BOND · `reputation with {location}` (loss) "Found Wanting" (`ossuary.fail.found_wanting`) | Same edge, moved down | Same | Yes ("{location} thinks less of {actor} now.") | anchored |
| critical_failure · BOND · `reputation with {location}` (loss) "Out of Favour" (`ossuary.critfail.blamed_for_the_dead`) | Same edge, moved down | Same | Yes | anchored |
| PRIZE (engine-rendered, success bands) | The `#relic` possession drawn from the step 2 `rewardPool` | `artifact` / possession, linked. Created by this encounter, which counts as existing (rule 0b) | The engine names it. The overviews say "the relic found under the weavers' bones" | anchored |
| (omen, unchipped by design) | `emit_omen` cultural, global | No omen anchor kind exists | Told in the step 1 afterimages only | n/a (correctly not chipped) |

No chip needs `fold` or `bind`. Every referent is a graph object present wherever the encounter can spawn: `$here` is always a location, and `urban` settings guarantee a town.

## Reasoning

**Rule 0 (backed by a write), checked route by route.**
- **Success bands.** All three are reached only through a step 2 success, which writes `reputation_with $here +0.06`. On the worst route (failure at steps 0 and 1, then success at step 2) the net is +0.02, so the `gain` direction still holds.
- **Failure band.** Steps 0 and 1 are `continue_weakened`, so this band means a step 2 failure, which writes −0.06.
- **Critical failure band.** This can end the action at any step. Steps 0, 1 and 2 each carry a `reputation_with` loss in `failureMetadata` (−0.02, −0.02, −0.06), so the loss chip is backed whichever step ends it. That matches the systems verdict.
- **PRIZE.** It comes from the step 2 success `rewardPool`. With `#relic` covering 14 item bearers, an empty draw is unlikely (final caveat 2). That edge case is shared with every query-prize package and is not a chip defect.

**Rule 0b (the referent exists and is named).** The anchor sits on the counterparty, as the catalog asks for `reputation_with`. The sentence names the town through `{location}`, and the tag does too. No chip points at scene fiction. The charnel house, the dean, the sexton and the guilds stay in prose.

**Rule 0c (state first).**
- The tag reads `BOND · REPUTATION WITH <town>`, which is the mechanic plus its endpoint. The detail names both ends: the town, and `{actor}`.
- Spec 0c says the surface "does not enrich" `stateNoun`. That sentence is stale. `buildAftermathConsequences.ts:766` (`nounTextFor(..., enrich, ...)`) enriches the noun's display text, and 14 shipped encounters (flood-dyke-mending, well-sinking and others) use `reputation with {location}`. The final's systems note ("verified: it enriches") is correct. The stale line is a spec-hygiene note, not a fix for this encounter.

**Rule 1b (15 words, cause at most one clause).**
- Every chip is title plus a 7-word detail, with no cause clause. That is deliberate: each overview already names the beat that moved the standing.
- No chip shares a four-word run with its band overview. In the failure band, "thinks less of {actor} now" and "every guild watched the work fail" share nothing.

**Rule 1c (the band read as one page).**
- **success_at_cost.** The overview says the weavers have not forgiven the ruling. The chip says the town thinks well of the mortal. These do not contradict: one is a guild, the other is the town's standing.
- **Success reactions.** These split cleanly. One gives the credit away (warden bond +). The other tells the hard truth (town +0.03, warden bond −). Neither repeats the chip.
- **Failure reactions.** One stays and works (town +0.03). The other places the blame (warden bond −). Both are true on every route into the band.

**Rule 2 (state noun).**
- `reputation with {location}` is the lawful sheet word, and `$here` is the named exception to the "anchor isn't `$actor`" tell.
- `direction`, `polarity`, `category` and `stateNoun` are all declared as structured fields.

**Rule 3 (category).** BOND, meaning who stands with or against them, is the right bucket for the town's regard.

**Half B — what it leaves behind.** The encounter leaves four things:
- **The town's standing edge.** Reputation gates and scoring read it. The player sees it on the Location Profile standing row and in the chip.
- **The relic.** A held possession on the mortal's sheet, named by the engine in the PRIZE chip.
- **The omen.** It biases encounter draws and reaches the chronicle. It is deliberately unchipped, so the player meets it later rather than at the aftermath.
- **The warden's bond.** The reactions write a persistent `bond_change` toward `{cast:warden}`, a must-persist actor (Orrin Vasse, or a reused merchant). A later encounter that reuses the warden starts from that bond.

The standing edge and the relic are what make this `connected` rather than `thin`: a named system reads each of them, and the player sees each of them. One limit is accepted, and the final already lists it as caveat 1: the success_at_cost cost ("the weavers have not forgiven") is told rather than written. It is unchipped, so it is not a Law 56 defect.

## Fix-list

None.

## Observation (not a fix for this encounter)

- `nudge-authoring-spec.md` § Consequences rule 0c still says `stateNoun` is not enriched. The adapter has enriched it since the THR-1685-era change at `buildAftermathConsequences.ts:766`. A later spec-hygiene pass could correct that sentence so future critics do not flag `{location}` / `{target}` nouns as literal braces.

PACKAGE PASS
