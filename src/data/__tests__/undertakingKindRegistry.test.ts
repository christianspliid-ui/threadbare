/**
 * The no-destroy-no-kind gate — THR-1297 §1, slice 2.
 *
 * The plan names one kill criterion for this file specifically: *"the registry gate
 * can be satisfied vacuously (a destroy row pointing at an unreachable template) → the
 * gate must resolve reachability, not presence"*. So the shape of this suite is set by
 * that criterion rather than by the happy path.
 *
 * Two claims need proving and they pull in opposite directions:
 *
 * 1. **The live registry is sound.** Today that is trivially true because it is empty
 *    — and an empty registry is exactly what a validator can never be shown to reject
 *    anything by. Asserted, but worth nothing on its own.
 * 2. **The validator rejects every way a row can lie.** Proven against adversarial
 *    fixtures, one per problem code, each differing from a *known-good* row in exactly
 *    one respect. That is the arm that would still hold if the live registry were full.
 *
 * The emptiness pin at the bottom fails deliberately when slice 5 authors the first
 * row; its failure is the reminder to restate it as that row's authored identity.
 */
import { describe, it, expect } from 'vitest';
import type { StrategicActionTemplate, UndertakingKindRow } from '../../types/strategicAction';
import {
  UNDERTAKING_KIND_ROWS,
  validateKindRegistry,
  getUndertakingKindForTemplate,
  getUndertakingKindRow,
  isKindDestroyTemplate,
} from '../undertaking-kinds';
import { MOTIVE_GATE_KINDS } from '../strategic-action-constants';
import { getStrategicTemplate, getAllStrategicTemplates } from '../../engine/strategicActionCandidates';

// ─── Fixtures ───────────────────────────────────────────────────────

function template(over: Partial<StrategicActionTemplate> = {}): StrategicActionTemplate {
  return {
    id: 'tpl_raze',
    displayName: 'Raze',
    verb: 'destroy',
    executionMode: 'instant',
    behaviorFamily: 'warlord-expansion',
    reachProfile: { iron: 1 },
    activityProse: ['Burning it.'],
    completionProse: ['Burned.'],
    targetRule: { type: 'any_location' },
    motiveGate: ['rivalry'],
    ...over,
  };
}

/** A row that passes clean — every adversarial fixture is this, minus one thing. */
const GOOD_ROW: UndertakingKindRow = {
  kindId: 'sublocation',
  tier: 2,
  displayName: 'Sublocation',
  objectShape: "type:'location' + parentLocationId",
  ownable: true,
  createTemplateIds: ['tpl_build'],
  updateTemplateIds: ['tpl_fortify'],
  destroyTemplateIds: ['tpl_raze'],
  lexicon: 'lex_holdfast',
};

const WORLD: Record<string, StrategicActionTemplate> = {
  tpl_build: template({ id: 'tpl_build', verb: 'create', motiveGate: undefined }),
  tpl_fortify: template({ id: 'tpl_fortify', verb: 'change', motiveGate: undefined }),
  tpl_raze: template({ id: 'tpl_raze' }),
};

const resolve = (id: string): StrategicActionTemplate | undefined => WORLD[id];

/** `{...WORLD, tpl_raze: …}` narrows to a one-key literal — keep the index signature. */
const swapRaze = (raze: StrategicActionTemplate): Record<string, StrategicActionTemplate> =>
  ({ ...WORLD, tpl_raze: raze });

const codesFor = (rows: readonly UndertakingKindRow[]): string[] =>
  validateKindRegistry(rows, resolve).map(p => p.code).sort();

// ─── The validator ──────────────────────────────────────────────────

describe('validateKindRegistry — the known-good baseline', () => {
  it('accepts a row whose whole CRUD closure resolves', () => {
    expect(validateKindRegistry([GOOD_ROW], resolve)).toEqual([]);
  });
});

