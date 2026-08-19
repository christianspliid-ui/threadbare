/**
 * Edge Schema Registry — runtime schema for graph edge types.
 *
 * Defines source/target node type constraints, directionality, cardinality,
 * required properties, and human-readable descriptions for every EdgeType.
 *
 * Used by:
 * - dev-mode validated addEdge (warns on constraint violations)
 * - validateAgentIntegrity (checks edge source/target types)
 * - documentation (single source of truth for edge semantics)
 */

import type { EdgeType, NodeType } from './graph';

// ─── Constants ────────────────────────────────────────────────────

/** Enable/disable dev-mode schema validation in addEdge */
export const GRAPH_SCHEMA_VALIDATION_ENABLED = true;

/** If true, throw on unknown edge types; if false, warn only */
export const GRAPH_SCHEMA_THROW_ON_UNKNOWN = false;

// ─── Types ────────────────────────────────────────────────────────

export interface EdgeSchema {
  type: EdgeType;
  /** Node type(s) allowed as edge source */
  sourceNodeType: NodeType | NodeType[];
  /** Node type(s) allowed as edge target */
  targetNodeType: NodeType | NodeType[];
  /** Directed = source→target has semantic meaning; bidirectional = both directions equivalent */
  direction: 'directed' | 'bidirectional';
  /** Cardinality constraint (documentation, not enforced at runtime) */
  cardinality: 'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many';
  /** Properties that must be present on the edge */
  requiredProperties: string[];
  /** Human-readable description of the edge's purpose and direction */
  description: string;
}

// ─── Schema Registry ──────────────────────────────────────────────

