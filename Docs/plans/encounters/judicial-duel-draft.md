# Encounter Pipeline: The Judicial Duel
> Scale: medium | Slug: judicial-duel | Pass: draft
> Date: 2026-10-05 | Pipeline version: 2.0
> Template: `encounter.town.judicial_duel` · Batch: master-everyday, slot 4 (THR-1688) · Brief: `Docs/plans/encounters/master-everyday-brief.md`

## 0. Mechanical design block (fixed before prose)

| Row | Value |
|---|---|
| Crux | A family's farm will be settled by trial by combat, and the mortal is their champion against a fighter nobody here has seen. |
| Title | **The Judicial Duel** — the objective in three words. |
| Shape | Puzzle – Investigation – Resolution. eye 0.72 (`continue_weakened`) → iron 0.80 (`continue_weakened`) → iron 0.84 (`fail_action`). Linear, branch count 0. Mean 0.787, window fit 0.927 (master). Carryover lines on steps 1 and 2 key on the band the previous step rolled. |
| Fight system | **None.** The bout is two nudge-resolved Iron steps. No monster card, no fight gate, no confront gate. |
| Setting | `urban` only (rolled `stronghold` overridden in the brief: the stronghold survives as the roped lists in the market square). |
| Stake (P3) | mystery (rolled): nobody knows how the order's champion fights. |
| Opposition | faction (orders), rolled: a fighting order sent its champion to hold a farm it bought from a man who did not own it. The order is scene fiction (no faction node); its champion is the bound cast member. |
| Disposition | friendly (rolled): the order's champion drills in the open, where anyone can watch, and salutes the mortal like a colleague. |
| Agent role | client who is owed (rolled): the family cannot pay a champion and offers a favour owed instead — made real by `favor_creation` (debtor `$cast:claimant`) on the final step's success. |
| Scale | region (rolled): if the order wins, every old title in the valley can be challenged the same way. `scale: 'local'` (fixed). |
| System target | traits (rolled): two `traitVariants` on the Iron reputation pair. |
| Plot hook | rolled `hook.forbidden_knowledge_price`, `hook.monster_eradication`, `hook.swindled_family` · **taken `hook.swindled_family`**, blended with `hook.forbidden_knowledge_price`: the family was cheated of its farm by a false sale; learning the order's style in step 0 is knowledge the order guards. `monster_eradication` dropped (no monster on an everyday board). |
| Consequence hand (binding) | `thread` + `place`, no swap. **thread** — trial by combat is an appeal to heaven's verdict, so the god's thread to the champion is what the bout tests: `thread_strengthen` (`$ascendant` ↔ `$actor`) on step 2 success, `thread_weaken` on step 2 failure. **place** — what the verdict leaves true of the town: `apply_condition` `trait.condition.location.under_watch` on `$here` on step 2 failure (the order's men stay on to hold the farm and watch the town); on the success side the reaction *Stand the square a feast* writes `trait.condition.location.festival` on `$here`. |
| Standing | `reputation_with $here` +0.06 on step 2 success, −0.06 on step 2 failure; −0.02 on steps 0 and 1 failure (backs the critical_failure chip on every route — a critical failure at any step ends the action). |
| Favour | `favor_creation` debtor `$cast:claimant`, magnitude 0.4–0.6, on step 2 success: the agent's role made state. |
| Cast | `claimant` (the family's head, must-persist; reuse `merchant`/`trader`, spawn `merchant` "Wenna Coldridge") · `champion` (the order's champion, must-persist; spawn `warrior_priest` "Corvin Ashe"). |
| Systems | cast · rewards (thread, favour, conditions persist) · conditions · reputation = 4. |
| Mortal choice | None in the steps — this is a test. The stance lives in the aftermath reactions. |
| Cool failure | Nobody dies, nobody is jailed. The family loses the farm, the order holds it with men in the town, and the mortal is the champion who lost it in front of the valley. A master costs more: the valley sent for the best, and the best was beaten. |
| Cost channels | All specials priced in essence. No Heavy Hand, no rider, no grant. |

## 1. Inspiration Anchors

- **The Swindled Family** (taken hook, #204): a family cheated of everything by someone still nearby, asking for help it cannot pay for. Contributed the farm, the false sale by a cousin, and the favour owed in place of a fee.
- **The Forbidden Knowledge Price** (blended): the answer can be found, and knowing it cannot be undone. Survives as step 0 — the order's style is learned by watching, and the order cannot unteach it.
- **Monster Eradication** (rolled, dropped): an everyday board admits no monster; nothing of it survives.
- Anti-patterns avoided: the rival as a villain (the champion is courteous and may believe the claim), the fight as a fight-system bout (the brief forbids it), the verdict as a choice the player makes (fate rolls the bout).

## 2. Scale Justification

Medium: three beats (watch, weather the rush, win), master rarity. The outcome touches one family's farm, one town's square and every old title in the valley; a master is the right person to lose it. Medium means reaction choices are owed.

## 3. Pressure Knot

A fighting order bought the Coldridge farm from a cousin who never owned it, and has moved in. The court cannot untangle the deeds and has called a trial by combat. The order's champion has arrived and drills each morning. The bout is in the market square at the end of the week, whatever anyone does.

## 4. Intervention Fantasy

The god watches its mortal fight for someone else's land under a sky the whole town believes is judging. The hand reaches into time (a fighter's moves dragged a beat late), memory (the move a trained body repeats), the crowd (one loud voice), luck (loose ground at the wrong moment) and order (an oath sworn falsely, weighing on the one who swore it). None of it tells the mortal how to fight.

## 5. Cast and World Objects

| Object | Kind | Notes |
|---|---|---|
| `{actor}` | the mortal | protagonist, the family's champion |
| `{cast:claimant}` | actor, must-persist | head of the family; reuse `merchant`/`trader`, spawn `merchant` "Wenna Coldridge", supportRole `duel_claimant` |
| `{cast:champion}` | actor, must-persist | the order's champion; spawn `warrior_priest` "Corvin Ashe", supportRole `duel_order_champion` |
| the court | role noun | sets the duel, reads the verdict |
| the order | scene fiction | no faction node; never chipped |
| the farm | scene fiction | never chipped; the place chips anchor `$here` |
| `{location}` (`$here`) | location | carries the standing edge; Under Watch on failure; Festival by reaction |
| the god's thread | `$ascendant` ↔ `$actor` | strengthened or weakened by the verdict |

## 6. Beat Structure

1. **Step 0 — Read the style** (eye 0.72): watch the order's champion drill and learn how the style wins.
2. **Step 1 — Survive the first rush** (iron 0.80): the bout opens; the champion comes in fast.
3. **Step 2 — Win the bout** (iron 0.84, `fail_action`): make the champion yield before the court.

## 7. Branching Profile

Linear — no branching. Branch count 0.

## 8. Branching Map

N/A — linear encounter.

## 9. Outcome Ladder

- **critical_success** — the champion yields on one knee, the farm stays with the family, the court writes it down. Thread stronger, favour owed, the town thinks well of the mortal.
- **success** — the champion yields; the farm stays. Same writes.
- **success_at_cost** — the farm stays, but the mortal is cut and limping, and the court saw a near thing. Same writes.
- **failure** — the mortal yields; the farm goes to the order, and the order's men stay in the town (Under Watch). Thread thinner, the town thinks less of the mortal.
- **critical_failure** — the mortal is beaten down in front of the valley (or misread the style and was replaced before the bout). The family blames them aloud. The town thinks less of them.

## 10. Sample Opening

Opening (urban): "{actor} arrives in {location} as the court calls a trial by combat."

Step 0 spine:

> A fighting order claims the farm {cast:claimant}'s family has worked for four generations. The order bought it from a cousin who never owned it. A duel in the market square will settle it.
>
> Nobody in {location} knows how the order's champion fights. {cast:claimant} cannot pay a champion, and offers {actor} a favour owed if the family keeps the farm. The champion drills where anyone can watch.

## 11. The Hand Per Step

### Step 0 — Read the style (eye 0.72) · purpose "Read their style"
`deal: { count: 3, tags: ['insight', 'might'] }` · `failBehavior: continue_weakened`

**Afterimages**
- critical_success: "By the second morning they knew the style: a feint at the knee, then a cut at the head, every time."
- success: "They learned the style's main trick: a feint low, then a cut high."
- success_at_cost: "They learned the feint low and the cut high, but the champion saw them watching and changed the drill."
- failure: "They watched for three mornings and could not tell the feints from the real blows."
- critical_failure: "They read the style wrong and told {cast:claimant} it could be met head-on. {cast:claimant} found another champion."

Failure metadata: `reputation_with $here −0.02`.

**Specials**
1. **Slow A Fighter** — Boost (time) · essence 2 · Δ 0.10 · `generic.focus`
   effectLine: "Drag every move a beat behind its intent, so a watcher sees each feint before it lands."
   - critical_success: "Every drill ran slow enough to count, and {actor} counted the same feint each time."
   - success: "The drills ran a beat slow, and {actor} saw where each cut began."
   - near_miss: "The drills ran slow for one morning, and the champion changed them the next."
   - failure: "The drills ran slow, and {actor} still read the feints as real blows."
2. **Reveal Old Habits** — Whisper (mind) · essence 2 · Δ 0.08 · `generic.memory`
   effectLine: "Show the watcher the one move a trained body falls back on without thinking."
   - success: "{actor} saw the half-step back the champion takes before every cut."
   - success_at_cost: "{actor} saw the half-step back, and the champion saw {actor} see it."
   - failure: "{actor} saw a half-step back once, and took it for a stumble."
   - critical_failure: "{actor} saw a habit that was never there, and built a plan on it."

### Step 1 — Survive the first rush (iron 0.80) · purpose "Survive the first rush"
`deal: { count: 3, tags: ['might', 'social'] }` · `failBehavior: continue_weakened`

Spine:
> The market square is roped off and packed. Families have come from across the valley, because if the order wins, every old title in the valley can be challenged the same way. {cast:champion} swears before the court that the order's claim is true, then comes in fast.

Carryover lines (keyed on step 0):
- critical_success: "They know the feint before it comes." (for, +0.06)
- success: "They know the style's main trick." (for, +0.04)
- success_at_cost: "The champion knows they were watched." (against, −0.02)
- near_miss: "They learned the style late." (against, −0.03)
- failure: "They cannot tell the champion's feints from real blows." (against, −0.05)
- critical_failure: (unreachable — a step-0 critical failure ends the action)

**Afterimages**
- critical_success: "They met the first rush and turned it, and {cast:champion} backed off bleeding."
- success: "They took the first rush on their guard and gave no ground."
- success_at_cost: "They held the first rush, and took a cut across the forearm doing it."
- failure: "The first rush drove them back to the rope, and the crowd groaned."
- critical_failure: "The first rush knocked the blade from their hand, and they yielded before the court."

Failure metadata: `reputation_with $here −0.02`.

**Specials**
1. **Rouse The Crowd** — Fellowship-flavoured Boost (spirit) · essence 2 · Δ 0.10 · `generic.crowd`
   effectLine: "Lift the onlookers into one loud voice, so their noise steadies one fighter and rattles the other."
   - critical_success: "The square roared {actor}'s name, and {cast:champion} looked at the crowd instead of the blade."
   - success: "The crowd shouted for the family's champion, and {actor} fought into the noise."
   - near_miss: "The crowd shouted for {actor}, then fell quiet when the champion pressed."
   - failure: "The crowd roared, and {cast:champion} fought through the noise as if it were silence."
2. **Twist Their Footing** — Stumble (chaos) · essence 1 · Δ 0.08 · opposes `champion` · `generic.luck`
   effectLine: "Shift loose ground under an opponent at the wrong moment, so their best stroke goes wide."
   - success: "{cast:champion}'s heel slid on a loose cobble, and the cut went past {actor}'s shoulder."
   - success_at_cost: "{cast:champion} slipped, and fell into {actor} blade first."
   - failure: "{cast:champion} slipped, caught their balance, and came on harder."
   - critical_failure: "The cobble turned under {actor} instead."

### Step 2 — Win the bout (iron 0.84) · purpose "Win the bout"
`deal: { count: 4, tags: ['might', 'peril'] }` · `failBehavior: fail_action`

Spine:
> Both fighters are cut and tiring. The court will give the farm to whoever makes the other yield. {cast:champion} has stopped saluting.

Carryover lines (keyed on step 1):
- critical_success: "{cast:champion} is bleeding and wary." (for, +0.06)
- success: "They held the first rush without giving ground." (for, +0.04)
- success_at_cost: "They are fighting with a cut forearm." (against, −0.02)
- near_miss: "They held the rush, but only just." (against, −0.03)
- failure: "They are fighting with their back to the rope." (against, −0.05)
- critical_failure: (unreachable)

**Afterimages**
- critical_success: "{cast:champion} yielded on one knee, and the court gave the farm to the family."
- success: "{actor} forced {cast:champion} to yield, and the court gave the farm to the family."
- success_at_cost: "{cast:champion} yielded, but {actor} left the square limping from a cut to the leg."
- failure: "{actor} was driven to the ground and yielded, and the court gave the farm to the order."
- critical_failure: "{actor} was beaten down in front of the whole valley, and the court gave the farm to the order."

Success metadata: `thread_strengthen ($ascendant, $actor)`, `favor_creation (debtor $cast:claimant, 0.4–0.6)`, `reputation_with $here +0.06`.
Failure metadata: `thread_weaken ($ascendant, $actor)`, `apply_condition trait.condition.location.under_watch on $here`, `reputation_with $here −0.06`.

**Special**
1. **Weigh A False Oath** — Undertow-flavoured Heavy press (order) · essence 3 · Δ 0.12 · opposes `champion` · `generic.oath`
   effectLine: "Lay a lie sworn before witnesses on whoever swore it, so it slows their arm when it counts."
   - critical_success: "{cast:champion} faltered on the word the court had heard, and went down on one knee."
   - success: "{cast:champion}'s guard dropped a hand's width at the end, and stayed down."
   - success_at_cost: "{cast:champion} faltered, and {actor} paid for the opening with a cut to the leg."
   - near_miss: "{cast:champion} faltered once, and recovered before {actor} could use it."
   - failure: "{cast:champion} fought on as if the oath were true."
   - critical_failure: "{cast:champion} fought as if the oath were true, and harder for it."

## 12. Linear continuation

> Both fighters are cut and tiring. The court will give the farm to whoever makes the other yield. {cast:champion} has stopped saluting.

## 13. Aftermath Paragraph (per band)

- **critical_success:** "The court gives the farm back to {cast:claimant}'s family and writes the verdict into its rolls. Families from across the valley come to shake {actor}'s hand."
- **success:** "The court gives the farm back to {cast:claimant}'s family. The order's people pack their carts and leave {location} by evening."
- **success_at_cost:** "The court gives the farm back to {cast:claimant}'s family. {actor} watches the verdict read with a bandaged leg."
- **failure:** "The court gives the farm to the order. Its people stay on in {location} to hold it, and {cast:claimant}'s family packs a cart."
- **critical_failure:** "The court gives the farm to the order. {cast:claimant} tells the whole square that {actor} lost it."
- **fallback:** "The court reads its verdict, and the crowd leaves the square."

## 14. Aftermath Reaction Choices

Success side (fallback reactions, inherited by the three success bands):
- **Offer the beaten champion a hand** — "The mortal helps the order's champion up in front of the court. The champion will remember it." → `bond_change $cast:champion +0.12`.
- **Stand the square a feast** — "The mortal turns the verdict into a feast in the square, and the town keeps holiday." → `apply_condition trait.condition.location.festival on $here`.

Failure side (failure and critical_failure):
- **Help the family leave the farm** — "The mortal stays to load the family's cart. The family will remember who stayed." → `bond_change $cast:claimant +0.12`.
- **Ask the champion to explain the style** — "The mortal asks the order's champion how the style is won. What the champion says stays with the mortal." → `intelligence` (cultural_knowledge, "The Order's Style").

## 15. Aftermath Kit Summary (chips)

| Band | Chip | kind / category | stateNoun | Backing write |
|---|---|---|---|---|
| crit / success / s@c | Judged in the Square — "Fought under the god's eye — The thread to {actor} runs stronger." | growth / bond / gain | `thread` | step 2 success `thread_strengthen` |
| crit / success / s@c | A Champion's Due — "{cast:claimant} owes {actor} a favour now." | favor / bond / gain | `a favour owed` ($cast:claimant) | step 2 success `favor_creation` |
| crit / success / s@c | The Town's Regard — "{location} thinks well of {actor} now." | reputation / bond / gain | `reputation with {location}` ($here) | step 2 success +0.06 |
| failure | The Order Stays — "The order's men keep watch on {location} now." | trait / scar / loss | `Under Watch` (`trait.condition.location.under_watch`) | step 2 failure `apply_condition` |
| failure | Judged and Found Wanting — "The thread to {actor} runs thinner." | growth / bond / loss | `thread` | step 2 failure `thread_weaken` |
| failure | The Town's Regard — "{location} thinks less of {actor} now." | reputation / bond / loss | `reputation with {location}` | step 2 failure −0.06 |
| critical_failure | Lost Before the Valley — "{location} thinks less of {actor} now." | reputation / bond / loss | `reputation with {location}` | −0.02 (steps 0/1) or −0.06 (step 2) |

## 16. Support Bundle Contract

| Support object | Delivery | Source | Persistence | Future references | Status |
|---|---|---|---|---|---|
| `claimant` | lazy-materialize-on-trigger | reuse `merchant`/`trader`, spawn `merchant` "Wenna Coldridge", supportRole `duel_claimant` | must-persist | favour debtor; failure bond | live |
| `champion` | lazy-materialize-on-trigger | spawn `warrior_priest` "Corvin Ashe", supportRole `duel_order_champion` | must-persist | opposes cards; success bond | live |
| `$here` | the town | resolved location | n/a | standing edge, Under Watch, Festival | live |

## 17. Concept Art Direction

1. *Emotions:* a town holding its breath while heaven is asked to judge; a debt paid in blood instead of coin; the loneliness of a hired champion.
2. *Image:* dusk in an emptied market square. A ring of slack rope on posts around trampled straw; a single small round shield left lying face-down inside the ring; a court ribbon tied to one post, lifting in the wind. No people. Low gold light.

## 18. Trait hooks

1. Gate? None — an everyday board job.
2. Variant? `trait.reputation.iron.positive` +0.05 ("Being a Feared Champion, they have opponents fighting carefully.") · `trait.reputation.iron.negative` −0.04 ("Being known as a Brutal Thug, they have the square against them.").
3. Trait-only nudge? None — the variants carry the trait read.
4. Trait fragment? None.

## 19. Self-Audit

| Item | Verdict |
|---|---|
| Envelope + one opening per class | PASS (urban) |
| Opening ≤80 words | PASS (opening + step-0 spine ≈ 80) |
| Hand 4–8 composed, ≤2 specials, deal declared | PASS (2+3, 2+3, 1+4) |
| Every special has a failure-band fragment | PASS |
| All six StepOutcomes covered per step | PASS |
| No digits in effect lines; verb+noun names; no shared word name↔effect | PASS |
| Consequence hand wired (thread + place) | PASS |
| Chips backed per route | PASS (critical_failure carries only the standing chip, backed on all three routes) |
| Systems ≥3 | PASS (4) |
| Reactions for medium | PASS |

## 20. Experience Differentiator Gate

1 YES · 2 YES · 3 YES (farm, order, champion, crowd, oath, court all in the spines) · 4 YES · 5 YES · 6 YES · 7 YES · 8 YES · 9 YES (time vs memory; crowd vs footing; the oath alone on the last step) · 9b YES · 10 YES · 11 YES · 11b YES · 12 YES · 13 YES (magnanimity to the beaten vs celebration with the town; standing with the losers vs learning from the winner) · 14 YES.
