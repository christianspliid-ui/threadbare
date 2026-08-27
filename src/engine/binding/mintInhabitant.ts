/**
 * Born real — the binder's mint path and the valve it passes through (THR-1296 §5).
 *
 * ## The ruling this implements
 *
 * "Minted cast is born as real inhabitants" (THR-1290, ratified 2026-08-26). Today's
 * support mint is not that. The recon (THR-1289) measured what
 * `materializeActorSupport` writes and what it leaves out, and the omissions are not
 * cosmetic:
 *
 * | omitted | consequence |
 * |---|---|
 * | `axiologicalProfile` | invisible to every value-scored system; blank identity forever |
 * | `domainCapabilities` | fails **every** reach floor — cannot act, cannot be scored |
 * | `locationId` | invisible to `buildHexActorIndex` — on the map, not in the index |
 * | `narrativeArchetype`, `cooperationStrategy` | no disposition, no prose voice |
 * | `bornTick`, ambitions | no age, nothing they want; a prop, not a person |
 * | culture-phonetic naming | a verbatim `spawnName` with no provenance |
 *
 * So a minted innkeeper could stand in a tavern and be unable to participate in the
 * scene they were minted for. `mintInhabitant` writes the full birth contract instead,
 * **reusing the existing generators rather than inventing parallel ones** —
 * `generateAxiologicalProfile` (the birth generator), `generateRoleCapabilities` +
 * `ROLE_WEALTH` (the graduation generators, on the scale `computeCapability`'s sigmoid
 * expects), `pickCulturalName`, `assignInitialAmbitions` + `assignAmbitionToActor`.
 * A second copy of any of them would be a generator to keep in step, which is the
 * drift shape this plan refuses everywhere else.
 *
 * ## The valve
 *
 * Mints are **queued, never immediate**. `phaseAgentLifecycle`'s births block drains
 * up to `BINDER_MINT_BUDGET_PER_TICK` per tick, inside the gates that already govern
 * ambient birth — never on a death tick, and counted against the same one-per-tick
 * shape. That is the THR-814/THR-162 lesson made mechanical: an unmetered spawn path
 * is how a large map reached ~1010 agents by tick 72. **The budget is the deliverable.**
 * If mint counts exceed it, the routing is wrong; raising the constant to make the
 * count fit is the failure, not the fix.
 *
 * Queue-before-valve also dissolves the phase-ordering problem: decision runs before
 * lifecycle within a tick, so a request made at tick T is born at T or T+1, and the
 * waiting checkpoint simply binds once the mint exists.
 *
 * ## Determinism
 *
 * The mint's rng is derived from the *request*, `mulberry32(seed + hash(projectId +
 * castKey))` — never from the tick — so who is born cannot depend on **when** the
 * queue happened to drain (NFP #3). A slow tick changes the timing of a birth, never
 * its identity.
 */
import type { GameState } from '../../types/gameState';
import type { WorldGraph } from '../graph';
import type { GraphNode } from '../../types/graph';
import type { ReachDomain } from '../../types/traits';
import type { NpcRole } from '../../types/npc';
import type { SphereName } from '../../types/index';
import type { CultureIdentity, CulturePhoneticSignature } from '../../types/culture';
import type {
  StrategicRuntimeState,
  UndertakingMintRequest,
} from '../../types/strategicAction';
import { NPC_ROLE_REACH_MAP } from '../../types/npc';
import { DEFAULT_REPUTATION } from '../../types/disposition';
import { NARRATIVE_ARCHETYPES } from '../../data/archetype-content';
import { AMBITION_TEMPLATES } from '../../data/ambition-templates';
import { pickCulturalName } from '../../data/culture-name-pools';
import { generateAxiologicalProfile } from '../agentGeneration';
import { generateRoleCapabilities, ROLE_WEALTH, DEFAULT_WEALTH } from '../npcGraduation';
import { assignCooperationStrategy } from '../disposition';
import { assignInitialAmbitions, assignAmbitionToActor } from '../ambitionAssignment';
import { resolveFactionNodeId, joinFaction } from '../factionMembership';
import { resolveToParentLocation } from '../sublocationShape';
import { touchStructure, type SimulationRuntime } from '../simulationRuntime';
import { emitTrace } from '../traceBuffer';
import {
  BINDER_MINT_BUDGET_PER_TICK,
  BINDER_MINT_QUEUE_MAX,
} from '../../data/binder-constants';

// ─── Deterministic ids and streams ──────────────────────────────────

/**
 * The id a mint takes: `mint_<projectId>_<castKey>`.
 *
 * Unique per undertaking *instance* by construction — a project id already is — and
 * seed-deterministic because that id is. Deliberately not the encounter path's
 * `enc_support_<templateId>_<locId>_<key>`, whose reuse across every instance of a
 * template is the intended behaviour there and would be a silent collision here: two
 * undertakings of the same shape would share one person and one binding ledger row.
 */
