/**
 * While you were away — the warm arrival recap (THR-2184, slice 1 of THR-2173).
 *
 * Plan: `Docs/plans/2026-11-06-thr-2173-while-you-were-away.md` § Engine pillar.
 *
 * When a `?warm=<ticks>` warm-up ends, the warm-up card turns into a short recap: The
 * First's finished chapters first (the Aftermath's own `outcomeSentence`), then what The
 * First is in the middle of, then the god's places that slipped or grew. The place lines
 * come from a band diff — one read of the dominion ledger before the warm-up
 * (`snapshotWarmRecap`) and one after (`buildWarmRecap`) — because the day lines that
 * name them live in `recentEvents`, which a long warm-up has already dropped.
 *
 * Pure and read-only: no tick phase, no PRNG, no write. Every name the line carries is
 * a segment with a `WorldRef` where one still resolves (Law 2 / Law 21); a band word
 * carries its `ui.dominion.<band>` hover. A line whose slot cannot fill is dropped, so
 * no raw `{token}` reaches the card (Law 43). The rival behind a slipped place is
 * deliberately never named (THR-2172 owns rival causes).
 */

import type { GameState } from '../../types/gameState';
import type { ChronicleSegment } from '../../types/narrative';
import type { WorldRef } from '../../types/worldRef';
import type { ChapterRecord } from '../../types/chapterRecord';
import type { UnifiedAction } from '../../types/unifiedAction';
import {
  DOMINION_BAND_RANK,
  DOMINION_BAND_WORDS,
  DOMINION_RISE_LINE_BANDS,
  type DominionBand,
} from '../../data/dominion-content';
import { dominionBandTooltipId } from '../../data/dominion-ui-content';
import { readDominionLedger } from '../phaseDominion';
import { dominionOf } from '../dominion';
import { getLocationNodes } from '../sublocationShape';
import { activeLedgerEncounters } from '../threadedChapters';
import { getChapterTemplateName, isRoutineChapter } from '../chapterArchive';
import { countWord, outcomeSentence } from '../aftermathWords';
import { resolveTooltip } from '../tooltipResolver';

// ── Constants (NFP #1) ──────────────────────────────────────────────────────

/** Most lines the recap shows (the next-step line sits outside this cap). */
export const WARM_RECAP_MAX_LINES = 5;
/** The First's finished chapters named one by one; the rest fold into the "more" line. */
export const WARM_RECAP_FIRST_CHAPTERS = 2;
/** Which lines survive the cap, most important first. Shown in story order regardless. */
export const WARM_RECAP_KEEP_ORDER: readonly WarmRecapSlot[] = [
  'first_finished#1', 'slipped', 'first_now', 'first_finished#2', 'grew', 'first_more',
];
/** Place names listed before "and others". */
export const WARM_RECAP_LIST_NAMES = 3;
/** A place counts as slipped only if it was at least this band at the start. */
export const WARM_RECAP_SLIPPED_FROM_BAND: DominionBand = 'touched';

/** Story order: the order lines are shown in. */
const WARM_RECAP_SHOW_ORDER: readonly WarmRecapSlot[] = [
  'first_finished#1', 'first_finished#2', 'first_more', 'first_now', 'slipped', 'grew',
];

// ── Types ───────────────────────────────────────────────────────────────────

export interface WarmRecapSnapshot {
  startTick: number;
  firstId: string | null;
  bands: Readonly<Record<string, DominionBand>>;
}

export type WarmRecapLineKind = 'first_finished' | 'first_more' | 'first_now' | 'slipped' | 'grew' | 'empty';
type WarmRecapSlot = 'first_finished#1' | 'first_finished#2' | 'first_more' | 'first_now' | 'slipped' | 'grew';

/** A recap run: a `ChronicleSegment`, plus the concept hover a band word carries. */
export interface WarmRecapSegment extends ChronicleSegment {
  /** `tooltipResolver` id for a term (the band words' `ui.dominion.<band>`). */
  tooltipId?: string;
}

export interface WarmRecapLine {
  kind: WarmRecapLineKind;
  segments: readonly WarmRecapSegment[];
}

