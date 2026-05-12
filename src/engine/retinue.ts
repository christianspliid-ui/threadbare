/**
 * Retinue Data Helpers — Pure functions that extract retinue data from the graph.
 *
 * The retinue is the list of all agents influenced by an ascendant (the player's god),
 * filtered to those with influence tier >= 1.
 */

import type { WorldGraph } from './graph';
import type { AxiologicalProfile } from '../types/agent';
import type { ReachDomain } from '../types/traits';
import type { InfluenceTier, ThreadEdgeProperties, CourtPosition } from '../types/influence';
import { TIER_NAMES } from '../types/influence';
import { getAgentPortraitUrlFromProperties } from '../data/portrait-assets';
import { getAgentFaction } from './graphQueries';
import type { ControlEffect } from '../types/controlEffect';
import type { SphereName } from '../types/index';

/**
 * A single agent in the ascendant's retinue, with extracted data ready for UI rendering.
 */
export interface RetinueAgent {
  /** Agent node ID */
  id: string;

  /** Agent display name */
  name: string;

  /** Current influence tier (1-4, excluding 0) */
  tier: InfluenceTier;

  /** Human-readable tier name (e.g., "Touched", "Devoted") */
  tierName: string;

  /** Location node ID where agent is situated */
  locationId: string;

  /** Location display name */
  locationName: string;

  /** Agent's axiological profile */
  profile: AxiologicalProfile;

  /** Agent's domain capabilities (raw scores) */
  domainCapabilities: Record<ReachDomain, number>;

  /** Faction name if agent is a faction member, null otherwise */
  factionName: string | null;

  /** Agent's narrative archetype ID (e.g., 'tragic_hero', 'seeker') */
  archetypeId: string | null;

  /** Portrait image URL resolved from archetype, or null */
  portraitUrl: string | null;

  /** Agent's primary domain (highest capability) for visual coloring */
  primaryDomain: ReachDomain | null;

  /** Current activity label for sidebar display (e.g., "Idling", "Going to Thornwall", "Explore (2/3)") */
  activityLabel: string;

  /** Court position (the_first, retinue, watched) */
  courtPosition: import('../types/influence').CourtPosition | null;

  /** Attention mode — 'pause' interrupts the game, 'auto_resolve' does not */
  attentionMode: 'pause' | 'auto_resolve';

  /** Thread edge ID — needed for toggling attention mode */
  threadEdgeId: string;
}

/**
 * Query all influenced agents of an ascendant with tier >= 1.
 *
 * Returns agents sorted by:
 * 1. Tier descending (highest influence first)
 * 2. Name ascending (alphabetical as tiebreaker)
 */
export function getRetinueAgents(graph: WorldGraph, ascendantId: string): RetinueAgent[] {
  // Get all outgoing 'thread' edges from the ascendant (god→mortal)
  const threadEdges = graph.getOutgoingEdges(ascendantId, 'thread');

  const retinueAgents: RetinueAgent[] = [];

  for (const edge of threadEdges) {
    const agentId = edge.target;
    const agentNode = graph.getNode(agentId);

    if (!agentNode) continue;

    // Get influence properties from the edge
    const influenceProps = edge.properties as unknown as ThreadEdgeProperties;
    const tier = influenceProps.tier as InfluenceTier;

    // Filter: only include tier >= 1 (exclude tier 0 "Unaware")
    if (tier === 0) continue;

    // Extract agent properties
    const agentProps = agentNode.properties as Record<string, unknown>;
    const profile = agentProps.axiologicalProfile as AxiologicalProfile;
    const domainCapabilities = agentProps.domainCapabilities as Record<ReachDomain, number>;

    // Resolve location via located_at edge (authoritative), fallback to legacy property
    const locEdges = graph.getOutgoingEdges(agentId, 'located_at');
    const locationId = locEdges.length > 0
      ? locEdges[0].target
      : (agentProps.locationId as string | undefined);

    // Look up location name
    let locationName = '(unknown)';
    if (locationId) {
      const locationNode = graph.getNode(locationId);
      if (locationNode) {
        locationName = locationNode.name;
      }
    }

    // Look up faction membership
    const factionName = getAgentFaction(graph, agentId)?.faction.name ?? null;

    // Extract archetype and portrait (agents store archetype as 'narrativeArchetype')
    const archetypeId = (agentProps.narrativeArchetype as string) ?? null;
    const portraitUrl = getAgentPortraitUrlFromProperties(agentProps);

    // Derive primary domain from highest capability
    let primaryDomain: ReachDomain | null = null;
    if (domainCapabilities) {
      let bestValue = -1;
      for (const [domain, value] of Object.entries(domainCapabilities)) {
        if (value > bestValue) {
          bestValue = value;
          primaryDomain = domain as ReachDomain;
        }
      }
    }

    retinueAgents.push({
      id: agentId,
      name: agentNode.name,
      tier,
      tierName: TIER_NAMES[tier],
      locationId: locationId || '(unknown)',
      locationName,
      profile,
      domainCapabilities,
      factionName,
      archetypeId,
      portraitUrl,
      primaryDomain,
      activityLabel: 'Idling',
      courtPosition: (influenceProps.courtPosition as import('../types/influence').CourtPosition) ?? null,
      attentionMode: (influenceProps.attentionMode as 'pause' | 'auto_resolve') ?? 'auto_resolve',
      threadEdgeId: edge.id,
    });
  }

  // Sort: tier descending, then name ascending
  retinueAgents.sort((a, b) => {
    // First by tier descending
    if (a.tier !== b.tier) {
      return b.tier - a.tier;
    }
    // Then by name ascending
    return a.name.localeCompare(b.name);
  });

  return retinueAgents;
}

