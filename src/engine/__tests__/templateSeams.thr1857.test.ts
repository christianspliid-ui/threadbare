/**
 * THR-1857 — template seams found by warm playtest round 2.
 *
 *  - "Kael Thornweaver work with…": `{name} work{s}` dropped the s for a they/them bearer.
 *  - "They wants to trace the vector": a hard-coded verb after `{pronoun.subject_capitalized}`.
 *  - "Inn pays its tithe": a genome sublocation named by its bare type label.
 *  - "Wilderness (14, 14)": a movement waypoint named by its coordinates.
 *
 * The icon-label seam ("reputation with {target}") is pinned in
 * `buildAftermathConsequences.test.ts`.
 */
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  bindNameSubjectVerbs,
  NAME_SUBJECT_TOKENS,
  PRONOUN_SUBJECT_HARDCODED_S,
} from '../subjectVerbAgreement';
import { resolveForeshadowingPlaceholders } from '../foreshadowing/genericFallback';
import { WorldGraph } from '../graph';
import { findOrCreateLocationAtHex, WAYPOINT_LOCATION_ID_PREFIX } from '../hexMovementPath';
import { genomeSublocationName } from '../settlementGenome/materialize';
import { composeWaypointName, WAYPOINT_DEFAULT_GROUND } from '../../data/waypoint-names';

