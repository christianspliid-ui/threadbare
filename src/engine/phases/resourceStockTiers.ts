/**
 * Phase: Resource Stock Tiers (THR-615) — Mortal Economy P1.
 *
 * Derives a coarse `scarce | adequate | surplus` tier for every resource at every
 * location from supply (quantity) minus local demand (population proxy), stores the
 * tier on each `ResourceInstance` and the aggregate balance on the location, and —
 * for the spotlighted subset — narrates tier crossings and pulls a livelihood thread
 * tug when a bonded mortal's home falls into famine or glut.
 *
 * Runs in the `pre-economy` slot so prosperity reads the fresh `resourceBalance`.
 *
 * NFP compliance:
 * - Tunability: all thresholds/weights are named constants in `resource-classes.ts`.
 * - Inspectability: `resource_stock_tier_change` trace per crossing; DebugPanel economy tab.
 * - Determinism: pure derivation; PRNG only via the chronicle resolver's per-entry seed.
 * - Fail-soft: never throws; missing data → skip; spotlight cap → tier-only coarse update.
 * - Additive: prosperity stays canonical; tiers are additive location/resource properties.
 * - Performance: full-detail work capped at ECON_PHASE_SPOTLIGHT_CAP locations/tick.
 */

import type { GameState, TickEvent } from '../../types/gameState';
import type { ChronicleEntry } from '../../types/narrative';
import type { ThreadTug } from '../../types/attention';
import type { StockTier } from '../../types/resource';
import type { CourtPosition } from '../../types/influence';
import type { TraceEntry, ResourceStockTierChangeTrace } from '../../types/trace';
import type { EnginePhase, PhaseContext, PhaseResult } from '../phaseRegistry';
import { emitTrace } from '../traceBuffer';
import { touchWorld } from '../simulationRuntime';
import { getSublocationsAt } from '../graphQueries';
import { deriveLocationStockTiers, readResources } from '../resourceEconomy';
import { resolveEconomicChronicle } from '../economicChronicle';
import type { EconomicChronicleTrigger } from '../../data/economic-chronicle-content';
import { RESOURCE_DEFINITIONS } from '../../data/resource-content';
import { THREAD_TUG_LINGER } from '../../data/attention-constants';
import {
  getResourceClass,
  ECON_PHASE_SPOTLIGHT_CAP,
  CHRONICLE_MIN_BASE_VALUE,
  LIVELIHOOD_TUG_FAMINE_THREAT,
  LIVELIHOOD_TUG_GLUT_THREAT,
} from '../../data/resource-classes';

/** Tug reach domain — the economy lives under the Gold reach. */
const LIVELIHOOD_TUG_REACH = 'gold' as const;

/** Human-readable resource name, fail-soft to the raw id. */
function resourceName(resourceId: string): string {
  return RESOURCE_DEFINITIONS[resourceId]?.name ?? resourceId;
}

/**
 * Existing active livelihood-tug keys `${agentId}::${resourceId}`, used to avoid
 * re-pulling the same thread every tick while a famine/glut persists.
 */
function livelihoodTugKey(agentId: string, resourceId: string): string {
  return `${agentId}::${resourceId}`;
}

