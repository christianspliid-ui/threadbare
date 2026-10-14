# Encounter Pipeline: The Poisoned Feast
> Scale: short | Slug: poisoned-feast | Pass: final
> Date: 2026-10-14 | Pipeline version: 2.0 (v3 line, master-everyday-2 slot 1, THR-1757)
> Status: **READY WITH CAVEATS**
> Matches `Docs/plans/encounters/poisoned-feast.package.json` as gated 2026-10-14 (the package is what ships).

---

## Pipeline Summary

| Pass | Verdict | Notes |
|---|---|---|
| Draft | Complete | Two Eye steps (0.74 → 0.80) reading a poisoned cup and the guests; secret + story_seed wired; seed by `query #rival_strike`. |
| Editorial | PASS WITH REVISIONS | Seven prose fixes: clearer P2, no seam echoes, step-1 spine no longer announces pass/fail, crit afterimage no longer names the payer, near-miss carryover no longer contradicts, four retelling cause clauses cut, failure overview disambiguated. |
| Systems | READY WITH CAVEATS | Every id resolves; seed resolves to The Hired Knives; hidden-mark label made true on every success band. C1 unchipped seed on the step-1 critical-failure path; C2 single-member family. |
| Package | PACKAGE PASS (connected) | PATH chip and seed labels now promise only what the sequel delivers. |

### Caveats / Blockers

- **C1** — a step-1 critical failure plants the seed, but the critical_failure band is shared with a step-0 critical failure that plants nothing, so the band carries no PATH chip. An omission, never a false chip.
- **C2** — `#rival_strike` has one member, The Hired Knives, whose spine gives its own reason ("a god's help was seen"). The parent now promises only "their people sent after {actor}". Follow-up: a planter-aware reason line in Hired Knives, or a second family member.
- **C3** — master difficulty: live proof from a seed sweep plus a pinned band; success-side rows on a failed run read as not exercised.

### Editorial Notes Summary

The sequel question: the old PATH chip ("Whoever paid for the poison has heard that {actor} lived") and old step-1 spine ("will hear that {actor} lived and knows") promised a patron who knows the master read the table. The only draw, The Hired Knives, delivers two hired strangers sent by an unnamed rival, never the feast. No better-fitting family or template exists. Reworded: the chip now reads "Whoever paid for the poison is sending their people after {actor}."

### Implementation File Map

Compiled set only (`compile:encounter` → `src/data/encounters/poisoned-feast.ts`, its structural test, both registrations). Optional art: `public/concept-art/encounters/poisoned-feast.jpg`.

---

## Encounter Packet

# Encounter Pipeline: The Poisoned Feast
> Scale: short | Slug: poisoned-feast | Pass: final (packet)
> Batch: master-everyday-2 (THR-1757), slot 1 — seeded sequel
> Template id: `encounter.town.poisoned_feast`

## 0. Mechanical design block (designed before the prose)

