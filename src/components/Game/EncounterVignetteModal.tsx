import { memo, useMemo } from 'react';
import type { EncounterTemplate, EncounterProgress, ThreatRating } from '../../types/encounter';
import type { WorldGraph } from '../../engine/graph';
import type { SphereName } from '../../types/index';
import { THREAT_RATING_COLORS } from '../../types/encounter';
import { generateVignette, classifyForecast } from '../../engine/vignetteProse';
import type { ForecastTier } from '../../engine/vignetteProse';
import { resolveEncounterNarrative } from '../../data/encounter-content';
import { DOMAIN_COLORS, DEFAULT_AGENT_COLOR } from '../../data/agent-visual-content';
import type { ReachDomain } from '../../types/traits';
import { Modal } from '../shared/Modal';
import { StepDots } from '../shared/StepDots';

// ── Constants ──────────────────────────────────────────────────

/** Placeholder success probabilities by threat rating (until real resolution system). */
const THREAT_PROBABILITY: Record<ThreatRating, number> = {
  trivial: 0.90,
  easy: 0.75,
  moderate: 0.50,
  hard: 0.30,
  deadly: 0.10,
};

/** Forecast tier badge colors */
const FORECAST_COLORS: Record<ForecastTier, string> = {
  doomed: '#ef4444',
  perilous: '#f97316',
  uncertain: 'var(--accent-gold)',
  favorable: '#4ade80',
  fated: '#a78bfa',
};

const FORECAST_LABELS: Record<ForecastTier, string> = {
  doomed: 'Doomed',
  perilous: 'Perilous',
  uncertain: 'Uncertain',
  favorable: 'Favorable',
  fated: 'Fated',
};

/** Reach domain display names (capitalized for UI) */
const REACH_DISPLAY_NAMES: Record<ReachDomain, string> = {
  iron: 'Iron',
  gold: 'Gold',
  shadow: 'Shadow',
  veil: 'Veil',
  heart: 'Heart',
  eye: 'Eye',
  stone: 'Stone',
  star: 'Star',
  flesh: 'Flesh',
};

/** Short domain descriptors — complement, don't compete with, encounter narrative */
const REACH_SHORT_DESC: Record<ReachDomain, string> = {
  iron: 'martial prowess',
  gold: 'commerce & wealth',
  shadow: 'stealth & cunning',
  veil: 'arcane arts',
  heart: 'inner conviction',
  eye: 'perception & lore',
  stone: 'endurance & craft',
  star: 'divine attunement',
  flesh: 'bodily resilience',
};

/** Reach domain icons — thematic glyphs for each domain */
const REACH_ICONS: Record<ReachDomain, string> = {
  iron: '⚔',
  gold: '⚖',
  shadow: '🗝',
  veil: '✦',
  heart: '♥',
  eye: '◉',
  stone: '⛰',
  star: '★',
  flesh: '⚕',
};

// ── Types ──────────────────────────────────────────────────────

interface EncounterVignetteModalProps {
  open: boolean;
  onClose: () => void;
  progress: EncounterProgress;
  template: EncounterTemplate;
  agentName: string;
  graph: WorldGraph;
  agentId: string;
  ascendantSphere: SphereName;
  seed: number;
}

// ── Component ──────────────────────────────────────────────────

