/**
 * Guild Seeding — spawns guild factions at town+ settlements during world creation.
 *
 * Guilds are factions with Gold-heavy reach preferences. Each guild spawns at a
 * qualifying settlement (town, city, capital), gets a Guild Hall sublocation on
 * creation, and uses seeded PRNG for all randomness (deterministic).
 *
 * Guild type is determined by the settlement's dominant resource:
 *   ore/stone    → miners
 *   timber/grain → artisans
 *   fish/water   → traders
 *   tied         → PRNG tiebreaker → merchants as final fallback
 *   high prosperity → bankers (when no clear dominant resource)
 *
 * Design doc: Docs/plans/2026-03-17-gold-reach-economic-systems-design.md
 * System 3 — Guilds as Economic Factions
 * NFP priorities: Tunability, Determinism, Fail-soft, Inspectability
 */

import type { WorldGraph } from './graph';
import type { ReachDomain } from '../types/traits';
import { REACH_DOMAINS } from '../types/traits';
import type { AxiologicalProfile, ValuePair } from '../types/agent';

// ─── Constants (System 3) ─────────────────────────────────────────────────

/** Minimum guilds spawned per qualifying settlement */
export const GUILD_SPAWN_COUNT_MIN = 1;

/** Maximum guilds spawned per qualifying settlement */
export const GUILD_SPAWN_COUNT_MAX = 2;

/** Minimum Gold domain capability for guild factions */
export const GUILD_GOLD_CAP_MIN = 60;

/** Maximum Gold domain capability for guild factions */
export const GUILD_GOLD_CAP_MAX = 80;

/** Minimum secondary domain capability for guild factions */
export const GUILD_SECONDARY_CAP_MIN = 30;

/** Maximum secondary domain capability for guild factions */
export const GUILD_SECONDARY_CAP_MAX = 50;

/** Minimum minor domain capability for guild factions */
export const GUILD_MINOR_CAP_MIN = 10;

/** Maximum minor domain capability for guild factions */
export const GUILD_MINOR_CAP_MAX = 20;

/** Guild wealth needed to spawn Market Stall sublocation */
export const GUILD_MARKET_STALL_THRESHOLD = 20;

/** Prosperity threshold above which a location qualifies for a bankers guild */
const GUILD_BANKER_PROSPERITY_THRESHOLD = 60;

// ─── Types ────────────────────────────────────────────────────────────────

export type GuildType = 'merchants' | 'artisans' | 'miners' | 'traders' | 'bankers';

/** Settlement subtypes that qualify for guild spawning (town+ tier) */
const GUILD_ELIGIBLE_SUBTYPES = new Set(['town', 'city', 'capital']);

/** Secondary reach domain by guild type */
const GUILD_SECONDARY_DOMAIN: Record<GuildType, ReachDomain> = {
  merchants: 'heart',
  artisans: 'stone',
  miners: 'iron',
  traders: 'eye',
  bankers: 'shadow',
};

/** Guild name suffix templates by guild type */
const GUILD_NAME_SUFFIXES: Record<GuildType, string[]> = {
  merchants: ['Merchants Guild', 'Commerce House', 'Trading Company'],
  artisans: ['Artisans Circle', 'Craftworkers Guild', 'Builders Fellowship'],
  miners: ['Mining Consortium', 'Ironmongers Guild', 'Stone Cutters Brotherhood'],
  traders: ['Traders Association', 'Harbor Trade Company', 'Maritime Guild'],
  bankers: ['Banking Consortium', 'Counting Masters', 'Golden Ledger Society'],
};

/** All value pairs (mirrors worldSeed.ts internal list) */
const VALUE_PAIRS: ValuePair[] = [
  'ambition_contentment', 'courage_prudence', 'cruelty_compassion',
  'cunning_honesty', 'devotion_independence', 'loyalty_treachery',
  'tradition_innovation', 'dominance_humility', 'wrath_patience', 'greed_generosity',
];

// ─── PRNG ─────────────────────────────────────────────────────────────────

