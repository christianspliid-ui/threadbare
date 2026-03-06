/**
 * Narrative Content Package — All data-driven content for the narrative prose engine.
 *
 * ═══════════════════════════════════════════════════════════════════
 * CONTENT MANAGER: This is the file you edit to change sphere vocabulary,
 * template prose, and personality flavors.
 * ═══════════════════════════════════════════════════════════════════
 *
 * Sections:
 * 1. SPHERE_VOCABULARY — adjectives, verbs, nouns for each of 8 Creation Spheres
 * 2. ROUTINE_TEMPLATES — 11 event-type templates for Tier 1 prose
 * 3. NOTABLE_TEMPLATES — 5 event-type templates for Tier 2 prose with personality
 * 4. VALUE_FLAVORS — personality modifiers for 10 value pairs
 */

import type { SphereName } from '../types/index';
import type { SphereVocabulary } from '../types/narrative';
import type { ValuePair } from '../types/agent';

// ═══════════════════════════════════════════════════════════════════
// 1. SPHERE VOCABULARY
// ═══════════════════════════════════════════════════════════════════

/**
 * Word bank for each Creation Sphere.
 * Used by pickSphereWord() to flavor prose with sphere-specific language.
 */
export const SPHERE_VOCABULARY: Record<SphereName, SphereVocabulary> = {
  force: {
    adjectives: ['mighty', 'thunderous', 'relentless', 'crushing', 'unyielding'],
    verbs: ['shattered', 'struck', 'overwhelmed', 'battered', 'surged'],
    nouns: ['might', 'fury', 'impact', 'avalanche', 'storm'],
  },
  matter: {
    adjectives: ['solid', 'enduring', 'immovable', 'crystalline', 'dense'],
    verbs: ['forged', 'shaped', 'hardened', 'anchored', 'crystallized'],
    nouns: ['stone', 'iron', 'foundation', 'bulwark', 'bedrock'],
  },
  energy: {
    adjectives: ['crackling', 'luminous', 'volatile', 'radiant', 'searing'],
    verbs: ['blazed', 'surged', 'erupted', 'ignited', 'cascaded'],
    nouns: ['flame', 'lightning', 'pulse', 'arc', 'inferno'],
  },
  life: {
    adjectives: ['verdant', 'flourishing', 'vital', 'blooming', 'fecund'],
    verbs: ['bloomed', 'healed', 'nurtured', 'grew', 'restored'],
    nouns: ['growth', 'renewal', 'bloom', 'vitality', 'spring'],
  },
  mind: {
    adjectives: ['keen', 'piercing', 'calculating', 'lucid', 'insightful'],
    verbs: ['discerned', 'analyzed', 'perceived', 'understood', 'unraveled'],
    nouns: ['thought', 'insight', 'clarity', 'revelation', 'logic'],
  },
  spirit: {
    adjectives: ['ethereal', 'transcendent', 'luminous', 'spectral', 'sacred'],
    verbs: ['resonated', 'sanctified', 'communed', 'invoked', 'channeled'],
    nouns: ['soul', 'essence', 'prayer', 'vision', 'aura'],
  },
  time: {
    adjectives: ['ancient', 'inexorable', 'cyclic', 'fading', 'eternal'],
    verbs: ['aged', 'unwound', 'echoed', 'rippled', 'decayed'],
    nouns: ['epoch', 'moment', 'tide', 'cycle', 'memory'],
  },
  entropy: {
    adjectives: ['decaying', 'consuming', 'inevitable', 'dissolving', 'chaotic'],
    verbs: ['crumbled', 'consumed', 'unraveled', 'corroded', 'scattered'],
    nouns: ['ash', 'ruin', 'void', 'decay', 'dissolution'],
  },
};

// ═══════════════════════════════════════════════════════════════════
// 2. ROUTINE TEMPLATES (Tier 1)
// ═══════════════════════════════════════════════════════════════════

/**
 * Template prose for Tier 1 (Routine) narrative events.
 * Each template is a sentence fragment with {placeholders} for substitution.
 * Placeholders: {actor}, {target}, {adj}, {verb}, {noun}
 */
