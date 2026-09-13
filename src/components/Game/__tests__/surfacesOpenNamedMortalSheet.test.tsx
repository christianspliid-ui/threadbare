// @vitest-environment jsdom
/**
 * THR-1500 — the four remaining surfaces open the sheet of the mortal they name.
 *
 * `Browser-verify substitution: jsdom-render — unattended run, no startable dev server.`
 *
 * Four surfaces still called `openAgentProfileForId`, a bare `setProfileModalAgentId`.
 * `agentInfoCard` is memoised on `selectedAgentId` (`useAgentInteraction.ts:194`) and
 * `GameView` mounts the sheet on `profileModalAgentId && agentInfoCard`, so the bare
 * opener renders nothing when no mortal is selected (Law 21) or the *previously
 * selected* mortal's sheet under the named mortal's id (Laws 1, 33).
 *
 * Each block below is the browser capture the UI-pillar contract asks for, asserted
 * instead of photographed, following `premonitionOpensSubjectSheet.test.tsx`: the real
 * hook, the real surface component, and `GameView`'s own gate copied verbatim — the
 * gate is *why* the wrong sheet rendered rather than no sheet, so a harness that
 * mounted the modal on the profile id alone would test a surface the game lacks.
 *
 * The reproduction is the ticket's, and it is the same four steps every time:
 *
 *   1. select a *different* mortal first — that prior selection is the whole defect,
 *      and a capture without it proves nothing
 *   2. render the surface, which names the subject
 *   3. click the control
 *   4. read the sheet's close label
 *
 * Every block carries a FALSIFICATION arm that restores the shipped prop and
 * reproduces "named the subject, showed the other one". Without it a passing
 * assertion could mean the surface is fixed or that the harness never had two
 * distinguishable mortals in it.
 */

import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { useAgentInteraction } from '../hooks/useAgentInteraction';
import { AgentProfileModal } from '../AgentProfileModal';
import { ThreadsPanel } from '../ThreadsPanel';
import { ChapterLedger } from '../ChapterLedger';
import { MomentCard } from '../MomentCard';
import { WorldGraph } from '../../../engine/graph';
import { generateArchetypes } from '../../../engine/ascendant';
import { SPHERE_NAMES } from '../../../types';
import type { GameState } from '../../../types/gameState';
import type { EssencePool } from '../../../types/influence';
import type { ThreadedNode } from '../../../engine/retinue';
import type { ChapterRecord } from '../../../types/chapterRecord';
import type { MomentCardModel } from '../momentCardModel';
import type { UndertakingMomentRecord } from '../../../types/strategicAction';

/** The mortal each control names — the sheet that must open. */
const SUBJECT_ID = 'ind_subject';
const SUBJECT_NAME = 'Kael Thornweaver';

/** The mortal selected beforehand — the sheet the bug put on screen instead. */
const SELECTED_ID = 'ind_selected';
const SELECTED_NAME = 'Thorne';

const ASCENDANT_ID = 'ascendant-1';

const ARCHETYPE = generateArchetypes(1, 42)[0];
const ESSENCE: EssencePool = Object.fromEntries(SPHERE_NAMES.map(s => [s, 40])) as EssencePool;

/**
 * Two named mortals, both threaded to the ascendant.
 *
 * Threaded on purpose: the Chapter Ledger lists threaded chapters first and would
 * otherwise need its "Show all" toggle clicked before the link under test exists,
 * which is harness noise standing in for a state the game reaches on its own.
 */
function makeState(extend?: (graph: WorldGraph) => void): GameState {
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
    graph.addEdge({ id: `thread_${id}`, source: ASCENDANT_ID, target: id, type: 'thread', properties: {} });
  }
  extend?.(graph);

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
    chapterArchive: [],
  } as unknown as GameState;
}

type Api = ReturnType<typeof useAgentInteraction>;

/**
 * `GameView`'s sheet mount, copied rather than simplified: the gate is the defect's
 * second half. `surface` is the component under test, wired by the caller to whichever
 * opener that arm is proving.
 */
