/**
 * The world-object registry — every kind of thing the world keeps, in game words
 * (THR-1394, ratified by Christian 2026-09-03).
 *
 * **The rule:** a world object is a node type (or an edge type, or a slice of
 * `GameState`) plus a subtype the game names; a *variant* is a subtype or a class,
 * never a new node type. One row per kind, and this file is the only hand-maintained
 * piece of the model: the node schema (`src/types/nodeSchema.ts`) is derived from it,
 * the generated catalogue (`Docs/canon/world-objects.generated.md`) is rendered from it
 * plus a seeded census, and the contract test pins that it covers every union member
 * and every `WorldRefKind`.
 *
 * **It extends `WorldRefKind`, it does not duplicate it** (THR-1212). `WorldRefKind` is
 * the chip vocabulary — where a consequence chip routes. Each kind here names the
 * `WorldRefKind` it projects onto, or `null` for a kind no chip addresses yet, and the
 * test pins the reverse: every non-reserved `WorldRefKind` is claimed by at least one
 * kind. Two views of one vocabulary: WorldRef answers "where does it route", this
 * registry answers "what is it and what may it be".
 *
 * **Adding a kind, class or subtype** is a row here *and* a UL term *and* a row on the
 * hand canon page (`Docs/canon/world-objects.md`), in one PR. A new node or edge type
 * keeps the load-bearing rule (full design before code) and additionally names its
 * kind here — the generator fails by name on a union member no kind claims.
 */
import type { NodeType, EdgeType } from '../types/graph';
import type { WorldRefKind } from '../types/worldRef';
import { SUBLOCATION_TYPE_CATEGORY } from './sublocation-category-art';
import type { SublocationTag } from '../engine/settlementGenome/types';
import { POSSESSION_SUBCATEGORIES } from '../types/attachments';

// ─── Shapes ─────────────────────────────────────────────────────────

/** A node kind: the node type, and the property that tells its members apart. */
export interface WorldObjectNodeShape {
  readonly kind: 'node';
  readonly nodeType: NodeType;
  /**
   * The discriminator property and the values this kind claims on it. A kind may
   * claim a subset of a node type's values (Mortal claims `actorType: individual`);
   * together the kinds sharing a node type must claim every value the world writes.
   */
  readonly discriminator?: {
    readonly key: string;
    readonly values: readonly string[];
    /** A second key read when the first is absent (older location nodes carry `locationType`). */
    readonly fallbackKey?: string;
  };
  /** A structural test that must also hold (the inner place tier is `parentLocationId` present). */
  readonly requires?: 'parentLocationId' | 'no-parentLocationId';
  /**
   * The value on the node type's *primary* discriminator that this kind's own
   * discriminator refines — the group kinds are `actorType: 'group'` told apart by
   * `groupKind`. Shared by every kind that refines it, so it is claimed, not owned.
   */
  readonly refines?: { readonly key: string; readonly value: string };
}

/** An edge kind: the edge types that are this kind, and the identity node it may grow. */
export interface WorldObjectEdgeShape {
  readonly kind: 'edge';
  readonly edgeTypes: readonly EdgeType[];
  /** The node a nameable / ownable instance of this kind grows (a trade route's identity node): its type, and the discriminator key + value it carries. Claimed by the node schema so the face is never reported unregistered. */
  readonly identityNode?: { readonly nodeType: NodeType; readonly key: string; readonly value: string };
}

/** A kind kept outside the graph, on `GameState`. */
export interface WorldObjectStateShape {
  readonly kind: 'state';
  readonly path: string;
}

export type WorldObjectShape = WorldObjectNodeShape | WorldObjectEdgeShape | WorldObjectStateShape;

export type WorldObjectStatus =
  /** minted on a census seed */
  | 'live'
  /** registered and readable, no writer minted one on the census seeds */
  | 'dormant'
  /** authored content that lives in the graph (templates), not a thing in the world */
  | 'content'
  /** reader-accepted for saved worlds; no writer by design */
  | 'legacy'
  /** scheduled for removal from the union (THR-1394 slice 2) */
  | 'retired';

