// @vitest-environment jsdom
/**
 * THR-2023 — browser-verify substitution (jsdom-render): the person sheet's debt tiles,
 * rendered through the real `Section` from the real slots resolver, after a real Loan band.
 * The borrower's tile says *Owes {lender}*, the lender's *Is owed by {borrower}*, the kind
 * word carries the debt tooltip, and neither says the old "Bound to".
 */

import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { Section } from '../Section';
import { applyEncounterAftermathReaction } from '../../../engine/encounterAftermath';
import { createSimulationRuntime } from '../../../engine/simulationRuntime';
import { PERSON_RESOLVERS, DEBT_TOOLTIP_ID } from '../../../engine/views/subjects/personRows';
import { getUnifiedTemplateById } from '../../../data/unified-action-templates';
import { initializeGameState, MAP_SIZE_PRESETS } from '../../../engine/gameInit';
import { createBalancedCosmology } from '../../../engine/cosmology';
import { generateArchetypes } from '../../../engine/ascendant';
import type { GameState } from '../../../types/gameState';
import type { UnifiedAction, UnifiedActionTemplate } from '../../../types/unifiedAction';
import type { Section as DetailSection, CardTile } from '../../../types/detailPage';

function worldWithLoan(): { state: GameState; lender: string; borrower: string } {
  const preset = MAP_SIZE_PRESETS.small;
  const { state } = initializeGameState(generateArchetypes(4, 42)[0], 'DebtSheet', createBalancedCosmology(), 42, preset.cols, preset.rows);
  const [lender, borrower] = state.graph.getNodesByType('actor')
    .filter(n => n.properties.actorType === 'individual')
    .map(n => n.id);
  const template = getUnifiedTemplateById('encounter.the_loan') as UnifiedActionTemplate;
  const action = {
    actionId: 'ua_loan', actorId: lender, templateId: template.id, targetId: lender,
    scale: 'personal', source: 'agent', startTick: 1, currentStep: 0, stepProgress: 1, stepDuration: 1,
    resolved: true, outcome: 'success', stepOutcomes: [],
    supportBindings: [{ key: 'borrower', nodeId: borrower, kind: 'actor', delivery: 'lazy-materialize-on-trigger', persistence: 'must-persist', reused: true }],
  } as unknown as UnifiedAction;
  const { state: next } = applyEncounterAftermathReaction(
    state, action,
    { id: 'loan:outcome:success', label: 'Outcome', effects: template.outcomeEffects!.success!, actionOutcome: 'success' },
    state.tick, createSimulationRuntime(),
  );
  // The sheet shows attachments at intimate familiarity and above: the god knows both well.
  const familiarityMap = new Map(state.familiarityMap ?? []);
  familiarityMap.set(lender, 1000);
  familiarityMap.set(borrower, 1000);
  return { state: { ...next, familiarityMap } as GameState, lender, borrower };
}

function slotsFor(state: GameState, nodeId: string): DetailSection {
  const section = PERSON_RESOLVERS.slots({ nodeId, pageKind: 'actor', graph: state.graph, seed: 42, tick: state.tick, state });
  if (!section) throw new Error(`no slots section for ${nodeId}`);
  return section as DetailSection;
}

describe('THR-2023 — the sheet says which way a debt runs', () => {
  const { state, lender, borrower } = worldWithLoan();
  const lenderName = state.graph.getNode(lender)!.name;
  const borrowerName = state.graph.getNode(borrower)!.name;

  it("the borrower's sheet reads Owes {lender}", () => {
    const { container, unmount } = render(<Section section={slotsFor(state, borrower)} />);
    expect(screen.getByText(`Owes ${lenderName}`)).toBeTruthy();
    expect(container.textContent).not.toContain(`Bound to ${lenderName}`);
    unmount();
  });

  it("the lender's sheet reads Is owed by {borrower}", () => {
    const { container, unmount } = render(<Section section={slotsFor(state, lender)} />);
    expect(screen.getByText(`Is owed by ${borrowerName}`)).toBeTruthy();
    expect(container.textContent).not.toContain(`Bound to ${borrowerName}`);
    unmount();
  });

  it('the debt tile carries the debt tooltip on its kind word', () => {
    const section = slotsFor(state, borrower) as Extract<DetailSection, { kind: 'cards' }>;
    const tile = section.tiles.find((t: CardTile) => t.lines.includes(`Owes ${lenderName}`));
    expect(tile?.kindWordTooltipId).toBe(DEBT_TOOLTIP_ID);
  });
});

void React;
