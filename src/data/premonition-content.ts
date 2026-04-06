/**
 * Premonition Prose Content — template pools for Whisper and Compulsion vignettes.
 *
 * Keyed by (nudge category, ambition category, quintessence tier).
 * Selected by seeded PRNG at generation time.
 *
 * Placeholders: {name}, {possessive}, {pronoun}, {reachName}, {sphereName},
 *   {locationName}, {encounterName}, {encounterHook}
 *
 * @see Docs/plans/2026-04-04-divine-premonition-design.md
 */

import type { WhisperNudgeCategory } from '../types/premonition';
import type { EncounterType } from '../types/encounter';
import type { ReachDomain } from '../types/traits';

// ─── Quintessence Tiers ─────────────────────────────────────────

export type QuintessenceProseTier = 'healthy' | 'moderate' | 'strained' | 'critical';

export function getQuintessenceProseTier(q: number): QuintessenceProseTier {
  if (q > 0.8) return 'healthy';
  if (q > 0.5) return 'moderate';
  if (q > 0.25) return 'strained';
  return 'critical';
}

// ─── Ambition Categories ────────────────────────────────────────

export type AmbitionProseCategory =
  | 'dominion' | 'mastery' | 'vengeance' | 'legacy'
  | 'survival' | 'discovery' | 'devotion' | 'generic';

// ─── Whisper Vignette Templates ─────────────────────────────────

/** Vignette templates for the Whisper modal header. Keyed by quintessence tier. */
export const WHISPER_VIGNETTE_TEMPLATES: Record<QuintessenceProseTier, string[]> = {
  healthy: [
    'That night, {name} dreamed vividly — colors brighter than waking, sounds sharper than memory. Something stirred at the edge of {possessive} awareness.',
    'A restless energy moved through {name} as {pronoun} slept. The thread hummed faintly, carrying echoes of paths not yet taken.',
    '{name} woke before dawn, {possessive} mind alive with half-remembered images. The world felt full of possibility.',
  ],
  moderate: [
    '{name} dreamed, though the edges were soft and indistinct. Shapes moved in the dark behind {possessive} eyes — not quite clear, not quite forgotten.',
    'Sleep came unevenly to {name}. Between the quiet hours, something flickered — a sense of direction, faint but persistent.',
    'A dream visited {name}, muted but insistent. {pronoun} could not recall the details, only the feeling: a pull, gentle as a current.',
  ],
  strained: [
    '{name} slept fitfully. The dreams came in fragments — a face half-seen, a road that split and split again. The weariness went deeper than bones.',
    'The thread trembled faintly as {name} drifted in and out of consciousness. The dreams were thin, worn through like old cloth.',
    '{name} dreamed of fog. Everything was muffled, uncertain. But through the grey, one shape persisted — insistent, barely visible.',
  ],
  critical: [
    '{name} shivered in {possessive} sleep. The dreams were dark and formless — dissolution pressed close, and the thread itself flickered like a guttering candle.',
    'What passed for sleep was more absence than rest. {name} floated in the dark, barely tethered. A single thread of intent was all that held {pronoun} to the world.',
    'The dream was not a dream but a void. {name} felt {possessive} edges fraying. Yet even here, at the threshold of dissolution, something whispered.',
  ],
};

// ─── Whisper Nudge Prose Templates ──────────────────────────────

