/**
 * Phase Composition — advance phased event recipes tied to the doom clock.
 *
 * Runs after phaseDoom, before phaseAttention. Iterates activeCompositions and
 * evaluates each phase's activatesAt predicate. On activation: resolves nodes,
 * applies effects, enqueues story beats, emits traces.
 *
 * Ownership: the clock drives the runner (clock calls tiers on the event).
 */

import type { GameState, ActiveComposition } from '../types/gameState';
import type { Phase, WorldPredicate } from '../composition-dsl/schema';
import type { StoryBeatPriority } from '../types/attention';
import { emitTrace } from './traceBuffer';
import {
  PHASE_RUNNER_MAX_COMPOSITIONS_PER_TICK,
  PHASE_ACTIVATION_COOLDOWN_TICKS,
  COMPOSITION_FAILED_RETENTION_TICKS,
  COMPOSITION_COMPLETED_RETENTION_TICKS,
  STORY_BEAT_DEFAULT_MOOD,
  STORY_BEAT_DEFAULT_SPHERE,
  STORY_BEAT_DEFAULT_VOICE,
} from '../data/composition-config';
import { lookupStoryBeatTemplate } from '../data/story-beat-templates';

// ─── Predicate evaluation ─────────────────────────────────────────
// v1 whitelist: doom-clock, composition-fired, world-flag, has-faction-of-archetype,
// has-agent-of-archetype. Unknown ops treated as false with a warning (fail-soft).

function countActorsByArchetype(
  state: GameState,
  actorType: 'faction' | 'individual',
  archetype: string
): number {
  const actors = state.graph.getNodesByType('actor');
  const archetypeField = actorType === 'faction' ? 'factionDefId' : 'archetypeId';
  let count = 0;
  for (const node of actors) {
    if (node.properties.actorType !== actorType) continue;
    if (node.properties[archetypeField] === archetype) count += 1;
  }
  return count;
}

function satisfiesCountBounds(
  count: number,
  bounds: { gte?: number; lte?: number } | undefined
): boolean {
  if (!bounds || (bounds.gte === undefined && bounds.lte === undefined)) {
    return count >= 1;
  }
  if (bounds.gte !== undefined && count < bounds.gte) return false;
  if (bounds.lte !== undefined && count > bounds.lte) return false;
  return true;
}

function evaluatePhasePredicateV1(
  predicate: WorldPredicate,
  state: GameState
): boolean {
  switch (predicate.op) {
    case 'doom-clock': {
      const tier = state.doomClock.currentStage;
      if (predicate.comparator === 'gte') return tier >= predicate.tier;
      if (predicate.comparator === 'lte') return tier <= predicate.tier;
      return tier === predicate.tier;
    }
    case 'composition-fired': {
      const fired = new Set(state.firedCompositions ?? []);
      return fired.has(predicate.id);
    }
    case 'world-flag': {
      const flags = state.worldFlags ?? {};
      return flags[predicate.key] === predicate.value;
    }
    case 'has-faction-of-archetype': {
      const count = countActorsByArchetype(state, 'faction', predicate.archetype);
      return satisfiesCountBounds(count, predicate.count);
    }
    case 'has-agent-of-archetype': {
      const count = countActorsByArchetype(state, 'individual', predicate.archetype);
      return satisfiesCountBounds(count, predicate.count);
    }
    case 'and':
      return predicate.terms.every((t) => evaluatePhasePredicateV1(t, state));
    case 'or':
      return predicate.terms.some((t) => evaluatePhasePredicateV1(t, state));
    case 'not':
      return !evaluatePhasePredicateV1(predicate.term, state);
    default:
      // Unknown predicate op — treat as false per fail-soft table
      console.warn(`[phaseComposition] Unknown predicate op "${(predicate as { op: string }).op}" — treating as false`);
      return false;
  }
}

// ─── Effect application ───────────────────────────────────────────

