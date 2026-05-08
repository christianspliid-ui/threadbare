import type { EncounterContract } from '../../../types/encounter-contract';
import DANGLING_TOOLTIP_FIXTURE from './bad/dangling-tooltip';
import FLOWERY_PROSE_FIXTURE from './bad/flowery-prose';
import FORECAST_WITH_DIGIT_FIXTURE from './bad/forecast-with-digit';
import FORECAST_WITH_PROBABILITY_WORD_FIXTURE from './bad/forecast-with-probability-word';
import MISSING_CONSUMES_ITEM_FIXTURE from './bad/missing-consumes-item';
import FULL_VALID_ENCOUNTER_CONTRACT from './good/full-valid';

export interface EncounterContentLintFixture {
  readonly name: string;
  readonly source: string;
  readonly contract: EncounterContract;
}

export const GOOD_ENCOUNTER_CONTENT_LINT_FIXTURES: readonly EncounterContentLintFixture[] = [
  {
    name: 'full-valid',
    source: 'fixture:good/full-valid',
    contract: FULL_VALID_ENCOUNTER_CONTRACT,
  },
];

export const BAD_ENCOUNTER_CONTENT_LINT_FIXTURES: readonly EncounterContentLintFixture[] = [
  {
    name: 'forecast-with-digit',
    source: 'fixture:bad/forecast-with-digit',
    contract: FORECAST_WITH_DIGIT_FIXTURE,
  },
  {
    name: 'forecast-with-probability-word',
    source: 'fixture:bad/forecast-with-probability-word',
    contract: FORECAST_WITH_PROBABILITY_WORD_FIXTURE,
  },
  {
    name: 'dangling-tooltip',
    source: 'fixture:bad/dangling-tooltip',
    contract: DANGLING_TOOLTIP_FIXTURE,
  },
  {
    name: 'missing-consumes-item',
    source: 'fixture:bad/missing-consumes-item',
    contract: MISSING_CONSUMES_ITEM_FIXTURE,
  },
  {
    name: 'flowery-prose',
    source: 'fixture:bad/flowery-prose',
    contract: FLOWERY_PROSE_FIXTURE,
  },
];
