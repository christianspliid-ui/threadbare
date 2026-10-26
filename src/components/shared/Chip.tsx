/**
 * Chip — one component, four roles (THR-1885, plan THR-1821 § Chip).
 *
 * | Role | It answers | Must carry | Click |
 * |---|---|---|---|
 * | `identity` | which thing? | leading `EntityVisual` when the kind has one, the name, a registry tooltip | `useRefRouterContext()?.open(target)` (Law 21); a dead target or no router → plain text |
 * | `state` | how is it? | the **word** always (Laws 13, 31), optional icon and magnitude slot (Law 15) | optional `onOpen` |
 * | `count` | how many are waiting? | a whole number, and an icon in the full form | `onOpen` opens the list and **never clears the count** (Law 40) |
 * | `keyword` | what kind? | the vocabulary word, optional icon | optional toggle (`pressed` / `onToggle`) |
 *
 * A count of zero (or a non-finite count) renders nothing (Laws 25, 53); a count always
 * shows its number, even at 1. The **badge form** of a count (`form="badge"`) sits on a
 * control that already carries the name — `IconButton`'s badge — so it is `aria-hidden`,
 * not interactive and has no tooltip of its own.
 *
 * Root data attributes for tests and `__DEBUG.getCountChips()`: `data-chip-role`, and on a
 * count `data-count` + `data-count-of` (the owner's short key, e.g. `notables`).
 *
 * **Name clash:** in the ubiquitous language "chip" alone is a *Consequence Chip*. That is one
 * use of this component (`role="state"` with a kind tag), not a different thing.
 */

import { useCallback, useRef, type CSSProperties, type ReactNode } from 'react';
import type { AnyRef } from '../../types/contentRef';
import type { SphereName } from '../../types';
import type { IconName } from '../../data/icons/iconRegistry';
import { useRefRouterContext } from '../../contexts/RefRouterContext';
import { EntityVisual } from './EntityVisual';
import type { EntityVisualDescriptor } from './entityVisualResolver';
import { Icon, ICON_SIZE_REM } from './Icon';
import { Tooltip } from './Tooltip';
import { sphereBrightToken, sphereTint } from './sphereTint';

export type ChipSize = 'sm' | 'md';

/** Chip heights in rem — 24 / 32 px at 1080p, 27 / 36 px at 1440p (sm keeps the Law 46 hit area). */
export const CHIP_HEIGHT_REM: Readonly<Record<ChipSize, number>> = { sm: 1.5, md: 2 };
/** Chip horizontal padding in rem. */
export const CHIP_PAD_X_REM: Readonly<Record<ChipSize, number>> = { sm: 0.5, md: 0.75 };
/** The count's badge form on a control — 16 px at 1080p, today's badge size. */
export const CHIP_BADGE_HEIGHT_REM = 1;
/** How far the badge form overhangs its control's top-right corner. */
export const CHIP_BADGE_OFFSET_PX = -4;

/** State tints: polarity never by hue alone — the word is always there (Law 31). */
export type ChipStateTint = 'neutral' | 'positive' | 'negative' | { sphere: SphereName };
/** Count tints: gold is the god's attention only (the needs-you pill). */
export type ChipCountTint = 'neutral' | 'gold';

interface ChipCommon {
  size?: ChipSize;
  className?: string;
  style?: CSSProperties;
}

export interface IdentityChipProps extends ChipCommon {
  role: 'identity';
  /** What the chip names. `target`, not `ref` — React reserves `ref`. Null = a dead ref. */
  target: AnyRef | null | undefined;
  label: string;
  /** The leading tile, when the kind has an entity-visual family (Laws 1, 3). */
  visual?: EntityVisualDescriptor | null;
  /** Tooltip registry id (Law 17). */
  tooltipId?: string;
}

export interface StateChipProps extends ChipCommon {
  role: 'state';
  /** The word — always shown (Laws 13, 31). */
  label: string;
  icon?: IconName;
  tint?: ChipStateTint;
  /** A sanctioned magnitude language only: `DeltaCluster` or `OddsPips` (Law 15). */
  magnitude?: ReactNode;
  /** Our own drawn sets (`SphereIcon`, `ReachIcon`, `CoatOfArms`), which are not `IconName`s. */
  leading?: ReactNode;
  tooltipId?: string;
  onOpen?: () => void;
}

