import { createContext, forwardRef, useContext, useEffect, useRef } from 'react';
import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';
import { dialogContextClass, type DialogContext } from './dialogContext';

/**
 * Panel — the one surface shell, by hierarchy level (THR-1884, plan THR-1821 § Panel).
 *
 * About 66 hand-written `--bg-surface` / `--bg-raised` shells each chose their own
 * border, radius and shadow. Panel is the one shell: the level says what the thing
 * **is** in the hierarchy, and the level picks the look from the tokens.
 *
 * | Level  | What it is                                         |
 * |--------|----------------------------------------------------|
 * | page   | a dialog panel, the Stage panel, the Inspector in Full |
 * | panel  | rails, the docked Inspector, cards, popovers, legends |
 * | inset  | rows and insets inside a panel                     |
 *
 * Hierarchy rule: page ⊃ panel ⊃ inset. A Panel inside a Panel of the same or a
 * lower level renders anyway and logs one dev-only warning.
 *
 * Panel never caps its height or scrolls: a panel grows to its size limit before
 * it scrolls (THR-1820's grow-before-scroll law) — that limit belongs to the owner.
 *
 * A bounded surface is a `Panel`; a bounded surface with a title row is a `Card`;
 * a playing card is `CardFace`.
 */

export type PanelLevel = 'page' | 'panel' | 'inset';
export type PanelMaterial = 'solid' | 'glass';

/** Glass panel backdrop blur, for small panels over the map canvas. */
export const GLASS_BLUR_PX = 10;

/** Depth order: a Panel may only contain levels strictly below its own. */
const LEVEL_DEPTH: Record<PanelLevel, number> = { page: 0, panel: 1, inset: 2 };

export interface PanelStyleOptions {
  /** Popover or dialog (true) versus an in-layout rail (false). Adds the level's shadow. */
  floating?: boolean;
  /** `glass` is for `panel` level surfaces over the map canvas; ignored at other levels. */
  material?: PanelMaterial;
}

/**
 * The look of each level, as inline style — shared by `Panel`, `Modal` (whose
 * panel is an Overlay surface) and the StyleGuide's static previews (Law 27: one
 * copy of the panel). Every `--dlg-*` read carries the neutral value as its
 * fallback, so a `page` panel with no dialogue context renders as before.
 */
export function panelStyle(level: PanelLevel, { floating = false, material = 'solid' }: PanelStyleOptions = {}): CSSProperties {
  switch (level) {
    case 'page':
      return {
        background: 'var(--dlg-bg, linear-gradient(180deg, var(--bg-deep), var(--bg-abyss)))',
        border: '1px solid var(--dlg-border, var(--border-gold))',
        borderRadius: 'var(--radius-page)',
        ...(floating ? { boxShadow: 'var(--shadow-page), 0 0 1px var(--border-gold-strong)' } : {}),
      };
    case 'panel':
      return {
        ...(material === 'glass'
          ? { background: 'var(--bg-glass)', backdropFilter: `blur(${GLASS_BLUR_PX}px)` }
          : { backgroundColor: 'var(--bg-surface)' }),
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-panel)',
        ...(floating ? { boxShadow: 'var(--shadow-panel)' } : {}),
      };
    case 'inset':
      return {
        backgroundColor: 'var(--bg-raised)',
        borderRadius: 'var(--radius-control)',
      };
  }
}

/** Named paddings (tokens only, Law 30). */
const PADDING: Record<'none' | 'standard', string | undefined> = {
  none: undefined,
  standard: 'var(--panel-padding)',
};

const PanelLevelContext = createContext<PanelLevel | null>(null);

/** Levels already warned about in this session, so a nesting slip logs once. */
const warnedNesting = new Set<string>();

export interface PanelProps extends Omit<HTMLAttributes<HTMLElement>, 'style'> {
  level?: PanelLevel;
  floating?: boolean;
  material?: PanelMaterial;
  /** The element to render. Defaults to `div`. */
  as?: 'div' | 'section' | 'aside' | 'article' | 'nav';
  padding?: 'none' | 'standard';
  /** Dialogue context (THR-1586) for a `page` panel; applies the `.dialog-ctx-*` class. */
  context?: DialogContext;
  style?: CSSProperties;
  children?: ReactNode;
}

export const Panel = forwardRef<HTMLElement, PanelProps>(function Panel(
  { level = 'panel', floating = false, material = 'solid', as = 'div', padding = 'none', context, className, style, children, ...rest },
  ref,
) {
  const parent = useContext(PanelLevelContext);
  const nestingRef = useRef(false);

  useEffect(() => {
    if (!import.meta.env.DEV || parent === null || nestingRef.current) return;
    if (LEVEL_DEPTH[level] <= LEVEL_DEPTH[parent]) {
      nestingRef.current = true;
      const key = `${parent}>${level}`;
      if (!warnedNesting.has(key)) {
        warnedNesting.add(key);
        console.warn(`[Panel] a '${level}' panel sits inside a '${parent}' panel — the hierarchy is page ⊃ panel ⊃ inset.`);
      }
    }
  }, [level, parent]);

  const Tag = as;
  const classes = [context ? dialogContextClass(context) : '', className].filter(Boolean).join(' ') || undefined;

  return (
    <PanelLevelContext.Provider value={level}>
      <Tag
        ref={ref as React.Ref<HTMLDivElement>}
        className={classes}
        data-panel-level={level}
        {...(context ? { 'data-dialog-context': context } : {})}
        style={{ ...panelStyle(level, { floating, material }), padding: PADDING[padding], ...style }}
        {...rest}
      >
        {children}
      </Tag>
    </PanelLevelContext.Provider>
  );
});

/**
 * Marks a subtree as sitting inside a panel of `level` without rendering one —
 * for a primitive (Modal) whose panel element is drawn by another primitive
 * (the Overlay surface), so nested Panels still see the right parent.
 */
export function PanelLevelScope({ level, children }: { level: PanelLevel; children: ReactNode }) {
  return <PanelLevelContext.Provider value={level}>{children}</PanelLevelContext.Provider>;
}