describe('validateKindRegistry — every way a row can lie', () => {
  it('rejects a kind that names no counter-play at all', () => {
    const problems = validateKindRegistry(
      [{ ...GOOD_ROW, destroyTemplateIds: [] }], resolve,
    );
    expect(problems.map(p => p.code)).toEqual(['no_destroy']);
    expect(problems[0].kindId).toBe('sublocation');
  });

  it('rejects a destroy id nobody implements — presence is not reachability', () => {
    // The kill criterion, stated as a test. This row *looks* closed: it has a
    // non-empty destroyTemplateIds and a plausible id. A gate that counted entries
    // would pass it and the kind would ship with no undoing.
    const problems = validateKindRegistry(
      [{ ...GOOD_ROW, destroyTemplateIds: ['strategic_raze_the_thing'] }], resolve,
    );
    expect(problems.map(p => p.code)).toContain('unreachable_template');
    expect(problems.find(p => p.code === 'unreachable_template')?.templateId)
      .toBe('strategic_raze_the_thing');
  });

  it('rejects an unreachable create id too — a broken row is broken in any role', () => {
    expect(codesFor([{ ...GOOD_ROW, createTemplateIds: ['tpl_ghost'] }]))
      .toEqual(['unreachable_template']);
  });

  it('rejects counter-play that is not a destroy verb', () => {
    // The other vacuous shape: point destroyTemplateIds at something that resolves,
    // and the row reads closed while the "undoing" builds the thing.
    expect(codesFor([{ ...GOOD_ROW, destroyTemplateIds: ['tpl_build'] }]))
      .toEqual(['destroy_role_verb_mismatch', 'destroy_without_motive_gate']);
  });

  it('rejects a destroy verb with no motive gate — motiveless demolition', () => {
    const bare = swapRaze(template({ motiveGate: undefined }));
    const problems = validateKindRegistry([GOOD_ROW], id => bare[id]);
    expect(problems.map(p => p.code)).toEqual(['destroy_without_motive_gate']);
  });

  it('rejects a destroy verb whose motive gate is present but empty', () => {
    const empty = swapRaze(template({ motiveGate: [] }));
    expect(validateKindRegistry([GOOD_ROW], id => empty[id]).map(p => p.code))
      .toEqual(['destroy_without_motive_gate']);
  });

  it('rejects a motive outside the vocabulary', () => {
    const odd = swapRaze(template({ motiveGate: ['because_tuesday' as never] }));
    const problems = validateKindRegistry([GOOD_ROW], id => odd[id]);
    expect(problems.map(p => p.code)).toEqual(['unknown_motive']);
    expect(problems[0].detail).toContain('because_tuesday');
  });

  it('accepts every member of MOTIVE_GATE_KINDS — the vocabulary is not narrower than it says', () => {
    // Guards the gap the other direction: a validator whose accepted set had drifted
    // below MOTIVE_GATE_KINDS would reject a legitimately authored row, and the
    // "unknown motive" test above would still pass.
    const all = swapRaze(template({ motiveGate: [...MOTIVE_GATE_KINDS] }));
    expect(validateKindRegistry([GOOD_ROW], id => all[id])).toEqual([]);
  });

  it('rejects two rows claiming the same kind', () => {
    expect(codesFor([GOOD_ROW, { ...GOOD_ROW, lexicon: 'lex_other' }]))
      .toEqual(['duplicate_kind']);
  });

  it('reports every problem across rows, not just the first', () => {
    const codes = codesFor([
      { ...GOOD_ROW, destroyTemplateIds: [] },
      { ...GOOD_ROW, kindId: 'trade_route', createTemplateIds: ['tpl_ghost'] },
    ]);
    expect(codes).toEqual(['no_destroy', 'unreachable_template']);
  });
});

// ─── The live registry ──────────────────────────────────────────────