interface CountChipBase extends ChipCommon {
  role: 'count';
  count: number;
  /** The owner's short key (`notables`), read by `__DEBUG.getCountChips()`. */
  of: string;
}

/** A count that stands alone: the needs-you pill, the strip, Connections rows. */
export interface CountChipFullProps extends CountChipBase {
  form?: 'full';
  icon: IconName;
  /** The spoken sentence and the tooltip — "3 things need you". */
  label: string;
  tint?: ChipCountTint;
  /** Opens the list. Never clears the count (Law 40) — the owner keeps the number. */
  onOpen?: () => void;
  /** THR-1875 — a visible word before the count ("Needs you 3"); the top bar's pill shows it. */
  word?: string;
  /**
   * THR-2061 — at a count of zero, draw the word alone instead of nothing. The
   * needs-you pill stays (as "Needs you", no number) while its list holds only
   * News, which is listed but not counted. Needs `word`.
   */
  showWhenZero?: boolean;
  /** THR-1875 — the tooltip's description under the spoken label (a registry entry's words). */
  desc?: string;
}

/**
 * A count on a control that already carries the name and the tooltip: `badge` pins it to the
 * control's corner (`IconButton`); `inline` sets it after the control's word (a tab's
 * "Ledger · 2"). Both are `aria-hidden` — the control speaks the count in its own name.
 */
export interface CountChipBadgeProps extends CountChipBase {
  form: 'badge' | 'inline';
  icon?: never;
  label?: never;
  onOpen?: never;
  tint?: never;
}

export interface KeywordChipProps extends ChipCommon {
  role: 'keyword';
  /** The vocabulary word. */
  keyword: string;
  icon?: IconName;
  /** The vocabulary's own accent (a rarity tier's colour token); neutral when absent. */
  accent?: string;
  leading?: ReactNode;
  tooltipId?: string;
  /** Present → the chip is a filter toggle (`aria-pressed`). */
  pressed?: boolean;
  onToggle?: (next: boolean) => void;
}

export type ChipProps =
  | IdentityChipProps
  | StateChipProps
  | CountChipFullProps
  | CountChipBadgeProps
  | KeywordChipProps;

// ─── Shared look ─────────────────────────────────────────────────────────────

interface Ink {
  color: string;
  border: string;
  background: string;
}

const NEUTRAL_INK: Ink = {
  color: 'var(--text-secondary)',
  border: 'var(--border-subtle)',
  background: 'var(--bg-raised)',
};

function inkFrom(color: string): Ink {
  return { color, border: sphereTint(color, 'border'), background: sphereTint(color, 'bg') };
}

function stateInk(tint: ChipStateTint | undefined): Ink {
  if (!tint || tint === 'neutral') return NEUTRAL_INK;
  if (tint === 'positive') return inkFrom('var(--positive)');
  if (tint === 'negative') return inkFrom('var(--negative)');
  return inkFrom(sphereBrightToken(tint.sphere));
}

function shellStyle(size: ChipSize, ink: Ink): CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.375rem',
    height: `${CHIP_HEIGHT_REM[size]}rem`,
    padding: `0 ${CHIP_PAD_X_REM[size]}rem`,
    borderRadius: 'var(--radius-chip)',
    // Longhands, never the `border` shorthand: a pressed keyword overrides `borderColor`, and
    // React clears a longhand on unpress without re-applying a shorthand beside it.
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: ink.border,
    background: ink.background,
    color: ink.color,
    font: 'inherit',
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--text-xs)',
    lineHeight: 1,
    letterSpacing: 0,
    whiteSpace: 'nowrap',
    verticalAlign: 'middle',
    boxShadow: 'var(--shadow-chip)',
    transition: 'background-color var(--anim-fast) ease, border-color var(--anim-fast) ease, color var(--anim-fast) ease',
  };
}

