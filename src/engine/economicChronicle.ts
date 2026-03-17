/**
 * Economic Chronicle — resolves economic event templates into chronicle entries.
 *
 * Converts significant economic state changes into TickEvents and ChronicleChapters
 * that persist in the Great Chronicle for the player to review.
 *
 * NFP compliance:
 * - Tunability: significance per trigger is a named constant in content file
 * - Inspectability: emits economic_chronicle trace for every resolved entry
 * - Determinism: PRNG-based template and flavor variant selection
 * - Fail-soft: missing names → generic descriptors, missing templates → skip
 */

import type { TickEvent } from '../types/gameState';
import type { ChronicleChapter } from '../types/chronicle';
import type { SphereName } from '../types/index';
import type { WorldGraph } from './graph';
import { emitTrace } from './traceBuffer';
import {
  ECONOMIC_CHRONICLE_TEMPLATES,
  ECONOMIC_CHRONICLE_SIGNIFICANCE,
  WEALTH_TIER_FLAVOR,
  GUILD_FOUNDING_FLAVOR,
  type EconomicChronicleTrigger,
} from '../data/economic-chronicle-content';

// ─── Seeded PRNG (Mulberry32) ───────────────────────────────────────────────

function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── Context for template resolution ────────────────────────────────────────

export interface EconomicChronicleContext {
  /** Settlement name (for promotion/demotion/guild/monopoly) */
  settlement?: string;
  /** Previous settlement type (e.g. 'hamlet') */
  oldType?: string;
  /** New settlement type (e.g. 'town') */
  newType?: string;
  /** Primary actor name */
  actor?: string;
  /** Primary actor ID (for chronicle chapter) */
  actorId?: string;
  /** Target name (trade partner, agreement partner, assassination target) */
  target?: string;
  /** Target ID */
  targetId?: string;
  /** Goods type for trade routes */
  goodsType?: string;
  /** Guild name */
  guildName?: string;
  /** Guild type for flavor lookup */
  guildType?: string;
  /** Resource type for monopoly */
  resource?: string;
  /** Wealth tier label */
  tierLabel?: string;
  /** Explicit flavor text (overrides auto-generated) */
  flavor?: string;
  /** Ticks since last activity (trade route death) */
  ticksAgo?: number;
  /** Location ID for the hex coordinates lookup */
  locationId?: string;
  /** Hex coordinates for spatial events */
  hexCoords?: { col: number; row: number };
  /** Sphere coloring for the event */
  sphere?: SphereName;
}

// ─── Fail-soft name resolution ──────────────────────────────────────────────

/** Generic descriptors when names are missing from graph state */
const GENERIC = {
  settlement: 'a settlement',
  actor: 'a merchant',
  target: 'a distant partner',
  goodsType: 'assorted goods',
  guildName: 'a guild',
  resource: 'a vital resource',
  tierLabel: 'an uncertain station',
  flavor: '',
  oldType: 'settlement',
  newType: 'settlement',
} as const;

function resolveField(context: EconomicChronicleContext, field: keyof typeof GENERIC): string {
  const value = context[field];
  if (typeof value === 'string' && value.length > 0) return value;
  return GENERIC[field];
}

// ─── Flavor resolution ──────────────────────────────────────────────────────

function resolveWeathTierFlavor(tierLabel: string, seed: number): string {
  const flavors = WEALTH_TIER_FLAVOR[tierLabel];
  if (!flavors || flavors.length === 0) return '';
  const rng = mulberry32(seed);
  return flavors[Math.floor(rng() * flavors.length)];
}

function resolveGuildFlavor(guildType: string, seed: number): string {
  const flavors = GUILD_FOUNDING_FLAVOR[guildType];
  if (!flavors || flavors.length === 0) return 'the hammers ring and the ledgers open';
  const rng = mulberry32(seed);
  return flavors[Math.floor(rng() * flavors.length)];
}

// ─── Template resolution ────────────────────────────────────────────────────

function resolveTemplate(
  template: string,
  context: EconomicChronicleContext,
): string {
  return template
    .replace(/\{settlement\}/g, resolveField(context, 'settlement'))
    .replace(/\{oldType\}/g, resolveField(context, 'oldType'))
    .replace(/\{newType\}/g, resolveField(context, 'newType'))
    .replace(/\{actor\}/g, resolveField(context, 'actor'))
    .replace(/\{target\}/g, resolveField(context, 'target'))
    .replace(/\{goodsType\}/g, resolveField(context, 'goodsType'))
    .replace(/\{guildName\}/g, resolveField(context, 'guildName'))
    .replace(/\{resource\}/g, resolveField(context, 'resource'))
    .replace(/\{tierLabel\}/g, resolveField(context, 'tierLabel'))
    .replace(/\{flavor\}/g, context.flavor ?? GENERIC.flavor)
    .replace(/\{ticksAgo\}/g, String(context.ticksAgo ?? '?'));
}

