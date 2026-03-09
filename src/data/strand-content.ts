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
  ambition_contentment: ['Ambitious', 'Content'],
  courage_prudence: ['Courageous', 'Prudent'],
  cruelty_compassion: ['Cruel', 'Compassionate'],
  cunning_honesty: ['Cunning', 'Honest'],
  devotion_independence: ['Devoted', 'Independent'],
  loyalty_treachery: ['Loyal', 'Treacherous'],
  tradition_innovation: ['Traditional', 'Innovative'],
  dominance_humility: ['Dominant', 'Humble'],
  wrath_patience: ['Wrathful', 'Patient'],
  greed_generosity: ['Greedy', 'Generous'],
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
  ambition_contentment: {
    weak: ['inclined toward striving', 'content with quiet life'],
    moderate: ['driven to prove themselves', 'content to let others lead'],
    strong: ['consumed by endless ambition', 'wholly withdrawn from desire'],
  },
  courage_prudence: {
    weak: ['drawn to face challenges', 'cautious of rash action'],
    moderate: ['willing to meet danger', 'careful weighing of risk'],
    strong: ['fearless unto recklessness', 'paralyzed by overdue care'],
  },
  cruelty_compassion: {
    weak: ['tends toward harsh judgment', 'quick to spare the weak'],
    moderate: ['capable of deliberate harm', 'moved by others\' suffering'],
    strong: ['relishes inflicting pain', 'cannot bear to cause hurt'],
  },
  cunning_honesty: {
    weak: ['inclined to bend the truth', 'prefers directness'],
    moderate: ['skilled in subterfuge', 'averse to deception'],
    strong: ['pathologically deceiveful', 'cannot utter falsehood'],
  },
  devotion_independence: {
    weak: ['somewhat bound to their cause', 'somewhat resistant to ties'],
    moderate: ['devoted to a higher order', 'fiercely self-directed'],
    strong: ['enslaved by their devotion', 'entirely unto themselves'],
  },
  loyalty_treachery: {
    weak: ['inclined to honor bonds', 'tempted by betrayal'],
    moderate: ['steadfast in allegiance', 'prone to turning on allies'],
    strong: ['bound eternal to their compact', 'betray even the beloved'],
  },
  tradition_innovation: {
    weak: ['drawn to the old ways', 'inclined toward the new'],
    moderate: ['guardian of tradition', 'seeker of untried methods'],
    strong: ['enslaved to how things were', 'consumed by creation of the novel'],
  },
  dominance_humility: {
    weak: ['tends to lead quietly', 'tends to follow others'],
    moderate: ['commands respect naturally', 'content in lesser station'],
    strong: ['must rule all around them', 'serves gladly beneath all others'],
  },
  wrath_patience: {
    weak: ['quick to irritation', 'slow to anger'],
    moderate: ['prone to violent outburst', 'steady in forbearance'],
    strong: ['rage consumes their every moment', 'patience infinite as stone'],
  },
  greed_generosity: {
    weak: ['inclined to gather wealth', 'inclined to share freely'],
    moderate: ['hoards against scarcity', 'gives without counting cost'],
    strong: ['enslaved by appetite for more', 'gives until they have nothing'],
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
  // Axiological fears
  ambition_contentment: [
    'Fears irrelevance and failure',
    'Fears being forced into endless striving',
  ],
  courage_prudence: ['Fears showing weakness', 'Fears reckless consequences'],
  cruelty_compassion: ['Fears vulnerability', 'Fears becoming heartless'],
  cunning_honesty: ['Fears being outwitted', 'Fears having to deceive'],
  devotion_independence: [
    'Fears abandonment by their cause',
    'Fears losing freedom',
  ],
  loyalty_treachery: [
    'Fears betrayal by those they trust',
    'Fears being bound by loyalty',
  ],
  tradition_innovation: [
    'Fears the loss of the old ways',
    'Fears stagnation',
  ],
  dominance_humility: ['Fears losing control', 'Fears being forced to dominate'],
  wrath_patience: ['Fears being powerless to act', 'Fears losing their temper'],
  greed_generosity: [
    'Fears poverty and scarcity',
    'Fears becoming selfish',
  ],

  // Reach-based fears (primordial terrors from Nine Reaches)
  // Note: These are embedded into existing pairs for structural compatibility.
  // Iron (warfare/violence): integrated into courage_prudence (recklessness) + wrath_patience (powerlessness)
  // Gold (trade/poverty): integrated into greed_generosity (poverty)
  // Shadow (stealth/exposure): integrated into cunning_honesty (outwitted) + cruelty_compassion (vulnerability)
  // Veil (magic/lost magic): can be added as variant fears when magic strength is assessed
  // Heart (social/isolation): integrated into devotion_independence (abandonment) + loyalty_treachery (betrayal)
  // Eye (knowledge/ignorance): integrated into cunning_honesty (sharper mind)
  // Stone (construction/collapse): integrated into dominance_humility (losing control)
  // Star (navigation/being lost): integrated into ambition_contentment (irrelevance)
  // Flesh (biology/decay): implicit in all aging/mortality themes
};

// ============================================================================
// § 4 EXTENDED REACH-BASED FEARS
// ============================================================================

/**
 * Primordial fears tied to each of the Nine Reaches.
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
 * - Flesh: Fear of decay, plague, the body's betrayal
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
  Flesh: ['Fears plague and decay, the body\'s slow betrayal', 'Fears perfection demanded until they shatter'],
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
  Flesh: ['Plague Decay', 'Perfection Demand'],
};

// ============================================================================
// § 7 VALIDATION & EXPORTS
// ============================================================================

/**
 * Minimum expected counts for each content pool.
 * Used in tests to ensure content is sufficiently populated.
 */
export const CONTENT_COUNTS = {
  VALUE_LABELS: 10,
  INTENSITY_VALUE_LABELS: 10,
  FEAR_DESCRIPTIONS: 10,
  REACH_BASED_FEARS: 9,
  STRAND_SECTION_TITLES: 6,
} as const;
