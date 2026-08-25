# Encounter Pipeline: The Broken Seal

> Batch: **deep-places** (slot 1 of 2) · Slug: `the-broken-seal` · Pass: **2 (editorial)**
> Template id: `encounter.delve.the_broken_seal`
> Date: 2026-08-25 · Pipeline version: 3 (Encounter Factory)
> Reviewed against: `reference/nudge-authoring-spec.md` (Prose Doctrine v2), `SKILL.md` § Pass 2
> (31 triggers), `reference/anchor-catalog.generated.md`, `Docs/plans/encounters/deep-places-brief.md`,
> `src/data/encounters/the-unclaimed-relic.ts` (calibration case), and the sibling slot
> `Docs/plans/encounters/the-drowned-archive-draft.md`.

**Verdict: PASS WITH REVISIONS.** Seventeen findings, seven of them Must-fix. All are applied
inline in `the-broken-seal-revised.md`, which is the complete implementable packet.

---

## 0. What is strong, stated first

The design block is real design, not a retrofit. The two reaches were picked before the prose and
the scene genuinely grew out of them — `star` is *the way down in failing light*, `stone` is *the
weight up broken rock*, and neither could be swapped for the other without rewriting the encounter.
`continue_weakened` on step 0 is the right call and it earns something no other template in the
corpus has: all six of step 0's bands stay reachable, so the six-row `carryoverFactorLines` map is
a full map rather than a stub. The setting-neutral spine is genuinely neutral — the stair, the seal,
the keepers and the rival are the encounter's own furniture and none of them is class scenery. The
hand arithmetic is correct on both steps and I re-derived it rather than trusting the tables.

The `critical_failure` ending is the best writing in the packet: they are dragged out, the stair
comes down, the rival comes out beside them, and the ambition they leave with is *the thing they
were not allowed to see*. That is an ending, not a penalty.

---

## 1. Rulings on the three flagged issues

### Ruling A — the two surviving counts. **Split: one survives, one does not.**

> *"Two of them went below yesterday and one came back."* — **survives.**

