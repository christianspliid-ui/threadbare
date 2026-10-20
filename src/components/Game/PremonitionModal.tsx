/**
 * PremonitionModal — Divine premonition UI for Whisper and Compulsion.
 *
 * Whisper: dreamlike vignette + 2-3 contextual nudge options.
 * Compulsion: forceful vignette + 3-4 encounter candidates from agent's shortlist.
 *
 * Colors follow the nudge target's sphere from the cosmology model.
 *
 * THR-1897 (plan THR-1877 § D4, D5, S4): a premonition plays on the Stage, in the full
 * layout — the mortal's subject block (portrait, name with its tooltip) on the left; the
 * header, the dream, the options and the dismiss on the right, every word unchanged.
 * Hovering or focusing a compulsion option lights its place on the map with a dashed ring
 * in the dream's tone, and the place tag names it ("… · where the dream pulls"). Escape
 * still does nothing (THR-1711). Its `Modal` is gone.
 *
 * @see Docs/plans/2026-04-04-divine-premonition-design.md
 */

import { useMemo, useState } from 'react';
import { Stage } from './stage/Stage';
import { fallbackStageView, type StageVM } from '../../engine/views/stage/stageView';
import { EntityVisual } from '../shared/EntityVisual';
import { Tooltip } from '../shared/Tooltip';
import type { PremonitionEvent, WhisperNudge, CompulsionCandidate } from '../../types/premonition';
import type { EssencePool } from '../../types/influence';
import type { SphereName } from '../../types';
import type { WorldGraph } from '../../engine/graph';
import { resolveTooltip, type TooltipResolverContext } from '../../engine/tooltipResolver';
import { SPHERE_COLORS, QUINTESSENCE_COLOR, REACH_TO_SPHERE } from '../../data/premonition-constants';
import { PREMONITION_REACH_SPHERE_NOTE } from '../../data/premonition-content';
import { reachDisplayName } from '../../engine/aftermathWords';
import type { ReachDomain } from '../../types/traits';
import { formatEssence, sphereWord } from '../shared/formatEssence';
import { sphereTint } from '../shared/sphereTint';

// ─── Props ──────────────────────────────────────────────────────

interface PremonitionModalProps {
  open: boolean;
  premonition: PremonitionEvent;
  essencePool: EssencePool;
  /** World graph — resolves the subject's portrait (Law 1). Omit on graph-free surfaces. */
  graph?: WorldGraph | null;
  /** Context for the subject's `agent.*` tooltip; absent ⇒ no hover tier, name still links. */
  tooltipContext?: TooltipResolverContext | null;
  onWhisperChoice: (nudge: WhisperNudge) => void;
  onCompulsionChoice: (candidate: CompulsionCandidate) => void;
  /**
   * Opens the subject's character sheet *over* this modal — never dismisses it.
   *
   * Takes the subject's id rather than closing over it at the call site (THR-1461).
   * The zero-argument version let `GameView` decide *which* mortal the premonition
   * was about, and it decided wrongly: it reached for the opener that sets only the
   * profile id, so the sheet rendered the previously selected mortal. A premonition
   * knows exactly one subject; naming it here is what makes the control's promise
   * (Law 33) checkable by a test rather than by a browser pass.
   */
  onViewAgent?: (agentId: string) => void;
  onDismiss: () => void;
  /** THR-1897 — the Stage view model (lit hex, option places, place tag); absent ⇒ nothing lit. */
  stageVM?: StageVM | null;
  /** The game tick, for the Stage's traces. */
  tick?: number;
}

// ─── Tokens (Law 30, THR-1031) ──────────────────────────────────
// The whisper/compulsion palette is a sanctioned variant set, so it keeps its
// own names — but the values live in `index.css`, not inline here. This file
// previously built its entire surface from six literal hex values and four
// literal rgba()s, which is the drift Law 30 names.

/** Sphere fallback when the nudge carries no sphere. */
const SPHERE_FALLBACK = 'var(--text-muted)';

/** Text at the dim tone — information, so it clears AA (Law 45). */
const dimText = (isWhisper: boolean) =>
  `rgb(var(${isWhisper ? '--premonition-whisper-text-rgb' : '--premonition-compulsion-text-rgb'}) / var(--premonition-text-dim-alpha))`;

