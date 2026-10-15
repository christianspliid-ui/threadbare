# Encounter Pipeline: The Fugitive Friar
> Scale: medium | Slug: fugitive-friar | Pass: draft
> Date: 2026-10-15 | Pipeline version: 2.0
> Batch: master-everyday-3 (THR-1840), slot 5 · id `encounter.town.fugitive_friar` (final)

## 0. Mechanical design block (designed before the prose)

```
Brief row       reach shadow · steps shadow 0.74 → shadow 0.80 (mean 0.77, window fit 0.91) ·
                shape opt-in complication · settings urban · consequence hand
                possession + membership (binding, no swap) · rarityTier 2 · scale local ·
                intrinsicTier shaping
Rolled          plotHookRolled: hook.apotheosis, hook.impossible_choice, hook.sacred_crime
                plotHookTaken:  hook.sacred_crime (drifted: the crime is the bishop's
                                sentence on a preacher, and the master's crime is getting
                                him out). apotheosis set aside (no ascension in a street
                                job); impossible_choice survives only as the fork's weight
                                (risk the gate, or risk the search).
                p3Shape choice · opposition terrain (indifference), read as the shut town
                itself — walls, chained gates, a watch doing its rounds; no villain ·
                disposition n/a · agentRole bystander_pulled_in (the friar hides on their
                doorstep) · scale settlement · system traits (advisory, taken as two
                trait variants)
Crux            A friar the bishop condemned is hiding behind {actor}'s lodging in a shut
                town, and asks {actor} to get him out before the morning bells.
Title           The Fugitive Friar — the complication in two words.
Whose problem?  The agent's, by proximity: the friar is hiding behind their lodging and
                asks them by name in the scene. Scene-local (no prior tie asserted).
Reach = theme?  Shadow throughout. Step 0 (shadow 0.74) finds the way out of a shut
                town: the water-gate under the mill, and where the watch searches.
                Fork on courage_prudence (the opt-in gate, agent-decided):
                  positive (Vanguard) — take the friar through the water-gate tonight,
                    under the watch's rounds (shadow 0.80, the brief's step 2).
                  negative (Watcher) — decline the gate; hide the friar under the stable
                    floor through the house-by-house search until the gates reopen
                    (shadow 0.76).
                Both arms are master tests (0.72–0.85).
Shape           Opt-in Complication. Step 0 is taken by every mortal. The decline arm
                (hide, do not run) is LEGIBLE (no gate, no grating, no fields) and
                CHEAPER IN WHAT IT RISKS (smaller reputation swing; no guild membership
                on offer) but priced in the master band, because a house-by-house search
                is not easy to sit through. The two step-0 specials carry opposite pole
                leans; the player never picks.
Carryover       Step 0 continue_weakened. Both arms author carryoverFactorLines keyed on
                step 0 (critical_failure omitted: a step-0 critical failure ends the
                action).
Forecast sums   step 0: 0.74 + 0.06 + 0.06 = 0.86 · gate: 0.80 + 0.12 + 0.10 = 1.02 → the
                Heavy Hand lowered to 0.10 so 0.80 + 0.10 + 0.10 = 1.00 · hide: 0.76 +
                0.10 + 0.08 = 0.94 — every step ≤ 1.
Opposition      The shut town and its watch: Sergeant {cast:sergeant} on both arms. The
                bishop is the pressure off-stage, never on it.
Consequence hand (binding, THR-1145): possession + membership — no swap.
  possession    attachment_grant reward_tomes_scrolls_prayer_scroll (Prayer Scroll) to
                $actor on every success side of both arms: what the friar leaves the
                master when he goes.
  membership    membership_change join thieves_guild ($actor, chronicle) on the gate
                arm's success side only: the smugglers who use the same water-gate saw
                a friar got past the bishop's watch, and put the master on their rolls.
                (The Thieves Guild seeds in towns, cities and capitals; the encounter is
                urban-only.)
Extras          Hide arm success: bond_change $cast:friar +0.10 / trust +0.08 (he lay under
                their floor for days). Failure sides: reputation_with $here (−0.03 on
                step 0, −0.07 gate arm, −0.05 hide arm) — the name before the purse.
                Reactions: bond_change $cast:friar and reputation_with $here.
Cool failure    Nobody is killed, jailed or branded. The friar is taken; the town that
                trusted the master to hide him stops trusting them. At critical failure
                the bishop's court hears the master's name — and that is all it does.
Trait hooks     Gate: none. Variants: Scheming (trait.personality.shadow.vice) +0.04;
                True (trait.core.core_integrity.virtue) −0.04. Trait-only nudge: none
                (no trait carries the price this scene would charge). Trait fragment: none.
Cost channels   One Heavy Hand (the batch's one): Bend The Bars, libraryCardId
                card.heavy_hand.signature.force, essence 0, costs.detectionDelta 0.15 — one
                channel. Every other special prices in essence. No rider, no darkness
                Undertow, no card grants.
Systems quota   cast (friar, sergeant) + items (Prayer Scroll) + factions (Thieves Guild
                membership) + reputation (reputation_with $here, bond_change) — four.
Expert collision Shadow on the board: find the coiners, unmask a council spy (masters);
                raid a tithe barn, crack a strongroom (experts). This verb smuggles a
                person out; it takes nothing and unmasks no one.
```

