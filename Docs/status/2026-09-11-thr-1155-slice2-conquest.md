# THR-1155 slice 2, step 3 — a sacked town changes hands

**2026-09-11 · Engine · conquest**

The political map could move as of step 2. Nothing in the simulation could move it.

That is the whole shape of this step. `buildRealmProjection` derives the red border from
the `controls` edges Realms hold, so the border follows the towns — but on `main` **no
engine path had ever written a faction's `controls` edge after worldgen**. A siege the
attacker won at total severity ran `applyPowerVacuum`: it deleted the defender's edges
and left the town nobody's. The victor's faction was already known at that line and used
only for sphere pressure. So a border could shrink and never grow, and *{Realm} takes
{Location}* was a chronicle template with no producer anywhere in the engine — the
recorded-not-acted-on flaw one layer down from the one step 2 fixed.

## The rule

**The army that sacks a town takes it for its faction.** `applyPowerVacuum` is now
`applyConquestOrVacuum(state, settlementId, victorArmyId, runtime?)`, and it resolves
four ways rather than one:

| | what happens | why it is not the same as the others |
|---|---|---|
| `taken` | the faction's `controls` edge is **retargeted** to the victor, stamped `establishedTick` / `via: 'conquest'` | `retargetEdgeSource`, never delete-and-add — the edge id is the audit trail |
| `claimed` | the victor gains a fresh edge on ground **nobody** held | the rule is *takes it*, not *takes it from someone*: an earlier vacuum's leavings and wilds no Realm ever held are both takeable |
| `retained` | nothing is written | a double aftermath over the victor's own town is not news, and saying so is the point of tracing it |
| `vacated` | the old power vacuum, unchanged | a victor answering to no faction — a rebel band, a monster horde — sacks a town and rules nothing |

A mortal's `controlType: 'strategic'` hold is deliberately untouched. The hold is a
commitment to the town, not to the faction, and what it means inside a *new* Realm is
THR-1448's question.

## The court a conquest takes by accident

Step 2's measurement carried a finding forward: retargeting a `controls` edge carries its
`role: 'seat'` with it, so a victor seizing a rival's **capital** inherits the court and
the loser is left seatless — visible there as faction_0's seat becoming `loc_10` while
faction_1's went `null`. Conquest re-stamps **both** sides through `stampRealmSeat`.

The arm that holds this is falsified, not watched: with the victor's re-stamp removed,
the test reports `expected [ …(2) ] to have a length of 1` — two seats on one Realm,
exactly the defect.

## The threading, proven rather than asserted

The unit arms pass a runtime to `applyConquestOrVacuum` directly, which proves the
function bumps but not that anything ever *hands* it one. That is the half that would
actually have failed: the war phases were called as `phaseBattleTick(s)` with no runtime
at all, so a conquest would have moved an edge and left the projection stale behind it —
right only by the fingerprint belt, one read late.

So the last arm enters at the phase, the way the orchestrator does:

```
phaseBattleTick(state, runtime)  → realm_projection_rebuilt reason: 'version'
phaseBattleTick(state)           → realm_projection_rebuilt reason: 'fingerprint'
```

Both measured. The second is what the belt is for and what the threading exists to
prevent, and it is why the first assertion means something. `runtime?` rides as an
optional parameter through `phaseBattleTick` → `tickSiege` / `tickBattle` →
`resolveBattle` → `applyAftermath`, in the `phaseEncounterProgressionV2` shape, so every
existing caller and test compiles unchanged. Both real callers of `runTick` — the CLI
(`scripts/cli.ts`) and `useSimulation` — already pass a live runtime, so the chain is
whole from the browser and from the headless lane.

## `controlled_by` is gone, and it was never there

The plan called it a fixture-only phantom and it was exactly that. `controlled_by` is in
neither `EdgeType` nor `edgeSchema`; its **only writer anywhere** was one line in
`siegeRegionalEncounters.test.ts`. All four production reads are swept onto `controls` and
the type stays unregistered.

Two of those reads had no `controls` fallback, so they are **live for the first time**:
the besieged town's holder now joins the siege's faction set for spotlight selection
(`siegeResolution.ts:143`), and a townsfolk's allegiance to that holder now resolves in
regional-encounter selection (`:657`). That is a behaviour change, deliberately taken —
the alternative was leaving two reads that always returned `undefined`.

The typecheck ratchet fell **5** when they went, because every one of them was itself a
type error: a fixture had been defining a shape the world did not have.

## The line

*{Realm} takes {Location} from {Realm}* / *{Realm} loses {Location}* reaches the feed
through `phaseArmyNotifications` — the phase that already runs right after `battle_tick`
and already turns war traces into readable lines. Significance is flat
(`REALM_TERRITORY_EVENT_SIGNIFICANCE`, 0.7) rather than thread-gated: a border moving is a
fact about the world's shape, not about anyone's acquaintance with it. No toast — the map
moving is the notification. Law 2: the line carries the Location and both Realms as
`refs`, so a chronicle surface links them without parsing the sentence.

## Remaining in slice 2

1. **Realm membership** — part 2's finding, untouched here. Without `member_of` edges a
   Realm cannot field an army (`selectCommander` picks the highest-Iron *member*), so no
   Realm ever reaches a siege on its own. Conquest is now waiting for an army to arrive.
2. The participation test, the census assertion, the 150-tick acted-on counts, and the
   faction-sheet / chronicle *held by* lines.

Plan: `Docs/plans/2026-09-10-thr-1155-realms-and-areas.md` § Engine E.
