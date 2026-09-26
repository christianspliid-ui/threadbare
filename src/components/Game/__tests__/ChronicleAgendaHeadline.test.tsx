// @vitest-environment jsdom
/**
 * THR-1585 — a notable agenda's Chronicle headline names the notable and the
 * agenda in game words. The player read
 * `NOTABLE-AGENDA-NPC_86-CAMPAIGN-T120 — BANNERS-CALLED`: the composition id
 * and the phase id. THR-1602 removed the composition id from the runner's
 * fallback; this closes the missing subject by giving every agenda phase a
 * title, the way rival scheme phases have one.
 *
 * Built through the real path: `buildNotableAgenda` → the composition runner
 * (`phaseComposition`) writes the chronicle entry → `ChronicleEntryCard`
 * renders its header.
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChronicleEntryCard } from '../ChronicleEntryCard';
import { WorldGraph } from '../../../engine/graph';
import { buildNotableAgenda } from '../../../engine/notableAgendas';
import { phaseComposition } from '../../../engine/phaseComposition';
import { NOTABLE_AGENDA_FAMILIES } from '../../../data/notable-agendas';
import type { GameState } from '../../../types/gameState';
import type { GraphNode } from '../../../types/graph';

const ID_LEAK = /notable-agenda-|npc_/i;

function makeState(): GameState {
  const graph = new WorldGraph();
  graph.addNode({ id: 'asc-1', type: 'actor', name: 'The Witness', properties: {} } as GraphNode);
  graph.addNode({ id: 'npc_86', type: 'actor', name: 'Harn Vosk', properties: {} } as GraphNode);
  return {
    tick: 120,
    cycle: 0,
    seed: 42,
    graph,
    phase: 'playing',
    tiles: [],
    ascendantId: 'asc-1',
    rivalDefinitions: [],
    rivalStates: [],
    doomClock: { currentTick: 0, totalTicks: 1000, stage: 1 },
    doomIdentityMatrix: null,
    tickEvents: [],
    chronicleEntries: [],
    stealthExposure: 0,
    activeCompositions: [],
    worldFlags: {},
    firedCompositions: [],
    storyBeatQueue: [],
    pendingSpherePressures: [],
  } as unknown as GameState;
}

describe('notable agenda chronicle headline (THR-1585)', () => {
  it.each(NOTABLE_AGENDA_FAMILIES.map((f) => [f.id, f] as const))(
    '%s: the rendered header names the notable and the agenda, never an id',
    (_id, family) => {
      const state = makeState();
      const plan = buildNotableAgenda(
        'npc_86', 'Harn Vosk', 'The Iron Court', family, state.tick, undefined, undefined, () => 0,
      );
      state.activeCompositions = [plan.composition];
      state.worldFlags = { ...plan.worldFlagUpdates };

      Object.assign(state, phaseComposition(state));

      const entry = state.chronicleEntries.find((c) => c.id.includes(family.beats[0].phaseId));
      expect(entry).toBeDefined();

      const { container, unmount } = render(
        <ChronicleEntryCard entry={entry!} voiceMode="interleaved" currentTick={state.tick} />,
      );
      const header = screen.getByText(/Harn Vosk's/);
      expect(header.textContent).toContain(`Harn Vosk's ${family.label.toLowerCase()}: `);
      expect(container.textContent ?? '').not.toMatch(ID_LEAK);
      unmount();
    },
  );
});
