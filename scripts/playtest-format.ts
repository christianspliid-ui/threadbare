/**
 * Playtest Report Formatter
 *
 * Pure formatting functions (string in → string out, no side effects) that produce
 * a three-section markdown playtest report: dashboard, narrative log, and trace deep-dive.
 */

import type { TickEvent, ChronicleEntry } from '../src/types/gameState';
import type { TraceEntry } from '../src/types/trace';

// ─── Types ────────────────────────────────────────────────────

/** A snapshot of game state at a specific tick, for dashboard aggregation */
export interface Snapshot {
  tick: number;
  doomStage: number;
  agentCount: number;
  essenceTotal: number;
  mandateProgress: number;
  reputationStats: { min: number; median: number; max: number };
  cultureCount: number;
}

/** Complete playtest report data for formatting */
export interface PlaytestReportData {
  seed: number;
  totalTicks: number;
  snapshots: Snapshot[];
  allEvents: TickEvent[];
  chronicleEntries: ChronicleEntry[];
  traces: TraceEntry[];
}

// ─── Formatters ──────────────────────────────────────────────

/**
 * Format the dashboard section: seed, tick count, and snapshot table.
 *
 * @param seed Game seed
 * @param totalTicks Total ticks simulated
 * @param snapshots Array of state snapshots
 * @returns Markdown string
 */
export function formatDashboard(
  seed: number,
  totalTicks: number,
  snapshots: Snapshot[]
): string {
  const lines: string[] = [];

  lines.push(`## 1. Dashboard`);
  lines.push('');
  lines.push(`**Seed:** \`${seed}\``);
  lines.push(`**Total Ticks:** ${totalTicks}`);
  lines.push('');

  if (snapshots.length === 0) {
    lines.push('*No snapshots recorded.*');
    return lines.join('\n');
  }

  // Table header
  lines.push('| Tick | Doom | Agents | Essence | Mandate | Rep (min/med/max) | Cultures |');
  lines.push('|------|------|--------|---------|---------|-------------------|----------|');

  // Table rows
  for (const snap of snapshots) {
    const repStr = `${snap.reputationStats.min.toFixed(1)}/${snap.reputationStats.median.toFixed(1)}/${snap.reputationStats.max.toFixed(1)}`;
    lines.push(
      `| ${snap.tick} | ${snap.doomStage} | ${snap.agentCount} | ${snap.essenceTotal.toFixed(1)} | ${snap.mandateProgress.toFixed(1)} | ${repStr} | ${snap.cultureCount} |`
    );
  }

  return lines.join('\n');
}

/**
 * Format the narrative log section: grouped events with significance scores.
 *
 * @param events Tick events to display
 * @param groupSize Events per tick-range group (e.g., 10 = "Ticks 1-10")
 * @param minSignificance Minimum significance to include (default 0.3)
 * @param chronicleEntries Optional chronicle entries to append at the end
 * @returns Markdown string
 */
export function formatNarrativeLog(
  events: TickEvent[],
  groupSize: number,
  minSignificance: number = 0.3,
  chronicleEntries: ChronicleEntry[] = []
): string {
  const lines: string[] = [];

  lines.push(`## 2. Narrative Log`);
  lines.push('');

  if (events.length === 0 && chronicleEntries.length === 0) {
    lines.push('*No events recorded.*');
    return lines.join('\n');
  }

  // Filter by significance
  const filtered = events.filter((e) => e.significance >= minSignificance);

  if (filtered.length === 0 && chronicleEntries.length === 0) {
    lines.push(`*No events with significance >= ${minSignificance}.*`);
    return lines.join('\n');
  }

  // Group events by tick range
  if (filtered.length > 0) {
    const sorted = [...filtered].sort((a, b) => a.tick - b.tick);
    const groups = new Map<number, TickEvent[]>();

    for (const event of sorted) {
      const groupKey = Math.floor((event.tick - 1) / groupSize) * groupSize + 1;
      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey)!.push(event);
    }

    // Output groups in order
    const sortedKeys = Array.from(groups.keys()).sort((a, b) => a - b);
    for (const start of sortedKeys) {
      const end = start + groupSize - 1;
      lines.push(`### Ticks ${start}–${end}`);
      lines.push('');

      const groupEvents = groups.get(start) || [];
      for (const event of groupEvents) {
        const sig = event.significance.toFixed(2);
        lines.push(`- [${sig}] ${event.message}`);
      }
      lines.push('');
    }
  }

  // Append chronicle entries
  if (chronicleEntries.length > 0) {
    lines.push(`### Chronicle Entries`);
    lines.push('');
    for (const entry of chronicleEntries) {
      lines.push(`#### ${entry.title}`);
      lines.push('');
      lines.push(`*Tick ${entry.tick}*`);
      lines.push('');
      lines.push(entry.prose);
      lines.push('');
    }
  }

  return lines.join('\n');
}

/**
 * Format the trace deep-dive section: organized by category with detailed summaries.
 *
 * @param traces Array of trace entries
 * @returns Markdown string
 */
