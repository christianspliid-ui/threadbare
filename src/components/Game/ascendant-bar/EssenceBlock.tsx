/**
 * EssenceBlock — the god's essence pools, readable as a spend (THR-1607, plan B4).
 *
 * What changed, and the law behind each piece:
 * - The fill scales to {@link ESSENCE_BAR_CEILING} (the starting pool), not `/10`,
 *   so a spend visibly moves the bar (Law 47). Under the old scale every pool of
 *   ten or more drew full, and pools start at fifty.
 * - Each row shows its whole-number balance — the one numeral Law 13's ratified
 *   exception allows, a resource-pool balance in persistent chrome
 *   (`formatEssencePool`).
 * - The order is fixed by the selector; a spend never reorders the list.
 * - The four Foundation spheres fold under *Elder powers*, closed by default,
 *   unless the god's own identity holds one.
 * - Every balance carries the `ui.essence.row` registry tooltip (Law 17).
 * - After a spend the row shows the Law 15 delta cluster for
 *   {@link ESSENCE_SPEND_FLASH_MS}; hovering a card lights the row it will draw
 *   from before the player commits.
 */
import React, { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { SphereIcon } from '../../shared/SphereIcon';
import { Tooltip } from '../../shared/Tooltip';
import { DeltaCluster } from '../../shared/DeltaCluster';
import { formatEssencePool } from '../../shared/formatEssence';
import { getSphereColor } from '../../../data/sphereIcons';
import { SPHERE_COPY, ESSENCE_ELDER_FOLD_LABEL } from '../../../data/ascendant-bar-content';
import { sphereDeltaReading } from '../../../engine/aftermathWords';
import type { SphereName } from '../../../types';
import type { EssenceRowView } from './selectors';
import {
  ESSENCE_BAR_CEILING,
  ESSENCE_SPEND_FLASH_MS,
  ESSENCE_FOUNDATION_FOLDED_DEFAULT,
  essenceFillPct,
  getEssencePreviewSphere,
  subscribeEssencePreview,
} from './essenceDisplay';
import styles from './styles.module.css';

/**
 * The smallest drop between two renders that counts as a spend worth flashing.
 * Sustained upkeep drains a pool by fractions every tick; flashing each of those
 * would turn the cue into noise. A cast costs whole measures.
 */
export const ESSENCE_SPEND_FLASH_MIN_DROP = 1;

const TREND_COLOR: Record<string, string> = {
  rising: 'var(--positive)',
  steady: 'var(--text-secondary)',
  ebbing: 'var(--negative)',
};

const TREND_ARROW: Record<string, string> = {
  rising: '↑', steady: '—', ebbing: '↓',
};

/**
 * Tracks a pool's spends and returns the drop still on show, or 0.
 *
 * A drop of at least {@link ESSENCE_SPEND_FLASH_MIN_DROP} since the last render
 * starts (or extends) the flash; spends inside one window accumulate, so two
 * quick casts read as one bigger bite rather than the second hiding the first.
 */
function useSpendFlash(level: number): number {
  const previous = useRef(level);
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const drop = previous.current - level;
    previous.current = level;
    if (!(drop >= ESSENCE_SPEND_FLASH_MIN_DROP)) return;
    setShown((s) => s + drop);
    const timer = setTimeout(() => setShown(0), ESSENCE_SPEND_FLASH_MS);
    return () => clearTimeout(timer);
  }, [level]);

  return shown;
}

interface EssenceRowProps {
  row: EssenceRowView;
  previewed: boolean;
}

