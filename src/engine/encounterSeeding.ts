/**
 * Encounter Seeding — evaluate pending encounter seeds and spawn encounters.
 *
 * Seeds are planted by encounter aftermath reactions (encounter_seed effect kind)
 * and become eligible when `tick >= eligibleAfterTick`.
 *
 * Evaluation paths:
 * - templateId set + template exists → create a unified action for the target agent
 * - encounterFamily set (no templateId) → THR-697 (Slice D): draw a concrete template from
 *   the family (id-prefix match) and spawn it; if no eligible template, fall back to the v1
 *   withered narrative event (byte-identical)
 * - Neither produces a result → fail-soft expired event, seed removed
 *
 * THR-697 (Slice D) also threads inherited scene context: seeds planted with
 * `inheritContext: true` carry the source action's target + cast, re-validated against the
 * live graph at spawn, so the follow-up encounter stars the same people.
 *
 * Non-eligible seeds remain in the pending array for future ticks.
 *
 * NFP #4 (Fail-soft): Every code path terminates with a narrative event — never throws.
 * NFP #2 (Inspectability): Narrative events trace seed lifecycle (planted, spawned, expired).
 * NFP #3 (Determinism): rng passed explicitly; the family draw is one seeded rng() call.
 */

import type { GameState, TickEvent } from '../types/gameState';
import type { PendingEncounterSeed, UnifiedActionTemplate } from '../types/unifiedAction';
import type { EncounterSupportBinding } from '../types/encounter';
import type { WorldGraph } from './graph';
import type { SimulationRuntime } from './simulationRuntime';
import { getUnifiedTemplateById, UNIFIED_ACTION_TEMPLATES } from '../data/unified-action-templates';
import { createUnifiedAction } from './unifiedActionLifecycle';
import { appendRecentEvent } from './encounterAftermath';
import { emitTrace } from './traceBuffer';
import { getAgentLocation } from './graphQueries';
import { getGroupMembers, isAgentGone, isBandNode } from './groups/groupQueries';
import { FAMILY_SEED_MAX_CANDIDATES } from '../data/effect-constants';

interface FamilyMatchResult {
  readonly templateId: string;
  readonly template: UnifiedActionTemplate;
  readonly candidateCount: number;
}

/**
 * THR-697 (Slice D) — resolve a family-only seed to a concrete template.
 *
 * Candidates are registered unified templates whose `id` starts with `${family}.` (the same
 * prefix convention THR-112 `revealFamilies` uses — no separate family registry), filtered to
 * individual-performable templates whose location-subtype restriction (if any) matches the
 * target agent's current location. The scan collects up to `FAMILY_SEED_MAX_CANDIDATES`
 * eligibles, then makes exactly one seeded `rng()` draw over them.
 *
 * Returns undefined when the seed has no family or no eligible candidate — the caller then
 * keeps the v1 withered-narrative fallback byte-identical.
 */
function matchFamilyTemplate(
  graph: WorldGraph,
  seed: PendingEncounterSeed,
  rng: () => number,
): FamilyMatchResult | undefined {
  const family = seed.encounterFamily;
  if (!family) return undefined;
  const prefix = `${family}.`;

  const locationNode = getAgentLocation(graph, seed.targetAgentId);
  const subtype = locationNode
    ? ((locationNode.properties.locationSubtype ?? locationNode.properties.locationType) as string | undefined)
    : undefined;

  const eligible: UnifiedActionTemplate[] = [];
  for (const template of UNIFIED_ACTION_TEMPLATES) {
    if (!template.id.startsWith(prefix)) continue;
    // (a) agent-performable
    if (!template.actorAffinities?.includes('individual')) continue;
    // (b) location-subtype eligibility (templates with no restriction always pass)
    if (template.locationSubtypes && template.locationSubtypes.length > 0) {
      if (!subtype || !template.locationSubtypes.includes(subtype)) continue;
    }
    eligible.push(template);
    if (eligible.length >= FAMILY_SEED_MAX_CANDIDATES) break;
  }
  if (eligible.length === 0) return undefined;

  const pick = eligible[Math.floor(rng() * eligible.length)];
  return { templateId: pick.id, template: pick, candidateCount: eligible.length };
}

interface ResolvedInheritance {
  /** True iff the seed carried inherited scene context (inheritContext was set at plant). */
  readonly applied: boolean;
  /** Target for the spawned action: the inherited target if still alive, else self-target. */
  readonly targetId: string;
  /** Inherited cast bindings that survived graph re-validation, else undefined. */
  readonly bindings?: readonly EncounterSupportBinding[];
  /** Inherited target that survived re-validation, or null (fell back to self-target). */
  readonly inheritedTargetId: string | null;
  readonly bindingCount: number;
  readonly droppedBindingCount: number;
}

