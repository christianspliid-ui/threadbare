/**
 * Sheet parity (THR-1876 § D7.11) — every field a retiring surface shows has a home.
 *
 * The person block (THR-1909, S2a): each field from the plan brainstorm's § Field
 * inventories → Person (`Docs/plans/2026-10-14-thr-1876-the-inspector-brainstorm.md`)
 * names its new home — a row `typeId` in `DETAIL_PAGE_REGISTRY.actor`, a header field of
 * `SubjectHeaderVM`, a Connections group, the toolbar, or `retired:` with one of the
 * lawful reasons. The test fails when a named home does not exist. S4 may not delete
 * `AgentProfileModal`, its tabs or `ThreadDetailView` until this block is green.
 *
 * S2b adds the place, faction, army, artifact and attachment blocks.
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../../graph';
import type { GameState } from '../../../types/gameState';
import type { InspectorTabId, PageSurface, Section } from '../../../types/detailPage';
import { DETAIL_PAGE_REGISTRY } from '../../../data/detailPageTemplates';
import { CONNECTION_GROUP_ORDER, type ConnectionGroupId } from '../../../data/view-content';
import { composeSections } from '../../detailPageGenerator';
import { buildSubjectPage } from '../subjects/subjectPage';
import type { SubjectHeaderVM } from '../subjects/subjectTypes';

type Home =
  | { row: string }
  | { header: keyof SubjectHeaderVM }
  | { connections: ConnectionGroupId }
  | { toolbar: 'follow' }
  | { retired: RetiredReason; why: string };

/** The only reasons a field may retire (§ D7.11). */
type RetiredReason = 'raw-number-or-key' | 'duplicate-of-kept-row' | 'relation-in-connections' | 'dead-source';

/** The person field inventory → its home. One line per field the brainstorm lists. */
const PERSON_FIELDS: Record<string, Home> = {
  // Header
  'header: portrait': { header: 'visual' },
  'header: name + rarity': { header: 'name' },
  'header: archetype epithet': { header: 'epithet' },
  'header: knowledge level': { header: 'standing' },
  'header: is at': { header: 'whereLine' },
  'header: attuned sphere': { header: 'standing' },
  'header: dominion chip': { header: 'standing' },
  'header: dominion line': { row: 'dominion' },
  'header: under your hand': { row: 'under_your_hand' },
  'header: court position (scry)': { header: 'standing' },
  // Overview
  'overview: death cause / by / past': { row: 'fate' },
  'overview: location': { header: 'whereLine' },
  'overview: sphere': { header: 'standing' },
  'overview: archetype': { row: 'who_they_are' },
  'overview: calling': { row: 'who_they_are' },
  'overview: god mark': { row: 'who_they_are' },
  'overview: rite line': { row: 'who_they_are' },
  'overview: means': { row: 'who_they_are' },
  'overview: intention': { row: 'intention' },
  'overview: faction · culture line': { connections: 'belongsTo' },
  'overview: faction section (heraldry, link, rank)': { connections: 'belongsTo' },
  'overview: hold line': { row: 'allegiance' },
  'overview: faction standing (word + bar)': { row: 'allegiance' },
  'overview: company / army / network membership': { connections: 'belongsTo' },
  'overview: company cohesion, network places, rivals': { row: 'company' },
  'overview: core tracks': { row: 'core' },
  'overview: nature': { row: 'nature' },
  'overview: knows the way to': { row: 'who_they_are' },
  'overview: reputation + standings': { row: 'reputation' },
  'overview: personality + traits': { row: 'personality' },
  'overview: words': { row: 'words' },
  'overview: origin': { row: 'origin' },
  // The thread column's two lines (THR-1963), carried across by the parity rule.
  'thread: their work': { row: 'current_work' },
  'thread: what they want most': { row: 'leading_ambition' },
  // Prowess
  'prowess: domains': { row: 'domains' },
  'prowess: domain magnitude dots': { retired: 'raw-number-or-key', why: 'Law 10: pips mean odds only; the rank word stays' },
  'prowess: conditions': { row: 'conditions' },
  'prowess: bestowed powers': { row: 'bestowed_powers' },
  // Attachments
  'attachments: companions': { connections: 'who' },
  'attachments: slot groups': { row: 'slots' },
  'attachments: (n/cap) count': { retired: 'raw-number-or-key', why: 'Law 13: the tiles sit together; the cap is a slot rule' },
  'attachments: knows': { row: 'knows' },
  'attachments: inactive': { row: 'inactive' },
  // Bonds
  'bonds: faction + rank + standing': { retired: 'duplicate-of-kept-row', why: 'PC-6: Connections belongs-to and the allegiance row' },
  'bonds: relationships': { connections: 'friendsAndFoes' },
  'bonds: getTrustDescriptor(0.5, …)': { retired: 'dead-source', why: 'a hard-coded input; the row uses the bond\'s own strength word' },
  'bonds: blood': { connections: 'friendsAndFoes' },
  'bonds: agreements': { connections: 'holdsKnows' },
  'bonds: disposition': { row: 'disposition' },
  'bonds: what she is to him': { row: 'what_she_is_to_him' },
  'bonds: threads between them': { row: 'threads_between_them' },
  // Journey
  'journey: last seen': { header: 'whereLine' },
  'journey: follow toggle': { toolbar: 'follow' },
  'journey: the work': { row: 'the_work' },
  'journey: ambitions': { row: 'ambitions' },
  'journey: arc so far': { row: 'arc_so_far' },
  // Chronicle
  'chronicle: their story': { row: 'their_story' },
  'chronicle: timeline': { row: 'timeline' },
  'chronicle: full account': { row: 'full_account' },
  'chronicle: interaction record': { row: 'interaction_record' },
  'chronicle: completed ambitions': { row: 'completed_ambitions' },
  // Chapters
  'chapters: chapter rows': { row: 'chapters' },
  // ThreadDetailView
  'thread: category, name, tier': { header: 'name' },
  'thread: revealed notices': { row: 'revealed_notices' },
  'thread: domains grid': { row: 'domains' },
  'thread: sphere': { header: 'standing' },
  'thread: quintessence': { retired: 'dead-source', why: 'never set on the card' },
  'thread: activity': { header: 'doingLine' },
  'thread: on their mind': { row: 'intention' },
  'thread: under your hand': { row: 'under_your_hand' },
  'thread: story so far': { row: 'story_so_far' },
  'thread: designs': { row: 'designs' },
  'thread: intelligence': { row: 'intelligence' },
  // Registry rows
  'registry: portrait_with_disposition': { row: 'portrait_with_disposition' },
  'registry: recent_encounters (hover)': { row: 'recent_encounters' },
  'registry: faction_allegiances (hover)': { row: 'faction_allegiances' },
  'registry: notable_capabilities': { retired: 'dead-source', why: 'reads properties.reaches, which no actor writes; domains replaces it' },
};

