/**
 * THR-1747 Done-when 1 — thread upkeep a god can keep.
 *
 * A deterministic 1,080-tick ledger through the tick loop's own economy order —
 * phaseEssenceSources → phaseEssence → phaseInfluenceMaintenance → tier promotion —
 * with no casts. The four arms pin the plan's ledger (plan § E1):
 *
 *   A: one thread, no ground           → never unpaid, reaches tier 4 (+0.235 at Aspect)
 *   B: two threads + a consecrated source → nothing unpaid, pool > 0 every 120 ticks, both tier 4 (+0.12)
 *   C: B without the source             → once both reach tier 4, one goes unpaid (−0.23: ground is needed)
 *   D: two threads capped at tier 3     → pool > 0 every 120 ticks, nothing unpaid (+0.07, the ticket's predicate)
 *
 * Arm C exists so a later retune that makes held ground pointless fails loudly.
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { createEmptyEssencePool } from '../influence';
import { phaseEssence, phaseInfluenceTierPromotion } from '../orchestrator';
import { phaseEssenceSources } from '../phaseEssenceSources';
import { phaseInfluenceMaintenance } from '../phaseInfluenceMaintenance';
import { TIER_PROMOTION_THRESHOLDS } from '../../types/influence';
import type { GameState } from '../../types/gameState';
import type { SphereAlignment } from '../../types/influence';
import type { EssenceSource } from '../../types/essenceSource';
import { SPHERE_NAMES } from '../../types/index';

const ASC = 'asc.player';
const SEAT = 'loc.seat';
const PRIMARY = 'life' as const;
const RUN_TICKS = 1080;
const SNAPSHOT_EVERY = 120;

interface ArmOpts {
  threads: number;
  source: boolean;
  /** Hold every thread below tier 4 for the whole run (Arm D). */
  capAtTier3?: boolean;
}

interface ArmResult {
  snapshots: number[];
  everUnpaidThread: boolean;
  everUnpaidSource: boolean;
  finalTiers: number[];
  /** First tick on which every thread sat at tier 4 (null if never). */
  allTier4At: number | null;
  /** True when a thread went unpaid on or after `allTier4At`. */
  unpaidAfterAllTier4: boolean;
}

function buildState(opts: ArmOpts): GameState {
  const graph = new WorldGraph();
  graph.addNode({
    id: ASC,
    type: 'actor',
    name: 'The Verdant One',
    properties: {
      actorType: 'ascendant',
      sphereAlignment: { primary: PRIMARY, secondary: 'spirit' } as SphereAlignment,
      homeSeatLocationId: SEAT,
    },
  });
  graph.addNode({ id: SEAT, type: 'location', name: 'Seat', properties: { locationType: 'location' } });
  graph.addEdge({ id: 'edge.controls.seat', source: ASC, target: SEAT, type: 'controls', properties: {} });

  for (let i = 0; i < opts.threads; i++) {
    const id = `agent.${i}`;
    graph.addNode({ id, type: 'actor', name: `Mortal ${i}`, properties: { actorType: 'individual' } });
    // Bound at tick 0 at tier 1 (bind_thread_agent's starting tier).
    graph.addEdge({
      id: `edge.thread.${i}`,
      source: ASC,
      target: id,
      type: 'thread',
      properties: {
        tier: 1,
        ticksAtCurrentTier: 0,
        establishedTick: 0,
        totalEssenceSpent: 0,
        maintenanceCurrent: true,
      },
    });
  }

  if (opts.source) {
    // A source consecrated to the god's primary sphere (what consecrate_source does).
    const src: EssenceSource = { kind: 'placeOfPower', sphereAffinity: PRIMARY, sanctity: 0, tier: 'dormant' };
    graph.addNode({ id: 'loc.src', type: 'location', name: 'Thornwick Spring', properties: { locationType: 'location', essenceSource: src } });
    graph.addEdge({ id: 'edge.controls.src', source: ASC, target: 'loc.src', type: 'controls', properties: {} });
  }

  const pool = createEmptyEssencePool();
  for (const s of SPHERE_NAMES) pool[s] = 50; // the god's starting pool
  return {
    graph,
    ascendantId: ASC,
    essencePool: pool,
    controlEffects: [],
    tick: 0,
    tickEvents: [],
  } as unknown as GameState;
}

