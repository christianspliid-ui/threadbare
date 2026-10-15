# Encounter Pipeline: The Fallen Silver Drift
> Scale: medium | Slug: silver-drift-rescue | Pass: final
> Date: 2026-10-15 | Pipeline version: 3.0 (master-everyday-3, slot 7, THR-1840)
> Status: **READY WITH CAVEATS**

---

## Pipeline Summary

| Pass | Verdict | Notes |
|------|---------|-------|
| Draft | Complete | Query-prize stone rescue on a read, shore, bring-out spine. Fallen silver drift, four trapped miners, the reeve asks where to dig. |
| Editorial | PASS WITH REVISIONS | 15 prose and page-read fixes applied to the package: failure, critical_failure and success_at_cost overviews, seam echoes, the step-2 failure and critical_failure afterimages (so the Crushed Leg chip is told on every route), two effect lines. No mechanics changed. |
| Systems | READY WITH CAVEATS | Every primitive is live. All chips are backed on their bands. One required prose edit to a narrativeTemplate line. |

### Caveats / Blockers

No blockers. Caveats:

1. **Required package edit:** `template.narrativeTemplates.failure`: "Another crew brought the miners out, and the reeve no longer trusts the master's reading of rock." -> "Another crew was sent for to bring the miners out, and the reeve no longer trusts the master's reading of rock." (A past-tense claim of an event no effect performs, and it contradicts the failure overview.) **Applied by the orchestrator 2026-10-15; the packet below carries the new wording, and the gate was re-run green.**
2. The package `doc` block has stale comment text (opening word count, early cool-failure wording). Comment only.
3. Accepted limit: `success_at_cost` carries the same chips as `success`; its cost is told in the step afterimages. Same limit as the witch-trial package.
4. Live evidence: at master difficulty the proof ascendant loses most natural runs. Take a seed sweep plus a pinned band; success-side rows on a failed run are not exercised.

### Editorial Notes Summary

The editor kept the design and fixed the page. The failure and critical_failure overviews no longer finish the rescue in the past tense under reactions that are set before it; the critical_failure overview no longer repeats the scar chip. The success_at_cost overview now reads true on every route. Seam echoes between the opening, spines, afterimages and overviews were removed. The step-2 cs afterimage lets the props hold, so critical_success no longer shares its cost with success_at_cost. The step-2 failure afterimage and the step-0, step-1 and step-2 critical_failure afterimages now put the fall on the miner, which backs the Crushed Leg chip on every route. "that way" was removed from a step-0 afterimage. Stir Dead Air and Remember Lost Tunnels effect lines were rewritten, and a Still Loose Rock fragment was fixed.

### Implementation File Map

Beyond the compiled set: none. `Docs/plans/encounters/silver-drift-rescue.package.json` compiles into the encounter module, its structural test and both registrations. Closeout stamps `hook.shifting_shape` into `src/data/content-eval/plotHooks.ts` `usedBy`.

---

## Encounter Packet

**Template id:** `encounter.town.silver_drift_rescue` · reach stone · rarityTier 2 · scale `local` · intrinsicTier `shaping` · settings `rural`
**Brief:** `Docs/plans/encounters/master-everyday-3-brief.md` (slot 7, binding row)
**Package (machine source of truth for every prose byte below):** `Docs/plans/encounters/silver-drift-rescue.package.json`.

### 0. Mechanical design block (fixed before prose)