// ─── ThreadedNodes — Full thread query for all node types ─────────────────────

/**
 * Category of a threaded node — one of 5 displayable entity types.
 */
export type ThreadCategory = 'agent' | 'location' | 'faction' | 'army' | 'artifact';

/**
 * Base fields shared by all threaded node entries.
 */
export interface ThreadedNodeBase {
  id: string;
  name: string;
  tier: InfluenceTier;
  tierName: string;
  category: ThreadCategory;
  threadEdgeId: string;
  attentionMode: 'pause' | 'auto_resolve';
  courtPosition: CourtPosition | null;
  /** Thread bond strength [0,1] — mutated by thread_strengthen/weaken/break effects (THR-116). */
  threadStrength: number;
}

export interface ThreadedAgent extends ThreadedNodeBase {
  category: 'agent';
  locationId: string;
  locationName: string;
  activityLabel: string;
  portraitUrl: string | null;
  primaryDomain: ReachDomain | null;
  factionName: string | null;
  /**
   * Effect id of an active "anoint/install champion" ControlEffect targeting this agent,
   * or null when none. THR-418: surfaces the champion chip in ThreadsPanel.
   */
  championEffectId: string | null;
  /**
   * Template id of the champion ControlEffect (used to pick the badge label). Only
   * meaningful when championEffectId !== null. Null when no champion effect.
   */
  championTemplateId: string | null;
}

export interface ThreadedLocation extends ThreadedNodeBase {
  category: 'location';
  hexCol: number;
  hexRow: number;
  prosperityLabel: string;
  controllingFaction: string | null;
  // THR-401: population health (5-tier text) and divine presence (3-tier text).
  // Time-bounded flags become narrative phrases. All optional + fail-soft.
  populationHealthLabel: string | null;
  divinePresenceLabel: string | null;
  routesCursed: boolean;
  wellsSickened: boolean;
}

export interface ThreadedFaction extends ThreadedNodeBase {
  category: 'faction';
  dominantSphere: string | null;
  territoryCount: number;
  memberCount: number;
}

export interface ThreadedArmy extends ThreadedNodeBase {
  category: 'army';
  size: number;
  objective: string;
  factionName: string | null;
  locationName: string;
}

export interface ThreadedArtifact extends ThreadedNodeBase {
  category: 'artifact';
  bearerName: string | null;
  locationName: string | null;
}

export type ThreadedNode =
  | ThreadedAgent
  | ThreadedLocation
  | ThreadedFaction
  | ThreadedArmy
  | ThreadedArtifact;

/**
 * Resolve the dominant sphere name for a faction from its territory sphere data.
 * Falls back to the faction node's own sphereAlignment or dominantSphere property.
 * Returns null if no sphere data is found.
 */
