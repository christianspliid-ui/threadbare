/**
 * InspectorPage — one subject's page at one Inspector size (THR-1876 § D2, § D5, § D6).
 *
 * The one renderer for every page kind: header → Now → Act → body tabs → More when widened →
 * Connections (the land page: header → Now → In this land → Act → description → Around it).
 * THR-2123: the Now slot holds the page's one highlighted line (or its bond strip), drawn once.
 * It renders a `SubjectPageVM` and reads no graph (THR-1822): the body is the registry's
 * sections, filtered here by size through `sectionVisibleAt`, grouped into tabs by each
 * row's `tab`. Docked is one column; wide is two (`SheetColumns`); Full adds the
 * Connections aside.
 *
 * **Law 57, fit then fold:** wide and Full show every group whole. Docked shows every group
 * whole unless the page would overflow its column; then `planFolds` folds the longest
 * Connections groups one at a time until it fits, and only then does the column scroll
 * inside itself (Law 33). Folding is planned once per subject and size (kill criterion 4),
 * and a group the player opened with "Show all" stays open.
 */
import React, { useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { SubjectPageVM } from '../../../engine/views/subjects/subjectTypes';
import type { WorldGraph } from '../../../engine/graph';
import type { InspectorTabId, PageSurface, Section as DetailSection } from '../../../types/detailPage';
import { sectionVisibleAt } from '../../../types/detailPage';
import { INSPECTOR_TAB_ICONS, INSPECTOR_TAB_LABELS } from '../../../data/view-content';
import { ICON_FOR_WORLD_REF_KIND, recordFallbackDrawn } from '../../../data/icons/conceptIcons';
import { FALLBACK_ICON_NAME, ICON_REGISTRY, type IconName } from '../../../data/icons/iconRegistry';
import type { SubjectHeaderVM } from '../../../engine/views/subjects/subjectTypes';
import { Section } from '../../shared/Section';
import { Tabs } from '../../shared/Tabs';
import { Panel, PanelLevelScope } from '../../shared/Panel';
import { SheetColumns, SheetLayoutContext } from '../../shared/SheetColumns';
import { SubjectHeader } from './SubjectHeader';
import { ActOnRow, ConnectionsBlock, InThisLand, MoreWhenWidened, type ActCastResult } from './InspectorParts';
import { planFolds, type FoldableGroup } from './planFolds';

export type InspectorSize = 'docked' | 'wide' | 'full';

const WIDER: Record<InspectorSize, readonly PageSurface[]> = {
  docked: ['wide', 'full'],
  wide: ['full'],
  full: [],
};

/** What a rendered page reports to its host (the lab's `getInspectorLab()` reads it). */
export interface InspectorPageReport {
  sectionsShown: string[];
  foldedGroups: string[];
  hiddenForWidth: string[];
  /** THR-2097 — what the art-led dressing drew (`getInspectorLab()`, `getInspectorState()`). */
  dressing: InspectorDressingReport;
  /** THR-2123 (U4) — which reading slots sit above the fold. */
  fold: InspectorFoldReport;
}

/** THR-2097 — the dressing a page drew (plan § Debug inspection). */
export interface InspectorDressingReport {
  /** Section typeIds drawn in the aside (`placement: 'aside'`, wide and Full). */
  asideSections: string[];
  bondStrip: boolean;
  firstBadge: boolean;
  /** Art tiles drawn (tiles with an image), across every shown section. */
  galleryTiles: number;
  /** Section typeIds whose icon drew the fallback mark. */
  iconFallbacks: string[];
  /** THR-2123 (U2.6) — the section drawn in the Now slot (its typeId); null = the slot is empty. */
  nowSection: string | null;
}

/**
 * THR-2123 (U4) — whether each reading slot ends inside the page's scroll box (anatomy § 4).
 * `null` = the slot is absent on this page.
 */
export interface InspectorFoldReport {
  who: boolean;
  now: boolean | null;
  act: boolean | null;
  tabs: boolean | null;
}

/**
 * THR-2123 (U2, decision 1) — the page's Now section: the first section visible at this size
 * carrying the R5 highlight; failing that, the first carrying the R4 bond strip; else none.
 * Pure, in body order (NFP #3).
 */
export function nowSectionOf(body: readonly DetailSection[], size: InspectorSize): DetailSection | null {
  const visible = body.filter(s => s.kind === 'prose' && sectionVisibleAt(s, size));
  return visible.find(s => s.kind === 'prose' && s.highlight != null)
    ?? visible.find(s => s.kind === 'prose' && s.bond != null)
    ?? null;
}

/** Whether `el` ends within `box`'s visible height; null when the slot is absent. */
function endsInside(box: HTMLElement, el: Element | null): boolean | null {
  if (!el) return null;
  return el.getBoundingClientRect().bottom - box.getBoundingClientRect().top <= box.clientHeight;
}

interface TabGroup {
  id: InspectorTabId;
  label: string;
  /** THR-2097 (rule R2): the tab's carved idea; Overview draws the page kind's own. Null = none picked yet. */
  icon: IconName | null;
  sections: DetailSection[];
}

/** The idea the Overview tab draws: the subject kind's own (a person page draws `person`). */
export function overviewIconFor(kind: SubjectHeaderVM['visual']['kind']): IconName | null {
  // A kind with no world-ref idea (god, land, content, record) draws no icon until slice 2 picks one.
  return (ICON_FOR_WORLD_REF_KIND as Readonly<Record<string, IconName>>)[kind] ?? null;
}

/** Whether this size draws a section in the aside rather than its tab (THR-2097). */
export function inAsideAt(section: DetailSection, size: InspectorSize): boolean {
  return section.placement === 'aside' && size !== 'docked';
}

function drawsFallback(icon: IconName | undefined): boolean {
  return icon != null && (icon === FALLBACK_ICON_NAME || !(icon in ICON_REGISTRY));
}

/**
 * The visible sections at this size, grouped into tabs in table order. The Now section
 * (THR-2123) is drawn once, in its slot, so its tab skips it.
 */
export function tabsAt(body: readonly DetailSection[], size: InspectorSize, overviewIcon: IconName | null = null): TabGroup[] {
  const now = nowSectionOf(body, size);
  const groups: TabGroup[] = [];
  for (const section of body) {
    if (!sectionVisibleAt(section, size) || inAsideAt(section, size) || section === now) continue;
    const id = (section.tab ?? 'overview') as InspectorTabId;
    let g = groups.find(t => t.id === id);
    if (!g) groups.push((g = { id, label: INSPECTOR_TAB_LABELS[id], icon: id === 'overview' ? overviewIcon : INSPECTOR_TAB_ICONS[id], sections: [] }));
    g.sections.push(section);
  }
  return groups;
}

/**
 * What this size hides that a wider one shows. Whole tabs are named by their label —
 * "More when widened: Chronicle · Chapters" (plan § D5, § D6). Single sections of a shown
 * tab are named only when no whole tab is hidden: a tab the player cannot reach is the
 * news, and a line listing every wide-only row beside it stops being one line (THR-1909 —
 * the person page's wide-only Overview rows). Order follows the table.
 */
export function hiddenForWidth(body: readonly DetailSection[], size: InspectorSize): string[] {
  const shownTabs = new Set(tabsAt(body, size).map(t => t.id));
  // The Now section's tab is shown too — its section is drawn, only higher up (THR-2123).
  const now = nowSectionOf(body, size);
  if (now) shownTabs.add((now.tab ?? 'overview') as InspectorTabId);
  // A section the wider sizes draw in the aside is still in its tab here; it is not hidden.
  const tabs: string[] = [];
  const sections: string[] = [];
  for (const section of body) {
    if (sectionVisibleAt(section, size)) continue;
    if (!WIDER[size].some(s => sectionVisibleAt(section, s))) continue;
    const tab = (section.tab ?? 'overview') as InspectorTabId;
    const [list, word] = shownTabs.has(tab) ? [sections, section.label] : [tabs, INSPECTOR_TAB_LABELS[tab]];
    if (!list.includes(word)) list.push(word);
  }
  return tabs.length > 0 ? tabs : sections;
}

function Body({ tabs, tabsLabel }: { tabs: TabGroup[]; tabsLabel: string }) {
  const [tab, setTab] = useState<string>(tabs[0]?.id ?? 'overview');
  if (tabs.length === 0) return null;
  const renderSections = (sections: DetailSection[]) => sections.map(s => <Section key={s.typeId} section={s} />);
  if (tabs.length === 1) return <div data-inspector-body="">{renderSections(tabs[0].sections)}</div>;
  // Law 25: a page whose sections sit in one tab draws no tab bar.
  return (
    <div data-inspector-body="">
      {/* A tab row never scrolls sideways (THR-1821): the person's seven tabs wrap to a
          second line in the wide size's body column rather than overflow it (THR-1909). */}
      <Tabs kind="tabs" value={tabs.some(t => t.id === tab) ? tab : tabs[0].id} onChange={setTab} label={tabsLabel} style={{ flexWrap: 'wrap' }}>
        {tabs.map(t => <Tabs.Tab key={t.id} value={t.id} label={t.label} icon={t.icon ?? undefined} />)}
        {tabs.map(t => (
          <Tabs.Panel key={t.id} value={t.id}>
            <div style={{ paddingTop: 'var(--space-2)' }}>{renderSections(t.sections)}</div>
          </Tabs.Panel>
        ))}
      </Tabs>
    </div>
  );
}

interface InspectorPageProps {
  page: SubjectPageVM;
  size: InspectorSize;
  graph?: WorldGraph | null;
  /** Widen one step (the host's `W`). Absent: "More when widened" is a plain line. */
  onWiden?: () => void;
  /** The page tells its host what it showed, folded and hid (the lab, the debug bridge). */
  onReport?: (report: InspectorPageReport) => void;
  /** Toolbar content from the host (S3). Absent: no toolbar row (Law 25). */
  toolbar?: ReactNode;
  /** THR-1911 — cast one of the Act row's cards on this subject. Absent (the lab): no buttons. */
  onCast?: (actionId: string) => ActCastResult;
  /** THR-1911 — the page heading, focused when a subject opens (Law 50). */
  headingRef?: React.Ref<HTMLDivElement>;
}

export function InspectorPage({ page, size, graph, onWiden, onReport, toolbar, onCast, headingRef }: InspectorPageProps) {
  const overviewIcon = overviewIconFor(page.header.visual.kind);
  const tabs = useMemo(() => tabsAt(page.body, size, overviewIcon), [page.body, size, overviewIcon]);
  const now = useMemo(() => nowSectionOf(page.body, size), [page.body, size]);
  const asideSections = useMemo(() => page.body.filter(s => sectionVisibleAt(s, size) && inAsideAt(s, size) && s !== now), [page.body, size, now]);
  const hidden = useMemo(() => hiddenForWidth(page.body, size), [page.body, size]);
  const [opened, setOpened] = useState<ReadonlySet<string>>(new Set());
  const [folded, setFolded] = useState<ReadonlySet<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const planKey = `${page.subjectKey}|${size}`;
  const plannedFor = useRef<string | null>(null);

  // Fit, then fold — docked only, once per subject and size.
  useLayoutEffect(() => {
    if (plannedFor.current === planKey) return;
    plannedFor.current = planKey;
    const el = scrollRef.current;
    if (size !== 'docked' || !el) {
      setFolded(new Set());
      return;
    }
    const available = el.clientHeight;
    const groupEls = Array.from(el.querySelectorAll<HTMLElement>('[data-connections-group]'));
    const groups: FoldableGroup[] = groupEls.map(g => {
      const id = g.dataset.connectionsGroup ?? '';
      const vm = page.connections.groups.find(x => x.id === id);
      const rowsEls = g.querySelectorAll<HTMLElement>('[data-link-row]');
      const rowH = rowsEls.length > 0 ? rowsEls[0].offsetHeight + 4 : 0;
      const total = vm?.total ?? rowsEls.length;
      const foldAfter = vm?.foldAfter ?? total;
      const full = g.offsetHeight;
      return { id, total, fullHeight: full, foldedHeight: full - Math.max(0, total - foldAfter) * rowH + rowH };
    });
    const fixed = el.scrollHeight - groups.reduce((s, g) => s + g.fullHeight, 0);
    const plan = available > 0 ? planFolds(groups, fixed, available, page.connections.groups[0]?.foldAfter ?? 6, opened) : { folded: [], scrolls: false };
    setFolded(new Set(plan.folded));
  }, [planKey, size, page.connections.groups, opened]);

  useLayoutEffect(() => {
    const shown = [...(now ? [now] : []), ...tabs.flatMap(t => t.sections), ...asideSections];
    const iconFallbacks = shown.filter(s => drawsFallback(s.icon)).map(s => s.typeId);
    // The same misses feed `getIconReport().fallbacksDrawn` (plan § Debug inspection).
    for (const typeId of iconFallbacks) recordFallbackDrawn('inspector-section', typeId);
    if (!onReport) return;
    // THR-2123 (U4): the fold reads run only for a host that listens — no layout pass otherwise.
    const box = scrollRef.current;
    const fold: InspectorFoldReport = box
      ? {
          who: endsInside(box, box.querySelector('[data-inspector-header]')) ?? false,
          now: endsInside(box, box.querySelector('[data-inspector-now]')),
          act: endsInside(box, box.querySelector('[data-inspector-act]')),
          tabs: endsInside(box, box.querySelector('[role="tablist"]')),
        }
      : { who: false, now: null, act: null, tabs: null };
    onReport({
      sectionsShown: shown.map(s => s.typeId),
      foldedGroups: [...folded].filter(id => !opened.has(id)),
      hiddenForWidth: hidden,
      dressing: {
        asideSections: asideSections.map(s => s.typeId),
        bondStrip: shown.some(s => s.kind === 'prose' && s.bond != null),
        firstBadge: page.header.firstOf != null && size !== 'docked',
        galleryTiles: shown.reduce((n, s) => n + (s.kind === 'cards' ? s.tiles.filter(t => t.image).length : 0), 0),
        iconFallbacks,
        nowSection: now?.typeId ?? null,
      },
      fold,
    });
  }, [onReport, now, tabs, asideSections, folded, opened, hidden, page.header.firstOf, size]);

  const showAll = (id: string) => setOpened(prev => new Set([...prev, id]));
  const effectiveFolded = new Set([...folded].filter(id => !opened.has(id)));
  const isLand = page.pageKind === 'land';

  // Focus lands on the heading when a page opens (Law 50); the host owns the ref.
  const header = <div ref={headingRef} tabIndex={-1} data-inspector-heading=""><SubjectHeader header={page.header} graph={graph} compact={size === 'docked'} /></div>;
  // THR-2097 (rule R3): what the wide and Full aside draws under the Act row — the gallery.
  const asideBody = asideSections.length > 0
    ? <div data-inspector-aside-sections="">{asideSections.map(s => <Section key={s.typeId} section={s} inAside />)}</div>
    : null;
  // THR-2123 (U2): the one Now line, under Who and above Act. An empty slot draws nothing (Law 25).
  // The section keeps its own between-section margin; the slot gap already spaces it, so the
  // wrapper takes that margin back rather than doubling it.
  const nowSlot = now ? <div data-inspector-now={now.typeId} style={{ marginBottom: 'calc(-1 * var(--space-6))' }}><Section section={now} /></div> : null;
  const act = page.actOn ? <ActOnRow key={page.subjectKey} actOn={page.actOn} targetName={page.header.name} onCast={onCast} /> : null;
  const land = isLand ? <InThisLand index={page.inThisLand} /> : null;
  const body = <Body key={planKey} tabs={tabs} tabsLabel={page.header.name} />;
  const more = <MoreWhenWidened hidden={hidden} onWiden={onWiden} />;
  const connections = <ConnectionsBlock connections={page.connections} folded={effectiveFolded} onShowAll={showAll} />;
  // THR-2123 (decision 4): page slots sit the between-section distance apart.
  const gap = { display: 'flex', flexDirection: 'column' as const, gap: 'var(--space-6)', minWidth: 0 };

  let content: ReactNode;
  if (size === 'docked') {
    content = (
      <div style={gap}>
        {header}
        {nowSlot}
        {land}
        {act}
        {body}
        {more}
        {connections}
      </div>
    );
  } else {
    const main = (
      <div style={gap}>
        {body}
        {more}
        {size === 'wide' && connections}
      </div>
    );
    const aside = (
      <div style={gap}>
        {header}
        {nowSlot}
        {land}
        {act}
        {asideBody}
      </div>
    );
    content = (
      <SheetLayoutContext.Provider value="two">
        <div style={{ display: 'flex', gap: 'var(--sheet-gap, 24px)', minHeight: 0, height: '100%' }}>
          {/* A capped flex column, so SheetColumns' two columns each scroll inside the size (Law 33). */}
          <div style={{ flex: 1, minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <SheetColumns aside={aside}>{main}</SheetColumns>
          </div>
          {size === 'full' && (
            <aside data-inspector-full-aside="" style={{ width: 'var(--inspector-full-aside-w)', flexShrink: 0, overflowY: 'auto' }}>
              {connections}
            </aside>
          )}
        </div>
      </SheetLayoutContext.Provider>
    );
  }

  const inner = (
    <>
      {toolbar}
      <div ref={scrollRef} data-inspector-scroll="" style={{ flex: 1, minHeight: 0, overflowY: size === 'docked' ? 'auto' : 'hidden', overflowX: 'hidden' }}>
        {content}
      </div>
    </>
  );
  const pageAttrs = {
    'data-inspector-page': page.subjectKey,
    'data-inspector-size': size,
    'data-page-kind': page.pageKind,
  };
  const pageStyle = { display: 'flex', flexDirection: 'column' as const, height: '100%', minHeight: 0, minWidth: 0 };

  // THR-2123 (decision 2): at Full the host is a backdrop, so the page is the surface.
  if (size === 'full') {
    return (
      <Panel level="page" as="article" padding="standard" {...pageAttrs} style={pageStyle}>
        {inner}
      </Panel>
    );
  }
  // Docked and wide: the host aside is the surface, so the page draws no frame of its own;
  // nested Panels still see a panel parent (surface → card, depth ≤ 2).
  return (
    <PanelLevelScope level="panel">
      <article {...pageAttrs} data-panel-level="panel" style={{ ...pageStyle, padding: 'var(--panel-padding)' }}>
        {inner}
      </article>
    </PanelLevelScope>
  );
}
