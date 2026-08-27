/**
 * The remote-anchor gate at candidate generation — THR-1296 §6, slice 5.
 *
 * `remoteAnchor.test.ts` proves the rule; this file proves it is *wired into the
 * decision*, which is a different claim and the one that fails silently. Two things
 * need showing and they pull in opposite directions:
 *
 * 1. **It is inert today.** No shipped template declares `remote`, so the gate must
 *    refuse nothing — the emptiness pin, which fails deliberately the moment doc 2
 *    ([THR-1297](https://linear.app/threadbare/issue/THR-1297)) authors the first row.
 * 2. **It is wired.** An emptiness pin alone passes just as well against a gate that
 *    is never called. So the wiring arm flips `remote` on one real registered template
 *    and asserts the *same fixture's* verdict moves, restoring the flag afterwards.
 *
 * Arm 2 is why the gate's scope half exists at all. Shipped gating on distance alone
 * (§6 as written), it took `trades_with` formation in the 120-tick seeded smoke to
 * **zero** and seven unrelated doom-identity milestone tests down with it — 8 failures
 * across 2 files, none of them this plan's subsystems (impediment #842). Remoteness is
 * a property of the verb; walking a long way is travel.
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import {
  generateStrategicCandidates,
  getStrategicTemplate,
  getAllStrategicTemplates,
} from '../strategicActionCandidates';
import { mulberry32 } from '../../lib/prng';

const FAR = { col: 30, row: 5 };
const GUILD = 'strategic_found_guild_chapter';

/**
 * A merchant at a market, and exactly one town — far away.
 *
 * The guild-chapter template targets `town`/`city` only, so that town is its sole
 * target and the gate is on the path by construction. This matters: candidates are
 * capped per template, so a far target sitting behind two near ones is never evaluated
 * and the gate reads as passing while never having run.
 */
function farOnlyGraph(): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({
    id: 'actor_merchant', name: 'Merchant Kael', type: 'actor',
    properties: {
      actorType: 'individual', spotlightTier: 'spotlight',
      domainCapabilities: {
        gold: 0.9, eye: 0.9, heart: 0.9, shadow: 0.9,
        iron: 0.9, stone: 0.9, star: 0.9, veil: 0.9,
      },
    },
  });
  graph.addNode({
    id: 'loc_market', name: 'The Grand Market', type: 'location',
    properties: { locationSubtype: 'market', hexCol: 5, hexRow: 5 },
  });
  graph.addNode({
    id: 'loc_far_town', name: 'Farhold', type: 'location',
    properties: { locationSubtype: 'town', hexCol: FAR.col, hexRow: FAR.row },
  });
  graph.addEdge({
    id: 'located_merchant', source: 'actor_merchant', target: 'loc_market',
    type: 'located_at', properties: {},
  });
  graph.addNode({
    id: 'ambition_node', name: 'Dominate Regional Trade', type: 'event',
    properties: { templateId: 'ambition_dominate_trade' },
  });
  graph.addEdge({
    id: 'pursues_merchant_trade', source: 'actor_merchant', target: 'ambition_node',
    type: 'pursues',
    properties: { status: 'active', priority: 'primary', assignedTick: 1 },
  });
  return graph;
}

function commandArmyAt(
  graph: WorldGraph,
  hex: { col: number; row: number },
  commander = 'actor_merchant',
): void {
  graph.addNode({
    id: 'loc_camp', name: 'Camp', type: 'location',
    properties: { hexCol: hex.col, hexRow: hex.row },
  });
  graph.addNode({
    id: 'army_guard', name: 'Caravan Guard', type: 'actor',
    properties: { actorType: 'group', armyState: { size: 'warband', headcount: 40 } },
  });
  graph.addEdge({
    id: 'e_army_at', source: 'army_guard', target: 'loc_camp',
    type: 'located_at', properties: {},
  });
  // commanded_by runs army → commander.
  graph.addEdge({
    id: 'e_army_cmd', source: 'army_guard', target: commander,
    type: 'commanded_by', properties: {},
  });
}

function run(graph: WorldGraph) {
  return generateStrategicCandidates(
    graph, 'actor_merchant', ['ambition_dominate_trade'], undefined, 10, mulberry32(42),
  );
}

