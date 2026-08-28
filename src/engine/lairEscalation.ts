/**
 * Lair Escalation Phase — TB-M2.5 Phase 2.3575
 *
 * Runs every LAIR_ESCALATION_INTERVAL ticks. For each active lair:
 *   1. Emits sphere pressure to adjacent hexes (environmental feedback loop)
 *   2. Upgrades minor→major lairs after LAIR_UPGRADE_MIN_TICKS (creates named elite)
 *   3. Upgrades major→legendary lairs after LAIR_LEGENDARY_MIN_TICKS (seeds monster faction)
 *   4. Rolls adjacent lair spawning for wilderness/borderland hexes
 *
 * For each cleared lair:
 *   5. Reinfests when sphere pressure is high + no controlling faction + elapsed >= LAIR_REINFESTATION_MIN_TICKS
 *
 * Design doc: .planning/phases/m2.5-monster-encounters/m2.5-02-PLAN.md
 * NFP #1 Tunability: all thresholds are named exports.
 * NFP #2 Inspectability: traces emitted on tier upgrades, reinfestation.
 * NFP #3 Determinism: PRNG seeded from state.seed + state.tick * 71 (unique multiplier).
 * NFP #4 Fail-soft: missing graph data → skip and continue.
 */

import type { GameState } from '../types/gameState';
import type { GraphNode } from '../types/graph';
import type { HexTile, SphereName } from '../types/index';
import type { SpherePressureEvent } from '../types/sphereAffinity';
import { isWaterTerrain } from './coastline';
import { seedMonsterFaction } from './monsterFactionSeed';
import { emitTrace } from './traceBuffer';
import { pickCulturalName } from '../data/culture-name-pools';
import { generateLairName } from './naming/lairNames';
import type { WorldGraph } from './graph';

// ─── Constants (NFP #1: Tunability) ──────────────────────────────────────────

/** How often the lair escalation phase runs (every N ticks) */
export const LAIR_ESCALATION_INTERVAL = 25;

/** Sphere pressure magnitude emitted by each active lair per escalation tick */
export const LAIR_SPHERE_PRESSURE_EMISSION = 8;

/** Minimum sphere score on a hex before a cleared lair can be reinfested */
export const LAIR_SPAWN_SPHERE_THRESHOLD = 60;

/** Minimum ticks after spawnedAtTick before minor lair upgrades to major */
export const LAIR_UPGRADE_MIN_TICKS = 30;

/** Minimum ticks after spawnedAtTick before major lair upgrades to legendary */
export const LAIR_LEGENDARY_MIN_TICKS = 60;

/** Minimum ticks after clearedAtTick before a cleared lair can be reinfested */
export const LAIR_REINFESTATION_MIN_TICKS = 20;

/** Per-eligible-hex probability of spawning an adjacent minor lair each escalation */
export const LAIR_ADJACENT_SPAWN_CHANCE = 0.15;

/** Minimum Manhattan distance between lairs when spawning adjacently */
const ADJACENT_SPAWN_MIN_SEPARATION = 3;

// ─── PRNG (mulberry32 — same pattern as all other engine modules) ─────────────

function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── Hex neighbor offsets (odd-q offset grid) ─────────────────────────────────

/**
 * Get the 6 hex neighbors in odd-q offset coordinate system.
 * Returns {col, row} for each neighbor.
 */
function getHexNeighbors(col: number, row: number): Array<{ col: number; row: number }> {
  // In odd-q offset, the offset shifts on odd columns
  const isOddCol = col % 2 !== 0;
  return isOddCol
    ? [
        { col: col - 1, row: row - 1 },
        { col: col,     row: row - 1 },
        { col: col + 1, row: row - 1 },
        { col: col - 1, row: row },
        { col: col + 1, row: row },
        { col: col,     row: row + 1 },
      ]
    : [
        { col: col - 1, row },
        { col: col + 1, row },
        { col: col,     row: row - 1 },
        { col: col,     row: row + 1 },
        { col: col - 1, row: row + 1 },
        { col: col + 1, row: row + 1 },
      ];
}

