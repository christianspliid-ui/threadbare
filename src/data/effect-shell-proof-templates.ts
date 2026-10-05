/**
 * Effect Shell Proof Pack — minimal authored content exercising stateful shell primitives.
 *
 * Covers: flip_table (step_outcome trigger), duplicate-gain policy (via possessions),
 * and result_band structure. Used in engine tests and as reference for content authors.
 *
 * Design doc: Docs/plans/2026-04-19-content-architecture-phase-2-stateful-shells.md
 * Linear: THR-53
 */

import type { UnifiedActionTemplate } from '../types/unifiedAction';

// ─── Flip Table Proof ────────────────────────────────────────────────────────

/**
 * Two-step encounter: step 0 resolves normally, step 1 success flips a fate card
 * from 'front' → 'flipped'. On a second trigger the same card goes 'flipped' → 'revealed'
 * and a variant ('boon' or 'bane') is drawn deterministically.
 */
export const FATE_CARD_TRIAL_TEMPLATE: UnifiedActionTemplate = {
  id: 'encounter.shell_proof.fate_card_trial',
  stakes: {
    goal: 'endure the ordeal until the card turns',
    risk: 'break in the ordeal before the card turns',
    won: 'endured the ordeal and saw the card turn',
    lost: 'broke in the ordeal before the card turned',
  },
  name: 'Trial of the Fate Card',
  description: 'An ordeal whose ending is sealed in a fate card and turned over only at the close.',
  sphere: 'mind',
  reach: 'resolve',
  scale: 'personal',
  source: 'agent',
  actorAffinities: ['individual'],
  steps: [
    {
      reach: 'resolve',
      difficulty: 0.5,
      duration: { min: 2, max: 4 },
      onSuccess: [],
      onFailure: [],
      narrativeTemplate: 'The first trial: steeling oneself for what lies beneath the card.',
    },
    {
      reach: 'resolve',
      difficulty: 0.6,
      duration: { min: 3, max: 5 },
      onSuccess: [],
      onFailure: [],
      narrativeTemplate: 'The ordeal concludes. The card turns.',
    },
  ],
  narrativeTemplates: {
    initiation: 'The trial begins.',
    success: 'The card revealed its truth.',
    failure: 'The ordeal broke them before the card could speak.',
  },
  targetCategory: 'self',
  essenceCost: 0,
  rarityTier: 1,
  intrinsicTier: 'background',
  flipTables: [
    {
      id: 'fate_card',
      variants: [
        { key: 'boon', weight: 1, label: 'Boon — fortune favors the steadfast' },
        { key: 'bane', weight: 1, label: 'Bane — the odds were never in their favor' },
      ],
      initialState: 'front',
      flipTrigger: {
        kind: 'step_outcome',
        stepIndex: 1,
        outcomes: ['success', 'critical_success'],
      },
      revealPolicy: 'on_trigger',
      persistence: 'must-persist',
    },
  ],
};

/**
 * Single-step encounter with immediate reveal: the variant is picked at first trigger
 * (front → flipped), not deferred to a second trigger.
 */
export const RECKLESS_WAGER_TEMPLATE: UnifiedActionTemplate = {
  id: 'encounter.shell_proof.reckless_wager',
  stakes: {
    goal: 'win the reckless wager',
    risk: 'lose the wager and walk away in debt',
    won: 'won the reckless wager',
    lost: 'lost the wager',
  },
  name: 'The Reckless Wager',
  description: 'One bold gamble, decided the moment the dice leave the hand.',
  sphere: 'fortune',
  reach: 'resolve',
  scale: 'personal',
  source: 'agent',
  actorAffinities: ['individual'],
  steps: [
    {
      reach: 'resolve',
      difficulty: 0.55,
      duration: { min: 1, max: 2 },
      onSuccess: [],
      onFailure: [],
      narrativeTemplate: 'The wager is placed.',
    },
  ],
  narrativeTemplates: {
    initiation: 'The wager is struck.',
    success: 'The gamble paid off.',
    failure: 'The gamble was lost.',
  },
  targetCategory: 'self',
  essenceCost: 0,
  rarityTier: 1,
  intrinsicTier: 'background',
  flipTables: [
    {
      id: 'wager_card',
      variants: [
        { key: 'windfall', weight: 2, label: 'Windfall' },
        { key: 'debt',     weight: 1, label: 'Debt' },
      ],
      initialState: 'front',
      flipTrigger: {
        kind: 'step_outcome',
        stepIndex: 0,
        outcomes: ['success', 'critical_success', 'failure', 'critical_failure'],
      },
      revealPolicy: 'immediate',
      persistence: 'must-persist',
    },
  ],
};

// ─── Result Band Proof ────────────────────────────────────────────────────────

/**
 * Encounter that declares result bands — useful for future result band selection tests.
 * The runtime hooks for result bands are defined in effectShellRuntime but not yet
 * wired into executeStepResult (deferred to follow-on content work).
 */
export const TIERED_PROVING_TEMPLATE: UnifiedActionTemplate = {
  id: 'encounter.shell_proof.tiered_proving',
  stakes: {
    goal: 'pass the proving ground',
    risk: 'fall on the proving ground',
    won: 'passed the proving ground',
    lost: 'fell on the proving ground',
  },
  name: 'Tiered Proving Ground',
  description: 'A proving that pays out by how decisively it is won.',
  sphere: 'force',
  reach: 'combat',
  scale: 'personal',
  source: 'agent',
  actorAffinities: ['individual'],
  steps: [
    {
      reach: 'combat',
      difficulty: 0.5,
      duration: { min: 3, max: 6 },
      onSuccess: [],
      onFailure: [],
      narrativeTemplate: 'The proving ground awaits.',
    },
  ],
  narrativeTemplates: {
    initiation: 'The proving begins.',
    success: 'The ground has been proven.',
    failure: 'The proving ground claimed them.',
  },
  targetCategory: 'self',
  essenceCost: 0,
  rarityTier: 1,
  intrinsicTier: 'background',
  resultBands: [
    {
      id: 'master',
      threshold: 20,
      label: 'Master',
      outcomeBand: 'critical_success',
      effects: [],
    },
    {
      id: 'adept',
      threshold: 10,
      label: 'Adept',
      outcomeBand: 'success',
      effects: [],
    },
    {
      id: 'novice',
      threshold: 0,
      label: 'Novice',
      outcomeBand: 'success_at_cost',
      effects: [],
    },
  ],
};

export const EFFECT_SHELL_PROOF_TEMPLATES: readonly UnifiedActionTemplate[] = [
  FATE_CARD_TRIAL_TEMPLATE,
  RECKLESS_WAGER_TEMPLATE,
  TIERED_PROVING_TEMPLATE,
];
