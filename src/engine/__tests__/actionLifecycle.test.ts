import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import {
  createAction,
  progressAction,
  completeAction,
  getActiveActions,
  isAgentIdle,
  isActionComplete,
  resetActionCounter,
} from '../actionLifecycle';
import type { ActionInProgress } from '../../types/temporal';

describe('actionLifecycle', () => {
  let graph: WorldGraph;

  beforeEach(() => {
    resetActionCounter();
    graph = new WorldGraph();
    graph.addNode({
      id: 'agent.1',
      type: 'actor',
      name: 'Alice',
      properties: { actorType: 'individual' },
    });
    graph.addNode({
      id: 'loc.1',
      type: 'location',
      name: 'Market',
      properties: {},
    });
    // Add action template node so performing edges can target it
    graph.addNode({
      id: 'action.gold.trade',
      type: 'action_template',
      name: 'Trade',
      properties: { domain: 'gold' },
    });
    graph.addNode({
      id: 'action.iron.war',
      type: 'action_template',
      name: 'War',
      properties: { domain: 'iron' },
    });
  });

  describe('createAction', () => {
    it('should return ActionInProgress with performing edge', () => {
      const action = createAction(graph, {
        actorId: 'agent.1',
        templateId: 'action.gold.trade',
        targetId: 'loc.1',
        domain: 'gold',
        duration: 3,
        tick: 10,
      });

      expect(action.actionId).toBeDefined();
      expect(action.actorId).toBe('agent.1');
      expect(action.templateId).toBe('action.gold.trade');
      expect(action.targetId).toBe('loc.1');
      expect(action.domain).toBe('gold');
      expect(action.progress).toBe(0);
      expect(action.duration).toBe(3);
      expect(action.startTick).toBe(10);
      expect(action.resolved).toBeUndefined();
      expect(action.outcome).toBeUndefined();

      // Should have performing edge
      const edges = graph.getOutgoingEdges('agent.1', 'performing');
      expect(edges).toHaveLength(1);
      expect(edges[0].source).toBe('agent.1');
      expect(edges[0].type).toBe('performing');
    });

    it('should accept optional encounterId', () => {
      const action = createAction(graph, {
        actorId: 'agent.1',
        templateId: 'action.gold.trade',
        targetId: 'loc.1',
        domain: 'gold',
        duration: 3,
        tick: 10,
        encounterId: 'enc.1',
      });

      expect(action.encounterId).toBe('enc.1');
    });

    it('should create unique action IDs', () => {
      const action1 = createAction(graph, {
        actorId: 'agent.1',
        templateId: 'action.gold.trade',
        targetId: 'loc.1',
        domain: 'gold',
        duration: 3,
        tick: 10,
      });

      const action2 = createAction(graph, {
        actorId: 'agent.1',
        templateId: 'action.gold.trade',
        targetId: 'loc.1',
        domain: 'gold',
        duration: 3,
        tick: 10,
      });

      expect(action1.actionId).not.toBe(action2.actionId);
    });
  });

  describe('progressAction', () => {
    it('should increment progress by 1', () => {
      const action = createAction(graph, {
        actorId: 'agent.1',
        templateId: 'action.gold.trade',
        targetId: 'loc.1',
        domain: 'gold',
        duration: 3,
        tick: 10,
      });

      const updated = progressAction(action);
      expect(updated.progress).toBe(1);
    });

    it('should return new object without mutation', () => {
      const action = createAction(graph, {
        actorId: 'agent.1',
        templateId: 'action.gold.trade',
        targetId: 'loc.1',
        domain: 'gold',
        duration: 3,
        tick: 10,
      });

      const updated = progressAction(action);
      expect(action.progress).toBe(0);
      expect(updated.progress).toBe(1);
      expect(action).not.toBe(updated);
    });

    it('should preserve all other fields', () => {
      const action = createAction(graph, {
        actorId: 'agent.1',
        templateId: 'action.gold.trade',
        targetId: 'loc.1',
        domain: 'gold',
        duration: 3,
        tick: 10,
      });

      const updated = progressAction(action);
      expect(updated.actionId).toBe(action.actionId);
      expect(updated.actorId).toBe(action.actorId);
      expect(updated.templateId).toBe(action.templateId);
      expect(updated.targetId).toBe(action.targetId);
      expect(updated.domain).toBe(action.domain);
      expect(updated.duration).toBe(action.duration);
      expect(updated.startTick).toBe(action.startTick);
    });
  });

  describe('isActionComplete', () => {
    it('should return false when progress < duration', () => {
      const action = createAction(graph, {
        actorId: 'agent.1',
        templateId: 'action.gold.trade',
        targetId: 'loc.1',
        domain: 'gold',
        duration: 3,
        tick: 10,
      });
      expect(isActionComplete(action)).toBe(false);
    });

    it('should return true when progress equals duration', () => {
      let action = createAction(graph, {
        actorId: 'agent.1',
        templateId: 'action.gold.trade',
        targetId: 'loc.1',
        domain: 'gold',
        duration: 2,
        tick: 10,
      });

      action = progressAction(action); // progress = 1
      expect(isActionComplete(action)).toBe(false);

      action = progressAction(action); // progress = 2
      expect(isActionComplete(action)).toBe(true);
    });

    it('should return true when progress > duration', () => {
      let action = createAction(graph, {
        actorId: 'agent.1',
        templateId: 'action.gold.trade',
        targetId: 'loc.1',
        domain: 'gold',
        duration: 2,
        tick: 10,
      });

      action = progressAction(action);
      action = progressAction(action);
      action = progressAction(action); // progress = 3, duration = 2

      expect(isActionComplete(action)).toBe(true);
    });
  });

  describe('isAgentIdle', () => {
    it('should return true when no active actions', () => {
      expect(isAgentIdle([], 'agent.1')).toBe(true);
    });

    it('should return true when agent has only resolved actions', () => {
      const action = createAction(graph, {
        actorId: 'agent.1',
        templateId: 'action.gold.trade',
        targetId: 'loc.1',
        domain: 'gold',
        duration: 1,
        tick: 10,
      });
      const completed = completeAction(graph, action, 'success');
      expect(isAgentIdle([completed], 'agent.1')).toBe(true);
    });

    it('should return false when agent has active action', () => {
      const action = createAction(graph, {
        actorId: 'agent.1',
        templateId: 'action.gold.trade',
        targetId: 'loc.1',
        domain: 'gold',
        duration: 3,
        tick: 10,
      });
      expect(isAgentIdle([action], 'agent.1')).toBe(false);
    });

    it('should ignore other agents actions', () => {
      graph.addNode({
        id: 'agent.2',
        type: 'actor',
        name: 'Bob',
        properties: { actorType: 'individual' },
      });

      const action = createAction(graph, {
        actorId: 'agent.2',
        templateId: 'action.gold.trade',
        targetId: 'loc.1',
        domain: 'gold',
        duration: 3,
        tick: 10,
      });
      expect(isAgentIdle([action], 'agent.1')).toBe(true);
    });
  });

  describe('getActiveActions', () => {
    it('should return empty array when no actions provided', () => {
      expect(getActiveActions([])).toHaveLength(0);
    });

    it('should filter out resolved actions', () => {
      const action = createAction(graph, {
        actorId: 'agent.1',
        templateId: 'action.gold.trade',
        targetId: 'loc.1',
        domain: 'gold',
        duration: 1,
        tick: 10,
      });
      const resolved = completeAction(graph, action, 'success');
      expect(getActiveActions([resolved])).toHaveLength(0);
    });

    it('should keep unresolved actions', () => {
      const action = createAction(graph, {
        actorId: 'agent.1',
        templateId: 'action.gold.trade',
        targetId: 'loc.1',
        domain: 'gold',
        duration: 3,
        tick: 10,
      });
      expect(getActiveActions([action])).toHaveLength(1);
      expect(getActiveActions([action])[0]).toBe(action);
    });

    it('should filter correctly with mixed resolved and unresolved', () => {
      const action1 = createAction(graph, {
        actorId: 'agent.1',
        templateId: 'action.gold.trade',
        targetId: 'loc.1',
        domain: 'gold',
        duration: 1,
        tick: 10,
      });

      const action2 = createAction(graph, {
        actorId: 'agent.1',
        templateId: 'action.iron.war',
        targetId: 'loc.1',
        domain: 'iron',
        duration: 3,
        tick: 11,
      });

      const resolved = completeAction(graph, action1, 'success');
      const active = getActiveActions([resolved, action2]);

      expect(active).toHaveLength(1);
      expect(active[0].actionId).toBe(action2.actionId);
    });
  });

  describe('completeAction', () => {
    it('should mark action as resolved', () => {
      const action = createAction(graph, {
        actorId: 'agent.1',
        templateId: 'action.gold.trade',
        targetId: 'loc.1',
        domain: 'gold',
        duration: 1,
        tick: 10,
      });

      const completed = completeAction(graph, action, 'success');

      expect(completed.resolved).toBe(true);
      expect(completed.outcome).toBe('success');
    });

    it('should remove performing edge from graph', () => {
      const action = createAction(graph, {
        actorId: 'agent.1',
        templateId: 'action.gold.trade',
        targetId: 'loc.1',
        domain: 'gold',
        duration: 1,
        tick: 10,
      });

      // Verify edge exists before completion
      let edges = graph.getOutgoingEdges('agent.1', 'performing');
      expect(edges).toHaveLength(1);

      const completed = completeAction(graph, action, 'success');

      // Verify edge is removed after completion
      edges = graph.getOutgoingEdges('agent.1', 'performing');
      expect(edges).toHaveLength(0);
    });

    it('should preserve original action unchanged', () => {
      const action = createAction(graph, {
        actorId: 'agent.1',
        templateId: 'action.gold.trade',
        targetId: 'loc.1',
        domain: 'gold',
        duration: 1,
        tick: 10,
      });

      const completed = completeAction(graph, action, 'success');

      expect(action.resolved).toBeUndefined();
      expect(action.outcome).toBeUndefined();
      expect(completed.resolved).toBe(true);
      expect(completed.outcome).toBe('success');
    });

    it('should handle different outcome strings', () => {
      const action = createAction(graph, {
        actorId: 'agent.1',
        templateId: 'action.gold.trade',
        targetId: 'loc.1',
        domain: 'gold',
        duration: 1,
        tick: 10,
      });

      const completed1 = completeAction(graph, action, 'success');
      expect(completed1.outcome).toBe('success');

      const action2 = createAction(graph, {
        actorId: 'agent.1',
        templateId: 'action.gold.trade',
        targetId: 'loc.1',
        domain: 'gold',
        duration: 1,
        tick: 10,
      });

      const completed2 = completeAction(graph, action2, 'failure');
      expect(completed2.outcome).toBe('failure');
    });
  });
});
