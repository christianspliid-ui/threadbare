/**
 * The seeded spell generator's gate (THR-1572) — a spell the world makes promises only
 * what the engine does.
 *
 * Plan: `Docs/plans/2026-09-30-thr-1572-seeded-spell-generator.md` § Review path and
 * § Done when. For every gate seed and every tradition, a full library: zero validator
 * problems, zero read-back failures, every core fires across the grid, every library
 * holds a step-usable spell, and the generator is deterministic. A control batch of
 * deliberately dishonest spells must fail, or a clean pass proves nothing.
 */
import { describe, it, expect } from 'vitest';
import type { SpellTemplate } from '../../../types/effects';
import { traditionCatalog } from '../traditionCatalog';
import { generateTraditionLibrary } from '../spellLibrary';
import { generateSpell } from '../generateSpell';
import { validateGeneratedSpell } from '../validateGeneratedSpell';
import { readBackSpell } from '../readBack';
import { describeSpell } from '../describeSpell';
import type { GeneratedSpell } from '../types';
import { SPELL_CORES } from '../../../data/spell-generator-cores';
import { SPELL_GEN_GATE_SEEDS, SPELL_GEN_STEP_ARENAS, TRADITION_ENV } from '../../../data/spell-generator-tables';
import { SPELL_TEMPLATES, GENERATED_SPELL_ID_PREFIX } from '../../../data/spell-templates';

function worldLibraries(seed: number): Map<string, GeneratedSpell[]> {
  const coreUse = new Map<string, number>();
  const usedNames = new Set<string>();
  const out = new Map<string, GeneratedSpell[]>();
  for (const t of traditionCatalog()) out.set(t.id, generateTraditionLibrary(t.id, seed, coreUse, usedNames));
  return out;
}

const GRID = SPELL_GEN_GATE_SEEDS.map(seed => ({ seed, libraries: worldLibraries(seed) }));
const ALL = GRID.flatMap(g => [...g.libraries.values()].flat());

describe('the catalog', () => {
  it('every world-model tradition has an authored row', () => {
    expect(traditionCatalog()).toHaveLength(34);
    for (const t of traditionCatalog()) expect(TRADITION_ENV[t.id], t.id).toBeDefined();
  });
  it('no authored spell id starts with the generated prefix', () => {
    for (const t of SPELL_TEMPLATES) expect(t.id.startsWith(GENERATED_SPELL_ID_PREFIX), t.id).toBe(false);
  });
});

describe('the gate — every tradition, every gate seed', () => {
  it('builds a full library with no empty slot', () => {
    for (const { seed, libraries } of GRID) {
      for (const [id, lib] of libraries) expect(lib.length, `${id} @ ${seed}`).toBe(6);
    }
  });

  it('zero validator problems', () => {
    const problems = ALL.flatMap(s => validateGeneratedSpell(s.template, s.provenance).map(p => `${s.template.id}: ${p}`));
    expect(problems).toEqual([]);
  });

  it('zero read-back failures', () => {
    const failures = ALL.flatMap(s => readBackSpell(s).failures.map(f => `${s.template.id} (${s.provenance.coreId}): ${f}`));
    expect(failures).toEqual([]);
  }, 120_000);

  it('every core fires at least once across the grid', () => {
    const fired = new Set(ALL.map(s => s.provenance.coreId));
    expect(SPELL_CORES.map(c => c.id).filter(id => !fired.has(id))).toEqual([]);
  });

  it('every library holds a step-usable spell', () => {
    for (const { seed, libraries } of GRID) {
      for (const [id, lib] of libraries) {
        expect(lib.some(s => s.template.arena && SPELL_GEN_STEP_ARENAS.includes(s.template.arena)), `${id} @ ${seed}`).toBe(true);
      }
    }
  });

  it('is deterministic — the same seed builds byte-identical libraries', () => {
    const again = worldLibraries(SPELL_GEN_GATE_SEEDS[0]);
    expect(JSON.stringify([...again])).toBe(JSON.stringify([...GRID[0].libraries]));
  });

  it('every spell reads in words: no numerals, no placeholders', () => {
    for (const s of ALL) {
      const w = describeSpell(s.template, s.provenance.catchIndexes);
      for (const line of [w.does, w.costs, w.wrong, s.template.flavorText, s.template.name]) {
        expect(line, s.template.id).not.toMatch(/\{|\}|\d/);
      }
    }
  });

  it('price leans are never overridden: holy and heal never transgress, curse and death are never free', () => {
    for (const s of ALL) {
      const primary = TRADITION_ENV[s.provenance.traditionId].themes[0];
      if (primary === 'holy' || primary === 'heal') expect(s.provenance.priceLayer, s.template.id).not.toBe('transgression');
      if (primary === 'curse' || primary === 'death') expect(s.provenance.priceLayer, s.template.id).not.toBe('free');
    }
  });

  it('no Foundation sphere below tier 3', () => {
    for (const s of ALL) {
      if (['order', 'chaos', 'light', 'darkness'].includes(s.sphere)) expect(s.template.tier, s.template.id).toBeGreaterThanOrEqual(3);
    }
  });
});

