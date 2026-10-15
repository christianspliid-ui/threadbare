# Encounter Pipeline: The Sin-Eater
> Scale: short | Slug: sin-eater | Pass: revised
> Revisions applied: opening seam echo fixed and "wool" cut; revelation arm reframed as a veil test (swear by the rite) with its stake stated; discretion arm given a reason the heir stops the bier and its stake stated; purpose lines, all 15 afterimages, 10 band overviews and every chip caption authored; chip nouns made sheet words (no placeholders); two contradicting fragments rewritten; positive-arm success_at_cost fragment added; description, stakes risk, time line and self-audit corrected.
> Date: 2026-10-15 | Pipeline version: 3.0 (factory line) | Batch: master-everyday-3, slot 8 (THR-1840)

## 0. Mechanical design block (fixed before the premise — brief § Game design)

- **Crux.** A rich merchant's household has paid for his sins to be eaten before burial; under the bread the sin-eater finds his written confession to a poisoning, and must decide whether to bury it with him or carry it to the living.
- **Title.** *The Sin-Eater* — glance test: someone eats a dead man's sins.
- **Template id.** `encounter.town.sin_eater` · reach `veil` · rarityTier 2 · scale `local` · intrinsicTier `shaping` · settings `urban`, `rural` · no rule gate.
- **Whose problem?** The agent's: they were sent for, and their name with the parish is the stake. The rolled agentRole *suspect_or_cause* is read as the sin-eater being the one the household (revelation: forgery) and the wronged heir (discretion: paid for silence) suspect. It is never asserted as history.
- **Shape.** Personality fork (THR-894), from the shape catalog. Step 0 tests (veil 0.78, `continue_weakened`): eat the sins. Step 1 is an agent-decided branch on `revelation_discretion`, branching on step 0:
  - `positive` (revelation) — **Swear by the rite**: veil 0.80, `fail_action`. Carry the paper to the wronged heir at the lych-gate, read it before the parish priest, and swear by the rite that it lay under the bread. The test is whether the rite's word holds against the household's forgery charge.
  - `negative` (discretion, also the fallback) — **Keep the sin buried**: veil 0.76, `fail_action`. Keep the paper, see the merchant into the ground clean, and tell no lie when the wronged heir stops the bier.
  - Mean across step 0 and the arms: 0.78. Every step inside 0.72–0.85.
- **Consequence hand (binding, `draw:consequences`): `drive` + `place`. No swap.**
  - `drive`:
    - `assign_ambition` `ambition_uncover_secrets` on `$actor`, positive arm success half ("found a poisoning buried under a dead man's bread, and wants to know what else the rich have hidden").
    - `plant_compulsion` `{ assist: 0.5 }`, 96 ticks, on `$actor`, negative arm success half ("carries a poisoner's sin, and is driven to set it right by work for others").
  - `place`:
    - `condition_attachment` `trait.condition.location.tended_shrine` on `$here`, negative arm success half (the dead went clean, so rites at the parish take more easily).
    - `apply_condition` `trait.condition.location.under_watch` on `$here` (0.6, 48 ticks), positive arm `failure` band (the household calls the paper a forgery and has the watch out).
