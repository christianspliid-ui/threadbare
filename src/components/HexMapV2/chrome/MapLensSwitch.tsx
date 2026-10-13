/**
 * MapLensSwitch — the map lens switch and legend (THR-1750 § U2).
 *
 * One button per `MAP_LENSES` row (today: Dominion), with its key hint. Pressed
 * state is a `--text-primary` underline and `aria-pressed` — never gold, so the
 * frontier line is the one gold emphasis on the map while the lens is on. With the
 * lens on, a small legend card shows the three legend lines and the five band
 * words, each word carrying its `ui.dominion.<band>` tooltip (Laws 1, 17).
 *
 * Anchored top-left of the map canvas: the bottom-left corner holds the Active
 * Locations bar (THR-127), and THR-1831 keeps the bottom-right for map controls.
 * THR-1830 may restyle this into its lens bar.
 */
import { memo } from 'react';
import { Tooltip } from '../../shared/Tooltip';
import { MAP_LENSES, type MapLensId } from '../../../data/map-lenses';
import { DOMINION_BAND_WORDS } from '../../../data/dominion-content';
import { DOMINION_LEGEND_ORDER, DOMINION_LEGEND_MAX_HEIGHT_PX, dominionBandTooltipId } from '../../../data/dominion-ui-content';

/** Gap from the map canvas edges, in px. */
const LENS_SWITCH_INSET_PX = 16;

export interface MapLensSwitchProps {
  active: MapLensId | null;
  onToggle: (lens: MapLensId) => void;
  /** Band-word colours for the legend chips (prepared by the caller). */
  bandColors: Readonly<Record<string, string>>;
}

export const MapLensSwitch = memo(function MapLensSwitch({ active, onToggle, bandColors }: MapLensSwitchProps) {
  const activeLens = MAP_LENSES.find(l => l.id === active);
  return (
    <div
      data-testid="map-lens-switch"
      style={{
        position: 'absolute',
        top: LENS_SWITCH_INSET_PX,
        left: LENS_SWITCH_INSET_PX,
        zIndex: 20,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 8,
        pointerEvents: 'none',
      }}
    >
      <div style={{ display: 'flex', gap: 6, pointerEvents: 'auto' }}>
        {MAP_LENSES.map(lens => {
          const pressed = lens.id === active;
          return (
            <Tooltip key={lens.id} id={lens.tooltipId}>
              <button
                type="button"
                data-testid={`map-lens-${lens.id}`}
                aria-pressed={pressed}
                onClick={() => onToggle(lens.id)}
                style={{
                  padding: '4px 10px',
                  borderRadius: 8,
                  background: 'rgba(0,0,0,0.6)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(160, 152, 128, 0.2)',
                  color: pressed ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontFamily: 'var(--font-display)',
                  fontSize: 'var(--text-sm)',
                  textDecoration: pressed ? 'underline' : 'none',
                  textDecorationColor: 'var(--text-primary)',
                  textUnderlineOffset: 4,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 8,
                }}
              >
                {lens.label}
                <kbd
                  aria-hidden="true"
                  style={{
                    fontSize: 'var(--text-xs)',
                    color: 'var(--text-tertiary)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 3,
                    padding: '0 4px',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  {lens.key}
                </kbd>
              </button>
            </Tooltip>
          );
        })}
      </div>

      {activeLens && (
        <div
          data-testid="map-lens-legend"
          style={{
            pointerEvents: 'auto',
            maxHeight: DOMINION_LEGEND_MAX_HEIGHT_PX,
            overflow: 'hidden',
            maxWidth: 300,
            padding: '8px 12px',
            borderRadius: 8,
            background: 'rgba(10, 10, 14, 0.85)',
            border: '1px solid var(--border-subtle)',
            fontSize: 'var(--text-xs)',
            fontFamily: 'var(--font-body)',
            color: 'var(--text-secondary)',
            lineHeight: 1.5,
          }}
        >
          {activeLens.legend.map(line => <div key={line}>{line}</div>)}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
            {DOMINION_LEGEND_ORDER.map(band => (
              <Tooltip key={band} id={dominionBandTooltipId(band)}>
                <span data-testid={`map-lens-band-${band}`} style={{ color: bandColors[band] ?? 'var(--text-secondary)', fontWeight: 600 }}>
                  {DOMINION_BAND_WORDS[band]}
                </span>
              </Tooltip>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});
