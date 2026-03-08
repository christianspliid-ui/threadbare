/**
 * World-Soul Content Package — prose for fundament coefficients and resonance fragments.
 *
 * ═══════════════════════════════════════════════════════════════════
 * CONTENT MANAGER: This is the file you edit to change World-Soul prose,
 * fundament descriptions (how spheres express at high/low power), and
 * resonance fragment seeds (memories the World-Soul carries across cycles).
 * ═══════════════════════════════════════════════════════════════════
 *
 * Sections:
 * 1. FundamentDescription interface
 * 2. FUNDAMENT_DESCRIPTIONS — 12 sphere descriptions (4 foundations + 8 creations)
 * 3. RESONANCE_FRAGMENT_PROSE — 8 memory fragment templates for metaprogression
 */

/**
 * Prose pair for a sphere's fundament coefficient.
 * high = expression when sphere's weight is dominant (>0.15)
 * low = expression when sphere's weight is suppressed (<0.05)
 */
export interface FundamentDescription {
  high: string;
  low: string;
}

/**
 * ═══════════════════════════════════════════════════════════════════
 * FUNDAMENT DESCRIPTIONS — 12 sphere descriptions
 *
 * Threadbare aesthetic: dark world, hidden magic, threads that break through.
 * Each description should feel atmospheric and literary.
 * ═══════════════════════════════════════════════════════════════════
 */
export const FUNDAMENT_DESCRIPTIONS: Record<string, FundamentDescription> = {
  // ─── Foundation Spheres (Cosmic Axes) ──────────────────────────

  /** Chaos ↔ Order axis: unpredictability vs. structure */
  chaos: {
    high: 'The World-Soul seethes with chaos. Reality bends and fractures at every seam; nothing holds firm. Patterns shatter beneath random tides. Prophecy fails.',
    low: 'Chaos lies dormant. The world settles into predictable, crystalline patterns. Nothing stirs. Even hope becomes statistical.',
  },

  /** Order ↔ Chaos axis: crystalline structure vs. wild unpredictability */
  order: {
    high: 'Order saturates the cosmos. Every event unfolds by divine law. Cycles repeat with geometric perfection. Rebellion is impossible; all paths are written.',
    low: 'Order crumbles to ash. The World-Soul forgets its own rules. Cause and effect tangle. Time loops backward. Even the gods lose their scripts.',
  },

  /** Light ↔ Darkness axis: revelation vs. concealment */
  light: {
    high: 'Light tears through shadow. Hidden things are forced into terrible clarity. No secret survives the burning eye of the World-Soul. Truth devours privacy.',
    low: 'Darkness swallows all. Light dims to ember. Secrets nest in the shadows; truth hides beneath ten veils. The World-Soul closes its eyes.',
  },

  /** Darkness ↔ Light axis: concealment vs. revelation */
  darkness: {
    high: 'Darkness deepens. The World-Soul withdraws into itself. Hidden currents run beneath the surface; magic works in silence. The veil grows thick.',
    low: 'Darkness retreats. All is exposed. Shadows flee. No corner of the cosmos remains unmarked by watchful light. The veil tears.',
  },

  // ─── Creation Spheres (Domains of Existence) ──────────────────

  /** Force — violence, impact, motion, will */
  force: {
    high: 'Force runs rampant. Impact shatters matter. Will overwhelms resistance. Conflict blazes across every reach; even stillness itself is struck down.',
    low: 'Force sleeps. Violence fades. Impacts become whispers. The World-Soul holds its breath. Gentleness and stillness settle upon all things.',
  },

  /** Matter — substance, form, structure, duration */
  matter: {
    high: 'Matter crystallizes. Form becomes unbreakable. The world hardens into bedrock and iron. Stone endures; nothing decays. Duration stretches infinite.',
    low: 'Matter frays. Forms blur and soften. Stone crumbles to sand. The physical world grows insubstantial, dreamlike, ephemeral. Structures fail.',
  },

  /** Energy — vitality, power, transformation, radiance */
  energy: {
    high: 'Energy blazes. The World-Soul radiates in cascades of power. All things vibrate with fierce vitality. Transformation ripples through every moment.',
    low: 'Energy fades to embers. Vitality drains away. The cosmos grows sluggish, cold, dim. Power withdraws. All things move with terrible slowness.',
  },

  /** Life — growth, reproduction, adaptation, flourishing */
  life: {
    high: 'Life erupts. Growth accelerates. The World-Soul blooms with verdant abundance; every niche floods with living things. Adaptation runs wild.',
    low: 'Life stalls. Growth halts. Barrenness spreads. The World-Soul grows sterile and lifeless. Flourishing ceases. Silence reigns.',
  },

  /** Mind — consciousness, thought, awareness, perception */
  mind: {
    high: 'Mind expands. Consciousness multiplies. Perception sharpens into impossible clarity. Every atom thinks. Awareness spreads like wildfire.',
    low: 'Mind withdraws. Consciousness fades. The World-Soul grows dim and thoughtless. Awareness contracts. All falls into dull silence.',
  },

  /** Spirit — transcendence, divinity, meaning, essence */
  spirit: {
    high: 'Spirit ascends. The divine floods through every veil. Transcendence becomes tangible. Meaning crystallizes. The sacred pervades all existence.',
    low: 'Spirit fades. The divine retreats beyond reach. Transcendence becomes impossible. Meaning drains away. All falls into profane emptiness.',
  },

  /** Time — causality, change, history, momentum */
  time: {
    high: 'Time accelerates. Change runs wild. Causality loops and tangles. History rewrites itself moment by moment. Momentum builds toward unknown futures.',
    low: 'Time stalls. Change ceases. Causality breaks; cause and effect untether. History crystallizes, unchanging. Momentum dies. Eternity locks in place.',
  },

  /** Entropy — dissolution, decay, randomness, ending */
  entropy: {
    high: 'Entropy spreads. Decay accelerates. All forms dissolve toward chaos. The World-Soul fragments and scatters. Endings multiply. Nothing persists.',
    low: 'Entropy retreats. Decay halts. Forms cohere and persist. The World-Soul holds itself together. Endings pause. Permanence settles.',
  },
};

