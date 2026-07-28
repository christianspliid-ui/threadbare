/**
 * RevealCard — the ceremonial reveal surface (THR-799).
 *
 * The presentation tier between a toast and a full modal, for the moments a
 * minor element enters a life: a nature revealed, a bond formed, a working
 * learned. Composed on the existing `Modal` primitive (z-60, Escape/backdrop
 * close, mount animation all inherited) — it does not fork it.
 *
 * Two entry points, because surfaces that are *already* modals must not portal a
 * second one:
 *   - `<RevealCard open onClose>` — the standalone ceremonial modal.
 *   - `<RevealCard.Frame>` — the same zone stack with no Modal wrapper, for
 *     embedding inside an existing modal shell (e.g. AscendantBeatModal).
 *
 * Zone rule: a zone with no data is omitted entirely. The reference card's
 * quality comes from every *visible* zone being full — an empty "(0)" row or a
 * blank quote well reads worse than the zone's absence (fail-soft, NFP #4).
 *
 * Gold budget: the hero medallion ring is the single bright-gold element. The
 * title is `--text-primary`, the frame and rules are dim-gold structure, and the
 * dismiss button is `secondary` — a reveal has no competing action.
 */

import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Medallion } from './Medallion';
import { FlavorQuote } from './FlavorQuote';
import { Tooltip } from './Tooltip';

/** Ceremonial card width (px) — single-column readability. */
export const REVEAL_CARD_MAX_WIDTH = 520;

/** Consequence chips shown before collapsing the remainder into a `+N` chip. */
export const REVEAL_CONSEQUENCE_CHIP_MAX = 4;

// ─── Zones ───────────────────────────────────────────────────────────────────

/**
 * Category line — names the *kind* of moment, not the item. Centered
 * letterspaced display caps between two hairlines.
 */
function Title({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return (
    <div
      data-testid="reveal-title"
      style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', width: '100%' }}
    >
      <span style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, transparent, var(--border-gold-strong))' }} />
      <h2
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--text-lg)',
          letterSpacing: '0.18em',
          color: 'var(--text-primary)',
          textAlign: 'center',
          margin: 0,
          whiteSpace: 'nowrap',
        }}
      >
        {children}
      </h2>
      <span style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, var(--border-gold-strong), transparent)' }} />
    </div>
  );
}

/**
 * Hero slot. The medallion straddles the boundary into the next zone — the
 * negative bottom margin is what produces that overlap, as on the reference card.
 */
function HeroMedallion({
  accentColor,
  title,
  children,
}: {
  accentColor?: string;
  title?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      data-testid="reveal-medallion"
      style={{ display: 'flex', justifyContent: 'center', marginBottom: 'calc(-1 * var(--space-3))' }}
    >
      <Medallion size="lg" accentColor={accentColor} title={title}>
        {children}
      </Medallion>
    </div>
  );
}