export function phaseResourceStockTiers(state: GameState, ctx: PhaseContext): PhaseResult {
  const { graph, tick } = state;
  const locations = graph.getNodesByType('location');
  if (locations.length === 0) return {};

  // Spotlight ordering: settlements (higher prosperity) get full-detail event
  // emission first; the rest still update tiers but skip crossings/chronicle/tugs.
  // Deterministic: prosperity desc, then id asc (NFP #3).
  const ordered = [...locations].sort((a, b) => {
    const pa = typeof a.properties.prosperity === 'number' ? a.properties.prosperity : -1;
    const pb = typeof b.properties.prosperity === 'number' ? b.properties.prosperity : -1;
    if (pb !== pa) return pb - pa;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });

  const existingTugs: ThreadTug[] = state.activeThreadTugs ?? [];
  // Dedup: skip re-pulling a livelihood thread while its famine/glut persists.
  // Each livelihood tug carries a `${agentId}::${resourceId}` key.
  const activeLivelihoodKeys = new Set<string>();
  for (const t of existingTugs) {
    if (t.expiresTick <= tick) continue;
    const dedup = (t as ThreadTug & { livelihoodKey?: string }).livelihoodKey;
    if (dedup) activeLivelihoodKeys.add(dedup);
  }

  // Precompute the player's bonded mortals grouped by their home *resourced*
  // location (walking sublocation → parent so residents of a settlement's inns
  // and shrines still count as living in that settlement's economy).
  const threadedByLocation = buildThreadedResidentMap(state);

  const newEvents: TickEvent[] = [];
  const newChronicleEntries: ChronicleEntry[] = [];
  const newTugs: ThreadTug[] = [];
  let anyChange = false;
  let tugCounter = 0;

  for (let i = 0; i < ordered.length; i++) {
    const loc = ordered[i];
    const props = loc.properties as Record<string, unknown>;
    const resources = readResources(props);
    if (Object.keys(resources).length === 0) continue;

    const fullDetail = i < ECON_PHASE_SPOTLIGHT_CAP;
    const sublocationCount = getSublocationsAt(graph, loc.id).length;
    const derivation = deriveLocationStockTiers(props, sublocationCount);

    // Store aggregate balance for the prosperity term (read next by phaseProsperity).
    props.resourceBalance = derivation.aggregateBalance;

    // Resolve threaded mortals whose home is this location (full-detail only).
    const threadedHere = fullDetail ? (threadedByLocation.get(loc.id) ?? []) : [];

    for (const [resourceId, instance] of Object.entries(resources)) {
      const derived = derivation.perResource[resourceId];
      if (!derived) continue;
      const prevTier = instance.stockTier;
      const newTier = derived.tier;

      // Persist the tier on the resource instance (graph mutated in place).
      if (prevTier !== newTier) {
        instance.stockTier = newTier;
        anyChange = true;
      }

      const firstDerivation = prevTier === undefined;
      const genuineCrossing = !firstDerivation && prevTier !== newTier;

      if (!fullDetail) continue; // coarse: tier stored, no events

      const cls = getResourceClass(resourceId);
      const isStaple = cls.category === 'staple';

      // ── Livelihood thread tug (state-based, deduped) ──────────────────
      // A bonded mortal's home in famine (scarce staple) or glut (surplus staple)
      // pulls a thread the player can attend. Fires on first derivation too, so an
      // already-starving home surfaces immediately; deduped so it fires once.
      if (isStaple && (newTier === 'scarce' || newTier === 'surplus')) {
        for (const resident of threadedHere) {
          const key = livelihoodTugKey(resident.agentId, resourceId);
          if (activeLivelihoodKeys.has(key)) continue;
          activeLivelihoodKeys.add(key);
          newTugs.push(buildLivelihoodTug(
            resident.agentId, resident.courtPosition, loc.id, resourceId,
            newTier, derived.balance, tick, key, tugCounter++,
          ));
        }
      }

      if (!genuineCrossing) continue; // traces/chronicle only on real crossings

      const emittedTug = isStaple && (newTier === 'scarce' || newTier === 'surplus')
        && threadedHere.length > 0;

      emitTrace({
        category: 'resource_stock_tier_change',
        tick,
        agentId: loc.id,
        summary: `${loc.name}: ${resourceName(resourceId)} ${prevTier} → ${newTier} (balance ${derived.balance.toFixed(2)})`,
        locationId: loc.id,
        resourceId,
        fromTier: prevTier ?? 'unset',
        toTier: newTier,
        balance: derived.balance,
        emittedTug,
      } satisfies Omit<ResourceStockTierChangeTrace, 'id' | 'timestamp'> as Omit<TraceEntry, 'id' | 'timestamp'>);

      // ── Chronicle (Famine/Glut) — staple/strategic, high value only ───
      const chronicleWorthy =
        (cls.category === 'staple' || cls.category === 'strategic') &&
        cls.baseValue >= CHRONICLE_MIN_BASE_VALUE &&
        (newTier === 'scarce' || newTier === 'surplus');
      if (chronicleWorthy) {
        const trigger: EconomicChronicleTrigger =
          newTier === 'scarce' ? 'resource_scarcity' : 'resource_glut';
        const hexCoords = readHexCoords(props);
        const result = resolveEconomicChronicle(
          trigger,
          {
            settlement: loc.name,
            resource: resourceName(resourceId),
            locationId: loc.id,
            hexCoords,
            sphere: cls.primarySphere,
          },
          tick,
          state.seed + hashString(loc.id + resourceId),
        );
        if (result) {
          newEvents.push(result.tickEvent);
          newChronicleEntries.push({
            id: result.chronicleChapter.id,
            tier: 'chronicle',
            title: result.chronicleChapter.title,
            prose: result.chronicleChapter.prose,
            promptContext: {
              actors: result.chronicleChapter.actorIds,
              location: loc.name,
              sphere: cls.primarySphere,
              mood: 'economic',
            },
            tick,
          });
        }
      }
    }
  }

  if (anyChange && ctx.runtime) touchWorld(ctx.runtime);

  const delta: PhaseResult = {};
  if (newEvents.length > 0) delta.tickEvents = [...state.tickEvents, ...newEvents];
  if (newChronicleEntries.length > 0) {
    delta.chronicleEntries = [...state.chronicleEntries, ...newChronicleEntries];
  }
  if (newTugs.length > 0) delta.activeThreadTugs = [...existingTugs, ...newTugs];
  return delta;
}

