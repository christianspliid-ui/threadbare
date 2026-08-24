# Encounter Pipeline: One Body Short

> Scale: short (1 step) | Slug: one-body-short | Pass: editorial
> Date: 2026-08-24 | Pipeline version: 3.0 (Encounter Factory)
> templateId: `encounter.border.one_body_short` | Batch: border-perils (THR-1221), row 5 of 6

**Headline.** This is a strong draft — the best-argued mechanical design block in the
batch so far, and the pole-agnostic contract in § 8.3 is a genuine piece of craft that
should be copied by every future `Seeded Sequel`. It also ships **two live detector
hits**, **six seam echoes the draft's own seam table could not see by construction**, a
**live Law 56 violation**, and a **Composition Contract failure on four of five chips**
that the draft's self-audit reports as a single ⚠ item. All are field-local. All are
fixed inline in `one-body-short-revised.md`.

The draft's self-scan is the thing to distrust here, not the draft. § 13 claims "0 in
outcome prose" and § 14 claims a two-item open surface; the real counts are 2 and 11.

---

## 1. Prose quality

### What is working, and should not be touched

The four openings are the strongest set in the batch. Each opens on a different noun
(road / wall / ground / gate), closes on a different sense, and — the thing that matters
most for this encounter — **each describes residue rather than narrating an event**. The
`stronghold` opening's *"Somewhere above, a door is banging in its frame and nobody is
going up to stop it"* does in one sentence what the whole encounter is about: the place
still has jobs in it and nobody left to do them.

The spine's last sentence is the encounter:

> *One place has everything a death leaves except the body: beaten ground, a dropped
> blade, nobody lying between them.*

Subject first, concrete nouns, one dry turn. It is exactly the register the batch design
asked for and exactly the register a grim encounter has to hold. **No lyricism crept in.**
I read all four openings, the spine, five afterimages, twelve fragments, six overviews
and five details specifically hunting the retired ornate/archaic register, and there is
not one instance — no "the silence stretched", no inverted clause, no archaism. The
author's declaration in § 0 (*"Grim in this game is plain and concrete"*) is honoured
line by line. This is the single hardest thing about the assignment and the draft got it
right.

### Weak passages, with rewrites

**(a) The Omen card's `effectLine` states mood, not mechanism** — REVISE trigger 17.

> ❌ *"A faint help now, and the days after bend toward what this uncovered."*

