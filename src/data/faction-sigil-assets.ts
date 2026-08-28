/**
 * Faction Sigil Registry (THR-638, faction batch) — maps a faction definition ID
 * to the heraldic sigil that represents that faction on every detail surface.
 *
 * Mirrors the `portrait-assets.ts` contract — `(key) => string | null`, null
 * meaning "no sigil, render the designed fallback tile" — so
 * `resolveEntityVisual` picks it up as one added branch with zero component
 * changes.
 *
 * **The sigils are generated, not painted.** The repo already carries a full
 * procedural heraldry system (`components/icons/CoatOfArms.tsx` + `heraldry/`:
 * shields, divisions, charges, borders, tinctures) that derives a coat of arms
 * from a faction's own `reachWeights`, `factionType` and sphere alignment. It
 * has been rendering army sprites on the hex map since the war system landed.
 * Painting twelve static banner plates instead would have (a) duplicated that
 * vocabulary in a second, drifting form, and (b) covered only the twelve
 * authored definitions. That second point is the load-bearing one: a seeded
 * world holds ~49 faction actors and only ~13 carry a `factionDefId` — the
 * other ~36 are procedurally generated (`guild_N`, `faction_N`). A
 * definition-keyed registry, painted or generated, would therefore have missed
 * roughly three quarters of the factions a player can actually open. Hence the
 * property-backed tier below, which derives heraldry from whatever reach
 * profile the node itself carries.
 *
 * NFP #1 (tunability): sigil geometry lives in `icons/constants.ts` +
 *   `heraldry/`; the only number here is the render size.
 * NFP #3 (determinism): same faction ⇒ byte-identical data URI, every call.
 *   The memo below also makes it referentially identical, so an `<img src>`
 *   built from it never changes identity across renders.
 * NFP #4 (fail-soft): unknown id, malformed definition, or a generator throw
 *   all return null — the caller renders the fallback tile.
 */

import {
  generateCoatOfArmsSvg,
  buildCoatOfArmsConfig,
  buildCoatOfArmsConfigFromWeights,
} from '../components/icons';
import type { CoatOfArmsConfig } from '../components/icons';
import type { FactionDefinition } from '../types/faction';
import { getFactionDefinition } from './faction-definition-lookup';

/**
 * Render width in px for a sigil data URI. The shield viewBox is 120×150, so
 * this yields a 256×320 image — enough for the largest detail-surface header
 * without inflating the URI, and comfortably above `SMALL_SIZE_THRESHOLD` (32)
 * so the secondary-reach charge is included.
 */
export const FACTION_SIGIL_RENDER_SIZE = 256;

/**
 * Cache of definition ID → data URI (or null). Sigil generation is pure string
 * building, but it runs per detail-surface render; memoising keeps both the
 * cost and the string identity stable.
 */
const sigilCache = new Map<string, string | null>();

/** Build the `data:image/svg+xml` URI for one faction definition. */
function buildSigilDataUri(factionDefId: string): string | null {
  const definition = getFactionDefinition(factionDefId);
  if (!definition) return null;

  try {
    const config = buildCoatOfArmsConfig(definition, definition.iconGlyph);
    // Stable clip-path seed: the SVG becomes its own document inside the data
    // URI, so the id cannot collide, and seeding it keeps the URI byte-stable.
    const svg = generateCoatOfArmsSvg(config, FACTION_SIGIL_RENDER_SIZE, factionDefId);
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  } catch {
    // Fail-soft: a malformed definition must not break a modal render.
    return null;
  }
}

/**
 * Get the sigil data URI for a faction definition ID, or null if none.
 *
 * Knowledge-gating is NOT done here — factions are not knowledge-gated (intel
 * is additive, never subtractive), and the resolver gates person kinds only.
 */
