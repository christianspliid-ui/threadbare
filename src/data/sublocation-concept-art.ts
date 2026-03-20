/**
 * Placeholder concept art definitions for sublocation types.
 *
 * Each entry provides a CSS gradient, glyph, and atmosphere label
 * used as visual placeholders until real concept art is produced.
 */

export interface SublocationConceptArt {
  /** CSS gradient for the banner background */
  gradient: string;
  /** Unicode glyph displayed over the gradient */
  glyph: string;
  /** Short atmospheric label */
  label: string;
  /** Accent color for the glyph overlay */
  glyphColor: string;
}

/**
 * Maps sublocation-type IDs to concept art definitions.
 * NFP #1 (Tunability): Add or tweak visuals here.
 */
export const SUBLOCATION_CONCEPT_ART: Record<string, SublocationConceptArt> = {
  'sublocation-type.market-district': {
    gradient: 'linear-gradient(135deg, #2a1f0e 0%, #4a3520 40%, #6b4c2a 70%, #3d2b14 100%)',
    glyph: '\u2696', // balance scales
    label: 'Market District',
    glyphColor: '#d4a54a',
  },
  'sublocation-type.temple-quarter': {
    gradient: 'linear-gradient(135deg, #1a1a2e 0%, #2d1b4e 40%, #4a2872 70%, #1a1a2e 100%)',
    glyph: '\u2740', // six-petalled florette
    label: 'Temple Quarter',
    glyphColor: '#b89adb',
  },
  'sublocation-type.barracks': {
    gradient: 'linear-gradient(135deg, #1c1c1c 0%, #3a2a2a 40%, #5c3a3a 70%, #2a1a1a 100%)',
    glyph: '\u2694', // crossed swords
    label: 'Barracks',
    glyphColor: '#c47a5a',
  },
  'sublocation-type.throne-room': {
    gradient: 'linear-gradient(135deg, #1a0f2e 0%, #2e1a4a 40%, #4a2a6a 70%, #3a1a5a 100%)',
    glyph: '\u265A', // chess king
    label: 'Throne Room',
    glyphColor: '#e8c44a',
  },
  'sublocation-type.garden': {
    gradient: 'linear-gradient(135deg, #0e2a1a 0%, #1a4a2a 40%, #2a6a3a 70%, #1a3a2a 100%)',
    glyph: '\u2766', // floral heart
    label: 'Garden',
    glyphColor: '#7adb8a',
  },
  'sublocation-type.dungeon': {
    gradient: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 40%, #2a2028 70%, #0e0e0e 100%)',
    glyph: '\u26D3', // chains
    label: 'Dungeon',
    glyphColor: '#8a8a9a',
  },
  'sublocation-type.prison': {
    gradient: 'linear-gradient(135deg, #1a1a1a 0%, #2a2020 40%, #3a2a2a 70%, #1a1010 100%)',
    glyph: '\u26D3', // chains
    label: 'Prison',
    glyphColor: '#9a7a6a',
  },
  'sublocation-type.library': {
    gradient: 'linear-gradient(135deg, #1a1a0e 0%, #2a2a1a 40%, #4a3a2a 70%, #2a2010 100%)',
    glyph: '\u{1F4DC}', // scroll
    label: 'Library',
    glyphColor: '#d4ba7a',
  },
  'sublocation-type.archive': {
    gradient: 'linear-gradient(135deg, #1a1a14 0%, #2e2e20 40%, #3a3a2a 70%, #22221a 100%)',
    glyph: '\u{1F4DA}', // books
    label: 'Archive',
    glyphColor: '#b8a878',
  },
  'sublocation-type.crypt': {
    gradient: 'linear-gradient(135deg, #0e0e14 0%, #1a1a28 40%, #2a2a3a 70%, #14141e 100%)',
    glyph: '\u2620', // skull and crossbones
    label: 'Crypt',
    glyphColor: '#8a9aaa',
  },
  'sublocation-type.forge': {
    gradient: 'linear-gradient(135deg, #2a0e0a 0%, #4a1a0e 40%, #6a2a1a 70%, #3a1a0e 100%)',
    glyph: '\u2692', // hammer and pick
    label: 'Forge',
    glyphColor: '#ea7a3a',
  },
};

/**
 * Look up concept art for a sublocation type ID.
 * Fail-soft: returns a neutral fallback for unknown types.
 */
export function getSublocationConceptArt(sublocationTypeId: string): SublocationConceptArt {
  return SUBLOCATION_CONCEPT_ART[sublocationTypeId] ?? {
    gradient: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 40%, #1e1e1e 100%)',
    glyph: '\u2726', // four-pointed star
    label: 'Unknown',
    glyphColor: '#6a6a7a',
  };
}
