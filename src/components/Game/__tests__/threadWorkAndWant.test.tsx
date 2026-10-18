// @vitest-environment jsdom
//
// THR-1963 — the begun and finished work moments link to the work. (The thread
// panel's work lines and the sheet's `initialTab` retired with those surfaces in
// THR-1912; the person page's rows carry the work now.)
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MomentCard } from '../MomentCard';
import { WorldGraph } from '../../../engine/graph';
import type { UndertakingMomentRecord } from '../../../types/strategicAction';
import type { MomentCardModel } from '../momentCardModel';
import { MOMENT_SEE_WORK_CLASSES, MOMENT_SEE_WORK_LABEL } from '../../../data/moment-card-content';

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
