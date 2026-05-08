---
title: THR-344 Phase G2 — UI snapshot tests at 1920×1080 + 2560×1440 sample (Codex-tightened spec)
date: 2026-05-07
status: ready-for-codex
parent: ARC-102 / Encounter Experience
phasing-plan: Docs/plans/2026-05-05-encounter-ui-implementation-phasing.md §3 Phase G2
design-plan: Docs/plans/2026-05-04-encounter-experience-design-plan.md §12 (test strategy)
---

# THR-344 Phase G2 — UI snapshot tests (Codex spec)

## 1. Why this spec exists

THR-344's original Done-When listed components from Phases C, D, E without distinguishing components that already exist on `origin/main` from components still in flight (C4 SceneStatePanel, D1 ThreadOverlay, D2 EffectRegistration). A literal reading would block Codex on three other in-flight tickets.

This spec narrows G2 to **what is shippable today** — every component listed below already exists on `origin/main` — and creates an explicit follow-up checklist for the not-yet-shipped components (C4/D1/D2) so they get covered as they merge.

Result: G2 is fully unblocked, parallel-safe, and binary-verifiable.

## 2. Scope (this ticket)

Three categories of work, in order:

### 2.1 Audit + harden existing snapshot tests (5 files)

These already exist with snapshot coverage. Audit each, confirm the viewport wrapper is `1920×1080`, and add the missing fixture rows below. **Do not regenerate existing snapshots unless a fixture change demands it** — diff churn must be intentional.

| File | Status today | Add fixtures |
|------|-------------|--------------|
| `src/components/Game/Encounter/__tests__/EncounterChoiceCard.test.tsx` | snapshot exists for fully-populated choice | add `selected=true`, `dimmed=true`, and `consumes_item=null` variants |
| `src/components/Game/Encounter/__tests__/OutcomeForecastBand.test.tsx` | snapshot exists for 5 tiers (0.1, 0.3, 0.5, 0.7, 0.9) | add a `successProbability=null` snapshot (placeholder state) |
| `src/components/Game/Encounter/__tests__/AscendantHandCastRail.test.tsx` | snapshots exist for 0-playable / 3-playable / 7+-with-disclosure | add CastRail snapshots for **0, 1, 4, 6 cast members** at the same 1920×1080 wrapper (separate `describe` block in same file) |
| `src/components/Game/Encounter/DetailPage/__tests__/TypedDetailPages.test.tsx` | snapshots exist for the 5 typed pages | confirm each renders inside a 1920×1080 wrapper; if not, wrap and refresh snapshots in one focused commit |
| `src/components/shared/__tests__/DetailModal.test.tsx` | snapshot exists for shell | add depth-1 / depth-2 / depth-4 / depth-5 stack snapshots (per design plan §5.5 detail page pattern) |

### 2.2 Add missing snapshot tests (3 new files)

These components ship on `origin/main` without snapshot coverage. Add new test files using the same `// @vitest-environment jsdom` + `render(<div style={{ width: 1920, height: 1080 }}>…</div>)` pattern established by `EncounterChoiceCard.test.tsx`.

| New file | Component(s) | Required fixtures |
|----------|--------------|-------------------|
| `src/components/Game/Encounter/__tests__/EiraHeroPanel.test.tsx` | `EiraHeroPanel` (with embedded `CapabilityStrip`) | full hero (3 capabilities, 1 item, 1 vow, 1 recent moment); no-items variant; no-vow variant; 4-recent-moments variant |
| `src/components/Game/Encounter/__tests__/CapabilityStrip.test.tsx` | `CapabilityStrip` standalone | 3-capability strip (Force/Mind/Spirit defaults); single-capability strip; empty (no capabilities) — fail-soft check |
| `src/components/Game/Encounter/__tests__/EncounterScreen.layout.test.tsx` | `EncounterScreen` shell | full populated layout (hero+choices+hand+cast+forecast); minimum viable (hero+1 choice); 2560×1440 sample (single snapshot — section 2.3 requirement); the existing `EncounterScreen.test.tsx` is structural, not a snapshot — leave it untouched |

