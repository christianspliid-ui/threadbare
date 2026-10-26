/**
 * THR-2057 — six small faults from cold playtest round 5. These pin the engine and
 * content halves: the whisper confirmation reads a noun phrase (1), the bond test
 * names and genders The First (2), a God's Will compulsion is "Compelled" with a
 * cause (5), and The Seat names its place before the player presses (6).
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { applyWhisperChoice, applyCompulsionChoice } from '../premonitionActions';
import { getDivineInfluences } from '../interventionEffects';
import { influenceChipNoun, influenceChipHover } from '../castTargetChanges';
import { personalizeBondTest, fillBondLine } from '../bondTestVoice';
import { previewHomeSeat, seedBeatGraph } from '../ascendantBeatSeeding';
import { ASCENDANT_SPINE } from '../../data/ascendant-beat-content';
import { describeWhisperDirection } from '../../data/premonition-content';
import { MEETING_BOND_TEST } from '../../data/meeting-bond-test';
import { SPINE_BEAT_PRESENTATION, fillSpineSeatLine } from '../../data/ascendant-beat-content';
import type { GameState } from '../../types/gameState';
import type { WhisperNudge, CompulsionCandidate } from '../../types/premonition';

const AGENT = 'agent-elara';

function stateWith(graph: WorldGraph): GameState {
  return {
    tick: 40,
    graph,
    essencePool: { veil: 50, force: 50 },
    ascendantId: 'asc-1',
  } as unknown as GameState;
}

function graphWithAgent(): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({ id: AGENT, type: 'actor', name: 'Elara', properties: { actorType: 'individual', gender: 'female' } });
  return graph;
}

describe('item 1 — the whisper says what it draws toward (THR-2057)', () => {
  it('reads a noun phrase, never the button label', () => {
    const nudge: WhisperNudge = {
      category: 'reach_bias',
      targetReach: 'veil' as never,
      essenceCost: 2,
      sphere: 'veil' as never,
      prose: 'The way of Veil calls',
      flavorText: '',
    };
    const result = applyWhisperChoice(stateWith(graphWithAgent()), AGENT, 'Elara', nudge);
    expect(result.message).toBe('Elara is subtly drawn toward the way of Veil');
    expect(result.message).not.toContain('calls');
  });

  it('has a phrase for every category', () => {
    expect(describeWhisperDirection({ category: 'sphere_bias', targetSphere: 'veil' })).toBe('the current of Veil');
    expect(describeWhisperDirection({ category: 'ambition_drift' })).toBe('a different purpose');
    expect(describeWhisperDirection({ category: 'gather_strength' })).toBe('rest');
    expect(describeWhisperDirection({ category: 'gather_courage' })).toBe('greater trials');
  });
});

describe('item 2 — the bond test names The First and keeps her pronouns (THR-2057)', () => {
  const test = personalizeBondTest(MEETING_BOND_TEST, 'Elara', 'female');
  const all = JSON.stringify(test);

  it('leaves no token and no template "they" in what the player reads', () => {
    expect(all).not.toMatch(/\{(name|they|They|them|their|Their|is|s)\}/);
    expect(test.setup).toContain('Elara is alone');
    expect(test.setup).toContain('She stands very still');
    expect(test.receptions.devotion.prose).toBe(
      'Elara straightens up and says yes before you have asked anything. '
      + 'She spends the rest of the night deciding what she will have to give up, and is calm about it.',
    );
    expect(test.nudges.find(n => n.id === 'bond.name_them')?.name).toBe('Say her name');
  });

  it('reads "he" for a man and "they" when the gender is unknown', () => {
    expect(fillBondLine('{name} tells you no. {They} feel{s} it.', 'Bram', 'male')).toBe('Bram tells you no. He feels it.');
    expect(fillBondLine('{name} tells you no. {They} feel{s} it.', 'Ash', undefined)).toBe('Ash tells you no. They feel it.');
  });

  it('never mutates the authored test', () => {
    expect(MEETING_BOND_TEST.setup).toContain('{name}');
  });
});

describe('item 5 — a God\'s Will compulsion is "Compelled", with a cause (THR-2057)', () => {
  it('writes its own kind and the encounter it drives toward', () => {
    const graph = graphWithAgent();
    const candidate = {
      templateId: 'tavern_brawl',
      encounterName: 'the brawl at the Red Stag',
      sphere: 'force',
      reach: 'iron',
      essenceCost: 3,
      locationId: 'loc-1',
      locationName: 'Horseford',
    } as unknown as CompulsionCandidate;
    const result = applyCompulsionChoice(stateWith(graph), AGENT, 'Elara', candidate);
    expect(result.success).toBe(true);
    const entry = getDivineInfluences(graph, AGENT).find(e => e.id === result.influenceId);
    expect(entry?.interventionType).toBe('compel');
    expect(entry?.cause).toBe('the brawl at the Red Stag');
    expect(influenceChipNoun('compel')).toBe('Compelled');
    expect(influenceChipHover(entry!, 'a day')).toBe(
      'Your will drives them toward the brawl at the Red Stag, fading in a day.',
    );
  });
});

describe('item 6 — The Seat names its place before the press (THR-2057)', () => {
  const prose = SPINE_BEAT_PRESENTATION['beat.spine.the_seat'].prose;

  it('no longer offers a choice it never gives', () => {
    expect(prose).not.toContain('Bind a place to yourself');
    expect(fillSpineSeatLine(prose, { placeName: 'Horseford', firstName: 'Elara', seatRule: 'first_settlement' }))
      .toContain('Horseford, where Elara stands, becomes your seat, and the faith');
    expect(fillSpineSeatLine(prose, undefined)).not.toContain('{seatLine}');
  });

  it('previews the settlement the gift will take, without writing it', () => {
    const graph = graphWithAgent();
    graph.addNode({ id: 'asc-1', type: 'actor', name: 'God', properties: {} });
    graph.addNode({ id: 'loc-horseford', type: 'location', name: 'Horseford', properties: { locationSubtype: 'town' } });
    graph.addEdge({ id: 'thr', source: 'asc-1', target: AGENT, type: 'thread', properties: { courtPosition: 'the_first' } });
    graph.addEdge({ id: 'loc', source: AGENT, target: 'loc-horseford', type: 'located_at', properties: {} });
    const edgesBefore = graph.getOutgoingEdges('asc-1', 'controls').length;
    expect(previewHomeSeat(stateWith(graph), 'asc-1')).toEqual({
      placeName: 'Horseford',
      firstName: 'Elara',
      seatRule: 'first_settlement',
    });
    expect(graph.getOutgoingEdges('asc-1', 'controls').length).toBe(edgesBefore);
    expect(previewHomeSeat(stateWith(graph), undefined)).toBeUndefined();
  });

  it("names the same place the gift then seats — preview and seed share one resolver", () => {
    const graph = graphWithAgent();
    graph.addNode({ id: "asc-1", type: "actor", name: "God", properties: {} });
    graph.addNode({ id: "loc-coast", type: "location", name: "The Bone Coast", properties: { locationSubtype: "wilderness", hexCol: 3, hexRow: 3 } });
    graph.addNode({ id: "loc-grove", type: "location", name: "Sacred Grove", properties: { parentLocationId: "loc-coast" } });
    graph.addNode({ id: "loc-horseford", type: "location", name: "Horseford", properties: { locationSubtype: "town", hexCol: 4, hexRow: 3 } });
    graph.addEdge({ id: "thr", source: "asc-1", target: AGENT, type: "thread", properties: { courtPosition: "the_first" } });
    graph.addEdge({ id: "loc", source: AGENT, target: "loc-grove", type: "located_at", properties: {} });
    const state = stateWith(graph);
    const preview = previewHomeSeat(state, "asc-1");
    const seatBeat = ASCENDANT_SPINE.find(b => b.beatId === "beat.spine.the_seat")!;
    const seeded = seedBeatGraph(state, seatBeat, 2);
    expect(seeded.seededNodeIds[0]).toBeDefined();
    expect(preview?.placeName).toBe(graph.getNode(seeded.seededNodeIds[0])?.name);
    expect(preview?.seatRule).toBe(seeded.seatRule);
  });
});
