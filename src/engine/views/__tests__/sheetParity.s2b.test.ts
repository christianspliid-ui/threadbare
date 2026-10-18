/**
 * Sheet parity, S2b (THR-1910 — plan § D7.11): the place, faction, army, artifact and
 * attachment blocks. The person block is `sheetParity.test.ts` (S2a).
 *
 * Each field from the plan brainstorm's § Field inventories
 * (`Docs/plans/2026-10-14-thr-1876-the-inspector-brainstorm.md`) — plus the sheet fields
 * that postdate it (Fortunes, Prayer, Purse, Crown, Fealty, the settlement notable, the
 * war-aim line) — names its new home: a row `typeId` in that kind's registry entry, a
 * header field, a Connections group, the land page, or `retired:` with a lawful reason.
 * The test fails when a named home does not exist. S4 may not delete `LocationProfileModal`,
 * `LocationView`, `HexSidebar`, `FactionSheet`, `ArmySheet`, `ArtifactSheet` or
 * `AttachmentDetailView` until this file is green.
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../../graph';
import type { GameState } from '../../../types/gameState';
import type { InspectorTabId, PageLayoutKind, PageSurface, Section } from '../../../types/detailPage';
import { DETAIL_PAGE_REGISTRY } from '../../../data/detailPageTemplates';
import { CONNECTION_GROUP_ORDER, type ConnectionGroupId } from '../../../data/view-content';
import { composeSections } from '../../detailPageGenerator';
import { CONNECTION_RECIPES } from '../connections';
import { buildSubjectPage } from '../subjects/subjectPage';
import type { SubjectHeaderVM } from '../subjects/subjectTypes';

type RetiredReason = 'raw-number-or-key' | 'duplicate-of-kept-row' | 'relation-in-connections' | 'dead-source';
type Home =
  | { row: string }
  | { header: keyof SubjectHeaderVM }
  | { connections: ConnectionGroupId }
  | { land: true }
  | { retired: RetiredReason; why: string };

const HEADER_KEYS: ReadonlySet<string> = new Set([
  'ref', 'name', 'kindLabel', 'epithet', 'whereLine', 'visual', 'standing', 'doingLine', 'lede', 'mapLocated', 'hexKey', 'opensWide', 'follow',
] satisfies (keyof SubjectHeaderVM)[]);

const PLACE_FIELDS: Record<string, Home> = {
  // LocationProfileModal
  'profile: name': { header: 'name' },
  'profile: rarity · kind · archetype': { header: 'kindLabel' },
  'profile: place prose (archetypeProseFlavor)': { retired: 'duplicate-of-kept-row', why: 'PC-6: one place prose, place_prose' },
  'profile: held by': { connections: 'belongsTo' },
  'profile: pilgrim ways': { connections: 'belongsTo' },
  'profile: your reputation here': { row: 'standing' },
  'profile: conditions': { row: 'conditions_here' },
  // LocationView (the city view)
  'city: header type': { header: 'kindLabel' },
  'city: (col, row)': { retired: 'raw-number-or-key', why: 'Law 14: coordinates' },
  'city: past line': { row: 'past_line' },
  'city: place prose': { row: 'place_prose' },
  'city: place of power': { row: 'place_of_power' },
  'city: hero': { header: 'visual' },
  'city: fortunes': { row: 'fortunes' },
  'city: prayer / faithful': { row: 'prayer' },
  'city: livelihood': { row: 'livelihood' },
  'city: dominion': { row: 'dominion' },
  'city: contested / desecrated': { row: 'contested' },
  'city: walls': { row: 'walls' },
  'city: settlement notable': { connections: 'who' },
  'city: inhabitants / agents present': { connections: 'who' },
  'city: sublocation cards (art, name, badges, occupants)': { connections: 'holdsKnows' },
  'city: also-available encounters': { row: 'encounters_here' },
  'city: guild postings': { row: 'guild_postings' },
  'city: encounters active / available': { row: 'encounters_here' },
  'city: sublocation drill-down': { retired: 'relation-in-connections', why: 'a Place is its own page' },
  'city: narrate button': { retired: 'dead-source', why: 'TTS is a host control, not a field' },
  // HexSidebar (Area facts) and the hex surfaces
  'sidebar: region name': { header: 'name' },
  'sidebar: size + feature words': { row: 'area_facts' },
  'sidebar: positional danger': { row: 'area_facts' },
  'sidebar: sphere bars': { row: 'area_facts' },
  'sidebar: culture / controls': { land: true },
  'sidebar: counts': { retired: 'raw-number-or-key', why: 'counts belong on group headers' },
  'sidebar: location links': { land: true },
  'sidebar: monster lair card': { land: true },
  // Registry
  'registry: place_painting (hover)': { row: 'place_painting' },
  'registry: what_this_place_wants (hover)': { row: 'what_this_place_wants' },
  'registry: memory': { row: 'memory' },
};

const FACTION_FIELDS: Record<string, Home> = {
  'sheet: sigil / name': { header: 'name' },
  'sheet: doctrine glyph, dissent glow': { header: 'visual' },
  'sheet: description, motto': { row: 'description' },
  'sheet: dominion': { row: 'dominion' },
  'sheet: kind chip': { header: 'kindLabel' },
  'sheet: court at': { connections: 'where' },
  'sheet: governs N seats': { connections: 'holdsKnows' },
  'sheet: ascendant actions': { retired: 'duplicate-of-kept-row', why: 'the Act row (S3)' },
  'sheet: venerates': { row: 'venerates' },
  'sheet: pilgrim ways': { connections: 'holdsKnows' },
  'sheet: stat grid': { retired: 'raw-number-or-key', why: 'Law 13: counts sit on the group headers' },
  'sheet: woven successor': { connections: 'who' },
  'sheet: network diagram': { retired: 'relation-in-connections', why: 'its nodes are the Connections groups' },
  'sheet: crown line': { row: 'crown' },
  'sheet: leadership, members': { connections: 'who' },
  'sheet: strongest reaches': { row: 'strongest_reaches' },
  'sheet: reach score numeral': { retired: 'raw-number-or-key', why: 'Law 13: the word and the bar stay' },
  'sheet: halls & seats': { connections: 'where' },
  'sheet: what they control': { connections: 'holdsKnows' },
  'sheet: purse band': { row: 'means' },
  'sheet: purse income / fealty / spending': { row: 'purse' },
  'sheet: means (no purse)': { row: 'means' },
  'sheet: agenda': { row: 'agenda' },
  'sheet: conclave': { row: 'conclave' },
  'sheet: relations': { connections: 'friendsAndFoes' },
  'sheet: fealty oath + standing': { row: 'fealty' },
  'sheet: fealty vassals': { connections: 'friendsAndFoes' },
  'sheet: liege': { connections: 'belongsTo' },
  'sheet: recent actions': { row: 'recent_actions' },
  'sheet: ranks': { row: 'ranks' },
  'sheet: (N slots)': { retired: 'raw-number-or-key', why: 'Law 13' },
  'chronicle: the people (culture mores)': { row: 'customs' },
  'registry: how_they_hold_her': { row: 'how_they_hold_her' },
  'registry: reputations_they_hold': { row: 'reputations_they_hold' },
  'registry: allied_with (hover)': { row: 'allied_with' },
  'registry: opposed (hover)': { row: 'opposed' },
};

const ARMY_FIELDS: Record<string, Home> = {
  'sheet: name, hero': { header: 'name' },
  'sheet: size · cohesion · supply': { row: 'who_they_are' },
  'sheet: objective / war aim': { row: 'what_they_are_doing' },
  'registry: commander': { connections: 'who' },
  'registry: raising faction': { connections: 'belongsTo' },
  'registry: who_leads_them (hover)': { row: 'who_leads_them' },
};

const ARTIFACT_FIELDS: Record<string, Home> = {
  'sheet: hero': { header: 'visual' },
  'sheet: rarity · kind': { header: 'standing' },
  'sheet: dominion': { row: 'dominion' },
  'sheet: made by': { row: 'made_by' },
  'sheet: flavour': { row: 'icon_with_meaning' },
  'sheet: what it does / the catch': { row: 'what_it_does' },
  'sheet: traits': { row: 'traits' },
  'sheet: tags': { row: 'tags' },
  'sheet: mechanicalSummary': { retired: 'raw-number-or-key', why: 'Law 13: raw magnitudes' },
  'registry: previous_uses': { row: 'previous_uses' },
  'registry: who_gave_it (hover)': { row: 'who_gave_it' },
  'registry: how_it_tilts_this_scene (hover)': { row: 'how_it_tilts_this_scene' },
};

const ATTACHMENT_FIELDS: Record<string, Home> = {
  'sheet: name': { header: 'name' },
  'sheet: codex link': { header: 'ref' },
  'sheet: art / glyph': { header: 'visual' },
  'sheet: tier · subcategory': { header: 'kindLabel' },
  'sheet: flavour': { row: 'its_voice' },
  'sheet: effect line, loss, granted by, type': { row: 'effect' },
  'sheet: mechanicalSummary': { retired: 'raw-number-or-key', why: 'Law 13: raw magnitudes' },
  'sheet: duration': { row: 'duration' },
  'sheet: tags': { row: 'marks' },
  'sheet: triggers': { row: 'triggers' },
  'sheet: (Nx)': { retired: 'raw-number-or-key', why: 'Law 13' },
  'sheet: source': { row: 'source' },
};

/** Plan § D7.2, D7.4–D7.7 — the S2b rows' tab and width. */
const DWF: readonly PageSurface[] = ['docked', 'wide', 'full'];
const WF: readonly PageSurface[] = ['wide', 'full'];
const HOVER: readonly PageSurface[] = ['hover'];
const S2B_ROWS: Partial<Record<PageLayoutKind, Record<string, { tab?: InspectorTabId; at: readonly PageSurface[] }>>> = {
  place: {
    place_prose: { tab: 'overview', at: DWF },
    what_this_place_wants: { at: HOVER },
    past_line: { tab: 'overview', at: DWF },
    livelihood: { tab: 'overview', at: DWF },
    contested: { tab: 'overview', at: DWF },
    walls: { tab: 'overview', at: DWF },
    conditions_here: { tab: 'overview', at: DWF },
    standing: { tab: 'overview', at: DWF },
    place_of_power: { tab: 'overview', at: DWF },
    area_facts: { tab: 'overview', at: DWF },
    guild_postings: { tab: 'here_now', at: DWF },
    encounters_here: { tab: 'here_now', at: DWF },
  },
  faction: {
    description: { tab: 'overview', at: DWF },
    venerates: { tab: 'overview', at: DWF },
    agenda: { tab: 'overview', at: DWF },
    conclave: { tab: 'overview', at: DWF },
    means: { tab: 'overview', at: DWF },
    strongest_reaches: { tab: 'overview', at: DWF },
    customs: { tab: 'overview', at: WF },
    ranks: { tab: 'overview', at: WF },
    recent_actions: { tab: 'story', at: DWF },
    allied_with: { at: HOVER },
    opposed: { at: HOVER },
  },
  group: { who_leads_them: { at: HOVER } },
  item: {
    made_by: { tab: 'overview', at: DWF },
    what_it_does: { tab: 'overview', at: DWF },
    traits: { tab: 'overview', at: DWF },
    tags: { tab: 'overview', at: DWF },
    who_gave_it: { at: HOVER },
  },
  content: {
    effect: { at: DWF },
    duration: { at: DWF },
    triggers: { at: DWF },
    source: { at: WF },
  },
};

