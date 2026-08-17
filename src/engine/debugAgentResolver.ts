/**
 * Shared agent-selector resolution for debug surfaces (THR-1032).
 *
 * Every `window.__DEBUG` accessor that takes an agent selector used to hand-roll
 * its own matcher, and every one of them was wrong in the same two ways:
 *
 * 1. **No `@hero` alias.** CLAUDE.md documents `@hero` as *the* way to name the
 *    ascendant's avatar (`?spawn=` "stages the named encounter template on
 *    `@hero`"), and the CLI accepts it. The browser accessors did not, so the one
 *    actor every `?spawn=` review route stages on was the one actor they could
 *    not name.
 * 2. **Display names read from the wrong place.** `GraphNode.name` is a
 *    *top-level* field; several matchers looked only in `properties.name`, which
 *    is an untyped bag `tsc` cannot check. So partial-name matching silently
 *    matched nothing at all — the failure that made THR-1032 read as "wrong id"
 *    across six spellings (impediment #486) rather than "this matcher is blind".
 *
 * The error text matters as much as the matching. `No agent matching '<x>'` reads
 * as caller error and invites a guess-more-ids loop; a resolver that cannot see an
 * actor class must say what it searched so the caller can tell the two apart.
 */

import type { GameState } from '../types/gameState';
import type { GraphNode } from '../types/graph';

/** Selector aliases that mean "the ascendant's avatar". Mirrors the CLI and `debugCommands`. */
export const AVATAR_ALIASES = ['@hero', '@avatar'] as const;

export interface DebugAgentMatch {
  node: GraphNode;
  /** Which rule matched — reported so a caller can explain a surprising resolution. */
  matchedBy: 'avatar-alias' | 'id' | 'id-prefix' | 'name';
}

export interface DebugAgentMiss {
  error: string;
  /** How many actor nodes were searched. Zero is itself diagnostic — the world is not loaded. */
  searched: number;
}

export function isDebugAgentMiss(
  result: DebugAgentMatch | DebugAgentMiss,
): result is DebugAgentMiss {
  return 'error' in result;
}

/** The avatar node for an ascendant, via the `avatar_of` edge wired in `ascendant.ts`. */
function resolveAvatarNode(state: GameState): GraphNode | undefined {
  const { graph, ascendantId } = state;
  if (!ascendantId) return undefined;

  // The edge is wired avatar → ascendant, but read both directions so a
  // differently-wired world (or a future reversal) still resolves.
  const avatarEdge = graph.getIncomingEdges(ascendantId, 'avatar_of')[0]
    ?? graph.getOutgoingEdges(ascendantId, 'avatar_of')[0];

  if (avatarEdge) {
    const avatarId = avatarEdge.source === ascendantId ? avatarEdge.target : avatarEdge.source;
    const node = graph.getNode(avatarId);
    if (node) return node;
  }

  // Fallback: worlds where the ascendant id *is* the actor node and no separate
  // avatar was minted. This is the shape the headless CLI resolver assumes.
  return graph.getNode(ascendantId);
}

/**
 * Resolve a debug agent selector to an actor node.
 *
 * Accepts, in precedence order: an avatar alias (`@hero` / `@avatar`), an exact
 * node id, an id prefix, or a case-insensitive substring of the display name.
 */
export function resolveDebugAgent(
  state: GameState,
  query: string,
): DebugAgentMatch | DebugAgentMiss {
  const actors = state.graph.getNodesByType('actor');

  if ((AVATAR_ALIASES as readonly string[]).includes(query)) {
    const avatar = resolveAvatarNode(state);
    if (avatar) return { node: avatar, matchedBy: 'avatar-alias' };
    return {
      error: `'${query}' could not resolve: no avatar_of edge from ascendant `
        + `'${state.ascendantId || '(unset)'}' and no node with that id. `
        + 'This is an alias-resolution failure, not a wrong id.',
      searched: actors.length,
    };
  }

  const lowered = query.toLowerCase();
  // Read BOTH name locations: `name` is the typed top-level field, and
  // `properties.name` is carried by some older node shapes. Checking only the
  // latter is what made every hand-rolled matcher blind to display names.
  const displayName = (node: GraphNode): string =>
    node.name ?? (node.properties?.name as string | undefined) ?? '';

  const byId = actors.find(node => node.id === query);
  if (byId) return { node: byId, matchedBy: 'id' };

  const byPrefix = actors.find(node => node.id.startsWith(query));
  if (byPrefix) return { node: byPrefix, matchedBy: 'id-prefix' };

  const byName = actors.find(node => displayName(node).toLowerCase().includes(lowered));
  if (byName) return { node: byName, matchedBy: 'name' };

  return {
    error: `No actor matching '${query}'. Searched ${actors.length} node(s) of type 'actor' `
      + "by exact id, id prefix, and display name. For the ascendant's avatar use '@hero'.",
    searched: actors.length,
  };
}
