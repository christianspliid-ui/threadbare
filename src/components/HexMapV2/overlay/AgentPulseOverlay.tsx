/**
 * AgentPulseOverlay.tsx — Hex pulse overlay for the spotlighted agent (THR-340 / Phase F2).
 *
 * Renders a thread-color flare on the spotlighted agent's hex while the world view → encounter
 * handoff transition is in flight. Mounted alongside the other label overlays in HexMapV2.
 *
 * Pattern follows RegionLabelOverlay / LocationLabelOverlay:
 * - Absolutely-positioned <div> over the canvas
 * - Position updates inside requestAnimationFrame (no React re-render per camera change)
 * - Camera projection uses the same NDC → pixel formula as RegionLabelOverlay's projectLabel
 * - pointer-events: none (display-only)
 *
 * NFP #1 (tunability): pulse size, period, and opacity range live as named constants.
 * NFP #4 (fail-soft): renders nothing when the spotlight is unset, the camera is missing,
 *   or the spotlighted agent isn't in the agents prop (e.g. off-map or fogged).
 */

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import * as THREE from 'three';
import type { AgentRenderData } from '../agents/agentSpriteTypes';
import { hexToWorld } from '../../../lib/worldPosition';
import { HEX_CONSTANTS } from '../scene/HexFillMesh';

// ── NFP #1: Tunable constants ────────────────────────────────────────────────

/** Diameter of the pulsing flare (px). The flare is centered on the agent's hex. */
export const PULSE_DIAMETER_PX = 96;

/** Period of one full pulse cycle (s). Tuned to feel like a steady heartbeat. */
export const PULSE_PERIOD_S = 1.6;

/** Opacity range for the pulse animation: [trough, peak]. */
export const PULSE_OPACITY_RANGE: [number, number] = [0.35, 0.85];

/** Default flare color when no thread color is provided (gold accent). */
export const DEFAULT_PULSE_COLOR = '#d4a040';

// ── Props ────────────────────────────────────────────────────────────────────

interface AgentPulseOverlayProps {
  /** Agent id the spotlight is currently on. Null/undefined = no pulse rendered. */
  spotlightedAgentId?: string | null;
  /** Agent render data — used to look up the spotlighted agent's hex coordinate. */
  agents?: AgentRenderData[];
  /** Thread/sphere color hex. Falls back to gold when omitted. */
  threadColor?: string;
  /** Camera ref shared with HexMapV2 (must be the same OrthographicCamera). */
  cameraRef: React.RefObject<THREE.OrthographicCamera | null>;
  /** Canvas dimensions used for NDC → pixel projection. */
  canvasWidth: number;
  canvasHeight: number;
}

interface ProjectedPulse {
  visible: boolean;
  screenX: number;
  screenY: number;
}

// ── Component ────────────────────────────────────────────────────────────────

export function AgentPulseOverlay({
  spotlightedAgentId,
  agents,
  threadColor,
  cameraRef,
  canvasWidth,
  canvasHeight,
}: AgentPulseOverlayProps) {
  const [pulse, setPulse] = useState<ProjectedPulse>({ visible: false, screenX: 0, screenY: 0 });
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!spotlightedAgentId) {
      setPulse({ visible: false, screenX: 0, screenY: 0 });
      return;
    }

    const agent = (agents ?? []).find(a => a.id === spotlightedAgentId);
    if (!agent) {
      setPulse({ visible: false, screenX: 0, screenY: 0 });
      return;
    }

    let running = true;

    function update() {
      if (!running) return;
      const camera = cameraRef.current;
      if (!camera || !agent) {
        rafRef.current = requestAnimationFrame(update);
        return;
      }

      const world = hexToWorld({ col: agent.hexCol, row: agent.hexRow }, HEX_CONSTANTS.HEX_SIZE);
      const vec = new THREE.Vector3(world.x, world.y, 0);
      vec.project(camera);
      const sx = (vec.x + 1) / 2 * canvasWidth;
      const sy = (1 - vec.y) / 2 * canvasHeight;

      const inViewport =
        sx >= -PULSE_DIAMETER_PX && sx <= canvasWidth + PULSE_DIAMETER_PX &&
        sy >= -PULSE_DIAMETER_PX && sy <= canvasHeight + PULSE_DIAMETER_PX;

      setPulse({ visible: inViewport, screenX: sx, screenY: sy });
      rafRef.current = requestAnimationFrame(update);
    }

    rafRef.current = requestAnimationFrame(update);

    return () => {
      running = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, [spotlightedAgentId, agents, cameraRef, canvasWidth, canvasHeight]);

  if (!spotlightedAgentId || !pulse.visible) return null;

  const color = threadColor ?? DEFAULT_PULSE_COLOR;
  const flareStyle: CSSProperties = {
    position: 'absolute',
    left: `${pulse.screenX}px`,
    top: `${pulse.screenY}px`,
    width: `${PULSE_DIAMETER_PX}px`,
    height: `${PULSE_DIAMETER_PX}px`,
    transform: 'translate(-50%, -50%)',
    borderRadius: '50%',
    pointerEvents: 'none',
    background: `radial-gradient(circle, ${color}cc 0%, ${color}66 35%, ${color}00 70%)`,
    boxShadow: `0 0 24px ${color}99`,
    animation: `agent-pulse ${PULSE_PERIOD_S}s ease-in-out infinite`,
  };

  return (
    <div
      data-testid="agent-pulse-overlay"
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 18,
        overflow: 'hidden',
      }}
    >
      <div data-testid="agent-pulse-flare" style={flareStyle} />
    </div>
  );
}
