# Encounter Pipeline: The Unclaimed Relic

> Scale: short (Single Test) | Slug: the-unclaimed-relic | Pass: editorial
> Date: 2026-08-24 | Pipeline version: 2.0 (line: Encounter Factory v3)
> Batch: border-perils (THR-1221), row **3** · templateId `encounter.border.the_unclaimed_relic`

**Read for this review:** the draft packet in full · `agents/editorial-prompt.md` ·
`reference/nudge-authoring-spec.md` (all 1,359 lines) · `SKILL.md` § *Automatic REVISE
triggers* (31) · `Docs/canon/encounters.md` · `Docs/canon/prose.md` ·
`Docs/plans/encounters/border-perils-brief.md` · `…-batch-design.md` § *3 · The Unclaimed
Relic* · `src/data/__fixtures__/nudge-exemplar/swollen-ford-exemplar.ts`.

**Source files opened directly, not taken on trust:** `src/data/artifact-templates.ts` ·
`src/engine/nudgeGrantLiveness.ts` · `src/engine/encounterAftermath.ts` ·
`src/types/unifiedAction.ts` · `src/data/nudge-card-library.ts` ·
`src/data/encounter-image-library.ts` · `src/data/condition-trait-content.ts` ·
`src/data/core-trait-content.ts` · `src/types/coreRegistry.ts` ·
`src/data/reward-attachment-catalog.ts` · `src/data/default-support-bundles.ts` ·
`src/types/npc.ts` · `src/data/encounters/vertical-slice.ts` ·
`reference/anchor-catalog.generated.md`.

---

## 0 · Headline

This is a good encounter and a genuinely well-researched packet. The design block was
written first and it shows: the reach was chosen before the scene, the scene grew from
the reach, and the ring of dropped gear at a fixed radius is the best single image the
batch has produced — it does the haunting's job without a face, and it is the *reason*
`stone` is the honest test. Every id in the packet resolves against live source; I
re-verified nineteen of them and found no rot.

What it does **not** have is a clean seam pass, and the draft's own seam table declared
one. The table checks `opening → spine` and `spine → afterimages` and stops there — so it
never looked at the two seams where this packet actually repeats itself: **base band text
→ card fragment** (they render in the same paragraph) and **step afterimage → aftermath
overview** (they render seconds apart, in order). At the `failure` band the afterimage and
the overview are the same sentence with one word changed. That is the flattest reading in
the packet and it sits on the band the player will see most often.

Five REVISE-trigger instances fired across four distinct triggers. All are sentence-level.
None requires redrafting, so this is the normal path.

**Verdict: PASS WITH REVISIONS** (stated formally at the end).

---

## 1 · The three recorded judgment calls — independent second opinions

The draft asked for these to be judged, not ratified. I judged them against source and
reached the author's conclusion on all three — but not by their reasoning in two cases,
and one of their supporting arguments is wrong in a way worth recording.

### JC1 · Hook drift — the cold with a radius instead of a haunting with a face

**Ruling: legitimate, and it improved the encounter. Ratified.**

The rule half is not in doubt. `nudge-authoring-spec.md` § *The Plot-Hook Draw* is
explicit and unusually emphatic: *"The hook is a starting point, not a contract — and this
is the one hard difference from the Consequence Draw… Drifting a long way from the hook
you took is allowed and ordinary; the encounter that comes out is judged as an
encounter."* What is mandatory is recording the roll, and the draft records both
`plotHookRolled` and `plotHookTaken` and commits to stamping `usedBy`. Nothing here is
even close to a breach.

So the only live question is the one asked: did the drift drain the threat?

The author's two reasons are both true but both defensive — a revenant is placeless at
three of four declared classes, and `stone` can only honestly resolve against something
you outlast. I'll add the reason that actually makes the drift *correct* rather than
merely permitted: **a face turns the scene into a negotiation, and a negotiation is not
what `stone` tests.** Give the thing a will and a voice and the encounter immediately
wants to be `veil` (read it), `heart` (talk to it) or `iron` (fight it) — every one of
which is a different encounter, and two of which the batch has already allocated
elsewhere. The cold is the only antagonist under which *"how long can a pair of hands stay
closed"* is the real question. The drift is not a retreat from the hook; it is the hook
surviving contact with a fixed design, which is exactly what the authoring-order ruling
asks for.

Did it drain the threat? **No, and I checked this specifically because "not grim" tone
is the standing excuse for a toothless encounter.** The failure side has real physical
menace and it lands in verbs, not adjectives: *"the cold went up their arms and put them
on the ground"*, *"did not get up on their own"*, hauled clear by the collar. A thing that
can put you down is a threat. And the unease the haunting would have carried is recovered,
at zero cost to the physics, by the one line in `fallback.overview`: *"it will be here
tomorrow, and the day after, and it will be exactly this cold."* Frost lying at a radius
nobody set, identical every day, is the haunting — it just declines to have a face. No
change required.

### JC2 · No `trait_card`; the hook rides a `TraitVariant` with an authored `factorLine`

**Ruling: genuinely satisfied, not skipped. Trigger 12 does not fire.** All four
questions are answered in writing with reasons, which is the whole of what step 5 demands
(*"'No hook' is a valid answer, written down. Silence is not."*).

Liveness verified rather than assumed. `trait.core.core_humility.vice` is real:
`src/types/coreRegistry.ts:151` declares continuum `core_humility` with `vice: { word:
'Proud' }`, `src/data/core-trait-content.ts:72` builds ids as
`` `trait.core.${continuumId}.${pole}` ``, and `CORE_TRAIT_DEFINITIONS`
(`core-trait-content.ts:106`) flat-maps the registry into seeded nodes. The vice flavor
the draft quotes — *"Stands at the center of their own world, and corrects the horizon"* —
is verbatim at `core-trait-content.ts:59`. Not on any dead list.

