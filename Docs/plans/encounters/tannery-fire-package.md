# Package critic — The Tannery Fire
> Slug: tannery-fire | Pass: 3b package | Date: 2026-10-15 | Batch: master-everyday-3 slot 4
> Judged from `tannery-fire.package.json` (source of truth), with `tannery-fire-final.md` and `tannery-fire-systems.md`.

templateId: encounter.town.tannery_fire
packageVerdict: connected
packageLeaves: If the firebreak holds, the town is put Under Watch (guards posted, which makes shadow work there harder) and thinks better of the master, while Gerold Ashby the master tanner holds the lost hides against them; if it fails, the town catches a Plague Scare that keeps travellers away, thinks less of the master, and Sergeant Hob Ketteridge of the watch trusts them less.

## Half A — anchoring

| Chip | Referent | In the catalog? | Prose names it? | Verdict |
|---|---|---|---|---|
| cs/s/sac · BOND reputation with {target} ("A Season's Stock") | the mortal's bond with the master tanner (`$cast:tanner`, persisted actor) | `individual` agent 🔗 linked | yes — "{cast:tanner} counts the lost hides against {actor}." | anchored |
| cs/s/sac · BOON Under Watch ("Guards in the Ashes") | `trait.condition.location.under_watch` applied to the town (`$here`) | attachment · condition 🔗 linked | yes — the condition by name, and "the burnt quarter of {location}" | anchored |
| cs/s/sac · BOON reputation with {location} ("The Town's Regard") | town standing (`$here`) | `location` 🔗 linked | yes — "{location} thinks well of {actor} now." | anchored |
| f · SCAR Plague Scare ("Foul Water") | `trait.condition.location.plague_scare` applied to the town | attachment · condition 🔗 linked | yes — the condition by name, and "Travellers keep away from {location}" | anchored |
| f · SCAR reputation with {location} ("The Town's Regard") | town standing | `location` 🔗 linked | yes — "{location} thinks less of {actor} now." | anchored |
| f · BOND reputation with {target} ("The Watch's Trust") | the mortal's bond with the sergeant (`$cast:sergeant`, persisted actor) | `individual` agent 🔗 linked | yes — "{cast:sergeant} trusts {actor} less." | anchored |
| cf · SCAR reputation with {location} ("Lost Before the Town") | town standing | `location` 🔗 linked | yes | anchored |
| cf · BOND reputation with {target} ("The Watch's Trust") | the sergeant | `individual` agent 🔗 linked | yes | anchored |

No fold and no bind. Rule 0 holds on every route into each page: the success-side chips are all in step-1 `successMetadata`, which fires on every route that reaches cs/s/sac. The failure chips are all in step-1 `failureMetadata`. The two cf chips are in both step-0 and step-1 `failureMetadata`, so they are backed whether the action ends at step 0 or at step 1. Plague Scare is correctly left off the cf page because the step-0 cf route never writes it (systems § 3).

Scene fiction stays in prose and nothing chips it: the sheds, the hides, the journeymen, the hook crews, the river stair and the fouled river. The river appears in the failure overview only, and no chip names it, so it does not repeat the Unsafe Bridge defect. The `stateNoun` form `reputation with {target}` / `{location}` is the shipped corpus convention (tourney-marshal, hill-conduit and others in `src/data/encounters/`). It is not new risk.

## Half B — what it leaves behind

Both place conditions have live readers in `src/data/condition-trait-content.ts`. `under_watch` sits in `LOCATION_CONDITION_STEP_MODIFIER` and puts a shadow penalty on steps resolved in that town for 7 days, so a later theft or spy encounter there gets harder. `plague_scare` sits in `LOCATION_CONDITION_MOVEMENT_TAX` with the avoided multiplier for 14 days, so travellers really do route around the town. The player sees both on the location's sheet as named conditions. Town standing moves both ways. Both cast members are must-persist, so the tanner's grudge and the sergeant's lost trust stay on real agents that later town encounters can cast. The success reactions add a choice of whom to mend things with: the tanner, against a small cost in town standing, or the sergeant. The failure reaction "ask about the vats" records an intelligence entry that nothing downstream reads yet. That is the thinnest write, but it is not chipped. Verdict: **connected**.

## Notes

- `success_at_cost` carries the same three chips as `success`, and its cost is in prose only. This is the engine limit already accepted in master batch 2 (no band-keyed step effect).
- On `critical_success` the tanner's bond still falls, although he stood aside. The systems pass found this defensible (the stock is lost anyway). I agree: the detail line blames the lost hides, not the doorway.
- No fix-list.

PACKAGE PASS
