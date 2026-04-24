/**
 * CMS Content Browser — type definitions.
 *
 * Designed for extensibility: adding a new content type = adding one
 * ContentRegistryEntry to registry.ts. No viewer changes needed unless
 * the data shape is genuinely novel.
 */

// ── Viewer Types ─────────────────────────────────────────────────

/** Available viewer components. Add new viewers here when data shapes diverge. */
export type ViewerType = 'table' | 'record' | 'tree' | 'constants' | 'prose' | 'config-manager' | 'ia-surface';

// ── Column Definitions ───────────────────────────────────────────

/** How to render a cell value */
export type CellRenderer = 'text' | 'tags' | 'badge' | 'number' | 'boolean' | 'prose' | 'json';

export interface ColumnDef {
  /** Property path on each item (supports dot notation: 'properties.name') */
  key: string;
  /** Display header */
  label: string;
  /** Cell rendering strategy (default: 'text') */
  render?: CellRenderer;
  /** Whether column is sortable (default: true) */
  sortable?: boolean;
  /** Optional fixed width */
  width?: string;
  /** Badge color map: value → CSS color (for render: 'badge') */
  badgeColors?: Record<string, string>;
}

// ── Constants Entry ──────────────────────────────────────────────

/** Shape for the ConstantsViewer — manually assembled from individual exports */
export interface ConstantEntry {
  name: string;
  value: unknown;
  description?: string;
}

// ── Registry Entry ───────────────────────────────────────────────

/**
 * A single browsable content dataset.
 *
 * This is the unit of extensibility: one entry = one item in the sidebar.
 * All viewer configuration lives here, not in the viewer components.
 */
export interface ContentRegistryEntry {
  /** Unique ID (used as URL hash fragment) */
  id: string;
  /** Display name in the sidebar */
  label: string;
  /** Sidebar category group */
  category: string;
  /** One-line description shown in the main panel header */
  description: string;
  /** The actual data — arrays, records, or ConstantEntry[] */
  data: unknown;
  /** Which viewer to use */
  viewer: ViewerType;
  /** Column definitions for TableViewer */
  columns?: ColumnDef[];
  /** Property paths to include in global search */
  searchFields?: string[];
  /** Source file path (for developer reference) */
  sourceFile?: string;
}

// ── Derived Types ────────────────────────────────────────────────

/** Category group derived from registry entries */
export interface ContentCategory {
  id: string;
  label: string;
  entries: ContentRegistryEntry[];
}

/** Sidebar + main panel selection state */
export interface CMSSelection {
  entryId: string | null;
  itemKey: string | number | null;
}

// ── Tunable Constants (Config Manager) ──────────────────────────

/** A single tunable constant with rich metadata for the Configuration Manager */
export interface TunableConstant {
  /** Export name in source (e.g. STEP_PROBABILITY_OFFSET) */
  exportName: string;
  /** Current runtime value */
  value: number | boolean | string;
  /** Human-readable description of what this controls */
  description: string;
  /** Source file path relative to project root */
  sourceFile: string;
  /** Valid range [min, max] for numeric constants */
  range?: [number, number];
  /** Which engine functions / formulas use this constant */
  usedBy?: string;
  /** Type hint for the editor */
  type: 'number' | 'boolean' | 'string';
}

/** A group of related tunable constants */
export interface TunableGroup {
  /** Group identifier */
  id: string;
  /** Display name */
  label: string;
  /** One-line description of the system */
  description: string;
  /** Constants in this group */
  constants: TunableConstant[];
}
