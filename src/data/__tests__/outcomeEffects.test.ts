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
 * - a shift targets the actor, the scene target, or a `$cast:<key>` the template casts
 *   itself through a materializing actor spec (THR-1952: a declared cast key may be
 *   bind-only — a `pre-seeded` spec binds ambient scenery or nobody, and a purse
 *   written onto the wrong person is worse than none);
 * - no template writes `wealth` through `update_node` (it neither clamps nor stamps a
 *   reason). Today's legacy offenders are listed and frozen: a new one fails;
 * - no template writes Means in both its table and a reaction (a double charge);
 * - a table that costs the actor Means on a failure band carries `stakes` whose `risk`
 *   and `lost` name the loss, so the player is told before the roll (PC-2).
 *
 * THR-1953 (S3) adds the world rows:
 * - a world amount is one of its quantity's named steps (`ECONOMY_SHIFT_STEPS`, or a
 *   band-scaled staple amount from `harvestStockAmount`);
 * - a world row lands where the scene is (`$here` / `$target` / unset) — never a
 *   literal place a template cannot know; a stock row names a real good, `staple` or
 *   `deposit`; a purse row names its faction (`$realm`, a cast key, or a definition id);
 * - no template writes the same world quantity in both its table and a reaction.
 */
import { describe, it, expect } from 'vitest';
import {
  CACHE_REGISTERED_REGIONAL_TEMPLATES,
  LOCATION_BRANCHING_ENCOUNTER_TEMPLATES,
  UNIFIED_ACTION_TEMPLATES,
} from '../unified-action-templates';
import { MEANS_NAMED_STEPS } from '../mortal-means-constants';
import { economyShiftNamedSteps, STOCK_GOOD_DEPOSIT, STOCK_GOOD_STAPLE, type WorldEconomyQuantity } from '../economy-shift-constants';
import { RESOURCE_DEFINITIONS } from '../resource-content';
import { FACTION_DEFINITIONS } from '../faction-definitions';
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

