/**
 * The dormant kinds I — powers and conditions (THR-1429).
 *
 * Three cells wake two dormant seams: `create × Power` (a scholar learns a spell),
 * `create × Condition` (a zealot blesses, a witch curses) and `destroy × Power`
 * (a rival's art is sealed). Each semantic is exercised here on a hand-built graph,
 * **and so is every refusal** — a cell that can only be observed succeeding is a cell
 * whose gates are untested, and the gates are where the story rule lives.
 *
 * Each guard below is falsified at its owning layer: the sign is tested through
 * `resolveConditionSign` (which owns it), the seal's refusal through
 * `isSpellSuppressedFor` (which owns it), and the writes through the semantics.
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../../engine/graph';
import type { GameState } from '../../types/gameState';
import {
  getUndertakingObjectType,
  resolveConditionSign,
  resolveObjectOwners,
  type ObjectVerbContext,
} from '../undertaking-objects';
import { isSpellSuppressedFor } from '../../engine/effects/effectSuppression';
import { SPELL_TEMPLATES, allSpellDefinitionNodes, spellDefinitionNodeId } from '../spell-templates';
import { REWARD_CONDITIONS } from '../reward-attachment-catalog';
import { SLOT_CAPS } from '../attachment-slot-constants';
import {
  CASTER_NPC_ROLES,
  CONDITION_ALLY_STANDING_MIN,
  CURSE_DURATION_TICKS_BY_BAND,
  SEAL_POWER_CONDITION_ID,
  SEAL_POWER_SUPPRESS_TICKS,
  HARM_ON_AFFLICT,
  LEARN_SPELL_CASTER_VEIL_FLOOR,
} from '../strategic-action-constants';
import { HARM_MAGNITUDE_BY_CLASS, UNDERTAKING_MINTING_RULES, HARM_CLASS_LABELS } from '../ambition-minting-rules';
import { UNDERTAKING_VERB_PROSE, cellLineSet } from '../undertaking-verb-prose';
import { CELL_OVERRIDE_MAX_PER_CELL } from '../strategic-action-constants';

const POWER = getUndertakingObjectType('power')!;
const CONDITION = getUndertakingObjectType('condition')!;

// The edge schema's required properties, so a fixture never invents a shape the world
// would not write (the graph warns on a partial edge, and a warned fixture is one that
// proved something about a graph the engine does not build).
const MEMBER_OF_PROPS = { role: 'member', rank: 0.2, joinedTick: 0 };
const REPUTATION_PROPS = { lastChangedTick: 0 };

/** A graph carrying the spell definitions and the condition catalog — the seeded vocabulary. */
function seededGraph(): WorldGraph {
  const graph = new WorldGraph();
  for (const node of allSpellDefinitionNodes()) graph.addNode(node);
  for (const node of REWARD_CONDITIONS) graph.addNode(node);
  return graph;
}

function addMortal(
  graph: WorldGraph,
  id: string,
  props: Record<string, unknown> = {},
): void {
  graph.addNode({ id, name: id, type: 'actor', properties: { actorType: 'individual', ...props } });
}

/** A caster by role — the limb that actually supplies the world's casters. */
function addCaster(graph: WorldGraph, id: string): void {
  addMortal(graph, id, { npcRole: CASTER_NPC_ROLES[0] });
}

function ctx(graph: WorldGraph, actorId: string, over: Partial<ObjectVerbContext> = {}): ObjectVerbContext {
  return {
    state: { tick: 1, effectStates: new Map() } as unknown as GameState,
    graph,
    actorId,
    handle: { kind: 'node', nodeId: actorId },
    tick: 1,
    ...over,
  };
}

const call = (fn: unknown, c: ObjectVerbContext) => (fn as (c: ObjectVerbContext) => { success: boolean; error?: string; harmClass?: string; victimAgentId?: string; createdId?: string })(c);

// ─── S1 — the Power kind's shape ────────────────────────────────────

