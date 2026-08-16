/**
 * PremonitionModal — Divine premonition UI for Whisper and Compulsion.
 *
 * Whisper: dreamlike vignette + 2-3 contextual nudge options.
 * Compulsion: forceful vignette + 3-4 encounter candidates from agent's shortlist.
 *
 * Colors follow the nudge target's sphere from the cosmology model.
 *
 * @see Docs/plans/2026-04-04-divine-premonition-design.md
 */

import { useMemo } from 'react';
import { Modal } from '../shared/Modal';
import { EntityVisual } from '../shared/EntityVisual';
import { Tooltip } from '../shared/Tooltip';
import type { PremonitionEvent, WhisperNudge, CompulsionCandidate } from '../../types/premonition';
import type { EssencePool } from '../../types/influence';
import type { SphereName } from '../../types';
import type { WorldGraph } from '../../engine/graph';
import { resolveTooltip, type TooltipResolverContext } from '../../engine/tooltipResolver';
import { SPHERE_COLORS, QUINTESSENCE_COLOR } from '../../data/premonition-constants';
import { formatEssence } from '../shared/formatEssence';

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
  /** Opens the subject's character sheet *over* this modal — never dismisses it. */
  onViewAgent?: () => void;
  onDismiss: () => void;
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
 * Sphere-tinted option chrome. `color-mix` rather than the hex-suffix
 * concatenation this file used (`${color}40`), which silently produced invalid
 * CSS the moment `color` was not a 6-digit hex — the no-sphere fallback was
 * `'#888'`, so that path was emitting `#88840` and painting nothing. The
 * percentages reproduce the shipped alphas (0x40 ≈ 25%, 0x08 ≈ 3%, 0xdd ≈ 87%).
 */
const OPTION_BORDER_PCT = 25;
const OPTION_BG_PCT = 3;
const OPTION_TEXT_PCT = 87;
const tint = (color: string, pct: number) => `color-mix(in srgb, ${color} ${pct}%, transparent)`;

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

// ─── Helpers ────────────────────────────────────────────────────

function getSphereColor(sphere: SphereName | undefined): string {
  if (!sphere) return SPHERE_FALLBACK;
  return SPHERE_COLORS[sphere] ?? SPHERE_FALLBACK;
}

function canAfford(essencePool: EssencePool, sphere: SphereName, cost: number): boolean {
  return (essencePool[sphere] ?? 0) >= cost;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ─── Whisper Option Row ─────────────────────────────────────────

function WhisperOptionRow({
  nudge,
  affordable,
  isWhisper,
  onClick,
}: {
  nudge: WhisperNudge;
  affordable: boolean;
  isWhisper: boolean;
  onClick: () => void;
}) {
  const color = nudge.category === 'gather_strength'
    ? QUINTESSENCE_COLOR
    : getSphereColor(nudge.sphere);

  return (
    <button
      className="w-full text-left rounded-md border transition-colors duration-200 hover:brightness-125 disabled:opacity-40 disabled:cursor-not-allowed"
      style={{
        borderColor: tint(color, OPTION_BORDER_PCT),
        background: tint(color, OPTION_BG_PCT),
        padding: '12px 16px',
      }}
      disabled={!affordable}
      onClick={onClick}
    >
      <div className="flex justify-between items-center">
        <span className="text-sm" style={{ color: tint(color, OPTION_TEXT_PCT) }}>
          {nudge.prose}
        </span>
        <span className="text-xs ml-2 whitespace-nowrap" style={{ color }}>
          {formatEssence(nudge.essenceCost)} essence
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
}: {
  candidate: CompulsionCandidate;
  affordable: boolean;
  onClick: () => void;
}) {
  const color = getSphereColor(candidate.sphere);

  return (
    <button
      className="w-full text-left rounded-md border transition-colors duration-200 hover:brightness-125 disabled:opacity-40 disabled:cursor-not-allowed"
      style={{
        borderColor: tint(color, OPTION_BORDER_PCT),
        background: tint(color, OPTION_BG_PCT),
        padding: '12px 16px',
      }}
      disabled={!affordable}
      onClick={onClick}
    >
      {/* Retcon prose — the main content. Law 45: `opacity-70` on the option's
          own subject was the lowest-contrast reading on the surface. */}
      <div className="text-sm leading-relaxed italic" style={{ color: fullText(false) }}>
        {candidate.encounterHook}
      </div>
      {/* Mechanical footer — encounter kind and distance are information. */}
      <div className="flex justify-between items-center mt-2">
        <span className="text-xs" style={{ color: dimText(false) }}>
          {capitalize(candidate.encounterType)}
          {candidate.hexDistance > 0 ? ` · ${candidate.hexDistance} hex away` : ''}
        </span>
        <span className="text-xs whitespace-nowrap" style={{ color }}>
          {formatEssence(candidate.essenceCost)} essence
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
}: PremonitionModalProps) {
  const isWhisper = premonition.type === 'whisper';

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

  const headerText = isWhisper ? 'A Stirring in the Thread' : "The God's Will";
  const dismissText = isWhisper ? 'Let the dream fade' : 'Release your hold \u2014 let them choose';

  return (
    <Modal open={open} onClose={onDismiss} maxWidth={520} aria-label={headerText}>
      <div
        className="rounded-lg overflow-hidden"
        style={{
          background: `var(${isWhisper ? '--premonition-whisper-bg' : '--premonition-compulsion-bg'})`,
          color: fullText(isWhisper),
          fontFamily: 'var(--font-prose)',
        }}
      >
        {/* Header */}
        <div className="text-center pt-5 pb-2 flex flex-col items-center">
          {/* Law 1 — the subject carries its image. Entity Visual Header pattern
              (THR-637); the resolver is knowledge-gated but fail-open when no
              level is passed, and a threaded mortal always resolves to art or
              the authored fallback tile. Clicking it does what the name does. */}
          <EntityVisual
            size="portrait"
            shape="rounded"
            entity={{ id: premonition.agentId, kind: 'agent', name: premonition.agentName }}
            graph={graph ?? null}
            onClick={onViewAgent}
            aria-label={
              onViewAgent
                ? `Open the character sheet for ${premonition.agentName}`
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
          <div
            className="text-[11px] uppercase tracking-[3px]"
            style={{ color: accent(isWhisper, '--premonition-accent-text-alpha') }}
          >
            {headerText}
          </div>
          {/* Law 45: was `opacity-40` (~2.5:1 composed). Which mortal the
              premonition is about is the one thing on this surface that cannot
              be inferred from anything else on it.
              Law 21/20: the name is the link to the mortal's page, and the
              tooltip is the hover tier above it. */}
          <Tooltip label={subjectTooltip?.label} desc={subjectTooltip?.desc}>
            {onViewAgent ? (
              <button
                type="button"
                onClick={onViewAgent}
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

        {/* Vignette */}
        <div className="px-6 pb-4">
          <div
            className="italic leading-relaxed text-sm"
            style={{
              borderLeft: `2px solid ${accent(isWhisper, '--premonition-accent-rule-alpha')}`,
              padding: '12px 16px',
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
            />
          ))}
          {!isWhisper && premonition.compulsionCandidates?.map((candidate, i) => (
            <CompulsionOptionRow
              key={`compulsion-${i}`}
              candidate={candidate}
              affordable={canAfford(essencePool, candidate.sphere, candidate.essenceCost)}
              onClick={() => onCompulsionChoice(candidate)}
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
            onClick={onDismiss}
          >
            {dismissText}
          </button>
        </div>
      </div>
    </Modal>
  );
}