Every other card in the hand says what the god *does* ("You set…", "You steady…", "The
body finds…"). This one says only what results. A player reading it cannot say what the
god's hand was.

`[EDITORIAL REWRITE]`
> *You give them the feeling this has happened before, so their hands know where to look
> before their eyes do. A faint help, and the days after bend toward what it turns up.*

**(b) The Long Game's `effectLine` names no present mechanism.**

> ⚠ *"…so what they carry out of here finds them again further down the road. A slight
> help now."*

The downstream half is good; "a slight help now" is asserted and unexplained. The card's
whole trade is *sacrifice now for story later*, so say that.

`[EDITORIAL REWRITE]`
> *You set a mark on them nobody can see, so what they carry out of here finds them again
> further on. A slight help now; the mark is the part that lasts.*

**(c) Two abstract nouns doing concrete work** — plainness move 2.

> ❌ *"The count closed, and the knowing of it went under the skin…"* (Long Game, `success`)
> ❌ *"They felt the weight of it settle."* (Omen, `near_miss`)

`[EDITORIAL REWRITE]`
> *What they read here went under the skin where nobody will see it, and it will keep.*
> *The place felt like one they had stood in before. The count still stopped one short.*

**(d) The `success` overview opens on a fragment** — plainness move 1.

> ❌ *"The account closes. One death on this ground, and no body for it — the place where
> it happened is as plain as the ones that still have somebody in them."*

`[EDITORIAL REWRITE]` — and this also clears seam echo (D), below:
> *The account closes. The place where the missing one went down is as plain as the places
> that still have somebody lying in them, and it is empty.*

**(e) The `failure` overview leans on abstract placeholders** — plainness move 2. Note
this is **not** a detector failure: `overview` is classified `scene`, not `outcome`, in
`nudgeAuditDetectors.ts` (line 389 — see § 5 for why that matters). It is still weak prose.

> ❌ *"…a number that is wrong by one and no way to say which one, and that is a thing to
> carry rather than a thing to solve."*

`[EDITORIAL REWRITE]`
> *The count never agrees with itself. They walk off the ground holding a number that is
> wrong by one and cannot say which one, and there is nobody left here to ask.*

**(f) The `wayside` opening narrates the fight instead of letting the ground testify.**

> ⚠ *"The fight went off the track and into the open…"*

This is a small line with a real cost. The draft's own device (§ 8.3) is that **the ground
testifies, not the agent's memory**, precisely so the scene survives a bare `?spawn=` with
no parent. This sentence asserts the fight's course — a fact neither inherited fact
carries, and one the parent's own prose could contradict. One word fixes it.

`[EDITORIAL REWRITE]`
> *Trampled ground leads off the track and into the open, where there is nothing to put
> your back against.*

---

## 2. The seam echoes — six, and the audit that could not see them

The draft's § 2 seam table is well made and its four checks are all correct. **It is also
incomplete by construction**: it checks `initiation → opening`, `opening → spine`,
`spine → bands`, and `spine ↔ initiation`, and stops there. It never checks the seams
*inside a single ending* — where the base afterimage, the band `overview`, the
`narrativeTemplates` line, and up to six card fragments all land on the player at once.
That is where every echo in this packet lives.

Naming each seam I checked, and the verdict:

| Seam | Verdict |
|---|---|
| `initiation` → each of the four openings | clean (draft's finding confirmed) |
| each opening → spine (×4) | clean (confirmed; four different closing senses into a time-and-stillness opener) |
| spine → each of the six bands | clean (confirmed; `one short` appears only in the two `near_miss` fragments) |
| spine ↔ `initiation` | clean (confirmed; the double-statement was already fixed in drafting) |
| across the four openings | not a seam — only one class renders |
| **`narrativeTemplates.success` ↔ `success` overview** | **ECHO (C)** — *"The account closes."* verbatim, both render on a success ending |
| **`success` afterimage ↔ `success` overview** | **ECHO (D)** — *"one death here, and no body to bury"* / *"One death on this ground, and no body for it"* |
| **`critical_success` afterimage ↔ `critical_success` overview** | **ECHO (B)** — *"They read the whole ground…"* repeated as the lead clause, plus `drag-marks` twice |
| **card 2 fragment ↔ card 6 fragment, `success_at_cost`** | **ECHO (E)** — *"The count came out."* verbatim in both; both can be active in the same run |
| **`success_at_cost` afterimage ↔ its overview** | **ECHO (F)** — *"turning over faces"* / *"turning over every face"* |
| **`critical_failure` afterimage ↔ card 6 fragment** | **ECHO (A)** — *"broke apart in their hands"* / *"went to pieces in their hands"* |
| **card 4 fragment ↔ card 5 fragment, `success`** | **ECHO (G)** — both open *"The count closed, and…"*; both can be active in the same run |
| `narrativeTemplates.failure` ↔ `failure` overview | clean |
| `failure` afterimage ↔ `failure` overview | clean |
| `critical_failure` afterimage ↔ its overview | clean |
| `fallback.overview` ↔ every band overview | clean |
| card 1 ↔ card 3 fragments, per band | clean |
| chip `detail`s ↔ their band overviews | clean |

Echo (A) is the worst of the seven, because `critical_failure` is the tail the contract
made the draft write and the two lines land in the same paragraph. Echoes (E) and (G) are
the structurally instructive ones: **two card fragments on the same band are a seam**, and
nothing in the pipeline's seam guidance says so. Recommend the skill's trigger 22 wording
be widened — filed as a note to the orchestrator, not fixed here.

All seven rewrites are in the revised file; the new § 2 seam table lists all eighteen
seams above so the next reader inherits the wider audit.

---

## 3. The four judgment calls — independent rulings

### Call 1 — `long_game` ships as a recorded one-off, no `libraryCardId`. **CONFIRMED.**

Read `src/data/nudge-card-library.ts` directly. The author's premises all hold:

- `long_game` is **not** in `UNIVERSAL_CORE_TYPES` (line 275: `boost`, `insurance`,
  `mercy`, `trait_card`) and appears in **no** entry of `SPHERE_SIGNATURES` (line 291;
  `darkness` signs `veil` and `undertow`). The library is *generated* from those two
  tables plus the hunger uniques and the variation list, so there is exactly one
  `long_game` member in the whole library.
- That member is `card.long_game.hunger.sever` (line 412), minted by `hungerMember()` —
  **sphere-less by construction** (the helper sets no `sphere`) and gated to Sever gods.
- Its authored face (line 645) is `title: 'The Thread Cut'`, `quote: 'Not every tie was
  chosen. None are permanent.'` — a card that **cuts** a tie. This one **plants** one. The
  author's "misdescribe it" claim is not a stretch; it is the opposite verb.

And the arithmetic the author cites is forced, which is the part worth stating plainly:
the hand's other five cards can only reach `light` (whisper), `time` (omen), `energy`
(boost) and the common pool (boost core, trait card). **Darkness enters this hand through
the `long_game` card or not at all.** Point it at the Sever unique and it goes sphere-less,
the hand drops to three distinct spheres, and it fails `HAND_SPHERE_COVERAGE_MIN` (4,
verified in `nudgeAuthoringConstants.ts` line 80) — REVISE trigger 8.

**The solution the author did not consider, and why I reject it too.** A seventh card of a
darkness-signed type (`card.veil.signature.darkness` or `card.undertow.signature.darkness`
both exist and both carry authored faces) would supply darkness *with* a `libraryCardId`
and free the `long_game` card to be common. The hand has room — 6 → 7 is inside
`NUDGE_HAND_MAX` (8). I reject it because the batch design fixes this encounter's hand
budget at `whisper`, `omen`, `long_game`, `boost` ×2, `trait_card`, and says of itself
*"A draft agent fills the spread; it does not renegotiate it"* — and `veil` and `undertow`
are allocated to rows 2 and 3/4 as their own debuts. Spending another encounter's debut
type to dodge a one-off is a worse trade than the one-off.

**Verdict: the recorded one-off is correct.** It is what the brief means by *"A card
genuinely outside the library stays a one-off — but that is a choice, not the default"*,
and the draft records the choice with its reasoning, which is the whole of what the brief
asks. The follow-up note (a `card.long_game.signature.darkness` is the natural home)
stays in the revised file — it is the right ask and it is correctly out of scope.

One thing the draft did not claim and should have: **the other five cards' faces are
byte-identical to their library members'.** I checked all five against `CARD_CONTENT`
(`card.boost.core`, `card.trait_card.core`, `card.whisper.signature.light`,
`card.boost.signature.energy`, `card.omen.signature.time`) — title and quote match exactly
in every case. That is the discipline `libraryCardId` exists to make checkable, and this is
the first packet in the batch to actually hold it. Added to the revised file's hand audit.

### Call 2 — Whisper omits `reveals`, earns its keyword through `intelligence`. **CONFIRMED.**

`src/types/unifiedAction.ts` line 1602: `export type NudgeRevealKind = 'next_step_demand';`
— a union of one, with its own doc comment explaining that the second candidate reveal was
deliberately not minted (*"inventing one to fill out an enum would ship a shape with no
reader"*). On a one-step encounter `next_step_demand` has no next step to describe, so
declaring it would ship exactly the lever-that-cannot-fire the spec's live-layer trap
names. The card's `hostSystem` in the library is `Intelligence` (line 148), and the card
writes a real `intelligence` record — so it is a Whisper by its own type row, not by
courtesy. **Correct as drafted; no change.**

### Call 3 — `quintessence_shift` on the failure side only. **CONFIRMED, and I would go further.**

Schema verified: `src/types/unifiedAction.ts` line 466 —
`{ kind: 'quintessence_shift'; delta: number; targetAgentId?: string; source?: string; when?: EffectPredicate }`.
The draft's § 7.2 restates it exactly, including that `delta` is designer-facing and never
renders. `targetAgentId` omitted defaults to the actor. All correct.

On the design call: **failure-side-only is right, and there is a second reason the draft
did not find.** The condition this encounter applies on failure is
`trait.condition.grieving`, whose `domainContributions` are `{ heart: -0.08, eye: -0.05 }`
(`src/data/condition-trait-content.ts` line 255). **Grief penalises `eye` — this
encounter's own reach.** So failing an `eye` test leaves the agent measurably worse at the
next `eye` test, and the erosion sits alongside it as the same beat's cost. That is a
coherent, legible, non-punitive failure: the world got harder in the specific way the scene
was about. Putting a shift on the success side would break that read by making the
consequence a toll rather than a shape.

The single-site chip discipline (only `critical_failure` chips the shift; the reaction's
player-chosen shift is unchipped) is also correct, and `quintessence_shift` **is** a member
of `CHIP_BACKING_EFFECT_KINDS` (`compositionContract.ts` line 227), so the chip is properly
backed on that band.

### Call 4 — `thread_weaken` authored but unchipped. **FINDING CONFIRMED; DISPOSITION SUPERSEDED.**

The engine finding is exactly right, verified line by line:

- `SCENE_SENTINEL_FIELDS` (`src/engine/encounterAftermath.ts` line 651) carries
  `targetAgentId`, `withAgentId`, `counterpartyId`, `debtorAgentId`, `targetFactionId`,
  `factionId`, `targetSublocationId`, `targetLocationId` — and **no** `ascendantId`,
  `mortalId`, `sourceMortalId` or `newMortalId`.
- `bindAftermathSceneTargets` (line 748) iterates `Object.keys(SCENE_SENTINEL_FIELDS)` and
  nothing else, and resolves only `$actor`, `$target`, `$cast:<key>` (plus the legacy
  `role:` alias). **There is no `$ascendant` token anywhere in the build.**
- The `thread_weaken` handler (line 3797) reads `effect.ascendantId` and `effect.mortalId`
  raw into `getOutgoingEdges`, and emits `thread_mutation_skipped` /
  `no thread edge … → …` when the lookup misses (line 3806).

So an authored sentinel passes through as a literal string and the effect no-ops. **Had
the encounter kept the `thread` family, leaving the effect unchipped would have been
correct Law 56 rule-0 discipline** and I would have said so in these words.

**It does not keep it.** The orchestrator's mid-pass ruling takes the spec's one sanctioned
`consequenceSwap`: `thread` → `omen`. I verified the swap clears every gate in
`checkConsequenceDraw` (`src/data/content-eval/consequenceDraw.ts` line 349):

- `omen`'s weight in `eye` is **4** (`CONSEQUENCE_FAMILY_WEIGHTS` line 149), over the
  `CONSEQUENCE_SWAP_MIN_WEIGHT` floor of 2;
- `omen` is not already in the drawn hand (`['secret', 'thread']`), so the swap varies the
  hand rather than shrinking it;
- `omen`'s only satisfying kind is `emit_omen` (line 194), which is live.

The swap as recorded in the revised file:

```ts
consequenceDraw: ['secret', 'omen'],
consequenceSwap: {
  from: 'thread', to: 'omen',
  reason: 'thread_* effects read `ascendantId`/`mortalId` as literal node ids; neither is '
        + 'a SCENE_SENTINEL_FIELDS member and the ascendant node id is minted per run, so '
        + 'no authorable literal exists. The write no-ops with `thread_mutation_skipped` '
        + 'while check:encounter passes on kind presence — a family that is green at the '
        + 'gate and dead at runtime. `omen` (weight 4 in eye) is also the better fiction: '
        + 'a death that did not stay dead is what the sky says is coming.',
},
```

**Where `emit_omen` landed, and why it is in context rather than bolted on.** On the
aftermath reaction **`short.say_the_count`** — *"Let them say the count out loud."* The
omen exists **because the count was spoken**: a mortal states aloud, in a country that
already has this kind of news, that the dead here got up and walked, and the talk starts.
Pick the other stance and there is no omen, because nobody heard it. That is the family
being a reason this scene does that thing, which is what "in context" means. Two supports:

- `allAftermathEffects` (`compositionContract.ts` line 337) walks variant reactions, band
  reactions and step metadata — so a reaction effect satisfies the family. It does **not**
  walk card `grants`, so the Omen *card*'s existing `emit_omen` grant could never have
  satisfied the draw on its own. Authoring it in the aftermath was mandatory, not stylistic.
- Both `emit_omen` sites are now differentiated so they are not the same omen twice: the
  card's hook is about **recurrence** (its sphere is `time`), the reaction's about **the
  talk starting**. See the revised § 7.3.

**Not chipped**, per the orchestrator and per the code: `emit_omen` is absent from
`PERSISTENT_EFFECT_KINDS` and therefore from `CHIP_BACKING_EFFECT_KINDS`
(`compositionContract.ts` lines 114–231), and the module's own comment classifies it as
dressing.

**One refinement to the instruction, reported rather than silently taken.** The
orchestrator's instruction 4 says the omen's words belong in the band `overview`. They
cannot go there, and the reason is the same asymmetry that makes the reaction the right
home in the first place: **a band overview renders regardless of which stance the player
takes**, so an overview asserting that the telling has started would be false on every run
where the god chose silence — a prose claim about state that did not happen, which is the
same defect Law 56 polices one surface over. The words are instead seated on the two
surfaces where they are unconditionally true: the reaction's own **`intent`** line, which
is the prose the player reads at the moment of choosing, and the **`narrativeHook`**
itself, which is genuinely player-facing — it surfaces in the chronicle and feeds `{omen}`
enrichment. No overview claims the omen.

The engine gap is real and still worth a ticket for the **engine**, not for this encounter
— batch row 6 hit it independently. The revised file keeps that as a one-line
recommendation in § 8.4 and drops the blocked-primitive row from § 10.

---

## 4. The two smaller items — resolved, not passed on

### (i) The placeholder `concepts` tooltip id. Resolved — and it was the smaller half of a bigger failure.

The draft proposed two exits: register a secret concept, or **drop `concepts` entirely**.
**The second is not available**, and this is the finding the draft's ⚠ understates.
`compositionContract.ts` line 1228:

```ts
for (const change of allAftermathChanges(template)) {
  if ((change.concepts?.length ?? 0) === 0) {
    add('aftermath', `change '${change.id}' declares no \`concepts\` (Law 2)`);
  }
}
```

`concepts` is required, non-empty, on **every** change. The draft declares it on **one of
five chips**. So the packet as drafted fails the Composition Contract's Aftermath block
**four times** — `short.the_faces`, `short.grief_without_a_grave`, and
`short.something_gave` (twice-reachable, reported once) — and the fifth chip points at
`ui.narrative_log`, which *does* resolve (I enumerated `UI_TOOLTIPS`; it is there at
`src/data/ui-content.ts` line 135) but names the narrative log, not a secret. It would pass
the gate and fail the player, which is precisely the shape THR-1172 added the tooltip check
to stop.

There is **no `secret.*` prefix** — `resolveTooltip` routes `ui`, `sphere`, `reach`,
`terrain`, `archetype`, `faction`, `doom`, `agent`, `quintessence`, `attachment`,
`location`, and nothing else — and registering one is a code change outside this pass.

**Resolution: every chip declares `concepts` anchored by `entityId`, and no chip declares a
`tooltipId` at all.** `chipAnchorViolations` accepts either form
(`concepts.some(c => c.entityId || c.tooltipId)`, line 716), and an `entityId` is checked
by `classifyAnchorDeclaration`, which I verified accepts `$actor`, `$target`,
`$cast:<key>`, `$faction:<defId>` and a shipped attachment-template id
(`chipAnchorDeclarations.ts` line 86). The five concepts:

| Chip | Concept `text` (a literal substring of `detail`) | Anchor | Form |
|---|---|---|---|
| `short.the_unsaid` (both success bands) | `a secret` | `$target` | `target` |
| `short.the_faces` | `grieving` | `trait.condition.grieving` | `attachment_template` |
| `short.grief_without_a_grave` | `grieving` | `trait.condition.grieving` | `attachment_template` |
| `short.something_gave` | `quintessence` | `$actor` | `actor` |

`trait.condition.grieving` is in `CONDITION_TRAIT_DEFINITIONS`
(`src/data/condition-trait-content.ts` line 244) and therefore in
`ATTACHMENT_TEMPLATE_SOURCES`, so `getAttachmentTemplateNode` resolves it — checked,
because the `stateNoun` on both grief chips already depended on it.

One recorded limitation, deliberately not papered over: the anchor catalog's Stats row
asks a quintessence chip for *"`tooltipId` for the sphere, plus the bearer's `entityId`"*.
The bearer half is declared; the stat half has no author-writable id — `quintessence.*`
resolves only band-keyed labels (`BAND_TOOLTIP`: transcendent … dissolving), and an
authored chip cannot know the band. Half an anchor honestly is better than a whole one
that lies, and this is recorded in the revised § 7.4 rather than dressed.

### (ii) The `success_at_cost` grief chip. Resolved — and confirmed as a live Law 56 violation the gate would not have caught.

Verified in full. `SUCCESS_BANDS` in `compositionContract.ts` line 79 **includes
`success_at_cost`**, so `stepWritesReachFace` (line 478) routes `successMetadata` — not
`failureMetadata` — to that face. The grieving condition lives on `failureMetadata` and
therefore cannot fire there. The chip claims a condition nothing applied.

The sharp part: **the machine gate passes this.** `chipBackingViolations` is documented as
*"a floor, not a semantic match"* (line 558) — it asks whether the face performs *any*
qualifying write, and this face has two (`secret_discovery` and the `rewardPool` draw). So
`check:encounter` would go green over a chip that names a state the ending never wrote.
This is the author's call to make, and the draft correctly flagged it rather than shipping
it.

**Applied fix: option (a), the band's own reactions.** Verified against
`applyAftermathOutcomeBand` (`unifiedAction.ts` line 1929) —
`reactions: band.reactions ?? variant.reactions` is substitution, not a merge, so both
stances are re-declared on the band with `condition_attachment` appended to each. Both
carry it, so the condition lands whichever stance the player takes, and the chip is true on
every path through the band. Backing is then `reactionBackingForFace`
(`compositionContract.ts` line 525), which is the sanctioned route —
`condition_attachment` is in `PERSISTENT_EFFECT_KINDS` (line 117).

I considered and rejected two alternatives. Moving the condition to
`successMetadata.effects` would grieve the agent on `critical_success`, `success` and
`near_miss` too — the exact "tax on playing well" § 7.2 argues against. Gating it with a
band predicate is impossible: `EffectPredicate` (`src/types/effects.ts` line 59) has no
outcome-band member. And folding the chip into the overview would have been *legal* but
would leave the band's whole point — that getting it right cost something — as prose only.

---

## 5. Detectors — re-run by hand, against the code rather than the spec page

**The draft's § 13 self-scan is wrong on its headline claim.** It reports "0 in outcome
prose". There are two, and both are real REVISE trigger 15 hits.

The reason it missed them is worth recording, because it will recur: the spec page's field
table says aftermath **overviews** are `outcome` class and does not mention chip `detail`
at all. **The code says the opposite** — `nudgeAuditDetectors.ts`
`pushAftermathVariant` pushes `body.overview` as **`scene`** (line 389) and
`change.detail` as **`outcome`** (line 392), with a long comment explaining why. The spec
itself rules that *"the code is the contract, not this page"*, so the code wins. An author
scanning by the page checks the wrong two surfaces.

| Detector | My result |
|---|---|
| Evasive vagueness, all classes | **0.** Confirms the draft. |
| Natural indefinites, `outcome` class only | **2 HITS.** (1) Whisper `near_miss` fragment: *"The comparison held all the **way** to the last place"* — `way` matches on a word boundary. Fragments are pushed as `outcome` (line 310). (2) `short.something_gave` `detail`: *"Counting a **thing** that would not stay counted"* — `thing`; `detail` is `outcome` (line 392). Both fixed. |
| Natural indefinites in `scene` class | Not enforced, correctly. The `failure` overview's `way` / `thing ×2` are legal; I rewrote them anyway on plainness move 2, not as a gate fix. |
| Intensifiers (warn) | 1 — *"rather than"* in the `failure` overview; removed by the rewrite. |
| Annotation clauses (≤1 per encounter) | **0.** Confirms the draft. No "not … but" inside any sentence; the two em-dashes (`ruin` opening, `success` overview) are both followed by noun phrases, so neither is `emDashNot`. The revised file holds at 0. |
| Divine outcome-authorship | **0.** Confirms the draft. No decision verb + `whether/what/which/who/if` + clause anywhere. Both reaction labels are the god choosing its own act ("Let them say…"), which is the passing side of `DIVINE_DECISION_PATTERNS`. |
| Digits or `%` in an `effectLine` | **0** across six cards. Confirms. |
| Abstraction-as-subject | Clean. Two abstractions in the subject slot (`the count`, `the fighting`) and both are the literal subject of the scene. The revised file adds no new ones. |
| Word budgets | All inside. The rewritten `wayside` opening is 58 words; the longest new fragment is 24 (cap 25). |

---

## 6. Hard checks — each reported individually

**Player-as-god.** ✅ No `authoredChoices` anywhere. One step, no branch. The only fork is
the god's own aftermath stance, and both labels are god acts on the scene ("Let them say
the count out loud" / "Let them carry the count alone") — neither instructs the mortal and
neither picks an ending. Trigger 14 clean.

**Communication pivot.** ✅ Six faces, zero scene-bespoke prose. Titles are 2–3 words each
(cap 6, aim 2–4). Five of six faces are byte-identical to their library members' authored
title and quote — verified individually. No digit or `%` in any `effectLine`. After the two
rewrites in § 1, all six state mechanism.

**Hand rules.** ✅ 6 cards (4–8). Five distinct types (floor 3). Two `boost` (cap 2). Four
distinct spheres — `light`, `energy`, `time`, `darkness` — exactly at
`HAND_SPHERE_COVERAGE_MIN`. One ungated common (`short.a_little_more`), plus the gated
trait card. **Zero riders** (no `insurance`/`mercy`/`gambit` in the budget), inside the ≤1
rule. Summed `forecastDelta` 0.41, inside `NUDGE_HAND_MAX_TOTAL_DELTA` (0.70 — verified).
The only zero-essence card is the trait card, priced by the trait.

**Failure payoff.** ✅ Six cards, six failure-band fragments — `near_miss` ×2, `failure` ×3,
`critical_failure` ×1. No card reaches `NUDGE_BIG_DELTA` (0.15 — verified), so the
both-bands rule does not fire. All six `StepOutcome` bands are covered by the hand.

On *cool failure at a grim encounter*: this is the trap the assignment named and the draft
avoids it. `failure` is not "you lose" — it is *the count never agrees with itself, and
there is nobody left here to ask*, plus a condition that makes the agent worse at exactly
the reach the scene tested. `critical_failure` is the best line in the packet:
*"by the last one they are counting the same body twice to make it come out."* That is a
player watching a person come apart in a legible, specific way, not a punishment counter.
The `success_at_cost` band — you got the number and the faces stayed — is the same virtue
on the success side. **No band reads as punishment.**

**Base-text independence.** ✅ Every band base reads correctly with zero cards active. No
nudge-specific payoff appears in any afterimage, `narrativeTemplate`, or overview; all of
it lives in `bandProse`. Trigger 13 clean.

**Static factor lines (THR-892).** ✅ `factorLines: none authored`, `carryoverFactorLines:
none`. The only authored factor surface is the `TraitVariant.factorLine`, which is variance
by construction — it renders only for a Warm agent. The draft's stated reasoning (the light,
the number of dead, priced into 0.40 and living in the prose) is exactly the variance rule.
Trigger 23 clean.

**Register.** ✅ Baseline throughout, **no peak surface claimed**, and none taken. Reported
in full in § 1: the grim-lyrical drift never appears. Card names, effect lines, factor line
and purpose line are all interactive-plain. The three plainness moves: subject-first now
holds everywhere after the `success`-overview rewrite; two abstract nouns swapped; the dry
closers stay at one per beat (I recount three in the packet, none stacked). Density is
right — one named person on stage, props limited to the ground, the dead, the blade and
the empty place.

**Detectors.** Reported in § 5. Two hits, both fixed; ≤1 annotation clause holds at 0; zero
divine outcome-authorship.

**Seam echoes.** Reported in § 2. Eighteen seams named, six echoes found, all fixed.

**Single Test honesty.** ✅ Not padded — the packet earns its length in the design block
and the contract sections, and the prose itself is compact (four 56–58 word openings, one
57-word spine, five afterimages inside 60). The full Composition Contract is carried with
**no exemption claimed** (ruling 3): Steps, Hand, Setting, Cast, Rewards, Aftermath,
Systems, Images all present. `RETROFIT_PENDING` correctly not listed.

**Prose rule 7, with the sequel exception.** ✅ Audited fact by fact. Every claim is either
scene-local invention with no life outside the encounter (the firepit, the banging door, the
dropped blade, the empty place, the crows, the flies), a read through a sanctioned surface
(the trait gate/variant/card, the cast binding, the reward draw), or one of the two facts
the parent mints (a fight happened here and is over; one other person came through it).
**One line was over the boundary and is fixed** — the `wayside` opening's *"The fight went
off the track"* asserts the fight's course, which is neither. The `critical_success`
reveal (*"watched it happen and has not mentioned it since"*) looks like invented state and
is not: the encounter's own `secret_discovery` mints the `knows_secret_of` edge, so the
mechanics produce the fact and the prose narrates it after. That is the production half of
rule 7 working exactly as written.

**Envelope.** ✅ Four classes declared, four openings written, `locationSubtypes` derived
with `expandSettings(...)`. The spine names no class scenery — no wall, turf, gate or road;
"beaten ground" is universal. No band overview or afterimage names class scenery either
(I checked all eleven). "The road on" appears as the agent's journey, not the wayside's
road-as-feature, and is correct at all four classes.

**Cast.** ✅ `survivor` declared in `supportBundle`; both `{cast:survivor}` tokens name that
key; the `$cast:` sentinel is not used, so no undeclared-key risk. **Class-honesty verified
independently against source**, not taken on the draft's word: `SUBTYPE_TO_ROSTER_KEY`
(`src/engine/npcSeeding.ts` line 49) maps `camp`→`military_outpost`, `fort`→`military_outpost`,
`castle`→`capital`, `wilderness`→`wilderness`, `ruin`→`null`; `battleground` and `oasis` are
unmapped and therefore null. `LOCATION_ROLE_ROSTERS` (`src/types/npc.ts`) carries
`mercenary` and `scout` in `military_outpost`, `ranger` and `wanderer` in `wilderness`, and
`mercenary` at 0.6 in `capital`. Every declared `reuseNpcRoles` entry is seeded at the class
the draft claims it for; the two null-roster classes fall to the spawn path, where
`spawnNpcRole: 'mercenary'` reads correctly. **No gendering anywhere** — see § 7.

**Law 56.** Reported in § 4(ii). One live violation, fixed. Anchors checked against
`anchor-catalog.generated.md` and against `classifyAnchorDeclaration`: `$target` on the
secret chip is right because `secret_discovery` itself reads `action.targetId`
(`encounterAftermath.ts` line 4212) and has no `targetAgentId` override — so the chip
points at the exact endpoint the write used. `trait.condition.grieving` is the attachment
template, per the catalog's Attachments row. `$actor` on the quintessence chip is the
bearer, per the Stats row. **No `reputation_tally` chip anywhere** (rule 0d). No PATH chip
— the sequel's opening was the parent's to claim, which is the right call.

**Title glance test.** ✅ *One Body Short.* A player reading only the title knows the
complication.

**Crux.** ✅ One plain sentence: *"The agent is counting what the fight left on the ground,
and the count is one short."* Subject, verb, object, vibe. Matches the batch design's row 5
verbatim.

---

## 7. Pole-agnosticism and the no-pronoun rule

**Both hold, everywhere, after one fix.**

**Pronouns.** I read every player-facing string for a pronoun referring to the bound cast
member: four openings, the spine, three `narrativeTemplates`, five afterimages, twelve
fragments, six overviews, five `details`, two reaction labels, six card faces. **The
survivor is never given a pronoun.** The role noun carries them in the spine ("The other
survivor sits apart with open hands"); `{cast:survivor}` carries them on the two bands
where the name earns something. In the `critical_failure` overview —
*"`{cast:survivor}` takes them by the arm and walks them off it"* — both pronouns refer to
the **agent**, who is "they" throughout the packet, and the survivor is the sentence's
named subject, so there is no ambiguity once the token renders a name.

One note carried into the revised file: the *design block* uses "them" of the survivor in
its C10 answer. That is agent-facing text and singular *they* is not gendering, so it
breaks no rule — but the draft's stated device is stricter than the rule, and holding the
device in the design block too is what stops the next reader (Pass 3, Pass 4) from
reintroducing a pronoun into prose. Rewritten for consistency.

**Poles.** The parent's fork is `mercy_ruthlessness` with poles *hold the road and let them
past behind you* / *break the pursuit before it arrives*. I read every line asking "could
this be false under either pole?":

- No line names who started the fight, who won it, whether a pursuit arrived, or whether the
  agent held anything. ✅
- No line assumes the agent was present for the fight. The spine's *"The fighting stopped a
  while ago and nothing has moved since"* is an observation of the ground, not a memory. ✅
- `the other survivor` is true under both poles (the one who could not fight, or the one who
  stood beside the agent), true whether the agent fought or arrived after, and true when the
  binding does not inherit and this template spawns its own. This is the load-bearing choice
  and it is correct. ✅
- **One line failed**: the `wayside` opening's *"The fight went off the track and into the
  open"*. It asserts the fight's course — not scene-local, not inherited, and contradictable
  by the parent's own prose. Fixed to *"Trampled ground leads off the track…"*, which is the
  ground testifying, which is the device.

**Bare `?spawn=` reading.** ✅ With no parent at all, every line still reads: the ground is
described, the survivor is spawned from this template's own spec, the count is short, and
nothing refers to an event the player did not see. The one prose risk was the wayside line,
now fixed. There is a *mechanical* risk at bare spawn that is not a prose problem and is
flagged to Pass 3 — see the widened § 8.4(b) in the revised file: `secret_discovery` and the
`$target` anchor both resolve through `action.targetId`, and a bare `?spawn=` firing may
supply a target that is the hero themself or a location, in which case `createSecretEdge`
refuses and traces. That is a runtime-feasibility question, which is Pass 3's lane, but it
belongs in the packet where Pass 3 will see it.

---

## 8. Branch seduction, branch count, scale, anchors, aftermath, dilemma energy

**Branch count.** `KEEP 0`. This is a `Single Test` and the batch design fixes it as one of
the two 1-step encounters. The mortal-decided fork is the parent's job; doubling it here
would make the pair two forks in a row instead of a fork and its consequence. The draft
argues this in § 0 question 6 and the argument is right.

**The god's fork, which is the one that exists.** Both stances are genuinely seductive and
neither is safe:

- *Let them say the count out loud* — the truth enters the world. The god buys a country
  that knows its dead are not staying put, and pays for it by having a mortal say so out
  loud. Interference fantasy: **you want the world to know.**
- *Let them carry the count alone* — nobody argues, nobody has to be told, and the mortal
  spends themself instead. Interference fantasy: **you want this to stay yours.**

Both protect something real (the world's honesty vs. the mortal's standing and the god's
own quiet), both cost, and the labels are interactive-plain with no gap between what they
promise and what they do. Post-swap the asymmetry is *better* than it was, because the two
stances now write genuinely different things — an omen versus an erosion — rather than two
flavours of divine attrition.

**Scale discipline.** ✅ Short, 1 step, compact aftermath. Five `byOutcome` bands is above
the floor of three but well inside short scale, because each band is one paragraph.

**Aftermath payoff.** ✅ Actor-centred, with names and faces. `{cast:survivor}` is named on
the two bands where it lands hardest; the secret chip names both endpoints; the grief chip
names the person carrying it; no chip reports a quantity the player cannot look up. Reaction
choices are offered at short scale and earn their place — the swapped `omen` family needs a
stance to hang on, exactly as the `thread` family did.

**Dilemma energy.** ✅ Real. The tension is not "will they succeed" but "what does a true
account cost, and who gets to hear it". The `critical_success` reveal — the missing one got
up and walked, and someone watched and said nothing — is a genuine turn that recontextualises
the whole scene, and it is designed for rather than improvised: the `secret_discovery` write
is what makes it a fact rather than a flourish.

**Inspiration anchor honesty.** ✅ The `death_and_return` hook actually changed the
encounter. Read through `eye` at the table floor it stopped being a resurrection scene and
became an accounting scene, and the whole premise falls out of that. The draft's § 0d
argument is not retrofitted.

**Concept art direction.** ✅ Two-question method, and evocative rather than illustrative.
The plate — a row of covered dead, one gap, one flat empty cloak, a blade set point-first —
shows residue and absence, no fight, no faces, no second human likeness. It is the best art
direction in the batch and needs no change.

---

## 9. Experience Differentiator Gate — 14 answers

1. **Opening inside a moment already in motion?** **YES.** All four arrive after the event:
   a firepit already kicked apart, tracks already through the ash, flies already there, a
   door already banging with nobody going up to it.
2. **Prose has its own voice?** **YES.** Short declaratives against longer ones, a deliberate
   flatness that is the scene's texture, three dry closers and no more.
3. **Scene names the elements that become choices?** **YES.** The ground, the dead, the
   survivor, the dropped blade, the empty place — all in the spine, all acted on by a card,
   a chip, or the reward draw.
4. **Reader feels something from prose alone?** **YES.** The spine's last sentence, with no
   mechanics attached.
4b. **No seam echoes?** **Six found and fixed** (§ 2). Clean in the revised file.
5. **Card faces library-generic, zero scene-bespoke prose?** **YES**, and five of six are the
   library's own authored faces verbatim.
6. **Every effect line states mechanism, every price real?** **YES after two rewrites**
   (§ 1a, 1b). Five cost essence; the sixth costs 0 and is priced by the trait.
7. **Every card pays off in failure?** **YES.** Six cards, six failure-band fragments; no
   big-delta card, so the both-bands rule does not fire.
8. **Every card grounded in the scene?** **YES.** Delete the ground, the dead, the survivor
   and the blade and every card is senseless here.
9. **Cards answer different questions?** **YES.** Will-to-look · completeness-of-search ·
   comparison-against-known-ground · steering-the-after · planting-for-later ·
   seeing-people-not-numbers. On the two Boosts, which is the argued pair: I accept the
   draft's case. *A Little More* buys the **will** to keep looking, *A Sudden Surge* buys the
   **completeness** of the search, and the fragments prove the distinction rather than assert
   it — a steady reader who stops at the easy bodies fails differently from an exhausted one
   who turns them all over, and both failure fragments say which failure it was. That is the
   test the rule actually asks for.
9b. **Full authored hand on every nudge-bearing step; no step picks a branch or ending?**
   **YES.** One step, one hand of six, no `authoredChoices`.
10. **Aftermath has its own prose?** **YES.** A `fallback` overview plus five band overviews,
    each saying only what it alone can say.
11. **Consequences actor-centred with names and faces?** **YES.**
12. **Reaction choices?** **YES** — two, offered at short scale, and they carry the swapped
    `omen` consequence.
13. **Reactions are philosophical stances?** **YES** — see § 8.
14. **Concept art residue, not illustration?** **YES.**

**All 14 YES; 4b, 5 and 6 are YES only in the revised file.**

---

## 10. REVISE-trigger sweep — all 31 run

Fired: **11.** Every one is field-local and fixed inline.

| # | Trigger | Verdict |
|---|---|---|
| 1 | No approach prose | clean — n/a, no branch cards; the hand is fully authored |
| 2 | Generic god-verbs | clean |
| 3 | No thread integration | clean — the divine thread is the framing of both stances; the `thread_*` *effect* is a separate matter, resolved by the swap |
| 4 | Missing reaction choices (medium+) | clean — offered anyway at short |
| 5 | Reporter prose | clean |
| 6 | Missing/illustrative art direction | clean |
| 7 | Hand outside 4–8 | clean — 6 |
| 8 | <4 spheres or no ungated common | clean — 4 spheres, 1 ungated common (see § 3 call 1: this is why the `long_game` one-off is forced) |
| 9 | Nudge with no failure fragment / big-delta missing a band | clean |
| 10 | An uncovered `StepOutcome` band | clean — all six |
| 11 | Digit or `%` in an `effectLine` | clean |
| 12 | Trait hook skipped or dead ref | clean — four answers written; `trait.core.core_warmth.virtue` is a seeded Core definition |
| 13 | Nudge payoff in base band text | clean |
| 14 | An option that instructs the mortal | clean |
| **15** | **Any detector hit** | **FIRED ×2** — `way` in the Whisper `near_miss` fragment; `thing` in `short.something_gave`'s `detail`. Fixed. |
| 16 | Scene-bespoke prose on a card face | clean |
| **17** | **Effect line states mood not mechanism** | **FIRED** — the Omen card. Fixed; the Long Game tightened alongside. |
| 18 | No envelope / class with no opening / class scenery in the spine | clean |
| 19 | Two riders, or a rider with no comment | clean — zero riders |
| 20 | Zero-essence non-trait card, or a grant naming unbuilt content | clean — all four grant shapes verified against the live unions (`HiddenMarkCategory`, `IntelligenceCategory`, `OmenCategory`, `EmittedOmenScope`) |
| 21 | Two encounters in a family with identical type composition | clean — the batch design pre-allocates distinct budgets |
| **22** | **Seam echo** | **FIRED ×6** — (A)–(G) in § 2. All fixed. |
| 23 | Static authored factor line | clean |
| 24 | Agent as bystander | clean — the arithmetic is in the agent's hands |
| 25 | Announced outcome mechanics in scene prose | clean |
| **26** | **Design-block breach** | **FIRED ×2** — (i) the `thread_weaken` write is declared in the § 4 mechanics table and cannot fire, so a declared mechanic went unused; resolved by the swap. (ii) the `success_at_cost` chip's declared condition write does not exist on that band. Both fixed. |
| 27 | Title fails the glance test | clean |
| 28 | Missing or verbose crux | clean |
| 29 | Unreadable compression | clean — no sentence needs two readings |
| 30 | Shape invented on the fly | clean — `Single Test`, one step, matches the catalog and the batch design |
| **31** | **Invented game state in base prose** | **FIRED ×1** — the `wayside` opening asserted the fight's course, which is neither scene-local nor inherited. Fixed. |

Plus, outside the 31 but inside the Composition Contract: **four chips declaring no
`concepts`** (§ 4i) and **one live Law 56 rule-0 violation** (§ 4ii).

**Why this is not a REVISE verdict.** The trigger list is written as non-negotiable, and I
have counted honestly rather than talked the count down. But every fired trigger here is a
*field-local* defect with its replacement text already written: two lexicon words, six
paragraph seams, one effect line, one opening clause, one chip's backing, one missing
schema field. None is the structural class the REVISE verdict exists for — there is no
missing hand, no reporter prose, no missing art direction, no bystander agent, no invented
shape, no branch that fails to earn its place. Pipeline v2 merged editorial and revision
into one pass precisely so this class is fixed rather than bounced, and the local precedent
(`road-ambush-editorial.md`, which fixed a repeated image as a Must Fix under
PASS WITH REVISIONS) reads it the same way. Bouncing a packet this well-designed to a
re-draft would throw away the § 8.3 pole contract and the design block to fix eleven
sentences.

If the orchestrator reads the trigger list more strictly than I have, the fix list in § 11
is the complete re-draft brief and the revised file is the finished article either way.

---

## 11. Revision summary

### Must fix — all applied in `one-body-short-revised.md`

1. **Consequence swap `thread` → `omen`**, recorded with its mechanism-naming reason;
   `thread_weaken` removed; `emit_omen` authored on the `short.say_the_count` reaction,
   **unchipped**, with its words in the reaction's `intent` and `narrativeHook` rather
   than in a band overview (see § 3 call 4 for why an overview cannot carry them); the two
   `emit_omen` sites differentiated so they are not one omen twice.
2. **`concepts` declared on all five chips**, every one anchored by `entityId`, none by a
   `tooltipId` — the placeholder `ui.narrative_log` is gone.
3. **`success_at_cost` grief chip backed on its own band** via band-level `reactions` that
   re-declare both stances with `condition_attachment` appended.
4. **Two detector hits removed** — `way` (Whisper `near_miss`), `thing`
   (`short.something_gave` `detail`).
5. **Six seam echoes rewritten** — (A) `critical_failure` hands, (B) `critical_success`
   read-the-ground/drag-marks, (C) "The account closes." twice, (D) `success` one-death
   restatement, (E) "The count came out." in two `success_at_cost` fragments, (F)
   turning-over-faces, (G) "The count closed, and…" in two `success` fragments.
6. **Omen `effectLine` rewritten** to state mechanism; **Long Game `effectLine`** tightened.
7. **`wayside` opening** rewritten so the ground testifies rather than the fight being
   narrated — the pole-agnosticism fix.
8. **`failure` overview** and the two abstract-noun fragments rewritten on plainness move 2;
   **`success` overview** rewritten on move 1.

### Should fix — applied

9. § 2's seam table widened from four seams to eighteen, so the next reader inherits the
   wider audit rather than the narrower one.
10. § 13's detector self-scan corrected, with the `overview`-is-`scene` /
    `detail`-is-`outcome` classification recorded so it is not re-missed.
11. § 14's self-audit corrected: the open surface was never two items.
12. Design-block Q1 and C10 rewritten to hold the no-pronoun device and to stop asserting
    the agent was present at the fight.
13. Hand audit gains a row recording that five of six faces match their library members
    byte-for-byte.
14. § 8.4(b) widened to cover the bare `?spawn=` target case, not only the inherited one.
15. § 10's two `blocked-primitive` rows resolved — the thread row deleted with the family,
    the secret row left flagged because its dependency on row 4 is real.

### Consider — recorded, not applied

16. **Trigger 22's wording is too narrow.** It says "across a paragraph boundary" and the
    pipeline's guidance names `opening→spine` and `spine→band`. Three of this packet's six
    echoes were between two card fragments on the same band, or between an afterimage and
    its band overview — surfaces that render together but are not "paragraph boundaries" in
    the authored file. Suggest the orchestrator widen the trigger to "any two authored
    strings that can render on the same ending". Not fixed here; it is a skill change.
17. **A `secret.*` tooltip concept is worth registering.** Four families in the consequence
    draw (`secret`, `knowledge`, `story_seed`, `drive`) have no tooltip prefix, so any chip
    about them must anchor by entity and leave the concept unexplained. A small
    `ui-content.ts` addition would serve the whole corpus.
18. **A `card.long_game.signature.darkness` library member** is the natural home for this
    card's face. Out of scope for this batch (brief § Out of scope); recorded in the revised
    file's § 4 for the library owner.

---

PASS WITH REVISIONS
