> **title:** `Hunger vocabulary unification — one catalog, one key scheme, a resonance weight that can actually fire — THR-1213`
> **linear_issue:** THR-1213
> **author:** `Claude Code (design session)`
> **created:** 2026-08-27
> **three_pillars:** Engine `done` · Content `done` · UI `done (no new surface — evidence route + debug record; rationale stated)`

# Hunger vocabulary unification — one catalog, one key scheme, a resonance weight that can actually fire — THR-1213

*One hunger id space with typed spellings, one merged catalog, one resonance tag union — and the resonance weight wired into the live dilemma picker so the god's chosen Hunger finally shapes the Meet-The-First encounter.*

## Why this is load-bearing

The seam inventory ([THR-1158](https://linear.app/threadbare/issue/THR-1158/seam-inventory-where-content-claims-state-where-writes-go-unconsumed)) measured `hungerResonance` dead at the value level: the reader compares hunger *ids* against theme *tags*, so `HUNGER_RESONANCE_WEIGHT` fires **zero times across 167 shipped dilemmas** — for every god, forever. Re-measuring against the current tree (this session, 2026-08-27) found the defect is one layer deeper than the vocabulary mismatch:

- **The reader itself is unwired.** `selectDilemmasV2` / `scoreDilemmaResonance` (`src/engine/dilemmaSelection.ts`) are imported **only by their own tests**. Both live meeting paths (`MeetTheFirstFlow.tsx:159`, `MeetingEncounterModal.tsx:127`) call the old `selectDilemmas`, which takes no lens and scores nothing.
- **The lens is a stub, and the stub is dead.** `GameView.tsx:609` builds an `AscendantLens` from the *archetype* spheres — not the player's chosen remembrance hunger — and the memo is never consumed by anything.
- **The lens-overlay prose engine is dormant.** `src/engine/ascendantLens.ts` (`resolveLensOverlay`, `shouldFireMortalEcho`) has no production caller; the authored `lensOverlays` and echo prose on the dilemma library have no reader.
- **The data is unauthored.** Only **10 of 167** dilemmas carry any resonance data at all (measured by source parse, this session); the other 157 have empty `emotionalRegister` / `hungerResonance` / `driveResonance` blocks.

The player picks a Hunger in the remembrance flow, and today that choice changes prose framing but never *which formative tests the meeting deals*. This plan is the wave-1 sitting's second seam ([THR-1163](https://linear.app/threadbare/issue/THR-1163/wave-1-selection-which-seams-make-the-first-wave-in-what-order-under) resolution) and the shared machinery's first generalization proof ([THR-1212](https://linear.app/threadbare/issue/THR-1212/wave-1-design-a-shared-anchor-machinery-the-typed-anchor-the-generated) plan doc, merged [PR #1674](https://github.com/christianspliid-ui/threadbare/pull/1674)); the region-identity design ([THR-1155](https://linear.app/threadbare/issue/THR-1155/nations-and-named-areas-are-rendered-not-simulated-promote-both-to)) runs after it. Standing rules: **strangler, never big-bang**; map decisions ([THR-1157](https://linear.app/threadbare/issue/THR-1157/typed-game-state-architecture-machinery-first-wave-wayfinder-map)) are settled input.

## The machinery generalization verdict (THR-1212 kill-criterion check)

The machinery doc's kill criterion asks whether this seam can be expressed without changing `WorldRef`'s shape. **It can — by not consuming `WorldRef` at all, deliberately.** A hunger id is a **committed concept literal** (the machinery doc's binding form 1: "an id that means the same thing in every world"), not a reference to a per-world graph object; there is nothing for `resolveWorldRef` to resolve against the live graph. What this seam generalizes is the **typed-seam pattern**: canonical typed union → single data authority → one fail-soft resolver (`toHungerId` — it already carries the "this is the one place that conversion happens" doc) → no-op gate proving shipped content actually fires in a live pipeline. Kill-criterion **PASS, no shape change needed** — recorded as a comment on THR-1212 at handoff, per that doc's instruction.

## The vocabulary today (measured, this session)

| Surface | Id form | Read by | Status |
|---|---|---|---|
| `AscendantIdentity.hungerId` (persisted in saves) | dotted `hunger.witness` | `toHungerId` at 3 sites | 🟢 works |
| Remembrance catalog `src/data/hunger-catalog.ts` (`HUNGER_CATALOG`, 12 entries) | dotted | RemembranceFlow, `filterHungers` | 🟢 works |
| Engine catalog `src/types/hunger.ts:84` (`HUNGER_CATALOG`, 12 entries, **same symbol name, different type**) | bare `witness` | `buildStubAscendantLens` → dead memo | 🔴 effectively dead |
| `SENSING_OPENING_PROSE` / `BOND_PROSE` keys | dotted | `MeetTheFirstFlow` | 🟢 works (parity test-pinned, not typed) |
| Vignette `hungerResonance` (`candidate-vignettes.ts`, 24 entries) | dotted, id-membership | `generateNarrativeCandidates` | 🟢 works |
| Dilemma `resonance.hungerResonance` (10 non-empty of 167; values `gather`/`preserve`) | bare ids | `scoreDilemmaResonance` compares vs **theme tags** | 🔴 dead twice: vocabulary mismatch AND reader unwired |
| Lens overlays `lensOverlays[].hungerId` | bare | `resolveLensOverlay` | 🔴 reader dormant |
| `godVoiceByHunger` keys (BondBeat) | bare via `toHungerId` | BondBeat | 🟢 works |
| `HUNGER_UNIQUE_CARDS` keys (dealHand) | bare via `toHungerId` | dealHand | 🟢 works (THR-891 fix) |

Fire-rate measurement over the 167-dilemma library (source-parse, script in session scratchpad; the executor's no-op gate re-derives it via vitest):

- Current reader semantics (`hungerResonance` entries vs hunger tag lists): **0 matches for all 12 hungers.**
- Best rewiring without new authoring (`emotionalRegister` overlap): 16 matches total, 0 for 9 of 12 hungers — the register vocabulary is 13 distinct tags, of which **4 appear in no hunger's tag list** (`compassion`, `desperation`, `devotion`, `nurturing`): the same disjoint-vocabulary failure class in miniature. **No existing data channel makes the weight fire; a content pass is structural to this ticket, not optional.**

## Substrate inventory

| Existing subsystem (inventory name) | Status | This plan |
|---|---|---|
| Encounters & Dilemmas — meeting flow (`meetingEncounter.ts`, phase-adjacent; `2.5`/`2.55` dilemma phases untouched) | 🟢 ACTIVE | **extends** — `selectDilemmas` gains the resonance term; flow passes an identity-derived lens |
| Remembrance (`remembrance.ts`, `RemembranceFlow`) | 🟢 ACTIVE | **reuses** — its catalog becomes the single merged catalog's home; `filterHungers` untouched |
| Hunger id bridge (`toHungerId`, `src/types/hunger.ts:221`) | 🟢 ACTIVE | **extends** — stays the sole dotted↔bare conversion; gains the template-literal `StoredHungerId` type it converts from |
| Dilemma selection V2 (`src/engine/dilemmaSelection.ts`) | 🟠 DORMANT (zero production callers, verified this session) | **retires** — scoring function + weights + anti-resonance valve fold into the live `selectDilemmas`; module deleted with its duplicate constants |
| Lens overlay engine (`src/engine/ascendantLens.ts`) | 🟠 DORMANT (zero production callers) | **leave-dormant, typed** — overlay keys re-typed in the migration; activation chartered as a Deferral, not smuggled in |
| Meeting prose maps (`meeting-narrative-prose.ts`) | 🟢 ACTIVE | **extends** — keys re-typed `Record<StoredHungerId, string>`; runtime parity tests become compile-time facts |
| Candidate vignettes (`candidate-vignettes.ts`, 24 entries — runtime population consumed each meeting) | 🟢 ACTIVE | **extends** — `hungerResonance` re-typed `readonly StoredHungerId[]`; values unchanged |
| Formative tests (THR-868 `test` carriage in `selectDilemmas`) | 🟢 ACTIVE | **preserves** — instance-boundary behavior untouched; scoring only changes *which* templates are picked |

## Engine pillar

### Systems design — one id space, three ruled moves

**Ruling 1 — one catalog, merged, in `src/data/hunger-catalog.ts`.** The two same-named `HUNGER_CATALOG` exports merge into a single 12-entry catalog whose `HungerDefinition` is the **field union of both current shapes** — zero consumer field renames:

- From the remembrance shape (currently `src/types/remembrance.ts`): `imageAssetPath`, `proseVariants`, `mandateDirection`, `courtOptions`, `sphereAlignment`, `domainAffinities`, `ascendantLens` (second-person voice).
- From the engine shape (currently `src/types/hunger.ts`): `perceptionStyle`, `emotionalTone` (third-person narrator voice — THR-891 already documents these as *derived from* the remembrance entries), `candidateReachBias`, `dilemmaResonanceTags`.
- `id: HungerId` (bare). The dotted form is derived, not stored twice.

The merged interface lives in `src/types/hunger.ts`; `src/types/remembrance.ts` re-exports it (additive compat). The engine-side catalog constant in `types/hunger.ts` is deleted; `buildStubAscendantLens` moves to `src/engine/ascendantLens.ts` (types must not import data — import direction becomes engine → data → types). The THR-891 hand-maintained derivation comment retires with the duplication it described.

**Ruling 2 — bare canonical, dotted typed-derived; no save migration.**

```ts
// src/types/hunger.ts
export type HungerId = 'gather' | 'witness' | /* … 12 members, unchanged */;
/** The persisted/authored spelling. Derived — a form the union doesn't know is a compile error. */
export type StoredHungerId = `hunger.${HungerId}`;
```

`AscendantIdentity.hungerId` re-types `string` → `StoredHungerId` (values in saved worlds already conform; `toHungerId` keeps accepting `string | undefined | null` at the read boundary, so a legacy or corrupt save still fails soft to "no hunger"). Prose maps re-type to `Record<StoredHungerId, string>`; vignette `hungerResonance` to `readonly StoredHungerId[]`; lens overlay `hungerId` to `HungerId`. The parity assertions in `meetingProseRegister.test.ts` (key-set equality) and `hungerIdBridge.test.ts` (catalog length/id parity) become **compile-time facts**; the runtime tests simplify to what types cannot prove (non-empty prose, bridge narrowing behavior). `toHungerId` remains the single conversion site, unchanged.

**Ruling 3 — one resonance tag space; the ambiguous field splits into its two honest meanings.**

```ts
// src/types/hunger.ts
/** Closed thematic vocabulary shared by hunger tag lists, dilemma registers,
 *  drive tags, and remembrance fragment tags. Derive the member list by
 *  sweeping those four sources (predicate, THR-688 rule A — do not snapshot
 *  a count here); today that sweep yields ~70 tags. */
export type ResonanceTag = 'belonging' | 'protection' | /* … */;
```

- `HungerDefinition.dilemmaResonanceTags`, dilemma `emotionalRegister` / `driveResonance`, `AscendantLens.driveTags`, and remembrance fragment tags all re-type to `readonly ResonanceTag[]`. The four register tags currently in no hunger's list join the union (they are real themes; the drift was that nothing closed the vocabulary).
- **Dilemma-side `resonance.hungerResonance` retires** — field, its 10 shipped entries, and the "Hunger IDs or resonance tags" comment that bred the ambiguity. Evidence: 0 fires ever (this doc, THR-1158); the `followOnTags` deletion precedent from the machinery doc applies. `hungerResonance` as a name survives **only** where it is live and means id-membership: the vignettes.

### Resolution logic — the weight fires in the live picker

`selectDilemmas` (`src/engine/meetingEncounter.ts`) gains an optional lens and replaces its uniform pool picks with resonance-weighted picks:

```ts
export function selectDilemmas(
  templates: DilemmaTemplate[], primaryReach: ReachDomain, secondaryReach: ReachDomain,
  sphere: SphereName, archetypeId: string, locationSubtype: string, seed: number,
  lens?: AscendantLens,               // additive; absent → current uniform behavior, byte-identical
): DilemmaInstance[]
```

- Per pool: score each candidate `HUNGER_RESONANCE_WEIGHT × |emotionalRegister ∩ lens.hunger.dilemmaResonanceTags| + DRIVE_RESONANCE_WEIGHT × |driveResonance ∩ lens.driveTags|`, add deterministic jitter (`rng() × RESONANCE_TIE_JITTER`) for tie-breaks, pick the top — except with probability `ANTI_RESONANCE_PROBABILITY`, pick the bottom (the V2 variety valve, carried over so a god is not always mirrored back at themselves).
- `scoreDilemmaResonance` moves here (re-derived on `emotionalRegister`; same name, one home); `src/engine/dilemmaSelection.ts` is deleted with its duplicate `HUNGER_RESONANCE_WEIGHT` — the third duplicate, in `meetingEncounter.ts:841` (vignette weight), is renamed `VIGNETTE_HUNGER_RESONANCE_WEIGHT` so one symbol never again names two systems' knobs.
- **Lens from identity, not archetype:** new `buildLensFromIdentity(identity: AscendantIdentity): AscendantLens` in `src/engine/ascendantLens.ts` — hunger entry via `toHungerId(identity.hungerId)` against the merged catalog; `driveTags` = `identity.mortalTags` (dense, persisted, already in the tag space); `mortalName` / `timeSinceAscension` straight from identity. Fail-soft: unresolvable hunger → `buildStubAscendantLens` result (which stays, relabeled as the identity-less floor for `?view=game`). `MeetTheFirstFlow` and `MeetingEncounterModal` pass the lens; the dead `GameView.tsx:609` memo is deleted.
- THR-868 `test` carriage, archetype/locationSubtype eligibility, count logic, and slot structure are untouched — scoring changes *which* eligible template wins a slot, nothing else.

### Graph nodes / edges

None added or modified. Hunger ids are committed concept literals, not graph references (see the machinery-verdict section). The one graph-adjacent write is additive: the meeting's existing `meetingChoiceRecord` (already persisted on the thread edge) gains a `dilemmaSelection` scoring record (see Tracing).

### Tick phases

None. Dilemma selection runs inside the Meet-The-First flow (component-driven, pre-bond), not in the tick loop. Phases `2.5`/`2.55` (dilemma detection/revelations) are a different subsystem and are untouched.

### PRNG callouts

No new PRNG streams. The weighted pick reuses the existing `createSeededRng(seed, 'dilemma_select')` stream in `selectDilemmas`; the anti-resonance roll and tie-jitter draw from it in a **fixed order regardless of lens presence** (draw-count discipline: an absent lens must consume the same number of draws, so adding a lens never perturbs unrelated downstream picks — NFP #3).

## Content pillar

### Encounter templates

N/A — no encounter templates (`src/data/unified-action-templates.ts` family) are touched; this seam lives in the meeting dilemma library.

### Prose tables

N/A for new prose — no prose is authored or rewritten. Prose *maps* are re-typed only (`meeting-narrative-prose.ts` keys); every string ships unchanged.

### Attachment content

N/A — no attachment templates or modifiers.

### Data tables

The content work of this ticket, in two parts:

1. **Migration of shipped content (mechanical, zero prose):** merge the 12 remembrance catalog entries with their 12 engine twins (field union, values verbatim from the two sources); delete the 10 dead dilemma `hungerResonance` entries with the field; re-type vignettes/prose maps/overlays in place (values already conform).
2. **The resonance authoring pass (the pass that makes the weight fire):** author `emotionalRegister` (2–4 tags) and, where apt, `driveResonance` for the **157 dilemmas whose resonance blocks are empty** — tags drawn only from the closed `ResonanceTag` union, chosen from each dilemma's existing text (the themes are already in the fiction; this is labeling, not writing). Coverage is gated, not vibes: every hunger must resonate (score > 0) with at least `HUNGER_RESONANCE_MIN_COVERAGE` dilemmas, enforced by the no-op gate below. Batch-cadence friendly: the gate can land advisory in the same PR as slice 2 and flip blocking when the pass completes (executor's call within the ticket; it does not ship half-on).

## UI pillar

*Screenshot tool: Playwright (DOM — the meeting flow is a DOM surface). No new surface is drawn; see evidence route below.*

### Player-facing display

No new components, no layout or grammar changes. The player-visible effect is **which formative tests the meeting deals** — the god's chosen Hunger now weighs the deal. Surfaces render exactly as today (UI Laws engaged: none newly; no numerals appear anywhere — scoring is selection-side only, Law 13 parity unaffected since nothing new is claimed to the player).

**Evidence route for the Done-when:** `?view=game&firstunmet&size=medium`, drive with `window.__DEBUG.tick(n)` until the beat triggers, then assert via `window.__DEBUG.getMeetingState()` that the dealt dilemmas match the seeded expectation for the seeded identity's hunger (hunger.witness), plus the standard console capture. The `GameView.tsx` dead-memo deletion is `Browser-verify exempt: dead-code removal, no render path touched` — but the flow-level capture above is owed anyway by the `MeetTheFirstFlow` edit, so one Playwright pass covers the pillar.

### Event notifications

None.

### Debug inspection (DebugPanel)

`meetingChoiceRecord.dilemmaSelection` (see Tracing) is readable through the existing `window.__DEBUG.getMeetingState()` / thread-edge inspection — no new accessor needed; the record rides state that is already surfaced. `debug-bridge.d.ts` JSDoc for `getMeetingState` gains one line naming the new field.

### Visual presence (HexMapV2)

N/A — no map-layer change.

## Wiring

> See checklist: Docs/plans/wiring-checklist.md

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|--------|-------------------|-------------|-----------------|---------------|------------------|
| `src/types/hunger.ts` (unions, merged def) | none (type layer) | all meeting components (types only) | none | none | catalog is self-documenting |
| `src/data/hunger-catalog.ts` (merged catalog) | none (data) | RemembranceFlow, MeetTheFirst* | none | none | single authority, greppable |
| `selectDilemmas` resonance term | none (flow-time, pre-bond) | MeetTheFirstFlow, MeetingEncounterModal | `meetingChoiceRecord.dilemmaSelection` (thread edge, existing record extended) | none (not tick-loop; see Tracing rationale) | `__DEBUG.getMeetingState()` |
| `src/engine/ascendantLens.ts` (+`buildLensFromIdentity`, relocated stub builder) | none | MeetTheFirstFlow | none | none | lens inputs visible in the selection record |
| `src/engine/dilemmaSelection.ts` | — | — | — | — | **deleted** (dormant duplicate; evidence in this doc) |

## Constants table

| Constant | Default | Purpose |
|----------|---------|---------|
| `HUNGER_RESONANCE_WEIGHT` | `2.0` | Score per tag overlap between a dilemma's `emotionalRegister` and the hunger's `dilemmaResonanceTags` (one home: `meetingEncounter.ts`) |
| `DRIVE_RESONANCE_WEIGHT` | `3.0` | Score per tag overlap between `driveResonance` and the lens `driveTags` |
| `ANTI_RESONANCE_PROBABILITY` | `0.15` | Chance a pool picks its *least* resonant template — variety valve carried from V2 |
| `RESONANCE_TIE_JITTER` | `0.001` | Deterministic jitter magnitude for tie-breaking within a pool |
| `VIGNETTE_HUNGER_RESONANCE_WEIGHT` | `2.0` | The vignette-candidate weight (renamed from its duplicate symbol; value unchanged) |
| `HUNGER_RESONANCE_MIN_COVERAGE` | `6` | No-op gate floor: dilemmas each hunger must resonate with after the content pass |

## Tracing

Not tick-loop code, so no trace-buffer registration (the standing rationale from the machinery doc: inspectability via a queryable record, stated deliberately rather than a token trace). The inspectable record — persisted where meeting choices already persist:

```ts
// meetingChoiceRecord.dilemmaSelection — written by selectDilemmas when a lens is present
interface DilemmaSelectionRecord {
  hungerId?: HungerId;              // the lens hunger that scored the deal (absent = stub/no lens)
  slots: ReadonlyArray<{
    templateId: string;
    score: number;                  // resonance score of the winner
    poolSize: number;               // candidates it beat
    antiResonance: boolean;         // the valve fired for this slot
  }>;
}
```

## Fail-soft table

| Failure case | Fallback |
|--------------|----------|
| `identity.hungerId` unknown/legacy/corrupt | `toHungerId` → `undefined` → `buildLensFromIdentity` falls back to the sphere stub; selection proceeds |
| No lens passed (identity-less `?view=game` path) | scoring skipped entirely; pick behavior byte-identical to today (uniform), same PRNG draw count |
| Dilemma with empty `emotionalRegister` after the pass | scores 0; still selectable (never filtered out — resonance weighs, never gates) |
| A hunger with zero resonant dilemmas mid-pass | selection still fills every slot (weights of 0 degrade to uniform); the coverage gate catches it at CI, not at play |
| Merged catalog entry missing a field during migration | compile error (the merged interface is total) — build-time fail-loud, the machinery doc's documented exception to NFP #4 |

## Blast Radius

No file in scope carries ≥100 importers (`src/types/index.ts` and `src/types/traits.ts` are imported, not modified). Highest-importer touched file is `src/types/remembrance.ts` (bounded consumer set: remembrance flow, gameInit, meeting components); the typecheck ratchet is the cascade detector for the re-typings.

## Interface impact

`Docs/canon/interface-map.md` carries no audited hunger contract (verified by grep this session) — UNAUDITED means audit-on-touch:

| Contract | Action |
|---|---|
| `AscendantIdentity.hungerId` (remembrance → engine/UI, persisted) | **extend** — re-typed `StoredHungerId`; wire format unchanged; `toHungerId` remains the sole read-side bridge |
| Remembrance catalog → meeting prose/vignette keys | **extend** — parity moves from test-pinned to type-derived |
| Dilemma library `resonance.hungerResonance` → `scoreDilemmaResonance` | **retire** — field + reader-module deleted; the write-side test fixtures asserting the dead vocabulary (`dilemmaSelection.test.ts`) are deleted with it, per the interface-map rule that retiring a contract deletes the tests asserting its dead side; replacement contract (`emotionalRegister` ∩ hunger tags) production-read at the same call site |
| Lens overlays → overlay engine | **preserve (dormant), typed** — keys re-typed; activation chartered by Deferral (write-without-consumer, will surface in THR-1212's consumption ledger when it ships) |

## Three-pillar check

- [x] Engine pillar present
- [x] Content pillar present (migration + the authoring pass that makes the weight fire)
- [x] UI pillar present (no new surface — rationale + evidence route stated)
- [x] Wiring section connects them

## Vision audit

- [x] No Vision premise contradicted. By file: `Vision/02-non-negotiables.md` → god/protagonist separation — **confirmed**: resonance *weighs* the deal, never gates it, and the `ANTI_RESONANCE_PROBABILITY` valve is the mechanical proof the god influences without dictating; → narrative-over-mechanical — **confirmed**: zero prose rewritten, folding themes into tags never forces mechanical prose. `Vision/01-core-loop.md` → untouched — this is the one-time bonding flow, not the portfolio-scan → encounter → aftermath rhythm. `Vision/00-north-star.md` → served indirectly: the hunger choice becomes causally consequential (the remembrance premise, THR-891 header prose) instead of prose-only. `03-design-tensions.md` / `taste-profile.md` → not engaged; no numerals reach a player surface (selection-side only).
- [x] No Vision edit required in this ticket's scope.

## Rulebook impact

- [x] No rule of play changes — the meeting still deals 2–3 formative tests by the same slot structure; *which* tests are favored becomes hunger-shaped, which is tuning inside an existing rule, not a new rule.
- [x] No `Docs/canon/rulebook.md` update owed.

> Brainstorm companion: `Docs/plans/2026-08-27-hunger-vocabulary-unification-brainstorm.md` (written in the same pass).

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | Six named constants (table above); the duplicate-symbol weight is renamed so every knob has one home |
| 2. Inspectability | PASS with note | No tick traces because nothing ticks; the persisted `DilemmaSelectionRecord` + `getMeetingState()` answer "why did this god get these tests" — stated deliberately |
| 3. Determinism | PASS | Existing seeded stream; fixed draw-count with or without lens so the additive param never perturbs unrelated picks |
| 4. Fail-soft | PASS with note | Runtime fully fail-soft (table above); merged-catalog totality is compile-time fail-loud — the machinery doc's documented build-time exception |
| 5. Narrative over mechanical perfection | PASS | Resonance weighs rather than gates; anti-resonance valve carried; all shipped prose ships unchanged |
| 6. Additive over destructive | PASS with note | Deletions are all measured-dead duplicates (second catalog, unwired V2 module, dead memo, 0-fire field) with evidence in this doc — sunset-by-default per the followOnTags precedent |
| 7. Performance budget | PASS | Scoring is O(pool × tags) at meeting-build time, once per playthrough; no per-tick work |

## Done when

- [ ] One `HUNGER_CATALOG` export exists in the repo; `HungerId`/`StoredHungerId`/`ResonanceTag` typed as ruled; parity is compile-time
- [ ] The resonance weight demonstrably fires in the **live** path: the no-op gate (below) passes with every hunger ≥ `HUNGER_RESONANCE_MIN_COVERAGE` resonant dilemmas and at least one hunger's dealt selection differing from the no-lens deal (non-vacuous by construction)
- [ ] `npm test` and `npx vite build` pass; types via `npm run check:typecheck` (ratchet — never `tsc --noEmit`, THR-686)
- [ ] Closing commits carry the closeable reference per Definition of Done; flow-level Playwright evidence per the UI pillar's route (or the stated exemption for pure dead-code slices)

*Executor action items — ordered, strangler-sized; each slice independently shippable.*

**Engine action items**
1. **Types + merged catalog (no behavior change):** `HungerId`/`StoredHungerId`/`ResonanceTag` unions; merged `HungerDefinition`; single catalog in `src/data/hunger-catalog.ts` (values verbatim from both sources); delete the `types/hunger.ts` catalog; relocate `buildStubAscendantLens` to `src/engine/ascendantLens.ts`; re-type identity/prose-maps/vignettes/overlays; collapse the now-compile-time parity tests to their runtime remainder. Sweep predicate for consumers: every importer of either `HUNGER_CATALOG` symbol, grep-derived at execution time.
2. **Reader + lens wiring:** resonance scoring into `selectDilemmas` (optional `lens` param, fixed draw-count, anti-resonance valve, `DilemmaSelectionRecord`); `buildLensFromIdentity`; `MeetTheFirstFlow` + `MeetingEncounterModal` pass the lens; delete `GameView.tsx:609` memo and `src/engine/dilemmaSelection.ts` (move `scoreDilemmaResonance` + weights; delete the dead-vocabulary fixtures with the module); rename the vignette weight symbol.
3. **No-op gate (contract test, the THR-1165 class):** through the real pipeline/library — for each of the 12 hungers, build the lens, run `selectDilemmas` over the shipped library, assert (a) population non-empty *first* (vacuous-guard), (b) each hunger resonates with ≥ `HUNGER_RESONANCE_MIN_COVERAGE` dilemmas, (c) ≥1 hunger's selection differs from the no-lens selection at the same seed. Lands advisory with slice 2, flips blocking with the content pass.

**Content action items**
1. Mechanical migration rides Engine slice 1 (catalog merge values, field deletion — zero prose).
2. **The resonance authoring pass:** `emotionalRegister` (2–4 tags from the closed union) + apt `driveResonance` for the 157 empty-block dilemmas; tags labeled from each dilemma's existing text. Done = the no-op gate's coverage assertion goes green and flips blocking.

**UI action items**
1. Flow-level Playwright evidence per the UI pillar's route (rides slice 2); `debug-bridge.d.ts` JSDoc line for the new record field.

**Wiring action items**
1. File the overlay-engine activation `Deferral` (lens overlays + mortal echo have authored content, a tested reader, and no caller — activation is an experiential decision about the THR-868 flow), first comment carrying its coordination block per THR-836.
2. Post the machinery kill-criterion PASS comment on THR-1212 (done at design handoff — verify it landed; re-post if not).

**Gate items (every slice):** `npm test`, `npx vite build`, `npm run check:typecheck` (ratchet), tree-diffing freshness gates last, closeable reference per Definition of Done.

## Coordination block

**Suggested model:** opus — cross-cutting type migration plus a judgment-priced content labeling pass. (Advisory; the automation runs Opus regardless.)

**Parallel-safe with:** THR-1212 executor slices (its files: `src/types/worldRef*`, `scripts/generate-*`, `check-chip-anchors`; this ticket's files: hunger/meeting/remembrance modules — disjoint; the machinery doc's provisional mutex reason "THR-1213 consumes slice 1's type and slice 2's catalog" is verifiably inapplicable — this design consumes neither, see the machinery-verdict section; reversal recorded per THR-688 rule B). THR-1222 / THR-1130 (encounter template content files — disjoint).

**Mutex with:** THR-1155 (region identity — the map orders it after this seam and it will cite this doc's pattern); any ticket editing `src/engine/meetingEncounter.ts` or `src/data/meeting-dilemma-library.ts` (both are this ticket's primary edit surfaces).

**Files to touch:**
- Create: `src/engine/__tests__/hungerResonanceGate.test.ts` (no-op gate)
- Edit: `src/types/hunger.ts`, `src/types/remembrance.ts`, `src/types/meetingEncounter.ts`, `src/data/hunger-catalog.ts`, `src/data/meeting-dilemma-library.ts`, `src/data/candidate-vignettes.ts`, `src/data/meeting-narrative-prose.ts`, `src/engine/meetingEncounter.ts`, `src/engine/ascendantLens.ts`, `src/components/MeetTheFirst/MeetTheFirstFlow.tsx`, `src/components/Game/MeetingEncounterModal.tsx`, `src/components/Game/GameView.tsx` (memo deletion), `src/debug-bridge.d.ts`
- Delete: `src/engine/dilemmaSelection.ts` (+ its test file's dead-vocabulary fixtures; surviving assertions move beside `selectDilemmas`'s tests)

## Notes for the executor

- **Slice 1 must be behavior-identical.** It is a type/data reshuffle; if any test's *observed values* change in slice 1, something moved that shouldn't have.
- **Draw-count discipline in slice 2:** an absent lens must consume the same PRNG draws as a present one, or every seeded meeting in every existing test/URL changes. Structure the scoring so rolls happen unconditionally.
- **Do not activate the overlay engine.** Re-typing its keys is in scope; calling it is not — that is the Deferral's charter.
- **The content pass labels, it does not write.** No prose edits in the library; only resonance-block tags from the closed union. If a dilemma's themes genuinely fit no union tag, widen the union in the same PR (it is the vocabulary authority, not a cage) — never invent an untyped string.
- **`node --experimental-strip-types` cannot load the data modules** (extensionless imports); measurement probes go through vitest, per the standing pattern.
- Map decisions are settled; a contradiction found mid-implementation is a Linear comment against this doc, not a silent redesign.

## Kill criteria

- **The no-op gate cannot reach coverage without prose rewrites** (labeling turns out to require re-authoring dilemma text) → the content estimate was wrong; stop the pass, comment on this doc with the measured cost, re-scope before continuing.
- **Draw-count discipline proves impossible without forking `selectDilemmas`** → the additive-param design is wrong; surface on this doc before writing a V3 picker.
- **The closed `ResonanceTag` union churns on every content PR** (weekly widenings) → the closed-union bet failed; propose the fallback (string + lint against the hunger tag superset) as an amendment, don't silently untype.

## Intent-judge verdict

**Allow** (2026-08-27; impact class Reversible, judge-confirmed). 0 GAPs, 0 VIOLATIONs across all eleven dimensions; nine in-tree factual claims (dormant modules, dead memo, duplicate exports/weights, dead field values, mutex-reason inapplicability) independently verified by the judge. The scope extension beyond bare vocabulary work (reader wiring + content labeling pass) was judged intent-faithful on the ticket's own title ("a resonance weight that can actually fire") and the measured absence of any firing data channel. Non-blocking notes: the THR-1212 kill-criterion comment and the mutex-reversal record must actually land on Linear at handoff (THR-688 rule B requires the reason *recorded*); executor greps for the GameView memo rather than trusting line numbers. Proposal: `Docs/plans/.intent-proposals/2026-08-27-hunger-vocabulary-unification.md`.

## Forked-audit verdicts

*Generated by design-audit-pipeline — 2026-08-27*

### NFP audit

| NFP | Verdict | Evidence |
|-----|---------|----------|
| 1. Tunability | PASS | 6 named constants tabled (`HUNGER_RESONANCE_WEIGHT`, `DRIVE_RESONANCE_WEIGHT`, `ANTI_RESONANCE_PROBABILITY`, `RESONANCE_TIE_JITTER`, `VIGNETTE_HUNGER_RESONANCE_WEIGHT`, `HUNGER_RESONANCE_MIN_COVERAGE`); duplicate weight symbol renamed so no knob has two homes |
| 2. Inspectability | PASS-with-note | No tick trace (not tick-loop code) — substituted with persisted `DilemmaSelectionRecord` on `meetingChoiceRecord`, readable via `getMeetingState()`; wiring table fills Debug-visibility column per row; rationale stated, not omitted |
| 3. Determinism | PASS | Reuses existing seeded `createSeededRng(seed,'dilemma_select')`; explicit fixed draw-count discipline so an absent lens still consumes identical rolls |
| 4. Fail-soft | PASS-with-note | 5-row fail-soft table covers runtime cases (unknown hunger, no lens, empty register, zero-resonance hunger); one deliberate exception — merged-catalog totality is compile-time fail-loud, cited as the machinery doc's documented exception |
| 5. Narrative over mechanical | PASS | "resonance weighs, never gates"; anti-resonance valve preserved; zero prose rewritten |
| 6. Additive over destructive | PASS-with-note | Deletions (dormant `dilemmaSelection.ts`, dead `GameView.tsx` memo, second `HUNGER_CATALOG`, 10 dead `hungerResonance` entries) are each backed by measured-zero-caller/zero-fire evidence in-doc, consistent with the sunset-by-default precedent — not casual removal |
| 7. Performance budget | PASS | O(pool × tags) at meeting-build time, once per playthrough; no tick-loop cost, no new PRNG streams |

NFP AUDIT: PASS-with-notes (see rows above)

### Three-pillar audit

| Pillar | Verdict | Finding |
|--------|---------|---------|
| Engine | present-and-substantive | Systems design, graph nodes/edges, tick phases, resolution logic, and PRNG callouts all filled with concrete mechanism (typed id space, resonance scoring in `selectDilemmas`, draw-count discipline) |
| Content | present-and-substantive | Data tables section carries real content work (catalog merge + 157-dilemma resonance-tag authoring pass gated by a no-op coverage gate); Encounter templates/Prose tables/Attachment content correctly marked N/A with one-line reasons |
| UI | present-and-substantive | No new surface, but subsections are filled rather than stubbed: player-facing effect stated, debug inspection wired to existing `getMeetingState()`, and a concrete evidence route given for the Done-when; Event notifications/Visual presence correctly marked None/N/A |

**Missing required sections:** None.

**Wiring check:** Yes — the Wiring table maps each touched module to orchestrator phase / UI component / GameState field / trace / debug visibility per `wiring-checklist.md`'s column convention, including an explicit "deleted" row for the retired dormant module.

**Substrate-existence check:** PASS. A `## Substrate inventory` section opens the doc and states extends/reuses/retires/leave-dormant for each named subsystem. Cross-checked against `Docs/canon/systems-inventory.md`: "Encounters & Dilemmas" is a real 🟢 ACTIVE inventory entry, and `dilemmaSelection.ts` appears in the inventory's module list under the `dilemma` grouping — consistent with the plan's claim that it is 🟠 DORMANT with zero production callers. The plan does not green-field-duplicate this subsystem; it explicitly retires the dormant duplicate and folds its logic into the live `selectDilemmas` reader, and separately marks the lens-overlay engine "leave-dormant, typed" rather than silently activating or ignoring it.

PILLAR AUDIT: PASS

### Vision audit

**Premises touched:** `02-non-negotiables.md` → narrative-over-mechanical — confirmed; god/protagonist separation — confirmed (the resonance weight is a *nudge* — weighted pick + `ANTI_RESONANCE_PROBABILITY` variety valve, never a gate — shaping which formative tests The First faces; the god influences, doesn't dictate; consistent with the nudge-model pivot). `01-core-loop.md` → untouched (one-time pre-tick bonding flow, not the portfolio-scan loop). `00-north-star.md` → plausibly served — the god's Hunger choice becomes causally consequential, not just prose flavor. `03-design-tensions.md` / `taste-profile.md` → not engaged.

**Contradictions:** No contradictions found. Numerals stay off player surfaces (scoring is selection-side only); resonance weighs rather than gates; the anti-resonance valve preserves surprise.

**Qualitative checks:** North star: plausibly toward it. Core loop: preserved. Non-negotiables: inside them — weighting, not control. Design tensions: none leaned on. Taste profile: no visible conflict.

VISION AUDIT: PASS-with-notes — original finding: Vision premises were cited via the NFP table rather than by file path *(resolved post-audit: the plan's `## Vision audit` section now cites premises by Vision file)*.
