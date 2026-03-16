import { describe, it, expect } from 'vitest';
import type {
  GameState,
  GamePhase,
  TickEvent,
} from '../../types/gameState';
import {
  MAX_RECENT_EVENTS,
  STEALTH_DECAY_PER_TICK,
  DEFAULT_DOOM_TICKS,
  DOOM_ARCHETYPES,
} from '../../types/gameState';

describe('GameState types', () => {
  it('exports MAX_RECENT_EVENTS constant', () => {
    expect(MAX_RECENT_EVENTS).toBe(100);
  });

  it('exports STEALTH_DECAY_PER_TICK constant', () => {
    expect(STEALTH_DECAY_PER_TICK).toBe(0.01);
  });

  it('exports DEFAULT_DOOM_TICKS constant', () => {
    expect(DEFAULT_DOOM_TICKS).toBe(200);
  });

  it('exports all 7 doom archetypes', () => {
    expect(DOOM_ARCHETYPES).toHaveLength(7);
    expect(DOOM_ARCHETYPES).toContain('breach');
    expect(DOOM_ARCHETYPES).toContain('reckoning');
  });

  it('can construct a TickEvent', () => {
    const event: TickEvent = {
      id: 'evt_001',
      tick: 42,
      type: 'agent_action',
      message: 'Kael marched toward the eastern gate.',
      sphere: 'force',
      significance: 0.7,
    };
    expect(event.type).toBe('agent_action');
    expect(event.significance).toBe(0.7);
  });

  it('GamePhase covers all four phases', () => {
    const phases: GamePhase[] = ['playing', 'twilight', 'harvest', 'transition'];
    expect(phases).toHaveLength(4);
  });
});
