// @vitest-environment jsdom
//
// MomentCard — THR-1299 slice 3. Render arms on the real component: every
// class renders and puts no numeral on the face (Law 13), acknowledge is one
// click, the Inspire verb is armed then fired (Law 48), and an unaffordable verb
// fails inline rather than committing.
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WorldGraph } from '../../../engine/graph';
import type { UndertakingMomentClass, UndertakingMomentRecord } from '../../../types/strategicAction';
import { MomentCard } from '../MomentCard';
import type { MomentCardModel } from '../momentCardModel';

function buildGraph(): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({ id: 'actor_1', name: 'Kael', type: 'actor', properties: { actorType: 'individual' } });
  return graph;
}

function makeModel(overrides: Partial<MomentCardModel> = {}, recordOverrides: Partial<UndertakingMomentRecord> = {}): MomentCardModel {
  const record: UndertakingMomentRecord = {
    id: 'undertaking_at_cost_proj_1_10',
    projectId: 'proj_1',
    actorId: 'actor_1',
    templateId: 'strategic_build_warehouse',
    momentClass: 'at_cost',
    presentation: 'interrupt',
    tick: 10,
    label: 'Kael presses on with Build Warehouse, but it costs them',
    undertakingName: 'Build Warehouse',
    band: 'success_at_cost',
    effect: 'advance_at_cost',
    acknowledged: false,
    ...recordOverrides,
  };
  return {
    record,
    title: 'Pressing On at a Cost',
    actorId: 'actor_1',
    actorName: 'Kael',
    actorExists: true,
    undertakingName: 'Build Warehouse',
    opening: 'The work on Build Warehouse went dearly. Kael pressed on, and it cost them.',
    consequence: 'The work advanced anyway.',
    bandWord: 'dearly',
    outcomeBand: 'cost',
    checkpoints: { total: 3, filled: 2 },
    progressWord: 'Well along',
    chips: [{ id: 'progress', category: 'Progress', noun: 'a step, dearly bought', tone: 'loss' }],
    divineActions: [
      { templateId: 'action.undertaking.inspire', verb: 'inspire', label: 'Inspire the Work', confirm: 'Let it be so', description: 'Easier next roll.', sphere: 'spirit', essenceCost: 12, affordable: true },
      { templateId: 'action.undertaking.sabotage', verb: 'sabotage', label: 'Sow Doubt', confirm: 'Let it be so', description: 'Harder next roll.', sphere: 'entropy', essenceCost: 10, affordable: false },
    ],
    actionable: true,
    forward: null,
    ...overrides,
  };
}

const CLASSES: UndertakingMomentClass[] = ['started', 'at_cost', 'complication', 'fork', 'abandoned', 'completion'];

describe('MomentCard', () => {
  it('renders the identity chrome, both prose lines, and the chips — no numeral on the face', () => {
    render(<MomentCard open model={makeModel()} graph={buildGraph()} onAcknowledge={() => {}} />);
    expect(screen.getByTestId('moment-card-title').textContent).toBe('Pressing On at a Cost');
    expect(screen.getByTestId('moment-card-undertaking').textContent).toBe('Build Warehouse');
    expect(screen.getByTestId('moment-card-band-word').textContent).toBe('dearly');
    expect(screen.getByTestId('moment-card-checkpoints')).toBeTruthy();
    expect(screen.getByTestId('moment-card-opening').textContent).toContain('Kael');
    expect(screen.getByTestId('moment-card-consequence').textContent?.length).toBeGreaterThan(0);
    expect(screen.getByTestId('moment-chip-progress').textContent).toContain('a step, dearly bought');
    expect(screen.getByTestId('moment-card-pause-note').textContent?.length).toBeGreaterThan(0);

    const face = screen.getByTestId('moment-card').parentElement?.textContent ?? '';
    expect(face).not.toMatch(/\d/);
  });

  it('renders every moment class without throwing', () => {
    for (const momentClass of CLASSES) {
      const { unmount } = render(
        <MomentCard open model={makeModel({}, { momentClass })} graph={buildGraph()} onAcknowledge={() => {}} />,
      );
      expect(screen.getByTestId('moment-card').getAttribute('data-moment-class')).toBe(momentClass);
      unmount();
    }
  });

  it('acknowledge is a single click', () => {
    const onAcknowledge = vi.fn();
    render(<MomentCard open model={makeModel()} graph={buildGraph()} onAcknowledge={onAcknowledge} />);
    fireEvent.click(screen.getByTestId('moment-card-acknowledge'));
    expect(onAcknowledge).toHaveBeenCalledTimes(1);
  });

  it('the portrait and an agent chip route to the agent surface (Law 21)', () => {
    const onSelectAgent = vi.fn();
    const model = makeModel({
      chips: [{
        id: 'forward', category: 'Set in motion', noun: 'Bram now pursues Answer the Raid', tone: 'neutral',
        entity: { id: 'actor_2', kind: 'agent', name: 'Bram' }, selectAgentId: 'actor_2',
      }],
    });
    render(<MomentCard open model={model} graph={buildGraph()} onAcknowledge={() => {}} onSelectAgent={onSelectAgent} />);
    fireEvent.click(screen.getByTestId('moment-card-portrait'));
    expect(onSelectAgent).toHaveBeenLastCalledWith('actor_1');
    fireEvent.click(screen.getByTestId('moment-chip-link-forward'));
    expect(onSelectAgent).toHaveBeenLastCalledWith('actor_2');
  });

  it('Inspire is armed on the first press and fired on the second (Law 48)', () => {
    const onDivineAct = vi.fn().mockReturnValue({ success: true, message: 'Inspire Undertaking is cast.' });
    render(<MomentCard open model={makeModel()} graph={buildGraph()} onAcknowledge={() => {}} onDivineAct={onDivineAct} />);

    const inspire = screen.getByTestId('moment-act-inspire');
    expect(inspire.textContent).toBe('Inspire the Work');
    fireEvent.click(inspire);
    expect(onDivineAct).not.toHaveBeenCalled();
    expect(inspire.getAttribute('data-staged')).toBe('true');
    expect(inspire.textContent).toBe('Let it be so');

    fireEvent.click(inspire);
    expect(onDivineAct).toHaveBeenCalledWith('action.undertaking.inspire', 'actor_1');
    expect(screen.getByTestId('moment-card-act-outcome').textContent).toContain('is cast');
    // Spent: the slot closes so a second nudge cannot be bought off the same card.
    expect((screen.getByTestId('moment-act-inspire') as HTMLButtonElement).disabled).toBe(true);
  });

  it('an unaffordable verb is blocked inline and never fires', () => {
    const onDivineAct = vi.fn();
    render(<MomentCard open model={makeModel()} graph={buildGraph()} onAcknowledge={() => {}} onDivineAct={onDivineAct} />);
    const sabotage = screen.getByTestId('moment-act-sabotage') as HTMLButtonElement;
    expect(sabotage.disabled).toBe(true);
    fireEvent.click(sabotage);
    expect(onDivineAct).not.toHaveBeenCalled();
  });

  it('a finished work hosts no action slot', () => {
    render(
      <MomentCard
        open
        model={makeModel({ actionable: false }, { momentClass: 'completion' })}
        graph={buildGraph()}
        onAcknowledge={() => {}}
        onDivineAct={() => ({ success: true })}
      />,
    );
    expect(screen.queryByTestId('moment-card-actions')).toBeNull();
  });
});
