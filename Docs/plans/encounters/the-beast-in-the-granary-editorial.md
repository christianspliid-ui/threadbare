# Encounter Pipeline: The Beast in the Granary
> Scale: medium | Slug: the-beast-in-the-granary | Pass: editorial
> Date: 2026-08-26 | Pipeline version: 2.0

**Verdict: PASS WITH REVISIONS.** The design is the strongest thing in this draft and it survives untouched — a genuine two-sided fork, a composed hand whose two beat-1 specials argue *against each other* on the axis the branch reads, and concept art direction that is a model of the two-question method. What failed is transcription and word-level discipline: a mandatory prose surface is missing entirely, seven vagueness-lexicon words sit in `outcome`-class fields, one aftermath paragraph addresses the player as "you", a card names an object the scene never introduced, and the drawn `membership` family has no runway in any prose the player reads. All of it is repairable by editing, and all of it is repaired in `the-beast-in-the-granary-revised.md`.

**On the automatic-REVISE list, stated openly so the batch report can overrule me.** Three SKILL § Pass 2 triggers fired on the draft as submitted — **15** (detector hits), **26** (a declared object the prose never uses), and the surface named by **25** (the outcome ladder "lives in afterimages and band prose", and no afterimage was authored). I did not bounce, for three reasons: the role file's own binding list — the seven that govern the verdict — contains none of them; v2 vests the revision in this pass, so the fix costs a text edit rather than a re-drafted design; and re-rolling a sound fork to correct seven word choices would trade the good half of this draft for the cheap half. If the director wants the strict reading, these three are the grounds.

---

## 1. Prose Quality

**The spine is genuinely good, and it is good in the way Doctrine v2 asks for.** Six sentences, each doing one job: the obstacle, the reason it cannot be walked around, the price already paid, the agent's claim, and the two costs. *"Two men who went in were carried out"* is the whole calibration exemplar in eight words — a cost already paid, stated, not staged. Nothing is felt; things are the case. This is the first draft in a while whose opening I would not touch for register.

I touched it for three other reasons.

**(a) The card's target is not in the scene.** `granary.weigh_the_winter` — a **beat-1** card — reads *"how much grain is in the bins"*, and its fragments lean on the bins twice more. The beat-1 spine says *"on the winter grain."* **The bins are never introduced before the hand that acts on them.** The variant paragraphs introduce them, but those are beat 2 — after the card has been played. Self-audit item 8 asserts the opposite (*"the bins introduced in the spine before `weigh_the_winter`'s fragments lean on them"*); the sentence it claims does not exist. This is Experience-Gate q8 and trigger 26, and it costs one word to fix.

**(b) The membership ending has no promise.** `civic_guard` — "the watch" — is the body the brief's drawn `membership` family resolves into. It carries a reaction, a chip, and half the `positive` pole's meaning. **It appears in no sentence the player reads.** The keeper's `factionDefId` is declared in the cast table and nowhere else, so *"the watch at {location} has asked {actor} to stand with them"* arrives in the aftermath as a body the encounter has never mentioned. A promise with a payoff and no setup is the mirror image of the defect trigger 26 names, and it is the single edit that does most for this encounter.

**(c) One paragraph breaks the third-person rule outright:**

> A bear that will not be moved moves **you**.

`positive` / `critical_failure`. Doctrine v2 sentence rules: *"Present tense, third person — the agent is always named, never 'you'"*, restated in the surviving-from-v1 list as *"no second person on any mortal-facing surface."* This is not a register judgement call, it is a hard rule, and it is on the encounter's most dramatic ending.

**[EDITORIAL REWRITE] — spine (P2 + P3), 70 words, 79 with the longest P1:**

> There the store is barred, and {cast:keeper} of the watch will not open it. A bear has denned inside, asleep on the bins of winter grain. Two men who went in were carried out.
>
> {name}'s pack went behind that bar at dusk, by local rule. Rouse the settlement and they burn the store to be rid of it. Go in quiet, and the bear lies between {name} and the door.

Three changes, each buying a specific defect: *of the watch* gives the membership ending a promise and reads a real declared cast property rather than inventing one; *asleep on the bins of winter grain* introduces the bins before the card that counts them and states the rolled `activity: sleeping` plainly instead of leaving it to "denned"; *by local rule* pays for the other two out of the word budget.

**[EDITORIAL REWRITE] — `positive` / `critical_failure`:**

