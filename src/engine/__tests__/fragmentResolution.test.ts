/**
 * Context-fragment resolution tests (THR-573).
 *
 * Covers the full fallback chain (bound value → '*' default → strip) and the
 * '*'-required rule, plus static surface enumeration.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  resolveFragment,
  resolveTemplateFragments,
  enumerateTemplateSurfaces,
  resetFragmentWarnings,
  FRAGMENT_DEFAULT_KEY,
  MAX_SURFACES_PER_TEMPLATE,
  MAX_VARIANTS_PER_SLOT,
  MAX_FRAGMENT_SLOTS_PER_TEMPLATE,
  SURFACE_FRAGMENT_AXES,
} from '../fragmentResolution';
import type { ContextFragmentSet } from '../../types/unifiedAction';

const FRAGMENTS: ContextFragmentSet[] = [
  {
    slot: 'opening',
    axis: 'place',
    variants: {
      '*': 'A default opening.',
      'sublocation-type.tavern': 'A tavern opening.',
      'sublocation-type.shrine': 'A shrine opening.',
    },
  },
  {
    slot: 'counterpart',
    axis: 'counterpartRole',
    variants: {
      '*': 'A default counterpart.',
      fence: 'A fence counterpart.',
    },
  },
];

beforeEach(() => {
  resetFragmentWarnings();
});

describe('resolveFragment — fallback chain', () => {
  it('resolves the bound axis value when a variant exists', () => {
    const binding = resolveFragment(FRAGMENTS, 'opening', { place: 'sublocation-type.tavern' });
    expect(binding).not.toBeNull();
    expect(binding!.text).toBe('A tavern opening.');
    expect(binding!.value).toBe('sublocation-type.tavern');
    expect(binding!.usedDefault).toBe(false);
    expect(binding!.axis).toBe('place');
  });

  it('falls back to the default when the bound value has no authored variant', () => {
    const binding = resolveFragment(FRAGMENTS, 'opening', { place: 'sublocation-type.crypt' });
    expect(binding!.text).toBe('A default opening.');
    expect(binding!.value).toBe(FRAGMENT_DEFAULT_KEY);
    expect(binding!.usedDefault).toBe(true);
  });

  it('falls back to the default when the axis is absent entirely', () => {
    expect(resolveFragment(FRAGMENTS, 'opening', {})!.usedDefault).toBe(true);
    expect(resolveFragment(FRAGMENTS, 'opening', { place: null })!.usedDefault).toBe(true);
    expect(resolveFragment(FRAGMENTS, 'opening', { place: '' })!.usedDefault).toBe(true);
  });

  it('reads each slot from its own declared axis, not the other one', () => {
    // A bound place must not leak into the counterpartRole slot.
    const binding = resolveFragment(FRAGMENTS, 'counterpart', {
      place: 'sublocation-type.tavern',
    });
    expect(binding!.usedDefault).toBe(true);
    expect(binding!.text).toBe('A default counterpart.');
  });

  it('returns null for an undeclared slot (token is stripped by the caller)', () => {
    expect(resolveFragment(FRAGMENTS, 'nope', { place: 'sublocation-type.tavern' })).toBeNull();
  });

  it('returns null when the template declares no fragments at all', () => {
    expect(resolveFragment(undefined, 'opening', {})).toBeNull();
    expect(resolveFragment([], 'opening', {})).toBeNull();
  });

  it("returns null when the variants map is missing the required '*' default", () => {
    const bad: ContextFragmentSet[] = [
      { slot: 'opening', axis: 'place', variants: { 'sublocation-type.tavern': 'Tavern.' } },
    ];
    // An unmapped value has nothing to fall back to.
    expect(resolveFragment(bad, 'opening', { place: 'sublocation-type.shrine' })).toBeNull();
    // The bound value still resolves — the missing default only bites on fallback.
    expect(resolveFragment(bad, 'opening', { place: 'sublocation-type.tavern' })!.text).toBe(
      'Tavern.',
    );
  });

  it('treats an empty-string variant as absent and falls back', () => {
    const sparse: ContextFragmentSet[] = [
      { slot: 'opening', axis: 'place', variants: { '*': 'Default.', 'sublocation-type.tavern': '' } },
    ];
    expect(resolveFragment(sparse, 'opening', { place: 'sublocation-type.tavern' })!.usedDefault).toBe(
      true,
    );
  });

  it('returns null for a slot declaring an unknown axis, and never throws', () => {
    const bogus = [
      { slot: 'opening', axis: 'weather', variants: { '*': 'Default.' } },
    ] as unknown as ContextFragmentSet[];
    expect(() => resolveFragment(bogus, 'opening', {})).not.toThrow();
    expect(resolveFragment(bogus, 'opening', {})).toBeNull();
  });

  it('is deterministic — repeated resolution of the same surface yields identical text', () => {
    const first = resolveFragment(FRAGMENTS, 'opening', { place: 'sublocation-type.shrine' });
    const second = resolveFragment(FRAGMENTS, 'opening', { place: 'sublocation-type.shrine' });
    expect(first!.text).toBe(second!.text);
  });
});

describe('resolveTemplateFragments', () => {
  it('resolves every declared slot against one bound context', () => {
    const bindings = resolveTemplateFragments(FRAGMENTS, {
      place: 'sublocation-type.tavern',
      counterpartRole: 'fence',
    });
    expect(bindings).toHaveLength(2);
    expect(bindings.map(b => b.text)).toEqual(['A tavern opening.', 'A fence counterpart.']);
    expect(bindings.every(b => !b.usedDefault)).toBe(true);
  });

  it('returns an empty list when the template declares no fragments', () => {
    expect(resolveTemplateFragments(undefined, {})).toEqual([]);
  });

  it('reports usedDefault per slot when only one axis is bound', () => {
    const bindings = resolveTemplateFragments(FRAGMENTS, { place: 'sublocation-type.shrine' });
    expect(bindings.find(b => b.slot === 'opening')!.usedDefault).toBe(false);
    expect(bindings.find(b => b.slot === 'counterpart')!.usedDefault).toBe(true);
  });
});

describe('enumerateTemplateSurfaces', () => {
  it("counts the product of non-default authored values per axis (the '*' default is not a surface)", () => {
    const result = enumerateTemplateSurfaces({ id: 't', contextFragments: FRAGMENTS });
    // 2 places × 1 role = 2 — the '*' entries are fallbacks, not counted surfaces.
    expect(result.axisValues.place).toHaveLength(2);
    expect(result.axisValues.counterpartRole).toHaveLength(1);
    expect(result.surfaceCount).toBe(2);
    expect(result.problems).toEqual([]);
  });

  it('reports exactly 1 surface for a template with no fragments', () => {
    const result = enumerateTemplateSurfaces({ id: 't', contextFragments: undefined });
    expect(result.surfaceCount).toBe(1);
    expect(result.exceedsCap).toBe(false);
  });

  it('treats an axis with no authored values as a factor of 1', () => {
    const placeOnly: ContextFragmentSet[] = [FRAGMENTS[0]];
    const result = enumerateTemplateSurfaces({ id: 't', contextFragments: placeOnly });
    expect(result.surfaceCount).toBe(2);
  });

  it("flags a slot missing the '*' default", () => {
    const bad: ContextFragmentSet[] = [
      { slot: 'opening', axis: 'place', variants: { 'sublocation-type.tavern': 'Tavern.' } },
    ];
    const result = enumerateTemplateSurfaces({ id: 't', contextFragments: bad });
    expect(result.problems.some(p => p.includes('missing the required'))).toBe(true);
  });

  it('flags slots exceeding MAX_VARIANTS_PER_SLOT', () => {
    const variants: Record<string, string> = { '*': 'Default.' };
    for (let i = 0; i < MAX_VARIANTS_PER_SLOT; i += 1) variants[`place-${i}`] = `Place ${i}.`;
    const result = enumerateTemplateSurfaces({
      id: 't',
      contextFragments: [{ slot: 'opening', axis: 'place', variants }],
    });
    expect(result.problems.some(p => p.includes('MAX_VARIANTS_PER_SLOT'))).toBe(true);
  });

  it('flags templates exceeding MAX_FRAGMENT_SLOTS_PER_TEMPLATE', () => {
    const many: ContextFragmentSet[] = Array.from(
      { length: MAX_FRAGMENT_SLOTS_PER_TEMPLATE + 1 },
      (_, i) => ({ slot: `slot${i}`, axis: 'place' as const, variants: { '*': 'Default.' } }),
    );
    const result = enumerateTemplateSurfaces({ id: 't', contextFragments: many });
    expect(result.problems.some(p => p.includes('MAX_FRAGMENT_SLOTS_PER_TEMPLATE'))).toBe(true);
  });

  it('flags a surface count over the cap', () => {
    const placeVariants: Record<string, string> = { '*': 'Default.' };
    for (let i = 0; i < 6; i += 1) placeVariants[`place-${i}`] = `Place ${i}.`;
    const roleVariants: Record<string, string> = { '*': 'Default.' };
    for (let i = 0; i < 6; i += 1) roleVariants[`role-${i}`] = `Role ${i}.`;
    const result = enumerateTemplateSurfaces({
      id: 't',
      contextFragments: [
        { slot: 'opening', axis: 'place', variants: placeVariants },
        { slot: 'counterpart', axis: 'counterpartRole', variants: roleVariants },
      ],
    });
    expect(result.surfaceCount).toBe(36);
    expect(result.surfaceCount).toBeGreaterThan(MAX_SURFACES_PER_TEMPLATE);
    expect(result.exceedsCap).toBe(true);
  });

  it('is deterministic — two runs produce identical output', () => {
    const a = enumerateTemplateSurfaces({ id: 't', contextFragments: FRAGMENTS });
    const b = enumerateTemplateSurfaces({ id: 't', contextFragments: FRAGMENTS });
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});

describe('axis registry', () => {
  it('declares exactly the two v1 identity axes', () => {
    expect([...SURFACE_FRAGMENT_AXES]).toEqual(['place', 'counterpartRole']);
  });
});

describe('surface_fragments_bound trace contract', () => {
  it('is a registered category and carries the documented payload', async () => {
    const { emitTrace, enableTracing, clearTraces, getTraces } = await import('../traceBuffer');
    const { TRACE_CATEGORIES } = await import('../../types/trace');

    // Registration — an unregistered category is silently dropped by the buffer.
    expect(TRACE_CATEGORIES).toContain('surface_fragments_bound');

    enableTracing();
    clearTraces();

    // The exact payload phaseAgentDecision builds at encounter instantiation.
    const bindings = resolveTemplateFragments(FRAGMENTS, {
      place: 'sublocation-type.tavern',
      counterpartRole: 'fence',
    });
    emitTrace({
      category: 'surface_fragments_bound',
      tick: 1,
      agentId: 'agent-1',
      templateId: 'test.template',
      surfaceKey: 'test.template|socialRole=fence|sublocationTypeId=sublocation-type.tavern',
      bindings: bindings.map(b => ({
        slot: b.slot,
        axis: b.axis,
        value: b.value,
        usedDefault: b.usedDefault,
      })),
      summary: 'surface_fragments_bound: test.template opening=sublocation-type.tavern counterpart=fence',
    } as never);

    const emitted = getTraces().filter(t => t.category === 'surface_fragments_bound');
    expect(emitted).toHaveLength(1);
    const trace = emitted[0] as unknown as {
      templateId: string;
      surfaceKey: string;
      bindings: ReadonlyArray<{ slot: string; axis: string; value: string; usedDefault: boolean }>;
    };
    expect(trace.templateId).toBe('test.template');
    // surfaceKey ties prose identity back to selection identity.
    expect(trace.surfaceKey).toContain('sublocation-type.tavern');
    expect(trace.bindings).toHaveLength(2);
    expect(trace.bindings[0]).toEqual({
      slot: 'opening',
      axis: 'place',
      value: 'sublocation-type.tavern',
      usedDefault: false,
    });
    clearTraces();
  });
});
