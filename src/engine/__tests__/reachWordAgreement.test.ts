/**
 * The sheet and the skill line say the same word — THR-1583 (forecast window S5).
 *
 * Before: the character sheet passed the raw seeded `domainCapabilities` (10–40+)
 * to `getDomainTier`, a 0–10 function, so every mortal clamped to the top word
 * in every reach — while the encounter skill line read `computeCapability`, the
 * dice curve. Two surfaces, two words, one mortal.
 *
 * After: both read the dice curve through `getCapabilityWord`. This suite proves
 * it on a generated world, not a fixture — a fixture would only prove the helper
 * agrees with itself.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { initializeGameState, MAP_SIZE_PRESETS } from '../gameInit';
import { createBalancedCosmology } from '../cosmology';
import { generateArchetypes } from '../ascendant';
import { getAgentInfoCard } from '../agentDetail';
import { computeCapability } from '../domainCapability';
import { deriveSkillLine } from '../encounters/stepFactorLines';
import { getCapabilityWord, getCapabilityTier, DOMAIN_WORD_SCALES } from '../../data/domain-words';
import { REACH_DOMAINS } from '../../types/traits';
import type { GameState } from '../../types/gameState';
import type { GraphNode } from '../../types/graph';

const SEED = 42;
/** Distinct words a protagonist's eight reaches must spread across (plan § Done when S5). */
const MIN_DISTINCT_WORDS = 3;

let state: GameState;
let mortals: GraphNode[];

beforeAll(() => {
  const preset = MAP_SIZE_PRESETS.small;
  ({ state } = initializeGameState(
    generateArchetypes(4, SEED)[0], 'reach-words', createBalancedCosmology(), SEED, preset.cols, preset.rows,
  ));
  mortals = state.graph.getNodesByType('actor').filter(n =>
    n.properties?.actorType === 'individual'
    && n.id !== state.ascendantId
    && n.properties?.domainCapabilities,
  );
});

describe('reach words — the sheet agrees with the skill line (THR-1583)', () => {
  it('has a seeded population to falsify against', () => {
    expect(mortals.length, 'no mortal carries capabilities — the sweep would be vacuous').toBeGreaterThan(10);
  });

  it('every mortal, every reach: the sheet word is the skill-line word', () => {
    const disagreements: string[] = [];
    for (const mortal of mortals) {
      // Transparent knowledge shows all eight reaches on the sheet.
      const card = getAgentInfoCard(state.graph, mortal.id, state.ascendantId, 'transparent');
      const domains = card?.domains ?? [];
      expect(domains.length).toBe(REACH_DOMAINS.length);
      for (const { domain, word, tier } of domains) {
        const capability = computeCapability(state.graph, mortal.id, domain);
        const skillLine = deriveSkillLine({ actorName: mortal.name, reach: domain, capability });
        if (!skillLine.text.toLowerCase().includes(` ${word.toLowerCase()} `)) {
          disagreements.push(`${mortal.name} ${domain}: sheet "${word}" / skill line "${skillLine.text}"`);
        }
        expect(word).toBe(getCapabilityWord(domain, capability));
        expect(tier).toBe(getCapabilityTier(capability));
      }
    }
    expect(disagreements).toEqual([]);
  });

  it('the words spread: a protagonist reads at least three different words across eight reaches', () => {
    const protagonists = mortals
      .filter(n => n.properties?.spotlightTier === 'spotlight')
      .sort((a, b) => a.id.localeCompare(b.id));
    expect(protagonists.length, 'no spotlight mortal on seed 42').toBeGreaterThan(0);
    const protagonist = protagonists[0];
    const card = getAgentInfoCard(state.graph, protagonist.id, state.ascendantId, 'transparent');
    const words = new Set((card?.domains ?? []).map(d => d.word));
    expect(words.size, `${protagonist.name}: ${[...words].join(', ')}`).toBeGreaterThanOrEqual(MIN_DISTINCT_WORDS);
  });

  it('no longer reads the top word in every reach (the pre-fix clamp)', () => {
    const topWordEverywhere = mortals.filter(mortal => {
      const card = getAgentInfoCard(state.graph, mortal.id, state.ascendantId, 'transparent');
      return (card?.domains ?? []).every(d => d.word === DOMAIN_WORD_SCALES[d.domain][4]);
    });
    expect(topWordEverywhere.length).toBeLessThan(mortals.length / 10);
  });
});
