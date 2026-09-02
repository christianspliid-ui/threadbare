import { useState, useEffect, useCallback, useMemo, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { EntityVisual } from '../shared/EntityVisual';
import { FollowToggle, type FollowDescriptor } from './FollowToggle';
import { Tooltip } from '../shared/Tooltip';
import { DeltaCluster } from '../shared/DeltaCluster';
import { ReachIcon, REACH_TO_SPHERE } from '../icons';
import {
  CONSEQUENCE_CATEGORY_GLYPHS,
  CONSEQUENCE_CATEGORY_LABELS,
  CONSEQUENCE_CATEGORY_ORDER,
  CONSEQUENCE_CATEGORY_TOOLTIP_IDS,
  CONSEQUENCE_LEGEND_STORE_KEY,
} from './encounter-stage/adapters/buildAftermathConsequences';
import type {
  EncounterStageModel,
  EncounterStageChoiceModel,
  EncounterStageNudgePhaseModel,
  EncounterStageResolutionCheckModel,
  EncounterStageHeaderModel,
  EncounterStageHistoryModel,
  EncounterStageCastModel,
  EncounterStageConsequenceCategory,
  EncounterStageFalloutModel,
} from './encounter-stage/types';
import type { ReachDomain } from '../../types/traits';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { NarrativeSegments } from './encounter-stage/NarrativeSegments';
import {
  isNudgeDesignerViewEnabled,
  subscribeNudgeDesignerView,
} from './encounter-stage/designerView';
import { NudgePhaseShell } from './encounter-stage/shells/NudgePhaseShell';
import { NudgeMotiveIntro } from './encounter-stage/shells/NudgeMotiveIntro';
import { ProseTtsButton } from './Encounter/ProseTtsButton';
import { formatEssence, formatEssencePool } from '../shared/formatEssence';
import { CostPips } from '../shared/OddsPips';
import { NUDGE_COMMIT_LABEL } from '../../data/nudge-stage-content';
import { getDurationWord } from '../../data/domain-words';

// ── Thread tier types ──────────────────────────────────────────────
type ThreadTier = 'strong' | 'light' | 'watched';

// ── Props ──────────────────────────────────────────────────────────
export interface EncounterVeilProps {
  open: boolean;
  model: EncounterStageModel;
  threadTier: ThreadTier;
  essence: number;
  tick: number;
  autoResolveTick: number | null;
  onIntervene: (choiceId: string, essenceCost: number) => void;
  onBoost: (essenceCost: number) => void;
  onPeek: () => void;
  onDisregard: () => void;
  onAcknowledgeAftermath: () => void;
  onAftermathReaction: (reactionId: string) => void;
  /** THR-636 — clicking the character chip opens the agent's detail surface. */
  onSelectAgent?: (agentId: string) => void;
  /**
   * THR-1004 — open a non-person entity's sheet (a faction, an artifact). The
   * UI Law's link half: an aftermath chip that names a faction or a reward is
   * only fully present when the player can go look at it. Kept separate from
   * `onSelectAgent` because that handler selects an *agent* and opens the agent
   * drawer — routing an artifact through it would be a dead link wearing a
   * live one's clothes. A host that omits this leaves those names emphasised
   * and unclickable, which is the fail-open behaviour.
   */
  onSelectEntity?: (entityId: string, kind: 'faction' | 'artifact' | 'attachment' | 'location') => void;
  /** THR-636 — "Show on map": close the veil and pan the camera to the encounter hex. */
  onShowOnMap?: (col: number, row: number) => void;
  /**
   * THR-1299 slice 4 — the follow affordance on the encounter's subject (ruling
   * 2.1 + Christian's extension: one state, two surfaces). Absent on a host with
   * no follow state to show; the context strip then renders no toggle.
   */
  followState?: import('./FollowToggle').FollowDescriptor;
  /** Flips follow state for the encounter's focal agent. */
  onToggleFollow?: (agentId: string) => void;
  /**
   * THR-775 — commit the selected nudge hand and let the step resolve. Called
   * only from the nudge stage; the legacy choice path still goes through
   * `onIntervene`. Absent ⇒ the commit button is inert, which is the correct
   * degradation for a host that has not wired the handler yet.
   */
  onCommitNudges?: (nudgeIds: string[], essenceCost: number) => void;
  /** THR-775 — open the motive explainer from the header's motive chip. */
  onOpenMotive?: (phase: EncounterStageNudgePhaseModel) => void;
}

// ── Design tokens ──────────────────────────────────────────────────
// Law 30 (THR-1010): the ceremonial palette is a sanctioned *variant set*, so
// it keeps its own names — but the values live in `index.css`, not here. The
// local hex constants these replaced had drifted from the game-wide token
// (`GOLD #d4af37` vs `--accent-gold #d4a040`), which is exactly the two-golds
// drift the law names. `--veil-gold` now resolves to `--accent-gold`.
// ── Consequence chip anatomy (THR-1082) ────────────────────────────

/** Icon-tile edge for a consequence chip — matches `EntityVisual size="chip"`. */
const CONSEQUENCE_TILE_PX = 40;

/**
 * Delta-cluster glyph size. Above the Law 11 floor of 14 because the cluster is
 * the *headline* reading of a compact chip — it carries the meaning with no text
 * beside it, which is the case Law 11 says sizes up.
 */
const CONSEQUENCE_DELTA_PX = 15;

/**
 * Law 12 — the first-contact legend for the four categories.
 *
 * Ordered as the story reads them: what it cost, who it changed, what was
 * earned, what it opened. Each entry is a hover into the same tooltip registry
 * the chips themselves use (Law 17), so the legend teaches and the tooltip
 * explains without a second copy of the words.
 */
const CONSEQUENCE_LEGEND_ENTRIES: readonly {
  category: EncounterStageConsequenceCategory;
  glyph: string;
  label: string;
  tooltipId: string;
}[] = CONSEQUENCE_CATEGORY_ORDER.map((category) => ({
  category,
  glyph: CONSEQUENCE_CATEGORY_GLYPHS[category],
  label: CONSEQUENCE_CATEGORY_LABELS[category],
  // THR-1136 — read from the shared map rather than rebuilt here. The chip tag
  // now draws the same tooltip, and an id spelled in two places is an id that
  // drifts in one of them.
  tooltipId: CONSEQUENCE_CATEGORY_TOOLTIP_IDS[category],
}));

/**
 * A reach state-noun draws the shared reach glyph — but only where one exists.
 *
 * `REACH_TO_SPHERE` and the tooltip registry now both hold the same eight reaches
 * (THR-1368 retired `reach.flesh`, which was the ninth). The guard stays on the icon
 * set rather than on the tooltip id, because `REACH_DISPLAY_NAMES` still carries
 * `time` and `life` — display words with no icon and no world-model node. Guarding
 * here is what keeps those from rendering a glyph with an undefined sphere colour:
 * they fall through to the category tile, a designed fallback, not a broken one (Law 4).
 */
function consequenceReach(domain: string | undefined): ReachDomain | undefined {
  if (!domain) return undefined;
  return domain in REACH_TO_SPHERE ? (domain as ReachDomain) : undefined;
}

const VOID = 'var(--veil-void)';
const FONT_PROSE = 'var(--font-prose)';
const FONT_DISPLAY = "'Palatino Linotype', 'Book Antiqua', Palatino, serif";
const GOLD = 'var(--veil-gold)';
const GOLD_DIM = 'var(--veil-gold-dim)';
// Law 45: these three carry subtitles, prompts and step prose, so all three sit
// at or above WCAG AA 4.5:1 against `--veil-void`. The pre-THR-1010 whisper
// (~2.2:1) and ghost (~1.4:1) tones survive as `--veil-text-atmosphere`, which
// is legal only for decoration duplicated elsewhere.
const TEXT_WARM = 'var(--veil-text-warm)';
const TEXT_WHISPER = 'var(--veil-text-whisper)';
const TEXT_GHOST = 'var(--veil-text-ghost)';

/** Art opacity per thread tier */
const ART_OPACITY: Record<ThreadTier, number> = {
  strong: 0.85,
  light: 0.6,
  watched: 0.35,
};

/** Minimum clickable hit area per step dot — visual dot stays small, padding grows (THR-636). */
const STEP_NAV_MIN_HIT_PX = 24;

/**
 * Law 46 (THR-1010) — the boost pips are the veil's other small target, and
 * they were 12px square while the step navigator beside them already honoured
 * a 24px floor. Same pattern, same floor: the dot keeps its size, the button
 * grows around it.
 */
const BOOST_PIP_MIN_HIT_PX = 24;
const BOOST_PIP_DOT_PX = 12;

/**
 * Law 44 (THR-1010) — the one duration reduced motion collapses everything to,
 * in seconds because the veil's inline transitions are authored in seconds.
 * Mirrors `--anim-fast: 150ms` in `index.css`; kept as a named constant so
 * retuning stays a number change (NFP #1).
 */
const REDUCED_MOTION_FADE_S = 0.15;

/**
 * Resolved-step outcome → step-dot colour. Success/failure at a glance (THR-636).
 *
 * Law 30 (THR-1031): the polarity hues now come from `--veil-gain-rgb` /
 * `--veil-loss-rgb`, so the veil and the nudge shell cannot drift apart again.
 * The alphas are unchanged and still carry the ramp.
 *
 * `critical_failure` is the one value that moved. It was `#b91c1c`, a literal
 * declared here *and* in the shell's forecast map, and it is not decoration:
 * this map also colours the replay header's outcome **word** below, where
 * #b91c1c measured 3.05:1 on `--veil-void` — under Law 45's 4.5:1 floor. Full
 * loss red is 7.14:1 and makes the severity ramp symmetric with the success
 * side (success 0.55 → critical_success 0.9; failure 0.6 → critical_failure 1).
 */
const OUTCOME_DOT_COLOR: Record<string, string> = {
  critical_success: 'rgb(var(--veil-gain-rgb) / 0.9)',
  success:          'rgb(var(--veil-gain-rgb) / 0.55)',
  success_at_cost:  'rgb(var(--veil-gold-rgb) / 0.7)',
  near_miss:        'var(--accent-near-miss)',
  failure:          'rgb(var(--veil-loss-rgb) / var(--veil-loss-text-alpha))',
  critical_failure: 'rgb(var(--veil-loss-rgb) / 1)',
};

/** Fallback step-dot tone for a resolved step whose outcome the map lacks. */
const OUTCOME_DOT_FALLBACK = 'rgb(var(--veil-gain-rgb) / 0.5)';

/** Type glow colors for choice top line */
const TYPE_COLORS: Record<string, string> = {
  supportive: 'rgb(var(--veil-gain-rgb) / 0.3)',
  coercive: 'rgb(var(--veil-coercive-rgb) / 0.3)',
  withdrawn: 'rgb(var(--veil-neutral-rgb) / 0.2)',
};

/** Type label colors (slightly brighter for readability) */
const TYPE_LABEL_COLORS: Record<string, string> = {
  supportive: 'rgb(var(--veil-gain-rgb) / 0.7)',
  coercive: 'rgb(var(--veil-coercive-rgb) / 0.7)',
  withdrawn: 'rgb(var(--veil-neutral-rgb) / 0.5)',
};

/** Thread tier display labels */
const TIER_LABELS: Record<ThreadTier, string> = {
  strong: 'Strongly Threaded',
  light: 'Lightly Threaded',
  watched: 'Watched',
};

/** Staggered entrance animation delays (seconds) */
const ENTRANCE_DELAYS = {
  art: 0.2,
  tierLabel: 0.6,
  stepDots: 0.8,
  title: 0.9,
  agentLine: 1.0,
  divider: 1.1,
  prose: 1.2,
  choices: 1.5,
  footer: 1.8,
} as const;

/** Mode label suffix per thread tier */
const TIER_MODE_SUFFIX: Record<ThreadTier, string> = {
  strong: 'Paused',
  light: 'Notification',
  watched: 'Watching',
};

/**
 * Walk-away label per thread tier.
 *
 * THR-1121 — `strong` used to read `Resume`, one half of the `Resume`/`Intervene`
 * pair the director called out as *"a legacy UX pattern from the old encounter"*.
 * `Resume` named a simulation control (un-pause the world), which is the wrong
 * noun for what the button does to the *encounter*: it sets the moment down and
 * lets the mortals carry it. The other two tiers already said something closer to
 * that, and `Look away` says it for all three registers without pretending the
 * player is operating a transport.
 *
 * The commit that used to sit beside it now lives in the stage body, where the
 * nudge pattern puts it (`Let fate decide`), so this is the footer's only move.
 */
const DISREGARD_LABEL: Record<ThreadTier, string> = {
  strong: 'Look away',
  light: 'Look away',
  watched: 'Dismiss',
};

// ── Component ──────────────────────────────────────────────────────
export function EncounterVeil({
  open,
  model,
  threadTier,
  essence,
  tick,
  autoResolveTick,
  onIntervene,
  onBoost,
  onPeek,
  onDisregard,
  onAcknowledgeAftermath,
  onAftermathReaction,
  onSelectAgent,
  onSelectEntity,
  onShowOnMap,
  onCommitNudges,
  onOpenMotive,
  followState,
  onToggleFollow,
}: EncounterVeilProps) {
  /**
   * Law 44 (THR-1010). The veil's ceremonial motion is entirely inline, so a
   * CSS `@media (prefers-reduced-motion: reduce)` block cannot reach it —
   * inline styles win. Read the query here and fold it into the style objects.
   *
   * Reduced motion collapses the *stagger and the zoom*, never the state
   * change: every beat still appears (Law 44's second clause — no information
   * carried by motion alone), it simply appears as one `--anim-fast` fade.
   */
  const reducedMotion = usePrefersReducedMotion();
  const ceremonialDelay = (delay: number) => (reducedMotion ? 0 : delay);
  const ceremonialDuration = (duration: number) =>
    reducedMotion ? REDUCED_MOTION_FADE_S : duration;

  const [visible, setVisible] = useState(false);
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);
  // Watched tier state
  const [peeked, setPeeked] = useState(false);
  const [boostAmount, setBoostAmount] = useState(0);
  // THR-636 — index of the resolved step being replayed, or null for "the present".
  const [replayStepIndex, setReplayStepIndex] = useState<number | null>(null);

  /**
   * THR-1082 / Law 51 — the consequence legend is shown until the player says
   * they have it, and that dismissal outlives the session. Read lazily so the
   * storage hit happens once per mount rather than per render.
   *
   * Fail-soft (NFP #4): private browsing throws on `localStorage`, and the
   * designed failure is to *show* the legend rather than hide it — Law 12 says
   * a new vocabulary is introduced at first contact, so noisy beats missing.
   */
  const [legendDismissed, setLegendDismissed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(CONSEQUENCE_LEGEND_STORE_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const dismissConsequenceLegend = useCallback(() => {
    setLegendDismissed(true);
    try {
      localStorage.setItem(CONSEQUENCE_LEGEND_STORE_KEY, 'true');
    } catch {
      // Quota or private browsing — the dismissal still holds for this session.
    }
  }, []);

  // Trigger entrance animation after mount
  useEffect(() => {
    if (open) {
      // Delay one frame so initial state (opacity 0) is painted first
      const raf = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(raf);
    } else {
      setVisible(false);
      setSelectedChoiceId(null);
      setPeeked(false);
      setBoostAmount(0);
      setReplayStepIndex(null);
    }
  }, [open]);

  // Escape key handler
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onDisregard();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onDisregard]);

  const hasArt = !!model.illustration;

  // Resolve current step index from history
  const { currentStepIndex, totalSteps } = useMemo(() => {
    const idx = model.history.findIndex((h) => h.status === 'current');
    return {
      currentStepIndex: idx >= 0 ? idx : 0,
      totalSteps: model.history.length,
    };
  }, [model.history]);

  const handleChoiceClick = useCallback(
    (choice: EncounterStageChoiceModel) => {
      setSelectedChoiceId((prev) => (prev === choice.id ? null : choice.id));
    },
    [],
  );

  const handleIntervene = useCallback(() => {
    if (!selectedChoiceId) return;
    const choice = model.choices.find((c) => c.id === selectedChoiceId);
    if (choice) {
      onIntervene(choice.id, choice.essenceCost);
    }
  }, [selectedChoiceId, model.choices, onIntervene]);

  // THR-636 — the resolved step being replayed (read-only past), or null for "the present".
  const replayEntry =
    replayStepIndex !== null && model.history[replayStepIndex]?.status === 'resolved'
      ? model.history[replayStepIndex]
      : null;

  // THR-348 — the prose currently on screen, as ordered paragraphs for TTS.
  // Tracks the replay toggle so the narrator reads what the player is reading.
  //
  // Hoisted above the early returns below (THR-971). It used to sit just before
  // the final `createPortal`, *after* the `!open` / aftermath / mid-encounter
  // returns — so the moment a mounted veil crossed into aftermath mode React
  // saw one fewer hook than the previous render and threw "Rendered fewer hooks
  // than expected", taking the whole aftermath screen to the error boundary.
  // That is the natural play path (resolve an encounter, watch the ending), so
  // the surface this ticket rebuilds could not render at all.
  const narratableProse = useMemo<string[]>(() => {
    if (replayEntry) {
      return [replayEntry.replayNarrative || replayEntry.afterimage || ''].filter(Boolean);
    }
    const paragraphs = model.narrative.paragraphs.map((para) =>
      para.segments.map((s) => s.text).join(''),
    );
    if (model.scene.momentLine) paragraphs.push(model.scene.momentLine);
    return paragraphs.filter((p) => p.trim().length > 0);
  }, [replayEntry, model.narrative.paragraphs, model.scene.momentLine]);

  if (!open) return null;

  // ── Aftermath rendering path ───────────────────────────────────
  if (model.aftermath) {
    const aftermath = model.aftermath;
    // Law 12 — introduce the category vocabulary on first contact, and only
    // where there is something to introduce it against.
    const showConsequenceLegend = !legendDismissed && (aftermath.consequences?.length ?? 0) > 0;

    /**
     * Edge-only tone: every caller below applies this to a `border`, never to
     * text, so Law 45's floor does not bind it and the alphas stay as authored.
     * `consequenceToneColor` is the text-bearing sibling and is not the same.
     */
    const polarityColor = (polarity: 'gain' | 'loss' | 'mixed' | 'info') => {
      if (polarity === 'gain') return 'rgb(var(--veil-gain-rgb) / 0.65)';
      if (polarity === 'loss') return 'rgb(var(--veil-loss-rgb) / 0.65)';
      if (polarity === 'mixed') return 'rgb(var(--veil-mixed-rgb) / 0.65)';
      return TEXT_WHISPER;
    };

    /**
     * THR-971 — consequence chip toning. `seed` takes the veil's gold rather
     * than a gain/loss hue on purpose: a planted sequel is neither good news
     * nor bad, it is a debt the world now owes the story.
     *
     * Law 45 (THR-1031): this one colours the chip's *label*, not only its
     * edge, so the loss side takes the measured text floor — at the 0.65 it
     * shared with gain it painted 3.5:1.
     */
    const consequenceToneColor = (tone: 'gain' | 'loss' | 'seed' | 'info') => {
      if (tone === 'seed') return GOLD;
      if (tone === 'gain') return 'rgb(var(--veil-gain-rgb) / 0.65)';
      if (tone === 'loss') return 'rgb(var(--veil-loss-rgb) / var(--veil-loss-text-alpha))';
      return TEXT_WHISPER;
    };

    /**
     * THR-1004 — the UI Law's link half, routed by entity kind.
     *
     * Returns the click handler for a named entity, or `undefined` when this
     * host cannot open that kind — in which case the name stays emphasised
     * text. Never a dead link: a wrong-surface click (an artifact id handed to
     * the agent drawer) is worse than no affordance, because it looks live.
     */
    const openEntity = (
      entityId: string | undefined,
      kind: 'agent' | 'faction' | 'artifact' | 'companion' | 'attachment' | 'location' | undefined,
    ): (() => void) | undefined => {
      if (!entityId) return undefined;
      // Absent kind = the narrative linker's cast scan, which has always been
      // people. Preserved so pre-THR-1004 segments behave exactly as before.
      if (!kind || kind === 'agent') {
        return onSelectAgent ? () => onSelectAgent(entityId) : undefined;
      }
      // A companion is a person, but not an agent node and not a thread — the
      // agent drawer and the stub-modal path would both open the wrong sheet
      // (THR-1096; `ThreadCategory` is the divine-court vocabulary THR-1099
      // ruled off-limits for companions). Their tile renders; their sheet is the
      // Companions row on the bearer's own surface. Non-interactive beats wrong.
      if (kind === 'companion') return undefined;
      // THR-1120 — a granted condition/blessing/curse/power. `entityId` is the
      // template node id (the grant itself is written by the reaction's effects,
      // after this veil closes), and the host opens the same AttachmentDetailView
      // the bearer's Attachments tab drills into. Fail-open like every kind above:
      // a host that cannot open one leaves the name as emphasised text.
      //
      // THR-1172 — `location` joins on the same terms: `entityId` is the location
      // node id and the host opens `LocationProfileModal`, the sheet the thread
      // list and the hex map already reach. It needed no new destination, only a
      // door — which is why the fix is a union member and a prop widening rather
      // than a surface.
      return onSelectEntity ? () => onSelectEntity(entityId, kind) : undefined;
    };

    const aftermathEntrance = (delay: number, duration: number): React.CSSProperties =>
      reducedMotion
        ? {
            opacity: visible ? 1 : 0,
            transition: `opacity ${REDUCED_MOTION_FADE_S}s ease`,
          }
        : {
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(8px)',
            transition: `opacity ${duration}s ease ${delay}s, transform ${duration}s ease ${delay}s`,
          };

    return createPortal(
      <div
        role="dialog"
        aria-modal="true"
        aria-label={aftermath.title ?? 'Aftermath'}
        style={{
          position: 'fixed',
          inset: 0,
          background: VOID,
          zIndex: 50,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Art layer — dimmed + desaturated */}
        {hasArt && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `url(${model.illustration!.src})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              maskImage:
                'radial-gradient(ellipse 85% 80% at 35% 40%, black 20%, transparent 75%)',
              WebkitMaskImage:
                'radial-gradient(ellipse 85% 80% at 35% 40%, black 20%, transparent 75%)',
              opacity: visible ? 0.5 : 0,
              filter: 'saturate(0.7)',
              // Law 44 (THR-1010): reduced motion drops the 8s slow zoom and
              // fades the art in at --anim-fast. The art still arrives.
              transform: reducedMotion ? undefined : visible ? 'scale(1)' : 'scale(1.02)',
              transition: reducedMotion
                ? `opacity ${REDUCED_MOTION_FADE_S}s ease`
                : `opacity 1.2s ease ${ENTRANCE_DELAYS.art}s, transform 8s ease-out ${ENTRANCE_DELAYS.art}s`,
            }}
          />
        )}

        {/* THR-1003 — the corner step dots that used to live here moved into the
            content column below, as the same `StepNavigator` the step view
            renders. A separate hand-rolled dot row in the corner was the whole
            reason the ending read as its own screen: it said "resolved" without
            ever saying resolved *what*. */}

        {/* THR-1136 §1 — the top-right `{tier} · Aftermath` label is gone, on
            the director's explicit ask. Both halves of it were chrome the
            ending does not need: the content column already opens with the
            AFTERMATH section marker (THR-1003), so the suffix said the same
            word twice, and the thread-tier word is process vocabulary — how
            closely the player is following this mortal — which has nothing to
            say about what just happened to them. The live (step) and watched
            paths keep their corner labels; there the tier is still telling the
            player which affordances they have. */}

        {/* ── Scrollable content zone ────────────────────── */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: hasArt ? 0 : undefined,
            bottom: 0,
            left: hasArt ? undefined : '50%',
            width: hasArt ? '52%' : '65%',
            transform: hasArt ? undefined : 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            // 'safe' keeps the column top reachable when content overflows the
            // scroll zone — plain 'center' strands the first lines above an
            // unscrollable edge (THR-925). Engines without 'safe' drop the
            // declaration and fall back to flex-start, which scrolls correctly.
            justifyContent: 'safe center',
            padding: '10vh 5vw 10vh 3vw',
            background: hasArt
              ? 'linear-gradient(to right, transparent 0%, rgba(10,10,15,0.55) 10%, rgba(10,10,15,0.82) 28%, rgba(10,10,15,0.93) 50%, rgba(10,10,15,0.97) 100%)'
              : 'transparent',
            zIndex: 10,
            overflowY: 'auto',
          }}
        >
          {/* ── Encounter identity chrome (THR-1003) ─────────────────
              The aftermath is the last page of one encounter, not a separate
              screen, so it wears the header the step view wears: navigator,
              encounter title, context strip — the same three components, not
              copies of them, so the two surfaces cannot drift apart. */}
          <div style={aftermathEntrance(0.5, 0.8)}>
            {/* THR-1136 §2 — the dots are live on the ending too. THR-1003 left
                them inert because the aftermath rendered no replay view, and a
                control that does nothing is worse than no control; the director
                overruled the premise rather than the reasoning, so the fix is to
                give them the view they were missing. This is the same
                `StepReplayView` swap the live path performs, driven by the same
                `replayStepIndex` state — not a second replay implementation. */}
            <StepNavigator
              history={model.history}
              currentStepIndex={currentStepIndex}
              totalSteps={totalSteps}
              replayStepIndex={replayStepIndex}
              onSelectStep={setReplayStepIndex}
              mode="resolved"
            />
          </div>

          {/* Encounter title — what encounter this was */}
          <div
            data-testid="aftermath-encounter-title"
            style={{
              fontFamily: FONT_DISPLAY,
              fontSize: 'var(--text-xs)',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: TEXT_GHOST,
              marginBottom: 6,
              ...aftermathEntrance(0.6, 0.8),
            }}
          >
            {model.header.title}
          </div>

          {/* Context strip — who it happened to, and where */}
          <div data-testid="aftermath-context-strip" style={aftermathEntrance(0.7, 0.8)}>
            <ContextStrip
              header={model.header}
              threadTier={threadTier}
              onSelectAgent={onSelectAgent}
              onShowOnMap={onShowOnMap}
              onDisregard={onDisregard}
              followState={followState}
              onToggleFollow={onToggleFollow}
            />
          </div>

          {/* Gold divider */}
          <div
            style={{
              height: 1,
              background:
                'linear-gradient(to right, transparent, rgb(var(--veil-gold-rgb) / 0.2), transparent)',
              marginBottom: 18,
              opacity: visible ? 1 : 0,
              transition: `opacity ${ceremonialDuration(1)}s ease ${ceremonialDelay(0.9)}s`,
            }}
          />

          {/* THR-1136 §2 — a resolved step's frozen replay takes the body,
              exactly as it does on the live path. The identity chrome above
              (navigator, title, context strip, divider) stays put, so the
              player never loses which encounter they are reading; only the
              ending itself is swapped out, and `StepReplayView`'s own return
              control brings it back. */}
          {replayEntry ? (
            <div data-testid="aftermath-step-replay" style={aftermathEntrance(0, 0.6)}>
              <StepReplayView entry={replayEntry} onReturn={() => setReplayStepIndex(null)} />
            </div>
          ) : (
          <>
          {/* Aftermath section marker — carries the veil's gold rather than the
              title's ghost tone, so the ending reads as a section *of* the
              encounter above it instead of a second title (THR-1003). */}
          <div
            data-testid="aftermath-section-label"
            style={{
              fontFamily: FONT_DISPLAY,
              fontSize: 'var(--text-xs)',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              // Literal rather than GOLD + `opacity`, because the entrance
              // spread below owns `opacity` and would overwrite it. Law 45
              // (THR-1010): this label is words, so it takes the AA gold —
              // at 0.45 it measured 2.5:1 on the composed surface.
              color: 'var(--veil-gold-text)',
              marginBottom: 14,
              ...aftermathEntrance(0.8, 0.8),
            }}
          >
            {aftermath.title ?? 'Aftermath'}
          </div>

          {/* Overview prose — drop cap */}
          <div style={aftermathEntrance(1.0, 1.0)}>
            {aftermath.overview && aftermath.overview.length > 0 && (
              <p
                style={{
                  fontFamily: FONT_PROSE,
                  fontStyle: 'italic',
                  fontSize: 'var(--text-xs)',
                  lineHeight: 1.85,
                  color: TEXT_WARM,
                  marginBottom: 24,
                  maxWidth: 540,
                }}
              >
                <span
                  style={{
                    fontFamily: FONT_DISPLAY,
                    fontSize: '3.4em',
                    float: 'left',
                    lineHeight: 0.75,
                    marginRight: '0.06em',
                    marginTop: '0.08em',
                    color: 'var(--veil-text-warm-dim)',
                    fontStyle: 'normal',
                  }}
                >
                  {aftermath.overview[0]}
                </span>
                {aftermath.overview.slice(1)}
              </p>
            )}
          </div>

          {/* Actor moments */}
          {aftermath.actorMoments && aftermath.actorMoments.length > 0 && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
                marginBottom: 24,
                maxWidth: 540,
                ...aftermathEntrance(1.2, 0.9),
              }}
            >
              {aftermath.actorMoments.map((actor) => (
                <div
                  key={actor.id}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}
                >
                  {/* Portrait circle — Entity Visual Header primitive (THR-637) */}
                  <EntityVisual
                    size="chip"
                    shape="circle"
                    entity={{
                      id: actor.id,
                      kind: 'agent',
                      name: actor.actorName,
                      knownSrc: actor.portraitUrl,
                    }}
                    style={{ width: 36, height: 36 }}
                  />
                  {/* Name + summary */}
                  <div>
                    <div
                      style={{
                        fontFamily: FONT_DISPLAY,
                        fontSize: 'var(--text-xs)',
                        letterSpacing: '0.06em',
                        color: TEXT_WARM,
                        marginBottom: 4,
                      }}
                    >
                      {actor.actorName}
                    </div>
                    {actor.summaryLines.map((line, i) => (
                      <div
                        key={i}
                        style={{
                          fontFamily: FONT_PROSE,
                          fontStyle: 'italic',
                          fontSize: 'var(--text-xs)',
                          lineHeight: 1.7,
                          color: TEXT_WHISPER,
                        }}
                      >
                        {line}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Consequence chips (THR-971) — what you got, what it cost, what it
              planted. Built from the same authored change set the legacy
              highlights/changes blocks below use, so exactly one of the two
              renders; drawing both would say everything twice. */}
          {aftermath.consequences && aftermath.consequences.length > 0 && (
            <div
              data-testid="aftermath-consequences"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                marginBottom: 22,
                maxWidth: 540,
                ...aftermathEntrance(1.3, 0.9),
              }}
            >
              {aftermath.consequences.map((chip) => (
                <div
                  key={chip.id}
                  data-testid={`consequence-chip-${chip.kind}`}
                  data-consequence-kind={chip.kind}
                  data-consequence-category={chip.category}
                  data-consequence-compact={chip.compact ? 'true' : 'false'}
                  style={{
                    display: 'flex',
                    // THR-1004 — the tile sets the row's height, so the row
                    // centres on it rather than sitting on the text baseline.
                    // THR-1082 — a compact chip is a single line of tag and
                    // cluster, so it centres regardless of whether art resolved.
                    alignItems: chip.icon || chip.compact ? 'center' : 'baseline',
                    gap: 12,
                    // A hairline, not a card — the ending stays dissolved into
                    // the void rather than resolving into a grid of boxes.
                    borderLeft: `2px solid ${consequenceToneColor(chip.tone)}`,
                    paddingLeft: 12,
                  }}
                >
                  {/* THR-1004 — the UI Law's image half. A chip that names an
                      entity opens with that entity's picture, the same way
                      every other detail surface does.

                      THR-1082 — three tiers, in order of how much they know:
                      the entity's own art, then the reach glyph when the changed
                      state is a reach (Law 9 — one icon vocabulary per element
                      class, and `ReachIcon` is the encounter surface's own), then
                      the category glyph. The third is a designed fallback, not a
                      broken one (Law 4). */}
                  {chip.icon ? (
                    <EntityVisual
                      size="chip"
                      entity={{
                        id: chip.icon.entityId,
                        kind: chip.icon.kind,
                        name: chip.icon.name,
                        knownSrc: chip.icon.src,
                      }}
                      data-testid={`consequence-chip-icon-${chip.kind}`}
                      aria-label={chip.icon.name}
                      title={chip.icon.name}
                      onClick={openEntity(chip.icon.entityId, chip.icon.kind)}
                    />
                  ) : consequenceReach(chip.reachDomain) ? (
                    <span
                      data-testid={`consequence-chip-reach-${chip.category}`}
                      style={{ display: 'inline-flex', flexShrink: 0 }}
                    >
                      <ReachIcon
                        reach={consequenceReach(chip.reachDomain)!}
                        size={CONSEQUENCE_TILE_PX}
                      />
                    </span>
                  ) : (
                    <span
                      data-testid={`consequence-chip-glyph-${chip.category}`}
                      aria-hidden="true"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: CONSEQUENCE_TILE_PX,
                        height: CONSEQUENCE_TILE_PX,
                        flexShrink: 0,
                        fontSize: 'var(--text-sm)',
                        color: consequenceToneColor(chip.tone),
                        border: `1px solid ${consequenceToneColor(chip.tone)}`,
                        borderRadius: 3,
                        opacity: 0.85,
                      }}
                    >
                      {chip.categoryGlyph}
                    </span>
                  )}
                  {/* THR-1082 — `CATEGORY · NOUN`. The noun is the half that was
                      missing: "the bridge spent something" named no game state at
                      all, and a chip that cannot say *what* changed is unreadable
                      however well its magnitude is drawn. Law 31 — the category
                      colour never carries polarity alone; the category word rides
                      with it, and direction lives in the cluster. */}
                  <span
                    style={{
                      fontFamily: FONT_DISPLAY,
                      fontSize: 'var(--text-xs)',
                      letterSpacing: '0.16em',
                      color: consequenceToneColor(chip.tone),
                      flexShrink: 0,
                      minWidth: 74,
                      maxWidth: 190,
                    }}
                  >
                    {/* THR-1136 §3a — the category word carries Law 17's hover
                        tier. It was explained only by the first-contact legend
                        below, whose dismissal outlives the session (Law 51), so
                        a player who pressed "got it" once had no way left to ask
                        what BOON meant on any later ending. Same registry entry
                        the legend reads, so there is one set of words, not two.
                        Unguarded on purpose: unlike the noun — whose resolve
                        guard now lives inside `NarrativeSegments` (THR-1153) —
                        these four ids are a closed set shipped with the legend,
                        so a miss is a build-time content bug to fix rather than
                        a runtime case to fall back from. */}
                    {/* The stop sits on the word, not on `Tooltip`'s wrapper — the
                        sanctioned caller override (THR-1095, `interactions.md`
                        § Tooltip Pattern → Keyboard reachability). `Tooltip` now
                        makes its own wrapper focusable by default, but here the
                        ring should hug the category word itself rather than the
                        wrapper's box. Its probe sees this `tabIndex` and stands
                        down, so there is exactly one stop either way. Same
                        pattern on the legend entries below. */}
                    <Tooltip id={chip.categoryTooltipId}>
                      <span
                        className="focus-ring"
                        tabIndex={0}
                        data-testid={`consequence-chip-category-${chip.category}`}
                      >
                        {chip.categoryLabel}
                      </span>
                    </Tooltip>
                    {chip.nounLabel && (
                      // Warm on the wrapper, whisper on the separator alone.
                      // `NarrativeSegments` sets no colour on a plain segment, so
                      // the noun inherits — and inheriting TEXT_WARM is exactly the
                      // plain look this tag has always had. Its other two tiers
                      // colour themselves (`plainColor`, `linkColor`).
                      <span style={{ color: TEXT_WARM }}>
                        <span style={{ color: TEXT_WHISPER }}>{' · '}</span>
                        {/* THR-1122 gave the noun Law 17's hover tier. THR-1153
                            gives it the *click* tier, because Law 56's second
                            clause makes the noun the chip's referent — the one
                            word that names the graph object the ending changed.
                            Until this, a chip could declare `entityId` on its
                            `stateNoun` and the noun still went nowhere while a
                            decorated word inside the same sentence clicked
                            through: the most concentrated referent was the least
                            reachable one.

                            Drawn by `NarrativeSegments` rather than by a third
                            inline copy of the three-tier rule (Law 27) — this
                            block was one of the two copies THR-1105 collapsed,
                            and re-hand-rolling a click tier here is how that
                            drift starts again. A single segment carries all three
                            tiers, and each is still earned: the link only when
                            `openEntity` can route the kind (Law 21), the underline
                            only when the registry can answer, plain otherwise.
                            Outside any outer click target, so the default
                            `nested={false}` keeps a real `<button>`. */}
                        <NarrativeSegments
                          paragraph={{
                            id: `${chip.id}-noun`,
                            segments: [
                              {
                                text: chip.nounLabel,
                                emphasis: 'accent',
                                tooltipId: chip.nounTooltipId,
                                entityId: chip.nounEntityId,
                                entityKind: chip.nounEntityKind,
                              },
                            ],
                          }}
                          openEntity={openEntity}
                          linkColor={GOLD}
                          underlineColor={GOLD_DIM}
                          plainColor={TEXT_WARM}
                          testIdPrefix={`consequence-chip-noun-${chip.kind}`}
                        />
                      </span>
                    )}
                  </span>
                  <span
                    style={{
                      fontFamily: FONT_PROSE,
                      fontStyle: 'italic',
                      fontSize: 'var(--text-xs)',
                      lineHeight: 1.7,
                      color: TEXT_WARM,
                      flex: 1,
                    }}
                  >
                    {/* THR-1082 — Christian's ruling, 2026-08-10: incidental
                        drift "takes away from the encounter story", so a compact
                        chip draws no sentence at all. The sentence is not lost —
                        it is the cluster's hover text and its aria label, so the
                        banded word ("grew steadily") is still one hover away. */}
                    {/* THR-1105 — the three-tier segment rule (click where a page
                        exists, hover where the registry can explain, plain
                        otherwise) is one rule, so it is drawn by one component.
                        This block held a second inline copy until PR #1415 landed
                        and freed it; the rules and the reasoning behind them now
                        live in `NarrativeSegments.tsx` (Law 27). These chips sit
                        outside any outer click target, so they take the default
                        `nested={false}` and keep real `<button>` links. */}
                    {chip.compact ? null : (
                      <NarrativeSegments
                        paragraph={chip.sentence}
                        openEntity={openEntity}
                        linkColor={GOLD}
                        underlineColor={GOLD_DIM}
                        plainColor={TEXT_WARM}
                        testIdPrefix={`consequence-chip-${chip.kind}`}
                      />
                    )}
                  </span>
                  {/* THR-1082 — the magnitude idiom, right-aligned so the eye can
                      run down the column and read every change's size without
                      reading a word. On a compact chip this *is* the reading; on
                      an authored one it annotates the sentence rather than
                      replacing it (Law 15). */}
                  {chip.delta && (
                    <DeltaCluster
                      direction={chip.delta.direction}
                      count={chip.delta.count}
                      // The compact chip's sentence lives here — the ladder's
                      // banded word stays one hover away rather than vanishing.
                      label={chip.compact && chip.sentenceText
                        ? `${chip.delta.label}. ${chip.sentenceText}`
                        : chip.delta.label}
                      color={consequenceToneColor(chip.tone)}
                      size={CONSEQUENCE_DELTA_PX}
                    />
                  )}
                </div>
              ))}
              {/* THR-1082 / Law 12 — a vocabulary new to the player is
                  introduced at first contact, never inferred from context. The
                  THR-972 hand legend is the pattern; Law 51 keeps the dismissal
                  across sessions rather than re-teaching it every ending. */}
              {showConsequenceLegend && (
                <div
                  data-testid="consequence-legend"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 14,
                    paddingLeft: 14,
                    marginTop: 2,
                    fontFamily: FONT_DISPLAY,
                    fontSize: 'var(--text-2xs)',
                    letterSpacing: '0.12em',
                    color: TEXT_WHISPER,
                  }}
                >
                  {CONSEQUENCE_LEGEND_ENTRIES.map((entry) => (
                    <Tooltip key={entry.category} id={entry.tooltipId}>
                      <span
                        className="focus-ring"
                        tabIndex={0}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}
                      >
                        <span aria-hidden="true">{entry.glyph}</span>
                        {entry.label}
                      </span>
                    </Tooltip>
                  ))}
                  <button
                    className="focus-ring"
                    type="button"
                    onClick={dismissConsequenceLegend}
                    style={{
                      background: 'none',
                      border: 'none',
                      // Law 46 — the mark stays small, the hit area does not.
                      padding: '6px 8px',
                      margin: '-6px -8px',
                      font: 'inherit',
                      color: TEXT_WHISPER,
                      borderBottom: `1px solid ${GOLD_DIM}`,
                      cursor: 'pointer',
                    }}
                  >
                    got it
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Highlights — legacy presentation, suppressed once chips exist */}
          {!aftermath.consequences?.length && aftermath.highlights && aftermath.highlights.length > 0 && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                marginBottom: 20,
                maxWidth: 540,
                ...aftermathEntrance(1.3, 0.9),
              }}
            >
              {aftermath.highlights.map((h) => (
                <div
                  key={h.id}
                  style={{
                    padding: '10px 14px',
                    border: `1px solid ${polarityColor(h.tone ?? 'info')}`,
                    borderRadius: 2,
                    borderLeft: `3px solid ${polarityColor(h.tone ?? 'info')}`,
                    background: 'rgba(255,255,255,0.02)',
                  }}
                >
                  <div
                    style={{
                      fontFamily: FONT_DISPLAY,
                      fontSize: 'var(--text-xs)',
                      letterSpacing: '0.05em',
                      color: TEXT_WARM,
                      marginBottom: 4,
                    }}
                  >
                    {h.title}
                  </div>
                  <div
                    style={{
                      fontFamily: FONT_PROSE,
                      fontStyle: 'italic',
                      fontSize: 'var(--text-xs)',
                      color: TEXT_WHISPER,
                      lineHeight: 1.65,
                    }}
                  >
                    {h.detail}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Changes — legacy presentation, suppressed once chips exist */}
          {!aftermath.consequences?.length && aftermath.changes && aftermath.changes.length > 0 && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                marginBottom: 20,
                maxWidth: 540,
                ...aftermathEntrance(1.4, 0.9),
              }}
            >
              {aftermath.changes.map((change) => (
                <div
                  key={change.id}
                  style={{
                    padding: '10px 14px',
                    border: `1px solid rgb(var(--veil-gold-rgb) / 0.1)`,
                    borderRadius: 2,
                    borderLeft: `3px solid ${polarityColor(change.polarity)}`,
                    background: 'rgba(255,255,255,0.02)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                  }}
                >
                  <div
                    style={{
                      fontFamily: FONT_DISPLAY,
                      fontSize: 'var(--text-xs)',
                      letterSpacing: '0.05em',
                      color: TEXT_WARM,
                    }}
                  >
                    {change.title}
                  </div>
                  <div
                    style={{
                      fontFamily: FONT_PROSE,
                      fontStyle: 'italic',
                      fontSize: 'var(--text-xs)',
                      color: TEXT_WHISPER,
                      lineHeight: 1.65,
                    }}
                  >
                    {change.detail}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Reactions */}
          {aftermath.reactions && aftermath.reactions.length > 0 && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                marginBottom: 20,
                maxWidth: 540,
                ...aftermathEntrance(1.5, 0.9),
              }}
            >
              {/*
                THR-1029 §2 — the choice prompt renders only when there IS a
                choice. One reaction with a "choose which one" question above it
                is an acknowledgment wearing a decision's chrome (Law 25), and
                the director read the prompt back verbatim as the defect.

                The lone reaction keeps its button rather than folding into the
                footer's "Return to the world", because it is not inert: the
                reaction path (`applyAftermathReactionForAgent` in GameView)
                consumes matching hidden marks, runs `observeResolutionIntelligence`,
                and resolves the encounter notification — none of which the plain
                acknowledge path does. So what was wrong was the framing, not the
                control. Remove the question; keep the affordance.
              */}
              {aftermath.reactionPrompt && aftermath.reactions.length > 1 && (
                <div
                  data-testid="aftermath-reaction-prompt"
                  style={{
                    fontFamily: FONT_PROSE,
                    fontStyle: 'italic',
                    fontSize: 'var(--text-xs)',
                    color: TEXT_GHOST,
                    marginBottom: 6,
                    letterSpacing: '0.04em',
                  }}
                >
                  {aftermath.reactionPrompt}
                </div>
              )}
              {aftermath.reactions.map((reaction) => (
                <button
                  className="focus-ring"
                  key={reaction.id}
                  disabled={reaction.disabled}
                  onClick={() => onAftermathReaction(reaction.id)}
                  style={{
                    background: 'rgb(var(--veil-gold-rgb) / 0.03)',
                    border: '1px solid rgb(var(--veil-gold-rgb) / 0.1)',
                    borderRadius: 2,
                    fontFamily: FONT_PROSE,
                    fontStyle: 'italic',
                    fontSize: 'var(--text-xs)',
                    letterSpacing: '0.04em',
                    color: reaction.disabled ? TEXT_GHOST : TEXT_WARM,
                    cursor: reaction.disabled ? 'default' : 'pointer',
                    padding: '12px 16px',
                    textAlign: 'left',
                    opacity: reaction.disabled ? 0.4 : 1,
                    transition: 'background-color 0.4s ease, color 0.4s ease, opacity 0.4s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!reaction.disabled) {
                      e.currentTarget.style.background = 'rgb(var(--veil-gold-rgb) / 0.06)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgb(var(--veil-gold-rgb) / 0.03)';
                  }}
                >
                  {/*
                    THR-1084 — the entity named in a reaction links to its page,
                    the way the change-detail lines above it in this same modal
                    already do (Laws 1, 21). The label sits inside this button,
                    so the link is a `role="link"` span that stops propagation
                    rather than a nested `<button>` (invalid HTML) — the pick
                    still fires on every other pixel of the option. The full
                    decision is recorded in `NarrativeSegments.tsx`.
                  */}
                  <div data-testid={`aftermath-reaction-label-${reaction.id}`}>
                    {reaction.labelSegments ? (
                      <NarrativeSegments
                        paragraph={reaction.labelSegments}
                        openEntity={openEntity}
                        linkColor={GOLD}
                        underlineColor={GOLD_DIM}
                        plainColor={TEXT_WARM}
                        nested
                        testIdPrefix={`aftermath-reaction-label-${reaction.id}`}
                      />
                    ) : (
                      reaction.label
                    )}
                  </div>
                  {/*
                    THR-1029 §1 — the authored `intent` is what the pick means, and
                    it was being dropped at render while sitting in the data (Law 1;
                    a bare label is also the key:value-shaped half-sentence Law 16
                    rejects). Treatment is deliberately the step-choice card's own
                    intent line further down this file — same font, size, leading
                    and whisper tone — rather than a second one invented here (Law 27).
                  */}
                  {reaction.intent && (
                    <div
                      data-testid={`aftermath-reaction-intent-${reaction.id}`}
                      style={{
                        fontFamily: FONT_PROSE,
                        fontStyle: 'italic',
                        fontSize: 'var(--text-xs)',
                        lineHeight: 1.75,
                        color: TEXT_WHISPER,
                        marginTop: 6,
                      }}
                    >
                      {reaction.intentSegments ? (
                        <NarrativeSegments
                          paragraph={reaction.intentSegments}
                          openEntity={openEntity}
                          linkColor={GOLD}
                          underlineColor={GOLD_DIM}
                          plainColor={TEXT_WHISPER}
                          nested
                          testIdPrefix={`aftermath-reaction-intent-${reaction.id}`}
                        />
                      ) : (
                        reaction.intent
                      )}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* THR-1136 §1 — the exit sits at the end of the ending it exits.
              It used to be pinned to the viewport's bottom-right corner, which
              on a wide screen put it a long way from the column it belonged to
              and read as window chrome rather than as the last line of the
              story (Law 1 — one reading order, top to bottom). The button and
              its handler are unchanged; only its position moved.

              Deliberately not rendered during a step replay: the replay has its
              own return, and offering "Return to the world" beside it would put
              two return-shaped controls with different destinations on one
              screen (Law 21). Closing the whole encounter stays one step away —
              leave the replay, then leave the ending. */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-start',
              maxWidth: 540,
              marginTop: 8,
              ...aftermathEntrance(1.6, 0.8),
            }}
          >
            <button
              className="focus-ring"
              onClick={onAcknowledgeAftermath}
              style={{
                background: 'transparent',
                border: 'none',
                fontFamily: FONT_PROSE,
                fontStyle: 'italic',
                fontSize: 'var(--text-xs)',
                letterSpacing: '0.06em',
                color: GOLD,
                opacity: 0.6,
                cursor: 'pointer',
                // Law 46 — the mark stays small, the hit area does not.
                padding: '8px 4px',
                marginLeft: -4,
                transition: 'opacity 0.4s ease, text-shadow 0.4s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '1';
                e.currentTarget.style.textShadow = '0 0 20px rgb(var(--veil-gold-rgb) / 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '0.6';
                e.currentTarget.style.textShadow = 'none';
              }}
            >
              Return to the world
            </button>
          </div>
          </>
          )}
        </div>
      </div>,
      document.body,
    );
  }

  // ── Watched tier rendering path ────────────────────────────────
  if (threadTier === 'watched') {
    const tierModeLabel = peeked ? 'Watched · Boost' : 'Watched · Peek';

    // Shared entrance style helper for watched (uses same visible state)
    const watchedEntrance = (delay: number, duration: number): React.CSSProperties => ({
      opacity: visible ? 1 : 0,
      transition: `opacity ${ceremonialDuration(duration)}s ease ${ceremonialDelay(delay)}s`,
    });

    return createPortal(
      <div
        role="dialog"
        aria-modal="true"
        aria-label={model.header.title}
        style={{
          position: 'fixed',
          inset: 0,
          background: VOID,
          zIndex: 50,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Art layer — desaturated */}
        {hasArt && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `url(${model.illustration!.src})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              maskImage:
                'radial-gradient(ellipse 85% 80% at 35% 40%, black 20%, transparent 75%)',
              WebkitMaskImage:
                'radial-gradient(ellipse 85% 80% at 35% 40%, black 20%, transparent 75%)',
              opacity: visible ? ART_OPACITY.watched : 0,
              filter: 'grayscale(40%)',
              // Law 44 (THR-1010): reduced motion drops the 8s slow zoom and
              // fades the art in at --anim-fast. The art still arrives.
              transform: reducedMotion ? undefined : visible ? 'scale(1)' : 'scale(1.02)',
              transition: reducedMotion
                ? `opacity ${REDUCED_MOTION_FADE_S}s ease`
                : `opacity 1.2s ease ${ENTRANCE_DELAYS.art}s, transform 8s ease-out ${ENTRANCE_DELAYS.art}s`,
            }}
          />
        )}

        {/* Tier label — top-right */}
        <div
          style={{
            position: 'absolute',
            top: '4vh',
            right: '5vw',
            zIndex: 20,
            textAlign: 'right',
            ...watchedEntrance(0.6, 0.8),
          }}
        >
          <div
            style={{
              fontFamily: FONT_DISPLAY,
              fontSize: 'var(--text-xs)',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: GOLD,
              opacity: 0.5,
            }}
          >
            {tierModeLabel}
          </div>
          <div
            style={{
              fontFamily: FONT_PROSE,
              fontStyle: 'italic',
              fontSize: 'var(--text-xs)',
              color: TEXT_GHOST,
              marginTop: 4,
              letterSpacing: '0.05em',
            }}
          >
            {model.header.threatLabel} threat
          </div>
        </div>

        {/* ── Peek gate (before peek) ─────────────────────── */}
        {!peeked && (
          <div
            style={{
              position: 'relative',
              zIndex: 10,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 20,
              ...watchedEntrance(0.4, 1.0),
            }}
          >
            {/* Diamond icon */}
            <div
              style={{
                fontFamily: FONT_DISPLAY,
                fontSize: '1.8rem',
                color: GOLD,
                opacity: 0.35,
              }}
            >
              ◆
            </div>

            {/* Whisper text */}
            <div
              style={{
                fontFamily: FONT_PROSE,
                fontStyle: 'italic',
                fontSize: 'var(--text-xs)',
                color: TEXT_WHISPER,
                letterSpacing: '0.05em',
                textAlign: 'center',
              }}
            >
              This encounter runs in the background
            </div>

            {/* Peek button */}
            <button
              className="focus-ring"
              onClick={() => {
                setPeeked(true);
                onPeek();
              }}
              style={{
                background: 'rgb(var(--veil-gold-rgb) / 0.04)',
                border: '1px solid rgb(var(--veil-gold-rgb) / 0.12)',
                borderRadius: 2,
                fontFamily: FONT_PROSE,
                fontStyle: 'italic',
                fontSize: 'var(--text-xs)',
                letterSpacing: '0.06em',
                color: 'var(--veil-gold-text)',
                cursor: 'pointer',
                padding: '10px 24px',
                transition: 'background-color 0.4s ease, color 0.4s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgb(var(--veil-gold-rgb) / 0.08)';
                e.currentTarget.style.color = 'rgb(var(--veil-gold-rgb) / 0.7)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgb(var(--veil-gold-rgb) / 0.04)';
                e.currentTarget.style.color = 'rgb(var(--veil-gold-rgb) / 0.45)';
              }}
            >
              ◆ 1 — Peer Through the Thread
            </button>
          </div>
        )}

        {/* ── Revealed view (after peek) ──────────────────── */}
        {peeked && (
          <div
            style={{
              position: 'relative',
              zIndex: 10,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 24,
              maxWidth: 540,
              padding: '0 5vw',
              ...watchedEntrance(0.1, 0.6),
            }}
          >
            {/* Short prose — first paragraph only */}
            <div>
              {model.narrative.paragraphs.slice(0, 1).map((para) => {
                const text = para.segments.map((s) => s.text).join('');
                return (
                  <p
                    key={para.id}
                    style={{
                      fontFamily: FONT_PROSE,
                      fontStyle: 'italic',
                      fontSize: 'var(--text-xs)',
                      lineHeight: 1.85,
                      color: TEXT_WHISPER,
                      textAlign: 'center',
                      margin: 0,
                    }}
                  >
                    {text}
                  </p>
                );
              })}
            </div>

            {/* Gold divider */}
            <div
              style={{
                height: 1,
                width: '60%',
                background:
                  'linear-gradient(to right, transparent, rgb(var(--veil-gold-rgb) / 0.2), transparent)',
              }}
            />

            {/* Boost pip slider */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <div
                style={{
                  fontFamily: FONT_PROSE,
                  fontStyle: 'italic',
                  fontSize: 'var(--text-xs)',
                  color: TEXT_GHOST,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}
              >
                Boost
              </div>
              {/* Law 46 (THR-1010): the pip stays a 12px dot, the *button* is
                  BOOST_PIP_MIN_HIT_PX square — the same visual-dot /
                  grown-padding pattern the step navigator already used via
                  STEP_NAV_MIN_HIT_PX. Boosting spends essence, so a misclick
                  here costs the player something. The gap shrinks by the
                  padding each button gained so the row's visual rhythm is
                  unchanged. */}
              <div style={{ display: 'flex', gap: 10 - (BOOST_PIP_MIN_HIT_PX - BOOST_PIP_DOT_PX) }}>
                {[1, 2, 3, 4, 5].map((pip) => (
                  <button
                    key={pip}
                    className="focus-ring"
                    onClick={() => setBoostAmount(pip === boostAmount ? 0 : pip)}
                    style={{
                      width: BOOST_PIP_MIN_HIT_PX,
                      height: BOOST_PIP_MIN_HIT_PX,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'transparent',
                      border: 'none',
                      borderRadius: '50%',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                    aria-label={`Boost ${pip}`}
                    aria-pressed={pip <= boostAmount}
                  >
                    <span
                      aria-hidden="true"
                      style={{
                        width: BOOST_PIP_DOT_PX,
                        height: BOOST_PIP_DOT_PX,
                        borderRadius: '50%',
                        border: `1px solid ${pip <= boostAmount ? 'rgb(var(--veil-gold-rgb) / 0.6)' : 'rgb(var(--veil-gold-rgb) / 0.2)'}`,
                        background:
                          pip <= boostAmount
                            ? 'rgb(var(--veil-gold-rgb) / 0.4)'
                            : 'transparent',
                        transition: 'background-color 0.3s ease, border-color 0.3s ease',
                      }}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Footer ─────────────────────────────────────── */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '2.5vh 5vw',
            zIndex: 20,
            background: `linear-gradient(to top, ${VOID} 0%, rgba(10,10,15,0.6) 60%, transparent 100%)`,
            ...watchedEntrance(0.8, 0.8),
          }}
        >
          {/* Essence display */}
          <div
            style={{
              fontFamily: FONT_PROSE,
              fontStyle: 'italic',
              fontSize: 'var(--text-xs)',
              color: GOLD,
              opacity: 0.35,
              letterSpacing: '0.04em',
            }}
          >
            {/* THR-1006 — the pool is a float; interpolating it raw put
                `193.60000000000005` on a mortal-facing surface. */}
            &#9670; {formatEssencePool(essence)} essence
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
            <button
              className="focus-ring"
              onClick={onDisregard}
              style={{
                background: 'transparent',
                border: 'none',
                fontFamily: FONT_PROSE,
                fontStyle: 'italic',
                fontSize: 'var(--text-xs)',
                letterSpacing: '0.06em',
                color: TEXT_GHOST,
                cursor: 'pointer',
                padding: '8px 0',
                transition: 'color 0.4s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = TEXT_WHISPER;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = TEXT_GHOST;
              }}
            >
              Close
            </button>
            {peeked && (
              <button
                className="focus-ring"
                onClick={() => onBoost(boostAmount)}
                disabled={boostAmount === 0}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontFamily: FONT_PROSE,
                  fontStyle: 'italic',
                  fontSize: 'var(--text-xs)',
                  letterSpacing: '0.06em',
                  color: GOLD,
                  opacity: boostAmount > 0 ? 0.7 : 0.3,
                  cursor: boostAmount > 0 ? 'pointer' : 'default',
                  padding: '8px 0',
                  transition: 'opacity 0.4s ease, text-shadow 0.4s ease',
                }}
                onMouseEnter={(e) => {
                  if (boostAmount > 0) {
                    e.currentTarget.style.opacity = '1';
                    e.currentTarget.style.textShadow =
                      '0 0 20px rgb(var(--veil-gold-rgb) / 0.3)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = boostAmount > 0 ? '0.7' : '0.3';
                  e.currentTarget.style.textShadow = 'none';
                }}
              >
                Commit
              </button>
            )}
          </div>
        </div>
      </div>,
      document.body,
    );
  }

  // Derived values for lightly threaded timer.
  //
  // THR-1068: clamped at zero. The raw difference goes negative once the
  // deadline passes, and the label then read "auto-resolves in -37 ticks" — a
  // countdown running backwards past a deadline that (until THR-1068 wired the
  // engine-side consumer) never fired. The engine now retires these records at
  // their deadline, so a negative is unreachable in a live run; the clamp holds
  // regardless, because a surface that renders a lie whenever its upstream
  // slips is a defect on its own terms. Zero reads as "now", not as a number.
  const ticksUntilAutoResolve =
    autoResolveTick !== null ? Math.max(0, autoResolveTick - tick) : null;

  const selectedChoice = model.choices.find((c) => c.id === selectedChoiceId);

  // `replayEntry` / `narratableProse` are computed once near the top of the
  // component (THR-971) so no early return can change the hook count.

  // ── Inline style helpers ───────────────────────────────────────
  function entranceStyle(
    delay: number,
    duration: number,
    translateY = 8,
  ): React.CSSProperties {
    if (reducedMotion) {
      return {
        opacity: visible ? 1 : 0,
        transition: `opacity ${REDUCED_MOTION_FADE_S}s ease`,
      };
    }
    return {
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : `translateY(${translateY}px)`,
      transition: `opacity ${duration}s ease ${delay}s, transform ${duration}s ease ${delay}s`,
    };
  }

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={model.header.title}
      style={{
        position: 'fixed',
        inset: 0,
        background: VOID,
        zIndex: 50,
        overflow: 'hidden',
      }}
    >
      {/* ── Auto-resolve timer bar (lightly threaded only) ── */}
      {threadTier === 'light' && ticksUntilAutoResolve !== null && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 30,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '0 5vw',
            height: 28,
          }}
        >
          {/* Warm amber timer bar */}
          <div
            style={{
              flex: 1,
              height: 2,
              background: 'rgb(var(--accent-near-miss-rgb) / 0.18)',
              borderRadius: 1,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: '100%',
                background:
                  'linear-gradient(to right, rgb(var(--accent-near-miss-rgb) / 0.5), rgb(var(--veil-gold-rgb) / 0.25))',
              }}
            />
          </div>
          {/* Timer label */}
          <div
            style={{
              fontFamily: FONT_PROSE,
              fontStyle: 'italic',
              fontSize: 'var(--text-xs)',
              letterSpacing: '0.06em',
              color: 'var(--accent-near-miss)',
              whiteSpace: 'nowrap' as const,
            }}
          >
            {ticksUntilAutoResolve === 0
              ? 'auto-resolving now'
              : `auto-resolves ${getDurationWord(ticksUntilAutoResolve)}`}
          </div>
        </div>
      )}

      {/* ── Art layer ─────────────────────────────────────── */}
      {hasArt && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${model.illustration!.src})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            maskImage:
              'radial-gradient(ellipse 85% 80% at 35% 40%, black 20%, transparent 75%)',
            WebkitMaskImage:
              'radial-gradient(ellipse 85% 80% at 35% 40%, black 20%, transparent 75%)',
            opacity: visible ? ART_OPACITY[threadTier] : 0,
            // Law 44 (THR-1010): reduced motion drops the 8s slow zoom and
            // fades the art in at --anim-fast. The art still arrives.
            transform: reducedMotion ? undefined : visible ? 'scale(1)' : 'scale(1.02)',
            transition: reducedMotion
              ? `opacity ${REDUCED_MOTION_FADE_S}s ease`
              : `opacity 1.2s ease ${ENTRANCE_DELAYS.art}s, transform 8s ease-out ${ENTRANCE_DELAYS.art}s`,
          }}
        />
      )}

      {/* ── Art caption ───────────────────────────────────── */}
      {hasArt && model.illustration!.caption && (
        <div
          style={{
            position: 'absolute',
            bottom: '6vh',
            left: '4vw',
            fontFamily: FONT_DISPLAY,
            fontSize: '1.05rem',
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'rgba(255, 255, 255, 0.18)',
            zIndex: 5,
            ...entranceStyle(1.0, 1.0),
          }}
        >
          {model.illustration!.caption}
        </div>
      )}

      {/* ── Thread tier whisper (top-right) ────────────────── */}
      <div
        style={{
          position: 'absolute',
          top: '4vh',
          right: '5vw',
          zIndex: 20,
          textAlign: 'right' as const,
          ...entranceStyle(ENTRANCE_DELAYS.tierLabel, 0.8, -8),
        }}
      >
        <div
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: 'var(--text-xs)',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: GOLD,
            opacity: 0.5,
          }}
        >
          {TIER_LABELS[threadTier]} &middot; {TIER_MODE_SUFFIX[threadTier]}
        </div>
        <div
          style={{
            fontFamily: FONT_PROSE,
            fontStyle: 'italic',
            fontSize: 'var(--text-xs)',
            color: TEXT_GHOST,
            marginTop: 4,
            letterSpacing: '0.05em',
          }}
        >
          {model.header.threatLabel} threat
        </div>
      </div>

      {/* ── Content zone (reading area) ───────────────────── */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: hasArt ? 0 : undefined,
          bottom: 0,
          left: hasArt ? undefined : '50%',
          width: hasArt ? '52%' : '65%',
          transform: hasArt ? undefined : 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          // 'safe' keeps the column top reachable when content overflows the
          // scroll zone — plain 'center' strands the first lines above an
          // unscrollable edge (THR-925). Engines without 'safe' drop the
          // declaration and fall back to flex-start, which scrolls correctly.
          justifyContent: 'safe center',
          padding: '6vh 5vw 8vh 3vw',
          background: hasArt
            ? 'linear-gradient(to right, transparent 0%, rgba(10,10,15,0.55) 10%, rgba(10,10,15,0.82) 28%, rgba(10,10,15,0.93) 50%, rgba(10,10,15,0.97) 100%)'
            : 'transparent',
          zIndex: 10,
          overflowY: 'auto',
        }}
      >
        {/* Step navigator — outcome-coloured, clickable resolved steps enter replay */}
        <div style={entranceStyle(ENTRANCE_DELAYS.stepDots, 0.8)}>
          <StepNavigator
            history={model.history}
            currentStepIndex={currentStepIndex}
            totalSteps={totalSteps}
            replayStepIndex={replayStepIndex}
            onSelectStep={setReplayStepIndex}
          />
        </div>

        {/* Encounter title + narrate control (THR-348) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 6,
            ...entranceStyle(ENTRANCE_DELAYS.title, 0.8),
          }}
        >
          <div
            style={{
              fontFamily: FONT_DISPLAY,
              fontSize: 'var(--text-xs)',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: TEXT_GHOST,
            }}
          >
            {model.header.title}
          </div>
          <ProseTtsButton
            text={narratableProse}
            label="Narrate this scene"
            context={{
              encounterId: model.header.title,
              threadTier,
            }}
          />
        </div>

        {/* Context strip — character (portrait + name), location + Show on map, reach chip */}
        <div style={entranceStyle(ENTRANCE_DELAYS.agentLine, 0.8)}>
          <ContextStrip
            header={model.header}
            threadTier={threadTier}
            onSelectAgent={onSelectAgent}
            onShowOnMap={onShowOnMap}
            onDisregard={onDisregard}
            followState={followState}
            onToggleFollow={onToggleFollow}
          />
        </div>

        {/* Encounter description subtitle */}
        {model.header.subtitle && (
          <div
            style={{
              fontFamily: FONT_PROSE,
              fontStyle: 'italic',
              fontSize: 'var(--text-xs)',
              color: TEXT_WHISPER,
              marginBottom: 20,
            }}
          >
            {model.header.subtitle}
          </div>
        )}

        {/* Gold divider */}
        <div
          style={{
            height: 1,
            background:
              'linear-gradient(to right, transparent, rgb(var(--veil-gold-rgb) / 0.2), transparent)',
            marginBottom: 22,
            opacity: visible ? 1 : 0,
            transition: `opacity ${ceremonialDuration(1)}s ease ${ceremonialDelay(ENTRANCE_DELAYS.divider)}s`,
          }}
        />

        {/* Prose — live narrative, or a resolved step's frozen replay (THR-636) */}
        <div style={entranceStyle(ENTRANCE_DELAYS.prose, 1.0, 12)}>
          {replayEntry ? (
            <StepReplayView entry={replayEntry} onReturn={() => setReplayStepIndex(null)} />
          ) : (
          <>
          {/* THR-972 — the motive as the scene's opening line. Above the prose
              by directive: as a chip below it, the answer to "why is this mortal
              here" arrived after the scene it was supposed to frame. Renders
              nothing when the phase carries no motive. */}
          {model.nudgePhase && (
            <NudgeMotiveIntro phase={model.nudgePhase} onOpen={onOpenMotive} />
          )}

          {model.narrative.paragraphs.map((para, pIdx) => {
            const text = para.segments.map((s) => s.text).join('');
            // Drop cap on first paragraph
            const isFirst = pIdx === 0;
            return (
              <p
                key={para.id}
                style={{
                  fontFamily: FONT_PROSE,
                  fontStyle: 'italic',
                  fontSize: 'var(--text-xs)',
                  lineHeight: 1.85,
                  color: TEXT_WARM,
                  marginBottom: 16,
                  maxWidth: 540,
                }}
              >
                {isFirst && text.length > 0 ? (
                  <>
                    <span
                      style={{
                        fontFamily: FONT_DISPLAY,
                        fontSize: '3.4em',
                        float: 'left',
                        lineHeight: 0.75,
                        marginRight: '0.06em',
                        marginTop: '0.08em',
                        color: 'var(--veil-text-warm-dim)',
                        fontStyle: 'normal',
                      }}
                    >
                      {text[0]}
                    </span>
                    {text.slice(1)}
                  </>
                ) : (
                  text
                )}
              </p>
            );
          })}

          {/* Moment line from scene */}
          {model.scene.momentLine && (
            <div
              style={{
                fontFamily: FONT_PROSE,
                fontStyle: 'italic',
                fontSize: 'var(--text-xs)',
                color: GOLD,
                opacity: 0.4,
                marginTop: 8,
                letterSpacing: '0.04em',
              }}
            >
              {model.scene.momentLine}
            </div>
          )}

          {model.resolutionReadout && (
            <ResolutionReadoutBlock readout={model.resolutionReadout} />
          )}

          {/* Complication prose — most recent failed step with a complication (THR-20) */}
          {(() => {
            const mostRecentComplication = [...(model.history ?? [])].reverse().find(
              s => s.status === 'resolved' && s.complication,
            )?.complication;
            if (!mostRecentComplication) return null;
            return (
              <div
                style={{
                  marginTop: 16,
                  paddingTop: 12,
                  borderTop: '1px solid rgb(var(--veil-gold-rgb) / 0.15)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'rgb(var(--veil-gold-rgb) / 0.5)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    ⊘ {mostRecentComplication.name}
                  </span>
                  {mostRecentComplication.severity === 'severe' && (
                    <span style={{ fontSize: 'var(--text-xs)', color: 'rgba(220, 100, 60, 0.7)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                      severe
                    </span>
                  )}
                </div>
                <p style={{ fontFamily: FONT_PROSE, fontStyle: 'italic', fontSize: 'var(--text-xs)', lineHeight: 1.7, color: 'rgb(var(--veil-gold-rgb) / 0.7)', margin: 0, maxWidth: 500 }}>
                  {mostRecentComplication.prose}
                </p>
              </div>
            );
          })()}

          {/* THR-1041 — the scene's bound cast as entities, and what the step
              puts at risk. Both models were built by the adapter and read by
              nobody; they sit here, after the prose and before the move, in the
              order the player needs them: who is here, what it costs, what you
              do. */}
          <CastStrip cast={model.cast} threadTier={threadTier} onSelectAgent={onSelectAgent} />
          <FalloutPreview fallout={model.falloutPreview} />
          </>
          )}
        </div>

        {/* ── The player's move (hidden while replaying a resolved step) ──
            THR-775: a step carrying an authored nudge hand renders the nudge
            stage; everything else keeps the legacy choice blocks byte for
            byte. The branch is on data presence alone — remove a template's
            nudges and the old screen comes back, which is what makes the
            rollout per-template and reversible. */}
        {!replayEntry && (
        <div
          style={{
            marginTop: 28,
            ...entranceStyle(ENTRANCE_DELAYS.choices, 1.0, 16),
          }}
        >
          {model.nudgePhase ? (
            <NudgePhaseShell
              phase={model.nudgePhase}
              portraitUrl={model.header.portraitUrl}
              agentName={model.header.agentName}
              focalActorId={model.header.focalActorId}
              onCommit={onCommitNudges ?? (() => {})}
              onOpenMotive={onOpenMotive}
              // THR-972 — the motive intro renders above the prose block, which
              // is a different subtree; the shell must not draw it a second time.
              renderMotiveIntro={false}
            />
          ) : (
            <>
              {model.choices.map((choice) => (
                <ChoiceBlock
                  key={choice.id}
                  choice={choice}
                  selected={selectedChoiceId === choice.id}
                  onClick={() => handleChoiceClick(choice)}
                />
              ))}
              {/* THR-1121 — the choices path's commit, in the nudge stage's
                  pattern and position: under the hand, saying the same words.
                  It replaces the footer `Intervene` button, which sat across the
                  screen from what it committed. Still gated on a selection —
                  on this path the choice *is* the move, and it also keys which
                  authored ending the aftermath resolves to. */}
              {model.choices.length > 0 && (
                <StageCommit
                  disabled={!selectedChoice}
                  essenceCost={selectedChoice?.essenceCost ?? 0}
                  onCommit={handleIntervene}
                />
              )}
            </>
          )}
        </div>
        )}
      </div>

      {/* ── Footer chrome ─────────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '2.5vh 5vw',
          zIndex: 20,
          background: `linear-gradient(to top, ${VOID} 0%, rgba(10,10,15,0.6) 60%, transparent 100%)`,
          ...entranceStyle(ENTRANCE_DELAYS.footer, 0.8),
        }}
      >
        {/* Essence display */}
        <div
          style={{
            fontFamily: FONT_PROSE,
            fontStyle: 'italic',
            fontSize: 'var(--text-xs)',
            color: GOLD,
            opacity: 0.35,
            letterSpacing: '0.04em',
          }}
        >
          {/* THR-1006 — second of three diamond readouts in this file; this is the
              branch the nudge stage actually mounts. */}
          &#9670; {formatEssencePool(essence)} essence
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          <button
            className="focus-ring"
            onClick={onDisregard}
            style={{
              background: 'transparent',
              border: 'none',
              fontFamily: FONT_PROSE,
              fontStyle: 'italic',
              fontSize: 'var(--text-xs)',
              letterSpacing: '0.06em',
              color: TEXT_GHOST,
              cursor: 'pointer',
              padding: '8px 0',
              transition: 'color 0.4s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = TEXT_WHISPER;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = TEXT_GHOST;
            }}
          >
            {DISREGARD_LABEL[threadTier]}
          </button>
          {/* THR-1121 — the `Intervene` button that sat here is gone. It was the
              commit half of the legacy pair: a footer control, far from the
              choice it committed, that only lit up once a stance was selected.
              The commit now renders directly under the choices (`StageCommit`
              below), which is where the nudge stage has always put `Let fate
              decide` — one pattern for "hand this moment to fate", wherever the
              player is standing. */}
        </div>
      </div>
    </div>,
    document.body,
  );
}

// ── ChoiceBlock sub-component ──────────────────────────────────────
interface ChoiceBlockProps {
  choice: EncounterStageChoiceModel;
  selected: boolean;
  onClick: () => void;
}

function formatSignedPercent(value: number): string {
  const percent = Math.round(value * 100);
  if (percent === 0) return '+0%';
  return `${percent > 0 ? '+' : ''}${percent}%`;
}

function formatProbability(value: number): string {
  return `${Math.round(value * 100)}%`;
}

/**
 * The resolution readout — **designer view only** (THR-1124).
 *
 * Every line this block renders is a raw magnitude: a capability and a
 * projected-success percentage, a `50/100` difficulty label, a threshold, a
 * roll and its margin. UI Law 13 puts all of that on the trace and the designer
 * view, never on a surface the player is reading — and this one renders inside
 * the veil, between the narrative and the complication prose.
 *
 * Gated rather than banded because the player already has this information in
 * words: the nudge stage's forecast pips and difficulty word say the same thing
 * in the register the veil speaks. Banding it here would be a second, quieter
 * voice saying it again. What is left is the designer's question — *is the
 * resolution math right?* — which is exactly what the designer view is for.
 *
 * The gate lives inside the block rather than at its one render site so that a
 * future second caller inherits it. A readout that has to be remembered about
 * is a readout that comes back.
 */
function ResolutionReadoutBlock({
  readout,
}: {
  readout: NonNullable<EncounterStageModel['resolutionReadout']>;
}) {
  const designerView = useSyncExternalStore(
    subscribeNudgeDesignerView,
    isNudgeDesignerViewEnabled,
    // Server snapshot — the veil never renders server-side, but the third
    // argument keeps `useSyncExternalStore` quiet under test renderers.
    isNudgeDesignerViewEnabled,
  );

  const entries = [
    ...(readout.current ? [readout.current] : []),
    ...readout.previous,
  ];

  if (!designerView) return null;
  if (entries.length === 0) return null;

  return (
    <div
      style={{
        marginTop: 22,
        maxWidth: 540,
        padding: '14px 16px',
        border: '1px solid rgb(var(--veil-gold-rgb) / 0.12)',
        background: 'rgb(var(--veil-gold-rgb) / 0.03)',
      }}
    >
      <div
        style={{
          fontFamily: FONT_DISPLAY,
          fontSize: 'var(--text-xs)',
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: GOLD,
          opacity: 0.55,
          marginBottom: 12,
        }}
      >
        {readout.heading}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {entries.map((entry) => (
          <ResolutionCheckCard key={entry.id} entry={entry} />
        ))}
      </div>
    </div>
  );
}

function ResolutionCheckCard({ entry }: { entry: EncounterStageResolutionCheckModel }) {
  return (
    <div
      style={{
        borderLeft: `2px solid ${entry.state === 'pending' ? 'rgb(var(--veil-gold-rgb) / 0.35)' : 'rgb(var(--veil-gain-rgb) / 0.22)'}`,
        paddingLeft: 12,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 12,
          alignItems: 'baseline',
          marginBottom: 4,
        }}
      >
        <div
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: 'var(--text-xs)',
            letterSpacing: '0.08em',
            color: TEXT_WARM,
          }}
        >
          {entry.stepLabel}
        </div>
        <div
          style={{
            fontFamily: FONT_PROSE,
            fontStyle: 'italic',
            fontSize: 'var(--text-xs)',
            color: entry.state === 'pending' ? GOLD : TEXT_WHISPER,
            opacity: 0.7,
            whiteSpace: 'nowrap',
          }}
        >
          {entry.state === 'pending' ? 'roll pending' : entry.outcomeLabel}
        </div>
      </div>
      <div
        style={{
          fontFamily: FONT_PROSE,
          fontStyle: 'italic',
          fontSize: 'var(--text-xs)',
          lineHeight: 1.65,
          color: TEXT_WHISPER,
        }}
      >
        <div>
          Test: {entry.reachLabel} vs {entry.difficultyLabel} difficulty
        </div>
        <div>
          Capability {formatProbability(entry.capability)} · Modifiers {formatSignedPercent(entry.modifierTotal)} · Threshold {entry.threshold}
          {entry.forecastLabel ? ` · Forecast ${entry.forecastLabel}` : ''}
        </div>
        <div>
          {entry.roll !== undefined
            ? `Roll ${entry.roll} vs ${entry.threshold}${entry.margin !== undefined ? ` · Margin ${entry.margin}` : ''}`
            : `Projected success ${formatProbability(entry.probability)}`}
          {entry.critLabel ? ` · ${entry.critLabel}` : ''}
          {entry.nearMiss ? ' · Near miss' : ''}
        </div>
      </div>
    </div>
  );
}

