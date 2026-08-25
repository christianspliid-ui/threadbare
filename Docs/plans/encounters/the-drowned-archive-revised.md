# Encounter Pipeline: The Drowned Archive

> Batch: **deep-places** (slot 2 of 2) · Slug: `the-drowned-archive` · Pass: **2 (revised)**
> Template id: `encounter.delve.the_drowned_archive` (FIXED — the consequence draw is recomputed from it)
> Revisions applied: three P1 openings rewritten (batch seam echo) · P2 rewritten (batch seam echo + the declared near-miss retired) · step 2's spine now tests `veil` · `revelation_discretion` given two carriers · § 7's handless-step justification replaced with the honest reason · four card faces de-scened · four rule-work sentences cut · five reaction labels rewritten · seven afterimage/carryover repairs · four overview repairs · chip-title ladder · seed made visible on its band · setting-honesty fix
> Date: 2026-08-25 · Pipeline version: 3 (Encounter Factory) · Format: locked THR-883 + THR-1045 Composition Contract
> Brief: `Docs/plans/encounters/deep-places-brief.md`
> Editorial review: `Docs/plans/encounters/the-drowned-archive-editorial.md`
> Sibling slot: `Docs/plans/encounters/the-broken-seal-draft.md`
> Calibration case matched: `src/data/encounters/the-unclaimed-relic.ts` (Prose Doctrine v2, director-approved)

