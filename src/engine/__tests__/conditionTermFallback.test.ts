/**
 * THR-1697 — a timed condition never lands permanent by omission.
 *
 * `wolf-winter-watch.ts` applied Under Watch through `apply_condition` with no
 * `durationTicks`. The writer fell back to `CONDITION_DEFAULT_DURATION_TICKS = 0`,
 * wrote no `ticksRemaining`, and `decayConditions` never counted it down — the
 * village was watched for the rest of the game while the chip (which reads
 * `CONDITION_DURATIONS`) promised a week.
 *
 * Two halves:
 * - the writer falls back to the condition's own `CONDITION_DURATIONS` term
 *   before indefinite, so the displayed term and the real term are one number;
 * - a content lint over every registered template: no `apply_condition` of a
 *   condition that has a term resolves to a permanent edge (an explicit `0` is
 *   the only way left to do that, and it is refused here too).
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import {
  applyConditionToActor,
  resolveConditionDurationTicks,
  CONDITION_DEFAULT_DURATION_TICKS,
} from '../effects/conditionApplier';
import {
  CONDITION_DURATIONS,
  CONDITION_UNDER_WATCH_DURATION,
} from '../../data/condition-trait-content';
import {
  UNIFIED_ACTION_TEMPLATES,
  LOCATION_BRANCHING_ENCOUNTER_TEMPLATES,
  CACHE_REGISTERED_REGIONAL_TEMPLATES,
} from '../../data/unified-action-templates';
import { WOLF_WINTER_WATCH_TEMPLATE } from '../../data/encounters/wolf-winter-watch';
import type { GameState } from '../../types/gameState';
import type { UnifiedActionTemplate } from '../../types/unifiedAction';

const UNDER_WATCH = 'trait.condition.location.under_watch';
const VILLAGE = 'loc-village';

function buildState(conditionId: string): GameState {
  const graph = new WorldGraph();
  graph.addNode({ id: VILLAGE, type: 'location', name: 'Village', properties: {} });
  graph.addNode({
    id: conditionId, type: 'trait', name: 'Condition',
    properties: { subcategory: 'condition', tags: ['#condition'] },
  });
  return { tick: 10, seed: 42, graph } as unknown as GameState;
}

function soleEdge(state: GameState, conditionId: string) {
  const edges = state.graph.getOutgoingEdges(VILLAGE, 'has_trait').filter(e => e.target === conditionId);
  expect(edges).toHaveLength(1);
  return edges[0];
}

describe('THR-1697 — the condition writer reads the condition\'s own term', () => {
  it('an omitted duration lands with the CONDITION_DURATIONS term and counts down', () => {
    const state = buildState(UNDER_WATCH);
    const result = applyConditionToActor(state, VILLAGE, UNDER_WATCH, { tick: 10 });
    expect(result.applied).toBe(true);
    const edge = soleEdge(state, UNDER_WATCH);
    expect(edge.properties.durationTicks).toBe(CONDITION_UNDER_WATCH_DURATION);
    expect(edge.properties.ticksRemaining).toBe(CONDITION_UNDER_WATCH_DURATION);
  });

  it('an explicit duration still wins over the table', () => {
    const state = buildState(UNDER_WATCH);
    applyConditionToActor(state, VILLAGE, UNDER_WATCH, { tick: 10, durationTicks: 12 });
    expect(soleEdge(state, UNDER_WATCH).properties.ticksRemaining).toBe(12);
  });

  it('a condition with no term stays indefinite (Scarred, minted traits)', () => {
    const untimed = 'trait.scar.scarred';
    expect(CONDITION_DURATIONS[untimed]).toBeUndefined();
    const state = buildState(untimed);
    applyConditionToActor(state, VILLAGE, untimed, { tick: 10 });
    const edge = soleEdge(state, untimed);
    expect(edge.properties.durationTicks).toBe(CONDITION_DEFAULT_DURATION_TICKS);
    expect(edge.properties.ticksRemaining).toBeUndefined();
  });
});

interface ApplyConditionSite {
  readonly templateId: string;
  readonly conditionTraitId: string;
  readonly durationTicks: unknown;
}

/** Every `apply_condition` effect object anywhere inside a template. */
function collectApplyConditions(template: UnifiedActionTemplate): ApplyConditionSite[] {
  const sites: ApplyConditionSite[] = [];
  const seen = new Set<unknown>();
  const walk = (value: unknown): void => {
    if (!value || typeof value !== 'object' || seen.has(value)) return;
    seen.add(value);
    if (Array.isArray(value)) { value.forEach(walk); return; }
    const record = value as Record<string, unknown>;
    if (record.kind === 'apply_condition' && typeof record.conditionTraitId === 'string') {
      sites.push({
        templateId: template.id,
        conditionTraitId: record.conditionTraitId,
        durationTicks: record.durationTicks,
      });
    }
    Object.values(record).forEach(walk);
  };
  walk(template);
  return sites;
}

describe('THR-1697 — content lint: no timed condition resolves to a permanent edge', () => {
  const templates = new Map<string, UnifiedActionTemplate>();
  for (const t of [
    ...UNIFIED_ACTION_TEMPLATES,
    ...LOCATION_BRANCHING_ENCOUNTER_TEMPLATES,
    ...CACHE_REGISTERED_REGIONAL_TEMPLATES,
    WOLF_WINTER_WATCH_TEMPLATE,
  ]) templates.set(t.id, t);
  const sites = [...templates.values()].flatMap(collectApplyConditions);
  const timedSites = sites.filter(s => typeof CONDITION_DURATIONS[s.conditionTraitId] === 'number');

  it('walks real content (non-vacuous)', () => {
    expect(timedSites.some(s => s.templateId === WOLF_WINTER_WATCH_TEMPLATE.id
      && s.conditionTraitId === UNDER_WATCH)).toBe(true);
  });

  it('every apply_condition of a timed condition resolves to a finite term', () => {
    const permanent = timedSites
      .filter(s => {
        const explicit = typeof s.durationTicks === 'number' ? s.durationTicks : undefined;
        return resolveConditionDurationTicks(s.conditionTraitId, explicit) <= 0;
      })
      .map(s => `${s.templateId} → ${s.conditionTraitId} (durationTicks=${String(s.durationTicks)})`);
    expect(permanent).toEqual([]);
  });

  it('Wolves at the Fold authors the watch\'s term explicitly', () => {
    const wolf = collectApplyConditions(WOLF_WINTER_WATCH_TEMPLATE)
      .find(s => s.conditionTraitId === UNDER_WATCH);
    expect(wolf?.durationTicks).toBe(CONDITION_UNDER_WATCH_DURATION);
  });
});