// ─── Helper: check for controlling non-monster faction ───────────────────────

/**
 * Check if any non-monster faction controls the given location node.
 * Used to block cleared lair reinfestation when the site is held.
 */
function hasControllingNonMonsterFaction(state: GameState, lairId: string): boolean {
  const { graph } = state;
  // Find all incoming 'controls' edges (source=faction, target=lair)
  const controlEdges = graph.getIncomingEdges(lairId, 'controls');
  for (const edge of controlEdges) {
    const factionNode = graph.getNode(edge.source);
    if (factionNode && !factionNode.properties.isMonsterFaction) {
      return true;
    }
  }
  return false;
}

// ─── Helper: find hex node at (col, row) ──────────────────────────────────────

/**
 * Find the hex location node at the given coordinates.
 * Returns undefined if not found (fail-soft).
 *
 * A generated world contains **no** such nodes — the map is `state.tiles`, and
 * `seedMonsterLairs` reads it directly. So this resolves only in fixtures and in
 * any world that models hexes as an overlay; production callers must treat an
 * undefined result as "no zone overlay here", never as "off the map". Use
 * `findHexTile` for the map itself (THR-995).
 */
function findHexNode(state: GameState, col: number, row: number): GraphNode | undefined {
  const { graph } = state;
  const allLocations = graph.getNodesByType('location');
  return allLocations.find(
    n => n.properties.locationSubtype === 'hex' &&
         n.properties.hexCol === col &&
         n.properties.hexRow === row,
  );
}

/**
 * Find the worldgen tile at the given coordinates — the authoritative map.
 * Returns undefined when the coordinates fall off the grid (fail-soft).
 */
function findHexTile(state: GameState, col: number, row: number): HexTile | undefined {
  return state.tiles?.find(t => t.coord.col === col && t.coord.row === row);
}

// ─── Helper: check if any lair exists within MIN_SEPARATION of a hex ──────────

/**
 * True when some lair other than `excludeLairId` sits within `minDist`
 * (Manhattan, on offset coordinates) of the given hex.
 *
 * `excludeLairId` is load-bearing, not a convenience (THR-995). The separation
 * rule means "not too close to a *different* lair", and the caller asks it about
 * the six neighbours of a lair it is spawning from. Every neighbour sits at
 * `|Δcol| + |Δrow| ∈ {1, 2}` from that source, always under the separation of 3 —
 * so with the source in the list a lair is permanently too close to its own
 * neighbours, the guard fires on all six, and `spawnAdjacentLair` has no
 * reachable call site at all. Pass the source lair's id.
 */
function lairExistsNearby(
  allLairs: GraphNode[],
  col: number,
  row: number,
  minDist: number,
  excludeLairId?: string,
): boolean {
  return allLairs.some(n => {
    if (n.id === excludeLairId) return false;
    const lCol = n.properties.hexCol as number;
    const lRow = n.properties.hexRow as number;
    return Math.abs(col - lCol) + Math.abs(row - lRow) < minDist;
  });
}

// ─── Helper: deterministic hash seed from a string ───────────────────────────

function hashStringSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  }
  return h >>> 0;
}

// ─── Helper: create named elite actor node ────────────────────────────────────

function createNamedElite(state: GameState, lairNode: GraphNode): string {
  const { graph, tick } = state;
  const sphere = lairNode.properties.dominantSphere as SphereName;
  const lairId = lairNode.id;

  // Deterministic name: 'chaos' foundation + lair's dominant sphere, seeded from lairId
  const eliteRng = mulberry32(hashStringSeed(lairId));
  const eliteName = pickCulturalName('chaos', sphere, eliteRng, new Set());

  const eliteId = `elite_${lairId}_${tick}`;
  graph.addNode({
    id: eliteId,
    type: 'actor',
    name: eliteName,
    properties: {
      actorType: 'individual',
      isMonsterElite: true,
      roleLabel: 'Elite',
      dominantSphere: sphere,
      lairId,
      spawnedAtTick: tick,
    },
  });

  // Place elite at the lair location so it enters the encounter decision pipeline
  graph.addEdge({
    id: `${eliteId}_located_at_${lairNode.id}`,
    source: eliteId,
    target: lairNode.id,
    type: 'located_at',
    properties: {},
  });

  return eliteId;
}