function resolveFactionDominantSphere(graph: WorldGraph, factionNodeId: string): string | null {
  // Check if the faction node has explicit sphere data
  const factionNode = graph.getNode(factionNodeId);
  if (!factionNode) return null;

  const props = factionNode.properties as Record<string, unknown>;

  // Try direct dominantSphere property
  if (typeof props.dominantSphere === 'string') {
    return props.dominantSphere;
  }

  // Try sphereAlignment (AscendantProperties pattern)
  const sphereAlignment = props.sphereAlignment as Record<string, string> | undefined;
  if (sphereAlignment?.primary) {
    return sphereAlignment.primary;
  }

  // Try sphereAffinity scores — find highest scoring sphere
  const sphereAffinity = props.sphereAffinity as { scores?: Record<string, number> } | undefined;
  if (sphereAffinity?.scores) {
    let bestSphere: string | null = null;
    let bestScore = -1;
    for (const [sphere, score] of Object.entries(sphereAffinity.scores)) {
      if (score > bestScore) {
        bestScore = score;
        bestSphere = sphere;
      }
    }
    if (bestSphere && bestScore > 0) {
      return bestSphere;
    }
  }

  // Aggregate from territory: get outgoing 'controls' edges to location nodes
  const controlsEdges = graph.getOutgoingEdges(factionNodeId, 'controls');
  const sphereTally: Record<string, number> = {};

  for (const edge of controlsEdges) {
    const locNode = graph.getNode(edge.target);
    if (!locNode || locNode.type !== 'location') continue;

    const locProps = locNode.properties as Record<string, unknown>;
    const locSphereAffinity = locProps.sphereAffinity as { scores?: Record<string, number> } | undefined;
    if (!locSphereAffinity?.scores) continue;

    for (const [sphere, score] of Object.entries(locSphereAffinity.scores)) {
      if (score > 0) {
        sphereTally[sphere] = (sphereTally[sphere] ?? 0) + score;
      }
    }
  }

  let dominantSphere: string | null = null;
  let highestTotal = 0;
  for (const [sphere, total] of Object.entries(sphereTally)) {
    if (total > highestTotal) {
      highestTotal = total;
      dominantSphere = sphere;
    }
  }

  return dominantSphere;
}

/**
 * Derive prosperity label from a prosperity score (0-100).
 */
function deriveProsperityLabel(score: unknown): string {
  const num = typeof score === 'number' ? score : 0;
  if (num >= 70) return 'Prosperous';
  if (num >= 40) return 'Stable';
  if (num >= 10) return 'Struggling';
  return 'Destitute';
}

/**
 * Derive a 5-tier human-readable label from populationHealth (0-100). THR-401.
 * Returns null when the property is absent (no UI surface needed).
 */
export function derivePopulationHealthLabel(score: unknown): string | null {
  if (typeof score !== 'number') return null;
  if (score >= 90) return 'Thriving';
  if (score >= 70) return 'Well';
  if (score >= 50) return 'Steady';
  if (score >= 30) return 'Failing';
  return 'Wasting';
}

/**
 * Derive a 3-tier narrative label from divinePresence (0–1). THR-401.
 * Returns null below 0.1 — players shouldn't see a panel field for the
 * untouched default state.
 */
export function deriveDivinePresenceLabel(score: unknown): string | null {
  if (typeof score !== 'number' || score < 0.1) return null;
  if (score >= 0.7) return 'Sacred ground';
  if (score >= 0.4) return 'A presence here';
  return 'Touched by the divine';
}

/**
 * Query all thread targets for an ascendant, categorized by node type.
 *
 * Returns all ThreadedNode entries with tier >= 1, sorted by:
 * 1. Tier descending (highest influence first)
 * 2. Name ascending (alphabetical as tiebreaker)
 *
 * Skips: tier 0, null nodes, god/culture/ascendant actor types, and
 * group actors without armyState.
 *
 * @param controlEffects Optional list of active control effects. When provided, agent
 *   rows are post-decorated with `championEffectId` for matching anoint/install_champion
 *   effects (THR-418). Defaults to [] — agents get null championEffectId, preserving
 *   pre-existing call sites.
 */
