// @vitest-environment jsdom
/**
 * A run-founded faction resolves its own definition — THR-1322.
 *
 * `strategic_found_order` charters real orders mid-run (THR-1309) and records their
 * definitions in `GameState.dynamicFactionDefinitions`. Until this ticket the UI
 * could not see any of them: `data/faction-definition-lookup.ts` built its map once
 * at module eval from the authored tables, so every render-side caller — the faction
 * sheet, the sigil registry, the hex map's coat-of-arms roster, every `faction.*`
 * tooltip — resolved a founded id to `null` and drew a nameless, heraldry-less
 * fallback. Nothing threw, so nothing reported it.
 *
 * ─── Why every assertion here is built on a minted id ────────────────────────
 *
 * The trap the ticket names: an assertion written against a *fixture* definition id
 * passes today, because fixtures use seeded ids that resolve through the static map.
 * It would verify the code path that was already correct and report success. So the
 * subject of every test below is an id produced by a real `foundFaction` call —
 * `founded_<actor>_<tick>` — which exists in no authored table by construction, and
 * each block carries its own **controlled arm** proving the id is unresolvable when
 * the run has not chartered it.
 *
 * **Browser-verify substitution: jsdom-render — unattended run, no startable dev
 * server** (impediments #546, #574; CLAUDE.md § Definition of Done → Browser-verify).
 * `preview_start` is refused in a scheduled run, which shuts the Playwright route too
 * since it presumes a running server. The FactionSheet block below renders the real
 * component and asserts both faces: the founded order's own motto, description and
 * rank ladder present, and — with the run's charter withheld — absent.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FactionSheet } from '../FactionSheet';
import { WorldGraph } from '../../../engine/graph';
import { foundFaction } from '../../../engine/strategicGraphOps';
import {
  getFactionDefinition as lookupDefinition,
  getFactionDefinitionRoster,
  clearDynamicFactionDefinitions,
  publishDynamicFactionDefinitions,
  dynamicFactionDefinitionCount,
  ALL_FACTION_DEFINITIONS,
} from '../../../data/faction-definition-lookup';
import {
  getFactionDefinition as networkDefinition,
  getFactionDefinitionForNode,
} from '../../../engine/factionNetwork';
import { getFactionSigilUrl } from '../../../data/faction-sigil-assets';
import { resolveTooltip } from '../../../engine/tooltipResolver';
import type { GameState } from '../../../types/gameState';
import type { StrategicFactionSeed } from '../../../types/strategicAction';

// ─── Fixtures ────────────────────────────────────────────────────────────────

const COMMANDER = 'actor_commander';
const HOLD = 'loc_hold';
const FOUND_TICK = 5;
/** What `foundFaction` will mint — deterministic by founder and tick. */
const FOUNDED_ID = `founded_${COMMANDER}_${FOUND_TICK}`;

const ORDER_NAME = 'Order of the Held Thread';
const MOTTO = 'The thread holds where the hand does not.';
const DESCRIPTION = 'An order chartered in the run, not shipped with the game.';

const SEED: StrategicFactionSeed = {
  factionType: 'guild',
  nameTemplate: ORDER_NAME,
  description: DESCRIPTION,
  motto: MOTTO,
  iconGlyph: '⚜',
  themeColor: '#B8A56A',
  locationTypes: ['town', 'city', 'capital'],
  joinEncounterTemplateId: 'ag.join',
  promotionEncounterTemplateId: 'ag.promotion',
  questTemplateIds: ['ag.quest.escort_caravan'],
  socialTemplateIds: ['ag.social.tavern_tales'],
};

function world(): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({
    id: HOLD, name: 'Coldwater', type: 'location',
    properties: { locationSubtype: 'town', locationType: 'town', hexCol: 4, hexRow: 4, prosperity: 30 },
  } as never);
  for (const id of [COMMANDER, 'actor_a', 'actor_b']) {
    graph.addNode({ id, name: id, type: 'actor', properties: { actorType: 'individual' } } as never);
    graph.addEdge({ id: `e_loc_${id}`, source: id, target: HOLD, type: 'located_at', properties: {} } as never);
  }
  return graph;
}

function makeState(graph: WorldGraph): GameState {
  return {
    tick: 1, cycle: 0, seed: 42, graph, phase: 'playing',
    cosmology: { reachDomains: [], spheres: [] },
    tiles: [], clock: { dayOfCycle: 0, ticksOfDay: 0 },
    ascendantId: 'asc_1', essencePool: {},
    mandateDefinition: null, mandateState: null,
    rivalDefinitions: [], rivalStates: [],
    doomDefinition: {} as GameState['doomDefinition'],
    doomClock: {} as GameState['doomClock'],
    tickEvents: [],
  } as unknown as GameState;
}

