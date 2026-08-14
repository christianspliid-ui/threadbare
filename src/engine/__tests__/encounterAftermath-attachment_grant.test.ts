/**
 * THR-1110 — `attachment_grant`: aftermath consequences can grant any attachment
 * category the authoring spec's palette rule names.
 *
 * The gap this closes: THR-1082's palette rule names all seven attachment
 * categories as legitimate consequence material, but the effect vocabulary could
 * reach only `condition` (via `condition_attachment` / `apply_condition`) and
 * `possession` (via `spawn_artifact`). The other five — `blessing`, `curse`,
 * `bestowed_power`, `spell`, `agreement` — had no granting member at all, so an
 * author's only options were to fake the consequence in prose or drop it.
 *
 * The membership predicate is re-derived here as an executable gate rather than
 * asserted as a count (THR-688 rule A): the final describe walks the whole palette
 * and proves each category lands a real edge. A category that loses its granting
 * path fails this test rather than silently rejoining the aspirational set.
 *
 * Covers:
 *  - node-backed grants (blessing/curse via condition traits, bestowed_power, spell)
 *  - edge-backed agreement grants, including the `$cast:` counterparty binding
 *  - the counterparty guard: no dangling edge when the other party cannot resolve
 *  - durationOverride on both paths
 *
 * The authored crossroads promise is asserted where the rest of the slice's content
 * invariants live: `src/data/encounters/__tests__/vertical-slice.test.ts`.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../graph';
import { applyEncounterAftermathReaction } from '../encounterAftermath';
import { clearTraces, enableTracing, disableTracing, getTraces } from '../traceBuffer';
import { createSimulationRuntime, type SimulationRuntime } from '../simulationRuntime';
import { collectAgentAttachmentInventory } from '../attachmentSlotResolver';
import type { GameState } from '../../types/gameState';
import type {
  EncounterAftermathReaction,
  EncounterAftermathReactionEffect,
  UnifiedAction,
} from '../../types/unifiedAction';
import type { EncounterSupportBinding } from '../../types/encounter';
import { getAgreementTemplate } from '../../data/agreement-reward-catalog';

const HERO = 'actor-hero';
const STRANGER = 'actor-stranger';

/** Template node ids minted into the fixture graph, one per node-backed category. */
const TEMPLATES = {
  blessing: 'tpl.blessing.sunlit',
  curse: 'tpl.curse.hollow',
  bestowed_power: 'tpl.bestowed.farsight',
  spell: 'tpl.spell.emberward',
  possession: 'tpl.possession.iron_knife',
  condition: 'tpl.condition.bruised',
} as const;

function buildState(): GameState {
  const graph = new WorldGraph();
  graph.addNode({ id: HERO, type: 'actor', name: 'Hero', properties: { actorType: 'individual', reputationScore: 0.5 } });
  graph.addNode({ id: STRANGER, type: 'actor', name: 'The Stranger', properties: { actorType: 'individual' } });
  graph.addNode({ id: 'loc-crossroads', type: 'location', name: 'Crossroads', properties: { hexCol: 1, hexRow: 1 } });

  // Node-backed attachment templates. `instantiateReward` reads type + subcategory
  // to pick the edge, exactly as it does for the shipped catalogs.
  graph.addNode({
    id: TEMPLATES.blessing, type: 'trait', name: 'Sunlit',
    properties: { subcategory: 'condition', tags: ['#blessing'], ticksRemaining: 20, domainContributions: { star: 0.1 } },
  });
  graph.addNode({
    id: TEMPLATES.curse, type: 'trait', name: 'Hollow',
    properties: { subcategory: 'condition', tags: ['#curse'], ticksRemaining: 30, domainContributions: { veil: -0.1 } },
  });
  graph.addNode({
    id: TEMPLATES.bestowed_power, type: 'trait', name: 'Farsight',
    properties: { subcategory: 'bestowed', tags: ['#bestowed'], domainContributions: { eye: 0.2 } },
  });
  graph.addNode({
    id: TEMPLATES.spell, type: 'artifact', name: 'Emberward',
    properties: { subcategory: 'spell', tags: ['#spell'], reachBonus: { flame: 0.1 } },
  });
  graph.addNode({
    id: TEMPLATES.possession, type: 'artifact', name: 'Iron Knife',
    properties: { subcategory: 'arms', tags: ['#iron'], reachBonus: { iron: 0.1 } },
  });
  graph.addNode({
    id: TEMPLATES.condition, type: 'trait', name: 'Bruised',
    properties: { subcategory: 'condition', tags: ['#wound'], ticksRemaining: 12 },
  });

  return {
    tick: 10, seed: 42, cycle: 1, phase: 'playing', graph,
    cosmology: {} as never, tiles: [], clock: {} as never,
    ascendantId: 'asc-1', essencePool: {} as never,
    mandateDefinition: null, mandateState: null,
    rivalDefinitions: [], rivalStates: [],
    doomDefinition: {} as never, doomClock: {} as never,
    tickEvents: [], recentEvents: [], chronicleEntries: [],
    stealthExposure: 0, visibilityMap: {} as never, familiarityMap: {} as never,
    culturalInsightMap: new Map(), agentKnowledge: new Map(),
    encounterProgress: [], actionsInProgress: [], unifiedActions: [],
    worldSoul: {} as never, echoDefinitions: [], echoStates: [],
    chronicle: {} as never, encounterNotifications: [],
    clearanceGateStates: new Map(),
  } as unknown as GameState;
}