/**
 * ═══════════════════════════════════════════════════════════════════
 * RESONANCE FRAGMENT PROSE — 8 memory templates
 *
 * These are whispers from previous cycles — memories the World-Soul
 * carries forward into the next game. They appear in the Ascendant scry,
 * in echo selection, and in chronicle events where the past intrudes.
 *
 * Templates may include variables like {sphere}, {actor}, {location}, {era}
 * which are filled in by the narrative engine at runtime.
 *
 * Tone: ancient, fragmented, haunting — memory corrupted by infinite cycles.
 * ═══════════════════════════════════════════════════════════════════
 */
export const RESONANCE_FRAGMENT_PROSE: string[] = [
  'The World-Soul recalls a time when {sphere} ruled unchallenged—a reign that lasted {era}, until rival tides overwhelmed the throne.',

  'A threadbare memory drifts like ash: {actor} once stood at the apex of the Nine Reaches, only to fall into an abyss of their own making.',

  'Whispers persist of {location}, a place where magic burned so bright that reality itself cracked. The scars remain, invisible but deep.',

  'The World-Soul holds a fragmented echo: a war between the {sphere} and {otherSphere} that reshaped the cosmos. The victors are long forgotten.',

  'There was a cycle—{eons} ago—when a mortal dared to challenge the divine. The echoes of that hubris still ripple through the Fundament.',

  'A phantom sensation lingers: the moment when {sphere} first manifested in the World-Soul, raw and terrible and alive. Nothing has been the same.',

  'The World-Soul dreams of {era}, when the boundaries between cycles were thin enough to breach. Something escaped. Something returned.',

  'A resonance remains of the day {location} fell silent—not destroyed, but erased from memory itself. Yet the World-Soul cannot quite forget.',
];
