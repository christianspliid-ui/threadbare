/**
 * LensLegend — the legend card under the lens bar (THR-1878 plan § D1, D3; THR-1830 § 3).
 *
 * A glass `Panel` capped at LENS_LEGEND_MAX_HEIGHT_PX (Law 57: the longest legend fits
 * at its limit, it never scrolls). Dominion keeps its THR-1750 legend: the fixed lines
 * and the five band words with their tooltips. Every other lens shows its head, its
 * fixed lines, its mark row — derived from `MAP_MARKERS` (`legendEntriesFor`), so the
 * legend cannot disagree with the map (Laws 12, 58) — and its empty line when it has
 * nothing to light.
 */
import { memo } from 'react';
import { Panel } from '../../shared/Panel';
import { Tooltip } from '../../shared/Tooltip';
import type { MapLensDef } from '../../../data/map-lenses';
import { legendMarksFor } from '../../../data/map-markers';
import { Icon } from '../../shared/Icon';
import { isIconName } from '../../shared/iconShape';
import { DOMINION_BAND_WORDS } from '../../../data/dominion-content';
import { DOMINION_LEGEND_ORDER, DOMINION_LEGEND_MAX_HEIGHT_PX, dominionBandTooltipId } from '../../../data/dominion-ui-content';
import { legendInkColor } from '../scene/lensInk';
import type { LensLegendNote } from '../../../engine/views/lenses/lensTypes';

/** Legend card limit — Dominion's, by import, so the value lives once (THR-1830 § 3). */
export const LENS_LEGEND_MAX_HEIGHT_PX = DOMINION_LEGEND_MAX_HEIGHT_PX;
/** Legend card width (THR-1830 mock). */
export const LENS_LEGEND_MAX_WIDTH_PX = 330;
/** The 1080p root size the px limits are written against; the card scales with the root step (THR-1819). */
const ROOT_PX_AT_1080 = 16;
/** Swatch size beside a legend word. */
const LENS_LEGEND_SWATCH_PX = 10;

export interface HexLensLegendView {
  head: string;
  /** A note after the head with its own tooltip — Trouble's "Doom: Signs" (THR-1898). */
  headNote?: LensLegendNote | null;
  lines: readonly string[];
  emptyLine: string | null;
}

export interface LensLegendProps {
  lens: MapLensDef;
  /** Band-word colours for the Dominion legend chips. */
  bandColors: Readonly<Record<string, string>>;
  /** The hex lens's legend words, from its view model; null for Dominion. */
  hexLegend: HexLensLegendView | null;
}

export const LensLegend = memo(function LensLegend({ lens, bandColors, hexLegend }: LensLegendProps) {
  const marks = legendMarksFor(lens.id);
  return (
    <Panel
      level="panel"
      material="glass"
      floating
      data-testid="map-lens-legend"
      data-lens={lens.id}
      style={{
        pointerEvents: 'auto',
        // In rem, so the limit grows with the 1440p type step and the longest legend
        // still fits at its limit (Law 57: never scrolls, never truncates).
        maxHeight: `${LENS_LEGEND_MAX_HEIGHT_PX / ROOT_PX_AT_1080}rem`,
        maxWidth: `${LENS_LEGEND_MAX_WIDTH_PX / ROOT_PX_AT_1080}rem`,
        overflow: 'hidden',
        padding: '8px 12px',
        fontSize: 'var(--text-xs)',
        fontFamily: 'var(--font-body)',
        color: 'var(--text-secondary)',
        lineHeight: 1.5,
      }}
    >
      {lens.layer === 'dominion' ? (
        <>
          {lens.legend.map(line => <div key={line}>{line}</div>)}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
            {DOMINION_LEGEND_ORDER.map(band => (
              <Tooltip key={band} id={dominionBandTooltipId(band)}>
                <span data-testid={`map-lens-band-${band}`} style={{ color: bandColors[band] ?? 'var(--text-secondary)', fontWeight: 600 }}>
                  {DOMINION_BAND_WORDS[band]}
                </span>
              </Tooltip>
            ))}
          </div>
        </>
      ) : (
        <>
          <div data-testid="map-lens-legend-head" style={{ color: 'var(--text-primary)', fontWeight: 700 }}>
            {hexLegend?.head ?? lens.label}
            {hexLegend?.headNote && (
              <>
                {' · '}
                <Tooltip id={hexLegend.headNote.tooltipId}>
                  <span data-testid="map-lens-legend-head-note">{hexLegend.headNote.text}</span>
                </Tooltip>
              </>
            )}
          </div>
          {(hexLegend?.lines ?? lens.legend).map(line => <div key={line}>{line}</div>)}
          {hexLegend?.emptyLine && (
            <div data-testid="map-lens-legend-empty" style={{ fontStyle: 'italic', marginTop: 4 }}>{hexLegend.emptyLine}</div>
          )}
          {marks.length > 0 && (
            <div data-testid="map-lens-legend-marks" style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 6 }}>
              {marks.map(({ entry, icon, ink }) => (
                <Tooltip key={`${entry.word}-${entry.tooltipId}`} id={entry.tooltipId}>
                  <span data-legend-mark={entry.word} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    {/* THR-1898: a mark with a carved shape shows that shape in its ink, as the map draws it. */}
                    {icon && isIconName(icon) ? (
                      <span style={{ display: 'inline-flex', color: legendInkColor(entry.tone, ink), flexShrink: 0 }}>
                        <Icon name={icon} size="floor" decorative />
                      </span>
                    ) : (
                      <span
                        aria-hidden="true"
                        style={{
                          width: LENS_LEGEND_SWATCH_PX,
                          height: LENS_LEGEND_SWATCH_PX,
                          borderRadius: '50%',
                          background: legendInkColor(entry.tone, ink),
                          flexShrink: 0,
                        }}
                      />
                    )}
                    <span style={{ color: 'var(--text-primary)' }}>{entry.word}</span>
                  </span>
                </Tooltip>
              ))}
            </div>
          )}
        </>
      )}
    </Panel>
  );
});
