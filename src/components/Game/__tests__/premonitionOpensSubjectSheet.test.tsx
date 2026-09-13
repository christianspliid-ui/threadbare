// @vitest-environment jsdom
/**
 * THR-1461 — the composed surface: Kael's whisper opens Kael's sheet.
 *
 * `Browser-verify substitution: jsdom-render — unattended run, no startable dev server.`
 *
 * This is the capture the browser pass would have produced, asserted instead of
 * photographed. The sibling unit files pin the two halves separately — the modal
 * passes its own subject id (`PremonitionModal.test.tsx`), the opener overrides a
 * stale selection (`hooks/__tests__/openAgentSheetForId.test.ts`) — and *both*
 * passed while the bug shipped, because the defect lived in the seam between them.
 * So this file renders the seam: the real hook, the real premonition, the real
 * sheet, gated and stacked exactly as `GameView` gates and stacks them.
 *
 * The reproduction is the ticket's, step for step:
 *
 *   1. select another mortal first  (`openAgentSheet('npc_1')` → Thorne)
 *   2. raise the premonition        (`forcePremonition(…, 'whisper')` → Kael)
 *   3. click the subject name
 *   4. read the sheet's heading and its close label
 *
 * Step 4 is the whole test. The shipped surface put *Thorne* in both places, and
 * the ticket quotes `aria-label="Close profile for Thorne"` as the tell — so that
 * exact string is asserted absent, not merely "the right name is somewhere".
 */

import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { useAgentInteraction } from '../hooks/useAgentInteraction';
import { PremonitionModal } from '../PremonitionModal';
import { AgentProfileModal } from '../AgentProfileModal';
import { WorldGraph } from '../../../engine/graph';
import { generateArchetypes } from '../../../engine/ascendant';
import { SPHERE_NAMES } from '../../../types';
import type { GameState } from '../../../types/gameState';
import type { EssencePool } from '../../../types/influence';
import type { PremonitionEvent } from '../../../types/premonition';

/** The premonition's subject — the mortal the control names. */
const SUBJECT_ID = 'ind_dev_the_first';
const SUBJECT_NAME = 'Kael Thornweaver';

/** The mortal selected before the interrupt arrived — the one the bug showed. */
const SELECTED_ID = 'npc_1';
const SELECTED_NAME = 'Thorne';

const ASCENDANT_ID = 'ascendant-1';

const ARCHETYPE = generateArchetypes(1, 42)[0];
const ESSENCE: EssencePool = Object.fromEntries(SPHERE_NAMES.map(s => [s, 10])) as EssencePool;

const WHISPER: PremonitionEvent = {
  id: 'prem-1461',
  type: 'whisper',
  agentId: SUBJECT_ID,
  agentName: SUBJECT_NAME,
  tick: 60,
  showAfterTick: 60,
  eligibleUntilTick: 72,
  vignetteProse: 'A road unwalked turns in the sleeping mind.',
  // Typed, uncast: a `as unknown as PremonitionEvent` fixture would have let this
  // file invent a nudge shape the surface never reads, and the "still choosable"
  // assertion below would then have been asserting nothing.
  whisperOptions: [
    {
      category: 'reach_bias',
      targetReach: 'stone',
      essenceCost: 1,
      sphere: 'matter',
      prose: 'Turn them toward the wall',
      flavorText: 'The stones remember hands.',
    },
  ],
};

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
      properties: { actorType: 'individual', domainCapabilities: { stone: 0.4, heart: 0.3 } },
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

/**
 * `GameView`'s premonition + sheet composition, reduced to the two surfaces and the
 * one gate that decide this bug.
 *
 * The gate is copied deliberately and not simplified: `profileModalAgentId &&
 * agentInfoCard` is *why* the wrong sheet rendered rather than no sheet, so a
 * harness that mounted the modal on the profile id alone would test a surface the
 * game does not have. Everything inside it — the hook, the card memo, both
 * components — is the shipped code.
 */
function Harness({ onWire }: { onWire: (api: ReturnType<typeof useAgentInteraction>) => void }) {
  const [state] = [makeState()];
  const api = useAgentInteraction({
    gameState: state,
    setGameState: () => undefined,
    archetype: ARCHETYPE,
    onOpenScry: () => undefined,
    omniscienceMode: true,
  });
  onWire(api);

  return (
    <>
      {/* The premonition renders first and lower, as in GameView. */}
      <PremonitionModal
        open
        premonition={WHISPER}
        essencePool={ESSENCE}
        graph={state.graph}
        onWhisperChoice={vi.fn()}
        onCompulsionChoice={vi.fn()}
        onViewAgent={api.openAgentSheetForId}
        onDismiss={vi.fn()}
      />
      {api.profileModalAgentId && api.agentInfoCard && (
        <AgentProfileModal
          card={api.agentInfoCard}
          onClose={api.handleCloseProfile}
          gameState={state}
        />
      )}
    </>
  );
}

