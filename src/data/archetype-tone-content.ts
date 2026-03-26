/**
 * Archetype Tone Overlays — TB-035 Phase 6.
 *
 * Layer 4 of the 4-layer beat architecture. Modifies prose flavor
 * based on the First's archetype (primary reach). Each reach has
 * tonal adjective pools and god-voice style that color the vignette.
 *
 * Usage: enrichProse applies these overlays via {tone_adj} and {tone_verb}
 * placeholders, and generateMeetingCallback uses the god-voice style.
 */

import type { ReachDomain } from '../types/traits';

// ─── Tone Overlay Types ─────────────────────────────────────────────

export interface ArchetypeToneOverlay {
  /** Adjectives that describe this archetype's actions/qualities */
  adjectives: string[];
  /** Verbs that characterize this archetype's way of acting */
  verbs: string[];
  /** God-voice style prefix — how the god addresses this archetype */
  godVoiceStyle: string;
  /** Short descriptor for prose transitions */
  descriptor: string;
}

// ─── Tone Overlays by Primary Reach ─────────────────────────────────

export const ARCHETYPE_TONE_OVERLAYS: Record<ReachDomain, ArchetypeToneOverlay> = {
  iron: {
    adjectives: ['fierce', 'unyielding', 'battle-hardened', 'relentless', 'iron-willed', 'sharp', 'scarred'],
    verbs: ['strikes', 'shatters', 'stands firm', 'advances', 'cleaves', 'holds the line', 'charges'],
    godVoiceStyle: 'direct and commanding',
    descriptor: 'warrior',
  },
  gold: {
    adjectives: ['shrewd', 'calculating', 'prosperous', 'generous', 'acquisitive', 'precise', 'gilded'],
    verbs: ['invests', 'negotiates', 'acquires', 'leverages', 'trades', 'profits', 'provisions'],
    godVoiceStyle: 'transactional but warm',
    descriptor: 'merchant',
  },
  shadow: {
    adjectives: ['subtle', 'unseen', 'silent', 'cunning', 'patient', 'elusive', 'shadowed'],
    verbs: ['slips through', 'vanishes', 'outmaneuvers', 'deceives', 'stalks', 'uncovers', 'subverts'],
    godVoiceStyle: 'whispered and conspiratorial',
    descriptor: 'shadow-walker',
  },
  veil: {
    adjectives: ['arcane', 'luminous', 'channeled', 'resonant', 'mystical', 'attuned', 'otherworldly'],
    verbs: ['weaves', 'channels', 'transmutes', 'invokes', 'unravels', 'binds', 'conjures'],
    godVoiceStyle: 'cryptic and layered',
    descriptor: 'mage',
  },
  heart: {
    adjectives: ['inspiring', 'compassionate', 'devoted', 'charismatic', 'empathic', 'loyal', 'radiant'],
    verbs: ['rallies', 'inspires', 'mends', 'persuades', 'unifies', 'protects', 'loves'],
    godVoiceStyle: 'gentle and encouraging',
    descriptor: 'heart-bearer',
  },
  eye: {
    adjectives: ['perceptive', 'watchful', 'insightful', 'measured', 'analytical', 'far-seeing', 'lucid'],
    verbs: ['observes', 'perceives', 'uncovers', 'analyzes', 'discerns', 'foresees', 'remembers'],
    godVoiceStyle: 'measured and knowing',
    descriptor: 'seer',
  },
  stone: {
    adjectives: ['steadfast', 'enduring', 'grounded', 'immovable', 'patient', 'rooted', 'monumental'],
    verbs: ['builds', 'shapes', 'fortifies', 'plants', 'cultivates', 'anchors', 'carves'],
    godVoiceStyle: 'steady and deliberate',
    descriptor: 'builder',
  },
  star: {
    adjectives: ['devout', 'luminous', 'transcendent', 'anointed', 'sacred', 'exalted', 'blessed'],
    verbs: ['prays', 'consecrates', 'ascends', 'communes', 'sanctifies', 'illuminates', 'blesses'],
    godVoiceStyle: 'reverent and prophetic',
    descriptor: 'faithful',
  },
  flesh: {
    adjectives: ['resilient', 'primal', 'weathered', 'tenacious', 'scarred', 'raw', 'vital'],
    verbs: ['endures', 'survives', 'adapts', 'perseveres', 'wrestles', 'overcomes', 'regenerates'],
    godVoiceStyle: 'earthy and practical',
    descriptor: 'survivor',
  },
};

/**
 * Select a tone-appropriate adjective for the given reach.
 * Uses the rng to pick from the pool.
 */
export function selectToneAdjective(reach: ReachDomain, rng: () => number): string {
  const overlay = ARCHETYPE_TONE_OVERLAYS[reach];
  return overlay.adjectives[Math.floor(rng() * overlay.adjectives.length)];
}

/**
 * Select a tone-appropriate verb for the given reach.
 */
export function selectToneVerb(reach: ReachDomain, rng: () => number): string {
  const overlay = ARCHETYPE_TONE_OVERLAYS[reach];
  return overlay.verbs[Math.floor(rng() * overlay.verbs.length)];
}
