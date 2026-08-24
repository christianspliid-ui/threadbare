# Encounter Pipeline: The Garrison's Price
> Scale: medium | Slug: the-garrisons-price | Pass: editorial
> Date: 2026-08-24 | Pipeline version: 3.0 (Encounter Factory)
> templateId: `encounter.border.the_garrisons_price` | Batch: border-perils (THR-1221), row 6

**Read for this review:**
[draft](the-garrisons-price-draft.md) ·
[nudge-authoring-spec.md](../../../.claude/skills/encounter-pipeline/reference/nudge-authoring-spec.md) ·
[SKILL.md § Automatic REVISE triggers](../../../.claude/skills/encounter-pipeline/SKILL.md) ·
[encounters canon](../../canon/encounters.md) · [prose canon](../../canon/prose.md) ·
[border-perils-brief.md](border-perils-brief.md) ·
[border-perils-batch-design.md](border-perils-batch-design.md) ·
[swollen-ford-exemplar.ts](../../../src/data/__fixtures__/nudge-exemplar/swollen-ford-exemplar.ts)

Every source claim below was checked against the code, not against the draft's word for it.
Where I confirmed the draft, I say so; where I did not, I quote the line that decides it.

---

## 0. Headline

This is a strong packet with a real scene, an honest antagonist, a well-cut hand, and an
opt-in gate that is genuinely opt-in. It also carries **one defect that would have shipped
the exact pathology this batch was convened to correct** — a chip claiming state the engine
never wrote, on a reachable path, past a gate that cannot see it. That defect is one level
deeper than the `thread` blocker the draft correctly found, and the draft did not find it
because it lives in the interaction between `failBehavior: 'fail_action'` on step 1 and
`failureMetadata.effects` authored only on step 2.

All findings are fixed inline. The verdict is at the tail.

---

## 1. Prose Quality

### What works, and should not be touched

The four openings are the strongest thing here. Each is sketchable in one read, each carries
two senses beyond sight, and none of them explains anything:

> A pole lies across the track on two crutches, and a rope runs from it to a tent peg so it
> can be lifted from a seat. Six tents stand back from the road in a line, and a picket line
> of horses behind them. Nobody is hurrying. The barrier is enough, and everybody here knows it.

*"Nobody is hurrying. The barrier is enough"* does in nine words what a paragraph of menace
would do worse. And the lapsed contract — the thing the whole encounter rests on — never
arrives as backstory. It arrives as **a company banner hung over the arch where somebody
else's arms used to be, wet through and left up anyway**. That is the density rule (plainness
move 4) obeyed: one prop, doing the work of an explanation.

The step-2 spine is the second-best passage: *"Saying the price was quick. Paying it is
not."* Two short sentences, the whole second beat.

### `[EDITORIAL REWRITE]` — the honest-antagonist breach

The rolled hook binds one word: **honest**. The company reads the same page to everybody.
Two lines break it, and both break it in the same way — by telling the player the company
was performing rather than dealing.

**Step 1 `criticalFailureAfterimage`, as drafted:**
> "The haggling ran long, and the company stopped pretending it was a negotiation."

*"stopped pretending"* retroactively makes the whole scene a front. It says the book was
theatre and the price was always going to be the price — which is a shakedown, and the
opposite of what §0d, §3 and §4 of the design block spend four paragraphs establishing. It
is also the single line a player is most likely to read as the encounter's true opinion of
the company, because it lands at the worst band.

> **[EDITORIAL REWRITE]** "The haggling ran long, and the quartermaster turned the book
> around so they could read the line themselves."

Same band, same finality, no villainy: the company's answer to being argued with is to show
you the page. That is what an honest antagonist does at a critical failure, and it is
*worse* for the traveler than a sneer, because there is nothing to argue with.

**Step 2 Heavy Hand `critical_failure`, as drafted:**
> "They worked like three people in front of a company that counts, and the company found
> more work."

*"found more work"* means invented it. The company is a body feeding itself off a road by
arithmetic, not by padding a tally.

> **[EDITORIAL REWRITE]** "They worked like three people in front of a company that counts,
> and the tally was written for a full day either way."

The cost is identical; the cause moves from malice to the book.

**Step 2 Favor (call) `critical_failure`**, drafted as *"the company counted both of them as
owing now"*, reads punitive for the same reason. Rewritten so the book, not a grudge, does it:

> **[EDITORIAL REWRITE]** "The debt was called and answered, and the book has a line for
> every pair of hands that comes through the gate."

**One further honesty note, and it is a rewrite rather than a breach.** The
`fallback.overview` states the company's honesty instead of showing it:

> "The book is the company's whole argument and it is not a dishonest one."

Rule zero prefers the shown thing, and an aftermath overview is the one place with room for
it. Also *"it is not a dishonest one"* is the writer stepping in to gloss their own image —
the annotation habit, even where the regex does not fire.

> **[EDITORIAL REWRITE]** "The book is the company's whole argument. Every traveler this
> week was read the same page, and the road on the far side is still the road."

### `[EDITORIAL REWRITE]` — plainness move 1, the fragment opener

The `critical_success` band overview opens on a fragment:

> "The smallest price on the page, and the barrier up before the light went."

Move 1 is *subject first, never open on a fragment*. Rewritten with the subject in front:

> **[EDITORIAL REWRITE]** "They got the smallest price on the page, and the barrier went up
> before the light did. The quartermaster wrote the line, struck it, and turned the book
> around so it could be read."

### `[EDITORIAL REWRITE]` — the internal contradiction (checklist B8)

Step 2's `failureAfterimage` says the traveler got through. Every other surface on that band
says they did not.

| Surface | Drafted text |
|---|---|
| step 2 `failureAfterimage` | "**The barrier lifted.** The mark in the ledger did not close." |
| `narrativeTemplates.failure` | "**The barrier stayed down.** It is three days east…" |
| `byOutcome.failure` overview | "**The barrier stayed down** and the afternoon went on the company's wall…" |
| §14 ladder, `failure` row | "**Not through.** Three days east by the low track." |

These render together. The afterimage is the outlier and it is the one that is wrong — the
whole failure design is "not through".

> **[EDITORIAL REWRITE]** "The tally ran past what they had left in them, and the barrier
> did not move."

### Register and voice

Baseline throughout, no peak surface declared, and none needed — correct for a scene whose
whole point is two people being reasonable at a table. Card `name`s, `effectLine`s, purpose
lines and carryover lines are all interactive-plain. **Tone: not grim**, as the batch row
requires. Nobody dies, nobody is unmade, and both parties are right.