export type WorldObjectKindId =
  | 'area' | 'hex' | 'location' | 'place' | 'route'
  | 'mortal' | 'ascendant' | 'god' | 'faction' | 'culture'
  | 'company' | 'army' | 'network' | 'battle' | 'companion'
  | 'item' | 'legendary_artifact' | 'holding' | 'power' | 'condition' | 'trait'
  | 'agreement' | 'standing'
  | 'ambition' | 'undertaking' | 'event' | 'journey' | 'divine_receipt'
  | 'sphere' | 'reach'
  | 'action_template' | 'encounter_template'
  | 'cosmology_node' | 'sublocation_node';

export interface WorldObjectKind {
  readonly id: WorldObjectKindId;
  /** The word the game uses. Player-facing; never a code identifier. */
  readonly gameWord: string;
  /** The UL entry this kind points at (`Docs/ubiquitous-language/<shard>.md#<anchor>`). */
  readonly ulTerm: string;
  /** The chip vocabulary member this kind projects onto, or null when no chip addresses it yet. */
  readonly worldRef: WorldRefKind | null;
  readonly shape: WorldObjectShape;
  /** Classes: a game-word grouping over the discriminator's values. Every claimed value sits in exactly one class. */
  readonly classes?: Readonly<Record<string, readonly string[]>>;
  /** The systems-inventory subsystem that owns the kind's writers. */
  readonly owningSystem: string;
  /** Module basenames (under `src/`) that mint one; the generator verifies each exists. */
  readonly writers: readonly string[];
  readonly status: WorldObjectStatus;
  /** The decision recorded when the kind was ratified — the sentence a designer needs. */
  readonly note: string;
}

// ─── Location classes (the outer tier) ───────────────────────────────
// Every member of `LocationSubtype` (src/types/index.ts) sits in exactly one class;
// the contract test pins it against the union. `trade_route` is not a Location — it
// is a Route's identity node (see ROUTE).

export const LOCATION_CLASSES: Readonly<Record<string, readonly string[]>> = {
  settlement: ['hamlet', 'town', 'city', 'capital', 'camp', 'farmland'],
  stronghold: ['castle', 'fort', 'tower'],
  holy_place: ['shrine', 'temple', 'place_of_power'],
  ruin: ['ruins', 'ruined_tower', 'ruined_city', 'ruined_village', 'elder_ruin', 'shipwreck', 'ancient_vault', 'sunken_treasury'],
  wild: ['wilderness', 'lair', 'cleared_lair', 'monument', 'cavern', 'grove', 'hot_spring', 'nest', 'haunted_ground', 'unexplored_poi', 'oasis', 'battleground', 'ancient_road', 'bridge', 'corruption_zone'],
  wonder: ['healing_spring', 'master_forge', 'living_archive', 'fey_crossing', 'sacrifice_site', 'convergence', 'time_scar', 'standing_stones', 'shadow_hollow', 'ley_nexus', 'golden_grove', 'crystal_cavern', 'glowcap_hollow'],
  deposit: ['mining', 'gem_deposit', 'iron_seep', 'fossil_bed', 'pearl_shoal', 'herb_garden'],
};

export const LOCATION_SUBTYPES: readonly string[] = Object.values(LOCATION_CLASSES).flat();

/** The Route identity node's subtype — a `location` node that is not a Location. */
export const ROUTE_IDENTITY_LOCATION_SUBTYPE = 'trade_route';

// ─── Place classes (the inner tier) ──────────────────────────────────
// Derived from the one table that already classifies every sublocation type id
// (`SUBLOCATION_TYPE_CATEGORY`); never copied.

const PLACE_TYPE_ID_PREFIX = 'sublocation-type.';

export const PLACE_CLASSES: Readonly<Record<SublocationTag, readonly string[]>> = (() => {
  const out: Record<string, string[]> = {};
  for (const [id, tag] of Object.entries(SUBLOCATION_TYPE_CATEGORY)) (out[tag] ??= []).push(id);
  return out as Record<SublocationTag, readonly string[]>;
})();

/** A place type id as the world writes it (`sublocation-type.granary`) or bare (`granary`), normalised to bare. */
export function barePlaceTypeId(id: string): string {
  return id.startsWith(PLACE_TYPE_ID_PREFIX) ? id.slice(PLACE_TYPE_ID_PREFIX.length) : id;
}

export const PLACE_TYPE_IDS: readonly string[] = Object.keys(SUBLOCATION_TYPE_CATEGORY);

