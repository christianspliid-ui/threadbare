# Encounter Pipeline: The Tourney Marshal
> Scale: short | Slug: tourney-marshal | Pass: draft
> Date: 2026-10-14 | Pipeline version: 2.0
> Batch: master-everyday-2 (THR-1757), slot 4 · templateId `encounter.town.tourney_marshal`

## 0. Mechanical design block (designed before the prose)

| Row | Decision |
|---|---|
| Crux | The agent is marshal of a town's tourney, and a knightly order's grudge bout against a young noble who will not yield is about to become a killing. |
| Title states the crux | *The Tourney Marshal* — the job is the stake. |
| Whose problem? | The agent's: the town made them marshal, and a death in the lists is the marshal's failure. Scene-local; no prior tie to any graph agent asserted (prose rule 7). |
| Reach = theme | Step 0 iron 0.76: holding the lists by force against two sides' men and a falling sword. Step 1 iron 0.80: facing an armed champion across the barrier and making the sword come down. |
| Shape | Danger → Confrontation → Aftermath (brief override of the rolled *appointment*). Linear, branch count 0. Step 0 `continue_weakened` (a step-0 critical_failure ends the action), step 1 `fail_action` with carryover lines keyed on step 0. Mean 0.78. |
| Catalog picks | setting urban (rolled *rural* survives as the tourney field outside the walls) · pressure threat · form contest · objective protect · stakes a life and the marshal's name · system traits (variants). |
| Fight system | None. The bout is fiction; the two tests are nudge-resolved Iron steps. No fight, confront, monster or rank gate. |
| Opposition | A faction's doctrine (rolled): the order's rule that a grudge bout ends only at a yield. The order is scene fiction; its champion is cast. |
| Disposition / role | hostile (the champion) · competitor (rolled) read as the marshal's authority against the order's doctrine. |
| Consequence hand (binding) | **condition + secret**, no swap. `condition`: `apply_condition trait.condition.location.festival` on `$here` (step 1 success — the town keeps the last day as a feast); `apply_condition trait.condition.location.under_watch` on `$here` (step 1 failure — the order's knights stay on in the town). `secret`: `favor_creation`, debtor `$cast:heir`, on step 1 success (the house owes the marshal). |
| Standing | `reputation_with $here` +0.06 / -0.06 on step 1; -0.02 on step 0 failure. `bond_change $cast:heir` -0.10/-0.12 on step 1 failure, -0.04/-0.05 on step 0 failure (backs the critical_failure chips on both routes). |
| Cost channels | All four specials essence-priced. No Heavy Hand, no rider special, no grant. |
| Cool failure | The mortal is not hurt past a cut, jailed or branded. The young noble is maimed or nearly killed; the master's name is spent before the town that made them marshal. |
| Trait hooks | Gate none · Variant Brave (`trait.personality.iron.virtue`) +0.04, Brutal Thug (`trait.reputation.iron.negative`) -0.04 · trait-only nudge none · trait fragment none. |
| Systems quota | cast + rewards (favour, conditions) + conditions + reputation — four. |
| Hook | `plotHookTaken: hook.siege_and_hold` (see § 1). |

plotHookRolled: hook.monster_eradication, hook.siege_and_hold, hook.rebuilding_trust
plotHookTaken:  hook.siege_and_hold — a position (the lists) held against a force that can afford to wait (an order whose doctrine accepts no end but a yield). rebuilding_trust is blended thinly through the success-side reactions (which house trusts the marshal after). monster_eradication dropped: no monster on an everyday board.

## 1. Inspiration Anchors

- **Model package `judicial-duel`** (iron, master batch 1): structure copied — two-cast bundle (a person at stake, an order champion), location condition on failure, favour on success, town regard on both sides. Verb not copied: there the master *fights* the bout; here the master is the referee who must *stop* one.
- **Model package `cathedral-loan`**: danger → confrontation → aftermath shape, step-0 critical_failure ending the action, the critical_failure page backed by step-0 writes.
- **Iron experts read** (`wolf-winter-watch`, `fair-bout`): a watch held through a night, and a purse bout answered at a ring. This encounter's verb — marshal a bout and keep it from killing — repeats neither.
- **Hook** `hook.siege_and_hold`: the lists are the position, and the doctrine is the force that can wait.
- Anti-patterns avoided: the agent as a witness (they are the marshal with the duty); a rule gate (none); a monster read of the rolled hook (dropped).

## 2. Scale Justification

Short, two beats. A master marshal is one sharp job on a set day: the danger (the bout turns) and the confrontation (the champion refuses to stop). The stakes are local — one life, one house's favour, one town's regard — so `scale: 'local'`, rarity 2, `intrinsicTier: 'shaping'`.

## 3. Pressure Knot

A knightly order has called a grudge bout against a young noble who insulted it. The order's doctrine says such a bout ends only when one fighter yields, and the young noble has sworn not to. By the third pass the noble is down and the order's champion is standing over them with a raised sword, while both sides' men are climbing the barrier.

## 4. Intervention Fantasy

The god backs a marshal who has to stand between two armed parties and a falling sword, and then out-face a champion who believes doctrine outranks the marshal's word. The god's cards work the timbers, the sword's swing, the weight of a command, and the champion's tiring arm.

## 5. Cast and World Objects

| Object | Role |
|---|---|
| `{cast:heir}` — Aldric Fenmoor (spawn `noble`) | The young noble in the bout; debtor of the favour; bond target on failure |
| `{cast:champion}` — Brannoc Vell (spawn `warrior_priest`) | The order's champion; `opposes` target; bond target in reactions |
| `$here` | Festival (success) or Under Watch (failure); reputation both ways |
| The order | Scene fiction. No faction surface touched |
| The barrier, the marshal's staff, the heralds | Scene fiction, introduced in the spines before any card acts on them |

## 6. Beat Structure

1. **Hold the lists** (iron 0.76, `continue_weakened`). The bout turns; the marshal must get between the fighters and turn both sides' men back from the barrier.
2. **Stand the champion down** (iron 0.80, `fail_action`). The champion will not leave without a yield; the marshal must make the sword come down.

## 7. Branching Profile

Linear — no branching. Branch count 0.

## 8. Branching Map

N/A — linear encounter.

## 9. Outcome Ladder

| Band | Progress | Spent | New burden / opening |
|---|---|---|---|
| critical_success | Both sides accept the marshal's ruling before the field | — | Favour from the house, Festival on the town, town regard up |
| success | The bout is called ended; the young noble goes home alive | — | Same three |
| success_at_cost | The bout is ended | The marshal's hand is cut; the order denounces the ruling | Same three; the order's grudge in prose |
| failure | The champion beats the young noble down | The house's trust, the town's regard | Under Watch on the town; the noble will not walk unaided again |
| critical_failure | The young noble is carried off more dead than alive | The house's trust, the town's regard | The house blames the marshal to the town |

## 9b. Stakes Line

```
goal:      stop a grudge bout before it becomes a killing
risk:      see a young noble carried off more dead than alive
won:       stopped a grudge bout before it became a killing
lost:      could not stop the champion maiming a young noble
lostBadly: saw a young noble carried off more dead than alive
```

description: "A knightly order is fighting a grudge bout against a young noble who will not yield. The tourney's marshal has to hold the lists and make the order's champion lower the sword before the bout ends in a killing."

## 10. Sample Opening (urban) + step-0 spine

> {actor} arrives in {location} as marshal of the town's tourney.
>
> A knightly order has called a grudge bout against {cast:heir}, a young noble who insulted it. The order's doctrine says the bout ends only when one fighter yields. {cast:heir} will not yield.
>
> On the third pass {cast:heir} is knocked down. The order's champion raises a sword over the young noble, and both sides' men climb the barrier. {actor} has to hold the lists before the bout becomes a killing.

## 11. The Hand Per Step

### Step 0 — Hold the lists (iron 0.76) · deal `{ count: 3, tags: [might, peril] }`

| id | type | name | sphere | cost | Δ | opposes | imageTag |
|---|---|---|---|---|---|---|---|
| `tourney.brace_the_barrier` | Signature (force) | Brace The Barrier | force | 2 | 0.10 | — | generic.ward |
| `tourney.stay_the_blade` | Signature (time) | Stay The Blade | time | 1 | 0.08 | champion | generic.blade |

- **Brace The Barrier** — *Set a wooden fence fast against any weight, so no crowd can push it over or climb it.*
  - critical_success: The barrier did not move under a single boot, and the men on it climbed back down.
  - success: The barrier held under the climbing men, and {actor} had time to reach the fighters.
  - near_miss: The barrier held at one end and sagged at the other, and a few men got over.
  - failure: The barrier held, so the house's men ran round the end of it instead.
- **Stay The Blade** — *Hold a raised weapon a breath longer at the top of its swing, so there is time to get under it.*
  - success: The champion's sword hung at the top of its swing, and {actor} got under it.
  - success_at_cost: The sword hung for a breath, then came down hard on the staff {actor} raised against it.
  - failure: The sword hung for a breath, and {actor} was still too far away to use it.
  - critical_failure: The sword hung for a breath, and in that breath the house's men reached the champion first.

Fill: three dealt cards on might / peril. Composed hand 5.

### Step 1 — Stand the champion down (iron 0.80) · deal `{ count: 3, tags: [might, presence] }`

| id | type | name | sphere | cost | Δ | opposes | imageTag |
|---|---|---|---|---|---|---|---|
| `tourney.give_the_word_weight` | Favor-shaped Signature (order) | Give The Word Weight | order | 2 | 0.12 | champion | generic.oath |
| `tourney.weary_the_sword_arm` | Stumble-shaped Signature (entropy) | Weary The Sword Arm | entropy | 1 | 0.08 | champion | generic.decay |

- **Give The Word Weight** — *Make a marshal's command carry the force of law, so sworn fighters feel bound to obey it.*
  - critical_success: {cast:champion} heard the marshal's command as law, and set the sword point-down in the sand.
  - success: {cast:champion} stopped at the marshal's command, as a sworn knight stops for a herald.
  - success_at_cost: {cast:champion} stopped at the command, but swung once more before stopping.
  - near_miss: {cast:champion} stopped at the command, then said the doctrine stood above it.
  - failure: {cast:champion} heard the command, and said only the order's grand master could give one.
  - critical_failure: {cast:champion} took the command as a challenge, and struck harder to prove the doctrine.
- **Weary The Sword Arm** — *Drain a fighter's last strength, so the weapon they hold sinks lower with every breath.*
  - success: {cast:champion}'s sword sank lower with each breath, and {actor} stepped inside its reach.
  - success_at_cost: {cast:champion}'s arm gave out, and the falling sword caught {actor} across the hand.
  - failure: {cast:champion}'s arm tired, and the champion moved the sword to the other hand.
  - critical_failure: {cast:champion}'s arm tired, so the champion drove at {cast:heir} to end it quickly.

Fill: three dealt cards on might / presence. Composed hand 5.

## 12. Linear continuation (step-1 spine)

> {cast:champion}, the order's champion, faces {actor} across the barrier. The champion will not leave the lists without a yield, and the young noble will still not give one. The order says its doctrine stands above any marshal's word. If {actor} cannot make the champion lower the sword, the young noble will be maimed in front of the whole town, and the town will blame its marshal.

Afterimages, step 0:
- critical_success: They threw the marshal's staff between the fighters and stopped the sword, and both sides' men stepped back off the barrier.
- success: They got between the fighters and turned both sides' men back from the barrier.
- success_at_cost: They turned the men back from the barrier, but the sword came down on {cast:heir}'s shield arm first.
- failure: The house's men got over the barrier, and {actor} had to drive them out before reaching the fighters.
- critical_failure: Both sides' men broke into the lists, and {cast:heir} was trampled in the brawl before {actor} could get there.

Afterimages, step 1:
- critical_success: {cast:champion} lowered the sword, and the order agreed before the whole field to call the bout ended.
- success: {cast:champion} lowered the sword, and the heralds called the bout ended.
- success_at_cost: {cast:champion} lowered the sword, but {actor} took a cut across the hand catching the last stroke.
- failure: {cast:champion} pushed past {actor} and beat the young noble down until the house's men dragged them away.
- critical_failure: {cast:champion} pushed {actor} aside, and the young noble was carried off the field more dead than alive.

Carryover lines on step 1 (keyed on step 0):
- critical_success (for, +0.06): The marshal has already stopped the champion's sword once.
- success (for, +0.04): Both sides' men are back behind the barrier.
- success_at_cost (against, -0.02): The young noble is hurt and cannot stand.
- near_miss (against, -0.03): A few of the house's men are still in the lists.
- failure (against, -0.05): The marshal is tired from driving the house's men out.

## 13. Aftermath Paragraph

Fallback: "The heralds close the lists, and the crowd goes back through the town gate."

## 14. Aftermath Reaction Choices

Success side (critical_success / success / success_at_cost):
- **Give the order its honour** — announce that the champion lowered the sword at the marshal's word. The champion remembers it; the young noble's house does not like it. (`bond_change` champion +0.10; heir -0.05)
- **Call the bout a draw** — announce that neither fighter yielded and neither lost. The house thinks better of the marshal; the champion takes it as a slight. (`bond_change` heir +0.08; champion -0.06)

Failure side (failure / critical_failure):
- **Carry the young noble to the healers** — stay with the house to the end. (`bond_change` heir +0.10)
- **Ask the champion about the doctrine** — learn what the order holds to. (`intelligence` cultural_knowledge, *The Order's Doctrine*)

## 15. Aftermath Kit Summary (pages)

**critical_success** — Overview: "The order and {cast:heir}'s house both accepted the marshal's ruling before the whole field, and both fighters walked out of the lists."
- BOND · a favour owed — A House in Debt — {cast:heir} owes {actor} a favour now.
- BOON · Festival — A Feast for the Field — {location} keeps the tourney's last day as a feast.
- BOON · reputation with {location} — The Town's Regard — {location} thinks well of {actor} now.

**success** — Overview: "{cast:heir}'s house carried the young noble home on a litter, bruised and alive. The order's knights rode out of {location} by evening."
- same three chips.

**success_at_cost** — Overview: "The bout is ended and the young noble is alive. {actor} walked out of the lists with a cut hand, while the order's knights told the crowd the marshal had broken their doctrine."
- same three chips.

**failure** — Overview: "The young noble lives, but will not walk without a stick again. A master is sent for to stop exactly this, and {location} saw {actor} fail to."
- SCAR · Under Watch — The Order Stays — The order's knights keep watch on {location} now.
- SCAR · reputation with {location} — The Town's Regard — {location} thinks less of {actor} now.
- BOND · reputation with {target} ($cast:heir) — The House's Trust — {cast:heir} trusts {actor} less.

**critical_failure** — Overview: "{cast:heir} was carried off the field more dead than alive. The young noble's house told the whole town that its marshal could not keep the lists."
- SCAR · reputation with {location} — Lost Before the Town — {location} thinks less of {actor} now.
- BOND · reputation with {target} ($cast:heir) — The House's Trust — {cast:heir} trusts {actor} less.

## 16. Support Bundle Contract

| Object | Delivery | Source | Persistence | Future refs | Status |
|---|---|---|---|---|---|
| heir (Aldric Fenmoor) | lazy-materialize-on-trigger | reuse `noble`, spawn `noble` | must-persist | favour debtor, bond target | ready |
| champion (Brannoc Vell) | lazy-materialize-on-trigger | spawn `warrior_priest` | must-persist | reaction bond target | ready |

## 7. Images

Card art: generic library rows (`generic.ward`, `generic.blade`, `generic.oath`, `generic.decay`).
Scene art direction (two-question method):
1. Emotions: duty held against a crowd's blood-hunger; a near-killing averted or not; a young life put at the mercy of a rule.
2. Image: an empty tourney field at dusk — a snapped marshal's staff lying in trampled sand at the foot of a leaning barrier, a single dropped gauntlet, pennants hanging slack. No people. Residue, not the bout.

## 17. Self-Audit

| Check | Verdict |
|---|---|
| Brief row: id, reach iron, steps 0.76 / 0.80, urban, rarity 2, local, shaping | PASS |
| Consequence hand condition + secret wired in context | PASS (festival/under_watch on `$here`, favour from `$cast:heir`) |
| No rule gate, no fight/confront/monster | PASS |
| Hands: 2 specials + deal fill per step, ≥1 failure fragment each, six bands covered per step | PASS |
| No card.boost.core special; no over-exposed card | PASS |
| Every chip backed by a write on its band; crit-fail chips backed on both routes | PASS |
| Opening + step-0 spine ≤80 words | PASS (79) |
| Never gender a bound cast member | PASS ("young noble", no pronouns) |
| Support bundle class-honest at urban | PASS (spawn fallback at town tier, where `noble` is not seeded) |
| Prose rule 7 / 7b | PASS — no history asserted, no future place promised |

## Experience Differentiator Gate

1 YES · 2 YES · 3 YES (barrier, sword, men, command, champion's arm all in the spines) · 4 YES · 5 YES · 6 YES · 7 YES · 8 YES · 9 YES (timbers / swing timing / command / stamina) · 9b YES · 10 YES · 11 YES · 11b YES (see pages above) · 12 YES · 13 YES (honour the order vs protect the house; stay with the house vs learn the doctrine) · 14 YES.

## The narrator's 12 questions

1. P1 arrival? `{actor}` arrives in `{location}` as marshal of the town's tourney.
2. P2 events? The order has called a grudge bout; its doctrine says it ends only at a yield; the noble will not yield.
3. P3 one stake? Threat: hold the lists before the bout becomes a killing.
4. ≤80 words? 79.
5. Read aloud? Every sentence is a report.
6. Stated? The doctrine, the refusal and the danger are stated.
7. Every sentence works? Challenge, test or outcome.
8. Nothing unintroduced? Barrier, sword, both sides' men in the step-0 spine; the command and the champion in step 1's.
9. One named person? Step 0 `{cast:heir}`; step 1 `{cast:champion}`.
10. Stake in a sentence? Can the marshal stop a grudge bout before the order's champion kills a young noble who will not yield?
11. Cards verb+noun? Brace The Barrier, Stay The Blade, Give The Word Weight, Weary The Sword Arm.
12. Opening per class? urban, written.
