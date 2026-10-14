# Package critic: The Hill Conduit

templateId: encounter.town.hill_conduit
packageVerdict: connected
packageLeaves: The town's standing with the master moves either way, a success leaves the master Inspired and pursuing Build a Great Work, a failure puts a Plague Scare on the town and a compulsion toward building work on the master, and the reeve Edith Marlow and herdsman Hob Fenner carry the bonds the reactions make.

## Half A — anchoring

| Chip | Referent | In the catalog? | Prose names it? | Verdict |
|---|---|---|---|---|
| BOON Inspired (crit/succ/sac, both arms, fallback) | the master's Inspired condition | attachment `trait.condition.inspired`, linked | yes, "{actor} Inspired" | anchored |
| PATH ambition (same bands) | the master's ambition Build a Great Work | ambition, named (tooltip `ui.ambition`) | yes, "Build a Great Work" | anchored |
| SCAR reputation with {target} (failure, crit fail, fallback crit fail) | the master's standing in this town | location `$here`, linked | yes, "{location}" | anchored |
| SCAR Plague Scare (failure) | the town's Plague Scare condition | attachment `trait.condition.location.plague_scare`, linked; concept `$here` | yes, "{location}" | anchored |
| SCAR compulsion (failure) | the master's urge toward building work | shell_state, named (tooltip `ui.compulsion`); concept `$actor` | yes, "building work" (corpus precedent: bell-at-the-exchange) | anchored |

None needs a fold or a bind. The conduit, springs, pasture, bull and wells stay scene-local and are never chipped.

**Rule 0 (backing), per band and route.** This was the defect. A step-0 `critical_failure` ends the action after the pole is recorded, so each arm's `critical_failure` page was read on route A with three chips and no writes. Fixed in content (systems S1): step 0 now writes reputation −0.03 on failure, and the `critical_failure` pages carry only the reputation chip, which both routes back. Every chip on every band is now backed on every route that reaches it. Plague Scare and the compulsion fire unchipped on a route-J critical failure. That is a write without a chip, not a dead chip.

## Half B — what it leaves behind

It leaves state that other systems read and the player can see. The town's reputation with the master gates later work there. The Inspired condition and the Build a Great Work ambition steer the master's next choices. On failure, the town's Plague Scare turns travellers away, and the build compulsion biases the master's next encounters. Two named NPCs (reeve, herdsman) carry bond changes from the reactions. Each of these shows on a sheet the player can open. **connected.**

## Fix-list (applied)

- S1: step 0 `failureMetadata` reputation −0.03. `critical_failure` pages chip only the reputation SCAR. The fallback `critical_failure` gains that chip and *Cart The Water*.
- S2 / E3 / E4: `critical_failure` overviews and the cut-arm blame reaction made true on route A.

PACKAGE PASS