Two habits I watched for and did not find: no abstraction-as-subject pattern (one or two
abstract subjects across ~40 sentences, well under a tic), and no stacked metaphor anywhere.

---

## 2. Branch Seduction Audit

**N/A by construction, and correctly so.** Branch depth is linear, branch count 0. The
encounter's one decision is the engage/decline gate, which is resolved *outside* the template
by the mortal's own encounter selection. No `authoredChoices`, no `ActionStepBranch`, no
`poleLean`, no `decidedBy`. I confirmed there is no branch structure anywhere in the packet.

**The opt-in gate audited in its place** — see §7 below, which is the one that matters here.

---

## 3. Branch Count Assessment

**KEEP 0.** Linear is the shape the catalog's `Opt-in Complication` row asks for (*"gate +
shape"*), and the shape it gates into is `Test & Consequence` — two steps with carryover.
That is exactly what is built. Adding a branch would put a second decision inside a scene
whose single decision is *whether to be in the scene at all*, and would blur the one clean
thing this encounter does.

---

## 4. Scale Discipline Check

**Medium, and the size matches.** Two beats (medium = 2–3), one named cast member, one
faction surface, one condition, one agreement, eleven authored cards. The draft's own scale
justification is the correct argument and I endorse it verbatim: a third step would be a
second payment beat saying the same thing twice, and a single step would collapse *naming
the price* into *paying it* — which is the seam the crux lives on.

Word budgets: openings 56–60 (budget 60, warn level); band fragments all under 25; the two
spines 55 and 52. Nothing over.

---

## 5. Inspiration Anchor Honesty

`plotHookRolled: hook.impossible_bargain, hook.prophetic_investigation, hook.scarcity_crisis`
· `plotHookTaken: hook.impossible_bargain`. Both recorded ✓, and the `usedBy` stamp is
correctly listed as a closeout action rather than claimed as done.

**The hook did change the encounter, and this is the rare case where I can point at the
mechanism.** The hook's binding clause is *"the terms being offered are honest."* Take that
clause away and this scene is a bandit toll, the hand becomes intimidation and evasion, and
the whole `gold` step evaporates — there is nothing to negotiate with someone who is
extorting you. The honesty is what makes step 1 a *negotiation* and therefore a `gold` test.
The hook is load-bearing, not decoration.

The batch's third hook slot (`scarcity_crisis`) also leaves a trace: the company is short of
pay, salt and boots, which is what the Side-bet's `intelligence` grant records. That is a
rolled-but-not-taken hook doing honest secondary work.

---

## 6. Aftermath Payoff — **and the packet's most serious defect**

### 6a. The Law 56 hole on the step-1 failure path

**This is the finding.** Verified in `src/engine/unifiedActionLifecycle.ts:177–190`:

```ts
// Hard failure with fail_action → entire action fails
// critical_failure always triggers fail_action regardless of template setting
if (isStepFailure(outcome) && (
  currentStepDef.failBehavior === 'fail_action' || outcome === 'critical_failure'
)) {
  const actionOutcome: UnifiedActionOutcome = outcome === 'critical_failure' ? 'critical_failure' : 'failure';
```

Step 1 declares `failBehavior: 'fail_action'`. So a step-1 `failure` resolves the **action**
as `failure`, and a step-1 `critical_failure` resolves it as `critical_failure` — and in
both cases **step 2 never runs.**

The draft authored every failure-side write on step 2 only:

```ts
// Step 2 failureMetadata.effects — the ONLY failure writes in the drafted packet
[ { kind: 'condition_attachment', templateId: 'trait.condition.exhausted' },
  { kind: 'reputation_with', targetFactionId: 'mercenary_company', delta: -0.06 },
  { kind: 'bond_change', withAgentId: '$cast:officer', sentimentDelta: -0.15 } ]
```

So on a step-1 failure the player sees `byOutcome.failure` render `gp.a_day_on_the_wall`
("The day's labour left an exhaustion that will not walk off by morning") and
`gp.company_standing_lost` ("The company has them down as a haggler") — **while the engine
wrote nothing at all.** No condition, no standing move, no bond move. The traveler is not
exhausted; they never worked. The company's book has no line; they never dealt.

Two things make this worse than an ordinary miss:

1. **The fiction is false too, not only the state.** The `failure` overview says *"the
   afternoon went on the company's wall instead"*. On the step-1 path there was no wall.
2. **`check:encounter` passes it.** `chipBackingViolations` asks whether the band has a
   backing effect *declared*; it cannot know that `fail_action` on step 1 makes step 2's
   metadata unreachable. Green gate, dead write, chip on screen — the precise shape of the
   `thread` pathology the batch's binding decision is about, one level further in.

**And §1's own argument depends on a write that does not exist.** The draft's "one honest
asymmetry" paragraph says a failed haggle *"loses a little standing with the company"*.
Nothing in the drafted packet writes that. It is prose describing a mechanic.

**Fix applied (three parts).**

- **Author step 1 `failureMetadata.effects`** with the standing shave §1 promises, so the
  asymmetry becomes real and the two standing chips are backed on *both* failure paths.
- **Fold `gp.a_day_on_the_wall`.** The exhaustion *write* stays on step 2, where the player
  watched the cause. Its **chip** cannot live on `failure` or `critical_failure`, because
  both bands are reachable without step 2 ever running. Per THR-1082 an unchipped real write
  is demoted to the engine's own icon-and-delta cluster automatically, which is the
  sanctioned behaviour, not a loss. The fold rule's caveat is honoured: I did **not** move
  the words into the overview, because on the step-1 path they are false — I rewrote both
  failure overviews to be true whichever step broke.
- **A standing rule for this packet, stricter than Law 56 asks:** every authored chip is
  backed by a **step-metadata** effect, never by a reaction. A reaction-backed chip is a
  coin-flip claim — the band renders the chip, the player then picks the other reaction, and
  the write never fires. The draft's `gp.the_thread_pulled` used exactly that pattern; it is
  gone with the swap, and nothing replaces it.

I considered and rejected changing step 1 to `continue_weakened`, which would make every
failure path run step 2 and close the hole mechanically. It would also close the exit: a
failed haggle would drag the mortal into paying anyway, and §1's clean claim — *"a failed
negotiation ends the encounter on the low track, the same road declining takes"* — is the
best line in the design block. **The design was right; the wiring was wrong.**

### 6b. Two more reaction defects, both fixed

- **`gp.walk_it_off` was a possible no-op.** `remove_condition` on `trait.condition.exhausted`
  lifts a condition that, on the step-1 critical-failure path, was never applied. A reaction
  whose only effect is a no-op is a dead option. It now carries a `bond_change` alongside,
  so it always writes; the `remove_condition` is the bonus when there is something to lift.