**Implementation note for Pass 4:** this document is written to be translated to TypeScript
verbatim. Every prose string below is final. Every id below was resolved against the live
catalogs during drafting and **re-verified against source at Pass 2** (§ 16 records where each one
lives). Do not re-invent names, ids or prose; if something does not compile, fix the wiring and
keep the words.

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
| 0c | **System** | `cards` (mature tier) — three cost channels, five real grants, a type debut and a rider the batch has not spent |
| 0d | **Hook** | `hook.dangerous_truth` — *"A record has surfaced that contradicts the founding story everyone here organizes their life around."* Stamp `usedBy` on this hook in `src/data/content-eval/plotHooks.ts` when the encounter ships. |
| 1 | **Whose problem?** | The agent's, by adoption. They came in out of the rain; the vault is going under while they stand there and they are the only person present with no claim on the ground. The rolled role is **bystander pulled in**, and the design honours it by making the agent's uselessness to either side the exact reason they are asked. They are not a spectator: all three tests are theirs. |
| 2 | **Reach per step, and why it is the theme** | Step 0 `shadow` — get down into the vault without the dark below hearing them: Shadow *is* hidden action. Step 1 `eye` — read waterlogged shelves and know which page matters: Eye *is* knowledge and judgment. Step 2 `veil` — stand in front of a thing that keeps its own law and give it what its law requires, **in the form its law requires**: Veil *is* supernatural perception and rite. All three chosen before a word of prose. |
| 3 | **Why is the agent here?** | `chance` — the road passed a ruin, a tower or a sanctuary in a hard rain (the open-draw case). `choice` — they stay and go down when asked. `divine` — the god put the place in front of them. `mission` is not asserted anywhere in the prose. |
| 4 | **Mechanics and objects in play** | Trait variant (`trait.core.core_integrity.virtue`) and the trait-only card it unlocks · two carryover maps, six bands each · conditions (`cursed`, `terrified`, `grieving`, `wounded` as the Balm's target) · one location condition (`under_watch`) · one attachment grant on a card · one intelligence record on every aftermath band · one clue edge · one bond edge · one planted compulsion · one omen · one seed · **two `valueDrift` axes, each with a carrier**. Classification of every fact the prose states about the agent's connections: **all scene-local**. The prose asserts no history, debt, standing or prior visit — it explicitly says the agent has *no* claim here, which is a negative and mints nothing. Every durable fact is written by this encounter. Prose rule 7 satisfied by construction. |
| 5 | **Rewards and where the tension sits** | The prize is **information**, and the ladder is how much of it survives: the whole charter and where the older grant was filed (`critical_success`), the charter (`success`, `success_at_cost`), one name (`failure`), one line (`critical_failure`). Penalty side is concrete and legible: a curse on `success_at_cost`, `Terrified` on `failure`, the whole record destroyed on `critical_failure`. Quintessence stakes are moderate — this scene can cost a reputation for judgment, never a life. Tension sits on step 2: they have read it, and the thing on the ledge decides whether it leaves. **Where the clock lives, stated rather than assumed:** the rolled `threat` shape is realized in three places — the water advances across the three step spines (rising vault → at the bottom of the box → between the stair and the water), `failBehavior: 'continue_weakened'` on both early steps makes lost ground compound forward with the twelve carryover lines as its readout, and `critical_failure` destroys the record, so P3's stated terminal consequence sits on the ladder rather than only in the prose. What is *not* modelled is any tie between elapsed ticks and the water level; that is engine work, and this encounter does not pretend otherwise. |
| 6 | **Does the mortal choose?** | **None — this is a test.** No fork, no `decidedBy`, no branch. Two value axes the scene *tilts*, **each with a real carrier**: `honesty_cunning` (Shadow's own pair — the warden asks for a true name and a false one would serve) is carried by the Undertow's `valueDrift` against the trait card's opposite pull; `revelation_discretion` (Eye's own pair — bring it into the open or keep it under) is carried by the Veil's `valueDrift` toward Sentinel on step 0 and the Heavy Hand's toward Seeker on step 2. The hand carries pole-leaning cards so the god has levers on the mortal's inner weather, never on the outcome. |
| 7 | **Every promise pays off** | The opening promises three things and each has its designed reveal: *the page that floated up* → step 1's bands say whether it was torn from the charter and step 2's aftermath mints the record; *the warden* → stated as fact in P2, shown in step 1's spine sitting on the ledge and not moving, and step 2's whole test; *the rising water* → it is the clock, and it takes the record on `critical_failure`. No mystery is opened that a band does not close. |
| 8 | **Systems touched (counted from the authored manifest)** | **4** — `cast` (support bundle) · `rewards` (`spawn_clue`, `attachment_grant`, four `condition_attachment` writes — all `PERSISTENT_EFFECT_KINDS`) · `conditions` (four `condition_attachment` writes across the bands) · `seeds` (one `encounter_seed`). Target ≥4 met; contract floor is 3. `reputation` and `factions` are deliberately untouched (brief § Anchors), so the quota is **not** reached on the corpus-reflex stack. |

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
overlap**, and no two of these three share a root. The draft's originals shared *comes … the ruins
of {location}* with slot 1's `ruin` opening and borrowed slot 1's *stops at* for `arcane`; a player
drawing both encounters at the same class would have read nearly the same first sentence, which is
the seam-echo class the automated detectors cannot see.

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

**The cost already paid is the keeper's own failed attempt (Pass 2, editorial findings 2–3).** The
draft's P2 read *"{cast:keeper} sent two men down for the rest, and both came back saying a warden
sits in the dark below."* Slot 1's P2 already spends that exact beat — *"Two of them went below
yesterday and one came back"* — so the batch's two openings both counted people who went down and
returned, in the same sentence position. Putting the failed attempt on the keeper fixes the echo
and buys three other things: the cost is paid by the one person the encounter has cast rather than
by two unnamed men; the warden is **stated as a fact** rather than encoded as hearsay, which is
Doctrine v2's rule zero and the foreshadow-never-announce reversal; and the encounter now contains
**no measured count anywhere**, so the draft's declared clever-specificity near-miss is retired by
removal rather than defended. It also strengthens `initiation`: the keeper has already tried, and
everyone else available has a stake in what the charter says.

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

**Class honesty, checked against `LOCATION_ROLE_ROSTERS` (`src/types/npc.ts`) and re-verified at
Pass 2.** A three-class envelope inherits no family default bundle (THR-1044), so this template
declares its own. Of the eight subtypes the envelope expands to, only `shrine` and `temple` carry
rosters, so reuse can only ever fire at `sacred` and the other two classes always spawn. Every
`reuseNpcRoles` entry is therefore drawn from what `sacred` actually seeds: `acolyte`
(shrine 0.6, temple 0.9), `monk` (temple 0.8), `chaplain` (temple 0.7). All three read as somebody
who keeps a place's papers and would know what is on the shelves. `spawnNpcRole: 'scribe'` is a
spawn shape rather than a roster claim, and a scribe reads correctly at a ruined hall, a tower and
a sanctuary alike.

Deliberately disjoint from slot 1's `['pilgrim', 'hermit', 'oracle']` / `spawnNpcRole: 'wanderer'`,
so the two encounters in one batch cannot bind the same person twice at a `sacred` draw.

`spawnName` is a real name because a declared key always resolves (THR-696) and `{cast:keeper}`
renders this string whenever no live NPC was reused. **The prose never genders the keeper** — reuse
binds whoever is standing there, and every sentence about them is written around pronouns. Checked
sentence by sentence at Pass 2.

`persistence: 'must-persist'` is load-bearing rather than habitual: the keeper receives a
`bond_change` on three bands and a `condition_attachment` on `critical_failure`. A cast member
collected at scene end would take those writes with them.

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

No authored `factorLines`. Everything an earlier draft would have listed — the vault is flooded, the
stair is dark, something is down there — reads identically on every run, so it is priced into
`difficulty: 0.38` and carried by the prose.

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

**Pass 2 repairs (editorial findings 4–5).** `success` and `success_at_cost` both opened *"They got
down"*, and `success_at_cost` shared *left … behind them* and *half a \<gear noun>* with slot 1's
afterimage in the same rung of the ladder. *"The water carried the noise"* was ambiguous on a read
— toward the warden, or away. *"They fell the last of the stair"* was ungrammatical and rhymed with
slot 1's *"The stone gave under them"*. Five distinct openings now: *came down the stair · got down ·
Their lamp · went in loud · went off the last of the stair.*

---

## 7. Step 1 — `eye`, "Read the shelves" — **the step with no hand**

```ts
reach: 'eye', difficulty: 0.42, duration: { min: 1, max: 2 },
purposeLine: 'Read the shelves',
failBehavior: 'continue_weakened',
onSuccess: [], onFailure: [],
nudges: undefined,
```

### Why this step carries no hand — the honest reason, replacing the draft's

**This is the encounter's known weak point, and it is recorded as one rather than defended.**

The draft argued that an Eye gate must be handless so the god cannot *buy* the clue. **That
argument is wrong and has been struck.** A card shifts the odds and fate still picks the outcome —
a nudge on an Eye gate buys no more certainty than the calibration case's hand buys the relic off
a Stone gate, or than slot 1's Insurance buys the coffer. If it held, no nudge-bearing step could
ever have a prize.

The draft's second claim — that `card.whisper.attunement.light`'s `reveals: 'next_step_demand'`
compensates — has also been struck. That member is gated `sphere_attunement / light / **threshold
60**` (`nudge-card-library.ts:508`), the **only** member in the library at the second attunement
mark. Most gods never see it, and what it reveals is the step they are about to sit out.

**The real reason is the batch's card budget, and it is a constraint rather than a choice.** A hand
needs ≥4 distinct spheres and ≥1 ungated sphere-less common option. After slot 1's hand and this
encounter's two, **every universal-core member is spent** — `card.boost.core` and
`card.insurance.core` by slot 1, `card.mercy.core` here at its over-exposure cap,
`card.trait_card.core` here and trait-gated regardless — and the two sphere-less variation members
are milestone-gated, so none is *ungated*. On the sphere side only the `order` signature is
unspent; `life`, `force`, `spirit`, `mind` and `light` went to slot 1, `energy` is banned by the
brief, and `darkness`, `chaos`, `matter`, `time` and `entropy` are spent by this encounter's own
two hands. Four distinct spheres cannot be assembled. Splitting step 0's seven cards does not help:
it holds exactly four sphere-keyed cards, so any split leaves a hand under the floor.

**What the step does carry**, and it is real without being a substitute for a hand:

1. **A full six-row carryover map**, authored across every band step 0 can roll — which only exists
   because step 0's `continue_weakened` makes all six reachable. It is the step's authored variance
   surface and the player reads it in the panel.
2. **The trait variant's `factorLine`** — *"Being True, they will not read it to suit anyone."* That
   is a **reading** line, so this is the step it belongs to, and it is variance by construction: it
   renders only for the trait-holder.
3. **Step 0's hand is where step 1 is played.** Step 0's band is the only lever anyone has on step
   1, so the god's decision about how hard to push on the descent *is* their play on the reading.
   `card.whisper.attunement.light`'s reveal is honest in exactly that frame: it tells the god how
   hard to push on step 0 by showing what step 1 will ask. That is a true statement about a card
   most gods will not hold, rather than a design the encounter rests on.

**Filed forward.** The collision between the brief's step-count assignment and its card budget is
this batch's headline finding — § 17 finding 6. The fix lives in the brief template and the library,
not in this encounter.

Two intended consequences remain true and are worth keeping on the record:

- **The rhythm differs from slot 1.** The Broken Seal is play → play. This is play → watch → play.
- **Step 1's difficulty carries its own weight.** With no hand, `0.42` plus the carryover is the
  whole equation, which is why step 0's carryover map is authored across all six bands rather than
  the two or three a hand would have blurred.

### `narrativeTemplate`

> Below the water line the shelves are still standing. The warden sits on the ledge above the last
> of them and has not moved. The charter box is on that last shelf, and the water is at the bottom
> of it.

41 words. The charter and the warden are both shown here, before anything else refers to them.
Reads correctly whether step 0 went well or badly — the difference is carried by the carryover
lines, not by the prose. *That last shelf* rather than *that shelf* (Pass 2, editorial finding 5):
the ledge and the last shelf were both candidate antecedents.

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

`near_miss` rewritten at Pass 2: *"The noise of the entry is still moving in the water"* modelled
the sound as a physical thing travelling, which is in-situ writing rather than a narrator's report.

### The five afterimages

| Band | Afterimage |
|---|---|
| `criticalSuccessAfterimage` | `They read the whole charter through, and know every name on it.` |
| `successAfterimage` | `They found the charter and read enough to know the loose page was torn from it.` |
| `successAtCostAfterimage` | `They got the charter up out of the box and left the rest of the shelf under water.` |
| `failureAfterimage` | `The ink had gone. They came away with a wet box and no names.` |
| `criticalFailureAfterimage` | `They could not get the lid up, and the box went back down where they found it.` |

Note `critical_failure` here leaves the box **recoverable**: step 2 still has a test to run, which
is what `continue_weakened` promises. Rewritten at Pass 2 (editorial finding 14) — the draft's line
*"The shelf tipped and the box went into the water at their feet"* was both the same image as step
2's `critical_failure` and a contradiction of the recoverability this band is documented as
keeping. It now agrees with step 2's carryover for the band (*"The box is in the water and they
have no name"* — the box is back down in the flooded vault). `critical_success` no longer depends
on a lamp the agent may have lost on step 0.

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

**Why the added clause is load-bearing (Pass 2, editorial finding 20 — REVISE trigger 26).** As
drafted, this step asked the agent to say a fact they already held, which is the thing step 1's Eye
gate had just tested; nothing on the page made it supernatural perception or rite, so the prose did
not test its declared reach. *Spoken as the record spells it* makes the test perceiving and
performing the form a thing with its own law requires — which is what `veil` is — and it tightens
the chain rather than adding to it: step 1's reading is what supplies the form, which is exactly
what the carryover map already rewards. The `honesty_cunning` axis survives intact, because a
made-up name still fails against something that knows the spelling, and the trait card's `failure`
fragment (*"They told it the truth. The truth was not what it was waiting for"*) reads better under
the rite than it did without it.

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

`success_at_cost` rewritten at Pass 2 (editorial finding 13): the draft's *"lost the shelf list with
it"* named a thing that appears nowhere else in the encounter.

**Two authored carryover maps, twelve lines, is the encounter's structural signature.** Slot 1 could
author six; a three-step chain with two `continue_weakened` predecessors can author twelve, and each
one is variance by construction — it renders only on the band its predecessor actually rolled.

### The five afterimages

| Band | Afterimage |
|---|---|
| `criticalSuccessAfterimage` | `They gave the warden a name it accepted, and walked out with the charter dry.` |
| `successAfterimage` | `They answered it, and it let the charter go. The box stayed.` |
| `successAtCostAfterimage` | `They got the charter out. The warden set a mark on them for taking it.` |
| `failureAfterimage` | `The warden would not have the answer, and the box went back on the shelf.` |
| `criticalFailureAfterimage` | `The shelf went over into the water, and they came up the stair with the charter still down there.` |

`critical_failure` rewritten at Pass 2 (editorial finding 12): *empty hands* was verbatim slot 1's
`failure` afterimage tail.

---

## 9. The hands

Both hands are cut from the 21-type library. Every card that matches a library member names it in
`libraryCardId`, and the `name`, `effectLine` and `imageTag` are **library-generic**: the same face
reads correctly in any encounter its type deals into. Nothing on a card face names the vault, the
charter, the warden or the keeper.

**Card names are the library's own authored titles, verbatim from `CARD_CONTENT`.** Post-THR-1178
every member has an authored face, and the pivot's rule is one face per library card shared by every
hand that deals it — so renaming a member per encounter is a defect, not a flourish. **All thirteen
titles below were re-checked one by one against `CARD_CONTENT` at Pass 2 and all thirteen match
verbatim.** See § 17 finding 1: slot 1 renames **all seven** of its cards and should be corrected.

`fiction` is schema-required on `StepNudge` but **retired by Prose Doctrine v2 and drawn by no
surface** (`unifiedAction.ts:1504-1521` — *"Do not author new `fiction`"*). Rather than author new
dead prose, each library card carries its own member's existing `quote` verbatim from
`src/data/nudge-card-library.ts`. Only the one-off (step 2, card 5) needed a line, because it has no
member to copy from; that single line is the encounter's one authored `fiction` string and it is
recorded as an exception rather than a pattern.

**Four faces were de-scened at Pass 2 (editorial finding 9, REVISE trigger 16).** A library-generic
face must read in any encounter its type deals into; four did not, and all four are corrected below
with the name-word-repetition rule re-checked on each. Two further lines were carrying magnitude the
pip row already renders, and one was ambiguous on a read-aloud (findings 10–11).

### Step 0 hand — 7 cards (five dealt to a god with no darkness or light attunement)

Questions answered, one per card: *leave no trace of the hand* · *turn the ground against what
resists* · *put a useful object in their way* · *see the gate before spending on it* · *make the
worst impossible* · *take the injury off them* · *make them want to go down at all*. No two buy the
same certainty.

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
- The Veil pays *down* the detection channel and pays *up* in essence. It is one of this encounter's
  three non-essence-channel cards and the only one that pays a channel down.
- **`valueDrift` added at Pass 2 (editorial finding 21).** `revelation_discretion` was declared in
  `motivations` with no carrier anywhere in the encounter — a declared mechanic the prose never used
  (REVISE trigger 26). This card and the Heavy Hand on step 2 already sat on that axis in fiction and
  were simply not wired. `negative` is the Sentinel pole (`src/types/agent.ts:59`): keep it under.
- `bandProse`:
  - `success`: `Nobody upstairs could say who helped them down.`
  - `near_miss`: `The hand behind it went unseen. It also went unfinished.`

**2. Loosen Their Footing** — `card.stumble.signature.chaos` · `fiction: 'Every structure has one loose piece.'`
> *effectLine:* `The ground turns against whoever would stop them, and gives way under them.`
- Chaos's signature weakens the opposition instead of strengthening the mortal, which is the one
  question nothing else in this hand answers.
- *Gives way under them* replaces the draft's *gives first*, which was ambiguous on a read-aloud.
- `bandProse`:
  - `critical_success`: `The dark below shifted first, and they went down through the gap it left.`
  - `failure`: `The ground gave in the wrong place, and it gave under them.`

**3. Find What Remains** — `card.cache.signature.matter` · `fiction: 'Matter keeps its promises longer than people do.'`
> *effectLine:* `Reveal a scroll case left by an earlier party. Oiled leather, theirs to keep.`
- `grants: [{ kind: 'attachment_grant', templateId: 'reward_tools_instruments_scroll_case', targetAgentId: '$actor' }]`
- Names the item on the face, following the shipped Cache precedent in `the-unclaimed-relic.ts`
  ("iron tongs they can use and keep"). **Kept at Pass 2 on precedent**, with the tension recorded:
  because the grant is per-hand and the face is per-library-member, this member now has two effect
  lines in the corpus. That is the structural argument for THR-887's typed text slots, filed at
  § 17 finding 7 rather than papered over.
- `bandProse`:
  - `success_at_cost`: `The case came up with them. Most of their own kit did not.`
  - `failure`: `They kept the case. Everything else they carried out was wet through.`

**4. Read The Whole Shape** — `card.whisper.attunement.light` · `reveals: 'next_step_demand'` · `fiction: 'Long looking shows what one glance cannot.'`
> *effectLine:* `Show them the layout of the place before they move through it.`
- `reveals: 'next_step_demand'` shows the reach and difficulty of **step 1**. Its honest value here
  is that step 0's band is the only lever anyone has on step 1, so seeing what step 1 will ask tells
  the god how hard to push on the descent. **Note the gate:** this member is
  `sphere_attunement / light / threshold 60`, the library's only member at the second mark — most
  gods never hold it, which is why § 7 no longer rests the handless step's design on it.
- `bandProse`:
  - `critical_success`: `They knew the room before they entered it, and never put a foot wrong.`
  - `failure`: `They had the whole layout and were heard anyway.`

**5. Spare The Worst** — `card.mercy.core` · `rider: 'no_crit_fail'` · `fiction: 'Failing is survivable. Some failures are not.'`
> *effectLine:* `However badly this goes, it cannot end in disaster.`
- **This hand's one rider, and the batch's un-spent one.** Slot 1 spends `floor_at_cost` and
  `all_or_nothing`; `no_crit_fail` is the third and the only rider neither encounter had used.
  Justification for it being here rather than on step 2: a bad entry is the failure this encounter
  most wants survivable, because `continue_weakened` means a catastrophic step 0 poisons two later
  steps rather than ending cleanly.
- `no_crit_fail` erases `critical_failure` while active, so the reachable failure bands are
  `failure` and `near_miss` — both carry a fragment.
- `bandProse`:
  - `near_miss`: `They got through on the last of it, and no further harm followed.`
  - `failure`: `It went badly and stopped there, and no worse thing came of it.`

**6. Mend What Broke** — `card.balm.hunger.reclaim` · `fiction: 'Some wounds are only debts the body is carrying.'`
> *effectLine:* `Close their wounds where they stand. The hurt stops slowing them.`
- `grants: [{ kind: 'remove_condition', conditionTraitId: 'trait.condition.wounded' }]`
- Deliberately targets `wounded` rather than `terrified`: slot 1's Balm already lifts the dread, and
  two Balms in one batch lifting the same condition is a mechanism echo.
- `bandProse`:
  - `success`: `They moved without a limp and were not heard.`
  - `near_miss`: `The hurt was gone and they still made noise on the stair.`

**7. Send A Dream** — `card.compulsion.hunger.haunt` · `fiction: 'Everyone is haunted. Few are visited on purpose.'`
> *effectLine:* `An urge arrives in their sleep and stays. For a while they will go looking.`
- `grants:`
  ```ts
  [{ kind: 'plant_compulsion', targetAgentId: '$actor',
     encounterBias: { explore: 0.6 },
     narrativeHook: 'Since the rain they have dreamed of rooms under rooms, and woken wanting to look.' }]
  ```
  `plant_compulsion` names no content id — the engine mints the `compulsionId` — so it cannot rot,
  and `encounterBias` is keyed on the closed `EncounterType` union, where `explore` is a live member.
- **De-scened at Pass 2.** The draft's *"Buried places pull at them for a while"* bound a
  corpus-wide face to this encounter's own subject; the mechanic is an `explore` bias, not a
  buried-place bias, and *"they will go looking"* states it generically. The `narrativeHook` stays
  scene-specific, which is correct — it is not part of the card face.
- A pole-leaning card: it argues for going down at all, without touching the roll's shape. Lawful
  nudge — the god works the mortal's inner weather, and the mortal still chooses.
- `bandProse`:
  - `success`: `They went down like a person who had been here before, because in sleep they had.`
  - `critical_failure`: `The urge kept them going after they should have turned back, and they were seen.`

**Step 0 arithmetic and guardrails**

| Check | Value | Verdict |
|---|---|---|
| Hand size | 7 | inside 4–8 ✓ |
| Distinct spheres | `darkness`, `chaos`, `matter`, `light` = **4** | ≥ `HAND_SPHERE_COVERAGE_MIN` (4) ✓ |
| Ungated common (sphere-less) options | 1 (`#5`, `card.mercy.core` — universal core, no gate) | ≥ `HAND_COMMON_OPTIONS_MIN` (1) ✓ |
| Distinct card types | 7 (veil, stumble, cache, whisper, mercy, balm, compulsion) | ≥3 ✓ |
| Boosts | 0 | ≤2 ✓ |
| Riders | 1 (`#5`) | ≤1 ✓ |
| Total `forecastDelta` | 0.07+0.09+0.06+0.10+0.04+0.05+0.08 = **0.49** | ≤ `NUDGE_HAND_MAX_TOTAL_DELTA` (0.70) ✓ |
| Difficulty + full hand | 0.38 + 0.49 = **0.87** | ≤ 1.0 ✓ |
| Big-delta cards (≥0.15) | none | no double-failure obligation |
| Every card has a failure-band fragment | `#1` near_miss · `#2` failure · `#3` failure · `#4` failure · `#5` near_miss+failure · `#6` near_miss · `#7` critical_failure | ✓ |
| Digits or `%` in any `effectLine` | none | ✓ |

**Six-band coverage, step 0**

| Band | Covered by |
|---|---|
| `critical_success` | Loosen Their Footing · Read The Whole Shape |
| `success` | Clear The Traces · Mend What Broke · Send A Dream |
| `success_at_cost` | Find What Remains |
| `near_miss` | Clear The Traces · Spare The Worst · Mend What Broke |
| `failure` | Loosen Their Footing · Find What Remains · Read The Whole Shape · Spare The Worst |
| `critical_failure` | Send A Dream |

---

### Step 2 hand — 7 cards (six dealt to a god without the trait)

Questions answered: *make them say what works* · *take the middle out of the ladder* · *bend the
season after this* · *spend the world's clock instead of essence* · *keep one true thing whatever
happens* · *do it openly and be seen doing it* · *be the person who does not lie to it*. No two buy
the same certainty, and the first and last are deliberate opposites on the same axis — which is what
makes the hand a decision rather than a menu.

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
- **De-scened at Pass 2.** The draft's *"the urge to give an answer that will do"* only read in a
  scene where someone is being questioned; this member is dealt across the corpus.
- `forecastDelta: 0.16` ≥ `NUDGE_BIG_DELTA` (0.15), so **both** failure bands are owed a fragment.
- `valueDrift`, not `poleLean`: this step never forks, and `poleLean` moves nothing when a step does
  not fork. The axis is `honesty_cunning` — Shadow's own pair, and the axis the warden's law sits on.
  `negative` is the Puppeteer pole (`src/types/agent.ts:56`).
- The batch's one permitted use of this over-exposed member (census cap ≤1; slot 1 did not use it).
- `bandProse`:
  - `critical_success`: `The answer came out smooth and complete, and the warden took it.`
  - `failure`: `The answer that would do was not the one it wanted.`
  - `critical_failure`: `They said a name they had made up, and the warden knew it as they said it.`

**2. Risk Everything** — `card.gambit.signature.chaos` · `rider: 'all_or_nothing'` · `fiction: 'Chaos has no use for the adequate.'`
> *effectLine:* `The middle outcomes fall away. It lands clean or it lands hard.`
- **This hand's one rider.** Justification: chaos's signature reshapes the ladder instead of climbing
  it, priced cheap because the widened downside *is* the price. Mercy sits in the other hand for the
  same reason — one shape-changing card per step, and the two are opposites, so the encounter's two
  riders are the narrow floor and the wide swing rather than two of the same idea.
- `bandProse`:
  - `critical_success`: `There was no middle left to land in, and it landed high.`
  - `critical_failure`: `They had no soft landing left, and they used the hard one.`

**3. Read The Pattern** — `card.omen.signature.time` · `fiction: 'Nothing happens only once.'`
> *effectLine:* `Steady their hand. The season after this leans toward more of the same.`
- `grants:`
  ```ts
  [{ kind: 'emit_omen', category: 'seasonal', intensity: 0.30,
     narrativeHook: 'The rain has opened cellars all over the country, and people have started going down into them.',
     scope: { kind: 'global' }, sphereAlignment: 'time' }]
  ```
- *Steady their hand* replaces the draft's *Steady them a little* at Pass 2 (editorial finding 10):
  the pip row is the magnitude surface, and a face that editorialises its own size is odds-talk in
  words.
- The batch's one permitted use of this over-exposed member (census cap ≤1; slot 1 did not use it).
- `bandProse`:
  - `success`: `It went well for them, and the season after this will bring more of the same.`
  - `near_miss`: `It leaned their way and then stopped short.`

**4. Pay It Elsewhere** — `card.bargain.signature.entropy` · `costs: { doomDelta: 0.05 }` · `fiction: 'Nothing is free. Some prices are only slower.'`
> *effectLine:* `No essence spent. The world's own ending comes nearer to cover the cost.`
- Zero essence, legal because a named channel carries the price. The **second** non-essence-channel
  card. *No essence spent* is kept deliberately: for the Bargain, "the price is paid on another
  channel" is the type's whole mechanism, not a comment on magnitude.
- This is the one member this encounter shares with slot 1; the census does not cap it, and it
  is the library's only entropy signature, so the alternative was an encounter with no entropy at
  all. **Recorded at Pass 2:** the two slots currently ship this member with two different effect
  lines, which is the same defect class as shipping it under two names — § 17 finding 8.
- `bandProse`:
  - `success`: `They got through. The debt for it was booked against the world's ending.`
  - `failure`: `The cost was booked against the world, and the vault gave up no more for it.`

**5. Salvage One Fact** — **one-off, no `libraryCardId`** · `fiction: 'A wager on the side still pays out.'`
> *effectLine:* `A steady hand now, and a piece of the truth kept win or lose.`
- `grants:`
  ```ts
  [{ kind: 'intelligence', category: 'cultural_knowledge',
     label: 'A Name Off The Shelf',
     detail: 'One name, read in passing from a record kept in this place, and remembered.',
     reliability: 0.6, targetAgentId: '$actor' }]
  ```
- **A stated one-off, and Pass 2 upholds it.** `side_bet` is a declared library *type* —
  `nudge-card-library.ts:128`, `effectShape: 'Modest boost + a worldly extra, win or lose'`,
  `hostSystem: 'Per-card aftermath'`, `status: 'impl'` — with **zero members**, and the brief
  blesses a one-off there explicitly. Shipping with **no `libraryCardId`** is the only correct
  choice today: naming a member that does not exist is the THR-844 rot class. The card honours its
  type's printed shape precisely — `0.05` is the modest boost, the `intelligence` record is the
  worldly extra, and grants fire per committed card after the step resolves, so *win or lose* is
  literally true.
- **De-scened at Pass 2.** The draft's *"a true name kept from this place"* only read in a
  name-getting scene; *a piece of the truth kept* reads wherever there is something to learn. The
  grant's `label` stays scene-specific, which is correct — a grant is per-hand, not part of the face.
- It is also this hand's **ungated common option**: sphere-less, no `requiredTrait`, no
  `requiredUnlock`, no `requiresGroup`, no `requiresFavor`. See § 17 finding 2 for the library
  proposal this should become.
- `bandProse`:
  - `success_at_cost`: `They came out short of the charter and long one true name.`
  - `failure`: `They lost the argument and kept the name, which is more than they went down with.`

**6. Light The Deed** — `card.heavy_hand.hunger.illuminate` · `costs: { detectionDelta: 0.15 }` · `valueDrift: { axis: 'revelation_discretion', toward: 'positive' }` · `fiction: 'Let them see who did this.'`
> *effectLine:* `Push hard and in the open. The help is unmistakable, and every rival power sees whose hand it was.`
- The **third** non-essence-channel card, and the Veil's exact inverse: one hand pays detection down,
  the other pays it up, which is the pairing the two types exist for. A zero-authoring library member.
- **`valueDrift` added at Pass 2 (editorial finding 21)**, giving `revelation_discretion` its second
  carrier. `positive` is the Seeker pole. The Veil and the Heavy Hand are now the same inverse on
  the value axis that they already were on the detection channel.
- `forecastDelta: 0.12`, under `NUDGE_BIG_DELTA`, so one failure fragment discharges it.
- `bandProse`:
  - `critical_success`: `The help was plain to see and it worked. Rival powers are looking at this ground now.`
  - `failure`: `It was done in the open and it failed in the open.`

**7. Draw On Character** — `card.trait_card.core` · `requiredTrait: 'trait.core.core_integrity.virtue'` · `essenceCost: 0` · `fiction: 'Character is the one resource nobody spends.'`
> *effectLine:* `What they already are carries them through. Nothing is spent to make it so.`
- **De-scened at Pass 2.** The draft's *"No essence. Being True, they speak a name they can stand
  behind"* hard-coded one trait pole onto `card.trait_card.core`, which every trait-variant
  encounter deals, and its first two words restated the cost row. The replacement reads for any
  trait and states the same mechanism. Name-word check: the name's content words are *Draw* and
  *Character*; neither appears in the line.
- Cost 0 because the price was paid by being that person. Hidden, never dimmed, for an agent who
  cannot hold the trait. Unlocked into the hand by the `traitVariant`'s `addNudgeIds`.
- Placed on step 2 rather than step 0 on purpose: the warden's law is a question about truth, so the
  trait card and the Undertow are the two poles of the same axis in the same hand.
- `bandProse`:
  - `success`: `They answered without shading it, and the answer was enough.`
  - `failure`: `They told it the truth. The truth was not what it was waiting for.`

**Step 2 arithmetic and guardrails**

| Check | Value | Verdict |
|---|---|---|
| Hand size | 7 | inside 4–8 ✓ |
| Distinct spheres | `darkness`, `chaos`, `time`, `entropy` = **4** | ≥4 ✓ |
| Ungated common (sphere-less) options | 1 (`#5`, the side-bet one-off) | ≥1 ✓ |
| Distinct card types | 7 (undertow, gambit, omen, bargain, side_bet, heavy_hand, trait_card) | ≥3 ✓ |
| Boosts | 0 | ≤2 ✓ |
| Riders | 1 (`#2`) | ≤1 ✓ |
| Total `forecastDelta` | 0.16+0.03+0.04+0.09+0.05+0.12+0.06 = **0.55** | ≤0.70 ✓ |
| Difficulty + full hand | 0.44 + 0.55 = **0.99** | ≤1.0 ✓ |
| Big-delta cards | `#1` (0.16) carries `failure` **and** `critical_failure` | ✓ |
| Every card has a failure-band fragment | `#1` fail+crit_fail · `#2` crit_fail · `#3` near_miss · `#4` fail · `#5` fail · `#6` fail · `#7` fail | ✓ |
| Digits or `%` in any `effectLine` | none | ✓ |

**Six-band coverage, step 2**

| Band | Covered by |
|---|---|
| `critical_success` | Offer The Easier Way · Risk Everything · Light The Deed |
| `success` | Read The Pattern · Pay It Elsewhere · Draw On Character |
| `success_at_cost` | Salvage One Fact |
| `near_miss` | Read The Pattern |
| `failure` | Offer The Easier Way · Pay It Elsewhere · Salvage One Fact · Light The Deed · Draw On Character |
| `critical_failure` | Offer The Easier Way · Risk Everything |

**Base prose reads with no hand active.** Every nudge-specific payoff above lives in `bandProse`;
the afterimages in §§ 6–8 and the `narrativeTemplates` in § 11 describe only what happens when the
god does nothing. No band base text mentions a trace hidden, a case found, a dream sent, a wound
closed, or a name supplied.

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
     factorLine: 'Being True, they will not read it to suit anyone.',
     addNudgeIds: ['archive.draw_on_character'],
   }]
   ```
   `trait.core.core_integrity.virtue` is the "True" pole of the Core integrity continuum, built by
   `CORE_TRAIT_DEFINITIONS` from `CORE_CONTINUA` (`src/types/coreRegistry.ts`) — a seeded definition,
   so `validateTraitRefs()` does not report it dead.
   **Why this trait and not a better-fitting one:** the continuum's own `reachCouplings` are
   `shadow: +1` and `eye: +1` — the two reaches this encounter's first two steps test — and it
   `governs: 'inner self matches outer'`, which is the warden's law stated as a character trait. It
   is also `quintessenceNative`, which is the right weight for a scene about whether a person will
   say a true thing when a false one would work. No new continuum is needed, so none is minted (the
   brief puts a new continuum out of scope, and the live registry serves this step exactly).
   **The factor line is a *reading* line**, which makes it step 1's authored variance surface — see
   § 7. That is deliberate placement, not a coincidence.
   **Variance note:** slot 1 hooks `core_hope`, the calibration case hooks `core_humility`. Neither
   encounter in this batch touches the other's continuum.
3. **Trait-only nudge?** — **Yes.** `archive.draw_on_character` (`card.trait_card.core`), cost 0,
   `requiredTrait: 'trait.core.core_integrity.virtue'`, unlocked by the variant's `addNudgeIds`.
   Hidden, never dimmed, for an agent who cannot hold the trait.
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
requires — the retired "foreshadow, never announce" rule is reversed. `success` and `failure` are
outcome-class and claim only what the mechanics wrote.

Two Pass 2 repairs (editorial findings 5–6): *before the water does* read as "before the water
brings them up", which inverts what the water is doing; and `failure` repeated *still* inside one
sentence.

---

## 12. Consequence-hand wiring — where `relationship` and `knowledge` each land

`consequenceDraw: ['relationship', 'knowledge']` — recomputed from the template id by
`check:encounter`.
`consequenceSwap: { from: 'movement', to: 'knowledge', reason: 'both slots of this batch drew movement, and slot 1 is its honest home — its failure bands are being driven back out of the ground. This encounter's prize is the record itself, so knowledge is what the scene was already about.' }`

`knowledge` holds weight 7 in `shadow`, comfortably over the ≥2 floor the one-swap rule requires.
**This is the batch's only swap and it is already spent** — nothing below deviates further.

### `relationship` → `bond_change`

Wired in **three band reactions**, so the family reads on both sides of the ladder and reads
differently on each:

| Band | Effect | Why this is *in context* |
|---|---|---|
| `critical_success` | `bond_change` `$cast:keeper`, `sentimentDelta: 0.22`, `trustDelta: 0.15` | The keeper asked a stranger to do the thing no local could be trusted with, and the stranger did it and let it be read in front of everyone. There is no version of that which leaves the two of them as they were. |
| `success` | `bond_change` `$cast:keeper`, `sentimentDelta: 0.10`, `trustDelta: 0.06` | The charter came up wet and readable and the keeper has it. Smaller move, same direction. |
| `failure` | `bond_change` `$cast:keeper`, `sentimentDelta: 0.12`, `trustDelta: 0.05` | **The band the family was drawn for.** They came up with nothing, and the keeper sat down with them anyway and asked what they had read. A relationship that only moves on success is a reward, not a relationship. |

Only the `critical_success` write is chipped (§ 13) — the brief allows one `individual`-anchored chip
per encounter, and chips are authored and reserved rather than a report of everything the engine did.
The other two writes are real, fire unconditionally on their bands, and are named in the overviews.

### `knowledge` → `intelligence` + `spawn_clue`

Wired on **every one of the five bands** via `intelligence`, plus a `spawn_clue` edge on
`critical_success`:

| Band | Effect | What is known afterwards |
|---|---|---|
| `critical_success` | `intelligence` (`political_secret`, reliability 0.95) + `spawn_clue` (`encounter_outcome`, `narrowed`, `$nearest_ruin`) | The whole charter, and a `knows_clue_of` edge pointing at the ruin where the older grant was filed. |
| `success` | `intelligence` (`political_secret`, reliability 0.80) | The charter: the founding families were granted this ground by another house. |
| `success_at_cost` | `intelligence` (`political_secret`, reliability 0.75) | The same, bought at the warden's price. |
| `failure` | `intelligence` (`cultural_knowledge`, reliability 0.40) | One name, and no proof of it. |
| `critical_failure` | `intelligence` (`cultural_knowledge`, reliability 0.30) | One line of a charter nobody can produce now. |

*In context:* the shape's contract is that information is the prize, put behind an Eye gate. The
ladder above **is** the prize scaling with how it went, and the fact that the two failure bands still
mint a record is this encounter's thesis and the source of its non-grim tone: what the water takes is
the paper, not what was read off it.

`spawn_clue` writes a real `knows_clue_of` edge to a real ruin node, so the family has a graph write
and not only a record. `targetRuinId: '$nearest_ruin'` is the documented runtime-resolved form, and
the `critical_success` overview now names what it points at, so the edge is legible in prose too.

**One authoring constraint, recorded rather than worked around:** `IntelligenceEffect.targetEntityId`
is **not** in `SCENE_SENTINEL_FIELDS` (`src/engine/encounterAftermath.ts`), so `'$target'` there
would be stored as the literal string and never match a reader. Every `intelligence` effect below
therefore omits `targetEntityId`. See § 17 finding 3.

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

Choice-less encounter, so the bands hang off `fallback` — which is why `byOutcome` lives *on* the
variant. `branchOnStep: 0` is inert with an empty `variants` map; it matches the shipped
calibration case's shape rather than inventing a new one. `changes: []` at the variant level, so
**no chip renders on a face that performs no write** (Law 56). Every chip below is band-scoped.

**One reaction per band, each carrying real writes.** This is the only structure under which every
chip is unconditionally backed: `AftermathOutcomeOverride.changes` and `.reactions` are independent
optional siblings, so a band's chips render regardless of which of its reactions the player picks —
and with exactly one reaction per band there is nothing to pick wrong.

**No step metadata anywhere.** Slot 1 puts its prize in `successMetadata` and its penalty in
`failureMetadata`; this encounter puts every write in the aftermath. That is a deliberate structural
contrast and it is safe here for a specific reason: `successMetadata` fires on `isStepSuccess`, which
counts `near_miss` as success and cannot tell `critical_success` from `success` — and this
encounter's entire prize ladder is exactly that distinction. A five-rung knowledge ladder cannot be
expressed on a two-valued surface, so it lives where the five bands are.

**Where the clock is paid off.** The rolled `threat` shape's terminal consequence sits on this
ladder rather than only in P3: `critical_failure` destroys the record. The fallback overview keeps
the water moving on every band, and the three step spines advance the waterline (rising vault → at
the bottom of the box → between the stair and the water). See § 1 row 5 for the full statement of
what is and is not modelled.

Five bands authored (floor is three): two success-side, two failure-side, and both extremes.

### `critical_success`

**Overview**
> `{actor}` came up with the charter dry and `{cast:keeper}` read it at the vault door. The founding
> families of `{location}` held this ground on another house's grant, and the charter names where
> that grant was filed. The water is over the low shelves now and nobody minds.

*Second clause repaired at Pass 2 (editorial finding 17): the draft's "the grant says where it was
filed" read as the grant naming its own filing place. It also makes the `spawn_clue`'s referent
legible.*

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
| `stateNoun` | `{ text: 'a record gained', entityId: '$target', visualKind: 'location' }` | `{ text: 'a bond warmed', entityId: '$cast:keeper', visualKind: 'agent' }` |
| `concepts` | `[{ text: 'intelligence record' }]` | `[{ text: 'bond' }]` |
| backing write | this band's reaction → `intelligence` | this band's reaction → `bond_change` |

`archive.crit.keeper_trusts` is **the encounter's one `individual`-anchored chip** (§ 14). The
`spawn_clue` fires on this band and is deliberately **unchipped** — a clue anchors through its
knower, which is `$actor`, and spending the encounter's only individual anchor on it would point the
player at the wrong end of the sentence. The overview names it, which is prose and claims nothing.

**Chip title ladder (Pass 2, editorial finding 25).** The three success-side bands all titled this
chip `The Charter Read` with the same `stateNoun`, flattening the top three rungs of the prize
ladder the whole encounter is built on. Titles now differentiate — `The Whole Charter` /
`The Charter Read` / `The Charter Bought` — while `stateNoun` stays `a record gained` on all five,
because it names the mechanic and must not vary for flavour (Consequences rule 0c).

### `success`

**Overview**
> `{actor}` brought the charter up wet and readable. `{cast:keeper}` has it and the families have
> heard. There is a watcher at the vault door now.

*Third sentence repaired at Pass 2 (editorial finding 16): the draft's "Since this morning there has
been a watcher" posted the watch before the outcome that caused it, while the chip claims that
outcome's write.*

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
| `stateNoun` | `{ text: 'a place under watch', entityId: '$target', visualKind: 'location' }` | `{ text: 'a record gained', entityId: '$target', visualKind: 'location' }` |
| `concepts` | `[{ text: 'under watch', entityId: 'trait.condition.location.under_watch', visualKind: 'attachment' }]` | `[{ text: 'intelligence record' }]` |
| backing write | this band's reaction → `condition_attachment` on `$target` | this band's reaction → `intelligence` |

`archive.success.watched` is **the location-anchored chip the brief requires**, declared with
`visualKind: 'location'` so it carries the click (THR-1172). Its backing write targets the location
directly through the `targetLocationId` sentinel, so the anchor and the write name the same object —
the one exemplary chip in the encounter on that axis. `trait.condition.location.under_watch` is the
live location condition whose own description is *"Someone is keeping eyes on this place. Quiet work
here is harder and more likely to be seen"* — a watched vault door is that condition's plain case,
and its readers mean the watch is a fact the simulation acts on. Deliberately **not** `pass_closed`,
which slot 1 spends.

### `success_at_cost`

**Overview**
> `{actor}` got the charter out and the warden set a price on it. The mark it left has not faded,
> and `{cast:keeper}` will not say what it means.

*Rewritten at Pass 2 (editorial finding 18): the draft used the word "mark" three times in three
sentences.*

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
| `stateNoun` | `{ text: 'Cursed', entityId: 'trait.condition.cursed', visualKind: 'attachment' }` | `{ text: 'a record gained', entityId: '$target', visualKind: 'location' }` |
| `concepts` | `[{ text: 'cursed', entityId: 'trait.condition.cursed', visualKind: 'attachment' }]` | `[{ text: 'intelligence record' }]` |
| backing write | this band's reaction → `condition_attachment` | this band's reaction → `intelligence` |

`trait.condition.cursed` is chosen over `wounded` and `exhausted` on purpose: the opposition is the
uncanny acting on its own law, and a curse is the only person-condition in the live set that reads as
a law being applied rather than an injury being taken. Slot 1 spends `wounded` and `exhausted`;
neither encounter repeats the other's condition.

### `failure`

**Overview**
> `{actor}` came up without the charter. The warden would not have the answer and put the box back on
> the shelf. `{cast:keeper}` sat with them afterwards and asked what they had read. One name is all
> they had, and they gave it. The water drops in the dry season, and the shelf will still be there.

*Final sentence added at Pass 2 (editorial finding 22). The `encounter_seed` is deliberately
unchipped — a seed anchors through its carrier, which is `$actor`, and chipping it would spend a
second `individual` anchor past the brief's ceiling of one — but the draft claimed it was "named in
the overview" and it was not. It is now, in prose, which claims nothing. 56 words, inside the
60-word band budget.*

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
| `stateNoun` | `{ text: 'Terrified', entityId: 'trait.condition.terrified', visualKind: 'attachment' }` | `{ text: 'a record gained', entityId: '$target', visualKind: 'location' }` |
| `concepts` | `[{ text: 'terrified', entityId: 'trait.condition.terrified', visualKind: 'attachment' }]` | `[{ text: 'intelligence record' }]` |
| backing write | this band's reaction → `condition_attachment` | this band's reaction → `intelligence` |

The `bond_change` and the `encounter_seed` both fire here unchipped, for the same reason: the
individual anchor is spent on `critical_success`, and both would need one. Both are now named in the
overview, which is prose and claims nothing.

### `critical_failure`

**Overview**
> The shelf went into the water with the box on it. `{actor}` got out. `{cast:keeper}` has lost the
> whole record of `{location}` and is grieving it. One line of the charter is still in `{actor}`'s
> head.

*Third sentence repaired at Pass 2 (editorial finding 19): the draft said "the town's whole record",
which is the encounter's only assertion of a settlement and does not read at the five `ruin`
subtypes or at `tower`. It now agrees with the chip's own `detail`.*

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
| `stateNoun` | `{ text: 'Grieving', entityId: 'trait.condition.grieving', visualKind: 'attachment' }` | `{ text: 'a record gained', entityId: '$target', visualKind: 'location' }` |
| `concepts` | `[{ text: 'grieving', entityId: 'trait.condition.grieving', visualKind: 'attachment' }]` | `[{ text: 'intelligence record' }]` |
| backing write | this band's reaction → `condition_attachment` on `$cast:keeper` | this band's reaction → `intelligence` |

The condition lands on the **keeper**, not the agent, and the chip anchors the condition *template*
rather than the person — the sanctioned form for an attachment anchor, and the form that keeps the
individual budget intact while the sentence names who is carrying it.

### Aftermath reaction choices — why one per band

The player's choice surface in the nudge model is **the hand**, played twice, on the two steps that
are about doing. The aftermath's job here is to land the consequence, and one reaction per band is
the only structure under which every chip is provably backed by a write that fires on the face it
renders on (Law 56). This follows the shipped, director-approved calibration case rather than the
pre-pivot "branching aftermath reactions" instruction, which the Composition Contract superseded.

Each reaction is still a stance rather than a mechanical variant: *read it aloud at the door* (the
truth becomes everyone's), *leave it in the keeper's hands* (the record stays with the office that
kept it), *take the mark and say nothing* (the price is not argued with), *sit down and hear what
they read* (the loss is shared), *tell the keeper plainly* (nothing is softened).

**Labels rewritten at Pass 2 (editorial finding 15).** All five originally began *Let…*, as do all
five of slot 1's — ten labels in one batch with the identical construction, which is REVISE trigger
22's repeated-sentence-shape class. The shipped corpus varies freely (`Say the name`, `Walk on
quiet`, `Carry it back to the company`, `Keep the forge-master close`), so this was a tic rather
than a house convention. Each stance is unchanged; each label now takes a distinct verb — *Read /
Leave / Take / Sit / Tell*. Reaction ids renamed to match. Slot 1 should do the same on its side.

### Tone, against the batch's one-grim-ending budget

Slot 1 resolves grim: the stair comes down, the place is closed, the agent is dragged out and put on
the road. This one is pitched the other way and the mechanism is structural rather than decorative —
**every band on this ladder mints a knowledge record**, including both failures. The worst ending
here loses a place's paper and a keeper's composure, and the agent still walks up the stair carrying
one line of it. The batch therefore ships one grim resolution, which is its cap.

---

## 14. Anchors

| Chip | Anchor kind | Declaration | Status |
|---|---|---|---|
| `archive.crit.charter_known` | **location** | `entityId: '$target'`, `visualKind: 'location'` | 🔗 linked |
| `archive.crit.keeper_trusts` | **individual** | `entityId: '$cast:keeper'`, `visualKind: 'agent'` | 🔗 linked |
| `archive.success.watched` | **location** | `entityId: '$target'`, `visualKind: 'location'` | 🔗 linked |
| `archive.success.charter_known` | **location** | `entityId: '$target'`, `visualKind: 'location'` | 🔗 linked |
| `archive.cost.marked` | attachment | `entityId: 'trait.condition.cursed'`, `visualKind: 'attachment'` | 🔗 linked |
| `archive.cost.charter_known` | **location** | `entityId: '$target'`, `visualKind: 'location'` | 🔗 linked |
| `archive.fail.shaken` | attachment | `entityId: 'trait.condition.terrified'`, `visualKind: 'attachment'` | 🔗 linked |
| `archive.fail.kept_name` | **location** | `entityId: '$target'`, `visualKind: 'location'` | 🔗 linked |
| `archive.crit_fail.keeper_grieves` | attachment | `entityId: 'trait.condition.grieving'`, `visualKind: 'attachment'` | 🔗 linked |
| `archive.crit_fail.one_line` | **location** | `entityId: '$target'`, `visualKind: 'location'` | 🔗 linked |

**Totals: 6 location · 3 attachment · 1 individual.** The brief's ceiling of one `individual`-anchored
chip is met exactly, and `individual` is the *rarest* anchor kind here rather than the default. No
`faction` anchor, per the brief. Every `entityId` passes `classifyAnchorDeclaration`: two sentinel
forms (`$target`, `$cast:keeper` — and `keeper` is a declared `supportBundle` key) plus three shipped
attachment template ids. No `tooltipId` is declared anywhere, so the THR-1172 dangling-tooltip half
cannot fire.

**The five knowledge chips anchor the place, and here is the argument, stated rather than assumed.**
The `intelligence` write is a record *about* the charter of `{location}`; the chip's sentence names
`{location}`; `$target` resolves to a real location node in the live world; and `intelligence` is a
member of `CHIP_BACKING_EFFECT_KINDS` (`compositionContract.ts:199`, re-verified at Pass 2). What
would make this airtight rather than merely sound is for the record itself to carry
`targetEntityId: '$target'` — which today it cannot, because that field is not sentinel-bound. That
is § 17 finding 3, filed rather than papered over. The alternative considered and rejected was
anchoring these at `$actor`, which is where the record physically lives — rejected because it would
put five person-anchors on one encounter, which is precisely the corpus habit the brief's ceiling
exists to break. **Pass 2 upholds this reading and its caveat.**

Anchor complementarity across the batch: slot 1 ships 6 attachment · 1 location · 1 individual; this
ships 6 location · 3 attachment · 1 individual. Category complementarity too — slot 1 authors
`boon`/`scar`/`path` and no `bond`; this authors `boon`/`scar`/`bond` and no `path`. Between them the
batch covers all four consequence categories without either encounter padding.

---

## 15. Images

**Scene tag:** `delve.archive.drowned_vault` (WS4 vocabulary; until the scene manifest exists the
fallback chain ends at EntityVisual). No `illustrationUrl` declared.

**Card tags** — every one resolves to a row in `ENCOUNTER_IMAGE_LIBRARY`, verified during drafting:

| Card | `imageTag` |
|---|---|
| Clear The Traces | `generic.dark` |
| Loosen Their Footing | `generic.luck` |
| Find What Remains | `generic.matter` |
| Read The Whole Shape | `generic.focus` |
| Spare The Worst | `generic.mercy` |
| Mend What Broke | `generic.vigor` |
| Send A Dream | `generic.memory` |
| Offer The Easier Way | `generic.strength` |
| Risk Everything | `generic.blade` |
| Read The Pattern | `generic.rumor` |
| Pay It Elsewhere | `generic.decay` |
| Salvage One Fact | `generic.blessing` |
| Light The Deed | `generic.light` |
| Draw On Character | `generic.oath` |

No tag repeats across the fourteen cards. Every one passes the genericity test — each reads in at
least three unrelated encounters, because each is a library-card face rather than a scene image.
Two tags are pinned to slot 1's assignment for the members the batch shares or that already ship:
`card.bargain.signature.entropy` → `generic.decay`, `card.trait_card.core` → `generic.oath`, and
`card.cache.signature.matter` → `generic.matter` matches the shipped calibration case. One face, one
image, across the corpus.

**Concept art direction (scene tag, for whoever paints it).** *What emotions does this story convey?*
A place's memory going under while people argue about what it says. The small, ordinary cost of
finding out what is true. Something patient in the dark that is not hostile and will not be moved.
*What image evokes those emotions without illustrating the action?* Not the descent, not the warden,
not the reading. A row of shelves with the waterline already partway up them, the lowest ledgers
swollen shut, and one dry page pinned to the wall above the line where somebody put it this morning.
Residue, not event. No people; their absence is the picture.

---

## 16. Live-content register (every id, and where it lives)

**Every row re-verified against source at Pass 2.** All hold.

| Id | Kind | File |
|---|---|---|
| `trait.core.core_integrity.virtue` | core trait (True) | `src/types/coreRegistry.ts` → `src/data/core-trait-content.ts` |
| `trait.condition.wounded` | condition (Balm target) | `src/data/condition-trait-content.ts:143` |
| `trait.condition.cursed` | condition | `src/data/condition-trait-content.ts:207` |
| `trait.condition.terrified` | condition | `src/data/condition-trait-content.ts:175` |
| `trait.condition.grieving` | condition | `src/data/condition-trait-content.ts:244` |
| `trait.condition.location.under_watch` | location condition | `src/data/condition-trait-content.ts:323` |
| `reward_tools_instruments_scroll_case` | possession, tier 1 | `src/data/reward-attachment-catalog.ts:2305` |
| 13 `libraryCardId`s (all but the side-bet) | card library members | `src/data/nudge-card-library.ts` — **all 13 titles match `CARD_CONTENT` verbatim** |
| all 14 `imageTag`s | image library rows | `src/data/encounter-image-library.ts` |
| `explore` | `EncounterType` member (compulsion bias) | `src/types/encounter.ts` |
| `political_secret`, `cultural_knowledge` | `IntelligenceCategory` members | `src/types/unifiedAction.ts` |
| `seasonal` | `OmenCategory` member | `src/types/omen.ts` |
| `honesty_cunning` (+Confessor / −Puppeteer), `revelation_discretion` (+Seeker / −Sentinel) | `ValuePair` members | `src/types/agent.ts:56,59` |
| `acolyte`, `monk`, `chaplain`, `scribe` | NPC roles / `LOCATION_ROLE_ROSTERS` | `src/types/npc.ts:62,297,336` |
| `growth`, `trait`, `shell_state` | `EncounterAftermathChangeKind` members | `src/types/unifiedAction.ts:176` |
| `intelligence` | member of `CHIP_BACKING_EFFECT_KINDS` | `src/data/content-eval/compositionContract.ts:199` |

**Deliberately absent: `trait.condition.location.standing_welcome`.** It reads as the natural
positive location condition for a grateful settlement and it is **deprecated with zero writers**
(THR-1206, its own definition comment: *"Do not author new writers against it"*). The replacement
surface is a `reputation_with` edge, which this encounter deliberately does not reach for — the brief
names the reputation stack as the corpus reflex and this encounter's systems quota is met without it.

**Prize calibration, recorded.** The only material prize on any band is the tier-1 `Scroll Case`, and
it arrives from a *card*, not from an ending — so a god who plays no Cache gets no object at all from
this encounter, by design. Everything else on the ladder is knowledge. That is the honest reading of
`stakes: intel`, and it is the sharpest available contrast with slot 1, whose prize is two graded
tomes.

---

## 17. Findings for the batch report

*Renumbered and rewritten at Pass 2. Findings 1–5 are the draft's, corrected where the editorial
pass measured differently; 6–8 are new.*

1. **Slot 1 renames ALL SEVEN of its cards away from their library titles** — the draft reported two.
   Verified against `CARD_CONTENT` (`nudge-card-library.ts:570-728`):

   | `libraryCardId` | Library title | Slot 1 uses |
   |---|---|---|
   | `card.insurance.core` | Buy The Floor | *Set The Floor* |
   | `card.whisper.signature.light` | Show The Obvious | *Show The Shape* |
   | `card.bargain.signature.entropy` | Pay It Elsewhere | *Charge It To Doom* |
   | `card.compulsion.signature.mind` | Plant An Urge | *Set An Urge* |
   | `card.omen.hunger.wander` | Call Them Onward | *Mark The Road* |
   | `card.balm.signature.life` | Ease The Suffering | *Lift The Dread* |
   | `card.trait_card.core` | Draw On Character | *Draw On Conviction* |

   Post-THR-1178 the rule is one face per library card, shared by every hand that deals it, so a
   per-encounter rename is a defect — and `cardPlayTally`, the twilight harvest and the echo card all
   key on `libraryCardId` while the player reads a title no other encounter uses for the same card.
   **Recommendation: restore all seven.** This also dissolves the live batch echo between slot 1's
   *Show The Shape* and this encounter's *Read The Whole Shape*, which must be fixed on slot 1's side:
   *Read The Whole Shape* is `card.whisper.attunement.light`'s own authored title, and changing it
   here would manufacture the very defect this finding is about.
2. **`side_bet` should gain a library member.** This encounter authors the type's corpus debut as a
   stated one-off (`archive.salvage_one_fact`), because the library has no `side_bet` member at all
   while the type is declared `status: 'impl'` with a host system. The face as revised is fully
   generic — a modest steadying plus one piece of the truth kept, win or lose — and passes the
   genericity test in any encounter with something to be learned. **Recommendation:** a library
   proposal against `src/data/nudge-card-library.ts`, seeded from this face. The draft proposed the
   id `card.side_bet.core`; whether the member is a core, a signature or a hunger unique depends on
   `UNIVERSAL_CORE_TYPES`, so the ticket picks the shape rather than this document asserting it.
   Library extension is a code change with a reviewer, never an authoring-session judgement.
3. **`IntelligenceEffect.targetEntityId` is not sentinel-bound.** `SCENE_SENTINEL_FIELDS`
   (`src/engine/encounterAftermath.ts`) covers `targetAgentId`, `withAgentId`, `counterpartyId`,
   `debtorAgentId`, `targetFactionId`, `factionId`, `targetSublocationId` and `targetLocationId` —
   not `targetEntityId`. An author writing `targetEntityId: '$target'` ships the literal string into
   the record, where `hasIntelligenceAbout` and the location-matching readers in
   `src/engine/intelligence.ts` will never match it. The failure is silent: the record exists, the
   chronicle line prints, and only the consumption path is dead. This encounter omits the field.
   **Recommendation:** add `targetEntityId: 'location'` to `SCENE_SENTINEL_FIELDS` — the same
   widening THR-1143 did for `targetLocationId` and THR-1144 did for `factionId`, and it would make
   this encounter's five knowledge chips airtight rather than merely sound (§ 14).
4. **`ActionScale` has no member for the settlement tier.** Die 5 rolls
   `personal → company → settlement → region`, and the schema offers
   `'cosmic' | 'regional' | 'local' | 'personal'`. Slot 1 maps `company` → `'local'`; this maps
   `settlement` → `'local'` as well, so two different die faces collapse onto one schema value and
   the rolled spread is invisible in the data. Not this batch's problem to fix, but the die's
   coverage cannot be measured off the templates until the two vocabularies are reconciled.
5. **Anchor-catalog contradiction, seconding slot 1's finding.** The catalog lists `ambition` as
   anchorable by the ambition node id while `classifyAnchorDeclaration` rejects every literal node id
   that is not a shipped attachment template. This encounter hit the same wall from a different
   direction — an `intelligence` record has no node at all, so there is no id to name even in
   principle. The general shape of the gap: **the catalog enumerates what a chip may be *about*, the
   classifier enumerates what an author may *write*, and the two lists are not the same list.** One
   of them should move.
6. **THE HEADLINE — the batch's card budget cannot fund a three-step encounter.** *New at Pass 2;
   this is the finding the draft rationalized away as a design choice.* The brief asks for one 2-step
   and one 3-step encounter, caps seven over-exposed members at ≤1 each across the batch, bans one
   outright, and requires ≥6 cards from the 14 zero-authoring members (almost all hunger uniques —
   hunger-gated and sphere-less). The hand rules then require ≥4 distinct spheres **and** ≥1 ungated
   sphere-less common option **per hand**. Those are jointly unsatisfiable at three hands: after slot
   1's one hand and this encounter's two, **every universal-core member is spent** (the only ungated
   sphere-less members in the library) and **only the `order` signature sphere remains**. There is no
   third hand to build, by anyone. Splitting step 0's seven cards does not help — it holds exactly
   four sphere-keyed cards. Three candidate fixes for the retro: make the over-exposure caps
   per-encounter rather than per-batch; add ungated sphere-less members to the library (four
   universal-core members is a very small floor when a batch can hold five or six hands); or brief
   step counts against the card budget, since a 3-step encounter needs roughly half again the member
   budget of a 2-step and nothing in the brief template makes that visible.
7. **A library card face has no canonical `effectLine`, and it shows twice in one batch.** *New at
   Pass 2.* `CARD_CONTENT` holds `title` and `quote` only, so nothing catches two encounters shipping
   the same member with different rules text — which is the same defect as shipping it under two
   names. Two live instances: `card.bargain.signature.entropy` (slot 1: *"They get the help free. The
   world's clock runs faster to pay for it"*; here: *"No essence spent. The world's own ending comes
   nearer to cover the cost"*), and `card.cache.signature.matter`, whose face names the item it
   grants and therefore reads *"iron tongs"* in the shipped calibration case and *"a scroll case"*
   here. The Cache instance is the structural argument for THR-887's typed text slots
   (`{condition}`, `{host}`, `{target}`) rather than a defect to fix by hand. **Recommendation:** the
   batch reconciles the Bargain line on both slots now, and the library ticket in finding 2 considers
   adding `effectLine` to `CARD_CONTENT`, which is what makes this class impossible rather than
   merely noticed.
8. **`card.whisper.attunement.light` is the library's only member at attunement threshold 60.** *New
   at Pass 2.* Recorded because an author reaching for its `reveals: 'next_step_demand'` will
   reasonably assume it is broadly available; it is the single hardest-gated card in the library
   (`nudge-card-library.ts:508`), and the draft rested a whole design decision on it. Not a defect —
   the gate is deliberate — but it belongs in whatever an author reads before choosing a Whisper.

*Retired at Pass 2:* the draft's finding 6 (the declared clever-specificity near-miss on *"two men …
and both came back"*). The sentence was fine on its own terms; the actual defect was that slot 1's P2
already spent the same beat, which is a cross-slot seam echo. Fixed in § 4 by rewriting P2, which
removes the count from the encounter entirely.

---

## 18. The narrator's checklist (12 questions), answered in writing

*Answers verified independently by the Pass 2 critique agent; the full independent pass is in
`the-drowned-archive-editorial.md` § 4. Post-revision: 12/12.*

**A — the opening skeleton**

1. **Does P1 say how the agent arrived, with real graph names?** Yes. All three openings name
   `{name}` and `{location}`, state the arrival, and give the reason for stopping — the weather,
   which is load-bearing rather than decorative: *"{name} gets out of the rain at the ruins of
   {location}."*
2. **Does P2 state what is happening and what has gone wrong, as events with costs already paid?**
   Yes. The vault is under water; a page has already floated up saying the founding families never
   owned the ground; the keeper has already gone down as far as the water and turned back. Three
   events, all past, all before the agent does anything, and the cost is paid by the one person the
   encounter has cast.
3. **Does P3 land exactly one stake shape from the table, matching the brief?** Yes — **threat**, the
   shape rolled, and P3 is the clock and nothing else: *"The water is rising. By dark it will be over
   the shelves, and the rest of the record is gone."* Not compounded with a second shape; the ask
   that would have made it a Plea is moved out to `initiation`. Where the clock lives mechanically is
   stated in § 1 row 5 rather than left to the prose's word.
4. **Is the whole opening ≤80 words, subject-verb-object, one fact per sentence?** Yes — **70 words**
   with the longest P1. Every sentence is one fact.

**B — narrator mode**

5. **Could a game master read every sentence aloud as a report?** Yes. No interior sensation, no
   camera work, no atmosphere doing no job. Nothing is described from inside a body: there is no cold
   water on skin, no dark pressing in, no held breath. The rain is stated as the reason for stopping
   and the reason the cellar is filling, never described. The three lines that leaned in-situ were
   repaired at Pass 2 (step 1's `near_miss` carryover, step 0's `critical_failure` afterimage, and a
   participial fragment opener).
6. **Is every fact stated, never encoded?** Yes, and the revision strengthens it: the warden is now a
   flat statement in P2 rather than hearsay, *"It has harmed no one and it has let nothing out"* is
   the sentence rather than an inference from behaviour, and the warden's law names both what it
   wants and the form it wants it in.
7. **Does every sentence serve challenge, test, or outcome?** Yes, after four cuts. The sentences
   whose only job was satisfying a design rule are gone: *"The floor under the outcome held"* (job:
   prove the rider fired), *"The lean was there and it stopped short"* (job: report a forecast term),
   *"Steady them a little"* (job: restate the pip row) and *"No essence."* on the trait card (job:
   restate the cost row). Prose rule 6 satisfied.

**C — internal logic**

8. **Nothing referred to before it is introduced; every event has a visible cause; nothing
   contradicts what is established?** Yes, after three repairs at Pass 2 — a door that does not exist
   in a Veil fragment, a *shelf list* that appears nowhere else, and an ambiguous *that shelf* in step
   1's spine. The keeper is named in the spine before any later prose uses the token. The warden is
   stated in P2, shown in step 1's spine, and tested in step 2. The charter box is introduced in step
   1's spine before any afterimage or chip names it. The water's rise has a cause (the rain in P1) and
   a consequence (the clock in P3), and it advances visibly across the three step spines. The warden
   *sits* in step 1 and *stands* in step 2: escalation, marked by *now*, not drift. There is no
   contradiction between records that have been down there for generations and a vault to get into —
   the flood is new, the vault is not.
9. **One named person on stage per beat, named over unnamed?** Yes. `{cast:keeper}` is the single
   named person across the whole encounter. The founding families, the watcher and the warden stay
   unnamed, which is what each of them is: a body of claimants, a posted function, and a thing with a
   law instead of a name. No sentence genders the keeper.

**D — the interactive layer**

10. **Can the player restate the stake in one sentence?** Yes: *get down into the flooding vault,
    read the charter, and answer the thing that keeps it, before the water takes the shelves.*
11. **Is every card named verb+noun and described like a spell — direct effect, no mood, no
    odds-talk?** Yes, after Pass 2's four de-scening rewrites and two magnitude cuts. All fourteen
    names are imperative verb + noun in 2–4 words. Every effect line states the effect directly,
    carries no digits and no `%`, uses no odds vocabulary, repeats no content word from its own card's
    name, and reads correctly outside this encounter.
12. **Does every setting class the envelope declares have an opening written for it?** Yes — three
    declared classes, three openings, and no opening for a class the envelope does not declare
    (`validateSettingEnvelope` holds all four honesty rules).

---

## 19. Self-audit against every hard requirement

### Prose Doctrine v2

| Requirement | Verdict |
|---|---|
| Narrate, never inhabit — GM reading a module aloud | **PASS.** No sentence is written from inside the scene. |
| No interior sensation, no camera work, no jobless atmosphere | **PASS.** Nothing describes what anything feels like. The nearest edge is "soaked through" in a carryover line, which is an observable state a narrator reports and a factor the panel is explaining. |
| State facts, never encode them | **PASS.** The warden's existence, its law, its disposition, the page, the clock and the keeper's reason for asking a stranger are all said outright. |
| Three-paragraph opening skeleton, ≤80 words | **PASS.** 70 words with the longest P1. |
| No "clever specificity" — no measured counts, no paces, no writerly participles | **PASS, cleanly.** The draft's one declared item (a count of two men) is gone with the P2 rewrite, and the one participial opener (*"Knowing the room before entering it…"*) was replaced. No counts, paces, distances or participles remain anywhere. |
| Basic game-master language, common words, simple clauses | **PASS.** No authored sentence exceeds 22 words; no subordinate stacking; no semicolons anywhere. |
| Card effect line never repeats a content word from its card's name | **PASS** — re-checked per card at Pass 2, including all four rewritten faces. |
| Card names imperative verb + noun, 2–4 words | **PASS** — all fourteen, and thirteen of them are the library's own authored titles verbatim, checked one by one against `CARD_CONTENT`. |
| No `fiction` authored | **PASS, one exception, stated.** Thirteen cards copy their library member's existing `quote`. The side-bet one-off has no member to copy from, so one line was written for a schema-required field that no surface draws. |

### Hand rules

| Requirement | Step 0 | Step 2 |
|---|---|---|
| 4–8 cards | 7 ✓ | 7 ✓ |
| ≥4 distinct spheres | 4 ✓ (darkness, chaos, matter, light) | 4 ✓ (darkness, chaos, time, entropy) |
| ≥1 ungated common (sphere-less) | 1 ✓ (`card.mercy.core`) | 1 ✓ (the side-bet one-off) |
| ≤1 rider (justified in a comment) | 1 ✓ (`no_crit_fail`) | 1 ✓ (`all_or_nothing`) |
| ≤2 Boosts | 0 ✓ | 0 ✓ |
| ≥3 distinct card types | 7 ✓ | 7 ✓ |
| Every card pays off ≥1 failure band | ✓ | ✓ |
| `forecastDelta ≥ 0.15` covers both `failure` and `critical_failure` | n/a (none) | ✓ (`Offer The Easier Way`) |
| No digits or `%` in `effectLine` | ✓ | ✓ |
| Hand total ≤ 0.70 · difficulty + hand ≤ 1.0 | 0.49 · 0.87 ✓ | 0.55 · 0.99 ✓ |
| All six `StepOutcome` bands covered | ✓ | ✓ |
| Base band text reads with no hand active | ✓ — every nudge payoff is in `bandProse` | ✓ |
| Every card face library-generic | ✓ after Pass 2 (Send A Dream de-scened) | ✓ after Pass 2 (Undertow, Side-bet, Trait card de-scened) |

Step 1 carries no hand. § 7 states the honest reason — the batch's card budget cannot fund a third
library-cut hand — names it as the encounter's known weak point, and files the structural cause as
§ 17 finding 6. The Composition Contract's Hand block requires at least one nudge-bearing step and
this template has two.

### Card budget (batch-level)

| Instruction | Status |
|---|---|
| `card.boost.core` spent by slot 1 — must not use | **Not used.** ✓ This encounter authors **zero** Boosts of any member, against a corpus where boost is ~65% of annotated cards. |
| `card.insurance.core` spent by slot 1 — must not use | **Not used.** ✓ |
| `card.boost.signature.energy` banned | **Not used.** ✓ |
| ≥3 cards from the zero-authoring member list | **3 used:** `card.balm.hunger.reclaim` · `card.compulsion.hunger.haunt` · `card.heavy_hand.hunger.illuminate`. Combined with slot 1's four, the batch spends **7 of the 14** zero-authoring members. ✓ |
| Over-exposed cards, ≤1 each across the batch | `card.mercy.core` ×1 (slot 1: 0) · `card.undertow.signature.darkness` ×1 (slot 1: 0) · `card.omen.signature.time` ×1 (slot 1: 0). The three that slot 1 spent — `compulsion.signature.mind`, `heavy_hand.signature.force`, `kindled_ambition.signature.spirit` — are **not used here**. ✓ |
| ≥1 card priced on a non-essence channel | **3:** `Clear The Traces` (`detectionDelta −0.10`) · `Pay It Elsewhere` (`doomDelta 0.05`, zero essence) · `Light The Deed` (`detectionDelta 0.15`). ✓ |
| ≥1 card with a real `grants` against built content | **5:** `Find What Remains` (`attachment_grant`, live id) · `Mend What Broke` (`remove_condition`, live id) · `Send A Dream` (`plant_compulsion`, no id to rot) · `Read The Pattern` (`emit_omen`) · `Salvage One Fact` (`intelligence`). All ids resolve for `validateNudgeGrantRefs`. ✓ |
| Type composition must differ from slot 1 | ✓ Four types are new to the batch — **stumble, mercy, side_bet, undertow** — and four of slot 1's are absent here. Only one *member* is shared across the batch (`card.bargain.signature.entropy`), and the two encounters share no rider. |
| ≤2 Boosts per hand, ≥3 types per hand | 0 Boosts across the whole encounter; 14 cards spanning 14 distinct types. ✓ |

### Composition Contract

| Block | Verdict |
|---|---|
| Steps | 3 plain steps (the contract's ceiling), each with reach, numeric difficulty, `narrativeTemplate` ✓ |
| Hand | two nudge-bearing steps; `checkNudgeHand` obligations met above; step 1's handlessness is inside the contract and is recorded as a constraint, not defended as a design ✓ |
| Setting | `settings` declared, three classes, three openings, `locationSubtypes` derived ✓ |
| Cast | one actor spec, class-honest at all three classes; every `{cast:keeper}` token names a declared key ✓ |
| Rewards | `spawn_clue`, `attachment_grant` and four `condition_attachment` writes are all `PERSISTENT_EFFECT_KINDS` ✓ |
| Aftermath | `aftermathConfig` present · 5 `byOutcome` bands (floor 3) · success-side, failure-side and both extremes · every variant carries an `overview` · every change declares `concepts` ✓ |
| Systems | **4** — cast · rewards · conditions · seeds (floor 3, brief target 4), and none of them is `reputation` or `factions` ✓ |
| Images | 14 tags, all resolve; no `illustrationUrl` ✓ |
| Consequence draw | `['relationship','knowledge']` with the brief's one recorded swap; both wired by effects the gate's walk can see (band reactions, **not** card grants) ✓ |

### Chips (Law 56)

| Clause | Verdict |
|---|---|
| 0 — every chip backed by a write that fires on that band | **PASS.** Each of the five faces performs the writes its chips claim, in that face's own single reaction: `critical_success` (`intelligence` + `bond_change`), `success` (`intelligence` + `condition_attachment` on `$target`), `success_at_cost` (`intelligence` + `condition_attachment`), `failure` (`intelligence` + `condition_attachment`), `critical_failure` (`intelligence` + `condition_attachment` on `$cast:keeper`). Variant-level `changes: []`, so the fallback face claims nothing. No `shell_state` chip sits over empty effects. `intelligence` re-verified as a member of `CHIP_BACKING_EFFECT_KINDS` at Pass 2. |
| 0b — the referent is a real graph object the sentence names | **PASS, with one reasoned reading stated at § 14 and upheld at Pass 2.** Three attachment-template anchors, six `$target` locations, one `$cast:keeper`. Every `entityId` passes `classifyAnchorDeclaration`. The five knowledge chips anchor the place their record is about; the sixth location chip's write targets the location directly through `targetLocationId`, so its anchor and its write name the same object. The engine limitation that keeps the first five from being airtight is filed as § 17 finding 3 rather than hidden. |
| 0c — `stateNoun` names the mechanic, `detail` names the endpoints, fiction last | **PASS.** Every `stateNoun.text` is a mechanic phrase (`a record gained`, `a bond warmed`, `a place under watch`, `Cursed`, `Terrified`, `Grieving`), never a scene noun — no "the charter they read", no "the mark on their arm". No placeholder appears in any `stateNoun.text`; that field is not enriched. Every `detail` names who and what before it decorates anything. The `title` field now renders the prize ladder rather than flattening it (§ 13). |
| 0d — no `reputation_tally` chip | **PASS.** None authored; no reputation chip of any kind, and no reputation effect. |
| 1 — cause → change, in that order, one sentence | **PASS.** Every chip carries a `causeClause` drawn from the scene that produced it, and no `causeClause` could be pasted into another encounter. |
| 2 — `stateNoun`, `direction`, `category` declared as structured fields | **PASS**, on all ten. All fields verified live on `EncounterAftermathChange` (`unifiedAction.ts:305-355`) at Pass 2. |
| 3 — category the character would recognise | **PASS.** 5 `boon`, 4 `scar`, 1 `bond`. No `path` — deliberate: the only candidate is the `encounter_seed`, whose carrier is `$actor`, and chipping it would spend a second `individual` anchor past the brief's ceiling. The seed is visible in the `failure` overview instead. Slot 1 authors the batch's `path`. |
| 4 — draw from the whole palette | **PASS.** Eight distinct write kinds: `condition_attachment` ×4 (three on a person, one on a place, one of the three landing on the *cast member* rather than the actor), `attachment_grant`, `intelligence` ×5, `spawn_clue`, `bond_change` ×3, `plant_compulsion`, `emit_omen`, `encounter_seed`. |

### Detectors

| Detector | Verdict |
|---|---|
| Evasive vagueness (all field classes, target zero) | **PASS.** Swept for every listed term. No `somehow`, `somewhat`, `seems to`, `appears to`, `a kind of`, `a sort of`, `something like`, `in some way`, `something`, or any nominalised `the situation / the matter / the moment / the atmosphere / the tension / the dynamic / the connection / the understanding / the balance / the energy / the presence / the experience / the process`. |
| Natural indefinites in `outcome`-class fields only | **PASS, and tightened at Pass 2.** No `someone`, `somewhere`, `things`, `stuff`, `thing`, `way`, `ways`, `nothing`, `anything`, `whatever` in any afterimage, band fragment, aftermath overview, chip `detail`/`causeClause`, or `narrativeTemplates.success`/`.failure`. Two outcome-class strings that carried `nothing` were rewritten (step 2's `critical_failure` afterimage and Pay It Elsewhere's `failure` fragment). `nothing` survives only in step 2's spine and one card effect line, both scene/interactive class where it is legal. |
| Intensifiers (warning only) | **Zero.** No `very`, `really`, `quite`, `rather`, `truly`, `deeply`, `profoundly`, `utterly`. |
| Annotation clauses (≤1 per encounter) | **Zero.** No `not … but` inside a single sentence anywhere, and **zero em-dashes in any authored string** — openings, spine, afterimages, carryover lines, fragments, effect lines, overviews, chip `detail` and `causeClause` all use full stops or commas instead, so `emDashNot` cannot fire by construction. |
| Divine outcome-authorship (zero, every class) | **PASS.** The god is never the grammatical author of a result. Every effect line has the god acting on the scene or on the mortal's inner weather (*leave no mark behind*, *close their wounds*, *fill them with the pull*, *push hard and in the open*); no line contains `decides`, `chooses`, `picks` or `determines`, and no line reads "the god decides whether/what/which/who". The Undertow fills a mortal with a pull; the mortal still speaks and fate still rolls. |
| Abstraction-as-subject (hand check) | **PASS.** Read sentence by sentence at Pass 2: every grammatical subject is a person, a place, a thing, the water, the ground, or the agent. The nearest miss is "The middle outcomes fall away", which is a rules sentence on a card face where the subject is the mechanic itself. The two lines that put an abstraction in the subject slot (*"The lean was there"*, *"The floor under the outcome held"*) were replaced. |
| Interactive plainness (`name`, `effectLine`, factor lines, purpose lines) | **PASS.** No metaphor on any label. Every purpose line is 3 words. Every carryover line is ≤12 words and names its source in the sentence, per canon rule 1. Two effect lines that editorialised their own magnitude were cut back. |

### Echo check (paragraph seams, and across the batch)

*Re-run seam by seam at Pass 2 by an agent that did not draft the encounter. Seven seams were
failing; all seven are fixed on this side.*

| Seam | Verdict |
|---|---|
| opening → spine | Clean. Each P1 closes on the weather and the place; the spine opens on the vault. No shared image, no shared construction. |
| spine P2 → spine P3 | Clean. P2 is the page and the keeper's failed attempt; P3 is the water and the clock. *Water* recurs deliberately — it is the noun the encounter is about, and a synonym would be the old mode. Three different sentence shapes. |
| step 0 spine → step 1 spine | Clean. Step 0 ends on the clock; step 1 opens below the water line on the shelves. |
| step 1 spine → step 2 spine | Clean. Step 1 ends on the box with water at its base; step 2 opens on the warden between the stair and the water. Only *water* recurs. |
| afterimages within step 0 | **Was failing** — two bands opened *"They got down"*. Five distinct openings now: *came down the stair · got down · Their lamp · went in loud · went off the last of the stair.* |
| afterimages within step 1 | Clean after finding 14: *read the whole charter · found the charter · got the charter up · The ink had gone · could not get the lid up.* |
| afterimages within step 2 | Clean: *gave the warden a name · answered it · got the charter out · would not have the answer · The shelf went over.* |
| carryover maps against each other | Clean, and this is the encounter's real structural achievement. Step 1's map is noise and light; step 2's map is names and ink. Twelve lines, zero shared verbs. |
| band overviews | Clean. Each names something only it can name: read at the door · a watcher at the door · a price the keeper will not explain · the keeper sitting down afterwards · the shelf going over. |
| chip titles across bands | **Was flat** on three bands; now a legible ladder (§ 13). |
| reaction labels | **Was failing** — five identical *Let…* constructions. Five distinct verbs now. |
| **across the batch (slot 1)** | **Was failing at four points, all fixed here:** the `ruin`/`arcane` P1 constructions, the P2 count-of-people beat, step 0's `success_at_cost` afterimage (*left … behind them* + *half a \<gear noun>*), and the Whisper `failure` fragment (*They knew exactly …*). Two remain slot 1's to fix: seven renamed card faces (§ 17 finding 1) and the ten *Let…* labels. One residual accepted: both carryover maps mention a lamp — slot 2's is load-bearing (it is the reading step's light), the two lines share no construction, and removing it would cost more than the echo does. |
| across the batch (calibration case) | Clean. The Unclaimed Relic is a one-step `stone` frostbite test. No shared reach, member or condition, and the only shared image tag (`generic.matter`) is the same library member's, which is correct. |

### Brief compliance

| Brief instruction | Verdict |
|---|---|
| Category: ruins and the delve | ✓ family `encounter.delve.*` |
| Shape: Puzzle–Investigation–Resolution, 3 steps, information behind the gate | ✓; the gate is handless, which § 7 records as a constraint of the batch's card budget rather than as a design |
| Step 0 `shadow`; steps 1 and 2 not `shadow`; at most one repeating a slot-1 reach | ✓ `eye` and `veil` — **zero** reaches repeat from slot 1, better than the ≤1 allowed |
| Every step `fair` or below | ✓ 0.38, 0.42, 0.44 (`fair` floor 0.30, `steep` floor 0.45) |
| Envelope `ruin` + `arcane` + `sacred`, one opening each, setting-neutral spine | ✓, and the one leak (*the town's*) is closed |
| Own `supportBundle`, class-honest at all three | ✓ § 5, checked against `LOCATION_ROLE_ROSTERS`, and disjoint from slot 1's roles |
| Rolled constraints honored, including the recorded opposition override | ✓ § 3, all five dice placed; the uncanny is the opposition on every step and is now the actual *test* on step 2 |
| P3 states the clock | ✓ *"By dark it will be over the shelves"*, and § 1 row 5 states where the clock lives mechanically |
| Hook recorded | ✓ `hook.dangerous_truth`; `usedBy` stamp is a Pass-4 task |
| `consequenceDraw: ['relationship','knowledge']`, both wired in context, the one swap recorded | ✓ § 12 |
| Systems quota ≥4 from the authored manifest | ✓ 4, none of them reputation or factions |
| ≥1 `location`-anchored chip with `visualKind` | ✓ six, of which `archive.success.watched` is anchor-and-write aligned |
| ≤1 `individual`-anchored chip | ✓ exactly 1 |
| No `reputation_tally` chip | ✓ none |
| ≥1 card on a non-essence channel · ≥1 card with real `grants` | ✓ 3 and 5 |
| ≥3 zero-authoring library members | ✓ 3 |
| Batch tone: at most one grim resolution | ✓ slot 1 takes it; this one's worst band still mints a record |
| No new engine primitives; mature systems only | ✓ cards, conditions, carryover, items, traits, seeds, intelligence |
| No `authoredChoices`, no player-picked fork | ✓ none |
| No new trait continuum | ✓ hooks a live one, and the one whose `reachCouplings` already name this encounter's first two reaches |
| Agent-magic not load-bearing | ✓ `arcane` is a setting class only; the warden is scene fiction with no mechanical dependency on the agent-magic system, and nothing in either hand touches it |

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

Both declared `motivations` now have carriers in the hands: `honesty_cunning` on the Undertow, and
`revelation_discretion` on the Veil (step 0) and the Heavy Hand (step 2) — see § 1 row 6.

Wrap the whole literal in `compileOpeningEnvelope({ ... })`.
