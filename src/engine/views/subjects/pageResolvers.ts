/**
 * Section resolvers for the page kinds that have no single graph node (THR-1876 § D7):
 * the land page (`land`), the god's own sheet (`god`) and records (`record`).
 *
 * Each is a row resolver of the one page-layout table (`DETAIL_PAGE_REGISTRY`) and has
 * the ordinary resolver contract: pure, reads the world, returns one section or null.
 * They read `GameState` stores, so they need `ctx.state`; without it (the hover card,
 * graph-only tests) they return null and the section is skipped (§ Fail-soft).
 */
import type { PanelRow, PanelSection, ProseSection, Section, SentencePart } from '../../../types/detailPage';
import type { SectionResolver, SectionResolverContext } from '../../detailPageResolvers';
import type { GameState } from '../../../types/gameState';
import type { HexTile, SphereName } from '../../../types';
import type { AscendantArchetype } from '../../../types/influence';
import { getHexRegionData, type HexRegionData } from '../../hexRegion';
import { getHexSphereInfluence, getLocationsInHex } from '../../hexZoom';
import { landParagraphs, soulParagraphs, ruinsParagraphs, type LandProseInput } from './landProse';
import {
  selectEssenceRows,
  selectMandateRow,
  selectReachRows,
  selectSignaturePaths,
} from './godSheet';
import { SIGNATURE_STATE_COPY } from '../../../data/ascendant-bar-content';
import { DIVINE_NATURE_PHRASES, essenceToProseDescriptor } from '../../../data/divine-nature-content';
import { INSPECTOR_WORDS } from '../../../data/view-content';
import { dominionSheetVM } from '../../dominionViewModels';
import { selectOpeningReveal } from '../../openingReveal';
import { readOpeningRevealShowAllSetting, readPublishedOpeningArrivalLedger } from '../../../data/opening-reveal-table';

// ─── Shared ──────────────────────────────────────────────────────────────────

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Prose with `**Keyword**` markup as the prose shape's linked-term spans. The text is
 * escaped first, so a moved paragraph renders its words exactly and nothing else.
 */
export function proseMarkupToHtml(text: string): string {
  return escapeHtml(text).replace(/\*\*([^*]+)\*\*/g, '<span class="term">$1</span>');
}

function proseSection(typeId: string, label: string, paragraphs: readonly string[], source: string, gold = false): ProseSection | null {
  if (paragraphs.length === 0) return null;
  return {
    kind: 'prose',
    typeId,
    label,
    gold,
    tier: 'routine',
    source,
    prose: paragraphs.map(proseMarkupToHtml).join('\n\n'),
  };
}

function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

// ─── Land ────────────────────────────────────────────────────────────────────

/** The tile under a hex, or null. Reads `GameState.tiles` — the map's own tiles. */
export function tileAt(state: Pick<GameState, 'tiles'>, col: number, row: number): HexTile | null {
  return state.tiles?.find(t => t.coord.col === col && t.coord.row === row) ?? null;
}

/** The latest `survey_completed` band on a hex — the read GameView makes for HexChronicle. */
export function latestSurvey(state: Pick<GameState, 'recentEvents'>, col: number, row: number): { prose: string; tick: number } | null {
  let latest: { prose: string; tick: number } | null = null;
  for (const ev of state.recentEvents ?? []) {
    if (ev.type !== 'survey_completed') continue;
    if (ev.hexCoords?.col !== col || ev.hexCoords?.row !== row) continue;
    if (!ev.message) continue;
    if (!latest || ev.tick > latest.tick) latest = { prose: ev.message, tick: ev.tick };
  }
  return latest;
}

/** Everything the land prose reads for one hex, from the state alone. Null without a tile. */
export function landProseInputFor(state: GameState, col: number, row: number): LandProseInput | null {
  const tile = tileAt(state, col, row);
  if (!tile) return null;
  const regionData: HexRegionData | null = tile.regionId ? getHexRegionData(state.graph, tile.regionId) : null;
  return {
    terrain: tile.terrain,
    col,
    row,
    seed: state.seed,
    sphereInfluence: getHexSphereInfluence(state.graph, col, row),
    regionData,
    locations: getLocationsInHex(state.graph, col, row),
    graph: state.graph,
    survey: latestSurvey(state, col, row),
    tick: state.tick,
  };
}

function landInput(ctx: SectionResolverContext): LandProseInput | null {
  if (!ctx.state || !ctx.hex) return null;
  return landProseInputFor(ctx.state, ctx.hex.col, ctx.hex.row);
}

const theLandResolver: SectionResolver = (ctx) => {
  const input = landInput(ctx);
  return input ? proseSection('the_land', 'The land', landParagraphs(input), 'landProse.landParagraphs', true) : null;
};