function worldShifts(effects: readonly EncounterAftermathReactionEffect[] | undefined) {
  return (effects ?? []).filter(
    (e): e is Extract<EncounterAftermathReactionEffect, { kind: 'economy_shift' }> =>
      e.kind === 'economy_shift' && e.quantity !== 'means',
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

  it('carries the S2 Means rows of the outcome research table (THR-1952)', () => {
    // The 27 simple rows (merchants_gambit plus S2's 26) and the 15 branching rows
    // whose write names a mortal's Means. A row dropped by a refactor fails here.
    const withMeans = templates.filter(t => tablesOf(t).some(({ table }) =>
      Object.values(table).some(effects => meansShifts(effects).length > 0)));
    expect(withMeans.length).toBeGreaterThanOrEqual(40);
    for (const id of [
      'encounter.pickpocket', 'encounter.caravan_deal', 'encounter.sunken_vault',
      'encounter.town.counting_house_dispute', 'encounter.town.smugglers_ford',
    ]) {
      expect(withMeans.map(t => t.id), id).toContain(id);
    }
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

  it('puts every Means amount on a named step and targets the actor, the scene target or a cast member who binds', () => {
    const bad: string[] = [];
    for (const t of templates) {
      const specs = new Map((t.supportBundle ?? []).map(spec => [spec.key, spec]));
      for (const { where, table } of tablesOf(t)) {
        for (const [band, effects] of Object.entries(table)) {
          for (const e of meansShifts(effects)) {
            // THR-1969 — a band step (Fortune's Favour, Ruin) authors `amount: 0`; the write computes it.
            if (e.bandStep !== undefined) {
              if (e.amount !== 0) bad.push(`${where} ${band}: bandStep with amount ${e.amount}`);
            } else if (!MEANS_NAMED_STEPS.includes(Math.abs(e.amount))) bad.push(`${where} ${band}: amount ${e.amount}`);
            const target = e.targetAgentId;
            if (target === undefined || target === '$actor' || target === '$target') continue;
            if (target.startsWith('$cast:')) {
              const spec = specs.get(target.slice('$cast:'.length));
              if (!spec) bad.push(`${where} ${band}: ${target} is not in the supportBundle`);
              else if (spec.kind !== 'actor') bad.push(`${where} ${band}: ${target} is a '${spec.kind}' spec`);
              else if (spec.delivery === 'pre-seeded') bad.push(`${where} ${band}: ${target} is bind-only (pre-seeded)`);
              continue;
            }
            bad.push(`${where} ${band}: target ${target}`);
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

describe('THR-1953 — the world rows', () => {
  const templates = allTemplates();
  const goods = new Set<string>([...Object.keys(RESOURCE_DEFINITIONS), STOCK_GOOD_STAPLE, STOCK_GOOD_DEPOSIT]);
  const factionDefs = new Set<string>(FACTION_DEFINITIONS.keys());

  it('carries the S3 world, purse and debt rows of the outcome research table', () => {
    const has = (pred: (e: EncounterAftermathReactionEffect) => boolean) => templates.filter(t =>
      tablesOf(t).some(({ table }) => Object.values(table).some(effects => (effects ?? []).some(pred)))).map(t => t.id);
    const world = has(e => e.kind === 'economy_shift' && e.quantity !== 'means' && e.quantity !== 'purse');
    const purse = has(e => e.kind === 'economy_shift' && e.quantity === 'purse');
    const debts = has(e => e.kind === 'attachment_grant' && e.templateId.startsWith('agreement.debt'));
    expect(world.length).toBeGreaterThanOrEqual(20);
    expect(purse.length).toBeGreaterThanOrEqual(7);
    for (const id of ['encounter.harvest_bounty', 'encounter.town.granary_riot', 'encounter.caravan_deal', 'encounter.the_rich_vein']) {
      expect(world, id).toContain(id);
    }
    expect(purse).toContain('encounter.realm.border_levy');
    expect(debts).toEqual(expect.arrayContaining(['encounter.realm.tithe_demanded', 'encounter.town.tithe_barn_raid']));
  });

  it('puts every world amount on a named step of its quantity and lands it where the scene is', () => {
    const bad: string[] = [];
    for (const t of templates) {
      const specs = new Map((t.supportBundle ?? []).map(spec => [spec.key, spec]));
      for (const { where, table } of tablesOf(t)) {
        for (const [band, effects] of Object.entries(table)) {
          for (const e of worldShifts(effects)) {
            const q = e.quantity as WorldEconomyQuantity;
            if (!economyShiftNamedSteps(q).includes(Math.abs(e.amount))) bad.push(`${where} ${band}: ${q} amount ${e.amount}`);
            if (e.targetLocationId !== undefined && e.targetLocationId !== '$here' && e.targetLocationId !== '$target') {
              bad.push(`${where} ${band}: ${q} lands on ${e.targetLocationId}`);
            }
            if (q === 'stock' && !goods.has(e.good ?? '')) bad.push(`${where} ${band}: stock good ${e.good}`);
            if (q === 'purse') {
              const f = e.targetFactionId ?? '';
              if (f.startsWith('$cast:')) {
                if (!specs.has(f.slice('$cast:'.length))) bad.push(`${where} ${band}: purse ${f} not cast`);
              } else if (f !== '$realm' && !factionDefs.has(f)) bad.push(`${where} ${band}: purse faction ${f}`);
            }
          }
        }
      }
    }
    expect(bad).toEqual([]);
  });

  it('never writes a world quantity in both the table and a reaction', () => {
    const bad: string[] = [];
    for (const t of templates) {
      for (const v of variantsOf(t)) {
        const table = v.outcomeEffects ?? t.outcomeEffects;
        if (!table) continue;
        const inTable = new Set(Object.values(table).flatMap(effects => worldShifts(effects).map(e => e.quantity)));
        for (const r of v.reactions ?? []) {
          for (const e of worldShifts(r.effects)) if (inTable.has(e.quantity)) bad.push(`${t.id} reaction ${r.id}: ${e.quantity}`);
        }
      }
    }
    expect(bad).toEqual([]);
  });
});