/**
 * The stage's commit control for the authored-choice path (THR-1121).
 *
 * Deliberately the same affordance the nudge stage uses — same words
 * (`NUDGE_COMMIT_LABEL`), same gold-outlined button, same running cost in
 * `CostPips` — because it is the same act: the player has finished shaping the
 * moment and is handing it to fate. Two screens saying "commit" two different
 * ways is what made the old footer pair read as legacy.
 *
 * It is a separate component rather than a shared import from `NudgePhaseShell`
 * because that shell's commit is bound to its hand's selection state; hoisting it
 * would mean threading a hand model through a path that has no hand. The shared
 * thing is the label and the pip renderer, and both are imported.
 */
function StageCommit({
  disabled,
  essenceCost,
  onCommit,
}: {
  disabled: boolean;
  essenceCost: number;
  onCommit: () => void;
}) {
  return (
    <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: 14 }}>
      <button
        type="button"
        className="focus-ring"
        data-testid="stage-commit"
        onClick={onCommit}
        disabled={disabled}
        style={{
          padding: '10px 22px',
          borderRadius: 8,
          border: `1px solid ${GOLD}`,
          background: 'rgb(var(--veil-gold-rgb) / 0.1)',
          color: GOLD,
          fontFamily: FONT_DISPLAY,
          fontSize: 'var(--text-base)',
          letterSpacing: '0.06em',
          opacity: disabled ? 0.4 : 1,
          cursor: disabled ? 'default' : 'pointer',
        }}
      >
        {NUDGE_COMMIT_LABEL}
      </button>
      {essenceCost > 0 && (
        <span
          data-testid="stage-commit-cost"
          style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-xs)', color: TEXT_WARM }}
        >
          <CostPips cost={essenceCost} size={13} />
        </span>
      )}
    </div>
  );
}

