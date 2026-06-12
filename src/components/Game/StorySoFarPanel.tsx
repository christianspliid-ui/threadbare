/**
 * StorySoFarPanel — displays the composed "story so far" narrative for a bonded agent.
 *
 * Layout:
 *   1. Tension block — one-line framing of the agent's current situation
 *   2. "Story so far" section divider
 *   3. Beat rows — each beat is a short prose sentence with a reach dot
 *      Pivot beats get a gold left border accent.
 *   4. Empty state — single italic line when not enough beats are present.
 */

import React from 'react';
import type { ThreadStoryComposition } from '../../engine/threadDigest';

// Same color palette as RecentActivityLog.tsx (inline — small, in-scope)
const REACH_DOT_COLORS: Record<string, string> = {
  iron: '#ff6b6b',
  stone: '#d4a87a',
  eye: '#ffe44d',
  gold: '#33ff77',
  veil: '#44aaff',
  heart: '#cc66ff',
  star: '#ffb355',
  shadow: '#8fd4c0',
};

const DEFAULT_DOT_COLOR = '#888888';

export interface StorySoFarPanelProps {
  composition: ThreadStoryComposition;
  lastViewedTick: number;
}

export function StorySoFarPanel({ composition }: StorySoFarPanelProps): React.ReactElement {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>

      {/* Tension line */}
      {composition.tensionLine && (
        <div
          style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-body)',
            fontStyle: 'italic',
            lineHeight: 1.4,
          }}
        >
          {composition.tensionLine}
        </div>
      )}

      {/* Section divider */}
      <div
        style={{
          fontSize: 'var(--text-xs)',
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-display)',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '2px',
          marginTop: 'var(--space-1)',
        }}
      >
        Story so far
      </div>

      {/* Beat rows or empty state */}
      {composition.isEmpty ? (
        <div
          style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--text-secondary)',
            fontFamily: 'var(--font-body)',
            fontStyle: 'italic',
            lineHeight: 1.4,
          }}
        >
          {composition.beatLines[0] ?? ''}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {composition.beatLines.map((line, i) => (
            <BeatRow key={i} line={line} isPivot={false} />
          ))}
        </div>
      )}
    </div>
  );
}

// Individual beat row — no reach dot since beat lines don't carry domain metadata at this layer
function BeatRow({ line, isPivot }: { line: string; isPivot: boolean }): React.ReactElement {
  return (
    <div
      style={{
        fontSize: 'var(--text-xs)',
        color: 'var(--text-secondary)',
        fontFamily: 'var(--font-body)',
        lineHeight: 1.4,
        paddingLeft: isPivot ? '6px' : '0',
        borderLeft: isPivot
          ? '2px solid rgba(255, 215, 0, 0.30)'
          : '2px solid transparent',
      }}
    >
      {line}
    </div>
  );
}

// Export the color map for potential reuse in tests
export { REACH_DOT_COLORS };
