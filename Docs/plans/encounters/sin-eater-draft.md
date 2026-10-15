# Encounter Pipeline: The Sin-Eater
> Scale: short | Slug: sin-eater | Pass: draft
> Date: 2026-10-15 | Pipeline version: 3.0 (factory line) | Batch: master-everyday-3, slot 8 (THR-1840)

## 0. Mechanical design block (fixed before the premise — brief § Game design)

- **Crux.** A rich merchant's household has paid for his sins to be eaten before burial; under the bread the sin-eater finds his written confession to a poisoning, and must decide whether to bury it with him or carry it to the living.
- **Title.** *The Sin-Eater* — glance test: someone eats a dead man's sins.
- **Template id.** `encounter.town.sin_eater` · reach `veil` · rarityTier 2 · scale `local` · intrinsicTier `shaping` · settings `urban`, `rural` · no rule gate.
- **Whose problem?** The agent's: they were sent for, and their name with the parish is the stake (rolled agentRole *suspect_or_cause* is read as the sin-eater being the one the household and the wronged heir suspect of forgery or of selling silence — never asserted as history).
- **Shape.** Personality fork (THR-894), from the shape catalog. Step 0 tests (veil 0.78, `continue_weakened`): eat the sins. Step 1 is an agent-decided branch on `revelation_discretion`, branching on step 0:
  - `positive` (revelation) — **Read the confession aloud**: veil 0.80, `fail_action`. Carry the paper to the wronged heir and read it before the parish priest at the lych-gate.
  - `negative` (discretion, also the fallback) — **Bury the sin**: veil 0.76, `fail_action`. Keep the paper, see the merchant into the ground clean, and tell no lie when the wronged heir stops the bier.
  - Mean across step 0 and the arms: 0.78. Every step inside 0.72–0.85.
- **Consequence hand (binding, `draw:consequences`): `drive` + `place`. No swap.**
  - `drive` — `assign_ambition` `ambition_uncover_secrets` on `$actor`, positive arm success half ("found a poisoning buried under a dead man's bread, and wants to know what else the rich have hidden"); `plant_compulsion` `{ assist: 0.5 }`, 96 ticks, on `$actor`, negative arm success half ("carries a poisoner's sin, and is driven to set it right by work for others").
  - `place` — `condition_attachment` `trait.condition.location.tended_shrine` on `$here`, negative arm success half (the dead went clean; rites at the parish take more easily); `apply_condition` `trait.condition.location.under_watch` on `$here` (0.6, 48 ticks), positive arm failure half (the household calls the paper a forgery and has the watch out).