## 1. Inspiration Anchors

- **hook.sacred_crime** — a crime against holy order, read inside out: the bishop's sentence is the order, getting the condemned man out is the crime. Changed the encounter: the friar is not a villain or a mystery, he is a cargo with a price on whoever carries it.
- **Ordeal archetype "the hunt passes by"** (hide-and-search beats) — gave the decline arm its shape: the danger comes to the door, house by house, and the test is sitting still.
- Anti-patterns avoided: the mortal as bystander (the friar asks them by name, on their doorstep); a villain bishop on stage (the opposition is the shut town and its watch doing their job); punishing failure with prison (the name before the purse).
- Obsidian vault not read in this run (parallel batch, filesystem reads limited to the repo); noted, proceeding as the skill allows.

## 2. Scale Justification

Medium: two beats on every path (find the way, then take it or sit it out), one agent-decided fork, five-band aftermath on both arms with reactions. The outcome touches a settlement (its watch, its smugglers, its regard for the master) but no wider.

## 3. Pressure Knot

The bishop condemned a preaching friar; the friar slipped his guards; the watch shut every gate and is searching house by house before the morning bells. The friar is already in the stable behind {actor}'s lodging when the encounter opens.

## 4. Intervention Fantasy

The god watches a master of quiet work decide whether to run or to hide a hunted man — and leans: an urge to go now, a calm that makes waiting look wise, iron that bends, eyes that slide past, a search that drags, boards that sound solid.

## 5. Cast and World Objects

| Object | Kind | Use |
|---|---|---|
| Brother {cast:friar} | cast actor (monk), lazy, must-persist | asks for help (step 0); bond target on the hide arm and in reactions |
| Sergeant {cast:sergeant} | cast actor (guard), lazy, must-persist | the watch at the water-gate (gate arm) and leading the search (hide arm) |
| the water-gate under the mill | scene object | the way out step 0 finds |
| the stable behind the lodging | scene object | the friar's hiding place |
| Prayer Scroll (`reward_tomes_scrolls_prayer_scroll`) | item | possession, success sides |
| The Thieves Guild (`thieves_guild`) | faction | membership, gate-arm success |
| {location} | place | reputation_with on failures and reactions |

## 6. Beat Structure

1. **Find the way out** (shadow 0.74, continue_weakened). The opening and spine. The mortal finds the water-gate under the mill and learns where the watch searches.
2. **Fork on courage_prudence** (agent-decided):
   - positive — **Take him through the gate** (shadow 0.80, fail_action).
   - negative — **Hide him through the search** (shadow 0.76, fail_action).

## 7. Branching Profile

- Branch depth: light · Branch count: 2
- Where branching lives: step-2 scene prose, cast emphasis (the sergeant at the gate vs at the door), outcome ladder, aftermath (membership only on the gate arm).
- Convergence: none — each arm ends the encounter with its own aftermath variant.
- Shape: Opt-in Complication (gate = agent-decided Personality Fork on courage_prudence).

## 8. Branching Map

Step 0 → fork. **Gate arm:** the friar goes through the water-gate under the watch's hourly round; success sends him across the fields, gives the master the Prayer Scroll and a place on the Thieves Guild's rolls. **Hide arm:** the friar lies under the stable floor while Sergeant {cast:sergeant} searches the street; success lets him walk out with the carters when the gates open, and gives the Prayer Scroll and the friar's trust. Failure on either arm: the friar is taken and {location} trusts the master less.

