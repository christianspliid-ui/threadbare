import { describe, it, expect } from 'vitest';
import { ITEM_STAT_BAND_LEGENDARY } from '../item-stat-bands';
import type { GraphNode } from '../../types/graph';
import type { AttachmentEffect } from '../../types/effects';
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
import { ARTIFACT_TEMPLATES } from '../artifact-templates';

/**
 * THR-718 power-budget guard. `stat_contribution` effects move Domain Capability
 * *tiers*, so a run-away magnitude silently overpowers items. This test fails the
 * build when a catalog entry exceeds the legendary band per reach, and when an entry
 * double-dips (carries BOTH a legacy `domainContributions` bag AND a
 * `stat_contribution` effect — the migration should delete the dead legacy bag).
 */

interface Entry {
  id: string;
  effects: AttachmentEffect[];
  domainContributions?: Record<string, number>;
}

/** Possession/condition catalogs export GraphNode[] with effects on properties. */
function fromNodes(nodes: GraphNode[]): Entry[] {
  return nodes.map((n) => ({
    id: n.id,
    effects: (n.properties.effects as AttachmentEffect[] | undefined) ?? [],
    domainContributions: n.properties.domainContributions as Record<string, number> | undefined,
  }));
}

const ENTRIES: Entry[] = [
  ...fromNodes(REWARD_POSSESSIONS),
  ...fromNodes(REWARD_CONDITIONS),
  ...fromNodes(REWARD_BESTOWED_POWERS),
  ...fromNodes(ANOMALY_SIGNATURE_ARTIFACTS),
  ...fromNodes(ANOMALY_BESTOWED_POWERS),
  ...fromNodes(ANOMALY_CONDITIONS),
  ...fromNodes(STARTER_POSSESSIONS),
  ...fromNodes(STARTER_CONDITIONS),
  ...ARTIFACT_TEMPLATES.map((a) => ({ id: a.id, effects: a.effects })),
];

/** All stat_contribution effects on an entry (top-level only — v1 is not nested). */
function statContributions(entry: Entry) {
  return entry.effects.filter(
    (e): e is Extract<AttachmentEffect, { type: 'stat_contribution' }> =>
      e?.type === 'stat_contribution',
  );
}

describe('item stat-band contract (THR-718)', () => {
  it('no catalog entry exceeds ITEM_STAT_BAND_LEGENDARY per reach', () => {
    const offenders: string[] = [];
    for (const entry of ENTRIES) {
      for (const eff of statContributions(entry)) {
        for (const [reach, value] of Object.entries(eff.contributions)) {
          if (typeof value === 'number' && Math.abs(value) > ITEM_STAT_BAND_LEGENDARY) {
            offenders.push(`${entry.id}: ${reach}=${value} (> ${ITEM_STAT_BAND_LEGENDARY})`);
          }
        }
      }
    }
    expect(offenders, `over-band stat_contributions:\n${offenders.join('\n')}`).toEqual([]);
  });

  it('no migrated entry double-dips (legacy domainContributions AND stat_contribution)', () => {
    const offenders: string[] = [];
    for (const entry of ENTRIES) {
      const hasStat = statContributions(entry).length > 0;
      const legacy = entry.domainContributions;
      const hasLegacy = !!legacy && Object.keys(legacy).length > 0;
      if (hasStat && hasLegacy) {
        offenders.push(`${entry.id}: legacy=${JSON.stringify(legacy)} + stat_contribution`);
      }
    }
    expect(offenders, `double-dipping entries (delete the legacy bag):\n${offenders.join('\n')}`).toEqual([]);
  });
});
