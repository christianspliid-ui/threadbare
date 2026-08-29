import { describe, it, expect } from 'vitest';
import type { GraphNode } from '../../types/graph';
import { REACH_DOMAINS } from '../../types/traits';
import { assertValidAttachmentReaches } from '../../testing/contentInvariants';
import {
  REWARD_POSSESSIONS,
  REWARD_CONDITIONS,
  REWARD_BESTOWED_POWERS,
} from '../reward-attachment-catalog';
import {
  ANOMALY_SIGNATURE_ARTIFACTS,
  ANOMALY_BESTOWED_POWERS,
  ANOMALY_CONDITIONS,
} from '../anomaly-reward-catalog';
import { STARTER_POSSESSIONS, STARTER_CONDITIONS } from '../starter-attachments';

/**
 * THR-1359. THR-1345 closed `reachWeights`; the sweep it required found `flesh` — the
 * retired 9th Reach — still keyed into ten further production sites. Two of them were
 * live rather than inert, and both were attachments: `Battle Salve` granted `+0.10 Flesh`
 * on each of three charges (so the item did nothing when used), and a seeded rations edge
 * carried a `modifiers: { flesh: 0.05 }` that `computeRawScore` could never score.
 *
 * Neither was visible to the typechecker in practice: the excess-property errors that did
 * fire sat recorded in `typecheck-baseline.json`, where a recorded error is a permitted
 * error indefinitely. This suite reads the values the graph will actually carry.
 */
describe('attachment catalogs carry no retired-Reach residue (THR-1359)', () => {
  const catalogs: ReadonlyArray<readonly [string, readonly GraphNode[]]> = [
    ['REWARD_POSSESSIONS', REWARD_POSSESSIONS],
    ['REWARD_CONDITIONS', REWARD_CONDITIONS],
    ['REWARD_BESTOWED_POWERS', REWARD_BESTOWED_POWERS],
    ['ANOMALY_SIGNATURE_ARTIFACTS', ANOMALY_SIGNATURE_ARTIFACTS],
    ['ANOMALY_BESTOWED_POWERS', ANOMALY_BESTOWED_POWERS],
    ['ANOMALY_CONDITIONS', ANOMALY_CONDITIONS],
    ['STARTER_POSSESSIONS', STARTER_POSSESSIONS],
    ['STARTER_CONDITIONS', STARTER_CONDITIONS],
  ];

  // A guard over an empty population passes for the wrong reason. Pin the sweep to a
  // population that actually names Reaches, so an import going empty fails loudly here
  // rather than quietly greening every assertion below.
  it('sweeps a non-empty population that actually names reaches', () => {
    const all = catalogs.flatMap(([, nodes]) => nodes);
    expect(all.length).toBeGreaterThan(50);

    const naming = all.filter(node => {
      const props = (node.properties ?? {}) as Record<string, unknown>;
      const effects = Array.isArray(props.effects) ? props.effects : [];
      return (
        Object.keys((props.modifiers ?? {}) as Record<string, unknown>).length > 0
        || effects.some(raw => {
          const effect = (raw ?? {}) as Record<string, unknown>;
          return typeof effect.reach === 'string'
            || typeof (effect.onUse as Record<string, unknown> | undefined)?.reach === 'string';
        })
      );
    });
    expect(naming.length).toBeGreaterThan(0);
  });

  for (const [name, nodes] of catalogs) {
    it(`${name}: every named reach is a live ReachDomain`, () => {
      for (const node of nodes) assertValidAttachmentReaches(node);
    });
  }

  it('rejects the exact shape that shipped — a flesh onUse charge', () => {
    const salveAsShipped = {
      id: 'test_battle_salve_as_shipped',
      type: 'artifact',
      name: 'Battle Salve',
      properties: {
        effects: [
          { type: 'consumable_charge', charges: 3, onUse: { reach: 'flesh', value: 0.1 }, destroyOnEmpty: true },
        ],
      },
    } as unknown as GraphNode;

    expect(() => assertValidAttachmentReaches(salveAsShipped)).toThrow(/flesh/);
  });

  it('rejects a flesh key in a modifiers bag', () => {
    const rationsAsShipped = {
      id: 'test_rations_as_shipped',
      type: 'artifact',
      name: 'Copper Market Rations',
      properties: { modifiers: { flesh: 0.05 } },
    } as unknown as GraphNode;

    expect(() => assertValidAttachmentReaches(rationsAsShipped)).toThrow(/flesh/);
  });

  it('accepts every live ReachDomain, so the guard is not simply rejecting everything', () => {
    for (const reach of REACH_DOMAINS) {
      const node = {
        id: `test_ok_${reach}`,
        type: 'artifact',
        name: `Probe ${reach}`,
        properties: {
          modifiers: { [reach]: 0.05 },
          effects: [{ type: 'consumable_charge', charges: 1, onUse: { reach, value: 0.1 } }],
        },
      } as unknown as GraphNode;

      expect(() => assertValidAttachmentReaches(node)).not.toThrow();
    }
  });
});
