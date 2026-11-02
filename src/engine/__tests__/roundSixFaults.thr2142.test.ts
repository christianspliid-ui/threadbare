/**
 * THR-2142 — cold playtest round 6, items 4 and 5 (item 3 is pinned beside the bond
 * strip in `artLedDressing.thr2097.test.ts`).
 *
 * 4. Observe and Piercing Gaze were one action under two names; its Chronicle line
 *    named a raw domain id; and a cast with nothing left to reveal still charged.
 * 5. Read the Threads showed and drained all twelve pools, the folded Foundation ones too.
 */
import { describe, expect, it } from 'vitest';
import { UNIFIED_ACTION_TEMPLATES } from '../../data/unified-action-templates';
import { getTargetActionSlots, TARGET_ACTION_CONSTANTS } from '../targetActions';
import {
  OBSERVE_DEPTH_CEILING,
  OBSERVE_DOMAIN_ORDER,
  observeHasNothingLeft,
  observeRevealMessage,
} from '../revelationEmitter';
import { playerFacingTemplateName } from '../unifiedActionResolution';
import type { TargetContext } from '../../types/targetContext';
import type { AgentKnowledge } from '../../types/agentKnowledge';
import {
  chargeReadThreads,
  readThreadsAvailable,
  readThreadsPayingPools,
  readThreadsPoolsLine,
} from '../../components/Game/readThreadsPools';

const observe = UNIFIED_ACTION_TEMPLATES.find(t => t.id === 'observe_agent')!;

const target: TargetContext = {
  nodeId: 'kael', nodeType: 'actor', displayName: 'Kael', displayLabel: '', subtype: 'individual',
  traitIds: [], sphereAffinity: null, position: null, properties: {},
};
const base = {
  target, templates: [observe],
  pool: { mind: 99 } as never, primarySphere: 'mind' as never, accessibleSpheres: ['mind', 'life'] as never,
  unlockedActionIds: [observe.id],
};

function knowing(domains: readonly string[], interactionDepth = OBSERVE_DEPTH_CEILING): Map<string, AgentKnowledge> {
  return new Map([['kael', { revealedDomains: new Set(domains), interactionDepth } as unknown as AgentKnowledge]]);
}

describe('item 4 — Observe is Piercing Gaze everywhere, answers in words, and locks when spent', () => {
  it('the slot carries the spell name the hand and receipt print', () => {
    const [slot] = getTargetActionSlots(base);
    expect(slot?.spellName).toBe('Piercing Gaze');
    expect(playerFacingTemplateName(observe)).toBe('Piercing Gaze');
  });

  it('the Chronicle line names the spell and the Reach in words, not the raw id', () => {
    const line = observeRevealMessage('Kael', 'iron');
    expect(line).toContain('Piercing Gaze');
    expect(line).toContain('Iron');
    expect(line).not.toMatch(/\biron\b/);
  });

  it('nothing is left only once every Reach is known and the depth it adds opens no further row', () => {
    expect(observeHasNothingLeft(knowing(OBSERVE_DOMAIN_ORDER, OBSERVE_DEPTH_CEILING - 1), 'kael')).toBe(false);
    expect(observeHasNothingLeft(knowing([]), 'kael')).toBe(false);
    expect(observeHasNothingLeft(knowing(OBSERVE_DOMAIN_ORDER.slice(0, -1)), 'kael')).toBe(false);
    expect(observeHasNothingLeft(knowing(OBSERVE_DOMAIN_ORDER), 'kael')).toBe(true);
    expect(observeHasNothingLeft(undefined, 'kael')).toBe(false);
    expect(observeHasNothingLeft(knowing(OBSERVE_DOMAIN_ORDER), 'someone_else')).toBe(false);
  });

  it('the card locks, with a reason in words, when there is nothing left to reveal', () => {
    const [open] = getTargetActionSlots({ ...base, observeNothingLeft: false });
    expect(open?.available).toBe(true);
    const [spent] = getTargetActionSlots({ ...base, observeNothingLeft: true });
    expect(spent?.available).toBe(false);
    expect(spent?.lockedReason).toBe(TARGET_ACTION_CONSTANTS.NOTHING_TO_REVEAL_REASON);
  });
});

describe('item 5 — Read the Threads shows and charges the god\'s own two pools', () => {
  const pool = { energy: 120, iron: 80, chaos: 200, order: 150, light: 30, darkness: 29 } as never;

  it('Available is the primary and secondary only, by name', () => {
    const pools = readThreadsPayingPools(pool, 'energy' as never, 'iron' as never);
    expect(readThreadsAvailable(pools)).toBe(200);
    expect(readThreadsPoolsLine(pools)).toMatch(/^Energy 120 · Iron 80$/);
  });

  it('a read draws the primary first, then the secondary, and never a Foundation pool', () => {
    const after = chargeReadThreads(pool, 'energy' as never, 'iron' as never, 150) as Record<string, number>;
    expect(after.energy).toBe(0);
    expect(after.iron).toBe(50);
    expect(after.chaos).toBe(200);
    expect(after.order).toBe(150);
  });

  it('one pool counts once when primary and secondary are the same sphere', () => {
    expect(readThreadsAvailable(readThreadsPayingPools(pool, 'energy' as never, 'energy' as never))).toBe(120);
  });
});
