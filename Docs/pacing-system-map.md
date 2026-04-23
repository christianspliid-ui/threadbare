# Pacing System Map

## Overview

Threadbare pacing is currently split across two runtime layers that share the same doom-clock time base: (1) **macro pacing** (doom progression, journey beat scheduling, mandate checkpoints) and (2) **interrupt pacing** (attention-tier story beats routed through the pacing governor). Ownership is mostly in `src/engine/` (`phaseDoom`, `journeyEngine`, `phaseMandate`, `phaseAttention`, `pacingGovernor`) with tuning constants in `src/data/` (`game-config`, `attention-constants`) and presentation in `src/components/Game/`.

## Core Files

- `src/data/game-config.ts` — global pacing constants for doom length, journey phase boundaries, and mandate checkpoint thresholds.
- `src/engine/doomClock.ts` — doom clock state machine (`advanceDoomClock`, stage derivation, tick modifier).
- `src/engine/phaseDoom.ts` — applies doom stage advances each tick and emits stage effects.
- `src/types/journeyEngine.ts` — journey pacing constants + phase boundary model keyed to doom progress.
- `src/engine/journeyEngine.ts` — calculates beat thresholds and enqueues journey vignettes when doom progress crosses them.
- `src/engine/phaseMandate.ts` — evaluates mandate checkpoints against `doomClock.progress` thresholds.
- `src/types/attention.ts` — attention-tier and story-beat queue contracts (`QueuedStoryBeat`, `StoryBeatPriority`).
- `src/data/attention-constants.ts` — story-beat cooldown and queue-cap tuning.
- `src/engine/attentionTier.ts` — maps intrinsic tier + court position to effective tier.
- `src/engine/phaseAgentDecision.ts` — stamps `effectiveTier` onto newly created actions/encounters.
- `src/engine/pacingGovernor.ts` — queue + cooldown gate for story-beat delivery (`canFireStoryBeat`, `enqueue`, `dequeue`, `complete`).
- `src/engine/phaseAttention.ts` — runtime bridge that feeds active story-beat encounters into the pacing governor.
- `src/engine/siegeResolution.ts` — siege spotlight/regional content consumer; pushes story beats into `storyBeatQueue`.
- `src/components/Game/GameView.tsx` — reads `pacingActiveStoryBeat`, renders StoryBeat modal, and marks beat completion on dismiss.
- `src/components/Game/StoryBeatModal.tsx` — full-screen interrupt UI for active story beats.
- `src/composition-dsl/schema.ts` / `validator.ts` / `worldTypes.ts` — event DSL precondition/effect model (`doom-clock` predicate, `advance-doom-clock` effect) used in validation harness.

## Public API

### Macro pacing (doom/journey/mandate)

- `advanceDoomClock(state: DoomClockState): DoomClockState` (`src/engine/doomClock.ts`)  
  Advances the run timer using `tickModifier`; computes stage and expiry.
- `getDoomClockStage(progress: number): number` (`src/engine/doomClock.ts`)  
  Converts normalized progress to chapter/stage index.
- `phaseDoom(state: GameState): Partial<GameState>` (`src/engine/phaseDoom.ts`)  
  Tick phase that applies doom advancement and stage side effects.
- `getBeatThresholds(phase: CampbellianPhase): number[]` (`src/engine/journeyEngine.ts`)  
  Calculates within-phase beat trigger points from doom-progress boundaries.
- `shouldBeatFire(doomProgress, prevDoomProgress, storyPhase, beatHistory)` (`src/engine/journeyEngine.ts`)  
  Threshold-crossing gate for journey beat emission.
- `phaseJourneyBeat(state, templates): Partial<GameState>` (`src/engine/journeyEngine.ts`)  
  Orchestrator hook that appends pending vignettes when thresholds fire.

### Interrupt pacing (story-beat queue)

- `resolveEffectiveTier(intrinsicTier, courtPosition)` (`src/engine/attentionTier.ts`)  
  Maps authored attention tier to runtime effective tier.
- `canFireStoryBeat(pacing: PacingState, currentTick: number): boolean` (`src/engine/pacingGovernor.ts`)  
  Slot-open + cooldown check.
- `enqueueStoryBeat(pacing: PacingState, beat: QueuedStoryBeat): QueuedStoryBeat | null` (`src/engine/pacingGovernor.ts`)  
  Priority-sorted insert; returns demoted beat on overflow.
- `dequeueStoryBeat(pacing: PacingState, currentTick: number): QueuedStoryBeat | null` (`src/engine/pacingGovernor.ts`)  
  Pops next queued beat and marks it active.
- `completeStoryBeat(pacing: PacingState, tick: number): void` (`src/engine/pacingGovernor.ts`)  
  Clears active beat + records cooldown origin tick (currently unused by runtime; UI writes equivalent fields directly).
