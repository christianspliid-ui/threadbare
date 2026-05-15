import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import {
  deriveMoodBucket,
  deriveFactionPresenceTier,
  composeSurveyPeopleProse,
  buildSurveyCompletedTickEvent,
  resetSurveyEventCounter,
  rankHexMortals,
  composeNamedMortalsClause,
} from '../surveyProseComposer';
import {
  FACTION_PRESENCE_DOMINANT_MIN,
  FACTION_PRESENCE_ACTIVE_MIN,
  SURVEY_EVENT_SIGNIFICANCE,
  SURVEY_NAMED_MORTALS_CAP,
  SURVEY_NO_NAMED_MORTALS_FALLBACK,
} from '../../data/survey-prose-tables';

// Deterministic RNG using a simple LCG for test reproducibility
function makeLcgRng(seed: number): () => number {
  let s = seed;
  return () => {
    s = (1664525 * s + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0x100000000;
  };
}

const HEX_COL = 5;
const HEX_ROW = 7;

// Add a location to the graph at the test hex
function addLocation(graph: WorldGraph, id: string, unrest?: number): void {
  graph.addNode({
    id,
    type: 'location',
    name: `Location ${id}`,
    properties: {
      locationType: 'location',
      hexCol: HEX_COL,
      hexRow: HEX_ROW,
      ...(unrest !== undefined ? { unrest } : {}),
    },
  });
}

let edgeCounter = 0;

// Add a faction node (as 'actor' type to satisfy graph schema) and a 'controls' edge to a location
function addFactionControl(graph: WorldGraph, factionId: string, factionName: string, locationId: string): void {
  if (!graph.getNode(factionId)) {
    graph.addNode({ id: factionId, type: 'actor', name: factionName, properties: {} });
  }
  graph.addEdge({ id: `edge_ctrl_${++edgeCounter}`, source: factionId, target: locationId, type: 'controls', properties: {} });
}

// Add an individual agent to a location (with optional rarityTier)
function addAgent(
  graph: WorldGraph,
  agentId: string,
  name: string,
  locationId: string,
  rarityTier = 1,
): void {
  graph.addNode({
    id: agentId,
    type: 'actor',
    name,
    properties: { actorType: 'individual', name, rarityTier },
  });
  graph.addEdge({ id: `edge_loc_${++edgeCounter}`, source: agentId, target: locationId, type: 'located_at', properties: {} });
}

// Add a thread (bond) edge from an ascendant to an agent
function addThreadEdge(graph: WorldGraph, ascendantId: string, agentId: string): void {
  if (!graph.getNode(ascendantId)) {
    graph.addNode({ id: ascendantId, type: 'actor', name: 'Ascendant', properties: { actorType: 'ascendant' } });
  }
  graph.addEdge({ id: `edge_thread_${++edgeCounter}`, source: ascendantId, target: agentId, type: 'thread', properties: {} });
}

describe('deriveMoodBucket', () => {
  let graph: WorldGraph;

  beforeEach(() => {
    graph = new WorldGraph();
  });

  it('returns null when hex has no locations', () => {
    expect(deriveMoodBucket(graph, HEX_COL, HEX_ROW)).toBeNull();
  });

  it('returns calm for low unrest (0–30 normalised to 0–0.30)', () => {
    addLocation(graph, 'loc.a', 20); // 20/100 = 0.20 → calm
    expect(deriveMoodBucket(graph, HEX_COL, HEX_ROW)).toBe('calm');
  });

  it('returns restless for mid unrest (31–60 normalised)', () => {
    addLocation(graph, 'loc.a', 45); // 0.45 → restless
    expect(deriveMoodBucket(graph, HEX_COL, HEX_ROW)).toBe('restless');
  });

  it('returns agitated for high unrest (61–85 normalised)', () => {
    addLocation(graph, 'loc.a', 70); // 0.70 → agitated
    expect(deriveMoodBucket(graph, HEX_COL, HEX_ROW)).toBe('agitated');
  });

  it('returns boiling for very high unrest (>85 normalised)', () => {
    addLocation(graph, 'loc.a', 95); // 0.95 → boiling
    expect(deriveMoodBucket(graph, HEX_COL, HEX_ROW)).toBe('boiling');
  });

  it('averages unrest across multiple locations', () => {
    addLocation(graph, 'loc.a', 10);  // 0.10
    addLocation(graph, 'loc.b', 90);  // 0.90 → avg 0.50 → restless
    expect(deriveMoodBucket(graph, HEX_COL, HEX_ROW)).toBe('restless');
  });

  it('treats locations with no unrest property as 0 — calm', () => {
    addLocation(graph, 'loc.a'); // no unrest field
    expect(deriveMoodBucket(graph, HEX_COL, HEX_ROW)).toBe('calm');
  });
});

describe('deriveFactionPresenceTier', () => {
  it('returns dominant at the dominant threshold', () => {
    expect(deriveFactionPresenceTier(FACTION_PRESENCE_DOMINANT_MIN)).toBe('dominant');
  });

  it('returns dominant above the threshold', () => {
    expect(deriveFactionPresenceTier(FACTION_PRESENCE_DOMINANT_MIN + 2)).toBe('dominant');
  });

  it('returns active at the active threshold', () => {
    expect(deriveFactionPresenceTier(FACTION_PRESENCE_ACTIVE_MIN)).toBe('active');
  });

  it('returns minor below active threshold', () => {
    expect(deriveFactionPresenceTier(FACTION_PRESENCE_ACTIVE_MIN - 1)).toBe('minor');
  });

  it('returns minor for 1 location', () => {
    expect(deriveFactionPresenceTier(1)).toBe('minor');
  });
});

describe('composeSurveyPeopleProse', () => {
  let graph: WorldGraph;

  beforeEach(() => {
    graph = new WorldGraph();
    resetSurveyEventCounter();
    edgeCounter = 0;
  });

  it('returns the named-mortals fallback for an empty hex (no locations) — THR-440: never returns empty string', () => {
    const rng = makeLcgRng(42);
    const band = composeSurveyPeopleProse(graph, HEX_COL, HEX_ROW, rng, 1);
    // THR-440: named-mortals fallback fires even on empty hex — band is never empty
    expect(band).toContain('No names rise');
  });

  it('returns mood-only band when no factions clear the threshold', () => {
    addLocation(graph, 'loc.a', 20); // calm
    const rng = makeLcgRng(1);
    const band = composeSurveyPeopleProse(graph, HEX_COL, HEX_ROW, rng, 1);
    expect(band.length).toBeGreaterThan(0);
    // No faction names appear — band should be a single mood sentence
    expect(band).not.toContain('holds sway over');
    expect(band).not.toContain('operates openly');
  });

  it('returns faction-only band when locations have no unrest data', () => {
    addLocation(graph, 'loc.a');
    addLocation(graph, 'loc.b');
    addLocation(graph, 'loc.c');
    addFactionControl(graph, 'fac.iron', 'Iron Order', 'loc.a');
    addFactionControl(graph, 'fac.iron', 'Iron Order', 'loc.b');
    addFactionControl(graph, 'fac.iron', 'Iron Order', 'loc.c'); // dominant

    const rng = makeLcgRng(7);
    const band = composeSurveyPeopleProse(graph, HEX_COL, HEX_ROW, rng, 1);
    // The mood sentence fires even with no unrest (defaults to 0 → calm)
    // but the faction clause should also be present
    expect(band).toContain('Iron Order');
  });

  it('includes faction clause when faction has sufficient locationCount', () => {
    addLocation(graph, 'loc.a', 30);
    addFactionControl(graph, 'fac.guild', 'The Merchant Guild', 'loc.a');

    const rng = makeLcgRng(3);
    const band = composeSurveyPeopleProse(graph, HEX_COL, HEX_ROW, rng, 1);
    expect(band).toContain('The Merchant Guild');
  });

  it('produces a grammatical band: capitalised first letter and terminal punctuation', () => {
    addLocation(graph, 'loc.a', 40);
    addFactionControl(graph, 'fac.x', 'The Circle', 'loc.a');

    const rng = makeLcgRng(99);
    const band = composeSurveyPeopleProse(graph, HEX_COL, HEX_ROW, rng, 1);
    if (band.length > 0) {
      expect(band[0]).toBe(band[0].toUpperCase()); // capitalised
      expect(band[band.length - 1]).toBe('.');     // terminal period
    }
  });

  it('is deterministic — same seed produces the same band', () => {
    addLocation(graph, 'loc.a', 55);
    addFactionControl(graph, 'fac.a', 'Faction Alpha', 'loc.a');

    const band1 = composeSurveyPeopleProse(graph, HEX_COL, HEX_ROW, makeLcgRng(42), 1);
    const band2 = composeSurveyPeopleProse(graph, HEX_COL, HEX_ROW, makeLcgRng(42), 1);
    expect(band1).toBe(band2);
  });

  it('different seeds produce potentially different bands (non-trivial RNG usage)', () => {
    addLocation(graph, 'loc.a', 55);
    // Use widely spread seeds to ensure different RNG sequences
    const bands = new Set(
      [1, 100, 1000, 10000, 100000].map(seed =>
        composeSurveyPeopleProse(graph, HEX_COL, HEX_ROW, makeLcgRng(seed), 1),
      ),
    );
    // Multiple phrase options exist per bucket — at least 2 unique outputs
    expect(bands.size).toBeGreaterThan(1);
  });
});

describe('rankHexMortals', () => {
  let graph: WorldGraph;

  beforeEach(() => {
    graph = new WorldGraph();
    edgeCounter = 0;
  });

  it('returns empty array when hex has no locations', () => {
    expect(rankHexMortals(graph, HEX_COL, HEX_ROW)).toEqual([]);
  });

  it('returns empty array when locations have no agents', () => {
    addLocation(graph, 'loc.a');
    expect(rankHexMortals(graph, HEX_COL, HEX_ROW)).toEqual([]);
  });

  it('skips agents with no name property', () => {
    addLocation(graph, 'loc.a');
    graph.addNode({ id: 'anon.1', type: 'actor', name: '', properties: { actorType: 'individual', rarityTier: 2 } });
    graph.addEdge({ id: `edge_loc_${++edgeCounter}`, source: 'anon.1', target: 'loc.a', type: 'located_at', properties: {} });
    expect(rankHexMortals(graph, HEX_COL, HEX_ROW)).toEqual([]);
  });

  it('places bonded mortals before unbonded regardless of rarityTier', () => {
    addLocation(graph, 'loc.a');
    addAgent(graph, 'agent.high', 'Zara', 'loc.a', 5); // high rarity, unbonded
    addAgent(graph, 'agent.low', 'Kael', 'loc.a', 1);  // low rarity, bonded
    addThreadEdge(graph, 'asc.1', 'agent.low');

    const ranked = rankHexMortals(graph, HEX_COL, HEX_ROW);
    expect(ranked[0].node.id).toBe('agent.low'); // bonded first
    expect(ranked[0].bonded).toBe(true);
    expect(ranked[1].node.id).toBe('agent.high');
    expect(ranked[1].bonded).toBe(false);
  });

  it('sorts unbonded mortals by rarityTier descending', () => {
    addLocation(graph, 'loc.a');
    addAgent(graph, 'agent.r2', 'Bela', 'loc.a', 2);
    addAgent(graph, 'agent.r4', 'Doru', 'loc.a', 4);
    addAgent(graph, 'agent.r1', 'Ava', 'loc.a', 1);

    const ranked = rankHexMortals(graph, HEX_COL, HEX_ROW);
    expect(ranked.map(m => m.rarityTier)).toEqual([4, 2, 1]);
  });

  it('uses name as tie-break when rarityTiers are equal', () => {
    addLocation(graph, 'loc.a');
    addAgent(graph, 'agent.zed', 'Zed', 'loc.a', 3);
    addAgent(graph, 'agent.abe', 'Abe', 'loc.a', 3);
    addAgent(graph, 'agent.mid', 'Mira', 'loc.a', 3);

    const ranked = rankHexMortals(graph, HEX_COL, HEX_ROW);
    expect(ranked.map(m => m.node.properties.name)).toEqual(['Abe', 'Mira', 'Zed']);
  });

  it('deduplicates agents appearing in multiple locations', () => {
    addLocation(graph, 'loc.a');
    addLocation(graph, 'loc.b');
    addAgent(graph, 'agent.dup', 'Duplica', 'loc.a');
    graph.addEdge({ id: `edge_loc_${++edgeCounter}`, source: 'agent.dup', target: 'loc.b', type: 'located_at', properties: {} });

    const ranked = rankHexMortals(graph, HEX_COL, HEX_ROW);
    expect(ranked.length).toBe(1);
  });

  it('defaults rarityTier to 1 when property is missing', () => {
    addLocation(graph, 'loc.a');
    graph.addNode({ id: 'agent.notier', type: 'actor', name: 'Nora', properties: { actorType: 'individual', name: 'Nora' } });
    graph.addEdge({ id: `edge_loc_${++edgeCounter}`, source: 'agent.notier', target: 'loc.a', type: 'located_at', properties: {} });

    const ranked = rankHexMortals(graph, HEX_COL, HEX_ROW);
    expect(ranked[0].rarityTier).toBe(1);
  });
});

describe('composeNamedMortalsClause', () => {
  it('returns the fallback string for an empty list', () => {
    expect(composeNamedMortalsClause([], makeLcgRng(42))).toBe(SURVEY_NO_NAMED_MORTALS_FALLBACK);
  });

  it('never returns an empty string — fallback is always real prose', () => {
    expect(composeNamedMortalsClause([], makeLcgRng(1))).not.toBe('');
  });

  it('includes the mortal name in output', () => {
    const graph = new WorldGraph();
    edgeCounter = 0;
    addLocation(graph, 'loc.a');
    addAgent(graph, 'agent.1', 'Kael Thornweaver', 'loc.a', 2);
    const ranked = rankHexMortals(graph, HEX_COL, HEX_ROW);
    const clause = composeNamedMortalsClause(ranked, makeLcgRng(5));
    expect(clause).toContain('Kael Thornweaver');
  });

  it('includes a bonded marker for a bonded mortal', () => {
    const graph = new WorldGraph();
    edgeCounter = 0;
    addLocation(graph, 'loc.a');
    addAgent(graph, 'agent.1', 'Serafina', 'loc.a', 3);
    addThreadEdge(graph, 'asc.1', 'agent.1');
    const ranked = rankHexMortals(graph, HEX_COL, HEX_ROW);
    const clause = composeNamedMortalsClause(ranked, makeLcgRng(7));
    expect(clause).toContain('Serafina');
    const bondPhrases = ['bound to you', 'a thread of yours', 'one you have touched', 'tied to your hand'];
    expect(bondPhrases.some(p => clause.includes(p))).toBe(true);
  });

  it('caps output at SURVEY_NAMED_MORTALS_CAP even when more mortals are provided', () => {
    const graph = new WorldGraph();
    edgeCounter = 0;
    addLocation(graph, 'loc.a');
    for (let i = 0; i < 7; i++) {
      addAgent(graph, `agent.${i}`, `Mortal${i}`, 'loc.a', i + 1);
    }
    const ranked = rankHexMortals(graph, HEX_COL, HEX_ROW);
    expect(ranked.length).toBe(7);
    const clause = composeNamedMortalsClause(ranked, makeLcgRng(3));
    for (let i = SURVEY_NAMED_MORTALS_CAP; i < ranked.length; i++) {
      expect(clause).not.toContain(ranked[i].node.properties.name as string);
    }
  });

  it('produces a capitalised clause with terminal period', () => {
    const graph = new WorldGraph();
    edgeCounter = 0;
    addLocation(graph, 'loc.a');
    addAgent(graph, 'agent.1', 'Wren', 'loc.a', 2);
    const ranked = rankHexMortals(graph, HEX_COL, HEX_ROW);
    const clause = composeNamedMortalsClause(ranked, makeLcgRng(9));
    expect(clause[0]).toBe(clause[0].toUpperCase());
    expect(clause[clause.length - 1]).toBe('.');
  });

  it('is deterministic — same seed produces the same clause', () => {
    const graph = new WorldGraph();
    edgeCounter = 0;
    addLocation(graph, 'loc.a');
    addAgent(graph, 'agent.1', 'Wren', 'loc.a', 2);
    addAgent(graph, 'agent.2', 'Doru', 'loc.a', 1);
    const ranked = rankHexMortals(graph, HEX_COL, HEX_ROW);
    const c1 = composeNamedMortalsClause(ranked, makeLcgRng(42));
    const c2 = composeNamedMortalsClause(ranked, makeLcgRng(42));
    expect(c1).toBe(c2);
  });
});

describe('composeSurveyPeopleProse — named-mortals integration', () => {
  let graph: WorldGraph;

  beforeEach(() => {
    graph = new WorldGraph();
    resetSurveyEventCounter();
    edgeCounter = 0;
  });

  it('includes named-mortals clause in band when agents exist', () => {
    addLocation(graph, 'loc.a', 20);
    addAgent(graph, 'agent.1', 'Kael Thornweaver', 'loc.a', 3);

    const band = composeSurveyPeopleProse(graph, HEX_COL, HEX_ROW, makeLcgRng(42), 1);
    expect(band).toContain('Kael Thornweaver');
  });

  it('includes fallback prose when hex has no named mortals', () => {
    addLocation(graph, 'loc.a', 30);

    const band = composeSurveyPeopleProse(graph, HEX_COL, HEX_ROW, makeLcgRng(1), 1);
    expect(band).toContain('No names rise');
  });

  it('bonded mortals appear before unbonded in the band', () => {
    addLocation(graph, 'loc.a', 20);
    addAgent(graph, 'agent.high', 'Zara', 'loc.a', 5);
    addAgent(graph, 'agent.bonded', 'Kael', 'loc.a', 1);
    addThreadEdge(graph, 'asc.1', 'agent.bonded');

    const band = composeSurveyPeopleProse(graph, HEX_COL, HEX_ROW, makeLcgRng(7), 1);
    const kaelIdx = band.indexOf('Kael');
    const zaraIdx = band.indexOf('Zara');
    expect(kaelIdx).toBeLessThan(zaraIdx);
  });

  it('is fully deterministic — same seed + same graph → same band', () => {
    addLocation(graph, 'loc.a', 55);
    addAgent(graph, 'agent.1', 'Wren', 'loc.a', 2);
    addFactionControl(graph, 'fac.a', 'The Order', 'loc.a');

    const b1 = composeSurveyPeopleProse(graph, HEX_COL, HEX_ROW, makeLcgRng(42), 1);
    const b2 = composeSurveyPeopleProse(graph, HEX_COL, HEX_ROW, makeLcgRng(42), 1);
    expect(b1).toBe(b2);
  });

  it('produces a grammatical band: capitalised first letter, terminal period', () => {
    addLocation(graph, 'loc.a', 40);
    addAgent(graph, 'agent.1', 'Serafina', 'loc.a', 3);
    addFactionControl(graph, 'fac.x', 'The Circle', 'loc.a');

    const band = composeSurveyPeopleProse(graph, HEX_COL, HEX_ROW, makeLcgRng(99), 1);
    expect(band.length).toBeGreaterThan(0);
    expect(band[0]).toBe(band[0].toUpperCase());
    expect(band[band.length - 1]).toBe('.');
  });
});

describe('buildSurveyCompletedTickEvent', () => {
  beforeEach(() => resetSurveyEventCounter());

  it('builds a TickEvent with correct shape', () => {
    const evt = buildSurveyCompletedTickEvent('The populace stirs.', 3, 4, 12);
    expect(evt.type).toBe('survey_completed');
    expect(evt.message).toBe('The populace stirs.');
    expect(evt.significance).toBe(SURVEY_EVENT_SIGNIFICANCE);
    expect(evt.hexCoords).toEqual({ col: 3, row: 4 });
    expect(evt.tick).toBe(12);
    expect(evt.notification?.channel).toBe('toast');
    expect(evt.notification?.icon).toBe('revelation');
  });

  it('generates unique ids across calls', () => {
    const a = buildSurveyCompletedTickEvent('Band A.', 1, 1, 5);
    const b = buildSurveyCompletedTickEvent('Band B.', 1, 1, 5);
    expect(a.id).not.toBe(b.id);
  });
});
