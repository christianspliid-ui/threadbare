/**
 * selectSubjectPage — what the Inspector renders for any subject the router opens
 * (THR-1822 § D7; THR-1876 § D5, § D7).
 *
 * One exhaustive dispatch over every `WorldRefKind`, content refs and graph event nodes.
 * Every page shares a header, an Act row where cards can target the subject, a body that
 * is **the page-layout table's rows** (never a body hand-built here — iterating a page is
 * editing `DETAIL_PAGE_REGISTRY`), and Connections last. The land page adds *In this land*.
 *
 * The body carries each row's `visibleAt` and `tab`; this selector never drops a section by
 * width — the Inspector filters by its size.
 */
import type { AnyRef, ContentRef } from '../../../types/contentRef';
import { isContentRef } from '../../../types/contentRef';
import type { WorldRef, WorldRefKind } from '../../../types/worldRef';
import { parseHexRefId } from '../../../types/worldRef';
import type { GameState } from '../../../types/gameState';
import type { GraphNode } from '../../../types/graph';
import type { Section } from '../../../types/detailPage';
import type { WorldGraph } from '../../graph';
import { generateDetailPage, generateGodPage, generateLandPage, generateRecordPage, subtitleForNode, composeSections } from '../../detailPageGenerator';
import { resolveToParentLocation, isPlaceNode } from '../../sublocationShape';
import { isArmyGroupNode } from '../../groupShape';
import { getFamiliarity, getKnowledgeLevel } from '../../familiarity';
import { dominionSheetVM } from '../../dominionViewModels';
import { hexKey as toHexKey } from '../../hexActorIndex';
import { getHexRegionData } from '../../hexRegion';
import { resolveContentEntry } from '../../contentEntryResolver';
import { SURFACE_BY_CONTENT_KIND } from '../../../data/surface-registry';
import { INSPECTOR_WORDS, positionalDangerWord } from '../../../data/view-content';
import type { ViewSelector } from '../readView';
import { readView } from '../readView';
import { buildConnections, containmentRows, type ConnectionSubject } from '../connections';
import { buildLandIndex } from '../landIndex';
import { hexContentsSelector } from '../hexContents';
import { buildActOn, type ActOnTarget } from './actOn';
import { landNameFor } from './landName';
import { biomeParagraphs, landHexSeed } from './landProse';
import { tileAt } from './pageResolvers';
import type {
  ContentCardVM,
  GenericSubjectPageVM,
  LandPageVM,
  StateChipVM,
  SubjectHeaderVM,
  SubjectPageVM,
} from './subjectTypes';
import type { RefRow } from '../types';

/** What the Inspector can hold: any ref, or a graph event node (which has no WorldRef). */
export type InspectorSubject = AnyRef | { kind: 'event-node'; id: string; name?: string };

/** A stable key for a subject: `agent:npc_98`, `hex:12,7`, `event-node:evt_3`. */
export function subjectKeyOf(subject: InspectorSubject): string {
  return `${subject.kind}:${subject.id}`;
}

/** Kinds whose card opens wide (THR-1827 call 12 — factions and past events). */
const OPENS_WIDE: ReadonlySet<string> = new Set<WorldRefKind | 'event-node'>(['faction', 'encounter', 'journey', 'receipt', 'event-node']);

function header(partial: Partial<SubjectHeaderVM> & Pick<SubjectHeaderVM, 'name' | 'kindLabel' | 'visual'>): SubjectHeaderVM {
  return {
    ref: null,
    epithet: null,
    whereLine: [],
    standing: [],
    doingLine: null,
    lede: null,
    mapLocated: false,
    hexKey: null,
    opensWide: false,
    follow: false,
    ...partial,
  };
}

function sentenceCase(word: string): string {
  return word.length > 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word;
}

function missingPage(subject: InspectorSubject | null): GenericSubjectPageVM {
  const key = subject ? subjectKeyOf(subject) : 'missing:';
  return {
    pageKind: 'missing',
    subjectKey: key,
    layoutKind: 'record',
    header: header({ name: INSPECTOR_WORDS.missingName, kindLabel: INSPECTOR_WORDS.missingLine, visual: { kind: 'missing', id: key, portraitGate: 'shown' } }),
    actOn: null,
    body: [{ kind: 'prose', typeId: 'unknown_stub', label: 'What we know', gold: false, tier: 'routine', source: 'missingPage', prose: INSPECTOR_WORDS.missingLine.charAt(0).toUpperCase() + INSPECTOR_WORDS.missingLine.slice(1) + '.' }],
    connections: { title: 'Connections', groups: [] },
  };
}

