// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NpcDetailView } from '../NpcDetailView';
import type { GraphNode } from '../../../types/graph';

const makeNpc = (overrides: Partial<GraphNode['properties']> = {}): GraphNode => ({
  id: 'npc.test.1',
  type: 'actor',
  name: 'Marta Greystone',
  properties: {
    actorType: 'individual',
    spotlightTier: 'ambient',
    npcRole: 'innkeeper',
    sphereAffinity: 'hearth',
    ...overrides,
  },
});

describe('NpcDetailView', () => {
  it('renders NPC name', () => {
    render(
      <NpcDetailView
        npc={makeNpc()}
        traits={[]}
        factionName={null}
      />
    );
    expect(screen.getByText('Marta Greystone')).toBeTruthy();
  });

  it('shows role text with underscores replaced by spaces', () => {
    render(
      <NpcDetailView
        npc={makeNpc({ npcRole: 'guard_captain' })}
        traits={[]}
        factionName={null}
      />
    );
    expect(screen.getByText('guard captain')).toBeTruthy();
  });

  it('shows "ambient" tier indicator for ambient NPCs', () => {
    render(
      <NpcDetailView
        npc={makeNpc({ spotlightTier: 'ambient' })}
        traits={[]}
        factionName={null}
      />
    );
    expect(screen.getByText('Ambient')).toBeTruthy();
  });

  it('shows "notable" tier indicator for notable NPCs', () => {
    render(
      <NpcDetailView
        npc={makeNpc({ spotlightTier: 'notable' })}
        traits={[]}
        factionName={null}
      />
    );
    expect(screen.getByText('Notable')).toBeTruthy();
  });

  it('shows faction name when provided', () => {
    render(
      <NpcDetailView
        npc={makeNpc()}
        traits={[]}
        factionName="The Iron Veil"
      />
    );
    expect(screen.getByText('The Iron Veil')).toBeTruthy();
  });

  it('does not show faction section when factionName is null', () => {
    render(
      <NpcDetailView
        npc={makeNpc()}
        traits={[]}
        factionName={null}
      />
    );
    expect(screen.queryByText(/faction/i)).toBeNull();
  });

  it('renders traits as badges when provided', () => {
    render(
      <NpcDetailView
        npc={makeNpc()}
        traits={['brave', 'cunning', 'loyal']}
        factionName={null}
      />
    );
    expect(screen.getByText('brave')).toBeTruthy();
    expect(screen.getByText('cunning')).toBeTruthy();
    expect(screen.getByText('loyal')).toBeTruthy();
  });

  it('renders sphere affinity when set', () => {
    render(
      <NpcDetailView
        npc={makeNpc({ sphereAffinity: 'iron' })}
        traits={[]}
        factionName={null}
      />
    );
    expect(screen.getByText('iron')).toBeTruthy();
  });

  it('does not show sphere section when sphereAffinity is not set', () => {
    const npcWithoutSphere = makeNpc();
    delete (npcWithoutSphere.properties as Record<string, unknown>).sphereAffinity;
    render(
      <NpcDetailView
        npc={npcWithoutSphere}
        traits={[]}
        factionName={null}
      />
    );
    // sphere label text shouldn't appear
    expect(screen.queryByText(/sphere/i)).toBeNull();
  });
});