/** Text at full strength. */
const fullText = (isWhisper: boolean) =>
  `rgb(var(${isWhisper ? '--premonition-whisper-text-rgb' : '--premonition-compulsion-text-rgb'}))`;

/** The type accent, at a caller-chosen alpha token. */
const accent = (isWhisper: boolean, alphaToken: string) =>
  `rgb(var(${isWhisper ? '--premonition-whisper-rgb' : '--premonition-compulsion-rgb'}) / var(${alphaToken}))`;

/**
 * Sphere-tinted option chrome — the recipe lives in `shared/sphereTint` (THR-1586)
 * so cards share it; output here is unchanged (pinned by `sphereTint.test.tsx`).
 */

// ─── Subject header (THR-1139) ──────────────────────────────────

/**
 * Portrait width in the 520px modal (NFP #1). The `chip` size (40px) is too small
 * to recognise a face at a glance; `portrait` is 3:4, so this reads 84×112 —
 * present enough to identify the mortal, short enough that the vignette stays the
 * surface's subject. Rounded rather than circular to match the character sheet the
 * portrait opens, so the player sees one face in two places.
 */
const SUBJECT_PORTRAIT_PX = 84;

/** Minimum hit area for the name control (Law 46). */
const SUBJECT_NAME_MIN_HIT_PX = 24;

/** Escape / backdrop are not a decline (THR-1711) — the decline button is the only exit. */
const IGNORE_IMPLICIT_CLOSE = (): void => {};

// ─── Helpers ────────────────────────────────────────────────────

function getSphereColor(sphere: SphereName | undefined): string {
  if (!sphere) return SPHERE_FALLBACK;
  return SPHERE_COLORS[sphere] ?? SPHERE_FALLBACK;
}

function canAfford(essencePool: EssencePool, sphere: SphereName, cost: number): boolean {
  return (essencePool[sphere] ?? 0) >= cost;
}

/**
 * The option's price, naming the pool it bills — `3 Force essence` (THR-1783).
 * Colour alone was the only cue; each option charges its own sphere, and the
 * gather-strength whisper still bills its nudge sphere, so the word always shows.
 */
export function premonitionCostLabel(cost: number, sphere: SphereName | undefined): string {
  return sphere
    ? `${formatEssence(cost)} ${sphereWord(sphere)} essence`
    : `${formatEssence(cost)} essence`;
}

/**
 * THR-1815 — the "{Reach} draws on {Sphere}" note, split around the sphere word so
 * the caller can wrap it in its registry tooltip. Null when the row did not come
 * from a Reach, or when the pool it bills is not that Reach's sphere: the cost then reads as before.
 */
export function premonitionReachNote(
  reach: ReachDomain | undefined,
  billedSphere: SphereName | undefined,
): { before: string; sphere: SphereName; after: string } | null {
  if (!reach || !billedSphere) return null;
  if (REACH_TO_SPHERE[reach] !== billedSphere) return null;
  const filled = PREMONITION_REACH_SPHERE_NOTE.replace('{Reach}', reachDisplayName(reach));
  const at = filled.indexOf('{Sphere}');
  if (at < 0) return null;
  return { before: filled.slice(0, at), sphere: billedSphere, after: filled.slice(at + '{Sphere}'.length) };
}

