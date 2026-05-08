---
title: THR-374 Phase G2.1b — Snapshot tests for D2 EffectRegistration components (1920×1080) — Codex spec
date: 2026-05-08
status: ready-for-codex
parent: ARC-102 / Encounter Experience
phasing-plan: Docs/plans/2026-05-05-encounter-ui-implementation-phasing.md §3 Phase G2
predecessor: Docs/plans/2026-05-08-thr-365a-d1-threadoverlay-snapshot-spec.md (THR-365 G2.1a — D1 sibling)
predecessor-design: Docs/plans/2026-05-04-encounter-ui-canonical.md §4 (Moment 2 — Aftermath registration)
implementation: THR-335 (D2 EffectRegistration components — merged 2026-05-08T08:19 on origin/main, PR #212)
---

# THR-374 Phase G2.1b — D2 EffectRegistration snapshot tests (Codex spec)

## 1. Why this spec exists

THR-344 (G2 — initial 1920×1080 snapshot pass) deferred two component groups because their implementations were in flight at handoff time:

- **D1 ThreadOverlay** — picked up by THR-365 (G2.1a) once THR-334 merged. **Shipped 2026-05-08T08:50** under PR #214. Plan doc: `Docs/plans/2026-05-08-thr-365a-d1-threadoverlay-snapshot-spec.md`.
- **D2 EffectRegistration** — *this ticket*. Was held in Idea pending THR-335. **THR-335 merged 2026-05-08T08:19** on `origin/main` (PR #212). The gate is now open.

This spec narrows G2.1b to D2 EffectRegistration only. It is the direct sibling of THR-365a and inherits its conventions verbatim — only the component-under-test changes.

Existing test state on `origin/main` after THR-335:

- `src/components/Game/Encounter/EffectRegistration/` is a new subdirectory holding 10 component files (one per effect kind) plus an `index.ts` barrel.
- `src/hooks/useEffectSequencing.ts` is the new sequencing controller (lane assignments + timing windows + discipline rules per canonical UI spec §4.2 / §4.3).
- No `__tests__` file exists yet for the new components. Codex creates the snapshot test file from scratch.

## 2. Scope (this ticket)

Add 1920×1080 snapshot tests covering each of the **ten** EffectRegistration components shipped by THR-335 (the canonical UI spec §4.1 originally listed nine effect kinds; THR-328 added `archetype_drift_register` as the tenth — verified against THR-335's "Files to touch" block, which lists ten `*Landing.tsx` files).

**No source `*.tsx` modifications.** No `useEffectSequencing` test coverage in this ticket — the sequencing-scenario snapshots (1 / 3 / 6+ concurrent effects) are intentionally deferred (see §2.4).

### 2.1 Components to cover (10 snapshots)

One snapshot per component, rendered with a representative payload sourced from the v7 reference component (`Docs/plans/v7-design-pass/parts/moment2-aftermath.jsx`) so fixture content matches the design canvas the components were built against.

| # | Component | Effect kind | Sphere coding | Lands in (per §4.1) |
|---|---|---|---|---|
| 1 | `IntelligenceLanding` | `intelligence` | mind-blue | Items rail · hero panel |
| 2 | `ConditionAttachmentLanding` | `condition_attachment` | spirit-violet | Disposition strip |
| 3 | `ReputationTallyLanding` | `reputation_tally` | force-red | Cast tile (left border pulse) |
| 4 | `ReputationScoreLanding` | `reputation_score` | force-red | Cast tile (prose band) |
| 5 | `EncounterSeedLanding` | `encounter_seed` | time-orange | "Moments that could echo" strip |
| 6 | `HiddenMarkLanding` | `hidden_mark` | dark-violet | Portrait edge thread |
| 7 | `RecentEventLanding` | `recent_event` | spirit-violet | Echo strip |
| 8 | `SpawnArtifactLanding` | `spawn_artifact` | matter-umber | Items rail (card-flip) |
| 9 | `FactionLanding` | `faction_*` | order-gold | Scene state · faction chip |
| 10 | `ArchetypeDriftLanding` | `archetype_drift_register` | chaos-grey | Capability bands · hero panel |

For every snapshot the component is rendered inside `<div style={{ position: 'relative', width: 1920, height: 1080 }}>`. This mirrors the parent panel context the components are designed against (hero panel, right rail, etc.) and matches THR-365a §3's wrapper convention.

### 2.2 Fixture

**Source the payload literal for each component from `Docs/plans/v7-design-pass/parts/moment2-aftermath.jsx`.** That reference component is the canonical specification for the props each landing receives. Read it once, lift the `props` object for each tile, paste it as a const in the test file, and pass it as the component prop. No new fictional fixtures.

If the actual component prop shape on `origin/main` diverges from the v7 reference (e.g. THR-335 renamed a field), prefer the shipped contract — the test must compile against the real component types. In that case:

1. Read the component's TS prop types.
2. Construct the closest equivalent payload from the v7 reference values (same effect content, conformed shape).
3. Note the divergence in the closeout comment so a follow-up Linear issue can sync the v7 reference with the shipped contract.

Do **not** mock the world graph or the sequencing hook — these are pure component snapshot tests on isolated props.

### 2.3 Snapshot labels

Single `it` block per component, one snapshot per `it`. Match the THR-365a multi-component convention: use no label argument when there is one snapshot per `it`. The snapshot key falls out of the `describe` + `it` names.

Top-level `describe`: `'EffectRegistration 1920×1080 snapshot grid'`.

Per-component `it` titles (use these verbatim so the snapshot file is greppable):

- `'renders IntelligenceLanding at 1920×1080'`
- `'renders ConditionAttachmentLanding at 1920×1080'`
- `'renders ReputationTallyLanding at 1920×1080'`
- `'renders ReputationScoreLanding at 1920×1080'`
- `'renders EncounterSeedLanding at 1920×1080'`
- `'renders HiddenMarkLanding at 1920×1080'`
- `'renders RecentEventLanding at 1920×1080'`
- `'renders SpawnArtifactLanding at 1920×1080'`
- `'renders FactionLanding at 1920×1080'`
- `'renders ArchetypeDriftLanding at 1920×1080'`

### 2.4 Out of scope (this ticket)

- **Sequencing-scenario snapshots** (1 / 3 / 6+ concurrent effects exercising `useEffectSequencing`). THR-335's Done-when mentions these; G2.1b intentionally defers them. They require fake-timer control (`vi.useFakeTimers()`, `act()`, time-window assertions) which is materially more involved than per-component render snapshots. File a follow-up Linear issue if missing — see §10.
- **`useEffectSequencing` unit tests** (lane assignment math, discipline rule logic). If absent on `origin/main`, file as part of the same follow-up. Engine-test territory, not component-snapshot territory.
- **Audio-cue tests.** Per canonical UI spec §4.3 audio is cued only on first registration; `onEffectLand` callbacks are deferred to post-v1 (THR-346 sound-design pass). Out of scope here.
- **Visual regression beyond snapshot equality.** No pixel-diff tooling.
- **2560×1440 sample.** Not requested for this ticket; the EncounterScreen 2560×1440 snapshot in G2 (`EncounterScreen.layout.test.tsx`) is the project sample.
- **Source component modifications** (`*.tsx` outside `__tests__/`).

## 3. Test infrastructure conventions (mirror G2 + G2.1a)

- File header: `// @vitest-environment jsdom` at top of file.
- Imports: `render` from `@testing-library/react`; React; the ten `*Landing` components from `../EffectRegistration` (the barrel `index.ts` shipped by THR-335 is the canonical import path — prefer `from '../EffectRegistration'` over deep imports).
- Viewport wrapper: literal `<div style={{ position: 'relative', width: 1920, height: 1080 }}>{node}</div>` per THR-365a §3.
- Snapshot call: `expect(asFragment()).toMatchSnapshot()` (one snapshot per `it` — no label argument needed).
- Determinism: never read `Date.now()`, `Math.random()`, system locale, or animation timing inside fixtures. All literals static. Animations are CSS keyframe-driven; React snapshots capture the post-mount DOM, not the animated steady state — that is acceptable per the same logic as THR-365a (the snapshot's purpose is to detect structural regressions, not animation correctness).
- Do not mock the world graph or `useEffectSequencing` hook.
- Do not introduce new test-only dependencies.

## 4. Files to touch

**Creates:**

- `src/components/Game/Encounter/__tests__/EffectRegistration.test.tsx` — new file. ~120–160 lines (10 `it` blocks plus shared wrapper helper).

**Generated automatically by vitest on first green run:**

- `src/components/Game/Encounter/__tests__/__snapshots__/EffectRegistration.test.tsx.snap` — new file. **Commit the regenerated snapshot file.**

**Edits:** none (no existing file modified).

**Deletes:** none.

**Source components (`*.tsx` outside `__tests__/`):** **untouched.** If a snapshot fails because a component has missing `data-testid` or unstable id generation, that is a separate concern — file it in the closeout comment and do not edit source in this Codex pickup.

### 4.1 Decision: single test file vs. per-component files

**Use a single `EffectRegistration.test.tsx`.** Rationale:

- Mirrors the way `OutcomeForecastBand.test.tsx` (THR-344 G2 baseline) groups multiple snapshots per file.
- 10 small renders share the same wrapper and import surface — splitting into 10 files multiplies boilerplate without isolation benefit.
- One snapshot file is easier to review in PR diff than 10 mini-snapshot files.

If during pickup Codex finds the imports get unwieldy (e.g. circular barrel issues), it may switch to per-component test files. Note the deviation in closeout.

## 5. Done when (binary checklist)

- [ ] `src/components/Game/Encounter/__tests__/EffectRegistration.test.tsx` exists and contains a `describe('EffectRegistration 1920×1080 snapshot grid', …)` block with exactly the ten `it` blocks listed in §2.3.
- [ ] Each `it` renders its target component inside the 1920×1080 viewport wrapper with a payload sourced from `Docs/plans/v7-design-pass/parts/moment2-aftermath.jsx` (or a documented divergence in the closeout comment).
- [ ] `src/components/Game/Encounter/__tests__/__snapshots__/EffectRegistration.test.tsx.snap` is generated on first run and committed; ten new entries match the ten `it` titles in §2.3.
- [ ] No source `*.tsx` components modified — `git diff` shows changes only in `__tests__/EffectRegistration.test.tsx` and `__snapshots__/EffectRegistration.test.tsx.snap`.
- [ ] `npm test -- EffectRegistration` runs clean and reports the new snapshots written.
- [ ] `npm test` (full suite) green.
- [ ] `npx tsc --noEmit` clean.
- [ ] `npx vite build` succeeds.
- [ ] Closeout comment on THR-374 pastes raw terminal output for `npm test`, `npx tsc --noEmit`, and `npx vite build` (verification evidence per CLAUDE.md Definition of Done).
- [ ] Commit body includes `Fixes THR-374` for auto-close.

## 6. Three-pillar coverage

| Pillar | Status |
|--------|--------|
| Engine | N/A — no engine module touched; `useEffectSequencing` engine-side tests are deferred per §2.4 |
| Content | N/A — no content authored; fixtures are static literals lifted from the v7 design reference |
| UI | All work lives here — snapshot tests on the ten EffectRegistration components shipped by THR-335 |

Wiring: this ticket validates wiring already produced by THR-335. No `wiring-checklist.md` update required.

## 7. NFP compliance

| NFP | Compliance |
|-----|-----------|
| 1. Tunability | N/A — no tunable constants introduced |
| 2. Inspectability | PASS — snapshot tests are themselves an inspectability surface; ten per-component fixtures make each effect kind's render visually verifiable in PR review |
| 3. Determinism | PASS — fixtures are static literals; no PRNG, no `Date.now()`, no animation-timing reads (CSS keyframes are post-mount and don't affect the captured DOM tree) |
| 4. Fail-soft | PASS — each component is rendered with a representative payload; failure surfaces in `git diff` of the snapshot file rather than a runtime crash |
| 5. Narrative over mechanical | N/A |
| 6. Additive | PASS — only adds tests; no source modifications; no existing snapshot touched |
| 7. Performance budget | N/A — ten additional snapshot tests; sub-200ms incremental runtime |

## 8. Fail-soft considerations

- **Animation timing in JSDOM:** CSS keyframes do not advance under JSDOM the way they do in a real browser. The captured DOM is the post-mount, pre-animation state. This is a feature, not a bug — the snapshot is checking structural correctness, not animation choreography. If a snapshot looks "wrong" because an element is in its starting state (e.g. `opacity: 0`, `transform: rotateX(80deg)`), that is correct.
- **Inline SVG / large `<path d="…">` strings:** if any landing component uses inline SVG (e.g. `HiddenMarkLanding`'s portrait-edge thread), accept any vitest serialization size warning — these snapshots are intentionally large because the value lives in the SVG geometry. Do not configure custom serializers.
- **`useEffectSequencing` side-effects on mount:** if mounting a single landing component independently triggers a sequencing-hook timer or animation lane reservation, prefer to mount the component without invoking the hook. If the component's contract requires the hook context, wrap with the minimal provider needed and document it in the test file's header comment. Do not mock the hook.

## 9. Coordination block (lifted verbatim into Linear handoff comment)

- **Plan doc:** `Docs/plans/2026-05-08-thr-374-d2-effectregistration-snapshot-spec.md` (this file)
- **Parallel-safe with:** any non-`EffectRegistration.test.tsx` work; THR-368 (intel content opt-in); THR-266 / THR-215 (Continuous Improvement infra tickets)
- **Mutex with:** anything that touches `src/components/Game/Encounter/__tests__/EffectRegistration.test.tsx` or its `__snapshots__/` peer (none expected — file does not exist yet)
- **Codex review:** no — test code; review via diff + green CI
- **Files to touch:** see §4 (1 new test file + 1 generated snapshot file)
- **Done when:** see §5

## 10. Follow-up: deferred sequencing tests

The deferred items in §2.4 (sequencing-scenario snapshots, `useEffectSequencing` unit tests) are tracked separately if missing. Codex should:

1. Run `npm test -- useEffectSequencing` after pickup.
2. If no test file exists for the hook, file a new Linear issue in Encounter Experience titled "Encounter UI Phase G2.2 — `useEffectSequencing` unit tests + sequencing-scenario snapshots" with this spec doc as predecessor and THR-335 as implementation reference.
3. Set its state to `Idea`. Cowork will tighten and promote to Ready for Codex on a subsequent pass.

If the hook already has unit tests on `origin/main`, that step is skipped — note the existing file path in the closeout comment.