function EssenceRow({ row, previewed }: EssenceRowProps) {
  const [expanded, setExpanded] = useState(false);
  const color = getSphereColor(row.sphere);
  const sphereCopy = SPHERE_COPY[row.sphere as SphereName];
  const label = sphereCopy?.label ?? row.sphere;
  const trendColor = TREND_COLOR[row.trend];
  const arrow = TREND_ARROW[row.trend];
  const fillPct = essenceFillPct(row.level);
  const spent = useSpendFlash(row.level);
  const spendReading = spent > 0 ? sphereDeltaReading(-spent / ESSENCE_BAR_CEILING, label) : null;

  return (
    <div>
      <div
        className={styles.essenceRow}
        data-testid={`essence-row-${row.sphere}`}
        data-previewed={previewed || undefined}
        onClick={() => setExpanded((v) => !v)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setExpanded((v) => !v); }}
        aria-expanded={expanded}
        style={previewed ? {
          background: 'var(--bg-hover)',
          boxShadow: `inset 2px 0 0 ${color}`,
        } : undefined}
      >
        <SphereIcon sphere={row.sphere} size={16} />
        <span style={{
          fontFamily: 'var(--font-body)', fontSize: 12,
          color: row.isPrimary ? 'var(--text-primary)' : row.isSecondary ? 'var(--text-secondary)' : 'var(--text-muted)',
          minWidth: 60,
        }}>
          {label}
        </span>
        <div className={styles.essenceFillBar}>
          <div
            data-testid={`essence-fill-${row.sphere}`}
            data-fill-pct={Math.round(fillPct)}
            style={{
              height: '100%', width: `${fillPct}%`,
              background: color,
              opacity: row.isPrimary ? 1 : row.isSecondary ? 0.75 : 0.5,
              transition: 'width 0.4s ease-out',
            }}
          />
        </div>
        {spendReading && (
          <span data-testid={`essence-spend-${row.sphere}`} style={{ lineHeight: 1 }}>
            <DeltaCluster
              direction={spendReading.direction}
              count={spendReading.count}
              label={spendReading.label}
              size={10}
            />
          </span>
        )}
        <Tooltip id="ui.essence.row" focusable={false}>
          <span
            data-testid={`essence-balance-${row.sphere}`}
            style={{
              fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 600,
              color: row.isPrimary || row.isSecondary ? 'var(--text-primary)' : 'var(--text-secondary)',
              minWidth: 22, textAlign: 'right',
              fontVariantNumeric: 'tabular-nums',
              cursor: 'help',
            }}
          >
            {formatEssencePool(row.level)}
          </span>
        </Tooltip>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 10, color: trendColor, minWidth: 12 }}>
          {arrow}
        </span>
      </div>
      {expanded && sphereCopy && (
        <div style={{
          fontFamily: 'var(--font-body)', fontStyle: 'italic',
          fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5,
          padding: '4px 6px 4px 30px',
        }}>
          {sphereCopy.role}
        </div>
      )}
    </div>
  );
}

interface EssenceBlockProps {
  rows: EssenceRowView[];
}

export function EssenceBlock({ rows }: EssenceBlockProps) {
  const [elderOpen, setElderOpen] = useState(!ESSENCE_FOUNDATION_FOLDED_DEFAULT);
  const preview = useSyncExternalStore(
    subscribeEssencePreview,
    getEssencePreviewSphere,
    getEssencePreviewSphere,
  );

  if (rows.length === 0) {
    return (
      <div style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: 13, color: 'var(--text-muted)' }}>
        No essence gathered yet.
      </div>
    );
  }

  const ownRows = rows.filter((r) => !r.isElder);
  const elderRows = rows.filter((r) => r.isElder);
  // A hovered card that draws on an elder power opens the fold for as long as it
  // is hovered — the preview must land on a row the player can see.
  const elderShown = elderOpen || elderRows.some((r) => r.sphere === preview);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {ownRows.map((row) => (
        <EssenceRow key={row.sphere} row={row} previewed={row.sphere === preview} />
      ))}
      {elderRows.length > 0 && (
        <>
          <Tooltip id="ui.essence.foundation_fold" focusable={false}>
            <button
              type="button"
              data-testid="essence-elder-fold"
              aria-expanded={elderShown}
              onClick={() => setElderOpen((v) => !v)}
              className={styles.essenceRow}
              style={{
                border: 'none', background: 'none', width: '100%',
                fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: 12,
                color: 'var(--text-muted)', textAlign: 'left',
              }}
            >
              <svg
                width="10" height="10" viewBox="0 0 10 10" aria-hidden="true"
                className={`${styles.chevron} ${elderShown ? styles.chevronOpen : ''}`}
              >
                <path d="M3 2 L7 5 L3 8" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {ESSENCE_ELDER_FOLD_LABEL}
            </button>
          </Tooltip>
          {elderShown && elderRows.map((row) => (
            <EssenceRow key={row.sphere} row={row} previewed={row.sphere === preview} />
          ))}
        </>
      )}
    </div>
  );
}
