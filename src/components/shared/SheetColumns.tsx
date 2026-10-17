import { createContext, useContext, type ReactNode } from 'react';

/**
 * SheetColumns — a subject and its record side by side (THR-1820 § 4).
 *
 * The container decides the column count through `SheetLayoutContext`: `Modal`
 * provides `'two'` at the L and XL tiers and `'one'` at S and M; the Inspector's
 * build provides it per Inspector size. A context, not a container query, so the
 * column count is a plain value a jsdom test can assert. With no provider the
 * layout stacks, which is lawful at any width (fail-soft).
 *
 * - **Two columns:** grid `var(--sheet-aside-w) minmax(0, 1fr)`, gap `var(--sheet-gap)`;
 *   each column is its own scroll region and scrolls only when the panel is at its
 *   cap (Law 57), so the identity stays in view while the record scrolls.
 * - **One column:** the aside stacks above the main content, one scroll region.
 *
 * In a dialog it takes the place of `Modal.Body` (it carries the body's padding).
 */
export type SheetLayout = 'one' | 'two';

export const SheetLayoutContext = createContext<SheetLayout>('one');

export function useSheetLayout(): SheetLayout {
  return useContext(SheetLayoutContext);
}

interface SheetColumnsProps {
  /** Left column: hero art, name and identity line, the at-a-glance words. */
  aside: ReactNode;
  /** Main column: facts, tabs, lists, the record. */
  children: ReactNode;
  /** Accessible names for the two regions, when the content needs them. */
  asideLabel?: string;
  mainLabel?: string;
}

export function SheetColumns({ aside, children, asideLabel, mainLabel }: SheetColumnsProps) {
  const layout = useSheetLayout();
  const two = layout === 'two';
  return (
    <div
      data-testid="sheet-columns"
      data-layout={layout}
      style={two
        ? {
            display: 'grid',
            gridTemplateColumns: 'var(--sheet-aside-w, 400px) minmax(0, 1fr)',
            gridTemplateRows: 'minmax(0, 1fr)',
            gap: 'var(--sheet-gap, 24px)',
            padding: 'var(--panel-padding)',
            flex: 1,
            minHeight: 0,
          }
        : { padding: 'var(--panel-padding)', overflowY: 'auto', flex: 1, minHeight: 0 }}
    >
      <section
        data-testid="sheet-columns-aside"
        aria-label={asideLabel}
        style={two ? { overflowY: 'auto', minHeight: 0 } : { marginBottom: 'var(--sheet-gap, 24px)' }}
      >
        {aside}
      </section>
      <section
        data-testid="sheet-columns-main"
        aria-label={mainLabel}
        style={two ? { overflowY: 'auto', minHeight: 0 } : undefined}
      >
        {children}
      </section>
    </div>
  );
}
