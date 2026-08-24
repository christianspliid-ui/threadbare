# Encounter Pipeline: One Body Short

> Scale: short (1 step) | Slug: one-body-short | Pass: draft
> Date: 2026-08-24 | Pipeline version: 3.0 (Encounter Factory)
> templateId: `encounter.border.one_body_short` | Batch: border-perils (THR-1221), row 5 of 6
> Batch design (binding): `Docs/plans/encounters/border-perils-batch-design.md` § 5 · Brief: `Docs/plans/encounters/border-perils-brief.md`

**This is a draft packet, not TypeScript.** Nothing under `src/` is touched. Pass 2 (critic) reads it top to bottom with the design block; Pass 3 compiles it.

---

## 0. Mechanical design block (spec step 1 — written before any prose)

**0. The crux, one plain sentence.** The agent is counting what the fight left on the ground, and the count is one short.

**0b. The title states the crux.** *One Body Short* — a player reading only the title knows the complication.

**0c. Catalog picks** (one per catalog, from `Docs/canon/encounter-catalogs.md`):

| Catalog | Pick |
|---|---|
| Shape | **Single Test** — the sequel-payoff half of the batch's `Seeded Sequel` pair (parent: `encounter.border.standing_the_line`) |
| Setting | `wayside` · `ruin` · `battlefield` · `stronghold` (all four; batch-wide envelope) |
| Pressure | `grief` (undertone `secret`) |
| Form | `death` |
| Objective | `solve` |
| Stakes | `seed` |
| System | `traits` + `conditions` (both mature tier) |

**0d. The hook.**

```
plotHookRolled: puzzle_gauntlet, death_and_return, crowd_and_purse
plotHookTaken:  death_and_return
```

Taken deliberately as an **off-reach draw**: `death_and_return` carries no `eye` affinity, so it surfaced at the table floor rather than at weight. That is the interesting half — a return-from-death read through `eye` is not a resurrection scene, it is an *accounting* scene, and the whole encounter falls out of asking what "the dead did not stay dead" looks like to somebody holding a tally. `usedBy` gets stamped on `death_and_return` in `src/data/content-eval/plotHooks.ts` at closeout.

Neither `plotHookRolled` nor `plotHookTaken` is a template field — they live here and in the batch design.

**1. Whose problem is this?** The agent's. They came out of the fight in `standing_the_line`; the road on does not start until the ground is accounted for; the count will not close. Protagonist, never bystander — the arithmetic is in their hands and nobody else is going to do it.

**2. Which reach does the step test, and why is that the theme?** `eye` — reading truly. Chosen first; the scene grew from it. An `eye` scene is *about* whether what you are looking at is what is there, and a body-count with a hole in it is that question with a person's name attached. Nothing here is solved by strength, stealth, or talk.

**3. Why is the agent here?** Motive hooks: `mission` and `divine` are the live routes. `mission` — this is the tail of the job the parent encounter was; `divine` — the god's thread is on this mortal and the seed put the scene in front of them. `chance` and `choice` are **not** honest here: a seeded sequel is not stumbled into. (Bare `?spawn=` review firings resolve as `chance`; the prose reads correctly there because the ground testifies on its own — see § 9, the pole-agnostic contract.)

**4. Which mechanics and objects play?** Decided now:

| Mechanic / object | How it plays | Scene-local · state read · state write |
|---|---|---|
| Cast binding (`survivor`) | Inherited from the parent through `inheritContext`; falls back to this template's own spawn spec | **state read** (support binding) *and* **write** (spawn when unbound) |
| Trait `trait.core.core_warmth.virtue` (Warm) | `traitVariant` + the trait-only card | **state read** (gate) |
| Condition `trait.condition.grieving` | `condition_attachment` on the failure side | **state write** (step `failureMetadata`) |
| `knows_secret_of` edge | `secret_discovery` on the success side | **state write** (step `successMetadata`) |
| Quintessence | `quintessence_shift` on the failure side and on one reaction | **state write** |
| Thread edge | `thread_weaken` on one reaction | **state write** (see § 8.4 wiring risk) |
| Hidden mark | The Long Game card's grant, revealing on `encounter.border` | **state write** (card grant) |
| Intelligence record | The Whisper card's grant | **state write** (card grant) |
| Omen | The Omen card's grant | **state write** (card grant) |
| Reward pool | Possession draw on step success — the blade nobody is lying beside | **state write** |

No base-prose sentence asserts agent history the graph does not hold (prose rule 7). The one history the prose *does* read — that there was a fight here and one other person came through it — is exactly what the parent minted, which is the Seeded Sequel shape's whole licence.

**5. What are the rewards, and where does the tension sit?** Baseline reward is the closed account: the agent knows what happened and can move. The critical success adds the possession draw (what the missing one left on the ground) and the secret. The failure penalty is concrete and game-legible — a `grieving` condition and quintessence erosion, and the question stays open on the road. Quintessence stakes: **moderate-high for this corpus, deliberately** — this is one of the batch's two grim resolutions, and the erosion is the batch's one authored `quintessence_shift`. Never a scripted death.

**6. Does the mortal make a choice in this scene?** **None — this is a test.** The fork in this encounter belongs to the *god* (the two aftermath reactions), not the mortal. The mortal-decided fork is the parent's job (`standing_the_line`, `mercy_ruthlessness`, `branchOnStep: 0`); doubling it here would make the pair two forks in a row instead of a fork and its consequence.

**7. Every promise pays off.** The opening promises a place where a fight ended. The spine promises a hole in the count. Every band closes or fails to close that hole, in the afterimage and the ending, and the `critical_success` band names what the hole was: the missing one got up and walked, and the other survivor watched it and has not said so. No mystery is opened that the bands do not close.

**8. Personalization + connected systems — the count.**

| Connection | Manifest category | Where |
|---|---|---|
| `survivor` cast binding (spawned or inherited person, portrait, click, persistence) | `cast` | `supportBundle` |
| Possession draw on the step's success | `rewards` | `successMetadata.rewardPool` |
| `trait.condition.grieving` applied | `conditions` | `failureMetadata.effects` |

**Three from the authored manifest — the contract floor.** Beyond the floor and not counted by the gate: the trait gate + trait card, the `knows_secret_of` write, the quintessence writes, the thread write, and three card grants (mark, intelligence, omen). Personalization: the cast surface carries the name (`{cast:survivor}` in two endings), and the trait card is an attribute read — the encounter is different for a Warm mortal in the hand, the factor panel, and two bands.

**9. Consequence draw (binding — `check:encounter` recomputes it from the template id).**

```
consequenceDraw: ['secret', 'thread']
consequenceSwap: none
```

- **`secret`** → `secret_discovery` (step `successMetadata`). *In context:* reading the ground truly does not just close the count — it tells the agent what the other survivor did not say. The secret is not bolted onto the ending; it *is* the ending.
- **`thread`** → `thread_weaken` (aftermath reaction "Let them say the count out loud"). *In context:* a mortal who says aloud, in a world watched by a god, that the dead here got up and walked, is a mortal whose grip on what watches them has just slipped. The thread dims because the truth was told, not despite it.

Zero unrecorded deviations. No swap taken.

**Setting envelope:** `['wayside', 'ruin', 'battlefield', 'stronghold']`, one opening each, setting-neutral spine. `locationSubtypes` derived with `expandSettings(...)`, never hand-written.

