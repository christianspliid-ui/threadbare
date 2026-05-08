import type { EncounterContract } from '../../../../types/encounter-contract';
import FULL_VALID_ENCOUNTER_CONTRACT from '../good/full-valid';

const MISSING_CONSUMES_ITEM_FIXTURE: EncounterContract = {
  encounter: {
    ...FULL_VALID_ENCOUNTER_CONTRACT.encounter,
    id: 'encounter.fixture.bad.missing_consumes_item',
    protagonist_view: {
      ...FULL_VALID_ENCOUNTER_CONTRACT.encounter.protagonist_view,
      items_relevant: [],
    },
    beats: FULL_VALID_ENCOUNTER_CONTRACT.encounter.beats.map((beat, beatIndex) =>
      beatIndex === 0
        ? {
            ...beat,
            encounter_choices: beat.encounter_choices.map((choice, choiceIndex) =>
              choiceIndex === 0
                ? {
                    ...choice,
                    consumes_item: 'item.fixture.missing',
                  }
                : choice,
            ),
          }
        : beat,
    ),
  },
};

export default MISSING_CONSUMES_ITEM_FIXTURE;
