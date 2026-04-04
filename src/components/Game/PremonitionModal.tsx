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
import type { PremonitionEvent, WhisperNudge, CompulsionCandidate } from '../../types/premonition';
import type { EssencePool } from '../../types/influence';
import type { SphereName } from '../../types';
import { SPHERE_COLORS, QUINTESSENCE_COLOR } from '../../data/premonition-constants';

// ─── Props ──────────────────────────────────────────────────────

interface PremonitionModalProps {
  open: boolean;
  premonition: PremonitionEvent;
  essencePool: EssencePool;
  onWhisperChoice: (nudge: WhisperNudge) => void;
  onCompulsionChoice: (candidate: CompulsionCandidate) => void;
  onDismiss: () => void;
}

// ─── Helpers ────────────────────────────────────────────────────

function getSphereColor(sphere: SphereName | undefined): string {
  if (!sphere) return '#888';
  return SPHERE_COLORS[sphere] ?? '#888';
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
  onClick,
}: {
  nudge: WhisperNudge;
  affordable: boolean;
  onClick: () => void;
}) {
  const color = nudge.category === 'gather_strength'
    ? QUINTESSENCE_COLOR
    : getSphereColor(nudge.sphere);

  return (
    <button
      className="w-full text-left rounded-md border transition-all duration-200 hover:brightness-125 disabled:opacity-40 disabled:cursor-not-allowed"
      style={{
        borderColor: `${color}40`,
        background: `${color}08`,
        padding: '12px 16px',
      }}
      disabled={!affordable}
      onClick={onClick}
    >
      <div className="flex justify-between items-center">
        <span className="text-sm" style={{ color: `${color}dd` }}>
          {nudge.prose}
        </span>
        <span className="text-xs ml-2 whitespace-nowrap" style={{ color }}>
          {nudge.essenceCost} essence
        </span>
      </div>
      <div className="text-xs mt-1 opacity-50">
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
      className="w-full text-left rounded-md border transition-all duration-200 hover:brightness-125 disabled:opacity-40 disabled:cursor-not-allowed"
      style={{
        borderColor: `${color}40`,
        background: `${color}08`,
        padding: '12px 16px',
      }}
      disabled={!affordable}
      onClick={onClick}
    >
      <div className="flex justify-between items-center">
        <span className="text-sm" style={{ color: `${color}dd` }}>
          {candidate.encounterName}
        </span>
        <span className="text-xs opacity-50">
          {capitalize(candidate.reach)} &middot; Threat {candidate.threatRating}
        </span>
      </div>
      <div className="flex justify-between items-center mt-1">
        <span className="text-xs opacity-50">
          {candidate.encounterHook}
        </span>
        <span className="text-xs ml-2 whitespace-nowrap" style={{ color }}>
          {candidate.essenceCost} essence
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
  onWhisperChoice,
  onCompulsionChoice,
  onDismiss,
}: PremonitionModalProps) {
  const isWhisper = premonition.type === 'whisper';

  const headerText = isWhisper ? 'A Stirring in the Thread' : "The God's Will";
  const headerColor = isWhisper ? 'rgba(180,160,200,0.5)' : 'rgba(200,140,140,0.6)';
  const dismissText = isWhisper ? 'Let the dream fade' : 'Release your hold \u2014 let them choose';

  // Gradient based on type
  const bgGradient = isWhisper
    ? 'linear-gradient(180deg, #1a1520 0%, #2a2035 100%)'
    : 'linear-gradient(180deg, #201518 0%, #302028 100%)';

  return (
    <Modal open={open} onClose={onDismiss} maxWidth={520} aria-label={headerText}>
      <div
        className="rounded-lg overflow-hidden"
        style={{
          background: bgGradient,
          color: isWhisper ? '#c8b8d8' : '#d8c0c8',
          fontFamily: 'Georgia, "Times New Roman", serif',
        }}
      >
        {/* Header */}
        <div className="text-center pt-5 pb-2">
          <div
            className="text-[11px] uppercase tracking-[3px]"
            style={{ color: headerColor }}
          >
            {headerText}
          </div>
          <div className="text-xs opacity-40 mt-1">
            {premonition.agentName}
          </div>
        </div>

        {/* Vignette */}
        <div className="px-6 pb-4">
          <div
            className="italic leading-relaxed text-sm"
            style={{
              borderLeft: `2px solid ${isWhisper ? 'rgba(180,160,200,0.3)' : 'rgba(200,140,140,0.4)'}`,
              padding: '12px 16px',
            }}
          >
            {premonition.vignetteProse}
          </div>
        </div>

        {/* Context line */}
        <div className="px-6 pb-3">
          <div className="text-xs opacity-50">
            {isWhisper
              ? 'You sense currents pulling at your mortal:'
              : 'They weigh their options. You may tip the scales:'}
          </div>
        </div>

        {/* Options */}
        <div className="px-6 pb-4 flex flex-col gap-2.5">
          {isWhisper && premonition.whisperOptions?.map((nudge, i) => (
            <WhisperOptionRow
              key={`whisper-${i}`}
              nudge={nudge}
              affordable={canAfford(essencePool, nudge.sphere, nudge.essenceCost)}
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
          <button
            className="text-xs opacity-40 hover:opacity-70 transition-opacity cursor-pointer bg-transparent border-none"
            style={{ color: isWhisper ? '#c8b8d8' : '#d8c0c8' }}
            onClick={onDismiss}
          >
            {dismissText}
          </button>
        </div>
      </div>
    </Modal>
  );
}
