import { describe, expect, it } from 'vitest';
import { WorldGraph } from '../../../../../engine/graph';
import { RIVAL_SHRINE_BETRAYAL_TEMPLATE } from '../../../../../data/encounters/rival-shrine-betrayal';
import type { EncounterNotification } from '../../../../../types/encounterVisibility';
import type { UnifiedAction, UnifiedActionTemplate, ActionStep } from '../../../../../types/unifiedAction';
import { buildUnifiedEncounterStageModel } from '../buildUnifiedEncounterStageModel';
import { enrichProse, gatherNarrativeContext } from '../../../../../engine/proseEnrichment';

// ─── Fixtures ─────────────────────────────────────────────────────

/** A simple 2-step linear template (no branching, no support bundle). */
const LINEAR_TEMPLATE: UnifiedActionTemplate = {
  id: 'test.linear_encounter',
  rarityTier: 1,
  intrinsicTier: 'background',
  name: 'The River Crossing',
  reach: 'iron',
  crudType: 'read',
  scale: 'local',
  steps: [
    {
      reach: 'iron',
      duration: { min: 1, max: 2 },
      difficulty: 0.3,
      onSuccess: [],
      onFailure: [],
      failBehavior: 'continue_weakened',
      narrativeTemplate: 'The ford was shallow but swift. The agent tested each stepping stone before committing weight.',
      successMetadata: { reputationDelta: 0.05 },
      failureMetadata: { reputationDelta: -0.1 },
    } satisfies ActionStep,
    {
      reach: 'iron',
      duration: { min: 2, max: 3 },
      difficulty: 0.5,
      onSuccess: [],
      onFailure: [],
      failBehavior: 'fail_action',
      narrativeTemplate: 'Halfway across the water rose. The agent braced against the current and pushed forward.',
    } satisfies ActionStep,
  ],
  apCost: 1,
  actorAffinities: ['individual'],
  motivations: ['courage_prudence'],
  narrativeTemplates: {
    initiation: 'A swollen river blocks the trade route. Crossing it means risking the current.',
    success: 'The agent made it across. The trade route is open.',
    failure: 'The current swept the agent downstream. The crossing failed.',
  },
};

function buildGraph(): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({ id: 'agent.scout', type: 'actor', name: 'Kael the Scout', properties: { actorType: 'individual' } });
  graph.addNode({ id: 'loc.ford', type: 'location', name: 'Stoneford Crossing', properties: {} });
  graph.addNode({ id: 'loc.waystation', type: 'location', name: 'Northern Waystation', properties: {} });
  graph.addNode({ id: 'npc.tessaly', type: 'actor', name: 'Tessaly the Broker', properties: { actorType: 'individual' } });
  graph.addNode({ id: 'npc.carin', type: 'actor', name: 'Carin Harken', properties: { actorType: 'individual' } });
  return graph;
}

function buildLinearAction(): UnifiedAction {
  return {
    actionId: 'ua_linear_1',
    actorId: 'agent.scout',
    templateId: LINEAR_TEMPLATE.id,
    targetId: 'loc.ford',
    scale: 'local',
    source: 'agent',
    startTick: 5,
    currentStep: 0,
    stepProgress: 0,
    stepDuration: 2,
    resolved: false,
    stepOutcomes: [],
  };
}

function buildNotification(overrides?: Partial<EncounterNotification>): EncounterNotification {
  return {
    id: 'notif-test-1',
    agentId: 'agent.scout',
    agentName: 'Kael the Scout',
    courtPosition: 'the_first',
    encounterId: LINEAR_TEMPLATE.id,
    encounterName: LINEAR_TEMPLATE.name,
    prose: 'The river is rising.',
    choices: [
      {
        id: 'choice-support',
        text: 'Brace the crossing',
        interventionType: 'supportive',
        probabilityBoost: 0.1,
        essenceCost: 1,
        godVoice: 'Hold fast.',
      },
      {
        id: 'choice-withdraw',
        text: 'Let mortal courage decide',
        interventionType: 'withdrawn',
        probabilityBoost: 0,
        essenceCost: 0,
      },
    ],
    createdTick: 5,
    autoResolveTick: null,
    viewed: false,
    resolved: false,
    ...overrides,
  };
}

// ─── Tests ────────────────────────────────────────────────────────