/**
 * Flip `remote` on one registered template for the duration of `body`.
 *
 * The registry is built from the shipped packs at module load, so this mutates the
 * live object and restores it in a `finally`. That is deliberate: the field is data,
 * and the only honest way to prove `generateStrategicCandidates` *reads* it is to
 * change it and watch the answer move.
 */
function withRemoteTemplate(templateId: string, body: () => void): void {
  const tpl = getStrategicTemplate(templateId) as { remote?: boolean } | undefined;
  expect(tpl).toBeDefined();
  const had = Object.prototype.hasOwnProperty.call(tpl!, 'remote');
  const prior = tpl!.remote;
  tpl!.remote = true;
  try {
    body();
  } finally {
    if (had) tpl!.remote = prior;
    else delete tpl!.remote;
  }
}

describe('remote-anchor gate — inert today', () => {
  it('refuses nothing, because no shipped template declares `remote`', () => {
    const result = run(farOnlyGraph());

    expect(result.rejections.some(r => r.reason.startsWith('no_remote_anchor'))).toBe(false);
    // And the distant town is genuinely offered — the behaviour the scope half exists
    // to preserve. This is the assertion that would have caught impediment #842.
    expect(result.candidates.some(c => c.targetNodeId === 'loc_far_town')).toBe(true);
  });

  it('no shipped strategic template declares `remote` — the emptiness pin', () => {
    // Fails deliberately when doc 2 authors the first row, which is the point: the
    // seam gets proven by the authoring rather than assumed by it.
    expect(getAllStrategicTemplates().filter(t => t.remote === true).map(t => t.id)).toEqual([]);
  });
});

describe('remote-anchor gate — wired', () => {
  it('refuses the distant target once the verb is declared remote, and says why', () => {
    withRemoteTemplate(GUILD, () => {
      const result = run(farOnlyGraph());

      expect(result.candidates.some(c => c.targetNodeId === 'loc_far_town')).toBe(false);
      expect(result.rejections).toContainEqual({
        templateId: GUILD, reason: 'no_remote_anchor:loc_far_town',
      });
    });
  });

  it('admits the SAME remote target once a commanded army stands at it — the flip', () => {
    withRemoteTemplate(GUILD, () => {
      const graph = farOnlyGraph();
      commandArmyAt(graph, FAR);
      const result = run(graph);

      const admitted = result.candidates.filter(c => c.targetNodeId === 'loc_far_town');
      expect(admitted.length).toBeGreaterThan(0);
      // The winning anchor rides on the candidate, which is what lets the bind pass
      // bind it as `$anchor` must-persist rather than re-deriving it from a moved world.
      expect(admitted.some(c => c.anchorNodeId === 'army_guard')).toBe(true);
    });
  });

  it('still refuses when the army at the site answers to someone else', () => {
    withRemoteTemplate(GUILD, () => {
      const graph = farOnlyGraph();
      graph.addNode({
        id: 'actor_rival', name: 'Rival', type: 'actor',
        properties: { actorType: 'individual' },
      });
      // Same army, same hex, same edge type — only the commander differs.
      commandArmyAt(graph, FAR, 'actor_rival');

      expect(run(graph).candidates.some(c => c.targetNodeId === 'loc_far_town')).toBe(false);
    });
  });

  it('still refuses when the commanded army is nowhere near the site', () => {
    withRemoteTemplate(GUILD, () => {
      const graph = farOnlyGraph();
      commandArmyAt(graph, { col: 5, row: 5 }); // beside the merchant, not the town

      expect(run(graph).candidates.some(c => c.targetNodeId === 'loc_far_town')).toBe(false);
    });
  });

  it('leaves non-remote templates untouched and anchorless in the same run', () => {
    // Without this arm, a gate that refused every template's distant targets would
    // pass all three refusal tests above.
    withRemoteTemplate(GUILD, () => {
      const others = run(farOnlyGraph()).candidates.filter(c => c.templateId !== GUILD);
      expect(others.length).toBeGreaterThan(0);
      expect(others.every(c => c.anchorNodeId === undefined)).toBe(true);
    });
  });

  it('restores the flag, so no later test inherits a remote verb', () => {
    withRemoteTemplate(GUILD, () => { /* mutate, then restore */ });
    expect(getStrategicTemplate(GUILD)!.remote).toBeUndefined();
  });
});