> A bear that will not be moved moves the one who tries. {name} came out of the store on their back, the far door standing open and the animal gone into the dark past it. {cast:keeper} put fire to the building at first light anyway, because nobody would go in again to check. {location} lost the winter and kept the bear.

The aphorism survives; the second person does not.

### The vagueness ledger

Seven natural-indefinite hits in `outcome`-class fields, where the lexicon is enforced at zero. Self-audit item 39 checked a narrower list than the contract (`something` / `someone` only) and passed itself.

| Field | Text | Hit |
|---|---|---|
| `wake_their_fear` · success | "the floor gave **nothing** away" | `nothing` |
| `narrow_their_sight` · critical_success | "one **thing** in that room worth seeing" | `thing` |
| `narrow_their_sight` · critical_failure | "**Nothing** existed but the **way** out" | `nothing`, `way` |
| `positive` / `critical_success` | "found **nothing** missing but a burst sack" | `nothing` |
| `negative` / `success_at_cost` | "two **things** to be angry about" | `things` |
| `fallback` | "one **way** or the other" | `way` |

All six lines are rewritten in the revision. Note the `narrow_their_sight` critical-failure line also carried a `not … but` shape, which would have spent the encounter's single annotation clause on a card fragment.

### The missing surface

**No step authors an afterimage. Not one, on any of the three steps.** `ActionStep` carries five (`criticalSuccess` / `success` / `successAtCost` / `failure` / `criticalFailure`); the shipped composed-hand precedent `the-unfinished-rite.ts` authors all five on its single step; the detector spec names *"all five afterimages"* as an authored `outcome`-class field; and SKILL trigger 25 says in as many words that **the outcome ladder lives in afterimages and band prose**. This draft's §9 is a design table describing an outcome ladder that has no prose surface to live on. The implementation prompt tells Sonnet to copy afterimages *verbatim from the design document* — with none present, Stage 4 either invents them (a prose-fidelity breach on the surface where the player reads what happened) or ships an encounter whose outcomes are silent.

Action-level `narrativeTemplates` (`initiation` / `success` / `failure`) are likewise absent and likewise present in the precedent.

The design work was done — §9 is a good ladder. It was simply never written into fields. I wrote all fifteen afterimages and the three action-level templates from that ladder rather than bouncing the draft to have them transcribed.

### Beat 2 asserts a possession step 0 may not have minted

Step 0 is `failBehavior: 'continue_weakened'` and mints the pack on `successMetadata` only. Both branch paragraphs open **"{name} has the pack."** On a failed-but-continuing crossing, that sentence is false: the encounter proceeds to a fork whose prose states an artifact the engine did not spawn. Rewritten to describe position instead of possession, which is true under every step-0 outcome:

**[EDITORIAL REWRITE] — `positive`:**

> {name} reaches the pack and stops. The bear is asleep across the floor, and every bin of the settlement's winter sits behind it.
>
> There is a second door at the far end, barred from the inside. A bear will go toward cold air if there is cold air to go toward. {They} leave the pack by the near door and go the long way round.

**[EDITORIAL REWRITE] — `negative`:**

> {name} has a hand on the pack, and the near door is four steps of open board away.
>
> The bins behind the sleeping bear are not {name}'s and never were. The animal is close enough to both the pack and the door.

This edit also closes a seam the draft's own audit missed — see §8 below.

---

## 2. Branch Seduction Audit

Both branches survive. This is the part of the draft that most deserves to ship.

**`positive` — Put it out.** *Interference fantasy:* nudging a person into staying in a room they had already escaped. *Why a god chooses it:* a god who wants a mortal rooted gets the one night that turns a traveller into someone a place sends for. *Value protected:* the settlement's next season, and the mortal's place in it. *Asymmetries earned:* different reach (`iron`, not a second `shadow` roll), different difficulty, a different door, a different card, and a place condition the other pole cannot produce.

**`negative` — Get back out.** *Interference fantasy:* the discipline of taking exactly what is yours in a room full of what is not. *Why a god chooses it:* the thread stays portable — no roll, no address, nobody's. *Value protected:* freedom of movement. *Crucially, it is not the bad branch:* the settlement was always going to burn the store, and the mortal did not cause that. The draft earns this and it is the hardest thing about a `sacrifice_survival` fork to get right.

