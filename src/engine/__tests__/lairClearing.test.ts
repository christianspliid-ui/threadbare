/**
 * Lair clearing — end-to-end on a generated world (THR-1319).
 *
 * These tests deliberately do **not** hand-build a lair fixture. The defect this module
 * closes survived precisely because every existing test set `locationSubtype:
 * 'cleared_lair'` by hand: the reader-side tests all passed while nothing in `src/`
 * outside test fixtures could write that value, and the reinfestation branch they
 * exercised was gated on a hex *node* that no generated world contains. A fixture that
 * supplies both sides of a transition cannot tell you the transition happens.
 *
 * So the world here is the real one — `initializeGameState` + `runTick` — and the
 * cleared state under test is whatever the engine actually produced.
 *
 * The world is built once in `beforeAll` (~46s for 150 ticks) and the single
 * reinfestation pass is driven there too, so the assertions below are order-independent
 * readings of one deterministic run rather than five separate 46-second worlds.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { initializeGameState, MAP_SIZE_PRESETS } from '../gameInit';
import { runTick } from '../orchestrator';
import { createBalancedCosmology } from '../cosmology';
import { generateArchetypes } from '../ascendant';
import { createSimulationRuntime } from '../simulationRuntime';
import { WorldGraph } from '../graph';
import { clearLair } from '../lairClearing';
import {
  phaseLairEscalation,
  LAIR_ESCALATION_INTERVAL,
  LAIR_REINFESTATION_MIN_TICKS,
  LAIR_REINFESTATION_SPHERE_THRESHOLD,
} from '../lairEscalation';
import type { GameState } from '../../types/gameState';
import type { GraphNode } from '../../types/graph';

/** Ticks to run before asserting. Clearing first fires at tick 25 on this seed. */
const RUN_TICKS = 150;
const SEED = 42;
/**
 * The default 5s timeout cannot hold a 150-tick generated world.
 *
 * Measured standalone on `main` (a0e52b8d) 2026-08-29: **45.7s** — three times the
 * "~15s" this budget was originally justified against, because the engine has gained
 * real per-tick work since. The sibling heavy world-build test (`debugTickBatch`)
 * carried the identical stale 180s budget and timed out under CI parallel load,
 * holding two armed PRs red for 526 and 342 minutes (THR-1352, impediment #940).
 * This budget was one engine-fix away from the same failure, so it is recalibrated
 * on the same evidence rather than left to fail next.
 *
 * Re-measure standalone before changing this, and update the figure above with it.
 */
const WORLD_BUILD_TIMEOUT_MS = 420_000;

function lairsOfSubtype(state: GameState, subtype: string): GraphNode[] {
  return state.graph.getNodesByType('location')
    .filter(n => n.properties.locationSubtype === subtype);
}

function sphereScoreOf(node: GraphNode): number {
  const sphere = node.properties.dominantSphere as string;
  const affinity = node.properties.sphereAffinity as
    { scores?: Record<string, number> } | undefined;
  return affinity?.scores?.[sphere] ?? 0;
}

/** A cleared lair as it stood the moment the run ended, before the reinfestation pass. */
interface ClearedSnapshot {
  readonly id: string;
  readonly name: string;
  readonly nameBeforeClearing: string | undefined;
  readonly clearedAtTick: unknown;
  readonly locationType: unknown;
  readonly monsterFactionId: unknown;
  readonly namedEliteId: unknown;
  readonly sphereScore: number;
  readonly held: boolean;
}

let state: GameState;
let clearedSnapshots: ClearedSnapshot[];
let unpressedActiveLairCount: number;

beforeAll(() => {
  const runtime = createSimulationRuntime();
  const archetype = generateArchetypes(4, SEED)[0];
  const preset = MAP_SIZE_PRESETS['medium'];
  state = initializeGameState(
    archetype, 'ClearingTest', createBalancedCosmology(), SEED, preset.cols, preset.rows,
  ).state;

  // Names are captured each tick *before* advancing, so a lair's last name as an active
  // den is known. Read only after the fact, "the name is not a placeholder" would also
  // pass if clearing had quietly re-minted a fresh-but-plausible name.
  const namesBeforeClearing = new Map<string, string>();
  for (let t = 0; t < RUN_TICKS; t++) {
    for (const lair of lairsOfSubtype(state, 'lair')) {
      if (typeof lair.name === 'string') namesBeforeClearing.set(lair.id, lair.name);
    }
    state = runTick(state, [], runtime);
  }

  clearedSnapshots = lairsOfSubtype(state, 'cleared_lair').map(n => ({
    id: n.id,
    name: n.name as string,
    nameBeforeClearing: namesBeforeClearing.get(n.id),
    clearedAtTick: n.properties.clearedAtTick,
    locationType: n.properties.locationType,
    monsterFactionId: n.properties.monsterFactionId,
    namedEliteId: n.properties.namedEliteId,
    sphereScore: sphereScoreOf(n),
    held: state.graph.getIncomingEdges(n.id, 'controls').length > 0,
  }));

  unpressedActiveLairCount = lairsOfSubtype(state, 'lair')
    .filter(n => n.properties.clearingProgress === undefined).length;

  // One reinfestation pass. Only the clock moves — nothing about any lair is touched,
  // because time is the single input reinfestation still needs and a cleared lair
  // accrues no further sphere pressure. Rounded up to the escalation cadence so the
  // phase's own interval guard lets it run.
  const laterTick = (Math.floor((state.tick + LAIR_REINFESTATION_MIN_TICKS)
    / LAIR_ESCALATION_INTERVAL) + 1) * LAIR_ESCALATION_INTERVAL;
  phaseLairEscalation({ ...state, tick: laterTick } as GameState);
}, WORLD_BUILD_TIMEOUT_MS);

