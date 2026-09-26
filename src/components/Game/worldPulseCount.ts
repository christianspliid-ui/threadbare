import type { WorldGraph } from '../../engine/graph';
import { isMonster } from '../../engine/monsters/isMonster';

/**
 * The "active agents" count: living mortals only (THR-1550). A lair's monster
 * is an `individual` actor, and so is every mortal who has died and been kept
 * for the chronicle — neither is part of the world's living population.
 */
export function countLivingMortals(graph: WorldGraph): number {
  return graph.getNodesByType('actor')
    .filter(node => node.properties?.actorType === 'individual'
      && !isMonster(node)
      && node.properties.deceased !== true)
    .length;
}
