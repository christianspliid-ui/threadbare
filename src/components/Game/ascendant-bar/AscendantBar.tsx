/**
 * AscendantBar — the god rail's body (THR-184; rebuilt from `GOD_RAIL_SECTIONS` by
 * THR-1894, frame plan § F6).
 *
 * The rail is drawn from one list, top to bottom (THR-1828 call 2): the pinned
 * sections (identity; essence with Attention under it), then **the hand**, headed
 * "Your cards", filling the rail's free height, then the folded rows at the foot —
 * Reaches, Mandate, Covenants, Signatures, Hooks — one line each, opening in place
 * above the row. Which sections exist and where they sit is `GOD_RAIL_SECTIONS`; how
 * each draws is `GOD_RAIL_COMPONENTS`; what each shows is the `godRail` view model.
 * Nothing here is a hand-placed section (Law 58).
 *
 * The open set of folded rows is a remembered preference (Law 51,
 * `GOD_RAIL_OPEN_ROWS_KEY`); every row starts closed.
 */
import { useCallback, useContext, useMemo, useState, type CSSProperties, type ReactElement } from 'react';
import type { GameState } from '../../../types/gameState';
import type { AscendantArchetype } from '../../../types/influence';
import type { AscendantIdentity } from '../../../types/remembrance';
import type { CodexRunStateFilter } from '../../Codex/codexRunState';
import { countHooks } from './HooksBlock';
import styles from './styles.module.css';
import { NEWLY_REVEALED_STYLE, type OpeningRevealShow } from '../GameView/openingReveal';
import type { OpeningRevealSurfaceId } from '../../../data/opening-reveal-table';
import { GOD_RAIL_OPEN_ROWS_KEY, GOD_RAIL_SECTIONS, type GodRailSectionDef, type GodRailSectionId } from '../../../data/frame-registry';
import { GOD_RAIL_ARIA } from '../../../data/frame-content';
import { godRailSelector, godRailStamp, type GodRailArgs, type GodRailVM } from '../../../engine/views/godRail';
import { readView } from '../../../engine/views/readView';
import { ViewSourceContext } from '../../../contexts/ViewSourceContext';
import { GOD_RAIL_COMPONENTS, type GodRailBag } from '../frame/godRailComponents';
import type { HandRest } from '../frame/HandSection';
import { Tooltip } from '../../shared/Tooltip';
import { Icon } from '../../shared/Icon';

interface AscendantBarProps {
  gameState: GameState;
  archetype: AscendantArchetype;
  ascendantIdentity: AscendantIdentity | null;
  avatarName: string;
  worldVersion: number;
  onOpenSheet: () => void;
  onOpenMandate: () => void;
  onMove?: () => void;
  onInvestiture?: () => void;
  /** Queue a voluntary release of a sustained control (THR-613 §3.4). */
  onReleaseControl?: (effectId: string) => void;
  /** Open the Codex path catalog, optionally pre-filtered to a run state (THR-613 Slice 3b-tail). */
  onOpenCodex?: (filter?: CodexRunStateFilter) => void;
  /** Open an attachment's sheet from a Hooks chip (THR-1330). */
  onOpenAttachment?: (templateNodeId: string) => void;
  /** A quiet first screen (THR-1648): the mandate arrives with the bond. Omitted means shown. */
  showMandate?: boolean;
  /** THR-1792 — centre the map on the god's seat (the Seat line's link). */
  onCenterOnSeat?: (locationId: string) => void;
  /** THR-1837 — the staged opening reveal. Omitted means everything shows. */
  opening?: { show: OpeningRevealShow; newly: ReadonlySet<OpeningRevealSurfaceId> };
  /** THR-1894 — why the hand rests (a moment is open), or null while it answers. */
  handRest?: HandRest;
}