function Harness({
  state,
  onWire,
  surface,
}: {
  state: GameState;
  onWire: (api: Api) => void;
  surface: (api: Api) => React.ReactNode;
}) {
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
      {surface(api)}
      {api.profileModalAgentId && api.agentInfoCard && (
        <AgentProfileModal
          card={api.agentInfoCard}
          onClose={api.handleCloseProfile}
          gameState={state}
          onOpenEntity={api.openAgentSheetForId}
        />
      )}
    </>
  );
}

function mount(state: GameState, surface: (api: Api) => React.ReactNode) {
  let api!: Api;
  render(<Harness state={state} onWire={(a) => { api = a; }} surface={surface} />);
  // Step 1 — the prior selection the defect fed on.
  act(() => api.handleAgentSelect(SELECTED_ID));
  expect(api.selectedAgentId).toBe(SELECTED_ID);
  return { getApi: () => api };
}

/** Step 4, both halves: the subject's sheet is up and the other mortal's is not. */
function expectSubjectSheet(api: Api) {
  expect(screen.getByLabelText(`Close profile for ${SUBJECT_NAME}`)).toBeTruthy();
  expect(screen.queryByLabelText(`Close profile for ${SELECTED_NAME}`)).toBeNull();
  expect(api.agentInfoCard?.name).toBe(SUBJECT_NAME);
}

/** The shipped defect: the modal id is the subject's, the sheet is someone else's. */
function expectTheShippedDefect(api: Api) {
  expect(api.profileModalAgentId).toBe(SUBJECT_ID);
  expect(screen.getByLabelText(`Close profile for ${SELECTED_NAME}`)).toBeTruthy();
  expect(screen.queryByLabelText(`Close profile for ${SUBJECT_NAME}`)).toBeNull();
}

// ─── 0. The wiring itself ────────────────────────────────────────────────────

/**
 * The four blocks below compose the real hook with the real surface, which is the
 * only way to catch the seam the defect lived in — but each one hands the surface
 * its opener directly, so none of them fails if `GameView` is reverted to the bare
 * one. Mounting `GameView` whole to close that gap is not viable (it boots the
 * world), so the wiring is asserted against the source instead.
 *
 * The predicate is the ticket's, stated exactly: a JSX prop assigned the bare
 * `openAgentProfileForId`. It is *measured*, not assumed — on `origin/main` at the
 * time of the fix it matched 4 sites, which is precisely the four the ticket
 * enumerates (5063, 5165, 5188, 5421). `GameView.tsx:2022` is a call rather than a
 * prop assignment, so the non-member the ticket names is excluded by construction
 * rather than by an exception list that would rot.
 */
describe('No surface is still wired to the bare opener (THR-1500)', () => {
  it('GameView assigns no prop the bare `openAgentProfileForId`', () => {
    const source = readFileSync(
      resolve(__dirname, '..', 'GameView.tsx'),
      'utf8',
    );
    const offenders = source.match(/\bon[A-Za-z]+=\{openAgentProfileForId\}/g) ?? [];
    expect(offenders).toEqual([]);
  });
});

// ─── 1. Champion chip in the HUD (GameView.tsx:5063) ─────────────────────────

function championRow(): ThreadedNode {
  return {
    id: SUBJECT_ID,
    name: SUBJECT_NAME,
    tier: 2,
    tierName: 'Devoted',
    category: 'agent',
    threadEdgeId: 'thread-s1',
    attentionMode: 'auto_resolve',
    courtPosition: null,
    threadStrength: 1.0,
    locationId: 'loc-1',
    locationName: 'Thornwall',
    activityLabel: 'Idling',
    portraitUrl: null,
    primaryDomain: 'iron',
    factionName: 'Iron Brotherhood',
    championEffectId: 'eff-anoint-1',
    championTemplateId: 'action.anoint-champion',
  } as ThreadedNode;
}