interface EffectApplicationResult {
  worldFlags: Record<string, unknown>;
  firedCompositions: string[];
  doomClockAdvance: number;
}

function applyPhaseEffects(
  effects: Phase['effects'],
  state: GameState
): EffectApplicationResult {
  const worldFlags: Record<string, unknown> = { ...(state.worldFlags ?? {}) };
  const firedCompositions: string[] = [...(state.firedCompositions ?? [])];
  let doomClockAdvance = 0;

  for (const effect of effects ?? []) {
    try {
      switch (effect.op) {
        case 'set-world-flag':
          worldFlags[effect.key] = effect.value;
          break;
        case 'mark-composition-fired':
          if (!firedCompositions.includes(effect.id)) {
            firedCompositions.push(effect.id);
          }
          break;
        case 'advance-doom-clock':
          // Accumulate advances; actual doom clock mutation is handed back to caller
          doomClockAdvance += effect.by;
          break;
      }
    } catch {
      // Fail-soft: log and skip the bad effect
      console.warn(`[phaseComposition] Phase effect "${effect.op}" failed — skipped`);
    }
  }

  return { worldFlags, firedCompositions, doomClockAdvance };
}

// ─── Story beat enqueueing ────────────────────────────────────────

function enqueuePhaseStoryBeat(
  phase: Phase,
  compositionId: string,
  state: GameState
): GameState['storyBeatQueue'] {
  const beat = phase.storyBeat;
  if (!beat) return state.storyBeatQueue;

  // Map phase story-beat tier to StoryBeatPriority
  const priority: StoryBeatPriority =
    beat.priority === 'doom_clock' ? 'doom_clock'
    : beat.priority === 'template_intrinsic' ? 'promoted'
    : 'doom_clock';

  // Find the ascendant's first active encounter as encounterId anchor.
  // For phase-activated beats we use a synthetic encounter id.
  const syntheticEncounterId = `composition:${compositionId}:${phase.id}`;
  const ascendantId = state.ascendantId;

  const existing = state.storyBeatQueue ?? [];
  // Don't enqueue a duplicate for the same composition+phase
  if (existing.some((b) => b.encounterId === syntheticEncounterId)) {
    return existing;
  }

  return [
    ...existing,
    {
      encounterId: syntheticEncounterId,
      actionId: undefined,
      agentId: ascendantId,
      priority,
      queuedTick: state.tick,
    },
  ];
}

// ─── Chronicle entry ──────────────────────────────────────────────

function makePhaseChronicleEntry(
  phase: Phase,
  compositionId: string,
  tick: number
): import('../types/narrative').ChronicleEntry {
  const beat = phase.storyBeat;
  const template = beat ? lookupStoryBeatTemplate(beat.template) : undefined;

  // Fail-soft: no beat or template → rationale-based fallback
  if (!beat || !template) {
    if (beat && !template) {
      emitTrace({
        category: 'composition.story_beat_template_missing' as const,
        tick,
        summary: `story-beat template "${beat.template}" not in registry`,
        compositionId,
        phaseId: phase.id,
        templateId: beat.template,
      });
    }
    return {
      id: `composition_phase_${compositionId}_${phase.id}_${tick}`,
      tier: 'chronicle',
      title: `${compositionId} — ${phase.id}`,
      prose: phase.rationale ?? `Phase ${phase.id} activated`,
      promptContext: {
        actors: [],
        location: 'world',
        sphere: STORY_BEAT_DEFAULT_SPHERE,
        mood: STORY_BEAT_DEFAULT_MOOD,
      },
      tick,
    };
  }

  const hasPoet = Boolean(template.poetProse);
  const hasWitness = Boolean(template.witnessFacts && template.witnessFacts.length > 0);

  // Migration shim: legacy single-prose becomes witnessFacts when no dual fields
  const witnessFallback: string[] | undefined =
    !hasPoet && !hasWitness && template.prose ? [template.prose] : undefined;

  return {
    id: `composition_phase_${compositionId}_${phase.id}_${tick}`,
    tier: 'chronicle',
    title: template.title,
    prose: template.poetProse ?? template.witnessFacts?.[0] ?? template.prose ?? '',
    poetProse: template.poetProse,
    witnessFacts: template.witnessFacts ?? witnessFallback,
    promptContext: {
      actors: [],
      location: 'world',
      sphere: template.sphere,
      mood: template.mood ?? STORY_BEAT_DEFAULT_MOOD,
    },
    tick,
  };
}