// ─── Other class tables ─────────────────────────────────────────────

export const ITEM_CLASSES: Readonly<Record<string, readonly string[]>> = {
  arms: ['arms'], mounts_and_beasts: ['mounts_beasts'], vestments: ['vestments'], tomes_and_scrolls: ['tomes_scrolls'],
  relics_and_talismans: ['relics_talismans'], tools_and_instruments: ['tools_instruments'], provisions: ['provisions'],
};

export const ROUTE_KINDS = ['road', 'trail', 'trade_lane', 'pilgrim_way', 'portal'] as const;
export type RouteKind = typeof ROUTE_KINDS[number];

/** Trait subcategories that are *traits* (what a thing is); conditions and scars are the Condition kind. */
/** `bestowed` is the Power kind's; `condition` and `scar` are the Condition kind's. */
export const TRAIT_SUBCATEGORIES: readonly string[] = ['innate', 'mastery', 'reputation', 'personality', 'core', 'destiny', 'cultural', 'experience'];
export const CONDITION_SUBCATEGORIES: readonly string[] = ['condition', 'scar'];

export const EVENT_TYPES: readonly string[] = [
  'encounter_outcome', 'undertaking_outcome', 'action_resolved', 'narrative', 'ripple_consequence', 'combat_started', 'divine_spark',
  'faction_quest', 'bounty',
];

// ─── The registry ───────────────────────────────────────────────────

const K = (row: WorldObjectKind): WorldObjectKind => row;

