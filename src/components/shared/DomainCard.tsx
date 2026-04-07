import type { ReachDomain } from '../../types/traits';
import { DOMAIN_WORD_SCALES } from '../../data/domain-words';
import { getDomainProse } from '../../data/domain-prose';
import { Tooltip } from './Tooltip';

const DOMAIN_NAMES: Record<ReachDomain, string> = {
  iron: 'Iron', gold: 'Gold', shadow: 'Shadow', veil: 'Veil',
  heart: 'Heart', eye: 'Eye', stone: 'Stone', star: 'Star',
};

interface DomainCardProps {
  reach: ReachDomain;
  /** 0-indexed tier (0–4) matching DOMAIN_WORD_SCALES. */
  tier: number;
  /** Agent name for prose interpolation. */
  agentName: string;
  /** Gender string for pronoun resolution (defaults to neutral). */
  gender?: string;
  /** Whether this domain has been revealed to the player. */
  revealed: boolean;
}

export function DomainCard({ reach, tier, agentName, gender, revealed }: DomainCardProps) {
  const clampedTier = Math.max(0, Math.min(4, tier));
  const tierWord = revealed ? DOMAIN_WORD_SCALES[reach][clampedTier] : '???';
  // Art assets are 1-indexed: iron-1.png through iron-5.png
  const artSrc = `/assets/reaches/${reach}-${clampedTier + 1}.png`;

  return (
    <div
      className="flex overflow-hidden rounded-md"
      style={{
        backgroundColor: 'var(--bg-raised)',
        border: '1px solid var(--border-subtle)',
        minHeight: '100px',
        transition: 'border-color 0.2s',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent-gold-dim)'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-subtle)'; }}
    >
      {/* Art thumbnail */}
      <div
        className="flex-shrink-0 flex items-center justify-center"
        style={{
          width: '120px',
          minWidth: '120px',
          overflow: 'hidden',
          filter: revealed ? 'none' : 'grayscale(1) brightness(0.25)',
        }}
      >
        <img
          src={artSrc}
          alt={revealed ? `${DOMAIN_NAMES[reach]} — ${tierWord}` : `${DOMAIN_NAMES[reach]} — unknown`}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          loading="lazy"
        />
      </div>

      {/* Text block */}
      <div className="flex-1 flex flex-col justify-center" style={{ padding: '8px 12px' }}>
        <div className="flex items-baseline gap-1">
          <Tooltip id={`reach.${reach}`}>
            <span
              className="text-xs font-semibold underline decoration-dotted cursor-help"
              style={{
                color: revealed ? 'var(--accent-gold)' : 'var(--text-tertiary)',
                fontVariant: 'small-caps',
                letterSpacing: '0.1em',
              }}
            >
              {DOMAIN_NAMES[reach]}
            </span>
          </Tooltip>
          <span
            className="text-xs"
            style={{
              color: 'var(--text-tertiary)',
              fontVariant: 'small-caps',
              letterSpacing: '0.05em',
            }}
          >
            &middot; {tierWord}
          </span>
        </div>
        <p
          className="text-xs mt-0.5"
          style={{
            color: revealed ? 'var(--text-secondary)' : 'var(--text-tertiary)',
            fontStyle: 'italic',
            lineHeight: 1.4,
          }}
        >
          {revealed
            ? getDomainProse(reach, clampedTier, agentName, gender)
            : 'You haven\'t observed this domain.'}
        </p>
      </div>
    </div>
  );
}
