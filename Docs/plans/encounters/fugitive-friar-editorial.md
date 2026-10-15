# Encounter Pipeline: The Fugitive Friar
> Scale: medium | Slug: fugitive-friar | Pass: editorial
> Date: 2026-10-15 | Pipeline version: 2.0
> Batch: master-everyday-3 (THR-1840), slot 5 · id `encounter.town.fugitive_friar`

**Verdict: PASS WITH REVISIONS.** On the draft as written, five automatic triggers fire:

- **15:** natural indefinites in outcome fields.
- **22:** seam echoes, and fragments that repeat their own afterimage.
- **31/34:** "named before the bishop's court". No effect enacts it, and no state backs it.
- **35:** failure overviews that contradict the opening. The `success_at_cost` overviews are false on the paths that reach them.
- **26:** the smugglers who enrol the master never appear in the scene.

Every defect is word-level, inside a field that already exists. No id, reach, difficulty (0.74 / 0.80 / 0.76), delta, essence cost, deal, cast key, consequence family, effect or Heavy Hand changes. The precedents are `well-sinking`, `comet-disputation` and `wool-staple`: triggers fired and were fixed in the same pass. If the orchestrator reads the triggers strictly against the unrevised draft, treat this as REVISE and use the revised file as the retry.

## 1. Prose Quality

**The opening is close.** It has the right skeleton, narrator mode and real names, and the crux lands in one read. It has three faults:

- P1 ("on the night its gates are shut") and P2 ("has shut the gates") say the same fact twice inside 30 words.
- The P3 stake "Anyone caught hiding him will be named before the bishop's court" promises a court proceeding. No effect on any path enacts it (rule 34). The design block concedes the point: "the bishop's court hears the master's name — and that is all it does". The only write behind it is `reputation_with $here`. So the stake now names what the engine does.
- `lostBadly` and both crit-fail overviews repeated the court line. They are fixed with it.

[EDITORIAL REWRITE] (77 words):

> {actor} has taken lodgings in {location} for the night.
>
> The bishop has condemned a friar for preaching against the tithe. The friar escaped his guards. The watch has shut the gates and is searching the town house by house. The friar is hiding in the stable behind {actor}'s lodgings.
>
> Brother {cast:friar} asks {actor} to get him out before the morning bells. Anyone caught hiding him will lose the town's trust. First {actor} must find a way out.

**Detector hits in outcome fields (trigger 15).** `way` appears in step 0's failure afterimage ("found no sure way out"). `anything` appears in Slow The Pulse's crit-fail fragment. `nothing` appears in all three hide-arm success afterimages ("found nothing" ×3) and in Cloud The Watch's failure fragment. All of these are rewritten. Openings, spines and factor lines keep their natural indefinites, which are lawful in scene and interactive fields.

**Seam echoes and fragment-on-base repetition (trigger 22).** A fragment is appended to its band's afterimage, so each pair below shows on one page:

- Step-0 success afterimage "found the water-gate under the mill" is followed at once by the gate spine "to the water-gate under the mill". Same phrase, across the boundary. The spine now opens "{actor} decides to run" and reaches "the mill" by back streets.
- Gate crit afterimage "By the bells he was across the fields" sits under a spine ending "across the fields before the morning bells", and the crit overview "free on the far side of the fields" repeats it again. All three are rewritten.
- Hide crit afterimage "stood on the boards over the friar and found nothing" sits next to Thicken The Floor's crit fragment "stamped on the boards over the friar and moved on". That is the same image twice. The base text now has the sergeant search the stable, and the fragment keeps the stamp.
- Hide sac afterimage "lay under the floor … and fell sick" sits next to Slow The Search's sac fragment "the friar grew sick under the floor", and the sac overview "weak from the days under the floor". The fact is told three times. The fragment now shows the watch coming back, and the overview carries the cost.
- Gate sac afterimage "doubled the guard" is followed by the overview "chained and guarded now". The overview is replaced (see § 6b).
- Slow The Pulse success "watched which houses the watch searched" and Show The Way Out failure "watching the ones the watch held" are internal echoes. Both are rewritten.
- Slow The Pulse success repeated the base success fact (where the watch searches). Its sac fragment repeated "found the water-gate".

**Fragment-on-base conflicts (trigger 35 class):**

