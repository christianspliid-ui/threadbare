# Encounter Pipeline: The Fugitive Friar
> Scale: medium | Slug: fugitive-friar | Pass: final
> Date: 2026-10-15 | Pipeline version: 2.0
> Status: **READY WITH CAVEATS**

---

## Pipeline Summary

| Pass | Verdict | Notes |
|------|---------|-------|
| Draft | Complete | Opt-in complication: find the way out, then run (gate) or hide (search), agent-decided on courage_prudence. |
| Editorial | PASS WITH REVISIONS | Bishop's-court promise removed (rule 34); failure, sac and crit-fail overviews made true on every route; seam echoes and outcome indefinites fixed; smugglers grounded; chip captions authored. |
| Systems | READY WITH CAVEATS | Purpose lines shortened to 4 words; Prolong The Hunt shipped as Stretch The Hunt (lexicon); accepted limits recorded. |

### Caveats / Blockers

- Package purpose lines: "Take him through" (gate arm), "Outlast the search" (hide arm).
- Prolong The Hunt ships as **Stretch The Hunt** (`friar.stretch_the_hunt`): `prolong` is not in the imperative lexicon.
- Accepted limits: see `fugitive-friar-systems.md` § 4 (gate sac has no master-own cost on the clean step-0 route; already-member join is a no-op).

### Editorial Notes Summary

See `fugitive-friar-editorial.md` § 10 — all must-fix and should-fix items applied in the revised packet below.

### Implementation File Map

Compiled set only (orchestrator runs `compile:encounter`). No engine work.

---

## Encounter Packet

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
Crux            A friar the bishop condemned is hiding behind {actor}'s lodgings in a shut
                town, and asks {actor} to get him out before the morning bells.
Title           The Fugitive Friar — the complication in two words.
Whose problem?  The agent's, by proximity: the friar is hiding behind their lodgings and
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
                arm's success side only: the smugglers who use the same water-gate (named
                in the gate spine) saw who got a friar past the watch, and put the master
                on their rolls. (The Thieves Guild seeds in towns, cities and capitals;
                the encounter is urban-only.)
Extras          Hide arm success: bond_change $cast:friar +0.10 / trust +0.08 (he lay under
                their floor for days). Failure sides: reputation_with $here (−0.03 on
                step 0, −0.07 gate arm, −0.05 hide arm) — the name before the purse.
                Reactions: bond_change $cast:friar and reputation_with $here.
Cool failure    Nobody is killed, jailed or branded. The friar is taken, and the town
                learns who hid a man the bishop condemned and trusts them less. At
                critical failure the watch tells the whole town. No court, summons or
                later proceeding is promised (rule 34): the only write is
                reputation_with $here.
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

The bishop condemned a preaching friar; the friar slipped his guards; the watch shut every gate and is searching house by house before the morning bells. The friar is already in the stable behind {actor}'s lodgings when the encounter opens.

## 4. Intervention Fantasy

The god watches a master of quiet work decide whether to run or to hide a hunted man — and leans: an urge to act at once, a calm that makes waiting look wise, iron that bends, eyes that slide past, a search that drags, boards that sound solid.

## 5. Cast and World Objects

| Object | Kind | Use |
|---|---|---|
| Brother {cast:friar} | cast actor (monk), lazy, must-persist | asks for help (opening); bond target on the hide arm and in reactions |
| Sergeant {cast:sergeant} | cast actor (guard), lazy, must-persist | the watch at the water-gate (gate arm) and leading the search (hide arm). Prose carries no pronoun for the sergeant (a reused guard may be of either sex) |
| the water-gate under the mill | scene object | the way out step 0 finds |
| the town's smugglers | scene-local (gate spine) | use the water-gate; ground the Thieves Guild membership |
| the stable behind the lodgings | scene object | the friar's hiding place |
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
- Convergence: none — each arm ends the encounter with its own aftermath variant. The critical_failure overview is shared by both arms, because a step-0 critical failure ends the action before any arm.
- Shape: Opt-in Complication (gate = agent-decided Personality Fork on courage_prudence).

