/**
 * SettlementModelMesh.ts — 3D GLTF models for settlement hex locations.
 *
 * Loads city.glb, town.glb, and village.glb (built in Blender, exported to
 * public/models/) and places instances at matching location hexes.
 *
 * PBR materials are converted to flat MeshBasicMaterial so they render
 * correctly with the rest of the hex renderer (NoToneMapping, no scene lights).
 *
 * Follows the LocationIconMesh.ts factory pattern: synchronous return of an
 * empty group, filled asynchronously on GLTFLoader callback.
 *
 * NFP #1: SETTLEMENT_MODEL_CONSTANTS — every tunable value named.
 * NFP #4: Fail-soft on load failure — group stays empty, scene never crashes.
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { hexToWorld } from '../../../lib/worldPosition';
import { RENDER_ORDER, LAYER_Z } from './RenderLayers';
import { HEX_CONSTANTS } from './HexFillMesh';
import type { LocationNode } from './LocationIconMesh';

// ── NFP #1: All tunable values named ─────────────────────────────────────────

/** Configuration for a single settlement model type. */
interface SettlementModelConfig {
  /** URL of the GLB relative to the Vite public root. */
  glbPath: string;
  /**
   * Uniform scale applied to the loaded GLTF.
   * Computed as: targetWorldRadius / modelBlenderRadius.
   */
  scale: number;
  /** Location subtypes that get this model. */
  types: Set<string>;
}

export const SETTLEMENT_MODEL_CONSTANTS = {
  /**
   * Z position of settlement model bases — between signifiers (0.070)
   * and location icons (0.080) so they appear above terrain art but
   * below the 2D icon sprite.
   */
  MODEL_Z: LAYER_Z.LOCATIONS - 0.005,

  /** Per-settlement-type configurations. */
  CONFIGS: {
    city: {
      glbPath: '/models/city.glb',
      // Blender model base radius ≈ 1.85 → scale 5.4 → fills full hex (HEX_SIZE 10).
      scale: 5.4,
      types: new Set<string>(['city', 'capital']),
    },
    town: {
      glbPath: '/models/town.glb',
      // Blender model footprint radius ≈ 0.75 → scale 8.0 → fills ~60% of hex.
      scale: 8.0,
      types: new Set<string>(['town', 'castle', 'fort']),
    },
    village: {
      glbPath: '/models/village.glb',
      // Blender model footprint radius ≈ 0.29 → scale 8.6 → edge-icon sized (~25% of hex).
      scale: 8.6,
      types: new Set<string>(['hamlet', 'camp']),
    },
  } satisfies Record<string, SettlementModelConfig>,
} as const;

// ── Factory ──────────────────────────────────────────────────────────────────

/**
 * Create a Three.js Group that will hold 3D settlement models.
 *
 * Returns the group synchronously (initially empty). The GLTFLoader fills it
 * asynchronously — the group is already in the scene when instances appear.
 *
 * @param locations - All location nodes from the game state
 * @param scene     - Three.js scene (group is added here immediately)
 */
export function createSettlementModelMesh(
  locations: LocationNode[],
  scene: THREE.Scene,
): THREE.Group {
  const group = new THREE.Group();
  group.name = 'SettlementModels';
  group.renderOrder = RENDER_ORDER.LOCATIONS;
  scene.add(group);

  if (!locations || locations.length === 0) return group;

  const loader = new GLTFLoader();

  for (const [configKey, config] of Object.entries(SETTLEMENT_MODEL_CONSTANTS.CONFIGS)) {
    const matchingLocations = locations.filter(loc =>
      config.types.has(loc.locationType),
    );

    if (matchingLocations.length === 0) continue;

    loader.load(
      config.glbPath,

      // onLoad
      (gltf) => {
        // ── Convert PBR materials to flat MeshBasicMaterial ────────────────
        const matCache = new Map<THREE.Material, THREE.MeshBasicMaterial>();

        gltf.scene.traverse(child => {
          if (!(child instanceof THREE.Mesh)) return;
          const orig = child.material as THREE.MeshStandardMaterial;
          if (!matCache.has(orig)) {
            matCache.set(orig, new THREE.MeshBasicMaterial({
              color: orig.color.clone(),
              side: THREE.DoubleSide,
            }));
          }
          child.material = matCache.get(orig)!;
        });

        // ── Place one clone per matching location ─────────────────────────
        for (const loc of matchingLocations) {
          const { x, y } = hexToWorld(
            { col: loc.hexCol, row: loc.hexRow },
            HEX_CONSTANTS.HEX_SIZE,
          );

          const clone = gltf.scene.clone(true);
          // No rotation — model rotation baked into GLB geometry in Blender
          clone.scale.setScalar(config.scale);
          clone.position.set(x, y, SETTLEMENT_MODEL_CONSTANTS.MODEL_Z);
          group.add(clone);
        }
      },

      // onProgress — not needed
      undefined,

      // onError — NFP #4: fail-soft
      (error) => {
        console.warn(`[SettlementModelMesh] Failed to load ${config.glbPath}:`, error);
      },
    );
  }

  return group;
}

// ── Disposal ─────────────────────────────────────────────────────────────────

/**
 * Dispose GPU resources for the settlement model group.
 * Materials are shared across instances so disposed once via a Set.
 */
export function disposeSettlementModelMesh(group: THREE.Group): void {
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