export function getThreadedNodes(
  graph: WorldGraph,
  ascendantId: string,
  controlEffects: readonly ControlEffect[] = [],
): ThreadedNode[] {
  const threadEdges = graph.getOutgoingEdges(ascendantId, 'thread');
  const results: ThreadedNode[] = [];

  // Pre-index champion effects by target agent id for O(1) lookup. Only effects
  // owned by this ascendant, active, and using an allowlisted champion template.
  const championByAgent = new Map<string, ControlEffect>();
  for (const effect of controlEffects) {
    if (!effect.active) continue;
    if (effect.ownerId !== ascendantId) continue;
    if (!CHAMPION_TEMPLATE_IDS.includes(effect.templateId)) continue;
    const targetId = effect.targetNodeId;
    if (!targetId) continue;
    // First-write-wins: deterministic on the order of controlEffects (which is
    // appended-in-establishment-order by phaseControlEffects).
    if (!championByAgent.has(targetId)) {
      championByAgent.set(targetId, effect);
    }
  }

  for (const edge of threadEdges) {
    const targetNode = graph.getNode(edge.target);
    if (!targetNode) continue;

    const influenceProps = edge.properties as unknown as ThreadEdgeProperties;
    const tier = influenceProps.tier as InfluenceTier;

    // Exclude tier 0 (unaware)
    if (tier === 0) continue;

    const nodeProps = targetNode.properties as Record<string, unknown>;
    const tierName = TIER_NAMES[tier];
    const attentionMode = (influenceProps.attentionMode as 'pause' | 'auto_resolve') ?? 'auto_resolve';
    const courtPosition = (influenceProps.courtPosition as CourtPosition) ?? null;

    const threadStrength = typeof edge.properties.strength === 'number' ? edge.properties.strength : 1.0;

    const base: ThreadedNodeBase = {
      id: targetNode.id,
      name: targetNode.name,
      tier,
      tierName,
      category: 'agent', // placeholder, overridden per branch
      threadEdgeId: edge.id,
      attentionMode,
      courtPosition,
      threadStrength,
    };

    // ── Classify by node type ──────────────────────────────────────

    if (targetNode.type === 'actor') {
      const actorType = nodeProps.actorType as string;

      if (actorType === 'individual') {
        // Agent
        const locEdges = graph.getOutgoingEdges(targetNode.id, 'located_at');
        const locationId = locEdges.length > 0
          ? locEdges[0].target
          : (nodeProps.locationId as string | undefined);

        let locationName = '(unknown)';
        if (locationId) {
          const locNode = graph.getNode(locationId);
          if (locNode) locationName = locNode.name;
        }

        const factionName = getAgentFaction(graph, targetNode.id)?.faction.name ?? null;

        const portraitUrl = getAgentPortraitUrlFromProperties(nodeProps);

        const domainCapabilities = nodeProps.domainCapabilities as Record<ReachDomain, number> | undefined;
        let primaryDomain: ReachDomain | null = null;
        if (domainCapabilities) {
          let bestValue = -1;
          for (const [domain, value] of Object.entries(domainCapabilities)) {
            if (value > bestValue) {
              bestValue = value;
              primaryDomain = domain as ReachDomain;
            }
          }
        }

        const championEffect = championByAgent.get(targetNode.id) ?? null;

        results.push({
          ...base,
          category: 'agent',
          locationId: locationId || '(unknown)',
          locationName,
          activityLabel: 'Idling',
          portraitUrl,
          primaryDomain,
          factionName,
          championEffectId: championEffect?.effectId ?? null,
          championTemplateId: championEffect?.templateId ?? null,
        } as ThreadedAgent);

      } else if (actorType === 'faction') {
        // Faction
        const controlsEdges = graph.getOutgoingEdges(targetNode.id, 'controls');
        const territoryCount = controlsEdges.filter(e => {
          const n = graph.getNode(e.target);
          return n?.type === 'location';
        }).length;

        const memberEdges = graph.getIncomingEdges(targetNode.id, 'member_of');
        const memberCount = memberEdges.length;

        const dominantSphere = resolveFactionDominantSphere(graph, targetNode.id);

        results.push({
          ...base,
          category: 'faction',
          dominantSphere,
          territoryCount,
          memberCount,
        } as ThreadedFaction);

      } else if (actorType === 'group') {
        // Only include groups with armyState (armies)
        const armyState = nodeProps.armyState as { size?: number; objective?: string } | null | undefined;
        if (!armyState) continue; // skip non-army groups

        const locEdges = graph.getOutgoingEdges(targetNode.id, 'located_at');
        let locationName = '(unknown)';
        if (locEdges.length > 0) {
          const locNode = graph.getNode(locEdges[0].target);
          if (locNode) locationName = locNode.name;
        }

        const memberOfEdges = graph.getOutgoingEdges(targetNode.id, 'member_of');
        let factionName: string | null = null;
        if (memberOfEdges.length > 0) {
          const factionNode = graph.getNode(memberOfEdges[0].target);
          if (factionNode) factionName = factionNode.name;
        }

        results.push({
          ...base,
          category: 'army',
          size: armyState.size ?? 0,
          objective: armyState.objective ?? 'Standing',
          factionName,
          locationName,
        } as ThreadedArmy);

      }
      // Skip god, culture, ascendant actor types

    } else if (targetNode.type === 'location') {
      // Location
      const hexCol = (nodeProps.hexCol as number) ?? 0;
      const hexRow = (nodeProps.hexRow as number) ?? 0;
      const prosperityLabel = deriveProsperityLabel(nodeProps.prosperityScore);

      // Find controlling faction via incoming 'controls' edges from faction actors
      let controllingFaction: string | null = null;
      const controlledByEdges = graph.getIncomingEdges(targetNode.id, 'controls');
      for (const controlEdge of controlledByEdges) {
        const controllerNode = graph.getNode(controlEdge.source);
        if (
          controllerNode?.type === 'actor' &&
          (controllerNode.properties as Record<string, unknown>).actorType === 'faction'
        ) {
          controllingFaction = controllerNode.name;
          break;
        }
      }

      // THR-401: population/presence labels + active narrative flags.
      const populationHealthLabel = derivePopulationHealthLabel(nodeProps.populationHealth);
      const divinePresenceLabel = deriveDivinePresenceLabel(nodeProps.divinePresence);
      const routesCursed = typeof nodeProps.routesCursedUntilTick === 'number';
      const wellsSickened = typeof nodeProps.wellsSickenedUntilTick === 'number';

      results.push({
        ...base,
        category: 'location',
        hexCol,
        hexRow,
        prosperityLabel,
        controllingFaction,
        populationHealthLabel,
        divinePresenceLabel,
        routesCursed,
        wellsSickened,
      } as ThreadedLocation);

    } else if (targetNode.type === 'artifact' || targetNode.type === 'artifact_legendary') {
      // Artifact — find bearer via possesses or bonded_to incoming edges
      let bearerName: string | null = null;
      let locationName: string | null = null;

      const possessesEdges = graph.getIncomingEdges(targetNode.id, 'possesses');
      if (possessesEdges.length > 0) {
        const bearerNode = graph.getNode(possessesEdges[0].source);
        if (bearerNode) bearerName = bearerNode.name;
      }

      if (!bearerName) {
        const bondedEdges = graph.getIncomingEdges(targetNode.id, 'bonded_to');
        if (bondedEdges.length > 0) {
          const bearerNode = graph.getNode(bondedEdges[0].source);
          if (bearerNode) bearerName = bearerNode.name;
        }
      }

      if (!bearerName) {
        // Check located_at for artifact location
        const locEdges = graph.getOutgoingEdges(targetNode.id, 'located_at');
        if (locEdges.length > 0) {
          const locNode = graph.getNode(locEdges[0].target);
          if (locNode) locationName = locNode.name;
        }
      }

      results.push({
        ...base,
        category: 'artifact',
        bearerName,
        locationName,
      } as ThreadedArtifact);

    }
    // Skip other node types (resource, action_template, event, cosmology, region, ambition)
  }

  // Sort: tier descending, then name ascending
  results.sort((a, b) => {
    if (a.tier !== b.tier) return b.tier - a.tier;
    return a.name.localeCompare(b.name);
  });

  return results;
}