function readOpenRows(): GodRailSectionId[] {
  try {
    if (typeof localStorage === 'undefined') return [];
    const raw = localStorage.getItem(GOD_RAIL_OPEN_ROWS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x): x is GodRailSectionId => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function writeOpenRows(rows: readonly GodRailSectionId[]): void {
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(GOD_RAIL_OPEN_ROWS_KEY, JSON.stringify(rows));
  } catch {
    /* private browsing: the choice holds for the session */
  }
}

/** The view model through the session's cache; outside a provider (tests, the style guide) built fresh. */
function useGodRailView(gameState: GameState, args: GodRailArgs): GodRailVM {
  const source = useContext(ViewSourceContext);
  return source
    ? readView(source.runtime, source.state, godRailSelector, args, source.tiles)
    : readView(null, gameState, godRailSelector, args);
}

function FoldedRow({
  def,
  summary,
  open,
  onToggle,
  children,
}: {
  def: GodRailSectionDef;
  summary: string;
  open: boolean;
  onToggle: () => void;
  children: ReactElement | null;
}) {
  const label = <span style={{ fontWeight: 700, color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>{def.label}</span>;
  return (
    <div data-god-rail-section={def.id} data-place="folded" data-open={open ? 'true' : 'false'} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {open && children && <div data-testid={`god-rail-row-body-${def.id}`}>{children}</div>}
      <button
        type="button"
        className={`focus-ring ${styles.foldedRow}`}
        aria-expanded={open}
        onClick={onToggle}
        data-testid={`god-rail-row-${def.id}`}
      >
        {def.tooltipId ? <Tooltip id={def.tooltipId} focusable={false}>{label}</Tooltip> : label}
        {summary && (
          <span data-testid={`god-rail-row-summary-${def.id}`} style={{ color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
            {summary}
          </span>
        )}
        <Icon name="disclosure" size="floor" decorative style={{ marginLeft: 'auto', flexShrink: 0, transform: open ? 'rotate(180deg)' : 'rotate(90deg)' }} />
      </button>
    </div>
  );
}

export function AscendantBar({
  gameState,
  archetype,
  ascendantIdentity: _ascendantIdentity,
  avatarName,
  worldVersion: _worldVersion,
  onOpenSheet,
  onOpenMandate,
  onMove,
  onInvestiture,
  onReleaseControl,
  onOpenCodex,
  onOpenAttachment,
  showMandate = true,
  onCenterOnSeat,
  opening,
  handRest = null,
}: AscendantBarProps) {
  const [openRows, setOpenRows] = useState<GodRailSectionId[]>(() => readOpenRows());
  const toggleRow = useCallback((id: GodRailSectionId) => {
    setOpenRows((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      writeOpenRows(next);
      return next;
    });
  }, []);

  // THR-1307: the Hooks count is the block's own walk, so the row and the block agree.
  const hookCount = countHooks(gameState);
  const args: GodRailArgs = useMemo(() => ({
    primarySphere: archetype.sphereAlignment.primary,
    secondarySphere: archetype.sphereAlignment.secondary,
    archetypeTitle: archetype.title,
    avatarName,
    hookCount,
    stamp: godRailStamp(gameState),
  }), [archetype, avatarName, hookCount, gameState]);
  const vm = useGodRailView(gameState, args);

  const shown = (id: string) => opening?.show[id as OpeningRevealSurfaceId] ?? true;
  const newly = (id: string) => opening?.newly.has(id as OpeningRevealSurfaceId) ?? false;

  // Bodies are plain functions of the bag (no hooks), so a closed row can build its body cheaply.
  const bag: GodRailBag = {
    vm, gameState, shown, newly, handRest,
    onOpenSheet, onOpenMandate, onMove, onInvestiture, onReleaseControl, onOpenCodex, onOpenAttachment, onCenterOnSeat,
  };

  /** Whether a section renders now: its reveal and its gate, and — for a row the list marks `rendersWhenEmpty: false` — whether it holds anything (THR-1814 rule 4). */
  const holdsSomething = (id: GodRailSectionId): boolean =>
    id === 'reaches' || id === 'mandate' || id === 'covenants' || id === 'signatures' || id === 'hooks' ? vm.rows[id].renders : true;
  const gated = (def: GodRailSectionDef): boolean => {
    switch (def.id) {
      case 'identity': return shown('identity');
      case 'essence': return shown('essence');
      case 'hand': return shown('hand');
      case 'reaches': return shown('reaches');
      case 'mandate': return showMandate && shown('mandate');
      // Signatures waits for Reaches, as before.
      case 'signatures': return shown('reaches');
      case 'covenants': return true;
      case 'hooks': return true;
    }
  };
  const renders = (def: GodRailSectionDef): boolean => gated(def) && (def.rendersWhenEmpty || holdsSomething(def.id));

  // The gold reveal ring on a section whose own surface just arrived (Attention and
  // Investiture ring their own rows inside the section).
  const ringed = (def: GodRailSectionDef) =>
    def.revealSurfaces.some((s) => s !== 'attention' && s !== 'investiture' && newly(s));
  const ring = (def: GodRailSectionDef, style?: CSSProperties) =>
    ringed(def)
      ? { 'data-newly-revealed': 'true', style: { ...style, ...NEWLY_REVEALED_STYLE } }
      : { style };

  const sections = [...GOD_RAIL_SECTIONS].sort((a, b) => a.order - b.order);
  const visible = sections.filter(renders);
  const pinned = visible.filter((d) => d.place === 'pinned');
  const fill = visible.filter((d) => d.place === 'fill');
  const folded = visible.filter((d) => d.place === 'folded');
  const summaryOf = (id: GodRailSectionId): string =>
    id === 'reaches' || id === 'mandate' || id === 'covenants' || id === 'signatures' || id === 'hooks' ? vm.rows[id].summary : '';

  return (
    <aside
      className={styles.bar}
      aria-label={GOD_RAIL_ARIA}
      data-testid="god-rail"
      data-sections-rendered={visible.map((d) => d.id).join(',')}
      data-rows-open={openRows.filter((id) => folded.some((d) => d.id === id)).join(',')}
    >
      {pinned.map((def) => (
        <div key={def.id} data-god-rail-section={def.id} data-place="pinned" {...ring(def)}>
          {GOD_RAIL_COMPONENTS[def.id](bag)}
        </div>
      ))}
      {fill.map((def) => (
        <div key={def.id} data-god-rail-section={def.id} data-place="fill" {...ring(def, { flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' })}>
          {GOD_RAIL_COMPONENTS[def.id](bag)}
        </div>
      ))}
      {folded.length > 0 && (
        <div data-testid="god-rail-folded-rows" className={styles.foldedRows}>
          {folded.map((def) => (
            <div key={def.id} {...ring(def)}>
              <FoldedRow def={def} summary={summaryOf(def.id)} open={openRows.includes(def.id)} onToggle={() => toggleRow(def.id)}>
                {GOD_RAIL_COMPONENTS[def.id](bag)}
              </FoldedRow>
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}