- **Standing (the master's name).** `reputation_with $here`:
  - +0.06 on positive success.
  - +0.05 on negative success.
  - −0.06 on step-1 failure on either arm.
  - −0.03 on step-0 failure, so the step-0 critical-failure route, which ends the action, backs its reputation chip.
- **Relationship (third system).** `bond_change $cast:wronged` +0.12 on positive success (cs / s / sac). −0.06 on negative `failure`. No bond write on a critical failure: a step-0 critical failure lands on the fallback (negative) variant before the heir has appeared.
- **Cool failure.** Nobody is killed, jailed or branded. Failure costs the name: the parish trusts this sin-eater less with its dead, a household calls them a forger, the wronged heir believes they were paid for silence. It costs more for a master because the parish sent for them over every other eater.
- **Systems quota.** cast (two bound) + rewards (ambition / compulsion / location conditions persist) + reputation + relationship — four.
- **Trait hooks.** Gate: none (everyday). Variant: Patient `trait.personality.veil.virtue` +0.04; False `trait.core.core_integrity.vice` −0.04. Trait-only nudge: none. Trait fragment: none.
- **Mortal choice.** Yes, on `revelation_discretion`. `motivations: ['revelation_discretion']`, unpinned, so mortals of both poles are drawn.
- **Prose rule 7b.** The ambition, the compulsion and the two place conditions are the only forward state. No trial, no hearing and no later reckoning is promised.
- **Not colliding (brief verb table).** Veil masters: lay an ossuary's dead, judge a witch. Veil experts: hear a drowned man, judge an oath-breaker. This one eats a living rite's bread and decides what to do with a sin. No card questions the dead.

**Rolled packet (binding row):**

| Field | Rolled value |
|---|---|
| plotHookRolled | `hook.relic_awakening`, `hook.haunt_resolution`, `hook.sacred_crime` |
| setting | *sacred* (overridden to `urban` / `rural`; the sacred survives as the lych-gate and the house of the dead) |
| shape | personality_fork |
| system | forks |
| p3Shape | *threat* |
| opposition | *terrain (indifference)* |
| disposition | n/a |
| agentRole | *suspect_or_cause* |
| scale | personal |

**plotHookTaken: `hook.sacred_crime`** — the crime hidden inside a sacred rite: the merchant left his poisoning under the sin-eater's bread so the rite would carry it into the grave. Drift: the rite is the merchant's last attempt to make the parish's own custom bury his crime. `haunt_resolution` survives faintly in the negative arm's "goes to the grave clean". `relic_awakening` fought the everyday register and was dropped.

**Seed dice reading.**

- **p3 *threat*.** The stake is stated as a threat to the master's name ("is not sent for again").
- **Opposition *terrain (indifference)*.** Read as the rite itself: bread, salt and burial words that go clean or do not, whatever anyone wants.
- **Scale *personal*.** One household, one heir, one parish.

## 1. Inspiration Anchors

- **Folk custom of the sin-eater** (Welsh-border practice): bread and salt on the corpse's chest, eaten for a coin, the eater shunned afterward. Gives the rite and its cost to the eater.
- **`hook.sacred_crime`** (plot-hook corpus): a crime that hides inside a holy act. Gives the confession under the bread.
- **Ordeal / Event archetypes** (vault, via the batch brief): the ordeal is the rite, and the event is the confession. Anti-patterns avoided:
  - the player choosing for the mortal (the fork is agent-decided);
  - a lurid failure (failure costs a name, never a life);
  - invented history (the agent is "sent for", never "the parish's sin-eater of twenty years").
- **Dilemma library.** The fork is the classic secret-of-the-dead dilemma. The library confirmed that both poles must carry a real cost, which is why the discretion arm faces the wronged heir at the lych-gate.

## 2. Scale Justification

Short: one test and one fork, one household, one night (dusk to the dawn burial). The weight is a single decision a mortal makes by their nature, and more beats would dilute it. The master band is carried by the difficulty and by who is watching (a whole parish), not by length.

## 3. Pressure Knot

The merchant died today and is buried at dawn. The household has already paid for the rite and wants him buried clean before the town talks. He left a confession under the bread, so the rite he paid for would carry his crime into the grave. The wronged partner's heir still lives in the town and has never known how the partner died.

## 4. Intervention Fantasy

The god watches a mortal swallow another man's sins, then find one they were not meant to read. The god cannot pick what the mortal does with it. Before the bread is eaten, the god can lean on their conscience or on their silence. Afterwards it can help the chosen course land: stir an old grief in a parish, steady a voice, ease a dead man toward rest, cool an accuser's temper.

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

1. **Eat the sins** (veil 0.78, purpose line *"Eat the sins"*). The household watches the master eat bread and salt off the dead man's chest. Every band ends with the paper found, except critical failure, which ends the action.
2. **The fork** (agent-decided on `revelation_discretion`, branch on step 0):
   - *Revelation* — swear by the rite to the confession at the lych-gate (veil 0.80, purpose line *"Swear by the rite"*).
   - *Discretion* — keep the sin and see the merchant into the ground clean (veil 0.76, purpose line *"Keep the sin buried"*).

## 7. Branching Profile

- Branch depth: `light`. Branch count: `2`.
- Where branching lives: step-1 scene prose, the step-1 hand, step-1 outcome writes, the aftermath variant (`branchOnStep: 0`, keyed on the recorded pole).
- Convergence policy: none. The arms end in different places and different states.
- Shape: personality fork (THR-894). Secondary template: none.

## 8. Branching Map

Step 0 (both) → pole recorded from the mortal's `revelation_discretion` profile plus the net lean of the committed step-0 cards. A step-0 critical failure ends the action and lands on the fallback (negative) aftermath variant.

- `positive` → step 1 *Swear by the rite*. The household calls the paper a forgery, and the parish weighs the rite's word against a rich house.
  - Success: ambition, bond with the wronged heir, standing.
  - Failure: Under Watch on the town, standing lost.
- `negative` → step 1 *Keep the sin buried*. The wronged heir has heard of the paper, stops the bier and asks.
  - Success: Tended Shrine, compulsion, standing.
  - Failure: standing lost, the heir's trust lost.

## 9. Outcome Ladder

| Band | Revelation | Discretion |
|---|---|---|
| critical_success | The priest knows the merchant's hand and swears to it; the heir learns all of it before the parish. Ambition, bond, standing. | The master burns the paper at the graveside; the merchant goes into the ground clean and the heir lets the bier pass. Tended Shrine, compulsion, standing. |
| success | The parish takes the paper as the merchant's own. Same writes. | The master answers the heir without a lie; the merchant goes into the ground clean. Same writes. |
| success_at_cost | Believed, but the household swears the master forged it. Same writes; the cost is told. | Clean, but the heir leaves sure the sin-eater was paid for silence. Same writes; the cost is told. |
| failure | The parish will not take a dead man's paper from a sin-eater's hand; the household has the watch out. Under Watch, standing lost. | The master stumbles on the burial words; the parish says the merchant went down unclean. Standing lost, the heir's trust lost. |
| critical_failure | The household tears the paper away and the parish believes the forgery charge. Standing lost. | The merchant goes into the ground with his sins on him (step-1 route: the burial words lost; step-0 route: the bread never finished). Standing lost. |

## 9b. Stakes Line

```
goal:      eat a dead merchant's sins before his burial
risk:      leave a sin on the dead, and not be sent for again
won:       ate the merchant's sins and told the parish his crime
lost:      was not believed, and the household set the watch
lostBadly: was called a forger before the whole parish
arms.negative:
  won:       ate the merchant's sins and buried his crime with him
  lost:      left the merchant to be buried unclean
  lostBadly: left the merchant unclean, and the parish blamed them
```

Description (player prose): "A rich merchant lies dead, and his household has paid for his sins to be eaten before the burial. Under the bread on his chest is his own written confession to a poisoning, and the sin-eater must decide whether it goes into the grave with him."

## 10. Sample Opening (narrator mode)

> {actor} arrives in {location} at dusk, sent for by the parish.
>
> A rich merchant lies dead in his hall, to be buried at dawn. His eldest, {cast:eldest}, has paid for a sin-eater so his father goes to the grave clean. Bread and salt lie on the dead man's chest.
>
> {actor} must eat it all before the household and take every sin. A sin-eater who leaves a sin behind is not sent for again.

Rural opening P1: "{actor} comes to {location} at dusk, sent for by the parish." Opening + spine = 70 words.

### Step 0 — Eat the sins: test panel and afterimages

- **purposeLine:** `Eat the sins`
- **difficulty:** 0.78 · `continue_weakened`
- **factorLines:** none authored (variance rule); the trait variants carry their own lines.

| Afterimage | Text |
|---|---|
| critical_success | "{actor} ate to the last crumb, and the rite closed clean. Under the bread lay a folded paper in the merchant's hand." |
| success | "{actor} finished eating, and the rite closed. Under the bread lay a folded paper in the merchant's hand." |
| success_at_cost | "{actor} finished eating, but slowly, and the household began to mutter. Under the bread lay a folded paper in the merchant's hand." |
| failure | "{actor} did not finish, and the household saw crumbs left on the chest. Under the bread lay a folded paper in the merchant's hand." |
| critical_failure | "{actor} could not finish the bread. {cast:eldest} sent them from the hall with the sins still on the dead man." |

## 11. The Hand Per Step

### Step 0 — Eat the sins (veil 0.78). Specials 2 + `deal { count: 3, tags: ['lore','insight'] }`.

| id | name | type | sphere | cost | Δ | lean | effectLine |
|---|---|---|---|---|---|---|---|
| `sineater.seal_the_lips` | Seal The Lips | Undertow (authored, pole lean) | darkness | 1 | 0.06 | negative | Lay a vow of silence on them. They lean toward keeping what they learn hidden. |
| `sineater.stir_the_conscience` | Stir The Conscience | Kindled Ambition (authored, pole lean) | spirit | 1 | 0.06 | positive | Make any wrong they learn sit heavy on them. They lean toward carrying it to the people it harmed. |

Fragments:

- **Seal The Lips**

  | Band | Fragment |
  |---|---|
  | success | "{actor} ate in silence and kept their eyes on the bread." |
  | success_at_cost | "{actor} ate in such silence that the household grew uneasy." |
  | failure | "{actor} kept silent so long that the household thought the rite had stalled." |

- **Stir The Conscience**

  | Band | Fragment |
  |---|---|
  | critical_success | "{actor} ate every crumb, then read the paper beneath twice." |
  | near_miss | "{actor} named the sins aloud as the rite asks, but stumbled on the last." |
  | failure | "{actor} stopped eating to read the paper under the bread." |
  | critical_failure | "{actor} put down the bread to read the paper under it, and never picked it up again." |

### Step 1, positive — Swear by the rite (veil 0.80, `fail_action`). Specials 2 + `deal { count: 3, tags: ['presence','social'] }`.

*(Pass 3 to consider `['lore','social']` for the reframed veil test — editorial note, not applied.)*

**Narrative:**

> The paper is a confession. Years ago the merchant poisoned his partner and took the business. The partner's heir, {cast:wronged}, still lives here and has never known.
>
> {actor} will not bury it. At the lych-gate, before the parish priest, they read the paper to {cast:wronged} and swear by the rite that it lay under the bread. The household calls it a forgery, written by a sin-eater who wants paying twice.
>
> {actor} must make the rite's word hold. The household wants the parish to call {actor} a forger instead.

- **purposeLine:** `Swear by the rite`

| Afterimage | Text |
|---|---|
| critical_success | "The priest knew the merchant's hand on sight and swore to it." |
| success | "The parish took the paper as the merchant's own." |
| success_at_cost | "The parish took the paper, and the household swore {actor} forged it." |
| failure | "The parish would not take a dead man's paper from a sin-eater's hand." |
| critical_failure | "The household tore the paper from {actor}'s hands." |

| id | name | sphere | cost | Δ | effectLine |
|---|---|---|---|---|---|
| `sineater.wake_old_grief` | Wake Old Grief | time | 2 | 0.10 | Bring a past loss back to the listeners, so they ask again how it happened. |
| `sineater.steady_the_voice` | Steady The Voice | order | 1 | 0.06 | Keep their speech level and slow, so each word carries to the back of a crowd. |

Fragments:

- **Wake Old Grief**

  | Band | Fragment |
  |---|---|
  | critical_success | "The old men at the lych-gate remembered how sudden the partner's death was, and asked how it came." |
  | success | "The parish remembered how fast the partner had died." |
  | failure | "The parish remembered the partner, and remembered the merchant's alms to the poor as well." |
  | critical_failure | "The parish remembered only the merchant's alms, and turned on {actor}." |

- **Steady The Voice**

  | Band | Fragment |
  |---|---|
  | success | "{actor} read the paper slowly, and the back of the crowd heard it." |
  | success_at_cost | "{actor} read every line clearly, though the household jeered through it." |
  | near_miss | "{actor} read steadily, but the household shouted over the last lines." |
  | failure | "{actor} read every word steadily, and the parish still did not believe." |

### Step 1, negative — Keep the sin buried (veil 0.76, `fail_action`). Specials 2 + `deal { count: 3, tags: ['lore','presence'] }`.

**Narrative:**

> The paper is a confession. Years ago the merchant poisoned his partner and took the business.
>
> {actor} keeps it, as a sin-eater should: a sin eaten is a sin buried. At the lych-gate the partner's heir, {cast:wronged}, stops the bier. Word of a paper under the bread has reached them, and they ask before the parish what it said.
>
> {actor} must see the merchant into the ground clean, and tell the parish no lie. A burial that falters sends the dead down unclean, and the parish blames the sin-eater.

- **purposeLine:** `Keep the sin buried`

| Afterimage | Text |
|---|---|
| critical_success | "{actor} burned the paper at the graveside, and the merchant went into the ground clean." |
| success | "{actor} answered {cast:wronged}: \"His sins are mine now.\" The merchant went into the ground clean." |
| success_at_cost | "The merchant went into the ground clean, but the answer did not satisfy {cast:wronged}." |
| failure | "{actor} stumbled on the burial words at the graveside." |
| critical_failure | "{actor} lost the burial words at the graveside." |

| id | name | sphere | cost | Δ | effectLine |
|---|---|---|---|---|---|
| `sineater.ease_the_dead` | Ease The Dead | spirit | 2 | 0.10 | Settle a restless spirit, so a burial rite closes without a fault. |
| `sineater.soften_hard_words` | Soften Hard Words | mind | 1 | 0.06 | Cool an angry questioner's temper, so the questions come quieter and fewer. |

Fragments:

- **Ease The Dead**

  | Band | Fragment |
  |---|---|
  | critical_success | "The bearers carried the bier through the lych-gate without a stop." |
  | success | "The burial rite closed without a fault." |
  | success_at_cost | "The rite closed, but only after the bearers stopped twice at the gate." |
  | failure | "The bier grew so heavy at the gate that the bearers set it down." |

- **Soften Hard Words**

  | Band | Fragment |
  |---|---|
  | success | "{cast:wronged} asked once, heard the answer, and stood aside." |
  | near_miss | "{cast:wronged} stood aside, but asked twice first." |
  | failure | "{cast:wronged} asked quietly, and kept asking." |
  | critical_failure | "{cast:wronged} asked so quietly that the whole parish leaned in to hear." |

Composed hands land at 5 (2 specials + 3 dealt). Sphere spread comes from the specials plus the fill, and the dealer prefers an ungated common. No rider, no Heavy Hand, no zero-essence card.

## 12. Branch-Dependent Later Paragraphs

The step-1 narratives in § 11 are the branch-dependent paragraphs. They are given there so each arm's hand sits with its scene. They are repeated here for the packet's shape.

**Revelation (`positive`):**

> The paper is a confession. Years ago the merchant poisoned his partner and took the business. The partner's heir, {cast:wronged}, still lives here and has never known.
>
> {actor} will not bury it. At the lych-gate, before the parish priest, they read the paper to {cast:wronged} and swear by the rite that it lay under the bread. The household calls it a forgery, written by a sin-eater who wants paying twice.
>
> {actor} must make the rite's word hold. The household wants the parish to call {actor} a forger instead.

**Discretion (`negative`):**

> The paper is a confession. Years ago the merchant poisoned his partner and took the business.
>
> {actor} keeps it, as a sin-eater should: a sin eaten is a sin buried. At the lych-gate the partner's heir, {cast:wronged}, stops the bier. Word of a paper under the bread has reached them, and they ask before the parish what it said.
>
> {actor} must see the merchant into the ground clean, and tell the parish no lie. A burial that falters sends the dead down unclean, and the parish blames the sin-eater.

## 13. Aftermath Paragraphs (`aftermathConfig`, `branchOnStep: 0`)

**Variant `positive`** — variant overview: "{actor} carried the confession to the living."

| Band | Overview |
|---|---|
| critical_success | "{cast:wronged} learned how the partner died, with the whole parish listening at the lych-gate." |
| success | "{cast:wronged} knows now how the partner died, and the household buried the merchant with half the town watching." |
| success_at_cost | "{cast:wronged} knows now how the partner died. The household names {actor} a forger to anyone who will listen." |
| failure | "The household called {actor} a forger to the priest's face, and the priest took their side." |
| critical_failure | "The household called {actor} a forger before the whole parish, and the parish believed them." |

**Variant `negative`** (also `fallback`) — variant overview: "{actor} kept the dead man's sin."

| Band | Overview |
|---|---|
| critical_success | "{cast:wronged} let the bier pass, and the parish praised the rite." |
| success | "{actor} kept the paper, and carries the merchant's sin now, as the rite says." |
| success_at_cost | "{cast:wronged} left the gate sure that {actor} was paid for silence." |
| failure | "The parish says the merchant went down unclean." |
| critical_failure | "The merchant went into the ground with his sins still on him." (reads true on both the step-0 and step-1 critical-failure routes) |

## 14. Aftermath Reaction Choices

No reaction choices; the consequence is clean. Scale is short, and the fork already carried the mortal's decision, so a reaction menu would ask the player to re-decide what the mortal chose.

## 15. Aftermath Kit Summary (chips, scar · bond · boon · path order)

Every chip is backed by the write named in its row. `detail` is ≤15 words, with no placeholder in any `stateNoun`.

**Revelation — critical_success / success / success_at_cost** (same three chips):

| Category · stateNoun | Anchor | Write | title | detail |
|---|---|---|---|---|
| BOND · `a bond` | `$cast:wronged` | `bond_change` +0.12 | "The heir's trust" | "{cast:wronged} trusts {actor} now." |
| BOON · `reputation with {location}` | `$here` | `reputation_with` +0.06 | "The parish's word" | "The parish takes {actor}'s word over a rich house's." |
| PATH · `ambition` | `$actor` (`ambition_uncover_secrets`) | `assign_ambition` | "Uncover Secrets" | "{actor} wants to know what else the rich have buried." |

**Revelation — failure:**

| Category · stateNoun | Anchor | Write | title | detail |
|---|---|---|---|---|
| SCAR · `Under Watch` | `trait.condition.location.under_watch` on `$here` | `apply_condition` 0.6, 48 ticks | "The watch is out" | "The household set the watch on {location}; quiet work there is harder now." |
| SCAR · `reputation with {location}` | `$here` | `reputation_with` −0.06 | "A doubted word" | "The parish trusts {actor}'s word on the dead less." |

**Revelation — critical_failure:**

| Category · stateNoun | Anchor | Write | title | detail |
|---|---|---|---|---|
| SCAR · `reputation with {location}` | `$here` | `reputation_with` −0.06 | "Called a forger" | "The parish trusts {actor}'s word on the dead far less." |

**Discretion — critical_success / success / success_at_cost** (same three chips):

| Category · stateNoun | Anchor | Write | title | detail |
|---|---|---|---|---|
| BOON · `A Tended Shrine` | `trait.condition.location.tended_shrine` on `$here` | `condition_attachment` | "A clean burial" | "Rites for the dead in {location} go more easily now." |
| BOON · `reputation with {location}` | `$here` | `reputation_with` +0.05 | "Trusted with the dead" | "The parish trusts {actor} with its dead." |
| PATH · `compulsion` | `$actor` | `plant_compulsion` `{ assist: 0.5 }`, 96 ticks | "A sin to carry" | "Driven to set the sin right, {actor} works for others for a time." |

**Discretion — failure:**

| Category · stateNoun | Anchor | Write | title | detail |
|---|---|---|---|---|
| SCAR · `a bond soured` | `$cast:wronged` | `bond_change` −0.06 | "The heir's doubt" | "Sure {actor} was paid for silence, {cast:wronged} no longer trusts them." |
| SCAR · `reputation with {location}` | `$here` | `reputation_with` −0.06 | "An unclean burial" | "The parish trusts {actor} with its dead less." |

**Discretion — critical_failure** (both routes; step-0 route writes −0.03, step-1 route −0.06):

| Category · stateNoun | Anchor | Write | title | detail |
|---|---|---|---|---|
| SCAR · `reputation with {location}` | `$here` | `reputation_with` −0.03 / −0.06 | "Blamed for the burial" | "Blamed for an unclean burial, {actor} is trusted with the parish's dead far less." |

**Routing note for Pass 3.** A step-0 critical failure ends the action. Confirm that it lands on the fallback (`negative`) variant. If a `positive` pole can be recorded on a step-0 critical failure, the positive `critical_failure` overview must fall back to route-neutral text.

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
| Composed hand 4–8, ≤2 specials, deal declared | PASS (2 + 3 on each step) |
| ≥4 spheres, ≥1 ungated common | PASS by the dealer (specials darkness/spirit, time/order, spirit/mind; the fill adds the rest). The gate confirms |
| Every nudge ≥1 failure-band fragment | PASS |
| Six bands covered per hand | PASS by the specials alone on every step. Step 0: cs/nm/f/cf (Stir), s/sac (Seal). Positive: cs/s/f/cf (Wake), sac/nm (Steady). Negative: cs/s/sac/f (Ease), nm/cf (Soften) |
| No digits in effectLines, no name word in its effectLine | PASS |
| Consequence hand wired in context | PASS (drive + place, both arms) |
| Law 56 chips backed; sheet-word nouns, no placeholder in stateNoun | PASS per § 15 (critical_failure chips limited to reputation, backed on both routes) |
| Chip sentences ≤15 words; no overview fact retold | PASS (page read in the editorial file) |
| Prose rule 7 / 7b | PASS: no history asserted ("sent for", never "by name"); no future promised beyond the drives and conditions |
| Narrator mode, ≤80 words, one named person per beat | PASS (opening and step 0 name {cast:eldest}; step 1 names {cast:wronged}) |
| Each step tests its declared reach | PASS: step 0 the rite; positive the rite's word sworn over the dead; negative the burial rite and a kept secret |
| Cool failure | PASS: the name, never life or liberty |

**Narrator's 12 questions.**

1. Arrival: sent for by the parish, real names.
2. Events: a merchant dead, the rite paid for, bread and salt laid.
3. One stake: a threat to the master's name.
4. ≤80 words: 70.
5. Read aloud: report throughout.
6. Stated: the confession is stated plainly in step 1.
7. Every sentence works: yes.
8. Nothing unintroduced: the paper is found in every step-0 afterimage except critical failure (which ends the action) before step 1 names it. The lych-gate is introduced in step 1 before any fragment uses it.
9. One named person per beat: yes.
10. Stake in a sentence: "Can {actor} eat a dead merchant's sins cleanly, and then carry or bury the poisoning he confessed under the bread?"
11. Cards verb + noun: Seal, Stir, Wake, Steady, Ease, Soften.
12. Opening per class: urban, rural.

## Experience Differentiator Gate

| # | Answer |
|---|---|
| 1 | YES |
| 2 | YES |
| 3 | YES |
| 4 | YES |
| 4b | YES |
| 5 | YES |
| 6 | YES |
| 7 | YES |
| 8 | YES |
| 9 | YES |
| 9b | YES |
| 10 | YES |
| 11 | YES |
| 11b | YES |
| 12 | N/A (short; no reactions, justified) |
| 13 | N/A |
| 14 | YES (below) |

The evidence is in `sin-eater-editorial.md` § 11.

## Concept Art Direction

Emotions: a burden accepted in silence; a truth that weighs as much as bread. Image: a pewter plate on a bare oak table with a few crumbs and a pinch of salt left, a folded paper beside it, one candle burnt low. No people.

## Branch Seduction Self-Check

- **Revelation.** A mortal who cannot hold a wrong without naming it. The god watches a sin-eater turn their own rite into testimony for a neighbour they owe nothing, while a rich house calls them a forger. It protects justice and costs the household's enmity.
- **Discretion.** A mortal who keeps the faith of the rite. The god watches them carry another man's crime and answer the heir without a lie. It protects the rite and the parish's trust in it, and costs the heir's trust.
- Without labels, the two are distinct: an oath sworn at a gate against a burial kept at a gate.