// ─── Public API ─────────────────────────────────────────────────────────────

export interface EconomicChronicleResult {
  tickEvent: TickEvent;
  chronicleChapter: ChronicleChapter;
}

/**
 * Resolve an economic chronicle entry from a trigger, context, tick, and seed.
 *
 * Returns a TickEvent for immediate display and a ChronicleChapter for
 * permanent storage in the Great Chronicle.
 *
 * Fail-soft: returns null if the trigger has no templates.
 * PRNG: template variant and flavor variant selected deterministically from seed.
 */
export function resolveEconomicChronicle(
  trigger: EconomicChronicleTrigger,
  context: EconomicChronicleContext,
  tick: number,
  seed: number,
): EconomicChronicleResult | null {
  const templates = ECONOMIC_CHRONICLE_TEMPLATES[trigger];
  if (!templates || templates.length === 0) return null;

  const rng = mulberry32(seed);
  const templateIndex = Math.floor(rng() * templates.length);
  const template = templates[templateIndex];

  // Auto-resolve flavor for triggers that need it
  const resolvedContext = { ...context };
  if (!resolvedContext.flavor) {
    if (trigger === 'wealth_tier_up' || trigger === 'wealth_tier_down') {
      resolvedContext.flavor = resolveWeathTierFlavor(
        resolvedContext.tierLabel ?? '',
        seed + 1,
      );
    } else if (trigger === 'guild_founded') {
      resolvedContext.flavor = resolveGuildFlavor(
        resolvedContext.guildType ?? '',
        seed + 1,
      );
    }
  }

  const prose = resolveTemplate(template, resolvedContext);
  const significance = ECONOMIC_CHRONICLE_SIGNIFICANCE[trigger];

  // Collect actor IDs for the chronicle chapter
  const actorIds: string[] = [];
  if (resolvedContext.actorId) actorIds.push(resolvedContext.actorId);
  if (resolvedContext.targetId) actorIds.push(resolvedContext.targetId);

  const eventId = `evt_econ_${trigger}_${tick}_${seed}`;

  const tickEvent: TickEvent = {
    id: eventId,
    tick,
    type: 'economic_chronicle' as TickEvent['type'],
    message: prose,
    sphere: resolvedContext.sphere ?? 'gold',
    significance,
    hexCoords: resolvedContext.hexCoords,
    actorId: resolvedContext.actorId,
  };

  const chronicleChapter: ChronicleChapter = {
    id: `ch_econ_${trigger}_${tick}_${seed}`,
    title: formatChronicleTitle(trigger),
    prose,
    tick,
    significance,
    spheres: [resolvedContext.sphere ?? 'gold'],
    actorIds,
  };

  emitTrace({
    tick,
    category: 'economic_chronicle',
    agentId: resolvedContext.actorId,
    summary: `Economic chronicle: ${trigger} → "${prose.slice(0, 80)}${prose.length > 80 ? '...' : ''}"`,
    trigger,
    templateIndex,
    significance,
    actorIds,
  });

  return { tickEvent, chronicleChapter };
}

/**
 * Resolve names from graph state for a given node ID.
 * Fail-soft: returns undefined fields when node is missing.
 */
export function resolveNamesFromGraph(
  graph: WorldGraph,
  nodeId: string,
): { name: string | undefined; hexCoords?: { col: number; row: number } } {
  const node = graph.getNode(nodeId);
  if (!node) return { name: undefined };

  const hexCoords = typeof node.properties?.hexCol === 'number' && typeof node.properties?.hexRow === 'number'
    ? { col: node.properties.hexCol as number, row: node.properties.hexRow as number }
    : undefined;

  return { name: node.name, hexCoords };
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Human-readable title for a chronicle chapter based on trigger type */
function formatChronicleTitle(trigger: EconomicChronicleTrigger): string {
  const titles: Record<EconomicChronicleTrigger, string> = {
    settlement_promotion: 'A Settlement Rises',
    settlement_demotion: 'A Settlement Falls',
    trade_route_established: 'New Trade Route',
    trade_route_died: 'A Road Falls Silent',
    guild_founded: 'Guild Founded',
    monopoly_established: 'Monopoly Seized',
    monopoly_broken: 'Monopoly Broken',
    mercenary_hire: 'Sellswords Hired',
    assassination_commissioned: 'Blood Money',
    agreement_broken: 'A Pact Betrayed',
    wealth_tier_up: 'Fortune Rises',
    wealth_tier_down: 'Fortune Falls',
  };
  return titles[trigger];
}