The Q3 reason is also verified true and is a *shared* constraint rather than a local
preference, which is the right kind of reason to decline on: the batch design allocates
`trait_card` to rows **2** and **5** only (`border-perils-batch-design.md:140` and `:171`),
and row 3's hand budget is exactly `cache` / `insurance` / `boost` (≤2) / `undertow` /
`balm` (`:150`) — which the draft uses exactly, and only.

**I set out to correct the Q4 answer and the schema proved me wrong, so I am recording
that rather than the correction.** The draft says a trait fragment has nothing to key on
with no trait card in the hand; my first read was that a fragment keys on the *trait*, not
the card, so the reason was false. It is not. `TraitVariant`
(`src/types/unifiedAction.ts:1630`) carries exactly five fields — `traitId`,
`forecastDelta`, `difficultyDelta`, `factorLine`, `addNudgeIds` — and **no band-prose
surface**. A trait-keyed band fragment is only reachable through `addNudgeIds` unlocking a
card whose own `bandProse` then renders. With no trait card there is, literally, nothing
for a trait fragment to key on. The author's answer is correct as written and I am leaving
it untouched.

One genuine improvement, applied: the `factorLine` is the packet's *only* authored factor
surface and the only pre-roll place the trait becomes visible, so it is carrying more than
its 11 words suggest. *"Being Proud, they will not leave what others could not carry."*
names its source inside the sentence (canon rule 1), is variance-by-construction (THR-892),
and fits the step's action precisely. Kept verbatim. It is the best line of its class in
the batch.

### JC3 · One reaction per band rather than a reaction fork

**Ruling: structurally correct, and I verified the mechanism rather than accepting the
argument. Ratified — with one honesty correction to how the draft reports it.**

The claim to test was: two rival reactions would make every band chip conditional on the
pick and break Law 56. I read the aftermath types. `AftermathOutcomeOverride`
(`src/types/unifiedAction.ts:1903–1913`) carries `changes?` **and** `reactions?` as
*siblings* — chips are scoped to the **band**, not to the reaction. So a band with two
reactions renders its `changes` regardless of which reaction the player picks, and any
chip whose backing effect lives in only one of them is a false claim on the other branch.
That is precisely the `shell_state`-over-empty-`effects` pathology rule 0 exists to kill.
**The author's reasoning is sound and the mechanism confirms it.**

I looked for a middle path and there isn't a good one. Chipping only the
step-metadata-backed consequences and leaving the bond change unchipped would buy a
reaction fork at the price of hiding a real write from the player — worse. So one
reaction per band, each carrying that band's writes, is the correct structure at this
scale, and the aftermath requirements do not object: trigger 4 and gate question 12 are
both explicitly conditioned on **medium+**, and this is `short` (a rarity-1 `Single Test`).

**The correction.** The draft answers gate question 13 — *"do the reaction choices
represent philosophical stances?"* — with a **YES**, defended by pointing at how the god's
stance varies *across* the five bands. That is an overclaim wearing a pass. The player is
offered exactly one button on any given run and therefore never makes a stance choice at
all; what varies across bands is authored variation the player cannot elect. The
structure is right and the reason for it is right, so the honest answer costs nothing —
and a packet that claims a gate it structurally cannot present is the evidence-integrity
failure I care most about catching. Rewritten in the revised file to say what is true.

---

## 2 · The artifact spawn — verified against both source files

**Ruling: CONFIRMED on every count. The `templateId` omission is correct, deliberate, and
documented by the gate itself. The reward is not hollow.** This is the strongest piece of
research in the packet and the author's citations are exact, including the line numbers.

**Claim 1 — `ARTIFACT_TEMPLATES` is three cosmic-tier legendaries.** True.
`src/data/artifact-templates.ts:45` exports the array; it holds exactly three entries —
`worldforge_anvil` (`:48`), `heartseed_first_garden` (`:98`), `voidgate_shard` (`:159`) —
and **all three are `tier: 4`** (`:50`, `:100`, `:161`). `src/engine/nudgeGrantLiveness.ts:84`
builds the checked set as `artifact: new Set(ARTIFACT_TEMPLATES.map((t) => t.id))`. So the
author's dilemma is real and complete: any reward-catalog possession named in
`spawn_artifact.templateId` fails liveness, and the only three ids that pass hand a
rarity-1 open-draw encounter a tier-4 legendary.

**Claim 2 — a category-only spawn is the gate's own documented no-rot shape.** True, and
the quoted comment is verbatim. `nudgeGrantLiveness.ts:116–119`:

```ts
case 'spawn_artifact':
  // `templateId` is optional — a category-only spawn picks at runtime and
  // names nothing that can rot.
  return effect.templateId ? [{ kind: 'artifact', ref: effect.templateId }] : [];
```

The author cited "around lines 116–119" and it is 116–119 exactly.

**Claim 3 — shipped vertical-slice precedent.** True.
`src/data/encounters/vertical-slice.ts:2394` mints The Crossroads Gift as
`{ kind: 'spawn_artifact', category: 'talisman', targetAgentId: '$actor',
messageOverride: … }` — no `templateId` — under a THR-1164 comment at `:2376` recording
the same reasoning. Two further category-only spawns at `:2485` and `:3914`.

**Field validity.** Every field the draft writes exists on the live type
(`src/types/unifiedAction.ts:717–734`): `category`, `tier`, `nameOverride`, `tags`,
`targetAgentId`, `targetLocationId`, `messageOverride`. `ArtifactCategory`
(`:360`) is `weapon | talisman | relic | tome | vessel | key | mundane` — `'relic'` is a
live member. The draft's own FLAG 3 is right that the wiring guide documents four dead
field names; the packet correctly follows the type over the guide.

