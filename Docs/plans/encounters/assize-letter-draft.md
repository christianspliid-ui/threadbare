# Encounter Pipeline: The Assize Letter
> Scale: short | Slug: assize-letter | Pass: draft
> Date: 2026-09-29 | Pipeline version: 2.0
> Template: `encounter.town.assize_letter` · batch `journeyman-everyday-1` slot 3 (THR-1676)
> Package: `Docs/plans/encounters/assize-letter.package.json` (dry-run clean)

## 1. Inspiration Anchors

- **Plot hook taken: `hook.heresy_hunt`.** An authority has named a miller a heretic. The parish priest swears otherwise, and that sworn word is only worth something if it reaches the court before the case is heard. Rolled alongside `hook.death_and_return` and `hook.shifting_shape`. Both were rejected because each needs something uncanny at the centre, and the brief wants everyday town stakes with no rule gate.
- **Seed dice (binding rows):** plea · law (duty) · neutral · judge asked to rule · company. The court is the opposition. It sits at its hour and rules on what is in front of it. The clerk is neutral and wants the letter there, whoever carries it. The agent is asked to *judge* the road. The miller, his mill and six workers are the company that the outcome touches.
- **Anti-patterns avoided:** the helpful passerby (the agent is asked to rule on the route, and the carrying is theirs); in-situ road description (the roads are named only in the outcome prose, as facts); a placeless promise (the prose never says where the agent goes after the court).

## 2. Scale Justification

The encounter is short, local and a single test. It is a journeyman everyday errand. The stakes are someone else's livelihood and the carrier's standing with a court clerk, so one sharp Star test fits. A second step would only divide the journey into beats that the outcome prose already reports.

## 3. Pressure Knot

The assize sits in two days. A miller stands before it on a heresy charge. The priest has sworn for him in a sealed letter. The clerk holding that letter cannot leave the rolls, and the court will rule without it.

## 4. Intervention Fantasy

The god works on the road: the sky over it at night, and how long the light lasts. Nobody on the road asked for help, and the letter still gets there.

## 5. Cast and World Objects

| Object | Binding |
|---|---|
| The assize clerk | `$cast:clerk`: reuse `clerk`, spawn `Wenna Loy`, must-persist. Never gendered in prose. |
| The miller, the priest, the accuser | Scene-local, unnamed. |
| The sealed letter | Scene-local. |
| Knowledge record | `intelligence` · `political_secret` · "Who laid the heresy charge" |
| Travel intent | `agent_relocation` · away ≥3 hexes · travel |
| Clerk bond | `bond_change` with `$cast:clerk`, ± |

## 6. Beat Structure

One beat, Star 0.45 (`fair`): "Judge the road". The agent reads the country (the ridge road, the valley road with its ford, the weather, the night sky), picks a road and carries the letter.

## 7. Branching Profile

Linear. There is no branching (branch count 0).

## 8. Branching Map

N/A: linear encounter.

## 9. Outcome Ladder

| Band | Progress | Spent | Opens |
|---|---|---|---|
| critical_success | Letter on the table a night early; charge does not stand | nothing | knowledge + clerk's trust + journey onward |
| success | Letter read before the case | a night's travel | knowledge + journey onward |
| success_at_cost | Letter read as the case is called | a night without rest | journey onward (knowledge and trust written, chipped elsewhere) |
| failure | Ford too high, agent turns back, letter late by carter; mill forfeit | two days, the miller's mill | clerk's trust drops |
| critical_failure | A day lost on the wrong road; letter never arrives; guilty finding | the mill and six jobs | clerk's trust drops |

## 10. Sample Opening (narrator mode)

> *(rural)* {actor} stops in {location} for the night, and {cast:clerk}, a clerk of the assize, finds them.
>
> The assize sits at the county seat in two days. A miller stands before it, charged with heresy. The clerk holds a sealed letter from the priest, swearing for him. If it comes late, the court rules without it, and the mill and its six jobs are lost.
>
> The clerk cannot leave the rolls and asks {actor} to judge the road and carry it.

