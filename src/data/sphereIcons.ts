/**
 * Sphere Icon Definitions — CSS-based sphere color + Unicode glyph mappings
 *
 * Each sphere has:
 * - color: the bright hex from STYLE.md (70-100% brightness, vivid magic color)
 * - symbol: Unicode geometric character that suggests the form language
 * - formLanguage: brief description of visual style
 *
 * These replace emoji icons with proper Threadbare sphere-colored glyphs.
 */

import type { SphereName } from '../types';

export interface SphereIconDef {
  /** Bright sphere color from STYLE.md (70-100% brightness) */
  color: string;
  /** Unicode geometric symbol (non-emoji) suggesting form language */
  symbol: string;
  /** Form language description for reference */
  formLanguage: string;
  /** Path to generated icon image (relative to public/) */
  imagePath: string;
}

/**
 * Creation Sphere icons — bright vivid colors with geometric Unicode symbols
 */
export const SPHERE_ICONS: Record<SphereName, SphereIconDef> = {
  // Force: Sharp directional streaks, impact radiants — crimson threads going fast
  force: {
    color: '#ff6b6b',
    symbol: '✦', // Four-pointed star suggests directional impact
    formLanguage: 'sharp directional streaks, impact radiants',
    imagePath: '/icons/spheres/force.png',
  },

  // Matter: Crystalline lattices, hexagonal facets — mineral-like structures
  matter: {
    color: '#d4a87a', // VS-103: brightened from #a8886a (53%) to ~70% perceived brightness
    symbol: '⬡', // Hexagon represents crystalline lattices
    formLanguage: 'crystalline lattices, hexagonal facets',
    imagePath: '/icons/spheres/matter.png',
  },

  // Energy: Radiating spikes, star-burst coronas — tiny suns pulsing outward
  energy: {
    color: '#ffe44d',
    symbol: '⊙', // Circle with center dot suggests radiant burst
    formLanguage: 'radiating spikes, star-burst coronas',
    imagePath: '/icons/spheres/energy.png',
  },

  // Life: Organic branching — veins, roots, mycelium, Fibonacci spirals
  life: {
    color: '#33ff77',
    symbol: '∿', // Squiggle/wave suggests organic branching
    formLanguage: 'organic branching — veins, roots, mycelium',
    imagePath: '/icons/spheres/life.png',
  },

  // Mind: Neural dendrites, concentric rings — eye-like nodes, mandala patterns
  mind: {
    color: '#44aaff',
    symbol: '◉', // Circle with center dot suggests neural/eye nodes
    formLanguage: 'neural dendrites, concentric rings',
    imagePath: '/icons/spheres/mind.png',
  },

  // Spirit: Ascending wisps, ethereal ribbons — smoke-like trails rising
  spirit: {
    color: '#cc66ff',
    symbol: '⟡', // Angular shape suggests ascending/ethereal quality
    formLanguage: 'ascending wisps, ethereal ribbons',
    imagePath: '/icons/spheres/spirit.png',
  },

  // Time: Concentric ripples, overlapping echoes — temporal distortion, clock-arcs
  time: {
    color: '#ffb355',
    symbol: '◈', // Double diamond suggests overlapping echoes/ripples
    formLanguage: 'concentric ripples, overlapping echoes',
    imagePath: '/icons/spheres/time.png',
  },

  // Entropy: Fracturing patterns, scattering particles — breaking apart, erosion
  entropy: {
    color: '#8fd4c0', // VS-103: brightened from #7aaa9a (59%) to ~70% perceived brightness
    symbol: '◆', // Solid diamond suggests fractured/broken structure
    formLanguage: 'fracturing patterns, scattering particles',
    imagePath: '/icons/spheres/entropy.png',
  },
};

/**
 * Foundation Sphere icons — cosmic forces (used for rival gods, etc.)
 */
