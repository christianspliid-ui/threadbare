/**
 * The Inspector's header (THR-1876 § D5 item 2): the subject's image, kind word, name,
 * epithet, "where" line, standing chips and doing line. The land page adds its lede.
 */
import type { SubjectHeaderVM } from '../../../engine/views/subjects/subjectTypes';
import type { WorldGraph } from '../../../engine/graph';
import type { EntityVisualKind } from '../../shared/entityVisualResolver';
import { EntityVisual } from '../../shared/EntityVisual';
import { Chip } from '../../shared/Chip';
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

export function SubjectHeader({ header, graph, compact }: { header: SubjectHeaderVM; graph?: WorldGraph | null; compact: boolean }) {
  const portrait = PERSON_LIKE.has(header.visual.kind);
  const visualWidth = portrait ? (compact ? '5rem' : '7rem') : compact ? '9rem' : '12rem';
  return (
    <header data-inspector-header="" style={{ display: 'flex', gap: 'var(--space-3, 12px)', alignItems: 'flex-start', minWidth: 0 }}>
      <div style={{ width: visualWidth, flexShrink: 0 }}>
        <EntityVisual
          size={portrait ? 'portrait' : 'hero'}
          entity={{ id: header.visual.id, kind: VISUAL_KIND[header.visual.kind], name: header.name, knownSrc: header.visual.src ?? null }}
          graph={graph}
          opts={header.visual.portraitGate === 'silhouette' ? { knowledgeLevel: 'stranger' } : undefined}
        />
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-tertiary)' }}>{header.kindLabel}</div>
        <h2
          data-inspector-heading=""
          tabIndex={-1}
          style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', color: 'var(--text-primary)', lineHeight: 1.15, overflowWrap: 'anywhere' }}
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
          <div data-inspector-where="" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4px', marginTop: '4px', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
            <span>{INSPECTOR_WORDS.whereAt}</span>
            {header.whereLine.map((r, i) => (
              <span key={`${r.ref.kind}:${r.ref.id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                {i > 0 && <span>{INSPECTOR_WORDS.whereIn}</span>}
                <Chip role="identity" size="sm" target={r.ref} label={r.name} />
              </span>
            ))}
          </div>
        )}
        {header.lede && <p style={{ margin: '6px 0 0', fontSize: 'var(--text-base)', color: 'var(--text-primary)', lineHeight: 1.5 }}>{header.lede}</p>}
        {header.standing.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
            {header.standing.map(chip => <Chip key={chip.label} role="state" size="sm" label={chip.label} tooltipId={chip.tooltipId} />)}
          </div>
        )}
        {header.doingLine && <p style={{ margin: '6px 0 0', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{header.doingLine}</p>}
      </div>
    </header>
  );
}
