/**
 * Schism content — chronicle prose, splinter naming templates, and faction-
 * type defaults for the deferred-resolution divine action (THR-430).
 *
 * Plant beat: a single line that surfaces in the chronicle when the player
 * casts action.faction.schism. The crisis is real, but the outcome is
 * deferred.
 *
 * Resolution beats: two outcome lines — one for the reform branch, one for
 * the split branch — selected by phaseSchismResolution.
 *
 * Splinter naming: a small table keyed by (factionType, dominantReach) that
 * gives the breakaway faction a name fitting its parent's character and the
 * axis of disagreement. Fallback is `"${parentName} — Schismatics"`.
 */

/** Player-read prose surfaced in the chronicle when a schism is planted. */
export const SCHISM_PLANT_CHRONICLE_TEMPLATE =
  'A schism brews inside {factionName}. Two truths surface where there was one — the crisis is real now.';

/** Chronicle prose for the reform branch. */
export const SCHISM_REFORM_CHRONICLE_TEMPLATE =
  '{factionName} pulls back from the edge. {expelledCount} voice{plural} are gone in the morning. The doctrine still holds — narrower than it was.';

/** Chronicle prose for the split branch. */
export const SCHISM_SPLIT_CHRONICLE_TEMPLATE =
  '{factionName} fractures. Where there was one doctrine, two now stand. {splinterName} walks out the door it built.';

/**
 * Splinter-name templates keyed by (factionType, dominantReach).
 *
 * factionType matches the `factionType` property on faction actor nodes
 * (e.g. 'guild', 'religious', 'mercantile'). The reach key is the highest-
 * spread reach across faction members at resolution time — the axis of
 * disagreement that produced the split.
 *
 * If a (type, reach) pair is not in the table, falls back to the per-type
 * default; if the type is unknown, falls back to "${parentName} — Schismatics".
 */
export const SCHISM_SPLINTER_NAME_TEMPLATES: Record<string, Record<string, string>> = {
  guild: {
    iron: 'The Sundered Hand',
    gold: 'The Lesser Coin',
    stone: 'The Lower Workshop',
    eye: 'The Quiet Records',
    star: 'The Vacated Tower',
    spirit: 'The Open Forge',
    shadow: 'The Backroom Pact',
    heart: 'The Broken Chair',
    horn: 'The Other Hall',
  },
  religious: {
    star: 'The Second Star',
    spirit: 'The Lesser Communion',
    heart: 'The Heretic Cloister',
    shadow: 'The Hidden Choir',
    eye: 'The Quiet Witnesses',
    gold: 'The Mendicant Order',
    iron: 'The Reformed Sword',
    stone: 'The Outer Chapel',
    horn: 'The Schismatic Voice',
  },
  mercantile: {
    gold: 'The Lesser Coin',
    iron: 'The Other Warehouse',
    horn: 'The Open Market',
    star: 'The Speculators',
    eye: 'The Discreet Ledger',
    shadow: 'The Grey Ship',
    heart: 'The Honest Stall',
    spirit: 'The Pilgrim Caravan',
    stone: 'The Lower Quay',
  },
  martial: {
    iron: 'The Reformed Sword',
    horn: 'The Broken Line',
    stone: 'The Lower Garrison',
    heart: 'The Mutiny',
    star: 'The Vexed Captains',
    eye: 'The Reconnaissance',
    spirit: 'The Oath-Breakers',
    shadow: 'The Detached Company',
    gold: 'The Hireling Company',
  },
  political: {
    heart: 'The Other Bench',
    horn: 'The Loyal Opposition',
    star: 'The Reformist Caucus',
    shadow: 'The Cabal',
    eye: 'The Whip\'s Hand',
    iron: 'The Hard Faction',
    gold: 'The Patronage',
    stone: 'The Backbench',
    spirit: 'The Conscience Party',
  },
};

/** Per-faction-type default when no (type, reach) entry matches. */
export const SCHISM_SPLINTER_NAME_TYPE_DEFAULTS: Record<string, string> = {
  guild: 'The Sundered Hand',
  religious: 'The Schismatic Voice',
  mercantile: 'The Lesser Coin',
  martial: 'The Broken Line',
  political: 'The Loyal Opposition',
};

/**
 * Generate a splinter-faction name from the parent's type, the axis of
 * disagreement (reach), and the parent's display name. Fully deterministic.
 */
export function generateSplinterName(
  parentName: string,
  factionType: string | undefined,
  dominantReach: string | undefined,
): string {
  if (factionType && dominantReach) {
    const typeTable = SCHISM_SPLINTER_NAME_TEMPLATES[factionType];
    if (typeTable && typeTable[dominantReach]) return typeTable[dominantReach];
  }
  if (factionType && SCHISM_SPLINTER_NAME_TYPE_DEFAULTS[factionType]) {
    return SCHISM_SPLINTER_NAME_TYPE_DEFAULTS[factionType];
  }
  return `${parentName} — Schismatics`;
}

/** Format the plant chronicle line. */
export function formatSchismPlantChronicle(factionName: string): string {
  return SCHISM_PLANT_CHRONICLE_TEMPLATE.replace('{factionName}', factionName);
}

/** Format the reform chronicle line. */
export function formatSchismReformChronicle(factionName: string, expelledCount: number): string {
  return SCHISM_REFORM_CHRONICLE_TEMPLATE
    .replace('{factionName}', factionName)
    .replace('{expelledCount}', String(expelledCount))
    .replace('{plural}', expelledCount === 1 ? '' : 's');
}

/** Format the split chronicle line. */
export function formatSchismSplitChronicle(factionName: string, splinterName: string): string {
  return SCHISM_SPLIT_CHRONICLE_TEMPLATE
    .replace('{factionName}', factionName)
    .replace('{splinterName}', splinterName);
}