/** Charter the order and hand back the state plus the minted faction node id. */
function charter(): { state: GameState; factionId: string } {
  const state = makeState(world());
  const result = foundFaction(state, COMMANDER, HOLD, SEED, { heart: 0.5 }, ORDER_NAME, FOUND_TICK);
  expect(result.success).toBe(true);
  // The premise of every test below: the id exists in the run's map and nowhere else.
  expect(state.dynamicFactionDefinitions?.[FOUNDED_ID]).toBeDefined();
  expect(ALL_FACTION_DEFINITIONS.has(FOUNDED_ID)).toBe(false);
  return { state, factionId: result.createdId! };
}

beforeEach(() => {
  // Session boundary. Without it a prior test's charter leaks into the next one's
  // controlled arm and the arm passes for the wrong reason.
  clearDynamicFactionDefinitions();
});

// ─── The two lookups ─────────────────────────────────────────────────────────

describe('THR-1322 — the two faction-definition lookups agree on a founded order', () => {
  it('is unresolvable in both lookups before the run charters it', () => {
    // The controlled arm. Every assertion in this file is an id-resolution check, and
    // an id-resolution check is worthless without proof the id was unresolvable first.
    expect(lookupDefinition(FOUNDED_ID)).toBeNull();
    expect(networkDefinition(FOUNDED_ID)).toBeUndefined();
    expect(dynamicFactionDefinitionCount()).toBe(0);
  });

  it('resolves in both lookups once chartered, to the same definition', () => {
    charter();

    const fromData = lookupDefinition(FOUNDED_ID);
    const fromEngine = networkDefinition(FOUNDED_ID);

    expect(fromData).not.toBeNull();
    // The drift `faction-definition-lookup.ts` exists to prevent: before this ticket
    // the engine lookup resolved a founded id and the UI lookup did not, one function
    // apart, over the same key space.
    expect(fromEngine).toBe(fromData);
    expect(fromData!.motto).toBe(MOTTO);
    expect(fromData!.rankTiers.length).toBeGreaterThan(0);
  });

  it('resolves the founded order from its own graph node, which is what the sheet reads', () => {
    const { state, factionId } = charter();
    const node = state.graph.getNode(factionId)!;
    expect(node.properties.factionDefId).toBe(FOUNDED_ID);

    // `getFactionDefinitionForNode` read the static table directly and returned null
    // here for every founded order — the single call that made
    // `getFactionNetworkSummary` hand the faction sheet a definition-less summary.
    expect(getFactionDefinitionForNode(node)?.id).toBe(FOUNDED_ID);
  });

  it('still prefers an authored definition, so a run cannot shadow shipped content', () => {
    const authoredId = [...ALL_FACTION_DEFINITIONS.keys()][0];
    charter();
    expect(lookupDefinition(authoredId)).toBe(ALL_FACTION_DEFINITIONS.get(authoredId));
  });

  it('lets a caller holding GameState pass the map explicitly rather than trust the mirror', () => {
    const { state } = charter();
    clearDynamicFactionDefinitions();
    // Mirror empty — the context-free path is now correctly dead...
    expect(lookupDefinition(FOUNDED_ID)).toBeNull();
    // ...and the explicit map still resolves, which is the contract `factionNetwork`
    // has always advertised.
    expect(lookupDefinition(FOUNDED_ID, state.dynamicFactionDefinitions)?.id).toBe(FOUNDED_ID);
  });
});

// ─── Lifetime: the mirror is a projection of state, never an authority ───────

