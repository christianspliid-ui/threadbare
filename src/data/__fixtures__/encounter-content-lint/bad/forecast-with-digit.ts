import type { EncounterContract } from '../../../../types/encounter-contract';
import FULL_VALID_ENCOUNTER_CONTRACT from '../good/full-valid';

const FORECAST_WITH_DIGIT_FIXTURE: EncounterContract = {
  encounter: {
    ...FULL_VALID_ENCOUNTER_CONTRACT.encounter,
    id: 'encounter.fixture.bad.forecast_with_digit',
    beats: FULL_VALID_ENCOUNTER_CONTRACT.encounter.beats.map((beat, beatIndex) =>
      beatIndex === 0
        ? {
            ...beat,
            forecast_factors: ['2 lanterns gutter as the crowd leans in', beat.forecast_factors[1]],
          }
        : beat,
    ),
  },
};

export default FORECAST_WITH_DIGIT_FIXTURE;
