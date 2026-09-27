/**
 * The item generator's gate — an item never promises what the engine does not do
 * (THR-1570).
 *
 * Plan: `Docs/plans/2026-09-26-thr-1570-seeded-item-generator.md` § Review path, gate 1.
 * For `ITEM_GEN_GATE_SEEDS` × every band × both origins × `ITEM_GEN_GATE_ITEMS_PER_CELL`
 * items: zero validator problems and zero read-back failures; every core fires; every
 * core has at least `ITEM_GEN_MIN_SIGNATURES` signatures and every signature reads back
 * clean at every band it is legal at; the same key gives the same item; and a control
 * batch of deliberately dishonest items **fails** — or a clean pass proves nothing.
 */

import { describe, it, expect } from 'vitest';
import { ITEM_GEN_CORES } from '../../../data/item-generator-cores';
import {
  ITEM_GEN_GATE_ITEMS_PER_CELL, ITEM_GEN_GATE_SEEDS, ITEM_GEN_MIN_SIGNATURES, ITEM_GEN_ORIGINS,
} from '../../../data/item-generator-tables';
import type { ItemGenBand } from '../../../data/item-generator-tables';
import { generateReviewBatch, bandsForOrigin } from '../reviewBatch';
import { generateItem } from '../generateItem';
import { generateValidItem } from '../mintGeneratedItem';
import { validateGeneratedItem } from '../validateGeneratedItem';
import { REVIEW_MAKERS, reviewWorldContext } from '../reviewWorld';
import { readBack } from './readBack';
import type { GeneratedItem } from '../types';
import type { AttachmentEffect } from '../../../types/effects';