const DATA_DIR = join(__dirname, '..', '..', 'data');
const COORDINATE_NAME = /\(\s*-?\d+\s*,\s*-?\d+\s*\)/;
/** THR-1945: `the|a|an <noun> <verb>{s|es}` — a noun subject carrying actor agreement. */
const NOUN_SUBJECT_AGREEMENT = /\b(?:[Tt]he|[Aa]n?) [A-Za-z'-]+ [a-z]+\{(?:s|es)\}/g;

function dataFiles(): Array<{ file: string; text: string }> {
  return readdirSync(DATA_DIR)
    .filter(f => f.endsWith('.ts'))
    .map(f => ({ file: f, text: readFileSync(join(DATA_DIR, f), 'utf8') }));
}

describe('name-subject verb agreement (THR-1857)', () => {
  it('binds {s} after a name subject to "s"', () => {
    expect(bindNameSubjectVerbs('{name} work{s} with the patient')).toBe('{name} works with the patient');
    expect(bindNameSubjectVerbs('{Actor} nod{s}.')).toBe('{Actor} nods.');
    expect(bindNameSubjectVerbs('{agent.name} wait{s}')).toBe('{agent.name} waits');
    expect(bindNameSubjectVerbs('{name} either join{s} today')).toBe('{name} either joins today');
  });

  it('leaves pronoun-agreement {s} for the pronoun pass', () => {
    expect(bindNameSubjectVerbs('{They} work{s}, and {name} wait{s}')).toBe('{They} work{s}, and {name} waits');
    expect(bindNameSubjectVerbs('{They} pause{s}.')).toBe('{They} pause{s}.');
  });

  it('content lint: no name-subject {s} survives the binder anywhere in src/data', () => {
    // A `{name} <word> <verb>{s}` the binder cannot see (a new adverb, a second word)
    // would resolve by pronoun and drop the s for they/them. Add the adverb to
    // NAME_SUBJECT_ADVERBS or restructure the line.
    const tokens = NAME_SUBJECT_TOKENS.map(t => t.replace('.', '\\.')).join('|');
    const leak = new RegExp(`\\{(?:${tokens})\\}(?:\\s+[A-Za-z'-]+){1,2}\\{s\\}`, 'g');
    const offenders: string[] = [];
    for (const { file, text } of dataFiles()) {
      for (const m of bindNameSubjectVerbs(text).matchAll(leak)) offenders.push(`${file}: ${m[0]}`);
    }
    expect(offenders).toEqual([]);
  });

  it('content lint: no hard-coded verb after {pronoun.subject} ("They wants")', () => {
    const offenders: string[] = [];
    for (const { file, text } of dataFiles()) {
      for (const m of text.matchAll(PRONOUN_SUBJECT_HARDCODED_S)) offenders.push(`${file}: ${m[0]}`);
    }
    expect(offenders).toEqual([]);
  });

  it('content lint: no {s} after a determiner-led noun subject (THR-1945)', () => {
    // `{s}` agrees with the scene's actor, so "The captain nod{s}" reads "The captain nod"
    // for a they/them actor. A noun subject is never the actor: write the verb out.
    const offenders: string[] = [];
    for (const { file, text } of dataFiles()) {
      for (const m of text.matchAll(NOUN_SUBJECT_AGREEMENT)) offenders.push(`${file}: ${m[0]}`);
    }
    expect(offenders).toEqual([]);
    expect('The captain nod{s} at {name}'.match(NOUN_SUBJECT_AGREEMENT)).not.toBeNull();
    expect('the stone go{es} in'.match(NOUN_SUBJECT_AGREEMENT)).not.toBeNull();
    expect('{They} nod{s}, and the captain nods'.match(NOUN_SUBJECT_AGREEMENT)).toBeNull();
  });

  it('the lint itself catches the shapes it guards', () => {
    expect([...'{pronoun.subject_capitalized} wants to'.matchAll(PRONOUN_SUBJECT_HARDCODED_S)]).toHaveLength(1);
    const tokens = NAME_SUBJECT_TOKENS.map(t => t.replace('.', '\\.')).join('|');
    const leak = new RegExp(`\\{(?:${tokens})\\}(?:\\s+[A-Za-z'-]+){1,2}\\{s\\}`, 'g');
    expect(bindNameSubjectVerbs('{name} slowly work{s}').match(leak)).not.toBeNull();
  });
});

describe('foreshadowing pronoun agreement (THR-1857)', () => {
  const line = '{pronoun.subject_capitalized} want{s} to trace it; {pronoun.subject_capitalized} approach{es}.';
  it('reads "They want" for they/them', () => {
    expect(resolveForeshadowingPlaceholders(line, 'Kael Thornweaver', 'Plague', 'they'))
      .toBe('They want to trace it; They approach.');
  });
  it('reads "She wants" for she/her', () => {
    expect(resolveForeshadowingPlaceholders(line, 'Kael Thornweaver', 'Plague', 'she'))
      .toBe('She wants to trace it; She approaches.');
  });
  it('a name subject keeps its s whatever the pronoun', () => {
    expect(resolveForeshadowingPlaceholders('{name.first} move{s} on.', 'Kael Thornweaver', 'Plague', 'they'))
      .toBe('Kael moves on.');
  });
});

describe('waypoint names (THR-1857)', () => {
  it('names a waypoint for its ground and the nearest settlement, never a coordinate', () => {
    const graph = new WorldGraph();
    graph.addNode({
      id: 'loc_hawkgate', type: 'location', name: 'Hawkgate',
      properties: { hexCol: 6, hexRow: 6, locationSubtype: 'town' },
    });
    const id = findOrCreateLocationAtHex(graph, { col: 4, row: 6 }, 'temperate_forest');
    const name = graph.getNode(id)!.name;
    // A proper noun with no article: reads right mid-sentence and at a sentence start.
    expect(name).toBe('Hawkgate Forest');
    expect(name).not.toMatch(COORDINATE_NAME);
    expect(name[0]).toBe(name[0].toUpperCase());
  });

  it('reads "Nameless <ground>" when no settlement is in reach', () => {
    const graph = new WorldGraph();
    const id = findOrCreateLocationAtHex(graph, { col: 40, row: 40 });
    expect(graph.getNode(id)!.name).toBe(`Nameless ${WAYPOINT_DEFAULT_GROUND}`);
    expect(composeWaypointName('hills', undefined)).toBe('Nameless Hills');
  });

  it('renames a pre-THR-1857 coordinate-named waypoint on reuse', () => {
    const graph = new WorldGraph();
    graph.addNode({
      id: `${WAYPOINT_LOCATION_ID_PREFIX}2.3`, type: 'location', name: 'Wilderness (2, 3)',
      properties: { hexCol: 2, hexRow: 3, locationType: 'wilderness', terrain: 'marsh' },
    });
    const id = findOrCreateLocationAtHex(graph, { col: 2, row: 3 });
    expect(graph.getNode(id)!.name).toBe('Nameless Marsh');
  });
});

describe('genome culture (THR-1857 review)', () => {
  it('materializeGenome reads the culture from the current belongs_to edge', async () => {
    const { materializeGenome } = await import('../settlementGenome/materialize');
    const tavernNames = await import('../../data/tavern-names');
    const graph = new WorldGraph();
    graph.addNode({ id: 'loc_1', type: 'location', name: 'Frostholm', properties: { hexCol: 1, hexRow: 1 } });
    graph.addNode({ id: 'culture_northern', type: 'actor', name: 'Northern', properties: { actorType: 'culture' } });
    graph.addEdge({ id: 'e1', type: 'belongs_to', source: 'loc_1', target: 'culture_northern', properties: { cultureLayer: 'current' } });
    materializeGenome(graph, 'loc_1', {
      archetypeId: null, archetypeName: null, archetypeProseFlavor: null,
      sublocations: [{ id: 'sublocation-type.tavern', sourcePass: 'infrastructure', tags: [] }],
      npcs: [],
    } as never, 7);
    const tavern = graph.getOutgoingEdges('loc_1', 'contains').map(e => graph.getNode(e.target)!)[0];
    // Same seed, same culture id → the same name the generator gives that culture.
    const { mulberry32, hashString } = await import('../../lib/prng');
    const rng = mulberry32((7 ^ hashString('sublocation-type.tavern')) >>> 0);
    expect(tavern.name).toBe(tavernNames.generateTavernName(rng, 'culture_northern'));
  });

  it('a tavern added by the second worldgen pass never repeats the inn the first pass named', async () => {
    const { materializeGenome } = await import('../settlementGenome/materialize');
    const base = { archetypeId: null, archetypeName: null, archetypeProseFlavor: null, npcs: [] };
    for (let seed = 0; seed < 50; seed++) {
      const graph = new WorldGraph();
      graph.addNode({ id: 'loc_1', type: 'location', name: 'Frostholm', properties: {} });
      materializeGenome(graph, 'loc_1', {
        ...base, sublocations: [{ id: 'sublocation-type.inn', sourcePass: 'infrastructure', tags: [] }],
      } as never, seed);
      materializeGenome(graph, 'loc_1', {
        ...base, sublocations: [
          { id: 'sublocation-type.inn', sourcePass: 'infrastructure', tags: [] },
          { id: 'sublocation-type.tavern', sourcePass: 'reach', tags: [] },
        ],
      } as never, seed);
      const names = graph.getOutgoingEdges('loc_1', 'contains').map(e => graph.getNode(e.target)!.name);
      expect(names).toHaveLength(2);
      expect(new Set(names).size).toBe(2);
    }
  });
});

describe('genome sublocation names (THR-1857)', () => {
  const rng = () => 0.42;
  it('an inn or a tavern gets a generated house name, never the bare label', () => {
    for (const typeId of ['sublocation-type.inn', 'sublocation-type.tavern']) {
      const name = genomeSublocationName(typeId, 'Wraithwood', undefined, rng);
      expect(name).not.toBe('Inn');
      expect(name).not.toBe('Tavern');
      expect(name.length).toBeGreaterThan(0);
    }
  });

  it('any other type reads "<label> (<settlement>)", the label from the type table', () => {
    expect(genomeSublocationName('sublocation-type.market-district', 'Wraithwood', undefined, rng))
      .toBe('Market District (Wraithwood)');
    expect(genomeSublocationName('sublocation-type.unknown-hall', 'Wraithwood', undefined, rng))
      .toBe('Unknown Hall (Wraithwood)');
  });
});
