/**
 * MapLensSwitch — the map lens bar and its legend (THR-1750 § U2; rebuilt by THR-1878 § D1).
 *
 * One toggle per `MAP_LENSES` row on the shared `Tabs kind="toggle" allowNone`: label
 * plus key cap, pressed state an underline and `aria-pressed`, never gold (Law 31) —
 * the frontier line stays the one gold emphasis on the map while Dominion is on.
 * Radio, not stack: pressing a lens turns any other off; pressing it again turns it
 * off. Each button carries its lens's `ui.*` tooltip (Laws 1, 17); while a moment or
 * an armed card holds the lens off, the pressed button's tooltip says so (D2).
 *
 * The legend card (`LensLegend`, a glass Panel) sits under the bar while a lens is on.
 * Anchored top-left of the map canvas; THR-1831 keeps the bottom-right for the
 * control cluster.
 */
import { memo } from 'react';
import { Tabs } from '../../shared/Tabs';
import { getUITooltip } from '../../../data/ui-content';
import { MAP_LENSES, isMapLensId, mapLensById, type MapLensId } from '../../../data/map-lenses';
import { LENS_VIEW_WORDS } from '../../../data/view-content';
import { LensLegend, type HexLensLegendView } from './LensLegend';

/** Gap from the map canvas edges, in px (THR-1831 `MAP_CHROME_INSET_PX`). */
const LENS_SWITCH_INSET_PX = 16;

export interface MapLensSwitchProps {
  active: MapLensId | null;
  /** D2 — a moment or an armed card holds the lens layer off; the button stays pressed. */
  suppressed?: boolean;
  /** The bar's writer: the lens to turn on, or null to turn the pressed one off. */
  onChange: (next: MapLensId | null) => void;
  /** Band-word colours for the Dominion legend chips (prepared by the caller). */
  bandColors: Readonly<Record<string, string>>;
  /** The hex lens's legend words, from its view model; null for Dominion or no lens. */
  hexLegend?: HexLensLegendView | null;
}

export const MapLensSwitch = memo(function MapLensSwitch({ active, suppressed = false, onChange, bandColors, hexLegend = null }: MapLensSwitchProps) {
  const activeLens = mapLensById(active);
  return (
    <div
      data-testid="map-lens-switch"
      data-suppressed={suppressed ? 'true' : undefined}
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
      <Tabs
        kind="toggle"
        allowNone
        label="Map lenses"
        value={activeLens ? activeLens.id : null}
        onChange={(next) => onChange(isMapLensId(next) ? next : null)}
        style={{
          pointerEvents: 'auto',
          borderRadius: 8,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(160, 152, 128, 0.2)',
          padding: '0 4px',
        }}
      >
        {MAP_LENSES.map(lens => {
          const pressedAndHeld = suppressed && lens.id === activeLens?.id;
          const desc = getUITooltip(lens.tooltipId)?.desc;
          return (
            <Tabs.Tab
              key={lens.id}
              value={lens.id}
              label={lens.label}
              keyCap={lens.key}
              testId={`map-lens-${lens.id}`}
              tooltipId={lens.tooltipId}
              tooltipDesc={pressedAndHeld && desc ? `${desc} ${LENS_VIEW_WORDS.suppressedByStage}.` : undefined}
            />
          );
        })}
      </Tabs>

      {activeLens && !suppressed && (
        <LensLegend lens={activeLens} bandColors={bandColors} hexLegend={hexLegend} />
      )}
    </div>
  );
});