**Where the seduction is uneven, and I fixed it.** The `positive` variant authors both extremes (`critical_success`, `critical_failure`). The `negative` variant authors neither — three middling bands and no peak. A branch with the tails reads as the real branch whatever the design commentary says, and this one has three further symptoms of the same gap:

- §9's ladder promises a `negative` critical-success reading (*"they are out through the near door with their pack and the animal never stirs"*) that no authored band delivers.
- `granary.narrow_their_sight` carries `forecastDelta: 0.16`, so the spec **obliges** it to cover both failure bands — and it does — but its `critical_failure` fragment has no aftermath band to land in.
- The `negative` step's `failureMetadata` writes both the wound and the blight, so a critical-failure ending is fully backed and simply unwritten.

I authored `negative` / `critical_failure` and updated the branching map, the chip table and the ladder to match. The pole now has a floor as deep as the other's.

Interference fantasy at the card level is where this encounter is most itself: beat 1's two specials **argue opposite sides of the branch the god does not get to pick**. `Wake Their Fear` buys odds by making the door look like the only sane object in the room; `Weigh The Winter` buys odds by showing the mortal how many mouths are in the bins. Same step, same test, opposite futures. That is a real dilemma and it is genuinely rare in the corpus.

---

## 3. Branch Count Assessment

**KEEP 2.** Both branches are earned by different reaches, different difficulties, different cards, different doors, different aftermath variants and opposite place conditions on the location. Neither is a re-skin. A third would have to be invented — once the mortal is out of the store the encounter is over — and the shape catalog's Personality Fork is a two-pole structure by definition.

---

## 4. Scale Discipline Check

**Medium is honest.** Two beats against the 2–3 guideline. The `positive`/`negative` continuations are step definitions, not extra beats, so the branch node is one beat and not two. Reward weight matches settlement scale — a recovered possession, a place condition either way, a real wound risk — inside one night and one building. §2's argument (a single beat would collapse the fork into an outcome band; a third would have to be invented) is correct as written.

---

## 5. Inspiration Anchor Honesty

The best anchor table I have reviewed. Three things it does that most do not:

- **It names an anchor it deliberately did not open.** `Monster Archetypes.md` is recorded as *present, deliberately not opened*, with the reason (a bestiary is out of scope and a monster-archetype page could only have tempted one). That is the honesty rule working rather than being asserted.
- **It records the consequence it declined.** `Impossible Heist`'s *"theft is noticed; the owner will hunt you"* was **not** taken, with the reason stated — the agent is not stealing, which is what makes `agentRole: the client who is owed` load-bearing rather than decorative — and the declined consequence survives in reduced form as the `negative` pole's `hidden_mark`. Traceable in both directions.
- **The anchors changed the structure, not the flavor.** *Impossible Heist*'s layered-security note is why this is two tests with **different reaches per pole** rather than two `shadow` rolls; *Standing the Line* is why the axis is `sacrifice_survival` and why the wound exists; *The Dilemma*'s "the choice reveals who you are" is exactly what `decidedBy` mechanises. Each is a structural consequence with a citation.

No padding. Nothing cited that did not do work.

---

## 6. Aftermath Payoff

**It lands, and it lands actor-centred.** The keeper counts the bins by lamplight, twice. The watch asks the agent to stand with them. A traveller on the road bleeds when they lift the pack. These are faces and consequences, not stat deltas, and every one names a person or a place the player can point at.

Two structural strengths worth naming: the two poles **do not reconverge** — the settlement ends in opposite states and the fallback is the only shared surface — and the wound is a real condition with a duration edge rather than a narrated bruise, so failure is plot.

Repairs applied: the seven vagueness hits above; the second-person sentence; the new `negative` / `critical_failure` band. One thing I left alone and am flagging instead — `positive` / `success` and `critical_success` carry no chip for the recovered pack, though step 0 mints it on **both** poles and the `negative` side does chip it. Legal (Law 56 cl. 1 governs backing, not completeness), but the positive pole's most concrete gain goes unreported while the same gain is chipped on the other side. Stage 3's call whether to add it.

---

## 7. Dilemma Energy

**Genuine, and located in an unusual place.** The tension is not "which ending do I want" — the player cannot choose an ending, by construction. It is *"which argument do I make, knowing the mortal will answer it with who they are."* Both cards on beat 1 buy odds; they buy them by pushing opposite directions on the axis the branch reads. Spending on dread is spending on the exit. Spending on light is spending on the bins. That is a real cost structure and it reveals divine posture precisely because the god never gets the satisfaction of the decision.

