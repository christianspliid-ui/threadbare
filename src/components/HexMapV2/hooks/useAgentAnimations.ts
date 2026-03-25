/**
 * useAgentAnimations.ts — Hook encapsulating agent position diffing,
 * animation triggering, trail creation, and follow-mode camera panning.
 *
 * Extracted from HexMapV2.tsx (the `agents` useEffect) to isolate the
 * agent animation concern from the rest of the renderer.
 *
 * NFP #1: Uses existing constants from agentAnimationState.ts and agent-visual-content.ts.
 * NFP #3: Ring slot assignment sorted by agent ID for determinism.
 * NFP #4: Null refs → skip entire effect. Missing agents → skip silently.
 */

import { useEffect } from 'react';
import type * as THREE from 'three';
import type * as d3 from 'd3';
import type { AgentRenderData } from '../agents/agentSpriteTypes';
import { FACTION_HERALDIC_COLORS } from '../agents/agentSpriteTypes';
import { startMoveAnimation, startRoadHopAnimation, startSettleAnimation } from '../agents/agentAnimationState';
import type { AgentAnimState } from '../agents/agentAnimationState';
import { updateAgentPositions } from '../scene/AgentSpriteMesh';
import type { AgentSpriteGroup } from '../scene/AgentSpriteMesh';
import { addTrailSegment } from '../scene/MovementTrailMesh';
import { hexKey } from '../../../lib/hexKey';
import { hexToWorld, hexToWorldWithOffset } from '../../../lib/worldPosition';
import { HEX_CONSTANTS } from '../scene/HexFillMesh';
import { getFixedSlotOffset } from '../../../lib/movementPath';
import { animateCameraTo } from '../camera/CameraAnimator';
import type { FollowModeState } from '../camera/FollowMode';
import {
  SLOT_RING_RADIUS,
  EDGE_MID_ANGLES_DEG,
  MAX_RING_AGENTS,
} from '../../../data/agent-visual-content';

// ── Types ────────────────────────────────────────────────────────────────────

/** Previous position snapshot for movement detection. */
export interface AgentPrevPosition {
  col: number;
  row: number;
  ringOffset: { x: number; y: number };
  worldX: number;
  worldY: number;
}

export interface UseAgentAnimationsParams {
  agents: AgentRenderData[] | undefined;
  seed: number | undefined;
  agentSpriteGroup: React.MutableRefObject<AgentSpriteGroup | null>;
  trailGroup: React.MutableRefObject<THREE.Group | null>;
  animStates: React.MutableRefObject<Map<string, AgentAnimState>>;
  prevAgentPositions: React.MutableRefObject<Map<string, AgentPrevPosition>>;
  locationOffsets: React.MutableRefObject<Map<string, { dx: number; dy: number }>>;
  followMode: React.MutableRefObject<FollowModeState>;
  zoomRef: React.MutableRefObject<d3.ZoomBehavior<HTMLCanvasElement, unknown> | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  cameraRef: React.MutableRefObject<THREE.OrthographicCamera | null>;
}

// ── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Diffs agent positions each tick and triggers animations for hex changes (hop)
 * and ring rearrangements (settle). Also manages trail creation and follow-mode
 * camera panning.
 */
