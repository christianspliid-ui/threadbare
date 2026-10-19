/**
 * knowledge — the seen floor's hex rule (THR-1822 § D5), the part the map lenses need.
 *
 * A lens never puts a mark or a hover line on a hex the player has not explored: fog
 * covers lens objects in the scene (render order below FOG), and the view model keeps
 * them off unexplored hexes too — two guards for one rule (THR-1878 plan § D3).
 *
 * Fails open: with no visibility map, or an empty one (a test world), every hex
 * counts as known. With fog off the caller passes an empty map (`hexLensViewSelector`'s
 * `fogOff`), because the real fog underneath is still populated.
 */
import type { GameState } from '../../types/gameState';

/**
 * THR-1914 (Inspector plan § D9) — the surfaces that ask the seen floor's hex rule. Each
 * one is a place the player could otherwise learn what fog hides: a lens mark, or a card's
 * lit target while it is armed. The rule is the same for every surface; the list names
 * who reads it, so a new reader is one entry (Law 58).
 */
export type KnowledgeSurface = 'lensMarks' | 'armedTargets';

export const KNOWLEDGE_SURFACES: readonly KnowledgeSurface[] = ['lensMarks', 'armedTargets'];

/** Whether the player may be shown things on this hex ("col,row"). */
export function isHexKnown(state: Pick<GameState, 'visibilityMap'>, key: string): boolean {
  const map = state.visibilityMap;
  if (!map || typeof map.get !== 'function' || map.size === 0) return true;
  const entry = map.get(key);
  return !!entry && entry.state !== 'unexplored';
}

/** The hex rule, asked by a named surface. Every surface reads the one rule today. */
export function isHexKnownFor(_surface: KnowledgeSurface, state: Pick<GameState, 'visibilityMap'>, key: string): boolean {
  return isHexKnown(state, key);
}
