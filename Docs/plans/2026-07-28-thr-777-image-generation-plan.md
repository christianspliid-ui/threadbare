> **title:** `Encounter image library — manifest, resolver, generation worklist — THR-777`
> **linear_issue:** THR-777
> **author:** Claude Code
> **created:** 2026-07-28
> **three_pillars:** Engine `done — manifest + resolver as static data modules` · Content `done — tag vocabulary + 31 registered rows + 94-slot worklist` · UI `done — NudgePhaseShell art lookup`

# Encounter image library — THR-777 (Nudge Model WS4)

The nudge encounters have had an `imageTag` field since WS0 and a UI that reads it since WS2, but nothing in between: this builds the manifest that turns a tag into a picture, and the worklist that says which pictures still have to be made.

## Why this is load-bearing

WS0 put `imageTag` on every `StepNudge`. WS1's authoring spec tells encounter authors to pick tags "from the manifest vocabulary". WS2's `NudgePhaseShell` carries a comment saying the manifest lookup "is WS4; until that lands the chain ends at the EntityVisual gradient+glyph". Three workstreams shipped against a vocabulary that did not exist — authors had no list to pick from, and every tag they wrote resolved to nothing.

WS5 (THR-778) is the content migration that rewrites the encounter corpus to the nudge model. It cannot start writing `imageTag` values until there is a vocabulary to write, and it must not start generating art ad hoc per encounter — that is precisely how you end up with 531 bespoke images instead of ~125 reusable ones. This slice is the thing standing between WS5 and either of those failure modes.

## What shipped in this slice

Per the ticket's own coordination block — *"Suggested model: sonnet (generation runs) **after an opus manifest-design slice**"* — this run is the manifest-design slice. Image generation is batched work for subsequent runs, driven by the worklist below.

| Piece | File |
|---|---|
| Manifest + tag vocabulary + generation worklist | `src/data/encounter-image-library.ts` |
| Resolve chain | `src/data/encounterImageResolver.ts` |
| UI wiring (nudge card art) | `src/components/Game/encounter-stage/shells/NudgePhaseShell.tsx` |
| Integrity gate | `scripts/check-image-library.ts` (`npm run check:image-library`) |
| Contract tests | `src/data/__tests__/encounterImageResolver.test.ts` |

## Engine pillar

No tick-loop participation — this is static data plus a pure lookup. `resolveEncounterImage` is synchronous, allocation-light, and called at modal-open frequency.

### Two tables, deliberately

`ENCOUNTER_IMAGE_LIBRARY` holds only rows whose art exists on disk; `ENCOUNTER_IMAGE_PLAN` holds slots that do not have art yet. The split is what makes the ticket's *"batched and resumable, no orphan files"* requirement mechanical instead of a promise:

- A planned slot **cannot** resolve to a broken `<img>`, because it carries no path.
- A shipped image **cannot** sit unregistered, because `check:image-library` sweeps both directions and fails if an id appears in both tables (art shipped, worklist entry not deleted — the next batch would redo it).

### The resolve chain

```
specific art → exact tag → tag query → category generic → null
```

`null` is the success case for "no art": the caller renders `EntityVisual`'s gradient+glyph tile. Missing art can never block a render (NFP #4).

Encounter-specific rows (`genericity: null`) are excluded from the tag query and reachable only by exact tag. Without that exclusion, art made for *The Silent Chamber* would get dealt out to any unrelated encounter that happened to share the concept word "secret" — the single most likely way for a shared library to start looking wrong.

The query bar (`IMAGE_MATCH_MIN_SCORE = 10`) is set so that one concept agreement clears it and a bare sphere+place coincidence (6) does not. That is the line between "an image about this" and "an image that shares a label".

## Content pillar

### Fate art keys off the outcome ladder, not the forecast

**The ticket said "8 Reaches × 5 bands = 40 images". It is 6 bands, so 48 slots.** The five-valued axis in this system is the *forecast* (`doomed` / `perilous` / `uncertain` / `favorable` / `fated`), shown **before** the roll. The resolved outcome ladder `StepOutcome` has six bands. The user verdict this set exists to serve — *"a failed Iron encounter must not look like a failed Gold one"* — is about what the player sees **after** fate picks, so the key is `ReachDomain × StepOutcome`.

`bands` is a list rather than a single value, so a taste pass can point one image at several bands (collapsing, say, `success_at_cost` and `near_miss`) without a schema change. The final count stays a tuning decision rather than a structural one.

