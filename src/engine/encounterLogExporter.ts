/**
 * Encounter Log Exporter
 *
 * Pure function: takes a timeline + metadata, returns a TSV string.
 * No side effects — the UI triggers the download via Blob + <a download>.
 */

import type { TimelineEvent } from './encounterTimeline';

// ─── Types ──────────────────────────────────────────────────────

export interface ExportOptions {
  agentId: string;
  agentName: string;
  seed: string;
  tickRange: [number, number]; // first and last tick in timeline
}

// ─── Formatter ──────────────────────────────────────────────────

function formatHex(hex: [number, number]): string {
  return `(${hex[0]},${hex[1]})`;
}

function formatDetail(event: TimelineEvent): string {
  switch (event.phase) {
    case 'DECIDE':
      return `target=${event.targetLocation} | encounter=${event.targetEncounter} | score=${event.score.toFixed(2)} | hex=${formatHex(event.targetHex)} | travelCost=${event.travelCost} | prob=${event.completionProb.toFixed(2)}`;
    case 'IDLE':
      return `reason=${event.reason} | action=${event.idleAction}${event.driftTarget ? ` | driftTarget=${event.driftTarget}` : ''}`;
    case 'MOVE':
      return `${formatHex(event.fromHex)}→${formatHex(event.toHex)} | cost=${event.cost}${event.road ? ` | road=${event.road}` : ''}`;
    case 'ARRIVE':
      return `${event.location} | hex=${formatHex(event.hex)}`;
    case 'ENCOUNTER_START':
      return `${event.encounter} | steps=${event.steps} | threat=${event.threat.toFixed(1)} | reach=${event.reach}`;
    case 'ENCOUNTER_STEP':
      return `step=${event.step} | reach=${event.reach} | diff=${event.diff} | cap=${event.cap} | prob=${event.prob.toFixed(2)} | roll=${event.roll.toFixed(2)} | ${event.result}`;
    case 'ENCOUNTER_END':
      return `${event.encounter} | status=${event.status}${event.reward ? ` | reward=${event.reward}` : ''}`;
    case 'REROUTE':
      return `old=${event.oldTarget} | new=${event.newTarget} | reason=${event.reason}`;
  }
}

/** Formats the agent's timeline into a TSV string ready for download. */
export function formatEncounterLog(
  timeline: readonly TimelineEvent[],
  options: ExportOptions,
): string {
  const lines: string[] = [];

  // Header
  lines.push(`# ENCOUNTER LOG`);
  lines.push(`# Seed: ${options.seed}`);
  lines.push(`# Agent: ${options.agentName} (${options.agentId})`);
  lines.push(`# Exported: ${new Date().toISOString()}`);
  if (timeline.length > 0) {
    lines.push(`# Ticks: ${options.tickRange[0]}–${options.tickRange[1]}`);
  }

  if (timeline.length === 0) {
    lines.push(`# (no events recorded)`);
    return lines.join('\n');
  }

  // Column headers
  lines.push(`TICK\tPHASE\tDETAIL`);

  // Data rows
  for (const event of timeline) {
    lines.push(`${event.tick}\t${event.phase}\t${formatDetail(event)}`);
  }

  return lines.join('\n');
}

/** Generates the filename for the encounter log. */
export function makeFilename(seed: string, agentName: string): string {
  const safeName = agentName.replace(/[^a-zA-Z0-9_-]/g, '_');
  return `encounter-log_${seed}_${safeName}.tsv`;
}
