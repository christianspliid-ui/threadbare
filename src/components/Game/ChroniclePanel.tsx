/**
 * ChroniclePanel — the Chronicle section of the Ledger rail (THR-1656; THR-1893).
 *
 * THR-1893 (frame plan § F7): the World-Soul line heads it (moved from the top bar);
 * its entries sit under three tabs, Now · Years · Ledger (THR-1885's `Tabs`), the
 * selected tab and the voice toggle remembered (Law 51); the 320 px cap on the entry
 * list is gone, so the list takes the rail's free height and scrolls inside it only at
 * the rail's limit (Law 57). The Chapter Ledger launcher button became the Ledger tab.
 */
import { useCallback, useEffect, useMemo, useState, type CSSProperties, type ReactElement } from 'react';
import type { ChronicleEntry } from '../../types/narrative';
import type { BeforeYouWokeGroup, BeforeYouWokeGroupKey } from '../../engine/worldPastWords';
import { BEFORE_YOU_WOKE_HEADING } from '../../data/world-past-content';
import { ChronicleEntryCard, type ChronicleVoiceMode } from './ChronicleEntryCard';
import { PastLineText } from './PastLineText';
import { SectionHeading } from '../shared/SectionHeading';
import { Tooltip } from '../shared/Tooltip';
import { Tabs } from '../shared/Tabs';
import { Icon } from '../shared/Icon';
import { Button } from '../shared/Button';
import { ListRow } from '../shared/ListRow';
import { renderProseWithIPK } from '../ProseKeyword';
import { NEWLY_REVEALED_STYLE } from './GameView/openingReveal';
import type { LedgerRailVM } from '../../engine/views/ledgerRail';
import { LEDGER_LINES, LEDGER_TABS, type LedgerTabId } from '../../data/frame-registry';
import {
  CHRONICLE_EMPTY_LINE,
  CHRONICLE_LABEL,
  CHRONICLE_VOICE_LABEL,
  LEDGER_TAB_EMPTY,
  LEDGER_TAB_NEW,
  LEDGER_TAB_OPEN_BUTTON,
  LEDGER_TAB_UNREAD,
  chronicleTooltipDesc,
  countWords,
} from '../../data/frame-content';

type ChronicleVM = Pick<LedgerRailVM, 'worldSoul' | 'now' | 'years' | 'ledger'>;

interface ChroniclePanelProps {
  entries: ChronicleEntry[];
  /** Current simulation tick, so each entry can read how long ago it happened (THR-1426). */
  currentTick?: number;
  /**
   * The world's past, worded and fog-gated (THR-1656) — the pinned "Before you woke"
   * section above the entries. Absent or empty ⇒ the section does not render.
   */
  past?: BeforeYouWokeGroup[];
  /**
   * THR-1893 — the Ledger rail's view model: the World-Soul line, the Now window, the
   * year groups and the Ledger tab's rows. Absent (a lab view, an older test) ⇒ every
   * entry lists under Now and no Years or Ledger tab renders.
   */
  vm?: ChronicleVM;
  /** Which staged parts are revealed (THR-1837), and which just arrived (the gold ring). */
  reveal?: { worldSoul: boolean; ledger: boolean; newlyWorldSoul?: boolean; newlyLedger?: boolean };
  /** True while the panel is on screen (the rail open, or the flyout); gates "seen". */
  visible?: boolean;
  /** Open the Chapter Ledger reader at a row's chapter, or at the newest (null). */
  onOpenLedger?: (recordKey: string | null) => void;
  /** The Ledger tab showed its new rows: record the count as seen (Law 40). */
  onLedgerSeen?: () => void;
}

const VOICE_LABELS: Record<ChronicleVoiceMode, string> = {
  interleaved: 'Both',
  poet: 'Poet',
  witness: 'Witness',
};

/**
 * Where the "Before you woke" collapsed state persists (Law 51 — a player-set preference
 * outlives the session; the `threadbare.ui.*` key family). Stored as the set of collapsed
 * keys, so the default — everything open the first time the panel opens — is the empty set.
 */
export const BEFORE_YOU_WOKE_COLLAPSE_STORE_KEY = 'threadbare.ui.chronicle.beforeYouWokeCollapsed';