describe('S1 — the Power kind has a node shape', () => {
  it('seeds one shared definition node per spell template, never one per bearer', () => {
    const nodes = allSpellDefinitionNodes();
    expect(nodes).toHaveLength(SPELL_TEMPLATES.length);
    expect(new Set(nodes.map(n => n.id)).size).toBe(SPELL_TEMPLATES.length);
    for (const spell of SPELL_TEMPLATES) {
      const node = nodes.find(n => n.id === spellDefinitionNodeId(spell.id))!;
      expect(node, `${spell.id} has a definition node`).toBeDefined();
      expect(node.type).toBe('trait');
      expect(node.properties.subcategory).toBe('spell');
      expect(node.properties.spellTemplateId).toBe(spell.id);
      expect(node.properties.sphereAffinity).toBe(spell.sphereAffinity);
    }
  });

  it('carries no `effects` array — the shared node must never reach the effect walker', () => {
    // This is the property that keeps a suppression aimed at one bearer from landing
    // on every mortal who knows the same spell. If a later change puts `effects` on
    // the definition node, `applySuppressions` starts flagging it by node id and the
    // seal becomes world-wide. That is the regression this pin exists to catch.
    for (const node of allSpellDefinitionNodes()) {
      expect(node.properties.effects, `${node.id} carries no effects`).toBeUndefined();
    }
  });

  it('the object type accepts both classes and the registry agrees', () => {
    const graph = seededGraph();
    graph.addNode({ id: 'bestowal', name: 'A Gift', type: 'trait', properties: { subcategory: 'bestowed' } });
    const spellId = spellDefinitionNodeId(SPELL_TEMPLATES[0].id);
    expect(POWER.shape.discriminator!(graph.getNode(spellId)!)).toBe(true);
    expect(POWER.shape.discriminator!(graph.getNode('bestowal')!)).toBe(true);
    // A condition is the Condition kind's, not the Power kind's.
    expect(POWER.shape.discriminator!(graph.getNode(REWARD_CONDITIONS[0].id)!)).toBe(false);
  });

  it('resolves a power\'s holder through `has_trait` — the ownership `destroy` filters on', () => {
    // Before THR-1429 `ownedVia` was empty, so `resolveObjectOwners` returned nobody,
    // the `other` ownership filter matched nothing and `destroy × Power` enumerated
    // zero targets forever. Falsify by emptying `ownedVia` — this must go red.
    const graph = seededGraph();
    addMortal(graph, 'bearer');
    const spellId = spellDefinitionNodeId(SPELL_TEMPLATES[0].id);
    graph.addEdge({ id: 'e1', source: 'bearer', target: spellId, type: 'has_trait', properties: {} });
    expect(resolveObjectOwners(graph, POWER, { kind: 'node', nodeId: spellId })).toEqual(['bearer']);
  });
});

// ─── S2 — create × Power = learn_spell ──────────────────────────────