describe('the control batch — dishonest spells must fail', () => {
  const base = ALL.find(s => s.template.agency === 'deliberate' && s.template.arena === 'encounter')!;
  const woven = ALL.find(s => s.template.agency === 'fate_woven')!;
  const bad = (t: Partial<SpellTemplate>, prov: Partial<GeneratedSpell['provenance']> = {}, from = base) =>
    validateGeneratedSpell({ ...from.template, ...t } as SpellTemplate, { ...from.provenance, ...prov });

  it('a cast duration (modifier-only) is refused', () => {
    expect(bad({ effects: [{ type: 'duration', ticks: 6, reach: 'iron', value: 0.05, destroyOnExpiry: true }] })).not.toEqual([]);
  });
  it('a doom_rate_multiplier is refused', () => {
    expect(bad({ effects: [{ type: 'modify_rules', scope: { scope: 'self' }, rule: 'doom_rate_multiplier', value: 1.1, ticks: 'permanent' }] })).not.toEqual([]);
  });
  it('an enemy-filtered encounter cast is refused', () => {
    expect(bad({ targeting: { type: 'agent', range: 0, filter: 'enemy' } })).not.toEqual([]);
  });
  it('a notice nothing reveals is refused', () => {
    expect(bad({}, { priceLayer: 'transgression', traditionId: 'magic.necromancy', notice: { severity: 0.5, revealFamilies: ['nothing.matches.this'] } })).not.toEqual([]);
  });
  it('a stateful carried primitive is refused', () => {
    expect(bad({ passiveEffects: [{ type: 'stacking', reach: 'iron', valuePerStack: 0.02, maxStacks: 3, stackOn: 'on_damaged' }] }, {}, woven)).not.toEqual([]);
  });
  it('a carried self_remove is refused (it would delete the shared spell for every bearer)', () => {
    expect(bad({ passiveEffects: [...(woven.template.passiveEffects ?? []), { type: 'action_trigger', on: 'encounter_critical_failure', probability: 0.5, payload: { kind: 'self_remove' } }] }, {}, woven)).not.toEqual([]);
  });
  it('a holy tradition paying transgression is refused', () => {
    expect(bad({}, { traditionId: 'magic.holy', priceLayer: 'transgression', notice: { severity: 0.5, revealFamilies: ['investigation'] } })).not.toEqual([]);
  });
});

describe('generateSpell', () => {
  it('returns null when no core fits the slot', () => {
    expect(generateSpell({ worldSeed: 1, traditionId: 'magic.healing', tier: 1, slot: 0, agency: 'deliberate', arena: 'map_mark' })).toBeNull();
  });
  it('returns null for an unknown tradition', () => {
    expect(generateSpell({ worldSeed: 1, traditionId: 'magic.nope', tier: 1, slot: 0, agency: 'fate_woven', arena: 'encounter' })).toBeNull();
  });
});