- **R1 granted a debt on a success band.** `gp.keep_the_line` granted `agreement.debt.minor`
  on the fallback pair, which renders on `critical_success` — the band where the line was
  struck through and nothing is owed. Reframed to `agreement.favour.earned` (live in
  `AGREEMENT_REWARD_TEMPLATES`, verified): the god leaves the two of them owing each other a
  courtesy rather than an account. `agreement.debt.minor` stays where the fiction wants it —
  the failure-band override, which is a real open line in a real book.

### 6c. What lands, and lands well

Actor-centred with names and faces: the quartermaster is a bound cast actor with a portrait
and a click (`{cast:officer}`), the company is `$faction:mercenary_company`, the traveler's
own body carries the condition. No anonymous stat delta is authored anywhere. The reflective
landing is real prose that claims no state.

**Five `byOutcome` bands against a floor of three** — see §11.

---

## 7. Dilemma Energy — the opt-in gate, audited hard

This is the graded mechanic and it is the reason to keep the encounter.

### Is the gate agent-decided?

**Yes, and there is nothing in the template that could make it otherwise.** Declining is not
a branch, an `authoredChoices` entry, or a card — it is the mortal not selecting the
encounter through the ordinary scoring pipeline. §1 states this correctly and the packet
contains no mechanism that contradicts it. The player never decides whether to approach.

### Does any card lobby the gate?

**No. Checked card by card, all eleven.**

| Card | What it acts on | Lobbies the gate? |
|---|---|---|
| Boost (s1) | the mortal's nerve *while the figure is read out* | no — after engaging |
| Favor (s1) | the officer's sense of obligation | no |
| Bargain (s1) | the world's doom clock | no |
| Gambit (s1) | the shape of the terms | no |
| Heavy Hand (s1) | the company's arithmetic | no |
| Side-bet (s1) | what the traveler notices at the table | no |
| Boost (s2) | attention during the count | no |
| Heavy Hand (s2) | strength in the work | no |
| Bargain (s2) | the doom clock | no |
| Favor-call (s2) | a debtor turning up to help | no |
| Boost energy (s2) | the body's last hour | no |

Every card acts at the table or on the paying. None argues *approach* or *walk away*. There
is no Undertow, no Compulsion, no Kindled Ambition in either hand — the three card types
that could have leaned the gate — and the batch's card budget for row 6 does not allocate
them. Clean.

### Is the exit strictly cheaper than the worst engagement?

**Yes, and after the §6a fix it is provably so rather than rhetorically so.**

| Path | What the engine writes |
|---|---|
| **Decline** | nothing. No condition, no standing, no agreement, no favor, no mark. Cost is a movement delay. |
| Fail step 1 (`failure`) | standing −0.06 with the company, bond −0.15 with the officer, a planted compulsion — **plus** the same low track |
| Fail step 1 (`critical_failure`) | same writes, plus a full extra day held in the fiction |
| Fail step 2 (`failure`) | all of the above **plus** `trait.condition.exhausted` |
| Fail step 2 (`critical_failure`) | the worst of all of it |

Declining is a strict subset of every engagement outcome — it is the empty set. The exit is
therefore strictly cheaper than the worst engagement by construction, not by arithmetic.

**One thing the draft got backwards, worth recording.** In the drafted packet the step-1
failure path wrote *nothing*, which made failing the haggle exactly as cheap as declining
and made §1's stated asymmetry pure fiction. The fix makes the exit *relatively* cheaper,
not less cheap: engaging now carries a real bounded risk, which is what an opt-in is
supposed to have. The exit itself is unchanged and still free.

### Is the exit legible before the player spends anything?

**Yes.** The `initiation` — read by every setting class — states the alternative in plain
figures: *"three days east by the low track."* A player can price the exit without doing
arithmetic and without discovering it after the fact.

I checked this against REVISE trigger 25 (announced outcome mechanics in scene prose) and
ruled it clear, but tightened one clause. *"Turn back, and it is three days east by the low
track"* is the **gate's price**, which the shape catalog explicitly requires be legible — it
is not a resolution band. But *"Pay one and the road stays a road"* was drifting toward
pass/fail rules text, so it is rewritten to put the same fact in the scene's furniture. See
the revised `initiation`.

**Verdict on the gate: it is a genuine opt-in, not a toll.**

---

## 8. Experience Differentiator Gate — 14 answers, independently

**Scene & Prose**

1. **Opening places the player inside a moment already in motion?** **YES.** The barrier is
   already down, the tents are already up, the picket is already eating, the banner has
   already been left up in the rain. No one explains anything.
2. **Prose has its own voice — cadence, rhythm, sentence variety?** **YES.** Short-long-short
   across each opening; four different closers (an object placed, smoke, a flat statement,
   light).
3. **Scene prose names elements that become player choices?** **YES.** Barrier, plank table,
   ledger, quartermaster, picket, low track — all in the opening or the spine before any
   card, factor or band touches them. Delete the ledger and nine of eleven cards are
   senseless.
4. **Reader feels something from prose alone?** **YES.** The banner over somebody else's
   arms does it in one image.
   **4b. No seam echoes?** **NO — four found.** This is the one gate question the draft fails
   on its own text, and it is the class the automated detectors structurally cannot see. See
   §9. All four fixed.
5. **Every card face library-generic, zero scene-bespoke prose?** **YES**, and verified
   against source rather than the draft's claim — see §10.
6. **Every effect line states mechanism, every price real?** **YES** — see §10.
7. **Every card pays off in failure?** **YES** — see §12.
8. **Every card grounded in the scene?** **YES.**
9. **Cards answer different questions?** **YES** — the six step-1 questions are genuinely
   distinct, and the two step-2 Boosts buy attention and body respectively.
   **9b. Full authored hand per nudge-bearing step, no step asks the player to pick a branch
   or an ending?** **YES.** 6 and 5 cards; no `authoredChoices` anywhere.

**Aftermath & Consequence**

10. **Reflective prose landing?** **YES**, after the `fallback.overview` rewrite.
11. **Actor-centred with names and faces?** **YES.**
12. **Medium+: reaction choices?** **YES.** Two on the fallback, two on `failure`, two on
    `critical_failure`.
13. **Reaction choices are philosophical stances?** **YES**, and the axis is consistent
    across all three pairs: *leave a tie live between two people* against *settle it in
    public and be free of it*. Warm-and-unresolved against clean-and-cold. Read downward on
    the failure bands it becomes *carry the mark* against *spend the company's name to be rid
    of it*, which is the same axis honestly inverted.

**Presentation**

