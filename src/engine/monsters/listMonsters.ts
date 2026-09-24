/**
 * `listMonsters` — every lair monster in the world with its card, for the debug bridge
 * (`window.__DEBUG.listMonsters()`) and the CLI (`monsters`)
 * (THR-1544, plan doc `Docs/plans/2026-09-23-monsters-as-opponents.md` § Debug inspection).
 *
 * **The return shape is pinned** — plan doc 4's review route and plan doc 6's
 * `huntedBy[]` build on it. Slain monsters are listed too, flagged `deceased`.
 *
 * `cardMissing` is the M1 kill criterion made visible: a monster node with no
 * `monsterState` means the mint path is incomplete. It is extra to the pinned shape.
 */

import type { WorldGraph } from '../graph';
import type { FightRatingWord, FightTemper } from '../../types/fight';
import type { MonsterFamilyId, MonsterState } from '../../types/monster';
import { isMonster } from './isMonster';
import { readTemper } from '../fights/opponentCard';

/** One monster row (plan doc 3 § Debug inspection — pinned). */
export interface ListedMonster {
  readonly id: string;
  readonly name: string;
  readonly lairId: string;
  readonly lairTier: 'major' | 'legendary' | 'cleared';
  readonly family: MonsterFamilyId;
  readonly dread: FightRatingWord;
  readonly might: FightRatingWord;
  readonly clockSize: number;
  readonly clockFilled: number;
  readonly temper: FightTemper;
  readonly temperShown: boolean;
  readonly deceased: boolean;
  /** True when the node is a monster but carries no card (the M1 kill criterion). */
  readonly cardMissing: boolean;
}

function lairTierOf(graph: WorldGraph, lairId: string): ListedMonster['lairTier'] {
  const lair = graph.getNode(lairId);
  if (!lair) return 'cleared';
  if (lair.properties.locationSubtype === 'cleared_lair') return 'cleared';
  return lair.properties.lairTier === 'legendary' ? 'legendary' : 'major';
}

/** Every monster in the graph, ordered by id (NFP #3). */
export function listMonsters(graph: WorldGraph): ListedMonster[] {
  const rows: ListedMonster[] = [];
  const actors = [...graph.getNodesByType('actor')].sort((a, b) => a.id.localeCompare(b.id));
  for (const node of actors) {
    if (!isMonster(node)) continue;
    const props = node.properties as Record<string, unknown>;
    const card = props.monsterState as MonsterState | undefined;
    const lairId = typeof props.lairId === 'string' ? props.lairId : '';
    rows.push({
      id: node.id,
      name: node.name ?? node.id,
      lairId,
      lairTier: lairTierOf(graph, lairId),
      family: card?.family ?? 'beast',
      dread: card?.dread ?? 'fair',
      might: card?.might ?? 'fair',
      clockSize: card?.clockSize ?? 0,
      clockFilled: card?.clockFilled ?? 0,
      temper: readTemper(graph, node.id),
      temperShown: card?.temperShown === true,
      deceased: props.deceased === true,
      cardMissing: card == null,
    });
  }
  return rows;
}
