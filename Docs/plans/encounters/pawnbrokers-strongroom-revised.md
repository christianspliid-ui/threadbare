# Encounter Pipeline: The Cooper's Pawned Box
> Scale: short | Slug: pawnbrokers-strongroom | Pass: revised
> Revisions applied: client changed from a widow to a cooper and grief blend dropped (echo of `cunning-fair`), title renamed; stair moved into the step 0 spine (Q8); in-scene blame replaces the invented "best lock-hand" standing (trigger 31); rival now forcing the hatch, not already through it; step 0 crit and step 1 failure base afterimages fixed to read with any hand (trigger 13); crit_success page conflict fixed and all success bands rest on the pawnbroker's broken word (trigger 35); "sold" → "took" to the buyer; seam echoes and Tame fragments de-duplicated; chip cause reworded
> Date: 2026-09-30 | Pipeline version: 2.0
> Template: `encounter.town.pawnbrokers_strongroom` (final id) · Batch: expert-everyday-2, slot 4 (THR-1679) · Brief: `Docs/plans/encounters/expert-everyday-2-brief.md`

**Title note.** "The Pawnbroker's Strongroom" names the place, not the job. **The Cooper's Pawned Box** states the objective at a glance (a box to get back), and the contest lives in the opening. The id and slug stay as the brief fixed them. (Editorial: renamed from "The Widow's Pawned Box". `cunning-fair` shipped "The Widow's Dream" in this family, with the same widow-at-the-fair premise.)

---

## 0. Mechanical design block (designed before the prose)

