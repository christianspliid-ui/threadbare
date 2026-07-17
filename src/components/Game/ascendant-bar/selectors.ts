/**
 * Ascendant Bar selectors — pure functions from GameState to view models.
 *
 * All selectors are pure; callers memoize on gameState.worldVersion.
 * No side effects, no React hooks.
 *
 * THR-184: Ascendant Bar
 */

import type { GameState } from '../../../types/gameState';
import type { AscendantArchetype } from '../../../types/influence';
import type { SphereName } from '../../../types';
import { SPHERE_NAMES } from '../../../types';
import {
  getQuintessenceRatio,
  getQuintessenceBand,
  type QuintessenceBand,
} from '../../../types/quintessence';
import { getOriginPortraitUrl } from '../../../data/avatar-portrait-assets';
import { UNIFIED_ACTION_TEMPLATES } from '../../../data/unified-action-templates';
import { REACH_COPY } from '../../../data/ascendant-bar-content';
import { getAscendantProgress } from '../../../engine/phaseAscendantProgression';
import { getNarrativeLabel } from '../../../engine/domainCapability';
import { classifyTrayTier, type AscendantTrayTier } from '../../../engine/ascendantTray';
import { isActionRevealed } from '../../../engine/actionUnlock';
import type { UnifiedActionTemplate } from '../../../types/unifiedAction';

// ─── Identity view ───────────────────────────────────────────────────────────

export interface AscendantIdentityView {
  divineName: string;
  mortalName: string;
  archetypeTitle: string;
  epithet: string | null;
  portraitSrc: string | null;
  primarySphere: SphereName;
  secondarySphere: SphereName;
}

export function selectAscendantIdentityView(
  gameState: GameState,
  archetype: AscendantArchetype,
  avatarName: string,
): AscendantIdentityView {
  const identity = gameState.ascendantIdentity;
  const primary = archetype.sphereAlignment.primary;
  const secondary = archetype.sphereAlignment.secondary;

  const portraitSrc = identity?.originFragmentId
    ? getOriginPortraitUrl(identity.originFragmentId)
    : null;

  return {
    divineName: identity?.divineName ?? avatarName,
    mortalName: identity?.mortalName ?? avatarName,
    archetypeTitle: archetype.title,
    epithet: identity ? `${identity.hungerName}` : null,
    portraitSrc,
    primarySphere: primary,
    secondarySphere: secondary,
  };
}

// ─── Quintessence view ────────────────────────────────────────────────────────

export interface QuintessenceView {
  ratio: number;
  band: QuintessenceBand;
  lexiconWord: string;
}

export function selectQuintessenceView(
  gameState: GameState,
): QuintessenceView {
  const ascendantNode = gameState.graph.getNode(gameState.ascendantId);

  if (!ascendantNode) {
    return { ratio: 1.0, band: 'healthy', lexiconWord: 'Absolute' };
  }

  const ratio = getQuintessenceRatio(ascendantNode);
  const band = getQuintessenceBand(ascendantNode);

  // Map ratio to lexicon word (same logic as quintessenceToWord)
  const idx = Math.min(9, Math.floor(Math.max(0, Math.min(1, ratio)) * 10));
  const LEXICON = [
    'Fraying', 'Flickering', 'Tenuous', 'Steady', 'Rooted',
    'Resonant', 'Crystalline', 'Radiant', 'Transcendent', 'Absolute',
  ] as const;

  return { ratio, band, lexiconWord: LEXICON[idx] };
}

// ─── Essence rows ─────────────────────────────────────────────────────────────

export interface EssenceRowView {
  sphere: SphereName;
  level: number;
  trend: 'rising' | 'steady' | 'ebbing';
  isPrimary: boolean;
  isSecondary: boolean;
}

export function selectEssenceRows(
  gameState: GameState,
  archetype: AscendantArchetype,
): EssenceRowView[] {
  const pool = gameState.essencePool;
  const primary = archetype.sphereAlignment.primary;
  const secondary = archetype.sphereAlignment.secondary;

  return SPHERE_NAMES
    .filter((sphere) => {
      const val = pool[sphere] ?? 0;
      return val > 0 || sphere === primary || sphere === secondary;
    })
    .map((sphere) => {
      const level = pool[sphere] ?? 0;
      return {
        sphere,
        level,
        trend: 'steady' as const,    // income delta not yet surfaced in EssencePool; placeholder
        isPrimary: sphere === primary,
        isSecondary: sphere === secondary,
      };
    })
    .sort((a, b) => {
      if (a.isPrimary) return -1;
      if (b.isPrimary) return 1;
      if (a.isSecondary) return -1;
      if (b.isSecondary) return 1;
      return b.level - a.level;
    });
}

// ─── Action tray ─────────────────────────────────────────────────────────────

export interface ActionTrayItem {
  template: UnifiedActionTemplate;
  tier: AscendantTrayTier;
  spent: boolean;
  gated: boolean;
}

