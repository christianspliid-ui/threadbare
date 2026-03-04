import { describe, it, expect } from 'vitest';
import { classifyEvent, routeEvent, buildChronicleEntry } from '../narrative';
import type { NarrativeEvent, ProseContext } from '../../types/narrative';

describe('narrative pipeline integration', () => {
  it('processes a full sequence of events across all tiers', () => {
    const events: Array<{ event: NarrativeEvent; context: ProseContext }> = [
      {
        event: { id: 'e1', tier: 'routine', eventType: 'action_resolved', description: 'march', tick: 1, sphere: 'force' },
        context: { actorName: 'Volkar', targetName: 'the fortress', sphere: 'force' },
      },
      {
        event: { id: 'e2', tier: 'notable', eventType: 'action_critical', description: 'critical siege', tick: 5, sphere: 'force' },
        context: { actorName: 'Volkar', targetName: 'Iron Gate', sphere: 'force', dominantValues: ['courage_prudence'] },
      },
      {
        event: { id: 'e3', tier: 'routine', eventType: 'trait_acquired', description: 'gained scar', tick: 6, sphere: 'entropy' },
        context: { actorName: 'Volkar', sphere: 'entropy' },
      },
    ];

    const results = events.map(({ event, context }, i) =>
      routeEvent(event, context, i * 100),
    );

    expect(results[0].tier).toBe('routine');
    expect(results[1].tier).toBe('notable');
    expect(results[2].tier).toBe('routine');

    for (const result of results) {
      expect(result.text.length).toBeGreaterThan(10);
    }

    expect(results[1].text.length).toBeGreaterThan(results[0].text.length);
  });

  it('chronicle entries have empty prose ready for LLM', () => {
    const entry = buildChronicleEntry({
      id: 'c1',
      title: 'The Siege of Iron Gate',
      actors: ['Volkar', 'The Iron Judge'],
      location: 'Iron Gate',
      sphere: 'force',
      mood: 'epic',
      tick: 50,
      previousEvents: ['march began', 'walls breached'],
    });

    expect(entry.prose).toBe('');
    expect(entry.promptContext.actors.length).toBe(2);
    expect(entry.promptContext.previousEvents?.length).toBe(2);
  });
});