/**
 * Group a flat ThreadedNode[] into a Record keyed by ThreadCategory.
 * Each category array maintains the sort order of the input.
 */
export function groupThreadedNodes(nodes: ThreadedNode[]): Record<ThreadCategory, ThreadedNode[]> {
  const groups: Record<ThreadCategory, ThreadedNode[]> = {
    agent: [],
    location: [],
    faction: [],
    army: [],
    artifact: [],
  };
  for (const node of nodes) {
    groups[node.category].push(node);
  }
  return groups;
}

// ─── SustainedControlNodes — THR-418 ──────────────────────────────────────────
//
// Sustained controls are an additional surface in the right-bar threads panel:
// hexes the ascendant holds (claim_dominion etc.), sources they sustain
// (sanctified sublocations), and locations folded in via their existing thread
// row. They are NOT ThreadedNodes — they are control effects (GameState.controlEffects[])
// rendered alongside threads because both answer "what is the god holding right now?".

/**
 * Section a sustained control is rendered under in ThreadsPanel.
 * - `hex`: target is a tile or non-location/sublocation; rendered in the new Hexes section.
 * - `source`: target resolves to a sublocation; rendered in the new Sources section.
 * - `location`: target resolves to a location; folded into the existing Locations section.
 */
export type SustainedControlCategory = 'hex' | 'source' | 'location';

/**
 * Lapse-risk tier for the sustain bar:
 * - `safe`: net flow positive OR runway >= TIGHTENING threshold.
 * - `tightening`: runway between CRITICAL and TIGHTENING.
 * - `critical`: runway < CRITICAL OR (no reserves for a sphere being consumed).
 */
export type LapseRisk = 'safe' | 'tightening' | 'critical';

/**
 * One sustained control effect lifted to a UI-ready shape.
 * Pure data — no React, no DOM. Produced by `getSustainedControlNodes()`.
 */