// ─── Helper: get sphere score from a hex node ─────────────────────────────────

function getHexSphereScore(hexNode: GraphNode, sphere: SphereName): number {
  const affinity = hexNode.properties.sphereAffinity as
    { scores?: Record<string, number> } | undefined;
  return affinity?.scores?.[sphere] ?? 0;
}

// ─── Helper: spawn a new minor lair at coordinates ───────────────────────────

/**
 * Disambiguates two lairs spawned on the same hex on the same tick.
 *
 * This comment used to read "reset handled by id format", which was false (THR-817):
 * embedding `tick`/`col`/`row` makes the id *readable*, it does not make the counter
 * stop climbing, so a second same-seed run in one process would continue the first
 * run's numbering. Because the id names a **persisted graph node**, the reset belongs
 * at the session boundary rather than per tick, and `resetDecisionCache()` now calls
 * it alongside the other persistent-id counters.
 *
 * The sequence was unreachable when that was written: the separation guard asked
 * `lairExistsNearby` over a list that *included the source lair*, and every hex
 * `getHexNeighbors` returns sits at `|Δcol| + |Δrow| ∈ {1, 2}` — always under the
 * separation of 3 — so a lair was permanently too close to its own neighbours and
 * the loop `continue`d on all six every time. THR-995 fixed that guard (the source
 * is now excluded by id), so the counter is live and this reset is a real repair
 * rather than a defensive one.
 */
let adjacentLairCounter = 0;

/**
 * Names already worn by a lair or a cleared lair anywhere in the world (THR-1312).
 *
 * Both subtypes are read, not just `lair`: a cleared lair keeps the name it was born
 * with, so it is still holding that name against a new spawn. Reading only active
 * lairs would let a freshly-spawned den take the name of the one the player cleared
 * last week — the exact confusion the persistent-name rule exists to prevent.
 */
function existingLairNames(graph: WorldGraph): ReadonlySet<string> {
  const names = new Set<string>();
  for (const node of graph.getNodesByType('location')) {
    const subtype = node.properties.locationSubtype;
    if (subtype !== 'lair' && subtype !== 'cleared_lair') continue;
    if (typeof node.name === 'string' && node.name.length > 0) names.add(node.name);
  }
  return names;
}

/** Reset the adjacent-lair id sequence. Session-boundary seam (see above). */
export function resetAdjacentLairCounter(): void {
  adjacentLairCounter = 0;
}

function spawnAdjacentLair(
  state: GameState,
  col: number,
  row: number,
  dominantSphere: SphereName,
  dangerZone: string,
  terrain: string | undefined,
): void {
  const { graph, tick } = state;

  // Use a timestamp-based ID to ensure uniqueness
  const lairId = `lair_adj_${tick}_${col}_${row}_${adjacentLairCounter++}`;

  // Named on the same terms as a seeded lair (THR-1312). The used-name set is read
  // from the graph rather than carried in a local: this spawns one lair per call
  // across many ticks, so the only durable record of what is already taken is the
  // world itself.
  const lairName = generateLairName({
    lairId,
    terrain,
    dominantSphere,
    usedNames: existingLairNames(graph),
  });

  graph.addNode({
    id: lairId,
    type: 'location',
    name: lairName,
    properties: {
      locationType: 'lair',
      locationSubtype: 'lair',
      terrain,
      hexCol: col,
      hexRow: row,
      lairTier: 'minor',
      dominantSphere,
      spawnedAtTick: tick,
      lastEscalationTick: tick,
      dangerZone,
    },
  });
}

// ─── Main Phase ───────────────────────────────────────────────────────────────

/**
 * phaseLairEscalation — orchestrator phase 2.3575.
 *
 * Mutates `state` in place (same pattern as phaseBattleDetection, phaseFactionAmbitions).
 *
 * Position: after phaseBattleTick (2.357), before phaseArmyNotifications (2.358).
 * This ensures battles at lair hexes resolve before escalation ticks.
 */
