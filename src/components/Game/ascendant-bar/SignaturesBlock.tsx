/**
 * SignaturesBlock — the eight reach signatures, partitioned by what is yours.
 *
 * The legibility surface for player action progression's permanence (THR-613 §5.B):
 * every incarnation can only ever walk the paths of its two-or-three permanent
 * reaches. The reach gate silently hides the other reaches' signature cards from the
 * live drawer, so without this readout the *permanence* is invisible — the player
 * cannot tell "I can't do this yet (earn it)" from "I can't do this at all this run
 * (another incarnation's path)".
 *
 * Two groups: "Your Paths" (available / acquirable — the signatures of your reaches)
 * and "Not This Incarnation" (the reaches you did not take, dimmed). Prose-first, no
 * numbers — consistent with the rest of the bar.
 */
import {
  SIGNATURE_STATE_COPY,
  SIGNATURE_GROUP_COPY,
  SIGNATURE_EMPTY_COPY,
} from '../../../data/ascendant-bar-content';
import type { SignaturePathView } from './selectors';

interface SignaturesBlockProps {
  paths: SignaturePathView[];
}

function GroupLabel({ text }: { text: string }) {
  return (
    <div
      style={{
        fontFamily: 'var(--font-display)',
        fontSize: 9,
        fontWeight: 600,
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.18em',
      }}
    >
      {text}
    </div>
  );
}

function SignatureRow({ path }: { path: SignaturePathView }) {
  const isLocked = path.state === 'locked_incarnation';
  return (
    <div
      data-testid={`signature-row-${path.reach}`}
      data-state={path.state}
      title={path.spellName ?? undefined}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        opacity: isLocked ? 0.55 : 1,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 9,
            fontWeight: 600,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.14em',
            minWidth: 48,
          }}
        >
          {path.reachLabel}
        </span>
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 14,
            fontWeight: 600,
            color: isLocked ? 'var(--text-secondary)' : 'var(--text-primary)',
            letterSpacing: '0.04em',
          }}
        >
          {path.name}
        </span>
        {path.isPrimary && (
          <span
            data-testid={`signature-primary-${path.reach}`}
            style={{ color: 'var(--accent-gold)', fontSize: 11 }}
            title="Your primary reach"
          >
            ★
          </span>
        )}
      </div>
      <div
        data-testid={`signature-hint-${path.reach}`}
        style={{
          fontFamily: 'var(--font-body)',
          fontStyle: 'italic',
          fontSize: 11,
          color:
            path.state === 'available'
              ? 'var(--accent-gold)'
              : 'var(--text-muted)',
          paddingLeft: 54,
          lineHeight: 1.35,
        }}
      >
        {SIGNATURE_STATE_COPY[path.state]}
      </div>
    </div>
  );
}

export function SignaturesBlock({ paths }: SignaturesBlockProps) {
  if (paths.length === 0) {
    return (
      <div
        style={{
          fontFamily: 'var(--font-body)',
          fontStyle: 'italic',
          fontSize: 12,
          color: 'var(--text-muted)',
        }}
      >
        {SIGNATURE_EMPTY_COPY}
      </div>
    );
  }

  const yours = paths.filter((p) => p.state !== 'locked_incarnation');
  const other = paths.filter((p) => p.state === 'locked_incarnation');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      {yours.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <GroupLabel text={SIGNATURE_GROUP_COPY.yours} />
          {yours.map((p) => (
            <SignatureRow key={p.reach} path={p} />
          ))}
        </div>
      )}
      {other.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <GroupLabel text={SIGNATURE_GROUP_COPY.other} />
          {other.map((p) => (
            <SignatureRow key={p.reach} path={p} />
          ))}
        </div>
      )}
    </div>
  );
}
