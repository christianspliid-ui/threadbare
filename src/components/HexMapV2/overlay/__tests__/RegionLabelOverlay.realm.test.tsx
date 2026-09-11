// @vitest-environment jsdom
/**
 * A Realm's name reaches the screen, and moves with its ground (THR-1155).
 *
 * `Browser-verify substitution: jsdom-render — unattended run, no startable dev server.`
 * The realm label tier is this step's one player-visible surface that lives in the DOM
 * rather than on the WebGL canvas (the border and the seat markers are geometry, asserted
 * on their real factories in `BorderMesh.test.ts`), so this renders the real overlay
 * through the real generator and asserts the words a player would read.
 *
 * The third case is the one that could not have been written before this step: the same
 * Realm, after a conquest moved its claim, paints its name in a different place. The
 * domain label it replaced was positioned from a worldgen centroid and could not move at
 * all.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import { createRef } from 'react';
import * as THREE from 'three';
import { RegionLabelOverlay } from '../RegionLabelOverlay';
import { generateRealmLabels } from '../../../../engine/regionLabels';
import type { RealmProjection } from '../../../../engine/realmProjection';

const WIDTH = 1920;
const HEIGHT = 1080;
/** Inside the realm tier's band (zoom < REGION_LABEL_MAX). */
const REALM_ZOOM = 8;
/** Outside it — the realm tier is gated off at and above REGION_LABEL_MAX. */
const TOO_CLOSE_ZOOM = 12;

/** An orthographic camera centred on the origin, as the map builds one. */
function camera() {
  const cam = new THREE.OrthographicCamera(-100, 100, 100, -100, 0.1, 1000);
  cam.position.set(0, 0, 10);
  cam.updateMatrixWorld(true);
  cam.updateProjectionMatrix();
  const ref = createRef<THREE.OrthographicCamera | null>();
  (ref as { current: THREE.OrthographicCamera | null }).current = cam;
  return ref as React.RefObject<THREE.OrthographicCamera | null>;
}

/** One Realm holding a block of ground starting at `startCol`. */
function projection(name: string, startCol = 0, hexCount = 12): RealmProjection {
  const hexes = Array.from({ length: hexCount }, (_, i) => ({
    col: startCol + (i % 4),
    row: Math.floor(i / 4),
  }));
  return {
    realms: [{
      id: 'faction_0',
      name,
      seatHex: hexes[0],
      seatLocationId: 'loc_0',
      heldLocationIds: ['loc_0'],
      hexes,
    }],
    hexRealmId: new Map(hexes.map(h => [`${h.col},${h.row}`, 'faction_0'])),
    unclaimedHexes: 0,
  };
}

afterEach(cleanup);

describe('RegionLabelOverlay — the Realm label paints', () => {
  it("renders the Realm's own name over the ground it holds", async () => {
    const labels = generateRealmLabels(projection('The Hold of Witness Skyfield'));
    expect(labels).toHaveLength(1); // non-vacuous: the generator produced something to render

    render(
      <RegionLabelOverlay
        labels={labels}
        cameraRef={camera()}
        canvasWidth={WIDTH}
        canvasHeight={HEIGHT}
        zoomLevel={REALM_ZOOM}
      />,
    );

    // The realm tier is uppercased by CSS, not by the generator, so match the words
    // case-insensitively rather than pinning a transform this test does not own.
    await waitFor(() => {
      expect(screen.getByText(/witness skyfield/i)).toBeTruthy();
    });
  });

  it('renders nothing for a Realm that holds no ground', async () => {
    const empty = projection('The Exiled Crown');
    empty.realms[0] = { ...empty.realms[0], hexes: [] };
    const labels = generateRealmLabels(empty);
    expect(labels).toHaveLength(0);

    const { container } = render(
      <RegionLabelOverlay
        labels={labels}
        cameraRef={camera()}
        canvasWidth={WIDTH}
        canvasHeight={HEIGHT}
        zoomLevel={REALM_ZOOM}
      />,
    );

    expect(screen.queryByText(/exiled crown/i)).toBeNull();
    // The absence is the point: a Realm with no border has no name on the map either.
    expect(container.textContent).toBe('');
  });

  it('paints the name in a different place once the Realm holds different ground', async () => {
    const before = generateRealmLabels(projection('The March of Shadow-Kept Light', 0));
    // Three columns east — far enough to move the label, near enough to stay inside the
    // camera's frustum, which culls what it cannot see just as the real map does.
    const after = generateRealmLabels(projection('The March of Shadow-Kept Light', 3));

    const positionOf = async (labels: typeof before): Promise<string> => {
      const { unmount } = render(
        <RegionLabelOverlay
          labels={labels}
          cameraRef={camera()}
          canvasWidth={WIDTH}
          canvasHeight={HEIGHT}
          zoomLevel={REALM_ZOOM}
        />,
      );
      const el = await waitFor(() => screen.getByText(/shadow-kept light/i));
      const left = (el as HTMLElement).style.left;
      unmount();
      return left;
    };

    const leftBefore = await positionOf(before);
    const leftAfter = await positionOf(after);

    // Both painted, and not in the same column: the label followed the claim. This is
    // the moving political map, read off the DOM.
    expect(leftBefore).toBeTruthy();
    expect(leftAfter).toBeTruthy();
    expect(leftAfter).not.toBe(leftBefore);
  });

  it('hides the Realm label outside its zoom tier', async () => {
    const labels = generateRealmLabels(projection('The Hold of Witness Skyfield'));

    render(
      <RegionLabelOverlay
        labels={labels}
        cameraRef={camera()}
        canvasWidth={WIDTH}
        canvasHeight={HEIGHT}
        zoomLevel={TOO_CLOSE_ZOOM}
      />,
    );

    // Zoomed past the region band: the same label set that painted above paints nothing.
    // Without this the first case would only prove the overlay renders what it is handed.
    await waitFor(() => {
      expect(screen.queryByText(/witness skyfield/i)).toBeNull();
    });
  });
});