/** THR-1893 — the selected Chronicle tab and voice, remembered (Law 51). */
export const CHRONICLE_TAB_KEY = 'threadbare.ui.chronicle.tab';
export const CHRONICLE_VOICE_KEY = 'threadbare.ui.chronicle.voice';
/** THR-1893 — the Years groups the player opened or folded, remembered. */
export const CHRONICLE_YEARS_TOGGLED_KEY = 'threadbare.ui.chronicle.yearsToggled';

function readStored<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw && (allowed as readonly string[]).includes(raw) ? (raw as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeStored(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Quota or private browsing — the choice still holds for this session.
  }
}

const VOICE_MODES: readonly ChronicleVoiceMode[] = ['interleaved', 'poet', 'witness'];
const TAB_IDS: readonly LedgerTabId[] = LEDGER_TABS.map(t => t.id);

type CollapseKey = 'section' | BeforeYouWokeGroupKey;

/** Fail-soft (NFP #4): private browsing throws on `localStorage`; the designed failure is "all open". */
function readCollapsed(): Set<CollapseKey> {
  try {
    const raw = localStorage.getItem(BEFORE_YOU_WOKE_COLLAPSE_STORE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? (parsed.filter(k => typeof k === 'string') as CollapseKey[]) : []);
  } catch {
    return new Set();
  }
}

function writeCollapsed(collapsed: Set<CollapseKey>): void {
  writeStored(BEFORE_YOU_WOKE_COLLAPSE_STORE_KEY, JSON.stringify([...collapsed]));
}

const TOGGLE_STYLE = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  width: '100%',
  background: 'none',
  border: 'none',
  padding: 0,
  cursor: 'pointer',
  textAlign: 'left' as const,
  color: 'inherit',
};

const LABEL_STYLE = {
  fontFamily: 'var(--font-body)',
  fontWeight: 700,
  fontSize: 'var(--text-xs)',
  color: 'var(--text-tertiary)',
} as const;

function Caret({ open }: { open: boolean }) {
  return (
    <span aria-hidden="true" style={{ color: 'var(--accent-gold-dim)', fontSize: 'var(--text-xs)', width: '10px' }}>
      {open ? '▾' : '▸'}
    </span>
  );
}

/**
 * The pinned chapter (plan § UI pillar item 1, Lane decision 6): four counted, collapsible
 * groups (Law 36); every Realm, place and person a link through the one router (Law 21).
 * The section scrolls inside itself so the panel never pushes past the viewport (Law 33).
 */