const ASC = 'asc';

function baseState(graph: WorldGraph): GameState {
  return {
    graph,
    ascendantId: ASC,
    tick: 400,
    seed: 42,
    tiles: [{ coord: { col: 2, row: 2 }, terrain: 'plains', regionId: 'area', dangerLevel: 0.7 }],
    recentEvents: [],
    familiarityMap: new Map(),
    visibilityMap: new Map(),
    essencePool: {},
    unifiedActions: [],
    encounterProgress: [],
    controlEffects: [],
    chapterArchive: [],
    rivalDefinitions: [],
    strategicState: { projects: [], controls: [], history: [] },
    ascendantIdentity: { divineName: 'Vara', hungerName: 'Witness', sphereAlignment: { primary: 'mind', secondary: 'spirit' } },
  } as unknown as GameState;
}

function world(): GameState {
  const graph = new WorldGraph();
  graph.addNode({ id: ASC, type: 'actor', name: 'Vara', properties: { actorType: 'ascendant' } });
  graph.addNode({ id: 'area', type: 'region', name: 'The Bone Coast', properties: { hexCount: 14, featureType: 'forest' } });
  graph.addNode({
    id: 'town', type: 'location', name: 'Ashford',
    properties: {
      locationType: 'town', locationSubtype: 'town', hexCol: 2, hexRow: 2,
      fortificationMultiplier: 1.5,
      resources: { grain: { quantity: 2, stockTier: 'scarce' } },
    },
  });
  graph.addNode({ id: 'kael', type: 'actor', name: 'Kael', properties: { actorType: 'individual' } });
  graph.addEdge({ id: 'at1', source: 'kael', target: 'town', type: 'located_at', properties: {} });
  graph.addNode({
    id: 'guild', type: 'actor', name: 'The Iron Guild',
    properties: {
      actorType: 'faction', wealth: 60,
      factionActionHistory: [
        { actionType: 'seek_fealty', executedTick: 300, targetName: 'Ashford', outcome: 'success' },
        { actionType: 'raise_army', executedTick: 380, outcome: 'failed' },
      ],
      activeConclave: { question: 'Who will lead?', participants: [], ticksRemaining: 96 },
    },
  });
  graph.addNode({
    id: 'host', type: 'actor', name: 'The Iron Host',
    properties: { actorType: 'group', groupKind: 'army', armyState: { size: 'company', headcount: 300, cohesion: 80, cohesionMax: 100, objective: { type: 'conquer', targetNodeId: 'town', estimatedAttrition: 0.1 } } },
  });
  graph.addEdge({ id: 'm1', source: 'host', target: 'guild', type: 'member_of', properties: { role: 'member', rank: 0.2, joinedTick: 0 } });
  graph.addNode({
    id: 'blade', type: 'artifact', name: 'The Grey Blade',
    properties: { subcategory: 'relics_talismans', tags: ['#iron', '#weapon'], flavorText: 'It hums.' },
  });
  graph.addNode({
    id: 'trait.condition.wounded', type: 'trait', name: 'Wounded',
    properties: {
      subcategory: 'condition', tier: 2, tags: ['#wound'], description: 'A wound that slows the bearer.',
      mechanicalSummary: '-0.2 Iron', lossCondition: 'rest heals it', source: 'Battle',
      effects: [{ type: 'action_trigger', on: 'rest', payload: { kind: 'condition_remove', tags: ['#wound'] }, maxFires: 3 }],
    },
  });
  return baseState(graph);
}

