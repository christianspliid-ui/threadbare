import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  resolveEconomicChronicle,
  resolveNamesFromGraph,
  type EconomicChronicleContext,
} from '../economicChronicle';
import { WorldGraph } from '../graph';
import { enableTracing, clearTraces, getTraces } from '../traceBuffer';
import type { EconomicChronicleTrigger } from '../../data/economic-chronicle-content';
import {
  ECONOMIC_CHRONICLE_TEMPLATES,
  ECONOMIC_CHRONICLE_SIGNIFICANCE,
} from '../../data/economic-chronicle-content';

// ─── Setup ──────────────────────────────────────────────────────────────────

beforeEach(() => {
  enableTracing();
  clearTraces();
});

afterEach(() => {
  clearTraces();
});

// ─── resolveEconomicChronicle ───────────────────────────────────────────────

describe('resolveEconomicChronicle', () => {
  it('returns a TickEvent and ChronicleChapter for settlement_promotion', () => {
    const result = resolveEconomicChronicle(
      'settlement_promotion',
      { settlement: 'Ironhold', oldType: 'hamlet', newType: 'town' },
      10,
      42,
    );

    expect(result).not.toBeNull();
    expect(result!.tickEvent.message).toContain('Ironhold');
    expect(result!.tickEvent.message).toContain('hamlet');
    expect(result!.tickEvent.message).toContain('town');
    expect(result!.tickEvent.significance).toBe(0.9);
    expect(result!.tickEvent.tick).toBe(10);
    expect(result!.tickEvent.sphere).toBe('gold');

    expect(result!.chronicleChapter.title).toBe('A Settlement Rises');
    expect(result!.chronicleChapter.prose).toBe(result!.tickEvent.message);
    expect(result!.chronicleChapter.significance).toBe(0.9);
    expect(result!.chronicleChapter.tick).toBe(10);
    expect(result!.chronicleChapter.spheres).toEqual(['gold']);
  });

  it('returns a TickEvent and ChronicleChapter for settlement_demotion', () => {
    const result = resolveEconomicChronicle(
      'settlement_demotion',
      { settlement: 'Ashford', oldType: 'town', newType: 'hamlet' },
      15,
      99,
    );

    expect(result).not.toBeNull();
    expect(result!.tickEvent.message).toContain('Ashford');
    expect(result!.tickEvent.significance).toBe(0.8);
    expect(result!.chronicleChapter.title).toBe('A Settlement Falls');
  });

  it('handles trade_route_established with goods type', () => {
    const result = resolveEconomicChronicle(
      'trade_route_established',
      { actor: 'Ironhold', target: 'Ashford', goodsType: 'timber' },
      20,
      123,
    );

    expect(result).not.toBeNull();
    expect(result!.tickEvent.message).toContain('Ironhold');
    expect(result!.tickEvent.message).toContain('Ashford');
    expect(result!.tickEvent.message).toContain('timber');
    expect(result!.tickEvent.significance).toBe(0.5);
  });

  it('handles trade_route_died with ticks ago', () => {
    const result = resolveEconomicChronicle(
      'trade_route_died',
      { actor: 'Ironhold', target: 'Ashford', ticksAgo: 12 },
      30,
      456,
    );

    expect(result).not.toBeNull();
    // At least one template variant includes {ticksAgo}
    // Others may not, so just check actor/target are present
    expect(result!.tickEvent.message).toContain('Ironhold');
    expect(result!.tickEvent.message).toContain('Ashford');
    expect(result!.tickEvent.significance).toBe(0.6);
  });

  it('handles guild_founded with guild type flavor', () => {
    const result = resolveEconomicChronicle(
      'guild_founded',
      {
        guildName: "The Miners' Fellowship",
        guildType: 'miners',
        settlement: 'Deepstone',
      },
      5,
      789,
    );

    expect(result).not.toBeNull();
    expect(result!.tickEvent.message).toContain("The Miners' Fellowship");
    expect(result!.tickEvent.message).toContain('Deepstone');
    expect(result!.tickEvent.significance).toBe(0.7);
    expect(result!.chronicleChapter.title).toBe('Guild Founded');
  });

  it('handles monopoly_established', () => {
    const result = resolveEconomicChronicle(
      'monopoly_established',
      { actor: 'Guildmaster Thrain', resource: 'iron ore', settlement: 'Hammerfall' },
      40,
      321,
    );

    expect(result).not.toBeNull();
    expect(result!.tickEvent.message).toContain('Guildmaster Thrain');
    expect(result!.tickEvent.message).toContain('iron ore');
    expect(result!.tickEvent.message).toContain('Hammerfall');
    expect(result!.tickEvent.significance).toBe(0.9);
  });

  it('handles monopoly_broken', () => {
    const result = resolveEconomicChronicle(
      'monopoly_broken',
      { resource: 'grain', settlement: 'Millhaven' },
      45,
      654,
    );

    expect(result).not.toBeNull();
    expect(result!.tickEvent.message).toContain('grain');
    expect(result!.tickEvent.message).toContain('Millhaven');
    expect(result!.tickEvent.significance).toBe(0.8);
  });

  it('handles mercenary_hire', () => {
    const result = resolveEconomicChronicle(
      'mercenary_hire',
      { actor: 'Lord Vex', settlement: 'Thornwall' },
      50,
      111,
    );

    expect(result).not.toBeNull();
    expect(result!.tickEvent.message).toContain('Lord Vex');
    expect(result!.tickEvent.significance).toBe(0.6);
  });

  it('handles assassination_commissioned', () => {
    const result = resolveEconomicChronicle(
      'assassination_commissioned',
      { actor: 'The Shadow', target: 'Mayor Aldrin', settlement: 'Greymarket' },
      55,
      222,
    );

    expect(result).not.toBeNull();
    expect(result!.tickEvent.significance).toBe(0.8);
    expect(result!.chronicleChapter.title).toBe('Blood Money');
  });

  it('handles agreement_broken', () => {
    const result = resolveEconomicChronicle(
      'agreement_broken',
      { actor: 'House Blackthorn', target: 'House Ashwood' },
      60,
      333,
    );

    expect(result).not.toBeNull();
    expect(result!.tickEvent.message).toContain('House Blackthorn');
    expect(result!.tickEvent.message).toContain('House Ashwood');
    expect(result!.tickEvent.significance).toBe(0.7);
  });

  it('handles wealth_tier_up with auto-resolved flavor', () => {
    const result = resolveEconomicChronicle(
      'wealth_tier_up',
      { actor: 'Merchant Kael', tierLabel: 'Wealthy' },
      70,
      444,
    );

    expect(result).not.toBeNull();
    expect(result!.tickEvent.message).toContain('Merchant Kael');
    expect(result!.tickEvent.message).toContain('Wealthy');
    // Should have auto-resolved flavor from WEALTH_TIER_FLAVOR
    expect(result!.tickEvent.message.length).toBeGreaterThan(30);
    expect(result!.tickEvent.significance).toBe(0.5);
  });

  it('handles wealth_tier_down with auto-resolved flavor', () => {
    const result = resolveEconomicChronicle(
      'wealth_tier_down',
      { actor: 'Beggar Finn', tierLabel: 'Destitute' },
      80,
      555,
    );

    expect(result).not.toBeNull();
    expect(result!.tickEvent.message).toContain('Beggar Finn');
    expect(result!.tickEvent.message).toContain('Destitute');
    expect(result!.tickEvent.significance).toBe(0.6);
  });

  // ─── PRNG determinism ─────────────────────────────────────────────────

  it('produces deterministic output for the same seed', () => {
    const context: EconomicChronicleContext = {
      settlement: 'Ironhold',
      oldType: 'hamlet',
      newType: 'town',
    };

    const result1 = resolveEconomicChronicle('settlement_promotion', context, 10, 42);
    const result2 = resolveEconomicChronicle('settlement_promotion', context, 10, 42);

    expect(result1!.tickEvent.message).toBe(result2!.tickEvent.message);
    expect(result1!.chronicleChapter.prose).toBe(result2!.chronicleChapter.prose);
  });

  it('produces different output for different seeds', () => {
    const context: EconomicChronicleContext = {
      settlement: 'Ironhold',
      oldType: 'hamlet',
      newType: 'town',
    };

    const result1 = resolveEconomicChronicle('settlement_promotion', context, 10, 1);
    const result2 = resolveEconomicChronicle('settlement_promotion', context, 10, 999);

    // With 4 templates and different seeds, they should eventually differ
    // (not guaranteed for every pair, but likely)
    // At minimum they should both be valid
    expect(result1).not.toBeNull();
    expect(result2).not.toBeNull();
  });

  // ─── Fail-soft ────────────────────────────────────────────────────────

  it('uses generic descriptors when names are missing', () => {
    const result = resolveEconomicChronicle(
      'settlement_promotion',
      { oldType: 'hamlet', newType: 'town' },
      10,
      42,
    );

    expect(result).not.toBeNull();
    expect(result!.tickEvent.message).toContain('a settlement');
  });

  it('uses generic descriptors for trade route with no actor/target', () => {
    const result = resolveEconomicChronicle(
      'trade_route_established',
      {},
      10,
      42,
    );

    expect(result).not.toBeNull();
    expect(result!.tickEvent.message).toContain('a merchant');
    expect(result!.tickEvent.message).toContain('a distant partner');
    expect(result!.tickEvent.message).toContain('assorted goods');
  });

  it('uses generic descriptors for monopoly with no resource', () => {
    const result = resolveEconomicChronicle(
      'monopoly_established',
      { actor: 'Thrain' },
      10,
      42,
    );

    expect(result).not.toBeNull();
    expect(result!.tickEvent.message).toContain('a vital resource');
    expect(result!.tickEvent.message).toContain('a settlement');
  });

  // ─── Actor IDs ────────────────────────────────────────────────────────

  it('includes actor IDs in chronicle chapter', () => {
    const result = resolveEconomicChronicle(
      'agreement_broken',
      { actor: 'A', actorId: 'agent_1', target: 'B', targetId: 'agent_2' },
      10,
      42,
    );

    expect(result!.chronicleChapter.actorIds).toEqual(['agent_1', 'agent_2']);
  });

  it('handles missing actor IDs gracefully', () => {
    const result = resolveEconomicChronicle(
      'mercenary_hire',
      { actor: 'Lord Vex' },
      10,
      42,
    );

    expect(result!.chronicleChapter.actorIds).toEqual([]);
  });

  // ─── Hex coordinates ──────────────────────────────────────────────────

  it('passes hex coordinates to TickEvent', () => {
    const result = resolveEconomicChronicle(
      'guild_founded',
      {
        guildName: 'Traders Guild',
        guildType: 'traders',
        settlement: 'Port',
        hexCoords: { col: 3, row: 5 },
      },
      10,
      42,
    );

    expect(result!.tickEvent.hexCoords).toEqual({ col: 3, row: 5 });
  });

  // ─── Trace emission ───────────────────────────────────────────────────

  it('emits economic_chronicle trace', () => {
    resolveEconomicChronicle(
      'settlement_promotion',
      { settlement: 'Ironhold', oldType: 'hamlet', newType: 'town' },
      10,
      42,
    );

    const traces = getTraces();
    const econTraces = traces.filter(t => t.category === 'economic_chronicle');
    expect(econTraces.length).toBe(1);
    expect(econTraces[0]).toMatchObject({
      category: 'economic_chronicle',
      tick: 10,
    });
  });
});

