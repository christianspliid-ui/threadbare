/**
 * Simulation orchestrator.
 * Wires the temporal controller, resolution engine, and agent selection
 * into a single runTick() method.
 */
import { WorldGraph } from './graph';
import { TemporalController } from './temporal';
import { processTraitDecay } from './traits';

export class Simulation {
  readonly graph: WorldGraph;
  readonly clock: TemporalController;

  constructor(graph: WorldGraph) {
    this.graph = graph;
    this.clock = new TemporalController(graph);
  }

  /**
   * Advance one tick.
   * Returns completed action IDs for the caller to handle
   * (resolution, agent selection, UI updates).
   */
  runTick() {
    const tickResult = this.clock.tick();

    // Process trait decay at season boundaries
    if (tickResult.newSeason) {
      const actors = this.graph.getNodesByType('actor');
      for (const actor of actors) {
        processTraitDecay(this.graph, actor.id, this.clock.getClock().currentTick);
      }
    }

    return tickResult;
  }
}
