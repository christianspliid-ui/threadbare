# Encounter Pipeline: The Toll of Blades

> Scale: medium | Slug: `toll-of-blades` | Pass: **2 (editorial + revision)**
> templateId: `encounter.border.toll_of_blades` | Batch: border-perils (THR-1221), row **1**
> Date: 2026-08-24 | Pipeline version: 3.0 (nudge-native)

Reviewed against `nudge-authoring-spec.md`, `SKILL.md` § *Automatic REVISE triggers* (all
31), `Docs/canon/encounters.md`, `Docs/canon/prose.md`, the batch brief and the batch design
row, and the golden exemplar (`swollen-ford-exemplar.ts`). Every code claim below was read
in source, not taken from the draft.

**Verdict up front: PASS WITH REVISIONS.** Six triggers fired against the draft; all six are
editorially fixable and all six are cleared in
[`toll-of-blades-revised.md`](./toll-of-blades-revised.md). See § 12 for why that is not
leniency.

---

## 1 · Prose quality

The draft's floor is high. The spine's closer — *"The stylus stops at the agent's row."* —
is the best sentence in the packet and does exactly what rule zero asks: subject, verb,
object, and the vibe, in seven words. The tablet is a genuinely good invention: being robbed
by people who write it down first is a specific indignity, and the prose lands it without
saying it. `critical_failure` at step 1 — *"They went down in the verge with the column's
boots going past at eye level"* — is concrete, cold, and hard without being grim, which is
this row's exact tonal assignment.

What follows is what is wrong with it.

### 1a · Word-level repetition inside single paragraphs

Four of the five scene paragraphs repeat a noun two or three times inside sixty words. This
is not a detector class and it is the first thing a read-aloud catches.

| Where | The repetition | Verdict |
|---|---|---|
| `wayside` opening | *picket **lines*** · *a horse-**line*** · *the head of the **line*** — three, in two senses, and the spine then opens on *"The **line** of held travelers"* | **Must fix.** The draft flagged this as a "soft seam" for Pass 2 to re-read. Read aloud it snags on the second occurrence, not the fourth |
| `ruin` opening | *has **stopped** inside it* · *travelers are **stopped** in the lane*; and *roofless **walls*** · *a **wall** coming down* · *watching the **walls** come off* | **Must fix** |
| `battlefield` opening | *crosses **ground*** · *halted on that **ground***; *long **ridges*** · *past the last **ridge*** | **Must fix** |
| `stronghold` opening | *The road **ends*** · *filling the road **end to end***; *a fortress **gate*** · *The **gate** has stood open* | **Must fix** |

`[EDITORIAL REWRITE]` — all four openings rewritten in the revised packet. Each keeps its
sense inventory (checklist A2 holds: two or more non-sight senses per class) and each loses
its doubled noun.

### 1b · A sentence that needs two readings (trigger 29)

> *"The road crosses ground a battle already used."*

The relative pronoun is elided, so the reader parses *ground* as the object of *used* on the
second pass, not the first. Rule zero is explicit: clarity beats compression, and a sentence
needing two readings is a defect even when every word in it is good.

`[EDITORIAL REWRITE]` → *"The road crosses ground that a battle already used."* One word,
and the stumble is gone.

### 1c · Participial openers (plainness move 1)

Move 1 is *subject first — never open on a fragment*. Three band fragments open on a
participle instead:

- *"**Steadied**, they held the serjeant's eye…"* (step 1, A Little More, `success`)
- *"**Steadied** again at the third hour…"* (step 2, A Little More, `success`)
- *"**Leaned on** from the first hour, the legs never got…"* (step 2, The Slow Push, `success`)

All three rewritten subject-first.

### 1d · The initiation is written in the wrong voice

> *"Wait for it to clear and the day goes with it. Walk up now and the toll is set by the
> serjeant…"*

Two imperatives addressed to nobody the game has. The god does not instruct the mortal and
the interface does not instruct the player; a conditional imperative here reads as rules
text wearing prose, which is what trigger 25 exists to catch. It is a mild instance — it
states the *terms*, not pass/fail outcomes — but it is the one paragraph in the packet whose
voice is not the scene's.

`[EDITORIAL REWRITE]` — recast as statements. See § 2 for the second, larger problem with
this paragraph.

### 1e · A card face lifted verbatim from the exemplar

