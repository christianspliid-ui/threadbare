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
import type { SignaturePathState } from '../../../data/ascendant-bar-content';
import { REACH_SIGNATURE_CONTENT_TEMPLATES } from '../../../data/reach-signature-content';
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

// ─── Reach-signature paths — the three-state legibility surface (THR-613 §5.B) ─

export interface SignaturePathView {
  reach: string;
  /** Authored reach display name, e.g. "Iron". */
  reachLabel: string;
  /** The signature's display name, e.g. "Warhost". */
  name: string;
  /** The signature's spell/title name, e.g. "The Call to Arms". Null if unauthored. */
  spellName: string | null;
  state: SignaturePathState;
  /** True for the god's primary reach (rank 0 in the domain ordering). */
  isPrimary: boolean;
}

/**
 * The eight reach signatures partitioned into the three legible states (plan §5.B):
 * available / acquirable (both in the god's permanent domains) and
 * locked-this-incarnation (a signature of a reach the god did not take).
 *
 * The god's domains come from `getAscendantProgress` — the same read the Reaches
 * readout and the Deepening beat use, so the three surfaces cannot drift on what
 * counts as "your reach". Earned-ness comes from `unlockedActionIds` (a signature
 * is granted by its reach's acquisition beat → its id lands in the unlock set).
 *
 * Ordering: your paths first (primary reach first, then secondary), then the
 * not-this-incarnation paths alphabetically by reach label — a stable, deterministic
 * layout independent of the template declaration order.
 *
 * Pure; memoize on worldVersion. Fail-soft (NFP #4): returns [] when there is no
 * ascendant / progression is unreadable, so the caller renders SIGNATURE_EMPTY_COPY
 * rather than throwing.
 */
export function selectSignaturePaths(gameState: GameState): SignaturePathView[] {
  const progress = getAscendantProgress(gameState);
  if (!progress) return [];

  // reach → rank within the god's domains (0 = primary). Absent ⇒ not a domain.
  const domainRank = new Map<string, number>();
  progress.reaches.forEach((r, i) => domainRank.set(r.reach, i));
  const unlocked = new Set(gameState.unlockedActionIds ?? []);

  const views: SignaturePathView[] = REACH_SIGNATURE_CONTENT_TEMPLATES.map((tmpl) => {
    const reach = tmpl.reach as string;
    const rank = domainRank.get(reach);
    const inDomain = rank !== undefined;
    const state: SignaturePathState = !inDomain
      ? 'locked_incarnation'
      : unlocked.has(tmpl.id)
        ? 'available'
        : 'acquirable';
    return {
      reach,
      reachLabel: REACH_COPY[reach]?.label ?? reach,
      name: tmpl.name,
      spellName: tmpl.spellName ?? null,
      state,
      isPrimary: rank === 0,
    };
  });

  return views.sort((a, b) => {
    const aYours = a.state !== 'locked_incarnation';
    const bYours = b.state !== 'locked_incarnation';
    if (aYours !== bYours) return aYours ? -1 : 1;
    if (aYours) {
      // Both yours: preserve domain rank (primary first).
      return (domainRank.get(a.reach) ?? 0) - (domainRank.get(b.reach) ?? 0);
    }
    // Both locked: alphabetical by reach label for a stable layout.
    return a.reachLabel.localeCompare(b.reachLabel);
  });
}