function runArm(opts: ArmOpts): ArmResult {
  let s = buildState(opts);
  const result: ArmResult = {
    snapshots: [],
    everUnpaidThread: false,
    everUnpaidSource: false,
    finalTiers: [],
    allTier4At: null,
    unpaidAfterAllTier4: false,
  };
  for (let tick = 1; tick <= RUN_TICKS; tick++) {
    s = { ...s, tick, tickEvents: [] } as GameState;
    s = { ...s, ...phaseEssenceSources(s) } as GameState;
    s = { ...s, ...phaseEssence(s) } as GameState;
    s = { ...s, ...phaseInfluenceMaintenance(s) } as GameState;
    if (opts.capAtTier3) {
      // Held below the tier-4 threshold before promotion reads it.
      for (const e of s.graph.getOutgoingEdges(ASC, 'thread')) {
        if (e.properties.tier === 3) {
          const held = Math.min(e.properties.ticksAtCurrentTier as number, TIER_PROMOTION_THRESHOLDS[4] - 1);
          s.graph.updateEdge(e.id, { properties: { ...e.properties, ticksAtCurrentTier: held } });
        }
      }
    }
    s = { ...s, ...phaseInfluenceTierPromotion(s) } as GameState;

    const threads = s.graph.getOutgoingEdges(ASC, 'thread');
    const unpaid = threads.some(e => e.properties.maintenanceCurrent === false);
    if (unpaid) result.everUnpaidThread = true;
    const src = s.graph.getNode('loc.src')?.properties.essenceSource as EssenceSource | undefined;
    if (src && src.upkeepCurrent === false) result.everUnpaidSource = true;

    if (result.allTier4At === null && threads.length > 0 && threads.every(e => e.properties.tier === 4)) {
      result.allTier4At = tick;
    }
    if (result.allTier4At !== null && unpaid) result.unpaidAfterAllTier4 = true;

    if (tick % SNAPSHOT_EVERY === 0) result.snapshots.push(s.essencePool[PRIMARY]);
  }
  result.finalTiers = s.graph.getOutgoingEdges(ASC, 'thread').map(e => e.properties.tier as number);
  return result;
}

describe('THR-1747 divine economy ledger (1,080 ticks, no casts)', () => {
  it('Arm A — one thread, no ground: never unpaid, reaches tier 4', () => {
    const r = runArm({ threads: 1, source: false });
    expect(r.everUnpaidThread).toBe(false);
    expect(r.finalTiers).toEqual([4]);
    for (const v of r.snapshots) expect(v).toBeGreaterThan(0);
  });

  it('Arm B — two threads + one consecrated source: nothing unpaid, pool above zero, both tier 4', () => {
    const r = runArm({ threads: 2, source: true });
    expect(r.snapshots).toHaveLength(RUN_TICKS / SNAPSHOT_EVERY);
    for (const v of r.snapshots) expect(v).toBeGreaterThan(0);
    expect(r.everUnpaidThread).toBe(false);
    expect(r.everUnpaidSource).toBe(false);
    expect(r.finalTiers).toEqual([4, 4]);
  });

  it('Arm C — Arm B without the source: once both reach tier 4, a thread goes unpaid (ground is needed)', () => {
    const r = runArm({ threads: 2, source: false });
    expect(r.allTier4At).not.toBeNull();
    expect(r.unpaidAfterAllTier4).toBe(true);
  });

  it('Arm D — two threads held at tier 3, no ground: pool above zero at every snapshot, nothing unpaid', () => {
    const r = runArm({ threads: 2, source: false, capAtTier3: true });
    expect(r.finalTiers).toEqual([3, 3]);
    expect(r.snapshots).toHaveLength(RUN_TICKS / SNAPSHOT_EVERY);
    for (const v of r.snapshots) expect(v).toBeGreaterThan(0);
    expect(r.everUnpaidThread).toBe(false);
  });
});
