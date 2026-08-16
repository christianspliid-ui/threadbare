// @vitest-environment jsdom
/**
 * PremonitionModal — the subject header (THR-1139).
 *
 * The surface used to name the mortal in inert dim text, so the player had to
 * already know who "Kael Thornweaver" was. These lock the three things that
 * changed: the portrait renders, the name is a control, and it routes to the
 * mortal's sheet rather than dismissing the premonition.
 *
 * The falsification arm matters most: `queryAllByRole('button')` on the header
 * would have found the option rows and the dismiss control even before the
 * change, so every assertion here is scoped to the header by test id.
 */

import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { PremonitionModal } from '../PremonitionModal';
import { WorldGraph } from '../../../engine/graph';
import { SPHERE_NAMES } from '../../../types';
import type { PremonitionEvent } from '../../../types/premonition';
import type { EssencePool } from '../../../types/influence';

const AGENT_ID = 'agent-kael';
const AGENT_NAME = 'Kael Thornweaver';

function makeGraph(opts: { withArt?: boolean } = {}): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({
    id: AGENT_ID,
    type: 'actor',
    name: AGENT_NAME,
    // Without `portraitAssetPath` this is the no-art path, so the fallback tile
    // is what renders (NFP #4 / Law 4: a designed state, not a broken one).
    properties: {
      actorType: 'individual',
      ...(opts.withArt ? { portraitAssetPath: '/portraits/kael.jpg' } : {}),
    },
  });
  return graph;
}

const WHISPER: PremonitionEvent = {
  id: 'prem-1',
  type: 'whisper',
  agentId: AGENT_ID,
  agentName: AGENT_NAME,
  tick: 12,
  showAfterTick: 12,
  eligibleUntilTick: 24,
  vignetteProse: 'A road unwalked turns in the sleeping mind.',
  whisperOptions: [
    {
      category: 'reach_bias',
      targetReach: 'stone',
      essenceCost: 1,
      sphere: 'matter',
      prose: 'Turn them toward the wall',
      flavorText: 'The stones remember hands.',
    },
  ],
};

const COMPULSION: PremonitionEvent = {
  ...WHISPER,
  id: 'prem-2',
  type: 'compulsion',
  whisperOptions: undefined,
  compulsionCandidates: [
    {
      templateId: 'encounter.slice.unsafe_bridge',
      encounterName: 'The Unsafe Bridge',
      encounterHook: 'The planks have been loose since the thaw.',
      encounterType: 'explore',
      reach: 'stone',
      sphere: 'matter',
      threatRating: 'fair',
      hexDistance: 1,
      score: 0.4,
      essenceCost: 2,
      locationId: 'loc-1',
      locationName: 'Fenmarch Crossing',
    },
  ],
};

/** Every sphere funded, so affordability never silently disables an option row. */
const ESSENCE: EssencePool = Object.fromEntries(
  SPHERE_NAMES.map(s => [s, 10]),
) as EssencePool;

function renderModal(
  premonition: PremonitionEvent,
  overrides: Partial<React.ComponentProps<typeof PremonitionModal>> = {},
) {
  const onViewAgent = vi.fn();
  const onDismiss = vi.fn();
  const onWhisperChoice = vi.fn();
  const onCompulsionChoice = vi.fn();
  const view = render(
    <PremonitionModal
      open
      premonition={premonition}
      essencePool={ESSENCE}
      graph={makeGraph()}
      onWhisperChoice={onWhisperChoice}
      onCompulsionChoice={onCompulsionChoice}
      onViewAgent={onViewAgent}
      onDismiss={onDismiss}
      {...overrides}
    />,
  );
  return { view, onViewAgent, onDismiss, onWhisperChoice, onCompulsionChoice };
}

/** The header as the surface composes it — inert, exactly as it shipped before. */
function renderInert(premonition: PremonitionEvent, graph = makeGraph()) {
  return render(
    <PremonitionModal
      open
      premonition={premonition}
      essencePool={ESSENCE}
      graph={graph}
      onWhisperChoice={vi.fn()}
      onCompulsionChoice={vi.fn()}
      onDismiss={vi.fn()}
    />,
  );
}

