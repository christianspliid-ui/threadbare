/**
 * Tabs — one tab bar, and the same bar as a toggle row (THR-1885, plan THR-1821 § Tabs).
 *
 * ```tsx
 * <Tabs kind="tabs" value={tab} onChange={setTab} label="Chronicle">
 *   <Tabs.Tab value="now" label="Now" />
 *   <Tabs.Tab value="ledger" label="Ledger" count={{ value: 2, label: '2 new chapters' }} />
 *   <Tabs.Panel value="now">…</Tabs.Panel>
 * </Tabs>
 *
 * <Tabs kind="toggle" value={lens} onChange={setLens} allowNone label="Map lenses">
 *   <Tabs.Tab value="dominion" label="Dominion" keyCap="1" />
 * </Tabs>
 * ```
 *
 * - **`kind="tabs"`** — WAI-ARIA tabs: `tablist` / `tab` (`aria-selected`, `aria-controls`) /
 *   `tabpanel`; roving tabindex; ←/→ and Home/End move focus **and** selection. Exactly one
 *   tab is selected. `Tabs.Panel` children render below the bar, only the selected one shown.
 *   A panel that lives elsewhere in the layout renders `Tabs.Panel` with `tabsId` and
 *   `selected` passed explicitly.
 * - **`kind="toggle"`** — a `toolbar` of pressed buttons (`aria-pressed`), at most one pressed;
 *   with `allowNone`, pressing the pressed one turns it off (the lens rule). Arrows move focus
 *   only. Owners bind their own hotkeys; the primitive renders the key cap.
 * - **One look for both:** Alegreya Sans at the 16 px floor, sentence case; selected/pressed =
 *   `--text-primary` with a 2 px underline; rest `--text-secondary`; hover `--bg-hover`.
 *   **Never gold** (Law 31: gold is the god's attention). Min height `2.5rem` (Law 46).
 * - Pressing answers at once (Law 47): the underline moves within `--anim-fast`.
 * - An unknown `value` selects the first tab (or none, for a toggle row with `allowNone`) and
 *   warns once. No `Tabs.Tab` children → renders nothing.
 */

import {
  Children,
  isValidElement,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
} from 'react';
import type { IconName } from '../../data/icons/iconRegistry';
import { Chip } from './Chip';
import { Icon } from './Icon';
import { Tooltip } from './Tooltip';

/** Selected / pressed underline thickness. */
export const TAB_UNDERLINE_PX = 2;
/** Tab hit area — 40 px at 1080p, 45 px at 1440p (Law 46). */
export const TAB_MIN_HEIGHT_REM = 2.5;

export interface TabProps {
  value: string;
  /** Sentence case, written that way in the string. */
  label: string;
  icon?: IconName;
  /** The owner's hotkey, drawn as a key cap ("1"). The owner binds the key. */
  keyCap?: string;
  /** An unread count after the label; `label` is its spoken sentence. Zero draws nothing. */
  count?: { value: number; label: string };
  disabled?: boolean;
  /** A `ui.*` tooltip on the button (Laws 1, 17), e.g. a map lens's own tooltip. */
  tooltipId?: string;
  /** Replaces the tooltip's description (a lens held off says why). Needs `tooltipId`. */
  tooltipDesc?: string;
  /** `data-testid` on the button, for owners whose tests and probes name it. */
  testId?: string;
}

export interface TabsPanelProps {
  value: string;
  children: ReactNode;
  /** Only for a panel rendered outside its `<Tabs>`: the `Tabs` `id`. */
  tabsId?: string;
  /** Only for a panel rendered outside its `<Tabs>`: whether its tab is selected. */
  selected?: boolean;
  className?: string;
  style?: CSSProperties;
}