/** Nudge label and flavor templates, keyed by category. */
export const WHISPER_NUDGE_TEMPLATES: Record<WhisperNudgeCategory, {
  labels: string[];
  flavors: string[];
}> = {
  reach_bias: {
    labels: [
      'Seek the path of {reachName}',
      'Turn toward {reachName}',
      'The way of {reachName} calls',
    ],
    flavors: [
      '{possessive} hands remember — muscle and memory, older than thought.',
      'An itch at the back of {possessive} mind. Something unfinished.',
      'The world leans toward {reachName}, and {name} leans with it.',
    ],
  },
  sphere_bias: {
    labels: [
      'Draw from {sphereName}\'s well',
      'The current of {sphereName} beckons',
      'Attune to {sphereName}',
    ],
    flavors: [
      'A resonance hums through the thread — {sphereName} is close, and growing closer.',
      'The cosmos shifts. {sphereName} rises in the wheel.',
      '{name} feels the pull of something vast and old.',
    ],
  },
  ambition_drift: {
    labels: [
      'Your destiny lies elsewhere',
      'This road has run its course',
      'The old purpose thins',
    ],
    flavors: [
      'A restlessness has taken root. The old purpose feels thin, worn through like cloth too long in the sun.',
      'What once burned bright now merely smolders. Perhaps there is a different fire to tend.',
      '{name} has walked this road too long unchanged. The horizon shifts.',
    ],
  },
  gather_strength: {
    labels: [
      'Rest. Recover. You are not yet whole.',
      'Mend what has been spent',
      'Still yourself. Gather what remains.',
    ],
    flavors: [
      '{name} felt the weariness in {possessive} bones — a weight beyond fatigue, as though the world itself pressed down.',
      'The body knows what the mind denies. {pronoun} needs stillness.',
      'Even the thread grows taut when pulled too hard. Slack is not surrender.',
    ],
  },
  gather_courage: {
    labels: [
      'You were meant for greater trials',
      'Do not shrink from what awaits',
      'Rise. The world will not wait for the cautious.',
    ],
    flavors: [
      'Something larger looms on the horizon. {name} has been circling it, avoiding it. Not forever.',
      'The safe paths grow stale. {name} was not made for timidity.',
      'Fear is a compass, not a wall. It points toward what matters.',
    ],
  },
};

// ─── Ambition Dream Imagery ─────────────────────────────────────

/** Ambition-colored dream fragments that can be woven into vignettes. */
export const AMBITION_DREAM_IMAGERY: Record<AmbitionProseCategory, string[]> = {
  vengeance: [
    'In the dream, old wrongs flickered like embers — faces in firelight, sharp edges, debts unpaid.',
    'The taste of iron lingered when {pronoun} woke. Somewhere, a score remained unsettled.',
  ],
  legacy: [
    '{pronoun} dreamed of monuments — names carved deep in stone, crowds that remembered.',
    'A hall stretched before {pronoun}, lined with banners bearing {possessive} name. Not yet. But someday.',
  ],
  discovery: [
    'Doors appeared in the dream — one after another, each leading somewhere {pronoun} had never been.',
    'A map unfurled in {possessive} sleep, its edges blank. The unknown pulled like a tide.',
  ],
  dominion: [
    'Walls rose at {possessive} command. In the dream, the world bent and obeyed.',
    '{pronoun} dreamed of thrones — not inherited, but built. Stone by stone.',
  ],
  mastery: [
    'In the dream, {possessive} hands did not tremble. The strike was perfect, effortless, absolute.',
    'A single note rang in the dark — pure, sustained, beyond what waking hands could achieve.',
  ],
  devotion: [
    'Warmth moved through the dream like a current. Voices called — not in words, but in belonging.',
    'The thread was visible in the dream. Golden, humming, connecting {name} to something greater.',
  ],
  survival: [
    '{pronoun} dreamed of running — not from fear, but toward shelter. The horizon was clear.',
    'A fire in a stone ring. Walls against the wind. In {possessive} sleep, the world was small and safe.',
  ],
  generic: [
    'The dream was shapeless — not unpleasant, but without direction. A waiting.',
    'Something stirred in {possessive} sleep. Not a message, not a warning. Just... possibility.',
  ],
};

// ─── Compulsion Vignette Templates ──────────────────────────────

