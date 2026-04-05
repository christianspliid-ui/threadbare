# Encounter Packet Worked Example — `cg.quest.gate_duty`

> **Date:** 2026-04-03  
> **Status:** Worked example / checklist validation / support-bundle contract  
> **Why:** Apply the encounter-building checklist to one real catalog encounter, then force the richer dependency picture into the open: what must already exist, what may lazy-materialize on trigger, what must persist afterward, and what still genuinely wants a future primitive.

## Encounter Under Test

- Template: `cg.quest.gate_duty`
- Source: [civic-guard-encounter-content.ts](/C:/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/data/civic-guard-encounter-content.ts)
- Current shape: two-step `easy` civic-guard quest in `town`, `city`, or `capital`

## What The Current Template Gets Right

- The premise is readable immediately: a guard checks travelers at a settlement gate.
- The reach pairing is good: `eye` to spot the problem, `iron` to control the scene.
- The civic-guard faction context is already real and generated in the same settlement tier.
- The encounter can become a strong “living world” knot because it naturally touches commerce, authority, criminal networks, and public reaction.

## What Has Since Been Made Live

This packet started as a thin-shell audit. The following support is now live in the repo and should be treated as real foundation rather than aspirational:

- `town`, `city`, and `capital` now generate a real `sublocation-type.gatehouse`.
- settlement rosters now include `guard`, `guard_captain`, `trader`, and `lookout` support for checkpoint play.
- `capital` now maps into NPC seeding instead of silently skipping ambient cast creation.
- `cg.quest.gate_duty` is authored directly against `sublocation-type.gatehouse`.
- checkpoint-tagged rewards and burdens are live in the catalog:
  - `Gate Seal Case`
  - `Gatehouse Commendation`
  - `Watch Scrutiny`
- the encounter now carries real `reputationDelta` and reward-pool wiring instead of being pure flavor.

That means the encounter is no longer blocked on basic gate/cast/reward support. The remaining quality question is not “can it technically exist?” but “which richer dependencies should be pre-seeded, which can be lazy-materialized honestly, and which still deserve a future primitive instead of a bad workaround?”

## North-Star Encounter Packet

### 1. Pressure Knot

The city gate is overloaded at dusk. Merchants want curfew clearance, the Civic Guard is under pressure to stop contraband, and the Thieves Guild has started testing the checkpoint with forged papers and hidden cargo. A nervous captain is trying to keep order while impatient witnesses begin to notice every delay.

This is already a moving current before the player acts:

- commerce wants speed
- the guard wants control
- smugglers want leakage
- the crowd wants someone to blame

### 2. Intervention Fantasy

The actor is not just “rolling guard duty.” The actor is trying to keep a volatile chokepoint from slipping into corruption, disorder, or public embarrassment.

Strong intervention verbs:

- inspect
- expose
- isolate
- calm
- detain
- bargain
- intimidate

### 3. Cast And World Objects

Required cast:

- guard on duty
- guard captain or sergeant overseeing the checkpoint
- smuggler or contraband courier
- lawful merchant delayed by inspection
- witnesses / queue pressure / bystanders
- optional thieves-guild lookout observing the checkpoint

Required places:

- gate or checkpoint
- nearby market pressure
- nearby barracks or watch support

Required consequence objects:

- confiscated contraband or evidence bundle
- guard-issued or black-market reward object
- public suspicion / scrutiny / obligation burden
- faction reputation movement

### 4. Step Structure

Step 1: Read the queue

- Identify who is dangerous, who is impatient, and who is exploiting the confusion.
- Primary reach: `eye`

Step 2: Force the stop

- Detain, isolate, or outplay the resisting suspect without turning the gate into a riot.
- Primary reach: `iron`

Step 3: Set the tone of the aftermath

- Decide whether the checkpoint closes harder, the trade lane stays open, or the underworld learns how the guard now behaves.
- Secondary reach: `heart` or `gold`, depending on whether the payoff is social order or commercial continuity

### 5. Outcome Ladder

`critical_success`

- Contraband is found cleanly.
- The suspect is detained without chaos.
- The captain’s trust rises.
- Merchants see the guard as competent rather than oppressive.
- The actor gains meaningful Civic Guard standing and seeds a future ally or contact.

`success`

- The smuggler is stopped and order is preserved.
- The queue grumbles but stabilizes.
- The actor gains modest guard reputation and possibly a small lawful reward.

`success_at_cost`

- The smuggler is stopped, but the actor pays a real price.
- Examples:
  - gains public resentment
  - takes a suspicion or scrutiny burden
  - owes a merchant, captain, or informer a favor
  - spends quintessence to hold the line
  - lets a second, lesser offender slip through while catching the main one