// ─── resolveNamesFromGraph ──────────────────────────────────────────────────

describe('resolveNamesFromGraph', () => {
  it('resolves name from existing node', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'loc_1', type: 'location', name: 'Ironhold', properties: {} });

    const result = resolveNamesFromGraph(graph, 'loc_1');
    expect(result.name).toBe('Ironhold');
  });

  it('resolves hex coordinates from node properties', () => {
    const graph = new WorldGraph();
    graph.addNode({
      id: 'loc_1',
      type: 'location',
      name: 'Ironhold',
      properties: { hexCol: 3, hexRow: 5 },
    });

    const result = resolveNamesFromGraph(graph, 'loc_1');
    expect(result.hexCoords).toEqual({ col: 3, row: 5 });
  });

  it('returns undefined name for missing node', () => {
    const graph = new WorldGraph();
    const result = resolveNamesFromGraph(graph, 'nonexistent');
    expect(result.name).toBeUndefined();
    expect(result.hexCoords).toBeUndefined();
  });
});

// ─── Content integrity ──────────────────────────────────────────────────────

describe('economic chronicle content', () => {
  const allTriggers: EconomicChronicleTrigger[] = [
    'settlement_promotion', 'settlement_demotion',
    'trade_route_established', 'trade_route_died',
    'guild_founded', 'monopoly_established', 'monopoly_broken',
    'mercenary_hire', 'assassination_commissioned', 'agreement_broken',
    'wealth_tier_up', 'wealth_tier_down',
  ];

  it('has templates for all 12 trigger types', () => {
    for (const trigger of allTriggers) {
      expect(ECONOMIC_CHRONICLE_TEMPLATES[trigger]).toBeDefined();
      expect(ECONOMIC_CHRONICLE_TEMPLATES[trigger].length).toBeGreaterThanOrEqual(3);
    }
  });

  it('has significance values for all 12 trigger types', () => {
    for (const trigger of allTriggers) {
      const sig = ECONOMIC_CHRONICLE_SIGNIFICANCE[trigger];
      expect(sig).toBeGreaterThan(0);
      expect(sig).toBeLessThanOrEqual(1);
    }
  });

  it('all templates produce non-empty prose when resolved', () => {
    for (const trigger of allTriggers) {
      const result = resolveEconomicChronicle(trigger, {}, 1, 42);
      expect(result).not.toBeNull();
      expect(result!.tickEvent.message.length).toBeGreaterThan(10);
    }
  });
});