## 8. Branching Map

Step 0 → fork. **Gate arm:** the friar goes through the water-gate under the watch's hourly round; success sends him out of the town, gives the master the Prayer Scroll and a place on the Thieves Guild's rolls. **Hide arm:** the friar lies under the stable floor while Sergeant {cast:sergeant} searches the street; success lets him walk out with the carters when the gates open, and gives the Prayer Scroll and the friar's trust. Failure on either arm: the friar is taken, the town learns who hid him, and {location} trusts the master less. Critical failure (step 0 or either arm): the watch tells the whole town.

## 9. Outcome Ladder

| Band | Gate arm | Hide arm |
|---|---|---|
| critical_success | through between two rounds, beyond the wall before dawn; scroll, guild | the sergeant searched the stable in person and missed him; scroll, friar's trust |
| success | through the gate before the bells; scroll, guild | the search passed twice; scroll, friar's trust |
| success_at_cost | out, after a night that went worse than planned (any step failed, near-missed or cost); scroll, guild | out, after a search that came too close (any step failed, near-missed or cost); scroll, friar's trust |
| failure | the watch reached the gate first and took the friar; the watch knows whose stable he hid in; town's trust lost | found under the floor on the second day; the street knows who hid him; town's trust lost |
| critical_failure | the friar taken and the watch tells the whole town who hid him (true from step 0 or the arm) | same |

## 9b. Stakes Line

```
goal:      get the condemned friar out of the shut town
risk:      see the friar taken and lose the town's trust
won:       got the condemned friar out of the shut town
lost:      saw the friar taken at the water-gate
lostBadly: was named to the whole town for hiding him
arms.negative:
  won:       hid the friar until the gates opened
  lost:      saw the friar found under the stable floor
  lostBadly: was named to the whole town for hiding him
```

Description: "A friar the bishop condemned for preaching is hiding in a stable while the watch searches the shut town house by house. Someone has to find a way out and get him through it before the morning bells, or keep him hidden until the gates open."

## 10. Sample Opening (urban, narrator mode)

> {actor} has taken lodgings in {location} for the night.
>
> The bishop has condemned a friar for preaching against the tithe. The friar escaped his guards. The watch has shut the gates and is searching the town house by house. The friar is hiding in the stable behind {actor}'s lodgings.
>
> Brother {cast:friar} asks {actor} to get him out before the morning bells. Anyone caught hiding him will lose the town's trust. First {actor} must find a way out.

(77 words.)

Step 0 afterimages:
- critical_success: "{actor} found the water-gate under the mill, and learned the hour of every round and the order of the search."
- success: "{actor} found the water-gate under the mill, and learned which streets the watch will search first."
- success_at_cost: "{actor} found the water-gate, but asked about it in one tavern too many."
- failure: "{actor} asked in every tavern by the wall, and by midnight had found no gate and learned no rounds. People noticed the questions."
- critical_failure: "{actor} asked about the water-gate in the wrong tavern. The watch searched the stable that night and took the friar."

## 11. The Hand Per Step

### Step 0 — Find the way out (shadow 0.74) · deal `{ count: 4, tags: [shadow, insight] }`

1. **Show The Way Out** — Omen-type special, mind, essence 1, Δ0.06, poleLean courage_prudence → positive. imageTag `generic.focus`.
   effectLine: "Fix their mind on exits, so they spot one sooner. They lean toward acting at once."
   - critical_success: "{actor} went straight to the mill and found the water-gate in the first hour."
   - success: "{actor} could think only of getting out, and went to look at the water-gate first."
   - near_miss: "{actor} went to the water-gate before they knew the rounds, and nearly walked into the watch there."
   - failure: "{actor} wasted the night looking at the town gates, which the watch held."