/**
 * THR-697 (Slice D) — re-validate a seed's inherited scene context against the live graph at
 * spawn time. A dead inherited target falls back to self-target; bindings whose node is gone
 * are dropped. Pure; the caller emits the `seed_context_inherited` trace when `applied`.
 */
function resolveSeedInheritance(
  seed: PendingEncounterSeed,
  graph: WorldGraph,
  tick: number,
): ResolvedInheritance {
  const applied = seed.inheritedTargetId !== undefined || seed.inheritedBindings !== undefined;

  let targetId = seed.targetAgentId;
  let inheritedTargetId: string | null = null;
  if (seed.inheritedTargetId && graph.getNode(seed.inheritedTargetId)) {
    targetId = seed.inheritedTargetId;
    inheritedTargetId = seed.inheritedTargetId;
  }

  let bindings: readonly EncounterSupportBinding[] | undefined;
  let bindingCount = 0;
  let droppedBindingCount = 0;
  if (seed.inheritedBindings && seed.inheritedBindings.length > 0) {
    // THR-1296 §4: the drop keeps its semantics and stops being silent.
    //
    // Two changes, both small. The survivor test is now the **dual gone-test** — this
    // site checked node absence only while its sibling used `isAgentGone`, so a
    // deceased echo (THR-479 keeps those nodes forever) survived inheritance here and
    // not there. That inconsistency was inherited deliberately; it no longer is.
    // And each drop emits `binding_severed`, so a scene that quietly lost its cast
    // between planting and spawning says so.
    const survivors = seed.inheritedBindings.filter(b => {
      const node = graph.getNode(b.nodeId);
      const gone = !node || (b.kind === 'actor' && isAgentGone(node));
      if (gone) {
        emitTrace({
          category: 'binding_severed',
          tick,
          projectId: seed.seedId,
          castKey: b.key,
          nodeId: b.nodeId,
          cause: 'seed_drop',
          persistence: b.persistence,
          summary:
            `seed binding dropped: ${b.key} (${b.persistence}) of seed ${seed.seedId} — ` +
            `${!node ? 'node removed' : 'deceased'}`,
        });
      }
      return !gone;
    });
    droppedBindingCount = seed.inheritedBindings.length - survivors.length;
    bindingCount = survivors.length;
    bindings = survivors.length > 0 ? survivors : undefined;
  }

  return { applied, targetId, bindings, inheritedTargetId, bindingCount, droppedBindingCount };
}

/**
 * THR-731 (PR 3) — re-validate a seed's named opponent at spawn time.
 *
 * PR 2 declared `PendingEncounterSeed.opposingGroupId` and wired the *resolution*
 * side to honour `UnifiedAction.opposingGroupId`, but nothing carried the value
 * across the seed → action boundary, so a seed that named its enemy dropped it in
 * silence. This is that carry, and it re-checks rather than copies: a band can
 * dissolve, empty out, or be disbanded in the delay between planting a grudge and
 * collecting on it.
 *
 * Returns undefined for every case that should spawn an ordinary uncontested
 * encounter — no named opponent, opponent gone, opponent no longer a live band.
 * The company still gets its encounter; it just does not get a fight (NFP #4).
 */
function resolveSeedOpposition(
  seed: PendingEncounterSeed,
  graph: WorldGraph,
): string | undefined {
  const opposingGroupId = seed.opposingGroupId;
  if (!opposingGroupId) return undefined;

  const band = graph.getNode(opposingGroupId);
  if (!band || !isBandNode(band)) return undefined;
  if ((band.properties as Record<string, unknown>).groupStatus !== 'active') return undefined;
  if (getGroupMembers(graph, opposingGroupId).every(isAgentGone)) return undefined;

  return opposingGroupId;
}

