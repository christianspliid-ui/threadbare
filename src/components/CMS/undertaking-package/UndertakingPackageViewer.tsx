/**
 * The Undertaking Package View — THR-1300 slice 4, `?view=cms#undertaking-packages`.
 *
 * The `EncounterPackageViewer` sibling (THR-1046): one page per undertaking template,
 * every block resolved, plus a side-by-side batch for the review a brief drives. The
 * blocks come from `buildUndertakingPackage`; the chrome reuses the encounter view's
 * primitives so the two surfaces read as one.
 *
 * **Designer surface, UI Laws held.** Ids are the subject (Law 13/14's designer
 * carve-out), but the board values are words, the kind row's other cells are links
 * (Law 21), a template with no kind row or no live proof gets an honest empty state
 * (Law 17), and the write-set block is literally the list of what a moment chip can
 * anchor to (Law 56). The moment card is unchanged — this page reads the template, it
 * does not restyle what the player sees.
 */
import { useMemo, useState } from 'react';
import { Tooltip } from '../../shared/Tooltip';
import { GameErrorBoundary } from '../../shared/GameErrorBoundary';
import { AuthoredProse, Block, Empty, Id, ReachChip, Verdict } from '../encounter-package/PackageBlocks';
import {
  buildUndertakingPackage,
  undertakingPackageIndex,
  undertakingTemplateById,
  CELL_LABEL,
  UNDERTAKING_PACKAGE_BATCH_MAX,
  type KindCell,
  type UndertakingPackage,
  type UndertakingPackageIndexRow,
} from './buildUndertakingPackage';

// ── Constants (NFP #1) ───────────────────────────────────────────────

const PICKER_WIDTH_PX = 300;
const BATCH_COLUMN_PX = 320;
const PICKER_VISIBLE_ROWS = 120;
const REVIEW_QUERY = 'view=game&seeded&size=medium';

export interface UndertakingPackageViewerProps {
  searchQuery?: string;
  /** `template=` from the hash — the single-package route. */
  templateId?: string;
  /** `batch=` from the hash, comma-joined ids. */
  batch?: string;
  onNavigate: (params: Readonly<Record<string, string | undefined>>) => void;
}

export function UndertakingPackageViewer({ searchQuery, templateId, batch, onNavigate }: UndertakingPackageViewerProps) {
  const index = useMemo(() => undertakingPackageIndex(), []);
  const batchIds = useMemo(
    () => (batch ?? '').split(',').map(id => id.trim()).filter(id => id !== '').slice(0, UNDERTAKING_PACKAGE_BATCH_MAX),
    [batch],
  );
  const filtered = useMemo(() => {
    const query = (searchQuery ?? '').trim().toLowerCase();
    if (query.length < 2) return index;
    return index.filter(row =>
      row.templateId.toLowerCase().includes(query)
      || row.displayName.toLowerCase().includes(query)
      || (row.kindId ?? '').toLowerCase().includes(query));
  }, [index, searchQuery]);
  const [staged, setStaged] = useState<readonly string[]>(batchIds);
  const toggleStaged = (id: string): void => {
    setStaged(prev => prev.includes(id) ? prev.filter(x => x !== id) : prev.length >= UNDERTAKING_PACKAGE_BATCH_MAX ? prev : [...prev, id]);
  };

  return (
    <div className="flex gap-0" style={{ height: '100%' }} data-surface="undertaking-packages">
      <div className="overflow-y-auto flex-none" style={{ width: PICKER_WIDTH_PX, borderRight: '1px solid var(--border-subtle)' }}>
        <Picker
          rows={filtered}
          total={index.length}
          selectedId={templateId}
          staged={staged}
          onOpen={id => onNavigate({ template: id })}
          onToggleStaged={toggleStaged}
          onCompare={() => onNavigate({ batch: staged.join(',') })}
          onClearCompare={() => { setStaged([]); onNavigate({}); }}
        />
      </div>
      <div className="flex-1 overflow-auto pl-3">
        {/* Fail-soft (NFP #4): one malformed template must not take the surface down. */}
        <GameErrorBoundary>
          {batchIds.length > 0 ? (
            <BatchView ids={batchIds} onOpen={id => onNavigate({ template: id })} />
          ) : templateId ? (
            <SinglePackage templateId={templateId} onOpenTemplate={id => onNavigate({ template: id })} />
          ) : (
            <Placeholder />
          )}
        </GameErrorBoundary>
      </div>
    </div>
  );
}

// ── Picker ───────────────────────────────────────────────────────────

