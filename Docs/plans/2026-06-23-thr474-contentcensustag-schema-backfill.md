# THR-474 — ContentCensusTag schema backfill (entry-level reach/scale for the thin registries)

**Status:** Implementation-ready (Cowork design pass, 2026-06-23)
**Parent:** THR-469 (Cross-content variety & coverage program) · **Prereq (Done):** THR-473 (Content Census P1 instrument, merged PR #374)
**Project:** Content Architecture
**Author:** Cowork (keep-work-flowing run, 2026-06-23)

---

## 1. Problem (grounded in THR-473's first census run)

THR-473 shipped the Content Census instrument (`npm run content-census` → dated md+json at `Docs/playtests/coverage/`). Its first run produced a **resolvability report** proving that 6 of 8 in-scope registries cannot place their entries in the reach×scale heatmap because they carry no stable entry-level classification axis. Until the entries carry a tag, P2 "author into empty cells" has no cells to author into.

**Resolvability ground truth (2026-06-22 census run):**

| Registry | total | reach% | scale% | both% | needs backfill |
|----------|------:|-------:|-------:|------:|---------------:|
| encounters | 564 | 100 | 100 | 100 | 0 |
| actions | 44 | 100 | 0 | 0 | 44 (scale; out of this issue's scope — see §3) |
| **attachments** | 119 | 92.4 | 0 | 0 | **119** (scale; +2 lack effects-reach) |
| **spells** | 5 | 80 | 0 | 0 | **5** (scale; +1 lacks effects-reach) |
| **artifacts** | 3 | 100 | 0 | 0 | **3** (scale) |
| **conditions** | 6 | 0 | 0 | 0 | **6** (reach + scale) |
| **omens** | 44 | 0 | 0 | 0 | **44** (reach + scale) |
| **sublocations** | 7 | 100 | 100 | 100 | 0 (adapter hardcodes gold/local) |

The 6 registries this issue tags: **attachments, spells, artifacts, conditions, omens, sublocations.** (`actions` keeps its scale inferred-not-authored per THR-473 §2; `encounters` already resolves.)

## 2. The design questions THR-474 must settle (named in the issue)

1. Single dominant reach vs multi-reach set per entry?
2. How is `scale` assigned to types that look "scale-less" (conditions, omens)?
3. Do genuinely-N/A entries get an explicit sentinel, distinct from "untagged"?

### Decisions

**D1 — Single dominant reach, not a set.** The census is a one-entry-one-cell coverage instrument; a multi-reach set would let one entry count toward several cells and corrupt `fill%` (an entry tagged 3 reaches inflates coverage 3×). The tag carries exactly one `reach`. Where an entry genuinely spans reaches (a condition's `domainContributions`, a multi-effect attachment), the tag records the **dominant** reach — "which cell does this primarily serve." This matches the existing `dominantReachFromEffects` adapter helper, so the explicit tag conforms to (and where needed, corrects/fills) the already-derived dominant.

**D2 — "Scale-less" types aren't scale-less; they map onto a constrained subset.** `SCALE_APPLICABILITY` (THR-473 constant) already constrains each registry: conditions → `['personal','local']`, omens → `['regional','cosmic']`. So conditions and omens each pick a scale from their two-value subset, not from the full four. They are authored within that subset, never assigned an inapplicable scale.

**D3 — Three-state resolution: real value · `'n/a'` sentinel · absent (null).** Add an explicit `'n/a'` sentinel to each axis, distinct from `null`. Semantics:

| State | Meaning | Census bucket |
|-------|---------|---------------|
| real `ReachDomain` / `ActionScale` | tagged, occupies a heatmap cell | counts toward fill |
| `'n/a'` | tagged, **deliberately** occupies no cell (the axis is meaningless for this entry) | N/A bucket (already in the heatmap) |
| absent / `null` | **not yet tagged** — a backfill TODO | untagged worklist (`untaggedReason` set) |

This three-way is the load-bearing distinction: it lets the re-run census tell "deliberately non-applicable" apart from "still needs work," so the backfill has a real done-condition (untagged → 0, modulo deliberate `'n/a'`).

## 3. Engine pillar

### 3.1 New type (additive)

Add to `src/engine/contentCensus/types.ts` (NOT to `traits.ts`/`unifiedAction.ts` — avoids touching the 156-importer `ReachDomain` source):

```typescript
export type CensusReach = ReachDomain | 'n/a';
export type CensusScale = ActionScale | 'n/a';

/** Additive census-only classification. Read by the census; ignored at runtime. */
export interface ContentCensusTag {
  reach: CensusReach;
  scale: CensusScale;
}
```

### 3.2 Add an optional `censusTag?` field to each of the 6 entry types

Additive only (NFP #6) — the field is optional, defaulted nowhere, and never read by gameplay. Touch points (entry interfaces, all low-importer):

- `PossessionNodeProperties` (attachments) — `src/data/reward-attachment-catalog.ts` types
- `SpellTemplate` — `src/data/spell-templates.ts`
- `ArtifactTemplate` — `src/data/artifact-templates.ts`
- `TraitDefinitionProperties` (conditions) — `src/data/condition-trait-content.ts`
- `OmenTrackTemplate` — `src/data/omenTemplates.ts`
- `ConditionalSublocationSpec` — `src/engine/phaseSublocations.ts`

### 3.3 Adapter precedence (the resolution contract)

Each registry adapter in `src/engine/contentCensus/adapters.ts` resolves with this fixed precedence (documented, deterministic):

```
reach  = entry.censusTag?.reach ?? <derived>   (then map 'n/a' → N/A bucket; undefined derived → null + untaggedReason)
scale  = entry.censusTag?.scale ?? <derived>   (same)
```

Per-registry `<derived>` fallback (unchanged from THR-473 where it exists, so the tag is purely additive):

| Registry | reach `<derived>` | scale `<derived>` |
|----------|-------------------|-------------------|
| attachments | `dominantReachFromEffects(effects)` | none → `null` |
| spells | `dominantReachFromEffects(effects)` | none → `null` |
| artifacts | `dominantReachFromEffects(effects)` | none → `null` |
| conditions | `dominantReachFromContributions(domainContributions)` (new helper, §3.4) | `CONDITION_DEFAULT_SCALE` |
| omens | none → `null` | none → `null` |
| sublocations | `'gold'` (existing hardcode, now also expressible as explicit tag) | `'local'` |

Net effect: the explicit `censusTag` **wins when present**; otherwise the registry's existing derivation runs. An entry with neither resolves to `null` with an `untaggedReason` — exactly today's behavior. Nothing regresses if a tag is absent.

### 3.4 New helper — dominant reach from a contribution map (conditions)

```typescript
// Deterministic: largest |contribution| wins; ties broken by REACH_DOMAINS order.
function dominantReachFromContributions(
  contributions: Partial<Record<ReachDomain, number>>
): ReachDomain | null
```

Lets conditions resolve reach with **zero per-entry authoring** (`wounded {iron:-0.08, stone:-0.04}` → `iron`). Conditions therefore need only an authored/defaulted `scale`; reach is derived. (Authors may still set an explicit `censusTag.reach` to override.)

### 3.5 Census bucketing for `'n/a'`

`buildCensus` / the heatmap builder must route an entry whose resolved reach or scale is `'n/a'` into the existing **N/A** bucket (already a column in the P1 output) rather than treating it as a filled or untagged cell. `null` stays in the untagged worklist. No new output surface — the P1 md/json already has filled / desert / empty / N/A / untagged columns.

### 3.6 Constants (NFP #1)

Add to `src/engine/contentCensus/constants.ts`:

| Constant | Default | Purpose |
|----------|---------|---------|
| `CONDITION_DEFAULT_SCALE` | `'personal'` | Conditions describe a single agent's body/mind; author `'local'` only for place/group conditions. |
| `OMEN_REACH_HINTS` | mapping table (§4) | Authoring guidance: omen `category`/`doomArchetype` → suggested reach. Advisory; authored values win. |
| `OMEN_DEFAULT_SCALE` | `'regional'` | Omens default regional; author `'cosmic'` for world-doom omens. |
| `CENSUS_NA = 'n/a'` | `'n/a'` | The sentinel string, named once. |

Existing reach-magnitude tie-break reuses `REACH_DOMAINS` order (already exported from `traits.ts`).

### 3.7 Tracing / inspectability (NFP #2)

No game-tick traces (census is headless, no PRNG). Inspectability is served by the **resolvability report**: it already reports, per registry, the % resolvable and the untagged worklist. This issue's success is visible there — re-running the census after backfill must show the 6 registries' untagged counts drop to 0 (minus any deliberate `'n/a'`). Add to the report, per entry, a `resolvedVia: 'explicit' | 'derived' | 'na' | 'untagged'` field so a reviewer can see whether a cell was hand-tagged or inferred.

### 3.8 Fail-soft (NFP #4)

| Failure case | Fallback |
|--------------|----------|
| `censusTag` absent | run existing per-registry derivation → `null` + `untaggedReason` (today's behavior) |
| `censusTag` malformed (bad reach/scale string) | treat as untagged; `untaggedReason='malformed censusTag'`; never throw |
| `domainContributions` empty (condition) | reach → `null` + untaggedReason; scale still defaults |
| `effects[]` carries no reach (attachment/spell) | `dominantReachFromEffects` returns `null` (today's behavior) |
| reach or scale = `'n/a'` | route to N/A bucket; never counted as filled |

Adapters keep their existing per-entry `try/catch` — one bad entry never breaks the run.

## 4. Content pillar — the tag values (bulk authoring driven by THR-473's worklist)

The actual `censusTag` values are the content work, enumerated by THR-473's untagged worklist. Authoring is near-mechanical because each registry already carries strong signal:

- **attachments (119):** `reach` defaults from `effects[].reach` (already 92.4% resolvable) and from existing `#reach` tags (e.g. `#iron` on Bronze Spear); author `scale` from tier/role — most arms/tools/vestments are `local`, regalia/relics that act on a region are `regional`, world-relics `cosmic`. Fix the 2 no-effects-reach entries with an explicit `reach`.
- **spells (5):** `reach` from `effects[].reach`; `scale` from targeting (`self`/single-target → `local`, area/regional → `regional`, world-altering → `cosmic`). Fix the 1 no-effects-reach spell.
- **artifacts (3):** `reach` from effects; `scale` — god-tier artifacts skew `cosmic`/`regional`.
- **conditions (6):** `reach` derived from `domainContributions` (no authoring); `scale` = `'personal'` for all 6 current conditions (they are per-agent body/mind states).
- **omens (44):** `reach` authored from `OMEN_REACH_HINTS` (e.g. `doom_echo` → `veil`/`shadow`; `sphere_surge` → the reach aligned to the surging sphere; `cultural` → `heart`/`gold`; `seasonal` → `stone`/`star`); `scale` from `category`/`doomStageRange` (world-doom → `cosmic`, else `regional`).
- **sublocations (7):** explicit `censusTag {reach:'gold', scale:'local'}` on each spec, retiring the adapter hardcode so the data is the single source of truth (low cost, optional but recommended).

**Editorial rule (the one judgment call per entry):** dominant reach = the reach the entry *primarily* serves (largest effect-count or `|contribution|`); scale = the broadest layer the entry meaningfully acts on, constrained to the registry's `SCALE_APPLICABILITY` subset. When an axis is genuinely meaningless, tag `'n/a'` — do **not** leave it `null` (null means "not yet done").

**Done-condition for the content pass:** re-run `npm run content-census`; the 6 registries show 0 untagged entries (deliberate `'n/a'` excepted, and listed).

## 5. UI pillar — N/A (with rationale)

No game-facing UI. The census result is a CLI md+json artifact (`Docs/playtests/coverage/YYYY-MM-DD-content-census.{md,json}`), already shipped by THR-473. No component, modal, HexMap signifier, alert/toast, or `__DEBUG` surface changes. **Browser-verify exempt: no runtime UI; output is a headless data artifact** (state this verbatim in the closing commit per CLAUDE.md §Browser-verify UI changes). Debug inspection is the resolvability report's new `resolvedVia` field (§3.7).

## 6. Wiring

| Module | Wiring |
|--------|--------|
| `contentCensus/types.ts` | new `ContentCensusTag`, `CensusReach`, `CensusScale` |
| `contentCensus/adapters.ts` | 6 adapters read `entry.censusTag` with §3.3 precedence; new `dominantReachFromContributions`; emit `resolvedVia` |
| `contentCensus/constants.ts` | §3.6 constants |
| 6 registry entry interfaces | optional `censusTag?: ContentCensusTag` |
| `scripts/content-census.ts` runner | unchanged invocation; report gains `resolvedVia`/n-a accounting |

No orchestrator/tick/PRNG/GameState involvement — this is offline instrumentation. No `wiring-checklist.md` surfaces (orchestrator phase, modal, GameState field, trace category, player control) are added.

## 7. Blast radius (Codesight pre-flight)

No high-impact (≥100-importer) file is **modified**. `ReachDomain` (traits.ts, 156 importers) and `ActionScale` (unifiedAction.ts) are **imported, not changed**. The new type lives in `contentCensus/types.ts` (low importer count). The 6 entry-interface edits add one optional field each to data-entry types with modest importer counts. **No Blast Radius section required.**

## 8. NFP compliance

| NFP | Verdict | Note |
|-----|---------|------|
| 1 Tunability | PASS | `CONDITION_DEFAULT_SCALE`, `OMEN_REACH_HINTS`, `OMEN_DEFAULT_SCALE`, `CENSUS_NA` named. |
| 2 Inspectability | PASS | resolvability report + new `resolvedVia` per entry. |
| 3 Determinism | PASS | no PRNG; magnitude/count ties broken by fixed `REACH_DOMAINS` order; two runs identical. |
| 4 Fail-soft | PASS | §3.8 table; adapters never throw; missing tag → today's null behavior. |
| 5 Narrative > mechanical | PASS (note) | instrumentation; no narrative surface. |
| 6 Additive > destructive | PASS | optional field; runtime resolution unchanged; absent tag = current behavior. **This is the issue's spine.** |
| 7 Performance budget | PASS | offline batch; negligible. |

## 9. Done-when

- [ ] `ContentCensusTag` / `CensusReach` / `CensusScale` defined in `contentCensus/types.ts`; optional `censusTag?` added to the 6 entry interfaces (additive).
- [ ] 6 adapters read `censusTag` with §3.3 precedence; `dominantReachFromContributions` added; `'n/a'` routed to N/A bucket; `resolvedVia` emitted.
- [ ] §3.6 constants added.
- [ ] Tag values authored against THR-473's untagged worklist; re-run `npm run content-census` shows the 6 registries at 0 untagged (deliberate `'n/a'` listed).
- [ ] Determinism check: two census runs identical.
- [ ] `npm test` + `npx tsc --noEmit` + `npx vite build` clean.
- [ ] Closing commit body: `Fixes THR-474` + verification evidence (census tail + test/tsc/build output). **Browser-verify exempt: headless data artifact, no runtime UI.**

## 10. Coordination

- **Suggested model:** sonnet (adapter precedence + per-entry dominant-reach/scale judgment across heterogeneous registries; matches THR-473's sonnet call)
- **Parallel-safe with:** THR-475 (encounter surface foundation — different engine area), THR-476 (find-first content-lint — read-only over templates), all content-authoring read-only work
- **Mutex with:** none (new field + new adapter logic; no shared mutable file with an active issue)
- **Codex review:** no (verified by deterministic census output + spot-checks of the resolvability report)