function PremonitionReachNote({ reach, sphere }: { reach: ReachDomain | undefined; sphere: SphereName | undefined }) {
  const note = premonitionReachNote(reach, sphere);
  if (!note) return null;
  return (
    <span data-testid="premonition-reach-note">
      {' · '}{note.before}
      <Tooltip id={`sphere.${note.sphere}`}>
        <span className="underline decoration-dotted cursor-help">{sphereWord(note.sphere)}</span>
      </Tooltip>
      {note.after}
    </span>
  );
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ─── Whisper Option Row ─────────────────────────────────────────

/** THR-1897 — an option row reports when it is hovered or focused, so the map can ring its place. */
interface OptionHoverProps {
  onHoverChange?: (hovered: boolean) => void;
}

function hoverHandlers(onHoverChange: OptionHoverProps['onHoverChange']) {
  if (!onHoverChange) return {};
  return {
    onMouseEnter: () => onHoverChange(true),
    onMouseLeave: () => onHoverChange(false),
    onFocus: () => onHoverChange(true),
    onBlur: () => onHoverChange(false),
  };
}

function WhisperOptionRow({
  nudge,
  affordable,
  isWhisper,
  onClick,
  onHoverChange,
}: {
  nudge: WhisperNudge;
  affordable: boolean;
  isWhisper: boolean;
  onClick: () => void;
} & OptionHoverProps) {
  const color = nudge.category === 'gather_strength'
    ? QUINTESSENCE_COLOR
    : getSphereColor(nudge.sphere);

  return (
    <button
      className="w-full text-left rounded-md border transition-colors duration-200 hover:brightness-125 disabled:opacity-40 disabled:cursor-not-allowed"
      style={{
        borderColor: sphereTint(color, 'border'),
        background: sphereTint(color, 'bg'),
        padding: '12px 16px',
      }}
      disabled={!affordable}
      onClick={onClick}
      {...hoverHandlers(onHoverChange)}
    >
      <div className="flex justify-between items-center">
        <span className="text-sm" style={{ color: sphereTint(color, 'text') }}>
          {nudge.prose}
        </span>
        <span className="text-xs ml-2 whitespace-nowrap" style={{ color }} data-testid="premonition-option-cost">
          {premonitionCostLabel(nudge.essenceCost, nudge.sphere)}
          {/* A reach_bias row carries targetReach (and, from the writer, targetSphere =
              that Reach's sphere); a sphere_bias row carries no targetReach, so it gets no note. */}
          <PremonitionReachNote reach={nudge.targetReach} sphere={nudge.sphere} />
        </span>
      </div>
      {/* Law 45: was `opacity-50` over the gradient (~2.9:1). The flavour line
          is the only thing distinguishing two same-cost nudges, so it is
          information, not atmosphere, and takes the dim tone. */}
      <div className="text-xs mt-1" style={{ color: dimText(isWhisper) }}>
        {nudge.flavorText}
      </div>
    </button>
  );
}

// ─── Compulsion Option Row ──────────────────────────────────────

function CompulsionOptionRow({
  candidate,
  affordable,
  onClick,
  onHoverChange,
  lightsPlace,
}: {
  candidate: CompulsionCandidate;
  affordable: boolean;
  onClick: () => void;
  /** The option's place is ringed on the map while it is hovered or focused. */
  lightsPlace?: boolean;
} & OptionHoverProps) {
  const color = getSphereColor(candidate.sphere);

  return (
    <button
      className="w-full text-left rounded-md border transition-colors duration-200 hover:brightness-125 disabled:opacity-40 disabled:cursor-not-allowed"
      style={{
        borderColor: sphereTint(color, 'border'),
        background: sphereTint(color, 'bg'),
        padding: '12px 16px',
      }}
      disabled={!affordable}
      onClick={onClick}
      data-premonition-option-lights={lightsPlace ? '' : undefined}
      {...hoverHandlers(onHoverChange)}
    >
      {/* THR-1802 — the option names the encounter it asks for, the same name the
          result toast prints. The retcon hook alone ("they could make a
          difference") let "Assist right here" turn out to be Rest and Recover. */}
      <div
        className="text-sm font-semibold"
        style={{ color: sphereTint(color, 'text') }}
        data-testid="compulsion-option-name"
      >
        {candidate.encounterName}
      </div>
      {/* Retcon prose — why it pulls. Law 45: `opacity-70` on the option's
          own subject was the lowest-contrast reading on the surface. */}
      <div className="text-sm leading-relaxed italic mt-1" style={{ color: fullText(false) }}>
        {candidate.encounterHook}
      </div>
      {/* Mechanical footer — encounter kind and distance are information. */}
      <div className="flex justify-between items-center mt-2">
        <span className="text-xs" style={{ color: dimText(false) }}>
          {capitalize(candidate.encounterType)}
          {candidate.hexDistance > 0 ? ` · ${candidate.hexDistance} hex away` : ''}
        </span>
        <span className="text-xs whitespace-nowrap" style={{ color }} data-testid="premonition-option-cost">
          {premonitionCostLabel(candidate.essenceCost, candidate.sphere)}
          <PremonitionReachNote reach={candidate.reach} sphere={candidate.sphere} />
        </span>
      </div>
    </button>
  );
}

// ─── Main Component ─────────────────────────────────────────────

export function PremonitionModal({
  open,
  premonition,
  essencePool,
  graph,
  tooltipContext,
  onWhisperChoice,
  onCompulsionChoice,
  onViewAgent,
  onDismiss,
  stageVM,
  tick = 0,
}: PremonitionModalProps) {
  const isWhisper = premonition.type === 'whisper';
  // THR-1897 — the option hovered or focused now, by its index in the premonition's options.
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  /**
   * `agent.*` is a context-bearing prefix — `Tooltip`'s own `id` path calls
   * `resolveTooltip` with no context and would resolve it to null (a dead hover
   * that looks live, Law 21's anti-pattern). So resolve it here with the context
   * and hand `Tooltip` the finished label/desc. Null without a context: the name
   * still links, it just has no hover tier.
   */
  const subjectTooltip = useMemo(
    () => (tooltipContext ? resolveTooltip(`agent.${premonition.agentId}`, tooltipContext) : null),
    [tooltipContext, premonition.agentId],
  );

  const headerText = isWhisper ? 'A stirring in the thread' : "The God's will";
  const dismissText = isWhisper ? 'Let the dream fade' : 'Release your hold — let them choose';

  if (!open) return null;
  const vm = stageVM ?? fallbackStageView({ kind: 'premonition', hasArt: false, hasCast: true });
  const hexForOption = (index: number): string | null => vm.options.find(o => o.index === index)?.hexKey ?? null;
  const hoveredOption = hoveredIndex === null ? null : hexForOption(hoveredIndex);
  const hoverFor = (index: number) => (hovered: boolean) =>
    setHoveredIndex(prev => (hovered ? index : prev === index ? null : prev));

  // ── Left column: the mortal the dream is about (THR-1139) ──
  const left = (
    <div
      data-premonition-subject=""
      className="flex flex-col items-center text-center"
      style={{ color: fullText(isWhisper), fontFamily: 'var(--font-prose)', padding: 'var(--panel-padding, 20px)' }}
    >
      {/* Law 1 — the subject carries its image. Entity Visual Header pattern
          (THR-637); the resolver is knowledge-gated but fail-open when no
          level is passed, and a threaded mortal always resolves to art or
          the authored fallback tile. Clicking it does what the name does. */}
      <EntityVisual
        size="portrait"
        shape="rounded"
        entity={{ id: premonition.agentId, kind: 'agent', name: premonition.agentName }}
        graph={graph ?? null}
        onClick={onViewAgent ? () => onViewAgent(premonition.agentId) : undefined}
        aria-label={
          onViewAgent
            ? `Open ${premonition.agentName}'s page`
            : `Portrait of ${premonition.agentName}`
        }
        data-testid="premonition-subject-portrait"
        style={{
          width: SUBJECT_PORTRAIT_PX,
          minWidth: SUBJECT_PORTRAIT_PX,
          height: Math.round(SUBJECT_PORTRAIT_PX * 4 / 3),
          marginBottom: 10,
        }}
      />
      {/* Law 45: was `opacity-40` (~2.5:1 composed). Which mortal the
          premonition is about is the one thing on this surface that cannot
          be inferred from anything else on it.
          Law 21/20: the name is the link to the mortal's page, and the
          tooltip is the hover tier above it. */}
      <Tooltip label={subjectTooltip?.label} desc={subjectTooltip?.desc}>
        {onViewAgent ? (
          <button
            type="button"
            onClick={() => onViewAgent(premonition.agentId)}
            data-testid="premonition-subject-name"
            className="text-xs mt-1 bg-transparent border-none cursor-pointer hover:brightness-125 transition-[filter]"
            style={{
              color: dimText(isWhisper),
              fontFamily: 'inherit',
              minHeight: SUBJECT_NAME_MIN_HIT_PX,
              padding: '0 8px',
              textDecoration: 'underline',
              textDecorationStyle: 'dotted',
              textUnderlineOffset: 3,
            }}
          >
            {premonition.agentName}
          </button>
        ) : (
          <span
            className="text-xs mt-1"
            data-testid="premonition-subject-name"
            style={{ color: dimText(isWhisper) }}
          >
            {premonition.agentName}
          </span>
        )}
      </Tooltip>
    </div>
  );

  // ── Right column: the header, the dream, the options and the dismiss — the same words ──
  const right = (
    <div
      data-premonition-stage=""
      style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflowY: 'auto', color: fullText(isWhisper), fontFamily: 'var(--font-prose)' }}
    >
      {/* Header */}
      <div className="text-center pt-5 pb-2">
        <div
          style={{
            color: accent(isWhisper, '--premonition-accent-text-alpha'),
            fontFamily: 'var(--font-body)',
            fontWeight: 700,
            fontSize: 'var(--text-xs)',
          }}
        >
          {headerText}
        </div>
      </div>

      {/* Vignette */}
      <div className="px-6 pb-4">
        <div
          className="italic leading-relaxed text-sm"
          style={{
            borderLeft: `2px solid ${accent(isWhisper, '--premonition-accent-rule-alpha')}`,
            padding: '12px 16px',
            maxWidth: 'var(--measure-prose)',
          }}
        >
          {premonition.vignetteProse}
        </div>
      </div>

      {/* Context line — whisper only; compulsion vignette already explains the mechanic */}
      {isWhisper && (
        <div className="px-6 pb-3">
          <div className="text-xs" style={{ color: dimText(isWhisper) }}>
            You sense currents pulling at your mortal:
          </div>
        </div>
      )}

      {/* Options */}
      <div className="px-6 pb-4 flex flex-col gap-2.5">
        {isWhisper && premonition.whisperOptions?.map((nudge, i) => (
          <WhisperOptionRow
            key={`whisper-${i}`}
            nudge={nudge}
            affordable={canAfford(essencePool, nudge.sphere, nudge.essenceCost)}
            isWhisper={isWhisper}
            onClick={() => onWhisperChoice(nudge)}
            onHoverChange={hoverFor(i)}
          />
        ))}
        {!isWhisper && premonition.compulsionCandidates?.map((candidate, i) => (
          <CompulsionOptionRow
            key={`compulsion-${i}`}
            candidate={candidate}
            affordable={canAfford(essencePool, candidate.sphere, candidate.essenceCost)}
            onClick={() => onCompulsionChoice(candidate)}
            onHoverChange={hoverFor(i)}
            lightsPlace={hexForOption(i) !== null}
          />
        ))}
      </div>

      {/* Dismiss */}
      <div className="text-center pb-5">
        {/* Law 45: the dismiss control's own label was `opacity-40`. Hover
            still brightens it — the rest state is what had to clear AA. */}
        <button
          className="text-xs hover:brightness-125 transition-[filter] cursor-pointer bg-transparent border-none"
          style={{ color: dimText(isWhisper) }}
          data-testid="premonition-dismiss"
          onClick={onDismiss}
        >
          {dismissText}
        </button>
      </div>
    </div>
  );

  return (
    // THR-1711 (1): Escape and a backdrop click do NOT decline. A premonition is a
    // one-shot choice — `handlePremonitionDismiss` drops it from the queue for good —
    // and Escape is the key the player presses to close the action drawer under it.
    // Only the explicit decline button declines. `closeOnEscape={false}` keeps the
    // Stage off the escape registry so that Escape still reaches the drawer (THR-1816).
    <Stage
      kind="premonition"
      vm={vm}
      label={headerText}
      onEscape={IGNORE_IMPLICIT_CLOSE}
      closeOnEscape={false}
      tick={tick}
      ground={`var(${isWhisper ? '--premonition-whisper-bg' : '--premonition-compulsion-bg'})`}
      hoveredOption={hoveredOption}
      optionTone={isWhisper ? 'whisper' : 'compulsion'}
      left={left}
      right={right}
    />
  );
}