export const WORLD_OBJECT_KINDS: readonly WorldObjectKind[] = [
  // ── Places ──
  K({
    id: 'area', gameWord: 'Area', ulTerm: 'Graph.md#area', worldRef: null,
    shape: { kind: 'node', nodeType: 'region' },
    owningSystem: 'World generation & terrain', writers: ['worldSeed'], status: 'live',
    note: 'A multi-hex cluster by dominant terrain feature, containing its locations. Geographic only: political territory is a faction\'s `controls` edges, never a second region kind.',
  }),
  K({
    id: 'hex', gameWord: 'Hex', ulTerm: 'Graph.md#hextile', worldRef: 'hex',
    shape: { kind: 'state', path: 'GameState.tiles[]' },
    owningSystem: 'Hex map', writers: ['terrain'], status: 'live',
    note: 'The one thing that is not a node — terrain, features, fog. The settled exception.',
  }),
  K({
    id: 'location', gameWord: 'Location', ulTerm: 'Graph.md#location', worldRef: 'location',
    shape: { kind: 'node', nodeType: 'location', requires: 'no-parentLocationId', discriminator: { key: 'locationSubtype', fallbackKey: 'locationType', values: LOCATION_SUBTYPES } },
    classes: LOCATION_CLASSES,
    owningSystem: 'World generation & terrain', writers: ['worldSeed', 'strategicGraphOps'], status: 'live',
    note: 'The outer tier: where mortals live, hold, ruin and wonder. Seven classes over the existing subtypes; nothing joins the union.',
  }),
  K({
    id: 'place', gameWord: 'Place', ulTerm: 'Graph.md#place', worldRef: 'sublocation',
    shape: { kind: 'node', nodeType: 'location', requires: 'parentLocationId', discriminator: { key: 'sublocationTypeId', values: PLACE_TYPE_IDS } },
    classes: PLACE_CLASSES,
    owningSystem: 'Sublocations', writers: ['sublocation', 'strategicGraphOps', 'settlementGenome/materialize'], status: 'live',
    note: 'The inner tier — an inn, a granary, a gatehouse, a grove, a spring — inside a Location. Not always built. The code word is *sublocation*; the game word is Place (Christian, 2026-09-03).',
  }),
  K({
    id: 'route', gameWord: 'Route', ulTerm: 'Graph.md#route', worldRef: null,
    shape: { kind: 'edge', edgeTypes: ['road', 'trades_with', 'sacred_route'], identityNode: { nodeType: 'location', key: 'locationSubtype', value: ROUTE_IDENTITY_LOCATION_SUBTYPE } },
    classes: { road: ['road'], trail: [], trade_lane: ['trades_with'], pilgrim_way: ['sacred_route'], portal: [] },
    owningSystem: 'Trade routes', writers: ['roadNetwork', 'tradeRoute', 'strategicGraphOps'], status: 'live',
    note: 'An edge between two Locations — traversal walks edges — that grows an identity node the moment it is nameable, ownable, blockadable or consecrated (the trade route\'s pattern, generalised). A trail is a `road` edge with `routeKind: trail` (stamped by the road network); a portal is a route edge with an empty hex path and its own cost, ratified with no writer yet.',
  }),

  // ── People and collectives ──
  K({
    id: 'mortal', gameWord: 'Mortal', ulTerm: 'Agents.md#agent', worldRef: 'agent',
    shape: { kind: 'node', nodeType: 'actor', discriminator: { key: 'actorType', values: ['individual'] } },
    owningSystem: 'Agents & decision', writers: ['worldSeed', 'npcSeeding', 'agentLifecycle', 'binding/mintInhabitant'], status: 'live',
    note: 'The game word for an individual actor; "agent" is the engine word. Roles, callings and spotlight tiers are variants.',
  }),
  K({
    id: 'ascendant', gameWord: 'Ascendant', ulTerm: 'Agents.md#ascendant', worldRef: 'agent',
    shape: { kind: 'node', nodeType: 'actor', discriminator: { key: 'actorType', values: ['ascendant'] } },
    owningSystem: 'Ascendant & divine economy', writers: ['gameInit'], status: 'live',
    note: 'The player, and rival ascendants: architecturally an ordinary actor.',
  }),
  K({
    id: 'god', gameWord: 'God / Spirit', ulTerm: 'Agents.md#actortype', worldRef: 'agent',
    shape: { kind: 'node', nodeType: 'actor', discriminator: { key: 'actorType', values: ['god', 'place_spirit'] } },
    owningSystem: 'Ascendant & divine economy', writers: [], status: 'dormant',
    note: 'Gods and place-spirits share the actor shape; neither is minted on the census seeds.',
  }),
  K({
    id: 'faction', gameWord: 'Faction', ulTerm: 'Agents.md#faction', worldRef: 'faction',
    shape: { kind: 'node', nodeType: 'actor', discriminator: { key: 'actorType', values: ['faction'] } },
    owningSystem: 'Factions & succession', writers: ['worldSeed', 'strategicGraphOps'], status: 'live',
    note: 'A structured social entity holding territory through `controls`; chapters share a def.',
  }),
  K({
    id: 'culture', gameWord: 'Culture', ulTerm: 'Agents.md#actortype', worldRef: null,
    shape: { kind: 'node', nodeType: 'actor', discriminator: { key: 'actorType', values: ['culture'] } },
    owningSystem: 'Cultures', writers: ['worldSeed'], status: 'live',
    note: 'A people: foundation bias and phonetic signature; mortals and locations `belongs_to` one.',
  }),
  K({
    id: 'company', gameWord: 'Company', ulTerm: 'Agents.md#company', worldRef: null,
    shape: { kind: 'node', nodeType: 'actor', refines: { key: 'actorType', value: 'group' }, discriminator: { key: 'groupKind', values: ['company'] } },
    owningSystem: 'Companies & group travel', writers: ['groups/groupFormation', 'strategicGraphOps'], status: 'live',
    note: 'The game word for a travelling group; never "party". Its position is its leader\'s.',
  }),
  K({
    id: 'army', gameWord: 'Army', ulTerm: 'Agents.md#group', worldRef: 'army',
    shape: { kind: 'node', nodeType: 'actor', refines: { key: 'actorType', value: 'group' }, discriminator: { key: 'groupKind', values: ['army'] } },
    owningSystem: 'War, armies & battles', writers: ['armySpawning'], status: 'live',
    note: 'A company kind with a stance, supply and momentum.',
  }),
  K({
    id: 'network', gameWord: 'Network', ulTerm: 'Agents.md#group', worldRef: null,
    shape: { kind: 'node', nodeType: 'actor', refines: { key: 'actorType', value: 'group' }, discriminator: { key: 'groupKind', values: ['network'] } },
    owningSystem: 'Companies & group travel', writers: ['strategicGraphOps'], status: 'dormant',
    note: 'A company kind that does not travel — a ring, a spy network.',
  }),
  K({
    id: 'battle', gameWord: 'Battle', ulTerm: 'Agents.md#group', worldRef: null,
    shape: { kind: 'node', nodeType: 'actor', refines: { key: 'actorType', value: 'group' }, discriminator: { key: 'groupKind', values: ['battle'] } },
    owningSystem: 'War, armies & battles', writers: ['battleResolution'], status: 'live',
    note: 'An engine detail kept as an actor node so participants can `participates_in` it; not a player object.',
  }),
  K({
    id: 'companion', gameWord: 'Companion', ulTerm: 'Agents.md#companion', worldRef: 'companion',
    shape: { kind: 'node', nodeType: 'companion' },
    owningSystem: 'Attachments, items & possessions', writers: ['companions'], status: 'live',
    note: 'A face that walks with one mortal and grants small always-on bonuses; never an agent.',
  }),

  // ── Things a mortal carries or is under ──
  K({
    id: 'item', gameWord: 'Item', ulTerm: 'Traits.md#attachment', worldRef: 'artifact',
    shape: { kind: 'node', nodeType: 'artifact', refines: { key: 'attachmentCategory', value: 'possession' }, discriminator: { key: 'subcategory', values: POSSESSION_SUBCATEGORIES } },
    classes: ITEM_CLASSES,
    owningSystem: 'Attachments, items & possessions', writers: ['rewardPool', 'resourceSeeding', 'strategicGraphOps', 'gameInit'], status: 'live',
    note: 'A possession: arms, a mount, a tome, a relic, tools, provisions; charts and masterworks are items with a subtype. Every mint stamps `attachmentCategory: possession` (THR-1394 slice 2) and is told apart by `subcategory`.',
  }),
  K({
    id: 'legendary_artifact', gameWord: 'Legendary artifact', ulTerm: 'Traits.md#attachment', worldRef: 'artifact',
    shape: { kind: 'node', nodeType: 'artifact_legendary' },
    owningSystem: 'Attachments, items & possessions', writers: ['worldSeed'], status: 'live',
    note: 'An item with its own trait graph, bonded rather than possessed.',
  }),
  K({
    id: 'holding', gameWord: 'Holding', ulTerm: 'Agents.md#work', worldRef: null,
    shape: { kind: 'edge', edgeTypes: ['owns'], identityNode: { nodeType: 'artifact', key: 'attachmentCategory', value: 'holding' } },
    owningSystem: 'Attachments, items & possessions', writers: ['holdings'], status: 'live',
    note: 'Not a thing — the ownership of a Location, Place or Route. The `owns` edge is the truth; the mirror artifact face (`attachmentCategory: \'holding\'`) is a sheet convenience and never a target. The player word is *freehold*.',
  }),
  K({
    id: 'power', gameWord: 'Power', ulTerm: 'Traits.md#power', worldRef: 'attachment',
    shape: { kind: 'node', nodeType: 'trait', discriminator: { key: 'subcategory', values: ['bestowed'] } },
    classes: { spell: [], bestowal: ['bestowed'], innate: [] },
    owningSystem: 'Attachments, items & possessions', writers: ['spellActivation'], status: 'dormant',
    note: 'Spell · bestowal · innate — the UL family. No node shape of its own yet: a cast spell mints a condition trait and `knows_spell` has no writer. A later ticket gives it a shape; the registry records the family and the gap.',
  }),
  K({
    id: 'condition', gameWord: 'Condition', ulTerm: 'Traits.md#trait-category', worldRef: 'attachment',
    shape: { kind: 'node', nodeType: 'trait', discriminator: { key: 'subcategory', values: CONDITION_SUBCATEGORIES } },
    classes: { condition: ['condition'], scar: ['scar'] },
    owningSystem: 'Traits & attachments', writers: ['gameInit', 'spellActivation', 'rewardPool'], status: 'live',
    note: 'Wounds, diseases, strains; blessings and curses as signed conditions; scars as permanent ones. Shared definitions, per-bearer state on the `has_trait` edge (THR-1395): the seeded catalogue was already one node per kind, and `spellActivation`\'s `condition_inflict` — the one writer that minted a node per application — now points every bearer of a template at the same definition.',
  }),
  K({
    id: 'trait', gameWord: 'Trait', ulTerm: 'Traits.md#trait', worldRef: null,
    shape: { kind: 'node', nodeType: 'trait', discriminator: { key: 'subcategory', values: TRAIT_SUBCATEGORIES } },
    owningSystem: 'Traits & attachments', writers: ['gameInit', 'culturalTraits', 'capabilityGrowth', 'encounterChains', 'reputation'], status: 'live',
    note: 'The graph\'s vocabulary of what a thing *is*: shared definition nodes, per-bearer state on `has_trait`. Tags refine traits; they are not a general object taxonomy. THR-1395 brought the `experience` subcategory back to that rule — encounter growth and chain mastery minted one node per bearer (44 nodes for 44 bearers on a seeded medium world at tick 30) and now share one per domain and one per chain.',
  }),
  K({
    id: 'agreement', gameWord: 'Agreement', ulTerm: 'Traits.md#attachment', worldRef: null,
    shape: { kind: 'edge', edgeTypes: ['owes_favor', 'knows_secret_of'] },
    classes: { favor: ['owes_favor'], mark: ['knows_secret_of'] },
    owningSystem: 'Secrets & favors', writers: ['secretGeneration', 'strategicGraphOps'], status: 'live',
    note: 'A favour owed, or a mark — a secret held as leverage. Both between two parties; both edges.',
  }),
  K({
    id: 'standing', gameWord: 'Standing', ulTerm: 'Agents.md#reputation', worldRef: null,
    shape: { kind: 'edge', edgeTypes: ['reputation_with', 'relates_to', 'hostile_to'] },
    classes: { reputation: ['reputation_with'], relationship: ['relates_to'], quarrel: ['hostile_to'] },
    owningSystem: 'Reputation & standing', writers: ['reputation', 'factionSeeding', 'grievance/grudgeEdge'], status: 'live',
    note: 'How two parties stand: a directional reputation score, a relationship arc, a quarrel the motive gate reads. One shape each; the reified `relationship` node retires.',
  }),

  // ── Wants, works, happenings ──
  K({
    id: 'ambition', gameWord: 'Ambition', ulTerm: 'Agents.md#undertaking', worldRef: null,
    shape: { kind: 'node', nodeType: 'ambition' },
    owningSystem: 'Ambitions & undertakings', writers: ['ambitionAssignment', 'ambitionTick', 'ambitionShape'], status: 'live',
    note: 'What a mortal wants; pursued through `pursues`.',
  }),
  K({
    id: 'undertaking', gameWord: 'Undertaking', ulTerm: 'Agents.md#undertaking', worldRef: null,
    shape: { kind: 'state', path: 'GameState.strategicState.projects[]' },
    owningSystem: 'Ambitions & undertakings', writers: ['strategicActionLifecycle'], status: 'live',
    note: 'A work in progress — bookkeeping, not an entity (ratified THR-1280); its outcome is an Event.',
  }),
  K({
    id: 'event', gameWord: 'Event', ulTerm: 'Graph.md#node', worldRef: 'encounter',
    shape: { kind: 'node', nodeType: 'event', discriminator: { key: 'eventType', values: EVENT_TYPES } },
    owningSystem: 'Attention, chronicle & narrative', writers: ['encounterEventNode', 'grievance/undertakingOutcomeNode', 'phaseFactionActions', 'unifiedActionResolution'], status: 'live',
    note: 'What happened: the chronicle\'s substrate. One kind key, `eventType`.',
  }),

  K({
    id: 'journey', gameWord: 'Journey', ulTerm: 'Agents.md#the-first', worldRef: 'journey',
    shape: { kind: 'state', path: 'GameState.pendingVignettes[] (the First’s doom-clock-scheduled journey beats)' },
    owningSystem: 'Doom Clock & Journey', writers: ['journeyEngine'], status: 'live',
    note: 'The First’s hero’s-journey arc: the doom clock schedules the beat, the First’s world state picks the variant, the player’s vignette choice decides what happens. State, not a node; a chip routes to it by journey id.',
  }),
  K({
    id: 'divine_receipt', gameWord: 'Divine receipt', ulTerm: 'Encounters.md#aftermath', worldRef: 'receipt',
    shape: { kind: 'state', path: 'GameState.playerActionReceipts[]' },
    owningSystem: 'Essence & Divine Economy', writers: ['playerReceipts'], status: 'live',
    note: 'What the player’s own divine action came to (THR-727): a resolution record the receipt surface reads. State, not a node.',
  }),

  // ── The cosmos ──
  K({
    id: 'sphere', gameWord: 'Sphere', ulTerm: 'Cosmology.md#sphere', worldRef: null,
    shape: { kind: 'state', path: 'GameState.cosmology' },
    owningSystem: 'Cosmology', writers: ['cosmology'], status: 'live',
    note: 'An axis of the cosmos, not an object. Twelve; foundation and creation.',
  }),
  K({
    id: 'reach', gameWord: 'Reach', ulTerm: 'Cosmology.md#reach', worldRef: null,
    shape: { kind: 'state', path: 'ReachDomain (a type union; capability per reach on the actor)' },
    owningSystem: 'Cosmology', writers: ['capabilityGrowth'], status: 'live',
    note: 'An axis, not an object. Eight.',
  }),

  // ── Content that lives in the graph ──
  K({
    id: 'action_template', gameWord: '(action template)', ulTerm: 'Encounters.md#template', worldRef: null,
    shape: { kind: 'node', nodeType: 'action_template' },
    owningSystem: 'Encounters & dilemmas', writers: ['gameInit'], status: 'content',
    note: 'Authored content imported as nodes; not a thing a player points at.',
  }),
  K({
    id: 'encounter_template', gameWord: '(encounter template)', ulTerm: 'Encounters.md#template', worldRef: 'encounter',
    shape: { kind: 'node', nodeType: 'encounter_template' },
    owningSystem: 'Encounters & dilemmas', writers: [], status: 'content',
    note: 'A template graph node (design plan §3.8); no writer on the census seeds.',
  }),

  // ── Union members with no world behind them ──
  // `resource` and `relationship` retired from the union in THR-1394 slice 2 with their
  // readers repointed; resources are stocks on a Location, a relationship is the
  // `relates_to` edge (the Standing kind).
  K({
    id: 'cosmology_node', gameWord: '(cosmology node — dormant)', ulTerm: 'Graph.md#nodetype', worldRef: null,
    shape: { kind: 'node', nodeType: 'cosmology' },
    owningSystem: 'Cosmology', writers: [], status: 'dormant',
    note: 'Never minted; `contextBuilder` reads it by value at two sites that are dead in a live world (no `aligned_with` edge targets a cosmology node). Kept DORMANT: the repoint at `GameState.cosmology` needs its integration test rewritten, which is its own ticket, not a green-test flip.',
  }),
  K({
    id: 'sublocation_node', gameWord: '(sublocation node — legacy)', ulTerm: 'Graph.md#place', worldRef: 'sublocation',
    shape: { kind: 'node', nodeType: 'sublocation' },
    owningSystem: 'Sublocations', writers: [], status: 'legacy',
    note: 'Reader-accepted for saved worlds (THR-1177); no producer since THR-1183. A Place is a `location` node with `parentLocationId`.',
  }),
];