export function formatTraceDeepDive(traces: TraceEntry[]): string {
  const lines: string[] = [];

  lines.push(`## 3. Trace Deep-Dive`);
  lines.push('');

  if (traces.length === 0) {
    lines.push('*No traces recorded.*');
    return lines.join('\n');
  }

  // Group traces by category
  const groups: Record<string, TraceEntry[]> = {};
  for (const trace of traces) {
    if (!groups[trace.category]) {
      groups[trace.category] = [];
    }
    groups[trace.category].push(trace);
  }

  // Process each category in defined order
  const categoryOrder = [
    'action_selection',
    'narrative_generation',
    'context_harvest',
    'dilemma_resolution',
    'tick_summary',
  ];

  for (const category of categoryOrder) {
    if (!groups[category] || groups[category].length === 0) continue;

    lines.push(`### ${formatCategoryName(category)}`);
    lines.push('');

    for (const trace of groups[category]) {
      switch (trace.category) {
        case 'action_selection': {
          const t = trace as any; // ActionSelectionTrace
          const agentLabel = t.agentId ? ` (Agent: ${t.agentId})` : '';
          lines.push(`**Tick ${t.tick}${agentLabel}**`);
          lines.push(`- Final Pick: ${t.finalPick.actionName}`);
          lines.push(`- Score: ${t.finalPick.score.toFixed(2)} | Probability: ${(t.finalPick.probability * 100).toFixed(1)}%`);
          if (t.finalPick.targetName) {
            lines.push(`- Target: ${t.finalPick.targetName}`);
          }
          break;
        }

        case 'narrative_generation': {
          const t = trace as any; // NarrativeGenerationTrace
          const agentLabel = t.agentId ? ` (Agent: ${t.agentId})` : '';
          lines.push(`**Tick ${t.tick}${agentLabel}** (${t.tier})`);
          const prosePreview = t.finalProse.substring(0, 200).replace(/\n/g, ' ');
          lines.push(`- ${prosePreview}${t.finalProse.length > 200 ? '...' : ''}`);
          break;
        }

        case 'context_harvest': {
          const t = trace as any; // ContextHarvestTrace
          const agentLabel = t.agentId ? ` (Agent: ${t.agentId})` : '';
          lines.push(`**Tick ${t.tick}${agentLabel}**`);
          lines.push(`- Harvested: ${t.harvestedCount} objects | Opposition Tension: ${t.oppositionTension.toFixed(2)}`);
          if (t.rankedTop.length > 0) {
            lines.push(`- Top Ranked:`);
            for (const item of t.rankedTop.slice(0, 3)) {
              lines.push(`  - ${item.name} (score: ${item.score.toFixed(2)})`);
            }
          }
          break;
        }

        case 'dilemma_resolution': {
          const t = trace as any; // DilemmaResolutionTrace
          lines.push(`**Tick ${t.tick}** (Agent vs ${t.targetId})`);
          lines.push(`- Actor: ${t.actorMove} | Target: ${t.targetMove}`);
          lines.push(`- Outcome: ${t.outcome}`);
          lines.push(`- Stakes: ${t.stakes.toFixed(2)} | Sentiment: ${t.sentimentDelta.toFixed(2)}`);
          break;
        }

        case 'tick_summary': {
          const t = trace as any; // TickSummaryTrace
          lines.push(`**Tick ${t.tick}**`);
          lines.push(`- Agents Processed: ${t.agentsProcessed} | Doom Stage: ${t.doomStage}`);
          lines.push(`- Essence: ${t.essenceTotal.toFixed(1)} | Mandate: ${t.mandateProgress.toFixed(1)}`);
          const phaseStr = Object.entries(t.phaseEventCounts)
            .map(([k, v]) => `${k}: ${v}`)
            .join(', ');
          if (phaseStr) {
            lines.push(`- Events: ${phaseStr}`);
          }
          break;
        }
      }
      lines.push('');
    }
  }

  return lines.join('\n');
}

/**
 * Format a complete playtest report with all three sections.
 *
 * @param data PlaytestReportData
 * @returns Markdown string
 */
export function formatFullReport(data: PlaytestReportData): string {
  const lines: string[] = [];

  const timestamp = new Date().toISOString().split('T')[0];
  lines.push(`# Playtest Report — Seed ${data.seed}`);
  lines.push('');
  lines.push(`*Generated: ${timestamp}*`);
  lines.push('');

  // Dashboard
  lines.push(formatDashboard(data.seed, data.totalTicks, data.snapshots));
  lines.push('');

  // Narrative Log
  lines.push(
    formatNarrativeLog(data.allEvents, 10, 0.3, data.chronicleEntries)
  );
  lines.push('');

  // Trace Deep-Dive
  lines.push(formatTraceDeepDive(data.traces));

  return lines.join('\n');
}

// ─── Helpers ──────────────────────────────────────────────────

/**
 * Convert a trace category to a human-readable heading.
 */
function formatCategoryName(category: string): string {
  const map: Record<string, string> = {
    action_selection: 'Action Selection',
    narrative_generation: 'Narrative Generation',
    context_harvest: 'Context Harvest',
    dilemma_resolution: 'Dilemma Resolution',
    tick_summary: 'Tick Summary',
  };
  return map[category] || category;
}