export function evaluateEncounterSeeds(state: GameState, tick: number, rng: () => number, runtime?: SimulationRuntime): GameState {
  const seeds = state.pendingEncounterSeeds ?? [];
  if (seeds.length === 0) return state;

  const eligible: PendingEncounterSeed[] = [];
  const remaining: PendingEncounterSeed[] = [];

  for (const seed of seeds) {
    if (tick >= seed.eligibleAfterTick) {
      eligible.push(seed);
    } else {
      remaining.push(seed);
    }
  }

  if (eligible.length === 0) return state;

  let nextActions = [...state.unifiedActions];
  let nextTickEvents = [...state.tickEvents];
  let nextRecentEvents = [...state.recentEvents];

  for (const seed of eligible) {
    const ticksSincePlant = tick - (seed.plantedTick ?? tick);

    // THR-1025: a seed whose target does not resolve to a live node can only produce a
    // phantom action — one that spawns, runs the tick loop, and fails every graph write
    // it attempts, silently. Discard it here instead. This is the backstop for the
    // unbound-sentinel class (an aftermath sentinel the bind pass could not resolve stays
    // a literal token, e.g. the bare string `$actor`), and equally for a target that has
    // simply died between plant and eligibility.
    if (!state.graph.getNode(seed.targetAgentId)) {
      const orphanEvent: TickEvent = {
        id: `${seed.seedId}_orphaned`,
        tick,
        type: 'narrative',
        message: `A planted thread lost the one it was meant for: ${seed.seedLabel}`,
        significance: 0.3,
        actorId: seed.targetAgentId,
      };
      nextTickEvents = [...nextTickEvents, orphanEvent];
      nextRecentEvents = appendRecentEvent(nextRecentEvents, orphanEvent);
      emitTrace({
        tick, category: 'encounter_seed_triggered',
        agentId: seed.targetAgentId,
        seedId: seed.seedId,
        targetAgentId: seed.targetAgentId,
        ticksBetweenPlantAndTrigger: ticksSincePlant,
        resolvedTemplateId: 'none',
        outcome: 'discarded',
        discardReason: 'target_agent_missing',
        summary: `Seed discarded: target "${seed.targetAgentId}" is not a live node — "${seed.seedLabel}"`,
      });
      continue;
    }

    // Resolve the template to spawn: a direct templateId, or (Slice D) a family match.
    let template: UnifiedActionTemplate | undefined;
    let resolvedTemplateId: string | undefined;
    let familyMatch: FamilyMatchResult | undefined;

    if (seed.templateId) {
      template = getUnifiedTemplateById(seed.templateId);
      if (template) resolvedTemplateId = seed.templateId;
      // templateId set but not found → fall through to family / fail-soft below.
    }
    if (!template && seed.encounterFamily) {
      // THR-697 (Slice D): activate the family stub — draw a concrete template.
      familyMatch = matchFamilyTemplate(state.graph, seed, rng);
      if (familyMatch) {
        template = familyMatch.template;
        resolvedTemplateId = familyMatch.templateId;
      }
    }

    if (template && resolvedTemplateId) {
      // Check if target agent is not already in an active action
      const agentBusy = nextActions.some(
        a => a.actorId === seed.targetAgentId && !a.resolved
      );
      if (agentBusy) {
        // Agent busy — keep seed for next tick (not triggered yet, no trace)
        remaining.push(seed);
        continue;
      }

      // Slice D: family-match trace fires before the shared spawn/trigger traces.
      if (familyMatch) {
        emitTrace({
          tick, category: 'encounter_seed_family_matched',
          agentId: seed.targetAgentId,
          seedId: seed.seedId,
          family: seed.encounterFamily ?? '',
          candidateCount: familyMatch.candidateCount,
          resolvedTemplateId,
          summary: `Family seed matched: "${seed.seedLabel}" → ${resolvedTemplateId} (${familyMatch.candidateCount} candidate${familyMatch.candidateCount === 1 ? '' : 's'})`,
        } as unknown as Parameters<typeof emitTrace>[0]);
      }

      // Slice D: re-validate inherited scene context against the live graph.
      const inherit = resolveSeedInheritance(seed, state.graph, tick);
      if (inherit.applied) {
        emitTrace({
          tick, category: 'seed_context_inherited',
          agentId: seed.targetAgentId,
          seedId: seed.seedId,
          inheritedTargetId: inherit.inheritedTargetId,
          bindingCount: inherit.bindingCount,
          droppedBindingCount: inherit.droppedBindingCount,
          summary: `Seed context inherited: "${seed.seedLabel}" target=${inherit.inheritedTargetId ?? 'self'} bindings=${inherit.bindingCount}${inherit.droppedBindingCount > 0 ? ` (dropped ${inherit.droppedBindingCount})` : ''}`,
        } as unknown as Parameters<typeof emitTrace>[0]);
      }

      // THR-143: set causation fields so executeStepResult can emit the edge once
      // an event node exists for both endpoints. The edge is emitted in
      // unifiedActionResolution.ts when the seeded action's first step resolves.
      const spawnedAction = createUnifiedAction({
        actorId: seed.targetAgentId,
        templateId: resolvedTemplateId,
        // Slice D: inherited target if it survived re-validation, else self-target (v1 fallback).
        targetId: inherit.targetId,
        // Slice D: inherited cast survivors flow into the normal supportBindings slot.
        supportBindings: inherit.bindings,
        scale: template.scale,
        source: 'system',
        tick,
        template,
        rng,
        // THR-1100: target-derived step duration for tier-scaled templates.
        targetProperties: state.graph.getNode(inherit.targetId)?.properties,
      });
      const withCausation = seed.sourceEventNodeId
        ? {
            ...spawnedAction,
            pendingCausationSourceEventId: seed.sourceEventNodeId,
            spawnedFromSeedId: seed.seedId,
            spawnedFromSeedLabel: seed.seedLabel,
          }
        : spawnedAction;
      // THR-731 (PR 3): carry the seed's named opponent onto the action, which is
      // what `findOpposingBand` reads to pair the contest deliberately instead of
      // rediscovering an opponent by colocation.
      const opposingGroupId = resolveSeedOpposition(seed, state.graph);
      const action = opposingGroupId
        ? { ...withCausation, opposingGroupId }
        : withCausation;
      nextActions = [...nextActions, action];

      const spawnEvent: TickEvent = {
        id: `${seed.seedId}_spawned`,
        tick,
        type: 'narrative',
        message: familyMatch
          ? `A planted thread bears fruit: ${seed.seedLabel} — ${template.name}`
          : `A planted thread bears fruit: ${seed.seedLabel}`,
        significance: 0.65,
        actorId: seed.targetAgentId,
      };
      nextTickEvents = [...nextTickEvents, spawnEvent];
      nextRecentEvents = appendRecentEvent(nextRecentEvents, spawnEvent);
      emitTrace({
        tick, category: 'encounter_seed_triggered',
        agentId: seed.targetAgentId,
        seedId: seed.seedId,
        targetAgentId: seed.targetAgentId,
        ticksBetweenPlantAndTrigger: ticksSincePlant,
        resolvedTemplateId,
        outcome: 'fired',
        summary: `Seed fired: "${seed.seedLabel}" → ${resolvedTemplateId} for ${seed.targetAgentId}`,
      });
      continue;
    }

    // Family-only seed with no eligible template → v1 withered narrative event, preserved
    // byte-identical (THR-697 fail-soft: no eligible → existing withered path unchanged).
    if (seed.encounterFamily) {
      // THR-143: family-only fires are advisory — no action is spawned, so no event node
      // will be created and no caused_by edge is possible in v1 scope.
      const familyEventId = `${seed.seedId}_family_ready`;
      if (seed.sourceEventNodeId) {
        emitTrace({
          tick, category: 'causation_edge_creation_skipped',
          sourceEventId: familyEventId,
          causedByEventId: seed.sourceEventNodeId,
          seedId: seed.seedId,
          reason: 'family_only_no_action_node',
          summary: `Causation edge skipped (family-only): no action node spawned for "${seed.seedLabel}"`,
        });
      }

      const familyEvent: TickEvent = {
        id: familyEventId,
        tick,
        type: 'narrative',
        message: `The consequences of ${seed.seedLabel} are stirring — a ${seed.encounterFamily} encounter may surface soon.`,
        significance: 0.55,
        actorId: seed.targetAgentId,
      };
      nextTickEvents = [...nextTickEvents, familyEvent];
      nextRecentEvents = appendRecentEvent(nextRecentEvents, familyEvent);
      // Seed consumed — family matching is best-effort narrative for v1
      emitTrace({
        tick, category: 'encounter_seed_triggered',
        agentId: seed.targetAgentId,
        seedId: seed.seedId,
        targetAgentId: seed.targetAgentId,
        ticksBetweenPlantAndTrigger: ticksSincePlant,
        resolvedTemplateId: `family:${seed.encounterFamily}`,
        outcome: 'fired',
        summary: `Seed fired (family-only narrative): "${seed.seedLabel}" → ${seed.encounterFamily}`,
      });
      continue;
    }

    // Neither templateId nor family — fail-soft
    const expiredEvent: TickEvent = {
      id: `${seed.seedId}_expired`,
      tick,
      type: 'narrative',
      message: `A planted thread withered before it could take root: ${seed.seedLabel}`,
      significance: 0.3,
      actorId: seed.targetAgentId,
    };
    nextTickEvents = [...nextTickEvents, expiredEvent];
    nextRecentEvents = appendRecentEvent(nextRecentEvents, expiredEvent);
    emitTrace({
      tick, category: 'encounter_seed_triggered',
      agentId: seed.targetAgentId,
      seedId: seed.seedId,
      targetAgentId: seed.targetAgentId,
      ticksBetweenPlantAndTrigger: ticksSincePlant,
      resolvedTemplateId: 'none',
      outcome: 'discarded',
      discardReason: 'no_template_or_family',
      summary: `Seed discarded (no template or family): "${seed.seedLabel}"`,
    });
  }

  return {
    ...state,
    unifiedActions: nextActions,
    tickEvents: nextTickEvents,
    recentEvents: nextRecentEvents,
    pendingEncounterSeeds: remaining,
  };
}