This is not clever specificity. It is the P2 format the doctrine prescribes verbatim: *"what is
happening and what has gone wrong, stated as events with **costs already paid**"*, and the
director's own approved exemplar of that clause is a measured count — *"Its freezing aura has
already sent three guards to the infirmary."* A count that prices a cost the scene has already
paid is the shape P2 owes; the tell the director named is a count used as **texture** ("ten
counts", "three paces out"). Keep it unchanged.

> *"It took three tries and a hard drop at the end."* — **does not survive. Rewritten.**

This is the texture case exactly. It is an afterimage, its only job is to distinguish `success`
from `critical_success`, and it does that job with a tally. The distinction is available without
one: `critical_success` is *clean and fast*, so `success` is *slow and rough*.

**Fix (F3):** `They got down. It was slow, and the last of it was a hard drop.`

Two further quantities were checked and cleared: *"half a day of light left"* and *"an hour ago"*
are plain statements of time, not counts of things, and the hour is load-bearing because the light
is the clock.

### Ruling B — the tier-3 prize. **Keep it. No swap.**

`the_silent_testament` stays on `critical_success` alone, for four reasons:

1. On a two-step carryover chain, `critical_success` is the rarest band by construction. The
   `byOutcome` floor exists precisely because *"the tails are the point: they are the endings a
   playthrough almost never rolls, so they go unwritten unless a contract asks for them."* Gating
   the richest prize to the rarest band is that rule working, not a calibration error.
2. The brief's payoff instruction is *"a real prize on success, a concrete legible penalty on
   failure."* A graded ladder — tier 2 on every success-side band, tier 3 at the top — is the
   cleanest expression of it available, and it is the only thing that makes `critical_success`
   mechanically distinct from `success` (the ambition aside). Collapsing it re-opens the exact flat
   ending THR-969 was filed to close.
3. The draft's own alternative, `reward_relics_talismans_heart_of_the_barrow`, is **also tier 3**.
   It changes the item's tags, not its richness — so it cannot answer a "too rich" objection, only
   a thematic one, and `#knowledge` is the better thematic fit here because the `drive` family the
   encounter drew reads as a continuation of what they carried out.
4. Rarity 2 governs how often the *encounter* draws, not how good its rarest ending is allowed to
   be. An open-draw background template with a bounded top prize is the shape the brief asked for.

**Carried to the systems pass, not resolved here:** on `critical_success` the agent receives two
attachment grants from one ending — the fragment from step 1's `successMetadata` and the testament
from the band reaction. That is intended and each is separately chipped, but reward density on a
single band is a systems judgement, so it is recorded rather than assumed.

### Ruling C — the renamed library faces. **The card uses its library face. Adopted for all thirteen.**

The prompt named two renames. There are **ten**, and the draft is inconsistent with itself: three
cards (`card.boost.core`, `card.gambit.attunement.chaos`, `card.heavy_hand.signature.force`) already
carry their library title, and ten do not — while **every one of the thirteen copies its library
member's `quote` verbatim.** A card that takes the library's quote and invents the library's title
is not using the library face and is not a one-off either; it is a half-import.

| `libraryCardId` | Draft `name` | Library `title` (`CARD_CONTENT`) | |
|---|---|---|---|
| `card.insurance.core` | Set The Floor | **Buy The Floor** | renamed |
| `card.whisper.signature.light` | Show The Shape | **Show The Obvious** | renamed |
| `card.bargain.signature.entropy` | Charge It To Doom | **Pay It Elsewhere** | renamed |
| `card.compulsion.signature.mind` | Set An Urge | **Plant An Urge** | renamed |
| `card.omen.hunger.wander` | Mark The Road | **Call Them Onward** | renamed |
| `card.balm.signature.life` | Lift The Dread | **Ease The Suffering** | renamed |
| `card.trait_card.core` | Draw On Conviction | **Draw On Character** | renamed |
| `card.boost.core` | Press The Odds | Press The Odds | ✓ |
| `card.gambit.attunement.chaos` | Widen The Swing | Widen The Swing | ✓ |
| `card.veil.signature.darkness` | Cover Their Tracks | **Hide The Deed** | renamed |
| `card.cache.hunger.gather` | Uncover Old Gear | **Set Aside For Them** | renamed |
| `card.heavy_hand.signature.force` | Throw Full Weight | Throw Full Weight | ✓ |
| `card.kindled_ambition.signature.spirit` | Wake An Old Want | **Kindle A Wanting** | renamed |

Three things decide it:

- **The retrofit the spec was waiting for has landed.** The spec's transitional clause reads *"write
  every face as if it were already a library card, because the retrofit will make it one."* THR-1178
  authored every member's face and THR-1224 renamed all 37 to the imperative shape in one pass with
  ids untouched — `unauthoredCardCount() === 0` is pinned by test. The faces exist; there is nothing
  left to write toward.
- **The sibling slot already does it.** `the-drowned-archive-draft.md` uses the library title verbatim
  for all thirteen of its library members (*Clear The Traces · Loosen Their Footing · Find What
  Remains · Read The Whole Shape · Spare The Worst · Mend What Broke · Send A Dream · Offer The
  Easier Way · Risk Everything · Read The Pattern · Pay It Elsewhere · Light The Deed · Draw On
  Character*) and marks its one non-library card as a stated one-off. The batch cannot ship two
  conventions.
- **Two of the invented names collide with real library members.** *Show The Shape* is one word off
  `card.whisper.attunement.light`'s **Read The Whole Shape** — which is a card slot 2 actually
  deals, so the batch would ship two Whisper faces a reader cannot tell apart. *Cover Their Tracks*
  is a paraphrase of `card.veil.attunement.darkness`'s **Clear The Traces** — again a card slot 2
  deals. Adopting the library titles kills both collisions outright.

**Applied:** all thirteen `name` values become the library title, and the thirteen nudge `id`s are
renamed to match (`seal.buy_the_floor`, `seal.show_the_obvious`, …), mirroring slot 2's convention.
`addNudgeIds` on the trait variant follows. `effectLine` stays hand-authored per the spec — the
face is generic, the hand is bespoke — and one effect line needed a rewrite because the adopted
name made it repeat a name-word (F5).

**Recorded for the batch report, not fixed here.** The shipped calibration case
`src/data/encounters/the-unclaimed-relic.ts` renames five library members away from their faces
(`card.boost.core` → "Steady Grip", `card.cache.signature.matter` → "Uncover Cache",
`card.insurance.signature.order` → "Bind Outcome", `card.undertow.signature.darkness` → "Feed
Greed", `card.balm.signature.life` → "Banish Fear"). Under the ruling above that is drift: the
corpus currently carries two faces for `card.balm.signature.life`, and this encounter would have
made it three. Either the calibration case is retrofitted to library titles or the spec's
*"library-generic"* clause needs restating as *"generic in register, authored per hand"*. One
surface should move; it is not an authoring-session call.

---

## 2. Findings

Numbered. Each carries the quoted text, the rule it breaks, and the applied fix.

### Must fix

**F1 — Ten cards rename their library member's face.** Trigger 16 · § Reusable card faces.
Full table and ruling in § 1C. **Fix:** adopt all thirteen library titles; rename the nudge ids to
match.

**F2 — Five afterimage → aftermath-overview seam echoes.** Trigger 22, and the class the draft's
own echo table structurally cannot see: it checks *afterimages within a step* and *band overviews*
as two separate rows and never checks an afterimage against **its own band's overview** — which is
the one pair that renders on the same screen, in sequence, to the same player.

| Band | Step-1 afterimage | Aftermath overview opens | |
|---|---|---|---|
| `critical_success` | "They came up the stair **with the coffer** … and walked past **the keepers**." | "…came up the stair **with the coffer** … **the keepers** stood aside" | near-verbatim |
| `success` | "They **got it to the top**." | "{actor} **got the coffer to the top**." | near-verbatim |
| `success_at_cost` | "came up with it and **left their pack** … a strip of **skin** below" | "brought the coffer up and **left most of a pack below**" | same image |
| `failure` | "**The keepers had the top of the stair**, and they were **turned out with empty hands**." | "came up **empty**. **The keepers had the top of the stair and turned them out**" | near-verbatim |
| `critical_failure` | "They were **hauled out of the dark by the ankles**, and **the stair came down** behind them." | "{actor} was **hauled out of the dark by the ankles**. The keepers **brought the head of the stair down**" | near-verbatim |

**Fix:** every overview now *advances past* its afterimage instead of restating it. The afterimage
owns what happened at the stair; the overview owns what it means, who is left, and what the chips
are about. All five rewritten in the revised file.

> **A principle worth recording, because it saved four false positives.** Repetition **across
> bands** is not an echo — only one band renders. "The head of the stair" appearing in three
> different band overviews is fine. Repetition **along a render path** — opening → spine → step
> narrative → afterimage → overview → chip → reaction intent — is the echo class, and it is the
> only one worth reading for.

**F3 — "It took three tries."** Clever specificity, § Doctrine v2 correction 1. Ruling A. **Fix:**
`They got down. It was slow, and the last of it was a hard drop.`

**F4 — Three effect lines carry odds-talk or magnitude meta-commentary.** Trigger 17, and the
communication pivot's explicit bar: *"No digits, no `%`, no meta-commentary about effort or odds —
the pip row carries magnitude."* The pip row already says how hard the god is leaning; a line that
says it in words is the surface arguing with itself.

- ❌ *"Lean on them **a little**. **Most attempts fail by a narrow margin**."* — magnitude, then the
  library's aphorism restated as if it were an effect. → `Hold them together past the point they should give out.`
- ❌ *"Push hard and openly. **The odds move a long distance**, and rival gods see who moved them."*
  — explicit odds-talk *and* magnitude. → `Push hard and openly. Rival gods will see whose hand did it.`
- ❌ *"**A small help now.** What comes of this bends the days after…"* — magnitude. → `Steer what comes after toward the same ground they found here.`
- ❌ *"**No essence.** Being Hopeful, they keep going after the light fails."* — duplicates the cost
  row, and *"the light"* is scene-bespoke on a face that must read wherever `trait_card` deals.
  → `Being who they are, they keep going after others would stop.`

**F5 — An effect line repeats a word from its card's name.** § Doctrine v2 correction 2.
`card.bargain.signature.entropy`, once its library name **Pay It Elsewhere** is adopted:
*"The world's clock runs faster to **pay** for it."* → `The help lands now. The world's clock runs faster for it.`
Also tidied `card.cache.hunger.gather` under **Set Aside For Them**: "theirs to take and keep" →
`free to take and keep`, so the line cannot be read against "Them".

**F6 — The detector self-audit overclaims.** § 18 records *"Intensifiers … **Zero**."* There is one:
*"It was also never **quite** enough."* (`card.veil.signature.darkness`, `near_miss`). Warn-level in
the detector, but a false clean claim in the evidence block is the part that matters — the whole
point of the table is that a reader can trust it. **Fix:** line rewritten to
`It was also never enough.`, and the § 18 row now reads what it found.

Two further outcome-class sweeps I ran independently and which *do* come back clean on the draft as
written: no evasive term, no natural indefinite (`nothing`/`someone`/`thing`/`way`/`whatever`) in
any afterimage, band fragment, overview, chip string or `narrativeTemplates.success`/`.failure`, and
zero em-dashes in any authored string so `emDashNot` cannot fire. Three of my own replacement lines
initially reintroduced `nothing` and `way`; they were re-swept and are clean in the revised file.

**F7 — The trait-variance claim is false.** § 9 states: *"`core_hope` has no encounter user, which
is a second thin cell fed."* It has three, all as `TraitVariant`s:

| File | Ref | Factor line |
|---|---|---|
| `src/data/encounters/vertical-slice.ts:954` | `trait.core.core_hope.virtue` | "Hopeful, they climb toward the hut and never the storm." |
| `src/data/encounters/company-drama.ts:1786` | `trait.core.core_hope.virtue` | "Hopeful, they still expect this company to come to something." |
| `src/data/encounters/the-garrisons-price.ts:144` | `trait.core.core_hope.vice` | "Reading the offer for its trap, they ask what the line means." |

The **hook itself stands** — the ref is live, and hope is genuinely the continuum that governs
*going on into the dark after the light stops*, which is an outlook question and not an endurance
one. What fails is the justification: a claim about corpus coverage that a two-command grep
falsifies is the kind of evidence that gets quoted into a batch report and then into a brief.
**Fix:** § 9 now states the true count and drops the thin-cell claim; the variant's own factor line
is also rewritten (F14) because it echoed the trait card's `success` fragment.

### Should fix

**F8 — `initiation` offers a decline the encounter does not model.**
> *"Carry the coffer up and it is theirs. **Leave it, and the other hunter takes it.** The keepers want the stair shut, whoever comes up it."*

Design-block Q6 answers *"None — this is a test"*, and there is no `decidedBy`, no gate, no Opt-in
Complication shape. "Leave it, and…" writes a second course of action into the stake block that no
step can take. **Fix:**
`Carry the coffer up and it is theirs. The other hunter is below and looking for it too. The keepers want the stair shut, whoever comes up it.`
This keeps the contest stake, states it plainly as Doctrine v2 requires, and uses the role noun
rather than a fifth `{cast:rival}` token.

> Checked and cleared while I was here: **trigger 25** ("announced outcome mechanics") does **not**
> fire on `initiation`. Doctrine v2 reverses *foreshadow-never-announce* by name, and the
> director-approved exemplar is itself an announcement — *"The relic is unclaimed — whoever carries
> it out may keep it."* Announcing the stake is now the requirement, not the defect.

**F9 — A promise the design block never lists and no band closes.** P2 says *"Two of them went
below yesterday and one came back."* Design-block Q7 enumerates three promises and their payoffs;
the fourth — *what happened to the one who did not come back* — is opened in the opening and
answered nowhere. It is a small lean-forward and it costs one sentence to close.

**Fix:** step 1's spine now names him, which also gives the descent a beat it did not have and
makes the Cache card's `failure` fragment ("a dead stranger's charm") land instead of float:
> `Below the broken stair the ceiling comes down to a crawl. The keeper who did not come back is in the crawl. At the end of it there is a sealed coffer, heavy enough to need both arms. Getting it up is the hard part. The keepers are still at the top, and the light is nearly gone.`

58 words, inside the 60-word band-base budget. It states the fact plainly and opens no new question.

**F10 — A chip detail over-claims what its write does.** `seal.fail.driven_out`:
> *"{actor} is travelling away from {location} now, and **is not coming back this season**."*

The backing write is `agent_relocation` with `destination: { kind: 'away', minHexDistance: 3 }`.
It sets a relocation intent and a distance; it does not write a season-long exclusion. Rule 0c asks
the `detail` to name the endpoints of what actually happened. **Fix:**
`{actor} is travelling away from {location} now, and will not stop until they are well clear of it.`
— which encodes `minHexDistance` in words, as the tolls-in-words rule requires.

**F11 — Step 1's `criticalFailureAfterimage` asserts a world change the aftermath may not write.**
> *"…and **the stair came down** behind them."*

`bandProse` and the afterimages key on `StepOutcome`; `byOutcome` keys on `UnifiedActionOutcome`.
They are different domains — the spec flags this trap twice — so a step that resolves
`critical_failure` does **not** guarantee the action resolves `critical_failure`, and `pass_closed`
is written only by the aftermath band's reaction. On any run where those diverge, the step prose
tells the player the stair collapsed while nothing in the simulation closed it. Afterimages are
prose surfaces and claim no state formally, but "the stair came down" is a world fact, not texture.
**Fix:** `They were hauled out of the dark by the ankles and dropped at the keepers' feet.`
The collapse now lives only where the write lives: the `critical_failure` overview and the
`seal.crit_fail.shut` chip.

**F12 — Three cross-encounter echoes with the shipped calibration case.** The batch is read beside
`the-unclaimed-relic.ts`, and two of the three sit on the *same library member*.

| This draft | `the-unclaimed-relic.ts` | |
|---|---|---|
| Balm `near_miss`: "**The fear stayed gone.** Their footing did not." | Balm `near_miss`: "**The fear stayed gone.** Their hands failed before their nerve did." | same member, same opener |
| Insurance `critical_failure`: "**Even a bought** arrival **needs a floor** to arrive on, and the floor was the part that went." | Insurance `critical_failure`: "**Even a bound** outcome **needs working hands**, and both of theirs had failed." | same construction |
| Insurance `success_at_cost`: "**The bought arrival held.**" | Insurance `success_at_cost`: "**The bargain held:** …" | same construction |

**Fix:** all three rewritten —
`They were not afraid at any point of it. The stone still did not hold.` ·
`The floor was bought and paid for. The stone under it was not.` ·
`They reached the bottom. The descent collected what it was owed on the way.`

**F13 — Same-class opening collision with slot 2.** Both encounters' `ruin` openings begin
`{name} comes …the ruins of {location}` — slot 1 *"comes to the ruins of"*, slot 2 *"comes in out
of the rain at the ruins of"*. Slot 2's own draft claims *"The two encounters do not open the same
way at any class"*; at `ruin` they do. Only slot 1 is in scope, so slot 1 moves.
**Fix:** `{name} reaches the ruins of {location} with half a day of light left.` (13 words, opening
total 74, budget 80.)

**F14 — The trait variant's factor line echoes the card it unlocks.** The variant's
`factorLine: 'Being Hopeful, they keep going after the light stops.'` and the trait card's `success`
fragment *"They went on after the light gave out…"* both render for the same trait-holder on the
same step, and *the light stops* is also a slightly wrong phrase — light fails or gives out; it does
not stop. **Fix:** `Being Hopeful, they do not turn back in the dark.` (10 words.)

### Consider

**F15 — Five read-aloud stumbles.** Each is quoted with the job it is supposed to be doing; a
sentence whose only job is satisfying a rule is a finding, and none of these quite is — they are
sentences doing a real job clumsily.

| Sentence | Its job | Why I stumbled | Fix |
|---|---|---|---|
| "The seal over **the stair down** is broken." | P2 — state the complication | "the stair down is broken" garden-paths on first read; the stair sounds like the broken thing | `The seal on the stair down has been broken open.` |
| "The debt was taken on and **the dark kept no side of it**." | Bargain `failure` — the price was paid, the help did not arrive | the idiom is invented and does not resolve | `The debt was taken on. The dark did not ease for it.` |
| "…and **the stair took the pause**." | Heavy Hand `critical_failure` — the open push cost them a beat | "took the pause" is a construction with no referent | `…and the stair gave while they stood there.` |
| "The middle had been taken away, and **what was left was the bottom of it**." | Gambit `critical_failure` — the rider removed the middling bands | two "was left/was the" clauses stacked; the meaning arrives late | `The middle had been taken out of it, and only the bad end was left.` |
| "**The sign was given and taken.** It still stopped short of the bottom." | Omen `near_miss` — the omen fired, the descent did not land | passive with an abstraction as subject; "given and taken" reads as an exchange that never happened | `The omen went out ahead of them. It did not carry them to the bottom.` |

**F16 — The `success_at_cost` overview doubles its body damage.**
> *"**Both palms** came off the stone raw, and the last turn of the stair took skin off **both shins**."*

Two "both" clauses of the same injury in one sentence, when the `seal.cost.wounded` chip already
names it as **SCAR · Wounded** with its own detail. Folded into the rewritten overview (F2), which
now says it once.

**F17 — Two bare `concepts` entries and one unverified display name.** `seal.fail.driven_out`
declares `concepts: [{ text: 'travelling away' }]` and `seal.crit_fail.the_wanting` declares
`concepts: [{ text: 'Uncover Ancient Secrets' }]` — both legal (a concept may be plain text), but
the second asserts a display name for `ambition_uncover_secrets` that nothing here verifies.
**Carried to the systems pass:** confirm the ambition's rendered name matches the chip's, or the
chip names an ambition the player's sheet calls something else.

**F18 — Step 0's `critical_failure` carryover restates its own afterimage.** Afterimage: *"The
stone gave under them and put them **at the bottom** in the dark, badly **hurt**."* Carryover:
*"They came down **hurt**, **at the bottom** of a broken stair."* These render in sequence (step 0
resolution → step 1 panel), and canon rule 1 only requires the line to *name its source*, not to
repeat it. **Fix:** `They are hurt, and the route up is the one that gave.` (12 words — names the
source through the afterimage's own verb, adds the fact step 1 actually needs.)

---

## 3. The 12-question narrator's checklist — my own answers

Derived independently; I did not read the draft's § 17 until after writing these.

**A — the opening skeleton**

1. **P1 says how the agent arrived, with real graph names?** **Yes.** All three openings carry
   `{name}` and `{location}`, state the arrival verb, and land the hour. The hour is not decoration:
   the light is the clock on a `star` descent, so P1 is doing test-relevant work.
2. **P2 states what is happening and what has gone wrong, as events with costs already paid?**
   **Yes.** Three events, one per sentence: the keepers are packing, the seal is broken open, two
   went below and one came back. The cost is paid before the agent does anything, which is what the
   clause asks for.
3. **P3 lands exactly one stake shape, matching the brief?** **Yes — `contest`,** the rolled shape.
   The closing sentence is the rival and only the rival. Not compounded.
4. **Opening ≤80 words, subject-verb-object, one fact per sentence?** **Yes — 74** with the longest
   P1 after the F13 and F15 edits (13 + 28 + 33). I counted rather than trusting the draft's 71.

**B — narrator mode**

5. **Could a game master read every sentence aloud as a report?** **Yes.** Nothing is written from
   inside a body. The nearest approaches are *"Their arms were shaking by the last turn"* and
   *"their hands and shins torn open"* — both observable from outside, both reporting a cost. No
   cold-through-a-boot-sole, no camera work.
6. **Is every fact stated, never encoded?** **Yes**, and this is the draft's strongest doctrine
   compliance. *"The keepers will stop anyone who goes near the stair"* is the sentence; the
   encoded version (a barred door, a rope across) is nowhere. *"It was shut before any of them were
   born, and that is reason enough"* states the precedent motive outright instead of implying it.
7. **Does every sentence serve challenge, test, or outcome?** **After the edits, yes.** Before them,
   two did not: the "Leave it, and the other hunter takes it" clause (F8) served a course of action
   that does not exist, and the doubled palms/shins clause (F16) served texture. Both are gone.

**C — internal logic**

8. **Nothing referred to before introduction; every event has a visible cause; nothing contradicts
   what is established?** **Yes.** The rival enters in the spine and is named there before any band
   token uses him. The coffer enters step 1's spine before any afterimage or chip names it. The
   dead keeper — added at F9 — is introduced by the P2 fact that produces him, so he is a payoff
   rather than a new object. The seal being *already* broken is what makes a descent possible at
   all, so "shut for generations" and "there is a stair to go down" do not collide.
9. **One named person on stage per beat, named over unnamed?** **Yes.** `{cast:rival}` is the only
   name. The keepers stay plural, which is correct: they are *"the law / custom of the place"*, and
   giving one of them a face would put two names on one beat and make the precedent personal when
   its whole point is that it is not.

**D — the interactive layer**

10. **Can the player restate the stake in one sentence?** **Yes:** *get down, and carry the coffer
    back up past people who want the stair shut, before the other hunter beats you to it.*
11. **Every card named verb+noun, described like a spell — direct effect, no mood, no odds-talk?**
    **No, as drafted — yes after F4 and F5.** All thirteen names are imperative verb + noun in 3–4
    words (they are the library's own, post-adoption). Four effect lines carried odds-talk,
    magnitude commentary or a cost-row duplicate; all four are rewritten. I then re-checked every
    line for a name-word repeat one by one — see the revised § 18 table.
12. **Does every declared setting class have an opening?** **Yes** — three declared, three written,
    none written for an undeclared class. `sacred` says *sanctuary* so it reads at a wayside shrine
    as well as a temple; `arcane` expands to `tower` alone, so *tower* is exactly honest; `ruin`
    covers five subtypes and *the ruins of* reads at all five. `validateSettingEnvelope` holds.

---

## 4. Seam-by-seam echo check

Read sentence against sentence, along the render path. Cross-band pairs are excluded by the
principle recorded under F2 — only one band renders.

| Seam | Verdict |
|---|---|
| P1 → P2 (all three classes) | **Clean.** The P1s close on the hour; P2 opens on the keepers. No shared image, no shared construction. |
| P2 → P3 | **Clean.** *keepers* repeats and should — it is the noun the paragraph is about, and a synonym would be the retired mode. The three sentence shapes differ: event / rule + reason / event. |
| P3 → step 0 hand | **Clean.** No card face names the seal, the stair, the coffer, the keepers or the rival. Checked all seven. |
| step 0 spine → step 0 afterimages | **Clean.** The spine ends on the rival going down; the afterimages are about the line, the drop and the stone. |
| step 0 afterimage → step 1 carryover | **One hit (F18)**, `critical_failure`. The other five name their source without restating it, which is what canon rule 1 asks for — *"The rope they left below is not coming back up"* deliberately points back at the `success_at_cost` afterimage and that is the mechanism working. |
| step 0 spine → step 1 spine | **Clean.** Different place, different subject, no repeated image. |
| step 1 spine → step 1 afterimages | **Clean.** The spine closes on the light nearly gone; no afterimage reuses the light image on this step. |
| step 1 afterimages against each other | **Clean.** Walked past / arms shaking / pack and rope below / came away empty / hauled out. No two share a verb or a shape. |
| **step 1 afterimage → its own band overview** | **Five hits (F2).** The seam the draft's table has no row for, and the one that renders in sequence. All five rewritten. |
| overview → its own band's reaction intent | **One hit.** `critical_failure`: overview *"The keepers have their stair back"* against the reaction intent *"The keepers get their stair back."* Fixed by giving the overview a different closing fact. |
| overview → its own band's chips | **Clean after F2.** The rewritten `critical_failure` overview no longer restates the collapse the `seal.crit_fail.shut` chip owns; the `success_at_cost` overview no longer restates the pack the afterimage owns. |
| trait variant factor line → trait card fragment | **One hit (F14).** Both render for the same holder on the same step. |
| `narrativeTemplates.failure` → `failure` overview | **One hit.** *"came up the stair with empty hands"* against *"came up empty."* Both render on a failed action. `narrativeTemplates.failure` rewritten. |
| **across the batch** — slot 1 vs `the-drowned-archive-draft.md` | **Two hits.** (a) The `ruin` openings both begin *{name} comes … the ruins of* (F13). (b) *Show The Shape* against slot 2's *Read The Whole Shape*, and *Cover Their Tracks* against slot 2's *Clear The Traces* — both dissolved by Ruling C. Otherwise clean: slot 1's openings land on the hour, slot 2's on the weather; the shapes, pressures, forms, objectives, stakes and systems are all distinct; the type compositions share only `whisper`, `bargain`, `cache`, `balm`, `compulsion`, `gambit`, `heavy_hand` and `trait_card` as *types* across fourteen slots each, never as the same composition. |
| **across encounters** — slot 1 vs the calibration case | **Three hits (F12).** Two on the same library member. All rewritten. |

---

## 5. Design conformance against the step-1 design block

| Check | Verdict |
|---|---|
| Is the agent the protagonist? | **Yes.** They came for what is under the seal, the rival has a head start on them, and both steps are theirs to attempt. Trigger 24 does not fire — there is no scene they watch. |
| Does each step test its declared reach? | **Yes.** Step 0 `star`: the purpose line is *Find the stair down*, the spine hands them a broken descent and a failing light, and every afterimage is about the line, the route or the drop — fate and navigation. Step 1 `stone`: *Carry it back up*, a coffer that needs both arms, and afterimages about arms, skin and the last turn — endurance. Neither reach could be swapped without rewriting the step. |
| Does every declared mechanic and object appear or gate an outcome? | **Yes, all ten.** `trait.core.core_hope.virtue` (variant + the card it unlocks) · `wounded` (`success_at_cost` reaction) · `exhausted` (step 1 `failureMetadata`) · `terrified` (the Balm's `remove_condition` target) · `pass_closed` (`critical_failure` reaction, on `$target`) · carryover (six-row map) · two attachment grants · an ambition assignment (two bands + a different template on a card) · a relocation (`failureMetadata`) · an encounter seed (`success` reaction) · one bound cast actor (`{cast:rival}`, four sites). No unused hook. |
| Does every promise pay off? | **Three of four as drafted; four of four after F9.** *What is under the seal* → the coffer and the graded grants. *The rival already below* → three band overviews. *The keepers' hostility* → step 1's pressure and both failure bands. *The one who did not come back* → nowhere, until F9 puts him in the crawl. |
| Is any outcome mechanic announced rather than foreshadowed? | **Not a defect here.** Doctrine v2 retires *foreshadow-never-announce* by name and reverses it. `initiation` announces the stake plainly, which is now required. The separate problem with `initiation` is F8 — it announces a *course of action* the encounter cannot take. |
| Does base prose assert agent history the graph does not hold? (rule 7) | **No.** I re-derived the classification rather than accepting the draft's. Every fact about the agent's connections is scene-local: they arrive, they find, they descend, they carry. No debt, no standing, no prior visit, no relationship. Every durable fact is *minted* here — grants, conditions, ambition, relocation, seed. The one state-read surface used is the cast binding, which is sanctioned. Trigger 31 does not fire. |
| **Systems connected — counted independently** | **4.** `cast` (the `rivalSpec` actor binding) · `rewards` (two `attachment_grant`s on persistent effect kinds) · `conditions` (three `condition_attachment` writes: `exhausted`, `wounded`, `pass_closed`) · `seeds` (one `encounter_seed`). Contract floor is 3; the brief's target for this batch is 4+; **target met, not exceeded.** `reputation` and `factions` are deliberately untouched per the brief's anchor section, which is the right call — the ground under a ruin is not held by anybody, and reaching the quota on the reputation stack is exactly the corpus reflex the brief exists to break. |
| Personalization the engine could have made but the prose hard-coded? | **None found.** The rival is a bound cast member with a `{cast:rival}` token, not a generic address; the agent is `{name}`/`{actor}`; the place is `{location}`/`{target}`. |

---

## 6. Brief conformance — checked independently

| Brief instruction | Verdict |
|---|---|
| `card.boost.signature.energy` banned | ✓ not used |
| `card.boost.core` at most once across the batch | ✓ once here; **slot 2 uses none** — I checked its two hands. The draft's open finding #1 warning slot 2 off it can be retired. |
| ≥3 cards from the fourteen zero-authoring members | ✓ **4** — `card.insurance.core`, `card.omen.hunger.wander`, `card.gambit.attunement.chaos`, `card.cache.hunger.gather`. Slot 2 adds 3 (`balm.hunger.reclaim`, `compulsion.hunger.haunt`, `heavy_hand.hunger.illuminate`), so the **batch-level ≥6 is met at 7**. |
| Other over-exposed cards, ≤1 each | ✓ `compulsion.signature.mind` ×1, `heavy_hand.signature.force` ×1, `kindled_ambition.signature.spirit` ×1 here; slot 2 uses different members of those families (`compulsion.hunger.haunt`, `heavy_hand.hunger.illuminate`) and takes `mercy.core`, `omen.signature.time` and `undertow.signature.darkness` once each. Every cap holds at batch level. |
| ≥1 card priced on a non-essence channel | ✓ **3** — `doomDelta 0.05`, `detectionDelta +0.15`, `detectionDelta −0.10`. The Veil/Heavy Hand pair in one encounter is the inverse trade the two types exist for. |
| ≥1 card with a real `grants` against built content | ✓ **4** — `emit_omen`, `remove_condition`, `attachment_grant` (`reward_relics_talismans_bone_ward`), `assign_ambition` (`ambition_chase_the_wonder`). All four ids resolve to files in `src/data`. |
| ≥1 `location`-anchored chip with `visualKind: 'location'` | ✓ `seal.crit_fail.shut`, `entityId: '$target'`, `visualKind: 'location'`. Correct per the catalog's THR-1221 correction — a sentinel, not a literal id, because the instance is minted per world. |
| ≤1 `individual`-anchored chip | ✓ exactly one (`seal.fail.driven_out`). 6 attachment / 1 location / 1 individual is a genuinely spread anchor set, and *not* the corpus's every-chip-is-about-a-person habit. |
| No `reputation_tally` chip | ✓ none of any kind |
| Systems ≥4 | ✓ 4, re-counted above |
| No new engine primitives; mature tier only | ✓ movement, conditions, carryover, items, traits, seeds, cards |
| No `authoredChoices`, no player-picked fork | ✓ none. The rejected model is not present in any form — the player never picks the mortal's action and never picks between authored endings. |
| No new trait continuum | ✓ hooks a live one |
| Agent-magic not load-bearing | ✓ `arcane` is a setting class only |
| Rolled constraints honored | ✓ all five dice placed and traceable in the prose (contest / law-custom-precedent-fleeing / hostile / the competitor / company→`ActionScale: 'local'`) |
| `consequenceDraw: ['drive','movement']`, both wired in context, no swap | ✓ `drive` on two band reactions plus an independent card grant on a different template; `movement` in step 1's `failureMetadata`, which is the honest home for it — a delve that goes wrong puts you on the road, and `mode: 'travel'` makes the journey watchable rather than a teleport. |

**Anchor deviation — upheld.** The brief asks for an `ambition`-kind anchor declared with the
ambition node id. The catalog lists `ambition` as 📍 named with `entityId` = the ambition node id;
`classifyAnchorDeclaration` accepts only the four sentinels and shipped *attachment* template ids
and rejects every other literal. An ambition node is minted per world, so the declaration the brief
asks for cannot pass the gate. The draft anchors `$actor` instead — which is exactly where the
catalog says an ambition is seen ("the pursuing actor's sheet") — and names the ambition in
`concepts` as plain text. **Correct call, correctly recorded.** The contradiction between the two
surfaces stands as a batch-report finding.

---

## 7. Editorial-prompt sections that do not apply as written

The prompt's §§ 2–3 (Branch Seduction Audit, Branch Count Assessment) predate the nudge pivot and
are answered rather than skipped:

- **Branch count: 0, and that is correct for this model.** *"A fork the mortal picks is
  `ActionStepBranch.decidedBy`; a fork the player picks does not exist."* The player's choice
  surface is **the hand, played twice**, on two steps that both matter. Both hands are fully
  authored, both are the required size, and neither step asks the player to pick a branch or an
  ending. Trigger 14 does not fire: every card acts on the scene or on the mortal's inner weather
  (*Plant An Urge*, *Kindle A Wanting*), never on their decision.
- **Dilemma energy.** There is no authored dilemma and none is claimed. The tension is the
  carryover: step 0's band is inherited by step 1, so a bad descent is felt rather than reported,
  and the god's decision on step 0 is genuinely about step 1. The two value axes the design names —
  `sacrifice_survival` and `courage_prudence` — are *tilted* by the pole-leaning cards rather than
  forked on, which is the lawful shape.
- **Aftermath reaction choices: one per band, and I affirm it.** Trigger 4 reads as a Medium+
  requirement for consequence choices; the Composition Contract supersedes it. One reaction per
  band is the only structure under which every chip is provably backed by a write that fires on the
  face it renders on (Law 56 / Consequences rule 0), because `changes` and `reactions` are
  independent optional siblings — with two reactions, a chip can render on a face whose picked
  reaction never wrote it. It is also the shape the director-approved calibration case ships. Each
  reaction is still a stance, not a mechanical variant.
- **Scale discipline.** Two steps, `Test & Consequence`, matching the brief's *one 2-step, one
  3-step* row and the shape's own catalog entry. Trigger 30 does not fire.
- **Inspiration anchor honesty.** `hook.descent_into_darkness` genuinely shaped this — *"the way on
  goes down, the light will not last the distance, and what is down there was buried on purpose"*
  is the encounter, not a label attached to it. The light-as-clock and the precedent motive both
  come straight out of it.
- **Concept art direction.** Present and **evocative, not illustrative** — a broken seal lying where
  it was levered off, fresh scrape marks, packs half-tied, no people. It shows residue, not the
  descent and not the fight at the top. Trigger 6 does not fire.

---

## 8. Revision summary

**Must fix (applied):** F1 library faces adopted across all thirteen cards, ids renamed to match ·
F2 five afterimage→overview seam echoes rewritten · F3 "three tries" removed · F4 four effect lines
stripped of odds-talk, magnitude and cost-row duplication · F5 name-word repeat on *Pay It
Elsewhere* fixed · F6 the intensifier found and the self-audit row corrected · F7 the false
`core_hope` coverage claim replaced with the measured one.

**Should fix (applied):** F8 `initiation` no longer offers an unmodelled decline · F9 the fourth
promise closed in step 1's spine · F10 the relocation chip's detail matched to its write ·
F11 the step-1 `critical_failure` afterimage no longer asserts a closure the aftermath may not
write · F12 three calibration-case echoes rewritten · F13 the `ruin` opening moved off slot 2's ·
F14 the trait factor line no longer echoes its own card.

**Consider (applied):** F15 five read-aloud stumbles rewritten · F16 the doubled body damage folded
into one clause · F18 the `critical_failure` carryover line given its own fact.

**Carried to the systems pass:**

1. `supportRole: 'rival_delver'` — confirm it is an accepted value rather than a free string.
2. `critical_success` lands **two** attachment grants (fragment via `successMetadata`, testament via
   the band reaction). Intended and separately chipped; confirm the reward-density expectation.
3. `seal.crit_fail.the_wanting`'s `concepts` text *"Uncover Ancient Secrets"* must match
   `ambition_uncover_secrets`'s rendered display name (F17).
4. All thirteen `imageTag`s and every content id claimed in § 15 need the gate's resolution, not the
   draft's word. I spot-checked that `reward_tomes_scrolls_veilscript_fragment`,
   `reward_tomes_scrolls_the_silent_testament`, `reward_relics_talismans_bone_ward`,
   `ambition_uncover_secrets`, `ambition_chase_the_wonder`, `trait.condition.location.pass_closed`
   and `trait.core.core_hope.virtue` all resolve to files in `src/data` / `src/types`; exact-symbol
   resolution is Pass 3's.
5. `ActionScale` carries no `company` member; `'local'` is the schema value used for a company-scale
   roll. Recorded in § 3, not a defect.

**Carried to the batch report:**

1. **The card-face convention is split across the corpus.** The library authors every member's face
   (`CARD_CONTENT`, `unauthoredCardCount() === 0`); slot 2 and this revision use it; the shipped
   calibration case `the-unclaimed-relic.ts` renames five members away from theirs. One surface
   should move — either the calibration case is retrofitted, or the spec's "library-generic" clause
   is restated as "generic in register, authored per hand". Full detail in Ruling C.
2. **The anchor catalog and `classifyAnchorDeclaration` disagree about `ambition`.** Upheld from the
   draft; see § 6.
3. **Two library members recur across the two-encounter batch** — `card.bargain.signature.entropy`
   (*Pay It Elsewhere*) and `card.trait_card.core` (*Draw On Character*). Neither is on the
   over-exposed list, and one face dealt in two encounters is the library design working rather than
   a defect; noting it so the next census does not read it as drift.
4. **`card.boost.core`'s batch budget is spent by slot 1 and slot 2 does not use it** — the draft's
   open finding #1 can be closed.