export const ROUTINE_TEMPLATES: Record<string, string[]> = {
  action_resolved: [
    '{actor} {verb} toward {target}, a {adj} display of {noun}.',
    'With {adj} resolve, {actor} moved against {target}. The air hummed with {noun}.',
    '{actor} acted with {adj} purpose, their {noun} reshaping the fate of {target}.',
  ],
  action_failed: [
    '{actor} reached for {target}, but the effort dissolved into {noun}.',
    'The {adj} attempt by {actor} faltered, leaving only {noun} in its wake.',
  ],
  action_critical: [
    '{actor} {verb} with {adj} force, and {target} was forever changed by the {noun}.',
    'A {adj} moment — {actor} {verb} beyond all expectation, and {noun} reshaped the world.',
  ],
  trait_acquired: [
    'Something shifted within {actor}. A new {noun} took root — {adj} and undeniable.',
    '{actor} emerged changed, bearing the mark of {adj} {noun}.',
  ],
  tier_transition: [
    'The bond between {actor} and the divine deepened, {adj} {noun} flowing through them.',
  ],
  divine_intervention: [
    'You reached into the dream of {actor}, a {adj} whisper carrying {noun}.',
    'You stirred the {noun} within {actor}, a {adj} touch upon their sleeping mind.',
  ],
  contested_action: [
    'Two forces clashed over {target} — {adj} {noun} against {adj} resolve.',
  ],
  actor_death: [
    '{actor} fell, their last breath a {adj} exhalation of {noun}.',
  ],
  doom_escalation: [
    'The world {verb}. {adj} {noun} spreads across the land.',
  ],
  mandate_stage: [
    'A threshold is crossed. The {adj} {noun} of destiny draws nearer.',
  ],
  trait_lost: [
    'Something faded within {actor}. The {adj} {noun} dimmed and was gone.',
  ],
};

// ═══════════════════════════════════════════════════════════════════
// 3. NOTABLE TEMPLATES (Tier 2)
// ═══════════════════════════════════════════════════════════════════

/**
 * Template prose for Tier 2 (Notable) narrative events.
 * Extended sentences with {personality} placeholder for value-driven flavor.
 * Placeholders: {actor}, {target}, {adj}, {verb}, {noun}, {personality}
 */
export const NOTABLE_TEMPLATES: Record<string, string[]> = {
  action_critical: [
    'In a moment that would echo through memory, {actor} {verb} against {target}{personality}. The very air trembled with {adj} {noun}, and those who witnessed it knew the world had shifted.',
    '{actor}{personality} stood at the threshold of legend. With {adj} determination, they {verb} — and {target} was forever transformed by the {noun} unleashed.',
  ],
  trait_acquired: [
    'Something profound awakened within {actor}{personality}. Like {adj} {noun} breaking through winter soil, a new aspect of their being emerged — one that would define the chapters yet to come.',
    '{actor} was changed{personality}. The {adj} mark of {noun} settled upon them, indelible as starlight, shaping all that would follow.',
  ],
  doom_escalation: [
    'The world shudders. Across {target}, {adj} {noun} seeps through the cracks of reality{personality}. Those with eyes to see recognize the signs — the {noun} draws closer.',
    'A tremor passes through the fabric of existence. In {target}, {adj} portents multiply — {noun} gathering like stormclouds on the horizon.',
  ],
  tier_transition: [
    'The divine bond between {actor} and the unseen deepens{personality}. {adj} {noun} courses through their veins now, marking them as something more than mortal.',
  ],
  divine_intervention: [
    'You reach deeper than before into the consciousness of {actor}{personality}. This time the {adj} {noun} of your will leaves a lasting impression — their dreams will never be quite the same.',
  ],
};

// ═══════════════════════════════════════════════════════════════════
// 4. VALUE FLAVORS
// ═══════════════════════════════════════════════════════════════════

/**
 * Personality modifiers that flavor Notable prose based on an actor's dominant values.
 * Each value pair maps to one or more short phrases that can be inserted into prose.
 */
export const VALUE_FLAVORS: Partial<Record<ValuePair, string[]>> = {
  ambition_contentment: ['driven by ambition', 'fueled by relentless desire'],
  courage_prudence: ['with fearless resolve', 'bold beyond measure'],
  cruelty_compassion: ['tempered by compassion', 'with a gentle hand'],
  cunning_honesty: ['with cunning precision', 'through shrewd calculation'],
  devotion_independence: ['bound by devotion', 'answering a higher call'],
  loyalty_treachery: ['loyal to the last', 'with unwavering fidelity'],
  tradition_innovation: ['embracing new paths', 'breaking with the old ways'],
  dominance_humility: ['commanding all before them', 'asserting dominion'],
  wrath_patience: ['with patient deliberation', 'measured and calm'],
  greed_generosity: ['with open-handed generosity', 'sharing freely'],
};
