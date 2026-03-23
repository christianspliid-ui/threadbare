/**
 * AgentSpriteMesh.ts — Three.js scene module for agent sprite rendering.
 *
 * Creates two-tier sprite groups for agent rendering:
 *   - Portrait tier (k >= 15): circular portrait thumbnails with faction/retinue rings
 *   - Dot tier (k >= 5): colored faction dots
 *   - Continental tier (k >= 1.5): tiny retinue-only dots
 *
 * Multiple agents on the same hex are distributed via RING layout using
 * getRingSlotOffset from movementPath.ts. Stable sort by agent id ensures
 * deterministic slot assignment.
 *
 * NFP #1 (tunability): All scale and sprite size values are derived from named constants.
 * NFP #3 (determinism): Agents sorted by id for deterministic ring slot assignment.
 * NFP #4 (fail-soft): Unknown agents, missing textures, portrait load failures all
 *   silently skip — never crash the scene.
 * NFP #7 (performance): Textures built once in cache; no per-frame canvas ops.
 */

import * as THREE from 'three';
import type { AgentRenderData } from '../agents/agentSpriteTypes';
import {
  FACTION_HERALDIC_COLORS,
  AGENT_ZOOM_THRESHOLDS,
  AGENT_SPRITE_Z,
  PORTRAIT_TEXTURE_SIZE,
} from '../agents/agentSpriteTypes';
import {
  buildFactionDotTextureCache,
  buildRetinueDotTexture,
  loadPortraitTexture,
} from '../agents/agentPortraitTextures';
import { RENDER_ORDER } from './RenderLayers';
import { HEX_CONSTANTS } from './HexFillMesh';
import { hexToPixel } from '../../../lib/hexMath';
import { getRingSlotOffset } from '../../../lib/movementPath';
import {
  AGENT_RING_RADIUS,
  AGENT_TOKEN_RADIUS,
  AGENT_PORTRAIT_RADIUS,
  AGENT_DOT_RADIUS,
  MAX_RING_AGENTS,
} from '../../../data/agent-visual-content';

// ── Types ────────────────────────────────────────────────────────────────────

/**
 * The sprite group returned by createAgentSpriteMesh.
 * Callers add all three groups to the scene and call updateZoomVisibility on zoom events.
 */
export interface AgentSpriteGroup {
  /** Hero-local zoom sprites (portraits with faction/retinue rings), k >= 15 */
  portraitGroup: THREE.Group;
  /** Regional zoom sprites (colored dots), k >= 5 */
  dotGroup: THREE.Group;
  /** Continental zoom sprites (retinue-only tiny dots), k >= 1.5 */
  continentalGroup: THREE.Group;
  /** Map of agentId → sprite references for position updates */
  spriteMap: Map<string, { portrait: THREE.Sprite; dot: THREE.Sprite; continental?: THREE.Sprite }>;
  /** Disposes all GPU resources (materials + textures) */
  dispose: () => void;
}

// ── Scale helpers ────────────────────────────────────────────────────────────

/** Convert SVG-unit radius to Three.js world units */
function agentSpriteScale(radiusInSvgUnits: number): number {
  // SVG units match world units at HEX_SIZE=10 (1:1 scale)
  return radiusInSvgUnits * 2;
}

// ── Pre-built texture cache ───────────────────────────────────────────────────

// Build once at module load — no per-frame cost
const dotTextureCache = buildFactionDotTextureCache(FACTION_HERALDIC_COLORS);

// Retinue dot textures per faction
const retinueDotTextureCache = new Map<number, THREE.CanvasTexture>();
for (let i = 0; i < FACTION_HERALDIC_COLORS.length; i++) {
  retinueDotTextureCache.set(i, buildRetinueDotTexture(FACTION_HERALDIC_COLORS[i]));
}

// ── Factory ──────────────────────────────────────────────────────────────────

/**
 * Creates an AgentSpriteGroup for a set of agents.
 *
 * All three groups start with default visibility (caller manages via updateZoomVisibility).
 * Portrait textures are initially set to dot textures — call loadAgentPortraits to
 * upgrade to actual portrait images asynchronously.
 *
 * @param agents — array of AgentRenderData to render
 * @returns AgentSpriteGroup ready to add to the scene
 */
