/**
 * Doom Content Package — Stage names and thresholds for the doom clock.
 *
 * ═══════════════════════════════════════════════════════════════════
 * CONTENT MANAGER: This is the file you edit to change doom archetype
 * names, stage progression, and escalation thresholds.
 * ═══════════════════════════════════════════════════════════════════
 */
import type { DoomClockArchetype } from '../types/doomClock';

/** Default stage thresholds (fraction of total ticks) */
export const DEFAULT_THRESHOLDS = [0.20, 0.40, 0.60, 0.80, 1.0];

/** Archetype-specific stage names */
export const ARCHETYPE_STAGE_NAMES: Record<DoomClockArchetype, [string, string, string, string, string]> = {
  breach:       ['Strange Whispers', 'Reality Cracks', 'The Thinning', 'Barriers Fail', 'The Breach'],
  convergence:  ['Distant Pull', 'Gathering Forces', 'The Drawing', 'Convergence Point', 'The Singularity'],
  changing:     ['Old Winds Die', 'New Powers Stir', 'The Turning', 'Power Shifts', 'The New Order'],
  sundering:    ['Hairline Fractures', 'Tremors', 'The Splitting', 'Lands Drift', 'The Sundering'],
  failing:      ['Waning Light', 'Creeping Entropy', 'The Dimming', 'Collapse Begins', 'The Failing'],
  ascension:    ['Mortal Spark', 'Growing Power', 'Threshold Nears', 'Divine Trial', 'The Ascension'],
  reckoning:    ['Old Debts Surface', 'Witnesses Gather', 'The Accounting', 'Judgment Begins', 'The Reckoning'],
};
