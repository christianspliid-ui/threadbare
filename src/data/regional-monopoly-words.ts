/**
 * Regional monopolies and embargo — the words the player reads (THR-1955, war aims S2
 * § Player-facing text; THR-1870's decided words).
 *
 * Words only, never a share or a count (UI Law 13). An embargo cuts one good, so the road
 * line names it ("no salt moves on it"): people and armies still pass (Game Design Law 45).
 */

export const MONOPOLY_WORDS = {
  /** The Purse panel chip, one per good held: "Holds the region's salt". */
  chip: "Holds the region's {good}",
  /** Trade lens hover: an embargoed road. */
  embargoed: 'Embargoed by {holder}: no {good} moves on it.',
  /** Trade lens hover: a tolled road (`controlledBy` on the lane). */
  tolled: 'Tolled by {holder}.',
  /** Trade lens hover: a good the road carries is held in this region. */
  holds: '{holder} holds the {good} of this region.',
  /** Trade lens legend mark. */
  legendEmbargoed: 'Embargoed road',
} as const;

/** Fill `{slot}` placeholders; a missing slot keeps its braces out of the text. */
export function fillMonopolyWords(template: string, slots: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, k: string) => slots[k] ?? '');
}