14. **Concept art two-question method, residue not illustration?** **YES**, and it is the
    best art direction I have read out of this line. An empty plank table, a half-struck
    ledger weighted with a stone, and **one good worn boot, plainly somebody's only pair,
    set down where the payer left it.** No people, no argument, no gate in focus. The boot
    says the thing the prose is under orders never to say out loud — that the prices are
    honest and are still paid out of your own body. Untouched.

---

## 9. Seam echoes — four found, all fixed (REVISE trigger 22)

Checked every opening→spine seam, the spine→band seams on both steps, and the step→step seam.

**1 · stronghold opening → spine: "plank table".**
> opening closes: "Inside the arch, **a plank table** has been set across the passage."
> spine opens: "The road stops at a barrier the company put across it. Their quartermaster
> keeps a ledger on **a plank table**…"

The draft's own seam check verified that no opening uses *ledger*, *quartermaster* or
*price* — and then missed the prop it does share. Fixed by moving the stronghold opening's
closer off the table entirely.

**2 · wayside opening → spine: "barrier".**
> opening closes: "**The barrier** is enough, and everybody here knows it."
> spine opens: "The road stops at **a barrier** the company put across it."

Last image of the paragraph, first image of the next. Fixed by closing the wayside opening
on the rope and the seat instead — which is a better closer anyway, because a barrier you
raise from a chair is the whole character of that post.

**3 · the `critical_success` cluster: "the smallest price on the page", ×4.**

| Surface | Drafted |
|---|---|
| step-1 `criticalSuccessAfterimage` | "The quartermaster read them **the smallest price on the page**…" |
| Gambit `critical_success` fragment | "…went straight to the bottom of the page and read **the smallest line on it**." |
| Heavy Hand `critical_success` fragment | (distinct ✓) |
| `byOutcome.critical_success` overview | "**The smallest price on the page**, and the barrier up…" |
| `carryoverFactorLines.critical_success` | "They owe **the cheapest line in the book**." |

The afterimage and the fragment render **in the same block**, one after the other, saying the
same sentence twice. Fixed by giving each surface its own image: the afterimage keeps the
page, the Gambit fragment moves to the *silence before* the reading, the overview moves to
the light and the turned book, the carryover keeps the cheapest line.

**4 · step 2 `criticalSuccessAfterimage` → Heavy Hand fragment: "let them go early", verbatim.**
> afterimage: "…the quartermaster struck the line through, and the company **let them go early**."
> fragment: "The work went down so fast the company came out to look, and **let them go early**."

Same three words, rendered consecutively. Fixed on the fragment side.

**Seams checked and clean:** ruin→spine, battlefield→spine, spine→band on step 1 (after fix
3), step 1→step 2 (step 1's afterimages all close on the book; step 2's spine opens on the
paying, which is a genuine handoff, not a restatement).

---

## 10. The communication pivot — verified against source

**Nine card instances take `name` and `fiction` verbatim from `CARD_CONTENT`
(`src/data/nudge-card-library.ts`). I checked all six distinct ids, character by character.**

| `libraryCardId` | `title` in source | `quote` in source | Draft matches |
|---|---|---|---|
| `card.boost.core` | A Little More | Most things fail by a margin. | ✓ |
| `card.favor.signature.order` | The Ledger Opens | Order is only debt everyone agreed to honor. | ✓ |
| `card.bargain.signature.entropy` | Pay It Elsewhere | Nothing is free. Some prices are only slower. | ✓ |
| `card.gambit.signature.chaos` | No Middle Ground | Chaos has no use for the adequate. | ✓ |
| `card.heavy_hand.signature.force` | Full Weight | Subtlety is a choice. This is not it. | ✓ |
| `card.boost.signature.energy` | A Sudden Surge | Bodies hold more than they admit. | ✓ |

Nine instances across two hands (five on step 1, four on step 2). **The draft's claim is
exactly right.** This is also the first authored template in the corpus to set
`libraryCardId` at all, which is the brief's standing instruction — `cardPlayTally`, the
twilight harvest and the echo card get their first real data from this encounter.

**Titles 2–4 words** — checked all eleven: 3, 3, 3, 3, 2, 2 (one-off), 3, 2, 3, 4 (one-off),
3. Purpose lines 3 and 4 words, both ≤4. ✓

