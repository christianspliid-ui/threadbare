/**
 * MapControls — the map's control cluster (THR-1900, plan THR-1878 D6; THR-1831 § 1).
 *
 * A vertical column of `IconButton`s, one per `MAP_COMMANDS` row that carries a button, in
 * list order: Zoom in · Zoom out · Centre on my First · Show known land · the minimap's fold
 * (THR-1901: "Show the minimap" / "Hide the minimap", pressed while it is open). Each has an
 * aria-label and its `ui.map.*` tooltip (Laws 1, 17). At a limit a button is disabled with
 * its reason in the tooltip — "Closest view", "Widest view", "No one to centre on yet" — and
 * a press answers with the rejection shake (Laws 25, 47). Disabled is `aria-disabled`, not the
 * `disabled` attribute, so the tooltip still opens on hover and focus.
 *
 * The zoom limits come from the map handle's camera subscription, so a zoom event re-renders
 * this column only, never the map host.
 */
import { memo, useEffect, useState, type RefObject } from 'react';
import { IconButton } from '../../shared/IconButton';
import { Icon } from '../../shared/Icon';
import { Tooltip } from '../../shared/Tooltip';
import { getUITooltip } from '../../../data/ui-content';
import {
  MAP_COMMANDS,
  MINIMAP_TOGGLE_LABELS,
  mapControlStates,
  type MapCommandId,
  type MapControlState,
} from '../../../data/map-commands';
import { zoomLimits } from '../camera/cameraFraming';
import type { HexMapV2Handle } from '../HexMapV2';

/** Button edge: 40 px at 1080p, 45 px at 1440p (Law 46). */
const MAP_CONTROL_BUTTON_SIZE = '2.5rem';
/** Gap between buttons. */
const MAP_CONTROL_GAP_PX = 6;
/** How long the rejection shake class stays on a refused press (matches `--anim-slow`). */
const MAP_CONTROL_SHAKE_MS = 400;

export interface MapControlsProps {
  hexMapRef: RefObject<HexMapV2Handle>;
  /** A First or a seat exists to centre on. */
  hasFocusTarget: boolean;
  /** Runs a command (shared with the map keys, so a button and its key cannot disagree). */
  onCommand: (id: MapCommandId) => void;
  /** THR-1901 — the minimap is open: its fold button reads "Hide the minimap" and shows pressed. */
  minimapOpen?: boolean;
}

export const MapControls = memo(function MapControls({ hexMapRef, hasFocusTarget, onCommand, minimapOpen = false }: MapControlsProps) {
  const [limits, setLimits] = useState({ atMax: false, atMin: false });
  const [shaking, setShaking] = useState<MapCommandId | null>(null);

  useEffect(() => {
    const handle = hexMapRef.current;
    if (!handle) return;
    return handle.subscribeCamera(({ k, minK, maxK }) => {
      const next = zoomLimits(k, minK, maxK);
      setLimits(prev => (prev.atMax === next.atMax && prev.atMin === next.atMin ? prev : next));
    });
  }, [hexMapRef]);

  useEffect(() => {
    if (!shaking) return;
    const id = setTimeout(() => setShaking(null), MAP_CONTROL_SHAKE_MS);
    return () => clearTimeout(id);
  }, [shaking]);

  const states = new Map<MapCommandId, MapControlState>(
    mapControlStates({ ...limits, hasFocusTarget }).map(s => [s.id, s]),
  );

  return (
    <div
      data-testid="map-controls"
      role="toolbar"
      aria-label="Map controls"
      aria-orientation="vertical"
      style={{ display: 'flex', flexDirection: 'column', gap: MAP_CONTROL_GAP_PX, pointerEvents: 'auto' }}
    >
      {MAP_COMMANDS.map(cmd => {
        if (!cmd.button) return null;
        const state = states.get(cmd.id);
        const disabled = state?.disabled ?? false;
        const label = getUITooltip(cmd.button.tooltipId)?.label ?? cmd.button.ariaLabel;
        const isMinimap = cmd.id === 'toggle_minimap';
        const ariaLabel = isMinimap
          ? (minimapOpen ? MINIMAP_TOGGLE_LABELS.hide : MINIMAP_TOGGLE_LABELS.show)
          : cmd.button.ariaLabel;
        return (
          <Tooltip
            key={cmd.id}
            id={cmd.button.tooltipId}
            label={label}
            desc={disabled && state?.reason ? state.reason : undefined}
            focusable={false}
            fit
          >
            <IconButton
              type="button"
              data-testid={`map-control-${cmd.id}`}
              aria-label={ariaLabel}
              aria-pressed={isMinimap ? minimapOpen : undefined}
              aria-disabled={disabled || undefined}
              className={shaking === cmd.id ? 'anim-shake-no' : undefined}
              onClick={() => {
                if (disabled) {
                  setShaking(cmd.id);
                  return;
                }
                onCommand(cmd.id);
              }}
              icon={cmd.button.icon
                ? <Icon name={cmd.button.icon} size="alone" decorative />
                : <span aria-hidden="true" style={{ fontSize: 'var(--text-lg)', lineHeight: 1, fontFamily: 'var(--font-body)' }}>{cmd.button.glyph}</span>}
              style={{
                width: MAP_CONTROL_BUTTON_SIZE,
                height: MAP_CONTROL_BUTTON_SIZE,
                backgroundColor: 'var(--bg-glass)',
                color: isMinimap && minimapOpen ? 'var(--text-primary)' : 'var(--text-secondary)',
                opacity: disabled ? 0.4 : 1,
                cursor: disabled ? 'not-allowed' : 'pointer',
              }}
            />
          </Tooltip>
        );
      })}
    </div>
  );
});
