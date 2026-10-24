/**
 * The Inspector lab — `?view=inspector-lab` (THR-1876 § D12).
 *
 * Where an agent looks to see a page layout change on save (Law 58's "where to see it").
 * It builds the world exactly as `?view=game&seeded&size=medium` does (the dev identity,
 * seed 42, The First bonded, the test package), runs `INSPECTOR_LAB_WARM_TICKS` ticks
 * headlessly, and draws one real page per page kind — plus the chain rows and the stress
 * case — at docked, wide and Full, each at the tier's real pixel width and the Inspector's
 * real height. A screen toggle sets the 1080p / 1440p root size and frame tokens, so both
 * tiers show on one monitor. It reads the same table, view models and renderer as the
 * game, so a registry edit shows on Vite's hot reload.
 *
 * A dev surface: it may scroll, and it is excluded from the UI-debt ratchet (lab pattern).
 * Deep links: `?view=inspector-lab&kind=faction&size=wide&tier=1440`. `&seed=N` builds
 * another world (default 42) — for a terrain seed 42 lacks (THR-1998: it has no lake).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { GameState } from '../../../../types/gameState';
import type { SimulationRuntime } from '../../../../engine/simulationRuntime';
import { createSimulationRuntime } from '../../../../engine/simulationRuntime';
import { initializeGameStateFromIdentity, devSeedTheFirst, devSeedAscendantTestPackage, DEV_ASCENDANT_IDENTITY } from '../../../../engine/gameInit';
import { runTick } from '../../../../engine/orchestrator';
import { buildSubjectPage } from '../../../../engine/views/subjects/subjectPage';
import type { SubjectPageVM } from '../../../../engine/views/subjects/subjectTypes';
import type { DebugInspectorLabCell, DebugInspectorLabResult } from '../../../../debug-bridge.d';
import { InspectorPage, type InspectorPageReport, type InspectorSize } from '../InspectorPage';
import { INSPECTOR_LAB_EXTRA, INSPECTOR_LAB_SUBJECTS, type LabPick } from './labSubjects';
import { buildStressPage } from './stressFixture';

/** Ticks the lab runs before rendering (THR-1822's measurement tick). */
export const INSPECTOR_LAB_WARM_TICKS = 30;
/** Ticks per build step, so the placeholder breathes while the world warms (Law 54). */
const WARM_TICKS_PER_STEP = 5;

type Tier = '1080' | '1440';
const SIZES: readonly InspectorSize[] = ['docked', 'wide', 'full'];

/** The two screens' frame numbers (THR-1819 tokens) — what the toggle writes on `:root`. */
const TIER_TOKENS: Record<Tier, { rootPx: number; vars: Record<string, string>; viewport: { w: number; h: number }; topbar: number; rail: number }> = {
  '1080': {
    rootPx: 16,
    vars: { '--inspector-w': '560px', '--inspector-wide-w': '960px', '--inspector-full-trail-w': '240px', '--inspector-full-aside-w': '360px' },
    viewport: { w: 1920, h: 1080 },
    topbar: 48,
    rail: 320,
  },
  '1440': {
    rootPx: 18,
    vars: { '--inspector-w': '717px', '--inspector-wide-w': '1280px', '--inspector-full-trail-w': '300px', '--inspector-full-aside-w': '440px' },
    viewport: { w: 2560, h: 1440 },
    topbar: 56,
    rail: 400,
  },
};

interface LabRow {
  id: string;
  label: string;
  page: SubjectPageVM | null;
  fallback: string;
}

/** The lab world seed when `?seed=` is absent or not a whole number. */
const INSPECTOR_LAB_DEFAULT_SEED = 42;

function buildLabWorld(seed: number): { state: GameState; runtime: SimulationRuntime } {
  const runtime = createSimulationRuntime();
  const init = initializeGameStateFromIdentity(DEV_ASCENDANT_IDENTITY, seed, undefined, 'medium');
  devSeedTheFirst(init.state);
  devSeedAscendantTestPackage(init.state);
  return { state: init.state, runtime };
}

