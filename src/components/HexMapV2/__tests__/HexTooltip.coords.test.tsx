// @vitest-environment jsdom
/**
 * THR-1804 — the hex tooltip names the place, not its grid cell. Cold playtest
 * round 3 read "Wilderness (18, 11)" as debug info; coordinates and the raw
 * terrain key now show only under the designer view.
 */
import { afterEach, describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HexTooltip } from '../interaction/HexTooltip';
import {
  resetNudgeDesignerView,
  setNudgeDesignerView,
} from '../../Game/encounter-stage/designerView';

const base = {
  terrainName: 'Deep Forest',
  terrainKey: 'deep_forest',
  coord: { col: 18, row: 11 },
  screenX: 300, screenY: 300, canvasWidth: 1920, canvasHeight: 1080,
};

afterEach(() => resetNudgeDesignerView());

describe('HexTooltip coordinates (THR-1804)', () => {
  it('shows no grid coordinates or raw terrain key to the player', () => {
    const { container } = render(<HexTooltip {...base} />);
    expect(container.textContent).not.toMatch(/18,\s*11/);
    expect(container.textContent).not.toContain('deep_forest');
    expect(screen.queryByTestId('hex-tooltip-coords')).toBeNull();
    expect(container.textContent).toContain('Deep Forest');
  });

  it('the designer view brings them back', () => {
    setNudgeDesignerView(true);
    render(<HexTooltip {...base} />);
    expect(screen.getByTestId('hex-tooltip-coords').textContent).toContain('(18, 11)');
  });
});
