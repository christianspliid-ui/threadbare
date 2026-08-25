# Encounter Pipeline: The Drowned Archive

> Batch: **deep-places** (slot 2 of 2) · Slug: `the-drowned-archive` · Pass: **1 (draft)**
> Template id: `encounter.delve.the_drowned_archive` (FIXED — the consequence draw is recomputed from it)
> Date: 2026-08-25 · Pipeline version: 3 (Encounter Factory) · Format: locked THR-883 + THR-1045 Composition Contract
> Brief: `Docs/plans/encounters/deep-places-brief.md`
> Sibling slot: `Docs/plans/encounters/the-broken-seal-draft.md` (read for the batch's spent card budget)
> Calibration case matched: `src/data/encounters/the-unclaimed-relic.ts` (Prose Doctrine v2, director-approved)

**Implementation note for Pass 4:** this document is written to be translated to TypeScript
verbatim. Every prose string below is final. Every id below was resolved against the live
catalogs during drafting (§ 16 records where each one lives). Do not re-invent names, ids or
prose; if something does not compile, fix the wiring and keep the words.

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
| 1 | **Whose problem?** | The agent's, by adoption. They came in out of the rain; the vault is going under while they stand there and they are the only person present with no claim on the ground. The rolled role is **bystander pulled in**, and the design honours it by making the agent's uselessness to either side the exact reason they are asked. |
| 2 | **Reach per step, and why it is the theme** | Step 0 `shadow` — get down into the vault without the dark below hearing them: Shadow *is* hidden action. Step 1 `eye` — read waterlogged shelves by lamplight and know which page matters: Eye *is* knowledge and judgment. Step 2 `veil` — stand in front of a thing that keeps its own law and answer it: Veil *is* supernatural perception and rite. All three chosen before a word of prose. |
| 3 | **Why is the agent here?** | `chance` — the road passed a ruin, a tower or a sanctuary in a hard rain (the open-draw case). `choice` — they stay and go down when asked. `divine` — the god put the place in front of them. `mission` is not asserted anywhere in the prose. |
| 4 | **Mechanics and objects in play** | Trait variant (`trait.core.core_integrity.virtue`) and the trait-only card it unlocks · two carryover maps, six bands each · conditions (`cursed`, `terrified`, `grieving`, `wounded` as the Balm's target) · one location condition (`under_watch`) · one attachment grant on a card · one intelligence record on every aftermath band · one clue edge · one bond edge · one planted compulsion · one seed. Classification of every fact the prose states about the agent's connections: **all scene-local**. The prose asserts no history, debt, standing or prior visit — it explicitly says the agent has *no* claim here, which is a negative and mints nothing. Every durable fact is written by this encounter. Prose rule 7 satisfied by construction. |
| 5 | **Rewards and where the tension sits** | The prize is **information**, and the ladder is how much of it survives: the whole charter and where the older grant was filed (`critical_success`), the charter (`success`, `success_at_cost`), one name (`failure`), one line (`critical_failure`). Penalty side is concrete and legible: a curse on `success_at_cost`, `Terrified` on `failure`, the town's whole record destroyed on `critical_failure`. Quintessence stakes are moderate — this scene can cost a reputation for judgment, never a life. Tension sits on step 2: they have read it, and the thing on the ledge decides whether it leaves. |
| 6 | **Does the mortal choose?** | **None — this is a test.** No fork, no `decidedBy`, no branch. Two value axes the scene *tilts*: `revelation_discretion` (Eye's own pair — bring it up or leave it under) and `honesty_cunning` (Shadow's own pair — the warden asks for a true name and a false one would serve). The hand carries pole-leaning cards (Undertow, Compulsion, the trait card) so the god has levers on the mortal's inner weather, never on the outcome. |
| 7 | **Every promise pays off** | The opening promises three things and each has its designed reveal: *the page that floated up* → step 1's bands say whether it was torn from the charter and step 2's aftermath mints the record; *the warden the two men saw* → introduced as hearsay in P2, confirmed plainly in step 1's spine, and is step 2's whole test; *the rising water* → it is the clock, and it takes the low shelves on `critical_failure`. No mystery is opened that a band does not close. |
| 8 | **Systems touched (counted from the authored manifest)** | **4** — `cast` (support bundle) · `rewards` (`bond_change`, `spawn_clue`, `condition_attachment` — all `PERSISTENT_EFFECT_KINDS`) · `conditions` (four `condition_attachment` writes across the bands) · `seeds` (one `encounter_seed`). Target ≥4 met; contract floor is 3. `reputation` and `factions` are deliberately untouched (brief § Anchors), so the quota is **not** reached on the corpus-reflex stack. |

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
| 1 — stake shape | **threat** | P3 is the clock and nothing else: *"The water is rising. By dark it will be over the shelves, and the rest of the record is gone."* One shape, not compounded. The ask lives in `initiation`, so P3 stays pure threat. |
| 2 — opposition | **the uncanny** (motive: **its own law**), activity: **waiting** — a recorded override, brief § deviations | The warden. It is reported in P2 (hearsay from the two who came back), confirmed in step 1's spine as *sitting on the ledge and not moving*, and is step 2's whole test. Its law is stated outright: it lets nothing out unless it is told the name of whoever the records were left with. Waiting is its posture on every band. |
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
  ruin:   '{name} comes in out of the rain at the ruins of {location}.',
  arcane: '{name} stops at the tower of {location} with the storm still coming down.',
  sacred: '{name} takes shelter at the sanctuary of {location} in a hard rain.',
}
```

Each is one sentence, names the agent and the place from the graph, and puts the weather on the
page — the weather matters, because the rain is why the vault is filling and the filling is the
clock. `sacred` says *sanctuary* rather than *temple* so it reads at a wayside shrine as well as a
temple. `arcane` expands to `tower` alone, so *tower* is exactly honest. `ruin` covers five subtypes
and *the ruins of* reads at all five.

Deliberate contrast with slot 1, whose three openings all land on the hour of day: these land on the
weather. The two encounters do not open the same way at any class.

### The setting-neutral spine (P2 + P3), on step 0

> There {they} find the record vault under water. A page floated up this morning: the founding
> families never owned this ground. {cast:keeper} sent two men down for the rest, and both came back
> saying a warden sits in the dark below.
>
> The water is rising. By dark it will be over the shelves, and the rest of the record is gone.

No class scenery: no altar, no orrery, no fallen column. The vault, the water, the page, the keeper
and the warden are the encounter's own furniture and read identically at a ruin, a tower and a
sanctuary. Every settlement keeps its records somewhere, and every somewhere in this envelope has a
cellar.

**Word count with the longest P1** (`arcane`, 13 words): 13 + 41 + 20 = **74 words**. Budget 80. ✓

**The count in P2 is the exemplar's own shape, not clever specificity.** The director-approved
calibration opening reads *"Its freezing aura has already sent three guards to the infirmary."* —
a count of people who have already paid a cost is precisely what P2 owes. *"Sent two men down for
the rest, and both came back"* is that sentence. There are no measured distances, no paces, no
counts of attempts, and no participial openers anywhere in this encounter.

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
eight subtypes the envelope expands to, only `shrine` and `temple` carry rosters — the five `ruin`
subtypes and `tower` seed no NPCs — so reuse can only ever fire at `sacred` and the other two
classes always spawn. Every `reuseNpcRoles` entry is therefore picked from what `sacred` actually
seeds: `acolyte` (shrine 0.6, temple 0.9), `monk` (temple 0.8), `chaplain` (temple 0.7). All three
read as somebody who keeps a place's papers and would know what is on the shelves.
`spawnNpcRole: 'scribe'` is a spawn shape, not a roster claim, and a scribe reads correctly at a
ruined hall, a tower and a sanctuary alike.

Deliberately disjoint from slot 1's `['pilgrim', 'hermit', 'oracle']` / `spawnNpcRole: 'wanderer'`,
so the two encounters in one batch cannot bind the same person twice at a `sacred` draw.

`spawnName` is a real name because a declared key always resolves (THR-696) and `{cast:keeper}`
renders this string whenever no live NPC was reused. **The prose never genders the keeper** — reuse
binds whoever is standing there, and every sentence about them is written around pronouns.

`persistence: 'must-persist'` is load-bearing rather than habitual: the keeper receives a
`bond_change` on three bands and a `condition_attachment` on `critical_failure`. A cast member
collected at scene end would take those writes with them.

Token placement: role-voiced inline is the default; the token lands only where the name earns
something — the spine's introduction, the `initiation` ask, and four band overviews. One named
person on stage per beat; the two men, the families and the warden all stay unnamed, which is what
they are.

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
carryover map below is complete rather than truncated.

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
| `successAfterimage` | `They got down. The water carried the noise and the warden looked up once.` |
| `successAtCostAfterimage` | `They got down, and left their lamp and half a pack in the water behind them.` |
| `failureAfterimage` | `They went in loud, and the warden has been watching them since.` |
| `criticalFailureAfterimage` | `They fell the last of the stair into black water and came up loud and seen.` |

`near_miss` has no afterimage field by design; the hand's fragments pay it off (§ 9).

---

## 7. Step 1 — `eye`, "Read the shelves" — **the handless step**

```ts
reach: 'eye', difficulty: 0.42, duration: { min: 1, max: 2 },
purposeLine: 'Read the shelves',
failBehavior: 'continue_weakened',
onSuccess: [], onFailure: [],
nudges: undefined,   // deliberate — see below
```

### Why this step carries no hand (stated as a design choice, per the spec)

The Composition Contract requires **at least one** nudge-bearing step, not one per step, and this
shape is the reason the allowance exists. *Puzzle – Investigation – Resolution* makes information
the prize and puts it **behind** an Eye gate. A hand on the gate would let the god buy the clue, and
an information prize that can be purchased is not a prize — it is a price. So the god's hand plays
on the two steps that are about *doing*, and the one step that is about *knowing* resolves on the
mortal's own judgment plus what the descent cost them.

Three consequences, all intended:

1. **The rhythm differs from slot 1.** The Broken Seal is play → play. This is play → watch → play,
   and the watching is the beat the player is made to sit through.
2. **The Whisper on step 0 becomes the sharpest card in the encounter.** `card.whisper.attunement.light`
   carries `reveals: 'next_step_demand'`, so the god can *see* the gate before committing and still
   cannot *buy* it. That is the type's printed promise ("pay to see before you spend") doing real
   work rather than decorating a step the god could have bought outright.
3. **Step 1's difficulty carries its own weight.** With no hand, `0.42` plus the carryover is the
   whole equation, which is why step 0's carryover map is authored across all six bands rather than
   the two or three a hand would have blurred.

### `narrativeTemplate`

> Below the water line the shelves are still standing. The warden sits on the ledge above the last
> of them and has not moved. The charter box is on that shelf, and the water is at the bottom of it.

40 words. The charter and the warden are both introduced here, before anything else refers to them.
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
  near_miss:        { text: 'The noise of the entry is still moving in the water.',        polarity: 'against', forecastDelta: -0.02 },
  failure:          { text: 'They were heard on the stair and are watched now.',           polarity: 'against', forecastDelta: -0.05 },
  critical_failure: { text: 'They came down hard into the water and are soaked through.',  polarity: 'against', forecastDelta: -0.07 },
}
```

### The five afterimages

| Band | Afterimage |
|---|---|
| `criticalSuccessAfterimage` | `They read the whole charter by touch and lamplight, and know every name on it.` |
| `successAfterimage` | `They found the charter and read enough to know the floated page was torn from it.` |
| `successAtCostAfterimage` | `They got the charter up out of the box and left the rest of the shelf under water.` |
| `failureAfterimage` | `The ink had gone. They came away with a wet box and no names.` |
| `criticalFailureAfterimage` | `The shelf tipped and the box went into the water at their feet.` |

Note `critical_failure` here leaves the box **recoverable**: step 2 still has a test to run, which
is what `continue_weakened` promises.

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
> out. It wants the name of whoever the records were left with, and it will hear one answer.

38 words. The law is stated, not implied: one answer, and it must be a name. The disposition is
stated, not implied: it has harmed no one.

### `carryoverFactorLines` — keyed on **step 1's** band

```ts
carryoverFactorLines: {
  critical_success: { text: 'They read every name on the charter and can use one.',   polarity: 'for',     forecastDelta:  0.07 },
  success:          { text: 'The torn page gave them a name to say.',                 polarity: 'for',     forecastDelta:  0.04 },
  success_at_cost:  { text: 'They saved the charter and lost the shelf list with it.', polarity: 'against', forecastDelta: -0.02 },
  near_miss:        { text: 'They read the box lid and little else.',                 polarity: 'against', forecastDelta: -0.03 },
  failure:          { text: 'The ink was gone before they read a single name.',       polarity: 'against', forecastDelta: -0.06 },
  critical_failure: { text: 'The box is in the water and they have no name.',         polarity: 'against', forecastDelta: -0.08 },
}
```

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
| `criticalFailureAfterimage` | `The shelf went over into the water, and they came up the stair with empty hands.` |

---

## 9. The hands

Both hands are cut from the 21-type library. Every card that matches a library member names it in
`libraryCardId`, and the `name`, `effectLine` and `imageTag` are **library-generic**: the same face
reads correctly in any encounter its type deals into. Nothing on a card face names the vault, the
charter, the warden or the keeper.

**Card names are the library's own authored titles, verbatim from `CARD_CONTENT`.** Post-THR-1178
every member has an authored face, and the pivot's rule is one face per library card shared by every
hand that deals it — so renaming a member per encounter is a defect, not a flourish. See § 17
finding 1: slot 1 renames two members away from their authored titles and should be corrected.

`fiction` is schema-required on `StepNudge` but **retired by Prose Doctrine v2 and drawn by no
surface**. Rather than author new dead prose, each library card carries its own member's existing
`quote` verbatim from `src/data/nudge-card-library.ts`. Only the one-off (B5) needed a line written,
because it has no member to copy from.

### Step 0 hand — 7 cards (five dealt to a god with neither the trait nor deep light practice)

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

**1. Clear The Traces** — `card.veil.attunement.darkness` · `costs: { detectionDelta: -0.10 }` · `fiction: 'A practiced hand leaves less than a careful one.'`
> *effectLine:* `Leave no mark behind. No rival power can follow the hand back to its source.`
- The Veil pays *down* the detection channel and pays *up* in essence. It is one of this encounter's
  three non-essence-channel cards and the only one that pays a channel down.
- `bandProse`:
  - `success`: `Nobody upstairs could say who helped, only that the door gave quietly.`
  - `near_miss`: `The hand behind it went unseen. It also went unfinished.`

**2. Loosen Their Footing** — `card.stumble.signature.chaos` · `fiction: 'Every structure has one loose piece.'`
> *effectLine:* `The ground turns against whoever would stop them, and gives first.`
- Chaos's signature weakens the opposition instead of strengthening the mortal, which is the one
  question nothing else in this hand answers.
- `bandProse`:
  - `critical_success`: `The dark below shifted first, and they went down through the gap it left.`
  - `failure`: `The ground gave in the wrong place, and it was under them when it went.`

**3. Find What Remains** — `card.cache.signature.matter` · `fiction: 'Matter keeps its promises longer than people do.'`
> *effectLine:* `Reveal a scroll case left by an earlier party. Oiled leather, theirs to keep.`
- `grants: [{ kind: 'attachment_grant', templateId: 'reward_tools_instruments_scroll_case', targetAgentId: '$actor' }]`
- Names the item on the face, following the shipped Cache precedent in `the-unclaimed-relic.ts`
  ("iron tongs they can use and keep"). The face stays generic — every ruin, every scriptorium and
  every battlefield has an earlier party and something oiled left behind.
- `bandProse`:
  - `success_at_cost`: `The case came up with them. Most of their own kit did not.`
  - `failure`: `They kept the case. Everything else they carried out was wet through.`

**4. Read The Whole Shape** — `card.whisper.attunement.light` · `reveals: 'next_step_demand'` · `fiction: 'Long looking shows what one glance cannot.'`
> *effectLine:* `Show them the layout of the place before they move through it.`
- `reveals: 'next_step_demand'` shows the reach and difficulty of **step 1**, which is the handless
  Eye gate. The god sees the test it cannot buy. That is the sharpest single beat in the encounter
  and the reason the Whisper sits on step 0 rather than step 2.
- `bandProse`:
  - `critical_success`: `Knowing the room before entering it, they never put a foot wrong.`
  - `failure`: `They knew exactly where everything stood and were heard anyway.`

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
  - `failure`: `It went badly and stopped there. The floor under the outcome held.`

**6. Mend What Broke** — `card.balm.hunger.reclaim` · `fiction: 'Some wounds are only debts the body is carrying.'`
> *effectLine:* `Close their wounds where they stand. The hurt stops slowing them.`
- `grants: [{ kind: 'remove_condition', conditionTraitId: 'trait.condition.wounded' }]`
- Deliberately targets `wounded` rather than `terrified`: slot 1's Balm already lifts the dread, and
  two Balms in one batch lifting the same condition is a mechanism echo.
- `bandProse`:
  - `success`: `They moved without a limp and were not heard.`
  - `near_miss`: `The hurt was gone. Their footing still was not.`

**7. Send A Dream** — `card.compulsion.hunger.haunt` · `fiction: 'Everyone is haunted. Few are visited on purpose.'`
> *effectLine:* `An urge arrives in their sleep and stays. Buried places pull at them for a while.`
- `grants:`
  ```ts
  [{ kind: 'plant_compulsion', targetAgentId: '$actor',
     encounterBias: { explore: 0.6 },
     narrativeHook: 'Since the rain they have dreamed of rooms under rooms, and woken wanting to look.' }]
  ```
  `plant_compulsion` names no content id — the engine mints the `compulsionId` — so it cannot rot,
  and `encounterBias` is keyed on the closed `EncounterType` union, where `explore` is a live member.
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
> *effectLine:* `Fill them with the urge to give an answer that will do. It works, and it stays with them.`
- `forecastDelta: 0.16` ≥ `NUDGE_BIG_DELTA` (0.15), so **both** failure bands are owed a fragment.
- `valueDrift`, not `poleLean`: this step never forks, and `poleLean` moves nothing when a step does
  not fork. The axis is `honesty_cunning` — Shadow's own pair, and the axis the warden's law sits on.
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
> *effectLine:* `Steady them a little. The season after this leans toward more of the same.`
- `grants:`
  ```ts
  [{ kind: 'emit_omen', category: 'seasonal', intensity: 0.30,
     narrativeHook: 'The rain has opened cellars all over the country, and people have started going down into them.',
     scope: { kind: 'global' }, sphereAlignment: 'time' }]
  ```
- The batch's one permitted use of this over-exposed member (census cap ≤1; slot 1 did not use it).
- `bandProse`:
  - `success`: `It went well for them, and the season after this will bring more of the same.`
  - `near_miss`: `The lean was there and it stopped short.`

**4. Pay It Elsewhere** — `card.bargain.signature.entropy` · `costs: { doomDelta: 0.05 }` · `fiction: 'Nothing is free. Some prices are only slower.'`
> *effectLine:* `No essence spent. The world's own ending comes nearer to cover the cost.`
- Zero essence, legal because a named channel carries the price. The **second** non-essence-channel
  card. This is the one member this encounter shares with slot 1; the census does not cap it, and it
  is the library's only entropy signature, so the alternative was an encounter with no entropy at
  all. The two effect lines share no clause.
- `bandProse`:
  - `success`: `They got through. The debt for it was booked against the world's ending.`
  - `failure`: `The cost was booked and the ending down there did not change.`

**5. Salvage One Fact** — **one-off, no `libraryCardId`** · `fiction: 'A wager on the side still pays out.'`
> *effectLine:* `A steady hand now, and a true name kept from this place win or lose.`
- `grants:`
  ```ts
  [{ kind: 'intelligence', category: 'cultural_knowledge',
     label: 'A Name Off The Shelf',
     detail: 'One name, read in passing from a record kept in this place, and remembered.',
     reliability: 0.6, targetAgentId: '$actor' }]
  ```
- **A stated one-off.** The brief invites it: `side_bet` and `fellowship` have no library member at
  all, and a one-off is legal there "and worth doing once". `side_bet`'s printed shape is *modest
  boost plus a worldly extra, win or lose*, hosted by per-card aftermath — which is exactly the
  `intelligence` write, so the type gets its corpus debut on the encounter whose prize is knowledge.
  It is also this hand's **ungated common option**: sphere-less, no `requiredTrait`, no
  `requiredUnlock`, no `requiresGroup`, no `requiresFavor`. See § 17 finding 2 for the library
  proposal this should become.
- `bandProse`:
  - `success_at_cost`: `They came out short of the charter and long one true name.`
  - `failure`: `They lost the argument and kept the name, which is more than they went down with.`

**6. Light The Deed** — `card.heavy_hand.hunger.illuminate` · `costs: { detectionDelta: 0.15 }` · `fiction: 'Let them see who did this.'`
> *effectLine:* `Push hard and in the open. The help is unmistakable, and every rival power sees whose hand it was.`
- The **third** non-essence-channel card, and the Veil's exact inverse: one hand pays detection down,
  the other pays it up, which is the pairing the two types exist for. A zero-authoring library member.
- `forecastDelta: 0.12`, under `NUDGE_BIG_DELTA`, so one failure fragment discharges it.
- `bandProse`:
  - `critical_success`: `The help was plain to see and it worked. Rival powers are looking at this ground now.`
  - `failure`: `It was done in the open and it failed in the open.`

**7. Draw On Character** — `card.trait_card.core` · `requiredTrait: 'trait.core.core_integrity.virtue'` · `essenceCost: 0` · `fiction: 'Character is the one resource nobody spends.'`
> *effectLine:* `No essence. Being True, they speak a name they can stand behind.`
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
    'Bring the rest of the records up before the water does. {cast:keeper} cannot ask anyone with '
    + 'a claim on this ground to go down.',
  success:
    '{name} brought the charter up out of the water. What it says about this ground is out with it.',
  failure:
    '{name} came up without the charter. The water is still rising and the shelves are still down there.',
}
```

`initiation` is scene-class and states both the stake and the agent's role plainly, as Doctrine v2
requires — the retired "foreshadow, never announce" rule is reversed. `success` and `failure` are
outcome-class and claim only what the mechanics wrote.

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
and not only a record. `targetRuinId: '$nearest_ruin'` is the documented runtime-resolved form.

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

Five bands authored (floor is three): two success-side, two failure-side, and both extremes.

### `critical_success`

**Overview**
> `{actor}` came up with the charter dry and `{cast:keeper}` read it at the vault door. The founding
> families of `{location}` held this ground on another house's grant, and the grant says where it was
> filed. The water is over the low shelves now and nobody minds.

**Reaction** — `archive.let_it_be_read` · label `Let it be read at the door`
> intent: `The charter is read aloud where the families can hear it.`
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
| `title` | `The Charter Read` | `The Keeper Trusts Them` |
| `causeClause` | `It came up dry and was read at the door` | `A stranger with no claim brought the record up` |
| `detail` | `{actor} carries an intelligence record on {location} now: the founding families held this ground on another house's grant.` | `{cast:keeper} thinks well of {actor} now and will say so to anyone who asks.` |
| `stateNoun` | `{ text: 'a record gained', entityId: '$target', visualKind: 'location' }` | `{ text: 'a bond warmed', entityId: '$cast:keeper', visualKind: 'agent' }` |
| `concepts` | `[{ text: 'intelligence record' }]` | `[{ text: 'bond' }]` |
| backing write | this band's reaction → `intelligence` | this band's reaction → `bond_change` |

