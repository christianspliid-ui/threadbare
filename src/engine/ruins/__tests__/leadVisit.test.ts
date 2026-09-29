/**
 * The visit to a lead's ruin (THR-1664, seeded things stay alive S3).
 *
 * A survey that leaves its surveyor holding a `narrowed` lead on a ruin arranges a
 * visit (`cell.observe.location`'s appointment payoff); a pending visit spares the lead
 * from decay; one pending visit per holder per ruin; and the visit's outcome sets the
 * lead through `sharpen_clue`. Asserted on a small fixture that falsifies each rule.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../../graph';
import { maybePlantAppointmentPayoff } from '../../strategicActionLifecycle';
import { phaseClueDecay } from '../clueLifecycle';
import { claimLeadVisit, resolveVisitLead, siteClassAdmits } from '../leadVisit';
import {
  CLUE_DECAY_CHECK_INTERVAL,
  CLUE_LEAD_VISIT_DELAY_TICKS,
  CLUE_LEAD_VISIT_GRACE_TICKS,
  CLUE_MAX_AGE_TICKS_NARROWED,
  CLUE_VISIT_PRECISION_BY_OUTCOME,
} from '../constants';
import { terminalActionOutcome } from '../../unifiedActionLifecycle';
import { clearTraces, enableTracing, disableTracing, getTraces } from '../../traceBuffer';
import { getCellTemplate, UNDERTAKING_CELL_APPOINTMENTS } from '../../../data/undertaking-cells';
import { getUnifiedTemplateById } from '../../../data/unified-action-templates';
import { RUIN_LEAD_VISIT_ID } from '../../../data/encounters/ruin-lead-visit';
import { RUIN_LEAD_COLD_ID } from '../../../data/encounters/ruin-lead-cold';
import type { GameState } from '../../../types/gameState';
import type { StrategicActionCandidate } from '../../../types/strategicAction';
import type { UnifiedAction } from '../../../types/unifiedAction';

const CELL = 'cell.observe.location';
const TICK = 100;

/**
 *   loc-ruin (6,2) — an elder ruin; the surveyor stands here
 *   loc-town (1,1) — a town, somewhere a survey arranges nothing
 */
function buildState(lead?: { precision: 'vague' | 'narrowed' | 'located'; pendingVisitDueTick?: number }): GameState {
  const graph = new WorldGraph();
  graph.addNode({ id: 'actor-hero', type: 'actor', name: 'Maret', properties: { actorType: 'individual' } });
  graph.addNode({ id: 'loc-ruin', type: 'location', name: 'Kethra Deep', properties: { hexCol: 6, hexRow: 2, locationSubtype: 'elder_ruin', ruinMagnitude: 0.6 } });
  graph.addNode({ id: 'loc-town', type: 'location', name: 'Ashford', properties: { hexCol: 1, hexRow: 1, locationSubtype: 'town' } });
  graph.addEdge({ id: 'hero_loc', source: 'actor-hero', target: 'loc-ruin', type: 'located_at', properties: {} });
  if (lead) {
    graph.addEdge({
      id: 'lead_1', source: 'actor-hero', target: 'loc-ruin', type: 'knows_clue_of',
      properties: {
        magnitude: 0.5, precision: lead.precision, source: 'undertaking_survey', discoveredTick: TICK, consumed: false,
        ...(lead.pendingVisitDueTick !== undefined ? { pendingVisitDueTick: lead.pendingVisitDueTick } : {}),
      },
    });
  }
  return {
    tick: TICK, seed: 42, graph, pendingEncounterSeeds: [], unifiedActions: [],
    tickEvents: [], recentEvents: [],
  } as unknown as GameState;
}

function survey(targetNodeId = 'loc-ruin'): StrategicActionCandidate {
  return {
    candidateId: 'cand_1', templateId: CELL, ambitionId: 'ambition_x', actorId: 'actor-hero',
    verb: 'observe', executionMode: 'instant', behaviorFamily: 'wanderer-explorer',
    displayName: 'Survey a location', targetNodeId,
  } as StrategicActionCandidate;
}

function leadProps(state: GameState): Record<string, unknown> | undefined {
  return state.graph.getEdge('lead_1')?.properties as Record<string, unknown> | undefined;
}

