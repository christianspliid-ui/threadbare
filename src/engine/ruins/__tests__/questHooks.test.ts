/**
 * Tests for the Ruins Layer quest hook phase (THR-156).
 *
 * Covers:
 *   - getEvidenceStrength: sums non-consumed clue magnitudes
 *   - selectQuestTemplateForRuin: magnitude → template ID mapping
 *   - phaseRuinQuestHooks: threshold just-below does not spawn
 *   - phaseRuinQuestHooks: threshold just-above spawns with toast event
 *   - phaseRuinQuestHooks: cooldown prevents re-issuance within window
 *   - phaseRuinQuestHooks: no Guild within radius → suppressed (no event)
 *   - phaseRuinQuestHooks: only runs on interval ticks
 *   - buildQuestHookMessage: 5 archetype vignettes
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../../graph';
import type { GameState } from '../../../types/gameState';
import {
  getEvidenceStrength,
  selectQuestTemplateForRuin,
  buildQuestHookMessage,
  phaseRuinQuestHooks,
  resetQuestHookEventCounter,
} from '../questHooks';
import {
  CLUE_QUEST_THRESHOLD,
  RUIN_MAGNITUDE_MINOR_MAX,
  RUIN_MAGNITUDE_MAJOR_MAX,
  GUILD_QUEST_RADIUS,
  QUEST_HOOK_COOLDOWN_TICKS,
  RUIN_QUEST_GENERATION_INTERVAL_TICKS,
} from '../constants';

// ─── Graph builders ──────────────────────────────────────────────────────────

/** Minimal ruin at hex (5, 5) with given magnitude */
function addRuin(
  graph: WorldGraph,
  id = 'ruin-1',
  magnitude = 0.5,
  sphere = 'iron',
  col = 5,
  row = 5,
): void {
  graph.addNode({
    id,
    type: 'location',
    name: 'The Veil-Well',
    properties: { ruinMagnitude: magnitude, sphereAlignment: sphere, hexCol: col, hexRow: row },
  });
}

/** Add a knows_clue_of edge pointing at ruinId */
function addClueEdge(
  graph: WorldGraph,
  edgeId: string,
  knowerId: string,
  ruinId: string,
  magnitude: number,
  consumed = false,
): void {
  graph.addNode({ id: knowerId, type: 'actor', name: knowerId, properties: {} });
  graph.addEdge({
    id: edgeId,
    source: knowerId,
    target: ruinId,
    type: 'knows_clue_of',
    properties: { magnitude, precision: 'vague', source: 'tavern_rumor', discoveredTick: 0, consumed },
  });
}

/** Add a Guild-containing location at given hex coordinates */
function addGuildLocation(
  graph: WorldGraph,
  locId = 'loc-guild',
  sublocId = 'subloc-guild-hall',
  col = 3,
  row = 3,
): void {
  graph.addNode({
    id: locId,
    type: 'location',
    name: 'Ember Town',
    properties: { hexCol: col, hexRow: row },
  });
  graph.addNode({
    id: sublocId,
    type: 'location',
    name: 'Guild Hall',
    properties: { sublocationTypeId: 'sublocation-type.faction-hall', factionDefId: 'adventuring_guild' },
  });
  graph.addEdge({
    id: `edge-contains-${sublocId}`,
    source: locId,
    target: sublocId,
    type: 'contains',
    properties: {},
  });
}

function buildState(graph: WorldGraph, tick: number): GameState {
  return {
    graph,
    tick,
    seed: 42,
    tickEvents: [],
    encounterProgress: [],
  } as unknown as GameState;
}

// ─── getEvidenceStrength ──────────────────────────────────────────────────────

describe('getEvidenceStrength', () => {
  it('returns 0 when no clue edges exist', () => {
    const graph = new WorldGraph();
    addRuin(graph);
    expect(getEvidenceStrength('ruin-1', graph)).toBe(0);
  });

  it('sums magnitudes of non-consumed clue edges', () => {
    const graph = new WorldGraph();
    addRuin(graph);
    addClueEdge(graph, 'e1', 'agent-a', 'ruin-1', 0.4);
    addClueEdge(graph, 'e2', 'agent-b', 'ruin-1', 0.3);
    expect(getEvidenceStrength('ruin-1', graph)).toBeCloseTo(0.7);
  });

  it('ignores consumed clue edges', () => {
    const graph = new WorldGraph();
    addRuin(graph);
    addClueEdge(graph, 'e1', 'agent-a', 'ruin-1', 0.9, true); // consumed
    addClueEdge(graph, 'e2', 'agent-b', 'ruin-1', 0.2, false);
    expect(getEvidenceStrength('ruin-1', graph)).toBeCloseTo(0.2);
  });
});

