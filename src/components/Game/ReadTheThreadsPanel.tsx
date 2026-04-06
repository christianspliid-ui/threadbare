/**
 * ReadTheThreadsPanel — Divine ability to review the encounter digest.
 *
 * The player invokes this to see what their court has been doing while
 * they weren't watching. Costs essence; lookback window is selectable.
 *
 * Two states:
 *   Pre-read  — lookback selector + essence cost + Read button
 *   Post-read — grouped digest display (by reach domain)
 *
 * Design doc: Docs/plans/2026-04-05-attention-tier-model-design.md
 */

import { useState, useMemo } from 'react';
import { Modal } from '../shared/Modal';
import { Button } from '../shared/Button';
import type { DigestEntry } from '../../types/attention';
import type { ReachDomain } from '../../types/traits';
import { queryDigest } from '../../engine/digestBuffer';
import {
  READ_THREADS_COST_6,
  READ_THREADS_COST_12,
  READ_THREADS_COST_24,
  READ_THREADS_COST_36,
} from '../../data/attention-constants';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ReadTheThreadsPanelProps {
  open: boolean;
  onClose: () => void;
  digestBuffer: DigestEntry[];
  currentTick: number;
  essenceAvailable: number;
  onSpendEssence: (cost: number) => void;
}

interface LookbackOption {
  label: string;
  ticks: number;
  cost: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const LOOKBACK_OPTIONS: LookbackOption[] = [
  { label: 'Half day',  ticks: 6,  cost: READ_THREADS_COST_6  },
  { label: 'Full day',  ticks: 12, cost: READ_THREADS_COST_12 },
  { label: '2 days',    ticks: 24, cost: READ_THREADS_COST_24 },
  { label: '3 days',    ticks: 36, cost: READ_THREADS_COST_36 },
];

const REACH_ORDER: ReachDomain[] = [
  'iron', 'stone', 'eye', 'gold', 'veil', 'heart', 'star', 'shadow',
];

const REACH_LABELS: Record<ReachDomain, string> = {
  iron:   'Warfare & Conflict',
  stone:  'Building & Craft',
  eye:    'Exploration & Lore',
  gold:   'Commerce & Trade',
  veil:   'Magic & Mystery',
  heart:  'Bonds & Diplomacy',
  star:   'Faith & Devotion',
  shadow: 'Intrigue & Shadow',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 'var(--text-xs)',
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        marginBottom: 'var(--space-1)',
        marginTop: 'var(--space-3)',
      }}
    >
      {children}
    </div>
  );
}

function DigestRow({ entry }: { entry: DigestEntry }) {
  const outcomeText = entry.significantOutcomes.length > 0
    ? entry.significantOutcomes[0]
    : entry.success ? 'Resolved successfully.' : 'Did not go as planned.';

  return (
    <div
      style={{
        padding: 'var(--space-2) 0',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-1)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>
          {entry.agentName}
        </span>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
          {entry.encounterName}
        </span>
      </div>
      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
        {outcomeText}
      </div>
      {entry.attachmentsGained.length > 0 && (
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--accent-gold-dim)' }}>
          + Gained: {entry.attachmentsGained.join(', ')}
        </div>
      )}
      {entry.attachmentsLost.length > 0 && (
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--negative)' }}>
          — Lost: {entry.attachmentsLost.join(', ')}
        </div>
      )}
    </div>
  );
}

// ─── Pre-read state ───────────────────────────────────────────────────────────

function PreReadState({
  essenceAvailable,
  selectedIndex,
  onSelect,
  onRead,
}: {
  essenceAvailable: number;
  selectedIndex: number;
  onSelect: (i: number) => void;
  onRead: () => void;
}) {
  const selected = LOOKBACK_OPTIONS[selectedIndex];
  const canAfford = essenceAvailable >= selected.cost;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      <p
        style={{
          fontSize: 'var(--text-sm)',
          color: 'var(--text-secondary)',
          fontStyle: 'italic',
          lineHeight: 1.6,
          margin: 0,
        }}
      >
        You close your eyes and reach along the threads. Voices echo back through time...
      </p>

      <div>
        <SectionLabel>Lookback window</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-2)' }}>
          {LOOKBACK_OPTIONS.map((opt, i) => {
            const isSelected = i === selectedIndex;
            const affordable = essenceAvailable >= opt.cost;
            return (
              <button
                key={opt.ticks}
                onClick={() => onSelect(i)}
                style={{
                  padding: 'var(--space-2) var(--space-3)',
                  borderRadius: '6px',
                  border: `1px solid ${isSelected ? 'var(--accent-gold)' : 'rgba(255,255,255,0.1)'}`,
                  background: isSelected ? 'rgba(191,157,73,0.12)' : 'rgba(255,255,255,0.03)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'border-color 0.15s ease, background 0.15s ease',
                }}
              >
                <div
                  style={{
                    fontSize: 'var(--text-sm)',
                    color: isSelected ? 'var(--accent-gold)' : 'var(--text-primary)',
                    fontWeight: isSelected ? 600 : 400,
                  }}
                >
                  {opt.label}
                </div>
                <div
                  style={{
                    fontSize: 'var(--text-xs)',
                    color: affordable ? 'var(--text-muted)' : 'var(--negative)',
                    marginTop: '2px',
                  }}
                >
                  {opt.cost} essence
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 'var(--space-1)' }}>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
          Available: <span style={{ color: canAfford ? 'var(--accent-gold)' : 'var(--negative)' }}>{essenceAvailable} essence</span>
        </span>
        <Button
          variant="primary"
          size="md"
          disabled={!canAfford}
          onClick={onRead}
        >
          Read the Threads
        </Button>
      </div>
    </div>
  );
}