describe('the shipped registry', () => {
  it('is sound against the real template registry', () => {
    expect(validateKindRegistry(UNDERTAKING_KIND_ROWS, getStrategicTemplate)).toEqual([]);
  });

  it('registers T1 and T2 whole — the authored identity', () => {
    // Was the emptiness pin until THR-1297 slice 5 authored the five T1 rows, which
    // is what the pin existed to announce. Restated as an exact set rather than
    // relaxed to a count: the identity worth holding is *which* kinds are registered,
    // because the failure this guards against is a row landing without its
    // counter-play, and a count cannot see that.
    //
    // THR-1308 appended the two T2 rows. The set stays exact for the same reason.
    expect(UNDERTAKING_KIND_ROWS.map(r => r.kindId)).toEqual([
      'intelligence_cache',
      'leverage_mark',
      'masterwork_item',
      'chart_find',
      'network',
      'trade_route',
      'place_location',
    ]);
  });

  it('registers no tier above 2 — T3 lands with its own destroys', () => {
    // The other half of the same identity, and the reason the absent kinds are absent
    // rather than stubbed: `warband` and `faction` lack a shipped destroy verb, so
    // registering them now would mean pointing `destroyTemplateIds` at something that
    // cannot undo them. That is the vacuity the gate above refuses, and it does not
    // stop being vacuous because the rows would look more complete with it.
    //
    // `sublocation` is the T2 row that is *also* still absent, and for the same
    // reason rather than an oversight: its six build templates ship, its raze does
    // not. THR-1308 shipped the two T2 kinds whose counter-play it could author.
    expect(UNDERTAKING_KIND_ROWS.every(r => r.tier <= 2)).toBe(true);
    expect(UNDERTAKING_KIND_ROWS.map(r => r.kindId)).not.toContain('sublocation');
    expect(UNDERTAKING_KIND_ROWS.map(r => r.kindId)).not.toContain('warband');
    expect(UNDERTAKING_KIND_ROWS.map(r => r.kindId)).not.toContain('faction');
  });

  it('every T2 row is ownable, and every T1 row is not — the tier boundary', () => {
    // The substantive difference the tier marks (THR-1308). T1's objects are edges,
    // possessions and actor-side records; T2's are ground. Holdings is about ground,
    // so `ownable` tracks the tier exactly — and a future row that breaks this will
    // have to say why here rather than drifting into it.
    for (const row of UNDERTAKING_KIND_ROWS) {
      expect(row.ownable, `${row.kindId} (tier ${row.tier})`).toBe(row.tier >= 2);
    }
  });

  it('every T2 counter-play is cross-family — the world takes a work back, the owner does not', () => {
    // The D column is what the *world* can do, not what the owner may spend. Both T2
    // destroys are warlord verbs against merchant and builder works; a row whose
    // destroy sat in its own creating family would be a self-spend miscast as a
    // counter, which is the `strategic_burn_the_mark` distinction one tier up.
    const t2 = UNDERTAKING_KIND_ROWS.filter(r => r.tier === 2);
    expect(t2.length).toBeGreaterThan(0);
    for (const row of t2) {
      const creatorFamilies = new Set(
        row.createTemplateIds.map(id => getStrategicTemplate(id)?.behaviorFamily),
      );
      for (const destroyId of row.destroyTemplateIds) {
        const destroyFamily = getStrategicTemplate(destroyId)?.behaviorFamily;
        expect(destroyFamily, `${row.kindId} destroy '${destroyId}'`).toBeDefined();
        expect(
          creatorFamilies.has(destroyFamily),
          `${row.kindId}: '${destroyId}' undoes its own family's work`,
        ).toBe(false);
      }
    }
  });

  it('every registered row names a counter-play that exists and is gated', () => {
    // Deliberately not a re-run of `validateKindRegistry` — this walks the rows the
    // long way, so a bug that made the validator itself permissive could not hide
    // behind its own green result.
    for (const row of UNDERTAKING_KIND_ROWS) {
      expect(row.destroyTemplateIds.length).toBeGreaterThan(0);
      for (const id of row.destroyTemplateIds) {
        const template = getStrategicTemplate(id);
        expect(template, `${row.kindId} names unreachable destroy '${id}'`).toBeDefined();
        expect(template!.verb).toBe('destroy');
        expect(template!.motiveGate?.length ?? 0).toBeGreaterThan(0);
      }
    }
  });

  it('has no shipped destroy verb without a motive gate', () => {
    // The corpus-wide half of the same rule, which holds whether or not a kind row
    // names the template. `strategic_raid_supply_lines` is the one destroy verb in
    // the shipped 43 and it gained its gate in this slice.
    const ungated = getAllStrategicTemplates()
      .filter(t => t.verb === 'destroy' && (t.motiveGate?.length ?? 0) === 0)
      .map(t => t.id);
    expect(ungated).toEqual([]);
  });

  it('every shipped motiveGate names only known motives', () => {
    const known = new Set<string>(MOTIVE_GATE_KINDS);
    const strays = getAllStrategicTemplates()
      .flatMap(t => (t.motiveGate ?? []).map(m => `${t.id}:${m}`))
      .filter(pair => !known.has(pair.split(':')[1]));
    expect(strays).toEqual([]);
  });

  it('lookups are total on an unknown id', () => {
    expect(getUndertakingKindRow('not_a_kind')).toBeUndefined();
    expect(getUndertakingKindForTemplate('strategic_raid_supply_lines')).toBeUndefined();
    expect(isKindDestroyTemplate('strategic_raid_supply_lines')).toBe(false);
  });
});