**Scene-bespoke prose on a card face (trigger 16): NO HIT, and I want to record why**,
because it looks like one at a glance. Several effect lines name this scene's furniture
("the tally", "the company's own arithmetic", "the one holding the book"). The spec
sanctions exactly that in the interim: *"Until the library data model lands, authored hand
instances name their targets directly (the exemplar's Balm names the condition it lifts)."*
I checked the exemplar and it does the same thing on every card — *"low sun crosses the
water: shallows show pale, the channel shows dark"*, *"the current slackens against them the
whole width of the river"*. And `NudgeCardContent` carries only `title`, `quote` and an
optional `imageTag` — **there is no `effectLine` in the library**, so a per-instance effect
line is the schema's design, not a deviation. Clear.

**One line did assert history and is fixed.** The step-1 Favor's effect line opened *"You put
**an old** obligation in front of the one holding the book"* — an obligation the graph does
not hold, on a card whose whole job is to *mint* one. Prose rule 7 in miniature.

> **[EDITORIAL REWRITE]** "You set an obligation in front of the one holding the book, and
> they deal like a person who owes a turn. A real help — and a turn is owed back afterwards."

**Every `effectLine` states mechanism, not mood** — checked all eleven. Each names what the
god does and why that moves the odds. **Zero digits, zero `%`** across all eleven ✓.

**Card `imageTag`s** — all seven resolve to live rows in `ENCOUNTER_IMAGE_LIBRARY`
(`generic.focus`, `generic.oath`, `generic.decay`, `generic.luck`, `generic.strength`,
`generic.matter`, `generic.energy`), verified by grep, not by the draft's table ✓.

---

## 11. The two judgment calls — second opinions

### Call 1a · The `side_bet` one-off — **UPHELD, and it is forced, not chosen**

I traced membership independently rather than taking the draft's word. `side_bet` is in the
21-type union (`nudge-card-library.ts:47`) and appears in **none** of the four member
sources:

- `UNIVERSAL_CORE_TYPES` = `['boost', 'insurance', 'mercy', 'trait_card']` — absent
- `SPHERE_SIGNATURES` — all twelve rows read; `side_bet` signs no sphere
- `HUNGER_UNIQUE_CARDS` — all twelve hungers read; absent
- `VARIATION_MEMBERS` — six members read; absent

**Zero members.** `fellowship` and `signature` are the other two empty types, which matches
the orchestrator's independent count (37 members across 18 of 21 types).

**One correction to how the draft records it.** Its comment says the face *"stays a one-off
rather than naming an id that resolves against nothing"* — which reads as a preference. It
is not a preference; there is no id to name. The revised comment says so, because a future
reader deciding whether to "fix" this needs to know the library is empty rather than
unfashionable.

### Call 1b · The Favor **call** one-off — **UPHELD**

Checked separately, since this one genuinely could have gone either way. The two Favor
members and their authored faces:

| id | title | quote |
|---|---|---|
| `card.favor.signature.order` | The Ledger Opens | *"Order is only debt everyone agreed to honor."* |
| `card.favor.hunger.bind` | A Debt Written | *"Every civilization runs on who owes whom."* |

**Both are mint-side.** *The Ledger Opens* opens an account; *A Debt Written* writes one.
Neither face is about **collecting** a debt on the day you need it, which is what step 2's
card does. Dealing `card.favor.signature.order` there would be the same face doing the
opposite verb — worse than a one-off, because it would poison the library's own data with a
mismatched play. The draft's claim holds and the one-off is correct.

**And its pricing argument is the best small judgment in the packet.** Priced at 1 essence
rather than 0 *"because the card does not redeem the favor edge, so pricing it on an
obligation channel would claim a write nothing performs."* That is the Law 56 discipline
applied to a **cost channel** rather than to a chip, one pass before anybody asked. Upheld
verbatim.

Both one-offs are recorded as deliberate, in code comments and in the blocker section ✓.

### Call 2 · Five `byOutcome` bands, not three — **UPHELD, none thin**

The floor is three (one success-side, one failure-side, one extreme). Five authored:

| Band | Overview | Chips | Thin? |
|---|---|---|---|
| `critical_success` | 2 sentences, band-specific (the smallest line, the turned book) | 2 | no |
| `success` | 2 sentences, band-specific (payable, and the road unchanged) | 1 | no |
| `success_at_cost` | 2 sentences, band-specific (closed heavy, the lighter pack) | 1 | no |
| `failure` | 2 sentences, band-specific (barrier down, the low track, the kept line) | 3 | no |
| `critical_failure` | 2 sentences, band-specific (the extra day, dusk, the open line) | 3 | no |

Every overview says only what its band can say — I checked each against the others for
substitutability and none is portable. Both extremes present plus `success_at_cost`, so the
"one extreme" clause is triply satisfied.

**One honest weakness I am recording rather than papering over.** After the §6a rewiring,
`failure` and `critical_failure` carry the **same three chips**, because they are backed by
the same writes and no mechanism distinguishes which step broke (`byOutcome` keys on the
action's band; the depth of the failure is not in it). Claiming a different chip set on
`critical_failure` would claim a different write, and that is precisely the defect this pass
exists to remove. The bands differ where they honestly can: in the overview, which is the
reflective landing, and in the reaction pair. I would rather ship two bands with identical
truthful chips than two bands with a decorative difference.

**Also corrected: `near_miss` is not a band this encounter can resolve to.**
`UnifiedActionOutcome` (`src/types/unifiedAction.ts:2456`) is `success · failure ·
contested_won · contested_lost · critical_success · critical_failure · success_at_cost` —
**no `near_miss`**. The draft's §14 outcome ladder gives `near_miss` its own row as if it
were an ending. It is a per-step `StepOutcome` (correctly used in `bandProse` and
`carryoverFactorLines`, where it is a `success` for advancement purposes). Ladder corrected;
the card fragments are untouched and were right.

---

## 12. Hand rules — per step, checked against the constants

### Step 1 (`gold`, difficulty 0.40 → `fair`)

| Rule | Bound | Actual | ✓ |
|---|---|---|---|
| Hand size | 4–8 | 6 | ✓ |
| Distinct spheres | ≥4 | 4 — order, entropy, chaos, force | ✓ |
| Ungated common options | ≥1 | 2 (Boost, Side-bet) | ✓ |
| Riders | ≤1 | 1 (`all_or_nothing`, justified in a comment) | ✓ |
| Boosts | ≤2 | 1 | ✓ |
| Distinct types | ≥3 | 6 | ✓ |
| Forecast arithmetic | difficulty + hand ∈ [0,1] | 0.40 + 0.54 = **0.94** | ✓ |

Hand Δ re-added by hand: 0.06 + 0.10 + 0.12 + 0.03 + 0.16 + 0.07 = **0.54** ✓.
With the trait variant's `+0.04` and `difficultyDelta −0.02` the worst case is 0.38 + 0.58 =
**0.96**, still inside ✓.

### Step 2 (`shadow`, difficulty 0.38 → `fair`)

| Rule | Bound | Actual | ✓ |
|---|---|---|---|
| Hand size | 4–8 | 5 | ✓ |
| Distinct spheres | ≥4 | 4 — force, entropy, order, energy | ✓ |
| Ungated common options | ≥1 | 1 (Boost) | ✓ |
| Riders | ≤1 | 0 | ✓ |
| Boosts | ≤2 | 2, buying different certainties (attention vs body) | ✓ |
| Distinct types | ≥3 | 4 | ✓ |
| Forecast arithmetic | difficulty + hand ∈ [0,1] | 0.38 + 0.53 = **0.91** | ✓ |

Hand Δ: 0.08 + 0.15 + 0.12 + 0.10 + 0.08 = **0.53** ✓.

### The two zero-essence Bargains — the cost channel is real and correctly priced

**Verified.** `costs.doomDelta` is a live channel (THR-885), and it is what the exemplar's
`ford.pay_it_later` uses at the identical shape — `essenceCost: 0`, `forecastDelta: 0.12`,
`costs: { doomDelta: 0.05 }`. The draft's step-1 Bargain is a character-for-character match
to the exemplar's pricing; step 2 raises the doom to 0.06 for the same Δ, which is a
defensible small escalation on the beat where the price is actually being paid. Not a
trigger-20 hit: both cards name a channel, and the `effectLine` says where the price lands
in words (*"the world's doom clock runs a shade faster instead"*).

The two Heavy Hands are priced on `detectionDelta: 0.15` — also a real channel, also stated
in words on the face. The Favor-call is priced in essence, deliberately, for the reason in
§11.

### Reachability (THR-821)

Open-draw ambient content, so both steps must sit at or under
`NUDGE_OFF_REACH_MAX_DIFFICULTY` (0.45 — verified in `nudgeAuthoringConstants.ts:150`).
0.40 and 0.38, both rendering `fair` under `DIFFICULTY_WORD_BANDS`
(`nudge-constants.ts:198` — `fair` is the 0.30–0.45 band). ✓

### Failure payoff — all six `StepOutcome`s, both steps

Every one of the eleven cards carries at least one failure-texture fragment
(`near_miss` counts). Both big-delta cards clear the `NUDGE_BIG_DELTA` (0.15) rule:

- Step-1 Heavy Hand, Δ **0.16** → `failure` ✓ **and** `critical_failure` ✓
- Step-2 Heavy Hand, Δ **0.15** → `failure` ✓ **and** `critical_failure` ✓

Band coverage across both hands: all six covered on both steps, verified against the draft's
own table and re-derived from the fragments. **The failure fragments are cool, not punitive**
— *"The weight went on, the book bent under it, and the price came out unchanged"* is the
best of them, and *"There was one more hour in them. The tally asked for three"* is the
second. Failure reads as plot here, which is the program ruling.

### Carryover into step 2 — legitimate, and none static in disguise

`carryoverFactorLines` keyed on step 1's resolved band is a variance surface by
construction. Each of the four reads correctly and none would render identically on another
run — they *cannot*, since each renders only for its band:

| Band | Line | Polarity / Δ | Reads correctly? |
|---|---|---|---|
| `critical_success` | "They owe the cheapest line in the book." | for, +0.05 | ✓ |
| `success` | "The figure they agreed is one they can carry." | for, +0.03 | ✓ |
| `success_at_cost` | "They agreed to more than the book asked for." | against, −0.03 | ✓ |
| `near_miss` | "The ledger says more than they remember saying." | against, −0.05 | ✓ |

All name their source inside the sentence (canon rule 1, no label beside it), all ≤12 words,
polarities and signs agree. The `near_miss` line is the standout — it is the only surface in
the packet that renders the *texture* of a near miss rather than its magnitude.

`failure` and `critical_failure` are correctly absent: step 1's `fail_action` makes step 2
unreachable from them, so a line there would be prose nothing can render.

### Static factor lines (THR-892) — none authored

**Zero `factorLines` on either step**, and the draft's reasoning is right and worth keeping:
"the company is short of pay", "the book sets the figure" and "the picket is watching" read
identically on every run, so they are priced into `difficulty` and carried by the prose. The
only authored factor surfaces are `TraitVariant.factorLine` (variance by construction) and
`carryoverFactorLines`. No trigger-23 hit.

---

## 13. Detectors — three hits, all fixed (REVISE trigger 15)

Run by hand against `nudgeAuditDetectors.ts`, which is the authority. `outcome`-class fields
enforce evasive **and** natural indefinites at zero; `scene` and `interactive` enforce evasive
only.

| # | Field | Term | Class | Drafted | Fix |
|---|---|---|---|---|---|
| 1 | step-1 Boost `failure` fragment | `way` | outcome | "Steady all the **way** through, and the book still did not move." | "Steady to the end, and the book still did not move." |
| 2 | step-1 Bargain `critical_failure` fragment | `somewhere` | outcome | "The debt was taken on **somewhere** else, and the table still closed against them." | "The debt went out into the world, and the table still closed against them." |
| 3 | step-2 Boost `success` fragment | `way` | outcome | "They watched the count all the **way** to the end, and the count ended where it should have." | "They watched every mark go down, and the count ended where it should have." |

The draft's §22 self-audit claims `way` was *"deliberately avoided in every outcome-class
field"*. It was avoided in the afterimages and overviews and missed twice in the band
fragments — which is the ordinary shape of this failure, since fragments are written last.

**Passes, recorded so nobody re-litigates them:**

- `"Most things fail by a margin."` and `"Nothing is free."` — `fiction` is **scene** class,
  where natural indefinites are ordinary English. Both are verbatim library content and must
  not be touched.
- `"so nothing is added to the tally behind them"` — `effectLine` is **interactive** class,
  evasive-only. `nothing` passes.
- `"The table went nowhere."` — `nowhere` is not in `NATURAL_INDEFINITE_TERMS`.

**Annotation clauses: zero.** I ran all five `NOT_X_BUT_Y_PATTERNS` against every player-facing
field. Nothing matches — including `/\bless\s+[a-z]+\s+than\s+[a-z]+/i`, which the packet
skirts twice with *"lighter than"* and *"further than"* and does not trip. Budget is 1;
spend is 0. The `fallback.overview` rewrite in §1 removes the one *stylistic* instance
(a gloss the regex could not see).

**Divine outcome-authorship: zero.** `DIVINE_DECISION_PATTERNS` needs a decision verb followed
by `whether/what/which/who/if` **and a clause**, or the bare phrase "the outcome". No effect
line, fragment, overview or afterimage contains a decision verb with the god as subject at
all. Every effect line says what the god *does* — *steadies, sets, presses, keeps, brings to
mind*. Rule 5b holds.

**Intensifiers: zero** (warning-level only, but clean).

---

## 14. Envelope, cast, grants, faction — verified against source

### Envelope

Four classes declared (`stronghold`, `ruin`, `wayside`, `battlefield`), **one opening each**,
matching the batch-wide envelope. `locationSubtypes` derived by `expandSettings()`, never by
hand ✓.

**Both spines checked for class scenery and both are clean.** Step 1's spine names barrier,
quartermaster, ledger, plank table — none of which is a gatehouse, a wall, a tent or an
earthwork. Step 2's spine names the company, the measure and the ledger. Afterimages name
only the barrier and the book. **A gate-holding company reads at `wayside` and `ruin` as
readily as at `stronghold`** — which the four openings prove individually, since each stands
up without the others.

### Cast

Explicit `supportBundle` is correctly mandatory (a four-class envelope inherits no THR-1044
family default). **Class-honesty holds and the draft's reasoning is sound**: `quartermaster`
is the person who names a price, is seeded at `military_outpost` and by the `military_order`
roster, and `guard_captain` covers the `stronghold` reuse path; `ruin` and `battlefield`
carry no roster, so the spec materialises and `spawnNpcRole: 'quartermaster'` must read at
every class — which it does. A company's quartermaster is equally at home at a fort, in a
broken keep, on an earthwork and at a tent line.

`spawnName: 'Soren Vail'` is a real name, not a role phrase ✓ — required, because
`{cast:officer}` will render it whenever no live NPC is reused.

**Every `{cast:*}` token names a declared key.** Two tokens, both `officer`, both where the
name buys something (the `critical_success` bond chip, the attributed line). `{cast:agent}`
carries the personalized address.

**No gendering anywhere.** Grepped the full draft for `he|she|his|her|hers|him|himself|
herself` on word boundaries: **the only hit is the draft's own instruction to the critic not
to use them.** Zero in prose. ✓

### Grants liveness — each checked in source, not taken on the draft's word

| Ref | Source | ✓ |
|---|---|---|
| `agreement.debt.minor` | `src/data/agreement-reward-catalog.ts:37` — "A small debt owed — repayable in coin or kind", tier 1, 48 ticks | ✓ |
| `agreement.favour.earned` (new, R1) | same file — "A favour earned through good deeds", tier 1, 72 ticks | ✓ |
| `trait.condition.exhausted` | `src/data/condition-trait-content.ts:223`, in `CONDITION_TRAIT_DEFINITIONS` | ✓ |
| `favor_creation` `debtorAgentId` | field exists (`unifiedAction.ts:1043`) **and** is a registered scene sentinel (`SCENE_SENTINEL_FIELDS`, THR-1175) so `$cast:officer` binds | ✓ |
| `intelligence` category `military_position` | live `IntelligenceCategory`, in production use in `army-encounter-content.ts` | ✓ |
| `plant_compulsion` (new) | `unifiedAction.ts:770`; `encounterBias` keyed on `EncounterType` — `trade`/`acquire`/`hire` all members | ✓ |
| `trait.core.core_hope.vice` | seeded trait, passes `validateTraitRefs()` per the draft; the full node id is the rot-resistant form ✓ | ✓ |

**Effect field shapes** — I read the union for all seven kinds used and every authored field
name is correct (`withAgentId`/`sentimentDelta`/`trustDelta`; `targetFactionId`/`delta`;
`templateId`/`targetAgentId`/`durationOverride`; `conditionTraitId`; `magnitudeRange`/
`context`/`debtorAgentId`; `category`/`label`/`detail`/`reliability`). No invented fields.

**One structural confirmation that unblocks the `drive` wiring**: step
`successMetadata.effects` / `failureMetadata.effects` are dispatched through the **same**
`applyEncounterAftermathReaction` the reaction path uses, wrapped in a synthetic reaction
(`unifiedActionResolution.ts:923`, THR-783) — *"no effect kind can be live on one path and
dead on the other"*. So `plant_compulsion` is authorable on a step outcome, which is what
makes the fix in §6a possible.

### Faction standing

`reputation_with` → `targetFactionId: 'mercenary_company'` — a real `FACTION_DEFINITIONS` id
(`src/data/mercenary-company-definition.ts:35`, registered at `faction-definitions.ts:167`) ✓.

**It is verified NOT load-bearing.** An agent with no faction history plays the identical
encounter: no card is faction-gated, no `requiredTraits` or `blockedByTraits` reference a
faction, no factor line or band reads a prior standing, and `reputation_with` mints the edge
from nothing. If a world seeds no chapter of `mercenary_company` the effect no-ops with a
trace and passage, the quartermaster and the condition are untouched. That satisfies the
maturity gate — factions are deferred-tier, so a real write is fine and a dependency is not.

`reputation_with` is also the right leg rather than `faction_reputation_gain`: the traveler
is not a member, and `applyFactionReputationGain` no-ops with `not_a_member` for a
non-member. Correct call, kept.

### Law 56 — every chip, after the fix

| Chip | Anchor | Catalog status | Backed by |
|---|---|---|---|
| `gp.company_standing` | `$faction:mercenary_company`, `visualKind: 'faction'` | 🔗 linked | step-2 `successMetadata` `reputation_with` |
| `gp.quartermaster_bond` | `$cast:officer`, `visualKind: 'agent'` | 🔗 linked (`individual`) | step-2 `successMetadata` `bond_change` |
| `gp.company_standing_lost` | `$faction:mercenary_company` | 🔗 linked | step-**1** *and* step-2 `failureMetadata` `reputation_with` |
| `gp.quartermaster_cooled` | `$cast:officer` | 🔗 linked | step-1 *and* step-2 `failureMetadata` `bond_change` |
| `gp.the_figure_follows` | `$actor`, `visualKind: 'agent'` | 🔗 linked | step-1 *and* step-2 `failureMetadata` `plant_compulsion` |

`$faction:<defId>` is the sanctioned declaration form (`chipAnchorDeclarations.ts:57`,
`ANCHOR_SENTINEL_FACTION_PREFIX`), resolved to the live faction **node** id before render —
which is what the anchor catalog's "anchor the node, not the def id" note requires, and the
sentinel is how an author expresses it. `bindFactionDefinitionIds` does the same for the
effect's `targetFactionId`.

Every chip leads with the mechanic and the endpoints before any fiction (rule 0c). No chip's
`kind` is `reputation_tally` (rule 0d) ✓. **Every chip is backed on every path that can
render it** — which was not true of the draft and is the whole of §6a.

---

## 15. Crux, title, prose rule 7

**Crux** — one plain sentence, tightened slightly to match the batch design's own wording:

> A free company holds the only gate on the agent's road, and every price in their book
> costs something they cannot get back.

Who, does what, about what, and the vibe. One sentence, one thought. ✓

**Title glance test** — *The Garrison's Price*. A player reading only the title knows there
is a garrison and it wants paying. Passes the *Broken Wheel* bar; nothing poetic sits in the
tunnel between the title and the understanding. ✓

**Prose rule 7 — no invented game state.** Base prose asserts no relationship, debt, prior
visit or standing between the agent and the world. The agent has never been here and the
scene never claims otherwise. The only prior-relationship fiction in the whole packet sits on
the step-2 Favor card, which is `requiresFavor`-gated and therefore dealt **only when a real
`owes_favor` edge exists** — the sanctioned home for exactly that fiction. The one leak (*"an
old obligation"* on a mint-side card) is fixed in §10. ✓

**Design-block breach check (trigger 26).** Every mechanic and object in §0's table appears
in the prose or gates an outcome, after two corrections: the thread edge is removed with the
swap, and the step-1 standing shave named in §1 is now a real write rather than a claim.
Each step tests its declared reach — step 1 is *about* what a thing is worth and who sets the
figure (`gold`), step 2 is *about* getting clear of a claim without it growing (`shadow`).
Neither is retrofitted onto finished prose. ✓

---

## 16. Automatic REVISE triggers — the count

**Seven distinct triggers fired against the draft as received.** Every one is discharged by
an inline edit in the revised packet; none is waved.

| # | Trigger | Instances | Disposition |
|---|---|---|---|
| 1 | **15** — detector hit (vagueness lexicon, outcome class) | 3 | word-level rewrites, §13 |
| 2 | **22** — seam echo | 4 | rewritten, §9 |
| 3 | **26** — design-block breach: a declared mechanic the packet never wires (§1's standing shave) | 1 | step-1 `failureMetadata` authored, §6a |
| 4 | **26** — design-block breach: prose contradicting the design block's binding word (`honest`) | 2 | rewritten, §1 |
| 5 | **Consequences rule 0 / UI Law 56** — chips claiming state nothing wrote on a reachable path | 2 chips × 2 bands | aftermath rewired, §6a |
| 6 | **Checklist B8** — internal contradiction across one band's surfaces | 1 | afterimage rewritten, §1 |
| 7 | **Plainness move 1** — fragment opener | 1 | rewritten, §1 |

Plus one binding correction from outside the draft's control: the **consequence swap**, §17.

Not fired, checked: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 16, 17, 18, 19, 20, 21,
23, 24, 25, 27, 28, 29, 30, 31.

---

## 17. The consequence swap, as recorded

The batch's binding decision is applied. The draft correctly identified that the `thread`
half of its hand cannot be wired today and correctly refused to pretend otherwise; the swap
is the sanctioned valve for exactly that case.

```ts
consequenceDraw: ['relationship', 'drive'],
consequenceSwap: {
  from: 'thread',
  to: 'drive',
  reason:
    'thread_* effects take literal ascendantId and mortalId, and neither field is '
  + 'registered in SCENE_SENTINEL_FIELDS, so no $actor/$cast sentinel binds them; the '
  + 'ascendant node id is minted per run, so no literal exists for an author to write. '
  + 'The write no-ops with an edge_missing trace while check:encounter passes it on '
  + 'kind-presence — a chip over a dead write. drive holds weight 4 in gold '
  + '(CONSEQUENCE_FAMILY_WEIGHTS), clearing the >=2 bar, and is the truer consequence: '
  + 'a price this agent cannot get out from under becomes work they cannot stop taking.',
},
```

**Weight verified:** `CONSEQUENCE_FAMILY_WEIGHTS.drive.gold = 4`
(`src/data/content-eval/consequenceDraw.ts:145`). Bar is ≥2. ✓
**Satisfying kinds verified:** `CONSEQUENCE_FAMILY_EFFECT_KINDS.drive = ['assign_ambition',
'plant_compulsion']`. ✓
**Chip-backability verified:** `plant_compulsion` is an explicit member of
`CHIP_BACKING_EFFECT_KINDS` (`compositionContract.ts:226`). `assign_ambition` also qualifies
(via `PERSISTENT_EFFECT_KINDS`), so either would have worked — `plant_compulsion` is chosen
for the fiction, not for the gate. ✓
**Family is unique in the batch:** no other border-perils row draws `drive`, so the swap
widens the batch's palette rather than doubling a cell. ✓

### Where `drive` lands, and why it is in context rather than bolted on

It is wired on the **failure side of both steps**, so it fires on every reachable failure
path, and it is chipped on `failure` and `critical_failure`.

The reason it is in context is the crux itself. The encounter is about **a price you cannot
get out from under** — that is what the title says, what `debt` pressure means, and what
step 2's purpose line (*"Get out from under"*) tests. A mortal who could not meet an honest
figure does not simply walk away three days poorer; the number stays with them. `drive` is
what a debt *does* to a person, and it is the only family in the fifteen that answers the
question the encounter has been asking since the opening.

Mechanically it is the same beat one level out: the traveler leaves the gate and starts
taking the work that pays — `encounterBias` toward `trade`, `acquire` and `hire` for 96
ticks. The simulation then bends their next several decisions toward earning, which a player
can watch happen on the map. A tie to a god they cannot see was never going to read as
consequence at a plank table with a ledger on it; a person who cannot stop chasing a figure
does.

---

## 18. Revision Summary

### Must fix — all applied

1. **The Law 56 hole on the step-1 failure path.** Step-1 `failureMetadata.effects`
   authored; `gp.a_day_on_the_wall` folded (write kept, chip removed); both failure overviews
   rewritten to be true whichever step broke; `gp.quartermaster_cooled` added so the officer
   bond move is chipped. Standing rule adopted: no chip is backed by a reaction.
2. **The consequence swap** — `thread` → `drive`, recorded with its mechanism-naming reason;
   `thread_strengthen` removed from step-2 `successMetadata` and from the `critical_failure`
   reaction; `gp.the_thread_pulled` deleted.
3. **Honest-antagonist breaches** ×2 (+1 softened) — the company no longer "stops
   pretending" and no longer "finds more work".
4. **Detector hits** ×3 — `way` ×2, `somewhere` ×1, all in outcome-class band fragments.
5. **Seam echoes** ×4 — stronghold/plank table, wayside/barrier, the `critical_success`
   "smallest price on the page" cluster, step-2 "let them go early".
6. **The step-2 `failureAfterimage` contradiction** — "the barrier lifted" on a band where
   the barrier stayed down.
7. **`gp.walk_it_off` could be a pure no-op** — now always writes.
8. **R1 granted a debt on a success band** — moved to `agreement.favour.earned`.

### Should fix — applied

9. `critical_success` overview opened on a fragment (plainness move 1).
10. `fallback.overview` asserted the company's honesty instead of showing it.
11. The step-1 Favor's effect line claimed *"an old obligation"* the graph does not hold.
12. The `initiation`'s *"Pay one and the road stays a road"* drifted toward pass/fail rules
    text; the exit's price stays legible, which the shape requires.
13. The `side_bet` one-off comment read as a preference; it is a forced choice.
14. §14's outcome ladder listed `near_miss` as an ending. It is not in `UnifiedActionOutcome`.
15. Crux tightened to the batch design's own wording.

### Consider — recorded, not applied

16. **Three effect lines end on a bare magnitude word** (*"A small help." / "A real help." /
    "A strong help."*). The exemplar does this too, so it is the house convention and I left
    it — but a face carrying `libraryCardId` will eventually want one canonical effect line,
    and when THR-887 lands the library data model these are the strings that will need
    reconciling. Not a defect today; a known future edit.
17. **`aftermathConfig.branchOnStep: 0` on a branchless encounter** is inert. Harmless, and
    the systems pass may prefer it dropped.
18. **The `success` band carries one chip** where the fiction could arguably carry two. Left
    alone: the second write (`reputation_with` faction, +0.10) *does* fire on `success`, and
    a case exists for chipping it there as well as on `success_at_cost`. I judged the single
    chip the better read — a plain success is the band where the encounter should feel
    small, and three chips on every success-side band would flatten the ladder.

---

## Verdict

The scene is good, the hand is well cut, the antagonist is honest once two lines are
repaired, and the opt-in gate is the real thing rather than a toll wearing the word. The
aftermath was wired for a path the engine does not always take, and that was worth catching
before it shipped — but it is a wiring error inside a correct design, not a broken design,
and it is fully specified and applied in the revised packet.

**PASS WITH REVISIONS**
