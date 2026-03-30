/**
 * Doom Loader — imports, validates, and re-exports doom clock content from JSON files.
 *
 * Consumers import DEFAULT_THRESHOLDS, ARCHETYPE_STAGE_NAMES, and DOOM_VOCABULARY
 * from doom-content.ts, which delegates to this loader. This file is infrastructure.
 */

import type { DoomClockArchetype } from '../types/doomClock';
import { DOOM_CLOCK_ARCHETYPES } from '../types/doomClock';

// ─── JSON Imports ───────────────────────────────────────────────────
import breach from './doom/breach.json';
import convergence from './doom/convergence.json';
import changing from './doom/changing.json';
import sundering from './doom/sundering.json';
import failing from './doom/failing.json';
import ascension from './doom/ascension.json';
import reckoning from './doom/reckoning.json';
import vocabularyJson from './doom/vocabulary.json';

// ─── Types ──────────────────────────────────────────────────────────

/** JSON shape for each archetype file */
export interface DoomArchetypeJsonShape {
  archetype: string;
  description: string;
  stageNames: string[];
  thresholds: number[];
}

/** JSON shape for vocabulary file */
export interface DoomVocabularyEntry {
  adjectives: string[];
  verbs: string[];
  nouns: string[];
  atmosphere: string;
}

// ─── Constants ──────────────────────────────────────────────────────

const VALID_ARCHETYPES = new Set<string>(DOOM_CLOCK_ARCHETYPES);
const VALID_VOCABULARY_STAGES = ['whispers', 'signs', 'tremors', 'cracks', 'the_breaking', 'the_breach', 'the_unmaking'];

// ─── Validation ─────────────────────────────────────────────────────

export function validateArchetypeJson(raw: unknown, filename: string): {
  archetype: DoomClockArchetype;
  description: string;
  stageNames: [string, string, string, string, string];
  thresholds: [number, number, number, number, number];
} {
  const data = raw as DoomArchetypeJsonShape;

  // Archetype name
  if (!data.archetype || !VALID_ARCHETYPES.has(data.archetype)) {
    throw new Error(`${filename}: invalid archetype '${data.archetype}'`);
  }

  // Description
  if (!data.description || typeof data.description !== 'string') {
    throw new Error(`${filename}: missing 'description'`);
  }

  // Stage names
  if (!Array.isArray(data.stageNames) || data.stageNames.length !== 5) {
    throw new Error(`${filename}: must have exactly 5 stage names, got ${data.stageNames?.length ?? 0}`);
  }
  for (const name of data.stageNames) {
    if (!name || typeof name !== 'string') {
      throw new Error(`${filename}: stage names must be non-empty strings`);
    }
  }

  // Thresholds
  if (!Array.isArray(data.thresholds) || data.thresholds.length !== 5) {
    throw new Error(`${filename}: must have exactly 5 thresholds, got ${data.thresholds?.length ?? 0}`);
  }
  for (let i = 1; i < data.thresholds.length; i++) {
    if (data.thresholds[i] <= data.thresholds[i - 1]) {
      throw new Error(`${filename}: thresholds must be monotonically increasing`);
    }
  }
  if (data.thresholds[4] !== 1.0) {
    throw new Error(`${filename}: thresholds must end at 1.0, got ${data.thresholds[4]}`);
  }

  return {
    archetype: data.archetype as DoomClockArchetype,
    description: data.description,
    stageNames: data.stageNames as [string, string, string, string, string],
    thresholds: data.thresholds as [number, number, number, number, number],
  };
}

function validateVocabularyJson(raw: unknown, filename: string): Record<string, DoomVocabularyEntry> {
  const data = raw as Record<string, DoomVocabularyEntry>;

  for (const key of VALID_VOCABULARY_STAGES) {
    if (!data[key]) {
      throw new Error(`${filename}: missing vocabulary stage '${key}'`);
    }
    const entry = data[key];
    if (!Array.isArray(entry.adjectives) || entry.adjectives.length < 3) {
      throw new Error(`${filename}: stage '${key}' must have at least 3 adjectives`);
    }
    if (!Array.isArray(entry.verbs) || entry.verbs.length < 3) {
      throw new Error(`${filename}: stage '${key}' must have at least 3 verbs`);
    }
    if (!Array.isArray(entry.nouns) || entry.nouns.length < 3) {
      throw new Error(`${filename}: stage '${key}' must have at least 3 nouns`);
    }
    if (!entry.atmosphere || typeof entry.atmosphere !== 'string') {
      throw new Error(`${filename}: stage '${key}' missing atmosphere string`);
    }
  }

  return data;
}

// ─── Raw Data Registry ──────────────────────────────────────────────

const RAW_ARCHETYPES: Array<{ data: unknown; filename: string }> = [
  { data: breach, filename: 'breach.json' },
  { data: convergence, filename: 'convergence.json' },
  { data: changing, filename: 'changing.json' },
  { data: sundering, filename: 'sundering.json' },
  { data: failing, filename: 'failing.json' },
  { data: ascension, filename: 'ascension.json' },
  { data: reckoning, filename: 'reckoning.json' },
];

// ─── Public Loaders ─────────────────────────────────────────────────

/** Load and validate archetype stage names from JSON files. */
export function loadArchetypeStageNames(): Record<DoomClockArchetype, [string, string, string, string, string]> {
  const result = {} as Record<DoomClockArchetype, [string, string, string, string, string]>;
  for (const { data, filename } of RAW_ARCHETYPES) {
    const validated = validateArchetypeJson(data, filename);
    result[validated.archetype] = validated.stageNames;
  }
  return result;
}

/** Load default thresholds from the first archetype file (all share the same defaults). */
export function loadDefaultThresholds(): [number, number, number, number, number] {
  const validated = validateArchetypeJson(RAW_ARCHETYPES[0].data, RAW_ARCHETYPES[0].filename);
  return validated.thresholds;
}

/** Load and validate doom vocabulary from vocabulary.json. */
export function loadDoomVocabulary(): Record<string, DoomVocabularyEntry> {
  return validateVocabularyJson(vocabularyJson, 'vocabulary.json');
}