| Row | Value |
|---|---|
| Crux | A silver drift has fallen in on four miners, and the reeve asks {actor} where to dig before the air goes bad. |
| Title glance test | *The Fallen Silver Drift*: a mine has fallen in, and the objective is the people behind it. |
| Shape | **Query prize** on a three-step read, shore, bring-out spine. Linear, branch count 0. |
| Steps | stone 0.74 `Read the fall` (continue_weakened) -> stone 0.80 `Shore the drift` (continue_weakened) -> stone 0.84 `Bring the miners out` (fail_action). Mean 0.793. |
| Consequence hand (binding, `draw:consequences`) | `condition` + `membership`. No swap. |
| condition | `condition_attachment trait.condition.wounded` on `$cast:miner`, on every step's failure. Person-borne, so it wires `condition`, not `place`. Kept off `$actor` (brief: cap on personal conditions; a master's failure costs the name). |
| membership | `membership_change join builders_fellowship` on `$actor`, `chronicle: true`, step 2 success. |
| Query prize | step 2 `successMetadata.rewardPool` `{ possession: 1 }`, `tagFilters: ['#stone', '#tool']`. Six items wear both (Iron Tongs, Master Chisel, Firestarter Kit, Wardwright's Compass, Quartermaster's Harness, Salvage Kit). Fiction: a tool from the mine's store, given by the miners. |
| Standing | `bond_change $cast:reeve` +0.12 / -0.12 on step 2; -0.04 sentiment, -0.05 trust on steps 0/1 failure. `reputation_with $here` +0.05 / -0.06 on step 2; -0.02 on steps 0/1 failure. This backs the critical_failure chips on every route, because a crit fail at any step ends the action. |
| Cost channels | All six specials essence-priced (2). No Heavy Hand, rider or Undertow. |
| Cool failure | Nobody dies. Failure: the fall crushes {cast:miner}'s leg, the miners stay behind the fall for another crew, and the reeve, who sent for a master, has to send again. Crit failure: the fall comes down on the miner, and the reeve tells the village the master read the rock wrong. The cost is the name. |
| Ends warm | All four home alive, the village's bell, a gift from the miners, the Fellowship's rolls. |
| Systems | cast, rewards, conditions, factions, reputation = 5 |
| Hook | `plotHookRolled: hook.long_road, hook.masterwork_completion, hook.shifting_shape` · `plotHookTaken: hook.shifting_shape`. The new drift broke into unmapped old workings. |
| Seed dice | p3 *choice* (through the fall, or around it through the old workings) · opposition *beast (hunger)*, read as the hungry mountain: the rock and the bad air · agentRole *judge_asked_to_rule* · setting *ruin* -> rural, surviving as the old workings. |
| Whose problem | The reeve sends for {actor} by name as a master of stone. The ruling (where to dig) and the work (props, carrying) are theirs. |
| Value axes | `sacrifice_survival`, `courage_prudence`. No fork. |
| Not colliding | Stone masters strike a vault's centering or bring water down a hill conduit. Stone experts shore a bell tower or mend a dyke. This one digs living men out of a fallen mine. |

### 1. Inspiration Anchors

- **Vault `Systems/Anti-Patterns.md`**: "Player as Savior" and consequence-free action. The god never digs. The god sways air, rock, timber and memory, and the mortal carries the men. Failure is a crushed leg and a lost name, not a massacre.
- **Vault `Systems/Thematic Pillars.md`**: the world is indifferent. The opposition is rock and bad air, with no villain and no monster.
- **Hook `hook.shifting_shape`**: the ground changes under everyone. The old workings are both the danger and the way in.
- **Not used:** the dilemma library (no moral fork here).

### 2. Scale Justification

Medium: three beats, because a mine rescue honestly has three jobs: choose where to dig, keep the roof up, get the men out. Each is a different stone question (reading, building, enduring). Master difficulty, a village's whole livelihood and four lives make it worth a `shaping` chronicle entry, but it stays local: one mine, one village.

### 3. Pressure Knot

The new drift broke into old workings nobody had mapped, and the roof came down. Four miners are alive behind it, knocking. The air behind a fall goes bad. The reeve has already sent for the master before the encounter begins.

### 4. Intervention Fantasy

The god works on the mountain itself. It makes the trapped men's taps carry through stone, wakes an old digger's memory of old tunnels, toughens green timber, holds cracked rock in place, moves foul vapour, and puts strength into failing legs. The mortal does the ruling and the carrying.

### 5. Cast and World Objects

| Object | Binding | Role |
|---|---|---|
| {cast:reeve} | actor, reuse `elder` / `steward`, spawn `elder` "Wat Corley" | sends for the master; trust rises or falls |
| {cast:miner} | actor, spawn `mason` "Ivo Tenney" | one of the four trapped; takes the wound on failure |
| Builders Fellowship | `$faction:builders_fellowship` | holds the mine; takes the master in on success |
| {location} | `$here` | the village; regard rises or falls |
| The prize | rewardPool `#stone` + `#tool` | a tool from the mine's store |
| Wounded | `trait.condition.wounded` | on the miner, failure side |

### 6. Beat Structure

1. **Read the fall** (stone 0.74): through the fall, or around it through the old workings.
2. **Shore the drift** (stone 0.80): prop each yard as the diggers clear it. Carryover from beat 1.
3. **Bring the miners out** (stone 0.84): carry four weak men through a narrow passage under a failing roof, in bad air. Carryover from beat 2. Prize, membership and trust on success.

### 7. Branching Profile

Linear, no branching. Branch count 0.

### 8. Branching Map

N/A (linear encounter).

### 9. Outcome Ladder

