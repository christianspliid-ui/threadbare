# Encounter Pipeline: The Sign Over the Ruin

> Scale: medium (2 steps, 0 branches) | Slug: `the-sign-over-the-ruin` | Pass: **editorial**
> templateId: `encounter.border.the_sign_over_the_ruin` · Batch: border-perils (THR-1221), row **2 of 6**
> Date: 2026-08-24 | Pipeline version: 2.0

**Read for this pass:** the draft; `.claude/skills/encounter-pipeline/agents/editorial-prompt.md`;
`.claude/skills/encounter-pipeline/reference/nudge-authoring-spec.md`;
`.claude/skills/encounter-pipeline/SKILL.md` § *Automatic REVISE triggers* (all 31, run individually);
`Docs/canon/encounters.md`; `Docs/canon/prose.md`; the batch brief and the batch design row 2;
`src/data/__fixtures__/nudge-exemplar/swollen-ford-exemplar.ts`.

**Also read, because the draft makes checkable claims about them:** `src/data/nudge-card-library.ts`
(`SPHERE_SIGNATURES`, `CARD_CONTENT`, the member tables), `src/data/content-eval/nudgeAuthoringConstants.ts`,
`src/data/content-eval/nudgeAuditDetectors.ts` (`NOT_X_BUT_Y_PATTERNS`), `src/data/condition-trait-content.ts`,
`src/data/core-trait-content.ts` + `src/types/coreRegistry.ts`, `src/data/encounter-image-library.ts`,
`src/types/npc.ts` (`LOCATION_ROLE_ROSTERS`), `src/types/unifiedAction.ts` (the aftermath-change unions),
`src/engine/encounterAftermath.ts` (`SCENE_SENTINEL_FIELDS`), `src/engine/ruins/clueLifecycle.ts`.

---

## 0. Verdict up front

**PASS WITH REVISIONS.** This is a good encounter and a careful packet — the best-evidenced
draft this line has produced, and the first one whose claims about the codebase mostly survive
being checked against the codebase. The revised file is written and complete.