/** Plan § D7.1 — the S2a rows' tab and width. */
const DWF: readonly PageSurface[] = ['docked', 'wide', 'full'];
const WF: readonly PageSurface[] = ['wide', 'full'];
const S2A_ROWS: Record<string, { tab: InspectorTabId; at: readonly PageSurface[] }> = {
  fate: { tab: 'overview', at: DWF },
  story_so_far: { tab: 'overview', at: DWF },
  revealed_notices: { tab: 'overview', at: DWF },
  under_your_hand: { tab: 'overview', at: DWF },
  intention: { tab: 'overview', at: DWF },
  current_work: { tab: 'overview', at: DWF },
  leading_ambition: { tab: 'overview', at: DWF },
  who_they_are: { tab: 'overview', at: DWF },
  allegiance: { tab: 'overview', at: DWF },
  company: { tab: 'overview', at: WF },
  nature: { tab: 'overview', at: DWF },
  core: { tab: 'overview', at: WF },
  personality: { tab: 'overview', at: WF },
  reputation: { tab: 'overview', at: DWF },
  words: { tab: 'overview', at: WF },
  origin: { tab: 'overview', at: WF },
  domains: { tab: 'prowess', at: DWF },
  conditions: { tab: 'prowess', at: DWF },
  bestowed_powers: { tab: 'prowess', at: DWF },
  slots: { tab: 'attachments', at: DWF },
  knows: { tab: 'attachments', at: DWF },
  inactive: { tab: 'attachments', at: WF },
  disposition: { tab: 'bonds', at: DWF },
  the_work: { tab: 'journey', at: DWF },
  designs: { tab: 'journey', at: DWF },
  ambitions: { tab: 'journey', at: DWF },
  arc_so_far: { tab: 'journey', at: DWF },
  their_story: { tab: 'chronicle', at: WF },
  timeline: { tab: 'chronicle', at: WF },
  full_account: { tab: 'chronicle', at: WF },
  interaction_record: { tab: 'chronicle', at: WF },
  completed_ambitions: { tab: 'chronicle', at: WF },
  intelligence: { tab: 'chronicle', at: WF },
  chapters: { tab: 'chapters', at: WF },
};

