// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act, render, cleanup } from '@testing-library/react';
import * as THREE from 'three';
import {
  AgentPulseOverlay,
  PULSE_DIAMETER_PX,
  PULSE_PERIOD_S,
  PULSE_OPACITY_RANGE,
  DEFAULT_PULSE_COLOR,
} from '../AgentPulseOverlay';
import type { AgentRenderData } from '../../agents/agentSpriteTypes';

/**
 * Tests for AgentPulseOverlay (THR-340 / Phase F2):
 * 1. Exported constants meet design plan §5.8 expectations.
 * 2. Returns nothing when spotlight is unset.
 * 3. Renders a flare div with the supplied thread color when spotlight is set
 *    and the agent is in the agents list, using a real-but-stubbed orthographic
 *    camera projecting to a 1920×1080 viewport.
 */

const CANVAS_W = 1920;
const CANVAS_H = 1080;

function makeCamera(): React.RefObject<THREE.OrthographicCamera | null> {
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
  camera.position.set(0, 0, 10);
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld(true);
  camera.updateProjectionMatrix();
  return { current: camera };
}

const SPOTLIT: AgentRenderData = {
  id: 'agent-spotlit',
  hexCol: 0,
  hexRow: 0,
  factionIndex: 0,
  isRetinue: false,
};

describe('AgentPulseOverlay exports', () => {
  it('exposes tunable constants per design plan §5.8 / encounter-experience-constants', () => {
    expect(PULSE_DIAMETER_PX).toBeGreaterThan(0);
    expect(PULSE_PERIOD_S).toBeGreaterThan(0);
    expect(PULSE_OPACITY_RANGE[0]).toBeLessThan(PULSE_OPACITY_RANGE[1]);
    expect(PULSE_OPACITY_RANGE[1]).toBeLessThanOrEqual(1);
    expect(DEFAULT_PULSE_COLOR).toMatch(/^#[0-9a-fA-F]{6}$/);
  });
});

describe('AgentPulseOverlay rendering', () => {
  beforeEach(() => {
    // Run only the FIRST scheduled rAF callback — enough to project the agent and set
    // visible-pulse state. Subsequent rAF schedules (the loop's own re-arm) are discarded
    // so the test doesn't burn through microtasks until OOM.
    let fired = 0;
    const MAX_FRAMES = 1;
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      if (fired >= MAX_FRAMES) return 0;
      fired += 1;
      Promise.resolve().then(() => cb(0));
      return fired;
    });
    vi.stubGlobal('cancelAnimationFrame', () => {});
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('renders nothing when spotlightedAgentId is undefined', () => {
    const { container } = render(
      <AgentPulseOverlay
        spotlightedAgentId={undefined}
        agents={[SPOTLIT]}
        cameraRef={makeCamera()}
        canvasWidth={CANVAS_W}
        canvasHeight={CANVAS_H}
      />,
    );
    expect(container.querySelector('[data-testid="agent-pulse-overlay"]')).toBeNull();
  });

  it('renders nothing when spotlightedAgentId does not match any agent', () => {
    const { container } = render(
      <AgentPulseOverlay
        spotlightedAgentId="missing-agent"
        agents={[SPOTLIT]}
        cameraRef={makeCamera()}
        canvasWidth={CANVAS_W}
        canvasHeight={CANVAS_H}
      />,
    );
    expect(container.querySelector('[data-testid="agent-pulse-overlay"]')).toBeNull();
  });

  it('renders a flare with the supplied thread color when the spotlit agent is in viewport at 1920×1080', async () => {
    const threadColor = '#cc66ff';
    let result: ReturnType<typeof render>;
    await act(async () => {
      result = render(
        <AgentPulseOverlay
          spotlightedAgentId={SPOTLIT.id}
          agents={[SPOTLIT]}
          threadColor={threadColor}
          cameraRef={makeCamera()}
          canvasWidth={CANVAS_W}
          canvasHeight={CANVAS_H}
        />,
      );
      // Allow the queued rAF callback (microtask) to flush so projection state lands.
      await Promise.resolve();
    });

    const overlay = result!.container.querySelector('[data-testid="agent-pulse-overlay"]');
    expect(overlay).not.toBeNull();
    const flare = result!.container.querySelector('[data-testid="agent-pulse-flare"]') as HTMLElement | null;
    expect(flare).not.toBeNull();
    // The flare's background is a radial-gradient (jsdom converts the hex+alpha tokens to rgba()).
    // The boxShadow keeps the raw hex+alpha. Assert both reference the supplied threadColor channels.
    const lcThread = threadColor.toLowerCase();
    expect(flare!.style.background.toLowerCase()).toContain('rgba(204, 102, 255');
    expect(flare!.style.boxShadow.toLowerCase()).toContain(lcThread);
    // Flare is centered (translate -50%, -50%) and uses the configured pulse animation.
    expect(flare!.style.transform).toContain('translate(-50%, -50%)');
    expect(flare!.style.animation).toContain('agent-pulse');
    // Overlay container is non-interactive.
    expect((overlay as HTMLElement).style.pointerEvents).toBe('none');
  });
});
