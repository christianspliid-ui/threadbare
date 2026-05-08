---
status: current
title: THR-318 Stream 1 Pass 2 — Faction encounter `moral_axis_pole` migration spec
date: 2026-05-07
linear: THR-318
parent_plan: 2026-05-07-encounter-content-authoring-breakdown.md
sibling_pass_1: THR-357 (Done — PR #168, commit 904549dc)
audience: codex
---

# THR-318 Stream 1 Pass 2 — Faction encounter pole migration (2026-05-07)

**Status:** Cowork spec for the second of three categorical passes on `moral_axis_pole` migration. Pass 1 (THR-357, branching encounters) shipped to `main` 2026-05-07 via PR #168; this Pass picks up the 11 faction encounter content modules.

**Audience:** Codex executor picking up THR-318 Stream 1 Pass 2; future Cowork sessions filing Pass 3.

**Why this plan exists.** The parent breakdown plan (`Docs/plans/2026-05-07-encounter-content-authoring-breakdown.md` §3.5) sequenced Pass 1 → Pass 2 → Pass 3, gating each on the prior landing. Pass 1 has landed. The breakdown plan estimated Pass 2 at ~70 UATs across 10 modules; the actual count is **143 UATs across 11 modules** (verified via `git show main:src/data/*-encounter-content.ts | grep -c "^  {"`). This plan tightens the spec, fixes the count, and resolves the duplication-vs-extraction question Pass 1 left implicit.

---

## 1. Inputs (read in this order before executing)

1. **Parent breakdown plan** — `Docs/plans/2026-05-07-encounter-content-authoring-breakdown.md` (architecture decision §3.2, lite-contract template §3.3, editorial rubric §3.4, mutex/parallel-safety §3.6).
2. **Pass 1 reference implementation** — `src/data/encounters/flawed-steel.ts` on `main`. The helper block (lines ~601 to ~774) is the canonical pattern Pass 1 shipped. Read it before drafting Pass 2.
3. **Schema** — `src/types/encounter-contract.ts` (`EncounterArchetypePole`, `MORAL_AXIS_POLES_BY_REACH`, `QUINTESSENCE_POLES`).
4. **Validator** — `src/data/encounter-contract-validators.ts` (`parseEncounterContract`, `isPoleAllowedForReach`).
5. **Adapter** — `src/engine/encounter-contract-adapter.ts` (`encodeContractMetadata` / `decodeContractMetadata` — the carrier channel; lines 71–85). Adapter prefers authored over default-inferred per `defaultPoleForReach` fallback (line 181).
6. **Cosmological pattern** — `Docs/plans/2026-05-04-encounter-experience-design-plan.md` §3.6 (drift accumulation), §4.2 (8 reach axes × 2 poles + Quintessence meta-axis).

---

## 2. Pass 1's actual implementation pattern (settled by `main`)

Pass 1 inlined the lite-contract helpers into each of the 33 branching encounter files. Each file gained roughly 170 lines of helper code (`ENCOUNTER_CONTRACT_METADATA_KEY` constant, `EFFECTIVE_INTERVENTION_TO_COST` map, `toEncounterChoiceCost`, `toStepFallbackReach`, `toEncounterChoiceReach`, `toEncounterArchetypePole`, `encodeEncounterContractMetadata`, `buildFallbackEncounterChoice`, `buildLiteEncounterContract`, `withEncounterContract`) plus per-export wrapping (`export const X = withEncounterContract({...})`) and a contract export (`export const X_CONTRACT: EncounterContract = buildLiteEncounterContract(X)`).

**Pole-picking rule that actually shipped (`toEncounterArchetypePole`):**

```typescript
function toEncounterArchetypePole(reach: EncounterChoiceReach, choice: EncounterAuthoredChoice): EncounterArchetypePole {
  const poles = reach === 'quintessence' ? QUINTESSENCE_POLES : MORAL_AXIS_POLES_BY_REACH[reach];
  if (choice.interventionType === 'coercive') {
    return poles[1];
  }
  return poles[0];
}
```

This is a **mechanical heuristic**: `coercive` → second pole (Conqueror, Magnate, Puppeteer, …); everything else → first pole (Protector, Mender, Confessor, …). It is **not** the per-choice editorial pole-picking rubric the breakdown plan §3.4 described. Pass 1 made the trade-off to ship the structural carrier mechanism with a heuristic default, leaving per-choice pole nuance for a Stream 4 editorial pass (parent breakdown plan §6).

**Pass 2 inherits this trade-off.** Use the same `toEncounterArchetypePole` heuristic; do not attempt per-choice editorial pole-picking in this Pass. The downstream Stream 4 editorial sweep (filed after Pass 1+2+3 land) is where pole nuance gets corrected per choice.

---

## 3. Architecture decision — extract once, do not duplicate

The 33×170-line duplication Pass 1 produced is not a precedent to follow. With 11 more faction files plus an eventual Pass 3, perpetuating the duplication produces ~7400 lines of copy-paste across 47+ files.

**Pass 2 extracts the helper block to a shared module:**

- **New file:** `src/data/encounter-contract-builder.ts`
- **Exports** (named exports — tree-shakeable, no default export):
  - `ENCOUNTER_CONTRACT_METADATA_KEY` (re-export from existing constant location if defined elsewhere; otherwise canonical here)
  - `DEFAULT_FORECAST_FACTORS`, `DEFAULT_STATE_DESCRIPTOR`, `DEFAULT_TILTS_TOWARD`, `DEFAULT_FALL_FORWARD`, `DEFAULT_AGENT_REACTION` — the default-string constants
  - `EFFECTIVE_INTERVENTION_TO_COST`, `toEncounterChoiceCost`, `toStepFallbackReach`, `toEncounterChoiceReach`, `toEncounterArchetypePole`, `encodeEncounterContractMetadata`, `buildFallbackEncounterChoice`, `buildLiteEncounterContract`, `withEncounterContract`
  - The `EncounterAuthoredChoice` and `EncounterChoiceIntervention` type aliases (or import them where the existing types live)
- **Pass 2 faction files import from the shared module:**

```typescript
import { withEncounterContract } from '../encounter-contract-builder';
// …
export const ARCANE_CIRCLE_ENCOUNTER_TEMPLATES: UnifiedActionTemplate[] = [
  withEncounterContract({ id: 'ac.quest.ley_survey', /* … */ }),
  withEncounterContract({ id: 'ac.quest.reagent_gather', /* … */ }),
  // …
];
```

**Pass 1's 33 files stay inlined (deferred cleanup).** Pass 2 does NOT touch `src/data/encounters/*.ts`. A separate cleanup ticket (filed at session handoff: "Stream 1 Pass 1 cleanup — refactor 33 branching encounter files to consume shared `encounter-contract-builder.ts`") moves them onto the shared helpers later. Reasons to defer: keeps Pass 2's diff scoped; avoids re-touching code that already shipped and has tests; gives an opportunity to verify the shared module's API on Pass 2 before bulk-applying to Pass 1's surface.

**Why `withEncounterContract` for `[]`-array exports.** Pass 1's 33 files each export ONE template (`export const FLAWED_STEEL_TEMPLATE: UnifiedActionTemplate = withEncounterContract({...})`). Pass 2's faction files export an ARRAY (`export const ARCANE_CIRCLE_ENCOUNTER_TEMPLATES: UnifiedActionTemplate[] = [{ … }, { … }, …]`). The same `withEncounterContract` call works element-wise — wrap each array element. The `_CONTRACT` export pattern Pass 1 used (`export const FLAWED_STEEL_TEMPLATE_CONTRACT = buildLiteEncounterContract(FLAWED_STEEL_TEMPLATE)`) does NOT scale to arrays of 13 templates per file; **omit the per-template `_CONTRACT` export in Pass 2**. Consumers that need the contract can call `decodeContractMetadata(template.illustrationAlt)` at the read site.

---

## 4. Files to touch — exact list (binding)

The 11 faction encounter content modules:

| File | Templates (verified count) |
|------|----------------------------|
| `src/data/arcane-circle-encounter-content.ts` | 13 |
| `src/data/builders-fellowship-encounter-content.ts` | 13 |
| `src/data/civic-guard-encounter-content.ts` | 13 |
| `src/data/holy-order-dawn-encounter-content.ts` | 13 |
| `src/data/lorekeepers-covenant-encounter-content.ts` | 13 |
| `src/data/mercenary-encounter-content.ts` | 13 |
| `src/data/merchant-consortium-encounter-content.ts` | 13 |
| `src/data/rangers-brotherhood-encounter-content.ts` | 13 |
| `src/data/temple-of-spheres-encounter-content.ts` | 13 |
| `src/data/thieves-guild-encounter-content.ts` | 13 |
| `src/data/underking-court-encounter-content.ts` | 13 |
| **Total** | **143 templates across 11 files** |

Plus the new shared helper module:

- `src/data/encounter-contract-builder.ts` (new)

**Files NOT to touch (binding):**

- `src/data/encounters/*.ts` — Pass 1 territory; cleanup deferred to a separate ticket.
- Pass 3 candidates — `tavern-encounter-content.ts`, `social-encounter-content.ts`, `borderland-encounter-content.ts`, `monster-encounter-content.ts`, `army-encounter-content.ts`, `secret-encounter-content.ts`, `faction-encounter-content.ts`, `siege-encounter-content.ts`, `social-scene-templates.ts`, `effect-shell-proof-templates.ts`, `unified-action-templates.ts`, `faction-action-encounters.ts` — separate ticket.
- Schema/validator/adapter (`src/types/encounter-contract.ts`, `src/data/encounter-contract-validators.ts`, `src/engine/encounter-contract-adapter.ts`) — canonical, do not modify.

If `npx tsc --noEmit` fails on a file outside "Files to touch", **stop and surface in PR comments** rather than expanding scope.

---

## 5. Coordination block

**Suggested model:** sonnet (matches Pass 1's lane; mechanical pattern application after rubric is set; pole-picking is the same heuristic as Pass 1, no per-choice editorial judgment required).

**Parallel-safe with:** all current Encounter Experience phase tickets (THR-334 D1, THR-335 D2, THR-339 F1, THR-340 F2, THR-342 F4, THR-344 G2, THR-345 G3, THR-353 D3) — those touch types/components/lint/tests, not encounter content files. THR-361 (TB-075 Phase 5c) — file-disjoint (5c touches test fixtures + `traits.ts`, not encounter content).

**Mutex with:**
- THR-357 (Pass 1) — already Done; no live conflict.
- Any future Stream 1 Pass 3 ticket — file-disjoint by construction.
- Any future migration that changes the UAT type itself or alters `encodeContractMetadata` channel.

**Codex review:** yes — extracting a shared module + applying it across 11 files is mechanical-with-rules; second-pair-of-eyes worth it for the API shape of `encounter-contract-builder.ts` and that import wiring is consistent across files.

---

## 6. Done when (binding exit criteria)

- [ ] `src/data/encounter-contract-builder.ts` exists, exports the helper API listed in §3, has no inline duplication of `encounter-contract-validators.ts` logic, passes `npx tsc --noEmit`.
- [ ] All 11 faction encounter content files import from `encounter-contract-builder.ts`. Each template literal in each `[A-Z_]+_ENCOUNTER_TEMPLATES` array is wrapped with `withEncounterContract({...})`.
- [ ] Every wrapped template's `illustrationAlt` is the `__encounter_contract_v1:<JSON>` blob produced by `encodeEncounterContractMetadata`. No faction template's `illustrationAlt` retains its prior plain-text alt-text value (accessibility regression accepted per parent plan §3.2).
- [ ] No new inline copy of `buildLiteEncounterContract` / `withEncounterContract` / `toEncounterArchetypePole` / etc. in any faction file.
- [ ] `npx tsc --noEmit` passes. Zod parse via `parseEncounterContract` validates every contract at module load.
- [ ] `npm test` passes. Add a smoke test (in a new `src/data/__tests__/faction-encounter-contract-migration.test.ts` file or extend an existing test) that asserts every faction template's adapted contract round-trips through `parseEncounterContract` without error and produces the heuristic-correct `moral_axis_pole` for at least one representative `interventionType: 'coercive'` choice and one non-coercive choice.
- [ ] `npx vite build` passes (Vercel deploy gate).
- [ ] No new lint warnings introduced.
- [ ] If `npm run lint:encounter-content` exists at merge time (G3 / THR-345), run it and fix any flagged contracts.
- [ ] Closing commit body includes `Fixes THR-XXX` (this issue's ID) so the merge-to-main auto-close fires.
- [ ] Verification evidence: paste raw terminal output for `npm test`, `npx tsc --noEmit`, and `npx vite build` in the closing commit body or completion comment.
- [ ] PR description notes that Pass 1's 33 files are intentionally untouched and references the deferred-cleanup follow-up ticket.

---

## 7. Out of scope (DO NOT do in this ticket)

- Refactoring Pass 1's 33 branching encounter files to consume the shared `encounter-contract-builder.ts`. **Separate ticket.**
- Per-choice editorial pole-picking nuance — Pass 2 uses the same `interventionType === 'coercive'` heuristic Pass 1 shipped. Editorial nuance is Stream 4 territory.
- Authoring real `cast`, `scene_state`, `callback_candidates`, `protagonist`, `place.location`, `prose_tooltips`, `aftermath.changes` — Stream 2 work, blocked on THR-319.
- Pass 3 (ambient encounter content) files — separate ticket.
- Schema or adapter changes.
- Editorial rewriting of existing UAT prose — Stream 4 territory.

---

## 8. Three-pillar coverage

- **Engine pillar:** N/A — schema, validator, adapter all shipped in Phase A1 (THR-350); helper extraction is a code-organization change with no engine semantics shift.
- **Content pillar:** **Primary.** 143 faction templates gain authored `EncounterContract` carriers with heuristic-mapped `moral_axis_pole` per choice. Pass 2's tone-bar inherits Pass 1's; faction voice is preserved via the existing UAT prose (no rewriting in this Pass).
- **UI pillar:** N/A direct — UI components consume the contract via the existing adapter; no new UI work.

---

## 9. NFP compliance

| Priority | Status | Note |
|----------|--------|------|
| 1. Tunability | ✅ PASS | Default constants live in shared module; one place to tune `DEFAULT_FORECAST_FACTORS` / `DEFAULT_TILTS_TOWARD` / etc. (improvement over Pass 1's 33 inline copies). |
| 2. Inspectability | ✅ PASS | Authored contracts produce `archetype_drift_register` traces (existing); G3 lint reports per-choice violations. |
| 3. Determinism | ✅ PASS | Authored contracts contain only literal strings/IDs; no PRNG involvement. |
| 4. Fail-soft | ✅ PASS | If a contract fails Zod parse, adapter falls back to `defaultPoleForReach()`; encounter still resolves with default-inferred pole. |
| 5. Narrative over mechanical perfection | ✅ PASS with note | Pass 2 honours Pass 1's heuristic-shipped pole assignments; per-choice nuance arrives in Stream 4 editorial pass. |
| 6. Additive over destructive | ✅ PASS | Pass 1 files untouched; new shared module is additive; faction file changes preserve all existing exports/types. |
| 7. Performance budget | ✅ PASS with note | Lite-contract JSON ~2-4KB per template × 143 templates ≈ 300-600KB additional bundle. G2 snapshot tests at 1920×1080 verify no perf regression. |

---

## 10. Vision audit

Pass 2 introduces no Vision premise. It honours design plan §1 Rule 2 ("the moral axis is structural") on 143 more templates by giving them authored carriers in place of default-inferred ones. The heuristic limitation is a Pass 1 trade-off Pass 2 inherits; Stream 4 corrects it.

No Vision edits ride along with this ticket.

---

## 11. Followup tickets to file at PR-merge time (Cowork pickup, not Codex's job)

1. **Stream 1 Pass 1 cleanup** — refactor `src/data/encounters/*.ts` (33 files) to consume the shared `encounter-contract-builder.ts` module. Mechanical sweep; sonnet-shaped. **File AT** Pass 2 merge.
2. **Stream 1 Pass 3 — Ambient encounter content** — the long-tail per parent breakdown plan §3.5 (~21+ UATs across `tavern-`, `social-`, `borderland-`, `monster-`, `army-`, `secret-`, `siege-`, etc.). **Note**: parent plan listed siege under Pass 3 implicitly; verify and include. **File AT** Pass 2 merge.

---

## 12. References

- `Docs/plans/2026-05-07-encounter-content-authoring-breakdown.md` — parent breakdown plan
- `Docs/plans/2026-05-04-encounter-experience-design-plan.md` — long-form design plan
- `Docs/plans/2026-05-05-encounter-ui-implementation-phasing.md` — phasing plan (THR-317)
- `src/data/encounters/flawed-steel.ts` — Pass 1 reference implementation (helper block lines 601–774)
- `src/types/encounter-contract.ts` — schema
- `src/data/encounter-contract-validators.ts` — validator (`parseEncounterContract`, `isPoleAllowedForReach`)
- `src/engine/encounter-contract-adapter.ts` — adapter (lines 71–85 = encode/decode metadata; 176–240 = fallback contract)
- `Docs/plans/2026-04-13-linear-coordination-protocol.md` — coordination block template
