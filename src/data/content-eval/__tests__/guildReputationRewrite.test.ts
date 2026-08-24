/**
 * THR-1207 — the guild half of the dead-tally sweep, pinned at the corpus.
 *
 * 62 authored `reputation_tally` writes across the four guild content files sat on
 * off-axis keys (`ac.guild_work`, `tg.master_thief`, `cg.watch_work`,
 * `ag.guild_contracts`), which `isValidReputationTallyKey` refuses — so every one was
 * discarded at runtime while the encounter's own sentence promised standing earned.
 * They are now `faction_reputation_gain`, the leg that actually carries rank, access
 * and expulsion.
 *
 * Two things need pinning, and neither is covered by the gates that already exist.
 *
 * `tallyKeyCorpus.test.ts` proves no off-axis tally *key* survives, and
 * `factionEffectIds.lint.test.ts` proves every authored `factionId` names a real
 * definition. Both would stay green if this sweep had pointed the arcane circle's
 * writes at the thieves' guild, or had deleted the writes outright instead of
 * re-authoring them — the two ways a sweep like this goes wrong while reporting
 * success. So:
 *
 *  1. **Each guild file credits its own guild** — a write is not merely *valid*, it
 *     is *right*.
 *  2. **A real shipped reaction still lands a real write** — the end-to-end claim the
 *     ticket makes, run through `applyEncounterAftermathReaction` against a
 *     seeded-shaped world rather than asserted from the content's shape.
 */

import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../../../engine/graph';
import { applyEncounterAftermathReaction } from '../../../engine/encounterAftermath';
import { clearTraces, enableTracing, disableTracing } from '../../../engine/traceBuffer';
import { createSimulationRuntime, type SimulationRuntime } from '../../../engine/simulationRuntime';
import { ARCANE_CIRCLE_ENCOUNTER_TEMPLATES } from '../../arcane-circle-encounter-content';
import { THIEVES_GUILD_ENCOUNTER_TEMPLATES } from '../../thieves-guild-encounter-content';
import { CIVIC_GUARD_ENCOUNTER_TEMPLATES } from '../../civic-guard-encounter-content';
import type { GameState } from '../../../types/gameState';
import type {
  EncounterAftermathReaction,
  UnifiedAction,
  UnifiedActionTemplate,
} from '../../../types/unifiedAction';

/** The one guild each file is allowed to credit. */
const GUILD_FILES: ReadonlyArray<readonly [string, readonly UnifiedActionTemplate[], string]> = [
  ['arcane-circle', ARCANE_CIRCLE_ENCOUNTER_TEMPLATES, 'arcane_circle'],
  ['thieves-guild', THIEVES_GUILD_ENCOUNTER_TEMPLATES, 'thieves_guild'],
  ['civic-guard', CIVIC_GUARD_ENCOUNTER_TEMPLATES, 'civic_guard'],
];

/** Every `faction_reputation_gain` anywhere in `root`, at any nesting depth. */
function collectFactionGains(root: unknown): Array<{ factionId: string; amount: number }> {
  const found: Array<{ factionId: string; amount: number }> = [];
  const seen = new WeakSet<object>();
  const walk = (node: unknown): void => {
    if (!node || typeof node !== 'object') return;
    if (seen.has(node as object)) return;
    seen.add(node as object);
    if (Array.isArray(node)) { for (const c of node) walk(c); return; }
    const obj = node as Record<string, unknown>;
    if (obj.kind === 'faction_reputation_gain' && typeof obj.factionId === 'string') {
      found.push({ factionId: obj.factionId, amount: obj.amount as number });
    }
    for (const v of Object.values(obj)) walk(v);
  };
  walk(root);
  return found;
}

/** The first aftermath reaction anywhere in `root` that carries a faction gain. */
function findGainReaction(root: unknown): EncounterAftermathReaction | undefined {
  const seen = new WeakSet<object>();
  let hit: EncounterAftermathReaction | undefined;
  const walk = (node: unknown): void => {
    if (hit || !node || typeof node !== 'object') return;
    if (seen.has(node as object)) return;
    seen.add(node as object);
    if (Array.isArray(node)) { for (const c of node) walk(c); return; }
    const obj = node as Record<string, unknown>;
    if (typeof obj.id === 'string' && Array.isArray(obj.effects)
      && (obj.effects as unknown[]).some(
        e => (e as { kind?: string })?.kind === 'faction_reputation_gain')) {
      hit = obj as unknown as EncounterAftermathReaction;
      return;
    }
    for (const v of Object.values(obj)) walk(v);
  };
  walk(root);
  return hit;
}

