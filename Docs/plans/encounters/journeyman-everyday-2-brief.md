# Batch brief — journeyman-everyday-2 (6 encounters + 2 appointment sequels)

**Drafted:** Claude Code (pickup lane, THR-1677), 2026-09-29 · **Approved:** lane decision under Christian's 2026-09-11 blanket approval of batch briefs (ruling 2, the precedent recorded on THR-1130; batch 1 ran on the same footing). Veto invited on the ticket.
**Ticket:** [THR-1677](https://linear.app/threadbare/issue/THR-1677) · **Design:** [`Docs/plans/2026-09-29-thr-1627-content-above-novice.md`](../2026-09-29-thr-1627-content-above-novice.md) § D3 The brief, § D4 Staging · **Follows:** [`journeyman-everyday-1-brief.md`](journeyman-everyday-1-brief.md) (THR-1676)

## Why this batch

Batch 1 filled Star, Gold and Stone. The everyday settlement board, measured on this
branch before the batch (`npm run measure:roll-spread -- --seeds 42,99,7`), still leaves
a journeyman soldier or a journeyman sneak in a town with almost nothing worth
attempting:

```
reach          novice  journeyman      expert      master
eye               17          10           0<          0<
gold              20           6           0<          0<
heart             18           7           0<          0<
iron              11           2<          1<          0<
shadow            13           1<          0<          0<
star               7           3           0<          0<
stone              7           3           0<          0<
veil               6           3           0<          0<
journeyman 2 reach(es) under floor · expert 8 · master 8
```

The ticket names Stone, Iron, Shadow and Veil once each, plus two flex slots on the
thinnest reaches. Those are **Iron and Shadow**, the only two under the floor. The
batch is therefore **Iron ×2 · Shadow ×2 · Stone ×1 · Veil ×1**, which takes the column
to iron 4 · shadow 3 · stone 4 · veil 4 and puts every reach at or above the floor of 3.

## Game design — fixed before any premise (director ruling 2026-08-24)

### The binding rows

| Slot | id | reach (binding) | steps (reach · difficulty) | mean | window fit | shape | settings | consequence hand (binding) |
|---|---|---|---|---|---|---|---|---|
| 1 | `encounter.town.fair_bout` | iron | iron 0.42 → iron 0.45 | 0.435 | 0.575 | opt-in complication | `urban`, `rural` | `companion` + `secret` |
| 2 | `encounter.town.levee_breach` | iron | iron 0.42 → eye 0.40 → iron 0.45 | 0.423 | 0.563 | investigation → resolution | `rural`, `urban` | `thread` + `place` |
| 3 | `encounter.town.ledger_by_lamplight` | shadow | shadow 0.42 → shadow 0.45 | 0.435 | 0.575 | seeded sequel | `urban` | `possession` + `place` |
| 4 | `encounter.town.smugglers_ford` | shadow | shadow 0.40 → shadow 0.45 | 0.425 | 0.565 | opt-in complication | `rural` | `movement` + `omen` |
| 5 | `encounter.town.well_sinking` | stone | stone 0.42 → stone 0.45 | 0.435 | 0.575 | **appointment** | `rural`, `urban` | `membership` + `omen` (swap `membership` → `story_seed` allowed: see below) |
| 6 | `encounter.town.cunning_fair` | veil | veil 0.45 | 0.45 | 0.59 | query prize | `urban`, `rural` | `secret` + `thread` |

- **`rarityTier: 2`, `scale: 'local'`, `intrinsicTier: 'background'` on all six.** Local's
  offset is 0 since THR-1627, so the authored number is the rolled number. Window fit =
  mean + 0.14 lands at 0.563–0.59. That is inside the journeyman capability band
  (0.35–0.65) and clear of both edges.
- **No step above 0.45.** Background (open-draw) templates are held to
  `NUDGE_OFF_REACH_MAX_DIFFICULTY` per step (batch-1 impediment). Everyday content is
  open-draw by definition.
- **The primary reach is the reach of most rolled steps** (`primaryReachOf`). Slot 2's
  Eye step is one against two Iron.
- **Everyday by construction.** Every slot declares `urban` and/or `rural`, which expand
  to settlement subtypes. No slot carries a guild-rank, army, monster, fight or confront
  gate, and every id sits under `encounter.town.*`. **Never `encounter.slice.*`:** that
  prefix is reserved, and the hand is drawn from the id. The stakes live in the fiction.
- **Consequence hands** rolled with `npm run draw:consequences -- <id> --reach <r>
  --rarity 2`. `check:encounter` recomputes each from id + reach + rarity, so **the ids
  above are final**.

### How each drawn family is wired in context

- **slot 1 `companion`**: `grant_companion` on the success side. Someone from the bout's
  corner (a second, a bottle-holder, the beaten man's sparring partner) walks away with
  the winner. Use a companion template that exists (`companion.*` in `src/data/`); a
  named, cast-backed unique is lawful only if it already exists.
- **slot 1 `secret`**: `favor_creation` or `hidden_mark`. The bout's backers bet on it; a
  mortal who wins or throws it is owed, or known for, something.
- **slot 2 `place`**: `apply_condition` / `condition_attachment` with `targetLocationId:
  '$here'`. A town whose levee held or broke is changed as a place. This is the batch's
  place-condition anchor.
- **slot 2 `thread`**: `thread_strengthen` / `thread_weaken` on `$ascendant` + `$actor`.
- **slot 3 `possession`**: `reward_draw` / `attachment_grant`. What was taken from the
  ledger room, or paid for it.
- **slot 3 `place`**: a condition on `$here` (the counting house's town knows its books
  were read), or the one swap if it fights the fiction. **Plus the seeded sequel the
  shape names:** a placeless `encounter_seed` by **tag query** (whoever paid comes back).
  That is on top of the hand, not in place of it.
- **slot 4 `movement`**: `agent_relocation`. Guiding a train over the ford is leaving
  with it.
- **slot 4 `omen`**: `emit_omen`. The fog, the river, a sign the hamlet reads.
- **slot 5 `omen`**: `emit_omen`. The water a new well brings up is read as a sign.
- **slot 5 `membership`**: `membership_change` if the fiction offers a real body to join
  (a well-wrights' or builders' guild faction the engine has). **If it does not, spend
  the one swap `membership` → `story_seed`**: the appointment is itself a seed.
- **slot 5 appointment (the batch floor)**: an `encounter_seed` carrying an
  `appointment` block (`locationId: '$here'`, `counterpartyId: '$cast:<the one who
  pays>'`). The kept branch is **`encounter.town.well_sinking_first_water`** and the
  missed branch **`encounter.town.well_sinking_gone_foul`** (by `templateId`). Both are
  **seed-only** (`drawable: false`, THR-1526): short one-step scenes the orchestrator
  authors alongside the parent, outside the factory catalog, the way `hunt.trail_cold`
  is. The parent's prose may then name the place and the day (prose rule 7b's one
  lawful exception).
- **slot 6 `secret`**: `secret_discovery` or `hidden_mark`. A cunning-man who reads a
  charm truly learns something about the house that bought it.
- **slot 6 `thread`**: `thread_strengthen` / `thread_weaken`.
- **slot 6 query prize (the batch floor)**: the prize is drawn **by tag**, via a step
  `rewardPool` whose entry is tag-filtered (`reward_draw` has no `query` field; see
  `bell-at-the-exchange.package.json` for the working shape).

### Payoffs, prizes, penalties — band by band

| Band | What it pays or costs, across the six |
|---|---|
| `critical_success` | the drawn prize lands at its best, and the town remembers who did it |
| `success` | the drawn prize lands |
| `success_at_cost` | the prize lands and the mortal carries something for it: a condition, a lean, a debt |
| `failure` | the prize does not land, the drawn penalty family fires, and the story goes on |
| `critical_failure` | the penalty lands hard, and the extreme band says plainly what it cost |

**Cool failure.** None of the six kills, jails or brands. Journeyman failure is
**money, standing, time and bruises**: a purse lost, a field flooded, a buyer who will
not deal again, a well that has to be sunk twice. The prose says plainly why it weighs
more for someone who is good at this.

**Journeyman stakes in the fiction.** Every opening puts someone substantial across the
table: a fair's backers, a reeve with orders, a counting house, the excise, a village
that paid in advance, a rival cunning-woman. The P3 stake names what is at risk in money
or standing, stated plainly (Doctrine v2).

### Cost channels and grants

At most one authored Heavy Hand (`costs.detectionDelta`) across the batch, and no special
with two cost channels. No card grants content. Every drawn family lands through the
aftermath, where it can be band-keyed.

### Hands

Every nudge-bearing step authors **0–2 specials** and declares a `deal` fill. The
specials are the cards only this scene could offer. Everything generic is dealt from the
Repertoire.

## Family and setting envelope

- **Family:** `encounter.town.*` (everyday life-of-a-town). No new family tag is minted,
  **except** the one sequel-family tag slot 3 needs for its tag-query seed if no existing
  tag names a fitting family (check the content-tag catalog first; the vocabulary is
  closed, so a new tag is a catalog row).
- **Setting classes:** as the table says; each declared class gets an opening.
- **Excluded:** `stronghold`, `sacred`, `arcane`, `ruin`, `wayside`, `battlefield`. None
  of them expands to a settlement subtype.

## Variance targets

| Axis | Target across the batch |
|---|---|
| Reach spread | iron 2 · shadow 2 · stone 1 · veil 1, **fixed by the ticket and the gauge** |
| Decision shapes | opt-in ×2 · investigation→resolution · seeded sequel · appointment · query prize |
| Appointment | slot 5, with both sequels authored (floor met; it was unmet in batch 1) |
| Query prize | slot 6 |
| Tone | at most two resolve grim; at least one is a pleasure (slot 1's fair) |
| Step counts | one 1-step · four 2-step · one 3-step |
| P3 stake shapes | threat · choice · opportunity · contest · unmitigated risk ×2 (packet) |
| Opposition | uncanny (read as the crowd's own law) · faction orders · faction doctrine · terrain · rival agent · terrain |
| Disposition | open · hostile · neutral · n/a · friendly · n/a |
| Agent's role | the target · suspect or cause · trespasser ×2 · bystander pulled in · competitor |
| Scale | ≥1 settlement-or-larger (slot 2) |

## Rolled constraints

```
npm run draw:packet -- journeyman-everyday-2 --slots 6 --reaches iron,iron,shadow,shadow,stone,veil --tier 2
slot 1:
  plotHookRolled: hook.civil_unrest, hook.trial_by_combat, hook.desperate_escort
  reach: iron     setting: arcane      → urban, rural   shape: opt_in_complication   system: omens
  p3Shape: threat   opposition: uncanny (its own law)   disposition: open   agentRole: the_target   scale: personal
slot 2:
  plotHookRolled: hook.ritual_of_undeath, hook.endless_pursuit, hook.heresy_hunt
  reach: iron     setting: battlefield → rural, urban   shape: puzzle_investigation_resolution   system: conditions
  p3Shape: choice   opposition: faction (orders)   disposition: hostile   agentRole: suspect_or_cause   scale: settlement
slot 3:
  plotHookRolled: hook.stronghold_raid, hook.sacred_crime, hook.assassination_succeeded
  reach: shadow   setting: arcane      → urban          shape: seeded_sequel   system: cards
  p3Shape: opportunity   opposition: faction (doctrine)   disposition: neutral   agentRole: trespasser   scale: company
slot 4:
  plotHookRolled: hook.broken_alliance, hook.trade_war, hook.dangerous_truth
  reach: shadow   setting: rural                        shape: opt_in_complication   system: items
  p3Shape: contest   opposition: terrain (indifference)   disposition: n/a   agentRole: bystander_pulled_in   scale: company
slot 5:
  plotHookRolled: hook.mad_artificer, hook.political_labyrinth, hook.impossible_choice
  reach: stone    setting: wayside     → rural, urban   shape: appointment   system: items
  p3Shape: unmitigated_risk   opposition: rival_agent (orders)   disposition: friendly   agentRole: trespasser   scale: company
slot 6:
  plotHookRolled: hook.grief_absorption, hook.monster_eradication, hook.heresy_hunt
  reach: veil     setting: battlefield → urban, rural   shape: query_prize   system: movement
  p3Shape: unmitigated_risk   opposition: terrain (indifference)   disposition: n/a   agentRole: competitor   scale: company
```

`plotHookTaken` is recorded per encounter in its package doc block and stamped into
`src/data/content-eval/plotHooks.ts` `usedBy` at closeout.

### Overrides, each with its reason

- **setting.** Every rolled class that expands to no settlement subtype is overridden to
  `urban` and/or `rural`. The ticket's scope is the everyday settlement board.
- **reach.** Supplied by the ticket and the gauge (`--reaches`).
- **slot 1 opposition.** Rolled `uncanny (its own law)`. Read as the fair's own law, the
  ring's custom that a challenge once called must be answered, with no magic in it.
- **slot 2 opposition.** `faction (orders)` is the reeve's or the dyke-warden's orders,
  a town office, not a faction node. Hostile disposition: the warden blames the mortal.
- **slot 6 step count.** A single test, so the batch keeps one 1-step encounter.

## Systems quota targets

Contract floor is 3 (`COMPOSITION_SYSTEMS_QUOTA_MIN`).

- **Reach for:** companions (slot 1), place conditions (slots 2, 3), seeds by tag query
  (slot 3), movement (slot 4), omens (slots 4, 5), the appointment (slot 5), items by
  query (slot 6), threads (slots 2, 6).
- **Avoid defaulting to:** a personal condition on the mortal as the failure penalty. At
  most two slots use `apply_condition` on `$actor`.

## Anchors this batch intends to touch

| Anchor kind | Target across the batch |
|---|---|
| location (`$here`) | slots 2 and 3 leave a condition on the town; slot 5's appointment anchors `$appointment` |
| cast member (`$cast:<key>`) | at least four slots name a counterparty the chip can point at |
| companion | slot 1 |
| item / reward template | slots 3, 6 |
| thread (`$ascendant` ↔ `$actor`) | slots 2, 6 |
| favour / owes edge | slot 1 (and slot 5's appointment promise) |

**Avoid defaulting to:** a chip anchored only to the mortal's own condition.

## Over-exposed cards

Carried from batch 1's census (2026-09-29), plus batch 1's own use.

| Card | Instruction |
|---|---|
| `card.boost.core` | **not as a special**. Let the deal fill supply it |
| `card.boost.signature.energy` | not at all |
| `card.undertow.signature.darkness` | at most once across the batch |
| `card.kindled_ambition.signature.spirit` · `card.heavy_hand.signature.force` | at most once each |
| `card.mercy.core` · `card.compulsion.signature.mind` | at most once each |

## Batch mechanics that bit batch 1 (impediments #1109–#1112)

- Never mint under `encounter.slice.*`. The hand is drawn from the id.
- Background-tier steps cap at 0.45.
- The live proof's default run fails most journeyman runs. Take evidence from a seed
  sweep plus a pinned band, as batch 1's report did.

## Out of scope

- Expert and master content (THR-1678…THR-1681).
- Any rule gate (guild rank, faction membership, hold).
- New condition ids and new node types.
- Tuning the window, the odds or the local offset. The batch is measured, never tuned
  to pass.
