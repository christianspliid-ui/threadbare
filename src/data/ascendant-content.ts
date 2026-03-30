/**
 * Ascendant Content Package — Titles and flavor for player-god identity.
 *
 * ═══════════════════════════════════════════════════════════════════
 * CONTENT MANAGER: Edit this file to change ascendant archetype titles,
 * the names players see when choosing their divine identity.
 * ═══════════════════════════════════════════════════════════════════
 */

import type { SphereName } from '../types/index';

/**
 * Archetype titles for each Creation Sphere.
 * Used in ascendant.ts generateArchetypes() to name player god options.
 * More titles = more variety across runs.
 */
export const ARCHETYPE_TITLES: Record<SphereName, string[]> = {
  chaos: [
    'The Unbound', 'The Storm Without Name', 'The Wildfire Throne',
    'The Unchained', 'The Shatterer', 'The First Disruption',
    'The Whirlwind Sovereign', 'The Unwritten',
  ],
  order: [
    'The Law Eternal', 'The Iron Covenant', 'The Structure',
    'The Unerring', 'The Foundation Imperishable', 'The Measured One',
    'The Sealed Oath', 'The Architecture',
  ],
  light: [
    'The Exposed Truth', 'The Burning Clarity', 'The Daybreak',
    'The Unveiled', 'The Luminous Throne', 'The Beacon Eternal',
    'The Clear-Eyed', 'The Sun\'s Witness',
  ],
  darkness: [
    'The Hidden', 'The Veil Sovereign', 'The Night\'s Counsel',
    'The Obscured', 'The Shadow Throne', 'The Secret Keeper',
    'The Unseen Hand', 'The Silence Between',
  ],
  force: [
    'The Warlord Ascendant', 'The Iron Sovereign', 'The Storm Marshal',
    'The Hammer of Heaven', 'The Unbroken', 'The Siege Eternal',
    'The Thunder-Crowned', 'The Blade Imperishable',
  ],
  matter: [
    'The Stone Architect', 'The Foundation Lord', 'The Earthshaper',
    'The Mountain\'s Heart', 'The Bedrock Throne', 'The Unyielding One',
    'The Deep Root', 'The Iron Scaffold',
  ],
  energy: [
    'The Flame Herald', 'The Lightning Weaver', 'The Radiant One',
    'The Burning Crown', 'The Spark Undying', 'The Cascade',
    'The Sun-Forged', 'The Wildfire Sovereign',
  ],
  life: [
    'The Verdant One', 'The Bloom Shepherd', 'The Lifebinder',
    'The Green Throne', 'The Rootmother', 'The Tide of Spring',
    'The Evergrowing', 'The Harvest Lord',
  ],
  mind: [
    'The Dream Architect', 'The Thought Weaver', 'The Silent Oracle',
    'The Knowing Eye', 'The Labyrinth', 'The Question Eternal',
    'The Lucid Crown', 'The Unblinking',
  ],
  spirit: [
    'The Veil Walker', 'The Soul Shepherd', 'The Ethereal Guide',
    'The Between', 'The Ghost Sovereign', 'The Thread-Singer',
    'The Twilight Keeper', 'The Hollow Saint',
  ],
  time: [
    'The Chronicler', 'The Moment Keeper', 'The Tide Turner',
    'The Hourglass Throne', 'The Patient One', 'The Epoch-Walker',
    'The Memory-Crowned', 'The Unfinished',
  ],
  entropy: [
    'The Unraveler', 'The Ash Herald', 'The Void Whisperer',
    'The Final Word', 'The Rust Sovereign', 'The Fraying',
    'The Quiet End', 'The Moth-Touched',
  ],
};
