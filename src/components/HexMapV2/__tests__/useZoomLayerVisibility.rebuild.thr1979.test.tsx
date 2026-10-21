// @vitest-environment jsdom
/**
 * THR-1979 item 3 — the map rebuild (re-run on `locations` / `realmProjection` changes
 * while the clock runs) creates the terrain-icon, settlement-icon and city-model groups
 * hidden. The zoom-visibility hook must re-show them on the rebuild, not only on the
 * next zoom change.
 */
import { describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import * as THREE from 'three';
// AgentSpriteMesh draws to a 2D canvas at import, which jsdom lacks; agents are not under test.
vi.mock('../scene/AgentSpriteMesh', () => ({ updateZoomVisibility: () => {} }));

import { useZoomLayerVisibility, type UseZoomLayerVisibilityParams } from '../hooks/useZoomLayerVisibility';

function ref<T>(v: T | null): { current: T | null } {
  return { current: v };
}

function params(sceneEpoch: number, groups: { signifiers: THREE.Group; locations: THREE.Group; cityModels: THREE.Group }): UseZoomLayerVisibilityParams {
  return {
    zoomTier: 'regional',
    zoomK: 2,
    sceneEpoch,
    groups: {
      signifiers: ref(groups.signifiers),
      locations: ref(groups.locations),
      cityModels: ref(groups.cityModels),
      roads: ref<THREE.Group>(null),
      rivers: ref<THREE.Group>(null),
      gridLines: ref<THREE.Mesh>(null),
      elevTicks: ref<THREE.Mesh>(null),
      geoBorder: ref<THREE.LineSegments>(null),
      borderRealm: ref<THREE.Mesh>(null),
      coastline: ref<THREE.Group>(null),
    },
    agentSpriteGroup: ref(null),
    trailGroup: ref<THREE.Group>(null),
  };
}

function hiddenGroups() {
  const g = { signifiers: new THREE.Group(), locations: new THREE.Group(), cityModels: new THREE.Group() };
  for (const x of Object.values(g)) x.visible = false;
  return g;
}

describe('useZoomLayerVisibility — a rebuild at an unchanged zoom (THR-1979)', () => {
  it('re-shows the freshly built, hidden icon groups when the scene epoch moves', () => {
    const first = hiddenGroups();
    const { rerender } = renderHook((p: UseZoomLayerVisibilityParams) => useZoomLayerVisibility(p), { initialProps: params(1, first) });
    expect(first.locations.visible).toBe(true);

    // The rebuild: new groups, created hidden, same zoom tier and k.
    const rebuilt = hiddenGroups();
    rerender(params(2, rebuilt));
    expect(rebuilt.signifiers.visible).toBe(true);
    expect(rebuilt.locations.visible).toBe(true);
    expect(rebuilt.cityModels.visible).toBe(true);
  });
});