function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randomInRange(rng: () => number, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

// ─── Guild Type Determination ─────────────────────────────────────────────

/**
 * Determine guild type from dominant resource at a location.
 * Uses PRNG tiebreaker when multiple resources tie for dominance.
 * Falls back to 'bankers' if prosperity is high, 'merchants' otherwise.
 *
 * Fail-soft: missing resources → 'merchants', emit trace.
 */
export function determineGuildType(
  locationId: string,
  graph: WorldGraph,
  rng: () => number,
): GuildType {
  const location = graph.getNode(locationId);
  if (!location) return 'merchants';

  const resources = location.properties.resources as
    | Record<string, { quantity?: number }>
    | undefined;
  const prosperity =
    typeof location.properties.prosperity === 'number'
      ? location.properties.prosperity
      : 0;

  if (!resources || Object.keys(resources).length === 0) {
    // Fail-soft: no resources → use prosperity fallback (no crash, no trace needed at seed time)
    return prosperity >= GUILD_BANKER_PROSPERITY_THRESHOLD ? 'bankers' : 'merchants';
  }

  const oreQty = (resources.ore?.quantity ?? 0) + (resources.stone?.quantity ?? 0);
  const craftQty = (resources.timber?.quantity ?? 0) + (resources.grain?.quantity ?? 0);
  const tradeQty = (resources.fish?.quantity ?? 0) + (resources.water?.quantity ?? 0);

  const candidates: Array<{ type: GuildType; qty: number }> = [
    { type: 'miners', qty: oreQty },
    { type: 'artisans', qty: craftQty },
    { type: 'traders', qty: tradeQty },
  ].filter(c => c.qty > 0);

  if (candidates.length === 0) {
    return prosperity >= GUILD_BANKER_PROSPERITY_THRESHOLD ? 'bankers' : 'merchants';
  }

  const maxQty = Math.max(...candidates.map(c => c.qty));
  const dominant = candidates.filter(c => c.qty === maxQty);

  if (dominant.length === 1) return dominant[0].type;

  // PRNG tiebreaker: deterministic selection when resources are tied
  return dominant[Math.floor(rng() * dominant.length)].type;
}

// ─── Domain Capabilities ─────────────────────────────────────────────────

/**
 * Generate Gold-heavy domain capabilities for a guild faction.
 * Gold is always in the GUILD_GOLD_CAP range.
 * Secondary domain (type-specific) is in GUILD_SECONDARY_CAP range.
 * All others are in GUILD_MINOR_CAP range.
 */
export function generateGuildDomainCapabilities(
  guildType: GuildType,
  rng: () => number,
): Record<ReachDomain, number> {
  const caps = {} as Record<ReachDomain, number>;

  // All domains start at minor range
  for (const domain of REACH_DOMAINS) {
    caps[domain] = randomInRange(rng, GUILD_MINOR_CAP_MIN, GUILD_MINOR_CAP_MAX);
  }

  // Gold is always high
  caps.gold = randomInRange(rng, GUILD_GOLD_CAP_MIN, GUILD_GOLD_CAP_MAX);

  // Secondary domain based on guild type (overwrites minor if needed)
  const secondary = GUILD_SECONDARY_DOMAIN[guildType];
  caps[secondary] = randomInRange(rng, GUILD_SECONDARY_CAP_MIN, GUILD_SECONDARY_CAP_MAX);

  return caps;
}

// ─── Axiological Profile ──────────────────────────────────────────────────

/**
 * Generate a guild's axiological profile, biased toward greed, cunning, ambition.
 * Miners' guilds get a tradition bias instead (heavy tradition_innovation lean).
 */
export function generateGuildAxiologicalProfile(
  guildType: GuildType,
  rng: () => number,
): AxiologicalProfile {
  const profile = {} as AxiologicalProfile;

  for (const pair of VALUE_PAIRS) {
    profile[pair] = (rng() * 1.6) - 0.8;
  }

  // All guilds: bias toward greed, cunning, ambition
  profile.greed_generosity = Math.min(1, profile.greed_generosity + 0.5);
  profile.cunning_honesty = Math.min(1, profile.cunning_honesty + 0.3);
  profile.ambition_contentment = Math.min(1, profile.ambition_contentment + 0.3);

  // Miners' guild exception: tradition-heavy
  if (guildType === 'miners') {
    profile.tradition_innovation = Math.max(-1, profile.tradition_innovation - 0.4);
  }

  return profile;
}

// ─── Main Seeder ──────────────────────────────────────────────────────────

/**
 * Seed guild factions at all town+ settlements.
 *
 * For each qualifying location, spawns GUILD_SPAWN_COUNT_MIN–MAX guilds.
 * Each guild:
 * - Is an actor node with actorType: 'faction', guildType, Gold-heavy capabilities
 * - Has a located_at edge to its home settlement
 * - Gets a guild_hall sublocation spawned immediately
 * - Starts with wealth: 0
 *
 * @param graph - World graph (mutated in place)
 * @param locationIds - All location node IDs
 * @param seed - World seed for deterministic PRNG
 * @returns Array of created guild faction node IDs
 */
export function seedGuilds(
  graph: WorldGraph,
  locationIds: readonly string[],
  seed: number,
): string[] {
  const rng = mulberry32(seed);
  const guildIds: string[] = [];
  let guildIndex = 0;
  let edgeCounter = 0;

  for (const locId of locationIds) {
    const location = graph.getNode(locId);
    if (!location) continue;

    const subtype = location.properties.locationSubtype as string | undefined;
    if (!subtype || !GUILD_ELIGIBLE_SUBTYPES.has(subtype)) continue;

    const count = randomInRange(rng, GUILD_SPAWN_COUNT_MIN, GUILD_SPAWN_COUNT_MAX);

    for (let i = 0; i < count; i++) {
      const guildType = determineGuildType(locId, graph, rng);
      const guildId = `guild_${guildIndex}`;
      guildIndex++;

      // Build guild name: "The {LocationName} {suffix}"
      // Strip leading "The " to avoid "The The X" constructions
      const suffixes = GUILD_NAME_SUFFIXES[guildType];
      const suffix = suffixes[Math.floor(rng() * suffixes.length)];
      const strippedName = location.name.replace(/^The\s+/i, '');
      const guildName = `The ${strippedName} ${suffix}`;

      const profile = generateGuildAxiologicalProfile(guildType, rng);
      const caps = generateGuildDomainCapabilities(guildType, rng);

      // ── Create guild faction node ──────────────────────────────
      graph.addNode({
        id: guildId,
        type: 'actor',
        name: guildName,
        properties: {
          actorType: 'faction',
          guildType,
          axiologicalProfile: profile,
          domainCapabilities: caps,
          homeLocationId: locId,
          wealth: 0,
          displaced: false,
        },
      });
      guildIds.push(guildId);

      // ── located_at edge: guild → home settlement ───────────────
      graph.addEdge({
        id: `edge_guild_at_${guildId}`,
        source: guildId,
        target: locId,
        type: 'located_at',
        properties: { role: 'base_of_operations' },
      });

      // ── Guild Hall sublocation ─────────────────────────────────
      const hallSuffix = Math.floor(rng() * 1000000).toString(36);
      const hallId = `subloc.guild-hall-${guildId}-${hallSuffix}`;

      try {
        graph.addNode({
          id: hallId,
          type: 'location',
          name: `Guild Hall (${guildName})`,
          properties: {
            sublocationTypeId: 'sublocation-type.guild-hall',
            parentLocationId: locId,
            guildId,
            persistence: { type: 'permanent' },
          },
        });

        graph.addEdge({
          id: `edge_guild_hall_${guildId}_${edgeCounter++}`,
          source: locId,
          target: hallId,
          type: 'contains',
          properties: {},
        });
      } catch {
        // Fail-soft: sublocation creation failure does not crash seeding
      }
    }
  }

  return guildIds;
}
