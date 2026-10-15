/**
 * The kinds each host has a case for (THR-1877 § D1). Kept apart from the hosts so a
 * Node test can read them without mounting React.
 *
 * Each list is typed to its home's kind union, so naming a kind of another home is a
 * type error. `homedSurfaces.test.ts` checks each list equals the home list's filter for
 * its home, so a kind added to `HOMED_SURFACES` without a host case fails there by name.
 * The order is the host's mount order, which is the DOM order the surfaces had before
 * (between equal z-bands the later one draws on top).
 */
import type { CeremonyHomedKind, DialogHomedKind, StageHomedKind } from '../../../data/homed-surfaces';

export const STAGE_HOST_KINDS: readonly StageHomedKind[] = [
  'emergence-dilemma',
  'encounter',
  'undertaking-moment',
  'journey-vignette',
  'story-beat',
  'premonition',
];

export const DIALOG_HOST_KINDS: readonly DialogHomedKind[] = [
  'divine-court',
  'warm-start',
  'chapter-ledger',
  'divine-receipt',
  'ascendant-beat',
  'event-popup',
  'choice-set',
];

export const CEREMONY_HOST_KINDS: readonly CeremonyHomedKind[] = [
  'cycle-harvest',
  'meet-the-first',
  'threading-rite',
];