export function useAgentAnimations({
  agents,
  seed,
  agentSpriteGroup,
  trailGroup,
  animStates,
  prevAgentPositions,
  locationOffsets,
  followMode,
  zoomRef,
  canvasRef,
  cameraRef,
}: UseAgentAnimationsParams): void {
  useEffect(() => {
    const spriteGroup = agentSpriteGroup.current;
    const trailGrp = trailGroup.current;
    if (!spriteGroup || !agents || agents.length === 0) return;

    const prevPositions = prevAgentPositions.current;
    const anims = animStates.current;
    const now = performance.now();

    // ── Step 1: Group agents by hex and compute ring offsets ──
    const hexGroups = new Map<string, AgentRenderData[]>();
    for (const agent of agents) {
      const key = hexKey(agent.hexCol, agent.hexRow);
      if (!hexGroups.has(key)) hexGroups.set(key, []);
      hexGroups.get(key)!.push(agent);
    }
    for (const group of hexGroups.values()) {
      group.sort((a, b) => a.id.localeCompare(b.id));
    }

    // Build ring offset lookup: agentId → position data
    const newPositions = new Map<string, AgentPrevPosition>();
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
        newPositions.set(agent.id, { col: agent.hexCol, row: agent.hexRow, ringOffset, worldX: wx, worldY: wy });
      }
    }

    // ── Step 2: Detect hex changes (hop) and ring rearrangements (settle) ──
    let movedCount = 0;
    for (const agent of agents) {
      const prev = prevPositions.get(agent.id);
      const curr = newPositions.get(agent.id);
      if (!curr) continue;

      const hexChanged = prev && (prev.col !== agent.hexCol || prev.row !== agent.hexRow);

      if (hexChanged && prev) {
        let animState: AgentAnimState;
        if (agent.currentRoadType) {
          const isLastHop = !agent.roadHexQueueLength || agent.roadHexQueueLength === 0;
          animState = startRoadHopAnimation(
            agent.id,
            { col: prev.col, row: prev.row },
            { col: agent.hexCol, row: agent.hexRow },
            seed ?? 42,
            agent.currentRoadType,
            isLastHop,
            prev.ringOffset,
            curr.ringOffset,
          );
        } else {
          animState = startMoveAnimation(
            agent.id,
            { col: prev.col, row: prev.row },
            { col: agent.hexCol, row: agent.hexRow },
            seed ?? 42,
            prev.ringOffset,
            curr.ringOffset,
          );
        }
        anims.set(agent.id, animState);

        // Add trail segment
        if (trailGrp) {
          const locOffsets = locationOffsets.current;
          const fromWorld = hexToWorld({ col: prev.col, row: prev.row }, HEX_CONSTANTS.HEX_SIZE);
          const toWorld = hexToWorld({ col: agent.hexCol, row: agent.hexRow }, HEX_CONSTANTS.HEX_SIZE);
          const fromOff = locOffsets.get(hexKey(prev.col, prev.row));
          const toOff = locOffsets.get(hexKey(agent.hexCol, agent.hexRow));
          addTrailSegment(trailGrp, {
            fromX: fromWorld.x + (fromOff?.dx ?? 0),
            fromY: fromWorld.y + (fromOff?.dy ?? 0),
            toX: toWorld.x + (toOff?.dx ?? 0),
            toY: toWorld.y + (toOff?.dy ?? 0),
            factionColor: FACTION_HERALDIC_COLORS[agent.factionIndex] ?? FACTION_HERALDIC_COLORS[0],
            startTime: now,
          });
        }
        movedCount++;
      } else if (prev && !hexChanged) {
        const dx = Math.abs(prev.worldX - curr.worldX);
        const dy = Math.abs(prev.worldY - curr.worldY);
        if (dx > 0.5 || dy > 0.5) {
          if (!anims.has(agent.id)) {
            const settleState = startSettleAnimation(
              agent.id,
              { x: prev.worldX, y: prev.worldY },
              { x: curr.worldX, y: curr.worldY },
            );
            anims.set(agent.id, settleState);
          }
        }
      }
    }
    if (movedCount > 0) {
      console.log(`[HexMapV2] ${movedCount} agent(s) moved hex — animations triggered, trailGroup children: ${trailGrp?.children.length ?? 'N/A'}`);
    }

    // Follow mode: pan camera when followed agent changes hex
    const follow = followMode.current;
    if (follow.active && follow.agentId) {
      const followedAgent = agents.find(a => a.id === follow.agentId);
      if (followedAgent) {
        const newKey = hexKey(followedAgent.hexCol, followedAgent.hexRow);
        if (newKey !== follow.lastHexKey) {
          follow.lastHexKey = newKey;
          const followWorld = hexToWorld(
            { col: followedAgent.hexCol, row: followedAgent.hexRow },
            HEX_CONSTANTS.HEX_SIZE,
          );
          if (zoomRef.current && canvasRef.current) {
            animateCameraTo(canvasRef.current, zoomRef.current, followWorld.x, followWorld.y, undefined, 500);
          }
        }
      }
    }

    // Update sprite positions for non-animating agents
    const animatingIds = new Set(anims.keys());
    updateAgentPositions(spriteGroup, agents, animatingIds);

    // Update previous positions snapshot
    prevAgentPositions.current = newPositions;
  }, [agents, seed]); // eslint-disable-line react-hooks/exhaustive-deps
}
