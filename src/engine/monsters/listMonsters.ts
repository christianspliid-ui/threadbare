/**
 * `listMonsters` — every lair monster in the world with its card, for the debug bridge
 * (`window.__DEBUG.listMonsters()`) and the CLI (`monsters`)
 * (THR-1544, plan doc `Docs/plans/2026-09-23-monsters-as-opponents.md` § Debug inspection).
 *
 * **The return shape is pinned** — plan doc 4's review route and plan doc 6's
 * `huntedBy[]` build on it. Slain monsters are listed too, flagged `deceased`.
 *
 * `huntedBy` (THR-1560, plan doc 6) lists the mortals with an active hunt on each
 * monster, each with the door that admitted it (`blood_drawn`, `grievance`,
 * `threat_radius`, or `motive` when the social gate did). It reads the projects the
 * caller passes; without them every list is empty.
 *
 * `cardMissing` is the M1 kill criterion made visible: a monster node with no
 * `monsterState` means the mint path is incomplete. It is extra to the pinned shape.
 */

import type { WorldGraph } from '../graph';
import type { FightRatingWord, FightTemper } from '../../types/fight';
import type { MonsterFamilyId, MonsterState } from '../../types/monster';
import { isMonster } from './isMonster';
import { readTemper } from '../fights/opponentCard';
import { huntReason, type HuntReason } from './hunts';

/** One hunter on a monster (THR-1560): an active `cell.destroy.monster` or `cell.observe.monster` project. */
export interface MonsterHunter {
  readonly hunterId: string;
  readonly hunterName: string;
  /** `hunt` for the destroy cell, `track` for the observe cell. */
  readonly work: 'hunt' | 'track';
  /** The door that admits the hunter today, or `motive` when only the social gate does. */
  readonly reason: HuntReason | 'motive';
  readonly projectId: string;
}

/** The slice of a strategic project `huntedBy` reads — kept structural so the CLI and the bridge pass state as-is. */
export interface HuntProjectView {
  readonly projectId: string;
  readonly actorId: string;
  readonly templateId: string;
  readonly status: string;
  readonly objectTypeId?: string;
  readonly objectHandle?: { readonly kind: string; readonly nodeId?: string };
}

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
  /** The mortals with an active hunt or tracking project on it (THR-1560). */
  readonly huntedBy: readonly MonsterHunter[];
}

/** Active monster-object projects, grouped by the monster they act on. */
function huntersByMonster(graph: WorldGraph, projects: readonly HuntProjectView[]): Map<string, MonsterHunter[]> {
  const out = new Map<string, MonsterHunter[]>();
  for (const p of projects) {
    if (p.status !== 'active' || p.objectTypeId !== 'monster') continue;
    const monsterId = p.objectHandle?.kind === 'node' ? p.objectHandle.nodeId : undefined;
    if (!monsterId) continue;
    const list = out.get(monsterId) ?? [];
    list.push({
      hunterId: p.actorId,
      hunterName: graph.getNode(p.actorId)?.name ?? p.actorId,
      work: p.templateId.startsWith('cell.observe.') ? 'track' : 'hunt',
      reason: huntReason(graph, p.actorId, monsterId) ?? 'motive',
      projectId: p.projectId,
    });
    out.set(monsterId, list);
  }
  for (const list of out.values()) list.sort((a, b) => a.hunterId.localeCompare(b.hunterId) || a.projectId.localeCompare(b.projectId));
  return out;
}

function lairTierOf(graph: WorldGraph, lairId: string): ListedMonster['lairTier'] {
  const lair = graph.getNode(lairId);
  if (!lair) return 'cleared';
  if (lair.properties.locationSubtype === 'cleared_lair') return 'cleared';
  return lair.properties.lairTier === 'legendary' ? 'legendary' : 'major';
}

/** Every monster in the graph, ordered by id (NFP #3). */
export function listMonsters(graph: WorldGraph, projects: readonly HuntProjectView[] = []): ListedMonster[] {
  const rows: ListedMonster[] = [];
  const hunters = huntersByMonster(graph, projects);
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
      huntedBy: hunters.get(node.id) ?? [],
    });
  }
  return rows;
}
