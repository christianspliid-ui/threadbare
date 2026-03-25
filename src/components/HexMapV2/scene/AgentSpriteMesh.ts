/**
 * AgentSpriteMesh.ts — Three.js scene module for agent sprite rendering.
 *
 * Single-sprite-per-agent design: each agent has one THREE.Sprite with
 * pre-built materials for each zoom tier (portrait, dot, continental).
 * On zoom tier changes, updateZoomVisibility swaps the sprite's material
 * and scale — instant swap, no cross-fade needed.
 *
 * Multiple agents on the same hex are distributed via fixed edge-midpoint
 * slots using getFixedSlotOffset from movementPath.ts. Stable sort by agent
 * id ensures deterministic slot assignment.
 *
 * NFP #1 (tunability): All scale and sprite size values are derived from named constants.
 * NFP #3 (determinism): Agents sorted by id for deterministic ring slot assignment.
 * NFP #4 (fail-soft): Unknown agents, missing textures, portrait load failures all
 *   silently skip — never crash the scene.
 * NFP #7 (performance): Single sprite per agent (was three). 67% draw call reduction.
 */

import * as THREE from 'three';
import type { AgentRenderData } from '../agents/agentSpriteTypes';
import {
  FACTION_HERALDIC_COLORS,
  AGENT_SPRITE_Z,
  PORTRAIT_TEXTURE_SIZE,
} from '../agents/agentSpriteTypes';
import type { ZoomTier } from './ZoomVisibilityMatrix';
import { ZOOM_VISIBILITY_MATRIX } from './ZoomVisibilityMatrix';
import {
  buildFactionDotTextureCache,
  buildRetinueDotTexture,
  loadPortraitTexture,
} from '../agents/agentPortraitTextures';
import { RENDER_ORDER } from './RenderLayers';
import { HEX_CONSTANTS } from './HexFillMesh';
import { hexToWorldWithOffset } from '../../../lib/worldPosition';
import type { AgentAnimationTarget } from '../agents/agentSpriteTarget';
import { createAnimationTarget } from '../agents/agentSpriteTarget';
import { getFixedSlotOffset } from '../../../lib/movementPath';
import {
  SLOT_RING_RADIUS,
  EDGE_MID_ANGLES_DEG,
  AGENT_TOKEN_RADIUS,
  AGENT_PORTRAIT_RADIUS,
  AGENT_DOT_RADIUS,
  MAX_RING_AGENTS,
} from '../../../data/agent-visual-content';

// ── Types ────────────────────────────────────────────────────────────────────

/**
 * Per-agent entry in the sprite map. Contains a single sprite with
 * pre-built materials and scales for each zoom tier.
 */
export interface AgentSpriteEntry {
  /** The single sprite for this agent (material swapped on zoom change) */
  sprite: THREE.Sprite;
  /** Pre-built materials for each zoom tier */
  materials: {
    portrait: THREE.SpriteMaterial;
    dot: THREE.SpriteMaterial;
    continental?: THREE.SpriteMaterial;
  };
  /** Pre-computed scales for each zoom tier */
  scales: {
    portrait: number;
    dot: number;
    continental?: number;
  };
  /** Whether this agent is a retinue member (has continental tier) */
  isRetinue: boolean;
}

/**
 * The sprite group returned by createAgentSpriteMesh.
 * Single group containing one sprite per agent.
 * Call updateZoomVisibility on zoom events to swap materials.
 */
export interface AgentSpriteGroup {
  /** Single group containing all agent sprites */
  group: THREE.Group;
  /** Map of agentId → sprite entry for position/material updates */
  spriteMap: Map<string, AgentSpriteEntry>;
  /** Map of agentId → animation target (abstracts position/scale from animation system) */
  animationTargets: Map<string, AgentAnimationTarget>;
  /** Disposes all GPU resources (materials + textures) */
  dispose: () => void;
}

// ── Scale helpers ────────────────────────────────────────────────────────────

/** Convert SVG-unit radius to Three.js sprite scale (diameter in world units). */
function agentSpriteScale(radiusInSvgUnits: number): number {
  return radiusInSvgUnits * 2;
}

// ── Pre-built texture cache ───────────────────────────────────────────────────

const dotTextureCache = buildFactionDotTextureCache(FACTION_HERALDIC_COLORS);

const retinueDotTextureCache = new Map<number, THREE.CanvasTexture>();
for (let i = 0; i < FACTION_HERALDIC_COLORS.length; i++) {
  retinueDotTextureCache.set(i, buildRetinueDotTexture(FACTION_HERALDIC_COLORS[i]));
}

// ── Factory ──────────────────────────────────────────────────────────────────

