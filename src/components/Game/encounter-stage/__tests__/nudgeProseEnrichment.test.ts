/**
 * Nudge-card prose enrichment — THR-923.
 *
 * The bug this pins: `buildNudgePhaseModel` assigned every authored string
 * straight off the template, so an encounter whose *header* resolved `{they}`
 * correctly (that path runs through `enrichProse`) shipped the raw token two
 * inches below it on the card. Measured on `encounter.shrine_offering`, the
 * rendered dialog read "The pack empties onto the stone and {they} look at each
 * item…". 28+ authored fields in `encounter-content.ts` alone carry these tokens.
 *
 * These tests assert against `buildNudgePhaseModel` OUTPUT rather than against a
 * call count, because "does it call enrichProse" is not the property that matters
 * — "does a player ever see a brace" is. Each carries its falsification twin: a
 * fixture-integrity check proving the tokens are actually present in the input,
 * so the sweep cannot pass by being handed token-free prose.
 */

import { describe, expect, it } from 'vitest';
import { WorldGraph } from '../../../../engine/graph';
import type { GameState } from '../../../../types/gameState';
import type {
  ActionStep,
  StepNudge,
  UnifiedAction,
  UnifiedActionTemplate,
} from '../../../../types/unifiedAction';
import { buildNudgePhaseModel } from '../adapters/buildNudgePhaseModel';
import { gatherNarrativeContext } from '../../../../engine/proseEnrichment';

/**
 * Any `{token}` a player could read. Deliberately broader than the tokens the
 * fixture uses: an authored typo (`{Actor}` misspelled, a new placeholder nobody
 * wired) must fail here rather than ship, which is the regression this guards.
 */
const RAW_TOKEN = /\{[A-Za-z][A-Za-z0-9_:.-]*\}/;

const NUDGES: StepNudge[] = [
  {
    id: 'pronoun_card',
    name: 'Steady {their} hand',
    essenceCost: 1,
    forecastDelta: 0.08,
    fiction: 'The pack empties onto the stone and {they} look at each item in turn.',
    effectLine: '{They} will not flinch this time.',
  },
  {
    id: 'actor_card',
    name: 'Name {their} debt',
    essenceCost: 1,
    forecastDelta: 0.05,
    fiction: '{actor} turns out what {they} carry onto a flat stone.',
    effectLine: '{Actor} pays in full.',
  },
];

const STEP: ActionStep = {
  reach: 'iron',
  duration: { min: 1, max: 2 },
  difficulty: 0.5,
  onSuccess: [],
  onFailure: [],
  failBehavior: 'continue_weakened',
  narrativeTemplate: 'A god is owed better than the cheapest item in the pack.',
  purposeLine: 'Whether {they} can give up the coin {they} kept for this.',
  factorLines: [
    { text: '{They} have carried the same coin since spring, keeping it for this.', polarity: 'for' },
    { text: '{Actor} has never paid a shrine in {their} life.', polarity: 'against' },
  ],
  nudges: NUDGES,
};

const TEMPLATE: UnifiedActionTemplate = {
  id: 'test.nudge_prose',
  rarityTier: 1,
  intrinsicTier: 'background',
  name: 'The Shrine Offering',
  reach: 'iron',
  crudType: 'read',
  scale: 'local',
  steps: [STEP],
  apCost: 1,
  actorAffinities: ['individual'],
  motivations: ['courage_prudence'],
  narrativeTemplates: {
    initiation: 'A god is owed better than the cheapest item in the pack.',
    success: 'The coin goes onto the stone.',
    failure: 'The coin stays in the pack.',
  },
};

function buildGraph(): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({
    id: 'agent.pilgrim',
    type: 'actor',
    name: 'Sera Vance',
    // Gendered so substitution is *observable*: a they/them default would make
    // "{they} → they" indistinguishable from "the token was left alone and the
    // braces happened to be stripped".
    properties: { actorType: 'individual', gender: 'female' },
  });
  graph.addNode({ id: 'loc.shrine', type: 'location', name: 'The Roadside Shrine', properties: {} });
  return graph;
}

function buildAction(): UnifiedAction {
  return {
    actionId: 'ua_prose_1',
    actorId: 'agent.pilgrim',
    templateId: TEMPLATE.id,
    targetId: 'loc.shrine',
    scale: 'local',
    source: 'agent',
    startTick: 3,
    currentStep: 0,
    stepProgress: 0,
    stepDuration: 2,
    resolved: false,
    stepOutcomes: [],
  };
}

