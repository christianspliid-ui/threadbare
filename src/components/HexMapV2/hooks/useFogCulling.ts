/**
 * useFogCulling.ts — Hook encapsulating fog-of-war color overrides,
 * fog overlay management, and per-hex layer culling for signifier
 * and location groups.
 *
 * Architecture:
 * - Unexplored hexes: parchment overlay mesh (FogOverlayMesh) covers everything
 * - Remembered hexes: sepia-tinted terrain colors via CPU color swap
 * - Visible hexes: full terrain colors, all layers visible
 *
 * NFP #1: Uses PARCHMENT_FOG_CONSTANTS — no new magic numbers.
 * NFP #4: Null refs → skip entire effect. Missing hex keys → skip silently.
 */

import { useEffect } from 'react';
import * as THREE from 'three';
import type { VisibilityMap } from '../../../types/visibility';
import { isLayerVisibleForHex, toSepia } from '../scene/FogCulling';
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
  /** Fog overlay mesh floating above the scene — parchment on unexplored hexes */
  fogOverlay: React.MutableRefObject<FogOverlayResult | null>;
}

// ── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Applies fog-of-war:
 * - Fog overlay (parchment) for unexplored hexes
 * - Sepia-tinted terrain colors for remembered hexes
 * - Signifier/location culling per hex visibility state
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
        overlay.backgroundPlane.visible = false;
      }
      return;
    }

    // ── Fog enabled: apply per-hex colors ──

    for (const [key, hexVis] of visibilityMap) {
      const idx = indexByKey.get(key);
      if (idx === undefined) continue;
      const entry = meshMap.get(idx);
      if (!entry) continue;

      if (hexVis.state === 'remembered') {
        // Sepia-tinted terrain color
        const r = colors[idx * 3 + 0];
        const g = colors[idx * 3 + 1];
        const b = colors[idx * 3 + 2];
        const [sr, sg, sb] = toSepia(r, g, b);
        color.setRGB(sr, sg, sb, THREE.SRGBColorSpace);
        entry.mesh.setColorAt(entry.instanceIdx, color);
      } else {
        // Visible or unexplored: use original terrain color
        // (unexplored hexes are covered by the overlay anyway)
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

    // ── Update fog overlay — opaque on unexplored, transparent on remembered/visible ──
    const overlay = fogOverlay.current;
    if (overlay) {
      overlay.mesh.visible = true;
      overlay.backgroundPlane.visible = true;
      for (const [key, hexVis] of visibilityMap) {
        setFogOverlayAlpha(overlay, key, hexVis.state === 'unexplored' ? 1.0 : 0.0);
      }
      flushFogOverlay(overlay);
    }

    // ── Per-hex signifier fog alpha ──
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

    // ── Per-hex location sprite visibility ──
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