`archive.crit.keeper_trusts` is **the encounter's one `individual`-anchored chip** (§ 14). The
`spawn_clue` fires on this band and is deliberately **unchipped** — a clue anchors through its
knower, which is `$actor`, and spending the encounter's only individual anchor on it would point the
player at the wrong end of the sentence. The overview says it, which is prose and claims nothing.

### `success`

**Overview**
> `{actor}` brought the charter up wet and readable. `{cast:keeper}` has it and the families have
> heard. Since this morning there has been a watcher at the vault door.

**Reaction** — `archive.let_the_town_hold_it` · label `Let the town hold it`
> intent: `The charter stays with the keeper, and the vault door gets a watcher.`
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
directly through the `targetLocationId` sentinel, so the anchor and the write name the same object.
`trait.condition.location.under_watch` is the live location condition whose own description is
*"Someone is keeping eyes on this place. Quiet work here is harder and more likely to be seen"* —
a watched vault door is that condition's plain case, and its readers mean the watch is a fact the
simulation acts on. Deliberately **not** `pass_closed`, which slot 1 spends.

### `success_at_cost`

**Overview**
> `{actor}` got the charter out. The warden marked them for taking it, and the mark has not faded.
> `{cast:keeper}` has the charter and will not say what the mark is.

**Reaction** — `archive.let_the_mark_stand` · label `Let the mark stand`
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
| `title` | `Marked By The Warden` | `The Charter Read` |
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
> they had, and they gave it.

