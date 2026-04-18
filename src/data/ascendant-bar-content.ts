/**
 * Ascendant Bar — prose tables and content constants.
 *
 * All prose lives here; components must never inline copy.
 * Content lifted from prototype `Design/Claudedesignhandooffs/ascendant-bar/project/lib/AscendantBar.jsx`
 * and the authoritative spec `Design/Claudedesignhandooffs/ascendant-bar-prompt.md`.
 *
 * THR-184: Ascendant Bar
 */

import type { QuintessenceBand } from '../types/quintessence';
import type { SphereName } from '../types';

// ─── Archetype copy ──────────────────────────────────────────────────────────

export interface ArchetypeCopy {
  body: string;
}

export const ARCHETYPE_COPY: Record<string, ArchetypeCopy> = {
  Witness: {
    body: 'Those who watch, and whose watching changes what is watched. Witnesses tend the inward eye; they gather Mind and Spirit essence most readily, and their interventions carry weight because they were seen.',
  },
  Shaper: {
    body: 'Those who make the world bend to their will. Shapers press upon the world and find it yields, given the right angle.',
  },
  Keeper: {
    body: "Those who preserve what would otherwise be lost. A Keeper's presence is a quiet anchor, steadying what the world would sweep away.",
  },
  Breaker: {
    body: 'Those who unmake what was fixed. Everything the Breaker touches carries the potential to come apart — which can be ruin, or release.',
  },
};

// ─── Sphere copy ─────────────────────────────────────────────────────────────

export interface SphereCopy {
  label: string;
  role: string;
}

export const SPHERE_COPY: Partial<Record<SphereName, SphereCopy>> = {
  force:    { label: 'Force',    role: 'The weight of motion. Sphere of impact, inertia, and the push of one thing against another.' },
  matter:   { label: 'Matter',   role: "The substance of things. Sphere of earth, stone, and the world's physical weight." },
  energy:   { label: 'Energy',   role: 'The current that moves through all things. Sphere of heat, lightning, and momentum.' },
  life:     { label: 'Life',     role: 'The quickening in flesh. Sphere of growth, blood, and the urgency of living things.' },
  mind:     { label: 'Mind',     role: 'The inward eye. Sphere of thought, memory, intent. What it sees, it keeps; what it keeps, it carries.' },
  spirit:   { label: 'Spirit',   role: 'The still flame. Sphere of conviction, of what endures when the body does not.' },
  time:     { label: 'Time',     role: 'The current beneath all currents. Sphere of sequence, of before and after, of what cannot be taken back.' },
  entropy:  { label: 'Entropy',  role: 'The great loosening. Sphere of dissolution, decay, and the freedom that comes from letting go.' },
  chaos:    { label: 'Chaos',    role: 'The untranslated. Sphere of the unexpected, the discontinuous, the rupture that precedes new form.' },
  order:    { label: 'Order',    role: 'The shape that holds. Sphere of structure, law, and the scaffolding that makes meaning legible.' },
  light:    { label: 'Light',    role: 'The revealing. Sphere of clarity, truth, and the cost of being seen.' },
  darkness: { label: 'Darkness', role: 'The unlit places. Sphere of concealment, potential, and what waits when no one is watching.' },
};

// ─── Quintessence band tooltips ──────────────────────────────────────────────

export const BAND_TOOLTIP: Record<QuintessenceBand, { label: string; body: string }> = {
  transcendent: {
    label: 'transcendent',
    body: 'Your sphere holds you whole, and more. You act with uncommon clarity; essence gathers freely.',
  },
  healthy: {
    label: 'healthy',
    body: 'You hold. What is you, is you; the wind has not yet found the crack. Your capacity is full.',
  },
  strained: {
    label: 'strained',
    body: 'Something pulls at the seams. Not broken — but you feel the strain of holding yourself together.',
  },
  weakened: {
    label: 'weakened',
    body: 'Something is loose. The inward eye is slower to turn. Some verbs cost more than they should.',
  },
  critical: {
    label: 'critical',
    body: 'You are fraying. Every act bites. Without restoration you cannot long remain yourself.',
  },
  dissolving: {
    label: 'dissolving',
    body: 'You are barely you. The rings of the self smear when looked at directly. Unmaking is near.',
  },
};

// ─── Quintessence poetics (per-sphere extension point) ───────────────────────

/**
 * Extension point for per-sphere quintessence poetics.
 * Placeholder: all spheres fall back to the generic ladder until authored.
 * Content authors fill sphere-specific entries without refactoring the component.
 */
export const perSpherePoetics: Partial<Record<SphereName, Partial<Record<QuintessenceBand, string>>>> = {};

/** Generic quintessence ladder — used when no sphere-specific poetic exists. */
export const GENERIC_QUINTESSENCE_LADDER: Record<QuintessenceBand, string> = {
  transcendent: 'beyond full — something has come through',
  healthy:      'whole and present',
  strained:     'holding, but the seams show',
  weakened:     'something is slipping',
  critical:     'barely keeping the shape',
  dissolving:   'unraveling at the edges',
};

/** Get the poetic line for a sphere at a given quintessence band. */
export function quintessenceLine(sphere: SphereName, band: QuintessenceBand): string {
  return perSpherePoetics[sphere]?.[band] ?? GENERIC_QUINTESSENCE_LADDER[band];
}

// ─── Action tray empty-state copy ────────────────────────────────────────────

export const TRAY_EMPTY_COPY = {
  core: 'No core actions available.',
  self: 'No self-actions available.',
  rare: 'No rare actions in reach.',
} as const;

// ─── Mandate trend vocabulary ─────────────────────────────────────────────────

export const MANDATE_TREND_WORD: Record<string, string> = {
  rising:  'Kindling',
  steady:  'Holding',
  ebbing:  'Cooling',
  failing: 'Drifting',
};

export const MANDATE_TREND_COLOR: Record<string, string> = {
  rising:  'var(--positive)',
  steady:  'var(--text-secondary)',
  ebbing:  'var(--negative)',
  failing: 'var(--text-muted)',
};

export const MANDATE_TREND_ARROW: Record<string, string> = {
  rising:  '▲',
  steady:  '—',
  ebbing:  '▼',
  failing: '↓',
};
