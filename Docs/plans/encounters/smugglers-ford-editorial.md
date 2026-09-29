# Encounter Pipeline: The Salt Train at the Ford
> Scale: short | Slug: smugglers-ford | Pass: editorial
> Date: 2026-09-29 | Pipeline version: 2.0
> Critic: independent (batch journeyman-everyday-2, slot 4, THR-1677). Fixes applied directly to `smugglers-ford.package.json`; the package is the revised artifact (batch-1 shape, no separate `-revised.md`).

## Verdict: PASS WITH REVISIONS (applied)

## 1. Prose Quality

Narrator mode holds: every sentence reports a fact, and the fog and the river are stated as a clock rather than painted. The defects were at the seams and on the page, not in the register.

- **Opening → spine seam echo (trigger 22).** The opening said "a carrier *asks* for someone who can move unseen", and the spine closed on "The carrier *asks* {actor} to read…". The same verb carried the same beat across the boundary. The opening now says the carrier *looks for* someone.
- **The opening ran 81 words, not 80** (`check:encounter` counted what the doc block did not). The recount after the rewrite is 79.
- **The rolled hook was only in the doc block.** `hook.trade_war` never reached the page: nothing told the player *why* salt is being run past a post. `[EDITORIAL REWRITE]` spine, first sentence: "The ford's duty doubled this spring." Six words make the smuggling legible and honour the hook. The full spine now reads: "The ford's duty doubled this spring. {cast:carrier}'s mule train of untaxed salt waits in the reeds. The excise keeps a post on the far bank. The fog lifts and the river rises before dawn. If the post stops the train, the excise takes the salt and fines the carrier. {cast:carrier} asks {actor} to read the watch's rounds and take the lead rope."
- **The decline arm asserted knowledge the mortal may not have.** "tells the carrier when the watch turns" also runs after a step-0 *failure* ("The lanterns moved without a pattern they could find"). It now reads "marks out the gap in the watch instead". That line is true on every step-0 band, and it keeps the decline arm a shadow act (passing a smuggler's gap), so the arm tests its declared reach (trigger 26).
- **Lead arm, "{actor} takes the lead rope"**, directly after a spine ending "take the lead rope". It is now "{actor} takes the rope".
- **Band-fragment seam echoes on step 1 (trigger 22), three of them:**
  - The critical_failure afterimage "The post's lanterns found the train…" was followed by Hold Back The Water's "…and the lanterns found the train in it". It is now "…and the post had light enough to count every mule."
  - The failure afterimage "The fog lifted with the train mid-river…" was followed by "…the fog lifted anyway with the train mid-stream". It is now "The river held low for them, and low water hid nobody from the post."
  - The success afterimage "The last mule climbed the far bank…" was followed by "…until the last one was over". It is now "The river rose no higher than the mules' bellies all the way across."
- Count The Fine's success_at_cost fragment "stood clear in their head" was the one interior phrase. It is now "The price was clear to them, and weighing it slowed them."

## 2. Branch Seduction Audit

- **Lead (Puppeteer, shadow 0.45, `fail_action`).** The fantasy is backing a mortal who puts their own face under a lantern for someone else's profit. The value at stake is cunning, and the pole is named honestly. The asymmetry pays: on success, the road away with the train, the carrier's trust and a favouring omen; on failure, two scars, including the exciseman who now knows the face, and a turning omen.
- **Decline (Confessor, shadow 0.20, `fail_action`).** The fantasy is letting honesty win without making it free. The mortal hands back the rope, gives up the gap in the watch, and loses a little regard. The exit is cheap and legible.
- **Player cards only lean.** `Deepen The Fog` leans negative and `Count The Fine` leans positive. The mortal's `honesty_cunning` axis decides, and no card and no step picks the branch.

## 3. Branch Count — KEEP 2

## 4. Scale Discipline

The encounter is short scale: two beats and no reactions. Difficulties are 0.40, then 0.45 or 0.20, all within the 0.45 open-draw cap, with `intrinsicTier: 'background'`. That matches the binding brief row (shadow 0.40 → shadow 0.45).

## 5. Inspiration Anchor Honesty

Before the fix it was dishonest: `hook.trade_war` lived only in the doc block. After the fix, the doubled duty is the first sentence of the spine and the reason the train is in the reeds. The Pilot's Reckoning opt-in shape, the Assize Letter relocation and the Keeper's Petition omen are all visibly used.

## 6. Aftermath Payoff / 6b Page read

Every band was assembled in this order: overview, then scar · bond · boon · path. Each was read as one text, before and after the fix.

**Before, the defects (trigger 35):**
- **Lead success, repetition ×2.** The afterimage "The last mule climbed the far bank before the fog lifted" was followed by the overview "The whole train was up the far bank while the fog still held". The overview's "{actor} went on with the train toward the market" was then followed by PATH "{actor} is travelling away from {location} now". The departure was told twice, and "toward the market" named a destination that nothing writes, since `away` is a seeded pick. That was a latent conflict.
- **Lead success_at_cost, repetition.** The afterimage "the river took one mule and its load" was followed by the overview "the river took one mule and its salt in the deep water". The overview also said "{actor} went on with what was left" (the PATH repetition again).
- **Lead failure, repetition.** The afterimage "The fog lifted with the train mid-river" was followed by the overview "The fog thinned with the mules mid-river". The carrier chip's cause "The load was seized" then retold "The excise took the salt".
- **Lead critical_failure, repetition and a trigger-34 breach.** "wrote down a description of the guide" sat above the chip "Caught holding the rope — knows {actor}'s face now", and the afterimage had already put the rope in their hand. "A guide known at a post is no use on this road again" is a constraint on later behaviour that no effect enacts. It is the spec's own "never take that road again" example.
- **Lead crit_success, repetition.** "{actor} went on with the mules" duplicated the PATH chip.
- **Decline, repetition and verbosity.** Four of five overviews opened "{actor} kept out of the water". That is the same fact the step prose had just told, on every band. The success overview's "gave the carrier the watch's times" retold the step and its afterimage. The crit_failure chip cause "Called faint-hearted in the hamlet" retold both the afterimage and the overview.
- **Decline critical_success / success_at_cost, conflict.** These inherited the base overview "…and still no guide", under afterimages where the carrier *crossed*.
- **Omen, silent on two of three success bands.** The omen fires on every success-side band, but only crit_success said so.

**After (the pages as shipped):**
- **Lead success:** "The post never knew a train had passed, and {cast:carrier} paid the guide's share on the far bank. {location} says the river favours whoever crosses by night." / BOND · reputation with {carrier}: "{cast:carrier} trusts {actor} with a lead rope now." / PATH · seed: "{actor} is headed away from {location} with the salt train." Clean: the overview tells the post, the pay and the omen, and each chip tells one change.
- **Lead failure:** "The watch waded out and took the salt, and the excise fined {cast:carrier} for it. {location} says the river has turned against night crossings." / SCAR carrier: "{cast:carrier} thinks less of {actor} as a guide." / SCAR exciseman: "Seen holding the rope — {cast:exciseman} knows {actor}'s face now, and not kindly." Clean.
- **Lead critical_failure:** "The excise seized every mule and fined {cast:carrier} a season's profit. …turned against night crossings." / SCAR carrier / SCAR exciseman: "…knows {actor}'s face now, and has it written down." Clean, and the forward constraint is gone.
- **Decline failure:** "{cast:carrier} did not trust the reading, waited for a guide who never came, and watched the river rise over the ford. {location} says the ford has turned against night crossings." / SCAR: "{cast:carrier} thinks less of {actor} for refusing the rope." Clean.
- **Decline critical_success, success and success_at_cost** now each carry their own overview, in which the carrier crosses on the mortal's reading. The single SCAR "…thinks a little less of {actor} for refusing the rope" gives the reason the regard fell even though the carrier was thanked or paid. I read that as consistent rather than a conflict.
- **The omen is stated in words on every band where it fires** (see § 9).

## 7. Dilemma Energy

The dilemma is real. The rounds are read either way; the question is whether to put your own face under the lantern. The god's levers push in opposite directions: cover argues for the hidden way, and the counted price argues for the honest one. The god's posture is therefore visible in which card it plays.

## 8. Experience Differentiator Gate

1 YES (79 words, skeleton held) · 2 YES · 3 YES (fog, river, post, watch, fine, all in the spine before the hand) · 4 YES · 4b YES (after the four seam fixes) · 5 YES (after the face fixes, below) · 6 YES · 7 YES (every special has a failure-band fragment; none is big-delta) · 8 YES · 9 YES (cover vs price vs water vs the watchman's eye) · 9b YES · 10 YES · 11 YES (`reputation with {target}`, and `seed` per the Assize Letter precedent; see systems § 5 for the tooltip caveat) · 11b YES (after the page fixes) · 12 N/A · 13 N/A · 14 YES (after the fix, below).

**Card faces (trigger 16).** Three effect lines only read at this ford. All four are now generic spells, with the scene wording kept in `bandProse`:
- **Deepen The Fog**: "Thicken the mist until a figure cannot be told from a post at a stone's throw. Cover argues for the hidden way."
- **Count The Fine**: "Set the full price of being caught plainly before them, in coin and in name. It argues for the honest way."
- **Hold Back The Water** is unchanged in name. Its effect line is now "Slow a rising river for an hour, so a crossing stays passable a little longer." ("one hour" became "an hour", and "a ford" became "a crossing".)
- **Turn A Sentry's Eye**: "Draw a watchman's gaze to some small noise elsewhere, long enough for someone to slip past." The old "for the moment a crossing needs" carried a nominalised-lexicon word (`the moment`) and scene furniture.

**Trigger 6 / Q14, concept art.** The draft's direction ("mules waist-deep in a brown river… one hand on the lead rope") illustrated the scene's action, which is exactly what the trigger forbids. `[EDITORIAL REWRITE]`: the emotions are complicity, and a breath held against a clock. The image: a wet lead rope coiled on a flat stone at the water's edge, nobody holding it, and across the river one lantern haloed in fog. The picture is residue and absence, not the action.

## 9. The author's doubts, settled

- **The omen has no chip. Is the overview's plain statement enough?** Yes, now that it is on *every* band where the omen fires. `emit_omen` is not in `CHIP_BACKING_EFFECT_KINDS` by the module's own ruling, so it cannot carry a chip. The chronicle prints the `narrativeHook` as a narrative event, which gives it a second, player-visible surface. The overviews and the hooks were brought into agreement: "the river favours" and "the river has turned" in both places, where the draft had said "the fog" in one and "the river" in the other.
- **The relocation chip's noun.** It keeps `seed`, the shipped Assize Letter form. It is the only lawful sheet word without a new tooltip. See systems § 5 for the honest caveat and the follow-up.
- **Global-scope omens.** This is a runtime constraint, not a choice: `local` needs literal hex coordinates, and no sentinel binds them (`encounterAftermath.ts` degrades an unbound local scope to global anyway). The intensity is kept low (0.25 on the lead, 0.15 on the decline), and "the hamlet says" became "the country round says" in the hooks and "{location} says" in the overviews, because `rural` also expands to `farmland` and `mining`.
- **Declining forfeits both families.** I took the offered option. The decline arm's failure side now emits a quiet omen (cultural, chaos, 0.15): "…the country round says the ford has turned against night crossings." It matches the decline failure fiction exactly: the river rose over the ford with the salt still in the reeds. A decline that goes well still forfeits the hand, which is the opt-in precedent and reads correctly. Movement stays lead-only, because a mortal who refused the rope has no reason to leave.
- **crudType.** `update` maps to `assist` (`CRUD_TO_ENCOUNTER_TYPE`). The mortal is assisting someone else's crossing, so `update` is right.

## 10. Revision Summary

- **Must fix (done):** the opening→spine echo and the 81-word opening; the hook brought onto the page; four band-fragment seam echoes; the trigger-35 repetitions on nine of ten bands; the trigger-34 "no use on this road again"; "toward the market" and "will sell at the old price" (unenacted); the decline base-overview conflict; four scene-bespoke card faces; illustrative concept art; the omen made visible on every band that fires it.
- **Should fix (done):** the chip `concepts` whose text never occurs in the sentence (`trusts`, `knows their face`, `{actor}`). `applyConceptDecorations` matches by substring, so they rendered as nothing. The carrier's bond chip now says "trusts", the exciseman's concept is `knows`, and the dead `{actor}` concept on the PATH chip is removed (the Mason's Commission critic made the same fix).
- **Consider:** none.
