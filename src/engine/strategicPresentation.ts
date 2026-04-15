// src/engine/strategicPresentation.ts
//
// Pure selector functions and presentation constants for the strategic action UI.
// All data derived from StrategicRuntimeState — no engine mutations here.
//
// NFP #1 (Tunability): Every visual threshold and display count is a named constant.
// NFP #2 (Inspectability): Selectors expose structured AgentStrategicSummary for Threads,
//   HexStrategicOverlay for the hex map, and StrategicHistoryDisplayEntry for the detail panel.
// NFP #4 (Fail-soft): All selectors return graceful empty values when strategicState is undefined.
// NFP #5 (Narrative > mechanical): Progress and health communicated via prose labels, not numbers.

import type {
  BehaviorFamily,
  StrategicRuntimeState,
  StrategicVerb,
} from '../types/strategicAction';
import type { WorldGraph } from './graph';
import { getStrategicTemplate } from './strategicActionCandidates';
import { resolveLocationToHex } from './encounterAwareness';
import { getAgentLocationId } from './graphQueries';
import { hexKey } from '../lib/hexKey';

// ─── Behavior Family Presentation ─────────────────────────────────────────────

/** Visual identity for each behavior family: glyph, CSS color, human-readable label. */
export const BEHAVIOR_FAMILY_PRESENTATION: Record<
  BehaviorFamily,
  { glyph: string; color: string; label: string }
> = {
  'merchant-expansion': { glyph: '¤',  color: '#c8a84e', label: 'Merchant expansion' },
  'builder-civic':      { glyph: '⚒', color: '#8a9a7c', label: 'Civic builder'       },
  'scholar-seeker':     { glyph: '📜', color: '#5b7fa5', label: 'Scholar'             },
  'zealot-mission':     { glyph: '✦',  color: '#b85450', label: 'Zealot'              },
  'court-political':    { glyph: '⚜', color: '#8b6baa', label: 'Court politics'       },
  'underworld-network': { glyph: '🗡', color: '#6a6a72', label: 'Underworld'           },
  'warlord-expansion':  { glyph: '⚔', color: '#9a6850', label: 'Warlord'              },
  'caretaker-steward':  { glyph: '✚',  color: '#6a9a6e', label: 'Caretaker'           },
  'artist-crafter':     { glyph: '◈',  color: '#5a8aaa', label: 'Artist'              },
  'wanderer-explorer':  { glyph: '⇢',  color: '#aa8a5a', label: 'Wanderer'            },
};

/** Fallback presentation for unknown or missing behavior families. */
export const BEHAVIOR_FAMILY_FALLBACK = { glyph: '◆', color: '#8a8a8a', label: 'Unknown' };

// ─── Tunable Constants ─────────────────────────────────────────────────────────

/** Progress fraction thresholds → prose labels (NFP #5: narrative, not percentages). */
export const PROGRESS_LABEL_THRESHOLDS: ReadonlyArray<[number, string]> = [
  [0.00, 'just begun'],
  [0.25, 'underway'],
  [0.50, 'well advanced'],
  [0.75, 'nearly complete'],
];

/** Control degradation thresholds → health prose labels. */
export const HEALTH_LABEL_THRESHOLDS: ReadonlyArray<[number, string]> = [
  [0.00, 'firm'],
  [0.30, 'weakening'],
  [0.60, 'fraying'],
  [0.80, 'crumbling'],
];

/** Tick window used to count "recent completions" for the badge. */
export const STRATEGIC_HISTORY_RECENT_TICKS = 30;

/** Max history entries shown in the agent detail panel. */
export const STRATEGIC_HISTORY_DISPLAY_COUNT = 5;

/** Badge background opacity (matching existing encounter badge pattern). */
export const STRATEGIC_BADGE_BG_OPACITY = 0.08;

/** Hex marker constants for strategic project dots and control pips. */
export const STRATEGIC_PROJECT_MARKER_Z     = 0.088;  // between locations (0.080) and trails (0.085)
export const STRATEGIC_CONTROL_PIP_Z        = 0.086;
export const STRATEGIC_PROJECT_MARKER_SIZE  = 0.12;   // fraction of HEX_SIZE
export const STRATEGIC_CONTROL_PIP_SIZE     = 0.08;   // fraction of HEX_SIZE
export const STRATEGIC_PROJECT_PULSE_PERIOD = 1.5;    // seconds
export const STRATEGIC_PROJECT_PULSE_MIN    = 0.60;   // opacity range low
export const STRATEGIC_PROJECT_PULSE_MAX    = 0.90;   // opacity range high
export const STRATEGIC_CONTROL_OPACITY_FIRM      = 0.80;
export const STRATEGIC_CONTROL_OPACITY_DEGRADED  = 0.40;
export const STRATEGIC_MARKER_TEXTURE_SIZE  = 64;     // canvas px for texture build

