import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import {
  deriveMoodBucket,
  deriveFactionPresenceTier,
  composeSurveyPeopleProse,
  buildSurveyCompletedTickEvent,
  resetSurveyEventCounter,
} from '../surveyProseComposer';
import {
  FACTION_PRESENCE_DOMINANT_MIN,
  FACTION_PRESENCE_ACTIVE_MIN,
  SURVEY_EVENT_SIGNIFICANCE,
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

  it('returns empty string for an empty hex (no locations)', () => {
    const rng = makeLcgRng(42);
    expect(composeSurveyPeopleProse(graph, HEX_COL, HEX_ROW, rng, 1)).toBe('');
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