function Picker({ rows, total, selectedId, staged, onOpen, onToggleStaged, onCompare, onClearCompare }: {
  rows: readonly UndertakingPackageIndexRow[];
  total: number;
  selectedId?: string;
  staged: readonly string[];
  onOpen: (templateId: string) => void;
  onToggleStaged: (templateId: string) => void;
  onCompare: () => void;
  onClearCompare: () => void;
}) {
  const shown = rows.slice(0, PICKER_VISIBLE_ROWS);
  return (
    <div className="flex flex-col">
      <div className="flex-none flex items-center gap-2 px-2 py-2 flex-wrap" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        {staged.length >= 2 ? (
          <button type="button" onClick={onCompare} className="focus-ring text-xs px-2 py-1 rounded"
            style={{ color: 'var(--accent-gold)', background: 'var(--accent-gold-glow)', border: '1px solid var(--accent-gold-dim)', cursor: 'pointer' }}>
            Compare {staged.length}
          </button>
        ) : (
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            tick {staged.length === 1 ? 'one more' : 'two or more'} to compare
          </span>
        )}
        {staged.length > 0 && (
          <button type="button" onClick={onClearCompare} className="focus-ring text-xs px-2 py-1 rounded"
            style={{ color: 'var(--text-muted)', border: '1px solid var(--border-subtle)', cursor: 'pointer' }}>
            Clear
          </button>
        )}
        <span className="text-xs ml-auto" style={{ color: 'var(--text-muted)' }}>
          {rows.length === total ? `${total}` : `${rows.length} / ${total}`}
        </span>
      </div>
      {shown.map(row => (
        <div key={row.templateId} className="flex items-center gap-1.5 px-2 py-1"
          style={{ background: row.templateId === selectedId ? 'var(--accent-gold-glow)' : 'transparent', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
          <input type="checkbox" checked={staged.includes(row.templateId)} onChange={() => onToggleStaged(row.templateId)}
            aria-label={`Stage ${row.displayName} for comparison`} style={{ flexShrink: 0, width: 14, height: 14, margin: 5, cursor: 'pointer' }} />
          <button type="button" onClick={() => onOpen(row.templateId)} className="focus-ring text-left flex-1 min-w-0"
            style={{ background: 'transparent', cursor: 'pointer', padding: '2px 0' }}>
            <span className="block truncate" style={{ fontSize: 'var(--text-xs)', color: row.templateId === selectedId ? 'var(--accent-gold)' : 'var(--text-primary)' }}>
              {row.displayName}
            </span>
            <span className="block truncate font-mono" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
              {row.kindId ? `${row.kindId} · ${row.cell === 'create' ? 'C' : row.cell === 'update' ? 'U' : 'D'}${row.tier ? ` · T${row.tier}` : ''}` : row.verb}
            </span>
          </button>
          {row.retrofitPending && (
            <Tooltip label="Retrofit pending" desc="Predates the Undertaking Contract; its failures do not fail CI yet. The ratchet only shrinks.">
              <span aria-label="retrofit pending" style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>◌</span>
            </Tooltip>
          )}
        </div>
      ))}
      {rows.length > shown.length && (
        <p className="text-xs px-2 py-2" style={{ color: 'var(--text-muted)' }}>
          {rows.length - shown.length} more — narrow the search to reach them.
        </p>
      )}
    </div>
  );
}

function Placeholder() {
  return (
    <div className="h-full flex items-center justify-center">
      <p className="text-xs text-center" style={{ color: 'var(--text-muted)', maxWidth: 420 }}>
        Pick an undertaking to see its whole package — the kind row and the cell it fills, the board
        values as words, cast, every band&apos;s creation effects, the mutation it leaves in the world, harm
        and motive gates, the prose, and the contract verdict.
        <br /><br />
        Tick two or more to compare them side by side.
      </p>
    </div>
  );
}

// ── One package ──────────────────────────────────────────────────────

function SinglePackage({ templateId, onOpenTemplate }: { templateId: string; onOpenTemplate: (id: string) => void }) {
  const pkg = useMemo(() => {
    const template = undertakingTemplateById(templateId);
    return template ? buildUndertakingPackage(template) : null;
  }, [templateId]);
  if (!pkg) {
    return (
      <div className="py-4 flex flex-col gap-1">
        <p className="text-sm" style={{ color: 'var(--negative)' }}>No undertaking with that id.</p>
        <Id>{templateId}</Id>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>The link may name a template since renamed or removed. Pick one from the list.</p>
      </div>
    );
  }
  return <PackageBody pkg={pkg} onOpenTemplate={onOpenTemplate} />;
}

function PackageBody({ pkg, onOpenTemplate, compact = false }: { pkg: UndertakingPackage; onOpenTemplate: (id: string) => void; compact?: boolean }) {
  const failing = pkg.verdict.failedBlocks.length;
  return (
    <div className="flex flex-col gap-4 py-3 pr-3" data-package-id={pkg.templateId}>
      <header className="flex flex-col gap-1">
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: compact ? 'var(--text-sm)' : 'var(--text-lg)', color: 'var(--text-primary)', margin: 0 }}>
          {pkg.displayName}
        </h2>
        <div className="flex items-center gap-2 flex-wrap">
          <Id>{pkg.templateId}</Id>
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{pkg.verb} · {pkg.calling}</span>
          {pkg.reaches.slice(0, 2).map(r => <ReachChip key={r} reach={r} />)}
          <Verdict pass={pkg.verdict.passed} label={pkg.verdict.passed ? 'contract-complete' : `${failing} block${failing === 1 ? '' : 's'} failing`} />
          {pkg.verdict.retrofitPending && (
            <Tooltip label="Retrofit pending" desc="Predates the Undertaking Contract; its failures do not fail CI yet.">
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>◌ ratchet</span>
            </Tooltip>
          )}
        </div>
        <a className="text-xs focus-ring" href={`/?${REVIEW_QUERY}&undertaking=${encodeURIComponent(pkg.templateId)}&forcemoments`} target="_blank" rel="noreferrer"
          style={{ color: 'var(--accent-gold-dim)' }}>
          open a live run on The First ↗
        </a>
      </header>

      {pkg.object ? (
        <Block title="The object" count={1}>
          <div className="flex flex-col gap-1 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <Id>{pkg.object.variant}</Id>
              <span style={{ color: 'var(--text-secondary) ' }}>×</span>
              <Id>{pkg.object.objectTypeId}</Id>
              <span style={{ color: 'var(--text-primary)' }}>{pkg.object.displayName}</span>
            </div>
            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
              {pkg.object.shape}; held via {pkg.object.heldVia}; aimed at {pkg.object.ownership}. The object is resolved at proposal — whichever one the mortal finds in the world — and its own name fills the prose.
            </p>
            {pkg.object.baseCellId && (
              <p style={{ margin: 0, color: 'var(--text-tertiary)' }}>
                an override of{' '}
                <button type="button" className="focus-ring" onClick={() => onOpenTemplate(pkg.object!.baseCellId!)}
                  style={{ color: 'var(--accent-gold-dim)', background: 'none', border: 'none', padding: 0, cursor: 'pointer', font: 'inherit' }}>
                  {pkg.object.baseCellId}
                </button>
              </p>
            )}
            {pkg.object.siblings.length > 0 && (
              <div className="flex items-center gap-1 flex-wrap">
                <span style={{ color: 'var(--text-tertiary)' }}>the type&apos;s other cells:</span>
                {pkg.object.siblings.map(id => (
                  <button key={id} type="button" className="focus-ring" onClick={() => onOpenTemplate(id)}
                    style={{ color: 'var(--accent-gold-dim)', background: 'none', border: 'none', padding: 0, cursor: 'pointer', font: 'inherit' }}>
                    {id}
                  </button>
                ))}
              </div>
            )}
          </div>
        </Block>
      ) : (
        <Block title="Kind row" count={pkg.kind ? 1 : 0} tone={pkg.kind ? 'neutral' : 'warn'}>
          {pkg.kind ? <KindRowBlock pkg={pkg} onOpenTemplate={onOpenTemplate} /> : (
            <p className="text-xs" style={{ color: 'var(--negative)' }}>
              In no kind row — {pkg.board.executionMode === 'multi_tick_project' ? 'a multi-tick project outside the registry is unreachable by the counter-play rule.' : 'an instant carries only its mutation hint.'}
            </p>
          )}
        </Block>
      )}

      <Block title="The board">
        <dl className="grid gap-x-4 gap-y-1 text-xs" style={{ gridTemplateColumns: 'max-content 1fr', margin: 0 }}>
          <dt style={{ color: 'var(--text-tertiary)' }}>difficulty</dt><dd style={{ margin: 0, color: 'var(--text-primary)' }}>{pkg.board.difficulty}</dd>
          <dt style={{ color: 'var(--text-tertiary)' }}>payoff</dt><dd style={{ margin: 0, color: 'var(--text-primary)' }}>{pkg.board.payoff}</dd>
          <dt style={{ color: 'var(--text-tertiary)' }}>duration</dt><dd style={{ margin: 0, color: 'var(--text-primary)' }}>{pkg.board.duration}</dd>
          <dt style={{ color: 'var(--text-tertiary)' }}>mode</dt><dd style={{ margin: 0 }}><Id>{pkg.board.executionMode}</Id></dd>
          <dt style={{ color: 'var(--text-tertiary)' }}>motivations</dt>
          <dd style={{ margin: 0 }} className="flex gap-1 flex-wrap">
            {pkg.board.motivations.length === 0 ? <Empty what="motivations" /> : pkg.board.motivations.map(m => <Id key={m}>{m}</Id>)}
          </dd>
        </dl>
      </Block>

      <Block title="Cast" count={pkg.cast.length}>
        {pkg.cast.length === 0 ? <Empty what="cast" /> : pkg.cast.map(slot => (
          <div key={slot.key} className="flex items-center gap-2 flex-wrap text-xs">
            <Id>${slot.key}</Id>
            <span style={{ color: 'var(--text-secondary)' }}>{slot.kind} · {slot.persistence} · minted as {slot.mintRole}</span>
            {slot.identityRequirement && <span style={{ color: 'var(--text-muted)' }}>· identity required</span>}
          </div>
        ))}
      </Block>

      <Block title="What it writes" count={pkg.writeSet.empty ? 0 : undefined} tone={pkg.writeSet.empty ? 'warn' : 'neutral'}>
        {pkg.writeSet.empty ? (
          <p className="text-xs" style={{ color: 'var(--negative)' }}>Nothing — the work whose only product is a sentence. The live proof reports this vacuous.</p>
        ) : (
          <ul className="text-xs flex flex-col gap-1" style={{ margin: 0, paddingLeft: '1rem', color: 'var(--text-primary)' }}>
            {pkg.writeSet.object && <li>on completion: the <Id>{pkg.writeSet.object.objectTypeId}</Id> type&apos;s <Id>{pkg.writeSet.object.verb}</Id> semantic, on the resolved object</li>}
            {pkg.mutation && !pkg.writeSet.object && <li>on completion: <Id>{pkg.mutation.type}</Id> — {pkg.mutation.detail}</li>}
            {pkg.creation.filter(b => b.effects.length > 0).map(b => (
              <li key={b.band}>{b.label}: {b.effects.map((e, i) => <Id key={i}>{describeEffect(e)}</Id>)}</li>
            ))}
            {pkg.harm && <li>a {pkg.harm.magnitude} harm (<Id>{pkg.harm.harmClass}</Id>) for the victim&apos;s grievance lane</li>}
            {pkg.writeSet.kind && <li>a christening{pkg.writeSet.kind.ownable ? ' and a freehold' : ''} in the <Id>{pkg.writeSet.kind.kindId}</Id> row</li>}
            {pkg.writeSet.persistentCast.length > 0 && <li>must-persist cast: {pkg.writeSet.persistentCast.map(k => <Id key={k}>${k}</Id>)}</li>}
            {pkg.catalysts.length > 0 && <li>may seed: {pkg.catalysts.map(c => <Id key={c}>{c}</Id>)}</li>}
          </ul>
        )}
      </Block>

      {(pkg.motiveGate.length > 0 || pkg.harm) && (
        <Block title="Counter-play" count={pkg.motiveGate.length}>
          <p className="text-xs" style={{ color: 'var(--text-secondary)', margin: 0 }}>
            offered only under {pkg.motiveGate.length === 0 ? <span style={{ color: 'var(--negative)' }}>no motive gate</span> : pkg.motiveGate.map(m => <Id key={m}>{m}</Id>)}
          </p>
        </Block>
      )}

      <Block title="Prose">
        <p className="text-xs" style={{ color: 'var(--text-tertiary)', margin: 0 }}>while the work runs</p>
        {pkg.prose.activity.length === 0 ? <Empty what="activity prose" /> : pkg.prose.activity.map((line, i) => <AuthoredProse key={i} text={line} size={compact ? 'xs' : 'sm'} />)}
        <p className="text-xs" style={{ color: 'var(--text-tertiary)', margin: 0 }}>when it stands</p>
        {pkg.prose.completion.length === 0 ? <Empty what="completion prose" /> : pkg.prose.completion.map((line, i) => <AuthoredProse key={i} text={line} size={compact ? 'xs' : 'sm'} />)}
      </Block>

      <Block title="Undertaking contract" count={failing} tone={failing > 0 ? 'warn' : 'neutral'}>
        {pkg.verdict.violations.length === 0 ? (
          <p className="text-xs" style={{ color: 'var(--positive)', margin: 0 }}>all ten blocks pass</p>
        ) : pkg.verdict.violations.map((v, i) => (
          <p key={i} className="text-xs" style={{ margin: 0, color: 'var(--text-primary)' }}><Id>{v.block}</Id> {v.message}</p>
        ))}
        {pkg.verdict.warnings.map((w, i) => (
          <p key={`w${i}`} className="text-xs" style={{ margin: 0, color: 'var(--text-muted)' }}>warn · {w}</p>
        ))}
      </Block>
    </div>
  );
}

