// @vitest-environment jsdom
//
// THR-1963 — the mortal's own mid-game beside the map. The thread panel carries
// "Their work" and "What they want most" (same word as the Journey tab, same
// knowledge gate), each opening the profile on the Journey tab; the profile takes
// an `initialTab`; and the begun/finished work moments link to the work.
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThreadDetailView } from '../ThreadDetailView';
import { AgentProfileModal } from '../AgentProfileModal';
import { MomentCard } from '../MomentCard';
import { WorldGraph } from '../../../engine/graph';
import { describeWorkProgress } from '../../../engine/workProgress';
import { summarizeActiveUndertakings } from '../../../engine/agentDetail';
import type { AgentInfoCardData } from '../../../engine/agentDetail';
import type { ThreadedAgent } from '../../../engine/retinue';
import type { StrategicRuntimeState, UndertakingMomentRecord } from '../../../types/strategicAction';
import type { MomentCardModel } from '../momentCardModel';
import { MOMENT_SEE_WORK_CLASSES, MOMENT_SEE_WORK_LABEL } from '../../../data/moment-card-content';
import { UI_TOOLTIPS } from '../../../data/ui-content';

const node = {
  id: 'kael', name: 'Kael', tier: 2, tierName: 'Acolyte', category: 'agent', threadEdgeId: 'e1',
  attentionMode: 'auto_resolve', courtPosition: 'retinue', threadStrength: 1, locationId: 'loc_1',
  locationName: 'Millhaven', activityLabel: null, portraitUrl: null, primaryDomain: 'gold',
  factionName: null, championEffectId: null, championTemplateId: null,
} as unknown as ThreadedAgent;

const project = {
  projectId: 'proj_1', actorId: 'kael', templateId: 'strategic_build_warehouse', ambitionId: 'a',
  verb: 'create', behaviorFamily: 'merchant-expansion', progress: 12, progressRequired: 18,
  startedTick: 30, lastProgressTick: 54, status: 'active', halts: 0,
};

const strategicState = { projects: [project], controls: [], history: [] } as unknown as StrategicRuntimeState;

function card(overrides: Partial<AgentInfoCardData> = {}): AgentInfoCardData {
  return {
    id: 'kael',
    name: 'Kael',
    locationId: 'loc_1',
    locationName: 'Millhaven',
    knowledgeLevel: 'intimate',
    domains: [],
    activeEffects: [],
    intents: [
      { templateId: 'ambition_dominate_trade', displayName: 'Dominate Trade', category: 'wealth', priority: 'primary', completedMilestones: 0, requiredMilestones: 3, reachAffinity: {} },
      { templateId: 'ambition_found_house', displayName: 'Found a House', category: 'legacy', priority: 'secondary', completedMilestones: 0, requiredMilestones: 3, reachAffinity: {} },
    ],
    ...overrides,
  } as unknown as AgentInfoCardData;
}

function renderPanel(c: AgentInfoCardData, onViewProfile = vi.fn(), state: StrategicRuntimeState | undefined = strategicState) {
  render(
    <ThreadDetailView
      node={node}
      agentInfoCard={c}
      onClose={vi.fn()}
      onViewProfile={onViewProfile}
      strategicState={state}
    />,
  );
  return onViewProfile;
}