function makeBinding(key: string, nodeId: string): EncounterSupportBinding {
  return { key, nodeId, kind: 'actor', delivery: 'pre-seeded', persistence: 'must-persist', reused: true } as unknown as EncounterSupportBinding;
}

function makeAction(bindings?: readonly EncounterSupportBinding[]): UnifiedAction {
  return {
    actionId: 'ua_test', actorId: HERO, templateId: 'enc.test',
    targetId: HERO, scale: 'personal', source: 'agent',
    startTick: 1, currentStep: 0, stepProgress: 1, stepDuration: 1,
    resolved: true, outcome: 'success', stepOutcomes: [],
    supportBindings: bindings,
  } as unknown as UnifiedAction;
}

function grantReaction(effect: Partial<EncounterAftermathReactionEffect>): EncounterAftermathReaction {
  return {
    id: 'rx.grant', label: 'test', closeAfterSelection: true,
    effects: [effect as EncounterAftermathReactionEffect],
  };
}

function apply(
  state: GameState,
  runtime: SimulationRuntime,
  effect: Partial<EncounterAftermathReactionEffect>,
  bindings?: readonly EncounterSupportBinding[],
): GameState {
  const { state: next } = applyEncounterAftermathReaction(
    state, makeAction(bindings), grantReaction(effect), 10, runtime,
  );
  return next;
}

/** Every `has_trait` / `possesses` / `bonded_to` edge the hero holds. */
function heldEdges(state: GameState, agentId = HERO) {
  return state.graph.getAllEdges().filter(e => e.source === agentId);
}

/**
 * The effect's own outcome trace. Filtered on `category` as well as `effectKind`,
 * because the dispatcher also emits an `aftermath_target_resolved` trace carrying
 * the same `effectKind` — matching on the kind alone finds that one first and
 * reads its (absent) `failReason` as a pass.
 */
function grantOutcomeTrace(): { success?: boolean; failReason?: string } | undefined {
  return getTraces().find(t =>
    (t as { category?: string }).category === 'encounter_aftermath_effect'
    && (t as { effectKind?: string }).effectKind === 'attachment_grant',
  ) as { success?: boolean; failReason?: string } | undefined;
}

