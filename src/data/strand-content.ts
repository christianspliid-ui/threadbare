/**
 * Strand Content — Labels, Fears, and UI Text
 *
 * This package contains all display text for the Psyche Strands system:
 * - VALUE_LABELS: Display names for each value axis (positive and negative poles)
 * - INTENSITY_VALUE_LABELS: Nuanced three-level intensity descriptions for progressive disclosure
 * - FEAR_DESCRIPTIONS: Evocative shadow fears derived from value extremes (reach-based + axiological)
 * - STRAND_SECTION_TITLES: UI header names for each of the six strands
 *
 * All prose follows the "Threadbare" aesthetic: dark world, hidden magic, wonder layered
 * over grief. Content should feel like fragments from a dying world's oral tradition.
 */

import type { ValuePair } from '../types/agent';

// ============================================================================
// § 1 VALUE LABELS
// ============================================================================

/**
 * Display names for each value axis.
 * Structure: valuePair → [positive pole, negative pole]
 * Used for high-level trait descriptions and progress indicators.
 */
export const VALUE_LABELS: Record<ValuePair, [string, string]> = {
  mercy_ruthlessness: ['Merciful', 'Ruthless'],
  asceticism_extravagance: ['Ascetic', 'Extravagant'],
  honesty_cunning: ['Honest', 'Cunning'],
  tradition_novelty: ['Traditional', 'Innovative'],
  loyalty_ambition: ['Loyal', 'Ambitious'],
  revelation_discretion: ['Revealing', 'Discreet'],
  preservation_transformation: ['Preserving', 'Transforming'],
  sacrifice_survival: ['Self-Sacrificing', 'Self-Preserving'],
  courage_prudence: ['Courageous', 'Prudent'],
};

// ============================================================================
// § 2 INTENSITY VALUE LABELS
// ============================================================================

/**
 * Three-level intensity descriptions for each value axis.
 * Structure: valuePair → { weak, moderate, strong } for both poles
 * Used in progressive disclosure (Tier 2+) to provide knowledge-gated variation.
 *
 * Weak: tentative, inclined
 * Moderate: devoted, drawn, committed
 * Strong: fanatically, consumed, bound entirely
 */
export const INTENSITY_VALUE_LABELS: Record<
  ValuePair,
  { weak: [string, string]; moderate: [string, string]; strong: [string, string] }
> = {
  mercy_ruthlessness: {
    weak: ['inclined to spare the weak', 'tends toward harsh judgment'],
    moderate: ['moved by others\' suffering', 'capable of deliberate harm'],
    strong: ['cannot bear to cause hurt', 'relishes inflicting pain'],
  },
  asceticism_extravagance: {
    weak: ['inclined toward restraint', 'inclined to indulge'],
    moderate: ['practises deliberate austerity', 'hoards against scarcity'],
    strong: ['denies all comfort gladly', 'enslaved by appetite for more'],
  },
  honesty_cunning: {
    weak: ['prefers directness', 'inclined to bend the truth'],
    moderate: ['averse to deception', 'skilled in subterfuge'],
    strong: ['cannot utter falsehood', 'pathologically deceitful'],
  },
  tradition_novelty: {
    weak: ['drawn to the old ways', 'inclined toward the new'],
    moderate: ['guardian of tradition', 'seeker of untried methods'],
    strong: ['enslaved to how things were', 'consumed by creation of the novel'],
  },
  loyalty_ambition: {
    weak: ['inclined to honor bonds', 'inclined toward striving'],
    moderate: ['steadfast in allegiance', 'driven to prove themselves'],
    strong: ['bound eternal to their compact', 'consumed by endless ambition'],
  },
  revelation_discretion: {
    weak: ['drawn to uncover hidden things', 'inclined toward careful concealment'],
    moderate: ['driven to expose what is veiled', 'skilled in keeping secrets'],
    strong: ['cannot bear a truth left unspoken', 'will guard any secret unto death'],
  },
  preservation_transformation: {
    weak: ['tends to protect what exists', 'tends to reshape what endures'],
    moderate: ['guardian of inherited forms', 'driven to rebuild better'],
    strong: ['nothing must change beneath their watch', 'must tear down before they can rest'],
  },
  sacrifice_survival: {
    weak: ['somewhat bound to their cause', 'somewhat resistant to ties'],
    moderate: ['devoted to a higher order', 'fiercely self-directed'],
    strong: ['enslaved by their devotion', 'entirely unto themselves'],
  },
  courage_prudence: {
    weak: ['drawn to face challenges', 'cautious of rash action'],
    moderate: ['willing to meet danger', 'careful weighing of risk'],
    strong: ['fearless unto recklessness', 'paralyzed by overdue care'],
  },
};

// ============================================================================
// § 3 FEAR DESCRIPTIONS
// ============================================================================

/**
 * Shadow fears derived from value extremes.
 *
 * Each value pair generates two fears: one from extreme positive expression,
 * one from extreme negative. When an agent has strong values (|v| > 0.3),
 * they manifest fears tied to those poles.
 *
 * Reach-based fears (Iron, Gold, Shadow, Veil, Heart, Eye, Stone, Star, Flesh)
 * are integrated as primordial terrors: violence, poverty, exposure, magic loss,
 * isolation, ignorance, collapse, lostness, decay.
 *
 * All prose: terse, evocative, haunted tone.
 */