/**
 * Creates an AgentSpriteGroup with one sprite per agent.
 *
 * Each agent gets a single sprite that starts with the portrait material.
 * All three tier materials are pre-built and stored in the spriteMap entry.
 * Call updateZoomVisibility to swap to the correct material for the current tier.
 *
 * @param agents — array of AgentRenderData to render
 * @returns AgentSpriteGroup ready to add to the scene
 */
export function createAgentSpriteMesh(agents: AgentRenderData[]): AgentSpriteGroup {
  const group = new THREE.Group();
  group.renderOrder = RENDER_ORDER.AGENTS;

  const spriteMap = new Map<string, AgentSpriteEntry>();

  const animationTargets = new Map<string, AgentAnimationTarget>();

  if (agents.length === 0) {
    return { group, spriteMap, animationTargets, dispose: () => {} };
  }

  // Group agents by hex key for RING layout computation
  const hexGroups = new Map<string, AgentRenderData[]>();
  for (const agent of agents) {
    const key = `${agent.hexCol},${agent.hexRow}`;
    if (!hexGroups.has(key)) hexGroups.set(key, []);
    hexGroups.get(key)!.push(agent);
  }

  // Sort each group by id for deterministic ring slot assignment (NFP #3)
  for (const grp of hexGroups.values()) {
    grp.sort((a, b) => a.id.localeCompare(b.id));
  }

  // Build sprites for each agent
  for (const hexAgents of hexGroups.values()) {
    const visible = hexAgents.slice(0, MAX_RING_AGENTS);

    for (let i = 0; i < visible.length; i++) {
      const agent = visible[i];

      const ringOffset = getFixedSlotOffset(i, visible.length, EDGE_MID_ANGLES_DEG, SLOT_RING_RADIUS);
      const worldPos = hexToWorldWithOffset(
        { col: agent.hexCol, row: agent.hexRow },
        ringOffset,
        HEX_CONSTANTS.HEX_SIZE,
      );
      const wx = worldPos.x;
      const wy = worldPos.y;

      const factionTexture = dotTextureCache.get(agent.factionIndex)
        ?? dotTextureCache.get(0)!;

      // Pre-build all tier materials
      const portraitMaterial = new THREE.SpriteMaterial({
        map: factionTexture,
        transparent: true,
        depthWrite: false,
      });
      const dotMaterial = new THREE.SpriteMaterial({
        map: factionTexture,
        transparent: true,
        depthWrite: false,
      });

      let continentalMaterial: THREE.SpriteMaterial | undefined;
      if (agent.isRetinue) {
        const contTexture = retinueDotTextureCache.get(agent.factionIndex)
          ?? retinueDotTextureCache.get(0)!;
        continentalMaterial = new THREE.SpriteMaterial({
          map: contTexture,
          transparent: true,
          depthWrite: false,
        });
      }

      // Pre-compute scales
      const portraitScale = agentSpriteScale(AGENT_PORTRAIT_RADIUS);
      const dotScale = agentSpriteScale(AGENT_TOKEN_RADIUS);
      const continentalScale = agent.isRetinue ? agentSpriteScale(AGENT_DOT_RADIUS) : undefined;

      // Create single sprite — starts with portrait material/scale
      const sprite = new THREE.Sprite(portraitMaterial);
      sprite.scale.set(portraitScale, portraitScale, 1);
      sprite.userData.baseScale = portraitScale;
      sprite.position.set(wx, wy, AGENT_SPRITE_Z);
      group.add(sprite);

      spriteMap.set(agent.id, {
        sprite,
        materials: {
          portrait: portraitMaterial,
          dot: dotMaterial,
          continental: continentalMaterial,
        },
        scales: {
          portrait: portraitScale,
          dot: dotScale,
          continental: continentalScale,
        },
        isRetinue: agent.isRetinue,
      });
    }
  }

  // Dispose function: clean up all GPU resources
  const dispose = () => {
    for (const entry of spriteMap.values()) {
      entry.materials.portrait.dispose();
      entry.materials.dot.dispose();
      if (entry.materials.continental) {
        entry.materials.continental.dispose();
      }
    }
    spriteMap.clear();
  };

  return { group, spriteMap, dispose };
}

// ── Zoom Visibility ──────────────────────────────────────────────────────────

/**
 * Swaps each agent sprite's material and scale for the current zoom tier.
 *
 * Uses ZOOM_VISIBILITY_MATRIX to determine which tier to show:
 * - hero-local: portrait material + portrait scale
 * - regional/continental: dot material + dot scale (continental retinue: continental material)
 * - full-world: sprite hidden
 *
 * Also updates userData.baseScale so settle bounce uses the correct multiplier.
 *
 * @param group — the AgentSpriteGroup to update
 * @param tier — current zoom tier (from getZoomTier)
 */
