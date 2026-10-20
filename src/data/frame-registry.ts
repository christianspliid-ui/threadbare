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
 * | GOD_RAIL_OPEN_ROWS_KEY | 'threadbare.ui.godRail.openRows' | The folded rows the player opened (Law 51) |
 * | GOD_RAIL_HAND_GROUP_KEY | 'threadbare.ui.godRail.handGroup' | The hand group the player last opened (Law 51) |
 * | NEEDS_YOU_HOTKEY | 'n' | Opens or closes Needs you while its pill renders |
 */
import type { IconName } from './icons/iconRegistry';
import type { OpeningRevealSurfaceId } from './opening-reveal-table';
import {
  CHRONICLE_LABEL,
  GOD_RAIL_LABELS,
  CHRONICLE_TAB_LABELS,
  STRIP_COUNT_LABELS,
  THREADS_LABEL,
  WORLD_SOUL_LABEL,
  TOP_BAR_WORDS,
  NEEDS_YOU_LABEL,
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

// ─── The god rail (slice 2, THR-1894; plan § F6) ────────────────────

export type GodRailSectionId = 'identity' | 'essence' | 'hand' | 'reaches' | 'mandate' | 'covenants' | 'signatures' | 'hooks';

/** Where a section sits: pinned at the top, the hand filling the middle, or folded to one line at the foot. */
export type GodRailPlace = 'pinned' | 'fill' | 'folded';

export interface GodRailSectionDef {
  id: GodRailSectionId;
  place: GodRailPlace;
  order: number;
  label: string;
  tooltipId: string | null;
  /** The opening-reveal surfaces this section claims (essence claims Attention; the hand claims Investiture). */
  revealSurfaces: readonly OpeningRevealSurfaceId[];
  /** False for covenants, signatures and hooks: an empty section does not render (THR-1814 rule 4). */
  rendersWhenEmpty: boolean;
}

/**
 * The god rail, top to bottom (THR-1828 call 2): who you are, what you hold, what you
 * can cast, then the folded rows. Adding a row is one entry here and one body in
 * `frame/godRailComponents.tsx`.
 */
export const GOD_RAIL_SECTIONS: readonly GodRailSectionDef[] = [
  { id: 'identity', place: 'pinned', order: 1, label: GOD_RAIL_LABELS.identity, tooltipId: 'ui.ascendant_name', revealSurfaces: ['identity'], rendersWhenEmpty: true },
  { id: 'essence', place: 'pinned', order: 2, label: GOD_RAIL_LABELS.essence, tooltipId: null, revealSurfaces: ['essence', 'attention'], rendersWhenEmpty: true },
  { id: 'hand', place: 'fill', order: 3, label: GOD_RAIL_LABELS.hand, tooltipId: 'ui.your_cards', revealSurfaces: ['hand', 'investiture'], rendersWhenEmpty: true },
  { id: 'reaches', place: 'folded', order: 4, label: GOD_RAIL_LABELS.reaches, tooltipId: 'ui.reaches', revealSurfaces: ['reaches', 'dominion'], rendersWhenEmpty: true },
  { id: 'mandate', place: 'folded', order: 5, label: GOD_RAIL_LABELS.mandate, tooltipId: null, revealSurfaces: ['mandate'], rendersWhenEmpty: true },
  { id: 'covenants', place: 'folded', order: 6, label: GOD_RAIL_LABELS.covenants, tooltipId: 'ui.covenant', revealSurfaces: [], rendersWhenEmpty: false },
  { id: 'signatures', place: 'folded', order: 7, label: GOD_RAIL_LABELS.signatures, tooltipId: 'ui.signatures', revealSurfaces: [], rendersWhenEmpty: false },
  { id: 'hooks', place: 'folded', order: 8, label: GOD_RAIL_LABELS.hooks, tooltipId: 'ui.hooks', revealSurfaces: [], rendersWhenEmpty: false },
];

/** The folded rows the player opened (Law 51). Every row starts closed. */
export const GOD_RAIL_OPEN_ROWS_KEY = 'threadbare.ui.godRail.openRows';
/** The hand group the player last opened, when the hand groups at the rail's limit (Law 51). */
export const GOD_RAIL_HAND_GROUP_KEY = 'threadbare.ui.godRail.handGroup';

// ─── The top bar (slice 3, THR-1875; plan § F3) ─────────────────────

export type TopBarItemId = 'time' | 'needs_you' | 'direction_line' | 'find' | 'doom' | 'omen' | 'rivals' | 'notables' | 'read_threads' | 'settings';

/** The THR-1648 quiet-first-screen gates (`FirstScreenReveal`'s keys), ANDed with the reveal. */
export type FirstScreenGateId = 'bonded' | 'doom' | 'mandate' | 'notables' | 'rivals' | 'omens';

export interface TopBarItemDef {
  id: TopBarItemId;
  /** `centre` is Find's slot between the groups (THR-1915). */
  group: 'left' | 'centre' | 'right';
  order: number;
  /** The word, always shown (THR-1834 § 5); '' only where the item is text itself (time, direction line). */
  label: string;
  /** null only where the item is text (time, direction line, doom, omen). */
  icon: IconName | null;
  /** null only with a named reason in `TOOLTIP_NONE_REASONS`. */
  tooltipId: string | null;
  revealSurface: OpeningRevealSurfaceId | null;
  firstScreenGate: FirstScreenGateId | null;
  /** THR-1814: dims and swallows presses while an encounter is open. */
  guardedWhileEncounter: boolean;
  hotkey: string | null;
}

/** `N` opens or closes Needs you while its pill renders (§ F10). */
export const NEEDS_YOU_HOTKEY = 'n';

/**
 * The top bar, left to right (THR-1828 call 1). The centre between the groups is Find's
 * slot (THR-1915: the `find` entry). Adding a button is one entry here and one component
 * in `GameViewTopBar`'s `ITEM` map. Find's keys (`/`, Ctrl+K) are `FIND_HOTKEYS` /
 * `FIND_CTRL_KEY` in `top-bar-keys.ts`, so its `hotkey` stays null here.
 */
export const TOP_BAR_ITEMS: readonly TopBarItemDef[] = [
  { id: 'time', group: 'left', order: 1, label: '', icon: null, tooltipId: 'ui.sim_speed', revealSurface: 'time_controls', firstScreenGate: null, guardedWhileEncounter: false, hotkey: null },
  { id: 'needs_you', group: 'left', order: 2, label: NEEDS_YOU_LABEL, icon: 'needs-you', tooltipId: 'ui.needs_you', revealSurface: null, firstScreenGate: 'bonded', guardedWhileEncounter: false, hotkey: NEEDS_YOU_HOTKEY },
  { id: 'direction_line', group: 'left', order: 3, label: '', icon: null, tooltipId: null, revealSurface: null, firstScreenGate: null, guardedWhileEncounter: false, hotkey: null },
  { id: 'find', group: 'centre', order: 1, label: TOP_BAR_WORDS.find, icon: 'find', tooltipId: null, revealSurface: null, firstScreenGate: 'bonded', guardedWhileEncounter: true, hotkey: null },
  { id: 'doom', group: 'right', order: 1, label: TOP_BAR_WORDS.doom, icon: null, tooltipId: 'ui.doom_bar', revealSurface: 'doom', firstScreenGate: 'doom', guardedWhileEncounter: true, hotkey: null },
  { id: 'omen', group: 'right', order: 2, label: TOP_BAR_WORDS.omen, icon: null, tooltipId: 'ui.omen', revealSurface: 'omen', firstScreenGate: 'omens', guardedWhileEncounter: true, hotkey: null },
  { id: 'rivals', group: 'right', order: 3, label: TOP_BAR_WORDS.rivals, icon: 'rivals', tooltipId: 'ui.rival_panel', revealSurface: null, firstScreenGate: 'rivals', guardedWhileEncounter: true, hotkey: null },
  { id: 'notables', group: 'right', order: 4, label: TOP_BAR_WORDS.notables, icon: 'notables', tooltipId: 'ui.notables', revealSurface: 'notables', firstScreenGate: 'notables', guardedWhileEncounter: true, hotkey: null },
  { id: 'read_threads', group: 'right', order: 5, label: TOP_BAR_WORDS.readThreads, icon: 'read-the-threads', tooltipId: 'ui.read_threads', revealSurface: 'read_threads', firstScreenGate: null, guardedWhileEncounter: true, hotkey: null },
  { id: 'settings', group: 'right', order: 6, label: TOP_BAR_WORDS.settings, icon: 'settings', tooltipId: null, revealSurface: 'settings', firstScreenGate: null, guardedWhileEncounter: true, hotkey: null },
];

/** Why a top-bar item carries no tooltip (check 1 reads this). */
export const TOOLTIP_NONE_REASONS: Readonly<Partial<Record<TopBarItemId, string>>> = {
  direction_line: 'THR-1837: the line is its own sentence; its full form is its tooltip when shortened',
  settings: 'a control, not a concept',
  find: 'a search field; its placeholder says what it finds',
};

/** What gives way, in order, when the bar would overflow (§ F3). Undone in reverse. */
export const TOP_BAR_YIELD_ORDER = ['centre', 'time_status', 'doom_name', 'omen_name', 'direction_short'] as const;
export type TopBarYieldStep = (typeof TOP_BAR_YIELD_ORDER)[number];

/** `L` folds or unfolds the rail; with the Inspector open it toggles the flyout (§ F8, § F10). */
export const LEDGER_RAIL_HOTKEY = 'l';

/**
 * Every key the frame answers, collected from its list entries and spread into
 * `TOP_BAR_KEYS` (`top-bar-keys.ts`), whose overlap test keeps each key single-claimed.
 * Never hand-kept beside the lists. Both cases, as `m` / `M` are.
 */
export const FRAME_HOTKEYS: readonly string[] = [
  LEDGER_RAIL_HOTKEY,
  LEDGER_RAIL_HOTKEY.toUpperCase(),
  ...TOP_BAR_ITEMS.flatMap(i => (i.hotkey ? [i.hotkey, i.hotkey.toUpperCase()] : [])),
];

/** Every reveal surface a frame list claims, with the entry that claims it. */
export function frameRevealClaims(): { surface: OpeningRevealSurfaceId; claimedBy: string }[] {
  const out: { surface: OpeningRevealSurfaceId; claimedBy: string }[] = [];
  for (const t of TOP_BAR_ITEMS) if (t.revealSurface) out.push({ surface: t.revealSurface, claimedBy: `TOP_BAR_ITEMS.${t.id}` });
  for (const s of LEDGER_RAIL_SECTIONS) for (const r of s.revealSurfaces) out.push({ surface: r, claimedBy: `LEDGER_RAIL_SECTIONS.${s.id}` });
  for (const t of LEDGER_TABS) if (t.revealSurface) out.push({ surface: t.revealSurface, claimedBy: `LEDGER_TABS.${t.id}` });
  for (const l of LEDGER_LINES) out.push({ surface: l.revealSurface, claimedBy: `LEDGER_LINES.${l.id}` });
  for (const g of GOD_RAIL_SECTIONS) for (const r of g.revealSurfaces) out.push({ surface: r, claimedBy: `GOD_RAIL_SECTIONS.${g.id}` });
  return out;
}