/** The Dominion band word as a standing chip, when the read answers for this object. */
function dominionChip(state: GameState, id: string): StateChipVM[] {
  const vm = dominionSheetVM(state.graph, state.ascendantId, id, state.controlEffects);
  return vm ? [{ label: vm.word, tooltipId: vm.tooltipId }] : [];
}

function hexOfNode(graph: WorldGraph, node: GraphNode): string | null {
  let place: GraphNode | undefined = node;
  if (node.type !== 'location') {
    const at = graph.getOutgoingEdges(node.id, 'located_at')[0];
    place = at ? graph.getNode(at.target) : undefined;
  }
  const loc = place ? resolveToParentLocation(graph, place) : undefined;
  const col = loc?.properties.hexCol as number | undefined;
  const row = loc?.properties.hexRow as number | undefined;
  return col != null && row != null ? toHexKey(col, row) : null;
}

function whereOf(state: GameState, node: GraphNode): RefRow[] {
  const graph = state.graph;
  if (node.type === 'location') return containmentRows(graph, state, node, false).map(r => ({ ref: r.ref, name: r.name }));
  const at = graph.getOutgoingEdges(node.id, 'located_at')[0];
  return containmentRows(graph, state, at ? graph.getNode(at.target) : undefined, true).map(r => ({ ref: r.ref, name: r.name }));
}

/** The body for a graph page kind, from the table, with the god as the protagonist. */
function graphBody(state: GameState, nodeId: string, pageKind: Parameters<typeof generateDetailPage>[0]['pageKind']): Section[] {
  // `generateDetailPage` keeps its legacy signature and cache; the Inspector's body reads
  // the same rows through the shared composer with the state in context, so state rows
  // (the Dominion row) resolve.
  return composeSections(pageKind, {
    nodeId,
    pageKind,
    graph: state.graph,
    seed: state.seed,
    tick: state.tick,
    protagonistId: state.ascendantId,
    state,
  });
}

