import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { DetailPage } from '../types/detailPage';

// ─── Context shape ────────────────────────────────────────────────────────────

interface DetailModalStackState {
  /** Current stack of open detail pages. Oldest first, topmost last. */
  stack: DetailPage[];
  /** Push a new detail page. Auto-extends the trail from the current top. */
  push: (page: DetailPage) => void;
  /** Close the topmost detail page. No-op if empty. */
  pop: () => void;
  /** Jump to a specific stack index (inclusive). Closes all above it. */
  popTo: (index: number) => void;
  /** Replace the current topmost detail page. Pushes if stack is empty. */
  replace: (page: DetailPage) => void;
  /** True when at least one detail page is open. */
  isOpen: boolean;
}

const DetailModalStackContext = createContext<DetailModalStackState | null>(null);

export type { DetailModalStackState };

// ─── State ────────────────────────────────────────────────────────────────────

/**
 * The stack, as a hook.
 *
 * Split out of the provider by THR-1490 because the ref router owns the pushes, and the
 * router is built in `GameView`'s own scope — a component cannot consume a context it
 * renders. So `GameView` holds the state through this hook, hands it to the router, and
 * publishes the same object to its descendants through
 * {@link DetailModalStackValueProvider}. The stack is still mounted exactly once.
 */
export function useDetailModalStackState(): DetailModalStackState {
  const [stack, setStack] = useState<DetailPage[]>([]);
  const isOpen = stack.length > 0;

  const push = useCallback((page: DetailPage) => {
    setStack(prev => {
      // Auto-extend the trail from the current top so callers don't have to.
      const parentTrail = prev.length > 0 ? prev[prev.length - 1].trail : ['ENCOUNTER'];
      const trail = [...parentTrail, page.displayName];
      return [...prev, { ...page, trail }];
    });
  }, []);

  const pop = useCallback(() => {
    setStack(prev => prev.slice(0, -1));
  }, []);

  const popTo = useCallback((index: number) => {
    setStack(prev => prev.slice(0, index + 1));
  }, []);

  const replace = useCallback((page: DetailPage) => {
    setStack(prev => {
      if (prev.length === 0) {
        return [{ ...page, trail: ['ENCOUNTER', page.displayName] }];
      }
      const next = prev.slice();
      const parentTrail = prev.length > 1 ? prev[prev.length - 2].trail : ['ENCOUNTER'];
      next[next.length - 1] = { ...page, trail: [...parentTrail, page.displayName] };
      return next;
    });
  }, []);

  // Global ESC / ← keydown handler — single listener for the whole stack.
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'ArrowLeft') {
        e.preventDefault();
        setStack(prev => prev.slice(0, -1));
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen]);

  return { stack, push, pop, popTo, replace, isOpen };
}

// ─── Providers ────────────────────────────────────────────────────────────────

/** Owns the stack and publishes it. The self-contained form — styleguide, tests. */
export function DetailModalStackProvider({ children }: { children: ReactNode }) {
  const value = useDetailModalStackState();
  return (
    <DetailModalStackContext.Provider value={value}>{children}</DetailModalStackContext.Provider>
  );
}

/**
 * Publishes a stack the caller already owns.
 *
 * `GameView` uses this one: the router holds the state, so a second `useState` here would
 * be a second, empty stack that `DetailModal` would render instead of the real one.
 */
export function DetailModalStackValueProvider({
  value,
  children,
}: {
  value: DetailModalStackState;
  children: ReactNode;
}) {
  return (
    <DetailModalStackContext.Provider value={value}>{children}</DetailModalStackContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useDetailStack(): DetailModalStackState {
  const ctx = useContext(DetailModalStackContext);
  if (!ctx) throw new Error('useDetailStack must be used within DetailModalStackProvider');
  return ctx;
}