export const EDGE_SCHEMA: Record<EdgeType, EdgeSchema> = {
  // ── Structural ──────────────────────────────────────────────
  contains: {
    type: 'contains',
    sourceNodeType: ['region', 'location'],
    targetNodeType: ['location', 'sublocation'],
    direction: 'directed',
    cardinality: 'one-to-many',
    requiredProperties: [],
    description: 'Spatial containment. Region→locations, location→sub-locations. NOT for actors — use located_at.',
  },
  adjacent: {
    type: 'adjacent',
    sourceNodeType: ['location', 'region'],
    targetNodeType: ['location', 'region'],
    direction: 'bidirectional',
    cardinality: 'many-to-many',
    requiredProperties: [],
    description: 'Hex/region adjacency for pathfinding and spatial queries.',
  },

  // ── Trait ───────────────────────────────────────────────────
  has_trait: {
    type: 'has_trait',
    sourceNodeType: ['actor', 'location', 'sublocation'],
    targetNodeType: 'trait',
    direction: 'directed',
    cardinality: 'many-to-many',
    requiredProperties: [],
    description: 'Actor, location, or sublocation has a trait. Edge properties: level, tick, decay, appliedAt, ticksRemaining, durationTicks, intensity, sourceEncounterId. ticksRemaining is the live countdown decayConditions decrements (absent = never expires); durationTicks is the authored total kept as provenance (THR-761).',
  },

  // ── Companions (THR-1096) ──────────────────────────────────
  accompanies: {
    type: 'accompanies',
    sourceNodeType: 'actor',
    targetNodeType: 'companion',
    direction: 'directed',
    // One-to-many from the bearer's side; a companion has exactly one bearer,
    // enforced at mint by `mintCompanion` rather than by the schema.
    cardinality: 'one-to-many',
    requiredProperties: ['sinceTick', 'source'],
    description: 'Bearer (actor) is accompanied by a companion. Edge properties: sinceTick, source, and — for contracted companions only — ticksRemaining/totalTicks, which expireCompanions counts down (absent = stays until a story removes them).',
  },

  // ── Possession ─────────────────────────────────────────────
  possesses: {
    type: 'possesses',
    sourceNodeType: 'actor',
    targetNodeType: 'artifact',
    direction: 'directed',
    cardinality: 'many-to-many',
    requiredProperties: [],
    description: 'Actor possesses a common artifact.',
  },
  bonded_to: {
    type: 'bonded_to',
    sourceNodeType: 'actor',
    targetNodeType: 'artifact_legendary',
    direction: 'directed',
    cardinality: 'one-to-one',
    requiredProperties: [],
    description: 'Actor is bonded to a legendary artifact (exclusive bond).',
  },
  controls: {
    type: 'controls',
    sourceNodeType: 'actor',
    targetNodeType: ['resource', 'location'],
    direction: 'directed',
    cardinality: 'many-to-many',
    requiredProperties: [],
    description: 'Faction/actor controls a resource or location (jurisdiction).',
  },

  // ── Social ─────────────────────────────────────────────────
  relates_to: {
    type: 'relates_to',
    sourceNodeType: 'actor',
    targetNodeType: 'actor',
    direction: 'directed',
    cardinality: 'many-to-many',
    requiredProperties: [],
    description: 'Inter-actor relationship bond. Edge properties: sentiment, trust, strength, basis.',
  },
  hostile_to: {
    type: 'hostile_to',
    sourceNodeType: 'actor',
    targetNodeType: 'actor',
    direction: 'directed',
    cardinality: 'many-to-many',
    requiredProperties: [],
    description: 'Faction/actor is hostile toward an excommunicated or rival actor. Created by excommunicate action.',
  },
  member_of: {
    type: 'member_of',
    sourceNodeType: 'actor',
    targetNodeType: 'actor',
    direction: 'directed',
    cardinality: 'many-to-many',
    requiredProperties: ['role', 'rank', 'joinedTick'],
    description: 'Individual/group is member of faction/group. Source = member, target = faction.',
  },
  belongs_to: {
    type: 'belongs_to',
    // THR-1177: `region` added. This is the one family with measured runtime violations
    // — 18 of 315 in a seed-42/medium/120-tick world, every one of them region→culture
    // from `historicalCulture.ts:206-213`, which is deliberate and documented. The
    // defect was schema drift, not the writer: enforcing the old row would have refused
    // valid worldgen edges on day one.
    sourceNodeType: ['actor', 'location', 'region'],
    targetNodeType: 'actor',
    direction: 'directed',
    cardinality: 'many-to-many',
    requiredProperties: [],
    description: 'Actor/location/region belongs to a culture. Edge properties: culturalStrength, cultureLayer.',
  },
  thread: {
    type: 'thread',
    sourceNodeType: 'actor',
    targetNodeType: ['actor', 'location', 'artifact', 'artifact_legendary'],
    direction: 'directed',
    cardinality: 'one-to-many',
    requiredProperties: [],
    description: 'Divine thread from ascendant to any invested node. Source = ascendant, target = mortal agent, location, faction, army, or artifact. The god reaches down and invests divine attention.',
  },
  aspect_of: {
    type: 'aspect_of',
    sourceNodeType: 'actor',
    targetNodeType: 'actor',
    direction: 'directed',
    cardinality: 'one-to-many',
    requiredProperties: ['attainedTick', 'originEncounterId', 'sourceTier', 'survivesDeath'],
    description: 'Apex milestone from ascendant to mortal (THR-479). The mortal has become a partial aspect of the god — beyond the five Influence tiers, not a sixth rung. Permanent and never garbage-collected; survives the mortal\'s death as a mythic echo (mythicEcho=true). Properties: attainedTick, originEncounterId, sourceTier, survivesDeath, mythicEcho?, echoedTick?.',
  },
  mentors: {
    type: 'mentors',
    sourceNodeType: 'actor',
    targetNodeType: 'actor',
    direction: 'directed',
    cardinality: 'many-to-many',
    requiredProperties: ['domain', 'progress', 'phase', 'startedTick', 'lessonsCompleted', 'bondQuality'],
    description: 'Mentor → apprentice training relationship (THR-75). One active mentor↔apprentice pairing at a time per agent, but graduated/estranged historical edges persist. Properties: domain (ReachDomain), progress (0-1), phase (offered|training|graduated|estranged), startedTick, lessonsCompleted, bondQuality (-1..1), initiativeId, severedByDivineWill.',
  },

  // ── Enchantment (RESERVED — not yet implemented) ───────────
  enchanted: {
    type: 'enchanted',
    sourceNodeType: 'actor',
    targetNodeType: ['actor', 'location', 'artifact', 'artifact_legendary'],
    direction: 'directed',
    cardinality: 'many-to-many',
    requiredProperties: [],
    description: 'RESERVED: Caster → target enchantment. Not yet implemented.',
  },
  warded: {
    type: 'warded',
    sourceNodeType: 'location',
    targetNodeType: 'location',
    direction: 'directed',
    cardinality: 'many-to-many',
    requiredProperties: [],
    description: 'RESERVED: Ritual site → location ward. Not yet implemented.',
  },
  cursed: {
    type: 'cursed',
    sourceNodeType: 'actor',
    targetNodeType: ['actor', 'location', 'artifact', 'artifact_legendary'],
    direction: 'directed',
    cardinality: 'many-to-many',
    requiredProperties: [],
    description: 'RESERVED: Source → target curse. Not yet implemented.',
  },
  blessed: {
    type: 'blessed',
    sourceNodeType: 'actor',
    targetNodeType: ['actor', 'location', 'artifact', 'artifact_legendary'],
    direction: 'directed',
    cardinality: 'many-to-many',
    requiredProperties: [],
    description: 'RESERVED: Source → target blessing. Not yet implemented.',
  },

  // ── Location ───────────────────────────────────────────────
  located_at: {
    type: 'located_at',
    sourceNodeType: 'actor',
    // THR-1177: `sublocation` added. The three-tier position model (hex → location →
    // sublocation) makes a sublocation target contract-legal, but the row declared
    // location-only. It produced zero violations in the 120-tick measurement because
    // the canonical writer (`sublocation.ts`) mints sublocations as `location` nodes —
    // the latent half is `strategicGraphOps.createSublocation`, which mints
    // `type: 'sublocation'` and simply did not fire in that run. Left unwidened, the
    // chokepoint below would refuse a legal position edge the first time it did.
    targetNodeType: ['location', 'sublocation'],
    direction: 'directed',
    cardinality: 'many-to-many',
    requiredProperties: [],
    description: 'Actor is physically at this location or sublocation. Source = actor, target = the most specific node they occupy.',
  },
  avatar_of: {
    type: 'avatar_of',
    sourceNodeType: 'actor',
    targetNodeType: 'actor',
    direction: 'directed',
    cardinality: 'many-to-one',
    requiredProperties: [],
    description: 'Avatar → ascendant link. Source = avatar, target = ascendant.',
  },

  // ── Action ─────────────────────────────────────────────────
  performing: {
    type: 'performing',
    sourceNodeType: 'actor',
    targetNodeType: 'action_template',
    direction: 'directed',
    cardinality: 'one-to-one',
    requiredProperties: [],
    description: 'Actor is currently performing this action.',
  },

  // ── Cosmology ──────────────────────────────────────────────
  aligned_with: {
    type: 'aligned_with',
    sourceNodeType: ['actor', 'location'],
    targetNodeType: 'cosmology',
    direction: 'directed',
    cardinality: 'many-to-many',
    requiredProperties: [],
    description: 'Actor or location is aligned with a cosmological sphere.',
  },
  sphere_influence: {
    type: 'sphere_influence',
    sourceNodeType: ['actor', 'location'],
    targetNodeType: 'cosmology',
    direction: 'directed',
    cardinality: 'many-to-many',
    requiredProperties: [],
    description: 'Sphere influence tracking on location/actor (weight/dominance).',
  },

  // ── Ambition ───────────────────────────────────────────────
  pursues: {
    type: 'pursues',
    sourceNodeType: 'actor',
    targetNodeType: 'ambition',
    direction: 'directed',
    cardinality: 'many-to-many',
    requiredProperties: [],
    description: 'Actor is pursuing this ambition. Edge properties: priority, status, milestones.',
  },

  // ── Infrastructure ─────────────────────────────────────────
  road: {
    type: 'road',
    sourceNodeType: 'location',
    targetNodeType: 'location',
    direction: 'directed',
    cardinality: 'many-to-many',
    requiredProperties: [],
    description: 'Road/trail between locations. Edge properties: roadType, hexPath, totalCost, pathLength.',
  },

  // ── Encounter ──────────────────────────────────────────────
  encounter_at: {
    type: 'encounter_at',
    sourceNodeType: 'action_template',
    targetNodeType: 'location',
    direction: 'directed',
    cardinality: 'many-to-many',
    requiredProperties: [],
    description: 'Encounter template is available at this location.',
  },

  // ── Encounter Template Graph (THR-327, design plan §3.8) ──
  gates_to: {
    type: 'gates_to',
    sourceNodeType: 'encounter_template',
    targetNodeType: 'encounter_template',
    direction: 'directed',
    cardinality: 'many-to-many',
    requiredProperties: [],
    description: 'Completing source encounter_template hard-unlocks target. Target is gated until source is done.',
  },
  spawns_from: {
    type: 'spawns_from',
    sourceNodeType: 'encounter_template',
    targetNodeType: ['location', 'actor'],
    direction: 'directed',
    cardinality: 'many-to-many',
    requiredProperties: [],
    description: 'Encounter template is sourced from this location or actor. Used in candidate generation to match context.',
  },
  enables: {
    type: 'enables',
    sourceNodeType: 'encounter_template',
    targetNodeType: 'encounter_template',
    direction: 'directed',
    cardinality: 'many-to-many',
    requiredProperties: [],
    description: 'Completing source encounter_template is a soft prerequisite for target (boosts eligibility score, does not hard-gate).',
  },

  // ── Encounter History (TB-077) ─────────────────────────────
  participated_in: {
    type: 'participated_in',
    sourceNodeType: 'actor',
    targetNodeType: 'event',
    direction: 'directed',
    cardinality: 'many-to-many',
    requiredProperties: ['role', 'outcome', 'tick'],
    description: 'Actor participated in an encounter outcome event. Properties: role (primary/target), outcome, tick.',
  },
  occurred_at: {
    type: 'occurred_at',
    sourceNodeType: 'event',
    targetNodeType: 'location',
    direction: 'directed',
    cardinality: 'many-to-one',
    requiredProperties: ['tick'],
    description: 'Encounter event occurred at this location. Properties: tick, sublocationId (optional).',
  },

  // ── Causation (THR-116, THR-143) ────────────────────────────
  // caused_by edges connect encounter event nodes (evt_${actorId}_${tick}_${stepIndex}).
  // Emitted in unifiedActionResolution.ts when a seed-spawned action resolves its first step.
  // Family-only fires do NOT produce caused_by edges (v1 scope).
  caused_by: {
    type: 'caused_by',
    sourceNodeType: 'event',
    targetNodeType: 'event',
    direction: 'directed',
    cardinality: 'many-to-one',
    requiredProperties: ['seedId', 'seedLabel', 'firedTick'],
    description: 'Seeded encounter action was caused by a prior encounter event. Properties: seedId, seedLabel, firedTick.',
  },

  // ── Economic ───────────────────────────────────────────────
  trades_with: {
    type: 'trades_with',
    // Location-anchored, not actor-anchored (THR-830). The row said `actor` on both
    // ends from the start and no shipped producer ever agreed: `createTradeRoute`
    // (`strategicGraphOps.ts`) takes two location ids, and a 120-tick seeded run lands
    // its routes location -> location, 100% of them, warning twice per route the whole
    // time. Every actor -> actor site in the tree is a test fixture.
    //
    // Narrowed rather than widened to the `['actor','location']` union deliberately.
    // The union would have silenced the warning while proving nothing, and it would
    // additionally have *unblocked* `action.gold.establish-trade`, whose op writes
    // `$actor -> $target` and whose `$target` is always the location
    // (`unifiedCandidates.ts` — "target is always the location"). That op therefore
    // writes a third shape, `actor -> location`, which neither candidate row permits;
    // it is refused at the THR-1177 chokepoint today and stays refused here, which is
    // correct. It is a separate content defect, tracked as THR-1188.
    sourceNodeType: 'location',
    targetNodeType: 'location',
    direction: 'bidirectional',
    cardinality: 'many-to-many',
    requiredProperties: [],
    description: 'Trade route between two locations. Edge properties: volume, goodsType, manifest (cargo — THR-616), controlledBy, threatened.',
  },
  // ── Construction ──────────────────────────────────────────
  constructed_by: {
    type: 'constructed_by',
    sourceNodeType: ['location', 'sublocation'],
    targetNodeType: 'actor',
    direction: 'directed',
    cardinality: 'many-to-many',
    requiredProperties: [],
    description: 'Structure or sublocation was built by this actor. Source is the thing built; target is the builder. Edge properties: structureType.',
  },

  // ── Military (TB-073) ──
  commanded_by: {
    type: 'commanded_by',
    sourceNodeType: 'actor',
    targetNodeType: 'actor',
    direction: 'directed',
    cardinality: 'many-to-one',
    requiredProperties: [],
    description: 'Army is commanded by this agent. Commander is physically committed to the army.',
  },
  participates_in: {
    type: 'participates_in',
    sourceNodeType: 'actor',
    targetNodeType: 'actor',
    direction: 'directed',
    cardinality: 'many-to-many',
    requiredProperties: [],
    description: 'Army or agent participates in a battle node.',
  },

  // ── Social Leverage (THR-30) ──────────────────────────────────────
  knows_secret_of: {
    type: 'knows_secret_of',
    sourceNodeType: 'actor',
    targetNodeType: 'actor',
    direction: 'directed',
    cardinality: 'many-to-many',
    requiredProperties: ['secretType', 'magnitude', 'discoveredTick', 'source', 'revealed'],
    description: 'Discoverer holds a secret about the subject. Properties: secretType, magnitude, discoveredTick, source, revealed, revealedTick?, revealedTo?, detail?.',
  },
  owes_favor: {
    type: 'owes_favor',
    sourceNodeType: 'actor',
    targetNodeType: 'actor',
    direction: 'directed',
    cardinality: 'many-to-many',
    requiredProperties: ['magnitude', 'context', 'grantedTick', 'redeemed', 'broken'],
    description: 'Debtor owes a social favor to the creditor. Properties: magnitude, context, grantedTick, redeemed, broken.',
  },
  // ── Faction work orders (THR-1177) ────────────────────────────────────────
  // Both had live writers and no registry entry at all, so `EDGE_SCHEMA[type]` was
  // undefined and every edge they minted skipped validation silently. Endpoints read
  // off the writers: the quest and bounty nodes are `event` nodes carrying a
  // `nodeSubtype` discriminator, not node types of their own.
  commissions: {
    type: 'commissions',
    sourceNodeType: 'actor',
    targetNodeType: 'event',
    direction: 'directed',
    cardinality: 'one-to-many',
    requiredProperties: ['expiryTick'],
    description: 'Faction commissions a quest. Source = faction actor, target = event node with nodeSubtype "faction_quest" (phaseFactionActions).',
  },
  issues: {
    type: 'issues',
    sourceNodeType: 'actor',
    targetNodeType: 'event',
    direction: 'directed',
    cardinality: 'one-to-many',
    requiredProperties: ['expiryTick'],
    description: 'Faction issues a bounty. Source = faction actor, target = event node with nodeSubtype "bounty" (phaseFactionActions).',
  },

  // ── Pilgrimage routes (THR-1177) ──────────────────────────────────────────
  sacred_route: {
    type: 'sacred_route',
    sourceNodeType: 'actor',
    targetNodeType: 'location',
    direction: 'directed',
    cardinality: 'one-to-many',
    requiredProperties: ['establishedTick'],
    // Register-or-reject decision (THR-1177 asked for one sentence; this is the
    // reasoning): registered, because rejecting would silently void an eight-tick
    // strategic project that shipped content already performs — four live edges in the
    // seeded world — and no existing edge type carries "this actor consecrated a
    // pilgrimage route to this place", so the rewrite would have had to destroy the
    // fiction to satisfy the registry (NFP #5 and #6 both point the other way).
    // KNOWN GAP: zero consumers — nothing reads this edge yet, so it is inert rather
    // than wrong. Tracked as THR-1184; do not read that gap as a reason to unregister.
    description: 'Actor established a consecrated pilgrimage route to a location. Written by zealotStrategicPack via createRelationEdge. KNOWN GAP: no consumers yet (THR-1184).',
  },

  // ── Ruins Layer (THR-149, THR-150) ────────────────────────────────────────
  knows_clue_of: {
    type: 'knows_clue_of',
    sourceNodeType: 'actor',
    targetNodeType: 'location',
    direction: 'directed',
    cardinality: 'many-to-many',
    requiredProperties: ['magnitude', 'precision', 'source', 'discoveredTick', 'consumed'],
    description: 'Knower holds a transient clue about a ruin location. Properties: magnitude, precision, source, discoveredTick, consumed, consumedTick?, detail?, composedByGodId?.',
  },
  knows_of: {
    type: 'knows_of',
    sourceNodeType: 'actor',
    targetNodeType: 'location',
    direction: 'directed',
    cardinality: 'many-to-many',
    requiredProperties: [],
    description: 'Familiarity edge created when a knows_clue_of clue is consumed at convergence. Properties: fromClue?, convergedTick?.',
  },
  // ── Ruins Layer (THR-153) ──────────────────────────────────────────────────
  holds_place_of_power: {
    type: 'holds_place_of_power',
    sourceNodeType: 'actor',
    targetNodeType: 'location',
    direction: 'directed',
    cardinality: 'many-to-one',
    requiredProperties: ['holderType', 'heldSinceTick'],
    description: 'Holder bond between an actor/faction/god and a place_of_power location. Properties: holderType (actor|god|faction), heldSinceTick, corruptMark, bargainFavor, sphere.',
  },

  // ── Faction Succession (THR-432) ───────────────────────────────────────────
  // ── Dormant declared families (THR-1177) ──────────────────────────────────
  // Both are in `EdgeType` and were missing from this `Record<EdgeType, …>` — holes
  // parked in the typecheck baseline. Neither has a producer anywhere in `src/`, so
  // these rows document intent rather than observed writers: the endpoints are the
  // honest reading of each type's declaration comment. The first real producer either
  // matches, or trips the chokepoint loudly and gets the row corrected — which is what
  // the enforcement is for. Do not treat either row as measured.
  knows_spell: {
    type: 'knows_spell',
    sourceNodeType: 'actor',
    // The union's comment says "actor → spell_template", but there is no
    // `spell_template` NodeType and spells are not graph nodes at all today
    // (`spellActivation.ts` reads them off actor properties). `action_template` is the
    // nearest real type a learned spell would be minted as.
    targetNodeType: 'action_template',
    direction: 'directed',
    cardinality: 'many-to-many',
    requiredProperties: [],
    description: 'DORMANT (no producers): actor has learned a spell. Endpoints are declared intent, not measured — correct this row when a writer appears.',
  },
  embodies_spirit_of: {
    type: 'embodies_spirit_of',
    sourceNodeType: 'actor',
    targetNodeType: 'location',
    direction: 'directed',
    cardinality: 'one-to-one',
    requiredProperties: [],
    description: 'DORMANT (no producers): place_spirit actor embodies the spirit of a location (THR-401). Source = actor with actorType "place_spirit".',
  },

  will_succeed: {
    type: 'will_succeed',
    sourceNodeType: 'actor',
    targetNodeType: 'actor',
    direction: 'directed',
    cardinality: 'many-to-one',
    requiredProperties: ['anointedTick'],
    description: 'Agent anointed to inherit faction leadership on the next leader exit. '
      + 'Source = the successor agent; target = the faction (actorType: faction). Survives '
      + 'the current leader\'s death (which removes the leader node + its edges). Consumed '
      + 'on inheritance. Optional properties: anointedBy (ascendant id), priority.',
  },
  leads: {
    type: 'leads',
    sourceNodeType: 'actor',
    targetNodeType: 'actor',
    direction: 'directed',
    cardinality: 'one-to-one',
    requiredProperties: ['seatedTick'],
    description: 'Agent is the seated leader of this faction. Source = the leader; target = '
      + 'the faction (actorType: faction). Authoritative when present; absent for factions '
      + 'whose leadership has never been explicitly conferred (those fall back to '
      + 'score-derived leadership). Set/cleared by phaseFactionSuccession. Properties: '
      + 'seatedTick, conferredVia (anointment | natural).',
  },

  // ── Rival schemes (THR-66) ──────────────────────────────────
  sponsors_scheme: {
    type: 'sponsors_scheme',
    sourceNodeType: 'actor',
    targetNodeType: 'location',
    direction: 'directed',
    cardinality: 'many-to-many',
    requiredProperties: [],
    description: 'Rival actor sponsors a scheme against a target location. Bound at the '
      + 'materialization phase by phaseRivalActions; removed when the scheme fails. Drives '
      + 'the RivalPanel attribution and the HexMapV2 rival-influence overlay. Properties: '
      + 'compositionId, family, establishedTick.',
  },
};