// ─── Label Helpers ─────────────────────────────────────────────────────────────

/** Map progress fraction 0–1 to a prose label (NFP #5). */
export function getProgressLabel(fraction: number): string {
  const clamped = Math.max(0, Math.min(1, fraction));
  let label = PROGRESS_LABEL_THRESHOLDS[0][1];
  for (const [threshold, l] of PROGRESS_LABEL_THRESHOLDS) {
    if (clamped >= threshold) label = l;
  }
  return label;
}

/** Map degradation 0–1 to a health prose label (NFP #5). */
export function getHealthLabel(degradation: number): string {
  const clamped = Math.max(0, Math.min(1, degradation));
  let label = HEALTH_LABEL_THRESHOLDS[0][1];
  for (const [threshold, l] of HEALTH_LABEL_THRESHOLDS) {
    if (clamped >= threshold) label = l;
  }
  return label;
}

/** Get behavior family presentation (with fallback for unknown families). */
export function getBehaviorFamilyPresentation(
  family: BehaviorFamily | null | undefined,
): { glyph: string; color: string; label: string } {
  if (!family) return BEHAVIOR_FAMILY_FALLBACK;
  return BEHAVIOR_FAMILY_PRESENTATION[family] ?? BEHAVIOR_FAMILY_FALLBACK;
}

// ─── Data Interfaces ───────────────────────────────────────────────────────────

/** Per-agent strategic summary — used by ThreadsPanel rows and AgentInfoCard. */
export interface AgentStrategicSummary {
  agentId: string;
  /** Primary behavior family for glyph/color identification (from active project or latest history). */
  behaviorFamily: BehaviorFamily | null;
  /** Active multi-tick project, if any. */
  activeProject: {
    displayName: string;      // activityProse[0] from the template
    progressFraction: number; // 0–1
    progressLabel: string;    // prose: "just begun" | "underway" | "well advanced" | "nearly complete"
    verb: StrategicVerb;
  } | null;
  /** Number of active control stances. */
  controlCount: number;
  /** Primary (lowest-degradation) control stance, if any. */
  primaryControl: {
    displayName: string;  // template.displayName
    targetName: string;   // resolved graph node name
    healthLabel: string;  // prose: "firm" | "weakening" | "fraying" | "crumbling"
  } | null;
  /** Count of completed actions within the recent-ticks window. */
  recentCompletions: number;
}

/** A history entry ready for display in the agent detail panel. */
export interface StrategicHistoryDisplayEntry {
  displayName: string;
  outcome: 'completed' | 'failed' | 'stalled';
  ticksAgo: number;
}

/** Per-hex strategic overlay data passed to the HexMap render layer. */
export interface HexStrategicOverlay {
  hexCol: number;
  hexRow: number;
  projects: Array<{
    actorId: string;
    actorName: string;
    displayName: string;
    behaviorFamily: BehaviorFamily;
    progressFraction: number;
  }>;
  controls: Array<{
    actorId: string;
    actorName: string;
    behaviorFamily: BehaviorFamily;
    degradation: number;
  }>;
}

// ─── Selectors ─────────────────────────────────────────────────────────────────

/**
 * Derive a strategic summary for a single agent.
 * Returns null if the agent has no strategic activity at all.
 * Fail-soft: undefined strategicState → null.
 */
export function getAgentStrategicSummary(
  strategicState: StrategicRuntimeState | undefined,
  agentId: string,
  graph: WorldGraph,
  currentTick: number,
): AgentStrategicSummary | null {
  if (!strategicState) return null;

  const activeProject = strategicState.projects.find(
    p => p.actorId === agentId && p.status === 'active',
  );
  const activeControls = strategicState.controls.filter(
    c => c.actorId === agentId && c.active,
  );
  const agentHistory = strategicState.history.filter(h => h.actorId === agentId);

  // No strategic activity at all — skip badge entirely
  if (!activeProject && activeControls.length === 0 && agentHistory.length === 0) {
    return null;
  }

  // ── Active project ──────────────────────────────────────────────────────────
  let projectInfo: AgentStrategicSummary['activeProject'] = null;
  if (activeProject) {
    const template = getStrategicTemplate(activeProject.templateId);
    const progressFraction =
      activeProject.progressRequired > 0
        ? Math.min(1, activeProject.progress / activeProject.progressRequired)
        : 1;
    const displayName =
      (template?.activityProse?.length ?? 0) > 0
        ? template!.activityProse[0]
        : (template?.displayName ?? activeProject.templateId);

    projectInfo = {
      displayName,
      progressFraction,
      progressLabel: getProgressLabel(progressFraction),
      verb: activeProject.verb,
    };
  }

  // ── Primary control ─────────────────────────────────────────────────────────
  let primaryControlInfo: AgentStrategicSummary['primaryControl'] = null;
  if (activeControls.length > 0) {
    // Pick healthiest (lowest degradation) as primary
    const primary = activeControls.reduce((best, c) =>
      c.degradation < best.degradation ? c : best,
    );
    const targetNode = graph.getNode(primary.targetNodeId);
    const template = getStrategicTemplate(primary.templateId);

    primaryControlInfo = {
      displayName: template?.displayName ?? primary.templateId,
      targetName: targetNode?.name ?? '(unknown location)',
      healthLabel: getHealthLabel(primary.degradation),
    };
  }

  // ── Behavior family ─────────────────────────────────────────────────────────
  let behaviorFamily: BehaviorFamily | null = null;
  if (activeProject) {
    behaviorFamily = activeProject.behaviorFamily;
  } else if (activeControls.length > 0) {
    behaviorFamily = activeControls[0].behaviorFamily;
  } else if (agentHistory.length > 0) {
    behaviorFamily = agentHistory.sort((a, b) => b.tick - a.tick)[0].behaviorFamily;
  }

  // ── Recent completions ──────────────────────────────────────────────────────
  const recentCompletions = agentHistory.filter(
    h => h.outcome === 'completed' && currentTick - h.tick <= STRATEGIC_HISTORY_RECENT_TICKS,
  ).length;

  return {
    agentId,
    behaviorFamily,
    activeProject: projectInfo,
    controlCount: activeControls.length,
    primaryControl: primaryControlInfo,
    recentCompletions,
  };
}

