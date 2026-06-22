/**
 * Census matrix builder + priority ranker.
 *
 * Takes CensusEntry[] from adapters and produces:
 * - Per-type reach×scale matrices with filled/desert/empty/N/A cell status
 * - Desert and empty lists with priority scores
 * - Summary statistics per content type
 */

import type { ReachDomain } from '../../types/traits';
import type { ActionScale } from '../../types/unifiedAction';
import type {
  CensusEntry,
  CensusMatrix,
  CensusReport,
  ContentType,
  DesertEntry,
  EmptyEntry,
  MatrixCell,
  TypeSummary,
  UntaggedGroup,
} from './types';
import {
  CENSUS_REACH_DOMAINS,
  CENSUS_SCALE_DOMAINS,
  CONTENT_CELL_MIN,
  DESERT_PRIORITY_MODE,
  SCALE_APPLICABILITY,
  SCALE_EXPOSURE_WEIGHTS,
} from './constants';

const ALL_CONTENT_TYPES: ContentType[] = [
  'encounters',
  'actions',
  'attachments',
  'artifacts',
  'conditions',
  'spells',
  'omens',
  'sublocations',
];

function priorityScore(scale: ActionScale): number {
  if (DESERT_PRIORITY_MODE === 'weighted') return SCALE_EXPOSURE_WEIGHTS[scale];
  return 1; // uniform: all cells equal
}

export function buildMatrices(entries: CensusEntry[]): CensusMatrix[] {
  const byType = new Map<ContentType, CensusEntry[]>();
  for (const e of entries) {
    const list = byType.get(e.contentType) ?? [];
    list.push(e);
    byType.set(e.contentType, list);
  }

  return ALL_CONTENT_TYPES.map(contentType => {
    const typeEntries = byType.get(contentType) ?? [];
    const applicableScales = SCALE_APPLICABILITY[contentType] ?? CENSUS_SCALE_DOMAINS;

    // Count tagged entries per cell
    const cellCounts = new Map<string, number>();
    const untaggedEntries: Array<{ id: string; reason: string }> = [];

    for (const e of typeEntries) {
      if (e.reach === null || e.scale === null) {
        untaggedEntries.push({
          id: e.id,
          reason: e.untaggedReason ?? 'unknown',
        });
        continue;
      }
      const key = `${e.reach}:${e.scale}`;
      cellCounts.set(key, (cellCounts.get(key) ?? 0) + 1);
    }

    const cells: MatrixCell[] = [];
    for (const reach of CENSUS_REACH_DOMAINS) {
      for (const scale of CENSUS_SCALE_DOMAINS) {
        if (!applicableScales.includes(scale)) {
          cells.push({ reach, scale, count: 0, status: 'na' });
          continue;
        }
        const count = cellCounts.get(`${reach}:${scale}`) ?? 0;
        let status: MatrixCell['status'];
        if (count >= CONTENT_CELL_MIN) status = 'filled';
        else if (count > 0) status = 'desert';
        else status = 'empty';
        cells.push({ reach, scale, count, status });
      }
    }

    return {
      contentType,
      cells,
      untaggedEntries,
      totalEntries: typeEntries.length,
      applicableScales,
    };
  });
}

export function buildDesertList(matrices: CensusMatrix[]): DesertEntry[] {
  const deserts: DesertEntry[] = [];
  for (const m of matrices) {
    for (const cell of m.cells) {
      if (cell.status === 'desert') {
        deserts.push({
          contentType: m.contentType,
          reach: cell.reach,
          scale: cell.scale,
          count: cell.count,
          priorityScore: priorityScore(cell.scale),
        });
      }
    }
  }
  return deserts.sort((a, b) => b.priorityScore - a.priorityScore || a.count - b.count);
}

export function buildEmptyList(matrices: CensusMatrix[]): EmptyEntry[] {
  const empties: EmptyEntry[] = [];
  for (const m of matrices) {
    for (const cell of m.cells) {
      if (cell.status === 'empty') {
        empties.push({
          contentType: m.contentType,
          reach: cell.reach,
          scale: cell.scale,
          priorityScore: priorityScore(cell.scale),
        });
      }
    }
  }
  return empties.sort((a, b) => b.priorityScore - a.priorityScore);
}

export function buildUntaggedList(matrices: CensusMatrix[]): UntaggedGroup[] {
  return matrices
    .filter(m => m.untaggedEntries.length > 0)
    .map(m => ({ contentType: m.contentType, entries: m.untaggedEntries }));
}

export function buildSummary(matrices: CensusMatrix[]): TypeSummary[] {
  return matrices.map(m => {
    const applicableCells = m.cells.filter(c => c.status !== 'na').length;
    const filledCells = m.cells.filter(c => c.status === 'filled').length;
    const desertCells = m.cells.filter(c => c.status === 'desert').length;
    const emptyCells = m.cells.filter(c => c.status === 'empty').length;
    const taggedCount = m.totalEntries - m.untaggedEntries.length;
    return {
      contentType: m.contentType,
      totalEntries: m.totalEntries,
      applicableCells,
      filledCells,
      desertCells,
      emptyCells,
      untaggedCount: m.untaggedEntries.length,
      resolvabilityPct: m.totalEntries > 0 ? taggedCount / m.totalEntries : 0,
      fillPct: applicableCells > 0 ? filledCells / applicableCells : 0,
    };
  });
}

export function buildReport(date: string, entries: CensusEntry[]): CensusReport {
  const matrices = buildMatrices(entries);
  return {
    date,
    matrices,
    summary: buildSummary(matrices),
    desertList: buildDesertList(matrices),
    emptyList: buildEmptyList(matrices),
    untaggedList: buildUntaggedList(matrices),
  };
}

// ─── Resolvability report (per-registry % with resolved reach/scale) ──────────

export interface ResolvabilityRow {
  contentType: ContentType;
  total: number;
  reachResolved: number;
  scaleResolved: number;
  bothResolved: number;
  reachPct: number;
  scalePct: number;
  bothPct: number;
}

export function buildResolvabilityReport(entries: CensusEntry[]): ResolvabilityRow[] {
  const byType = new Map<ContentType, CensusEntry[]>();
  for (const e of entries) {
    const list = byType.get(e.contentType) ?? [];
    list.push(e);
    byType.set(e.contentType, list);
  }

  return ALL_CONTENT_TYPES.map(contentType => {
    const typeEntries = byType.get(contentType) ?? [];
    const total = typeEntries.length;
    const reachResolved = typeEntries.filter(e => e.reach !== null).length;
    const scaleResolved = typeEntries.filter(e => e.scale !== null).length;
    const bothResolved = typeEntries.filter(e => e.reach !== null && e.scale !== null).length;
    return {
      contentType,
      total,
      reachResolved,
      scaleResolved,
      bothResolved,
      reachPct: total > 0 ? reachResolved / total : 0,
      scalePct: total > 0 ? scaleResolved / total : 0,
      bothPct: total > 0 ? bothResolved / total : 0,
    };
  });
}