The reaction pairs carry the same energy at a different altitude: belonging vs motion, simple mercy vs an expensive lesson, non-interference vs owing a place the truth. Three distinct philosophies of consequence, none of them scored.

One incoherence, fixed. `granary.let_it_set` — *"Let it set the way it wants"* — applies `axiological_mark_apply` at reach **`iron`** while its own design column explains the lesson as *"this mortal will do the arithmetic first"*, which is a lean toward **survival**. `sacrifice_survival` is Star's axis; the draft's own `granary.narrow_their_sight` uses `reach: 'star'` for exactly this reason two sections earlier. The reach contradicts the meaning. The label is also the one reaction in the packet that fails interactive plainness — *"let it set the way it wants"* leaves "it" genuinely ambiguous between the wound and the character, which is the one thing a click label may not do. Renamed **Let them learn caution**, reach corrected to `star`.

---

## 8. Experience Differentiator Gate

Verdicts are on the draft **as submitted**. Every NO is repaired in the revised file.

### Scene & Prose

**1. Opening follows the narrator-mode skeleton (arrival · situation & complication · problem, ≤80 words, real names, facts plainly)? — YES.**
P1 per class with `{name}` / `{location}`; P2 states the bar, the bear and the cost already paid; P3 lands one stake shape (`choice`) with two costed courses. 77 words as drafted, 79 as revised. Every fact is stated rather than encoded — *"{cast:keeper} will not open it"* is the sentence, not a shot of a hand on a lock.

**2. Every sentence does challenge/test/outcome work — no interior sensation, camera work, or jobless atmosphere? — YES.**
Audited sentence by sentence across the spine, both continuations and all seven aftermath paragraphs. No sensation from inside the scene, no camera, no scenery without a job. The one clause I would once have flagged — *"it is heavier in the hand than it was on the shoulder"* — is gone for a different reason (it asserted a possession step 0 may not have minted).

**3. Scene prose names elements the hand later acts on? — NO.**
`granary.weigh_the_winter` is a **beat-1** card acting on "the bins"; beat-1 prose says "the winter grain" and never "bins". `civic_guard` / the watch carries a reaction, a chip and the drawn `membership` family and appears in no prose at all. Everything else grounds correctly — the keeper, the bar, the sleeping animal and both doors are all introduced before the cards that use them, and the far door is introduced in `positive` prose before `granary.lift_the_bar` names it. **Fixed:** both objects are now in the spine.

**4. Could a player retell situation and stakes accurately after one read? — YES.**
*"Their own goods are locked in a store with a bear on them, and the only two ways to get them out either burn the village's winter or put them in a dark room with the bear."* One read gets you there.

**4b. No seam echoes? — NO.**
The two branch paragraphs shared a **verbatim twelve-word sentence** — *"The bear is asleep across the floor with the bins behind it."* Self-audit item 38 claims the opposite in terms (*"Neither shares a sentence shape with the other or with the spine"*). A player sees one pole per run, so this is not a seam the player crosses, which is why I am not treating it as the REVISE-grade class — but it is a corpus-level duplication and the audit that cleared it was not run. A second, milder seam: the spine ends *"the bear lies between {name} and the door"* and both continuations opened by restating the animal's position. **Fixed:** the two paragraphs now share no sentence, and each opens on its own new fact before re-establishing the room. One further echo I introduced and then removed in drafting the afterimages: `negative`'s `successAtCost` afterimage and the `negative` / `success_at_cost` aftermath paragraph both wanted "a boot-mark in spilled grain"; the afterimage now reports a bin going over and the aftermath reports what the keeper found, so the act and the discovery carry different detail.

### Choices & Intervention

**5. Every card face spell-style (imperative verb + noun title, 1–2 direct effect sentences, no flavor quote) with zero scene-bespoke prose? — YES, with one register correction.**
Four names, all imperative verb + noun, all ≤4 words, no flavor quote anywhere. On scene-bespoke: I am **not** firing trigger 16. The specials rule is that a special *knows something about this scene no generic card can know* — the shipped precedent `Loosen Their Nerve` reads *"Set the other reader second-guessing"*, naming its scene's cast in the same shape. Trigger 16 targets fiction on a card face, not a special naming its target.