export const FOUNDATION_SPHERE_ICONS: Record<'chaos' | 'order' | 'light' | 'darkness', SphereIconDef> = {
  // Chaos: Fractals and turbulent swirls — every tendril goes different direction
  chaos: {
    color: '#d4d4d8',
    symbol: '❋', // Six-pointed star suggests fractal branching
    formLanguage: 'fractals and turbulent swirls',
    imagePath: '/icons/spheres/chaos.png',
  },

  // Order: Geometric grids and tessellations — clean straight lines, sacred geometry
  order: {
    color: '#fbbf24',
    symbol: '◈', // Grid-like diamond pattern
    formLanguage: 'geometric grids and tessellations',
    imagePath: '/icons/spheres/order.png',
  },

  // Light: Expanding aureoles and radiant beams — warm radiance spreading outward
  light: {
    color: '#fef3c7',
    symbol: '☼', // Sun symbol represents radiant beams
    formLanguage: 'expanding aureoles and radiant beams',
    imagePath: '/icons/spheres/light.png',
  },

  // Darkness: Absorbing voids with rim-glow — deep indigo holes that pull light in
  darkness: {
    color: '#8b7fbf',
    symbol: '⦿', // Hollow circle with rim suggests void
    formLanguage: 'absorbing voids with rim-glow',
    imagePath: '/icons/spheres/darkness.png',
  },
};

/**
 * Wheel slot icons — action glyphs used in AgentWheel (non-emoji Unicode symbols)
 * Descriptive of the action type using simple geometric Unicode chars
 */
export const WHEEL_SLOT_GLYPHS: Record<string, string> = {
  scry: '●', // Circle = observation/seeing
  dream: '◇', // Diamond = alternative reality/vision
  persuade: '◆', // Filled diamond = influence/push
  deceive: '≋', // Wavy = disguise/illusion
  intimidate: '⚔', // Crossed swords = threat/combat
  inspire: '⬆', // Up arrow = elevation/uplift
  coincidence: '⊙', // Circled dot = chance/fate
  omen: '⬟', // Hexagon = mystical/sign
  afflict_bless: '★', // Star = magic/enchantment
};

/**
 * Get the bright color for a sphere (creation or foundation)
 */
export function getSphereColor(sphereName: string): string {
  const creation = SPHERE_ICONS[sphereName as SphereName];
  if (creation) return creation.color;

  const foundation = FOUNDATION_SPHERE_ICONS[sphereName as keyof typeof FOUNDATION_SPHERE_ICONS];
  if (foundation) return foundation.color;

  return '#d4a574'; // Fallback to amber
}

/**
 * Get the symbol for a sphere
 */
export function getSphereSymbol(sphereName: string): string {
  const creation = SPHERE_ICONS[sphereName as SphereName];
  if (creation) return creation.symbol;

  const foundation = FOUNDATION_SPHERE_ICONS[sphereName as keyof typeof FOUNDATION_SPHERE_ICONS];
  if (foundation) return foundation.symbol;

  return '●'; // Fallback to circle
}

/**
 * Get the image path for a sphere icon
 */
export function getSphereImagePath(sphereName: string): string | undefined {
  const creation = SPHERE_ICONS[sphereName as SphereName];
  if (creation) return creation.imagePath;

  const foundation = FOUNDATION_SPHERE_ICONS[sphereName as keyof typeof FOUNDATION_SPHERE_ICONS];
  if (foundation) return foundation.imagePath;

  return undefined;
}

/**
 * Get the wheel slot glyph
 */
export function getWheelSlotGlyph(slotId: string): string {
  return WHEEL_SLOT_GLYPHS[slotId] || '◯';
}

/**
 * RC-039: Agent color palette — hash-based color assignment for agent dots/badges.
 * Shared by HexZoomView and LocationView.
 */
const AGENT_COLOR_PALETTE = [
  '#cc3333',
  '#33cc66',
  '#6699ff',
  '#cc99ff',
  '#ff9933',
  '#ffcc00',
  '#8b7355',
  '#666666',
] as const;

/**
 * Deterministic color for an agent based on name hash.
 */
export function getAgentColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  return AGENT_COLOR_PALETTE[Math.abs(hash) % AGENT_COLOR_PALETTE.length];
}
