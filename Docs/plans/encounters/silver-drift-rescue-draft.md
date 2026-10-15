# Encounter Pipeline: The Fallen Silver Drift
> Scale: medium | Slug: silver-drift-rescue | Pass: draft
> Date: 2026-10-15 | Pipeline version: 3.0 (master-everyday-3, slot 7, THR-1840)

**Template id:** `encounter.town.silver_drift_rescue` · reach stone · rarityTier 2 · scale `local` · intrinsicTier `shaping` · settings `rural`
**Brief:** `Docs/plans/encounters/master-everyday-3-brief.md` (slot 7, binding row)
**Package (machine source of truth for every prose byte below):** `Docs/plans/encounters/silver-drift-rescue.package.json`

## 0. Mechanical design block (fixed before prose)

| Row | Value |
|---|---|
| Crux | A silver drift has fallen in on four miners, and the reeve asks {actor} where to dig before the air goes bad. |
| Title glance test | *The Fallen Silver Drift* — a mine has fallen in; the objective is the people behind it. |
| Shape | **Query prize** on a three-step read → shore → bring-out spine. Linear, branch count 0. |
| Steps | stone 0.74 `Read the fall` (continue_weakened) → stone 0.80 `Shore the drift` (continue_weakened) → stone 0.84 `Bring the miners out` (fail_action). Mean 0.793. |
| Consequence hand (binding, `draw:consequences`) | `condition` + `membership`. No swap. |
| condition | `condition_attachment trait.condition.wounded` on `$cast:miner`, on every step's failure (the fall comes down on the trapped men's side). Person-borne, so it wires `condition`, not `place`. Kept off `$actor` (brief: cap on personal conditions; a master's failure costs the name). |
| membership | `membership_change join builders_fellowship` on `$actor`, `chronicle: true`, step 2 success. The Fellowship that holds the mine takes in whoever brings its people out. |
| Query prize | step 2 `successMetadata.rewardPool` `{ possession: 1 }`, `tagFilters: ['#stone', '#tool']` — six items wear both (Iron Tongs, Master Chisel, Firestarter Kit, Wardwright's Compass, Quartermaster's Harness, Salvage Kit). Fiction: a tool from the mine's store, given by the miners. |
| Standing | `bond_change $cast:reeve` ±0.12 on step 2; −0.04 on steps 0/1 failure. `reputation_with $here` +0.05 / −0.06 on step 2; −0.02 on steps 0/1 failure (backs the critical_failure chips on every route — a crit fail at any step ends the action). |
| Cost channels | All four… six specials essence-priced (2). No Heavy Hand, rider or Undertow. |
| Cool failure | Nobody dies. Failure: another crew brings the four out alive, one with a crushed leg; the reeve's trust is gone. Crit failure: the fall comes down again on the miner; the reeve tells the village the master read the rock wrong. The cost is the name. |
| Ends warm | All four out alive, a gift from the miners, the Fellowship's rolls. |
| Systems | cast, rewards, conditions, factions, reputation = 5 |
| Hook | `plotHookRolled: hook.long_road, hook.masterwork_completion, hook.shifting_shape` · `plotHookTaken: hook.shifting_shape` — the mountain changes shape under the miners: the new drift broke into unmapped old workings. |
| Seed dice | p3 *choice* (through the fall, or around it through the old workings) · opposition *beast (hunger)* read as the hungry mountain, the rock and the bad air · agentRole *judge_asked_to_rule* · setting *ruin* → rural, surviving as the old workings. |
| Whose problem | The reeve sends for {actor} by name as a master of stone; the ruling (where to dig) and the work (props, carrying) are theirs. |
| Value axes | `sacrifice_survival`, `courage_prudence` — going under a failing roof for strangers. No fork. |
| Not colliding | Stone masters strike a vault's centering, bring water down a hill conduit; experts shore a bell tower, mend a dyke. This digs living men out of a fallen mine. |

## 1. Inspiration Anchors

- **Vault `Systems/Anti-Patterns.md`** — "Player as Savior" and consequence-free action: the god never digs; the god sways air, rock, timber and memory, and the mortal carries the men. Failure is a crushed leg and a lost name, not a massacre.
- **Vault `Systems/Thematic Pillars.md`** — the world is indifferent: the opposition is rock and bad air, no villain, no monster (the brief's override of *beast (hunger)*).
- **Hook `hook.shifting_shape`** — the ground changes under everyone; the old workings are both the danger and the way in.
- **Not used:** the dilemma library (no moral fork here).

## 2. Scale Justification

Medium: three beats, because a mine rescue honestly has three jobs — choose where to dig, keep the roof up, get the men out — each a different stone question (reading, building, enduring). Master difficulty, a village's whole livelihood and four lives make it worth a `shaping` chronicle entry, but it stays local: one mine, one village.

## 3. Pressure Knot

The new drift broke into old workings nobody had mapped and the roof came down. Four miners are alive behind it, knocking. The air behind a fall goes bad. The reeve has already sent for the master before the encounter begins.

## 4. Intervention Fantasy

The god works on the mountain itself: makes the trapped men's taps carry through stone, brings old tunnels back into an old digger's memory, toughens green timber, holds cracked rock in place, stirs dead air, puts strength into failing legs. The mortal does the ruling and the carrying.

## 5. Cast and World Objects

| Object | Binding | Role |
|---|---|---|
| {cast:reeve} | actor, reuse `elder` / `steward`, spawn `elder` "Wat Corley" | sends for the master; trust rises or falls |
| {cast:miner} | actor, spawn `mason` "Ivo Tenney" | one of the four trapped; takes the wound on failure |
| Builders Fellowship | `$faction:builders_fellowship` | holds the mine; takes the master in on success |
| {location} | `$here` | the village; regard rises or falls |
| The prize | rewardPool `#stone` + `#tool` | a tool from the mine's store |
| Wounded | `trait.condition.wounded` | on the miner, failure side |

## 6. Beat Structure

1. **Read the fall** (stone 0.74) — through the fall, or around it through the old workings.
2. **Shore the drift** (stone 0.80) — prop each yard as the diggers clear it. Carryover from beat 1.
3. **Bring the miners out** (stone 0.84) — carry four weak men through a narrow passage under a failing roof, in bad air. Carryover from beat 2. Prize, membership, trust on success.

## 7. Branching Profile

Linear — no branching. Branch count 0.

## 8. Branching Map

N/A — linear encounter.

## 9. Outcome Ladder

- **critical_success** — all four walk out before the roof comes down behind them; the village rings its bell; tool from the miners; Fellowship rolls; reeve's trust; village regard.
- **success** — all four carried out alive; tool; rolls; trust; regard.
- **success_at_cost** — all four out alive; tool; rolls; trust; regard; the rescue went hard and ran long (an early step failed or a step landed at cost — the step afterimage says which: a lost morning, the hoist timber, the drift itself, or a stone on the miner).
- **failure** — another crew brings them out two days later, alive; {cast:miner} wounded; reeve trusts less; village thinks less. The reeve had to send again.
- **critical_failure** — the fall comes down again on {cast:miner}; another crew brings the four out days later, alive; the reeve tells the village the master read the rock wrong.

## 9b. Stakes Line

```
goal:      bring the four trapped miners out of the fallen drift
risk:      see the fall crush a miner and lose the reeve's trust
won:       brought the four trapped miners out of the fallen drift
lost:      left the trapped miners for another crew to bring out
lostBadly: brought the fall down on a miner and lost the reeve's trust
```

Description: *A silver mine above a village has fallen in, and four miners are alive behind the fall. Someone has to say where to dig, prop the drift, and bring them out before the air goes bad.*

## 10. Sample Opening (rural; opening + step-0 spine, 76 words)

> {actor} comes up the mine track above {location}, sent for by the mine's reeve.
>
> The new silver drift has fallen in. It broke into old workings no one had mapped, and the roof came down behind four miners. They are alive. The diggers can hear them knocking. Behind a fall the air goes bad.
>
> The diggers can go through the fall, or around it through the old workings. {cast:reeve} asks {actor} to choose where to dig.

## 11. The Hand Per Step

Every step: 2 authored specials + `deal: { count: 3 }` → composed 5. Sphere spread across specials plus fill ≥4; the deal brings the ungated common option.

**Step 0 — Read the fall.** `deal: { count: 3, tags: ['craft', 'insight'] }`
- **Carry Faint Knocking** (Whisper; matter; 2 essence; +0.10; `generic.matter`) — *Make the trapped men's taps travel clear through the rock, so they show where the men lie.*
  - crit: The taps rang clear through the rock, and {actor} could point to the yard where the men lay. · success: The taps came clear through the rock, from beyond the old workings' far end. · near_miss: The taps came clear only by evening, after a day of guessing. · failure: The taps rang through every crack at once, and seemed to come from all sides.
- **Remember Lost Tunnels** (Omen/memory Boost; mind; 2; +0.08; `generic.memory`) — *Bring back to the village's oldest diggers where the old workings ran, so a path around the fall can be named.*
  - success: An old digger remembered where the old workings ran, and drew them in the dust. · success_at_cost: An old digger remembered the old workings, and remembered a man who died in them, and would not go in. · failure: The old diggers remembered three different workings, and argued about all three until noon. · critical_failure: An old digger remembered the workings wrong, and swore to it, and the reeve believed the old digger.

**Step 1 — Shore the drift.** `deal: { count: 3, tags: ['labor', 'craft'] }`
- **Harden Green Timber** (Boost; life; 2; +0.10; `generic.strength`) — *Toughen the fresh-cut props, so they bear the roof longer than new wood should.*
  - crit: The fresh props took the roof's weight without a creak, all the way to the far end. · success: The green props bent and held, where new wood should have split. · near_miss: The props held only after two of them split and were set again. · failure: The props held, and the rock between them did not. · critical_failure: The props held so hard that the roof broke around them instead.
- **Still Loose Rock** (Ward; order; 2; +0.08; `generic.ward`) — *Hold the cracked stone above the drift in place while the props go in.*
  - success: The cracked stone overhead stayed where it hung until every prop was in. · success_at_cost: The stone overhead held, but a diggers' lamp went under a slide at the side. · failure: The stone overhead held for a day, then came down all at once. · critical_failure: The stone held until the diggers were deepest in, then let go.

**Step 2 — Bring the miners out.** `deal: { count: 3, tags: ['labor', 'peril'] }`
- **Stir Dead Air** (Boost; chaos; 2; +0.07; `generic.energy`) — *Set the foul air behind the fall moving, so clean air reaches the men and the lamps stay lit.*
  - crit: Clean air came down the passage like a draught from an open door, and every lamp burned bright. · success: The bad air moved off, and the lamps stayed lit long enough to carry the men out. · near_miss: The air cleared only after the first lamp had gone out twice. · failure: The air moved, and drew the bad air from the old workings in behind it.
- **Rouse Weary Bodies** (Balm; life; 2; +0.08; `generic.vigor`) — *Put strength back into the trapped men's legs, so they can crawl part of the distance themselves.*
  - success: {cast:miner} found the strength to crawl, and the others followed. · success_at_cost: The men crawled out on their own, and one of them fainted at the mouth of the drift. · failure: The men found the strength to stand, stood too soon, and the passage roof cracked over them. · critical_failure: {cast:miner} tried to climb out first, and brought the passage roof down.

**Trait hooks.** Gate: none (everyday, no rule gate). Variant: `trait.personality.stone.virtue` +0.04 "Being Careful, they test every prop before a digger stands under it."; `trait.core.core_humility.vice` −0.05 "Being Proud, they will not wait for the reeve's timber." Trait-only nudge: none (the deal may supply one). Trait fragment: none.

## 12. Linear continuation (step 1 and step 2 spines)

> The diggers go in where {actor} chose. Every yard they clear must be propped with timber before they clear the next, or the roof comes down on them too. Loose rock hangs over the whole length. {actor} must set the props as fast as the diggers clear.

> On the second night the diggers break through. The air behind the fall is bad, and a lamp will not stay lit in it. {cast:miner} and the three others are too weak to climb. They must be carried out through the narrow passage the diggers made, under a roof that will not hold much longer.
>
> The Builders Fellowship holds this mine. It takes in whoever brings its people out.

Step afterimages (verbatim in the package): step 0 — crit *read the fall in an hour…*, success *chose the old workings…*, at cost *stood on the fall too long… lost the morning*, failure *chose to dig through the fall… a stone came down on {cast:miner}*, crit fail *sent the diggers into the fall… would not send them back*. Step 1 — crit *every prop held…*, success *props held; loose rock missed them twice*, at cost *took the timber from the hoist house*, failure *a prop gave way… the knocking stopped for an hour*, crit fail *roof came down along half the drift*. Step 2 — crit *all four out on their feet… walked down unhelped*, success *weakest out first; all four alive*, at cost *roof came down behind the last; the new drift is lost*, failure *the air went bad… sent down the valley for another crew*, crit fail *roof came down on the passage while {cast:miner} was in it… crushed leg*.

## 13. Aftermath Paragraph (success)

> {actor} brought all four miners out of the fallen drift alive. The miners give {actor} a tool from the mine's store in thanks.

## 14. Aftermath Reaction Choices

Success side (fallback reactions, all three success bands):
- **Seal the old workings** — *The mortal has the reeve wall up the old workings. The village sleeps easier, and the mine gives up the ore past the fall.* (+0.03 regard; −0.06 reeve) — safety over silver.
- **Prop a road for the crews** — *The mortal sets props past the fall, so the mine can dig there. The reeve is grateful; the miners' families are not.* (+0.08 reeve; −0.02 regard) — the mine's living over the families' fear.

Failure side (failure + critical_failure):
- **Wait at the mine mouth** — stays until the other crew brings them out (+0.10 bond miner; +0.02 regard) — owning the failure in public.
- **Leave before the other crew comes** — goes down the valley (−0.03 regard) — sparing the name the sight, at the village's notice.

## 15. Aftermath Kit Summary

| Band | Overview | Chips (scar · bond · boon · path) |
|---|---|---|
| critical_success | All four walked out before the roof came down behind them, and {location} rang its bell for them. The miners give {actor} a tool… | bond: Taken In (Fellowship) · The Reeve's Trust · Well Regarded |
| success | {actor} brought all four… alive. The miners give {actor} a tool… | same three |
| success_at_cost | All four are out alive and give {actor} a tool… The rescue went hard, and it ran longer than the reeve wanted. | same three |
| failure | Another crew brought the four out two days later, alive. {cast:reeve} sent for a master to do it, and had to send again. | scar: Crushed Leg (Wounded, {cast:miner}) · bond: Reeve's Trust (loss) · Found Wanting |
| critical_failure | The fall came down again on {cast:miner}. Another crew brought the four out days later, alive. {cast:reeve} tells {location} that the master read the rock wrong. | scar: Crushed Leg · Reeve's Trust (loss) · Out of Favour |

## 16. Support Bundle Contract

| Support object | Delivery | Source | Persistence | Future references | Status |
|---|---|---|---|---|---|
| reeve | lazy-materialize-on-trigger | reuse elder/steward, spawn elder | must-persist | bond edges | built |
| miner | lazy-materialize-on-trigger | spawn mason | must-persist | Wounded condition, bond edge | built |
| builders_fellowship | pre-seeded | `src/data/builders-fellowship-definition.ts` | must-persist | member_of edge | built |
| prize | reward pool | `reward-attachment-catalog.ts` (#stone ∧ #tool, 6 items) | must-persist | held item | built |

## 17. Self-Audit

| Item | Verdict |
|---|---|
| Envelope + one opening per class (rural) | PASS |
| Opening ≤80 words (76) | PASS |
| Hands 4–8 composed, ≥4 spheres, ≥1 common (via deal) | PASS (gate) |
| Every special has a failure fragment | PASS |
| Card faces verb+noun, no word repeated in effect line, no digits | PASS |
| Six bands covered per hand | PASS |
| Every drawn family wired (condition, membership) | PASS (gate) |
| Chips backed on their bands (Law 56); crit-fail chips backed on every route | PASS |
| No invented state (prose rule 7); no unbacked promise (7b) | PASS — the Fellowship line is backed by the step-2 join |
| Difficulty band 0.72–0.85 | PASS |
| Gate `check-encounter-batch3 --package` | PASS: `✓ … [systems: cast, rewards, conditions, reputation, factions]`, OK, 0 warnings |
| Vault reading | FLAG — Anti-Patterns read; Thematic Pillars / Cheat Sheet skimmed only. |

## Concept Art Direction

1. *Emotions:* waiting, held breath, a village's livelihood under a mountain.
2. *Image:* a row of four miners' lamps hung unlit on pegs at a mine mouth at dusk, one peg empty; fresh-cut timber stacked beside a tally stick. No people.

## Experience Differentiator Gate

1 YES · 2 YES · 3 YES · 4 YES · 5 YES · 6 YES · 7 YES · 8 YES · 9 YES · 9b YES · 10 YES · 11 YES · 11b YES · 12 YES · 13 YES · 14 YES