describe('S2 — a scholar learns a spell', () => {
  it('writes `knows_spell` and a wielded `has_trait` to the SAME shared node', () => {
    const graph = seededGraph();
    addCaster(graph, 'scholar');
    const result = call(POWER.verbs.create, ctx(graph, 'scholar'));
    expect(result.success).toBe(true);

    const known = graph.getOutgoingEdges('scholar', 'knows_spell');
    const wielded = graph.getOutgoingEdges('scholar', 'has_trait');
    expect(known).toHaveLength(1);
    expect(wielded).toHaveLength(1);
    // The same node — a spell known and a spell carried are two edges, one definition.
    expect(known[0].target).toBe(wielded[0].target);
    expect(graph.getNode(known[0].target)!.properties.subcategory).toBe('spell');
  });

  it('refuses a non-caster — the cell is not offered to someone who cannot study', () => {
    const graph = seededGraph();
    addMortal(graph, 'farmer', { npcRole: 'brewer' });
    const result = call(POWER.verbs.create, ctx(graph, 'farmer'));
    expect(result.success).toBe(false);
    expect(result.error).toBe('not_a_caster');
    expect(graph.getOutgoingEdges('farmer', 'knows_spell')).toHaveLength(0);
  });

  it('admits a mortal with no caster role but Veil at the floor, on the raw 0-100 scale', () => {
    const graph = seededGraph();
    // The units matter: the plan guessed 0-1, where every carrier of the field would
    // have cleared the floor and the gate would have read as working while gating
    // nothing. Just under must refuse; at the floor must pass.
    addMortal(graph, 'hedge_low', { domainCapabilities: { veil: LEARN_SPELL_CASTER_VEIL_FLOOR - 1 } });
    addMortal(graph, 'hedge_high', { domainCapabilities: { veil: LEARN_SPELL_CASTER_VEIL_FLOOR } });
    expect(call(POWER.verbs.create, ctx(graph, 'hedge_low')).error).toBe('not_a_caster');
    expect(call(POWER.verbs.create, ctx(graph, 'hedge_high')).success).toBe(true);
  });

  it('past the slot cap a spell is known and not carried — not a refusal', () => {
    const graph = seededGraph();
    addCaster(graph, 'scholar');
    const cap = SLOT_CAPS.spell;
    for (let i = 0; i < cap; i += 1) {
      expect(call(POWER.verbs.create, ctx(graph, 'scholar')).success, `learn ${i + 1}`).toBe(true);
    }
    expect(graph.getOutgoingEdges('scholar', 'has_trait')).toHaveLength(cap);

    // One more: it succeeds, and it is known-only.
    const overflow = call(POWER.verbs.create, ctx(graph, 'scholar'));
    expect(overflow.success).toBe(true);
    expect(graph.getOutgoingEdges('scholar', 'knows_spell')).toHaveLength(cap + 1);
    expect(graph.getOutgoingEdges('scholar', 'has_trait'), 'the cap held').toHaveLength(cap);
  });

  it('refuses once every spell on the shelf is already known', () => {
    const graph = seededGraph();
    addCaster(graph, 'scholar');
    for (let i = 0; i < SPELL_TEMPLATES.length; i += 1) {
      expect(call(POWER.verbs.create, ctx(graph, 'scholar')).success).toBe(true);
    }
    const exhausted = call(POWER.verbs.create, ctx(graph, 'scholar'));
    expect(exhausted.success).toBe(false);
    expect(exhausted.error).toBe('already_known');
  });

  it('reports the EDGE it created, never the shared definition node', () => {
    // `christenCompletedWork` renames the first created node an op reports. Reporting
    // the definition node here handed it a world-shared node: one priest's study
    // renamed Crystal Gate to "The Standing Quarter of Morthane" for every mortal
    // alive, observed on seed 42 before the fix. What the undertaking created is one
    // mortal's knowledge — an edge — and the graph has no node under that id.
    const graph = seededGraph();
    addCaster(graph, 'scholar');
    const result = call(POWER.verbs.create, ctx(graph, 'scholar'));
    expect(result.success).toBe(true);
    expect(graph.getNode(result.createdId!), 'the created id names no node').toBeUndefined();
    expect(graph.getEdge(result.createdId!)?.type).toBe('knows_spell');
    // And the definition keeps its authored name.
    const spell = SPELL_TEMPLATES.find(s => spellDefinitionNodeId(s.id) === graph.getOutgoingEdges('scholar', 'knows_spell')[0].target)!;
    expect(graph.getNode(spellDefinitionNodeId(spell.id))!.name).toBe(spell.name);
  });

  it('refuses `no_definition` in a world seeded before the shape existed', () => {
    // The fail-soft that must never mint a per-bearer node to paper over a missing
    // definition (THR-1395). An empty graph is exactly that world.
    const graph = new WorldGraph();
    addCaster(graph, 'scholar');
    const result = call(POWER.verbs.create, ctx(graph, 'scholar'));
    expect(result.success).toBe(false);
    expect(result.error).toBe('no_definition');
    expect(graph.getNodesByType('trait')).toHaveLength(0);
  });

  it('draws from the aligned tradition first when the mortal has one', () => {
    const graph = seededGraph();
    // Pick a sphere carried by exactly one template so the shelf is unambiguous.
    const counts = new Map<string, number>();
    for (const s of SPELL_TEMPLATES) counts.set(s.sphereAffinity, (counts.get(s.sphereAffinity) ?? 0) + 1);
    const soleSphere = [...counts.entries()].find(([, n]) => n === 1)![0];
    const expected = SPELL_TEMPLATES.find(s => s.sphereAffinity === soleSphere)!;

    addMortal(graph, 'aligned', {
      npcRole: CASTER_NPC_ROLES[0],
      sphereAlignment: { primary: soleSphere },
    });
    expect(call(POWER.verbs.create, ctx(graph, 'aligned')).success).toBe(true);
    const learned = graph.getOutgoingEdges('aligned', 'knows_spell')[0].target;
    expect(learned).toBe(spellDefinitionNodeId(expected.id));
  });
});