export interface SustainedControlNode {
  /** Section this row renders under. */
  category: SustainedControlCategory;
  /** ControlEffect.effectId — stable across ticks. */
  effectId: string;
  /** Template id for prose lookup (`SUSTAINED_STATUS_LABELS[templateId][risk]`). */
  templateId: string;
  /** Display name resolved per category — sublocation/location/hex name. */
  displayName: string;
  /** Hex column of the target — always present. */
  hexCol: number;
  /** Hex row of the target — always present. */
  hexRow: number;
  /** Sublocation/location nodeId if the effect targets a specific node. */
  targetNodeId?: string;
  /** Sphere(s) consumed per tick, summed across all spheres. */
  perTickCostTotal: number;
  /** Sphere(s) produced per tick, summed across all spheres. */
  perTickIncomeTotal: number;
  /** Net flow per tick: income − cost. Negative = drain, positive = profit. */
  netFlow: number;
  /** Ticks since `establishedTick`. */
  ticksActive: number;
  /** Risk band for the sustain bar (see LapseRisk doc). */
  lapseRisk: LapseRisk;
  /** Estimated ticks of runway given current reserves, or Infinity if net flow >= 0. */
  runwayTicks: number;
  /** Primary sphere for the row's left border tint, or null if unknowable. */
  primarySphere: SphereName | null;
}

/**
 * Templates whose successful establishment grants champion status to the target agent.
 * Used by `getThreadedNodes` to populate `ThreadedAgent.championEffectId`.
 *
 * Sourced from src/data/unified-action-templates.ts. Two templates today:
 * - `action.anoint-champion` (hyphenated, action-prefixed) — divine anointing.
 * - `hex.install_champion` (underscored, hex-prefixed) — political installation.
 *
 * Note: the plan doc referred to `action.install-champion` but the catalog id is
 * `hex.install_champion`. Using the catalog id is canonical — diverging from the
 * plan because that id is what the engine actually emits. Documented in the THR-418
 * commit body.
 */
export const CHAMPION_TEMPLATE_IDS: readonly string[] = [
  'action.anoint-champion',
  'hex.install_champion',
] as const;

/** Below this many ticks of essence runway, an effect is `critical` (red bar). */
export const SUSTAIN_LAPSE_RISK_CRITICAL_TICKS = 3;
/** Below this many ticks of essence runway, an effect is `tightening` (amber bar). */
export const SUSTAIN_LAPSE_RISK_TIGHTENING_TICKS = 8;
/** Sustain bar fill at safe state (full width). */
export const SUSTAIN_BAR_FULL_FRACTION = 1.0;
/** Sustain bar minimum visible fraction — floor so the bar is still rendered when near-lapsed. */
export const SUSTAIN_BAR_MIN_VISIBLE_FRACTION = 0.08;

// Warn once per session per effectId for missing-node fail-soft (NFP #4).
const _missingNodeWarnedFor = new Set<string>();

/**
 * Compute UI-ready sustained-control rows for the right-bar threads panel.
 *
 * Filters: only effects owned by `ascendantId` and `active === true`.
 *
 * Category classification:
 * - `effect.targetNodeId` resolves to a sublocation node → `source`
 * - `effect.targetNodeId` resolves to a location node → `location`
 * - `effect.targetNodeId` is undefined OR resolves to a non-location/sublocation → `hex`
 *
 * Display name:
 * - source/location: the target node's `name` property
 * - hex: most-prosperous settlement on the hex (tiebreak alphabetical), or `Hex (col, row)` fallback
 *
 * Lapse risk:
 * - `netFlow > 0` → forced `safe`
 * - missing reserves for any sphere with non-zero cost → `critical`
 * - runway < CRITICAL_TICKS → `critical`
 * - runway < TIGHTENING_TICKS → `tightening`
 * - else → `safe`
 *
 * Determinism: pure function, no PRNG. Output sorted deterministically by
 * `(category, ticksActive desc, displayName asc, effectId asc)`.
 *
 * Performance: O(controlEffects × spheres × locationsOnHex). With ~30 effects ×
 * 12 spheres × ~5 locations = ~1800 ops per call, recomputed only when the
 * memo deps change.
 *
 * NFP compliance:
 * - #1 tunability: thresholds in named constants above
 * - #2 inspectability: pure data shape, easy to log via DebugPanel
 * - #3 determinism: no PRNG, stable sort
 * - #4 fail-soft: missing nodes / reserves do not throw
 *
 * @param graph World graph for resolving target nodes and hex display names.
 * @param ascendantId The player's god id; effects with other owners are ignored.
 * @param controlEffects Active and lapsed effects from `GameState.controlEffects[]`.
 *   May be `undefined` to mean "no effects yet" — returns `[]`.
 * @param essenceReserves Current sphere balances. Spheres absent from this map
 *   are treated as 0 reserves (forces critical for effects consuming them).
 *
 * @param currentTick Optional. When provided, used to compute `ticksActive`. When
 *   omitted, falls back to `effect.ticksActive` (which is updated each tick by
 *   `phaseControlEffects`). Pass for fresh-tick UI; omit for tests.
 */
