# Batch brief — master-everyday (8 encounters + 2 appointment sequels)

**Drafted:** Claude Code (pickup lane, THR-1688), 2026-10-05 · **Approved:** lane decision under Christian's 2026-09-11 blanket approval of batch briefs (ruling 2; the footing THR-1677…THR-1680 ran on). Veto invited on the ticket.
**Ticket:** [THR-1688](https://linear.app/threadbare/issue/THR-1688) · **Design:** [`Docs/plans/2026-09-29-thr-1627-content-above-novice.md`](../2026-09-29-thr-1627-content-above-novice.md) § D3 The brief, § D4 Staging · **Follows:** [`expert-everyday-3-brief.md`](expert-everyday-3-brief.md) (THR-1680) · **Unblocked by:** THR-1687 (the cap's fair own-hex draw, `CAP_FILL_LOCAL_ORDER = 'template_hash'`, live on `main`)

## Why this batch

Measured on `main` @ `f905e996` before the batch (`npm run measure:roll-spread -- --coverage-only`):

```
reach          novice  journeyman      expert      master
eye               17          10           2           0<
gold              20           6           2           0<
heart             18           7           2           0<
iron              11           4           2           0<
shadow            13           3           2           0<
star               7           3           2           0<
stone              7           4           2           0<
veil               6           4           2           0<
total             99          41          16           0
journeyman 0 reach(es) under floor · expert 0 reach(es) under floor · master 8 reach(es) under floor
```

`npm run gameplay-report -- --seeds 42,99,7` (120 ticks, medium), same commit:

| | seed 42 | seed 99 | seed 7 |
|---|---|---|---|
| expert mean attempted | 0.22 | 0.23 | 0.20 |
| master mean attempted | 0.18 | 0.19 | 0.18 |
| master success | 0.740 | 0.691 | 0.785 |
| in-window share | 0.461 | 0.433 | 0.462 |

**The stop rule does not trip.** Every reach is under the master floor of 1, masters attempt
easier work than experts on all three seeds, and master success is above the 0.70 ceiling on
42 and 7. The batch is **eight, one per reach**: the floor is 1 and every reach is at 0, so
the count is the floor, not a quota.

## Game design — fixed before any premise (director ruling 2026-08-24)

### The binding rows

| Slot | id | reach (binding) | steps (reach · difficulty) | mean | window fit | shape | settings | consequence hand (binding) |
|---|---|---|---|---|---|---|---|---|
| 1 | `encounter.town.forged_charter_inquest` | eye | eye 0.74 → eye 0.80 | 0.77 | 0.91 | **appointment** | `urban` | `knowledge` + `story_seed` |
| 2 | `encounter.town.cathedral_loan` | gold | gold 0.74 → gold 0.80 | 0.77 | 0.91 | danger → confrontation → aftermath | `urban` | `relationship` + `possession` |
| 3 | `encounter.town.granary_riot` | heart | heart 0.76 → heart 0.80 | 0.78 | 0.92 | danger → confrontation → aftermath | `urban` | `relationship` + `story_seed` |
| 4 | `encounter.town.judicial_duel` | iron | eye 0.72 → iron 0.80 → iron 0.84 | 0.787 | 0.927 | investigation → resolution | `urban` | `thread` + `place` |
| 5 | `encounter.town.coiners_mint` | shadow | shadow 0.75 → shadow 0.81 | 0.78 | 0.92 | investigation → resolution | `urban` | `standing` + `possession` |
| 6 | `encounter.town.ducal_nativity` | star | star 0.74 → star 0.82 | 0.78 | 0.92 | opt-in complication | `urban` | `drive` + `place` |
| 7 | `encounter.town.cathedral_vault` | stone | stone 0.76 → stone 0.82 | 0.79 | 0.93 | opt-in complication | `rural`, `urban` | `relationship` + `place` |
| 8 | `encounter.town.restless_ossuary` | veil | veil 0.74 → veil 0.80 → veil 0.84 | 0.793 | 0.933 | **query prize** | `urban` | `standing` + `omen` |

- **Master band.** Every mean sits in the plan's 0.72–0.85 and reads *severe*. Window fit
  (mean + 0.14) is 0.91–0.93, inside the master band (capability ≥ 0.85) and clear of its
  lower edge. Keep every step between **0.72 and 0.85**; a step outside that range is a
  brief breach, not a flourish.
- **`rarityTier: 2`, `scale: 'local'`, `intrinsicTier: 'shaping'` on all eight**, as the
  expert batches. `check:encounter` recomputes the hand from id + reach + rarity, so **the
  ids and the tier above are final**.
- **Everyday by construction.** Every slot declares `urban` and/or `rural`. No guild-rank,
  army, monster, fight or confront gate. Every id sits under `encounter.town.*`.
  **Never `encounter.slice.*`.**
- **Primary reach = the reach of most rolled steps** (`primaryReachOf`). Slot 4: two Iron
  against one Eye.
- **Not colliding with the existing experts** on each reach. Read the two expert encounters
  on your reach (`npm run measure:roll-spread -- --coverage-only` names none, so grep
  `src/data/encounters/` for `primaryReach`/the step reaches) and do not repeat their verb.

### Premises, each inside the fixed design

A master is someone the realm, the cathedral, the mint and the duke send for by name. **Put
the master stakes in who sits across the table and what is at risk, never in a rule gate.**

1. **The Forged Charter** (eye, urban). The town's charter of liberties, the parchment that
   frees its market from the count's tolls, is accused of being forged. The count's lawyers
   have brought a rival copy. The master reader is sent for to examine both before the
   inquest. Step 1 reads the hands, inks and seals. Step 2 finds who made the false one.
   **Appointment:** the findings must be read out at the inquest in the town hall on court
   day, with the count's steward as counterparty. Opposition: the count's claim on the
   town's tolls (faction, territory). Agent's role: an outsider in a hostile town hall.
   Kept branch **`town.charter_inquest_heard`**, missed branch
   **`town.charter_inquest_defaulted`**: both **seed-only** (`drawable: false`, THR-1526),
   short one-step scenes in `src/data/encounters/charter-inquest-sequels.ts`, modelled on
   `src/data/encounters/mill-lease-sequels.ts`.
2. **The Cathedral Loan** (gold, urban). The chapter has defaulted on the loan that built
   the nave. The lenders' bailiffs hold a lawful writ and are at the door to inventory the
   altar plate. The master is asked to save the cathedral's treasure without breaking the
   law. Step 1 (danger) stops the inventory with a better offer. Step 2 (confrontation) is the
   lenders' factor across a table. Opposition: the law doing its duty. Hand: the factor or
   the dean (relationship); the plate itself, or a pledge taken in its place (possession).
3. **The Granary** (heart, urban). Bread prices doubled overnight, and a crowd is at the
   abbey granary's gate. The abbot will not open it, because the grain is the abbey's seed
   for next year. The master is asked by both sides to judge how much leaves the granary.
   Step 1 (danger) holds the crowd back from the gate. Step 2 (confrontation) is the ruling
   before abbot and crowd. Opposition: a frightened crowd guarding what it thinks is its own
   (the rolled *beast (territory)*, read as panic). Hand: the abbot or the crowd's speaker
   (relationship); a placeless sequel (story_seed): who comes back when the grain runs out.
4. **The Judicial Duel** (iron, urban). A land dispute will be settled by trial by combat in
   the market square, and the master has been hired as one side's champion. The other
   side's champion fights with a style no one in the town has seen. Step 1 (Eye) watches the
   other champion at practice to learn it. Steps 2–3 are the bout itself. Opposition: the
   order that sent the rival champion (faction, orders). Hand: a thread the duel ties to the
   master (thread); what the verdict leaves true of the disputed land (place).
5. **The Coiners** (shadow, urban). False coin is leaving the town mint, and the mint-master
   is the master's old friend. The master is asked quietly to find the coiners before the
   crown's assayer arrives. Step 1 finds where the false coin is struck. Step 2 takes the
   dies without a hue and cry. Opposition: the mortal's own trait, read from the graph (a
   loyal mortal protecting a friend, a stubborn one refusing to stop). Hand: the master's
   standing in the town (standing); the false dies or the coin itself (possession).
