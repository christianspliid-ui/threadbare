import { useCallback, useState } from 'react';
import type { ChronicleEntry } from '../../types/narrative';
import type { BeforeYouWokeGroup, BeforeYouWokeGroupKey } from '../../engine/worldPastWords';
import { BEFORE_YOU_WOKE_HEADING } from '../../data/world-past-content';
import { ChronicleEntryCard, type ChronicleVoiceMode } from './ChronicleEntryCard';
import { PastLineText } from './PastLineText';
import { SectionHeading } from '../shared/SectionHeading';
import { Tooltip } from '../shared/Tooltip';

interface ChroniclePanelProps {
  entries: ChronicleEntry[];
  /** Current simulation tick, so each entry can read how long ago it happened (THR-1426). */
  currentTick?: number;
  /**
   * The world's past, worded and fog-gated (THR-1656) — the pinned "Before you woke"
   * section above the entries. Absent or empty ⇒ the section does not render.
   */
  past?: BeforeYouWokeGroup[];
}

const VOICE_LABELS: Record<ChronicleVoiceMode, string> = {
  interleaved: 'Both',
  poet: 'Poet',
  witness: 'Witness',
};

/**
 * Where the "Before you woke" collapsed state persists (Law 51 — a player-set preference
 * outlives the session; the `threadbare.ui.*` key family). Stored as the set of collapsed
 * keys, so the default — everything open the first time the panel opens — is the empty set.
 */
export const BEFORE_YOU_WOKE_COLLAPSE_STORE_KEY = 'threadbare.ui.chronicle.beforeYouWokeCollapsed';

type CollapseKey = 'section' | BeforeYouWokeGroupKey;

/** Fail-soft (NFP #4): private browsing throws on `localStorage`; the designed failure is "all open". */
function readCollapsed(): Set<CollapseKey> {
  try {
    const raw = localStorage.getItem(BEFORE_YOU_WOKE_COLLAPSE_STORE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? (parsed.filter(k => typeof k === 'string') as CollapseKey[]) : []);
  } catch {
    return new Set();
  }
}

function writeCollapsed(collapsed: Set<CollapseKey>): void {
  try {
    localStorage.setItem(BEFORE_YOU_WOKE_COLLAPSE_STORE_KEY, JSON.stringify([...collapsed]));
  } catch {
    // Quota or private browsing — the toggle still holds for this session.
  }
}

const TOGGLE_STYLE = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  width: '100%',
  background: 'none',
  border: 'none',
  padding: 0,
  cursor: 'pointer',
  textAlign: 'left' as const,
  color: 'inherit',
};

function Caret({ open }: { open: boolean }) {
  return (
    <span aria-hidden="true" style={{ color: 'var(--accent-gold-dim)', fontSize: 'var(--text-xs)', width: '10px' }}>
      {open ? '▾' : '▸'}
    </span>
  );
}

/**
 * The pinned chapter (plan § UI pillar item 1, Lane decision 6): four counted, collapsible
 * groups (Law 36); every Realm, place and person a link through the one router (Law 21).
 * The section scrolls inside itself so the panel never pushes past the viewport (Law 33).
 */
function BeforeYouWoke({ groups }: { groups: BeforeYouWokeGroup[] }) {
  const [collapsed, setCollapsed] = useState<Set<CollapseKey>>(readCollapsed);
  const toggle = useCallback((key: CollapseKey) => {
    setCollapsed(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      writeCollapsed(next);
      return next;
    });
  }, []);
  const sectionOpen = !collapsed.has('section');

  return (
    <section data-testid="before-you-woke" aria-label={BEFORE_YOU_WOKE_HEADING}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <button
          type="button"
          onClick={() => toggle('section')}
          aria-expanded={sectionOpen}
          aria-label={`${sectionOpen ? 'Collapse' : 'Expand'} ${BEFORE_YOU_WOKE_HEADING}`}
          style={{ ...TOGGLE_STYLE, width: 'auto' }}
        >
          <Caret open={sectionOpen} />
        </button>
        <Tooltip id="ui.before_you_woke">
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--text-xs)',
              color: 'var(--accent-gold)',
              textTransform: 'uppercase',
              letterSpacing: '0.14em',
              cursor: 'help',
            }}
          >
            {BEFORE_YOU_WOKE_HEADING}
          </span>
        </Tooltip>
      </div>
      {sectionOpen && (
        <div
          style={{
            overflowY: 'auto',
            maxHeight: '280px',
            marginTop: '8px',
            paddingRight: '4px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          {groups.map(group => {
            const open = !collapsed.has(group.key);
            return (
              <div key={group.key} data-testid={`before-you-woke-${group.key}`}>
                <button
                  type="button"
                  onClick={() => toggle(group.key)}
                  aria-expanded={open}
                  style={TOGGLE_STYLE}
                >
                  <Caret open={open} />
                  <SectionHeading as="div" count={group.count}>{group.title}</SectionHeading>
                </button>
                {open && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px', paddingLeft: '16px' }}>
                    {group.lines.map(line => (
                      <PastLineText
                        key={line.id}
                        line={line}
                        style={{
                          fontFamily: 'var(--font-prose)',
                          fontSize: 'var(--text-xs)',
                          color: 'var(--text-secondary)',
                          lineHeight: 1.5,
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export function ChroniclePanel({ entries, currentTick, past }: ChroniclePanelProps) {
  const [voiceMode, setVoiceMode] = useState<ChronicleVoiceMode>('interleaved');

  const visibleEntries = [...entries].reverse();

  return (
    <div
      style={{
        background: 'var(--bg-deep)',
        border: '1px solid var(--border-gold)',
        borderRadius: '8px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      {/* Header + toggle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-xs)',
            color: 'var(--accent-gold)',
            textTransform: 'uppercase',
            letterSpacing: '0.14em',
          }}
        >
          Chronicle
        </span>
        <div style={{ display: 'flex', gap: '4px' }}>
          {(['interleaved', 'poet', 'witness'] as ChronicleVoiceMode[]).map(mode => (
            <button
              key={mode}
              onClick={() => setVoiceMode(mode)}
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--text-xs)',
                padding: '2px 8px',
                borderRadius: '4px',
                border: '1px solid',
                cursor: 'pointer',
                background: voiceMode === mode ? 'var(--accent-gold)' : 'transparent',
                borderColor: voiceMode === mode ? 'var(--accent-gold)' : 'var(--border-subtle)',
                color: voiceMode === mode ? 'var(--bg-abyss)' : 'var(--text-muted)',
                transition: 'all 0.15s',
              }}
            >
              {VOICE_LABELS[mode]}
            </button>
          ))}
        </div>
      </div>

      {/* The world's past, pinned above the entries (THR-1656) */}
      {past && past.length > 0 && <BeforeYouWoke groups={past} />}

      {/* Entries */}
      <div
        style={{ overflowY: 'auto', maxHeight: '320px' }}
        aria-live="polite"
        aria-label="Game chronicle"
      >
        {visibleEntries.length === 0 ? (
          <p
            style={{
              fontFamily: 'var(--font-prose)',
              fontSize: 'var(--text-xs)',
              color: 'var(--text-tertiary)',
              fontStyle: 'italic',
            }}
          >
            The world awaits...
          </p>
        ) : (
          visibleEntries.map(entry => (
            <ChronicleEntryCard key={entry.id} entry={entry} voiceMode={voiceMode} currentTick={currentTick} />
          ))
        )}
      </div>
    </div>
  );
}