const ASC = 'asc';

function world(): GameState {
  const graph = new WorldGraph();
  graph.addNode({ id: ASC, type: 'actor', name: 'Vara', properties: { actorType: 'ascendant' } });
  graph.addNode({ id: 'town', type: 'location', name: 'Ashford', properties: { locationType: 'town', hexCol: 2, hexRow: 2 } });
  graph.addNode({
    id: 'kael', type: 'actor', name: 'Kael',
    properties: {
      actorType: 'individual', npcRole: 'smith', locationId: 'town',
      wealth: 70, cooperationStrategy: 'grudger',
      coreProfile: { core_honesty: 0.9 },
      domainCapabilities: { iron: 0.6, gold: 0.2, shadow: 0.1, veil: 0.1, heart: 0.3, eye: 0.2, stone: 0.4, star: 0.1 },
    },
  });
  graph.addEdge({ id: 'at1', source: 'kael', target: 'town', type: 'located_at', properties: {} });
  graph.addEdge({ id: 'th1', source: ASC, target: 'kael', type: 'thread', properties: { tier: 2, courtPosition: 'the_first' } });
  // The god's own avatar is read whole (`transparent`), so every gate opens.
  graph.addEdge({ id: 'av1', source: 'kael', target: ASC, type: 'avatar_of', properties: {} });
  return {
    graph,
    ascendantId: ASC,
    tick: 400,
    seed: 42,
    tiles: [],
    recentEvents: [],
    familiarityMap: new Map(),
    essencePool: {},
    unifiedActions: [],
    encounterProgress: [],
    controlEffects: [],
    chapterArchive: [],
    strategicState: { projects: [], controls: [], history: [] },
    ascendantIdentity: { divineName: 'Vara', hungerName: 'Witness', sphereAlignment: { primary: 'mind', secondary: 'spirit' } },
  } as unknown as GameState;
}

function personSections(state: GameState, extra: Record<string, unknown> = {}): Section[] {
  return composeSections('actor', {
    nodeId: 'kael', pageKind: 'actor', graph: state.graph, seed: state.seed, tick: state.tick, protagonistId: ASC, state, ...extra,
  });
}

/** Player-facing strings of a section — every string leaf except ids, refs and tooltip ids. */
function playerText(section: Section): string[] {
  const out: string[] = [];
  const skip = new Set(['typeId', 'source', 'tab', 'visibleAt', 'ref', 'clickRef', 'eventRef', 'tooltipId', 'labelTooltipId', 'sphere', 'tier', 'kind', 'dataKey', 'termRefs', 'layers']);
  const walk = (v: unknown, key: string) => {
    if (skip.has(key)) return;
    if (typeof v === 'string') out.push(v);
    else if (Array.isArray(v)) v.forEach(x => walk(x, ''));
    else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) walk(x, k);
  };
  walk(section, '');
  return out;
}

describe('sheet parity — person (THR-1909, plan § D7.11)', () => {
  const actorRows = new Set(DETAIL_PAGE_REGISTRY.actor.map(r => r.typeId));

  it('every person field has a home that exists, or a lawful retired reason', () => {
    const page = buildSubjectPage(world(), { kind: 'agent', id: 'kael', name: 'Kael' });
    const headerKeys = new Set(Object.keys(page.header));
    const missing: string[] = [];
    for (const [field, home] of Object.entries(PERSON_FIELDS)) {
      if ('row' in home && !actorRows.has(home.row)) missing.push(`${field} → row ${home.row}`);
      if ('header' in home && !headerKeys.has(home.header)) missing.push(`${field} → header ${home.header}`);
      if ('connections' in home && !(CONNECTION_GROUP_ORDER as readonly string[]).includes(home.connections)) missing.push(`${field} → connections ${home.connections}`);
      if ('toolbar' in home && !page.header.follow) missing.push(`${field} → toolbar follow`);
      if ('retired' in home && !home.why) missing.push(`${field} → retired without a why`);
    }
    expect(missing).toEqual([]);
  });

  it('notable_capabilities is retired from the table', () => {
    expect(actorRows.has('notable_capabilities')).toBe(false);
  });

  it('each S2a row sits in the plan\'s tab at the plan\'s widths', () => {
    const wrong: string[] = [];
    for (const [typeId, want] of Object.entries(S2A_ROWS)) {
      const row = DETAIL_PAGE_REGISTRY.actor.find(r => r.typeId === typeId);
      if (!row) { wrong.push(`${typeId}: missing`); continue; }
      if (row.tab !== want.tab) wrong.push(`${typeId}: tab ${row.tab} ≠ ${want.tab}`);
      if (JSON.stringify(row.visibleAt) !== JSON.stringify(want.at)) wrong.push(`${typeId}: at ${JSON.stringify(row.visibleAt)}`);
    }
    expect(wrong).toEqual([]);
  });

  it('docked shows five tabs; Chronicle and Chapters are wide-and-full only', () => {
    const tabsAt = (surface: PageSurface) =>
      new Set(DETAIL_PAGE_REGISTRY.actor.filter(r => !r.visibleAt || r.visibleAt.includes(surface)).map(r => r.tab ?? 'overview'));
    const docked = tabsAt('docked');
    expect([...docked].sort()).toEqual(['attachments', 'bonds', 'journey', 'overview', 'prowess']);
    const wide = tabsAt('wide');
    expect(wide.has('chronicle')).toBe(true);
    expect(wide.has('chapters')).toBe(true);
  });
});