**Reaction** — `archive.let_them_talk_it_over` · label `Let them talk it over`
> intent: `The keeper sits down with them and hears what they read.`
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

The `bond_change` and the `encounter_seed` both fire here unchipped. The bond is unchipped because
the individual anchor is spent on `critical_success`; the seed is unchipped because a seed anchors
through its carrier, which is the agent, and the same budget applies. Both are named in the overview,
which is prose and claims nothing.

### `critical_failure`

**Overview**
> The shelf went into the water with the box on it. `{actor}` got out. `{cast:keeper}` has lost the
> town's whole record and is grieving it. One line of the charter is still in `{actor}`'s head.

**Reaction** — `archive.let_the_loss_land` · label `Let the loss land`
> intent: `Nobody softens it. The records are gone, and the keeper is told plainly.`
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
| `causeClause` | `The shelf went into the water with the town's records on it` | `They read a line off the charter before the shelf tipped` |
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

Each reaction is still a stance rather than a mechanical variant: *let it be read at the door* (the
truth becomes everyone's), *let the town hold it* (the record stays with the office that kept it),
*let the mark stand* (the price is not argued with), *let them talk it over* (the loss is shared),
*let the loss land* (nothing is softened).

### Tone, against the batch's one-grim-ending budget

Slot 1 resolves grim: the stair comes down, the place is closed, the agent is dragged out and put on
the road. This one is pitched the other way and the mechanism is structural rather than decorative —
**every band on this ladder mints a knowledge record**, including both failures. The worst ending
here loses a town's paper and a keeper's composure, and the agent still walks up the stair carrying
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
member of `CHIP_BACKING_EFFECT_KINDS`. What would make this airtight rather than merely sound is for
the record itself to carry `targetEntityId: '$target'` — which today it cannot, because that field is
not sentinel-bound. That is § 17 finding 3, filed rather than papered over. The alternative
considered and rejected was anchoring these at `$actor`, which is where the record physically lives —
rejected because it would put five person-anchors on one encounter, which is precisely the corpus
habit the brief's ceiling exists to break.

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

| Id | Kind | File |
|---|---|---|
| `trait.core.core_integrity.virtue` | core trait (True) | `src/types/coreRegistry.ts` → `src/data/core-trait-content.ts` |
| `trait.condition.wounded` | condition (Balm target) | `src/data/condition-trait-content.ts` |
| `trait.condition.cursed` | condition | `src/data/condition-trait-content.ts` |
| `trait.condition.terrified` | condition | `src/data/condition-trait-content.ts` |
| `trait.condition.grieving` | condition | `src/data/condition-trait-content.ts` |
| `trait.condition.location.under_watch` | location condition | `src/data/condition-trait-content.ts` |
| `reward_tools_instruments_scroll_case` | possession, tier 1 | `src/data/reward-attachment-catalog.ts` |
| 13 `libraryCardId`s (all but the side-bet) | card library members | `src/data/nudge-card-library.ts` |
| all 14 `imageTag`s | image library rows | `src/data/encounter-image-library.ts` |
| `explore` | `EncounterType` member (compulsion bias) | `src/types/encounter.ts` |
| `political_secret`, `cultural_knowledge` | `IntelligenceCategory` members | `src/types/unifiedAction.ts` |
| `seasonal` | `OmenCategory` member | `src/types/omen.ts` |
| `honesty_cunning`, `revelation_discretion` | `ValuePair` members | `src/types/agent.ts` |

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

## 17. Findings for Pass 2 / the batch report

1. **Slot 1 renames two library members away from their authored faces.** `card.trait_card.core`'s
   authored title is **Draw On Character** and slot 1 calls it *Draw On Conviction*;
   `card.whisper.signature.light`'s authored title is **Show The Obvious** and slot 1 calls it *Show
   The Shape*. Post-THR-1178 the pivot's rule is one face per library card, shared by every hand that
   deals it, so a per-encounter rename is a defect and not a flourish. It also produces a live echo
   between the two encounters in this batch: *Show The Shape* against this encounter's *Read The
   Whole Shape*, both whispers. **Recommendation:** restore both slot-1 names to their library
   titles; this encounter already uses library titles verbatim throughout.
2. **`side_bet` should become a library member.** This encounter authors the type's corpus debut as a
   stated one-off (`archive.salvage_one_fact`), because the library has no `side_bet` member at all.
   The face as written is fully generic — a modest steadying plus one true thing kept, win or lose —
   and passes the genericity test in any encounter with something to be learned. **Recommendation:**
   a `card.side_bet.core` proposal against `src/data/nudge-card-library.ts`, seeded from this face.
   Library extension is a code change with a reviewer, never an authoring-session judgement, so it is
   filed rather than done here.
3. **`IntelligenceEffect.targetEntityId` is not sentinel-bound.** `SCENE_SENTINEL_FIELDS`
   (`src/engine/encounterAftermath.ts`) covers `targetAgentId`, `withAgentId`, `counterpartyId`,
   `debtorAgentId`, `targetFactionId`, `factionId`, `targetSublocationId` and `targetLocationId` —
   not `targetEntityId`. An author writing `targetEntityId: '$target'` ships the literal string into
   the record, where `hasIntelligenceAbout` and the location-matching readers in
   `src/engine/intelligence.ts` will never match it. The failure is silent: the record exists, the
   chronicle line prints, and only the consumption path is dead. This encounter omits the field.
   **Recommendation:** add `targetEntityId: 'location'` to `SCENE_SENTINEL_FIELDS` — it is the same
   widening THR-1143 did for `targetLocationId` and THR-1144 did for `factionId`, and it would make
   this encounter's five knowledge chips airtight rather than merely sound (§ 14).
4. **`ActionScale` has no member for the settlement tier.** Die 5 rolls
   `personal → company → settlement → region`, and the schema offers
   `'cosmic' | 'regional' | 'local' | 'personal'`. Slot 1 maps `company` → `'local'`; this maps
   `settlement` → `'local'` as well, so two different die faces collapse onto one schema value and
   the rolled spread is invisible in the data. Not this batch's problem to fix, but the die's
   coverage cannot be measured off the templates until the two vocabularies are reconciled.
5. **Anchor-catalog contradiction, seconding slot 1's finding.** Slot 1 reports that the catalog lists
   `ambition` as anchorable by the ambition node id while `classifyAnchorDeclaration` rejects every
   literal node id that is not a shipped attachment template. This encounter hit the same wall from a
   different direction — an `intelligence` record has no node at all, so there is no id to name even
   in principle. The general shape of the gap: **the catalog enumerates what a chip may be *about*,
   the classifier enumerates what an author may *write*, and the two lists are not the same list.**
   One of them should move.
6. **One deliberate near-miss on the clever-specificity rule, flagged rather than defended silently.**
   P2 says *"sent two men down for the rest, and both came back"*. A count of people who have already
   paid a cost is the director's own approved P2 shape (*"already sent three guards to the
   infirmary"*), so this is cited rather than apologised for — but an independent read should confirm
   it lands as a cost and not as texture. No other count, distance, or measured quantity appears
   anywhere in the encounter.

---

## 18. The narrator's checklist (12 questions), answered in writing

**A — the opening skeleton**

1. **Does P1 say how the agent arrived, with real graph names?** Yes. All three openings name
   `{name}` and `{location}`, state the arrival, and give the reason for stopping: *"{name} comes in
   out of the rain at the ruins of {location}."*
2. **Does P2 state what is happening and what has gone wrong, as events with costs already paid?**
   Yes. The vault is under water; a page has already floated up saying the founding families never
   owned the ground; the keeper has already sent two men down and both have already come back. Three
   events, all in the past, all before the agent does anything.
3. **Does P3 land exactly one stake shape from the table, matching the brief?** Yes — **threat**, the
   shape rolled, and P3 is the clock and nothing else: *"The water is rising. By dark it will be over
   the shelves, and the rest of the record is gone."* Not compounded with a second shape; the ask
   that would have made it a Plea is moved out to `initiation`.
4. **Is the whole opening ≤80 words, subject-verb-object, one fact per sentence?** Yes — 74 words
   with the longest P1. Every sentence is one fact.

**B — narrator mode**

5. **Could a game master read every sentence aloud as a report?** Yes. No interior sensation, no
   camera work, no atmosphere doing no job. Nothing is described from inside a body: there is no cold
   water on skin, no dark pressing in, no held breath. The rain is stated as the reason for stopping
   and the reason the cellar is filling, never described.
6. **Is every fact stated, never encoded?** Yes. "It has harmed no one and it has let nothing out" is
   the sentence, not a heap of dropped tools for the reader to decode. "The warden sits on the ledge
   and has not moved" is stated; it is not implied by a stillness in the water.
7. **Does every sentence serve challenge, test, or outcome?** Yes. Challenge: the rising water, the
   contradicted charter, the warden's law. Test: the entry (shadow), the reading (eye), the answer
   (veil). Outcome: what is known afterwards and what it cost. Nothing is present because it "builds
   atmosphere".

**C — internal logic**

8. **Nothing referred to before it is introduced; every event has a visible cause; nothing
   contradicts what is established?** Yes. The keeper is named in the spine before any later prose
   uses the token. The warden enters the spine as hearsay from the two who came back, and is
   confirmed as fact in step 1's spine before step 2 tests against it. The charter box is introduced
   in step 1's spine before any afterimage or chip names it. The water's rise has a cause (the rain in
   P1) and a consequence (the clock in P3). There is no contradiction between "the records have been
   down there for generations" and "there is a vault to get into" — the flood is new, the vault is not.
9. **One named person on stage per beat, named over unnamed?** Yes. `{cast:keeper}` is the single
   named person across the whole encounter. The two men, the founding families and the warden stay
   unnamed, which is what each of them is: a reported pair, a body of claimants, and a thing with a
   law instead of a name.

**D — the interactive layer**

10. **Can the player restate the stake in one sentence?** Yes: *get down into the flooding vault,
    read the charter, and get past the thing that keeps it, before the water takes the shelves.*
11. **Is every card named verb+noun and described like a spell — direct effect, no mood, no
    odds-talk?** Yes. All fourteen names are imperative verb + noun in 2–4 words. Every effect line
    states the effect directly, carries no digits and no `%`, uses no odds vocabulary, and repeats no
    content word from its own card's name (checked one by one — § 19).
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
| State facts, never encode them | **PASS.** The warden's law, its disposition, the page, the clock and the keeper's reason for asking a stranger are all said outright. |
| Three-paragraph opening skeleton, ≤80 words | **PASS.** 74 words with the longest P1. |
| No "clever specificity" — no measured counts, no paces, no writerly participles | **PASS, with one declared item.** "Two men … and both came back" is the calibration opening's own shape (a count of people who have paid a cost) and is flagged at § 17 finding 6 for an independent read. No paces, no distances, no counts of attempts, no participial openers anywhere. |
| Basic game-master language, common words, simple clauses | **PASS.** No authored sentence exceeds 22 words; no subordinate stacking; no semicolons anywhere. |
| Card effect line never repeats a content word from its card's name | **PASS** — checked per card. Traces/mark·source · Footing/ground·gives · Remains/reveal·case·party · Shape/show·layout·move · Worst/badly·disaster · Broke/close·wounds·hurt · Dream/urge·sleep·places · Way/fill·urge·answer·works · Everything/middle·outcomes·lands · Pattern/steady·season·leans · Elsewhere/essence·ending·cost · Fact/steady·name·kept · Deed/push·open·help·power · Character/essence·True·speak·name. |
| Card names imperative verb + noun, 2–4 words | **PASS** — all fourteen, and thirteen of them are the library's own authored titles verbatim. |
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

Step 1 carries no hand; § 7 states the design choice and its three intended consequences. The
Composition Contract's Hand block requires at least one nudge-bearing step and this template has two.

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
| Type composition must differ from slot 1 | ✓ Four types are new to the batch — **stumble, mercy, side_bet, undertow** — and four of slot 1's are absent here: insurance, boost, kindled_ambition, cache-as-`hunger.gather`. Only one *member* is shared across the batch (`card.bargain.signature.entropy`), and the two encounters share no rider. |
| ≤2 Boosts per hand, ≥3 types per hand | 0 Boosts across the whole encounter; 14 cards spanning 14 distinct types. ✓ |

### Composition Contract

| Block | Verdict |
|---|---|
| Steps | 3 plain steps (the contract's ceiling), each with reach, numeric difficulty, `narrativeTemplate` ✓ |
| Hand | two nudge-bearing steps; `checkNudgeHand` obligations met above; step 1's handlessness is a design choice inside the contract, not an exemption ✓ |
| Setting | `settings` declared, three classes, three openings, `locationSubtypes` derived ✓ |
| Cast | one actor spec, class-honest at all three classes; every `{cast:keeper}` token names a declared key ✓ |
| Rewards | `bond_change`, `spawn_clue` and four `condition_attachment` writes are all `PERSISTENT_EFFECT_KINDS` ✓ |
| Aftermath | `aftermathConfig` present · 5 `byOutcome` bands (floor 3) · success-side, failure-side and both extremes · every variant carries an `overview` · every change declares `concepts` ✓ |
| Systems | **4** — cast · rewards · conditions · seeds (floor 3, brief target 4), and none of them is `reputation` or `factions` ✓ |
| Images | 14 tags, all resolve; no `illustrationUrl` ✓ |
| Consequence draw | `['relationship','knowledge']` with the brief's one recorded swap; both wired by effects the gate's walk can see (band reactions, **not** card grants) ✓ |

### Chips (Law 56)

| Clause | Verdict |
|---|---|
| 0 — every chip backed by a write that fires on that band | **PASS.** Each of the five faces performs the writes its chips claim, in that face's own single reaction: `critical_success` (`intelligence` + `bond_change`), `success` (`intelligence` + `condition_attachment` on `$target`), `success_at_cost` (`intelligence` + `condition_attachment`), `failure` (`intelligence` + `condition_attachment`), `critical_failure` (`intelligence` + `condition_attachment` on `$cast:keeper`). Variant-level `changes: []`, so the fallback face claims nothing. No `shell_state` chip sits over empty effects — the four `shell_state` chips that report a record are each backed by the `intelligence` write on their own band, and the fifth by a location condition. |
| 0b — the referent is a real graph object the sentence names | **PASS, with one reasoned reading stated at § 14.** Three attachment-template anchors, six `$target` locations, one `$cast:keeper`. Every `entityId` passes `classifyAnchorDeclaration`. The five knowledge chips anchor the place their record is about; the sixth location chip's write targets the location directly. The engine limitation that keeps the first five from being airtight is filed as § 17 finding 3 rather than hidden. |
| 0c — `stateNoun` names the mechanic, `detail` names the endpoints, fiction last | **PASS.** Every `stateNoun.text` is a mechanic phrase (`a record gained`, `a bond warmed`, `a place under watch`, `Cursed`, `Terrified`, `Grieving`), never a scene noun — no "the charter they read", no "the mark on their arm". No placeholder appears in any `stateNoun.text`; that field is not enriched. Every `detail` names who and what before it decorates anything. |
| 0d — no `reputation_tally` chip | **PASS.** None authored; no reputation chip of any kind, and no reputation effect. |
| 1 — cause → change, in that order, one sentence | **PASS.** Every chip carries a `causeClause` drawn from the scene that produced it, and no `causeClause` could be pasted into another encounter. |
| 2 — `stateNoun`, `direction`, `category` declared as structured fields | **PASS**, on all ten. |
| 3 — category the character would recognise | **PASS.** 5 `boon`, 4 `scar`, 1 `bond`. No `path` — deliberate: nothing here opens a route the game acts on, the seed is unchipped, and slot 1 already authors the batch's `path`. |
| 4 — draw from the whole palette | **PASS.** `condition` ×4 (three on a person, one on a place, and one of the three lands on the *cast member* rather than the actor), `possession` via a card grant, an intelligence record on every band, a clue edge, a bond edge, a planted compulsion, an omen, a seed. Eight distinct write kinds across the encounter. |

### Detectors

| Detector | Verdict |
|---|---|
| Evasive vagueness (all field classes, target zero) | **PASS.** Swept for every listed term. No `somehow`, `somewhat`, `seems to`, `appears to`, `a kind of`, `a sort of`, `something like`, `in some way`, `something`, or any nominalised `the situation / the matter / the moment / the atmosphere / the tension / the dynamic / the connection / the understanding / the balance / the energy / the presence / the experience / the process`. |
| Natural indefinites in `outcome`-class fields only | **PASS.** No `someone`, `somewhere`, `things`, `stuff`, `thing`, `way`, `ways`, `nothing`, `anything`, `whatever` in any afterimage, band fragment, aftermath overview, chip `detail`/`causeClause`, or `narrativeTemplates.success`/`.failure`. Two deliberate consequences: `nothing` appears only in step 2's spine and in one card effect line, both of which are scene/interactive class where it is legal; and the `success` overview says *"a watcher at the vault door"* rather than "somebody at the vault door". |
| Intensifiers (warning only) | **Zero.** No `very`, `really`, `quite`, `rather`, `truly`, `deeply`, `profoundly`, `utterly`. |
| Annotation clauses (≤1 per encounter) | **Zero.** No `not … but` inside a single sentence anywhere, and **zero em-dashes in any authored string** — openings, spine, afterimages, carryover lines, fragments, effect lines, overviews, chip `detail` and `causeClause` all use full stops or colons instead, so `emDashNot` cannot fire by construction. |
| Divine outcome-authorship (zero, every class) | **PASS.** The god is never the grammatical author of a result. Every effect line has the god acting on the scene or on the mortal's inner weather (*leave no mark behind*, *close their wounds*, *fill them with the urge*, *push hard and in the open*); no line contains `decides`, `chooses`, `picks` or `determines`, and no line reads "the god decides whether/what/which/who". The Undertow fills a mortal with an urge; the mortal still speaks and fate still rolls. |
| Abstraction-as-subject (hand check) | **PASS.** Read sentence by sentence: every grammatical subject is a person, a place, a thing, the water, the ground, or the agent. The nearest miss is "The middle outcomes fall away", which is a rules sentence on a card face where the subject is the mechanic itself. |
| Interactive plainness (`name`, `effectLine`, factor lines, purpose lines) | **PASS.** No metaphor on any label. Every purpose line is ≤4 words and says what is being tested. Every carryover line is ≤12 words and names its source in the sentence, per canon rule 1. |

### Echo check (paragraph seams, and across the batch)

| Seam | Verdict |
|---|---|
| opening → spine | The three P1s each end on the weather; the spine opens on the vault. No shared image, no shared construction. |
| spine P2 → spine P3 | P2 is about the page and the two men; P3 is about the water and the clock. The word *water* appears in both, deliberately — it is the noun the encounter is about, and a synonym would be the old mode. Sentence shapes differ (declarative event / declarative discovery + reported speech / declarative rule + consequence). |
| step 0 spine → step 1 spine | Step 0 ends on the clock; step 1 opens below the water line on the shelves. Different subject, different place, no repeated image. |
| step 1 spine → step 2 spine | Step 1 ends on the box and the water at the bottom of it; step 2 opens on the warden standing between the stair and the water. *Water* recurs as the encounter's noun; nothing else does. |
| carryover maps | Twelve lines, no two sharing a verb or a shape. Step 1's map is about noise and light; step 2's map is about names and ink. The two maps do not overlap in vocabulary at all, which is what makes them read as two different kinds of inheritance. |
| afterimages within a step | Step 0: without a sound / carried the noise / left their lamp / went in loud / fell the stair. Step 1: read the whole charter / read enough / got it out of the box / the ink had gone / the shelf tipped. Step 2: it accepted / it let it go / set a mark / would not have the answer / went over into the water. No two share a verb or a shape. |
| band overviews | Each names something only it can name: read at the door · a watcher at the door · a mark that has not faded · the keeper sitting down afterwards · the shelf going over. |
| across the batch (slot 1) | **Checked line by line.** Slot 1 is a two-step `star`→`stone` carryover delve about a seal, a coffer and hostile keepers, resolving grim; this is a three-step `shadow`→`eye`→`veil` investigation about a charter, a warden and a keeper who asks, resolving mixed-but-warm. Shared vocabulary is limited to *stair*, *water* and *shelf*, none of which appears in the same construction in both. Two things needed correcting and are filed rather than silently avoided: slot 1's *Show The Shape* against this encounter's *Read The Whole Shape* (§ 17 finding 1), and slot 1's fallback overview *"The seal is broken either way. What came up the stair is the rest of it"*, whose shape this encounter's fallback deliberately does not copy. |
| across the batch (calibration case) | The Unclaimed Relic is a one-step `stone` frostbite test. No shared member, no shared reach, no shared condition, and the only shared image tag (`generic.matter`) is the same library member's, which is correct. |

### Brief compliance

| Brief instruction | Verdict |
|---|---|
| Category: ruins and the delve | ✓ family `encounter.delve.*` |
| Shape: Puzzle–Investigation–Resolution, 3 steps, information behind the gate | ✓ and the gate is deliberately unbuyable (§ 7) |
| Step 0 `shadow`; steps 1 and 2 not `shadow`; at most one repeating a slot-1 reach | ✓ `eye` and `veil` — **zero** reaches repeat from slot 1, better than the ≤1 allowed |
| Every step `fair` or below | ✓ 0.38, 0.42, 0.44 (`fair` floor 0.30, `steep` floor 0.45) |
| Envelope `ruin` + `arcane` + `sacred`, one opening each, setting-neutral spine | ✓ |
| Own `supportBundle`, class-honest at all three | ✓ § 5, checked against `LOCATION_ROLE_ROSTERS`, and disjoint from slot 1's roles |
| Rolled constraints honored, including the recorded opposition override | ✓ § 3, all five dice placed; the uncanny is the opposition on every step |
| P3 states the clock | ✓ *"By dark it will be over the shelves"* |
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
  'A three-step delve: the town\'s record vault is flooding, a page has surfaced saying the '
  + 'founding families never owned the ground, and the thing that has been keeping the rest will '
  + 'only give it up for a true answer.',
```

Wrap the whole literal in `compileOpeningEnvelope({ ... })`.