describe('attachment_grant — node-backed categories', () => {
  let runtime: SimulationRuntime;
  beforeEach(() => { clearTraces(); enableTracing(); runtime = createSimulationRuntime(); });
  afterEach(() => { clearTraces(); disableTracing(); });

  it.each([
    ['blessing', TEMPLATES.blessing, 'has_trait'],
    ['curse', TEMPLATES.curse, 'has_trait'],
    ['bestowed_power', TEMPLATES.bestowed_power, 'has_trait'],
    ['spell', TEMPLATES.spell, 'possesses'],
  ])('grants a %s through the existing reward path', (_label, templateId, edgeType) => {
    const next = apply(buildState(), runtime, { kind: 'attachment_grant', templateId });
    const edge = heldEdges(next).find(e => e.type === edgeType && e.target.includes(templateId));
    expect(edge, `expected a ${edgeType} edge for ${templateId}`).toBeDefined();
    // The instance is a clone, not the template itself — the catalog stays unowned.
    expect(edge!.target).not.toBe(templateId);
    expect(next.graph.getNode(edge!.target)?.name).toBe(next.graph.getNode(templateId)?.name);
  });

  it('defaults the recipient to the encounter actor', () => {
    const next = apply(buildState(), runtime, { kind: 'attachment_grant', templateId: TEMPLATES.blessing });
    expect(heldEdges(next, HERO).some(e => e.type === 'has_trait')).toBe(true);
    expect(heldEdges(next, STRANGER)).toHaveLength(0);
  });

  it('honours an explicit targetAgentId', () => {
    const next = apply(buildState(), runtime, {
      kind: 'attachment_grant', templateId: TEMPLATES.blessing, targetAgentId: STRANGER,
    });
    expect(heldEdges(next, STRANGER).some(e => e.type === 'has_trait')).toBe(true);
    expect(heldEdges(next, HERO)).toHaveLength(0);
  });

  it('durationOverride replaces the template default on the written edge', () => {
    const next = apply(buildState(), runtime, {
      kind: 'attachment_grant', templateId: TEMPLATES.blessing, durationOverride: 7,
    });
    const edge = heldEdges(next).find(e => e.type === 'has_trait');
    expect(edge?.properties.ticksRemaining).toBe(7);
    expect(edge?.properties.totalTicks).toBe(7);
  });

  it('durationOverride: null makes an otherwise-expiring grant permanent', () => {
    const next = apply(buildState(), runtime, {
      kind: 'attachment_grant', templateId: TEMPLATES.curse, durationOverride: null,
    });
    const edge = heldEdges(next).find(e => e.type === 'has_trait');
    expect(edge?.properties.ticksRemaining).toBeNull();
  });

  it('an unknown template id no-ops with a failure trace rather than throwing (NFP #4)', () => {
    const next = apply(buildState(), runtime, { kind: 'attachment_grant', templateId: 'tpl.does.not.exist' });
    expect(heldEdges(next)).toHaveLength(0);
    expect(grantOutcomeTrace()?.failReason).toBe('template_or_recipient_missing');
  });
});