| Row | Answer |
|---|---|
| Crux | The cup poured for {actor} at the guild feast poisoned the guild-master instead, and the coroner wants {actor} to name whose hand did it, though {actor} is the likeliest suspect. |
| Title | *The Poisoned Feast* — a feast, a poisoning: the complication at a glance. |
| Shape | **Seeded Sequel** (placeless) on a two-step **Puzzle – Investigation – Resolution**. Step 0 reads the table (which cup, what poison). Step 1 reads the guests (whose hand). Step 1 success and step 1 failure both plant an `encounter_seed` by `query` `#rival_strike`: whoever paid for the poison hears that {actor} lived and comes for them. |
| Reach per step | Step 0 **eye 0.74**, step 1 **eye 0.80**. Mean 0.77, window fit 0.91 (master band). Both read *severe*. |
| Tier | `rarityTier: 2`, `scale: 'local'`, `intrinsicTier: 'shaping'` (brief, binding). |
| Settings | `urban` only (brief override of the rolled `sacred`; the rolled class survives as the abbey refectory the feast is held in). |
| Whose problem? | {actor}'s own: the poison was meant for them, and they are the likeliest suspect. The guild and the coroner are where the answer lives. |
| Why here? | `chance` — a guest at the guild feast when the guild-master drank from their cup; then `mission` — the coroner asks them to read the table. |
| Plot hook | Packet rolled `hook.forbidden_knowledge_price, hook.followed_on_the_road, hook.scarcity_crisis`. **Taken: `hook.followed_on_the_road`** — it is the sequel's whole shape: whoever paid for the poison learns the master lived and sends people after them (the `#rival_strike` family, whose one member, The Hired Knives, opens on two strangers who have followed the mortal for three days). `hook.forbidden_knowledge_price` survives as the cost of the win: surviving the cup and naming the hand is what brings the knives. `hook.scarcity_crisis` set aside (nothing is short at a feast). |
| Seed dice | p3 **choice** — naming a guest shames the guild; naming no one leaves {actor} under suspicion · opposition **own trait** — Vengeful (`trait.core.core_forgiveness.vice`, −0.05, unlocks the trait card) and Judgemental (`trait.personality.eye.vice`, −0.04); Keen-Eyed (`trait.mastery.keen-eyed`, +0.05) is the one variant for · disposition **open** — the coroner wants the master's reading · agentRole **the target** — the cup was theirs · scale **personal** (the master's life and name; the template field stays `local`). |
| Master stakes | Who sits across the table: the coroner and a guild that invited them. Failure is the name before the purse: {location} thinks less of a master who could not read a table laid for them, and the coroner's record names them as the likeliest hand on the worst ending. No death, jail or brand on {actor}. |
| Consequence hand (binding) | `secret` + `story_seed`. No swap. **secret** — `hidden_mark` (`secret_knowledge`) on `$actor` on step 1 success: {actor} knows who poisoned the cup; `favor_creation` (debtor `$cast:coroner`) on step 1 success: the coroner owes a favour for being spared a wrong ruling; `hidden_mark` (`concealed_action`) on `$cast:poisoner` on step 1 failure: the poisoner got away with it. **story_seed** — `encounter_seed` `query: { kind: 'encounter_template', tags: ['#rival_strike'] }`, `targetAgentId: '$actor'`, `delayTicks: 30`, on step 1 success **and** step 1 failure (the penalty family firing on failure: the patron learns the master lived either way). |
| Spine effect | `reputation_with` `$here`: +0.06 step 1 success, −0.06 step 1 failure, −0.03 step 0 failure (a step-0 critical failure ends the action, so the critical_failure SCAR needs its own backing write). |
| Mortal choice | None — this is a test. `motivations: ['revelation_discretion', 'mercy_ruthlessness']` — whether to bring a guildsman's name out, and how hard to come down on the hand that tried to kill them. |
| Trait hooks | Gate: none (everyday). Variant: Vengeful −0.05 (+ trait card), Judgemental −0.04, Keen-Eyed +0.05. Trait-only nudge: **Cool A Hot Grudge** (`requiredTrait: trait.core.core_forgiveness.vice`, cost 0) on step 1. Trait fragment: the trait card's own fragments. |
| Carryover | Step 1 carries `carryoverFactorLines` keyed on step 0's band (variance by construction). |
| Systems quota | cast (coroner, poisoner) · seeds (`#rival_strike`) · reputation — three, plus the favour and two hidden marks. |
| Heavy Hand | none (the batch's one belongs to slot 5). |
| Tags | none authored (no family word fits a one-off poisoning; the brief mints none). |
| Promise → payoff | "{actor} is also the likeliest suspect" → paid on every band (cleared, still suspected, or written down). "Whoever paid that guildsman will soon hear that {actor} is still alive" → the seed on both step-1 sides; the patron's people (The Hired Knives) find the master later. "one of them poisoned it" → paid in step 1's success afterimages (`{cast:poisoner}`). |
| Not colliding | Eye master: *The Forged Charter* (read two documents, name a forger). Eye experts: *The Boundary Survey*, *The Writ at the Toll Gate*. Here the evidence is a cup and the witnesses are the people who wanted the reader dead. Card types: Signature (matter) + Balm (life) / Signature (time) + Trait card — no sibling repeats it. |

## 1. Inspiration Anchors

- **`hook.followed_on_the_road`** — taken. It shaped the back of the encounter rather than the front: the feast is where the patron missed; the road is where the patron tries again.
- **`hook.forbidden_knowledge_price`** — blended in: the price of surviving and reading the table is being hunted for it.
- **The Forged Charter** (model) — package structure copied: two Eye steps, `continue_weakened` → `fail_action`, step-0 backing write for the critical_failure SCAR, a short-scale fallback with `byOutcome`. Not copied: its documents, its appointment, its card types.
- **False Coin at the Mint** — the own-trait opposition shape (a core trait read from the graph, a trait card at cost 0 that helps the mortal against their own trait).
- Anti-patterns avoided: the helpful passerby (the master is the target); failure as punishment (the master is talked about, not hurt); a Dark Lord (the patron is a rival with a purse, off stage).

## 2. Scale Justification

Short: two beats, one table, one hand to name. The long tail rides the seed — the patron's people find the master later, elsewhere.

## 3. Pressure Knot

Someone paid a guildsman to rub wolfsbane into the cup poured for {actor}. At the toast the guild-master took the wrong cup. The guild-master has not woken, the coroner has barred the doors, and the coroner gives a verdict at dawn.

## 4. Intervention Fantasy

The god works on the cups, the stricken body and the guests' memories: powder drawn to the bottom of a poisoned cup, a sick man eased awake long enough to speak, the last hour brought back to every guest, and — for a Vengeful master — the anger cooled long enough to look at every face.

## 5. Cast and World Objects

| Object | What | Delivery |
|---|---|---|
| `coroner` | The town coroner. Barred the doors, asks the master to read the table, gives the verdict. Named on both spines. Owes the favour on a win. | actor spec, lazy-materialize-on-trigger, must-persist; reuse `healer`; spawn `healer` "Maud Ashby". |
| `poisoner` | The guildsman who poisoned the cup. Named only after the roll (step 1 afterimages and fragments). Carries the concealed mark on a loss. | actor spec, lazy-materialize-on-trigger, must-persist; spawn-only (`merchant` "Hob Tanner") — a reused townsman would be cast as a poisoner. |
| The guild-master | Role noun only — the one who drank. | prose |
| The town (`$here`) | Carries the reputation. | resolved location |
| Hidden marks | `secret_knowledge` on `$actor` (win); `concealed_action` on `$cast:poisoner` (loss). | step 1 effects |
| Favour | `owes_favor` debtor coroner → creditor actor (win). | step 1 `favor_creation` |
| Seed | `#rival_strike` — the patron's people. | step 1 `encounter_seed` (both sides) |

## 6. Beat Structure

1. **Read the poisoned cup** (eye 0.74, `continue_weakened`) — which cup, what poison, when it went in. Success: wolfsbane rubbed inside {actor}'s cup before the wine was poured. Failure: they cannot say. Critical failure: they name the guild-master's own cup, and the coroner writes down that {actor} sat closest to it — ends it.
2. **Name the poisoner** (eye 0.80, `fail_action`) — which of six guildsmen within reach did it. Success: `{cast:poisoner}` placed behind {actor}'s chair; favour, secret, regard, seed. Failure: no hand named; regard lost, seed, the poisoner's concealed mark. Critical failure: the wrong guildsman named, and the coroner writes {actor}'s name down instead.

## 7. Branching Profile

Linear — no branching. Branch count 0.

## 8. Branching Map

N/A — linear encounter.

## 9. Outcome Ladder

| Band | Progress | Spent | Opening / burden |
|---|---|---|---|
| critical_success | Poison and hand found; the poisoner confesses to being paid, but will not name the payer | the night | regard; favour; the secret; the patron's people coming |
| success | The hand named by a witness | the night | regard; favour; the secret; the patron's people coming |
| success_at_cost | The hand named, but the guild closes ranks against the master | the guild's goodwill | regard; favour; the secret; the patron's people coming |
| failure | No hand named | the master's name | regard lost; the patron's people coming |
| critical_failure | The wrong cup or the wrong guildsman named; the coroner's record names {actor} | the master's name | regard lost |

## 9b. Stakes Line

```
goal:      name the hand that poisoned the cup
risk:      be written down as the likeliest poisoner
won:       named the hand that poisoned the cup
lost:      could not say whose hand poisoned the cup
lostBadly: was written down as the likeliest poisoner
```

Description: "At a guild feast in the abbey refectory, the guild-master drank from a guest's cup and fell. The coroner wants the poisoner named by dawn, and the guest whose cup it was is the likeliest suspect."

## 10. Sample Opening (narrator mode)

**P1 (urban):** {actor} is a guest at the high table of the guild feast in {location}, held in the abbey refectory.

**Spine (step 0), P2:** At the toast the guild-master drank from {actor}'s cup, fell, and has not woken. {cast:coroner}, the town coroner, has barred the doors.

**Spine (step 0), P3:** The poison was meant for {actor}, and {actor} is also the likeliest suspect. {cast:coroner} asks {actor} to read the table before ruling. Naming a guest will shame the guild. Naming no one leaves {actor} under suspicion.

Word count: under 80 by the gate after the critic rewrite (same P2 length, one word fewer).

## 11. The Hand Per Step

### Step 0 — Read the poisoned cup (eye 0.74)

`deal: { count: 3, tags: ['insight', 'lore'] }` + 2 specials → composed 5.

| id | Name | Type (code comment) | Sphere | Cost | Δ | imageTag | effectLine |
|---|---|---|---|---|---|---|---|
| `feast.settle_the_dregs` | Settle The Dregs | Signature (matter) — one-off | matter | 2 | 0.11 | generic.matter | Pull every powder in the cups down to the bottom, so a poisoned cup shows a dark ring. |
| `feast.rouse_the_stricken` | Rouse The Stricken | Balm (life) — one-off | life | 2 | 0.10 | generic.vigor | Ease the poison in a sick body, so the poisoned can wake long enough to speak. |

Band fragments:

- **Settle The Dregs** — critical_success: "A dark ring rose in {actor}'s cup, and every other cup on the table stayed clear." · success: "A dark ring settled at the bottom of {actor}'s cup." · near_miss: "A faint ring showed in {actor}'s cup, too faint to show {cast:coroner}." · failure: "Every cup on the table showed a dark ring, from the dregs of the red wine."
- **Rouse The Stricken** — success_at_cost: "The guild-master woke long enough to say the wine tasted bitter, then slept again." · failure: "The guild-master stirred but did not wake." · critical_failure: "The guild-master woke, looked at {actor}, and said {actor} had poured the wine."

### Step 1 — Name the poisoner (eye 0.80)

`deal: { count: 3, tags: ['insight', 'social'] }` + 2 specials (one trait-gated) → composed 4–5.

| id | Name | Type (code comment) | Sphere | Cost | Δ | imageTag | effectLine |
|---|---|---|---|---|---|---|---|
| `feast.show_the_last_hour` | Show The Last Hour | Signature (time) — one-off | time | 2 | 0.12 | generic.memory | Bring back to every guest's mind who stood behind which chair while the wine was poured. |
| `feast.cool_a_hot_grudge` | Cool A Hot Grudge | Trait card (`card.trait_card.core`), `requiredTrait: trait.core.core_forgiveness.vice` | — | 0 | 0.07 | generic.mercy | Calm the anger they carry, so they weigh every face before naming one. |

Band fragments:

- **Show The Last Hour** — critical_success: "Every guest remembered the same thing: {cast:poisoner} leaning over {actor}'s cup before the toast." · success: "Two more guests remembered it once the hour came back to them." · success_at_cost: "The guests remembered {cast:poisoner} at {actor}'s chair, and the guild began to quarrel over it." · near_miss: "One guest remembered a hand near {actor}'s cup, but not whose it was." · failure: "The hour came back to every guest, and each one blamed a different neighbour." · critical_failure: "The guests remembered the hour, and three of them remembered {actor} beside the guild-master's cup."
- **Cool A Hot Grudge** — critical_success: "{actor} passed over the first guest they wanted to blame, and found the true hand next." · failure: "{actor} wanted one guest blamed so badly that the others stopped answering questions."

Spheres across specials: matter, life, time (+ the trait card, sphere-less). The deal supplies the rest and the common option. No rider. No grant. Trait card at cost 0.

## 12. Linear continuation (step 1 spine)

Six guildsmen sat within reach of that cup, and one of them poisoned it. Whoever paid that guildsman will soon hear that {actor} is still alive.

{cast:coroner} gives the verdict at dawn. If no hand is named by then, {location} will take {actor} for the poisoner.

### Carryover (step 1, keyed on step 0's band)

- critical_success: "One guest's sleeve carries a smear of the poison." (for, +0.06)
- success: "They know what the poison was and when it went in." (for, +0.04)
- success_at_cost: "The guests have had a night to agree their stories." (against, −0.02)
- near_miss: "They know the poison, but cannot yet prove it." (against, −0.02)
- failure: "They do not know what was in the cup." (against, −0.05)

### Afterimages

Step 0:
- critical_success: Within the hour they showed {cast:coroner} the wolfsbane rubbed inside {actor}'s cup, and a smear of it on one guest's sleeve.
- success: The poison was wolfsbane, rubbed inside {actor}'s cup before the wine was poured.
- success_at_cost: They found the wolfsbane in {actor}'s cup, but {cast:coroner} had sent the guests home for the night first.
- failure: They could not tell what poison was in the cup, or when it went in.
- critical_failure: They named the guild-master's own cup as the poisoned one, and {cast:coroner} wrote down that {actor} sat closest to it.

Step 1:
- critical_success: {cast:poisoner} broke down before the whole hall and confessed to being paid, but was too afraid to say by whom.
- success: The cup-bearer had seen {cast:poisoner} at {actor}'s chair with a hand over the cup.
- success_at_cost: {actor} named {cast:poisoner}, but the guild closed ranks and swore {cast:poisoner} never left the bench.
- failure: The guests' accounts of who sat where did not agree, and {actor} could not say whose hand poisoned the cup.
- critical_failure: {actor} named the wrong guildsman, and five guests swore that guildsman never left the bench. {cast:coroner} wrote {actor}'s name down instead.

## 13. Aftermath Paragraph (per band)

- **fallback:** The coroner's inquest at the guild feast in {location} is closed.
- **critical_success:** {cast:coroner} ruled the guild-master poisoned by {cast:poisoner}, and the guild-master is awake and mending.
- **success:** {cast:coroner} ruled that {cast:poisoner} poisoned the cup, and {actor} leaves the inquest cleared.
- **success_at_cost:** {cast:coroner} ruled for {actor}, but the guild has not forgiven the master who named one of its own.
- **failure:** {cast:coroner} closed the inquest with no hand named, and half the guild believes {actor} poured the cup.
- **critical_failure:** {cast:coroner}'s record names {actor} as the likeliest hand, and the guild believes it.

## 14. Aftermath Reaction Choices

No reaction choices — consequence is clean (short scale; the forward thread is the patron's people, who find the master on their own).

## 15. Aftermath Kit Summary

| Band | scar | bond | boon | path |
|---|---|---|---|---|
| critical_success | — | reputation with {location} (gain) · a favour owed | — | seed |
| success | — | reputation with {location} (gain) · a favour owed | — | seed |
| success_at_cost | — | reputation with {location} (gain) · a favour owed | — | seed |
| failure | reputation with {location} (loss) | — | — | seed |
| critical_failure | reputation with {location} (loss) | — | — | — |

Chip text (cause — detail):
- bond regard (success side): title "Read true" · no cause (the overview carries it) · detail "{location} thinks well of {actor}." (5)
- bond favour (success side): title "A favour owed" · cause "Spared a wrong ruling" · detail "{cast:coroner} owes {actor} a favour." (4 + 5 = 9)
- path (success side + failure): title "The one who paid" · detail "Whoever paid for the poison is sending their people after {actor}." (11)
- scar (failure): title "Under suspicion" · no cause (the overview carries it) · detail "{location} thinks less of {actor}." (5)
- scar (critical_failure): title "Misread" · cause "Before the whole guild" · detail "{location} thinks less of {actor}." (3 + 5 = 8)

The two hidden marks are concealed by design and carry no chip.

Seed labels (verbatim, both sides): "Whoever paid for the poison at the guild feast knows {actor} lived, and sends their people."

Hidden-mark labels (verbatim): success, on `$actor` — "Knows who poisoned the cup at the guild feast" · failure, on `$cast:poisoner` — "Poisoned a master's cup at the guild feast and was not named". Favour context: "Spared the coroner a wrong ruling at the guild feast".

Gate: `check:encounter --package` — `✓ encounter.town.poisoned_feast [systems: cast, rewards, seeds, reputation, content_query]`, 0 warnings.

## 16. Support Bundle Contract

| Support object | Delivery | Source | Persistence | Future references | Status |
|---|---|---|---|---|---|
| `coroner` | lazy-materialize-on-trigger | reuse healer, else spawn healer "Maud Ashby" | must-persist | favour debtor; both spines; chips | ready |
| `poisoner` | lazy-materialize-on-trigger | spawn merchant "Hob Tanner" | must-persist | step 1 afterimages and fragments; concealed mark | ready |

## 17. Concept Art Direction

1. *Emotions:* a celebration turned to suspicion; the nearness of a death meant for you; a room of people who all might have done it.
2. *Evocative image:* a long feast table after everyone has left — benches pushed back, one silver cup on its side with a dark ring at the bottom, a spilled red stain running toward the table's edge, a single candle burned low. No people.

## 18. Self-Audit

| Item | Verdict |
|---|---|
| Opening ≤80 words | PASS (under 80 by the gate) |
| Hand 4–8 composed, ≤2 specials + deal | PASS |
| ≥4 spheres, ≥1 common | PASS by the dealer (matter, life / time + deal) |
| Every nudge has a failure fragment; no big-delta | PASS (max Δ 0.12) |
| Six StepOutcomes per step | PASS — step 0: CS/S/NM/F (Settle) + SAC/F/CF (Rouse); step 1: all six on Show The Last Hour |
| Consequence hand wired | PASS — secret (hidden_mark ×2, favor_creation), story_seed (`#rival_strike` seed) |
| Law 56 per chip | PASS — reputation (step 1 ±, step 0 −), favour (step 1 success), seed (step 1 success + failure) |
| Prose rule 7 | PASS — "a guest at the high table" is scene-local; no prior history asserted |
| Prose rule 7b | PASS — "Whoever paid that guildsman will soon hear" rides a placeless seed planted on both step-1 sides whose truthful shape is that the other party finds them; no place or time promised |
| Steps within 0.72–0.85 | PASS (0.74, 0.80) |
| Over-exposed cards | PASS — no `card.boost.core` special, no energy signature, no darkness undertow |

## 19. The narrator's 12 questions

1. P1 arrival with graph names — `{actor}` is a guest at the guild feast in `{location}`.
2. P2 events with costs paid — at the toast the guild-master drank from {actor}'s cup, fell and has not woken; the doors are barred.
3. P3 one stake — choice: naming a guest shames the guild; naming no one leaves {actor} under suspicion.
4. ≤80 words — under 80 by the gate.
5. Read aloud as a report — yes.
6. Stated, never encoded — "The poison was meant for {actor}", "{actor} is also the likeliest suspect".
7. Every sentence works — the poisoning, the coroner, the double bind, the ask, the two costs.
8. Nothing unintroduced — cups, the guild-master, the coroner precede step 0's cards; the six guildsmen and the chairs precede step 1's.
9. One named person per beat — `{cast:coroner}`; the poisoner named only after the roll.
10. Stake in a sentence — "Can {actor} name who poisoned the cup meant for them before the coroner rules, and keep their name?"
11. Cards verb+noun, spell-style — Settle The Dregs, Rouse The Stricken, Show The Last Hour, Cool A Hot Grudge; no effect line repeats a word of its name.
12. Opening per class — `urban`, written.

## Experience Differentiator Gate

1 YES · 2 YES · 3 YES · 4 YES · 5 YES · 6 YES · 7 YES · 8 YES (cups, the stricken guild-master, the guests' memories, the mortal's own anger) · 9 YES · 9b YES · 10 YES · 11 YES · 11b YES · 12 N/A (short) · 13 N/A (short) · 14 YES.