The correction is a different one: three of the four lines are imperative-led and the fourth (*"Everything but the pack in their hands goes dim"*) is declarative, breaking the pattern a card row reads as a set. And *"dread of the sleeping thing"* is coy about the bear on a surface whose whole job is to be unmistakable. Both fixed.

**6. Every effect line states mechanism, and every price real? — NO.**
Three of four state mechanism cleanly. `granary.weigh_the_winter` does not: *"Show them how much grain is in the bins, and how many mouths that is"* states the **moral lean** and no odds mechanism at all. Why does counting a village's winter help a mortal cross a dark floor quietly? The `bandProse` answers it (*"They had the whole floor mapped before they moved"*) — the face does not, and the face is what the player buys from. **Fixed:** the line now names the floor as well as the count, so it earns its `forecastDelta` and keeps its lean.

Pricing is otherwise exemplary and worth saying so: `weigh_the_winter` is `essenceCost: 0` on `detectionDelta: 3`, and *the fiction and the price are the same fact* — the god lit a dark room, and light is what other gods read. That is the non-essence channel done right rather than bolted on.

**7. Every card pays off in failure (≥1 failure-band fragment; both bands when big-delta)? — YES.**
All four carry a `failure` fragment. `granary.narrow_their_sight` at 0.16 clears `NUDGE_BIG_DELTA` and covers `failure` and `critical_failure`. Correct.

**8. Every card grounded — its target established in prose before the hand is dealt? — NO.**
The bins, per q3. `Lift The Bar` (far door, introduced in `positive` prose above it), `Wake Their Fear` (the sleeping animal and the door, both in the spine) and `Narrow Their Sight` (the pack and the bins) all ground correctly. **Fixed.**

**9. The cards answer different questions? — YES.**
Beat 1's pair buy *opposite directions* rather than the same certainty — the clearest instance of this rule being satisfied rather than skirted that I have reviewed. Beat 2's single specials are pole-specific by construction. The dealt fill is type-deduplicated against the specials by the dealer.

**9b. Every nudge-bearing step carries a full authored hand, and no step asks the player to pick a branch or an ending? — YES.**
Three composed hands (6 / 5 / 5), 2 / 1 / 1 specials against the cap of 2. `authoredChoices` appears nowhere; the fork is `ActionStepBranch.decidedBy` reading the mortal's live axis plus the committed `poleLean`. There is no card, label or button that names a branch.

### Aftermath & Consequence

**10. Aftermath has reflective prose landing? — YES.** Seven authored ending paragraphs as drafted, eight as revised, each with a variant `overview` above it.

**11. Consequence outcomes actor-centred with names and faces? — YES.** Per §6.

**12. Medium+ scale: aftermath offers reaction choices? — YES.** Four pairs, one per face-group.

**13. Reaction choices represent philosophical stances? — YES**, with the `let_it_set` reach corrected per §7.

### Presentation

**14. Concept art direction uses the two-question method? — YES**, and it is the best art direction in the pipeline's recent output. Residue, not event: the paw-print instead of the bear, the spill instead of the raid, the far door's cold blue line instead of the escape. It states the encounter's two facts before a word of prose — *something very large is in here* and *there is another way out* — and the explicit **Not** clauses (not a bear rearing in a doorway, not a figure creeping past) show the method being applied rather than recited. Untouched.

**Gate result: 10 of 14 YES on the draft as submitted; 14 of 14 on the revised file.**

---

## 9. Verdict

**PASS WITH REVISIONS.**

The fork is real and both poles seduce. The hand is the best argument yet for the composed model — two specials that could not exist outside this scene, pushing opposite ways on the axis the branch reads. Scale is honest, the anchors did structural work, the findings are sharp, and the art direction is a template. What needed doing was transcription and word-level discipline, and it is done in `the-beast-in-the-granary-revised.md`.

**One caution for the batch report.** The self-audit is not reliable evidence for this draft. Items **8** (the bins are introduced in the spine), **11** (no effect line repeats a word from its own name), **38** (no seam echo; the variants share no sentence shape) and **39** (vagueness at zero in `outcome`-class fields) each assert PASS on a check that fails, and two of them assert a specific sentence exists that does not. The design work behind the audit is sound; the audit itself was written from intention rather than from the text. Worth a note in the report, because a 41-row self-audit that passes itself is a surface the pipeline is otherwise inclined to trust.

