/**
 * AgentSpriteMesh.ts — Three.js scene module for agent sprite rendering.
 *
 * Single-sprite-per-agent design: each agent has one THREE.Sprite with
 * pre-built materials for each draw kind (portrait, dot, pip). On zoom changes,
 * updateZoomVisibility picks the zoom band, reads the agent's marker kind from
 * MAP_MARKERS (THR-1899) for the draw kind and screen size, and sets the sprite's
 * world scale to sizePx / k — one steady size per band, whatever the zoom inside it.
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
  AVATAR_Z_BUMP,
  AVATAR_PULSE_PERIOD_S,
  AVATAR_PULSE_OPACITY,
  ACTIVITY_HALO_COLORS,
  ACTIVITY_HALO_OPACITY,
  ACTIVITY_HALO_SCALE_FRACTION,
} from '../agents/agentSpriteTypes';
import type { ZoomTier } from './ZoomVisibilityMatrix';
import {
  agentMarkerKind,
  markerDrawIn,
  markerSizePx,
  type MapMarkerKind,
  type ZoomBand,
} from '../../../data/map-markers';
import {
  buildFactionDotTextureCache,
  buildRetinueDotTexture,
  loadPortraitTexture,
  buildAvatarRingTexture,
  buildAvatarSigilDotTexture,
  buildActivityHaloTexture,
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
  /**
   * Pre-built materials per draw kind. `portrait` also draws the medallion (the
   * portrait in its ring, smaller); `dot` is the faction dot; `pip` the gold-ringed
   * dot a threaded mortal shows when the whole world is in view.
   */
  materials: {
    portrait: THREE.SpriteMaterial;
    dot: THREE.SpriteMaterial;
    pip: THREE.SpriteMaterial;
  };
  /** Which MAP_MARKERS row sizes and draws this agent (THR-1899). */
  kind: MapMarkerKind;
  /** Whether this agent is a retinue member (gold portrait ring) */
  isRetinue: boolean;
  /** Whether this agent is the player's avatar */
  isAvatar?: boolean;
  /** Pulsing sphere-colored ring sprite (only for avatar) */
  pulseRingSprite?: THREE.Sprite;
  /** Colored activity halo ring sprite (hero-local only, null when no activityCategory) */
  activityHaloSprite?: THREE.Sprite;
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
  /**
   * THR-1878 — agents a lens draws one step up (the Threads lens's medallions):
   * their marker scales by THREADS_LENS_MEDALLION_SCALE. Set by the host from the
   * lens layer; empty with no lens on.
   */
  lensStepIds?: ReadonlySet<string>;
}

/** "Medallions grow one step" under the Threads lens (THR-1830 § 6). NFP #1. */
export const THREADS_LENS_MEDALLION_SCALE = 1.25;

// ── Pre-built texture cache ───────────────────────────────────────────────────

const dotTextureCache = buildFactionDotTextureCache(FACTION_HERALDIC_COLORS);

/** Gold-ringed dots: the `pip` a threaded mortal shows at full-world zoom. */
const pipTextureCache = new Map<number, THREE.CanvasTexture>();
for (let i = 0; i < FACTION_HERALDIC_COLORS.length; i++) {
  pipTextureCache.set(i, buildRetinueDotTexture(FACTION_HERALDIC_COLORS[i]));
}

// Lazy cache: color hex string → halo ring texture. At most ~9 distinct colors.
const activityHaloTextureCache = new Map<string, THREE.CanvasTexture>();