function ChoiceBlock({ choice, selected, onClick }: ChoiceBlockProps) {
  const [hovered, setHovered] = useState(false);
  const active = hovered || selected;

  const typeColor = choice.interventionType
    ? TYPE_COLORS[choice.interventionType]
    : undefined;
  const typeLabelColor = choice.interventionType
    ? TYPE_LABEL_COLORS[choice.interventionType]
    : undefined;

  // THR-1121 — the `+N% success` branch that stood here is gone with the
  // mechanic it reported. A choice no longer buys odds (see
  // `unifiedActionResolution`), so printing a percentage beside one would be
  // advertising a purchase the engine does not make. `fate decides` stays: it
  // says what a withdrawn stance actually does, in the vocabulary the nudge
  // stage uses everywhere else — words, never numerals (WS2 ruling 6).
  const boostLabel =
    choice.interventionType === 'withdrawn' ? 'fate decides' : undefined;

  return (
    <button
      className="focus-ring"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        padding: '18px 22px',
        marginBottom: 12,
        borderRadius: 2,
        cursor: 'pointer',
        background: selected
          ? 'rgb(var(--veil-gold-rgb) / 0.06)'
          : hovered
            ? 'rgb(var(--veil-gold-rgb) / 0.03)'
            : 'transparent',
        border: 'none',
        textAlign: 'left' as const,
        width: '100%',
        maxWidth: 540,
        transition: 'background-color 0.5s ease',
      }}
    >
      {/* Type glow line at top */}
      {typeColor && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '5%',
            right: '5%',
            height: 1,
            opacity: active ? 1 : 0,
            background: `linear-gradient(to right, transparent, ${typeColor}, transparent)`,
            transition: 'opacity 0.5s ease',
          }}
        />
      )}

      {/* Left border glow */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: '10%',
          bottom: '10%',
          width: 1,
          background: active
            ? `linear-gradient(to bottom, transparent, ${GOLD_DIM}, transparent)`
            : 'transparent',
          transition: 'background 0.5s ease',
        }}
      />

      {/* Intent text */}
      <div
        style={{
          fontFamily: FONT_PROSE,
          fontStyle: 'italic',
          fontSize: 'var(--text-xs)',
          lineHeight: 1.75,
          color: active ? TEXT_WARM : TEXT_WHISPER,
          transition: 'color 0.5s ease',
        }}
      >
        {choice.intent}
      </div>

      {/* Meta row (type label + essence cost + boost) */}
      <div
        style={{
          display: 'flex',
          gap: 16,
          alignItems: 'center',
          marginTop: 8,
          fontFamily: FONT_PROSE,
          fontStyle: 'italic',
          fontSize: 'var(--text-xs)',
          letterSpacing: '0.04em',
        }}
      >
        {/*
          THR-1048 — the stance in words, never `choice.interventionType`.
          The enum still picks the colour above; Law 31 wants a word beside
          that colour, and Law 14 wants it to be a word rather than the key.
        */}
        {choice.stanceLabel && (
          <span
            data-testid="choice-stance"
            style={{
              textTransform: 'lowercase',
              color: typeLabelColor,
              opacity: active ? 1 : 0,
              transition: 'opacity 0.5s ease',
            }}
          >
            {choice.stanceLabel}
          </span>
        )}
        <span
          style={{
            color: GOLD,
            opacity: active ? 0.7 : 0.35,
            transition: 'opacity 0.5s ease',
          }}
        >
          &#9670; {formatEssence(choice.essenceCost)} essence
        </span>
        {boostLabel && (
          <span style={{ color: TEXT_GHOST }}>{boostLabel}</span>
        )}
      </div>

      {/* God voice (revealed on select) */}
      {choice.godVoice && (
        <div
          style={{
            fontFamily: FONT_DISPLAY,
            fontStyle: 'italic',
            fontSize: 'var(--text-xs)',
            color: GOLD,
            opacity: selected ? 0.5 : 0,
            maxHeight: selected ? 80 : 0,
            overflow: 'hidden',
            marginTop: selected ? 12 : 0,
            paddingTop: selected ? 2 : 0,
            paddingLeft: 12,
            borderLeft: '1px solid rgb(var(--veil-gold-rgb) / 0.15)',
            transition: 'opacity 0.6s ease, max-height 0.6s ease, margin-top 0.6s ease, padding-top 0.6s ease',
            lineHeight: 1.7,
          }}
        >
          &ldquo;{choice.godVoice}&rdquo;
        </div>
      )}
    </button>
  );
}

