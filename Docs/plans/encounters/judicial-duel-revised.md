# Encounter Pipeline: The Judicial Duel
> Scale: medium | Slug: judicial-duel | Pass: revised
> Revisions applied: opening spine rebuilt (duel told once, the ask made explicit, mystery and open drills reconciled; 71 words); step-1 spine loses the unenforced "every old title can be challenged" promise and introduces the salute; step-2 spine no longer claims both fighters are cut (false on two step-1 bands) and states the champion's change plainly; step-2 afterimages stop telling the verdict the overview tells; four effect lines rewritten (no word shared with the card name; plainer mechanism); "Slow A Fighter" renamed "Slow Every Move"; eight band fragments de-echoed against their base text; three carryover lines de-echoed; critical_failure afterimage and overview made true on every route; failure overview no longer repeats the Under Watch chip or the reaction; thread chips lose their empty cause clause; one failure reaction relabelled.
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
| Stake (P3) | mystery (rolled): nobody in the town has seen the order's champion fight. |
| Opposition | faction (orders), rolled: a fighting order sent its champion to hold a farm it bought from a man who did not own it. The order is scene fiction (no faction node); its champion is the bound cast member. |
| Disposition | friendly (rolled): the order's champion drills in the open, where anyone can watch, and salutes the mortal like a friend before the bout. |
| Agent role | client who is owed (rolled): the family cannot pay a champion and offers a favour owed instead — made real by `favor_creation` (debtor `$cast:claimant`) on the final step's success. |
| Scale | region (rolled): families from across the valley come to watch, afraid their own old titles could be taken the same way. `scale: 'local'` (fixed). |
| System target | traits (rolled): two `traitVariants` on the Iron reputation pair. |
| Plot hook | rolled `hook.forbidden_knowledge_price`, `hook.monster_eradication`, `hook.swindled_family` · **taken `hook.swindled_family`**, blended with `hook.forbidden_knowledge_price`: the family was cheated of its farm by a false sale; the order's style is new to the town and can only be learned by watching. `monster_eradication` dropped (no monster on an everyday board). |
| Consequence hand (binding) | `thread` + `place`, no swap. **thread** — trial by combat is an appeal to heaven's verdict, so the god's thread to the champion is what the bout tests: `thread_strengthen` (`$ascendant` ↔ `$actor`) on step 2 success, `thread_weaken` on step 2 failure. **place** — what the verdict leaves true of the town: `apply_condition` `trait.condition.location.under_watch` on `$here` on step 2 failure (the order's men stay on to hold the farm and watch the town); on the success side the reaction *Stand the square a feast* writes `trait.condition.location.festival` on `$here`. |
| Standing | `reputation_with $here` +0.06 on step 2 success, −0.06 on step 2 failure; −0.02 on steps 0 and 1 failure (backs the critical_failure chip on every route — a critical failure at any step ends the action). |
| Favour | `favor_creation` debtor `$cast:claimant`, magnitude 0.4–0.6, on step 2 success: the agent's role made state. |
| Cast | `claimant` (the family's head, must-persist; reuse `merchant`/`trader`, spawn `merchant` "Wenna Coldridge") · `champion` (the order's champion, must-persist; spawn `warrior_priest` "Corvin Ashe"). |
| Systems | cast · rewards (thread, favour, conditions persist) · conditions · reputation = 4. |
| Mortal choice | None in the steps — this is a test. The stance lives in the aftermath reactions. |
| Cool failure | Nobody dies, nobody is jailed. The family loses the farm, the order holds it with men in the town, and the mortal is the champion who lost it in front of the valley. A master costs more: the family trusted the best they could find, and the critical_failure overview has the claimant say so to the whole square. |
| Cost channels | All specials priced in essence. No Heavy Hand, no rider, no grant. |

## 1. Inspiration Anchors

- **The Swindled Family** (taken hook, #204): a family cheated of everything by someone still nearby, asking for help it cannot pay for. Contributed the farm, the false sale by a cousin, and the favour owed in place of a fee.
- **The Forbidden Knowledge Price** (blended, thin): the answer can be found, and knowing it cannot be undone. Survives only as step 0 — the order's style is learned by watching, and the failure reaction *Ask the champion to explain the style* makes the knowledge a written record. No price is charged for knowing it.
- **Monster Eradication** (rolled, dropped): an everyday board admits no monster; nothing of it survives.
- Anti-patterns avoided: the rival as a villain (the champion is courteous and may believe the claim), the fight as a fight-system bout (the brief forbids it), the verdict as a choice the player makes (fate rolls the bout).

## 2. Scale Justification

Medium: three beats (watch, weather the rush, win), master rarity. The outcome touches one family's farm, one town's square and the families who came from across the valley to watch; a master is the right person to lose it. Medium means reaction choices are owed.

## 3. Pressure Knot

A fighting order bought the farm of the claimant's family from a cousin who never owned it, and has moved in. The court cannot untangle the deeds and has called a trial by combat. The order's champion has arrived and drills each morning. The bout is in the market square at the end of the week, whatever anyone does.

## 4. Intervention Fantasy

The god watches its mortal fight for someone else's land under a sky the whole town believes is judging. The hand reaches into time (a fighter's motions dragged a beat late), memory (the move a trained body repeats), the crowd (one loud voice), luck (loose ground at the wrong moment) and order (an oath sworn falsely, weighing on the one who swore it). None of it tells the mortal how to fight.

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
- **success_at_cost** — the farm stays, but the mortal leaves the bout with a deep cut to the leg, and the square saw how near it was. Same writes.
- **failure** — the mortal yields; the farm goes to the order, and the order's men stay in the town (Under Watch). Thread thinner, the town thinks less of the mortal.
- **critical_failure** — the mortal is beaten down in front of the valley (or misread the style and was sent away before the bout). The claimant blames them in front of the whole square. The town thinks less of them.

## 10. Sample Opening

Opening (urban): "{actor} arrives in {location} as the court calls a trial by combat."

Step 0 spine:

> A fighting order claims {cast:claimant}'s family farm. The order bought it from a cousin who never owned it.
>
> {cast:claimant} asks {actor} to be the family's champion. The family cannot pay, and offers a favour owed if the farm is saved. Nobody in {location} has seen the order's champion fight, but the champion drills each morning where anyone can watch.

(Opening + spine: 12 + 18 + 41 = 71 words, tokens counted as one word.)

## 11. The Hand Per Step

### Step 0 — Read the style (eye 0.72) · purpose "Read their style"
`deal: { count: 3, tags: ['insight', 'might'] }` · `failBehavior: continue_weakened`

**Afterimages**
- critical_success: "By the second morning they knew the style: a feint at the knee, then a cut at the head, every time."
- success: "They learned the style's main trick: a feint low, then a cut high."
- success_at_cost: "They learned the feint low and the cut high, but the champion saw them watching and changed the drill."
- failure: "They watched for three mornings and could not tell the feints from the real blows."
- critical_failure: "They read the style wrong and told {cast:claimant} it could be met head-on. {cast:claimant} sent them away and found another champion."

Failure metadata: `reputation_with $here −0.02`.

**Specials**
1. **Slow Every Move** — Boost (time) · essence 2 · Δ 0.10 · `generic.focus`
   effectLine: "Drag a fighter's motions a beat late, so anyone watching sees each one start."
   - critical_success: "Every drill ran slow, and {actor} could follow each blade from start to finish."
   - success: "The drills ran a beat slow, and {actor} saw where each cut began."
   - near_miss: "The drills ran slow for one morning, and the champion changed them the next."
   - failure: "The drills ran slow for a morning, but slow or fast, {actor} watched the wrong hand."
2. **Reveal Old Habits** — Whisper (mind) · essence 2 · Δ 0.08 · `generic.memory`
   effectLine: "Show the watcher the one move a trained body falls back on without thinking."
   - success: "{actor} saw the half-step back the champion takes before every cut."
   - success_at_cost: "{actor} saw the half-step back, the one habit the new drill could not hide."
   - failure: "{actor} saw a half-step back once, and took it for a stumble."
   - critical_failure: "{actor} saw a habit that was never there, and built a plan on it."

### Step 1 — Survive the first rush (iron 0.80) · purpose "Survive the first rush"
`deal: { count: 3, tags: ['might', 'social'] }` · `failBehavior: continue_weakened`

Spine:
> The market square is roped off and packed. Families have come from across the valley, afraid their own old titles could be taken the same way. {cast:champion}, the order's champion, salutes {actor} like a friend and swears before the court that the order's claim is true. Then the champion comes in fast.

Carryover lines (keyed on step 0):
- critical_success: "They know the feint before it comes." (for, +0.06)
- success: "They know how the style wins." (for, +0.04)
- success_at_cost: "The champion knows they were watching." (against, −0.02)
- near_miss: "They learned the style late." (against, −0.03)
- failure: "They do not know the style." (against, −0.05)
- critical_failure: (unreachable — a step-0 critical failure ends the action)

**Afterimages**
- critical_success: "They met the first rush and turned it, and {cast:champion} backed off bleeding."
- success: "They took the first rush on their guard and gave no ground."
- success_at_cost: "They held the first rush, and took a cut across the forearm doing it."
- failure: "The first rush drove them back to the rope, and the crowd groaned."
- critical_failure: "The first rush knocked the blade from their hand, and they yielded before the court."

Failure metadata: `reputation_with $here −0.02`.

**Specials**
1. **Rouse The Crowd** — Boost (spirit) · essence 2 · Δ 0.10 · `generic.crowd`
   effectLine: "Lift every onlooker into one loud voice for them, so it steadies them and rattles whoever they face."
   - critical_success: "The square roared {actor}'s name, and {cast:champion} looked at the crowd instead of the blade."
   - success: "The crowd shouted for the family's champion, and {actor} fought into the noise."
   - near_miss: "The crowd shouted for {actor}, then fell quiet when the champion pressed."
   - failure: "The crowd roared for {actor}, and {cast:champion} paid it no attention."
2. **Twist Their Footing** — Stumble (chaos) · essence 1 · Δ 0.08 · opposes `champion` · `generic.luck`
   effectLine: "Shift loose ground under an opponent at the worst moment, so the stroke they trust most goes wide."
   - success: "{cast:champion}'s heel slid on a loose cobble, and the cut went past {actor}'s shoulder."
   - success_at_cost: "{cast:champion} slipped and fell forward, and the falling blade caught {actor} on the way down."
   - failure: "{cast:champion} slipped, caught their balance, and came on harder."
   - critical_failure: "A loose cobble turned under {actor} instead."

### Step 2 — Win the bout (iron 0.84) · purpose "Win the bout"
`deal: { count: 4, tags: ['might', 'peril'] }` · `failBehavior: fail_action`

Spine:
> The bout goes on, and both fighters are tiring. The court will give the farm to whoever makes the other yield. {cast:champion} stops being polite and fights to win.

Carryover lines (keyed on step 1):
- critical_success: "{cast:champion} is bleeding and wary." (for, +0.06)
- success: "They are fresh and unhurt." (for, +0.04)
- success_at_cost: "They are fighting with a cut forearm." (against, −0.02)
- near_miss: "They held the rush, but only just." (against, −0.03)
- failure: "They are fighting with their back to the rope." (against, −0.05)
- critical_failure: (unreachable)

**Afterimages**
- critical_success: "{cast:champion} went down on one knee and yielded before the court."
- success: "{actor} pressed until {cast:champion} yielded."
- success_at_cost: "{cast:champion} yielded, and {actor} came out of the bout with a deep cut to the leg."
- failure: "{actor} was driven to the ground and yielded."
- critical_failure: "{actor} was beaten down and yielded in front of the whole valley."

Success metadata: `thread_strengthen ($ascendant, $actor)`, `favor_creation (debtor $cast:claimant, 0.4–0.6)`, `reputation_with $here +0.06`.
Failure metadata: `thread_weaken ($ascendant, $actor)`, `apply_condition trait.condition.location.under_watch on $here`, `reputation_with $here −0.06`.

**Special**
1. **Weigh A False Oath** — Undertow (order) · essence 3 · Δ 0.12 · opposes `champion` · `generic.oath`
   effectLine: "Make the liar carry what they swore before witnesses, so their arm drags when they need it most."
   - critical_success: "{cast:champion} faltered on the false oath and never found the rhythm again."
   - success: "{cast:champion}'s guard dropped at the end and did not come back up."
   - success_at_cost: "{cast:champion} faltered, and {actor} took the opening without guarding the leg."
   - near_miss: "{cast:champion} faltered once, and recovered before {actor} could use it."
   - failure: "{cast:champion} fought on as if the oath were true."
   - critical_failure: "{cast:champion} fought as if the oath were true, and harder for it."

## 12. Linear continuation

> The bout goes on, and both fighters are tiring. The court will give the farm to whoever makes the other yield. {cast:champion} stops being polite and fights to win.

## 13. Aftermath Paragraph (per band)

- **critical_success:** "The court gives the farm back to {cast:claimant}'s family and writes the verdict into its rolls. Families from across the valley come to shake {actor}'s hand."
- **success:** "The court gives the farm back to {cast:claimant}'s family. The order's people pack their carts and leave {location} by evening."
- **success_at_cost:** "The court gives the farm back to {cast:claimant}'s family, but the whole square saw how near the order came to winning."
- **failure:** "The court gives the farm to the order, and {cast:claimant}'s family must leave it."
- **critical_failure:** "The court gives the farm to the order. {cast:claimant} tells the whole square that the family trusted {actor}, and {actor} failed them."
- **fallback:** "The court reads its verdict, and the crowd leaves the square."

## 14. Aftermath Reaction Choices

Success side (fallback reactions, inherited by the three success bands):
- **Offer the beaten champion a hand** — "The mortal helps the order's champion up in front of the court. The champion will remember it." → `bond_change $cast:champion +0.12`.
- **Stand the square a feast** — "The mortal turns the verdict into a feast in the square, and the town takes a holiday." → `apply_condition trait.condition.location.festival on $here`.

Failure side (failure and critical_failure):
- **Load the family's cart** — "The mortal stays to help the family move out. The family will remember who stayed." → `bond_change $cast:claimant +0.12`.
- **Ask the champion to explain the style** — "The mortal asks the order's champion how the style is won, and keeps the answer." → `intelligence` (cultural_knowledge, "The Order's Style").

## 15. Aftermath Kit Summary (chips)

| Band | Chip | kind / category | stateNoun | Backing write |
|---|---|---|---|---|
| crit / success / s@c | Judged in the Square — "The god's thread to {actor} runs stronger." | growth / bond / gain | `thread` | step 2 success `thread_strengthen` |
| crit / success / s@c | A Champion's Due — "{cast:claimant} owes {actor} a favour now." | favor / bond / gain | `a favour owed` ($cast:claimant) | step 2 success `favor_creation` |
| crit / success / s@c | The Town's Regard — "{location} thinks well of {actor} now." | reputation / bond / gain | `reputation with {location}` ($here) | step 2 success +0.06 |
| failure | The Order Stays — "The order's men keep watch on {location} now." | trait / scar / loss | `Under Watch` (`trait.condition.location.under_watch`) | step 2 failure `apply_condition` |
| failure | Judged and Found Wanting — "The god's thread to {actor} runs thinner." | growth / bond / loss | `thread` | step 2 failure `thread_weaken` |
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
| Opening ≤80 words | PASS (opening + step-0 spine = 71) |
| Hand 4–8 composed, ≤2 specials, deal declared | PASS (2+3, 2+3, 1+4) |
| Every special has a failure-band fragment | PASS |
| All six StepOutcomes covered per step | PASS |
| No digits in effect lines; verb+noun names from the imperative lexicon; no word shared name↔effect | PASS (re-checked editorially, articles included) |
| Consequence hand wired (thread + place) | PASS |
| Chips backed per route | PASS (critical_failure carries only the standing chip, backed on all three routes) |
| Chip sentences ≤15 words, no four-word run shared with the band overview | PASS (longest 9) |
| Systems ≥3 | PASS (4) |
| Reactions for medium | PASS |

## 20. Experience Differentiator Gate

1 YES · 2 YES · 3 YES (farm, order, champion, crowd, oath, court all in the spines) · 4 YES · 4b YES (after editorial pass) · 5 YES · 6 YES · 7 YES · 8 YES · 9 YES (time vs memory; crowd vs footing; the oath alone on the last step) · 9b YES · 10 YES · 11 YES · 11b YES (after editorial pass) · 12 YES · 13 YES (magnanimity to the beaten vs celebration with the town; standing with the losers vs learning from the winner) · 14 YES.
