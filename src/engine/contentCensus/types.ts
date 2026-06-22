import type { ReachDomain } from '../../types/traits';
import type { ActionScale } from '../../types/unifiedAction';

export type ContentType =
  | 'encounters'
  | 'actions'
  | 'attachments'
  | 'artifacts'
  | 'conditions'
  | 'spells'
  | 'omens'
  | 'sublocations';

export type CellStatus = 'filled' | 'desert' | 'empty' | 'na';

export interface CensusEntry {
  id: string;
  contentType: ContentType;
  reach: ReachDomain | null;
  scale: ActionScale | null;
  /** Populated when reach or scale could not be resolved */
  untaggedReason?: string;
}

export interface MatrixCell {
  reach: ReachDomain;
  scale: ActionScale;
  count: number;
  status: CellStatus;
}

export interface CensusMatrix {
  contentType: ContentType;
  cells: MatrixCell[];
  /** Entries missing reach and/or scale */
  untaggedEntries: Array<{ id: string; reason: string }>;
  totalEntries: number;
  applicableScales: ActionScale[];
}

export interface DesertEntry {
  contentType: ContentType;
  reach: ReachDomain;
  scale: ActionScale;
  count: number;
  priorityScore: number;
}

export interface EmptyEntry {
  contentType: ContentType;
  reach: ReachDomain;
  scale: ActionScale;
  priorityScore: number;
}

export interface UntaggedGroup {
  contentType: ContentType;
  entries: Array<{ id: string; reason: string }>;
}

export interface TypeSummary {
  contentType: ContentType;
  totalEntries: number;
  applicableCells: number;
  filledCells: number;
  desertCells: number;
  emptyCells: number;
  untaggedCount: number;
  resolvabilityPct: number;
  fillPct: number;
}

export interface CensusReport {
  date: string;
  matrices: CensusMatrix[];
  summary: TypeSummary[];
  desertList: DesertEntry[];
  emptyList: EmptyEntry[];
  untaggedList: UntaggedGroup[];
}
