# Large-map stall fix — `phaseAgentDecision` super-linear awareness scan + distance-matrix cap

- **Issue:** THR-581 (parent THR-570; follow-on from THR-580 diagnosis)
- **Project:** Engine Observability & Performance (Now)
- **Date:** 2026-07-04
- **Author:** Cowork (keep-work-flowing scheduled design pass)
- **Type:** Engine performance fix (technical remediation of a diagnosed bug; no creative-direction change)
- **Priority:** High

---

## 1. Problem

Per THR-580's instrumentation (seed 42, `--map large`, `profile 80`, ~1026 agents):

- `agent_decision` averages **291 ms/tick** — 10–20× every other phase.
- Medium map (449 agents) = 21 ms; large (1026 agents) = 291 ms → **~14× cost for ~2.3× agents** ⇒ **super-linear**.
- The slowest tick (40, 1499 ms) had **no** distance-matrix rebuild, demoting the "rebuild storm" hypothesis.
- `[DistanceMatrix] Location count (1777–1807) exceeds MAX_DISTANCE_MATRIX_SIZE (1200)` fires continuously — 577+ locations return `getDistance() → Infinity`.

## 2. Root cause (verified by source read, not just profiling)

The super-linear factor is the **per-agent encounter-awareness pre-filter**, not the distance matrix.

Path (`src/engine/phaseAgentDecision.ts`):

```
for (const actor of actors) {                       // ~1026 agents
  ...
  const nearbyEntries = encounterCache.getEntriesNearHex(   // line ~520
    agentHex.col, agentHex.row, spatialQueryRange);          // spatialQueryRange = 7 (const)
  const filterResult = runFilterPipeline(mergedEntries, ...) // hex-distance awareness
}
```

`spatialQueryRange = MAX_AWARENESS_HOPS(5) + EDGE_HEX_AWARENESS_BONUS(1) + 1 = 7` — a **constant**. So the query radius is fine. The cost is *inside* `getEntriesNearHex` (`src/engine/encounterCache.ts`):

```ts
getEntriesNearHex(col, row, maxRange) {
  if (this.byHex.size === 0) return this.getAllEntries();
  const result = [];
  for (const [key, coord] of this.hexCoords) {        // ← scans EVERY occupied hex
    if (hexDistance({col,row}, coord) <= maxRange) {
      const entries = this.byHex.get(key);
      if (entries) result.push(...entries);
    }
  }
  return result;
}
```

The method advertises "O(nearby hexes)" but actually iterates **all** occupied hex buckets (`this.hexCoords`) and computes `hexDistance` per bucket, **for every agent, every tick**. As the map fills (settlement + sublocation spawning drives locations from ~584 → 1777+ mid-run), occupied-hex count grows *and* agent count grows:

> **agent_decision cost ≈ agents × occupied_hexes** — a product of two map-size-growing terms ⇒ super-linear. This matches the 14×/2.3× evidence exactly.