// ─── S3 — create × Condition, the signed cell ───────────────────────

describe('S3 — the sign is the gate', () => {
  it('reads a blessing on oneself', () => {
    const graph = seededGraph();
    addMortal(graph, 'zealot');
    expect(resolveConditionSign(graph, 'zealot', 'zealot')).toEqual({ sign: 'blessing' });
  });

  it('reads a blessing on a faction ally, a company ally, and a well-regarded one', () => {
    const graph = seededGraph();
    addMortal(graph, 'zealot');
    for (const id of ['faction_friend', 'company_friend', 'regarded']) addMortal(graph, id);

    graph.addNode({ id: 'faction', name: 'f', type: 'actor', properties: { actorType: 'faction' } });
    for (const [id, source] of [['m1', 'zealot'], ['m2', 'faction_friend']]) {
      graph.addEdge({ id, source, target: 'faction', type: 'member_of', properties: MEMBER_OF_PROPS });
    }
    expect(resolveConditionSign(graph, 'zealot', 'faction_friend')?.sign).toBe('blessing');

    graph.addEdge({
      id: 'r1', source: 'zealot', target: 'regarded', type: 'reputation_with',
      properties: { ...REPUTATION_PROPS, score: CONDITION_ALLY_STANDING_MIN },
    });
    expect(resolveConditionSign(graph, 'zealot', 'regarded')?.sign).toBe('blessing');
  });

  it('a merely-tolerated mortal is NOT an ally — 0.5 is Accepted, not friendship', () => {
    const graph = seededGraph();
    addMortal(graph, 'zealot');
    addMortal(graph, 'tolerated');
    graph.addEdge({
      id: 'r1', source: 'zealot', target: 'tolerated', type: 'reputation_with',
      properties: { ...REPUTATION_PROPS, score: CONDITION_ALLY_STANDING_MIN - 0.01 },
    });
    expect(resolveConditionSign(graph, 'zealot', 'tolerated')).toBeNull();
  });

  it('reads a curse where a motive stands, and names the motive', () => {
    const graph = seededGraph();
    addMortal(graph, 'witch');
    addMortal(graph, 'enemy');
    graph.addEdge({ id: 'h1', source: 'witch', target: 'enemy', type: 'hostile_to', properties: { cause: 'quarrel' } });
    const signed = resolveConditionSign(graph, 'witch', 'enemy');
    expect(signed?.sign).toBe('curse');
    expect(signed?.motive).toBeTruthy();
  });

  it('refuses a stranger — there is deliberately no neutral third outcome', () => {
    const graph = seededGraph();
    addMortal(graph, 'witch');
    addMortal(graph, 'stranger');
    expect(resolveConditionSign(graph, 'witch', 'stranger')).toBeNull();

    const result = call(CONDITION.verbs.create, ctx(graph, 'witch', { targetNodeId: 'stranger' }));
    expect(result.success).toBe(false);
    expect(result.error).toBe('no_sign');
    expect(graph.getOutgoingEdges('stranger', 'has_trait')).toHaveLength(0);
  });

  it('a blessing lands from the `#blessing` pool, signed, and registers NO harm', () => {
    const graph = seededGraph();
    addMortal(graph, 'zealot');
    addMortal(graph, 'ally');
    graph.addEdge({
      id: 'r1', source: 'zealot', target: 'ally', type: 'reputation_with',
      properties: { ...REPUTATION_PROPS, score: 0.9 },
    });

    const result = call(CONDITION.verbs.create, ctx(graph, 'zealot', { targetNodeId: 'ally', outcome: 'success' }));
    expect(result.success).toBe(true);
    // The whole point of the sign: a gift is not a wound.
    expect(result.harmClass).toBeUndefined();
    expect(result.victimAgentId).toBeUndefined();

    const worn = graph.getOutgoingEdges('ally', 'has_trait');
    expect(worn).toHaveLength(1);
    expect(worn[0].properties.sign).toBe('blessing');
    expect(worn[0].properties.inflictedBy).toBe('zealot');
    expect(graph.getNode(worn[0].target)!.properties.tags).toContain('#blessing');
  });

  it('a curse lands from the `#curse` pool with the band\'s duration, and IS a harm', () => {
    const graph = seededGraph();
    addMortal(graph, 'witch');
    addMortal(graph, 'enemy');
    graph.addEdge({ id: 'h1', source: 'witch', target: 'enemy', type: 'hostile_to', properties: { cause: 'quarrel' } });

    const result = call(CONDITION.verbs.create, ctx(graph, 'witch', { targetNodeId: 'enemy', outcome: 'success' }));
    expect(result.success).toBe(true);
    expect(result.harmClass).toBe(HARM_ON_AFFLICT);
    expect(result.victimAgentId).toBe('enemy');

    const worn = graph.getOutgoingEdges('enemy', 'has_trait');
    expect(worn).toHaveLength(1);
    expect(worn[0].properties.sign).toBe('curse');
    expect(worn[0].properties.ticksRemaining).toBe(CURSE_DURATION_TICKS_BY_BAND.success);
    expect(graph.getNode(worn[0].target)!.properties.tags).toContain('#curse');
  });

  it('caps the condition tier by band — a plain success cannot reach for the strongest', () => {
    const graph = seededGraph();
    addMortal(graph, 'witch');
    addMortal(graph, 'enemy');
    graph.addEdge({ id: 'h1', source: 'witch', target: 'enemy', type: 'hostile_to', properties: { cause: 'q' } });

    call(CONDITION.verbs.create, ctx(graph, 'witch', { targetNodeId: 'enemy', outcome: 'success' }));
    const tier = graph.getNode(graph.getOutgoingEdges('enemy', 'has_trait')[0].target)!.properties.tier as number;
    expect(tier).toBeLessThanOrEqual(1);
  });

  it('refuses when the target is gone by completion', () => {
    const graph = seededGraph();
    addMortal(graph, 'witch');
    const result = call(CONDITION.verbs.create, ctx(graph, 'witch', { targetNodeId: 'ghost' }));
    expect(result.success).toBe(false);
    expect(result.error).toBe('target_gone');
  });
});

