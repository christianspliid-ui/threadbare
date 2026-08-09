/**
 * CMS hash routing — THR-1046.
 *
 * The registry has always documented an entry's `id` as "used as URL hash
 * fragment", and CLAUDE.md has advertised `?view=cms#ia-surfaces` as a route.
 * Nothing read the hash: it was a naming convention with no reader, so every
 * such link landed on the empty CMS and the visitor picked the entry by hand.
 * This closes that — and it is a prerequisite rather than a nicety, because the
 * Package View's whole point is *one shareable URL per template*.
 *
 * **Shape.** `#<entryId>` selects a registry entry; anything after a `?` is that
 * entry's own parameters, parsed as a query string:
 *
 *   #encounter-packages
 *   #encounter-packages?template=encounter.slice.unsafe_bridge
 *   #encounter-packages?batch=encounter.slice.unsafe_bridge,encounter.slice.night_pass
 *
 * **Writes replace, they do not push.** Moving between packages is browsing one
 * surface, not walking a history — a back button that steps through nine
 * intermediate packages is worse than one that leaves the CMS. `replaceState`
 * keeps the URL shareable at every moment without owning the back stack.
 */

import { useCallback, useEffect, useState } from 'react';

export interface CmsHashRoute {
  /** Registry entry id, or `null` when the hash is empty. */
  readonly entryId: string | null;
  /** Entry-scoped parameters from the `?` tail. Empty when there are none. */
  readonly params: Readonly<Record<string, string>>;
}

const EMPTY_ROUTE: CmsHashRoute = { entryId: null, params: {} };

/** Parse a raw `location.hash` into an entry id and its parameters. */
export function parseCmsHash(rawHash: string): CmsHashRoute {
  const hash = rawHash.startsWith('#') ? rawHash.slice(1) : rawHash;
  if (hash === '') return EMPTY_ROUTE;

  const queryAt = hash.indexOf('?');
  const entryId = queryAt === -1 ? hash : hash.slice(0, queryAt);
  if (entryId === '') return EMPTY_ROUTE;

  const params: Record<string, string> = {};
  if (queryAt !== -1) {
    // `URLSearchParams` decodes percent-escapes, so a template id with a dot or
    // a comma-joined batch survives the round trip unchanged.
    for (const [key, value] of new URLSearchParams(hash.slice(queryAt + 1))) {
      params[key] = value;
    }
  }
  return { entryId: decodeURIComponent(entryId), params };
}

/** Serialize an entry id plus parameters back into a hash string. */
export function formatCmsHash(
  entryId: string,
  params: Readonly<Record<string, string | undefined>> = {},
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, value);
  }
  const query = search.toString();
  return `#${entryId}${query === '' ? '' : `?${query}`}`;
}

/**
 * The current CMS route, kept in step with the address bar.
 *
 * Listens for `hashchange` so an edited or pasted URL takes effect without a
 * reload, and for the initial mount value so a cold load of a shared link opens
 * on the right surface.
 */
export function useCmsHashRoute(): {
  route: CmsHashRoute;
  setRoute: (entryId: string, params?: Readonly<Record<string, string | undefined>>) => void;
} {
  const [route, setRouteState] = useState<CmsHashRoute>(() =>
    parseCmsHash(typeof window === 'undefined' ? '' : window.location.hash),
  );

  useEffect(() => {
    const onHashChange = (): void => {
      setRouteState(parseCmsHash(window.location.hash));
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const setRoute = useCallback(
    (entryId: string, params?: Readonly<Record<string, string | undefined>>) => {
      const hash = formatCmsHash(entryId, params);
      // `replaceState` does not fire `hashchange`, so the state is set directly.
      // Fail-soft: a browser that refuses the history write still navigates,
      // because the component state is the render source and the URL is a mirror.
      try {
        window.history.replaceState(null, '', hash);
      } catch {
        window.location.hash = hash;
      }
      setRouteState(parseCmsHash(hash));
    },
    [],
  );

  return { route, setRoute };
}
