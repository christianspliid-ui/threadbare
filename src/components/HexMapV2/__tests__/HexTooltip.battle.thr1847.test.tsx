// @vitest-environment jsdom
/**
 * THR-1847 — a siege ring and a battle sprite carry words. Hovering a besieged hex
 * says the town is under siege and by whom; a field-battle hex says a battle is
 * being fought. Both lead words come from the registry (`resolveTooltip`).
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HexTooltip } from '../interaction/HexTooltip';
import { battleHexLine, battleHexLines, BATTLE_TOOLTIP_IDS } from '../interaction/battleHexLine';
import { FIELD_BATTLE_COLOR, SIEGE_COLOR, type BattleIndicatorData } from '../scene/BattleIndicatorLayer';
import { resolveTooltip } from '../../../engine/tooltipResolver';

const SIEGE: BattleIndicatorData = { id: 'siege1', hexCol: 4, hexRow: 9, isSiege: true, attackerName: 'The Iron Pact' };
const FIELD: BattleIndicatorData = {
  id: 'battle1', hexCol: 2, hexRow: 3, isSiege: false, attackerName: 'The Iron Pact', defenderName: 'The Red Hand',
};

describe('siege and battle words resolve through the registry (THR-1847)', () => {
  it('both ids resolve through resolveTooltip with a label and a description', () => {
    for (const id of Object.values(BATTLE_TOOLTIP_IDS)) {
      const content = resolveTooltip(id);
      expect(content?.label, id).toBeTruthy();
      expect(content?.desc, id).toBeTruthy();
    }
  });

  it('a siege reads "Under siege by" its besieger, in the ring\'s colour', () => {
    const line = battleHexLine(SIEGE);
    expect(line.word).toBe(resolveTooltip(BATTLE_TOOLTIP_IDS.siege)!.label);
    expect(`${line.word}${line.rest}`).toBe('Under siege by The Iron Pact');
    expect(line.color).toBe(SIEGE_COLOR);
  });

  it('a field battle names both sides, in the swords\' colour', () => {
    const line = battleHexLine(FIELD);
    expect(`${line.word}${line.rest}`).toBe('Battle between The Iron Pact and The Red Hand');
    expect(line.color).toBe(FIELD_BATTLE_COLOR);
  });

  it('missing names fall back to the word alone, never an id', () => {
    expect(battleHexLine({ id: 's', hexCol: 0, hexRow: 0, isSiege: true }).rest).toBe('');
    expect(battleHexLine({ id: 'b', hexCol: 0, hexRow: 0, isSiege: false, defenderName: 'The Red Hand' }).rest)
      .toBe(' with The Red Hand');
  });

  it('battleHexLines picks only the battles on the hovered hex', () => {
    expect(battleHexLines([SIEGE, FIELD], 4, 9).map(l => l.id)).toEqual(['siege1']);
    expect(battleHexLines([SIEGE, FIELD], 0, 0)).toEqual([]);
    expect(battleHexLines(undefined, 4, 9)).toEqual([]);
  });

  it('the hex tooltip renders the siege line and the battle line', () => {
    render(
      <HexTooltip
        terrainName="grassland"
        coord={{ col: 4, row: 9 }}
        screenX={400}
        screenY={400}
        canvasWidth={1920}
        canvasHeight={1080}
        battleLines={[battleHexLine(SIEGE), battleHexLine(FIELD)]}
      />,
    );
    expect(screen.getByTestId('hex-tooltip-siege').textContent).toBe('Under siege by The Iron Pact');
    expect(screen.getByTestId('hex-tooltip-battle').textContent).toBe('Battle between The Iron Pact and The Red Hand');
  });

  it('no battle on the hex renders no battle line', () => {
    render(
      <HexTooltip terrainName="grassland" coord={{ col: 1, row: 1 }} screenX={0} screenY={0} canvasWidth={800} canvasHeight={600} />,
    );
    expect(screen.queryByTestId('hex-tooltip-siege')).toBeNull();
    expect(screen.queryByTestId('hex-tooltip-battle')).toBeNull();
  });
});