function sections(kind: PageLayoutKind, nodeId: string, state: GameState): Section[] {
  return composeSections(kind, { nodeId, pageKind: kind, graph: state.graph, seed: state.seed, tick: state.tick, protagonistId: ASC, state });
}

/** Player-facing strings of a section — every string leaf except ids, refs and tooltip ids. */
function playerText(section: Section): string[] {
  const out: string[] = [];
  const skip = new Set(['typeId', 'source', 'tab', 'visibleAt', 'ref', 'clickRef', 'eventRef', 'tooltipId', 'labelTooltipId', 'sphere', 'tier', 'kind', 'dataKey', 'termRefs', 'layers', 'portraitRef']);
  const walk = (v: unknown, key: string) => {
    if (skip.has(key)) return;
    if (typeof v === 'string') out.push(v.replace(/<[^>]+>/g, ''));
    else if (Array.isArray(v)) v.forEach(x => walk(x, ''));
    else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) walk(x, k);
  };
  walk(section, '');
  return out;
}

function checkHomes(kind: PageLayoutKind, fields: Record<string, Home>, connectionClass: keyof typeof CONNECTION_RECIPES | null): string[] {
  const rows = new Set(DETAIL_PAGE_REGISTRY[kind].map(r => r.typeId));
  const recipe = connectionClass ? CONNECTION_RECIPES[connectionClass] : {};
  const missing: string[] = [];
  for (const [field, home] of Object.entries(fields)) {
    if ('row' in home && !rows.has(home.row)) missing.push(`${field} → row ${home.row}`);
    if ('header' in home && !HEADER_KEYS.has(home.header)) missing.push(`${field} → header ${home.header}`);
    if ('connections' in home) {
      if (!(CONNECTION_GROUP_ORDER as readonly string[]).includes(home.connections)) missing.push(`${field} → connections ${home.connections}`);
      else if (!recipe[home.connections]?.length) missing.push(`${field} → connections ${home.connections}: no recipe step`);
    }
    if ('land' in home && DETAIL_PAGE_REGISTRY.land.length === 0) missing.push(`${field} → land page`);
    if ('retired' in home && !home.why) missing.push(`${field} → retired without a why`);
  }
  return missing;
}