/**
 * Return recent strategic history for the agent detail panel.
 * Fail-soft: undefined strategicState → empty array.
 */
export function getAgentStrategicHistory(
  strategicState: StrategicRuntimeState | undefined,
  agentId: string,
  currentTick: number,
): StrategicHistoryDisplayEntry[] {
  if (!strategicState) return [];

  return strategicState.history
    .filter(h => h.actorId === agentId)
    .sort((a, b) => b.tick - a.tick)
    .slice(0, STRATEGIC_HISTORY_DISPLAY_COUNT)
    .map(h => ({
      displayName: h.displayName,
      outcome: h.outcome,
      ticksAgo: currentTick - h.tick,
    }));
}

/**
 * Build a map of hex-key → HexStrategicOverlay for the hex map render layer.
 * Each hex that has active projects or control stances gets an overlay entry.
 * Fail-soft: undefined strategicState → empty map.
 */
export function getHexStrategicOverlays(
  strategicState: StrategicRuntimeState | undefined,
  graph: WorldGraph,
): Map<string, HexStrategicOverlay> {
  const result = new Map<string, HexStrategicOverlay>();
  if (!strategicState) return result;

  function getOrCreate(col: number, row: number): HexStrategicOverlay {
    const key = hexKey(col, row);
    let overlay = result.get(key);
    if (!overlay) {
      overlay = { hexCol: col, hexRow: row, projects: [], controls: [] };
      result.set(key, overlay);
    }
    return overlay;
  }

  // ── Active projects ─────────────────────────────────────────────────────────
  for (const project of strategicState.projects) {
    if (project.status !== 'active') continue;

    let hexCol: number | null = null;
    let hexRow: number | null = null;

    if (project.targetHex) {
      hexCol = project.targetHex.col;
      hexRow = project.targetHex.row;
    } else if (project.targetNodeId) {
      const hex = resolveLocationToHex(graph, project.targetNodeId);
      if (hex) { hexCol = hex.col; hexRow = hex.row; }
    } else {
      // Self-targeting: resolve via actor's current location
      const locId = getAgentLocationId(graph, project.actorId);
      if (locId) {
        const hex = resolveLocationToHex(graph, locId);
        if (hex) { hexCol = hex.col; hexRow = hex.row; }
      }
    }

    if (hexCol === null || hexRow === null) continue;

    const actorNode = graph.getNode(project.actorId);
    const template = getStrategicTemplate(project.templateId);
    const progressFraction =
      project.progressRequired > 0
        ? Math.min(1, project.progress / project.progressRequired)
        : 1;

    getOrCreate(hexCol, hexRow).projects.push({
      actorId: project.actorId,
      actorName: actorNode?.name ?? project.actorId,
      displayName: template?.displayName ?? project.templateId,
      behaviorFamily: project.behaviorFamily,
      progressFraction,
    });
  }

  // ── Active control stances ──────────────────────────────────────────────────
  for (const control of strategicState.controls) {
    if (!control.active) continue;

    const hex = resolveLocationToHex(graph, control.targetNodeId);
    if (!hex) continue;

    const actorNode = graph.getNode(control.actorId);

    getOrCreate(hex.col, hex.row).controls.push({
      actorId: control.actorId,
      actorName: actorNode?.name ?? control.actorId,
      behaviorFamily: control.behaviorFamily,
      degradation: control.degradation,
    });
  }

  return result;
}