describe('item generator gate (THR-1570)', () => {
  it('every core carries at least ITEM_GEN_MIN_SIGNATURES signatures', () => {
    const thin = ITEM_GEN_CORES.filter(c => c.signatures.length < ITEM_GEN_MIN_SIGNATURES).map(c => c.id);
    expect(thin).toEqual([]);
  });

  it('every masterwork-eligible core can tell its maker (a made line naming only the maker)', () => {
    const silent = ITEM_GEN_CORES.filter(c => c.origins.includes('masterwork'))
      .filter(c => !c.provenance.some(l => l.made && l.uses.length === 1 && l.uses[0] === 'maker'))
      .map(c => c.id);
    expect(silent).toEqual([]);
  });

  it('the seeded grid: zero validator problems, zero read-back failures, every core fires', () => {
    const fired = new Set<string>();
    const failures: string[] = [];
    let items = 0;
    for (const seed of ITEM_GEN_GATE_SEEDS) {
      for (const origin of ITEM_GEN_ORIGINS) {
        for (const band of bandsForOrigin(origin)) {
          const batch = generateReviewBatch({ seed, count: ITEM_GEN_GATE_ITEMS_PER_CELL, band, origin });
          for (const r of batch) {
            if (!r.item) { failures.push(`${r.seedKey}: no item — ${r.problems.join('; ')}`); continue; }
            items++;
            fired.add(r.item.coreId);
            if (r.rerolls > 0) failures.push(`${r.item.name} [${r.seedKey}] needed ${r.rerolls} rerolls`);
            const rb = readBack(r.item);
            if (!rb.ok) failures.push(`${r.item.name} [${r.item.coreId}/${r.item.signatureId} ${r.seedKey}]: ${rb.failures.join('; ')}`);
          }
        }
      }
    }
    expect(failures).toEqual([]);
    expect(items).toBeGreaterThan(0);
    expect([...ITEM_GEN_CORES.map(c => c.id)].filter(id => !fired.has(id))).toEqual([]);
  });

  it('every signature of every core reads back clean at every band it is legal at, from both origins it allows', () => {
    const failures: string[] = [];
    for (const core of ITEM_GEN_CORES) {
      for (const sig of core.signatures) {
        for (const band of (sig.bands ?? core.bands) as readonly ItemGenBand[]) {
          for (const origin of core.origins) {
            if (!bandsForOrigin(origin).includes(band)) continue;
            for (let k = 0; k < 3; k++) {
              const world = reviewWorldContext(origin === 'masterwork' ? REVIEW_MAKERS[k % REVIEW_MAKERS.length] : null);
              const seedKey = `gen_item:gate:${core.id}:${sig.id}:${band}:${origin}:${k}`;
              const r = generateValidItem({ seedKey, band, origin, world, coreId: core.id, signatureId: sig.id });
              if (!r.ok) { failures.push(`${core.id}/${sig.id} b${band} ${origin}: ${r.reason} ${r.lastProblems.join('; ')}`); continue; }
              if (r.rerolls > 0) failures.push(`${core.id}/${sig.id} b${band} ${origin} needed ${r.rerolls} rerolls`);
              if (r.item.signatureId !== sig.id) failures.push(`${core.id}/${sig.id} came out as ${r.item.signatureId}`);
              const rb = readBack(r.item);
              if (!rb.ok) failures.push(`${core.id}/${sig.id} b${band} ${origin} (${r.item.name}): ${rb.failures.join('; ')}`);
            }
          }
        }
      }
    }
    expect(failures).toEqual([]);
  });

  it('a core\'s signatures are different ideas, not re-skins (their effect shapes differ)', () => {
    const reskins: string[] = [];
    for (const core of ITEM_GEN_CORES) {
      const band = core.bands[core.bands.length - 1];
      const origin = core.origins[core.origins.length - 1];
      const shapes = core.signatures.map(sig => {
        const world = reviewWorldContext(origin === 'masterwork' ? REVIEW_MAKERS[0] : null);
        const it = generateItem({ seedKey: `gen_item:shape:${core.id}:${sig.id}`, band, origin, world, coreId: core.id, signatureId: sig.id });
        return it ? it.effects.map(e => `${e.type}:${'reach' in e ? e.reach : ''}:${'condition' in e ? e.condition : ''}`).sort().join('|') : '';
      });
      if (new Set(shapes).size < shapes.length) reskins.push(core.id);
    }
    expect(reskins).toEqual([]);
  });

  it('determinism: the same seed key gives a byte-identical item', () => {
    const world = reviewWorldContext(REVIEW_MAKERS[1]);
    for (const origin of ITEM_GEN_ORIGINS) {
      const req = { seedKey: `gen_item:42:${origin}:7`, band: 3 as const, origin, world: origin === 'masterwork' ? world : reviewWorldContext(null) };
      expect(JSON.stringify(generateItem(req))).toBe(JSON.stringify(generateItem(req)));
    }
    const a = generateReviewBatch({ seed: 99, count: 10 });
    const b = generateReviewBatch({ seed: 99, count: 10 });
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  describe('the dishonest control batch fails', () => {
    const base = (): GeneratedItem => {
      const r = generateValidItem({ seedKey: 'gen_item:control:base', band: 2, origin: 'masterwork', world: reviewWorldContext(REVIEW_MAKERS[0]), coreId: 'made_past_skill', signatureId: 'too_good' });
      if (!r.ok) throw new Error('control base did not generate');
      return r.item;
    };
    const lie = (effects: AttachmentEffect[], over: Partial<GeneratedItem> = {}): GeneratedItem => ({ ...base(), effects, catchIndexes: [], ...over });
    const CONTROLS: Array<[string, GeneratedItem]> = [
      ['a fight bonus on Iron (a passive in disguise)', lie([{ type: 'conditional', condition: 'in_combat', reach: 'iron', value: 0.05 }])],
      ['a trigger on rest (never raised)', lie([{ type: 'action_trigger', on: 'rest', payload: { kind: 'resource_delta', resource: 'quintessence', amount: 0.02 } } as AttachmentEffect])],
      ['a rule nothing reads', lie([{ type: 'modify_rules', scope: { scope: 'self' }, rule: 'spawn_rate_multiplier', value: 0.5, ticks: 'permanent' } as AttachmentEffect])],
      ['an immunity to nothing', lie([{ type: 'tag_immunity', tags: ['#moonsickness'] }])],
      ['a hex overlay nothing reads', lie([{ type: 'hex_effect', property: 'sacred_ground', value: 1, mode: 'add' }])],
      ['a condition that does not exist', lie([{ type: 'action_trigger', on: 'encounter_failure', payload: { kind: 'condition_grant', conditionTraitId: 'trait.condition.moonstruck', durationTicks: 24 } } as AttachmentEffect])],
      ['breakable with nothing that breaks it', lie([{ type: 'passive', reach: 'iron', value: 0.05 }], { lossCondition: 'breakable' })],
      ['a bonus over the per-effect cap', lie([{ type: 'passive', reach: 'iron', value: 0.4 }])],
    ];
    for (const [label, item] of CONTROLS) {
      it(`catches: ${label}`, () => {
        const problems = validateGeneratedItem(item);
        let readBackFailures: string[] = [];
        try { readBackFailures = readBack(item).failures; } catch (e) { readBackFailures = [String(e)]; }
        expect(problems.length + readBackFailures.length).toBeGreaterThan(0);
      });
    }
  });
});
