/**
 * ReachStanding — a mortal's standing in one Reach, the way the character
 * sheet says it: the reach name, its rank word, and five magnitude dots
 * ("STONE · Skilled ●●●○○").
 *
 * THR-1724 extracted it from `DomainCard` so the encounter screen's title row
 * can show the acting mortal's skill in the step's reach in the *same* look the
 * sheet uses (Law 27 — one primitive, not a second drawing of the same fact).
 *
 * Two layouts:
 *  - `stacked` — name and word on one line, dots beneath (the sheet's card).
 *  - `inline`  — all three on one line (the encounter title row's chip).
 *
 * The word is the magnitude (Law 13); the dots repeat it as a level, never as
 * progress. An unrevealed reach shows `???` and no dots, as the sheet always has.
 */

import type { CSSProperties, ReactNode } from 'react';
import type { ReachDomain } from '../../types/traits';
import { DOMAIN_WORD_SCALES } from '../../data/domain-words';
import { MAGNITUDE_DOTS_TOTAL } from '../../data/item-stat-bands';
import { StepDots } from './StepDots';
import { Tooltip } from './Tooltip';

export const REACH_DISPLAY_NAMES: Record<ReachDomain, string> = {
  iron: 'Iron', gold: 'Gold', shadow: 'Shadow', veil: 'Veil',
  heart: 'Heart', eye: 'Eye', stone: 'Stone', star: 'Star',
};

/** Highest 0-indexed tier on `DOMAIN_WORD_SCALES`. */
const MAX_TIER = 4;

export interface ReachStandingProps {
  reach: ReachDomain;
  /** 0-indexed tier (0–4) matching `DOMAIN_WORD_SCALES`. Clamped. */
  tier: number;
  /** Unrevealed: `???` and no dots. Defaults to revealed. */
  revealed?: boolean;
  layout?: 'stacked' | 'inline';
  /** Ink for the reach name (the sheet uses gold; the veil its warm text). */
  nameColor?: string;
  /** Ink for the rank word. */
  wordColor?: string;
  /** Dot edge in px. */
  dotSize?: number;
  /**
   * Whether the reach *name* carries the `reach.*` registry tooltip. A host that
   * wraps the whole readout in its own tooltip turns this off, so one hover
   * never stacks two tips.
   */
  nameTooltip?: boolean;
  'data-testid'?: string;
  style?: CSSProperties;
}

export function reachStandingWord(reach: ReachDomain, tier: number): string {
  const clamped = Math.max(0, Math.min(MAX_TIER, Math.round(tier)));
  return DOMAIN_WORD_SCALES[reach]?.[clamped] ?? '';
}

export function ReachStanding({
  reach,
  tier,
  revealed = true,
  layout = 'stacked',
  nameColor,
  wordColor,
  dotSize = 6,
  nameTooltip = true,
  'data-testid': testId,
  style,
}: ReachStandingProps) {
  const clampedTier = Math.max(0, Math.min(MAX_TIER, Math.round(tier)));
  const name = REACH_DISPLAY_NAMES[reach] ?? reach;
  const word = revealed ? reachStandingWord(reach, clampedTier) : '???';

  const nameEl: ReactNode = (
    <span
      className={nameTooltip ? 'text-xs font-semibold underline decoration-dotted cursor-help' : 'text-xs font-semibold'}
      style={{
        color: nameColor ?? (revealed ? 'var(--accent-gold)' : 'var(--text-tertiary)'),
        fontVariant: 'small-caps',
        letterSpacing: '0.1em',
      }}
    >
      {name}
    </span>
  );

  const label = (
    <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 4 }}>
      {nameTooltip ? <Tooltip id={`reach.${reach}`}>{nameEl}</Tooltip> : nameEl}
      <span
        className="text-xs"
        style={{
          color: wordColor ?? 'var(--text-tertiary)',
          fontVariant: 'small-caps',
          letterSpacing: '0.05em',
        }}
      >
        &middot; {word}
      </span>
    </span>
  );

  // Magnitude dots — a level, not progress. Tier 0–4 → 1–5 filled.
  const dots = revealed ? (
    <span
      role="img"
      aria-label={`${name} magnitude ${clampedTier + 1} of ${MAGNITUDE_DOTS_TOTAL}`}
      style={{ display: 'inline-flex', marginTop: layout === 'stacked' ? 4 : 0 }}
    >
      <StepDots
        variant="magnitude"
        totalSteps={MAGNITUDE_DOTS_TOTAL}
        currentStepIndex={clampedTier + 1}
        size={dotSize}
      />
    </span>
  ) : null;

  return (
    <span
      data-testid={testId}
      data-reach={reach}
      data-reach-tier={clampedTier}
      style={{
        display: 'inline-flex',
        flexDirection: layout === 'stacked' ? 'column' : 'row',
        alignItems: layout === 'stacked' ? 'flex-start' : 'center',
        gap: layout === 'stacked' ? 0 : 8,
        ...style,
      }}
    >
      {label}
      {dots}
    </span>
  );
}