// ─── selectQuestTemplateForRuin ───────────────────────────────────────────────

describe('selectQuestTemplateForRuin', () => {
  it('maps minor magnitude to ag.quest.ruin_delve', () => {
    expect(selectQuestTemplateForRuin(RUIN_MAGNITUDE_MINOR_MAX)).toBe('ag.quest.ruin_delve');
    expect(selectQuestTemplateForRuin(0.1)).toBe('ag.quest.ruin_delve');
  });

  it('maps major magnitude to ag.senior.deep_expedition', () => {
    expect(selectQuestTemplateForRuin(0.5)).toBe('ag.senior.deep_expedition');
    expect(selectQuestTemplateForRuin(RUIN_MAGNITUDE_MAJOR_MAX)).toBe('ag.senior.deep_expedition');
  });

  it('maps saga magnitude to ag.elite.lost_city', () => {
    expect(selectQuestTemplateForRuin(0.8)).toBe('ag.elite.lost_city');
    expect(selectQuestTemplateForRuin(1.0)).toBe('ag.elite.lost_city');
  });
});

// ─── buildQuestHookMessage ────────────────────────────────────────────────────

describe('buildQuestHookMessage', () => {
  it('uses martial vignette for iron sphere', () => {
    const msg = buildQuestHookMessage('Ashen Gate', 'north', 'The Guild', 'iron');
    expect(msg).toContain('contract');
    expect(msg).toContain('Ashen Gate');
    expect(msg).toContain('north');
  });

  it('uses prosperity vignette for gold sphere', () => {
    const msg = buildQuestHookMessage('The Vault', 'east', 'The Guild', 'gold');
    expect(msg).toContain('vault');
  });

  it('uses divine vignette for spirit sphere', () => {
    const msg = buildQuestHookMessage('Sanctum Hollow', 'south', 'The Guild', 'spirit');
    expect(msg).toContain('sanctified');
  });

  it('uses arcane vignette for mind sphere', () => {
    const msg = buildQuestHookMessage('The Codex Spire', 'west', 'The Guild', 'mind');
    expect(msg).toContain('scholarly');
  });

  it('uses ancient vignette for unknown sphere', () => {
    const msg = buildQuestHookMessage('The Forgotten Mound', 'southeast', 'The Guild', 'time');
    expect(msg).toContain('forgotten');
  });
});

// ─── phaseRuinQuestHooks ──────────────────────────────────────────────────────

