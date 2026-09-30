# Encounter Pipeline: Wolves at the Fold
> Scale: medium | Slug: wolf-winter-watch | Pass: final
> Date: 2026-09-30 | Pipeline version: 2.0
> Status: **READY FOR IMPLEMENTATION**

---

## Pipeline Summary

| Pass | Verdict | Notes |
|------|---------|-------|
| Draft | Complete | Three-step investigation-to-resolution (eye 0.56, iron 0.64, iron 0.68) for an expert soldier sent for to hold a village's folds; `secret` + `place` consequence hand. |
| Editorial | PASS WITH REVISIONS | Five aftermath pages made true on every path into their band; `reputation_with −0.02` added to steps 0 and 1 failure metadata; opening recast as an opportunity; four seam echoes fixed; Under Watch kept BOON. |
| Systems | READY FOR IMPLEMENTATION | Every id verified in `src/`. Reputation arithmetic confirmed (worst success-side net +0.02). Under Watch live with an 84-tick duration and a Shadow reader. No missing primitives, no fixes merged. |

### Caveats / Blockers

None. One implementer note: step 1 has a single authored special, so its four-sphere floor leans on the dealer's fill. If the compile or live-proof gate reports under four spheres on step 1, add a second authored special there; do not retune the deal tags.

### Editorial Notes Summary

The success overviews were false on the paths that reach them (crit and success need a clean step 0, and critical_failure ends the action at any step), so all five pages were rewritten to be true on every path. The critical_failure SCAR chip gained backing writes on steps 0 and 1. The P3 stake became a real opportunity (command and a fee) with the reeve unnamed until step 1 and the drover's lie grounded in P2 for Twist A Tale. Guard The Flames gained a near_miss fragment and Harden The Bar a success_at_cost fragment. Under Watch stays BOON on purpose.

### Implementation File Map

No `src/` edits. Author `Docs/plans/encounters/wolf-winter-watch.package.json` from the packet below; `compile:encounter` produces the module, its test and both registrations. Optional concept art per section 18. Full audit: `Docs/plans/encounters/wolf-winter-watch-systems.md`.

---

## Encounter Packet

