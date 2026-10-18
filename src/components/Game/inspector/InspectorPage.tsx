/**
 * InspectorPage — one subject's page at one Inspector size (THR-1876 § D2, § D5, § D6).
 *
 * The one renderer for every page kind: header → Act → body tabs → More when widened →
 * Connections (the land page: header → In this land → Act → description → Around it).
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
import { INSPECTOR_TAB_LABELS } from '../../../data/view-content';
import { Section } from '../../shared/Section';
import { Tabs } from '../../shared/Tabs';
import { Panel } from '../../shared/Panel';
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
}

interface TabGroup {
  id: InspectorTabId;
  label: string;
  sections: DetailSection[];
}

/** The visible sections at this size, grouped into tabs in table order. */
export function tabsAt(body: readonly DetailSection[], size: InspectorSize): TabGroup[] {
  const groups: TabGroup[] = [];
  for (const section of body) {
    if (!sectionVisibleAt(section, size)) continue;
    const id = (section.tab ?? 'overview') as InspectorTabId;
    let g = groups.find(t => t.id === id);
    if (!g) groups.push((g = { id, label: INSPECTOR_TAB_LABELS[id], sections: [] }));
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
        {tabs.map(t => <Tabs.Tab key={t.id} value={t.id} label={t.label} />)}
        {tabs.map(t => (
          <Tabs.Panel key={t.id} value={t.id}>
            <div style={{ paddingTop: '10px' }}>{renderSections(t.sections)}</div>
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
  const tabs = useMemo(() => tabsAt(page.body, size), [page.body, size]);
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
    onReport?.({
      sectionsShown: tabs.flatMap(t => t.sections.map(s => s.typeId)),
      foldedGroups: [...folded].filter(id => !opened.has(id)),
      hiddenForWidth: hidden,
    });
  }, [onReport, tabs, folded, opened, hidden]);

  const showAll = (id: string) => setOpened(prev => new Set([...prev, id]));
  const effectiveFolded = new Set([...folded].filter(id => !opened.has(id)));
  const isLand = page.pageKind === 'land';

  // Focus lands on the heading when a page opens (Law 50); the host owns the ref.
  const header = <div ref={headingRef} tabIndex={-1} data-inspector-heading="" style={{ outline: 'none' }}><SubjectHeader header={page.header} graph={graph} compact={size === 'docked'} /></div>;
  const act = page.actOn ? <ActOnRow key={page.subjectKey} actOn={page.actOn} targetName={page.header.name} onCast={onCast} /> : null;
  const land = isLand ? <InThisLand index={page.inThisLand} /> : null;
  const body = <Body key={planKey} tabs={tabs} tabsLabel={page.header.name} />;
  const more = <MoreWhenWidened hidden={hidden} onWiden={onWiden} />;
  const connections = <ConnectionsBlock connections={page.connections} folded={effectiveFolded} onShowAll={showAll} />;
  const gap = { display: 'flex', flexDirection: 'column' as const, gap: '16px', minWidth: 0 };

  let content: ReactNode;
  if (size === 'docked') {
    content = (
      <div style={gap}>
        {header}
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
        {land}
        {act}
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

  return (
    <Panel
      level={size === 'full' ? 'page' : 'panel'}
      as="article"
      padding="standard"
      data-inspector-page={page.subjectKey}
      data-inspector-size={size}
      data-page-kind={page.pageKind}
      style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, minWidth: 0 }}
    >
      {toolbar}
      <div ref={scrollRef} data-inspector-scroll="" style={{ flex: 1, minHeight: 0, overflowY: size === 'docked' ? 'auto' : 'hidden', overflowX: 'hidden' }}>
        {content}
      </div>
    </Panel>
  );
}
