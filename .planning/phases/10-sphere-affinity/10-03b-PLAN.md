---
phase: 10-sphere-affinity
plan: 03b
type: execute
wave: 3
depends_on: [10-02]
files_modified:
  - src/engine/phaseUnifiedActionProgress.ts
  - src/engine/phaseEncounterProgressionV2.ts
  - src/engine/phaseRivalActions.ts
  - src/__tests__/engine/spherePressureWiring.test.ts
autonomous: true
requirements: [SPHR-11]

must_haves:
  truths:
    - "Successful divine actions push SpherePressureEvent with magnitude ACTION_PRESSURE_SUCCESS=3"
    - "Failed divine actions push SpherePressureEvent with magnitude ACTION_PRESSURE_FAILURE=1"
    - "Encounter step resolution pushes SpherePressureEvent with magnitude ENCOUNTER_PRESSURE_PER_STEP=1"
    - "Rival actions push SpherePressureEvent with magnitude RIVAL_PRESSURE_MAGNITUDE=2"
    - "Contract tests verify real phase output produces real SpherePressureEvents"
  artifacts:
    - path: "src/engine/phaseUnifiedActionProgress.ts"
      provides: "Action progress phase with sphere pressure wiring"
    - path: "src/engine/phaseEncounterProgressionV2.ts"
      provides: "Encounter progression phase with sphere pressure wiring"
    - path: "src/engine/phaseRivalActions.ts"
      provides: "Rival actions phase with sphere pressure wiring"
    - path: "src/__tests__/engine/spherePressureWiring.test.ts"
      provides: "Contract tests verifying upstream phases produce real SpherePressureEvents"
  key_links:
    - from: "src/engine/phaseUnifiedActionProgress.ts"
      to: "pendingSpherePressures"
      via: "push SpherePressureEvent on action resolution"
      pattern: "pendingSpherePressures.*push|SpherePressureEvent"
    - from: "src/engine/phaseEncounterProgressionV2.ts"
      to: "pendingSpherePressures"
      via: "push SpherePressureEvent on encounter step"
      pattern: "pendingSpherePressures.*push|SpherePressureEvent"
    - from: "src/engine/phaseRivalActions.ts"
      to: "pendingSpherePressures"
      via: "push SpherePressureEvent on rival action"
      pattern: "pendingSpherePressures.*push|SpherePressureEvent"
---

<objective>
Wire action progress, encounter progression, and rival action phases to push SpherePressureEvents, then write contract tests verifying the full upstream pressure pipeline.

Purpose: These are the remaining 3 of 6 upstream pressure sources. Contract tests ensure the wiring produces real events, not just type-checks.
Output: 3 modified engine phases + contract test suite verifying real pressure event production.
</objective>

<execution_context>
@C:/Users/chris/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/chris/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/phases/10-sphere-affinity/10-01-SUMMARY.md
@.planning/phases/10-sphere-affinity/10-02-SUMMARY.md
@Docs/plans/2026-03-28-world-soul-connection-design.md

<interfaces>
From src/types/sphereAffinity.ts:
```typescript
export interface SpherePressureEvent {
  targetEntityId: string;
  sphere: SphereName;
  magnitude: number;
  source: PressureSource;
  sourceId: string;
}
export type PressureSource = 'divine_action' | 'control_effect' | 'encounter' | 'doom' | 'rival' | 'mandate' | 'overchannel' | 'environmental';
export const ACTION_PRESSURE_SUCCESS = 3;
export const ACTION_PRESSURE_FAILURE = 1;
export const ENCOUNTER_PRESSURE_PER_STEP = 1;
export const RIVAL_PRESSURE_MAGNITUDE = 2;
```

GameState accumulator:
```typescript
pendingSpherePressures?: SpherePressureEvent[];
```