**Scene tag:** `battle.ground.uncounted` (WS4 vocabulary; fallback chain ends at EntityVisual).

**Attention tier / reachability:** `intrinsicTier: 'story_beat'`, `rarityTier: 2`. This is a seeded sequel onto one hand-picked mortal, so it has an author-chosen audience and `NUDGE_OFF_REACH_MAX_DIFFICULTY` (which binds `background` only) does not apply. **The step is authored at `fair` (0.40) anyway**, because the audience was selected for surviving a fight, not for holding `eye` — a `steep` step on a mortal picked by a seed is the decorative-hand failure wearing a different tier.

**Register declaration:** baseline throughout. **No peak surface is claimed.** Grim in this game is plain and concrete; a lyric image on this scene would soften exactly what it is for.

---

## 1. The 14 scene-writer's questions, answered

**A. Build the scene**

- **A1 · Where are we?** Four openings, one per declared class, each grounded before anything acts: a firepit kicked apart off a road (wayside); half a wall and door-sills opening onto nothing (ruin); old iron coming up through settled turf (battlefield); an open gate with nobody on it and a yard of packed dirt (stronghold).
- **A2 · How does it feel?** Two senses beyond sight in every opening. Wayside: cold enough to see breath, iron and wet horse on the air, crows working in. Ruin: sound arriving late across three rooms, wet char. Battlefield: flies already there, wind coming flat across and not stopping. Stronghold: a door banging above, cold thrown back off the walls, smoke that has already gone out.
- **A3 · Who is here?** The dead, and the other survivor. The survivor is introduced in the **spine** — setting-neutral, so they exist at all four classes before any later prose refers to them (B6). Nothing acts unannounced. The crows and the flies account for the time that has passed.
- **A4 · What must we know?** That the fighting is over; that the ground has to be accounted for before anyone moves; that the count comes out one short. All stated before the step is asked for.
- **A5 · Does the complication come last?** Yes. Each opening builds the place. The spine lands the count on top of it, and the last sentence of the spine is the hole.

**B. Internal logic**

- **B6 · Nothing referred to before it is introduced.** The survivor, the dead, the beaten ground, and the dropped blade all appear in the spine before any card, factor, band or ending names them. The light and the hour come from each opening; **no card depends on the light**, precisely because the light varies by class — see the Whisper's grounding note in § 4.
- **B7 · Every event has a visible cause.** The short count has one: there is a place with everything a death leaves and no body in it. That is the cause the whole encounter is about, and it is on the page before the roll.
- **B8 · Nothing contradicts what is established.** One fight, one count, one missing body. The openings each fix their own hour and weather; the spine and every band avoid naming either, so no opening can be contradicted downstream.

**C. Human realism**

- **C9 · Would a real person do this?** Yes, and the scene says why: nobody leaves ground like this without knowing who is on it. Counting the dead before moving on is what people do, and it is the only reason the agent is still standing here.
- **C10 · Do people react like people?** The survivor sits apart with open hands and does not look at the ground. That is a person who has stopped being useful and knows it. The agent does not press them, and the scene does not make them talk — which is exactly what makes the `critical_success` reveal land.
- **C11 · Do actions carry their true cost?** Turning over bodies costs a body's worth of strength (the energy Boost's whole premise), costs the faces afterwards (`success_at_cost`), and costs a `grieving` condition and quintessence when the count will not close.

**D. The interactive layer**

- **D12 · The stake in one sentence.** *Does the agent get a true account of who died here — and pay for the looking — or does the count stay open and the missing one stay unaccounted for on the road ahead?* A good outcome: the account closes, and it says something worse and more useful than a wrong number. A bad outcome: the count never resolves, grief settles in, and the agent walks on carrying an arithmetic that does not work.
- **D13 · Is every card grounded?** Delete the ground, the dead, the survivor and the blade from the prose and every card is senseless here. Whisper acts on *this ground versus ground like it*; the common Boost on the agent's willingness to keep looking; the energy Boost on turning over *every* body rather than the easy ones; the Omen on what this ground gave up; the Long Game on what the agent carries out of it; the trait card on whether the dead are people or a number.
- **D14 · Does every card state mechanism, not mood?** Every `effectLine` says what the god does and why that moves the odds, in plain words, with no digits. Checked card by card in § 4.
- **D15 · Does every declared class have an opening?** Four declared, four written. `validateSettingEnvelope` enforces it at build time.

---

## 2. Setting envelope, openings, and the spine

```
settings: ['wayside', 'ruin', 'battlefield', 'stronghold']
locationSubtypes: expandSettings(['wayside', 'ruin', 'battlefield', 'stronghold'])
```

Excluded batch-wide: `urban`, `rural`, `sacred`, `arcane`.

### Openings (one per class, ~60 words, `scene` field class)

**`wayside`**

> The road runs past a stand of thorn and a firepit kicked apart. The fight went off the track and into the open, where there is nothing to put your back against. It is cold enough to see breath. The air carries iron and wet horse. Crows have found the place and are working in from the edges.

**`ruin`**

> Half a wall still stands and the rest is floor plan — door sills opening onto nothing, a stair that ends in air. Ash and old mortar coat everything, and the fight has put fresh tracks through both. Sound carries oddly here; a stone turning over three rooms away arrives late. It smells of wet char.

**`battlefield`**

> This ground was fought over before and never cleaned up. Old iron comes up through the turf where the rain has worked at it, and the mounds are settled and grassed over. The new dead lie among them, still in their own shapes. Flies have already arrived. The wind comes across flat and does not stop.

**`stronghold`**

> The gate stands open with nobody on it. Inside, the yard is packed dirt and a horse trough gone still, and the walls throw the cold straight back down. Somewhere above, a door is banging in its frame and nobody is going up to stop it. The place smells of smoke that has already gone out.

### The setting-neutral spine (`step.narrativeTemplate`)

> The fighting stopped a while ago and nothing has moved since. The other survivor sits apart with open hands, not looking at the ground. The dead lie where they fell, and the count comes out one short. One place has everything a death leaves except the body: beaten ground, a dropped blade, nobody lying between them.

**Spine rules held:** no class scenery (no wall, no turf, no gate, no road); no `{...}` token, so the enrichment dry-run has nothing to resolve here; the survivor is introduced with no pronoun at all, so reuse can bind whoever is standing there.

### Encounter-level `narrativeTemplates`

- **`initiation`** — *The fight is over, and the road on does not start until the dead are accounted for. Nobody leaves ground like this without knowing who is on it.*
- **`success`** — *The account closes. What it says is worse than a wrong number, and it is written down now.*
- **`failure`** — *The count will not close. The ground keeps its arithmetic to itself, and the road on starts with the question still open.*

### Seam checks (done explicitly — the class the detectors cannot see)