// ─── Helpers ──────────────────────────────────────────────────────

/** Check if a node type matches a schema's allowed types */
export function matchesNodeType(
  actualType: string,
  allowedTypes: NodeType | NodeType[],
): boolean {
  if (Array.isArray(allowedTypes)) {
    return allowedTypes.includes(actualType as NodeType);
  }
  return actualType === allowedTypes;
}

// ─── Chokepoint validation (THR-1177) ─────────────────────────────

/**
 * Why a proposed edge is not schema-legal, or `null` when it is.
 *
 * Shared by the two generic writer chokepoints — `graphOpExecutor.executeAddEdge`
 * (content-authored `add_edge` ops, whose endpoints come from sentinel resolution and
 * so can bind scenery) and `strategicGraphOps.createRelationEdge` (which accepted any
 * string at all as an edge type). Those two are the only paths through which an
 * arbitrary family can be written with unchecked endpoints, which is why one check
 * here covers every family at once rather than needing thirty per-family guards
 * (THR-1176 audit).
 *
 * Deliberately a pure function over *type strings*, not over nodes or a graph: it has
 * to be callable from both chokepoints and from tests without a world, and keeping the
 * graph out of it means it cannot develop opinions about anything but the schema.
 *
 * `null` for a legal edge, so callers read as `const violation = validateEdgeEndpoints(...)`.
 */