### Target count is ~125, not the ticket's ~156

Promoting art that already ships absorbed a large part of the estimate:

| Category | Ticket estimate | Actual | Why |
|---|---|---|---|
| Fate | 40 | 48 planned | Six outcome bands, not five (above) |
| Scene | ~60 | 12 registered + 14 planned | The 12 terrain plates in `public/concept-art/` already read as place-not-event and cover the outdoor half; only the built/social places need generating |
| Nudge | ~40 | 16 planned | 12 spheres × 2 variants over-counts — the concept axis is what authors actually write (`generic.focus`, `generic.oath`), and sphere is a refinement on it |
| Portrait | ~16 | 16 planned | Unchanged |
| Hero (branching) | 19 exist | 19 registered | Registered by tag, unchanged on disk |

The ticket's asset paths were stale: `Design/mockups/assets/` does not exist in the repo, and the 19 hero images live at `public/concept-art/encounters/`, not `public/assets/encounters`. The 5 thread-weave fate images and 7 `lib-*.png` nudge images the ticket describes as "already made" are **not in the repo** — they are presumably local mockup files. They are therefore planned as slots rather than registered as rows; if the originals surface, promoting them is a manifest edit and a file copy, and the batch-1 count drops accordingly.

### Generation worklist

Batches ship in ascending order, one PR each. All generation via the mcp-image MCP per `STYLE.md` (Simonetti oil, chiaroscuro, deep twilight). **Image doctrine (settled): agents mostly absent; when present, generic or silhouetted. Fate images contain no agent at all.**

| Batch | Slots | Contents | Why this order | Status |
|---|---|---|---|---|
| 1 | 49 | 48 fate (8 Reaches × 6 bands) + the baseline traveler portrait | Fate art is what every encounter ends on — highest reuse per image in the whole library | **Shipped 2026-07-28** |
| 2 | 16 | Nudge concept generics | Unblocks the hand, the surface the player reads most often | **Shipped 2026-07-28** (THR-832) |
| 3 | 14 | Built/social scene generics | Terrain already covers outdoors; these finish the place vocabulary | **Shipped 2026-07-28** (THR-832) |
| 4 | 15 | Remaining archetype portraits | Lowest reuse; the traveler baseline is now their category generic, so they degrade to a real image rather than a gradient | Planned |
| 5 | 3 | Situational nudge generics (`generic.crowd` / `generic.mercy` / `generic.blade`) | The Meet-The-First library authored this trio across all 424 of its nudges before any of them existed, so the game's *opening* beat rendered one plate throughout | **Shipped 2026-08-19** (THR-1170) |

### Batch 1 — what shipped (2026-07-28)

48 fate images at `public/concept-art/fate/<reach>-<band>.jpg` and the traveler
baseline at `public/concept-art/portraits/traveler.jpg`. All 1376×768 (16:9)
except the portrait at 896×1200 (3:4), matching the shipped hero art. Re-encoded
at JPEG q92 progressive: **33.0 MB → 9.6 MB** with no visible loss, which matters
because these are browser-delivered.

Two decisions worth recording:

- **Generated Reach-by-Reach, not band-by-band.** A partial batch is structurally
  safe (an un-generated slot carries no path and cannot break a render), but a
  Reach with only some bands filled would resolve art for `success` and a gradient
  tile for `failure` *within the same encounter* — internally inconsistent in the
  one place the set exists to be consistent. Completing whole Reaches keeps every
  partial state coherent.
- **`portrait.traveler` is now the `portrait` category generic.** The 15 planned
  archetypes therefore resolve to a real, deliberately unspecific image instead of
  the gradient tile. That is what demotes batch 4 to genuinely last.

### Batch 2 — what shipped (2026-07-28, THR-832)

16 nudge concept generics at `public/concept-art/nudge/<concept>.jpg`, all
1376×768, re-encoded JPEG q92 progressive: **11.6 MB → 3.6 MB**. Library goes
80 → **96 rows**, plan 45 → **29 slots**.

Three things worth recording:

- **`nudge` gets a category generic: `generic.blessing`.** Of the sixteen it is
  the only one whose subject is divine help *as such* — something settling over
  an object, unmistakably given — rather than a particular kind of it. An unknown
  tag therefore lands on "a god helped here", the one thing every nudge card has
  in common. `generic.strength` or `generic.luck` would assert a specific
  intervention the step may not have made.