`failure`

- The contraband gets through or the wrong suspect is seized.
- The scene still moves forward:
  - the guard captain loses confidence
  - witnesses start a rumor
  - trade flow worsens
  - the Thieves Guild learns the checkpoint’s weakness

`critical_failure`

- The gate becomes a public embarrassment or flashpoint.
- A scuffle, escape, or false arrest creates a broader civic problem.
- The actor leaves with a durable burden:
  - watch disgrace
  - underworld leverage
  - public distrust
  - a destabilized city gate that changes later content

### 6. Downstream State Change

If this encounter is built well, it should change all of these:

- Civic Guard faction stance
- Thieves Guild pressure or hostility
- actor `reputationScore` and/or reputation tally
- checkpoint or market atmosphere in this settlement
- future gate / smuggling / witness / investigation encounters

## Support Matrix

| Network element | Required object(s) | Source / generation path | Generated in target area? | Verified by | Status |
|---|---|---|---|---|---|
| NPC cast | `guard`, `guard_captain`, suspect courier/smuggler, witnesses | Guard roles exist in [npc.ts](/C:/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/types/npc.ts); settlement rosters now seed gate-duty support roles; Civic Guard faction exists in [civic-guard-definition.ts](/C:/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/data/civic-guard-definition.ts) | partial | direct content inspection, [npcSeeding.test.ts](/C:/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/engine/__tests__/npcSeeding.test.ts) | `author-now` |
| Factions | `civic_guard`, `thieves_guild` | Both faction definitions exist and both are present in `town` / `city` / `capital` settlement play | yes | [civic-guard-definition.ts](/C:/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/data/civic-guard-definition.ts), [thieves-guild-definition.ts](/C:/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/data/thieves-guild-definition.ts) | `live` |
| Places | gate/checkpoint, nearby barracks, nearby market pressure | `town`, `city`, `capital` are valid encounter locations and now generate `sublocation-type.gatehouse`; barracks and market support still vary by settlement tier | partial | [civic-guard-encounter-content.ts](/C:/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/data/civic-guard-encounter-content.ts), [sublocation.ts](/C:/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/engine/sublocation.ts) | `live` |
| Rewards / burdens | confiscated contraband, guard reward, criminal salvage, debt / stain / scrutiny burden | Checkpoint-tagged reward objects now exist in [reward-attachment-catalog.ts](/C:/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/data/reward-attachment-catalog.ts) and the encounter uses a `#checkpoint` reward pool | partial | [reward-attachment-catalog.ts](/C:/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/data/reward-attachment-catalog.ts), [civic-guard-encounter-content.ts](/C:/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/data/civic-guard-encounter-content.ts) | `live` |
| Reputation / social state | Civic Guard reputation, actor standing, public suspicion, witness fallout | Faction reputation, reputation tallies, actor `reputationScore`, and checkpoint-tagged burden/reward objects are live; witness-specific fallout is still scene-authored rather than systematized | partial | [unifiedActionResolution.ts](/C:/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/engine/unifiedActionResolution.ts), [reward-attachment-catalog.ts](/C:/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/data/reward-attachment-catalog.ts) | `author-now` |
| Omen / run identity | pressure styling for tyranny, conspiracy, decay, civic fear | Can be authored with current prose and event weighting, but the current template does not carry that identity yet | no | direct content inspection | `author-now` |
| Evidence / reveal state | forged papers, hidden compartment, planted contraband, proof of innocence | The encounter wants reveal/flip behavior for inspection drama, but that primitive family is still part of the component-library track | no | [2026-04-03-procedural-content-component-library-audit.md](/C:/Users/chris/Dev/Projects/TheFantasyWorldSimulator/Docs/plans/2026-04-03-procedural-content-component-library-audit.md) | `blocked-primitive` |

## Support Bundle Contract

This is the richer learning artifact. It distinguishes what the world should already provide from what the encounter may materialize on trigger, and it forces a persistence decision for every meaningful support object.

Reuse-first rule for this packet:
- if the settlement already has a seeded gatehouse, guard, guard captain, merchant, or lookout suitable for the scene, the encounter must bind to that object
- the packet must not create a second gatehouse, a duplicate guard captain, or a redundant checkpoint cast member just because the support bundle lists one
- lazy materialization is only for the missing role in the live scene, not a license to duplicate already coherent world support