- **critical_success**: all four out on their feet with the props still holding; the village rings its bell; a tool from the miners; Fellowship rolls; the reeve's trust; village regard.
- **success**: all four carried out alive and home with their families; tool; rolls; trust; regard.
- **success_at_cost**: all four out alive; tool; rolls; trust; regard. The rescue cost the mine. The step afterimage says what: a lost morning, the hoist timber, the new drift itself, or a stone on the miner.
- **failure**: the fall slides again and crushes {cast:miner}'s leg. {actor} gets the diggers out, but not the miners. The reeve sends for another crew. The reeve trusts {actor} less, and the village thinks less of {actor}. The reeve sent for a master and now has to send again.
- **critical_failure**: the fall comes down on {cast:miner}. Another crew is coming for the miners. The reeve tells the village the master read the rock wrong.

### 9b. Stakes Line

```
goal:      bring the four trapped miners out of the fallen drift
risk:      see the fall crush a miner and lose the reeve's trust
won:       brought the four trapped miners out of the fallen drift
lost:      left the trapped miners for another crew to bring out
lostBadly: brought the fall down on a miner and lost the reeve's trust
```

Description: *A silver mine above a village has fallen in, and four miners are alive behind the fall. Someone has to say where to dig, prop the drift, and bring them out before the air goes bad.*

### 10. Sample Opening (rural; opening + step-0 spine, 73 words)

> {actor} comes up the mine track above {location}, sent for by the mine's reeve.
>
> The new silver drift has fallen in. It broke into old workings no one had mapped, and the roof came down behind four miners. They are alive. The diggers can hear them knocking. Behind a fall the air goes bad.
>
> {cast:reeve} can send the diggers through the fall, or around it through the old workings, and asks {actor} to choose.

### 11. The Hand Per Step

Every step: 2 authored specials + `deal: { count: 3 }` -> a composed hand of 5. The specials and the fill together cover at least four spheres. The deal brings the ungated common option.

**Step 0: Read the fall.** `deal: { count: 3, tags: ['craft', 'insight'] }`
- **Carry Faint Knocking** (Whisper; matter; 2 essence; +0.10; `generic.matter`): *Make the trapped men's taps travel clear through the rock, so they show where the men lie.*
  - crit: The taps rang clear through the rock, and {actor} could point to the yard where the men lay.
  - success: The taps came clear through the rock, from beyond the old workings' far end.
  - near_miss: The taps came clear only by evening, after a day of guessing.
  - failure: The taps rang through every crack at once, and seemed to come from all sides.
- **Remember Lost Tunnels** (Omen/memory Boost; mind; 2; +0.08; `generic.memory`): *Wake the oldest diggers' memory of the old workings, so they can name a path around the fall.*
  - success: An old digger remembered where the old workings ran, and drew them in the dust.
  - success_at_cost: An old digger remembered the old workings, and remembered a man who died in them, and would not go in.
  - failure: The old diggers remembered three different workings, and argued about all three until noon.
  - critical_failure: An old digger remembered the workings wrong, and swore to it, and the reeve believed the old digger.

**Step 1: Shore the drift.** `deal: { count: 3, tags: ['labor', 'craft'] }`
- **Harden Green Timber** (Boost; life; 2; +0.10; `generic.strength`): *Toughen the fresh-cut props, so they bear the roof longer than new wood should.*
  - crit: The fresh props took the roof's weight without a creak, all the way to the far end.
  - success: The green props bent and held, where new wood should have split.
  - near_miss: The props held only after two of them split and were set again.
  - failure: The props held, and the rock between them did not.
  - critical_failure: The props held so hard that the roof broke around them instead.
- **Still Loose Rock** (Ward; order; 2; +0.08; `generic.ward`): *Hold the cracked stone above the drift in place while the props go in.*
  - success: The cracked stone overhead stayed where it hung until every prop was in.
  - success_at_cost: The stone overhead held, but a slide at the side buried a digger's lamp.
  - failure: The stone overhead held for a day, then came down all at once.
  - critical_failure: The stone held until the diggers were deepest in, then let go.

**Step 2: Bring the miners out.** `deal: { count: 3, tags: ['labor', 'peril'] }`
- **Stir Dead Air** (Boost; chaos; 2; +0.07; `generic.energy`): *Move the foul vapour out from behind the fall, so the men can breathe and the lamps stay lit.*
  - crit: Clean air came down the passage like a draught from an open door, and every lamp burned bright.
  - success: The bad air moved off, and the lamps stayed lit long enough to carry the men out.
  - near_miss: The air cleared only after the first lamp had gone out twice.
  - failure: The air moved, and drew the bad air from the old workings in behind it.