- **The contact sheet caught the one defect the checker cannot** (impediment
  #261, carried from batch 1). `generic.vigor` returned a *nude anatomical
  figure* with glowing veins, against the settled doctrine of agents absent or
  silhouetted. The file existed, decoded, and was correctly named, so
  `check:image-library` passed it — exactly the batch-1 failure shape.
  Regenerated stating the silhouette positively and excluding every skin and
  anatomy term. The **palette** failure mode did not recur: naming the
  *forbidden* colours rather than only the wanted hex held across all 16, and
  `time-slow` came back amber rather than the green a comet gave batch 1.
- **One contract test was repointed, not deleted.** It pinned the terminal
  `null` rung using `nudge` as its example of "a kind with no category generic",
  which batch 2 falsified. It now uses `fate`, which is documented below as never
  getting one — a durable example rather than an incidental one. Two tests were
  added alongside it for the rungs batch 2 created.

### Batch 5 — what shipped (2026-08-19, THR-1170)

3 situational nudge generics at `public/concept-art/nudge/<concept>.jpg`, all
1376×768, JPEG q92 progressive, 184–257 KB. Library goes 125 → **128 rows**; the
plan table stays empty, so this batch was opened and closed in one PR rather than
being staged as slots first.

- **These are the first nudge rows that are not a kind of divine help.** Batch 2's
  sixteen name *what the god does* (`focus`, `ward`, `vigor`); these three name
  *the situation the nudge reaches into* — the room that is watching, the appeal
  that could be answered, the unarguable thing under the hand. That distinction is
  why they are the only nudge rows carrying **no `sphere` and no baked magic**:
  `crowd` alone is authored across time, mind, spirit, matter, order, life and
  light, and 128 of the 424 references carry no sphere at all, so a sphere thread
  would assert an intervention the step may not have made. Their light is ordinary
  flame, which no card's sphere can contradict. This is the same reasoning already
  recorded for why `nudge`'s category generic is `generic.blessing`.
- **The predicted defect was fixed structurally, and that is the transferable
  half.** `crowd` is the only plate in the batch needing people in frame, so it
  was the only one that could reproduce batch 2's `generic.vigor` failure (a nude
  anatomical figure that the checker passed). Rather than lengthening the "no
  faces" exclusion list, the subject was changed so a face is not on offer — a
  ring of hooded figures seen **from behind**, backs and covered heads only. Held
  first try, and it is the same motivated-occluder fix batch 4's portraits landed
  on. Prefer changing what the subject physically affords over a longer negative
  list.
- **The contact sheet remains the only gate that can catch a wrong picture.**
  `check:image-library` proves a path exists; it passes a plate with baked text, a
  stray figure, a drifted palette or invented incident. All three were read at
  full size before registration. Five batches, five sheets.

Open question 1 was re-checked before generating, as this plan required: still no
`lib-*.png` and no `Design/mockups/`, so all 16 were generated fresh.

**`fate` deliberately has no category generic and never will.** The set is
complete and keyed on `ReachDomain × StepOutcome`, so the exact-tag rung always
hits; a fallback there could only ever serve the *wrong band* — a shattered blade
for a success — which is worse than the honest gradient tile.

### Batch 3 — what shipped (2026-07-28, THR-832)

14 built/social scene generics at `public/concept-art/scene/<place>.jpg`, all
1376×768, re-encoded JPEG q92 progressive: **10.9 MB → 3.4 MB**. Library goes
96 → **110 rows**, plan 29 → **15 slots**. `ENCOUNTER_IMAGE_PLAN` is now batch 4
only.

Four things worth recording:

- **The 15 shipped `public/concept-art/locations/` plates were considered and
  rejected for promotion.** This is the same move that absorbed the wilderness
  half of the scene estimate, so it was checked before generating: there are
  existing plates named `town`, `camp`, `shrine`, `ruins`, `castle` and so on
  that appear to cover several batch-3 slots. They cannot be promoted. They are
  a different and older register — bright overcast daylight, crowds of
  fully-rendered faces, and **legible shop signage** ("The Golden Boar Inn") —
  which violates the STYLE.md text rule, the no-bright-daylight rule, and the
  settled agents-absent doctrine all at once. They are also framed as exterior
  establishing shots of *structures*, where most batch-3 briefs want interiors.
  Recorded here so a later batch does not re-litigate it.
