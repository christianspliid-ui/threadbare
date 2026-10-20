/**
 * knowledge — the seen floor (THR-1822 § D5): what a surface may name.
 *
 * **The hex rule** (the part the map lenses and the armed card need): a lens never puts
 * a mark or a hover line on a hex the player has not explored. Fog covers lens objects in
 * the scene (render order below FOG), and the view model keeps them off unexplored hexes
 * too — two guards for one rule (THR-1878 plan § D3).
 *
 * **The whole floor** (THR-1915, THR-1832 § 2): Find is the one surface that can name a
 * thing from nowhere, so it asks `createSeenFloor` whether each thing may be named at all.
 * A thing the god has never seen is simply absent — a miss on an unseen name reads exactly
 * like a miss on a name that does not exist.
 *
 * Fails open: with no visibility map, or an empty one (a test world), every hex counts as
 * known and everything is nameable. With fog off the caller passes an empty map
 * (`hexLensViewSelector`'s `fogOff`), because the real fog underneath is still populated.
 */
import type { GameState } from '../../types/gameState';
import type { GraphNode } from '../../types/graph';
import type { KnowledgeLevel } from '../../types/familiarity';
import { KNOWLEDGE_LEVELS } from '../../types/familiarity';
import type { WorldRef } from '../../types/worldRef';
import type { WorldGraph } from '../graph';
import { getFamiliarity, getKnowledgeLevel } from '../familiarity';
import { resolveToParentLocation } from '../sublocationShape';
import { getFirstId } from '../meetingEncounter';
import { elapsedLabel } from '../aftermathWords';
import { FIND_WORDS } from '../../data/view-content';

/**
 * THR-1914 (Inspector plan § D9) — the surfaces that ask the seen floor. Each one is a
 * place the player could otherwise learn what fog hides: a lens mark, a card's lit target
 * while it is armed, or a Find result. The list names who reads it, so a new reader is one
 * entry (Law 58).
 */
export type KnowledgeSurface = 'lensMarks' | 'armedTargets' | 'find';

export const KNOWLEDGE_SURFACES: readonly KnowledgeSurface[] = ['lensMarks', 'armedTargets', 'find'];

/**
 * THR-1915 (THR-1822 § D5) — the least a god must know a person to find them by name:
 * `recognised`, the first level above a stranger.
 */
export const SEEN_FLOOR_PERSON_MIN_LEVEL: KnowledgeLevel = 'recognised';

type VisibilityState = Pick<GameState, 'visibilityMap'>;

function hasFog(state: VisibilityState): boolean {
  const map = state.visibilityMap;
  return !!map && typeof map.get === 'function' && map.size > 0;
}

/** Whether the player may be shown things on this hex ("col,row"). */
export function isHexKnown(state: VisibilityState, key: string): boolean {
  if (!hasFog(state)) return true;
  const entry = state.visibilityMap.get(key);
  return !!entry && entry.state !== 'unexplored';
}

/** Whether the hex is in sight now (not merely remembered). Fails open like the rest. */
export function isHexVisibleNow(state: VisibilityState, key: string): boolean {
  if (!hasFog(state)) return true;
  return state.visibilityMap.get(key)?.state === 'visible';
}

/** The hex rule, asked by a named surface. Every surface reads the one rule today. */
export function isHexKnownFor(_surface: KnowledgeSurface, state: VisibilityState, key: string): boolean {
  return isHexKnown(state, key);
}

// ─── The whole floor (THR-1915) ─────────────────────────────────────────────

/** The world kinds the floor answers for; every other kind is never nameable by Find. */
export type SeenFloorRef = Pick<WorldRef, 'kind' | 'id'>;

export interface SeenFloor {
  readonly id: 'open' | 'seen-floor';
  /** Whether a surface may name this thing. */
  canName(ref: SeenFloorRef): boolean;
  /** "Last seen 3 days ago" for a place on a remembered hex; null otherwise. */
  staleFact(ref: SeenFloorRef): string | null;
}

export interface SeenFloorOptions {
  /** The debug fog lever: with fog off every hex counts as seen (the lenses read it so). */
  fogOff?: boolean;
  /** Area id → its hexes ("col,row"). An Area is nameable when any of its hexes is. */
  areaHexes?: ReadonlyMap<string, readonly string[]>;
}

function hexOfNode(n: GraphNode | undefined): string | null {
  const col = n?.properties.hexCol as number | undefined;
  const row = n?.properties.hexRow as number | undefined;
  return col == null || row == null ? null : `${col},${row}`;
}

/** The hex a person, army or artifact stands on, through its `located_at` place. */
function standingHex(graph: WorldGraph, id: string): string | null {
  const e = graph.getOutgoingEdges(id, 'located_at')[0];
  if (!e) return null;
  return hexOfNode(resolveToParentLocation(graph, graph.getNode(e.target)));
}

