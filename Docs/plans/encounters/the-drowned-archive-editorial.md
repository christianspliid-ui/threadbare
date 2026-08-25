# Encounter Pipeline: The Drowned Archive

> Scale: medium (3 steps) | Slug: `the-drowned-archive` | Pass: **2 (editorial + revision)**
> Batch: **deep-places** (slot 2 of 2) · Template id: `encounter.delve.the_drowned_archive`
> Date: 2026-08-25 | Pipeline version: 3 (Encounter Factory)
> Reviewer: fresh-context critique agent (did not draft this encounter)
> Verdict: **PASS WITH REVISIONS** — revised packet at `Docs/plans/encounters/the-drowned-archive-revised.md`

---

## 0. How this review was conducted

Read in the mandated order: the editorial prompt, the authoring spec in full (Doctrine v2 is
current; the retired-by-name rules were **not** enforced), SKILL.md's 31 automatic REVISE
triggers, the anchor catalog, the batch brief, and the director-approved calibration case
(`src/data/encounters/the-unclaimed-relic.ts`).

Every id claim in the draft's § 16 was re-verified against live source rather than trusted.
**All of them hold** — `trait.core.core_integrity.virtue`, the four person-conditions, the
location condition `trait.condition.location.under_watch`, `reward_tools_instruments_scroll_case`,
`acolyte`/`monk`/`chaplain` at `shrine`/`temple` in `LOCATION_ROLE_ROSTERS`, `scribe` in the
NPC role union, and all thirteen `libraryCardId`s. `intelligence` is a member of
`CHIP_BACKING_EFFECT_KINDS` (`compositionContract.ts:199`). `growth`, `trait` and `shell_state`
are all live `EncounterAftermathChangeKind` members. This is an unusually well-sourced draft and
the review found nothing invented.

Three code facts the draft did **not** record, and which change two of its arguments:

| Fact | Source | Consequence |
|---|---|---|
| `card.whisper.attunement.light` is gated `sphere_attunement / light / **threshold 60**` | `nudge-card-library.ts:508` | It is the **only** member in the library at the second attunement mark. The draft's compensating lever for the handless step reaches almost no god. See finding 1. |
| `card.mercy.variation.witnessed` is gated on `god_trait: 'god.merciful'`, which **does not exist yet** | `nudge-card-library.ts:469` + its comment | Not dealable. Relevant to whether a third hand could be built. |
| Slot 1 renames **all seven** of its step-0 cards away from their library titles, not two | `CARD_CONTENT`, `nudge-card-library.ts:570-728` | The draft's § 17 finding 1 undercounts by five. See finding 16. |

---

## 1. Rulings on the three known issues handed to this pass

### Ruling A — the handless step 1: **a hole, not a designed choice.** Not fixable at this pass.

**The draft's argument fails on its merits.** § 7 says a hand on an Eye gate "would let the god
buy the clue, and an information prize that can be purchased is not a prize — it is a price."
That is not what a card does. The model's first line is *"It shifts the odds. **Fate still picks
the outcome.**"* A nudge on an Eye gate buys no more certainty than a nudge on a Stone gate buys
the relic in the calibration case, or than slot 1's Insurance buys the coffer. If the argument
held, no nudge-bearing step could ever have a prize, and every shipped encounter would be in
breach.

**Its compensating lever is measurably weak.** § 7's second consequence rests the whole design on
`card.whisper.attunement.light` and `reveals: 'next_step_demand'`. That member sits behind
`threshold: 60` — the library's single highest gate, and the only member at the second attunement
mark. A god who has not worked 60 lifetime essence through `light` never sees it. Worse, what it
reveals is *the step the player is about to sit out*: it tells them the demand of a test they
cannot touch.

**The program ruling in the prompt is the right frame.** "Playing nothing is always viable but a
hand is an offer." A three-step encounter with two hands is a third of its interaction surface
gone, and the player is made to watch the beat the encounter's own title is about.

**But the hand cannot be built inside this batch's card budget, and I checked exhaustively.**
A hand needs ≥4 distinct spheres and ≥1 ungated sphere-less common option. After slot 1's hand and
slot 2's two hands:

- **Every universal-core member is spent.** `card.boost.core` and `card.insurance.core` by slot 1;
  `card.mercy.core` by slot 2 step 0 (over-exposure cap ≤1 across the batch); `card.trait_card.core`
  by slot 2 step 2, and it is trait-gated in any case. There is **no ungated sphere-less member
  left in the library**. The two sphere-less variation members (`card.boost.variation.patient`,
  `card.insurance.variation.shared`) are milestone-gated on `divine.rekindle_thread`, so neither
  is "ungated"; `card.mercy.variation.witnessed` is not dealable at all.
- **Only one fresh signature sphere remains: `order`.** `life`, `force`, `spirit`, `mind` and
  `light` signatures are spent by slot 1; `energy` is banned by the brief; `darkness`, `chaos`,
  `matter`, `time` and `entropy` are spent by slot 2's own two hands. Four distinct spheres cannot
  be assembled.
- **Splitting step 0's seven cards does not work either** — it holds exactly four sphere-keyed
  cards, so any split leaves at least one hand under the sphere floor.

Building a third hand would therefore require breaking an over-exposure cap or authoring four or
five one-off cards, which is worse than no hand and would breach REVISE trigger 21's spirit.

**Disposition.** The revised packet does three things and does not pretend to a fourth:

1. **Strikes the justification.** § 7 no longer argues that an information gate must be unbuyable.
   It states the real reason — a three-step shape was briefed against a card budget that cannot
   fund three hands — and names it as the encounter's known weak point.
2. **Strikes the Whisper-compensation claim** and replaces it with the honest reading of what that
   card is for here: it tells the god *how hard to push on step 0*, because step 0's band is the
   only lever anyone has on step 1. That reframing is true, is not gated behind an argument, and
   makes step 0's hand the place where step 1 is played.
3. **Names step 1's actual authored variance surfaces** — the six-row carryover map and the trait
   variant's `factorLine` (*"Being True, they will not read it to suit anyone"*, which is a
   reading line and so is step 1's line). These are real and they are what the player reads on
   that step; they are not a substitute for a hand and the revised text does not claim they are.
4. **Files it as the batch's headline finding** (finding 15) — the constraint lives in the brief
   and the library, not in this draft, and that is where the fix belongs.