function graphPage(state: GameState, ref: WorldRef, node: GraphNode): GenericSubjectPageVM {
  const graph = state.graph;
  const actorType = node.properties.actorType;
  const key = subjectKeyOf(ref);
  const hk = hexOfNode(graph, node);
  const base = {
    subjectKey: key,
    header: header({
      ref,
      name: node.name,
      kindLabel: 'Thing',
      visual: { kind: ref.kind, id: node.id, portraitGate: 'shown' },
      whereLine: whereOf(state, node),
      mapLocated: hk !== null,
      hexKey: hk,
      opensWide: OPENS_WIDE.has(ref.kind),
    }),
  };

  // The god's own sheet is an `agent` ref whose actor is the ascendant (§ D1).
  if (node.id === state.ascendantId) return godPage(state, ref);

  if (node.type === 'actor' && actorType === 'faction') {
    return {
      ...base,
      pageKind: 'faction',
      layoutKind: 'faction',
      header: { ...base.header, kindLabel: sentenceCase(subtitleForNode(node, 'faction')), standing: dominionChip(state, node.id) },
      actOn: null,
      body: graphBody(state, node.id, 'faction'),
      connections: buildConnections(graph, state, { cls: 'faction', id: node.id }),
    };
  }
  if (node.type === 'actor' && (actorType === 'group' || isArmyGroupNode(node))) {
    return {
      ...base,
      pageKind: 'army',
      layoutKind: 'group',
      header: { ...base.header, kindLabel: sentenceCase(subtitleForNode(node, 'group')), follow: true },
      actOn: null,
      body: graphBody(state, node.id, 'group'),
      connections: buildConnections(graph, state, { cls: 'army', id: node.id }),
    };
  }
  if (node.type === 'actor') {
    // Fail-soft: a state without its familiarity map (a fixture, an old save) reads a stranger.
    const fam = state.familiarityMap;
    const level = getKnowledgeLevel(fam && typeof fam.get === 'function' ? getFamiliarity(fam, node.id) : 0);
    const thread = graph.getOutgoingEdges(state.ascendantId, 'thread').find(e => e.target === node.id);
    const standing: StateChipVM[] = [];
    if (thread?.properties.courtPosition === 'first') standing.push({ label: INSPECTOR_WORDS.factFirst.replace(/^your/, 'Your') });
    standing.push({ label: sentenceCase(level), tooltipId: `knowledge.${level}` });
    standing.push(...dominionChip(state, node.id));
    const role = (node.properties.npcRole ?? node.properties.role) as string | undefined;
    return {
      ...base,
      pageKind: 'person',
      layoutKind: 'actor',
      header: {
        ...base.header,
        kindLabel: role ? sentenceCase(role.replace(/[-_]+/g, ' ')) : sentenceCase(subtitleForNode(node, 'actor')),
        visual: { kind: ref.kind, id: node.id, portraitGate: level === 'stranger' ? 'silhouette' : 'shown' },
        standing,
        follow: true,
      },
      actOn: buildActOn(state, { kind: 'agent', id: node.id }, node.name),
      body: graphBody(state, node.id, 'actor'),
      connections: buildConnections(graph, state, { cls: 'person', id: node.id }),
    };
  }
  if (node.type === 'location' || node.type === 'region') {
    const target: ActOnTarget = { kind: 'location', id: node.id };
    return {
      ...base,
      pageKind: 'location',
      layoutKind: 'place',
      header: {
        ...base.header,
        kindLabel: node.type === 'region' ? 'Area' : sentenceCase(subtitleForNode(node, 'place')),
        standing: dominionChip(state, node.id),
      },
      actOn: node.type === 'region' ? null : buildActOn(state, target, node.name),
      body: graphBody(state, node.id, 'place'),
      connections: node.type === 'region' ? { title: 'Connections', groups: [] } : buildConnections(graph, state, { cls: 'location', id: node.id }),
    };
  }
  if (node.type === 'artifact' || node.type === 'artifact_legendary') {
    const rarity = node.type === 'artifact_legendary' ? [{ label: 'Legendary', tooltipId: 'rarity.legendary' }] : [];
    return {
      ...base,
      pageKind: 'artifact',
      layoutKind: 'item',
      header: { ...base.header, kindLabel: sentenceCase(subtitleForNode(node, 'item')), standing: [...rarity, ...dominionChip(state, node.id)] },
      actOn: buildActOn(state, { kind: 'artifact', id: node.id }, node.name),
      body: graphBody(state, node.id, 'item'),
      connections: buildConnections(graph, state, { cls: 'artifact', id: node.id }),
    };
  }
  return missingPage(ref);
}

function godPage(state: GameState, ref: WorldRef | null): GenericSubjectPageVM {
  const graph = state.graph;
  const node = graph.getNode(state.ascendantId);
  // The rail's identity reads (selectAscendantIdentityView) need GameView's archetype; the
  // god's page reads the same two words off the identity the god was created from.
  const identity = state.ascendantIdentity;
  const name = identity?.divineName ?? node?.name ?? 'Your god';
  const epithet = identity?.hungerName ?? null;
  const avatar = graph.getIncomingEdges(state.ascendantId, 'avatar_of')[0];
  const avatarNode = avatar ? graph.getNode(avatar.source) : undefined;
  return {
    pageKind: 'god',
    subjectKey: `agent:${state.ascendantId}`,
    layoutKind: 'god',
    header: header({
      ref,
      name,
      epithet,
      kindLabel: INSPECTOR_WORDS.godKind,
      visual: { kind: 'god', id: state.ascendantId, portraitGate: 'shown' },
      whereLine: avatarNode ? whereOf(state, avatarNode) : [],
    }),
    actOn: null,
    body: generateGodPage({ state }).sections,
    connections: buildConnections(graph, state, { cls: 'god', id: state.ascendantId }),
  };
}