**The one thing the author did not check, which I did, and which resolves in their
favour.** The effect declares no `tier`, and the type comment on that field reads
*"Override template tier. **Determines node type and edge kind.**"* — so the omission is
not cosmetic, it decides whether the agent gets a common artifact or a bonded legendary,
which is the exact reward-economy question the author was trying to control. I traced it:
`src/engine/encounterAftermath.ts` resolves `const saTier: ArtifactTier = effect.tier ??
'common';` and then `const saActorEdgeType = saTier === 'legendary' ? 'bonded_to' :
'possesses';`. **With no `tier`, the spawn resolves `common` and takes a `possesses`
edge** — which is exactly the right economy for rarity 1, arrived at by default. The
omission is safe, and it is now safe *for a recorded reason* rather than by luck. Added to
the revised packet's § 15.

**Is the reward hollow?** No, and this is worth stating plainly because "no template id"
sounds like "no content". `spawn_artifact` mints a real graph node — `type: 'artifact'`,
a real node id, `properties.category`/`tier`/`tags`/`sourceEncounterId`, a `possesses`
edge to the agent, and a chronicle event. It is anchorable and **linked** per the anchor
catalog (`artifact` → 🔗 linked, `visualKind: 'artifact'`), it appears in the agent's
possessions, and `{artifact:any}` enrichment can reach it afterwards. The batch design's
ask for row 3 was *"a real object with a real id"*. It gets one.

**The rejected alternative was correctly rejected.** `reward_relics_talismans_heart_of_the_barrow`
would indeed have passed liveness, and the author's two grounds for declining it — tier 3
with `lossCondition: permanent` distorting a rarity-1 payout, and a `#ruins`-honest tag
set and flavor that is placeless at `wayside` and `battlefield` — are both correct. The
second is the one that decides it: a four-class envelope cannot ship a prize that only
reads at one class.

---

## 3 · The hard checks, each reported individually

### Player-as-god

**PASS.** No option instructs the mortal; none picks between authored endings; no
`authoredChoices` anywhere. Every `effectLine` is influence on the fabric of the scene or
the mortal's inner weather — *"You let the wanting run out ahead of the caution"* (inner
weather), *"You turn up what an earlier hand set down… and put it where they will find
it"* (matter). The Undertow shifts values through `valueDrift`, which the schema is
explicit shifts unconditionally and selects no branch, and the draft's reasoning for
declining `poleLean` on a fork-less step is correct — `poleLean` argues a fork the mortal
is already deciding, so it would be an inert field here.

The hand also passes the *other* half of the rule, the one THR-1178 added and hands
routinely fail: it is not authoring a twelve-sphere game in one sphere's vocabulary. Five
spheres are represented and they reach into different substrates — matter (a tool), life
(a fear lifted), darkness (a desire let off its leash), energy (a pulse of heat), order (a
floor bought). Only two of the six causes are physical.

**Divine outcome-authorship detector: zero.** No `decides`/`chooses`/`picks`/`determines`
followed by `whether`/`what`/`which`/`who`/`if` + clause, and no bare "the outcome", in any
authored field. One near-miss in packet documentation, not in a prose field: § 5 reads
*"What the god can do is decide **how long the hands last**"*. `how` is deliberately
outside the match set (the spec records that an earlier pass matched it and flagged two
correct lines), so this passes the detector — but it is the god as author of a result,
which is what rule 5b bans in spirit. Softened to *press on* in the revised file, because a
packet should model the verb it will be read for.

### The communication pivot

**PASS, verified against source rather than taken on trust — and the author's claim is
exactly true.** All six faces are the library's own authored faces, verbatim from
`CARD_CONTENT` in `src/data/nudge-card-library.ts`:

| `libraryCardId` | src line | `title` | `quote` |
|---|---|---|---|
| `card.boost.core` | 557 | A Little More | Most things fail by a margin. |
| `card.insurance.signature.order` | 587 | By The Book | Rules exist so the worst case has a name. |
| `card.undertow.signature.darkness` | 599 | The Easier Way | It works. That is the problem. |
| `card.cache.signature.matter` | 607 | Left Behind | Matter keeps its promises longer than people do. |
| `card.boost.signature.energy` | 611 | A Sudden Surge | Bodies hold more than they admit. |
| `card.balm.signature.life` | 615 | It Passes | Most suffering ends. This one ends sooner. |

Six for six, character for character. Titles are 2–3 words. **Zero scene-bespoke prose on
any face** — no face names a relic, a ring, a cold, tongs or frost, and every one passes
the genericity test on its own terms. Trigger 16 does not fire.

Every `effectLine` states mechanism and closes on a magnitude phrase, matching the
exemplar's convention (*"A small help."* / *"A real help."*). **No digit and no `%` in any
effect line** — checked all six. Trigger 11 does not fire.

One observation worth carrying forward, not a finding here: `CARD_CONTENT`'s header
comment says *"`imageTag` is deliberately absent throughout: the image library has no card
rows to bind to."* The library declines to bind art; the packet binds it per hand. That is
correct under the spec's Images step (`imageTag` is a per-card authoring field) and the six
tags all resolve — but it means card art is *not* yet shared per library member the way the
pivot describes. A batch-report note, not this encounter's defect.

### Hand rules

**PASS on every clause.**

| Rule | Status |
|---|---|
| 4–8 authored cards | **6** ✓ |
| ≥4 distinct spheres | **5** — matter, order, darkness, life, energy ✓ |
| ≥1 ungated common (sphere-less) option | **1** — `card.boost.core`, no `sphere` ✓ |
| ≤1 rider | **1** — `floor_at_cost` on `relic.by_the_book` ✓ |
| Rider carries a justifying comment | ✓ — and it is a *real* one, see below |
| Trait-only cards at cost 0 | N/A — no trait card in the hand |
| Zero-essence non-trait card priced on another channel | N/A — every card charges 1–3 essence ✓ |
| Grants name built content | 2/2 live ✓ |
| ≥3 distinct card types | **5** ✓ · `boost` ≤2 → exactly 2 ✓ |
| Every card sets `libraryCardId` | 6/6 ✓ — the brief's ask, carried |