describe('phaseRuinQuestHooks', () => {
  beforeEach(() => {
    resetQuestHookEventCounter();
  });

  const INTERVAL = RUIN_QUEST_GENERATION_INTERVAL_TICKS;

  it('is a no-op on non-interval ticks', () => {
    const graph = new WorldGraph();
    addRuin(graph);
    addClueEdge(graph, 'e1', 'agent-a', 'ruin-1', 1.0);
    addGuildLocation(graph);
    const state = buildState(graph, INTERVAL + 1); // off-interval
    const result = phaseRuinQuestHooks(state);
    expect(result.tickEvents).toBeUndefined();
  });

  it('does not spawn when evidenceStrength is just below threshold', () => {
    const graph = new WorldGraph();
    addRuin(graph);
    addClueEdge(graph, 'e1', 'agent-a', 'ruin-1', CLUE_QUEST_THRESHOLD - 0.01);
    addGuildLocation(graph);
    const state = buildState(graph, INTERVAL);
    const result = phaseRuinQuestHooks(state);
    expect(result.tickEvents ?? []).toHaveLength(0);
  });

  it('spawns when evidenceStrength is just at threshold', () => {
    const graph = new WorldGraph();
    addRuin(graph);
    addClueEdge(graph, 'e1', 'agent-a', 'ruin-1', CLUE_QUEST_THRESHOLD);
    addGuildLocation(graph, 'loc-guild', 'subloc-guild-hall', 3, 3); // within GUILD_QUEST_RADIUS of (5,5)
    const state = buildState(graph, INTERVAL);
    const result = phaseRuinQuestHooks(state);
    const events = result.tickEvents ?? [];
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('quest_hook_issued');
    expect(events[0].notification?.channel).toBe('toast');
  });

  it('stamps questHookPostedTick on the ruin node', () => {
    const graph = new WorldGraph();
    addRuin(graph);
    addClueEdge(graph, 'e1', 'agent-a', 'ruin-1', CLUE_QUEST_THRESHOLD);
    addGuildLocation(graph);
    const state = buildState(graph, INTERVAL);
    phaseRuinQuestHooks(state);
    const ruinNode = graph.getNode('ruin-1');
    expect(ruinNode?.properties.questHookPostedTick).toBe(INTERVAL);
  });

  it('does not re-spawn within the cooldown window', () => {
    const graph = new WorldGraph();
    addRuin(graph);
    addClueEdge(graph, 'e1', 'agent-a', 'ruin-1', CLUE_QUEST_THRESHOLD);
    addGuildLocation(graph);

    // First issuance
    phaseRuinQuestHooks(buildState(graph, INTERVAL));
    resetQuestHookEventCounter();

    // Second attempt — still within cooldown
    const secondTick = INTERVAL + QUEST_HOOK_COOLDOWN_TICKS - 1;
    // Make it a valid interval tick
    const attemptTick = Math.floor(secondTick / INTERVAL) * INTERVAL;
    const result = phaseRuinQuestHooks(buildState(graph, attemptTick));
    expect(result.tickEvents ?? []).toHaveLength(0);
  });

  it('re-spawns after cooldown has expired', () => {
    const graph = new WorldGraph();
    addRuin(graph);
    addClueEdge(graph, 'e1', 'agent-a', 'ruin-1', CLUE_QUEST_THRESHOLD);
    addGuildLocation(graph);

    // First issuance at tick INTERVAL
    phaseRuinQuestHooks(buildState(graph, INTERVAL));
    resetQuestHookEventCounter();

    // Second attempt — after cooldown expires
    const afterCooldown = INTERVAL + QUEST_HOOK_COOLDOWN_TICKS;
    const attemptTick = Math.ceil(afterCooldown / INTERVAL) * INTERVAL;
    const result = phaseRuinQuestHooks(buildState(graph, attemptTick));
    expect((result.tickEvents ?? []).length).toBeGreaterThanOrEqual(1);
  });

  it('does not spawn when no Guild is within radius', () => {
    const graph = new WorldGraph();
    addRuin(graph, 'ruin-1', 0.5, 'iron', 5, 5);
    addClueEdge(graph, 'e1', 'agent-a', 'ruin-1', CLUE_QUEST_THRESHOLD);
    // Guild far outside radius
    addGuildLocation(graph, 'loc-guild', 'subloc-guild-hall', 5 + GUILD_QUEST_RADIUS + 2, 5);
    const state = buildState(graph, INTERVAL);
    const result = phaseRuinQuestHooks(state);
    expect(result.tickEvents ?? []).toHaveLength(0);
  });

  it('selects correct template ID for saga magnitude', () => {
    const graph = new WorldGraph();
    addRuin(graph, 'ruin-1', RUIN_MAGNITUDE_MAJOR_MAX + 0.1, 'spirit');
    addClueEdge(graph, 'e1', 'agent-a', 'ruin-1', CLUE_QUEST_THRESHOLD);
    addGuildLocation(graph);
    phaseRuinQuestHooks(buildState(graph, INTERVAL));
    const ruinNode = graph.getNode('ruin-1');
    expect(ruinNode?.properties.questHookTemplateId).toBe('ag.elite.lost_city');
  });

  it('includes hex coordinates in the toast event', () => {
    const graph = new WorldGraph();
    addRuin(graph, 'ruin-1', 0.4, 'iron', 7, 9);
    addClueEdge(graph, 'e1', 'agent-a', 'ruin-1', CLUE_QUEST_THRESHOLD);
    addGuildLocation(graph, 'loc-guild', 'subloc-guild-hall', 5, 7);
    const result = phaseRuinQuestHooks(buildState(graph, INTERVAL));
    const events = result.tickEvents ?? [];
    expect(events[0].hexCoords).toEqual({ col: 7, row: 9 });
  });
});
