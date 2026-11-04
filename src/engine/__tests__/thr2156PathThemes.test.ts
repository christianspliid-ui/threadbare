/**
 * THR-2156 — the path pulls only scenes about the same thing.
 *
 * - Each catalog path names two distinct motivation axes (`themeAxes`).
 * - `firstPathPullFor` pulls a scene only when its Reach is one of the path's two
 *   AND its motivations name one of the path's axes; a path without axes keeps
 *   the THR-2068 reach-only rule.
 * - The Stage's opening step of a fitting chapter of The First says
 *   "Fits the reader of secrets."; a non-fitting chapter, a stranger's chapter
 *   and the recall chapter do not.
 */
import { describe, expect, it } from 'vitest';
import { WorldGraph } from '../graph';
import type { GameState } from '../../types/gameState';
import type { UnifiedAction, UnifiedActionTemplate } from '../../types/unifiedAction';
import type { EncounterNotification } from '../../types/encounterVisibility';
import { VALUE_PAIRS } from '../../types/agent';
import { SPARK_VISION_CATALOG } from '../../data/spark-vision-catalog';
import { getUnifiedTemplateById } from '../../data/unified-action-templates';
import { FIRST_PATH_PULL } from '../../data/premonition-constants';
import { firstPathFitFor, firstPathFromRecord, firstPathPullFor, type FirstPath } from '../firstPath';
import { buildUnifiedEncounterStageModel } from '../views/stage/buildUnifiedEncounterStageModel';

const TORCH = 'vision.heart.revolutionary';
const READER = 'vision.shadow.spymaster';

function pathOf(visionId: string): FirstPath {
  const path = firstPathFromRecord({ sparkVisionId: visionId } as never);
  if (!path) throw new Error(`no path for ${visionId}`);
  return path;
}

function tmpl(id: string): UnifiedActionTemplate {
  const t = getUnifiedTemplateById(id);
  if (!t) throw new Error(`no template ${id}`);
  return t;
}

describe('THR-2156 catalog — every path names what it is about', () => {
  it('every SPARK_VISION_CATALOG entry has two distinct themeAxes from VALUE_PAIRS', () => {
    for (const v of SPARK_VISION_CATALOG) {
      expect(v.themeAxes, v.id).toBeDefined();
      expect(v.themeAxes!.length, v.id).toBe(2);
      const [a, b] = v.themeAxes!;
      expect(a, v.id).not.toBe(b);
      expect(VALUE_PAIRS, v.id).toContain(a);
      expect(VALUE_PAIRS, v.id).toContain(b);
    }
  });
});

describe('THR-2156 firstPathPullFor — Reach and theme', () => {
  it('Torch of the uprising does not pull Enlist in the Civic Guard', () => {
    const join = tmpl('cg.join');
    expect(join.reach).toBe('iron');
    expect([...join.motivations].sort()).toEqual(['courage_prudence', 'mercy_ruthlessness']);
    expect(firstPathPullFor(pathOf(TORCH), join.reach, join.motivations)).toBe(1);
  });

  it('Reader of secrets still pulls The Shadow in the Night', () => {
    const shadow = tmpl('encounter.shadow_in_the_night');
    expect(firstPathPullFor(pathOf(READER), shadow.reach, shadow.motivations)).toBeCloseTo(1 + FIRST_PATH_PULL, 10);
  });

  it('a path with no themeAxes keeps the reach-only result', () => {
    const { themeAxes: _drop, ...bare } = pathOf(TORCH);
    expect(bare.themeAxes).toBeUndefined();
    const join = tmpl('cg.join');
    expect(firstPathPullFor(bare, join.reach, join.motivations)).toBeCloseTo(1 + FIRST_PATH_PULL, 10);
    expect(firstPathPullFor(bare, 'gold', join.motivations)).toBe(1);
  });

  it('a scene with no motivations is not pulled by a themed path', () => {
    expect(firstPathPullFor(pathOf(READER), 'shadow', undefined)).toBe(1);
    expect(firstPathPullFor(pathOf(READER), 'shadow', [])).toBe(1);
  });
});

// ─── Stage model ────────────────────────────────────────────────

const FIRST = 'agent.elara';
const STRANGER = 'agent.other';

