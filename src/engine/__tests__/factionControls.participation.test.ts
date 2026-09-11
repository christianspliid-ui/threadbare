/**
 * Participation — every production writer of a faction-sourced `controls` edge bumps
 * (THR-1155 slice 2, § Engine C's last Done-when).
 *
 * The political map is a projection of the `controls` edges Realms hold, cached on
 * `SimulationRuntime` and rebuilt when `structuralCacheVersion` moves. That design has
 * exactly one failure mode: a writer that moves such an edge and forgets
 * `touchStructure`. The fingerprint belt makes the omission *visible* — the next read
 * rebuilds and traces `reason: 'fingerprint'` instead of quietly serving a stale border
 * — but a belt is a diagnosis, not a fix. Something has to enumerate the writers and
 * say each one participates.
 *
 * **The predicate, and its honest shape.** A module qualifies as a *candidate writer*
 * when it carries the `'controls'` literal **and** calls `addEdge`, `retargetEdgeSource`
 * or `removeEdge`. That is deliberately coarser than "writes a faction-sourced controls
 * edge": `removeEdge` takes an edge id, so whether a given call can reach a `controls`
 * edge is not decidable by reading the line. Over-collecting and then *classifying* is
 * the shape that cannot go quietly wrong — a new module that touches edges anywhere near
 * `controls` lands in the inventory below as `unclassified` and fails this test until
 * someone says which kind it is. A narrower regex would have been precise about the
 * sites it happened to match and blind to the one nobody thought of.
 *
 * **What it caught.** `lairEscalation`'s legendary tier upgrade calls
 * `seedMonsterFaction`, which mints a monster faction and writes faction → lair
 * `controls` — a faction-sourced edge, at run time, on a tick phase. Its pass-level bump
 * counted cleared and reinfested lairs only, so a legendary escalation left the border
 * one rebuild late and the belt firing. Conquest was the *second* runtime producer all
 * along; this was the first, and it predates the projection.
 */
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { WorldGraph } from '../graph';
import { phaseLairEscalation, LAIR_ESCALATION_INTERVAL } from '../lairEscalation';
import {
  createSimulationRuntime,
  ensureRealmProjection,
} from '../simulationRuntime';
import { enableTracing, clearTraces, getTraces, disableTracing } from '../traceBuffer';
import type { GameState } from '../../types/gameState';
import type { HexTile } from '../../types';

const ENGINE_DIR = join(process.cwd(), 'src', 'engine');

/**
 * How a candidate module participates. Every member of the scanned set carries one of
 * these, and the reason is the record — a later reader must be able to see *why* a
 * module was let past without re-deriving it.
 */
type Disposition =
  /** Writes a faction-sourced `controls` edge at run time and calls `touchStructure`. */
  | 'bumps'
  /** Writes one only during worldgen, before any projection exists to go stale. */
  | 'worldgen'
  /** Its `controls` writes are sourced from an ascendant or a mortal, never a faction. */
  | 'not-faction-sourced'
  /** Carries the literal and mutates edges, but writes no `controls` edge at all. */
  | 'reads-only';

const INVENTORY: Record<string, { disposition: Disposition; why: string }> = {
  'armySpawning.ts': {
    disposition: 'reads-only',
    why: 'reads a faction\'s held towns to place a host; its addEdge writes commanded_by / member_of',
  },
  'battleAftermath.ts': {
    disposition: 'bumps',
    why: 'applyConquestOrVacuum — the conquest producer; retargets, adds or removes and calls touchStructure on each',
  },
  'battleResolution.ts': {
    disposition: 'reads-only',
    why: 'reads the holder for spotlight selection (the swept controlled_by read); writes no controls edge',
  },
  'cultureGenerator.ts': {
    disposition: 'reads-only',
    why: 'names cultures; the literal appears in a read of who holds a settlement',
  },
  'graphOpExecutor.ts': {
    disposition: 'not-faction-sourced',
    why: 'consecrate_source / claim_source write controls from ctx.actorId — an ascendant or mortal; the generic remove_edge op needs an explicit edgeId and no authored content supplies a faction controls edge',
  },
  'influence.ts': {
    disposition: 'not-faction-sourced',
    why: 'the ascendant home seat writes controls from the ascendant; its removeEdge drops a thread edge',
  },
  'lairEscalation.ts': {
    disposition: 'bumps',
    why: 'the legendary upgrade calls seedMonsterFaction, whose faction -> lair controls edge now rides the pass bump (THR-1155)',
  },
  'monsterFactionSeed.ts': {
    disposition: 'bumps',
    why: 'writes the faction -> lair edge; its two callers are worldgen and lairEscalation, and the latter bumps for it',
  },
  'notableAgendas.ts': {
    disposition: 'reads-only',
    why: 'reads a notable\'s faction holdings; its removeEdge drops sponsors_scheme / hostile_to',
  },
  'orchestrator.ts': {
    disposition: 'reads-only',
    why: 'threads the runtime through the war phases; its own removeEdge calls drop located_at, trades_with, sponsors_scheme and an attachment\'s incoming edges',
  },
  'seedLivingWorld.ts': {
    disposition: 'worldgen',
    why: 'the guild-hall reconciliation drops a Realm\'s redundant edge at seeding, before a runtime exists',
  },
  'siegeResolution.ts': {
    disposition: 'reads-only',
    why: 'reads the besieged town\'s holder for the siege faction set and regional allegiance; writes no controls edge',
  },
  'strategicGraphOps.ts': {
    disposition: 'not-faction-sourced',
    why: 'claimControl / releaseControl ride controlType: strategic from an individual — isAutonomousDecisionActor gates the only live caller to actorType individual, and THR-1448 owns that edge',
  },
  'worldSeed.ts': {
    disposition: 'worldgen',
    why: 'mints every Realm\'s territory at seeding',
  },
};