interface TabsCommon {
  /** The bar's accessible name. */
  label: string;
  /** Stable id prefix; needed only when a `Tabs.Panel` lives outside the `<Tabs>`. */
  id?: string;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export interface TabsTabsProps extends TabsCommon {
  kind?: 'tabs';
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  allowNone?: never;
}

export interface TabsToggleProps extends TabsCommon {
  kind: 'toggle';
  /** The pressed button's value, or null when none is pressed. */
  value?: string | null;
  defaultValue?: string | null;
  onChange?: (value: string | null) => void;
  /** Pressing the pressed button turns it off. */
  allowNone?: boolean;
}

export type TabsProps = TabsTabsProps | TabsToggleProps;

export const tabDomId = (tabsId: string, value: string) => `${tabsId}-tab-${value}`;
export const panelDomId = (tabsId: string, value: string) => `${tabsId}-panel-${value}`;

const warnedUnknown = new Set<string>();
function warnUnknownOnce(label: string, value: string): void {
  const key = `${label}\u0000${value}`;
  if (warnedUnknown.has(key)) return;
  warnedUnknown.add(key);
  console.warn(`[Tabs] "${label}" has no tab "${value}"; falling back`);
}

/** Test hook: forget which unknown values already warned. */
export function resetTabsWarningsForTest(): void {
  warnedUnknown.clear();
}

/** Marker component: `Tabs` reads its props. Rendering it alone draws nothing. */
function Tab(_props: TabProps): null {
  return null;
}

function Panel({ value, children, tabsId, selected, className, style }: TabsPanelProps) {
  // Standalone use (outside a <Tabs>): the owner says which panel shows.
  if (tabsId === undefined) return selected === false ? null : <div className={className} style={style}>{children}</div>;
  return (
    <div
      role="tabpanel"
      id={panelDomId(tabsId, value)}
      aria-labelledby={tabDomId(tabsId, value)}
      hidden={!selected}
      tabIndex={0}
      className={className}
      style={style}
    >
      {selected ? children : null}
    </div>
  );
}

const BAR_STYLE: CSSProperties = {
  display: 'flex',
  alignItems: 'stretch',
  gap: '0.25rem',
  borderBottom: '1px solid var(--border-subtle)',
  flexWrap: 'nowrap',
};

function tabStyle(on: boolean, disabled: boolean): CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.375rem',
    minHeight: `${TAB_MIN_HEIGHT_REM}rem`,
    padding: '0 0.75rem',
    background: 'transparent',
    border: 'none',
    borderBottom: `${TAB_UNDERLINE_PX}px solid ${on ? 'var(--text-primary)' : 'transparent'}`,
    marginBottom: '-1px',
    color: on ? 'var(--text-primary)' : 'var(--text-secondary)',
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--text-xs)',
    fontWeight: on ? 700 : 400,
    letterSpacing: 0,
    whiteSpace: 'nowrap',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.4 : 1,
    transition: 'border-color var(--anim-fast) ease, color var(--anim-fast) ease, background-color var(--anim-fast) ease',
  };
}

const KEY_CAP_STYLE: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: '1.25rem',
  height: '1.25rem',
  padding: '0 0.25rem',
  border: '1px solid var(--border-subtle)',
  borderRadius: 'var(--radius-control)',
  color: 'var(--text-tertiary)',
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--text-xs)',
  lineHeight: 1,
};

