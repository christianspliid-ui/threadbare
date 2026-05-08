// @vitest-environment jsdom
/**
 * TypedDetailPages — integration snapshot tests for the 5 typed detail page kinds.
 *
 * Spec: THR-338 Phase E2. The detail pages are data-driven (the engine produces
 * a DetailPage payload, the shared Section dispatcher renders it). These tests
 * verify the full pipeline: engine → DetailModal portal output at 1920×1080.
 */
import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { DetailModal } from '../../../../../components/shared/DetailModal';
import {
  DetailModalStackProvider,
  useDetailStack,
} from '../../../../../contexts/DetailModalStackContext';
import { DetailPageOpenerProvider } from '../../../../../contexts/DetailPageOpenerContext';
import {
  clearDetailPageCache,
  generateDetailPage,
} from '../../../../../engine/detailPageGenerator';
import { WorldGraph } from '../../../../../engine/graph';
import type { GraphEdge, GraphNode } from '../../../../../types/graph';
import type { DetailPageKind, NodeRef } from '../../../../../types/detailPage';

// ─── Fixture (mirrors engine generator tests) ────────────────────────────────

function n(partial: Partial<GraphNode> & Pick<GraphNode, 'id' | 'type' | 'name'>): GraphNode {
  return { properties: {}, ...partial };
}
function e(
  id: string,
  source: string,
  target: string,
  type: GraphEdge['type'],
  properties: Record<string, unknown> = {},
): GraphEdge {
  return { id, source, target, type, properties };
}
function fixtureGraph() {
  const g = new WorldGraph();
  g.addNode(
    n({
      id: 'protag',
      type: 'actor',
      name: 'Avatar of Witness',
      properties: { actorType: 'individual', isPortfolioPinned: true },
    }),
  );
  g.addNode(
    n({
      id: 'veiren',
      type: 'actor',
      name: 'Captain Veiren',
      properties: {
        actorType: 'individual',
        sphereInfluence: { spirit: 0.7 },
        reaches: { command: 0.85 },
      },
    }),
  );
  g.addNode(
    n({
      id: 'iron-market',
      type: 'location',
      name: 'The Iron Market',
      properties: { sphereInfluence: { matter: 0.6 } },
    }),
  );
  g.addNode(
    n({
      id: 'iron-guard',
      type: 'actor',
      name: 'The Iron Guard',
      properties: {
        actorType: 'faction',
        reputations: { protag: { phrase: 'a stranger watched closely', sentiment: 0 } },
      },
    }),
  );
  g.addNode(
    n({
      id: 'token',
      type: 'artifact',
      name: 'Veirens Token',
      properties: { category: 'token' },
    }),
  );
  g.addNode(
    n({
      id: 'evt-1',
      type: 'event',
      name: 'A meeting in the market',
      properties: {
        eventType: 'encounter_outcome',
        tick: 5,
        locationId: 'iron-market',
        participantIds: ['protag', 'veiren'],
        summary: 'You met under the iron arch and traded a single name.',
        outcome: 'success',
      },
    }),
  );
  g.addEdge(
    e('e1', 'veiren', 'iron-guard', 'member_of', {
      rank: 'captain',
      role: 'captain',
      joinedTick: 0,
    }),
  );
  g.addEdge(
    e('e2', 'veiren', 'protag', 'relates_to', { basis: 'a debt unspoken', sentiment: 0.4 }),
  );
  g.addEdge(e('e3', 'protag', 'token', 'possesses'));
  g.addEdge(
    e('e4', 'veiren', 'evt-1', 'participated_in', {
      role: 'protagonist',
      outcome: 'success',
      tick: 5,
    }),
  );
  g.addEdge(
    e('e5', 'protag', 'evt-1', 'participated_in', {
      role: 'witness',
      outcome: 'success',
      tick: 5,
    }),
  );
  g.addEdge(e('e6', 'evt-1', 'iron-market', 'occurred_at', { tick: 5 }));
  return g;
}

// ─── Harness ─────────────────────────────────────────────────────────────────

interface OpenerProps {
  initial: { nodeId: string; pageKind: DetailPageKind }[];
}

