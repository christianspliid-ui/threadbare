# Encounter Pipeline: Wolves at the Fold
> Scale: medium | Slug: wolf-winter-watch | Pass: editorial
> Date: 2026-09-30 | Pipeline version: 2.0 | Batch: expert-everyday-2, slot 3 (THR-1679)

**Verdict: PASS WITH REVISIONS** (every edit applied in `wolf-winter-watch-revised.md`).

The design is sound. An expert soldier is sent for, the shape is a real investigation feeding two resolution steps, the consequence hand (`secret` + `place`) is wired in context, and the reactions give two honest stances on each side. The binding slot row holds: eye 0.56 → iron 0.64 → iron 0.68, `rural`, `secret` + `place`, `encounter.town.wolf_winter_watch`.

The draft had four real defects. All of them are text-level or one-effect fixes, and none changes the shape, the steps, the ids or the hand:

1. **The success overviews were false on the paths that reach them** (trigger 35, conflict; trigger 26). The draft reasoned that the overviews must reveal the carrion "when step 0 did not find it". The engine makes that path impossible for two of the three bands: `computeFinalActionOutcome` (`src/engine/unifiedActionLifecycle.ts:344`) returns `success_at_cost` whenever *any* step failed, near-missed or cost. So `critical_success` and `success` can only be reached when step 0 succeeded and the carrion was already found and pulled up. On those bands, "At first light the watch follows the tracks back to carrion" retells a discovery made the day before. It also contradicts the reactions: if the watch traced the carrion, the whole village knows, and **Keep the drover's secret** / **Name the drover to the village** offer a secret that is no longer one.
2. **The critical_failure page was false on two of its three paths, and its chip was unbacked there** (trigger 35; Law 56 rule 0). A `critical_failure` at *any* step ends the action (`unifiedActionLifecycle.ts:205`, whatever the step's `failBehavior`). So the band is reached from step 0 (the shepherds' dogs), step 1 (half the watch refuses) or step 2 (the gate falls). The draft's "the watch ran" and "Their watch broke and ran" are true only on the third path. The SCAR reputation chip was backed only by step 2's `failureMetadata`, which never fires when the action ends at step 0 or 1. This is the `well-sinking` defect, and the fix follows its precedent.
3. **The P3 stake read as a plea, not an opportunity** (drafter's flag 4; Seed Dice die 1). The drafter flagged this correctly. "Asks {actor} to judge … and to command it" names no value to take. It also put a second named person on stage in the opening (the drover in P2, the reeve in P3), and **Twist A Tale** had no drover account in the prose to twist (Q8).
4. **Seam echoes and page repetitions** (triggers 22, 33, 35). Two carryover lines copied the afterimage just above them. The Under Watch chip told its own tag twice. The failure overview and its chip told the same loss twice.

---

## Rulings on the drafter's four flags

**(1) Step 1's specials don't cover `near_miss`.** *Lawful as drafted, but fixed anyway.* Band coverage is judged on the **composed** hand (spec § 4: "covered between the hand's fragments"), and the dealt members carry `BAND_FRAGMENTS`, so trigger 10 does not fire on its face. A `near_miss` on the lantern step is a real texture, though, and a one-special step should not hand its only authored texture to the dealer. **Guard The Flames** gains a `near_miss` fragment: "The lanterns would not catch in the wind until the light was nearly gone." The flag also missed a second gap. The draft claims step 2's specials cover all six bands, but only because the Hopeful trait card supplies `success_at_cost`. For every mortal who is not Hopeful, step 2's specials miss `success_at_cost`. **Harden The Bar** gains one: "The bar held all night, but the watch left the far folds to stand behind it." Both steps now cover all six bands from specials alone (step 2 without the trait card).

**(2) Success-band overviews assume the carrion was found.** *Upheld, and it is worse than flagged.* See defect 1. The overviews are rewritten to be true on every path to their band:
- `critical_success` / `success`: step 0 must have succeeded. So the overview does not re-discover the carrion. It states what the reactions need: `{actor}` has told no one who staked it.
- `success_at_cost`: step 0 may have failed. So the overview states the fact without narrating a discovery: "{actor} knows now that {cast:drover} staked the carrion past the last fold, and has told no one." That is true whether the knowledge came at step 0 or by morning.
- `failure`: the narrator pays off the mystery plainly ("This is what {cast:drover} staked carrion past the last fold to get."). That keeps the design block's promise on the side that never finds it.

The design block's "Promises that pay off" row is rewritten to match.

**(3) `trait.condition.location.under_watch` chip categorised BOON.** *Kept as BOON, with the sentence rewritten.* The three shipped precedents (`ledger-by-lamplight`, `the-sign-over-the-ruin`, `the-drowned-archive`) all chip Under Watch as SCAR/loss, because in each of them the watch works against the mortal's quiet work. Here it is the reverse. The watch is the mortal's own and outlasts them, and the condition's only reader, the Shadow step penalty (`LOCATION_WATCHED_SHADOW_PENALTY`, THR-1483), is exactly the thing that stops the next drover staking carrion by the folds. Spec § Consequences rule 3 says to pick the category the character would recognise. A soldier would call a watch that stays standing after they leave something earned. So BOON, `direction: 'gain'`, is the honest reading. The divergence from precedent is deliberate, and the systems pass should not "correct" it to SCAR. The draft's sentence failed on its own terms, though. "The watch they posted stays on — {location} is under watch now" says the tag twice and never states what the condition does (trigger 35, repetition inside one block). [EDITORIAL REWRITE] "Their watch stays on the folds — quiet work in {location} is harder now." (13 words.) That names the engine's actual effect, per the condition's own `description`.

**(4) The P3 opportunity reading may be thin.** *Upheld.* See defect 3. [EDITORIAL REWRITE] P3: "The reeve sent for {actor} to size up the watch and command it for a fee. If the folds fall under that command, {location} will think less of {actor}." Now there is something to take (the command and a fee) and a stated cost (the name). This matches the die-1 opportunity face. It keeps the agentRole, judge asked to rule ("size up the watch"). It also introduces the fee that the `success_at_cost` overview spends, which the draft's aftermath had used without setting it up.

---

## 1. Prose Quality

**Opening.** The skeleton is right and the register is plain. Three fixes:
- **One named person on stage.** P2 named `{cast:drover}` and P3 named `{cast:reeve}`. The reeve goes unnamed in the opening ("The reeve sent for {actor}…"). The reeve's name arrives at step 1, which is their beat ("At dusk the reeve, {cast:reeve}, hands the watch to {actor}."). The drover keeps the opening, because steps 0 and 2 are the drover's beats.
- **Ground Twist A Tale.** The draft's drover only made an offer, so there was no account to make "slip and contradict itself". [EDITORIAL REWRITE] P2's third sentence: "{cast:drover}, a drover from there, says the pack likes this side of the valley, and offers to buy the flock at half price." The drover's lie is now in the prose before the hand, and the Stumble's fragments ("said the pack came down from the north, then said the east") pay it off.
- **P3.** See ruling 4.
- **P1** drops "at the reeve's request", because P3 now carries the sending-for: "{actor} arrives at {location} in a hard frost." The count is P1 8 · P2 42 · P3 29 = **79** (≤80).

**Step spines.** These are clean narrator mode. Two fixes:
- Step 1: the reeve's name moves here (above).
- Step 2 "hold its gate" becomes "hold its barred gate". **Harden The Bar** acts on the bar, and the draft's Q3 answer ("the gate at step 2") left the bar itself unestablished.

**Afterimages.**
- Step 1's `critical_success` afterimage put the horn "at the great fold" before the great fold exists. The step-2 spine introduces it one beat later. [EDITORIAL REWRITE] "Every fold had a lantern and a spear on it by dark, and the horn hung where all could hear it."
- All others stand.

**Carryover lines (seam echoes, trigger 22).**
- Step 1 `critical_success`: "They caught {cast:drover} baiting the pack…" sat directly under the step-0 afterimage "…and caught {cast:drover} bringing more." [EDITORIAL REWRITE] "The carrion is pulled up, and {cast:drover} dares not stake more."
- Step 1 `success`: "cleared the carrion that drew the pack" echoed "to draw the pack". [EDITORIAL REWRITE] "They pulled up the carrion before dusk."
- Step 2 `critical_success`: "Every fold was lit and manned before dark." near-copied the step-1 afterimage "Every fold had a lantern and a spear on it by dark". [EDITORIAL REWRITE] "The watch has had time to learn its posts."
- Step 2 `success`: "The watch knows where to stand." repeated the shape of "each farmhand knew where to run". [EDITORIAL REWRITE] "The watch took its posts in good order."

**Card faces.**
- **Reveal The Trail**'s effect line: "Lay the passage of beasts plain" is a writerly register ("passage"). [EDITORIAL REWRITE] "Make the tracks of beasts plain in snow and mud, so a tracker can follow them back to where they began."
- **Raise Morale**'s "believe the night can be won" only reads in a night scene (trigger 16, scene-bespoke face). [EDITORIAL REWRITE] "Wake their hopeful nature, so the people beside them take heart and hold their ground."

**Aftermath overviews.** All five are rewritten; see § 6b.

## 2. Branch Seduction Audit

Linear, so there are no branches. The only stance choice is in the reactions:
- **Name the drover** (success side). The fantasy is exposure. It protects the village's right to know who did this to it. The god gets a little more village standing and an enemy in the drover.
- **Keep the drover's secret** (success side). The fantasy is leverage. It protects a neighbour who saved his own village's flock at this one's cost. The god gets a real `owes_favor` edge.
- **Help count the losses** (failure side). The fantasy is amends. It protects the soldier's name through work.
- **Speak against the sale** (failure side). The fantasy is taking a side. It protects the village's price and wins the reeve at the cost of the drover.

Each pair spends what the other keeps. With the overviews fixed, the secret is actually a secret, so the success pair now works. In the draft, the overview had made it public.

## 3. Branch Count Assessment

Linear; 0 branches; two reaction pairs. **KEEP 0 branches / KEEP the four reactions.**

## 4. Scale Discipline Check

Medium: three beats, reactions on both sides, an expert reward weight. It matches.

## 5. Inspiration Anchor Honesty

Honest. The trade war did shape the scheme: the drover moves losses rather than attacking. The gauntlet is the winter. The anti-pattern steering (the drover is not a dark lord) now shows in the prose too, because P2 gives the drover a voice and a self-serving story, not just a price.

## 6. Aftermath Payoff

The payoffs are actor-centred, and the village is the judge the P3 promised. The draft's weakness was the truth of the pages, not their payoff. Two additions:
- **Backing for the crit-failure chip:** `reputation_with` `$here` −0.02 on the `failureMetadata` of steps 0 and 1. The worst success-side net is −0.02 −0.02 +0.06 = +0.02, so the success-side BOND chip ("thinks well of") stays honest on every path. Every path to `critical_failure` now writes a loss.
- **The failure overview now pays off the mystery**, so no run ends without the player learning what drew the pack.

## 6b. Page read (assembled, per band, after the rewrite)

**Draft defects found by assembly:**
- *critical_success / success*: the overview narrates a first-light discovery that step 0 had already made (conflict with the step-0 afterimage and carryover). It also made the carrion public, which conflicts with both reactions.
- *success_at_cost*: "The far folds are empty" was false when the cost came from step 0 or step 1 and step 2 was a clean success ("the pack went back up the hill hungry"). It also echoed the s_a_c afterimage directly above it. "{actor}'s fee" appeared with no setup.
- *success* / *success_at_cost* chip "Held the great fold until dawn" repeated the step-2 afterimage "The gate held until dawn".
- *failure*: the overview's "When a soldier of {actor}'s name loses a fold…" and the chip "The great fold fell on their watch" told one loss twice. "of {actor}'s name" also asserted a standing no state backs (trigger 31).
- *critical_failure*: "the watch ran" and "Their watch broke and ran" conflict with the step-0 and step-1 paths into the band.
- *failure / critical_failure*: "{cast:reeve} sells …" followed by the reaction **Speak against the sale** offered to argue a sale the page said was done. Both overviews now read "agrees to sell".
- *Under Watch chip*: the tag was told twice (ruling 3).

**The revised pages, read as one text:**

`critical_success`
> {cast:reeve} turns down the drover's offer and sends {cast:drover} home. {actor} has told no one who staked the carrion past the last fold.
- BOND · reputation with {location} — Not one ewe lost all night — {location} thinks well of {actor} now.
- BOON · Under Watch — Their watch stays on the folds — quiet work in {location} is harder now.
> **Name the drover to the village** — The mortal tells {location} who staked the carrion. The village thinks the better of them, and the drover will not forget it.
> **Keep the drover's secret** — The mortal keeps quiet about the carrion, and the drover owes them for the silence.

*Read:* no fact is told twice. The overview gives the refusal and the secret. The chips give the loss count and the lasting watch. The reactions give what to do with the secret. There is no conflict: crit requires step 0 to have succeeded, so the mortal knows.

`success`
> {cast:reeve} turns down the drover's offer, and the flock stays in {location}. {actor} has told no one who staked the carrion past the last fold.
- BOND · reputation with {location} — Kept the pack out of the great fold — {location} thinks well of {actor} now.
- BOON · Under Watch — (as above)
> the success pair.

*Read:* clean. "Flock stays" is the result and "kept the pack out" is the cause. They are distinct facts.

`success_at_cost`
> {cast:reeve} turns down the drover's offer, and the flock stays in {location}. {actor} gives the fee to the shepherds who lost ewes this winter. {actor} knows now that {cast:drover} staked the carrion past the last fold, and has told no one.
- BOND · reputation with {location} — Kept the pack out of the great fold — {location} thinks well of {actor} now.
- BOON · Under Watch — (as above)
> the success pair.

*Read:* true on every path into the band, whether step 0 missed, step 1 ran short or step 2 lost the far folds. The winter's losses in P2 make "shepherds who lost ewes this winter" true regardless. The fee was set up in P3.

`failure`
> {cast:reeve} agrees to sell what is left of the flock to {cast:drover}, at the drover's price. This is what {cast:drover} staked carrion past the last fold to get.
- SCAR · reputation with {location} — The fold fell under their command — {location} thinks less of {actor} now.
> **Help the village count its losses** — The mortal stays to bury the dead ewes and mend the folds, and the village marks who stayed.
> **Speak against the sale** — The mortal tells the reeve the flock is worth more than the drover offers, and the drover hears of it.

*Read:* the overview gives the sale and the scheme, and the chip gives the judgement. "fell under their command" is the P3 stake enacted, in P3's own words, on purpose. The failure band is reachable only through step 2's `fail_action`, so step 2's −0.06 always fires.

`critical_failure`
> {cast:reeve} agrees to sell the flock to {cast:drover} for a handful of coin, before the pack takes the rest. Every village in the valley hears whose command it was.
- SCAR · reputation with {location} — Found wanting in the worst of winter — {location} thinks less of {actor} now.
> the failure pair.

*Read:* true from step 0 (the shepherds will not serve), step 1 (the watch will not stand) and step 2 (the gate falls). It is backed on all three by the new −0.02 writes plus step 2's −0.06.

**Verbosity:** none left. The draft's crit overview carried three sentences, one of which re-told step 0. Every block now adds something.

## 7. Dilemma Energy

The steps are tests, not dilemmas. That is correct for this shape, and the design block says so. The tension lives in the reactions, and those are now live on the success side. **Keep the secret** is tempting because the drover saved his own village's sheep, and the P2 lie makes the drover a person, not a villain.

## 8. Experience Differentiator Gate (on the revised text)

**Scene & Prose**
1. Narrator-mode skeleton, ≤80 words, real names, facts plain? **YES** (79; the draft was 77 but staged two named people and a plea).
2. Every sentence does challenge/test/outcome work? **YES**.
3. Scene prose names what the hand acts on? **YES**. The drover's story (step 0, now established), the tracks, the lanterns, and the *barred* gate (now established).
4. Retellable after one read? **YES**. "Wolves are taking a village's sheep. A neighbour offers to buy the flock cheap. The reeve offers me the watch and a fee. If the folds fall, the village thinks less of me."
4b. No seam echoes? **YES after revision.** In the draft, four carryover seams and one afterimage→chip seam echoed. All are fixed.

**Choices & Intervention**
5. Spell-style card faces, no scene-bespoke prose? **YES after revision** (Raise Morale's "the night" was removed).
6. Mechanism stated, price real? **YES** (essence 2 on four specials; the trait card at 0, priced by being Hopeful).
7. Every card pays off in failure? **YES**.
8. Every card grounded before the hand? **YES after revision** (Twist A Tale's target is now in P2; the bar is in the step-2 spine).
9. Cards answer different questions? **YES**.
9b. Full hand per nudge-bearing step; no branch or ending picked? **YES**.

**Aftermath & Consequence**
10. Reflective landing? **YES**.
11. Actor-centred; chip nouns are sheet words? **YES** (`reputation with {location}`, `Under Watch`; the Under Watch chip anchors the condition id, not `$actor`).
11b. Every band's page reads clean as one text? **YES after revision** (§ 6b). In the draft, the answer was NO on all five bands.
12. Reaction choices at medium? **YES**.
13. Philosophical stances? **YES**.

**Presentation**
14. Two-question art direction, residue not action? **YES**. The lone stake with its frayed cord is the right image, because it carries the betrayal with no figure in frame.

## REVISE triggers, checked 1–35

1 approach prose: present on all three steps · 2 generic god-verbs: none · 3 thread integration: Hopeful/Bitter variant plus the trait card · 4 reactions: two pairs · 5 reporter prose: none · 6 concept art: present and evocative · 7 hand size: 5 / 4 / 4 (5 for Hopeful) · 8 spheres/common: specials span life, chaos, light and matter, and the fill supplies the common option (confirm with `checkComposedHand`; step 1 has one special, so it leans on the dealer's sphere breadth) · 9 failure fragments: all five specials · 10 band coverage: **fixed**, now six on every step from specials alone · 11 digits in effect lines: none · 12 trait hooks: four answered, and `trait.core.core_hope.virtue`/`.vice` are live · 13 nudge payoff in base text: none · 14 instructing the mortal: none · 15 detectors: none by hand (the new outcome text uses no natural indefinites; "whatever" stays only in the step-2 scene spine; no "not … but") · 16 scene-bespoke faces: **fixed** (Raise Morale) · 17 mood effect lines: none · 18 envelope: `rural`, one opening, no class scenery · 19 riders: none · 20 zero-essence non-trait/dead grants: none · 21 family composition: per the draft, differs from `feud_mediation`; left to the systems pass · 22 seam echo: **fixed** · 23 static factor lines: carryover and trait variant only · 24 bystander: no · 25 announced mechanics: no. P3 states the stake as a cost · 26 design-block breach: **fixed** (the promise row was false for crit/success; the bar was declared but unnamed) · 27 title: passes the glance test · 28 crux: one sentence · 29 unreadable compression: none · 30 shape: catalog · 31 invented state: **fixed** ("a soldier of {actor}'s name" removed). "The reeve sent for {actor}" is the brief's scene-local premise, per precedent · 32 chip nouns: sheet words · 33 chip length/overlap: 12–14 words, no four-word run with the overview · 34 later-tense promises: none. The P3 "will think less" is enacted on every failure path now · 35 page read: **fixed** (all five bands).

## 9. Verdict

**PASS WITH REVISIONS**, applied. Every trigger hit was text-level, plus two small `reputation_with` writes that back an existing chip. Following the `well-sinking` and `comet-disputation` precedents (triggers fired and were fixed in the same pass), this is not a REVISE. No step, id, reach, difficulty, card id, cast key, consequence family or reaction effect changed.

## 10. Revision Summary

**Must fix (applied)**
1. Rewrite all five aftermath overviews to be true on every path into their band (§ 6b). Success overviews state that the secret is still the mortal's, which makes both success reactions coherent.
2. Add `reputation_with` `$here` −0.02 to the `failureMetadata` of steps 0 and 1, so the critical_failure SCAR chip is backed when the action ends early. **Systems pass:** confirm that the net-positive arithmetic on the success side (worst case +0.02) holds under whatever standing clamp applies.
3. Rewrite the opening: the P3 opportunity (command + fee), the reeve unnamed until step 1, and the drover's lie in P2 to ground Twist A Tale.
4. Fix four carryover seam echoes and the step-1 crit afterimage's premature "great fold".
5. Under Watch chip: stays BOON, and the sentence now names the effect.

**Should fix (applied)**
6. Add a `near_miss` fragment to Guard The Flames, and a `success_at_cost` fragment to Harden The Bar (the non-Hopeful gap the draft missed).
7. Step-2 spine: "barred gate".
8. Raise Morale and Reveal The Trail effect lines: plainer and generic.
9. Update the design block's promise, standing and payoff rows, the outcome ladder and the self-audit to match.

**Consider (not applied)**
- The `critical_failure` carryover lines on steps 1 and 2 are unreachable, because a step's critical_failure ends the action before the next step's panel exists. They are harmless, and the `feud_mediation` precedent keeps them. Leave or drop at the systems pass.
- "Every village in the valley hears whose command it was" is gossip fiction with no valley-wide write behind it. It is overview prose, so it claims no state. If a reader objects, "{cast:drover} tells it in every village down the valley" keeps the sting on a person.