function resolveVoiceHint(
  phase: Phase,
  template: import('../data/story-beat-templates').CompositionStoryBeatTemplate | undefined
): 'divine' | 'mortal' {
  return phase.storyBeat?.voice ?? template?.defaultVoice ?? STORY_BEAT_DEFAULT_VOICE;
}

// ─── Main runner ──────────────────────────────────────────────────

export function phaseComposition(state: GameState): Partial<GameState> {
  const compositions = state.activeCompositions;
  if (!compositions || compositions.length === 0) return {};

  // Sort by compositionId for deterministic iteration
  const sorted = [...compositions].sort((a, b) =>
    a.compositionId.localeCompare(b.compositionId)
  );

  // Apply per-tick cap
  const toEvaluate = sorted.slice(0, PHASE_RUNNER_MAX_COMPOSITIONS_PER_TICK);
  const backpressure = sorted.length > PHASE_RUNNER_MAX_COMPOSITIONS_PER_TICK;

  if (backpressure) {
    emitTrace({
      category: 'composition.phase_activated' as const,
      tick: state.tick,
      summary: `[backpressure] ${sorted.length} compositions queued; evaluating first ${PHASE_RUNNER_MAX_COMPOSITIONS_PER_TICK}`,
      compositionId: '__runner__',
      phaseId: '__backpressure__',
      activatedNodes: [],
      storyBeatQueued: false,
      templateResolved: false,
    });
  }

  let updatedCompositions: ActiveComposition[] = [...compositions];
  let worldFlags: Record<string, unknown> = { ...(state.worldFlags ?? {}) };
  let firedCompositions: string[] = [...(state.firedCompositions ?? [])];
  let storyBeatQueue = state.storyBeatQueue ?? [];
  let chronicleEntries: import('../types/narrative').ChronicleEntry[] = [...(state.chronicleEntries ?? [])];

  for (const active of toEvaluate) {
    if (active.status !== 'active') continue;

    // Look up the composition recipe library
    // v1: phases are declared on the composition itself; we don't have a registry yet.
    // The phase runner reads phases from the composition found in the game's recipe store.
    // For v1 we store phases inline on ActiveComposition via a phases field added at fire-time.
    // TODO(THR-226): wire recipe registry so phaseComposition can look up recipes by id
    const phases = (active as ActiveComposition & { phases?: Phase[] }).phases;
    if (!phases || phases.length === 0) continue;

    // Sort phases by id for determinism
    const sortedPhases = [...phases].sort((a, b) => a.id.localeCompare(b.id));
    let updatedActive: ActiveComposition = { ...active, lastEvaluationTick: state.tick };
    let compositionChanged = false;

    for (const phase of sortedPhases) {
      if (updatedActive.activatedPhaseIds.includes(phase.id)) continue;

      // Cooldown check
      const lastActivationTick = Math.max(
        ...Object.values(updatedActive.phaseActivationTicks ?? {}).concat([0])
      );
      if (
        PHASE_ACTIVATION_COOLDOWN_TICKS > 0 &&
        state.tick - lastActivationTick < PHASE_ACTIVATION_COOLDOWN_TICKS
      ) {
        continue;
      }

      // Evaluate predicate
      let predicatePassed = false;
      try {
        predicatePassed = evaluatePhasePredicateV1(phase.activatesAt, state);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        emitTrace({
          category: 'composition.phase_eval_failed' as const,
          tick: state.tick,
          summary: `Phase eval error: ${active.compositionId}/${phase.id}`,
          compositionId: active.compositionId,
          phaseId: phase.id,
          error: errorMessage,
        });
        continue; // treat as false per fail-soft table
      }

      if (!predicatePassed) continue;

      // Phase activates — apply effects
      const effectResult = applyPhaseEffects(phase.effects, {
        ...state,
        worldFlags,
        firedCompositions,
      });
      worldFlags = effectResult.worldFlags;
      firedCompositions = effectResult.firedCompositions;
      // Note: doomClockAdvance from phase effects deferred (TODO(THR-227): wire doom clock advance)

      // Enqueue story beat
      let storyBeatQueued = false;
      if (phase.storyBeat) {
        const newQueue = enqueuePhaseStoryBeat(phase, active.compositionId, {
          ...state,
          storyBeatQueue,
        });
        if (newQueue !== storyBeatQueue) {
          storyBeatQueue = newQueue ?? [];
          storyBeatQueued = true;
        }
      }

      // Resolve template for Chronicle entry and trace enrichment
      const beatSpec = phase.storyBeat;
      const resolvedTemplate = beatSpec ? lookupStoryBeatTemplate(beatSpec.template) : undefined;
      const templateResolved = Boolean(beatSpec && resolvedTemplate);
      const voiceHint = resolveVoiceHint(phase, resolvedTemplate);

      // Add Chronicle entry
      chronicleEntries = [
        ...chronicleEntries,
        makePhaseChronicleEntry(phase, active.compositionId, state.tick),
      ];

      // Update active composition record
      updatedActive = {
        ...updatedActive,
        activatedPhaseIds: [...updatedActive.activatedPhaseIds, phase.id],
        phaseActivationTicks: {
          ...updatedActive.phaseActivationTicks,
          [phase.id]: state.tick,
        },
        resolvedNodes: {
          ...updatedActive.resolvedNodes,
          ...Object.fromEntries(phase.activates.map((key) => [key, key])),
        },
      };
      compositionChanged = true;

      emitTrace({
        category: 'composition.phase_activated' as const,
        tick: state.tick,
        summary: `${active.compositionId}/${phase.id} activated`,
        compositionId: active.compositionId,
        phaseId: phase.id,
        activatedNodes: phase.activates,
        storyBeatQueued,
        voiceHint: beatSpec ? voiceHint : undefined,
        templateResolved,
      });
    }

    // Check if all phases are now activated → mark completed
    if (
      compositionChanged &&
      sortedPhases.every((p) => updatedActive.activatedPhaseIds.includes(p.id))
    ) {
      updatedActive = { ...updatedActive, status: 'completed' };
    }

    if (compositionChanged || updatedActive.lastEvaluationTick !== active.lastEvaluationTick) {
      updatedCompositions = updatedCompositions.map((c) =>
        c.compositionId === active.compositionId ? updatedActive : c
      );
    }
  }

  // Garbage-collect expired completed/failed compositions. Active compositions never GC.
  updatedCompositions = updatedCompositions.filter((c) => {
    if (c.status === 'active') return true;

    const phaseTicks = Object.values(c.phaseActivationTicks ?? {});
    // Completed: reference tick = max activation (all phases fired, so max == completion tick).
    // Failed:    reference tick = earliest of fired/phase-activation (matches v1 behaviour).
    const referenceTick =
      c.status === 'completed'
        ? (phaseTicks.length > 0 ? Math.max(...phaseTicks) : c.firedAtTick)
        : Math.min(...phaseTicks.concat([c.firedAtTick]));

    const retention =
      c.status === 'completed'
        ? COMPOSITION_COMPLETED_RETENTION_TICKS
        : COMPOSITION_FAILED_RETENTION_TICKS;

    return state.tick - referenceTick < retention;
  });

  return {
    activeCompositions: updatedCompositions,
    worldFlags,
    firedCompositions,
    storyBeatQueue,
    chronicleEntries,
  };
}
