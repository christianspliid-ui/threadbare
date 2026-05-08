import type { EncounterContract } from '../../../../types/encounter-contract';
import FULL_VALID_ENCOUNTER_CONTRACT from '../good/full-valid';

const FLOWERY_PROSE_FIXTURE: EncounterContract = {
  encounter: {
    ...FULL_VALID_ENCOUNTER_CONTRACT.encounter,
    id: 'encounter.fixture.bad.flowery_prose',
    beats: FULL_VALID_ENCOUNTER_CONTRACT.encounter.beats.map((beat, beatIndex) =>
      beatIndex === 0
        ? {
            ...beat,
            prose:
              'An inexorable, gossamer hush hangs over an ethereal square while a shimmering, transcendent oath is spoken.',
          }
        : beat,
    ),
    aftermath: {
      ...FULL_VALID_ENCOUNTER_CONTRACT.encounter.aftermath,
      receipt: 'The hand of destiny leaves a glittering mark on every witness.',
    },
  },
};

export default FLOWERY_PROSE_FIXTURE;
