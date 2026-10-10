/**
 * SeatLine — "Seat: <settlement>" on the god's bar (THR-1792).
 *
 * Warm round 1 accepted "Take the Seat" and could not say where the seat was: after the
 * placement toast nothing on screen named it. This line names it once the Seat beat
 * has set `homeSeatLocationId` (nothing before), and the name centres the map on it.
 * The hover is the `ui.home_seat` registry entry — what a seat is, no numbers (Laws 13, 17).
 */
import React from 'react';
import { Tooltip } from '../../shared/Tooltip';
import { HOME_SEAT_LABEL } from '../../../data/ascendant-bar-content';
import type { HomeSeatView } from './selectors';
import styles from './styles.module.css';

interface SeatLineProps {
  seat: HomeSeatView | null;
  /** Centre the map on the seat's place-tier location. */
  onCenter?: (locationId: string) => void;
}

export function SeatLine({ seat, onCenter }: SeatLineProps) {
  if (!seat) return null;
  return (
    <div className={styles.seatLine} data-testid="ascendant-bar-seat">
      <Tooltip id="ui.home_seat" focusable={false}>
        <span>{HOME_SEAT_LABEL}:</span>
      </Tooltip>
      <button
        type="button"
        className={styles.seatLink}
        onClick={() => onCenter?.(seat.locationId)}
        aria-label={`${HOME_SEAT_LABEL}: ${seat.name} — show on the map`}
      >
        {seat.name}
      </button>
    </div>
  );
}