function rowsFor(state: GameState, runtime: SimulationRuntime): LabRow[] {
  const picks: Array<[string, LabPick]> = [
    ...Object.entries(INSPECTOR_LAB_SUBJECTS),
    ...INSPECTOR_LAB_EXTRA.map((p, i) => [`extra${i}`, p] as [string, LabPick]),
  ];
  const rows: LabRow[] = picks.map(([id, pick]) => {
    let page: SubjectPageVM | null = null;
    try {
      const subject = pick.pick(state);
      page = subject ? buildSubjectPage(state, subject, runtime) : null;
    } catch (err) {
      console.warn(`[inspector-lab] ${id} pick failed`, err);
    }
    return { id, label: pick.label, page, fallback: pick.fallback };
  });
  rows.push({ id: 'stress', label: 'Stress — long name, 30 rows in one group, 15 sections', page: buildStressPage(), fallback: '' });
  return rows;
}

/** Digits and raw ids in a cell's text — counts in group headers and folds excepted. */
function leaksIn(text: string): string[] {
  const cleaned = text
    .replace(/·\s*\d+/g, '')
    .replace(/Show all \d+/g, '')
    .replace(/\b\d+ people\b/g, '');
  const out: string[] = [];
  for (const m of cleaned.matchAll(/\d+/g)) out.push(m[0]);
  for (const m of cleaned.matchAll(/\b[a-z]+_[a-z0-9_]+\b/g)) out.push(m[0]);
  return [...new Set(out)].slice(0, 10);
}

