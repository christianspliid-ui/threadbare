/**
 * GLTF model loader and registry for KayKit Medieval Hexagon assets.
 * Loads all models once, shares a single texture atlas, and exposes
 * geometries for instanced rendering.
 *
 * All models use the same "hexagons_medieval.png" palette texture —
 * one material, zero shader state switches between draw calls.
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// ── Model catalog ───────────────────────────────────────────────────────────

const MODEL_BASE = '/assets/models/';

/** Model IDs and their GLTF filenames (without extension) */
export const MODEL_CATALOG = {
  // ── Nature / decoration ─────────────────────────────
  tree_single_A: 'tree_single_A',
  tree_single_B: 'tree_single_B',
  trees_A_small: 'trees_A_small',
  trees_A_medium: 'trees_A_medium',
  trees_B_small: 'trees_B_small',
  trees_B_medium: 'trees_B_medium',
  rock_single_A: 'rock_single_A',
  rock_single_B: 'rock_single_B',
  rock_single_C: 'rock_single_C',
  rock_single_D: 'rock_single_D',
  rock_single_E: 'rock_single_E',
  hill_single_A: 'hill_single_A',
  hill_single_B: 'hill_single_B',
  hill_single_C: 'hill_single_C',
  hills_A: 'hills_A',
  hills_A_trees: 'hills_A_trees',
  hills_B: 'hills_B',
  hills_B_trees: 'hills_B_trees',
  mountain_A: 'mountain_A',
  mountain_A_grass: 'mountain_A_grass',
  mountain_B: 'mountain_B',
  mountain_B_grass: 'mountain_B_grass',

  // ── Buildings ───────────────────────────────────────
  castle: 'building_castle_blue',
  church: 'building_church_blue',
  home_A: 'building_home_A_blue',
  home_B: 'building_home_B_blue',
  tavern: 'building_tavern_blue',
  market: 'building_market_blue',
  mine: 'building_mine_blue',
  tower_A: 'building_tower_A_blue',
  tower_B: 'building_tower_B_blue',
  barracks: 'building_barracks_blue',
  blacksmith: 'building_blacksmith_blue',
  lumbermill: 'building_lumbermill_blue',

  // ── Neutral buildings ───────────────────────────────
  destroyed: 'building_destroyed',
  scaffolding: 'building_scaffolding',
  stage_A: 'building_stage_A',
  stage_B: 'building_stage_B',
  stage_C: 'building_stage_C',

  // ── Props ───────────────────────────────────────────
  tent: 'tent',
  barrel: 'barrel',
  crate: 'crate_A_big',
  target: 'target',
  weaponrack: 'weaponrack',
} as const;

export type ModelId = keyof typeof MODEL_CATALOG;

// ── Loaded model store ──────────────────────────────────────────────────────

export interface LoadedModel {
  geometry: THREE.BufferGeometry;
  /** The original mesh's bounding box (for sizing/placement) */
  bounds: THREE.Box3;
}

let loadedModels: Map<ModelId, LoadedModel> | null = null;
let sharedMaterial: THREE.MeshBasicMaterial | null = null;
let loadPromise: Promise<void> | null = null;

// ── Public API ──────────────────────────────────────────────────────────────

/** Load all models. Safe to call multiple times — only loads once. */
export function loadAllModels(): Promise<void> {
  if (loadPromise) return loadPromise;

  loadPromise = doLoad();
  return loadPromise;
}

/** Get a loaded model's geometry. Returns null if not yet loaded. */
export function getModel(id: ModelId): LoadedModel | null {
  return loadedModels?.get(id) ?? null;
}

/** Get the shared palette material. Returns null if not yet loaded. */
export function getSharedMaterial(): THREE.MeshBasicMaterial | null {
  return sharedMaterial;
}

/** Check if models are loaded. */
export function modelsReady(): boolean {
  return loadedModels !== null;
}

// ── Loader implementation ───────────────────────────────────────────────────

async function doLoad(): Promise<void> {
  const loader = new GLTFLoader();
  const textureLoader = new THREE.TextureLoader();

  // Load the shared palette texture
  const texture = await textureLoader.loadAsync(`${MODEL_BASE}hexagons_medieval.png`);
  texture.flipY = false; // GLTF uses non-flipped UVs
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.NearestFilter; // Crisp pixel look for diorama
  texture.minFilter = THREE.NearestMipmapLinearFilter;

  // Create the one shared material — meshBasicMaterial for diorama flat look
  sharedMaterial = new THREE.MeshBasicMaterial({
    map: texture,
    fog: true,
  });

  // Load all models in parallel
  const entries = Object.entries(MODEL_CATALOG) as [ModelId, string][];
  const results = await Promise.allSettled(
    entries.map(async ([id, filename]) => {
      const url = `${MODEL_BASE}${filename}.gltf`;
      try {
        const gltf = await loader.loadAsync(url);
        // Extract the first mesh geometry from the scene
        let geometry: THREE.BufferGeometry | null = null;
        const bounds = new THREE.Box3();

        gltf.scene.traverse((child) => {
          if (!geometry && child instanceof THREE.Mesh) {
            geometry = child.geometry.clone();
            bounds.setFromObject(child);
          }
        });

        if (geometry) {
          return { id, model: { geometry, bounds } };
        }
        console.warn(`[modelLoader] No mesh found in ${filename}`);
        return null;
      } catch (err) {
        console.warn(`[modelLoader] Failed to load ${filename}:`, err);
        return null;
      }
    }),
  );

  // Build the registry
  const map = new Map<ModelId, LoadedModel>();
  for (const result of results) {
    if (result.status === 'fulfilled' && result.value) {
      map.set(result.value.id, result.value.model);
    }
  }

  loadedModels = map;
  console.log(`[modelLoader] Loaded ${map.size}/${entries.length} models`);
}