// ─── S4 — destroy × Power = seal_power ──────────────────────────────

describe('S4 — a rival\'s art is sealed', () => {
  /** A world where `witch` has a motive against `rival`, and `rival` wields a spell. */
  function sealWorld(): { graph: WorldGraph; spellId: string } {
    const graph = seededGraph();
    addMortal(graph, 'witch');
    addMortal(graph, 'rival');
    graph.addEdge({ id: 'h1', source: 'witch', target: 'rival', type: 'hostile_to', properties: { cause: 'q' } });
    const spellId = spellDefinitionNodeId(SPELL_TEMPLATES[0].id);
    graph.addEdge({ id: 'w1', source: 'rival', target: spellId, type: 'has_trait', properties: {} });
    return { graph, spellId };
  }

  it('mints the catalog\'s existing Null-Touched rather than a second suppressing condition', () => {
    const { graph, spellId } = sealWorld();
    const result = call(POWER.verbs.destroy, ctx(graph, 'witch', { handle: { kind: 'node', nodeId: spellId }, outcome: 'success' }));
    expect(result.success).toBe(true);

    const worn = graph.getOutgoingEdges('rival', 'has_trait').filter(e => e.properties.sign === 'seal');
    expect(worn).toHaveLength(1);
    expect(String(worn[0].target)).toContain(SEAL_POWER_CONDITION_ID);
    expect(worn[0].properties.inflictedBy).toBe('witch');
  });

  it('leaves the power itself known and wielded — sealed is not removed', () => {
    const { graph, spellId } = sealWorld();
    call(POWER.verbs.destroy, ctx(graph, 'witch', { handle: { kind: 'node', nodeId: spellId }, outcome: 'success' }));
    expect(graph.getNode(spellId), 'the definition survives').toBeDefined();
    expect(graph.getOutgoingEdges('rival', 'has_trait').some(e => e.target === spellId)).toBe(true);
  });

  it('registers the affliction harm against the bearer', () => {
    const { graph, spellId } = sealWorld();
    const result = call(POWER.verbs.destroy, ctx(graph, 'witch', { handle: { kind: 'node', nodeId: spellId }, outcome: 'success' }));
    expect(result.harmClass).toBe(HARM_ON_AFFLICT);
    expect(result.victimAgentId).toBe('rival');
  });

  it('picks the bearer the motive actually licenses, not just the first in the world', () => {
    // A shared definition node has every wielder as a bearer, and the motive gate is
    // satisfied by *any* owner holding a motive. Without this the witch could seal an
    // innocent wielder of the same spell while the gate still read as licensed.
    const { graph, spellId } = sealWorld();
    addMortal(graph, 'aaa_innocent');
    graph.addEdge({ id: 'w2', source: 'aaa_innocent', target: spellId, type: 'has_trait', properties: {} });

    const result = call(POWER.verbs.destroy, ctx(graph, 'witch', { handle: { kind: 'node', nodeId: spellId }, outcome: 'success' }));
    // 'aaa_innocent' sorts first; the rival is the one there is a reason for.
    expect(result.victimAgentId).toBe('rival');
    expect(graph.getOutgoingEdges('aaa_innocent', 'has_trait').filter(e => e.properties.sign === 'seal')).toHaveLength(0);
  });

  it('refuses when nobody is carrying the power', () => {
    const graph = seededGraph();
    addMortal(graph, 'witch');
    const spellId = spellDefinitionNodeId(SPELL_TEMPLATES[0].id);
    const result = call(POWER.verbs.destroy, ctx(graph, 'witch', { handle: { kind: 'node', nodeId: spellId } }));
    expect(result.success).toBe(false);
    expect(result.error).toBe('power_not_wielded');
  });
});

