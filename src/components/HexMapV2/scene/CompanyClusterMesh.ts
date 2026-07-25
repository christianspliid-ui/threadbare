/**
 * CompanyClusterMesh.ts — Three.js scene module for company (party) cluster rendering (THR-74).
 *
 * A company is a band of agents travelling together. Its members already render as
 * individual agent dots/portraits (the agent sprite layer arranges co-located agents
 * in a ring). This layer adds the two marks that read the ring *as a company*:
 *
 *   - an enclosing ring around the member dots, and
 *   - a central bond glyph, gold when the ascendant threads a member ("yours"),
 *     a neutral blue-grey otherwise (future NPC bands, THR-731).
 *
 * The member dots come free from the agent layer, which already hides them at
 * continental zoom — so the plan's "close = ring + dots + glyph / far = ringed glyph
 * only" falls out with no zoom logic here: this layer always draws ring + glyph when
 * the hex is visible.
 *
 * NFP #1 (tunability): every colour, radius, and opacity is a named constant.
 * NFP #2 (inspectability): CompanyRenderData carries the threaded flag that decides
 *   the treatment, so a gold-vs-neutral glyph traces to one field.
 * NFP #3 (determinism): no PRNG.
 * NFP #4 (fail-soft): rebuild([]) clears the group; a company with no world position
 *   is simply skipped by the caller, never crashes here.
 * NFP #7 (performance): geometries + materials disposed on every rebuild/dispose.
 *
 * Colour writes carry THREE.SRGBColorSpace per the settled HexMapV2 colour rule.
 */

import * as THREE from 'three';
import { RENDER_ORDER, LAYER_Z } from './RenderLayers';
import { HEX_CONSTANTS } from './HexFillMesh';

// ── Constants ─────────────────────────────────────────────────────────────────

/** Bond glyph + ring colour when the ascendant threads a member — the company is "yours". */
export const COMPANY_THREADED_COLOR = '#d4a040'; // accent gold (matches retinue/thread gold)

/** Bond glyph + ring colour for an untethered company (no threaded member). */
export const COMPANY_NEUTRAL_COLOR = '#8b9dc3'; // soft blue-grey (matches retinue/watched neutral)

/** Enclosing ring inner radius as a fraction of hex size. Sits just outside the
 *  agent dot ring (SLOT_RING_RADIUS = 6 in a HEX_SIZE = 10 hex). */
export const COMPANY_RING_INNER_FRACTION = 0.78;

/** Enclosing ring outer radius as a fraction of hex size. */
export const COMPANY_RING_OUTER_FRACTION = 0.90;

/** Central bond-glyph radius as a fraction of hex size. */
export const COMPANY_GLYPH_RADIUS_FRACTION = 0.16;

/** Ring opacity — a soft enclosure, not a hard boundary. */
export const COMPANY_RING_OPACITY = 0.55;

/** Bond-glyph opacity — the brighter of the two marks. */
export const COMPANY_GLYPH_OPACITY = 0.9;

/** Radial segment count for the ring and glyph circles. */
const CIRCLE_SEGMENTS = 32;

// ── Types ─────────────────────────────────────────────────────────────────────

/**
 * All data needed to render a single company cluster mark.
 * World positions are pre-computed by the caller (GameView) via `hexToWorld`, matching
 * how thread lines and activity icons are fed — this layer stays graph-agnostic.
 */
export interface CompanyRenderData {
  /** Company node id — for React keys / debug and future click routing. */
  id: string;
  /** World-space X of the company's hex (leader-derived position). */
  worldX: number;
  /** World-space Y of the company's hex. */
  worldY: number;
  /** True when the ascendant threads ≥1 living member — drives the gold treatment. */
  threaded: boolean;
  /** Living member count — reserved for future ring sizing; never rendered as text (user verdict). */
  memberCount: number;
}

