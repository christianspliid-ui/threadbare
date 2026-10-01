# Batch brief — expert-everyday-3 (3 encounters + 2 appointment sequels)

**Drafted:** Claude Code (pickup lane, THR-1680), 2026-10-01 · **Approved:** lane decision under Christian's 2026-09-11 blanket approval of batch briefs (ruling 2; the footing THR-1677, THR-1678 and THR-1679 ran on). Veto invited on the ticket.
**Ticket:** [THR-1680](https://linear.app/threadbare/issue/THR-1680) · **Design:** [`Docs/plans/2026-09-29-thr-1627-content-above-novice.md`](../2026-09-29-thr-1627-content-above-novice.md) § D3 The brief, § D4 Staging · **Follows:** [`expert-everyday-2-brief.md`](expert-everyday-2-brief.md) (THR-1679)

## Why this batch

Measured on this branch before the batch (`npm run measure:roll-spread -- --coverage-only`):

```
reach          novice  journeyman      expert      master
eye               17          10           2           0<
gold              20           6           1<          0<
heart             18           7           1<          0<
iron              11           4           2           0<
shadow            13           3           2           0<
star               7           3           2           0<
stone              7           4           1<          0<
veil               6           4           2           0<
journeyman 0 reach(es) under floor · expert 3 reach(es) under floor · master 8 reach(es) under floor
```

The stop rule does not trip: three reaches sit under the expert floor of 2.

### Size (lane decision, veto welcome)

The ticket allows up to four: three to meet the floor and one flex. The ticket's own rule
is "whatever still sits under the floor", and plan D4 says counts are ceilings, never
quotas. **The batch is three: gold · heart · stone.** The flex slot is not spent. THR-1681
(master) re-measures next, and THR-1679's report already flagged that the expert
encounters are rarely chosen (4 of ~2,200 free-choice selections). A fourth expert
encounter on a reach already at the floor would test the count, not the board.

## Game design — fixed before any premise (director ruling 2026-08-24)

### The binding rows

| Slot | id | reach (binding) | steps (reach · difficulty) | mean | window fit | shape | settings | consequence hand (binding) |
|---|---|---|---|---|---|---|---|---|
| 1 | `encounter.town.mill_lease_auction` | gold | gold 0.58 → gold 0.66 | 0.62 | 0.76 | **appointment** | `rural`, `urban` | `knowledge` + `story_seed` |
| 2 | `encounter.town.inheritance_wake` | heart | heart 0.60 → fork (pole A heart 0.66 · pole B gold 0.62) | 0.63 | 0.77 | personality fork | `rural` | `relationship` + `membership` |
| 3 | `encounter.town.flood_dyke_mending` | stone | eye 0.56 → stone 0.64 → stone 0.68 | 0.627 | 0.767 | **query prize** | `rural` | `story_seed` + `place` |

- **Expert band.** Every mean sits in the plan's 0.55–0.70. Window fit (mean + 0.14) is
  0.76–0.77, inside the expert capability band (0.65–0.85) and clear of both edges.
- **`rarityTier: 2`, `scale: 'local'`, `intrinsicTier: 'shaping'` on all three**, as
  batches 1 and 2. Background templates are held to `NUDGE_OFF_REACH_MAX_DIFFICULTY`
  (0.45) per step (impediment #1119).
- **Everyday by construction.** Every slot declares `urban` and/or `rural`. No guild-rank,
  army, monster, fight or confront gate. Every id sits under `encounter.town.*`.
  **Never `encounter.slice.*`.**
- **Primary reach = the reach of most rolled steps** (`primaryReachOf`). Slot 2: the test
  and pole A are Heart. Slot 3: two Stone against one Eye.
- **Consequence hands** rolled with the packet command below. `check:encounter`
  recomputes each from id + reach + rarity, so **the ids above are final**.
- **Not colliding with the existing gold, heart and stone experts**: `debt_arbitration`
  (opt-in, urban), `feud_mediation` (investigation, heart) and `bell_tower_shoring`
  (appointment, stone). This batch puts the appointment on gold, the fork on heart and the
  query prize on stone.

### Premises, each inside the fixed design

1. **The Mill Lease** (gold, rural/urban market town). The abbey's cellarer is letting the
   lease on the town's water-mill, and the expert is asked to price it and bid for the
   millers' fellowship against a merchant with deeper pockets. Step 1 reads what the mill
   truly earns (the abbey's books against the miller's tallies). Step 2 is the bid itself.
   **Appointment:** the lease is sealed at the mill on quarter day, with the cellarer as
   the counterparty. Opposition is the abbey's doctrine: it lets to whoever its rule says.
2. **The Inheritance Wake** (heart, rural). A farmer is dead, the wake is in the barn, and
   his three children are already quarrelling over the land before he is buried. The
   expert is asked by the widow to keep the family whole through the night. Step 1 reads
   the room and calms it. Then the mortal decides on a value axis (verify the axis in the
   axis registry): keep the family together on the widow's terms (Heart), or settle the
   land by a fair split in writing (Gold). Hand: one child's bond with the mortal
   (relationship), and the family's kin-circle or the parish (membership).
3. **The Flood Dyke** (stone, rural). The river is rising, the dyke that keeps it off the
   lower fields has a soft section, and the reeve has sent for the expert mason before the
   next tide of meltwater. Step 1 (Eye) finds why the dyke is failing (an old culvert
   under it, collapsed). Steps 2–3 mend it against the clock. **The prize is drawn by tag**
   through a step `rewardPool` (whatever is found in the old culvert). Hand: a sequel
   (story_seed) and what the flood season leaves true of the village (place).

### How each drawn family is wired in context

- **slot 1 `knowledge`**: `intelligence` / `spawn_clue` / `sharpen_clue`. What the mill
  truly earns, and who has been skimming the tallies.
- **slot 1 `story_seed`**: here the appointment itself. An `encounter_seed` carrying an
  `appointment` block (`locationId: '$here'`, `counterpartyId: '$cast:<cellarer>'`). Kept
  branch **`town.mill_lease_sealed`**, missed branch **`town.mill_lease_forfeit`** (by
  `templateId`). Both are **seed-only** (`drawable: false`, THR-1526): short one-step
  scenes in `src/data/encounters/mill-lease-sequels.ts`, modelled on
  `src/data/encounters/boundary-survey-sequels.ts`. The parent's prose may name the place
  and the day (prose rule 7b's one lawful exception).
- **slot 2 `relationship`**: `relationship_change` / `bond` effects between `$actor` and a
  cast member (one of the children). Use only effect kinds `check:encounter` accepts for
  the family.
- **slot 2 `membership`**: the family-family's effect kinds as `draw:consequences` prints
  them (a circle or faction the mortal is admitted to, or turned out of).
- **slot 3 `story_seed`**: `encounter_seed`, placeless, `query` by family tag or a
  `templateId` that exists. Who comes asking after what the culvert held.
- **slot 3 `place`**: a location condition with `targetLocationId: '$here'`, or
  `spawn_unique_location`. What the flood season leaves true of the village.
- **slot 3 query prize (the batch floor)**: a step `rewardPool` whose entry is
  tag-filtered (`reward_draw` has no `query` field). Working shapes:
  `pawnbrokers-strongroom.package.json`, `drowned-mans-testimony.package.json`. Use a tag
  that exists in `reference/content-tag-catalog.generated.md` and is worn by at least one
  item.

Run `npm run draw:consequences -- <id> --reach <reach> --rarity 2` to print the exact
effect kinds each family accepts.

### Payoffs, prizes, penalties — band by band

| Band | What it pays or costs, across the three |
|---|---|
| `critical_success` | the drawn prize lands at its best, and people who matter remember who did it |
| `success` | the drawn prize lands |
| `success_at_cost` | the prize lands and the mortal carries something for it: a condition, a lean, a debt |
| `failure` | the prize does not land, the drawn penalty family fires, and the story goes on |
| `critical_failure` | the penalty lands hard, and the extreme band says plainly what it cost |

**Cool failure.** None of the three kills, jails or brands. Expert failure is
**reputation before money**: a patron lost, a standing in the town, a name people stop
sending for. The prose says plainly why it costs more for someone this good.

**Expert stakes in the fiction.** Every opening puts someone with standing across the
table: an abbey and a rich merchant, a landed family at a wake, a reeve with a village's
fields behind him. The mortal is sent for **because** they are good.

### Cost channels and grants

At most one authored Heavy Hand (`costs.detectionDelta`) across the batch, and no special
with two cost channels. No card grants content. Every drawn family lands through the
aftermath, where it can be band-keyed.

### Hands

Every nudge-bearing step authors **0–2 specials** and declares a `deal` fill.

## Family and setting envelope

- **Family:** `encounter.town.*`. No new family tag is minted.
- **Setting classes:** as the table says; each declared class gets an opening.

## Variance targets

| Axis | Target across the batch |
|---|---|
| Reach spread | gold · heart · stone (gauge, above) |
| Decision shapes | appointment · personality fork · query prize (investigation → resolution steps) |
| Appointment | slot 1, with both sequels authored |
| Query prize | slot 3 |
| Tone | at most one resolves grim; slot 2's wake ends warm on its success side |
| Step counts | one 2-step · one test + fork · one 3-step |
| P3 stake shapes | choice · unmitigated risk · mystery (packet) |
| Opposition | faction doctrine (the abbey) · terrain/indifference read as grief and the land itself · time (the rising river) |
| Agent's role | client who is owed · bystander pulled in · competitor (against the river and a rival crew) |
| Scale | ≥1 settlement-or-larger (slot 1) |

## Rolled constraints

```
npm run draw:packet -- expert-everyday-3 --slots 3 --reaches gold,heart,stone --tier 2 --ids encounter.town.mill_lease_auction,encounter.town.inheritance_wake,encounter.town.flood_dyke_mending
slot 1:  encounter.town.mill_lease_auction
  plotHookRolled: hook.artifact_recovery, hook.succession_crisis, hook.broken_alliance
  reach: gold                      setting: stronghold
  shape: appointment               system: traits
  p3Shape: choice                  opposition: faction (doctrine)
  disposition: open                agentRole: client_who_is_owed
  scale: region
  consequenceHand: knowledge, story_seed
slot 2:  encounter.town.inheritance_wake
  plotHookRolled: hook.stranger_bargain, hook.market_collapse, hook.celestial_sign
  reach: heart                     setting: rural
  shape: appointment               system: cards
  p3Shape: unmitigated_risk        opposition: terrain (indifference)
  disposition: n/a                 agentRole: bystander_pulled_in
  scale: personal
  consequenceHand: relationship, membership
slot 3:  encounter.town.flood_dyke_mending
  plotHookRolled: hook.descent_into_darkness, hook.harvest_reckoning, hook.environmental_gauntlet
  reach: stone                     setting: ruin
  shape: query_prize               system: conditions
  p3Shape: mystery                 opposition: time (the clock is the enemy)
  disposition: n/a                 agentRole: competitor
  scale: personal
  consequenceHand: story_seed, place
```

`plotHookTaken` is recorded per encounter in its package doc block and stamped into
`src/data/content-eval/plotHooks.ts` `usedBy` at closeout.

### Overrides, each with its reason

- **setting.** Every rolled class that expands to no settlement subtype is overridden to
  `urban` and/or `rural` (slot 1 stronghold → rural, urban; slot 3 ruin → rural, the old
  culvert is the ruin). The ticket's scope is the everyday settlement board.
- **reach.** Supplied by the gauge (`--reaches`).
- **slot 2 shape.** Rolled `appointment`, overridden to `personality_fork`. Slot 1 already
  carries the batch's appointment floor, and two appointments in a three-slot batch would
  double the sequel work while thinning shape variance. The `cards` system target stays.
- **slot 2 opposition.** Rolled `terrain (indifference)`. Read as the land itself: the
  farm cannot be split three ways and still feed anyone, whatever anyone feels.
- **slot 3 agentRole.** Rolled `competitor`. The mortal is racing the river, and a
  cheaper crew the reeve also hired.

## Systems quota targets

Contract floor is 3 (`COMPOSITION_SYSTEMS_QUOTA_MIN`).

- **Reach for:** clues and intelligence (slot 1), the appointment (slot 1),
  relationships and memberships (slot 2), a tag-drawn item (slot 3), seeds (slots 1, 3),
  location conditions (slot 3).
- **Avoid defaulting to:** a personal condition on the mortal as the failure penalty. At
  most one slot uses `apply_condition` on `$actor`.

## Anchors this batch intends to touch

| Anchor kind | Target across the batch |
|---|---|
| location (`$here`) | slot 1's appointment; slot 3's place condition |
| cast member (`$cast:<key>`) | all three slots name a counterparty the chip can point at |
| item / reward template | slot 3 |
| clue / intelligence | slot 1 |
| seed / sequel | slots 1, 3 |

**Known renderer defect (THR-1685).** On a board draw `{target}` may read as the
settlement. For a person, use a chip noun that does not interpolate `{target}`.

## Over-exposed cards

Carried from batches 1 and 2.

| Card | Instruction |
|---|---|
| `card.boost.core` | **not as a special**. Let the deal fill supply it |
| `card.boost.signature.energy` | not at all |
| `card.undertow.signature.darkness` | at most once across the batch |
| `card.kindled_ambition.signature.spirit` · `card.heavy_hand.signature.force` | at most once each |
| `card.mercy.core` · `card.compulsion.signature.mind` | at most once each |

## Batch mechanics that bit earlier batches (impediments #1109–#1120)

- Never mint under `encounter.slice.*`. The hand is drawn from the id.
- `intrinsicTier: 'shaping'` on all three.
- The live proof's default run reports failure-band runs as missing success-side effects
  (#1111, #1113, #1118). Take evidence from a seed sweep plus a pinned band.
- The dry-run compile misses the gates `check:encounter` runs (#1114). Run both.
- There is no `$companion` sentinel (#1115).
- Imperative lexicon: card names must use a verb from the imperative lexicon.

## Out of scope

- A fourth (flex) expert encounter; master content (THR-1681).
- Any rule gate (guild rank, faction membership, hold).
- New condition ids and new node types.
- Tuning the window, the odds or the local offset. Measured, never tuned to pass.
