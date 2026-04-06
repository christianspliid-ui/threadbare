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
  AVATAR_SCALE_MULTIPLIER,
  AVATAR_Z_BUMP,
  AVATAR_PULSE_PERIOD_S,
  AVATAR_PULSE_OPACITY,
} from '../agents/agentSpriteTypes';
import type { ZoomTier } from './ZoomVisibilityMatrix';
import { ZOOM_VISIBILITY_MATRIX } from './ZoomVisibilityMatrix';
import {
  buildFactionDotTextureCache,
  buildRetinueDotTexture,
  loadPortraitTexture,
  buildAvatarRingTexture,
} from '../agents/agentPortraitTextures';
import { RENDER_ORDER } from './RenderLayers';
import { HEX_CONSTANTS } from './HexFillMesh';
import { hexKey as hexKeyFn } from '../../../lib/hexKey';
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
  /** Whether this agent is the player's avatar */
  isAvatar?: boolean;
  /** Pulsing sphere-colored ring sprite (only for avatar) */
  pulseRingSprite?: THREE.Sprite;
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
    const key = hexKeyFn(agent.hexCol, agent.hexRow);
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

      // Pre-compute scales (avatar gets AVATAR_SCALE_MULTIPLIER boost)
      const scaleMult = agent.isAvatar ? AVATAR_SCALE_MULTIPLIER : 1;
      const portraitScale = agentSpriteScale(AGENT_PORTRAIT_RADIUS) * scaleMult;
      const dotScale = agentSpriteScale(AGENT_TOKEN_RADIUS) * scaleMult;
      const continentalScale = agent.isRetinue ? agentSpriteScale(AGENT_DOT_RADIUS) * scaleMult : undefined;

      // Avatar z-bump ensures avatar renders above other agents on same hex
      const spriteZ = agent.isAvatar ? AGENT_SPRITE_Z + AVATAR_Z_BUMP : AGENT_SPRITE_Z;

      // Create single sprite — starts with portrait material/scale
      const sprite = new THREE.Sprite(portraitMaterial);
      sprite.scale.set(portraitScale, portraitScale, 1);
      sprite.userData.baseScale = portraitScale;
      sprite.position.set(wx, wy, spriteZ);
      group.add(sprite);

      // Avatar gets a pulsing sphere-colored ring overlay
      let pulseRingSprite: THREE.Sprite | undefined;
      if (agent.isAvatar && agent.avatarSphereColor) {
        const ringTexture = buildAvatarRingTexture(agent.avatarSphereColor);
        const ringMaterial = new THREE.SpriteMaterial({
          map: ringTexture,
          transparent: true,
          depthWrite: false,
          opacity: AVATAR_PULSE_OPACITY[0],
        });
        pulseRingSprite = new THREE.Sprite(ringMaterial);
        // Ring is slightly larger than the portrait
        const ringScale = portraitScale * 1.2;
        pulseRingSprite.scale.set(ringScale, ringScale, 1);
        pulseRingSprite.position.set(wx, wy, spriteZ - 0.001); // Just behind portrait
        group.add(pulseRingSprite);
      }

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
        isAvatar: agent.isAvatar,
        pulseRingSprite,
      });

      // Build animation target wrapping the sprite (+ pulse ring if avatar)
      if (pulseRingSprite) {
        // Avatar: wrap both main sprite and pulse ring so they move together
        const baseTarget = createAnimationTarget(sprite);
        animationTargets.set(agent.id, {
          setPosition(x: number, y: number, z: number) {
            baseTarget.setPosition(x, y, z);
            pulseRingSprite!.position.set(x, y, z - 0.001);
          },
          setScaleMultiplier(m: number) {
            baseTarget.setScaleMultiplier(m);
          },
          resetScale() {
            baseTarget.resetScale();
          },
        });
      } else {
        animationTargets.set(agent.id, createAnimationTarget(sprite));
      }
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
      if (entry.pulseRingSprite) {
        entry.pulseRingSprite.material.dispose();
      }
    }
    spriteMap.clear();
  };

  return { group, spriteMap, animationTargets, dispose };
}

// ── Zoom Visibility ──────────────────────────────────────────────────────────

/**
 * Reference zoom level where sprite scale is 1:1 (no compensation).
 * Above this zoom, sprites are scaled down to maintain consistent screen size.
 * NFP #1: Named constant for tunability.
 */
const SPRITE_SCALE_REFERENCE_ZOOM = 12;