function TabsRoot(props: TabsProps) {
  const { label, children, className, style } = props;
  const kind = props.kind ?? 'tabs';
  const generatedId = useId();
  const tabsId = props.id ?? `tabs${generatedId.replace(/:/g, '')}`;

  const tabs: TabProps[] = [];
  const panels: ReactElement<TabsPanelProps>[] = [];
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    if (child.type === Tab) tabs.push(child.props as TabProps);
    else if (child.type === Panel) panels.push(child as ReactElement<TabsPanelProps>);
  });

  const isControlled = props.value !== undefined;
  const [inner, setInner] = useState<string | null>(props.defaultValue ?? (kind === 'tabs' ? tabs[0]?.value ?? null : null));
  const requested = isControlled ? (props.value as string | null) : inner;
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  if (tabs.length === 0) return null;

  const known = requested !== null && tabs.some((t) => t.value === requested);
  let current: string | null = requested;
  if (requested !== null && !known) {
    warnUnknownOnce(label, requested);
    current = kind === 'toggle' && props.kind === 'toggle' && props.allowNone ? null : tabs[0].value;
  }
  if (kind === 'tabs' && current === null) current = tabs[0].value;

  const emit = (next: string | null) => {
    if (!isControlled) setInner(next);
    if (props.kind === 'toggle') props.onChange?.(next);
    else if (next !== null) props.onChange?.(next);
  };

  const press = (value: string) => {
    if (kind === 'toggle' && props.kind === 'toggle') {
      emit(current === value ? (props.allowNone ? null : value) : value);
    } else {
      emit(value);
    }
  };

  const enabledIndexes = tabs.map((t, i) => (t.disabled ? -1 : i)).filter((i) => i >= 0);
  const currentIndex = tabs.findIndex((t) => t.value === current);
  // Roving tabindex: the selected/pressed tab, else the first enabled one.
  const focusIndex = currentIndex >= 0 && !tabs[currentIndex].disabled ? currentIndex : enabledIndexes[0] ?? 0;

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const from = buttonRefs.current.findIndex((el) => el === document.activeElement);
    if (from < 0 || enabledIndexes.length === 0) return;
    const pos = enabledIndexes.indexOf(from);
    let to: number | null = null;
    if (e.key === 'ArrowRight') to = enabledIndexes[(pos + 1) % enabledIndexes.length];
    else if (e.key === 'ArrowLeft') to = enabledIndexes[(pos - 1 + enabledIndexes.length) % enabledIndexes.length];
    else if (e.key === 'Home') to = enabledIndexes[0];
    else if (e.key === 'End') to = enabledIndexes[enabledIndexes.length - 1];
    if (to === null) return;
    e.preventDefault();
    buttonRefs.current[to]?.focus();
    // Selection follows focus for tabs; a toggle row only moves focus.
    if (kind === 'tabs') emit(tabs[to].value);
  };

  return (
    <>
      <div
        role={kind === 'tabs' ? 'tablist' : 'toolbar'}
        aria-label={label}
        aria-orientation="horizontal"
        data-tabs-kind={kind}
        className={className}
        style={{ ...BAR_STYLE, ...style }}
        onKeyDown={onKeyDown}
      >
        {tabs.map((tab, i) => {
          const on = tab.value === current;
          const count = tab.count;
          const spoken = count && count.value > 0 ? `${tab.label}, ${count.label}` : undefined;
          const button = (
            <button
              key={tab.value}
              ref={(el) => {
                buttonRefs.current[i] = el;
              }}
              type="button"
              id={tabDomId(tabsId, tab.value)}
              className="tab-button focus-ring"
              data-tab-value={tab.value}
              data-testid={tab.testId}
              disabled={tab.disabled}
              tabIndex={i === focusIndex ? 0 : -1}
              style={tabStyle(on, Boolean(tab.disabled))}
              onClick={() => press(tab.value)}
              aria-label={spoken}
              {...(kind === 'tabs'
                ? {
                    role: 'tab',
                    'aria-selected': on,
                    'aria-controls': panels.some((p) => p.props.value === tab.value) ? panelDomId(tabsId, tab.value) : undefined,
                  }
                : { 'aria-pressed': on })}
            >
              {tab.icon && <Icon name={tab.icon} size="chip" decorative />}
              <span>{tab.label}</span>
              {count && <Chip role="count" form="inline" count={count.value} of={tab.value} />}
              {tab.keyCap && (
                <kbd aria-hidden="true" style={KEY_CAP_STYLE}>
                  {tab.keyCap}
                </kbd>
              )}
            </button>
          );
          return tab.tooltipId ? (
            <Tooltip key={tab.value} id={tab.tooltipId} desc={tab.tooltipDesc}>
              {button}
            </Tooltip>
          ) : button;
        })}
      </div>
      {panels.map((panel) => (
        <Panel key={panel.props.value} {...panel.props} tabsId={tabsId} selected={panel.props.value === current} />
      ))}
    </>
  );
}

export const Tabs = Object.assign(TabsRoot, { Tab, Panel });
