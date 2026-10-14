/**
 * battleHexLine.ts — the words behind a siege ring or a battle sprite (THR-1847).
 *
 * The map draws a siege as an orange ring and a field battle as crossed swords
 * (BattleIndicatorLayer). Law 1 wants the concept in words too, and Law 17 wants
 * those words from the one registry: the lead word is the `ui.siege` / `ui.battle`
 * label, resolved through `resolveTooltip`, never inline copy.
 *
 * Pure: battle indicator entries in, one line per battle on the hex out.
 */

import { resolveTooltip } from '../../../engine/tooltipResolver';
import { FIELD_BATTLE_COLOR, SIEGE_COLOR } from '../scene/BattleIndicatorLayer';
import type { BattleIndicatorData } from '../scene/BattleIndicatorLayer';

export const BATTLE_TOOLTIP_IDS = {
  siege: 'ui.siege',
  battle: 'ui.battle',
} as const;

/** Fail-soft lead words if the registry ever loses an entry — never an id. */
const FALLBACK_WORD = { siege: 'Under siege', battle: 'Battle' } as const;

/** One hex-tooltip line: the registry word in the marker's colour, then the sides. */
export interface BattleHexLine {
  id: string;
  isSiege: boolean;
  /** The registry label — "Under siege" / "Battle". */
  word: string;
  /** The rest of the sentence after the word: " by The Iron Pact", or "". */
  rest: string;
  /** The marker's colour, so the word reads as the ring's / swords' name. */
  color: string;
}

/** "Under siege by X" · "Battle between X and Y" · "Battle with X" · the word alone. */
export function battleHexLine(entry: BattleIndicatorData): BattleHexLine {
  const kind = entry.isSiege ? 'siege' : 'battle';
  const word = resolveTooltip(BATTLE_TOOLTIP_IDS[kind])?.label ?? FALLBACK_WORD[kind];
  let rest = '';
  if (entry.isSiege) {
    if (entry.attackerName) rest = ` by ${entry.attackerName}`;
  } else if (entry.attackerName && entry.defenderName) {
    rest = ` between ${entry.attackerName} and ${entry.defenderName}`;
  } else if (entry.attackerName || entry.defenderName) {
    rest = ` with ${entry.attackerName ?? entry.defenderName}`;
  }
  return {
    id: entry.id,
    isSiege: entry.isSiege,
    word,
    rest,
    color: entry.isSiege ? SIEGE_COLOR : FIELD_BATTLE_COLOR,
  };
}

/** Every battle or siege standing on (col, row), as tooltip lines. */
export function battleHexLines(
  battles: readonly BattleIndicatorData[] | undefined,
  col: number,
  row: number,
): BattleHexLine[] {
  if (!battles || battles.length === 0) return [];
  return battles.filter(b => b.hexCol === col && b.hexRow === row).map(battleHexLine);
}