/** Avatar pulse ring size as a share of the sprite (unchanged since before THR-1899). */
const AVATAR_PULSE_RING_SCALE = 1.2;

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

      // THR-1609: the avatar starts god-marked (sphere ring + sigil), never as a
      // faction dot, so it is distinct from mortals before its portrait loads.
      const factionTexture = agent.isAvatar && agent.avatarSphereColor && agent.avatarSigil
        ? buildAvatarSigilDotTexture(agent.avatarSphereColor, agent.avatarSigil)
        : dotTextureCache.get(agent.factionIndex) ?? dotTextureCache.get(0)!;

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

      // The pip: the avatar keeps its sigil dot; a threaded mortal a gold-ringed dot.
      const pipTexture = agent.isAvatar
        ? factionTexture
        : (pipTextureCache.get(agent.factionIndex) ?? pipTextureCache.get(0)!);
      const pipMaterial = new THREE.SpriteMaterial({
        map: pipTexture,
        transparent: true,
        depthWrite: false,
      });

      const kind = agentMarkerKind(agent);
      // Starting world scale: the close-up size at the hero-local reference zoom.
      // updateZoomVisibility replaces it with sizePx / k on the first zoom pass.
      const portraitScale = (markerSizePx(kind, 'heroLocal') ?? 0) / BAND_REFERENCE_K.heroLocal;

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
        const ringScale = portraitScale * AVATAR_PULSE_RING_SCALE;
        pulseRingSprite.scale.set(ringScale, ringScale, 1);
        pulseRingSprite.position.set(wx, wy, spriteZ - 0.001); // Just behind portrait
        group.add(pulseRingSprite);
      }

      // Activity halo (hero-local only, shown behind portrait sprite)
      let activityHaloSprite: THREE.Sprite | undefined;
      const haloColor = agent.activityCategory
        ? ACTIVITY_HALO_COLORS[agent.activityCategory]
        : undefined;
      if (haloColor) {
        let haloTexture = activityHaloTextureCache.get(haloColor);
        if (!haloTexture) {
          haloTexture = buildActivityHaloTexture(haloColor);
          activityHaloTextureCache.set(haloColor, haloTexture);
        }
        const haloMaterial = new THREE.SpriteMaterial({
          map: haloTexture,
          transparent: true,
          depthWrite: false,
          opacity: ACTIVITY_HALO_OPACITY,
        });
        activityHaloSprite = new THREE.Sprite(haloMaterial);
        const haloScale = portraitScale * ACTIVITY_HALO_SCALE_FRACTION;
        activityHaloSprite.scale.set(haloScale, haloScale, 1);
        activityHaloSprite.userData.baseScale = haloScale;
        activityHaloSprite.position.set(wx, wy, spriteZ - 0.002); // Behind portrait
        activityHaloSprite.visible = false; // Shown by updateZoomVisibility at hero-local
        group.add(activityHaloSprite);
      }

      spriteMap.set(agent.id, {
        sprite,
        materials: {
          portrait: portraitMaterial,
          dot: dotMaterial,
          pip: pipMaterial,
        },
        kind,
        isRetinue: agent.isRetinue,
        isAvatar: agent.isAvatar,
        pulseRingSprite,
        activityHaloSprite,
      });

      // Build animation target — moves main sprite + all satellite sprites together
      const baseTarget = createAnimationTarget(sprite);
      const satellites: { sprite: THREE.Sprite; zOff: number }[] = [];
      if (pulseRingSprite) satellites.push({ sprite: pulseRingSprite, zOff: -0.001 });
      if (activityHaloSprite) satellites.push({ sprite: activityHaloSprite, zOff: -0.002 });

      if (satellites.length > 0) {
        animationTargets.set(agent.id, {
          setPosition(x: number, y: number, z: number) {
            baseTarget.setPosition(x, y, z);
            for (const { sprite: s, zOff } of satellites) {
              s.position.set(x, y, z + zOff);
            }
          },
          setScaleMultiplier(m: number) { baseTarget.setScaleMultiplier(m); },
          resetScale() { baseTarget.resetScale(); },
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
      entry.materials.pip.dispose();
      if (entry.pulseRingSprite) {
        entry.pulseRingSprite.material.dispose();
      }
      if (entry.activityHaloSprite) {
        (entry.activityHaloSprite.material as THREE.SpriteMaterial).dispose();
      }
    }
    spriteMap.clear();
  };

  return { group, spriteMap, animationTargets, dispose };
}

