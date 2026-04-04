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
    'A certainty seized {name} — sudden as a blade, sure as sunrise. The world narrowed to a single point. {pronoun} could not say why, but {pronoun} *must* choose.',
    '{name} stood at the crossroads. Three paths stretched before {pronoun}, but one burned brighter than the rest — pulling like a tide that would not be refused.',
    'The thread tightened. {name} felt the full weight of divine attention settle upon {pronoun} — not a whisper this time, but a voice.',
  ],
  moderate: [
    'A pressure built behind {possessive} eyes. {name} felt the god\'s gaze, direct and unblinking. The choices lay before {pronoun}, and each one thrummed with consequence.',
    '{name} paused mid-step. Something vast and certain pressed against {possessive} will — not hostile, but unyielding. A direction. A demand.',
  ],
  strained: [
    'The compulsion came like a wave through tired bones. {name} swayed under the weight of it — the god\'s will, insistent even now, even weakened.',
    'Through the haze of exhaustion, a single thread of divine purpose remained. {name} grasped it, or it grasped {pronoun}.',
  ],
  critical: [
    'At the edge of dissolution, the god\'s command burned through like light through cracked glass. {name} barely had the strength to obey — but the thread demanded.',
    'The world was fraying. But through the fractures, one path blazed with borrowed certainty. {name} had no choice but to follow, or break entirely.',
  ],
};

// ─── Compulsion Encounter Hook Templates ────────────────────────

/** One-line prose hooks for encounter candidates in the Compulsion modal. */
export const COMPULSION_ENCOUNTER_HOOKS: Record<string, string[]> = {
  // Keyed by reach domain
  iron: [
    'Blood and iron — a reckoning that will not wait',
    'The clash of wills and weapons',
    'Strength tested against strength',
  ],
  gold: [
    'Coin and cleverness, weighed in the balance',
    'Prosperity hangs in the balance',
    'A deal that shapes the future',
  ],
  shadow: [
    'Secrets move beneath the surface',
    'What is hidden demands to be found',
    'The truth wears many faces',
  ],
  veil: [
    'The old ways stir — tradition and heresy entwined',
    'Knowledge forbidden or forgotten',
    'The boundary between worlds grows thin',
  ],
  heart: [
    'Loyalty tested, bonds forged or broken',
    'The ties that bind — and those that burn',
    'A choice that defines who {name} truly is',
  ],
  eye: [
    'Perception sharpens. Something reveals itself.',
    'The veil lifts — but what lies beneath?',
    'Clarity comes at a cost',
  ],
  stone: [
    'The land itself remembers',
    'What was built endures — or crumbles',
    'Foundation and transformation, side by side',
  ],
  star: [
    'Fate turns on a single moment',
    'The price of survival — or of sacrifice',
    'Time folds. The stars lean close.',
  ],
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