6. **The Duke's Nativity** (star, urban). The duke's heir is born, and the cathedral's
   astrologers have cast a flattering nativity. The master was not asked, and sees in the
   same sky a hard year ahead for the child. The master **chooses** whether to tell the duke
   (opt-in). Step 1 is the reading itself; step 2 is the telling, against the court
   astrologers. Opposition: a court in a panic of loyalty (the rolled *beast (panic)*, read
   as people). Hand: what the reading leaves the master wanting (drive); what it leaves true
   of the town (place).
7. **The Vault** (stone, urban or rural market town). The abbey church's new vault is
   finished, and the wooden centering under it must be struck before the winter rains swell
   it. The chapter will blame the master if the vault falls. The master **chooses** whether
   to strike it now or wait for the spring (opt-in). Step 1 tests the vault; step 2 strikes
   the centering. Opposition: time. Hand: the abbot or the master's own foreman
   (relationship); what the vault leaves true of the town (place).
8. **The Ossuary** (veil, urban). The charnel house under the cathedral is full, the dead in
   it will not lie still, and the town's guilds each want their own bones kept. The master
   is asked to judge which dead are moved, and to lay the rest. Step 1 reads which dead are
   restless and why. Step 2 lays them. Step 3 is the ruling between the guilds. **The prize
   is drawn by tag** through a step `rewardPool` (what is found among the old bones).
   Opposition: the dead's indifference to the living's claims. Hand: the master's standing
   with the guilds (standing); an omen the laying leaves behind (omen).