describe('attachment_grant — agreements (edge-backed, two parties)', () => {
  let runtime: SimulationRuntime;
  beforeEach(() => { clearTraces(); enableTracing(); runtime = createSimulationRuntime(); });
  afterEach(() => { clearTraces(); disableTracing(); });

  it('writes a relates_to agreement edge between the two named parties', () => {
    const next = apply(buildState(), runtime, {
      kind: 'attachment_grant',
      templateId: 'agreement.bargain.promise_given',
      counterpartyId: STRANGER,
    });
    const edge = heldEdges(next).find(e => e.type === 'relates_to' && e.properties.agreement === true);
    expect(edge).toBeDefined();
    expect(edge!.target).toBe(STRANGER);
    expect(edge!.properties.agreementName).toBe('A Promise Given');
    expect(edge!.properties.agreementType).toBe('bargain');
    expect(edge!.properties.active).toBe(true);
  });

  it('binds a $cast: counterparty from the scene support bindings', () => {
    const next = apply(
      buildState(), runtime,
      {
        kind: 'attachment_grant',
        templateId: 'agreement.bargain.promise_given',
        counterpartyId: '$cast:stranger',
      },
      [makeBinding('stranger', STRANGER)],
    );
    const edge = heldEdges(next).find(e => e.type === 'relates_to' && e.properties.agreement === true);
    expect(edge?.target).toBe(STRANGER);
  });

  it('durationOverride sets the agreement term', () => {
    const next = apply(buildState(), runtime, {
      kind: 'attachment_grant',
      templateId: 'agreement.bargain.promise_given',
      counterpartyId: STRANGER,
      durationOverride: 132,
    });
    const edge = heldEdges(next).find(e => e.type === 'relates_to' && e.properties.agreement === true);
    expect(edge?.properties.ticksRemaining).toBe(132);
    // The catalog default is permanent — the override is what makes it fall due.
    expect(getAgreementTemplate('agreement.bargain.promise_given')?.ticksRemaining).toBeNull();
  });

  it('the granted agreement is readable back as an agreement attachment', () => {
    const next = apply(buildState(), runtime, {
      kind: 'attachment_grant',
      templateId: 'agreement.bargain.promise_given',
      counterpartyId: STRANGER,
    });
    const held = collectAgentAttachmentInventory(next.graph, HERO);
    expect(held.some(a => a.kind === 'agreement' && a.name === 'A Promise Given')).toBe(true);
  });

  it('writes NO edge when the counterparty is omitted — a promise needs someone on the other end', () => {
    const next = apply(buildState(), runtime, {
      kind: 'attachment_grant', templateId: 'agreement.bargain.promise_given',
    });
    expect(heldEdges(next).filter(e => e.type === 'relates_to')).toHaveLength(0);
    expect(grantOutcomeTrace()?.failReason).toBe('counterparty_missing');
  });

  it('writes NO dangling edge when the counterparty names a node that does not exist', () => {
    const next = apply(buildState(), runtime, {
      kind: 'attachment_grant',
      templateId: 'agreement.bargain.promise_given',
      counterpartyId: 'actor-ghost',
    });
    expect(heldEdges(next).filter(e => e.type === 'relates_to')).toHaveLength(0);
    expect(grantOutcomeTrace()?.failReason).toBe('counterparty_unresolved');
  });

  it('writes NO edge when a $cast: counterparty has no matching binding (unbound sentinel)', () => {
    const next = apply(buildState(), runtime, {
      kind: 'attachment_grant',
      templateId: 'agreement.bargain.promise_given',
      counterpartyId: '$cast:nobody',
    });
    expect(heldEdges(next).filter(e => e.type === 'relates_to')).toHaveLength(0);
  });
});

describe('attachment_grant — the palette rule is no longer aspirational', () => {
  let runtime: SimulationRuntime;
  beforeEach(() => { clearTraces(); enableTracing(); runtime = createSimulationRuntime(); });
  afterEach(() => { clearTraces(); disableTracing(); });

  /**
   * The predicate, executable. Each of the seven palette categories must land a
   * real edge on the bearer through an authored aftermath effect. This is the
   * gate that stops a category quietly rejoining the unreachable set.
   */
  it('every attachment category in the palette lands a real edge from an authored consequence', () => {
    const cases: Array<{ category: string; effect: Partial<EncounterAftermathReactionEffect> }> = [
      { category: 'possession', effect: { kind: 'attachment_grant', templateId: TEMPLATES.possession } },
      { category: 'condition', effect: { kind: 'attachment_grant', templateId: TEMPLATES.condition } },
      { category: 'blessing', effect: { kind: 'attachment_grant', templateId: TEMPLATES.blessing } },
      { category: 'curse', effect: { kind: 'attachment_grant', templateId: TEMPLATES.curse } },
      { category: 'bestowed_power', effect: { kind: 'attachment_grant', templateId: TEMPLATES.bestowed_power } },
      { category: 'spell', effect: { kind: 'attachment_grant', templateId: TEMPLATES.spell } },
      {
        category: 'agreement',
        effect: {
          kind: 'attachment_grant',
          templateId: 'agreement.bargain.promise_given',
          counterpartyId: STRANGER,
        },
      },
    ];

    const unreachable: string[] = [];
    for (const { category, effect } of cases) {
      const next = apply(buildState(), runtime, effect);
      if (heldEdges(next).length === 0) unreachable.push(category);
    }

    expect(unreachable, `categories the aftermath vocabulary still cannot grant: ${unreachable.join(', ')}`)
      .toEqual([]);
  });
});