describe('buildUnifiedEncounterStageModel', () => {
  describe('linear template', () => {
    it('produces a valid EncounterStageModel from a simple linear template', () => {
      const graph = buildGraph();
      const model = buildUnifiedEncounterStageModel({
        template: LINEAR_TEMPLATE,
        activeAction: buildLinearAction(),
        notification: buildNotification(),
        agentName: 'Kael the Scout',
        threadTier: 'strong',
        graph,
        essence: 10,
      });

      // Top-level structure
      expect(model.header).toBeDefined();
      expect(model.scene).toBeDefined();
      expect(model.narrative).toBeDefined();
      expect(model.choices).toBeDefined();
      expect(model.history).toBeDefined();
      expect(model.factions).toEqual([]);
      expect(model.signals).toEqual([]);
    });

    it('uses template name for the header title', () => {
      const graph = buildGraph();
      const model = buildUnifiedEncounterStageModel({
        template: LINEAR_TEMPLATE,
        activeAction: buildLinearAction(),
        notification: buildNotification(),
        agentName: 'Kael the Scout',
        threadTier: 'strong',
        graph,
        essence: 10,
      });

      expect(model.header.title).toBe('The River Crossing');
      expect(model.header.threadTier).toBe('strong');
      expect(model.header.familyLabel).toBe('Kael the Scout');
    });

    it('resolves location label from target node', () => {
      const graph = buildGraph();
      const model = buildUnifiedEncounterStageModel({
        template: LINEAR_TEMPLATE,
        activeAction: buildLinearAction(),
        notification: buildNotification(),
        agentName: 'Kael the Scout',
        threadTier: 'strong',
        graph,
        essence: 10,
      });

      expect(model.header.locationLabel).toBe('Stoneford Crossing');
    });

    it('populates narrative paragraphs from step narrativeTemplate', () => {
      const graph = buildGraph();
      const model = buildUnifiedEncounterStageModel({
        template: LINEAR_TEMPLATE,
        activeAction: buildLinearAction(),
        notification: buildNotification(),
        agentName: 'Kael the Scout',
        threadTier: 'strong',
        graph,
        essence: 10,
      });

      expect(model.narrative.paragraphs.length).toBeGreaterThan(0);
      const allText = model.narrative.paragraphs
        .flatMap(p => p.segments)
        .map(s => s.text)
        .join(' ');
      expect(allText).toContain('ford was shallow');
    });

    it('populates choices from notification', () => {
      const graph = buildGraph();
      const model = buildUnifiedEncounterStageModel({
        template: LINEAR_TEMPLATE,
        activeAction: buildLinearAction(),
        notification: buildNotification(),
        agentName: 'Kael the Scout',
        threadTier: 'strong',
        graph,
        essence: 10,
      });

      expect(model.choices).toHaveLength(2);
      expect(model.choices[0].label).toBe('Brace the crossing');
      expect(model.choices[0].essenceCost).toBe(1);
      expect(model.choices[0].affordable).toBe(true);
      expect(model.choices[1].label).toBe('Let mortal courage decide');
      expect(model.choices[1].essenceCost).toBe(0);
    });

    it('marks choices unaffordable when essence is insufficient', () => {
      const graph = buildGraph();
      const model = buildUnifiedEncounterStageModel({
        template: LINEAR_TEMPLATE,
        activeAction: buildLinearAction(),
        notification: buildNotification(),
        agentName: 'Kael the Scout',
        threadTier: 'strong',
        graph,
        essence: 0,
      });

      expect(model.choices[0].affordable).toBe(false);
      expect(model.choices[1].affordable).toBe(true); // free choice
    });

    it('builds step history with correct statuses', () => {
      const graph = buildGraph();

      // Action on step 0 with no outcomes yet
      const model = buildUnifiedEncounterStageModel({
        template: LINEAR_TEMPLATE,
        activeAction: buildLinearAction(),
        notification: buildNotification(),
        agentName: 'Kael the Scout',
        threadTier: 'strong',
        graph,
        essence: 10,
      });

      expect(model.history).toHaveLength(2);
      expect(model.history[0].status).toBe('current');
      expect(model.history[1].status).toBe('future');
    });

    it('marks resolved steps in history', () => {
      const graph = buildGraph();
      const action = {
        ...buildLinearAction(),
        currentStep: 1,
        stepOutcomes: ['success' as const],
      };

      const model = buildUnifiedEncounterStageModel({
        template: LINEAR_TEMPLATE,
        activeAction: action,
        notification: buildNotification(),
        agentName: 'Kael the Scout',
        threadTier: 'strong',
        graph,
        essence: 10,
      });

      expect(model.history[0].status).toBe('resolved');
      expect(model.history[0].afterimage).toBe('Succeeded');
      expect(model.history[1].status).toBe('current');
    });

    it('has no aftermath when action has no aftermathSummary', () => {
      const graph = buildGraph();
      const model = buildUnifiedEncounterStageModel({
        template: LINEAR_TEMPLATE,
        activeAction: buildLinearAction(),
        notification: buildNotification(),
        agentName: 'Kael the Scout',
        threadTier: 'strong',
        graph,
        essence: 10,
      });

      expect(model.aftermath).toBeUndefined();
    });

    it('populates aftermath when aftermathSummary exists on the action', () => {
      const graph = buildGraph();
      const action: UnifiedAction = {
        ...buildLinearAction(),
        resolved: true,
        outcome: 'success',
        stepOutcomes: ['success', 'success'],
        aftermathSummary: {
          encounterId: LINEAR_TEMPLATE.id,
          outcome: 'success',
          overview: 'The crossing succeeded. The trade route is restored.',
          changes: [
            {
              id: 'crossing_rep',
              kind: 'reputation',
              title: 'Reputation Gained',
              detail: 'The settlement respects the agent for braving the crossing.',
              polarity: 'gain',
            },
          ],
          reactionPrompt: 'The route is open. What next?',
          reactions: [
            {
              id: 'react_trade',
              label: 'Establish a permanent bridge.',
              intent: 'Build infrastructure to prevent future flooding.',
              effects: [],
            },
          ],
        },
      };

      const model = buildUnifiedEncounterStageModel({
        template: LINEAR_TEMPLATE,
        activeAction: action,
        notification: buildNotification(),
        agentName: 'Kael the Scout',
        threadTier: 'strong',
        graph,
        essence: 10,
      });

      expect(model.aftermath).toBeDefined();
      expect(model.aftermath!.overview).toContain('crossing succeeded');
      expect(model.aftermath!.highlights).toHaveLength(1);
      expect(model.aftermath!.highlights![0].title).toBe('Reputation Gained');
      expect(model.aftermath!.highlights![0].tone).toBe('gain');
      expect(model.aftermath!.reactionPrompt).toContain('What next?');
      expect(model.aftermath!.reactions).toHaveLength(1);
      expect(model.aftermath!.reactions![0].label).toContain('permanent bridge');
    });

    it('populates fallout preview from step metadata', () => {
      const graph = buildGraph();
      const model = buildUnifiedEncounterStageModel({
        template: LINEAR_TEMPLATE,
        activeAction: buildLinearAction(),
        notification: buildNotification(),
        agentName: 'Kael the Scout',
        threadTier: 'strong',
        graph,
        essence: 10,
      });

      // Step 0 has both success and failure reputation metadata
      expect(model.falloutPreview.length).toBeGreaterThan(0);
      expect(model.falloutPreview.some(f => f.kind === 'reputation')).toBe(true);
    });

    it('returns empty cast when template has no support bundle', () => {
      const graph = buildGraph();
      const model = buildUnifiedEncounterStageModel({
        template: LINEAR_TEMPLATE,
        activeAction: buildLinearAction(),
        notification: buildNotification(),
        agentName: 'Kael the Scout',
        threadTier: 'strong',
        graph,
        essence: 10,
      });

      expect(model.cast).toEqual([]);
    });

    it('maps difficulty to threat label', () => {
      const graph = buildGraph();

      // Step 0 difficulty is 0.3 → "Easy"
      const model = buildUnifiedEncounterStageModel({
        template: LINEAR_TEMPLATE,
        activeAction: buildLinearAction(),
        notification: buildNotification(),
        agentName: 'Kael the Scout',
        threadTier: 'strong',
        graph,
        essence: 10,
      });

      expect(model.header.threatLabel).toBe('Easy');
    });

    it('populates interventionType, godVoice, and probabilityBoost on choices', () => {
      const graph = buildGraph();
      const notification = buildNotification({
        choices: [
          {
            id: 'choice-1',
            text: 'Force it',
            essenceCost: 2,
            probabilityBoost: 0.2,
            interventionType: 'coercive',
            godVoice: 'Let them burn.',
          },
        ],
      });
      const model = buildUnifiedEncounterStageModel({
        template: LINEAR_TEMPLATE,
        activeAction: buildLinearAction(),
        notification,
        agentName: 'Kael the Scout',
        threadTier: 'strong',
        graph,
        essence: 10,
      });
      expect(model.choices[0].interventionType).toBe('coercive');
      expect(model.choices[0].godVoice).toBe('Let them burn.');
      expect(model.choices[0].probabilityBoost).toBe(0.2);
    });
  });

  describe('branching template (rival-shrine-betrayal)', () => {
    function buildBranchingAction(): UnifiedAction {
      return {
        actionId: 'ua_broker_1',
        actorId: 'agent.scout',
        templateId: RIVAL_SHRINE_BETRAYAL_TEMPLATE.id,
        targetId: 'loc.waystation',
        scale: 'local',
        source: 'agent',
        startTick: 10,
        currentStep: 0,
        stepProgress: 0,
        stepDuration: 3,
        resolved: false,
        stepOutcomes: [],
        supportBindings: [
          { key: 'tessaly', nodeId: 'npc.tessaly', kind: 'actor', delivery: 'lazy-materialize-on-trigger', persistence: 'must-persist', reused: false },
          { key: 'carin_harken', nodeId: 'npc.carin', kind: 'actor', delivery: 'lazy-materialize-on-trigger', persistence: 'must-persist', reused: false },
          { key: 'meeting_point', nodeId: 'loc.waystation', kind: 'location', delivery: 'pre-seeded', persistence: 'scene-only', reused: true },
        ],
      };
    }

    function buildBranchingNotification(): EncounterNotification {
      return {
        id: 'notif-broker-1',
        agentId: 'agent.scout',
        agentName: 'Kael the Scout',
        courtPosition: 'the_first',
        encounterId: RIVAL_SHRINE_BETRAYAL_TEMPLATE.id,
        encounterName: RIVAL_SHRINE_BETRAYAL_TEMPLATE.name,
        prose: 'Tessaly spread the ledger on the table.',
        choices: [
          {
            id: 'accept_trade',
            text: 'Accept the trade — deliver the curing technique for the shrine location.',
            interventionType: 'coercive',
            probabilityBoost: 0,
            essenceCost: 2,
          },
          {
            id: 'refuse_trade',
            text: 'Refuse — Brinewall is not for sale.',
            interventionType: 'supportive',
            probabilityBoost: 0,
            essenceCost: 1,
          },
        ],
        createdTick: 10,
        autoResolveTick: null,
        viewed: false,
        resolved: false,
      };
    }

    it('produces a valid EncounterStageModel from a branching template', () => {
      const graph = buildGraph();
      const model = buildUnifiedEncounterStageModel({
        template: RIVAL_SHRINE_BETRAYAL_TEMPLATE,
        activeAction: buildBranchingAction(),
        notification: buildBranchingNotification(),
        agentName: 'Kael the Scout',
        threadTier: 'strong',
        graph,
        essence: 10,
      });

      expect(model.header).toBeDefined();
      expect(model.scene).toBeDefined();
      expect(model.narrative.paragraphs.length).toBeGreaterThan(0);
      expect(model.choices).toHaveLength(2);
      expect(model.history).toHaveLength(2);
    });

    it('uses template name for branching encounter header', () => {
      const graph = buildGraph();
      const model = buildUnifiedEncounterStageModel({
        template: RIVAL_SHRINE_BETRAYAL_TEMPLATE,
        activeAction: buildBranchingAction(),
        notification: buildBranchingNotification(),
        agentName: 'Kael the Scout',
        threadTier: 'strong',
        graph,
        essence: 10,
      });

      expect(model.header.title).toBe("The Broker's Ledger");
    });

    it('populates cast from support bundle actor specs', () => {
      const graph = buildGraph();
      const model = buildUnifiedEncounterStageModel({
        template: RIVAL_SHRINE_BETRAYAL_TEMPLATE,
        activeAction: buildBranchingAction(),
        notification: buildBranchingNotification(),
        agentName: 'Kael the Scout',
        threadTier: 'strong',
        graph,
        essence: 10,
      });

      // Support bundle has 2 actor specs (tessaly, carin_harken)
      expect(model.cast).toHaveLength(2);
      expect(model.cast.find(c => c.name === 'Tessaly the Broker')).toBeDefined();
      expect(model.cast.find(c => c.name === 'Carin Harken')).toBeDefined();
    });

    it('resolves cast names from graph when bindings exist', () => {
      const graph = buildGraph();
      const model = buildUnifiedEncounterStageModel({
        template: RIVAL_SHRINE_BETRAYAL_TEMPLATE,
        activeAction: buildBranchingAction(),
        notification: buildBranchingNotification(),
        agentName: 'Kael the Scout',
        threadTier: 'strong',
        graph,
        essence: 10,
      });

      // npc.tessaly has name 'Tessaly the Broker' in graph, npc.carin has 'Carin Harken'
      const tessaly = model.cast.find(c => c.id === 'tessaly');
      expect(tessaly?.name).toBe('Tessaly the Broker');
      const carin = model.cast.find(c => c.id === 'carin_harken');
      expect(carin?.name).toBe('Carin Harken');
    });

    it('marks branching steps in history', () => {
      const graph = buildGraph();
      const model = buildUnifiedEncounterStageModel({
        template: RIVAL_SHRINE_BETRAYAL_TEMPLATE,
        activeAction: buildBranchingAction(),
        notification: buildBranchingNotification(),
        agentName: 'Kael the Scout',
        threadTier: 'strong',
        graph,
        essence: 10,
      });

      // Step 1 is a branch point
      expect(model.history[1].stepLabel).toContain('branching');
    });

    it('resolves branched step narrative when on step 1 with accept choice', () => {
      const graph = buildGraph();
      const action: UnifiedAction = {
        ...buildBranchingAction(),
        currentStep: 1,
        stepOutcomes: ['success'],
        choiceHistory: [
          {
            stepIndex: 0,
            stepId: 'step-0',
            choiceId: 'accept_trade',
            choiceText: 'Accept the trade',
            interventionType: 'coercive',
            essenceSpent: 2,
            probabilityBoost: 0,
            tick: 10,
          },
        ],
      };

      const model = buildUnifiedEncounterStageModel({
        template: RIVAL_SHRINE_BETRAYAL_TEMPLATE,
        activeAction: action,
        notification: buildBranchingNotification(),
        agentName: 'Kael the Scout',
        threadTier: 'strong',
        graph,
        essence: 10,
      });

      // The narrative should come from the accept_trade branch (step1AcceptExtraction)
      const allText = model.narrative.paragraphs
        .flatMap(p => p.segments)
        .map(s => s.text)
        .join(' ');
      expect(allText).toContain('Carin Harken');
    });

    it('resolves branched step narrative when on step 1 with refuse choice', () => {
      const graph = buildGraph();
      const action: UnifiedAction = {
        ...buildBranchingAction(),
        currentStep: 1,
        stepOutcomes: ['success'],
        choiceHistory: [
          {
            stepIndex: 0,
            stepId: 'step-0',
            choiceId: 'refuse_trade',
            choiceText: 'Refuse the trade',
            interventionType: 'supportive',
            essenceSpent: 1,
            probabilityBoost: 0,
            tick: 10,
          },
        ],
      };

      const model = buildUnifiedEncounterStageModel({
        template: RIVAL_SHRINE_BETRAYAL_TEMPLATE,
        activeAction: action,
        notification: buildBranchingNotification(),
        agentName: 'Kael the Scout',
        threadTier: 'strong',
        graph,
        essence: 10,
      });

      // The narrative should come from the refuse_trade branch (step1RefuseRefusal)
      const allText = model.narrative.paragraphs
        .flatMap(p => p.segments)
        .map(s => s.text)
        .join(' ');
      expect(allText).toContain('No.');
    });

    it('uses difficulty 0 threat label for the offer step', () => {
      const graph = buildGraph();
      const model = buildUnifiedEncounterStageModel({
        template: RIVAL_SHRINE_BETRAYAL_TEMPLATE,
        activeAction: buildBranchingAction(),
        notification: buildBranchingNotification(),
        agentName: 'Kael the Scout',
        threadTier: 'strong',
        graph,
        essence: 10,
      });

      // Step 0 difficulty is 0 → Trivial
      expect(model.header.threatLabel).toBe('Trivial');
    });
  });

  // ─── Prose enrichment parity + regression lock ────────────────────
  //
  // These tests verify that the unified adapter enriches all narrative
  // strings identically to calling enrichProse() directly. They serve as
  // the quality gate for every content phase that migrates templates.

  describe('enrichProse parity and regression lock', () => {
    /** Build a graph with rich agent state: faction, location, weapon artifact, ally. */
    function buildRichGraph(): WorldGraph {
      const graph = new WorldGraph();
      graph.addNode({
        id: 'agent.richscout',
        type: 'actor',
        name: 'Serafina',
        properties: { actorType: 'individual', gender: 'female' },
      });
      graph.addNode({ id: 'loc.keep', type: 'location', name: 'Thornwall Keep', properties: {} });
      graph.addNode({
        id: 'artifact.blade',
        type: 'artifact',
        name: 'The Ashen Blade',
        properties: { tier: 'storied', reach: 'iron' },
      });
      graph.addNode({
        id: 'npc.ally',
        type: 'actor',
        name: 'Brother Cael',
        properties: { actorType: 'individual' },
      });
      graph.addNode({ id: 'faction.guild', type: 'faction', name: 'Ironblood Guild', properties: {} });
      graph.addEdge({ id: 'e1', type: 'located_at', source: 'agent.richscout', target: 'loc.keep', properties: {} });
      graph.addEdge({ id: 'e2', type: 'possesses', source: 'agent.richscout', target: 'artifact.blade', properties: {} });
      // relates_to is the edge type used by getAgentBonds
      graph.addEdge({ id: 'e3', type: 'relates_to', source: 'agent.richscout', target: 'npc.ally', properties: { sentiment: 0.8 } });
      // rank >= 3 is required for factionRank to be non-null (enables {has_faction} conditional)
      graph.addEdge({ id: 'e4', type: 'member_of', source: 'agent.richscout', target: 'faction.guild', properties: { role: 'member', rank: 3 } });
      return graph;
    }

    /** Template exercising every placeholder variant and conditional block. */
    const PLACEHOLDER_TEMPLATE: UnifiedActionTemplate = {
      id: 'test.placeholder_heavy',
      rarityTier: 1,
      intrinsicTier: 'background',
      name: 'The Enriched Encounter',
      reach: 'iron',
      crudType: 'read',
      scale: 'local',
      steps: [
        {
          reach: 'iron',
          duration: { min: 1, max: 2 },
          difficulty: 0.4,
          onSuccess: [],
          onFailure: [],
          failBehavior: 'continue_weakened',
          narrativeTemplate: '{name} stands at {location} with {artifact:weapon}, trusting {ally:strongest}. {?has_faction}The {faction} watches.{/has_faction}',
          successAfterimage: '{name} succeeded at {location}.',
          failureAfterimage: '{name} failed at {location}.',
        } satisfies ActionStep,
      ],
      apCost: 1,
      actorAffinities: ['individual'],
      motivations: [],
      narrativeTemplates: {
        initiation: '{name} arrives at {location}. {?has_ally}An ally stands nearby.{/has_ally}',
        success: '{name} prevailed.',
        failure: '{name} fell.',
      },
    };

    function buildRichAction(): UnifiedAction {
      return {
        actionId: 'ua_rich_1',
        actorId: 'agent.richscout',
        templateId: PLACEHOLDER_TEMPLATE.id,
        targetId: 'loc.keep',
        scale: 'local',
        source: 'agent',
        startTick: 1,
        currentStep: 0,
        stepProgress: 0,
        stepDuration: 2,
        resolved: false,
        stepOutcomes: [],
      };
    }

    function buildRichNotification(): EncounterNotification {
      return {
        id: 'notif-rich-1',
        agentId: 'agent.richscout',
        agentName: 'Serafina',
        courtPosition: 'the_first',
        encounterId: PLACEHOLDER_TEMPLATE.id,
        encounterName: PLACEHOLDER_TEMPLATE.name,
        prose: 'Something stirs.',
        choices: [
          {
            id: 'c1',
            text: 'Proceed',
            interventionType: 'supportive',
            probabilityBoost: 0,
            essenceCost: 0,
          },
        ],
        createdTick: 1,
        autoResolveTick: null,
        viewed: false,
        resolved: false,
      };
    }

    it('parity: narrative paragraphs match direct enrichProse output for same inputs', () => {
      const graph = buildRichGraph();
      const ctx = gatherNarrativeContext(graph, 'agent.richscout');
      const expectedText = enrichProse(
        '{name} stands at {location} with {artifact:weapon}, trusting {ally:strongest}. {?has_faction}The {faction} watches.{/has_faction}',
        ctx,
      );

      const model = buildUnifiedEncounterStageModel({
        template: PLACEHOLDER_TEMPLATE,
        activeAction: buildRichAction(),
        notification: buildRichNotification(),
        agentName: 'Serafina',
        threadTier: 'strong',
        graph,
        essence: 10,
      });

      const allText = model.narrative.paragraphs
        .flatMap(p => p.segments)
        .map(s => s.text)
        .join(' ');
      expect(allText).toContain(expectedText.trim());
    });

    it('regression: {name} resolves in narrative', () => {
      const graph = buildRichGraph();
      const model = buildUnifiedEncounterStageModel({
        template: PLACEHOLDER_TEMPLATE,
        activeAction: buildRichAction(),
        notification: buildRichNotification(),
        agentName: 'Serafina',
        threadTier: 'strong',
        graph,
        essence: 10,
      });

      const allText = model.narrative.paragraphs.flatMap(p => p.segments).map(s => s.text).join(' ');
      expect(allText).toContain('Serafina');
      expect(allText).not.toMatch(/\{name\}/);
    });

    it('regression: {location} resolves in narrative', () => {
      const graph = buildRichGraph();
      const model = buildUnifiedEncounterStageModel({
        template: PLACEHOLDER_TEMPLATE,
        activeAction: buildRichAction(),
        notification: buildRichNotification(),
        agentName: 'Serafina',
        threadTier: 'strong',
        graph,
        essence: 10,
      });

      const allText = model.narrative.paragraphs.flatMap(p => p.segments).map(s => s.text).join(' ');
      expect(allText).toContain('Thornwall Keep');
      expect(allText).not.toMatch(/\{location\}/);
    });

    it('regression: {artifact:weapon} resolves in narrative', () => {
      const graph = buildRichGraph();
      const model = buildUnifiedEncounterStageModel({
        template: PLACEHOLDER_TEMPLATE,
        activeAction: buildRichAction(),
        notification: buildRichNotification(),
        agentName: 'Serafina',
        threadTier: 'strong',
        graph,
        essence: 10,
      });

      const allText = model.narrative.paragraphs.flatMap(p => p.segments).map(s => s.text).join(' ');
      expect(allText).toContain('The Ashen Blade');
      expect(allText).not.toMatch(/\{artifact:weapon\}/);
    });

    it('regression: {ally:strongest} resolves in narrative', () => {
      const graph = buildRichGraph();
      const model = buildUnifiedEncounterStageModel({
        template: PLACEHOLDER_TEMPLATE,
        activeAction: buildRichAction(),
        notification: buildRichNotification(),
        agentName: 'Serafina',
        threadTier: 'strong',
        graph,
        essence: 10,
      });

      const allText = model.narrative.paragraphs.flatMap(p => p.segments).map(s => s.text).join(' ');
      expect(allText).toContain('Brother Cael');
      expect(allText).not.toMatch(/\{ally:strongest\}/);
    });

    it('regression: {?has_faction}...{/has_faction} conditional resolves when faction present', () => {
      const graph = buildRichGraph();
      const model = buildUnifiedEncounterStageModel({
        template: PLACEHOLDER_TEMPLATE,
        activeAction: buildRichAction(),
        notification: buildRichNotification(),
        agentName: 'Serafina',
        threadTier: 'strong',
        graph,
        essence: 10,
      });

      const allText = model.narrative.paragraphs.flatMap(p => p.segments).map(s => s.text).join(' ');
      // Conditional block should be rendered (agent has a faction)
      expect(allText).toContain('watches');
      expect(allText).not.toMatch(/\{[?/]/);
    });

    it('regression: {?has_ally}...{/has_ally} conditional resolves in initiation prose', () => {
      const graph = buildRichGraph();
      const model = buildUnifiedEncounterStageModel({
        template: PLACEHOLDER_TEMPLATE,
        activeAction: buildRichAction(),
        notification: buildRichNotification(),
        agentName: 'Serafina',
        threadTier: 'strong',
        graph,
        essence: 10,
      });

      // Initiation prose is used in scene.situationProse
      expect(model.scene.situationProse).toContain('An ally stands nearby');
      expect(model.scene.situationProse).not.toMatch(/\{[?/]/);
    });

    it('regression: {?has_faction} conditional suppressed when no faction', () => {
      const graph = new WorldGraph();
      graph.addNode({
        id: 'agent.loner',
        type: 'actor',
        name: 'Isolde',
        properties: { actorType: 'individual' },
      });
      graph.addNode({ id: 'loc.ruins', type: 'location', name: 'Broken Ruins', properties: {} });
      graph.addEdge({ id: 'e1', type: 'located_at', source: 'agent.loner', target: 'loc.ruins', properties: {} });

      const lonerAction: UnifiedAction = {
        ...buildRichAction(),
        actorId: 'agent.loner',
        targetId: 'loc.ruins',
      };
      const lonerNotification: EncounterNotification = {
        ...buildRichNotification(),
        agentId: 'agent.loner',
        agentName: 'Isolde',
      };

      const model = buildUnifiedEncounterStageModel({
        template: PLACEHOLDER_TEMPLATE,
        activeAction: lonerAction,
        notification: lonerNotification,
        agentName: 'Isolde',
        threadTier: 'strong',
        graph,
        essence: 10,
      });

      const allText = model.narrative.paragraphs.flatMap(p => p.segments).map(s => s.text).join(' ');
      // Faction conditional should be suppressed
      expect(allText).not.toContain('watches');
      expect(allText).not.toMatch(/\{[?/]/);
    });

    it('regression: pronouns resolve in narrative ({they}/{them}/{their})', () => {
      const graph = buildRichGraph(); // Serafina is female
      const templateWithPronouns: UnifiedActionTemplate = {
        ...PLACEHOLDER_TEMPLATE,
        id: 'test.pronoun_test',
        steps: [
          {
            ...PLACEHOLDER_TEMPLATE.steps[0],
            narrativeTemplate: '{They} drew {their} weapon. {name} trusts {them}.',
          } as ActionStep,
        ],
      };

      const model = buildUnifiedEncounterStageModel({
        template: templateWithPronouns,
        activeAction: { ...buildRichAction(), templateId: 'test.pronoun_test' },
        notification: buildRichNotification(),
        agentName: 'Serafina',
        threadTier: 'strong',
        graph,
        essence: 10,
      });

      const allText = model.narrative.paragraphs.flatMap(p => p.segments).map(s => s.text).join(' ');
      expect(allText).toContain('She drew her weapon');
      expect(allText).not.toMatch(/\{[Tt]hey?\}|\{their\}|\{them\}/);
    });

    it('regression: afterimage strings are enriched (successAfterimage)', () => {
      const graph = buildRichGraph();
      const action: UnifiedAction = {
        ...buildRichAction(),
        currentStep: 1,
        stepOutcomes: ['success' as const],
      };
      // Template with only 1 step resolved
      const singleStepTemplate: UnifiedActionTemplate = {
        ...PLACEHOLDER_TEMPLATE,
        steps: [PLACEHOLDER_TEMPLATE.steps[0]],
      };

      const model = buildUnifiedEncounterStageModel({
        template: singleStepTemplate,
        activeAction: { ...action, currentStep: 0, resolved: true },
        notification: buildRichNotification(),
        agentName: 'Serafina',
        threadTier: 'strong',
        graph,
        essence: 10,
      });

      // successAfterimage: '{name} succeeded at {location}.'
      expect(model.history[0].afterimage).toContain('Serafina');
      expect(model.history[0].afterimage).toContain('Thornwall Keep');
      expect(model.history[0].afterimage).not.toMatch(/\{name\}|\{location\}/);
    });

    it('regression: aftermath overview is enriched', () => {
      const graph = buildRichGraph();
      const action: UnifiedAction = {
        ...buildRichAction(),
        resolved: true,
        outcome: 'success',
        stepOutcomes: ['success' as const],
        aftermathSummary: {
          encounterId: PLACEHOLDER_TEMPLATE.id,
          outcome: 'success',
          overview: '{name} brought glory to {location}.',
          changes: [],
          reactionPrompt: 'What next?',
          reactions: [],
        },
      };

      const model = buildUnifiedEncounterStageModel({
        template: PLACEHOLDER_TEMPLATE,
        activeAction: action,
        notification: buildRichNotification(),
        agentName: 'Serafina',
        threadTier: 'strong',
        graph,
        essence: 10,
      });

      expect(model.aftermath!.overview).toContain('Serafina');
      expect(model.aftermath!.overview).toContain('Thornwall Keep');
      expect(model.aftermath!.overview).not.toMatch(/\{name\}|\{location\}/);
    });

    it('regression: aftermath change.detail is enriched (highlight path)', () => {
      // Verifies that change details in the aftermath highlights path are enriched.
      // Without this test, reverting the enrichedDetail usage would still pass the suite.
      const graph = buildRichGraph();
      const action: UnifiedAction = {
        ...buildRichAction(),
        resolved: true,
        outcome: 'success',
        stepOutcomes: ['success' as const],
        aftermathSummary: {
          encounterId: PLACEHOLDER_TEMPLATE.id,
          outcome: 'success',
          overview: 'The crossing is done.',
          changes: [
            {
              id: 'change_detail_test',
              kind: 'future_hook',
              title: 'A Thread Remains',
              detail: '{name} left a mark at {location} that will not be forgotten.',
              polarity: 'gain',
            },
          ],
          reactionPrompt: 'What now?',
          reactions: [],
        },
      };

      const model = buildUnifiedEncounterStageModel({
        template: PLACEHOLDER_TEMPLATE,
        activeAction: action,
        notification: buildRichNotification(),
        agentName: 'Serafina',
        threadTier: 'strong',
        graph,
        essence: 10,
      });

      expect(model.aftermath!.highlights).toHaveLength(1);
      const detail = model.aftermath!.highlights![0].detail;
      expect(detail).toContain('Serafina');
      expect(detail).toContain('Thornwall Keep');
      expect(detail).not.toMatch(/\{name\}|\{location\}/);
    });

    it('regression: authored choice label and intent are enriched', () => {
      // Verifies enrichment of the authoredChoices path, which is separate from
      // the notification fallback path.
      const graph = buildRichGraph();
      const templateWithChoices: UnifiedActionTemplate = {
        ...PLACEHOLDER_TEMPLATE,
        id: 'test.authored_choices',
        authoredChoices: {
          0: [
            {
              id: 'choice_a',
              label: 'Draw {artifact:weapon} and stand firm',
              intent: '{name} plants their feet at {location} and refuses to yield.',
              likelyBurden: '{name} may exhaust {their} reserves.',
              essenceCost: 1,
              interventionType: 'supportive',
            },
          ],
        },
      };

      const model = buildUnifiedEncounterStageModel({
        template: templateWithChoices,
        activeAction: { ...buildRichAction(), templateId: 'test.authored_choices' },
        notification: buildRichNotification(),
        agentName: 'Serafina',
        threadTier: 'strong',
        graph,
        essence: 10,
      });

      expect(model.choices[0].label).toContain('The Ashen Blade');
      expect(model.choices[0].label).not.toMatch(/\{artifact:weapon\}/);
      expect(model.choices[0].intent).toContain('Serafina');
      expect(model.choices[0].intent).toContain('Thornwall Keep');
      expect(model.choices[0].intent).not.toMatch(/\{name\}|\{location\}/);
      expect(model.choices[0].likelyBurden).toContain('Serafina');
      expect(model.choices[0].likelyBurden).toContain('her');
      expect(model.choices[0].likelyBurden).not.toMatch(/\{name\}|\{their\}/);
    });

    it('regression: no raw braces remain in any narrative surface after enrichment', () => {
      const graph = buildRichGraph();
      const actionWithAftermath: UnifiedAction = {
        ...buildRichAction(),
        resolved: true,
        outcome: 'success',
        stepOutcomes: ['success' as const],
        aftermathSummary: {
          encounterId: PLACEHOLDER_TEMPLATE.id,
          outcome: 'success',
          overview: '{name} triumphed at {location}.',
          changes: [
            {
              id: 'sweep_change',
              kind: 'future_hook',
              title: 'Echo',
              detail: '{name} will be remembered here.',
              polarity: 'gain',
            },
          ],
          reactionPrompt: 'Choose.',
          reactions: [],
        },
      };

      const model = buildUnifiedEncounterStageModel({
        template: PLACEHOLDER_TEMPLATE,
        activeAction: actionWithAftermath,
        notification: buildRichNotification(),
        agentName: 'Serafina',
        threadTier: 'strong',
        graph,
        essence: 10,
      });

      const surfaces = [
        model.header.subtitle ?? '',
        model.scene.situationProse,
        model.scene.pressureProse,
        ...model.narrative.paragraphs.flatMap(p => p.segments).map(s => s.text),
        model.aftermath?.overview ?? '',
        ...(model.aftermath?.highlights ?? []).map(h => h.detail),
      ];

      for (const surface of surfaces) {
        expect(surface, `raw brace in: "${surface}"`).not.toMatch(/\{[a-zA-Z?/]/);
      }
    });
  });
});