describe('THR-1322 — the overlay tracks the state field it mirrors', () => {
  it('leaves nothing behind when a hall-less charter rolls back', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: COMMANDER, name: 'C', type: 'actor', properties: { actorType: 'individual' } } as never);
    graph.addNode({
      id: HOLD, name: 'Wastes', type: 'location',
      properties: { locationSubtype: 'ruins', locationType: 'ruins', hexCol: 1, hexRow: 1 },
    } as never);
    const state = makeState(graph);

    const result = foundFaction(state, COMMANDER, HOLD, SEED, { heart: 0.5 }, ORDER_NAME, FOUND_TICK);
    expect(result.success).toBe(false);
    // State rolls the entry back; the mirror must roll back with it, or the faction
    // layer reads a definition for an order that never stood up.
    expect(Object.keys(state.dynamicFactionDefinitions ?? {})).toHaveLength(0);
    expect(lookupDefinition(FOUNDED_ID)).toBeNull();
  });

  it('republishes wholesale from a state that already carries founded definitions', () => {
    const { state } = charter();
    clearDynamicFactionDefinitions();
    expect(lookupDefinition(FOUNDED_ID)).toBeNull();

    publishDynamicFactionDefinitions(state.dynamicFactionDefinitions);
    expect(lookupDefinition(FOUNDED_ID)?.id).toBe(FOUNDED_ID);
  });

  it('drops a previous run’s orders when a new world publishes none', () => {
    charter();
    expect(dynamicFactionDefinitionCount()).toBe(1);
    publishDynamicFactionDefinitions(undefined);
    expect(lookupDefinition(FOUNDED_ID)).toBeNull();
  });
});

// ─── The render-side consumers that hold no GameState ────────────────────────

describe('THR-1322 — the context-free consumers reach the founded order', () => {
  it('puts the founded order in the roster the hex map pre-warms textures from', () => {
    // ArmyLayer enumerates rather than looks up, inside a Three.js scene build with no
    // state in hand. Enumerating the authored tables left a founded order's host
    // drawing the plain fallback dot for the rest of the run.
    expect(getFactionDefinitionRoster().has(FOUNDED_ID)).toBe(false);
    charter();
    const roster = getFactionDefinitionRoster();
    expect(roster.has(FOUNDED_ID)).toBe(true);
    expect(roster.size).toBe(ALL_FACTION_DEFINITIONS.size + 1);
  });

  it('gives the founded order a live tooltip instead of a dead hover (Law 17)', () => {
    // `Tooltip` calls `resolveTooltip(id)` with no context by design — the `faction.*`
    // branch says so in its own comment. That is the clearest case for why a parameter
    // could not have closed this gap: every founded order was a dead hover.
    expect(resolveTooltip(`faction.${FOUNDED_ID}`)).toBeNull();
    charter();
    const tip = resolveTooltip(`faction.${FOUNDED_ID}`);
    expect(tip).not.toBeNull();
    expect(tip!.desc).toContain(MOTTO);
  });

  it('builds a sigil for the founded order even after a pre-charter miss was asked for', () => {
    // The negative-cache regression: the sheet asks for a sigil before the order is
    // chartered, gets null, and a cached null would pin that order to a blank shield
    // for the rest of the session.
    expect(getFactionSigilUrl(FOUNDED_ID)).toBeNull();
    charter();
    const uri = getFactionSigilUrl(FOUNDED_ID);
    expect(uri).not.toBeNull();
    expect(uri).toMatch(/^data:image\/svg\+xml/);
  });
});

// ─── The surface as composed (browser-verify substitution) ───────────────────

describe('THR-1322 — FactionSheet renders a run-founded order as itself', () => {
  it('shows the founded order’s own description, motto and rank ladder', () => {
    const { state, factionId } = charter();
    render(
      <FactionSheet factionId={factionId} name={ORDER_NAME}
        graph={state.graph} onClose={() => {}} />,
    );

    expect(screen.getByText(DESCRIPTION)).toBeInTheDocument();
    expect(screen.getByText(`“${MOTTO}”`)).toBeInTheDocument();
    // The rank ladder is the definition-only half of the sheet — a definition-less
    // faction renders no Ranks table at all.
    expect(screen.getByText('Ranks')).toBeInTheDocument();
  });

  it('renders none of it when the run has not chartered the order', () => {
    // The absence face. Same node, same sheet, mirror withheld — which is exactly the
    // degraded render every founded order got before this ticket.
    const { state, factionId } = charter();
    clearDynamicFactionDefinitions();

    render(
      <FactionSheet factionId={factionId} name={ORDER_NAME}
        graph={state.graph} onClose={() => {}} />,
    );

    expect(screen.queryByText(DESCRIPTION)).toBeNull();
    expect(screen.queryByText(`“${MOTTO}”`)).toBeNull();
    expect(screen.queryByText('Ranks')).toBeNull();
    // Not a crash and not an empty modal — the fallback the ticket calls "present,
    // nameless, and silently degraded". Read off `document.body`, not the render
    // container: `Modal` portals, so the container is empty either way and a
    // `toContain` on it would pass for the wrong reason in the arm above.
    expect(document.body.textContent).toContain(ORDER_NAME);
  });
});
