# Encounter Pipeline: One Body Short
> Scale: short (1 step) | Slug: one-body-short | Pass: final
> Date: 2026-08-24 | Pipeline version: 3.0 (Encounter Factory)
> Status: **READY WITH CAVEATS**

---

## Pipeline Summary

| Pass | Verdict | Notes |
|------|---------|-------|
| Draft | Complete | Eleven ⚠ items reported open; drafted the batch's sequel-payoff half with a `thread`-family draw that could not resolve against the live scene-sentinel table. |
| Editorial | Complete (revisions applied) | All eleven draft-reported items closed: consequence swap `thread` → `omen` ruled and recorded; `concepts` declared and entity-anchored on all five chips; the `success_at_cost` grief chip re-backed on its own band reactions; two vagueness-detector hits and six seam echoes fixed; the `wayside` opening rewritten so the ground testifies rather than narrating the fight's course; four plainness-move rewrites. |
| Systems | READY WITH CAVEATS | Every declared id, effect kind, category member, and constant verified live against the runtime — none dead, none invented. The consequence swap verified by an actual run of `npm run draw:consequences`, matching the packet's arithmetic exactly. Two caveats found, both open coordination/tooling items rather than defects in this template's own authored content: (1) the sequel's target-binding still depends on `standing_the_line` declaring its own action's target, unresolved on that side; (2) the bare `?spawn=` review route does not correctly exercise the `critical_success`/`success` bands, because `prepareDebugEncounterSpawn` always targets the acting agent's location rather than an actor — traced end to end, confirmed a review-tooling gap, not a template defect. |

### Caveats / Blockers

