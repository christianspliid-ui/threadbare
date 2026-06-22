# THR-467 Phase 0 — Encounter Surface Foundation

**Author:** Cowork · **Date:** 2026-06-22 · **Status:** implementation-ready
**Parent design:** `Docs/plans/2026-06-22-encounter-volume-scaling-design.md` (director-endorsed 2026-06-22)
**Parent issue:** THR-467 · **Project:** Content Architecture
**Companion audit:** `Docs/audits/2026-06-22-encounter-content-and-delivery-assessment.md`

## Why this is the first executable unit

The parent design scales the library toward ~1,000+ encounter *surfaces* by decoupling the
player-facing surface (a distinct experience) from the authored template, then multiplying
surfaces via context binding (Tier 2). None of that authoring can begin until the engine can
**name and track a surface as a unit distinct from its template.** Phase 0 builds that naming
layer — no content authored yet — and harvests one immediate win along the way.

**The immediate win:** the current novelty/recency system keys on `templateId` only
(`EncounterNoveltyRecord.globalLastSelected` and per-agent `agentNoveltyLastSelected`, both
`Record<templateId, tick>`, applied via `computeNoveltyMultiplier()` in
`src/engine/encounterScoring.ts:572`). But the `EncounterCacheEntry`
(`src/engine/encounterCache.ts:80`) *already* carries latent context — `reachPrimary`,
`encounterType`, `sublocationTypeId`, `targetAgentId`. Re-keying novelty onto a **surface key**
derived from those existing fields makes "the same template firing at a guild vs a road vs a
shadow-court" count as *different* surfaces for recency purposes — which directly raises entropy
and attacks the template-concentration THR-464 flags, **before any Tier-2 content exists.**

## Scope (and explicit non-scope)

**In scope (Phase 0):**
1. A `surfaceKey` schema + a pure `computeSurfaceKey(entry)` derivation over context axes that
   exist on the cache entry today.
2. Re-key novelty tracking (global + per-agent) from `templateId` → `surfaceKey`.
3. A deterministic, tunable **volume/replayability model** script so the ~1,000-surface target
   is computed from named constants, not asserted.
4. Debug-panel + trace visibility into which surface key fired.

**Explicitly NOT in scope (later phases — do not build here):**
- Tier-2 context-fragment authoring format or per-slot fragment tables (Phase 2).
- The `template-context-rewrite` skill (Phase 2).
- Tier-3 procedural grammar (Phase 3).
- Per-run pool partitioning / `RUN_POOL_MIN_ELIGIBLE` enforcement (Phase 4).
- Any new authored encounter content.

Phase 0 is a foundation + one structural win. Surface *production* (multiplication) is Phase 1+.

---

## Engine pillar

### 1. Surface key schema + derivation

Add a pure module `src/engine/encounterSurface.ts`:

```ts
/** A surface is a template bound to a context. The key is its identity for novelty/recency. */
export type SurfaceKey = string; // canonical "templateId|axis1=val|axis2=val|..."

export function computeSurfaceKey(
  entry: Pick<EncounterCacheEntry,
    'templateId' | 'reachPrimary' | 'encounterType' | 'sublocationTypeId' | 'targetAgentRole'>,
): SurfaceKey
```