function landPage(state: GameState, col: number, row: number, runtimeState: { runtime: Parameters<typeof readView>[0] }): LandPageVM {
  const key = toHexKey(col, row);
  const tile = tileAt(state, col, row);
  const name = landNameFor(state, col, row);
  const lede = tile ? (biomeParagraphs(tile.terrain, landHexSeed(state.seed, col, row))[0].split(/(?<=[.!?])\s/)[0] ?? null) : null;
  const standing: StateChipVM[] = [];
  if (tile) standing.push({ label: positionalDangerWord(tile.dangerLevel ?? 0), tooltipId: 'ui.land.danger' });
  const contents = readView(runtimeState.runtime, state, hexContentsSelector, { hexKey: key }, state.tiles);
  const inThisLand = buildLandIndex(contents, state);
  const holder = inThisLand.rows.find(r => r.id === 'holder');
  if (holder && holder.rows.length === 0) standing.push({ label: INSPECTOR_WORDS.heldByNoOne, tooltipId: 'ui.land.holder' });
  const region = tile?.regionId ? getHexRegionData(state.graph, tile.regionId) : null;
  const whereLine: RefRow[] = region ? [{ ref: { kind: 'area', id: region.regionId, name: region.regionName }, name: region.regionName }] : [];
  const subject: ConnectionSubject = { cls: 'land', col, row };
  return {
    pageKind: 'land',
    subjectKey: `hex:${key}`,
    layoutKind: 'land',
    header: header({
      ref: { kind: 'hex', id: key, name },
      name,
      kindLabel: INSPECTOR_WORDS.landKind,
      visual: { kind: 'land', id: key, portraitGate: 'shown' },
      whereLine,
      standing,
      lede,
      mapLocated: true,
      hexKey: key,
    }),
    actOn: buildActOn(state, { kind: 'hex', col, row }, name, true),
    body: generateLandPage({ state, col, row }).sections,
    connections: buildConnections(state.graph, state, subject),
    inThisLand,
  };
}

function contentPage(state: GameState, ref: ContentRef): ContentCardVM | GenericSubjectPageVM {
  let entry: ReturnType<typeof resolveContentEntry> = null;
  try {
    entry = resolveContentEntry(ref);
  } catch {
    entry = null;
  }
  if (!entry) return missingPage(ref);
  const row = SURFACE_BY_CONTENT_KIND[ref.kind];
  const body = composeSections('content', { nodeId: ref.id, pageKind: 'content', graph: state.graph, seed: state.seed, tick: state.tick, contentRef: ref, state });
  return {
    pageKind: 'content',
    subjectKey: subjectKeyOf(ref),
    layoutKind: 'content',
    header: header({ name: entry.name, kindLabel: sentenceCase(entry.kindWord), visual: { kind: 'content', id: ref.id, portraitGate: 'shown' } }),
    actOn: null,
    body,
    connections: { title: 'Connections', groups: [] },
    // The Codex keeps its own home; "Read in the Codex" renders only when the kind reaches it.
    codexEntryId: row?.sheet === 'codex' ? ref.id : null,
  };
}

/**
 * An attachment ref names a template — committed content (THR-1822 § D7), so it opens as a
 * content card. S1 shows what the template says of itself; S2b (THR-1910) moves the
 * attachment sheet's effect, duration and trigger rows in.
 */
function attachmentPage(state: GameState, ref: WorldRef): ContentCardVM | GenericSubjectPageVM {
  const node = state.graph.getNode(ref.id);
  if (!node) return missingPage(ref);
  const text = (node.properties.description ?? node.properties.flavorText) as string | undefined;
  const body: Section[] = text
    ? [{ kind: 'prose', typeId: 'what_it_is', label: 'What it is', gold: true, tier: 'routine', source: 'attachmentTemplate', prose: text }]
    : [];
  const kindWord = (node.properties.subcategory ?? node.properties.category) as string | undefined;
  return {
    pageKind: 'content',
    subjectKey: subjectKeyOf(ref),
    layoutKind: 'content',
    header: header({ ref, name: node.name, kindLabel: kindWord ? sentenceCase(kindWord.replace(/[-_]+/g, ' ')) : INSPECTOR_WORDS.contentKind, visual: { kind: 'content', id: ref.id, portraitGate: 'shown' } }),
    actOn: null,
    body,
    connections: { title: 'Connections', groups: [] },
    codexEntryId: null,
  };
}