describe('THR-1963 — the thread panel names the work and the leading ambition', () => {
  it('shows the work with the one progress word, and the first listed ambition', () => {
    renderPanel(card());
    const work = summarizeActiveUndertakings(strategicState, 'kael')![0];
    const workLine = screen.getByTestId('thread-their-work');
    expect(workLine.textContent).toContain(work.displayName);
    expect(workLine.textContent).toContain(describeWorkProgress(project).word);
    expect(screen.getByTestId('thread-want-most').querySelector('button')!.textContent).toBe('Dominate Trade');
    expect(screen.getByText('Their work')).toBeTruthy();
    expect(screen.getByText('What they want most')).toBeTruthy();
  });

  it('each line opens the profile on the Journey tab', () => {
    const onViewProfile = renderPanel(card());
    fireEvent.click(screen.getByTestId('thread-their-work').querySelector('button')!);
    expect(onViewProfile).toHaveBeenLastCalledWith('kael', 'agent', 'journey');
    fireEvent.click(screen.getByTestId('thread-want-most').querySelector('button')!);
    expect(onViewProfile).toHaveBeenLastCalledWith('kael', 'agent', 'journey');
    expect(onViewProfile).toHaveBeenCalledTimes(2);
  });

  it('"View Full Profile" still opens on the default tab', () => {
    const onViewProfile = renderPanel(card());
    fireEvent.click(screen.getByText(/View Full Profile/));
    expect(onViewProfile).toHaveBeenCalledWith('kael', 'agent');
  });

  it('hides the ambition line exactly when the Journey tab hides Ambitions', () => {
    renderPanel(card({ knowledgeLevel: 'stranger' }));
    expect(screen.queryByTestId('thread-want-most')).toBeNull();
    expect(screen.getByTestId('thread-their-work')).toBeTruthy();
  });

  it('renders neither line when there is no work and no known ambition', () => {
    renderPanel(card({ intents: [] }), vi.fn(), { projects: [], controls: [], history: [] } as unknown as StrategicRuntimeState);
    expect(screen.queryByTestId('thread-work-and-want')).toBeNull();
  });

  it('registers both label words with tooltips (Law 17)', () => {
    expect(UI_TOOLTIPS['ui.thread_work']?.label).toBe('Their work');
    expect(UI_TOOLTIPS['ui.thread_want_most']?.label).toBe('What they want most');
    expect(UI_TOOLTIPS['ui.moment_see_work']?.label).toBe(MOMENT_SEE_WORK_LABEL);
  });
});

describe('THR-1963 — AgentProfileModal initialTab', () => {
  it('opens on Overview by default', () => {
    render(<AgentProfileModal card={card()} onClose={vi.fn()} />);
    expect(screen.queryByText('The work')).toBeNull();
  });

  it('opens on the Journey tab when asked', () => {
    render(<AgentProfileModal card={card()} onClose={vi.fn()} initialTab="journey" />);
    expect(screen.getByText('The work')).toBeTruthy();
    expect(screen.getByText('Ambitions')).toBeTruthy();
  });

  it('an explicit tab beats the new-strata redirect, which still beats the default', () => {
    const { unmount } = render(<AgentProfileModal card={card()} onClose={vi.fn()} initialTab="journey" scrollToNewStrata />);
    expect(screen.getByText('The work')).toBeTruthy();
    unmount();
    render(<AgentProfileModal card={card()} onClose={vi.fn()} scrollToNewStrata />);
    expect(screen.queryByText('The work')).toBeNull();
  });
});

describe('THR-1963 — the work moments link to the work', () => {
  const graph = new WorldGraph();
  graph.addNode({ id: 'kael', name: 'Kael', type: 'actor', properties: { actorType: 'individual' } });

  function model(momentClass: UndertakingMomentRecord['momentClass'], seeWork: boolean): MomentCardModel {
    return {
      record: { id: `m_${momentClass}`, projectId: 'proj_1', actorId: 'kael', templateId: 'strategic_build_warehouse', momentClass, presentation: 'interrupt', tick: 10, label: '', undertakingName: 'Build Warehouse', acknowledged: false } as UndertakingMomentRecord,
      title: 'A Work Begun', actorId: 'kael', actorName: 'Kael', actorExists: true, seeWork,
      undertakingName: 'Build Warehouse', opening: 'Kael has begun Build Warehouse.', consequence: 'Nothing stands yet.',
      bandWord: null, outcomeBand: null, checkpoints: null, progressWord: null, chips: [], divineActions: [], actionable: false, forward: null,
    };
  }

  it('only the begun and finished classes carry the link', () => {
    expect([...MOMENT_SEE_WORK_CLASSES].sort()).toEqual(['completion', 'started']);
  });

  it('"See the work" opens the mortal on the Journey tab', () => {
    const onSeeWork = vi.fn();
    render(<MomentCard open model={model('started', true)} graph={graph} onAcknowledge={vi.fn()} onSeeWork={onSeeWork} />);
    const link = screen.getByTestId('moment-card-see-work');
    expect(link.textContent).toContain(MOMENT_SEE_WORK_LABEL);
    fireEvent.click(link);
    expect(onSeeWork).toHaveBeenCalledWith('kael');
  });

  it('a card without the link renders none', () => {
    render(<MomentCard open model={model('at_cost', false)} graph={graph} onAcknowledge={vi.fn()} onSeeWork={vi.fn()} />);
    expect(screen.queryByTestId('moment-card-see-work')).toBeNull();
  });
});