function describeEffect(e: { kind: string } & Record<string, unknown>): string {
  switch (e.kind) {
    case 'spawn_npc': return `spawn_npc ${String(e.role)}`;
    case 'spawn_sublocation': return `spawn_sublocation ${String(e.sublocationTypeId)}`;
    default: return e.kind;
  }
}

function KindRowBlock({ pkg, onOpenTemplate }: { pkg: UndertakingPackage; onOpenTemplate: (id: string) => void }) {
  const kind = pkg.kind!;
  const cells: KindCell[] = ['create', 'update', 'destroy'];
  return (
    <div className="flex flex-col gap-2 text-xs">
      <div className="flex items-center gap-2 flex-wrap">
        <Id>{kind.row.kindId}</Id>
        <span style={{ color: 'var(--text-primary)' }}>{kind.row.displayName}</span>
        <span style={{ color: 'var(--text-secondary)' }}>· tier {kind.row.tier === 1 ? 'one' : kind.row.tier === 2 ? 'two' : 'three'}</span>
        <span style={{ color: 'var(--text-secondary)' }}>· {kind.row.ownable ? 'ownable' : 'not ownable'}</span>
        <span style={{ color: 'var(--accent-gold)' }}>fills {CELL_LABEL[kind.cell]}</span>
      </div>
      <p style={{ margin: 0, color: 'var(--text-muted)' }}>object: <Id>{kind.row.objectShape}</Id></p>
      <div className="grid gap-x-3 gap-y-1" style={{ gridTemplateColumns: 'max-content 1fr' }}>
        {cells.map(cell => (
          <CellRow key={cell} cell={cell} ids={kind.siblings[cell]} mine={kind.cell === cell} onOpenTemplate={onOpenTemplate} />
        ))}
      </div>
    </div>
  );
}

