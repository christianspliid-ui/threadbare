# Batch brief — expert-everyday-1 (6 encounters + 2 appointment sequels)

**Drafted:** Claude Code (pickup lane, THR-1678), 2026-09-30 · **Approved:** lane decision under Christian's 2026-09-11 blanket approval of batch briefs (ruling 2; the precedent on THR-1130, and the footing both journeyman batches ran on). Veto invited on the ticket.
**Ticket:** [THR-1678](https://linear.app/threadbare/issue/THR-1678) · **Design:** [`Docs/plans/2026-09-29-thr-1627-content-above-novice.md`](../2026-09-29-thr-1627-content-above-novice.md) § D3 The brief, § D4 Staging · **Follows:** [`journeyman-everyday-2-brief.md`](journeyman-everyday-2-brief.md) (THR-1677)

## Why this batch

The journeyman floor is met on every reach. An expert standing in a town still has one
everyday encounter in the whole catalogue that suits them. Measured on this branch before
the batch (`npm run measure:roll-spread -- --coverage-only`):

```
reach          novice  journeyman      expert      master
eye               17          10           0<          0<
gold              20           6           0<          0<
heart             18           7           0<          0<
iron              11           4           1<          0<
shadow            13           3           0<          0<
star               7           3           0<          0<
stone              7           4           0<          0<
veil               6           4           0<          0<
journeyman 0 reach(es) under floor · expert 8 reach(es) under floor · master 8
```

The stop rule does not trip (`npm run gameplay-report -- --seeds 42,99,7`, 120 ticks):
expert mean attempted difficulty is 0.14 / 0.16 on seeds 42 / 99, **under** journeyman's
0.17 / 0.18. Experts attempt easier work than journeymen because there is nothing harder
where they stand.

The ticket asks for six of the eight reaches, skipping the two best-served at expert.
**Iron** is best-served (1). The other seven tie at 0, so the tie breaks on the band below:
**eye** has the most journeyman content (10). The batch is
**gold · heart · shadow · star · stone · veil, one each.**

## Game design — fixed before any premise (director ruling 2026-08-24)

### The binding rows

| Slot | id | reach (binding) | steps (reach · difficulty) | mean | window fit | shape | settings | consequence hand (binding) |
|---|---|---|---|---|---|---|---|---|
| 1 | `encounter.town.debt_arbitration` | gold | gold 0.58 → gold 0.66 | 0.62 | 0.76 | opt-in complication | `urban` | `possession` + `knowledge` |
| 2 | `encounter.town.feud_mediation` | heart | eye 0.55 → heart 0.62 → heart 0.68 | 0.617 | 0.757 | investigation → resolution | `urban`, `rural` | `companion` + `secret` |
| 3 | `encounter.town.tithe_barn_raid` | shadow | shadow 0.60 → shadow 0.66 | 0.63 | 0.77 | danger → confrontation → aftermath | `rural` | `thread` + `omen` |
| 4 | `encounter.town.comet_disputation` | star | star 0.58 → star 0.68 | 0.63 | 0.77 | danger → confrontation → aftermath | `urban` | `secret` + `drive` |
| 5 | `encounter.town.bell_tower_shoring` | stone | stone 0.60 → stone 0.66 | 0.63 | 0.77 | **appointment** | `urban`, `rural` | `possession` + `knowledge` |
| 6 | `encounter.town.drowned_mans_testimony` | veil | veil 0.64 | 0.64 | 0.78 | query prize | `urban`, `rural` | `thread` + `drive` |

- **Expert band.** Mean step difficulty 0.617–0.64, inside the plan's 0.55–0.70. Window
  fit (mean + 0.14) is 0.757–0.78, inside the expert capability band (0.65–0.85) and clear
  of both edges. The words the player reads are *steep* and *severe*.
- **`rarityTier: 2`, `scale: 'local'`, `intrinsicTier: 'shaping'` on all six.** Local's
  offset is 0 since THR-1627, so the authored number is the rolled number.
- **Why `shaping`, not `background` (in-lane decision, veto welcome).** Background
  (open-draw) templates are held to `NUDGE_OFF_REACH_MAX_DIFFICULTY` (0.45) per step, so
  **no background template can carry expert difficulty**. The THR-1627 plan re-checked that
  constant as a knock-on and did not address the collision. The constant exists so that a
  mortal off the step's reach is not floored with a hand that cannot move the word. Its own
  doc comment says a steeper step is lawful when it is "authored for actors who plausibly
  hold the reach". Since THR-1575 the forecast window does that selection. A mortal
  commits at 50–65%, so only a mortal of about 0.75 capability on the reach chooses a 0.62
  step. `shaping` is the existing tier for an author-chosen audience (23 shipped encounters
  wear it), and the checklist defers above `background` by design. The attention matrix is
  what changes: the First's view is unchanged (`background` already promotes to `shaping`),
  retinue sees `shaping` instead of `background`, and watched sees `background`. An expert's
  hard job reads as a moment, which is what it is. The gauge counts both tiers the same.
- **Everyday by construction.** Every slot declares `urban` and/or `rural`, which expand to
  settlement subtypes. No slot carries a guild-rank, army, monster, fight or confront gate,
  and every id sits under `encounter.town.*`. **Never `encounter.slice.*`.**
- **The primary reach is the reach of most rolled steps** (`primaryReachOf`). Slot 2's Eye
  step is one against two Heart.
- **Consequence hands** rolled with `npm run draw:packet -- expert-everyday-1 --slots 6
  --reaches gold,heart,shadow,star,stone,veil --tier 2 --ids <the six>`. `check:encounter`
  recomputes each from id + reach + rarity, so **the ids above are final**.

### How each drawn family is wired in context

- **slot 1 `possession`**: `reward_draw` / `attachment_grant` / `spawn_artifact`. What the
  arbitration awards: the pledge, the deed, the house's seal.
- **slot 1 `knowledge`**: `intelligence` / `spawn_clue` / `sharpen_clue`. Reading a
  house's books teaches the mortal where its money actually goes.
- **slot 2 `companion`**: `grant_companion` on the success side. Someone from one of the
  feuding households leaves with the mortal who ended it. Use a companion template that
  exists.
- **slot 2 `secret`**: `secret_discovery` / `hidden_mark` / `favor_creation`. The
  investigation step finds what started the feud; one house now owes, or fears, the mortal.
- **slot 3 `thread`**: `thread_strengthen` / `thread_weaken` on `$ascendant` + `$actor`.
- **slot 3 `omen`**: `emit_omen`. What was found in the barn is read as a sign.
- **slot 4 `secret`**: `secret_discovery` / `hidden_mark` / `favor_creation`.
- **slot 4 `drive`**: `assign_ambition` / `plant_compulsion`. An expert who wins or loses a
  public disputation leaves with a new aim.
- **slot 5 `possession`**: `reward_draw` / `attachment_grant`.
- **slot 5 `knowledge`**: `intelligence` / `spawn_clue`. What the mason learned about how
  the tower was built.
- **slot 5 appointment (the batch floor)**: an `encounter_seed` carrying an `appointment`
  block (`locationId: '$here'`, `counterpartyId: '$cast:<the one who pays>'`). Kept branch
  **`town.bell_tower_first_peal`**, missed branch **`town.bell_tower_cracked`** (by
  `templateId`). Both are **seed-only** (`drawable: false`, THR-1526): short one-step
  scenes in `src/data/encounters/bell-tower-sequels.ts`, outside the factory catalog, the
  way `town.well_first_water` / `town.well_gone_foul` are (the `town.` prefix is already
  claimed in `src/data/content-objects.ts`). The parent's prose may name the place and the
  day (prose rule 7b's one lawful exception).
- **slot 6 `thread`**: `thread_strengthen` / `thread_weaken`.
- **slot 6 `drive`**: `assign_ambition` / `plant_compulsion`.
- **slot 6 query prize (the batch floor)**: the prize is drawn **by tag**, via a step
  `rewardPool` whose entry is tag-filtered (`reward_draw` has no `query` field; see
  `cunning-fair.package.json` or `bell-at-the-exchange.package.json` for the working shape).

### Payoffs, prizes, penalties — band by band

| Band | What it pays or costs, across the six |
|---|---|
| `critical_success` | the drawn prize lands at its best, and people who matter remember who did it |
| `success` | the drawn prize lands |
| `success_at_cost` | the prize lands and the mortal carries something for it: a condition, a lean, a debt |
| `failure` | the prize does not land, the drawn penalty family fires, and the story goes on |
| `critical_failure` | the penalty lands hard, and the extreme band says plainly what it cost |

**Cool failure.** None of the six kills, jails or brands. Expert failure is **reputation
before money**. Being known as the best is what the mortal risks. Failure costs a patron,
a standing in the town, a name that people stop sending for, or a debt owed to someone
powerful. The prose says plainly why it costs more for someone this good.

**Expert stakes in the fiction.** Every opening puts someone powerful across the table: a
banking house and its creditors, two landed households, a lord's reeve and his tithe, a
college of astrologers, a town council with its bell, a magistrate's court. The P3 stake
names what is at risk in standing, stated plainly (Doctrine v2). The mortal is sent for
**because** they are good. That is the expert's everyday: other people have already failed
at this job.

### Cost channels and grants

At most one authored Heavy Hand (`costs.detectionDelta`) across the batch, and no special
with two cost channels. No card grants content. Every drawn family lands through the
aftermath, where it can be band-keyed.

### Hands

Every nudge-bearing step authors **0–2 specials** and declares a `deal` fill. The specials
are the cards only this scene could offer. Everything generic is dealt from the Repertoire.

## Family and setting envelope

- **Family:** `encounter.town.*` (everyday life-of-a-town). No new family tag is minted.
- **Setting classes:** as the table says; each declared class gets an opening.
- **Excluded:** `stronghold`, `sacred`, `arcane`, `ruin`, `wayside`, `battlefield`. None
  of them expands to a settlement subtype.

## Variance targets

| Axis | Target across the batch |
|---|---|
| Reach spread | gold · heart · shadow · star · stone · veil, one each, **fixed by the ticket and the gauge** |
| Decision shapes | opt-in · investigation→resolution · danger→confrontation ×2 · appointment · query prize |
| Appointment | slot 5, with both sequels authored |
| Query prize | slot 6 |
| Tone | at most two resolve grim; at least one is a pleasure (slot 4's public disputation) |
| Step counts | one 1-step · four 2-step · one 3-step |
| P3 stake shapes | contest ×2 · mystery ×2 · obstruction · plea (packet) |
| Opposition | uncanny (read as the house's own custom) · time · own trait · faction doctrine · uncanny (the tower's own law) · rival agent |
| Disposition | hostile · n/a · wary · neutral · neutral · hostile |
| Agent's role | client who is owed · the target ×2 · suspect or cause · trespasser · bystander pulled in |
| Scale | ≥1 settlement-or-larger (slots 1, 4, 5) |

## Rolled constraints

```
npm run draw:packet -- expert-everyday-1 --slots 6 --reaches gold,heart,shadow,star,stone,veil --tier 2 --ids <six>
slot 1:  encounter.town.debt_arbitration
  plotHookRolled: hook.builders_dilemma, hook.unlikely_alliance, hook.puzzle_gauntlet
  reach: gold    setting: battlefield → urban   shape: opt_in_complication   system: carryover
  p3Shape: contest   opposition: uncanny (its own law)   disposition: hostile   agentRole: client_who_is_owed   scale: settlement
  consequenceHand: possession, knowledge
slot 2:  encounter.town.feud_mediation
  plotHookRolled: hook.rebuilding_trust, hook.compassionate_liberation, hook.unlikely_alliance
  reach: heart   setting: arcane → urban, rural   shape: puzzle_investigation_resolution   system: traits
  p3Shape: mystery   opposition: time (the clock is the enemy)   disposition: n/a   agentRole: the_target   scale: company
  consequenceHand: companion, secret
slot 3:  encounter.town.tithe_barn_raid
  plotHookRolled: hook.market_collapse, hook.lost_civilization, hook.home_becomes_dangerous
  reach: shadow  setting: rural   shape: danger_confrontation_aftermath   system: forks
  p3Shape: obstruction   opposition: own_trait (read from the graph)   disposition: wary   agentRole: suspect_or_cause   scale: personal
  consequenceHand: thread, omen
slot 4:  encounter.town.comet_disputation
  plotHookRolled: hook.underground_city, hook.haunt_resolution, hook.stronghold_raid
  reach: star    setting: arcane → urban   shape: danger_confrontation_aftermath   system: forks
  p3Shape: contest   opposition: faction (doctrine)   disposition: neutral   agentRole: the_target   scale: settlement
  consequenceHand: secret, drive
slot 5:  encounter.town.bell_tower_shoring
  plotHookRolled: hook.puzzle_gauntlet, hook.natural_disaster, hook.death_and_return
  reach: stone   setting: battlefield → urban, rural   shape: appointment   system: conditions
  p3Shape: plea   opposition: uncanny (its own law)   disposition: neutral   agentRole: trespasser   scale: settlement
  consequenceHand: possession, knowledge
slot 6:  encounter.town.drowned_mans_testimony
  plotHookRolled: hook.endless_pursuit, hook.gods_fall, hook.relic_awakening
  reach: veil    setting: stronghold → urban, rural   shape: query_prize   system: cards
  p3Shape: mystery   opposition: rival_agent (greed)   disposition: hostile   agentRole: bystander_pulled_in   scale: company
  consequenceHand: thread, drive
```

`plotHookTaken` is recorded per encounter in its package doc block and stamped into
`src/data/content-eval/plotHooks.ts` `usedBy` at closeout.

### Overrides, each with its reason

- **setting.** Every rolled class that expands to no settlement subtype is overridden to
  `urban` and/or `rural`. The ticket's scope is the everyday settlement board.
- **reach.** Supplied by the ticket and the gauge (`--reaches`).
- **slot 1 opposition.** Rolled `uncanny (its own law)`. Read as the banking house's own
  custom: an arbitration once opened must run to a ruling, with no magic in it.
- **slot 2 setting.** Rolled `arcane`. The feud's origin may have a charm or an old curse in
  it, but the scene is a town.
- **slot 4 setting.** Rolled `arcane`. The college of astrologers is an urban institution.
- **slot 5 opposition.** Rolled `uncanny (its own law)`. Read as the tower's own weight and
  age. Stone settles as it settles.
- **slot 6 setting.** Rolled `stronghold`. The magistrate's court stands in a town.

## Systems quota targets

Contract floor is 3 (`COMPOSITION_SYSTEMS_QUOTA_MIN`).

- **Reach for:** items (slots 1, 5, 6 by query), clues and intelligence (slots 1, 5),
  companions (slot 2), secrets and favours (slots 2, 4), threads (slots 3, 6), omens
  (slot 3), ambitions and compulsions (slots 4, 6), the appointment (slot 5).
- **Avoid defaulting to:** a personal condition on the mortal as the failure penalty. At
  most two slots use `apply_condition` on `$actor`. Reputation (`reputation_with` a cast
  member or the town) is the natural expert penalty and is encouraged.

## Anchors this batch intends to touch

| Anchor kind | Target across the batch |
|---|---|
| location (`$here`) | slot 5's appointment anchors `$appointment`; at least one other slot marks the town |
| cast member (`$cast:<key>`) | at least five slots name a powerful counterparty the chip can point at |
| companion | slot 2 |
| item / reward template | slots 1, 5, 6 |
| thread (`$ascendant` ↔ `$actor`) | slots 3, 6 |
| favour / owes edge | slots 2, 4 |

**Avoid defaulting to:** a chip anchored only to the mortal's own condition.

**Known renderer defect (THR-1685).** On a board draw `{target}` is the settlement, so a
`reputation with {target}` chip anchored on `$cast:<key>` reads as the town. Anchor a
reputation chip to the town only when the town is what the prose means. For a person,
use a chip noun that does not interpolate `{target}` until THR-1685 lands.

## Over-exposed cards

Carried from the journeyman batches' census (2026-09-29).

| Card | Instruction |
|---|---|
| `card.boost.core` | **not as a special**. Let the deal fill supply it |
| `card.boost.signature.energy` | not at all |
| `card.undertow.signature.darkness` | at most once across the batch |
| `card.kindled_ambition.signature.spirit` · `card.heavy_hand.signature.force` | at most once each |
| `card.mercy.core` · `card.compulsion.signature.mind` | at most once each |

## Batch mechanics that bit the journeyman batches (impediments #1109–#1115)

- Never mint under `encounter.slice.*`. The hand is drawn from the id.
- `intrinsicTier: 'shaping'` on all six (see above). The 0.45 open-draw cap binds
  `background` only.
- The live proof's default run reports failure-band runs as missing success-side effects
  (#1111, #1113). At expert difficulty the proof's ascendant loses most runs. Take
  evidence from a seed sweep plus a pinned band.
- The dry-run compile misses the gates `check:encounter` runs (#1114). Run both.
- There is no `$companion` sentinel (#1115).

## Out of scope

- Eye and iron at expert (THR-1679), and master content (THR-1681).
- Any rule gate (guild rank, faction membership, hold).
- New condition ids and new node types.
- Tuning the window, the odds or the local offset. The batch is measured, never tuned to
  pass.
