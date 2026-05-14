import { TERRAIN_TEXTURE_LAB_VIGNETTE_CONSTANTS } from '../terrainTextureLabPresets';
import type { ChunkedLandmarkLayer } from './ChunkedLandmarkLayer';

interface InstanceKey {
  batchKey: string;
  instanceIndex: number;
}

interface EasedValue {
  current: number;
  target: number;
}

const C = TERRAIN_TEXTURE_LAB_VIGNETTE_CONSTANTS;

export class VignetteSelectionState {
  private hovered: InstanceKey | null = null;
  private selected: InstanceKey | null = null;

  private hoverEase: Map<string, EasedValue> = new Map();
  private selectEase: Map<string, EasedValue> = new Map();

  private static key(bk: string, idx: number): string {
    return `${bk}:${idx}`;
  }

  setHovered(entry: InstanceKey | null): void {
    if (this.hovered !== null) {
      const k = VignetteSelectionState.key(this.hovered.batchKey, this.hovered.instanceIndex);
      this.hoverEase.set(k, { current: this.hoverEase.get(k)?.current ?? 0, target: 0 });
    }
    this.hovered = entry;
    if (entry !== null) {
      const k = VignetteSelectionState.key(entry.batchKey, entry.instanceIndex);
      this.hoverEase.set(k, { current: this.hoverEase.get(k)?.current ?? 0, target: C.HOVER_MIX_TARGET });
    }
  }

  setSelected(entry: InstanceKey | null): void {
    if (this.selected !== null) {
      const k = VignetteSelectionState.key(this.selected.batchKey, this.selected.instanceIndex);
      this.selectEase.set(k, { current: this.selectEase.get(k)?.current ?? 0, target: 0 });
    }
    this.selected = entry;
    if (entry !== null) {
      const k = VignetteSelectionState.key(entry.batchKey, entry.instanceIndex);
      this.selectEase.set(k, { current: this.selectEase.get(k)?.current ?? 0, target: C.SELECTION_MIX_TARGET });
    }
  }

  clearAll(): void {
    this.setHovered(null);
    this.setSelected(null);
  }

  getHovered(): InstanceKey | null {
    return this.hovered;
  }

  getSelected(): InstanceKey | null {
    return this.selected;
  }

  tickEasing(deltaMs: number, layer: ChunkedLandmarkLayer): void {
    this.stepMap(this.hoverEase, deltaMs, C.HOVER_MIX_EASE_MS, 'aHoverMix', layer);
    this.stepMap(this.selectEase, deltaMs, C.SELECTION_MIX_EASE_MS, 'aSelectionMix', layer);
    this.pruneSettled(this.hoverEase);
    this.pruneSettled(this.selectEase);
  }

  private stepMap(
    map: Map<string, EasedValue>,
    deltaMs: number,
    easeDurationMs: number,
    attrName: string,
    layer: ChunkedLandmarkLayer,
  ): void {
    const rate = easeDurationMs > 0 ? deltaMs / easeDurationMs : 1;
    for (const [k, ev] of map) {
      const diff = ev.target - ev.current;
      if (Math.abs(diff) < 0.001) {
        ev.current = ev.target;
      } else {
        ev.current += diff * Math.min(rate, 1);
      }
      const [batchKey, idxStr] = k.split(':');
      if (batchKey === undefined || idxStr === undefined) continue;
      const instanceIndex = parseInt(idxStr, 10);
      try {
        layer.setInstanceAttribute(batchKey, instanceIndex, attrName, ev.current);
      } catch {
        // fail-soft: layer may have been rebuilt; stale keys are pruned naturally
      }
    }
  }

  private pruneSettled(map: Map<string, EasedValue>): void {
    for (const [k, ev] of map) {
      if (ev.current === ev.target && ev.target === 0) {
        map.delete(k);
      }
    }
  }
}
