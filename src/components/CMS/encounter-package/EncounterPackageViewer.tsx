/**
 * The Package View — THR-1046, Encounter Factory implementation item 4.
 *
 * Plan: `Docs/plans/2026-08-08-encounter-factory-workflow.md` §3 item 4.
 * Christian's requirement, verbatim: *"a way of easily being able to see the
 * entire encounter content package."*
 *
 * **Two modes, one surface.** A single package shows every composed block of one
 * encounter, resolved. A **batch** shows up to six side by side — ruling 1's
 * review surface, whose job is making *variance visible*: shapes, reaches, hands
 * and endings compared in one glance, because a batch of six that all turn out to
 * be the same encounter is the failure the old factory shipped.
 *
 * **Why this beats a `?spawn=` link** (the plan says so, and it is the reason the
 * surface exists): a playthrough rolls one band. A package shows the whole ladder
 * at once — including the endings no single run will ever reach, which are
 * precisely the ones that go unwritten.
 *
 * **Designer surface, not a player surface.** Ids and raw difficulties are the
 * subject (Law 13/14's trace-and-designer carve-out, granted by the ticket). The
 * rest of the UI Laws hold unchanged, and Law 1 holds *especially*: this is where
 * a concept missing its image, tooltip or link becomes visible.
 */

import { useMemo, useState } from 'react';
import { Tooltip } from '../../shared/Tooltip';
import { GameErrorBoundary } from '../../shared/GameErrorBoundary';
import {
  buildEncounterPackage,
  encounterPackageIndex,
  packageTemplateById,
  PACKAGE_BATCH_MAX,
  type EncounterPackage,
  type PackageIndexRow,
} from './buildEncounterPackage';
import {
  AftermathBlock,
  AuthoredProse,
  Block,
  CastBlock,
  Empty,
  Id,
  ImagesBlock,
  OpeningsBlock,
  PackageHeader,
  ReachChip,
  RewardsBlock,
  SeedsBlock,
  StepsBlock,
  SystemsBlock,
  Verdict,
  VerdictBlock,
} from './PackageBlocks';

// ── Constants (NFP #1) ───────────────────────────────────────────────

/** Picker column width. Wide enough for a full `encounter.*` id without truncation. */
const PICKER_WIDTH_PX = 300;
/** One package's column in the batch view. */
const BATCH_COLUMN_PX = 320;
/** Rows the picker renders before search is required — Law 36's progressive floor. */
const PICKER_VISIBLE_ROWS = 120;

export interface EncounterPackageViewerProps {
  /** Global CMS search box, reused as the picker's filter. */
  searchQuery?: string;
  /** `template=` from the hash — the single-package route. */
  templateId?: string;
  /** `batch=` from the hash, comma-joined ids — the comparative route. */
  batch?: string;
  /** Rewrite the hash. The surface is a set of shareable URLs, so every navigation writes one. */
  onNavigate: (params: Readonly<Record<string, string | undefined>>) => void;
}