// ─── Post-read state ──────────────────────────────────────────────────────────

function PostReadState({ entries }: { entries: DigestEntry[] }) {
  // Partition entries
  const notable = entries.filter(e => e.isNotable && !e.wasCuratedOut);
  const curatedOut = entries.filter(e => e.wasCuratedOut);
  const dormant = entries.filter(e => e.isDormantAgent && !e.wasCuratedOut);
  const locationEntries = entries.filter(e => e.sourceType === 'location' && !e.wasCuratedOut && !e.isDormantAgent);

  // Group active agent entries by reach
  const activeAgentEntries = entries.filter(
    e => !e.wasCuratedOut && !e.isDormantAgent && e.sourceType === 'agent',
  );

  const byReach = useMemo(() => {
    const map = new Map<ReachDomain, DigestEntry[]>();
    for (const reach of REACH_ORDER) {
      const group = activeAgentEntries.filter(e => e.reachPrimary === reach);
      if (group.length > 0) map.set(reach, group);
    }
    return map;
  }, [activeAgentEntries]);

  const hasContent = notable.length > 0 || byReach.size > 0 || curatedOut.length > 0
    || locationEntries.length > 0 || dormant.length > 0;

  if (!hasContent) {
    return (
      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', fontStyle: 'italic' }}>
        The threads are quiet. Nothing of note in this window.
      </p>
    );
  }

  return (
    <div>
      {/* Notable callout */}
      {notable.length > 0 && (
        <div
          style={{
            borderLeft: '3px solid var(--warning)',
            paddingLeft: 'var(--space-3)',
            marginBottom: 'var(--space-3)',
          }}
        >
          <SectionLabel>Notable</SectionLabel>
          {notable.map((e, i) => <DigestRow key={`notable-${i}`} entry={e} />)}
        </div>
      )}

      {/* Per-reach groups */}
      {REACH_ORDER.map(reach => {
        const group = byReach.get(reach);
        if (!group) return null;
        return (
          <div key={reach} style={{ marginBottom: 'var(--space-2)' }}>
            <SectionLabel>{REACH_LABELS[reach]}</SectionLabel>
            {group.map((e, i) => <DigestRow key={`${reach}-${i}`} entry={e} />)}
          </div>
        );
      })}

      {/* Watched locations — vaguer */}
      {locationEntries.length > 0 && (
        <div style={{ marginBottom: 'var(--space-2)' }}>
          <SectionLabel>Watched Locations</SectionLabel>
          {locationEntries.map((e, i) => (
            <div
              key={`loc-${i}`}
              style={{
                padding: 'var(--space-1) 0',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
              }}
            >
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                {e.encounterName} — {e.success ? 'settled quietly' : 'stirred unresolved'}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Missed opportunities — curated out */}
      {curatedOut.length > 0 && (
        <div style={{ marginBottom: 'var(--space-2)' }}>
          <SectionLabel>Missed Opportunities</SectionLabel>
          {curatedOut.map((e, i) => (
            <div
              key={`curated-${i}`}
              style={{
                padding: 'var(--space-1) 0',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
              }}
            >
              <span
                style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--text-muted)',
                  fontStyle: 'italic',
                }}
              >
                {e.agentName} — {e.encounterName}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Dormant court — vaguest */}
      {dormant.length > 0 && (
        <div style={{ marginBottom: 'var(--space-2)' }}>
          <SectionLabel>Dormant Court</SectionLabel>
          {dormant.map((e, i) => (
            <div
              key={`dormant-${i}`}
              style={{
                padding: 'var(--space-1) 0',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
              }}
            >
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                {e.agentName} — faint signs of movement
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ReadTheThreadsPanel({
  open,
  onClose,
  digestBuffer,
  currentTick,
  essenceAvailable,
  onSpendEssence,
}: ReadTheThreadsPanelProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [readEntries, setReadEntries] = useState<DigestEntry[] | null>(null);

  function handleRead() {
    const opt = LOOKBACK_OPTIONS[selectedIndex];
    const entries = queryDigest(digestBuffer, {
      fromTick: currentTick - opt.ticks,
      toTick: currentTick,
    });
    onSpendEssence(opt.cost);
    setReadEntries(entries);
  }

  function handleClose() {
    // Reset state for next opening
    setReadEntries(null);
    setSelectedIndex(0);
    onClose();
  }

  const hasRead = readEntries !== null;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      maxWidth={700}
      aria-label="Read the Threads"
    >
      <Modal.Header onClose={handleClose}>Read the Threads</Modal.Header>
      <Modal.Body>
        {!hasRead ? (
          <PreReadState
            essenceAvailable={essenceAvailable}
            selectedIndex={selectedIndex}
            onSelect={setSelectedIndex}
            onRead={handleRead}
          />
        ) : (
          <PostReadState entries={readEntries} />
        )}
      </Modal.Body>
      {hasRead && (
        <Modal.Footer>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            Close
          </Button>
        </Modal.Footer>
      )}
    </Modal>
  );
}