- **Axes (Phase 0, from fields present today):** `templateId` (always) + the subset named in the
  `SURFACE_KEY_AXES` constant. Default axes: `sublocationTypeId` (location-context, the Arkham
  lever), `reachPrimary` (the action's domain flavor), and `socialRole` for social encounters
  (derived from the target agent's role; `null` for non-social). `encounterType` is implied by
  template and excluded to avoid redundant cardinality.
- **Canonical, order-stable serialization** (sorted axis names) so two runs produce byte-identical
  keys → determinism (NFP #3). Null/absent axis values are omitted, not stringified as `"null"`,
  so a template with no sublocation collapses to a stable lower-cardinality key.
- `targetAgentRole` is **not** currently on `EncounterCacheEntry`. Add it as an optional
  precomputed field on the cache entry (additive, NFP #6), populated where `targetAgentId` is
  set during social-candidate generation in `phaseAgentDecision.ts`. If unavailable at cache time,
  resolve lazily from the graph at key-compute time with a fail-soft fallback to `null`.
- **Cardinality guard:** `computeSurfaceKey` must never produce unbounded keys. Because every axis
  draws from a closed enum (reach roster, sublocation type registry, role enum), cardinality is
  bounded by construction; assert this with a unit test enumerating axis domains.

### 2. Re-key novelty onto surface keys

`EncounterNoveltyRecord` (`encounterScoring.ts:523`) keeps the same TypeScript shape
(`Record<string, number>`) — only the **key semantics** change from `templateId` to `surfaceKey`.
No type-signature change ⇒ no ripple through importers (see Blast Radius).

- `computeNoveltyMultiplier(noveltyRecord, agentNoveltyLastSelected, key, reach, tick)` — change
  the third argument from `entry.templateId` to `computeSurfaceKey(entry)` at the call site
  (`encounterScoring.ts:1091`). The function body is unchanged.
- Per-agent write site (`phaseAgentDecision.ts:984-1005`): write the `surfaceKey` of the selected
  entry, not its `templateId`.
- `categoryWindowCounts` stays keyed on **reach-category** (unchanged) — the per-reach quota is
  intentionally coarser than the surface and should not be re-keyed.
- **Migration (additive, fail-soft):** an existing save's `globalLastSelected` is keyed by old
  `templateId` strings. These are simply stale keys that decay out of relevance within
  `NOVELTY_*` half-lives; no migration code required. Document this as intended decay, not data loss.

### 3. Volume / replayability model script

`scripts/encounter-volume-model.ts` (mirrors `scripts/gameplay-report.ts`; `npm run volume-model`):
- Reads the named constants below, computes the derived table from the design doc §46
  (eligible pool per run, total library) and prints it as md + json to
  `Docs/playtests/coverage/YYYY-MM-DD-encounter-volume-model.{md,json}`.
- Pure arithmetic, no PRNG, no graph load → deterministic; two runs identical.
- Purpose: the ~1,000 target becomes a tunable output of `SURFACES_PER_RUN_TARGET`,
  `RELEVANT_FRACTION`, `RUNS_BEFORE_REPETITION`, not a number asserted in prose.

### 4. Tracing (NFP #2)

When an encounter is selected, the existing selection trace must additionally emit the
`surfaceKey`, the axis values that produced it, and the `noveltyMultiplier` that resulted — so an
inspector can see *why* a surface was (de)prioritized. Add a `surfaceKey` field to the existing
encounter-selection trace payload (additive). Register any new trace category in
`TRACE_CATEGORIES` (the migration retro flagged missing registrations — do not skip this).

### Constants (NFP #1 — all named, defaults tunable)

| Constant | Default | Purpose |
|----------|---------|---------|
| `SURFACE_KEY_AXES` | `['sublocationTypeId','reachPrimary','socialRole']` | Which context axes form the surface key |
| `SURFACES_PER_RUN_TARGET` | `88` (midpoint 75–100) | Volume-model input |
| `RELEVANT_FRACTION` | `0.5` | Fraction of library eligible per run |
| `RUNS_BEFORE_REPETITION` | `9` | Replayability target |
| (derived) `RUN_POOL_MIN_ELIGIBLE` | computed ~150–200 | Output of the model (enforced in Phase 4, not here) |

Novelty half-life constants (`NOVELTY_*`) are **reused unchanged** — re-keying does not retune them.
If Phase 1 KPI shows the surface-granular penalty is too weak/strong, retune there, not in Phase 0.

### Fail-soft (NFP #4)

| Failure | Fallback |
|---------|----------|
| An axis value can't resolve (e.g. target role missing) | Omit that axis from the key; never throw |
| `computeSurfaceKey` receives a malformed entry | Return `templateId` alone as the key (degrades to today's behavior) |
| Volume-model constant missing/NaN | Skip that row, emit warning, never abort the script |
| Old `templateId`-keyed novelty entries in a loaded save | Treated as stale keys; decay naturally |

---

## Content pillar

**N/A for Phase 0, with rationale.** Phase 0 authors no encounter content — it builds the surface
*naming* layer that Phase 1+ authoring depends on. The first content work (retrofitting existing
linear families into context-multiplied surface generators) is Phase 1 (THR-467 follow-up issue),
gated on Phase 0's measurements. The volume-model script is a planning artifact, not game content.

---

## UI pillar

Encounter surface rendering is already shipped (Encounter Experience v1) and unchanged — a surface
renders exactly as its template does today. Phase 0 adds **debug visibility only**:

- The Debug Panel's encounter-inspection view must display, for the most recently selected
  encounter, its `surfaceKey`, the axis values, and the applied `noveltyMultiplier`.
- Expose on `window.__DEBUG` a read of the current surface-novelty record (e.g.
  `window.__DEBUG.getEncounterNoveltyRecord()`) for the Definition-of-Done state assertion.

**Browser-verify artifact (Definition of Done):** because this touches `src/components` (Debug
Panel) the closeout must include a 1920×1080 screenshot of the Debug Panel showing a populated
`surfaceKey`, captured console (errors+warnings), and a `__DEBUG` state assertion proving the
novelty record is surface-keyed. The encounter map is DOM (Debug Panel), so **Playwright** is the
correct capture tool here (not Claude-in-Chrome — no WebGL surface changes).

---

## Wiring section

| Module | Hook |
|--------|------|
| `encounterSurface.ts` (`computeSurfaceKey`) | Called from `encounterScoring.ts` novelty call site (1091) and from the per-agent write in `phaseAgentDecision.ts` (984-1005) |
| Novelty record | Same `GameState.encounterNoveltyRecord` field; semantics surface-keyed |
| Cache entry | New optional `targetAgentRole` field on `EncounterCacheEntry`, populated in social-candidate generation |
| Traces | `surfaceKey` added to encounter-selection trace; category registered in `TRACE_CATEGORIES` |
| Debug panel | Reads surfaceKey from latest selection trace / novelty record |
| `scripts/encounter-volume-model.ts` | New `npm run volume-model` script; output to `Docs/playtests/coverage/` |

Update `Docs/plans/wiring-checklist.md` (new script + trace field + cache field) and the
systemic-wiring-guide **only when Phase 2 lands the authoring capability** — Phase 0 adds no
content-author-facing capability, so the wiring guide is N/A this phase (note it explicitly).

## Blast Radius

Phase 0 touches two high-importer files, **additively only**:

- `src/types/gameState.ts` (176 importers) — **no signature change.** `encounterNoveltyRecord`
  already exists; only key *semantics* change. Risk: none at the type level; the cascade list does
  not need touching.
- `src/engine/encounterScoring.ts` (high fan-in within engine) — the `computeNoveltyMultiplier`
  *signature* is unchanged (still takes a `string` key); only the argument passed changes. Risk
  contained to the selection path.
- `EncounterCacheEntry` gains one optional field — additive; existing construction sites compile
  unchanged.

No ≥100-importer file changes shape. The semantic change to novelty keys is behavior-affecting
(selection distributions shift) — covered by the determinism + engine-smoke gates below, not by a
type cascade.

## NFP compliance

| NFP | Verdict |
|-----|---------|
| 1 Tunability | PASS — surface axes + volume-model inputs are named constants |
| 2 Inspectability | PASS — surfaceKey + axis values + noveltyMultiplier traced and debug-visible |
| 3 Determinism | PASS — canonical sorted serialization; no PRNG in key derivation; volume model is pure arithmetic |
| 4 Fail-soft | PASS — fallback table; malformed entry degrades to templateId-only key, never throws |
| 5 Narrative > mechanical | PASS — no prose touched; this is structural plumbing for later narrative scale |
| 6 Additive | PASS — new module + optional cache field + new script; no type signatures broken; old novelty keys decay rather than migrate |
| 7 Performance | PASS with note — `computeSurfaceKey` runs per-candidate inside the ≤40 scored set; it's string concatenation over bounded enums, O(axes). Profile at Phase 1 if the scored set grows |

## Risks & required verification

- **Test-suite instability** (project memory): `npm test` on main is unstable post-TB-120. This
  change touches core selection. The executor must run the **30-tick CLI engine smoke**
  (`printf "tick 30\nstatus\nexit\n" | npm run cli -- --seed 42 --map medium`) and paste the
  `status` tail as evidence — a selection-distribution regression would surface here.
- **Determinism check:** run the volume-model script twice; assert byte-identical output. Run a
  seeded CLI run twice; assert identical encounter-selection traces (surfaceKeys stable).
- Standard gates: `npm test`, `npx tsc --noEmit`, `npx vite build`, paste raw output in the closing
  commit/comment.

## Done when

- `src/engine/encounterSurface.ts` exports `computeSurfaceKey`; unit test enumerates axis domains
  and asserts bounded, order-stable, deterministic keys.
- Novelty global + per-agent records are keyed on `surfaceKey`; `computeNoveltyMultiplier` call
  sites pass surface keys.
- `npm run volume-model` emits dated md+json; two runs identical.
- Encounter-selection trace carries `surfaceKey`; Debug Panel shows it; `window.__DEBUG` exposes the
  surface-keyed novelty record.
- 30-tick CLI smoke reaches tick 30, non-zero agents, traces present; tail pasted as evidence.
- Browser artifact (1920×1080 Debug Panel screenshot + console + `__DEBUG` assertion) in closeout.
- `npm test` / `npx tsc --noEmit` / `npx vite build` evidence pasted. Closing commit body:
  `Fixes <child-issue-id>`.

## Phase exit → unblocks

Phase 1 (prove Tier-2 on existing families) gates on this: it needs surface keys to measure
top-share falling as one template becomes many surfaces (via THR-457 KPI harness).