2. **Slow The Pulse** — Balm-type special, life, essence 1, Δ0.06, poleLean courage_prudence → negative. imageTag `generic.vigor`.
   effectLine: "Calm their heartbeat, so they watch before they move. They lean toward waiting."
   - success: "{actor} waited out the first hours and moved only when the street was clear."
   - success_at_cost: "{actor} waited so long to move that half the night was gone before they went looking."
   - failure: "{actor} waited too long for the street to clear, and started asking only after dark."
   - critical_failure: "{actor} waited too long to move the friar, and the watch reached the stable first."

### Step 1, positive — Take him through the gate (shadow 0.80) · deal `{ count: 4, tags: [shadow, peril] }`

Narrative: "{actor} decides to run. They bring the friar by back streets to the mill. The water-gate is closed by a chained iron grating. The stream runs under the wall to the fields. The town's smugglers use this gate on dark nights. Sergeant {cast:sergeant} leads two watchmen past it every hour. The friar must be across the fields by the morning bells."

Afterimages:
- critical_success: "{actor} had the friar through the grating between two rounds. He was far beyond the wall before dawn."
- success: "{actor} got the grating open, and the friar went through and away before the bells."
- success_at_cost: "The friar got out, but the watch found the grating open on its next round."
- failure: "The watch reached the water-gate before the friar was through, and took him at the grating. {actor} got away in the dark."
- critical_failure: "Sergeant {cast:sergeant} took the friar at the grating and saw {actor}'s face clearly."

1. **Bend The Bars** — Heavy Hand (libraryCardId `card.heavy_hand.signature.force`), force, essence 0, Δ0.10, `costs.detectionDelta` 0.15. imageTag `generic.strength`.
   effectLine: "Twist iron aside with divine strength, so what was locked stands open. Rival gods notice a hand this heavy."
   - critical_success: "The iron bent aside without a sound."
   - success: "The iron bent easily under {actor}'s hands."
   - success_at_cost: "The grating bent with a crack of iron that carried across the town."
   - failure: "The grating bent open, but the noise of it carried to the watch."
   - critical_failure: "The grating tore out of the wall, and every watchman on that side of town heard it."
2. **Cloud The Watch** — Veil-type special, darkness, essence 2, Δ0.10. imageTag `generic.dark`.
   effectLine: "Dim the sight of anyone standing guard, so those they hunt slip past unseen for an hour."
   - success: "Sergeant {cast:sergeant} looked straight at the water-gate and saw only the stream."
   - near_miss: "The watchmen looked past the friar, but one heard the splash and turned back."
   - failure: "The watchmen never saw the friar, but he slipped in the stream and cried out."

Carryover (keyed on step 0): critical_success "They know when the watch passes the water-gate." (for, +0.05) · success "They know where the water-gate is." (for, +0.03) · success_at_cost "A tavern noticed their questions about the water-gate." (against, −0.02) · near_miss "They know the water-gate, but not the watch's rounds." (for, +0.02) · failure "They have no sure way out of the town." (against, −0.03).

### Step 1, negative — Hide him through the search (shadow 0.76) · deal `{ count: 4, tags: [shadow, social] }`

Narrative: "{actor} decides not to run. They hide the friar under the stable floor until the gates open again. Sergeant {cast:sergeant} and the watch are searching every house in the street. The watchmen open every door and knock on every floor to hear if it is hollow. The friar must not be found."

Afterimages:
- critical_success: "Sergeant {cast:sergeant} searched the stable in person and did not find the friar. When the gates opened, the friar walked out with the carters."
- success: "The search passed the stable twice and missed the friar. When the gates opened, he left with the carters."
- success_at_cost: "The search missed the friar, but he lay under the floor for most of a week and fell sick."
- failure: "On the second day the watch searched the stable again and found the friar under the floor."
- critical_failure: "The watch dragged the friar out of the stable in front of the whole street."