function StackPusher({ initial }: OpenerProps) {
  const { push } = useDetailStack();
  const graph = fixtureGraph();
  const buildPage = (nodeId: string, pageKind: DetailPageKind) =>
    generateDetailPage({
      nodeId,
      pageKind,
      graph,
      tick: 6,
      seed: 42,
      protagonistId: 'protag',
    });
  return (
    <button
      data-testid="push-initial"
      onClick={() => {
        for (const i of initial) push(buildPage(i.nodeId, i.pageKind));
      }}
    >
      push
    </button>
  );
}

interface HarnessProps {
  initial: { nodeId: string; pageKind: DetailPageKind }[];
  onOpenRef?: (ref: NodeRef) => void;
}

function Harness({ initial, onOpenRef }: HarnessProps) {
  const opener = onOpenRef ?? (() => {});
  return (
    <DetailModalStackProvider>
      <DetailPageOpenerProvider value={opener}>
        <DetailModal />
        <StackPusher initial={initial} />
      </DetailPageOpenerProvider>
    </DetailModalStackProvider>
  );
}

beforeAll(() => {
  // Viewport contract: 1920×1080. JSDOM defaults to 1024×768 — set explicitly
  // so any size-sensitive computation reports the canonical dev resolution.
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1920 });
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: 1080 });
});

beforeEach(() => clearDetailPageCache());

const KINDS: { kind: DetailPageKind; nodeId: string; expected: string }[] = [
  { kind: 'actor', nodeId: 'veiren', expected: 'Captain Veiren' },
  { kind: 'item', nodeId: 'token', expected: 'Veirens Token' },
  { kind: 'faction', nodeId: 'iron-guard', expected: 'The Iron Guard' },
  { kind: 'place', nodeId: 'iron-market', expected: 'The Iron Market' },
  { kind: 'event', nodeId: 'evt-1', expected: 'A meeting in the market' },
];

for (const kind of KINDS) {
  describe(`DetailPage — ${kind.kind}`, () => {
    it(`renders the ${kind.kind} page with kind label and display name`, () => {
      const { getByTestId, getAllByText } = render(
        <Harness initial={[{ nodeId: kind.nodeId, pageKind: kind.kind }]} />,
      );
      fireEvent.click(getByTestId('push-initial'));
      // Display name and kind label can each appear in multiple chrome surfaces
      // (e.g. portrait label + header). Just assert presence ≥ 1.
      expect(getAllByText(kind.expected).length).toBeGreaterThanOrEqual(1);
      expect(getAllByText(kind.kind.toUpperCase()).length).toBeGreaterThanOrEqual(1);
    });

    it(`snapshot: ${kind.kind}`, () => {
      const { getByTestId } = render(
        <Harness initial={[{ nodeId: kind.nodeId, pageKind: kind.kind }]} />,
      );
      fireEvent.click(getByTestId('push-initial'));
      const panel = document.querySelector('[data-detail-depth="0"]');
      expect(panel).toMatchSnapshot();
    });
  });
}

describe('DetailPage — modal stacking 4 deep', () => {
  it('renders 4 stacked panels via push() calls', () => {
    render(
      <Harness
        initial={[
          { nodeId: 'veiren', pageKind: 'actor' },
          { nodeId: 'iron-guard', pageKind: 'faction' },
          { nodeId: 'iron-market', pageKind: 'place' },
          { nodeId: 'evt-1', pageKind: 'event' },
        ]}
      />,
    );
    fireEvent.click(document.querySelector('[data-testid="push-initial"]')!);
    const panels = document.querySelectorAll('[data-detail-depth]');
    expect(panels.length).toBe(4);
  });
});

describe('DetailPage — chip click invokes opener', () => {
  it('clicking a faction chip in actor page calls opener with the faction ref', () => {
    const calls: NodeRef[] = [];
    render(
      <Harness
        initial={[{ nodeId: 'veiren', pageKind: 'actor' }]}
        onOpenRef={(ref) => calls.push(ref)}
      />,
    );
    fireEvent.click(document.querySelector('[data-testid="push-initial"]')!);
    // Find chip with the faction label and click it
    const chipNodes = document.querySelectorAll('span[role="button"]');
    const chip = Array.from(chipNodes).find((n) => n.textContent?.includes('The Iron Guard'));
    expect(chip).toBeDefined();
    fireEvent.click(chip!);
    expect(calls.length).toBe(1);
    expect(calls[0]).toEqual({ nodeId: 'iron-guard', pageKind: 'faction' });
  });
});
