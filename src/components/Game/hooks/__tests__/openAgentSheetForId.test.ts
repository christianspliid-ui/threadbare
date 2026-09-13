// @vitest-environment jsdom
/**
 * THR-1461 — opening a named mortal's sheet from a surface that is not the drawer.
 *
 * The premonition's name control opened the *previously selected* mortal's sheet:
 * Kael's whisper showed Thorne's profile. The component was innocent — it called the
 * handler it was given. The defect lived one layer down, in which opener the host
 * reached for, and it is invisible to any test that stops at "the handler fired".
 *
 * What makes it invisible is that the sheet has **two** inputs and only one of them
 * is the one the caller names:
 *
 *   GameView renders `<AgentProfileModal card={agentInfoCard} />` gated on
 *   `profileModalAgentId && agentInfoCard`, and `agentInfoCard` is memoised on
 *   `selectedAgentId` — not on `profileModalAgentId`.
 *
 * So `openAgentProfileForId`, which sets only the profile id, produces a sheet whose
 * *id* is the subject and whose *content* is whoever was selected before. Nothing
 * throws; a sheet opens; it is the wrong person's. These tests pin both halves of
 * that predicate, with a different mortal deliberately selected first — the
 * reproduction from the ticket, at the layer where the two ids diverge.
 *
 * THR-1477 built `openAgentSheetForId` for the encounter veil and left the
 * premonition to this ticket; this is the first test either surface has of it.
 */

import { describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useAgentInteraction } from '../useAgentInteraction';
import { WorldGraph } from '../../../../engine/graph';
import type { GameState } from '../../../../types/gameState';
import { generateArchetypes } from '../../../../engine/ascendant';
import { SPHERE_NAMES } from '../../../../types';
import type { EssencePool } from '../../../../types/influence';

/** The premonition's subject — the mortal the control names. */
const SUBJECT_ID = 'agent-kael';
const SUBJECT_NAME = 'Kael Thornweaver';

/** Whoever the player had selected before the interrupt arrived. */
const SELECTED_ID = 'npc-thorne';
const SELECTED_NAME = 'Thorne';

const ASCENDANT_ID = 'ascendant-1';

/**
 * A real archetype and a funded pool, not a `{} as AscendantArchetype`.
 *
 * The hook builds its wheel slots from `archetype.sphereAlignment.primary` and
 * `gameState.essencePool` the moment an agent is selected, so a cast fixture does
 * not merely under-specify — it throws on the very line this test needs to run.
 * `generateArchetypes` is the shipped producer, so the shape can never drift away
 * from what the hook reads.
 */
const ARCHETYPE = generateArchetypes(1, 42)[0];
const ESSENCE: EssencePool = Object.fromEntries(
  SPHERE_NAMES.map(s => [s, 10]),
) as EssencePool;

function makeState(): GameState {
  const graph = new WorldGraph();
  graph.addNode({
    id: ASCENDANT_ID,
    type: 'actor',
    name: 'The Witness',
    properties: { actorType: 'ascendant' },
  });
  for (const [id, name] of [
    [SUBJECT_ID, SUBJECT_NAME],
    [SELECTED_ID, SELECTED_NAME],
  ] as const) {
    graph.addNode({
      id,
      type: 'actor',
      name,
      properties: { actorType: 'individual', domainCapabilities: { stone: 0.4 } },
    });
  }
  return {
    graph,
    tick: 60,
    seed: 42,
    ascendantId: ASCENDANT_ID,
    essencePool: ESSENCE,
    familiarityMap: new Map(),
    agentKnowledge: new Map(),
    unifiedActions: [],
    encounterProgress: [],
    premonitionQueue: [],
  } as unknown as GameState;
}

function renderInteraction() {
  const state = makeState();
  return renderHook(() =>
    useAgentInteraction({
      gameState: state,
      setGameState: () => undefined,
      archetype: ARCHETYPE,
      onOpenScry: () => undefined,
      // Omniscience, so the card resolves at `transparent` and its content is not
      // flattened to a stranger's placeholder — the test is about *which* mortal
      // the card is, never about how much of them the player has earned.
      omniscienceMode: true,
    }),
  );
}

describe('openAgentSheetForId — the sheet that opens is the sheet that was asked for (THR-1461)', () => {
  it('overrides a stale selection: both the modal id and the card name the subject', () => {
    const { result } = renderInteraction();

    // The reproduction: another mortal is selected first, exactly as the ticket
    // sets it up with `openAgentSheet('npc_1')` before forcing the premonition.
    act(() => result.current.handleAgentSelect(SELECTED_ID));
    expect(result.current.selectedAgentId).toBe(SELECTED_ID);

    act(() => result.current.openAgentSheetForId(SUBJECT_ID));

    // Both inputs to the gate, because either one alone is the bug.
    expect(result.current.profileModalAgentId).toBe(SUBJECT_ID);
    expect(result.current.agentInfoCard?.id).toBe(SUBJECT_ID);
    expect(result.current.agentInfoCard?.name).toBe(SUBJECT_NAME);
    expect(result.current.agentInfoCard?.name).not.toBe(SELECTED_NAME);
  });

  it('leaves no drawer open underneath — a caller behind an interrupt wants the sheet on top', () => {
    // `handleAgentSelect` is the router's agent arm and opens the ActionDrawer at
    // z 40, invisible beneath the premonition at z 60 (Law 21). This is the
    // distinction that makes the premonition call the primitive and not the router.
    const { result } = renderInteraction();
    act(() => result.current.handleAgentSelect(SELECTED_ID));
    expect(result.current.drawerOpen).toBe(true);

    act(() => result.current.openAgentSheetForId(SUBJECT_ID));
    expect(result.current.drawerOpen).toBe(false);
  });

  it('FALSIFICATION — openAgentProfileForId reproduces the reported bug', () => {
    // The opener the premonition used, and the one the ticket's own "Likely cause"
    // prescribed. If this ever stops reproducing the wrong sheet, the defect has
    // moved and the assertions above are measuring something else.
    const { result } = renderInteraction();
    act(() => result.current.handleAgentSelect(SELECTED_ID));

    act(() => result.current.openAgentProfileForId(SUBJECT_ID));

    // The id is right — which is why the modal opens at all, and why the bug reads
    // as a rendering fault rather than a routing one.
    expect(result.current.profileModalAgentId).toBe(SUBJECT_ID);
    // The content is the previously selected mortal. Kael's whisper, Thorne's sheet.
    expect(result.current.agentInfoCard?.id).toBe(SELECTED_ID);
    expect(result.current.agentInfoCard?.name).toBe(SELECTED_NAME);
  });

  it('opens the subject from a clean slate too — the sheet is not empty without a prior selection', () => {
    // The other half of the same defect, on the surface it bit first: with nothing
    // selected, `openAgentProfileForId` leaves `agentInfoCard` null and the gate
    // never opens — the dead click THR-1477 removed from the encounter veil.
    const { result } = renderInteraction();
    expect(result.current.selectedAgentId).toBeNull();

    act(() => result.current.openAgentProfileForId(SUBJECT_ID));
    expect(result.current.agentInfoCard).toBeNull();

    act(() => result.current.openAgentSheetForId(SUBJECT_ID));
    expect(result.current.agentInfoCard?.id).toBe(SUBJECT_ID);
  });
});
