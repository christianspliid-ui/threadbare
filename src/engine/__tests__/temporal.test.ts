import { describe, it, expect, beforeEach } from 'vitest';
import { TemporalController } from '../temporal';
import { WorldGraph } from '../graph';

describe('TemporalController', () => {
  let graph: WorldGraph;
  let controller: TemporalController;

  beforeEach(() => {
    graph = new WorldGraph();
    controller = new TemporalController(graph);

    // Add a basic actor
    graph.addNode({
      id: 'actor.thorin', type: 'actor', name: 'Thorin',
      properties: { actorType: 'individual' },
    });
  });

  describe('clock', () => {
    it('starts at tick 0', () => {
      expect(controller.getClock().currentTick).toBe(0);
    });

    it('advances tick by 1', () => {
      controller.tick();
      expect(controller.getClock().currentTick).toBe(1);
    });

    it('tracks season changes', () => {
      for (let i = 0; i < 90; i++) controller.tick();
      expect(controller.getClock().season).toBe(1);
    });
  });

  describe('action management', () => {
    it('starts an action for an actor', () => {
      controller.startAction({
        actionId: 'act.1',
        actorId: 'actor.thorin',
        templateId: 'template.march',
        targetId: 'loc.fortress',
        domain: 'iron',
        startTick: 0,
        duration: 7,
        progress: 0,
      });
      expect(controller.getActionsForActor('actor.thorin')).toHaveLength(1);
    });

    it('advances action progress each tick', () => {
      controller.startAction({
        actionId: 'act.1',
        actorId: 'actor.thorin',
        templateId: 'template.march',
        targetId: 'loc.fortress',
        domain: 'iron',
        startTick: 0,
        duration: 7,
        progress: 0,
      });
      controller.tick();
      const actions = controller.getActionsForActor('actor.thorin');
      expect(actions[0].progress).toBe(1);
    });

    it('reports completed actions when progress reaches duration', () => {
      controller.startAction({
        actionId: 'act.1',
        actorId: 'actor.thorin',
        templateId: 'template.march',
        targetId: 'loc.fortress',
        domain: 'iron',
        startTick: 0,
        duration: 3,
        progress: 0,
      });
      controller.tick(); // progress 1
      controller.tick(); // progress 2
      const result = controller.tick(); // progress 3 → completed
      expect(result.completedActions).toContain('act.1');
    });

    it('removes completed actions', () => {
      controller.startAction({
        actionId: 'act.1',
        actorId: 'actor.thorin',
        templateId: 'template.march',
        targetId: 'loc.fortress',
        domain: 'iron',
        startTick: 0,
        duration: 1,
        progress: 0,
      });
      controller.tick();
      expect(controller.getActionsForActor('actor.thorin')).toHaveLength(0);
    });

    it('respects AP limits', () => {
      // Individual has 1 AP
      controller.startAction({
        actionId: 'act.1',
        actorId: 'actor.thorin',
        templateId: 'template.march',
        targetId: 'loc.fortress',
        domain: 'iron',
        startTick: 0,
        duration: 7,
        progress: 0,
      });
      expect(() =>
        controller.startAction({
          actionId: 'act.2',
          actorId: 'actor.thorin',
          templateId: 'template.train',
          targetId: 'loc.barracks',
          domain: 'iron',
          startTick: 0,
          duration: 7,
          progress: 0,
        })
      ).toThrow(/AP/);
    });
  });

  describe('getAvailableAP', () => {
    it('returns base AP minus active actions', () => {
      expect(controller.getAvailableAP('actor.thorin')).toBe(1);
      controller.startAction({
        actionId: 'act.1',
        actorId: 'actor.thorin',
        templateId: 'template.march',
        targetId: 'loc.fortress',
        domain: 'iron',
        startTick: 0,
        duration: 7,
        progress: 0,
      });
      expect(controller.getAvailableAP('actor.thorin')).toBe(0);
    });
  });
});