| Seam | Check | Verdict |
|---|---|---|
| `initiation` → each opening | initiation owns *why nobody leaves yet*; the openings own the place. No shared image, no shared sentence shape. | clean |
| opening → spine (×4) | The openings close on crows / wet char / flat wind / dead smoke. The spine opens on time and stillness ("The fighting stopped a while ago"). No repeated noun, no repeated cadence. | clean |
| spine → bands | The spine's last image is *the empty place*. No band re-uses the phrase "one short" except the two that must (`near_miss` fragments) — and those are the only two, checked in § 4. | clean |
| spine ↔ initiation | Both mention the fight ending. Deliberately fixed once already: an earlier draft had the initiation carry the short count *and* the spine carry it, which is the exact double-statement seam echo. The initiation now carries only the obligation to count. | clean |
| across the four openings | All four use a smell or a sound; only one class ever renders, so this is not a seam. Each still opens on a different noun (road / wall / ground / gate) and closes on a different sense. | clean |

---

## 3. Test panel data (the one step)

| Field | Value | Note |
|---|---|---|
| `reach` | `eye` | The theme, chosen before the prose |
| `purposeLine` | **"Read the ground"** | 3 words, inside `REACH_PURPOSE_MAX_WORDS` (4). Plain: what is being tested, not the fiction |
| `difficulty` | `0.40` → **fair** | Inside the open-draw ceiling even though the tier does not require it (§ 0) |
| `failBehavior` | `fail_action` | The only step; failing it ends the action |
| `duration` | `{ min: 1, max: 2 }` | |
| `factorLines` | **none authored** | The variance rule (THR-892). "The light is going", "the dead are many" read identically on every run — they are priced into `0.40` and live in the prose |
| `carryoverFactorLines` | **none** | First and only step; a carryover map here is dead by construction and `checkNudgeHand` flags it |

The one authored factor surface used is the **trait line** on the `traitVariant` (§ 5) — variance by construction, since it renders only for the trait-holder.

---

## 4. The hand (6 cards, one nudge-bearing step)

**Budget held:** `whisper` · `omen` · `long_game` · `boost` ×2 (the ≤2 cap) · `trait_card`. Five distinct types (floor is 3). **Zero riders** (the budget carries no `insurance`/`mercy`/`gambit`), which is inside the ≤1-per-hand rule. Spheres: `light`, `energy`, `time`, `darkness` = **4 distinct**, at `HAND_SPHERE_COVERAGE_MIN`. Common (sphere-less) options: 2, one of them ungated. Summed `forecastDelta` = **0.41**, inside `NUDGE_HAND_MAX_TOTAL_DELTA` (0.70). No card reaches `NUDGE_BIG_DELTA` (0.15), so no card owes both failure bands.

**Dealt-hand size:** 6 authored, 1 hidden without the trait (`short.who_they_were`), so the dealt hand lands at 5–6.

**`long_game` is this card type's first authored appearance in the corpus** (zero users before this batch).

### Card 1 — Whisper

```
id:            short.plain_sight
libraryCardId: card.whisper.signature.light
sphere:        light
essenceCost:   2
forecastDelta: 0.10
imageTag:      generic.light
```

- **name:** `Plain Sight`
- **effectLine:** *You set what ground like this usually says beside what this ground is saying, so the difference stands out. A real help.*
- **fiction:** *Nothing was hidden. It was only unlit.*
- **grants:**
  ```
  { kind: 'intelligence', category: 'military_position',
    label: 'The shape of the fight',
    detail: 'Where each side stood on this ground, and the place where one of them stopped being accounted for.',
    reliability: 0.7 }
  ```
- **bandProse:** `success` — *Laid against what such ground usually shows, the gap in this one was obvious.* · `near_miss` — *The comparison held all the way to the last place. The last place stayed a blank.*

> **Authoring note — no `reveals` field.** The Whisper type's only implemented reveal kind is `next_step_demand`, and this is a **one-step** encounter, so declaring it would ship a lever that cannot fire (the live-layer trap). The card is a Whisper through its host system instead: it writes a real `intelligence` record. That is the type's own hostSystem and it exercises the grants channel.

### Card 2 — Boost (common, ungated)

```
id:            short.a_little_more
libraryCardId: card.boost.core
sphere:        —  (common pool; this is the hand's ungated common option)
essenceCost:   1
forecastDelta: 0.06
imageTag:      generic.focus
```

- **name:** `A Little More`
- **effectLine:** *You steady them enough to keep their eyes on what is in front of them. A small help.*
- **fiction:** *Most things fail by a margin.*
- **bandProse:** `success_at_cost` — *They held their eyes on it long past wanting to. The count came out. The looking stayed.* · `failure` — *Steady was not the missing part. They looked at it straight and read it wrong.*

### Card 3 — Boost (sphere-keyed)

```
id:            short.a_sudden_surge
libraryCardId: card.boost.signature.energy
sphere:        energy
essenceCost:   2
forecastDelta: 0.09
imageTag:      generic.vigor
```

- **name:** `A Sudden Surge`
- **effectLine:** *The body finds enough left to turn over every last one instead of stopping at the easy ones. A real help.*
- **fiction:** *Bodies hold more than they admit.*
- **bandProse:** `critical_success` — *They went through every body on the ground, and the ground gave up the whole account.* · `failure` — *They had the strength to finish the search. It finished, and left them holding the same short count.*

> **Two Boosts, two questions.** *A Little More* buys the **will to keep looking**; *A Sudden Surge* buys the **completeness of the search**. A steady reader who stops at the easy bodies and an exhausted reader who turns over all of them fail differently, and the fragments say so.

### Card 4 — Omen

```
id:            short.this_has_happened
libraryCardId: card.omen.signature.time
sphere:        time
essenceCost:   1
forecastDelta: 0.05
imageTag:      generic.time-slow
```

- **name:** `This Has Happened`
- **effectLine:** *A faint help now, and the days after bend toward what this uncovered.*
- **fiction:** *Nothing happens only once.*
- **grants:**
  ```
  { kind: 'emit_omen', category: 'cultural', intensity: 0.30,
    narrativeHook: 'The dead in this country are not staying where they are put, and the talk has started.',
    scope: { kind: 'global' }, sphereAlignment: 'time' }
  ```
- **bandProse:** `success` — *The count closed, and word of the place that held a death and no body will travel.* · `near_miss` — *They felt the weight of it settle. The count still stopped one short.*

### Card 5 — Long Game *(the type's debut; a deliberate one-off)*

```
id:            short.left_for_later
libraryCardId: — (none; see the note)
sphere:        darkness
essenceCost:   2
forecastDelta: 0.04
imageTag:      generic.dark
```

- **name:** `Left For Later`
- **effectLine:** *You set a mark on them nobody can see, so what they carry out of here finds them again further down the road. A slight help now.*
- **fiction:** *What is buried keeps.*
- **grants:**
  ```
  { kind: 'hidden_mark', category: 'secret_knowledge', severity: 0.55,
    label: 'Knows what this ground did not give back',
    revealFamilies: ['encounter.border'] }
  ```
  `familyMatchesTemplate` prefix-matches, so `encounter.border` reveals on every template in this batch and every later one in the family. Live by construction, not by registry lookup.
- **bandProse:** `success` — *The count closed, and the knowing of it went under the skin, out of sight, where it will keep.* · `failure` — *The ground kept its answer. The mark stayed anyway, and it will find a road to surface on.*