export function getSustainedControlNodes(
  graph: WorldGraph,
  ascendantId: string,
  controlEffects: readonly ControlEffect[] | undefined,
  essenceReserves: Partial<Record<SphereName, number>>,
  currentTick?: number,
): SustainedControlNode[] {
  if (!controlEffects || controlEffects.length === 0) return [];

  const out: SustainedControlNode[] = [];

  for (const effect of controlEffects) {
    if (!effect.active) continue;
    if (effect.ownerId !== ascendantId) continue;

    // ── Resolve target node + category ──
    let category: SustainedControlCategory = 'hex';
    let displayName = '';
    let primarySphere: SphereName | null = null;

    const targetNode = effect.targetNodeId ? graph.getNode(effect.targetNodeId) : null;

    if (effect.targetNodeId && !targetNode) {
      // Fail-soft: target referenced but missing (e.g., node deleted mid-game).
      // Warn once and skip — the effect will eventually lapse via phaseControlEffects.
      if (!_missingNodeWarnedFor.has(effect.effectId)) {
        _missingNodeWarnedFor.add(effect.effectId);
        // eslint-disable-next-line no-console
        console.warn(`[getSustainedControlNodes] effect ${effect.effectId} (${effect.templateId}) references missing node ${effect.targetNodeId} — skipping`);
      }
      continue;
    }

    if (targetNode) {
      // `'sublocation'` is used as a runtime node type literal in some seeded
      // worlds (see `getNodesByType('sublocation')` in simulationRuntime.ts),
      // even though `NodeType` doesn't list it. Cast to string so the
      // comparison narrows correctly at runtime. Other paths also tag location
      // nodes with `locationSubtype: 'sublocation'` on the properties bag —
      // treat that as the same case.
      const typeAsString = targetNode.type as string;
      const subtype = (targetNode.properties as Record<string, unknown>).locationSubtype;
      const isSublocationByType = typeAsString === 'sublocation';
      const isSublocationByProperty =
        typeAsString === 'location' && typeof subtype === 'string' && subtype === 'sublocation';

      if (isSublocationByType || isSublocationByProperty) {
        category = 'source';
        displayName = targetNode.name || '(unnamed source)';
      } else if (typeAsString === 'location') {
        category = 'location';
        displayName = targetNode.name || '(unnamed location)';
      } else {
        // Actor, artifact, or any other type targeted on the hex — treat as hex-level.
        category = 'hex';
        displayName = resolveHexDisplayName(graph, effect.targetHexCol, effect.targetHexRow);
      }
    } else {
      // No targetNodeId → hex-level effect.
      category = 'hex';
      displayName = resolveHexDisplayName(graph, effect.targetHexCol, effect.targetHexRow);
    }

    // ── Cost / income totals ──
    let perTickCostTotal = 0;
    for (const v of Object.values(effect.perTickCost ?? {})) {
      perTickCostTotal += typeof v === 'number' ? v : 0;
    }

    let perTickIncomeTotal = 0;
    for (const v of Object.values(effect.perTickIncome ?? {})) {
      perTickIncomeTotal += typeof v === 'number' ? v : 0;
    }

    const netFlow = perTickIncomeTotal - perTickCostTotal;

    // ── Runway + lapse risk ──
    let runwayTicks = Number.POSITIVE_INFINITY;
    let forceCritical = false;

    for (const [sphereName, costRaw] of Object.entries(effect.perTickCost ?? {})) {
      const sphere = sphereName as SphereName;
      const cost = typeof costRaw === 'number' ? costRaw : 0;
      if (cost <= 0) continue;
      const reserves = essenceReserves[sphere];
      if (typeof reserves !== 'number') {
        forceCritical = true;
        runwayTicks = 0;
        continue;
      }
      const ticksForSphere = reserves / cost;
      if (ticksForSphere < runwayTicks) runwayTicks = ticksForSphere;
    }

    let lapseRisk: LapseRisk;
    if (netFlow > 0) {
      lapseRisk = 'safe';
    } else if (forceCritical || runwayTicks < SUSTAIN_LAPSE_RISK_CRITICAL_TICKS) {
      lapseRisk = 'critical';
    } else if (runwayTicks < SUSTAIN_LAPSE_RISK_TIGHTENING_TICKS) {
      lapseRisk = 'tightening';
    } else {
      lapseRisk = 'safe';
    }

    // ── Primary sphere (for border tint) ──
    // Prefer the income sphere ("what this effect is for"); fall back to dominant cost.
    primarySphere = pickPrimarySphere(effect.perTickCost ?? {}, effect.perTickIncome);

    // ── ticksActive ──
    const ticksActive = typeof currentTick === 'number'
      ? Math.max(0, currentTick - effect.establishedTick)
      : effect.ticksActive;

    out.push({
      category,
      effectId: effect.effectId,
      templateId: effect.templateId,
      displayName,
      hexCol: effect.targetHexCol,
      hexRow: effect.targetHexRow,
      targetNodeId: effect.targetNodeId,
      perTickCostTotal,
      perTickIncomeTotal,
      netFlow,
      ticksActive,
      lapseRisk,
      runwayTicks,
      primarySphere,
    });
  }

  // Deterministic sort: category bucket, then ticksActive desc, displayName asc, effectId asc.
  const categoryOrder: Record<SustainedControlCategory, number> = { hex: 0, source: 1, location: 2 };
  out.sort((a, b) => {
    const c = categoryOrder[a.category] - categoryOrder[b.category];
    if (c !== 0) return c;
    if (a.ticksActive !== b.ticksActive) return b.ticksActive - a.ticksActive;
    const n = a.displayName.localeCompare(b.displayName);
    if (n !== 0) return n;
    return a.effectId.localeCompare(b.effectId);
  });

  return out;
}