export function phaseLairEscalation(state: GameState): void {
  // Guard: only run every LAIR_ESCALATION_INTERVAL ticks
  if (state.tick % LAIR_ESCALATION_INTERVAL !== 0) return;

  // Guard: don't run on tick 0 (game initialization tick)
  if (state.tick === 0) return;

  const { graph, tick, seed } = state;

  // Seeded PRNG: unique multiplier 71 avoids collision with other phases
  const rng = mulberry32(seed + tick * 71);

  // ── Collect all lair and cleared_lair nodes ──────────────────────────────
  const allLairNodes = graph.getNodesByType('location').filter(
    n => n.properties.locationSubtype === 'lair',
  );

  const allClearedLairNodes = graph.getNodesByType('location').filter(
    n => n.properties.locationSubtype === 'cleared_lair',
  );

  // ── Process active lairs ─────────────────────────────────────────────────
  for (const lairNode of allLairNodes) {
    const props = lairNode.properties;
    const lairTier = props.lairTier as 'minor' | 'major' | 'legendary';
    const dominantSphere = props.dominantSphere as SphereName;
    const spawnedAtTick = props.spawnedAtTick as number;
    const hexCol = props.hexCol as number;
    const hexRow = props.hexRow as number;

    // ── 1. Sphere pressure emission ─────────────────────────────────────
    // Push sphere pressure event targeting this lair's location node
    const pressureEvent: SpherePressureEvent = {
      targetEntityId: lairNode.id,
      sphere: dominantSphere,
      magnitude: LAIR_SPHERE_PRESSURE_EMISSION,
      source: 'environmental',
      sourceId: lairNode.id,
    };

    const existing = (state.pendingSpherePressures ?? []) as SpherePressureEvent[];
    (state as Record<string, unknown>).pendingSpherePressures = [
      ...existing,
      pressureEvent,
    ];

    // ── 2. Tier upgrade: minor → major ──────────────────────────────────
    const ticksElapsed = tick - spawnedAtTick;
    if (lairTier === 'minor' && ticksElapsed >= LAIR_UPGRADE_MIN_TICKS) {
      // Create named elite
      const eliteId = createNamedElite(state, lairNode);

      // Update lair node
      graph.updateNode(lairNode.id, {
        properties: {
          ...props,
          lairTier: 'major',
          namedEliteId: eliteId,
          lastEscalationTick: tick,
        },
      });

      emitTrace({
        category: 'faction_ambition',
        summary: `Lair ${lairNode.id} upgraded minor→major, elite ${eliteId} spawned`,
        tick,
      } as Parameters<typeof emitTrace>[0]);

      continue; // Skip legendary check on same tick — upgrade one tier at a time
    }

    // ── 3. Tier upgrade: major → legendary ──────────────────────────────
    if (lairTier === 'major' && ticksElapsed >= LAIR_LEGENDARY_MIN_TICKS) {
      // Seed monster faction
      seedMonsterFaction(state, lairNode, dominantSphere);

      // Get the updated node (seedMonsterFaction may have updated properties)
      const updatedNode = graph.getNode(lairNode.id);
      const updatedProps = updatedNode?.properties ?? props;

      graph.updateNode(lairNode.id, {
        properties: {
          ...updatedProps,
          lairTier: 'legendary',
          lastEscalationTick: tick,
        },
      });

      emitTrace({
        category: 'faction_ambition',
        summary: `Lair ${lairNode.id} upgraded major→legendary, monster faction seeded`,
        tick,
      } as Parameters<typeof emitTrace>[0]);
    }

    // ── 4. Adjacent lair spawning ────────────────────────────────────────
    // Only lairs in wilderness or borderland zones can spawn new lairs
    const dangerZone = props.dangerZone as string;
    if (dangerZone === 'wilderness' || dangerZone === 'borderland') {
      const neighbors = getHexNeighbors(hexCol, hexRow);
      for (const neighbor of neighbors) {
        // Roll for spawn chance
        if (rng() >= LAIR_ADJACENT_SPAWN_CHANCE) continue;

        // Check no *other* lair is too close. The list is re-read from the graph
        // each neighbour on purpose: it must include lairs spawned earlier in
        // this same phase run, so one source cannot pack its own ring.
        if (lairExistsNearby(
          [...allLairNodes, ...graph.getNodesByType('location').filter(n => n.properties.locationSubtype === 'lair')],
          neighbor.col,
          neighbor.row,
          ADJACENT_SPAWN_MIN_SEPARATION,
          lairNode.id,
        )) continue;

        // Check that the neighbour is on the map and is land. `state.tiles` is
        // the authoritative grid — this used to ask the graph for a hex
        // *location node*, of which a generated world has none, so the lookup
        // failed on every neighbour and gave step 4 a second, independent
        // deadness behind the separation guard (THR-995). Water is excluded for
        // the same reason `seedMonsterLairs` excludes it: lairs sit on land.
        const tile = findHexTile(state, neighbor.col, neighbor.row);
        if (!tile) continue;
        if (isWaterTerrain(tile.terrain)) continue;

        // Zone overlay, where one exists. Province roles are a worldgen input and
        // never reach the tick loop, so in a generated world this is absent and
        // the authored "don't push lairs into heartland/capital" rule holds only
        // through the source-zone gate above. Fixtures that model hexes as nodes
        // still get the full check.
        const neighborZone = findHexNode(state, neighbor.col, neighbor.row)
          ?.properties.dangerZone as string | undefined;
        // Spawn in wilderness/borderland only (don't push lairs into heartland/capital)
        const eligibleZone = neighborZone === 'wilderness' || neighborZone === 'borderland'
          || !neighborZone; // Fail-soft: if no zone info, allow spawn

        if (!eligibleZone) continue;

        // Check no existing lair already at this hex
        const existingLairAtHex = allLairNodes.some(
          n => n.properties.hexCol === neighbor.col && n.properties.hexRow === neighbor.row,
        );
        if (existingLairAtHex) continue;

        // Spawn adjacent minor lair. `tile` is already in hand from the land check
        // above, so the namer gets the neighbour's real terrain rather than the
        // source lair's (THR-1312).
        spawnAdjacentLair(state, neighbor.col, neighbor.row, dominantSphere, dangerZone, tile.terrain);
      }
    }
  }

  // ── Process cleared lairs (reinfestation check) ──────────────────────────
  for (const clearedNode of allClearedLairNodes) {
    const props = clearedNode.properties;
    const clearedAtTick = props.clearedAtTick as number | undefined;
    const dominantSphere = props.dominantSphere as SphereName;
    const hexCol = props.hexCol as number;
    const hexRow = props.hexRow as number;

    // Check time elapsed since clearing
    const ticksSinceCleared = tick - (clearedAtTick ?? 0);
    if (ticksSinceCleared < LAIR_REINFESTATION_MIN_TICKS) continue;

    // Check sphere pressure on the hex
    const hexNode = findHexNode(state, hexCol, hexRow);
    const sphereScore = hexNode
      ? getHexSphereScore(hexNode, dominantSphere)
      : 0;

    if (sphereScore < LAIR_SPAWN_SPHERE_THRESHOLD) continue;

    // Check no controlling non-monster faction
    if (hasControllingNonMonsterFaction(state, clearedNode.id)) continue;

    // Reinstate as active lair
    graph.updateNode(clearedNode.id, {
      properties: {
        ...props,
        locationSubtype: 'lair',
        lairTier: 'minor',
        spawnedAtTick: tick,
        lastEscalationTick: tick,
        clearedAtTick: undefined,
        clearedByFactionId: undefined,
        monsterFactionId: undefined,
        namedEliteId: undefined,
      },
    });

    emitTrace({
      category: 'faction_ambition',
      summary: `Cleared lair ${clearedNode.id} reinfested at tick ${tick} (sphere: ${dominantSphere}, score: ${sphereScore})`,
      tick,
    } as Parameters<typeof emitTrace>[0]);
  }
}
