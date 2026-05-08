/**
 * THR-139 — Intelligence-aftermath-prose Liveness Contract.
 *
 * Verifies the end-to-end "intel paid off" loop is actually wired:
 *   plant record (matching category + context)
 *   → apply an aftermath reaction with `intel_referenced_prose` effect
 *   → assert a chronicle TickEvent surfaces in recentEvents AND
 *     an `intelligence_referenced` trace with referencedBy: 'aftermath_prose' fires.
 *
 * This is the fourth liveness contract (after scoring_boost / prose_enrichment /
 * resolution_match in `intel-consumption-liveness.contract.test.ts`). Co-locating
 * here would have made the file too long — keeping it adjacent in the contracts
 * directory mirrors the difficulty_modifier pattern from THR-140.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../../graph';
import { applyEncounterAftermathReaction } from '../../encounterAftermath';
import { createSimulationRuntime } from '../../simulationRuntime';
import { clearTraces, enableTracing, disableTracing, getTraces } from '../../traceBuffer';
import type { GameState } from '../../../types/gameState';
import type {
  EncounterAftermathReaction,
  IntelligenceRecord,
  UnifiedAction,
} from '../../../types/unifiedAction';

const AGENT_ID = 'agent.lorekeeper';
const LOC_ID = 'loc.amber-grove';

function makeGraph(): WorldGraph {
  const g = new WorldGraph();
  g.addNode({
    id: LOC_ID,
    type: 'location',
    name: 'Amber Grove',
    properties: { locationType: 'wilderness', hexCol: 0, hexRow: 0, region: 'reach.northern' },
  });
  g.addNode({
    id: AGENT_ID,
    type: 'actor',
    name: 'Lorekeeper',
    properties: { actorType: 'individual', locationId: LOC_ID },
  });
  return g;
}

function makeRecord(): IntelligenceRecord {
  return {
    recordId: 'liveness-aftermath-prose-001',
    agentId: AGENT_ID,
    category: 'cultural_knowledge',
    label: 'Amber-sap rite',
    detail: 'Patient harvest, ritual cadence.',
    targetEntityId: LOC_ID,
    sourceEncounterId: 'encounter.scholar',
    acquiredTick: 10,
    reliability: 0.85,
  };
}

function makeState(records: IntelligenceRecord[]): GameState {
  return {
    tick: 50,
    seed: 42,
    cycle: 1,
    phase: 'playing',
    graph: makeGraph(),
    intelligenceRecords: records,
    tickEvents: [],
    recentEvents: [],
  } as unknown as GameState;
}

function makeAction(): UnifiedAction {
  return {
    actionId: 'ua_revisit',
    actorId: AGENT_ID,
    templateId: 'enc.cultural.amber_grove_revisit',
    targetId: LOC_ID,
    scale: 'personal',
    source: 'agent',
    startTick: 1,
    currentStep: 0,
    stepProgress: 1,
    stepDuration: 1,
    resolved: true,
    outcome: 'success',
    stepOutcomes: [],
  } as UnifiedAction;
}

beforeEach(() => { clearTraces(); enableTracing(); });
afterEach(() => { disableTracing(); clearTraces(); });

describe('Intelligence consumption liveness — aftermath_prose (THR-139)', () => {
  it('plants a record, applies an intel_referenced_prose reaction, and surfaces both a chronicle event and the trace', () => {
    const record = makeRecord();
    const state = makeState([record]);
    const reaction: EncounterAftermathReaction = {
      id: 'react_aftermath_prose_pilot',
      label: 'Test pilot reaction',
      closeAfterSelection: true,
      effects: [{
        kind: 'intel_referenced_prose',
        category: 'cultural_knowledge',
        prose: {
          reliable: '{name} read the working with the unhurried recognition of someone who had seen its bones before — the lore came back, exactly as remembered.',
          uncertain: '{name} works half from instinct, half from a half-recalled fragment — the lore returned in pieces.',
          dubious: '{name} reached for the lore they thought they knew. What surfaced was older, and stranger.',
        },
      }],
    } as EncounterAftermathReaction;
    const runtime = createSimulationRuntime();

    const result = applyEncounterAftermathReaction(state, makeAction(), reaction, 50, runtime);

    // 1. Chronicle TickEvent surfaces in recentEvents AND tickEvents.
    expect(result.state.recentEvents.length).toBe(1);
    expect(result.state.tickEvents.length).toBe(1);
    const ev = result.state.tickEvents[0];
    expect(ev.type).toBe('narrative');
    expect(ev.actorId).toBe(AGENT_ID);
    expect(ev.message).toContain('lore came back');

    // 2. intelligence_referenced trace fires with referencedBy: 'aftermath_prose'
    const refTraces = getTraces().filter(
      t => t.category === 'intelligence_referenced'
        && (t as { referencedBy?: string }).referencedBy === 'aftermath_prose',
    );
    expect(refTraces.length, 'expected exactly one aftermath_prose intelligence_referenced trace').toBe(1);
    expect((refTraces[0] as { recordId?: string }).recordId).toBe(record.recordId);
    expect((refTraces[0] as { intelCategory?: string }).intelCategory).toBe('cultural_knowledge');
    expect((refTraces[0] as { templateId?: string }).templateId).toBe('enc.cultural.amber_grove_revisit');

    // 3. encounter_aftermath_effect trace records success and the matched recordId.
    const dispatchTrace = getTraces().find(t =>
      t.category === 'encounter_aftermath_effect'
      && (t as { effectKind?: string }).effectKind === 'intel_referenced_prose',
    );
    expect(dispatchTrace).toBeDefined();
    expect((dispatchTrace as { success?: boolean }).success).toBe(true);
    const detail = (dispatchTrace as { effectDetail?: { recordId?: string } }).effectDetail;
    expect(detail?.recordId).toBe(record.recordId);
  });

  it('no-ops cleanly when no record is planted (fail-soft contract)', () => {
    const state = makeState([]); // no records planted
    const reaction: EncounterAftermathReaction = {
      id: 'react_no_record',
      label: 'No-record fail-soft',
      closeAfterSelection: true,
      effects: [{
        kind: 'intel_referenced_prose',
        category: 'cultural_knowledge',
        prose: { reliable: 'this should never appear in chronicle' },
      }],
    } as EncounterAftermathReaction;
    const runtime = createSimulationRuntime();

    const result = applyEncounterAftermathReaction(state, makeAction(), reaction, 50, runtime);

    // Chronicle stays empty; the intelligence_referenced trace does NOT fire;
    // a single skip trace records the no_matching_record fail reason.
    expect(result.state.tickEvents.length).toBe(0);
    expect(result.state.recentEvents.length).toBe(0);

    const refTraces = getTraces().filter(t => t.category === 'intelligence_referenced');
    expect(refTraces.length).toBe(0);

    const skipTrace = getTraces().find(t =>
      t.category === 'encounter_aftermath_effect'
      && (t as { effectKind?: string }).effectKind === 'intel_referenced_prose',
    );
    expect(skipTrace).toBeDefined();
    expect((skipTrace as { success?: boolean }).success).toBe(false);
    expect((skipTrace as { failReason?: string }).failReason).toBe('no_matching_record');
  });
});
