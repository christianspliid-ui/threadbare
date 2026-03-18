/**
 * CRUD Action Wiring Tests — verifies that phaseAgentActions creates CRUD actions
 * for idle agents who don't get encounters.
 *
 * This tests the "Phase 2.1" wiring: the orchestrator's phaseAgentActions should
 * call generateActionCandidates + createAction for idle agents, placing actions
 * into state.actionsInProgress so that phaseActionProgress can resolve them.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import { phaseAgentActions } from '../orchestrator';
import { resetActionCounter, isAgentIdle } from '../actionLifecycle';
import { ACTION_TEMPLATES } from '../../data/action-template-content';
import type { GameState } from '../../types/gameState';

describe('CRUD action wiring in phaseAgentActions', () => {
  let graph: WorldGraph;
  let gameState: GameState;

  beforeEach(() => {
    resetActionCounter();

    graph = new WorldGraph();

    // Setup: actor at a location with matching subtype for some templates
    graph.addNode({
      id: 'actor.warrior',
      type: 'actor',
      name: 'Kael',
      properties: {
        actorType: 'individual',
        axiologicalProfile: {
          courage_prudence: 0.5,
          loyalty_ambition: 0.2,
          mercy_ruthlessness: -0.3,
          honesty_cunning: 0.1,
          sacrifice_survival: 0,
          loyalty_ambition: 0,
          tradition_novelty: 0,
          humility_pride: 0,
          mercy_ruthlessness: 0.1,
          asceticism_extravagance: 0,
        },
      },
    });

    graph.addNode({
      id: 'loc.keep',
      type: 'location',
      name: 'The Iron Keep',
      properties: {
        locationType: 'stronghold',
        locationSubtype: 'keep',
      },
    });

    graph.addEdge({
      id: 'edge.located_at.warrior',
      source: 'actor.warrior',
      target: 'loc.keep',
      type: 'located_at',
      properties: {},
    });

    // Add template nodes to graph (needed for performing edges)
    for (const template of ACTION_TEMPLATES) {
      graph.addNode({
        id: template.id,
        type: 'action_template',
        name: template.name,
        properties: { reach: template.reach },
      });
    }

    gameState = {
      tick: 10,
      seed: 42,
      graph,
      ascendant: {
        id: 'avatar',
        name: 'Avatar',
        position: { x: 0, y: 0 },
        sphere: 'force',
        essence: 100,
      },
      actionsInProgress: [],
      encounterProgress: [],
      tickEvents: [],
      doomClock: { stage: 0, progress: 0 },
      mandate: null,
      pendingMandateRoll: true,
      mandateAttempts: 0,
      cycleNumber: 1,
      cycleStartTick: 0,
      worldSoul: {
        fundament: {
          force: 0.5, matter: 0.5, energy: 0.5, life: 0.5,
          mind: 0.5, spirit: 0.5, time: 0.5, entropy: 0.5,
        },
        resonance: [],
      },
      dispositionMap: {},
      familiarityMap: {},
      divineInfluences: [],
      visibilityMap: {},
    };
  });

  it('creates an ActionInProgress for an idle agent who does not get an encounter', () => {
    // Use a seed that reliably makes the encounter RNG fail
    // (encounter chance is low, so most seeds will skip encounters)
    // We run multiple ticks with different seeds until we get a CRUD action
    let foundAction = false;

    for (let seed = 0; seed < 100; seed++) {
      const testState: GameState = {
        ...gameState,
        seed,
        tick: 1,
        actionsInProgress: [],
        tickEvents: [],
        encounterProgress: [],
      };

      const result = phaseAgentActions(testState);

      // Check if any actions were created
      if (result.actionsInProgress && result.actionsInProgress.length > 0) {
        const action = result.actionsInProgress[0];
        expect(action.actorId).toBe('actor.warrior');
        expect(action.templateId).toMatch(/^action\./);
        expect(action.targetId).toBe('loc.keep');
        expect(action.duration).toBeGreaterThan(0);
        expect(action.progress).toBe(0);
        expect(action.resolved).toBeUndefined();
        foundAction = true;
        break;
      }
    }

    expect(foundAction).toBe(true);
  });

  it('does not create CRUD action for an agent already performing an action', () => {
    // Agent already has an active action
    const stateWithAction: GameState = {
      ...gameState,
      actionsInProgress: [{
        actionId: 'action_existing',
        actorId: 'actor.warrior',
        templateId: 'action.iron.drill_militia',
        targetId: 'loc.keep',
        domain: 'iron',
        startTick: 5,
        duration: 3,
        progress: 1,
      }],
    };

    // Try many seeds — none should add a second action
    for (let seed = 0; seed < 50; seed++) {
      const testState = { ...stateWithAction, seed, tick: 1 };
      const result = phaseAgentActions(testState);

      // actionsInProgress should not grow
      const actions = result.actionsInProgress ?? stateWithAction.actionsInProgress;
      const activeForWarrior = actions.filter(
        a => a.actorId === 'actor.warrior' && !a.resolved
      );
      expect(activeForWarrior.length).toBeLessThanOrEqual(1);
    }
  });

  it('CRUD action has a performing edge in the graph after creation', () => {
    let foundAction = false;

    for (let seed = 0; seed < 100; seed++) {
      const testState: GameState = {
        ...gameState,
        seed,
        tick: 1,
        actionsInProgress: [],
        tickEvents: [],
        encounterProgress: [],
      };

      const result = phaseAgentActions(testState);

      if (result.actionsInProgress && result.actionsInProgress.length > 0) {
        const action = result.actionsInProgress[0];
        // Check performing edge exists
        const perfEdges = graph.getOutgoingEdges('actor.warrior', 'performing');
        expect(perfEdges.length).toBeGreaterThan(0);
        expect(perfEdges[0].target).toBe(action.templateId);
        foundAction = true;
        break;
      }
    }

    expect(foundAction).toBe(true);
  });

  it('emits a tick event when a CRUD action is started', () => {
    for (let seed = 0; seed < 100; seed++) {
      const testState: GameState = {
        ...gameState,
        seed,
        tick: 1,
        actionsInProgress: [],
        tickEvents: [],
        encounterProgress: [],
      };

      const result = phaseAgentActions(testState);

      if (result.actionsInProgress && result.actionsInProgress.length > 0) {
        // Should have emitted a tick event about the action starting
        const actionEvents = (result.tickEvents ?? []).filter(
          e => e.message.includes('begins') || e.message.includes('Kael')
        );
        expect(actionEvents.length).toBeGreaterThan(0);
        return; // pass
      }
    }

    // If we never found an action across 100 seeds, fail
    expect(true).toBe(false);
  });
});
