---
title: THR-365a Phase G2.1a — Snapshot tests for D1 ThreadOverlay (1920×1080) — Codex spec
date: 2026-05-08
status: ready-for-codex
parent: ARC-102 / Encounter Experience
phasing-plan: Docs/plans/2026-05-05-encounter-ui-implementation-phasing.md §3 Phase G2
predecessor: Docs/plans/2026-05-07-thr-G2-snapshot-tests-spec.md (THR-344 G2)
sibling: THR-365b (D2 EffectRegistration snapshots, gated on THR-335 merge)
---

# THR-365a Phase G2.1a — D1 ThreadOverlay snapshot tests (Codex spec)

## 1. Why this spec exists

Originally THR-365 covered both D1 (ThreadOverlay) and D2 (EffectRegistration) snapshots and was held in Idea while waiting for both phases to merge. **D1 (THR-334) merged 2026-05-08T06:31** so its portion is now unblocked. D2 (THR-335) is still in Ready for Dev. Splitting THR-365 lets Codex pick up D1 immediately while D2 remains correctly gated.

This spec narrows G2.1 to D1 ThreadOverlay only. The D2 portion moves to a sibling ticket (THR-365b) that stays in Idea until THR-335 lands.

Existing test state (2026-05-08, on `origin/main`):
- `src/components/Game/Encounter/ThreadOverlay.tsx` exists (component shipped by THR-334).
- `src/components/Game/Encounter/__tests__/ThreadOverlay.test.tsx` exists with `useThreadReveal` hook tests + four ThreadOverlay render checks. **One existing snapshot** (`taut-three-choices`) at 800×400 — that snapshot is for the hook-driven render check and lives in a different `describe` block from the one this spec adds. Leave it alone.
- `src/hooks/useThreadReveal.ts` exists (six phases: `idle / committed / drawing / taut / resolving / settled`).

## 2. Scope (this ticket)

Add 1920×1080 snapshot tests for ThreadOverlay covering every render-distinct phase, in a new `describe` block within the existing test file. **No source `*.tsx` modifications.** No changes to the existing 800×400 snapshot.

### 2.1 Phases to cover (6 snapshots)

| Phase | `chosenReach` | Page dim | Threads visible | Notes |
|-------|---------------|----------|-----------------|-------|
| `idle` | `null` | no | no | SVG mounts, nothing else; baseline empty |
| `committed` | `null` | yes | no | dim active, threads hidden — peak anticipation |
| `drawing` | `null` | yes | yes | threads animating in |
| `taut` | `null` | yes | yes | threads at peak strength (1920×1080 variant of the existing 800×400 snapshot) |
| `resolving` | `'veil'` | yes | yes | chosen thread bright, unchosen dim |
| `settled` | `'veil'` | no | yes | chosen holds glow, no dim |

For every snapshot the component is rendered inside `<div style={{ position: 'relative', width: 1920, height: 1080 }}>` (the existing tests in this file use `position: relative` for ThreadOverlay since the component assumes `position: relative` parent — see `ThreadOverlay.tsx` JSDoc). Pass `width={1920} height={1080}` props to the component so the SVG viewBox matches.

### 2.2 Fixture

Reuse the file-scope `sampleChoices` constant already declared in `ThreadOverlay.test.tsx` (the 3-choice row covering `iron / veil / heart`). Do not introduce new fixtures.

### 2.3 Snapshot labels

This is a single `it` block producing six snapshots, mirroring the `OutcomeForecastBand.test.tsx` multi-snapshot pattern. Use this label set:

- `'phase-idle-1920x1080'`
- `'phase-committed-1920x1080'`
- `'phase-drawing-1920x1080'`
- `'phase-taut-1920x1080'`
- `'phase-resolving-1920x1080'`
- `'phase-settled-1920x1080'`

Or split into one `it` per phase with `expect(asFragment()).toMatchSnapshot()` (no label argument). Either pattern is acceptable per the G2 conventions doc — pick one and apply consistently across the new block.

### 2.4 Out of scope (this ticket)

- D2 EffectRegistration snapshots — see sibling THR-365b
- Hook (`useThreadReveal`) tests — already complete
- Source component modifications
- 2560×1440 sample — not requested for this ticket; the EncounterScreen 2560×1440 snapshot in G2 (`EncounterScreen.layout.test.tsx`) is the project sample
- Visual regression beyond snapshot equality (no pixel-diff tooling)
- Modifications to the existing 800×400 `taut-three-choices` snapshot

## 3. Test infrastructure conventions (mirror G2 — already established)

- File header: existing `// @vitest-environment jsdom` stays as-is.
- Imports: extend the existing imports as needed (`render` is already imported from `@testing-library/react`). No new test-only dependencies.
- Viewport wrapper: literal `<div style={{ position: 'relative', width: 1920, height: 1080 }}>{node}</div>`. The `position: relative` is required by the ThreadOverlay component contract.
- Snapshot call: `expect(asFragment()).toMatchSnapshot('label')` if multi-snapshot in one `it`; `expect(asFragment()).toMatchSnapshot()` if one snapshot per `it`.
- Determinism: never read `Date.now()`, `Math.random()`, or system locale inside fixtures. All literals static.
- Do not mock the world graph — these are pure component snapshot tests on isolated props.