> **Why no `libraryCardId` — recorded, not defaulted.** The library holds exactly **one** `long_game` member, `card.long_game.hunger.sever` ("The Thread Cut"), and it is a *hunger unique*: sphere-less and held only by a Sever god. Pointing this card at it would (a) dim the batch's one `long_game` for eleven of twelve hungers, which is the opposite of a debut, and (b) misdescribe it — Sever's card **cuts** a tie, this one **plants** one. So it ships as a one-off, which the brief permits as a choice. **Follow-up for the library owner:** `long_game` has no core and no sphere signature member; a `card.long_game.signature.darkness` would be the natural home for exactly this face. Library membership is out of scope for this batch (brief § Out of scope), so it is recorded here rather than added.

### Card 6 — Trait card

```
id:            short.who_they_are
libraryCardId: card.trait_card.core
requiredTrait: trait.core.core_warmth.virtue     (the "Warm" pole of Core warmth)
sphere:        —  (common pool)
essenceCost:   0
forecastDelta: 0.07
imageTag:      generic.memory
```

- **name:** `Who They Are`
- **effectLine:** *No essence. Being Warm, they take people one at a time instead of as a crowd, and one at a time is how the odd one shows.*
- **fiction:** *Character is the one resource nobody spends.*
- **bandProse:** `success_at_cost` — *They gave each one a face before moving on. The count came out. So did the faces, later.* · `critical_failure` — *They gave each one a face and then could not put the faces down, and the count went to pieces in their hands.*

Cost 0 because the price was paid by being that person. Hidden (never dimmed) for an agent who does not hold Warm; unlocked into the hand by the `traitVariant`'s `addNudgeIds`.

### Hand audit

| Rule | Check |
|---|---|
| Hand size 4–8 | 6 ✓ |
| ≤2 `boost` | 2 ✓ |
| ≥3 distinct types | 5 ✓ |
| ≥4 distinct spheres | light · energy · time · darkness = 4 ✓ |
| ≥1 ungated common | `short.a_little_more` ✓ (plus the trait card, gated) |
| ≤1 rider | 0 ✓ |
| Summed delta ≤ 0.70 | 0.41 ✓ |
| Zero-essence card priced elsewhere | only `short.who_they_are`, trait-gated ✓ |
| No digit or `%` in an `effectLine` | checked, all six ✓ |
| `name` ≤6 words | 2–3 words each ✓ |
| Every card ≥1 failure-band fragment | 1 `near_miss` · 2 `failure` · 3 `failure` · 4 `near_miss` · 5 `failure` · 6 `critical_failure` ✓ |
| Big-delta cards cover both failure bands | none reach 0.15 — rule does not fire ✓ |
| All six `StepOutcome` bands covered | `critical_success` (3) · `success` (1,4,5) · `success_at_cost` (2,6) · `near_miss` (1,4) · `failure` (2,3,5) · `critical_failure` (6) ✓ |
| No two cards answer the same question | will-to-look / completeness / comparison / steer-the-after / plant-for-later / character ✓ |
| `libraryCardId` set wherever a member matches | 5 of 6; the sixth recorded above ✓ |
| Every `imageTag` resolves | `generic.light`, `generic.focus`, `generic.vigor`, `generic.time-slow`, `generic.dark`, `generic.memory` — all rows in `ENCOUNTER_IMAGE_LIBRARY` ✓ |

---

## 5. Band prose (all six `StepOutcome`s)

**The base text is what happens when the god did nothing.** Every band below reads correctly with any subset of the hand active; nudge-specific payoff lives only in the fragments above.

| Band | Afterimage (base) |
|---|---|
| `critical_success` | *They read the whole ground down to the drag-marks, and the drag-marks led away.* |
| `success` | *They walked it twice and got the same answer both times: one death here, and no body to bury.* |
| `success_at_cost` | *They got the count. It took turning over faces they will keep seeing.* |
| `near_miss` | — (no afterimage field; paid off through the fragments on cards 1 and 4) |
| `failure` | *They counted until the light went and never made the numbers agree.* |
| `critical_failure` | *The count broke apart in their hands and took the rest of the ground with it.* |

`ActionStep` carries five afterimages, not six — `near_miss` has no field, by design.

---

## 6. Trait hooks (all four answers, in writing)

1. **Gate?** **No.** Grief does not check anyone's character at the door, and gating a seeded sequel on a trait would make the parent able to plant an encounter the child can never fire.
2. **Variant?** **Yes.**
   ```
   traitVariants: [{
     traitId:        'trait.core.core_warmth.virtue',
     forecastDelta:  0.03,
     difficultyDelta: -0.02,
     factorLine:     'Being Warm, they look at each face before moving on.',
     addNudgeIds:    ['short.who_they_are'],
   }]
   ```
   Factor line: 10 words, inside the 12-word budget; names its source *in the sentence* (canon rule 1), never in a label; variant by construction, so it survives the variance rule.
3. **Trait-only nudge?** **Yes** — `short.who_they_are`, cost 0, unlocked through `addNudgeIds`.
4. **Trait fragment?** **No.** The card's own two fragments carry the trait's presence; a separate template-level fragment would say the same thing twice.

**Liveness:** `trait.core.core_warmth.virtue` is a seeded Core definition (`CORE_CONTINUA` → `core_warmth`, virtue pole "Warm", built by `core-trait-content.ts`), so `validateTraitRefs()` does not report it dead. The full node id is used, which is the form least likely to rot. **Deliberately not the exemplar's `core_integrity.virtue`** — Warm is the better fit for the step's action (a person who knows the dead as people notices which person is not there) and it keeps the corpus off a single continuum.

---

## 7. Aftermath

Choice-less at the mortal level, so the bands hang off `fallback` — which is why `byOutcome` lives on the variant.

```
aftermathConfig: { branchOnStep: 0, variants: {}, fallback: { … } }
```

### 7.1 Deterministic step-level writes (the ones the chips point at)

```
successMetadata: {
  rewardPool: { categoryWeights: { possession: 1.0 } },
  effects: [
    { kind: 'secret_discovery', source: 'observation', magnitudeBonus: 0.1 },
  ],
},
failureMetadata: {
  effects: [
    { kind: 'condition_attachment', templateId: 'trait.condition.grieving' },
    { kind: 'quintessence_shift', delta: -0.06,
      source: 'one_body_short.count_that_will_not_close' },
  ],
},
```

- **The reward draw is the blade.** No `tagFilters` — a filter naming a tag no attachment template carries is a silently empty pool. The possession the draw returns is what the missing one left on the ground, and its tier scales with the band, so a clean reading turns up more than a ragged one. It renders as its own PRIZE chip; nothing here authors one.
- **`successMetadata` fires on `isStepSuccess`, which counts `near_miss`.** A near miss got through, so the secret and the draw are correct there.
- **The grieving condition and the erosion fire together** on `failure` and `critical_failure`, so the failure-side endings may speak of both as fact (prose rule 7, production half).

### 7.2 The `quintessence_shift` — the batch's one, authored against the schema

Schema (`src/types/unifiedAction.ts`, the THR-1082 member): `{ kind: 'quintessence_shift'; delta: number; targetAgentId?: string; source?: string; when?: EffectPredicate }`. The effect queues a `QuintessenceEvent` onto `pendingQuintessenceEvents`; `phaseQuintessence` applies it next tick with its clamping, dissolution checks and loss-prevention intact. `delta` is designer data and never renders — the chip says the state moved and never how far.

**Two sites, both bands the fiction earns:**

