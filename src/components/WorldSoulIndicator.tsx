/**
 * WorldSoulIndicator — Prose status line for the global dominant sphere.
 *
 * Reads the SphereAggregate computed each tick by phaseSphereAggregation
 * and renders a single italicised prose line in the top bar describing
 * the world's current sphere character. Sphere names are rendered as
 * Interactive Prose Keywords (IPK) with hover tooltips.
 *
 * Numbers are NEVER shown to the player. Only narrative prose.
 *
 * Design doc: Docs/plans/2026-03-28-world-soul-connection-design.md
 */

import type { SphereAggregate } from '../types/worldSoul';
import { WORLD_SOUL_PROSE, type WorldSoulIntensity } from '../data/worldSoulProse';
import { renderProseWithIPK } from './ProseKeyword';

// ─── Intensity thresholds (NFP #1: Tunability) ────────────────────────────────

const INTENSITY_WHISPER_MAX = 2;
const INTENSITY_MURMUR_MAX = 4;
const INTENSITY_PULSE_MAX = 6;

// ─── Helper ────────────────────────────────────────────────────────────────────

function getIntensity(avgScore: number): WorldSoulIntensity {
  if (avgScore < INTENSITY_WHISPER_MAX) return 'whisper';
  if (avgScore < INTENSITY_MURMUR_MAX) return 'murmur';
  if (avgScore < INTENSITY_PULSE_MAX) return 'pulse';
  return 'storm';
}

// ─── Component ────────────────────────────────────────────────────────────────

interface WorldSoulIndicatorProps {
  /** Global sphere aggregate from state.worldSoul.aggregate */
  aggregate?: SphereAggregate;
}

export function WorldSoulIndicator({ aggregate }: WorldSoulIndicatorProps) {
  if (!aggregate || !aggregate.dominantSphere) return null;

  const dominant = aggregate.dominantSphere;
  const avgScore =
    aggregate.entityCount > 0
      ? aggregate.totalBySphere[dominant] / aggregate.entityCount
      : 0;
  const intensity = getIntensity(avgScore);

  const proseEntry = WORLD_SOUL_PROSE[dominant];
  if (!proseEntry) return null;

  const proseTemplate = proseEntry[intensity];

  return (
    <div
      data-testid="world-soul-indicator"
      className="topbar-compact-hide"
      style={{
        fontFamily: 'var(--font-prose, serif)',
        fontSize: 'var(--text-xs)',
        color: 'var(--text-secondary, #a09880)',
        fontStyle: 'italic',
        lineHeight: 1.4,
        maxWidth: '320px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}
      title={proseTemplate.replace(/\*\*/g, '')}
    >
      {renderProseWithIPK(proseTemplate)}
    </div>
  );
}