Action templates already have:
```typescript
sphereAffinity?: SphereName; // on UnifiedActionTemplate
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Wire action progress, encounter progression, and rival actions to push sphere pressure</name>
  <files>src/engine/phaseUnifiedActionProgress.ts, src/engine/phaseEncounterProgressionV2.ts, src/engine/phaseRivalActions.ts</files>
  <read_first>
    src/engine/phaseUnifiedActionProgress.ts
    src/engine/phaseEncounterProgressionV2.ts
    src/engine/phaseRivalActions.ts
    src/types/sphereAffinity.ts
    src/types/unifiedAction.ts
    Docs/plans/2026-03-28-world-soul-connection-design.md
  </read_first>
  <action>
**phaseUnifiedActionProgress.ts** — burst on action resolution:
- Import `SpherePressureEvent`, `ACTION_PRESSURE_SUCCESS`, `ACTION_PRESSURE_FAILURE` from `../types/sphereAffinity`
- Find where action steps resolve (success/failure outcome). The action template has `sphereAffinity?: SphereName`.
- On successful resolution: push pressure on the action's target entity:
  ```typescript
  { targetEntityId: action.targetEntityId, sphere: template.sphereAffinity, magnitude: ACTION_PRESSURE_SUCCESS, source: 'divine_action', sourceId: action.id }
  ```
- On failed resolution: same target, same sphere, magnitude `ACTION_PRESSURE_FAILURE`.
- If template has no `sphereAffinity`, skip (fail-soft: no pressure for non-sphere actions).
- Return updated `pendingSpherePressures`.

**phaseEncounterProgressionV2.ts** — burst on encounter step:
- Import `SpherePressureEvent`, `ENCOUNTER_PRESSURE_PER_STEP` from `../types/sphereAffinity`
- Find where encounter steps resolve. Encounters may have a sphere (from template or context).
- On each step resolution: push pressure on the encounter's hex/location:
  ```typescript
  { targetEntityId: encounterLocationId, sphere: encounterSphere, magnitude: ENCOUNTER_PRESSURE_PER_STEP, source: 'encounter', sourceId: encounterId }
  ```
- Determine encounter sphere from the encounter template's `sphereAffinity` or the dominant sphere of the encounter's category. If unknown, skip.
- Return updated `pendingSpherePressures`.

**phaseRivalActions.ts** — burst on rival action:
- Import `SpherePressureEvent`, `RIVAL_PRESSURE_MAGNITUDE` from `../types/sphereAffinity`
- Find where rival actions resolve.
- Push pressure on the rival action's target:
  ```typescript
  { targetEntityId: targetId, sphere: rivalActionSphere, magnitude: RIVAL_PRESSURE_MAGNITUDE, source: 'rival', sourceId: rivalActionId }
  ```
- Determine sphere from the rival action template. If no sphere, skip.
- Return updated `pendingSpherePressures`.

For all three: the pattern is to spread `state.pendingSpherePressures ?? []` into a new array, push new events, and include the array in the returned partial state.
  </action>
  <verify>
    <automated>npx tsc --noEmit && npm test</automated>
  </verify>
  <done>Action progress, encounter progression, and rival actions push SpherePressureEvents. Type check clean. No regressions.</done>
</task>

<task type="auto">
  <name>Task 2: Contract tests verifying upstream phases produce real SpherePressureEvents</name>
  <files>src/__tests__/engine/spherePressureWiring.test.ts</files>
  <read_first>
    src/engine/phaseUnifiedActionProgress.ts
    src/engine/phaseControlEffects.ts
    src/engine/phaseDoom.ts
    src/types/sphereAffinity.ts
    src/types/gameState.ts
  </read_first>
  <action>
Write contract tests in `src/__tests__/engine/spherePressureWiring.test.ts` that:
1. Create a minimal GameState with real graph, real agents, real hex tiles
2. Set up conditions that trigger each pressure source (active control effect, doom tier change, action resolution, encounter step, rival action, mandate milestone)
3. Run the actual phase function
4. Assert `pendingSpherePressures` contains the expected SpherePressureEvent entries with correct sphere, magnitude, source, and targetEntityId.
5. These are CONTRACT tests — use real phase output, not mocks.

At minimum:
- Test: phaseControlEffects with active sphere-tagged control effect produces pressure events
- Test: phaseUnifiedActionProgress with completed sphere-tagged action produces pressure events
- Test: phaseDoom with tier escalation produces entropy pressure events
  </action>
  <verify>
    <automated>npx vitest run src/__tests__/engine/spherePressureWiring.test.ts && npx tsc --noEmit</automated>
  </verify>
  <done>Contract tests verify that real upstream phase execution produces real SpherePressureEvents with correct sphere, magnitude, and source fields.</done>
</task>

</tasks>

<verification>
- `npx tsc --noEmit` — type check clean
- `npm test` — all tests pass including contract tests
- `npx vite build` — production build succeeds
- CLI smoke test: `npm run cli -- --seed 42` then `tick 30` then `events 10` — verify sphere_pressure traces appear after actions/encounters resolve
</verification>

<success_criteria>
All 3 remaining upstream phases push SpherePressureEvents to the accumulator. Contract tests prove real phase output feeds real pressure events into the resolution pipeline. Combined with Plan 10-03, the full pressure loop is operational: actions/encounters/doom/rivals/control/mandate -> accumulator -> phaseSpherePressure -> resolved sphere score changes.
</success_criteria>

<output>
After completion, create `.planning/phases/10-sphere-affinity/10-03b-SUMMARY.md`
</output>
