# Batch brief — master-everyday-2 (8 encounters + 2 appointment sequels)

**Drafted:** Claude Code (pickup lane, THR-1757), 2026-10-14 · **Approved:** lane decision under Christian's 2026-09-11 blanket approval of batch briefs (ruling 2; the footing THR-1688's master batch ran on). Veto invited on the ticket.
**Ticket:** [THR-1757](https://linear.app/threadbare/issue/THR-1757) · **Design:** [`Docs/plans/2026-10-13-thr-1757-master-work-reaches-masters.md`](../2026-10-13-thr-1757-master-work-reaches-masters.md) § D1 the route, § D2 batches and the stop rule · **Follows:** [`master-everyday-brief.md`](master-everyday-brief.md) (THR-1688, master batch 1)

## Why this batch

Measured on `main` @ `0fab5f38` before the batch (`npm run measure:master-band`, seeds 42 / 99 / 7, 120 ticks):

| | seed 42 | seed 99 | seed 7 |
|---|---|---|---|
| expert mean attempted | 0.297 | 0.290 | 0.265 |
| master mean attempted | 0.230 | 0.260 | 0.264 |
| master success | 0.594 | 0.538 | 0.623 |

Pooled: own-master work on the board on **16.7%** of master commits; the cap removed the last own-master entry on 154 of 162 cut commits; q = 0.163, t = 0.917. Masters chose master-band work 7.1% of the time.

**The stop rule does not trip.** Masters attempt easier work than experts on seeds 42 and 99. `npm run measure:roll-spread -- --coverage-only` shows every reach at exactly one master template (floor 1), so the batch is **eight, one per reach**: it takes K from 1 to 2.

## Game design — fixed before any premise (director ruling 2026-08-24)

### The binding rows

| Slot | id | reach (binding) | steps (reach · difficulty) | mean | window fit | shape | settings | consequence hand (binding) |
|---|---|---|---|---|---|---|---|---|
| 1 | `encounter.town.poisoned_feast` | eye | eye 0.74 → eye 0.80 | 0.77 | 0.91 | seeded sequel | `urban` | `secret` + `story_seed` |
| 2 | `encounter.town.salt_monopoly` | gold | gold 0.74 → gold 0.80 | 0.77 | 0.91 | seeded sequel | `urban` | `possession` + `story_seed` |
| 3 | `encounter.town.hostage_exchange` | heart | heart 0.74 → heart 0.80 | 0.77 | 0.91 | investigation → resolution | `urban`, `rural` | `relationship` + `companion` |
| 4 | `encounter.town.tourney_marshal` | iron | iron 0.76 → iron 0.80 | 0.78 | 0.92 | danger → confrontation → aftermath | `urban` | `condition` + `secret` |
| 5 | `encounter.town.guildhall_spy` | shadow | shadow 0.78 | 0.78 | 0.92 | single test | `urban` | `story_seed` + `membership` |
| 6 | `encounter.town.easter_reckoning` | star | star 0.74 → star 0.82 | 0.78 | 0.92 | **appointment** | `urban` | `drive` + `omen` |
| 7 | `encounter.town.hill_conduit` | stone | stone 0.76 → stone 0.82 | 0.79 | 0.93 | opt-in complication | `rural`, `urban` | `condition` + `drive` |
| 8 | `encounter.town.witch_trial` | veil | veil 0.74 → veil 0.80 → veil 0.84 | 0.793 | 0.933 | **query prize** | `urban` | `relationship` + `secret` |

- **Master band.** Every step sits between **0.72 and 0.85**; every mean reads *severe*. Window fit (mean + 0.14) is 0.91–0.93, inside the master band (capability ≥ 0.85).
- **`rarityTier: 2`, `scale: 'local'`, `intrinsicTier: 'shaping'` on all eight.** `check:encounter` recomputes the hand from id + reach + rarity, so **the ids and the tier above are final**.
- **Everyday by construction.** Every slot declares `urban` and/or `rural`. No guild-rank, army, monster, fight or confront gate. Every id sits under `encounter.town.*`. **Never `encounter.slice.*`.**
- **No repeated verbs** (plan D2). Each slot was chosen against its reach's master and two experts:

| Reach | already on the board (master · experts) | this batch's verb |
|---|---|---|
| eye | read a forged charter · survey a boundary, read a toll writ | read a poisoning at a feast, where the cup was the master's |
| gold | save cathedral plate from bailiffs · arbitrate a debt, bid at a mill lease | win a monopoly licence at the duke's chancery |
| heart | rule at a granary riot · mediate a feud, settle a wake | broker a hostage exchange that a greedy keeper is holding up |
| iron | champion a judicial duel · keep a winter wolf-watch | marshal a tourney and keep a grudge bout from killing |
| shadow | find the coiners · raid a tithe barn, crack a strongroom | unmask a rival city's spy on the council before the vote |
| star | read a ducal nativity · dispute a comet, cast an almanac | correct the feast calendar and defend it before the synod |
| stone | strike a vault's centering · shore a bell tower, mend a dyke | bring clean water down from the hills in a cut conduit |
| veil | lay an ossuary's dead · hear a drowned man, judge an oath-breaker | judge whether an accused woman is touched, before the town burns her |

### Premises, each inside the fixed design

A master is someone the realm, the cathedral, the chancery and the council send for by name. **Put the master stakes in who sits across the table and what is at risk, never in a rule gate.**

1. **The Poisoned Feast** (eye, urban). At the guild's feast in the abbey refectory the guild-master drank and fell. The cup was the one poured for the master, who is sent for by the coroner to read the table before the coroner rules — and who is, until they read it, the likeliest suspect *and* the intended victim. Step 1 reads the table (which cup, what was in it). Step 2 reads the guests (whose hand poured). Opposition: the mortal's own trait, read from the graph (a stubborn mortal who will not let it go, an oathbound one who swore to the guild). **Seeded sequel:** the poisoner's patron learns the master lived and read it; a later encounter finds them (`encounter_seed`, by `query` on a family tag that exists, or a `templateId` that exists). Hand: who wanted the master dead and why (`secret`: `secret_discovery` / `hidden_mark` / `favor_creation`); the sequel (`story_seed`).
2. **The Salt Monopoly** (gold, urban). The duke's chancery is selling the licence to the region's salt for ten years, and the town council has sent its master merchant to win it against a rival town's house. The chancery clerk holds the duke's sealed reserve and enforces it to the letter. The master is the one the council will blame if the salt goes to the rival. Step 1 reads the room and builds the purse. Step 2 closes at the clerk's table. Opposition: the law doing its duty. **Seeded sequel:** the losing house's factor does not forget (`encounter_seed`). Hand: the licence itself, or the pledge given for it (`possession`, a named item); the sequel (`story_seed`).
3. **The Hostage Exchange** (heart, urban or rural market town). Two houses exchange sons held as surety for a peace, at the town bridge at noon. The captain keeping one boy wants a ransom on top before he hands him over, and both houses' men have their hands on their hilts. The master is pulled in because both fathers trust them. Step 1 (investigation) learns what the captain, the houses and the boys each actually want. Step 2 (resolution) makes the exchange on the bridge. Opposition: a rival's greed (the captain). Hand: a bond with a named house's heir or the captain (`relationship`: `bond_change`); one of the boys, or the captain's sergeant, who leaves with the master (`companion`: `grant_companion`).
4. **The Tourney Marshal** (iron, urban). The master is made marshal of the town's tourney. A knightly order claims its doctrine's right to fight a grudge bout to the yield, *à outrance*, against a young lord who insulted it, and the young lord will not yield. Step 1 (danger) holds the lists when the bout turns. Step 2 (confrontation) faces the order's champion across the barrier. Opposition: a faction's doctrine. Hand: what the day leaves on the town or the mortal (`condition`: a location condition on `$here` such as a Festival, or a condition on `$actor`); what the master learns or is owed (`secret`: a favour from the young lord's house, or a hidden mark).
5. **The Spy in the Guildhall** (shadow, urban). The council votes at the next bell on whether to close the town's gates to a rival city's trade. One councillor is that city's agent. The master is asked to name them before the vote, quietly, so the council does not tear itself apart. One step: shadow 0.78. Opposition: the mortal's own trait, read from the graph. Hand: the spy's handler, or the council's quiet gratitude, comes back (`story_seed`); the council's inner circle takes the master in, or a guild casts them out (`membership`: `membership_change`).
6. **The Easter Reckoning** (star, urban). The cathedral's tables put the great feast a week wrong this year, and the bishop's canons will hear no correction. The master reckons the true date from the moon and the equinox, and must defend it at the synod in the chapter house on the synod day, with the dean as counterparty. Step 1 is the reckoning. Step 2 proves it before the canons. Opposition: a faction's doctrine. **Appointment:** the reckoning must be read at the synod (`locationId: '$here'`, `counterpartyId: '$cast:<dean>'`, a `missed` branch). Kept branch **`town.easter_reckoning_heard`**, missed branch **`town.easter_reckoning_defaulted`**: both **seed-only** (`drawable: false`, THR-1526), short one-step scenes in `src/data/encounters/easter-reckoning-sequels.ts`, modelled on `src/data/encounters/charter-inquest-sequels.ts`. Hand: what the reckoning leaves the master wanting (`drive`); an omen the corrected (or uncorrected) feast leaves behind (`omen`).
7. **The Hill Conduit** (stone, rural or urban market town). The town's wells are going foul. The master **chooses** whether to bring clean water down from the hill springs in a cut conduit across the lord's high pasture, where his herdsmen guard their grazing and their bull (opt-in). Step 1 surveys the fall across the hill. Step 2 cuts and lays the conduit. Opposition: a herd and its herdsmen guarding their ground (the rolled *beast (territory)*; a bull in a field, never a monster gate). Hand: what the water leaves true of the town, or on the mortal (`condition`: a location condition on `$here`, or a condition on `$actor`); what the work leaves the master wanting (`drive`).
8. **The Witch Trial** (veil, urban). The town has a woman in the stocks for witchcraft and a pyre built in the square. The magistrate, owing the master an old favour, sends for them to say whether she is touched before the town burns her. Step 1 reads her. Step 2 reads the house where the harm began. Step 3 is the ruling before the magistrate and the crowd. **The prize is drawn by tag** through a step `rewardPool` (what is found in her house, or what she gives). Opposition: the indifference of what really lies under the harm. Hand: the accused woman, or the magistrate (`relationship`: `bond_change`); what the master learns of who or what really did the harm (`secret`).

### How each drawn family is wired in context

Run `npm run draw:consequences -- <id> --reach <reach> --rarity 2` to print the exact effect kinds each family accepts, and use only those.

| Family | Effect kinds | Slots |
|---|---|---|
| `secret` | `hidden_mark` / `secret_discovery` / `favor_creation` | 1, 4, 8 |
| `story_seed` | `encounter_seed` (placeless; `query` by a family tag that exists, or a `templateId` that exists) | 1, 2, 5 |
| `possession` | an item granted, taken or pledged; name it | 2 |
| `relationship` | `bond_change` between `$actor` and a named cast member | 3, 8 |
| `companion` | `grant_companion` / `remove_companion` | 3 |
| `condition` | `condition_attachment` / `apply_condition` / `remove_condition` / `attachment_grant` | 4, 7 |
| `membership` | `membership_change` | 5 |
| `drive` | the family's kinds as `draw:consequences` prints them | 6, 7 |
| `omen` | the family's kinds as `draw:consequences` prints them | 6 |
| query prize (slot 8) | a step `rewardPool` whose entry is tag-filtered. Working shapes: `restless-ossuary.package.json`, `pawnbrokers-strongroom.package.json`. Use a tag in `reference/content-tag-catalog.generated.md` that at least one item wears | 8 |

### Payoffs, prizes, penalties — band by band

| Band | What it pays or costs, across the eight |
|---|---|
| `critical_success` | the drawn prize lands at its best, and the people who sent for the master remember it |
| `success` | the drawn prize lands |
| `success_at_cost` | the prize lands and the master carries something for it: a condition, a debt, an enemy |
| `failure` | the prize does not land, the drawn penalty family fires, and the story goes on |
| `critical_failure` | the penalty lands hard, and the band says plainly what it cost |

**Cool failure.** None of the eight kills, jails or brands the mortal. **Master failure is the name before the purse**: the council sends for someone else next time, a rival is believed instead, a house stops trusting them. Say plainly why it costs more for someone this good. Slot 8's failure is the hardest in the batch (the woman burns, or the master is blamed for staying the pyre); state it plainly, never luridly.

### Cost channels and grants

At most one authored Heavy Hand (`costs.detectionDelta`) across the batch (slot 5 may take it), and no special with two cost channels. No card grants content. Every drawn family lands through the aftermath, where it can be band-keyed.

### Hands

Every nudge-bearing step authors **0–2 specials** and declares a `deal` fill.

## Family and setting envelope

- **Family:** `encounter.town.*`. No new family tag is minted.
- **Setting classes:** as the table says; each declared class gets an opening.

## Variance targets

| Axis | Target across the batch |
|---|---|
| Reach spread | one per reach (gauge, above) |
| Decision shapes | seeded sequel 2 · investigation→resolution 1 · danger→confrontation 1 · single test 1 · appointment 1 · opt-in 1 · query prize 1 |
| Appointment | slot 6, with both sequels authored |
| Query prize | slot 8 |
| Tone | at most two resolve grim on their success side; slots 3 and 7 end warm on success |
| Step counts | one 1-step · six 2-step · one 3-step |
| Scale | ≥1 settlement-or-larger (slots 2, 5, 6, 7, 8) |

## Rolled constraints

```
npm run draw:packet -- master-everyday-2 --slots 8 --reaches eye,gold,heart,iron,shadow,star,stone,veil --tier 2 --ids encounter.town.poisoned_feast,encounter.town.salt_monopoly,encounter.town.hostage_exchange,encounter.town.tourney_marshal,encounter.town.guildhall_spy,encounter.town.easter_reckoning,encounter.town.hill_conduit,encounter.town.witch_trial
slot 1:  encounter.town.poisoned_feast
  plotHookRolled: hook.forbidden_knowledge_price, hook.followed_on_the_road, hook.scarcity_crisis
  reach: eye                       setting: sacred
  shape: seeded_sequel             system: omens
  p3Shape: choice                  opposition: own_trait
  disposition: open                agentRole: the_target
  scale: personal
  consequenceHand: secret, story_seed
slot 2:  encounter.town.salt_monopoly
  plotHookRolled: hook.underground_city, hook.artifact_recovery, hook.deck_reading_gone_wrong
  reach: gold                      setting: sacred
  shape: seeded_sequel             system: carryover
  p3Shape: opportunity             opposition: law (duty)
  disposition: wary                agentRole: the_target
  scale: company
  consequenceHand: possession, story_seed
slot 3:  encounter.town.hostage_exchange
  plotHookRolled: hook.mentors_test, hook.oath_breaking_scandal, hook.rebuilding_trust
  reach: heart                     setting: battlefield
  shape: puzzle_investigation_resolution system: items
  p3Shape: choice                  opposition: rival_agent (greed)
  disposition: wary                agentRole: bystander_pulled_in
  scale: settlement
  consequenceHand: relationship, companion
slot 4:  encounter.town.tourney_marshal
  plotHookRolled: hook.monster_eradication, hook.siege_and_hold, hook.rebuilding_trust
  reach: iron                      setting: rural
  shape: appointment               system: traits
  p3Shape: threat                  opposition: faction (doctrine)
  disposition: hostile             agentRole: competitor
  scale: company
  consequenceHand: condition, secret
slot 5:  encounter.town.guildhall_spy
  plotHookRolled: hook.stranger_bargain, hook.stronghold_mobilization, hook.assassination_succeeded
  reach: shadow                    setting: wayside
  shape: single_test               system: conditions
  p3Shape: opportunity             opposition: own_trait
  disposition: neutral             agentRole: judge_asked_to_rule
  scale: region
  consequenceHand: story_seed, membership
slot 6:  encounter.town.easter_reckoning
  plotHookRolled: hook.gods_fall, hook.prophetic_investigation, hook.builders_dilemma
  reach: star                      setting: stronghold
  shape: appointment               system: cards
  p3Shape: mystery                 opposition: faction (doctrine)
  disposition: hostile             agentRole: competitor
  scale: region
  consequenceHand: drive, omen
slot 7:  encounter.town.hill_conduit
  plotHookRolled: hook.followed_on_the_road, hook.underground_city, hook.shifting_shape
  reach: stone                     setting: rural
  shape: opt_in_complication       system: movement
  p3Shape: obstruction             opposition: beast (territory)
  disposition: wary                agentRole: trespasser
  scale: personal
  consequenceHand: condition, drive
slot 8:  encounter.town.witch_trial
  plotHookRolled: hook.grief_absorption, hook.death_and_return, hook.trial_by_combat
  reach: veil                      setting: stronghold
  shape: query_prize               system: traits
  p3Shape: unmitigated_risk        opposition: terrain (indifference)
  disposition: n/a                 agentRole: client_who_is_owed
  scale: settlement
  consequenceHand: relationship, secret
```

The packet's spread check passed every cap (no shape, setting, opposition or role more than 2×; ≤2 hostile; ≥1 appointment; ≥1 query prize). `plotHookTaken` is recorded per encounter in its package doc block and stamped into `src/data/content-eval/plotHooks.ts` `usedBy` at closeout.

### Overrides, each with its reason

- **setting.** Every rolled class that expands to no settlement subtype is overridden to `urban` (slots 3 and 7 add `rural`). The ticket's scope is the everyday settlement board. The rolled class survives as the scene's place inside the town: slot 1 *sacred* → the abbey refectory; slot 2 *sacred* → the chancery in the cathedral close; slot 3 *battlefield* → the bridge with both houses' men drawn up; slot 4 *rural* → the tourney field outside the walls; slot 5 *wayside* → the guildhall's back stair and the inn where the councillors take their ale; slot 6 *stronghold* → the chapter house; slot 8 *stronghold* → the magistrate's hall and the stocks.
- **reach.** Supplied by the gauge (`--reaches`).
- **slot 4 shape.** Rolled *appointment* (a second one). Overridden to **danger → confrontation → aftermath**: one appointment per batch keeps the sequel cost bounded (two seed-only scenes each), and a tourney is already a set day the mortal is at, so a booking adds nothing. Slot 6 keeps the batch's appointment.
- **slot 7 opposition.** Rolled *beast (territory)*. Read as a herd and its herdsmen guarding their pasture. No monster gate is permitted on an everyday encounter.
- **system targets.** Advisory; slot 6's appointment carries the batch's movement.

## Systems quota targets

Contract floor is 3 (`COMPOSITION_SYSTEMS_QUOTA_MIN`).

- **Reach for:** secrets and favours (slots 1, 4, 8), seeds (slots 1, 2, 5), the appointment (slot 6), items (slots 2, 8), relationships (slots 3, 8), companions (slot 3), membership (slot 5), location conditions (slots 4, 7), drives (slots 6, 7), omens (slot 6), reputation (any slot, as a third system).
- **Avoid defaulting to:** a personal condition on the mortal as the failure penalty. At most two slots use `apply_condition` on `$actor`.

## Anchors this batch intends to touch

| Anchor kind | Target across the batch |
|---|---|
| location (`$here`) | slot 6's appointment; slots 4, 7 place conditions |
| cast member (`$cast:<key>`) | all eight slots name a counterparty the chip can point at |
| item / reward template | slots 2, 8 |
| secret / favour | slots 1, 4, 8 |
| seed / sequel | slots 1, 2, 5, 6 |
| companion | slot 3 |
| faction membership | slot 5 |

**Known renderer defect (THR-1685).** On a board draw `{target}` may read as the settlement. For a person, use a chip noun that does not interpolate `{target}`.

## Over-exposed cards

Carried from the expert and master batches.

| Card | Instruction |
|---|---|
| `card.boost.core` | **not as a special**. Let the deal fill supply it |
| `card.boost.signature.energy` | not at all |
| `card.undertow.signature.darkness` | at most once across the batch (slot 5 or 8) |
| `card.kindled_ambition.signature.spirit` · `card.heavy_hand.signature.force` | at most once each (slot 7 and slot 5 respectively, if used) |
| `card.mercy.core` · `card.compulsion.signature.mind` | at most once each (slot 8 and slot 2 respectively, if used) |

## Batch mechanics that bit earlier batches (impediments #1109–#1120, #1150)

- Never mint under `encounter.slice.*`. The hand is drawn from the id.
- `intrinsicTier: 'shaping'` on all eight.
- At master difficulty the proof ascendant loses most natural runs. Take live evidence from a seed sweep plus a pinned band, and read success-side rows on a failed run as *not exercised*, not proved.
- The dry-run compile misses the gates `check:encounter` runs (#1114). Gate packages with `check:encounter -- --package` before compiling.
- There is no `$companion` sentinel (#1115).
- Imperative lexicon: card names must use a verb from the imperative lexicon.
- Parallel authors gating at once must bundle `check:encounter` to a private `.cache/` outfile; the npm alias writes one shared bundle.

## Out of scope

- Any rule gate (guild rank, faction membership, hold).
- New condition ids and new node types.
- Tuning the window, the odds, the cap or the local offset. Measured, never tuned to pass.
- Masters' fights (plan D5).
