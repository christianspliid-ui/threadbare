/**
 * QuietSlot — an empty state as one quiet line in a dashed frame (THR-2097, dressing rule R8).
 *
 * Never a full heading over "nothing": the slot keeps its place on the page so the layout
 * does not jump when something arrives, and says in one line why it is empty. No gold
 * (Law 31). The later slices' empty states use it too.
 *
 * See `Docs/design-system/component-selection.md` § QuietSlot.
 */
import type { CSSProperties, ReactNode } from 'react';

export function QuietSlot({ children, label, style, ...rest }: {
  children: ReactNode;
  /** The slot's name for assistive tech ("Act on Kael"); the line itself is visible. */
  label?: string;
  style?: CSSProperties;
} & Record<`data-${string}`, string>) {
  return (
    <section
      data-quiet-slot=""
      aria-label={label}
      {...rest}
      style={{
        border: '1px dashed var(--border-subtle)',
        borderRadius: 'var(--radius-panel)',
        padding: '8px 10px',
        color: 'var(--text-tertiary)',
        fontStyle: 'italic',
        fontSize: 'var(--text-sm)',
        lineHeight: 1.5,
        ...style,
      }}
    >
      {children}
    </section>
  );
}
