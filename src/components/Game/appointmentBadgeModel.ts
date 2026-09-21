/**
 * Appointment badge model — the thread row's clock line (THR-1479).
 *
 * One line under a mortal's doing-line while they hold a live appointment:
 * *keeps a promise at the Crossroads · four days*. Words, never numbers (Laws
 * 13/14); the regime in the hover (*far off · leaning toward it · on the road ·
 * waiting there · lost to it*). Read straight off `pendingEncounterSeeds` — the
 * seed is the appointment's one record — so the row and the sheet cannot
 * disagree about the same meeting.
 */

import type { GameState } from '../../types/gameState';
import type { AxiologicalProfile } from '../../types/agent';
import { describeAppointments, APPOINTMENT_REGIME_WORDS, type AppointmentReadout } from '../../engine/appointments';
import { durationLabel } from '../../engine/aftermathWords';

export interface AppointmentBadgeModel {
  /** The clock line: `keeps a promise at <place> · <time in words>`. */
  readonly text: string;
  /** The hover: the seed's own label plus the regime word. */
  readonly desc: string;
  readonly placeId: string;
  readonly seedId: string;
  readonly readout: AppointmentReadout;
}

/** The clock line for one readout, in words. */
export function appointmentBadgeText(readout: AppointmentReadout, tick: number): string {
  const remaining = readout.dueTick - tick;
  const when = remaining <= 0 ? 'now' : `in ${durationLabel(remaining)}`;
  return readout.broken
    ? `broke a promise at ${readout.placeName}`
    : `keeps a promise at ${readout.placeName} · ${when}`;
}

/**
 * One badge per threaded mortal holding an appointment — their nearest-due one.
 * `profileFor` is the same resolver the decision phase uses, so the regime word
 * the hover shows is the regime the engine is acting on.
 */
export function buildAppointmentBadges(
  state: Pick<GameState, 'pendingEncounterSeeds' | 'graph' | 'tick'>,
  agentIds: readonly string[],
  profileFor: (agentId: string) => Pick<AxiologicalProfile, 'courage_prudence' | 'loyalty_ambition'>,
): Map<string, AppointmentBadgeModel> {
  const result = new Map<string, AppointmentBadgeModel>();
  if (!state.pendingEncounterSeeds || state.pendingEncounterSeeds.length === 0) return result;
  const wanted = new Set(agentIds);
  const readouts = describeAppointments(state, profileFor)
    .filter(r => wanted.has(r.agentId))
    .sort((a, b) => a.dueTick - b.dueTick || a.seedId.localeCompare(b.seedId));
  for (const readout of readouts) {
    if (result.has(readout.agentId)) continue;
    result.set(readout.agentId, {
      text: appointmentBadgeText(readout, state.tick),
      desc: `${readout.seedLabel} — ${APPOINTMENT_REGIME_WORDS[readout.regime]}`,
      placeId: readout.placeId,
      seedId: readout.seedId,
      readout,
    });
  }
  return result;
}