const STATE = {
  essencePool: { force: 5 } as unknown as GameState['essencePool'],
  unlockedActionIds: [],
} as Partial<GameState>;

/** Every player-facing string the phase model emits, flattened. */
function proseStrings(phase: NonNullable<ReturnType<typeof buildNudgePhaseModel>>): string[] {
  return [
    phase.testPanel.purposeLine ?? '',
    ...phase.testPanel.factors.map((f) => f.text),
    ...phase.cards.flatMap((c) => [c.name, c.fiction, c.effectLine]),
    ...phase.withheld.map((w) => w.name),
    phase.motive?.introLine ?? '',
    phase.motive?.sentence ?? '',
  ];
}

// ─── Fixture integrity (the falsification twin) ───────────────────

describe('THR-923 fixture integrity', () => {
  it('the authored template really does carry raw tokens, so a clean sweep below means work was done', () => {
    const authored = [
      STEP.purposeLine ?? '',
      ...(STEP.factorLines ?? []).map((l) => l.text),
      ...NUDGES.flatMap((n) => [n.name, n.fiction, n.effectLine]),
    ];
    // Not "some" — every one of these fields is a site the adapter assigns from,
    // and a fixture that lost its tokens on one of them would silently stop
    // covering that site.
    for (const text of authored) {
      expect(text).toMatch(RAW_TOKEN);
    }
  });
});

// ─── The regression ───────────────────────────────────────────────

describe('buildNudgePhaseModel — authored prose is enriched (THR-923)', () => {
  it('leaves no raw {token} in any player-facing string, with the caller threading a context', () => {
    const graph = buildGraph();
    const action = buildAction();
    const phase = buildNudgePhaseModel({
      template: TEMPLATE,
      activeAction: action,
      step: STEP,
      graph,
      gameState: STATE as GameState,
      narrativeContext: gatherNarrativeContext(graph, action.actorId),
    });

    expect(phase).toBeDefined();
    for (const text of proseStrings(phase!)) {
      expect(text).not.toMatch(RAW_TOKEN);
    }
  });

  it('enriches on its own when no context is threaded, so a caller cannot reopen the hole', () => {
    const phase = buildNudgePhaseModel({
      template: TEMPLATE,
      activeAction: buildAction(),
      step: STEP,
      graph: buildGraph(),
      gameState: STATE as GameState,
    });

    expect(phase).toBeDefined();
    for (const text of proseStrings(phase!)) {
      expect(text).not.toMatch(RAW_TOKEN);
    }
  });

  it('substitutes the real values rather than merely stripping the braces', () => {
    const graph = buildGraph();
    const action = buildAction();
    const phase = buildNudgePhaseModel({
      template: TEMPLATE,
      activeAction: action,
      step: STEP,
      graph,
      gameState: STATE as GameState,
      narrativeContext: gatherNarrativeContext(graph, action.actorId),
    });

    const byId = new Map(phase!.cards.map((c) => [c.id, c]));

    // Pronouns resolve to the agent's gendered set, not the they/them default.
    // The corpus is written for they/them, so a gendered agent yields "she look"
    // rather than "she looks" — `{s}` is the token that carries verb agreement and
    // this fixture deliberately omits it. That is the enricher's contract, not a
    // defect introduced here; the assertion pins substitution, not grammar.
    expect(byId.get('pronoun_card')!.name).toBe('Steady her hand');
    expect(byId.get('pronoun_card')!.fiction).toBe(
      'The pack empties onto the stone and she look at each item in turn.',
    );
    expect(byId.get('pronoun_card')!.effectLine).toBe('She will not flinch this time.');

    // `{actor}` is an alias of `{name}` (THR-933); `{Actor}` is its sentence-initial form.
    expect(byId.get('actor_card')!.fiction).toBe(
      'Sera Vance turns out what she carry onto a flat stone.',
    );
    expect(byId.get('actor_card')!.effectLine).toBe('Sera Vance pays in full.');

    // The test panel is the same surface: purpose line and authored factor lines.
    expect(phase!.testPanel.purposeLine).toBe('Whether she can give up the coin she kept for this.');
    const authoredFactors = phase!.testPanel.factors.filter((f) => f.id.startsWith('authored:'));
    expect(authoredFactors.map((f) => f.text)).toEqual([
      'She have carried the same coin since spring, keeping it for this.',
      'Sera Vance has never paid a shrine in her life.',
    ]);
  });
});
