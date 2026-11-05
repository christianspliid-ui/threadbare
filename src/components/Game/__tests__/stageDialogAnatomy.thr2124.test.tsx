// @vitest-environment jsdom
/**
 * THR-2124 — legibility 3: the Stage and the dialogs.
 *
 * - The Stage title is the header's strongest text (Cinzel `--text-xl`, no capitals),
 *   the stakes line is the upright Now slot, and the story reads at `--type-body-prose`.
 * - The step column paints no surface of its own (one surface on the Stage).
 * - Every dialog title is `Modal.Header` at `--text-xl`, marked `data-dialog-title`; its
 *   kind line sits above the title and is not drawn when it repeats the title.
 * - The choice dialog draws its title once, with no RevealCard banner or frame.
 *
 * The veil is mounted the way `encounterVeilNudgeHeaderMerge.test.tsx` mounts it: the
 * shipped Swindled Family slice through the real stage-model builder.
 */
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EncounterVeil } from '../EncounterVeil';
import { buildUnifiedEncounterStageModel } from '../encounter-stage/adapters/buildUnifiedEncounterStageModel';
import { UNIFIED_ACTION_TEMPLATES } from '../../../data/unified-action-templates';
import { WorldGraph } from '../../../engine/graph';
import { Modal } from '../../shared/Modal';
import { AscendantBeatModal } from '../AscendantBeatModal';
import { SettingsPanel } from '../SettingsPanel';
import { ScryOverlay } from '../ScryOverlay';
import { ScryProvider } from '../contexts/ScryContext';
import { createScryState, initializeCourt } from '../../../engine/scry';
import { SPHERE_NAMES } from '../../../types/index';
import type { EssencePool } from '../../../types/influence';
import type { RetinueAgent } from '../../../engine/retinue';
import type { EncounterNotification } from '../../../types/encounterVisibility';
import type { GameState } from '../../../types/gameState';
import type { UnifiedAction, UnifiedActionTemplate } from '../../../types/unifiedAction';
import type { PendingBeat } from '../../../types/ascendantBeat';

vi.mock('../../../services/narration/useNarration', () => ({
  useNarration: () => ({
    enabled: false, status: 'idle' as const, backendType: null, loadProgress: 0,
    error: null, isSpeaking: false, isLoading: false, isAvailable: false,
    init: vi.fn(), initWorker: vi.fn(), speak: vi.fn(), speakSections: vi.fn(),
    stop: vi.fn(), narrateChronicle: vi.fn(),
  }),
}));

const AGENT_ID = 'agent.thr2124_probe';
const AGENT_NAME = 'Kael Thornweaver';
const TARGET_ID = 'loc.market_row';

const SLICE: UnifiedActionTemplate = (() => {
  const t = UNIFIED_ACTION_TEMPLATES.find((x) => x.id === 'encounter.slice.swindled_family');
  if (!t) throw new Error('encounter.slice.swindled_family is not in the shipped catalog');
  return t;
})();

function renderVeil() {
  const graph = new WorldGraph();
  graph.addNode({ id: AGENT_ID, type: 'actor', name: AGENT_NAME, properties: { actorType: 'individual', domainCapabilities: { heart: 20 } } });
  graph.addNode({ id: TARGET_ID, type: 'location', name: 'Market Row', properties: {} });
  const activeAction: UnifiedAction = {
    actionId: 'ua_thr2124_0', actorId: AGENT_ID, templateId: SLICE.id, targetId: TARGET_ID, scale: SLICE.scale,
    source: 'agent', startTick: 1, currentStep: 0, stepProgress: 0, stepDuration: 2, resolved: false, stepOutcomes: [],
  };
  const notification: EncounterNotification = {
    id: 'notif_thr2124', agentId: AGENT_ID, agentName: AGENT_NAME, courtPosition: 'the_first',
    encounterId: SLICE.id, encounterName: SLICE.name, prose: 'They are still standing where the coin changed hands.',
    choices: [], createdTick: 1, autoResolveTick: null, viewed: false, resolved: false,
  };
  const pool = { essencePool: Object.fromEntries(SPHERE_NAMES.map(s => [s, 40])) } as unknown as GameState;
  const model = buildUnifiedEncounterStageModel({
    template: SLICE, activeAction, notification, agentName: AGENT_NAME, threadTier: 'strong', graph, essence: 12, gameState: pool,
  });
  render(
    <EncounterVeil
      open model={model} threadTier="strong" essence={12} tick={10} autoResolveTick={null}
      onIntervene={vi.fn()} onBoost={vi.fn()} onPeek={vi.fn()} onDisregard={vi.fn()}
      onAcknowledgeAftermath={vi.fn()} onAftermathReaction={vi.fn()} onCommitNudges={vi.fn()}
    />,
  );
  return model;
}

