// @vitest-environment jsdom
/**
 * The network diagram's nodes route and hover — THR-1508.
 *
 * `FactionNetworkGraph` drew four kinds of world object as inert `<text>`: members
 * (Agents), halls and controls (Locations) and armies. None clicked, none hovered
 * (Laws 21, 1, 17), while the same agent's name was a link in the Leadership section
 * directly below on the same sheet.
 *
 * **This is the sanctioned unattended substitution for the browser capture**
 * (`Docs/canon/verification-gates.md` § Browser-verify): the lane cannot start a dev
 * server, so the evidence is a jsdom render of the real component over a **generated**
 * world, with the ref router replaced by a spy — which is also the state assertion the
 * contract asks for, since `router.open` is what emits `ui_ref_opened` in the shell.
 *
 * Both directions are asserted, per the Done-when: the routed face under a provider,
 * and Law 21's surviving fail-open branch with no router in scope, where every name
 * must still paint as plain styled text with no control around it.
 */
import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import { act, fireEvent, render } from '@testing-library/react';
import { FactionSheet } from '../FactionSheet';
import { RefRouterProvider } from '../../../contexts/RefRouterContext';
import type { RefRouter } from '../../../hooks/useRefRouter';
import { initializeGameState, MAP_SIZE_PRESETS } from '../../../engine/gameInit';
import { createBalancedCosmology } from '../../../engine/cosmology';
import { generateArchetypes } from '../../../engine/ascendant';
import { getFactionNetworkSummary, type FactionNetworkSummary } from '../../../engine/factionNetwork';
import { resolveTooltip, tooltipResolves } from '../../../engine/tooltipResolver';
import { TOOLTIP_SHOW_DELAY } from '../../../types/tooltip';
import type { WorldGraph } from '../../../engine/graph';
import type { GraphNode } from '../../../types/graph';

const SEED = 42;
/** The network diagram's own viewBox, used to scope every assertion to it. */
const NETWORK_SVG = 'svg[viewBox="0 0 520 260"]';
/** The node limits the diagram draws to — mirrored from the component. */
const MEMBER_LIMIT = 4;
const HALL_LIMIT = 2;
const CONTROL_LIMIT = 2;
const ARMY_LIMIT = 2;

/** An army grafted onto the generated faction: seed 42 fields none at tick 0. */
const ARMY_ID = 'army_thr1508_test_banner';
const ARMY_NAME = 'The Test Banner';

const TOOLTIP_IDS = [
  'ui.faction_core',
  'ui.faction_leader',
  'ui.faction_member',
  'ui.faction_hall',
  'ui.faction_control',
  'ui.faction_army',
];

let graph: WorldGraph;
let faction: GraphNode;
let summary: FactionNetworkSummary;

function makeRouter(): RefRouter {
  return {
    open: vi.fn(),
    canOpen: vi.fn(() => true),
    rowFor: vi.fn(),
    stack: { stack: [], isOpen: false } as unknown as RefRouter['stack'],
    hoverCard: null,
    closeHover: vi.fn(),
    armHover: vi.fn(),
    disarmHover: vi.fn(),
  } as unknown as RefRouter;
}

function renderSheet(router?: RefRouter) {
  const sheet = (
    <FactionSheet factionId={faction.id} name={faction.name} graph={graph} onClose={() => {}} />
  );
  // `baseElement`: the sheet renders through `Modal`, which portals out of the container.
  const { baseElement } = render(router ? <RefRouterProvider router={router}>{sheet}</RefRouterProvider> : sheet);
  const svg = baseElement.querySelector(NETWORK_SVG);
  expect(svg).not.toBeNull();
  return { baseElement, svg: svg as SVGSVGElement };
}