export function mintNodeId(projectId: string, castKey: string): string {
  return `mint_${projectId}_${castKey}`;
}

function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return h;
}

/** Request-derived, never tick-derived — see the determinism note above. */
function mintRng(seed: number, request: UndertakingMintRequest): () => number {
  return mulberry32(seed + hashString(request.projectId + request.castKey));
}

// ─── The queue ──────────────────────────────────────────────────────

/** The queue, tolerating every shape of absence (NFP #4/#6). */
export function getMintQueue(
  strategicState: StrategicRuntimeState | undefined,
): UndertakingMintRequest[] {
  if (!strategicState) return [];
  if (!strategicState.mintQueue) strategicState.mintQueue = [];
  return strategicState.mintQueue;
}

export type MintEnqueueResult =
  | { readonly queued: true; readonly nodeId: string; readonly alreadyQueued: boolean }
  | { readonly queued: false; readonly reason: 'queue_full' | 'no_state' };

/**
 * Ask the world for a person it does not have.
 *
 * Idempotent per `(projectId, castKey)`: a re-bind of the same slot before the valve
 * comes round finds its own request already waiting rather than queuing a second one.
 * Without that, a checkpoint deferring on `awaiting_mint` every tick would enqueue one
 * request per tick and the budget would be draining a queue it was itself filling.
 */
export function enqueueMint(
  strategicState: StrategicRuntimeState | undefined,
  request: UndertakingMintRequest,
  tick: number,
): MintEnqueueResult {
  if (!strategicState) return { queued: false, reason: 'no_state' };
  const queue = getMintQueue(strategicState);
  const nodeId = mintNodeId(request.projectId, request.castKey);

  const existing = queue.find(
    r => r.projectId === request.projectId && r.castKey === request.castKey,
  );
  if (existing) {
    emitMintTrace(tick, request, 'queued', queue.length, {
      nodeId,
      refusedReason: 'duplicate_request',
    });
    return { queued: true, nodeId, alreadyQueued: true };
  }

  if (queue.length >= BINDER_MINT_QUEUE_MAX) {
    // Fail-soft and loud: the bind refuses rather than the queue growing without
    // bound. A full queue is a routing problem, and it must be visible as one.
    emitMintTrace(tick, request, 'refused', queue.length, { refusedReason: 'queue_full' });
    return { queued: false, reason: 'queue_full' };
  }

  queue.push(request);
  emitMintTrace(tick, request, 'queued', queue.length, { nodeId });
  return { queued: true, nodeId, alreadyQueued: false };
}

/** Is this slot's person already born? The question a deferred checkpoint asks. */
export function isMintReady(
  graph: WorldGraph,
  projectId: string,
  castKey: string,
): boolean {
  return graph.getNode(mintNodeId(projectId, castKey)) !== undefined;
}

// ─── The birth ──────────────────────────────────────────────────────

/** Where a mint is born, and which place tier owns its culture. */
interface Placement {
  readonly placementId: string;
  readonly parentPlaceId: string;
}

function resolvePlacement(graph: WorldGraph, request: UndertakingMintRequest): Placement | null {
  const node = graph.getNode(request.placementNodeId);
  if (!node) return null;
  // A sublocation stage places the mint *in* the sublocation (a clerk stands in the
  // counting-house, not vaguely in the town), while culture and faction come from the
  // place tier above — which is where they are actually recorded. `parentLocationId`
  // is the sublocation discriminator (THR-1183); asked through the shape helper, never
  // hand-rolled.
  const parent = resolveToParentLocation(graph, node);
  return { placementId: node.id, parentPlaceId: parent?.id ?? node.id };
}

function locationCulture(
  graph: WorldGraph,
  locationId: string,
): { id: string; node: GraphNode } | null {
  const edges = graph.getOutgoingEdges(locationId, 'belongs_to');
  const current = edges.find(e => (e.properties.cultureLayer as string | undefined) === 'current');
  const chosen = current ?? edges[0];
  if (!chosen) return null;
  const node = graph.getNode(chosen.target);
  return node ? { id: node.id, node } : null;
}

function dominantSphere(locNode: GraphNode | undefined, fallback: SphereName): SphereName {
  const influence = (locNode?.properties?.sphereInfluence ?? {}) as Record<string, number>;
  let best: SphereName | null = null;
  let max = 0;
  for (const [sphere, value] of Object.entries(influence)) {
    if (value > max) { max = value; best = sphere as SphereName; }
  }
  return best ?? fallback;
}

