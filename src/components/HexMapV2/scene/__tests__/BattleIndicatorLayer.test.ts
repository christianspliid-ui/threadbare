// @vitest-environment jsdom
/**
 * BattleIndicatorLayer.test.ts — the layer refills in place as battles come and go
 * (THR-1846).
 *
 * Tests cover:
 * - a siege draws the ring size, a field battle the swords size, each tagged isSiege
 * - rebuildBattleIndicatorLayer replaces the sprites on the same group (no accumulation)
 * - rebuild([]) clears the group and its materials
 * - countRenderedBattleIndicators counts what is drawn, split by kind; hidden counts 0
 * - battleIndicatorSignature changes only when the drawn set changes
 */

import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import {
  createBattleIndicatorLayer,
  rebuildBattleIndicatorLayer,
  countRenderedBattleIndicators,
  battleIndicatorSignature,
  SIEGE_RING_SIZE,
  BATTLE_SPRITE_SIZE,
  type BattleIndicatorData,
} from '../BattleIndicatorLayer';

const FIELD: BattleIndicatorData = { id: 'battle_a', hexCol: 3, hexRow: 4, isSiege: false };
const SIEGE: BattleIndicatorData = { id: 'siege_b', hexCol: 7, hexRow: 2, isSiege: true };

describe('BattleIndicatorLayer (THR-1846)', () => {
  it('draws a siege at ring size and a field battle at swords size, tagged by kind', () => {
    const layer = createBattleIndicatorLayer([FIELD, SIEGE]);
    expect(layer.group.children).toHaveLength(2);
    const [field, siege] = layer.group.children as THREE.Sprite[];
    expect(field.scale.x).toBe(BATTLE_SPRITE_SIZE);
    expect(field.userData.isSiege).toBe(false);
    expect(siege.scale.x).toBe(SIEGE_RING_SIZE);
    expect(siege.userData.isSiege).toBe(true);
  });

  it('a siege that starts mid-run is drawn on the same group after a rebuild', () => {
    const layer = createBattleIndicatorLayer([]);
    const group = layer.group;
    expect(countRenderedBattleIndicators(group)).toEqual({ battles: 0, sieges: 0 });

    rebuildBattleIndicatorLayer(layer, [SIEGE]);
    expect(layer.group).toBe(group);
    expect(countRenderedBattleIndicators(group)).toEqual({ battles: 0, sieges: 1 });

    rebuildBattleIndicatorLayer(layer, [SIEGE, FIELD]);
    expect(group.children).toHaveLength(2);
    expect(layer.materials).toHaveLength(2);
    expect(countRenderedBattleIndicators(group)).toEqual({ battles: 1, sieges: 1 });
  });

  it('an ended battle leaves the map on the next rebuild', () => {
    const layer = createBattleIndicatorLayer([FIELD, SIEGE]);
    rebuildBattleIndicatorLayer(layer, []);
    expect(layer.group.children).toHaveLength(0);
    expect(layer.materials).toHaveLength(0);
  });

  it('a hidden layer counts nothing', () => {
    const layer = createBattleIndicatorLayer([SIEGE]);
    layer.group.visible = false;
    expect(countRenderedBattleIndicators(layer.group)).toEqual({ battles: 0, sieges: 0 });
    expect(countRenderedBattleIndicators(null)).toEqual({ battles: 0, sieges: 0 });
  });

  it('the signature changes only when the drawn set changes', () => {
    const a = battleIndicatorSignature([FIELD, SIEGE]);
    expect(battleIndicatorSignature([{ ...FIELD }, { ...SIEGE }])).toBe(a);
    expect(battleIndicatorSignature([FIELD])).not.toBe(a);
    expect(battleIndicatorSignature([FIELD, { ...SIEGE, isSiege: false }])).not.toBe(a);
  });
});