| Support object | Delivery mode | Where it comes from | Persistence contract | Future references | Verified by | Status |
|---|---|---|---|---|---|---|
| Gatehouse checkpoint | `pre-seeded` | settlement sublocation generation in [sublocation.ts](/C:/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/engine/sublocation.ts) | `must-persist` | later guard duty, smuggling, inspection, witness, and riot content | direct content inspection | `live` |
| Guard on duty | `pre-seeded` | settlement NPC seeding in [npcSeeding.ts](/C:/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/engine/npcSeeding.ts) via widened rosters in [npc.ts](/C:/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/types/npc.ts) | `must-persist` | faction standing, future petitions, repeat checkpoint encounters | [npcSeeding.test.ts](/C:/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/engine/__tests__/npcSeeding.test.ts) | `live` |
| Guard captain / sergeant | `pre-seeded` | settlement NPC seeding in [npcSeeding.ts](/C:/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/engine/npcSeeding.ts) via `guard_captain` roster roles | `must-persist` | commendation, distrust, future asks, internal watch politics | [npcSeeding.test.ts](/C:/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/engine/__tests__/npcSeeding.test.ts) | `live` |
| Queue witnesses / merchants under pressure | `pre-seeded` + `lazy-materialize-on-trigger` | baseline `merchant` / `trader` seeding plus encounter-scene cast materialized only when no suitable existing witness/merchant is already present | `must-persist` for named merchant fallout, `scene-only` for anonymous crowd texture | rumors, public sentiment, market distrust, future witness encounters | direct content inspection | `author-now` |
| Smuggler courier / contraband carrier | `lazy-materialize-on-trigger` | encounter support bundle attached to the active checkpoint scene, but only if no existing suitable courier/trader/lookout is repurposed into the incident cast | `must-persist` if detained/escaped/notable; `scene-only` only if anonymous and not reused | thieves-guild retaliation, witness memory, evidence chain, repeat offender hooks | packet audit | `author-now` |
| Confiscated seal case / commendation / scrutiny | `pre-seeded` | checkpoint-tagged reward and burden catalog objects in [reward-attachment-catalog.ts](/C:/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/data/reward-attachment-catalog.ts) | `must-persist` | later inspections, social stance, access, debt, reputation | direct content inspection | `live` |
| Checkpoint atmosphere change | `lazy-materialize-on-trigger` | encounter fallout authored into tick events, reputation movement, or future local encounter bias | `must-persist` | later gate tension, market pressure, follow-on unrest or gratitude | packet audit | `author-now` |
| Forged papers / hidden cargo / proof of innocence shell | `blocked-primitive` | future `clearance_gate` / reveal-evidence shell under TB-104 | `blocked-primitive` | any richer checkpoint investigation, exoneration, or planted-evidence arc | [2026-04-03-procedural-content-component-library-audit.md](/C:/Users/chris/Dev/Projects/TheFantasyWorldSimulator/Docs/plans/2026-04-03-procedural-content-component-library-audit.md), [.planning/BACKLOG.md](/C:/Users/chris/Dev/Projects/TheFantasyWorldSimulator/.planning/BACKLOG.md) | `blocked-primitive` |

## What The Support Matrix And Contract Catch

This worked example validates the updated checklist. `cg.quest.gate_duty` now teaches a more useful lesson than “the template is thin”:

- some support belongs in ordinary generation and should stay there:
  - gatehouse
  - guard
  - guard captain
  - merchant/trader pressure
- some support can be lazy-materialized honestly if it is authored as a real persistent object:
- some support can be lazy-materialized honestly if it is authored as a real persistent object and only after checking that the world does not already provide a suitable one:
  - the courier or smuggler at the center of the incident
  - named witness fallout
  - checkpoint atmosphere change
- some support still wants a real primitive and should not be faked:
  - forged papers with reveal state
  - hidden cargo that can be discovered, planted, or later proven innocent
  - richer checkpoint clearance logic across multiple linked encounters

Without the support audit, it would be easy to “improve” the template by adding nicer prose and another reputation number while still leaving the encounter network underbuilt.

## Recommended Next Move

If this encounter becomes a production rewrite candidate, the clean next pass is:

1. keep the Civic Guard / Thieves Guild faction frame
2. treat gatehouse + guard cast + checkpoint reward objects as ordinary pre-seeded support
3. author the courier / witness / checkpoint-fallout bundle as lazy-materialized but persistent support
4. bind the outcome into real reputation, faction, and follow-on encounter channels
5. keep reveal/evidence handling as a primitive-gap dependency instead of faking it

## Main Lesson

The checklist is doing the right job when it forces this answer:

`cg.quest.gate_duty` is no longer blocked on basic cast-and-place support, but it still exposes a real boundary between ordinary world support, honest lazy materialization, and true primitive gaps.

That is exactly the bar we want. The encounter should not pass just because the template exists. It should pass when the cast, places, consequences, and future pressures are all real enough that the world can generate and remember them — whether they are pre-seeded or materialized on trigger.
