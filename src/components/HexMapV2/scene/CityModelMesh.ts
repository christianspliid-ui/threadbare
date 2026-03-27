/**
 * CityModelMesh.ts — 3D GLTF city model for city/capital hex locations.
 *
 * Loads city.glb (built in Blender, exported to public/models/) and places an
 * instance at each city/capital location. PBR materials are converted to flat
 * MeshBasicMaterial so they render correctly with the rest of the hex renderer
 * (which uses NoToneMapping and no scene lights).
 *
 * Follows the LocationIconMesh.ts factory pattern: synchronous return of an
 * empty group, filled asynchronously on GLTFLoader callback.
 *
 * NFP #1: CITY_MODEL_CONSTANTS — every tunable value named.
 * NFP #4: Fail-soft on load failure — group stays empty, scene never crashes.
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { hexToWorld } from '../../../lib/worldPosition';
import { RENDER_ORDER, LAYER_Z } from './RenderLayers';
import { HEX_CONSTANTS } from './HexFillMesh';
import type { LocationNode } from './LocationIconMesh';

// ── NFP #1: All tunable values named ─────────────────────────────────────────

export const CITY_MODEL_CONSTANTS = {
  /**
   * Uniform scale applied to the loaded GLTF.
   * Blender model base hex radius ≈ 1.85 units → scale 4.6 → ≈ 8.5 world units
   * (≈ 85% of HEX_SIZE 10, leaving a small border inside the hex edge).
   */
  MODEL_SCALE: 4.6,

  /**
   * Z position of the model base — between signifiers (0.070) and location
   * icons (0.080) so it appears above terrain art but below the 2D icon sprite.
   */
  MODEL_Z: LAYER_Z.LOCATIONS - 0.005,

  /**
   * X-axis rotation applied after load.
   * Blender exports with towers in +Y (GLTF Y-up convention). Our scene uses
   * an orthographic camera looking down −Z with the map on the XY plane.
   * Rotating π/2 around X maps +Y → +Z, laying the model flat on the map
   * with towers pointing toward the camera.
   */
  ROTATION_X: Math.PI / 2,

  /** Location subtypes that get a 3D city model instead of a plain sprite. */
  CITY_TYPES: new Set<string>(['city', 'capital']),

  /** URL of the city GLB relative to the Vite public root. */
  GLB_PATH: '/models/city.glb',
} as const;

// ── Factory ──────────────────────────────────────────────────────────────────

/**
 * Create a Three.js Group that will hold 3D city models.
 *
 * Returns the group synchronously (initially empty). The GLTFLoader fills it
 * asynchronously — the group is already in the scene when instances appear.
 *
 * @param locations - All location nodes from the game state
 * @param scene     - Three.js scene (group is added here immediately)
 */
export function createCityModelMesh(
  locations: LocationNode[],
  scene: THREE.Scene,
): THREE.Group {
  const group = new THREE.Group();
  group.name = 'CityModels';
  group.renderOrder = RENDER_ORDER.LOCATIONS;
  scene.add(group);

  const cityLocations = locations.filter(loc =>
    CITY_MODEL_CONSTANTS.CITY_TYPES.has(loc.locationType),
  );

  if (cityLocations.length === 0) return group;

  const loader = new GLTFLoader();
  loader.load(
    CITY_MODEL_CONSTANTS.GLB_PATH,

    // onLoad
    (gltf) => {
      // ── Convert PBR materials to flat MeshBasicMaterial ──────────────────
      // The hex renderer uses THREE.NoToneMapping and has no scene lights.
      // MeshStandardMaterial would render pure black without lights.
      // MeshBasicMaterial ignores lighting and shows the color directly.
      const matCache = new Map<THREE.Material, THREE.MeshBasicMaterial>();

      gltf.scene.traverse(child => {
        if (!(child instanceof THREE.Mesh)) return;
        const orig = child.material as THREE.MeshStandardMaterial;
        if (!matCache.has(orig)) {
          matCache.set(orig, new THREE.MeshBasicMaterial({
            color: orig.color.clone(),
            side: THREE.FrontSide,
          }));
        }
        child.material = matCache.get(orig)!;
      });

      // ── Place one clone per city/capital hex ─────────────────────────────
      for (const loc of cityLocations) {
        const { x, y } = hexToWorld(
          { col: loc.hexCol, row: loc.hexRow },
          HEX_CONSTANTS.HEX_SIZE,
        );

        const clone = gltf.scene.clone(true);
        clone.rotation.x = CITY_MODEL_CONSTANTS.ROTATION_X;
        clone.scale.setScalar(CITY_MODEL_CONSTANTS.MODEL_SCALE);
        clone.position.set(x, y, CITY_MODEL_CONSTANTS.MODEL_Z);
        group.add(clone);
      }
    },

    // onProgress — not needed
    undefined,

    // onError — NFP #4: fail-soft
    (error) => {
      console.warn('[CityModelMesh] Failed to load city.glb:', error);
    },
  );

  return group;
}

// ── Disposal ─────────────────────────────────────────────────────────────────

/**
 * Dispose GPU resources for the city model group.
 * Materials are shared across instances so disposed once via a Set.
 */
export function disposeCityModelMesh(group: THREE.Group): void {
  const disposedMaterials = new Set<THREE.Material>();

  group.traverse(child => {
    if (!(child instanceof THREE.Mesh)) return;
    child.geometry.dispose();
    const mats = Array.isArray(child.material) ? child.material : [child.material];
    for (const mat of mats) {
      if (!disposedMaterials.has(mat)) {
        mat.dispose();
        disposedMaterials.add(mat);
      }
    }
  });
}