/** Public interface for the CompanyClusterMesh layer returned by createCompanyClusterMesh(). */
export interface CompanyClusterLayer {
  /** THREE.Group containing all company cluster marks. Add this to the scene. */
  group: THREE.Group;
  /** Rebuild all cluster marks from fresh data. Disposes existing marks first. */
  rebuild(companies: CompanyRenderData[]): void;
  /** Dispose all GPU resources. Call when removing the layer from the scene. */
  dispose(): void;
}

// ── Internal record ───────────────────────────────────────────────────────────

interface CompanyClusterRecord {
  id: string;
  ring: THREE.Mesh;
  ringGeometry: THREE.RingGeometry;
  ringMaterial: THREE.MeshBasicMaterial;
  glyph: THREE.Mesh;
  glyphGeometry: THREE.CircleGeometry;
  glyphMaterial: THREE.MeshBasicMaterial;
}

// ── Factory ───────────────────────────────────────────────────────────────────

/**
 * Creates a CompanyClusterMesh layer.
 *
 * The returned group renders at RENDER_ORDER.COMPANY_CLUSTER (9.6) / LAYER_Z.COMPANY_CLUSTER
 * (5.55), between thread lines and agent sprites — so the ring sits under the member
 * dots and the bond glyph shows through the empty hex centre the dot ring leaves open.
 */
export function createCompanyClusterMesh(): CompanyClusterLayer {
  const group = new THREE.Group();
  group.renderOrder = RENDER_ORDER.COMPANY_CLUSTER;

  const hexSize = HEX_CONSTANTS.HEX_SIZE;
  const ringInner = hexSize * COMPANY_RING_INNER_FRACTION;
  const ringOuter = hexSize * COMPANY_RING_OUTER_FRACTION;
  const glyphRadius = hexSize * COMPANY_GLYPH_RADIUS_FRACTION;

  let records: CompanyClusterRecord[] = [];

  function disposeRecord(r: CompanyClusterRecord): void {
    group.remove(r.ring);
    group.remove(r.glyph);
    r.ringGeometry.dispose();
    r.ringMaterial.dispose();
    r.glyphGeometry.dispose();
    r.glyphMaterial.dispose();
  }

  function disposeAll(): void {
    for (const r of records) disposeRecord(r);
    records = [];
  }

  function rebuild(companies: CompanyRenderData[]): void {
    disposeAll();

    for (const c of companies) {
      const colorHex = c.threaded ? COMPANY_THREADED_COLOR : COMPANY_NEUTRAL_COLOR;

      // Enclosing ring (annulus) around the member dots.
      const ringGeometry = new THREE.RingGeometry(ringInner, ringOuter, CIRCLE_SEGMENTS);
      const ringColor = new THREE.Color();
      ringColor.setStyle(colorHex, THREE.SRGBColorSpace);
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: ringColor,
        transparent: true,
        opacity: COMPANY_RING_OPACITY,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.position.set(c.worldX, c.worldY, LAYER_Z.COMPANY_CLUSTER);
      ring.renderOrder = RENDER_ORDER.COMPANY_CLUSTER;
      group.add(ring);

      // Central bond glyph — a filled disc in the empty hex centre.
      const glyphGeometry = new THREE.CircleGeometry(glyphRadius, CIRCLE_SEGMENTS);
      const glyphColor = new THREE.Color();
      glyphColor.setStyle(colorHex, THREE.SRGBColorSpace);
      const glyphMaterial = new THREE.MeshBasicMaterial({
        color: glyphColor,
        transparent: true,
        opacity: COMPANY_GLYPH_OPACITY,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      const glyph = new THREE.Mesh(glyphGeometry, glyphMaterial);
      glyph.position.set(c.worldX, c.worldY, LAYER_Z.COMPANY_CLUSTER + 0.001);
      glyph.renderOrder = RENDER_ORDER.COMPANY_CLUSTER;
      group.add(glyph);

      records.push({
        id: c.id,
        ring,
        ringGeometry,
        ringMaterial,
        glyph,
        glyphGeometry,
        glyphMaterial,
      });
    }
  }

  function dispose(): void {
    disposeAll();
  }

  return { group, rebuild, dispose };
}
