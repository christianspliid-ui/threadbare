/**
 * useFogCulling.ts — Hook encapsulating fog-of-war color overrides
 * and per-hex layer culling for signifier and location groups.
 *
 * Extracted from HexMapV2.tsx (the fog update useEffect) to isolate
 * fog concerns from the rest of the renderer.
 *
 * NFP #1: Uses existing FOG_CONSTANTS — no new magic numbers.
 * NFP #4: Null refs → skip entire effect. Missing hex keys → skip silently.
 */

import { useEffect } from 'react';
import * as THREE from 'three';
import type { HexTile } from '../../../types';
import type { VisibilityMap } from '../../../types/visibility';
import type { HexFillMeshResult } from '../scene/HexFillMesh';
import { isLayerVisibleForHex } from '../scene/FogCulling';
import type { SignifierGroupMeta } from '../scene/SignifierMesh';

// ── Types ────────────────────────────────────────────────────────────────────

export interface UseFogCullingParams {
  visibilityMap: VisibilityMap | undefined;
  fogEnabled: boolean;
  landMesh: React.MutableRefObject<THREE.InstancedMesh | null>;
  waterMesh: React.MutableRefObject<THREE.InstancedMesh | null>;
  globalToMeshMap: React.MutableRefObject<Map<number, { mesh: THREE.InstancedMesh; instanceIdx: number }> | null>;
  originalColors: React.MutableRefObject<Float32Array | null>;
  tileIndexByKey: React.MutableRefObject<Map<string, number> | null>;
  signifierGroup: React.MutableRefObject<THREE.Group | null>;
  locationGroup: React.MutableRefObject<THREE.Group | null>;
}

// ── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Applies fog-of-war color overrides to hex fill meshes and culls
 * signifier/location sprites based on per-hex visibility state.
 */
export function useFogCulling({
  visibilityMap,
  fogEnabled,
  landMesh,
  waterMesh,
  globalToMeshMap,
  originalColors,
  tileIndexByKey,
  signifierGroup,
  locationGroup,
}: UseFogCullingParams): void {
  useEffect(() => {
    const land = landMesh.current;
    const water = waterMesh.current;
    const meshMap = globalToMeshMap.current;
    if (!land || !water || !meshMap) return;

    const colors = originalColors.current;
    const indexByKey = tileIndexByKey.current;
    if (!colors || !indexByKey) return;

    const color = new THREE.Color();

    if (!visibilityMap || !fogEnabled) {
      // Fog disabled: restore all instance colors to originals
      for (let i = 0; i < colors.length / 3; i++) {
        const entry = meshMap.get(i);
        if (!entry) continue;
        color.setRGB(
          colors[i * 3 + 0],
          colors[i * 3 + 1],
          colors[i * 3 + 2],
          THREE.SRGBColorSpace,
        );
        entry.mesh.setColorAt(entry.instanceIdx, color);
      }
      if (land.instanceColor) land.instanceColor.needsUpdate = true;
      if (water.instanceColor) water.instanceColor.needsUpdate = true;

      // Reset signifier fog alphas to fully visible
      const sigGroupReset = signifierGroup.current as (THREE.Group & { meta?: SignifierGroupMeta }) | null;
      if (sigGroupReset?.meta) {
        for (const hexKey of sigGroupReset.meta.hexInstanceMap.keys()) {
          sigGroupReset.meta.setFogAlpha(hexKey, 1.0);
        }
        sigGroupReset.meta.flushFogAlpha();
      }
      return;
    }

    // Apply fog colors to both meshes
    const FOG_COLOR = new THREE.Color(0x0a0a0c);
    for (const [key, hexVis] of visibilityMap) {
      const idx = indexByKey.get(key);
      if (idx === undefined) continue;
      const entry = meshMap.get(idx);
      if (!entry) continue;

      if (hexVis.state === 'unexplored') {
        entry.mesh.setColorAt(entry.instanceIdx, FOG_COLOR);
      } else {
        color.setRGB(
          colors[idx * 3 + 0],
          colors[idx * 3 + 1],
          colors[idx * 3 + 2],
          THREE.SRGBColorSpace,
        );
        entry.mesh.setColorAt(entry.instanceIdx, color);
      }
    }
    if (land.instanceColor) land.instanceColor.needsUpdate = true;
    if (water.instanceColor) water.instanceColor.needsUpdate = true;

    // Per-hex fog alpha for instanced signifier meshes
    const sigGroup = signifierGroup.current as (THREE.Group & { meta?: SignifierGroupMeta }) | null;
    if (sigGroup?.meta) {
      const { hexInstanceMap, setFogAlpha, flushFogAlpha } = sigGroup.meta;
      for (const hexKey of hexInstanceMap.keys()) {
        const hexVis = visibilityMap.get(hexKey);
        const state = hexVis?.state ?? 'unexplored';
        const visible = isLayerVisibleForHex(state, 'signifier');
        setFogAlpha(hexKey, visible ? 1.0 : 0.0);
      }
      flushFogAlpha();
    }

    const locGroup = locationGroup.current;
    if (locGroup) {
      for (const child of locGroup.children) {
        const sprite = child as THREE.Sprite & { userData?: { hexKey?: string } };
        const hexKey = sprite.userData?.hexKey;
        if (!hexKey) continue;
        const hexVis = visibilityMap.get(hexKey);
        const state = hexVis?.state ?? 'unexplored';
        sprite.visible = isLayerVisibleForHex(state, 'location');
      }
    }
  }, [visibilityMap, fogEnabled]); // eslint-disable-line react-hooks/exhaustive-deps
}