**The rider justification exists and is not decorative.** It gives the mechanical reason
(order's signature buys the floor, not the ceiling, priced at the hand's essence ceiling
because it converts both plain failure bands into a paid arrival) *and* the
anti-duplication reason (a Gambit or a Mercy would answer *what shape does the outcome
take* a second time, and the batch budget allocates neither here). That is what the
checklist asks for. Trigger 19 does not fire.

**Grant liveness, both re-verified.** `reward_tools_instruments_iron_tongs` is
`src/data/reward-attachment-catalog.ts:870` — tier 1, tags `#stone #tool #craft`, passive
`+0.03` stone, `stat_contribution` stone `0.25`, `lossCondition: 'breakable'`, flavor
*"Blacksmith's tongs, well-used. The handles are polished smooth by grip."* — every
detail the draft cites is exact. `trait.condition.terrified` is
`src/data/condition-trait-content.ts:175`. Both are in the sets `validateNudgeGrantRefs`
checks. Trigger 20 does not fire.

**The two-Boost defence holds.** Card 1 buys *duration* and is the sphere-less floor every
god can afford; card 6 buys *a burst against the named opposition* — heat, aimed at cold,
at one instant — and is sphere-gated and priced higher. A god holding `energy` faces a
real decision between a bigger single moment and a longer one. That is the exemplar's own
Steady Breath / A Break of Light pattern (same verb, different physics) applied
correctly. No two cards buy the same certainty.

### Failure payoff

**PASS.** Every one of the six cards carries at least one failure-band fragment. The
big-delta card is the Undertow at `forecastDelta: 0.16`, over `NUDGE_BIG_DELTA` (0.15),
and it covers **both** `failure` and `critical_failure` as required. The Insurance card
puts its failure fragment on `critical_failure`, which is correct and not a convenience:
`floor_at_cost` erases `failure` and `near_miss` while active, so `critical_failure` is
the only reachable failure band with it in play — the spec names this case explicitly and
the draft got it right. Triggers 9 does not fire.

All six `StepOutcome` bands are covered between the fragments — `critical_success`
(Undertow, Boost energy) · `success` (Boost core, Balm) · `success_at_cost` (Insurance,
Boost energy) · `near_miss` (Cache, Balm) · `failure` (five cards) · `critical_failure`
(Insurance, Undertow). Trigger 10 does not fire.

**Cool failure at every band: PASS, and this is the packet's best design decision after
the ring.** The `failure` band's argument is *the player loses the relic and gains a
person* — two strangers who failed at the same thing in front of each other, wired as a
real `bond_change`, not as a consolation sentence. `critical_failure` inverts it: the
rescue is real and it costs the relationship, because being hauled out by the collar is
not something either of them wanted. Neither reads as punishment. Nothing here needs
softening.

### Base-text independence

**PASS.** I read all five afterimages and both `narrativeTemplates` against the six cards.
No tongs, no bought floor, no pulse of heat, no lifted fear appears in any base surface.
Every band reads correctly with the empty hand, which is the test. Trigger 13 does not
fire.

### Static factor lines (THR-892)

**PASS.** `factorLines` is unauthored, and the draft records *why* — the two lines an
earlier pass wanted (*"the iron does not warm"*, *"the ring is three paces out"*) read
identically every run, so they are priced into `difficulty: 0.42` and carried by prose.
That is the litmus test applied correctly. The single authored factor surface is
`TraitVariant.factorLine`, which is variance by construction. A one-step encounter has no
`carryoverFactorLines`, so this is the complete set. Trigger 23 does not fire.

### Register

**PASS, with one correction applied.** Baseline throughout; the peak-eligible surface
(this being the final and only step, its band prose qualifies) is deliberately declined,
which is right — *"peak-eligible means permitted, not required."* Names, effect lines,
the factor line, the purpose line and all five reaction labels are interactive-plain with
no metaphor. Reaction labels say what the click does.

**The gothic-drift check the brief's cold-and-ruin material invites: passed.** I read for
it specifically. There is no ornament: no "ancient evil", no "unhallowed", no darkness
doing adjective work. The cold is described by what it does to a hand in about ten counts.
The register the packet actually lands is dry and physical — *"chafing warmth back into
both hands"*, *"frost welded along the jaws"*, *"swore about it the whole way"* — which is
the anecdote tone the batch design asked for. Tone: not grim. Confirmed.

The correction is the Balm's `success` fragment, which opens *"Unafraid, they took their
time about it…"* — an adjective phrase ahead of the subject, which is exactly the
inversion plainness move 1 names (*"Subject first — never open on a fragment"*). Rewritten.

### The three plainness moves, every paragraph

**Move 1 (subject first): one violation, fixed.** The Balm `success` fragment above. Every
opening, the spine, the initiation, all five afterimages, both narrative templates and the
remaining fragments open on a subject. Two of my own overview rewrites had to be redrafted
mid-review for the same fault (*"Three paces clear of the ring…"*, *"There is a fresh pack…"*)
— recorded because it shows the pull is real.

**Move 2 (concrete nouns for abstract): one, fixed.** The `initiation` closes *"and the
thing waits for whoever comes next."* `thing` is a natural indefinite and therefore legal
in scene class, so no detector fires — but the relic was named one sentence earlier and
`the relic waits` is both plainer and stronger. Traded.

