# Encounter Pipeline: The Fallen Silver Drift
> Scale: medium | Slug: silver-drift-rescue | Pass: editorial
> Date: 2026-10-15 | Pipeline version: 2.0
> Batch: master-everyday-3 (THR-1840), slot 7 · id `encounter.town.silver_drift_rescue` · reach stone

**Verdict: PASS WITH REVISIONS.** The design is sound. The shape is a query prize on a three-step spine (read → shore → bring out). The opponent is plain (rock and bad air). Failure costs the name, and success ends warm, as the brief asks. Every hit below is a prose or page-read fix. Following the `tannery-fire` / `well-sinking` precedent, I applied each fix in this pass, and no trigger remains in `silver-drift-rescue-revised.md`. I made no change to mechanics. A scratch copy of the package with all 15 edits applied passes `check-encounter-batch3 --package` (OK, 0 warnings).

Triggers fired on the draft and fixed here:

- **35 (page conflict), failure and critical_failure:** both overviews say in the past tense that another crew *brought the miners out*. The reactions under them are "Wait at the mine mouth *until the other crew brings the miners out*" and "Leave *before the other crew comes*". Read as one page, the reactions ask the mortal to act before an event the overview has already finished.
- **35 (page repetition), critical_failure:** the overview's "The fall came down again on {cast:miner}" and the scar chip "{cast:miner} is wounded from the fall" tell the same fact twice.
- **35 (page conflict), success_at_cost:** "it ran longer than the reeve wanted" is false on the route most players reach this band by (a step-2 at-cost: the props, not the clock, failed — "the new drift is lost"). "The rescue went hard" adds nothing (verbosity).
- **35 (chip with no story), failure:** the scar chip is **Crushed Leg**, but the only route into failure is the step-2 failure afterimage ("The air went bad … {actor} got the diggers out"). Nothing on that route hurts {cast:miner}. The chip told a wound the story never told.
- **22 (seam echo):** opening P2 "The diggers can hear them knocking." → P3 "The diggers can go through the fall" (same sentence shape across the paragraph boundary). Step-0 success afterimage "{actor} chose the old workings" → step-1 spine "where {actor} chose". Step-2 cs afterimage "the roof came down behind the last of them" → cs overview "before the roof came down behind them". Step-2 success afterimage "All four miners came out … alive" → success overview "brought all four miners out … alive". Step-2 sac afterimage "All four miners came out alive" → sac overview "All four miners are out alive". Step-2 cf afterimage "{cast:reeve} sent down the valley for another crew" → the new cf overview.
- **Ladder blur (critical_success vs success_at_cost):** the step-2 cs afterimage and the sac afterimage told the same event ("the roof came down behind the last of them"). The best result and the costly result must not share their cost. On critical_success the props now hold.
- **15 (vagueness, outcome class):** step-0 cs afterimage "the diggers went in *that way*". `way` is a natural indefinite and is banned in afterimages. The private gate did not flag it (a probe with "something" in an overview also passed clean), so this checker does not scan these fields. Reading is the only floor here.
- **Effect line repeats the card's name (doctrine v2 correction 2):** Stir Dead **Air** — "Set the foul **air** … clean **air** reaches …". The self-audit row claimed this check passed. It did not.
- **29 (needs two readings):** Remember Lost Tunnels — "Bring back to the village's oldest diggers where the old workings ran, so a path around the fall can be named." The inverted object makes the sentence hard to read on the first pass.
- **Route gap, critical_failure:** the cf overview claimed the fall came down on the miner. The step-1 cf afterimage (one of three routes into this band) never mentions the miner, but the Wounded condition fires on that route. It is now told in the afterimage.

## 1. Prose Quality

**Opening (73 words after the edit).** Narrator-mode skeleton, done right. P1 arrival with the reeve's summons. P2 states the costs already paid ("They are alive." "Behind a fall the air goes bad."). P3 states one rolled stake (*choice*: through or around). The only defect is the "The diggers can …" / "The diggers can …" seam.

