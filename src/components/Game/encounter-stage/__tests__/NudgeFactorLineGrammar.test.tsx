// @vitest-environment jsdom
/**
 * The factor lines a player actually reads on the scene screen — THR-1494.
 *
 * THR-1478 moved the factor block **above** the prose, so the first sentence
 * under the agent's name was "Vara is oracle in eye." and, beside it, the bare
 * fragment "threads shifting". Both were producer defects; `NudgeBalance`
 * renders `factor.text` verbatim and is not touched here.
 *
 * These are render assertions on the real component, driven by the real
 * `buildNudgePhaseModel` — the sanctioned browser-verify substitution for an
 * unattended run, which cannot start a dev server
 * (`Docs/canon/verification-gates.md` § Browser-verify; impediments #546, #574).
 * The exhaustive per-reach sweep over the vocabulary lives on the producer, in
 * `src/engine/encounters/__tests__/skillFactorLineGrammar.test.ts`; what this
 * file proves is that the corrected sentence reaches the DOM.
 */

import { describe, expect, it } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { WorldGraph } from '../../../../engine/graph';
import type { GameState } from '../../../../types/gameState';
import type {
  ActionStep,
  UnifiedAction,
  UnifiedActionTemplate,
} from '../../../../types/unifiedAction';
import type { ReachDomain } from '../../../../types/traits';
import { buildNudgePhaseModel } from '../adapters/buildNudgePhaseModel';
import { NudgePhaseShell } from '../shells/NudgePhaseShell';

/** Well past the sigmoid's knee, so the actor lands in the top tier word. */
const TOP_TIER_RAW = 40;

function buildStep(reach: ReachDomain, authored: boolean): ActionStep {
  return {
    reach,
    duration: { min: 1, max: 2 },
    difficulty: 0.5,
    onSuccess: [],
    onFailure: [],
    failBehavior: 'continue_weakened',
    narrativeTemplate: 'The family waits on the step, and does not come in.',
    nudges: [
      {
        id: 'steady_hand',
        name: 'Steady the hand',
        essenceCost: 1,
        forecastDelta: 0.08,
        effectLine: 'Steadier than she was.',
      },
    ],
    // Omitted entirely on the `authored: false` arm, which is what sends the
    // adapter down the contract fallback — the path that produced the fragment.
    ...(authored
      ? { factorLines: [{ text: 'The ledger was signed twice.', polarity: 'against' as const }] }
      : {}),
  };
}

function buildTemplate(reach: ReachDomain, authored: boolean): UnifiedActionTemplate {
  return {
    id: `test.factor_grammar_${reach}_${authored ? 'authored' : 'fallback'}`,
    rarityTier: 1,
    intrinsicTier: 'background',
    name: 'The Swindled Family',
    reach,
    crudType: 'read',
    scale: 'local',
    steps: [buildStep(reach, authored)],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ['courage_prudence'],
    narrativeTemplates: {
      initiation: 'The family waits on the step, and does not come in.',
      success: 'They are paid.',
      failure: 'They are not.',
    },
  };
}

function buildGraph(reach: ReachDomain): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({
    id: 'agent.vara',
    type: 'actor',
    name: 'Vara',
    properties: {
      actorType: 'individual',
      domainCapabilities: { [reach]: TOP_TIER_RAW },
    },
  });
  graph.addNode({ id: 'loc.step', type: 'location', name: 'The Doorstep', properties: {} });
  return graph;
}

function buildAction(template: UnifiedActionTemplate): UnifiedAction {
  return {
    actionId: `ua_${template.id}`,
    actorId: 'agent.vara',
    templateId: template.id,
    targetId: 'loc.step',
    scale: 'local',
    source: 'agent',
    startTick: 3,
    currentStep: 0,
    stepProgress: 0,
    stepDuration: 2,
    resolved: false,
    stepOutcomes: [],
  };
}

function renderFor(reach: ReachDomain, authored = true) {
  const template = buildTemplate(reach, authored);
  const step = template.steps[0];
  const phase = buildNudgePhaseModel({
    template,
    activeAction: buildAction(template),
    step,
    graph: buildGraph(reach),
    gameState: {
      essencePool: { force: 3 } as unknown as GameState['essencePool'],
      unlockedActionIds: [],
    } as GameState,
  })!;
  render(<NudgePhaseShell phase={phase} onCommit={() => {}} />);
  return phase;
}

describe('scene-screen factor lines read as sentences (THR-1494)', () => {
  it('renders the noun tier word with its article — the exact line the ticket found', () => {
    renderFor('eye');
    const text = screen.getByTestId('nudge-factor-skill:eye').textContent ?? '';

    // The defect, verbatim from the ticket's DOM read.
    expect(text).not.toContain('Vara is oracle in eye');
    expect(text).toContain('Vara is an oracle in Eye.');
    cleanup();
  });

  it('leaves an adjective tier word article-less', () => {
    renderFor('iron');
    const text = screen.getByTestId('nudge-factor-skill:iron').textContent ?? '';

    expect(text).toContain('Vara is legendary in Iron.');
    expect(text).not.toContain('is a legendary');
    cleanup();
  });

  it('names the reach as a domain on every reach the stage can render', () => {
    const reaches: ReachDomain[] = [
      'iron', 'gold', 'shadow', 'veil', 'heart', 'eye', 'stone', 'star',
    ];
    for (const reach of reaches) {
      renderFor(reach);
      const text = screen.getByTestId(`nudge-factor-skill:${reach}`).textContent ?? '';
      const label = reach.charAt(0).toUpperCase() + reach.slice(1);
      expect(text, `reach ${reach}`).toContain(` in ${label}.`);
      expect(text, `reach ${reach}`).not.toContain(` in ${reach}.`);
      cleanup();
    }
  });

  it('renders the unauthored forecast factor as a sentence, not a fragment', () => {
    // The `authored:0` half. With no `factorLines` on the step the adapter falls
    // through to the contract's default pool, which shipped a bare fragment.
    const phase = renderFor('eye', false);
    const authored = phase.testPanel.factors.filter((f) => f.id.startsWith('authored:'));
    expect(authored.length, 'fallback produced no authored line — arm is vacuous').toBeGreaterThan(0);

    for (const factor of authored) {
      const text = screen.getByTestId(`nudge-factor-${factor.id}`).textContent ?? '';
      expect(text).not.toContain('threads shifting,');
      expect(text.trim().endsWith('.'), `factor ${factor.id}: "${text}"`).toBe(true);
    }
    cleanup();
  });
});