| Site | Band(s) | `delta` | `source` | Why the fiction earns it |
|---|---|---|---|---|
| `failureMetadata.effects` | `failure`, `critical_failure` | `-0.06` | `one_body_short.count_that_will_not_close` | The cost is not the fight — the fight is over. The cost is standing on ground whose arithmetic does not work and being the person who could not make it work. **The body that is not there costs something that is not blood.** |
| Reaction `short.carry_it_alone` | any band, player-chosen | `-0.04` | `one_body_short.carried_alone` | The god chooses to let them keep it. Nobody else hears the count, so nobody else carries it. |

`targetAgentId` omitted on both — it defaults to the acting agent, who is the person the count is happening to. No positive shift anywhere: the brief frames this as a **cost**, and a recovery on the success side would say the encounter was good for them.

**Not authored on the success side.** A clean reading is grim and *holds*: the agent got a true account. Eroding them for succeeding would make the shift a tax on playing well rather than a consequence of the fiction.

**Chip:** only the `critical_failure` band chips the shift (§ 7.4). The reaction's shift is player-chosen and is not chipped — its result lives in the reaction's own resolution, which is the honest place for a consequence the player selected.

### 7.3 Aftermath reactions (on `fallback`, so every band offers the same fork)

Two stances about consequence, not two mechanical variants. Both are god actions on the scene, neither instructs the mortal.

| id | label | effects | The thread it preserves |
|---|---|---|---|
| `short.say_the_count` | **Let them say the count out loud** | `thread_weaken` (see § 8.4) + `recent_event` | The world's honesty. The account goes into the record where other people can act on it — and a mortal who says aloud that the dead here got up and walked has just watched the thing that watches them fail to make sense. The grip slips. |
| `short.carry_it_alone` | **Let them carry the count alone** | `quintessence_shift` (−0.04) + `recent_event` | The mortal's standing with everyone else, and the god's hold on them. Nobody hears it, nobody argues, nobody has to be told. It stays where it can only work on one person. |

Labels are interactive-plain: no metaphor, no ambiguity about what the click does. Neither label promises one thing and delivers another (the critique-pass failure the exemplar records).

### 7.4 `byOutcome` bands, overviews, and chips

`byOutcome` keys on the seven-value `UnifiedActionOutcome` — **not** the six-value per-step `StepOutcome` the fragments use. Five bands authored; the floor is three.

**`fallback.overview`** (renders on `success_at_cost` only if that band did not override — here it did — plus `contested_won` / `contested_lost`):

> The ground is counted and the count is written down. What is missing from it is missing from every account after this one.

**`fallback.changes`: `[]`.** Deliberately empty: no write fires on *every* band, and a chip in `fallback` renders on bands that do not override it. Law 56 rule 0 binds per chip.

---

**`critical_success`**

> overview: They read the whole ground and the account closes: one death, no body, and drag-marks that leave under their own weight. Whoever went down here got up and walked out. `{cast:survivor}` watched it happen and has not mentioned it since.

changes:
```
{
  id: 'short.the_unsaid',
  kind: 'shell_state',
  category: 'bond',
  direction: 'gain',
  title: 'What was not said',
  stateNoun: { text: 'a secret held', entityId: '$target', visualKind: 'agent' },
  detail: 'They now hold a secret about {target}: what {target} watched leave this ground and did not report.',
  polarity: 'mixed',
  causeClause: 'Reading the drag-marks to their end',
  concepts: [{ text: 'a secret', tooltipId: 'ui.narrative_log' }],
}
```
*Backed by:* `secret_discovery` on `successMetadata` — a real `knows_secret_of` edge, actor → target. **Anchored on `$target`**, because the edge the sentence is about points at the survivor and the chip's click must land on them, not on the agent (rule 0c). `stateNoun` names the mechanic (`a secret held`), `detail` names the endpoints, the fiction goes last.

> **Open for Pass 2:** the `concepts` tooltip id above is a placeholder. `check:encounter` fails a `tooltipId` that resolves to nothing, and there is no `secret.*` tooltip prefix in `tooltipResolver.ts`. Pass 2 should either register a concept for secrets or drop `concepts` entirely — the gate is discharged by `stateNoun.entityId` alone, and the Composition Contract's "every change declares `concepts`" is satisfiable with a resolvable id or not at all. **Do not ship a dangling tooltip id.**

---

**`success`**

> overview: The account closes. One death on this ground, and no body for it — the place where it happened is as plain as the ones that still have somebody in them.

changes: the same `short.the_unsaid` chip, minus the `causeClause` (they got the answer without the drag-marks), and with `detail`: *They now hold a secret about {target}: what was not said about the body that is not here.* Backed by the same `secret_discovery` write.

---

**`success_at_cost`**

> overview: The count is right. Getting it right meant turning over every face on this ground and looking at each one long enough to be sure, and that is not work anybody puts down at the end of it.

changes:
```
{
  id: 'short.the_faces',
  kind: 'shell_state',
  category: 'scar',
  direction: 'loss',
  title: 'The faces, kept',
  stateNoun: { text: 'grieving', entityId: 'trait.condition.grieving', visualKind: 'attachment' },
  detail: 'Turning over every face to be sure left them grieving, and it does not lift on the road.',
  polarity: 'loss',
}
```
*Backed by:* a `condition_attachment` (`trait.condition.grieving`) on **this band's** reactions — see the note below.

> **Wiring note for Pass 3.** `success_at_cost` counts as a step *success*, so `failureMetadata` does not fire there and the grieving condition has no deterministic write on this band. Two correct shapes: (a) carry `condition_attachment` in this band's own `reactions` (which then replace `fallback.reactions` wholesale, so both stances must be re-declared here), or (b) drop this chip and fold its sentence into the overview. **Prefer (a)** — the cost is the band's whole point and the fork should still be offered. Pass 3 re-declares `short.say_the_count` and `short.carry_it_alone` on this band with the condition appended to both.

---

**`failure`**

> overview: The count never agrees with itself. They walk off the ground with a number that is wrong by one and no way to say which one, and that is a thing to carry rather than a thing to solve.

changes:
```
{
  id: 'short.grief_without_a_grave',
  kind: 'shell_state',
  category: 'scar',
  direction: 'loss',
  title: 'Grief without a grave',
  stateNoun: { text: 'grieving', entityId: 'trait.condition.grieving', visualKind: 'attachment' },
  detail: 'A death they could not account for left them grieving, with no body to put it on.',
  polarity: 'loss',
}
```
*Backed by:* `condition_attachment` on `failureMetadata` ✓

---

**`critical_failure`** (the extreme the floor asks for)

> overview: The ground stops making sense under them. Every pass changes the number, and by the last one they are counting the same body twice to make it come out. `{cast:survivor}` takes them by the arm and walks them off it. The count is never made.

changes:
```
[
  {
    id: 'short.grief_without_a_grave',   // same chip as `failure`
    …as above…
  },
  {
    id: 'short.something_gave',
    kind: 'shell_state',
    category: 'scar',
    direction: 'loss',
    title: 'Worn through',
    stateNoun: { text: 'quintessence', entityId: '$actor', visualKind: 'agent' },
    detail: 'Counting a thing that would not stay counted wore at what holds them together.',
    polarity: 'loss',
    causeClause: 'Three passes over the same ground and three different numbers',
  },
]
```
*Backed by:* `quintessence_shift` (−0.06) on `failureMetadata` ✓. Anchored on `$actor` — the bearer of the stat, per the anchor catalog's Stats row. Reports **no quantity**: the chip says the state moved and the reader can look it up on the agent's own sheet (`AgentDetailPanel` renders quintessence), which is what Law 13 parity requires. **No `reputation_tally` chip anywhere in this encounter** (rule 0d — `check:encounter` fails one).