/**
 * Pick the primary sphere for a sustained control row's border tint.
 *
 * Order of preference:
 * 1. The single income sphere (if income is present — "what this effect is for")
 * 2. The single cost sphere (when cost is one-sphere)
 * 3. The largest-magnitude cost sphere when multiple
 * 4. `null` if no spheres
 *
 * @internal — exported for testing in retinue.test.ts.
 */
export function pickPrimarySphere(
  cost: Partial<Record<SphereName, number>>,
  income?: Partial<Record<SphereName, number>>,
): SphereName | null {
  if (income) {
    const incomeEntries = Object.entries(income).filter(([, v]) => typeof v === 'number' && v > 0);
    if (incomeEntries.length === 1) return incomeEntries[0][0] as SphereName;
    if (incomeEntries.length > 1) {
      // Pick largest-magnitude income sphere.
      let best: SphereName | null = null;
      let bestVal = -Infinity;
      for (const [s, v] of incomeEntries) {
        if (typeof v === 'number' && v > bestVal) {
          bestVal = v;
          best = s as SphereName;
        }
      }
      if (best) return best;
    }
  }

  const costEntries = Object.entries(cost).filter(([, v]) => typeof v === 'number' && v > 0);
  if (costEntries.length === 0) return null;
  if (costEntries.length === 1) return costEntries[0][0] as SphereName;

  let best: SphereName | null = null;
  let bestVal = -Infinity;
  for (const [s, v] of costEntries) {
    if (typeof v === 'number' && v > bestVal) {
      bestVal = v;
      best = s as SphereName;
    }
  }
  return best;
}

/**
 * Resolve the display name for a hex-level sustained control.
 *
 * Prefers the most-prosperous settlement node on the hex (tiebreak alphabetical).
 * Falls back to `Hex (col, row)` when no settlement exists — never throws.
 */
function resolveHexDisplayName(graph: WorldGraph, col: number, row: number): string {
  const candidates = graph
    .getNodesByType('location')
    .filter((node) => {
      const props = node.properties as Record<string, unknown>;
      return props.hexCol === col && props.hexRow === row;
    });

  if (candidates.length === 0) {
    return `Hex (${col}, ${row})`;
  }

  candidates.sort((a, b) => {
    const aP = (a.properties as Record<string, unknown>).prosperityScore;
    const bP = (b.properties as Record<string, unknown>).prosperityScore;
    const aScore = typeof aP === 'number' ? aP : 0;
    const bScore = typeof bP === 'number' ? bP : 0;
    if (aScore !== bScore) return bScore - aScore;
    return a.name.localeCompare(b.name);
  });

  return candidates[0].name || `Hex (${col}, ${row})`;
}
