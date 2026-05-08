import type { ULTerm, ULTermStatus } from './ulDashboardData';
import { getDriftSignals } from './ulDashboardData';
import { ULMarkdown } from './ulMarkdown';
import { ULDriftBadge } from './ULDriftBadge';
import {
  DETAIL_PANE_WIDTH_PX,
  EMPTY_DETAIL_HINT,
} from '../../data/ul-dashboard-constants';

interface ULDetailPaneProps {
  term: ULTerm | null;
  onWikilinkClick: (termName: string) => void;
}

const STATUS_COLOR: Record<ULTermStatus, string> = {
  canonical: '#7aa2a8',
  proposed: '#d4a040',
  deprecated: '#a85a5a',
  unknown: '#888',
};

const GITHUB_BASE = 'https://github.com/christianspliid-ui/threadbare/blob/main/';

export function ULDetailPane({ term, onWikilinkClick }: ULDetailPaneProps) {
  return (
    <aside
      className="overflow-y-auto flex-shrink-0"
      style={{
        width: `${DETAIL_PANE_WIDTH_PX}px`,
        backgroundColor: 'var(--bg-deep)',
        borderLeft: '1px solid var(--border-subtle)',
        padding: 'var(--space-4)',
      }}
      data-testid="ul-detail-pane"
    >
      {!term ? (
        <p
          style={{
            color: 'var(--text-muted)',
            fontSize: 'var(--text-sm)',
            fontStyle: 'italic',
          }}
        >
          {EMPTY_DETAIL_HINT}
        </p>
      ) : (
        <DetailContent term={term} onWikilinkClick={onWikilinkClick} />
      )}
    </aside>
  );
}

function DetailContent({
  term,
  onWikilinkClick,
}: {
  term: ULTerm;
  onWikilinkClick: (termName: string) => void;
}) {
  const drift = getDriftSignals(term);
  const sourceHref = `${GITHUB_BASE}${term.sourcePath}`;

  return (
    <>
      <h2
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--text-lg)',
          color: 'var(--text-primary)',
          marginBottom: 4,
        }}
      >
        {term.name}
      </h2>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 'var(--space-3)',
          flexWrap: 'wrap',
        }}
      >
        <span
          style={{
            color: STATUS_COLOR[term.status],
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-xs)',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}
        >
          {term.status}
        </span>
        {term.contentAdjacent && (
          <span
            style={{
              color: '#7aa2a8',
              fontSize: 'var(--text-xs)',
              fontFamily: 'var(--font-display)',
            }}
            title="Content-adjacent shard"
          >
            content-adjacent
          </span>
        )}
        <ULDriftBadge signals={drift} />
      </div>

      {term.aliases.length > 0 && (
        <p
          style={{
            color: 'var(--text-muted)',
            fontSize: 'var(--text-xs)',
            marginBottom: 'var(--space-2)',
          }}
        >
          <strong>Aliases:</strong> {term.aliases.join(', ')}
        </p>
      )}

      <p style={{ marginBottom: 'var(--space-3)' }}>
        <a
          href={sourceHref}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: 'var(--accent-gold-dim)',
            fontSize: 'var(--text-xs)',
            textDecoration: 'underline',
            fontFamily: 'var(--font-mono, monospace)',
          }}
        >
          {term.sourcePath}
        </a>
      </p>

      <div style={{ marginBottom: 'var(--space-4)' }}>
        <ULMarkdown body={term.body} onWikilinkClick={onWikilinkClick} />
      </div>

      {term.seeAlso.length > 0 && (
        <>
          <h3
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--text-xs)',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              marginBottom: 'var(--space-2)',
            }}
          >
            Also see
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {term.seeAlso.map((link, idx) => (
              <SeeAlsoChip
                key={`${link.termName}-${idx}`}
                termName={link.termName}
                resolved={link.resolvedSlug !== null}
                onClick={() => onWikilinkClick(link.termName)}
              />
            ))}
          </div>
        </>
      )}
    </>
  );
}

function SeeAlsoChip({
  termName,
  resolved,
  onClick,
}: {
  termName: string;
  resolved: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={resolved ? onClick : undefined}
      title={resolved ? `Jump to ${termName}` : 'term not found in current shards'}
      disabled={!resolved}
      style={{
        padding: '3px 8px',
        borderRadius: 'var(--radius-md)',
        border: resolved
          ? '1px solid var(--accent-gold)'
          : '1px solid var(--border-subtle)',
        background: resolved ? 'rgba(212, 160, 64, 0.10)' : 'transparent',
        color: resolved ? 'var(--accent-gold)' : 'var(--text-muted)',
        fontSize: 'var(--text-xs)',
        fontFamily: 'var(--font-display)',
        cursor: resolved ? 'pointer' : 'not-allowed',
      }}
    >
      {!resolved && '⚠ '}
      {termName}
    </button>
  );
}
