/**
 * Phrase pools for same-hex same-tick agent_encounter aggregation (THR-456).
 *
 * Phrases categorised by crowd size:
 *   small  = 3–4 agents in the group
 *   medium = 5–9 agents
 *   large  = 10+ agents
 *
 * Each entry carries a stable `phraseId` for content-lint coverage and for the
 * repetition-guard mechanism.  Use `{location}` for the location name and `{n}`
 * for the numeric group size.
 */

export const AGGREGATE_PHRASE_POOL_MIN = 12;

export interface AggregatePhraseEntry {
  phraseId: string;
  template: string;
}

export const AGGREGATE_PHRASES_SMALL: AggregatePhraseEntry[] = [
  { phraseId: 'agg.small.01', template: 'Three travellers\' paths cross at {location}.' },
  { phraseId: 'agg.small.02', template: 'A small knot of wanderers gathers at {location}.' },
  { phraseId: 'agg.small.03', template: 'Four figures share the road at {location} for a moment.' },
  { phraseId: 'agg.small.04', template: 'A brief confluence of souls at {location} — {n} roads meeting.' },
  { phraseId: 'agg.small.05', template: 'The paths of {n} converge at {location}, then scatter.' },
  { phraseId: 'agg.small.06', template: 'A handful of travellers pause at {location}, then part.' },
];

export const AGGREGATE_PHRASES_MEDIUM: AggregatePhraseEntry[] = [
  { phraseId: 'agg.medium.01', template: 'Seven travellers cross paths at {location}.' },
  { phraseId: 'agg.medium.02', template: 'A throng gathers at {location}.' },
  { phraseId: 'agg.medium.03', template: 'Roads converge at {location}: {n} witnesses cross.' },
  { phraseId: 'agg.medium.04', template: '{n} souls find themselves at {location} at once.' },
  { phraseId: 'agg.medium.05', template: 'A crowd of {n} swells briefly at {location}.' },
  { phraseId: 'agg.medium.06', template: 'The crossroads at {location} draws {n} together.' },
  { phraseId: 'agg.medium.07', template: '{n} paths tangle and untangle at {location}.' },
];

export const AGGREGATE_PHRASES_LARGE: AggregatePhraseEntry[] = [
  { phraseId: 'agg.large.01', template: 'A crowd swells at {location}.' },
  { phraseId: 'agg.large.02', template: '{location} draws {n} souls into its orbit.' },
  { phraseId: 'agg.large.03', template: 'The trails of many converge at {location}.' },
  { phraseId: 'agg.large.04', template: '{n} travellers are bound together briefly at {location}.' },
  { phraseId: 'agg.large.05', template: 'A great confluence of {n} forms and dissolves at {location}.' },
  { phraseId: 'agg.large.06', template: '{location} becomes, for a moment, the centre of {n} separate worlds.' },
];

export const ALL_AGGREGATE_PHRASES: AggregatePhraseEntry[] = [
  ...AGGREGATE_PHRASES_SMALL,
  ...AGGREGATE_PHRASES_MEDIUM,
  ...AGGREGATE_PHRASES_LARGE,
];

export type AggregateCrowdSize = 'small' | 'medium' | 'large';

export function getAggregatePhrasePool(size: AggregateCrowdSize): AggregatePhraseEntry[] {
  switch (size) {
    case 'small':  return AGGREGATE_PHRASES_SMALL;
    case 'medium': return AGGREGATE_PHRASES_MEDIUM;
    case 'large':  return AGGREGATE_PHRASES_LARGE;
  }
}

export function crowdSizeCategory(n: number): AggregateCrowdSize {
  if (n <= 4) return 'small';
  if (n <= 9) return 'medium';
  return 'large';
}
