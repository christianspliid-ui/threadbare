/**
 * The monster card — written at mint, hardened at legendary
 * (THR-1544, plan doc `Docs/plans/2026-09-23-monsters-as-opponents.md` § Engine 1–2).
 *
 * `createNamedElite` calls `mintMonsterCard` on the elite it just placed; the major →
 * legendary escalation calls `hardenMonsterCard` on the lair's elite. Both write the one
 * typed bag `properties.monsterState` (`MonsterState`), which the fight block's
 * `readOpponentCard` reads. The clock is otherwise written only by `advanceFightClock`.
 *
 * ─── Fail-soft ──────────────────────────────────────────────────
 * | Failure case                                  | Fallback                                         |
 * |-----------------------------------------------|--------------------------------------------------|
 * | Lair `dominantSphere` missing or foundation    | `MONSTER_FAMILY_FALLBACK`; trace `fellBack: true` |
 * | Temper trait definition missing from the graph | Mint without the edge; the fight reads stubborn  |
 * | Hardening finds no elite, or no card           | Skip; nothing is written                         |
 *
 * ─── PRNG ───────────────────────────────────────────────────────
 * None. The family comes from the lair's sphere; the card is a table row.
 */

import type { WorldGraph } from '../graph';
import type { GraphNode } from '../../types/graph';
import type { FightRatingWord } from '../../types/fight';
import type { MonsterState } from '../../types/monster';
import {
  MONSTER_CLOCK_BY_TIER,
  MONSTER_LEGENDARY_DREAD_STEP,
  monsterFamilyForSphere,
} from '../../data/monster-families';
import { temperTraitId } from '../../data/temper-trait-content';
import { FIGHT_RATING_WORDS } from '../../data/fight-constants';
import { assignTrait } from '../traits';
import { emitTrace } from '../traceBuffer';

/** The `assignTrait` source recorded on a temper edge written at mint. */
export const MONSTER_TEMPER_TRAIT_SOURCE = 'monster_mint';

/** Shift a rating word by `steps`, clamped to the word scale (gentle … severe). */
function shiftWord(word: FightRatingWord, steps: number): FightRatingWord {
  const index = FIGHT_RATING_WORDS.indexOf(word);
  const from = index < 0 ? FIGHT_RATING_WORDS.indexOf('fair') : index;
  const next = Math.max(0, Math.min(FIGHT_RATING_WORDS.length - 1, from + steps));
  return FIGHT_RATING_WORDS[next];
}

/**
 * Write the card and the temper edge on a freshly minted elite. Returns the card.
 * Idempotent on the edge (`assignTrait` skips an existing one); the card is
 * overwritten, since a mint is the card's first write.
 */
export function mintMonsterCard(
  graph: WorldGraph,
  eliteId: string,
  lairNode: GraphNode,
  tick: number,
): MonsterState | null {
  const elite = graph.getNode(eliteId);
  if (!elite) return null;

  const { family, fellBack } = monsterFamilyForSphere(lairNode.properties.dominantSphere);
  const card: MonsterState = {
    family: family.id,
    dread: family.dread,
    might: family.might,
    nerveReach: family.nerveReach,
    clashReach: family.clashReach,
    clockSize: MONSTER_CLOCK_BY_TIER.major,
    clockFilled: 0,
    clockUpdatedTick: tick,
    temperShown: false,
  };
  graph.updateNode(eliteId, { properties: { ...elite.properties, monsterState: card } });

  const traitId = temperTraitId(family.temper);
  const hasDefinition = graph.getNode(traitId) !== undefined;
  if (hasDefinition) {
    assignTrait(graph, eliteId, traitId, { tick, source: MONSTER_TEMPER_TRAIT_SOURCE });
  }

  emitTrace({
    category: 'monster.minted',
    tick,
    agentId: eliteId,
    summary: `${elite.name} minted as ${family.id} (${card.dread}/${card.might}, clock ${card.clockSize}, ${family.temper})`
      + (fellBack ? ' — foundation-sphere lair, fell back' : '')
      + (hasDefinition ? '' : ' — temper definition missing, no edge'),
    monsterId: eliteId,
    lairId: lairNode.id,
    family: family.id,
    dread: card.dread,
    might: card.might,
    clockSize: card.clockSize,
    temper: hasDefinition ? traitId : '',
    fellBack,
  } as Parameters<typeof emitTrace>[0]);

  return card;
}

/**
 * Harden the lair's monster when the lair goes legendary: the clock grows to
 * `MONSTER_CLOCK_BY_TIER.legendary`, Dread rises `MONSTER_LEGENDARY_DREAD_STEP` words
 * (capped at severe), and `clockFilled` is kept — wounds outlast the den's growth.
 * Returns the hardened card, or null when there was nothing to harden.
 */
export function hardenMonsterCard(
  graph: WorldGraph,
  lairNode: GraphNode,
  tick: number,
): MonsterState | null {
  const eliteId = lairNode.properties.namedEliteId;
  if (typeof eliteId !== 'string') return null;
  const elite = graph.getNode(eliteId);
  if (!elite) return null;
  const bag = elite.properties.monsterState as MonsterState | undefined;
  if (!bag || typeof bag !== 'object') return null;

  const card: MonsterState = {
    ...bag,
    clockSize: Math.max(bag.clockSize ?? 0, MONSTER_CLOCK_BY_TIER.legendary),
    dread: shiftWord(bag.dread, MONSTER_LEGENDARY_DREAD_STEP),
  };
  graph.updateNode(eliteId, { properties: { ...elite.properties, monsterState: card } });

  emitTrace({
    category: 'monster.hardened',
    tick,
    agentId: eliteId,
    summary: `${elite.name} hardened with its lair: clock ${card.clockSize}, dread ${card.dread}`,
    monsterId: eliteId,
    lairId: lairNode.id,
    clockSize: card.clockSize,
    dread: card.dread,
  } as Parameters<typeof emitTrace>[0]);

  return card;
}