describe('THR-2124 the Stage reads Who, then Now, then the story', () => {
  it('(a) the title is Cinzel at --text-xl, in sentence case', () => {
    renderVeil();
    const title = screen.getByTestId('veil-title');
    expect(title.style.fontFamily).toBe('var(--font-display)');
    expect(title.style.fontSize).toBe('var(--text-xl)');
    expect(title.style.textTransform).toBe('');
    expect(title.style.color).toBe('var(--veil-text-bright)');
  });

  it('(b) the stakes line (or its subtitle fallback) is upright --text-sm, marked as Now', () => {
    const model = renderVeil();
    const now = document.querySelector<HTMLElement>('[data-stage-now]');
    // Anti-vacuity: the shipped slice draws one of the two Now forms.
    expect(Boolean(model.header.stakesLine || model.header.subtitle)).toBe(true);
    expect(now).not.toBeNull();
    expect(now!.style.fontStyle).toBe('');
    expect(now!.style.fontSize).toBe('var(--text-sm)');
  });

  it('(c) scene paragraphs use the Story shorthand', () => {
    const model = renderVeil();
    expect(model.narrative.paragraphs.length).toBeGreaterThan(0);
    const first = document.querySelector<HTMLElement>('[data-stage-scene-line]');
    expect(first).not.toBeNull();
    expect(first!.style.font).toBe('var(--type-body-prose)');
  });

  it('(d) the step column paints no surface of its own', () => {
    renderVeil();
    expect(screen.getByTestId('veil-step-column').style.background).toBe('');
    // The left column draws only when the step has art or cast; when it does, no paint either.
    const left = screen.queryByTestId('veil-left-column');
    if (left) expect(left.style.background).toBe('');
  });
});

describe('THR-2124 every dialog title is Modal.Header', () => {
  it('(e) Modal.Header draws at --text-xl, its kind line before the title', () => {
    render(<Modal open onClose={() => {}} aria-label="t"><Modal.Header kind="A vision">The Long Night</Modal.Header></Modal>);
    const title = document.querySelector<HTMLElement>('[data-dialog-title]')!;
    const kind = document.querySelector<HTMLElement>('[data-dialog-kind]')!;
    expect(title.style.fontSize).toBe('var(--text-xl)');
    expect(title.textContent).toBe('The Long Night');
    expect(kind.textContent).toBe('A vision');
    expect(kind.compareDocumentPosition(title) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('a kind that repeats the title is not drawn', () => {
    render(<Modal open onClose={() => {}} aria-label="t"><Modal.Header kind="A Path Opens">A path opens</Modal.Header></Modal>);
    expect(document.querySelector('[data-dialog-kind]')).toBeNull();
    expect(document.querySelectorAll('[data-dialog-title]')).toHaveLength(1);
  });

  it('(f) the path-opens beat draws one title, no banner and no reveal frame', () => {
    render(
      <AscendantBeatModal open pending={{ beatId: 'beat.spine.a_path_opens', kind: 'selection', offeredTurn: 1 } as PendingBeat} onResolve={vi.fn()} />,
    );
    expect(document.querySelectorAll('[data-dialog-title]')).toHaveLength(1);
    expect(document.querySelector('[data-dialog-title]')?.textContent).toBe('A Path Opens');
    expect(document.querySelector('[data-testid="reveal-banner"]')).toBeNull();
    expect(document.querySelector('[data-testid="reveal-card-frame"]')).toBeNull();
    expect(document.querySelector('[data-dialog-now]')?.textContent).toMatch(/^Three shapes of devotion/);
  });

  it('(g) Settings and the court draw their titles through [data-dialog-title]', () => {
    const { unmount } = render(
      <SettingsPanel
        open onClose={vi.fn()} fogDisabled={false} onToggleFog={vi.fn()} debugPanelOpen={false} onToggleDebug={vi.fn()}
        showOrganicShore={false} onToggleOrganicShore={vi.fn()} musicVolume={0.5} onMusicVolume={vi.fn()}
        bgVolume={0.5} onBgVolume={vi.fn()} uiVolume={0.5} onUiVolume={vi.fn()} audioMuted={false} onToggleAudioMute={vi.fn()}
      />,
    );
    expect([...document.querySelectorAll('[data-dialog-title]')].map(el => el.textContent)).toEqual(['Settings']);
    unmount();

    const agents = [] as unknown as RetinueAgent[];
    const context = {
      scryState: initializeCourt(createScryState(), 'high_house'),
      retinueAgents: agents,
      essencePool: Object.fromEntries(SPHERE_NAMES.map(s => [s, 1])) as EssencePool,
      primarySphere: 'force' as const,
      secondarySphere: 'mind' as const,
      tick: 10,
      seed: 42,
      onAssign: vi.fn(),
      onDemote: vi.fn(),
      onClose: vi.fn(),
    };
    render(<ScryProvider value={context}><ScryOverlay /></ScryProvider>);
    expect([...document.querySelectorAll('[data-dialog-title]')].map(el => el.textContent)).toEqual(['Divine Court']);
    // The section heads are the ordinary label rule, never centred capitals.
    expect(document.querySelectorAll('h2.text-center')).toHaveLength(0);
  });
});
