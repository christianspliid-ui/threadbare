import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react';
import { UNIFIED_ACTION_TEMPLATES } from '../../../data/unified-action-templates';

type LockedAction = import('../../../debug-bridge.d').DebugLockedActionInfo;

const PANEL_STYLE: CSSProperties = {
  padding: '10px 12px',
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
};

const BLOCK_STYLE: CSSProperties = {
  border: '1px solid var(--border-subtle)',
  borderRadius: '6px',
  padding: '8px',
  background: 'var(--bg-surface)',
};

const TITLE_STYLE: CSSProperties = {
  fontSize: 'var(--text-xs)',
  fontWeight: 600,
  color: 'var(--text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  marginBottom: '6px',
};

const LIST_STYLE: CSSProperties = {
  margin: 0,
  paddingLeft: '16px',
  display: 'grid',
  gap: '2px',
  fontSize: 'var(--text-xs)',
  color: 'var(--text-primary)',
};

export function ActionUnlocksView() {
  const [starterIds, setStarterIds] = useState<string[]>([]);
  const [lockedActions, setLockedActions] = useState<LockedAction[]>([]);
  const [grantActionId, setGrantActionId] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!window.__DEBUG) return;
    setLoading(true);
    try {
      const [starters, locked] = await Promise.all([
        window.__DEBUG.listStarterActions(),
        window.__DEBUG.listLockedActions(),
      ]);
      setStarterIds(starters);
      setLockedActions(locked);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const starterIdSet = useMemo(() => new Set(starterIds), [starterIds]);
  const lockedIdSet = useMemo(() => new Set(lockedActions.map((action) => action.id)), [lockedActions]);

  const unlockedIds = useMemo(() => {
    const ids = UNIFIED_ACTION_TEMPLATES
      .map((template) => template.id)
      .filter((id) => !starterIdSet.has(id) && !lockedIdSet.has(id));
    return ids.sort((a, b) => a.localeCompare(b));
  }, [starterIdSet, lockedIdSet]);

  const handleGrant = useCallback(async () => {
    const id = grantActionId.trim();
    if (!id || !window.__DEBUG) return;
    const result = await window.__DEBUG.grantAction(id);
    setStatusMessage(result.message);
    if (result.success) {
      setGrantActionId('');
      await refresh();
    }
  }, [grantActionId, refresh]);

  if (!window.__DEBUG) {
    return <div style={PANEL_STYLE}>Debug bridge not available.</div>;
  }

  return (
    <div style={PANEL_STYLE}>
      <div style={BLOCK_STYLE}>
        <div style={TITLE_STYLE}>Counts</div>
        <div style={{ display: 'flex', gap: '14px', fontSize: 'var(--text-xs)' }}>
          <span>Starter: <strong>{starterIds.length}</strong></span>
          <span>Unlocked: <strong>{unlockedIds.length}</strong></span>
          <span>Locked: <strong>{lockedActions.length}</strong></span>
          {loading && <span style={{ color: 'var(--text-muted)' }}>Refreshing…</span>}
        </div>
      </div>

      <div style={BLOCK_STYLE}>
        <div style={TITLE_STYLE}>Grant Action</div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            value={grantActionId}
            onChange={(event) => setGrantActionId(event.target.value)}
            placeholder="template id (e.g. divine.inspire)"
            style={{
              flex: 1,
              background: 'var(--bg-deep)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
              borderRadius: '4px',
              fontSize: 'var(--text-xs)',
              padding: '6px 8px',
            }}
          />
          <button
            type="button"
            onClick={() => void handleGrant()}
            style={{
              padding: '6px 10px',
              borderRadius: '4px',
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-raised)',
              color: 'var(--text-primary)',
              fontSize: 'var(--text-xs)',
              cursor: 'pointer',
            }}
          >
            Grant
          </button>
          <button
            type="button"
            onClick={() => void refresh()}
            style={{
              padding: '6px 10px',
              borderRadius: '4px',
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-raised)',
              color: 'var(--text-primary)',
              fontSize: 'var(--text-xs)',
              cursor: 'pointer',
            }}
          >
            Refresh
          </button>
        </div>
        {statusMessage && (
          <div style={{ marginTop: '6px', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
            {statusMessage}
          </div>
        )}
      </div>

      <div style={BLOCK_STYLE}>
        <div style={TITLE_STYLE}>Starter IDs</div>
        <ul style={LIST_STYLE}>
          {starterIds.map((id) => <li key={id}>{id}</li>)}
        </ul>
      </div>

      <div style={BLOCK_STYLE}>
        <div style={TITLE_STYLE}>Unlocked IDs</div>
        <ul style={LIST_STYLE}>
          {unlockedIds.map((id) => <li key={id}>{id}</li>)}
        </ul>
      </div>

      <div style={BLOCK_STYLE}>
        <div style={TITLE_STYLE}>Locked IDs</div>
        <ul style={LIST_STYLE}>
          {lockedActions.map((action) => (
            <li key={action.id}>{action.id} (tier {action.rarityTier})</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
