# Objective Triangle Sync

Date: 2026-04-08
Status: Implemented

## Goal

Reshape the three long-term objective systems so they behave like one readable run arc instead of three drifting subsystems:

1. Doom Clock = world-pressure schedule.
2. The First's Journey = personal arc paced by that same schedule.
3. Mandate = remembrance-shaped proof that the ascendant is actually changing the world before the clock runs out.

The player should be able to read, from the top bar alone, how close the world is to crisis, where The First sits in their story, and whether the mandate is keeping pace.

## Core Decisions

### 1. Shared Run Structure

The run now uses one five-chapter cadence. Chapters one through four carry The First through the journey arc. Chapter five is reserved as the climax window.

| Chapter | Doom progress | The First | Purpose |
|---|---:|---|---|
| 1 | `0.00 - 0.20` | Call | Establish pressure and direction |
| 2 | `0.20 - 0.55` | Trials | Build momentum and relationships |
| 3 | `0.55 - 0.70` | Crisis | Force commitment and losses |
| 4 | `0.70 - 0.80` | Ordeal -> Return | Resolve the personal arc before the finale |
| 5 | `0.80 - 1.00` | Climax aftermath | Let the world-ending pressure land |

### 2. Remembrance-Driven Mandates

Mandates are no longer picked as a mostly separate template roll. They are generated from the ascendant's remembrance identity:

| Input | Output |
|---|---|
| Primary sphere | Main growth target |
| Secondary sphere | Supporting growth target |
| Court type | Secondary objective shape |
| Mandate direction text | Player-facing prose wrapper |

The current v1 mandate asks the player to increase the global aggregate strength of both chosen spheres from run-start baselines before doom expires.

The old player-facing mandate label `Threads of Fate` is retired to avoid collision with The First's journey language. The legacy bond-focused mandate is now presented as `Web of Mortal Bonds`.

### 3. Checkpoints Feed Doom

Mandate progress is evaluated at shared doom checkpoints. Each checkpoint compares observed sphere growth against expected growth.

| Outcome | Result |
|---|---|
| Missed checkpoint | Add doom debt to the next escalation |
| Held checkpoint | No extra modifier |
| Exceeded checkpoint | Bank a counter-omen that softens a future escalation |

This turns mandate pacing into a real strategic race instead of a passive side tracker.

### 4. Doom Becomes Card-Driven World Pressure

Doom escalation now resolves authored doom-card effects rather than only advancing a timer. The cards apply large-scale world consequences such as:

- corruption spread on random hexes
- prosperity shocks across settlements
- unrest pressure on populated places
- entropy pressure on locations or threaded agents

Resolved doom cards are stored in run state and surfaced to the player so the world-scale fallout stays legible.

## Constants

| Constant | Default | Purpose |
|---|---:|---|
| `DEFAULT_DOOM_TICKS` | `200` | Shared run length |
| `JOURNEY_CALL_PHASE_END` | `0.20` | End of Call |
| `JOURNEY_TRIALS_PHASE_END` | `0.55` | End of Trials |
| `JOURNEY_CRISIS_PHASE_END` | `0.70` | End of Crisis |
| `JOURNEY_ORDEAL_PHASE_END` | `0.80` | Return resolves before climax |
| `DOOM_CLIMAX_START` | `0.80` | Final chapter begins |
| `MANDATE_PRIMARY_TARGET_DELTA` | `0.18` | Required primary sphere growth |
| `MANDATE_SECONDARY_TARGET_DELTA` | `0.10` | Required secondary sphere growth |
| `MANDATE_COUNTER_OMEN_MARGIN` | `0.04` | Extra lead required to bank a counter-omen |
| `DOOM_CARD_SEVERITY_STEP` | `0.35` | Escalation severity scaling per debt/omen step |
| `DOOM_CARD_HEX_TARGET_COUNT` | `4` | Default hex blast radius for card effects |
| `DOOM_CARD_SETTLEMENT_TARGET_COUNT` | `3` | Default settlement reach for card effects |