For fixtures, copy/adapt the `heroPanelData` literal from `EncounterScreen.test.tsx` — do not invent new prose. Reuse `sampleChoice` from `EncounterChoiceCard.test.tsx`. Cast tile / hand fixtures: import the helpers (`makeTemplate`, `playable`, `dimmed`, `castEntry`) from `AscendantHandCastRail.test.tsx` if needed, or re-author them locally if cross-file imports break the pattern.

### 2.3 Add 2560×1440 sample snapshots

Per `project_viewport_target` memory: 2560×1440 is the optimal viewport. Two snapshots only — sample, not full coverage.

In the new `EncounterScreen.layout.test.tsx`:
- Full populated layout at `width: 2560, height: 1440` → `expect(asFragment()).toMatchSnapshot('encounter-screen-2560x1440')`

In the existing `DetailModal.test.tsx`:
- Depth-1 modal at `width: 2560, height: 1440` → `expect(asFragment()).toMatchSnapshot('detail-modal-2560x1440')`

Do not add 2560×1440 variants to other components. The contract is "sample", not "full".

### 2.4 Out of scope (this ticket)

These are tracked in the follow-up below, not here:

- `SceneStatePanel`, `DriftIndicator`, `DetectionThread` (C4 — THR-333, currently Ready for Dev)
- `ThreadOverlay` and its 5 animation beats (D1 — THR-334, currently Ready for Dev)
- 9 `EffectRegistration` components (D2 — THR-335, currently Ready for Dev)
- New 2560×1440 snapshots beyond the two in §2.3

The follow-up issue (§5) tracks these snapshots as those PRs land.

## 3. Test infrastructure conventions (already established — follow them)

- File header: `// @vitest-environment jsdom`
- Imports: `import { describe, it, expect } from 'vitest';` plus `render` (and `screen` only if used) from `@testing-library/react`
- Viewport wrapper: literal `<div style={{ width: 1920, height: 1080 }}>{node}</div>` (or 2560×1440 for the two §2.3 cases)
- Snapshot call: `expect(asFragment()).toMatchSnapshot()` for single-fixture tests; `expect(asFragment()).toMatchSnapshot('label')` when one `it` block produces multiple snapshots (pattern used in `OutcomeForecastBand.test.tsx`)
- One snapshot file per test file under `__snapshots__/<filename>.snap`
- Test IDs: assert via existing `data-testid` attributes — do not add new ones to source components for these tests
- Determinism: never read `Date.now()` / `Math.random()` / system locale inside fixtures. All literals static strings/numbers.
- Do not mock the world graph — these are pure component snapshot tests on isolated props

## 4. Files to touch

**Edits (existing tests — fixture additions only):**

- `src/components/Game/Encounter/__tests__/EncounterChoiceCard.test.tsx`
- `src/components/Game/Encounter/__tests__/OutcomeForecastBand.test.tsx`
- `src/components/Game/Encounter/__tests__/AscendantHandCastRail.test.tsx`
- `src/components/Game/Encounter/DetailPage/__tests__/TypedDetailPages.test.tsx` *(only if missing 1920×1080 wrapper)*
- `src/components/shared/__tests__/DetailModal.test.tsx`

**Edits (existing snapshot files — regenerate only as fixture additions demand):**

- `src/components/Game/Encounter/__tests__/__snapshots__/EncounterChoiceCard.test.tsx.snap`
- `src/components/Game/Encounter/__tests__/__snapshots__/OutcomeForecastBand.test.tsx.snap`
- `src/components/Game/Encounter/__tests__/__snapshots__/AscendantHandCastRail.test.tsx.snap`
- `src/components/Game/Encounter/DetailPage/__tests__/__snapshots__/TypedDetailPages.test.tsx.snap` *(only if §2.1 wrapper change required)*
- `src/components/shared/__tests__/__snapshots__/DetailModal.test.tsx.snap`

**Creates (new test files + companion snapshot files generated by vitest):**

