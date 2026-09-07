/**
 * Reading a mortal's mind — the constants behind `canReadIntention` (THR-1433).
 *
 * The familiarity tier itself lives beside its siblings in
 * `src/types/agentKnowledge.ts` (`INTENTION_KNOWLEDGE_TIER`). What is here is the
 * two things a *mortal's* work adds to the god's reading: how far a followed
 * network's people can see, and which work is kept from the god's own eyes.
 */

import { RING_REACH_HEXES } from './strategic-action-constants';

/**
 * How near a followed network's living member must stand to a mortal for the god
 * to read that mortal through the network — the same reach a ring recruits, watches
 * and marks at (THR-1430's `RING_REACH_HEXES`), by construction one number: a ring
 * that can mark a man can tell its patron what he is about.
 */
export const NETWORK_READ_REACH_HEXES = RING_REACH_HEXES;

/**
 * Cells whose intention is a **secret**: readable only through a mark or a network,
 * never through familiarity alone. Knowing a man well does not tell you he is
 * planning a murder; his enemy's spy does. Initially the plot (THR-1430's
 * `destroy × Mortal`). A cell override (`cell.destroy.mortal.<slug>`) inherits its
 * base cell's secrecy — the match is by prefix on the cell id.
 */
export const SECRET_CELL_IDS: readonly string[] = ['cell.destroy.mortal'];
