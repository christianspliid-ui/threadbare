/**
 * THR-1968 (god's stake S2) — every economic card says what it changed.
 *
 * Runs the real `loc.bless_harvest` and `loc.open_markets` ops through the real executor
 * between two target snapshots, then reads the result the way production does: the
 * `economy` rows, the receipt's presentation (a crossed band opens the dialog, a move
 * inside a band rides the toast), the `receipt.economy` trace, and the place page's
 * Fortunes row, which must say the same word.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { WorldGraph } from '../graph';
import { executeGraphOps, resetOpCounter } from '../graphOpExecutor';
import { snapshotCastTarget, snapshotTargetChanges } from '../castTargetChanges';
import { snapshotCastEconomy, diffCastEconomy } from '../castEconomyReceipt';
import { processPlayerReceipts } from '../playerReceipts';
import { fortunesSentence } from '../../data/fortunes-prose';
import { getUnifiedTemplateById } from '../../data/unified-action-templates';
import {
  ECONOMY_RECEIPT_LINES,
  ECONOMY_RECEIPT_NOUNS,
  ECONOMY_RECEIPT_UP_IS_GAIN,
  ECONOMY_STAPLE_PLENTY_LINES,
  fillEconomyReceiptLine,
} from '../../data/economy-receipt-content';
import { UI_TOOLTIPS } from '../../data/ui-content';
import { LOCATION_TRAIT_IDS } from '../../data/location-trait-constants';
import { enableTracing, disableTracing, clearTraces, getTraces } from '../traceBuffer';
import { isActionStepBranch } from '../../types/unifiedAction';
import type { GraphOp } from '../../types/graphOp';
import type { GameState } from '../../types/gameState';
import type { UnifiedAction, EncounterAftermathChange } from '../../types/unifiedAction';
import type { PhaseContext } from '../phaseRegistry';

const GOD = 'asc-1';
const TOWN = 'loc-millbrook';
const OTHER = 'loc-ferris';
const MORTAL = 'mortal-1';

function templateOps(templateId: string): GraphOp[] {
  const t = getUnifiedTemplateById(templateId)!;
  return t.steps.flatMap((s) => (isActionStepBranch(s) ? [] : s.onSuccess ?? [])) as GraphOp[];
}

describe('THR-1968 — the economy receipt', () => {
  let graph: WorldGraph;

  beforeEach(() => {
    resetOpCounter();
    clearTraces();
    enableTracing();
    graph = new WorldGraph();
    graph.addNode({ id: GOD, type: 'actor', name: 'The Shepherd', properties: {} });
  });
  afterEach(() => disableTracing());

  function addTown(props: Record<string, unknown>, id = TOWN, name = 'Millbrook'): void {
    graph.addNode({ id, type: 'location', name, properties: { locationSubtype: 'town', ...props } });
  }

  function castAndDiff(templateId: string, targetId = TOWN, targetName = 'Millbrook'): EncounterAftermathChange[] {
    const before = snapshotCastTarget(graph, targetId);
    executeGraphOps(graph, templateOps(templateId), { actorId: GOD, targetId, locationId: targetId, tick: 10 });
    return snapshotTargetChanges(before, snapshotCastTarget(graph, targetId), {
      graph, idStem: 'act-1:step:0', targetName,
    });
  }

  function economyRows(changes: EncounterAftermathChange[]): EncounterAftermathChange[] {
    return changes.filter((c) => c.kind === 'economy');
  }

  function runReceipt(templateId: string, changes: EncounterAftermathChange[], targetId = TOWN) {
    const action = {
      actionId: 'act-1', templateId, actorId: GOD, targetId, source: 'player',
      resolved: true, outcome: 'success', startTick: 9, completedAtTick: 10, currentStep: 0,
      aftermathChanges: changes,
    } as unknown as UnifiedAction;
    const state = {
      tick: 10, graph, unifiedActions: [action], playerActionReceipts: [], tickEvents: [], digestBuffer: [],
    } as unknown as GameState;
    return processPlayerReceipts(state, {} as PhaseContext).playerActionReceipts![0];
  }

  describe('a crossed band opens the dialog', () => {
    it('Bless the Harvest lifts a struggling town to modest, in the Fortunes row\'s word', () => {
      addTown({ prosperity: 30, unrest: 0 });
      const rows = economyRows(castAndDiff('loc.bless_harvest'));
      const [lead] = rows;
      expect(lead.economyQuantity).toBe('prosperity');
      expect(lead.crossed).toBe(true);
      expect(lead.detail).toBe('Millbrook is no longer struggling: it is modest again.');
      expect(lead.subjectId).toBe(TOWN);
      expect(lead.polarity).toBe('gain');
      expect(lead.concepts).toEqual([{ text: 'Millbrook', entityId: TOWN, visualKind: 'location' }]);

      // The receipt row and the Fortunes row agree after the cast.
      expect(fortunesSentence(graph, TOWN)!.prosperityWord).toBe('modest');
      expect(lead.detail).toContain(fortunesSentence(graph, TOWN)!.prosperityWord);

      const receipt = runReceipt('loc.bless_harvest', rows);
      expect(receipt.presentation).toBe('modal');
      const trace = getTraces().find((t) => t.category === 'receipt.economy') as unknown as {
        presentation: string; changes: Array<{ quantity: string; crossed: boolean }>;
      };
      expect(trace.presentation).toBe('modal');
      expect(trace.changes[0]).toMatchObject({ quantity: 'prosperity', crossed: true });
    });

    it('a lane freed of threat opens the dialog', () => {
      addTown({ prosperity: 50 });
      addTown({ prosperity: 50 }, OTHER, 'Ferris');
      graph.addEdge({ id: 'lane-1', type: 'trades_with', source: TOWN, target: OTHER, properties: { volume: 3, threatened: true } });
      const before = snapshotCastEconomy(graph, TOWN);
      graph.getEdge('lane-1')!.properties.threatened = false;
      const rows = diffCastEconomy(before, snapshotCastEconomy(graph, TOWN), {
        idStem: 'act-1:step:0', targetId: TOWN, targetName: 'Millbrook',
      });
      expect(rows.map((r) => r.detail)).toEqual(['The road from Millbrook is no longer threatened.']);
      expect(runReceipt('loc.guide_caravan', rows).presentation).toBe('modal');
    });
  });

  describe('a move inside a band rides the toast', () => {
    it('Open the Markets on a calm town: "Its people\'s anger cools."', () => {
      addTown({ prosperity: 50, unrest: 25 });
      const rows = economyRows(castAndDiff('loc.open_markets'));
      expect(rows.every((r) => r.crossed === false)).toBe(true);
      expect(rows[0].economyQuantity).toBe('unrest');
      expect(rows[0].detail).toBe("Its people's anger cools.");
      expect(rows[0].polarity).toBe('gain');
      const receipt = runReceipt('loc.open_markets', rows);
      expect(receipt.presentation).toBe('toast');
      expect(receipt.toastMessage).toContain("Its people's anger cools.");
    });

    it('a cast that moved nothing writes no economy row (Law 56)', () => {
      addTown({ prosperity: 50, unrest: 0 });
      const before = snapshotCastEconomy(graph, TOWN);
      expect(diffCastEconomy(before, snapshotCastEconomy(graph, TOWN), {
        idStem: 'x', targetId: TOWN, targetName: 'Millbrook',
      })).toEqual([]);
    });
  });

  describe('the other quantities', () => {
    it('an unrest chip crossing is said once, in the economy row\'s words', () => {
      addTown({ prosperity: 50, unrest: 60 });
      graph.addNode({ id: LOCATION_TRAIT_IDS.lawless, type: 'trait', name: 'Lawless', properties: {} });
      graph.addEdge({ id: 'tr-1', type: 'has_trait', source: TOWN, target: LOCATION_TRAIT_IDS.lawless, properties: {} });
      const before = snapshotCastTarget(graph, TOWN);
      graph.removeEdge('tr-1');
      const changes = snapshotTargetChanges(before, snapshotCastTarget(graph, TOWN), {
        graph, idStem: 'act-1:step:0', targetName: 'Millbrook',
      });
      expect(changes.map((c) => [c.kind, c.detail])).toEqual([['economy', 'Millbrook is no longer lawless.']]);
      expect(changes[0].crossed).toBe(true);
    });

    it('a staple crossing out of scarcity names the good', () => {
      addTown({ prosperity: 50, resources: { grain: { quantity: 0, renewable: true, renewalRate: 0.1 } } });
      const before = snapshotCastEconomy(graph, TOWN);
      expect(before!.staples!.get('grain')!.tier).toBe('scarce');
      (graph.getNode(TOWN)!.properties.resources as Record<string, { quantity: number }>).grain.quantity = 100;
      const rows = diffCastEconomy(before, snapshotCastEconomy(graph, TOWN), {
        idStem: 'x', targetId: TOWN, targetName: 'Millbrook',
      });
      expect(rows).toHaveLength(1);
      expect(rows[0].detail).toBe('Millbrook is no longer short of grain.');
      expect(rows[0].crossed).toBe(true);
    });

    it('a mortal\'s Means reads mortal wealth\'s words, on the one economy kind', () => {
      graph.addNode({ id: MORTAL, type: 'actor', name: 'Kael', properties: { actorType: 'individual', wealth: 30 } });
      const before = snapshotCastEconomy(graph, MORTAL);
      graph.getNode(MORTAL)!.properties.wealth = 70;
      const [row] = diffCastEconomy(before, snapshotCastEconomy(graph, MORTAL), {
        idStem: 'x', targetId: MORTAL, targetName: 'Kael',
      });
      expect(row.kind).toBe('economy');
      expect(row.economyQuantity).toBe('means');
      expect(row.crossed).toBe(true);
      expect(row.title).toBe('Better off');
      expect(row.detail).toMatch(/^Kael is now /);
    });

    it('a faction is not read as a mortal with Means', () => {
      graph.addNode({ id: 'fac-1', type: 'actor', name: 'House Ashfold', properties: { actorType: 'faction', wealth: 30 } });
      expect(snapshotCastEconomy(graph, 'fac-1')).toBeUndefined();
    });
  });

  describe('content', () => {
    it('every place quantity has both directions and both crossed states, or a declared null', () => {
      for (const [quantity, byDir] of Object.entries(ECONOMY_RECEIPT_LINES)) {
        for (const dir of ['up', 'down'] as const) {
          for (const state of ['crossed', 'inside'] as const) {
            const line = byDir[dir][state];
            expect(line.title.length, `${quantity}.${dir}.${state}`).toBeGreaterThan(0);
            expect(line.detail === null || line.detail.length > 0).toBe(true);
            if (line.detail) expect(line.detail).not.toMatch(/\d/);
          }
        }
        expect(typeof ECONOMY_RECEIPT_UP_IS_GAIN[quantity as keyof typeof ECONOMY_RECEIPT_UP_IS_GAIN]).toBe('boolean');
      }
      for (const line of Object.values(ECONOMY_STAPLE_PLENTY_LINES)) expect(line.detail).not.toMatch(/\d/);
    });

    it('every state noun\'s tooltip resolves (Law 1)', () => {
      for (const noun of Object.values(ECONOMY_RECEIPT_NOUNS)) {
        expect(UI_TOOLTIPS[noun.tooltipId], noun.tooltipId).toBeDefined();
      }
    });

    it('a line with an unfilled slot is dropped, never printed with a hole (Law 14)', () => {
      expect(fillEconomyReceiptLine('{town} has fallen to {to}.', { town: 'Millbrook' })).toBeNull();
      expect(fillEconomyReceiptLine(null, {})).toBeNull();
      expect(fillEconomyReceiptLine('{town} has fallen to {to}.', { town: 'Millbrook', to: 'struggling' }))
        .toBe('Millbrook has fallen to struggling.');
    });

    it('Guide the Caravan\'s card carries the Reach its step rolls', () => {
      const t = getUnifiedTemplateById('loc.guide_caravan')!;
      const step = t.steps[0];
      expect(isActionStepBranch(step)).toBe(false);
      expect(t.reach).toBe((step as { reach: string }).reach);
    });

    it('one economy change kind exists in src', () => {
      const hits: string[] = [];
      const walk = (dir: string) => {
        for (const name of readdirSync(dir)) {
          const p = join(dir, name);
          if (statSync(p).isDirectory()) { if (name !== '__tests__') walk(p); continue; }
          if (!/\.tsx?$/.test(name)) continue;
          // A change-kind union that declares the `economy` member.
          if (/type \w*ChangeKind\s*=[^;]*'economy'/.test(readFileSync(p, 'utf8'))) hits.push(p);
        }
      };
      walk(join(__dirname, '..', '..'));
      expect(hits.map((h) => h.replace(/\\/g, '/').replace(/.*\/src\//, 'src/'))).toEqual(['src/types/unifiedAction.ts']);
    });
  });
});
