/**
 * Exploration hook builder for the hex chronicle's ruins section (THR-1621).
 *
 * The ruins layer used to render one bullet per ruin descriptor through a
 * single fixed template, so three descriptors read as the same sentence three
 * times. A hex now gets at most one exploration line, naming its descriptors
 * together.
 */

/** How many ruin descriptors the exploration line names at most. */
export const MAX_EXPLORATION_DESCRIPTORS = 3;

/** Joins plural nouns as an English list: "a", "a and b", "a, b and c". */
function joinDescriptors(descriptors: readonly string[]): string {
  if (descriptors.length <= 1) return descriptors[0] ?? '';
  return `${descriptors.slice(0, -1).join(', ')} and ${descriptors[descriptors.length - 1]}`;
}

/**
 * Returns the hex's exploration lines — zero or one. Blank and duplicate
 * descriptors are dropped before the cap is applied.
 *
 * `underwater` (THR-2021): a water hex inside an old culture's territory sank
 * that culture's ruins — the line places them beneath the water instead of
 * describing them as if they stood on dry land.
 */
export function buildExplorationHooks(
  descriptors: readonly string[] | undefined | null,
  underwater = false,
): string[] {
  if (!descriptors) return [];
  const named = [...new Set(descriptors.map(d => d.trim()).filter(d => d.length > 0))]
    .slice(0, MAX_EXPLORATION_DESCRIPTORS);
  if (named.length === 0) return [];
  if (underwater) {
    return [
      `Beneath the water lie the ${joinDescriptors(named)} of an older age, drowned and never fully explored. What remains below may reward — or punish — the curious.`,
    ];
  }
  return [
    `The ${joinDescriptors(named)} have not been fully explored. What remains within may reward — or punish — the curious.`,
  ];
}
