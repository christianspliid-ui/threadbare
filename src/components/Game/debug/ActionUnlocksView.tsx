/**
 * Action Unlocks debug tab (THR-419 Starter 12).
 *
 * Three rows: Starter (always 12), Unlocked (player's earned pool), Locked
 * (everything else). Confirms the Gate 8 floor effect at a glance and supports
 * the browser-verify state assertion required by Definition of Done.
 */
import React, { useMemo, useState } from 'react';
import { UNIFIED_ACTION_TEMPLATES } from '../../../data/unified-action-templates';
import {
  STARTER_ACTION_IDS,
  STARTER_ACTION_COUNT,
  isActionRevealed,
} from '../../../engine/actionUnlock';
import { EMPTY_STATE_STYLE } from './debugPanelStyles';

interface ActionUnlocksViewProps {
  /** Player's unlocked action IDs from GameState — undefined treated as empty. */
  unlockedActionIds?: readonly string[];
  /**
   * Optional grant callback wired by GameView so the in-panel "Grant" button can
   * mutate live state. Omit in test mode / static renders.
   */
  onGrant?: (templateId: string) => void;
}

const TEMPLATES_BY_ID = new Map(UNIFIED_ACTION_TEMPLATES.map(t => [t.id, t]));

const SECTION_HEADER_STYLE: React.CSSProperties = {
  fontSize: 'var(--text-sm)',
  fontFamily: 'var(--font-display)',
  color: 'var(--text-primary)',
  marginTop: 'var(--space-2)',
  marginBottom: 'var(--space-1)',
  borderBottom: '1px solid var(--border-subtle)',
  paddingBottom: '2px',
};

const ROW_STYLE: React.CSSProperties = {
  fontSize: 'var(--text-xs)',
  fontFamily: 'var(--font-body)',
  color: 'var(--text-secondary)',
  padding: '2px 4px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '8px',
};

const ID_STYLE: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  color: 'var(--text-muted)',
  fontSize: '11px',
};

const BUTTON_STYLE: React.CSSProperties = {
  fontSize: '10px',
  padding: '2px 6px',
  background: 'transparent',
  color: 'var(--accent-gold)',
  border: '1px solid var(--border-subtle)',
  borderRadius: '2px',
  cursor: 'pointer',
};

export function ActionUnlocksView({ unlockedActionIds, onGrant }: ActionUnlocksViewProps) {
  const [showLocked, setShowLocked] = useState(false);

  const { starterEntries, unlockedEntries, lockedEntries, missingFlags } = useMemo(() => {
    const unlockedSet = new Set(unlockedActionIds ?? []);
    const starterIdSet = new Set(STARTER_ACTION_IDS);

    const starter = STARTER_ACTION_IDS.map(id => {
      const t = TEMPLATES_BY_ID.get(id);
      return {
        id,
        name: t?.name ?? '(missing template)',
        live: t != null,
        flagSet: t?.starter === true,
      };
    });

    const missing = starter.filter(s => !s.flagSet || !s.live);

    const unlocked = Array.from(unlockedSet)
      .filter(id => !starterIdSet.has(id))  // dedupe — starters never appear here
      .map(id => {
        const t = TEMPLATES_BY_ID.get(id);
        return { id, name: t?.name ?? '(unknown id)', live: t != null };
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    const locked = UNIFIED_ACTION_TEMPLATES
      .filter(t => !isActionRevealed(t, unlockedActionIds))
      .map(t => ({ id: t.id, name: t.name, rarityTier: t.rarityTier }))
      .sort((a, b) => a.rarityTier - b.rarityTier || a.name.localeCompare(b.name));

    return {
      starterEntries: starter,
      unlockedEntries: unlocked,
      lockedEntries: locked,
      missingFlags: missing,
    };
  }, [unlockedActionIds]);

  return (
    <div style={{ padding: 'var(--space-2)', overflowY: 'auto', fontFamily: 'var(--font-body)' }}>
      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: 'var(--space-2)' }}>
        THR-419 — the Starter {STARTER_ACTION_COUNT} is the always-available floor.
        Locked templates are absent from the drawer, not shown as silhouettes.
      </div>

      <div style={SECTION_HEADER_STYLE}>
        Starter — {starterEntries.length}/{STARTER_ACTION_COUNT}
        {missingFlags.length > 0 ? (
          <span style={{ color: '#b85450', marginLeft: '8px', fontSize: '11px' }}>
            ({missingFlags.length} template{missingFlags.length === 1 ? '' : 's'} missing `starter: true`)
          </span>
        ) : null}
      </div>
      {starterEntries.map(entry => (
        <div key={entry.id} style={ROW_STYLE}>
          <span>
            <span>{entry.name}</span>
            <span style={{ ...ID_STYLE, marginLeft: '8px' }}>{entry.id}</span>
          </span>
          <span style={{ color: entry.flagSet ? 'var(--accent-gold)' : '#b85450', fontSize: '10px' }}>
            {entry.flagSet ? 'flag set' : entry.live ? 'flag MISSING' : 'template MISSING'}
          </span>
        </div>
      ))}

      <div style={SECTION_HEADER_STYLE}>
        Unlocked — {unlockedEntries.length}
      </div>
      {unlockedEntries.length === 0 ? (
        <div style={EMPTY_STATE_STYLE}>No actions unlocked yet — only starters appear in the drawer.</div>
      ) : (
        unlockedEntries.map(entry => (
          <div key={entry.id} style={ROW_STYLE}>
            <span>
              <span>{entry.name}</span>
              <span style={{ ...ID_STYLE, marginLeft: '8px' }}>{entry.id}</span>
            </span>
            {!entry.live && <span style={{ color: '#b85450', fontSize: '10px' }}>stale id</span>}
          </div>
        ))
      )}

      <div style={SECTION_HEADER_STYLE}>
        Locked — {lockedEntries.length}
        <button
          style={{ ...BUTTON_STYLE, marginLeft: '8px' }}
          onClick={() => setShowLocked(v => !v)}
        >
          {showLocked ? 'Hide list' : 'Show list'}
        </button>
      </div>
      {showLocked && lockedEntries.length === 0 ? (
        <div style={EMPTY_STATE_STYLE}>No locked templates — the player has unlocked everything.</div>
      ) : showLocked ? (
        lockedEntries.map(entry => (
          <div key={entry.id} style={ROW_STYLE}>
            <span>
              <span>{entry.name}</span>
              <span style={{ ...ID_STYLE, marginLeft: '8px' }}>{entry.id}</span>
            </span>
            <span style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>tier {entry.rarityTier}</span>
              {onGrant && (
                <button
                  style={BUTTON_STYLE}
                  onClick={() => onGrant(entry.id)}
                  aria-label={`Grant ${entry.name}`}
                >
                  Grant
                </button>
              )}
            </span>
          </div>
        ))
      ) : null}
    </div>
  );
}