describe('the ruin visit (THR-1664)', () => {
  beforeEach(() => { clearTraces(); enableTracing(); });
  afterEach(() => { clearTraces(); disableTracing(); });

  it('the survey cell carries the visit row, and both branches have their one bearer', () => {
    const payoff = UNDERTAKING_CELL_APPOINTMENTS[CELL];
    expect(getCellTemplate(CELL)?.appointmentPayoff).toEqual(payoff);
    expect(payoff.meeting.tags).toEqual(['#ruin_lead']);
    expect(payoff.missed.query.tags).toEqual(['#lead_gone_cold']);
    expect(payoff.siteClasses).toEqual(['ruin', 'wonder']);
    expect(payoff.leadVisit).toBe(true);
    expect(payoff.requirePlace).toBe(true);
    expect(getUnifiedTemplateById(RUIN_LEAD_VISIT_ID)?.tags).toContain('#ruin_lead');
    expect(getUnifiedTemplateById(RUIN_LEAD_COLD_ID)?.tags).toContain('#lead_gone_cold');
    // Seed-only: the draw never offers either.
    expect(getUnifiedTemplateById(RUIN_LEAD_VISIT_ID)?.drawable).toBe(false);
    expect(getUnifiedTemplateById(RUIN_LEAD_COLD_ID)?.drawable).toBe(false);
  });

  it('a lead with a pending visit outlives the journey — delay + grace covers a narrowed lead', () => {
    expect(CLUE_LEAD_VISIT_DELAY_TICKS + CLUE_LEAD_VISIT_GRACE_TICKS).toBeGreaterThanOrEqual(CLUE_MAX_AGE_TICKS_NARROWED);
  });

  it('a survey that left a narrowed lead on a ruin arranges the visit and stamps the lead', () => {
    const state = buildState({ precision: 'narrowed' });
    expect(maybePlantAppointmentPayoff(state, survey(), TICK)).toBe(true);
    const seed = state.pendingEncounterSeeds![0];
    expect(seed.query).toEqual(UNDERTAKING_CELL_APPOINTMENTS[CELL].meeting);
    expect(seed.eligibleAfterTick).toBe(TICK + CLUE_LEAD_VISIT_DELAY_TICKS);
    expect(seed.appointment?.locationId).toBe('loc-ruin');
    expect(leadProps(state)?.pendingVisitDueTick).toBe(TICK + CLUE_LEAD_VISIT_DELAY_TICKS);
  });

  it('one pending visit per holder per ruin — a repeat survey plants nothing and says why', () => {
    const state = buildState({ precision: 'narrowed' });
    expect(maybePlantAppointmentPayoff(state, survey(), TICK)).toBe(true);
    // The tick-keyed seed id would differ, so without the rule this plants a duplicate.
    expect(maybePlantAppointmentPayoff(state, survey(), TICK + 10)).toBe(false);
    expect(state.pendingEncounterSeeds).toHaveLength(1);
    const refusals = getTraces().filter(t => t.category === 'appointment_planted'
      && (t as unknown as { refused?: string }).refused === 'lead_visit_visit_pending');
    expect(refusals).toHaveLength(1);
  });

  it('a stamp whose grace has lapsed no longer blocks a new visit', () => {
    const state = buildState({ precision: 'narrowed', pendingVisitDueTick: TICK - CLUE_LEAD_VISIT_GRACE_TICKS - 1 });
    expect(maybePlantAppointmentPayoff(state, survey(), TICK)).toBe(true);
  });

  it('no narrowed lead, no visit: a vague lead, a located lead and no lead all refuse', () => {
    expect(maybePlantAppointmentPayoff(buildState({ precision: 'vague' }), survey(), TICK)).toBe(false);
    expect(maybePlantAppointmentPayoff(buildState({ precision: 'located' }), survey(), TICK)).toBe(false);
    expect(maybePlantAppointmentPayoff(buildState(), survey(), TICK)).toBe(false);
  });

  it('a survey of a town arranges nothing — siteClasses gates before the lead is read', () => {
    const state = buildState({ precision: 'narrowed' });
    expect(maybePlantAppointmentPayoff(state, survey('loc-town'), TICK)).toBe(false);
    expect(state.pendingEncounterSeeds).toHaveLength(0);
    expect(siteClassAdmits(state.graph.getNode('loc-town'), ['ruin', 'wonder'])).toBe(false);
    expect(siteClassAdmits(state.graph.getNode('loc-ruin'), ['ruin', 'wonder'])).toBe(true);
    expect(siteClassAdmits(state.graph.getNode('loc-town'), undefined)).toBe(true);
  });

  it('a pending visit spares the lead from decay; once resolved, the lead ages again', () => {
    const state = buildState({ precision: 'narrowed' });
    claimLeadVisit(state.graph, 'actor-hero', 'loc-ruin', TICK, TICK + CLUE_LEAD_VISIT_DELAY_TICKS);
    // Past the narrowed life, before due + grace, on a decay check tick.
    const past = Math.ceil((TICK + CLUE_MAX_AGE_TICKS_NARROWED + 1) / CLUE_DECAY_CHECK_INTERVAL) * CLUE_DECAY_CHECK_INTERVAL;
    expect(past).toBeLessThanOrEqual(TICK + CLUE_LEAD_VISIT_DELAY_TICKS + CLUE_LEAD_VISIT_GRACE_TICKS);
    phaseClueDecay({ ...state, tick: past } as GameState);
    expect(state.graph.getEdge('lead_1')).toBeDefined();
    delete leadProps(state)!.pendingVisitDueTick;
    phaseClueDecay({ ...state, tick: past } as GameState);
    expect(state.graph.getEdge('lead_1')).toBeUndefined();
  });

  it('the visit outcome sets the lead: success → located, at cost → narrowed, failure → cold', () => {
    expect(CLUE_VISIT_PRECISION_BY_OUTCOME.success).toBe('located');
    expect(CLUE_VISIT_PRECISION_BY_OUTCOME.critical_success).toBe('located');
    expect(CLUE_VISIT_PRECISION_BY_OUTCOME.success_at_cost).toBe('narrowed');
    expect(CLUE_VISIT_PRECISION_BY_OUTCOME.failure).toBe('cold');
    expect(CLUE_VISIT_PRECISION_BY_OUTCOME.critical_failure).toBe('cold');

    const kept = buildState({ precision: 'narrowed', pendingVisitDueTick: TICK });
    expect(resolveVisitLead(kept.graph, 'actor-hero', TICK, { outcome: 'success' })).toMatchObject({ success: true, from: 'narrowed', to: 'located' });
    expect(leadProps(kept)).toMatchObject({ precision: 'located', discoveredTick: TICK });
    expect(leadProps(kept)?.pendingVisitDueTick).toBeUndefined();
    const sharpened = getTraces().filter(t => t.category === 'ruins.clue_sharpened');
    expect(sharpened.at(-1)).toMatchObject({ via: 'visit', from: 'narrowed', to: 'located', targetRuinId: 'loc-ruin' });

    const close = buildState({ precision: 'narrowed', pendingVisitDueTick: TICK });
    resolveVisitLead(close.graph, 'actor-hero', TICK + 5, { outcome: 'success_at_cost' });
    expect(leadProps(close)).toMatchObject({ precision: 'narrowed', discoveredTick: TICK + 5, consumed: false });

    const lost = buildState({ precision: 'narrowed', pendingVisitDueTick: TICK });
    resolveVisitLead(lost.graph, 'actor-hero', TICK, { outcome: 'failure' });
    expect(leadProps(lost)).toMatchObject({ consumed: true });
  });

  it('a missed visit makes the lead cold; a step that does not end the visit is a no-op', () => {
    const missed = buildState({ precision: 'narrowed', pendingVisitDueTick: TICK });
    expect(resolveVisitLead(missed.graph, 'actor-hero', TICK, { missed: true })).toMatchObject({ success: true, to: 'cold' });
    expect(leadProps(missed)?.consumed).toBe(true);
    expect(getTraces().filter(t => t.category === 'ruins.clue_sharpened').at(-1)).toMatchObject({ via: 'missed_visit', to: 'cold' });

    const midway = buildState({ precision: 'narrowed', pendingVisitDueTick: TICK });
    expect(resolveVisitLead(midway.graph, 'actor-hero', TICK, { band: 'failure' })).toEqual({ success: false, failReason: 'not_terminal' });
    expect(leadProps(midway)?.precision).toBe('narrowed');

    expect(resolveVisitLead(buildState().graph, 'actor-hero', TICK, { outcome: 'success' })).toEqual({ success: false, failReason: 'no_lead' });
  });

  it('terminalActionOutcome reads how the visit ends before advanceStep runs — and draws nothing', () => {
    const template = getUnifiedTemplateById(RUIN_LEAD_VISIT_ID)!;
    const at = (currentStep: number, stepOutcomes: UnifiedAction['stepOutcomes']) =>
      ({ currentStep, stepOutcomes, choiceHistory: [] }) as unknown as UnifiedAction;
    // Step 0 plain failure continues (continue_weakened): not terminal.
    expect(terminalActionOutcome(at(0, []), 'failure', template)).toBeUndefined();
    // Step 0 critical failure always ends the action.
    expect(terminalActionOutcome(at(0, []), 'critical_failure', template)).toBe('critical_failure');
    // Final step: aggregated over the history, as computeFinalActionOutcome does.
    expect(terminalActionOutcome(at(1, ['success']), 'success', template)).toBe('success');
    expect(terminalActionOutcome(at(1, ['failure']), 'success', template)).toBe('success_at_cost');
    expect(terminalActionOutcome(at(1, ['success']), 'near_miss', template)).toBe('success_at_cost');
    // Step 1 is fail_action.
    expect(terminalActionOutcome(at(1, ['success']), 'failure', template)).toBe('failure');
  });
});
