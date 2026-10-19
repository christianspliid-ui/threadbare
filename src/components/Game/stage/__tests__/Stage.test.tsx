// @vitest-environment jsdom
/**
 * THR-1892 — the Stage frame (plan THR-1877 § D3–D7, § Done when S2).
 *
 * jsdom has no layout, so geometry is asserted in the browser (`getStage()`); here the
 * frame's behaviour: the enter sequence through `GameScreenState.stage`, the compact
 * layout, the place tag, the hold line, Escape, a name opening the Inspector over the
 * Stage, and the return to idle on close.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, fireEvent, render } from '@testing-library/react';
import type { ReactNode } from 'react';
import { Stage } from '../Stage';
import { GameScreenStateProvider, useGameScreenStore, type GameScreenStore } from '../../frame/GameScreenState';
import { RefRouterProvider } from '../../../../contexts/RefRouterContext';
import type { RefRouter } from '../../../../hooks/useRefRouter';
import type { StageVM } from '../../../../engine/views/stage/stageView';
import { STAGE_WORDS } from '../../../../data/view-content';
import { STAGE_CAMERA_SETTLE_TIMEOUT_MS, STAGE_MAP_HINT_MS } from '../../../../data/stage-content';
import { ledgerRailState } from '../../frame/ledgerFold';
import { isStageOpen } from '../stageState';

const VM: StageVM = {
  kind: 'story-beat',
  phase: null,
  palette: 'story',
  litHex: '13,9',
  litSource: 'agent_location',
  options: [],
  frame: ['13,9'],
  place: { ref: { kind: 'location', id: 'millbrook' }, name: 'Millbrook' },
  placeTag: 'Millbrook · where it is happening',
  placeTagSuffix: STAGE_WORDS.placeTagSuffix,
  subject: { ref: { kind: 'agent', id: 'maren' }, name: 'Maren Ashfold' },
  contextLine: null,
  layout: 'compact',
};

function makeRouter(open = vi.fn()): RefRouter {
  return {
    open,
    reaches: () => true,
    hoverCard: null,
    closeHover: () => {},
    armHover: () => {},
    disarmHover: () => {},
  } as unknown as RefRouter;
}

let store: GameScreenStore;
function Harness({ children, router }: { children: ReactNode; router: RefRouter }) {
  store = useGameScreenStore();
  return (
    <GameScreenStateProvider value={store}>
      <RefRouterProvider router={router}>{children}</RefRouterProvider>
    </GameScreenStateProvider>
  );
}

beforeEach(() => {
  vi.useFakeTimers();
});

function mount(onEscape = vi.fn(), router = makeRouter()) {
  const utils = render(
    <Harness router={router}>
      <Stage kind="story-beat" vm={VM} label="Story beat: The Unsafe Bridge" onEscape={onEscape} tick={3} right={<button type="button">Continue</button>} />
    </Harness>,
  );
  return { ...utils, onEscape, router };
}

async function flushFrames(n = 3) {
  for (let i = 0; i < n; i++) {
    await act(async () => { vi.advanceTimersByTime(20); });
  }
}

describe('Stage', () => {
  it('enters, posts its focus to the map, and opens when the camera lands', async () => {
    mount();
    expect(store.state.stage.phase).toBe('entering');
    expect(store.state.stage.kind).toBe('story-beat');
    expect(isStageOpen(store.state.stage)).toBe(true);
    // The Ledger rail steps aside on the Stage's phase alone.
    expect(ledgerRailState({ foldPref: false, inspectorOpen: false, stageOpen: isStageOpen(store.state.stage) })).toBe('hidden');

    await flushFrames();
    expect(store.state.stage.focus).toMatchObject({ lit: ['13,9'], frame: ['13,9'], strength: 0.7 });

    // The map reports landing.
    act(() => store.setStage(prev => ({ ...prev, cameraSettled: true, cameraMode: 'eased', litHexScreen: { x: 100, y: 100, size: 200 } })));
    await flushFrames(1);
    expect(store.state.stage.phase).toBe('open');
    const panel = document.querySelector('[data-stage-panel]') as HTMLElement;
    expect(panel.style.visibility).toBe('visible');
    expect(document.querySelector('[data-stage-layout="compact"]')).not.toBeNull();
  });

  it('opens anyway when the camera never reports', async () => {
    mount();
    await flushFrames();
    await act(async () => { vi.advanceTimersByTime(STAGE_CAMERA_SETTLE_TIMEOUT_MS + 10); });
    expect(store.state.stage.cameraMode).toBe('timed_out');
    expect(store.state.stage.phase).toBe('open');
  });

  it('names the place over the window', () => {
    mount();
    const tag = document.querySelector('[data-stage-place-tag]');
    expect(tag?.textContent).toBe('Millbrook · where it is happening');
  });

  it('a click on the held map answers with the hold line, for about two seconds', async () => {
    mount();
    const win = document.querySelector('[data-stage-window]') as HTMLElement;
    fireEvent.pointerDown(win);
    const line = document.querySelector('[data-stage-hold-line]');
    expect(line?.getAttribute('role')).toBe('status');
    expect(line?.textContent).toBe(STAGE_WORDS.holdLine);
    await act(async () => { vi.advanceTimersByTime(STAGE_MAP_HINT_MS + 10); });
    expect(line?.textContent).toBe('');
  });

  it('a click inside the panel does not', () => {
    mount();
    fireEvent.pointerDown(document.querySelector('[data-stage-panel] button') as HTMLElement);
    expect(document.querySelector('[data-stage-hold-line]')?.textContent).toBe('');
  });

  it('Escape runs the moment’s own close', () => {
    const { onEscape } = mount();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onEscape).toHaveBeenCalledTimes(1);
  });

  it('a name on the Stage opens the Inspector over it', () => {
    const open = vi.fn();
    mount(vi.fn(), makeRouter(open));
    act(() => { (document.querySelector('[data-stage-place-tag] button') as HTMLElement).click(); });
    expect(open).toHaveBeenCalled();
    expect(store.state.stage.inspectorOverStage).toBe(true);
  });

  it('closing returns the Stage to idle', () => {
    const router = makeRouter();
    const stage = <Stage kind="story-beat" vm={VM} label="Story beat" onEscape={() => {}} tick={3} right={null} />;
    const { rerender } = render(<Harness router={router}>{stage}</Harness>);
    expect(isStageOpen(store.state.stage)).toBe(true);
    rerender(<Harness router={router}>{null}</Harness>);
    expect(store.state.stage.phase).toBe('idle');
    expect(store.state.stage.focus).toBeNull();
  });
});
