/**
 * frame-registry.ts — the screen frame drawn from lists (UI Law 58; THR-1875 plan § F2).
 *
 * The frame is a top bar and two rails. Each kind of thing in it is one list here, as
 * pure data (ids, words, order, keys, reveal surfaces, icons, tooltips), so it is
 * testable in Node. The components that draw each entry live in exhaustive maps
 * (`Record<Id, Component>`) under `src/components/Game/frame/`, so a missing component
 * is a type error. Adding a Ledger section or a Chronicle tab is one entry here and
 * one in `frame/ledgerComponents.tsx` — never a hand-placed block of JSX.
 *
 * Slice 1 (THR-1893) lands the Ledger rail's lists; slice 2 (THR-1894) adds
 * `GOD_RAIL_SECTIONS`; slice 3 (THR-1875) adds `TOP_BAR_ITEMS` and deletes
 * `NOT_YET_LISTED`. `frameRegistry.test.ts` checks that every opening-reveal surface
 * is claimed by exactly one entry here.
 *
 * ─── Constants ───────────────────────────────────────────────────
 * | LEDGER_RAIL_HOTKEY | 'l' | Folds or unfolds the Ledger rail; the flyout while the Inspector is open |
 */
import type { IconName } from './icons/iconRegistry';
import type { OpeningRevealSurfaceId } from './opening-reveal-table';
import {
  CHRONICLE_LABEL,
  CHRONICLE_TAB_LABELS,
  STRIP_COUNT_LABELS,
  THREADS_LABEL,
  WORLD_SOUL_LABEL,
  type CountPair,
} from './frame-content';

/** A strip item: its icon, and the count's words (the section's word lives in the tooltip). */
export interface StripDef {
  icon: IconName;
  countLabel: CountPair;
}

export type LedgerSectionId = 'threads' | 'chronicle';
export type LedgerTabId = 'now' | 'years' | 'ledger';
export type LedgerLineId = 'world_soul';

export interface LedgerSectionDef {
  id: LedgerSectionId;
  order: number;
  label: string;
  tooltipId: string;
  revealSurfaces: readonly OpeningRevealSurfaceId[];
  strip: StripDef;
}

export interface LedgerTabDef {
  id: LedgerTabId;
  order: number;
  label: string;
  tooltipId: string | null;
  revealSurface: OpeningRevealSurfaceId | null;
  /** The word the strip's tooltip names this tab by, when it has a strip item. */
  stripLabel?: string;
  strip: StripDef | null;
}

/** A line the rail draws above its tabs (the World-Soul line heads the Chronicle). */
export interface LedgerLineDef {
  id: LedgerLineId;
  label: string;
  tooltipId: string;
  revealSurface: OpeningRevealSurfaceId;
}

export const LEDGER_RAIL_SECTIONS: readonly LedgerSectionDef[] = [
  {
    id: 'threads',
    order: 1,
    label: THREADS_LABEL,
    tooltipId: 'ui.threads',
    revealSurfaces: ['threads'],
    strip: { icon: 'threads', countLabel: STRIP_COUNT_LABELS.threads },
  },
  {
    id: 'chronicle',
    order: 2,
    label: CHRONICLE_LABEL,
    tooltipId: 'ui.chronicle',
    revealSurfaces: ['chronicle'],
    strip: { icon: 'chronicle', countLabel: STRIP_COUNT_LABELS.chronicle },
  },
];

export const LEDGER_TABS: readonly LedgerTabDef[] = [
  { id: 'now', order: 1, label: CHRONICLE_TAB_LABELS.now, tooltipId: null, revealSurface: null, strip: null },
  { id: 'years', order: 2, label: CHRONICLE_TAB_LABELS.years, tooltipId: 'ui.chronicle_years', revealSurface: null, strip: null },
  {
    id: 'ledger',
    order: 3,
    label: CHRONICLE_TAB_LABELS.ledger,
    tooltipId: 'ui.chapter_ledger',
    revealSurface: 'chapter_ledger',
    stripLabel: 'Chapter Ledger',
    strip: { icon: 'chapter-ledger', countLabel: STRIP_COUNT_LABELS.ledger },
  },
];

export const LEDGER_LINES: readonly LedgerLineDef[] = [
  { id: 'world_soul', label: WORLD_SOUL_LABEL, tooltipId: 'ui.world_soul', revealSurface: 'world_soul' },
];

/** `L` folds or unfolds the rail; with the Inspector open it toggles the flyout (§ F8, § F10). */
export const LEDGER_RAIL_HOTKEY = 'l';

/**
 * Every key the frame answers, collected from its list entries and spread into
 * `TOP_BAR_KEYS` (`top-bar-keys.ts`), whose overlap test keeps each key single-claimed.
 * Never hand-kept beside the lists. Both cases, as `m` / `M` are.
 */
export const FRAME_HOTKEYS: readonly string[] = [LEDGER_RAIL_HOTKEY, LEDGER_RAIL_HOTKEY.toUpperCase()];

/**
 * Opening-reveal surfaces whose frame lists land in a later slice, each with the
 * ticket that lists it. Slice 2 empties the god rail's part; slice 3 deletes this.
 */
export const NOT_YET_LISTED: Readonly<Partial<Record<OpeningRevealSurfaceId, string>>> = {
  identity: 'THR-1894',
  essence: 'THR-1894',
  attention: 'THR-1894',
  hand: 'THR-1894',
  investiture: 'THR-1894',
  mandate: 'THR-1894',
  reaches: 'THR-1894',
  time_controls: 'THR-1875',
  settings: 'THR-1875',
  read_threads: 'THR-1875',
  doom: 'THR-1875',
  notables: 'THR-1875',
  omen: 'THR-1875',
};

/** Every reveal surface a frame list claims, with the entry that claims it. */
export function frameRevealClaims(): { surface: OpeningRevealSurfaceId; claimedBy: string }[] {
  const out: { surface: OpeningRevealSurfaceId; claimedBy: string }[] = [];
  for (const s of LEDGER_RAIL_SECTIONS) for (const r of s.revealSurfaces) out.push({ surface: r, claimedBy: `LEDGER_RAIL_SECTIONS.${s.id}` });
  for (const t of LEDGER_TABS) if (t.revealSurface) out.push({ surface: t.revealSurface, claimedBy: `LEDGER_TABS.${t.id}` });
  for (const l of LEDGER_LINES) out.push({ surface: l.revealSurface, claimedBy: `LEDGER_LINES.${l.id}` });
  return out;
}
