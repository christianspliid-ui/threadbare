# Batch brief — journeyman-everyday-1 (6 encounters)

**Drafted:** Claude Code (pickup lane, THR-1676), 2026-09-29 · **Approved:** lane decision under Christian's 2026-09-11 blanket approval of batch briefs (ruling 2 — the precedent recorded on THR-1130); veto invited on the ticket
**Ticket:** [THR-1676](https://linear.app/threadbare/issue/THR-1676) · **Design:** [`Docs/plans/2026-09-29-thr-1627-content-above-novice.md`](../2026-09-29-thr-1627-content-above-novice.md) § D3 The brief, § D4 Staging

## Why this batch

A mortal who has become good at something stops finding anything in town worth
attempting. The everyday settlement board, measured on this branch before the batch
(`npm run measure:roll-spread -- --seeds 42,99,7`), holds **20** journeyman-fit
encounters, and they are unevenly spread: **Star has none, Gold and Stone one each.** A
journeyman navigator, merchant or mason standing in a town is offered novice work or
nothing, so they attempt the easy thing and "what a mortal attempts grows with them" is
false above novice. These six give a journeyman in a town something that suits them on
the three emptiest reaches: the harder version of ordinary town life. That means a
merchant house's money, a road that has to be read right the first time, and a
commission that a guild will look at.

```
reach          novice  journeyman      expert      master
star               7           0<          0<          0<
gold              20           1<          0<          0<
stone              7           1<          0<          0<
(journeyman 6 reach(es) under floor 3)
```

## Game design — fixed before any premise (director ruling 2026-08-24)

### The binding rows

The mechanics were chosen first. The premises came after, from the packet's hooks,
inside these rows.

| Slot | id | reach (binding) | steps (reach · difficulty) | mean | window fit | shape | settings | consequence hand (binding) |
|---|---|---|---|---|---|---|---|---|
| 1 | `encounter.town.pilots_reckoning` | star | star 0.40 → star 0.45 | 0.425 | 0.565 | opt-in complication | `urban` | `relationship` + `membership` → swap `membership` → `story_seed` |
| 2 | `encounter.town.overdue_caravan` | star | eye 0.38 → star 0.45 → star 0.45 | 0.427 | 0.567 | test and consequence | `urban`, `rural` | `thread` + `place` → swap `place` → `story_seed` |
| 3 | `encounter.town.assize_letter` | star | star 0.45 | 0.45 | 0.59 | single test | `rural`, `urban` | `knowledge` + `story_seed` → swap `story_seed` → `movement` |
| 4 | `encounter.town.counting_house_dispute` | gold | gold 0.42 → heart 0.40 | 0.41 | 0.55 | single test → fork (the mortal rules) | `urban` | `knowledge` + `secret` |
| 5 | `encounter.town.bell_at_the_exchange` | gold | gold 0.40 → gold 0.45 | 0.425 | 0.565 | query prize | `urban` | `story_seed` + `omen` → swap `omen` → `possession` |
| 6 | `encounter.town.masons_commission` | stone | stone 0.40 → stone 0.45 | 0.425 | 0.565 | appointment | `urban`, `rural` | `relationship` + `possession` |

- **`rarityTier: 2` on all six, `scale: 'local'` on all six.** Local's offset is 0 since
  THR-1627, so the authored number is the rolled number. Mean step difficulty sits in
  the brief's 0.35–0.50 journeyman range with margin on both sides. Window fit =
  mean + 0.14 lands 0.55–0.59, inside the journeyman capability band (0.35–0.65) and
  clear of both edges.
- **No step above 0.45, and `intrinsicTier: 'background'` on all six.** Open-draw
  (background) templates are held to `NUDGE_OFF_REACH_MAX_DIFFICULTY` (0.45) per step,
  so that a hand can still move the forecast word for an off-reach mortal. The first
  draft of this brief put final steps at 0.48–0.50. Raising the tier to `shaping` would
  lift the ceiling, but it would also change how often the player is interrupted, which
  this batch has no business changing. So every step is capped at 0.45 instead; the
  means move from 0.44–0.45 to 0.425–0.45, still journeyman (window fit ≥ 0.565).
  Everyday content is open-draw by definition, so the cap is the honest constraint.
- **The primary reach is the reach of most rolled steps** (`measure-roll-spread`
  `primaryReachOf`). On a tie the first step wins. Slot 2 opens on Eye and is still
  Star by two steps to one. Slot 4's tie goes to its first step, Gold.
- **Everyday by construction.** Every slot declares `urban` and/or `rural`, which expand
  to `hamlet · town · city · capital`. No slot carries a guild-rank, army, monster,
  fight or confront gate, and no id wears an excluded prefix (`encounter.town.*`). The
  higher stakes live in the fiction (who is across the table, what the money is), never
  in a rule gate. A gate would re-create the situational problem this brief exists to
  fix (plan § D4).
- **Consequence hands** rolled with `npm run draw:consequences -- <id> --reach <r>
  --rarity 2`. `check:encounter` recomputes each from id + reach + rarity. See § Amendment —
  the id move for the hands that bind now.

### Amendment — the id move (2026-09-29, same session)

The batch was first authored under `encounter.slice.*`. That prefix is reserved for
Christian's vertical-slice playthrough: it is held out of opening coloration
(`COLORATION_EXCLUDED_TEMPLATE_PREFIXES`, TODO THR-1220) and pinned at ten templates by
test. All six moved to `encounter.town.*`. The hand is drawn from the id, so every hand
re-rolled. The new hands bind, and each was wired inside the fiction already written.
Where a drawn family fights that fiction, the one recorded `consequenceSwap` is used:

| Slot | New hand | Wiring |
|---|---|---|
| 1 pilots | relationship + membership | relationship: the factor's `bond_change`. **Swap** membership → story_seed: a merchant house is a counterparty, not a body the mortal can join; the house coming back for the next run is the fiction (`encounter_seed`) |
| 2 overdue | thread + place | thread as below. **Swap** place → story_seed: the scene's place is the town the searchers leave from, and nothing about it changes |
| 3 assize | knowledge + story_seed | knowledge: `intelligence`. **Swap** story_seed → movement: the case is decided at the assize, off-scene; what this scene changes is that the mortal leaves with the letter (`agent_relocation`) |
| 4 counting | knowledge + secret | knowledge: a trade-route `intelligence` from reading both houses' books. secret: `favor_creation`. No swap |
| 5 bell | story_seed + omen | story_seed: a placeless `encounter_seed` (`encounter.caravan_deal`) on the outbid side. **Swap** omen → possession: the tag-drawn lot |
| 6 masons | relationship + possession | relationship: `bond_change` with the inspector. possession: the tag-drawn fee. No swap |

The effect notes below are the first-draft wiring and still describe the fiction; the
table above is what binds.

### How each drawn family is wired in context (first draft)

- **slot 1 `knowledge`**: `intelligence` or `spawn_clue` on the success side. A pilot who
  read the water right knows something about that route that the harbour does not.
- **slot 1 `story_seed`**: `encounter_seed` on the success side. The house that hired the
  reading comes back for the next run.
- **slot 2 `story_seed`**: `encounter_seed`. What happened to the caravan is not over
  when it is found (or not found).
- **slot 2 `thread`**: `thread_strengthen` / `thread_weaken` on `$ascendant` + `$actor`. A
  search that came through on a sense the mortal could not account for tightens the
  line to the god; a search that went cold while the god watched frays it.
- **slot 3 `knowledge`**: `intelligence` on the success side. Whoever carried the letter
  knows who it was for.
- **slot 3 `movement`**: `agent_relocation` (travel intent). The letter has to go
  somewhere, and taking it is leaving.
- **slot 4 `possession`**: `reward_draw` or `attachment_grant`. The house that is
  satisfied with the ruling pays the arbiter.
- **slot 4 `secret`**: `favor_creation` or `secret_discovery`. An arbiter who has read
  both houses' books is owed, or knows, something.
- **slot 5 `possession`**: `reward_draw` **by query, not by id**. This is the batch's
  query-prize floor. The lot is whatever the world's exchange has on the block.
- **slot 5 `drive`**: `plant_compulsion` on the success-at-cost / failure side. A mortal
  who bid past sense leans toward the next bid.
- **slot 6 `possession`**: `reward_draw` or `attachment_grant` on the kept appointment's
  success.
- **slot 6 `place`**: `apply_condition` / `condition_attachment` with `targetLocationId`
  on `$here`. The finished work (or the botched work) is a fact about the town, not the
  mason.
- **slot 6 appointment**: an `encounter_seed` carrying an `appointment` block
  (`locationId: '$here'`, a `missed` branch). The commission is let on condition that
  the mason is back on the site by the day the scaffold comes down. This is the batch's
  appointment floor.

### Payoffs, prizes, penalties — band by band

| Band | What it pays or costs, across the six |
|---|---|
| `critical_success` | the drawn prize lands at its best, and the town remembers who did it |
| `success` | the drawn prize lands |
| `success_at_cost` | the prize lands and the mortal carries something for it (a condition, a lean, a debt) |
| `failure` | the prize does not land, the drawn penalty family fires, and the story goes on |
| `critical_failure` | the penalty lands hard, and the extreme band narrates what it cost |

**Cool failure.** None of the six kills, jails or brands. The journeyman register of
failure is **money, standing and time**: a contract lost to a rival, a caravan found
too late, a lot knocked down to someone else, a wall that has to come down again. A
failure that loses a town's regard at journeyman level is heavier than at novice
because there is more to lose, and the prose says so plainly.

**Journeyman stakes in the fiction.** Every opening puts someone substantial across the
table: a merchant house, a harbour master, an assize clerk, a guild inspector. The P3
stake names what is at risk in money or standing, stated plainly (Doctrine v2).

### Cost channels and grants

At most one authored Heavy Hand (`costs.detectionDelta`) across the batch, and no two
cost channels on one special. No card grants content. Every drawn family lands through
the aftermath, where it can be band-keyed.

### Hands

Every nudge-bearing step authors **0–2 specials** and declares a `deal` fill. The
specials are the cards only this scene could offer (a tide that turns an hour early, a
clerk's pen that slips). Everything generic is dealt from the Repertoire.

## Family and setting envelope

- **Family:** `encounter.town.*` (the everyday life-of-a-town family; see § Amendment for why not `encounter.slice.*`). No new family tag
  is minted. The batch is everyday by design, so it should not be findable as a
  faction's errand.
- **Setting classes:** `urban` on all six; `rural` also on slots 2, 3 and 6. Each
  declared class gets an opening.
- **Excluded:** `stronghold`, `sacred`, `arcane`, `ruin`, `wayside`, `battlefield`. None
  of them expands to a settlement subtype, so any of them as the only class would take
  the encounter off the everyday board. Slot 5 was rolled `ruin`, slots 1 and 4
  `arcane`/`sacred`, slot 3 `wayside`. All are overridden (see § Rolled constraints).

## Variance targets

| Axis | Target across the batch |
|---|---|
| Reach spread | star 3 · gold 2 · stone 1, **fixed by the ticket** (the packet reports this as the one unmet bound; accepted, since the gauge's floor is per reach) |
| Decision shapes | opt-in · test-and-consequence · single test ×2 · query prize · appointment (no shape more than twice) |
| Query prize | slot 5 draws its lot by tag (a step `rewardPool`; `reward_draw` has no `query` field). The batch census counts `content_query` on slots 2 and 6, whose sequels are seeded by tag query |
| Appointment | slot 6 |
| Tone | at most two resolve grim; at least one is a pleasure (slot 5's bidding floor) |
| Step counts | one 1-step, four 2-step, one 3-step |
| Setting class | `urban` on all six, overridden by the ticket's everyday constraint (the packet's cap is bust by design; recorded) |
| System target | carryover · groups · traits · conditions · items · movement (packet, kept) |
| P3 stake shapes | mystery · obstruction · plea · opportunity ×2 · contest |
| Opposition | own trait · uncanny · law ×2 · time · uncanny, as rolled (slot 2's uncanny reads as weather and rumour, not magic) |
| Disposition | friendly · hostile · neutral ×3 · n/a |
| Agent's role | trespasser ×2 · bystander pulled in · judge asked to rule ×2 · competitor |
| Scale | ≥1 settlement-or-larger (slot 6) |

## Rolled constraints

```
npm run draw:packet -- journeyman-everyday-1 --slots 6 --reaches star,star,star,gold,gold,stone --tier 2
slot 1:
  plotHookRolled: hook.mentors_test, hook.apotheosis, hook.haunted_relic
  reach: star     setting: arcane   → urban     shape: opt_in_complication   system: carryover
  p3Shape: mystery   opposition: own_trait   disposition: friendly   agentRole: trespasser   scale: region
slot 2:
  plotHookRolled: hook.descent_into_darkness, hook.sacred_crime, hook.lost_civilization
  reach: star     setting: sacred   → urban, rural   shape: test_and_consequence   system: groups
  p3Shape: obstruction   opposition: uncanny   disposition: hostile   agentRole: bystander_pulled_in   scale: region
slot 3:
  plotHookRolled: hook.death_and_return, hook.heresy_hunt, hook.shifting_shape
  reach: star     setting: wayside  → rural, urban   shape: single_test   system: traits
  p3Shape: plea   opposition: law (duty)   disposition: neutral   agentRole: judge_asked_to_rule   scale: company
slot 4:
  plotHookRolled: hook.shifting_shape, hook.masterwork_completion, hook.desperate_escort
  reach: gold     setting: sacred   → urban     shape: single_test   system: conditions
  p3Shape: opportunity   opposition: law (duty)   disposition: neutral   agentRole: judge_asked_to_rule   scale: personal
slot 5:
  plotHookRolled: hook.blame_falls_on_outsiders, hook.scarcity_crisis, hook.assassination_succeeded
  reach: gold     setting: ruin     → urban     shape: query_prize   system: items
  p3Shape: contest   opposition: time   disposition: n/a   agentRole: trespasser   scale: company
slot 6:
  plotHookRolled: hook.compassionate_liberation, hook.impossible_bargain, hook.environmental_gauntlet
  reach: stone    setting: ruin     → urban, rural   shape: appointment   system: movement
  p3Shape: opportunity   opposition: uncanny   disposition: neutral   agentRole: competitor   scale: settlement
```

`plotHookTaken` is recorded per encounter in its package doc block and stamped into
`src/data/content-eval/plotHooks.ts` `usedBy` at closeout.

### Overrides, each with its reason

- **setting.** Every rolled class that expands to no settlement subtype is overridden to
  `urban` (plus `rural` where a hamlet version is honest). The ticket's scope is the
  everyday settlement board, and a template whose only class is `ruin` or `arcane` is
  off that board by construction.
- **reach.** Supplied by the ticket (`--reaches`); the packet's "no reach more than 2×"
  cap is bust by design.
- **slot 4 shape.** Rolled `single_test`; kept, with the fork on its second step decided
  by the mortal (`ActionStepBranch.decidedBy`): which house the arbiter rules for. That
  makes the rolled `judge_asked_to_rule` role real rather than decorative.
- **slot 6 opposition.** Rolled `uncanny`. It reads as the town's ground itself (the old
  fill under the site that nobody warned the mason about), with no magic in it.

## Systems quota targets

Contract floor is 3 (`COMPOSITION_SYSTEMS_QUOTA_MIN`).

- **Reach for:** seeds (slots 1, 2, 6), items by query (slot 5), knowledge / intelligence
  (slots 1, 3), threads (slot 2), movement (slot 3), place conditions (slot 6).
- **Avoid defaulting to:** a personal condition on the mortal as the failure penalty.
  It is already on most of the corpus. At most two slots use `apply_condition` on
  `$actor`.

## Anchors this batch intends to touch

| Anchor kind | Target across the batch |
|---|---|
| location (`$here`) | slot 6 leaves a condition on the town itself |
| cast member (`$cast:<key>`) | at least four slots name a counterparty the chip can point at (the house factor, the harbour master, the clerk, the rival bidder) |
| item / reward template | slots 4, 5, 6 |
| thread (`$ascendant` ↔ `$actor`) | slot 2 |
| favour / owes edge | slot 4 (and slot 6's appointment promise) |

**Avoid defaulting to:** a chip anchored only to the mortal's own condition.

## Over-exposed cards

Census taken 2026-09-29 from `libraryCardId` across `src/data/` and every package.

| Card | Times authored | Instruction |
|---|---|---|
| `card.boost.core` | 11 | **not as a special**. Let the deal fill supply it |
| `card.boost.signature.energy` | 8 | not at all |
| `card.undertow.signature.darkness` | 8 | at most once across the batch |
| `card.kindled_ambition.signature.spirit` · `card.heavy_hand.signature.force` | 6 each | at most once each |
| `card.mercy.core` · `card.compulsion.signature.mind` | 5 each | at most once each |

## Out of scope

- Expert and master content (THR-1678…THR-1681) and the second journeyman batch
  (THR-1677). This batch does not author toward their reaches.
- Any rule gate (guild rank, faction membership, hold). Stakes are fiction, not gates.
- New family tags, new condition ids, new node types.
- Tuning the window, the odds or the local offset. The batch is measured, never tuned
  to pass.
