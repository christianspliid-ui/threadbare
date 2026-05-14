/**
 * Survey people-layer prose composer (THR-415).
 *
 * Pure, hex-scoped prose generator — does NOT touch proseEnrichment.ts.
 * Consumes survey-prose-tables.ts data tables for the first time.
 *
 * NFP compliance:
 *   #1 Tunability: all magic numbers are named constants from survey-prose-tables.ts
 *   #2 Inspectability: emits SurveyProseComposedTrace per call
 *   #3 Determinism: pure over graph snapshot + seeded rng; no Math.random
 *   #4 Fail-soft: missing data → graceful omission, never throws at call site
 */

import type { WorldGraph } from './graph';
import type { TickEvent } from '../types/gameState';
import type { SurveyProseComposedTrace } from '../types/trace';
import {
  POPULACE_MOOD_PHRASES,
  FACTION_PRESENCE_VERBS,
  SURVEY_LOCATION_DESCRIPTORS,
  SURVEY_PEOPLE_CONNECTIVES,
  POPULACE_MOOD_BUCKET_CALM_MAX,
  POPULACE_MOOD_BUCKET_RESTLESS_MAX,
  POPULACE_MOOD_BUCKET_AGITATED_MAX,
  UNREST_SCALE_MAX,
  FACTION_PRESENCE_DOMINANT_MIN,
  FACTION_PRESENCE_ACTIVE_MIN,
  SURVEY_FACTIONS_LISTED_CAP,
  SURVEY_FACTION_PRESENCE_MIN,
  SURVEY_EVENT_SIGNIFICANCE,
  type MoodBucket,
} from '../data/survey-prose-tables';
import { getHexFactions, getLocationsInHex } from './hexZoom';
import { emitTrace } from './traceBuffer';

let surveyEventCounter = 0;
export function resetSurveyEventCounter(): void { surveyEventCounter = 0; }

/**
 * Derive the populace mood bucket from per-location unrest on the hex.
 * Location unrest is on a 0–100 scale; bucket thresholds use 0–1.
 * Returns null when no locations exist (no people → no mood).
 */
export function deriveMoodBucket(graph: WorldGraph, col: number, row: number): MoodBucket | null {
  const locations = getLocationsInHex(graph, col, row);
  if (locations.length === 0) return null;

  let totalUnrest = 0;
  let counted = 0;
  for (const loc of locations) {
    const unrest = loc.properties?.unrest;
    if (typeof unrest === 'number') {
      totalUnrest += unrest;
      counted++;
    }
  }

  // If no locations carry unrest data, treat as 0 (calm) — a settled hex with no data is calm
  const avg = counted > 0 ? totalUnrest / counted : 0;
  const normalised = avg / UNREST_SCALE_MAX;

  if (normalised <= POPULACE_MOOD_BUCKET_CALM_MAX) return 'calm';
  if (normalised <= POPULACE_MOOD_BUCKET_RESTLESS_MAX) return 'restless';
  if (normalised <= POPULACE_MOOD_BUCKET_AGITATED_MAX) return 'agitated';
  return 'boiling';
}

/** Map a faction's locationCount on the hex to a presence tier. */
export function deriveFactionPresenceTier(locationCount: number): 'dominant' | 'active' | 'minor' {
  if (locationCount >= FACTION_PRESENCE_DOMINANT_MIN) return 'dominant';
  if (locationCount >= FACTION_PRESENCE_ACTIVE_MIN) return 'active';
  return 'minor';
}

/** Pick a random entry from an array using the provided seeded rng. Returns '' on empty array. */
function rngPick(arr: readonly string[], rng: () => number): string {
  if (arr.length === 0) return '';
  return arr[Math.floor(rng() * arr.length)];
}

/**
 * Compose the Survey people-layer prose band for a hex.
 * Pure: same (graph snapshot, col, row, rng-sequence) → same string.
 * Returns '' if no prose could be composed (fail-soft — caller skips the TickEvent).
 */
export function composeSurveyPeopleProse(
  graph: WorldGraph,
  col: number,
  row: number,
  rng: () => number,
  tick: number,
): string {
  const moodBucket = deriveMoodBucket(graph, col, row);
  const factions = getHexFactions(graph, col, row)
    .filter(f => f.locationCount >= SURVEY_FACTION_PRESENCE_MIN)
    .slice(0, SURVEY_FACTIONS_LISTED_CAP);

  // Compose mood sentence
  let moodSentence = '';
  if (moodBucket !== null) {
    const phrase = rngPick(POPULACE_MOOD_PHRASES[moodBucket], rng);
    if (phrase) moodSentence = phrase;
  }

  // Compose faction sentence — "{factionName} {verb} {locationDescriptor}"
  let factionSentence = '';
  if (factions.length > 0) {
    const clauses = factions.map(f => {
      const tier = deriveFactionPresenceTier(f.locationCount);
      const verb = rngPick(FACTION_PRESENCE_VERBS[tier], rng);
      const descriptor = rngPick(SURVEY_LOCATION_DESCRIPTORS, rng);
      return `${f.factionName} ${verb} ${descriptor}`;
    });

    if (clauses.length === 1) {
      factionSentence = clauses[0];
    } else {
      // Join first clause with connectives for the remainder
      let joined = clauses[0];
      for (let i = 1; i < clauses.length; i++) {
        const connective = rngPick(SURVEY_PEOPLE_CONNECTIVES, rng);
        const rest = clauses[i];
        // Capitalise continuation clause when connective ends with a space after punctuation
        const capitalise = connective.trimStart().startsWith('.');
        joined += connective + (capitalise ? rest.charAt(0).toUpperCase() + rest.slice(1) : rest);
      }
      factionSentence = joined;
    }
  }

  // Assemble band — mood then faction, each as its own sentence
  const parts: string[] = [];
  if (moodSentence) parts.push(moodSentence);
  if (factionSentence) parts.push(factionSentence);

  if (parts.length === 0) {
    emitTrace({
      category: 'revelation',
      type: 'survey_prose_composed',
      tick,
      hexCol: col,
      hexRow: row,
      moodBucket: 'none',
      factionCount: factions.length,
      composedLength: 0,
      summary: `survey prose skipped — no mood or faction data at (${col},${row})`,
    } as SurveyProseComposedTrace);
    return '';
  }

  // Join sentences: capitalise first letter, ensure terminal period
  const band = parts
    .map((p, i) => {
      const s = i === 0 ? p.charAt(0).toUpperCase() + p.slice(1) : p.charAt(0).toUpperCase() + p.slice(1);
      return s.endsWith('.') || s.endsWith('—') ? s : s + '.';
    })
    .join(' ');

  emitTrace({
    category: 'revelation',
    type: 'survey_prose_composed',
    tick,
    hexCol: col,
    hexRow: row,
    moodBucket: moodBucket ?? 'none',
    factionCount: factions.length,
    composedLength: band.length,
    summary: `survey prose composed at (${col},${row}): "${band.slice(0, 60)}${band.length > 60 ? '…' : ''}"`,
  } as SurveyProseComposedTrace);

  return band;
}

/** Build the survey_completed TickEvent carrying the composed prose band. */
export function buildSurveyCompletedTickEvent(
  band: string,
  col: number,
  row: number,
  tick: number,
): TickEvent {
  return {
    id: `evt_survey_${col}_${row}_${tick}_${++surveyEventCounter}`,
    tick,
    type: 'survey_completed',
    message: band,
    significance: SURVEY_EVENT_SIGNIFICANCE,
    hexCoords: { col, row },
    notification: { channel: 'toast', icon: 'revelation' },
  };
}
