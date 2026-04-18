import { memo } from 'react';
import type { FactionDefinition } from '../../../types/faction';
import { CoatOfArms } from '../../icons';

interface FactionEntryProps {
  name: string;
  guildType?: string;  // e.g. 'artisans', 'miners', 'traders', 'merchants', 'bankers'
  locationName: string;
  onClick: () => void;
  /** Optional faction definition — when provided, renders a CoatOfArms instead of the default hex glyph */
  factionDef?: FactionDefinition;
}

const GUILD_TYPE_LABELS: Record<string, string> = {
  artisans: 'Artisans',
  miners: 'Miners',
  traders: 'Traders',
  merchants: 'Merchants',
  bankers: 'Bankers',
};

export const FactionEntry = memo(function FactionEntry({
  name,
  guildType,
  locationName,
  onClick,
  factionDef,
}: FactionEntryProps) {
  const typeLabel = guildType ? (GUILD_TYPE_LABELS[guildType] ?? 'Guild') : 'Faction';

  return (
    <div
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
      role="button"
      tabIndex={0}
      aria-label={`Faction: ${name}`}
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderLeft: '3px solid var(--accent-gold)',
        borderRadius: '4px',
        padding: '6px 10px',
        cursor: 'pointer',
        margin: '4px 0',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        transition: 'background-color 0.15s ease',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = 'var(--bg-hover)'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = 'var(--bg-surface)'; }}
    >
      {/* Guild/faction icon marker */}
      {factionDef ? (
        <CoatOfArms definition={factionDef} size={24} />
      ) : (
        <span
          style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--accent-gold)',
            flexShrink: 0,
            opacity: 0.8,
          }}
        >
          ⬡
        </span>
      )}
      <div style={{ minWidth: 0, flex: 1 }}>
        <span
          style={{
            fontFamily: 'var(--font-display)',
            color: 'var(--text-primary)',
            fontSize: 'var(--text-xs)',
            fontWeight: 500,
          }}
        >
          {name}
        </span>
        <div
          style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--text-tertiary)',
            marginTop: '1px',
          }}
        >
          {typeLabel} · {locationName}
        </div>
      </div>
    </div>
  );
});