- Hide failure base text: "the watch sounded the stable floor and found the friar". Thicken The Floor's failure fragment: "The boards sounded solid, but the friar coughed". The base now reads with any hand: "searched the stable again and found the friar under the floor".
- Gate failure base text: "The watch came round early". Bend The Bars' failure fragment: "the noise brought the watch". The base now says only that the watch reached the gate first.
- Slow The Pulse's failure fragment ("waited for the watch to pass … and the watch never did") contradicted the step-0 failure base, in which the mortal asks around. It is rewritten so that both can be true.

**Plain-language and pronoun fixes:**

- "the race" (mill-race) is trade jargon (trigger 29 class). It is now "the stream" throughout.
- "sound every floor" is now "knock on every floor to hear if it is hollow".
- The sergeant may be a reused guard of any sex. "his men" and "kept his men at it" are now "the watch".
- "bent like a reed" is a literary simile. It is cut.

**Step 0 and the hide arm.** In the draft, step 0's success afterimage only found the water-gate. The hide arm's carryover line still read "They know the watch's road through the street", which nothing behind it supported. Step 0 is the master learning the way out *and* the search, so both success afterimages now carry the search fact. The carryover lines read true on both arms.

## 2. Branch Seduction Audit

The branch is agent-decided on courage_prudence. The player never picks it, and the two step-0 specials only lean it. That is correct.