export function getFactionSigilUrl(factionDefId: string | null | undefined): string | null {
  if (!factionDefId) return null;

  // Only a *successful* build is cached (THR-1322). A miss is recomputed on
  // every call, because the definition set grows during a run — an id asked for
  // before `strategic_found_order` charters it resolves to null, and a cached
  // null would outlive the founding and pin that order to a blank shield for
  // the rest of the session. The recomputation is a map miss and a return; the
  // expensive half (SVG string building) still only runs on a hit.
  const cached = sigilCache.get(factionDefId);
  if (cached != null) return cached;

  const uri = buildSigilDataUri(factionDefId);
  if (uri !== null) sigilCache.set(factionDefId, uri);
  return uri;
}

/**
 * Default faction type for a procedurally generated faction that carries no
 * `factionType` property. Selects the shield division only; `guild` is the
 * majority shape in a seeded world (~34 of 36 undefined-type factions are
 * `guild_N` nodes).
 */
const DEFAULT_GENERATED_FACTION_TYPE: FactionDefinition['factionType'] = 'guild';

/** SVG ids allow far more than this, but keeping the seed conservative avoids escaping. */
function sanitizeSeed(id: string): string {
  return id.replace(/[^A-Za-z0-9_-]/g, '-');
}

/**
 * Build a coat-of-arms config from raw faction-node properties, for a faction
 * with no `factionDefId`.
 *
 * Procedurally generated factions carry their reach profile as
 * `domainCapabilities` — the same `reach → number` shape `reachWeights` has —
 * so the same heraldry derives from it.
 */
function configFromProperties(
  properties: Record<string, unknown>,
): CoatOfArmsConfig | null {
  const caps = properties.domainCapabilities;
  if (!caps || typeof caps !== 'object') return null;

  const factionType =
    typeof properties.factionType === 'string'
      ? (properties.factionType as FactionDefinition['factionType'])
      : DEFAULT_GENERATED_FACTION_TYPE;

  return buildCoatOfArmsConfigFromWeights(
    caps as Record<string, number>,
    factionType,
  );
}

/**
 * Resolve a sigil URL from persisted faction-node properties.
 *
 * Three tiers, in order:
 *   1. `sigilAssetPath` — a bespoke hand-painted banner, should one ever be
 *      authored for a marquee faction. Mirrors how a bespoke portrait wins
 *      over the archetype registry in `portrait-assets.ts`.
 *   2. `factionDefId` — heraldry from the registered `FactionDefinition`.
 *   3. `domainCapabilities` — heraldry derived straight from the node's reach
 *      profile, for the procedurally generated majority that has no definition.
 *
 * @param nodeId  the faction node's id, used as the cache key and clip-path
 *   seed for tier 3 (whose heraldry is per-node, not per-definition). Omit and
 *   tier 3 is skipped, since an unkeyed result could not be cached safely.
 */
export function getFactionSigilUrlFromProperties(
  properties: Record<string, unknown> | undefined,
  nodeId?: string,
): string | null {
  if (!properties) return null;

  const bespoke = properties.sigilAssetPath;
  if (typeof bespoke === 'string' && bespoke.trim().length > 0) {
    return bespoke;
  }

  const factionDefId = properties.factionDefId;
  if (typeof factionDefId === 'string') {
    const fromDefinition = getFactionSigilUrl(factionDefId);
    if (fromDefinition) return fromDefinition;
  }

  if (!nodeId) return null;

  const cacheKey = `node:${nodeId}`;
  const cached = sigilCache.get(cacheKey);
  if (cached !== undefined) return cached;

  let uri: string | null = null;
  try {
    const config = configFromProperties(properties);
    if (config) {
      const svg = generateCoatOfArmsSvg(
        config,
        FACTION_SIGIL_RENDER_SIZE,
        sanitizeSeed(nodeId),
      );
      uri = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    }
  } catch {
    // Fail-soft: a malformed property bag must not break a modal render.
    uri = null;
  }

  sigilCache.set(cacheKey, uri);
  return uri;
}
