/**
 * Builders Fellowship content tests (THR-93).
 *
 * Validates:
 * - All 15 templates present (10 encounter + 3 social + 2 lifecycle)
 * - ≥4 templates carry spawn_artifact effects (exit criteria)
 * - ≥6 templates carry {?has_artifact} prose branches (exit criteria)
 * - ≥3 craft templates produce named artifacts via spawn_artifact
 * - End-to-end: forge_tools spawn_artifact reaction creates an artifact node in graph
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  BUILDERS_FELLOWSHIP_ENCOUNTER_TEMPLATES,
  BUILDERS_FELLOWSHIP_SOCIAL_TEMPLATES,
  BUILDERS_FELLOWSHIP_ENCOUNTER_META,
  BF_JOIN_TEMPLATE,
  BF_PROMOTION_TEMPLATE,
} from '../builders-fellowship-encounter-content';
import type { UnifiedActionTemplate, EncounterAftermathReaction, EncounterAftermathReactionEffect, UnifiedAction } from '../../types/unifiedAction';
import { WorldGraph } from '../../engine/graph';
import { applyEncounterAftermathReaction } from '../../engine/encounterAftermath';
import { clearTraces, enableTracing, disableTracing } from '../../engine/traceBuffer';
import { createSimulationRuntime, type SimulationRuntime } from '../../engine/simulationRuntime';
import type { GameState } from '../../types/gameState';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ALL_TEMPLATES: UnifiedActionTemplate[] = [
  ...BUILDERS_FELLOWSHIP_ENCOUNTER_TEMPLATES,
  ...BUILDERS_FELLOWSHIP_SOCIAL_TEMPLATES,
  BF_JOIN_TEMPLATE,
  BF_PROMOTION_TEMPLATE,
];

function collectSpawnArtifactReactions(template: UnifiedActionTemplate): EncounterAftermathReaction[] {
  const cfg = template.aftermathConfig;
  if (!cfg) return [];
  const reactions: EncounterAftermathReaction[] = [];
  if (cfg.fallback?.reactions) reactions.push(...cfg.fallback.reactions);
  for (const variant of Object.values(cfg.variants ?? {})) {
    if (variant?.reactions) reactions.push(...variant.reactions);
  }
  return reactions.filter(r => r.effects.some(e => e.kind === 'spawn_artifact'));
}

function countTemplatesWithSpawnArtifact(): number {
  return ALL_TEMPLATES.filter(t => collectSpawnArtifactReactions(t).length > 0).length;
}

function countTemplatesWithHasArtifact(): number {
  return ALL_TEMPLATES.filter(t => {
    const allNarratives = t.steps.map(s => {
      if ('branches' in s) return s.branches.map((b: { narrativeTemplate?: string }) => b.narrativeTemplate ?? '').join(' ');
      return (s as { narrativeTemplate?: string }).narrativeTemplate ?? '';
    }).join(' ');
    return allNarratives.includes('{?has_artifact}');
  }).length;
}

function buildMinimalState(actorId: string): GameState {
  const graph = new WorldGraph();
  graph.addNode({ id: actorId, type: 'actor', name: 'Test Crafter', properties: { actorType: 'individual' } });
  return {
    tick: 1, seed: 42, cycle: 1, phase: 'playing', graph,
    cosmology: {} as never, tiles: [], clock: {} as never,
    ascendantId: 'asc-test', essencePool: {} as never,
    mandateDefinition: null, mandateState: null,
    rivalDefinitions: [], rivalStates: [],
    doomDefinition: {} as never, doomClock: {} as never,
    tickEvents: [], recentEvents: [], chronicleEntries: [],
    stealthExposure: 0, visibilityMap: {} as never, familiarityMap: {} as never,
    culturalInsightMap: new Map(), agentKnowledge: new Map(),
    encounterProgress: [], actionsInProgress: [], unifiedActions: [],
    worldSoul: {} as never, echoDefinitions: [], echoStates: [],
    chronicle: {} as never, encounterNotifications: [],
    clearanceGateStates: new Map(),
  } as GameState;
}

function makeAction(actorId: string, templateId: string): UnifiedAction {
  return {
    actionId: 'ua_test', actorId, templateId, targetId: actorId,
    scale: 'local', source: 'agent',
    startTick: 1, currentStep: 0, stepProgress: 1, stepDuration: 2,
    resolved: true, outcome: 'success', stepOutcomes: [],
  };
}

// ─── Structure ────────────────────────────────────────────────────────────────

describe('Builders Fellowship — template structure', () => {
  it('exports 10 encounter templates', () => {
    expect(BUILDERS_FELLOWSHIP_ENCOUNTER_TEMPLATES).toHaveLength(10);
  });

  it('exports 3 social templates', () => {
    expect(BUILDERS_FELLOWSHIP_SOCIAL_TEMPLATES).toHaveLength(3);
  });

  it('exports BF_JOIN_TEMPLATE and BF_PROMOTION_TEMPLATE (lifecycle)', () => {
    expect(BF_JOIN_TEMPLATE.id).toBe('bf.join');
    expect(BF_PROMOTION_TEMPLATE.id).toBe('bf.promotion');
  });

  it('15 total templates (13 standard + 2 lifecycle)', () => {
    expect(ALL_TEMPLATES).toHaveLength(15);
  });

  it('all template IDs are unique', () => {
    const ids = ALL_TEMPLATES.map(t => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('all templates have aftermathConfig', () => {
    for (const t of ALL_TEMPLATES) {
      expect(t.aftermathConfig, `${t.id} missing aftermathConfig`).toBeDefined();
    }
  });

  it('BUILDERS_FELLOWSHIP_ENCOUNTER_META covers all 15 templates', () => {
    expect(BUILDERS_FELLOWSHIP_ENCOUNTER_META.size).toBe(15);
    for (const t of ALL_TEMPLATES) {
      expect(BUILDERS_FELLOWSHIP_ENCOUNTER_META.has(t.id), `${t.id} missing from META`).toBe(true);
    }
  });
});

// ─── Exit criteria ────────────────────────────────────────────────────────────

describe('Builders Fellowship — exit criteria', () => {
  it('≥4 templates carry spawn_artifact effects (GraphOp requirement)', () => {
    expect(countTemplatesWithSpawnArtifact()).toBeGreaterThanOrEqual(4);
  });

  it('≥6 templates carry {?has_artifact} prose branches', () => {
    expect(countTemplatesWithHasArtifact()).toBeGreaterThanOrEqual(6);
  });

  it('forge_tools, craft_commission, and master_craft each produce a named artifact', () => {
    const craftIds = ['bf.quest.forge_tools', 'bf.quest.craft_commission', 'bf.senior.master_craft'];
    for (const id of craftIds) {
      const template = ALL_TEMPLATES.find(t => t.id === id);
      expect(template, `${id} not found`).toBeDefined();
      const spawnReactions = collectSpawnArtifactReactions(template!);
      expect(spawnReactions.length, `${id} has no spawn_artifact reactions`).toBeGreaterThan(0);
      const namedEffect = spawnReactions
        .flatMap(r => r.effects)
        .find((e): e is EncounterAftermathReactionEffect & { kind: 'spawn_artifact' } =>
          e.kind === 'spawn_artifact' && 'nameOverride' in e && !!e.nameOverride
        );
      expect(namedEffect, `${id} has no named artifact (nameOverride missing)`).toBeDefined();
    }
  });
});

// ─── End-to-end: forge_tools spawn_artifact fires and creates graph node ─────

describe('Builders Fellowship — spawn_artifact end-to-end (forge_tools)', () => {
  const ACTOR_ID = 'crafter.test';
  let runtime: SimulationRuntime;

  beforeEach(() => { clearTraces(); enableTracing(); runtime = createSimulationRuntime(); });
  afterEach(() => { clearTraces(); disableTracing(); });

  it('forge_tools_made reaction creates an artifact node connected to the actor', () => {
    const template = BUILDERS_FELLOWSHIP_ENCOUNTER_TEMPLATES.find(t => t.id === 'bf.quest.forge_tools');
    expect(template).toBeDefined();

    const fallback = template!.aftermathConfig!.fallback!;
    const reaction = fallback.reactions.find(r => r.id === 'forge_tools_made');
    expect(reaction).toBeDefined();

    const state = buildMinimalState(ACTOR_ID);
    const action = makeAction(ACTOR_ID, template!.id);

    const { state: nextState } = applyEncounterAftermathReaction(state, action, reaction!, 1, runtime);

    const possessesEdge = nextState.graph.getAllEdges().find(
      e => e.type === 'possesses' && e.source === ACTOR_ID
    );
    expect(possessesEdge, 'no possesses edge after spawn_artifact').toBeDefined();

    const artifactNode = nextState.graph.getNode(possessesEdge!.target);
    expect(artifactNode, 'artifact node not found').toBeDefined();
    expect(artifactNode!.name).toBe('Fellowship Work Tools');
    expect(artifactNode!.type).toBe('artifact');
    expect(artifactNode!.properties.tier).toBe('shaping');
  });
});
