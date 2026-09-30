# Encounter Pipeline: Wolves at the Fold
> Scale: medium | Slug: wolf-winter-watch | Pass: draft
> Date: 2026-09-30 | Pipeline version: 2.0 | Batch: expert-everyday-2, slot 3 (THR-1679)

Template id (binding, from the brief): `encounter.town.wolf_winter_watch`

**Title change.** The brief's working title was *The Wolf-Winter Watch*. The draft uses **Wolves at the Fold**. A player reading only the title knows the complication: wolves are at the sheep. "Wolf-winter" needs a second reading. The template id does not change.

---

## 0. Mechanical design block (fixed before any prose)

| Row | Decision |
|---|---|
| Crux | Wolves are taking a village's sheep in a hard winter, and the reeve has sent for the mortal to judge whether the village watch can hold the folds. |
| Title | **Wolves at the Fold**. It names the complication in four words. |
| Reach | iron (primary, `primaryReachOf`: two Iron steps against one Eye). |
| Steps | eye 0.56 "Find what draws them" → iron 0.64 "Set the watch" → iron 0.68 "Hold the fold gate". Mean 0.627, window fit 0.767 (expert). |
| Shape | **Puzzle – Investigation – Resolution** (catalog). The Eye step finds the cause behind the test: carrion staked past the last fold. The two Iron steps use that finding, or do without it, through carryover lines keyed on the step before. |
| Tier / rarity / scale | `intrinsicTier: 'shaping'`, `rarityTier: 2`, `scale: 'local'` (brief § binding rows). |
| Settings | `rural` only, with one opening. |
| Seed Dice | p3 **opportunity**: the command of the watch, taken at the risk of the mortal's name. Opposition **beast (territory)**: the pack, driven down by the winter. Disposition **hostile**. agentRole **judge asked to rule**: the reeve asks the mortal to judge whether the watch can hold. Scale **company**: one village's watch and flock. |
| Hook | plotHookRolled: hook.environmental_gauntlet, hook.trade_war, hook.rivals_challenge. **plotHookTaken: hook.trade_war**, blended with hook.environmental_gauntlet. The drover from the next village has staked carrion by this village's folds. That draws the pack away from his own village, and he has offered to buy the frightened village's flock at half price. The hard winter is the gauntlet that makes the scheme work. rivals_challenge was dropped: a public challenge would turn the drover into a duellist, and the story is about a watch, not a bout. |
| Whose problem? | The mortal's. The reeve sent for them by name, asked them to rule on the watch and offered them its command. The valley will judge them by whether the folds hold (agentRole: judge asked to rule). |
| Reach = theme? | Step 0 tests Eye and is *about* reading the ground to find why the pack comes here. Steps 1 and 2 test Iron and are *about* soldiering: posting a frightened watch, then holding a gate against a rush. |
| Mortal choice? | None. This is a test. `motivations: ['courage_prudence', 'sacrifice_survival']`. The scene is about holding a gate at risk and about standing between a village and its loss, so it draws mortals who lean hard either way on those values. No fork, so no pin. |
| Consequence hand (binding, THR-1145) | `secret` + `place`. Confirmed by `npm run draw:consequences -- encounter.town.wolf_winter_watch --reach iron --rarity 2`: secret (weight 3 in iron) and place (weight 4 in iron). No swap. |
| `secret` | (a) `hidden_mark` on `$cast:drover`, category `concealed_action`, step 0 `successMetadata`. The investigation finds that the drover staked the carrion. Concealed by design and not chipped. (b) `favor_creation` with debtor `$cast:drover`, on the success-side reaction "Keep the drover's secret". The drover owes the mortal for silence. |
| `place` | `apply_condition` `trait.condition.location.under_watch` on `targetLocationId: '$here'`, on the final step's `successMetadata`. The watch the mortal set stays on the village. This is a live condition (`condition-trait-content.ts`: "Someone is keeping eyes on this place. Quiet work here is harder and more likely to be seen."), with a duration row in `CONDITION_DURATIONS`. A village that lost its fold has no honest location condition to land on (the levee-breach precedent in reverse), so `place` fires on the success side only. |
| Standing (expert failure) | `reputation_with` `$here`: +0.06 on the final step's success, −0.06 on its failure. The village sent for the mortal, and the village judges. The chip noun `reputation with {location}` is anchored on `$here`. The village is what the prose means, so THR-1685 does not bite. There is no person-anchored reputation chip. |
| Cool failure? | Nobody dies, is jailed or branded. Sheep die, which is the winter, not the mortal. On failure the fold falls, the reeve sells what is left to the drover at his price, and the valley hears whose watch it was. On critical failure the watch runs and the survivors go for a handful of coin. Reputation before money. |
| Payoffs by band | crit: the fold holds and every ewe lives, the reeve sends the drover home, and the mortal gains village standing and leaves the village Under Watch. success: the same writes. success_at_cost: the same writes, but the far folds are lost and the mortal gives the fee to the shepherds (prose only). failure: village standing falls. crit failure: village standing falls, and the watch's flight is told across the valley. |
| Systems quota | cast (reeve, drover) + rewards (`hidden_mark`, `apply_condition`, `favor_creation` persist) + conditions (`apply_condition` on `$here`) + reputation (`reputation_with`) = 4. |
| Heavy Hand | None. The batch allowance is left for slot 4. |
| System target (rolled: items) | The watch's gear is the lever for two specials. The lanterns are what **Guard The Flames** acts on (step 1). The gate bar is what **Harden The Bar** acts on (step 2). No card grants content. |
| Trait hooks | Gate: no (no rule gates in this batch). Variant: **Hopeful** (`trait.core.core_hope.virtue`) +0.04, factorLine "Being Hopeful, they expect the gate to hold till dawn.", `addNudgeIds: ['wolf.raise_morale']`. **Bitter** (`trait.core.core_hope.vice`) −0.04, factorLine "Being Bitter, they expect the gate to fall before dawn." Trait-only card: yes, `wolf.raise_morale` on step 2 at cost 0. Trait fragment: the trait card's own band fragments. |
| Promises that pay off | "The pack passes the next village by" (the investigation's question) is paid off by step 0's afterimages when it is found, and by every success-band overview when it is not: the watch follows the tracks back at first light. "{cast:drover} has offered to buy the flock at half price" is paid off by the failure overviews (the reeve sells to the drover) and the success overviews (the offer is refused). The P3 stake ("{location} will think less of {actor}") is enacted by step 2's `failureMetadata` `reputation_with −0.06`. |
| State classification | Scene-local: the pack, the ewes, the folds, the carrion, the watch, the lanterns, the gate bar, the offer, the fee. State read: the `{cast:*}` bindings, `{location}`, and the Hopeful/Bitter traits. State written: the hidden mark, Under Watch on the village, village standing, and (by reaction) a favour or a bond change. No agent history is asserted. |

## 1. Inspiration Anchors

- **The Trade War (Event archetype, via hook.trade_war).** It supplied the scheme. Money is war by another name: the drover does not attack the village, he moves its losses onto it and waits to buy. That keeps the opposition a beast while the cause stays human.
- **The Environmental Gauntlet (Ordeal archetype, via hook.environmental_gauntlet).** It supplied the pressure. The winter is the real threat, and the pack is its tool. "Losses accumulate" became the far folds lost on success_at_cost.
- **Anti-Patterns (vault `Systems/Anti-Patterns.md`).** Three were steered around:
  - #1 The Dark Lord Problem / #9 Clean Moral Binaries: the drover is not evil. He drew the wolves off his own village's folds, and that saved his neighbours' sheep, before it made him a buyer. The keep-the-secret reaction exists because a mortal might think he has half a point.
  - #10 Player as Savior: the watch is the village's own, and the mortal commands it. Nobody is rescued by a stranger.
  - #6 Grimdark for Shock Value: the worst band is a flock lost and a name spent, not a massacre of people.
- **Dilemma Library.** Not consulted. The encounter is not morally charged at the step level. The one moral fork, whether to expose the drover, lives in the aftermath reactions, where it is a stance and not a test.

## 2. Scale Justification

Medium. Three beats is what an investigation-then-resolution shape needs so the two resolution steps can use, or do without, what was found. The reward weight is an expert's: a village's standing, a watch left standing in the soldier's name, and a neighbour's secret to keep or spend. It is a local story about one village's winter, and it does not need a fork.

## 3. Pressure Knot

Since the snow came, a wolf pack has come down each night and taken ewes from the village folds. It passes the next village by. The reason is that the drover from that village has staked carrion past this village's last fold, drawing the pack across the valley. Now the drover has offered to buy the frightened village's flock at half price before more are lost. The reeve cannot tell whether the village watch, a handful of farmhands, can hold. The reeve has sent for a soldier of standing to judge, and to command the watch if it can.

## 4. Intervention Fantasy

The god works on the ground and the things the watch holds, never on the soldier's orders. It lays a trail plain in the snow, trips a liar over their own story, keeps the lanterns burning through a squall, and makes an oak bar take a weight it should not. For a Hopeful soldier it wakes the thing in them that makes frightened farmhands stay at a gate. The player watches an expert do a hard, unglamorous job, and tilts the night.

## 5. Cast and World Objects

| Object | What it is | Binding |
|---|---|---|
| `{cast:reeve}` | The village reeve. Sent for the mortal and asks them to judge the watch and command it. Decides whether to sell the flock. | supportBundle actor, `lazy-materialize-on-trigger`, must-persist. Reuse `elder`, spawn `elder`, spawnName **Hild Aysgarth**, supportRole `wolf_watch_reeve` |
| `{cast:drover}` | A drover from the next village. Offers to buy the flock at half price. He staked the carrion. | supportBundle actor, `lazy-materialize-on-trigger`, must-persist. Reuse `wanderer`, spawn `trader`, spawnName **Col Brannock**, supportRole `wolf_watch_drover`. Must persist: he bears the hidden mark, may owe the favour, and is a bond target |
| `{location}` | The village. It sent for the mortal and it judges. | `$here`: `reputation_with`, and `apply_condition` Under Watch |
| the pack | The opposition. Weather with teeth. Never a monster template, never a fight gate. | prose only |
| the watch | Farmhands with spears, lanterns and one horn. | prose only (role-voiced) |
| the carrion, the folds, the great fold, the gate bar, the offer, the fee | Scene-local. | prose only |

**Class honesty.** `rural` expands to hamlet, farmland and mining. Only the hamlet roster seeds NPCs (`elder`, `wanderer` among them). At farmland and mining both specs spawn. "Reeve" and "drover" read correctly at all three. Neither cast member is gendered in scene or band prose. (The design block and this table use "he" for the drover as authoring shorthand only. The prose never does.)

## 6. Beat Structure

1. **Find what draws them** (eye 0.56). The mortal walks the folds and the hill above them before dusk. Success finds carrion staked past the last fold and learns who left it.
2. **Set the watch** (iron 0.64). The reeve hands over the watch at dusk. The mortal posts frightened farmhands on the folds before the pack comes down.
3. **Hold the fold gate** (iron 0.68). On the coldest night the whole pack comes at once. The watch falls back to the great fold, and the mortal holds its gate until dawn while the drover waits at the lane's end.

## 7. Branching Profile

Linear — no branching. Branch count 0. Shape: Puzzle – Investigation – Resolution. Carryover lines on steps 1 and 2 carry what the step before found or failed to find.

## 8. Branching Map

N/A — linear encounter.

## 9. Outcome Ladder

| Band | Progress | Spent | New burden / opening |
|---|---|---|---|
| critical_success | The great fold holds and every ewe lives. The reeve sends the drover home. | The night. | The village thinks well of the mortal. The village is Under Watch. The drover's secret is the mortal's to keep or spend. |
| success | The great fold holds. The flock stays in the village. | The night. | The same three. |
| success_at_cost | The great fold holds, but the pack empties the far folds. | The fee, given to the shepherds who lost ewes. | The same three. |
| failure | The pack gets into the great fold. The reeve sells what is left to the drover at the drover's price. | The village's trust. | The village thinks less of the mortal. |
| critical_failure | The watch runs and the pack is in the fold until dawn. The survivors go for a handful of coin. | The village's trust, and a soldier's name across the valley. | The village thinks less of the mortal. |

## 10. Sample Opening (rural, as the player meets it: opening + step-0 spine)

{actor} arrives at {location} in a hard frost, at the reeve's request.

Since the snow came, wolves have taken ewes from the folds each night. The pack passes the next village by and comes here. {cast:drover}, a drover from that village, has offered to buy the flock at half price.

{cast:reeve} asks {actor} to judge whether the watch can hold, and to command it. If the folds fall under that command, {location} will think less of {actor}.

*(77 words: P1 12, P2 38, P3 27.)*

## Openings (per class, P1)

- **rural:** `{actor} arrives at {location} in a hard frost, at the reeve's request.`

## Steps (full prose)

### Step 0 — eye 0.56 · purposeLine "Find what draws them" · failBehavior continue_weakened

**narrativeTemplate:** Since the snow came, wolves have taken ewes from the folds each night. The pack passes the next village by and comes here. {cast:drover}, a drover from that village, has offered to buy the flock at half price. {cast:reeve} asks {actor} to judge whether the watch can hold, and to command it. If the folds fall under that command, {location} will think less of {actor}.

| Afterimage | Text |
|---|---|
| critical_success | They found carrion staked past the last fold, and caught {cast:drover} bringing more. |
| success | They found carrion staked past the last fold, left there by {cast:drover} to draw the pack. |
| success_at_cost | They found the carrion and who staked it, and {cast:drover} saw them find it. |
| failure | They walked the folds and the hill until dark and found only tracks. |
| critical_failure | They blamed the shepherds' dogs for drawing the pack, and the shepherds have not forgiven it. |

**successMetadata:** `hidden_mark` { category `concealed_action`, severity 0.5, label "Staked carrion by a neighbouring village's folds to draw the wolves away from home", targetAgentId `$cast:drover`, revealFamilies [`investigation`] }

**deal:** { count 3, tags [`insight`, `wild`] }

**Specials:**

1. `wolf.reveal_the_trail` — **Reveal The Trail** · type Boost (tracks) · sphere life · essence 2 · Δ 0.10 · image `generic.focus`
   - effectLine: Lay the passage of beasts plain in snow and mud, so a tracker can follow it back to where it began.
   - critical_success: The tracks led {actor} to the stakes as plainly as a road.
   - success: A line of tracks showed {actor} where the pack turned off the hill.
   - near_miss: The tracks stayed plain until the wind rose, and {actor} spent an hour finding them again.
   - failure: Fresh snow filled the tracks behind {actor} faster than they could follow.
2. `wolf.twist_a_tale` — **Twist A Tale** · type Stumble (opposes `drover`) · sphere chaos · essence 2 · Δ 0.08 · image `generic.luck`
   - effectLine: Make a liar's account slip and contradict itself, so whoever is listening hears the gap.
   - success: {cast:drover} said the pack came down from the north, then said the east.
   - success_at_cost: {cast:drover} changed the story halfway, then saw that {actor} had noticed.
   - failure: {cast:drover} told the same story twice, word for word, and it held.
   - critical_failure: {cast:drover} stumbled over the story, and the shepherds heard only {actor} pressing a guest.

### Step 1 — iron 0.64 · purposeLine "Set the watch" · failBehavior continue_weakened

**narrativeTemplate:** The watch is a handful of farmhands with spears, lanterns and one horn. None of them has stood against wolves. At dusk {cast:reeve} hands the watch to {actor}. {actor} must post it on the folds before the pack comes down.

| Afterimage | Text |
|---|---|
| critical_success | Every fold had a lantern and a spear on it by dark, and the horn hung at the great fold. |
| success | The watch stood at every fold by dark, and each farmhand knew where to run when the horn blew. |
| success_at_cost | The watch stood by dark, but a few farmhands went home rather than stand in the snow. |
| failure | The watch was still arguing over the lanterns when the light went. |
| critical_failure | Half the watch refused to stand, and told {cast:reeve} so in front of the others. |

**carryoverFactorLines** (keyed on step 0):

| Band | Text | Polarity | Δ |
|---|---|---|---|
| critical_success | They caught {cast:drover} baiting the pack and cleared the carrion. | for | +0.06 |
| success | They cleared the carrion that drew the pack. | for | +0.04 |
| success_at_cost | {cast:drover} knows they found the carrion. | against | −0.02 |
| near_miss | They found the carrion late, with the light going. | against | −0.03 |
| failure | They still do not know what draws the pack. | against | −0.05 |
| critical_failure | The shepherds will not take orders from them. | against | −0.07 |

**deal:** { count 3, tags [`might`, `peril`] }

**Special:**

3. `wolf.guard_the_flames` — **Guard The Flames** · type Boost (light) · sphere light · essence 2 · Δ 0.10 · image `generic.light`
   - effectLine: Keep lamps and fires burning through wind and snow, so watchers see what comes at them.
   - critical_success: No lantern on the folds went out in the wind.
   - success: The lanterns burned steady on every fold through the first squall.
   - success_at_cost: The lanterns burned, and showed the watch how many wolves there were.
   - failure: The lanterns burned, but the watch had set them where the pack never came.
   - critical_failure: A lantern tipped into the straw of the east fold, and the watch spent the dusk beating out the fire.

### Step 2 — iron 0.68 · purposeLine "Hold the fold gate" · failBehavior fail_action

**narrativeTemplate:** On the coldest night the whole pack comes down at once. The watch falls back to the great fold, where most of the flock is penned. {actor} must hold its gate until dawn. {cast:drover} waits at the end of the lane, ready to buy whatever is left.

| Afterimage | Text |
|---|---|
| critical_success | The pack broke off before midnight and did not come back. |
| success | The gate held until dawn, and the pack went back up the hill hungry. |
| success_at_cost | The gate held until dawn, but the pack took ewes from the far folds. |
| failure | The gate gave way before dawn, and the pack got into the great fold. |
| critical_failure | The gate fell, the watch ran, and the pack was in the fold until dawn. |

**carryoverFactorLines** (keyed on step 1):

| Band | Text | Polarity | Δ |
|---|---|---|---|
| critical_success | Every fold was lit and manned before dark. | for | +0.06 |
| success | The watch knows where to stand. | for | +0.04 |
| success_at_cost | The watch is short of hands. | against | −0.02 |
| near_miss | The watch took its places late. | against | −0.03 |
| failure | The watch never settled on its posts. | against | −0.05 |
| critical_failure | Half the watch would not stand. | against | −0.07 |

**successMetadata:** `apply_condition` { conditionTraitId `trait.condition.location.under_watch`, targetLocationId `$here`, intensity 0.6 } · `reputation_with` { targetLocationId `$here`, delta +0.06 }

**failureMetadata:** `reputation_with` { targetLocationId `$here`, delta −0.06 }

**deal:** { count 3, tags [`might`, `wild`] }

**Specials:**

4. `wolf.harden_the_bar` — **Harden The Bar** · type Boost (ward) · sphere matter · essence 2 · Δ 0.10 · image `generic.ward`
   - effectLine: Make wood and iron hold past their strength, so a shut door stays shut.
   - critical_success: The gate bar took the whole weight of the pack and did not crack.
   - success: The gate bar bowed under the rush, and held.
   - near_miss: The bar held, but the hinge post split, and the gate hung by one side until dawn.
   - failure: The bar held, and the post beside it gave way.
   - critical_failure: The bar held until the post tore out of the frozen ground and took the gate with it.
5. `wolf.raise_morale` — **Raise Morale** · type Trait card · requiredTrait `trait.core.core_hope.virtue` · essence 0 · Δ 0.08 · image `generic.warmth`
   - effectLine: Wake their hopeful nature, so those beside them believe the night can be won, and hold their ground.
   - success: {actor} laughed at the wolves through the gate, and the watch laughed with them.
   - success_at_cost: The watch stayed at the gate because {actor} did.
   - failure: {actor} stood at the gate alone for a while before the watch came back to it.

## 11. The Hand Per Step (summary)

| Step | Specials (type · sphere) | Deal | Composed size |
|---|---|---|---|
| 0 eye | Boost (tracks) · life; Stumble · chaos (opposes drover) | 3 · insight, wild | 5 |
| 1 iron | Boost (light) · light | 3 · might, peril | 4 |
| 2 iron | Boost (ward) · matter; Trait card · — (Hopeful only) | 3 · might, wild | 4 (5 for a Hopeful mortal) |

- No rider, no Heavy Hand, and no card grants content.
- Every special carries a `failure` fragment. No Δ reaches 0.15.
- Step 2's authored hand sums 0.18 against difficulty 0.68 (0.86, inside the ceiling).
- Band coverage from specials alone: step 0 covers all six bands; step 1 covers five (no near_miss); step 2 covers all six. The dealt members' `BAND_FRAGMENTS` fill the rest. Confirm with `checkComposedHand`.
- Type composition across the three hands, [Boost, Stumble] · [Boost] · [Boost, Trait], differs from `feud_mediation`'s [Boost, Boost] · [Stumble] · [Boost, Trait] (trigger 21).
- Over-exposed library cards: no special names `card.boost.core`, `card.boost.signature.energy` or any other capped member. `wolf.twist_a_tale` may carry `libraryCardId: 'card.stumble.signature.chaos'`, which is not on the over-exposed list. `wolf.raise_morale` may carry `libraryCardId: 'card.trait_card.core'`.
- The item lever (system target: items): the lanterns (step 1) and the gate bar (step 2) are the objects the specials act on. Delete them from the spine and both cards are senseless here.

## 12. Linear continuation

See the step-1 and step-2 spines above. Step 1 is the handover at dusk: what the watch is and what is asked now. Step 2 is the worst night: the rush, the fall back to the great fold, the gate, and the drover at the lane's end. The stake itself was stated once, in the opening's P3.

## 13. Aftermath Paragraph

**Base overview:** The snow stops, and {location} counts its flock.

The page per band is in § 14b below: overview, chip captions, then reactions.

## 14. Aftermath Reaction Choices

**Success pair (critical_success, success, success_at_cost):**
- **Name the drover to the village.** Intent: The mortal tells {location} who staked the carrion. The village marks who told it, and the drover will not forget it. Effects: `reputation_with` `$here` +0.03; `bond_change` `$cast:drover` −0.12.
- **Keep the drover's secret.** Intent: The mortal says nothing about the carrion, and the drover owes them for the silence. Effect: `favor_creation` { magnitudeRange [0.2, 0.35], context "Kept quiet about the carrion staked by a neighbouring village's folds", debtorAgentId `$cast:drover` }.

**Failure pair (failure, critical_failure):**
- **Help the village count its losses.** Intent: The mortal stays to bury the dead ewes and mend the folds, and the village marks who stayed. Effect: `reputation_with` `$here` +0.03.
- **Speak against the sale.** Intent: The mortal tells the reeve the flock is worth more than the drover pays, and the drover hears of it. Effects: `bond_change` `$cast:reeve` +0.12; `bond_change` `$cast:drover` −0.12.

The two pairs are two stances each. On success: spend the truth for the village's regard, or bank it as a debt. On failure: make amends quietly, or take a side against the buyer.

`failure` and `critical_failure` must override `reactions` with the failure pair. Otherwise they inherit the success pair (the feud-mediation precedent).

## 14b. The page per band

**critical_success**
- Overview: At first light the watch follows the tracks back to carrion staked past the last fold. {cast:drover} put it there to draw the pack away from the next village. {cast:reeve} sends the drover home without a single ewe.
- BOND · reputation with {location} — Lost no ewe on the worst night — {location} thinks well of {actor} now.
- BOON · Under Watch — The watch they posted stays on — {location} is under watch now.
- Reactions: the success pair.

**success**
- Overview: At first light the watch follows the tracks back to carrion staked past the last fold. {cast:drover} put it there to draw the pack away from the next village. The flock stays in {location}.
- BOND · reputation with {location} — Held the great fold until dawn — {location} thinks well of {actor} now.
- BOON · Under Watch — The watch they posted stays on — {location} is under watch now.
- Reactions: the success pair.

**success_at_cost**
- Overview: The far folds are empty, but the great fold held. At first light the watch finds the carrion {cast:drover} staked past the last fold. {location} pays {actor}'s fee, and {actor} gives it to the shepherds who lost ewes.
- BOND · reputation with {location} — Held the great fold until dawn — {location} thinks well of {actor} now.
- BOON · Under Watch — The watch they posted stays on — {location} is under watch now.
- Reactions: the success pair.

**failure**
- Overview: {cast:reeve} sells what is left of the flock to {cast:drover}, at the drover's price. When a soldier of {actor}'s name loses a fold, the whole valley hears of it.
- SCAR · reputation with {location} — The great fold fell on their watch — {location} thinks less of {actor} now.
- Reactions: the failure pair.

**critical_failure**
- Overview: {cast:reeve} sells the survivors to {cast:drover} for a handful of coin. Every village in the valley hears that the watch ran, and whose watch it was.
- SCAR · reputation with {location} — Their watch broke and ran — {location} thinks less of {actor} now.
- Reactions: the failure pair.

**Page read (drafted as one text per band).**
- No chip retells its overview. The reputation chips name the cause in one clause and the change in the other. The Under Watch chip names the state and who set it.
- No two chips tell one beat.
- The reactions offer stances the chips do not state: the secret on success, amends or a side on failure.
- One thing for the editorial pass to check: the four-word run "thinks well of {actor}" repeats across bands. It does not repeat within a single page.

## 15. Aftermath Kit Summary

- **Visible:** village standing up or down; the village Under Watch (success side); a favour owed by `{cast:drover}` or a worse bond with the drover (by reaction); a better bond with `{cast:reeve}` (failure reaction).
- **Concealed:** the hidden mark on `{cast:drover}` (staked the carrion), revealable by `investigation` families.
- **The world remembers:** whose watch held the fold, or whose watch ran.

## 16. Support Bundle Contract

| Support object | Delivery mode | Source | Persistence | Future references | Status |
|---|---|---|---|---|---|
| `reeve` | lazy-materialize-on-trigger | reuse `elder`, else spawn `elder` "Hild Aysgarth" (supportRole `wolf_watch_reeve`) | must-persist | bond target (failure reaction) | ready |
| `drover` | lazy-materialize-on-trigger | reuse `wanderer`, else spawn `trader` "Col Brannock" (supportRole `wolf_watch_drover`) | must-persist | hidden-mark bearer; favour debtor; bond target; Stumble `opposes` target | ready |
| Under Watch on the village | `apply_condition` `$here` | `trait.condition.location.under_watch` (live, `CONDITION_DURATIONS` row) | condition edge on the place (expires by duration) | location page; Shadow step modifier in this place | ready |
| village standing | `reputation_with` `$here` | engine | edge | Location Profile standing row | ready |
| the drover's secret | `hidden_mark` | engine (`GameState.hiddenMarks`) | must-persist | investigation-family reveal | ready |

## 17. Self-Audit

| Check | Verdict |
|---|---|
| Envelope: `rural`, one opening | PASS |
| Opening + spine ≤80 words | PASS (77) |
| One stake shape in P3 (opportunity: the command, at the cost of the name) | PASS. The P2 fact "the pack passes the next village by" sets up the investigation. It is stated as a fact, not a second stake. **FLAG for editorial:** the opportunity reading rests on "and to command it". If the critic reads P3 as a plea, the fix is to make the command's value plain in one clause. |
| Hands 4–8 composed, ≤2 specials per step | PASS (5 / 4 / 4–5) |
| ≥4 spheres, ≥1 common option per composed hand | PASS on specials (life, chaos, light, matter). The dealt fill supplies the common option. Confirm with `checkComposedHand`. |
| Every special has a failure fragment; no big-delta card | PASS |
| Six StepOutcomes covered per step | PASS on steps 0 and 2 from specials alone. Step 1 lacks a near_miss fragment from its one special, so the dealt fill covers it. **FLAG** for `checkComposedHand`. |
| Trait hooks, four answers | PASS (gate: no; variant ×2; trait card; trait-card fragments) |
| Trait refs live | PASS (`trait.core.core_hope.virtue` / `.vice` are core registry ids, used in 17 / 7 shipped sites) |
| Consequence hand wired: secret + place | PASS (hidden_mark on step 0; favor_creation by reaction; under_watch on `$here` on step 2) |
| Place condition id live | PASS (`trait.condition.location.under_watch`, `condition-trait-content.ts`) |
| Every chip backed by a write on its band | PASS. Reputation → step 2 success/failure `reputation_with`. Under Watch → step 2 success `apply_condition`. Success bands incl. s_a_c fire `successMetadata`. |
| Chip nouns are sheet words | PASS (`reputation with {location}`, `Under Watch`) |
| Chip sentences ≤15 words, no four-word run with their overview | PASS (11–13 words) |
| No word shared between a card's name and its effect line | PASS (Reveal/Trail; Twist/Tale; Guard/Flames; Harden/Bar; Raise/Morale) |
| Card names open with an imperative-lexicon verb | PASS (reveal, twist, guard, harden, raise are all in `IMPERATIVE_VERB_LEXICON`) |
| No class scenery beyond the opening | PASS (folds, the hill and the lane are the scene's own objects, true at hamlet, farmland and mining) |
| No invented agent history | PASS |
| No placeless promise (7b) | PASS. "until dawn" is inside the scene. No sentence binds the mortal to a later place or time. The success_at_cost fee is paid inside the aftermath. |
| Vagueness lexicon in outcome prose | PASS by reading (no "nothing", "something", "someone", "way" in afterimages, fragments or overviews). "whatever" appears only in the step-2 spine ("whatever is left"). That is scene class, where natural indefinites are allowed. |
| Annotation clauses ≤1 | PASS (none by reading) |
| Systems ≥3 | PASS (4: cast, rewards, conditions, reputation) |
| One named person per beat | PASS (drover step 0; reeve step 1; drover step 2) |
| Wolves are not a monster template or a fight/confront gate | PASS (prose only; no gate, no monsterState target) |
| Expert stakes: nobody killed, jailed or branded | PASS |
| `apply_condition` on `$actor` | None (the batch cap is untouched) |

## 18. Concept Art Direction

1. *Emotions:* a long winter wearing a village down; a small watch standing longer than it believed it could; a neighbour's quiet betrayal.
2. *Image:* a sheepfold gate at first light, its oak bar bowed but still across the posts. A lantern has burned down to its wick on the gatepost. Wolf tracks in the snow run up to the gate and turn away. In the far corner of the frame, a single wooden stake stands in the snow past the last wall, with a frayed cord tied to it. No people and no wolves.

## Experience Differentiator Gate

**Scene & Prose (Doctrine v2)**
1. Opening follows arrival · situation & complication · problem, ≤80 words, real graph names, facts stated plainly? **YES** (77 words; `{actor}`, `{location}`, `{cast:drover}`, `{cast:reeve}`)
2. Every sentence doing challenge/test/outcome work — no interior sensation, camera work or idle atmosphere? **YES**
3. Scene prose names the elements the hand acts on? **YES** (the tracks and the drover's story at step 0; the lanterns at step 1; the gate at step 2)
4. Could a player retell the situation and stakes after one read? **YES**: "Wolves are taking the village's sheep; the reeve wants me to judge and command the watch; if the folds fall, the village thinks less of me."

**Choices & Intervention**
5. Every card spell-like — imperative verb + noun, 1–2 direct effect sentences, no flavor quote, no scene-bespoke prose on the face? **YES**
6. Every card's price real and legible? **YES** (essence 2 on four specials; the trait card at 0, priced by being Hopeful)
7. Every card pays off in failure? **YES**
8. Hand grounded — every card acts on a target the scene established? **YES** (tracks, the drover's story, the lanterns, the gate bar, the watch beside the soldier)
9. No two cards buying the same certainty? **YES** (finding the trail vs. breaking a lie; seeing vs. holding; the gate vs. the watch's nerve)
9b. Every nudge-bearing step carries a full hand, and no step asks the player to pick a branch or an ending? **YES**

**Aftermath & Consequence**
10. Aftermath has its own prose, a landing before the mechanics? **YES**
11. Consequences actor-centred, with names and faces? **YES** (`{cast:drover}`, `{cast:reeve}`, the village)
11b. Each band read as one assembled page — every block adds something, nothing told twice, nothing contradicting? **YES**, by the page read in § 14b
12. Medium scale offers reaction choices? **YES** (a pair for the success side, a pair for the failure side)
13. Reactions are different stances, not mechanical variants? **YES** (spend the truth vs. bank it; make amends vs. take a side)

**Presentation**
14. Concept art uses the two-question method and shows residue rather than action? **YES** (the bowed bar, the burned-out lantern, turned tracks, the lone stake; no figures)

## Branch Seduction Self-Check

N/A. The encounter is linear. The aftermath reactions carry the only stance choice. Each was tested for why a god would want it:
- Naming the drover buys a village's regard and costs a neighbour's goodwill.
- Keeping the secret buys a debt that can be called in later.
- Both are tempting with the labels removed, because each spends something the other keeps.
