// @vitest-environment jsdom
/**
 * THR-1897 — the last four Stage moments play on the Stage (plan THR-1877 § D4, D5, S4).
 *
 * - No Stage-home surface renders through `Modal` any more (a source grep of the four files).
 * - Each opens on the Stage frame with its kind and layout: the journey moment, the
 *   undertaking moment and the emergence dilemma compact; the premonition full, the mortal
 *   on the left and the dream on the right.
 * - Hovering or focusing a compulsion option sends its place to the map (the frame's
 *   `stage.hoveredOption`, which `useStageCamera` turns into the dashed ring) and the
 *   place tag names it; leaving clears it. Escape still does nothing on a premonition.
 *
 * jsdom has no layout or WebGL: the ring itself is `StageFocusLayer.test.ts`, the geometry
 * `__DEBUG.getStage()` in the browser.
 */
import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { fireEvent, render, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { PremonitionModal } from '../PremonitionModal';
import { JourneyVignetteModal } from '../JourneyVignetteModal';
import { GameScreenStateProvider, useGameScreenStore, type GameScreenStore } from '../frame/GameScreenState';
import type { StageVM } from '../../../engine/views/stage/stageView';
import { STAGE_WORDS } from '../../../data/view-content';
import { SPHERE_NAMES } from '../../../types';
import type { EssencePool } from '../../../types/influence';
import type { PremonitionEvent } from '../../../types/premonition';
import type { JourneyVignetteData } from '../../../types/journeyEngine';

const here = dirname(fileURLToPath(import.meta.url));
const components = resolve(here, '../..');

const STAGE_FILES = [
  'Game/JourneyVignetteModal.tsx',
  'Game/MomentCard.tsx',
  'Game/PremonitionModal.tsx',
  'ruins/EmergenceDilemmaModal.tsx',
];

/** Source with comments stripped, so a comment naming the old `Modal` does not count. */
function code(rel: string): string {
  return readFileSync(resolve(components, rel), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');
}

describe('no Stage-home surface renders through Modal (THR-1897)', () => {
  for (const rel of STAGE_FILES) {
    it(`${rel} imports no Modal and renders the Stage`, () => {
      const src = code(rel);
      expect(src, `${rel} still imports Modal`).not.toMatch(/from '[./]*\/?(shared\/)?Modal'/);
      expect(src, `${rel} still renders <Modal>`).not.toMatch(/<Modal\b/);
      expect(src).toMatch(/<Stage\b/);
    });
  }
});

let store: GameScreenStore;
function Harness({ children }: { children: ReactNode }) {
  store = useGameScreenStore();
  return <GameScreenStateProvider value={store}>{children}</GameScreenStateProvider>;
}

const funded = (n: number): EssencePool => Object.fromEntries(SPHERE_NAMES.map(s => [s, n])) as EssencePool;

const PREMONITION: PremonitionEvent = {
  id: 'p1',
  type: 'compulsion',
  agentId: 'kael',
  agentName: 'Kael',
  tick: 10,
  showAfterTick: 10,
  eligibleUntilTick: 40,
  vignetteProse: 'A pull, low and certain.',
  compulsionCandidates: [
    { templateId: 'encounter.a', encounterName: 'The Bridge Toll', encounterHook: 'They could make a difference.', encounterType: 'assist', reach: 'heart', sphere: 'force', threatRating: 'low', hexDistance: 2, score: 1, essenceCost: 2, locationId: 'corran', locationName: 'Corran Fields' },
    { templateId: 'encounter.b', encounterName: 'Night Watch', encounterHook: 'The dark wants watching.', encounterType: 'assist', reach: 'heart', sphere: 'force', threatRating: 'low', hexDistance: 4, score: 1, essenceCost: 2, locationId: 'nowhere', locationName: 'Nowhere' },
  ],
} as PremonitionEvent;

const PREMONITION_VM: StageVM = {
  kind: 'premonition',
  phase: null,
  palette: 'divine',
  litHex: '13,9',
  litSource: 'agent_location',
  options: [
    { ref: { kind: 'location', id: 'corran' }, hexKey: '15,9', ringOnly: false, index: 0, place: { ref: { kind: 'location', id: 'corran' }, name: 'Corran Fields' } },
  ],
  frame: ['13,9', '15,9'],
  place: { ref: { kind: 'location', id: 'millbrook' }, name: 'Millbrook' },
  placeTag: 'Millbrook · where Kael is',
  placeTagSuffix: ' · where Kael is',
  subject: { ref: { kind: 'agent', id: 'kael' }, name: 'Kael' },
  contextLine: null,
  layout: 'full',
};

function renderPremonition(onDismiss = vi.fn()) {
  return render(
    <Harness>
      <PremonitionModal
        open
        premonition={PREMONITION}
        essencePool={funded(10)}
        onWhisperChoice={() => {}}
        onCompulsionChoice={() => {}}
        onDismiss={onDismiss}
        stageVM={PREMONITION_VM}
        tick={10}
      />
    </Harness>,
  );
}

describe('the premonition on the Stage (THR-1897)', () => {
  it('plays full: the mortal on the left, the dream and its words on the right', () => {
    const { container } = renderPremonition();
    const layer = container.ownerDocument.querySelector('[data-stage-layer]')!;
    expect(layer.getAttribute('data-stage-kind')).toBe('premonition');
    expect(layer.getAttribute('data-stage-layout')).toBe('full');
    const left = layer.querySelector('[data-stage-left]')!;
    const right = layer.querySelector('[data-stage-right]')!;
    expect(left.querySelector('[data-testid="premonition-subject-name"]')?.textContent).toBe('Kael');
    expect(right.textContent).toContain("The God's will");
    expect(right.textContent).toContain('A pull, low and certain.');
    expect(right.textContent).toContain('Release your hold — let them choose');
    expect(store.state.stage.kind).toBe('premonition');
  });

  it('posts the option places to the map focus in the dream tone', async () => {
    renderPremonition();
    // The focus is posted after the layout settles (two animation frames).
    await waitFor(() => expect(store.state.stage.focus).not.toBeNull());
    expect(store.state.stage.focus!.options).toEqual([{ hexKey: '15,9', tone: 'compulsion', ringOnly: false, hovered: false }]);
    expect(store.state.stage.focus!.frame).toEqual(['13,9', '15,9']);
  });

  it('hovering an option with a place lights it and names it in the tag; leaving clears it', () => {
    const doc = renderPremonition().container.ownerDocument;
    const [first, second] = doc.querySelectorAll('[data-stage-right] button[class*="w-full"]');
    expect(first.hasAttribute('data-premonition-option-lights')).toBe(true);
    expect(second.hasAttribute('data-premonition-option-lights')).toBe(false);

    fireEvent.mouseEnter(first);
    expect(store.state.stage.hoveredOption).toBe('15,9');
    const tag = doc.querySelector('[data-stage-place-tag]')!;
    expect(tag.textContent).toBe(`Corran Fields${STAGE_WORDS.placeTagDreamSuffix}`);

    fireEvent.mouseLeave(first);
    expect(store.state.stage.hoveredOption).toBeNull();
    expect(doc.querySelector('[data-stage-place-tag]')!.textContent).toBe('Millbrook · where Kael is');

    // An option with no place lights nothing.
    fireEvent.mouseEnter(second);
    expect(store.state.stage.hoveredOption).toBeNull();
  });

  it('keyboard focus lights the option as the pointer does', () => {
    const doc = renderPremonition().container.ownerDocument;
    const first = doc.querySelector('[data-premonition-option-lights]')!;
    fireEvent.focus(first);
    expect(store.state.stage.hoveredOption).toBe('15,9');
    fireEvent.blur(first);
    expect(store.state.stage.hoveredOption).toBeNull();
  });

  it('Escape does not decline (THR-1711)', () => {
    const onDismiss = vi.fn();
    renderPremonition(onDismiss);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onDismiss).not.toHaveBeenCalled();
  });
});

describe('the journey moment on the Stage (THR-1897)', () => {
  const VIGNETTE = {
    agentId: 'kael',
    agentName: 'Kael',
    phase: 'call',
    doomClockPercent: 0.1,
    beatIndex: 0,
    templateId: 't',
    variantKey: 'v',
    setupProse: 'The road begins.',
    tensionProse: 'Something waits.',
    choices: [{ id: 'c1', text: 'Go on', effects: {} }],
    stateSnapshot: {},
    isOrdeal: false,
    tick: 1,
  } as unknown as JourneyVignetteData;

  it('plays compact with the context line under its title, its words unchanged', () => {
    const vm: StageVM = {
      ...PREMONITION_VM,
      kind: 'journey-vignette',
      palette: 'story',
      options: [],
      frame: ['13,9'],
      placeTag: 'Millbrook · where it is happening',
      placeTagSuffix: STAGE_WORDS.placeTagSuffix,
      contextLine: { subject: PREMONITION_VM.subject, place: PREMONITION_VM.place, text: 'Kael at Millbrook' },
      layout: 'compact',
    };
    const doc = render(
      <Harness>
        <JourneyVignetteModal open onClose={() => {}} onChoice={() => {}} vignette={VIGNETTE} stageVM={vm} />
      </Harness>,
    ).container.ownerDocument;
    const layer = doc.querySelector('[data-stage-layer]')!;
    expect(layer.getAttribute('data-stage-kind')).toBe('journey-vignette');
    expect(layer.getAttribute('data-stage-layout')).toBe('compact');
    expect(layer.querySelector('[data-stage-context-line]')?.textContent).toBe('Kael at Millbrook');
    expect(layer.textContent).toContain("Kael's Journey");
    expect(layer.textContent).toContain('The road begins.');
    expect(store.state.stage.kind).toBe('journey-vignette');
  });
});
