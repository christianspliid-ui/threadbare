import { SectionHeading } from './SectionHeading';

interface ProgressBandProps {
  label: React.ReactNode;
  value: number;
  prose?: React.ReactNode;
  color?: string;
}

export function ProgressBand({ label, value, prose, color = 'var(--accent-gold)' }: ProgressBandProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, minWidth: 0 }}>
        <SectionHeading>{label}</SectionHeading>
        {prose && (
          <span
            style={{
              marginLeft: 'auto',
              fontSize: 'var(--text-xs)',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-body)',
              fontStyle: 'italic',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              minWidth: 0,
            }}
          >
            {prose}
          </span>
        )}
      </div>
      <div style={{ height: 6, background: 'var(--bg-raised)', borderRadius: 999, overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            width: `${Math.max(0, Math.min(100, value))}%`,
            background: color,
            borderRadius: 999,
            boxShadow: `0 0 8px ${color}66`,
            transition: 'width 0.4s ease-out',
          }}
        />
      </div>
    </div>
  );
}