Four of the 31 numbered REVISE triggers fired (**#18, #22, #26, #29**), plus the spec's
**three-plainness-moves** rule (move 1, subject first). None is structural: every one is fixed
by editing sentences, not by redrafting the design. The hands, the steps, the bands, the trait
hook, the cast and the aftermath structure all stand as drafted, with one card-allocation swap
inside the row's own budget.

The single most serious change: **the encounter's declared prize was never delivered in prose.**
See § 3.

---

## 1. Prose Quality

### What is good, and should not be touched

The spine is the best paragraph in the packet:

> *"What crossed the sky over the ruin has not finished. A remnant of it hangs low over the
> broken stone, and it does not move the way light moves."*

Subject first, concrete, and the second clause does the whole job of making the thing eerie
without a single figurative word. "It does not move the way light moves" is exactly the register
this game wants: plain grammar carrying an uncanny fact. Likewise
*"Everyone who tried to look steadily looked away first"* — one dry line, no second turn on the
same beat, and it seeds step 0's test in the furniture rather than announcing it.

The grim is delivered plain, not as ornament, which was the specific risk on a grim row.
*"By dusk both sides had agreed on one point, and the point was them."* *"There is little left
to trace it to."* *"It carried far enough for the back of the crowd to hear the part that damned
them."* No archaism, no elevated diction, no mood-noun in the subject slot. Grim-as-lyricism
does not appear anywhere in this draft. **This is a PASS on the batch's hardest tonal ask.**

The failure bands read as plot, not punishment. A critical failure here is being run off ground
you were right about, carrying a fear you did not have this morning — that is a *story*, and the
pilgrim walking the agent out and refusing to say which reading was right is the best beat in the
encounter.

### Weak passages, with rewrites

**(a) Four verbless sensory fragments — plainness move 1.** Every one of the four openings
carries the same construction in the same slot:

> *"Wet ash on the air, and frost on the fallen blocks."*
> *"Crows, and the smell of wet iron."*
> *"Cold rain since noon, and smoke that will not lift."*
> *"Woodsmoke, and the cold coming off the wall."*

This is the exact shape THR-974's move 1 names as the counter-example
(*"The far bank, and behind them a plank going end over end…"*), and the golden exemplar does not
use it — its sensory line is *"The air is all mud and wet grain."*, subject and verb. The draft's
own self-audit claims "subject first in every sentence (no opening fragments)"; that claim is
false four times over.

`[EDITORIAL REWRITE]` — one clause each, no cadence lost:

- *"Wet ash hangs on the air, and frost still sits on the fallen blocks."*
- *"Crows have the run of it, and the air smells of wet iron."*
- *"Cold rain has fallen since noon, and the smoke will not lift."*
- *"Woodsmoke hangs over it, and the cold comes off the wall."*

**(b) Two aphoristic inversions and one cleft — plainness moves 1 and 3.**

> *"It read as familiar from top to bottom. Familiar is what it was not."* (A3, `near_miss`)
> *"They looked long past their limit, and long was not the same as clear."* (A5, `failure`)
> *"The ground half-remembered agreeing, and half is where it stopped."* (B3, `near_miss`)
> *"It is the pilgrim — {cast:witness} — who walks them out…"* (`critical_failure` overview)

Each is the writer turning the sentence back on itself for the shape of it. Move 3 allows one dry
line per beat; these are the *second* turn, and the first turn already landed.

`[EDITORIAL REWRITE]`

- *"It read as familiar from top to bottom. It was not."*
- *"They looked long past their limit, and the shape stayed as blurred as when they started."*
- *"The ground half-remembered agreeing, and stopped there."*
- *"The pilgrim — {cast:witness} — walks them off the ground, points them at a road, and does not
  say which reading was right."*

**(c) One sentence that needs two readings — trigger #29.**

> *"It cost them the room's attention for the rest of the day, because from the second sentence
> on, the question stopped being what the sign was and became who this was who claimed to know."*

Two subordinations and a stacked relative (*"who this was who claimed to know"*). I stumbled on it
twice reading aloud. Rule zero: splitting a dense sentence into two plain ones is always the right
trade.

`[EDITORIAL REWRITE]` — *"They got it said. From the second sentence on, the question stopped
being what was over the stone. It became who this was, standing up there claiming to know. Both
readings are still standing. So is a third, about them."*

**(d) A line borrowed verbatim from the golden exemplar.** A2's failure fragment opens
*"The light came true and showed them the stone."* The exemplar's *A Break of Light* fragment reads
*"The light came true. It lit a channel that had moved since the stakes went in."* The exemplar is
the quality bar, not a phrase bank; a distinctive four-word opener lifted intact is the
cross-template version of the house mannerism the draft's own § 13 was proud of avoiding.

`[EDITORIAL REWRITE]` — *"The light landed on the stone and showed every crack in it. What sat
above the stone stayed unlit."*

**(e) The initiation is the packet's one piece of reporter prose.** It is four flat statements of
fact, the last of them passive and inverted (*"has been read by nobody who stayed looking"*), and
it restates what the spine says better two beats later. Rewritten in § 2 below, where it is also a
seam problem.

---

## 2. Seam echoes — checked by reading, seam by seam

Five seams (four openings → spine, spine → step-1 prose), plus the initiation boundary and the
band seams. Named individually, as the prompt requires.

| Seam | Verdict |
|---|---|
| **ruin opening → spine** | **ECHO.** The opening ends *"arguing since first light"*; the spine's fourth sentence is *"A pilgrim who has stood here since first light"*. The same three-word phrase across the boundary — the draft's own § 13 checked only the *closing images* and so did not see it. **Fixed:** the ruin opening now reads *"arguing all morning"*, and the spine keeps sole title to "first light". |
| **battlefield opening → spine** | Clean on phrasing. But see § 4(a): the spine's *"the broken stone"* was unestablished at two of the four classes. |
| **wayside opening → spine** | **ECHO, and a muddle.** The opening ended on *"since the light over the waystation went out"*; the spine's second sentence turns on *"it does not move the way light moves"*. "Light" carrying two unrelated senses two sentences apart, and a reader can fairly ask whether the thing went out or is still hanging there. **Fixed:** *"since it came down over the waystation."* |
| **stronghold opening → spine** | **ECHO.** *"shouting the same two answers at each other"* immediately before *"Two readings have hardened already"* — the same count-image, delivered twice, and the second delivery is the one that matters. **Fixed:** *"shouting each other down since the gate shut"*, which also buys a causal link to the sentence above it and retires the `dawn` / `first light` near-synonym. |
| **spine → step-1 prose** | **Clean.** *"Everyone who tried to look steadily looked away first."* → *"They come down off the stone with a reading."* Different subject, different verb shape, no shared image. The draft's reading of this seam is correct. |
| **initiation → spine** | **ECHO.** *"What is actually over the stone has been read by nobody who stayed looking"* and *"Everyone who tried to look steadily looked away first"* are the same fact in two voices, on two surfaces the player reads in the same breath. **Fixed:** the initiation now owns the arrival and the stopped ground, the spine owns the looking. |
| **step-0 bands → step-1 bands** | Clean. The `said it` parallelism across the step-1 band rungs is deliberate laddering at the same rung, not a boundary echo — the draft's reading is right and I am not touching it. |
| **bands → overviews** | Clean. Each ending surface says only what it alone can say. Genuinely well done. |

**House-mannerism sweep.** "The X held. The Y did not." — zero occurrences, as claimed. Verified
across all 22 band fragments and all 10 afterimages.

---

## 3. Design conformance — the most serious finding

**The encounter's declared prize is never delivered in prose.** Trigger **#26** (a promise with no
designed payoff; a declared mechanic the prose never uses).

