/**
 * TradeRouteMesh.ts — trade-route line rendering for HexMapV2 (THR-670).
 *
 * One flat quad per route between the two endpoint hex centers. Healthy
 * routes render in caravan gold; a route marked `threatened` (banditry,
 * THR-669) renders in warning red. Width scales gently with volume so a
 * busy artery reads busier than a founding trickle.
 *
 * Follows the RoadMesh approach (merged BufferGeometry per style bucket,
 * named constants, sRGB-flagged colors — see hexmap canon: unflagged setRGB
 * double-gammas the map).
 */
import * as THREE from 'three';
import { RENDER_ORDER, LAYER_Z } from './RenderLayers';
import { HEX_CONSTANTS } from './HexFillMesh';
import { hexToWorld } from '../../../lib/worldPosition';
import type { TradeRouteLine } from '../../../engine/tradeRouteMarkers';

/** Caravan gold — the healthy-route color. */
export const TRADE_ROUTE_COLOR = '#c9a227';
/** Warning red for a route currently marked threatened (THR-669 banditry). */
export const TRADE_ROUTE_THREATENED_COLOR = '#dc2626';
/** Base half-width of a route line in world units. */
export const TRADE_ROUTE_BASE_HALF_WIDTH = 1.1;
/** Additional half-width per volume point above 1. */
export const TRADE_ROUTE_WIDTH_PER_VOLUME = 0.35;
/** Half-width ceiling so a mega-route never reads as a river. */
export const TRADE_ROUTE_MAX_HALF_WIDTH = 3.2;
/** Line opacity — routes underlay locations and should never shout. */
export const TRADE_ROUTE_OPACITY = 0.65;
/** Z height: just above roads, below geo borders. */
export const TRADE_ROUTE_Z = 0.031;

export interface TradeRouteLayer {
  group: THREE.Group;
  dispose: () => void;
}

function halfWidthFor(volume: number): number {
  return Math.min(
    TRADE_ROUTE_MAX_HALF_WIDTH,
    TRADE_ROUTE_BASE_HALF_WIDTH + Math.max(0, volume - 1) * TRADE_ROUTE_WIDTH_PER_VOLUME,
  );
}

/** Push one quad (two triangles) for a route segment into the position array. */
function pushQuad(
  positions: number[],
  a: { x: number; y: number },
  b: { x: number; y: number },
  halfWidth: number,
): void {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = (-dy / len) * halfWidth;
  const ny = (dx / len) * halfWidth;
  const z = TRADE_ROUTE_Z;
  // Triangle 1
  positions.push(a.x + nx, a.y + ny, z, a.x - nx, a.y - ny, z, b.x + nx, b.y + ny, z);
  // Triangle 2
  positions.push(a.x - nx, a.y - ny, z, b.x - nx, b.y - ny, z, b.x + nx, b.y + ny, z);
}

function buildBucketMesh(lines: TradeRouteLine[], cssColor: string): THREE.Mesh | null {
  if (lines.length === 0) return null;
  const positions: number[] = [];
  for (const line of lines) {
    const a = hexToWorld(line.from, HEX_CONSTANTS.HEX_SIZE);
    const b = hexToWorld(line.to, HEX_CONSTANTS.HEX_SIZE);
    pushQuad(positions, a, b, halfWidthFor(line.volume));
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  const color = new THREE.Color();
  color.setStyle(cssColor, THREE.SRGBColorSpace);
  const material = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: TRADE_ROUTE_OPACITY,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.renderOrder = RENDER_ORDER.ROADS; // shares the roads band; z lifts it above
  return mesh;
}

/**
 * Build the trade-route layer from line descriptors. Rebuild-on-change
 * (cheap: a handful of quads), matching the rival-influence layer lifecycle.
 */
export function createTradeRouteLayer(lines: TradeRouteLine[]): TradeRouteLayer {
  const group = new THREE.Group();
  group.renderOrder = RENDER_ORDER.ROADS;

  const healthy = buildBucketMesh(lines.filter((l) => !l.threatened), TRADE_ROUTE_COLOR);
  const threatened = buildBucketMesh(lines.filter((l) => l.threatened), TRADE_ROUTE_THREATENED_COLOR);
  if (healthy) group.add(healthy);
  if (threatened) group.add(threatened);

  const dispose = (): void => {
    for (const child of [...group.children]) {
      const mesh = child as THREE.Mesh;
      mesh.geometry?.dispose();
      (mesh.material as THREE.Material | undefined)?.dispose?.();
      group.remove(child);
    }
  };

  return { group, dispose };
}

// LAYER_Z imported for documentation parity with sibling layers; the route z
// is a named constant above because it sits between two existing bands.
void LAYER_Z;
