// @vitest-environment jsdom
//
// FollowToggle — THR-1299 slice 4. The toggle renders the three-way read
// honestly: four states, four different labels, and the action word says which
// gesture the press makes (follow / unfollow / mute / unmute).
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WorldGraph } from '../../../engine/graph';
import { FollowToggle, describeFollow, followToggleCopy } from '../FollowToggle';

function graphWithThread(courtPosition?: string): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({ id: 'ascendant', name: 'The God', type: 'actor', properties: { actorType: 'ascendant' } });
  graph.addNode({ id: 'kael', name: 'Kael', type: 'actor', properties: { actorType: 'individual' } });
  if (courtPosition) {
    graph.addEdge({ id: 'e_thread', source: 'ascendant', target: 'kael', type: 'thread', properties: { courtPosition } });
  }
  return graph;
}

describe('describeFollow', () => {
  it('reads the four states off the world, each from its own arm', () => {
    const base = { ascendantId: 'ascendant', followedAgentIds: [] as string[], mutedAgentIds: [] as string[] };
    expect(describeFollow(base, graphWithThread(), 'kael')).toEqual({ followed: false, explicit: false, byBond: false, muted: false });
    expect(describeFollow({ ...base, followedAgentIds: ['kael'] }, graphWithThread(), 'kael')).toEqual({ followed: true, explicit: true, byBond: false, muted: false });
    expect(describeFollow(base, graphWithThread('retinue'), 'kael')).toEqual({ followed: true, explicit: false, byBond: true, muted: false });
    expect(describeFollow({ ...base, mutedAgentIds: ['kael'] }, graphWithThread('retinue'), 'kael')).toEqual({ followed: false, explicit: false, byBond: true, muted: true });
    // A dormant thread is not a bond that follows (slice 1's court-position rule).
    expect(describeFollow(base, graphWithThread('dormant'), 'kael').byBond).toBe(false);
  });

  it('names the gesture the press will make', () => {
    expect(followToggleCopy({ followed: false, explicit: false, byBond: false, muted: false }).action).toBe('Follow');
    expect(followToggleCopy({ followed: true, explicit: true, byBond: false, muted: false }).action).toBe('Unfollow');
    expect(followToggleCopy({ followed: true, explicit: false, byBond: true, muted: false }).action).toBe('Mute');
    expect(followToggleCopy({ followed: false, explicit: false, byBond: true, muted: true }).action).toBe('Unmute');
  });
});

describe('FollowToggle', () => {
  it('renders the bond state honestly and fires the toggle', () => {
    const onToggle = vi.fn();
    render(
      <FollowToggle
        descriptor={{ followed: true, explicit: false, byBond: true, muted: false }}
        onToggle={onToggle}
        surface="arc_panel"
      />,
    );
    const root = screen.getByTestId('follow-toggle-arc_panel');
    expect(root.getAttribute('data-follow-state')).toBe('bond');
    expect(root.textContent).toContain('Followed by bond');
    fireEvent.click(screen.getByTestId('follow-toggle-arc_panel-button'));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('compact renders the action only', () => {
    render(
      <FollowToggle
        descriptor={{ followed: false, explicit: false, byBond: false, muted: false }}
        onToggle={() => {}}
        surface="encounter_ui"
        compact
      />,
    );
    expect(screen.getByTestId('follow-toggle-encounter_ui').textContent).toBe('Follow');
  });
});
