import type { ULDriftSignals } from './ulDashboardData';

interface ULDriftBadgeProps {
  signals: ULDriftSignals;
}

const BADGE_BASE: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  padding: '2px 6px',
  borderRadius: 4,
  fontSize: 'var(--text-xs)',
  fontFamily: 'var(--font-display)',
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
};

export function ULDriftBadge({ signals }: ULDriftBadgeProps) {
  const badges: React.ReactNode[] = [];
  if (signals.isStale && signals.staleAgeDays !== null) {
    badges.push(
      <span
        key="stale"
        style={{
          ...BADGE_BASE,
          color: '#d4a040',
          backgroundColor: 'rgba(212, 160, 64, 0.15)',
          border: '1px solid rgba(212, 160, 64, 0.4)',
        }}
        title={`Last seen ${signals.staleAgeDays} days ago in src/** or Docs/**`}
      >
        Stale {signals.staleAgeDays}d
      </span>,
    );
  }
  for (const proposal of signals.openProposals) {
    badges.push(
      <span
        key={proposal.linearId}
        style={{
          ...BADGE_BASE,
          color: '#7aa2f7',
          backgroundColor: 'rgba(122, 162, 247, 0.15)',
          border: '1px solid rgba(122, 162, 247, 0.4)',
        }}
        title={`Linear: ${proposal.linearId} (${proposal.state})`}
      >
        {proposal.linearId}
      </span>,
    );
  }
  if (badges.length === 0) return null;
  return <span style={{ display: 'inline-flex', gap: 4 }}>{badges}</span>;
}