---

## 10. Revision Summary

### Must fix — applied

1. **Authored the missing outcome surface.** Fifteen afterimages (five each on step 0, `positive`, `negative`) plus action-level `narrativeTemplates` (`initiation` / `success` / `failure`), written from the draft's own §9 ladder. Without these the encounter has no prose where the player reads what happened.
2. **Cleared seven vagueness-lexicon hits** from `outcome`-class fields (`nothing` ×3, `thing`, `things`, `way` ×2), across two card fragment sets, two aftermath bands and the fallback. One of them also carried a `not … but` annotation clause.
3. **Removed the second person.** *"A bear that will not be moved moves you"* → *"…moves the one who tries."*
4. **Grounded the bins and the watch in the spine.** `weigh_the_winter` no longer names an object beat-1 prose never introduced; the `membership` ending no longer arrives from a body the player has never heard of. Paid for inside the 80-word budget (79 at the longest class).
5. **Stopped beat 2 asserting a possession step 0 may not have minted.** Both continuations describe position, not possession, and are true under every step-0 outcome. This also closed the verbatim sentence shared between the two variants.

### Should fix — applied

6. **Authored `negative` / `critical_failure`**, giving the survivor pole a floor as deep as the martyr pole's peak, paying off `narrow_their_sight`'s obligatory big-delta fragment, and backed by the `negative` step's existing `failureMetadata`. Branching map, chip table and ladder updated to match.
7. **`granary.let_it_set` → `granary.let_it_teach`, "Let them learn caution", reach `iron` → `star`** — the reach now matches the lesson the reaction's own rationale describes, and the label says what the click does.
8. **`weigh_the_winter`'s effect line now states its odds mechanism**, not only its moral lean.
9. **All four card faces are imperative-led** (Fill / Show / Open / Dim), and *"the sleeping thing"* is now *"the sleeping animal"*.
10. **Trait factor line cut from 15 words to 11**, inside the 12-word budget.
11. **Self-audit rows 3, 5, 8, 11, 20, 38, 39 rewritten to report the truth**, with the repairs recorded.

### Consider — flagged, not applied

- **The title's nouns appear in no sentence of the encounter.** The prose says *bear* and *the store*; the title says *Beast* and *Granary* — "granary" because the envelope's other two classes (wayside, stronghold) would make it wrong, which is exactly why the prose avoids it. The title passes the glance test and the template id was rolled by the brief, so renaming is not mine and not cheap. Recorded alongside the draft's own flag about `the-granaries-in-the-famine-year.ts`.
- **`libraryCardId` and the over-exposure census collide on `narrow_their_sight`.** The brief says every card matching a library member sets `libraryCardId`; this card's match is `card.undertow.signature.darkness`, which the same brief bans outright at 7 uses. Declaring a one-off is the only legal move and the draft took it with a stated reason — but the census is counted *from* `libraryCardId`, so the resolution is "the over-exposed card stops being counted." Adjacent to the draft's Finding #4 and worth folding into it. Separately, `granary.lift_the_bar` is the same shape as the shipped `Loosen Their Nerve` (a Stumble re-skinned onto a scene target), which **does** set `libraryCardId: 'card.stumble.signature.chaos'`; the draft's distinction — a named object rather than an opposed actor — is defensible, since `opposes` is unavailable here per its own Finding #1, but Stage 3 should rule.
- **No chip for the recovered pack on the `positive` faces**, though step 0 mints it on both poles and `negative` / `success` chips it. Legal; asymmetric.
- **The `$faction:civic_guard` anchor is a definition id, not a node id.** The catalog is explicit that chapters share a def id and a def id does not identify the body the player dealt with. The anchor kind is lawful and there is no content-side fix, so I have not folded the chip — the draft's Finding #2 sub-finding already names it. Reinforced here so the report carries it twice.

### Not my lane — passed through untouched

The draft's nine SYSTEMS findings stand as written and are Stage 3's and the batch report's business. Two are worth the report reading first: **#7** (the Composition Contract does not descend into branch variants, so two of this encounter's three composed hands and both pole-specific step writes are invisible to `check:encounter` — the gate reports green over exactly the half of a fork that the fork exists to create) and **#5** (a reaction-backed chip renders before the player can decline it). #7 is also the reason #5 could not be avoided here, which the draft traces correctly.