**Move 3 (one dry line, not two): PASS as drafted.** I hunted for the doubled ironic turn
and the draft is disciplined about it — *"and that was decent"*, *"the thorn wall has gone
grey"*, *"there is one more pair of hands that could not hold it"* each stand alone on
their beat. My `critical_failure` overview rewrite initially stacked a second turn and I
cut it before it landed.

**Move 4 (density, THR-1130): PASS, and the draft is honest about how it got there.** One
named person on stage, props only where the player can act on them. The inspiration table
records cutting an earlier pass's *previous* claimant mentioned by the *present* one — a
third party naming a fourth, the exact Grateful Kin failure. That cut was correct and the
scene is legible at game speed because of it.

### Detectors

**Vagueness, outcome class (evasive AND natural indefinites at zero): ONE HIT. Trigger 15
fires.**

> `success_at_cost` overview — *"The other claimant is already going through the dropped
> packs for **something** clean to wrap a hand in."*

`something` is the outcome-hider: **evasive, not merely indefinite, and banned in every
field class** — an aftermath overview is outcome class besides. This is the plainest kind
of detector hit and it would have failed `check:encounter`.

What makes it a finding rather than a typo is that the draft's § 9 asserts the opposite in
detail: *"Checked across all five afterimages, both `narrativeTemplates`, every band
fragment, every `overview`… no `something`…"* — naming `every overview` specifically, and
naming `something` first in the banned list. A self-audit that claims a sweep it did not
run is worse than no sweep, because the next pass trusts it. Fixed, and § 9 rewritten to
record the hit and its repair rather than repeat the false claim.

I re-ran the full sweep by hand across every outcome-class surface. That is the only hit.
Scene class (evasive only) is clean — `nothing has been burned`, `used by nobody`,
`Someone else is already here`, `nothing crosses it` are all natural indefinites in scene
setup, which THR-899 explicitly legalized, and the draft is right not to contort around
them.