/** Test seam: how the bands are read (default: live, `readWarmRecapBands`). */
export interface WarmRecapOptions {
  readBands?: (state: GameState) => Record<string, DominionBand>;
}

export interface WarmRecapVM {
  lines: readonly WarmRecapLine[];
  /** The Ledger row the "Read it in the Ledger" button opens at; null = default view. */
  ledgerKey: string | null;
  /** Line kinds the cap dropped (for the done line). */
  cut: readonly WarmRecapLineKind[];
}

// ── Words ───────────────────────────────────────────────────────────────────

const FALLBACK_WORDS: Record<string, string> = {
  'ui.warm_recap.first_now': '{first} is in the middle of {chapter}.',
  'ui.warm_recap.first_more': '{first} finished {count} more chapters.',
  'ui.warm_recap.first_more_one': '{first} finished one more chapter.',
  'ui.warm_recap.slipped_one': '{place} slipped from {from} to {to}.',
  'ui.warm_recap.slipped_many': '{count} of your places slipped: {list}.',
  'ui.warm_recap.grew_one': '{place} is {to} now.',
  'ui.warm_recap.grew_many': '{list} are more yours now.',
  'ui.warm_recap.empty': 'Nothing in your story changed while you were away.',
};

function words(id: string): string {
  return resolveTooltip(id)?.desc ?? FALLBACK_WORDS[id] ?? '';
}

/**
 * Fill `{token}` slots with segment runs. Returns null when a slot has no fill, so the
 * caller drops the line rather than show a raw token (Law 43).
 */
function fillSegments(template: string, fills: Record<string, readonly WarmRecapSegment[]>): WarmRecapSegment[] | null {
  const out: WarmRecapSegment[] = [];
  const re = /\{(\w+)\}/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(template)) !== null) {
    if (m.index > last) out.push({ text: template.slice(last, m.index) });
    const fill = fills[m[1]];
    if (!fill || fill.length === 0) return null;
    out.push(...fill);
    last = m.index + m[0].length;
  }
  if (last < template.length) out.push({ text: template.slice(last) });
  return out;
}

function capitalise(s: string): string {
  return s.length > 0 ? s[0].toUpperCase() + s.slice(1) : s;
}

/** Names as one run: "A", "A and B", "A, B and C", "A, B, C and others". */
function listSegments(names: readonly WarmRecapSegment[]): WarmRecapSegment[] {
  const shown = names.slice(0, WARM_RECAP_LIST_NAMES);
  const rest = names.length - shown.length;
  const out: WarmRecapSegment[] = [];
  shown.forEach((n, i) => {
    if (i > 0) out.push({ text: rest === 0 && i === shown.length - 1 ? ' and ' : ', ' });
    out.push(n);
  });
  if (rest > 0) out.push({ text: ' and others' });
  return out;
}

function bandSegment(band: DominionBand): WarmRecapSegment {
  return { text: DOMINION_BAND_WORDS[band], tooltipId: dominionBandTooltipId(band) };
}

// ── Reads ───────────────────────────────────────────────────────────────────

/**
 * Each top-level place's band, read live through `dominionOf` — the same read the tick's
 * `afterSpherePressure` writes into the ledger. Not the ledger itself: the ledger is only
 * written inside a tick, so before a warm-up's first tick it is empty and a diff against
 * it would never name a place (review gate, THR-2184). Falls back to the ledger on a throw.
 */
export function readWarmRecapBands(state: GameState): Record<string, DominionBand> {
  if (!state.ascendantId) return {};
  try {
    const bands: Record<string, DominionBand> = {};
    for (const place of getLocationNodes(state.graph)) {
      bands[place.id] = dominionOf(state.graph, state.ascendantId, place.id).band;
    }
    return bands;
  } catch {
    try {
      return { ...readDominionLedger(state.graph, state.ascendantId).bands };
    } catch {
      return {};
    }
  }
}

/** Take the "before" reading. Call after the opening gifts settle, before the first tick. */
export function snapshotWarmRecap(state: GameState, firstId: string | null, opts: WarmRecapOptions = {}): WarmRecapSnapshot {
  return { startTick: state.tick, firstId, bands: (opts.readBands ?? readWarmRecapBands)(state) };
}