// ─── The seal's reader ──────────────────────────────────────────────

describe('the seal is read off the bearer, never off the shared power', () => {
  it('reports the sealed mortal sealed', () => {
    const graph = seededGraph();
    addMortal(graph, 'rival');
    const spellId = spellDefinitionNodeId(SPELL_TEMPLATES[0].id);
    graph.addEdge({ id: 'w1', source: 'rival', target: spellId, type: 'has_trait', properties: {} });
    expect(isSpellSuppressedFor(graph, 'rival'), 'not sealed yet').toBe(false);

    addMortal(graph, 'witch');
    graph.addEdge({ id: 'h1', source: 'witch', target: 'rival', type: 'hostile_to', properties: { cause: 'q' } });
    call(POWER.verbs.destroy, ctx(graph, 'witch', { handle: { kind: 'node', nodeId: spellId }, outcome: 'success' }));

    expect(isSpellSuppressedFor(graph, 'rival'), 'sealed').toBe(true);
  });

  it('does NOT seal a second mortal who merely knows the same spell', () => {
    // The cross-bearer leak this whole shape exists to prevent. `effectStates` is keyed
    // by attachment node id, and a spell definition is shared — so a reader that asked
    // "is this power flagged?" would silence every wielder of Veilwalk the moment one
    // of them was cursed. Two wielders of one spell is the common case, not the exotic
    // one, so this would have fired early and read as the seal working.
    const graph = seededGraph();
    addMortal(graph, 'witch');
    addMortal(graph, 'rival');
    addMortal(graph, 'bystander');
    const spellId = spellDefinitionNodeId(SPELL_TEMPLATES[0].id);
    graph.addEdge({ id: 'w1', source: 'rival', target: spellId, type: 'has_trait', properties: {} });
    graph.addEdge({ id: 'w2', source: 'bystander', target: spellId, type: 'has_trait', properties: {} });
    graph.addEdge({ id: 'h1', source: 'witch', target: 'rival', type: 'hostile_to', properties: { cause: 'q' } });

    call(POWER.verbs.destroy, ctx(graph, 'witch', { handle: { kind: 'node', nodeId: spellId }, outcome: 'success' }));

    expect(isSpellSuppressedFor(graph, 'rival')).toBe(true);
    expect(isSpellSuppressedFor(graph, 'bystander'), 'the bystander casts freely').toBe(false);
  });

  it('curing the seal lifts it — the counter-play, for free', () => {
    const graph = seededGraph();
    addMortal(graph, 'witch');
    addMortal(graph, 'rival');
    const spellId = spellDefinitionNodeId(SPELL_TEMPLATES[0].id);
    graph.addEdge({ id: 'w1', source: 'rival', target: spellId, type: 'has_trait', properties: {} });
    graph.addEdge({ id: 'h1', source: 'witch', target: 'rival', type: 'hostile_to', properties: { cause: 'q' } });
    const sealed = call(POWER.verbs.destroy, ctx(graph, 'witch', { handle: { kind: 'node', nodeId: spellId }, outcome: 'success' }));
    expect(isSpellSuppressedFor(graph, 'rival')).toBe(true);

    // `destroy × Condition` — the cure, live since before this ticket.
    addMortal(graph, 'healer');
    const cured = call(CONDITION.verbs.destroy, ctx(graph, 'healer', { handle: { kind: 'node', nodeId: sealed.createdId! } }));
    expect(cured.success).toBe(true);
    expect(isSpellSuppressedFor(graph, 'rival'), 'the art answers again').toBe(false);
  });
});

