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

| Batch | Slots | Contents | Why this order |
|---|---|---|---|
| 1 | 49 | 48 fate (8 Reaches × 6 bands) + the baseline traveler portrait | Fate art is what every encounter ends on — highest reuse per image in the whole library |
| 2 | 16 | Nudge concept generics | Unblocks the hand, the surface the player reads most often |
| 3 | 14 | Built/social scene generics | Terrain already covers outdoors; these finish the place vocabulary |
| 4 | 15 | Remaining archetype portraits | Lowest reuse; `EntityVisual` already degrades gracefully here |

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

1. **Do the mockup assets exist somewhere?** The ticket says 5 thread-weave fate images and 7 `lib-*.png` nudge cards are already made. They are not in the repo. If Christian has them locally, promoting them removes ~12 slots from batches 1–2.
2. **Band collapsing.** 48 fate images is the un-collapsed count. A taste pass may decide `success_at_cost` and `near_miss` can share art within a Reach, which would drop batch 1 to 40 — matching the ticket's original number by a different route. Deferred to the first generation run, where the images can actually be compared.

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
- [ ] Batches 1–4 generated — subsequent runs; the checker's per-batch counts are the progress readout.

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