function nodeName(state: GameState, id: string): string | null {
  const node = state.graph.getNode(id);
  if (!node) return null;
  return (node.properties as { name?: string } | undefined)?.name ?? node.name ?? null;
}

function agentSegment(state: GameState, id: string, fallbackName: string): WarmRecapSegment {
  const name = nodeName(state, id) ?? fallbackName;
  if (!state.graph.getNode(id)) return { text: name };
  const ref: WorldRef = { kind: 'agent', id, name };
  return { text: name, ref };
}

function placeSegment(state: GameState, id: string): WarmRecapSegment | null {
  const name = nodeName(state, id);
  if (!name) return null;
  const ref: WorldRef = { kind: 'location', id, name };
  return { text: name, ref };
}

function chapterSegment(state: GameState, actionId: string, name: string): WarmRecapSegment {
  const live = (state.unifiedActions as UnifiedAction[]).some(a => a.actionId === actionId);
  if (!live) return { text: name };
  const ref: WorldRef = { kind: 'encounter', id: actionId, name };
  return { text: name, ref };
}

/** "Kael won Bridge Toll, at a price." with Kael and Bridge Toll as runs. */
function finishedLine(state: GameState, rec: ChapterRecord): WarmRecapLine {
  const sentence = outcomeSentence(rec.actorName, rec.templateName, rec.outcome);
  const actor = agentSegment(state, rec.actorId, rec.actorName);
  const at = sentence.startsWith(rec.actorName) ? sentence.indexOf(rec.templateName, rec.actorName.length) : -1;
  if (at < 0) return { kind: 'first_finished', segments: [{ text: sentence }] };
  return {
    kind: 'first_finished',
    segments: [
      { ...actor, text: rec.actorName },
      { text: sentence.slice(rec.actorName.length, at) },
      chapterSegment(state, rec.actionId, rec.templateName),
      { text: sentence.slice(at + rec.templateName.length) },
    ],
  };
}

// ── Build ───────────────────────────────────────────────────────────────────

/**
 * The recap, from the snapshot taken before the warm-up and the state at arrival.
 * Pure over its inputs; reads in a fixed order (determinism).
 */