describe('THR-1207 — guild tally writes were re-pointed, not deleted or misfiled', () => {
  it('every guild file credits its own guild and nobody else', () => {
    for (const [label, templates, expectedFactionId] of GUILD_FILES) {
      const gains = collectFactionGains(templates);
      // Deletion is the other way this sweep could have gone green. It did not:
      // each file carried ~20 discarded tally writes and still carries that many
      // live ones.
      expect(gains.length, `${label} lost its reputation writes entirely`)
        .toBeGreaterThan(10);
      const wrong = gains.filter(g => g.factionId !== expectedFactionId);
      expect(wrong, `${label} credits a foreign guild: ${JSON.stringify(wrong)}`)
        .toEqual([]);
    }
  });

  it('the amounts stay on the scale the already-correct faction files use', () => {
    // 0.05 / 0.1 / 0.2 is the shipped idiom in the seven faction files that were
    // authoring `faction_reputation_gain` correctly all along. A sweep that
    // invented its own scale would read as a balance change smuggled in as a fix.
    const allowed = new Set([0.05, 0.1, 0.2]);
    for (const [label, templates] of GUILD_FILES) {
      const offScale = collectFactionGains(templates)
        .map(g => g.amount)
        .filter(a => !allowed.has(a));
      expect([...new Set(offScale)], `${label} authors an off-scale amount`).toEqual([]);
    }
  });
});

describe('THR-1207 — a real shipped guild reaction lands a real write', () => {
  let runtime: SimulationRuntime;
  beforeEach(() => { clearTraces(); enableTracing(); runtime = createSimulationRuntime(); });
  afterEach(() => { clearTraces(); disableTracing(); });

  for (const [label, templates, defId] of GUILD_FILES) {
    it(`${label}: reputation actually moves`, () => {
      const reaction = findGainReaction(templates);
      expect(reaction, `${label} has no reaction carrying a faction gain`).toBeDefined();

      // Keyed the way `factionSeeding` keys a real world — node id derived from the
      // definition id — so the authored definition id has to be *resolved*, not
      // merely matched. A fixture hand-keyed with the definition id would pass
      // while shipped content stayed dead (the THR-1150 falsification note).
      const nodeId = `faction_def_${defId}_0`;
      const graph = new WorldGraph();
      graph.addNode({
        id: 'agent-hero', type: 'actor', name: 'Hero',
        properties: { actorType: 'individual' },
      });
      graph.addNode({
        id: nodeId, type: 'actor', name: label,
        properties: { actorType: 'faction', actorStatus: 'active', factionDefId: defId },
      });
      graph.addEdge({
        id: `member_agent-hero_${nodeId}`,
        source: 'agent-hero', target: nodeId, type: 'member_of',
        properties: { factionDefId: defId, reputation: 0.1, role: 'journeyman', rank: 0, joinedTick: 1 },
      });

      const state = {
        tick: 50, seed: 42, cycle: 1, phase: 'playing', graph,
        cosmology: {}, tiles: [], clock: {},
        ascendantId: 'asc-1', essencePool: {},
        mandateDefinition: null, mandateState: null,
        rivalDefinitions: [], rivalStates: [],
        doomDefinition: {}, doomClock: {},
        tickEvents: [], recentEvents: [], chronicleEntries: [],
        stealthExposure: 0, visibilityMap: {}, familiarityMap: {},
        culturalInsightMap: new Map(), agentKnowledge: new Map(),
        encounterProgress: [], actionsInProgress: [], unifiedActions: [],
        worldSoul: {}, echoDefinitions: [], echoStates: [],
        chronicle: {}, encounterNotifications: [],
        clearanceGateStates: new Map(),
      } as unknown as GameState;

      const action = {
        actionId: 'ua_test', actorId: 'agent-hero', templateId: 'enc.test',
        targetId: 'agent-hero', scale: 'personal', source: 'agent',
        startTick: 1, currentStep: 0, stepProgress: 1, stepDuration: 1,
        resolved: true, outcome: 'success', stepOutcomes: [],
      } as UnifiedAction;

      const before = graph.getAllEdges()
        .find(e => e.type === 'member_of')?.properties?.reputation as number;

      applyEncounterAftermathReaction(state, action, reaction!, state.tick, runtime);

      const after = state.graph.getAllEdges()
        .find(e => e.type === 'member_of')?.properties?.reputation as number;

      expect(after, `${label}: the write was discarded, exactly as before the sweep`)
        .toBeGreaterThan(before);
    });
  }
});
