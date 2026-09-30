# Batch brief — expert-everyday-2 (6 encounters + 2 appointment sequels)

**Drafted:** Claude Code (pickup lane, THR-1679), 2026-09-30 · **Approved:** lane decision under Christian's 2026-09-11 blanket approval of batch briefs (ruling 2; the footing THR-1677 and THR-1678 ran on). Veto invited on the ticket.
**Ticket:** [THR-1679](https://linear.app/threadbare/issue/THR-1679) · **Design:** [`Docs/plans/2026-09-29-thr-1627-content-above-novice.md`](../2026-09-29-thr-1627-content-above-novice.md) § D3 The brief, § D4 Staging · **Follows:** [`expert-everyday-1-brief.md`](expert-everyday-1-brief.md) (THR-1678)

## Why this batch

Measured on this branch before the batch (`npm run measure:roll-spread -- --coverage-only`):

```
reach          novice  journeyman      expert      master
eye               17          10           0<          0<
gold              20           6           1<          0<
heart             18           7           1<          0<
iron              11           4           1<          0<
shadow            13           3           1<          0<
star               7           3           1<          0<
stone              7           4           1<          0<
veil               6           4           1<          0<
expert 8 reach(es) under floor (floor 2)
```

The stop rule does not trip (`npm run gameplay-report -- --seeds 42,99,7`, 120 ticks):
expert mean attempted difficulty is 0.13 / 0.16 / 0.13 on seeds 42 / 99 / 7, against
journeyman 0.16 / 0.17 / 0.16. Expert success 63.5% / 61.4% / 57.3%.

### Which reaches (lane decision, veto welcome)

The ticket says "the two reaches batch 1 skipped ×2 each, then 2 more toward the floor".
Batch 1 skipped **eye** and **iron**. The plan's D3 row reads "the one existing iron
expert counts toward iron's floor, so 1 flex". Iron already has 1, so a second iron
encounter would take it to 3 while six reaches still sit at 1. The batch therefore gives
**eye ×2, iron ×1**, and spends the freed slot with the ticket's two flex slots: three
reaches at 1, tie-broken on the band below (fewest journeyman, then fewest novice):
**shadow** (3/13), **star** (3/7), **veil** (4/6). That leaves gold, heart and stone at 1
for THR-1680's four slots: three to meet the floor, and one flex.

**The batch is eye ×2 · iron · shadow · star · veil.**

## Game design — fixed before any premise (director ruling 2026-08-24)

### The binding rows

| Slot | id | reach (binding) | steps (reach · difficulty) | mean | window fit | shape | settings | consequence hand (binding) |
|---|---|---|---|---|---|---|---|---|
| 1 | `encounter.town.boundary_survey` | eye | eye 0.58 → eye 0.66 | 0.62 | 0.76 | **appointment** | `rural` | `possession` + `knowledge` |
| 2 | `encounter.town.toll_gate_writ` | eye | eye 0.60 → fork (pole A eye 0.64 · pole B heart 0.62) | 0.62 | 0.76 | personality fork | `urban` | `knowledge` + `movement` |
| 3 | `encounter.town.wolf_winter_watch` | iron | eye 0.56 → iron 0.64 → iron 0.68 | 0.627 | 0.767 | investigation → resolution | `rural` | `secret` + `place` |
| 4 | `encounter.town.pawnbrokers_strongroom` | shadow | shadow 0.60 → shadow 0.66 | 0.63 | 0.77 | **query prize** | `rural`, `urban` | `story_seed` + `drive` |
| 5 | `encounter.town.harvest_almanac` | star | star 0.64 | 0.64 | 0.78 | single test | `rural` | `drive` + `movement` |
| 6 | `encounter.town.oath_breaker_rite` | veil | veil 0.60 → veil 0.68 | 0.64 | 0.78 | opt-in complication | `urban` | `condition` + `place` |

- **Expert band.** Every mean sits in the plan's 0.55–0.70. Window fit (mean + 0.14) is
  0.76–0.78, inside the expert capability band (0.65–0.85) and clear of both edges.
- **`rarityTier: 2`, `scale: 'local'`, `intrinsicTier: 'shaping'` on all six**, as batch 1.
  Background (open-draw) templates are held to `NUDGE_OFF_REACH_MAX_DIFFICULTY` (0.45) per
  step, so no background template can be expert (impediment #1119; THR-1678's lane
  decision, still open to veto).
- **Everyday by construction.** Every slot declares `urban` and/or `rural`. No guild-rank,
  army, monster, fight or confront gate. Every id sits under `encounter.town.*`.
  **Never `encounter.slice.*`.** Wolves in slot 3 are fiction and weather, not a monster
  template or a fight gate.
- **Primary reach = the reach of most rolled steps** (`primaryReachOf`). Slot 2: the test
  and pole A are Eye. Slot 3: two Iron against one Eye.
- **Consequence hands** rolled with the packet command below. `check:encounter`
  recomputes each from id + reach + rarity, so **the ids above are final**.
- **Collisions avoided.** The first-choice ids echoed shipped scenes (`smugglers_ford`,
  `the-broken-seal`, three duels), so they were replaced before the final roll.

### Premises, each inside the fixed design

1. **The Boundary Survey** (eye, rural). The county's assize sends for the expert
   surveyor: the stones between a lord's demesne and the village common have moved, and the
   old charter says a sworn survey settles it. Step 1 reads the ground against the charter,
   step 2 finds where the true line runs. **Appointment:** the new stone is set in the
   ground at `$here` before witnesses at the beating of the bounds, with the lord's steward
   as the counterparty.
2. **The Writ at the Toll Gate** (eye, urban). The toll-master asks the expert to judge a
   travelling family's writ of passage. The writ is forged well. The test reads it, then
   the mortal decides on a value axis (verify the axis in `src/engine/.../axisRegistry.ts`):
   hold them for the town's court, or pass them through and answer for it.
3. **The Wolf-Winter Watch** (iron, rural). The reeve asks the expert soldier to judge
   whether the village watch can hold the folds through a hard winter. Step 1 (Eye) finds
   why the pack comes to this village and not the next. Steps 2–3 set the watch and hold
   the fold gate on the worst night.
4. **The Pawnbroker's Strongroom** (shadow, rural/urban market town). A widow asks the
   expert thief to take back a pledged heirloom before the pawnbroker sells it at the fair.
   A rival hired by the buyer wants the same box. The guard dog is starved and hurt. The
   prize is drawn **by tag** through a step `rewardPool`.
5. **The Harvest Almanac** (star, rural). The village asks the expert star-reader to name
   the day the harvest starts, with weather coming. The mortal's own stubbornness (a trait
   read from the graph) is the opposition. **This is the batch's pleasure.**
