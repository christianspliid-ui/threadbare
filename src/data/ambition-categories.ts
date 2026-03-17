/**
 * Ambition category display constants — glyphs, colors, labels.
 *
 * Reuses the domain palette from the Nine Reaches:
 * dominion→Iron, mastery→Veil, vengeance→Shadow, legacy→Gold,
 * survival→Stone, discovery→Eye, devotion→Star.
 */
import type { AmbitionCategory } from '../types/ambition';

/** Unicode glyphs for each ambition category (Threadbare aesthetic, no emoji) */
export const CATEGORY_GLYPHS: Record<AmbitionCategory, string> = {
  dominion:  '◈',
  mastery:   '⚗',
  vengeance: '⚔',
  legacy:    '⟟',
  survival:  '⬡',
  discovery: '◎',
  devotion:  '✦',
};

/** Accent colors drawn from domain palette */
export const CATEGORY_COLORS: Record<AmbitionCategory, string> = {
  dominion:  '#8b4513',
  mastery:   '#7b68ee',
  vengeance: '#4f4f4f',
  legacy:    '#daa520',
  survival:  '#808080',
  discovery: '#20b2aa',
  devotion:  '#f0e68c',
};

/** Human-readable labels */
export const CATEGORY_LABELS: Record<AmbitionCategory, string> = {
  dominion:  'Dominion',
  mastery:   'Mastery',
  vengeance: 'Vengeance',
  legacy:    'Legacy',
  survival:  'Survival',
  discovery: 'Discovery',
  devotion:  'Devotion',
};