`Shoulder To Shoulder`'s flavour quote is **"One rope, many hands."** That is the golden
exemplar's `ford.shared_burden` quote, word for word — and the draft labels it *"one-off
face, written to the library's genericity bar"*, which describes authoring that did not
happen. Its `effectLine` is the same skeleton one clause deeper (*"Only in company: the
group … as one body …"*).

`fellowship` has no library member, so this card cannot legitimately share a face with
anything; a one-off that copies the only other Fellowship in the repo is the worst of both
models. Rewritten: **"One is moved. Several are negotiated with."** — generic, dry, reads in
any encounter where a company is present, and it is about the *type's* mechanic rather than
about ropes.

### 1f · Two cards telling the same joke in the same band

Step 1, `failure`, both fragments render together:

- A Sudden Surge — *"The body answered. The column had **more bodies**."*
- Full Weight — *"Force met the column head-on and the column simply **had more of it**."*

Same construction, same punchline, one screen. Full Weight rewritten to *"Force met the
column head-on, and the column came through it without changing step."*

Step 1, `critical_success`, same problem with *spears*: Full Weight has *"The two **spears
came up**…"* and No Middle Ground has *"The **spears came back**…"*. Both rewritten, and No
Middle Ground's now reaches for a new object (the wax) instead of restating the base text's
blank row.

### 1g · Vagueness surviving its own fix

The draft records rewriting the gambit's `critical_failure` fragment away from *"the whole
thing went the other way"*. What shipped is *"With no middle left, it went the other
direction all at once, and hard"* — the banned noun is gone and the vagueness is not:
*it* has no referent and *the other direction* names nothing the player can see. Rewritten
to a concrete image (*"they went down on the first spear-butt and stayed down"*).

---

## 2 · Seam echoes (trigger 22) — the class the detectors cannot see

The draft ships a seam table, which is the right instinct, and **the table checks the wrong
seams**. It checks `opening→spine` and `spine→band` and stops. That is the narrow audit every
draft in this batch wrote, and the misses cluster in exactly the part it skips.

Two things about trigger 22 need saying before the table. First, its own wording — *"across a
paragraph boundary"* — does not describe most of what follows, because the worst echoes here
are not between paragraphs at all: they are between **surfaces that render together on one
screen**. Read the trigger's intent. Second, the render order is longer than the draft's
model of it:

```
opening → narrativeTemplates.initiation → step-1 spine → step-1 base band text
        + step-1 card fragments (up to three, layered)
        → step-2 spine → step-2 base band text + step-2 card fragments
        → aftermath overview → chips (title · causeClause · detail), up to three
        → narrativeTemplates.success/.failure
```

So the seam set is: `opening→initiation`, `initiation→spine`, `spine→base band text`,
**`base band text→card fragment`**, **`card fragment→card fragment` for fragments active on
the same band**, `band→overview`, `overview→chip`, **`chip→chip` within one band**, and
`narrativeTemplates.*` against everything it renders beside. The draft read two of nine.

### 2a · What fired

**Between paragraphs**

| Seam | The echo |
|---|---|
| **opening → initiation** (all four classes) | Opening: *"**A column has halted** along the verge"* / *"**The column has stopped** inside it"* / *"**A column has halted** on that ground"*. Initiation, next paragraph: *"**A column has stopped** across the road…"* Same subject, same verb, same information, back to back |
| **initiation → spine 1** | Initiation: *"the toll is set by **the serjeant** working down the line with **a wax tablet**"*. Spine: *"**A serjeant** works down it … **wax tablet** in hand"*. Both introduce the same two things. The draft's own checklist answer A3 says the serjeant *"is introduced in the setting-neutral spine"* — the initiation contradicts it |
| **spine 2 → step-1 `success` afterimage** | *"The **pack stayed on** the agent's back"* → *"The agent stays where they are, **pack still on"***. The pack is the stake and a through-line is legitimate; near-identical phrasing two paragraphs apart is not |

**Inside one ending — the surfaces that land together**

| Seam | The echo |
|---|---|
| **step-1 `critical_success`: base → fragment** | Base: *"The serjeant **looked** at the road, **looked** at them, and left the **row blank**."* Full Weight: *"…The line **looked** at that."* No Middle Ground: *"…the **row stayed blank**."* *Looked* three times, *row blank* twice, one screen |
| **step-1 `critical_success`: fragment → fragment** | Full Weight *"The two **spears came up**"* against No Middle Ground *"The **spears came back**"* — both active together |
| **step-1 `failure`: fragment → fragment** | A Sudden Surge *"The column **had more bodies**"* against Full Weight *"the column simply **had more of it**"* — same construction, same punchline, both active |
| **step-1 `critical_failure`: base → fragment** | Base *"They **went down** in the verge"* against the gambit's *"…it went the other direction"* rewrite candidate, and against Full Weight's *"the road came up fast"* — the fall told twice, sometimes three times |
| **step-1 `success_at_cost`: base → fragment** | Base *"The column **took** a sack"* → A Sudden Surge *"the shoulder that **took** the spear-shaft"* (plus *shoulder* twice inside the fragment) |
| **step-2 `success_at_cost`: base → fragment** | Base *"They were still **standing** when the tail cleared"* → By The Book *"**Standing** to the end had been bought already"* |
| **step-2 `failure`: base → fragment → fragment** | Base *"They **sat down**"*, Full Weight *"and then they **folded**"*, Shared Watch *"and **went down** together"* — the collapse narrated three times in one band. Plus The Slow Push *"The afternoon was **longer than** the push"* against Shared Watch's comparative, the same shape twice |
| **step-2 `critical_failure`: base → fragment** | Base *"**stepped over** them"* → By The Book *"a body the herd has already **walked over**"* |
| **step-2 `critical_success`: band → overview** | Afterimage *"The last wagon **went by** and the serjeant lifted two fingers off **the tablet** **as it passed**"* → overview *"The column **went past** … wrote it in the margin of **the tablet**"* |
| **step-2 `failure`: band → overview** | Afterimage *"They sat down in the verge … the rest of the column stepped around them"* → overview *"They were walked off the road…"*. Also a contradiction — § 3 |
| **step-1 `success` → `success` overview** | *"**The stylus moved** on down the tablet"* → *"**The stylus moved** past their row without stopping"* |
| **step-2 `critical_failure`: band → overview** | *"…and **took the pack** on the way past"* → *"What the column did not **take**, the mud did"*; plus *"**The last** of the column"* → *"the **last** cart"* |
| **`success` overview → chip detail** | *"the column's **officers heard about** it by evening"* → *"The **officers heard about** the row that never got written"* |
| **`critical_success` overview → PATH causeClause** | *"**asked for a name**"* → *"**A name asked for** at the tail of the column"* |
| **`success_at_cost` overview → BOND causeClause and detail** | *"closed **the tablet two rows early** … **in front of the whole line**"* → causeClause *"The **tablet** shut **two rows** short"*, detail *"**the line** watched it happen"* — three surfaces, one screen |
| **`critical_success`: chip → chip** | Title *"Standing with the **column**"* sitting beside `stateNoun` *"standing with the **company**"* on the same chip and *"the **company**'s member list"* on the next — column and company used interchangeably where the player is being told which body they now belong to |
| **`critical_failure`: chip → chip** | causeClause *"The **column** came through where the agent was standing"* beside causeClause *"A row the **column** found easy"* |
| **`narrativeTemplates.success` → step-2 `success` afterimage** | *"the **agent is still on it**"* → *"the **agent was still standing on it**"* |
| **`narrativeTemplates.failure` → `failure` overview** | *"a **long walk** and a body that will feel this for **days**"* → *"Getting up takes a while, and **walking** takes longer"* / *"the next few **days** of road"* |

**Nineteen.** Twelve of them are inside a single ending, which is the region the draft's table
did not model at all.

### 2b · Seams re-read after revision — enumerated

Every seam this encounter has, named, and checked against the final text. Two steps, two
hands of six, four openings, five authored bands.

- `wayside`→initiation · `ruin`→initiation · `battlefield`→initiation · `stronghold`→initiation
- initiation→spine 1 · spine 1→spine 2 (across the intervening step-1 band text)
- spine 1→each of the five step-1 base band texts (`near_miss` has no afterimage field)
- spine 2→each of the five step-2 base band texts
- step-1 base→fragment, and fragment→fragment, on all six `StepOutcome`s:
  `critical_success` {4,5} · `success` {1,3,6} · `success_at_cost` {2} · `near_miss` {1,6} ·
  `failure` {2,3,4} · `critical_failure` {4,5}
- step-2 base→fragment, and fragment→fragment, on all six:
  `critical_success` {4,6} · `success` {2,3} · `success_at_cost` {1,5} · `near_miss` {2,5} ·
  `failure` {3,4,6} · `critical_failure` {1,4}
- step-2 base band text→its own overview, on all five authored bands
- each overview→each of its own chips (title, causeClause, detail)
- chip→chip within `critical_success` (three chips) and within `critical_failure` (two)
- `narrativeTemplates.success` and `.failure` against the overviews and afterimages they
  render beside
- the four openings against each other

All clean. The two that needed the most work were step-2 `failure` (three collapse verbs
across base and two fragments — now one) and `critical_success`'s three-chip stack (three
causeClauses that all named the column or the name — now distinct).

