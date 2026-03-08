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

/** Doom stage vocabulary — darkening word banks from whispers to unmaking */
export interface DoomVocabulary {
  adjectives: string[];
  verbs: string[];
  nouns: string[];
  atmosphere: string;
}

export const DOOM_VOCABULARY: Record<string, DoomVocabulary> = {
  whispers: {
    adjectives: ['faint', 'distant', 'strange', 'subtle', 'eerie'],
    verbs: ['whisper', 'drift', 'echo', 'stir', 'murmur'],
    nouns: ['breeze', 'shadow', 'rumor'],
    atmosphere: 'Something stirs at the edge of perception.',
  },
  signs: {
    adjectives: ['unsettling', 'wrong', 'ominous', 'twisted', 'broken'],
    verbs: ['crack', 'warp', 'unravel', 'seep', 'pulse'],
    nouns: ['fracture', 'void', 'corruption'],
    atmosphere: 'The world shows its terrible true face.',
  },
  tremors: {
    adjectives: ['violent', 'jagged', 'bleeding', 'fractured', 'howling'],
    verbs: ['shatter', 'writhe', 'scream', 'devour', 'collapse'],
    nouns: ['rift', 'abyss', 'agony'],
    atmosphere: 'Reality tears open and the abyss bleeds through.',
  },
  cracks: {
    adjectives: ['desperate', 'hollow', 'suffocating', 'withered', 'fevered'],
    verbs: ['consume', 'drown', 'choke', 'burn', 'dissolve'],
    nouns: ['ruin', 'despair', 'oblivion'],
    atmosphere: 'Existence trembles on the knife-edge of unmade.',
  },
  the_breaking: {
    adjectives: ['sundered', 'corrupted', 'forsaken', 'cursed', 'damned'],
    verbs: ['annihilate', 'unmake', 'obliterate', 'incinerate', 'erase'],
    nouns: ['calamity', 'cataclysm', 'desolation'],
    atmosphere: 'All bonds shatter as the world enters its final throes.',
  },
  the_breach: {
    adjectives: ['absolute', 'irreversible', 'infinite', 'merciless', 'inexorable'],
    verbs: ['devour', 'render', 'shred', 'swallow', 'consume'],
    nouns: ['annihilation', 'void', 'extinction'],
    atmosphere: 'The boundaries between worlds collapse into terrible union.',
  },
  the_unmaking: {
    adjectives: ['absolute', 'primordial', 'boundless', 'eternal', 'final'],
    verbs: ['unmake', 'dissolve', 'cease', 'fade', 'return'],
    nouns: ['nothingness', 'silence', 'the void'],
    atmosphere: 'All things return to the undifferentiated dark from which they came.',
  },
};
