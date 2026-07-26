/**
 * THR-741: the five destructive player-castable workings now author aftermath reactions,
 * so the Divine Receipt's choice row (THR-727) is no longer empty for them.
 *
 * Three seams are asserted here, in the order the content flows through them:
 *  1. Content shape — every tranche template carries the config, the vocabulary is the
 *     shipped one, tally keys are valid, labels stay plain (interactive text).
 *  2. Effect application — a claim reaction lands the reach-polarity tally on the ascendant
 *     node and a chronicle-significance ripple; a conceal reaction plants the concealed mark
 *     with reveal families that a later divine working can match.
 *  3. Receipt tier — a resolved player cast carrying the authored reactions surfaces as the
 *     modal receipt with the reaction row populated.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../graph';
import { applyEncounterAftermathReaction } from '../encounterAftermath';
import { processPlayerReceipts } from '../playerReceipts';
import { clearTraces, enableTracing, disableTracing } from '../traceBuffer';
import { createSimulationRuntime, type SimulationRuntime } from '../simulationRuntime';
import { getUnifiedTemplateById } from '../../data/unified-action-templates';
import {
  DIVINE_WORKING_AFTERMATH,
  DIVINE_WORKING_CLAIMED_TALLY,
  DIVINE_WORKING_CONCEALED_TALLY,
  DIVINE_WORKING_CLAIMED_SIGNIFICANCE,
  DIVINE_WORKING_MARK_SEVERITY_HEAVY,
  DIVINE_WORKING_REVEAL_FAMILIES,
} from '../../data/divine-working-aftermath';
import { REACH_DOMAINS } from '../../types/traits';
import type { GameState } from '../../types/gameState';
import type {
  EncounterAftermathReaction,
  EncounterAftermathReactionEffect,
  UnifiedAction,
} from '../../types/unifiedAction';

const TRANCHE_IDS = Object.keys(DIVINE_WORKING_AFTERMATH);

/** The effect kinds this tranche is allowed to use — all shipped, all with live consumers. */
const ALLOWED_EFFECT_KINDS = new Set(['reputation_tally', 'recent_event', 'hidden_mark']);

const VALID_TALLY_KEYS = new Set(REACH_DOMAINS.flatMap(d => [`${d}.positive`, `${d}.negative`]));

function reactionsOf(templateId: string): readonly EncounterAftermathReaction[] {
  const config = DIVINE_WORKING_AFTERMATH[templateId];
  return config.fallback.reactions ?? [];
}

function reactionById(templateId: string, reactionId: string): EncounterAftermathReaction {
  const found = reactionsOf(templateId).find(r => r.id === reactionId);
  if (!found) throw new Error(`no reaction ${reactionId} on ${templateId}`);
  return found;
}

/** Minimal state: an ascendant actor node (the tally/mark host) and a hex-anchored target. */
function buildState(): GameState {
  const graph = new WorldGraph();
  graph.addNode({
    id: 'actor-hero', type: 'actor', name: 'The Ascendant',
    properties: { actorType: 'ascendant' },
  });
  graph.addNode({ id: 'loc-target', type: 'location', name: 'Ashfall', properties: { hexCol: 4, hexRow: 7 } });
  return {
    tick: 50, seed: 42, cycle: 1, phase: 'playing', graph,
    cosmology: {} as never, tiles: [], clock: {} as never,
    ascendantId: 'actor-hero', essencePool: {} as never,
    mandateDefinition: null, mandateState: null,
    rivalDefinitions: [], rivalStates: [],
    doomDefinition: {} as never, doomClock: {} as never,
    tickEvents: [], recentEvents: [], chronicleEntries: [],
    stealthExposure: 0, visibilityMap: {} as never, familiarityMap: {} as never,
    culturalInsightMap: new Map(), agentKnowledge: new Map(),
    encounterProgress: [], actionsInProgress: [], unifiedActions: [],
    hiddenMarks: [], intelligenceRecords: [],
    worldSoul: {} as never, echoDefinitions: [], echoStates: [],
    chronicle: {} as never, encounterNotifications: [],
    clearanceGateStates: new Map(),
  } as unknown as GameState;
}

function makePlayerAction(templateId: string, targetId = 'loc-target'): UnifiedAction {
  return {
    actionId: 'ua_thr741', actorId: 'actor-hero', templateId, targetId,
    scale: 'regional', source: 'player',
    startTick: 48, currentStep: 0, stepProgress: 1, stepDuration: 1,
    resolved: true, outcome: 'success', stepOutcomes: [],
    essencePaid: 7, completedAtTick: 50,
  } as UnifiedAction;
}