function recordPage(state: GameState, ref: WorldRef): GenericSubjectPageVM {
  const record = { kind: ref.kind as 'encounter' | 'journey' | 'receipt', id: ref.id, name: ref.name };
  const chapter = record.kind === 'encounter' ? (state.chapterArchive ?? []).find(c => c.actionId === ref.id) : undefined;
  const receipt = record.kind === 'receipt' ? (state.playerActionReceipts ?? []).find(r => r.id === ref.id) : undefined;
  const name = chapter?.templateName ?? receipt?.templateName ?? ref.name ?? INSPECTOR_WORDS.recordUnnamed;
  const eventNodeId = chapter?.eventNodeId && state.graph.getNode(chapter.eventNodeId) ? chapter.eventNodeId : undefined;
  return {
    pageKind: 'record',
    subjectKey: subjectKeyOf(ref),
    layoutKind: 'record',
    header: header({ ref, name, kindLabel: INSPECTOR_WORDS.recordKind, visual: { kind: 'record', id: ref.id, portraitGate: 'shown' }, opensWide: true }),
    actOn: null,
    body: generateRecordPage({ state, record }).sections,
    connections: eventNodeId ? buildConnections(state.graph, state, { cls: 'record', id: eventNodeId }) : { title: 'Connections', groups: [] },
  };
}

function eventNodePage(state: GameState, id: string): GenericSubjectPageVM {
  const node = state.graph.getNode(id);
  if (!node || node.type !== 'event') return missingPage({ kind: 'event-node', id });
  return {
    pageKind: 'record',
    subjectKey: `event-node:${id}`,
    layoutKind: 'event',
    header: header({ name: node.name, kindLabel: INSPECTOR_WORDS.recordKind, visual: { kind: 'record', id, portraitGate: 'shown' }, opensWide: true }),
    actOn: null,
    body: generateRecordPage({ state, eventNodeId: id }).sections,
    connections: buildConnections(state.graph, state, { cls: 'record', id }),
  };
}

/**
 * The one dispatcher. Exhaustive over `WorldRefKind` (a new kind is a compile error here),
 * content refs and graph event nodes. A gone or mismatched subject is the missing page.
 */
export function buildSubjectPage(state: GameState, subject: InspectorSubject, runtime: Parameters<typeof readView>[0] = null): SubjectPageVM {
  if (subject.kind === 'event-node') return eventNodePage(state, subject.id);
  if (isContentRef(subject as AnyRef)) return contentPage(state, subject as ContentRef);
  const ref = subject as WorldRef;
  const graph = state.graph;
  switch (ref.kind) {
    case 'hex': {
      const at = parseHexRefId(ref.id);
      return at && tileAt(state, at.col, at.row) ? landPage(state, at.col, at.row, { runtime }) : missingPage(ref);
    }
    case 'agent':
    case 'companion':
    case 'faction':
    case 'army':
    case 'location':
    case 'sublocation':
    case 'area':
    case 'artifact': {
      const node = graph.getNode(ref.id);
      if (!node) return missingPage(ref);
      // A Place is a Location node carrying `parentLocationId` — one page class for both tiers.
      if ((ref.kind === 'location' || ref.kind === 'sublocation') && node.type !== 'location') return missingPage(ref);
      if (ref.kind === 'sublocation' && !isPlaceNode(node)) return graphPage(state, { ...ref, kind: 'location' }, node);
      return graphPage(state, ref, node);
    }
    case 'attachment':
      return attachmentPage(state, ref);
    case 'encounter':
    case 'journey':
    case 'receipt':
      return recordPage(state, ref);
  }
}

export interface SubjectPageArgs {
  subject: InspectorSubject;
}

/** The registered selector (`__DEBUG.getView('subjectPage', { subject })`). World-keyed. */
export const subjectPageSelector: ViewSelector<SubjectPageArgs, SubjectPageVM> = {
  id: 'subjectPage',
  invalidation: 'world',
  key: (args) => subjectKeyOf(args.subject),
  fallback: (args) => missingPage(args?.subject ?? null),
  build(ctx, args) {
    return buildSubjectPage(ctx.state, args.subject, ctx.runtime);
  },
};