const itsSoulResolver: SectionResolver = (ctx) => {
  const input = landInput(ctx);
  return input ? proseSection('its_soul', 'Its soul', soulParagraphs(input), 'landProse.soulParagraphs') : null;
};

const whatCameBeforeResolver: SectionResolver = (ctx) => {
  const input = landInput(ctx);
  return input ? proseSection('what_came_before', 'What came before', ruinsParagraphs(input), 'landProse.ruinsParagraphs') : null;
};

export const LAND_RESOLVERS = {
  the_land: theLandResolver,
  its_soul: itsSoulResolver,
  what_came_before: whatCameBeforeResolver,
} as const;

// ─── God ─────────────────────────────────────────────────────────────────────

/**
 * The god's sphere pair. GameView hands the sheet an `AscendantArchetype`; the god's
 * page reads the same pair off the identity it was created from, so the lab and the
 * game agree without threading the archetype through every resolver.
 */
export function godSpheres(state: GameState): { primary: SphereName; secondary: SphereName } | null {
  // THR-1913: a run started without the remembrance flow (`?seeded`, the plain init path)
  // carries no identity; the god's node holds the same alignment (`createAscendant`), so
  // the cards and the god's page read that rather than draw nothing (fail-soft, NFP #4).
  const alignment = state.ascendantIdentity?.sphereAlignment
    ?? (state.graph?.getNode(state.ascendantId)?.properties.sphereAlignment as { primary?: SphereName; secondary?: SphereName } | undefined);
  if (!alignment?.primary) return null;
  return { primary: alignment.primary, secondary: alignment.secondary ?? alignment.primary };
}

const divineNatureResolver: SectionResolver = (ctx) => {
  if (!ctx.state) return null;
  const spheres = godSpheres(ctx.state);
  if (!spheres) return null;
  const nature = DIVINE_NATURE_PHRASES[spheres.primary] ?? DIVINE_NATURE_PHRASES.force;
  // AscendantSheet's sentence, word for word.
  const text = `You are a god of **${capitalize(spheres.primary)}**, your power shaped by currents of **${capitalize(spheres.secondary)}**. Where others see ${nature.primary}, you see ${nature.secondary}.`;
  return proseSection('divine_nature', 'Divine nature', [text], 'godSheet.divineNature', true);
};

const essenceResolver: SectionResolver = (ctx) => {
  if (!ctx.state) return null;
  const spheres = godSpheres(ctx.state);
  if (!spheres) return null;
  const archetype = { sphereAlignment: spheres } as unknown as AscendantArchetype;
  const rows: PanelRow[] = selectEssenceRows(ctx.state, archetype).map((row) => ({
    left: capitalize(row.sphere),
    right: essenceToProseDescriptor(row.level),
    tooltipId: `sphere.${row.sphere}`,
  }));
  if (rows.length === 0) return null;
  const section: PanelSection = { kind: 'panel', typeId: 'essence', label: 'Essence', gold: false, tier: 'routine', source: 'godSheet.selectEssenceRows', rows };
  return section;
};

const mandateResolver: SectionResolver = (ctx) => {
  if (!ctx.state) return null;
  const mandate = selectMandateRow(ctx.state);
  if (!mandate) return null;
  const section: PanelSection = {
    kind: 'panel',
    typeId: 'mandate',
    label: 'Mandate',
    gold: false,
    tier: 'routine',
    source: 'godSheet.selectMandateRow',
    rows: [
      // The rail draws this bar today (the mandate progress bar); the word beside it is the trend.
      { left: mandate.name, right: INSPECTOR_WORDS.mandateTrend[mandate.trend], meter: mandate.progress },
      { left: INSPECTOR_WORDS.mandateNow, right: mandate.flavorLine },
    ],
  };
  return section;
};

const signaturesResolver: SectionResolver = (ctx) => {
  if (!ctx.state) return null;
  const rows: PanelRow[] = selectSignaturePaths(ctx.state)
    .filter((p) => p.state !== 'locked_incarnation')
    .map((p) => ({ left: `${p.reachLabel} · ${p.name}`, right: SIGNATURE_STATE_COPY[p.state] }));
  if (rows.length === 0) return null;
  const section: PanelSection = { kind: 'panel', typeId: 'signatures', label: 'Signatures', gold: false, tier: 'routine', source: 'godSheet.selectSignaturePaths', rows };
  return section;
};

const reachesResolver: SectionResolver = (ctx) => {
  if (!ctx.state) return null;
  const rows: PanelRow[] = selectReachRows(ctx.state).map((r) => ({
    left: r.label,
    right: r.tierWord,
    tooltipId: `reach.${r.reach}`,
  }));
  if (rows.length === 0) return null;
  const section: PanelSection = { kind: 'panel', typeId: 'reaches', label: 'Reaches', gold: false, tier: 'routine', source: 'godSheet.selectReachRows', rows };
  return section;
};

