# Action Proposal — Group-vs-group conflict encounters (THR-731)

## intent_quote

> can you prep some work for tonight

(Session directive 2026-07-24 evening. The design content is Christian's grill verdicts recorded in THR-731 and the 2026-07-23 grill synthesis Q5/Q11, plus his verbatim founding image from Q1:)

> the group concept could potentially be used to also handle groups of monsters or groups of NPCs that can conflict with groups of threaded agents (lets say the player encourages a group of adventurers where they are threaded to a member to topple a local assaassins guild through conflict with the group of NPC assassins that represent that guild through an encounter.)

Grill Q5 verdict: split conflict from THR-74; "the *schema* must anticipate it in v1: an encounter needs to be able to carry an `opposing_group` reference"; Q11: NPC spawner folded into this ticket.

## scope (what this plan does)

Grooms THR-731 into an executable three-pillar plan: NPC bands as shipped `faction_band` groups spawned by two thin triggers (lair escalation raiders, guild defensive response); the `opposingGroupId` pairing field **added** (the THR-74 plan specified it but no PR implemented it — grep: zero hits); opposed resolution as an extension of the existing contested-pair machinery (TB-044 — `detectContestations`/`resolveContestationPair`, `contested_won`/`contested_lost` outcomes) with both sides using the shipped company best-member+assist math; consequences (cohesion deltas, injuries, gated casualties, `hostile_to` grudge edges); a 4-template confrontation family including the assassins-guild capstone. Design session only — executor implements after THR-74 completes.

## scope (what this plan does NOT do — explicit non-goals)

- No army/battle-system involvement (wrong scale — grill verdict frames conflict as encounter-ladder composition)
- No new node types, edge types, groupTypes, ActorTypes, or phases
- No `opposes` edge type (`hostile_to` reuse)
- No autonomous band agendas beyond roam/guard/counter (deferred — alternative E)
- No player-cast verbs (Sunder is THR-732)
- No band-vs-band or company-vs-company conflict tuning (schema permits it; content targets company-vs-NPC-band per the ticket predicate)

## impact_class

Reversible — plan doc + Linear transitions; implementation is additive engine/content work, CI-gated, sequenced behind THR-74.

## evidence cited

- **Linear issue:** THR-731 (Deferral, Social Systems Expansion)
- **Vision premises invoked:** mortal-in-crisis, world-runs-without-you, failure-is-plot — brainstorm §Vision premises
- **UL terms touched:** Group/Company (THR-734 approved); "band" as a prose word for NPC `faction_band` groups — executor flags for the UL batch if it hardens into a term
- **Canon pages consulted:** systems-inventory (War/Armies is the only conflict subsystem — army-scale; contested pairs live below inventory granularity), interface map (contested pairs + lair escalation UNAUDITED → audit-on-touch rows in-plan)
- **Prior plan docs this builds on:** THR-74 plan + grill synthesis; TB-044 contestation (in-code)
- **Rejected approaches considered and dismissed:** battle-system reuse, `opposes` edge, `band` groupType, standalone spawner phase, autonomous agendas, always-lethal — brainstorm §Alternatives

## load-bearing decisions touched

- **Everything is a graph node/edge** — respected; bands are actor nodes, rivalry is a `hostile_to` edge (not a property), pairing hint is action-context data (transient per-action state, correctly a field not an edge — it names a pairing for one resolution, not a persistent relationship; the persistent relationship IS the `hostile_to` edge)
- **Encounter awareness is hex-granular** — respected; band pairing eligibility rides hex colocation
- **No new node types without verification** — none added
- Armies/battles (settled war machinery) — untouched

## high-impact files touched (from Codesight)

`src/types/unifiedAction.ts` (278 importers) — additive optional `opposingGroupId?` field; Blast Radius section present in-plan. All other files below the bar.

## kill criteria

- If bands overwhelm early runs (spawn cap/stage mis-tuned), raise `BAND_SPAWN_LAIR_STAGE` / lower `BAND_SPAWN_CHANCE` — data-only.
- If contested engagements read as coin flips (both sides' math too symmetric), widen the margin's effect on outcome bands before shipping — the executor validates against the outcome-distribution KPI (`getOutcomeDistribution`).
- If the guild-response trigger fires so often it walls off faction-targeting play, halve `GUILD_BAND_RESPONSE_CHANCE`.
- If the pairing detector shows measurable cost in the 60-tick smoke, gate it on "any active bands exist" (one guard).

## explicit user sign-off

Not required (Reversible). The conflict fantasy, the split, and the spawner fold-in are Christian's recorded grill verdicts.

## author notes for the judge

- The substrate check flipped the core design: contested-pair machinery (TB-044) already exists with `contested_won`/`contested_lost` outcomes — verify at `unifiedActionResolution.ts` (~lines 2355–2435 at drafting; symbols `detectContestations`, `resolveContestationPair`). The plan extends it rather than green-fielding opposed resolution.
- The `opposingGroupId` seam is honestly reported as **never implemented** despite THR-74's plan naming it — the plan says "add", and the executor note warns them not to hunt for a phantom field.
- Two spawner triggers (not one) is an agent call: lair raiders alone don't deliver the assassins-guild fantasy, which requires guild-defender bands; both are thin calls into shipped `createGroup`.
- Consequence magnitudes and spawn rates are proposals for executor tuning against the smoke.