- `phaseAttention(state, templates, rng): Partial<GameState>` (`src/engine/phaseAttention.ts`)  
  Pulls active `story_beat` encounters from runtime state into the pacing governor and writes back queue/active markers.

### Composition DSL (event authoring surface, validator-only today)

- `PredicateDoomClock { op: 'doom-clock'; comparator; tier }` (`src/composition-dsl/schema.ts`)  
  Lets event recipes gate firing on doom tier.
- `Effect { op: 'advance-doom-clock'; by: number }` (`src/composition-dsl/schema.ts`)  
  Lets recipes express doom advancement side effects.
- `WorldSnapshot.doomClockTier` (`src/composition-dsl/worldTypes.ts`)  
  Runtime input field expected by validator predicate evaluation.

## How Existing Content Uses It

### 1) Unified action template -> story-beat interrupt (encounter path)

1. Content marks narrative weight via `intrinsicTier` (example: `hex.raise_landmark` is `story_beat` in `src/data/unified-action-templates.ts`).
2. `phaseAgentDecision` creates a `UnifiedAction` and computes `effectiveTier` using `resolveEffectiveTier`.
3. `phaseAttention` scans unresolved `effectiveTier === 'story_beat'` actions, then either fires immediately (`pacingActiveStoryBeat`) or queues via `enqueueStoryBeat`.
4. `GameView` reads `pacingActiveStoryBeat`, resolves template/agent context, and renders `StoryBeatModal`.
5. On dismiss, UI writes `pacingActiveStoryBeat = null` and `pacingLastCompletedTick = currentTick` to start cooldown.

### 2) Siege spotlight -> story-beat queue (location encounter path)

1. Siege content declares `intrinsicTier` on spotlight templates (`src/data/siege-encounter-content.ts`).
2. `siegeResolution` computes `effectiveTier` with `resolveEffectiveTier`.
3. If story-beat tier, siege code pushes `QueuedStoryBeat` into `state.storyBeatQueue`.
4. `phaseAttention` consumes queue state through pacing governor and can promote one beat to active.
5. UI interrupt flow is identical to unified actions once active.

### 3) Doom clock -> journey/mandate tempo (quest/progression path)

1. `phaseDoom` advances `doomClock.progress`.
2. `phaseJourneyBeat` uses doom progress boundaries to fire journey beats at phase thresholds.
3. `phaseMandate` evaluates checkpoint thresholds against the same `doomClock.progress`.
4. `game-config` centralizes the macro timing boundaries and checkpoint cadence values.

## Where Events Would Plug In (THR-225 target)

Current event recipe surface is precondition/effect-only (`doom-clock` predicate, `advance-doom-clock` effect) and does not yet hook into runtime encounter pacing. Concrete insertion points:

1. **Authoring contract**: extend composition header in `src/composition-dsl/schema.ts` (and validator world contract) with a pacing declaration that references existing runtime vocabulary, rather than introducing per-recipe bespoke tick math.
2. **Runtime classification**: map event recipes to runtime actions/encounters that already carry `intrinsicTier` and flow through `resolveEffectiveTier` + `phaseAttention`.
3. **Governor integration**: feed event-generated story beats into `PacingState` through `enqueueStoryBeat` / `dequeueStoryBeat` rather than custom event timers.
4. **Macro alignment**: for doom-phased events, reuse `doomClock.progress` thresholds and `game-config` boundaries (same model used by journey + mandate) so event phase activation cadence stays globally coherent.
5. **UI contract**: rely on existing `pacingActiveStoryBeat` + `StoryBeatModal` path for interrupt-class event beats.

## Misalignments To Carry Into THR-225

- **No shared "slow/standard/fast" enum exists today**: pacing is represented by subsystem-specific knobs (doom thresholds, story-beat cooldown/queue cap, siege interval function), so event tier vocabulary must be normalized first.
- **Composition DSL is validator-only right now**: `src/composition-dsl/README.md` explicitly notes no CMS/runtime write-path integration, so event pacing declarations currently cannot affect live tick behavior.
- **`StoryBeatPriority` has unused variants in live writes**: runtime enqueue sites currently set only `template_intrinsic`; `doom_clock`, `faction_war`, and `promoted` are defined but not emitted.
- **`story_beat_queue` trace type is registered but not emitted by runtime queue operations**: queue visibility exists at type level but not in live trace output.
- **`completeStoryBeat` helper is not used by runtime integration**: completion is currently written directly from UI, bypassing the governor helper.
- **Queue deduplication is not enforced in `phaseAttention` ingest path**: repeated scans of unresolved story-beat actions can enqueue duplicate beat entries unless an upstream state change removes/demotes them.