- **Rouse Weary Bodies** (Balm; life; 2; +0.08; `generic.vigor`): *Put strength back into the trapped men's legs, so they can crawl part of the distance themselves.*
  - success: {cast:miner} found the strength to crawl, and the others followed.
  - success_at_cost: The men crawled out on their own, and one of them fainted at the mouth of the drift.
  - failure: The men found the strength to stand, stood too soon, and the passage roof cracked over them.
  - critical_failure: {cast:miner} tried to climb out first, and brought the passage roof down.

**Trait hooks.**
- Gate: none (everyday, no rule gate).
- Variant `trait.personality.stone.virtue`, +0.04: "Being Careful, they test every prop before a digger stands under it."
- Variant `trait.core.core_humility.vice`, -0.05: "Being Proud, they will not wait for the reeve's timber."
- Trait-only nudge: none (the deal may supply one).
- Trait fragment: none.

### 12. Linear continuation (step 1 and step 2 spines) and step afterimages

**Step 1 spine**
> The diggers go in where {actor} said. Every yard they clear must be propped with timber before they clear the next, or the roof comes down on them too. Loose rock hangs over the whole length. {actor} must set the props as fast as the diggers clear.

**Step 2 spine**
> On the second night the diggers break through. The air behind the fall is bad, and a lamp will not stay lit in it. {cast:miner} and the three others are too weak to climb. They must be carried out through the narrow passage the diggers made, under a roof that will not hold much longer.
>
> The Builders Fellowship holds this mine. It takes in whoever brings its people out.

**Step 0 afterimages**
- critical_success: {actor} read the fall in an hour. The old workings ran around it under sound rock, and the diggers went in through them at once.
- success: {actor} chose the old workings. Their roof was sound, and they ran around the fall to a few yards from the trapped men.
- success_at_cost: {actor} chose the old workings, but stood on the fall too long reading it. A second slide came down where they had stood, and the diggers lost the morning clearing it.
- failure: {actor} chose to dig through the fall. The rock shifted when the diggers opened it, and a stone came down on {cast:miner} on the far side.
- critical_failure: {actor} sent the diggers into the fall, and it came down again on the far side, on {cast:miner}. {cast:reeve} called the diggers out and would not send them back on the master's word.

**Step 1 afterimages**
- critical_success: Every prop {actor} set held. The diggers cleared the whole length in a day and a night, and the roof stayed up over all of it.
- success: The props held. Loose rock came down twice between them and missed the diggers both times.
- success_at_cost: The props held, but {actor} took the timber from the hoist house to set them. The mine cannot lift ore until it is replaced.
- failure: A prop gave way at the far end, and the last yard of roof came down. The rock fell on {cast:miner}'s side too, and the knocking stopped for an hour.
- critical_failure: The roof came down along half the drift, and the fall slid again on {cast:miner}'s side. The diggers got out, and {cast:reeve} would not send them back under the master's props.

**Step 1 carryover factor lines**
- critical_success, for +0.06: "They found a sound path to the trapped men."
- success, for +0.04: "They chose the old workings, under sound rock."
- success_at_cost, against -0.02: "The diggers lost a morning to a second slide."
- near_miss, against -0.03: "They chose where to dig only after a long day."
- failure, against -0.05: "They sent the diggers through the fall itself."

**Step 2 afterimages**
- critical_success: {actor} got all four out on their feet, and the props held behind the last of them. {cast:miner} walked down to the village unhelped.
- success: {actor} sent the weakest out first. All four miners came out into the daylight alive.
- success_at_cost: All four miners came out alive. The roof came down behind the last of them, and the new drift is lost.
- failure: The air went bad before the men could be carried, and the fall slid again and crushed {cast:miner}'s leg. {actor} got the diggers out, but not the miners.
- critical_failure: The roof came down on the passage while {cast:miner} was in it. The diggers pulled the miner free with a crushed leg, and {cast:reeve} called everyone out of the drift.

**Step 2 carryover factor lines**
- critical_success, for +0.06: "The props they set held the whole length."
- success, for +0.04: "The props they set are holding."
- success_at_cost, against -0.02: "The mine gave up its hoist timber for the props."
- near_miss, against -0.03: "Two of their props split and were set again."
- failure, against -0.05: "The roof came down on the last yard they propped."

**narrativeTemplates (package bytes; see Caveat 1 for the required change to `failure`)**
- initiation: "A silver mine has fallen in above a village, and its reeve sends for a master to bring out the four miners behind the fall."
- success: "The four miners came out of the fallen drift alive."
- failure: "Another crew was sent for to bring the miners out, and the reeve no longer trusts the master's reading of rock."