- **Gate arm (Vanguard).** A courageous master runs tonight, because waiting means the search reaches the stable. The god gets the batch's one Heavy Hand (iron bent in the night, and the rival gods see it) and a Veil on the sergeant. The value it protects is the friar's freedom now. Its risk is larger (−0.07 to the town's trust) and so is its prize: the Thieves Guild's rolls.
- **Hide arm (Watcher).** A prudent master will not take a hunted man past an hourly round. They sit still under a house-by-house search. The god gets time and matter: a search that drags, and boards that ring solid. The value it protects is the friar's life without a gamble at the wall. It risks less (−0.05, no guild on offer) and pays the friar's trust in place of the guild.

Both arms are defensible, and each offers the god a different kind of hand. Neither should be cut.

## 3. Branch Count Assessment

**KEEP 2.** Two arms suit medium scale, and each arm has its own cast emphasis (the sergeant at the gate, or at the door), its own prize and its own failure texture.

## 4. Scale Discipline Check

Medium fits. There are two beats on every path, one agent-decided fork, five bands per arm and reactions. Nothing reaches past the settlement.

**Consider (not a stop): shape honesty.** The catalog's Opt-in Complication wants the decline to be "a cheap, legible exit (a delay, a toll)". Here the decline arm (hide) is priced at 0.76, inside the master band. The brief binds every step to 0.72–0.85, and the brief's own override reads the opt-in as "whether to get him out past the gate watch". So the decline is "decline the gate", not "decline the friar". Its cheapness is in what it risks: a smaller reputation swing and no guild. The design block says this plainly. I accept it, and the revised spine states the choice in both arms ("decides to run" / "decides not to run").

## 5. Inspiration Anchor Honesty

Honest. `hook.sacred_crime` read inside out, with the sentence as the order and the rescue as the crime, is what makes the friar cargo rather than villain. "The hunt passes by" is visibly the hide arm's shape. Setting aside `hook.apotheosis` is correct for a street job.

## 6. Aftermath Payoff

The payoff is actor-centred and lands on a named friar, a named item and a named guild. Three faults are fixed:

- **Invented and conflicting state (triggers 31 and 35).** Both failure overviews read "{location} trusted {actor} to get him out / keep him hidden". The town is the party shutting its gates and searching its houses. It trusted the master with nothing, and no state says otherwise. The reputation loss now has a stated cause that is true on the path: the watch knows whose stable he hid in, or the street knows who hid him.
- **`success_at_cost` overviews false on their paths.** `computeFinalActionOutcome` returns `success_at_cost` whenever any step failed, near-missed or cost. So the sac band is reached by "step 0 failed, then the arm succeeded cleanly". On that path the gate overview "the water-gate is chained and guarded now" is false, and so is the hide overview "weak from the days under the floor". Both sac overviews now state only what is true on every path to the band.
- **Critical failure across both routes.** A critical failure at step 0 ends the action before any arm. The two arm-specific overviews ("the bishop's watch took…") were close, but leaned on the court line. Both arms now share one overview: "Brother {cast:friar} is in the bishop's cells, and the watch has told the whole town that {actor} hid him." That is true on all three paths:
  - At step 0, the watch searched the stable behind {actor}'s lodgings.
  - At the gate, the sergeant saw their face.
  - At the hide, the friar was dragged out in front of the street.

  The SCAR chip is backed on all three paths by step 0's −0.03 or the arm's −0.07 / −0.05. The chip says "trusts {actor} less", not "far less", because the step-0 route writes only −0.03.

**Membership grounding (trigger 26).** The Thieves Guild enrols the master on every gate success, but no smuggler appears anywhere in the draft's scene prose. The gate spine now states it: "The town's smugglers use this gate on dark nights." The success overviews say the smugglers saw who got him out, so the chip lands on established ground.

**Reactions.**

- "Speak For Him At Court" promised a court appearance that nothing enacts (rule 34). It is now **Speak Up For Him**, an immediate act.
- "Let Him Stand Alone" is now **Keep Clear Of Him**, which is plainer.
- "Ask Him To Keep Preaching" had the intent "the cause goes on", a claim about the friar's future. The intent is now about {actor}'s stance.

## 6b. Page read (THR-1474)

The draft authored chip tags but no captions (§ 15), so its "11b YES (checked per band)" could not have been answered from a page. The revised file authors the captions. These are the assembled pages after revision:

**Gate · critical_success**
```
Brother {cast:friar} is free, and the watch does not know how he left. The smugglers who use the water-gate saw who got him out.
- BOND · a membership — The Thieves Guild has put {actor} on its rolls.
- BOON · Prayer Scroll — Brother {cast:friar}'s parting gift to {actor}.
> Ask Him To Keep Preaching — {actor} backs his cause, and he knows it.
> Ask Him To Preach Elsewhere — {actor} wants no more trouble between the town and the bishop.
```
Clean. The overview gives the cause (seen by the smugglers) and the chip gives the change (on the rolls). Draft fault fixed: the Prayer Scroll caption no longer names the scroll its tag already names.

**Gate · success** reads the same as crit, with the opening sentence "out of the town and on the road". Clean.

**Gate · success_at_cost**
```
Brother {cast:friar} is out of the town, after a night that went worse than {actor} planned. The smugglers who use the water-gate saw who got him out.
- BOND · a membership — The Thieves Guild has put {actor} on its rolls.
- BOON · Prayer Scroll — Brother {cast:friar}'s parting gift to {actor}.
> (success reactions)
```
Clean, and true on every path to the band. Draft fault fixed: the "chained and guarded now" conflict on the step-0-failed path.

**Gate · failure**
```
Brother {cast:friar} is in the bishop's cells, and the watch knows whose stable he hid in.
- SCAR · reputation with {location} — {location} trusts {actor} less.
> Speak Up For Him — {actor} says openly that he was wronged, and the town hears it.
> Keep Clear Of Him — {actor} lets the friar face the bishop alone.
```
Clean: cause, then change. Draft fault fixed: "{location} trusted {actor} to get him out" conflicted with the opening.

**Hide · critical_success**
```
Brother {cast:friar} is free, and the sergeant who searched the stable never knew he was there.
- BOND · reputation — Kept him hidden — Brother {cast:friar} trusts {actor} now.
- BOON · Prayer Scroll — Brother {cast:friar}'s parting gift to {actor}.
> (success reactions)
```
Clean. Draft fault fixed: "walked out … under the watch's nose" echoed the afterimage's "walked out with the carters".

**Hide · success**: "Brother {cast:friar} is on the road, and the street never learned he was there." Same chips. Clean.

**Hide · success_at_cost**: "Brother {cast:friar} is out of the town, after a search that came closer than {actor} wanted." Same chips. Clean. Draft fault fixed: the sickness was told three times.

**Hide · failure**: "Brother {cast:friar} is in the bishop's cells, and the street knows who hid him." Then SCAR, then the failure reactions. Clean.

**Both arms · critical_failure**
```
Brother {cast:friar} is in the bishop's cells, and the watch has told the whole town that {actor} hid him.
- SCAR · reputation with {location} — {location} trusts {actor} less.
> (failure reactions)
```
Clean. The overview gives the event and the chip gives the change. It is true from step 0 and from either arm.

**Verbosity, accepted.** The two success reactions sit on a page where the friar has already left. Reactions read as said at parting, and that is lawful.

## 7. Dilemma Energy

The dilemma is genuine. The god faces a hunted man and a master who will either run or sit still. Both are defensible and both are master-hard. The god's posture shows in what it buys: noise and a seen hand (Bend The Bars, detection), sight (Cloud), time (Prolong) or matter (Thicken). The step-0 specials lean the mortal one way or the other without choosing for them.

## 8. Experience Differentiator Gate (on the revised file)

1. **YES.** Opening skeleton: arrival, situation, problem. 77 words, narrator mode.
2. **YES.** After revision every sentence does challenge, test or outcome work. The cut lines are the "bent like a reed" simile and the repeated gate-shut fact.
3. **YES.** The water-gate, grating, stream, stable floor, sergeant and search are all named before the hands act on them.
4. **YES.** The situation retells in one line: hide a condemned friar or get him out; if caught, lose the town.
5. **YES (after fix).** The card faces are spell-style. "Bend The Bars → barred" (a name word repeated in the effect line) and "Cloud The Watch → until the next bell" (scene-bespoke) are fixed. "Slow The Search" is renamed **Prolong The Hunt**, so two hands do not both open "Slow The".
6. **YES.** The effect lines state mechanism: spot exits sooner, watch before moving, locked iron opens, guards' sight dims, searchers tire, hollow sounds solid. The prices are essence, or detection on the one Heavy Hand.
7. **YES.** Every special has a failure-band fragment. There are no big-delta cards.
8. **YES.** Every card's target is in the prose before its hand: exits and the watch (opening), the grating (gate spine), the watch at the gate (gate spine), the search (hide spine) and the floor (hide spine).
9. **YES.** The cards answer different questions in every hand: two opposite leans; iron versus sight; time versus matter.
9b. **YES.** Each step has 2 specials and a deal of 4, composing to 6, and no step asks the player to pick a branch. The hide arm's missing `near_miss` was fixed with a Prolong The Hunt fragment.
10. **YES.** Each arm has a reflective overview per band.
11. **YES.** The chip nouns are a membership, Prayer Scroll, reputation (friar, concept-anchored) and reputation with {location}. All of them pass the cover-the-title test.
11b. **YES (after fix).** See § 6b.
12. **YES.** Two reactions per side.
13. **YES.** Cause versus peace on the success side; loyalty versus self-protection on the failure side.
14. **YES.** The art direction is evocative and shows residue: a bent bar and a friar's knotted cord in the stream at dawn, with no people.

**Triggers 1–35, checked on the revised file:** none fire. On the draft, 15, 22, 26, 31, 34 and 35 fired, as listed above. Check 16 also fired at card level: the "barred" stem and "next bell".

## 9. Verdict

**PASS WITH REVISIONS**, applied in `fugitive-friar-revised.md`.

## 10. Revision Summary

**Must fix (applied):**

1. **Rule 34/31.** The bishop's-court stake is replaced by the town's trust. This touches the opening P3, `lostBadly`, both crit-fail overviews and the failure reaction. A single crit-fail overview, true from step 0 and from either arm, is shared by both arms.
2. **Trigger 35.** The failure overviews no longer claim the town trusted the master. Each states the cause that is true on its path.
3. **Trigger 35.** The `success_at_cost` overviews on both arms now hold on the "step 0 failed, then the arm succeeded" path.
4. **Trigger 15.** The natural indefinites in outcome fields are removed (`way`, `anything`, `nothing` ×4).
5. **Trigger 22.** The seam echoes and fragment-on-base repeats are rewritten (water-gate under the mill, across the fields, boards over the friar, sick under the floor, watch/watched).
6. **Trigger 26.** The smugglers are established in the gate spine before the Thieves Guild membership lands.
7. **Hide arm `near_miss`** (the draft's own flag). Prolong The Hunt gains "The search slowed, but one watchman came back to the stable alone that night to look again."
8. **Chip captions authored** for every band, and the page read is done.

**Should fix (applied):**

- The effect lines: Bend The Bars ("what was locked"), Cloud The Watch ("for an hour"), Show The Way Out and Slow The Pulse now state the step mechanism and use pole-neutral lean words ("acting at once" / "waiting").
- Slow The Search is renamed Prolong The Hunt.
- "race" becomes "stream"; "sound" becomes "knock on"; the sergeant's pronouns are removed; the reed simile is cut.
- Step-0 success afterimages carry the search fact, so the hide arm's carryover is true.
- The base failure texts are made hand-neutral (gate: the watch got there first; hide: searched the stable again).

**Consider (not applied):**

- The decline arm is a master-band test, not a cheap exit. It is accepted under the brief's binding difficulties; see § 4.
- On the gate arm's `success_at_cost`, the master carries no cost of their own. The brief's band table wants "a condition, a debt, an enemy". Adding one is an effect change outside this pass. The systems pass may consider whether a step-0 failure write already covers it (−0.03 reputation_with $here does fire on that path).
