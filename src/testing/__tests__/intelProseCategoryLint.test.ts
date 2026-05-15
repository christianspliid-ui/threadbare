import { describe, expect, it } from 'vitest';
import type { UnifiedActionTemplate } from '../../types/unifiedAction';
import { UNIFIED_ACTION_TEMPLATES } from '../../data/unified-action-templates';
import { isIntelCategoryPlausible, runIntelProseCategoryLint } from '../intelProseCategoryLint';

// ─── Fixtures ─────────────────────────────────────────────────────

/** Minimal template skeleton — fills only the fields the lint reads. */
function makeTemplate(overrides: Partial<UnifiedActionTemplate>): UnifiedActionTemplate {
  return {
    id: 'test.lint.base',
    rarityTier: 1,
    intrinsicTier: 'shaping',
    name: 'Base Template',
    reach: 'iron',
    crudType: 'update',
    scale: 'local',
    steps: [],
    ...overrides,
  } as unknown as UnifiedActionTemplate;
}

const TEMPLATE_WITH_COTRAFFIC = makeTemplate({
  id: 'test.lint.cotraffic',
  name: 'Co-traffic Template',
  aftermathConfig: {
    branchOnStep: 0,
    variants: {},
    fallback: {
      overview: 'Overview',
      changes: [],
      reactions: [
        {
          id: 'reaction_one',
          label: 'A reaction',
          effects: [
            { kind: 'intelligence', category: 'agent_network', label: 'L', detail: 'D', reliability: 0.8 },
            {
              kind: 'intel_referenced_prose',
              category: 'agent_network',
              prose: { reliable: 'Reliable prose.' },
            },
          ],
        },
      ],
    },
  },
});

const TEMPLATE_WITH_STRUCTURAL_MATCH = makeTemplate({
  id: 'test.lint.network.contact',
  name: 'Network Contact Template',
  aftermathConfig: {
    branchOnStep: 0,
    variants: {},
    fallback: {
      overview: 'Overview',
      changes: [],
      reactions: [
        {
          id: 'reaction_structural',
          label: 'A reaction',
          effects: [
            {
              kind: 'intel_referenced_prose',
              category: 'agent_network',
              prose: { reliable: 'Structural match prose.' },
            },
          ],
        },
      ],
    },
  },
});

const TEMPLATE_BAD_FIXTURE = makeTemplate({
  id: 'test.lint.fishing.trip',
  name: 'Unrelated Fishing Trip',
  aftermathConfig: {
    branchOnStep: 0,
    variants: {},
    fallback: {
      overview: 'Overview',
      changes: [],
      reactions: [
        {
          id: 'catch_fish',
          label: 'Haul it in.',
          effects: [
            {
              kind: 'intel_referenced_prose',
              category: 'military_position',
              prose: { reliable: 'This looks suspicious.' },
            },
          ],
        },
      ],
    },
  },
});

// ─── Tests ────────────────────────────────────────────────────────

describe('isIntelCategoryPlausible', () => {
  it('clears via co-traffic rule when same reaction grants intelligence in that category', () => {
    expect(isIntelCategoryPlausible('agent_network', TEMPLATE_WITH_COTRAFFIC)).toBe(true);
  });

  it('clears via structural rule when template id contains a category matcher substring', () => {
    expect(isIntelCategoryPlausible('agent_network', TEMPLATE_WITH_STRUCTURAL_MATCH)).toBe(true);
  });

  it('flags when neither co-traffic nor structural rule matches', () => {
    expect(isIntelCategoryPlausible('military_position', TEMPLATE_BAD_FIXTURE)).toBe(false);
  });
});

describe('runIntelProseCategoryLint — synthetic fixtures', () => {
  it('emits no warning for co-traffic template', () => {
    const result = runIntelProseCategoryLint([TEMPLATE_WITH_COTRAFFIC]);
    expect(result.warnings).toHaveLength(0);
    expect(result.effectCount).toBe(1);
  });

  it('emits no warning for structural-match template', () => {
    const result = runIntelProseCategoryLint([TEMPLATE_WITH_STRUCTURAL_MATCH]);
    expect(result.warnings).toHaveLength(0);
  });

  it('emits one warning for the bad fixture', () => {
    const result = runIntelProseCategoryLint([TEMPLATE_BAD_FIXTURE]);
    expect(result.warnings).toHaveLength(1);
    const w = result.warnings[0];
    expect(w.templateId).toBe('test.lint.fishing.trip');
    expect(w.reactionId).toBe('catch_fish');
    expect(w.effectIndex).toBe(0);
    expect(w.category).toBe('military_position');
    expect(w.searchedSubstrings).toEqual(expect.arrayContaining(['war', 'siege', 'patrol']));
  });

  it('is deterministic — same input produces same warnings', () => {
    const a = runIntelProseCategoryLint([TEMPLATE_BAD_FIXTURE]);
    const b = runIntelProseCategoryLint([TEMPLATE_BAD_FIXTURE]);
    expect(a.warnings).toEqual(b.warnings);
  });
});

describe('runIntelProseCategoryLint — THR-139 pilots clear', () => {
  const pilotIds = [
    'ac.senior.planar_probe',
    'bf.quest.repair_wall',
    'encounter.anomaly.sap_of_ages',
  ];

  for (const id of pilotIds) {
    it(`pilot ${id} has no warnings`, () => {
      const template = UNIFIED_ACTION_TEMPLATES.find(t => t.id === id);
      expect(template, `template ${id} not found in UNIFIED_ACTION_TEMPLATES`).toBeDefined();
      if (!template) return;
      const result = runIntelProseCategoryLint([template]);
      expect(result.warnings).toHaveLength(0);
    });
  }
});