# Encounter Pipeline: Wolves at the Fold
> Scale: medium | Slug: wolf-winter-watch | Pass: revised
> Revisions applied: all five aftermath overviews rewritten to be true on every path into their band (crit/success need a clean step 0; any step's critical_failure ends the action); `reputation_with $here −0.02` added to steps 0 and 1 `failureMetadata` to back the critical_failure chip; opening P3 recast as an opportunity (command + fee), reeve unnamed until step 1, drover's lie added to P2 to ground Twist A Tale; four carryover seam echoes fixed; step-1 crit afterimage no longer names the great fold early; step-2 spine "barred gate"; Under Watch chip kept BOON, sentence names the effect; chip causes rewritten; near_miss fragment on Guard The Flames, success_at_cost fragment on Harden The Bar; Reveal The Trail and Raise Morale effect lines made plain and generic; design block, ladder, page and self-audit updated to match
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
| Seed Dice | p3 **opportunity**: command of the watch and a fee, taken at the risk of the mortal's name. Opposition **beast (territory)**: the pack, driven down by the winter. Disposition **hostile**. agentRole **judge asked to rule**: the reeve sent for the mortal to size up the watch. Scale **company**: one village's watch and flock. |
| Hook | plotHookRolled: hook.environmental_gauntlet, hook.trade_war, hook.rivals_challenge. **plotHookTaken: hook.trade_war**, blended with hook.environmental_gauntlet. The drover from the next village has staked carrion by this village's folds. That draws the pack away from the drover's own village, and the drover has offered to buy the frightened village's flock at half price. The hard winter is the gauntlet that makes the scheme work. rivals_challenge was dropped: a public challenge would turn the drover into a duellist, and the story is about a watch, not a bout. |
| Whose problem? | The mortal's. The reeve sent for them, offered them the watch's command and a fee, and the village will judge them by whether the folds hold (agentRole: judge asked to rule). |
| Reach = theme? | Step 0 tests Eye and is *about* reading the ground to find why the pack comes here. Steps 1 and 2 test Iron and are *about* soldiering: posting a frightened watch, then holding a gate against a rush. |
| Mortal choice? | None. This is a test. `motivations: ['courage_prudence', 'sacrifice_survival']`. The scene is about holding a gate at risk and about standing between a village and its loss, so it draws mortals who lean hard either way on those values. No fork, so no pin. |
| Consequence hand (binding, THR-1145) | `secret` + `place`. Confirmed by `npm run draw:consequences -- encounter.town.wolf_winter_watch --reach iron --rarity 2`: secret (weight 3 in iron) and place (weight 4 in iron). No swap. |
| `secret` | (a) `hidden_mark` on `$cast:drover`, category `concealed_action`, step 0 `successMetadata`. The investigation finds that the drover staked the carrion. Concealed by design and not chipped. (b) `favor_creation` with debtor `$cast:drover`, on the success-side reaction "Keep the drover's secret". The drover owes the mortal for silence. |
| `place` | `apply_condition` `trait.condition.location.under_watch` on `targetLocationId: '$here'`, on the final step's `successMetadata`. The watch the mortal set stays on the village. This is a live condition (`condition-trait-content.ts`: "Someone is keeping eyes on this place. Quiet work here is harder and more likely to be seen."), with a duration row in `CONDITION_DURATIONS` and a Shadow step reader (`LOCATION_WATCHED_SHADOW_PENALTY`, THR-1483). A village that lost its fold has no honest location condition to land on (the levee-breach precedent in reverse), so `place` fires on the success side only. Chipped **BOON / gain**, deliberately unlike the three SCAR precedents: here the watch is the mortal's own work, and the Shadow penalty it carries is exactly what stops the next drover staking carrion by the folds (editorial ruling 3). |
| Standing (expert failure) | `reputation_with` `$here`: +0.06 on the final step's success, −0.06 on its failure. Also **−0.02 on the `failureMetadata` of steps 0 and 1** (editorial): any step's critical_failure ends the action (`unifiedActionLifecycle.ts:205`), so without these the critical_failure SCAR chip was unbacked when the action ended at step 0 or 1 (the `well-sinking` precedent). Worst success-side net: −0.02 −0.02 +0.06 = +0.02, so the success BOND chip stays honest. The village sent for the mortal, and the village judges. The chip noun `reputation with {location}` is anchored on `$here`. The village is what the prose means, so THR-1685 does not bite. There is no person-anchored reputation chip. |
| Cool failure? | Nobody dies, is jailed or branded. Sheep die, which is the winter, not the mortal. On failure the great fold falls, the reeve agrees to sell what is left to the drover at the drover's price, and the narrator names the scheme. On critical failure the reeve agrees to sell the flock for a handful of coin, and the valley hears whose command it was. Reputation before money. |
| Payoffs by band | crit: the fold holds and not one ewe is lost that night, the reeve turns the drover's offer down, and the mortal gains village standing, leaves the village Under Watch, and holds the drover's secret. success: the same writes. success_at_cost: the same writes, and the mortal gives the fee to the shepherds who lost ewes this winter (prose only). failure: village standing falls. crit failure: village standing falls, from whichever step ended the night. |
| Systems quota | cast (reeve, drover) + rewards (`hidden_mark`, `apply_condition`, `favor_creation` persist) + conditions (`apply_condition` on `$here`) + reputation (`reputation_with`) = 4. |
| Heavy Hand | None. The batch allowance is left for slot 4. |
| System target (rolled: items) | The watch's gear is the lever for two specials. The lanterns are what **Guard The Flames** acts on (step 1). The gate bar is what **Harden The Bar** acts on (step 2). No card grants content. |
| Trait hooks | Gate: no (no rule gates in this batch). Variant (step 2): **Hopeful** (`trait.core.core_hope.virtue`) +0.04, factorLine "Being Hopeful, they expect the gate to hold till dawn.", `addNudgeIds: ['wolf.raise_morale']`. **Bitter** (`trait.core.core_hope.vice`) −0.04, factorLine "Being Bitter, they expect the gate to fall before dawn." Trait-only card: yes, `wolf.raise_morale` on step 2 at cost 0. Trait fragment: the trait card's own band fragments. |
| Promises that pay off | "The pack passes the next village by" (the investigation's question). `critical_success` and `success` require a clean step 0 (`computeFinalActionOutcome` returns `success_at_cost` on any step failure, near miss or cost), so on those bands it is paid by step 0's afterimages. On `success_at_cost`, the overview states it as a fact true on every path ("{actor} knows now that {cast:drover} staked the carrion"). On `failure`, the narrator names the scheme ("This is what {cast:drover} staked carrion past the last fold to get."). "{cast:drover} … offers to buy the flock at half price" is paid off by the success overviews (the reeve turns it down) and the failure overviews (the reeve agrees to sell). The P3 stake ("{location} will think less of {actor}") is enacted on every failure path: step 2's `reputation_with −0.06`, and steps 0/1's −0.02 when the action ends there. |
| State classification | Scene-local: the pack, the ewes, the folds, the carrion, the watch, the lanterns, the gate bar, the offer, the fee, the drover's story. State read: the `{cast:*}` bindings, `{location}`, and the Hopeful/Bitter traits. State written: the hidden mark, Under Watch on the village, village standing, and (by reaction) a favour or a bond change. No agent history is asserted. |

## 1. Inspiration Anchors

- **The Trade War (Event archetype, via hook.trade_war).** It supplied the scheme. Money is war by another name: the drover does not attack the village, the drover moves its losses onto it and waits to buy. That keeps the opposition a beast while the cause stays human.
- **The Environmental Gauntlet (Ordeal archetype, via hook.environmental_gauntlet).** It supplied the pressure. The winter is the real threat, and the pack is its tool. "Losses accumulate" became the shepherds' losses the fee pays on success_at_cost.
- **Anti-Patterns (vault `Systems/Anti-Patterns.md`).** Three were steered around:
  - #1 The Dark Lord Problem / #9 Clean Moral Binaries: the drover is not evil. The drover drew the wolves off their own village's folds, and that saved their neighbours' sheep, before it made them a buyer. The P2 line gives the drover a voice and a self-serving story, not just a price. The keep-the-secret reaction exists because a mortal might think the drover has half a point.
  - #10 Player as Savior: the watch is the village's own, and the mortal commands it. Nobody is rescued by a stranger.
  - #6 Grimdark for Shock Value: the worst band is a flock sold cheap and a name spent, not a massacre of people.
- **Dilemma Library.** Not consulted. The encounter is not morally charged at the step level. The one moral fork, whether to expose the drover, lives in the aftermath reactions, where it is a stance and not a test.

## 2. Scale Justification

Medium. Three beats is what an investigation-then-resolution shape needs so the two resolution steps can use, or do without, what was found. The reward weight is an expert's: a village's standing, a watch left standing in the soldier's name, and a neighbour's secret to keep or spend. It is a local story about one village's winter, and it does not need a fork.

## 3. Pressure Knot

Since the snow came, a wolf pack has come down each night and taken ewes from the village folds. It passes the next village by. The reason is that the drover from that village has staked carrion past this village's last fold, drawing the pack across the valley. The drover says the pack simply likes this side of the valley, and offers to buy the frightened village's flock at half price before more are lost. The reeve cannot tell whether the village watch, a handful of farmhands, can hold, and has sent for a soldier of standing to size it up and command it for a fee.

## 4. Intervention Fantasy

The god works on the ground and the things the watch holds, never on the soldier's orders. It lays a trail plain in the snow, trips a liar over their own story, keeps the lanterns burning through a squall, and makes an oak bar take a weight it should not. For a Hopeful soldier it wakes the thing in them that makes frightened farmhands stay at a gate. The player watches an expert do a hard, unglamorous job, and tilts the night.

## 5. Cast and World Objects

| Object | What it is | Binding |
|---|---|---|
| `{cast:reeve}` | The village reeve. Sent for the mortal, offers them the watch's command and a fee. Decides whether to sell the flock. Unnamed in the opening; named at step 1, the reeve's beat. | supportBundle actor, `lazy-materialize-on-trigger`, must-persist. Reuse `elder`, spawn `elder`, spawnName **Hild Aysgarth**, supportRole `wolf_watch_reeve` |
| `{cast:drover}` | A drover from the next village. Says the pack likes this side of the valley, and offers to buy the flock at half price. Staked the carrion. | supportBundle actor, `lazy-materialize-on-trigger`, must-persist. Reuse `wanderer`, spawn `trader`, spawnName **Col Brannock**, supportRole `wolf_watch_drover`. Must persist: bears the hidden mark, may owe the favour, and is a bond target |
| `{location}` | The village. It sent for the mortal and it judges. | `$here`: `reputation_with`, and `apply_condition` Under Watch |
| the pack | The opposition. Weather with teeth. Never a monster template, never a fight gate. | prose only |
| the watch | Farmhands with spears, lanterns and one horn. | prose only (role-voiced) |
| the carrion, the folds, the great fold, the gate bar, the offer, the fee, the drover's story | Scene-local. | prose only |

**Class honesty.** `rural` expands to hamlet, farmland and mining. Only the hamlet roster seeds NPCs (`elder`, `wanderer` among them). At farmland and mining both specs spawn. "Reeve" and "drover" read correctly at all three. Neither cast member is gendered anywhere in this packet.

## 6. Beat Structure

1. **Find what draws them** (eye 0.56). The mortal walks the folds and the hill above them before dusk. Success finds carrion staked past the last fold and learns who left it.
2. **Set the watch** (iron 0.64). The reeve hands over the watch at dusk. The mortal posts frightened farmhands on the folds before the pack comes down.
3. **Hold the fold gate** (iron 0.68). On the coldest night the whole pack comes at once. The watch falls back to the great fold, and the mortal holds its barred gate until dawn while the drover waits at the lane's end.

**Engine note (editorial).** A `critical_failure` at any step ends the action there, whatever the step's `failBehavior` (`unifiedActionLifecycle.ts:205`). A step-0 or step-1 critical_failure afterimage therefore leads straight to the `critical_failure` aftermath, which is written to read true from all three steps.

## 7. Branching Profile

Linear — no branching. Branch count 0. Shape: Puzzle – Investigation – Resolution. Carryover lines on steps 1 and 2 carry what the step before found or failed to find.

## 8. Branching Map

N/A — linear encounter.

## 9. Outcome Ladder

| Band | Progress | Spent | New burden / opening |
|---|---|---|---|
| critical_success | The great fold holds and not one ewe is lost that night. The reeve turns the drover's offer down. | The night. | The village thinks well of the mortal. The village is Under Watch. The drover's secret is the mortal's to keep or spend. |
| success | The great fold holds. The flock stays in the village. | The night. | The same three. |
| success_at_cost | The great fold holds and the flock stays, but the night did not go clean (the carrion missed, the watch short, or the far folds lost). | The fee, given to the shepherds who lost ewes this winter. | The same three. |
| failure | The pack gets into the great fold. The reeve agrees to sell what is left to the drover at the drover's price. | The village's trust. | The village thinks less of the mortal. |
| critical_failure | The night breaks at whichever step it breaks: the shepherds will not serve, the watch will not stand, or the gate falls and the watch runs. The reeve agrees to sell the flock for a handful of coin. | The village's trust, and a soldier's name across the valley. | The village thinks less of the mortal. |

## 10. Sample Opening (rural, as the player meets it: opening + step-0 spine)

{actor} arrives at {location} in a hard frost.

Since the snow came, wolves take ewes from the folds each night. The pack passes the next village by. {cast:drover}, a drover from there, says the pack likes this side of the valley, and offers to buy the flock at half price.

The reeve sent for {actor} to size up the watch and command it for a fee. If the folds fall under that command, {location} will think less of {actor}.

*(79 words: P1 8, P2 42, P3 29. One named person on stage: {cast:drover}. The reeve is named at step 1.)*

## Openings (per class, P1)

- **rural:** `{actor} arrives at {location} in a hard frost.`

## Steps (full prose)

### Step 0 — eye 0.56 · purposeLine "Find what draws them" · failBehavior continue_weakened

**narrativeTemplate:** Since the snow came, wolves take ewes from the folds each night. The pack passes the next village by. {cast:drover}, a drover from there, says the pack likes this side of the valley, and offers to buy the flock at half price. The reeve sent for {actor} to size up the watch and command it for a fee. If the folds fall under that command, {location} will think less of {actor}.

| Afterimage | Text |
|---|---|
| critical_success | They found carrion staked past the last fold, and caught {cast:drover} bringing more. |
| success | They found carrion staked past the last fold, left there by {cast:drover} to draw the pack. |
| success_at_cost | They found the carrion and who staked it, and {cast:drover} saw them find it. |
| failure | They walked the folds and the hill until dark and found only tracks. |
| critical_failure | They blamed the shepherds' dogs for drawing the pack, and the shepherds have not forgiven it. |

**successMetadata:** `hidden_mark` { category `concealed_action`, severity 0.5, label "Staked carrion by a neighbouring village's folds to draw the wolves away from home", targetAgentId `$cast:drover`, revealFamilies [`investigation`] }

**failureMetadata:** `reputation_with` { targetLocationId `$here`, delta −0.02 } *(editorial: backs the critical_failure SCAR chip when the action ends here)*

**deal:** { count 3, tags [`insight`, `wild`] }

**Specials:**

1. `wolf.reveal_the_trail` — **Reveal The Trail** · type Boost (tracks) · sphere life · essence 2 · Δ 0.10 · image `generic.focus`
   - effectLine: Make the tracks of beasts plain in snow and mud, so a tracker can follow them back to where they began.
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

**narrativeTemplate:** The watch is a handful of farmhands with spears, lanterns and one horn. None of them has stood against wolves. At dusk the reeve, {cast:reeve}, hands the watch to {actor}. {actor} must post it on the folds before the pack comes down.

| Afterimage | Text |
|---|---|
| critical_success | Every fold had a lantern and a spear on it by dark, and the horn hung where all could hear it. |
| success | The watch stood at every fold by dark, and each farmhand knew where to run when the horn blew. |
| success_at_cost | The watch stood by dark, but a few farmhands went home rather than stand in the snow. |
| failure | The watch was still arguing over the lanterns when the light went. |
| critical_failure | Half the watch refused to stand, and told {cast:reeve} so in front of the others. |

**carryoverFactorLines** (keyed on step 0):

| Band | Text | Polarity | Δ |
|---|---|---|---|
| critical_success | The carrion is pulled up, and {cast:drover} dares not stake more. | for | +0.06 |
| success | They pulled up the carrion before dusk. | for | +0.04 |
| success_at_cost | {cast:drover} knows they found the carrion. | against | −0.02 |
| near_miss | They found the carrion late, with the light going. | against | −0.03 |
| failure | They still do not know what draws the pack. | against | −0.05 |
| critical_failure | The shepherds will not take orders from them. | against | −0.07 |

*(The critical_failure line is unreachable: a step-0 critical_failure ends the action. Kept per the `feud_mediation` precedent; the systems pass may drop it.)*

**failureMetadata:** `reputation_with` { targetLocationId `$here`, delta −0.02 } *(editorial: backs the critical_failure SCAR chip when the action ends here)*

**deal:** { count 3, tags [`might`, `peril`] }

**Special:**

3. `wolf.guard_the_flames` — **Guard The Flames** · type Boost (light) · sphere light · essence 2 · Δ 0.10 · image `generic.light`
   - effectLine: Keep lamps and fires burning through wind and snow, so watchers see what comes at them.
   - critical_success: No lantern on the folds went out in the wind.
   - success: The lanterns burned steady on every fold through the first squall.
   - success_at_cost: The lanterns burned, and showed the watch how many wolves there were.
   - near_miss: The lanterns would not catch in the wind until the light was nearly gone.
   - failure: The lanterns burned, but the watch had set them where the pack never came.
   - critical_failure: A lantern tipped into the straw of the east fold, and the watch spent the dusk beating out the fire.

### Step 2 — iron 0.68 · purposeLine "Hold the fold gate" · failBehavior fail_action

**narrativeTemplate:** On the coldest night the whole pack comes down at once. The watch falls back to the great fold, where most of the flock is penned. {actor} must hold its barred gate until dawn. {cast:drover} waits at the end of the lane, ready to buy whatever is left.

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
| critical_success | The watch has had time to learn its posts. | for | +0.06 |
| success | The watch took its posts in good order. | for | +0.04 |
| success_at_cost | The watch is short of hands. | against | −0.02 |
| near_miss | The watch took its places late. | against | −0.03 |
| failure | The watch never settled on its posts. | against | −0.05 |
| critical_failure | Half the watch would not stand. | against | −0.07 |

*(The critical_failure line is unreachable: a step-1 critical_failure ends the action. Kept per precedent.)*

**successMetadata:** `apply_condition` { conditionTraitId `trait.condition.location.under_watch`, targetLocationId `$here`, intensity 0.6 } · `reputation_with` { targetLocationId `$here`, delta +0.06 }

**failureMetadata:** `reputation_with` { targetLocationId `$here`, delta −0.06 }

**traitVariants:** Hopeful (`trait.core.core_hope.virtue`) +0.04, factorLine "Being Hopeful, they expect the gate to hold till dawn.", `addNudgeIds: ['wolf.raise_morale']` · Bitter (`trait.core.core_hope.vice`) −0.04, factorLine "Being Bitter, they expect the gate to fall before dawn."

**deal:** { count 3, tags [`might`, `wild`] }

**Specials:**

4. `wolf.harden_the_bar` — **Harden The Bar** · type Boost (ward) · sphere matter · essence 2 · Δ 0.10 · image `generic.ward`
   - effectLine: Make wood and iron hold past their strength, so a shut door stays shut.
   - critical_success: The gate bar took the whole weight of the pack and did not crack.
   - success: The gate bar bowed under the rush, and held.
   - success_at_cost: The bar held all night, but the watch left the far folds to stand behind it.
   - near_miss: The bar held, but the hinge post split, and the gate hung by one side until dawn.
   - failure: The bar held, and the post beside it gave way.
   - critical_failure: The bar held until the post tore out of the frozen ground and took the gate with it.
5. `wolf.raise_morale` — **Raise Morale** · type Trait card · requiredTrait `trait.core.core_hope.virtue` · essence 0 · Δ 0.08 · image `generic.warmth`
   - effectLine: Wake their hopeful nature, so the people beside them take heart and hold their ground.
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
- Band coverage from specials alone: all six bands on every step. On step 2 this holds **without** the trait card (Harden The Bar now carries `success_at_cost`). Step 1's single special now carries `near_miss`. Confirm with `checkComposedHand`. Step 1 has one special, so its four-sphere floor leans on the dealer's sphere breadth.
- Type composition across the three hands, [Boost, Stumble] · [Boost] · [Boost, Trait], differs from `feud_mediation`'s [Boost, Boost] · [Stumble] · [Boost, Trait] (trigger 21).
- Over-exposed library cards: no special names `card.boost.core`, `card.boost.signature.energy` or any other capped member. `wolf.twist_a_tale` may carry `libraryCardId: 'card.stumble.signature.chaos'`, which is not on the over-exposed list. `wolf.raise_morale` may carry `libraryCardId: 'card.trait_card.core'`.
- The item lever (system target: items): the lanterns (step 1) and the gate bar (step 2, "its barred gate") are the objects the specials act on. Delete them from the spine and both cards are senseless here. The drover's story (step 0, P2) is what **Twist A Tale** acts on.

## 12. Linear continuation

See the step-1 and step-2 spines above. Step 1 is the handover at dusk: what the watch is and what is asked now. Step 2 is the worst night: the rush, the fall back to the great fold, the barred gate, and the drover at the lane's end. The stake itself was stated once, in the opening's P3.

## 13. Aftermath Paragraph

**Base overview:** The snow stops, and {location} counts its flock.

The page per band is in § 14b below: overview, chip captions, then reactions.

## 14. Aftermath Reaction Choices

**Success pair (critical_success, success, success_at_cost):**
- **Name the drover to the village.** Intent: The mortal names the drover to {location}. The village thinks the better of them, and the drover will not forget it. Effects: `reputation_with` `$here` +0.03; `bond_change` `$cast:drover` −0.12.
- **Keep the drover's secret.** Intent: The mortal keeps quiet about the carrion, and the drover owes them for the silence. Effect: `favor_creation` { magnitudeRange [0.2, 0.35], context "Kept quiet about the carrion staked by a neighbouring village's folds", debtorAgentId `$cast:drover` }.

**Failure pair (failure, critical_failure):**
- **Help the village count its losses.** Intent: The mortal stays to bury the dead ewes and mend the folds, and the village marks who stayed. Effect: `reputation_with` `$here` +0.03.
- **Speak against the sale.** Intent: The mortal tells the reeve the flock is worth more than the drover offers, and the drover hears of it. Effects: `bond_change` `$cast:reeve` +0.12; `bond_change` `$cast:drover` −0.12.

The two pairs are two stances each. On success: spend the truth for the village's regard, or bank it as a debt. On failure: make amends quietly, or take a side against the buyer. Every success overview says the mortal has told no one, so the secret the success pair offers is still a secret.

`failure` and `critical_failure` must override `reactions` with the failure pair. Otherwise they inherit the success pair (the feud-mediation precedent).

## 14b. The page per band

**critical_success** (reachable only with a clean step 0: the carrion was found and pulled up)
- Overview: {cast:reeve} turns down the drover's offer and sends {cast:drover} home. {actor} has told no one who staked the carrion past the last fold.
- BOND · reputation with {location} — causeClause "Not one ewe lost all night" · detail "{location} thinks well of {actor} now." (12 words)
- BOON · Under Watch (entityId `trait.condition.location.under_watch`, direction gain) — causeClause "Their watch stays on the folds" · detail "quiet work in {location} is harder now." (13 words)
- Reactions: the success pair.

**success** (reachable only with a clean step 0)
- Overview: {cast:reeve} turns down the drover's offer, and the flock stays in {location}. {actor} has told no one who staked the carrion past the last fold.
- BOND · reputation with {location} — causeClause "Kept the pack out of the great fold" · detail "{location} thinks well of {actor} now." (14 words)
- BOON · Under Watch — as above.
- Reactions: the success pair.

**success_at_cost** (reachable with step 0 missed, step 1 short, or step 2 at cost / near miss)
- Overview: {cast:reeve} turns down the drover's offer, and the flock stays in {location}. {actor} gives the fee to the shepherds who lost ewes this winter. {actor} knows now that {cast:drover} staked the carrion past the last fold, and has told no one.
- BOND · reputation with {location} — causeClause "Kept the pack out of the great fold" · detail "{location} thinks well of {actor} now." (14 words)
- BOON · Under Watch — as above.
- Reactions: the success pair.

**failure** (reachable only through step 2's `fail_action`; step 2's −0.06 always fires)
- Overview: {cast:reeve} agrees to sell what is left of the flock to {cast:drover}, at the drover's price. This is what {cast:drover} staked carrion past the last fold to get.
- SCAR · reputation with {location} — causeClause "The fold fell under their command" · detail "{location} thinks less of {actor} now." (12 words; the P3 stake, enacted in its own words)
- Reactions: the failure pair.

**critical_failure** (reachable from step 0, step 1 or step 2; backed by −0.02 / −0.02 / −0.06)
- Overview: {cast:reeve} agrees to sell the flock to {cast:drover} for a handful of coin, before the pack takes the rest. Every village in the valley hears whose command it was.
- SCAR · reputation with {location} — causeClause "Found wanting in the worst of winter" · detail "{location} thinks less of {actor} now." (13 words)
- Reactions: the failure pair.

**Page read (editorial, as one text per band).**
- **Truth by path.** crit/success need a clean step 0, so they never re-discover the carrion. success_at_cost states the knowledge without narrating when it came. critical_failure never says the watch ran, because two of its three paths end before the gate.
- **No fact told twice.** Overviews carry the offer's fate and the secret. Reputation chips carry the judgement and one cause clause. The Under Watch chip carries the condition's effect, not its name again. Reactions carry what to do next.
- **No conflict.** The success pair offers a secret every success overview says is still kept. The failure overviews say the reeve *agrees* to sell, so **Speak against the sale** argues a live question.
- The four-word run "thinks well of {actor}" repeats across bands, never within one page.

## 15. Aftermath Kit Summary

- **Visible:** village standing up or down; the village Under Watch (success side); a favour owed by `{cast:drover}` or a worse bond with the drover (by reaction); a better bond with `{cast:reeve}` (failure reaction).
- **Concealed:** the hidden mark on `{cast:drover}` (staked the carrion), revealable by `investigation` families.
- **The world remembers:** whose watch held the fold, or whose command lost the flock.

## 16. Support Bundle Contract

| Support object | Delivery mode | Source | Persistence | Future references | Status |
|---|---|---|---|---|---|
| `reeve` | lazy-materialize-on-trigger | reuse `elder`, else spawn `elder` "Hild Aysgarth" (supportRole `wolf_watch_reeve`) | must-persist | bond target (failure reaction) | ready |
| `drover` | lazy-materialize-on-trigger | reuse `wanderer`, else spawn `trader` "Col Brannock" (supportRole `wolf_watch_drover`) | must-persist | hidden-mark bearer; favour debtor; bond target; Stumble `opposes` target | ready |
| Under Watch on the village | `apply_condition` `$here` | `trait.condition.location.under_watch` (live, `CONDITION_DURATIONS` row, Shadow step reader) | condition edge on the place (expires by duration) | location page; Shadow step modifier in this place | ready |
| village standing | `reputation_with` `$here` | engine | edge | Location Profile standing row | ready |
| the drover's secret | `hidden_mark` | engine (`GameState.hiddenMarks`) | must-persist | investigation-family reveal | ready |

## 17. Self-Audit (updated by the editorial pass)

| Check | Verdict |
|---|---|
| Envelope: `rural`, one opening | PASS |
| Opening + spine ≤80 words | PASS (79) |
| One stake shape in P3 (opportunity: the command and a fee, at the cost of the name) | PASS. The value to take is now stated ("command it for a fee"). The P2 fact "the pack passes the next village by" sets up the investigation. It is stated as a fact, not a second stake. |
| One named person per beat | PASS (drover at step 0 / the opening; reeve at step 1; drover at step 2) |
| Hands 4–8 composed, ≤2 specials per step | PASS (5 / 4 / 4–5) |
| ≥4 spheres, ≥1 common option per composed hand | PASS on specials (life, chaos, light, matter). The dealt fill supplies the common option. Confirm with `checkComposedHand`. |
| Every special has a failure fragment; no big-delta card | PASS |
| Six StepOutcomes covered per step | PASS from specials alone on all three steps (step 2 without the trait card) |
| Trait hooks, four answers | PASS (gate: no; variant ×2; trait card; trait-card fragments) |
| Trait refs live | PASS (`trait.core.core_hope.virtue` / `.vice`) |
| Consequence hand wired: secret + place | PASS (hidden_mark on step 0; favor_creation by reaction; under_watch on `$here` on step 2) |
| Place condition id live | PASS (`trait.condition.location.under_watch`, `condition-trait-content.ts`) |
| Every chip backed by a write on every path to its band | PASS. Reputation gain → step 2 success `reputation_with +0.06` (worst success-side net +0.02). Reputation loss → step 2 failure −0.06 (failure band), and steps 0/1/2 failure writes (critical_failure band). Under Watch → step 2 success `apply_condition` (every success band runs step 2 on its success side). |
| Chip nouns are sheet words | PASS (`reputation with {location}`, `Under Watch`) |
| Chip sentences ≤15 words, no four-word run with their overview | PASS (12–14 words) |
| Page read, one text per band | PASS (editorial § 6b) |
| No word shared between a card's name and its effect line | PASS (Reveal/Trail vs tracks; Twist/Tale; Guard/Flames vs fires; Harden/Bar; Raise/Morale) |
| Card names open with an imperative-lexicon verb | PASS (reveal, twist, guard, harden, raise) |
| No class scenery beyond the opening | PASS |
| No invented agent history | PASS |
| No placeless promise (7b) | PASS |
| Vagueness lexicon in outcome prose | PASS by reading. "whatever" appears only in the step-2 spine (scene class). |
| Annotation clauses ≤1 | PASS (none by reading) |
| Systems ≥3 | PASS (4: cast, rewards, conditions, reputation) |
| Wolves are not a monster template or a fight/confront gate | PASS |
| Expert stakes: nobody killed, jailed or branded | PASS |
| `apply_condition` on `$actor` | None (the batch cap is untouched) |

## 18. Concept Art Direction

1. *Emotions:* a long winter wearing a village down; a small watch standing longer than it believed it could; a neighbour's quiet betrayal.
2. *Image:* a sheepfold gate at first light, its oak bar bowed but still across the posts. A lantern has burned down to its wick on the gatepost. Wolf tracks in the snow run up to the gate and turn away. In the far corner of the frame, a single wooden stake stands in the snow past the last wall, with a frayed cord tied to it. No people and no wolves.

## Experience Differentiator Gate (editorial, on this text)

**Scene & Prose (Doctrine v2)**
1. Opening follows arrival · situation & complication · problem, ≤80 words, real graph names, facts stated plainly? **YES** (79)
2. Every sentence doing challenge/test/outcome work? **YES**
3. Scene prose names the elements the hand acts on? **YES** (the drover's story and the tracks at step 0; the lanterns at step 1; the barred gate at step 2)
4. Could a player retell the situation and stakes after one read? **YES**: "Wolves are taking a village's sheep. A neighbour offers to buy the flock cheap. The reeve offers me the watch and a fee. If the folds fall, the village thinks less of me."
4b. No seam echoes? **YES**

**Choices & Intervention**
5. Every card spell-like, generic face? **YES**
6. Every card's price real and legible? **YES**
7. Every card pays off in failure? **YES**
8. Hand grounded? **YES**
9. No two cards buying the same certainty? **YES**
9b. Every nudge-bearing step carries a full hand, no branch or ending picked? **YES**

**Aftermath & Consequence**
10. Aftermath has its own prose landing? **YES**
11. Consequences actor-centred, chip nouns sheet words? **YES**
11b. Each band read as one assembled page? **YES** (§ 14b)
12. Medium scale offers reaction choices? **YES**
13. Reactions are different stances? **YES**

**Presentation**
14. Concept art uses the two-question method and shows residue? **YES**

## Branch Seduction Self-Check

N/A. The encounter is linear. The aftermath reactions carry the only stance choice. Each was tested for why a god would want it:
- Naming the drover buys a village's regard and costs a neighbour's goodwill.
- Keeping the secret buys a debt that can be called in later.
- Both are tempting with the labels removed, because each spends something the other keeps.