export const FEAR_DESCRIPTIONS: Record<ValuePair, [string, string]> = {
  // Axiological fears — [virtue-extreme fear, flaw-extreme fear]
  mercy_ruthlessness: ['Fears vulnerability from showing mercy', 'Fears becoming heartless'],
  asceticism_extravagance: ['Fears poverty and scarcity', 'Fears becoming selfish'],
  honesty_cunning: ['Fears being outwitted', 'Fears having to deceive'],
  tradition_novelty: ['Fears the loss of the old ways', 'Fears stagnation'],
  loyalty_ambition: ['Fears betrayal by those they trust', 'Fears irrelevance and failure'],
  revelation_discretion: ['Fears being kept blind by those they trust', 'Fears the harm their knowledge might cause'],
  preservation_transformation: ['Fears all they have built crumbling to nothing', 'Fears being enslaved by what they cannot change'],
  sacrifice_survival: ['Fears abandonment by their cause', 'Fears losing freedom'],
  courage_prudence: ['Fears showing weakness', 'Fears reckless consequences'],

  // Reach-based fears (primordial terrors from Eight Reaches)
  // Note: These are embedded into existing pairs for structural compatibility.
  // Iron (warfare/violence): integrated into courage_prudence (recklessness) + mercy_ruthlessness (powerlessness)
  // Gold (trade/poverty): integrated into asceticism_extravagance (poverty)
  // Shadow (stealth/exposure): integrated into honesty_cunning (outwitted) + mercy_ruthlessness (vulnerability)
  // Veil (magic/lost magic): can be added as variant fears when magic strength is assessed
  // Heart (social/isolation): integrated into sacrifice_survival (abandonment) + loyalty_ambition (betrayal)
  // Eye (knowledge/blindness): integrated into revelation_discretion
  // Stone (construction/collapse): integrated into preservation_transformation
  // Star (navigation/being lost): integrated into loyalty_ambition (irrelevance)
  // Flesh reach removed (TB-075 Phase 1) — decay/vitality themes migrate to Quintessence runtime property
};

// ============================================================================
// § 4 EXTENDED REACH-BASED FEARS
// ============================================================================

/**
 * Primordial fears tied to each of the Eight Reaches.
 * These represent deeper, more cosmological anxieties beneath the axiological pairs.
 *
 * Used when depicting agents whose core fears are rooted in the fabric of action itself:
 * - Iron: Fear of violence, helplessness in conflict
 * - Gold: Fear of poverty, scarcity, want
 * - Shadow: Fear of exposure, unmasking, loss of secrecy
 * - Veil: Fear of magic drying up, the world becoming barren of wonder
 * - Heart: Fear of isolation, the severing of all bonds
 * - Eye: Fear of ignorance, blindness, the unknowable
 * - Stone: Fear of collapse, structural failure, the ground giving way
 * - Star: Fear of being lost, untethered, navigation failing
 * (Flesh reach removed in TB-075 Phase 1 — decay/vitality themes migrate to Quintessence)
 */
export const REACH_BASED_FEARS: Record<string, [string, string]> = {
  Iron: ['Fears being overwhelmed in combat, helpless beneath an enemy', 'Fears the blood never washing clean'],
  Gold: ['Fears want and scarcity, the hollow that devours from within', 'Fears trade routes severed, wealth turned to ash'],
  Shadow: ['Fears exposure, unmasking before the crowd', 'Fears stepping into unforgiving light'],
  Veil: ['Fears magic drying up, the world losing all enchantment', 'Fears sorcery turning against them, uncontrolled'],
  Heart: ['Fears isolation, the severing of all bonds and belonging', 'Fears the crowd, losing themselves in the mass'],
  Eye: ['Fears ignorance, knowledge forever withheld', 'Fears what they know destroying their peace'],
  Stone: ['Fears collapse, the world\'s foundation cracking beneath them', 'Fears being trapped in stone forever'],
  Star: ['Fears being lost, the path ahead obscured eternally', 'Fears being bound to one place, never moving forward'],
};

// ============================================================================
// § 5 STRAND SECTION TITLES
// ============================================================================

/**
 * Display names for the six psyche strands.
 * Used as UI headers and section titles in the Agent Detail Panel and progressive disclosure flows.
 *
 * Index order: Presence (0), Desires (1), Bonds (2), Ambitions (3), Beliefs (4), Fears (5)
 */
export const STRAND_SECTION_TITLES: Record<string, string> = {
  Presence: 'Where They Stand',
  Desires: 'What They Crave',
  Bonds: 'What They Cherish',
  Ambitions: 'What They Pursue',
  Beliefs: 'What They Hold',
  Fears: 'What Haunts Them',
};

// ============================================================================
// § 6 REACH-PAIRED FEAR LABELS
// ============================================================================

/**
 * Standalone labels for reach-based primordial fears.
 * Paired structure: [pole 0, pole 1] for consistency with axiological model.
 */
export const REACH_FEAR_LABELS: Record<string, [string, string]> = {
  Iron: ['Martial Dread', 'Combat Anxiety'],
  Gold: ['Scarcity Terror', 'Wealth Corruption'],
  Shadow: ['Exposure Horror', 'Darkness Hunger'],
  Veil: ['Magical Drought', 'Sorcerous Chaos'],
  Heart: ['Isolation Void', 'Crowd Dissolution'],
  Eye: ['Ignorance Void', 'Knowledge Curse'],
  Stone: ['Collapse Dread', 'Entombment'],
  Star: ['Lostness', 'Binding'],
  // Flesh reach removed in TB-075 Phase 1 — Quintessence will replace it
};

// ============================================================================
// § 7 VALIDATION & EXPORTS
// ============================================================================

/**
 * Minimum expected counts for each content pool.
 * Used in tests to ensure content is sufficiently populated.
 */
export const CONTENT_COUNTS = {
  VALUE_LABELS: 9,
  INTENSITY_VALUE_LABELS: 9,
  FEAR_DESCRIPTIONS: 9,
  REACH_BASED_FEARS: 8,
  STRAND_SECTION_TITLES: 6,
} as const;