## 9. Outcome Ladder

| Band | Gate arm | Hide arm |
|---|---|---|
| critical_success | through between two rounds, across the fields by the bells; scroll, guild | the sergeant stood on the boards and found nothing; scroll, friar's trust |
| success | through the gate before the bells; scroll, guild | the search passed twice; scroll, friar's trust |
| success_at_cost | out, but the open grating was found and the guard doubled; scroll, guild | not found, but most of a week under the floor and the friar fell sick; scroll, friar's trust |
| failure | the watch came round early and took the friar in the race; name lost | the watch sounded the floor and found him; name lost |
| critical_failure | the friar taken and the bishop's court has the master's name | same |

## 9b. Stakes Line

```
goal:      get the condemned friar out of the shut town
risk:      see the friar taken and lose the town's trust
won:       got the condemned friar out of the shut town
lost:      saw the friar taken in the water at the mill
lostBadly: was named before the bishop's court
arms.negative:
  won:       hid the friar until the gates opened
  lost:      saw the friar found under the stable floor
  lostBadly: was named before the bishop's court
```

Description: "A friar the bishop condemned for preaching is hiding in a stable while the watch searches the shut town house by house. Someone has to find a way out and get him through it before the morning bells, or keep him hidden until the gates open."

## 10. Sample Opening (urban, narrator mode)

> {actor} is lodging in {location} on the night its gates are shut.
>
> The bishop has condemned a friar for preaching against the tithe. The friar escaped his guards. The bishop's watch has shut the gates and is searching the town house by house. The friar is hiding in the stable behind {actor}'s lodging.
>
> Brother {cast:friar} asks {actor} to get him out before the morning bells. Anyone caught hiding him will be named before the bishop's court. First {actor} must find a way out.

(76 words.)

Step 0 afterimages:
- critical_success: "{actor} found the water-gate under the mill, and learned where the watch will search and when."
- success: "{actor} found the water-gate under the mill, where the race runs out under the wall."
- success_at_cost: "{actor} found the water-gate, but asked about it in one tavern too many."
- failure: "{actor} found no sure way out before midnight."
- critical_failure: "{actor} asked about the water-gate in the wrong tavern. The watch searched the stable that night and took the friar."

## 11. The Hand Per Step

### Step 0 — Find the way out (shadow 0.74) · deal `{ count: 4, tags: [shadow, insight] }`

1. **Show The Way Out** — Omen-type special, mind, essence 1, Δ0.06, poleLean courage_prudence → positive. imageTag `generic.focus`.
   effectLine: "Keep the nearest exit in their thoughts. They lean toward leaving at once."
   - critical_success: "{actor} went straight to the mill and found the water-gate in the first hour."
   - success: "{actor} could not stop thinking about a way out, and went to look at the water-gate first."
   - near_miss: "{actor} went to the water-gate before they knew the watch's rounds, and nearly met them there."
   - failure: "{actor} kept thinking of the gates, and spent the night watching the ones the watch held."
2. **Slow The Pulse** — Balm-type special, life, essence 1, Δ0.06, poleLean courage_prudence → negative. imageTag `generic.vigor`.
   effectLine: "Calm their heartbeat until waiting looks like the wise course. They lean toward staying hidden."
   - success: "{actor} took the night slowly, and watched which houses the watch searched and in what order."
   - success_at_cost: "{actor} waited so long to move that half the night was gone before they found the water-gate."
   - failure: "{actor} waited for the watch to pass the street, and the watch never did."
   - critical_failure: "{actor} sat still so long that the watch reached the street before they had found anything."

### Step 1, positive — Take him through the gate (shadow 0.80) · deal `{ count: 4, tags: [shadow, peril] }`

Narrative: "{actor} takes the friar through the back streets to the water-gate under the mill. The grating is chained, and the race runs fast beyond it to the fields. Sergeant {cast:sergeant} walks two watchmen past the water-gate every hour. The friar must be through the grating and across the fields before the morning bells."

