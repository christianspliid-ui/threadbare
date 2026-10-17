/**
 * THR-1936 S1 — the outcome-table content gate.
 *
 * Every template that carries `outcomeEffects` (and every aftermath variant that does)
 * is checked here, so the S2 and S3 rows land on rules that already hold:
 *
 * - bands are bands the roll produces when the table is read. `contested_won` /
 *   `contested_lost` are refused: a group contest stamps them after resolution, so a row
 *   keyed on one would never fire (review gate, THR-1936);
 * - a `means` amount is one of the named steps (`MEANS_STEP_SMALL` / `MEANS_STEP` /
 *   `MEANS_STEP_BIG`), signed;
 * - a shift targets the actor or the scene target. A `$cast:` target is refused until
 *   S2 ships the first cast-targeted row with its binding check (a declared cast key
 *   may be bind-only);
 * - no template writes `wealth` through `update_node` (it neither clamps nor stamps a
 *   reason). Today's legacy offenders are listed and frozen: a new one fails;
 * - no template writes Means in both its table and a reaction (a double charge);
 * - a table that costs the actor Means on a failure band carries `stakes` whose `risk`
 *   and `lost` name the loss, so the player is told before the roll (PC-2).
 */
import { describe, it, expect } from 'vitest';
import {
  CACHE_REGISTERED_REGIONAL_TEMPLATES,
  LOCATION_BRANCHING_ENCOUNTER_TEMPLATES,
  UNIFIED_ACTION_TEMPLATES,
} from '../unified-action-templates';
import { MEANS_NAMED_STEPS } from '../mortal-means-constants';
import {
  runnableStepSites,
  type AftermathVariant,
  type EncounterAftermathReactionEffect,
  type OutcomeEffectsTable,
  type UnifiedActionTemplate,
} from '../../types/unifiedAction';

const BANDS = new Set([
  'success', 'failure', 'critical_success', 'critical_failure', 'success_at_cost',
]);
const FAILURE_BANDS = ['failure', 'critical_failure'] as const;
/** Words a stakes clause may use to name a money loss. */
const LOSS_WORDS = /\b(coin|coins|poorer|purse|money|silver|gold|fee|debt|ruin|ruined|cost|paid|pay)\b/i;

/**
 * Legacy `action-template-content.ts` ops that write `wealth` through `update_node`.
 * Unreachable today (plan § Notes for the executor); listed so a new one fails. Do not
 * add to this list — write Means through an outcome table instead.
 */
const KNOWN_UPDATE_NODE_WEALTH_OFFENDERS: readonly string[] = [
  // The first run of this gate on main @ ba1f1ade (THR-1936).
  'action.gold.break-agreement',
  'action.gold.buy-influence',
  'action.gold.commission-assassination',
  'action.gold.disrupt-trade',
  'action.gold.establish-monopoly',
  'action.gold.establish-trade',
  'action.gold.fund-construction',
  'action.gold.hire-mercenaries',
  'action.gold.negotiate-agreement',
  'action.gold.tax-trade-route',
  'action.gold.trade',
];

function allTemplates(): UnifiedActionTemplate[] {
  const byId = new Map<string, UnifiedActionTemplate>();
  for (const t of [
    ...UNIFIED_ACTION_TEMPLATES,
    ...LOCATION_BRANCHING_ENCOUNTER_TEMPLATES,
    ...CACHE_REGISTERED_REGIONAL_TEMPLATES,
  ]) {
    if (!byId.has(t.id)) byId.set(t.id, t);
  }
  return [...byId.values()];
}

function variantsOf(t: UnifiedActionTemplate): AftermathVariant[] {
  const c = t.aftermathConfig;
  if (!c) return [];
  return [...Object.values(c.variants), c.fallback].filter(Boolean);
}