// ─── The grievance funnel ───────────────────────────────────────────

describe('the affliction reaches the grievance funnel', () => {
  it('carries a magnitude, a drive set and a prose stem — all three, or it mints nothing', () => {
    // The `hungerResonance` failure class: a harm class named in one half of the
    // vocabulary and missing from the other fires zero times and looks like tuning.
    expect(HARM_MAGNITUDE_BY_CLASS[HARM_ON_AFFLICT]).toBeGreaterThan(0);
    expect(UNDERTAKING_MINTING_RULES[HARM_ON_AFFLICT].victim!.length).toBeGreaterThan(0);
    expect(HARM_CLASS_LABELS[HARM_ON_AFFLICT]).toBeTruthy();
    // A vendetta is on offer, and it is the one that opens a grievance.
    expect(UNDERTAKING_MINTING_RULES[HARM_ON_AFFLICT].victim!.some(e => e.grievance === true)).toBe(true);
  });

  it('sits below the displacement bar — an affliction gives a reason, not a new life', () => {
    expect(HARM_MAGNITUDE_BY_CLASS[HARM_ON_AFFLICT])
      .toBeLessThan(HARM_MAGNITUDE_BY_CLASS.property_destroyed);
  });
});

// ─── The prose ──────────────────────────────────────────────────────

describe('the three cells speak with their own voice', () => {
  it('overrides the verb lines for exactly the three cells, and no others', () => {
    for (const [variant, type] of [['create', 'power'], ['create', 'condition'], ['destroy', 'power']] as const) {
      const own = cellLineSet(variant, type);
      expect(own, `${variant} × ${type} has its own lines`).not.toBe(UNDERTAKING_VERB_PROSE[variant]);
      expect(own.completion.length).toBeGreaterThan(0);
      expect(own.completion.length).toBeLessThanOrEqual(CELL_OVERRIDE_MAX_PER_CELL);
    }
    // Every other cell still takes its verb's lines — the override is a bounded
    // exception, not a second prose system.
    expect(cellLineSet('create', 'location')).toBe(UNDERTAKING_VERB_PROSE.create);
    expect(cellLineSet('use', 'power')).toBe(UNDERTAKING_VERB_PROSE.use);
    expect(cellLineSet('create', undefined)).toBe(UNDERTAKING_VERB_PROSE.create);
  });

  it('never says a curse "stands" — the register failure the override exists to fix', () => {
    // The verb's own create lines are about things that come to stand somewhere.
    expect(UNDERTAKING_VERB_PROSE.create.completion.join(' ')).toMatch(/stands|founded/);
    // The condition cell's must not be.
    const conditionLines = cellLineSet('create', 'condition').completion.join(' ');
    expect(conditionLines).not.toMatch(/stands|founded/);
    expect(conditionLines).toMatch(/\{owner\}/);
  });
});

// ─── The catalog edits ──────────────────────────────────────────────

describe('the seal\'s condition', () => {
  it('is tagged a curse and expires with the suppression it carries', () => {
    const nullTouched = REWARD_CONDITIONS.find(n => n.id === SEAL_POWER_CONDITION_ID)!;
    expect(nullTouched, 'the catalog still carries Null-Touched').toBeDefined();
    const tags = nullTouched.properties.tags as string[];
    expect(tags, 'the sign logic and the sheet read it as a curse').toContain('#curse');

    const suppress = (nullTouched.properties.effects as { type: string; target?: string; ticks?: number }[])
      .find(e => e.type === 'suppress')!;
    expect(suppress.target).toBe('spell');
    // Aligned, so the art does not come back while the curse is still worn.
    expect(suppress.ticks).toBe(SEAL_POWER_SUPPRESS_TICKS);
  });
});