function BeforeYouWoke({ groups }: { groups: BeforeYouWokeGroup[] }) {
  const [collapsed, setCollapsed] = useState<Set<CollapseKey>>(readCollapsed);
  const toggle = useCallback((key: CollapseKey) => {
    setCollapsed(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      writeCollapsed(next);
      return next;
    });
  }, []);
  const sectionOpen = !collapsed.has('section');

  return (
    <section data-testid="before-you-woke" aria-label={BEFORE_YOU_WOKE_HEADING}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <button
          type="button"
          onClick={() => toggle('section')}
          aria-expanded={sectionOpen}
          aria-label={`${sectionOpen ? 'Collapse' : 'Expand'} ${BEFORE_YOU_WOKE_HEADING}`}
          style={{ ...TOGGLE_STYLE, width: 'auto' }}
        >
          <Caret open={sectionOpen} />
        </button>
        <Tooltip id="ui.before_you_woke">
          <span
            style={{
              fontFamily: 'var(--font-body)',
              fontWeight: 700,
              fontSize: 'var(--text-xs)',
              color: 'var(--accent-gold)',
              cursor: 'help',
            }}
          >
            {BEFORE_YOU_WOKE_HEADING}
          </span>
        </Tooltip>
      </div>
      {sectionOpen && (
        <div
          style={{
            overflowY: 'auto',
            maxHeight: '280px',
            marginTop: '8px',
            paddingRight: '4px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          {groups.map(group => {
            const open = !collapsed.has(group.key);
            return (
              <div key={group.key} data-testid={`before-you-woke-${group.key}`}>
                <button
                  type="button"
                  onClick={() => toggle(group.key)}
                  aria-expanded={open}
                  style={TOGGLE_STYLE}
                >
                  <Caret open={open} />
                  <SectionHeading as="div" count={group.count}>{group.title}</SectionHeading>
                </button>
                {open && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px', paddingLeft: '16px' }}>
                    {group.lines.map(line => (
                      <PastLineText
                        key={line.id}
                        line={line}
                        style={{
                          font: 'var(--type-body-prose)',
                          color: 'var(--text-secondary)',
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

/**
 * The World-Soul line (frame plan § F7): the label, the World-Soul sentence for the
 * dominant sphere, then the mood of the doom stage — in the story face, at most three lines.
 */
function WorldSoulLine({ worldSoul, newly }: { worldSoul: NonNullable<ChronicleVM['worldSoul']>; newly: boolean }) {
  const tooltipId = LEDGER_LINES.find(l => l.id === 'world_soul')?.tooltipId ?? 'ui.world_soul';
  return (
    <Tooltip id={tooltipId}>
      <div
        data-testid="world-soul-line"
        data-newly-revealed={newly ? 'true' : undefined}
        style={{ ...(newly ? NEWLY_REVEALED_STYLE : {}), cursor: 'help' }}
      >
        <div style={LABEL_STYLE}>{worldSoul.label}</div>
        <p
          style={{
            margin: 0,
            fontFamily: 'var(--font-prose)',
            fontSize: 'var(--text-sm)',
            color: 'var(--text-secondary)',
            lineHeight: 1.4,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {renderProseWithIPK(worldSoul.sentence)} {worldSoul.mood}
        </p>
      </div>
    </Tooltip>
  );
}

function readYearsToggled(): Set<number> {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(CHRONICLE_YEARS_TOGGLED_KEY) ?? '[]');
    return new Set(Array.isArray(parsed) ? parsed.filter((n): n is number => typeof n === 'number') : []);
  } catch {
    return new Set();
  }
}

/**
 * Years: one counted, foldable group per calendar year, newest first. The newest year
 * starts open and the older ones folded; a toggled year flips that default, remembered.
 */
function YearsList({
  years, byId, voiceMode, currentTick,
}: {
  years: ChronicleVM['years'];
  byId: Map<string, ChronicleEntry>;
  voiceMode: ChronicleVoiceMode;
  currentTick?: number;
}) {
  const [toggled, setToggled] = useState<Set<number>>(readYearsToggled);
  const toggle = (year: number) => setToggled(prev => {
    const next = new Set(prev);
    if (next.has(year)) next.delete(year);
    else next.add(year);
    writeStored(CHRONICLE_YEARS_TOGGLED_KEY, JSON.stringify([...next]));
    return next;
  });
  return (
    <div data-testid="chronicle-years" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {years.map((group, i) => {
        const open = (i === 0) !== toggled.has(group.year);
        return (
          <div key={group.year} data-testid={`chronicle-year-${group.year}`}>
            <button type="button" onClick={() => toggle(group.year)} aria-expanded={open} style={{ ...TOGGLE_STYLE, minHeight: '1.5rem' }}>
              <Icon name="disclosure" size="floor" decorative style={{ transform: open ? 'rotate(90deg)' : 'none' }} />
              <span style={LABEL_STYLE}>{group.label}</span>
            </button>
            {open && group.entryIds.map(id => {
              const entry = byId.get(id);
              return entry ? <ChronicleEntryCard key={id} entry={entry} voiceMode={voiceMode} currentTick={currentTick} /> : null;
            })}
          </div>
        );
      })}
    </div>
  );
}

/**
 * The Ledger tab (frame plan § F7): the threaded chapters, newest first, the unread ones
 * marked "new"; a row opens the reader at that chapter. The rows are the reader's own
 * default rows (`selectThreadedChapters`). Showing the tab marks the new rows first and
 * only then records them as seen, so the count never clears before its rows are seen (Law 40).
 */
function LedgerTab({
  ledger, shown, onOpenLedger, onLedgerSeen,
}: {
  ledger: ChronicleVM['ledger'];
  shown: boolean;
  onOpenLedger?: (key: string | null) => void;
  onLedgerSeen?: () => void;
}) {
  const [marked, setMarked] = useState<Set<string>>(() => new Set());
  useEffect(() => {
    if (!shown) {
      setMarked(prev => (prev.size === 0 ? prev : new Set()));
      return;
    }
    if (ledger.unread <= 0) return;
    const fresh = ledger.rows.filter(r => r.isNew).map(r => r.recordId);
    setMarked(prev => new Set([...prev, ...fresh]));
    onLedgerSeen?.();
  }, [shown, ledger.unread, ledger.rows, onLedgerSeen]);

  return (
    <div data-testid="chronicle-ledger-tab" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {ledger.rows.length === 0 ? (
        <p style={{ margin: 0, fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
          {LEDGER_TAB_EMPTY}
        </p>
      ) : (
        ledger.rows.map(row => {
          const isNew = marked.has(row.recordId) || row.isNew;
          return (
            <div key={row.recordId} data-testid="chronicle-ledger-row" data-record-id={row.recordId} data-new={isNew ? 'true' : undefined}>
              <ListRow
                onClick={() => onOpenLedger?.(row.recordId)}
                trailing={isNew ? <span style={{ ...LABEL_STYLE, color: 'var(--text-secondary)' }}>{LEDGER_TAB_NEW}</span> : undefined}
              >
                <span style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
                  <ListRow.Title>{row.name}</ListRow.Title>
                  <ListRow.Subtitle>{row.mortalName} · {row.state}</ListRow.Subtitle>
                </span>
              </ListRow>
            </div>
          );
        })
      )}
      <Button variant="secondary" fullWidth data-testid="chronicle-ledger-open" onClick={() => onOpenLedger?.(null)}>
        {LEDGER_TAB_OPEN_BUTTON}
      </Button>
    </div>
  );
}

/** Without a view model: every entry under Now, no Years or Ledger tab. */
function allEntriesVm(entries: ChronicleEntry[]): ChronicleVM {
  const ids = [...entries].reverse().map(e => e.id);
  return {
    worldSoul: null,
    now: { entryIds: ids, emptyLine: ids.length ? null : CHRONICLE_EMPTY_LINE },
    years: [],
    ledger: { rows: [], unread: 0 },
  };
}

const PANEL_SCROLL_STYLE = { flex: '1 1 auto', minHeight: 0, overflowY: 'auto', paddingTop: '8px' } as const;

/** What every Chronicle tab panel is handed. */
export interface ChronicleTabPanelProps {
  vm: ChronicleVM;
  byId: Map<string, ChronicleEntry>;
  voiceMode: ChronicleVoiceMode;
  setVoiceMode: (mode: ChronicleVoiceMode) => void;
  currentTick?: number;
  past?: BeforeYouWokeGroup[];
  /** This panel's tab is selected and the Chronicle is on screen. */
  shown: boolean;
  onOpenLedger?: (recordKey: string | null) => void;
  onLedgerSeen?: () => void;
}

/** Now: "Before you woke" pinned, the voice toggle, then the last seasons' entries. */
function NowPanel({ vm, byId, voiceMode, setVoiceMode, currentTick, past }: ChronicleTabPanelProps) {
  const nowEntries = vm.now.entryIds.map(id => byId.get(id)).filter((e): e is ChronicleEntry => !!e);
  return (
    <>
      {/* The world's past, pinned at the top of Now (THR-1656) */}
      {past && past.length > 0 && <BeforeYouWoke groups={past} />}
      <Tabs
        kind="toggle"
        value={voiceMode}
        onChange={(v) => { if (v) setVoiceMode(v as ChronicleVoiceMode); }}
        label={CHRONICLE_VOICE_LABEL}
      >
        {VOICE_MODES.map(mode => <Tabs.Tab key={mode} value={mode} label={VOICE_LABELS[mode]} />)}
      </Tabs>
      <div data-testid="chronicle-entries" aria-live="polite" aria-label="Game chronicle">
        {nowEntries.length === 0 ? (
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
            {vm.now.emptyLine ?? CHRONICLE_EMPTY_LINE}
          </p>
        ) : (
          nowEntries.map(entry => (
            <ChronicleEntryCard key={entry.id} entry={entry} voiceMode={voiceMode} currentTick={currentTick} />
          ))
        )}
      </div>
    </>
  );
}

function YearsPanel({ vm, byId, voiceMode, currentTick }: ChronicleTabPanelProps) {
  return <YearsList years={vm.years} byId={byId} voiceMode={voiceMode} currentTick={currentTick} />;
}

function LedgerPanel({ vm, shown, onOpenLedger, onLedgerSeen }: ChronicleTabPanelProps) {
  return <LedgerTab ledger={vm.ledger} shown={shown} onOpenLedger={onOpenLedger} onLedgerSeen={onLedgerSeen} />;
}

/**
 * The Chronicle's tab panels, one per `LEDGER_TABS` entry (Law 58). A `Record` keyed by
 * the closed id union, so a tab added to the registry without a panel is a type error.
 */
export const LEDGER_TAB_PANELS: Record<LedgerTabId, (props: ChronicleTabPanelProps) => ReactElement> = {
  now: NowPanel,
  years: YearsPanel,
  ledger: LedgerPanel,
};

const PANEL_LAYOUT: Record<LedgerTabId, CSSProperties> = {
  now: { ...PANEL_SCROLL_STYLE, display: 'flex', flexDirection: 'column', gap: '12px' },
  years: PANEL_SCROLL_STYLE,
  ledger: PANEL_SCROLL_STYLE,
};

export function ChroniclePanel({
  entries, currentTick, past, vm: vmProp, reveal, visible = true, onOpenLedger, onLedgerSeen,
}: ChroniclePanelProps) {
  const vm = vmProp ?? allEntriesVm(entries);
  const [voiceMode, setVoiceModeState] = useState<ChronicleVoiceMode>(() => readStored(CHRONICLE_VOICE_KEY, VOICE_MODES, 'interleaved'));
  const setVoiceMode = (mode: ChronicleVoiceMode) => {
    setVoiceModeState(mode);
    writeStored(CHRONICLE_VOICE_KEY, mode);
  };
  const [storedTab, setStoredTab] = useState<LedgerTabId>(() => readStored(CHRONICLE_TAB_KEY, TAB_IDS, 'now'));

  const byId = useMemo(() => new Map(entries.map(e => [e.id, e])), [entries]);

  // Which tabs render: Years only once the entries span two calendar years, else it would
  // repeat Now (Law 25); Ledger once revealed (THR-1837's chapter_ledger row).
  const rendered = LEDGER_TABS.filter(t =>
    t.id === 'now'
    || (t.id === 'years' && vm.years.length >= 2)
    || (t.id === 'ledger' && !!vmProp && (reveal?.ledger ?? true)),
  );
  const tab: LedgerTabId = rendered.some(t => t.id === storedTab) ? storedTab : 'now';
  const selectTab = (next: string) => {
    if (!(TAB_IDS as readonly string[]).includes(next)) return;
    setStoredTab(next as LedgerTabId);
    writeStored(CHRONICLE_TAB_KEY, next);
  };

  return (
    <div
      data-testid="chronicle-panel"
      data-tab={tab}
      data-tabs-rendered={rendered.map(t => t.id).join(',')}
      style={{
        background: 'var(--bg-deep)',
        border: '1px solid var(--border-gold)',
        borderRadius: '8px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        // Law 57: grow to the rail's free height; the entries scroll inside it at the limit.
        flex: '1 1 auto',
        minHeight: 0,
      }}
    >
      <Tooltip id="ui.chronicle" desc={chronicleTooltipDesc()}>
        <span style={{ ...LABEL_STYLE, cursor: 'help', alignSelf: 'flex-start' }}>{CHRONICLE_LABEL}</span>
      </Tooltip>

      {vm.worldSoul && (reveal?.worldSoul ?? true) && (
        <WorldSoulLine worldSoul={vm.worldSoul} newly={!!reveal?.newlyWorldSoul} />
      )}

      {/* Tabs renders its bar and panels as siblings, so this column holds them both. */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: '1 1 auto', minHeight: 0 }}>
      <Tabs kind="tabs" value={tab} onChange={selectTab} label={CHRONICLE_LABEL}>
        {rendered.map(t => (
          <Tabs.Tab
            key={t.id}
            value={t.id}
            label={t.label}
            testId={`chronicle-tab-${t.id}`}
            {...(t.tooltipId ? { tooltipId: t.tooltipId } : {})}
            {...(t.id === 'ledger'
              ? { count: { value: vm.ledger.unread, label: countWords(vm.ledger.unread, LEDGER_TAB_UNREAD) } }
              : {})}
          />
        ))}
        {rendered.map(t => {
          const TabPanel = LEDGER_TAB_PANELS[t.id];
          return (
            <Tabs.Panel key={t.id} value={t.id} style={PANEL_LAYOUT[t.id]}>
              <TabPanel
                vm={vm}
                byId={byId}
                voiceMode={voiceMode}
                setVoiceMode={setVoiceMode}
                currentTick={currentTick}
                past={past}
                shown={visible && tab === t.id}
                onOpenLedger={onOpenLedger}
                onLedgerSeen={onLedgerSeen}
              />
            </Tabs.Panel>
          );
        })}
      </Tabs>
      </div>
    </div>
  );
}