function tablesOf(t: UnifiedActionTemplate): { where: string; table: OutcomeEffectsTable }[] {
  const out: { where: string; table: OutcomeEffectsTable }[] = [];
  if (t.outcomeEffects) out.push({ where: t.id, table: t.outcomeEffects });
  variantsOf(t).forEach((v, i) => {
    if (v.outcomeEffects) out.push({ where: `${t.id} variant ${i}`, table: v.outcomeEffects });
  });
  return out;
}

function meansShifts(effects: readonly EncounterAftermathReactionEffect[] | undefined) {
  return (effects ?? []).filter(
    (e): e is Extract<EncounterAftermathReactionEffect, { kind: 'economy_shift' }> =>
      e.kind === 'economy_shift' && e.quantity === 'means',
  );
}

function writesUpdateNodeWealth(t: UnifiedActionTemplate): boolean {
  for (const { step } of runnableStepSites(t.steps)) {
    for (const op of [...(step.onSuccess ?? []), ...(step.onFailure ?? [])]) {
      const o = op as unknown as { op?: string; changes?: Record<string, unknown> };
      if (o.op === 'update_node' && o.changes && 'wealth' in o.changes) return true;
    }
  }
  return false;
}

describe('THR-1936 — outcome tables', () => {
  const templates = allTemplates();

  it('at least one shipped template carries an outcome table (the S1 seed row)', () => {
    expect(templates.some(t => tablesOf(t).length > 0)).toBe(true);
  });

  it('keys every table on a band the roll produces', () => {
    const bad: string[] = [];
    for (const t of templates) {
      for (const { where, table } of tablesOf(t)) {
        for (const band of Object.keys(table)) if (!BANDS.has(band)) bad.push(`${where}: ${band}`);
      }
    }
    expect(bad).toEqual([]);
  });

  it('puts every Means amount on a named step and targets the actor or the scene target', () => {
    const bad: string[] = [];
    for (const t of templates) {
      for (const { where, table } of tablesOf(t)) {
        for (const [band, effects] of Object.entries(table)) {
          for (const e of meansShifts(effects)) {
            if (!MEANS_NAMED_STEPS.includes(Math.abs(e.amount))) bad.push(`${where} ${band}: amount ${e.amount}`);
            const target = e.targetAgentId;
            if (target !== undefined && target !== '$actor' && target !== '$target') {
              bad.push(`${where} ${band}: target ${target}`);
            }
          }
        }
      }
    }
    expect(bad).toEqual([]);
  });

  it('never writes wealth through update_node beyond the frozen legacy list', () => {
    const offenders = templates.filter(writesUpdateNodeWealth).map(t => t.id).sort();
    const fresh = offenders.filter(id => !KNOWN_UPDATE_NODE_WEALTH_OFFENDERS.includes(id));
    expect(fresh).toEqual([]);
  });

  it('never writes Means in both the table and a reaction', () => {
    const bad: string[] = [];
    for (const t of templates) {
      if (tablesOf(t).every(({ table }) => Object.values(table).every(e => meansShifts(e).length === 0))) continue;
      for (const v of variantsOf(t)) {
        for (const r of v.reactions ?? []) {
          if (meansShifts(r.effects).length > 0) bad.push(`${t.id} reaction ${r.id}`);
        }
      }
    }
    expect(bad).toEqual([]);
  });

  it('names the loss in the stakes when a failure band costs the actor Means', () => {
    const bad: string[] = [];
    for (const t of templates) {
      const costs = tablesOf(t).some(({ table }) =>
        FAILURE_BANDS.some(band => meansShifts(table[band]).some(e =>
          e.amount < 0 && (e.targetAgentId === undefined || e.targetAgentId === '$actor'))));
      if (!costs) continue;
      if (!t.stakes) { bad.push(`${t.id}: no stakes`); continue; }
      if (!LOSS_WORDS.test(t.stakes.risk)) bad.push(`${t.id}: risk "${t.stakes.risk}"`);
      if (!LOSS_WORDS.test(t.stakes.lost)) bad.push(`${t.id}: lost "${t.stakes.lost}"`);
    }
    expect(bad).toEqual([]);
  });
});