The design block says the base reward is `intel` — *"a reading the agent can state, **and a lead
the sign points at** (`spawn_clue`)"*. § 9.5 then says the fiction pays that off: *"What the
endings say about it — 'what the sign was aimed at, and it was not this ground' — is a claim about
what the mortal understood… The words live in the band `overview` and in step 0's
`criticalSuccessAfterimage`."*

**Those words are in neither.** I read all five band overviews and all ten afterimages: nothing in
the authored prose says the sign was aimed anywhere, or that the reading turned up a lead. The
step-0 critical-success afterimage says only *"The shape over the stone resolved, edge to edge, and
held still long enough to be read whole"* — a shape resolving, not a thing learned.

So the Investigation gate's prize, as the player experiences it, is "you read it successfully",
with no content behind the success. That is the specific way `Puzzle–Investigation–Resolution`
fails, and it fails here one layer deeper than the shape rule usually catches: the information is
correctly held *behind* the gate, and then never handed over.

`[EDITORIAL REWRITE]` — the payoff goes into step 0's base afterimages, where it is true on any
success-side roll of that step (`successMetadata`, which mints the clue, fires on `isStepSuccess`),
and where it stays independent of which cards were played:

- `criticalSuccessAfterimage`: *"The shape over the stone resolved, edge to edge, and held still
  long enough to be read whole. It was not aimed at this ground, and they came down knowing where
  it was aimed."*
- `successAfterimage`: *"They read it steadily and came down with an answer they could stand
  behind, and with the plain fact that the sign was not meant for this ground."*

This costs nothing, contradicts no band, claims no state (it is a claim about what the mortal
understood, which is scene-local and true regardless of whether `findAnyRuinId` returned a node),
and it makes § 9.5's argument honest instead of aspirational.

**Everything else in the design block holds.** Each step tests its declared reach — step 0 is
genuinely a Veil test (a thing that resists being read, and a reader who must hold their eye on it
while everyone else has stopped), not an Eye test in Veil's coat; step 1 is Eye (saying truly, in a
room that has voted). The draft's § 16 asked for a second opinion on exactly this and it survives.
Every declared mechanic surfaces in a card, a gate, a binding or an outcome. The agent is the
protagonist, not a bystander — they run both tests and the ground they are standing on has stopped
working. Systems count from the authored manifest is **3** (cast, rewards, conditions), which is
the floor. Motive routes are all four and all honest.

---

## 4. Class honesty across the four-class envelope

The batch design fixes all four classes with one opening each, so every setting-neutral surface
must read at all four. Two failures, both trigger **#18** (a spine or afterimage naming class
scenery).

**(a) "The stone" is the encounter's central noun and two classes never establish it.** The spine
says *"the broken stone"*; step-1 prose says *"come down off the stone"*; four afterimages and two
overviews say "the stone". The ruin opening earns it (*"frost on the fallen blocks"*) and the
battlefield opening earns it (*"a stone barn"*). The **wayside** opening gives a roofless
waystation with a doorframe of unstated material, and the **stronghold** opening gives a burnt
suburb described entirely in timber (*"roofbeams down"*). At those two classes the whole encounter
is standing on a stone nobody put there. The draft's § 16 anticipated the stronghold class being
"thinnest" and then did not fix it.

`[EDITORIAL REWRITE]` — two words, no rebalancing: wayside gets *"its stone doorframe still
square"*, stronghold gets *"roofbeams down, stone doorways standing"*.

**(b) The `failure` overview and the `critical_failure` overview name furniture two classes do not
have.** *"The pilgrim stayed at the wall"* — there is no wall on the battlefield (a ridge and a
barn). *"walks them out past the last fire"* — fires are established only at the wayside; the
battlefield has working carters and the stronghold has a road under a shut gate.

`[EDITORIAL REWRITE]` — *"The pilgrim did not move."* and *"walks them off the ground"*.

**Cast class-honesty checks out.** `LOCATION_ROLE_ROSTERS.wilderness` seeds `hermit`, `wanderer`
and `pilgrim` (`src/types/npc.ts`), exactly as the draft claims; `castle` seeds a garrison
establishment that would indeed be placeless on a wayside. The reuse-at-wayside / spawn-elsewhere
split is correct, the pilgrim reads at all four classes, `spawnName` is a real name, and the prose
never genders them. The single `{cast:witness}` token is placed where the name earns something.
**No finding.**

---

## 5. The three items the draft self-flagged — independent rulings

### 5.1 The two repeated card faces — **the author's arithmetic is correct; the repeat is forced; and it should stay**

