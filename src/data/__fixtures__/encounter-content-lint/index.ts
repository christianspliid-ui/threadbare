import type { EncounterContract } from '../../../types/encounter-contract';
import type { LintRuleId } from '../../encounter-content-lint';

import fullValid from './good/full-valid';
import badForecastDigit from './bad/forecast-with-digit';
import badForecastProb from './bad/forecast-with-probability-word';
import badDanglingTooltip from './bad/dangling-tooltip';
import badMissingConsumesItem from './bad/missing-consumes-item';
import badFloweryProse from './bad/flowery-prose';

export interface GoodFixture {
  readonly name: string;
  readonly contract: EncounterContract;
}

export interface BadFixture {
  readonly name: string;
  readonly expectedRuleId: LintRuleId;
  readonly expectedSeverity: 'error' | 'warning';
  readonly contract: EncounterContract;
}

export const GOOD_FIXTURES: readonly GoodFixture[] = [
  { name: 'good/full-valid.ts', contract: fullValid },
];

export const BAD_FIXTURES: readonly BadFixture[] = [
  {
    name: 'bad/forecast-with-digit.ts',
    expectedRuleId: 'R3',
    expectedSeverity: 'error',
    contract: badForecastDigit,
  },
  {
    name: 'bad/forecast-with-probability-word.ts',
    expectedRuleId: 'R4',
    expectedSeverity: 'error',
    contract: badForecastProb,
  },
  {
    name: 'bad/dangling-tooltip.ts',
    expectedRuleId: 'R1',
    expectedSeverity: 'error',
    contract: badDanglingTooltip,
  },
  {
    name: 'bad/missing-consumes-item.ts',
    expectedRuleId: 'R2',
    expectedSeverity: 'error',
    contract: badMissingConsumesItem,
  },
  {
    name: 'bad/flowery-prose.ts',
    expectedRuleId: 'R5',
    expectedSeverity: 'warning',
    contract: badFloweryProse,
  },
];

/**
 * IDs the good fixture references — used by tests to construct a registry that
 * resolves R1/R2 cleanly. Real CLI runs use world-model.json + a scanned
 * `id:` literal index, but a hand-curated set is sufficient for unit tests.
 */
export const GOOD_FIXTURE_REGISTRY_IDS: readonly string[] = [
  'foundation.order',
  'magic.fire',
];
