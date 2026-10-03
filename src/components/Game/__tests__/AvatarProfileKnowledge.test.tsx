// @vitest-environment jsdom
/**
 * THR-1710 — the player's own avatar must not read as a stranger.
 *
 * Cold playtest round 2: *"'Unaware' and 'You haven't observed Vessane's
 * capabilities': that's MY avatar."* The avatar has no familiarity record and
 * no thread edge, so the sheet resolved at `stranger` and the thread detail
 * badge fell back to tier 0. The card is built here through the same path the
 * hook takes (`resolveCardKnowledgeLevel` → `getAgentInfoCard`), on a real graph.
 */
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WorldGraph } from '../../../engine/graph';
import { getAgentInfoCard } from '../../../engine/agentDetail';
import { resolveCardKnowledgeLevel, isAvatarOf, unthreadedAgentTierName } from '../hooks/useAgentInteraction';
import { AgentProfileModal } from '../AgentProfileModal';
import { ThreadDetailView } from '../ThreadDetailView';
import { AVATAR_TIER_LABEL, TIER_NAMES } from '../../../data/influence-content';

const ASCENDANT = 'ascendant.player';
const AVATAR = 'actor.avatar';
const STRANGER = 'actor.stranger';

function buildGraph(): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({ id: ASCENDANT, type: 'ascendant', name: 'The Hunger', properties: {} } as never);
  graph.addNode({ id: 'loc.1', type: 'location', name: 'Ashvale', properties: { locationSubtype: 'village', hexCol: 1, hexRow: 1 } } as never);
  for (const [id, name] of [[AVATAR, 'Vessane'], [STRANGER, 'Kael']] as const) {
    // `createAscendant` seeds the avatar's values from the archetype's personality seed.
    graph.addNode({ id, type: 'actor', name, properties: { actorType: 'individual', axiologicalProfile: { loyalty_ambition: 0.6, mercy_ruthlessness: -0.4 } } } as never);
    graph.addEdge({ id: `e.${id}.loc`, type: 'located_at', source: id, target: 'loc.1', properties: {} } as never);
  }
  graph.addEdge({ id: 'e.avatar_of', type: 'avatar_of', source: AVATAR, target: ASCENDANT, properties: {} } as never);
  return graph;
}

function stateFor(graph: WorldGraph) {
  return { graph, ascendantId: ASCENDANT, familiarityMap: new Map() } as unknown as Parameters<typeof resolveCardKnowledgeLevel>[0];
}

describe('THR-1710 — the avatar is read as the player\'s own shape', () => {
  it('resolves the avatar at transparent and a stranger at stranger', () => {
    const graph = buildGraph();
    expect(isAvatarOf(graph, AVATAR, ASCENDANT)).toBe(true);
    expect(isAvatarOf(graph, STRANGER, ASCENDANT)).toBe(false);
    expect(resolveCardKnowledgeLevel(stateFor(graph), AVATAR, false)).toBe('transparent');
    expect(resolveCardKnowledgeLevel(stateFor(graph), STRANGER, false)).toBe('stranger');
    expect(resolveCardKnowledgeLevel(stateFor(graph), STRANGER, true)).toBe('transparent');
  });

  it('the avatar\'s profile never says the player has not observed it', () => {
    const graph = buildGraph();
    const card = getAgentInfoCard(graph, AVATAR, ASCENDANT, resolveCardKnowledgeLevel(stateFor(graph), AVATAR, false));
    expect(card).not.toBeNull();
    render(
      <AgentProfileModal
        card={card!}
        onClose={() => {}}
        mortalShape={{ godTitleLine: 'The Hunger, Witness' }}
      />,
    );
    expect(screen.queryByText(/haven.t observed/i)).toBeNull();
    fireEvent.click(screen.getByText('Prowess'));
    expect(screen.queryByText(/haven.t observed/i)).toBeNull();
    expect(screen.queryByText(TIER_NAMES[0])).toBeNull();
  });

  it('a stranger\'s profile still hides what the god has not seen (control)', () => {
    const graph = buildGraph();
    const card = getAgentInfoCard(graph, STRANGER, ASCENDANT, resolveCardKnowledgeLevel(stateFor(graph), STRANGER, false));
    render(<AgentProfileModal card={card!} onClose={() => {}} />);
    fireEvent.click(screen.getByText('Prowess'));
    expect(screen.queryByText(/haven.t observed Kael/i)).not.toBeNull();
  });

  it('the unthreaded tier name is the avatar label for the avatar, tier 0 for anyone else', () => {
    expect(unthreadedAgentTierName(AVATAR, AVATAR)).toBe(AVATAR_TIER_LABEL);
    expect(unthreadedAgentTierName(STRANGER, AVATAR)).toBe(TIER_NAMES[0]);
    expect(unthreadedAgentTierName(STRANGER, null)).toBe(TIER_NAMES[0]);
  });

  it('the thread detail badge names the avatar as the player\'s shape, not "Unaware"', () => {
    render(
      <ThreadDetailView
        node={{
          id: AVATAR, name: 'Vessane', tier: 0, tierName: unthreadedAgentTierName(AVATAR, AVATAR), category: 'agent',
          threadEdgeId: '', attentionMode: 'auto_resolve', courtPosition: null,
          locationName: 'Ashvale', activityLabel: 'Unknown',
        } as never}
        onClose={() => {}}
        onViewProfile={() => {}}
      />,
    );
    expect(screen.getByText(AVATAR_TIER_LABEL)).toBeTruthy();
    expect(screen.queryByText(TIER_NAMES[0])).toBeNull();
  });
});
