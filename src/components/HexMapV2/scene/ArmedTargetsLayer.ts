/**
 * ArmedTargetsLayer — the map while a card is armed (THR-1914, Inspector plan § D9 way 3).
 *
 * Built from a `MapHighlightVM` on the lens grammar's plate builder (`addLensDimPlates`,
 * the same dim every lens draws — no second dim grammar):
 *
 * - **Lit** — a hex holding a castable target carries no plate: it keeps its colour.
 * - **Lit, locked** — a hex holding only locked targets carries a lighter plate, at
 *   `LENS_DIM_ALPHA × (1 − ARMED_LOCKED_LIT)`.
 * - **Dimmed** — every other land hex, at the lens dim strength.
 *
 * Mounted only while a card is armed, disposed on disarm — never alpha-hidden — and the
 * active lens is suppressed meanwhile (`lensSuppressed`), so two dims never stack. Fog
 * covers it (lens render slot, below FOG), and the view model keeps unexplored hexes out of
 * `lit` (the `'armedTargets'` knowledge surface). Not pickable: a click reaches the hex.
 */
import * as THREE from 'three';
import type { MapHighlightVM } from '../../../engine/views/armedTargets';
import { ARMED_LOCKED_LIT } from '../../../engine/views/viewConstants';
import { addLensDimPlates, dimKeysOf, LENS_DIM_ALPHA, type LensTile } from './HexLensLayer';

/** The scene-graph name — what `snapshotScene().layersActive` lists. */
export const ARMED_TARGETS_LAYER_NAME = 'armed_targets';

export interface ArmedTargetsLayer {
  group: THREE.Group;
  counts: { lit: number; litLocked: number; dimmed: number };
  dispose(): void;
}

/** The plate alpha on a hex holding only locked targets. */
export function armedLockedAlpha(): number {
  return LENS_DIM_ALPHA * (1 - Math.min(1, Math.max(0, ARMED_LOCKED_LIT)));
}

export function createArmedTargetsLayer(vm: MapHighlightVM, tiles: readonly LensTile[]): ArmedTargetsLayer {
  const group = new THREE.Group();
  group.name = ARMED_TARGETS_LAYER_NAME;
  const disposables: Array<{ dispose(): void }> = [];
  const litLocked = new Set(vm.litLocked);
  const notLit = dimKeysOf(tiles, new Set([...vm.lit, ...vm.litLocked]));
  const dimmed = addLensDimPlates(group, disposables, notLit, LENS_DIM_ALPHA);
  addLensDimPlates(group, disposables, [...litLocked], armedLockedAlpha());
  return {
    group,
    counts: { lit: vm.lit.length, litLocked: litLocked.size, dimmed },
    dispose() {
      for (const d of disposables) d.dispose();
      group.clear();
    },
  };
}