export interface EdgeSchemaViolation {
  /** `unknown_type` = not in EDGE_SCHEMA at all; the others name the offending endpoint. */
  reason: 'unknown_type' | 'source_type' | 'target_type';
  /** Human-readable, safe to put straight into a trace summary or an op's `error`. */
  message: string;
}

export function validateEdgeEndpoints(
  edgeType: string,
  sourceNodeType: string | undefined,
  targetNodeType: string | undefined,
): EdgeSchemaViolation | null {
  const schema = EDGE_SCHEMA[edgeType as EdgeType];
  if (!schema) {
    return {
      reason: 'unknown_type',
      message: `Edge type "${edgeType}" is not registered in EDGE_SCHEMA`,
    };
  }

  // An endpoint we cannot resolve is not a schema violation — the caller's own
  // node-existence check owns that case, and reporting it here would produce two
  // errors for one cause.
  if (sourceNodeType !== undefined && !matchesNodeType(sourceNodeType, schema.sourceNodeType)) {
    return {
      reason: 'source_type',
      message: `Edge "${edgeType}" source must be ${JSON.stringify(schema.sourceNodeType)}, got "${sourceNodeType}"`,
    };
  }
  if (targetNodeType !== undefined && !matchesNodeType(targetNodeType, schema.targetNodeType)) {
    return {
      reason: 'target_type',
      message: `Edge "${edgeType}" target must be ${JSON.stringify(schema.targetNodeType)}, got "${targetNodeType}"`,
    };
  }
  return null;
}
