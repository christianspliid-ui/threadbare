# THR-290 — Wire FACTION_ENCOUNTER_TEMPLATES into Unified Registry + Fix Consumers

**Date:** 2026-04-28
**Project:** Encounter Format Migration
**Issue:** [THR-290](https://linear.app/threadbare/issue/THR-290)
**Parent:** THR-102 (deferral; PR #66 merged additive, leaving the unified export orphaned and two consumers fragile)
**Type:** Mechanical wiring + consumer-side robustness; no behavior change for the normal path.

---

## Context

In PR #66 (THR-102), Codex's additive migration added a converted unified export for the 18 Adventuring Guild templates plus lifecycle and social templates:

```ts
// src/data/faction-encounter-content.ts:1242
export const FACTION_ENCOUNTER_TEMPLATES: UnifiedActionTemplate[] = [
  ...LEGACY_FACTION_QUEST_TEMPLATES,      // 18 quest templates
  ...FACTION_LIFECYCLE_TEMPLATES,          // FACTION_JOIN_TEMPLATE, FACTION_PROMOTION_TEMPLATE
  ...FACTION_SOCIAL_TEMPLATES,             // 6 social templates
].map(toUnifiedTemplate);
```

`FACTION_ENCOUNTER_TEMPLATES` is **not** spread into `UNIFIED_ACTION_TEMPLATES` (`src/data/unified-action-templates.ts` lines 4047-4162). Every other migrated guild — Thieves, Arcane Circle, Builders, Civic Guard, Holy Order, Underking Court, Rangers, Merchant Consortium, Mercenary Company, Lorekeepers, Temple of Spheres — is wired in with the same shape. AG is the holdout.

Today, AG templates are still resolvable via:
- `getFactionEncounterById(id)` → returns the legacy `EncounterTemplate` from `LEGACY_FACTION_QUEST_TEMPLATES` / `FACTION_LIFECYCLE_TEMPLATES` / `FACTION_SOCIAL_TEMPLATES`.
- `getUnifiedTemplateById(id)` → falls back through `getAnyEncounterById` then `migrateEncounterTemplate` (live conversion, not cached).

So AG quests still work end-to-end, but:
1. The unified registry is the canonical surface for unified-action-pipeline consumers (resolver, target filter, codex), and AG is invisible to it without the fallback walk.
2. The two consumers below have latent fragility because they accept whatever `getAnyEncounterById` (or its near siblings) hand back without normalising the shape — once the unified-vs-legacy mix gets wider, they will silently produce garbage.

### Two latent consumer bugs

**`src/engine/factionQuestGeneration.ts` — `getAccessibleTemplates` → `buildCacheEntry`** (current code):

```ts
return [...FACTION_ENCOUNTER_META.entries()]
  .filter(...)
  .map(([id]) => {
    const legacy = getFactionEncounterById(id);
    if (legacy) return legacy;                                // legacy EncounterTemplate
    const unified = getUnifiedTemplateById(id);
    return unified ? unifiedToEncounterTemplate(unified) : undefined;
  })
  .filter((t): t is EncounterTemplate => t !== undefined);
```

`buildCacheEntry` then computes:

```ts
const totalTickCost = template.steps.reduce(
  (sum, step) => sum + (step.duration ?? 1), 0,
);
```

This is safe today because either branch yields a legacy `EncounterTemplate.step` whose `duration` is a `number | undefined`. **But** if any caller substitutes a path that returns a raw `UnifiedActionTemplate` with `duration: { min, max }`, then `step.duration ?? 1` is the object (truthy, not nullish) and `sum + {min,max}` becomes string concatenation — a class of failure that is hard to spot in tests and that we want to design out structurally.

**`src/engine/phaseReputationTraits.ts` — `processReputationTally`**:

```ts
const template = getAnyEncounterById(encounterId);
if (!template) return;
...
if (REPUTATION_POSITIVE_ENCOUNTER_TYPES.has(template.encounterType)) { ... }
const reach = template.reachPrimary;
const key = tallyKey(reach, polarity);
```

`getAnyEncounterById` (in `src/data/encounter-content.ts:10392`) currently only walks the legacy registries, so this is also safe today. But if `processReputationTally` is ever fed a `UnifiedActionTemplate` (e.g., via a future `resolveEncounterTemplate` swap), `template.reachPrimary` is `undefined` (unified uses `reach`) and `template.encounterType` is `undefined` (unified uses `crudType`). Both `tallyKey('undefined', polarity)` and the `Set.has(undefined)` check fail silently — no tally increment ever lands. This is the exact regression CC's abandoned worktree fixed defensively (impediment #99).

The reputation-tallies test that was added in THR-102's test pass (`src/engine/__tests__/unifiedActionResolution.test.ts:519` — `increments reputation tallies for migrated encounter completions` for `ag.quest.escort_caravan`) currently passes because the test constructs a synthetic `UnifiedActionTemplate` and `executeStepResult` calls `processReputationTally` with a templateId that **is not** in the registry — the test passes for an accidental reason. We want it to pass for the right reason.

---

## Goals

1. Eliminate the orphaned `FACTION_ENCOUNTER_TEMPLATES` export by spreading it into `UNIFIED_ACTION_TEMPLATES` so AG aligns with every other migrated guild.
2. Make the two consumers normalise unified-or-legacy templates to a single shape before reading shape-sensitive fields. Use the existing `resolveEncounterTemplate` helper to remove the dual-call pattern.
3. Keep the legacy `LEGACY_FACTION_QUEST_TEMPLATES` / `FACTION_LIFECYCLE_TEMPLATES` / `FACTION_SOCIAL_TEMPLATES` arrays and `getFactionEncounterById` lookup as-is — other consumers (`socialEncounterGeneration.ts`, the AG-specific tests in `factionSocialAndBonuses.test.ts`) read those arrays directly. This is purely additive.

Non-goals:
- No prose, no balance, no new content.
- No change to `getAnyEncounterById` itself — its legacy-only walk is correct, and changing it has wider blast radius than this issue should take on.
- No deletion of the `LEGACY_FACTION_QUEST_TEMPLATES` array.

---

## Design

### Three-pillar coverage

| Pillar | Status | Rationale |
|--------|--------|-----------|
| Engine | **In scope** | Wiring + two engine consumer fixes. |
| Content | **N/A** | No prose or template content authored. The 18 + 6 + 2 templates are pre-existing. |
| UI | **N/A** | No user-facing surface change. Codex / debug panel already pull from `UNIFIED_ACTION_TEMPLATES`; once AG is wired they'll appear without any UI work. |

### Engine changes — three small edits

#### 1) `src/data/unified-action-templates.ts`

Add the import alongside the other faction template imports (around line 28-90):

```ts
import {
  FACTION_ENCOUNTER_TEMPLATES,
  FACTION_ENCOUNTER_META,
  getFactionEncounterById,
} from './faction-encounter-content';
```

Add a single spread at the bottom of `UNIFIED_ACTION_TEMPLATES` in the guild block (after Temple of Spheres, before the `SOCIAL_ENCOUNTER_TEMPLATES` line ~4128):

```ts
  // Adventurers Guild — migrated to UnifiedActionTemplate (THR-102, wired THR-290)
  ...FACTION_ENCOUNTER_TEMPLATES,
```

That's the canonical wiring. No other change in this file.

**Duplicate-id check.** `FACTION_ENCOUNTER_TEMPLATES` covers the `ag.*` and `social.faction.*` IDs. None of those IDs appear elsewhere in the unified registry (other guilds use `tg.*`, `ac.*`, `bf.*`, `cg.*`, `hod.*`, `uk.*`, `rb.*`, `mct.*`, `mc.*`, `lk.*`, `ts.*`, plus the `social.*` non-faction IDs). The `FACTION_SOCIAL_TEMPLATES` IDs are documented in `factionSocialAndBonuses.test.ts:101` — verify they don't collide with `SOCIAL_ENCOUNTER_TEMPLATES` IDs as part of the verification step.

#### 2) `src/engine/factionQuestGeneration.ts`

Replace the dual-call pattern in `getAccessibleTemplates` (lines 184-202) with `resolveEncounterTemplate`:

```ts
import { resolveEncounterTemplate } from '../data/unified-action-templates';

function getAccessibleTemplates(
  definition: FactionDefinition,
  currentRank: FactionRankTier,
): EncounterTemplate[] {
  const accessPrefixes = currentRank.encounterAccess;
  if (accessPrefixes.length === 0) return [];

  return [...FACTION_ENCOUNTER_META.entries()]
    .filter(([id, meta]) =>
      meta.factionDefId === definition.id &&
      accessPrefixes.some(prefix => id.startsWith(prefix)))
    .map(([id]) => resolveEncounterTemplate(id))
    .filter((t): t is EncounterTemplate => t !== undefined);
}
```

Apply the same `resolveEncounterTemplate` swap to the two inline IIFEs at lines 261-263 and 283-285 (the per-faction `joinEncounterTemplateId` / `promotionEncounterTemplateId` lookups). They become:

```ts
const joinTemplate = joinTemplateId
  ? resolveEncounterTemplate(joinTemplateId)
  : FACTION_JOIN_TEMPLATE;
...
const promoTemplate = promoTemplateId
  ? resolveEncounterTemplate(promoTemplateId)
  : FACTION_PROMOTION_TEMPLATE;
```

`resolveEncounterTemplate` (already exported from `unified-action-templates.ts:4209`) tries legacy first then unified, applying `unifiedToEncounterTemplate` to the unified branch. This means every value reaching `buildCacheEntry` has `step.duration` as a `number | undefined`, eliminating the `step.duration ?? 1` object-concatenation hazard structurally.

Drop the now-unused imports `getUnifiedTemplateById`, `unifiedToEncounterTemplate` from this file. Keep `getFactionEncounterById` if it remains used elsewhere — verify with grep.

#### 3) `src/engine/phaseReputationTraits.ts`

Two-line change in `processReputationTally` (lines 169-207). Swap `getAnyEncounterById` for `resolveEncounterTemplate`:

```ts
import { resolveEncounterTemplate } from '../data/unified-action-templates';
// remove: import { getAnyEncounterById } from '../data/encounter-content';
...
export function processReputationTally(...) {
  if (!stepSuccess) return;

  const template = resolveEncounterTemplate(encounterId);
  if (!template) return;
  ...
}
```

Because `resolveEncounterTemplate` runs unified results through `unifiedToEncounterTemplate`, the resulting value always has `reachPrimary` and `encounterType` populated (`unifiedToEncounterTemplate` synthesises them — see lines 4194-4199 of `unified-action-templates.ts`: `encounterType: 'assist'` default, `reachPrimary: ut.reach`). No further fallback handling needed; the conversion does it for us.

**Why `'assist'` as the default `encounterType` is acceptable here:** `processReputationTally` reads `encounterType` only inside `determinePolarity`, where it falls through to the layer-3 axiological tiebreaker if the type isn't in the positive/negative sets. `'assist'` is in `REPUTATION_POSITIVE_ENCOUNTER_TYPES` (verify in `agent-behavior-constants.ts`), so unified-only templates will tally as positive by default — the right tropism for migrated AG quests like `escort_caravan`, `monster_hunt`, etc. If a unified template should produce a negative tally, it should set `crudType: 'delete' | 'steal'` (which `migrateEncounterTemplate` round-trips), and the underlying mapping in `unifiedToEncounterTemplate` should be improved as a follow-up. **Out of scope here** — flag in deferral.

### Constants

No new constants. This change is structural.

### Tracing

Existing `'reputation_trait'` and `'faction_reputation_trait'` traces continue to fire. No new categories.

### Fail-soft

| Failure case | Fallback |
|--------------|----------|
| `resolveEncounterTemplate` returns `undefined` for an unknown id | `processReputationTally` early-returns — no tally update. Same as today. |
| `unifiedToEncounterTemplate` produces a template with `encounterType: 'assist'` for a unified-only template that semantically should be negative | Layer-3 axiological tiebreaker still runs. Worst case: skipped tally for that step (matches today's behavior when polarity returns `null`). |
| Duplicate id surfaces in `UNIFIED_ACTION_TEMPLATES` after the spread (shouldn't happen — see check above) | `getUnifiedTemplateById` returns the first match (`Array.find`). The legacy mirror is still queryable via `getFactionEncounterById`. No crash. |
| `FACTION_ENCOUNTER_TEMPLATES` evaluation order issue (TDZ if circular) | Same risk as the other 11 wired guilds, none of which has triggered TDZ. The `toUnifiedTemplate` call is run at module-load time on already-frozen const arrays — safe. |

### PRNG

None — this is pure plumbing.

### Wiring

Per `Docs/plans/wiring-checklist.md`:

| Surface | Status |
|---------|--------|
| Orchestrator phase | Already calls `processReputationTally`; no change. |
| GameState fields | Untouched. |
| Trace categories | Existing `reputation_trait`. |
| Player controls | None. |
| Modal / UI component | None. AG quests already render through `EncounterModal` via existing template lookups. |
| Codex page | Once wired, AG quests auto-appear in the codex (it iterates `UNIFIED_ACTION_TEMPLATES`). Worth eyeballing the codex view post-merge. |

### NFP compliance

| NFP | Status |
|-----|--------|
| 1. Tunability | PASS — no constants added or moved. |
| 2. Inspectability | PASS — same trace surface; one less indirection in two engine call sites. |
| 3. Determinism | PASS — no PRNG. Spread order is deterministic. |
| 4. Fail-soft | PASS with note — `unifiedToEncounterTemplate`'s `'assist'` default is the safe default for AG quests; flag improvement as follow-up. |
| 5. Narrative over mechanical perfection | N/A — wiring change. |
| 6. Additive over destructive | PASS — additive spread, two import-swaps, no deletions of legacy arrays. |
| 7. Performance | PASS — `UNIFIED_ACTION_TEMPLATES` grows by ~26 entries (still O(N) lookup but N is small and lookups are not hot-path). |

---

## Verification

Before commit:

1. **Type check:** `npx tsc --noEmit` — clean.
2. **Targeted tests:**
   - `npx vitest run src/engine/__tests__/unifiedActionResolution.test.ts` — including `increments reputation tallies for migrated encounter completions` (must still pass; it now passes for the right reason).
   - `npx vitest run src/engine/__tests__/factionSocialAndBonuses.test.ts` — `FACTION_SOCIAL_TEMPLATES` legacy export still works.
   - `npx vitest run src/data/__tests__/` if there is a registry-uniqueness test, otherwise add a one-line assertion that `UNIFIED_ACTION_TEMPLATES` contains no duplicate ids (recommended; cheap insurance).
3. **Full test suite:** `npm test`. Note: full suite has been red on main historically (impediments #22/#30/#31/#32/#34/#38/#39/#54). Compare new failures against the pre-change baseline; only new regressions block.
4. **Build:** `npx vite build` — confirms Vercel will deploy.
5. **CLI smoke:**
   ```bash
   npm run cli -- --seed 42 --map medium
   fws> run 30
   fws> eval state.unifiedActions.filter(a => a.templateId?.startsWith('ag.')).length
   ```
   Should be > 0 by tick 30 in a seeded world with adventurers.
6. **Registry check (optional one-liner):**
   ```bash
   npx tsx -e "import('./src/data/unified-action-templates').then(m => { const ids = m.UNIFIED_ACTION_TEMPLATES.map(t=>t.id); const dups = ids.filter((id,i)=>ids.indexOf(id)!==i); console.log('duplicates:', dups); console.log('ag count:', ids.filter(id=>id.startsWith('ag.')).length); });"
   ```
   Expect `duplicates: []` and `ag count` ≥ 18.

Verification evidence (raw output of steps 1, 2, 4) belongs in the closing commit body or Linear closeout comment.

---

## Files touched

- `src/data/unified-action-templates.ts` — add import + one spread line.
- `src/engine/factionQuestGeneration.ts` — swap to `resolveEncounterTemplate` in three call sites; drop unused imports.
- `src/engine/phaseReputationTraits.ts` — swap `getAnyEncounterById` for `resolveEncounterTemplate` (one line + import swap).

No new files. No content authored. No data migrations.

---

## Follow-ups (not in this issue)

- **Improve `unifiedToEncounterTemplate` `encounterType` mapping.** The hard-coded `'assist'` default is fine for AG migration but loses information when a unified template's `crudType` is `'delete' | 'update' | 'create'`. A `crudTypeToEncounterType` inverse mapping (paralleling the existing `encounterTypeToCrud` at line 990 of `faction-encounter-content.ts`) would make `processReputationTally` polarity detection more accurate for unified-only templates. File as a Deferral under Encounter Format Migration if discovered to bite — not blocking THR-290.
- **Eventually delete `LEGACY_FACTION_QUEST_TEMPLATES`** once no consumer reads it directly. Track separately under Encounter Format Migration; this issue does not touch it.

---

## Risk assessment

- **Blast radius:** small. Two engine files, one data file. All edits are import-swaps and one array spread.
- **Regression class:** the test added in THR-102 (`increments reputation tallies for migrated encounter completions`) is the canary. If it stays green plus full suite shows no new regressions, this is shipped.
- **Cross-executor:** see coordination block in Linear handoff. No direct collisions with currently-In-Dev work.