describe('sheet parity — place, faction, army, artifact, attachment (THR-1910, plan § D7.11)', () => {
  it('every place field has a home that exists, or a lawful retired reason', () => {
    expect(checkHomes('place', PLACE_FIELDS, 'location')).toEqual([]);
  });
  it('every faction field has a home', () => {
    expect(checkHomes('faction', FACTION_FIELDS, 'faction')).toEqual([]);
  });
  it('every army field has a home', () => {
    expect(checkHomes('group', ARMY_FIELDS, 'army')).toEqual([]);
  });
  it('every artifact field has a home', () => {
    expect(checkHomes('item', ARTIFACT_FIELDS, 'artifact')).toEqual([]);
  });
  it('every attachment field has a home', () => {
    expect(checkHomes('content', ATTACHMENT_FIELDS, null)).toEqual([]);
  });

  it('each S2b row sits in the plan\'s tab at the plan\'s widths', () => {
    const wrong: string[] = [];
    for (const [kind, rows] of Object.entries(S2B_ROWS) as [PageLayoutKind, Record<string, { tab?: InspectorTabId; at: readonly PageSurface[] }>][]) {
      for (const [typeId, want] of Object.entries(rows)) {
        const row = DETAIL_PAGE_REGISTRY[kind].find(r => r.typeId === typeId);
        if (!row) { wrong.push(`${kind}.${typeId}: missing`); continue; }
        if (want.tab && row.tab !== want.tab) wrong.push(`${kind}.${typeId}: tab ${row.tab} ≠ ${want.tab}`);
        if (JSON.stringify(row.visibleAt) !== JSON.stringify(want.at)) wrong.push(`${kind}.${typeId}: at ${JSON.stringify(row.visibleAt)}`);
      }
    }
    expect(wrong).toEqual([]);
  });

  it('the relations retired to Connections never show in the Inspector', () => {
    const inInspector = (kind: PageLayoutKind, typeId: string) =>
      DETAIL_PAGE_REGISTRY[kind].some(r => r.typeId === typeId && (!r.visibleAt || r.visibleAt.some(s => s !== 'hover')));
    expect(inInspector('faction', 'allied_with')).toBe(false);
    expect(inInspector('faction', 'opposed')).toBe(false);
    expect(inInspector('group', 'who_leads_them')).toBe(false);
    expect(inInspector('item', 'who_gave_it')).toBe(false);
    expect(inInspector('event', 'who_was_there')).toBe(false);
  });
});