/**
 * Swaps each agent sprite's material and scale for the current zoom tier.
 *
 * Uses ZOOM_VISIBILITY_MATRIX to determine which tier to show:
 * - hero-local: portrait material + portrait scale
 * - regional/continental: dot material + dot scale (continental retinue: continental material)
 * - full-world: sprite hidden
 *
 * At zoom levels above SPRITE_SCALE_REFERENCE_ZOOM, sprites are scaled down
 * proportionally so they maintain a consistent apparent screen size instead of
 * growing as the camera zooms in.
 *
 * Also updates userData.baseScale so settle bounce uses the correct multiplier.
 *
 * @param group — the AgentSpriteGroup to update
 * @param tier — current zoom tier (from getZoomTier)
 * @param zoomK — current d3-zoom scale level (optional, defaults to no compensation)
 */
export function updateZoomVisibility(group: AgentSpriteGroup, tier: ZoomTier, zoomK?: number): void {
  const showPortrait = ZOOM_VISIBILITY_MATRIX.agents_portrait[tier];
  const showDot = ZOOM_VISIBILITY_MATRIX.agents_dot[tier];
  const showRetinue = ZOOM_VISIBILITY_MATRIX.agents_retinue[tier];

  // Compute zoom compensation factor: 1.0 at reference zoom, smaller at higher zooms
  const zoomCompensation = (zoomK !== undefined && zoomK > SPRITE_SCALE_REFERENCE_ZOOM)
    ? SPRITE_SCALE_REFERENCE_ZOOM / zoomK
    : 1.0;

  for (const [, entry] of group.spriteMap) {
    let baseScale: number;
    if (showPortrait) {
      entry.sprite.material = entry.materials.portrait;
      baseScale = entry.scales.portrait;
      entry.sprite.visible = true;
    } else if (showDot) {
      entry.sprite.material = entry.materials.dot;
      baseScale = entry.scales.dot;
      entry.sprite.visible = true;
    } else if (showRetinue && entry.isRetinue && entry.materials.continental) {
      entry.sprite.material = entry.materials.continental;
      baseScale = entry.scales.continental!;
      entry.sprite.visible = true;
    } else {
      entry.sprite.visible = false;
      continue;
    }

    const compensatedScale = baseScale * zoomCompensation;
    entry.sprite.scale.setScalar(compensatedScale);
    entry.sprite.userData.baseScale = compensatedScale;

    // Pulse ring tracks main sprite visibility and scale
    if (entry.pulseRingSprite) {
      entry.pulseRingSprite.visible = showPortrait;
      if (showPortrait) {
        const ringScale = compensatedScale * 1.2;
        entry.pulseRingSprite.scale.set(ringScale, ringScale, 1);
      }
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
      const texture = await loadPortraitTexture(agent.portraitUrl!, ringColor, agent.isRetinue, {
        isAvatar: agent.isAvatar,
        avatarSphereColor: agent.avatarSphereColor,
      });

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
    const key = hexKeyFn(agent.hexCol, agent.hexRow);
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

      const spriteZ = entry.isAvatar ? AGENT_SPRITE_Z + AVATAR_Z_BUMP : AGENT_SPRITE_Z;
      entry.sprite.position.set(wx, wy, spriteZ);
      // Keep pulse ring sprite in sync with main sprite position
      if (entry.pulseRingSprite) {
        entry.pulseRingSprite.position.set(wx, wy, spriteZ - 0.001);
      }
    }
  }
}

// ── Avatar Pulse Animation ────────────────────────────────────────────────────

/**
 * Updates avatar pulse ring opacity. Call once per frame from the render loop.
 *
 * Oscillates the ring's opacity between AVATAR_PULSE_OPACITY[min, max]
 * using a sine wave with period AVATAR_PULSE_PERIOD_S.
 *
 * @param group — the AgentSpriteGroup containing avatar sprites
 * @param elapsedS — elapsed time in seconds (from THREE.Clock or performance.now)
 */
export function tickAvatarPulse(group: AgentSpriteGroup, elapsedS: number): void {
  const [minOpacity, maxOpacity] = AVATAR_PULSE_OPACITY;
  const range = maxOpacity - minOpacity;
  // Sine wave: 0→1→0 over AVATAR_PULSE_PERIOD_S
  const t = (Math.sin((elapsedS / AVATAR_PULSE_PERIOD_S) * Math.PI * 2) + 1) / 2;
  const opacity = minOpacity + range * t;

  for (const [, entry] of group.spriteMap) {
    if (entry.pulseRingSprite && entry.pulseRingSprite.visible) {
      (entry.pulseRingSprite.material as THREE.SpriteMaterial).opacity = opacity;
    }
  }
}

export { PORTRAIT_TEXTURE_SIZE };
