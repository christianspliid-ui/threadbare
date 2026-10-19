/**
 * THR-1914 (Inspector plan § D9 way 3) — the card → its targets inverse.
 *
 * 1. A person card lights the people it can land on and nothing else; a place is not a target.
 * 2. Locked targets stay lit with the card face's reason; an unknown card is "nowhere to land".
 * 3. Leak test: a person on an unexplored hex is never lit, and the map never lights that hex.
 * 4. The words: the target category's words, the empty line, the card's receipt name.
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../../graph';
import type { GameState } from '../../../types/gameState';
import type { HexTile } from '../../../types';
import type { HexContentsVM } from '../hexContents';
import { buildArmedTargets, buildArmedTargetsFrom, evaluateCardOnTarget, armedTargetWords, armedCardName, refKey, refForMapNode } from '../armedTargets';
import { getUnifiedTemplateById } from '../../../data/unified-action-templates';
import { ARMED_TARGET_WORDS } from '../../../data/view-content';
import { KNOWLEDGE_SURFACES } from '../knowledge';

const ASC = 'asc';
const WHISPER = 'whisper_insight';

function world(opts: { pool?: number; fog?: boolean } = {}): GameState {
  const graph = new WorldGraph();
  graph.addNode({ id: ASC, type: 'actor', name: 'Vara', properties: { actorType: 'ascendant' } });
  graph.addNode({ id: 'quarter', type: 'location', name: 'Temple Quarter', properties: { locationType: 'town', locationSubtype: 'town', hexCol: 3, hexRow: 4 } });
  graph.addNode({ id: 'shrine', type: 'location', name: 'The Shrine', properties: { parentLocationId: 'quarter', sublocationCategory: 'shrine' } });
  graph.addNode({ id: 'shutash', type: 'actor', name: 'Shutash', properties: { actorType: 'individual', locationId: 'shrine' } });
  graph.addEdge({ id: 'at1', source: 'shutash', target: 'shrine', type: 'located_at', properties: {} });
  graph.addNode({ id: 'nutat', type: 'actor', name: 'Nutat', properties: { actorType: 'individual', locationId: 'quarter' } });
  graph.addEdge({ id: 'at2', source: 'nutat', target: 'quarter', type: 'located_at', properties: {} });
  // A far town, under fog.
  graph.addNode({ id: 'hidden', type: 'location', name: 'Fogbound', properties: { locationType: 'town', locationSubtype: 'town', hexCol: 9, hexRow: 9 } });
  graph.addNode({ id: 'ghost', type: 'actor', name: 'Ghost', properties: { actorType: 'individual', locationId: 'hidden' } });
  graph.addEdge({ id: 'at3', source: 'ghost', target: 'hidden', type: 'located_at', properties: {} });
  const pool = opts.pool ?? 99;
  const visibilityMap = new Map<string, { state: string }>();
  if (opts.fog) {
    visibilityMap.set('3,4', { state: 'visible' });
    visibilityMap.set('9,9', { state: 'unexplored' });
  }
  return {
    graph,
    ascendantId: ASC,
    tick: 12,
    seed: 42,
    tiles: [
      { coord: { col: 3, row: 4 }, terrain: 'grassland' } as unknown as HexTile,
      { coord: { col: 9, row: 9 }, terrain: 'grassland' } as unknown as HexTile,
    ],
    visibilityMap,
    essencePool: { spirit: pool, mind: pool, veil: pool, life: pool },
    unifiedActions: [],
    controlEffects: [],
    unlockedActionIds: [WHISPER],
    ascendantIdentity: { sphereAlignment: { primary: 'spirit', secondary: 'mind' } },
  } as unknown as GameState;
}

describe('evaluateCardOnTarget', () => {
  it('a person card lands on a person, never on a place', () => {
    const state = world();
    expect(evaluateCardOnTarget(state, WHISPER, { kind: 'agent', id: 'shutash' }).state).toBe('castable');
    expect(evaluateCardOnTarget(state, WHISPER, { kind: 'location', id: 'quarter' }).state).toBe('not_a_target');
    expect(evaluateCardOnTarget(state, WHISPER, { kind: 'hex', id: '3,4' }).state).toBe('not_a_target');
  });

  it('the castable verdict carries the slot id the one cast path takes', () => {
    const v = evaluateCardOnTarget(world(), WHISPER, { kind: 'agent', id: 'shutash' });
    expect(v.slotId).toBe(`target_action_${WHISPER}`);
  });

  it('a card the pool cannot pay is locked, with the card face\'s reason', () => {
    const v = evaluateCardOnTarget(world({ pool: 0 }), WHISPER, { kind: 'agent', id: 'shutash' });
    expect(v.state).toBe('locked');
    expect(v.reason).toMatch(/essence/i);
  });

  it('an unknown card has nowhere to land (fail-soft), and never throws', () => {
    const v = evaluateCardOnTarget(world(), 'no_such_card', { kind: 'agent', id: 'shutash' });
    expect(v.state).toBe('not_a_target');
    expect(v.reason).toBe('This card has nowhere to land yet.');
    expect(evaluateCardOnTarget(world(), WHISPER, { kind: 'agent', id: 'gone' }).state).toBe('not_a_target');
  });
});

describe('buildArmedTargets', () => {
  it('lights Shutash and Nutat and their hex, and dims everything else', () => {
    const vm = buildArmedTargets(world(), WHISPER);
    expect(Object.keys(vm.lit).sort()).toEqual([refKey({ kind: 'agent', id: 'ghost' }), refKey({ kind: 'agent', id: 'nutat' }), refKey({ kind: 'agent', id: 'shutash' })].sort());
    expect(vm.map.lit).toContain('3,4');
    expect(vm.map.hover['3,4']).toContain('Shutash');
    expect(vm.emptyLine).toBeNull();
  });

  it('leak test: nothing lit on an unexplored hex', () => {
    const vm = buildArmedTargets(world({ fog: true }), WHISPER);
    expect(vm.lit[refKey({ kind: 'agent', id: 'ghost' })]).toBeUndefined();
    expect(vm.map.lit).not.toContain('9,9');
    expect(vm.map.litLocked).not.toContain('9,9');
    expect(vm.map.hover['9,9']).toBeUndefined();
    expect(vm.map.lit).toEqual(['3,4']);
  });

  it('locked-only hexes go to litLocked with the reason on hover', () => {
    const vm = buildArmedTargets(world({ pool: 0, fog: true }), WHISPER);
    expect(vm.map.lit).toEqual([]);
    expect(vm.map.litLocked).toEqual(['3,4']);
    expect(vm.map.hover['3,4']).toMatch(/Shutash — not enough/);
  });

  it('a target on several hexes (a faction\'s halls) lights every one of them', () => {
    const hex = (key: string, col: number, row: number): HexContentsVM => ({
      hexKey: key, col, row, people: [{ ref: { kind: 'agent', id: 'shutash' }, name: 'Shutash' }], locations: [], places: [],
      armies: [], artifacts: [], lairs: [], ruins: [], halls: [], resources: [], covenants: [],
    });
    const vm = buildArmedTargetsFrom(world(), WHISPER, { '3,4': hex('3,4', 3, 4), '5,5': hex('5,5', 5, 5) });
    const entry = vm.lit[refKey({ kind: 'agent', id: 'shutash' })];
    expect(entry.hexKeys.sort()).toEqual(['3,4', '5,5']);
    expect(vm.map.lit).toEqual(['3,4', '5,5']);
    expect(vm.map.hover['5,5']).toContain('Shutash');
  });

  it('says so when nothing in sight can be touched', () => {
    const state = world({ fog: true });
    state.visibilityMap.set('3,4', { state: 'unexplored' } as never);
    const vm = buildArmedTargets(state, WHISPER);
    expect(vm.lit).toEqual({});
    expect(vm.emptyLine).toBe(`Nothing you can see is something ${vm.cardName} can touch.`);
  });
});

describe('the words', () => {
  it('names the card as the receipt does, and what it asks for', () => {
    const t = getUnifiedTemplateById(WHISPER)!;
    expect(armedCardName(t)).toBe('Illuminating Whisper');
    expect(armedTargetWords(t)).toBe('a person');
    expect(armedTargetWords({ targetCategories: ['location', 'hex'] })).toBe('a place or open land');
    expect(armedTargetWords({})).toBe(ARMED_TARGET_WORDS.actor);
  });

  it('the seen floor names the armed-targets surface', () => {
    expect(KNOWLEDGE_SURFACES).toContain('armedTargets');
  });
});

describe('refForMapNode', () => {
  it('maps a clicked node to the ref a choice takes', () => {
    const state = world();
    expect(refForMapNode(state, 'shutash')).toEqual({ kind: 'agent', id: 'shutash' });
    expect(refForMapNode(state, 'quarter')).toEqual({ kind: 'location', id: 'quarter' });
    expect(refForMapNode(state, 'shrine')).toEqual({ kind: 'sublocation', id: 'shrine' });
    expect(refForMapNode(state, 'gone')).toBeNull();
  });
});
