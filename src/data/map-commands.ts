/**
 * map-commands.ts — one list of map commands: the keys and the control buttons
 * (THR-1900, plan `2026-10-14-thr-1878-map-lenses-and-chrome.md` D6, D9; Law 58).
 *
 * `MapControls` renders the rows that carry a `button`, in list order; `useMapHotkeys`
 * binds every row's `keys`. So a button and its key cannot disagree, and a new command is
 * one row here. `mapKeys.coverage.test.ts` fails when a key collides with the top bar's or
 * a lens key, or a button has no registered tooltip.
 *
 * Keys (THR-1828 keeps `+` / `=` / `-` for speed and `W` for widen, so THR-1831's zoom keys
 * and WASD moved): PageUp / PageDown zoom, arrows pan, Home centres on the First, F shows
 * known land, V shows or hides the minimap (THR-1901). Lens keys `1`–`5` stay in `MAP_LENSES`. Escape is never bound here (Law 23).
 *
 * Zoom in and out draw a typographic "+" and "−" (THR-1879: no carved period object reads
 * as plus or minus); the other buttons draw carved icons from the registry.
 */
import type { IconName } from './icons/iconRegistry';

export type MapCommandId =
  | 'zoom_in'
  | 'zoom_out'
  | 'centre_first'
  | 'show_known_land'
  | 'toggle_minimap'
  | 'pan_up'
  | 'pan_down'
  | 'pan_left'
  | 'pan_right';

export interface MapCommandButton {
  /** A carved registry icon, or null when the button draws `glyph` instead. */
  icon: IconName | null;
  /** Typographic face for a button with no carved icon (zoom in / out). */
  glyph?: string;
  /** `ui.map.*` tooltip id — label is the button's name, desc says what it does and its key. */
  tooltipId: string;
  ariaLabel: string;
}

export interface MapCommandDef {
  id: MapCommandId;
  /** `KeyboardEvent.key` values that run this command. */
  keys: readonly string[];
  /** The control-cluster button, or null for a key-only command (pan). */
  button: MapCommandButton | null;
}

export const MAP_COMMANDS: readonly MapCommandDef[] = [
  {
    id: 'zoom_in',
    keys: ['PageUp'],
    button: { icon: null, glyph: '+', tooltipId: 'ui.map.zoom_in', ariaLabel: 'Zoom in' },
  },
  {
    id: 'zoom_out',
    keys: ['PageDown'],
    button: { icon: null, glyph: '−', tooltipId: 'ui.map.zoom_out', ariaLabel: 'Zoom out' },
  },
  {
    id: 'centre_first',
    keys: ['Home'],
    button: { icon: 'show-on-map', tooltipId: 'ui.map.centre_first', ariaLabel: 'Centre on my First' },
  },
  {
    id: 'show_known_land',
    keys: ['f', 'F'],
    button: { icon: 'show-known-land', tooltipId: 'ui.map.show_known_land', ariaLabel: 'Show known land' },
  },
  // THR-1901 (D10) — the minimap's fold: the fifth button, pressed while the minimap is open.
  {
    id: 'toggle_minimap',
    keys: ['v', 'V'],
    button: { icon: 'minimap', tooltipId: 'ui.map.minimap', ariaLabel: 'Show the minimap' },
  },
  { id: 'pan_up', keys: ['ArrowUp'], button: null },
  { id: 'pan_down', keys: ['ArrowDown'], button: null },
  { id: 'pan_left', keys: ['ArrowLeft'], button: null },
  { id: 'pan_right', keys: ['ArrowRight'], button: null },
];

/** Arrow pans as (dx, dy) shares of the canvas, +y up (the way the arrow points). */
export const MAP_PAN_DIRECTIONS: Readonly<Partial<Record<MapCommandId, readonly [number, number]>>> = {
  pan_up: [0, 1],
  pan_down: [0, -1],
  pan_left: [-1, 0],
  pan_right: [1, 0],
};

/** Why a control button is disabled — shown in its tooltip (Law 25: never silently inert). */
export const MAP_CONTROL_DISABLED_REASONS = {
  closest: 'Closest view',
  widest: 'Widest view',
  noFocus: 'No one to centre on yet',
} as const;

/** The minimap button's name in each state (Law 25: a toggle says what pressing it does). */
export const MINIMAP_TOGGLE_LABELS = { show: 'Show the minimap', hide: 'Hide the minimap' } as const;

/** The command a key runs, or undefined. */
export function mapCommandForKey(key: string): MapCommandDef | undefined {
  return MAP_COMMANDS.find(c => c.keys.includes(key));
}

/** One control button's state, as `MapControls` draws it and `getMapChrome().controls` reports it. */
export interface MapControlState {
  id: MapCommandId;
  disabled: boolean;
  reason: string | null;
}

export interface MapControlInput {
  atMax: boolean;
  atMin: boolean;
  /** A First or a seat to centre on. */
  hasFocusTarget: boolean;
}

/** Every button row's enabled state, in list order (Law 25). */
export function mapControlStates({ atMax, atMin, hasFocusTarget }: MapControlInput): MapControlState[] {
  const out: MapControlState[] = [];
  for (const cmd of MAP_COMMANDS) {
    if (!cmd.button) continue;
    let reason: string | null = null;
    if (cmd.id === 'zoom_in' && atMax) reason = MAP_CONTROL_DISABLED_REASONS.closest;
    else if (cmd.id === 'zoom_out' && atMin) reason = MAP_CONTROL_DISABLED_REASONS.widest;
    else if (cmd.id === 'centre_first' && !hasFocusTarget) reason = MAP_CONTROL_DISABLED_REASONS.noFocus;
    out.push({ id: cmd.id, disabled: reason !== null, reason });
  }
  return out;
}
