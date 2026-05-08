import type { EncounterContract } from '../../../../types/encounter-contract';
import FULL_VALID_ENCOUNTER_CONTRACT from '../good/full-valid';

const DANGLING_TOOLTIP_FIXTURE: EncounterContract = {
  encounter: {
    ...FULL_VALID_ENCOUNTER_CONTRACT.encounter,
    id: 'encounter.fixture.bad.dangling_tooltip',
    beats: FULL_VALID_ENCOUNTER_CONTRACT.encounter.beats.map((beat, beatIndex) =>
      beatIndex === 0
        ? {
            ...beat,
            prose_tooltips: {
              broken_reference: 'unknown.graph.entity',
            },
          }
        : beat,
    ),
  },
};

export default DANGLING_TOOLTIP_FIXTURE;
