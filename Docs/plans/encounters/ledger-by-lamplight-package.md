# Package critic — The Ledger by Lamplight

templateId: encounter.town.ledger_by_lamplight
packageVerdict: connected
packageLeaves: A clean copy leaves the mortal holding a shadow-work item paid in kind, the rival house's factor trusting them, and a seed: the factor sends for them with more quiet work (a theft or smuggling job, drawn by family) — while a cracked or caught copy leaves the town Under Watch, which makes the next quiet job there harder, and the factor trusting them less.

## Half A — anchoring

| Chip | Referent | In the catalog? | Prose names it? | Verdict |
|---|---|---|---|---|
| BOND reputation (crit / success / s@c) | the factor's trust in the mortal (`relates_to.trust`, reciprocal) | `ui.reputation_with` concept, which resolves; the write is to `$cast:factor` (agent, must-persist) | yes: "{cast:factor} trusts {actor}…" names and links the factor | anchored |
| SCAR reputation (failure / crit fail) | the same bond, down | as above | yes: "{cast:factor} trusts {actor} less…" | anchored |
| SCAR Under Watch (failure / crit fail) | the condition on the mortal's current town | condition template (attachment), linked | yes: "{location} is watched now…" | anchored |
| PATH seed (crit / success / s@c) | the factor sending for the mortal again | `ui.aftermath_seed`, backed by the placeless `#steal` `encounter_seed` | yes: "{cast:factor} will send for {actor}…" | anchored |
| PRIZE (engine) | the `#shadow` possession drawn from step 1's `rewardPool` | item, linked | "paid in kind" in the overview | anchored |
| growth: shadow reach (fallback) | shadow reach | reach, named | yes | anchored |

There is nothing to fold and nothing to bind. Fixed in this pass:

- The reputation noun was `reputation with {target}`. On an everyday organic draw `{target}` enriches to the **town**, so the tag would have named the town while the chip was about the factor (systems § 4b). It now uses the sheet word `reputation`.
- The PATH chips carried a dead `{actor}` concept, which is matched unenriched and so never decorates. It was removed.

## Half B

The encounter leaves four kinds of state that later systems read. The first is a place condition the Location Profile shows. Its Shadow step modifier makes every later quiet job in that town harder, and the player feels that as worse odds on the next Shadow encounter there. The second is a reciprocal bond with a named, persisted factor, which the unified reputation read (THR-1206) surfaces on both sheets. The third is an item in the pack. The fourth is a `#steal` seed that fires a real theft or smuggling encounter 96 ticks later, with the factor's binding inherited. On a town, 5 drawable members accept the subtype; on a city, 6; on a capital, 7. The player sees all of it through the chips, the town's condition, the item, and the follow-up job. One thin spot is on record: the sequel templates do not name the factor, so the "sent for by the factor" link is carried by the chip and the inherited binding, not by the sequel's own prose.

PACKAGE PASS