export function updateZoomVisibility(group: AgentSpriteGroup, tier: ZoomTier): void {
  const showPortrait = ZOOM_VISIBILITY_MATRIX.agents_portrait[tier];
  const showDot = ZOOM_VISIBILITY_MATRIX.agents_dot[tier];
  const showRetinue = ZOOM_VISIBILITY_MATRIX.agents_retinue[tier];

  for (const [, entry] of group.spriteMap) {
    if (showPortrait) {
      entry.sprite.material = entry.materials.portrait;
      entry.sprite.scale.setScalar(entry.scales.portrait);
      entry.sprite.userData.baseScale = entry.scales.portrait;
      entry.sprite.visible = true;
    } else if (showDot) {
      entry.sprite.material = entry.materials.dot;
      entry.sprite.scale.setScalar(entry.scales.dot);
      entry.sprite.userData.baseScale = entry.scales.dot;
      entry.sprite.visible = true;
    } else if (showRetinue && entry.isRetinue && entry.materials.continental) {
      entry.sprite.material = entry.materials.continental;
      entry.sprite.scale.setScalar(entry.scales.continental!);
      entry.sprite.userData.baseScale = entry.scales.continental!;
      entry.sprite.visible = true;
    } else {
      entry.sprite.visible = false;
    }
  }
}

// ── Portrait Loader ──────────────────────────────────────────────────────────

/**
 * Asynchronously loads portrait images and updates pre-built materials.
 *
 * Updates both portrait and dot materials (shared by reference) so the
 * change is visible immediately when those materials are active on the sprite.
 *
 * @param group — the AgentSpriteGroup containing sprites to update
 * @param agents — source AgentRenderData for portrait URLs and ring colors
 */
export async function loadAgentPortraits(
  group: AgentSpriteGroup,
  agents: AgentRenderData[],
): Promise<void> {
  const loads = agents
    .filter(a => a.portraitUrl)
    .map(async (agent) => {
      const entry = group.spriteMap.get(agent.id);
      if (!entry) return;

      const ringColor = FACTION_HERALDIC_COLORS[agent.factionIndex] ?? FACTION_HERALDIC_COLORS[0];
      const texture = await loadPortraitTexture(agent.portraitUrl!, ringColor, agent.isRetinue);

      // Update both portrait and dot materials
      entry.materials.portrait.map = texture;
      entry.materials.portrait.needsUpdate = true;
      entry.materials.dot.map = texture;
      entry.materials.dot.needsUpdate = true;
    });

  await Promise.allSettled(loads);
}

// ── Position Updater ─────────────────────────────────────────────────────────

/**
 * Updates sprite positions after agents have moved hexes.
 *
 * Single sprite per agent — positions the one sprite.
 * Agents in `animatingIds` are skipped (render loop controls their position).
 *
 * @param group — the AgentSpriteGroup to update
 * @param agents — updated AgentRenderData array with new hex positions
 * @param animatingIds — set of agent IDs currently in a movement animation (skip these)
 */
export function updateAgentPositions(
  group: AgentSpriteGroup,
  agents: AgentRenderData[],
  animatingIds?: ReadonlySet<string>,
): void {
  const hexGroups = new Map<string, AgentRenderData[]>();
  for (const agent of agents) {
    const key = `${agent.hexCol},${agent.hexRow}`;
    if (!hexGroups.has(key)) hexGroups.set(key, []);
    hexGroups.get(key)!.push(agent);
  }

  for (const hexGroup of hexGroups.values()) {
    hexGroup.sort((a, b) => a.id.localeCompare(b.id));
  }

  for (const hexAgents of hexGroups.values()) {
    const visible = hexAgents.slice(0, MAX_RING_AGENTS);

    for (let i = 0; i < visible.length; i++) {
      const agent = visible[i];
      const entry = group.spriteMap.get(agent.id);
      if (!entry) continue;
      if (animatingIds?.has(agent.id)) continue;

      const ringOffset = getFixedSlotOffset(i, visible.length, EDGE_MID_ANGLES_DEG, SLOT_RING_RADIUS);
      const worldPos = hexToWorldWithOffset(
        { col: agent.hexCol, row: agent.hexRow },
        ringOffset,
        HEX_CONSTANTS.HEX_SIZE,
      );
      const wx = worldPos.x;
      const wy = worldPos.y;

      entry.sprite.position.set(wx, wy, AGENT_SPRITE_Z);
    }
  }
}

export { PORTRAIT_TEXTURE_SIZE };