I did not take this on trust. Enumerated from `src/data/nudge-card-library.ts`, the members
available inside row 2's binding type budget (`whisper`, `omen`, `veil`, `boost`, `trait_card`,
`mercy`) are:

| Type | Members | Sphere-carrying? |
|---|---|---|
| `whisper` | `card.whisper.signature.light`, `card.whisper.attunement.light`, `card.whisper.hunger.witness` | two, both **light** |
| `veil` | `card.veil.signature.darkness`, `card.veil.attunement.darkness` | two, both **darkness** |
| `omen` | `card.omen.signature.time`, `card.omen.hunger.wander` | **one** (`time`; the hunger unique is sphere-less) |
| `boost` | `card.boost.core`, `card.boost.signature.energy`, `card.boost.variation.patient` | **one** (`energy`) |
| `mercy` | `card.mercy.core`, `card.mercy.variation.witnessed` | none |
| `trait_card` | `card.trait_card.core` | none |

`SPHERE_SIGNATURES` signs exactly one type per sphere in this budget, so the reachable spheres are
`light · time · darkness · energy` — four, which is precisely `HAND_SPHERE_COVERAGE_MIN`. Both hands
need all four. `whisper` and `veil` each have a second member to spend, `omen` and `boost` do not.
**Two repeated faces is the minimum the budget admits.** The author did not miss a solution;
there is no solution.

The escapes I considered and rejected:

- **Reach outside the budget** (`heavy_hand`/force, `kindled_ambition`/spirit, `balm`/life) — this
  renegotiates the row, and the batch design is explicit that a draft "fills the spread; it does not
  renegotiate it". It would also spend card types the batch allocated elsewhere for anti-convergence.
- **Author a one-off card of a budget type at another sphere** — the exemplar does exactly this
  (its Boost is signed `light`, another `mind`, neither of which `SPHERE_SIGNATURES` signs). Legal,
  but it costs the brief's `libraryCardId` telemetry on that card, and an `omen` signed anything but
  `time` breaks the library's own sphere-voice rule. Not worth two duplicate faces.
- **Substitute the sphere-less second members** (`omen.hunger.wander`, `boost.core`) — they carry no
  sphere, so coverage drops to three and trigger #8 fires.

**Does it read as impoverished?** No — and this is the half of the question that matters, so here is
the reasoning rather than the verdict. The library model *is* face reuse: a player who plays ten
encounters sees `A Little More` in most of them, and that is the design intent, not a shortfall.
Seeing the same face at two steps of one encounter is only a problem if the two plays are the same
play. Here they are not: the Omen's step-0 instance carries the `emit_omen` grant and its step-1
instance deliberately does not; the Boost buys the eye at step 0 and the voice at step 1; all four
band fragments differ. One thing the draft did leave inconsistent, and I fixed it: A5's effect line
said *"You flood them with a body's reserve"* while B5 said *"You put a body's reserve behind the
voice"*. If it is the same card, its verb should be the same card's verb, with only the target
clause moving. A5 now reads *"You put a body's reserve behind them, so they keep looking past the
point where a person stops."*

**Escalated, not fixed:** if the batch wants zero repeated faces, the fix is upstream — row 2's type
budget needs a fifth sphere-signing type. That is a batch-design change and belongs in the batch
report, not in this draft.

### 5.2 The unchipped `spawn_clue` — **the author is right, and the judgment survives into the revised file**

Verified against the code rather than the claim. `findAnyRuinId`
(`src/engine/ruins/clueLifecycle.ts:555`) filters *every* location node in the graph for a
`ruinMagnitude` property and returns a uniformly random one, or `null` when the world holds none.
The ruin it names has no relationship to the broken structure in the prose and may not exist.

Against Law 56 clause 0b (`nudge-authoring-spec.md` § Consequences, rule 0b) and the anchor catalog:
the chip's referent would be a location node — a **legal** anchor kind, and `named` rather than
`linked`, which is lawful. But the rule's test is not "is the kind legal", it is "is the referent
resolvable in the live world the player is in, and does your sentence name *that particular
object*." Neither holds: the author cannot name the ruin at authoring time, and on a world with no
ruins there is no referent at all. That is failure shape 1 in the rule's own table — the referent is
effectively scene fiction — and the prescribed fix is **fold**: the words survive, the chip goes.
The rule's second option (bind the spawn to settings that carry the feature, and anchor the real
node) is unavailable, because the envelope is fixed at four classes by the batch design and the
clue's ruin is not the local one regardless.

This is the Unsafe Bridge defect recognised one step before it shipped, which is exactly what
THR-1141 asked authors to learn. **Ratified.** The revised file keeps § 9.5's reasoning, with one
correction: its claim about *where* the words live was false (§ 3), and is now true.

### 5.3 `success_at_cost` carrying no chip — **right conclusion, wrong reason; reason corrected**