### 7.5 Aftermath audit

| Contract row | Check |
|---|---|
| `aftermathConfig` present | ✓ |
| `byOutcome` floor: ≥3 bands, one success-side, one failure-side, one extreme | 5 bands; `critical_success` + `critical_failure` are both extremes ✓ |
| Every variant carries an `overview` | fallback + 5 bands ✓ |
| Every change declares `concepts` | one open item, flagged for Pass 2 (§ 7.4) ⚠ |
| Every chip backed by a write **on that band** | 4 of 5 verified; `success_at_cost` carries the wiring note ⚠ |
| Something persists (Rewards block) | `rewardPool` draw **and** `secret_discovery` **and** `condition_attachment` ✓ |
| PATH used only for an opening the game acts on | **no PATH chip authored** — the sequel's opening was the *parent's* to claim ✓ |
| Prizes/tolls as object references, not inline prose | `rewardPool` draw + the condition template id ✓ |
| Tolls in words | "grieving", "worn through" — no numbers ✓ |

---

## 8. The inherited-context contract (the Seeded Sequel half)

### 8.1 What plants this encounter

`encounter.border.standing_the_line` (batch row 4) plants an `encounter_seed` naming `templateId: 'encounter.border.one_body_short'` with `inheritContext: true` and a `delayTicks` the parent's design sets. `inheritContext` copies the source action's `targetId` **and** `supportBindings` onto the seed, so the parent's cast crosses into this scene.

### 8.2 What this encounter may read

Exactly two facts, and nothing else:

1. **There was a fight here and it is over.** The ground carries what a fight leaves.
2. **One other person came through it and is here.** Bound as the cast key `survivor`.

Everything else in the prose is **scene-local invention** with no life outside this encounter (the firepit, the banging door, the dropped blade, the empty place) or a **read through a sanctioned surface** (the trait gate, the cast binding, the reward draw).

### 8.3 What this encounter may **not** assume — the pole-agnostic contract

The parent is a `Personality Fork` on `mercy_ruthlessness`, resolved by the *mortal* through `branchOnStep: 0`. Its poles are *hold the road and let them past behind you* versus *break the pursuit before it arrives*. **This draft does not know which pole was taken, and nothing in it depends on knowing.**

| Forbidden | Why | What is written instead |
|---|---|---|
| "the one you saved" / "the pursuit you broke" | Names a pole | "the other survivor" |
| "the road you held" | Names a pole and a place | The ground is described by what it *is* at each class |
| Any claim about who started the fight or who won it | Both poles end with dead on the ground; neither is a victory the prose can assert | "The fighting stopped a while ago" |
| Any pronoun for the survivor | Reuse binds whoever is standing there — and the inherited binding could be either of the parent's two named roles | Restructured: *"The other survivor sits apart with open hands"* — no pronoun at all, anywhere in the encounter |
| That the agent was present for the fight | True under the seeded route, false under a bare `?spawn=` review firing | The **ground** testifies, not the agent's memory: *"One place has everything a death leaves except the body"* |

**The role noun `the other survivor` is the load-bearing choice.** It is true under both poles (the one who could not fight, or the one who stood), true whether the agent fought or arrived after, and true when the binding does not inherit and this template spawns its own.

### 8.4 Cross-draft wiring dependencies — **two, both flagged for Pass 2/3**

**(a) The cast key must be `survivor`.** This draft declares `supportBundle` with `key: 'survivor'`. `encounter.border.standing_the_line` must bind the crossing person under the **same key** for the inherited binding to line up. If it does not, this template's own spec materializes a fresh person and the scene still reads — a declared key always resolves (THR-696) — but the sequel callback loses its point. **Reconcile with row 4's draft before compile.**

**(b) `secret_discovery` reads `action.targetId`, which must be an actor.** The effect has no `targetAgentId` override: `encounterAftermath.ts` reads `action?.targetId` and `createSecretEdge` refuses an endpoint that is not an actor node, tracing the refusal. Under `inheritContext` the target is copied from the parent, so **the parent must target the crossing person, not the location.** If row 4 targets a place, this encounter's `secret` family is wired at the gate and inert at runtime — the exact rot Law 56 exists to stop. **Reconcile with row 4's draft before compile;** if the parent must target a location, the `secret` family here has to move to `hidden_mark` (which takes `targetAgentId`) and the swap recorded.

**(c) `thread_weaken` cannot resolve a sentinel today — engine gap, needs a deferral ticket.**

`bindAftermathSceneTargets`'s `SCENE_SENTINEL_FIELDS` map (`src/engine/encounterAftermath.ts`) carries `targetAgentId`, `withAgentId`, `counterpartyId`, `debtorAgentId`, `targetFactionId`, `factionId`, `targetSublocationId`, `targetLocationId` — and **not** `ascendantId`, `mortalId`, `sourceMortalId`, or `newMortalId`. The four thread-mutation effects read their ids raw off the effect (`state.graph.getOutgoingEdges(effect.ascendantId, 'thread')`), so an authored sentinel passes through as a literal seven-character string and the effect no-ops with a `thread_mutation_skipped` / `edge_missing` trace. The one authoring example in the repo (`src/data/encounters/examples/example.thread_bond_tested.ts`) writes `ascendantId: 'self', mortalId: 'actor'` and is explicitly `@ts-ignore`d as "not a real game encounter".

Authored shape, pending the fix:
```
{ kind: 'thread_weaken', ascendantId: '$ascendant', mortalId: '$actor',
  delta: 0.12,
  reason: 'Said aloud that the dead here did not stay where they were put' }
```

- `check:encounter` recomputes `consequenceDraw` from the template id and checks that a satisfying **kind** is present, so the `thread` family is green at the gate either way.
- **The chip is deliberately not authored.** Law 56 rule 0 forbids a chip over an effect that does not fire, so the reaction's consequence lives in its own resolution and in the band overview until the gap closes. This is the one place in the packet where a designed consequence is knowingly parked.
- **Deferral to file:** widen `SCENE_SENTINEL_FIELDS` to cover the four thread-effect id fields, registering `mortalId` / `sourceMortalId` / `newMortalId` as `'agent'`, and introduce an `$ascendant` sentinel resolving to the ascendant on the acting mortal's thread edge (there is no existing token for it — `$actor` and `$target` both name mortals). Label `Deferral`, project = the batch's project, `// TODO(THR-XX)` on the effect at compile time. **Batch row 6 (`the_garrisons_price`) drew `thread` as well and hits the identical wall** — one ticket serves both.

---

## 9. Cast and world objects

```
supportBundle: [{
  kind:           'actor',
  key:            'survivor',
  delivery:       'lazy-materialize-on-trigger',
  persistence:    'must-persist',
  reuseNpcRoles:  ['mercenary', 'scout', 'ranger', 'wanderer'],
  supportRole:    'fellow_survivor',
  spawnNpcRole:   'mercenary',
  spawnName:      'Ivo Renn',
}]
```