function CellRow({ cell, ids, mine, onOpenTemplate }: { cell: KindCell; ids: readonly string[]; mine: boolean; onOpenTemplate: (id: string) => void }) {
  return (
    <>
      <span style={{ color: mine ? 'var(--accent-gold)' : 'var(--text-tertiary)' }}>{CELL_LABEL[cell]}</span>
      <span className="flex gap-1 flex-wrap">
        {mine && <span style={{ color: 'var(--accent-gold)' }}>this one</span>}
        {ids.map(id => (
          <button key={id} type="button" onClick={() => onOpenTemplate(id)} className="focus-ring"
            style={{ background: 'transparent', cursor: 'pointer', padding: 0, color: 'var(--text-secondary)', textDecoration: 'underline dotted' }}>
            <Id>{id}</Id>
          </button>
        ))}
        {!mine && ids.length === 0 && <span style={{ color: cell === 'destroy' ? 'var(--negative)' : 'var(--text-muted)' }}>{cell === 'destroy' ? 'nothing undoes it' : 'empty cell'}</span>}
      </span>
    </>
  );
}

// ── Batch ────────────────────────────────────────────────────────────

function BatchView({ ids, onOpen }: { ids: readonly string[]; onOpen: (id: string) => void }) {
  const packages = useMemo(() => ids.map(id => {
    const template = undertakingTemplateById(id);
    return { id, pkg: template ? buildUndertakingPackage(template) : null };
  }), [ids]);
  return (
    <div className="flex gap-3 py-3 overflow-x-auto">
      {packages.map(({ id, pkg }) => (
        <div key={id} className="flex-none" style={{ width: BATCH_COLUMN_PX, borderRight: '1px solid var(--border-subtle)' }}>
          {pkg ? <PackageBody pkg={pkg} onOpenTemplate={onOpen} compact /> : (
            <p className="text-xs" style={{ color: 'var(--negative)' }}>No undertaking <Id>{id}</Id></p>
          )}
        </div>
      ))}
    </div>
  );
}
