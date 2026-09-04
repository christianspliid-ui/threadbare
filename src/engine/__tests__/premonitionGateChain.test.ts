// @vitest-lane heavy — builds a seeded-identity world and drives it 200 ticks (THR-1414)
/**
 * THR-1414 — the whisper never surfaced.
 *
 * An attended sweep polled `getOpenModals()` for `PremonitionModal` after every
 * single tick across four seeded runs (~280 ticks) and never saw one. This probe
 * asks the engine directly, on a *generated* world rather than a fixture: over 200
 * ticks, how many whispers reach `premonitionQueue`, and when none do, which gate
 * in the chain rejected?
 *
 * The gate attribution comes from `evaluatePremonitionGates`, the same function
 * `phaseDivinePremonition` itself evaluates — so a probe that says "gate X rejects"
 * cannot drift from what production does.
 */

import { describe, it, expect } from 'vitest';
import { initializeGameStateFromIdentity, devSeedTheFirst, DEV_ASCENDANT_IDENTITY } from '../gameInit';
import { runTick } from '../orchestrator';
import { evaluatePremonitionGates, type PremonitionGate } from '../phaseDivinePremonition';
import { getThreadedAgents } from '../graphQueries';
import { createBalancedCosmology } from '../cosmology';
import { MULTI_WORLD_SIM_TEST_TIMEOUT_MS } from '../../testing/testTimeouts';
import type { GameState } from '../../types/gameState';

const PROBE_TICKS = 200;

/** Attribute every threaded actor's gate verdict for the current tick. */
function tallyGates(state: GameState, tally: Map<PremonitionGate | 'eligible', number>): void {
  const pending = new Set((state.premonitionQueue ?? []).map(p => p.agentId));
  for (const node of getThreadedAgents(state.graph, state.ascendantId)) {
    const verdict = evaluatePremonitionGates(node, state, pending) ?? 'eligible';
    tally.set(verdict, (tally.get(verdict) ?? 0) + 1);
  }
}

describe('THR-1414 — divine premonition gate chain, on a generated world', () => {
  it(
    'pushes at least one whisper onto premonitionQueue within 200 ticks of the seeded identity',
    { timeout: MULTI_WORLD_SIM_TEST_TIMEOUT_MS },
    () => {
      let { state } = initializeGameStateFromIdentity(
        DEV_ASCENDANT_IDENTITY,
        42,
        createBalancedCosmology(),
        'medium',
      );
      // `?view=game&seeded` boots the identity and *then* seeds The First — the
      // thread edge lives in devSeedTheFirst, not in world init. Without it the
      // world carries no thread and the phase returns before any gate is read.
      devSeedTheFirst(state);

      const gateTally = new Map<PremonitionGate | 'eligible', number>();
      const seenPremonitionIds = new Set<string>();
      const displayableIds = new Set<string>();
      let ticksWithThreadedAgents = 0;

      for (let i = 0; i < PROBE_TICKS; i++) {
        state = runTick(state);

        if (getThreadedAgents(state.graph, state.ascendantId).length > 0) ticksWithThreadedAgents++;
        tallyGates(state, gateTally);

        // Count pushes rather than queue length — an entry can be added and expire
        // between two samples, and the queue prunes as it goes.
        for (const p of state.premonitionQueue ?? []) {
          seenPremonitionIds.add(p.id);
          // Displayable = still queued at or after the tick the UI is allowed to
          // show it. A whisper pruned before its window opens can never reach a modal.
          if (state.tick >= p.showAfterTick) displayableIds.add(p.id);
        }
      }

      const summary = [...gateTally.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([gate, n]) => `${gate}=${n}`)
        .join(' ');

      console.log(
        `[THR-1414 probe] pushed=${seenPremonitionIds.size} survived-to-display-window=${displayableIds.size} | gate verdicts (agent-ticks): ${summary}`,
      );

      // The probe's own premise: a world with no threaded agent proves nothing about
      // the gates below it (the empty-population trap).
      expect(ticksWithThreadedAgents).toBeGreaterThan(0);

      expect(
        seenPremonitionIds.size,
        `no whisper reached premonitionQueue in ${PROBE_TICKS} ticks. Gate verdicts (agent-ticks): ${summary}`,
      ).toBeGreaterThan(0);

      // The THR-1414 regression itself: generation was never the problem — 8 whispers
      // were pushed and every one was pruned before `showAfterTick`, so the modal had
      // nothing to open. A whisper the UI can never reach is a dead feature, and this
      // is the assertion that fails if the idle-prune (or an equivalent) comes back.
      expect(
        displayableIds.size,
        `whispers were generated (${seenPremonitionIds.size}) but none survived to their display window — the queue is pruning them before the UI may show them. Gate verdicts (agent-ticks): ${summary}`,
      ).toBeGreaterThan(0);
    },
  );
});