- `src/components/Game/Encounter/__tests__/EiraHeroPanel.test.tsx`
- `src/components/Game/Encounter/__tests__/CapabilityStrip.test.tsx`
- `src/components/Game/Encounter/__tests__/EncounterScreen.layout.test.tsx`
- `src/components/Game/Encounter/__tests__/__snapshots__/EiraHeroPanel.test.tsx.snap` *(generated)*
- `src/components/Game/Encounter/__tests__/__snapshots__/CapabilityStrip.test.tsx.snap` *(generated)*
- `src/components/Game/Encounter/__tests__/__snapshots__/EncounterScreen.layout.test.tsx.snap` *(generated)*

**Deletes:** none.

**Source components (`*.tsx` outside `__tests__/`):** **untouched.** If a snapshot test fails because a component lacks a needed test ID, file the missing-testid as a separate concern in this ticket's closeout comment — do not edit source components in this Codex pickup.

## 5. Follow-up issue (Codex creates this; do not block on it)

After landing this ticket, file a follow-up Linear issue titled **"Encounter UI Phase G2.1 — Snapshot tests for C4 / D1 / D2 components"** with:

- Project: Encounter Experience
- Parent: ARC-102
- State: Idea (will be promoted to Ready for Codex once C4/D1/D2 merge)
- Labels: `model:haiku`
- Description body: link this plan doc; list the deferred components (SceneStatePanel, DriftIndicator, DetectionThread, ThreadOverlay, 9 EffectRegistration components); state that THR-333 / THR-334 / THR-335 must all be Done before this ticket moves to Ready for Codex; reference §2.4 of this spec.

Codex creates the issue with `mcp__7aa97de8-...__save_issue`. No need to design G2.1 further than the description above — when the C4/D1/D2 components actually exist on main, a future Cowork session will produce the tightened spec.

## 6. Done when (binary checklist)

- [ ] §2.1 — five existing test files updated with the additional fixtures listed in the table; `npm test` green
- [ ] §2.2 — three new test files created at the paths listed; each contains at least the fixtures listed in its row; `npm test` green
- [ ] §2.3 — `EncounterScreen.layout.test.tsx` includes a `2560x1440` snapshot; `DetailModal.test.tsx` includes a `2560x1440` snapshot
- [ ] No source `*.tsx` components modified (only test files + generated `__snapshots__/*.snap`)
- [ ] `npx tsc --noEmit` clean
- [ ] `npx vite build` succeeds
- [ ] `npm test` runs clean — all snapshot tests pass on first run after generation
- [ ] Follow-up issue (§5) created in Linear; link the new issue ID in this ticket's closeout comment
- [ ] Commit body includes `Fixes THR-344` for auto-close
- [ ] Closeout comment on THR-344 pastes raw terminal output for `npm test`, `npx tsc --noEmit`, `npx vite build`

## 7. Three-pillar coverage

| Pillar | Status |
|--------|--------|
| Engine | N/A — no engine module touched |
| Content | N/A — no content authored |
| UI | All work lives in this pillar — snapshot tests on shipped UI components |

Wiring: G2 does not introduce new wiring. It validates wiring already produced by C1, C2, C3, E2 (all merged). No `wiring-checklist.md` update required.

## 8. NFP compliance

| NFP | Compliance |
|-----|-----------|
| 1. Tunability | N/A — no tunable constants introduced |
| 2. Inspectability | PASS — snapshot tests are themselves an inspectability surface |
| 3. Determinism | PASS — fixtures are static literals; no PRNG, no Date.now |
| 4. Fail-soft | PASS — snapshot tests must not throw; tests for empty/null props confirm fail-soft renders |
| 5. Narrative over mechanical | N/A |
| 6. Additive | PASS — only adds tests; no source modifications |
| 7. Performance budget | N/A — test runtime is negligible |

## 9. Coordination block (lifted to Linear handoff comment)

- **Plan doc:** Docs/plans/2026-05-07-thr-G2-snapshot-tests-spec.md (this file)
- **Parallel-safe with:** G1 (THR-343), G3 (THR-345), F-phase tickets (THR-339, THR-340, THR-341, THR-342)
- **Mutex with:** none
- **Codex review:** no (test code; review via diff + green CI per parent phasing plan §6)
- **Files to touch:** see §4 (5 edits, 3 creates, plus generated snapshot files)
- **Done when:** see §6
