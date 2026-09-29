# Encounter Pipeline: The Salt Train at the Ford
> Scale: short | Slug: smugglers-ford | Pass: draft
> Date: 2026-09-29 | Pipeline version: 2.0
> Template: `encounter.town.smugglers_ford` · Batch: journeyman-everyday-2, slot 4 (THR-1677)
> Package: `Docs/plans/encounters/smugglers-ford.package.json` (dry-run clean)

## 1. Inspiration Anchors

- **Hook taken: `hook.trade_war`** (two houses strangling each other over a route, and the settlements along it running short). This spring the lord of the far bank raised the ford's duty to choke a rival's trade, and the hamlet has gone short of salt. The salt train is that trade war as it looks from the reeds. It was rolled with `hook.broken_alliance` and `hook.dangerous_truth`. Both would need a second power on stage, and this scene's only opponent is the river and the fog, so neither was blended in.
- **Structural model:** The Run the Pilot Refused (`pilots-reckoning.package.json`), batch 1's opt-in complication. A plain step every mortal makes is followed by an agent-decided fork: one pole engages, the other declines cheaply. The two step-0 specials lean opposite poles. The **Assize Letter** package supplied the working `agent_relocation` shape (away, ≥3 hexes, travel) and its PATH chip. **Keeper's Petition** and **Crown's Reckoning** supplied the `emit_omen` shape (cultural, global scope, low intensity).
- **Anti-patterns avoided:** a personal condition as the failure penalty (failure costs the load, the fine and two people's regard); a teleport bolted onto the ending (the guide goes on *with the train*, which is why they left); lyric fog prose (the fog is a clock, stated as one).

## 2. Scale Justification

This is a short encounter with two beats at `scale: 'local'` and `rarityTier: 2`. The stakes are one carrier's season, one excise fine, and whether the post knows the guide's face. That is journeyman weight: real money, stated plainly, with no rule gate. The rolled `company` scale sits in the fiction as the mule train and its drovers.

## 3. Pressure Knot

A mule train of untaxed salt waits in the reeds below a ford. The excise keeps a post on the far bank. The fog lifts and the river rises before dawn. If the post stops the train, the excise takes the load and fines the carrier. **Contest (P3):** the crossing races the fog and the water, and both run on their own clock (terrain, indifferent). The post is the stake, not the opponent.

## 4. Intervention Fantasy

The god works on someone reading a lantern post from the reeds, then walking mules through deep water under it. At the reeds the god can thicken the mist or set the price of capture plainly before the mortal. Each card also leans the mortal: the mist toward the crossing, the price toward honesty. In the water the god can slow the rising river for an hour, or turn a watchman's eye at the moment the train passes. The mortal decides whether to take the rope.

## 5. Cast and World Objects

| Object | Kind | Notes |
|---|---|---|
| `{cast:carrier}` Wenna Tarrow | actor, trader/fence, must-persist | Asks for the guide; the `bond_change` counterparty on every band |
| `{cast:exciseman}` Oswin Keel | actor, guard/clerk, must-persist | Keeps the post; introduced in the lead step's prose. `bond_change` target on the lead path's failure side ("knows their face") |
| Relocation | `agent_relocation` `$actor`, away ≥3, travel | Lead path, success side: the guide goes on with the train |
| Omen | `emit_omen` cultural, global, 0.25 | Lead path, both sides: the ford favours night crossings (darkness) or has turned against them (chaos) |

## 6. Beat Structure

1. **Read the watch's rounds** (shadow 0.40, `continue_weakened`). Every mortal does the scouting.
2. **Fork on `honesty_cunning`**, Shadow's own pair (agent-decided, THR-894):
   - `negative` (Puppeteer): **Lead the train over the ford**, shadow **0.45**, `fail_action`. This is the test engaged.
   - `positive` (Confessor): **Hand back the lead rope**, shadow 0.20, `fail_action`. This is the cheap exit: the carrier gets the rounds, and the guide takes a small loss of face.

## 7. Branching Profile

- Branch depth: light · Branch count: 2
- Branching lives in step 1 (prose, test, hand), in the aftermath variant, and in the consequence hand. Only the lead path writes the movement and the omen.
- Convergence policy: none. The poles resolve to different aftermath variants.
- Shape: **Opt-in Complication**.

## 8. Branching Map

The step-0 specials carry pole leans. `Deepen The Fog` leans toward negative (cross) and `Count The Fine` toward positive (decline). The mortal's axis plus the net lean picks the pole, and fate rolls the result.
- **Negative (lead):** step 1 puts the exciseman on the post. Success writes the relocation, a trust gain with the carrier, and a favouring omen. Failure writes a regard loss with the carrier, a loss with the exciseman, and a turning omen.
- **Positive (decline):** step 1 is the handover. Success writes a small regard loss (-0.05) and failure a larger one (-0.12). There is no relocation and no omen: declining forfeits the drawn hand by design (flagged below).

## 9. Outcome Ladder

| Band | Lead path | Decline path |
|---|---|---|
| critical_success | Not one lantern turns; the carrier pays double; the hamlet reads the fog as favouring night crossings. Relocation + trust | The carrier learns the rounds by heart and crosses; small regard loss |
| success | Across while the fog holds; the salt sells at the old price. Relocation + trust | The carrier crosses with a hired boy; small regard loss |
| success_at_cost | Across, but one mule and its salt lost in the deep water. Relocation + trust | Paid less than offered; small regard loss |
| failure | The fog thins mid-river; the salt is seized and the carrier fined; the omen turns. Carrier and exciseman regard fall | The rounds are distrusted and the river rises over the ford. Regard falls |
| critical_failure | Every mule seized; a season's profit fined; the guide's description written down, which ends them on that road. Both regard losses | Named faint-hearted to the whole hamlet. Regard falls hard |

## 10. Sample Opening (rural, the only declared class): 80 words

> {actor} is in {location} when a carrier asks for someone who can move unseen.
>
> A mule train of untaxed salt waits in the reeds below the ford. The excise keeps a post on the far bank. The fog lifts and the river rises before dawn. {cast:carrier} has a season's money in the load. If the post stops it, the excise takes the load and a fine. The carrier asks {actor} to read the watch's rounds and take the lead rope.

## 11. The Hand Per Step

Each nudge-bearing step authors two specials and declares a `deal`. No `libraryCardId` is used, so the batch's over-exposed-card list is untouched.

**Step 0**: deal 4 `['shadow','insight']`
- **Deepen The Fog** (Boost + pole lean, darkness, 2 essence, +0.10, toward Puppeteer): "Thicken the mist on the water until a figure cannot be told from a reed post. Cover argues for crossing." Fragments: critical_success, success, near_miss, failure.
- **Count The Fine** (Boost + pole lean, mind, 2, +0.08, toward Confessor): "Set the price of being caught plainly before them: the load seized, a face the post will know. It argues for honesty." Fragments: success_at_cost, failure, critical_failure.

**Step 1, negative (lead)**: deal 4 `['shadow','journey','peril']`
- **Hold Back The Water** (Boost, time, 2, +0.12): "Slow a rising river for one hour, so a ford stays wadeable a little longer." Fragments: success, failure, critical_failure.
- **Turn A Sentry's Eye** (Whisper, chaos, 1, +0.07): "Draw a watchman's gaze to some small noise elsewhere, for the moment a crossing needs." Fragments: critical_success, success_at_cost, near_miss, failure.

**Step 1, positive / fallback**: deal 4 `['social','presence']`, no specials.

There is no rider, no delta ≥ 0.15, no grant and no cost channel. All six StepOutcomes are covered on every special-bearing step, and no card's effect line repeats a word from its name.

## 12. Branch-Dependent Later Paragraphs

- **Negative:** "{actor} takes the lead rope. The train goes into the water a mule at a time, within a stone's throw of the post. {cast:exciseman} keeps the post tonight and knows most faces on this road. The water is at the mules' bellies before the middle of the ford."
- **Positive:** "{actor} will not lead the train past the post. {actor} gives the lead rope back to {cast:carrier} and tells the carrier when the watch turns. The carrier has until the fog lifts to find another guide."

## 13. Aftermath Paragraph (lead path, success)

"The whole train was up the far bank while the fog still held. {actor} went on with the train toward the market, and the salt will sell at the old price."

## 14. Aftermath Reaction Choices

None. The consequence is clean: every write rides step metadata, so each chip is true on its band without a click.

## 15. Aftermath Kit Summary

- PATH · seed: "{actor} is travelling away from {location} now." Backed by `agent_relocation` on the lead path's success side. This copies Assize Letter's shipped shape.
- BOND · reputation with the carrier: a gain on lead success.
- SCAR · reputation with the carrier: a loss on lead failure and on any decline (larger on the decline's failure bands).
- SCAR · reputation with the exciseman: a loss on lead failure ("knows their face").
- Omen: no chip. `emit_omen` is not in `CHIP_BACKING_EFFECT_KINDS`, so the overview carries it in words ("the hamlet says…"). It is backed by the emitted omen's `narrativeHook` on the same band side.

## 16. Support Bundle Contract

| Support object | Delivery | Source | Persistence | Future references | Status |
|---|---|---|---|---|---|
| carrier | lazy-materialize-on-trigger | reuse trader/fence, spawn trader "Wenna Tarrow" | must-persist | `bond_change` target on every band | built |
| exciseman | lazy-materialize-on-trigger | reuse guard/clerk, spawn guard "Oswin Keel" | must-persist | lead-path prose; `bond_change` on lead failure | built |

## 17. Self-Audit

- PASS: the brief row. Id, reach shadow, settings `rural`, rarityTier 2, scale local and intrinsicTier background all match. Step 0 is 0.40 and the lead path 0.45; no step is above 0.45. **Flag:** as in pilots-reckoning, the fork step carries no top-level `difficulty`, so `measure:roll-spread` reads the mean as 0.40 (window fit 0.54, still journeyman).
- PASS: consequence hand `movement` (`agent_relocation`) + `omen` (`emit_omen`), both wired in context, with no swap. The dry-run's generated test stamps `['movement', 'omen']` from the id.
- PASS: no rule gate, no new tag, no new condition, no `apply_condition` on `$actor`, and no Heavy Hand.
- PASS: every chip is backed by a write that fires on its band. Chip nouns are `seed` and `reputation with {target}`, and each chip is ≤15 words. I varied the overviews so none repeats its step afterimage.
- PASS: the specials cap of 2 per step is held, and each special carries a failure-band fragment.
- PASS: the trait variants exist (`trait.core.core_integrity.vice` / `.virtue`, from `src/data/core-trait-content.ts`'s continuum builder). False gets +0.04 and True gets -0.04.
- FLAG for Pass 2: the decline pole forfeits both drawn families. Only the engaged path writes movement and omen, which matches the batch-1 opt-in precedent. If the critic wants the omen on every path, a quieter `emit_omen` on the decline's failure side ("the river rose over the ford with the salt still in the reeds") would fit.
- FLAG for Pass 2: the relocation chip uses the PATH · seed noun that Assize Letter shipped. A more literal travel noun does not exist in the tooltip vocabulary.
- FLAG for Pass 2: both omens are `scope: global`. A `local` scope needs literal hex coordinates, which a template cannot bind.

## Experience Differentiator Gate

1 YES · 2 YES · 3 YES · 4 YES · 5 YES · 6 YES · 7 YES · 8 YES · 9 YES (mist vs price vs river vs watchman) · 9b YES · 10 YES · 11 YES (carrier and exciseman named) · 11b YES · 12 N/A (short scale) · 13 N/A · 14: The concept art shows a lantern post on a far bank as a smudge of light in fog, with a line of laden mules waist-deep in a brown river below it and one hand on the lead rope in the foreground. The feeling is holding your breath against a clock.

## Critic revisions

Applied 2026-09-29 by the independent critic loop (Passes 2, 3 and 3b). Full reasoning is in `smugglers-ford-editorial.md`, `-systems.md` and `-package.md`. The package JSON is the revised artifact, and the sections above are kept as drafted.

- **Gate failures the dry-run did not show.** `check:encounter` failed the draft: the lead purposeLine ran 6 words (the cap is 4), and the opening ran 81 words. The purpose lines are now "Lead the crossing" and "Hand back the rope". The opening and spine are now 79 words.
- **Opening and spine.** The opening→spine "asks … asks" echo is gone (the carrier now *looks for* a guide). `hook.trade_war` is on the page as "The ford's duty doubled this spring." The stake is now "the excise takes the salt and fines the carrier".
- **Step 1 prose.** The lead arm opens "{actor} takes the rope", no longer echoing the spine. The decline arm says the mortal "marks out the gap in the watch instead", which is true after a step-0 failure and is a shadow act.
- **Card faces made generic (trigger 16):**
  - Deepen The Fog: "…from a post at a stone's throw. Cover argues for the hidden way."
  - Count The Fine: "…in coin and in name. It argues for the honest way."
  - Hold Back The Water: "for an hour … a crossing stays passable".
  - Turn A Sentry's Eye: "long enough for someone to slip past".
- **Band-fragment seam echoes fixed.** Hold Back The Water had three (success, failure, critical_failure). Count The Fine's success_at_cost fragment lost its interior phrase.
- **Aftermath page read (trigger 35).** Every lead overview used to retell its afterimage or its PATH chip. The overviews now carry the pay, the seizure and the omen. The PATH chip alone carries the departure ("is headed away from {location} with the salt train"). "Toward the market", "will sell at the old price" and "no use on this road again" are removed as unenacted promises (trigger 34). The chip causes that retold the overview are dropped. Four identical "{actor} kept out of the water" decline openers are gone. The decline critical_success and success_at_cost bands get their own overviews, replacing the conflicting "still no guide".
- **Omen.** The omen is now stated on every band where it fires, and the overview wording is aligned with the hooks ("the river favours" / "has turned against"). "The hamlet says" became "{location} says" and "the country round says", because `rural` also means farmland and mining. The author's option was taken: a quiet decline-failure omen (cultural, chaos, 0.15) on the positive arm and on the fallback.
- **Chip concepts.** The concepts now match the sentence text (`trusts`, `knows`), and the dead `{actor}` concept is removed. The BOND detail is now "{cast:carrier} trusts {actor} with a lead rope now."
- **`narrativeTemplates.failure`** now reads true on both arms: "The salt train did not get over the ford, and the carrier knows who read the watch."
- **Concept art (trigger 6, was illustrative).** The emotions are complicity, and a breath held against a clock. The image is a wet lead rope coiled on a flat stone at the water's edge, nobody holding it, and across the river one lantern haloed in fog.
- **Kept as drafted:** the `seed` PATH noun (the Assize Letter form; the tooltip caveat is logged in systems § 5); global omen scope (forced by the runtime); crudType `update` (→ `assist`); the decline arm's success bands forfeiting the hand (the opt-in precedent).
