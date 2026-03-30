/**
 * Intervention Feedback Content Package — consequence message templates,
 * divine influence constants, and audio configuration.
 *
 * ═══════════════════════════════════════════════════════════════════
 * CONTENT MANAGER: Edit this file to change intervention durations,
 * drift magnitudes, feedback timing, and consequence messages.
 * ═══════════════════════════════════════════════════════════════════
 *
 * Sections:
 * 1. DIVINE_INFLUENCE_CONSTANTS — durations, drift values, modifiers, timing
 * 2. CONSEQUENCE_TEMPLATES — narrative feedback for all 8 intervention types
 * 3. getConsequenceMessage — template substitution function
 * 4. SPHERE_AUDIO_CONFIG — audio frequency and waveform per sphere
 */

// ─── Divine Influence Constants ──────────────────────────────────

export const DIVINE_INFLUENCE_CONSTANTS = {
  // Duration (ticks)
  DREAM_DURATION: 3,
  PERSUADE_DURATION: 12,
  DECEIVE_DURATION: 18,
  INTIMIDATE_DURATION: 10,
  INSPIRE_INTERVENTION_DURATION: 6,
  COINCIDENCE_DURATION: 1,
  OMEN_DURATION: 5,
  AFFLICT_BLESS_DURATION: 10,

  // Value drift magnitudes
  DREAM_DRIFT: 0.12,
  PERSUADE_DRIFT: 0.20,
  DECEIVE_DRIFT: 0.20,
  INTIMIDATE_COURAGE_DRIFT: -0.30,

  // Capability modifiers
  INSPIRE_PERSONALITY_BOOST: 0.30,
  BLESS_CAPABILITY_BONUS: 0.20,
  AFFLICT_CAPABILITY_PENALTY: -0.20,

  // Coincidence effects
  COINCIDENCE_SPHERE_BOOST: 0.15,

  // Omen effects
  OMEN_MOOD_DRIFT: 0.08,
  OMEN_DETECTION_INCREASE: 0.05,

  // Feedback timing (ms)
  CARD_PULSE_MS: 200,
  CARD_SPENT_MS: 200,
  DRAWER_CLOSE_DELAY_MS: 600,

  // Audio
  AUDIO_BASE_FREQ: 220,
  AUDIO_RISE_FREQ: 440,
  AUDIO_DURATION_MS: 200,
  AUDIO_DETECTION_DETUNE: 30,
} as const;

// ─── Consequence Message Templates ──────────────────────────────

/**
 * Narrative consequence templates for all 8 intervention types.
 * Each template may have different placeholders depending on whether
 * it targets an agent ({agent}), location ({location}), or sphere ({sphere}).
 */
export const CONSEQUENCE_TEMPLATES: Record<string, string[]> = {
  dream: [
    'You reach into {agent}\'s sleeping mind… they will be drawn toward {value_direction} in the days ahead.',
    '{agent}\'s dreams shift — a subtle pull toward {value_direction} takes root.',
    'The dream takes hold. {agent} stirs, touched by visions of {value_direction}.',
  ],
  persuade: [
    'Your whispered influence takes hold — {agent} is now more inclined toward {value_direction}.',
    '{agent} feels a sudden conviction. {value_direction} calls to them now.',
    'Something shifts in {agent}\'s resolve. The pull toward {value_direction} grows stronger.',
  ],
  deceive: [
    '{agent} now believes a falsehood… but the truth may surface.',
    'A false conviction plants itself in {agent}\'s mind. They act on shadow, not substance.',
    '{agent}\'s worldview bends around a lie. For now, they see what you wish them to see.',
  ],
  intimidate: [
    '{agent} feels a chill of dread — they will act with greater caution.',
    'Fear grips {agent}. Bold action retreats from their mind, replaced by prudence.',
    '{agent}\'s courage falters. They will think twice before acting rashly.',
  ],
  inspire_intervention: [
    '{agent} burns with sudden conviction — their {domain} prowess surges.',
    'Divine inspiration floods {agent}. Their {domain} abilities sharpen to a keen edge.',
    '{agent} is touched by brilliance. For a time, their {domain} mastery exceeds its bounds.',
  ],
  coincidence: [
    'Fate shifts around {location} — the threads of {sphere} grow stronger here.',
    'A coincidence, or destiny? The {sphere} influence at {location} deepens.',
    'The world bends. At {location}, {sphere} essence gathers unbidden.',
  ],
  omen: [
    'An omen manifests at {location} — all who witness it are moved.',
    'A sign appears at {location}. Those present feel its weight upon their hearts.',
    'The omen settles over {location} like a shroud. None who see it are unchanged.',
  ],
  afflict_bless: [
    '{agent} has been {effect_type} — their {domain} is {effect_direction} for a time.',
    'Divine {effect_type_lower} falls upon {agent}. Their {domain} {effect_verb}.',
    '{agent} bears the mark of divine {effect_type_lower}. Their {domain} capabilities are {effect_direction}.',
  ],
};

