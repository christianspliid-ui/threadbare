// @vitest-environment jsdom
/**
 * THR-2030 — a seeded echo relic lies at its site (`lies_at`), so its Inspector page
 * names that place: the header's "where" line renders the site as a chip. Built from a
 * real seed-42 world with the sample account, through the same `buildSubjectPage` the
 * game uses.
 */
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { DEV_ASCENDANT_IDENTITY, initializeGameStateFromIdentity } from '../../../../engine/gameInit';
import { sampleAccount } from '../../../../engine/accountStore';
import { resetDecisionCache, resetEventCounter } from '../../../../engine/orchestrator';
import { buildSubjectPage } from '../../../../engine/views/subjects/subjectPage';
import { SubjectHeader } from '../SubjectHeader';

describe('THR-2030 — the relic\'s page shows where it lies', () => {
  it('renders the site in the header\'s where line', () => {
    resetEventCounter();
    resetDecisionCache();
    const { state } = initializeGameStateFromIdentity(DEV_ASCENDANT_IDENTITY, 42, undefined, 'medium', undefined, sampleAccount());
    const relic = state.seededEchoes!.seeded.find(e => e.kind === 'relic')!;
    const site = state.graph.getNode(relic.hostId)!;
    const page = buildSubjectPage(state, { kind: 'artifact', id: relic.nodeId });
    const { container } = render(<SubjectHeader header={page.header} compact={false} />);
    expect(container.querySelector('[data-inspector-heading]')?.textContent).toBe('The Hollow Bell');
    const where = container.querySelector('[data-inspector-where]');
    expect(where).not.toBeNull();
    expect(where!.textContent).toContain(site.name);
  });
});