// ── CastStrip sub-component (THR-1041) ─────────────────────────────
/**
 * The scene's bound cast, as image + name + role chips.
 *
 * `buildCast` has produced this model since the adapter was written and no
 * component ever read it, so a scene actor the support bundle spawned or reused
 * reached the player only as a name inside prose — a concept with no image, no
 * tooltip and no link, which is the Law 1 violation the composition audit
 * recorded (`Docs/audits/2026-08-08-encounter-composition-audit.md` §3).
 *
 * Shape borrowed from the styleguide-only `CastRail`/`CastTile` prototype: the
 * uppercase section label, the role line under the name, and reduced opacity for
 * the less-present entries. Not the components themselves — those are built on
 * `CastTileData` (attention priorities, relationship lines) which this model has
 * no producer for, so importing them would mean inventing data. A strip rather
 * than that prototype's full-height right rail, because the veil is a single
 * centred prose column with no rail to hang one in.
 */
function CastStrip({
  cast,
  threadTier,
  onSelectAgent,
}: {
  cast: EncounterStageCastModel[];
  threadTier: ThreadTier;
  onSelectAgent?: (agentId: string) => void;
}) {
  if (cast.length === 0) return null;

  return (
    <div
      data-testid="veil-cast-strip"
      style={{ marginTop: 22, paddingTop: 14, borderTop: '1px solid rgb(var(--veil-gold-rgb) / 0.15)' }}
    >
      <div
        style={{
          fontFamily: FONT_DISPLAY,
          fontSize: 'var(--text-xs)',
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: TEXT_WHISPER,
          marginBottom: 10,
        }}
      >
        In the scene
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
        {cast.map((member) => {
          // Law 21: the link is live only when there is somewhere to go. An
          // unbound spec has no node, so the chip stays a plain name rather
          // than a control that does nothing when clicked.
          const canSelect = Boolean(member.nodeId && onSelectAgent);
          const roleLine = member.roleLabel ?? member.role;
          // Law 17: the hover *explanation* goes through the Tooltip primitive.
          // `title` survives only as the assistive-tech duplicate of
          // `aria-label`, which the law explicitly permits — the raw-`title`
          // tooltip pattern is what it retires.
          const description = member.reused
            ? `${roleLine}. Already part of this world before the scene.`
            : `${roleLine}. Drawn into the scene for this encounter.`;
          const label = canSelect ? `View ${member.name}` : `${member.name} — ${roleLine}`;

          return (
            <Tooltip key={member.id} label={member.name} desc={description}>
            <button
              type="button"
              className="focus-ring"
              data-testid={`veil-cast-chip-${member.id}`}
              onClick={canSelect ? () => onSelectAgent!(member.nodeId!) : undefined}
              disabled={!canSelect}
              title={label}
              aria-label={label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'transparent',
                border: 'none',
                padding: 0,
                cursor: canSelect ? 'pointer' : 'default',
                // Prototype's priority dimming, on the signal this model
                // actually carries: a reused local reads as more present than a
                // walk-on the bundle had to spawn for the scene.
                opacity: member.reused ? 1 : 0.85,
              }}
            >
              <EntityVisual
                size="chip"
                shape="circle"
                entity={{
                  id: member.nodeId ?? member.id,
                  kind: 'agent',
                  name: member.name,
                  knownSrc: member.portraitUrl,
                }}
                style={{ width: 32, height: 32, opacity: ART_OPACITY[threadTier] }}
              />
              <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <span
                  style={{
                    fontFamily: FONT_DISPLAY,
                    fontSize: 'var(--text-xs)',
                    letterSpacing: '0.06em',
                    color: TEXT_WARM,
                    textDecoration: canSelect ? 'underline' : 'none',
                    textUnderlineOffset: 3,
                  }}
                >
                  {member.name}
                </span>
                <span
                  style={{
                    fontFamily: FONT_PROSE,
                    fontStyle: 'italic',
                    fontSize: 'var(--text-xs)',
                    color: TEXT_WHISPER,
                  }}
                >
                  {roleLine}
                </span>
              </span>
            </button>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
}

// ── FalloutPreview sub-component (THR-1041) ────────────────────────
/**
 * What the current step puts at risk, read from the step's own success/failure
 * metadata. `buildFalloutPreview` has produced this model unread for as long as
 * `buildCast` has; it belongs immediately above the choices, because it is the
 * stakes half of the decision the player is about to make.
 *
 * Deliberately unquantified — the model carries authored labels, never numbers.
 * A reputation delta rendered as a numeral would be the mechanical readout the
 * veil exists to keep out of the scene (NFP #5).
 */
function FalloutPreview({ fallout }: { fallout: EncounterStageFalloutModel[] }) {
  if (fallout.length === 0) return null;

  return (
    <div
      data-testid="veil-fallout-preview"
      style={{ marginTop: 18, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}
    >
      <span
        style={{
          fontFamily: FONT_DISPLAY,
          fontSize: 'var(--text-xs)',
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: TEXT_WHISPER,
        }}
      >
        At stake
      </span>
      {fallout.map((entry, index) => (
        <span
          key={`${entry.kind}-${index}`}
          style={{
            fontFamily: FONT_PROSE,
            fontStyle: 'italic',
            fontSize: 'var(--text-xs)',
            color: 'var(--veil-gold-text)',
            letterSpacing: '0.04em',
            border: '1px solid rgb(var(--veil-gold-rgb) / 0.15)',
            borderRadius: 2,
            padding: '2px 8px',
          }}
        >
          {entry.label}
        </span>
      ))}
    </div>
  );
}

// ── ContextStrip sub-component (THR-636) ───────────────────────────
function ContextStrip({
  header,
  threadTier,
  onSelectAgent,
  onShowOnMap,
  onDisregard,
  followState,
  onToggleFollow,
}: {
  header: EncounterStageHeaderModel;
  threadTier: ThreadTier;
  onSelectAgent?: (agentId: string) => void;
  onShowOnMap?: (col: number, row: number) => void;
  onDisregard: () => void;
  followState?: FollowDescriptor;
  onToggleFollow?: (agentId: string) => void;
}) {
  const name = header.agentName ?? header.familyLabel;
  const canSelectAgent = Boolean(header.focalActorId && onSelectAgent);
  // THR-1299 slice 4 — the follow toggle on the encounter's subject. Only a real
  // focal actor can be followed; a family-labelled scene has nobody to follow.
  const canToggleFollow = Boolean(header.focalActorId && followState && onToggleFollow);
  const hasHex = header.hexCol !== undefined && header.hexRow !== undefined;
  const canShowOnMap = hasHex && Boolean(onShowOnMap);
  const hasLocation = Boolean(header.locationLabel) && header.locationLabel !== 'Unknown Location';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        flexWrap: 'wrap',
        marginBottom: 16,
      }}
    >
      {/* Character — portrait + name (clickable to agent detail) */}
      {name && (
        <button
          className="focus-ring"
          onClick={canSelectAgent ? () => onSelectAgent!(header.focalActorId!) : undefined}
          disabled={!canSelectAgent}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'transparent',
            border: 'none',
            padding: 0,
            cursor: canSelectAgent ? 'pointer' : 'default',
          }}
          aria-label={canSelectAgent ? `View ${name}` : name}
        >
          {/* Character portrait — Entity Visual Header primitive (THR-637) */}
          <EntityVisual
            size="chip"
            shape="circle"
            entity={{
              id: header.focalActorId ?? name,
              kind: 'agent',
              name,
              knownSrc: header.portraitUrl,
            }}
            style={{ width: 28, height: 28, opacity: ART_OPACITY[threadTier] }}
          />
          <span
            style={{
              fontFamily: FONT_DISPLAY,
              fontSize: 'var(--text-xs)',
              letterSpacing: '0.06em',
              color: TEXT_WARM,
              textDecoration: canSelectAgent ? 'underline' : 'none',
              textUnderlineOffset: 3,
            }}
          >
            {name}
          </span>
        </button>
      )}

      {/* THR-1299 slice 4 — follow this mortal from the encounter itself. */}
      {canToggleFollow && (
        <FollowToggle
          descriptor={followState!}
          onToggle={() => onToggleFollow!(header.focalActorId!)}
          surface="encounter_ui"
          compact
        />
      )}

      {/* Reach chip — current step's reach */}
      {header.reachLabel && (
        <span
          style={{
            fontFamily: FONT_PROSE,
            fontStyle: 'italic',
            fontSize: 'var(--text-xs)',
            color: 'var(--veil-gold-text)',
            letterSpacing: '0.05em',
            border: '1px solid rgb(var(--veil-gold-rgb) / 0.15)',
            borderRadius: 2,
            padding: '2px 8px',
          }}
        >
          {header.reachLabel}
        </span>
      )}

      {/* Location + "Show on map" camera-focus link */}
      {hasLocation && (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            fontFamily: FONT_PROSE,
            fontStyle: 'italic',
            fontSize: 'var(--text-xs)',
            color: TEXT_WHISPER,
            letterSpacing: '0.04em',
          }}
        >
          {header.locationLabel}
          {canShowOnMap && (
            <button
              className="focus-ring"
              onClick={() => {
                onShowOnMap!(header.hexCol!, header.hexRow!);
                onDisregard();
              }}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: GOLD,
                opacity: 0.55,
                fontFamily: FONT_PROSE,
                fontStyle: 'italic',
                fontSize: 'var(--text-xs)',
                letterSpacing: '0.04em',
                padding: 0,
                textDecoration: 'underline',
                textUnderlineOffset: 3,
              }}
            >
              Show on map
            </button>
          )}
        </span>
      )}
    </div>
  );
}

