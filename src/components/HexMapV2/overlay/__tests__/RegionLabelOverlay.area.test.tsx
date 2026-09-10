// @vitest-environment jsdom
/**
 * An Area's name reaches the screen (THR-1155).
 *
 * `Browser-verify substitution: jsdom-render — unattended run, no startable dev server.`
 * The geographic label tier is the one player-visible surface of this slice that lives
 * in the DOM rather than on the WebGL canvas, so this renders the real overlay through
 * the real generator and asserts the text a player would read. The generator's own
 * cases live in `regionLabels.test.ts`; what this adds is that the label survives the
 * overlay — projection, zoom-tier gating, collision — and paints.
 *
 * Before this slice the text here came from a renderer-side cluster joined to the Area's
 * graph node by list position, so the name over a range could belong to an unrelated
 * cluster. It comes from the Area's own node now, through `areaProjection`.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import { createRef } from 'react';
import * as THREE from 'three';
import { RegionLabelOverlay } from '../RegionLabelOverlay';
import { generateAreaLabels } from '../../../../engine/regionLabels';
import type { AreaProjection } from '../../../../engine/areaProjection';

const WIDTH = 1920;
const HEIGHT = 1080;
/** Inside the geographic tier's band (CONTINENTAL_MAX <= zoom < REGION_LABEL_MAX). */
const GEOGRAPHIC_ZOOM = 8;

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

/** One Area, big enough to earn a label, centred where the camera is looking. */
function projection(name: string, hexCount = 40): AreaProjection {
  const hexes = Array.from({ length: hexCount }, (_, i) => ({ col: i % 8, row: Math.floor(i / 8) }));
  return {
    areas: [{ id: 'region_0', name, featureType: 'mountain_range', hexes, center: { col: 0, row: 0 } }],
    hexAreaId: new Map(hexes.map(h => [`${h.col},${h.row}`, 'region_0'])),
  };
}

afterEach(cleanup);

describe('RegionLabelOverlay — the Area label paints', () => {
  it("renders the Area's own name over the map", async () => {
    const labels = generateAreaLabels(projection('The Iron Crags'));
    expect(labels).toHaveLength(1); // non-vacuous: the generator produced something to render

    render(
      <RegionLabelOverlay
        labels={labels}
        cameraRef={camera()}
        canvasWidth={WIDTH}
        canvasHeight={HEIGHT}
        zoomLevel={GEOGRAPHIC_ZOOM}
      />,
    );

    // The overlay title-cases the geographic tier, so match case-insensitively on the
    // words rather than pinning the transform this test does not own.
    await waitFor(() => {
      expect(screen.getByText(/iron crags/i)).toBeTruthy();
    });
  });

  it('renders nothing for an Area below the label threshold', async () => {
    const labels = generateAreaLabels(projection('The Small Hollow', 5));
    expect(labels).toHaveLength(0);

    const { container } = render(
      <RegionLabelOverlay
        labels={labels}
        cameraRef={camera()}
        canvasWidth={WIDTH}
        canvasHeight={HEIGHT}
        zoomLevel={GEOGRAPHIC_ZOOM}
      />,
    );

    expect(screen.queryByText(/small hollow/i)).toBeNull();
    // The absence is the point: an empty label set draws no stray container content.
    expect(container.textContent).toBe('');
  });

  it('hides the Area label outside the geographic zoom tier', async () => {
    const labels = generateAreaLabels(projection('The Iron Crags'));

    render(
      <RegionLabelOverlay
        labels={labels}
        cameraRef={camera()}
        canvasWidth={WIDTH}
        canvasHeight={HEIGHT}
        zoomLevel={0.5}
      />,
    );

    // Full-world zoom: the geographic tier is gated off, so the same label set that
    // painted above paints nothing here. Without this the first case would only prove
    // the overlay renders whatever it is handed.
    await waitFor(() => {
      expect(screen.queryByText(/iron crags/i)).toBeNull();
    });
  });
});