export function createAgentSpriteMesh(agents: AgentRenderData[]): AgentSpriteGroup {
  const portraitGroup = new THREE.Group();
  const dotGroup = new THREE.Group();
  const continentalGroup = new THREE.Group();

  portraitGroup.renderOrder = RENDER_ORDER.AGENTS;
  dotGroup.renderOrder = RENDER_ORDER.AGENTS;
  continentalGroup.renderOrder = RENDER_ORDER.AGENTS;

  const spriteMap = new Map<string, { portrait: THREE.Sprite; dot: THREE.Sprite; continental?: THREE.Sprite }>();

  if (agents.length === 0) {
    return {
      portraitGroup,
      dotGroup,
      continentalGroup,
      spriteMap,
      dispose: () => {},
    };
  }

  // Group agents by hex key for RING layout computation
  const hexGroups = new Map<string, AgentRenderData[]>();
  for (const agent of agents) {
    const key = `${agent.hexCol},${agent.hexRow}`;
    if (!hexGroups.has(key)) hexGroups.set(key, []);
    hexGroups.get(key)!.push(agent);
  }

  // Sort each group by id for deterministic ring slot assignment (NFP #3)
  for (const group of hexGroups.values()) {
    group.sort((a, b) => a.id.localeCompare(b.id));
  }

  // Build sprites for each agent
  for (const hexAgents of hexGroups.values()) {
    // Cap at MAX_RING_AGENTS — extras are hidden (overflow badge handled separately)
    const visible = hexAgents.slice(0, MAX_RING_AGENTS);

    for (let i = 0; i < visible.length; i++) {
      const agent = visible[i];

      // Compute world position: hexToPixel + RING offset + Y-flip
      const hexCenter = hexToPixel(
        { col: agent.hexCol, row: agent.hexRow },
        HEX_CONSTANTS.HEX_SIZE,
      );
      const ringOffset = getRingSlotOffset(i, visible.length, AGENT_RING_RADIUS);
      const wx = hexCenter.x + ringOffset.x;
      const wy = -(hexCenter.y + ringOffset.y); // Y-flip: SVG y-down → Three.js y-up

      // ── Portrait sprite (hero-local zoom) ──
      const factionTexture = dotTextureCache.get(agent.factionIndex)
        ?? dotTextureCache.get(0)!;

      const portraitMaterial = new THREE.SpriteMaterial({
        map: factionTexture,
        transparent: true,
        depthWrite: false,
      });
      const portraitSprite = new THREE.Sprite(portraitMaterial);
      const portraitScale = agentSpriteScale(AGENT_PORTRAIT_RADIUS);
      portraitSprite.scale.set(portraitScale, portraitScale, 1);
      portraitSprite.position.set(wx, wy, AGENT_SPRITE_Z);
      portraitGroup.add(portraitSprite);

      // ── Dot sprite (regional zoom) ──
      const dotTexture = agent.isRetinue
        ? (retinueDotTextureCache.get(agent.factionIndex) ?? retinueDotTextureCache.get(0)!)
        : factionTexture;

      const dotMaterial = new THREE.SpriteMaterial({
        map: dotTexture,
        transparent: true,
        depthWrite: false,
      });
      const dotSprite = new THREE.Sprite(dotMaterial);
      const dotScale = agentSpriteScale(AGENT_TOKEN_RADIUS);
      dotSprite.scale.set(dotScale, dotScale, 1);
      dotSprite.position.set(wx, wy, AGENT_SPRITE_Z);
      dotGroup.add(dotSprite);

      // ── Continental sprite (retinue-only tiny dot) ──
      let continentalSprite: THREE.Sprite | undefined;
      if (agent.isRetinue) {
        const contTexture = retinueDotTextureCache.get(agent.factionIndex)
          ?? retinueDotTextureCache.get(0)!;

        const contMaterial = new THREE.SpriteMaterial({
          map: contTexture,
          transparent: true,
          depthWrite: false,
        });
        continentalSprite = new THREE.Sprite(contMaterial);
        const contScale = agentSpriteScale(AGENT_DOT_RADIUS);
        continentalSprite.scale.set(contScale, contScale, 1);
        continentalSprite.position.set(wx, wy, AGENT_SPRITE_Z);
        continentalGroup.add(continentalSprite);
      }

      spriteMap.set(agent.id, {
        portrait: portraitSprite,
        dot: dotSprite,
        continental: continentalSprite,
      });
    }
  }

  // Dispose function: clean up all GPU resources
  const dispose = () => {
    for (const { portrait, dot, continental } of spriteMap.values()) {
      (portrait.material as THREE.SpriteMaterial).dispose();
      (dot.material as THREE.SpriteMaterial).dispose();
      if (continental) {
        (continental.material as THREE.SpriteMaterial).dispose();
      }
    }
    spriteMap.clear();
  };

  return {
    portraitGroup,
    dotGroup,
    continentalGroup,
    spriteMap,
    dispose,
  };
}

// ── Zoom Visibility ──────────────────────────────────────────────────────────

/**
 * Toggles portrait/dot/continental group visibility based on the current d3 zoom level.
 *
 * Called on every zoom event. Thresholds match the existing ZOOM_THRESHOLDS used
 * by RegionLabelOverlay and the agent rendering specification.
 *
 * @param group — the AgentSpriteGroup to update
 * @param zoomLevel — current d3 zoom scale (k value)
 */
/**
 * Portrait scale factor by zoom tier.
 * At hero-local zoom, portraits render at full size (1.0).
 * At lower zooms they shrink to remain visible without overwhelming the map.
 * NFP #1: all scale factors are named constants.
 */
const PORTRAIT_ZOOM_SCALES = {
  HERO_LOCAL: 1.0,
  REGIONAL: 0.5,
  CONTINENTAL: 0.3,
} as const;