### How each drawn family is wired in context

Run `npm run draw:consequences -- <id> --reach <reach> --rarity 2` to print the exact
effect kinds each family accepts, and use only those.

- **slot 1 `knowledge`**: `intelligence` / `spawn_clue` / `sharpen_clue`. Who forged the
  false copy, and for whom.
- **slot 1 `story_seed`**: the appointment itself. An `encounter_seed` carrying an
  `appointment` block (`locationId: '$here'`, `counterpartyId: '$cast:<steward>'`, a
  `missed` branch). The parent's prose may name the place and the day (prose rule 7b's one
  lawful exception).
- **slots 2, 3, 7 `relationship`**: `relationship_change` / bond effects between `$actor`
  and a named cast member.
- **slots 2, 5 `possession`**: an item granted, taken or pledged. Name it.
- **slot 3 `story_seed`**: `encounter_seed`, placeless, `query` by a family tag that exists,
  or a `templateId` that exists.
- **slot 4 `thread`**: the family's effect kinds as `draw:consequences` prints them.
- **slots 4, 6, 7 `place`**: a location condition with `targetLocationId: '$here'`, or
  `spawn_unique_location`.
- **slots 5, 8 `standing`**: reputation with the settlement or a named faction.
- **slot 6 `drive`**: the family's effect kinds as `draw:consequences` prints them (an
  ambition or drive written on the mortal).
- **slot 8 `omen`**: the family's effect kinds as `draw:consequences` prints them.
- **slot 8 query prize (the batch floor)**: a step `rewardPool` whose entry is tag-filtered
  (`reward_draw` has no `query` field). Working shapes:
  `pawnbrokers-strongroom.package.json`, `flood-dyke-mending.package.json`. Use a tag in
  `reference/content-tag-catalog.generated.md` that at least one item wears.

### Payoffs, prizes, penalties — band by band

| Band | What it pays or costs, across the eight |
|---|---|
| `critical_success` | the drawn prize lands at its best, and the people who sent for the master remember it |
| `success` | the drawn prize lands |
| `success_at_cost` | the prize lands and the master carries something for it: a condition, a debt, an enemy |
| `failure` | the prize does not land, the drawn penalty family fires, and the story goes on |
| `critical_failure` | the penalty lands hard, and the band says plainly what it cost |

**Cool failure.** None of the eight kills, jails or brands. **Master failure is the name
before the purse**: the realm stops sending for them, a rival is believed instead, a
friendship ends. Say plainly why it costs more for someone this good.

### Cost channels and grants

At most one authored Heavy Hand (`costs.detectionDelta`) across the batch (slot 5 may take
it), and no special with two cost channels. No card grants content. Every drawn family
lands through the aftermath, where it can be band-keyed.

### Hands

Every nudge-bearing step authors **0–2 specials** and declares a `deal` fill.

## Family and setting envelope

