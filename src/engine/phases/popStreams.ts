/**
 * Phase descriptor: pop_streams (THR-238 Land 3).
 *
 * Place-of-Power passive essence + decay. Last phase in the post-economy
 * cluster before pre-lifecycle fires.
 *
 * Order: after `delve_emergence` (matches the inline sequence).
 */
import type { EnginePhase } from '../phaseRegistry';
import { phasePlaceOfPowerStreams } from '../ruins/placeOfPowerStreams';

export const popStreamsPhase: EnginePhase = {
  id: 'pop_streams',
  slot: 'post-economy',
  afterPhase: ['delve_emergence'],
  run: (state) => phasePlaceOfPowerStreams(state),
};