**Annotation clauses: 0 against a budget of 1. PASS.** One em-dash construction in the
whole packet (the `stronghold` opening's *"— the boots on the wall walk come that far and
turn back"*) and it is not a negation, so it matches neither `notButClause` nor `emDashNot`.
No "not X but Y" anywhere. The draft's arithmetic is right.

**Divine outcome-authorship: 0.** Reported under Player-as-god above.

**Abstraction-as-subject spot check (by hand, not regex): PASS.** Subjects across the
packet are `a cart track`, `half a hall`, `the field`, `the fort's yard`, `the relic`,
`the air`, `packs and a dropped boot`, `their grip`, `the tongs`, `the heat`, `{cast:claimant}`.
Concrete subjects act. The two closest to abstract are *"The cold gave it up"* and *"The
cold won the argument"* — but the cold is this scene's antagonist and a physical presence
with a measured radius, so it is a concrete subject doing concrete work, not mood
narrating itself.

### Seam echoes — the class the detectors cannot see

**FAIL as drafted. Trigger 22 fires twice.** This is the review's main finding and the
draft's seam table has a structural blind spot: it checks `opening → spine` (×4) and
`spine → afterimages`, and stops. Those are the seams a *drafting* agent thinks about. The
two it never checked are the two where surfaces render **together**.

I checked every seam. Named individually, as asked:

| Seam | Verdict |
|---|---|
| `wayside` opening → spine | ✓ *"the thorn wall has gone grey"* → *"The relic sits where it was left"* — no shared image, no shared shape |
| `ruin` opening → spine | ✓ the draft caught and fixed a `pulls`/`pulls` verb echo here pre-submission; the repaired *"a steady draught crosses the doorway"* is clean |
| `battlefield` opening → spine | ✓ the draft caught and fixed an `iron`/`iron` noun echo here; *"wet clay and old rot"* is clean |
| `stronghold` opening → spine | ✓ chill recurs as a different image (flags underfoot vs heat leaving a hand); sentence shapes differ |
| spine → afterimages | ✓ deliberate hand-to-hand rhyme, shapes differ. The draft's own verdict, and I agree |
| **base failure text → Cache `failure` fragment** | ✗ **ECHO.** *"The relic sits where it sat"* against *"and the relic sat where it sat"*. These render **in the same paragraph** — base text then fragment. Near-identical phrasing, one tense apart |
| **`failureAfterimage` → `failure` overview** | ✗ **ECHO, the worst in the packet.** *"Their grip opened before the count ran out, and the relic dropped back into its own frost"* against *"Their grip opened before the count ran out and the relic went back into its own frost."* One word changed |
| **`criticalFailureAfterimage` → `critical_failure` overview** | ✗ **ECHO.** *"They went down beside it"* repeated verbatim as the opening clause; `hauled` repeated |
| **`successAtCostAfterimage` → `success_at_cost` overview** | ✗ **ECHO.** *"They came out with it and left skin on the iron"* against *"They came out of the ring holding it and left skin behind on the iron"* |
| **`successAfterimage` → `success` overview** | ✗ **ECHO (milder).** `got it up` / `It came up`, `got clear` / `got clear`, `hands dead to the wrist` / `Their hands stayed shut` — three collisions in two sentences |
| **`criticalSuccessAfterimage` → `critical_success` overview** | ✗ **ECHO (milder).** Both open *"They lifted it…"* |
| exemplar corpus echo | ✓ the draft caught two of its own fragments reproducing Swollen Ford mannerisms and rewrote both. Independently re-checked against the fixture: clean |
| chip → chip, within a band | ✗ **ECHO ×2.** On `success_at_cost` both chips carry *"the iron kept what it touched"*; on `critical_failure` both carry *"They had to be dragged clear of it"* — verbatim, rendering side by side |

The afterimage → overview family is systematic across **all five bands**, and it matters
more than its individual severity suggests, because those two surfaces are not far apart
in the reading — the step's afterimage lands, the encounter resolves, the aftermath
overview is the landing. The player reads them seconds apart, in order. Hearing the same
sentence twice is the flattest possible ending, and at `failure` — the band a rarity-1
open-draw `stone` test will produce most often — it is the same sentence.

**A one-step encounter has fewer seams and therefore no excuse.** The draft says so
itself. All five overviews rewritten; the Cache fragment rewritten; both duplicated
causeClauses differentiated.

### Single Test honesty

**PASS, and this is the packet's quiet strength.** The shape is named from the catalog
(`Single Test`) and the step structure matches it: one plain step, `reach: 'stone'`,
numeric difficulty, a `narrativeTemplate`. `failBehavior: 'fail_action'` is the honest
setting for a lone step. Nothing is padded — there is no second step wearing a first
step's job, no invented investigation gate, no forked ending pretending to be a fork.
Trigger 30 does not fire.

**And it carries the full Composition Contract. There are no exemptions (ruling 3), and
one step is not a licence to owe less.** Verified block by block against
`compositionContract.ts`'s requirements: Steps ✓ · Hand (one nudge-bearing step, 6 cards)
✓ · Setting (four classes declared, four openings, `locationSubtypes` derived via
`expandSettings`) ✓ · Cast (one explicit actor binding; every `{cast:claimant}` token
names the declared key) ✓ · Rewards (`spawn_artifact` on step success plus `bond_change`
and `condition_attachment` in band reactions — all `PERSISTENT_EFFECT_KINDS`, nothing that
only prints) ✓ · Aftermath (`aftermathConfig` present; **five** `byOutcome` bands against a
floor of three, covering success-side, failure-side and both extremes; every variant
carries an `overview`; every change declares `concepts`) ✓ · Systems (3 from the authored
manifest — `cast`, `rewards`, `conditions`) ✓ · Images (six tags, all resolving) ✓.

The Systems count sits exactly at the floor, deliberately, so the batch's other rows carry
`reputation`, `factions` and `seeds`. I checked that this is the brief's allocation and
not an author's shortcut: the brief assigns faction standing to rows 1 and 6 and the
sequel seed to row 4, and explicitly names the *"uniform trait + reputation_tally +
condition_attachment + encounter_seed + hidden_mark stack"* as the corpus reflex to avoid.
Sitting at 3 with a clean manifest is compliance, not minimalism.

### Prose rule 7

**PASS.** No base-prose sentence asserts a relationship, debt, prior visit or standing the
graph does not hold. The initiation's *"Nobody who has come here has carried it out"* is
about the place, not the agent. The claimant is introduced as a stranger and every
relationship the packet claims is **produced** by an effect (`bond_change`) rather than
declared in narration. The four motive hooks are recorded in the design block and asserted
in none of the prose. Trigger 31 does not fire.

The Balm's face is worth singling out: it assumes only what any Balm target has — a fear
in the moment — and asserts no history. The draft notes this is the correction the
exemplar's critique pass forced on *its* Balm, applied here at authoring time. That is the
right way to consume a prior critique.

### Envelope — the specific way a four-class envelope fails

**One breach found. Trigger 18 fires.**

The spine is genuinely class-neutral — I read it for it — and reads identically under all
four openings: no mill, no rook, no chalk, no ditch, no room. And the *hard* part is done
well. A relic lying unclaimed for years inside a swept, manned fort is the case that
usually breaks this envelope, and the `stronghold` opening earns it properly: *"This
corner is used by nobody. Someone chalked a line across the flags and nothing crosses it —
the boots on the wall walk come that far and turn back, and the sweepings pile against the
chalk."* That is a garrison that has decided, institutionally, to walk around something.
The `wayside` opening does the same work with the cold fire-pit. Both are exactly the
labour a four-class envelope demands and most drafts skip.

The breach is in outcome prose, which is where this envelope was always going to fail
because band fragments are setting-neutral by construction and get written last:

> Boost (energy), `critical_success` — *"The heat arrived and they moved as if the cold
> were not **in the room**."*

There is no room at a `wayside` hollow and no room on a `battlefield` slope. Rewritten to
*"as if the cold had never touched them."* This is the only instance; I checked all
fourteen fragments, five afterimages, two narrative templates, five overviews and eight
chip details for class scenery and found nothing else.

### Cast

**PASS.** One actor binding (`claimant`), which satisfies the Cast block; every
`{cast:claimant}` token names that declared key; `spawnName` is a real name (`Orin Vask`),
not a role phrase, which matters because a declared key always resolves and that string is
what renders when no live NPC is reused.

**Gender: clean.** I read every sentence that touches the claimant — ten of them — and not
one carries a gendered pronoun. The prose is written *around* it rather than dodging it:
*"chafing warmth back into both hands"*, *"and that was decent"*, *"got a hand in their
collar"*. This is the discipline the spec asks for and drafts routinely miss.

**Roles readable at all four classes — verified against source, not against the draft's
table.** `scout`, `ranger` and `mercenary` are not the author's guesses; they are the
shipped defaults' own reuse roles. `src/data/default-support-bundles.ts:518` gives the
`ruin` default `reuseNpcRoles: ['scout', 'ranger']`; `:576` and `:586` give `battlefield`
two specs reusing `['commander','marshal']` and **`['mercenary','quartermaster']`**; the
`fort` roster in `src/types/npc.ts` seeds `scout` (0.8) and `mercenary` (0.7); the
`wilderness` roster (`npc.ts:318`) seeds `ranger`. Every declared class has at least one
binder and no role is placeless at any of the four. The named counter-example the spec
teaches — the exemplar's rural-honest, wayside-placeless *miller's boy* — is avoided.

`delivery: lazy-materialize-on-trigger` with `persistence: must-persist` is the correct
pairing and the reasoning is right: four of five bands write `bond_change` against
`$cast:claimant`, and a `pre-seeded` spec that stays unresolved would silently no-op the
effect, leaving a BOND chip claiming state nothing wrote — a Law 56 violation arriving
through the cast door.

### Law 56 — every chip, every anchor, checked against the generated catalog

**PASS. All nine authored chips are backed by a write that fires on the band the chip
renders on.**

| Band | Chip | Backing write | Fires on this band? |
|---|---|---|---|
| `critical_success` | `relic.crit.prize` (BOON · item) | `successMetadata.effects` → `spawn_artifact` | ✓ step success |
| | `relic.crit.told_them_how` (BOND · growth) | band reaction → `bond_change` | ✓ |
| `success` | `relic.success.prize` | `successMetadata` → `spawn_artifact` | ✓ |
| | `relic.success.watched_ground` (SCAR · trait) | band reaction → `condition_attachment` w/ `targetLocationId` | ✓ |
| `success_at_cost` | `relic.cost.prize` | `successMetadata` → `spawn_artifact` | ✓ — `isStepSuccess` counts this band |
| | `relic.cost.left_skin` (SCAR · trait) | band reaction → `condition_attachment` | ✓ |
| `failure` | `relic.fail.the_fear_stayed` (SCAR · trait) | `failureMetadata.effects` → `apply_condition` | ✓ |
| | `relic.fail.two_who_failed` (BOND · growth) | band reaction → `bond_change` | ✓ |
| `critical_failure` | `relic.crit_fail.the_fear_stayed` | `failureMetadata` → `apply_condition` | ✓ |
| | `relic.crit_fail.held_off` (BOND · growth, loss) | band reaction → `bond_change` | ✓ |

No `shell_state`-over-empty-`effects` chip. No `reputation_tally` chip (Law 13 parity). No
chip at variant level, so nothing renders on a band whose reaction did not fire.
`EncounterAftermathChangeKind` (`src/types/unifiedAction.ts:176`) is `growth | trait | item
| reputation | faction_reputation | reputation_tally | shell_state | future_hook` — the
packet's `item` / `trait` / `growth` are all live members, and `growth` carrying
`category: 'bond'` is the correct pairing given no `bond` kind exists.

**Anchors, each verified against `anchor-catalog.generated.md`:**

- `$actor` → actor/`individual` → 🔗 **linked**, `visualKind: 'agent'`. ✓
- `$cast:claimant` → actor/`individual` → 🔗 **linked**, `visualKind: 'agent'`. ✓
- `trait.condition.terrified` / `.wounded` → attachment/`condition` → 🔗 **linked**,
  `entityId` = the **template** node id, `visualKind: 'attachment'`. The packet uses the
  template id, which is what the catalog specifies. ✓
- `$target` → `location` → 📍 **named**, `entityId` = the location node id, **no
  `visualKind` member exists**. The packet declares it with no `visualKind`, exactly.
  The draft's defence of this is correct and worth keeping: `named` satisfies Law 56 as
  fully as `linked`, and *"Do not fold a chip merely because its anchor cannot be
  clicked."* ✓

**The location chip's `under_watch` write does fire on its band.** `trait.condition.location.under_watch`
is live at `src/data/condition-trait-content.ts:323` with description *"Someone is keeping
eyes on this place. Quiet work here is harder and more likely to be seen"* — quoted
verbatim by the draft — and a duration entry at `:414`. `condition_attachment` accepts
`targetLocationId` (`src/types/unifiedAction.ts:650–654`, THR-1143, *"Put it on a place
instead of a person"*). The write sits in the `success` band's sole reaction, and with one
reaction per band it is unconditional on that band. ✓

The draft's FLAG 1 — whether `$target` binds to a location for the `encounter.border.*`
family — is correctly flagged rather than assumed, and its proposed remedy if it does not
(bind the location through the support bundle, *not* soften the chip) is the right
instinct. Carried forward to Pass 3 unchanged.

**One claim corrected.** The self-audit says the packet's anchors span *"Four kinds, three
of them not `individual`-only."* Both halves are wrong. `$actor` and `$cast:claimant` are
both actor/`individual` and therefore **one** anchor kind, so the packet spans **three** —
agent, attachment, location — of which **two** are not agent. The brief's actual ask
(*"Avoid defaulting to: `individual` agents as the only anchor kind"*) is comfortably
carried by the location and attachment anchors, so the correction costs the packet
nothing. But an inflated count in a self-audit is exactly the kind of number a batch
report copies forward. Fixed.

**Chip sentences, rule 0c (state first).** `a bond warmed` / `a bond soured` / `a place
under watch` / `Terrified` / `Wounded` all name the mechanic and read as game state at a
glance. `the relic in their possessions` is the weakest — it leads with fiction — but
`possessions` is the mechanic and it is legible, and the `stateNoun` field is not
enriched, so no placeholder risk. Details name their endpoints via `{actor}`, `{target}`
and `{cast:claimant}`. Acceptable as drafted.

### Title glance test and crux

**Both PASS.** *The Unclaimed Relic* — a player reading only the title knows there is a
valuable thing and knows nobody has it. That is the objective and the complication in
three words, with no poetry in the tunnel. Compare the spec's failing example, *The Held
Commission*. Trigger 27 does not fire.

The crux is one plain sentence from the agent's situation: *"The relic is lying in the
open where anyone could take it, and the cold that has stopped everyone else from carrying
it out is still there."* Who, what, and the vibe; no second sentence needed. It runs long
at 28 words but it is one clause-pair and reads on the first pass. Trigger 28 does not
fire.

### The agent is not a bystander

**PASS.** The agent is the one reaching in, in every band. The claimant is at the edge of
the ring and is never the subject of the scene — they watch, they do not interfere, and on
one band they perform a rescue *on* the agent. `whose problem is this` is answered
correctly in the design block and the prose holds to it. Trigger 24 does not fire.

Trigger 25 (announced outcome mechanics) also does not fire, though the `initiation` sits
near the line: *"Take it and it is theirs, to sell or to keep. Leave it, and the road is a
road again by nightfall."* That is engage/decline stakes, which checklist C9 and D12
actively require the initiation to state — not pass/fail band framing. It stays.

---

## 4 · Remaining prompt sections

**Prose quality.** Above the batch floor and, in the openings, above the exemplar's. The
`stronghold` opening is the best paragraph in the batch so far — a chalk line, sweepings
piling against it, boots that come that far and turn back — and it does the envelope's
hardest work as scene rather than as explanation. The weakest surfaces before revision
were the aftermath overviews, and precisely because they were written as restatements of
the afterimages instead of as their own beat. Rewritten, they now do the job an overview
is for: land somewhere the step's last image did not.

**Branch seduction / branch count.** N/A by shape — `Single Test`, zero branches, which
`SKILL.md` § Scale Enforcement permits at `short` (0 or 2; 1 is invalid). Nothing to cut.

**Scale discipline.** `short` = 1–2 beats. One beat. Compact aftermath. Matches.

**Inspiration anchor honesty.** The anchors did real work, and one of them is auditable
rather than asserted: the THR-1130 density row records an actual cut (a named previous
claimant mentioned by the present one), and the exemplar row records two fragments
rewritten off Swollen Ford mannerisms. I checked both against the fixture. Honest.

**Aftermath payoff.** Lands, and is actor-centred — *"{cast:claimant} thinks better of
them for it, and says so"*, *"{cast:claimant} pulled them out and has kept a stride
between them since"*. Names and faces, not anonymous deltas.

**Dilemma energy.** The tension is a duration question the player can restate in one
sentence — *how long do they stay in reach of it?* — and the six cards genuinely answer
different questions about it. Divine posture is revealed by which certainty the god buys:
the Undertow player and the Insurance player are different gods.

**Concept art direction.** Present, and evocative rather than illustrative — a ring of
abandoned gear photographed from above with the centre empty. It shows residue and
absence, no people, no relic, no action, and the radius is the subject. Image-doctrine
compliant: no human likeness, no second face, no caption text, no UI element, no retired
mechanic encoded. Trigger 6 does not fire.

**Experience Differentiator Gate.** All fourteen answered. Thirteen stand as drafted;
question 13 is rewritten for honesty (JC3 above) and question 4b's answer is replaced,
since the seam check it claims to have passed is the finding of this review.

---

## 5 · Trigger tally

**Five instances across four distinct triggers.** All sentence-level; none structural.

| # | Trigger | Instance |
|---|---|---|
| 1 | **15** — detector hit | `something clean to wrap a hand in`, `success_at_cost` overview |
| 2 | **22** — seam echo | base `failure` text → Cache `failure` fragment, same paragraph |
| 3 | **22** — seam echo | afterimage → band overview, all five bands; near-verbatim at `failure` |
| 4 | **18** — class scenery outside the openings | *"as if the cold were not in the room"* |
| 5 | **29** — needs two readings | *"The tongs found the ring of it"* — collides with the established ring of dropped gear |

Triggers **1–14, 16–17, 19–21, 23–28, 30–31 do not fire.**

---

## 6 · Revision summary

**Must fix — applied inline in the revised file**

1. `success_at_cost` overview: `something clean` → `a clean rag`. Detector hit.
2. All five band overviews rewritten so none restates its own afterimage. The `failure`
   pair was one word apart; the new overview instead pays off the ring image the design
   block promised at question 7 — the agent's own pack is now on the ground with the
   others.
3. Cache `failure` fragment: no longer repeats the base text's *"sits where it sat"*; now
   pays the tongs' `breakable` loss condition instead.
4. Cache `near_miss` fragment: the second, colliding *"ring"* removed.
5. Boost (energy) `critical_success` fragment: *"in the room"* removed — class scenery in
   setting-neutral outcome prose.
6. Balm `success` fragment: subject-first (plainness move 1).
7. Both duplicated `causeClause` pairs differentiated — `success_at_cost` and
   `critical_failure` each had two chips carrying the same clause verbatim, side by side.
8. § 9's vagueness sweep rewritten to record the hit and its repair instead of asserting a
   clean run it did not have.
9. § 17's anchor count corrected: three kinds, two of them not agent — not four.
10. Gate question 13 answered honestly: one reaction per band means no stance choice is
    presented; the structure and its Law 56 reason are kept.
11. § 6's seam table extended with the two seam classes it did not check, and their
    verdicts.

**Should fix — applied**

12. `initiation`: *"the thing waits"* → *"the relic waits"* (plainness move 2).
13. § 5: the god *presses on* how long the hands last, rather than *decides* it (rule 5b
    framing; passes the detector either way, but the packet should model the verb).
14. `success` chip `causeClause`: *"a witness who will not keep it"* → *"…will not keep
    quiet"* — the original parses two ways.
15. § 15: the verified `tier` default recorded (`effect.tier ?? 'common'` → `possesses`
    edge), so the omission is safe for a reason rather than by luck.

**Consider — not applied, for Pass 3**

16. FLAG 1 (`$target` location binding for `encounter.border.*`) carried forward unchanged.
    It is correctly flagged and its stated remedy is right.
17. FLAG 2 (`allAftermathEffects` coverage of step metadata) carried forward. The Rewards
    block is satisfied twice over, so it cannot fail — but the grep is worth one minute.
18. FLAG 3 (wiring-guide drift on `spawn_artifact` field names) is real and confirmed
    against the live type. It is a separate pass, as the draft says.
19. Card art: `CARD_CONTENT` deliberately declares no `imageTag`, so per-hand tags do not
    yet give a library member one shared image. Batch-report observation, not a defect
    here.

---

PASS WITH REVISIONS