| Row | Decision |
|---|---|
| Crux | A cooper asks {actor} to take back his pawned box before the pawnbroker sells it at the fair, and the buyer has hired another thief to fetch it tonight. |
| Title | **The Cooper's Pawned Box**: the objective, from the agent's side. |
| Shape | **Test & Consequence** carrying the brief's **query prize** face. Step 0 gets in. Step 1 inherits how the house was left (woken or asleep) in its band texture, and is the race to get the box out first. Linear, branch count 0. |
| Reach = theme | Shadow both steps. Step 0 (shadow **0.60**, `continue_weakened`) is *about* entering a sleeping house unheard. Step 1 (shadow **0.66**, `fail_action`) is *about* moving unseen against a rival who is doing the same. Mean 0.63, window fit 0.77 (expert). |
| Why is the agent here? | `choice`: the cooper comes to them for the job (the forecast window draws expert shadow mortals, so the skill is backed; no standing is claimed). Agent role **suspect or cause** (rolled), made true *inside the scene*: the pawnbroker saw them talking, so any theft tonight is blamed on {actor}. The job is also their name. |
| Stake (P3) | **Contest** (rolled): {cast:rival}, hired by the buyer, wants the same box tonight. |
| Opposition | **Beast (hunger, wounded)** (rolled): the pawnbroker's guard dog, starved and lame, at the stair down to the strongroom. The danger is its noise. It is never killed. |
| Disposition | **Friendly** (rolled): the dog whines for food at anyone. Friendliness is the problem, because a friendly starved dog is loud. |
| Scale | **Settlement** (rolled): the pawnbroker holds half the town's pledges, so if he names {actor}, the whole town hears it. |
| Hook | `plotHookTaken: hook.descent_into_darkness`. The strongroom is under the house, down a stair. The candle will not last, and the box was locked away on purpose. `hook.grief_absorption` and `hook.long_road` are set aside. Grief was dropped at editorial with the widow, because it was the core of `cunning-fair`. This slot is one night in one town. |
| Consequence hand (binding) | **`story_seed`**: `encounter_seed` `templateId: 'encounter.black_market_deal'` on step 1's success half. The buyer who lost the box comes looking for the thief who beat his man, and sends directions to a back room (the sequel's own opening). Placeless: no place or time is promised. **`drive`**: `plant_compulsion` (`encounterBias: { steal: 0.5 }`, 72 ticks) on step 1's failure half. Beaten to a lock by a hired thief, they want another lock to prove themselves on. No swap. |
| Query prize (batch floor) | Step 1 `successMetadata.rewardPool: { categoryWeights: { possession: 1 }, tagFilters: ['#stealth'] }` → `{ kind: 'item_template', tags: ['#stealth'] }`. The cooper pays with one of his father's things from inside the box. The prose never names the item; the engine renders the drawn item as the PRIZE chip. `#stealth` is seated (family axis) and worn by item bearers: Grave-Robber's Stiletto, Strangler's Cord, Shadowweave Cloak, Mantle of the Unremembered, Shadowglass Pendant, plus the generator core `thieves_kit` ("tools of a quiet trade": picks, boots, knife). Chosen over `#relic` and `#talisman`, which batch 1 and journeyman-2 already drew. |
| Extra writes | `reputation_with` `$here` −0.08 on step 1's failure half (the pawnbroker names {actor} to the town). |
| Cool failure | Nobody is killed, jailed or branded, and the dog lives. On a failure the box leaves with {cast:rival}, the pawnbroker cannot prove who opened his lock, and the town thinks less of {actor}. On a critical failure he finds them at the open strongroom with empty hands. He cannot hold them, but he tells the whole fair. Reputation before money. On success the pawnbroker cannot cry theft at all without admitting he broke his word to hold the pledge. |
| Trait hooks | Gate: none (everyday board). **Variant:** `trait.mastery.shadow-walker` (+0.05, step 1: "Being a Shadow Walker, they cross a cellar without a sound."), `trait.reputation.shadow.negative` (−0.05, template-level: "Being Infamous, they are the first one the pawnbroker's house watches for."). Trait-only nudge: none. Trait fragment: none. |
| Mortal choice | None. This is a test. The cooper's request is accepted by construction (the forecast window draws the mortal to the scene). |
| Systems quota | cast (`rival`) + rewards (`rewardPool` + persistent seed/compulsion) + seeds (`encounter_seed`) + reputation (`reputation_with`): **four**, above the floor. |
| Cost channels | **The batch's one Heavy Hand**: `Hold The Coal Hatch`, with `essenceCost: 0`, `costs.detectionDelta: 0.15`, one channel only. Every other special costs essence only. No rider special. |
| `rarityTier` / `scale` / `intrinsicTier` | 2 / `local` / `shaping` (brief). |
| Settings | `rural` + `urban`, one opening each. The spine is setting-neutral: a fair, a cooper, a pawnbroker and a house with a cellar exist in both classes. |
| `crudType` / `motivations` | `update` / `honesty_cunning`, `courage_prudence` (the scene is about a theft done for a fair reason, and about going down into a dark house). No pole pin. |

## 1. Inspiration Anchors