The `byOutcome` floor is three bands — one success-side, one failure-side, one extreme. This packet
authors five, with both extremes and `success_at_cost`. **Floor cleared with room.** A variant must
carry an `overview`; `changes` may be empty. So a chipless band is legal.

The Law 13 half is right: a `reputation_tally` chip is a released defect — per-Reach tallies render
only in the debug designer tab and `check:encounter` fails on the kind — and the correct move is to
fold the sentence into the `overview`, which is prose and claims nothing. **Ratified.**

But the draft's stated reason is *"this band's cost is attention and reputation… and there is no
write behind either"*, and that is only true of the reputation fiction. **Two writes do fire on this
band.** Step 1's `successMetadata` runs on `isStepSuccess`, which is true for every success-side step
outcome including `success_at_cost` (and note a doubles roll can upgrade a `critical_failure` into
`success_at_cost`, `src/engine/unifiedActionResolution.ts` — still success-side, still firing
`successMetadata`). So Under Watch lands on the place and the relocation intent lands on the agent,
and the player sees an ending with zero chips.

I considered lifting the `success` band's relocation chip onto this band and decided against it: this
packet already reserves each write to the band where it is the point, and it already repeats a chip
across two bands where the same write fires (`Terrified` on `failure` and `critical_failure`, with
different cause clauses). Reserving is the better doctrine and the author applied it consistently.
What was wrong was the *sentence explaining it*, which will be read by the systems pass and by the
next author copying this packet as a model. The revised file states the precise reason.

---

## 6. Experience Differentiator Gate — 14 answers

Answered against the **revised** packet, which is the deliverable. Draft-state failures are recorded
in §§ 1–4 above rather than hidden here.

**Scene & Prose**

1. **Inside a moment already in motion?** **YES.** Every opening lands on people who have already
   been at it for hours — a shut gate with forty people shouting under it, two groups who have
   stopped speaking across a burnt barn.
2. **Prose has its own voice?** **YES.** Short declaratives against longer accumulating ones; the
   spine breaks into four beats of falling length; the bands run two sentences with the second
   turning.
3. **Scene prose names the elements that become choices?** **YES.** The remnant (A2, A4, A5), the
   argument behind them (A1), the crowd's faces and memory (B2, B3), its search for a hand behind
   the reading (B4), the voice trying to carry (B5), the pilgrim (cast + reaction). Delete the
   remnant and the crowd and every card in both hands is senseless here.
4. **Would a reader feel something from the prose alone?** **YES.** The camp that has not eaten; the
   pilgrim who has stood there since first light and says nothing; everyone who tried to look
   steadily looking away first.
4b. **No seam echoes?** **YES, as revised.** Three echoes found and fixed (§ 2); five seams named and
   checked individually, plus the initiation boundary and the band seams.

**Choices & Intervention**