1. **Row 4 target-binding reconciliation (not this template's code to fix).**
   `encounter.border.standing_the_line` must declare its own action's `targetId` as the crossing
   person (the `survivor`), not a location — `inheritContext` copies `action.targetId` verbatim
   (`src/engine/encounterAftermath.ts:1541-1550`), and if row 4 targets a place, this template's
   `secret_discovery` write is wired at the gate and dead at runtime, the identical failure shape
   already diagnosed and swapped away for the `thread` family. Coordinate with row 4's author
   before either compiles; the cast key (`survivor`) is already confirmed matching on both sides.

2. **The bare `?spawn=` review route does not correctly exercise the `critical_success`/`success`
   bands.** `prepareDebugEncounterSpawn` (`src/engine/debugEncounterTools.ts:434-440`)
   unconditionally sets `targetId: locationId`. Under that route: `secret_discovery` refuses to
   write (fail-soft, traced, no edge created — `src/engine/secretGeneration.ts:325-337`); the
   `short.the_unsaid` chip's `$target` anchor resolves to the location anyway rather than failing
   closed (`resolveAnchorDeclaration` has no type check); and the `{target}` enrichment token in
   the chip's `detail` substitutes the location's name, producing a well-formed but false
   sentence ("a secret about Thornwood Camp: what Thornwood Camp watched..."). This is a gap in
   the review tool's target selection, not in this template's TypeScript. Backlog a
   `targetQuery` option on `DebugSpawnEncounterOptions` (small, two files); review these two
   bands via the seeded route or the CLI's `spawn encounter-context ... --agent <survivor>`
   in the meantime. Full trace: `Docs/plans/encounters/one-body-short-systems.md` § 1, § 5.

Nothing else is open. No missing primitive blocks compile; every effect kind, sentinel, trait id,
condition id, library card id, image tag, and constant this packet declares was checked against
the live runtime and confirmed correct (`one-body-short-systems.md` §§ 2–4, 9).

### Editorial Notes Summary

The editorial pass (`one-body-short-editorial.md`) found the draft's own self-audit undercounted
its open items (two ⚠ reported, eleven actually present) and closed all eleven: the `thread` →
`omen` consequence swap (an orchestrator ruling, since `thread_*` effects cannot resolve a scene
sentinel today — `SCENE_SENTINEL_FIELDS` omits `ascendantId`/`mortalId`); `concepts` declared and
entity-anchored on every one of the five aftermath chips (was 1 of 5); the `success_at_cost`
band's grief chip re-backed on the band's own re-declared reactions, since `success_at_cost` is a
`SUCCESS_BANDS` member and cannot read `failureMetadata`; two evasive/indefinite-vagueness
detector hits (`way`, `thing`) rewritten; six seam echoes found and fixed across an
eighteen-seam audit (widened from the pipeline's default four-seam check); the `wayside` opening
rewritten so the ground testifies to what happened rather than narrating the fight's course
(load-bearing for the pole-agnostic contract — the parent's poles could otherwise contradict it);
and four of the four canonical plainness-move rewrites applied. Code and systems were explicitly
out of scope for the editorial pass and are not re-litigated here.

### Implementation File Map

- **`src/data/encounters/one-body-short.ts`** (new) — the `ONE_BODY_SHORT_TEMPLATE`, following
  the `ROAD_AMBUSH_TEMPLATE` / `road-ambush.ts` shape.
- **`src/data/unified-action-templates.ts`** — one import near line 193; one entry in the array
  feeding `UNIFIED_ACTION_TEMPLATES` (~5590 region); one entry in
  `LOCATION_BRANCHING_ENCOUNTER_TEMPLATES` (~5678 region), because this template declares
  `locationSubtypes` and is authored outside `encounter-content.ts`.
- **No engine changes required** — every effect kind, sentinel, and mechanism used is already
  live.
- **`src/data/content-eval/plotHooks.ts`** — stamp `usedBy` on `death_and_return` at closeout.
- **Test coverage** — registering the template is covered by the corpus-wide
  `check:encounter` / `checkNudgeHand` / `checkConsequenceDraw` / Composition Contract sweeps; a
  CLI smoke (`spawn encounter <agent> encounter.border.one_body_short`) is the cheapest live-fire
  check and doubles as a workaround for the `?spawn=` target gap above.
- **Linear:** file the `DebugSpawnEncounterOptions` target-override gap as a Deferral against the
  batch project; flag the row-4 target-binding reconciliation as a coordination item, not a code
  change here.

Full audit, with every id and mechanism traced against the live source: `Docs/plans/encounters/one-body-short-systems.md`.

---

## Encounter Packet

The complete revised, editorially-approved packet follows, copied verbatim from
`Docs/plans/encounters/one-body-short-revised.md`.

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

**1. Whose problem is this?** The agent's. The fighting on this ground is over; the road on does not start until the ground is accounted for; the count will not close. Protagonist, never bystander — the arithmetic is in their hands and nobody else is going to do it. Under the seeded route the agent came out of the fight in `standing_the_line`; under a bare `?spawn=` review firing they arrived after it. **The encounter never asserts which**, because the ground testifies rather than the agent's memory (§ 8.3).

**2. Which reach does the step test, and why is that the theme?** `eye` — reading truly. Chosen first; the scene grew from it. An `eye` scene is *about* whether what you are looking at is what is there, and a body-count with a hole in it is that question with a person's name attached. Nothing here is solved by strength, stealth, or talk.

**3. Why is the agent here?** Motive hooks: `mission` and `divine` are the live routes. `mission` — this is the tail of the job the parent encounter was; `divine` — the god's thread is on this mortal and the seed put the scene in front of them. `chance` and `choice` are **not** honest here: a seeded sequel is not stumbled into. (Bare `?spawn=` review firings resolve as `chance`; the prose reads correctly there because the ground testifies on its own — see § 9, the pole-agnostic contract.)

**4. Which mechanics and objects play?** Decided now:

| Mechanic / object | How it plays | Scene-local · state read · state write |
|---|---|---|
| Cast binding (`survivor`) | Inherited from the parent through `inheritContext`; falls back to this template's own spawn spec | **state read** (support binding) *and* **write** (spawn when unbound) |
| Trait `trait.core.core_warmth.virtue` (Warm) | `traitVariant` + the trait-only card | **state read** (gate) |
| Condition `trait.condition.grieving` | `condition_attachment` on the failure side, and on the `success_at_cost` band's own reactions | **state write** (step `failureMetadata`; band reactions) |
| `knows_secret_of` edge | `secret_discovery` on the success side | **state write** (step `successMetadata`) |
| Quintessence | `quintessence_shift` on the failure side and on one reaction | **state write** |
| Omen | The Omen card's grant, **and** the `short.say_the_count` reaction — the consequence draw's `omen` family (§ 9) | **state write** (card grant; reaction effect) |
| Hidden mark | The Long Game card's grant, revealing on `encounter.border` | **state write** (card grant) |
| Intelligence record | The Whisper card's grant | **state write** (card grant) |
| Reward pool | Possession draw on step success — the blade nobody is lying beside | **state write** |

Every mechanic declared here is used. No base-prose sentence asserts agent history the graph does not hold (prose rule 7). The one history the prose *does* read — that there was a fight here and one other person came through it — is exactly what the parent minted, which is the Seeded Sequel shape's whole licence.

**5. What are the rewards, and where does the tension sit?** Baseline reward is the closed account: the agent knows what happened and can move. The critical success adds the possession draw (what the missing one left on the ground) and the secret. The failure penalty is concrete and game-legible — a `grieving` condition and quintessence erosion, and the question stays open on the road. **The grief penalty is reach-coherent, which is why it is the right one:** `trait.condition.grieving` carries `domainContributions: { heart: -0.08, eye: -0.05 }`, so failing an `eye` test leaves the agent measurably worse at the next `eye` test. The world got harder in the specific way this scene was about. Quintessence stakes: **moderate-high for this corpus, deliberately** — this is one of the batch's two grim resolutions, and the erosion is the batch's one authored `quintessence_shift`. Never a scripted death.

**6. Does the mortal make a choice in this scene?** **None — this is a test.** The fork in this encounter belongs to the *god* (the two aftermath reactions), not the mortal. The mortal-decided fork is the parent's job (`standing_the_line`, `mercy_ruthlessness`, `branchOnStep: 0`); doubling it here would make the pair two forks in a row instead of a fork and its consequence.

**7. Every promise pays off.** The opening promises a place where a fight ended. The spine promises a hole in the count. Every band closes or fails to close that hole, in the afterimage and the ending, and the `critical_success` band names what the hole was: the missing one got up and walked, and the other survivor watched it and has not said so. No mystery is opened that the bands do not close.

**8. Personalization + connected systems — the count.**

| Connection | Manifest category | Where |
|---|---|---|
| `survivor` cast binding (spawned or inherited person, portrait, click, persistence) | `cast` | `supportBundle` |
| Possession draw on the step's success | `rewards` | `successMetadata.rewardPool` |
| `trait.condition.grieving` applied | `conditions` | `failureMetadata.effects` + the `success_at_cost` band reactions |

**Three from the authored manifest — the contract floor.** Beyond the floor and not counted by the gate: the trait gate + trait card, the `knows_secret_of` write, the quintessence writes, the reaction's omen, and three card grants (mark, intelligence, omen). Personalization: the cast surface carries the name (`{cast:survivor}` in two endings), and the trait card is an attribute read — the encounter is different for a Warm mortal in the hand, the factor panel, and two bands.

**9. Consequence draw (binding — `check:encounter` recomputes it from the template id).**

```
consequenceDraw: ['secret', 'omen']
consequenceSwap: { from: 'thread', to: 'omen', reason: <below> }
```

- **`secret`** → `secret_discovery` (step `successMetadata`). *In context:* reading the ground truly does not just close the count — it tells the agent what the other survivor did not say. The secret is not bolted onto the ending; it *is* the ending.
- **`omen`** → `emit_omen` (aftermath reaction "Let them say the count out loud"). *In context:* a mortal who says aloud, in a country that already has this kind of news, that the dead here got up and walked, is a mortal who has just started the telling. Pick the other stance and there is no omen, because nobody heard it. The family is a reason this scene does that thing, not a bolt-on at the ending.

**The one swap, recorded** (spec § The Consequence Draw — one swap, zero unrecorded deviations):

```ts
consequenceSwap: {
  from: 'thread', to: 'omen',
  reason: 'thread_* effects read `ascendantId`/`mortalId` as literal node ids; neither is '
        + 'a SCENE_SENTINEL_FIELDS member and the ascendant node id is minted per run, so '
        + 'no authorable literal exists. The write no-ops with `thread_mutation_skipped` '
        + 'while check:encounter passes on kind presence — a family that is green at the '
        + 'gate and dead at runtime. `omen` (weight 4 in eye) is also the better fiction: '
        + 'a death that did not stay dead is what the sky says is coming.',
}
```

Gate arithmetic, verified: `omen`'s weight in `eye` is **4** (`CONSEQUENCE_FAMILY_WEIGHTS`, `src/data/content-eval/consequenceDraw.ts`), over the `CONSEQUENCE_SWAP_MIN_WEIGHT` floor of 2; `omen` was not already in the drawn hand, so the swap varies the hand rather than shrinking it; `emit_omen` is `omen`'s only satisfying kind and it is live. The engine gap that forced the swap is real and still deserves an engine ticket — batch row 6 (`the_garrisons_price`) drew `thread` and hits the identical wall — but it is no longer this encounter's dependency. See § 8.4.

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
- **B8 · Nothing contradicts what is established.** One fight, one count, one missing body. The openings each fix their own hour and weather; the spine and every band avoid naming either, so no opening can be contradicted downstream. **No opening narrates the fight's course** — each describes what the ground shows, which is also what keeps the packet pole-agnostic (§ 8.3).

**C. Human realism**

- **C9 · Would a real person do this?** Yes, and the scene says why: nobody leaves ground like this without knowing who is on it. Counting the dead before moving on is what people do, and it is the only reason the agent is still standing here.
- **C10 · Do people react like people?** The other survivor sits apart with open hands and does not look at the ground — a person who has stopped being useful and knows it. The agent does not press for an account, and the scene never makes the survivor speak, which is exactly what makes the `critical_success` reveal land. *(No pronoun is used of the survivor anywhere, in prose or in this block — see § 8.3.)*
- **C11 · Do actions carry their true cost?** Turning over bodies costs a body's worth of strength (the energy Boost's whole premise), costs the faces afterwards (`success_at_cost`, with a real condition behind it), and costs a `grieving` condition and quintessence when the count will not close.

**D. The interactive layer**

- **D12 · The stake in one sentence.** *Does the agent get a true account of who died here — and pay for the looking — or does the count stay open and the missing one stay unaccounted for on the road ahead?* A good outcome: the account closes, and it says something worse and more useful than a wrong number. A bad outcome: the count never resolves, grief settles in, and the agent walks on carrying an arithmetic that does not work.
- **D13 · Is every card grounded?** Delete the ground, the dead, the survivor and the blade from the prose and every card is senseless here. Whisper acts on *this ground versus ground like it*; the common Boost on the agent's willingness to keep looking; the energy Boost on turning over *every* body rather than the easy ones; the Omen on whether this ground has a precedent; the Long Game on what the agent carries out of it; the trait card on whether the dead are people or a number.
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

> The road runs past a stand of thorn and a firepit kicked apart. Trampled ground leads off the track and into the open, where there is nothing to put your back against. It is cold enough to see breath. The air carries iron and wet horse. Crows have found the place and are working in from the edges.

**`ruin`**

> Half a wall still stands and the rest is floor plan — door sills opening onto nothing, a stair that ends in air. Ash and old mortar coat everything, and the fight has put fresh tracks through both. Sound carries oddly here; a stone turning over three rooms away arrives late. It smells of wet char.

**`battlefield`**

> This ground was fought over before and never cleaned up. Old iron comes up through the turf where the rain has worked at it, and the mounds are settled and grassed over. The new dead lie among them, still in their own shapes. Flies have already arrived. The wind comes across flat and does not stop.

**`stronghold`**

> The gate stands open with nobody on it. Inside, the yard is packed dirt and a horse trough gone still, and the walls throw the cold straight back down. Somewhere above, a door is banging in its frame and nobody is going up to stop it. The place smells of smoke that has already gone out.

### The setting-neutral spine (`step.narrativeTemplate`)

> The fighting stopped a while ago and nothing has moved since. The other survivor sits apart with open hands, not looking at the ground. The dead lie where they fell, and the count comes out one short. One place has everything a death leaves except the body: beaten ground, a dropped blade, nobody lying between them.

**Spine rules held:** no class scenery (no wall, no turf, no gate, no road); no `{...}` token, so the enrichment dry-run has nothing to resolve here; the survivor is introduced with no pronoun at all, so reuse can bind whoever is standing there.

### Seam checks — **eighteen seams, read one against the other**

The four seams the pipeline's guidance names are not the whole surface. **Every pair of
authored strings that can render on the same ending is a seam**, which includes an
afterimage against its band overview, a `narrativeTemplates` line against a band overview,
and two card fragments that can both be active on one band. Six echoes lived in those
unexamined seams and are fixed; the table below is the full audit so the next reader
inherits it.

| Seam | Check | Verdict |
|---|---|---|
| `initiation` → each opening | initiation owns *why nobody leaves yet*; the openings own the place. No shared image, no shared sentence shape. | clean |
| opening → spine (×4) | The openings close on crows / wet char / flat wind / dead smoke. The spine opens on time and stillness. No repeated noun, no repeated cadence. | clean |
| spine → bands | The spine's last image is *the empty place*. Only the two `near_miss` fragments reuse "one short", which is the phrase that band is about. | clean |
| spine ↔ `initiation` | Both mention the fight ending. The initiation carries only the obligation to count; the spine carries the count itself. | clean |
| across the four openings | Only one class ever renders, so this is not a seam. Each still opens on a different noun and closes on a different sense. | not a seam |
| `narrativeTemplates.success` ↔ `success` overview | **Was an echo** — both opened *"The account closes."* verbatim. The narrative line now opens on the dead being counted. | fixed |
| `success` afterimage ↔ `success` overview | **Was an echo** — *"one death here, and no body to bury"* against *"One death on this ground, and no body for it"*. The overview now speaks about the empty place instead of restating the number. | fixed |
| `critical_success` afterimage ↔ its overview | **Was an echo** — *"They read the whole ground…"* as the lead clause of both, plus `drag-marks` twice. The overview now opens on the account and calls them *marks nobody dragged*. | fixed |
| `critical_success` afterimage ↔ card 3 fragment | Both name the ground; different verbs, different objects, different shapes. | clean |
| card 2 ↔ card 6 fragments, `success_at_cost` | **Was an echo** — *"The count came out."* verbatim in both, and both can be active on one run. Card 6's fragment is rewritten. | fixed |
| `success_at_cost` afterimage ↔ its overview | **Was an echo** — *"turning over faces"* against *"turning over every face"*. Only the afterimage says "turning over" now. | fixed |
| `critical_failure` afterimage ↔ card 6 fragment | **Was an echo** — *"broke apart in their hands"* against *"went to pieces in their hands"*. The fragment now ends on the counting stopping, not on hands. | fixed |
| card 4 ↔ card 5 fragments, `success` | **Was an echo** — both opened *"The count closed, and…"*, and both can be active on one run. Card 5's fragment now opens on what they read. | fixed |
| `narrativeTemplates.failure` ↔ `failure` overview | Different subjects, different closers. | clean |
| `failure` afterimage ↔ `failure` overview | *"counted until the light went"* against *"never agrees with itself"*. No shared image. | clean |
| `critical_failure` afterimage ↔ its overview | *"broke apart"* against *"stops making sense under them"*. Different figures. | clean |
| `fallback.overview` ↔ every band overview | The fallback speaks about the record; every band speaks about its own ending. No overlap. | clean |
| chip `detail`s ↔ their band overviews | Each detail names the mechanic and the endpoints; each overview stays on the scene. No sentence appears in both. | clean |

### Encounter-level `narrativeTemplates`

- **`initiation`** — *The fight is over, and the road on does not start until the dead are accounted for. Nobody leaves ground like this without knowing who is on it.*
- **`success`** — *The dead are counted. What the count turns out to say is worse than a wrong number, and it is written down now.*
- **`failure`** — *The count will not close. The ground keeps its arithmetic to itself, and the road on starts with the question still open.*

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

**Dealt-hand size:** 6 authored, 1 hidden without the trait (`short.who_they_are`), so the dealt hand lands at 5–6.

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
- **bandProse:** `success` — *Laid against what such ground usually shows, the gap in this one was obvious.* · `near_miss` — *The comparison held from place to place and then stopped. The last one stayed a blank.*

> **Authoring note — no `reveals` field.** The Whisper type's only implemented reveal kind is `next_step_demand` (`NudgeRevealKind` is a union of one), and this is a **one-step** encounter, so declaring it would ship a lever that cannot fire (the live-layer trap). The card is a Whisper through its host system instead: the library's own type row names `Intelligence` as its `hostSystem`, and this card writes a real `intelligence` record.

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

> **Two Boosts, two questions.** *A Little More* buys the **will to keep looking**; *A Sudden Surge* buys the **completeness of the search**. A steady reader who stops at the easy bodies and an exhausted reader who turns over all of them fail differently, and the two `failure` fragments say which failure it was rather than asserting a difference.

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
- **effectLine:** *You give them the feeling this has happened before, so their hands know where to look before their eyes do. A faint help, and the days after bend toward what it turns up.*
- **fiction:** *Nothing happens only once.*
- **grants:**
  ```
  { kind: 'emit_omen', category: 'cultural', intensity: 0.30,
    narrativeHook: 'This has happened before in this country, and the people who remember it are counting again.',
    scope: { kind: 'global' }, sphereAlignment: 'time' }
  ```
  Deliberately about **recurrence**, so it is not the same omen as the one the `short.say_the_count` reaction emits (§ 7.3), which is about the telling starting. Two `emit_omen` sites in one encounter are only legitimate if they say different things.
- **bandProse:** `success` — *The count closed, and word of the place that held a death and no body will travel.* · `near_miss` — *The place felt like one they had stood in before. The count still stopped one short.*

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
- **effectLine:** *You set a mark on them nobody can see, so what they carry out of here finds them again further on. A slight help now; the mark is the part that lasts.*
- **fiction:** *What is buried keeps.*
- **grants:**
  ```
  { kind: 'hidden_mark', category: 'secret_knowledge', severity: 0.55,
    label: 'Knows what this ground did not give back',
    revealFamilies: ['encounter.border'] }
  ```
  `familyMatchesTemplate` prefix-matches, so `encounter.border` reveals on every template in this batch and every later one in the family. Live by construction, not by registry lookup.
- **bandProse:** `success` — *What they read here went under the skin where nobody will see it, and it will keep.* · `failure` — *The ground kept its answer. The mark stayed anyway, and it will find a road to surface on.*

> **Why no `libraryCardId` — recorded, not defaulted.** The library is *generated* from four tables, and `long_game` appears in none of the ones that would give it a usable member: it is not in `UNIVERSAL_CORE_TYPES` (`boost`, `insurance`, `mercy`, `trait_card`) and not in any entry of `SPHERE_SIGNATURES` (`darkness` signs `veil` and `undertow`). The library therefore holds exactly **one** `long_game` member, `card.long_game.hunger.sever` ("The Thread Cut"), and it is a *hunger unique*: sphere-less by construction and held only by a Sever god. Pointing this card at it would (a) dim the batch's one `long_game` for eleven of twelve hungers, which is the opposite of a debut, (b) misdescribe it — Sever's card **cuts** a tie, this one **plants** one — and (c) drop the hand from four distinct spheres to three, under `HAND_SPHERE_COVERAGE_MIN`, because darkness enters this hand through this card or not at all. So it ships as a one-off, which the brief permits as a choice.
>
> **The alternative considered and rejected:** a seventh card of a darkness-signed type (`card.veil.signature.darkness` / `card.undertow.signature.darkness` both exist with authored faces) would supply darkness *with* a library id and free this card to be common. The hand has room. It is rejected because `veil` and `undertow` are the allocated debuts of batch rows 2 and 3/4, and the batch design fixes this encounter's hand budget — *"A draft agent fills the spread; it does not renegotiate it."*
>
> **Follow-up for the library owner:** `long_game` has no core and no sphere signature member; a `card.long_game.signature.darkness` would be the natural home for exactly this face. Library membership is out of scope for this batch (brief § Out of scope), so it is recorded here rather than added.

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
- **bandProse:** `success_at_cost` — *They gave each of them a face before moving on, and got the count. Every one of those faces came back to them later.* · `critical_failure` — *They gave each of them a face, and then could not put a single one down, and stopped being able to count at all.*

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
| No two cards answer the same question | will-to-look / completeness / comparison / precedent / plant-for-later / character ✓ |
| `libraryCardId` set wherever a member matches | 5 of 6; the sixth recorded above ✓ |
| **Every library-matched face is the library's own** | **5 of 5, byte-for-byte.** `card.boost.core` → *A Little More* / *"Most things fail by a margin."* · `card.trait_card.core` → *Who They Are* / *"Character is the one resource nobody spends."* · `card.whisper.signature.light` → *Plain Sight* / *"Nothing was hidden. It was only unlit."* · `card.boost.signature.energy` → *A Sudden Surge* / *"Bodies hold more than they admit."* · `card.omen.signature.time` → *This Has Happened* / *"Nothing happens only once."* Each verified against `CARD_CONTENT` in `src/data/nudge-card-library.ts` ✓ |
| Every `imageTag` resolves | `generic.light`, `generic.focus`, `generic.vigor`, `generic.time-slow`, `generic.dark`, `generic.memory` — all rows in `ENCOUNTER_IMAGE_LIBRARY` ✓ |
| Every grant shape valid against the live unions | `IntelligenceCategory.military_position` ✓ · `OmenCategory.cultural` ✓ · `EmittedOmenScope { kind: 'global' }` ✓ · `HiddenMarkCategory.secret_knowledge` ✓ |

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
- **`SUCCESS_BANDS` includes `success_at_cost`**, so `failureMetadata` does **not** reach that band. That is why the grief condition is re-declared on the band's own reactions (§ 7.4) rather than assumed — see the wiring note there.
- **The grieving condition and the erosion fire together** on `failure` and `critical_failure`, so the failure-side endings may speak of both as fact (prose rule 7, production half).

### 7.2 The `quintessence_shift` — the batch's one, authored against the schema

Schema (`src/types/unifiedAction.ts`, the THR-1082 member): `{ kind: 'quintessence_shift'; delta: number; targetAgentId?: string; source?: string; when?: EffectPredicate }`. The effect queues a `QuintessenceEvent` onto `pendingQuintessenceEvents`; `phaseQuintessence` applies it next tick with its clamping, dissolution checks and loss-prevention intact. `delta` is designer data and never renders — the chip says the state moved and never how far.

**Two sites, both bands the fiction earns:**

| Site | Band(s) | `delta` | `source` | Why the fiction earns it |
|---|---|---|---|---|
| `failureMetadata.effects` | `failure`, `critical_failure` | `-0.06` | `one_body_short.count_that_will_not_close` | The cost is not the fight — the fight is over. The cost is standing on ground whose arithmetic does not work and being the person who could not make it work. **The body that is not there costs something that is not blood.** |
| Reaction `short.carry_it_alone` | any band, player-chosen | `-0.04` | `one_body_short.carried_alone` | The god lets them keep it. Nobody else hears the count, so nobody else carries it. |

`targetAgentId` omitted on both — it defaults to the acting agent, who is the person the count is happening to. No positive shift anywhere: the brief frames this as a **cost**, and a recovery on the success side would say the encounter was good for them.

**Not authored on the success side**, for two reasons. A clean reading is grim and *holds*: the agent got a true account, and eroding them for succeeding would make the shift a tax on playing well rather than a consequence of the fiction. And the failure side already carries a reach-coherent penalty — `trait.condition.grieving` is `{ heart: -0.08, eye: -0.05 }`, so the failed `eye` test leaves the agent worse at `eye`. The two costs describe the same loss from two directions.

**Chip:** only the `critical_failure` band chips the shift (§ 7.4). The reaction's shift is player-chosen and is not chipped — its result lives in the reaction's own resolution, which is the honest place for a consequence the player selected.

### 7.3 Aftermath reactions (on `fallback`, so every band offers the same fork)

Two stances about consequence, not two mechanical variants. Both are god actions on the scene, neither instructs the mortal. Post-swap they write genuinely different things — an omen against an erosion — rather than two flavours of the same attrition.

```
reactionPrompt: 'What does the god do with a count nobody else has heard?'

reactions: [
  {
    id:     'short.say_the_count',
    label:  'Let them say the count out loud',
    intent: 'The account goes into the record, and the country starts hearing that its dead are not staying put.',
    effects: [
      { kind: 'emit_omen', category: 'cultural', intensity: 0.35,
        narrativeHook: 'A death was counted on the border with no body under it, and the telling has started.',
        scope: { kind: 'global' } },
      { kind: 'recent_event', eventType: 'narrative',
        message: 'They said the count out loud, and what was missing from it went into the record.' },
    ],
  },
  {
    id:     'short.carry_it_alone',
    label:  'Let them carry the count alone',
    intent: 'Nobody else hears it, so nobody else has to carry it.',
    effects: [
      { kind: 'quintessence_shift', delta: -0.04, source: 'one_body_short.carried_alone' },
      { kind: 'recent_event', eventType: 'narrative',
        message: 'They kept the count to themselves and walked on with it.' },
    ],
  },
]
```

**What each stance preserves.** *Say the count* protects the world's honesty: the account goes into the record where other people can act on it, and the country gets an omen it did not have. *Carry it alone* protects the mortal's standing and the god's quiet: nobody argues, nobody has to be told, and the mortal spends themself instead. Neither is the safe one, and neither label promises one thing and delivers another (the critique-pass failure the exemplar records).

> **Where the `omen` family is wired, and why here.** The draw's `omen` (§ 0 question 9) is satisfied by this reaction's `emit_omen`, not by the Omen card's grant — `allAftermathEffects` walks variant reactions, band reactions and step metadata, and does **not** walk card `grants`, so the card could never have satisfied the family on its own. The reaction is also the honest home: the omen exists *because the count was spoken*, and picking the other stance correctly produces no omen.
>
> **Not chipped.** `emit_omen` is deliberately absent from `PERSISTENT_EFFECT_KINDS` and therefore from `CHIP_BACKING_EFFECT_KINDS` — the module classifies it as scene dressing. A chip over it would be rejected, and correctly. **Its words live in the reaction's `intent`**, which is the prose the player reads at the moment of choosing, and in the `narrativeHook` itself, which surfaces in the chronicle and feeds `{omen}` enrichment. They deliberately do **not** go into any band `overview`: an overview renders regardless of which stance the player takes, so an overview asserting that the telling started would be false on every run where the god chose silence.

### 7.4 `byOutcome` bands, overviews, and chips

`byOutcome` keys on the seven-value `UnifiedActionOutcome` — **not** the six-value per-step `StepOutcome` the fragments use. Five bands authored; the floor is three.

**Every chip declares `concepts`, and every concept is anchored by `entityId`.** The Composition Contract requires a non-empty `concepts` list on every change; `chipAnchorViolations` accepts either an `entityId` or a resolving `tooltipId` on a declared ref. No chip in this encounter declares a `tooltipId`, because none of the concepts it names has one: `resolveTooltip` routes `ui`, `sphere`, `reach`, `terrain`, `archetype`, `faction`, `doom`, `agent`, `quintessence`, `attachment` and `location`, and there is **no `secret.*` prefix**. Registering one is a code change outside this batch — recorded in § 8.4 as a corpus-wide ask, not worked around with an id that resolves to the wrong concept.

**`fallback.overview`** (renders on `contested_won` / `contested_lost` and any band that does not override it):

> The ground is counted and the count is written down. What is missing from it is missing from every account after this one.

**`fallback.changes`: `[]`.** Deliberately empty: no write fires on *every* band, and a chip in `fallback` renders on bands that do not override it. Law 56 rule 0 binds per chip.

---

**`critical_success`**

> overview: The account closes on one death and no body for it, and on a set of marks leading off the place that nobody dragged. Whoever went down here got up and walked out. `{cast:survivor}` watched it happen and has not mentioned it since.

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
  concepts: [{ text: 'a secret', entityId: '$target', visualKind: 'agent' }],
}
```
*Backed by:* `secret_discovery` on `successMetadata` — a real `knows_secret_of` edge, actor → target. **Anchored on `$target`**, because `secret_discovery` itself reads `action.targetId` and carries no `targetAgentId` override, so the chip points at the exact endpoint the write used (rule 0c). `stateNoun` names the mechanic (`a secret held`), `detail` names the endpoints, the fiction goes last. The `concepts` entry names the substring `a secret` and anchors the same person.

---

**`success`**

> overview: The account closes. The place where the missing one went down is as plain as the places that still have somebody lying in them, and it is empty.

changes: the same `short.the_unsaid` chip, minus the `causeClause` (they got the answer without the drag-marks), and with `detail`: *They now hold a secret about {target}: what was not said about the body that is not here.* Same `stateNoun`, same `concepts`, backed by the same `secret_discovery` write.

---

**`success_at_cost`**

> overview: The count is right. Getting it right meant looking at each of them long enough to be sure, one after another, and that is not work anybody puts down at the end of it.

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
  concepts: [{ text: 'grieving', entityId: 'trait.condition.grieving', visualKind: 'attachment' }],
}
```

reactions (this band re-declares both stances, each carrying the condition):
```
[
  { id: 'short.say_the_count',
    label: 'Let them say the count out loud',
    intent: 'The account goes into the record, and the country starts hearing that its dead are not staying put.',
    effects: [
      { kind: 'condition_attachment', templateId: 'trait.condition.grieving' },
      { kind: 'emit_omen', category: 'cultural', intensity: 0.35,
        narrativeHook: 'A death was counted on the border with no body under it, and the telling has started.',
        scope: { kind: 'global' } },
      { kind: 'recent_event', eventType: 'narrative',
        message: 'They said the count out loud, and what was missing from it went into the record.' },
    ] },
  { id: 'short.carry_it_alone',
    label: 'Let them carry the count alone',
    intent: 'Nobody else hears it, so nobody else has to carry it.',
    effects: [
      { kind: 'condition_attachment', templateId: 'trait.condition.grieving' },
      { kind: 'quintessence_shift', delta: -0.04, source: 'one_body_short.carried_alone' },
      { kind: 'recent_event', eventType: 'narrative',
        message: 'They kept the count to themselves and walked on with it.' },
    ] },
]
```

> **Why the band re-declares its reactions — a Law 56 fix, not a flourish.** `success_at_cost` is a member of `SUCCESS_BANDS`, so `stepWritesReachFace` routes `successMetadata` and not `failureMetadata` to this face: the grieving condition on `failureMetadata` **cannot fire here**. As first drafted this chip claimed a condition nothing applied — a Law 56 rule-0 violation that the machine gate would have passed, because `chipBackingViolations` is a floor rather than a semantic match and this face already performs two qualifying writes (`secret_discovery` and the `rewardPool` draw). The fix is the band's own reactions. `applyAftermathOutcomeBand` substitutes rather than merges (`reactions: band.reactions ?? variant.reactions`), so **both** stances must be re-declared, and **both** carry the condition — the condition therefore lands on every path through the band and the chip is true whichever stance the player takes. Backing is `reactionBackingForFace`; `condition_attachment` is in `PERSISTENT_EFFECT_KINDS`.
>
> Two rejected alternatives, recorded so they are not re-proposed. Moving the condition to `successMetadata.effects` would grieve the agent on `critical_success`, `success` and `near_miss` as well — the "tax on playing well" § 7.2 argues against. Gating it with a predicate is impossible: `EffectPredicate` has no outcome-band member.

---

**`failure`**

> overview: The count never agrees with itself. They walk off the ground holding a number that is wrong by one and cannot say which one, and there is nobody left here to ask.

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
  concepts: [{ text: 'grieving', entityId: 'trait.condition.grieving', visualKind: 'attachment' }],
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
    id: 'short.grief_without_a_grave',   // same chip as `failure`, concepts included
    …as above…
  },
  {
    id: 'short.something_gave',
    kind: 'shell_state',
    category: 'scar',
    direction: 'loss',
    title: 'Worn through',
    stateNoun: { text: 'quintessence', entityId: '$actor', visualKind: 'agent' },
    detail: 'Counting ground that would not stay counted wore at their quintessence.',
    polarity: 'loss',
    causeClause: 'Three passes over the same ground and three different numbers',
    concepts: [{ text: 'quintessence', entityId: '$actor', visualKind: 'agent' }],
  },
]
```
*Backed by:* `quintessence_shift` (−0.06) on `failureMetadata` ✓ — `quintessence_shift` is a member of `CHIP_BACKING_EFFECT_KINDS`. Anchored on `$actor` — the bearer of the stat, per the anchor catalog's Stats row. Reports **no quantity**: the chip says the state moved and the reader can look it up on the agent's own sheet (`AgentDetailPanel` renders quintessence), which is what Law 13 parity requires. **No `reputation_tally` chip anywhere in this encounter** (rule 0d — `check:encounter` fails one).

> **One recorded limitation, not papered over.** The anchor catalog's Stats row asks a quintessence chip for *"`tooltipId` for the sphere, plus the bearer's `entityId`"*. The bearer half is declared. The stat half has no author-writable id: `quintessence.*` resolves only the six band-keyed labels in `BAND_TOOLTIP` (transcendent … dissolving), and an authored chip cannot know which band the agent will be in. Half an anchor honestly beats a whole one that lies, so no `tooltipId` is declared.

### 7.5 Aftermath audit

| Contract row | Check |
|---|---|
| `aftermathConfig` present | ✓ |
| `byOutcome` floor: ≥3 bands, one success-side, one failure-side, one extreme | 5 bands; `critical_success`, `critical_failure` and `success_at_cost` are all extremes ✓ |
| Every variant carries an `overview` | fallback + 5 bands ✓ |
| Every change declares `concepts` | **5 of 5** ✓ (was 1 of 5 in the draft) |
| Every declared anchor classifies | `$target` ✓ · `$actor` ✓ · `trait.condition.grieving` → `attachment_template` (in `CONDITION_TRAIT_DEFINITIONS`, therefore in `ATTACHMENT_TEMPLATE_SOURCES`) ✓ |
| No dangling `tooltipId` | none declared ✓ |
| Every chip backed by a write **on that band** | **5 of 5** ✓ (`success_at_cost` resolved via band reactions) |
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

Everything else in the prose is **scene-local invention** with no life outside this encounter (the firepit, the banging door, the dropped blade, the empty place) or a **read through a sanctioned surface** (the trait gate, the cast binding, the reward draw). The `critical_success` reveal is the third case and the legitimate one: it looks like invented state and is not, because the encounter's own `secret_discovery` mints the `knows_secret_of` edge and the prose narrates the fact only after the mechanics produce it — the production half of prose rule 7.

### 8.3 What this encounter may **not** assume — the pole-agnostic contract

The parent is a `Personality Fork` on `mercy_ruthlessness`, resolved by the *mortal* through `branchOnStep: 0`. Its poles are *hold the road and let them past behind you* versus *break the pursuit before it arrives*. **This packet does not know which pole was taken, and nothing in it depends on knowing.**

| Forbidden | Why | What is written instead |
|---|---|---|
| "the one you saved" / "the pursuit you broke" | Names a pole | "the other survivor" |
| "the road you held" | Names a pole and a place | The ground is described by what it *is* at each class |
| Any claim about who started the fight or who won it | Both poles end with dead on the ground; neither is a victory the prose can assert | "The fighting stopped a while ago" |
| **Any claim about the fight's course** | The two inherited facts carry the fight's *end*, not its shape. The draft's `wayside` opening said *"The fight went off the track and into the open"*, which the parent's own prose could contradict — **corrected in this revision** | *"Trampled ground leads off the track and into the open"* — the ground shows it, nobody narrates it |
| Any pronoun for the survivor | Reuse binds whoever is standing there — and the inherited binding could be either of the parent's two named roles | *"The other survivor sits apart with open hands"* — no pronoun at all, anywhere in the encounter, including this design block |
| That the agent was present for the fight | True under the seeded route, false under a bare `?spawn=` review firing | The **ground** testifies, not the agent's memory: *"One place has everything a death leaves except the body"* |

**The role noun `the other survivor` is the load-bearing choice.** It is true under both poles (the one who could not fight, or the one who stood), true whether the agent fought or arrived after, and true when the binding does not inherit and this template spawns its own.

**Verified line by line in this revision.** Every player-facing string — four openings, the spine, three `narrativeTemplates`, five afterimages, twelve fragments, six overviews, five `details`, two reaction labels and intents, six card faces — was read against both poles and against a bare `?spawn=` firing with no parent. After the `wayside` correction, no line names a pole, assumes the agent's presence at the fight, or gives the survivor a pronoun.

### 8.4 Cross-draft and cross-corpus wiring — **two dependencies, one ask**

**(a) The cast key must be `survivor`.** This packet declares `supportBundle` with `key: 'survivor'`. `encounter.border.standing_the_line` must bind the crossing person under the **same key** for the inherited binding to line up. If it does not, this template's own spec materializes a fresh person and the scene still reads — a declared key always resolves (THR-696) — but the sequel callback loses its point. **Reconcile with row 4's draft before compile.**

**(b) `secret_discovery` reads `action.targetId`, which must be an actor — under *both* firing routes.** The effect has no `targetAgentId` override: `encounterAftermath.ts` reads `action?.targetId`, and `createSecretEdge` refuses an endpoint that is not an actor node, tracing the refusal. Two consequences, and the second is wider than the draft recorded:

- **Under `inheritContext`** the target is copied from the parent, so **the parent must target the crossing person, not the location.** If row 4 targets a place, this encounter's `secret` family is wired at the gate and inert at runtime — the exact rot Law 56 exists to stop. **Reconcile with row 4's draft before compile;** if the parent must target a location, the `secret` family here has to move to `hidden_mark` (which takes `targetAgentId`) and the swap recorded. *Note the swap budget is already spent on `thread` → `omen`, so a second change here is a design escalation, not another swap.*
- **Under a bare `?spawn=` review firing** there is no parent to supply a target, and `?spawn=` stages the template on `@hero`. If `targetId` resolves to the acting agent or to a location, `secret_discovery` refuses and traces, and the `$target` anchor on `short.the_unsaid` resolves to the wrong node or to nothing. This is a runtime-feasibility question rather than a prose one — **flagged for Pass 3**, which owns it. The prose is unaffected either way, because no line depends on the secret having been written.

**(c) A `secret.*` tooltip concept does not exist and would serve the whole corpus.** Four consequence families — `secret`, `knowledge`, `story_seed`, `drive` — have no tooltip prefix, so every chip about them must anchor by entity and leave its concept unexplained (§ 7.4). A small addition to `ui-content.ts` would close it. Not this batch's work; recorded as a corpus-wide ask.

**(d) The thread-effect engine gap — no longer this encounter's dependency, still worth a ticket.** `bindAftermathSceneTargets`'s `SCENE_SENTINEL_FIELDS` map (`src/engine/encounterAftermath.ts`) carries `targetAgentId`, `withAgentId`, `counterpartyId`, `debtorAgentId`, `targetFactionId`, `factionId`, `targetSublocationId`, `targetLocationId` — and **not** `ascendantId`, `mortalId`, `sourceMortalId`, or `newMortalId`. The four thread-mutation effects read their ids raw off the effect (`state.graph.getOutgoingEdges(effect.ascendantId, 'thread')`), so an authored sentinel passes through as a literal string and the effect no-ops with a `thread_mutation_skipped` / `edge_missing` trace — while `check:encounter` stays green, because it checks kind presence. There is no `$ascendant` token in the build at all. The one authoring example in the repo (`src/data/encounters/examples/example.thread_bond_tested.ts`) writes `ascendantId: 'self', mortalId: 'actor'` and is explicitly `@ts-ignore`d as "not a real game encounter".

This encounter took the sanctioned `consequenceSwap` off `thread` (§ 0 question 9) rather than authoring a dead effect, so nothing here rides the gap. **Batch row 6 (`the_garrisons_price`) also drew `thread`**, so the batch should still file the engine ticket: widen `SCENE_SENTINEL_FIELDS` to cover the four thread-effect id fields, registering `mortalId` / `sourceMortalId` / `newMortalId` as `'agent'`, and introduce an `$ascendant` sentinel resolving to the ascendant on the acting mortal's thread edge. Label `Deferral`, project = the batch's project. **This packet compiles without it.**

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

**Class-honesty across all four declared classes**, verified against `SUBTYPE_TO_ROSTER_KEY` (`src/engine/npcSeeding.ts`) and `LOCATION_ROLE_ROSTERS` (`src/types/npc.ts`):

| Class | Subtypes | Roster key | Reusable roles present |
|---|---|---|---|
| `wayside` | `camp`, `oasis`, `wilderness` | `military_outpost` (camp) · `wilderness` · `oasis` unmapped | `mercenary`, `scout` · `ranger`, `wanderer` |
| `stronghold` | `castle`, `fort` | `capital` (castle) · `military_outpost` (fort) | `mercenary` (0.6) · `mercenary`, `scout` |
| `ruin` | `ruins`, `ruined_tower`, `ruined_city`, `ruined_village`, `unexplored_poi` | **none** — `ruin` maps to `null` | — (spawn path) |
| `battlefield` | `battleground` | **none** — unmapped, seeds no NPCs | — (spawn path) |

Reuse is opportunistic and covers `wayside` + `stronghold`; `ruin` and `battlefield` seed nobody, so the spawn path is the normal one there and `spawnNpcRole: 'mercenary'` reads correctly at all four — somebody who was in the fight and is still standing. `oasis` is also unmapped and falls to the spawn path. `spawnName` is a real name, not a role phrase, because a declared key always resolves and this string is what `{cast:survivor}` renders whenever no live NPC was reused. **The prose never genders the survivor**, at any class, on any band — the whole encounter is written without a pronoun for them, which is doubly required here because the binding is inherited from another draft.

`{cast:survivor}` is used **twice**, both times where the name earns something: the `critical_success` reveal and the `critical_failure` rescue. Everywhere else the role noun carries it — ruling 6's default register.

**Other world objects:** the dead (scenery, no bindings — they are the count, not cast); the dropped blade (scene-local, and the object the reward draw stands in for); `trait.condition.grieving`; `trait.core.core_warmth.virtue`; the `knows_secret_of` edge; the hidden mark; the intelligence record; the two emitted omens.

---

## 10. Support bundle contract

| Support object | Delivery | Source | Persistence | Future references | Status |
|---|---|---|---|---|---|
| `survivor` (actor) | lazy-materialize-on-trigger, or inherited | parent's `supportBindings` → roster reuse → spawn | **must-persist** | `{cast:survivor}` on 2 bands; `$target` anchor on the secret chip | built (spec authored here) |
| `trait.core.core_warmth.virtue` | pre-seeded | `core-trait-content.ts` (Core continuum `core_warmth`) | must-persist | trait gate, variant, trait card | live |
| `trait.condition.grieving` | on-trigger | `condition-trait-content.ts` | duration-bounded | 3 chips across 3 bands; `attachment_template` anchor | live |
| Possession draw | on-trigger | `rewardPool` over `possession` | must-persist | PRIZE chip (engine-rendered) | live |
| Hidden mark `secret_knowledge` | on-trigger (card grant) | `hidden_mark` effect | decays after grace | reveals on `encounter.border` | live |
| Intelligence record `military_position` | on-trigger (card grant) | `intelligence` effect | must-persist | future intel reads | live |
| Cultural omen — recurrence | on-trigger (card grant) | `emit_omen` effect | `durationTicks` default | draw bias, chronicle, `{omen}` enrichment | live |
| Cultural omen — the telling | on-trigger (reaction) | `emit_omen` effect | `durationTicks` default | satisfies the `omen` consequence family | live |
| `knows_secret_of` edge | on-trigger | `secret_discovery` | must-persist | secret chip; leverage readers | **needs § 8.4(b) reconciliation** |

No blocked primitives remain: the thread row is gone with the family, and § 8.4(b) is a target-binding reconciliation with row 4 rather than a missing engine capability.

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

All six resolve to real rows in `ENCOUNTER_IMAGE_LIBRARY` (`NUDGE_CONCEPT_ART`), and each row's subject above is quoted from the library's own comment rather than assumed. None falls through to the `nudge` category generic (`generic.blessing`), which is the silent-fallback failure this check exists to catch.

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

## 13. Detector self-scan (corrected against the code, not the spec page)

**Read the field classes off `nudgeAuditDetectors.ts`, not off the spec's table.** The two disagree and the spec rules that the code wins. The classifications that matter here, and that the draft's scan had backwards:

- **`overview` is `scene` class** (`pushAftermathVariant` pushes `body.overview` as `'scene'`), so natural indefinites are *not* enforced in a band overview.
- **`change.detail` is `outcome` class** (`push(change.detail, 'outcome')`), so it is enforced at the strictest bar.
- Band fragments, all five afterimages and `narrativeTemplates.success`/`.failure` are `outcome`.
- `name`, `effectLine`, factor lines, purpose lines, `change.title`, `reaction.label` and `reaction.intent` are `interactive`. `fiction`, `initiation` and the step narrative are `scene`.

| Detector | Result |
|---|---|
| **Evasive vagueness** (`somehow`, `seems to`, `something`, `the situation`, `the moment`, `the tension`, …) — every field class, target zero | **0.** Scanned all four openings, the spine, three `narrativeTemplates`, five afterimages, six `fictions`, six `effectLines`, twelve fragments, six overviews, five `details`, five `titles`, two labels and two intents. |
| **Natural indefinites** (`someone`, `somewhere`, `things`, `way`, `nothing`, `anything`, `whatever`, …) — **`outcome` class only** | **0 after two fixes.** The draft carried two: `way` in the Whisper's `near_miss` fragment (*"held all the way to the last place"*) and `thing` in `short.something_gave`'s `detail` (*"Counting a thing that would not stay counted"*). Both are `outcome` class and both are rewritten. Occurrences that remain are all in `scene` class and are ordinary English: `nobody` variants in three openings and the spine, `nothing` in the `ruin` opening and two card `fiction` quotes, and `anybody` in the `success_at_cost` overview. |
| **Intensifiers** (`very`, `really`, `deeply`, `rather`, …) — warn only | **0.** The draft's one *"rather than"* (in the `failure` overview) is gone with that rewrite. |
| **Annotation clauses** (`notButClause`, `emDashNot`) — ≤1 across the encounter | **0.** No "not … but" inside any sentence; no em-dash followed by a negation. The two em-dashes in the packet's prose (`ruin` opening, and none in outcome prose after the `success`-overview rewrite) are followed by noun phrases. |
| **Divine outcome-authorship** (`DIVINE_DECISION_PATTERNS`) — zero, every class | **0.** No decision verb followed by `whether`/`what`/`which`/`who`/`if` and a clause anywhere. The two reaction labels are god acts ("Let them say the count out loud" / "Let them carry the count alone") — the god choosing its own action, which is the passing side of the rule. |
| **Digits or `%` in an `effectLine`** | **0** across six cards. |
| **Abstraction-as-subject** (hand check) | Grammatical subjects across the openings and spine: *the road, trampled ground, it, the air, crows, half a wall, ash, sound, this ground, old iron, the new dead, flies, the wind, the gate, the yard, the walls, a door, the place, the fighting, the other survivor, the dead, the count, one place.* Two abstractions in the subject slot (`the count`, `the fighting`), both the literal thing the scene is about rather than mood narration. The rewrites added none. Clean. |
| **The three plainness moves** | (1) **Subject first** — no sentence in the packet opens on a fragment. The `success` overview did (*"One death on this ground, and no body for it — …"*) and is rewritten. (2) **Abstract nouns swapped** — *"the knowing of it"* → *"What they read here"*; *"They felt the weight of it settle"* → *"The place felt like one they had stood in before"*; *"a thing to carry rather than a thing to solve"* → *"there is nobody left here to ask"*; *"Counting a thing that would not stay counted"* → *"Counting ground that would not stay counted"*. (3) **One dry line per beat** — three dry closers in the packet (*"Every one of those faces came back to them later."*, *"The looking stayed."*, *"The ground keeps its arithmetic to itself"*), none stacked on the same beat. |
| **Density (move 4)** | One named person on stage (`survivor`). No third party who mentions a fourth. Props the player can act on only: the ground, the dead, the blade, the empty place. No letters, no errands, no backstory. |
| **Seam echoes** (not a machine detector — read by hand) | **Six found in the draft, six fixed.** Full eighteen-seam audit in § 2. |
| **Word budgets** | Openings 56–58 · spine 57 · band bases within 60 · fragments 12–24 (cap 25) · `fiction` 5–8 (cap 30) · `name` 2–3 (cap 6) · factor line 10 (cap 12) · `purposeLine` 3 (cap 4). All inside budget. |

---

## 14. Self-audit against the Composition Contract

| Block | Verdict |
|---|---|
| **Steps** | 1 plain step, `eye`, `difficulty: 0.40`, `narrativeTemplate` present ✓ |
| **Hand** | 6 cards on the one nudge-bearing step; full `checkNudgeHand` audit in § 4 ✓ |
| **Setting** | 4 classes declared, 4 openings written, `locationSubtypes` derived ✓ |
| **Cast** | 1 actor binding, class-honest at all four classes (verified against the rosters); both `{cast:survivor}` tokens name the declared key ✓ |
| **Rewards** | `rewardPool` draw + `condition_attachment` + `secret_discovery` — three persistent routes ✓ |
| **Aftermath** | `aftermathConfig` present, 5 `byOutcome` bands (floor 3), every variant has an `overview`, **every change declares `concepts`**, **every chip backed on its own band** ✓ |
| **Systems** | 3 from the authored manifest (`cast`, `rewards`, `conditions`) ✓ |
| **Images** | 6 of 6 card tags resolve to real library rows; no `illustrationUrl` declared ✓ |
| **Consequence draw** | `['secret', 'omen']` with one recorded swap; `secret_discovery` and `emit_omen` both authored in the aftermath walk ✓ |
| **A one-step encounter owes the full contract (ruling 3)** | Every block above is present. No exemption claimed, none requested ✓ |
| **`RETROFIT_PENDING`** | Not listed and must never be — new content never starts on the ratchet ✓ |

**Open surface, honestly counted.** The draft reported two ⚠ items; the real count was eleven, and all eleven are closed in this revision. What remains open is **one cross-draft reconciliation** — § 8.4(a)/(b), the cast key and the target binding, both owned by row 4 — plus **two recorded asks that do not block compile**: the `secret.*` tooltip concept (§ 8.4c) and the thread-effect engine ticket that batch row 6 still needs (§ 8.4d). Nothing else is deferred.

---

## 15. Experience Differentiator Gate (14 answers)

**Scene & prose**

1. **Does the opening place the player inside a moment already in motion?** **YES.** Every opening arrives after the event: a firepit already kicked apart, tracks already through the ash, flies already arrived, a door already banging with nobody going up to it. The player is never briefed; they walk in late.
2. **Does the prose have its own voice — cadence, rhythm, sentence variety?** **YES.** Short declaratives against longer ones, three dry closers and no more, and a deliberate flatness that is the scene's texture rather than the absence of one. No lyric image anywhere: grim here is plain and concrete, as § 0 declares.
3. **Does the scene name the elements that later become choices?** **YES.** The ground, the dead, the survivor, the dropped blade, the empty place — all in the spine, all acted on by cards, chips, or the reward draw.
4. **Would a reader feel something from the prose alone?** **YES.** The last sentence of the spine is the whole encounter with no mechanics attached: *One place has everything a death leaves except the body.*
4b. **No seam echoes?** **YES.** Eighteen seams read one against the other in § 2; six echoes found in the draft and all six rewritten.

**Choices & intervention**

5. **Does every card state mechanism, with a generic 2–4 word title, one flavor quote, and zero scene-bespoke prose on the face?** **YES.** Six faces, all library-generic, all passing the three-unrelated-encounters test in § 11 — and five of the six are their library members' own authored faces verbatim. The scene's account of each card lives only in its band fragments.
6. **Is every card's price real and legible?** **YES.** Five cost essence (1–2); the sixth costs 0 and is priced by being Warm. No free non-trait card.
7. **Does every card pay off in failure?** **YES** — six cards, six failure-band fragments, checked in § 4. No card reaches `NUDGE_BIG_DELTA`, so no card owes both bands.
8. **Is the hand grounded?** **YES.** Delete the ground, the dead, the survivor and the blade and every card is senseless here.
9. **Do the cards answer different questions?** **YES.** Will-to-look · completeness-of-search · comparison-against-known-ground · precedent · planting-for-later · seeing-people-not-numbers. The two Boosts are the only near pair, and their two `failure` fragments demonstrate the difference rather than asserting it.
9b. **Full authored hand on every nudge-bearing step, and does no step ask the player to pick a branch or an ending?** **YES.** One step, one full hand of six. **No `authoredChoices` anywhere.** The only fork is the god's own aftermath stance, which is the god choosing its act, not the mortal's ending.

**Aftermath & consequence**

10. **Does the aftermath have its own prose?** **YES.** A `fallback` overview plus five band overviews, each saying only what it alone can say.
11. **Are consequence outcomes actor-centered?** **YES.** `{cast:survivor}` is named on two bands; the secret chip names both endpoints; the grief chip names the person carrying it. No anonymous stat deltas, and no quantity the player cannot look up.
12. **Reaction choices for medium+ scale?** **YES** — offered anyway at short scale, because the `omen` consequence needs a stance to hang on. Two, on `fallback`, so every band carries them; `success_at_cost` re-declares both so its own consequence can fire.
13. **Do the reactions represent different philosophical stances about consequence?** **YES.** *Let them say the count out loud* puts the truth into the world and gives the country an omen it did not have. *Let them carry the count alone* keeps it quiet and spends the mortal instead. Neither is the safe one, and post-swap they write genuinely different kinds of thing.
14. **Does the concept art use the two-question method — residue, not illustration?** **YES.** The plate is a row of covered dead with one flat empty cloak in the gap and a blade set point-first beside it. No fight, no faces, no people. It shows what is missing, which is what the encounter is about.

**All 14 YES.**

---

## 16. What Pass 3 should attack first

1. **§ 8.4(a) and (b)** — the cast key and the target binding, both to be reconciled with row 4's draft before either compiles. (b) additionally needs a runtime answer for the bare `?spawn=` route, which is Pass 3's lane: what `action.targetId` resolves to when the template is staged on `@hero` with no parent, and whether `secret_discovery` and the `$target` anchor survive it.
2. **The `success_at_cost` band's re-declared reactions** (§ 7.4) — the substitution semantics of `applyAftermathOutcomeBand` are the load-bearing assumption. Confirm both stances render on that band and that `condition_attachment` fires on either pick.
3. **The two `emit_omen` sites** (§ 4 card 4, § 7.3) — confirm they read as two different omens at runtime and that the reaction's satisfies `checkConsequenceDraw`'s `omen` family. The card grant deliberately does not, and must not be relied on.
4. **The `long_game` one-off** (§ 4 card 5) — no `libraryCardId` is intentional and argued; confirm nothing in the compile path requires one.