function collectProductionModules(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry === '__tests__') continue;
      collectProductionModules(full, acc);
      continue;
    }
    if (!entry.endsWith('.ts')) continue;
    if (entry.endsWith('.test.ts')) continue;
    acc.push(full);
  }
  return acc;
}

/** The candidate predicate: names the edge type *and* mutates an edge. */
function isCandidateWriter(source: string): boolean {
  if (!source.includes("'controls'")) return false;
  return /\.addEdge\(/.test(source)
    || /\.retargetEdgeSource\(/.test(source)
    || /\.removeEdge\(/.test(source);
}

function scanCandidates(): string[] {
  return collectProductionModules(ENGINE_DIR)
    .filter(path => isCandidateWriter(readFileSync(path, 'utf8')))
    .map(path => path.slice(ENGINE_DIR.length + 1).replace(/\\/g, '/').split('/').pop() as string)
    .sort();
}

/** A minimal state the escalation phase can run against. */
function makeLairState(graph: WorldGraph, tick: number): GameState {
  return {
    graph,
    tick,
    seed: 42,
    pendingSpherePressures: [],
  } as unknown as GameState;
}

describe('faction `controls` writers all participate (THR-1155)', () => {
  it('every candidate writer under src/engine carries a disposition', () => {
    const unclassified = scanCandidates().filter(file => !(file in INVENTORY));

    // A new module writing edges beside the `controls` literal is a decision someone
    // has to make explicitly. Failing here is the tripwire doing its job, not a bug:
    // classify it in INVENTORY above, and if it writes a faction-sourced edge at run
    // time, make it bump first.
    expect(unclassified).toEqual([]);
  });

  it('the inventory has no entry the scan no longer finds', () => {
    // The other direction — a module that stopped writing edges, or was deleted, leaves
    // a stale exemption behind, and a stale exemption is how a future writer walks in
    // under a name nobody re-checked.
    const found = new Set(scanCandidates());
    const orphans = Object.keys(INVENTORY).filter(file => !found.has(file));
    expect(orphans).toEqual([]);
  });

  it('the scan sees the engine it claims to, and the predicate fires', () => {
    // The vacuous-probe guard. A collector pointed at the wrong directory, or a
    // predicate that never matches, passes both assertions above on an empty set.
    const modules = collectProductionModules(ENGINE_DIR);
    expect(modules.length).toBeGreaterThan(100);

    const candidates = scanCandidates();
    expect(candidates).toContain('battleAftermath.ts');
    expect(candidates).toContain('worldSeed.ts');

    // And a module that does neither half is demonstrably out — otherwise "everything
    // matches" would look the same as "the right things match".
    expect(isCandidateWriter(readFileSync(join(ENGINE_DIR, 'realmProjection.ts'), 'utf8'))).toBe(false);
  });

  it('every module dispositioned `bumps` calls touchStructure', () => {
    const missing = Object.entries(INVENTORY)
      .filter(([, entry]) => entry.disposition === 'bumps')
      .map(([file]) => file)
      // `monsterFactionSeed.ts` is the one that bumps *through its caller*: it is a seed
      // helper with no runtime of its own, and both callers own the bump. Asserted
      // behaviourally below rather than by grep.
      .filter(file => file !== 'monsterFactionSeed.ts')
      .filter(file => !readFileSync(join(ENGINE_DIR, file), 'utf8').includes('touchStructure'));

    expect(missing).toEqual([]);
  });
});

describe('a monster faction taking a lair bumps the structural cache (THR-1155)', () => {
  /**
   * The behavioural half for `lairEscalation` / `monsterFactionSeed` — the pair the
   * inventory says bumps through a caller, which no grep can establish.
   *
   * A legendary escalation writes a faction-sourced `controls` edge. Priming the
   * projection first is what makes the assertion mean something: with the projection
   * already current, the *only* way a later read rebuilds is a version bump the phase
   * made, or the belt catching one it did not. Asserting `version` therefore falsifies
   * to `fingerprint` if the bump is removed — a different value, not a missing one.
   */
  it('traces reason: version rather than the belt\'s fingerprint', () => {
    const graph = new WorldGraph();
    const tick = LAIR_ESCALATION_INTERVAL * 4;
    graph.addNode({
      id: 'lair_0',
      type: 'location',
      name: 'Test Lair',
      properties: {
        locationSubtype: 'lair',
        lairTier: 'major',
        spawnedAtTick: 0,
        lastEscalationTick: 0,
        dominantSphere: 'force',
        hexCol: 1,
        hexRow: 0,
        dangerZone: 'wilderness',
      },
    });
    const tiles: HexTile[] = [0, 1, 2].map(col => ({
      coord: { col, row: 0 },
      geoParams: { elevation: 0.5, temperature: 0.5, moisture: 0.5 },
      terrain: 'grassland',
    }));

    const runtime = createSimulationRuntime();
    const state = makeLairState(graph, tick);

    enableTracing();
    clearTraces();
    try {
      ensureRealmProjection(runtime, graph, tiles, tick);

      phaseLairEscalation(state, runtime);

      // The mint happened — otherwise the bump assertion below would be about nothing.
      const factionId = graph.getNode('lair_0')?.properties.monsterFactionId as string | undefined;
      expect(factionId).toBeTruthy();
      const held = graph.getOutgoingEdges(factionId as string, 'controls');
      expect(held.map(e => e.target)).toEqual(['lair_0']);

      ensureRealmProjection(runtime, graph, tiles, tick);

      const reasons = getTraces()
        .filter(t => t.category === 'realm_projection_rebuilt')
        .map(t => (t as { reason: string }).reason);
      expect(reasons).toEqual(['version', 'version']);
    } finally {
      disableTracing();
    }
  });
});