describe('the S2b rows resolve in the engine (THR-1910)', () => {
  it('resolve to the shared shapes, carry their row\'s width, and print no numeral', () => {
    const state = world();
    const shapes = new Set(['prose', 'chips', 'event-card', 'panel', 'portrait', 'triggers', 'links', 'cards']);
    const pages: [PageLayoutKind, string][] = [['place', 'town'], ['place', 'area'], ['faction', 'guild'], ['group', 'host'], ['item', 'blade'], ['content', 'trait.condition.wounded']];
    for (const [kind, id] of pages) {
      const list = sections(kind, id, state);
      expect(list.length, `${kind}:${id}`).toBeGreaterThan(0);
      for (const s of list) {
        expect(shapes.has(s.kind), `${kind}.${s.typeId}`).toBe(true);
        const row = DETAIL_PAGE_REGISTRY[kind].find(r => r.typeId === s.typeId);
        if (row?.visibleAt) expect(s.visibleAt, `${kind}.${s.typeId}`).toEqual(row.visibleAt);
        for (const text of playerText(s)) expect(text, `${kind}.${s.typeId}: "${text}"`).not.toMatch(/\d/);
      }
    }
  });

  it('the place rows tell walls, livelihood and the encounters here', () => {
    const byId = new Map(sections('place', 'town', world()).map(s => [s.typeId, s]));
    expect(JSON.stringify(byId.get('walls'))).toContain('Fortified');
    expect(byId.get('livelihood')?.kind).toBe('prose');
    const enc = byId.get('encounters_here');
    expect(enc?.kind).toBe('event-card');
  });

  it('conditions here read the place\'s has_trait edges (the modal\'s source), not properties.conditions', () => {
    const state = world();
    state.graph.getNode('town')!.properties.conditions = ['raw_key'];
    expect(sections('place', 'town', state).some(s => s.typeId === 'conditions_here')).toBe(false);
    state.graph.addEdge({ id: 'ht1', source: 'town', target: 'trait.condition.wounded', type: 'has_trait', properties: { ticksRemaining: 48, durationTicks: 96 } });
    const row = sections('place', 'town', state).find(s => s.typeId === 'conditions_here');
    expect(row?.kind).toBe('cards');
    expect(JSON.stringify(row)).toContain('Wounded');
    // The remaining-term bar reads the edge's `durationTicks`, the writers' spelling (review gate round 1).
    expect(row && row.kind === 'cards' ? row.tiles[0].meter : null).toBe(0.5);
    expect(JSON.stringify(row)).not.toContain('raw_key');
  });

  it('an Area page carries its facts — size, feature, danger and no numeral', () => {
    const row = sections('place', 'area', world()).find(s => s.typeId === 'area_facts');
    expect(row?.kind).toBe('panel');
    const text = JSON.stringify(row);
    expect(text).toContain('Size');
    expect(text).toContain('Danger');
  });

  it('the faction rows word their actions and outcomes, newest first, and print the conclave\'s term in words', () => {
    const byId = new Map(sections('faction', 'guild', world()).map(s => [s.typeId, s]));
    const actions = byId.get('recent_actions');
    expect(actions?.kind).toBe('event-card');
    const entries = actions && actions.kind === 'event-card' ? actions.entries ?? [] : [];
    expect(entries[0].prose).toBe('Raise army: failed.');
    expect(entries[1].prose).toBe('Seek fealty — Ashford: succeeded.');
    expect(JSON.stringify(byId.get('conclave'))).toContain('Who will lead?');
    expect(JSON.stringify(byId.get('means'))).toContain('Means');
  });

  it('the artifact rows carry its tags in the tag-chip words, never the raw key', () => {
    const tags = sections('item', 'blade', world()).find(s => s.typeId === 'tags');
    expect(tags?.kind).toBe('chips');
    const labels = tags && tags.kind === 'chips' ? tags.chips.map(c => c.label) : [];
    expect(labels).toEqual(['iron', 'weapon']);
  });

  it('the attachment card withholds mechanicalSummary, words its triggers and drops "(Nx)"', () => {
    const state = world();
    const list = sections('content', 'trait.condition.wounded', state);
    const byId = new Map(list.map(s => [s.typeId, s]));
    expect(JSON.stringify(list)).not.toContain('-0.2 Iron');
    expect(JSON.stringify(byId.get('effect'))).toContain('rest heals it');
    const triggers = byId.get('triggers');
    expect(triggers?.kind).toBe('triggers');
    const row = triggers && triggers.kind === 'triggers' ? triggers.triggers[0] : null;
    expect(row?.condition).toBe('Rest');
    expect(row?.effectSummary).toBe('lifts a condition');
    expect(JSON.stringify(byId.get('duration'))).toContain('Lasts');
    expect(byId.get('what_it_is')?.kind).toBe('prose');
    // The attachment page composes through the table.
    const page = buildSubjectPage(state, { kind: 'attachment', id: 'trait.condition.wounded', name: 'Wounded' });
    expect(page.body.map(s => s.typeId)).toContain('triggers');
    expect(page.header.kindLabel).not.toMatch(/_/);
  });

  it('the S2b rows never resolve without a state (the hover card stays fail-soft)', () => {
    const state = world();
    const graphOnly = (kind: PageLayoutKind, id: string) =>
      composeSections(kind, { nodeId: id, pageKind: kind, graph: state.graph, seed: 1, tick: 1 }).map(s => s.typeId);
    expect(graphOnly('place', 'town')).not.toContain('walls');
    expect(graphOnly('faction', 'guild')).not.toContain('recent_actions');
    expect(graphOnly('item', 'blade')).not.toContain('tags');
  });
});

describe('the army objective names its target (THR-1910 fix — objective.targetNodeId)', () => {
  it('what_they_are_doing reads the army type\'s targetNodeId and names the town', () => {
    const row = sections('group', 'host', world()).find(s => s.typeId === 'what_they_are_doing');
    expect(row?.kind).toBe('prose');
    expect(JSON.stringify(row)).toContain('Ashford');
  });
});