## Tracing

The redesign adds explicit inspectability for both sides of the race.

```ts
export interface DoomCardTrace extends TraceBase {
  category: 'doom_card';
  stage: number;
  archetype: string;
  cardId: string;
  cardTitle: string;
  severity: number;
  effectType?: string;
  targetCount?: number;
}

export interface MandateCheckpointTrace extends TraceBase {
  category: 'mandate_checkpoint';
  checkpointIndex: number;
  doomProgressThreshold: number;
  requiredPrimaryDelta: number;
  observedPrimaryDelta: number;
  passed: boolean;
  exceeded: boolean;
  counterOmensDelta: number;
  severityPenaltyDelta: number;
}
```

Player-facing visibility also uses `doom_escalation` and `mandate_progress` tick events for alerts, popups, and chronicle-style summaries.

## PRNG

| System | Randomness policy |
|---|---|
| Doom card selection | Seeded PRNG in `doomClock.ts` for climax-card picks |
| Doom card targeting | Seeded PRNG for hex / settlement / agent picks |
| Mandate progress | Deterministic arithmetic only |
| Journey pacing | No new PRNG; uses shared doom progress thresholds |

Same seed plus same inputs still yields the same doom deck and same objective pacing outcomes.

## Fail-Soft

| Failure case | Fallback |
|---|---|
| Missing remembrance identity | Use sphere defaults and preserve legacy mandate support |
| Missing aggregate sphere data | Skip sphere-growth evaluation for the tick |
| Missing valid doom targets | Resolve the card with zero targets and keep the run alive |
| Unknown court secondary objective | Treat it as zero progress instead of throwing |
| Legacy mandate on an older save | Continue through the legacy evaluator unchanged |

## UI Visibility

The player-facing objective strip is now meant to read as one system:

| Surface | New responsibility |
|---|---|
| `DoomBar` | Show doom progress plus The First's current phase and next beat hint |
| `DoomClockDetail` | Show chapter timeline, climax boundary, counter-omens, doom debt, and resolved doom-card fallout |
| `MandateTracker` | Show sphere deltas, next checkpoint, omen state, and side-objective progress in compact form |
| `MandateDetail` | Show baseline vs current sphere strength, checkpoint outcomes, doom debt, counter-omens, and court-shaped side objective |

## Wiring

| Surface | Connection |
|---|---|
| Orchestrator phase 0 | `phaseDoom` resolves doom cards and records `resolvedEvents` |
| Orchestrator phase 1.5 | `phaseJourneyBeat` reads the synced doom thresholds already defined in game config |
| Orchestrator phase 12.1 | `phaseMandate` evaluates sphere-growth progress, checkpoints, doom debt, and counter-omens |
| Game initialization | `gameInit.ts` seeds aggregate baselines and builds remembrance-driven mandates |
| GameState -> UI | `doomClock.resolvedEvents`, `doomClock.counterOmens`, `doomClock.nextEscalationSeverityModifier`, `mandateState.primaryDelta`, `mandateState.secondaryDelta`, and `mandateState.checkpointResults` now flow into Doom/Mandate UI |
| Debug visibility | `doom_card` and `mandate_checkpoint` traces show the pacing race inside the DebugPanel feed |

## NFP Compliance

| Priority | Status | Notes |
|---|---|---|
| Tunability | PASS | Shared thresholds and targets are all named constants |
| Inspectability | PASS | New trace categories plus explicit UI state for doom cards and checkpoints |
| Determinism | PASS | Seeded doom-card selection and arithmetic mandate evaluation |
| Fail-soft | PASS | Legacy mandates still work; missing runtime data degrades safely |
| Narrative over mechanical perfection | PASS | The First now resolves before the climax so the finale can react to that story outcome |
| Additive over destructive changes | PASS | Legacy evaluator remains; new runtime kind layers alongside it |
| Performance budget | PASS | Checkpoints and doom cards are low-frequency evaluations compared to per-tick simulation work |
