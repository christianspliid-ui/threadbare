# Batch brief — master-everyday-3 (8 encounters + 2 appointment sequels)

**Drafted:** Claude Code (pickup lane, THR-1840), 2026-10-15 · **Approved:** lane decision under Christian's 2026-09-11 blanket approval of batch briefs (ruling 2; the footing THR-1688 and THR-1757 ran on). Veto invited on the ticket.
**Ticket:** [THR-1840](https://linear.app/threadbare/issue/THR-1840) · **Design:** [`Docs/plans/2026-10-13-thr-1757-master-work-reaches-masters.md`](../2026-10-13-thr-1757-master-work-reaches-masters.md) § D2 batches and the stop rule, slice S2 · **Follows:** [`master-everyday-2-brief.md`](master-everyday-2-brief.md) (THR-1757, master batch 2)

## Why this batch

Measured on `main` @ `4a2e7b9c` before the batch (`npm run measure:master-band`, seeds 42 / 99 / 7, 120 ticks):

| | seed 42 | seed 99 | seed 7 |
|---|---|---|---|
| expert mean attempted | 0.342 | 0.265 | 0.291 |
| master mean attempted | 0.236 | 0.337 | 0.391 |
| master success | 0.588 | 0.492 | 0.680 |

Pooled: own-master work on the board on **35.8%** of master commits; the cap removed the last own-master entry on 122 of 129 cut commits; q = 0.220, t = 0.928. Masters chose master-band work 20.9% of the time. The reader projects P(on the board) ≈ 0.69 at K = 3.

**The stop rule does not trip.** Masters attempt easier work than experts on seed 42 (0.236 vs 0.342); seed 99 holds. `npm run measure:roll-spread -- --coverage-only` shows every reach at exactly two master templates (floor 2), so no reach needs a backfill and the batch is **eight, one per reach**: it takes K from 2 to 3.

## Game design — fixed before any premise (director ruling 2026-08-24)

### The binding rows

| Slot | id | reach (binding) | steps (reach · difficulty) | mean | window fit | shape | settings | consequence hand (binding) |
|---|---|---|---|---|---|---|---|---|
| 1 | `encounter.town.returned_heir` | eye | eye 0.74 → eye 0.80 | 0.77 | 0.91 | **appointment** | `urban`, `rural` | `relationship` + `movement` |
| 2 | `encounter.town.wool_staple` | gold | gold 0.74 → gold 0.80 | 0.77 | 0.91 | test & consequence | `urban` | `possession` + `story_seed` |
| 3 | `encounter.town.gallows_pardon` | heart | heart 0.76 → heart 0.80 | 0.78 | 0.92 | seeded sequel | `urban` | `relationship` + `story_seed` |
| 4 | `encounter.town.tannery_fire` | iron | iron 0.76 → iron 0.82 | 0.79 | 0.93 | danger → confrontation → aftermath | `urban` | `standing` + `place` |
| 5 | `encounter.town.fugitive_friar` | shadow | shadow 0.74 → shadow 0.80 | 0.77 | 0.91 | opt-in complication | `urban` | `possession` + `membership` |
| 6 | `encounter.town.bloodletting_hour` | star | star 0.74 → star 0.82 | 0.78 | 0.92 | test & consequence | `urban` | `knowledge` + `secret` |
| 7 | `encounter.town.silver_drift_rescue` | stone | stone 0.74 → stone 0.80 → stone 0.84 | 0.793 | 0.933 | **query prize** | `rural` | `condition` + `membership` |
| 8 | `encounter.town.sin_eater` | veil | veil 0.78 + a value-axis branch | 0.78 | 0.92 | personality fork | `urban`, `rural` | `drive` + `place` |

- **Master band.** Every step sits between **0.72 and 0.85**; every mean reads *severe*. Window fit (mean + 0.14) is 0.91–0.93, inside the master band (capability ≥ 0.85).
- **`rarityTier: 2`, `scale: 'local'`, `intrinsicTier: 'shaping'` on all eight.** `check:encounter` recomputes the hand from id + reach + rarity, so **the ids and the tier above are final**.
- **Everyday by construction.** Every slot declares `urban` and/or `rural`. No guild-rank, army, monster, fight or confront gate. Every id sits under `encounter.town.*`. **Never `encounter.slice.*`.**
- **No repeated verbs** (plan D2). Each slot was chosen against its reach's two masters and two experts:

| Reach | already on the board (masters · experts) | this batch's verb |
|---|---|---|
| eye | read a forged charter, read a poisoning at a feast · survey a boundary, read a toll writ | read a man who comes home claiming to be the lost heir, and swear to it at the manor court |
| gold | save cathedral plate from bailiffs, win a salt licence · arbitrate a debt, bid at a mill lease | break a foreign buyers' ring at the wool staple, then sell the town's clip |
| heart | rule at a granary riot, broker a hostage exchange · mediate a feud, settle a wake | plead a condemned youth's life at the foot of the gallows |
| iron | champion a judicial duel, marshal a tourney · keep a winter wolf-watch | lead the bucket lines and pull down a firebreak while the tanners' quarter burns |
| shadow | find the coiners, unmask a council spy · raid a tithe barn, crack a strongroom | smuggle a condemned friar out of a shut town |
| star | read a ducal nativity, correct the feast calendar · dispute a comet, cast an almanac | cast the figure for the bishop's bleeding, and hold the physicians to the hour |
| stone | strike a vault's centering, bring water down a hill conduit · shore a bell tower, mend a dyke | dig trapped miners out of a fallen silver drift |
| veil | lay an ossuary's dead, judge a witch · hear a drowned man, judge an oath-breaker | eat a rich man's sins at his wake, and decide what to do with the sin he hid |

### Premises, each inside the fixed design

A master is someone the realm, the cathedral, the guilds and the manor send for by name. **Put the master stakes in who sits across the table and what is at risk, never in a rule gate.**

1. **The Returned Heir** (eye, urban or rural market town). Seven years after the lord's son marched to war and was counted dead, a man walks in who says he is him. The widow-mother says yes, the uncle who holds the manor now says impostor, and the steward sends for the master reader to judge the man before the manor court sits. Step 1 reads the man: his scars, his hands, what he remembers and what he should not. Step 2 reads the household: who taught him what, who gains. Opposition: time (the court sits on its day whether the reading is done or not). **Appointment:** the master's finding must be sworn at the manor court (`locationId: '$here'`, `counterpartyId: '$cast:<steward>'`, a `missed` branch). Kept branch **`town.returned_heir_sworn`**, missed branch **`town.returned_heir_defaulted`**: both **seed-only** (`drawable: false`, THR-1526), short one-step scenes in `src/data/encounters/returned-heir-sequels.ts`, modelled on `src/data/encounters/easter-reckoning-sequels.ts`. Hand: a bond with the claimant, the widow or the uncle (`relationship`: `bond_change`); the household sends the mortal on to the manor, or the claimant takes them with him (`movement`: `agent_relocation`).
2. **The Wool Staple** (gold, urban). At the staple fair the town's whole clip is for sale, and the Flemish buyers have agreed among themselves to bid one price and no higher. The wool guild sends its master merchant to break the ring before the fair closes. Step 1 breaks the ring (finds the buyer who will defect, or the rival market). Step 2 **inherits step 1** and sells the clip at the weighing house, with the staple's mayor holding the scales. Opposition: a faction's orders (the buyers' compact). Hand: the price paid in kind, a pledge, or the guild's seal on the master's purse (`possession`, a named item); the ring's factor does not forget (`story_seed`).
3. **The Gallows Pardon** (heart, urban). A youth is to hang at noon for a theft the town half believes he did not do. The lord's justice has the rope ready and the crowd is waiting; the youth's mother has begged the master to speak for him. Step 1 wins the crowd and the hangman's pause. Step 2 pleads before the justice on the gallows steps. Opposition: the law doing its duty, and a crowd that wants its hanging. **Seeded sequel:** the youth, spared or not, has people; a later encounter finds the mortal (`encounter_seed`, by `query` on a family tag that exists, or a `templateId` that exists). Hand: a bond with the justice, the mother or the youth (`relationship`: `bond_change`); the sequel (`story_seed`).
4. **The Tannery Fire** (iron, urban). Fire takes the tanners' quarter on a dry wind. The master is the one the watch looks to. Step 1 (danger) holds the bucket lines at the river stair while the roofs go. Step 2 (confrontation) pulls down the sheds for a firebreak, against the master tanner who will not see his stock lost. Opposition: a rival's greed (the master tanner). Hand: the town's regard for the master moves (`standing`); what the night leaves on the quarter (`place`: as `draw:consequences` prints it).
5. **The Fugitive Friar** (shadow, urban). The town is shut: the bishop's men hold a friar condemned for preaching, and he has slipped them and hides in the master's own street. The master **chooses** whether to get him out past the gate watch before the bells (opt-in). Step 1 finds the way out. Step 2 takes him through it. Opposition: the bishop's order and its watch. Hand: what the friar leaves the master, or what the gate costs (`possession`, a named item); the friar's brotherhood takes the master in, or a guild casts them out (`membership`: `membership_change`).
6. **The Bloodletting Hour** (star, urban). The bishop is ill, and his physicians will bleed him. By the art of the day, bleeding at the wrong hour of the moon kills. The master astrologer is sent for to cast the figure. Step 1 casts the figure. Step 2 **inherits step 1** and holds the physicians to the hour the figure gives, at the bishop's bedside, while the senior physician says bleed now. Opposition: a faction's orders (the physicians' college). Hand: what the master learns from the figure or the room (`knowledge`); what they learn of the bishop's illness that no one was meant to know (`secret`).
7. **The Silver Drift** (stone, rural). The silver mine above the village has fallen in and four miners are behind the fall. The mine's reeve asks the master to judge where to dig before the air goes. Step 1 reads the fall. Step 2 shores the drift as the diggers go in. Step 3 brings them out. Opposition: a hungry mountain (the rock and the bad air; never a monster). **The prize is drawn by tag** through a step `rewardPool` (what the diggers find in the face, or what the miners give). Hand: what the fall leaves on the mine or on the mortal (`condition`); the miners' fellowship takes the master in (`membership`: `membership_change`).
8. **The Sin-Eater** (veil, urban or rural). A rich merchant lies dead, and his family has paid the sin-eater (the master, whom the parish sends for when the dead must go clean) to eat the bread and salt off his chest and take his sins. Under the bread is a written confession: he poisoned his partner years ago. One step, veil 0.78: eating the sins. Then **a value-axis branch** (THR-894) the mortal decides by their own nature: keep the dead man's secret as a sin-eater should, or carry it to the living who were wronged. Hand: what the sin leaves the master wanting (`drive`); what the night leaves on the house or the parish (`place`: as `draw:consequences` prints it).

### How each drawn family is wired in context

Run `npm run draw:consequences -- <id> --reach <reach> --rarity 2` to print the exact effect kinds each family accepts, and use only those.

| Family | Effect kinds | Slots |
|---|---|---|
| `relationship` | `bond_change` between `$actor` and a named cast member | 1, 3 |
| `movement` | `agent_relocation` | 1 |
| `possession` | an item granted, taken or pledged; name it | 2, 5 |
| `story_seed` | `encounter_seed` (placeless; `query` by a family tag that exists, or a `templateId` that exists) | 2, 3 |
| `standing` | the family's kinds as `draw:consequences` prints them | 4 |
| `place` | the family's kinds as `draw:consequences` prints them | 4, 8 |
| `membership` | `membership_change` | 5, 7 |
| `knowledge` | the family's kinds as `draw:consequences` prints them | 6 |
| `secret` | `hidden_mark` / `secret_discovery` / `favor_creation` | 6 |
| `condition` | `condition_attachment` / `apply_condition` / `remove_condition` / `attachment_grant` | 7 |
| `drive` | the family's kinds as `draw:consequences` prints them | 8 |
| query prize (slot 7) | a step `rewardPool` whose entry is tag-filtered. Working shapes: `witch-trial.package.json`, `restless-ossuary.package.json`. Use a tag in `reference/content-tag-catalog.generated.md` that at least one item wears | 7 |

### Payoffs, prizes, penalties — band by band

| Band | What it pays or costs, across the eight |
|---|---|
| `critical_success` | the drawn prize lands at its best, and the people who sent for the master remember it |
| `success` | the drawn prize lands |
| `success_at_cost` | the prize lands and the master carries something for it: a condition, a debt, an enemy |
| `failure` | the prize does not land, the drawn penalty family fires, and the story goes on |
| `critical_failure` | the penalty lands hard, and the band says plainly what it cost |

**Cool failure.** None of the eight kills, jails or brands the mortal. **Master failure is the name before the purse**: the guild sends for someone else next time, a rival is believed instead, a house stops trusting them. Say plainly why it costs more for someone this good. Slot 3's failure is the hardest in the batch (the youth hangs); state it plainly, never luridly.

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
| Decision shapes | appointment 1 · test & consequence 2 · seeded sequel 1 · danger→confrontation 1 · opt-in 1 · query prize 1 · personality fork 1 |
| Appointment | slot 1, with both sequels authored |
| Query prize | slot 7 |
| Tone | at most two resolve grim on their success side; slots 3 and 7 end warm on success |
| Step counts | one 1-step (+ branch) · six 2-step · one 3-step |
| Scale | ≥1 settlement-or-larger (slots 1, 3, 4, 5, 7) |

## Rolled constraints

```
npm run draw:packet -- master-everyday-3 --slots 8 --reaches eye,gold,heart,iron,shadow,star,stone,veil --tier 2 --ids encounter.town.returned_heir,encounter.town.wool_staple,encounter.town.gallows_pardon,encounter.town.tannery_fire,encounter.town.fugitive_friar,encounter.town.bloodletting_hour,encounter.town.silver_drift_rescue,encounter.town.sin_eater
slot 1:  encounter.town.returned_heir
  plotHookRolled: hook.assassination_succeeded, hook.monster_eradication, hook.meeting_to_keep
  reach: eye                       setting: arcane
  shape: appointment               system: movement
  p3Shape: plea                    opposition: time (the clock is the enemy)
  disposition: n/a                 agentRole: judge_asked_to_rule
  scale: settlement
  consequenceHand: relationship, movement
slot 2:  encounter.town.wool_staple
  plotHookRolled: hook.stronghold_mobilization, hook.negotiation_under_pressure, hook.meeting_to_keep
  reach: gold                      setting: battlefield
  shape: test_and_consequence      system: movement
  p3Shape: threat                  opposition: faction (orders)
  disposition: neutral             agentRole: competitor
  scale: region
  consequenceHand: possession, story_seed
slot 3:  encounter.town.gallows_pardon
  plotHookRolled: hook.the_great_building, hook.reconciliation, hook.rebuilding_trust
  reach: heart                     setting: wayside
  shape: seeded_sequel             system: carryover
  p3Shape: unmitigated_risk        opposition: beast (territory)
  disposition: open                agentRole: trespasser
  scale: settlement
  consequenceHand: relationship, story_seed
slot 4:  encounter.town.tannery_fire
  plotHookRolled: hook.festival_of_fools, hook.gods_fall, hook.environmental_gauntlet
  reach: iron                      setting: arcane
  shape: personality_fork          system: carryover
  p3Shape: mystery                 opposition: rival_agent (greed)
  disposition: hostile             agentRole: bystander_pulled_in
  scale: region
  consequenceHand: standing, place
slot 5:  encounter.town.fugitive_friar
  plotHookRolled: hook.apotheosis, hook.impossible_choice, hook.sacred_crime
  reach: shadow                    setting: rural
  shape: danger_confrontation_aftermath system: traits
  p3Shape: choice                  opposition: terrain (indifference)
  disposition: n/a                 agentRole: bystander_pulled_in
  scale: settlement
  consequenceHand: possession, membership
slot 6:  encounter.town.bloodletting_hour
  plotHookRolled: hook.artifact_recovery, hook.shifting_shape, hook.relic_awakening
  reach: star                      setting: stronghold
  shape: test_and_consequence      system: items
  p3Shape: contest                 opposition: faction (orders)
  disposition: neutral             agentRole: trespasser
  scale: region
  consequenceHand: knowledge, secret
slot 7:  encounter.town.silver_drift_rescue
  plotHookRolled: hook.long_road, hook.masterwork_completion, hook.shifting_shape
  reach: stone                     setting: ruin
  shape: query_prize               system: carryover
  p3Shape: choice                  opposition: beast (hunger)
  disposition: neutral             agentRole: judge_asked_to_rule
  scale: region
  consequenceHand: condition, membership
slot 8:  encounter.town.sin_eater
  plotHookRolled: hook.relic_awakening, hook.haunt_resolution, hook.sacred_crime
  reach: veil                      setting: sacred
  shape: personality_fork          system: forks
  p3Shape: threat                  opposition: terrain (indifference)
  disposition: n/a                 agentRole: suspect_or_cause
  scale: personal
  consequenceHand: drive, place
```

The packet's spread check passed every cap (no shape, setting, opposition or role more than 2×; ≤2 hostile; ≥1 appointment; ≥1 query prize). `plotHookTaken` is recorded per encounter in its package doc block and stamped into `src/data/content-eval/plotHooks.ts` `usedBy` at closeout.

### Overrides, each with its reason

- **setting.** Every rolled class that expands to no settlement subtype is overridden to `urban` and/or `rural`. The ticket's scope is the everyday settlement board. The rolled class survives as the scene's place inside the town: slot 1 *arcane* → the manor's muniment room, where the old letters are kept; slot 2 *battlefield* → the weighing house yard with the two parties drawn up; slot 3 *wayside* → the gallows at the crossroads outside the gate; slot 4 *arcane* → the dyers' and tanners' vats, whose fumes take fire; slot 5 *rural* → the water-gate and the fields beyond it; slot 6 *stronghold* → the bishop's palace; slot 7 *ruin* → the old workings the new drift broke into; slot 8 *sacred* → the parish's lych-gate and the house of the dead.
- **reach.** Supplied by the gauge (`--reaches`).
- **slot 4 shape.** Rolled *personality fork* (a second one). Overridden to **danger → confrontation → aftermath**: a fire is a danger before it is a choice, and one fork per batch keeps the branch-authoring cost bounded. Slot 8 keeps the batch's fork.
- **slot 5 shape.** Rolled *danger → confrontation → aftermath* (now slot 4's). Overridden to **opt-in complication**: the friar is not the mortal's problem until the mortal chooses to make him one, which is the whole of the encounter's weight.
- **slot 7 opposition.** Rolled *beast (hunger)*. Read as the mountain's hunger, the fall and the bad air. No monster gate is permitted on an everyday encounter.
- **slot 3 opposition.** Rolled *beast (territory)*. Read as the crowd that has come for its hanging, and the law's duty behind the justice.
- **system targets.** Advisory; slot 1's appointment carries the batch's movement.

## Systems quota targets

Contract floor is 3 (`COMPOSITION_SYSTEMS_QUOTA_MIN`).

- **Reach for:** the appointment and relocation (slot 1), items (slots 2, 5, 7), seeds (slots 2, 3), relationships (slots 1, 3), standing and place (slots 4, 8), membership (slots 5, 7), knowledge and secrets (slot 6), conditions (slot 7), drives (slot 8), reputation (any slot, as a third system).
- **Avoid defaulting to:** a personal condition on the mortal as the failure penalty. At most two slots use `apply_condition` on `$actor`.

## Anchors this batch intends to touch

| Anchor kind | Target across the batch |
|---|---|
| location (`$here`) | slot 1's appointment; slots 4, 8 place effects |
| cast member (`$cast:<key>`) | all eight slots name a counterparty the chip can point at |
| item / reward template | slots 2, 5, 7 |
| secret / knowledge | slot 6 |
| seed / sequel | slots 1, 2, 3 |
| faction membership | slots 5, 7 |

**Known renderer defect (THR-1685).** On a board draw `{target}` may read as the settlement. For a person, use a chip noun that does not interpolate `{target}`.

## Over-exposed cards

Carried from the expert and master batches.

| Card | Instruction |
|---|---|
| `card.boost.core` | **not as a special**. Let the deal fill supply it |
| `card.boost.signature.energy` | not at all |
| `card.undertow.signature.darkness` | at most once across the batch (slot 5 or 8) |
| `card.kindled_ambition.signature.spirit` · `card.heavy_hand.signature.force` | at most once each (slot 4 and slot 5 respectively, if used) |
| `card.mercy.core` · `card.compulsion.signature.mind` | at most once each (slot 3 and slot 2 respectively, if used) |

## Batch mechanics that bit earlier batches (impediments #1109–#1120, #1150, #1197)

- Never mint under `encounter.slice.*`. The hand is drawn from the id.
- `intrinsicTier: 'shaping'` on all eight.
- At master difficulty the proof ascendant loses most natural runs. Take live evidence from a seed sweep plus a pinned band, and read success-side rows on a failed run as *not exercised*, not proved.
- The dry-run compile misses the gates `check:encounter` runs (#1114). Gate packages with `check:encounter -- --package` before compiling.
- There is no `$companion` sentinel (#1115).
- Imperative lexicon: card names must use a verb from the imperative lexicon.
- Parallel authors gating at once must bundle `check:encounter` to a private `.cache/` outfile; the npm alias writes one shared bundle.
- A seed's link must pass the THR-1526 pins (`encounter-contract-migration.test.ts`, `encounterSeedLiveness.test.ts`); THR-1757 had to add rows there after compiling.

## Out of scope

- Any rule gate (guild rank, faction membership, hold).
- New condition ids and new node types.
- Tuning the window, the odds, the cap or the local offset. Measured, never tuned to pass.
- Masters' fights (plan D5).