export const GOD_RESOLVERS = {
  divine_nature: divineNatureResolver,
  essence: essenceResolver,
  mandate: mandateResolver,
  signatures: signaturesResolver,
  reaches: reachesResolver,
} as const;

// ─── Record ──────────────────────────────────────────────────────────────────

/** What a record page reads for its subject: a chapter, a receipt, or neither. */
export function recordSources(ctx: SectionResolverContext) {
  const state = ctx.state;
  const record = ctx.record;
  if (!state || !record) return { chapter: null, receipt: null };
  const chapter = record.kind === 'encounter'
    ? (state.chapterArchive ?? []).find((c) => c.actionId === record.id) ?? null
    : null;
  const receipt = record.kind === 'receipt'
    ? (state.playerActionReceipts ?? []).find((r) => r.id === record.id) ?? null
    : null;
  return { chapter, receipt };
}

const recordWhatHappenedResolver: SectionResolver = (ctx) => {
  const { chapter, receipt } = recordSources(ctx);
  if (chapter) {
    return proseSection('what_happened', 'What happened', [chapter.aftermathProse || chapter.openingProse].filter(Boolean), 'record.chapter', true);
  }
  if (receipt) {
    return proseSection('what_happened', 'What happened', [receipt.overview].filter(Boolean), 'record.receipt', true);
  }
  return null;
};

const recordOutcomeResolver: SectionResolver = (ctx) => {
  const { chapter, receipt } = recordSources(ctx);
  // The line the aftermath already used: the chapter's result line, or the receipt's toast.
  const line = chapter?.stakesLine ?? receipt?.toastMessage ?? null;
  return line ? proseSection('outcome', 'Outcome', [line], chapter ? 'record.chapter.stakesLine' : 'record.receipt.toastMessage') : null;
};

export const RECORD_RESOLVERS = {
  what_happened: recordWhatHappenedResolver,
  outcome: recordOutcomeResolver,
} as const;

/** A record with nothing to say still answers (Law 25 / § D7.10). */
export const recordFallback: SectionResolver = (ctx): Section | null => {
  const name = ctx.record?.name ?? INSPECTOR_WORDS.recordUnnamed;
  return proseSection('what_happened', 'What happened', [INSPECTOR_WORDS.recordNoAccount.replace('{name}', name)], 'record.fallback', true);
};

// ─── Dominion (one row on every page that has a band) ────────────────────────


/** A line's first letter raised, so a clause the VM words in lower case opens a sentence. */
function sentenceCaseLine(text: string): string {
  const t = text.trim();
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function dominionResolverFor(withTend: boolean): SectionResolver {
  return (ctx) => {
    // The god is read off the state only: a legacy caller's `protagonistId` may be a mortal.
    const ascendantId = ctx.state?.ascendantId;
    // THR-1986: Dominion arrives with the *A path opens* gift, beside the Reaches it is
    // read with; before then no page carries the row, unless the player chose "Show
    // every panel" (the same setting the rail reads). Fail-soft: the selector reveals
    // every row when it cannot tell.
    // THR-2060: read against the screen's arrival ledger, so the row waits while Dominion is queued.
    const ledger = readPublishedOpeningArrivalLedger() ?? undefined;
    if (ctx.state && !selectOpeningReveal(ctx.state, { showAll: readOpeningRevealShowAllSetting(), ledger }).rows.dominion?.revealed) return null;
    const vm = dominionSheetVM(ctx.graph, ascendantId, ctx.nodeId, ctx.state?.controlEffects, withTend);
    if (!vm) return null;
    // THR-2097 (rule R6): one line, not label-and-value rows — "Foreign ground. Neither yours
    // nor set against you." The hold word keeps its tooltip (Law 17).
    const sentence = (t: string) => { const w = t.trim(); return w && !/[.!?]$/.test(w) ? `${w}.` : w; };
    const parts: SentencePart[] = [{ text: sentence(vm.word), tooltipId: vm.tooltipId }, ` ${sentence(sentenceCaseLine(vm.line))}`];
    if (vm.tendLine) parts.push(` ${sentence(sentenceCaseLine(vm.tendLine))}`);
    const text = parts.map(p => (typeof p === 'string' ? p : p.text)).join('');
    const section: ProseSection = { kind: 'prose', typeId: 'dominion', label: 'Dominion', gold: false, tier: 'routine', source: 'dominionSheetVM', prose: escapeHtml(text), parts };
    return section;
  };
}

/** The Dominion row: the mortal, faction and artifact variant (no tend line). */
export const dominionRowResolver: SectionResolver = dominionResolverFor(false);
/** The Dominion row on a place page, with its tend line. */
export const dominionPlaceRowResolver: SectionResolver = dominionResolverFor(true);