export interface MintOutcome {
  readonly nodeId: string;
  readonly reused: boolean;
}

/**
 * Bear one queued inhabitant into the world, fully formed.
 *
 * Fail-soft (NFP #4): a vanished placement returns null and traces the refusal; a
 * throw anywhere inside is caught and traced rather than reaching the tick loop.
 * Idempotent — a request whose node already exists returns it rather than writing a
 * second one, which is what makes a replayed drain harmless.
 */
export function mintInhabitant(
  state: GameState,
  request: UndertakingMintRequest,
  runtime?: SimulationRuntime,
): MintOutcome | null {
  const graph = state.graph;
  const nodeId = mintNodeId(request.projectId, request.castKey);

  const existing = graph.getNode(nodeId);
  if (existing) return { nodeId, reused: true };

  const placement = resolvePlacement(graph, request);
  if (!placement) {
    // The stage went away between the request and the valve — a razed sublocation,
    // a dissolved camp. Not an error; the bind pass re-decides against the world as
    // it now is.
    emitMintTrace(state.tick, request, 'refused', getMintQueue(state.strategicState).length, {
      refusedReason: 'placement_missing',
    });
    return null;
  }

  try {
    const rng = mintRng(state.seed, request);
    const role = request.role;
    const affinity = NPC_ROLE_REACH_MAP[role as NpcRole];
    const parentNode = graph.getNode(placement.parentPlaceId);
    const culture = locationCulture(graph, placement.parentPlaceId);

    const identity = culture?.node.properties?.cultureIdentity as CultureIdentity | undefined;
    const signature = culture?.node.properties?.culturePhoneticSignature as
      CulturePhoneticSignature | undefined;

    // An authored `spawnName` still wins — a template that named its ghost gets its
    // ghost. Absent one, the name comes from the place's own culture rather than
    // from a hardcoded string with no provenance.
    const name = request.spawnName ?? pickCulturalName(
      identity?.foundationBias ?? '',
      identity?.veneratedSpheres?.[0] ?? '',
      rng,
      new Set<string>(),
      signature,
      culture?.id,
      state.tick,
    );

    const archetype = NARRATIVE_ARCHETYPES[Math.floor(rng() * NARRATIVE_ARCHETYPES.length)];
    const axiologicalProfile = generateAxiologicalProfile(rng, state.cosmology);

    // Born to the requirement (§2): the mint row scores identity at 1 because the
    // person it promises does satisfy the slot. Stamped past the bar rather than at
    // it — a value exactly on a threshold is a coin-flip against float error, and the
    // whole point of minting is that this one is not in doubt.
    const req = request.identityRequirement;
    if (req) {
      const magnitude = Math.min(1, Math.max(0.1, req.minStrength * 2) + 0.2);
      axiologicalProfile[req.axis] = req.pole === 'virtue' ? magnitude : -magnitude;
    }

    const cooperationStrategy = assignCooperationStrategy(
      archetype?.id ?? 'wanderer',
      axiologicalProfile,
      rng,
    );
    const domainCapabilities = generateRoleCapabilities(rng, affinity, 'notable');

    graph.addNode({
      id: nodeId,
      type: 'actor',
      name,
      properties: {
        actorType: 'individual',
        // Explicit, never inferred: absence of `spotlightTier` reads as `'spotlight'`
        // downstream, so an omitted tier quietly grants a support NPC full fidelity.
        spotlightTier: 'ambient',
        npcRole: role,
        axiologicalProfile,
        domainCapabilities,
        // The `located_at` edge AND the denormalized field: `buildHexActorIndex` reads
        // the property, so an edge-only mint is on the map and absent from the index.
        locationId: placement.placementId,
        narrativeArchetype: archetype?.id ?? 'wanderer',
        cooperationStrategy,
        wealth: ROLE_WEALTH[role] ?? DEFAULT_WEALTH,
        reputationScore: DEFAULT_REPUTATION,
        importance: 0,
        bornTick: state.tick,
        sphereAffinity: null,
        // Provenance, so "where did this person come from?" is answerable from the
        // node alone — the question the support bundle's anonymous mints cannot answer.
        generatedBy: 'undertaking_binder',
        mintedForProjectId: request.projectId,
        mintedForCastKey: request.castKey,
      },
    });

    graph.addEdge({
      id: `${nodeId}_located_at_${placement.placementId}`,
      source: nodeId,
      target: placement.placementId,
      type: 'located_at',
      properties: {},
    });

    if (culture) {
      graph.addEdge({
        id: `edge_culture_${nodeId}_${culture.id}`,
        source: nodeId,
        target: culture.id,
        type: 'belongs_to',
        // `culturalStrength` is the key every reader actually reads
        // (`getActorCultures`, `culturalProse`, `culturalTension`, `culturalTraits`).
        // The births block writes `strength` instead and its newborns read as
        // culture-less — a live defect this path does not inherit.
        properties: { culturalStrength: 1.0 },
      });
    }

    if (request.factionDefId) {
      const factionNodeId = resolveFactionNodeId(graph, request.factionDefId, nodeId);
      // Through the membership helper, never a raw `member_of` write: `rank` is a 0–1
      // scale and the helper is the one place that knows it.
      if (factionNodeId) joinFaction(graph, nodeId, factionNodeId, state.tick);
    }

    // Something to want. `assignInitialAmbitions` selects; `assignAmbitionToActor`
    // writes — the extracted single writer (THR-885), so a binder-minted ambition and
    // a world-minted one are byte-identical on the graph.
    const snapshot = {
      domainCapabilities: domainCapabilities as Record<ReachDomain, number>,
      traits: [] as string[],
      culturalSpheres: culture
        ? [dominantSphere(parentNode, 'order' as SphereName)]
        : [],
      bonds: [] as { bondType: string }[],
    };
    const assignments = assignInitialAmbitions(
      AMBITION_TEMPLATES,
      snapshot,
      state.seed + hashString(nodeId),
    );
    for (const assignment of assignments) {
      assignAmbitionToActor(graph, nodeId, assignment.templateId, state.tick, {
        priority: assignment.priority,
        mintedByLabel: 'undertaking_binder',
      });
    }

    // The world's shape changed: a new actor invalidates the encounter cache, the
    // distance matrix, and the UI's structural memo. Neither existing mint path
    // touches anything, which is why a support NPC could be minted and stay invisible
    // to every structural consumer until something else happened to bump the version.
    if (runtime) touchStructure(runtime);

    const waitedTicks = Math.max(0, state.tick - request.requestedAtTick);
    emitMintTrace(state.tick, request, 'minted', getMintQueue(state.strategicState).length, {
      nodeId,
      waitedTicks,
    });

    return { nodeId, reused: false };
  } catch {
    emitMintTrace(state.tick, request, 'refused', getMintQueue(state.strategicState).length, {
      nodeId,
      refusedReason: 'mint_error',
    });
    return null;
  }
}