export function buildWarmRecap(state: GameState, before: WarmRecapSnapshot, opts: WarmRecapOptions = {}): WarmRecapVM {
  const slots = new Map<WarmRecapSlot, WarmRecapLine>();
  const firstId = before.firstId;
  let ledgerKey: string | null = null;

  if (firstId) {
    // The First's finished story chapters in the window, newest first.
    const finished = (state.chapterArchive ?? [])
      .filter(r => r.actorId === firstId && !isRoutineChapter(r) && r.resolvedTick > before.startTick)
      .slice()
      .sort((a, b) => b.resolvedTick - a.resolvedTick || (a.actionId < b.actionId ? -1 : 1));
    const firstName = nodeName(state, firstId) ?? finished[0]?.actorName ?? null;
    if (finished[0]) {
      slots.set('first_finished#1', finishedLine(state, finished[0]));
      ledgerKey = finished[0].actionId;
    }
    if (finished[1] && WARM_RECAP_FIRST_CHAPTERS >= 2) slots.set('first_finished#2', finishedLine(state, finished[1]));
    const more = finished.length - Math.min(finished.length, WARM_RECAP_FIRST_CHAPTERS);
    if (more > 0 && firstName) {
      const segs = fillSegments(
        words(more === 1 ? 'ui.warm_recap.first_more_one' : 'ui.warm_recap.first_more'),
        { first: [agentSegment(state, firstId, firstName)], count: [{ text: countWord(more) }] },
      );
      if (segs) slots.set('first_more', { kind: 'first_more', segments: segs });
    }

    // What The First is in the middle of: their newest live story chapter.
    const live = activeLedgerEncounters(state)
      .filter(a => a.actorId === firstId && !isRoutineChapter({ templateId: a.templateId }))
      .sort((a, b) => (b.startTick ?? 0) - (a.startTick ?? 0) || (a.actionId < b.actionId ? -1 : 1))[0];
    if (live && firstName) {
      const segs = fillSegments(words('ui.warm_recap.first_now'), {
        first: [agentSegment(state, firstId, firstName)],
        chapter: [chapterSegment(state, live.actionId, getChapterTemplateName(live.templateId))],
      });
      if (segs) slots.set('first_now', { kind: 'first_now', segments: segs });
      if (!ledgerKey) ledgerKey = live.actionId;
    }
  }

  // The god's places: a band diff against the snapshot. An empty snapshot (not taken)
  // gives chapter lines only.
  const beforeBands = before.bands;
  if (Object.keys(beforeBands).length > 0) {
    const now = (opts.readBands ?? readWarmRecapBands)(state);
    const slipped: { seg: WarmRecapSegment; from: DominionBand; to: DominionBand }[] = [];
    const grew: { seg: WarmRecapSegment; to: DominionBand }[] = [];
    for (const placeId of Object.keys(beforeBands).sort()) {
      const from = beforeBands[placeId];
      const to = now[placeId];
      if (!from || !to || from === to) continue;
      const seg = placeSegment(state, placeId);
      if (!seg) continue;
      const fromRank = DOMINION_BAND_RANK[from];
      const toRank = DOMINION_BAND_RANK[to];
      if (toRank < fromRank && fromRank >= DOMINION_BAND_RANK[WARM_RECAP_SLIPPED_FROM_BAND]) {
        slipped.push({ seg, from, to });
      } else if (toRank > fromRank && DOMINION_RISE_LINE_BANDS.includes(to)) {
        grew.push({ seg, to });
      }
    }
    const byName = (a: { seg: WarmRecapSegment }, b: { seg: WarmRecapSegment }) =>
      a.seg.text < b.seg.text ? -1 : a.seg.text > b.seg.text ? 1 : 0;
    slipped.sort(byName);
    grew.sort(byName);
    if (slipped.length === 1) {
      const s = slipped[0];
      const segs = fillSegments(words('ui.warm_recap.slipped_one'), {
        place: [s.seg], from: [bandSegment(s.from)], to: [bandSegment(s.to)],
      });
      if (segs) slots.set('slipped', { kind: 'slipped', segments: segs });
    } else if (slipped.length > 1) {
      const segs = fillSegments(words('ui.warm_recap.slipped_many'), {
        count: [{ text: capitalise(countWord(slipped.length)) }],
        list: listSegments(slipped.map(s => s.seg)),
      });
      if (segs) slots.set('slipped', { kind: 'slipped', segments: segs });
    }
    if (grew.length === 1) {
      const g = grew[0];
      const segs = fillSegments(words('ui.warm_recap.grew_one'), { place: [g.seg], to: [bandSegment(g.to)] });
      if (segs) slots.set('grew', { kind: 'grew', segments: segs });
    } else if (grew.length > 1) {
      const segs = fillSegments(words('ui.warm_recap.grew_many'), { list: listSegments(grew.map(g => g.seg)) });
      if (segs) slots.set('grew', { kind: 'grew', segments: segs });
    }
  }

  // Keep by priority, show in story order.
  const kept = new Set<WarmRecapSlot>();
  const cut: WarmRecapLineKind[] = [];
  for (const slot of WARM_RECAP_KEEP_ORDER) {
    const line = slots.get(slot);
    if (!line) continue;
    if (kept.size < WARM_RECAP_MAX_LINES) kept.add(slot);
    else cut.push(line.kind);
  }
  const lines = WARM_RECAP_SHOW_ORDER.filter(s => kept.has(s)).map(s => slots.get(s)!);
  if (lines.length === 0) {
    return { lines: [{ kind: 'empty', segments: [{ text: words('ui.warm_recap.empty') }] }], ledgerKey, cut };
  }
  return { lines, ledgerKey, cut };
}

/** A recap line as plain text (tests, the done line, screen readers' fallback). */
export function warmRecapLineText(line: WarmRecapLine): string {
  return line.segments.map(s => s.text).join('');
}