- **Family:** `encounter.town.*`. No new family tag is minted.
- **Setting classes:** as the table says; each declared class gets an opening.

## Variance targets

| Axis | Target across the batch |
|---|---|
| Reach spread | one per reach (gauge, above) |
| Decision shapes | appointment 1 · danger→confrontation 2 · investigation→resolution 2 · opt-in 2 · query prize 1 |
| Appointment | slot 1, with both sequels authored |
| Query prize | slot 8 |
| Tone | at most two resolve grim on their success side; slot 3 and slot 7 end warm on success |
| Step counts | six 2-step · two 3-step |
| P3 stake shapes | as rolled (packet below) |
| Opposition | faction ×2 · law · panic ×2 (read as people) · own trait · time · the dead's indifference |
| Agent's role | as rolled; slot 7 *the_target* means the chapter will blame them |
| Scale | ≥1 settlement-or-larger (slots 1, 3, 7, 8) |

## Rolled constraints

```
npm run draw:packet -- master-everyday --slots 8 --reaches eye,gold,heart,iron,shadow,star,stone,veil --tier 2 --ids encounter.town.forged_charter_inquest,encounter.town.cathedral_loan,encounter.town.granary_riot,encounter.town.judicial_duel,encounter.town.coiners_mint,encounter.town.ducal_nativity,encounter.town.cathedral_vault,encounter.town.restless_ossuary
slot 1:  encounter.town.forged_charter_inquest
  plotHookRolled: hook.haunt_resolution, hook.desperate_escort, hook.meeting_to_keep
  reach: eye                       setting: wayside
  shape: appointment               system: movement
  p3Shape: mystery                 opposition: faction (territory)
  disposition: hostile             agentRole: trespasser
  scale: settlement
  consequenceHand: knowledge, story_seed
slot 2:  encounter.town.cathedral_loan
  plotHookRolled: hook.political_labyrinth, hook.death_and_return, hook.rebuilding_trust
  reach: gold                      setting: battlefield
  shape: danger_confrontation_aftermath system: movement
  p3Shape: threat                  opposition: law (duty)
  disposition: hostile             agentRole: competitor
  scale: company
  consequenceHand: relationship, possession
slot 3:  encounter.town.granary_riot
  plotHookRolled: hook.civil_unrest, hook.relic_awakening, hook.the_great_building
  reach: heart                     setting: sacred
  shape: danger_confrontation_aftermath system: cards
  p3Shape: plea                    opposition: beast (territory)
  disposition: open                agentRole: judge_asked_to_rule
  scale: settlement
  consequenceHand: relationship, story_seed
slot 4:  encounter.town.judicial_duel
  plotHookRolled: hook.forbidden_knowledge_price, hook.monster_eradication, hook.swindled_family
  reach: iron                      setting: stronghold
  shape: puzzle_investigation_resolution system: traits
  p3Shape: mystery                 opposition: faction (orders)
  disposition: friendly            agentRole: client_who_is_owed
  scale: region
  consequenceHand: thread, place
slot 5:  encounter.town.coiners_mint
  plotHookRolled: hook.reconciliation, hook.stronghold_raid, hook.death_and_return
  reach: shadow                    setting: stronghold
  shape: puzzle_investigation_resolution system: cards
  p3Shape: unmitigated_risk        opposition: own_trait
  disposition: neutral             agentRole: bystander_pulled_in
  scale: personal
  consequenceHand: standing, possession
slot 6:  encounter.town.ducal_nativity
  plotHookRolled: hook.builders_dilemma, hook.death_and_return, hook.civil_unrest
  reach: star                      setting: sacred
  shape: opt_in_complication       system: items
  p3Shape: obstruction             opposition: beast (panic)
  disposition: open                agentRole: competitor
  scale: personal
  consequenceHand: drive, place
slot 7:  encounter.town.cathedral_vault
  plotHookRolled: hook.impossible_heist, hook.meeting_to_keep, hook.long_road
  reach: stone                     setting: rural
  shape: opt_in_complication       system: movement
  p3Shape: opportunity             opposition: time (the clock is the enemy)
  disposition: n/a                 agentRole: the_target
  scale: settlement
  consequenceHand: relationship, place
slot 8:  encounter.town.restless_ossuary
  plotHookRolled: hook.haunted_relic, hook.the_convergence, hook.ritual_of_undeath
  reach: veil                      setting: arcane
  shape: query_prize               system: favors
  p3Shape: contest                 opposition: terrain (indifference)
  disposition: n/a                 agentRole: judge_asked_to_rule
  scale: settlement
  consequenceHand: standing, omen
```

