/**
 * Sphere Tooltip Registry — narrative concept descriptions for all 8 creation spheres
 * and 4 foundation forces (chaos, order, light, darkness).
 *
 * These are NEVER shown as numbers. All player-facing sphere info is prose.
 * Used by ProseKeyword (IPK) component for keyword hover tooltips.
 *
 * Design doc: Docs/plans/2026-03-28-world-soul-connection-design.md
 */

import type { SphereName } from '../types';

// ─── Creation Sphere Tooltips ─────────────────────────────────────────────────

export const SPHERE_TOOLTIPS: Record<SphereName, string> = {
  force:
    'The sphere of strength, conflict, and direct action. Where Force is strong, warriors thrive and the weak are tested. Force opposes Energy and allies with Matter.',
  matter:
    'The sphere of earth, craft, and endurance. Where Matter holds firm, structures endure and the land itself resists change. Matter opposes Spirit and allies with Force.',
  energy:
    'The sphere of motion, change, and vitality. Where Energy flows, nothing stays still for long — trade moves, ideas spread, and stagnation retreats. Energy opposes Force and allies with Life.',
  life:
    'The sphere of growth, healing, and abundance. Where Life pulses strong, harvests are rich, wounds close fast, and nature reclaims what was lost. Life opposes Entropy and allies with Energy.',
  mind:
    'The sphere of thought, knowledge, and reason. Where Mind is keen, mysteries unravel and plans run deep. Mind opposes Time and allies with Spirit.',
  spirit:
    'The sphere of faith, intuition, and the unseen. Where Spirit is strong, prayers find answers and the veil between worlds grows thin. Spirit opposes Matter and allies with Mind.',
  time:
    'The sphere of patience, memory, and inevitability. Where Time runs deep, the old ways endure and prophecy carries weight. Time opposes Mind and allies with Entropy.',
  entropy:
    'The sphere of decay, transformation, and endings. Where Entropy gathers, the old crumbles to make way for what comes next — or for nothing at all. Entropy opposes Life and allies with Time.',
};

// ─── Foundation Force Tooltips ────────────────────────────────────────────────

export const FOUNDATION_TOOLTIPS: Record<string, string> = {
  chaos:
    'The primal foundation of possibility and disorder. Chaos seeds change, breaks the grip of the old order, and opens paths that were never meant to exist. Too much Chaos and nothing endures.',
  order:
    'The primal foundation of structure and law. Order builds empires, holds knowledge across generations, and makes promises that bind. Too much Order and nothing ever changes.',
  light:
    'The primal foundation of revelation and clarity. Light exposes hidden truths, empowers honest counsel, and burns away deceit. Where Light grows strong, nothing stays secret for long.',
  darkness:
    'The primal foundation of mystery and concealment. Darkness nurtures hidden things — secrets, long plans, and the spaces between known truths. Where Darkness spreads, even the gods grow uncertain.',
};
