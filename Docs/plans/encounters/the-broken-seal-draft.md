# Encounter Pipeline: The Broken Seal

> Batch: **deep-places** (slot 1 of 2) · Slug: `the-broken-seal` · Pass: **1 (draft)**
> Template id: `encounter.delve.the_broken_seal` (FIXED — the consequence draw is recomputed from it)
> Date: 2026-08-25 · Pipeline version: 3 (Encounter Factory) · Format: locked THR-883 + THR-1045 Composition Contract
> Brief: `Docs/plans/encounters/deep-places-brief.md`
> Calibration case matched: `src/data/encounters/the-unclaimed-relic.ts` (Prose Doctrine v2, director-approved)

**Implementation note for Pass 4:** this document is written to be translated to TypeScript
verbatim. Every prose string below is final. Every id below was resolved against the live
catalogs during drafting (§ 15 records where each one lives). Do not re-invent names, ids or
prose; if something does not compile, fix the wiring and keep the words.

---

## 1. Mechanical design block (spec step 1 — written before a word of prose)

One line per row.

| # | Question | Answer |
|---|---|---|
| 0 | **Crux** (agent's POV) | The seal over the stair down is broken, the keepers will stop anyone who goes near it, and another treasure hunter is already below. |
| 0b | **Title states the crux** | *The Broken Seal* — a player reading only the title knows the complication. |
| 0c | **Shape** | **Test & Consequence** (2 steps, carryover) |
| 0c | **Setting** | `ruin` · `arcane` · `sacred` (all three, one opening each) |
| 0c | **Pressure** | `greed` (primary); `fear` as undertone |
| 0c | **Form** | `discovery` |
| 0c | **Objective** | `recover` |
| 0c | **Stakes** | `item` — an object kept or gained (attachment grant), against a concrete failure penalty |
| 0c | **System** | `carryover` (mature tier) — step 1 inherits how step 0 rolled |
| 0d | **Hook** | `hook.descent_into_darkness` — *"The way on goes down, the light will not last the distance, and what is down there was buried on purpose."* Stamp `usedBy` on this hook in `src/data/content-eval/plotHooks.ts` when the encounter ships. |
| 1 | **Whose problem?** | The agent's. They came for what is under the seal; the seal is already broken and someone is ahead of them. Protagonist, never bystander. |
| 2 | **Reach per step, and why it is the theme** | Step 0 `star` — the way down, in failing light, by a route that is no longer a stair: Star *is* fate, navigation and survival. Step 1 `stone` — hauling a weight up broken stone past people who want the stair shut: Stone *is* endurance. Both chosen before a word of prose; the scene grew from them. |
| 3 | **Why is the agent here?** | `chance` — the road passed a ruin/tower/sanctuary and the seal was already broken (the open-draw case). `choice` — they came for what is under it. `divine` — the god put the place in front of them. `mission` is honest too where a faction sent them; nothing in the prose asserts one. |
| 4 | **Mechanics and objects in play** | Trait variant (`trait.core.core_hope.virtue`) + the trait-only card it unlocks · conditions (`wounded`, `exhausted`, `terrified` as the Balm's target) · a location condition (`pass_closed`) · carryover lines keyed on step 0's band · two attachment grants · an ambition assignment · an agent relocation · an encounter seed · one bound cast actor. Classification of every fact the prose states about the agent's connections: **all scene-local**. The prose asserts no history, debt, standing or prior visit. Every durable fact is *minted* by this encounter (grants, aftermath, step metadata), never read. Prose rule 7 satisfied by construction. |
| 5 | **Rewards and where the tension sits** | Success side: a real prize — `Veilscript Fragment` on every success-side band, and `The Silent Testament` on `critical_success` only. Failure side: a concrete, game-legible penalty — `Exhausted`, and an `agent_relocation` that puts them on the road away from the place, which the map shows. Quintessence stakes are moderate: failing here costs confidence (`quintessence_shift`, `failure` band), never a life. Tension sits on step 1: they have the thing and the stair is held above them. |
| 6 | **Does the mortal choose?** | **None — this is a test.** No fork, no `decidedBy`, no branch. Two value axes the scene *tilts* without forking: `sacrifice_survival` (Star's own pair — what the coffer is worth risking) and `courage_prudence` (go down at all). The hand carries pole-leaning cards (Compulsion, Kindled Ambition) so the god has levers on the mortal's inner weather, not on the outcome. |
| 7 | **Every promise pays off** | The opening promises three things and each has its designed reveal: *what is under the seal* → step 1's spine names the coffer, and the success bands grant what was in it; *the one who came back* → the keepers' hostility is the pressure on step 1, and their refusal is the failure band; *the rival already below* → `{cast:rival}` resolves in three band overviews. No mystery is opened that a band does not close. |
| 8 | **Systems touched (counted from the authored manifest)** | **4** — `cast` (support bundle) · `rewards` (two `attachment_grant`s) · `conditions` (three `condition_attachment` writes) · `seeds` (one `encounter_seed`). Target ≥4 met; contract floor is 3. `reputation` and `factions` are deliberately untouched — the ground under a ruin is not held by anybody (brief § Anchors). |

**Difficulty and reachability.** `intrinsicTier: 'background'` ⇒ open draw ⇒ every step sits at or
under `NUDGE_OFF_REACH_MAX_DIFFICULTY` (0.45). Step 0 `0.40` → **fair**. Step 1 `0.44` → **fair**.
Neither step is gated to actors who hold its reach, so the open-draw branch of the reachability
rule is the one honored.

---

## 2. Catalog picks (closed vocabularies — one entry each, nothing invented)

```
shape:     Test & Consequence
setting:   ruin, arcane, sacred
pressure:  greed  (undertone: fear)
form:      discovery
objective: recover
stakes:    item
system:    carryover
hook:      hook.descent_into_darkness
```

## 3. Rolled constraints (Seed Dice), and where each one lands

| Die | Rolled | Where it lands in the finished encounter |
|---|---|---|
| 1 — stake shape | **contest** | P3 closes on the rival: *"Another treasure hunter, {cast:rival}, went down an hour ago."* One shape, not compounded. |
| 2 — opposition | **the law / custom of the place** (motive: **precedent**), activity: **fleeing** | The keepers. P2 finds them *packing to leave* (fleeing). P3 states the motive as precedent: *"It was shut before any of them were born, and that is reason enough."* They are the pressure on step 1 and the agent of the `failure` and `critical_failure` bands. |
| 3 — disposition | **hostile** | Stated outright in P3: they will stop anyone who goes near the stair. Not softened anywhere. |
| 4 — agent's role | **the competitor** | The agent is racing `{cast:rival}` for what is below. Not a helpful passerby, not a judge — a claimant with a head start against them. |
| 5 — scale | **company** | The outcome touches the keepers (a body of people), the rival, and the place itself: `critical_failure` shuts the stair for everyone. `ActionScale: 'local'` is the schema value that carries company scale. |

Consequence hand: `consequenceDraw: ['drive', 'movement']` — **binding, no swap taken.** § 11 shows
where each family is wired in context.

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
  sacred: '{name} stops at the sanctuary of {location} in the afternoon.',
  arcane: '{name} arrives at the tower of {location} late in the day.',
  ruin:   '{name} comes to the ruins of {location} with half a day of light left.',
}
```

Each is one sentence, names the agent and the place from the graph, and puts the hour on the page —
the hour matters, because the light is the clock on the descent. `sacred` says *sanctuary* rather
than *temple* so it reads at a wayside shrine as well as a temple. `arcane` expands to `tower`
alone, so *tower* is exactly honest. `ruin` covers five subtypes and *the ruins of* reads at all
five.

### The setting-neutral spine (P2 + P3), on step 0

> There {they} find the keepers packing to leave. The seal over the stair down is broken. Two of
> them went below yesterday and one came back.
>
> The keepers will stop anyone who goes near the stair. It was shut before any of them were born,
> and that is reason enough. Another treasure hunter, {cast:rival}, went down an hour ago.

No class scenery: no altar, no orrery, no fallen column. The stair, the seal, the keepers and the
rival are the encounter's own furniture and read identically at a ruin, a tower and a sanctuary.

**Word count with the longest P1** (`ruin`, 13 words): 13 + 25 + 33 = **71 words**. Budget 80. ✓

---

## 5. Cast (Composition Contract, ruling 6)

```ts
const rivalSpec: EncounterSupportActorSpec = {
  kind: 'actor',
  key: 'rival',
  delivery: 'lazy-materialize-on-trigger',
  persistence: 'must-persist',
  reuseNpcRoles: ['pilgrim', 'hermit', 'oracle'],
  supportRole: 'rival_delver',
  spawnNpcRole: 'wanderer',
  spawnName: 'Idren Kall',
};
```

**Class honesty, checked against `LOCATION_ROLE_ROSTERS` (`src/types/npc.ts`).** A three-class
envelope inherits no family default bundle (THR-1044), so this template declares its own. Of the
eight subtypes the envelope expands to, only `shrine` and `temple` carry rosters at all — the five
`ruin` subtypes and `tower` seed no NPCs, so reuse can only ever fire at `sacred` and the other two
classes always spawn. Every `reuseNpcRoles` entry is therefore picked from what `sacred` actually
seeds: `pilgrim` (shrine 0.6, temple 0.7), `hermit` (shrine 0.5), `oracle` (shrine 0.7, temple 0.4).
All three read as someone who would come to a sealed stair for what is under it. `spawnNpcRole:
'wanderer'` is the spawn shape, not a roster claim, and reads at all three classes.

`spawnName` is a real name because a declared key always resolves (THR-696) and
`{cast:rival}` renders this string whenever no live NPC was reused. **The prose never genders the
rival** — reuse binds whoever is standing there.

Token placement: role-voiced inline is the default, and the token lands only where the name earns
something — the spine's introduction and three band overviews. One named person on stage per beat;
the keepers stay a plural, which is what they are.

---

## 6. Step 0 — `star`, "Find the stair down"

```ts
reach: 'star', difficulty: 0.40, duration: { min: 1, max: 2 },
purposeLine: 'Find the stair down',
failBehavior: 'continue_weakened',
onSuccess: [], onFailure: [],
// no factorLines (variance rule) · no carryoverFactorLines (first step has no predecessor)
// no successMetadata / failureMetadata — step 0's mechanical consequence IS the carryover
```

`continue_weakened` is the shape: a bad descent does not end the encounter, it hands step 1 a worse
starting position, which is exactly what `carryoverFactorLines` then reports. Because step 0 never
ends the action, **all six of its bands are reachable from step 1** — the reason this template can
author a full six-row carryover map where the corpus's other user could only author four.

No authored `factorLines`. Everything an earlier draft would have listed — the stair is broken, the
light is going, the keepers are hostile — reads identically on every run, so it is priced into
`difficulty: 0.40` and carried by the prose.

### The spine

See § 4. The `{frag:opening}` token is prepended at compile time; the two paragraphs above are the
`narrativeTemplate` value.

### The five afterimages

| Band | Afterimage |
|---|---|
| `criticalSuccessAfterimage` | `They found a clean line down and reached the bottom with light to spare.` |
| `successAfterimage` | `They got down. It took three tries and a hard drop at the end.` |
| `successAtCostAfterimage` | `They reached the bottom, and left a coil of rope and half a lamp of oil behind them.` |
| `failureAfterimage` | `They lost the line in the dark and came down hard on the broken stone.` |
| `criticalFailureAfterimage` | `The stone gave under them and put them at the bottom in the dark, badly hurt.` |

`near_miss` has no afterimage field by design; the hand's fragments pay it off (§ 8).

---

## 7. Step 1 — `stone`, "Carry it back up"

```ts
reach: 'stone', difficulty: 0.44, duration: { min: 1, max: 2 },
purposeLine: 'Carry it back up',
failBehavior: 'fail_action',
onSuccess: [], onFailure: [],
```

### `narrativeTemplate`

> Below the broken stair the ceiling comes down to a crawl. At the end of it there is a sealed
> coffer, heavy enough to need both arms. Getting it up is the hard part. The keepers are still at
> the top, and the light is nearly gone.

48 words. The coffer is introduced here, before anything refers to it. Reads correctly whether step
0 went well or badly — the difference is carried by the carryover lines, not by the prose.

### `carryoverFactorLines` — the one authored factor surface that survives the variance rule

Keyed on the band **step 0** rolled, so a different roll shows a different line or none. Each names
its source in the sentence (canon rule 1); each is ≤12 words; each `|forecastDelta|` ≤ `NUDGE_BIG_DELTA`.

```ts
carryoverFactorLines: {
  critical_success: { text: 'They know the short line back up and still have light.', polarity: 'for',     forecastDelta:  0.06 },
  success:          { text: 'They found the route down and can retrace it.',            polarity: 'for',     forecastDelta:  0.03 },
  success_at_cost:  { text: 'The rope they left below is not coming back up.',          polarity: 'against', forecastDelta: -0.03 },
  near_miss:        { text: 'The lamp burned most of its oil on the descent.',          polarity: 'against', forecastDelta: -0.04 },
  failure:          { text: 'They came down blind and do not know the route back.',     polarity: 'against', forecastDelta: -0.06 },
  critical_failure: { text: 'They came down hurt, at the bottom of a broken stair.',    polarity: 'against', forecastDelta: -0.08 },
}
```

### Step metadata — the writes that back the bands

```ts
successMetadata: {
  effects: [
    { kind: 'attachment_grant',
      templateId: 'reward_tomes_scrolls_veilscript_fragment',
      targetAgentId: '$actor' },
  ],
},
failureMetadata: {
  effects: [
    { kind: 'condition_attachment',
      templateId: 'trait.condition.exhausted',
      targetAgentId: '$actor' },
    { kind: 'agent_relocation',
      targetAgentId: '$actor',
      destination: { kind: 'away', minHexDistance: 3 },
      mode: 'travel' },
  ],
},
```

`successMetadata` fires on `isStepSuccess`, which counts `near_miss` as a success — so the prize
rides every success-side band unconditionally, backed by a write rather than gated behind a
reaction pick. `failureMetadata` fires on the two genuine failure bands, which is where the
`movement` family lands: driven up and out, and put on the road away from the place.

**Effect-ordering note for Pass 4:** `agent_relocation` is idempotent under a repeat write
(`setRelocationIntent` replaces); `condition_attachment` is not (unconditional `has_trait` add). No
other step writes `exhausted`, so nothing here can double.

### The five afterimages

| Band | Afterimage |
|---|---|
| `criticalSuccessAfterimage` | `They came up the stair with the coffer under one arm and walked past the keepers.` |
| `successAfterimage` | `They got it to the top. Their arms were shaking by the last turn.` |
| `successAtCostAfterimage` | `They came up with it and left their pack, their rope and a strip of skin below.` |
| `failureAfterimage` | `The keepers had the top of the stair, and they were turned out with empty hands.` |
| `criticalFailureAfterimage` | `They were hauled out of the dark by the ankles, and the stair came down behind them.` |

---

## 8. The hands

Both hands are cut from the 21-type library. Every card names its library member, and the `name`,
`effectLine` and `imageTag` are **library-generic**: the same face reads correctly in any encounter
its type deals into. Nothing on a card face names the seal, the stair, the coffer or the keepers.

`fiction` is schema-required on `StepNudge` but **retired by Prose Doctrine v2 and drawn by no
surface**. Rather than author new dead prose, each card carries its own library member's existing
`quote` verbatim from `CARD_CONTENT` in `src/data/nudge-card-library.ts`. Nothing new is written
into that field, and THR-1225's strip will take it with the rest of the corpus.

### Step 0 hand — 7 cards (six dealt to a god without the trait)

Questions answered, one per card: *see what is coming* · *know what it will cost later* · *pay it
somewhere else* · *keep them moving* · *bend the days after* · *take the fear off* · *be the kind of
person who goes on*. No two buy the same certainty.

| # | Type | `libraryCardId` | `id` | `sphere` | `name` | `essenceCost` | `costs` | `forecastDelta` | `rider` | `imageTag` |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Insurance | `card.insurance.core` | `seal.set_the_floor` | — (common) | Set The Floor | 3 | — | 0.04 | `floor_at_cost` | `generic.ward` |
| 2 | Whisper | `card.whisper.signature.light` | `seal.show_the_shape` | `light` | Show The Shape | 2 | — | 0.10 | — | `generic.light` |
| 3 | Bargain | `card.bargain.signature.entropy` | `seal.charge_it_to_doom` | `entropy` | Charge It To Doom | 0 | `doomDelta: 0.05` | 0.12 | — | `generic.decay` |
| 4 | Compulsion | `card.compulsion.signature.mind` | `seal.set_an_urge` | `mind` | Set An Urge | 2 | — | 0.08 | — | `generic.memory` |
| 5 | Omen | `card.omen.hunger.wander` | `seal.mark_the_road` | — (common) | Mark The Road | 1 | — | 0.05 | — | `generic.rumor` |
| 6 | Balm | `card.balm.signature.life` | `seal.lift_the_dread` | `life` | Lift The Dread | 2 | — | 0.05 | — | `generic.warmth` |
| 7 | Trait card | `card.trait_card.core` | `seal.draw_on_conviction` | — (common) | Draw On Conviction | 0 | — | 0.08 | — | `generic.oath` |

**Effect lines, grants and band fragments**

**1. Set The Floor** — `card.insurance.core` · `fiction: 'Every plan should survive being wrong.'`
> *effectLine:* `They come through it, however badly it goes. What that costs is taken out of their kit and their hide.`
- `rider: 'floor_at_cost'` — **this hand's one rider.** Justification: order-of-operations, not
  odds. It buys the floor rather than the ceiling, priced at the hand's essence ceiling because it
  converts both plain failure bands into a paid arrival. A second rider would answer the same
  question — *what shape does the outcome take* — twice.
- `bandProse`:
  - `success_at_cost`: `The bought arrival held. They reached the bottom and the descent took its fee off their back.`
  - `critical_failure`: `Even a bought arrival needs a floor to arrive on, and the floor was the part that went.`
  (`critical_failure` is the only failure band `floor_at_cost` leaves reachable while it is active.)

**2. Show The Shape** — `card.whisper.signature.light` · `reveals: 'next_step_demand'` · `fiction: 'Nothing was hidden. It was only unlit.'`
> *effectLine:* `They see what the next test will demand of them before they start it.`
- `reveals: 'next_step_demand'` is the Whisper's printed promise — *pay to see before you spend* —
  and it has a real reader here because this is a two-step shape: the thing revealed is step 1's
  reach and difficulty, which is genuinely unknown pre-commit.
- `bandProse`:
  - `critical_success`: `Knowing the size of the climb ahead, they picked the descent that would let them make it.`
  - `failure`: `They knew exactly what was coming and still could not find a line down to meet it.`

**3. Charge It To Doom** — `card.bargain.signature.entropy` · `costs: { doomDelta: 0.05 }` · `fiction: 'Nothing is free. Some prices are only slower.'`
> *effectLine:* `They get the help free. The world's clock runs faster to pay for it.`
- Zero essence, legal because a named channel carries the price. The **non-essence-channel card**
  the brief requires (one of three in this encounter).
- `bandProse`:
  - `success`: `The descent came easy. The price for it landed on the world's clock instead.`
  - `failure`: `The debt was taken on and the dark kept no side of it.`

**4. Set An Urge** — `card.compulsion.signature.mind` · `fiction: 'By morning it feels like their own idea.'`
> *effectLine:* `Their own mind starts pushing them forward, and it will not let go.`
- A pole-leaning card: it argues for going on, without touching the roll's shape. Lawful nudge —
  the god works the mortal's inner weather, never their decision.
- `bandProse`:
  - `success`: `The pushing came from inside them, and it carried them past the place they would have stopped.`
  - `critical_failure`: `Their own mind would not let them stop, and they were still going when the stone gave.`

**5. Mark The Road** — `card.omen.hunger.wander` · `fiction: 'Every road is asking to be followed.'`
> *effectLine:* `A small help now. What comes of this bends the days after toward the same ground.`
- `grants`:
  ```ts
  [{ kind: 'emit_omen', category: 'cultural', intensity: 0.35,
     narrativeHook: 'A seal that was shut on purpose is open, and the country has started saying so.',
     scope: { kind: 'global' }, sphereAlignment: 'time' }]
  ```
- `bandProse`:
  - `success`: `They got down, and word of an open seal will travel further than they will.`
  - `near_miss`: `The sign was given and taken. It still stopped short of the bottom.`

**6. Lift The Dread** — `card.balm.signature.life` · `fiction: 'Most suffering ends. This one ends sooner.'`
> *effectLine:* `Take their fear off them, and keep it off for as long as this lasts.`
- `grants: [{ kind: 'remove_condition', conditionTraitId: 'trait.condition.terrified' }]`
- `bandProse`:
  - `success`: `They went down unafraid, and unafraid was enough.`
  - `near_miss`: `The fear stayed gone. Their footing did not.`

**7. Draw On Conviction** — `card.trait_card.core` · `requiredTrait: 'trait.core.core_hope.virtue'` · `essenceCost: 0` · `fiction: 'Character is the one resource nobody spends.'`
> *effectLine:* `No essence. Being Hopeful, they keep going after the light fails.`
- Cost 0 because the price was paid by being that person. Hidden — never dimmed — for an agent
  without the trait. Unlocked into the hand by the `traitVariant`'s `addNudgeIds`.
- `bandProse`:
  - `success`: `They went on after the light gave out, because they had never believed it ended there.`
  - `failure`: `Belief carried them past the last of the light, and the dark did not care.`

**Step 0 arithmetic and guardrails**

| Check | Value | Verdict |
|---|---|---|
| Hand size | 7 | inside 4–8 ✓ |
| Distinct spheres | `light`, `entropy`, `mind`, `life` = **4** | ≥ `HAND_SPHERE_COVERAGE_MIN` (4) ✓ |
| Common (sphere-less) options | 3 (`#1`, `#5`, `#7`) | ≥ `HAND_COMMON_OPTIONS_MIN` (1) ✓ |
| Distinct card types | 7 (insurance, whisper, bargain, compulsion, omen, balm, trait_card) | ≥3 ✓ |
| Boosts | 0 | ≤2 ✓ |
| Riders | 1 (`#1`) | ≤1 ✓ |
| Total `forecastDelta` | 0.04+0.10+0.12+0.08+0.05+0.05+0.08 = **0.52** | ≤ `NUDGE_HAND_MAX_TOTAL_DELTA` (0.70) ✓ |
| Difficulty + full hand | 0.40 + 0.52 = **0.92** | ≤ 1.0 ✓ |
| Big-delta cards (≥0.15) | none | no double-failure obligation |
| Every card has a failure-band fragment | `#1` crit_fail · `#2` fail · `#3` fail · `#4` crit_fail · `#5` near_miss · `#6` near_miss · `#7` fail | ✓ |
| Digits or `%` in any `effectLine` | none | ✓ |

**Six-band coverage, step 0**

| Band | Covered by |
|---|---|
| `critical_success` | Show The Shape |
| `success` | Charge It To Doom · Set An Urge · Mark The Road · Lift The Dread · Draw On Conviction |
| `success_at_cost` | Set The Floor |
| `near_miss` | Mark The Road · Lift The Dread |
| `failure` | Show The Shape · Charge It To Doom · Draw On Conviction |
| `critical_failure` | Set The Floor · Set An Urge |

---

### Step 1 hand — 6 cards

Questions answered: *a little more strength* · *cut out the middle* · *do it unseen* · *find what
the last party left* · *take the weight openly* · *make them refuse to put it down*.

| # | Type | `libraryCardId` | `id` | `sphere` | `name` | `essenceCost` | `costs` | `forecastDelta` | `rider` | `imageTag` |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Boost | `card.boost.core` | `seal.press_the_odds` | — (common) | Press The Odds | 1 | — | 0.06 | — | `generic.focus` |
| 2 | Gambit | `card.gambit.attunement.chaos` | `seal.widen_the_swing` | `chaos` | Widen The Swing | 1 | — | 0.03 | `all_or_nothing` | `generic.luck` |
| 3 | Veil | `card.veil.signature.darkness` | `seal.cover_their_tracks` | `darkness` | Cover Their Tracks | 3 | `detectionDelta: -0.10` | 0.08 | — | `generic.dark` |
| 4 | Cache | `card.cache.hunger.gather` | `seal.uncover_old_gear` | — (common) | Uncover Old Gear | 2 | — | 0.07 | — | `generic.matter` |
| 5 | Heavy hand | `card.heavy_hand.signature.force` | `seal.throw_full_weight` | `force` | Throw Full Weight | 2 | `detectionDelta: 0.15` | 0.16 | — | `generic.strength` |
| 6 | Kindled ambition | `card.kindled_ambition.signature.spirit` | `seal.wake_an_old_want` | `spirit` | Wake An Old Want | 2 | — | 0.06 | — | `generic.blessing` |

**Effect lines, grants and band fragments**

**1. Press The Odds** — `card.boost.core` · `fiction: 'Most things fail by a margin.'`
> *effectLine:* `Lean on them a little. Most attempts fail by a narrow margin.`
- `bandProse`:
  - `success`: `The last of it came from a reserve they had not counted on having.`
  - `failure`: `There was one more lift in them. The stair asked for four.`

**2. Widen The Swing** — `card.gambit.attunement.chaos` · `fiction: 'Practice does not make chaos safer. It makes it larger.'`
> *effectLine:* `The middling results fall away. It ends clean or it ends badly.`
- `rider: 'all_or_nothing'` — **this hand's one rider.** Justification: chaos's practiced signature
  reshapes the ladder instead of climbing it, priced cheap because the widened downside *is* the
  price. Insurance sits in the other hand for the same reason — one shape-changing card per step.
- `bandProse`:
  - `critical_success`: `No half-measure survived. What was left was one clean carry, top to bottom.`
  - `critical_failure`: `The middle had been taken away, and what was left was the bottom of it.`

**3. Cover Their Tracks** — `card.veil.signature.darkness` · `costs: { detectionDelta: -0.10 }` · `fiction: 'The kindest help leaves no fingerprints.'`
> *effectLine:* `The help lands unseen. No rival god notices the hand behind it.`
- The Veil pays *down* the detection channel and pays *up* in essence — the inverse trade to the
  Heavy Hand below, in the same hand, which is the pairing the type exists for.
- `bandProse`:
  - `success`: `Nobody up there could say who had helped, only that it went easier than it should have.`
  - `near_miss`: `The hand behind it was never seen. It was also never quite enough.`

**4. Uncover Old Gear** — `card.cache.hunger.gather` · `fiction: 'Someone always put something by.'`
> *effectLine:* `Reveal what an earlier party left behind: a bone ward, theirs to take and keep.`
- `grants: [{ kind: 'attachment_grant', templateId: 'reward_relics_talismans_bone_ward', targetAgentId: '$actor' }]`
- Names the item on the face, following the shipped Cache precedent in `the-unclaimed-relic.ts`
  ("iron tongs they can use and keep"). The face stays generic — every delve, every ruin, every
  battlefield has an earlier party.
- `bandProse`:
  - `success_at_cost`: `The ward came up with them. Most of what they went down with did not.`
  - `failure`: `They came up with a dead stranger's charm and none of what they went for.`

**5. Throw Full Weight** — `card.heavy_hand.signature.force` · `costs: { detectionDelta: 0.15 }` · `fiction: 'Subtlety is a choice. This is not it.'`
> *effectLine:* `Push hard and openly. The odds move a long distance, and rival gods see who moved them.`
- `forecastDelta: 0.16` ≥ `NUDGE_BIG_DELTA` (0.15), so **both** failure bands are owed a fragment.
- The second **non-essence-channel** card: cheap in essence, expensive in attention.
- `bandProse`:
  - `critical_success`: `The load went light in their hands and stayed light to the top.`
  - `failure`: `The weight came off it and the stone underneath still would not hold them.`
  - `critical_failure`: `It went so plainly that they stopped to look at their own hands, and the stair took the pause.`

**6. Wake An Old Want** — `card.kindled_ambition.signature.spirit` · `fiction: 'A life turns on what it reaches for.'`
> *effectLine:* `Set an old desire alight again. They will not put down what they came for.`
- `grants:`
  ```ts
  [{ kind: 'assign_ambition', templateId: 'ambition_chase_the_wonder', targetAgentId: '$actor',
     narrativeHook: 'They had seen the edge of it once and could not leave it in the ground.' }]
  ```
  Deliberately a **different** ambition from the one the aftermath assigns
  (`ambition_uncover_secrets`), so a card play and a band ending cannot collide on the same
  template. The card is the god choosing to plant a wanting; the aftermath is the scene earning one.
- `bandProse`:
  - `success`: `They had wanted easier work that morning. By the top of the stair they wanted this more.`
  - `failure`: `The old wanting was awake and had nowhere to go but back down the stair.`

**Step 1 arithmetic and guardrails**

| Check | Value | Verdict |
|---|---|---|
| Hand size | 6 | inside 4–8 ✓ |
| Distinct spheres | `chaos`, `darkness`, `force`, `spirit` = **4** | ≥4 ✓ |
| Common (sphere-less) options | 2 (`#1`, `#4`) | ≥1 ✓ |
| Distinct card types | 6 (boost, gambit, veil, cache, heavy_hand, kindled_ambition) | ≥3 ✓ |
| Boosts | 1 (`#1`) | ≤2 ✓ |
| Riders | 1 (`#2`) | ≤1 ✓ |
| Total `forecastDelta` | 0.06+0.03+0.08+0.07+0.16+0.06 = **0.46** | ≤0.70 ✓ |
| Difficulty + full hand | 0.44 + 0.46 = **0.90** | ≤1.0 ✓ |
| Big-delta cards | `#5` (0.16) carries `failure` **and** `critical_failure` | ✓ |
| Every card has a failure-band fragment | `#1` fail · `#2` crit_fail · `#3` near_miss · `#4` fail · `#5` fail · `#6` fail | ✓ |
| Digits or `%` in any `effectLine` | none | ✓ |

**Six-band coverage, step 1**

| Band | Covered by |
|---|---|
| `critical_success` | Widen The Swing · Throw Full Weight |
| `success` | Press The Odds · Cover Their Tracks · Wake An Old Want |
| `success_at_cost` | Uncover Old Gear |
| `near_miss` | Cover Their Tracks |
| `failure` | Press The Odds · Uncover Old Gear · Throw Full Weight · Wake An Old Want |
| `critical_failure` | Widen The Swing · Throw Full Weight |

**Base prose reads with no hand active.** Every nudge-specific payoff above lives in `bandProse`;
the afterimages in §§ 6–7 and the `narrativeTemplates` in § 10 describe only what happens when the
god does nothing. No band base text mentions light cast, fear lifted, weight taken, or a ward found.

---

## 9. Trait hooks (mandatory step — all four answered)

1. **Gate?** — **No.** No `requiredTraits`, no `blockedByTraits`. A broken seal and a hostile
   keeper stop everyone equally, and gating an open-draw encounter would shrink the population the
   `ruin` and `arcane` cells exist to feed.
2. **Variant?** — **Yes, one.**
   ```ts
   traitVariants: [{
     traitId: 'trait.core.core_hope.virtue',
     forecastDelta: 0.04,
     difficultyDelta: -0.02,
     factorLine: 'Being Hopeful, they keep going after the light stops.',
     addNudgeIds: ['seal.draw_on_conviction'],
   }]
   ```
   `trait.core.core_hope.virtue` is the "Hopeful" pole of the Core hope continuum, built by
   `CORE_TRAIT_DEFINITIONS` from `CORE_CONTINUA` (`src/types/coreRegistry.ts`) — a seeded
   definition, so `validateTraitRefs()` does not report it dead. It is also referenced live in
   `ambition-templates.ts` and `encounter-content.ts`, so the id is exercised.
   **Why this trait and not a better-fitting one:** the step's action is *going on into the dark
   after the light stops*, which is an outlook question, not an endurance or integrity one. Hope is
   the live continuum that governs outlook. No new continuum is needed, so none is minted (the
   batch brief puts a new continuum out of scope, and the live registry serves this step).
   **Variance note:** the three shipped nudge-native encounters hook `core_humility` (twice) and
   `core_integrity` (once). `core_hope` has no encounter user, which is a second thin cell fed.
3. **Trait-only nudge?** — **Yes.** `seal.draw_on_conviction` (`card.trait_card.core`), cost 0,
   `requiredTrait: 'trait.core.core_hope.virtue'`, unlocked by the variant's `addNudgeIds`. Hidden,
   never dimmed, for an agent who cannot hold the trait.
4. **Trait fragment?** — **Yes**, carried by that card's own `bandProse` (`success` and `failure`).
   No separate template-level trait fragment: two surfaces saying the same thing about one trait is
   an echo, and the card is the one the player actually played.

---

## 10. `narrativeTemplates`

```ts
narrativeTemplates: {
  initiation:
    'Carry the coffer up and it is theirs. Leave it, and the other hunter takes it. The keepers '
    + 'want the stair shut, whoever comes up it.',
  success:
    '{name} carried the coffer up out of the dark. The keepers watched them go and did not stop them.',
  failure:
    '{name} came up the stair with empty hands. The coffer is still below, and the keepers are '
    + 'still on the stair.',
}
```

`initiation` is scene-class and states the stake plainly, as Doctrine v2 requires — the retired
"foreshadow, never announce" rule is reversed. `success` and `failure` are outcome-class and claim
only what the mechanics wrote.

---

## 11. Consequence-hand wiring — where `drive` and `movement` each land

`consequenceDraw: ['drive', 'movement']` — recomputed from the template id by `check:encounter`;
**no swap taken.**

### `drive` → `assign_ambition`

Wired in **two band reactions**, so the family reads on both tails and reads differently on each:

| Band | Effect | Why this is *in context* |
|---|---|---|
| `critical_success` | `assign_ambition` → `ambition_uncover_secrets` | They opened it and saw what was under a seal somebody meant to keep shut. The ambition's own selection prose is *"Something was buried here once, on purpose. She meant to know what."* — the encounter's premise, already written into the live template. |
| `critical_failure` | `assign_ambition` → `ambition_uncover_secrets` | They were dragged out before they could open it, and the stair was shut behind them. Same wanting, arrived at from the other end: the thing they will not now be able to stop chasing is precisely the thing they were not allowed to see. |

`ambition_uncover_secrets` is a live `AMBITION_TEMPLATES` id (`src/data/ambition-templates.ts`),
so `validateNudgeGrantRefs` resolves it. It is a *reactive* template whose only assignment path
before THR-885 was the world's own `ambitionTick` — this is the dispatcher the brief calls a
near-zero-user cell.

A third, independent `drive` write rides the step-1 card `seal.wake_an_old_want`
(`ambition_chase_the_wonder`) — the god's own hand rather than the scene's, on a different template
so the two cannot collide.

### `movement` → `agent_relocation`

Wired in **step 1's `failureMetadata`**, so it fires unconditionally on both failure bands without
waiting on a reaction pick:

```ts
{ kind: 'agent_relocation', targetAgentId: '$actor',
  destination: { kind: 'away', minHexDistance: 3 }, mode: 'travel' }
```

*In context:* the keepers hold the top of the stair and turn them out. A delve that goes wrong does
not leave you standing where it went wrong — it puts you on the road, and `mode: 'travel'` means
the journey is watchable on the map rather than a teleport. This is the honest home for `movement`
in this batch (the brief assigns it here rather than to slot 2 for exactly this reason).

---

## 12. Aftermath

```ts
aftermathConfig: {
  branchOnStep: 0,
  variants: {},
  fallback: {
    overview: 'The seal is broken either way. What came up the stair is the rest of it.',
    changes: [],
    byOutcome: { /* five bands, below */ },
  },
}
```

Choice-less encounter, so the bands hang off `fallback` — which is why `byOutcome` lives *on* the
variant. `changes: []` at the variant level, so **no chip renders on a face that performs no write**
(Law 56). Every chip below is band-scoped.

**One reaction per band, each carrying a real write.** This is the only structure under which every
chip is unconditionally backed: `AftermathOutcomeOverride.changes` and `.reactions` are independent
optional siblings, so a band's chips render regardless of which of its reactions the player picks —
and with exactly one reaction per band there is nothing to pick wrong. It is the shape the
director-approved calibration case ships.

Five bands authored (floor is three): two success-side, two failure-side, and both extremes.

### `critical_success`

**Overview**
> `{actor}` came up the stair with the coffer before the light went, and the keepers stood aside for
> them. It was sealed and it opened, and what was inside is the reason they will not leave buried
> ground alone again. `{cast:rival}` is still below, and still looking.

**Reaction** — `seal.let_them_open_it` · label `Let them open it here`
> intent: `The lid comes off at the top of the stair, in front of everyone who wanted it shut.`
```ts
effects: [
  { kind: 'attachment_grant', templateId: 'reward_tomes_scrolls_the_silent_testament', targetAgentId: '$actor' },
  { kind: 'assign_ambition',  templateId: 'ambition_uncover_secrets', targetAgentId: '$actor',
    narrativeHook: 'A seal put down on purpose, and now they know what it was holding.' },
]
```

**Chips**

| field | `seal.crit.prize` | `seal.crit.testament` |
|---|---|---|
| `kind` | `item` | `item` |
| `category` | `boon` | `boon` |
| `direction` / `polarity` | `gain` / `gain` | `gain` / `gain` |
| `title` | `Veilscript Fragment` | `The Silent Testament` |
| `causeClause` | `Carried up clean, before the light went` | `The lid came off at the top of the stair` |
| `detail` | `A Veilscript Fragment came up in the coffer and is in {actor}'s hands now. The letters move when they look away.` | `The Silent Testament was under the seal. It is {actor}'s to carry, and it is not going to be given back.` |
| `stateNoun` | `{ text: 'a fragment gained', entityId: 'reward_tomes_scrolls_veilscript_fragment', visualKind: 'attachment' }` | `{ text: 'a testament gained', entityId: 'reward_tomes_scrolls_the_silent_testament', visualKind: 'attachment' }` |
| `concepts` | `[{ text: 'Veilscript Fragment', entityId: 'reward_tomes_scrolls_veilscript_fragment', visualKind: 'attachment' }]` | `[{ text: 'The Silent Testament', entityId: 'reward_tomes_scrolls_the_silent_testament', visualKind: 'attachment' }]` |
| backing write | step 1 `successMetadata` → `attachment_grant` | this band's reaction → `attachment_grant` |

The ambition fires on this band and is deliberately **unchipped** — the overview says it, and a
band with three chips stops being reserved. Its chip lives on `critical_failure`, where it is the
whole point of the ending.

### `success`

**Overview**
> `{actor}` got the coffer to the top. The keepers argued about it and then let it pass.
> `{cast:rival}` came up empty an hour later and will tell everyone what is down there, so the stair
> will not be quiet for long.

**Reaction** — `seal.let_the_stair_stand_open` · label `Let the stair stand open`
> intent: `Nobody shuts it behind them. Whatever else is down there is down there for the taking.`
```ts
effects: [
  { kind: 'encounter_seed', encounterFamily: 'encounter.delve', targetAgentId: '$actor',
    delayTicks: 24, priority: 1.1, inheritContext: true,
    seedLabel: 'The coffer was not the only thing under that seal, and the stair is still open.' },
]
```

**Chips**

| field | `seal.success.prize` |
|---|---|
| `kind` / `category` | `item` / `boon` |
| `direction` / `polarity` | `gain` / `gain` |
| `title` | `Veilscript Fragment` |
| `causeClause` | `It came up the stair on the last of the light` |
| `detail` | `A Veilscript Fragment came up in the coffer and is in {actor}'s hands now. The letters move when they look away.` |
| `stateNoun` | `{ text: 'a fragment gained', entityId: 'reward_tomes_scrolls_veilscript_fragment', visualKind: 'attachment' }` |
| `concepts` | `[{ text: 'Veilscript Fragment', entityId: 'reward_tomes_scrolls_veilscript_fragment', visualKind: 'attachment' }]` |
| backing write | step 1 `successMetadata` → `attachment_grant` |

The seed is unchipped on purpose. A seed anchors through its carrier, which here is the agent, and
the agent is already the encounter's one individual anchor (§ 13) — so the sentence lives in the
overview, which claims nothing, and the seed still plants.

### `success_at_cost`

**Overview**
> `{actor}` brought the coffer up and left most of a pack below to do it. Both palms came off the
> stone raw, and the last turn of the stair took skin off both shins. The keepers watched from the
> top and did not offer a hand.

**Reaction** — `seal.let_them_carry_the_hurt` · label `Let them carry the hurt out with it`
> intent: `No one binds the hands. The coffer goes on the road with them as they are.`
```ts
effects: [
  { kind: 'condition_attachment', templateId: 'trait.condition.wounded', targetAgentId: '$actor' },
]
```

**Chips**

| field | `seal.cost.prize` | `seal.cost.wounded` |
|---|---|---|
| `kind` | `item` | `trait` |
| `category` | `boon` | `scar` |
| `direction` / `polarity` | `gain` / `gain` | `loss` / `loss` |
| `title` | `Veilscript Fragment` | `Torn Hands` |
| `causeClause` | `It came up, and the stair took its fee off the carrier` | `They hauled it up broken stone with bare hands` |
| `detail` | `A Veilscript Fragment came up in the coffer and is in {actor}'s hands now. The letters move when they look away.` | `{actor} is wounded. Lifting and gripping will hurt until it heals.` |
| `stateNoun` | `{ text: 'a fragment gained', entityId: 'reward_tomes_scrolls_veilscript_fragment', visualKind: 'attachment' }` | `{ text: 'Wounded', entityId: 'trait.condition.wounded', visualKind: 'attachment' }` |
| `concepts` | `[{ text: 'Veilscript Fragment', entityId: 'reward_tomes_scrolls_veilscript_fragment', visualKind: 'attachment' }]` | `[{ text: 'wounded', entityId: 'trait.condition.wounded', visualKind: 'attachment' }]` |
| backing write | step 1 `successMetadata` → `attachment_grant` | this band's reaction → `condition_attachment` |

### `failure`

**Overview**
> `{actor}` came up empty. The keepers had the top of the stair and turned them out, and the road
> away from here is the only one they are on now. `{cast:rival}` is still down there, and nobody is
> going to stop them coming up.

**Reaction** — `seal.let_the_failure_sit` · label `Let the failure sit with them`
> intent: `No one softens it for them. They walk out of here carrying it.`
```ts
effects: [
  { kind: 'quintessence_shift', delta: -0.04, targetAgentId: '$actor', source: 'the_broken_seal' },
]
```

**Chips**

| field | `seal.fail.worn_out` | `seal.fail.driven_out` |
|---|---|---|
| `kind` | `trait` | `future_hook` |
| `category` | `scar` | `path` |
| `direction` / `polarity` | `loss` / `loss` | `opens` / `mixed` |
| `title` | `Spent On The Stair` | `Put On The Road` |
| `causeClause` | `A climb up broken stone with no rest at the top` | `The keepers had the head of the stair and would not let them back on it` |
| `detail` | `{actor} is exhausted, and will be slow on the road until they have rested.` | `{actor} is travelling away from {location} now, and is not coming back this season.` |
| `stateNoun` | `{ text: 'Exhausted', entityId: 'trait.condition.exhausted', visualKind: 'attachment' }` | `{ text: 'a journey set', entityId: '$actor', visualKind: 'agent' }` |
| `concepts` | `[{ text: 'exhausted', entityId: 'trait.condition.exhausted', visualKind: 'attachment' }]` | `[{ text: 'travelling away' }]` |
| backing write | step 1 `failureMetadata` → `condition_attachment` | step 1 `failureMetadata` → `agent_relocation` |

`seal.fail.driven_out` is **the encounter's one `individual`-anchored chip** (§ 13). `category:
'path'` is earned rather than decorative: `agent_relocation` writes a real relocation intent the
decision phase reads, so a route the game will act on has genuinely opened. The `quintessence_shift`
fires unchipped — an authored chip naming a confidence figure would be reporting a quantity the
player reads as an icon and a delta cluster anyway, and the engine surfaces incidental drift itself.

### `critical_failure`

**Overview**
> `{actor}` was hauled out of the dark by the ankles. The keepers brought the head of the stair down
> as soon as the bodies were clear, and the place is closed. `{cast:rival}` was pulled out beside
> them, and neither of them got the lid off the coffer.

**Reaction** — `seal.let_them_shut_it` · label `Let them shut it`
> intent: `The keepers get their stair back. What was under the seal stays under it.`
```ts
effects: [
  { kind: 'condition_attachment', templateId: 'trait.condition.location.pass_closed',
    targetLocationId: '$target' },
  { kind: 'assign_ambition', templateId: 'ambition_uncover_secrets', targetAgentId: '$actor',
    narrativeHook: 'They were dragged out before the lid came off, and it has not left them since.' },
]
```

**Chips**

| field | `seal.crit_fail.shut` | `seal.crit_fail.the_wanting` |
|---|---|---|
| `kind` | `shell_state` | `growth` |
| `category` | `scar` | `boon` |
| `direction` / `polarity` | `loss` / `loss` | `gain` / `mixed` |
| `title` | `The Stair Is Shut` | `They Have To Know` |
| `causeClause` | `The keepers brought the head of the stair down behind them` | `They were dragged out before the lid came off` |
| `detail` | `{target} is closed. The descent is broken in, and no one is getting down it until somebody digs.` | `{actor} is pursuing Uncover Ancient Secrets now, and the coffer they never opened is the reason.` |
| `stateNoun` | `{ text: 'a place closed', entityId: '$target', visualKind: 'location' }` | `{ text: 'a new ambition', entityId: '$actor', visualKind: 'agent' }` |
| `concepts` | `[{ text: 'closed', entityId: 'trait.condition.location.pass_closed', visualKind: 'attachment' }]` | `[{ text: 'Uncover Ancient Secrets' }]` |
| backing write | this band's reaction → `condition_attachment` on `$target` | this band's reaction → `assign_ambition` |

`seal.crit_fail.shut` is the **location-anchored chip** the brief requires, declared with
`visualKind: 'location'` so it carries the click (THR-1172) rather than rendering a tier below its
siblings. `trait.condition.location.pass_closed` is the live location condition whose own
description is *"Snow, rockfall or flood has shut the way through"* — a collapsed stair is that
condition's rockfall case exactly, and its readers (the movement tax and the eligibility gate) mean
the closure is a fact the simulation acts on.

The relocation also fires on this band, from step 1's `failureMetadata`. It is deliberately left
unchipped here: it is already the `failure` band's chip, and repeating it would be a chip about the
same write on two faces rather than an ending with its own beat.

### Aftermath reaction choices — why one per band

The player's choice surface in the nudge model is **the hand**, played twice, on two steps that
matter. The aftermath's job here is to land the consequence, and one reaction per band is the only
structure under which every chip is provably backed by a write that fires on the face it renders on
(Law 56). This follows the shipped, director-approved calibration case rather than the pre-pivot
"branching aftermath reactions" instruction, which the Composition Contract superseded.

Each reaction is still a stance rather than a mechanical variant: *let them open it here* (the find
becomes public), *let the stair stand open* (the place stays available to everyone who hears),
*let them carry the hurt out with it* (no mercy, the prize is enough), *let the failure sit with
them* (the loss is allowed to cost), *let them shut it* (the custom wins).

---

## 13. Anchors

| Chip | Anchor kind | Declaration | Status |
|---|---|---|---|
| `seal.crit.prize` | attachment | `entityId: 'reward_tomes_scrolls_veilscript_fragment'`, `visualKind: 'attachment'` | 🔗 linked |
| `seal.crit.testament` | attachment | `entityId: 'reward_tomes_scrolls_the_silent_testament'`, `visualKind: 'attachment'` | 🔗 linked |
| `seal.success.prize` | attachment | as above (fragment) | 🔗 linked |
| `seal.cost.prize` | attachment | as above (fragment) | 🔗 linked |
| `seal.cost.wounded` | attachment | `entityId: 'trait.condition.wounded'`, `visualKind: 'attachment'` | 🔗 linked |
| `seal.fail.worn_out` | attachment | `entityId: 'trait.condition.exhausted'`, `visualKind: 'attachment'` | 🔗 linked |
| `seal.crit_fail.shut` | **location** | `entityId: '$target'`, `visualKind: 'location'` | 🔗 linked |
| `seal.fail.driven_out` | **individual** | `entityId: '$actor'`, `visualKind: 'agent'` | 🔗 linked |

**Totals: 6 attachment · 1 location · 1 individual.** The brief's ceiling of one `individual`-anchored
chip per encounter is met exactly, and `individual` is nowhere near the only anchor kind. No
`faction` anchor, per the brief: the ground under a ruin is not held by anybody.

**Recorded deviation from the brief's anchor table.** The brief asks for an `ambition`-kind anchor
with `entityId` = the ambition node id. That declaration **cannot pass the gate**:
`classifyAnchorDeclaration` (`src/data/content-eval/chipAnchorDeclarations.ts`) accepts only the four
sentinels and shipped *attachment* template ids, and rejects every other literal id as "minted per
world and cannot be authored" — an ambition node is minted per world, so the pointer would render as
a live link that goes nowhere (Law 21). `seal.crit_fail.the_wanting` therefore anchors `$actor`,
which is where the anchor catalog says an ambition is seen ("the pursuing actor's sheet"), and names
the ambition in `concepts` as undecorated text. **Finding for the batch report:** the anchor catalog
and the anchor-declaration classifier disagree about `ambition`; one of them should move.

---

## 14. Images

**Scene tag:** `delve.stair.broken_seal` (WS4 vocabulary; until the scene manifest exists the
fallback chain ends at EntityVisual). No `illustrationUrl` declared.

**Card tags** — every one resolves to a row in `ENCOUNTER_IMAGE_LIBRARY`, verified during drafting:

| Card | `imageTag` |
|---|---|
| Set The Floor | `generic.ward` |
| Show The Shape | `generic.light` |
| Charge It To Doom | `generic.decay` |
| Set An Urge | `generic.memory` |
| Mark The Road | `generic.rumor` |
| Lift The Dread | `generic.warmth` |
| Draw On Conviction | `generic.oath` |
| Press The Odds | `generic.focus` |
| Widen The Swing | `generic.luck` |
| Cover Their Tracks | `generic.dark` |
| Uncover Old Gear | `generic.matter` |
| Throw Full Weight | `generic.strength` |
| Wake An Old Want | `generic.blessing` |

No tag repeats across the thirteen cards. Every one passes the genericity test — each reads in at
least three unrelated encounters, because each is a library-card face rather than a scene image.

**Concept art direction (scene tag, for whoever paints it).** *What does this story convey?* Ground
that was shut on purpose, and the small cost of opening it. Custom outliving the people who
inherited it. *What image evokes that without illustrating the action?* Not the descent and not the
fight at the top — a seal, broken, lying where it was levered off, with fresh scrape marks on old
stone and packs half-tied beside it. Residue, not event. No people; their absence is the picture.

---

## 15. Live-content register (every id, and where it lives)

| Id | Kind | File |
|---|---|---|
| `trait.core.core_hope.virtue` | core trait (Hopeful) | `src/types/coreRegistry.ts` → `src/data/core-trait-content.ts` |
| `trait.condition.terrified` | condition | `src/data/condition-trait-content.ts` |
| `trait.condition.wounded` | condition | `src/data/condition-trait-content.ts` |
| `trait.condition.exhausted` | condition | `src/data/condition-trait-content.ts` |
| `trait.condition.location.pass_closed` | location condition | `src/data/condition-trait-content.ts` |
| `reward_tomes_scrolls_veilscript_fragment` | possession, tier 2 | `src/data/reward-attachment-catalog.ts` |
| `reward_tomes_scrolls_the_silent_testament` | possession, tier 3 | `src/data/reward-attachment-catalog.ts` |
| `reward_relics_talismans_bone_ward` | possession, tier 1 | `src/data/reward-attachment-catalog.ts` |
| `ambition_uncover_secrets` | ambition template | `src/data/ambition-templates.ts` |
| `ambition_chase_the_wonder` | ambition template | `src/data/ambition-templates.ts` |
| all 13 `libraryCardId`s | card library members | `src/data/nudge-card-library.ts` |
| all 13 `imageTag`s | image library rows | `src/data/encounter-image-library.ts` |

**Prize calibration, recorded.** `the_silent_testament` is tier 3 (`censusTag: regional`,
`lossCondition: permanent`) and is granted **only on `critical_success`** — the rarest band, which
is what the tails are for. Every other success-side band grants the tier-2
`veilscript_fragment`. Both are `#knowledge` items, which is why the `drive` family the encounter
drew reads as a continuation of the prize rather than a bolt-on: what they carry out is the reason
they cannot stop looking.

---

## 16. Template-level fields

```ts
id: 'encounter.delve.the_broken_seal',
rarityTier: 2,
intrinsicTier: 'background',
name: 'The Broken Seal',
reach: 'star',
crudType: 'read',
scale: 'local',
apCost: 1,
actorAffinities: ['individual'],
motivations: ['sacrifice_survival', 'courage_prudence'],
consequenceDraw: ['drive', 'movement'],
settings: ['ruin', 'arcane', 'sacred'],
locationSubtypes: expandSettings(['ruin', 'arcane', 'sacred']),
description:
  'A two-step delve: the seal over the stair is broken, the keepers who kept it are leaving and '
  + 'will stop anyone who goes near it, and another treasure hunter is already below.',
```

Wrap the whole literal in `compileOpeningEnvelope({ ... })`.

---

## 17. The narrator's checklist (12 questions), answered in writing

**A — the opening skeleton**

1. **Does P1 say how the agent arrived, with real graph names?** Yes. All three openings name
   `{name}` and `{location}` and state the arrival and the hour: *"{name} comes to the ruins of
   {location} with half a day of light left."*
2. **Does P2 state what is happening and what has gone wrong, as events with costs already paid?**
   Yes. The keepers are packing to leave; the seal is broken; two went below yesterday and one came
   back. The cost is paid before the agent does anything.
3. **Does P3 land exactly one stake shape from the table, matching the brief?** Yes — **contest**,
   the shape rolled. The closing sentence is the rival: *"Another treasure hunter, {cast:rival},
   went down an hour ago."* Not compounded with a second shape.
4. **Is the whole opening ≤80 words, subject-verb-object, one fact per sentence?** Yes — 71 words
   with the longest P1. Every sentence is one fact.

**B — narrator mode**

5. **Could a game master read every sentence aloud as a report?** Yes. No interior sensation, no
   camera work, no atmosphere doing no job. Nothing is described from inside a body: there is no
   cold on the skin, no dark pressing in, no held breath.
6. **Is every fact stated, never encoded?** Yes. "The keepers will stop anyone who goes near the
   stair" is the sentence, not a chalk line and a piled-up broom for the reader to decode. "One
   came back" is stated; it is not implied by a count of packs.
7. **Does every sentence serve challenge, test, or outcome?** Yes. Challenge: the broken seal, the
   hostile keepers, the rival's head start. Test: the descent (star), the carry (stone). Outcome:
   the coffer out or the stair shut. Nothing is present because it "builds atmosphere".

**C — internal logic**

8. **Nothing referred to before it is introduced; every event has a visible cause; nothing
   contradicts what is established?** Yes. The rival enters in the spine and is named there before
   any band overview uses the token. The coffer is introduced in step 1's spine before any
   afterimage or chip names it. The keepers' hostility has a stated cause (precedent). The seal was
   already broken before the agent arrived, which is why there is a way down at all — no
   contradiction between "shut for generations" and "there is a stair to descend".
9. **One named person on stage per beat, named over unnamed?** Yes. `{cast:rival}` is the single
   named person. The keepers are a plural body, which is what "the law of the place" is; making one
   of them a named face would have put two names on one beat.

**D — the interactive layer**

10. **Can the player restate the stake in one sentence?** Yes: *get down there and carry the coffer
    back up past people who want the stair shut, before the other hunter does.*
11. **Is every card named verb+noun and described like a spell — direct effect, no mood, no
    odds-talk?** Yes. All thirteen names are imperative verb + noun in 3–4 words. Every effect line
    states the effect directly, carries no digits and no `%`, and repeats no content word from its
    own card's name (checked one by one — § 18).
12. **Does every setting class the envelope declares have an opening written for it?** Yes — three
    declared classes, three openings, and no opening for a class the envelope does not declare
    (`validateSettingEnvelope` holds all four honesty rules).

---

## 18. Self-audit against every hard requirement

### Prose Doctrine v2

| Requirement | Verdict |
|---|---|
| Narrate, never inhabit — GM reading a module aloud | **PASS.** No sentence is written from inside the scene. |
| No interior sensation, no camera work, no jobless atmosphere | **PASS.** Nothing describes what anything feels like; the closest is "their arms were shaking by the last turn", which is an observed fact a narrator can report. |
| State facts, never encode them | **PASS.** The keepers' hostility, the broken seal, the rival's head start, the failing light are all said outright. |
| Three-paragraph opening skeleton, ≤80 words | **PASS.** 71 words with the longest P1. |
| No "clever specificity" — no measured counts, no paces, no writerly participles | **PARTIAL — declared.** Two counts survive and both are load-bearing plot facts rather than texture: *"Two of them went below yesterday and one came back"* (the cost already paid, which is what P2 owes) and *"It took three tries"* (an afterimage distinguishing `success` from `critical_success`). No paces, no measured distances, no participial openers anywhere. Flagged here for Pass 2 rather than defended silently. |
| Basic game-master language, common words, simple clauses | **PASS.** Longest sentence is 21 words; no subordinate stacking. |
| Card effect line never repeats a word from its card's name | **PASS** — checked per card: Floor/price·gear·skin · Shape/see·test·demand · Doom/clock·pay · Urge/mind·pushing · Road/ground·days · Dread/fear·off · Conviction/Hopeful·light · Odds/attempts·margin · Swing/results·ends · Tracks/help·unseen·hand · Gear/reveal·party·ward · Weight/push·odds·gods · Want/desire·put·down. |
| Card names imperative verb + noun, 2–4 words | **PASS** — all thirteen. |
| No `fiction` authored | **PASS.** Every `fiction` value is the library member's own existing `quote`, copied. Nothing new written. |

### Hand rules

| Requirement | Step 0 | Step 1 |
|---|---|---|
| 4–8 cards | 7 ✓ | 6 ✓ |
| ≥4 distinct spheres | 4 ✓ | 4 ✓ |
| ≥1 ungated common (sphere-less) | 3 ✓ | 2 ✓ |
| ≤1 rider (justified in a comment) | 1 ✓ | 1 ✓ |
| ≤2 Boosts | 0 ✓ | 1 ✓ |
| ≥3 distinct card types | 7 ✓ | 6 ✓ |
| Every card pays off ≥1 failure band | ✓ | ✓ |
| `forecastDelta ≥ 0.15` covers both `failure` and `critical_failure` | n/a (none) | ✓ (`Throw Full Weight`) |
| No digits or `%` in `effectLine` | ✓ | ✓ |
| Hand total ≤ 0.70 · difficulty + hand ≤ 1.0 | 0.52 · 0.92 ✓ | 0.46 · 0.90 ✓ |
| All six `StepOutcome` bands covered | ✓ | ✓ |
| Base band text reads with no hand active | ✓ — every nudge payoff is in `bandProse` | ✓ |

### Card budget (batch-level)

| Instruction | Status |
|---|---|
| `card.boost.signature.energy` banned | **Not used.** ✓ |
| `card.boost.core` at most once in the whole batch | **SPENT HERE** (step 1, `seal.press_the_odds`). **Slot 2 must not use it.** |
| ≥3 cards from the fourteen zero-authoring members | **4 used:** `card.insurance.core` · `card.omen.hunger.wander` · `card.gambit.attunement.chaos` · `card.cache.hunger.gather`. Ten remain for slot 2. |
| ≥1 card priced on a non-essence channel | **3:** `Charge It To Doom` (`doomDelta 0.05`) · `Throw Full Weight` (`detectionDelta 0.15`) · `Cover Their Tracks` (`detectionDelta −0.10`). ✓ |
| ≥1 card with a real `grants` against built content | **4:** `Mark The Road` (`emit_omen`) · `Lift The Dread` (`remove_condition`) · `Uncover Old Gear` (`attachment_grant`, live id) · `Wake An Old Want` (`assign_ambition`, live id). All ids resolve for `validateNudgeGrantRefs`. ✓ |
| Other over-exposed cards, ≤1 each | `card.compulsion.signature.mind` ×1 · `card.heavy_hand.signature.force` ×1 · `card.kindled_ambition.signature.spirit` ×1. **Not used at all:** `card.undertow.signature.darkness`, `card.mercy.core`, `card.omen.signature.time`. |
| Type-level: ≤2 Boosts per hand, ≥3 types per hand | 1 Boost across the whole encounter, 13 cards spanning 13 distinct types. ✓ |

### Composition Contract

| Block | Verdict |
|---|---|
| Steps | 2 plain steps, each with reach, numeric difficulty, `narrativeTemplate` ✓ |
| Hand | both steps nudge-bearing; `checkNudgeHand` obligations met above ✓ |
| Setting | `settings` declared, three classes, three openings, `locationSubtypes` derived ✓ |
| Cast | one actor spec, class-honest at all three classes; every `{cast:rival}` token names a declared key ✓ |
| Rewards | two `attachment_grant`s (persistent effect kinds) ✓ |
| Aftermath | `aftermathConfig` present · 5 `byOutcome` bands (floor 3) · success-side, failure-side and both extremes · every variant carries an `overview` · every change declares `concepts` ✓ |
| Systems | **4** — cast · rewards · conditions · seeds (floor 3, brief target 4) ✓ |
| Images | 13 tags, all resolve; no `illustrationUrl` ✓ |
| Consequence draw | `['drive','movement']`, both wired by effects the gate's walk can see (band reactions + step metadata, **not** card grants) ✓ |

### Chips (Law 56)

| Clause | Verdict |
|---|---|
| 0 — every chip backed by a write that fires on that band | **PASS.** Each of the five faces performs at least one qualifying write reachable on it: `critical_success` (reaction `attachment_grant` + step 1 `successMetadata`), `success` (`encounter_seed` + step 1 `successMetadata`), `success_at_cost` (reaction `condition_attachment` + step 1 `successMetadata`), `failure` (step 1 `failureMetadata` ×2 + reaction `quintessence_shift`), `critical_failure` (reaction `condition_attachment` + `assign_ambition` + step 1 `failureMetadata`). Variant-level `changes: []`, so the fallback face claims nothing. |
| 0b — the referent is a real graph object the sentence names | **PASS.** Six attachment-template anchors, one `$target` location, one `$actor`. Every `entityId` passes `classifyAnchorDeclaration`: two sentinels plus six shipped attachment templates. No `tooltipId` is declared anywhere, so the THR-1172 dangling-tooltip half cannot fire. |
| 0c — `stateNoun` names the mechanic, `detail` names the endpoints, fiction last | **PASS.** Every `stateNoun.text` is a mechanic phrase (`a fragment gained`, `Wounded`, `Exhausted`, `a place closed`, `a journey set`, `a new ambition`), never a scene noun. No placeholder appears in any `stateNoun.text` — that field is not enriched. |
| 0d — no `reputation_tally` chip | **PASS.** None authored; no reputation chip of any kind. |
| 1 — cause → change, in that order, one sentence | **PASS.** Every chip carries a `causeClause` drawn from the scene that produced it. |
| 2 — `stateNoun`, `direction`, `category` declared as structured fields | **PASS**, on all eight. |
| 3 — category the character would recognise | **PASS.** 4 `boon`, 3 `scar`, 1 `path`. No `bond` — deliberate: the brief names the bond/condition/reputation stack as the corpus reflex, and slot 2 drew `relationship`. |
| 4 — draw from the whole palette | **PASS.** `possession` ×3 chips (two distinct items), `condition` ×2 (person) + 1 (place), `path` via relocation, an ambition, plus an unchipped `quintessence_shift` and an unchipped `encounter_seed`. Seven distinct write kinds across the endings. |

### Detectors

| Detector | Verdict |
|---|---|
| Evasive vagueness (all field classes, target zero) | **PASS.** Swept for every listed term. No `somehow`, `somewhat`, `seems to`, `appears to`, `a kind of`, `a sort of`, `something like`, `in some way`, `something`, or any nominalised `the situation / the matter / the moment / the atmosphere / the tension / the dynamic / the connection / the understanding / the balance / the energy / the presence / the experience / the process`. |
| Natural indefinites in `outcome`-class fields only | **PASS.** No `someone`, `somewhere`, `things`, `stuff`, `thing`, `way`, `ways`, `nothing`, `anything`, `whatever` in any afterimage, band fragment, aftermath overview, chip text, or `narrativeTemplates.success`/`.failure`. Note the deliberate consequence: the encounter is *about* a way down, and every outcome-class sentence says **stair**, **descent**, **route** or **line** instead. `way` appears only in the scene-class spine and in `initiation`, where it is legal. |
| Intensifiers (warning only) | **Zero.** No `very`, `really`, `quite`, `rather`, `truly`, `deeply`, `profoundly`, `utterly`. |
| Annotation clauses (≤1 per encounter) | **Zero.** No `not … but` inside a single sentence anywhere, and **zero em-dashes in any authored string** — openings, spine, afterimages, fragments, effect lines, overviews, chip `detail` and `causeClause` all use full stops instead, so `emDashNot` cannot fire by construction. |
| Divine outcome-authorship (zero, every class) | **PASS.** The god is never the grammatical author of a result. Every effect line has the god acting on the scene or the mortal (*take their fear off them*, *push hard and openly*, *reveal what an earlier party left behind*); no line reads "the god decides whether/what/which/who". |
| Abstraction-as-subject (hand check) | **PASS.** Read sentence by sentence: every grammatical subject is a person, a place, a thing, or the agent. The nearest miss is "the light is nearly gone" — light is concrete and it is the scene's clock. |

### Echo check (paragraph seams)

| Seam | Verdict |
|---|---|
| opening → spine | The three P1s each end on the hour; the spine opens on the keepers. No shared image, no shared construction. |
| spine P2 → spine P3 | P2 is about the keepers leaving and the seal; P3 is about the keepers stopping people and the rival. The word *keepers* repeats, deliberately — it is the noun the paragraph is about, and swapping in a synonym would be the old mode. Sentence shapes differ (declarative event / declarative rule + reason / declarative event). |
| step 0 spine → step 1 spine | Step 0 ends on the rival going down; step 1 opens below the stair on the coffer. Different subject, different place, no repeated image. |
| step 1 spine → band prose | Step 1's spine ends on "the light is nearly gone"; no afterimage or fragment reuses the light-going image on step 1. The light image belongs to step 0's fragments (`Draw On Conviction`, `Show The Shape`) and to the `critical_success` overview, which are not adjacent to it. |
| afterimages within a step | Step 0: found a line / three tries / left rope / lost the line / the stone gave. Step 1: walked past / arms shaking / left the pack / turned out / hauled out. No two share a verb or a shape. |
| band overviews | Each names something only it can name: the lid coming off · the keepers arguing · raw palms · the road away · the stair coming down. |
| across encounters (the calibration case) | The Unclaimed Relic is a one-step `stone` frostbite test with a Cache/Insurance/Boost/Undertow/Balm/Boost hand. This is a two-step `star`→`stone` carryover delve with an Insurance/Whisper/Bargain/Compulsion/Omen/Balm/Trait + Boost/Gambit/Veil/Cache/HeavyHand/KindledAmbition hand. Shared members: `card.balm.signature.life` and the Cache *type* (different member). Type compositions differ in 11 of 13 slots. |

### Brief compliance

| Brief instruction | Verdict |
|---|---|
| Category: ruins and the delve | ✓ family `encounter.delve.*` |
| Shape: Test & Consequence, 2 steps with carryover; `carryoverFactorLines` authored | ✓ six-band carryover map |
| Step 0 `star`; step 1 not `star`, not `veil` | ✓ step 1 is `stone` |
| Every step `fair` or below | ✓ 0.40 and 0.44 (`fair` band floor 0.30, `steep` floor 0.45) |
| Envelope `ruin` + `arcane` + `sacred`, one opening each, setting-neutral spine | ✓ |
| Own `supportBundle`, class-honest at all three | ✓ § 5, checked against `LOCATION_ROLE_ROSTERS` |
| Rolled constraints honored | ✓ § 3, all five dice placed |
| Hook recorded | ✓ `hook.descent_into_darkness`; `usedBy` stamp is a Pass-4 task |
| `consequenceDraw: ['drive','movement']`, both wired in context, no swap | ✓ § 11 |
| Payoff: a real prize on success, a concrete legible penalty on failure | ✓ two graded attachment prizes; `Exhausted` + a relocation off the ground |
| Systems quota ≥4 from the authored manifest | ✓ 4 |
| ≥1 `location`-anchored chip with `visualKind` | ✓ `seal.crit_fail.shut` |
| ≤1 `individual`-anchored chip | ✓ exactly 1 |
| No `reputation_tally` chip | ✓ none |
| No new engine primitives; mature systems only | ✓ movement, conditions, carryover, items, traits, seeds, cards |
| No `authoredChoices`, no player-picked fork | ✓ none |
| No new trait continuum | ✓ hooks a live one |
| Agent-magic not load-bearing | ✓ `arcane` is a setting class only; nothing mechanical touches agent magic |

### Open findings for Pass 2 / the batch report

1. **`card.boost.core` is spent.** Slot 2 (`encounter.delve.the_drowned_archive`) may not use it,
   and must source its ungated common option elsewhere — `card.insurance.core` is also spent here,
   so the remaining zero-authoring sphere-less members are the best route.
2. **Anchor-catalog contradiction.** The catalog lists `ambition` as an anchorable kind declared by
   the ambition node id; `classifyAnchorDeclaration` rejects every literal node id that is not a
   shipped attachment template. One surface should move. Recorded rather than worked around
   silently (§ 13).
3. **Two surviving counts in the prose** ("two of them", "three tries") are flagged under the
   clever-specificity rule in § 18 for an independent read.
4. **Prize tier.** `the_silent_testament` is tier 3 on an open-draw background template, gated to
   `critical_success` alone. If Pass 2 judges that too rich for rarity 2, the swap is to
   `reward_relics_talismans_heart_of_the_barrow` (also tier 3, `#stone #relic #ancient #ruins`) or
   to drop the band reaction's grant entirely and leave the tier-2 fragment as the only prize.
