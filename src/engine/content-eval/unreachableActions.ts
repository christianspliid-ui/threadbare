/**
 * THR-659 — Unreachable-action inspector.
 *
 * Since THR-501 emptied the starter floor (`STARTER_ACTION_IDS = []`), the ONLY
 * paths a player-facing action template can reach a run are (1) a static Ascendant /
 * milestone Beat grant (`collectGrantedActionIds()`), (2) a starter (flag or
 * `STARTER_ACTION_IDS`), or (3) a *dynamic* reach-signature grant — the `invest.*`
 * signature ids that the acquisition beat resolves per-run from the ascendant's own
 * reaches (`REACH_SIGNATURE_ID_BY_REACH`), which no static `grantsActionIds` can name
 * (THR-523). Any player-castable template outside all three is **unreachable forever**:
 * a card that ships in `UNIFIED_ACTION_TEMPLATES`, passes tests, renders in the
 * styleguide, yet no playthrough can ever hold.
 *
 * (The plan's original formula counted only static beat grants; the executor confirmed
 * against the runtime — per the plan's "confirm before coding" note — that reach
 * signatures are granted dynamically and encounter-aftermath `unlock_action` grants no
 * ascendant-castable template today, so the dynamic-signature source is folded in here to
 * keep the report honest. THR-659.)
 *
 * This module turns that set-difference — previously hand-tracked in session memory
 * (`loc.bless_harvest` / `loc.ward` / `loc.fortify` / `loc.place_of_power`) — into a
 * deterministic, inspectable query (NFP #2). It mirrors the THR-490 `proseQualityReport`
 * pattern: pure over static content, no `GameState`, no tick, no PRNG. It never runs in
 * the tick loop; it is invoked on demand from `__DEBUG` / the DebugPanel only.
 *
 * It DETECTS orphans; it never grants. Wiring an orphaned card into a beat is
 * progression/content work under THR-613's project, not this inspector.
 */

import type { UnifiedActionTemplate } from '../../types/unifiedAction';
import { UNIFIED_ACTION_TEMPLATES } from '../../data/unified-action-templates';
import { collectGrantedActionIds } from '../../data/ascendant-beat-content';
import { REACH_SIGNATURE_ID_BY_REACH } from '../../data/reach-signature-content';
import { STARTER_ACTION_IDS } from '../actionUnlock';

export interface UnreachableActionEntry {
  /** Template id, e.g. 'loc.fortify'. */
  id: string;
  /** template.name for display. */
  name: string;
  /** template.reach (or 'none' when absent). */
  reach: string;
  /** template.crudType — the raw CRUD verb (create | read | update | delete), or 'unknown'. */
  crudType: string;
  /** Single reason for v1: never a starter, never beat-granted. */
  reason: 'not-granted';
}

export interface UnreachableActionReport {
  /** Orphaned player-reachable templates, sorted by id ascending. */
  entries: UnreachableActionEntry[];
  summary: {
    /** Denominator: templates that COULD be surfaced to the player. */
    playerReachableTemplates: number;
    /** Count of player-reachable templates that a beat statically grants. */
    granted: number;
    /** Count of player-reachable templates that are starters (starter flag or STARTER_ACTION_IDS). */
    starter: number;
    /** Count of player-reachable templates reachable via a dynamic reach-signature grant (invest.*). */
    dynamicSignature: number;
    /** entries.length — orphaned player-reachable templates. */
    unreachable: number;
  };
  /**
   * Loud-but-alive fail-soft note. Set when `collectGrantedActionIds()` could not be
   * read (see fail-soft table in the plan doc); absent on the happy path.
   */
  warning?: string;
}

/**
 * The single auditable definition of "player-reachable template".
 *
 * The player-facing action surfaces (ActionDrawer, AscendantBeat) draw their pool
 * from `getTargetActionSlots` (`src/engine/targetActions.ts`), which `useTargetActions`
 * feeds the FULL `UNIFIED_ACTION_TEMPLATES` array. That array mixes player-castable
 * cards (divine / location / attachment / sublocation / hex / thread verbs) with mortal
 * encounter templates (guild / social / combat). The structural line between them is
 * `actorAffinities`: player cards are cast by the ascendant and carry `'ascendant'` in
 * `actorAffinities`; mortal encounter templates carry `'individual'`. We use that as the
 * denominator so mortal encounter templates (never granted, and correctly so) are not
 * mis-reported as orphaned player cards.
 *
 * NOTE: `getTargetActionSlots` does not itself gate on `actorAffinities` — the unlock
 * gate (`isActionRevealed`) hides everything ungranted regardless. The affinity check
 * here is purely the universe boundary for THIS report, cited to the drawer source above.
 */
function isPlayerReachableTemplate(template: UnifiedActionTemplate): boolean {
  return template.actorAffinities?.includes('ascendant') ?? false;
}

/**
 * Report player-castable action templates that no run can ever surface — neither a
 * starter nor granted by any Ascendant / milestone Beat. Pure, deterministic, and
 * session-independent: same static registries → same report.
 */
export function reportUnreachableActions(): UnreachableActionReport {
  // Granted set — fail-soft: a throw or non-array degrades to an empty granted set
  // and a loud warning, so the report degrades to "everything looks unreachable"
  // rather than crashing the dev tool.
  let grantedIds: readonly string[] = [];
  let warning: string | undefined;
  try {
    const raw = collectGrantedActionIds();
    if (Array.isArray(raw)) {
      grantedIds = raw;
    } else {
      warning = 'collectGrantedActionIds() returned a non-array — treating granted set as empty.';
    }
  } catch (err) {
    warning = `collectGrantedActionIds() threw (${err instanceof Error ? err.message : String(err)}) — treating granted set as empty.`;
  }
  const granted = new Set(grantedIds);
  const starter = new Set([...STARTER_ACTION_IDS]);
  // Dynamic reach-signature ids (invest.*) — granted per-run by the signature-acquisition
  // beat, so they never appear in the static `collectGrantedActionIds()` list yet are
  // definitively reachable (every ascendant acquires its in-domain signatures; across all
  // ascendants, all eight are reachable). See REACH_SIGNATURE_ID_BY_REACH / THR-523.
  const dynamicSignatures = new Set(
    Object.values(REACH_SIGNATURE_ID_BY_REACH).filter((id): id is string => typeof id === 'string'),
  );

  const isStarter = (t: UnifiedActionTemplate): boolean => t.starter === true || starter.has(t.id);
  const isReachable = (t: UnifiedActionTemplate): boolean =>
    granted.has(t.id) || isStarter(t) || dynamicSignatures.has(t.id);

  const universe = UNIFIED_ACTION_TEMPLATES.filter(isPlayerReachableTemplate);

  const entries: UnreachableActionEntry[] = universe
    .filter((t) => !isReachable(t))
    .map((t) => ({
      id: t.id,
      name: t.name ?? '(unnamed)',
      reach: t.reach ?? 'none',
      crudType: t.crudType ?? 'unknown',
      reason: 'not-granted' as const,
    }))
    .sort((a, b) => a.id.localeCompare(b.id));

  return {
    entries,
    summary: {
      playerReachableTemplates: universe.length,
      granted: universe.filter((t) => granted.has(t.id)).length,
      starter: universe.filter(isStarter).length,
      dynamicSignature: universe.filter((t) => dynamicSignatures.has(t.id)).length,
      unreachable: entries.length,
    },
    ...(warning ? { warning } : {}),
  };
}
