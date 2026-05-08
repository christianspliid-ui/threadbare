import { describe, it, expect } from 'vitest';
import {
  computeSequencedEffects,
  type EffectInput,
} from '../useEffectSequencing';
import {
  REGISTRATION_GATE_LINE,
  REGISTRATION_GATE_PAUSE_MS,
  REGISTRATION_GATE_THRESHOLD,
  REGISTRATION_LANE_ECHO_STRIP_MS,
  REGISTRATION_LANE_HERO_PANEL_FIRST_MS,
  REGISTRATION_LANE_HERO_PANEL_SECOND_MS,
  REGISTRATION_LANE_PLAYER_ONLY_MS,
  REGISTRATION_LANE_RIGHT_RAIL_CAST_MS,
  REGISTRATION_LANE_RIGHT_RAIL_STATE_MS,
} from '../../data/encounter-experience-constants';

function inputs(...kinds: EffectInput['kind'][]): readonly EffectInput[] {
  return kinds.map((kind, idx) => ({ id: `${kind}-${idx}`, kind }));
}

describe('computeSequencedEffects — single effect', () => {
  it('returns one effect at the lane start, no gate line', () => {
    const { sequenced, gateLine } = computeSequencedEffects(inputs('intelligence'));
    expect(sequenced).toHaveLength(1);
    expect(sequenced[0]?.kind).toBe('intelligence');
    expect(sequenced[0]?.lane).toBe('hero_panel');
    expect(sequenced[0]?.delay).toBe(REGISTRATION_LANE_HERO_PANEL_FIRST_MS);
    expect(sequenced[0]?.enablePulseRing).toBe(true);
    expect(sequenced[0]?.gated).toBe(false);
    expect(gateLine).toBeNull();
  });

  it('places hidden_mark in player_only lane regardless of input order', () => {
    const { sequenced } = computeSequencedEffects(
      inputs('hidden_mark', 'intelligence'),
    );
    const hidden = sequenced.find((s) => s.kind === 'hidden_mark');
    const intel = sequenced.find((s) => s.kind === 'intelligence');
    expect(hidden?.lane).toBe('player_only');
    expect(hidden?.delay).toBe(REGISTRATION_LANE_PLAYER_ONLY_MS);
    expect(intel?.lane).toBe('hero_panel');
    expect(intel?.delay).toBeLessThan(hidden!.delay);
  });
});

describe('computeSequencedEffects — three effects', () => {
  it('orders by lane priority: hero_panel → cast → state', () => {
    const { sequenced, gateLine } = computeSequencedEffects(
      inputs('faction', 'reputation_tally', 'intelligence'),
    );
    expect(sequenced.map((s) => s.kind)).toEqual([
      'intelligence', // hero_panel
      'reputation_tally', // right_rail_cast
      'faction', // right_rail_state
    ]);
    expect(sequenced[0]?.delay).toBe(REGISTRATION_LANE_HERO_PANEL_FIRST_MS);
    expect(sequenced[1]?.delay).toBe(REGISTRATION_LANE_RIGHT_RAIL_CAST_MS);
    expect(sequenced[2]?.delay).toBe(REGISTRATION_LANE_RIGHT_RAIL_STATE_MS);
    expect(gateLine).toBeNull();
  });

  it('uses second hero_panel slot for second registration in same lane', () => {
    const { sequenced } = computeSequencedEffects(
      inputs('intelligence', 'spawn_artifact'),
    );
    expect(sequenced[0]?.delay).toBe(REGISTRATION_LANE_HERO_PANEL_FIRST_MS);
    expect(sequenced[1]?.delay).toBe(REGISTRATION_LANE_HERO_PANEL_SECOND_MS);
  });

  it('places recent_event in echo_strip after right_rail tickets', () => {
    const { sequenced } = computeSequencedEffects(
      inputs('recent_event', 'reputation_score', 'intelligence'),
    );
    const echo = sequenced.find((s) => s.kind === 'recent_event');
    expect(echo?.lane).toBe('echo_strip');
    expect(echo?.delay).toBe(REGISTRATION_LANE_ECHO_STRIP_MS);
    // Echo lane runs after the cast lane.
    const cast = sequenced.find((s) => s.kind === 'reputation_score');
    expect(echo!.delay).toBeGreaterThan(cast!.delay);
  });
});

describe('computeSequencedEffects — six effects (second-breath gate)', () => {
  const sixKinds: EffectInput['kind'][] = [
    'intelligence',
    'spawn_artifact',
    'reputation_tally',
    'reputation_score',
    'faction',
    'recent_event',
  ];

  it('emits the gate-line when count > 5', () => {
    const { gateLine } = computeSequencedEffects(inputs(...sixKinds));
    expect(gateLine).toBe(REGISTRATION_GATE_LINE);
  });

  it('marks effects 6+ as gated and shifts their delay by REGISTRATION_GATE_PAUSE_MS', () => {
    const { sequenced } = computeSequencedEffects(inputs(...sixKinds));
    expect(sequenced).toHaveLength(6);
    const firstFive = sequenced.slice(0, REGISTRATION_GATE_THRESHOLD);
    const sixth = sequenced[REGISTRATION_GATE_THRESHOLD];
    firstFive.forEach((s) => {
      expect(s.gated).toBe(false);
    });
    expect(sixth?.gated).toBe(true);
    // Sixth effect's natural delay (echo_strip start) is REGISTRATION_LANE_ECHO_STRIP_MS;
    // gated delay must be shifted by REGISTRATION_GATE_PAUSE_MS.
    expect(sixth?.delay).toBe(
      REGISTRATION_LANE_ECHO_STRIP_MS + REGISTRATION_GATE_PAUSE_MS,
    );
  });

  it('does NOT emit gate-line at exactly 5 effects', () => {
    const { gateLine, sequenced } = computeSequencedEffects(
      inputs(...sixKinds.slice(0, 5)),
    );
    expect(gateLine).toBeNull();
    sequenced.forEach((s) => expect(s.gated).toBe(false));
  });
});

describe('computeSequencedEffects — discipline rules', () => {
  it('rule §4.3 #2: pulse ring suppressed when previous pulse on same lane is still in decay', () => {
    // Two reputation_tally effects share the right_rail_cast lane (only one
    // window per §4.2), and the 280ms typewriter flip is short enough that
    // the second effect lands inside the first's 600ms pulse decay window —
    // so the second pulse must be suppressed.
    const { sequenced } = computeSequencedEffects(
      inputs('reputation_tally', 'reputation_tally'),
    );
    expect(sequenced).toHaveLength(2);
    expect(sequenced[0]?.lane).toBe('right_rail_cast');
    expect(sequenced[1]?.lane).toBe('right_rail_cast');
    expect(sequenced[0]?.enablePulseRing).toBe(true);
    expect(sequenced[1]?.enablePulseRing).toBe(false);
  });

  it('rule §4.3 #1: 50% overlap rule shifts second card-flip in same lane', () => {
    // Two intelligence effects, same hero_panel lane. The second should land
    // at the second hero_panel slot (per §4.2), but the overlap rule may
    // additionally shift it forward if needed.
    const { sequenced } = computeSequencedEffects(
      inputs('intelligence', 'intelligence'),
    );
    expect(sequenced[1]!.delay).toBeGreaterThanOrEqual(
      sequenced[0]!.delay + 100, // Strictly later — no overlap >50%
    );
  });
});

describe('computeSequencedEffects — empty input', () => {
  it('returns empty sequenced array and null gate-line', () => {
    const { sequenced, gateLine } = computeSequencedEffects([]);
    expect(sequenced).toEqual([]);
    expect(gateLine).toBeNull();
  });
});