## 4. Files to touch

**Edits:**

- `src/components/Game/Encounter/__tests__/ThreadOverlay.test.tsx` — append a new `describe('ThreadOverlay 1920×1080 snapshot grid', () => { … })` block at the end of the file. Do not modify the existing `describe('useThreadReveal', …)` or `describe('ThreadOverlay', …)` blocks. The existing 800×400 `taut-three-choices` snapshot inside the second block stays as-is.

**Creates (generated automatically by vitest on first green run):**

- `src/components/Game/Encounter/__tests__/__snapshots__/ThreadOverlay.test.tsx.snap` already exists with the 800×400 entry; the six new entries get appended on first run. **Commit the regenerated snapshot file.**

**Deletes:** none.

**Source components (`*.tsx` outside `__tests__/`):** **untouched.** If a snapshot fails because the component lacks a needed `data-testid`, that is a separate concern — file it in this ticket's closeout comment and do not edit source in this Codex pickup.

## 5. Done when (binary checklist)

- [ ] `src/components/Game/Encounter/__tests__/ThreadOverlay.test.tsx` contains a new `describe` block titled "ThreadOverlay 1920×1080 snapshot grid" (or equivalent) covering exactly the six phases listed in §2.1, each at 1920×1080 with the file-scope `sampleChoices` fixture.
- [ ] The existing 800×400 `taut-three-choices` snapshot in the prior `describe('ThreadOverlay', …)` block is unchanged (no new diff in the existing snapshot entry).
- [ ] `__snapshots__/ThreadOverlay.test.tsx.snap` is regenerated on first run and committed; six new entries match the six phase labels in §2.3.
- [ ] No source `*.tsx` components modified — git diff shows changes only in `__tests__/ThreadOverlay.test.tsx` and `__snapshots__/ThreadOverlay.test.tsx.snap`.
- [ ] `npm test -- ThreadOverlay` runs clean and reports the new snapshots written.
- [ ] `npm test` (full suite) green.
- [ ] `npx tsc --noEmit` clean.
- [ ] `npx vite build` succeeds.
- [ ] Closeout comment on THR-365 pastes raw terminal output for `npm test`, `npx tsc --noEmit`, and `npx vite build` (verification evidence per CLAUDE.md Definition of Done).
- [ ] Commit body includes `Fixes THR-365` for auto-close. (THR-365 is being repurposed as G2.1a; THR-365b is the new sibling for D2.)

## 6. Three-pillar coverage

| Pillar | Status |
|--------|--------|
| Engine | N/A — no engine module touched |
| Content | N/A — no content authored |
| UI | All work lives in this pillar — snapshot tests on a shipped UI component (ThreadOverlay) |

Wiring: this ticket validates wiring already produced by THR-334. No `wiring-checklist.md` update required.

## 7. NFP compliance

| NFP | Compliance |
|-----|-----------|
| 1. Tunability | N/A — no tunable constants introduced |
| 2. Inspectability | PASS — snapshot tests are themselves an inspectability surface; six phase fixtures make ThreadOverlay's per-phase render visually verifiable |
| 3. Determinism | PASS — fixtures are static literals; no PRNG, no Date.now |
| 4. Fail-soft | PASS — `idle` phase snapshot confirms empty render works; resolving snapshot confirms chosen-vs-unchosen opacity behaviour |
| 5. Narrative over mechanical | N/A |
| 6. Additive | PASS — only adds tests; no source modifications; existing 800×400 snapshot preserved |
| 7. Performance budget | N/A — six additional snapshot tests; sub-100ms incremental runtime |

## 8. Fail-soft considerations

If vitest reports a serialization warning for inline SVG (large `<path d="…">` strings), accept the warning — these snapshots are intentionally large because the ThreadOverlay's value lives in its SVG geometry. Do not configure custom serializers to shrink them.

## 9. Coordination block (lifted to Linear handoff comment)

- **Plan doc:** `Docs/plans/2026-05-08-thr-365a-d1-threadoverlay-snapshot-spec.md` (this file)
- **Parallel-safe with:** any non-`ThreadOverlay.test.tsx` work; THR-335 (D2 implementation); THR-368 (intel content opt-in)
- **Mutex with:** anything that touches `src/components/Game/Encounter/__tests__/ThreadOverlay.test.tsx` or its `__snapshots__/` peer
- **Codex review:** no — test code; review via diff + green CI
- **Files to touch:** see §4 (1 edit, 1 generated/regenerated snapshot file)
- **Done when:** see §5

## 10. Sibling ticket (D2)

A new sibling Linear issue (THR-365b — name TBD by Linear) tracks the D2 EffectRegistration snapshots. That ticket stays in Idea until THR-335 lands on `origin/main`. When that happens, a follow-up Cowork pass will tighten the D2 spec the same way this one tightened D1.