function makeGraph(recalledActionId?: string): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({ id: 'asc', type: 'actor', name: 'Asc', properties: { actorType: 'ascendant' } });
  graph.addNode({ id: FIRST, type: 'actor', name: 'Elara', properties: { actorType: 'individual' } });
  graph.addNode({ id: STRANGER, type: 'actor', name: 'Other', properties: { actorType: 'individual' } });
  graph.addNode({ id: 'loc.x', type: 'location', name: 'The Crossing', properties: {} });
  graph.addEdge({
    id: 'thr', type: 'thread', source: 'asc', target: FIRST,
    properties: {
      courtPosition: 'the_first',
      establishedTick: 0,
      meetingChoiceRecord: { sparkVisionId: READER },
      ...(recalledActionId ? { firstPathRecalledActionId: recalledActionId } : {}),
    },
  });
  return graph;
}

function actionFor(template: UnifiedActionTemplate, actorId: string, actionId = 'ua_1'): UnifiedAction {
  return {
    actionId,
    actorId,
    templateId: template.id,
    targetId: 'loc.x',
    scale: template.scale,
    source: 'agent',
    startTick: 1,
    currentStep: 0,
    stepProgress: 0,
    stepDuration: 2,
    resolved: false,
    stepOutcomes: [],
  } as UnifiedAction;
}

function paragraphsFor(template: UnifiedActionTemplate, action: UnifiedAction, graph: WorldGraph): string[] {
  const notification = {
    id: 'n1', agentId: action.actorId, agentName: 'Elara', courtPosition: 'the_first',
    encounterId: template.id, encounterName: template.name, prose: '', choices: [],
    sourceSystem: 'unified_action', actionId: action.actionId, stepIndex: 0, hexCol: 0, hexRow: 0,
  } as unknown as EncounterNotification;
  const model = buildUnifiedEncounterStageModel({
    template,
    activeAction: action,
    notification,
    agentName: 'Elara',
    threadTier: 'the_first' as never,
    graph,
    essence: 0,
    gameState: { graph, ascendantId: 'asc', tick: 5, unifiedActions: [action] } as unknown as GameState,
    tick: 5,
  });
  return model.narrative.paragraphs.map(p => p.segments.map(s => s.text).join(''));
}

describe('THR-2156 stage — the fit line on a fitting chapter\'s opening step', () => {
  const shadow = tmpl('encounter.shadow_in_the_night');
  const join = tmpl('cg.join');

  it('The First\'s fitting chapter on step 0 opens with "Fits the reader of secrets."', () => {
    const paras = paragraphsFor(shadow, actionFor(shadow, FIRST), makeGraph());
    expect(paras[0]).toBe('Fits the reader of secrets.');
  });

  it('a non-fitting chapter and a stranger\'s chapter carry no fit line', () => {
    expect(paragraphsFor(join, actionFor(join, FIRST), makeGraph())).not.toContain('Fits the reader of secrets.');
    expect(paragraphsFor(shadow, actionFor(shadow, STRANGER), makeGraph())).not.toContain('Fits the reader of secrets.');
  });

  it('the recall chapter carries only the recall line', () => {
    const paras = paragraphsFor(shadow, actionFor(shadow, FIRST, 'ua_recall'), makeGraph('ua_recall'));
    expect(paras).not.toContain('Fits the reader of secrets.');
    expect(paras[0]).toMatch(/reader of secrets/);
  });

  it('firstPathFitFor answers null past the opening step and once resolved', () => {
    const graph = makeGraph();
    const scene = { reach: shadow.reach, motivations: shadow.motivations };
    const base = { actionId: 'ua_1', actorId: FIRST };
    expect(firstPathFitFor(graph, 'asc', { ...base, currentStep: 0, resolved: false }, scene)).toBe('Fits the reader of secrets.');
    expect(firstPathFitFor(graph, 'asc', { ...base, currentStep: 1, resolved: false }, scene)).toBeNull();
    expect(firstPathFitFor(graph, 'asc', { ...base, currentStep: 0, resolved: true }, scene)).toBeNull();
    expect(firstPathFitFor(graph, undefined, { ...base, currentStep: 0, resolved: false }, scene)).toBeNull();
  });
});
