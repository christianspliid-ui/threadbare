# Encounter Pipeline: The Drowned Archive
> Scale: medium (3 steps) | Slug: `the-drowned-archive` | Pass: final
> Date: 2026-08-25 | Pipeline version: 3 (Encounter Factory)
> Status: **READY WITH CAVEATS**

---

## Pipeline Summary

| Pass | Verdict | Notes |
|------|---------|-------|
| Draft | Complete | Full three-step delve packet; step 1 shipped handless with a justification the systems pass later struck. |
| Editorial | PASS WITH REVISIONS | Fixed a cross-slot seam echo, wired a dangling `valueDrift` axis, made step 2 actually test `veil`, rewrote 25 prose defects — but its own replacement argument for the handless step (a batch-brief policy mistaken for a hard rule) was itself wrong. |
| Systems | READY WITH CAVEATS | Struck editorial's Ruling A and built the missing third hand (§ 7, § 9 below): the sphere/member "exhaustion" was computed against a self-imposed batch-brief table, not against `checkNudgeHand`'s actual per-hand, per-template arithmetic. Full audit: `Docs/plans/encounters/the-drowned-archive-systems.md`. |

### Caveats / Blockers

None blocking. One documentation correction carried into this packet: the trait variant's factor
line (§ 10) is template-wide at the engine level (`TraitVariant` carries no step index), not
step-1-exclusive as earlier drafts claimed — the claim is corrected below rather than the
(harmless) line itself. Two pre-existing engine/corpus findings are unchanged from the revised
file and remain filed for the batch report, not this template (§ 17, findings 3-4).

### Editorial Notes Summary

Editorial (fresh-context critique agent) re-verified every id in the draft, found all of them
live, and applied ten must-fix revisions: three P1 openings rewritten for a cross-slot seam echo
with slot 1; P2 rewritten to remove a duplicated "two men went down" beat and replace it with the
keeper's own failed attempt; step 2's spine gained "spoken as the record spells it" so the step
actually tests `veil` instead of restating step 1's Eye result; `valueDrift` wired onto two cards
that had declared the `revelation_discretion` axis with no carrier; four card faces de-scened;
five reaction labels rewritten off an identical *Let…* construction; the planted `encounter_seed`
made visible in its own band's overview; assorted afterimage/carryover/overview repairs. Verdict:
PASS WITH REVISIONS. Full detail: `Docs/plans/encounters/the-drowned-archive-editorial.md`.

### Implementation File Map

- **Create:** `src/data/encounters/the-drowned-archive.ts` — the full `UnifiedActionTemplate`
  literal below, wrapped in `compileOpeningEnvelope({...})` per § 4.
- **Modify:** `src/data/unified-action-templates.ts` — import and register, following
  `the-unclaimed-relic.ts`'s pattern.
- **Modify:** `src/data/content-eval/plotHooks.ts` — stamp `usedBy` on `hook.dangerous_truth`.
- **No engine changes required.** Every effect kind, card type, unlock kind, and node type this
  packet uses is already live.
- Closeout evidence: paste `check:encounter`'s recomputed `consequenceDraw` output (should read
  `['relationship', 'knowledge']` at reach `shadow` rarity 2 with the recorded `movement →
  knowledge` swap) once the template compiles.

---

## 1. Mechanical design block (spec step 1 — written before a word of prose)

One line per row.