**Class-honesty across all four declared classes** (`LOCATION_ROLE_ROSTERS` via `SUBTYPE_TO_ROSTER_KEY` in `npcSeeding.ts`):

| Class | Subtypes | Roster key | Reusable roles present |
|---|---|---|---|
| `wayside` | `camp`, `oasis`, `wilderness` | `military_outpost` (camp) · `wilderness` | `mercenary`, `scout` · `ranger`, `wanderer` |
| `stronghold` | `castle`, `fort` | `capital` (castle) · `military_outpost` (fort) | `mercenary` · `mercenary`, `scout` |
| `ruin` | `ruins`, `ruined_tower`, `ruined_city`, `ruined_village`, `unexplored_poi` | **none** — ruins seed no NPCs | — (spawn path) |
| `battlefield` | `battleground` | **none** — unmapped, seeds no NPCs | — (spawn path) |

Reuse is opportunistic and covers `wayside` + `stronghold`; `ruin` and `battlefield` seed nobody, so the spawn path is the normal one there and `spawnNpcRole: 'mercenary'` reads correctly at all four — somebody who was in the fight and is still standing. `oasis` is also unmapped and falls to the spawn path. `spawnName` is a real name, not a role phrase, because a declared key always resolves and this string is what `{cast:survivor}` renders whenever no live NPC was reused. **The prose never genders the survivor**, at any class, on any band — the whole encounter is written without a pronoun for them, which is doubly required here because the binding is inherited from another draft.

`{cast:survivor}` is used **twice**, both times where the name earns something: the `critical_success` reveal and the `critical_failure` rescue. Everywhere else the role noun carries it — ruling 6's default register.

**Other world objects:** the dead (scenery, no bindings — they are the count, not cast); the dropped blade (scene-local, and the object the reward draw stands in for); `trait.condition.grieving`; `trait.core.core_warmth.virtue`; the `knows_secret_of` edge; the hidden mark; the intelligence record; the emitted omen.

---

## 10. Support bundle contract

| Support object | Delivery | Source | Persistence | Future references | Status |
|---|---|---|---|---|---|
| `survivor` (actor) | lazy-materialize-on-trigger, or inherited | parent's `supportBindings` → roster reuse → spawn | **must-persist** | `{cast:survivor}` on 2 bands; `$target` anchor on the secret chip | built (spec authored here) |
| `trait.core.core_warmth.virtue` | pre-seeded | `core-trait-content.ts` (Core continuum `core_warmth`) | must-persist | trait gate, variant, trait card | live |
| `trait.condition.grieving` | on-trigger | `condition-trait-content.ts` | duration-bounded | 2 chips, 2 bands | live |
| Possession draw | on-trigger | `rewardPool` over `possession` | must-persist | PRIZE chip (engine-rendered) | live |
| Hidden mark `secret_knowledge` | on-trigger (card grant) | `hidden_mark` effect | decays after grace | reveals on `encounter.border` | live |
| Intelligence record `military_position` | on-trigger (card grant) | `intelligence` effect | must-persist | future intel reads | live |
| Cultural omen | on-trigger (card grant) | `emit_omen` effect | `durationTicks` default | draw bias | live |
| `knows_secret_of` edge | on-trigger | `secret_discovery` | must-persist | secret chip; leverage readers | **blocked-primitive** pending § 8.4(b) |
| Thread weakening | on-trigger (reaction) | `thread_weaken` | permanent | none (unchipped) | **blocked-primitive** pending § 8.4(c) |

---

## 11. Images

**Card art — the genericity test** (`GENERIC_POOL_UNRELATED_ENCOUNTERS_MIN` = 3 unrelated encounters):

| Card | `imageTag` | Row subject | Reads correctly in three unrelated encounters? |
|---|---|---|---|
| Whisper | `generic.light` | a guttering lamp waking in a black passage | a vault reading · a night watch · a hearing before a magistrate ✓ |
| Boost (common) | `generic.focus` | a hand holding a needle still, the tremor going out of it | a surgery · a lock · an archery contest ✓ |
| Boost (energy) | `generic.vigor` | a hooded silhouette straightening, breath rising | a march · a rescue dig · a long climb ✓ |
| Omen | `generic.time-slow` | a water drop hanging, not yet fallen | a prophecy · a duel's first move · a flood warning ✓ |
| Long Game | `generic.dark` | dark closing over an abandoned satchel like water | a smuggling run · a burial · a name struck from a roll ✓ |
| Trait card | `generic.memory` | an old worn notch in a doorpost, surfacing again | a homecoming · a forged seal spotted · an old debt recalled ✓ |

All six resolve to real rows in `ENCOUNTER_IMAGE_LIBRARY` (`NUDGE_CONCEPT_ART`). None falls through to the `nudge` category generic (`generic.blessing`), which is the silent-fallback failure this check exists to catch.

No `fictionBySetting` on any card: none of the six quotes names class scenery, so the generic quote is correct at all four classes.

**`illustrationUrl`:** not declared. Scene art resolves through the scene tag `battle.ground.uncounted` and the EntityVisual fallback chain until the manifest carries a row.

---

## 12. Concept art direction

**Question 1 — what emotions does this story convey?** An account that will not close. The particular weight of a person unaccounted for — not mourned, because you cannot mourn a number. Grief with a hole in the middle of it. The cold, clerical patience of counting the dead, and how badly that patience fails when the arithmetic refuses.

**Question 2 — what image evokes those emotions while staying inside the world?**

> **A row of shapes laid out under cloaks on beaten ground, evenly spaced, feet toward the viewer. One gap in the row. In the gap, a cloak folded and laid flat with nothing under it, and beside it a blade set down point-first in the dirt. Low, flat light. No faces, no people, no fight.**

Residue, not events. Absence, not presence. The whole encounter is in the one flat cloak: someone did the work of laying out the dead, reached that place in the row, and had nothing to cover. The blade is the only thing left of whoever should be lying there, and it is the object the reward draw stands in for.

**Doctrine held:** no second human likeness (image doctrine ruling 10), no depiction of the interaction, no baked-in caption text, no UI elements painted into the plate. The 16:9 plate and its portrait crop both read at the gap, which is the composition's anchor.

---

## 13. Detector self-scan