describe('Champion chip opens its champion’s sheet (THR-1500)', () => {
  const panel = (onChampionChipClick: (id: string) => void) => (
    <ThreadsPanel
      threadedNodes={[championRow()]}
      selectedNodeId={null}
      onNodeSelect={vi.fn()}
      onCenterOnHex={vi.fn()}
      onChampionChipClick={onChampionChipClick}
    />
  );

  it('shows the champion’s sheet, with another mortal selected first', () => {
    const state = makeState();
    const { getApi } = mount(state, (api) => panel(api.openAgentSheetForId));

    act(() => { fireEvent.click(screen.getByTestId('champion-chip')); });

    expectSubjectSheet(getApi());
  });

  it('FALSIFICATION — the shipped wiring shows the selected mortal’s sheet', () => {
    const state = makeState();
    const { getApi } = mount(state, (api) => panel(api.openAgentProfileForId));

    act(() => { fireEvent.click(screen.getByTestId('champion-chip')); });

    expectTheShippedDefect(getApi());
  });
});

// ─── 2. The sheet's own cast links (GameView.tsx:5165) ───────────────────────

/**
 * A company holding both mortals, so the selected one's sheet carries a roster chip
 * naming the other. This is the one surface where the "previously selected" mortal is
 * the sheet already open — which is why the bug here read as a link that did nothing.
 */
const COMPANY_ID = 'group_company_1';

function withCompany(graph: WorldGraph): void {
  graph.addNode({
    id: COMPANY_ID,
    type: 'actor',
    name: 'The Ninefold Road',
    properties: { actorType: 'group', groupKind: 'company', cohesion: 0.6 },
  });
  for (const id of [SELECTED_ID, SUBJECT_ID]) {
    graph.addEdge({
      id: `member_${id}`,
      source: id,
      target: COMPANY_ID,
      type: 'member_of',
      // `role` and `rank` are required by the edge schema; omitting them logs a
      // schema warning per edge and leaves the fixture describing a membership
      // the world could not hold.
      properties: { joinedTick: 1, role: 'member', rank: 0.4 },
    });
  }
}

describe('A sheet’s cast link opens the companion’s sheet (THR-1500, judgement call 1)', () => {
  /**
   * The sheet is opened on the *selected* mortal here, as it is in play — the
   * roster chip then names the other one.
   */
  function openSelectedSheet(api: Api) {
    act(() => api.openAgentSheetForId(SELECTED_ID));
    expect(screen.getByLabelText(`Close profile for ${SELECTED_NAME}`)).toBeTruthy();
  }

  it('shows the companion’s sheet, and moves the world’s selection with it', () => {
    const state = makeState(withCompany);
    const { getApi } = mount(state, () => null);
    openSelectedSheet(getApi());

    act(() => { fireEvent.click(screen.getByTitle(`Open ${SUBJECT_NAME}`)); });

    expectSubjectSheet(getApi());
    // Judgement call 1, asserted rather than assumed: the selection follows the
    // reader. This is the decided behaviour, so it is pinned — if a later change
    // wants the card to move without the world, this expectation is the one to
    // argue with.
    expect(getApi().selectedAgentId).toBe(SUBJECT_ID);
  });

  it('FALSIFICATION — the shipped wiring leaves the companion’s own sheet unreachable', () => {
    const state = makeState(withCompany);
    let api!: Api;
    render(
      <Harness
        state={state}
        onWire={(a) => { api = a; }}
        // The shipped prop: the modal navigates with the bare opener.
        surface={() => null}
      />,
    );
    act(() => api.handleAgentSelect(SELECTED_ID));
    act(() => api.openAgentSheetForId(SELECTED_ID));
    // Re-enact the shipped call directly — `openAgentProfileForId` is what the
    // modal was handed, and it is the entire difference between the two arms.
    act(() => api.openAgentProfileForId(SUBJECT_ID));

    expectTheShippedDefect(api);
  });
});

// ─── 3. Chapter Ledger entity links (GameView.tsx:5188) ──────────────────────

function chapter(): ChapterRecord {
  return {
    actionId: 'act_chapter_1',
    templateId: 'encounter.slice.unsafe_bridge',
    templateName: 'The Unsafe Bridge',
    actorId: SUBJECT_ID,
    actorName: SUBJECT_NAME,
    targetId: 'loc-1',
    targetName: 'Thornwall',
    scale: 'personal',
    startTick: 40,
    resolvedTick: 52,
    resolved: true,
    outcome: 'success',
    threaded: true,
    participants: [],
    openingProse: 'The planks had been complaining for a season.',
    steps: [],
  };
}