describe('the person rows resolve in the engine (THR-1909)', () => {
  it('resolve to the shared shapes, carry their row\'s tab and width, and print no numeral', () => {
    const sections = personSections(world());
    const shapes = new Set(['prose', 'chips', 'event-card', 'panel', 'portrait', 'triggers', 'links', 'cards']);
    expect(sections.length).toBeGreaterThan(5);
    for (const s of sections) {
      expect(shapes.has(s.kind), s.typeId).toBe(true);
      const row = DETAIL_PAGE_REGISTRY.actor.find(r => r.typeId === s.typeId);
      if (row?.visibleAt) expect(s.visibleAt, s.typeId).toEqual(row.visibleAt);
      for (const text of playerText(s)) expect(text, `${s.typeId}: "${text}"`).not.toMatch(/\d/);
    }
  });

  it('who they are, nature words, disposition and the empty Journey lines read for a person', () => {
    const byId = new Map(personSections(world()).map(s => [s.typeId, s]));
    const who = byId.get('who_they_are');
    expect(who?.kind).toBe('panel');
    expect(JSON.stringify(who)).toContain('Means');
    expect(byId.get('disposition')?.kind).toBe('panel');
    expect(JSON.stringify(byId.get('disposition'))).toContain('Forgives slowly');
    expect(JSON.stringify(byId.get('the_work'))).toContain('No long work under way.');
    expect(byId.get('arc_so_far')?.kind).toBe('event-card');
    expect(byId.get('arc_so_far')?.labelTooltipId).toBe('ui.arc_strip');
    // The core row draws a bar beside its word (a retiring surface drew one) — never a numeral.
    const core = byId.get('core');
    expect(core?.kind).toBe('panel');
  });

  it('the work and the leading ambition come from the engine\'s one work resolver', () => {
    const state = world();
    (state as unknown as { strategicState: unknown }).strategicState = {
      projects: [{ projectId: 'p1', templateId: 'missing_template', actorId: 'kael', status: 'active', progress: 5, progressRequired: 10, halts: 0 }],
      controls: [],
      history: [],
    };
    const byId = new Map(personSections(state).map(s => [s.typeId, s]));
    expect(byId.get('the_work')?.kind).toBe('cards');
    expect(byId.get('current_work')?.labelTooltipId).toBe('ui.thread_work');
  });

  it('Word of them shows the notices a badge click revealed, for this person only (S3 passes the snapshot)', () => {
    const state = world();
    expect(personSections(state).some(s => s.typeId === 'revealed_notices')).toBe(false);
    const revealed = { anchorId: 'kael', lines: [
      { message: 'Kael won the bridge toll.', tick: 390 },
      { message: 'Kael argued at the forge.', tick: 300 },
    ] };
    const row = personSections(state, { revealedNotices: revealed }).find(s => s.typeId === 'revealed_notices');
    expect(row?.kind).toBe('prose');
    const text = row && row.kind === 'prose' ? row.prose : '';
    expect(text.indexOf('bridge toll')).toBeLessThan(text.indexOf('forge'));
    const other = personSections(state, { revealedNotices: { anchorId: 'someone', lines: revealed.lines } });
    expect(other.some(s => s.typeId === 'revealed_notices')).toBe(false);
  });

  it('the person rows never resolve without a state (the hover card stays fail-soft)', () => {
    const state = world();
    const sections = composeSections('actor', { nodeId: 'kael', pageKind: 'actor', graph: state.graph, seed: 1, tick: 1 });
    const s2a = new Set(Object.keys(S2A_ROWS));
    expect(sections.filter(s => s2a.has(s.typeId))).toEqual([]);
  });
});