| # | Question | Answer |
|---|---|---|
| 0 | **Crux** (agent's POV) | The record that settles who owns this ground is under rising water, and the thing that has been keeping it will only give it up for a true answer. |
| 0b | **Title states the crux** | *The Drowned Archive* — a player reading only the title knows the objective and the complication: records, under water. |
| 0c | **Shape** | **Puzzle – Investigation – Resolution** (3 steps) |
| 0c | **Setting** | `ruin` · `arcane` · `sacred` (all three, one opening each) |
| 0c | **Pressure** | `secret` (primary); `succession` as undertone |
| 0c | **Form** | `reveal` |
| 0c | **Objective** | `solve` |
| 0c | **Stakes** | `intel` — learn who / where / what; surface = the intelligence system |
| 0c | **System** | `cards` (mature tier) — all three steps now nudge-bearing: four cost channels, six real grant kinds, a type debut in every step, a rider each in two of three hands |
| 0d | **Hook** | `hook.dangerous_truth` — *"A record has surfaced that contradicts the founding story everyone here organizes their life around."* Stamp `usedBy` on this hook in `src/data/content-eval/plotHooks.ts` when the encounter ships. |
| 1 | **Whose problem?** | The agent's, by adoption. They came in out of the rain; the vault is going under while they stand there and they are the only person present with no claim on the ground. The rolled role is **bystander pulled in**, and the design honours it by making the agent's uselessness to either side the exact reason they are asked. They are not a spectator: all three tests are theirs. |
| 2 | **Reach per step, and why it is the theme** | Step 0 `shadow` — get down into the vault without the dark below hearing them: Shadow *is* hidden action. Step 1 `eye` — read waterlogged shelves and know which page matters: Eye *is* knowledge and judgment. Step 2 `veil` — stand in front of a thing that keeps its own law and give it what its law requires, **in the form its law requires**: Veil *is* supernatural perception and rite. All three chosen before a word of prose. |
| 3 | **Why is the agent here?** | `chance` — the road passed a ruin, a tower or a sanctuary in a hard rain (the open-draw case). `choice` — they stay and go down when asked. `divine` — the god put the place in front of them. `mission` is not asserted anywhere in the prose. |
| 4 | **Mechanics and objects in play** | Trait variant (`trait.core.core_integrity.virtue`) and the trait-only card it unlocks · two carryover maps, six bands each · conditions (`cursed`, `terrified`, `grieving`, `wounded` as the Balm's target) · one location condition (`under_watch`) · one attachment grant on a card · one intelligence record on every aftermath band · one clue edge · **three** bond edges (was one — see § 12) · one planted compulsion per hand that carries one (two total) · one omen · one seed · one favor debt · one assigned ambition · **two `valueDrift` axes, each with a carrier**. Classification of every fact the prose states about the agent's connections: **all scene-local**. The prose asserts no history, debt, standing or prior visit — it explicitly says the agent has *no* claim here, which is a negative and mints nothing. Every durable fact is written by this encounter. Prose rule 7 satisfied by construction. |
| 5 | **Rewards and where the tension sits** | The prize is **information**, and the ladder is how much of it survives: the whole charter and where the older grant was filed (`critical_success`), the charter (`success`, `success_at_cost`), one name (`failure`), one line (`critical_failure`). Penalty side is concrete and legible: a curse on `success_at_cost`, `Terrified` on `failure`, the whole record destroyed on `critical_failure`. Quintessence stakes are moderate — this scene can cost a reputation for judgment, never a life. Tension sits on step 2: they have read it, and the thing on the ledge decides whether it leaves. **Where the clock lives, stated rather than assumed:** the rolled `threat` shape is realized in three places — the water advances across the three step spines (rising vault → at the bottom of the box → between the stair and the water), `failBehavior: 'continue_weakened'` on both early steps makes lost ground compound forward with the twelve carryover lines as its readout, and `critical_failure` destroys the record, so P3's stated terminal consequence sits on the ladder rather than only in the prose. What is *not* modelled is any tie between elapsed ticks and the water level; that is engine work, and this encounter does not pretend otherwise. |
| 6 | **Does the mortal choose?** | **None — this is a test.** No fork, no `decidedBy`, no branch. Two value axes the scene *tilts*, **each with a real carrier**: `honesty_cunning` (Shadow's own pair — the warden asks for a true name and a false one would serve) is carried by the Undertow's `valueDrift` against the trait card's opposite pull; `revelation_discretion` (Eye's own pair — bring it into the open or keep it under) is carried by the Veil's `valueDrift` toward Sentinel on step 0 and the Heavy Hand's toward Seeker on step 2. The hand carries pole-leaning cards so the god has levers on the mortal's inner weather, never on the outcome. |
| 7 | **Every promise pays off** | The opening promises three things and each has its designed reveal: *the page that floated up* → step 1's bands say whether it was torn from the charter and step 2's aftermath mints the record; *the warden* → stated as fact in P2, shown in step 1's spine sitting on the ledge and not moving, and step 2's whole test; *the rising water* → it is the clock, and it takes the record on `critical_failure`. No mystery is opened that a band does not close. |
| 7b | **The gate has a hand.** | Every prior pass treated step 1 as deliberately handless — the god watches while the mortal reads. Systems pass ruled that reasoning over-strict (see § 7 below): nothing in `checkNudgeHand` or the Composition Contract forbids the fourth distinct sphere this hand needed, once sphere availability is measured against what the *batch* actually dealt rather than against a self-imposed policy table. Step 1 now carries a 5-card hand — the god shifts the odds of the reading; it is never handed the answer. |
| 8 | **Systems touched (counted from the authored manifest)** | **4** — `cast` (support bundle) · `rewards` (`spawn_clue`, `attachment_grant`, `favor_creation`, `assign_ambition`, four `condition_attachment` writes — all `PERSISTENT_EFFECT_KINDS`) · `conditions` (four `condition_attachment` writes across the bands) · `seeds` (one `encounter_seed`). Target ≥4 met; contract floor is 3. `reputation` and `factions` are deliberately untouched (brief § Anchors), so the quota is **not** reached on the corpus-reflex stack. |

**Difficulty and reachability.** `intrinsicTier: 'background'` ⇒ open draw ⇒ every step sits at or
under `NUDGE_OFF_REACH_MAX_DIFFICULTY` (0.45). Step 0 `0.38` → **fair**. Step 1 `0.42` → **fair**.
Step 2 `0.44` → **fair**. No step is gated to actors who hold its reach, so the open-draw branch of
the reachability rule is the one honored (`fair` band is `[0.30, 0.45)`, `DIFFICULTY_WORD_BANDS`).

---

## 2. Catalog picks (closed vocabularies — one entry each, nothing invented)

```
shape:     Puzzle – Investigation – Resolution
setting:   ruin, arcane, sacred
pressure:  secret  (undertone: succession)
form:      reveal
objective: solve
stakes:    intel
system:    cards
hook:      hook.dangerous_truth
```

Every pick differs from slot 1 (`Test & Consequence` / `greed`+`fear` / `discovery` / `recover` /
`item` / `carryover`) except the setting envelope, which the brief fixes for both.

---

## 3. Rolled constraints (Seed Dice), and where each one lands

| Die | Rolled | Where it lands in the finished encounter |
|---|---|---|
| 1 — stake shape | **threat** | P3 is the clock and nothing else: *"The water is rising. By dark it will be over the shelves, and the rest of the record is gone."* One shape, not compounded. The ask lives in `initiation`, so P3 stays pure threat. Its mechanical home is stated in § 1 row 5. |
| 2 — opposition | **the uncanny** (motive: **its own law**), activity: **waiting** — a recorded override, brief § deviations | The warden. Stated as fact in P2, shown in step 1's spine *sitting on the ledge and not moving*, and step 2's whole test. Its law is stated outright: it lets nothing out unless it is told the name of whoever the records were left with, spoken the way the record spells it. Waiting is its posture on every band. |
| 3 — disposition | **neutral** | Stated as a fact rather than softened or sharpened: it has harmed no one and it has let nothing out. It never attacks; it also never helps. |
| 4 — agent's role | **bystander pulled in** | The agent came in out of the rain. `initiation` says why they and not somebody local: *"{cast:keeper} cannot ask anyone with a claim on this ground to go down."* Not a helpful passerby volunteering — a stranger asked *because* they are useless to both sides of the quarrel. |
| 5 — scale | **settlement** | What the charter says decides whose ground the whole settlement stands on. `ActionScale` has no `settlement` member (`'cosmic' \| 'regional' \| 'local' \| 'personal'`), so the schema value is `'local'`; see § 17 finding 4. |

Consequence hand: `consequenceDraw: ['relationship', 'knowledge']` with
`consequenceSwap: { from: 'movement', to: 'knowledge' }` — **binding, the one swap already taken by
the brief.** § 12 shows where each family is wired in context.

---

## 4. Setting envelope

```ts
settings: ['ruin', 'arcane', 'sacred'],
locationSubtypes: expandSettings(['ruin', 'arcane', 'sacred']),
// = ruins · ruined_tower · ruined_city · ruined_village · unexplored_poi · tower · shrine · temple
```

Compiled with `compileOpeningEnvelope(...)`, which prepends the `{frag:opening}` token to step 0's
`narrativeTemplate`. Never hand-write `locationSubtypes`.

### The three openings (P1 — arrival only, one per declared class)

```ts
openings: {
  ruin:   '{name} gets out of the rain at the ruins of {location}.',
  arcane: '{name} waits out the storm at the tower of {location}.',
  sacred: '{name} takes shelter from the rain at the sanctuary of {location}.',
}
```

One sentence each, agent and place both drawn from the graph, and the weather on the page — the
weather is load-bearing, because the rain is why the vault is filling and the filling is the clock.
`sacred` says *sanctuary* rather than *temple* so it reads at a wayside shrine as well as a temple;
`arcane` expands to `tower` alone, so *tower* is exactly honest; `ruin` covers five subtypes and
*the ruins of* reads at all five.

**Batch-level construction check (Pass 2, editorial finding 1).** Slot 1's three P1s use *comes to
/ arrives at / stops at*; these three use *gets out of / waits out / takes shelter*. **Zero verb
overlap**, and no two of these three share a root.

### The setting-neutral spine (P2 + P3), on step 0

> There {they} find the record vault under water. A page floated up this morning: the founding
> families never owned this ground. {cast:keeper} went down as far as the water and turned back. A
> warden sits in the dark below.
>
> The water is rising. By dark it will be over the shelves, and the rest of the record is gone.

No class scenery: no altar, no orrery, no fallen column. The vault, the water, the page, the keeper
and the warden are the encounter's own furniture and read identically at a ruin, a tower and a
sanctuary. Every settlement keeps its records somewhere, and every somewhere in this envelope has a
cellar.

**Word count with the longest P1** (`sacred`, 11 words): 11 + 39 + 20 = **70 words**. Budget 80. ✓

**The cost already paid is the keeper's own failed attempt.** The warden is **stated as a fact**
rather than encoded as hearsay, which is Doctrine v2's rule zero and the foreshadow-never-announce
reversal; and the encounter contains **no measured count anywhere**.

---

## 5. Cast (Composition Contract, ruling 6)

```ts
const keeperSpec: EncounterSupportActorSpec = {
  kind: 'actor',
  key: 'keeper',
  delivery: 'lazy-materialize-on-trigger',
  persistence: 'must-persist',
  reuseNpcRoles: ['acolyte', 'monk', 'chaplain'],
  supportRole: 'record_keeper',
  spawnNpcRole: 'scribe',
  spawnName: 'Sennet Ryle',
};
```

**Class honesty, checked against `LOCATION_ROLE_ROSTERS` (`src/types/npc.ts`).** A three-class
envelope inherits no family default bundle (THR-1044), so this template declares its own. Of the
eight subtypes the envelope expands to, only `shrine` and `temple` carry rosters, so reuse can
only ever fire at `sacred` and the other two classes always spawn. Every `reuseNpcRoles` entry is
therefore drawn from what `sacred` actually seeds: `acolyte` (shrine 0.6, temple 0.9), `monk`
(temple 0.8), `chaplain` (temple 0.7) — re-verified live at `src/types/npc.ts:299-301,341`.
`spawnNpcRole: 'scribe'` is a spawn shape rather than a roster claim, and a scribe reads correctly
at a ruined hall, a tower and a sanctuary alike.

Deliberately disjoint from slot 1's `['pilgrim', 'hermit', 'oracle']` / `spawnNpcRole: 'wanderer'`,
so the two encounters in one batch cannot bind the same person twice at a `sacred` draw.

`spawnName` is a real name because a declared key always resolves (THR-696) and `{cast:keeper}`
renders this string whenever no live NPC was reused. **The prose never genders the keeper** — reuse
binds whoever is standing there, and every sentence about them is written around pronouns.

`persistence: 'must-persist'` is load-bearing rather than habitual: the keeper receives a
`bond_change` on three bands and a `condition_attachment` on `critical_failure`, and (new in this
pass) a `favor_creation` grant from step 1's hand — three distinct persistent-consequence writes
onto the same cast member, all of which `castTargetViolations` would reject against a bind-only
spec. A cast member collected at scene end would take those writes with them.

Token placement: role-voiced inline is the default; the token lands only where the name earns
something — the spine's own failed attempt, the `initiation` ask, and four band overviews. One
named person on stage per beat; the founding families, the watcher and the warden all stay unnamed,
which is what each of them is: a body of claimants, a posted function, and a thing with a law
instead of a name.

---

## 6. Step 0 — `shadow`, "Go down unheard"

```ts
reach: 'shadow', difficulty: 0.38, duration: { min: 1, max: 2 },
purposeLine: 'Go down unheard',
failBehavior: 'continue_weakened',
onSuccess: [], onFailure: [],
// no factorLines (variance rule) · no carryoverFactorLines (first step has no predecessor)
// no successMetadata / failureMetadata — step 0's mechanical consequence IS the carryover
```

`continue_weakened` is the shape: a loud entry does not end the encounter, it hands step 1 a worse
starting position, which is exactly what step 1's `carryoverFactorLines` then reports. Because step
0 never ends the action, **all six of its bands are reachable from step 1**, which is why the
carryover map below is complete rather than truncated. It is also where the encounter's clock
actually lives mechanically: ground lost here compounds forward.

No authored `factorLines`. Everything an earlier draft would have listed reads identically on
every run, so it is priced into `difficulty: 0.38` and carried by the prose.

### The spine

See § 4. The `{frag:opening}` token is prepended at compile time; the two paragraphs above are the
`narrativeTemplate` value.

### The five afterimages

| Band | Afterimage |
|---|---|
| `criticalSuccessAfterimage` | `They came down the stair without a sound. The warden never looked up.` |
| `successAfterimage` | `They got down. The noise carried, and the warden looked up once.` |
| `successAtCostAfterimage` | `Their lamp and most of their kit went into the water on the way down.` |
| `failureAfterimage` | `They went in loud, and the warden has been watching them since.` |
| `criticalFailureAfterimage` | `They went off the last of the stair into black water and came up loud and seen.` |

`near_miss` has no afterimage field by design; the hand's fragments pay it off (§ 9).

---

## 7. Step 1 — `eye`, "Read the shelves"

```ts
reach: 'eye', difficulty: 0.42, duration: { min: 1, max: 2 },
purposeLine: 'Read the shelves',
failBehavior: 'continue_weakened',
onSuccess: [], onFailure: [],
nudges: STEP_1_HAND,   // see § 9 — five cards, no longer undefined
```

### Why this step now carries a hand — the systems ruling

**The draft's and editorial's justifications for a handless step were both struck, in sequence,
and this pass is where the fix actually lands.**

The draft argued an Eye gate must be handless so the god cannot *buy* the clue. Editorial correctly
struck that: a card shifts the odds and fate still picks the outcome — a nudge on an Eye gate buys
no more certainty than a nudge on a Stone gate buys the relic in the calibration case. Editorial
then built a replacement argument — that the batch's card budget makes a fourth hand
mathematically impossible — and that argument is *also* wrong, for a specific, checkable reason:
it computed sphere and member "exhaustion" against `Docs/plans/encounters/deep-places-brief.md`'s
own self-authored over-exposure table, not against what the code actually enforces.

`checkNudgeHand` (`src/data/content-eval/nudgeHandChecklist.ts`) evaluates
`HAND_SPHERE_COVERAGE_MIN` and `HAND_COMMON_OPTIONS_MIN` strictly over `step.nudges` — **one
step's own array.** It carries no memory of what any other step, or any other encounter in the
batch, has dealt. Re-deriving actual batch-wide sphere usage (full derivation:
`the-drowned-archive-systems.md` § 0) found **three spheres — `order`, `force`, `spirit` — dealt
zero times anywhere in this two-encounter batch**, each signing exactly one card type
(`favor`/`insurance`, `heavy_hand`, `kindled_ambition` respectively). Three of the required four
distinct spheres are available with **zero** deviation from any brief instruction. A fourth
(`mind`, via `card.compulsion.signature.mind`) requires one documented reuse — precisely mirroring
the two deviations the brief's own rolled-dice section already records with a stated reason.

**What the hand actually does.** Five cards (§ 9): the god can call in a future debt from the
keeper for candor now (Favor), push hard enough through the flooded dark to draw attention
(Heavy Hand), give the mortal a lasting reason to keep at the record even after this scene ends
(Kindled Ambition), plant a need to keep reading that outlasts good sense (Compulsion), or sharpen
their eye for how the room itself was built to slow down a careless reader (Whisper, "Read The
Architecture" — the library's own title, and the corpus's closest thing to a pun on this step's
own purpose line). None of them hand the mortal the charter's contents; every one of them shifts
the odds of the *reading*, which is exactly the design intent the earlier passes were trying, and
failing, to protect by removing the hand instead of authoring it correctly.

**What remains true and is kept.** Step 0's hand is still the strongest lever on step 1 — its band
sets the six-row carryover map step 1 reads from, so the god's play on the descent still shapes the
reading indirectly, on top of whatever step 1's own hand now does directly. The rhythm is now
play → play → play, matching step 0/step 2's own established cadence rather than the play → watch
→ play the earlier drafts defended as a virtue it never needed to be.

**Filed forward, corrected.** § 17 finding 6 (the batch's headline finding, "the card budget cannot
fund a three-step encounter") is retracted as stated. The batch's card budget *can* fund a third
hand; what cannot happen is funding it while also treating a self-authored, non-code over-exposure
table as an unbreakable constraint. The retro-worthy finding is narrower and still worth recording:
a brief's own variance-management table can read as harder law than it is, and a later pass should
say so out loud when it does — which this document now does.

### `narrativeTemplate`

> Below the water line the shelves are still standing. The warden sits on the ledge above the last
> of them and has not moved. The charter box is on that last shelf, and the water is at the bottom
> of it.

41 words. The charter and the warden are both shown here, before anything else refers to them.
Reads correctly whether step 0 went well or badly — the difference is carried by the carryover
lines, not by the prose.

### `carryoverFactorLines` — keyed on **step 0's** band

Resolved against `stepOutcomes[currentStep - 1]`, so a different roll shows a different line or
none. Each names its source in the sentence (canon rule 1); each is ≤12 words; each
`|forecastDelta|` is well inside `NUDGE_BIG_DELTA`.

```ts
carryoverFactorLines: {
  critical_success: { text: 'The dark below has not heard them, so they can work slowly.', polarity: 'for',     forecastDelta:  0.06 },
  success:          { text: 'The warden looked up once and went back to waiting.',         polarity: 'for',     forecastDelta:  0.02 },
  success_at_cost:  { text: 'They came down with no lamp and are reading by hand.',        polarity: 'against', forecastDelta: -0.04 },
  near_miss:        { text: 'The noise they made on the stair has not settled yet.',       polarity: 'against', forecastDelta: -0.02 },
  failure:          { text: 'They were heard on the stair and are watched now.',           polarity: 'against', forecastDelta: -0.05 },
  critical_failure: { text: 'They came down hard into the water and are soaked through.',  polarity: 'against', forecastDelta: -0.07 },
}
```

### The five afterimages

| Band | Afterimage |
|---|---|
| `criticalSuccessAfterimage` | `They read the whole charter through, and know every name on it.` |
| `successAfterimage` | `They found the charter and read enough to know the loose page was torn from it.` |
| `successAtCostAfterimage` | `They got the charter up out of the box and left the rest of the shelf under water.` |
| `failureAfterimage` | `The ink had gone. They came away with a wet box and no names.` |
| `criticalFailureAfterimage` | `They could not get the lid up, and the box went back down where they found it.` |

`critical_failure` here leaves the box **recoverable**: step 2 still has a test to run, which is
what `continue_weakened` promises.

---

## 8. Step 2 — `veil`, "Answer the warden"

```ts
reach: 'veil', difficulty: 0.44, duration: { min: 1, max: 2 },
purposeLine: 'Answer the warden',
failBehavior: 'fail_action',
onSuccess: [], onFailure: [],
// no successMetadata / failureMetadata — every write lands in the aftermath (§ 12, and § 13's note)
```

### `narrativeTemplate`

> The warden stands between the stair and the water now. It has harmed no one and it has let nothing
> out. It wants the name of whoever the records were left with, spoken as the record spells it. It
> will hear one answer.

42 words. The law is stated, not implied: one answer, it must be a name, and the **form** matters.
The disposition is stated, not implied: it has harmed no one.

**Why the added clause is load-bearing.** *Spoken as the record spells it* makes the test
perceiving and performing the form a thing with its own law requires — which is what `veil` is —
and it tightens the chain rather than adding to it: step 1's reading is what supplies the form,
which is exactly what the carryover map already rewards. The `honesty_cunning` axis survives
intact, because a made-up name still fails against something that knows the spelling.

The warden *sits* in step 1 and *stands* here: that is escalation, marked by *now*, not drift.

### `carryoverFactorLines` — keyed on **step 1's** band

```ts
carryoverFactorLines: {
  critical_success: { text: 'They read every name on the charter and can use one.',   polarity: 'for',     forecastDelta:  0.07 },
  success:          { text: 'The torn page gave them a name to say.',                 polarity: 'for',     forecastDelta:  0.04 },
  success_at_cost:  { text: 'They have the charter and not the rest of the shelf.',    polarity: 'against', forecastDelta: -0.02 },
  near_miss:        { text: 'They read the box lid and little else.',                 polarity: 'against', forecastDelta: -0.03 },
  failure:          { text: 'The ink was gone before they read a single name.',       polarity: 'against', forecastDelta: -0.06 },
  critical_failure: { text: 'The box is in the water and they have no name.',         polarity: 'against', forecastDelta: -0.08 },
}
```

**Two authored carryover maps, twelve lines, sits alongside a third step now also carrying its own
authored hand.** Each carryover line is variance by construction — it renders only on the band its
predecessor actually rolled.

### The five afterimages

| Band | Afterimage |
|---|---|
| `criticalSuccessAfterimage` | `They gave the warden a name it accepted, and walked out with the charter dry.` |
| `successAfterimage` | `They answered it, and it let the charter go. The box stayed.` |
| `successAtCostAfterimage` | `They got the charter out. The warden set a mark on them for taking it.` |
| `failureAfterimage` | `The warden would not have the answer, and the box went back on the shelf.` |
| `criticalFailureAfterimage` | `The shelf went over into the water, and they came up the stair with the charter still down there.` |

---

## 9. The hands

All three steps now carry an authored hand, cut from the 21-type library. Every card that matches
a library member names it in `libraryCardId`, and the `name`, `effectLine` and `imageTag` are
**library-generic**: the same face reads correctly in any encounter its type deals into. Nothing on
a card face names the vault, the charter, the warden or the keeper.

**Card names are the library's own authored titles, verbatim from `CARD_CONTENT`.** All eighteen
titles below (thirteen from steps 0/2, five new to step 1) were checked one by one against
`CARD_CONTENT` and all match verbatim.

`fiction` is schema-required on `StepNudge` but **retired by Prose Doctrine v2 and drawn by no
surface**. Each library card below carries its own member's existing `quote` verbatim from
`src/data/nudge-card-library.ts`. Only the step-2 one-off (card 5) needed a newly written line.

### Step 0 hand — 7 cards (five dealt to a god with no darkness or light attunement)

Questions answered, one per card: *leave no trace of the hand* · *turn the ground against what
resists* · *put a useful object in their way* · *see the gate before spending on it* · *make the
worst impossible* · *take the injury off them* · *make them want to go down at all*.

| # | Type | `libraryCardId` | `id` | `sphere` | `name` | `essenceCost` | `costs` | `forecastDelta` | `rider` | `imageTag` |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Veil | `card.veil.attunement.darkness` | `archive.clear_the_traces` | `darkness` | Clear The Traces | 3 | `detectionDelta: -0.10` | 0.07 | — | `generic.dark` |
| 2 | Stumble | `card.stumble.signature.chaos` | `archive.loosen_their_footing` | `chaos` | Loosen Their Footing | 2 | — | 0.09 | — | `generic.luck` |
| 3 | Cache | `card.cache.signature.matter` | `archive.find_what_remains` | `matter` | Find What Remains | 2 | — | 0.06 | — | `generic.matter` |
| 4 | Whisper | `card.whisper.attunement.light` | `archive.read_the_whole_shape` | `light` | Read The Whole Shape | 2 | — | 0.10 | — | `generic.focus` |
| 5 | Mercy | `card.mercy.core` | `archive.spare_the_worst` | — (common) | Spare The Worst | 2 | — | 0.04 | `no_crit_fail` | `generic.mercy` |
| 6 | Balm | `card.balm.hunger.reclaim` | `archive.mend_what_broke` | — (hunger) | Mend What Broke | 2 | — | 0.05 | — | `generic.vigor` |
| 7 | Compulsion | `card.compulsion.hunger.haunt` | `archive.send_a_dream` | — (hunger) | Send A Dream | 2 | — | 0.08 | — | `generic.memory` |

**Effect lines, grants and band fragments**

**1. Clear The Traces** — `card.veil.attunement.darkness` · `costs: { detectionDelta: -0.10 }` · `valueDrift: { axis: 'revelation_discretion', toward: 'negative' }` · `fiction: 'A practiced hand leaves less than a careful one.'`
> *effectLine:* `Leave no mark behind. No rival power can follow the hand back to its source.`
- `bandProse`: `success`: `Nobody upstairs could say who helped them down.` · `near_miss`: `The hand behind it went unseen. It also went unfinished.`

**2. Loosen Their Footing** — `card.stumble.signature.chaos` · `fiction: 'Every structure has one loose piece.'`
> *effectLine:* `The ground turns against whoever would stop them, and gives way under them.`
- `bandProse`: `critical_success`: `The dark below shifted first, and they went down through the gap it left.` · `failure`: `The ground gave in the wrong place, and it gave under them.`

**3. Find What Remains** — `card.cache.signature.matter` · `fiction: 'Matter keeps its promises longer than people do.'`
> *effectLine:* `Reveal a scroll case left by an earlier party. Oiled leather, theirs to keep.`
- `grants: [{ kind: 'attachment_grant', templateId: 'reward_tools_instruments_scroll_case', targetAgentId: '$actor' }]`
- `bandProse`: `success_at_cost`: `The case came up with them. Most of their own kit did not.` · `failure`: `They kept the case. Everything else they carried out was wet through.`

**4. Read The Whole Shape** — `card.whisper.attunement.light` · `reveals: 'next_step_demand'` · `fiction: 'Long looking shows what one glance cannot.'`
> *effectLine:* `Show them the layout of the place before they move through it.`
- `bandProse`: `critical_success`: `They knew the room before they entered it, and never put a foot wrong.` · `failure`: `They had the whole layout and were heard anyway.`

**5. Spare The Worst** — `card.mercy.core` · `rider: 'no_crit_fail'` · `fiction: 'Failing is survivable. Some failures are not.'`
> *effectLine:* `However badly this goes, it cannot end in disaster.`
- `bandProse`: `near_miss`: `They got through on the last of it, and no further harm followed.` · `failure`: `It went badly and stopped there, and no worse thing came of it.`

**6. Mend What Broke** — `card.balm.hunger.reclaim` · `fiction: 'Some wounds are only debts the body is carrying.'`
> *effectLine:* `Close their wounds where they stand. The hurt stops slowing them.`
- `grants: [{ kind: 'remove_condition', conditionTraitId: 'trait.condition.wounded' }]`
- `bandProse`: `success`: `They moved without a limp and were not heard.` · `near_miss`: `The hurt was gone and they still made noise on the stair.`

**7. Send A Dream** — `card.compulsion.hunger.haunt` · `fiction: 'Everyone is haunted. Few are visited on purpose.'`
> *effectLine:* `An urge arrives in their sleep and stays. For a while they will go looking.`
- `grants: [{ kind: 'plant_compulsion', targetAgentId: '$actor', encounterBias: { explore: 0.6 }, narrativeHook: 'Since the rain they have dreamed of rooms under rooms, and woken wanting to look.' }]`
- `bandProse`: `success`: `They went down like a person who had been here before, because in sleep they had.` · `critical_failure`: `The urge kept them going after they should have turned back, and they were seen.`

**Step 0 arithmetic and guardrails**

| Check | Value | Verdict |
|---|---|---|
| Hand size | 7 | inside 4–8 ✓ |
| Distinct spheres | `darkness`, `chaos`, `matter`, `light` = **4** | ≥ `HAND_SPHERE_COVERAGE_MIN` (4) ✓ |
| Ungated common (sphere-less) options | 1 (`#5`, `card.mercy.core`) | ≥ `HAND_COMMON_OPTIONS_MIN` (1) ✓ |
| Distinct card types | 7 | ≥3 ✓ |
| Boosts | 0 | ≤2 ✓ |
| Riders | 1 (`#5`) | ≤1 ✓ |
| Total `forecastDelta` | 0.49 | ≤ 0.70 ✓ |
| Difficulty + full hand | 0.38 + 0.49 = 0.87 | ≤1.0 ✓ |
| Every card has a failure-band fragment | ✓ all seven | ✓ |
| Digits or `%` in any `effectLine` | none | ✓ |

**Six-band coverage, step 0:** `critical_success` (Loosen Their Footing · Read The Whole Shape) ·
`success` (Clear The Traces · Mend What Broke · Send A Dream) · `success_at_cost` (Find What
Remains) · `near_miss` (Clear The Traces · Spare The Worst · Mend What Broke) · `failure` (Loosen
Their Footing · Find What Remains · Read The Whole Shape · Spare The Worst) · `critical_failure`
(Send A Dream).

---

### Step 1 hand — 5 cards (new in this pass; see § 7 for the ruling that makes it buildable)

Cut from four spheres never dealt anywhere else in this encounter, three of them never dealt
anywhere else in the batch: `order`, `force`, `spirit` (batch-fresh) and `mind` (one documented
reuse, mirroring the brief's own recorded-deviation pattern — full derivation in
`the-drowned-archive-systems.md` § 0). Questions answered, one per card: *bank a debt for candor
now* · *push hard enough to be seen doing it* · *give them a reason to want this past the scene's
end* · *plant a need to keep reading past the point of sense* · *sharpen the eye for how the room
itself is built*. No two buy the same certainty — the fourth and fifth are the closest pair, and
they answer different questions (an urge to keep going vs. a sharper read of what is there).

| # | Type | `libraryCardId` | `id` | `sphere` | `name` | `essenceCost` | `costs` | `forecastDelta` | `rider` | `imageTag` |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Favor | `card.favor.signature.order` | `archive.open_the_ledger` | `order` | Open The Ledger | 2 | — | 0.06 | — | `generic.ward` |
| 2 | Heavy hand | `card.heavy_hand.signature.force` | `archive.throw_full_weight` | `force` | Throw Full Weight | 2 | `detectionDelta: 0.12` | 0.11 | — | `generic.energy` |
| 3 | Kindled ambition | `card.kindled_ambition.signature.spirit` | `archive.kindle_a_wanting` | `spirit` | Kindle A Wanting | 2 | — | 0.05 | — | `generic.warmth` |
| 4 | Compulsion | `card.compulsion.signature.mind` | `archive.plant_an_urge` | `mind` | Plant An Urge | 2 | — | 0.07 | — | `generic.time-slow` |
| 5 | Whisper | `card.whisper.hunger.witness` | `archive.read_the_architecture` | — (hunger) | Read The Architecture | 2 | — | 0.08 | `reveals: 'next_step_demand'` | `generic.crowd` |

**Effect lines, grants and band fragments**

**1. Open The Ledger** — `card.favor.signature.order` · `fiction: 'Order is only debt everyone agreed to honor.'`
> *effectLine:* `Offer the keeper a plain account of what turns up down there. The debt this creates is theirs to spend.`
- `grants: [{ kind: 'favor_creation', debtorAgentId: '$cast:keeper', magnitudeRange: [0.15, 0.25], context: 'A plain account, offered before it was asked for.' }]`
- **The library's Favor is dealt in its *create* direction, not its *call* direction** — it mints a debt rather than spending an existing one, so it correctly authors no `requiresFavor` gate (that field lives on `StepNudge`, never on the library member — see `the-drowned-archive-systems.md` § 0, open question (b)).
- `bandProse`:
  - `success`: `The keeper heard everything they found, and owes for it now.`
  - `failure`: `The account they gave was thin, and the keeper counted it anyway.`

**2. Throw Full Weight** — `card.heavy_hand.signature.force` · `costs: { detectionDelta: 0.12 }` · `fiction: 'Subtlety is a choice. This is not it.'`
> *effectLine:* `Push straight through the water and the dark without care for who notices. It costs nothing but attention.`
- The **fourth** non-essence-channel card across the encounter (after the Veil, the Bargain, and the Heavy Hand on step 2), and this one pays the same channel step 2's Heavy Hand pays — a deliberate doubling of the "loud and seen" texture, once on the way down, once on the way out.
- `bandProse`:
  - `critical_success`: `They went at it without care for noise, and the shelf gave up everything at once.`
  - `failure`: `The push got them nowhere, and every rival power watching this ground saw it happen.`

**3. Kindle A Wanting** — `card.kindled_ambition.signature.spirit` · `fiction: 'A life turns on what it reaches for.'`
> *effectLine:* `Give them a reason to finish the shelf even after the light fails. Desire carries where nerve runs out.`
- `grants: [{ kind: 'assign_ambition', templateId: 'ambition_uncover_secrets', priority: 'secondary', targetAgentId: '$actor', narrativeHook: 'They came up from the vault still turning the charter over, wanting to know what else is buried.' }]`
- `templateId: 'ambition_uncover_secrets'` confirmed live (`src/data/ambition-templates.ts:490`) — the only ambition template in the catalog whose premise (uncovering hidden truth) matches this card's fiction without inventing one.
- `bandProse`:
  - `success_at_cost`: `They finished the shelf wanting more than the charter alone could give them.`
  - `near_miss`: `The wanting outlasted the reading, and they stopped one page short.`

**4. Plant An Urge** — `card.compulsion.signature.mind` · `fiction: 'By morning it feels like their own idea.'`
> *effectLine:* `A need to keep reading takes root and does not let go until the shelf is empty.`
- `grants: [{ kind: 'plant_compulsion', targetAgentId: '$actor', encounterBias: { explore: 0.4 }, narrativeHook: 'Since the charter, they cannot stop turning its one sentence over, and want to go back down for the rest.' }]`
- The batch's one deliberate reuse of a member slot 1 also deals (`card.compulsion.signature.mind`), recorded as a documented deviation from the brief's own over-exposure table for the reason given in § 7 — the same class of override the brief already applies twice to its own rolled dice.
- `bandProse`:
  - `success`: `They read on past the point of sense, and it paid for itself.`
  - `critical_failure`: `The need to keep reading is what kept them there while the water rose.`

**5. Read The Architecture** — `card.whisper.hunger.witness` · `reveals: 'next_step_demand'` · `fiction: 'Every situation has an architecture. Most go unlooked at.'`
> *effectLine:* `Notice how the room itself was built to test the person now standing in it. That shapes what waits below.`
- `reveals: 'next_step_demand'` shows the reach and difficulty of **step 2** — the mirror of step 0's Whisper, which showed step 1's demand. Unlike that card, this member is a **hunger unique** (`unlock: { kind: 'starting' }`), not attunement-gated, so it reaches every god whose hunger is `witness` rather than only gods who have worked 60 essence through `light`.
- This is the hand's **ungated common option**: sphere-less by construction (hunger uniques carry no `sphere` field), no `requiredTrait`, no `requiredUnlock`, no `requiresGroup`, no `requiresFavor`.
- `bandProse`:
  - `critical_success`: `They saw how the shelves were arranged to slow down a careless reader, and were not careless.`
  - `near_miss`: `They saw the room's shape and still ran out of light one shelf short of the last.`

**Step 1 arithmetic and guardrails**

| Check | Value | Verdict |
|---|---|---|
| Hand size | 5 | inside 4–8 ✓ |
| Distinct spheres | `order`, `force`, `spirit`, `mind` = **4** | ≥ `HAND_SPHERE_COVERAGE_MIN` (4) ✓ |
| Ungated common (sphere-less) options | 1 (`#5`, `card.whisper.hunger.witness`) | ≥ `HAND_COMMON_OPTIONS_MIN` (1) ✓ |
| Distinct card types | 5 (favor, heavy_hand, kindled_ambition, compulsion, whisper) | ≥3 ✓ |
| Boosts | 0 | ≤2 ✓ |
| Riders | 0 | ≤1 ✓ (no floor on riders; this hand simply does not need one) |
| Total `forecastDelta` | 0.06+0.11+0.05+0.07+0.08 = **0.37** | ≤ `NUDGE_HAND_MAX_TOTAL_DELTA` (0.70) ✓ |
| Difficulty + full hand | 0.42 + 0.37 = **0.79** | ≤ 1.0 ✓ |
| Big-delta cards (≥0.15) | none | no double-failure obligation |
| Every card has a failure-band fragment | `#1` failure · `#2` failure · `#3` near_miss · `#4` critical_failure · `#5` near_miss | ✓ |
| Digits or `%` in any `effectLine` | none | ✓ |
| Name-word repetition (effectLine vs. own card's name) | checked all five — none repeat | ✓ |

**Six-band coverage, step 1**

| Band | Covered by |
|---|---|
| `critical_success` | Throw Full Weight · Read The Architecture |
| `success` | Open The Ledger · Plant An Urge |
| `success_at_cost` | Kindle A Wanting |
| `near_miss` | Kindle A Wanting · Read The Architecture |
| `failure` | Open The Ledger · Throw Full Weight |
| `critical_failure` | Plant An Urge |

---

### Step 2 hand — 7 cards (six dealt to a god without the trait)

Questions answered: *make them say what works* · *take the middle out of the ladder* · *bend the
season after this* · *spend the world's clock instead of essence* · *keep one true thing whatever
happens* · *do it openly and be seen doing it* · *be the person who does not lie to it*.

| # | Type | `libraryCardId` | `id` | `sphere` | `name` | `essenceCost` | `costs` | `forecastDelta` | `rider` | `imageTag` |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Undertow | `card.undertow.signature.darkness` | `archive.offer_the_easier_way` | `darkness` | Offer The Easier Way | 2 | — | 0.16 | — | `generic.strength` |
| 2 | Gambit | `card.gambit.signature.chaos` | `archive.risk_everything` | `chaos` | Risk Everything | 1 | — | 0.03 | `all_or_nothing` | `generic.blade` |
| 3 | Omen | `card.omen.signature.time` | `archive.read_the_pattern` | `time` | Read The Pattern | 1 | — | 0.04 | — | `generic.rumor` |
| 4 | Bargain | `card.bargain.signature.entropy` | `archive.pay_it_elsewhere` | `entropy` | Pay It Elsewhere | 0 | `doomDelta: 0.05` | 0.09 | — | `generic.decay` |
| 5 | Side-bet | *(one-off — no library member)* | `archive.salvage_one_fact` | — (common) | Salvage One Fact | 2 | — | 0.05 | — | `generic.blessing` |
| 6 | Heavy hand | `card.heavy_hand.hunger.illuminate` | `archive.light_the_deed` | — (hunger) | Light The Deed | 2 | `detectionDelta: 0.15` | 0.12 | — | `generic.light` |
| 7 | Trait card | `card.trait_card.core` | `archive.draw_on_character` | — (common, trait-gated) | Draw On Character | 0 | — | 0.06 | — | `generic.oath` |

**Effect lines, grants and band fragments**

**1. Offer The Easier Way** — `card.undertow.signature.darkness` · `valueDrift: { axis: 'honesty_cunning', toward: 'negative' }` · `fiction: 'It works. That is the problem.'`
> *effectLine:* `Fill them with the pull toward what is quick and good enough. It works, and it stays with them.`
- `forecastDelta: 0.16` ≥ `NUDGE_BIG_DELTA` (0.15), so **both** failure bands are owed a fragment.
- `bandProse`:
  - `critical_success`: `The answer came out smooth and complete, and the warden took it.`
  - `failure`: `The answer that would do was not the one it wanted.`
  - `critical_failure`: `They said a name they had made up, and the warden knew it as they said it.`

**2. Risk Everything** — `card.gambit.signature.chaos` · `rider: 'all_or_nothing'` · `fiction: 'Chaos has no use for the adequate.'`
> *effectLine:* `The middle outcomes fall away. It lands clean or it lands hard.`
- `bandProse`:
  - `critical_success`: `There was no middle left to land in, and it landed high.`
  - `critical_failure`: `They had no soft landing left, and they used the hard one.`

**3. Read The Pattern** — `card.omen.signature.time` · `fiction: 'Nothing happens only once.'`
> *effectLine:* `Steady their hand. The season after this leans toward more of the same.`
- `grants: [{ kind: 'emit_omen', category: 'seasonal', intensity: 0.30, narrativeHook: 'The rain has opened cellars all over the country, and people have started going down into them.', scope: { kind: 'global' }, sphereAlignment: 'time' }]`
- `bandProse`:
  - `success`: `It went well for them, and the season after this will bring more of the same.`
  - `near_miss`: `It leaned their way and then stopped short.`

**4. Pay It Elsewhere** — `card.bargain.signature.entropy` · `costs: { doomDelta: 0.05 }` · `fiction: 'Nothing is free. Some prices are only slower.'`
> *effectLine:* `No essence spent. The world's own ending comes nearer to cover the cost.`
- `bandProse`:
  - `success`: `They got through. The debt for it was booked against the world's ending.`
  - `failure`: `The cost was booked against the world, and the vault gave up no more for it.`

**5. Salvage One Fact** — **one-off, no `libraryCardId`** · `fiction: 'A wager on the side still pays out.'`
> *effectLine:* `A steady hand now, and a piece of the truth kept win or lose.`
- `grants: [{ kind: 'intelligence', category: 'cultural_knowledge', label: 'A Name Off The Shelf', detail: 'One name, read in passing from a record kept in this place, and remembered.', reliability: 0.6, targetAgentId: '$actor' }]`
- `side_bet` is a declared library *type* (`nudge-card-library.ts:128`) with **zero members**; the brief blesses a one-off there explicitly. Naming a member that does not exist would be the THR-844 rot class, so this stays a stated one-off.
- `bandProse`:
  - `success_at_cost`: `They came out short of the charter and long one true name.`
  - `failure`: `They lost the argument and kept the name, which is more than they went down with.`

**6. Light The Deed** — `card.heavy_hand.hunger.illuminate` · `costs: { detectionDelta: 0.15 }` · `valueDrift: { axis: 'revelation_discretion', toward: 'positive' }` · `fiction: 'Let them see who did this.'`
> *effectLine:* `Push hard and in the open. The help is unmistakable, and every rival power sees whose hand it was.`
- The Veil (step 0) and the Heavy Hand (here) are the encounter's designed inverse on the detection channel, now doubled on `revelation_discretion`.
- `bandProse`:
  - `critical_success`: `The help was plain to see and it worked. Rival powers are looking at this ground now.`
  - `failure`: `It was done in the open and it failed in the open.`

**7. Draw On Character** — `card.trait_card.core` · `requiredTrait: 'trait.core.core_integrity.virtue'` · `essenceCost: 0` · `fiction: 'Character is the one resource nobody spends.'`
> *effectLine:* `What they already are carries them through. Nothing is spent to make it so.`
- Cost 0 because the price was paid by being that person. Hidden, never dimmed, for an agent who
  cannot hold the trait. Unlocked into the hand by the `traitVariant`'s `addNudgeIds`.
- `bandProse`:
  - `success`: `They answered without shading it, and the answer was enough.`
  - `failure`: `They told it the truth. The truth was not what it was waiting for.`

**Step 2 arithmetic and guardrails**

| Check | Value | Verdict |
|---|---|---|
| Hand size | 7 | inside 4–8 ✓ |
| Distinct spheres | `darkness`, `chaos`, `time`, `entropy` = **4** | ≥4 ✓ |
| Ungated common (sphere-less) options | 1 (`#5`) | ≥1 ✓ |
| Distinct card types | 7 | ≥3 ✓ |
| Boosts | 0 | ≤2 ✓ |
| Riders | 1 (`#2`) | ≤1 ✓ |
| Total `forecastDelta` | 0.55 | ≤0.70 ✓ |
| Difficulty + full hand | 0.44 + 0.55 = 0.99 | ≤1.0 ✓ |
| Big-delta cards | `#1` (0.16) carries `failure` **and** `critical_failure` | ✓ |
| Every card has a failure-band fragment | ✓ all seven | ✓ |
| Digits or `%` in any `effectLine` | none | ✓ |

**Six-band coverage, step 2:** `critical_success` (Offer The Easier Way · Risk Everything · Light
The Deed) · `success` (Read The Pattern · Pay It Elsewhere · Draw On Character) · `success_at_cost`
(Salvage One Fact) · `near_miss` (Read The Pattern) · `failure` (Offer The Easier Way · Pay It
Elsewhere · Salvage One Fact · Light The Deed · Draw On Character) · `critical_failure` (Offer The
Easier Way · Risk Everything).

**Base prose reads with no hand active on any step.** Every nudge-specific payoff lives in
`bandProse`; the afterimages and `narrativeTemplates` describe only what happens when the god does
nothing on that step. No band base text mentions a trace hidden, a case found, a dream sent, a
wound closed, a name supplied, a debt made, a shove given, an ambition kindled, an urge planted, or
the architecture noticed.

---

## 10. Trait hooks (mandatory step — all four answered)

1. **Gate?** — **No.** No `requiredTraits`, no `blockedByTraits`. A flooding cellar and a thing that
   asks for a name stop everyone equally, and gating an open-draw encounter would shrink the
   population the `ruin` and `arcane` cells exist to feed.
2. **Variant?** — **Yes, one.**
   ```ts
   traitVariants: [{
     traitId: 'trait.core.core_integrity.virtue',
     forecastDelta: 0.05,
     difficultyDelta: -0.02,
     factorLine: 'Being True, they will not shade what they find to please anyone.',
     addNudgeIds: ['archive.draw_on_character'],
   }]
   ```
   `trait.core.core_integrity.virtue` is the "True" pole of the Core integrity continuum, built by
   `CORE_TRAIT_DEFINITIONS` from `CORE_CONTINUA` (`src/types/coreRegistry.ts`) — a seeded definition,
   so `validateTraitRefs()` does not report it dead. **Why this trait:** the continuum's own
   `reachCouplings` are `shadow: +1` and `eye: +1` — two of this encounter's three reaches — and it
   `governs: 'inner self matches outer'`, which is the warden's law stated as a character trait.
   **Engine correction, applied here (systems pass finding, `the-drowned-archive-systems.md` §
   9.1):** `TraitVariant` (`src/types/unifiedAction.ts:2140`) carries no step index —
   `template.traitVariants`, not `step.traitVariants`. `resolveTraitVariants`
   (`src/engine/encounters/nudges.ts:171-178`) is invoked on **every** step's resolution
   regardless of which step is current, and `buildNudgePhaseModel` renders `variant.factorLine` in
   the test panel on every non-aftermath step. Earlier drafts of this packet claimed the factor
   line was "step 1's own" and would render only there; that claim was not literally true of the
   engine, so the line above is phrased to read correctly on all three steps — a plain statement
   about the trait-holder's honesty rather than a claim narrowly about reading — instead of being
   rewritten to be step-specific, which the schema cannot express.
3. **Trait-only nudge?** — **Yes.** `archive.draw_on_character` (`card.trait_card.core`), cost 0,
   `requiredTrait: 'trait.core.core_integrity.virtue'`, unlocked by the variant's `addNudgeIds`,
   dealt in **step 2's** hand. Hidden, never dimmed, for an agent who cannot hold the trait.
4. **Trait fragment?** — **Yes**, carried by that card's own `bandProse` (`success` and `failure`).
   No separate template-level trait fragment: two surfaces saying the same thing about one trait is
   an echo, and the card is the one the player actually played.

---

## 11. `narrativeTemplates`

```ts
narrativeTemplates: {
  initiation:
    'Bring the rest of the records up before the water takes them. {cast:keeper} cannot ask anyone '
    + 'with a claim on this ground to go down.',
  success:
    '{name} brought the charter up out of the water. What it says about this ground is out with it.',
  failure:
    '{name} came up without the charter. The water is still rising, and the shelves are where they were.',
}
```

`initiation` is scene-class and states both the stake and the agent's role plainly, as Doctrine v2
requires. `success` and `failure` are outcome-class and claim only what the mechanics wrote.

---

## 12. Consequence-hand wiring — where `relationship` and `knowledge` each land

`consequenceDraw: ['relationship', 'knowledge']` — recomputed from the template id by
`check:encounter`.
`consequenceSwap: { from: 'movement', to: 'knowledge', reason: 'both slots of this batch drew movement, and slot 1 is its honest home — its failure bands are being driven back out of the ground. This encounter's prize is the record itself, so knowledge is what the scene was already about.' }`

`knowledge` holds weight 7 in `shadow`, comfortably over the ≥2 floor the one-swap rule requires
(confirmed live, `src/data/content-eval/consequenceDraw.ts:141`).

### `relationship` → `bond_change`

Wired in **three band reactions** in the aftermath (§ 13), plus (new in this pass) one further
`bond_change`-adjacent write from step 1's hand — `favor_creation` on the keeper is a distinct
family (it does not count toward the `relationship` consequence draw, which the gate's walk scopes
to `bond_change` specifically) but is recorded here because it lands on the same cast member the
aftermath's three `bond_change` writes target, and a reviewer should read all four together:

| Band / source | Effect | Why this is *in context* |
|---|---|---|
| step 1 hand, `success` | `favor_creation` `$cast:keeper`, `debtorAgentId: '$cast:keeper'` | Fires when the god plays Open The Ledger and the band lands right — the keeper now owes the actor for a candor offered before it was asked for. Independent of the aftermath bands below; a card grant, not an aftermath write. |
| `critical_success` | `bond_change` `$cast:keeper`, `sentimentDelta: 0.22`, `trustDelta: 0.15` | The keeper asked a stranger to do the thing no local could be trusted with, and the stranger did it and let it be read in front of everyone. |
| `success` | `bond_change` `$cast:keeper`, `sentimentDelta: 0.10`, `trustDelta: 0.06` | The charter came up wet and readable and the keeper has it. Smaller move, same direction. |
| `failure` | `bond_change` `$cast:keeper`, `sentimentDelta: 0.12`, `trustDelta: 0.05` | **The band the family was drawn for.** They came up with nothing, and the keeper sat down with them anyway and asked what they had read. |

Only the aftermath's `critical_success` write is chipped (§ 14) — the brief allows one
`individual`-anchored chip per encounter. The card-grant `favor_creation` is never chip-backed
(nudge grants are not part of the aftermath `changes` surface Law 56 audits); it is a real,
unconditional write when its card is played and its band lands, exactly like every other nudge
grant in this packet.

### `knowledge` → `intelligence` + `spawn_clue`

Wired on **every one of the five** aftermath bands via `intelligence`, plus a `spawn_clue` edge on
`critical_success`, plus (new) two further `intelligence`/knowledge-adjacent card grants from step
1's hand that are independent of the aftermath ladder:

| Band | Effect | What is known afterwards |
|---|---|---|
| `critical_success` | `intelligence` (`political_secret`, reliability 0.95) + `spawn_clue` (`encounter_outcome`, `narrowed`, `$nearest_ruin`) | The whole charter, and a `knows_clue_of` edge pointing at the ruin where the older grant was filed. |
| `success` | `intelligence` (`political_secret`, reliability 0.80) | The charter: the founding families were granted this ground by another house. |
| `success_at_cost` | `intelligence` (`political_secret`, reliability 0.75) | The same, bought at the warden's price. |
| `failure` | `intelligence` (`cultural_knowledge`, reliability 0.40) | One name, and no proof of it. |
| `critical_failure` | `intelligence` (`cultural_knowledge`, reliability 0.30) | One line of a charter nobody can produce now. |

`spawn_clue` writes a real `knows_clue_of` edge to a real ruin node. `targetRuinId: '$nearest_ruin'`
is the documented runtime-resolved form.

**One authoring constraint, recorded rather than worked around:** `IntelligenceEffect.targetEntityId`
is **not** in `SCENE_SENTINEL_FIELDS` (`src/engine/encounterAftermath.ts` — confirmed the full set
at line 651-685), so `'$target'` there would be stored as the literal string and never match a
reader. Every `intelligence` effect in this packet, aftermath and hand alike, therefore omits
`targetEntityId`. See § 17 finding 3.

---

## 13. Aftermath

```ts
aftermathConfig: {
  branchOnStep: 0,
  variants: {},
  fallback: {
    overview: 'The water keeps rising, and the shelves it has not reached yet are the last of the record.',
    changes: [],
    byOutcome: { /* five bands, below */ },
  },
}
```

Choice-less encounter, so the bands hang off `fallback`. `branchOnStep: 0` is inert with an empty
`variants` map, matching the shipped calibration case's shape. `changes: []` at the variant level,
so **no chip renders on a face that performs no write** (Law 56). Every chip below is band-scoped.

**One reaction per band, each carrying real writes.** This is the only structure under which every
chip is unconditionally backed.

**No step metadata anywhere.** Every write lives in the aftermath, which is safe here because
`successMetadata` fires on `isStepSuccess`, which cannot tell `critical_success` from `success` —
and this encounter's entire prize ladder is exactly that distinction.

**Where the clock is paid off.** The rolled `threat` shape's terminal consequence sits on this
ladder rather than only in P3: `critical_failure` destroys the record.

Five bands authored (floor is three): two success-side, two failure-side, and both extremes.

### `critical_success`

**Overview**
> `{actor}` came up with the charter dry and `{cast:keeper}` read it at the vault door. The founding
> families of `{location}` held this ground on another house's grant, and the charter names where
> that grant was filed. The water is over the low shelves now and nobody minds.

**Reaction** — `archive.read_it_at_the_door` · label `Read it aloud at the door`
> intent: `The charter is read out where the families can hear it.`
```ts
effects: [
  { kind: 'intelligence', category: 'political_secret',
    label: 'The Charter Under The Water',
    detail: 'The founding families of this settlement held their ground on a grant from another house, and the grant names where it was filed.',
    reliability: 0.95, targetAgentId: '$actor' },
  { kind: 'spawn_clue', source: 'encounter_outcome', precision: 'narrowed', targetRuinId: '$nearest_ruin' },
  { kind: 'bond_change', withAgentId: '$cast:keeper', sentimentDelta: 0.22, trustDelta: 0.15 },
]
```

**Chips**

| field | `archive.crit.charter_known` | `archive.crit.keeper_trusts` |
|---|---|---|
| `kind` | `shell_state` | `growth` |
| `category` | `boon` | `bond` |
| `direction` / `polarity` | `gain` / `gain` | `gain` / `gain` |
| `title` | `The Whole Charter` | `The Keeper Trusts Them` |
| `causeClause` | `It came up dry and was read at the door` | `A stranger with no claim brought the record up` |
| `detail` | `{actor} carries an intelligence record on {location} now: the founding families held this ground on another house's grant.` | `{cast:keeper} thinks well of {actor} now and will say so to anyone who asks.` |
| `stateNoun` | `{ text: 'a record gained', entityId: '$actor' }` | `{ text: 'a bond warmed', entityId: '$cast:keeper', visualKind: 'agent' }` |
| `concepts` | `[{ text: 'intelligence record' }]` | `[{ text: 'bond' }]` |
| backing write | this band's reaction → `intelligence` | this band's reaction → `bond_change` |

`archive.crit.keeper_trusts` is **the encounter's one `individual`-anchored chip**. The `spawn_clue`
fires on this band and is deliberately **unchipped**.

### `success`

**Overview**
> `{actor}` brought the charter up wet and readable. `{cast:keeper}` has it and the families have
> heard. There is a watcher at the vault door now.

**Reaction** — `archive.leave_it_with_the_keeper` · label `Leave it in the keeper's hands`
> intent: `The charter stays with the office that kept it, and the vault door gets a watcher.`
```ts
effects: [
  { kind: 'intelligence', category: 'political_secret',
    label: 'The Charter Under The Water',
    detail: 'The founding families of this settlement were granted their ground by another house.',
    reliability: 0.8, targetAgentId: '$actor' },
  { kind: 'condition_attachment', templateId: 'trait.condition.location.under_watch',
    targetLocationId: '$target' },
  { kind: 'bond_change', withAgentId: '$cast:keeper', sentimentDelta: 0.10, trustDelta: 0.06 },
]
```

**Chips**

| field | `archive.success.watched` | `archive.success.charter_known` |
|---|---|---|
| `kind` | `shell_state` | `shell_state` |
| `category` | `scar` | `boon` |
| `direction` / `polarity` | `loss` / `loss` | `gain` / `gain` |
| `title` | `The Vault Is Watched` | `The Charter Read` |
| `causeClause` | `The page is public and the rest of the records are not` | `It came up wet and still legible` |
| `detail` | `{target} is under watch now. Quiet work here is seen, and everyone with a claim knows how to get down there.` | `{actor} carries an intelligence record on {location}: the founding families were granted this ground by another house.` |
| `stateNoun` | `{ text: 'a place under watch', entityId: '$target', visualKind: 'location' }` | `{ text: 'a record gained', entityId: '$actor' }` |
| `concepts` | `[{ text: 'under watch', entityId: 'trait.condition.location.under_watch', visualKind: 'attachment' }]` | `[{ text: 'intelligence record' }]` |
| backing write | this band's reaction → `condition_attachment` on `$target` | this band's reaction → `intelligence` |

`archive.success.watched` is **the location-anchored chip the brief requires**, declared with
`visualKind: 'location'` so it carries the click (THR-1172). Its backing write targets the location
directly through the `targetLocationId` sentinel.

### `success_at_cost`

**Overview**
> `{actor}` got the charter out and the warden set a price on it. The mark it left has not faded,
> and `{cast:keeper}` will not say what it means.

**Reaction** — `archive.take_the_mark` · label `Take the mark and say nothing`
> intent: `Nobody lifts what the warden set. The charter is out, and that is the trade.`
```ts
effects: [
  { kind: 'intelligence', category: 'political_secret',
    label: 'The Charter Under The Water',
    detail: 'The founding families of this settlement held their ground on a grant from another house.',
    reliability: 0.75, targetAgentId: '$actor' },
  { kind: 'condition_attachment', templateId: 'trait.condition.cursed', targetAgentId: '$actor' },
]
```

**Chips**

| field | `archive.cost.marked` | `archive.cost.charter_known` |
|---|---|---|
| `kind` | `trait` | `shell_state` |
| `category` | `scar` | `boon` |
| `direction` / `polarity` | `loss` / `loss` | `gain` / `gain` |
| `title` | `Marked By The Warden` | `The Charter Bought` |
| `causeClause` | `They carried a record past the warden that kept it` | `It came out, and the warden took its price for it` |
| `detail` | `{actor} is cursed. The mark sits where the warden set it and does not fade on its own.` | `{actor} carries an intelligence record on {location}, bought at the warden's price: the founding families held this ground on a grant.` |
| `stateNoun` | `{ text: 'Cursed', entityId: 'trait.condition.cursed', visualKind: 'attachment' }` | `{ text: 'a record gained', entityId: '$actor' }` |
| `concepts` | `[{ text: 'cursed', entityId: 'trait.condition.cursed', visualKind: 'attachment' }]` | `[{ text: 'intelligence record' }]` |
| backing write | this band's reaction → `condition_attachment` | this band's reaction → `intelligence` |

### `failure`

**Overview**
> `{actor}` came up without the charter. The warden would not have the answer and put the box back on
> the shelf. `{cast:keeper}` sat with them afterwards and asked what they had read. One name is all
> they had, and they gave it. The water drops in the dry season, and the shelf will still be there.

**Reaction** — `archive.sit_and_hear_it` · label `Sit down and hear what they read`
> intent: `The keeper sits with them and hears what they got off the shelf.`
```ts
effects: [
  { kind: 'intelligence', category: 'cultural_knowledge',
    label: 'One Name From The Charter',
    detail: 'A single name read off a settlement charter, with no document left to prove it by.',
    reliability: 0.4, targetAgentId: '$actor' },
  { kind: 'condition_attachment', templateId: 'trait.condition.terrified', targetAgentId: '$actor' },
  { kind: 'bond_change', withAgentId: '$cast:keeper', sentimentDelta: 0.12, trustDelta: 0.05 },
  { kind: 'encounter_seed', encounterFamily: 'encounter.delve', targetAgentId: '$actor',
    delayTicks: 36, priority: 1.05, inheritContext: true,
    seedLabel: 'The water will drop in the dry season, and the rest of the shelf is still on it.' },
]
```

**Chips**

| field | `archive.fail.shaken` | `archive.fail.kept_name` |
|---|---|---|
| `kind` | `trait` | `shell_state` |
| `category` | `scar` | `boon` |
| `direction` / `polarity` | `loss` / `loss` | `gain` / `gain` |
| `title` | `Left Shaken` | `One Name Kept` |
| `causeClause` | `The warden refused them at arm's length` | `They read one line before the warden turned them out` |
| `detail` | `{actor} is terrified. It will pass in a couple of days.` | `{actor} carries an unreliable intelligence record on {location}: one name from the charter, and no proof of it.` |
| `stateNoun` | `{ text: 'Terrified', entityId: 'trait.condition.terrified', visualKind: 'attachment' }` | `{ text: 'a record gained', entityId: '$actor' }` |
| `concepts` | `[{ text: 'terrified', entityId: 'trait.condition.terrified', visualKind: 'attachment' }]` | `[{ text: 'intelligence record' }]` |
| backing write | this band's reaction → `condition_attachment` | this band's reaction → `intelligence` |

The `bond_change` and the `encounter_seed` both fire here unchipped — the individual anchor is
spent on `critical_success`. Both are named in the overview, which is prose and claims nothing.

### `critical_failure`

**Overview**
> The shelf went into the water with the box on it. `{actor}` got out. `{cast:keeper}` has lost the
> whole record of `{location}` and is grieving it. One line of the charter is still in `{actor}`'s
> head.

**Reaction** — `archive.tell_it_plainly` · label `Tell the keeper plainly`
> intent: `Nothing is softened. The records are gone, and the keeper hears it straight.`
```ts
effects: [
  { kind: 'intelligence', category: 'cultural_knowledge',
    label: 'One Line Of A Lost Charter',
    detail: 'A remembered line from a settlement charter that no longer exists in any copy.',
    reliability: 0.3, targetAgentId: '$actor' },
  { kind: 'condition_attachment', templateId: 'trait.condition.grieving',
    targetAgentId: '$cast:keeper' },
]
```

**Chips**

| field | `archive.crit_fail.keeper_grieves` | `archive.crit_fail.one_line` |
|---|---|---|
| `kind` | `trait` | `shell_state` |
| `category` | `scar` | `boon` |
| `direction` / `polarity` | `loss` / `loss` | `gain` / `gain` |
| `title` | `The Keeper Grieves` | `One Line Remembered` |
| `causeClause` | `The shelf went into the water with the records on it` | `They read a line off the charter before the shelf tipped` |
| `detail` | `{cast:keeper} is grieving. The records of {location} are gone and the loss was watched.` | `{actor} carries an unreliable intelligence record on {location}: one line of a charter nobody can produce now.` |
| `stateNoun` | `{ text: 'Grieving', entityId: 'trait.condition.grieving', visualKind: 'attachment' }` | `{ text: 'a record gained', entityId: '$actor' }` |
| `concepts` | `[{ text: 'grieving', entityId: 'trait.condition.grieving', visualKind: 'attachment' }]` | `[{ text: 'intelligence record' }]` |
| backing write | this band's reaction → `condition_attachment` on `$cast:keeper` | this band's reaction → `intelligence` |

The condition lands on the **keeper**, not the agent, and the chip anchors the condition *template*
rather than the person.

### Aftermath reaction choices — why one per band

The player's choice surface in the nudge model is **the hand**, played on all three steps now. The
aftermath's job here is to land the consequence, and one reaction per band is the only structure
under which every chip is provably backed by a write that fires on the face it renders on (Law 56).

Each reaction is still a stance: *read it aloud at the door* · *leave it in the keeper's hands* ·
*take the mark and say nothing* · *sit down and hear what they read* · *tell the keeper plainly*.

### Tone, against the batch's one-grim-ending budget

Slot 1 resolves grim. This one is pitched the other way and the mechanism is structural: **every
band on this ladder mints a knowledge record**, including both failures.

---

## 14. Anchors

| Chip | Anchor kind | Declaration | Status |
|---|---|---|---|
| `archive.crit.charter_known` | **location** | `entityId: '$actor'` | 📍 named |
| `archive.crit.keeper_trusts` | **individual** | `entityId: '$cast:keeper'`, `visualKind: 'agent'` | 🔗 linked |
| `archive.success.watched` | **location** | `entityId: '$actor'` | 📍 named |
| `archive.success.charter_known` | **location** | `entityId: '$actor'` | 📍 named |
| `archive.cost.marked` | attachment | `entityId: 'trait.condition.cursed'`, `visualKind: 'attachment'` | 🔗 linked |
| `archive.cost.charter_known` | **location** | `entityId: '$actor'` | 📍 named |
| `archive.fail.shaken` | attachment | `entityId: 'trait.condition.terrified'`, `visualKind: 'attachment'` | 🔗 linked |
| `archive.fail.kept_name` | **location** | `entityId: '$actor'` | 📍 named |
| `archive.crit_fail.keeper_grieves` | attachment | `entityId: 'trait.condition.grieving'`, `visualKind: 'attachment'` | 🔗 linked |
| `archive.crit_fail.one_line` | **location** | `entityId: '$actor'` | 📍 named |

**Totals: 6 location · 3 attachment · 1 individual.** The brief's ceiling of one `individual`-anchored
chip is met exactly. No `faction` anchor, per the brief. Every `entityId` passes
`classifyAnchorDeclaration` (re-verified live at `src/data/content-eval/chipAnchorDeclarations.ts:86-107`
for the `$target` and `$cast:keeper` forms specifically).

**The five knowledge chips anchor the place, and here is the argument.** The `intelligence` write
is a record *about* the charter of `{location}`; the chip's sentence names `{location}`; `$target`
resolves to a real location node; `intelligence` is a member of `CHIP_BACKING_EFFECT_KINDS`. What
would make this airtight rather than merely sound is `targetEntityId: '$target'` on the record
itself, which today it cannot be (§ 17 finding 3).

Note step 1's new hand grants (`favor_creation`, `assign_ambition`, `plant_compulsion`) are card
grants, not aftermath `changes` — they are never chip-backed and carry no anchor obligation; Law 56
scopes only to the aftermath's `EncounterAftermathChange` surface.

---

## 15. Images

**Scene tag:** `delve.archive.drowned_vault` (WS4 vocabulary; until the scene manifest exists the
fallback chain ends at EntityVisual). No `illustrationUrl` declared.

**Card tags** — every one resolves to a row in `ENCOUNTER_IMAGE_LIBRARY`, re-verified against
source (`src/data/encounter-image-library.ts`) for this pass:

| Card | `imageTag` |
|---|---|
| Clear The Traces | `generic.dark` |
| Loosen Their Footing | `generic.luck` |
| Find What Remains | `generic.matter` |
| Read The Whole Shape | `generic.focus` |
| Spare The Worst | `generic.mercy` |
| Mend What Broke | `generic.vigor` |
| Send A Dream | `generic.memory` |
| Open The Ledger | `generic.ward` |
| Throw Full Weight | `generic.energy` |
| Kindle A Wanting | `generic.warmth` |
| Plant An Urge | `generic.time-slow` |
| Read The Architecture | `generic.crowd` |
| Offer The Easier Way | `generic.strength` |
| Risk Everything | `generic.blade` |
| Read The Pattern | `generic.rumor` |
| Pay It Elsewhere | `generic.decay` |
| Salvage One Fact | `generic.blessing` |
| Light The Deed | `generic.light` |
| Draw On Character | `generic.oath` |

**No tag repeats across the nineteen cards.** `generic.energy`'s art description ("a charge
gathering at a weathervane's spike") pairs it with the `energy` sphere in the situational-art
table, but the brief's ban is scoped to the *card member* `card.boost.signature.energy`, not to
the art asset — using it on a `force`-signed card is a deliberate choice, recorded here rather than
made silently (`the-drowned-archive-systems.md` § 9.3). `generic.crowd`'s own genericity note
explicitly names *"a reading of the record"* as a fitting scenario, which is why it went to Read
The Architecture rather than anywhere else.

**Concept art direction (scene tag, unchanged from the revised file).** *What emotions does this
story convey?* A place's memory going under while people argue about what it says. The small,
ordinary cost of finding out what is true. Something patient in the dark that is not hostile and
will not be moved. *What image evokes those emotions without illustrating the action?* Not the
descent, not the warden, not the reading. A row of shelves with the waterline already partway up
them, the lowest ledgers swollen shut, and one dry page pinned to the wall above the line where
somebody put it this morning. Residue, not event. No people; their absence is the picture.

---

## 16. Live-content register (every id, and where it lives)

**Every row re-verified against source at Pass 3 (systems).** All hold.

| Id | Kind | File |
|---|---|---|
| `trait.core.core_integrity.virtue` | core trait (True) | `src/types/coreRegistry.ts` → `src/data/core-trait-content.ts` |
| `trait.condition.wounded` | condition (Balm target) | `src/data/condition-trait-content.ts:143` |
| `trait.condition.cursed` | condition | `src/data/condition-trait-content.ts:207` |
| `trait.condition.terrified` | condition | `src/data/condition-trait-content.ts:175` |
| `trait.condition.grieving` | condition | `src/data/condition-trait-content.ts:244` |
| `trait.condition.location.under_watch` | location condition | `src/data/condition-trait-content.ts:323` |
| `reward_tools_instruments_scroll_case` | possession, tier 1 | `src/data/reward-attachment-catalog.ts:2305` |
| `ambition_uncover_secrets` | ambition template | `src/data/ambition-templates.ts:490` — **new to this pass**, backs step 1's Kindle A Wanting |
| 18 `libraryCardId`s (all but the two one-offs) | card library members | `src/data/nudge-card-library.ts` — **all 18 titles match `CARD_CONTENT` verbatim**, including the five new to step 1 |
| all 19 `imageTag`s | image library rows | `src/data/encounter-image-library.ts` |
| `explore` | `EncounterType` member (compulsion bias) | `src/types/encounter.ts` |
| `political_secret`, `cultural_knowledge` | `IntelligenceCategory` members | `src/types/unifiedAction.ts` |
| `seasonal` | `OmenCategory` member | `src/types/omen.ts` |
| `honesty_cunning` (+Confessor / −Puppeteer), `revelation_discretion` (+Seeker / −Sentinel) | `ValuePair` members | `src/types/agent.ts:56,59` |
| `acolyte`, `monk`, `chaplain`, `scribe` | NPC roles / `LOCATION_ROLE_ROSTERS` | `src/types/npc.ts:62,299-301,341` |
| `growth`, `trait`, `shell_state` | `EncounterAftermathChangeKind` members | `src/types/unifiedAction.ts:176` |
| `intelligence` | member of `CHIP_BACKING_EFFECT_KINDS` | `src/data/content-eval/compositionContract.ts:199` |
| `favor_creation` | effect kind, `magnitudeRange`/`context`/`debtorAgentId?` | `src/types/unifiedAction.ts:1035-1044` |
| `assign_ambition` | effect kind, `templateId` required | `src/types/unifiedAction.ts:626-637` |
| `NudgeRevealKind: 'next_step_demand'` | reveal kind (sole member) | `src/types/unifiedAction.ts:1622` |

**Deliberately absent: `trait.condition.location.standing_welcome`.** Deprecated with zero writers
(THR-1206); this encounter reaches for `reputation_with` nowhere, by design.

**Prize calibration, unchanged.** The only material prize on any band is the tier-1 `Scroll Case`,
arriving from a card, not from an ending. Everything else on the ladder is knowledge.

---

## 17. Findings for the batch report

*Renumbered at Pass 2, corrected at Pass 3 (this document) where the systems audit measured
differently. Findings 1-5, 7-8 unchanged from the revised file; finding 6 is retracted and
replaced.*

1. **Slot 1 renames ALL SEVEN of its cards away from their library titles.** (Unchanged from Pass
   2 — see `the-drowned-archive-editorial.md` § 3 finding 26 for the full table.)
2. **`side_bet` should gain a library member.** (Unchanged.) `archive.salvage_one_fact` is a
   correctly-stated one-off; the library proposal is filed against `nudge-card-library.ts`.
3. **`IntelligenceEffect.targetEntityId` is not sentinel-bound.** (Unchanged, re-verified this
   pass — `SCENE_SENTINEL_FIELDS` confirmed to hold exactly eight fields, none named
   `targetEntityId`.) Every `intelligence` effect in this packet, including the two new to step 1's
   hand region (there are none — step 1's grants are `favor_creation`/`assign_ambition`/
   `plant_compulsion`, not `intelligence`), correctly omits the field where it would matter.
4. **`ActionScale` has no member for the settlement tier.** (Unchanged, re-verified this pass.)
5. **Anchor-catalog contradiction, seconding slot 1's finding.** (Unchanged.)
6. **RETRACTED AND REPLACED — "the batch's card budget cannot fund a three-step encounter."**
   *Pass 2's headline finding does not hold.* The systems pass (this document, and
   `the-drowned-archive-systems.md` § 0 in full) found `checkNudgeHand`'s sphere and common-option
   floors are evaluated strictly per hand, with no cross-step or cross-batch state, and that three
   spheres (`order`, `force`, `spirit`) were dealt **zero** times anywhere in this two-encounter
   batch — enough for three of the four required distinct spheres with zero policy deviation. A
   fourth hand was built (§ 9, step 1) using one documented reuse for the fourth sphere, mirroring
   the brief's own recorded-deviation pattern for its rolled dice. **The retro-worthy finding,
   corrected:** a batch brief's self-authored, non-code over-exposure table can read as harder law
   than it is to a pass working from the brief's own summary rather than re-deriving availability
   from the batch's actual authored content. Recommendation for the retro: when a brief's own
   variance-management table is cited as a hard blocker, the citing pass should re-derive
   availability from what was actually dealt, not from the table's stated caps alone — the caps are
   guidance for a first pass, not a ceiling a later pass is bound by.
7. **A library card face has no canonical `effectLine`, and it shows twice in one batch.**
   (Unchanged — `card.bargain.signature.entropy` and `card.cache.signature.matter`, both pre-
   existing in steps 0/2, not touched by this pass's new hand.)
8. **`card.whisper.attunement.light` is the library's only member at attunement threshold 60.**
   (Unchanged as a finding about that specific member. Note step 1's new Whisper card,
   `card.whisper.hunger.witness`, deliberately avoids this exact trap — it is a hunger unique with
   `unlock: { kind: 'starting' }`, reaching every `witness`-hunger god rather than only gods with 60
   lifetime `light` essence. This is the corrected pattern the finding was implicitly asking for.)

*Retired at Pass 2, remains retired:* the draft's original finding 6 (the declared clever-
specificity near-miss on "two men... and both came back").

---

## 18. The narrator's checklist (12 questions), answered in writing

*Answers verified independently at Pass 2 (`the-drowned-archive-editorial.md` § 4); re-checked at
Pass 3 against the new step-1 hand prose only, since §§ 1-8 (opening, narrator mode, internal
logic) are untouched by the hand addition. Post-revision: 12/12, unchanged.*

Question 11 (*"Is every card named verb+noun and described like a spell?"*) now covers **nineteen**
cards rather than fourteen. All five new names are imperative verb + noun, 2-3 words, all five are
the library's own titles verbatim, all five effect lines carry no digit, no `%`, no odds
vocabulary, and (re-checked explicitly at Pass 3, since this is exactly the trap the packet's own
finding 9 from Pass 2 warns about) no effect line repeats a content word from its own card's name —
see § 9's step-1 arithmetic table.

All other eleven questions are unaffected by this pass's changes and their Pass 2 answers stand.

---

## 19. Self-audit against every hard requirement

### Prose Doctrine v2

Unchanged verdicts from Pass 2 for every row except the two below, extended to cover the new hand.

| Requirement | Verdict |
|---|---|
| Card effect line never repeats a content word from its card's name | **PASS** — checked for all nineteen cards, including the five new to step 1. |
| Card names imperative verb + noun, 2–4 words | **PASS** — all nineteen, and eighteen of them (all but the two one-offs) are the library's own authored titles verbatim. |

### Hand rules

| Requirement | Step 0 | Step 1 | Step 2 |
|---|---|---|---|
| 4–8 cards | 7 ✓ | 5 ✓ | 7 ✓ |
| ≥4 distinct spheres | 4 ✓ (darkness, chaos, matter, light) | 4 ✓ (order, force, spirit, mind) | 4 ✓ (darkness, chaos, time, entropy) |
| ≥1 ungated common (sphere-less) | 1 ✓ (`card.mercy.core`) | 1 ✓ (`card.whisper.hunger.witness`) | 1 ✓ (the side-bet one-off) |
| ≤1 rider | 1 ✓ (`no_crit_fail`) | 0 ✓ (none authored — no floor) | 1 ✓ (`all_or_nothing`) |
| ≤2 Boosts | 0 ✓ | 0 ✓ | 0 ✓ |
| ≥3 distinct card types | 7 ✓ | 5 ✓ | 7 ✓ |
| Every card pays off ≥1 failure band | ✓ | ✓ | ✓ |
| `forecastDelta ≥ 0.15` covers both failure bands | n/a (none) | n/a (none — max is 0.11) | ✓ (`Offer The Easier Way`) |
| No digits or `%` in `effectLine` | ✓ | ✓ | ✓ |
| Hand total ≤ 0.70 · difficulty + hand ≤ 1.0 | 0.49 · 0.87 ✓ | 0.37 · 0.79 ✓ | 0.55 · 0.99 ✓ |
| All six `StepOutcome` bands covered | ✓ | ✓ | ✓ |
| Base band text reads with no hand active | ✓ | ✓ | ✓ |
| Every card face library-generic | ✓ | ✓ | ✓ |

**All three steps now nudge-bearing.** The Composition Contract's Hand block requires at least one
nudge-bearing step; this template exceeds the floor on every step.

### Card budget (batch-level)

| Instruction | Status |
|---|---|
| `card.boost.core` spent by slot 1 — must not appear | **Not used.** ✓ Zero Boosts anywhere in this encounter. |
| `card.insurance.core` spent by slot 1 — must not appear | **Not used.** ✓ |
| `card.boost.signature.energy` banned | **Not used.** ✓ (Note: `generic.energy` the *image tag* is used on step 1's Heavy Hand card — the ban is on the card member, not the art asset; see § 15.) |
| ≥3 cards from the zero-authoring member list | **4 used:** `card.balm.hunger.reclaim` · `card.compulsion.hunger.haunt` · `card.heavy_hand.hunger.illuminate` · `card.whisper.hunger.witness` (new). Combined with slot 1's four, the batch spends **8 of the 14** zero-authoring members. ✓ |
| Over-exposed cards, ≤1 each across the batch | `card.mercy.core` ×1 · `card.undertow.signature.darkness` ×1 · `card.omen.signature.time` ×1 · `card.heavy_hand.signature.force` ×1 (new) · `card.kindled_ambition.signature.spirit` ×1 (new). **One documented deviation:** `card.compulsion.signature.mind` is now used **twice** across the batch (slot 1 and this encounter's new step-1 hand) — recorded and justified at § 7 and § 9, the same class of override the brief's own rolled-dice section already applies twice. |
| ≥1 card priced on a non-essence channel | **4:** `Clear The Traces` (`detectionDelta −0.10`) · `Throw Full Weight` (`detectionDelta 0.12`, new) · `Pay It Elsewhere` (`doomDelta 0.05`) · `Light The Deed` (`detectionDelta 0.15`). ✓ |
| ≥1 card with a real `grants` against built content | **8:** the five listed in the Pass 2 table, plus `Open The Ledger` (`favor_creation`), `Kindle A Wanting` (`assign_ambition`, `ambition_uncover_secrets`), `Plant An Urge` (`plant_compulsion`). All ids resolve for `validateNudgeGrantRefs`. ✓ |
| Type composition must differ from slot 1 | ✓ Now **eight** types new to the batch — stumble, mercy, side_bet, undertow, favor, kindled_ambition, whisper (hunger-unique variant), and heavy_hand deals a second, distinct member from slot 1's. |
| ≤2 Boosts per hand, ≥3 types per hand | 0 Boosts across the whole encounter; every hand clears the ≥3-types floor with room. ✓ |

### Composition Contract

| Block | Verdict |
|---|---|
| Steps | 3 plain steps (the contract's ceiling), each with reach, numeric difficulty, `narrativeTemplate` ✓ |
| Hand | **three** nudge-bearing steps now; `checkNudgeHand` obligations met on every one — see the table above ✓ |
| Setting | `settings` declared, three classes, three openings, `locationSubtypes` derived ✓ |
| Cast | one actor spec, class-honest at all three classes; every `{cast:keeper}` token names a declared key; now receives three distinct persistent-consequence write kinds (`bond_change`, `condition_attachment`, `favor_creation`), all valid against a `must-persist` materializing spec ✓ |
| Rewards | `spawn_clue`, `attachment_grant`, `favor_creation`, `assign_ambition`, and four `condition_attachment` writes — all `PERSISTENT_EFFECT_KINDS` ✓ |
| Aftermath | `aftermathConfig` present · 5 `byOutcome` bands (floor 3) · success-side, failure-side and both extremes · every variant carries an `overview` · every change declares `concepts` ✓ |
| Systems | **4** — cast · rewards · conditions · seeds (floor 3, brief target 4); unchanged by the new hand, since its grant kinds (`favor_creation`, `assign_ambition`, `plant_compulsion`) all already fall under systems this encounter already touches ✓ |
| Images | 19 tags, all resolve; no `illustrationUrl` ✓ |
| Consequence draw | `['relationship','knowledge']` with the brief's one recorded swap; both wired by aftermath band reactions ✓ |

### Chips (Law 56)

Unchanged from Pass 2 — the new hand's grants are never chip-backed (nudge card grants sit outside
the aftermath `changes` surface Law 56 audits), so all ten chips and their backing verdicts stand
exactly as recorded in the revised file.

### Detectors

Unchanged verdicts for the pre-existing text; the five new bandProse fragments and five new effect
lines were swept against the same lexicon at draft time (§ 9) — zero evasive-vagueness hits, zero
banned natural indefinites in outcome-class fields, zero intensifiers, zero annotation clauses, zero
divine-outcome-authorship violations, zero abstraction-as-subject violations.

### Echo check

The five new step-1 cards were checked against every existing card face in this encounter and
against slot 1's card list (per editorial finding 26's table): no shared construction, no shared
opening words, no shared image tag. New seam checked: step 0 spine → step 1 spine → **step 1's own
hand** → step 1 spine → step 2 spine — clean, no card face echoes the spine's own vocabulary
(neither "shelves," "warden," nor "charter" appears verbatim in any step-1 effect line, preserving
the library-generic rule).

### Brief compliance

All rows from the revised file's § 19 stand unchanged, with one correction:

| Brief instruction | Verdict |
|---|---|
| Shape: Puzzle–Investigation–Resolution, 3 steps, information behind the gate | ✓; **the gate now has a hand** — § 7 records the systems ruling that made this buildable, correcting the revised file's framing of the gate as deliberately handless |

---

## 20. Template-level fields

```ts
id: 'encounter.delve.the_drowned_archive',
rarityTier: 2,
intrinsicTier: 'background',
name: 'The Drowned Archive',
reach: 'shadow',
crudType: 'read',
scale: 'local',            // see § 17 finding 4 — ActionScale has no `settlement` member
apCost: 1,
actorAffinities: ['individual'],
motivations: ['revelation_discretion', 'honesty_cunning'],
consequenceDraw: ['relationship', 'knowledge'],
consequenceSwap: {
  from: 'movement',
  to: 'knowledge',
  reason: 'both slots of this batch drew movement, and slot 1 is its honest home. This encounter\'s prize is the record itself, so knowledge is what the scene was already about.',
},
settings: ['ruin', 'arcane', 'sacred'],
locationSubtypes: expandSettings(['ruin', 'arcane', 'sacred']),
description:
  'A three-step delve: the record vault is flooding, a page has surfaced saying the '
  + 'founding families never owned the ground, and the thing that has been keeping the rest will '
  + 'only give it up for a true answer, spoken the way the record spells it.',
```

Both declared `motivations` now have carriers in the hands: `honesty_cunning` on the Undertow
(step 2), and `revelation_discretion` on the Veil (step 0) and the Heavy Hand (step 2) — see § 1
row 6. Step 1's new hand does not add a third carrier for either declared axis, which is correct:
the packet declares exactly two `motivations` and both already have carriers; a third axis was
never declared and none is needed.

Wrap the whole literal in `compileOpeningEnvelope({ ... })`.