export const EncounterVignetteModal = memo(function EncounterVignetteModal({
  open,
  onClose,
  progress,
  template,
  agentName,
  graph,
  agentId,
  ascendantSphere,
}: EncounterVignetteModalProps) {
  // Clamp step index to valid range (fail-soft)
  const stepIndex = Math.min(
    progress.currentEncounterIndex,
    template.steps.length - 1,
  );
  const currentStep = template.steps[stepIndex];
  const isOutOfBounds = progress.currentEncounterIndex >= template.steps.length;

  const probability = THREAT_PROBABILITY[template.threatRating] ?? 0.50;
  const forecastTier = classifyForecast(probability);
  const threatColor = THREAT_RATING_COLORS[template.threatRating] ?? '#a78bfa';

  // Generate vignette prose (deterministic — seeded PRNG)
  const vignette = useMemo(() => {
    if (!currentStep) return null;
    try {
      return generateVignette(
        graph,
        agentId,
        template.id,
        currentStep.id,
        ascendantSphere,
        probability,
      );
    } catch (err) {
      console.warn('[EncounterVignetteModal] generateVignette failed:', err);
      return null;
    }
  }, [graph, agentId, template.id, currentStep, ascendantSphere, probability]);

  // Step narrative from encounter content
  const stepNarrative = useMemo(() => {
    if (!currentStep) return null;
    return resolveEncounterNarrative(
      currentStep.narrative,
      agentName,
      currentStep.id,
      template.threatRating,
    );
  }, [currentStep, agentName, template.threatRating]);

  return (
    <Modal open={open} onClose={onClose} maxWidth={560}>
      <Modal.Header onClose={onClose}>
        <div className="flex items-center gap-3">
          <span>{agentName} — {template.name}</span>
          <span
            className="px-2 py-0.5 rounded text-xs font-semibold border"
            style={{
              backgroundColor: 'var(--bg-deep)',
              color: threatColor,
              borderColor: threatColor,
            }}
          >
            {template.threatRating}
          </span>
        </div>
      </Modal.Header>

      <Modal.Body>
        <div className="space-y-5">
          {/* Step Progress */}
          <div
            className="rounded-lg p-3"
            style={{ backgroundColor: 'var(--bg-raised)', border: '1px solid var(--border-gold)' }}
          >
            <div className="flex items-center justify-between mb-2">
              <StepDots
                totalSteps={template.steps.length}
                currentStepIndex={stepIndex}
                size={8}
              />
              <span
                className="text-xs font-medium"
                style={{ color: 'var(--text-secondary)' }}
              >
                Step {stepIndex + 1} of {template.steps.length}
              </span>
            </div>
            {currentStep && !isOutOfBounds ? (
              <>
                <p
                  className="text-sm font-semibold"
                  style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}
                >
                  {currentStep.name}
                </p>
                <ReachBadge reach={currentStep.reach} />
              </>
            ) : (
              <p
                className="text-sm italic"
                style={{ color: 'var(--text-tertiary)' }}
              >
                Encounter concluding…
              </p>
            )}
          </div>

          {/* Vignette sections (only if generation succeeded) */}
          {vignette ? (
            <>
              {/* Scene */}
              <VignetteSection label="Scene">
                {vignette.scene}
              </VignetteSection>

              {/* Lens */}
              <VignetteSection label="Lens">
                {vignette.lens}
              </VignetteSection>

              {/* Stakes */}
              <VignetteSection label="Stakes">
                {vignette.stakes}
              </VignetteSection>

              {/* Forecast */}
              <VignetteSection label="Forecast">
                <div className="flex items-center gap-2">
                  <span
                    className="px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider"
                    style={{
                      color: FORECAST_COLORS[forecastTier],
                      backgroundColor: FORECAST_COLORS[forecastTier] + '20',
                    }}
                  >
                    {FORECAST_LABELS[forecastTier]}
                  </span>
                  <span
                    className="text-sm"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {vignette.forecast}
                  </span>
                </div>
              </VignetteSection>
            </>
          ) : null}

          {/* Step Narrative (always shown if available — fallback when vignette fails) */}
          {stepNarrative && (
            <VignetteSection label="Step Narrative">
              {stepNarrative}
            </VignetteSection>
          )}
        </div>
      </Modal.Body>

      <Modal.Footer>
        <button
          onClick={onClose}
          className="px-4 py-1.5 rounded text-sm font-medium transition-colors"
          style={{
            backgroundColor: 'var(--bg-raised)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-gold)',
          }}
        >
          Close
        </button>
      </Modal.Footer>
    </Modal>
  );
});

// ── Helper sub-component ───────────────────────────────────────

function ReachBadge({ reach }: { reach: ReachDomain }) {
  const color = DOMAIN_COLORS[reach] ?? DEFAULT_AGENT_COLOR;
  const icon = REACH_ICONS[reach] ?? '●';
  const displayName = REACH_DISPLAY_NAMES[reach] ?? reach;
  const desc = REACH_SHORT_DESC[reach] ?? reach;

  return (
    <div className="flex items-center gap-2 mt-1.5">
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider"
        style={{
          color,
          backgroundColor: color + '20',
          border: `1px solid ${color}40`,
        }}
      >
        <span>{icon}</span>
        <span>{displayName}</span>
      </span>
      <span
        className="text-xs italic"
        style={{ color: 'var(--text-secondary)' }}
      >
        {desc}
      </span>
    </div>
  );
}

function VignetteSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p
        className="text-xs font-semibold uppercase tracking-wider mb-1.5"
        style={{ color: 'var(--text-tertiary)' }}
      >
        {label}
      </p>
      <div
        className="text-sm leading-relaxed"
        style={{ color: 'var(--text-primary)' }}
      >
        {children}
      </div>
    </div>
  );
}