function LabCell({ row, size, tier, onReport }: { row: LabRow; size: InspectorSize; tier: Tier; onReport: (key: string, report: InspectorPageReport | null, el: HTMLElement | null) => void }) {
  const t = TIER_TOKENS[tier];
  const width = size === 'docked' ? 'var(--inspector-w)' : size === 'wide' ? 'var(--inspector-wide-w)' : `${t.viewport.w - t.rail}px`;
  const height = `${t.viewport.h - t.topbar}px`;
  const ref = useRef<HTMLDivElement | null>(null);
  const key = `${row.id}|${size}`;
  const report = useCallback((r: InspectorPageReport) => onReport(key, r, ref.current), [key, onReport]);
  useEffect(() => {
    if (!row.page) onReport(key, null, ref.current);
  }, [row.page, key, onReport]);
  return (
    <div ref={ref} data-lab-cell={key} data-lab-size={size} style={{ width, height, flexShrink: 0, border: '1px dashed var(--border-subtle)', overflow: 'hidden' }}>
      {row.page ? (
        <InspectorPage page={row.page} size={size} onReport={report} />
      ) : (
        <div style={{ padding: '1rem', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>{row.fallback}</div>
      )}
    </div>
  );
}

export default function InspectorLab() {
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const [tier, setTier] = useState<Tier>(params.get('tier') === '1440' ? '1440' : '1080');
  const kindFilter = params.get('kind');
  const sizeFilter = params.get('size') as InspectorSize | null;
  const seedParam = Number(params.get('seed'));
  const seed = Number.isInteger(seedParam) && params.get('seed') ? seedParam : INSPECTOR_LAB_DEFAULT_SEED;
  const [world, setWorld] = useState<{ state: GameState; runtime: SimulationRuntime } | null>(null);
  const [warmed, setWarmed] = useState(0);
  const reports = useRef(new Map<string, { report: InspectorPageReport | null; el: HTMLElement | null; kind: string; subjectKey: string }>());

  // Build the world, then warm it in small steps so the placeholder keeps breathing.
  useEffect(() => {
    let cancelled = false;
    let built: { state: GameState; runtime: SimulationRuntime } | null = null;
    let done = 0;
    const step = () => {
      if (cancelled) return;
      if (!built) {
        built = buildLabWorld(seed);
      } else {
        for (let i = 0; i < WARM_TICKS_PER_STEP && done < INSPECTOR_LAB_WARM_TICKS; i++, done++) {
          built = { state: runTick(built.state, [], built.runtime), runtime: built.runtime };
        }
        setWarmed(done);
      }
      if (done >= INSPECTOR_LAB_WARM_TICKS) setWorld(built);
      else setTimeout(step, 0);
    };
    setTimeout(step, 0);
    return () => { cancelled = true; };
  }, [seed]);

  // The screen toggle: root size and the Inspector's frame tokens on :root, restored on leave.
  useEffect(() => {
    const root = document.documentElement;
    const t = TIER_TOKENS[tier];
    const before = { fontSize: root.style.fontSize, vars: Object.keys(t.vars).map(k => [k, root.style.getPropertyValue(k)] as const) };
    root.style.fontSize = `${t.rootPx}px`;
    for (const [k, v] of Object.entries(t.vars)) root.style.setProperty(k, v);
    return () => {
      root.style.fontSize = before.fontSize;
      for (const [k, v] of before.vars) {
        if (v) root.style.setProperty(k, v);
        else root.style.removeProperty(k);
      }
    };
  }, [tier]);

  const rows = useMemo(() => (world ? rowsFor(world.state, world.runtime) : []), [world]);
  const shownRows = rows.filter(r => !kindFilter || r.id === kindFilter || r.page?.layoutKind === kindFilter || r.page?.pageKind === kindFilter);
  const sizes = SIZES.filter(s => !sizeFilter || s === sizeFilter);

  const onReport = useCallback((key: string, report: InspectorPageReport | null, el: HTMLElement | null) => {
    const [rowId] = key.split('|');
    const row = rows.find(r => r.id === rowId);
    reports.current.set(key, { report, el, kind: row?.page?.pageKind ?? 'none', subjectKey: row?.page?.subjectKey ?? '' });
  }, [rows]);

  // `__DEBUG.getInspectorLab()` — what each cell drew, read live from the DOM.
  useEffect(() => {
    const bridge = (): DebugInspectorLabResult => {
      const cells: DebugInspectorLabCell[] = [];
      for (const [key, entry] of reports.current) {
        const [rowId, size] = key.split('|') as [string, InspectorSize];
        const el = entry.el;
        const scroll = el?.querySelector<HTMLElement>('[data-inspector-scroll]');
        const wideThings = el ? Array.from(el.querySelectorAll<HTMLElement>('[role="tablist"], [data-inspector-header], [data-inspector-scroll]')) : [];
        const overflowX = wideThings.some(n => n.scrollWidth > n.clientWidth + 1) || (scroll ? scroll.scrollWidth > scroll.clientWidth + 1 : false);
        cells.push({
          row: rowId,
          kind: entry.kind,
          size,
          subjectKey: entry.subjectKey,
          sectionsShown: entry.report?.sectionsShown ?? [],
          foldedGroups: entry.report?.foldedGroups ?? [],
          hiddenForWidth: entry.report?.hiddenForWidth ?? [],
          overflowX,
          leaks: el ? leaksIn(el.innerText ?? el.textContent ?? '') : [],
        });
      }
      return { tier, cells };
    };
    window.__DEBUG?._registerInspectorLabBridge?.(bridge);
    return () => window.__DEBUG?._registerInspectorLabBridge?.(null);
  }, [tier, rows]);

  if (!world) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-abyss)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="animate-breathe" style={{ width: 'var(--inspector-w)', height: '60vh', background: 'var(--bg-surface)', borderRadius: 'var(--radius-panel)' }}
          aria-label={`Building the lab's world (${warmed} of ${INSPECTOR_LAB_WARM_TICKS} ticks)`} />
      </div>
    );
  }

  return (
    <div data-inspector-lab="" style={{ height: '100vh', overflow: 'auto', background: 'var(--bg-abyss)', color: 'var(--text-primary)', padding: '1rem' }}>
      <header style={{ display: 'flex', gap: '1rem', alignItems: 'baseline', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)' }}>Inspector lab</h1>
        <span style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>
          Seed {seed}, medium, your First bonded, {INSPECTOR_LAB_WARM_TICKS} ticks. Pages come from the page-layout table — edit a row in detailPageTemplates.ts and it shows here on save.
        </span>
        <span role="group" aria-label="Screen" style={{ display: 'inline-flex', gap: '0.5rem' }}>
          {(['1080', '1440'] as const).map(t => (
            <label key={t} style={{ fontSize: 'var(--text-sm)', cursor: 'pointer' }}>
              <input type="radio" name="tier" checked={tier === t} onChange={() => setTier(t)} /> {t === '1080' ? '1920×1080' : '2560×1440'}
            </label>
          ))}
        </span>
      </header>
      {shownRows.map(row => (
        <section key={row.id} data-lab-row={row.id} style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: 'var(--text-base)', color: 'var(--text-secondary)', margin: '0 0 0.5rem' }}>
            {row.label}{row.page ? ` — ${row.page.header.name}` : ''}
            {row.page && <span style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)', marginLeft: '0.5rem' }}>{row.page.subjectKey}</span>}
          </h2>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            {sizes.map(size => <LabCell key={`${row.id}|${size}|${tier}`} row={row} size={size} tier={tier} onReport={onReport} />)}
          </div>
        </section>
      ))}
    </div>
  );
}