export const COMPULSION_VIGNETTE_TEMPLATES: Record<QuintessenceProseTier, string[]> = {
  healthy: [
    'You pull at the thread binding you to {name} and feel {possessive} mind turning. {Pronoun} stand at a crossroads, weighing paths forward. You could tip the balance — or let {pronoun} find {possessive} own way.',
    'The thread hums taut. Through it, you sense {name} deliberating — futures branching, narrowing. Your will could shape which path {pronoun} take.',
    'You reach through the thread and catch {name} mid-thought, turning over what comes next. The connection is strong. You could guide {possessive} hand.',
  ],
  moderate: [
    'You reach for {name} through the thinning thread. {Pronoun} are deliberating — you sense the weight of choices ahead. Your influence could still sway {pronoun}.',
    'The thread to {name} holds, though it strains. Through it you catch {pronoun} weighing {possessive} next move. You may still guide {pronoun} — carefully.',
  ],
  strained: [
    'The thread to {name} frays, but holds. Through it you glimpse {pronoun} wrestling with what comes next. You may have enough strength to guide {possessive} hand.',
    'A faltering connection — but enough. {name} is at a decision point, and through the fading thread, you sense {possessive} uncertainty. One nudge might be all you can manage.',
  ],
  critical: [
    'Barely a whisper of connection remains. But through it, you catch {name} at a decision point. One last nudge — if you can manage it.',
    'The thread is almost gone. Yet through the thinning dark, {name} hesitates — and in that hesitation, a sliver of divine will might still reach {pronoun}.',
  ],
};

// ─── Compulsion Retcon Prose System ─────────────────────────────

/**
 * Composable retcon prose: data-driven one-liners explaining why an agent
 * is considering an encounter. Composed from three fragments:
 *   [how they learned] + [what's pulling them] + [how confident they feel]
 */

// ── Distance bands ──

export const DISTANCE_BAND_NEAR = 0;
export const DISTANCE_BAND_SHORT = 2;
export const DISTANCE_BAND_MEDIUM = 5;

const RETCON_DISTANCE_FRAGMENTS: Record<string, string[]> = {
  here:   ['Right here,', 'Close at hand,', 'Nearby,'],
  short:  ['Not far off,', 'Just beyond the next ridge,', 'A short journey away,'],
  medium: ['Word has reached {pronoun} of', 'Rumours have drifted in —', 'Talk at the inn mentioned'],
  far:    ['From distant lands, news of', 'Far off, word has spread of', 'A traveller brought word of'],
  remote: ['Even from here,', 'Without needing to travel,', 'From where {pronoun} stand,'],
};

// ── Encounter type "desire" fragments ──

const RETCON_DESIRE_FRAGMENTS: Record<EncounterType, string[]> = {
  explore:  ['something unknown waits to be found', 'a mystery begs investigation', 'an uncharted place calls to {pronoun}'],
  duel:     ['a challenge demands an answer', 'someone stands in {possessive} way', 'a fight is brewing'],
  trade:    ['a deal could be struck', 'goods change hands if the price is right', 'riches ripe for the taking'],
  steal:    ['something valuable sits poorly guarded', 'an opportunity for the quick-fingered', 'someone else\'s fortune beckons'],
  assist:   ['someone needs {possessive} help', 'a task awaits willing hands', '{pronoun} could make a difference'],
  build:    ['something could be raised from nothing', 'raw materials and ambition align', 'the foundations of something new await'],
  hire:     ['a capable soul seeks a patron', 'loyalty is on offer', 'a willing blade awaits a purpose'],
  lead:     ['others look to {pronoun} for direction', 'a group needs someone to follow', 'leadership is called for'],
  acquire:  ['something of value is within reach', 'a prize sits waiting to be claimed', 'treasure ripe for the taking'],
  create:   ['an idea takes shape in {possessive} mind', 'the urge to make something stirs', 'inspiration strikes'],
};

// ── Confidence fragments (from threat rating) ──

const RETCON_CONFIDENCE_FRAGMENTS: Record<string, string[]> = {
  trivial:  ['— an easy prospect', '— hardly a challenge', '— child\'s play, really'],
  easy:     ['— and {pronoun} like {possessive} chances', '— a fair bet', '— well within {possessive} grasp'],
  moderate: ['— though it won\'t be simple', '— a real test', '— odds could go either way'],
  hard:     ['— a daunting prospect', '— {pronoun} are not sure {pronoun} are ready', '— it\'ll take everything {pronoun} have'],
  deadly:   ['— it could be the end of {pronoun}', '— only a fool would try', '— but the pull is strong, despite the danger'],
};