describe('divine-working aftermath — content shape (THR-741)', () => {
  it('wires an aftermathConfig onto every template in the tranche', () => {
    expect(TRANCHE_IDS.length).toBeGreaterThan(0);
    for (const id of TRANCHE_IDS) {
      const template = getUnifiedTemplateById(id);
      expect(template, `template ${id} exists in the registry`).toBeDefined();
      expect(template!.aftermathConfig, `${id} carries an aftermathConfig`).toBe(DIVINE_WORKING_AFTERMATH[id]);
    }
  });

  it('authors 2–3 reactions per template, each with a prompt, intent and at least one effect', () => {
    for (const id of TRANCHE_IDS) {
      const config = DIVINE_WORKING_AFTERMATH[id];
      expect(config.fallback.reactionPrompt, `${id} reaction prompt`).toBeTruthy();
      const reactions = reactionsOf(id);
      expect(reactions.length, `${id} reaction count`).toBeGreaterThanOrEqual(2);
      expect(reactions.length, `${id} reaction count`).toBeLessThanOrEqual(3);
      for (const reaction of reactions) {
        expect(reaction.intent, `${id}/${reaction.id} intent`).toBeTruthy();
        expect(reaction.effects.length, `${id}/${reaction.id} effect count`).toBeGreaterThan(0);
      }
    }
  });

  it('uses only shipped effect kinds and valid reach-polarity tally keys', () => {
    for (const id of TRANCHE_IDS) {
      for (const reaction of reactionsOf(id)) {
        for (const effect of reaction.effects) {
          expect(ALLOWED_EFFECT_KINDS.has(effect.kind), `${id}/${reaction.id}: ${effect.kind}`).toBe(true);
          if (effect.kind === 'reputation_tally') {
            expect(VALID_TALLY_KEYS.has(effect.key), `${id}/${reaction.id}: tally key ${effect.key}`).toBe(true);
          }
        }
      }
    }
  });

  it('keeps reaction ids unique and labels plain (interactive text, no numerals)', () => {
    const seen = new Set<string>();
    for (const id of TRANCHE_IDS) {
      for (const reaction of reactionsOf(id)) {
        expect(seen.has(reaction.id), `duplicate reaction id ${reaction.id}`).toBe(false);
        seen.add(reaction.id);
        expect(reaction.label.length, `${reaction.id} label length`).toBeLessThanOrEqual(40);
        expect(reaction.label, `${reaction.id} label has no digits`).not.toMatch(/\d/);
      }
    }
  });

  it('gives every concealed branch a mark that a later divine working can reveal', () => {
    // Predicate, not a count: every template in the tranche offers exactly one conceal branch.
    const concealBranches = TRANCHE_IDS.map(id => {
      const found = reactionsOf(id).filter(r => r.id.endsWith('_conceal'));
      expect(found.length, `${id} has exactly one conceal branch`).toBe(1);
      return found[0];
    });
    for (const reaction of concealBranches) {
      const mark = reaction.effects.find(e => e.kind === 'hidden_mark');
      expect(mark, `${reaction.id} plants a hidden mark`).toBeDefined();
      const families = (mark as Extract<EncounterAftermathReactionEffect, { kind: 'hidden_mark' }>).revealFamilies ?? [];
      expect(families).toEqual(DIVINE_WORKING_REVEAL_FAMILIES);
      // Every reveal family must actually prefix-match at least one tranche template id,
      // otherwise the concealed mark is unreachable by construction.
      for (const family of families) {
        expect(
          TRANCHE_IDS.some(id => id.startsWith(family)),
          `reveal family '${family}' matches a real template prefix`,
        ).toBe(true);
      }
    }
  });
});

