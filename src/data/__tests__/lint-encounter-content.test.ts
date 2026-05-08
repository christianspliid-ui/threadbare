import { describe, expect, it } from 'vitest';
import {
  BAD_ENCOUNTER_CONTENT_LINT_FIXTURES,
  GOOD_ENCOUNTER_CONTENT_LINT_FIXTURES,
} from '../__fixtures__/encounter-content-lint';
import { runEncounterContentLint } from '../../../scripts/lint-encounter-content';

describe('lint-encounter-content', () => {
  it('good fixture corpus passes with zero errors and zero warnings', () => {
    const result = runEncounterContentLint('good');
    expect(result.summary.contractCount).toBe(GOOD_ENCOUNTER_CONTENT_LINT_FIXTURES.length);
    expect(result.summary.errorCount).toBe(0);
    expect(result.summary.warningCount).toBe(0);
  });

  it('digit fixture fails only R3', () => {
    const result = runEncounterContentLint('bad:forecast-with-digit');
    expect(result.summary.errorCount).toBe(1);
    expect(result.issues.map((issue) => issue.ruleId)).toEqual(['R3']);
  });

  it('probability-word fixture fails only R4', () => {
    const result = runEncounterContentLint('bad:forecast-with-probability-word');
    expect(result.summary.errorCount).toBe(1);
    expect(result.issues.map((issue) => issue.ruleId)).toEqual(['R4']);
  });

  it('dangling-tooltip fixture fails only R1', () => {
    const result = runEncounterContentLint('bad:dangling-tooltip');
    expect(result.summary.errorCount).toBe(1);
    expect(result.issues.map((issue) => issue.ruleId)).toEqual(['R1']);
  });

  it('missing-consumes-item fixture fails only R2', () => {
    const result = runEncounterContentLint('bad:missing-consumes-item');
    expect(result.summary.errorCount).toBe(1);
    expect(result.issues.map((issue) => issue.ruleId)).toEqual(['R2']);
  });

  it('flowery-prose fixture emits only an R5 warning', () => {
    const result = runEncounterContentLint('bad:flowery-prose');
    expect(result.summary.errorCount).toBe(0);
    expect(result.summary.warningCount).toBe(1);
    expect(result.issues.map((issue) => issue.ruleId)).toEqual(['R5']);
    expect(result.issues[0].message).toContain('(high)');
  });

  it('all bad fixtures are represented in the fixture index', () => {
    const names = BAD_ENCOUNTER_CONTENT_LINT_FIXTURES.map((fixture) => fixture.name).sort();
    expect(names).toEqual([
      'dangling-tooltip',
      'flowery-prose',
      'forecast-with-digit',
      'forecast-with-probability-word',
      'missing-consumes-item',
    ]);
  });

  it('unified action template corpus plus good fixtures has no blocking errors', () => {
    const result = runEncounterContentLint('templates-and-good');
    expect(result.summary.contractCount).toBeGreaterThan(GOOD_ENCOUNTER_CONTENT_LINT_FIXTURES.length);
    expect(result.summary.errorCount).toBe(0);
  });
});