/** Wraps `node` in a registry tooltip when an id is given. */
function withTooltip(node: ReactNode, tooltipId: string | undefined): ReactNode {
  return tooltipId ? <Tooltip id={tooltipId}>{node}</Tooltip> : node;
}

/** Renders `content` as a real button when `onClick` is given, else as a span. */
function Shell({
  role,
  style,
  className,
  onClick,
  pressed,
  ariaLabel,
  extra,
  children,
  shellRef,
  onEnter,
  onLeave,
}: {
  role: string;
  style: CSSProperties;
  className?: string;
  onClick?: () => void;
  pressed?: boolean;
  ariaLabel?: string;
  extra?: Record<string, string | number>;
  children: ReactNode;
  shellRef?: React.Ref<HTMLButtonElement>;
  onEnter?: () => void;
  onLeave?: () => void;
}) {
  if (onClick) {
    return (
      <button
        type="button"
        ref={shellRef}
        data-chip-role={role}
        className={['chip-interactive', 'focus-ring', className].filter(Boolean).join(' ')}
        style={{ cursor: 'pointer', ...style }}
        onClick={onClick}
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
        onFocus={onEnter}
        onBlur={onLeave}
        aria-pressed={pressed}
        aria-label={ariaLabel}
        {...extra}
      >
        {children}
      </button>
    );
  }
  return (
    <span
      data-chip-role={role}
      className={className}
      style={style}
      role={ariaLabel ? 'img' : undefined}
      aria-label={ariaLabel}
      {...extra}
    >
      {children}
    </span>
  );
}

// ─── Roles ───────────────────────────────────────────────────────────────────

function IdentityChip({ target, label, visual, tooltipId, size = 'sm', className, style }: IdentityChipProps) {
  const router = useRefRouterContext();
  const anchorRef = useRef<HTMLButtonElement | null>(null);
  // Law 21 fail-open: a dead target, or no router in scope (styleguide, isolated preview),
  // renders the name and its tile — never a link that goes nowhere.
  const routes = Boolean(target && router);

  const handleEnter = useCallback(() => {
    if (!target || !router || !anchorRef.current) return;
    router.armHover(target, anchorRef.current);
  }, [target, router]);
  const handleLeave = useCallback(() => {
    if (!router) return;
    router.disarmHover();
    router.closeHover();
  }, [router]);
  const handleClick = useCallback(() => {
    if (!target || !router) return;
    router.closeHover();
    router.open(target, 'card', { via: 'chip' });
  }, [target, router]);

  const tile = visual ? (
    <EntityVisual
      size="chip"
      descriptor={visual}
      style={{ width: `${ICON_SIZE_REM.chip}rem`, height: `${ICON_SIZE_REM.chip}rem`, marginLeft: '-0.25rem' }}
    />
  ) : null;

  const chip = (
    <Shell
      role="identity"
      className={className}
      style={{ ...shellStyle(size, NEUTRAL_INK), color: 'var(--text-primary)', ...style }}
      onClick={routes ? handleClick : undefined}
      onEnter={routes ? handleEnter : undefined}
      onLeave={routes ? handleLeave : undefined}
      shellRef={anchorRef}
      extra={{ 'data-chip-routes': routes ? 'true' : 'false' }}
    >
      {tile}
      <span>{label}</span>
    </Shell>
  );
  return <>{withTooltip(chip, tooltipId)}</>;
}

function StateChip({ label, icon, tint, magnitude, leading, tooltipId, onOpen, size = 'sm', className, style }: StateChipProps) {
  const chip = (
    <Shell role="state" className={className} style={{ ...shellStyle(size, stateInk(tint)), ...style }} onClick={onOpen}>
      {leading}
      {icon && <Icon name={icon} size="chip" decorative />}
      <span>{label}</span>
      {magnitude}
    </Shell>
  );
  return <>{withTooltip(chip, tooltipId)}</>;
}

/** A whole count, or null when there is nothing to show (zero, negative, non-finite). */
export function shownCount(count: number): number | null {
  if (!Number.isFinite(count)) return null;
  const whole = Math.floor(count);
  return whole > 0 ? whole : null;
}

