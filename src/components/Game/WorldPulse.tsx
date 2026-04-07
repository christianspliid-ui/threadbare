import React from 'react';
import type { GameState } from '../../types/gameState';

interface WorldPulseProps {
  gameState: GameState;
}

/**
 * WorldPulse — a minimal summary panel shown when no agent is selected.
 * Displays tick number, active agent count, culture count, and a mood-driven summary.
 */
export const WorldPulse = React.memo(function WorldPulse({ gameState }: WorldPulseProps) {
  // Count active agents
  const activeAgents = gameState.graph.getNodesByType('actor')
    .filter(node => node.properties?.actorType === 'individual').length;

  // Count cultures (stored as actor nodes with actorType 'culture')
  const cultures = gameState.graph.getNodesByType('actor')
    .filter(node => node.properties?.actorType === 'culture').length;

  // Generate mood-driven summary based on doom stage
  const doomStage = gameState.doomClock.currentStage;
  const summaries: Record<number, string[]> = {
    0: ['The world stirs quietly.', 'All seems well and ordered.', 'Peace reigns, at least for now.'],
    1: ['Tension rises beneath the surface.', 'Whispers of change drift through the lands.', 'The balance begins to shift.'],
    2: ['Conflict brews in distant places.', 'Cracks appear in the foundations.', 'Unrest spreads like wildfire.'],
    3: ['War consumes the world in darkness.', 'All bonds shatter under strain.', 'The end comes ever closer.'],
    4: ['The Unmaking begins.', 'All races toward oblivion.', 'Only echoes remain.'],
  };

  const moodLines = summaries[doomStage] || summaries[0];
  const mood = moodLines[gameState.tick % moodLines.length];

  return (
    <div className="space-y-4">
      <h3
        className="font-bold uppercase tracking-wider"
        style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontFamily: 'var(--font-display)' }}
      >
        World Pulse
      </h3>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="font-mono" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>Tick</span>
          <span className="font-mono" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-primary)' }}>{gameState.tick}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="font-mono" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>Active Agents</span>
          <span className="font-mono" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-primary)' }}>{activeAgents}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="font-mono" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>Cultures</span>
          <span className="font-mono" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-primary)' }}>{cultures}</span>
        </div>
      </div>

      <div className="pt-3" style={{ borderTop: `1px solid var(--border-subtle)` }}>
        <p className="italic leading-relaxed" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
          {mood}
        </p>
      </div>
    </div>
  );
});