// ─── Readers ────────────────────────────────────────────────────────

export function getWorldObjectKind(id: WorldObjectKindId): WorldObjectKind | undefined {
  return WORLD_OBJECT_KINDS.find(k => k.id === id);
}

/** The kinds that claim a node type. */
export function kindsForNodeType(nodeType: NodeType): readonly WorldObjectKind[] {
  return WORLD_OBJECT_KINDS.filter(k => k.shape.kind === 'node' && k.shape.nodeType === nodeType);
}

/** The kinds that claim an edge type. */
export function kindsForEdgeType(edgeType: EdgeType): readonly WorldObjectKind[] {
  return WORLD_OBJECT_KINDS.filter(k => k.shape.kind === 'edge' && k.shape.edgeTypes.includes(edgeType));
}

/** The Location class a subtype belongs to, or undefined for a value no class claims. */
export function locationClassOf(subtype: string | undefined): string | undefined {
  if (!subtype) return undefined;
  for (const [cls, members] of Object.entries(LOCATION_CLASSES)) if (members.includes(subtype)) return cls;
  return undefined;
}

/** The Place class a sublocation type id belongs to, or undefined. */
export function placeClassOf(typeId: string | undefined): SublocationTag | undefined {
  if (!typeId) return undefined;
  return SUBLOCATION_TYPE_CATEGORY[barePlaceTypeId(typeId)];
}
