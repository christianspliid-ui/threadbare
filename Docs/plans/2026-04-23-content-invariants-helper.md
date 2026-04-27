# Content Invariants Helper (THR-237)

**Status:** Ready for Codex
**Linear:** [THR-237](https://linear.app/threadbare/issue/THR-237)
**Project:** Repo Health
**Author:** Cowork, 2026-04-23

## Problem

The test suite has brittle count assertions like `expect(BUILDERS_FELLOWSHIP_ENCOUNTER_TEMPLATES).toHaveLength(10)` on content arrays. Every content addition or removal breaks these assertions, producing noise that drowns out signal. The 2026-04-11 retrospective traced part of the 8-day test-suite redness to exactly this pattern normalising "red but not a real failure" as an acceptable state.

This is a **missing-abstraction** problem: there is no shared helper that checks the structural properties we actually care about (unique IDs, valid reaches, step shapes, narrative presence) independent of count. So every new test file re-invents its own partial set of checks, and the count assertion gets tacked on as a (brittle) completeness check.

## Proposal

Add `src/testing/contentInvariants.ts` with a narrow, unit-tested helper API. Apply it to a curated set of test files where the brittle count assertions live, replacing `toHaveLength(N)` on growing content arrays with `toBeGreaterThanOrEqual(N)` plus a call to the structural invariants helper.

This is deliberately a **v1** slice — the helper is applied to the 5 most clearly brittle files called out below. A broader sweep across vocabulary tables (narrative-content, culture-content, monsterFactions) is out of scope and will be filed as a follow-up `Deferral` issue on completion.

## Non-Functional Priorities

| NFP | Status | Note |
|-----|--------|------|
| 1. Tunability | N/A | Test infrastructure, no runtime constants. |
| 2. Inspectability | PASS | Helper messages include template id so failures point at the bad content. |
| 3. Determinism | PASS | No PRNG, no simulation — pure structural checks. |
| 4. Fail-soft | N/A | Test-time only; we want hard failures on structural violations. |
| 5. Narrative over mechanical | N/A | Infrastructure. |
| 6. Additive | PASS | New file + surgical edits to specific lines. Fully reversible. |
| 7. Performance | PASS | Helpers run once per test file; negligible cost. |

## Three-pillar coverage

- **Engine** — N/A. No engine changes. The helper lives in `src/testing/` and is consumed by tests only.
- **Content** — N/A. No content changes. We rewrite *assertions about* content, not content itself.
- **UI** — N/A. No UI changes.
- **Wiring** — N/A. Test helper; no orchestrator phase, no trace category, no modal.

All three pillars marked N/A with rationale — this is test infrastructure, not a game feature. Three-pillar rule exits are explicit and justified.

## Engine pillar

N/A. No engine code changes.

## Content pillar

N/A. No content changes.

## UI pillar

N/A. No UI surface.

## Wiring pillar

N/A. No orchestrator, GameState, or trace integration.

## Helper design (`src/testing/contentInvariants.ts`)

Exports five pure functions. Each throws via `expect(...).toBe(true)` / `toBeDefined()` on failure, using vitest's `expect` imported from `vitest`. Each takes readonly inputs; none mutate.

```ts
import { expect } from 'vitest';
import type { UnifiedActionTemplate, ActionStepOrBranch, ActionStep } from '../types/unifiedAction';
import { isActionStepBranch } from '../types/unifiedAction';
import { REACH_DOMAINS } from '../types/traits';
import type { EncounterTemplate } from '../types/encounter';

const VALID_REACHES = new Set<string>(REACH_DOMAINS);

/**
 * Assert that a UnifiedActionTemplate has structurally valid shape:
 *  - id is a non-empty string
 *  - name is a non-empty string
 *  - reach is a valid ReachDomain
 *  - rarityTier is 1, 2, 3, or 4
 *  - steps.length >= 1
 *  - every step (expanding branches) passes assertValidStep
 */
export function assertValidUnifiedTemplate(template: UnifiedActionTemplate): void;

/**
 * Assert that an EncounterTemplate (legacy pre-migration shape) has:
 *  - id is a non-empty string
 *  - name is a non-empty string
 *  - reachPrimary and reachSecondary are valid ReachDomains
 *  - steps.length is between 2 and 4 (inclusive)
 *  - locationTypes.length >= 1
 *  - motivations.length >= 1
 *  - every step has non-empty onSuccess.narrative and onFailure.narrative (>10 chars)
 */
export function assertValidEncounterTemplate(template: EncounterTemplate): void;

/**
 * Assert that an ActionStep (post-branch-expansion) has:
 *  - reach is a valid ReachDomain
 *  - difficulty is a number in [0, 1]
 *  - duration.min >= 1
 *  - duration.min <= duration.max
 * Handles ActionStepBranch by recursing into variants + fallback.
 */
export function assertValidStep(step: ActionStepOrBranch, templateId: string): void;

/**
 * Assert that no duplicate IDs exist in the array. Uses template.id.
 * Passing array of objects with `.id` field.
 */
export function assertNoDuplicateIds<T extends { readonly id: string }>(items: readonly T[]): void;

/**
 * Assert that every step across every template uses a valid ReachDomain.
 * Shortcut for `for (t of templates) for (s of t.steps) assertValidStep(s)`.
 */
export function assertAllValidReaches(templates: readonly UnifiedActionTemplate[]): void;
```

### Implementation notes

- `assertValidStep` must expand `ActionStepBranch` using `isActionStepBranch` (already exported from `src/types/unifiedAction.ts`), asserting each variant step and the fallback.
- Error messages must include the template id so failures are debuggable. Use `expect(x, \`\${templateId} has invalid reach: \${step.reach}\`).toBe(true)` style.
- The helper must NOT rely on `ENCOUNTER_TEMPLATES` or any content imports — it works on whatever you pass it. This keeps the helper small and orthogonal to content changes.

## Test plan for the helper itself

New file: `src/testing/__tests__/contentInvariants.test.ts`. One `describe` block per exported function, covering:

- **Happy path:** pass a minimally valid fixture; no throws.
- **Invalid reach:** pass a fixture with `reach: 'invalid_reach'`; assert throws.
- **Out-of-range difficulty:** pass `difficulty: 1.5`; assert throws.
- **Duration min > max:** pass `duration: { min: 5, max: 3 }`; assert throws.
- **Duration min < 1:** pass `duration: { min: 0, max: 5 }`; assert throws.
- **Duplicate ids:** pass `[{id: 'a'}, {id: 'a'}]`; assert throws.
- **Branch step:** pass an `ActionStepBranch` with one bad variant; assert throws.

Each test constructs its fixture inline — do not import from `src/data/**`. Keep the helper unit tests hermetic.

## Sweep — specific assertions to rewrite

The v1 sweep targets **only content-array count assertions** on growing content. Each line listed is an exact replacement — no judgment required.

### Rule

- `expect(ARR).toHaveLength(N)` on a growing content array → `expect(ARR.length).toBeGreaterThanOrEqual(N)`
- **Do NOT** rewrite assertions on fixed structural counts (e.g. `FOUNDATION_MODIFIERS.toHaveLength(4)` — 4 is locked to the 4 Foundation spheres, not growing). Those are left alone in v1.
- After rewriting, add one `it('passes content invariants', () => { ... })` test per file that calls `assertNoDuplicateIds(arr)` and (if templates) `templates.forEach(assertValidUnifiedTemplate)` on the affected content array.

### Files to touch and exact edits

1. **`src/data/__tests__/builders-fellowship-content.test.ts`**
   - Line 94: `expect(BUILDERS_FELLOWSHIP_ENCOUNTER_TEMPLATES).toHaveLength(10);` → `expect(BUILDERS_FELLOWSHIP_ENCOUNTER_TEMPLATES.length).toBeGreaterThanOrEqual(10);`
   - Line 98: `expect(BUILDERS_FELLOWSHIP_SOCIAL_TEMPLATES).toHaveLength(3);` → `expect(BUILDERS_FELLOWSHIP_SOCIAL_TEMPLATES.length).toBeGreaterThanOrEqual(3);`
   - Line 107: `expect(ALL_TEMPLATES).toHaveLength(15);` → `expect(ALL_TEMPLATES.length).toBeGreaterThanOrEqual(15);`
   - Line 122: `expect(BUILDERS_FELLOWSHIP_ENCOUNTER_META.size).toBe(15);` → leave as-is (META is a derived Map whose size tracks ALL_TEMPLATES; assertion already serves as a parity check, not a count). Instead append a new assertion: `expect(BUILDERS_FELLOWSHIP_ENCOUNTER_META.size).toBe(ALL_TEMPLATES.length);`
   - Add `import { assertNoDuplicateIds, assertValidUnifiedTemplate } from '../../testing/contentInvariants';`
   - Add one new `it('passes structural invariants', () => { ALL_TEMPLATES.forEach(assertValidUnifiedTemplate); assertNoDuplicateIds(ALL_TEMPLATES); });`

2. **`src/engine/__tests__/socialEncounterGeneration.test.ts`**
   - Line 407: `expect(SOCIAL_ENCOUNTER_TEMPLATES).toHaveLength(14);` → `expect(SOCIAL_ENCOUNTER_TEMPLATES.length).toBeGreaterThanOrEqual(14);`
   - Line 457: `expect(TAVERN_ENCOUNTER_TEMPLATES).toHaveLength(10);` → `expect(TAVERN_ENCOUNTER_TEMPLATES.length).toBeGreaterThanOrEqual(10);`
   - Add `import { assertNoDuplicateIds } from '../../testing/contentInvariants';`
   - Add one new `it('SOCIAL_ENCOUNTER_TEMPLATES has no duplicate IDs', () => { assertNoDuplicateIds(SOCIAL_ENCOUNTER_TEMPLATES); });` (this replaces the existing inline unique-id check at line 449–452 — *delete* lines 449–452 after adding)
   - Add one new `it('TAVERN_ENCOUNTER_TEMPLATES has no duplicate IDs', () => { assertNoDuplicateIds(TAVERN_ENCOUNTER_TEMPLATES); });`

3. **`src/data/__tests__/migrateEncounterTemplate-parity.test.ts`**
   - Line 163: `expect(ALL_TG).toHaveLength(15);` → `expect(ALL_TG.length).toBeGreaterThanOrEqual(15);`
   - Add `import { assertNoDuplicateIds, assertValidUnifiedTemplate } from '../../testing/contentInvariants';`
   - Add one new `it('ALL_TG passes structural invariants', () => { ALL_TG.forEach(assertValidUnifiedTemplate); assertNoDuplicateIds(ALL_TG); });`

4. **`src/data/__tests__/narrative-content.test.ts`** — lifecycle templates only (vocabulary tables are out of scope for v1)
   - Line 151: `expect(LIFECYCLE_TEMPLATES.death).toHaveLength(5);` → `expect(LIFECYCLE_TEMPLATES.death.length).toBeGreaterThanOrEqual(5);`
   - Line 156: `expect(LIFECYCLE_TEMPLATES.birth).toHaveLength(3);` → `expect(LIFECYCLE_TEMPLATES.birth.length).toBeGreaterThanOrEqual(3);`
   - Line 161: `expect(LIFECYCLE_TEMPLATES.migration).toHaveLength(3);` → `expect(LIFECYCLE_TEMPLATES.migration.length).toBeGreaterThanOrEqual(3);`
   - Do NOT touch lines 239, 263, 310, 332, 347, 367 (vocabulary tables — out of scope).

5. **`src/data/__tests__/encounter-content.test.ts`**
   - No `.toHaveLength(N)` edits needed — the file already uses `.toBeGreaterThanOrEqual(...)` everywhere.
   - Add `import { assertNoDuplicateIds, assertValidEncounterTemplate } from '../../testing/contentInvariants';`
   - Add one new `it('passes shared structural invariants', () => { assertNoDuplicateIds(ENCOUNTER_TEMPLATES); ENCOUNTER_TEMPLATES.forEach(assertValidEncounterTemplate); });`

### What stays

- Everything in `src/data/__tests__/culture-content.test.ts` — `FOUNDATION_MODIFIERS` (4 Foundation spheres), `CREATION_SPHERE_MODIFIERS` (8 creation spheres), `BIOME_MODIFIERS` (42 biomes), `CULTURAL_PROSE_PALETTES` (12 cultures) are **tied to fixed structural enums**. Leave unchanged.
- Everything in `src/data/__tests__/doom-loader.test.ts`, `doom-content.test.ts`, `mandate-loader.test.ts` — `toHaveLength(5)` on stage names is locked to the 5-stage doom arc.
- Everything in `src/data/__tests__/monsterFactions.test.ts` — 8 monster factions is structural.
- `src/data/__tests__/unified-action-templates.test.ts` — `step.onSuccess).toHaveLength(1)` and `unified.steps).toHaveLength(1)` are per-template structural contracts; keep.
- `src/types/__tests__/trace.test.ts` — already uses `toBeGreaterThan(0)` on `TRACE_CATEGORIES.length`; no change.
- `src/data/__tests__/rival-content.test.ts`, `sphereIcons.test.ts` — structural shape assertions (3 taunts per rival, 1-char symbols); keep.

## Acceptance checklist (binary)

- [ ] `src/testing/contentInvariants.ts` exists and exports the five functions named in Helper Design.
- [ ] `src/testing/__tests__/contentInvariants.test.ts` exists, imports `{ describe, it, expect }` from vitest, and has at least one `it(...)` per exported function.
- [ ] `src/data/__tests__/builders-fellowship-content.test.ts` lines 94, 98, 107 use `.length).toBeGreaterThanOrEqual(...)` (verbatim pattern).
- [ ] `src/data/__tests__/builders-fellowship-content.test.ts` line 122 uses `toBe(ALL_TEMPLATES.length)` instead of `toBe(15)`.
- [ ] `src/data/__tests__/builders-fellowship-content.test.ts` has one new `it('passes structural invariants', ...)` test that calls `ALL_TEMPLATES.forEach(assertValidUnifiedTemplate)` and `assertNoDuplicateIds(ALL_TEMPLATES)`.
- [ ] `src/engine/__tests__/socialEncounterGeneration.test.ts` lines 407 and 457 use `.length).toBeGreaterThanOrEqual(...)`.
- [ ] `src/engine/__tests__/socialEncounterGeneration.test.ts` has two new invariant tests using `assertNoDuplicateIds` (one for SOCIAL_ENCOUNTER_TEMPLATES, one for TAVERN_ENCOUNTER_TEMPLATES); the existing inline unique-id check on lines 449–452 is deleted.
- [ ] `src/data/__tests__/migrateEncounterTemplate-parity.test.ts` line 163 uses `.length).toBeGreaterThanOrEqual(15)` and a new invariant test is added using the helper.
- [ ] `src/data/__tests__/narrative-content.test.ts` lines 151, 156, 161 use `.length).toBeGreaterThanOrEqual(...)`. Lines 239, 263, 310, 332, 347, 367 are NOT touched.
- [ ] `src/data/__tests__/encounter-content.test.ts` gains one new `it('passes shared structural invariants', ...)` test calling the helper (no other line edits).
- [ ] `npm test` passes.
- [ ] `npx tsc --noEmit` clean.
- [ ] `npx vite build` succeeds.

## Deferral (file on completion)

After merge, file a follow-up Linear issue `Deferral` in the Repo Health project titled "Apply contentInvariants helper to vocabulary / fixed-enum tables (v2 sweep)" that covers:
- narrative-content.test.ts vocabulary tables (lines 239, 263, 310, 332, 347, 367)
- culture-content.test.ts assertions whose counts track Creation Sphere / Foundation Sphere / biome enums (determine whether each is structural or growing)
- monsterFactions / mandate-loader / doom-loader — confirm structural and document per-file decision

v2 requires per-file judgment about whether each count is structural (keep) or growing (replace). That's why it's a separate ticket.

## References

- [Council discussion](../design-councils/2026-04-22-workflow-easier-to-change.md) → PROP-1
- [Retro 2026-04-11](../retrospectives/2026-04-11-retro-v2.md) → Cluster 1 (test suite erosion)
- Linear coordination protocol: [2026-04-13-linear-coordination-protocol.md](./2026-04-13-linear-coordination-protocol.md)