- **Ordeal Archetypes → Impossible Heist** gave the security layers (a sleeping house, a stair, a dog, a lock). It also gave its *Consequence* hook, "the owner will hunt you", which became the `story_seed`: the buyer who lost the box comes looking for the thief who beat his man.
- **Ordeal Archetypes → Descent Into Darkness** (the taken hook) gave the one pressure the heist archetype lacks: the way on goes down, and the light will not last. The strongroom is down a stair under the house, and the candle is short, which is why step 1 is a race and not a search. The stair is in the opening, so the descent is on the page from the first paragraph.
- **Anti-Patterns avoided:** *Clean Moral Binaries* (the pawnbroker has a case: the cooper missed a payment, and he says that frees him from his word; step 1 states it plainly); *Player as Savior* (the cooper came to the mortal, not to the god; the god only leans); *Grimdark for Shock Value* (the starved dog is never harmed, and the god's mercy card is the one that can go wrong by healing it); the *helpful passerby* default (the pawnbroker saw the mortal with the cooper, so they are the first suspect).
- **The Dilemma Library was not consulted**: the scene has no fork, and its moral weight comes from the pawnbroker's arguable case.
- **Echo check against shipped content:** `smugglers-ford.ts` (not echoed: no crossing, no smuggling). `cunning-fair` ("The Widow's Dream", same family) was echoed by the first draft's widow-at-the-fair premise: a buried husband, a keepsake as prize, a `{cast:rival}`, and the same opening shape. Editorial replaced the client with a cooper, dropped the grief, re-shaped both openings and renamed the title. What remains shared is only the fair, which carries load here (the sale is tomorrow, and the buyer is at the fair).

## 2. Scale Justification

Short: two beats in one night, no fork, a clean aftermath. The stake is one expert's name in one town. It is carried by a single failure-side reputation write and a seed, so it does not need reaction choices.

## 3. Pressure Knot

The cooper pawned his father's iron box for winter grain. The pawnbroker swore to hold it until quarter day. A buyer at the fair has offered him far more than the loan, so he means to sell it tomorrow, citing a missed payment. The buyer does not trust the sale to go through and has hired {cast:rival} to take the box from the strongroom tonight. The pawnbroker saw the cooper talking to {actor}. The guard dog has not been fed for days.

## 4. Intervention Fantasy

A god helping a thief do a fair wrong in the dark. The god can heal and feed a starved dog so it lets them pass (and may find that a healthy dog barks). It can silence a stair. In the race, it can lean on a hatch so hard that the rival is shut out, at the price of being seen by other gods.

## 5. Cast and World Objects

| Object | What it is | Wiring |
|---|---|---|
| `{cast:rival}` | The thief the buyer hired. Named on stage in both steps; never gendered. | `supportBundle` actor `rival`, `lazy-materialize-on-trigger`, **must-persist**. `reuseNpcRoles: ['lookout', 'wanderer']` (lookout is rostered at town/city/capital, wanderer at hamlet; a stranger in for the fair reads true at both classes). `spawnNpcRole: 'lookout'`, `spawnName: 'Wren Hollis'`, `supportRole: 'hired_thief'`. Target of `opposes: 'rival'` on the Heavy Hand. |
| The cooper | Asks for the job. Role noun only (one named person per beat). | none |
| The pawnbroker | Owns the strongroom; names {actor} on failure. Role noun only. | the `reputation_with $here` write is his accusation |
| The guard dog | Starved, lame, at the stair down to the strongroom. Scene-local; never harmed. | the `Tame The Guard Dog` special |
| The iron box | The cooper's pledge. Scene-local; it never becomes an item node (it goes back to him). | none |
| The prize | One of his father's things from inside the box, drawn by tag. | step 1 `successMetadata.rewardPool` `#stealth` |
| The buyer | Unnamed. Carried forward only by the seed. | `encounter_seed` `encounter.black_market_deal` |
| `$here` | The town; target of the failure-side reputation write and the chip's anchor. | `reputation_with` |

## 6. Beat Structure

1. **Step 0 — Get into the strongroom** (shadow 0.60, duration 1–2, `continue_weakened`). Past the dog and down the stair. Every band opens the strongroom. The bands differ in whether the house woke and whether {cast:rival} heard where they are.
2. **Step 1 — Beat the rival out** (shadow 0.66, duration 1–2, `fail_action`). The box is on the shelf, and {cast:rival} is forcing the coal hatch. Whoever carries the box out of the house first keeps it.

## 7. Branching Profile

- Branch depth: `linear` · Branch count: **0**.
- Linear, with no branching. The outcome ladder and the band fragments carry the variety.

## 8. Branching Map

N/A — linear encounter.

## 9. Outcome Ladder

| Band | Progress | Spent | New burden / opening |
|---|---|---|---|
| critical_success | Out with the box before the rival reached the shelf; the cooper pays from the box; the pawnbroker cannot cry theft without admitting his broken word. | A night | PRIZE (best of the tier curve) · PATH seed: the buyer will send for them |
| success | Out with the box ahead of the rival; the cooper pays from the box. | A night | PRIZE · PATH seed |
| success_at_cost | Out with the box, but {cast:rival} was in the yard and knows their face. | Their cover | PRIZE · PATH seed (same writes; the cost lives in the overview — see Pass 3 note in the editorial) |
| failure | {cast:rival} reached the shelf first and took the box to the buyer at the fair gate. The pawnbroker found his lock opened and told the town who he thinks did it. | Their name in the town | SCAR compulsion · BOND reputation loss |
| critical_failure | {cast:rival} took the box, and the pawnbroker found {actor} at the open strongroom with empty hands. He could not hold them, and told the whole fair instead. | Their name, loudly | SCAR compulsion · BOND reputation loss |

## 10. Sample Opening (narrator mode)

**Openings (P1, one per declared class):**

- `urban`: "A cooper finds {actor} in {location} on the night before the fair." (12 words)
- `rural`: "{actor} reaches {location} the night before the fair, and a cooper finds them." (13 words)

**Spine (step 0 `narrativeTemplate`, setting-neutral — P2 + P3):**

> He pawned his father's iron box for winter grain. The pawnbroker swore to hold it until quarter day, but will sell it at the fair tomorrow. The buyer has hired {cast:rival} to take it tonight. The cooper asks {actor} to get there first. A starved, lame dog guards the stair down to the strongroom. The pawnbroker saw them talking, so any theft will be blamed on {actor}.

Word count: spine 67 → **79 (urban) / 80 (rural)**.

**Step 0 test panel:** reach shadow · difficulty 0.60 · purposeLine `Get into the strongroom` · duration 1–2 · `continue_weakened`.

**Step 0 afterimages** (the bands differ in what the house heard, not in whether the door opened):
- critical success: "They slipped past the dog and down the stair, and opened the strongroom without a sound."
- success: "They got past the dog and opened the strongroom lock in the dark."
- success at cost: "They opened the strongroom, but the dog whined, and a light moved in the house above."
- failure: "The dog barked twice before the lock gave, and the house above them woke."
- critical failure: "The dog barked until the house woke, and {cast:rival} heard where they were."

## 11. The Hand Per Step

Composition across both steps: 3 specials (Balm, Boost, Heavy Hand) + two `deal` fills. No core Boost as a special (the Quiet card is scene-bound to the cellar stair), no rider special, no over-exposed library card authored. The Heavy Hand is the batch's single authored `costs.detectionDelta` card, with zero essence (one cost channel).

### Step 0 — `deal: { count: 4, tags: ['shadow', 'wild'] }` + 2 specials (composed hand 6)

`wild` because the step's opposition is an animal; `shadow` because the step is about entering unheard.

**`strongroom.tame_the_guard_dog` — Tame The Guard Dog** · library type *Balm* · sphere **life** · essence 2 · Δ 0.12 · `imageTag: generic.mercy`
- effectLine: "Close the animal's wounds and fill its belly, so it lies down and lets them pass." (16 words; no word shared with the name)
- critical_success: "The dog ate from their hand and lay down across the stair behind them."
- success: "The dog's bad leg stopped hurting, and it slept through them passing."
- near_miss: "The dog lay quiet, then whined for more food as they reached the door."
- failure: "Fed and whole again, the dog stood up and guarded its door."
- critical_failure: "Fed and whole again, the dog was strong enough to bark all night."

(The failure fragments are the point of this card: the god's mercy works, and a well dog does its job. They give the reason; the base afterimage gives the barking. The dog is never hurt on any band.)

**`strongroom.quiet_the_cellar_stair` — Quiet The Cellar Stair** · library type *Boost* (scene-bound) · sphere **matter** · essence 2 · Δ 0.10 · `imageTag: generic.matter`
- effectLine: "Settle every loose board under their feet, so the steps down take their weight in silence." (16 words)
- success_at_cost: "The steps held silent, but the strongroom door groaned as it opened."
- failure: "The steps made no sound, and the dog heard them anyway."

Band coverage (specials): the two cards together cover all six bands. Each special carries ≥1 failure fragment. Neither reaches Δ 0.15. The two answer different questions: what the dog does, and what the house hears. Both targets (the dog, the stair) are in the step 0 spine before the hand is dealt.

### Step 1 — `deal: { count: 4, tags: ['shadow', 'finesse'] }` + 1 special (composed hand 5)

**`strongroom.hold_the_coal_hatch` — Hold The Coal Hatch** · library type *Heavy Hand* · sphere **force** · **essence 0** · `costs: { detectionDelta: 0.15 }` · Δ 0.14 · `opposes: 'rival'` · `imageTag: generic.strength`
- effectLine: "Keep the far door shut against an opponent with a weight no mortal could lift. Rival gods will see a hand this heavy." (23 words; the price is named on the face, in the house form of `the-broken-seal` / `border-levy`)
- critical_success: "{cast:rival} put a shoulder to the coal hatch twice, and it did not move."
- success: "The coal hatch held, and {cast:rival} had to come round by the yard."
- near_miss: "The hatch held until {cast:rival} broke the hinge, and they were only just out ahead."
- failure: "The hatch held, so {cast:rival} came in by the back door, between them and the yard."
- critical_failure: "The hatch held so hard that the whole house heard {cast:rival} beating on it."

Band coverage: the special covers all six; the dealt members bring their own `BAND_FRAGMENTS`. Δ 0.14 is under `NUDGE_BIG_DELTA`. Both failure bands are covered anyway, because this is the batch's Heavy Hand and its misfire should read at both depths.

**Forecast arithmetic (for the gate):** step 0 is 0.60 with specials summing 0.22; step 1 is 0.66 with a special of 0.14. The dealer clamps each fill under `NUDGE_HAND_MAX_TOTAL_DELTA` (0.70); `check:encounter` reports the composed ceiling.

## 12. Linear continuation (step 1 `narrativeTemplate`)

purposeLine `Beat the rival out` · shadow 0.66 · duration 1–2 · `fail_action`

> Their candle will not last long. The box is on the top shelf. The pawnbroker says the cooper missed a payment, which frees him from his word. {cast:rival} is forcing the coal hatch at the far end of the cellar. Whoever gets the box out of the house first keeps it.

(52 words.)

**Step 1 afterimages** (each reads correctly with or without Hold The Coal Hatch active):
- critical success: "They carried the box up the stair and out while {cast:rival} was still at the coal hatch."
- success: "They were out of the back door with the box before {cast:rival} reached the shelf."
- success at cost: "They got the box out, but {cast:rival} was in the yard when they came up."
- failure: "{cast:rival} reached the shelf first and was gone with the box."
- critical failure: "{cast:rival} took the box, and the candle died with {actor} still in the strongroom."

## 13. Aftermath Paragraph (sample, success)

> The cooper has his box back and paid {actor} from inside it. The pawnbroker has lost his sale, and cannot complain without admitting he broke his word.

## 14. Aftermath Reaction Choices

No reaction choices. The consequence is clean: short scale, every write fires from step 1's metadata, and the player's decisions were the cards.

## 15. Aftermath Kit (the pages, per band)

`aftermathConfig.branchOnStep: 1`, `variants: {}`, everything on `fallback.byOutcome`.

**Step 1 `successMetadata`:**
- `rewardPool: { categoryWeights: { possession: 1 }, tagFilters: ['#stealth'] }` → the PRIZE chip (engine-rendered, not authored).
- `encounter_seed`: `{ templateId: 'encounter.black_market_deal', targetAgentId: '$actor', delayTicks: 36, priority: 0.8, seedLabel: 'The buyer who lost the cooper\'s box sends word, with directions to a back room.' }`

**Step 1 `failureMetadata`:**
- `reputation_with`: `{ targetLocationId: '$here', delta: -0.08 }`
- `plant_compulsion`: `{ targetAgentId: '$actor', encounterBias: { steal: 0.5 }, durationTicks: 72, narrativeHook: 'Beaten to a lock by a hired thief, they want another lock to prove themselves on.' }`

**Chip conventions (all bands):**
- Seed chip: `kind: 'future_hook'`, `category: 'path'`, `direction: 'opens'`, `stateNoun: { text: 'seed', tooltipId: 'ui.aftermath_seed' }`, `concepts: [{ text: '{actor}', entityId: '$actor', visualKind: 'agent' }]` (a seed anchors through its carrier; the pilots-reckoning form).
- Reputation chip: `stateNoun: { text: 'reputation with {target}', entityId: '$here', visualKind: 'location', tooltipId: 'ui.reputation_with' }`. The town is what the prose means, so `{target}` resolving to the settlement is correct (THR-1685 note). No person-reputation chip.
- Compulsion chip: `kind: 'shell_state'`, `stateNoun: { text: 'compulsion', tooltipId: 'ui.compulsion' }` (the drowned-mans-testimony form).

**Fallback** — overview: "Morning comes to the fair. The cooper's box has left the pawnbroker's strongroom." · uncategorised growth change: "A lock opened under a sleeping house teaches the shadow reach." (`concepts: [{ text: 'shadow reach', tooltipId: 'reach.shadow' }]`)

**critical_success** — overview: "The cooper has his father's box back, and paid {actor} from inside it before the fair opened. The pawnbroker cannot cry theft without admitting he broke his word."
- PATH · SEED — "The Buyer's Interest" — "The buyer who lost the box will send for {actor}." (10 words)

**success** — overview: "The cooper has his box back and paid {actor} from inside it. The pawnbroker has lost his sale, and cannot complain without admitting he broke his word."
- PATH · SEED — "The Buyer's Interest" — as critical_success.

**success_at_cost** — overview: "The cooper has his box and paid {actor} from inside it. {cast:rival} knows their face now."
- PATH · SEED — "The Buyer's Interest" — as critical_success.

**failure** — overview: "{cast:rival} took the cooper's box to the buyer at the fair gate. The pawnbroker found his lock opened and told {location} who he thinks did it."
- SCAR · COMPULSION — "Beaten to the Box" — causeClause "Outrun by a hired thief" — detail "For a while they look for a lock to prove themselves on." (4 + 11 = 15 words)
- BOND · REPUTATION WITH {target} (`$here`) — "Named by the Pawnbroker" — "{location} thinks less of {actor}." (5 words)

**critical_failure** — overview: "The pawnbroker found {actor} at his open strongroom with empty hands, so he could not hold them. By noon the whole fair had heard his story."
- SCAR · COMPULSION — "Beaten to the Box" — causeClause "Left in the dark" — detail as failure. (4 + 11 = 15 words)
- BOND · REPUTATION WITH {target} (`$here`) — "Named Before the Fair" — "{location} thinks less of {actor}."

**Page read (editorial, band by band, overview → scar → bond → boon → path):**
- critical_success: the overview says why the pawnbroker is silent (his broken word), and the seed says the buyer, whose thief was in the same cellar, will send. The draft's "nobody could say by whom" contradicted the seed and is gone.
- success: same logic. The seed chip adds the buyer, whom the overview does not mention.
- success_at_cost: the afterimage puts the rival in the yard, and the overview gives the consequence (knows their face). There is no repeated four-word run, and the seed adds the buyer.
- failure: the overview gives the delivery and the accusation, the scar gives the drive (cause "outrun", not a re-telling of the delivery), and the bond gives the standing. Each block carries one fact, and "took … to the buyer" now agrees with the spine (the buyer hired the rival).
- critical_failure: the overview gives the pawnbroker finding them and the fair hearing, the scar gives the dark and the drive, and the bond gives the standing. Clean.

### Narrative templates
- initiation: "A cooper asks {actor} to take back his pawned box before the buyer's hired thief can fetch it."
- success: "The cooper has his box back, and the buyer's thief went home empty-handed."
- failure: "{cast:rival} took the cooper's box to the buyer, and the pawnbroker named {actor} to the town."

### Trait variants
- `trait.mastery.shadow-walker` Δ +0.05 — "Being a Shadow Walker, they cross a cellar without a sound."
- `trait.reputation.shadow.negative` Δ −0.05 — "Being Infamous, they are the first one the pawnbroker's house watches for."

(Both ids live: `src/data/mastery-trait-content.ts` and `src/data/reputation-trait-content.ts`.)

## 16. Support Bundle Contract

| Support object | Delivery | Source | Persistence | Future references | Status |
|---|---|---|---|---|---|
| `rival` (the buyer's hired thief) | lazy-materialize-on-trigger | reuse `lookout` / `wanderer`, else spawn `lookout` "Wren Hollis" | must-persist | named in both steps, the Heavy Hand's `opposes`, overviews | live |
| The prize | drawn at resolution | `#stealth` item_template query via step `rewardPool` | persists as a possession on `$actor` | sheet; PRIZE chip | live (5 catalog bearers + `thieves_kit` core) |
| The buyer's sequel | seeded, delay 36 | `encounter_seed` → `encounter.black_market_deal` (shipped, no guild/faction gate, hamlet/town/city/capital; a literal seed skips the eligibility filter; its opening walks the mortal to the back room, which enacts the seed label) | the seed persists until it fires | PATH · seed chip | live |
| Town standing | written on failure | `reputation_with $here` | must-persist | BOND chip | live |
| The compulsion | written on failure | `plant_compulsion` steal 0.5, 72 ticks | persists 72 ticks | SCAR chip | live |

## 17. Self-Audit

| Item | Status |
|---|---|
| Steps / difficulty / failBehavior exactly as brief (shadow 0.60 → shadow 0.66) | PASS |
| Opening skeleton ≤80 words, graph names (`{actor}`, `{location}`, `{cast:rival}`) | PASS (79 / 80) |
| One opening per declared class (`rural`, `urban`); spine setting-neutral | PASS |
| Cast bound, every `{cast:*}` key declared, class-honest roles | PASS (`lookout` town+; `wanderer` hamlet). FLAG for Pass 3: `farmland` / `mining` rosters not checked for either role; the spawn fallback covers it |
| Bound cast never gendered | PASS ("the rival" / `{cast:rival}` throughout) |
| Hands: 0–2 specials + `deal` on every nudge-bearing step | PASS (2 / 1) |
| Every special has a failure fragment; big-delta rule | PASS (none ≥ 0.15; Heavy Hand covers both failure bands anyway) |
| Every card's target in scene prose before its hand | PASS (dog + stair in step 0 spine; hatch in step 1 spine) |
| Base band text reads with any subset of the hand | PASS (step 0 crit no longer feeds the dog; step 1 failure no longer leaves by the hatch) |
| Card names verb + noun from the imperative lexicon (Tame, Quiet, Hold); no name word in the effect line; no digits | PASS |
| Zero-essence card priced on another channel; one channel only | PASS (Heavy Hand: detection only) |
| Batch Heavy Hand count | PASS: this slot carries the batch's single authored `detectionDelta` |
| Over-exposed cards | PASS: none authored as a special |
| Consequence hand wired in context (`story_seed` + `drive`), no swap | PASS: seed on the success half, compulsion on the failure half |
| Query prize: step `rewardPool` with a seated, worn tag | PASS (`#stealth`). Caveat carried from batch 1: the census counts `content_query` only off a seed query, so this slot is a query prize by recipe (accepted by the brief) |
| Rewards persist | PASS (`rewardPool`, `encounter_seed`, `plant_compulsion`, `reputation_with`) |
| Systems ≥3 | PASS (cast, rewards, seeds, reputation = 4) |
| byOutcome floor | PASS (all five bands) |
| Every chip backed by a write on its band (Law 56) | PASS: seed chip on the three success bands (the success half fires on `isStepSuccess`); compulsion + reputation chips on the two failure bands |
| `success_at_cost` differs mechanically from `success` | FLAG for Pass 3: same writes; the cost is narrative only ({cast:rival} knows their face). The brief's band table asks for a condition, lean or debt |
| Chip nouns are sheet words; chip sentences ≤15 words | PASS (`seed`, `compulsion`, `reputation with {target}`) |
| Person chips avoid `{target}` (THR-1685) | PASS: the only `{target}` chip is anchored on `$here` |
| Prose rule 7 (no unbacked agent history) | PASS: the draft's "best lock-hand for miles" / "any theft here gets blamed on {actor}" standing is removed; the blame is produced in-scene (the pawnbroker saw them talking) |
| Prose rule 7b (no unbacked promise about later) | PASS: "The buyer … will send for {actor}" is enacted by the `encounter_seed`, and the back room by the sequel's own opening. The compulsion chip says only what the bias performs. "will sell it at the fair tomorrow" is the scene's own clock, resolved inside the encounter |
| Echo against shipped content | PASS: `cunning-fair` widow premise replaced (editorial) |
| Expert stakes: nobody killed, jailed, branded; the dog lives | PASS |
| Word budgets | PASS: opening 79/80; step-1 spine 52; overviews ≤ 30; fragments ≤ 25; effect lines ≤ 25; chips ≤ 15 |
| Machine gates | PENDING: `compile:encounter --dry-run` and `check:encounter` run at implementation; the detectors were not machine-run at editorial (read by hand: no evasive terms, no outcome-field indefinites, no second person, no numerals) |

### The narrator's 12 questions

1. **P1 arrival?** Yes, per class: a cooper finds `{actor}` in `{location}` / `{actor}` reaches `{location}` the night before the fair.
2. **P2 events?** He pawned the box for winter grain. The pawnbroker swore to hold it, but will sell it tomorrow. The buyer has hired `{cast:rival}`. Costs already paid: the pledge and the broken word.
3. **P3 one stake?** Contest, as rolled: `{cast:rival}` wants the same box tonight. The suspect role compounds it on purpose (the pawnbroker saw them talking, so any theft is blamed on `{actor}`), which is the one allowed compound.
4. **≤80 words?** 79 / 80.
5. **Read aloud?** Yes, a report throughout. No interior sensation, no camera work.
6. **Stated, never encoded?** The broken promise, the rival, the dog at the stair, and the blame each take one plain sentence.
7. **Every sentence works?** Challenge (box, rival, dog), test (get there first), outcome (the blame).
8. **Nothing unintroduced?** The cooper, box, pawnbroker, fair, rival, dog, stair and strongroom are all in the spine before any card or chip names them. The candle, cellar and coal hatch are in step 1's spine before step 1's card acts on the hatch.
9. **One named person per beat?** `{cast:rival}` only; the cooper, the pawnbroker and the buyer are role nouns.
10. **Stake in a sentence?** "Can {actor} get the cooper's box out of the pawnbroker's strongroom before the buyer's thief does, without being named for it?"
11. **Cards verb + noun, spell-style?** Tame The Guard Dog, Quiet The Cellar Stair, Hold The Coal Hatch. Direct effect lines, no odds talk.
12. **Opening per class?** `urban` and `rural`, both written.

### Concept Art Direction

1. *Emotions:* a promise broken for money; a small fair wrong done in the dark; mercy that makes noise.
2. *Image:* an empty iron hook on a strongroom shelf where a box hung, a snapped dog chain lying beside a scraped-clean bowl, and a burnt-down candle stub on the cellar step. Residue only: no people, no dog on screen. Painterly, muted tones, one warm point of light.

### Experience Differentiator Gate

1 YES · 2 YES · 3 YES (the dog and the stair are in the step 0 spine; the hatch is in the step 1 spine) · 4 YES · 4b YES (seams read at editorial: the step-0 → step-1 "under the house" repeat, the s_a_c yard/face repeat, and base ↔ Tame "barked" are all fixed) · 5 YES · 6 YES (essence on Tame and Quiet; detection on Hold, named on its face) · 7 YES (every special carries failure fragments; Tame's are the god's mercy backfiring) · 8 YES (delete the dog, the stair or the hatch and each card is senseless here) · 9 YES (the dog vs the house's ears vs the rival's route) · 9b YES (full hand on both steps; no step asks for a branch or an ending) · 10 YES · 11 YES (`{cast:rival}`, the pawnbroker, `{location}` on every page; sheet-word chips) · 11b YES (page read above) · 12 N/A (short scale, no reactions, justified) · 13 N/A · 14 YES.

### Branch Seduction Self-Check

N/A — linear encounter; no branch to seduce toward.