describe('divine-working aftermath — effect application (THR-741)', () => {
  let runtime: SimulationRuntime;
  beforeEach(() => { clearTraces(); enableTracing(); runtime = createSimulationRuntime(); });
  afterEach(() => { clearTraces(); disableTracing(); });

  it('claiming a sundering tallies stone.negative on the ascendant and records a chronicle ripple', () => {
    const state = buildState();
    const action = makePlayerAction('hex.rend_earth');
    const { state: next } = applyEncounterAftermathReaction(
      state, action, reactionById('hex.rend_earth', 'rend_earth_claim'), 50, runtime,
    );

    const tallies = next.graph.getNode('actor-hero')!.properties.reputationTallies as Record<string, number>;
    expect(tallies['stone.negative']).toBe(DIVINE_WORKING_CLAIMED_TALLY);

    const ripple = next.recentEvents.find(e => e.type === 'ripple_consequence');
    expect(ripple, 'claimed working records a ripple').toBeDefined();
    expect(ripple!.significance).toBe(DIVINE_WORKING_CLAIMED_SIGNIFICANCE);
    expect(ripple!.actorId).toBe('actor-hero');
  });

  it('concealing a sundering plants the mark, mutes the tally, and stays below the chronicle bar', () => {
    const state = buildState();
    const action = makePlayerAction('hex.rend_earth');
    const { state: next } = applyEncounterAftermathReaction(
      state, action, reactionById('hex.rend_earth', 'rend_earth_conceal'), 50, runtime,
    );

    const mark = (next.hiddenMarks ?? []).find(m => m.targetAgentId === 'actor-hero');
    expect(mark, 'concealed working plants a hidden mark on the caster').toBeDefined();
    expect(mark!.category).toBe('concealed_action');
    expect(mark!.severity).toBe(DIVINE_WORKING_MARK_SEVERITY_HEAVY);
    expect(mark!.revealFamilies).toEqual(DIVINE_WORKING_REVEAL_FAMILIES);

    const tallies = next.graph.getNode('actor-hero')!.properties.reputationTallies as Record<string, number>;
    expect(tallies['stone.negative']).toBe(DIVINE_WORKING_CONCEALED_TALLY);
    expect(tallies['stone.negative']).toBeLessThan(DIVINE_WORKING_CLAIMED_TALLY);

    const quiet = next.recentEvents.find(e => e.type === 'narrative');
    expect(quiet!.significance).toBeLessThan(DIVINE_WORKING_CLAIMED_SIGNIFICANCE);
  });

  it('scorching offers opposing polarities on the same reach — feared shield vs brutal warning', () => {
    const terror = applyEncounterAftermathReaction(
      buildState(), makePlayerAction('hex.scorch_earth'),
      reactionById('hex.scorch_earth', 'scorch_earth_terror'), 50, runtime,
    ).state;
    const shield = applyEncounterAftermathReaction(
      buildState(), makePlayerAction('hex.scorch_earth'),
      reactionById('hex.scorch_earth', 'scorch_earth_deterrence'), 50, runtime,
    ).state;

    const terrorTallies = terror.graph.getNode('actor-hero')!.properties.reputationTallies as Record<string, number>;
    const shieldTallies = shield.graph.getNode('actor-hero')!.properties.reputationTallies as Record<string, number>;
    expect(terrorTallies['iron.negative']).toBe(DIVINE_WORKING_CLAIMED_TALLY);
    expect(terrorTallies['iron.positive']).toBeUndefined();
    expect(shieldTallies['iron.positive']).toBe(DIVINE_WORKING_CLAIMED_TALLY);
    expect(shieldTallies['iron.negative']).toBeUndefined();
  });

  it('applies every authored reaction across the tranche without a failed effect dispatch', () => {
    for (const id of TRANCHE_IDS) {
      for (const reaction of reactionsOf(id)) {
        const { state: next } = applyEncounterAftermathReaction(
          buildState(), makePlayerAction(id), reaction, 50, runtime,
        );
        const tallies = next.graph.getNode('actor-hero')!.properties.reputationTallies as Record<string, number>;
        const talliedKeys = reaction.effects.filter(e => e.kind === 'reputation_tally');
        for (const effect of talliedKeys) {
          expect(tallies[(effect as { key: string }).key], `${id}/${reaction.id} tally landed`).toBeGreaterThan(0);
        }
        expect(next.recentEvents.length, `${id}/${reaction.id} recorded an event`).toBeGreaterThan(0);
      }
    }
  });
});

describe('divine-working aftermath — receipt tier (THR-741)', () => {
  beforeEach(() => { clearTraces(); enableTracing(); });
  afterEach(() => { clearTraces(); disableTracing(); });

  it('surfaces a modal receipt carrying the authored reaction row', () => {
    const state = buildState();
    const action: UnifiedAction = {
      ...makePlayerAction('loc.incite_unrest'),
      aftermathSummary: {
        encounterId: 'loc.incite_unrest',
        outcome: 'success',
        overview: DIVINE_WORKING_AFTERMATH['loc.incite_unrest'].fallback.overview,
        changes: [],
        reactionPrompt: DIVINE_WORKING_AFTERMATH['loc.incite_unrest'].fallback.reactionPrompt,
        reactions: reactionsOf('loc.incite_unrest'),
      },
    } as UnifiedAction;
    const result = processPlayerReceipts({ ...state, unifiedActions: [action] }, {} as never);

    const receipt = (result.playerActionReceipts ?? [])[0];
    expect(receipt, 'a receipt was queued').toBeDefined();
    expect(receipt.presentation).toBe('modal');
    expect(receipt.reactions?.map(r => r.id)).toEqual(reactionsOf('loc.incite_unrest').map(r => r.id));
  });
});
