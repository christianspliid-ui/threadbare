/**
 * Action unlock predicates — THR-419 Starter 12.
 *
 * The Starter 12 is the always-available floor: twelve action templates that
 * every player sees on turn 1, regardless of ascendant identity, unlocks, or
 * run mutator. The other ~80+ templates in the catalog are hidden until the
 * player earns them through meta-progression (future Phase 2).
 *
 * This module is pure — no GameState mutation, no side effects. The runtime
 * gate (Gate 8 in `getTargetActionSlots`) calls `isActionRevealed` per template
 * to decide whether the action surfaces in the drawer at all (locked actions
 * are absent, not shown as silhouettes).
 */
import type { UnifiedActionTemplate } from '../types/unifiedAction';

// ─── Tunable constants (NFP #1) ──────────────────────────────────────

/** Size of the Starter 12 baseline. Enforced by template-data test. */
export const STARTER_ACTION_COUNT = 12;

/**
 * Canonical Starter 12 IDs.
 *
 * Order is presentation order (top-left to bottom-right in the drawer when
 * starter ordering is wired in Phase 2). Each template carrying these IDs
 * MUST also be tagged with `starter: true` in `unified-action-templates.ts`.
 * That redundancy is intentional — the constant set is the data fail-soft
 * floor; the per-template flag is the editorial declaration.
 *
 * Selection rationale (plan §4): coverage of target types (agent + hex),
 * coverage of the four classic god-personas (subtle / kind / wrathful /
 * devious), and prose density. Faction / army / artifact starters are
 * intentionally absent — those targets are themselves unlocks.
 */
export const STARTER_ACTION_IDS: readonly string[] = [
  'bind_thread_agent',
  'bind_thread_location',
  'hex.survey',
  'observe_agent',
  'hex.whisper_intuition',
  'divine.dream',
  'divine.persuade',
  'divine.deceive',
  'divine.intimidate',
  'divine.coincidence',
  'hex.bless_land',
  'hex.mark_ground',
] as const;

const STARTER_ID_SET: ReadonlySet<string> = new Set(STARTER_ACTION_IDS);

// ─── Predicates ──────────────────────────────────────────────────────

/**
 * True if the template should be visible in the action drawer given the
 * player's current unlock state.
 *
 * Resolution order (NFP #1 — tunable; NFP #4 — fail-soft):
 *   1. `template.starter === true` → always visible (editorial declaration).
 *   2. `STARTER_ACTION_IDS` contains `template.id` → always visible
 *      (data fail-soft for templates missing the editorial flag).
 *   3. `unlockedActionIds` contains `template.id` → visible (earned unlock).
 *   4. Otherwise → hidden.
 *
 * Locked actions are *absent* from the drawer, not shown as silhouettes.
 * Unlock hints surface elsewhere (Codex, unlock notifications).
 */
export function isActionRevealed(
  template: Pick<UnifiedActionTemplate, 'id' | 'starter'>,
  unlockedActionIds: readonly string[] | undefined,
): boolean {
  if (template.starter === true) return true;
  if (STARTER_ID_SET.has(template.id)) return true;
  if (!unlockedActionIds || unlockedActionIds.length === 0) return false;
  return unlockedActionIds.includes(template.id);
}

/**
 * True if the template is part of the always-available Starter 12 baseline.
 * Used by Codex/DebugPanel categorisation, not the runtime gate.
 */
export function isStarterAction(
  template: Pick<UnifiedActionTemplate, 'id' | 'starter'>,
): boolean {
  return template.starter === true || STARTER_ID_SET.has(template.id);
}