/** A count on a control that already speaks for it: the badge or inline form. */
function isCompactCount(props: CountChipFullProps | CountChipBadgeProps): props is CountChipBadgeProps {
  return props.form === 'badge' || props.form === 'inline';
}

function CountChip(props: CountChipFullProps | CountChipBadgeProps) {
  const n = shownCount(props.count);
  const wordOnly = n === null && !isCompactCount(props) && props.showWhenZero === true && !!props.word;
  if (n === null && !wordOnly) return null;
  const countAttrs = { 'data-count': n ?? 0, 'data-count-of': props.of };

  if (isCompactCount(props)) {
    const pinned: CSSProperties =
      props.form === 'badge'
        ? { position: 'absolute', top: `${CHIP_BADGE_OFFSET_PX}px`, right: `${CHIP_BADGE_OFFSET_PX}px` }
        : { position: 'relative' };
    return (
      <span
        aria-hidden="true"
        data-chip-role="count"
        data-chip-form={props.form}
        {...countAttrs}
        className={props.className}
        style={{
          ...pinned,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: `${CHIP_BADGE_HEIGHT_REM}rem`,
          height: `${CHIP_BADGE_HEIGHT_REM}rem`,
          padding: '0 0.1875rem',
          borderRadius: 'var(--radius-chip)',
          backgroundColor: 'var(--bg-deep)',
          border: '1px solid var(--border-subtle)',
          color: 'inherit',
          fontSize: 'var(--text-xs)',
          fontVariantNumeric: 'var(--figures-tabular)',
          lineHeight: 1,
          pointerEvents: 'none',
          ...props.style,
        }}
      >
        {n}
      </span>
    );
  }

  const { icon, label, tint, onOpen, size = 'md', className, style, word, desc } = props;
  const ink = tint === 'gold' ? inkFrom('var(--accent-gold)') : NEUTRAL_INK;
  const chip = (
    <Shell
      role="count"
      className={className}
      style={{ ...shellStyle(size, ink), fontVariantNumeric: 'var(--figures-tabular)', ...style }}
      onClick={onOpen}
      ariaLabel={label}
      extra={{ ...countAttrs, 'data-chip-form': 'full' }}
    >
      <Icon name={icon} size="chip" decorative />
      {word && <span aria-hidden="true" style={{ fontWeight: 700 }}>{word}</span>}
      {n !== null && <span aria-hidden="true">{n}</span>}
    </Shell>
  );
  return <Tooltip label={label} desc={desc}>{chip}</Tooltip>;
}

function KeywordChip({ keyword, icon, accent, leading, tooltipId, pressed, onToggle, size = 'sm', className, style }: KeywordChipProps) {
  const ink = accent ? inkFrom(accent) : NEUTRAL_INK;
  const isToggle = onToggle !== undefined;
  const on = Boolean(pressed);
  const pressedStyle: CSSProperties = on
    ? { background: 'var(--bg-hover)', color: accent ?? 'var(--text-primary)', borderColor: accent ?? 'var(--text-secondary)' }
    : {};
  const chip = (
    <Shell
      role="keyword"
      className={className}
      style={{ ...shellStyle(size, ink), ...pressedStyle, ...style }}
      onClick={isToggle ? () => onToggle(!on) : undefined}
      pressed={isToggle ? on : undefined}
    >
      {leading}
      {icon && <Icon name={icon} size="chip" decorative />}
      <span>{keyword}</span>
    </Shell>
  );
  return <>{withTooltip(chip, tooltipId)}</>;
}

export function Chip(props: ChipProps) {
  switch (props.role) {
    case 'identity':
      return <IdentityChip {...props} />;
    case 'state':
      return <StateChip {...props} />;
    case 'count':
      return <CountChip {...props} />;
    case 'keyword':
      return <KeywordChip {...props} />;
  }
}

/** Every mounted count chip, read from its data attributes — `__DEBUG.getCountChips()`. */
export function readCountChips(root: ParentNode = document): { of: string; count: number }[] {
  return [...root.querySelectorAll<HTMLElement>('[data-chip-role="count"][data-count-of]')].map((el) => ({
    of: el.dataset.countOf ?? '',
    count: Number(el.dataset.count),
  }));
}
