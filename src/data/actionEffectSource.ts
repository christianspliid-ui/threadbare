/**
 * Action effect-source derivation (THR-604 substrate; surfaced in-game by THR-610).
 *
 * A single, code-true classifier for WHERE a template's mechanical effect is
 * actually wired. Pairs with the authored `technicalEffect` string (what the
 * action does) to answer whether — and how — that effect ships.
 *
 * Shared source of truth: the action-catalog generator (`scripts/generate-action-catalog.ts`),
 * the in-game ActionDrawer focused card, and the Codex all read this so the
 * wiring badge never drifts between the external catalog and the live game.
 */

import {
  isActionStepBranch,
  type UnifiedActionTemplate,
  type ActionStepOrBranch,
} from '../types/unifiedAction';
import { ENGINE_EFFECT_TEMPLATE_IDS } from '../engine/engineEffectRegistry';

/**
 * Where a template's mechanical effect is actually wired. Derived, not authored.
 * Precedence (first match wins): a template may match several; the order is a
 * display choice, not a semantic ranking.
 *   template-ops   — a step carries GraphOps (onSuccess/onFailure)
 *   control-spec   — sustained effect via controlSpec
 *   engine-bridge  — id-keyed engine handling (ENGINE_EFFECT_TEMPLATE_IDS)
 *   aftermath-only — only aftermathConfig / secretDiscovery / revelationAction
 *   none           — nothing changes world state (a genuine no-op)
 */
export type EffectSource =
  | 'template-ops'
  | 'control-spec'
  | 'engine-bridge'
  | 'aftermath-only'
  | 'none';

/** Does this step (or any branch variant / fallback) carry non-empty GraphOps? */
function stepHasOps(step: ActionStepOrBranch): boolean {
  if (isActionStepBranch(step)) {
    return [step.fallback, ...Object.values(step.variants)].some(
      (s) => s.onSuccess.length > 0 || s.onFailure.length > 0,
    );
  }
  return step.onSuccess.length > 0 || step.onFailure.length > 0;
}

/** Classify where a template's effect is wired. Pure, deterministic. */
export function effectSourceFor(template: UnifiedActionTemplate): EffectSource {
  if (template.steps.some(stepHasOps)) return 'template-ops';
  if (template.controlSpec != null) return 'control-spec';
  if (ENGINE_EFFECT_TEMPLATE_IDS.has(template.id)) return 'engine-bridge';
  if (
    template.aftermathConfig != null ||
    template.secretDiscovery != null ||
    template.revelationAction != null
  ) {
    return 'aftermath-only';
  }
  return 'none';
}

/**
 * Player-facing label for an effect source. Tells whether (and how) an action's
 * mechanical effect is actually wired. Mirrors the external action-catalog HTML
 * (`public/action-catalog.html`) so the in-game badge reads the same.
 */
export const EFFECT_SOURCE_LABELS: Readonly<Record<EffectSource, string>> = {
  'template-ops': 'wired · template',
  'engine-bridge': 'wired · engine',
  'control-spec': 'sustained',
  'aftermath-only': 'aftermath',
  none: 'not wired',
};

/** Resolve an effect-source label, tolerant of an unexpected value. */
export function effectLabel(src: EffectSource): string {
  return EFFECT_SOURCE_LABELS[src] ?? src;
}

/**
 * Wiring-badge background colours, mirroring the external catalog HTML
 * (`.badge--effect.src-*` in `public/action-catalog.html`). Green = wired,
 * teal = engine bridge, purple = sustained, amber = aftermath, red = not wired.
 */
export const EFFECT_SOURCE_BADGE_COLORS: Readonly<Record<EffectSource, string>> = {
  'template-ops': '#2e6b3e',
  'engine-bridge': '#1a5a5a',
  'control-spec': '#4a2d6a',
  'aftermath-only': '#a06a12',
  none: '#9a3a3a',
};