Afterimages:
- critical_success: "{actor} had the friar through the grating between two rounds. By the bells he was across the fields."
- success: "The friar went through the water-gate and away across the fields before the bells."
- success_at_cost: "The friar got out, but the watch found the grating open on its next round and doubled the guard."
- failure: "The watch came round early and took the friar in the water. {actor} got away by the mill."
- critical_failure: "Sergeant {cast:sergeant} took the friar at the grating and saw {actor}'s face before they ran."

1. **Bend The Bars** — Heavy Hand (libraryCardId `card.heavy_hand.signature.force`), force, essence 0, Δ0.10, `costs.detectionDelta` 0.15. imageTag `generic.strength`.
   effectLine: "Twist iron aside with divine strength, so a barred way stands open. Rival gods notice a hand this heavy."
   - critical_success: "The grating bent like a reed, and the friar was through before the chain could rattle."
   - success: "The grating gave way under {actor}'s hands, and the friar slipped through."
   - success_at_cost: "The grating bent with a crack of iron, and the watch came running."
   - failure: "The grating bent open, and the noise brought the watch before the friar was through."
   - critical_failure: "The grating tore out of the wall, and every watchman on that side of town heard it."
2. **Cloud The Watch** — Veil-type special, darkness, essence 2, Δ0.10. imageTag `generic.dark`.
   effectLine: "Dim the sight of anyone standing guard, so what they hunt passes them unseen until the next bell."
   - success: "Sergeant {cast:sergeant} looked straight at the water-gate, and saw only the race."
   - near_miss: "The watchmen looked past the friar, but one heard the splash and turned back."
   - failure: "The watchmen saw nothing, but the friar slipped in the race and cried out."

Carryover (keyed on step 0): critical_success "They know when the watch passes the water-gate." (for, +0.05) · success "They know where the water-gate is." (for, +0.03) · success_at_cost "A tavern knows someone asked about the water-gate." (against, −0.02) · near_miss "They know the water-gate, but not the watch's rounds." (for, +0.02) · failure "They have no sure way out of the town." (against, −0.03).

### Step 1, negative — Hide him through the search (shadow 0.76) · deal `{ count: 4, tags: [shadow, social] }`

Narrative: "{actor} will not risk the gate. They hide the friar under the stable floor, to wait out the search until the gates open again. Sergeant {cast:sergeant} and his men are searching every house in the street. They open every door, turn every pile of hay and sound every floor. The friar must not be found."

Afterimages:
- critical_success: "Sergeant {cast:sergeant} stood on the boards over the friar and found nothing. When the gates opened, the friar walked out with the carters."
- success: "The search passed the stable twice and found nothing. When the gates opened, the friar left with the carters."
- success_at_cost: "The search found nothing, but the friar lay under the floor for most of a week and fell sick."
- failure: "On the second day the watch sounded the stable floor and found the friar."
- critical_failure: "The watch dragged the friar out of the stable in front of the whole street."

1. **Slow The Search** — Long Game-type special, time, essence 2, Δ0.10. imageTag `generic.memory`.
   effectLine: "Drag out every hour of a hunt, so the hunters tire and give up early."
   - success: "The search dragged on house by house, and the watchmen were yawning when they reached the stable."
   - success_at_cost: "The search dragged on for days, and the friar grew sick under the floor."
   - failure: "The search dragged, but Sergeant {cast:sergeant} kept his men at it until every floor was sounded."
2. **Thicken The Floor** — Cache-type special, matter, essence 2, Δ0.08. imageTag `generic.matter`.
   effectLine: "Make hollow wood and stone sound solid when struck, so what lies beneath stays hidden."
   - critical_success: "Sergeant {cast:sergeant} stamped on the boards over the friar and moved on."
   - success: "The watch sounded the stable floor and heard only solid boards."
   - failure: "The boards sounded solid, but the friar coughed under them."
   - critical_failure: "The boards rang solid everywhere but one place, and the watch tore it up."

Carryover (keyed on step 0): critical_success "They know where the watch will search, and when." (for, +0.05) · success "They know the watch's road through the street." (for, +0.03) · success_at_cost "A tavern knows someone is asking about the watch." (against, −0.02) · near_miss "They know some of the watch's rounds." (for, +0.02) · failure "They do not know when the search will come." (against, −0.03).

## 12. Branch-Dependent Later Paragraphs