// ── StepNavigator sub-component (THR-636) ──────────────────────────
function StepNavigator({
  history,
  currentStepIndex,
  totalSteps,
  replayStepIndex,
  onSelectStep,
  mode = 'live',
}: {
  history: EncounterStageModel['history'];
  currentStepIndex: number;
  totalSteps: number;
  replayStepIndex: number | null;
  onSelectStep?: (index: number | null) => void;
  /**
   * THR-1003 — `resolved` is the aftermath's reading of the same flow: every
   * dot in its outcome colour and the trailing count reading as finished
   * ("all 2 resolved") rather than as a position ("2 of 2").
   *
   * THR-1136 — it no longer implies inert dots. That was THR-1003's *inference*
   * from the aftermath having no replay view, not the rule; the rule is that a
   * control which cannot act must not be drawn, and it is now enforced directly
   * by whether the host passed `onSelectStep`. The aftermath passes one, so its
   * resolved dots open the same replay the live path shows.
   */
  mode?: 'live' | 'resolved';
}) {
  const resolvedMode = mode === 'resolved';
  // THR-1136 §2 — in resolved mode a dot is clickable when the host gave it
  // somewhere to go. Gating on `onSelectStep` rather than on the mode keeps
  // THR-1003's real rule (never offer a control that cannot act) while letting
  // the aftermath, which now renders a replay view, opt in.
  const canSelect = onSelectStep !== undefined;
  // An encounter can end before its last step (early exit, termination), so the
  // aftermath count reports what actually resolved rather than asserting the
  // whole flow ran.
  const resolvedCount = history.filter((step) => step.status === 'resolved').length;

  // THR-1152 — the re-read has to say its own name. THR-1136 §2 shipped the
  // mechanism correctly and shipped no affordance with it: the whole control was
  // a 7px dot beside the italic word "resolved", which on a single-step
  // encounter is one dot and reads as a status bullet. The director — who
  // ordered the feature — played the Bridge aftermath and reported the
  // capability absent. A control only its implementer can find has not shipped.
  //
  // So the dots keep doing the work and a labeled text control announces it in
  // words. It opens the earliest step there is a past for; from there the dots
  // teach themselves, because the player has now seen what they do.
  // Resolved-only in both modes. On the live path the current step's dot is
  // clickable too, but it is the way *back* to the present (`onSelectStep(null)`),
  // not a past to open — counting it would label a one-step-in encounter as
  // having something to re-read when it does not.
  const replayableIndices = history
    .map((step, i) => ({ step, i }))
    .filter(({ step }) => step.status === 'resolved')
    .map(({ i }) => i);
  // THR-1003's rule holds: a control that cannot act is not drawn. Nothing to
  // re-read (no host handler, no finished step) means no invitation to try —
  // and mid-replay `StepReplayView` already owns the one return-shaped control
  // on screen, so offering a second entrance here would be the Law 21 failure
  // the aftermath's exit is suppressed to avoid.
  const replayEntryIndex =
    canSelect && replayStepIndex === null && replayableIndices.length > 0 ? replayableIndices[0] : null;
  const replayLabel = resolvedMode
    ? replayableIndices.length === 1
      ? 're-read this step'
      : 're-read the steps'
    : replayableIndices.length === 1
      ? 're-read the finished step'
      : 're-read the finished steps';
  return (
    <div style={{ display: 'flex', gap: 0, alignItems: 'center', marginBottom: 24 }}>
      {history.map((step, i) => {
        const isCurrent = step.status === 'current';
        const isResolved = step.status === 'resolved';
        const isReplaying = replayStepIndex === i;
        // A resolved ending has no "current" step, so only finalized ones open.
        const clickable = canSelect && (resolvedMode ? isResolved : isResolved || isCurrent);
        const dotColor = isReplaying || isCurrent
          ? GOLD
          : isResolved
            ? (step.outcome ? (OUTCOME_DOT_COLOR[step.outcome] ?? OUTCOME_DOT_FALLBACK) : OUTCOME_DOT_FALLBACK)
            : TEXT_GHOST;
        const size = isCurrent || isReplaying ? 9 : 7;
        const title = isResolved
          ? `Step ${i + 1} — ${step.outcomeWord ?? 'resolved'}`
          : isCurrent
            ? `Step ${i + 1} — in progress`
            : `Step ${i + 1}`;
        return (
          <button
            className="focus-ring"
            key={step.stepId}
            onClick={clickable ? () => onSelectStep?.(isCurrent || isReplaying ? null : i) : undefined}
            disabled={!clickable}
            title={title}
            aria-label={title}
            style={{
              width: STEP_NAV_MIN_HIT_PX,
              height: STEP_NAV_MIN_HIT_PX,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              border: 'none',
              padding: 0,
              cursor: clickable ? 'pointer' : 'default',
            }}
          >
            <span
              style={{
                width: size,
                height: size,
                borderRadius: '50%',
                background: dotColor,
                boxShadow: isReplaying
                  ? '0 0 8px rgb(var(--veil-gold-rgb) / 0.4)'
                  : isCurrent
                    ? '0 0 8px rgb(var(--veil-gold-rgb) / 0.2)'
                    : 'none',
                outline: isReplaying ? '2px solid rgb(var(--veil-gold-rgb) / 0.5)' : 'none',
                outlineOffset: 2,
                opacity: isCurrent && !isReplaying ? 0.7 : 1,
                transition: 'background-color 0.3s ease, box-shadow 0.3s ease, opacity 0.3s ease',
              }}
            />
          </button>
        );
      })}
      <span
        style={{
          fontFamily: FONT_PROSE,
          fontStyle: 'italic',
          fontSize: 'var(--text-xs)',
          color: TEXT_GHOST,
          marginLeft: 8,
          letterSpacing: '0.04em',
        }}
      >
        {resolvedMode
          ? resolvedCount < totalSteps
            ? `${resolvedCount} of ${totalSteps} resolved`
            : totalSteps === 1
              ? 'resolved'
              : `all ${totalSteps} resolved`
          : replayStepIndex !== null
            ? `replaying ${replayStepIndex + 1} of ${totalSteps}`
            : `${currentStepIndex + 1} of ${totalSteps}`}
      </span>
      {/* THR-1152 — the affordance in words. The status span above stays status;
          overloading "resolved" with a second, silent job as a button is what
          produced the unreadable surface in the first place. */}
      {replayEntryIndex !== null && (
        <>
          <span
            aria-hidden="true"
            style={{ color: TEXT_GHOST, marginLeft: 8, fontSize: 'var(--text-xs)', opacity: 0.5 }}
          >
            ·
          </span>
          <button
            className="focus-ring"
            data-testid="step-replay-invitation"
            onClick={() => onSelectStep?.(replayEntryIndex)}
            aria-label={replayLabel}
            style={{
              background: 'transparent',
              border: 'none',
              padding: '4px 0',
              marginLeft: 8,
              fontFamily: FONT_PROSE,
              fontStyle: 'italic',
              fontSize: 'var(--text-xs)',
              letterSpacing: '0.04em',
              color: GOLD,
              // The underline is the point: gold italic beside ghost italic was
              // already the ambiguity the director could not read. A link that
              // looks like a link needs no hover to be found.
              textDecoration: 'underline',
              textDecorationColor: 'rgb(var(--veil-gold-rgb) / 0.35)',
              textUnderlineOffset: 3,
              opacity: 0.75,
              cursor: 'pointer',
              transition: 'opacity 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '1';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '0.75';
            }}
          >
            {replayLabel}
          </button>
        </>
      )}
    </div>
  );
}