[EDITORIAL REWRITE] P3: "{cast:reeve} can send the diggers through the fall, or around it through the old workings, and asks {actor} to choose." The named person now opens the stake paragraph. The "where to dig" restatement is gone, because P2 already says what is being dug for.

**Spines.** Step 1 is clean apart from "chose" (fixed: "where {actor} said"). Step 2 is the best paragraph in the draft. It states the cost already paid (the bad air, the men too weak), the test (carry them through a narrow passage under a failing roof), and the Fellowship stake as a plain fact. I keep "It takes in whoever brings its people out": it is a stake, not announced mechanics. Doctrine v2 wants the stake said plainly, and the step-2 join enacts it.

**Afterimages.** They are short, one event each, and they read as a GM reporting. The best are step 0 sac (stood on the fall too long; a second slide where they had stood) and step 1 sac (the hoist-house timber: the mine cannot lift ore). Each gives a real, local cost. Fixes are listed above. The rewrites are:

- step 0 cs: "…and the diggers went in through them at once."
- step 1 cf: "The roof came down along half the drift, and the fall slid again on {cast:miner}'s side. The diggers got out, and {cast:reeve} would not send them back under the master's props."
- step 2 cs: "{actor} got all four out on their feet, and the props held behind the last of them. {cast:miner} walked down to the village unhelped."
- step 2 failure: "The air went bad before the men could be carried, and the fall slid again and crushed {cast:miner}'s leg. {actor} got the diggers out, but not the miners."
- step 2 cf: "…The diggers pulled the miner free with a crushed leg, and {cast:reeve} called everyone out of the drift."

**Band fragments.** Strong. Harden Green Timber's failure and cf fragments ("The props held, and the rock between them did not." / "The props held so hard that the roof broke around them instead.") are the god's hand working and the mountain winning anyway, which is the encounter's whole theme. One grammar fix: Still Loose Rock sac "a diggers' lamp went under a slide at the side" → "a slide at the side buried a digger's lamp."

**Card faces.** All six are verb + noun spells, and their targets were set up in the scene before the hand (the knocking, the old workings, the props/timber, the loose rock, the air, the weak men). Specials may name their targets directly (spec § card face, "that is what makes it a special"). Two fixes:

- Stir Dead Air → "Move the foul vapour out from behind the fall, so the men can breathe and the lamps stay lit."
- Remember Lost Tunnels → "Wake the oldest diggers' memory of the old workings, so they can name a path around the fall."

## 2. Branch Seduction Audit

Linear, so N/A. No step asks the player to pick a path. Through-or-around is the mortal's ruling (agentRole *judge_asked_to_rule*), shaped by the hand: the god can make the taps carry or wake an old digger's memory. Neither card picks the route for the mortal.

## 3. Branch Count Assessment

KEEP 0. A rescue is a sequence of jobs, not a fork. The batch's one fork is slot 8.

## 4. Scale Discipline Check

Medium, three beats, the batch's single 3-step slot, as the brief allots. Each beat tests a different stone question (read / build / endure). Curated aftermath with reactions on both sides. Correct.

## 5. Inspiration Anchor Honesty

`hook.shifting_shape` is real. The drift broke into unmapped old workings, which are both the danger (step-0 failure) and the way in (step-0 success). The anti-savior anchor holds: the god never digs, and the mortal rules and carries. Thematic Pillars (an indifferent world) holds: there is no villain, and the reeve's loss of trust is earned, not malicious.

## 6. Aftermath Payoff

It lands, and it centres on the agent: the Fellowship's rolls, the reeve's trust, the village's regard, a tool from the miners. Cool failure is kept: nobody dies, and the mortal is not hurt, jailed or branded. The failure page now says the master-specific cost plainly ("The reeve sent for a master, and now has to send again"). The cf page names the accusation ("tells {location} that the master read the rock wrong"). Success ends warm, as the brief requires for slot 7: the bell, the families, the gift.

## 6b. Page read (all five bands, from the package)