// ─── Helpers ──────────────────────────────────────────────────────────

interface ThreadedResident {
  agentId: string;
  courtPosition: CourtPosition;
}

/**
 * Group the ascendant's bonded, non-dormant mortals by their home *resourced*
 * location. An agent standing in a sublocation (inn, shrine) is attributed to
 * the parent settlement that owns the terrain and its resources.
 *
 * Fail-soft: missing thread/located_at edges or props → excluded.
 */
function buildThreadedResidentMap(state: GameState): Map<string, ThreadedResident[]> {
  const map = new Map<string, ThreadedResident[]>();
  const threads = state.graph.getOutgoingEdges(state.ascendantId, 'thread');
  for (const thread of threads) {
    const agentId = thread.target;
    const courtPosition = (thread.properties as Record<string, unknown>)
      ?.courtPosition as CourtPosition | undefined;
    if (!courtPosition || (courtPosition as string) === 'dormant') continue;

    const locEdges = state.graph.getOutgoingEdges(agentId, 'located_at');
    if (locEdges.length === 0) continue;
    let homeId = locEdges[0].target;
    const homeNode = state.graph.getNode(homeId);
    const parentId = (homeNode?.properties as Record<string, unknown> | undefined)
      ?.parentLocationId as string | undefined;
    if (parentId) homeId = parentId; // sublocation → parent settlement

    const arr = map.get(homeId) ?? [];
    arr.push({ agentId, courtPosition });
    map.set(homeId, arr);
  }
  return map;
}

/** Construct a livelihood tug that rides the existing thread-tug machinery. */
function buildLivelihoodTug(
  agentId: string,
  courtPosition: CourtPosition,
  locationId: string,
  resourceId: string,
  tier: StockTier,
  balance: number,
  tick: number,
  key: string,
  counter: number,
): ThreadTug & { livelihoodKey: string } {
  return {
    id: `livelihood_tug_${tick}_${counter}`,
    agentId,
    encounterId: `livelihood_${locationId}_${resourceId}_${tier}_${tick}`,
    reachPrimary: LIVELIHOOD_TUG_REACH,
    threatLevel: tier === 'scarce' ? LIVELIHOOD_TUG_FAMINE_THREAT : LIVELIHOOD_TUG_GLUT_THREAT,
    courtPosition,
    createdTick: tick,
    expiresTick: tick + THREAD_TUG_LINGER,
    attended: false,
    curationScore: Math.min(1, Math.abs(balance)),
    // Carry the dedup key so the next tick's phase can skip re-pulling.
    livelihoodKey: key,
  };
}

/** Read hex coordinates from a location's props (fail-soft). */
function readHexCoords(
  props: Record<string, unknown>,
): { col: number; row: number } | undefined {
  const col = props.hexCol;
  const row = props.hexRow;
  if (typeof col === 'number' && typeof row === 'number') return { col, row };
  return undefined;
}

/** Small deterministic string hash for per-entry chronicle seeds. */
function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

// ─── Phase descriptor ─────────────────────────────────────────────────

export const resourceStockTiersPhase: EnginePhase = {
  id: 'resource_stock_tiers',
  slot: 'pre-economy',
  label: 'Resource Stock Tiers',
  run: (state, ctx) => phaseResourceStockTiers(state, ctx),
};