// ── StepReplayView sub-component (THR-636) ─────────────────────────
function StepReplayView({
  entry,
  onReturn,
}: {
  entry: EncounterStageHistoryModel;
  onReturn: () => void;
}) {
  const prose = entry.replayNarrative || entry.afterimage || '';
  const outcomeColor = entry.outcome ? (OUTCOME_DOT_COLOR[entry.outcome] ?? GOLD) : GOLD;
  return (
    <div>
      {/* Replay header — step label · outcome word · reach */}
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 12,
          marginBottom: 14,
          flexWrap: 'wrap',
        }}
      >
        <span
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: 'var(--text-xs)',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: TEXT_GHOST,
          }}
        >
          {entry.stepLabel}
        </span>
        {entry.outcomeWord && (
          <span
            style={{
              fontFamily: FONT_PROSE,
              fontStyle: 'italic',
              fontSize: 'var(--text-xs)',
              color: outcomeColor,
              letterSpacing: '0.05em',
            }}
          >
            {entry.outcomeWord}
          </span>
        )}
        {entry.reachLabel && (
          <span
            style={{
              fontFamily: FONT_PROSE,
              fontStyle: 'italic',
              fontSize: 'var(--text-xs)',
              color: 'rgb(var(--veil-gold-rgb) / 0.55)',
              border: '1px solid rgb(var(--veil-gold-rgb) / 0.15)',
              borderRadius: 2,
              padding: '1px 7px',
            }}
          >
            {entry.reachLabel}
          </span>
        )}
      </div>

      {/* Frozen narrative the player saw at this step's resolution */}
      {prose && (
        <p
          style={{
            fontFamily: FONT_PROSE,
            fontStyle: 'italic',
            fontSize: 'var(--text-xs)',
            lineHeight: 1.85,
            color: TEXT_WARM,
            marginBottom: 14,
            maxWidth: 540,
          }}
        >
          {prose}
        </p>
      )}

      {/* Afterimage, if distinct from the narrative */}
      {entry.afterimage && entry.afterimage !== prose && (
        <p
          style={{
            fontFamily: FONT_PROSE,
            fontStyle: 'italic',
            fontSize: 'var(--text-xs)',
            lineHeight: 1.7,
            color: TEXT_WHISPER,
            marginBottom: 14,
            maxWidth: 540,
          }}
        >
          {entry.afterimage}
        </p>
      )}

      {/* The god-action taken on this step */}
      {entry.choiceText && (
        <div
          style={{
            fontFamily: FONT_DISPLAY,
            fontStyle: 'italic',
            fontSize: 'var(--text-xs)',
            color: GOLD,
            opacity: 0.5,
            marginBottom: 14,
            paddingLeft: 12,
            borderLeft: '1px solid rgb(var(--veil-gold-rgb) / 0.15)',
            lineHeight: 1.7,
          }}
        >
          You whispered: {entry.choiceText}
        </div>
      )}

      {/* Complication, if one fired */}
      {entry.complication && (
        <div
          style={{
            marginTop: 8,
            marginBottom: 14,
            paddingTop: 12,
            borderTop: '1px solid rgb(var(--veil-gold-rgb) / 0.15)',
          }}
        >
          <div
            style={{
              fontSize: 'var(--text-xs)',
              color: 'rgb(var(--veil-gold-rgb) / 0.5)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: 6,
            }}
          >
            ⊘ {entry.complication.name}
          </div>
          <p
            style={{
              fontFamily: FONT_PROSE,
              fontStyle: 'italic',
              fontSize: 'var(--text-xs)',
              lineHeight: 1.7,
              color: 'rgb(var(--veil-gold-rgb) / 0.7)',
              margin: 0,
              maxWidth: 500,
            }}
          >
            {entry.complication.prose}
          </p>
        </div>
      )}

      {/* Return to the present */}
      <button
        className="focus-ring"
        onClick={onReturn}
        style={{
          background: 'transparent',
          border: 'none',
          fontFamily: FONT_PROSE,
          fontStyle: 'italic',
          fontSize: 'var(--text-xs)',
          letterSpacing: '0.06em',
          color: GOLD,
          opacity: 0.6,
          cursor: 'pointer',
          padding: '8px 0',
          marginTop: 8,
        }}
      >
        ← Return to the present
      </button>
    </div>
  );
}
