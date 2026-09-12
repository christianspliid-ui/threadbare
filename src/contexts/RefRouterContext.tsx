/**
 * RefRouterContext — publishes the one ref router to everything under the game shell
 * (THR-1490).
 *
 * The router is *built* in `GameView` (see `useRefRouter` for why it cannot be built
 * here) and *published* here, so a link four levels down in the encounter veil opens a
 * card without its host threading `graph + tick + seed + push` through every prop in
 * between — the same wiring cost `DetailPageOpenerContext` was written to remove, now
 * removed for real.
 *
 * **Absent provider is a supported state.** The style guide renders `EntityLink` and
 * `DetailModal` in isolation, and the hook returns `undefined` there rather than
 * throwing: the name renders as text and the click does nothing, which is Law 21's
 * fail-open branch and exactly what an isolated preview should do.
 */

import { createContext, useContext, type ReactNode } from 'react';
import type { RefRouter } from '../hooks/useRefRouter';

const RefRouterContext = createContext<RefRouter | undefined>(undefined);

export function RefRouterProvider({
  router,
  children,
}: {
  router: RefRouter;
  children: ReactNode;
}) {
  return <RefRouterContext.Provider value={router}>{children}</RefRouterContext.Provider>;
}

/**
 * The active router, or `undefined` outside the game shell.
 *
 * Callers must handle `undefined` — that is the fail-open contract, not an oversight to
 * be papered over with a non-null assertion.
 */
export function useRefRouterContext(): RefRouter | undefined {
  return useContext(RefRouterContext);
}