beforeAll(() => {
  const preset = MAP_SIZE_PRESETS['medium'];
  const archetype = generateArchetypes(4, SEED)[0];
  graph = initializeGameState(
    archetype, 'Network', createBalancedCosmology(), SEED, preset.cols, preset.rows,
  ).state.graph;

  // The first guild (by generated order) with a leader, members and a hall —
  // deterministic on the seed, and asserted below rather than assumed. No generated
  // faction holds BOTH ways at tick 0 (a guild's one `controls` target is its own hall
  // and dedupes into it; a realm keeps no hall), so the control and the army are grafted
  // below, each along the exact edge the summary reads.
  const candidate = graph.getNodesByType('actor')
    .filter(node => node.properties.actorType === 'faction')
    .find(node => {
      const s = getFactionNetworkSummary(graph, node.id);
      return !!s && !!s.leader && s.members.length >= 1
        && s.networkLocations.some(l => l.role === 'hall');
    });
  expect(candidate, 'no generated faction has a leader, members and a hall').toBeDefined();
  faction = candidate as GraphNode;

  // The control arm. `collectFactionLocations` reads `controls` edges out of the faction
  // onto a `location` node; a place-tier Location the faction does not already keep as a
  // hall stays `control` through the dedupe.
  const held = new Set((getFactionNetworkSummary(graph, faction.id)?.networkLocations ?? []).map(l => l.id));
  const controlTarget = graph.getNodesByType('location')
    .find(node => !node.properties.parentLocationId && !held.has(node.id));
  expect(controlTarget, 'no unheld place-tier Location to graft a control onto').toBeDefined();
  graph.addEdge({
    id: `${faction.id}_controls_thr1508`,
    source: faction.id,
    target: controlTarget!.id,
    type: 'controls',
    properties: {},
  });

  // The army arm. `isArmy` is `armyState != null || actorType === 'group'` in
  // `buildMemberEntry`; a `member_of` edge onto the faction is how it joins the summary.
  graph.addNode({
    id: ARMY_ID,
    type: 'actor',
    name: ARMY_NAME,
    properties: { actorType: 'group', armyState: { status: 'garrisoned' } },
  });
  graph.addEdge({
    id: `${ARMY_ID}_member_of`,
    source: ARMY_ID,
    target: faction.id,
    type: 'member_of',
    properties: { role: 'army', reputation: 0.5, rank: 0.5, joinedTick: 0 },
  });

  summary = getFactionNetworkSummary(graph, faction.id) as FactionNetworkSummary;
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('FactionSheet network diagram — every node routes by kind (THR-1508)', () => {
  it('the generated faction really draws all four kinds — the non-vacuity arm', () => {
    expect(summary.leader).not.toBeNull();
    expect(summary.members.length).toBeGreaterThanOrEqual(1);
    expect(summary.networkLocations.filter(l => l.role === 'hall').length).toBeGreaterThanOrEqual(1);
    expect(summary.networkLocations.filter(l => l.role === 'control').length).toBeGreaterThanOrEqual(1);
    expect(summary.armies.map(a => a.id)).toContain(ARMY_ID);
  });

  it('each drawn member, hall, control and army node is a link carrying its WorldRef kind', () => {
    const { svg } = renderSheet(makeRouter());

    const expected: Array<{ kind: string; id: string; name: string }> = [
      { kind: 'agent', id: summary.leader!.id, name: summary.leader!.name },
      ...summary.members.slice(0, MEMBER_LIMIT).map(m => ({ kind: 'agent', id: m.id, name: m.name })),
      ...summary.networkLocations.filter(l => l.role === 'hall').slice(0, HALL_LIMIT)
        .map(l => ({ kind: 'location', id: l.id, name: l.name })),
      ...summary.networkLocations.filter(l => l.role === 'control').slice(0, CONTROL_LIMIT)
        .map(l => ({ kind: 'location', id: l.id, name: l.name })),
      ...summary.armies.slice(0, ARMY_LIMIT).map(a => ({ kind: 'army', id: a.id, name: a.name })),
    ];

    for (const node of expected) {
      const link = svg.querySelector(`[role="link"][data-ref-id="${node.id}"]`);
      expect(link, `${node.kind} ${node.name} (${node.id}) is not a link`).not.toBeNull();
      expect(link!.getAttribute('data-ref-kind')).toBe(node.kind);
      expect(link!.getAttribute('tabindex')).toBe('0');
      expect(link!.getAttribute('aria-label')).toContain('open');
    }
    // Exactly those, and no link anywhere else in the diagram.
    expect(svg.querySelectorAll('[role="link"]').length).toBe(expected.length);
  });

  it('clicking a node opens its entity through the router as a card, dispatching on kind', () => {
    const router = makeRouter();
    const { svg } = renderSheet(router);

    const member = summary.members[0];
    const hall = summary.networkLocations.find(l => l.role === 'hall')!;
    const control = summary.networkLocations.find(l => l.role === 'control')!;
    const cases = [
      { kind: 'agent', id: member.id },
      { kind: 'location', id: hall.id },
      { kind: 'location', id: control.id },
      { kind: 'army', id: ARMY_ID },
    ];

    for (const { kind, id } of cases) {
      (router.open as ReturnType<typeof vi.fn>).mockClear();
      fireEvent.click(svg.querySelector(`[role="link"][data-ref-id="${id}"]`)!);
      expect(router.open).toHaveBeenCalledTimes(1);
      expect(router.open).toHaveBeenCalledWith({ kind, id }, 'card', { via: 'entity-link' });
    }
  });

  it('Enter and Space open the node from the keyboard; other keys do not', () => {
    const router = makeRouter();
    const { svg } = renderSheet(router);
    const link = svg.querySelector(`[role="link"][data-ref-id="${ARMY_ID}"]`)!;

    fireEvent.keyDown(link, { key: 'Enter' });
    fireEvent.keyDown(link, { key: ' ' });
    fireEvent.keyDown(link, { key: 'Tab' });
    expect(router.open).toHaveBeenCalledTimes(2);
    expect(router.open).toHaveBeenLastCalledWith({ kind: 'army', id: ARMY_ID }, 'card', { via: 'entity-link' });
  });

  it('the faction core is the one node that does not link — this sheet is its surface (Law 25)', () => {
    const { svg } = renderSheet(makeRouter());
    expect(svg.querySelector(`[role="link"][data-ref-id="${faction.id}"]`)).toBeNull();
    // ...but its name is still drawn.
    const names = [...svg.querySelectorAll('text')].map(t => t.textContent);
    expect(names).toContain(summary.name.length > 19 ? `${summary.name.slice(0, 18)}…` : summary.name);
  });

  it('with no router in scope every node falls open to plain text — no role, no stop, no cursor', () => {
    const { svg } = renderSheet(undefined);

    expect(svg.querySelectorAll('[role="link"]').length).toBe(0);
    expect(svg.querySelectorAll('[tabindex]').length).toBe(0);
    expect(svg.querySelectorAll('[data-ref-id]').length).toBe(0);
    const underlined = [...svg.querySelectorAll('text')]
      .filter(t => (t as SVGTextElement).style.textDecoration.includes('underline'));
    expect(underlined.length).toBe(0);

    // The names survive the loss of the route — that is the whole point of the branch.
    const names = [...svg.querySelectorAll('text')].map(t => t.textContent);
    expect(names).toContain(ARMY_NAME);
    expect(names).toContain(summary.members[0].name.length > 19
      ? `${summary.members[0].name.slice(0, 18)}…`
      : summary.members[0].name);
  });
});

describe('FactionSheet network diagram — every node hovers its concept from the registry (THR-1508)', () => {
  it('the six node-kind tooltip ids resolve through resolveTooltip with no context', () => {
    for (const id of TOOLTIP_IDS) {
      expect(tooltipResolves(id), `${id} does not resolve`).toBe(true);
    }
  });

  it('hovering a hall node shows the registry Hall tooltip, not inline copy', () => {
    vi.useFakeTimers();
    const { baseElement, svg } = renderSheet(makeRouter());
    const hall = summary.networkLocations.find(l => l.role === 'hall')!;
    const link = svg.querySelector(`[role="link"][data-ref-id="${hall.id}"]`)!;
    // The `Tooltip` wrapper is the `<g>` around the link group.
    const wrapper = link.parentElement as Element;

    fireEvent.pointerEnter(wrapper);
    act(() => { vi.advanceTimersByTime(TOOLTIP_SHOW_DELAY); });

    const tooltip = baseElement.ownerDocument.querySelector('[role="tooltip"]');
    expect(tooltip).not.toBeNull();
    const expected = resolveTooltip('ui.faction_hall')!;
    expect(tooltip!.textContent).toContain(expected.label);
    expect(tooltip!.textContent).toContain(expected.desc!.slice(0, 20));
  });

  it('hovering the faction core shows the registry Faction Core tooltip even though it is not a link', () => {
    vi.useFakeTimers();
    const { baseElement, svg } = renderSheet(makeRouter());
    // The core's `<g>` is the one with no role whose text is the faction's name.
    const coreText = [...svg.querySelectorAll('text')]
      .find(t => t.textContent === 'Faction core')!;
    const wrapper = coreText.parentElement!.parentElement as Element;

    fireEvent.pointerEnter(wrapper);
    act(() => { vi.advanceTimersByTime(TOOLTIP_SHOW_DELAY); });

    const tooltip = baseElement.ownerDocument.querySelector('[role="tooltip"]');
    expect(tooltip).not.toBeNull();
    expect(tooltip!.textContent).toContain(resolveTooltip('ui.faction_core')!.label);
  });
});
