import { describe, it, expect } from 'vitest';
import {
  AVATAR_SIGHT_RANGE,
  AGENT_SIGHT_RANGE,
  SCRY_SIGHT_RANGE,
  SCRY_ESSENCE_PER_TICK,
  MOVE_ESSENCE_COST,
} from '../visibility';
import type { HexVisibility, HexVisibilityState, StaleSnapshot } from '../visibility';

describe('visibility types and constants', () => {
  it('exports sight range constants', () => {
    expect(AVATAR_SIGHT_RANGE).toBe(1);
    expect(AGENT_SIGHT_RANGE).toBe(1);
    expect(SCRY_SIGHT_RANGE).toBe(1);
    expect(SCRY_ESSENCE_PER_TICK).toBe(2);
    expect(MOVE_ESSENCE_COST).toBe(0);
  });

  it('HexVisibilityState type covers three states', () => {
    const states: HexVisibilityState[] = ['unexplored', 'remembered', 'visible'];
    expect(states).toHaveLength(3);
  });

  it('StaleSnapshot has required fields', () => {
    const snapshot: StaleSnapshot = {
      terrain: 'forest',
      locationNames: ['Sacred Grove'],
      agentNames: ['Kira'],
      lastSeenTick: 5,
    };
    expect(snapshot.terrain).toBe('forest');
    expect(snapshot.lastSeenTick).toBe(5);
  });

  it('HexVisibility defaults to unexplored', () => {
    const vis: HexVisibility = { state: 'unexplored' };
    expect(vis.state).toBe('unexplored');
    expect(vis.snapshot).toBeUndefined();
  });

  it('HexVisibility remembered state holds snapshot', () => {
    const vis: HexVisibility = {
      state: 'remembered',
      snapshot: {
        terrain: 'plains',
        locationNames: [],
        agentNames: ['Thane'],
        lastSeenTick: 3,
      },
    };
    expect(vis.snapshot?.agentNames).toEqual(['Thane']);
  });
});