The urban opening is: "{actor} is in {location} when {cast:clerk}, a clerk of the assize, comes looking for a carrier." Each class comes to 80 words with the spine.

## 11. The Hand

`deal: { count: 4, tags: ['journey', 'lore'] }` plus two specials. The dealer supplies the plain boost, the rider and the sphere breadth. None of the over-exposed cards is authored.

| Card | Type | Sphere | Cost | Δ | Effect line | Fragments |
|---|---|---|---|---|---|---|
| Clear The Night Sky | Boost (scene-bound: the night road) | light | 2 | 0.10 | Part the cloud over the road after dark, so the stars show them where it runs. A real help. | crit · success · near_miss · failure |
| Lengthen The Day | Boost (scene-bound: the court's hour) | time | 2 | 0.12 | Hold the evening light a while past its hour, so the journey ends before the court sits. A real help. | success_at_cost · failure · critical_failure |

Between them, the two specials cover all six StepOutcomes. No card chooses a road for the mortal. Both work on the conditions of the road.

## 12. Linear continuation

The step's afterimages carry the continuation. On success the agent took the ridge road by starlight. On failure they judged the valley road faster, found the ford too high, and brought the letter back.

## 13. Aftermath Paragraph

(success) "The letter was read into the record before the miller's case was called. The court heard the priest's oath and let the mill stay his."

## 14. Aftermath Reaction Choices

No reaction choices. The consequence is clean: a short, single-test errand.

## 15. Aftermath Kit Summary

| Band | Chips (scar · bond · boon · path) | Backing write |
|---|---|---|
| critical_success | BOND reputation with {target} (clerk) · BOON knowledge · PATH journey | `bond_change` · `intelligence` · `agent_relocation` (step successMetadata) |
| success | BOON knowledge · PATH journey | same |
| success_at_cost | PATH journey | same |
| failure | SCAR reputation with {target} (clerk) | `bond_change` −0.1 (failureMetadata) |
| critical_failure | SCAR reputation with {target} (clerk) | same |

Every chip is 15 words or fewer, and none shares a 4-word run with its overview (checked by script).

## 16. Support Bundle Contract

| Support object | Delivery | Source | Persistence | Future refs | Status |
|---|---|---|---|---|---|
| clerk | lazy-materialize-on-trigger | reuse `clerk` / spawn `Wenna Loy` | must-persist | bond edge | built |
| intelligence record | written on success | aftermath effect | persists on GameState | knowledge chip | built |
| travel intent | written on success | aftermath effect | TTL intent | journey chip | built |

## 17. Self-Audit

- PASS: the Composition Contract blocks. Steps 1; the hand has specials plus a deal; settings rural and urban with both openings; cast `clerk`; rewards (`bond_change`); aftermath with 5 bands and anchored nouns; systems cast + rewards + reputation = 3.
- PASS: the consequence hand. Knowledge is wired as `intelligence` and movement as `agent_relocation` (travel), both on the success side.
- PASS: journeyman difficulty. Star 0.45, which is inside the everyday open-draw ceiling of 0.45.
- PASS: cool failure (money, standing, time), and no `apply_condition` on `$actor`.
- PASS: prose rule 7b. No destination is named, and the path chip says only "travelling away from {location}".
- FLAG: `stateNoun: journey` carries no tooltip id, because no `ui.journey` concept exists. The anchor catalog names a journey as a sheet surface. The critic should confirm the word, or fall back to shipped precedent (`seed` / `ui.aftermath_seed`), which misdescribes a relocation.
- FLAG: the systems quota sits exactly at the floor (3).

### Experience Differentiator Gate

1 Y · 2 Y · 3 Y · 4 Y · 5 Y · 6 Y · 7 Y · 8 Y (the sky over the night road and the court's hour are both in the spine) · 9 Y (light versus time, which answer different questions) · 9b Y · 10 Y · 11 Y (the clerk is named) · 11b Y · 12 N/A (short scale) · 13 N/A · 14 Y: concept art shows a wax-sealed letter on an empty courtroom bench at dawn. That is residue, not the ride.