6. **The Oath-Breaker's Rite** (veil, urban). A man is sure he is cursed for breaking an
   oath. A frightened hedge-priest has taken his coin for a rite. Opt-in: the expert may
   perform the true release, or read whether the curse is real at all.

### How each drawn family is wired in context

- **slot 1 `possession`**: `reward_draw` / `attachment_grant` / `spawn_artifact`. The
  assize pays in kind: the survey chain, or a copy of the charter.
- **slot 1 `knowledge`**: `intelligence` / `spawn_clue`. Who moved the stones, and when.
- **slot 1 appointment (the batch floor)**: an `encounter_seed` carrying an `appointment`
  block (`locationId: '$here'`, `counterpartyId: '$cast:<steward>'`). Kept branch
  **`town.bounds_beaten`**, missed branch **`town.bounds_stone_uprooted`** (by
  `templateId`). Both are **seed-only** (`drawable: false`, THR-1526): short one-step
  scenes in `src/data/encounters/boundary-survey-sequels.ts`, modelled on
  `src/data/encounters/bell-tower-sequels.ts`. The parent's prose may name the place and
  the day (prose rule 7b's one lawful exception).
- **slot 2 `knowledge`**: `intelligence` / `spawn_clue`. Who made the writ.
- **slot 2 `movement`**: `agent_relocation`. The mortal leaves town with the family, or is
  sent to the county court with the prisoners. Branch-keyed.
- **slot 3 `secret`**: `hidden_mark` / `secret_discovery` / `favor_creation`. What is
  drawing the pack, and whose doing it is.
- **slot 3 `place`**: a location condition with `targetLocationId: '$here'`, or
  `spawn_unique_location`. What the winter leaves true of the village.
- **slot 4 `story_seed`**: `encounter_seed` (placeless, `query` by family tag or a
  `templateId` that exists). The buyer comes looking.
- **slot 4 `drive`**: `assign_ambition` / `plant_compulsion`.
- **slot 4 query prize (the batch floor)**: a step `rewardPool` whose entry is
  tag-filtered (`reward_draw` has no `query` field). Working shapes:
  `cunning-fair.package.json`, `drowned-mans-testimony.package.json`. Use a tag that exists
  in `reference/content-tag-catalog.generated.md` and is worn by at least one item.
- **slot 5 `drive`**: `assign_ambition` / `plant_compulsion`.
- **slot 5 `movement`**: `agent_relocation`. The neighbouring village sends for the one
  who called it right; or the one who called it wrong goes elsewhere for a season.
- **slot 6 `condition`**: `condition_attachment` / `apply_condition` / `remove_condition`.
  Only live condition ids.
- **slot 6 `place`**: a location condition with `targetLocationId: '$here'`.

### Payoffs, prizes, penalties — band by band

| Band | What it pays or costs, across the six |
|---|---|
| `critical_success` | the drawn prize lands at its best, and people who matter remember who did it |
| `success` | the drawn prize lands |
| `success_at_cost` | the prize lands and the mortal carries something for it: a condition, a lean, a debt |
| `failure` | the prize does not land, the drawn penalty family fires, and the story goes on |
| `critical_failure` | the penalty lands hard, and the extreme band says plainly what it cost |

**Cool failure.** None of the six kills, jails or brands. Expert failure is **reputation
before money**: a patron lost, a standing in the town, a name people stop sending for.
The prose says plainly why it costs more for someone this good.

**Expert stakes in the fiction.** Every opening puts someone with standing across the
table: the county assize and a lord, the town's toll charter, a village and its reeve, a
fair-day buyer, a village that stakes its harvest on one word, a frightened priest. The
mortal is sent for **because** they are good.

### Cost channels and grants

At most one authored Heavy Hand (`costs.detectionDelta`) across the batch (slot 4 is the
natural home), and no special with two cost channels. No card grants content. Every drawn
family lands through the aftermath, where it can be band-keyed.

### Hands

Every nudge-bearing step authors **0–2 specials** and declares a `deal` fill.

## Family and setting envelope

- **Family:** `encounter.town.*`. No new family tag is minted.
- **Setting classes:** as the table says; each declared class gets an opening.

## Variance targets

| Axis | Target across the batch |
|---|---|
| Reach spread | eye ×2 · iron · shadow · star · veil (gauge, above) |
| Decision shapes | appointment · personality fork · investigation→resolution · query prize · single test · opt-in |
| Appointment | slot 1, with both sequels authored |
| Query prize | slot 4 |
| Tone | at most two resolve grim; slot 5 is a pleasure |
| Step counts | one 1-step · four 2-step (slot 2 counts its test + continuation) · one 3-step |
| P3 stake shapes | mystery ×2 · opportunity ×2 · choice · contest (packet) |
| Opposition | faction doctrine · faction territory · beast (territory) · beast (hunger, wounded) · own trait · rival agent (fear) |
| Disposition | friendly ×3 · open · hostile · neutral |
| Agent's role | trespasser ×2 · judge asked to rule · suspect or cause ×2 · competitor |
| Scale | ≥1 settlement-or-larger (slots 1, 4) |

## Rolled constraints

```
npm run draw:packet -- expert-everyday-2 --slots 6 --reaches eye,eye,iron,shadow,star,veil --tier 2 --ids encounter.town.boundary_survey,encounter.town.toll_gate_writ,encounter.town.wolf_winter_watch,encounter.town.pawnbrokers_strongroom,encounter.town.harvest_almanac,encounter.town.oath_breaker_rite
slot 1:  encounter.town.boundary_survey
  plotHookRolled: hook.betrayal_revealed, hook.oath_breaking_scandal, hook.prophetic_investigation
  reach: eye     setting: battlefield → rural   shape: appointment   system: forks
  p3Shape: mystery   opposition: faction (doctrine)   disposition: friendly   agentRole: trespasser   scale: region
  consequenceHand: possession, knowledge
slot 2:  encounter.town.toll_gate_writ
  plotHookRolled: hook.followed_on_the_road, hook.mad_artificer, hook.broken_alliance
  reach: eye     setting: wayside → urban   shape: personality_fork   system: cards
  p3Shape: choice   opposition: faction (territory)   disposition: open   agentRole: trespasser   scale: personal
  consequenceHand: knowledge, movement
slot 3:  encounter.town.wolf_winter_watch
  plotHookRolled: hook.environmental_gauntlet, hook.trade_war, hook.rivals_challenge
  reach: iron    setting: arcane → rural   shape: puzzle_investigation_resolution   system: items
  p3Shape: opportunity   opposition: beast (territory)   disposition: hostile   agentRole: judge_asked_to_rule   scale: company
  consequenceHand: secret, place
slot 4:  encounter.town.pawnbrokers_strongroom
  plotHookRolled: hook.grief_absorption, hook.descent_into_darkness, hook.long_road
  reach: shadow  setting: rural (+ urban)   shape: query_prize   system: movement
  p3Shape: contest   opposition: beast (hunger, wounded)   disposition: friendly   agentRole: suspect_or_cause   scale: settlement
  consequenceHand: story_seed, drive
slot 5:  encounter.town.harvest_almanac
  plotHookRolled: hook.trial_by_combat, hook.siege_and_hold, hook.natural_disaster
  reach: star    setting: wayside → rural   shape: single_test   system: forks
  p3Shape: opportunity   opposition: own_trait (stubborn / oathbound, read from the graph)   disposition: friendly   agentRole: suspect_or_cause   scale: personal
  consequenceHand: drive, movement
slot 6:  encounter.town.oath_breaker_rite
  plotHookRolled: hook.haunted_relic, hook.blame_falls_on_outsiders, hook.artifact_recovery
  reach: veil    setting: urban   shape: opt_in_complication   system: traits
  p3Shape: mystery   opposition: rival_agent (fear)   disposition: neutral   agentRole: competitor   scale: personal
  consequenceHand: condition, place
```

`plotHookTaken` is recorded per encounter in its package doc block and stamped into
`src/data/content-eval/plotHooks.ts` `usedBy` at closeout.

### Overrides, each with its reason

- **setting.** Every rolled class that expands to no settlement subtype is overridden to
  `urban` and/or `rural`. The ticket's scope is the everyday settlement board.
- **reach.** Supplied by the gauge (`--reaches`), per the lane decision above.
- **slot 1 disposition.** Rolled `friendly`: the village that sent for the surveyor. The
  lord's steward is the institution's face, doctrine-bound, not hostile.
- **slot 3 opposition.** Rolled `beast (territory)`: the pack, driven by winter. No
  monster template; the wolves never become a combat encounter.
- **slot 3 system.** Rolled `items`: the watch's gear (a horn, a lantern, the gate bar)
  may appear as a special's lever, but no card grants content.
- **slot 4 opposition.** Rolled `beast (hunger, wounded)`: the pawnbroker's guard dog. The
  contest's rival is the buyer's hired thief.
- **slot 5 system.** Rolled `forks`, but the shape is a single test; the fork system is
  exercised by slot 2. Recorded, not forced.

## Systems quota targets

Contract floor is 3 (`COMPOSITION_SYSTEMS_QUOTA_MIN`).

- **Reach for:** items (slot 1; slot 4 by query), clues and intelligence (slots 1, 2),
  relocation (slots 2, 5), secrets (slot 3), location conditions (slots 3, 6), seeds
  (slot 4, and slot 1's appointment), ambitions and compulsions (slots 4, 5).
- **Avoid defaulting to:** a personal condition on the mortal as the failure penalty. At
  most two slots use `apply_condition` on `$actor` (slot 6 is one). Reputation is the
  natural expert penalty.

## Anchors this batch intends to touch

| Anchor kind | Target across the batch |
|---|---|
| location (`$here`) | slot 1's appointment; slots 3 and 6's place conditions |
| cast member (`$cast:<key>`) | at least five slots name a counterparty the chip can point at |
| item / reward template | slots 1, 4 |
| clue / intelligence | slots 1, 2 |
| seed / sequel | slots 1, 4 |

**Known renderer defect (THR-1685, PR open).** On a board draw `{target}` is the
settlement, so a `reputation with {target}` chip anchored on `$cast:<key>` reads as the
town. For a person, use a chip noun that does not interpolate `{target}`.

## Over-exposed cards

Carried from batch 1 and the journeyman census.

| Card | Instruction |
|---|---|
| `card.boost.core` | **not as a special**. Let the deal fill supply it |
| `card.boost.signature.energy` | not at all |
| `card.undertow.signature.darkness` | at most once across the batch |
| `card.kindled_ambition.signature.spirit` · `card.heavy_hand.signature.force` | at most once each |
| `card.mercy.core` · `card.compulsion.signature.mind` | at most once each |

## Batch mechanics that bit earlier batches (impediments #1109–#1120)

- Never mint under `encounter.slice.*`. The hand is drawn from the id.
- `intrinsicTier: 'shaping'` on all six.
- The live proof's default run reports failure-band runs as missing success-side effects
  (#1111, #1113, #1118). Take evidence from a seed sweep plus a pinned band.
- The dry-run compile misses the gates `check:encounter` runs (#1114). Run both.
- There is no `$companion` sentinel (#1115).
- Imperative lexicon: card names must use a verb from the imperative lexicon
  ("Counsel Patience" failed in batch 1; "Plant Patience" passed).

## Out of scope

- Gold, heart and stone's second expert encounter (THR-1680), and master content (THR-1681).
- Any rule gate (guild rank, faction membership, hold).
- New condition ids and new node types.
- Tuning the window, the odds or the local offset. Measured, never tuned to pass.
