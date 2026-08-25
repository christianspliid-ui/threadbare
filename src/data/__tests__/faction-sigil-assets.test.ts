import { describe, it, expect } from 'vitest';
import {
  getFactionSigilUrl,
  getFactionSigilUrlFromProperties,
  FACTION_SIGIL_RENDER_SIZE,
} from '../faction-sigil-assets';
import { ALL_FACTION_DEFINITIONS } from '../faction-definition-lookup';
import { FACTION_DEFINITIONS } from '../faction-definitions';
import { MONSTER_FACTION_DEFINITIONS } from '../monster-faction-definitions';

/** Decode a sigil data URI back to its SVG source. */
function svgOf(uri: string): string {
  return decodeURIComponent(uri.replace(/^data:image\/svg\+xml;charset=utf-8,/, ''));
}

describe('faction sigil registry — coverage', () => {
  // Pin the population: a per-faction loop over an accidentally-empty map would
  // report PASS while asserting nothing. Assert the roster is non-empty AND
  // that it holds every authored definition family.
  it('covers every registered faction definition', () => {
    expect(ALL_FACTION_DEFINITIONS.size).toBeGreaterThanOrEqual(12);
    expect(ALL_FACTION_DEFINITIONS.size).toBe(
      new Set([
        ...FACTION_DEFINITIONS.keys(),
        ...MONSTER_FACTION_DEFINITIONS.map((d) => d.id),
      ]).size,
    );

    const missing: string[] = [];
    for (const defId of ALL_FACTION_DEFINITIONS.keys()) {
      const uri = getFactionSigilUrl(defId);
      if (uri === null) missing.push(defId);
    }
    expect(missing).toEqual([]);
  });

  it('produces a well-formed SVG data URI', () => {
    const uri = getFactionSigilUrl('adventuring_guild');
    expect(uri).toMatch(/^data:image\/svg\+xml;charset=utf-8,/);

    const svg = svgOf(uri!);
    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
    expect(svg).toContain(`width="${FACTION_SIGIL_RENDER_SIZE}"`);
  });

  it('gives every registered faction distinct heraldry', () => {
    // THR-854. This is the ticket's Done-when, and it is a *predicate*, never a
    // count: no two entries of ALL_FACTION_DEFINITIONS may render the same
    // shield. Pinning "17 distinct of 20" — the pre-fix measurement — would rot
    // the next time a definition is added.
    //
    // The clip-path id is seeded from the definition id, so it differs for every
    // faction whether or not the *shield* does. Normalise it away, or this
    // asserts nothing (the URIs were always distinct; the heraldry was not).
    const byShield = new Map<string, string[]>();
    for (const defId of ALL_FACTION_DEFINITIONS.keys()) {
      const uri = getFactionSigilUrl(defId);
      expect(uri).not.toBeNull();
      const shield = svgOf(uri!).replace(/coa-clip-[A-Za-z0-9_-]+/g, 'coa-clip-NORMALISED');
      byShield.set(shield, [...(byShield.get(shield) ?? []), defId]);
    }

    // Report the colliding ids, not just a number — a bare count tells whoever
    // breaks this nothing about which two factions started claiming kinship.
    const collisions = [...byShield.values()]
      .filter((ids) => ids.length > 1)
      .map((ids) => ids.join(' == '));
    expect(collisions).toEqual([]);
    expect(byShield.size).toBe(ALL_FACTION_DEFINITIONS.size);
  });

  it('separates two factions that agree on their top two reaches', () => {
    // The specific pair that forced the bordure axis: the Thieves Guild and the
    // Underking's Court are both shadow-then-gold criminal factions, so nothing
    // above rank 3 tells them apart. Guards the tertiary axis directly — the
    // sweep above would still pass if some unrelated change happened to
    // differentiate them, and this would not.
    const thieves = svgOf(getFactionSigilUrl('thieves_guild')!);
    const underking = svgOf(getFactionSigilUrl('underking_court')!);
    const strip = (s: string) => s.replace(/coa-clip-[A-Za-z0-9_-]+/g, 'X');
    expect(strip(thieves)).not.toBe(strip(underking));
  });

  it('separates two factions differing only in how strongly they hold their second reach', () => {
    // adventuring_guild and rangers_brotherhood are both (eye, iron, guild) with
    // the same third reach; they differ only in that the Rangers' iron rivals
    // their eye and the Guild's does not. This is why THR-854 turned
    // SECONDARY_REACH_THRESHOLD into a weight rather than deleting it —
    // dropping it outright would have traded three collisions for this one.
    const adventuring = svgOf(getFactionSigilUrl('adventuring_guild')!);
    const rangers = svgOf(getFactionSigilUrl('rangers_brotherhood')!);
    const strip = (s: string) => s.replace(/coa-clip-[A-Za-z0-9_-]+/g, 'X');
    expect(strip(adventuring)).not.toBe(strip(rangers));
  });
});