1. **Prolong The Hunt** — Long Game-type special, time, essence 2, Δ0.10. imageTag `generic.memory`.
   effectLine: "Make every hour of a search run long, so the searchers tire and grow careless."
   - success: "The search dragged on house by house, and the watchmen were tired and careless by the time they reached the stable."
   - success_at_cost: "The search dragged on so long that the watch came back to the street a second time."
   - near_miss: "The search slowed, but one watchman came back to the stable alone that night to look again."
   - failure: "The search dragged, but Sergeant {cast:sergeant} kept the watch at it until every floor in the street was tested."
2. **Thicken The Floor** — Cache-type special, matter, essence 2, Δ0.08. imageTag `generic.matter`.
   effectLine: "Make hollow wood and stone sound solid when struck, so what lies beneath stays hidden."
   - critical_success: "The sergeant stamped on the boards over the friar, heard solid wood, and moved on."
   - success: "The watch knocked on the stable floor and heard only solid boards."
   - failure: "The boards sounded solid, but the friar coughed under them."
   - critical_failure: "The boards rang solid everywhere but one place, and the watch tore it up."

Carryover (keyed on step 0): critical_success "They know where the watch will search, and when." (for, +0.05) · success "They know which streets the watch will search first." (for, +0.03) · success_at_cost "A tavern noticed the questions they asked." (against, −0.02) · near_miss "They know some of the watch's rounds." (for, +0.02) · failure "They do not know when the search will come." (against, −0.03).

## 12. Branch-Dependent Later Paragraphs

- **Gate arm (Vanguard):** the narrative above — the decision to run, the grating, the stream, the smugglers' gate, the hourly round, the bells.
- **Hide arm (Watcher):** the narrative above — the decision not to run, the stable floor, the house-by-house search, the gates reopening.

## 13. Aftermath Paragraphs (overviews)

Path note: `success_at_cost` is reached whenever any step failed, near-missed or cost (including "step 0 failed, then the arm succeeded cleanly"), so the sac overviews state only what is true on every path. `critical_failure` is reached from step 0 or either arm, so both arms share one overview.

Gate arm:
- critical_success: "Brother {cast:friar} is free, and the watch does not know how he left. The smugglers who use the water-gate saw who got him out."
- success: "Brother {cast:friar} is out of the town and on the road. The smugglers who use the water-gate saw who got him out."
- success_at_cost: "Brother {cast:friar} is out of the town, after a night that went worse than {actor} planned. The smugglers who use the water-gate saw who got him out."
- failure: "Brother {cast:friar} is in the bishop's cells, and the watch knows whose stable he hid in."
- critical_failure: "Brother {cast:friar} is in the bishop's cells, and the watch has told the whole town that {actor} hid him."

Hide arm:
- critical_success: "Brother {cast:friar} is free, and the sergeant who searched the stable never knew he was there."
- success: "Brother {cast:friar} is on the road, and the street never learned he was there."
- success_at_cost: "Brother {cast:friar} is out of the town, after a search that came closer than {actor} wanted."
- failure: "Brother {cast:friar} is in the bishop's cells, and the street knows who hid him."
- critical_failure: "Brother {cast:friar} is in the bishop's cells, and the watch has told the whole town that {actor} hid him."

## 14. Aftermath Reaction Choices

Success sides (both arms):
- **Ask Him To Keep Preaching** — intent: "{actor} backs his cause, and he knows it." (bond_change $cast:friar +0.10, trust +0.08)
- **Ask Him To Preach Elsewhere** — intent: "{actor} wants no more trouble between the town and the bishop." (bond_change $cast:friar −0.06; reputation_with $here +0.03)

Failure sides (both arms):
- **Speak Up For Him** — intent: "{actor} says openly that he was wronged, and the town hears it." (bond_change $cast:friar +0.08; reputation_with $here −0.03)
- **Keep Clear Of Him** — intent: "{actor} lets the friar face the bishop alone." (bond_change $cast:friar −0.10)

