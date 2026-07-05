/**
 * RivalInfluenceMesh.ts — sphere-tinted hex outlines on rival-scheme targets (THR-66).
 *
 * One hexagon LineLoop per contested hex, colored by the sponsoring rival's
 * primary sphere. Mirrors the LocationRaritySignifier / CapitalMarkers layer
 * shape: a factory returning a THREE.Group + dispose, mounted once and rebuilt
 * when the marker set changes.
 *
 * NFP #4 Fail-soft: empty markers → empty group.
 */
import * as THREE from 'three';
import { hexToWorld } from '../../../lib/worldPosition';
import { RENDER_ORDER, LAYER_Z } from './RenderLayers';
import { HEX_CONSTANTS } from './HexFillMesh';
import type { RivalInfluenceMarker } from '../../../engine/rivalInfluenceMarkers';

/** Radius of the marker outline as a fraction of the hex radius. */
const RIVAL_MARKER_RADIUS_FRAC = 0.82;
/** Outline opacity. */
const RIVAL_MARKER_OPACITY = 0.7;

export interface RivalInfluenceLayer {
  group: THREE.Group;
  dispose: () => void;
}

export function createRivalInfluenceLayer(markers: RivalInfluenceMarker[]): RivalInfluenceLayer {
  const group = new THREE.Group();
  group.renderOrder = RENDER_ORDER.REACH_SIGNATURE_SIGNIFIER;

  const radius = HEX_CONSTANTS.HEX_SIZE * RIVAL_MARKER_RADIUS_FRAC;

  for (const marker of markers) {
    const { x: wx, y: wy } = hexToWorld({ col: marker.col, row: marker.row }, HEX_CONSTANTS.HEX_SIZE);

    // Flat-top hexagon outline (6 points).
    const points: THREE.Vector3[] = [];
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 180) * (60 * i);
      points.push(new THREE.Vector3(radius * Math.cos(angle), radius * Math.sin(angle), 0));
    }
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({
      color: new THREE.Color(marker.color),
      transparent: true,
      opacity: RIVAL_MARKER_OPACITY,
      depthWrite: false,
    });
    const loop = new THREE.LineLoop(geo, mat);
    loop.position.set(wx, wy, LAYER_Z.REACH_SIGNATURE_SIGNIFIER);
    loop.renderOrder = RENDER_ORDER.REACH_SIGNATURE_SIGNIFIER;
    group.add(loop);
  }

  return {
    group,
    dispose: () => {
      for (const child of group.children) {
        if (child instanceof THREE.LineLoop) {
          child.geometry.dispose();
          (child.material as THREE.LineBasicMaterial).dispose();
        }
      }
      group.clear();
    },
  };
}