**critical_success** (draft)
> All four miners walked out of the drift before the roof came down behind them, and {location} rang its bell for them. The miners give {actor} a tool from the mine's store in thanks.
> - bond · a membership: Brought its miners out — {actor} is on the Builders Fellowship's rolls now.
> - bond · reputation: {cast:reeve} trusts {actor} now.
> - bond · reputation with {location}: {location} thinks well of {actor} now.
> > Seal the old workings · Prop a road for the crews

- **Seam echo** with the step-2 cs afterimage ("the roof came down behind the last of them").
- **Ladder blur:** the roof coming down behind is the sac cost ("the new drift is lost").

[EDITORIAL REWRITE] "{location} rang its bell for the four miners when they came home. The miners give {actor} a tool from the mine's store in thanks." The cs afterimage now has the props hold. Revised page: each block adds something, with no repetition and no conflict.

**success** (draft): "{actor} brought all four miners out of the fallen drift alive. The miners give …"
- **Seam echo** with the step-2 success afterimage ("All four miners came out into the daylight alive").

[EDITORIAL REWRITE] "The four miners are back with their families in {location}. They give {actor} a tool from the mine's store in thanks." Chips and reactions are unchanged and read clean under it.

**success_at_cost** (draft): "All four miners are out alive and give {actor} a tool … The rescue went hard, and it ran longer than the reeve wanted."
- **Seam echo** with the step-2 sac afterimage.
- **Conflict:** "ran longer" is untrue on the step-2-at-cost route.
- **Verbosity:** "went hard".

[EDITORIAL REWRITE] "The miners give {actor} a tool from the mine's store in thanks. {cast:reeve} is counting what the rescue cost the mine." This reads true on every route: a lost morning, the hoist timber, the lost drift, or a stone on the miner. It does not conflict with "{cast:reeve} trusts {actor} now": the reeve can count the cost and still trust the master.

**failure** (draft)
> Another crew brought the four miners out two days later, alive. {cast:reeve} sent for a master to do it, and had to send again.
> - scar · Wounded: {cast:miner} is wounded from the fall.
> - bond · reputation: {cast:reeve} trusts {actor} less now.
> - bond · reputation with {location}: {location} thinks less of {actor} now.
> > Wait at the mine mouth (…until the other crew brings the miners out) · Leave before the other crew comes

- **Conflict:** the overview finishes the rescue in the past tense, and both reactions are set before it.
- **Chip with no story:** the Crushed Leg chip on a route where nothing touched the miner.

[EDITORIAL REWRITE] Overview: "{cast:reeve} has sent down the valley for another crew to dig the miners out. They are alive behind the fall. The reeve sent for a master, and now has to send again." Step-2 failure afterimage: the fall slides again and crushes {cast:miner}'s leg. Revised page: the overview gives the cause and the master-specific cost, and the chips give the changes. Both reactions now sit in the present before the crew arrives.

**critical_failure** (draft)
> The fall came down again on {cast:miner}. Another crew brought the four out days later, alive. {cast:reeve} tells {location} that the master read the rock wrong.
> - scar · Wounded: {cast:miner} is wounded from the fall. (+ reeve trust, village regard)

- **Repetition:** sentence 1 ↔ the scar chip.
- **Conflict:** the same tense clash with the reactions as on failure.
- **Seam:** with the step-0 cf afterimage ("came down again on the far side, on {cast:miner}").

[EDITORIAL REWRITE] "The miners are alive, and another crew is coming up the valley for them. {cast:reeve} tells {location} that the master read the rock wrong." I keep the accusation. It is the *why* (the specific charge the reeve makes), while the two chips carry the *how much*. That is cause plus change, not the same fact twice. It reads true on all three cf routes (step 0, step 1 and step 2 each now put the fall on the miner).

## 7. Dilemma Energy

The tension is real but practical, not moral. That is right for an everyday query-prize rescue. The god's choice is which of the mountain's threats to spend essence against: sound, memory, timber, rock, air, or the men's own legs. The cards answer different questions. The reactions carry the value axes:

- Success side: safety over silver (seal the old workings) against the mine's living over the families' fear (prop a road past the fall).
- Failure side: own the failure in public (wait at the mine mouth) against spare the name the sight (leave).

## 8. Experience Differentiator Gate (draft → revised)

1. Opening skeleton, ≤80 words, plain facts: YES (76 → 73).
2. Every sentence works: YES.
3. Scene names what the hand acts on: YES (knocking, old workings, props/timber, loose rock, bad air, men too weak to climb).
4. Retellable after one read: YES. Four miners alive behind a fall, bad air, choose where to dig, prop the drift, carry them out.
4b. No seam echoes: draft NO (six seams, listed above). Revised YES.
5. Spell-style faces with zero scene-bespoke prose: YES. The specials name their targets, which the spec allows.
6. Mechanism and real price: draft NO (Stir Dead Air repeats "air"; Remember Lost Tunnels needs two readings). Revised YES. Essence 2 on all six.
7. Failure payoff on every card: YES. All six have a failure fragment, and all six are below the 0.15 big-delta threshold.
8. Grounded before the hand: YES.
9. Different questions: YES (where the men are / where the old ways ran / timber strength / rock above / air / the men's legs).
9b. A 4–8 composed hand on each step: YES (2 specials + deal 3 = 5), and no branch pick.
10. Reflective landing: YES.
11. Character-sheet chip nouns: YES (Wounded, a membership, reputation, reputation with {location}).
11b. Page read clean: draft NO (failure, cf, sac, cs, success). Revised YES.
12. Reactions: YES (two per side).
13. Philosophical stances: YES (safety vs livelihood; public ownership vs sparing the name).
14. Evocative art: YES. Lamps hung unlit on pegs, one peg empty, timber and a tally stick, no people. The image is the waiting, not the dig.

## 9. Verdict

**PASS WITH REVISIONS.** The revised file is written. No trigger remains.

## 10. Revision Summary

**Must fix (applied):**
- failure and cf overviews (trigger 35: tense conflict with the reactions; cf repetition with the scar chip).
- sac overview (trigger 35: conflict and verbosity).
- step-2 failure afterimage (puts the crushed leg on the only route into failure).
- step-1 cf afterimage (puts the miner under the fall on that cf route).
- cs and success overviews, step-2 cs afterimage, opening P3, step-1 spine (trigger 22 seams; cs/sac ladder blur).
- step-0 cs afterimage "that way" (trigger 15).
- Stir Dead Air effect line (name word repeated). Remember Lost Tunnels effect line (trigger 29).

**Should fix (applied):**
- Still Loose Rock sac fragment ("a diggers' lamp").
- step-2 cf afterimage ending (removes the "sent down the valley" seam into the new cf overview).

**Consider (mechanics; not changed):**
- **sac carries nothing.** The brief's ladder says sac is where "the master carries something for it: a condition, a debt, an enemy". Here the sac chips are identical to success. A small `bond_change $cast:reeve` hit or a `reputation_with $here` dip on step-2 sac would put the cost on the sheet. The new overview ("counting what the rescue cost") would then have a chip to stand on.
- **Reeve chips are typed `reputation` but backed by `bond_change`.** The noun "reputation" passes the cover-the-title test. The systems pass should confirm the chip is backed by the effect that fires (Law 56).
- **"The Builders Fellowship holds this mine"** is a scene-local claim about a real faction at {location}. The step-2 join backs the *taking in*, not the *holding*. It is acceptable as scene-local invention. Flag it if the systems pass treats faction presence as graph state (prose rule 7).
- **Draft design-block typo:** "All four… six specials essence-priced (2)" is corrected in the revised packet to "All six specials".
- **Private gate coverage:** `check-encounter-batch3` did not flag "that way" in an afterimage, nor a probe "something" in an overview. If outcome-class vagueness is meant to be machine-enforced on these fields, the private checker is not doing it.
