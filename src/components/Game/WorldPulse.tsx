import React from 'react';
import type { GameState } from '../../types/gameState';
import { IconButton } from '../shared/IconButton';
import { Tooltip } from '../shared/Tooltip';
import { SPEED_STEPS } from './SimulationControls';

const SEASON_ICONS: Record<string, string> = {
  spring: '∿', summer: '☼', autumn: '◇', winter: '❋',
};

interface WorldPulseProps {
  gameState: GameState;
  season: string;
  year: number;
  speed: number;
  onSpeedChange: (speed: number) => void;
}

/**
 * WorldPulse — a minimal summary panel shown when no agent is selected.
 * Displays tick number, active agent count, culture count, and a mood-driven summary.
 */
export const WorldPulse = React.memo(function WorldPulse({
  gameState, season, year, speed, onSpeedChange,
}: WorldPulseProps) {
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

  function speedDown() {
    const idx = SPEED_STEPS.indexOf(speed);
    const prev = SPEED_STEPS[Math.max(idx - 1, 0)];
    if (prev !== undefined && prev !== speed) onSpeedChange(prev);
  }

  function speedUp() {
    const idx = SPEED_STEPS.indexOf(speed);
    const next = SPEED_STEPS[Math.min(idx + 1, SPEED_STEPS.length - 1)];
    if (next !== undefined && next !== speed) onSpeedChange(next);
  }

  return (
    <div className="space-y-4">
      <h3
        className="font-bold uppercase tracking-wider"
        style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontFamily: 'var(--font-display)' }}
      >
        World Pulse
      </h3>

      {/* Season / year / speed */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span style={{ fontSize: '1rem', lineHeight: 1 }}>{SEASON_ICONS[season] ?? '🌍'}</span>
          <span
            className="capitalize font-semibold"
            style={{ fontSize: 'var(--text-xs)', color: 'var(--text-primary)' }}
          >
            {season}
          </span>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
            Yr {year}
          </span>
        </div>
        <Tooltip id="ui.sim_speed">
          <div className="flex items-center gap-1">
            <IconButton
              icon={<span>◀</span>}
              size="sm"
              onClick={speedDown}
              disabled={speed === SPEED_STEPS[0]}
              aria-label="Decrease speed"
            />
            <span
              className="font-mono text-center"
              style={{
                fontSize: 'var(--text-xs)',
                color: speed > 1 ? 'var(--accent-gold)' : 'var(--text-primary)',
                minWidth: '2rem',
              }}
            >
              {speed}×
            </span>
            <IconButton
              icon={<span>▶</span>}
              size="sm"
              onClick={speedUp}
              disabled={speed === SPEED_STEPS[SPEED_STEPS.length - 1]}
              aria-label="Increase speed"
            />
          </div>
        </Tooltip>
      </div>

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
