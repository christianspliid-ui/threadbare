import type { ULShard, ULShardId } from './ulDashboardData';
import { SIDEBAR_WIDTH_PX } from '../../data/ul-dashboard-constants';

export type ShardFilter = ULShardId | 'all';

export interface SidebarFilterState {
  contentAdjacentOnly: boolean;
  hasDriftOnly: boolean;
}

interface ULSidebarProps {
  shards: readonly ULShard[];
  activeShard: ShardFilter;
  onSelectShard: (shard: ShardFilter) => void;
  filters: SidebarFilterState;
  onChangeFilters: (next: SidebarFilterState) => void;
  totalTermCount: number;
  shardTermCounts: Record<ULShardId, number>;
}

export function ULSidebar({
  shards,
  activeShard,
  onSelectShard,
  filters,
  onChangeFilters,
  totalTermCount,
  shardTermCounts,
}: ULSidebarProps) {
  return (
    <aside
      className="flex-shrink-0 overflow-y-auto"
      style={{
        width: `${SIDEBAR_WIDTH_PX}px`,
        backgroundColor: 'var(--bg-deep)',
        borderRight: '1px solid var(--border-subtle)',
        padding: 'var(--space-3)',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--text-xs)',
          color: 'var(--text-muted)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          marginBottom: 'var(--space-2)',
        }}
      >
        Shards
      </div>
      <nav
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          marginBottom: 'var(--space-4)',
        }}
      >
        <ShardButton
          label="All"
          isActive={activeShard === 'all'}
          count={totalTermCount}
          onClick={() => onSelectShard('all')}
          contentAdjacent={false}
        />
        {shards.map((shard) => (
          <ShardButton
            key={shard.id}
            label={shard.title}
            isActive={activeShard === shard.id}
            count={shardTermCounts[shard.id] ?? shard.termCount}
            onClick={() => onSelectShard(shard.id)}
            contentAdjacent={shard.contentAdjacent}
            blurb={shard.blurb}
          />
        ))}
      </nav>

      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--text-xs)',
          color: 'var(--text-muted)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          marginBottom: 'var(--space-2)',
        }}
      >
        Filters
      </div>
      <FilterChip
        label="Content-adjacent only"
        active={filters.contentAdjacentOnly}
        onToggle={() =>
          onChangeFilters({
            ...filters,
            contentAdjacentOnly: !filters.contentAdjacentOnly,
          })
        }
      />
      <FilterChip
        label="Has drift signal"
        active={filters.hasDriftOnly}
        onToggle={() =>
          onChangeFilters({ ...filters, hasDriftOnly: !filters.hasDriftOnly })
        }
      />
    </aside>
  );
}

function ShardButton({
  label,
  isActive,
  count,
  onClick,
  contentAdjacent,
  blurb,
}: {
  label: string;
  isActive: boolean;
  count: number;
  onClick: () => void;
  contentAdjacent: boolean;
  blurb?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={blurb}
      data-testid={`ul-shard-${label.toLowerCase()}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        padding: '6px 10px',
        borderRadius: 'var(--radius-md)',
        border: isActive
          ? '1px solid var(--accent-gold)'
          : '1px solid transparent',
        background: isActive ? 'rgba(212, 160, 64, 0.12)' : 'transparent',
        color: isActive ? 'var(--accent-gold)' : 'var(--text-secondary)',
        fontFamily: 'var(--font-display)',
        fontSize: 'var(--text-sm)',
        cursor: 'pointer',
        textAlign: 'left',
      }}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        {label}
        {contentAdjacent && (
          <span
            title="Content-adjacent shard"
            style={{
              fontSize: 8,
              color: '#7aa2a8',
            }}
          >
            ●
          </span>
        )}
      </span>
      <span style={{ fontSize: 'var(--text-xs)', opacity: 0.6 }}>{count}</span>
    </button>
  );
}

function FilterChip({
  label,
  active,
  onToggle,
}: {
  label: string;
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      style={{
        display: 'block',
        width: '100%',
        padding: '4px 8px',
        marginBottom: 4,
        borderRadius: 'var(--radius-md)',
        border: active
          ? '1px solid var(--accent-gold)'
          : '1px solid var(--border-subtle)',
        background: active ? 'rgba(212, 160, 64, 0.12)' : 'transparent',
        color: active ? 'var(--accent-gold)' : 'var(--text-muted)',
        fontFamily: 'var(--font-display)',
        fontSize: 'var(--text-xs)',
        cursor: 'pointer',
        textAlign: 'left',
      }}
    >
      {active ? '✓ ' : '○ '}
      {label}
    </button>
  );
}