/** Item name in its own recessed full-width band, letterspaced display caps. */
function Banner({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return (
    <div
      className="inset-well"
      data-testid="reveal-banner"
      style={{
        width: '100%',
        padding: 'var(--space-3) var(--space-4)',
        textAlign: 'center',
        fontFamily: 'var(--font-display)',
        fontSize: 'var(--text-base)',
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: 'var(--text-primary)',
      }}
    >
      {children}
    </div>
  );
}

/** Free prose zone (the popup body, an effects line). */
function Body({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return (
    <div
      data-testid="reveal-body"
      style={{
        fontSize: 'var(--text-sm)',
        color: 'var(--text-secondary)',
        fontFamily: 'var(--font-body)',
        lineHeight: 1.6,
        textAlign: 'center',
      }}
    >
      {children}
    </div>
  );
}

export interface ConsequenceItem {
  id: string;
  icon?: React.ReactNode;
  title: string;
  /** Progressive disclosure — shown in the chip's tooltip. */
  desc?: string;
  onClick?: () => void;
}

/**
 * Follow-on effects as a row of small medallion chips. Labels are words — a
 * count of chips, never a numeric stat (no-numeric-stats rule, NFP #5).
 * Overflow past `REVEAL_CONSEQUENCE_CHIP_MAX` collapses into a `+N` chip.
 */
function Consequences({ label, items }: { label: string; items: readonly ConsequenceItem[] }) {
  if (!items || items.length === 0) return null;

  const shown = items.slice(0, REVEAL_CONSEQUENCE_CHIP_MAX);
  const overflow = items.length - shown.length;

  return (
    <div data-testid="reveal-consequences" style={{ width: '100%' }}>
      <h3
        className="section-heading"
        style={{
          fontSize: 'var(--text-xs)',
          textAlign: 'center',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--text-tertiary)',
          margin: '0 0 var(--space-3)',
        }}
      >
        {label} ({items.length})
      </h3>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
        {shown.map((item) => (
          <Tooltip key={item.id} label={item.title} desc={item.desc}>
            <span
              onClick={item.onClick}
              style={{ cursor: item.onClick ? 'pointer' : 'default', display: 'inline-flex' }}
            >
              <Medallion size="sm" title={item.title}>
                {item.icon}
              </Medallion>
            </span>
          </Tooltip>
        ))}
        {overflow > 0 && (
          <Medallion size="sm" title={`${overflow} more`}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>+{overflow}</span>
          </Medallion>
        )}
      </div>
    </div>
  );
}

/** Thin wrapper over FlavorQuote so the zone stack reads in one vocabulary. */
function Quote({
  children,
  attribution,
}: {
  children?: React.ReactNode;
  attribution?: string;
}) {
  return (
    <FlavorQuote attribution={attribution} style={{ width: '100%' }}>
      {children}
    </FlavorQuote>
  );
}

/** One full-width, deliberately quiet button. The moment ends cleanly. */
function Dismiss({ label = 'Acknowledge', onClick }: { label?: string; onClick: () => void }) {
  return (
    <Button variant="secondary" size="lg" fullWidth onClick={onClick} data-testid="reveal-dismiss">
      {label}
    </Button>
  );
}
// Tagged so RevealCardRoot can pin it below the scroll region — long prose must
// scroll the zones, never push the dismiss past the panel edge.
Dismiss.displayName = 'RevealCard.Dismiss';

// ─── Frame + Root ────────────────────────────────────────────────────────────

export interface RevealCardFrameProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * The zone stack with no Modal wrapper — single column, `--space-ceremonial`
 * between zones. Use inside a surface that is already a modal so nothing
 * double-portals or double-backdrops.
 */
function Frame({ children, className, style }: RevealCardFrameProps) {
  return (
    <div
      data-testid="reveal-card-frame"
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 'var(--space-ceremonial)',
        padding: 'var(--space-ceremonial)',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export interface RevealCardProps {
  open: boolean;
  onClose: () => void;
  maxWidth?: number;
  'aria-label'?: string;
  children: React.ReactNode;
}

function RevealCardRoot({
  open,
  onClose,
  maxWidth = REVEAL_CARD_MAX_WIDTH,
  'aria-label': ariaLabel,
  children,
}: RevealCardProps) {
  // The zones scroll; the frame and the dismiss stay put. Splitting them is what
  // keeps a long-prose reveal from pushing its own dismiss button past the panel
  // edge (fail-soft row "content overflow").
  const all = React.Children.toArray(children);
  const dismiss = all.filter(isDismiss);
  const zones = all.filter((child) => !isDismiss(child));

  return (
    <Modal
      open={open}
      onClose={onClose}
      maxWidth={maxWidth}
      aria-label={ariaLabel}
      panelClassName="frame-ceremonial"
    >
      <div style={{ overflowY: 'auto', flex: 1, minHeight: 0 }}>
        <Frame>{zones}</Frame>
      </div>
      {dismiss.length > 0 && (
        <div
          style={{
            flexShrink: 0,
            padding: 'var(--space-ceremonial)',
            paddingTop: 0,
          }}
        >
          {dismiss}
        </div>
      )}
    </Modal>
  );
}

/** True for a `RevealCard.Dismiss` element, wherever it sits in the child list. */
function isDismiss(child: React.ReactNode): boolean {
  return React.isValidElement(child) && child.type === Dismiss;
}

export const RevealCard = Object.assign(RevealCardRoot, {
  Frame,
  Title,
  Medallion: HeroMedallion,
  Banner,
  Body,
  Consequences,
  Quote,
  Dismiss,
});