describe('A Chapter Ledger link opens the named mortal’s sheet (THR-1500)', () => {
  function ledgerState(): GameState {
    return { ...makeState(), chapterArchive: [chapter()] };
  }

  const ledger = (onOpenEntity: (id: string) => void, state: GameState) => (
    <ChapterLedger gameState={state} onClose={vi.fn()} onOpenEntity={onOpenEntity} />
  );

  /** Open the chapter, then click the name in its header. */
  function clickTheName() {
    act(() => { fireEvent.click(screen.getByText('The Unsafe Bridge')); });
    act(() => { fireEvent.click(screen.getByLabelText(`${SUBJECT_NAME} — open profile`)); });
  }

  it('shows the chapter actor’s sheet, with another mortal selected first', () => {
    const state = ledgerState();
    const { getApi } = mount(state, (api) => ledger(api.openAgentSheetForId, state));

    clickTheName();

    expectSubjectSheet(getApi());
  });

  it('FALSIFICATION — the shipped wiring shows the selected mortal’s sheet', () => {
    const state = ledgerState();
    const { getApi } = mount(state, (api) => ledger(api.openAgentProfileForId, state));

    clickTheName();

    expectTheShippedDefect(getApi());
  });
});

// ─── 4. Authored-moment overlay (GameView.tsx:5421) ──────────────────────────

function momentModel(): MomentCardModel {
  const record: UndertakingMomentRecord = {
    id: 'undertaking_at_cost_proj_1_60',
    projectId: 'proj_1',
    actorId: SUBJECT_ID,
    templateId: 'strategic_build_warehouse',
    momentClass: 'at_cost',
    presentation: 'interrupt',
    tick: 60,
    label: `${SUBJECT_NAME} presses on with Build Warehouse, but it costs them`,
    undertakingName: 'Build Warehouse',
    band: 'success_at_cost',
    effect: 'advance_at_cost',
    acknowledged: false,
  };
  return {
    record,
    title: 'Pressing On at a Cost',
    actorId: SUBJECT_ID,
    actorName: SUBJECT_NAME,
    actorExists: true,
    undertakingName: 'Build Warehouse',
    opening: 'The work went dearly.',
    consequence: 'The work advanced anyway.',
    bandWord: 'dearly',
    outcomeBand: 'cost',
    checkpoints: { total: 3, filled: 2 },
    progressWord: 'Well along',
    chips: [{ id: 'progress', category: 'Progress', noun: 'a step, dearly bought', tone: 'loss' }],
    divineActions: [],
    actionable: true,
    forward: null,
  };
}

describe('The moment card opens its own mortal’s sheet (THR-1500)', () => {
  const card = (onSelectAgent: (id: string) => void, state: GameState) => (
    <MomentCard
      open
      model={momentModel()}
      graph={state.graph}
      onAcknowledge={vi.fn()}
      onSelectAgent={onSelectAgent}
    />
  );

  it('shows the moment’s mortal’s sheet, with another mortal selected first', () => {
    const state = makeState();
    const { getApi } = mount(state, (api) => card(api.openAgentSheetForId, state));

    act(() => { fireEvent.click(screen.getByTestId('moment-card-portrait')); });

    expectSubjectSheet(getApi());
    // The card is still mounted underneath — this is a context lookup, not an
    // acknowledgement, and the moment must survive being read around.
    expect(screen.getByTestId('moment-card-title').textContent).toBe('Pressing On at a Cost');
  });

  it('FALSIFICATION — the shipped wiring shows the selected mortal’s sheet', () => {
    const state = makeState();
    const { getApi } = mount(state, (api) => card(api.openAgentProfileForId, state));

    act(() => { fireEvent.click(screen.getByTestId('moment-card-portrait')); });

    expectTheShippedDefect(getApi());
  });
});