## 15. Aftermath Kit Summary (chips, with captions)

Order on the page: scar · bond · boon · path. `causeClause` + `detail` ≤15 words; no caption repeats its overview or its own tag.

| Band | Gate arm chips | Hide arm chips |
|---|---|---|
| crit / success / sac | BOND · a membership (`entityId $faction:thieves_guild`, visualKind faction, tooltip `ui.faction_member`) — detail "The Thieves Guild has put {actor} on its rolls." · BOON · Prayer Scroll (item) — detail "Brother {cast:friar}'s parting gift to {actor}." | BOND · reputation (tooltip `ui.reputation_with`; concept {cast:friar} → `$cast:friar`) — causeClause "Kept him hidden" · detail "Brother {cast:friar} trusts {actor} now." · BOON · Prayer Scroll (item) — detail "Brother {cast:friar}'s parting gift to {actor}." |
| failure | SCAR · reputation with {location} (`entityId $here`) — detail "{location} trusts {actor} less." (backed by the gate arm's −0.07) | SCAR · reputation with {location} — detail "{location} trusts {actor} less." (backed by the hide arm's −0.05) |
| critical_failure | SCAR · reputation with {location} — detail "{location} trusts {actor} less." Backed on every route: step 0's −0.03 when the action ends at step 0, the arm's −0.07 when it ends at the gate | same; the arm's −0.05 when it ends at the hide |

## 16. Support Bundle Contract

| Object | Delivery | Source | Persistence | Future refs | Status |
|---|---|---|---|---|---|
| friar | lazy-materialize-on-trigger | spawn monk "Wendel Ashby" | must-persist | bond_change, reactions | OK |
| sergeant | lazy-materialize-on-trigger | reuse guard, else spawn guard "Rolf Hagen" | must-persist | prose only (no pronouns) | OK |
| Prayer Scroll | attachment_grant | reward catalog | persistent item | the item's page | OK |
| Thieves Guild | membership_change join | faction seeding (town/city/capital) | persistent edge | faction page | OK |

## 17. Self-Audit

- Opening skeleton, ≤80 words, narrator mode — PASS (77).
- Hands: 2 specials + deal 4 per step (composed 6) — PASS; ≥4 spheres across specials alone (mind, life / force, darkness / time, matter) plus fill — PASS.
- Every special has a failure-band fragment — PASS; no big-delta card (all < 0.15).
- Six StepOutcome bands covered per step by specials alone — PASS (step 0: crit S1, success both, sac S2, near S1, failure both, crit-fail S2; gate: all via Bend The Bars + near_miss via Cloud; hide: crit Thicken, success both, sac Prolong, near_miss Prolong (added in editorial), failure both, crit-fail Thicken).
- Base afterimages read correctly with no hand active, and every fragment reads alongside its base without repeating or contradicting it — PASS (editorial).
- No natural indefinite (`someone`, `nothing`, `anything`, `way`, …) in outcome fields — PASS (editorial).
- No effect line repeats a word from its card's name — PASS (editorial: "barred" removed).
- No later place, time or proceeding promised without an enacting effect — PASS (editorial: bishop's court removed).
- Consequence hand wired — PASS.
- One Heavy Hand, one channel — PASS.
- Law 56: every chip backed on its band — PASS (crit-fail chip backed by step 0 −0.03 and arm −0.07/−0.05).

## 18. Concept Art Direction

Emotions: the held breath of a hunted man; a stranger's kindness that costs. Image: an iron grating in a mill stream at dawn, one bar bent outward, a frayed knotted cord caught on it in the current. No people.

## Experience Differentiator Gate

1 YES · 2 YES · 3 YES · 4 YES · 5 YES · 6 YES · 7 YES · 8 YES · 9 YES · 9b YES · 10 YES · 11 YES · 11b YES (assembled per band in the editorial § 6b) · 12 YES · 13 YES · 14 YES.