| Detector | Result |
|---|---|
| **Evasive vagueness** (`somehow`, `seems to`, `something`, `the situation`, `the moment`, `the tension`, …) — every field class, target zero | **0.** Scanned all four openings, the spine, three `narrativeTemplates`, five afterimages, six `fictions`, six `effectLines`, twelve fragments, six overviews, five `details`. |
| **Natural indefinites** (`someone`, `somewhere`, `things`, `way`, `nothing`, `anything`, `whatever`, …) — **outcome prose only** | **0 in outcome prose.** Three occurrences sit in *scene* prose, where they are ordinary English and correct: `nobody` variants in three openings and the spine, and `Nothing was hidden` / `Nothing happens only once` in two card `fiction` quotes (scene class). Two earlier outcome-prose drafts were fixed during drafting: *"answered nothing"* → *"left them holding the same short count"*, and *"has said nothing about it since"* → *"has not mentioned it since"*. |
| **Intensifiers** (`very`, `really`, `deeply`, …) — warn only | **0.** |
| **Annotation clauses** (`notButClause`, `emDashNot`) — ≤1 across the encounter | **0.** No "not … but" inside any sentence; no em-dash followed by a negation. The two em-dashes in the packet's prose (`ruin` opening, `success` overview) are both followed by a noun phrase. |
| **Divine outcome-authorship** (`DIVINE_DECISION_PATTERNS`) — zero, every class | **0.** No decision verb anywhere in player-facing prose. The two reaction labels are god acts ("Let them say the count out loud" / "Let them carry the count alone"), which is the god choosing its own action — the passing side of the rule. |
| **Digits or `%` in an `effectLine`** | **0** across six cards. |
| **Abstraction-as-subject** (hand check) | Grammatical subjects across the openings and spine: *the road, the fight, it, the air, crows, half a wall, ash, sound, this ground, old iron, the new dead, flies, the wind, the gate, the yard, the walls, a door, the place, the fighting, the other survivor, the dead, the count, one place.* Two abstractions in the subject slot (`the count`, `the fighting`), both of which are the literal thing the scene is about rather than mood narration. Clean. |
| **The three plainness moves** | (1) Subject first — no sentence in the packet opens on a fragment; checked line by line. (2) Abstract nouns swapped — *"the weight of what was unaccounted for"* became *"the count comes out one short"*; *"a loss of certainty"* became *"the count broke apart in their hands"*. (3) One dry line per beat — the packet carries exactly three dry closers (*"So did the faces, later."*, *"The looking stayed."*, *"The ground keeps its arithmetic to itself"*), none of them stacked on the same beat. |
| **Density (move 4)** | One named person on stage (`survivor`). No third party who mentions a fourth. Props the player can act on only: the ground, the dead, the blade, the empty place. No letters, no errands, no backstory. |
| **Word budgets** | Openings 56–60 · spine 57 · band bases within 60 · fragments 12–22 (cap 25) · `fiction` 5–8 (cap 30) · `name` 2–3 (cap 6) · factor line 10 (cap 12). All inside budget. |

---

## 14. Self-audit against the Composition Contract

| Block | Verdict |
|---|---|
| **Steps** | 1 plain step, `eye`, `difficulty: 0.40`, `narrativeTemplate` present ✓ |
| **Hand** | 6 cards on the one nudge-bearing step; full `checkNudgeHand` audit in § 4 ✓ |
| **Setting** | 4 classes declared, 4 openings written, `locationSubtypes` derived ✓ |
| **Cast** | 1 actor binding, class-honest at all four classes; both `{cast:survivor}` tokens name the declared key ✓ |
| **Rewards** | `rewardPool` draw + `condition_attachment` + `secret_discovery` — three persistent routes ✓ |
| **Aftermath** | `aftermathConfig` present, 5 `byOutcome` bands (floor 3), every variant has an `overview`; **one open item** on `concepts` and **one** on the `success_at_cost` chip's backing write ⚠ |
| **Systems** | 3 from the authored manifest (`cast`, `rewards`, `conditions`) ✓ |
| **Images** | 6 of 6 card tags resolve to real library rows; no `illustrationUrl` declared ✓ |
| **A one-step encounter owes the full contract (ruling 3)** | Every block above is present. No exemption claimed, none requested. ✓ |
| **`RETROFIT_PENDING`** | Not listed and must never be — new content never starts on the ratchet ✓ |

**Two ⚠ items are the entire open surface of this draft**, plus the three cross-draft dependencies in § 8.4. Nothing else is deferred.

---

## 15. Experience Differentiator Gate (14 answers)

**Scene & prose**

1. **Does the opening place the player inside a moment already in motion?** **YES.** Every opening arrives after the event: a firepit already kicked apart, tracks already through the ash, flies already arrived, a door already banging with nobody going up to it. The player is never briefed; they walk in late.
2. **Does the prose have its own voice — cadence, rhythm, sentence variety?** **YES.** Short declaratives against longer ones, dry closers ("The ground keeps its arithmetic to itself"), and a deliberate flatness that is the scene's texture rather than the absence of one.
3. **Does the scene name the elements that later become choices?** **YES.** The ground, the dead, the survivor, the dropped blade, the empty place — all in the spine, all acted on by cards, chips, or the reward draw.
4. **Would a reader feel something from the prose alone?** **YES.** The last sentence of the spine is the whole encounter with no mechanics attached: *One place has everything a death leaves except the body.*

**Choices & intervention**

5. **Does every card state mechanism, with a generic 2–4 word title, one flavor quote, and zero scene-bespoke prose on the face?** **YES.** Six faces, all library-generic, all passing the three-unrelated-encounters test in § 11. The scene's account of each card lives only in its band fragments.
6. **Is every card's price real and legible?** **YES.** Five cost essence (1–2); the sixth costs 0 and is priced by being Warm. No free non-trait card.
7. **Does every card pay off in failure?** **YES** — six cards, six failure-band fragments, checked in § 4. No card reaches `NUDGE_BIG_DELTA`, so no card owes both bands.
8. **Is the hand grounded?** **YES.** Delete the ground, the dead, the survivor and the blade and every card is senseless here.
9. **Do the cards answer different questions?** **YES.** Will-to-look · completeness-of-search · comparison-against-known-ground · steering-the-after · planting-for-later · seeing-people-not-numbers. The two Boosts are the only near pair, and § 4 records why they are two decisions.
9b. **Full authored hand on every nudge-bearing step, and does no step ask the player to pick a branch or an ending?** **YES.** One step, one full hand of six. **No `authoredChoices` anywhere.** The only fork is the god's own aftermath stance, which is the god choosing its act, not the mortal's ending.

**Aftermath & consequence**

10. **Does the aftermath have its own prose?** **YES.** A `fallback` overview plus five band overviews, each saying only what it alone can say — the same fact in three voices is an echo, not an ending.
11. **Are consequence outcomes actor-centered?** **YES.** `{cast:survivor}` is named on two bands; the secret chip names both endpoints; the grief chip names the person carrying it. No anonymous stat deltas, and no quantity the player cannot look up.
12. **Reaction choices for medium+ scale?** **YES** — offered anyway at short scale, because the `thread` consequence needs a stance to hang on. Two, on `fallback`, so every band carries them.
13. **Do the reactions represent different philosophical stances about consequence?** **YES.** *Let them say the count out loud* puts the truth into the world and pays for it in the god's own grip on this mortal. *Let them carry the count alone* keeps the thread whole and spends the mortal instead. Neither is the safe one.
14. **Does the concept art use the two-question method — residue, not illustration?** **YES.** The plate is a row of covered dead with one flat empty cloak in the gap and a blade set point-first beside it. No fight, no faces, no people. It shows what is missing, which is what the encounter is about.

**All 14 YES. No NO-with-a-note.**

---

## 16. What Pass 2 should attack first

1. **§ 8.4 (b) and (c)** — the two runtime wiring dependencies. (c) is an engine gap needing a `Deferral` ticket that also serves batch row 6; (b) needs reconciliation with row 4's draft before either compiles.
2. **§ 7.4** — the placeholder `concepts` tooltip id on the secret chip, and the `success_at_cost` chip's backing write.
3. **The two Boosts** — the only place in the hand where the no-two-cards-answer-the-same-question rule is argued rather than obvious.
4. **The seam list in § 2** — four opening→spine seams, read aloud, against the batch's other five drafts once they exist.