export function updateZoomVisibility(group: AgentSpriteGroup, zoomLevel: number): void {
  if (zoomLevel >= AGENT_ZOOM_THRESHOLDS.CONTINENTAL) {
    // All zoom tiers above continental: show portrait circles
    group.portraitGroup.visible = true;
    group.dotGroup.visible = false;
    group.continentalGroup.visible = false;

    // Scale portraits based on zoom tier
    const scaleFactor = zoomLevel >= AGENT_ZOOM_THRESHOLDS.HERO_LOCAL
      ? PORTRAIT_ZOOM_SCALES.HERO_LOCAL
      : zoomLevel >= AGENT_ZOOM_THRESHOLDS.REGIONAL
        ? PORTRAIT_ZOOM_SCALES.REGIONAL
        : PORTRAIT_ZOOM_SCALES.CONTINENTAL;
    const baseScale = agentSpriteScale(AGENT_PORTRAIT_RADIUS);
    const s = baseScale * scaleFactor;
    for (const child of group.portraitGroup.children) {
      child.scale.set(s, s, 1);
    }
  } else {
    // Full-world: hide all
    group.portraitGroup.visible = false;
    group.dotGroup.visible = false;
    group.continentalGroup.visible = false;
  }
}

// ── Portrait Loader ──────────────────────────────────────────────────────────

/**
 * Asynchronously loads portrait images and swaps sprite materials.
 *
 * Initially, portrait sprites use the faction dot texture as a placeholder.
 * After this function runs, sprites with a valid portraitUrl get a circular
 * portrait texture with the appropriate ring treatment.
 *
 * Uses Promise.allSettled for fail-soft behavior: a single failed load does not
 * prevent other portraits from loading.
 *
 * @param group — the AgentSpriteGroup containing portrait sprites to update
 * @param agents — source AgentRenderData for portrait URLs and ring colors
 */
export async function loadAgentPortraits(
  group: AgentSpriteGroup,
  agents: AgentRenderData[],
): Promise<void> {
  const loads = agents
    .filter(a => a.portraitUrl)
    .map(async (agent) => {
      const sprites = group.spriteMap.get(agent.id);
      if (!sprites) return;

      const ringColor = FACTION_HERALDIC_COLORS[agent.factionIndex] ?? FACTION_HERALDIC_COLORS[0];

      // NFP #4: loadPortraitTexture never rejects — falls back to dot texture on error
      const texture = await loadPortraitTexture(agent.portraitUrl!, ringColor, agent.isRetinue);

      // Swap the portrait sprite's texture
      const material = sprites.portrait.material as THREE.SpriteMaterial;
      if (material.map) {
        // Dispose old placeholder texture if it was unique to this sprite
        // (shared cache textures are NOT disposed here)
      }
      material.map = texture;
      material.needsUpdate = true;
    });

  // Promise.allSettled: all loads attempted regardless of individual failures
  await Promise.allSettled(loads);
}

// ── Position Updater ─────────────────────────────────────────────────────────

/**
 * Updates sprite positions after agents have moved hexes.
 *
 * Recalculates RING layout for each hex group, then moves sprites for agents
 * that are already in the spriteMap. Does not handle adds/removes — callers
 * should recreate the group when the agent roster changes significantly.
 *
 * @param group — the AgentSpriteGroup to update
 * @param agents — updated AgentRenderData array with new hex positions
 */
export function updateAgentPositions(
  group: AgentSpriteGroup,
  agents: AgentRenderData[],
): void {
  // Re-group by hex for RING layout
  const hexGroups = new Map<string, AgentRenderData[]>();
  for (const agent of agents) {
    const key = `${agent.hexCol},${agent.hexRow}`;
    if (!hexGroups.has(key)) hexGroups.set(key, []);
    hexGroups.get(key)!.push(agent);
  }

  // Sort each group by id (deterministic ring slots — NFP #3)
  for (const hexGroup of hexGroups.values()) {
    hexGroup.sort((a, b) => a.id.localeCompare(b.id));
  }

  // Update sprite positions for known agents
  for (const hexAgents of hexGroups.values()) {
    const visible = hexAgents.slice(0, MAX_RING_AGENTS);

    for (let i = 0; i < visible.length; i++) {
      const agent = visible[i];
      const sprites = group.spriteMap.get(agent.id);
      if (!sprites) continue; // NFP #4: unknown agent — silently skip

      const hexCenter = hexToPixel(
        { col: agent.hexCol, row: agent.hexRow },
        HEX_CONSTANTS.HEX_SIZE,
      );
      const ringOffset = getRingSlotOffset(i, visible.length, AGENT_RING_RADIUS);
      const wx = hexCenter.x + ringOffset.x;
      const wy = -(hexCenter.y + ringOffset.y);

      sprites.portrait.position.set(wx, wy, AGENT_SPRITE_Z);
      sprites.dot.position.set(wx, wy, AGENT_SPRITE_Z);
      if (sprites.continental) {
        sprites.continental.position.set(wx, wy, AGENT_SPRITE_Z);
      }
    }
  }
}

/**
 * PORTRAIT_TEXTURE_SIZE re-export for callers that need to know the texture resolution.
 * Avoids direct import from agentSpriteTypes in downstream scene setup code.
 */
export { PORTRAIT_TEXTURE_SIZE };