describe('lair clearing — a generated world clears lairs', () => {
  it('drives lairs to cleared_lair with a numeric clearedAtTick', () => {
    // The finding this ticket opened on: measured over `src/` excluding `__tests__`,
    // every `cleared_lair` occurrence was a read. Zero here means the writer is gone
    // again and every reader downstream is unreachable once more.
    expect(clearedSnapshots.length).toBeGreaterThan(0);

    for (const lair of clearedSnapshots) {
      // The pairing is the point. A subtype written without a timestamp reads as
      // cleared at tick 0, which makes the lair instantly eligible to reinfest.
      expect(typeof lair.clearedAtTick).toBe('number');
      expect(lair.clearedAtTick as number).toBeGreaterThan(0);
      expect(lair.clearedAtTick as number).toBeLessThanOrEqual(RUN_TICKS);

      // Both fields move together — `HexSidebar` reads either one.
      expect(lair.locationType).toBe('cleared_lair');

      // The den is nobody's now.
      expect(lair.monsterFactionId).toBeUndefined();
      expect(lair.namedEliteId).toBeUndefined();
    }
  });

  it('keeps the name the lair was cleared under (THR-1312)', () => {
    let checked = 0;
    for (const lair of clearedSnapshots) {
      if (lair.nameBeforeClearing === undefined) continue; // cleared before first sample
      expect(lair.name).toBe(lair.nameBeforeClearing);
      expect(lair.name).not.toMatch(/^Lair \d+$/);
      checked++;
    }
    // Guard against the loop passing by never running.
    expect(checked).toBeGreaterThan(0);
  });

  it('leaves lairs nobody is standing on untouched', () => {
    // Lairs far from anyone must show no pressure at all — otherwise the press is not
    // reading presence and clearing would be a global timer wearing a colocation
    // rule's clothes.
    expect(unpressedActiveLairCount).toBeGreaterThan(0);
  });
});

describe('lair reinfestation — reachable from an organically cleared lair', () => {
  it('reinfests cleared lairs that were still steeped when they fell', () => {
    const eligible = clearedSnapshots.filter(
      l => l.sphereScore >= LAIR_REINFESTATION_SPHERE_THRESHOLD && !l.held,
    );

    // Vacuity guard. If a run stops producing deeply-steeped clearings this must fail
    // loudly rather than pass over an empty set — that silent-pass shape is exactly how
    // the original defect stayed invisible behind 27 green tests.
    expect(eligible.length).toBeGreaterThan(0);

    for (const lair of eligible) {
      const after = state.graph.getNode(lair.id);
      expect(after?.properties.locationSubtype).toBe('lair');
      expect(after?.properties.locationType).toBe('lair');
      expect(after?.properties.clearedAtTick).toBeUndefined();
      // The name survives the round trip — cleared, and back again.
      expect(after?.name).toBe(lair.name);
    }
  });

  it('leaves a barely-steeped lair cleared', () => {
    const shallow = clearedSnapshots.filter(
      l => l.sphereScore < LAIR_REINFESTATION_SPHERE_THRESHOLD,
    );
    expect(shallow.length).toBeGreaterThan(0);

    for (const lair of shallow) {
      expect(state.graph.getNode(lair.id)?.properties.locationSubtype).toBe('cleared_lair');
    }
  });
});

/**
 * A unit test of the writer itself, on a two-node graph.
 *
 * Scoped deliberately: it asserts what `clearLair` does when called, not that the world
 * calls it — the suites above own that, on a real world, because that is the claim a
 * fixture cannot make. What this pins is the invariant a future edit could quietly
 * break, namely that subtype and timestamp leave together and the name does not move.
 *
 * It is also the only place `clearedByFactionId` is exercised. The credit path is live
 * but rarely paid in practice: measured on seeds 42 and 99, every mortal standing on a
 * lair hex was unaffiliated, so organic clearings record no faction. That is the
 * designed behaviour, not a gap — an unaffiliated clearing is a real clearing with
 * nobody to credit — but it is why the field has no coverage upstairs.
 */
describe('clearLair — the writer', () => {
  it('pairs subtype with timestamp, credits the faction, and keeps the name', () => {
    const graph = new WorldGraph();
    graph.addNode({
      id: 'lair_x',
      type: 'location',
      name: 'The Choking Snare',
      properties: {
        locationSubtype: 'lair',
        locationType: 'lair',
        lairTier: 'major',
        dominantSphere: 'entropy',
        spawnedAtTick: 0,
        lastEscalationTick: 0,
        dangerZone: 'wilderness',
        hexCol: 4,
        hexRow: 4,
        monsterFactionId: 'faction_monsters',
        namedEliteId: 'elite_lair_x',
        clearingProgress: 7,
      },
    });

    const bare = { graph, tick: 88 } as unknown as GameState;
    clearLair(bare, graph.getNode('lair_x')!, 'faction_civic_guard');

    const after = graph.getNode('lair_x');
    expect(after?.properties.locationSubtype).toBe('cleared_lair');
    expect(after?.properties.locationType).toBe('cleared_lair');
    expect(after?.properties.clearedAtTick).toBe(88);
    expect(after?.properties.clearedByFactionId).toBe('faction_civic_guard');
    expect(after?.properties.monsterFactionId).toBeUndefined();
    expect(after?.properties.namedEliteId).toBeUndefined();
    expect(after?.properties.clearingProgress).toBeUndefined();
    expect(after?.name).toBe('The Choking Snare');
    // Accrued steeping survives — it is what reinfestation reads afterwards.
    expect(after?.properties.dominantSphere).toBe('entropy');
  });
});