5. **Every card face library-generic, zero scene-bespoke prose?** **YES.** All nine `name`/`fiction`
   pairs are `CARD_CONTENT`'s authored faces **verbatim** — I diffed them against
   `src/data/nudge-card-library.ts` line by line. Effect lines name the scene's target directly,
   which is the sanctioned transitional practice (spec § the communication pivot: *"the exemplar's
   Balm names the condition it lifts"*), and the exemplar does the same thing on every card.
6. **Every effect line states mechanism, and every price real?** **YES.** No digit and no `%`
   anywhere in eleven effect lines — checked character by character. Prices are essence on ten, plus
   a detection channel on the two Veils, and cost 0 on the trait card because the price was paid by
   being Humble. No zero-essence non-trait card.
7. **Every card pays off in failure?** **YES.** Eleven cards, eleven-plus failure-texture fragments,
   verified per card. No card reaches `NUDGE_BIG_DELTA` (0.15) — the maximum is +0.10 — so none owes
   both failure bands.
8. **Every card grounded?** **YES.** § 3 above.
9. **Do the cards answer different questions?** **YES.** Hand A: attention, light, recognition,
   concealment, endurance. Hand B: the disaster floor, the room's temper, the room's memory, leaving
   no trace, carrying the voice, being who they are.
9b. **Full authored hand on every nudge-bearing step, and no step picks a branch or an ending?**
   **YES.** Five and six cards. No `authoredChoices`, no fork. Every card acts on the fabric of the
   scene or on the mortal's inner weather; none instructs the mortal.

**Aftermath & Consequence**

10. **Reflective prose landing?** **YES.** Five band overviews plus the fallback.
11. **Actor-centered with names and faces?** **YES.** The chips name the acting agent, the place, and
    the condition; the worst ending names the pilgrim.
12. **Reaction choices?** **YES.** Three, each carrying a real write.
13. **Philosophical stances?** **YES.** Attend to the one who stayed / attend to the mortal you spent
    / let the country carry it. Three different answers to "what does a god owe after a true thing
    was said", not three sizes of one effect.

**Presentation**

14. **Two-question art method, evocative not illustrative?** **YES.** Two cold heaps of offerings and
    a strip of stone walked bare between them — residue, not the event. Deliberately not painting the
    sign is the right call twice over: it withholds the gate's answer and it stops the plate being an
    illustration of prose that already exists.

---

## 7. The 31 automatic REVISE triggers — run individually

Fired: **#18, #22, #26, #29**, all fixed inline. Plus the spec's plainness-move 1, which is a
revise-before-systems rule rather than a numbered trigger.

| # | Trigger | Verdict |
|---|---|---|
| 1 | No approach prose | **Clear** — nudge-native; both steps carry full authored hands. |
| 2 | Generic god-verbs | **Clear.** No "help them" / "tip the scales". Every line names a mechanism. |
| 3 | No thread integration | **Clear.** The god's hand is discoverable in the outcome prose (22 band fragments), not only in a menu. |
| 4 | Missing aftermath reactions | **Clear.** Three, each with a write. |
| 5 | Reporter prose | **Clear as revised.** The initiation was the one briefing-shaped surface; rewritten (§ 1e). |
| 6 | Missing/illustrative art direction | **Clear.** Present and evocative. |
| 7 | Hand outside 4–8 | **Clear.** 5 and 6. |
| 8 | <4 spheres, or no ungated common | **Clear.** 4 spheres per hand; A1 and B1 are ungated commons. |
| 9 | Card with no failure fragment / big-delta missing a band | **Clear.** All eleven carry one; nothing reaches 0.15. |
| 10 | An uncovered `StepOutcome` | **Clear.** Both hands cover all six; re-derived independently. |
| 11 | Digit or `%` in an effect line | **Clear.** |
| 12 | Trait hook skipped / dead ref | **Clear.** `trait.core.core_humility.virtue` is the virtue pole of the live `core_humility` continuum (`coreRegistry.ts:151`, display word "Humble"); id form is the full node id. |
| 13 | Nudge payoff in base band text | **Clear.** Every band reads with any subset of the hand. The § 3 addition is base scene fact, not a nudge payoff. |
| 14 | An option that instructs the mortal | **Clear.** Dreams, light, recognition, concealment, stamina, mercy, character. No authored futures. |
| 15 | Detector hit | **Clear, but the draft's count was wrong.** See § 8. |
| 16 | Scene-bespoke prose on a card face | **Clear.** Faces verbatim from `CARD_CONTENT`. |
| 17 | Mood instead of mechanism | **Clear.** |
| 18 | Class with no opening, or spine/afterimage naming class scenery | **FIRED.** "The stone" unestablished at wayside and stronghold; "the wall" and "the last fire" in two overviews. Fixed (§ 4). |
| 19 | Two riders in a hand | **Clear.** Hand A none; hand B one, justified. |
| 20 | Zero-essence non-trait card / dead grant | **Clear.** Grants name `emit_omen`, `condition_attachment`, `remove_condition` — all live vocabulary with live ids. |
| 21 | Duplicate family type composition | **Clear.** Row 2's budget is distinct from the other five. |
| 22 | Seam echo | **FIRED** ×3. Fixed (§ 2). |
| 23 | Static authored factor line | **Clear.** None authored. `carryoverFactorLines` are outcome-keyed and the trait line renders only for the holder — variant by construction, both of them. |
| 24 | Agent as bystander | **Clear.** Both tests are theirs. |
| 25 | Announced outcome mechanics | **Clear.** No pass-and-X framing anywhere. |
| 26 | Design-block breach | **FIRED.** The declared `intel` prize had no authored payoff. Fixed (§ 3). |
| 27 | Title fails the glance test | **Clear, at the low pass.** See § 9. |
| 28 | Missing or verbose crux | **Clear**, tightened. The draft's crux is one sentence but has no agent in it; revised to *"A sign is hanging over the ruin on the agent's road, and everyone standing under it has already decided what it means except them."* |
| 29 | Unreadable compression | **FIRED** once. Fixed (§ 1c). |
| 30 | Shape invented on the fly | **Clear.** `Puzzle–Investigation–Resolution`, from the catalog, matching the row, and — after § 3 — actually honoured. |
| 31 | Invented game state in base prose | **Clear.** Every fact is scene-local, a named state read, or a named state write. The classification table is real and correct. The pilgrim's fragment appearing only at the ending this encounter mints is exactly right. |

---

## 8. Detectors — re-run by hand, and one correction

- **Vagueness, `outcome` class** (band bases, all ten afterimages, all 22 fragments, five overviews,
  `narrativeTemplates.success`/`.failure`): swept for `someone · somewhere · things · stuff · thing ·
  way · ways · nothing · anything · whatever` **and** the evasive list. **Zero.** The draft's claim
  holds. Two of my own rewrites had to be re-worded to keep it (an early draft of the A5 fix used
  "nothing").
- **Vagueness, `scene`/`interactive` classes**: `nothing` and `way` appear in card `fiction` and in
  the spine as ordinary English, which is correct in those classes post-THR-899.
- **Annotation clauses — the draft claims zero; the true count is one.** `B4`'s effect line reads
  *"You leave **less behind than a** careful hand would…"*, which matches
  `NOT_X_BUT_Y_PATTERNS[3]` — `/\bless\s+[a-z]+\s+than\s+[a-z]+/i`
  (`src/data/content-eval/nudgeAuditDetectors.ts:243`). That is exactly at
  `ANNOTATION_MAX_PER_ENCOUNTER`, so the gate would have passed — and the packet would have shipped
  saying it had headroom it did not have, which is how the next edit breaks a green gate. (The card's
  *quote* — "A practiced hand leaves less than a careful one" — does **not** match: the pattern needs
  a word between `less` and `than`.) The rewritten line retires the construction and the true count
  is now zero.
- **Divine outcome-authorship**: zero. No decision verb takes a result clause. The god steadies,
  shows, floods, draws the dark in, takes the floor out. *"the ground decided the reading was the
  reason"* is a crowd deciding, and carries no wh-clause, so it does not match
  `DIVINE_DECISION_PATTERNS` either way.
- **Abstraction-as-subject** (hand check): one hit — *"The recognition steadied their eyes…"*. Fixed
  to *"It steadied their eyes…"*.
- **Word budgets**: openings 57–59 after the rewrites (60), spine 66 — over by six, which the budget
  treats as a warn signal rather than an error, and the sentence carrying the overage is the pilgrim,
  who is the cast binding and cannot move anywhere cheaper. Fragments all under 25; factor lines all
  under 12; names 2–4 words.

---

## 9. Smaller findings, all fixed inline

**(a) Mixed step numbering — the one thing likeliest to be mis-implemented.** § 1.2 and § 1.4–1.7
number the steps 1 and 2; § 3, § 4, § 5 and § 9 number them 0 and 1. So *"step 1 `successMetadata`"*
means the Veil step in § 1.4 and the Eye step in § 9.4 — in the same packet, about the same field.
Pass 3 and Pass 4 read only this file. Normalised to **0-indexed everywhere**, matching
`steps[0]`/`steps[1]`.

**(b) The `under_watch` chip's category justification asserts readers that do not exist.** The draft
says Under Watch *"is read by the shadow tax and by location gating"*. Checked: `under_watch` is
**deliberately excluded** from `LOCATION_CONDITION_MOVEMENT_TAX` — the code comment says so in
terms (*"being observed changes what you can do in a place, not how long it takes to walk in. Its
reader is the gate."*) — and a corpus-wide grep finds **no** template gating on it. Nothing reads it
today.

This does **not** invalidate the chip: Law 56 rule 0 asks whether a write fired, and a real condition
node lands on the location with a duration edge and `visibility: 'discoverable'`. It does invalidate
the sentence. The `path` category still holds on the "state moved and the simulation carries it"
reading, and the chip's `detail` says only what the condition's own description says, which is the
honest bound. Rewritten, with the gap recorded as a note upward rather than papered over — this is
the batch's location-anchor row, so the anchor stays.

**(c) Hand-B gating was under-counted, and the hands were unbalanced.** The draft says *"Two cards
are gated (B6 on the trait, B4 on darkness attunement)"*. In fact **B2 is also gated**:
`card.whisper.attunement.light` unlocks at **60** lifetime essence through light
(`nudge-card-library.ts:508`) — the library's second attunement mark and its highest bar. So hand B
had three gated cards while hand A had **none**, and for a god without light attunement, darkness
attunement, or a Humble agent, hand B dealt **three** cards in two spheres, below the 4–6 dealt-size
doctrine.

Fixed inside the row's own budget by swapping the two Veil members between the hands: hand A now
deals `card.veil.attunement.darkness` (*Nothing To Find*, threshold 20, 3 essence, +0.06,
`detectionDelta −0.2`) and hand B deals `card.veil.signature.darkness` (*No One Saw*, starting,
2 essence, +0.05, `detectionDelta −0.12`). The deeper member keeps the steeper price, the number of
repeated faces is unchanged at two, both hands keep four authored spheres, and the **ungated floor
is now four in both hands**. Recomputed arithmetic: hand A totals +0.35 (step 0: 0.40 + 0.35 = 0.75),
hand B totals +0.39 (step 1: 0.42 + 0.39 + 0.05 carryover + 0.03 variant = 0.89). Both inside [0, 1]
and both far under `NUDGE_HAND_MAX_TOTAL_DELTA` (0.70).

I did **not** move the whisper members, because the only way to put the 60-threshold card in hand A
is to give hand B `card.whisper.signature.light` — which is A2's face, and would take the packet from
two repeated faces to three. That the hand's biggest card is a late-run unlock is now recorded for
the systems pass rather than silently traded away.

**(d) Title glance test — passes on the objective, not on the complication.** *The Sign Over the
Ruin* tells a player there is a sign and where it is; it does not tell them the readings have
hardened into sides. The catalog rule accepts either the complication **or** the objective, and the
objective here is `reveal` — the title names the thing to be read. It is also **fixed by the batch
design**, so it is not a draft's to change. Recorded, not actioned.

---

## 10. Branch count, scale, dilemma energy, inspiration honesty

- **Branch count.** Zero branches. **KEEP 0.** The row assigns fate-branching's content debut to
  #4 (`standing_the_line`); a second fork here would duplicate it, and the draft's stated reason —
  that the encounter's grimness *is* that a true reading has no side to be on — is the better
  argument of the two. A fork asking "which side do you please" would flatten exactly what makes this
  encounter what it is.
- **Scale discipline.** Two steps, two hands, five aftermath bands, three reactions. Matches the
  row's `2 (veil → eye)` and the medium band.
- **Dilemma energy.** The tension is real and it is in the right place: reading it is the easy half,
  saying it to people who have already voted is the half that costs. The player's dilemma across the
  two hands is genuinely different in kind — buy clarity, then buy audibility — and the Veil cards
  put a second question underneath both (*do I want my hand on this at all?*), which is the most
  interesting thing in the packet and the reason the `veil` debut lands rather than just ticking a
  box.
- **Inspiration anchor honesty.** `hook.celestial_sign` — *"Something impossible happened in front of
  witnesses, and the interpretations are already hardening into factions."* The take is faithful and
  the addition (nobody has actually read it) is what earns the Puzzle shape. The hook did real work.
- **Aftermath payoff.** Lands, and is actor-centered. The `critical_failure` ending is the strongest
  writing in the packet.

---

## 11. Revision Summary

**Must fix — done inline**

1. Deliver the Investigation prize in prose (§ 3) — step 0's `critical_success` and `success`
   afterimages now carry what the reading turned up.
2. Establish "the stone" at the wayside and stronghold classes; retire "the wall" and "the last
   fire" from the two overviews (§ 4).
3. Three seam echoes: ruin→spine ("since first light"), wayside→spine ("light"),
   stronghold→spine ("two answers"), plus initiation→spine (§ 2).
4. Four verbless opening fragments → subject-first sentences (§ 1a).
5. Split the `success_at_cost` overview's two-reading sentence (§ 1c).
6. Correct the `under_watch` category justification; it names readers that do not exist (§ 9b).
7. Correct the `success_at_cost` no-chip rationale; two writes do fire on that band (§ 5.3).
8. Correct § 9.5's claim about where the clue's words live (now true).
9. Normalise step numbering to 0-indexed throughout (§ 9a).
10. Retire the one annotation clause in B4's effect line, and correct the self-audit's "zero" (§ 8).

**Should fix — done inline**

11. Rebalance the Veil members across the hands; hand B's ungated floor was three (§ 9c).
12. Three aphoristic inversions and one cleft (§ 1b).
13. The exemplar line borrowed verbatim in A2's failure fragment (§ 1d).
14. Harmonise A5/B5's effect-line verb so the repeated Boost reads as one card (§ 5.1).
15. Rewrite the initiation, which was the packet's one reporter-prose surface (§ 1e).
16. Tighten the crux to put the agent in it (§ 7, trigger 28).

**Consider — recorded for the systems pass and the batch report, not actioned here**

17. `SCENE_SENTINEL_FIELDS` binds `targetLocationId: '$target'` **only when the action's target is a
    location node**. If an ambient `encounter.border.*` draw targets the agent, the `under_watch`
    write never fires and the `critical_success` chip claims state nothing wrote — a Law 56 breach in
    the field on the batch's own location-anchor row. Confirm before implementation.
18. `stateNoun.entityId` carries `$target` / `$actor` sentinels here. Confirm the aftermath resolves
    sentinels in that field and not only in `detail` / `causeClause`.
19. Nothing in the shipped corpus reads `trait.condition.location.under_watch`. Worth a note to the
    portfolio: the condition exists, is well-authored, and has no consumer.
20. Row 2's six-type budget admits exactly four spheres, which forces two repeated faces in any
    conforming pair of hands. If the batch wants zero repeats, the budget needs a fifth
    sphere-signing type — a batch-design change.
21. `card.whisper.attunement.light` unlocks at 60 lifetime essence through light. Hand B's largest
    card is a late-run unlock by construction; intended or not, it should be a decision rather than a
    side effect.

---

PASS WITH REVISIONS
