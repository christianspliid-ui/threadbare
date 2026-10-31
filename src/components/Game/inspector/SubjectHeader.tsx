/**
 * The Inspector's header (THR-1876 § D5 item 2): the subject's image, kind word, name,
 * epithet, "where" line, standing chips and doing line. The land page adds its lede.
 *
 * THR-2097 (rule R1): at wide and Full a person-kind header leads with the portrait at
 * `--inspector-portrait-w`, 3:4 (Law 5), the name under it; The First wears the Your First
 * badge on the portrait's bottom edge. Docked keeps the small portrait beside the name.
 */
import type { SubjectHeaderVM } from '../../../engine/views/subjects/subjectTypes';
import type { WorldGraph } from '../../../engine/graph';
import type { EntityVisualKind } from '../../shared/entityVisualResolver';
import { EntityVisual } from '../../shared/EntityVisual';
import { Chip } from '../../shared/Chip';
import { Medallion } from '../../shared/Medallion';
import { INSPECTOR_WORDS } from '../../../data/view-content';
import { AVATAR_SHEET_SUFFIX } from '../../../data/avatar-framing';

/** The header's image kind for each subject visual kind. */
const VISUAL_KIND: Record<SubjectHeaderVM['visual']['kind'], EntityVisualKind | undefined> = {
  agent: 'agent',
  companion: 'companion',
  faction: 'faction',
  location: 'location',
  sublocation: 'sublocation',
  area: 'location',
  hex: 'location',
  artifact: 'artifact',
  attachment: 'unknown',
  army: 'army',
  encounter: 'encounter',
  journey: 'encounter',
  receipt: 'encounter',
  god: 'avatar',
  land: 'location',
  content: 'unknown',
  record: 'encounter',
  missing: 'unknown',
};

const PERSON_LIKE = new Set(['agent', 'companion', 'god']);

/** The name under a lead portrait, one step above the docked heading (NFP #1; Cinzel stays ≥ 22px). */
export const PORTRAIT_NAME_SCALE = 1.25;

/** "Your First" — the standing chip's own words, moved onto the portrait. */
const FIRST_BADGE = INSPECTOR_WORDS.factFirst.replace(/^your/, 'Your');

function Visual({ header, graph }: { header: SubjectHeaderVM; graph?: WorldGraph | null }) {
  const portrait = PERSON_LIKE.has(header.visual.kind);
  return (
    <EntityVisual
      size={portrait ? 'portrait' : 'hero'}
      entity={{ id: header.visual.id, kind: VISUAL_KIND[header.visual.kind], name: header.name, knownSrc: header.visual.src ?? null }}
      graph={graph}
      opts={header.visual.portraitGate === 'silhouette' ? { knowledgeLevel: 'stranger' } : undefined}
    />
  );
}

/** The Your First badge on the portrait's bottom edge: the god's face, then the words. Neutral ink, not gold (Law 31). */
function FirstBadge({ firstOf }: { firstOf: NonNullable<SubjectHeaderVM['firstOf']> }) {
  return (
    <span
      data-first-badge=""
      style={{
        position: 'absolute', left: '50%', bottom: 0, transform: 'translate(-50%, 50%)',
        display: 'inline-flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap',
        padding: '2px 10px 2px 2px', borderRadius: 'var(--radius-chip)',
        background: 'var(--bg-raised)', border: '1px solid var(--border-subtle)',
        color: 'var(--text-primary)', fontSize: 'var(--text-xs)', fontWeight: 700,
      }}
    >
      {firstOf.godPortraitSrc ? (
        <Medallion size="sm" title={firstOf.godName} style={{ width: '1.75rem', height: '1.75rem', border: 'none' }}>
          <img src={firstOf.godPortraitSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        </Medallion>
      ) : (
        <span style={{ width: '6px' }} />
      )}
      {FIRST_BADGE}
    </span>
  );
}

export function SubjectHeader({ header, graph, compact }: { header: SubjectHeaderVM; graph?: WorldGraph | null; compact: boolean }) {
  const portrait = PERSON_LIKE.has(header.visual.kind);
  const lead = portrait && !compact;
  const visualWidth = lead ? 'var(--inspector-portrait-w)' : portrait ? '5rem' : compact ? '9rem' : '12rem';
  // With the badge on the portrait, the standing row does not say it again.
  const badge = lead && header.firstOf ? header.firstOf : null;
  const standing = badge ? header.standing.filter(c => c.label !== FIRST_BADGE) : header.standing;
  return (
    <header
      data-inspector-header=""
      data-header-lead={lead ? 'portrait' : undefined}
      style={{ display: 'flex', flexDirection: lead ? 'column' : 'row', gap: 'var(--space-3, 12px)', alignItems: lead ? 'center' : 'flex-start', minWidth: 0 }}
    >
      <div style={{ width: visualWidth, maxWidth: '100%', flexShrink: 0, position: 'relative', marginBottom: badge ? '12px' : undefined }}>
        <Visual header={header} graph={graph} />
        {badge && <FirstBadge firstOf={badge} />}
      </div>
      <div style={{ minWidth: 0, flex: 1, width: lead ? '100%' : undefined, textAlign: lead ? 'center' : undefined }}>
        <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-tertiary)' }}>{header.kindLabel}</div>
        <h2
          data-inspector-heading=""
          tabIndex={-1}
          style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: lead ? `calc(var(--text-2xl) * ${PORTRAIT_NAME_SCALE})` : 'var(--text-2xl)', color: 'var(--text-primary)', lineHeight: 1.15, overflowWrap: 'anywhere' }}
        >
          {header.name}
          {header.mortalShape && (
            <span data-inspector-mortal-shape="" style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>
              {' — '}{AVATAR_SHEET_SUFFIX}
            </span>
          )}
        </h2>
        {header.mortalShape && (
          <p
            data-inspector-god-title=""
            style={{ margin: '2px 0 0', fontStyle: 'italic', fontSize: 'var(--text-base)', color: 'var(--accent-gold)' }}
          >
            {header.mortalShape.godTitleLine}
          </p>
        )}
        {header.epithet && <div style={{ fontStyle: 'italic', color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>{header.epithet}</div>}
        {header.whereLine.length > 0 && (
          <div data-inspector-where="" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: lead ? 'center' : undefined, gap: '4px', marginTop: '4px', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
            <span>{INSPECTOR_WORDS.whereAt}</span>
            {header.whereLine.map((r, i) => (
              <span key={`${r.ref.kind}:${r.ref.id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                {i > 0 && <span>{INSPECTOR_WORDS.whereIn}</span>}
                <Chip role="identity" size="sm" target={r.ref} label={r.name} icon={r.icon} />
              </span>
            ))}
          </div>
        )}
        {header.lede && <p style={{ margin: '6px 0 0', fontSize: 'var(--text-base)', color: 'var(--text-primary)', lineHeight: 1.5 }}>{header.lede}</p>}
        {standing.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: lead ? 'center' : undefined, gap: '6px', marginTop: '6px' }}>
            {standing.map(chip => <Chip key={chip.label} role="state" size="sm" label={chip.label} tooltipId={chip.tooltipId} />)}
          </div>
        )}
        {header.doingLine && <p style={{ margin: '6px 0 0', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{header.doingLine}</p>}
      </div>
    </header>
  );
}