// ─── The valve ──────────────────────────────────────────────────────

export interface MintDrainResult {
  readonly minted: string[];
  readonly remaining: number;
}

/**
 * Drain up to `budget` queued mints. Called from `phaseAgentLifecycle`'s births block.
 *
 * A request that cannot be born right now (its placement is gone) is **dropped**
 * rather than retried forever: the bind pass re-decides against the world as it is,
 * and a request that can never succeed must not occupy the budget every tick from
 * here to the end of the run.
 */
export function drainMintQueue(
  state: GameState,
  runtime?: SimulationRuntime,
  budget: number = BINDER_MINT_BUDGET_PER_TICK,
): MintDrainResult {
  const queue = getMintQueue(state.strategicState);
  const minted: string[] = [];
  if (queue.length === 0) return { minted, remaining: 0 };

  let attempts = 0;
  while (minted.length < budget && queue.length > 0 && attempts < BINDER_MINT_QUEUE_MAX) {
    attempts++;
    const request = queue.shift();
    if (!request) break;
    const outcome = mintInhabitant(state, request, runtime);
    // A dropped request (`null`) does not consume the budget — the world simply could
    // not bear that one, and the next request in line deserves this tick's slot.
    if (outcome) minted.push(outcome.nodeId);
  }

  return { minted, remaining: queue.length };
}

// ─── Tracing ────────────────────────────────────────────────────────

function emitMintTrace(
  tick: number,
  request: UndertakingMintRequest,
  outcome: 'queued' | 'minted' | 'refused',
  queueDepth: number,
  extra: {
    nodeId?: string;
    refusedReason?: 'queue_full' | 'placement_missing' | 'duplicate_request' | 'mint_error';
    waitedTicks?: number;
  } = {},
): void {
  emitTrace({
    category: 'binder_mint',
    tick,
    projectId: request.projectId,
    castKey: request.castKey,
    outcome,
    role: request.role,
    placementNodeId: request.placementNodeId,
    queueDepth,
    ...(extra.nodeId ? { nodeId: extra.nodeId } : {}),
    ...(extra.refusedReason ? { refusedReason: extra.refusedReason } : {}),
    ...(extra.waitedTicks !== undefined ? { waitedTicks: extra.waitedTicks } : {}),
    summary:
      `binder mint ${outcome}: ${request.castKey}@${request.projectId} ` +
      `(${request.role}${extra.refusedReason ? `, ${extra.refusedReason}` : ''}, ` +
      `queue ${queueDepth})`,
  });
}