- **Gate arm (Vanguard):** the narrative above — the grating, the race, the hourly round, the bells.
- **Hide arm (Watcher):** the narrative above — the stable floor, the house-by-house search, the gates reopening.

## 13. Aftermath Paragraphs (overviews)

Gate arm:
- critical_success: "Brother {cast:friar} is free on the far side of the fields. The town's smugglers saw who got him out."
- success: "Brother {cast:friar} is out of the town and on the road. The town's smugglers saw who got him out."
- success_at_cost: "Brother {cast:friar} is out of the town, and the water-gate is chained and guarded now."
- failure: "Brother {cast:friar} is in the bishop's cells. {location} trusted {actor} to get him out."
- critical_failure: "The bishop's watch took Brother {cast:friar}, and the bishop's court has heard {actor}'s name."

Hide arm:
- critical_success: "Brother {cast:friar} walked out of the town under the watch's nose."
- success: "Brother {cast:friar} is out of the town and on the road."
- success_at_cost: "Brother {cast:friar} is out of the town, weak from the days under the floor."
- failure: "Brother {cast:friar} is in the bishop's cells. {location} trusted {actor} to keep him hidden."
- critical_failure: "The bishop's watch took Brother {cast:friar}, and the bishop's court has heard {actor}'s name."

## 14. Aftermath Reaction Choices

Success sides (both arms): **Ask Him To Keep Preaching** (bond_change friar +0.10, trust +0.08 — the cause goes on, and he knows who kept it alive) · **Ask Him To Preach Elsewhere** (bond_change friar −0.06; reputation_with $here +0.03 — the town wants no more trouble with the bishop).
Failure sides (both arms): **Speak For Him At Court** (bond_change friar +0.08; reputation_with $here −0.03 — loyalty to a condemned man, at a price in the town) · **Let Him Stand Alone** (bond_change friar −0.10 — the master keeps clear of the bishop's court).

## 15. Aftermath Kit Summary

| Band | Gate arm chips | Hide arm chips |
|---|---|---|
| crit / success / sac | BOON · Prayer Scroll; BOND · a membership (Thieves Guild) | BOON · Prayer Scroll; BOND · reputation with {friar} |
| failure | SCAR · reputation with {location} | SCAR · reputation with {location} |
| critical_failure | SCAR · reputation with {location} (backed on both routes) | same |

## 16. Support Bundle Contract

| Object | Delivery | Source | Persistence | Future refs | Status |
|---|---|---|---|---|---|
| friar | lazy-materialize-on-trigger | spawn monk "Wendel Ashby" | must-persist | bond_change, reactions | OK |
| sergeant | lazy-materialize-on-trigger | reuse guard, else spawn guard "Rolf Hagen" | must-persist | prose only | OK |
| Prayer Scroll | attachment_grant | reward catalog | persistent item | the item's page | OK |
| Thieves Guild | membership_change join | faction seeding (town/city/capital) | persistent edge | faction page | OK |

## 17. Self-Audit

- Opening skeleton, ≤80 words, narrator mode — PASS (76).
- Hands: 2 specials + deal 4 per step (composed 6) — PASS; ≥4 spheres across specials alone (mind, life / force, darkness / time, matter) plus fill — PASS.
- Every special has a failure-band fragment — PASS; no big-delta card (all < 0.15).
- Six StepOutcome bands covered per step — PASS (step 0: crit S1, success both, sac S2, near S1, failure both, crit-fail S2; gate: all via Bend The Bars + near_miss via Cloud; hide: crit Thicken, success both, sac Slow, near_miss — FLAG: no near_miss fragment on the hide arm → add one).
- Consequence hand wired — PASS.
- One Heavy Hand, one channel — PASS.
- Law 56: every chip backed on its band — PASS (crit-fail chip backed by step 0 −0.03 and arm −0.07/−0.05).

## 18. Concept Art Direction

Emotions: the held breath of a hunted man; a stranger's kindness that costs. Image: an iron grating in a mill-race at dawn, one bar bent outward, a frayed knotted cord caught on it in the current. No people.

## Experience Differentiator Gate

1 YES · 2 YES · 3 YES · 4 YES · 5 YES · 6 YES · 7 YES · 8 YES · 9 YES · 9b YES · 10 YES · 11 YES · 11b YES (checked per band) · 12 YES · 13 YES · 14 YES.