**On editorial-prompt trigger 7** (*"Missing per-step approach cards. Any player-facing step lacks
authored approach cards. The runtime shows choices at EVERY step — generic fallback destroys
authored quality"*): this is the pre-nudge formulation and its stated harm cannot occur. The
fail-soft contract is explicit — *"A step with no `nudges` resolves exactly as it did before the
schema landed"* — so there is no generic fallback hand to destroy anything. The spec wins over the
older formulation (spec § opening: *"If the two skills ever appear to disagree about a rule below,
this file wins"*), the Composition Contract requires **at least one** nudge-bearing step, and
Experience Gate Q9b is scoped to *nudge-bearing* steps. The trigger does not fire. Recording this
reasoning explicitly so the ruling is auditable rather than convenient.

### Ruling B — the `side_bet` one-off: **correct, and it should also become a library proposal.**

Verified: `side_bet` is a declared library **type** — `nudge-card-library.ts:128`, `keyword:
'Side-bet'`, `effectShape: 'Modest boost + a worldly extra, win or lose'`, `hostSystem: 'Per-card
aftermath'`, `status: 'impl'` — with **zero members**. The brief blesses this exactly:
*"The `side_bet` and `fellowship` types have no library member at all — a one-off is legal there
and worth doing once."*

So shipping it with **no `libraryCardId`** is right today, and is the only correct choice: naming a
member that does not exist is the THR-844 rot class. The card also honours its type's printed
shape precisely — `forecastDelta: 0.05` is the modest boost, the `intelligence` grant is the
worldly extra, and grants fire per committed card after the step resolves, so "win or lose" is
literally true rather than aspirational.

Two corrections carried into the revised packet:

- The face was **not** fully generic as drafted — *"a true name kept from this place"* only reads
  in a scene where a name is the thing to be got. Rewritten (finding 9).
- The draft's proposed member id `card.side_bet.core` presumes `side_bet` is in
  `UNIVERSAL_CORE_TYPES`. It may not be; the honest proposal names the gap and lets the library
  ticket pick the shape. Softened in § 17.

### Ruling C — the declared prose near-miss: **a real finding, but not the one the draft declared.**

The draft's § 17 finding 6 flags *"sent two men down for the rest, and both came back"* and asks
whether a count of people who have paid a cost lands as cost or as texture. On its own terms it
lands as cost, and the calibration opening's *"already sent three guards to the infirmary"* is the
same shape. The draft is right about its own sentence.

**It is wrong about which defect that sentence carries.** Slot 1's P2 already spends the identical
beat:

> Slot 1: *"Two of them went below yesterday and one came back."*
> Slot 2: *"{cast:keeper} sent two men down for the rest, and both came back saying a warden sits
> in the dark below."*

Two encounters in one batch, in the same P2 sentence position, both counting people who went down
and came back. That is a cross-slot seam echo — precisely the class a self-audit structurally
cannot see, and precisely what this pass exists for. Fixed on slot 2's side (finding 3), which
retires the declared near-miss as a side effect: the revised P2 carries no count at all.

---

## 2. Findings

Numbered, each with the quoted text, the rule it breaks, and the fix applied in the revised file.

### Prose and echo findings

**Finding 1 — the batch's three `ruin` and `arcane` openings share their construction.**
Rule: REVISE trigger 22 (seam echo), Experience Gate Q4b.

> Slot 1 `ruin`: `{name} comes to the ruins of {location} with half a day of light left.`
> Slot 2 `ruin`: `{name} comes in out of the rain at the ruins of {location}.`

Same verb, same frame, same class — a player who draws both encounters at a ruin reads nearly the
same first sentence. Slot 2's `arcane` opening additionally borrows slot 1's `sacred` verb
(*stops at the tower of* / *stops at the sanctuary of*). The draft's own echo check waves this
through on the grounds that one lands on the hour and the other on the weather; that is the
*content* differing while the *construction* does not, which is the exact failure the check names.

**Fix.** All three P1s rewritten so no verb in slot 2 appears in slot 1 at any class, and no two of
slot 2's own three share a root:

```ts
openings: {
  ruin:   '{name} gets out of the rain at the ruins of {location}.',
  arcane: '{name} waits out the storm at the tower of {location}.',
  sacred: '{name} takes shelter from the rain at the sanctuary of {location}.',
}
```

Verbs across the batch: *comes to / arrives at / stops at* (slot 1) vs *gets out of / waits out /
takes shelter* (slot 2). Zero overlap.

**Finding 2 — P2's third sentence duplicates slot 1's P2 beat.** (See Ruling C.) Rule: trigger 22.

**Finding 3 — P2 rewritten.** Combined fix for findings 2 and Ruling C, and it strengthens two
other things at no cost.

> **Was:** `There {they} find the record vault under water. A page floated up this morning: the
> founding families never owned this ground. {cast:keeper} sent two men down for the rest, and
> both came back saying a warden sits in the dark below.`

> **Now:** `There {they} find the record vault under water. A page floated up this morning: the
> founding families never owned this ground. {cast:keeper} went down as far as the water and
> turned back. A warden sits in the dark below.`

Three gains beyond the echo fix: (a) the cost already paid is now the **keeper's own** failed
attempt, which is more concrete than a report about two unnamed men and is carried by the one
person the encounter has cast; (b) the warden is **stated as a fact** rather than encoded as
hearsay, which is Doctrine v2's rule zero half ("state facts, never encode them") and the
"foreshadow-never-announce" reversal; (c) it removes the last count from the encounter, so the
declared near-miss is gone rather than defended. Word budget: 11 + 39 + 20 = **70**, was 74.

Downstream: the design block's promise row, § 5's token-placement note, and the checklist answers
about "the two men" are all updated in the revised file.

**Finding 4 — step 0's `success` and `success_at_cost` afterimages open with the same three
words, and `success_at_cost` echoes slot 1's.** Rule: trigger 22.

> Slot 2 `success`: `They got down. The water carried the noise…`
> Slot 2 `success_at_cost`: `They got down, and left their lamp and half a pack in the water behind them.`
> Slot 1 `success_at_cost`: `They reached the bottom, and left a coil of rope and half a lamp of oil behind them.`

Two afterimages in one step opening identically, and the cost-band afterimage shares *left … behind
them* and *half a \<gear noun>* with slot 1's cost-band afterimage in the same slot of the ladder.
The draft's self-audit asserts "No two share a verb or a shape"; they do.

Also: *"The water carried the noise"* is ambiguous on a read-aloud — carried it toward the warden,
or away?

**Fix.**
- `success`: `They got down. The noise carried, and the warden looked up once.`
- `success_at_cost`: `Their lamp and most of their kit went into the water on the way down.`

**Finding 5 — three sentences I stumble on, each named with its job.**

| Sentence | Where | Why I stumble | Its job | Fix |
|---|---|---|---|---|
| `They fell the last of the stair into black water and came up loud and seen.` | step 0 `critical_failure` afterimage | *fell the last of the stair* is ungrammatical; and *gave* in slot 1's parallel band makes the pair rhyme | say the entry was catastrophic and witnessed | `They went off the last of the stair into black water and came up loud and seen.` |
| `Bring the rest of the records up before the water does.` | `narrativeTemplates.initiation` | *before the water does* reads as "before the water brings them up", which is nonsense — the water destroys them | state the ask and the clock in one clause | `Bring the rest of the records up before the water takes them.` |
| `The charter box is on that shelf` | step 1 spine | *that shelf* has two candidate antecedents in the preceding sentence — the ledge and "the last of them" | put the prize on a named shelf the water is already reaching | `The charter box is on that last shelf` |

**Finding 6 — `narrativeTemplates.failure` repeats *still* inside one sentence.**

> Was: `The water is still rising and the shelves are still down there.`
> Now: `The water is still rising, and the shelves are where they were.`

**Finding 7 — a participial opener, which Doctrine v2 names as the residue tell of the old mode.**

> `Knowing the room before entering it, they never put a foot wrong.` (Read The Whole Shape,
> `critical_success` fragment)

Rule: Doctrine v2 § calibration exemplar, correction 1 — *"writerly participles ('working up a
second try') read as literary even when every fact is stated."*
**Fix:** `They knew the room before they entered it, and never put a foot wrong.`

**Finding 8 — a Whisper failure fragment echoes slot 1's Whisper failure fragment.**

> Slot 1: `They knew exactly what was coming and still could not find a line down to meet it.`
> Slot 2: `They knew exactly where everything stood and were heard anyway.`

Same card type, same band, same opening four words, in one batch.
**Fix:** `They had the whole layout and were heard anyway.`

**Finding 9 — three card faces are not library-generic.** Rule: REVISE trigger 16 (scene-bespoke
prose on a card face); the pivot's *"the same face reads correctly in any encounter its type deals
into"*.

| Card | Offending text | Why it fails | Fix |
|---|---|---|---|
| Offer The Easier Way | `Fill them with the urge to give an **answer that will do**.` | Only reads where someone is being questioned. `card.undertow.signature.darkness` is dealt across the corpus. | `Fill them with the pull toward what is quick and good enough. It works, and it stays with them.` |
| Send A Dream | `**Buried places** pull at them for a while.` | Binds the face to this encounter's own subject. The mechanic is an `explore` bias, not a buried-place bias. | `An urge arrives in their sleep and stays. For a while they will go looking.` |
| Salvage One Fact | `a **true name** kept from this place` | Same failure as the Undertow: only reads in a name-getting scene. The grant is an intelligence record generally. | `A steady hand now, and a piece of the truth kept win or lose.` |
| Draw On Character | `No essence. **Being True**, they speak a name they can stand behind.` | Hard-codes one trait pole onto `card.trait_card.core`, which every trait-variant encounter deals. Also duplicates the cost row. | `What they already are carries them through. Nothing is spent to make it so.` |

All four fixes were re-checked against the name-word-repetition rule (Doctrine v2 correction 2): no
effect line repeats a content word from its own card's name.

**Finding 10 — two effect lines carry magnitude the pip row already renders.**

> `Steady them **a little**.` (Read The Pattern) — the pip row is the magnitude surface; a card
> face that also editorialises its own size is odds-talk in words. **Fix:** `Steady their hand.`

The parallel case is `Pay It Elsewhere`'s *"No essence spent"*, which I am **keeping**: for the
Bargain, "the price is paid on another channel" is the type's whole mechanism, not a comment on
size. The Trait card's `No essence.` was pure cost-row duplication and is gone with finding 9.

**Finding 11 — one effect line reads as a rules footnote rather than a spell, and one is
ambiguous.**

> `The ground turns against whoever would stop them, and **gives first**.` (Loosen Their Footing)
> — *gives first* is genuinely ambiguous. **Fix:** `…and gives way under them.`

> `It went badly and stopped there. **The floor under the outcome held.**` (Spare The Worst,
> `failure` fragment) — *the outcome* is engine vocabulary appearing in outcome prose.
> **Fix:** `It went badly and stopped there, and no worse thing came of it.`

**Finding 12 — four outcome-class strings that would fail or nearly fail the detectors.**

`countVagueness` enforces natural indefinites at zero in the `outcome` class (afterimages, band
fragments, aftermath overviews, `narrativeTemplates.success`/`.failure`).

| String | Class | Term | Fix |
|---|---|---|---|
| `…they came up the stair with empty hands.` (step 2 `critical_failure` afterimage) | outcome | not a lexicon hit, but *empty hands* is verbatim slot 1's `failure` afterimage tail | `…and they came up the stair with the charter still down there.` |
| `The cost was booked and **the ending down there** did not change.` (Pay It Elsewhere, `failure`) | outcome | *the ending down there* collides with "the world's ending" two clauses earlier and reads as a second ending | `The cost was booked against the world, and the vault gave up no more for it.` |
| `**The lean** was there and it stopped short.` (Read The Pattern, `near_miss`) | outcome | *the lean* is engine vocabulary (`poleLean` / forecast lean) surfacing as fiction | `It leaned their way and then stopped short.` |
| `Nobody upstairs could say who helped, only that **the door** gave quietly.` (Clear The Traces, `success`) | outcome | there is no door anywhere in this encounter's prose — the entry is a stair (checklist Q8: nothing referred to before it is introduced) | `Nobody upstairs could say who helped them down.` |

**Finding 13 — a carryover line names a thing the prose never introduces.**

> `They saved the charter and lost **the shelf list** with it.` (step 2, keyed on step 1
> `success_at_cost`)

*The shelf list* appears nowhere else in the encounter. Checklist Q8.
**Fix:** `They have the charter and not the rest of the shelf.` (10 words.)

Same section, one read-aloud stumble: step 1's `near_miss` carryover *"The noise of the entry is
still moving in the water"* is in-situ writing (the sound modelled as a physical thing travelling)
rather than a narrator's report. **Fix:** `The noise they made on the stair has not settled yet.`

**Finding 14 — the two `critical_failure` afterimages are the same image.**

> Step 1: `The shelf tipped and the box went into the water at their feet.`
> Step 2: `The shelf went over into the water, and they came up the stair with empty hands.`

The encounter's terminal loss is *the shelf goes into the water*, and it belongs to step 2, where
the chips are built on it. Step 1's `critical_failure` is explicitly documented as leaving the box
**recoverable**, so spending the same image there both echoes and contradicts.
**Fix, step 1:** `They could not get the lid up, and the box went back down where they found it.`
Consistent with step 2's carryover for that band (*"The box is in the water and they have no
name"*) and with the recoverability note.

**Finding 15 — all five aftermath reaction labels have the identical construction, and so do
slot 1's.** Rule: trigger 22 (repeated sentence shape).

> Slot 2: *Let it be read at the door · Let the town hold it · Let the mark stand · Let them talk
> it over · Let the loss land*
> Slot 1: *Let them open it here · Let the stair stand open · Let them carry the hurt out with it ·
> Let the failure sit with them · Let them shut it*

Ten labels in one batch beginning with the same word and the same imperative frame. This is not a
house convention — the shipped corpus varies freely (`Say the name`, `Walk on quiet`, `Carry it
back to the company`, `Keep the forge-master close`, `Name the buyer to the company`).

**Fix.** Slot 2's five relabelled, each keeping its stance and taking a distinct verb:

| Band | Was | Now | Stance (unchanged) |
|---|---|---|---|
| `critical_success` | Let it be read at the door | **Read it aloud at the door** | the truth becomes everyone's |
| `success` | Let the town hold it | **Leave it in the keeper's hands** | the record stays with the office that kept it |
| `success_at_cost` | Let the mark stand | **Take the mark and say nothing** | the price is not argued with |
| `failure` | Let them talk it over | **Sit down and hear what they read** | the loss is shared |
| `critical_failure` | Let the loss land | **Tell the keeper plainly** | nothing is softened |

Reaction ids renamed to match. Slot 1 should do the same on its side; filed in § 3.

**Finding 16 — the `success` overview posts a watcher before the encounter happened.**

> `Since this morning there has been a watcher at the vault door.`

The page floated up *this morning*; the encounter runs after it. A watch that has stood since this
morning predates the outcome that supposedly caused it — and the chip claims the
`condition_attachment` this sentence is reporting.
**Fix:** `There is a watcher at the vault door now.`

**Finding 17 — the `critical_success` overview's second clause has an ambiguous referent.**

> `…held this ground on another house's grant, and **the grant says where it was filed**.`

Reads as "the grant says where the grant was filed". The design (§ 1 row 5) means *where the older
grant was filed* — the thing the `spawn_clue` points at.
**Fix:** `…and the charter names where that grant was filed.` This also makes the `spawn_clue`'s
referent legible in prose, which the anchor catalog's seed/clue clarification wants.

**Finding 18 — *mark* three times in three sentences.**

> `{actor} got the charter out. The warden marked them for taking it, and **the mark** has not
> faded. {cast:keeper} has the charter and will not say what **the mark** is.`

**Fix:** `{actor} got the charter out and the warden set a price on it. The mark it left has not
faded, and {cast:keeper} will not say what it means.`

**Finding 19 — the `critical_failure` overview asserts a settlement the envelope may not have.**

> `{cast:keeper} has lost **the town's** whole record and is grieving it.`

The envelope expands to five `ruin` subtypes plus `tower`, none of which is a settlement. This is
the encounter's only use of *town* and the only place the setting-neutral spine's discipline leaks.
**Fix:** `{cast:keeper} has lost the whole record of {location} and is grieving it.` The chip's
`detail` on that band already says *"The records of {location} are gone"*, so the two now agree.

### Design-conformance findings

**Finding 20 — step 2's prose does not test `veil`.** Rule: REVISE trigger 26 (*"a step whose
prose does not test its declared reach"*); spec checklist step 1 question 2.

> `It wants the name of whoever the records were left with, and it will hear one answer.`

As written, step 2 asks the agent to **say a fact they already have** — which is the thing step 1's
Eye gate just tested, and which reads as `heart` (talking a stranger round) or nerve. Nothing on
the page makes it supernatural perception or rite, which is what `veil` is. The design block claims
the reach; the prose does not deliver it, and the carryover map quietly admits it (every line is
about whether they *know a name*).

**Fix — one clause, which fixes the reach and tightens the chain:**

> `The warden stands between the stair and the water now. It has harmed no one and it has let
> nothing out. It wants the name of whoever the records were left with, **spoken as the record
> spells it**. It will hear one answer.`

Now the test is perceiving and performing the form a thing with its own law requires — Veil — and
step 1's reading is the thing that supplies the form, which is exactly what the carryover map
already rewards (*"They read every name on the charter and can use one"*). The `honesty_cunning`
axis survives intact: the Undertow's made-up name still fails against something that knows the
spelling, and the trait card's `failure` fragment (*"They told it the truth. The truth was not what
it was waiting for"*) now reads better than before, not worse.

**Finding 21 — `revelation_discretion` is declared and never touched.** Rule: trigger 26 (*"a
declared mechanic or object the prose never uses"*).

`motivations: ['revelation_discretion', 'honesty_cunning']`, and § 1 row 6 says the scene tilts
both axes. `honesty_cunning` has a real carrier — the Undertow's `valueDrift`. `revelation_discretion`
has **none**: no card leans it, no drift writes it, no fork reads it. It is a declared axis with no
mechanism.

**Fix.** Two cards already sit on that axis in fiction and were simply not wired:

```ts
// step 0, card 1 — Clear The Traces (leave no mark)
valueDrift: { axis: 'revelation_discretion', toward: 'negative' },   // Sentinel pole

// step 2, card 6 — Light The Deed (do it openly, be seen)
valueDrift: { axis: 'revelation_discretion', toward: 'positive' },   // Seeker pole
```

Polarity checked against `src/types/agent.ts:59` — `revelation_discretion: { positive: 'Seeker',
negative: 'Sentinel' }`. This is the minimal fix, it uses a field the encounter already uses
elsewhere, and it gives the encounter's two axes a matched pair each: the Veil and the Heavy Hand
are the same inverse on `revelation_discretion` that they already are on the detection channel,
which is a genuinely elegant result the draft was one field away from.

**Finding 22 — the planted seed is invisible on the band that plants it.** Rule: Consequences
rule 0b's seed clarification (*"A seed anchors through its carrier… and must be named in the
sentence"*), plus the draft's own claim.

The `failure` band plants an `encounter_seed` and leaves it unchipped — which is the right call,
because the seed's carrier is `$actor` and chipping it would spend a second `individual` anchor
past the brief's ceiling of one. The draft defends this by saying the seed is "named in the
overview". **It is not** — read the `failure` overview: nothing in it mentions coming back.

**Fix.** One sentence added to the `failure` overview, carrying the `seedLabel`'s content as prose:
`The water drops in the dry season, and the shelf will still be there.` Overview lands at 56 words,
inside the 60-word band budget. The seed stays unchipped and is now visible.

**Finding 23 — the clock is stated but its mechanical home is never named.**

The prompt asks specifically whether the rolled `threat` shape's clock is real or prose-only. P3
states it correctly and unambiguously (*"The water is rising. By dark it will be over the shelves,
and the rest of the record is gone"*), so the die is honoured. Its mechanical realization is real
but **undocumented**, and an undocumented mechanic reads as decoration:

1. **The water advances across the three step spines** — step 0's is the rising vault, step 1's is
   *"the water is at the bottom of it"*, step 2's is *"between the stair and the water"*. That is
   the clock rendered beat by beat, and it is the strongest thing the encounter does with the die.
2. **`failBehavior: 'continue_weakened'` on both early steps** means ground lost compounds forward
   — mechanically, that *is* what "running out of time" means here, and the twelve carryover lines
   are its readout.
3. **The `critical_failure` band destroys the record**, so the clock's stated terminal consequence
   is on the ladder rather than only in P3.

What is **not** modelled: nothing ties the water level to elapsed ticks or step duration, so a slow
run pays no specific penalty for slowness. That is engine work, not authoring work.
**Fix:** stated in § 1 row 5 and § 13 of the revised packet, so a reader can see where the clock
lives instead of taking P3's word for it.

**Finding 24 — a bracket that miscounts its own hand.**

> `### Step 0 hand — 7 cards (five dealt to a god with neither the trait nor deep light practice)`

Step 0 carries no trait card. The five-of-seven figure comes from the two attunement gates
(`card.veil.attunement.darkness`, threshold 20; `card.whisper.attunement.light`, threshold 60).
**Fix:** `(five dealt to a god with no darkness or light attunement)`.

**Finding 25 — three consecutive bands ship the identical chip title and state noun.**

`critical_success`, `success` and `success_at_cost` all title their knowledge chip **The Charter
Read** with `stateNoun: 'a record gained'`. A player sees one band per run, so this is not a defect
— but the encounter's entire prize design is a five-rung ladder of *how much of the charter
survived*, and the chip, which is the surface reporting state, flattens the top three rungs into
one word. Free improvement, taken:

| Band | Title now |
|---|---|
| `critical_success` | **The Whole Charter** |
| `success` | **The Charter Read** |
| `success_at_cost` | **The Charter Bought** |
| `failure` | One Name Kept *(unchanged)* |
| `critical_failure` | One Line Remembered *(unchanged)* |

`stateNoun` stays `a record gained` on all five — it names the mechanic, which is rule 0c's whole
point, and must not be varied for flavour.

---

## 3. Batch-level findings — for the batch report, not fixable on this side

**Finding 26 — slot 1 renames ALL SEVEN of its cards away from their library titles, not two.**

The draft's § 17 finding 1 undercounts by five. Verified against `CARD_CONTENT`
(`nudge-card-library.ts:570-728`):

| `libraryCardId` | Authored library title | Slot 1 uses |
|---|---|---|
| `card.insurance.core` | **Buy The Floor** | *Set The Floor* |
| `card.whisper.signature.light` | **Show The Obvious** | *Show The Shape* |
| `card.bargain.signature.entropy` | **Pay It Elsewhere** | *Charge It To Doom* |
| `card.compulsion.signature.mind` | **Plant An Urge** | *Set An Urge* |
| `card.omen.hunger.wander` | **Call Them Onward** | *Mark The Road* |
| `card.balm.signature.life` | **Ease The Suffering** | *Lift The Dread* |
| `card.trait_card.core` | **Draw On Character** | *Draw On Conviction* |

Post-THR-1178 the rule is one face per library card, shared by every hand that deals it, so a
per-encounter rename is a defect rather than a flourish — and `cardPlayTally`, the twilight harvest
and the echo card all key on `libraryCardId` while the player reads a title that does not match
what any other encounter calls the same card. **Recommendation:** restore all seven.

**Confirming the live echo the draft flagged, and ruling on it.** Slot 1's *Show The Shape* against
slot 2's *Read The Whole Shape* is real — two Whispers in one batch whose titles share a noun. It
must be resolved **on slot 1's side, not this one**: `Read The Whole Shape` is
`card.whisper.attunement.light`'s own authored library title, verbatim, and changing it here would
manufacture the exact rename defect this finding is about. Restoring slot 1's card to *Show The
Obvious* dissolves the echo at no cost. This encounter's thirteen library titles were checked
one by one against `CARD_CONTENT` and **all thirteen match verbatim**.

**Finding 27 — the batch deals `card.bargain.signature.entropy` twice with two different effect
lines.**

> Slot 1: `They get the help free. The world's clock runs faster to pay for it.`
> Slot 2: `No essence spent. The world's own ending comes nearer to cover the cost.`

The pivot's rule covers the whole face — *"title, effect, quote, art"* — not just the title. The
library carries no canonical `effectLine` today (`CARD_CONTENT` holds `title` + `quote` only), so
nothing catches this, but two encounters showing the same card with different rules text is the
same defect as showing it under two names. **Recommendation:** the batch picks one line for the
member and both slots use it; and the library ticket that adds `side_bet` should consider adding
`effectLine` to `CARD_CONTENT` at the same time, which is what would make this class impossible
rather than merely noticed.

The same tension exists on `card.cache.signature.matter`, whose effect line names the item it
grants (*"iron tongs"* in the shipped calibration case, *"a scroll case"* here). That one is
**shipped precedent** and I am leaving it — but it is the structural argument for THR-887's typed
text slots, and it should be recorded as such rather than rediscovered a third time.

**Finding 28 — THE HEADLINE. The batch's card budget cannot fund a three-step encounter.**

This is Ruling A's structural residue and the most useful thing this batch has produced about the
pipeline itself.

The brief asks for one 2-step and one 3-step encounter, caps seven over-exposed members at ≤1 each
across the batch, bans one member outright, and requires ≥6 of the batch's cards to come from the
14 zero-authoring members (which are almost entirely hunger uniques, i.e. hunger-gated and
sphere-less). The hand rules then require **≥4 distinct spheres and ≥1 ungated sphere-less common
option per hand**. Those constraints are jointly unsatisfiable at three hands: after slot 1's one
hand and slot 2's two, **every universal-core member is spent** and **only the `order` signature
sphere remains unspent**. There is no third hand to build, by anyone, at this point in the batch.

The draft did not discover this — it rationalized the shortfall as a design choice instead. But the
shortfall is real and it is upstream. Three candidate fixes, for the retro rather than for me:

1. Make the over-exposure caps **per encounter** rather than per batch, so a second encounter is
   not starved by the first's picks.
2. Add ungated sphere-less members to the library. Four universal-core members is a very small
   floor when the hand rules require one per hand and a batch can hold five or six hands.
3. Brief step counts against the card budget — a 3-step encounter needs roughly half again the
   member budget of a 2-step, and nothing in the brief template makes that visible.

**Finding 29 — three engine/corpus defects carried forward untouched** (noted for Pass 3, not
fixed here, per the pass boundary). All three re-verified as accurate:

- `IntelligenceEffect.targetEntityId` is not in `SCENE_SENTINEL_FIELDS`, so `'$target'` there ships
  as a literal string and the consumption path dies silently. The draft's workaround (omit the
  field) is correct; its recommended widening is the right shape.
- `ActionScale` has `'cosmic' | 'regional' | 'local' | 'personal'` and no `settlement` member, so
  Seed Die 5's `company` and `settlement` faces both collapse onto `'local'` and the die's spread
  is unmeasurable from the templates.
- The anchor catalog lists `ambition` as anchorable by node id while `classifyAnchorDeclaration`
  rejects every literal node id that is not a shipped attachment template. Slot 2 hit the same wall
  from the other side: an `intelligence` record has no node at all.

**Finding 30 — a documentation-craft note, low severity.** Slot 1's and slot 2's § 4 and § 5
commentary paragraphs are near-verbatim identical (the *"Each is one sentence, names the agent and
the place from the graph…"* paragraph and the whole `LOCATION_ROLE_ROSTERS` class-honesty
paragraph). This is packet rationale, not shipping prose, so it is not a prose defect — but the two
packets are read side by side by the director and the duplication reads as boilerplate. Lightly
varied in the revised file where it cost nothing.

---

## 4. The 12-question narrator's checklist — answered independently

Derived from the spec, not copied from the draft's § 18. Answers are against the **revised** text.

**A — the opening skeleton**

1. **Does P1 say how the agent arrived, with real graph names?** **Yes.** All three P1s carry
   `{name}` and `{location}`, state the arrival, and give the reason for stopping (the weather).
   The reason is load-bearing rather than decorative — the rain is why the vault is filling.
2. **Does P2 state what is happening and what has gone wrong, as events with costs already paid?**
   **Yes**, and better than the draft. Three events, all past: the vault is under water; a page has
   surfaced contradicting the founding claim; the keeper has already gone down and turned back. The
   third is a cost paid by the one person the encounter has cast, which is stronger than a report
   about two unnamed men.
3. **Does P3 land exactly one stake shape, matching the brief?** **Yes — `threat`, uncompounded.**
   P3 is the clock and nothing else. The ask that would have made it a Plea is correctly exiled to
   `initiation`. See finding 23 for the clock's mechanical home.
4. **Is the whole opening ≤80 words, subject-verb-object, one fact per sentence?** **Yes — 70
   words** with the longest P1 (`sacred`, 11). Every sentence is SVO and carries one fact.

**B — narrator mode**

5. **Could a game master read every sentence aloud as a report?** **Yes.** I read the whole packet
   aloud sentence by sentence. Nothing is written from inside a body: no cold water on skin, no
   held breath, no dark pressing in. The three sentences that leaned in-situ are fixed (findings 5,
   7, 13). The nearest surviving edge is *"soaked through"* in a carryover line, which is an
   observable state a narrator reports about someone else.
6. **Is every fact stated, never encoded?** **Yes**, and the revision strengthens this: the warden
   is now stated as fact in P2 rather than delivered as hearsay, the warden's law is said outright
   (*"It will hear one answer"*), and its disposition is a flat sentence (*"It has harmed no one
   and it has let nothing out"*) rather than an inference from behaviour.
7. **Does every sentence serve challenge, test, or outcome?** **Yes, after four cuts.** The
   sentences whose only job was satisfying a design rule were: *"The floor under the outcome held"*
   (job: prove the rider fired — replaced with a sentence about what happened), *"The lean was
   there and it stopped short"* (job: report a forecast term), *"Steady them a little"* (job:
   restate the pip row), and *"No essence."* on the trait card (job: restate the cost row). All
   four are gone. Prose rule 6 satisfied.

**C — internal logic**

8. **Nothing referred to before introduction; every event has a visible cause; nothing
   contradicts what is established?** **Yes, after three fixes.** *The door* in a Veil fragment
   (there is no door), *the shelf list* in a carryover line (never introduced), and the ambiguous
   *that shelf* in step 1's spine are all repaired. Causal chain checks out end to end: the rain
   (P1) → the water rising (P3) → the water at the bottom of the box (step 1) → the warden between
   the stair and the water (step 2). One thing worth naming as a **deliberate** non-contradiction:
   the warden *sits* in step 1 and *stands* in step 2 — that is escalation, marked by *now*, not
   drift.
9. **One named person on stage per beat, named over unnamed?** **Yes.** `{cast:keeper}` is the
   only named person in the encounter, and the revision gives them more to do. The founding
   families, the watcher and the warden stay unnamed, which is what each is: a body of claimants, a
   posted function, and a thing with a law instead of a name. The prose never genders the keeper —
   I checked every sentence containing the token.

**D — the interactive layer**

10. **Can the player restate the stake in one sentence?** **Yes:** *get down into the flooding
    vault, read the charter, and answer the thing that keeps it — before the water takes the
    shelves.*
11. **Is every card named verb+noun and described like a spell?** **Yes, after finding 9.** All
    fourteen names are imperative verb + noun in 2–4 words, thirteen of them the library's own
    titles verbatim. Every effect line now states a direct effect, carries no digit or `%`, uses no
    odds vocabulary, repeats no content word from its own card's name, and reads correctly outside
    this encounter.
12. **Does every declared setting class have an opening?** **Yes** — three declared, three written,
    none for an undeclared class. `validateSettingEnvelope`'s four honesty rules hold.

**Verdict on the checklist: 12/12 after revision.** Pre-revision it was 9/12 (Q5, Q7 and Q8 failed).

---

## 5. Experience Differentiator Gate (14 questions)

| # | Question | Verdict | Evidence |
|---|---|---|---|
| 1 | Opening places player inside a moment already in motion? | **YES** | The vault is already flooding, the page has already surfaced, the keeper has already tried and turned back. |
| 2 | Prose has its own voice — cadence, rhythm, sentence variety? | **YES** | Flat declaratives against longer carried clauses; the aftermath's *"and nobody minds"* and *"long one true name"* are the encounter's own register. |
| 3 | Scene prose names elements that become player choices? | **YES** | The dark below (Stumble), the water (Veil/Heavy Hand's detection axis), the charter's spelling (trait card / Undertow), the earlier party's leavings (Cache). |
| 4 | Reader feels something from prose alone? | **YES** | The `failure` band — the keeper sitting down afterwards to hear what one name was — is the best beat in the encounter and no mechanic carries it. |
| 4b | No seam echoes? | **YES, after revision** | Failed pre-revision at seven seams: findings 1, 2, 4, 8, 14, 15, and the batch's `card.bargain` face (27). Re-read seam by seam after fixing; § 6 below is the full table. |
| 5 | Every card face library-generic with zero scene-bespoke prose? | **YES, after finding 9** | Four faces were scene- or trait-bespoke; all four rewritten. |
| 6 | Every effect line states mechanism; every price real? | **YES** | Three non-essence channels (detection down, detection up, doom), one trait card at 0 priced by being that person. |
| 7 | Every card pays off in failure? | **YES** | 14/14 carry ≥1 failure-band fragment; the one big-delta card (Undertow, 0.16) carries both `failure` and `critical_failure`. |
| 8 | Every card grounded in the scene? | **YES** | Each card's target is established in the spine before the hand is dealt. |
| 9 | Cards answer different questions? | **YES** | Fourteen distinct questions, listed per hand. Step 2's first and last are deliberate opposites on `honesty_cunning`, which is what makes that hand a decision. |
| 9b | Every **nudge-bearing** step carries a full authored hand, and no step asks the player to pick a branch or an ending? | **YES** | Both nudge-bearing steps carry 7 cards. No `authoredChoices`, no player-picked fork. The handless step 1 is outside this question's scope — see Ruling A, which does not let it off the hook. |
| 10 | Aftermath has reflective prose landing? | **YES** | Five band overviews, each landing on something only it can say. |
| 11 | Consequence outcomes actor-centered with names and faces? | **YES** | `{actor}` and `{cast:keeper}` in every overview; the `critical_failure` condition lands on the keeper, not the agent, which is the encounter's sharpest consequence. |
| 12 | Medium+ scale: aftermath offers reaction choices? | **YES** | One per band. See § 7 on why one, not three. |
| 13 | Reaction choices represent philosophical stances? | **YES** | Read aloud in public / keep it in the office that held it / do not argue the price / share the loss / soften nothing. |
| 14 | Concept art uses the two-question method, not scene illustration? | **YES** | Emotions first, then a residue image — shelves with a waterline partway up, the lowest ledgers swollen shut, one dry page above the line. No people, no descent, no warden. Explicitly *"Residue, not event."* |

**14/14 after revision.** No automatic REVISE.

---

## 6. Seam-by-seam echo check (post-revision)

| Seam | Verdict |
|---|---|
| P1 → P2, all three classes | Clean. Each P1 closes on the weather and the place; P2 opens on the vault. No shared verb, no shared frame. |
| P2 → P3 | Clean. P2 is the page and the keeper's failed attempt; P3 is the water and the clock. *Water* recurs deliberately — it is the noun the encounter is about, and a synonym would be the retired mode. Three different sentence shapes. |
| step 0 spine → step 1 spine | Clean. Step 0 closes on the clock; step 1 opens below the water line on the shelves. |
| step 1 spine → step 2 spine | Clean. Step 1 closes on the box with water at its base; step 2 opens on the warden between the stair and the water. Only *water* recurs. |
| step 0 afterimages, internally | **Was failing** (two bands opening *"They got down"*). Now five distinct openings: *came down the stair · got down · Their lamp · went in loud · went off the last of the stair.* |
| step 1 afterimages, internally | Clean after finding 14: *read the whole charter · found the charter · got the charter up · The ink had gone · could not get the lid up.* |
| step 2 afterimages, internally | Clean after finding 12: *gave the warden a name · answered it · got the charter out · would not have the answer · The shelf went over.* |
| the two carryover maps against each other | Clean, and this is the encounter's real structural achievement. Step 1's map is noise and light; step 2's map is names and ink. Twelve lines, zero shared verbs. |
| band overviews against each other | Clean. Each names something only it can name. |
| chip titles across bands | **Was flat** on three bands; now a legible ladder (finding 25). |
| reaction labels, internally | **Was failing** — five identical constructions. Now five distinct verbs (finding 15). |
| **across the batch — slot 1** | **Was failing at four points**: the `ruin`/`arcane` P1 constructions (1), the P2 count-of-people beat (2), the step-0 `success_at_cost` afterimage (4), and the Whisper `failure` fragment (8). All four fixed on this side. Two remain slot 1's to fix: seven renamed card faces (26) and the ten *Let…* labels (15). One residual I am **accepting**: both encounters' carryover maps mention a lamp. Slot 2's lamp is load-bearing (it is the reading step's light), the two lines share no construction, and removing it would cost more than the echo does. |
| across the batch — calibration case | Clean. One-step `stone` frostbite test; no shared reach, member, condition or image beyond `generic.matter`, which is the same library member's tag and therefore correct. |

---

## 7. Sections the editorial prompt asks for by name

**Prose quality.** The strongest draft this reviewer has read out of this pipeline. The register is
genuinely Doctrine v2 — flat, spoken, no interior sensation, no camera. The `failure` band is
better writing than the `critical_success` band, which is rare and is the sign of a real author:
*"{cast:keeper} sat with them afterwards and asked what they had read. One name is all they had,
and they gave it."* The weaknesses were all local and all fixed: four sentences doing rule-work
instead of story-work, one participial, three ambiguous referents, one invented noun.

**Branch seduction audit / branch count.** **N/A by design, correctly.** This is a choice-less
test — no `ActionStepBranch`, no `decidedBy`, no `authoredChoices` (which is retired and correctly
absent). The seduction question transfers to the **hands**, and both hold up: step 2's hand is a
genuine decision because its first and last cards argue opposite poles of the axis the warden's law
sits on, and buying one is refusing the other. Recommendation: **KEEP 0 branches.**

**Scale discipline.** 3 steps is the Composition Contract's ceiling and the brief's assignment.
Beat count matches. No section is padded; § 19's self-audit is long but it is evidence, not prose.

**Inspiration-anchor honesty.** `hook.dangerous_truth` — *"a record has surfaced that contradicts
the founding story everyone here organizes their life around"* — is not decoration. It **is** the
encounter: the contradicted founding claim is P2's cost-already-paid, the knowledge ladder is the
whole prize, and both failure bands still mint a record because the hook's premise is that the
truth is already loose. This is the anchor doing structural work rather than being name-checked.

**Aftermath payoff.** Lands, and it is actor-centered. The best structural decision in the packet
is that **every band mints a knowledge record, including both failures** — which is what makes the
tone non-grim without softening anything, and is the honest reading of `stakes: intel`. The
`critical_failure` band putting `grieving` on the **keeper** rather than the agent is the sharpest
consequence in either slot of this batch.

**Dilemma energy.** Present in the hands rather than in a fork, which the model requires. Step 2 is
the live one: the Undertow (an answer that will do) against the trait card (the true one), with the
Gambit widening the swing between them. Multiple lines are defensible and the choice reveals the
god's posture without letting them pick the ending.

**Register enforcement.** Baseline throughout; no lyricism reached for in ordinary narration; no
archaic diction; interactive text (names, effect lines, purpose lines, carryover lines) is plain
after finding 9–11. Purpose lines are 3 words each against a 4-word cap.

---

## 8. Systems count

**4**, counted from the authored manifest as the contract counts it, not from prose:

| System | Wired by |
|---|---|
| `cast` | the `keeperSpec` support bundle, `must-persist`, receiving `bond_change` ×3 and a `condition_attachment` |
| `rewards` | `spawn_clue` (`critical_success`), `attachment_grant` (Cache card), four `condition_attachment` writes — all `PERSISTENT_EFFECT_KINDS` |
| `conditions` | `cursed`, `terrified`, `grieving` on people; `under_watch` on the location |
| `seeds` | one `encounter_seed` on `failure` |

Floor is 3, brief target is 4, **4 met**. Crucially it is met **without** `reputation` or
`factions`, which is what the brief asked for — the corpus reflex stack is genuinely avoided rather
than nominally avoided. Not a finding.

---

## 9. Every consequence chip against Consequences rules 0, 0b, 0c, 0d, 1–4

Ten chips. Verified individually against the live code, not against the draft's claims.

| Chip | Rule 0 (backed by a write on this band) | Rule 0b (real referent, named) | Rule 0c (`stateNoun` = mechanic, `detail` = endpoints) | Anchor end |
|---|---|---|---|---|
| `archive.crit.charter_known` | ✓ `intelligence` — in `CHIP_BACKING_EFFECT_KINDS` | ✓ `$target`, a location node, named in `detail` as `{location}` | ✓ `a record gained` / `{actor} carries an intelligence record on {location}` | location — reasoned, see below |
| `archive.crit.keeper_trusts` | ✓ `bond_change` | ✓ `$cast:keeper`, a declared bundle key | ✓ `a bond warmed` / names both parties | ✓ counterparty, correct end |
| `archive.success.watched` | ✓ `condition_attachment` with `targetLocationId: '$target'` | ✓ same object the write targets | ✓ `a place under watch` / names the place and what changes | ✓ **exemplary** — anchor and write name the same object |
| `archive.success.charter_known` | ✓ `intelligence` | ✓ | ✓ | location |
| `archive.cost.marked` | ✓ `condition_attachment` | ✓ `trait.condition.cursed`, a shipped template id | ✓ `Cursed` / `{actor} is cursed…` | ✓ attachment template, the sanctioned form |
| `archive.cost.charter_known` | ✓ `intelligence` | ✓ | ✓ | location |
| `archive.fail.shaken` | ✓ `condition_attachment` | ✓ `trait.condition.terrified` | ✓ `Terrified` | ✓ |
| `archive.fail.kept_name` | ✓ `intelligence` | ✓ | ✓ | location |
| `archive.crit_fail.keeper_grieves` | ✓ `condition_attachment` on `$cast:keeper` | ✓ `trait.condition.grieving` | ✓ `Grieving` / `{cast:keeper} is grieving` — names the bearer | ✓ template anchor, bearer named in the sentence |
| `archive.crit_fail.one_line` | ✓ `intelligence` | ✓ | ✓ | location |

**Rule 0 — structurally airtight, and the structure is the reason.** One reaction per band means
`AftermathOutcomeOverride.changes` and `.reactions` cannot diverge: there is no reaction the player
could pick that fails to fire the write a chip on that face claims. Variant-level `changes: []`, so
the fallback face claims nothing it does not write. No `shell_state` chip sits over empty effects.

**Rule 0b — the five knowledge chips, ruled explicitly.** They anchor `$target` (the location)
while their backing `intelligence` write targets `$actor`. I am **upholding** the draft's reasoning
and its stated caveat. The chip's sentence names `{location}`, the record is *about* that place's
charter, `$target` resolves to a real location node, `location` is 🔗 linked with
`visualKind: 'location'` since THR-1172, and the alternative — five `$actor` anchors — is exactly
the corpus habit the brief's ceiling exists to break. What would make it airtight rather than sound
is `targetEntityId: '$target'` on the record itself, which is blocked by the
`SCENE_SENTINEL_FIELDS` gap (finding 29). The draft filed it rather than papering over it, which is
the right handling.

**Rule 0c.** Every `stateNoun.text` is a mechanic phrase — `a record gained`, `a bond warmed`,
`a place under watch`, `Cursed`, `Terrified`, `Grieving`. Never a scene noun; no "the charter they
read", no "the mark on their arm". No placeholder appears in any `stateNoun.text`, which matters
because that field is not enriched and braces would ship literal. Every `detail` names who and what
before it decorates.

**Rule 0d.** No `reputation_tally` chip; no reputation chip of any kind; no reputation effect
anywhere in the encounter. Clean.

**Rule 1 — cause → change, one sentence.** All ten carry a `causeClause` drawn from the scene that
produced them, and none could be pasted into another encounter. Spot-checked the hardest case:
*"A stranger with no claim brought the record up"* is unusable anywhere but here.

**Rule 2.** `stateNoun`, `direction` and `category` declared as structured fields on all ten, plus
`title`, `detail`, `polarity`, `concepts`. All fields verified live on
`EncounterAftermathChange` (`unifiedAction.ts:305-355`).

**Rule 3 — the category a character would recognise.** 5 `boon`, 4 `scar`, 1 `bond`. No `path`,
deliberately and correctly: the only candidate is the `encounter_seed`, and a `path` chip for it
would have to anchor its carrier (`$actor`), which would spend a second `individual` anchor past
the brief's ceiling. The seed is now visible in the overview instead (finding 22). Slot 1 carries
the batch's `path`.

**Rule 4 — palette breadth.** Eight distinct write kinds across the encounter: `condition_attachment`
×4 (three on a person, one on a place, one of the three on the *cast member* rather than the
actor), `attachment_grant`, `intelligence` ×5, `spawn_clue`, `bond_change` ×3, `plant_compulsion`,
`emit_omen`, `encounter_seed`. That is genuinely wide.

**Anchor budget against the brief.** 6 location · 3 attachment · 1 individual. Brief wants ≥1
`location`-anchored chip carrying `visualKind: 'location'` — six do. Brief caps `individual` at one
per encounter — exactly one. No `faction` anchor, as instructed. No `tooltipId` declared anywhere,
so THR-1172's dangling-tooltip half cannot fire. `individual` is the *rarest* kind here rather than
the default, which is the brief's actual intent rather than its letter.

---

## 10. Brief conformance

| Brief instruction | Verdict |
|---|---|
| `card.boost.core` spent by slot 1 — must not appear | ✓ Absent. **Zero Boosts of any member** in the whole encounter, against a corpus where boost is ~65% of annotated cards. |
| `card.insurance.core` spent by slot 1 — must not appear | ✓ Absent. |
| `card.boost.signature.energy` banned | ✓ Absent. |
| ≥3 zero-authoring library members | ✓ **3** — `card.balm.hunger.reclaim`, `card.compulsion.hunger.haunt`, `card.heavy_hand.hunger.illuminate`. Batch total 7 of 14 with slot 1's four. |
| Over-exposed members ≤1 each across the batch | ✓ `card.mercy.core` ×1, `card.undertow.signature.darkness` ×1, `card.omen.signature.time` ×1; slot 1 used none of the three. |
| ≥1 non-essence cost channel | ✓ **3** — Clear The Traces (`detectionDelta −0.10`), Pay It Elsewhere (`doomDelta 0.05`, zero essence), Light The Deed (`detectionDelta 0.15`). The Veil/Heavy Hand pairing is the two types' designed inverse and is now doubled on `revelation_discretion` (finding 21). |
| ≥1 real `grants` entry against built content | ✓ **5** — `attachment_grant` (live id), `remove_condition` (live id), `plant_compulsion` (no id to rot), `emit_omen`, `intelligence`. |
| Hand type composition must differ from slot 1 | ✓ Four types new to the batch — stumble, mercy, side_bet, undertow. Four of slot 1's absent. One member shared (`card.bargain.signature.entropy`); no rider shared. |
| ≥1 `location`-anchored chip with `visualKind` | ✓ Six. `archive.success.watched` is anchor-and-write aligned. |
| ≤1 `individual`-anchored chip | ✓ Exactly one. |
| No `reputation_tally` chip | ✓ None. |
| Systems quota ≥4, not on the reputation/faction stack | ✓ 4; neither reputation nor factions touched. |
| Envelope `ruin`+`arcane`+`sacred`, one opening each, setting-neutral spine | ✓, and the one leak (*the town's*) is fixed at finding 19. |
| Own class-honest `supportBundle`, disjoint from slot 1's | ✓ Verified against `LOCATION_ROLE_ROSTERS`; roles disjoint from slot 1's. |
| Rolled constraints honoured incl. the recorded opposition override | ✓ All five dice placed; `the uncanny — its own law` is the opposition on every step and is now genuinely the *test* on step 2 rather than only its subject (finding 20). |
| P3 states the clock | ✓, and the clock's mechanical home is now stated too (finding 23). |
| Every step `fair` or below | ✓ 0.38 / 0.42 / 0.44. |
| Step 0 `shadow`; later steps not `shadow`; ≤1 reach repeating slot 1 | ✓ Zero reaches repeat from slot 1 — better than the cap. |
| Batch tone: at most one grim resolution | ✓ Slot 1 takes it. |
| Out of scope respected: no army/war, no agent-magic mechanic, no new engine primitives, no `authoredChoices`, no new trait continuum | ✓ All five. `arcane` is a setting class only; the warden has no mechanical dependency on agent-magic. |
| `consequenceDraw: ['relationship','knowledge']` with the one recorded swap | ✓ Both wired in context by band reactions (not card grants, which the gate's walk cannot see). `relationship` on three bands including a **failure** band, which is the right instinct — a relationship that only moves on success is a reward, not a relationship. |

---

## 11. Verdict

**PASS WITH REVISIONS.**

## 12. Revision summary

**Must fix (all applied in the revised file):**
1. Three P1 openings rewritten — batch seam echo with slot 1 (finding 1).
2. P2's third sentence rewritten — batch seam echo with slot 1's P2 beat (findings 2, 3, Ruling C).
3. Step 2's spine gains *"spoken as the record spells it"* — the step did not test `veil` (finding 20).
4. `valueDrift` on `revelation_discretion` added to Clear The Traces and Light The Deed — a declared axis with no mechanism (finding 21).
5. § 7's handless-step justification struck and replaced with the honest reason (Ruling A).
6. Four card faces de-scened (finding 9); four rule-work sentences replaced (finding 7 Q7 above).
7. Five reaction labels and ids rewritten — five identical constructions (finding 15).
8. `failure` overview gains the seed sentence — the seed was invisible (finding 22).
9. *The town's* → *the whole record of {location}* — setting honesty (finding 19).
10. Detector-risk strings replaced (finding 12); unintroduced nouns removed (findings 5, 13).

**Should fix (applied):** the six afterimage/carryover rewrites (findings 4, 5, 13, 14), the three
overview repairs (16, 17, 18), the chip-title ladder (25), the miscounted bracket (24), the clock's
mechanical home stated (23).

**Consider (recorded, not applied):** the `card.cache.signature.matter` face naming its granted item
(shipped precedent, and the structural argument for THR-887 typed slots); the shared lamp image
across the batch's two carryover maps.

**For the batch report, not fixable here:** slot 1's seven renamed card faces (26); the two
`card.bargain.signature.entropy` effect lines (27); **the card-budget/step-count collision that
makes a third hand unbuildable (28) — this is the headline**; the three engine defects carried
forward (29).

**For Pass 3.** Two things need a systems eye that this pass deliberately did not take: whether a
`libraryCardId` binding subjects a `StepNudge` to its library member's `unlock` at deal time (which
decides how many gods actually see the two attunement cards in step 0's hand), and whether
`card.favor.signature.order` carries a `requiresFavor` gate — it was the only fresh sphere left and
that answer would slightly change finding 28's arithmetic, though not its conclusion.
