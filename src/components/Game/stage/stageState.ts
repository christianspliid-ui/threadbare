/**
 * The Stage's slice of `GameScreenState` (THR-1892, plan THR-1877 § D9).
 *
 * `phase !== 'idle'` is the one flag the Stage owns: the Ledger rail steps aside, the
 * Inspector folds, the top bar's guard covers the moment, the lens is suppressed and the
 * map's controls and HTML overlays hide. The Stage writes `kind`, `phase` and `focus`;
 * `GameMap` reads `focus`, drives the map and writes the camera's result back. Neither
 * side holds the other's handle.
 */
import type { StageHomedKind } from '../../../data/homed-surfaces';
import type { StageMapFocus } from '../../HexMapV2/scene/StageFocusLayer';

export type StageFramePhase = 'idle' | 'entering' | 'open' | 'closing';
export type StageCameraMode = 'eased' | 'cut' | 'stayed' | 'timed_out';

export interface StageRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** What the Stage asks of the map: the dim and ring, what to frame, and where the window is. */
export type StageFocusRequest = StageMapFocus & {
  /** The hexes the camera fits in the window (the lit hex in S2). */
  frame: string[];
  /** The window's measured rectangle (viewport pixels), read after the rails settle. */
  windowRect: StageRect;
  /** Reduced motion: the camera cuts and the dim shows at once. */
  instant: boolean;
};

export interface StageScreenState {
  kind: StageHomedKind | null;
  phase: StageFramePhase;
  focus: StageFocusRequest | null;
  /** The camera landed (or timed out, or stayed). The panel enters on this. */
  cameraSettled: boolean;
  cameraMode: StageCameraMode | null;
  cameraK: number | null;
  /** The lit hex's centre and size on screen once the camera landed; null when unknown. */
  litHexScreen: { x: number; y: number; size: number } | null;
  /** A name clicked on the Stage opened the Inspector over it (Escape folds it back). */
  inspectorOverStage: boolean;
}

export const IDLE_STAGE: StageScreenState = {
  kind: null,
  phase: 'idle',
  focus: null,
  cameraSettled: false,
  cameraMode: null,
  cameraK: null,
  litHexScreen: null,
  inspectorOverStage: false,
};

export function isStageOpen(stage: Pick<StageScreenState, 'phase'>): boolean {
  return stage.phase !== 'idle';
}
