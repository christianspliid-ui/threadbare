/**
 * useZoomLayerVisibility.ts — Hook encapsulating zoom-tier-based layer
 * visibility toggling and signifier fade transitions.
 *
 * Extracted from the zoom event handler in HexMapV2.tsx's scene init effect.
 * Instead of imperative visibility toggling inside a d3 zoom callback, this
 * hook reacts to a `zoomTier` state variable updated by the zoom handler.
 *
 * NFP #1: Uses ZOOM_VISIBILITY_MATRIX and ZOOM_TIER_THRESHOLDS — no local thresholds.
 * NFP #2: zoomTier as React state makes tier transitions traceable and testable.
 * NFP #4: Null group refs → skip that layer, continue.
 */

import { useEffect } from 'react';
import * as THREE from 'three';
import type { ZoomTier } from '../scene/ZoomVisibilityMatrix';
import {
  ZOOM_VISIBILITY_MATRIX,
  ZOOM_TIER_THRESHOLDS,
  getFadeAlpha,
  FADE_RANGE,
} from '../scene/ZoomVisibilityMatrix';
import { updateZoomVisibility } from '../scene/AgentSpriteMesh';
import type { AgentSpriteGroup } from '../scene/AgentSpriteMesh';

// ── Types ────────────────────────────────────────────────────────────────────

export interface UseZoomLayerVisibilityParams {
  zoomTier: ZoomTier;
  zoomK: number;
  groups: {
    signifiers: React.MutableRefObject<THREE.Group | null>;
    locations: React.MutableRefObject<THREE.Group | null>;
    cityModels: React.MutableRefObject<THREE.Group | null>;
    roads: React.MutableRefObject<THREE.Group | null>;
    rivers: React.MutableRefObject<THREE.Group | null>;
    gridLines: React.MutableRefObject<THREE.Mesh | null>;
    elevTicks: React.MutableRefObject<THREE.Mesh | null>;
    borderKingdom: React.MutableRefObject<THREE.Mesh | null>;
    borderBarony: React.MutableRefObject<THREE.Mesh | null>;
    coastline: React.MutableRefObject<THREE.Group | null>;
  };
  agentSpriteGroup: React.MutableRefObject<AgentSpriteGroup | null>;
  trailGroup: React.MutableRefObject<THREE.Group | null>;
}

// ── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Toggles layer group visibility based on the current zoom tier.
 * Also applies signifier opacity fade near the continental threshold.
 */
export function useZoomLayerVisibility({
  zoomTier,
  zoomK,
  groups,
  agentSpriteGroup,
  trailGroup,
}: UseZoomLayerVisibilityParams): void {
  useEffect(() => {
    const tier = zoomTier;

    // Layer visibility from matrix
    if (groups.signifiers.current) groups.signifiers.current.visible = ZOOM_VISIBILITY_MATRIX.signifiers[tier];
    if (groups.locations.current) groups.locations.current.visible = ZOOM_VISIBILITY_MATRIX.locations[tier];
    if (groups.cityModels.current) groups.cityModels.current.visible = ZOOM_VISIBILITY_MATRIX.locations[tier];
    if (groups.elevTicks.current) groups.elevTicks.current.visible = ZOOM_VISIBILITY_MATRIX.elev_ticks[tier];
    if (groups.rivers.current) groups.rivers.current.visible = ZOOM_VISIBILITY_MATRIX.rivers[tier];
    if (groups.roads.current) groups.roads.current.visible = ZOOM_VISIBILITY_MATRIX.roads[tier];
    if (groups.gridLines.current) groups.gridLines.current.visible = ZOOM_VISIBILITY_MATRIX.grid_lines[tier];
    if (groups.borderKingdom.current) groups.borderKingdom.current.visible = ZOOM_VISIBILITY_MATRIX.borders_kingdom[tier];
    if (groups.borderBarony.current) groups.borderBarony.current.visible = ZOOM_VISIBILITY_MATRIX.borders_barony[tier];

    // Agent tiers (portrait/dot/retinue)
    const agentGroup = agentSpriteGroup.current;
    if (agentGroup) updateZoomVisibility(agentGroup, tier);

    // Movement trails visible when agents are visible at regional+ or hero-local
    if (trailGroup.current) {
      trailGroup.current.visible =
        ZOOM_VISIBILITY_MATRIX.agents_dot[tier] || ZOOM_VISIBILITY_MATRIX.agents_portrait[tier];
    }

    // Fade transitions for signifiers near the continental threshold
    const currentSignifierGroup = groups.signifiers.current;
    if (currentSignifierGroup?.visible) {
      const alpha = getFadeAlpha(zoomK, ZOOM_TIER_THRESHOLDS.CONTINENTAL, FADE_RANGE * ZOOM_TIER_THRESHOLDS.CONTINENTAL);
      for (const child of currentSignifierGroup.children) {
        if (child instanceof THREE.InstancedMesh) {
          const fogAttr = child.geometry.getAttribute('aFogAlpha') as THREE.InstancedBufferAttribute;
          if (fogAttr) {
            const arr = fogAttr.array as Float32Array;
            for (let i = 0; i < arr.length; i++) arr[i] = alpha;
            fogAttr.needsUpdate = true;
          }
        }
      }
    }
  }, [zoomTier, zoomK]); // eslint-disable-line react-hooks/exhaustive-deps
}
