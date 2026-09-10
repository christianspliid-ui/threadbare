/**
 * useIncidentCapture (THR-1134) — the Settings button's whole behaviour.
 *
 * Builds the bundle, serializes it, hands it to the browser as a file, and says
 * one plain sentence about what happened. Also owns the *record what happens*
 * toggle, which arms the trace ring — off by default because
 * `traceBuffer.emitTrace` evicts with `shift()` plus a full renumber, and a
 * saturated tick pays that per evicted entry. The cost is real, so the player
 * chooses it.
 */

import { useCallback, useRef, useState } from 'react';

import {
  INCIDENT_FILENAME_PREFIX,
  INCIDENT_WORLD_TIER_WARN_BYTES,
} from '../../../data/incident-snapshot-constants';
import {
  buildIncidentBundle,
  serializeIncidentBundle,
  emitIncidentBundleTrace,
  incidentBundleFilename,
  type IncidentUIState,
} from '../../../engine/incidentBundle';
import { enableTracing, disableTracing, isTracingEnabled } from '../../../engine/traceBuffer';
import type { GameState } from '../../../types/gameState';
import type { SimulationRuntime } from '../../../engine/simulationRuntime';
import type { ToastItem } from '../../../types/notification';
import { downloadTextFile } from '../../shared/downloadTextFile';

/** How long the capture toasts stay up. Matches the game's other action toasts. */
const CAPTURE_TOAST_MS = 6000;

export interface UseIncidentCaptureArgs {
  gameState: GameState;
  runtime: SimulationRuntime;
  mapSize?: string;
  mapCols?: number;
  mapRows?: number;
  /** The active-UI composer, shared with the debug bridge's registration. */
  getActiveUIState: () => IncidentUIState;
  onPushToast: (toast: ToastItem) => void;
}

export interface UseIncidentCaptureResult {
  /** Whether the trace ring is armed. */
  recording: boolean;
  toggleRecording: () => void;
  /** Whether the next capture carries the whole graph. */
  includeWorld: boolean;
  toggleIncludeWorld: () => void;
  captureSnapshot: () => void;
}

export function useIncidentCapture({
  gameState,
  runtime,
  mapSize,
  mapCols,
  mapRows,
  getActiveUIState,
  onPushToast,
}: UseIncidentCaptureArgs): UseIncidentCaptureResult {
  // Seeded from the buffer rather than assumed false: a session that armed
  // tracing from the debug CLI should not see the toggle claim otherwise.
  const [recording, setRecording] = useState(() => isTracingEnabled());
  const [includeWorld, setIncludeWorld] = useState(false);

  // Read through a ref inside the callback so arming/disarming never re-creates
  // the capture handler, which is passed down through two components.
  const stateRef = useRef(gameState);
  stateRef.current = gameState;

  const toggleRecording = useCallback(() => {
    setRecording(prev => {
      if (prev) disableTracing();
      else enableTracing();
      return !prev;
    });
  }, []);

  const toggleIncludeWorld = useCallback(() => setIncludeWorld(v => !v), []);

  const pushToast = useCallback(
    (message: string) => {
      onPushToast({
        id: `incident-${Date.now()}`,
        message,
        count: 1,
        createdTick: stateRef.current.tick,
        expiresAt: Date.now() + CAPTURE_TOAST_MS,
      });
    },
    [onPushToast],
  );

  const captureSnapshot = useCallback(() => {
    const state = stateRef.current;
    try {
      const bundle = buildIncidentBundle(state, runtime, {
        includeWorld,
        mapSize,
        mapCols,
        mapRows,
        ui: getActiveUIState(),
      });
      const json = serializeIncidentBundle(bundle);
      const build =
        typeof (bundle.run as { build?: unknown })?.build === 'string'
          ? String((bundle.run as { build: string }).build)
          : 'unknown';
      downloadTextFile(
        json,
        incidentBundleFilename(INCIDENT_FILENAME_PREFIX, build, state.seed, state.tick),
      );
      emitIncidentBundleTrace(bundle, json.length, state.tick);

      // Laws 13/14: the size is a phrase, never a figure. The bytes are in the
      // file's own manifest and on the ticket, which is where numerals belong.
      const tooBig = json.length > INCIDENT_WORLD_TIER_WARN_BYTES;
      pushToast(
        tooBig
          ? 'Snapshot saved, though this one may be too big to attach.'
          : 'Snapshot saved. Attach the file to your message.',
      );
    } catch (err) {
      console.error('[useIncidentCapture] snapshot failed', err);
      pushToast('The snapshot could not be saved.');
    }
  }, [runtime, includeWorld, mapSize, mapCols, mapRows, getActiveUIState, pushToast]);

  return { recording, toggleRecording, includeWorld, toggleIncludeWorld, captureSnapshot };
}