// ── Zoom Visibility ──────────────────────────────────────────────────────────

/** ZoomTier → the MAP_MARKERS band name. */
export const ZOOM_BAND_OF_TIER: Record<ZoomTier, ZoomBand> = {
  'full-world': 'fullWorld',
  'continental': 'continental',
  'regional': 'regional',
  'hero-local': 'heroLocal',
};

/**
 * The zoom assumed for a band when a caller passes no k (tests, the first build).
 * Inside each band's range; NFP #1.
 */
export const BAND_REFERENCE_K: Record<ZoomBand, number> = {
  fullWorld: 1,
  continental: 3,
  regional: 10,
  heroLocal: 20,
};

/**
 * Sets each agent sprite's material, visibility and size for the zoom (THR-1899).
 *
 * The band comes from the tier; the agent's marker kind (avatar, threaded mortal,
 * other) picks a draw kind and a screen size from MAP_MARKERS. The world scale is
 * `sizePx / k` (a world unit is k CSS px), so the marker holds one steady screen
 * size inside a band. A kind with no size in a band is hidden there. The avatar's
 * pulse ring and the activity halo show only with the portrait (hero-local).
 *
 * Also updates userData.baseScale so settle bounce uses the correct multiplier.
 *
 * @param group — the AgentSpriteGroup to update
 * @param tier — current zoom tier (from getZoomTier)
 * @param zoomK — current d3-zoom scale; defaults to the band's reference zoom
 */
export function updateZoomVisibility(group: AgentSpriteGroup, tier: ZoomTier, zoomK?: number): void {
  const band = ZOOM_BAND_OF_TIER[tier];
  const k = zoomK !== undefined && zoomK > 0 ? zoomK : BAND_REFERENCE_K[band];

  for (const [agentId, entry] of group.spriteMap) {
    const px = markerSizePx(entry.kind, band);
    if (px === null) {
      entry.sprite.visible = false;
      if (entry.pulseRingSprite) entry.pulseRingSprite.visible = false;
      if (entry.activityHaloSprite) entry.activityHaloSprite.visible = false;
      continue;
    }
    const draw = markerDrawIn(entry.kind, band);
    entry.sprite.material = draw === 'dot'
      ? entry.materials.dot
      : draw === 'pip'
        ? entry.materials.pip
        : entry.materials.portrait;
    entry.sprite.visible = true;

    const step = group.lensStepIds?.has(agentId) ? THREADS_LENS_MEDALLION_SCALE : 1;
    const scale = (px * step) / k;
    entry.sprite.scale.set(scale, scale, 1);
    entry.sprite.userData.baseScale = scale;

    const showPortrait = draw === 'portrait';
    if (entry.pulseRingSprite) {
      entry.pulseRingSprite.visible = showPortrait;
      if (showPortrait) {
        const ringScale = scale * AVATAR_PULSE_RING_SCALE;
        entry.pulseRingSprite.scale.set(ringScale, ringScale, 1);
      }
    }
    if (entry.activityHaloSprite) {
      entry.activityHaloSprite.visible = showPortrait;
      if (showPortrait) {
        const haloScale = scale * ACTIVITY_HALO_SCALE_FRACTION;
        entry.activityHaloSprite.scale.set(haloScale, haloScale, 1);
        entry.activityHaloSprite.userData.baseScale = haloScale;
      }
    }
  }
}

// ── Portrait Loader ──────────────────────────────────────────────────────────

/**
 * Asynchronously loads portrait images and updates pre-built materials.
 *
 * Updates the portrait material (which also draws the medallion) so the change
 * is visible immediately when it is active on the sprite.
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
        avatarSigil: agent.avatarSigil,
      });

      // The portrait material draws both the portrait and the medallion. The dot
      // keeps the faction colour (MAP_MARKERS: a plain mortal far out is a dot).
      entry.materials.portrait.map = texture;
      entry.materials.portrait.needsUpdate = true;
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