describe('faction sigil registry — determinism (NFP #3)', () => {
  it('returns a byte-identical URI on repeated calls', () => {
    const a = getFactionSigilUrl('civic_guard');
    const b = getFactionSigilUrl('civic_guard');
    expect(a).toBe(b);
  });

  it('embeds a stable clip-path id rather than a per-call counter', () => {
    // Regression guard: generateCoatOfArmsSvg's default clip id is a module
    // counter, which would change the URI on every render and force the
    // browser to re-decode the <img>. The registry must seed it.
    const svg = svgOf(getFactionSigilUrl('thieves_guild')!);
    expect(svg).toContain('coa-clip-criminal-thieves_guild');
  });
});

describe('faction sigil registry — fail-soft (NFP #4)', () => {
  it('returns null for an unknown definition id', () => {
    expect(getFactionSigilUrl('no_such_faction')).toBeNull();
  });

  it('returns null for null/undefined/empty input', () => {
    expect(getFactionSigilUrl(null)).toBeNull();
    expect(getFactionSigilUrl(undefined)).toBeNull();
    expect(getFactionSigilUrl('')).toBeNull();
  });

  it('returns null for absent properties', () => {
    expect(getFactionSigilUrlFromProperties(undefined)).toBeNull();
    expect(getFactionSigilUrlFromProperties({})).toBeNull();
  });
});

/**
 * The population that matters. A seeded world holds ~49 faction actors and only
 * ~13 carry a `factionDefId`; the rest are procedurally generated and carry
 * their reach profile as `domainCapabilities`. A registry that only answered
 * for definition-backed factions would have covered ~27% of what a player can
 * open, while every definition-keyed test above still passed.
 */
describe('faction sigil registry — procedurally generated factions', () => {
  const generatedProps = {
    actorType: 'faction',
    domainCapabilities: {
      iron: 49, gold: 36, shadow: 28, veil: 12,
      heart: 29, eye: 10, stone: 13, star: 67,
    },
  };

  it('derives heraldry from domainCapabilities when there is no factionDefId', () => {
    const url = getFactionSigilUrlFromProperties(generatedProps, 'faction_0');
    expect(url).toMatch(/^data:image\/svg\+xml;charset=utf-8,/);
  });

  it('picks the dominant reach as the charge (star, the highest capability)', () => {
    const svg = svgOf(getFactionSigilUrlFromProperties(generatedProps, 'faction_0')!);
    // star → time sphere → #ffb355. Presence of that colour proves the
    // dominant-reach derivation ran off domainCapabilities.
    expect(svg.toLowerCase()).toContain('#ffb355');
  });

  it('keys the cache and clip id per node, not per definition', () => {
    const a = getFactionSigilUrlFromProperties(generatedProps, 'guild_30');
    const b = getFactionSigilUrlFromProperties(
      { ...generatedProps, domainCapabilities: { ...generatedProps.domainCapabilities, star: 1 } },
      'guild_31',
    );
    expect(a).not.toBe(b);
    expect(svgOf(a!)).toContain('guild_30');
    expect(svgOf(b!)).toContain('guild_31');
  });

  it('returns null without a nodeId, since the result could not be cached safely', () => {
    expect(getFactionSigilUrlFromProperties(generatedProps)).toBeNull();
  });

  it('returns null when the node carries no reach profile at all', () => {
    expect(getFactionSigilUrlFromProperties({ actorType: 'faction' }, 'faction_9')).toBeNull();
  });

  it('is deterministic for the same node', () => {
    const a = getFactionSigilUrlFromProperties(generatedProps, 'faction_7');
    const b = getFactionSigilUrlFromProperties(generatedProps, 'faction_7');
    expect(a).toBe(b);
  });
});

describe('faction sigil registry — property resolution', () => {
  it('prefers a bespoke sigilAssetPath', () => {
    const url = getFactionSigilUrlFromProperties({
      factionDefId: 'thieves_guild',
      sigilAssetPath: '/assets/factions/hand-painted.jpg',
    });
    expect(url).toBe('/assets/factions/hand-painted.jpg');
  });

  it('ignores a blank sigilAssetPath and falls through to generated heraldry', () => {
    const url = getFactionSigilUrlFromProperties({
      factionDefId: 'thieves_guild',
      sigilAssetPath: '   ',
    });
    expect(url).toMatch(/^data:image\/svg\+xml/);
  });

  it('resolves from factionDefId alone', () => {
    const url = getFactionSigilUrlFromProperties({ factionDefId: 'arcane_circle' });
    expect(url).toBe(getFactionSigilUrl('arcane_circle'));
  });
});