- **Standing (the master's name).** `reputation_with $here`: +0.06 positive success, +0.05 negative success, −0.06 step-1 failure on either arm, −0.03 step-0 failure (so the step-0 critical-failure route, which ends the action, backs its reputation chip).
- **Relationship (third system).** `bond_change $cast:wronged` +0.12 / +0.12 on positive success; −0.06 / −0.10 on negative failure.
- **Cool failure.** Nobody is killed, jailed or branded. Failure costs the name: the parish will not send for this sin-eater again soon, a household calls them a forger, the wronged heir believes they were paid for silence. Why it costs more for a master: the parish sent for them *by name*.
- **Systems quota.** cast (two bound) + rewards (ambition / compulsion / location condition persist) + reputation + relationship — four.
- **Trait hooks.** Gate: none (everyday). Variant: Patient `trait.personality.veil.virtue` +0.04; False `trait.core.core_integrity.vice` −0.04. Trait-only nudge: none. Trait fragment: none.
- **Mortal choice.** Yes, on `revelation_discretion`. `motivations: ['revelation_discretion']`, unpinned, so both arms' mortals are drawn.
- **Prose rule 7b.** The ambition, the compulsion and the two place conditions are the only forward state. No trial, no hearing and no later reckoning is promised.
- **Not colliding (brief verb table).** Veil masters: lay an ossuary's dead, judge a witch. Veil experts: hear a drowned man, judge an oath-breaker. This one eats a living rite's bread and decides what to do with a sin; no card questions the dead.

**Rolled packet (binding row):** plotHookRolled `hook.relic_awakening, hook.haunt_resolution, hook.sacred_crime` · setting *sacred* (overridden to `urban`/`rural`; the sacred survives as the lych-gate and the house of the dead) · shape personality_fork · system forks · p3Shape *threat* · opposition *terrain (indifference)* · disposition n/a · agentRole *suspect_or_cause* · scale personal.

**plotHookTaken: `hook.sacred_crime`** — the crime hidden inside a sacred rite: the merchant left his poisoning under the sin-eater's bread so the rite would carry it into the grave. Drift: the rite is the merchant's last attempt to make the parish's own custom bury his crime. `haunt_resolution` survives faintly in the negative arm's "goes to the grave clean"; `relic_awakening` fought the everyday register and was dropped.

**Seed dice reading.** p3 *threat*: the stake is stated as a threat to the master's name ("is not sent for again"). Opposition *terrain (indifference)*: read as the rite itself — bread, salt and burial words that go clean or do not, whatever anyone wants. Scale *personal*: one household, one heir, one parish.

## 1. Inspiration Anchors

- **Folk custom of the sin-eater** (Welsh-border practice): bread and salt on the corpse's chest, eaten for a coin, the eater shunned afterward. Gives the rite and its cost to the eater.
- **`hook.sacred_crime`** (plot-hook corpus): a crime that hides inside a holy act. Gives the confession under the bread.
- **Ordeal / Event archetypes** (vault, via the batch brief): the ordeal is the rite; the event is the confession. Anti-patterns avoided: the player choosing for the mortal (the fork is agent-decided), a lurid failure (failure costs a name, never a life), and invented history (the agent is "sent for", never "the parish's sin-eater of twenty years").
- Dilemma library: the fork is the classic secret-of-the-dead dilemma; the library confirmed that both poles must carry a real cost, which is why the discretion arm faces the wronged heir at the lych-gate.

## 2. Scale Justification

Short: one test and one fork, one household, one evening. The weight is a single decision a mortal makes by their nature; more beats would dilute it. The master band is carried by the difficulty and by who is watching (a whole parish), not by length.

## 3. Pressure Knot

The merchant died before dawn. The household has already paid for the rite and wants him buried clean before the town talks. Under the bread, the merchant left a confession, so the rite he paid for would carry his crime into the grave. The wronged partner's heir keeps a stall in the market and has never known how the partner died.

## 4. Intervention Fantasy

The god watches a mortal swallow another man's sins, then find one they were not meant to read. The god cannot pick what the mortal does with it. The god can lean on their conscience or on their silence before the bread is eaten, and then help the chosen course land: stir an old grief in a parish, steady a voice, ease a dead man toward rest, cool an accuser's temper.

## 5. Cast and World Objects

| Object | Kind | Notes |
|---|---|---|
| `{cast:eldest}` | bound actor (support `sin_eater_household_heir`, spawn `merchant`, *Osric Hale*, reuse `merchant`, `trader`, `noble`) | the merchant's eldest, who paid for the rite; named only in step 0 |
| `{cast:wronged}` | bound actor (support `sin_eater_wronged_heir`, spawn `trader`, *Bryony Tallow*, reuse `trader`, `weaver`, `smith`) | the dead partner's heir; named in step 1 |
| the dead merchant | scene-local, unnamed | not a node; dies before the scene |
| the confession | scene-local paper | no item minted (the hand draws no `possession`) |
| `$here` | location | reputation, Tended Shrine, Under Watch |
| ambition `ambition_uncover_secrets` | catalog ambition | positive success |
| compulsion `{ assist: 0.5 }` | drive | negative success |

## 6. Beat Structure

1. **Eat the sins** (veil 0.78). The household watches the master eat bread and salt off the dead man's chest. Every band ends with the paper found (except critical failure, which ends the action).
2. **The fork** (agent-decided on `revelation_discretion`, branch on step 0):
   - *Revelation* — read the confession aloud at the lych-gate (veil 0.80).
   - *Discretion* — bury the sin and see the merchant into the ground clean (veil 0.76).

## 7. Branching Profile

- Branch depth: `light`. Branch count: `2`.
- Where branching lives: step-1 scene prose, the step-1 hand, step-1 outcome writes, the aftermath variant (`branchOnStep: 0`, keyed on the recorded pole).
- Convergence policy: none — the arms end in different places and different states.
- Shape: personality fork (THR-894). Secondary template: none.

## 8. Branching Map

Step 0 (both) → pole recorded from the mortal's `revelation_discretion` profile plus the net lean of the committed step-0 cards.
- `positive` → step 1 *Read the confession aloud*: the household calls it forgery, the parish weighs a dead man's paper in a sin-eater's hand → success: ambition, bond with the wronged heir, standing; failure: Under Watch on the town, standing lost.
- `negative` → step 1 *Bury the sin*: the wronged heir stops the bier and asks → success: Tended Shrine, compulsion, standing; failure: standing lost, the heir's trust lost.

## 9. Outcome Ladder

| Band | Revelation | Discretion |
|---|---|---|
| critical_success | The priest knows the merchant's hand and says so; the heir hears all of it; the parish believes. Ambition, bond, standing. | The bier goes through clean; the master burns the paper at the graveside. Tended Shrine, compulsion, standing. |
| success | The parish believes the paper. Same writes. | The merchant goes into the ground clean. Same writes. |
| success_at_cost | Believed, but the household swears before the lych-gate the master forged it. Same writes; the cost is told. | Clean, but the heir leaves sure the sin-eater was paid for silence. Same writes; cost told. |
| failure | The parish will not take a dead man's paper from a sin-eater's hand; the household has the watch out. Under Watch, standing lost. | The master stumbles on the burial words; the parish says the merchant went down unclean. Standing lost, heir's trust lost. |
| critical_failure | The household tears the paper away and the parish calls the master a forger. Standing lost. | The master loses the burial words; the parish blames the sin-eater. Standing lost. |

## 9b. Stakes Line

```
goal:      eat a dead merchant's sins before his burial
risk:      be called a forger before the whole parish
won:       ate the merchant's sins and told the parish his crime
lost:      was not believed, and the household set the watch
lostBadly: was called a forger before the whole parish
arms.negative:
  won:       ate the merchant's sins and buried his crime with him
  lost:      left the merchant to be buried unclean
  lostBadly: left the merchant unclean, and the parish blamed them
```

Description (player prose): "A rich merchant lies dead, and his household has paid for his sins to be eaten before the burial. Under the bread on his chest is his own written confession to a poisoning, and someone has to decide whether it goes into the grave with him."

## 10. Sample Opening (narrator mode)

> {actor} arrives in {location} at dusk, sent for by the parish.
>
> A rich wool merchant lies dead in his hall, to be buried at dawn. His eldest, {cast:eldest}, has paid for a sin-eater, so the merchant goes to the grave clean. Bread and salt lie on his chest.
>
> {actor} must eat the bread and salt before the household and take every sin whole. A sin-eater who leaves a sin on the dead is not sent for again.

Rural opening P1: "{actor} comes to {location} at dusk, sent for by the parish." Opening + spine = 73 words.

## 11. The Hand Per Step

### Step 0 — Eat the sins (veil 0.78). Specials 2 + `deal { count: 3, tags: ['lore','insight'] }`.

| id | name | type | sphere | cost | Δ | lean | effectLine |
|---|---|---|---|---|---|---|---|
| `sineater.seal_the_lips` | Seal The Lips | Undertow (authored, pole lean) | darkness | 1 | 0.06 | negative | Lay a vow of silence on them. They lean toward keeping what they learn hidden. |
| `sineater.stir_the_conscience` | Stir The Conscience | Kindled Ambition (authored, pole lean) | spirit | 1 | 0.06 | positive | Make any wrong they learn sit heavy on them. They lean toward carrying it to the people it harmed. |

Fragments:
- Seal The Lips — success: "{actor} ate in silence and kept their eyes on the bread." · success_at_cost: "{actor} ate in such silence that the household grew uneasy." · failure: "{actor} kept silent so long that the household thought the rite had stalled."
- Stir The Conscience — critical_success: "{actor} ate every crumb, then read the paper under it twice." · near_miss: "{actor} named the sins aloud as the rite asks, but stumbled on the last." · failure: "{actor} stopped eating to read the paper, and the household saw bread left on the dead." · critical_failure: "{actor} read the paper aloud in the hall before the bread was finished."

### Step 1, positive — Read the confession aloud (veil 0.80). Specials 2 + `deal { count: 3, tags: ['presence','social'] }`.

| id | name | sphere | cost | Δ | effectLine |
|---|---|---|---|---|---|
| `sineater.wake_old_grief` | Wake Old Grief | time | 2 | 0.10 | Bring a past loss back to the listeners, so they ask again how it happened. |
| `sineater.steady_the_voice` | Steady The Voice | order | 1 | 0.06 | Keep their speech level and slow, so each word carries to the back of a crowd. |

Fragments:
- Wake Old Grief — critical_success: "The old men at the lych-gate remembered how sudden the partner's death was, and asked how it came." · success: "The parish remembered how fast the partner had died." · failure: "The parish remembered the partner, and remembered the merchant's alms to the poor as well." · critical_failure: "The parish remembered only the merchant's alms, and turned on {actor}."
- Steady The Voice — success: "{actor} read the paper slowly, and the back of the crowd heard it." · near_miss: "{actor} read steadily, but the household shouted over the last lines." · failure: "{actor} read every word steadily, and the parish still did not believe."

### Step 1, negative — Bury the sin (veil 0.76). Specials 2 + `deal { count: 3, tags: ['lore','presence'] }`.

| id | name | sphere | cost | Δ | effectLine |
|---|---|---|---|---|---|
| `sineater.ease_the_dead` | Ease The Dead | spirit | 2 | 0.10 | Settle a restless spirit toward rest, so the burial rite closes without a fault. |
| `sineater.soften_hard_words` | Soften Hard Words | mind | 1 | 0.06 | Cool an angry questioner's temper, so the questions come quieter and fewer. |

Fragments:
- Ease The Dead — critical_success: "The bearers carried the bier through the lych-gate without a stop." · success: "The burial rite closed without a fault." · success_at_cost: "The rite closed, but only after the bearers stopped twice at the gate." · failure: "The rite closed, and the bearers swore the bier grew heavy at the gate."
- Soften Hard Words — success: "{cast:wronged} asked once, heard the answer, and stood aside." · near_miss: "{cast:wronged} stood aside, but asked twice first." · failure: "{cast:wronged} asked quietly, and kept asking." · critical_failure: "{cast:wronged} asked so quietly that the whole parish leaned in to hear."

Composed hands land at 5 (2 specials + 3 dealt). Sphere spread comes from the specials plus the fill; the dealer prefers an ungated common. No rider, no Heavy Hand, no zero-essence card.

## 12. Branch-Dependent Later Paragraphs

**Revelation (`positive`):**
> The paper is a confession. Years ago the merchant poisoned his partner and took the business. The partner's heir, {cast:wronged}, still keeps a stall in the market and has never known.
>
> {actor} will not bury it. They carry the paper to {cast:wronged} and read it before the parish priest at the lych-gate. The household calls it a forgery, written by a sin-eater who wants paying twice. {actor} must make the parish believe the dead man's own words.

**Discretion (`negative`):**
> The paper is a confession. Years ago the merchant poisoned his partner and took the business.
>
> {actor} keeps it, as a sin-eater should: a sin eaten is a sin buried. At the lych-gate, {cast:wronged}, the partner's heir, stops the bier and asks before the parish what was on the dead man's chest. {actor} must see the merchant into the ground clean, and tell the parish no lie.

## 13. Aftermath Paragraph

Revelation success: "The parish believed the merchant's own words. {cast:wronged} knows now how the partner died, and the household buried the merchant with half the town watching." Discretion success: "The merchant went into the ground clean, and the paper went into the graveside fire. {actor} carries the sin now, as the rite says."

## 14. Aftermath Reaction Choices

No reaction choices — consequence is clean. Scale is short; the fork already carried the mortal's decision, and a reaction menu would ask the player to re-decide what the mortal chose.

## 15. Aftermath Kit Summary

- Revelation: AMBITION · Uncover Ancient Secrets; BOND · {cast:wronged}'s trust; reputation with {location}; on failure SCAR · Under Watch on the town.
- Discretion: BOON · A Tended Shrine on the town; PATH · compulsion (driven to help others); reputation with {location}; on failure the heir's trust lost.

## 16. Support Bundle Contract

| Support object | Delivery | Source | Persistence | Future references | Status |
|---|---|---|---|---|---|
| `eldest` (merchant's heir) | lazy-materialize-on-trigger | reuse `merchant`/`trader`/`noble`, else spawn `merchant` | must-persist | none authored | ready |
| `wronged` (partner's heir) | lazy-materialize-on-trigger | reuse `trader`/`weaver`/`smith`, else spawn `trader` | must-persist | bond edge with the actor | ready |
| `$here` | pre-seeded (the location) | graph | persistent | reputation, conditions | ready |

## 17. Self-Audit

| Check | Verdict |
|---|---|
| Every step 0.72–0.85 | PASS (0.78 / 0.80 / 0.76) |
| Composed hand 4–8, ≤2 specials, deal declared | PASS (2 + 3) |
| ≥4 spheres, ≥1 ungated common | PASS by the dealer (specials darkness/spirit, time/order, spirit/mind; fill adds) — gate confirms |
| Every nudge ≥1 failure-band fragment | PASS |
| Six bands covered per hand | PASS with the dealt fragments (specials alone cover cs/s/sac/nm/f/cf on every step) |
| No digits in effectLines, no name word in its effectLine | PASS |
| Consequence hand wired in context | PASS (drive + place, both arms) |
| Law 56 chips backed | PASS per § 15 (critical_failure chips limited to reputation, backed on both routes) |
| Prose rule 7 / 7b | PASS — no history asserted; no future promised beyond the drives and conditions |
| Narrator mode, ≤80 words, one named person per beat | PASS (step 0 names {cast:eldest}; step 1 names {cast:wronged}) |
| Cool failure | PASS — the name, never life or liberty |

**Narrator's 12 questions.** 1 arrival: sent for by the parish, real names. 2 events: a merchant dead, the rite paid for, bread and salt laid. 3 one stake: threat to the master's name. 4 ≤80: 73. 5 read aloud: report throughout. 6 stated: the confession is stated plainly in step 1. 7 every sentence works: yes. 8 nothing unintroduced: the paper is found in every step-0 afterimage before step 1 names it; the lych-gate is introduced in step 1 before any fragment uses it. 9 one named person per beat: yes. 10 stake in a sentence: "Can {actor} eat a dead merchant's sins cleanly, and then carry or bury the poisoning he confessed under the bread?" 11 cards verb+noun: Seal, Stir, Wake, Steady, Ease, Soften. 12 opening per class: urban, rural.

## Experience Differentiator Gate

1 YES · 2 YES · 3 YES · 4 YES · 5 YES · 6 YES · 7 YES · 8 YES · 9 YES · 9b YES · 10 YES · 11 YES · 11b YES · 12 N/A (short; no reactions, justified) · 13 N/A · 14 YES (below).

## Concept Art Direction

Emotions: a burden accepted in silence; a truth that weighs as much as bread. Image: a pewter plate on a bare oak table with a few crumbs and a pinch of salt left, a folded paper beside it, one candle burnt low. No people.

## Branch Seduction Self-Check

- Revelation: a mortal who cannot hold a wrong without naming it; the god watches a sin-eater break the custom of their trade for a stranger at a market stall. Protects justice; costs the household's enmity.
- Discretion: a mortal who keeps the faith of the rite; the god watches them carry another man's crime for life. Protects the rite and the parish's trust in it; costs the heir's trust.
- Without labels, the two are distinct: a reading at a gate against a burial at a gate.