The distance-matrix `Infinity` (fix direction #2 in the issue) is a **real but secondary** correctness issue affecting `idleBehavior.ts` / scoring — it does **not** drive the `agent_decision` baseline (the awareness pre-filter uses `hexDistance`, not `getDistance`).

## 3. Fix

### 3.1 Primary — bounded hex-neighborhood probe (Engine)

Replace the "scan all occupied hexes" loop in `getEntriesNearHex` with a **bounded-box probe**: enumerate only hex keys within `maxRange` of `(col,row)` and look each up directly in `byHex`. Because `maxRange` is a small constant (7), this is **O(1) in map size** (~a few hundred key probes) instead of O(occupied_hexes).

```ts
getEntriesNearHex(col, row, maxRange) {
  // Self-tuning: on small maps, scanning the few occupied hexes is cheaper
  // than probing the (2R+margin)² neighborhood. Above the threshold, probe.
  if (this.byHex.size === 0) return this.getAllEntries();
  if (this.hexCoords.size <= NEIGHBORHOOD_PROBE_THRESHOLD) {
    return this._scanAllOccupied(col, row, maxRange); // current behavior, extracted
  }
  const result: EncounterCacheEntry[] = [];
  // Bounding box with a row margin to cover offset-coordinate vertical skew.
  const rowMargin = maxRange + Math.ceil(maxRange / 2);
  for (let c = col - maxRange; c <= col + maxRange; c++) {
    for (let r = row - rowMargin; r <= row + rowMargin; r++) {
      if (hexDistance({ col, row }, { col: c, row: r }) > maxRange) continue;
      const entries = this.byHex.get(hexKey(c, r));
      if (entries) result.push(...entries);
    }
  }
  return result;
}
```

Notes for the implementer:
- The box must be a **superset** of the true hex-disk (offset coords skew vertically), then filtered by the real `hexDistance ≤ maxRange`. The `rowMargin` above is generous; keep the `hexDistance` filter so correctness never depends on the box being tight.
- **Determinism (load-bearing):** the returned entry *set* is identical to the old scan, but the **order** differs (box iteration order vs. `hexCoords` insertion order). Downstream ranking/tie-breaks must be order-independent, OR sort the result deterministically (e.g. by `entry.id`) before returning. Add a note + guard; do not let this silently change `--seed 42` output. Verify with the equivalence smoke below.

### 3.2 Secondary — distance-matrix cap (Engine, optional, evidence-gated)

Raise `MAX_DISTANCE_MATRIX_SIZE` (`src/engine/distanceMatrix.ts`) `1200 → 2400` to cover realistic large-map mid-run counts (~1777–1807) with headroom. This is additive (a larger index). **Gate:** only ship if, after 3.1, the `distance_matrix_rebuild` trace (from THR-580) shows rebuild cost is still material, and only after measuring memory + rebuild time at 2400 via the new `distance_matrix_rebuild` timing (O(N²) memory: ~5 MB at 1200 → ~17 MB at 2400; acceptable, but confirm). If memory/rebuild proves costly, prefer the alternative: make `idleBehavior`/scoring resilient to `Infinity` (treat unindexed as "far, not fallback-scanned"). Do **not** bundle a `structuralCacheVersion` split here — that's THR-570's tertiary idea and out of scope.

### 3.3 Verification instrument (Engine, reuse THR-580)

Add one `emitPhaseTiming` bracket around the awareness pre-filter + `runFilterPipeline` block inside `phaseAgentDecision` (sub-phase `agent_decision_awareness`) so the fix is *measured*, not assumed, and future regressions are caught by the Phases tab / CLI `profile`.

## 4. Three-pillar coverage

| Pillar | Status | Detail |
|--------|--------|--------|
| **Engine** | ✓ | `getEntriesNearHex` neighborhood probe; optional distance-matrix cap raise; one timing bracket. |
| **Content** | N/A | No content, prose, or template change. |
| **UI** | N/A (player) / ✓ (dev) | No player-facing surface. Dev verification uses the existing THR-580 PhasesDebugTab + CLI `profile`. **Browser-verify exempt:** perf fix, no player-facing render change; acceptance is CLI profiler evidence (§7). |

## 5. Constants table (NFP #1)

| Constant | File | Default | Purpose |
|----------|------|---------|---------|
| `NEIGHBORHOOD_PROBE_THRESHOLD` | `encounterCache.ts` | `200` | Occupied-hex count above which `getEntriesNearHex` switches from scan-all to bounded-box probe. Keeps small/medium maps on the cheaper path. Tune if profiling shows a different crossover. |
| `MAX_DISTANCE_MATRIX_SIZE` | `distanceMatrix.ts` | `1200 → 2400` | (Secondary/gated) index cap; raise to cover large-map mid-run location counts. |

`spatialQueryRange` (7), `MAX_AWARENESS_HOPS` (5), `EDGE_HEX_AWARENESS_BONUS` (1) are unchanged existing constants — referenced, not modified.

## 6. Fail-soft table (NFP #4)

| Case | Behavior |
|------|----------|
| `byHex` empty | Existing fallback: `getAllEntries()`. Unchanged. |
| Occupied hexes ≤ threshold | Scan-all path (current behavior). Unchanged. |
| Box misses a valid hex due to skew | Prevented by generous `rowMargin` + true `hexDistance` filter; equivalence test (§7) guards it. Worst case = agent slightly less aware — graceful, never throws. |
| Distance matrix over cap (if 3.2 skipped) | Unchanged from today: `getDistance → Infinity` (existing behavior; not on the hot path). |

## 7. Acceptance / verification (mandatory evidence)

1. **Equivalence unit test** (correctness parity): for a set of random occupied hexes and query points, assert `getEntriesNearHex`-probe returns the **same set** (id-equal, order-normalized) as the old scan-all. This is the determinism/correctness gate.
2. `npm test`, `npx tsc --noEmit`, `npx vite build` — all green (paste raw output).
3. **Engine smoke:** `printf "tick 30\nstatus\nexit\n" | npm run cli -- --seed 42 --map medium` — reaches tick 30, non-zero agents, trace lines present.
4. **Determinism:** `--seed 42 --map medium` status output identical before/after (no divergence).
5. **The fix, measured — before/after profiler:** `printf "profile 80\nexit\n" | npm run cli -- --seed 42 --map large`. Paste the per-phase table before and after. **Pass criterion:** `agent_decision` avg drops materially (target: from ~291 ms toward the medium-map ~21 ms constant-factor regime; concretely aim < ~60 ms avg at 1026 agents) and total slowest-tick time falls below the ~1 s stall band. Confirm the run no longer stalls at tick ~72 on large.

## 8. Blast radius (Codesight)

- `src/engine/encounterCache.ts` — `getEntriesNearHex` has exactly **2 callers**, both in `phaseAgentDecision.ts` (lines ~340, ~520). Not in the ≥100-importer high-impact list. Low blast radius; change is internal to one method + one new constant.
- `src/engine/distanceMatrix.ts` (3.2, optional) — `getDistance` consumers: `idleBehavior`, `orchestrator`, `phaseAgentDecision`, `simulationRuntime`, `socialEncounterGeneration`. Cap raise is additive/semantics-preserving (a larger index only removes `Infinity` cases).
- `src/engine/phaseAgentDecision.ts` — one added timing bracket; no logic change. **Mutex-sensitive:** see coordination block.

## 9. NFP compliance

| NFP | Verdict |
|-----|---------|
| 1 Tunability | PASS — `NEIGHBORHOOD_PROBE_THRESHOLD` + cap are named constants. |
| 2 Inspectability | PASS — new `agent_decision_awareness` timing bracket makes the fix measurable. |
| 3 Determinism | PASS **with note** — must preserve entry-set + stable order; equivalence + seed-parity tests gate it. |
| 4 Fail-soft | PASS — box + hexDistance filter + scan-all fallback; never throws. |
| 5 Narrative | N/A. |
| 6 Additive | PASS — extracts current loop as `_scanAllOccupied`; adds a branch; no destructive rewrite. |
| 7 Perf budget | PASS — this *is* the profile-first perf fix; verified by §7.5 before/after. |

## 10. Out of scope / follow-ups

- `structuralCacheVersion` fine-grained split (THR-570 tertiary) — not needed if §3.1 resolves the stall.
- Migrating the remaining ~46 inline phases (THR-582) — separate deferral.