describe.each([
  ['whisper', WHISPER],
  ['compulsion', COMPULSION],
] as const)('PremonitionModal subject header — %s variant (THR-1139)', (_label, premonition) => {
  it('renders the subject portrait and the name together', () => {
    renderModal(premonition);
    expect(screen.getByTestId('premonition-subject-portrait')).toBeTruthy();
    expect(screen.getByTestId('premonition-subject-name').textContent).toBe(AGENT_NAME);
  });

  it('makes the name a real control (Law 21) that routes to onViewAgent', () => {
    const { onViewAgent, onDismiss } = renderModal(premonition);
    const name = screen.getByTestId('premonition-subject-name');
    expect(name.tagName).toBe('BUTTON');

    fireEvent.click(name);
    expect(onViewAgent).toHaveBeenCalledTimes(1);
    // Done-when 2/4: the sheet opens *over* the premonition. Under the jsdom
    // substitution this is the reachable half of "still in premonitionQueue" —
    // nothing dismissed it, and the surface is still mounted and choosable.
    expect(onDismiss).not.toHaveBeenCalled();
    expect(screen.getByTestId('premonition-subject-name')).toBeTruthy();
    expect(screen.getByText(premonition.vignetteProse)).toBeTruthy();
  });

  it('routes a portrait click the same way', () => {
    const { onViewAgent, onDismiss } = renderModal(premonition);
    fireEvent.click(screen.getByTestId('premonition-subject-portrait'));
    expect(onViewAgent).toHaveBeenCalledTimes(1);
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it('FALSIFICATION — without onViewAgent the header is inert text, as it shipped before', () => {
    // Reproduces the pre-change surface. If this passed alongside the assertions
    // above, the suite would not be measuring the change.
    renderInert(premonition);
    expect(screen.getByTestId('premonition-subject-name').tagName).not.toBe('BUTTON');
    expect(screen.getByTestId('premonition-subject-portrait').tagName).not.toBe('BUTTON');
  });
});

describe('PremonitionModal subject portrait — both art tiers (THR-1139)', () => {
  it('falls back to the designed tile when the mortal has no art', () => {
    renderModal(WHISPER);
    const portrait = screen.getByTestId('premonition-subject-portrait');
    // A glyph on an id-hashed gradient, not a broken <img> (Law 4).
    expect(portrait.getAttribute('data-entity-visual-tier')).toBe('fallback');
    expect(portrait.querySelector('img')).toBeNull();
  });

  it('renders the portrait art when the mortal has some', () => {
    renderInert(WHISPER, makeGraph({ withArt: true }));
    const portrait = screen.getByTestId('premonition-subject-portrait');
    expect(portrait.getAttribute('data-entity-visual-tier')).toBe('art');
    expect(portrait.querySelector('img')?.getAttribute('src')).toBe('/portraits/kael.jpg');
  });
});

describe('PremonitionModal — the surface as composed (THR-1139)', () => {
  it('still renders the choice options — the header did not displace the surface', () => {
    const { onWhisperChoice } = renderModal(WHISPER);
    fireEvent.click(screen.getByText('Turn them toward the wall'));
    expect(onWhisperChoice).toHaveBeenCalledTimes(1);
  });

  it('keeps the dismiss control distinct from the name control', () => {
    const { onDismiss, onViewAgent } = renderModal(WHISPER);
    fireEvent.click(screen.getByText('Let the dream fade'));
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(onViewAgent).not.toHaveBeenCalled();
  });

  it('fails soft with no graph — the name still links, the tile is still designed', () => {
    // A graph-free caller must not crash the interrupt (NFP #4).
    const onViewAgent = vi.fn();
    expect(() =>
      render(
        <PremonitionModal
          open
          premonition={WHISPER}
          essencePool={ESSENCE}
          onWhisperChoice={vi.fn()}
          onCompulsionChoice={vi.fn()}
          onViewAgent={onViewAgent}
          onDismiss={vi.fn()}
        />,
      ),
    ).not.toThrow();
    expect(screen.getByTestId('premonition-subject-portrait')).toBeTruthy();
    fireEvent.click(screen.getByTestId('premonition-subject-name'));
    expect(onViewAgent).toHaveBeenCalledTimes(1);
  });
});
