// @vitest-environment jsdom
/**
 * Debug-bridge wiring defects from the THR-1133 pixel sweep (THR-1412).
 *
 * Both suites run against a REAL generated world rather than a hand-built
 * fixture, for the reason `debugAgentResolver.test.ts` already states: the
 * defects here are *node-shape* defects, and a fixture that invents both sides
 * of the shape verifies fiction. An actor's display name lives at the top-level
 * `GraphNode.name`; a fixture free to also set `properties.name` would have let
 * the broken matcher pass.
 */
import { describe, it, expect, beforeAll, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { renderHook, act } from '@testing-library/react';
import { resolveDebugAgent, isDebugAgentMiss } from '../../../engine/debugAgentResolver';
import { initializeGameState, MAP_SIZE_PRESETS } from '../../../engine/gameInit';
import { createBalancedCosmology } from '../../../engine/cosmology';
import { generateArchetypes } from '../../../engine/ascendant';
import { getFamiliarity, getKnowledgeLevel } from '../../../engine/familiarity';
import { useAgentInteraction } from '../hooks/useAgentInteraction';
import type { GameState } from '../../../types/gameState';
import type { AscendantArchetype } from '../../../types/influence';

vi.mock('../hooks/useInterventionAudio', () => ({
  useInterventionAudio: () => ({ playCastSound: vi.fn() }),
}));

let state: GameState;
let archetype: AscendantArchetype;

beforeAll(() => {
  const preset = MAP_SIZE_PRESETS.small;
  archetype = generateArchetypes(4, 42)[0];
  state = initializeGameState(
    archetype,
    'Test-Runner',
    createBalancedCosmology(),
    42,
    preset.cols,
    preset.rows,
  ).state;
});

/** A named, non-ascendant actor from the generated world. */
function pickNamedAgent(s: GameState) {
  const agent = s.graph.getNodesByType('actor').find(n =>
    n.id !== s.ascendantId
    && typeof n.name === 'string'
    && n.name.trim().length > 0
    && n.name.includes(' '), // a two-part personal name, so a partial match is meaningful
  );
  if (!agent) throw new Error('generated world produced no named agent — the probe, not the code, is broken');
  return agent;
}

describe('debug action bridge resolves agents by name (THR-1412)', () => {
  it('the generated world puts display names at `name`, never `properties.name`', () => {
    // This is the premise the broken matcher got wrong. Assert it directly, so
    // a future node-shape change fails HERE with a clear reason rather than
    // making the tests below mysteriously vacuous.
    const agent = pickNamedAgent(state);
    expect(agent.name).toBeTruthy();
    expect((agent.properties as Record<string, unknown>).name).toBeUndefined();
  });

  it('resolves an agent by a partial display name', () => {
    const agent = pickNamedAgent(state);
    const firstName = agent.name!.split(' ')[0];

    const result = resolveDebugAgent(state, firstName);
    expect(isDebugAgentMiss(result)).toBe(false);
    if (isDebugAgentMiss(result)) return;
    expect(result.node.name).toContain(firstName);
  });

  it('resolves an agent by its full display name', () => {
    const agent = pickNamedAgent(state);
    const result = resolveDebugAgent(state, agent.name!);
    expect(isDebugAgentMiss(result)).toBe(false);
    if (isDebugAgentMiss(result)) return;
    expect(result.node.id).toBe(agent.id);
  });

  it('still misses for a name nobody has — the matcher is selective, not permissive', () => {
    // Without this, a matcher that returned the first actor for any input would
    // pass every test above.
    const result = resolveDebugAgent(state, 'Zzzqqx Nonexistent');
    expect(isDebugAgentMiss(result)).toBe(true);
  });

  it('GameView\'s action bridge delegates to the shared resolver', () => {
    // A source pin, and labelled as one: rendering GameView in jsdom is not
    // viable (WebGL, hundreds of imports), so the behavioural half is carried by
    // the resolver tests above. What this catches is the actual regression
    // shape — a hand-rolled `properties.name` matcher reappearing in the bridge.
    const src = readFileSync(
      resolve(__dirname, '../GameView.tsx'),
      'utf8',
    );

    // Bound the slice to the two matchers themselves — from the bridge
    // registration to the cast call that follows fireAction's agent lookup.
    // A slice wider than that sweeps in unrelated `properties.name` reads and
    // the pin stops meaning anything.
    const bridgeStart = src.indexOf('_registerActionBridge');
    expect(bridgeStart).toBeGreaterThan(-1);
    const bridgeEnd = src.indexOf('preparePlayerCast', bridgeStart);
    expect(bridgeEnd).toBeGreaterThan(bridgeStart);
    // Comments are stripped first: the code here explains the defect by naming
    // `properties.name`, and a pin that matched its own prose would fail the
    // moment someone documented the fix.
    const bridge = src
      .slice(bridgeStart, bridgeEnd)
      .split('\n')
      .map(line => line.replace(/\/\/.*$/, ''))
      .join('\n');

    // Both matchers resolve through the shared resolver...
    expect(bridge.match(/resolveDebugAgent\(/g)?.length).toBe(2);
    // ...and neither reads the field actors do not carry.
    expect(bridge).not.toContain('properties.name');
  });
});

describe('omniscience lifts the character-sheet familiarity gate (THR-1412)', () => {
  function renderWith(omniscienceMode: boolean) {
    return renderHook(() =>
      useAgentInteraction({
        gameState: state,
        setGameState: vi.fn(),
        archetype,
        onOpenScry: vi.fn(),
        omniscienceMode,
      }),
    );
  }

  it('the agent under test is genuinely a stranger — the controlled arm', () => {
    // Confirms the perturbation is real. If the world handed back an agent the
    // player is already transparent with, the "on" assertion below would pass
    // for the wrong reason and prove nothing.
    const agent = pickNamedAgent(state);
    expect(getKnowledgeLevel(getFamiliarity(state.familiarityMap, agent.id))).toBe('stranger');
  });

  it('the same agent reads as `transparent` with omniscience on', () => {
    const agent = pickNamedAgent(state);
    const { result } = renderWith(true);

    act(() => { result.current.handleAgentSelect(agent.id); });

    expect(result.current.agentInfoCard?.knowledgeLevel).toBe('transparent');
  });

  it('and reads as `stranger` on the same agent when the flag is off', () => {
    const agent = pickNamedAgent(state);
    const { result } = renderWith(false);

    act(() => { result.current.handleAgentSelect(agent.id); });

    expect(result.current.agentInfoCard?.knowledgeLevel).toBe('stranger');
  });
});
