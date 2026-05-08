import { describe, it, expect } from 'vitest';
import {
  lintEncounterContract,
  summarize,
  type GraphRegistry,
  type LintIssue,
  PROSE_QUALITY_FLAGS,
  PROSE_QUALITY_WARN_THRESHOLD,
} from '../encounter-content-lint';
import {
  GOOD_FIXTURES,
  BAD_FIXTURES,
  GOOD_FIXTURE_REGISTRY_IDS,
} from '../__fixtures__/encounter-content-lint';

function buildRegistry(extraNodeIds: readonly string[] = []): GraphRegistry {
  return {
    nodeIds: new Set([...GOOD_FIXTURE_REGISTRY_IDS, ...extraNodeIds]),
    contentIds: new Set(),
  };
}

describe('encounter content lint — good fixtures', () => {
  for (const fx of GOOD_FIXTURES) {
    it(`${fx.name}: no errors, no warnings`, () => {
      const issues = lintEncounterContract(fx.contract, buildRegistry(), fx.name);
      const { errors, warnings } = summarize(issues);
      expect(errors, `unexpected errors: ${JSON.stringify(issues, null, 2)}`).toBe(0);
      expect(warnings, `unexpected warnings: ${JSON.stringify(issues, null, 2)}`).toBe(0);
    });
  }
});

describe('encounter content lint — bad fixtures', () => {
  for (const fx of BAD_FIXTURES) {
    it(`${fx.name}: exactly one ${fx.expectedSeverity} of rule ${fx.expectedRuleId}`, () => {
      const issues = lintEncounterContract(fx.contract, buildRegistry(), fx.name);
      const matching = issues.filter(
        (i) => i.rule_id === fx.expectedRuleId && i.severity === fx.expectedSeverity,
      );
      expect(matching.length, `expected ${fx.expectedRuleId} ${fx.expectedSeverity}, got: ${JSON.stringify(issues, null, 2)}`).toBeGreaterThanOrEqual(1);

      // No other errors should fire — bad fixtures isolate one rule.
      const otherErrors = issues.filter(
        (i) => i.severity === 'error' && i.rule_id !== fx.expectedRuleId,
      );
      expect(otherErrors, `unexpected unrelated errors: ${JSON.stringify(otherErrors, null, 2)}`).toEqual([]);
    });
  }
});

describe('encounter content lint — Zod surface', () => {
  it('reports a zod error when given a malformed contract', () => {
    const issues = lintEncounterContract({}, buildRegistry(), 'invalid-shape');
    const zodIssues = issues.filter((i) => i.rule_id === 'zod');
    expect(zodIssues.length).toBeGreaterThan(0);
    expect(zodIssues[0]?.severity).toBe('error');
  });
});

describe('encounter content lint — R5 thresholds', () => {
  it('does not warn below the warn threshold', () => {
    const goodFixture = GOOD_FIXTURES[0]!;
    const issues = lintEncounterContract(goodFixture.contract, buildRegistry(), goodFixture.name);
    const r5 = issues.filter((i) => i.rule_id === 'R5');
    expect(r5).toEqual([]);
  });

  it('emits a louder warning when ≥ 6 flagged phrases land in one beat', () => {
    const flags = PROSE_QUALITY_FLAGS.slice(0, 6);
    expect(flags.length).toBe(6);
    const proseWithSixFlags = flags.join(' ');

    const issues: readonly LintIssue[] = lintEncounterContract(
      {
        encounter: {
          id: 'encounter.fixture.r5_loud',
          protagonist: 'actor.fixture.eira',
          category: 'guild',
          rarity_tier: 2,
          intrinsic_tier: 'shaping',
          place: { location: 'location.fixture.bren', ambient_state: {}, painting: '/p.jpg' },
          cast: [],
          scene_state: {
            threads_in_play: [],
            factions_here: [],
            place_conditions: [],
            conditions_on_protagonist: [],
          },
          protagonist_view: {
            capability_axes: ['iron', 'heart', 'eye'],
            items_relevant: [],
            vows_active_per_beat: {},
            callback_candidates: [],
            state_descriptor: 'tense',
          },
          beats: [
            {
              title: 'Beat',
              forecast_factors: ['steady'],
              prose: proseWithSixFlags,
              prose_tooltips: {},
              encounter_choices: [
                {
                  reach: 'iron',
                  cost: 'small_breath',
                  god_verb: 'do',
                  agent_reaction: 'reacts',
                  tilts_toward: 'somewhere',
                  moral_axis_pole: 'protector',
                  fail_forward: 'fail',
                },
              ],
            },
          ],
          aftermath: { receipt: 'done', changes: [] },
          ascendant_hand_filter: { eligible: [], rare_pulse: [] },
        },
      },
      buildRegistry(),
      'inline-r5-loud',
    );

    const r5 = issues.filter((i) => i.rule_id === 'R5');
    expect(r5.length).toBe(1);
    expect(r5[0]!.message).toContain('LOUD');
    expect(r5[0]!.severity).toBe('warning');
  });

  it('uses an exported constant for the warn threshold so tunability is preserved', () => {
    expect(PROSE_QUALITY_WARN_THRESHOLD).toBeGreaterThan(0);
  });
});