// ─── Consequence Message Generator ──────────────────────────────

interface ConsequenceParams {
  agentName?: string;
  valueDirection?: string;
  sphere?: string;
  domain?: string;
  location?: string;
  effectType?: 'Blessed' | 'Afflicted';
  effectDirection?: 'strengthened' | 'diminished';
}

/**
 * Generate a consequence message for a given intervention type.
 * Uses seeded selection for deterministic template choice.
 *
 * @param interventionType The type of intervention (dream, persuade, etc.)
 * @param params Placeholder values for the template
 * @param seed Random seed for template selection
 * @returns Fully substituted consequence message
 */
export function getConsequenceMessage(
  interventionType: string,
  params: ConsequenceParams,
  seed: number,
): string {
  const templates = CONSEQUENCE_TEMPLATES[interventionType] ?? ['{agent} is affected by divine power.'];
  const index = Math.abs(seed) % templates.length;
  let msg = templates[index];

  msg = msg.replace(/{agent}/g, params.agentName ?? 'the target');
  msg = msg.replace(/{value_direction}/g, params.valueDirection ?? 'a new path');
  msg = msg.replace(/{sphere}/g, params.sphere ?? 'essence');
  msg = msg.replace(/{domain}/g, params.domain ?? 'capabilities');
  msg = msg.replace(/{location}/g, params.location ?? 'this place');
  msg = msg.replace(/{effect_type}/g, params.effectType ?? 'Blessed');
  msg = msg.replace(/{effect_type_lower}/g, (params.effectType ?? 'blessing').toLowerCase());
  msg = msg.replace(/{effect_direction}/g, params.effectDirection ?? 'altered');
  msg = msg.replace(/{effect_verb}/g, params.effectDirection === 'diminished' ? 'wanes' : 'swells');

  return msg;
}

// ─── Audio Configuration ─────────────────────────────────────────

/**
 * Audio configuration per Creation Sphere.
 * freqOffset is applied to AUDIO_BASE_FREQ to generate sphere-specific pitch.
 * waveform determines the oscillator type for tonal quality.
 */
export const SPHERE_AUDIO_CONFIG: Record<string, { freqOffset: number; waveform: OscillatorType }> = {
  force:   { freqOffset: -60, waveform: 'sawtooth' },
  matter:  { freqOffset: -40, waveform: 'triangle' },
  energy:  { freqOffset: 20,  waveform: 'sine' },
  life:    { freqOffset: 0,   waveform: 'sine' },
  mind:    { freqOffset: 60,  waveform: 'sine' },
  spirit:  { freqOffset: 80,  waveform: 'sine' },
  time:    { freqOffset: 40,  waveform: 'triangle' },
  entropy: { freqOffset: -80, waveform: 'sawtooth' },
};
