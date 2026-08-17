/**
 * Shared debug agent-selector resolution (THR-1032).
 *
 * These run against a REAL seeded world, not a hand-built fixture, because the
 * defect they pin was invisible to a fixture by construction: the old matchers
 * read the display name from `properties.name` while `GraphNode.name` is a
 * top-level field, and a fixture that invents both sides would have "passed"
 * against a node shape the engine never produces.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { resolveDebugAgent, isDebugAgentMiss, AVATAR_ALIASES } from '../debugAgentResolver';
import { initializeGameState, MAP_SIZE_PRESETS } from '../gameInit';
import { createBalancedCosmology } from '../cosmology';
import { generateArchetypes } from '../ascendant';
import type { GameState } from '../../types/gameState';

describe('resolveDebugAgent (THR-1032)', () => {
  let state: GameState;

  beforeAll(() => {
    const preset = MAP_SIZE_PRESETS.small;
    const archetype = generateArchetypes(4, 42)[0];
    state = initializeGameState(
      archetype,
      'Test-Runner',
      createBalancedCosmology(),
      42,
      preset.cols,
      preset.rows,
    ).state;
  });

  // The headline defect: `@hero` is the alias CLAUDE.md documents for the actor
  // every `?spawn=` review route stages on, and no debug accessor accepted it.
  it.each(AVATAR_ALIASES)('resolves the avatar alias %s', (alias) => {
    const resolved = resolveDebugAgent(state, alias);
    expect(isDebugAgentMiss(resolved)).toBe(false);
    if (isDebugAgentMiss(resolved)) return;
    expect(resolved.matchedBy).toBe('avatar-alias');
    expect(resolved.node.type).toBe('actor');
  });

  it('resolves the avatar alias to the same node as its exact id', () => {
    const viaAlias = resolveDebugAgent(state, '@hero');
    expect(isDebugAgentMiss(viaAlias)).toBe(false);
    if (isDebugAgentMiss(viaAlias)) return;

    const viaId = resolveDebugAgent(state, viaAlias.node.id);
    expect(isDebugAgentMiss(viaId)).toBe(false);
    if (isDebugAgentMiss(viaId)) return;
    expect(viaId.node.id).toBe(viaAlias.node.id);
    expect(viaId.matchedBy).toBe('id');
  });

  // The second half of the defect: the old matcher read `properties.name`, so
  // matching by the name a reviewer can actually SEE on screen was dead. Drive it
  // from a name the engine really minted rather than one the test invents.
  it("resolves an actor by the display name the engine actually minted", () => {
    const actor = state.graph.getNodesByType('actor').find(n => Boolean(n.name));
    expect(actor).toBeTruthy();
    const firstWord = actor!.name.split(' ')[0];

    const resolved = resolveDebugAgent(state, firstWord);
    expect(isDebugAgentMiss(resolved)).toBe(false);
    if (isDebugAgentMiss(resolved)) return;
    expect(resolved.node.name.toLowerCase()).toContain(firstWord.toLowerCase());
  });

  it('resolves the avatar by its own display name, not only by alias', () => {
    const viaAlias = resolveDebugAgent(state, '@hero');
    if (isDebugAgentMiss(viaAlias)) throw new Error('avatar alias must resolve');
    const avatarName = viaAlias.node.name;
    expect(avatarName, 'the avatar must carry a top-level name').toBeTruthy();

    const resolved = resolveDebugAgent(state, avatarName);
    expect(isDebugAgentMiss(resolved)).toBe(false);
  });

  it('matches names case-insensitively', () => {
    const viaAlias = resolveDebugAgent(state, '@hero');
    if (isDebugAgentMiss(viaAlias)) throw new Error('avatar alias must resolve');

    const resolved = resolveDebugAgent(state, viaAlias.node.name.toUpperCase());
    expect(isDebugAgentMiss(resolved)).toBe(false);
  });

  it('resolves by id prefix', () => {
    const viaAlias = resolveDebugAgent(state, '@hero');
    if (isDebugAgentMiss(viaAlias)) throw new Error('avatar alias must resolve');

    const resolved = resolveDebugAgent(state, viaAlias.node.id.slice(0, 6));
    expect(isDebugAgentMiss(resolved)).toBe(false);
  });

  // Done-when 3: a genuine miss must be distinguishable from a wrong id, or the
  // caller loops on more spellings (impediment #486 tried six).
  it('reports what it searched on a miss, not a bare "no match"', () => {
    const resolved = resolveDebugAgent(state, 'definitely-not-an-actor-xyz');
    expect(isDebugAgentMiss(resolved)).toBe(true);
    if (!isDebugAgentMiss(resolved)) return;

    expect(resolved.searched).toBeGreaterThan(0);
    expect(resolved.error).toContain("type 'actor'");
    expect(resolved.error).toContain(String(resolved.searched));
    // It must also point at the alias, which is the answer in the case that
    // actually recurred.
    expect(resolved.error).toContain('@hero');
  });

  it('distinguishes an alias-resolution failure from a wrong id', () => {
    const noAscendant = { ...state, ascendantId: '' } as GameState;
    const resolved = resolveDebugAgent(noAscendant, '@hero');
    expect(isDebugAgentMiss(resolved)).toBe(true);
    if (!isDebugAgentMiss(resolved)) return;
    expect(resolved.error).toContain('alias-resolution failure');
  });

  /**
   * THR-1032 Done-when 1, discharged headlessly.
   *
   * `listAftermathReactions` is a three-line delegation: resolve the selector,
   * then hand the id to `resolveAftermathContextForAgent`. This asserts the two
   * halves compose on a real world — the half the browser capture would have
   * exercised. The dev server cannot be started in an unattended run (impediments
   * #546, #574), and the GameView change touches no render path.
   */
  it('composes with the aftermath context resolver the debug bridge calls', async () => {
    const { resolveAftermathContextForAgent } = await import('../encounterAftermath');

    const resolved = resolveDebugAgent(state, '@hero');
    if (isDebugAgentMiss(resolved)) throw new Error('avatar alias must resolve');

    const context = resolveAftermathContextForAgent(state, resolved.node.id);

    // A fresh world has no pending aftermath, so an error here is expected and
    // correct. What matters is WHICH error: it must be the downstream
    // "no pending aftermath for <resolved avatar id>", proving the selector
    // resolved — never the upstream "no agent matching", which is the defect.
    if ('error' in context) {
      expect(context.error).toContain(resolved.node.id);
      expect(context.error).not.toMatch(/no (agent|actor) matching/i);
    }
  });
});