describe('The premonition opens its own subject’s sheet (THR-1461)', () => {
  function renderSurface() {
    let api!: ReturnType<typeof useAgentInteraction>;
    render(<Harness onWire={(a) => { api = a; }} />);
    return { getApi: () => api };
  }

  it('shows the subject’s sheet over the premonition, with another mortal selected first', () => {
    const { getApi } = renderSurface();

    // 1. The prior selection — the state the bug fed on.
    act(() => getApi().handleAgentSelect(SELECTED_ID));
    expect(getApi().selectedAgentId).toBe(SELECTED_ID);

    // 2. The premonition is up and names Kael.
    expect(screen.getByTestId('premonition-subject-name').textContent).toBe(SUBJECT_NAME);

    // 3. Click the name.
    act(() => { fireEvent.click(screen.getByTestId('premonition-subject-name')); });

    // 4. The sheet is Kael's — by heading and by the label the ticket quotes.
    expect(screen.getByLabelText(`Close profile for ${SUBJECT_NAME}`)).toBeTruthy();
    expect(screen.queryByLabelText(`Close profile for ${SELECTED_NAME}`)).toBeNull();
    expect(getApi().agentInfoCard?.name).toBe(SUBJECT_NAME);

    // …and the premonition is still mounted and choosable underneath (THR-1139):
    // this is a context lookup, not a dismissal.
    expect(screen.getByText(WHISPER.vignetteProse)).toBeTruthy();
    expect(screen.getByText('Turn them toward the wall')).toBeTruthy();
  });

  it('closing the sheet returns to the premonition, which never lost its subject', () => {
    const { getApi } = renderSurface();
    act(() => getApi().handleAgentSelect(SELECTED_ID));
    act(() => { fireEvent.click(screen.getByTestId('premonition-subject-name')); });

    act(() => { fireEvent.click(screen.getByLabelText(`Close profile for ${SUBJECT_NAME}`)); });

    expect(screen.queryByLabelText(`Close profile for ${SUBJECT_NAME}`)).toBeNull();
    expect(screen.getByTestId('premonition-subject-name').textContent).toBe(SUBJECT_NAME);
    expect(screen.getByText(WHISPER.vignetteProse)).toBeTruthy();
  });

  it('FALSIFICATION — the shipped wiring puts the other mortal’s sheet on screen', () => {
    // Same harness, same clicks, one prop changed back to what shipped:
    // `onViewAgent={() => openAgentProfileForId(premonition.agentId)}`. If this
    // does not reproduce "Kael's whisper, Thorne's sheet", the test above is
    // passing for some reason other than the fix.
    function BrokenHarness() {
      const [state] = [makeState()];
      const api = useAgentInteraction({
        gameState: state,
        setGameState: () => undefined,
        archetype: ARCHETYPE,
        onOpenScry: () => undefined,
        omniscienceMode: true,
      });
      brokenApi = api;
      return (
        <>
          <PremonitionModal
            open
            premonition={WHISPER}
            essencePool={ESSENCE}
            graph={state.graph}
            onWhisperChoice={vi.fn()}
            onCompulsionChoice={vi.fn()}
            onViewAgent={() => api.openAgentProfileForId(WHISPER.agentId)}
            onDismiss={vi.fn()}
          />
          {api.profileModalAgentId && api.agentInfoCard && (
            <AgentProfileModal card={api.agentInfoCard} onClose={api.handleCloseProfile} gameState={state} />
          )}
        </>
      );
    }
    let brokenApi!: ReturnType<typeof useAgentInteraction>;
    render(<BrokenHarness />);

    act(() => brokenApi.handleAgentSelect(SELECTED_ID));
    act(() => { fireEvent.click(screen.getByTestId('premonition-subject-name')); });

    // The reported defect, reproduced: the modal id is Kael's, the sheet is Thorne's.
    expect(brokenApi.profileModalAgentId).toBe(SUBJECT_ID);
    expect(screen.getByLabelText(`Close profile for ${SELECTED_NAME}`)).toBeTruthy();
    expect(screen.queryByLabelText(`Close profile for ${SUBJECT_NAME}`)).toBeNull();
  });
});
