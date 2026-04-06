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
import { isLayerVisibleForHex, toSepia } from '../scene/FogCulling';
import { PARCHMENT_FOG_CONSTANTS } from '../scene/fogShader';
import { setFogOverlayAlpha, flushFogOverlay } from '../scene/FogOverlayMesh';
import type { FogOverlayResult } from '../scene/FogOverlayMesh';
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
  /** Per-instance fog state buffer for land mesh (from HexFillMeshResult) */
  landFogState: React.MutableRefObject<Float32Array | null>;
  /** Per-instance fog state buffer for water mesh (from HexFillMeshResult) */
  waterFogState: React.MutableRefObject<Float32Array | null>;
  /** Fog overlay mesh floating above the scene — parchment on unexplored hexes */
  fogOverlay: React.MutableRefObject<FogOverlayResult | null>;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Writes fog state value to the correct mesh's fog state buffer.
 */
function setFogStateForInstance(
  entry: { mesh: THREE.InstancedMesh; instanceIdx: number },
  fogState: number,
  landFogState: Float32Array | null,
  waterFogState: Float32Array | null,
  landMesh: THREE.InstancedMesh,
  waterMesh: THREE.InstancedMesh,
): void {
  if (entry.mesh === landMesh && landFogState) {
    landFogState[entry.instanceIdx] = fogState;
  } else if (entry.mesh === waterMesh && waterFogState) {
    waterFogState[entry.instanceIdx] = fogState;
  }
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
  landFogState,
  waterFogState,
  fogOverlay,
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
        setFogStateForInstance(entry, PARCHMENT_FOG_CONSTANTS.FOG_STATE_VISIBLE, landFogState.current, waterFogState.current, land, water);
      }
      if (land.instanceColor) land.instanceColor.needsUpdate = true;
      if (water.instanceColor) water.instanceColor.needsUpdate = true;

      // Mark fog state attributes for upload
      const landFogAttr = land.geometry.getAttribute('aFogState') as THREE.InstancedBufferAttribute | undefined;
      const waterFogAttr = water.geometry.getAttribute('aFogState') as THREE.InstancedBufferAttribute | undefined;
      if (landFogAttr) landFogAttr.needsUpdate = true;
      if (waterFogAttr) waterFogAttr.needsUpdate = true;

      // Reset signifier fog alphas to fully visible
      const sigGroupReset = signifierGroup.current as (THREE.Group & { meta?: SignifierGroupMeta }) | null;
      if (sigGroupReset?.meta) {
        for (const hexKey of sigGroupReset.meta.hexInstanceMap.keys()) {
          sigGroupReset.meta.setFogAlpha(hexKey, 1.0);
        }
        sigGroupReset.meta.flushFogAlpha();
      }

      // Reset location sprite visibility to fully visible
      const locGroupReset = locationGroup.current;
      if (locGroupReset) {
        for (const child of locGroupReset.children) {
          child.visible = true;
        }
      }

      // Hide fog overlay entirely when fog is disabled
      const overlay = fogOverlay.current;
      if (overlay) {
        overlay.mesh.visible = false;
      }
      return;
    }

    // Apply fog state + colors to both meshes
    const { FOG_STATE_UNEXPLORED, FOG_STATE_REMEMBERED, FOG_STATE_VISIBLE } = PARCHMENT_FOG_CONSTANTS;
    const parchmentFallback = new THREE.Color(PARCHMENT_FOG_CONSTANTS.PARCHMENT_FALLBACK_COLOR);

    for (const [key, hexVis] of visibilityMap) {
      const idx = indexByKey.get(key);
      if (idx === undefined) continue;
      const entry = meshMap.get(idx);
      if (!entry) continue;

      if (hexVis.state === 'unexplored') {
        entry.mesh.setColorAt(entry.instanceIdx, parchmentFallback);
        setFogStateForInstance(entry, FOG_STATE_UNEXPLORED, landFogState.current, waterFogState.current, land, water);
      } else if (hexVis.state === 'remembered') {
        const r = colors[idx * 3 + 0];
        const g = colors[idx * 3 + 1];
        const b = colors[idx * 3 + 2];
        const [sr, sg, sb] = toSepia(r, g, b);
        color.setRGB(sr, sg, sb, THREE.SRGBColorSpace);
        entry.mesh.setColorAt(entry.instanceIdx, color);
        setFogStateForInstance(entry, FOG_STATE_REMEMBERED, landFogState.current, waterFogState.current, land, water);
      } else {
        color.setRGB(
          colors[idx * 3 + 0],
          colors[idx * 3 + 1],
          colors[idx * 3 + 2],
          THREE.SRGBColorSpace,
        );
        entry.mesh.setColorAt(entry.instanceIdx, color);
        setFogStateForInstance(entry, FOG_STATE_VISIBLE, landFogState.current, waterFogState.current, land, water);
      }
    }
    if (land.instanceColor) land.instanceColor.needsUpdate = true;
    if (water.instanceColor) water.instanceColor.needsUpdate = true;

    // Mark fog state attributes for GPU upload
    const landFogAttr = land.geometry.getAttribute('aFogState') as THREE.InstancedBufferAttribute | undefined;
    const waterFogAttr = water.geometry.getAttribute('aFogState') as THREE.InstancedBufferAttribute | undefined;
    if (landFogAttr) landFogAttr.needsUpdate = true;
    if (waterFogAttr) waterFogAttr.needsUpdate = true;

    // Update fog overlay — opaque on unexplored hexes, transparent on remembered/visible
    const overlay = fogOverlay.current;
    if (overlay) {
      overlay.mesh.visible = true;
      for (const [key, hexVis] of visibilityMap) {
        setFogOverlayAlpha(overlay, key, hexVis.state === 'unexplored' ? 1.0 : 0.0);
      }
      flushFogOverlay(overlay);
    }

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