The packet's spread check passed every cap (no shape, setting, opposition or role more than
2×; ≤2 hostile; ≥1 appointment; ≥1 query prize).

`plotHookTaken` is recorded per encounter in its package doc block and stamped into
`src/data/content-eval/plotHooks.ts` `usedBy` at closeout.

### Overrides, each with its reason

- **setting.** Every rolled class that expands to no settlement subtype is overridden to
  `urban` (slot 7 keeps its rolled `rural` and adds `urban`). The ticket's scope is the
  everyday settlement board. The rolled class survives as the scene's place inside the
  town: slot 2 *battlefield* → the cathedral steps where the bailiffs stand; slots 3 and 6
  *sacred* → the abbey granary, the cathedral; slots 4 and 5 *stronghold* → the lists in the
  square, the mint's strongroom; slot 8 *arcane* → the charnel house.
- **reach.** Supplied by the gauge (`--reaches`).
- **slot 3 and slot 6 opposition.** Rolled *beast*. Read as people in a panic: a crowd at a
  gate, a court that flatters. No monster gate is permitted on an everyday encounter.
- **system targets.** `movement` ×3 is advisory; the appointment (slot 1) carries the
  batch's movement. Slots 2 and 7 may satisfy it or not.

## Systems quota targets

Contract floor is 3 (`COMPOSITION_SYSTEMS_QUOTA_MIN`).

- **Reach for:** clues and intelligence (slot 1), the appointment (slot 1), relationships
  (slots 2, 3, 7), items (slots 2, 5, 8), seeds (slots 1, 3), location conditions
  (slots 4, 6, 7), reputation (slots 5, 8), drives (slot 6), omens (slot 8).
- **Avoid defaulting to:** a personal condition on the mortal as the failure penalty. At
  most two slots use `apply_condition` on `$actor`.

## Anchors this batch intends to touch

| Anchor kind | Target across the batch |
|---|---|
| location (`$here`) | slot 1's appointment; slots 4, 6, 7 place conditions |
| cast member (`$cast:<key>`) | all eight slots name a counterparty the chip can point at |
| item / reward template | slots 2, 5, 8 |
| clue / intelligence | slot 1 |
| seed / sequel | slots 1, 3 |

**Known renderer defect (THR-1685).** On a board draw `{target}` may read as the
settlement. For a person, use a chip noun that does not interpolate `{target}`.

## Over-exposed cards

Carried from the expert batches.

| Card | Instruction |
|---|---|
| `card.boost.core` | **not as a special**. Let the deal fill supply it |
| `card.boost.signature.energy` | not at all |
| `card.undertow.signature.darkness` | at most once across the batch (slot 5 or 8) |
| `card.kindled_ambition.signature.spirit` · `card.heavy_hand.signature.force` | at most once each (slot 6 and slot 5 respectively, if used) |
| `card.mercy.core` · `card.compulsion.signature.mind` | at most once each (slot 3 and slot 2 respectively, if used) |

## Batch mechanics that bit earlier batches (impediments #1109–#1120, #1150)

- Never mint under `encounter.slice.*`. The hand is drawn from the id.
- `intrinsicTier: 'shaping'` on all eight.
- At master difficulty the proof ascendant loses most natural runs. Take live evidence from
  a seed sweep plus a pinned band, and read success-side rows on a failed run as *not
  exercised*, not proved.
- The dry-run compile misses the gates `check:encounter` runs (#1114). Gate packages with
  `check:encounter -- --package` before compiling.
- There is no `$companion` sentinel (#1115).
- Imperative lexicon: card names must use a verb from the imperative lexicon.

## Out of scope

- Any rule gate (guild rank, faction membership, hold).
- New condition ids and new node types.
- Tuning the window, the odds or the local offset. Measured, never tuned to pass.
- Masters' fights (plan D5).