**One deliberate non-echo, recorded so a later pass does not "fix" it.** All four openings
open on *the road* as the grammatical subject, each naming what the road does at that class
(runs open / runs through / crosses / ends). Only one opening ever renders, so the player
never sees the repetition; it is a structural signature, not a seam. Kept.

**One deliberate motif, kept.** *"Step aside"* appears in the trait factor line (*"Being
Proud, they will not be seen to step aside"*) and in the `critical_success` overview (*"The
company keeps a list of people who do not step aside"*). That is the trait's flaw paying off
as the ending's recruiting criterion — the best design idea in the packet. The draft used
the phrase a **third** time, in the `success` carryover line, where it competed with the
overview; that instance is cut and the motif is now exactly two beats, pre-roll and ending.

**One deliberate non-echo, recorded so a later pass does not "fix" it.** All four openings
open on *the road* as the grammatical subject, each naming what the road does at that class
(runs open / runs through / crosses / ends). Only one opening ever renders, so the player
never sees the repetition; it is a structural signature, not a seam. Kept.

**One deliberate motif, kept.** *"Step aside"* appears in the trait factor line (*"Being
Proud, they will not be seen to step aside"*) and in the `critical_success` overview (*"The
company keeps a list of people who do not step aside"*). That is the trait's flaw paying off
as the ending's recruiting criterion — the best design idea in the packet. The draft used
the phrase a **third** time, in the `success` carryover line, where it competed with the
overview; that instance is cut and the motif is now exactly two beats, pre-roll and ending.

---

## 3 · Internal logic — one live contradiction (checklist B8, trigger 26)

On a `failure` action band the player reads, in this order:

1. step-2 `failureAfterimage`: *"They **sat down in the verge** before the herd was through,
   and the rest of the column **stepped around them**."*
2. aftermath `failure` overview: *"They were **walked off the road**, and the column took the
   pack on the way past."*

Being walked off the road is **step 1's** failure (*"The spear-butts came up, and the agent
was walked off the road with the tablet still open"*). Step 2's failure is exhaustion — they
stopped standing. The overview narrates the wrong step's defeat, and the two sentences
contradict each other on the same screen: the column both stepped around them and marched
them off.

`[EDITORIAL REWRITE]` — the `failure` overview now narrates what step 2 actually did, and
the whole of its weight moves onto the body and the standing, which are the two things this
band genuinely writes (`apply_condition` wounded, `reputation_with` −0.10).

### The picket that is not in the prose (trigger 26)

Two carryover lines name **"the picket"**:

- `success_at_cost` — *"They are standing on a leg **the picket** already opened."*
- `critical_failure` — *"They are on the ground where **the picket** left them."*

No prose anywhere in the packet contains the word. The `wayside` opening has *picket lines*
in the horse-tether sense, which is a different noun. § 4 of the draft asserts *"the picket
in the road is a role noun in the prose"* — it is not; the road has *two soldiers* and
*spear-butts*. This is a declared object the prose never establishes (checklist B6), on a
panel surface the player reads before rolling.

Worse, the `success_at_cost` line is also **factually wrong about its own band**. Step 1's
`success_at_cost` base text is *"The column took a sack and left the rest"* — nobody opened
a leg. The carryover asserts an injury the band it keys on never described, and carryover
lines must read correctly with no cards played.

Both rewritten against objects the spine establishes.

---

## 4 · Detector re-scan (trigger 15) — one real hit, and a wrong map

### The hit

`toll.an_easy_row`'s `detail`:

> *"The column marked the row easy and told it that **way** at the next halt."*

`way` is a natural indefinite. `EncounterAftermathChange.detail` is **`outcome`** field class
(`nudgeAuditDetectors.ts` → `pushAftermathVariant`: `push(change.detail, 'outcome')`), where
the spec's target is zero. Fixed.

**One precision, because the difference matters to whoever reads this next.** The gate is a
**density** threshold, not a count: `vaguenessDensity >= VAGUENESS_DENSITY_FAIL` (2.0 per
100 words), summed across all three classes over the whole template. At roughly 1,200
authored words this encounter would need about two dozen hits to go red, so *this one hit
would not have failed `check:encounter` on its own*. It is a standards fix, not a gate
rescue. Saying otherwise would overstate the finding — and, worse, would teach the next
author that one hit is survivable arithmetic rather than a target of zero.

**A related note that belongs to the library, not to this encounter.** `something` is on the
**evasive** list, which is enforced in every class including `interactive` — and
`card.stumble.signature.chaos`'s shipped title is **"Something Gives Way"**. So the library's
own face contributes an evasive hit to every encounter that deals it, and this batch's
`stumble` debut is the first. It is one hit against a 2.0/100w density gate, so nothing fails;
the encounter cannot fix it either, since library membership and content are out of scope
batch-wide. Recorded for whoever owns `CARD_CONTENT` (§ 13, item 22), not counted against
this draft.

### The draft's field-class map is wrong in two places, and one of them is why the hit survived

The draft's § 11 self-scan lists **"aftermath overviews"** in the outcome class and does not
classify chip `detail` at all. The code says the opposite, and the code is the contract:

| Field | Draft's map | Actual (`nudgeAuditDetectors.ts`) |
|---|---|---|
| aftermath `overview` | `outcome` | **`scene`** — with a long comment explaining the measurement that made it so (reading it as `outcome` flags 165 fields on indefinites against 57 genuinely evasive) |
| `change.detail` | unclassified | **`outcome`** — the strictest class, *"the chip is the source"* |
| `change.title` | unclassified | `interactive` |
| `reaction.label` | unclassified | `interactive` |
| `narrativeTemplates.initiation` | (correct) | `scene` |

The draft was stricter than required on overviews and blind on details — which is precisely
the shape that lets a `way` through in a detail while contorting an overview. The revised
packet carries a corrected map so Pass 3 does not inherit the false one.

### Everything else, re-run by hand over the revised text

| Detector | Class scope | Result |
|---|---|---|
| Vagueness — evasive | all | **0** |
| Vagueness — natural indefinites | `outcome` only (afterimages, band fragments, `narrativeTemplates.success`/`.failure`, chip `detail`) | **0** |
| Intensifiers (warn) | all | **0** |
| Annotation (`notButClause`, `emDashNot`) | ≤1 per encounter | **0.** Every em-dash in the packet is followed by a noun or a list. Budget unspent |
| Divine outcome-authorship | all | **0.** Every `effectLine` describes the god's own act; no decision verb takes a world-clause |
| Digits / `%` in an `effectLine` | — | **0** across all twelve cards |
| Second person on a mortal-drawn template | `outcome` + `scene` only (`countSecondPerson`, carved out for `interactive` by THR-1045 so a correctly-authored `effectLine` saying *"You steady them"* does not fail) | **0**, against a `SECOND_PERSON_FAIL` of 2. This template has no `ascendant` in `actorAffinities`, so it *is* mortal-drawn and the gate is live for it. Every opening, spine, afterimage, fragment and overview is third person |
| Abstraction-as-subject (by hand) | scene prose | Pass — and note this one is a **warning**, not a gate (THR-1092, demoted on measurement: 129 of 683 templates failed it and nothing else). Subjects: *the road, the roof, a column, travelers, horses, the turf, crows, the gate, wagons, two soldiers, the line, a serjeant, the stylus, the agent, the body, the company, the spears, the tablet, the herd, the mud.* Two abstractions were doing concrete work and are gone: *"the late demand"* (The Slow Push) and *"the half-measures wash out"* (No Middle Ground) |
| Static authored `factorLines` (THR-892, trigger 23) | — | **0 authored.** Both steps leave `factorLines` unset; the only authored panel lines are the trait variant's (renders only for the holder) and step 2's six carryover lines (keyed on the band step 1 rolled). Verified against `StepFactorLine` — `polarity` is required and authored, `forecastDelta` optional |

---

## 5 · The hand — mechanism, price, grounding, and the effect line that had no god in it

### 5a · Trigger 17 — one effect line states shape, not mechanism

> **No Middle Ground** — *"The half-measures wash out. It lands clean or it lands hard, and
> the middle drops away."*

Every other card in both hands opens *"You …"*. This one has no divine agent at all: it
describes what the ladder looks like afterwards, which is mood-adjacent shape rather than
*what the god does and why that moves the odds*. It also says the same thing twice (*"lands
clean or lands hard"*, then *"the middle drops away"*) — plainness move 3, one dry line, not
two.

`[EDITORIAL REWRITE]` → *"You strip the middle out of it, so what is left lands clean or
lands hard, with nothing between."*

### 5b · Card faces verified against source, not against the draft

All ten `libraryCardId`s resolve, and all ten faces are **verbatim correct** against
`CARD_CONTENT` in `src/data/nudge-card-library.ts`. Checked individually:

| `libraryCardId` | `title` | `quote` |
|---|---|---|
| `card.boost.core` | A Little More | Most things fail by a margin. |
| `card.boost.signature.energy` | A Sudden Surge | Bodies hold more than they admit. |
| `card.boost.variation.patient` | The Slow Push | Early pressure costs less than late force. |
| `card.stumble.signature.chaos` | Something Gives Way | Every structure has one loose piece. |
| `card.heavy_hand.signature.force` | Full Weight | Subtlety is a choice. This is not it. |
| `card.gambit.signature.chaos` | No Middle Ground | Chaos has no use for the adequate. |
| `card.insurance.signature.order` | By The Book | Rules exist so the worst case has a name. |
| `card.balm.signature.life` *(added, § 8)* | It Passes | Most suffering ends. This one ends sooner. |

`card.boost.variation.patient`'s unlock is `{ kind: 'milestone', unlockActionId:
'divine.rekindle_thread' }` — the draft's `requiredUnlock` matches the member's own
milestone ✓.

**By The Book's `effectLine` is a near-verbatim lift of the exemplar's `ford.safe_passage`.**
*"However the afternoon goes, they are still standing when it ends. The price, if it comes
due, is taken out of gear and skin"* against *"However the river runs, they reach the far
bank. The price, if it comes due, is paid in gear and skin."* Library members carry a
`title` and `quote` and **no** `effectLine` — the effect line is authored per instance, so
this is not the library model working, it is the exemplar being copied. Rewritten.

### 5c · Hand rules, per step, recomputed after the § 8 swap

| Rule | Step 1 (`iron`) | Step 2 (`stone`) |
|---|---|---|
| 4–8 cards | 6 ✓ | 6 ✓ |
| ≥4 distinct spheres | `energy · chaos · force · spirit` = 4 ✓ | `force · life · order · spirit` = 4 ✓ |
| ≥1 ungated common (sphere-less) | 1 — A Little More ✓ | 1 — A Little More ✓ |
| ≤1 rider, justified | 1 — `all_or_nothing` on No Middle Ground ✓ | 1 — `floor_at_cost` on By The Book ✓ |
| ≤2 boosts (brief) | 2 ✓ | 2 ✓ |
| ≥3 distinct types (brief) | 5 ✓ | 5 ✓ |
| trait-only cards at cost 0 | none authored (no trait card — § 7) | none |
| zero-essence non-trait priced elsewhere | none at zero ✓ | none at zero ✓ |
| dealt size after gates | 5–6 ✓ | 4–6 ✓ |

**A correction to the draft's own count.** It claims step 2 carries *"common sphere-less
options 2"*. The Slow Push is sphere-less but gated by `requiredUnlock`, so it is not an
*ungated* common; the count is 1, which still clears the floor of 1. Corrected in the
revised packet, because a count that reads as slack when it is at the floor is the kind of
figure a later edit spends.

### 5d · Rider justifications

Both present and both real. `all_or_nothing` at one essence with a 0.03 delta — the widened
downside *is* the price — and `floor_at_cost` at the hand's essence ceiling with its failure
fragment on `critical_failure`, the only failure band the rider leaves reachable. Correct on
both counts.

### 5e · Forecast arithmetic

| Step | Difficulty | Hand sum | Difficulty + full hand | Ceiling |
|---|---|---|---|---|
| 1 (`iron`) | 0.36 | 0.06+0.10+0.12+0.16+0.03+0.10 = **0.57** | **0.93** | ≤ `NUDGE_HAND_MAX_TOTAL_DELTA` 0.70 ✓ · inside [0,1] ✓ |
| 2 (`stone`) | 0.42 | 0.04+0.06+0.08+0.16+0.10+0.07 = **0.51** | **0.93** | ✓ |

Both under the ceiling with 0.07 of headroom, so no card in either hand can buy nothing. The
`stone` step's carryover can add at most +0.05 (`critical_success`) on top, reaching 0.98 —
still inside [0,1] ✓. The trait variant adds +0.05 forecast and −0.02 difficulty to step 1;
worst case 0.34 + 0.57 + 0.05 = 0.96 ✓. The swap changes neither sum.

Reachability holds: both steps render `fair` (0.30–0.45 in `DIFFICULTY_WORD_BANDS`), under
`NUDGE_OFF_REACH_MAX_DIFFICULTY` 0.45 — the open-draw branch, same as the exemplar.

### 5f · Failure payoff and band coverage

Every card carries ≥1 failure-band fragment (`near_miss` counting as failure texture), and
both big-delta cards — the two Full Weights at 0.16, over `NUDGE_BIG_DELTA` 0.15 — carry
**both** `failure` and `critical_failure`. All six `StepOutcome`s covered on both steps.
Recomputed after the swap; tables in the revised packet § 5.

The failures are also *cool*, which is the harder half. *"Force held them upright until the
last of it ran out, and then they folded"*; *"Every rider in the column saw a traveler
standing too straight for too long, and then not standing"* — the second is the detection
channel paying off in fiction, which almost nothing in the corpus does.

### 5g · Base-text independence

Verified line by line: all ten afterimages and both `narrativeTemplates` read correctly with
**no** card played. No nudge-specific payoff has leaked into base band text. Trigger 13 not
fired.

---

## 6 · The three judgment calls — independent rulings

### Call 1 — three library members dealing into both hands: **not forced. Option taken.**

The draft's defence is that six allocated types contain only five sphere-signed members, so
disjoint hands cannot clear four spheres each inside the budget. That arithmetic is right and
the conclusion does not follow, because **the golden exemplar disproves the premise
directly**: The Swollen Ford deals twelve cards across two steps in **twelve distinct types**
with **zero** repeated members, and it gets there by using types in step 2 that step 1 does
not have (Balm, Trait card, Fellowship). Disjointness is achievable; it is achievable only if
the type budget is a floor. It is.

So the question is not *can we* but *should we*, and the answer differs per repeat:

- **`card.boost.core` — genuinely forced. Keep.** It is the *only* ungated, sphere-less
  member in the entire library (`card.mercy.core` and `card.insurance.core` are both riders,
  and a second rider is illegal; `card.trait_card.core` is trait-gated; `card.boost.
  variation.patient` is unlock-gated). Both steps owe an ungated common. Nothing else can
  serve.
- **`card.heavy_hand.signature.force` — forced by two constraints meeting. Keep.**
  `SPHERE_SIGNATURES` gives `force` exactly one signing type, `heavy_hand`; and the batch
  design row obliges this encounter to carry `detectionDelta` **twice** (cost channels #1 of
  2, the THR-885 target with zero users). Detection pressure is heavy_hand's defining trade
  and belongs on no other type. Drop this card and either the sphere count or a brief target
  goes with it.
- **`card.stumble.signature.chaos` — not forced, and independently wrong. Replaced.**

The Stumble's second instance fails on grounds that have nothing to do with repetition. Step
2 is a `stone` endurance test: outlast an afternoon. The card's mechanism is *"You loosen the
ground under the one standing against them"* — but on step 2 there **is** no one standing
against them. The opposition is the column's length and the agent's own legs. The card's own
fragments prove it: they trip the serjeant's horse so the *tablet* goes in the mud and two
rows get skipped — which is step 1's business (the toll), transacted during step 2 (the
wait), and it moves nothing about whether the agent is still standing at the end. That is a
grounding failure under checklist Q13, and the draft half-sees it: its own note says a second
grant would be *"the card buying the same certainty twice"*.

**Replaced with `card.balm.signature.life` — "It Passes"** (essence 2, `forecastDelta` 0.10,
sphere `life`, `remove_condition` on `trait.condition.exhausted`). Three reasons, in order of
weight:

1. **It is the right card for a `stone` step.** The opposition here is the body, and Balm is
   the library's card that works on the body's starting state. The exemplar puts Balm in
   *its* second step for the same reason.
2. **It closes a loop the draft left dangling.** Step 1's `failureMetadata` mints
   `trait.condition.exhausted` and the draft's only consumer of it is an *aftermath*
   reaction, fired after everything is decided. The Balm makes step 1's cost a thing the god
   can pay off mid-encounter, which is what a two-step carryover encounter is for.
3. It removes a repeat, which is the third-best reason and the one I would not have acted on
   alone.

Sphere count holds at 4 (`order · force · life · spirit`); type count holds at 5; the sum is
unchanged at 0.51; band coverage recomputed and complete; the batch's `stumble` debut is
untouched, since it still deals in step 1.

**Does a repeated face read as impoverished?** Two of six, both structurally forced, reads as
*repertoire* — a member is a card the god holds, and holding it through both halves of one
afternoon is the model working. Three of six, with the third one off-theme, reads as a hand
being padded to a size. The line is where the repeat stops being explicable, and the encounter
is now on the right side of it — with the explanation written down, which is what makes the
difference legible to the next reader.

### Call 2 — `fellowship` as a one-off: **forced, correctly recorded, wrongly executed.**

Confirmed independently in source. `NUDGE_CARD_LIBRARY` is assembled from
`UNIVERSAL_CORE_TYPES` (boost, insurance, mercy, trait_card), `SPHERE_SIGNATURES` (twelve
spheres, fourteen pairs), `HUNGER_UNIQUE_CARDS` (twelve) and `VARIATION_MEMBERS` (six).
`fellowship` appears in none of them; nor do `side_bet` or `signature`. Three of twenty-one
types have zero members. A one-off is the only available shape, and the draft records it with
its reason, per the brief's rule. **The judgment is right.**

Two corrections to the execution:

- The face was not authored (§ 1e) — it is the exemplar's. Rewritten.
- The draft's § 14 calls this *"a library gap … worth a note to whoever owns library
  membership"*. It is more than a note: **the batch design's card-type allocation assigns
  `fellowship` to #1 and #4, `side_bet` to #6, and `signature` to #4, and claims the batch
  "reaches all 21 types"**. Three of those four assignments cannot set a `libraryCardId`, so
  the brief's whole reason for requiring one — *"so the tally, twilight harvest, and echo
  card finally receive data"* — is unreachable for them by construction. That is a finding
  against the **batch design**, not against this draft, and it is raised to Pass 3 in those
  terms so it reaches the right file.

### Call 3 — no `trait_card`, hook rides a `TraitVariant`: **satisfied. Trigger 12 not fired.**

The trait-hook step is not skipped: all four questions are answered explicitly, with reasons,
and "no hook" is a valid written answer under the spec. The variant is authored and its ref
is live — `trait.core.core_humility.vice` is built by `buildCoreTrait` from
`CORE_CONTINUA` in `src/types/coreRegistry.ts` (`core_humility`, virtue *Humble* / vice
*Proud*, governs self-regard), the same family as the exemplar's
`trait.core.core_integrity.virtue`. `validateTraitRefs()` will not report it dead.

The trait choice is also better than the draft argues, and the missing argument is in the
registry: `core_humility` carries `reachCouplings: [{ reach: 'iron', sign: 1 }]` — Humble
seeds *away* from Power-Hungry, so a **Proud** agent trends toward high `iron`. The variant is
coupled to the exact reach step 1 tests. Added to the revised packet.

The decision not to add a `trait_card` stands on its own terms and I would keep it even with
the budget read as a floor: a trait card at cost 0 in step 1 would make a seventh card in a
hand that is already at six with one gate, and the trait's surface — a factor line the holder
sees before rolling, paying off in the ending's recruiting criterion — is complete without
one.

---

## 7 · Player-as-god, and the agent as protagonist

**Player-as-god: clean.** No `authoredChoices`, no `poleLean`, no `branchOnStep`. No card
instructs the mortal: the god steadies a nerve, pours energy into a body, loosens ground
under an opponent, puts weight behind a stance, strips the middle out of the ladder, lifts
weariness, closes a company up, and sets a floor. In every case the mortal still stands or
does not and fate still rolls. No option picks between authored endings. Triggers 14 and 9b
not fired.

Worth noting on the positive side: the hand is not all physics. `force`, `chaos` and `life`
are physical; `order` (the floor), `spirit` (the company) and the sphere-less steadying are
not. THR-1178's warning — a twelve-sphere game authored in one sphere's vocabulary — does not
apply here.

**Agent as protagonist: passes, but step 2 was drifting.** Step 1 is unambiguous — the stylus
stops at *the agent's* row and the agent is the one refusing. Step 2 was the risk the
orchestrator flagged, and the draft's spine had started to spectate:

> *"The column is long: wagons, then a driven herd, then more wagons. The road belongs to it
> until the last axle is through, most of an afternoon away. The agent stays where they are,
> pack still on."*

Three sentences of parade, then the agent, passively, in fourth position. Nobody is a
bystander here — the test is genuinely theirs — but the paragraph puts the column in the
foreground and the agent in the background, which is how a war set-piece slides. Rewritten
to open on the agent, state the test in plain words (*"What is left to do is stand in it
until then"*), and close on the serjeant, which is what the carryover and the ending both
key off. Trigger 24 not fired; the drift is corrected before it becomes one.

---

## 8 · Consequences, chips and Law 56

### 8a · The membership chip — legitimate, and correctly banded

The gate defect the draft found is fixed centrally (`659962a9`): `CHIP_BACKING_EFFECT_KINDS`
now carries `membership_change` and `agent_relocation`, with the reasoning recorded in the
set itself. Read in source and confirmed.

**The chip is properly backed on the band that carries it**, which is the part that still
needed checking by hand. `membership_change` sits on step 2's `successMetadata`;
`isStepSuccess` counts `critical_success` as a success-side `StepOutcome`; step 2 is the
final step with `failBehavior: 'fail_action'`, so a `critical_success` **action** band
implies step 2 landed success-side and the write fires. It is not a neighbouring band's
write borrowed by a chip. The chip stays, unfolded, as instructed.

`chipBackingViolations` is a per-face floor and passes for every authored band. The per-chip
semantic verdicts, which no machine can make, are below.

### 8b · Every chip, band by band

| Band | Chip | Backing write | Fires on this band? | Anchor | Verdict |
|---|---|---|---|---|---|
| `critical_success` | BOON `iron capability` | `applyEncounterGrowth` at resolution | every band ✓ | stat: `reach.iron` + bearer | **anchor fixed** — see 8c |
| `critical_success` | PATH `a company membership` | step 2 `successMetadata` → `membership_change` `op:'join'` | success-side ✓ | `$faction:mercenary_company` 🔗 | ✓ |
| `critical_success` · `success` | BOON `standing with the company` | step 2 `successMetadata` → `reputation_with` +0.12 | success-side ✓ | `$faction:mercenary_company` 🔗 | ✓ |
| `success_at_cost` | BOND `a favour owed` | step 2 `successMetadata` → `favor_creation`, debtor `$cast:serjeant` | success-side ✓ | `$cast:serjeant` 🔗 | ✓ — and anchored on the **debtor**, which is the end of the edge the sentence is about. The Grateful Kin defect avoided |
| `failure` · `critical_failure` | SCAR `a wound` | step 2 `failureMetadata` → `apply_condition` wounded | failure-side ✓ | `trait.condition.wounded` 🔗 | ✓ |
| `critical_failure` | SCAR `standing with the company` | step 2 `failureMetadata` → `reputation_with` −0.10 | failure-side ✓ | `$faction:mercenary_company` 🔗 | **concepts fixed** — see 8c |

Sentinels verified legal against `chipAnchorDeclarations.ts`: `$actor`, `$cast:<key>` (key
declared in `supportBundle` ✓), `$faction:<defId>` (`mercenary_company` is in
`ALL_FACTION_DEFINITIONS` via `MERCENARY_COMPANY_DEFINITION` in `faction-definitions.ts` ✓),
and the attachment-template literal `trait.condition.wounded` — the one literal an author may
write, and the shape the exemplar's `exhaustion` concept uses ✓.

No chip is authored with `kind: 'reputation_tally'`, so Law 13's parity clause is clean.
Anchor-kind spread: `faction` ×3, `attachment` ×1, `agent` ×1, `stat` ×1 — the brief's *"avoid
defaulting to `individual` agents"* is honoured.

### 8c · Two anchor corrections applied

**The growth chip has no bearer.** The generated anchor catalog is unambiguous: *"A stat
anchor names the bearer **and** the stat: the bearer by `entityId`, the stat by `tooltipId`.
A stat sentence with no bearer is not anchored."* The draft declares `tooltipId` alone,
following the exemplar, and flags the tension for Pass 3. **This is an editorial call and I
am making it:** the catalog is generated from the live type unions and is current by
construction; the exemplar is one hand-written fixture. `entityId: '$actor'` added to the
concept. It is strictly additive and cannot make the chip worse.

**The `critical_failure` standing chip declares only the stat, while its `success` twin
declares stat *and* faction.** Same quantity, two different anchor shapes, one encounter. The
failure chip now mirrors the success chip's two-concept form.

The chip `detail`s were also rewritten under rule 0c — the draft's were good on `stateNoun`
(every one names the *mechanic*, not the fiction: *a favour owed*, *a company membership*, *a
wound*, *standing with the company* — this is the rule The Grateful Kin broke and the draft
gets it right) but three of them echoed their own overview or causeClause (§ 2).

### 8d · One prose claim with no write behind it — flagged, narrowed, not hidden

The draft asserts in three places that the column takes the agent's **pack**: the `failure`
overview, the `critical_failure` afterimage, and the design block's stake line. Nothing
writes it. There is no `rewardPool` failure draw, no `attachment` removal, no possession
effect anywhere in the packet — so a player who reads *"the column took the pack"* and opens
their sheet finds the pack.

This is not trigger 31 (that governs *base scene prose asserting agent history*) and it is
not a Law 56 violation (no chip claims it). It is the same family one surface over: outcome
prose narrating a loss the engine did not perform.

**Resolution applied:** the pack theft is confined to `critical_failure`, where the design
block explicitly declares it (*"a critical failure is a battering and a robbery"*), removed
from `failure` — which also fixes the § 3 contradiction — and the stake is restated in terms
the engine does write (the wound, the standing, the afternoon). Raised to Pass 3 with a
concrete option: `failureMetadata.rewardPool` is the documented equipment-loss channel, and
one there at `critical_failure` would make the sentence true. Not taken in this pass because
it spends a `possession`-family surface the batch assigns to encounter #3, and that is a
batch-level trade rather than an editorial one.

### 8e · The consequence draw

`consequenceDraw: ['secret', 'membership']`, matching the batch design's roll on the final
template id. Both wired **in context**, and the "in context" is real rather than bolted on:
the serjeant shuts the tablet early *in front of the whole line* and now has to answer for it
(→ `favor_creation`, the `secret` family's satisfier), and a company that hires fighters
recruits from people who did not move (→ `membership_change`). No `consequenceSwap` needed.
`check:encounter` re-derives the hand from the template id; the recorded pair is the design
doc's and is not an author's edit.

### 8f · Aftermath reactions

Two, on every band, and genuinely different stances — the body in front of the god versus
what the column says at the next halt. Both labels are interactive-plain and honest about
what the click does. Trigger 4 not fired; Experience questions 12 and 13 are YES.

One note carried to Pass 3: `toll.let_them_rest` lifts `exhausted`, which is minted only by a
step-1 failure, and the new Balm can lift it mid-encounter. On runs where neither applies the
reaction no-ops. The exemplar has the same shape (`ford.rest_the_body`), so this is precedent
rather than defect, but it is worth knowing the reaction is conditional in practice.

---

## 9 · Everything else, checked

| Check | Result |
|---|---|
| **Title glance test** (trigger 27) | ✓ *The Toll of Blades* — a toll, taken by armed people. Complication legible from the title alone |
| **Crux** (trigger 28) | ✓ One plain sentence, agent's POV: *"A war column has stopped across the agent's road and is taking what it needs from whoever passes."* |
| **Shape** (trigger 30) | ✓ `Danger–Confrontation–Aftermath`, 2 steps, from the catalog; step structure matches |
| **Envelope** (trigger 18) | ✓ Four classes declared, four openings written, `locationSubtypes` derived with `expandSettings`. Spine names no class scenery: *road · soldiers · spears · line · serjeant · tablet · stylus · verge · wagons · herd* all read at `wayside`, `ruin`, `battlefield` and `stronghold`. A war column reads at all four |
| **Cast class-honesty** | ✓ Verified against `LOCATION_ROLE_ROSTERS` and `SUBTYPE_TO_ROSTER_KEY` in source. `camp`/`fort` → `military_outpost` (quartermaster 0.9, mercenary 0.7); `castle` → `capital` (mercenary 0.6); `oasis`/`wilderness` → `wilderness` (neither — spawns); `ruin` subtypes → `null`; `battleground` → unmapped. Neither reuse role is single-class. `spawnName` is a real name, as a declared key always resolves |
| **`{cast:}` tokens declared** | ✓ Both instances name `serjeant`, which `supportBundle` declares |
| **No gendering** | ✓ Every sentence about the serjeant uses the role noun or restructures. One draft sentence needed re-reading (*"The serjeant went down, got up furious"*) and is clean |
| **Prose rule 7** (trigger 31) | ✓ Every fact the base prose asserts about the agent's connections is scene-local. No errand, no destination, no prior standing, no debt. All three history-shaped facts — the favour, the membership, the standing — are *writes* minted here. The one read is the trait gate, which surfaces as its factor line |
| **Systems quota** | ✓ 4 from the authored manifest: `cast`, `reputation`, `conditions`, `rewards`. Floor 3 |
| **Images** | ✓ All eight tags verified live in `ENCOUNTER_IMAGE_LIBRARY`; `generic.warmth` (life · warmth) added for the Balm. No `illustrationUrl` |
| **Concept art** (trigger 6) | ✓ Present, two-question method, and genuinely evocative rather than illustrative — an open wax tablet on a milestone with one line left blank and wheel-ruts running out of frame. Residue, no figures, no fight. This is the best art direction the line has produced |
| **Type composition across the family** (trigger 21) | ✓ No other border-perils row carries this composition |
| **Aftermath `byOutcome` floor** | ✓ 5 authored against a floor of 3. `UnifiedActionOutcome` has seven members and the two unauthored ones are `contested_won`/`contested_lost`, which a non-contested template never returns — verified in `src/types/unifiedAction.ts` |

---

## 10 · Experience Differentiator Gate — all 14, answered independently

| # | Question | Answer |
|---|---|---|
| 1 | Opening inside a moment already in motion? | **YES** — every class opens on a halt already made. Nobody is briefed |
| 2 | Prose has its own voice? | **YES** — long inventory sentences for the column's work, short flat ones for the toll, dry closers that do not editorialize. After the § 1c fixes, subject-first throughout |
| 3 | Scene names elements that become choices? | **YES** — grounded spears (Full Weight), churned verge (Something Gives Way), the queue and the agent's company (both Fellowships), the body (the Boosts, the Balm), the tablet and the row (what the hand plays for) |
| 4 | Reader feels something from prose alone? | **YES** — the tablet does it |
| 4b | No seam echoes? | **YES, after revision.** **NO in the draft** — ten fired, § 2 |
| 5 | Card faces library-generic, zero scene-bespoke prose? | **YES** — ten faces verbatim from `CARD_CONTENT`, two one-offs written to the bar (after § 1e) |
| 6 | Effect lines state mechanism; every price real? | **YES, after revision.** **NO in the draft** — No Middle Ground, § 5a. Prices: essence on ten, detection on both Heavy Hands, the group on both Fellowships, the milestone on The Slow Push. No card is free |
| 7 | Every card pays off in failure? | **YES** — 12/12, and both big-delta cards carry both failure bands |
| 8 | Hand grounded? | **YES, after revision.** The step-2 Stumble was not (§ 6, call 1) |
| 9 | Cards answer different questions? | **YES** — tabulated per hand in the revised packet |
| 9b | Full authored hand per nudge-bearing step; no step picks a branch or ending? | **YES** — 6 and 6, no fork |
| 10 | Aftermath has reflective prose? | **YES** — five band overviews plus a fallback |
| 11 | Outcomes actor-centered, with names and faces? | **YES** — the serjeant owes; the company writes a name; the agent carries a wound and a standing |
| 12 | Medium+: reaction choices? | **YES** — two, on every band |
| 13 | Reaction choices are philosophical stances? | **YES** — person versus story |
| 14 | Art direction two-question, evocative not illustrative? | **YES** |

**Three NOs against the draft** (4b, 6, 8). All three cleared in the revised packet.

---

## 11 · REVISE triggers fired against the draft — six

| # | Trigger | Where |
|---|---|---|
| **15** | Detector hit | `way` in `toll.an_easy_row.detail`, an `outcome`-class field (§ 4) |
| **17** | Effect line states shape, not mechanism | `No Middle Ground` (§ 5a) |
| **22** | Seam echo | **Nineteen**, across seven seam classes the draft's own table did not check — twelve of them inside a single ending, where the base band text, the card fragments, the overview and the chips land on the player together (§ 2) |
| **25** | Announced mechanics in scene prose | The initiation's conditional imperatives (§ 1d) — mild instance |
| **26** | Design-block breach | *"The picket"* named in two carryover lines and in § 4's prose claim, present in no prose; and a carryover line asserting an injury its band never described (§ 3) |
| **29** | Unreadable compression | *"ground a battle already used"* (§ 1b) |

**Not fired, checked:** 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 16, 18, 19, 20, 21,
23, 24, 27, 28, 30, 31.

---

## 12 · Verdict

Every one of the six is a defect in a *sentence, a card instance, or a field*, and Pass 2's
brief is to fix exactly that class inline. None is structural: the shape is from the catalog,
every Composition Contract block is present and passing, the hands clear every guardrail, the
design block is honest, and the encounter's central idea — a toll taken by people who keep
books about it, and a god whose only lever is the odds on a traveler staying put — is strong
enough to be worth this much correction. `REVISE BEFORE CONTINUING` is reserved for a draft
Pass 2 cannot repair by editing; this is not one, and stopping the line here would be
ceremony rather than quality control.

The revised packet carries every fix applied inline and is complete and self-contained for
Pass 3.

**Most serious change:** the step-2 Stumble. Everything else on this list is a sentence. That
card was ungrounded in the step it was dealt into — a "weaken the opposition" card in a test
whose opposition is an afternoon and a pair of legs — and it was dealt there to satisfy a
sphere count, which is the failure mode the whole hand-building section exists to prevent.
Replacing it with a Balm that lifts the exhaustion step 1 itself mints turns a padded slot
into the encounter's carryover made playable.

---

## 13 · Revision summary

**Must fix — applied**

1. Nineteen seam echoes across `opening→initiation`, `initiation→spine`, `base band
   text→fragment`, `fragment→fragment`, `band→overview`, `overview→chip`, `chip→chip` and
   `narrativeTemplates.*` (§ 2). The full seam enumeration for this encounter — every one
   checked by name — is § 2b.
2. `failure` overview contradicting the step-2 `failure` afterimage (§ 3).
3. *"The picket"* — an object named on a panel surface that exists in no prose; and a
   carryover line asserting an injury its band never described (§ 3).
4. `way` in an `outcome`-class chip detail (§ 4).
5. `No Middle Ground`'s effect line, which named no divine act (§ 5a).
6. `Shoulder To Shoulder`'s quote, lifted verbatim from the exemplar (§ 1e); and `By The
   Book`'s effect line, near-verbatim from the same source (§ 5b).
7. Step 2's Stumble → Balm (§ 6, call 1).
8. Doubled nouns in all four openings; the two-reading sentence in `battlefield`; three
   participial fragment openers (§ 1a–1c).
9. Growth-chip bearer `entityId`; `critical_failure` standing chip concepts (§ 8c).
10. The pack theft narrowed to the band that declares it (§ 8d).
11. The draft's field-class map corrected (§ 4).

**Should fix — applied**

12. Step-2 spine rewritten to put the agent in the foreground (§ 7).
13. Two cards using the same construction in the same band, twice (§ 1f).
14. The gambit's vague `critical_failure` fragment (§ 1g).
15. The `near_miss` carryover line, which declared a polarity and moved nothing — given
     `forecastDelta: -0.02`.
16. Step-2's ungated-common count corrected from 2 to 1 (§ 5c).
17. The trait's `iron` reach coupling added to the variant's rationale (§ 6, call 3).

**Consider — raised to Pass 3, not applied**

18. `failureMetadata.rewardPool` at `critical_failure` would make the pack sentence true;
     costs a `possession`-family surface the batch assigns to #3 (§ 8d).
19. **Against the batch design, not this draft:** the card-type allocation assigns
     `fellowship`, `side_bet` and `signature` — three types with zero library members — and
     claims the batch "reaches all 21 types" while requiring `libraryCardId` for tally data.
     Four allocations in three encounters cannot comply (§ 6, call 2).
20. `crudType: 'update'` — confirm `reputationPolarity` infers positive, else set it
     explicitly.
21. `plotHooks.ts` `usedBy` stamp for `stronghold_mobilization` at closeout.
22. **For the `CARD_CONTENT` owner, not for this encounter:** `card.stumble.signature.chaos`
     is titled *"Something Gives Way"*, and `something` is on the **evasive** lexicon, which
     is enforced in every class. Every hand that deals the library's Stumble inherits one
     evasive hit it cannot author away. One hit against a 2.0/100w density gate fails
     nothing, and library content is out of scope for this batch — but the corpus is about
     to start dealing this card, so the face is worth a look before it is in twenty hands.

PASS WITH REVISIONS