export interface ActionTrayView {
  core: ActionTrayItem[];
  self: ActionTrayItem[];
  rare: ActionTrayItem[];
  isEmpty: boolean;
}

export function selectActionTray(
  gameState: GameState,
): ActionTrayView {
  const ascendantId = gameState.ascendantId;

  // Filter templates for ascendant-specific innate actions
  const innateTemplates = UNIFIED_ACTION_TEMPLATES.filter(
    (t) =>
      (t.actorAffinities?.length ?? 0) > 0 &&
      t.actorAffinities!.every((a) => a === 'ascendant'),
  );

  // Spent actions: already queued in unifiedActions
  const spentTemplateIds = new Set(
    (gameState.unifiedActions ?? [])
      .filter((a) => a.actorId === ascendantId)
      .map((a) => a.templateId),
  );

  const ctx = { ascendantId, targetNodeId: ascendantId };

  const items: ActionTrayItem[] = innateTemplates.map((template) => ({
    template,
    tier: classifyTrayTier(template, ctx),
    spent: spentTemplateIds.has(template.id),
    gated: false,
  }));

  // THR-501: gate the Self and Rare tiers behind the run's unlock set so the turn-1
  // floor is Core only (Move + Investiture, hardcoded on the bar). The innate self-actions
  // (Meditate, Withdraw, Concentrate, Manifest, …) arrive as earned capabilities via
  // Ascendant Beats — `unlock_action` pushes their ids into `unlockedActionIds`. Core stays
  // always-on. Locked tiers are filtered out entirely (hidden, consistent with the unlock
  // gate on every other action surface), not shown dimmed.
  const core = items.filter((i) => i.tier === 'core');
  const self = items.filter(
    (i) => i.tier === 'self' && isActionRevealed(i.template, gameState.unlockedActionIds),
  );
  const rare = items.filter(
    (i) => i.tier === 'rare' && isActionRevealed(i.template, gameState.unlockedActionIds),
  );

  return { core, self, rare, isEmpty: items.length === 0 };
}

// ─── Mandate row ──────────────────────────────────────────────────────────────

export interface MandateRowView {
  name: string;
  flavorLine: string;
  progress: number;           // 0–1
  stage: string;
  trend: 'rising' | 'steady' | 'ebbing';
}

export function selectMandateRow(gameState: GameState): MandateRowView | null {
  const { mandateDefinition: def, mandateState: state } = gameState;
  if (!def || !state) return null;

  const currentStageIdx = ['setup', 'escalation', 'culmination'].indexOf(state.currentStage);
  const progress = state.progress ?? 0;

  const trend: 'rising' | 'steady' | 'ebbing' =
    (state.primaryDelta ?? 0) > 0.02 ? 'rising'
    : (state.primaryDelta ?? 0) < -0.02 ? 'ebbing'
    : 'steady';

  const STAGE_LABELS = ['I', 'II', 'III'] as const;

  return {
    name: def.name,
    flavorLine: def.stages[currentStageIdx]?.description ?? def.description,
    progress,
    stage: STAGE_LABELS[currentStageIdx] ?? 'I',
    trend,
  };
}

// ─── Reaches — the two permanent domains + current depth (THR-613 §5.D) ───────

export interface ReachRowView {
  reach: string;
  /** Authored display name, e.g. "Iron". */
  label: string;
  /** Tooltip body — what this reach is. */
  body: string;
  /** Prose tier word from NARRATIVE_LEXICON, e.g. "Tempered". Never a number. */
  tierWord: string;
  rank: 'primary' | 'secondary';
  /** A Deepening beat is queued for this reach — the tier-up is waiting to be entered. */
  pendingDeepening: boolean;
}

/**
 * The ascendant's two permanent reaches and how deep the god currently runs in each.
 *
 * Reads the engine's `getAscendantProgress` rather than recomputing capability here, so
 * the bar shows the same tier the Deepening beat fires on — one source of truth (the
 * tier the player reads and the tier the beat trips on cannot drift apart).
 *
 * Fail-soft (NFP #4): returns [] when there is no ascendant or the progression state is
 * unreadable; the caller renders `REACH_EMPTY_COPY` rather than throwing.
 */
export function selectReachRows(gameState: GameState): ReachRowView[] {
  const progress = getAscendantProgress(gameState);
  if (!progress) return [];
  return progress.reaches.map((r) => {
    const copy = REACH_COPY[r.reach];
    // Fail-soft (NFP #4): if capability/tier come back non-finite (e.g. a malformed
    // trait edge upstream), fall back to the lowest tier word rather than rendering
    // "NaN" or an empty slot. Defence in depth alongside the computeRawScore guard.
    const safeTier = Number.isFinite(r.tier) ? r.tier : 1;
    return {
      reach: r.reach,
      label: copy?.label ?? r.reach,
      body: copy?.body ?? '',
      tierWord: getNarrativeLabel(r.reach, safeTier),
      rank: r.isPrimary ? 'primary' : 'secondary',
      pendingDeepening: r.pendingDeepening,
    };
  });
}