/** The god's own people: its avatar(s), the First and every threaded mortal. */
export function godsPeopleIds(state: Pick<GameState, 'graph' | 'ascendantId'>): Set<string> {
  const out = new Set<string>();
  const { graph, ascendantId } = state;
  if (!ascendantId) return out;
  for (const e of graph.getOutgoingEdges(ascendantId, 'thread')) out.add(e.target);
  for (const e of graph.getIncomingEdges(ascendantId, 'avatar_of')) out.add(e.source);
  try {
    const first = getFirstId(graph, ascendantId);
    if (first) out.add(first);
  } catch {
    // Fail-soft: no First read leaves the threaded set.
  }
  return out;
}

const OPEN_FLOOR: SeenFloor = { id: 'open', canName: () => true, staleFact: () => null };

/**
 * The seen floor (THR-1822 § D5 table, implemented exactly — minus one branch noted below):
 *
 * | Kind | Nameable when |
 * |---|---|
 * | Location | its hex is `visible` or `remembered` |
 * | Area | any of its hexes is |
 * | Place (sublocation) | its parent Location is nameable and it is not `hidden` |
 * | Person | known at least `recognised`, or threaded to the god, or on a `visible` hex now |
 * | Faction | a nameable member, or a nameable place it controls or owns |
 * | Army | on a `visible` hex now |
 * | Artifact | held by the god's own people, or at a nameable, non-hidden place |
 *
 * The artifact's third route — "in a holder's revealed possessions" — is not read: no
 * store records which possessions the god has seen. Leaving it out can only hide a thing,
 * never leak one.
 */
export function createSeenFloor(state: GameState, opts: SeenFloorOptions = {}): SeenFloor {
  if (opts.fogOff || !hasFog(state)) return OPEN_FLOOR;
  const graph = state.graph;
  const people = godsPeopleIds(state);
  const minRank = KNOWLEDGE_LEVELS.indexOf(SEEN_FLOOR_PERSON_MIN_LEVEL);
  const fam = state.familiarityMap;
  const memo = new Map<string, boolean>();

  const knownHex = (key: string | null) => key !== null && isHexKnown(state, key);
  const visibleHex = (key: string | null) => key !== null && isHexVisibleNow(state, key);
  // `discovered: false` marks an undiscovered elder ruin; every naming surface refuses it
  // (landName, stageView, connections), so the floor does too.
  const isHidden = (n: GraphNode | undefined) => n?.properties.hidden === true || n?.properties.discovered === false;

  const location = (id: string): boolean => {
    const n = graph.getNode(id);
    if (!n || isHidden(n)) return false;
    const parentId = n.properties.parentLocationId as string | undefined;
    if (parentId) return location(parentId);
    return knownHex(hexOfNode(n));
  };
  const person = (id: string): boolean => {
    if (people.has(id)) return true;
    const level = getKnowledgeLevel(fam && typeof fam.get === 'function' ? getFamiliarity(fam, id) : 0);
    if (KNOWLEDGE_LEVELS.indexOf(level) >= minRank) return true;
    return visibleHex(standingHex(graph, id));
  };
  const faction = (id: string): boolean => {
    for (const e of graph.getIncomingEdges(id, 'member_of')) if (person(e.source)) return true;
    for (const type of ['controls', 'owns'] as const) {
      for (const e of graph.getOutgoingEdges(id, type)) {
        const t = graph.getNode(e.target);
        if (t?.type === 'location' && location(t.id)) return true;
      }
    }
    return false;
  };
  const artifact = (id: string): boolean => {
    for (const type of ['possesses', 'bonded_to'] as const) {
      for (const e of graph.getIncomingEdges(id, type)) if (people.has(e.source)) return true;
    }
    const at = graph.getOutgoingEdges(id, 'located_at')[0];
    return !!at && location(at.target);
  };

  const decide = (ref: SeenFloorRef): boolean => {
    switch (ref.kind) {
      case 'location':
      case 'sublocation':
        return location(ref.id);
      case 'area':
        return (opts.areaHexes?.get(ref.id) ?? []).some(k => isHexKnown(state, k));
      case 'agent':
      case 'companion':
        return person(ref.id);
      case 'faction':
        return faction(ref.id);
      case 'army':
        return visibleHex(standingHex(graph, ref.id));
      case 'artifact':
        return artifact(ref.id);
      default:
        // Hexes, records, attachments: Find lists none of them (THR-1832 § 1).
        return false;
    }
  };

  return {
    id: 'seen-floor',
    canName(ref) {
      const key = `${ref.kind}:${ref.id}`;
      let v = memo.get(key);
      if (v === undefined) {
        try {
          v = decide(ref);
        } catch {
          v = false; // Fail-closed for one thing: an unreadable thing is not named.
        }
        memo.set(key, v);
      }
      return v;
    },
    staleFact(ref) {
      if (ref.kind !== 'location' && ref.kind !== 'sublocation') return null;
      const loc = resolveToParentLocation(graph, graph.getNode(ref.id));
      const key = hexOfNode(loc);
      const entry = key ? state.visibilityMap.get(key) : undefined;
      if (entry?.state !== 'remembered' || !entry.snapshot) return null;
      return FIND_WORDS.lastSeen.replace('{when}', elapsedLabel(state.tick - entry.snapshot.lastSeenTick));
    },
  };
}