export function EncounterPackageViewer({
  searchQuery,
  templateId,
  batch,
  onNavigate,
}: EncounterPackageViewerProps) {
  const index = useMemo(() => encounterPackageIndex(), []);

  const batchIds = useMemo(
    () =>
      (batch ?? '')
        .split(',')
        .map((id) => id.trim())
        .filter((id) => id !== '')
        .slice(0, PACKAGE_BATCH_MAX),
    [batch],
  );

  const filtered = useMemo(() => {
    const query = (searchQuery ?? '').trim().toLowerCase();
    if (query.length < 2) return index;
    return index.filter(
      (row) =>
        row.templateId.toLowerCase().includes(query) ||
        row.name.toLowerCase().includes(query),
    );
  }, [index, searchQuery]);

  /** Ids staged for comparison. Staging is local; the batch URL is the commit. */
  const [staged, setStaged] = useState<readonly string[]>(batchIds);

  const toggleStaged = (id: string): void => {
    setStaged((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length >= PACKAGE_BATCH_MAX
          ? prev
          : [...prev, id],
    );
  };

  return (
    <div className="flex gap-0" style={{ height: '100%' }}>
      <div
        className="overflow-y-auto flex-none"
        style={{ width: PICKER_WIDTH_PX, borderRight: '1px solid var(--border-subtle)' }}
      >
        <Picker
          rows={filtered}
          total={index.length}
          selectedId={templateId}
          staged={staged}
          onOpen={(id) => onNavigate({ template: id })}
          onToggleStaged={toggleStaged}
          onCompare={() => onNavigate({ batch: staged.join(',') })}
          onClearCompare={() => {
            setStaged([]);
            onNavigate({});
          }}
        />
      </div>

      <div className="flex-1 overflow-auto pl-3">
        {/* Fail-soft (NFP #4): one malformed template must not take the surface
            down — a reviewer needs to see the other five. */}
        <GameErrorBoundary>
          {batchIds.length > 0 ? (
            <BatchView ids={batchIds} onOpen={(id) => onNavigate({ template: id })} />
          ) : templateId ? (
            <SinglePackage templateId={templateId} onOpenTemplate={(id) => onNavigate({ template: id })} />
          ) : (
            <Placeholder />
          )}
        </GameErrorBoundary>
      </div>
    </div>
  );
}

// ── Picker ───────────────────────────────────────────────────────────

function Picker({
  rows,
  total,
  selectedId,
  staged,
  onOpen,
  onToggleStaged,
  onCompare,
  onClearCompare,
}: {
  rows: readonly PackageIndexRow[];
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
      <div
        className="flex-none flex items-center gap-2 px-2 py-2 flex-wrap"
        style={{ borderBottom: '1px solid var(--border-subtle)' }}
      >
        {/* Law 25: the compare button only renders as a control when it can act. */}
        {staged.length >= 2 ? (
          <button
            type="button"
            onClick={onCompare}
            className="focus-ring text-xs px-2 py-1 rounded"
            style={{
              color: 'var(--accent-gold)',
              background: 'var(--accent-gold-glow)',
              border: '1px solid var(--accent-gold-dim)',
              cursor: 'pointer',
            }}
          >
            Compare {staged.length}
          </button>
        ) : (
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            tick {staged.length === 1 ? 'one more' : 'two or more'} to compare
          </span>
        )}
        {staged.length > 0 && (
          <button
            type="button"
            onClick={onClearCompare}
            className="focus-ring text-xs px-2 py-1 rounded"
            style={{ color: 'var(--text-muted)', border: '1px solid var(--border-subtle)', cursor: 'pointer' }}
          >
            Clear
          </button>
        )}
        <span className="text-xs ml-auto" style={{ color: 'var(--text-muted)' }}>
          {rows.length === total ? `${total}` : `${rows.length} / ${total}`}
        </span>
      </div>

      {shown.map((row) => (
        <div
          key={row.templateId}
          className="flex items-center gap-1.5 px-2 py-1"
          style={{
            background: row.templateId === selectedId ? 'var(--accent-gold-glow)' : 'transparent',
            borderBottom: '1px solid rgba(255,255,255,0.03)',
          }}
        >
          <input
            type="checkbox"
            checked={staged.includes(row.templateId)}
            onChange={() => onToggleStaged(row.templateId)}
            aria-label={`Stage ${row.name} for comparison`}
            // Law 46: the visual box stays small, the hit area does not.
            style={{ flexShrink: 0, width: 14, height: 14, margin: 5, cursor: 'pointer' }}
          />
          <button
            type="button"
            onClick={() => onOpen(row.templateId)}
            className="focus-ring text-left flex-1 min-w-0"
            style={{ background: 'transparent', cursor: 'pointer', padding: '2px 0' }}
          >
            <span
              className="block truncate"
              style={{
                fontSize: 'var(--text-xs)',
                color: row.templateId === selectedId ? 'var(--accent-gold)' : 'var(--text-primary)',
              }}
            >
              {row.name}
            </span>
            <span
              className="block truncate font-mono"
              style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}
            >
              {row.templateId}
            </span>
          </button>
          {row.hasHand && (
            <Tooltip label="Has a hand" desc="This template authors nudge cards — the factory format.">
              <span aria-label="has a nudge hand" style={{ color: 'var(--accent-gold)', fontSize: 'var(--text-xs)' }}>
                ◈
              </span>
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
        Pick an encounter to see its whole content package — every step, the full
        afterimage ladder, each hand as the player sees it, the cast, the endings a
        single playthrough never rolls, and the composition verdict.
        <br />
        <br />
        Tick two or more to compare them side by side.
      </p>
    </div>
  );
}

// ── One package ──────────────────────────────────────────────────────

function SinglePackage({
  templateId,
  onOpenTemplate,
}: {
  templateId: string;
  onOpenTemplate: (templateId: string) => void;
}) {
  const pkg = useMemo(() => {
    const template = packageTemplateById(templateId);
    return template ? buildEncounterPackage(template) : null;
  }, [templateId]);

  if (!pkg) {
    return (
      <div className="py-4 flex flex-col gap-1">
        <p className="text-sm" style={{ color: 'var(--negative)' }}>
          No template with that id.
        </p>
        <Id>{templateId}</Id>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          The link may name a template that has since been renamed or removed. Pick
          one from the list.
        </p>
      </div>
    );
  }

  return (
    <article className="flex flex-col gap-3 py-2 pr-2">
      <PackageHeader pkg={pkg} />
      {pkg.description && (
        <p className="text-sm" style={{ margin: 0, color: 'var(--text-secondary)' }}>
          {pkg.description}
        </p>
      )}
      <VerdictBlock verdict={pkg.verdict} />
      <SystemsBlock pkg={pkg} />
      <OpeningsBlock pkg={pkg} />
      <StepsBlock steps={pkg.steps} />
      <CastBlock cast={pkg.cast} places={pkg.places} />
      <RewardsBlock rewards={pkg.rewards} persistentEffects={pkg.persistentEffects} />
      <AftermathBlock variants={pkg.aftermath} />
      <SeedsBlock seeds={pkg.seeds} onOpenTemplate={onOpenTemplate} />
      <ImagesBlock images={pkg.images} />
    </article>
  );
}

// ── Batch ────────────────────────────────────────────────────────────

/**
 * Six packages side by side (ruling 1).
 *
 * Each column is deliberately a *summary*, not a whole package: the comparison a
 * reviewer makes across six is structural — how many steps, which reaches, how
 * big the hand, how many endings, which systems — and six full packages in one
 * viewport would be six unreadable columns. The column header opens the full
 * package for the one that looks wrong.
 */
function BatchView({
  ids,
  onOpen,
}: {
  ids: readonly string[];
  onOpen: (templateId: string) => void;
}) {
  const packages = useMemo(
    () =>
      ids.map((id) => {
        const template = packageTemplateById(id);
        return { id, pkg: template ? buildEncounterPackage(template) : null };
      }),
    [ids],
  );

  return (
    <div className="flex flex-col gap-2 py-2">
      <div className="flex items-baseline gap-2">
        <h3
          className="text-sm font-semibold"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--accent-gold)' }}
        >
          Batch of {packages.length}
        </h3>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          shapes, reaches and endings side by side
        </span>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {packages.map(({ id, pkg }) => (
          <div
            key={id}
            className="flex flex-col gap-2 rounded p-2"
            style={{
              width: BATCH_COLUMN_PX,
              flexShrink: 0,
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            {pkg ? <BatchColumn pkg={pkg} onOpen={onOpen} /> : (
              <>
                <p className="text-xs" style={{ color: 'var(--negative)' }}>
                  not a live template
                </p>
                <Id>{id}</Id>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function BatchColumn({
  pkg,
  onOpen,
}: {
  pkg: EncounterPackage;
  onOpen: (templateId: string) => void;
}) {
  const bandsAuthored = pkg.aftermath.reduce((sum, v) => sum + v.authoredBandCount, 0);
  const afterimagesAuthored = pkg.steps.reduce(
    (sum, step) => sum + step.afterimages.filter((a) => a.authored).length,
    0,
  );
  const afterimageSlots = pkg.steps.reduce((sum, step) => sum + step.afterimages.length, 0);

  return (
    <>
      <button
        type="button"
        onClick={() => onOpen(pkg.templateId)}
        className="focus-ring text-left"
        style={{ background: 'transparent', cursor: 'pointer' }}
      >
        <span
          className="block"
          style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-sm)', color: 'var(--accent-gold)' }}
        >
          {pkg.spellName ?? pkg.name}
        </span>
        <span className="block font-mono truncate" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
          {pkg.templateId}
        </span>
      </button>

      <div className="flex items-center gap-2 flex-wrap">
        <ReachChip reach={pkg.reach} />
        <Verdict pass={pkg.verdict.pass} label={pkg.verdict.pass ? 'complete' : `${pkg.verdict.blocks.filter((b) => !b.pass).length} failing`} />
      </div>

      {/* The shape — the single most comparable thing across six. */}
      <div className="flex flex-col gap-1">
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>shape</span>
        {pkg.steps.map((step) => (
          <span key={step.index} style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
            {step.index}. {step.reach} · {step.difficultyWord} · {step.cards.length} cards
            {step.purposeLine ? ` · ${step.purposeLine}` : ''}
          </span>
        ))}
        {pkg.steps.length === 0 && <Empty what="steps" />}
      </div>

      <dl className="flex flex-col gap-0.5" style={{ margin: 0 }}>
        <BatchStat label="settings" value={pkg.settings.join(', ') || '—'} />
        <BatchStat label="cast" value={pkg.cast.map((c) => c.supportRole).join(', ') || '—'} />
        <BatchStat label="systems" value={pkg.systems.join(', ') || '—'} />
        <BatchStat label="endings" value={`${bandsAuthored} banded`} />
        <BatchStat label="afterimages" value={`${afterimagesAuthored} of ${afterimageSlots}`} />
        <BatchStat label="seeds" value={pkg.seeds.map((s) => s.seedLabel).join(', ') || '—'} />
      </dl>

      {/* Tone: the opening is what a reviewer compares voices on across six. */}
      {pkg.openings[0] && <AuthoredProse text={pkg.openings[0].text} size="xs" />}
    </>
  );
}

function BatchStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <dt style={{ minWidth: 84, flexShrink: 0, fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
        {label}
      </dt>
      <dd style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>{value}</dd>
    </div>
  );
}

/** Re-exported so the block set stays reachable from one module for tests. */
export { Block };