// ── Location suffix ──

const RETCON_LOCATION_FRAGMENTS = [
  ', at {locationName}',
  ', near {locationName}',
  ', in {locationName}',
];

// ── Compose function ──

export interface RetconInput {
  encounterType: EncounterType;
  reach: ReachDomain;
  threatRating: string;
  hexDistance: number;
  requiresPresence: boolean;
  locationName: string;
  agentName: string;
}

function pickFragment(pool: string[], rng: () => number): string {
  return pool[Math.floor(rng() * pool.length)];
}

function resolveRetconPronouns(text: string, name: string): string {
  return text
    .replace(/\{name\}/g, name)
    .replace(/\{possessive\}/g, 'their')
    .replace(/\{pronoun\}/g, 'they')
    .replace(/\{Pronoun\}/g, 'They');
}

export function composeRetconLine(rng: () => number, input: RetconInput): string {
  const { encounterType, threatRating, hexDistance: dist, requiresPresence, locationName, agentName } = input;

  // 1. Distance context
  let distanceKey: string;
  if (!requiresPresence) {
    distanceKey = 'remote';
  } else if (dist <= DISTANCE_BAND_NEAR) {
    distanceKey = 'here';
  } else if (dist <= DISTANCE_BAND_SHORT) {
    distanceKey = 'short';
  } else if (dist <= DISTANCE_BAND_MEDIUM) {
    distanceKey = 'medium';
  } else {
    distanceKey = 'far';
  }
  const distPool = RETCON_DISTANCE_FRAGMENTS[distanceKey] ?? RETCON_DISTANCE_FRAGMENTS.here;
  const distFragment = pickFragment(distPool, rng);

  // 2. Desire (encounter type)
  const desirePool = RETCON_DESIRE_FRAGMENTS[encounterType] ?? ['an opportunity presents itself'];
  const desireFragment = pickFragment(desirePool, rng);

  // 3. Confidence (threat rating)
  const confPool = RETCON_CONFIDENCE_FRAGMENTS[threatRating] ?? RETCON_CONFIDENCE_FRAGMENTS.moderate;
  const confFragment = pickFragment(confPool, rng);

  // 4. Location suffix (only for non-nearby encounters)
  let locationSuffix = '';
  if (dist > DISTANCE_BAND_NEAR && locationName && locationName !== 'unknown') {
    const locTemplate = pickFragment(RETCON_LOCATION_FRAGMENTS, rng);
    locationSuffix = locTemplate.replace(/\{locationName\}/g, locationName);
  }

  const raw = `${distFragment} ${desireFragment}${locationSuffix} ${confFragment}`;
  return resolveRetconPronouns(raw, agentName);
}

// ── Legacy export for backward compat (tests that reference it) ──
/** @deprecated Use composeRetconLine instead */
export const COMPULSION_ENCOUNTER_HOOKS: Record<string, string[]> = {
  iron:   ['Blood and iron — a reckoning that will not wait'],
  gold:   ['Coin and cleverness, weighed in the balance'],
  shadow: ['Secrets move beneath the surface'],
  veil:   ['The old ways stir — tradition and heresy entwined'],
  heart:  ['Loyalty tested, bonds forged or broken'],
  eye:    ['Perception sharpens. Something reveals itself.'],
  stone:  ['The land itself remembers'],
  star:   ['Fate turns on a single moment'],
};

// ─── Dismiss Prose ──────────────────────────────────────────────

export const WHISPER_DISMISS_PROSE = [
  'Let the dream fade',
  'The dream dissolves',
  'Let it pass',
];

export const COMPULSION_DISMISS_PROSE = [
  'Release your hold — let them choose',
  'Withdraw your will',
  'Step back from the thread',
];
