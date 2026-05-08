/**
 * DetailPageOpenerContext — supplies a single `openByRef(ref)` callback to any
 * descendant of the encounter shell, so chips / event-cards / prose keywords
 * can navigate between detail pages without each call site re-wiring
 * `graph + tick + seed + push`.
 *
 * Wiring expectations:
 * - The encounter root constructs an opener via `useOpenDetailPage(gameState)`
 *   and provides `value = openRef`.
 * - The Section dispatcher consumes this context for click handlers.
 *
 * If no provider is in scope (e.g., styleguide rendering DetailModal in
 * isolation), the hook returns `undefined` and click affordances render but
 * are no-ops — the modal still works for read-only previews.
 */
import { createContext, useContext, type ReactNode } from 'react';
import type { NodeRef } from '../types/detailPage';

export type OpenByRef = (ref: NodeRef) => void;

const DetailPageOpenerContext = createContext<OpenByRef | undefined>(undefined);

export function DetailPageOpenerProvider({
  value,
  children,
}: {
  value: OpenByRef;
  children: ReactNode;
}) {
  return (
    <DetailPageOpenerContext.Provider value={value}>{children}</DetailPageOpenerContext.Provider>
  );
}

/**
 * Hook returning the active `openByRef` callback, or undefined when no opener
 * is wired (read-only preview contexts).
 */
export function useDetailPageOpener(): OpenByRef | undefined {
  return useContext(DetailPageOpenerContext);
}