- **Scene generics are unoccupied, which is stronger than the library doctrine.**
  "Agents absent or silhouetted" permits a silhouette; these permit none. A scene
  generic is reused across 3+ unrelated encounters, so any figure asserts a cast
  the encounter may contradict. Each place is evidenced by its objects instead —
  the market by its scales and stacked goods, the court by its dais and long
  approach.
- **The contact sheet caught the one defect the checker cannot**, for the third
  batch running (impediment #261). `scene.market` came back with a distinct
  blood-red pool on the cobbles running into the gutter — turning a `neutral`
  place generic into a crime scene, in the single most-reused kind in the
  library. The file existed, decoded, and was correctly named, so
  `check:image-library` passed it. Regenerated with the absence stated
  positively ("the lane is orderly and undisturbed — a market simply closed up,
  nothing has happened here") on top of the explicit red/blood exclusions, which
  is the same positive-statement fix batch 1 found for its living-face mask and
  batch 2 for its nude figure. **Three batches, three defects, all in the same
  class**: the generator supplies unrequested narrative incident, and only a
  human look catches it.
- **The `settlement` trio was generated as one unit.** `scene.settlement`,
  `scene.rebuild` and `scene.aftermath` all carry `places: ['settlement']`, so
  they were prompted against a shared architecture vocabulary — steep shingled
  roofs, timber-and-daub, a palisade gate — and read as one place in three
  states rather than three unrelated villages. This is the batch-3 analogue of
  batch 1's Reach-by-Reach rule; the coherent unit for a scene is a finished
  place, not a filled slot.

### Batch 4 — what shipped (2026-07-28, THR-832)

15 archetype portraits at `public/concept-art/portraits/<role>.jpg`, all
**896×1200 (3:4)** to match the shipped traveler baseline — the first and only
batch that is not 16:9 — re-encoded JPEG q92 progressive: **9.0 MB → 2.4 MB**.
Library goes 110 → **125 rows**, plan 15 → **0 slots**. `ENCOUNTER_IMAGE_PLAN` is
now **empty**, which closes the generation worklist THR-777 opened.

Four things worth recording:

- **Every archetype's face is a void, and that is the design rather than a
  limitation.** The checkpoint predicted this batch would invert the failure
  mode: batches 1–3 risked an *unwanted* figure, batch 4 risks an *over-specific*
  one — a face distinct enough to contradict a named agent shown beside it. The
  shipped traveler baseline had already solved it (the hood contains pure
  darkness), so batch 4 matched it literally: each figure is identified entirely
  by garment and gear. **The design decision that made this hold across all 15
  was giving every archetype a period-plausible head covering** — hood, coif,
  brimmed hat, cowl, blanket-shawl — so the shadow is *motivated*. A bare-headed
  figure with a void face reads as horror; a hooded one reads as anonymous.
- **They deliberately carry no sphere-coloured thread**, though STYLE.md's actor
  default permits a signature one. A thread would assert a sphere the depicted
  agent may not hold — the same genericity failure as a legible face, in a row
  reused for *any* agent of that role.
- **The contact sheet caught defects for the fourth batch in four** (impediment
  #261), and this time a *second* sheet of head crops was what made one of them
  unmissable. `portrait.guard` returned a fully rendered bearded face under an
  open-faced kettle helm — precisely the predicted failure — and `portrait.healer`
  returned **as a framed painting hanging on a wall**, wooden frame included.
  Both passed `check:image-library`: the files existed, decoded, and were
  correctly named. Guard was fixed by wrapping the head in a coif and hood so the
  helm no longer offers an open face to fill; healer by dropping the phrase
  *"standing to be painted"* (which the generator literalised into a painted
  object) and excluding the frame explicitly. **A new generalisation for #261:
  when the failure mode is known in advance, crop for it** — a grid of head crops
  found in one look what the full sheet showed only faintly.
- **Emptying the plan turned an existing test vacuous, and it was repaired rather
  than left green.** `every plan slot carries a non-empty generation brief`
  filters an array that is now empty, so it passes by matching nothing. It is
  kept as a guard for future batches, with a new test above it pinning
  `ENCOUNTER_IMAGE_PLAN` as empty — so the population is asserted rather than
  assumed, and a future batch that adds slots makes the guard live again.

**`ENCOUNTER_IMAGE_PLAN` stays declared though empty.** The two-table split is the
mechanism, not the bookkeeping: a slot added there cannot resolve to a broken
`<img>` because it carries no path, and the checker sweeps both directions so an
unregistered image cannot sit orphaned. Deleting the table would remove the
property that made this ticket batched and resumable.

**The `scene` category generic was left at `scene.wilderness.hills`.** Batch 3
makes a built-place generic (`scene.settlement`) available for the first time,
and there is a real argument that an unmatched *scene* query is likelier to want
an inhabited place than a hillside. It is a taste call rather than an executor
call, so it is recorded as open question 3 below rather than changed here.

Each batch: generate → drop files under `public/` → move the slots from `ENCOUNTER_IMAGE_PLAN` into `ENCOUNTER_IMAGE_LIBRARY` with real paths → `npm run check:image-library` → commit. The checker prints per-batch remaining counts, so a resumed run sees its position without reading the diff.

`FATE_REACH_METAPHORS` holds the per-Reach metaphor language (Iron: steel/shield; Gold: coin/scales; …) and `FATE_BAND_DIRECTION` the per-band direction; a slot's `brief` is composed from the two. The resolver never reads either table — they exist for generation.

## UI pillar

`NudgePhaseShell`'s nudge card now runs the manifest lookup on `card.imageTag`, with `sphere` as a refinement, and passes the result to `EntityVisual` as the `art` tier when it resolves. The descriptor keeps its `glyph` and `gradientIndex` populated in both branches because `EntityVisual` uses the glyph as the `<img>` `onError` swap target — so a path that 404s degrades in place rather than showing a broken image.

**Today the fallback is the common path**: nudge art is entirely batch 2, so every card still renders the gradient tile. That is the correct and intended state, and it is why the fallback branch had to stay exactly as it was rather than being replaced.

## NFP-compliance table

| # | NFP | Verdict |
|---|---|---|
| 1. | Tunability | PASS — match weights, `IMAGE_MATCH_MIN_SCORE`, and the genericity bar are all named constants; retuning which image wins is editing a number |
| 2. | Inspectability | PASS — `resolveEncounterImage` returns the `source` rung and the matched `entry`, so "why this picture" is answerable without instrumenting the call |
| 3. | Determinism | PASS — no randomness; ties break on `id` ascending, so declaration order in the manifest is never load-bearing |
| 4. | Fail-soft | PASS — every rung either yields a checker-proven path or falls through; terminal value is `null`, never a guess. An unknown tag degrades silently rather than throwing |
| 5. | Narrative over mechanical | PASS — the per-Reach metaphor sets exist purely so failure reads differently in different domains, at a real cost in image count |
| 6. | Additive | PASS — two new modules, one new npm script, one changed JSX branch. No existing field changed meaning |
| 7. | Performance budget | PASS — static data, `Map`-backed exact lookup, linear scan over tens of rows at modal-open frequency |

## Open questions

1. ~~**Do the mockup assets exist somewhere?**~~ **Resolved 2026-07-28 — no.** Searched
   the repo before generating: no `lib-*.png` anywhere, no `Design/mockups/`, and the
   only `thread-of-fate` hit is an unrelated *action card* (`public/assets/actions/thread-of-fate.jpg`).
   The 5 thread-weave fate and 7 `lib-*.png` nudge images the ticket calls "already
   made" are not in the repo, so batch 1 generated all 48 fate slots fresh. If the
   originals surface they can still replace generated rows — a file copy and a
   manifest path edit, no schema change. **Batch 2 should re-run this check** before
   generating the 16 nudge concepts, since 7 of them are the ones claimed to exist.
2. **Band collapsing.** 48 fate images is the un-collapsed count, and batch 1 shipped
   all 48 un-collapsed. Now that the images exist they can finally be compared, which
   is what this question was waiting on: the candidates are `success_at_cost` vs
   `near_miss` within a Reach. Collapsing is a manifest edit (`bands: ['success_at_cost',
   'near_miss']` on one row, delete the other file) — still no schema change. Left open
   as a taste call, not an executor call.
3. **Should the `scene` category generic move off the wilderness plate?** Opened
   by batch 3 (2026-07-28). It is `scene.wilderness.hills` — chosen when the only
   registered scene rows were the 12 outdoor terrain plates. Batch 3 registers 14
   built/social places, so an unmatched `scene` query now has an inhabited
   candidate (`scene.settlement`) for the first time. Which one an unknown scene
   tag *should* land on is a taste call: the hillside asserts "outdoors, in
   country", the settlement asserts "somewhere people live", and neither is
   obviously right for a tag nobody anticipated. Changing it is a one-line
   manifest edit and a test update.

## Constants table

| Constant | Value | Where | Why tunable |
|---|---|---|---|
| `GENERIC_POOL_UNRELATED_ENCOUNTERS_MIN` | 3 | `encounter-image-library.ts` | The genericity bar from the WS1 spec — how many unrelated encounters an image must read correctly in to earn a `generic.*` tag |
| `IMAGE_MATCH_WEIGHT_CONCEPT` | 10 | same | Concept agreement dominates deliberately; raising it further isolates concept as the sole axis |
| `IMAGE_MATCH_WEIGHT_SPHERE` | 4 | same | Sphere is a refinement on an already-apt image |
| `IMAGE_MATCH_WEIGHT_REACH` | 3 | same | Reach refinement |
| `IMAGE_MATCH_WEIGHT_PLACE` | 2 | same | Place refinement |
| `IMAGE_MATCH_WEIGHT_MOOD` | 1 | same | Weakest signal; a tie-breaker in practice |
| `IMAGE_MATCH_MIN_SCORE` | 10 | same | The bar a tag query must clear to beat the category generic. Set so one concept agreement (10) clears and a bare sphere+place coincidence (6) does not |

`FATE_REACH_METAPHORS` and `FATE_BAND_DIRECTION` are content tables, not tuning knobs — the resolver never reads them; they compose generation briefs.

## Tracing

N/A — no trace emission. This is a synchronous pure lookup outside the tick loop, so a per-call trace would be pure volume at modal-open frequency with no causal question to answer.

Inspectability (NFP #2) is served structurally instead: `resolveEncounterImage` returns `{ path, source, entry }`, where `source` names the rung that fired (`specific` / `exact_tag` / `tag_query` / `category_generic` / `none`) and `entry` is the matched manifest row. "Why this picture" is answerable from the return value without instrumenting the call — which is what the designer view and the tests both consume.

## Fail-soft table

| Failure | Behavior |
|---|---|
| Tag names no manifest row | Falls through to the tag query, then the category generic, then `null`. Never throws |
| Tag query finds nothing above the bar | Category generic for the kind |
| Kind has no category generic (nudge/fate/portrait today) | Returns `null` — the caller renders the EntityVisual gradient+glyph. Deliberately not a stand-in image |
| Empty query | `null`, not an arbitrary image |
| A registered path 404s at runtime | `EntityVisual` swaps to the glyph tile in place via `onError` — no broken-image icon, no layout shift |
| A registered path is deleted from disk | `check:image-library` exits 1 and the contract test fails, naming the offending row |

## Three-pillar check

- [x] **Engine** — Manifest + resolver as static data modules; no tick-loop participation, no graph nodes or edges, no new node types.
- [x] **Content** — The tag vocabulary itself, 31 registered rows, and a 94-slot worklist with per-slot generation briefs.
- [x] **UI** — `NudgePhaseShell` nudge-card art, browser-verified at 1920×1080.
- [x] **All three addressed** — none marked N/A; this slice touches every pillar.

## Vision audit

- [x] No Vision premise contradicted.
- [x] Image doctrine and the genericity bar both checked against the settled rulings.

No Vision premise touched. The library serves the settled image doctrine (agents mostly absent; when present, generic or silhouetted; fate images contain no agent at all), and the per-Reach fate metaphor sets exist precisely so failure *reads* differently in different domains — narrative texture bought at a real cost in image count, which is NFP #5 applied rather than traded away.

The genericity bar is the Vision-relevant constraint: an image that names an entity or shows an identifying detail cannot join the shared pool, because reuse across unrelated encounters is what would otherwise make the world look mass-produced.

## Rulebook impact

- [x] No rule of play changed.
- [x] No rulebook update required in this PR.

None. This changes no rule of play — no turn structure, action verb, prerequisite, resource, clock, or win/loss condition. It is presentation substrate for encounters whose rules WS0 and WS2 already settled.

## Done when

- [x] `ENCOUNTER_IMAGE_LIBRARY` exists, every row's path resolves on disk, and the 19 branching heroes are registered by tag.
- [x] `ENCOUNTER_IMAGE_PLAN` enumerates every un-generated slot with a composed brief and a batch number.
- [x] `resolveEncounterImage` implements the documented chain and reports which rung fired.
- [x] `NudgePhaseShell` consumes the resolver; an unresolved tag still renders the EntityVisual fallback.
- [x] `npm run check:image-library` passes, and **fails** when a path is broken or an id appears in both tables (falsified, not assumed).
- [x] Contract tests pin each rung by `source`, not merely by "a path came back".
- [x] **Batch 1 generated** (2026-07-28) — 48 fate + traveler baseline registered; `check:image-library` reports 80 rows, 45 slots, no batch-1 remainder.
- [x] **Batch 2 generated** (2026-07-28, THR-832) — 16 nudge concept generics registered and `generic.blessing` installed as the `nudge` category generic; `check:image-library` reports 96 rows, 29 slots, no batch-2 remainder.
- [x] **Batch 3 generated** (2026-07-28, THR-832) — 14 built/social scene generics registered; `check:image-library` reports 110 rows, 15 slots, no batch-3 remainder. Two contract tests added pinning that a built place resolves to its own row rather than falling through to a wilderness plate.
- [x] **Batch 4 generated** (2026-07-28, THR-832) — 15 archetype portraits registered at 896×1200; `check:image-library` reports **125 rows, 0 slots**. `ENCOUNTER_IMAGE_PLAN` is empty, closing the worklist. Three contract tests added: every archetype resolves to its own row via `tag_query`, an unlisted role falls to the traveler generic, and the plan is pinned empty so the brief guard's new vacuity is explicit.

## Coordination block

- **Suggested model:** sonnet for the generation batches (mechanical: generate → register → check → commit). This manifest-design slice was opus, per the ticket's own block.
- **Parallel-safe with:** WS0 (THR-773), WS3 (THR-776) — both shipped. Any ticket not touching `src/data/encounter-image-library.ts`.
- **Files to touch:** `src/data/encounter-image-library.ts` (register rows, delete slots), plus new image files under `public/`. Generation batches touch nothing else.
- **Mutex with:** THR-778 / WS5 **only if** WS5 edits the manifest to register encounter-specific art (both edit `src/data/encounter-image-library.ts`). WS5 authoring that merely *references* tags is parallel-safe.

## Notes for the executor

Each generation batch is one PR. The loop is: generate the batch's images via the mcp-image MCP using each slot's `brief` on top of the `STYLE.md` formula → drop files under `public/` → **move** the slots from `ENCOUNTER_IMAGE_PLAN` into `ENCOUNTER_IMAGE_LIBRARY` with real paths (move, not copy — the checker fails on an id in both tables) → `npm run check:image-library` → commit.

Do not add a third table. The two-table split is load-bearing: it is what makes an un-generated slot structurally incapable of producing a broken `<img>`.

If the mockup assets named in the ticket (5 thread-weave fate, 7 `lib-*.png` nudge) turn up, promoting them is a file copy plus a manifest edit and drops the batch-1/2 counts accordingly — check with Christian before regenerating anything that may already exist.

## Wiring

| New module | Called from | Verified |
|---|---|---|
| `src/data/encounter-image-library.ts` | `encounterImageResolver.ts`, `scripts/check-image-library.ts`, contract tests | `check:image-library` OK; 20 tests |
| `src/data/encounterImageResolver.ts` | `NudgePhaseShell.tsx` (`NudgeCard`) | Browser: all four rungs fired in the page runtime; 5/5 cards rendered a decoded `<img>` under the falsification pass |
| `scripts/check-image-library.ts` | `npm run check:image-library` | Falsified — exits 1 on an injected bad path, 0 on revert |

No GameState field, orchestrator hook, or modal host is added, so the corresponding rows of `Docs/plans/wiring-checklist.md` are N/A for this change.

## Forked-audit verdicts

Not run — this is an implementation record for an already-handed-off ticket, not a design plan seeking a Ready-for-Dev handoff. The design decisions it records (fate keyed on the outcome ladder; the two-table split; encounter-specific rows excluded from the query) are documented above with their rationale and are open to reversal by a later design pass.

## Interface impact

No mapped cross-system contract in `Docs/canon/interface-map.md` is added, retired, or rerouted. The resolver is a new leaf consumed by one UI surface; it reads no engine state and writes none. `NudgePhaseShell`'s existing contract with `EntityVisual` is unchanged — the same descriptor shape, with `src` populated when art resolves.