### 13. Aftermath Paragraph (success)

> The four miners are back with their families in {location}. They give {actor} a tool from the mine's store in thanks.

### 14. Aftermath Reaction Choices

Success side (fallback reactions, all three success bands):
- **Seal the old workings**: *The mortal has the reeve wall up the old workings. The village sleeps easier, and the mine gives up the ore past the fall.* (+0.03 regard; -0.06 reeve). Safety over silver.
- **Prop a road for the crews**: *The mortal sets props past the fall, so the mine can dig there. The reeve is grateful; the miners' families are not.* (+0.08 reeve; -0.02 regard). The mine's living over the families' fear.

Failure side (failure + critical_failure):
- **Wait at the mine mouth**: *The mortal waits at the mine mouth until the other crew brings the miners out. The miners' families see who stayed.* (+0.10 bond miner; +0.02 regard). Owning the failure in public.
- **Leave before the other crew comes**: *The mortal goes down the valley before the other master arrives, and does not watch another crew finish the work. The village marks who did not stay.* (-0.03 regard). Sparing the name the sight, at the village's notice.

Fallback overview (unused while all bands are covered): "The rescue at the silver drift is over, and {location} waits to see what the mine does next."

### 15. Aftermath Kit Summary

| Band | Overview | Chips (scar · bond · boon · path) |
|---|---|---|
| critical_success | {location} rang its bell for the four miners when they came home. The miners give {actor} a tool from the mine's store in thanks. | bond · a membership: Taken In, "Brought its miners out — {actor} is on the Builders Fellowship's rolls now." · bond · reputation: The Reeve's Trust, "{cast:reeve} trusts {actor} now." · bond · reputation with {location}: Well Regarded, "{location} thinks well of {actor} now." |
| success | The four miners are back with their families in {location}. They give {actor} a tool from the mine's store in thanks. | same three |
| success_at_cost | The miners give {actor} a tool from the mine's store in thanks. {cast:reeve} is counting what the rescue cost the mine. | same three |
| failure | {cast:reeve} has sent down the valley for another crew to dig the miners out. They are alive behind the fall. The reeve sent for a master, and now has to send again. | scar · Wounded: Crushed Leg, "{cast:miner} is wounded from the fall." · bond · reputation: The Reeve's Trust, "{cast:reeve} trusts {actor} less now." · bond · reputation with {location}: Found Wanting, "{location} thinks less of {actor} now." |
| critical_failure | The miners are alive, and another crew is coming up the valley for them. {cast:reeve} tells {location} that the master read the rock wrong. | scar · Wounded: Crushed Leg · The Reeve's Trust (loss) · Out of Favour, "{location} thinks less of {actor} now." |

### 16. Support Bundle Contract

| Support object | Delivery | Source | Persistence | Future references | Status |
|---|---|---|---|---|---|
| reeve | lazy-materialize-on-trigger | reuse elder/steward, spawn elder | must-persist | bond edges | built |
| miner | lazy-materialize-on-trigger | spawn mason | must-persist | Wounded condition, bond edge | built |
| builders_fellowship | pre-seeded | `src/data/builders-fellowship-definition.ts` | must-persist | member_of edge | built |
| prize | reward pool | `reward-attachment-catalog.ts` (#stone AND #tool, 6 items) | must-persist | held item | built |

### 17. Self-Audit

| Item | Verdict |
|---|---|
| Envelope + one opening per class (rural) | PASS |
| Opening ≤80 words (73) | PASS |
| Hands 4–8 composed, ≥4 spheres, ≥1 common (via deal) | PASS (gate) |
| Every special has a failure fragment | PASS |
| Card faces verb+noun, no name word repeated in effect line, no digits | PASS |
| Six bands covered per hand | PASS |
| Every drawn family wired (condition, membership) | PASS (gate) |
| Chips backed on their bands (Law 56); crit-fail chips backed on every route; Crushed Leg told on every failure/cf route | PASS (systems pass confirmed) |
| No invented state (prose rule 7); no unbacked promise (7b) | PASS except `narrativeTemplates.failure` (Caveat 1). The Fellowship line is backed by the step-2 join. |
| Page read (THR-1474) | PASS (after the editorial pass) |
| Difficulty band 0.72–0.85 | PASS |
| Private gate `check-encounter-batch3 --package` | PASS: OK, 0 warnings |

### Concept Art Direction

1. *Emotions:* waiting, held breath, a village's livelihood under a mountain.
2. *Image:* a row of four miners' lamps hung unlit on pegs at a mine mouth at dusk, one peg empty, with fresh-cut timber stacked beside a tally stick. No people.
