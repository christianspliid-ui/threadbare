/**
 * THR-1298 — the reactive loop's shared vocabulary, pinned on both sides.
 *
 * The failure this guards is the `hungerResonance` class: two halves of one system
 * naming slightly different things, so a weight fires zero times and the result reads
 * as "needs tuning" rather than "never ran". Three vocabularies have to agree here —
 * the harm classes the templates author, the harm classes the rules table keys on, and
 * the ambition template ids the rules table offers — and none of them is checked by the
 * type system end to end, because the failure is a *live lookup* returning undefined,
 * not a type mismatch.
 */

import { describe, it, expect } from 'vitest';
import {
  UNDERTAKING_MINTING_RULES,
  HARM_MAGNITUDE_BY_CLASS,
  HARM_CLASS_LABELS,
} from '../ambition-minting-rules';
import {
  GRIEVANCE_AMBITION_TEMPLATES,
  EVENT_MINTED_AMBITION_TEMPLATES,
} from '../ambition-templates';
import { getAllStrategicTemplates } from '../../engine/strategicActionCandidates';
import type { UndertakingHarmClass } from '../../types/strategicAction';

const HARM_CLASSES: readonly UndertakingHarmClass[] = [
  'property_destroyed',
  'holding_seized',
  'network_severed',
  'named_death',
  'undertaking_abandoned',
];

describe('UNDERTAKING_MINTING_RULES', () => {
  it('offers only template ids that exist in a minted pool', () => {
    const mintable = new Set([
      ...GRIEVANCE_AMBITION_TEMPLATES.map((t) => t.id),
      ...EVENT_MINTED_AMBITION_TEMPLATES.map((t) => t.id),
    ]);

    const offered = Object.values(UNDERTAKING_MINTING_RULES)
      .flatMap((byRelation) => Object.values(byRelation))
      .flat()
      .map((entry) => entry.templateId);

    // Falsify the vacuous arm: an empty table would satisfy the loop below trivially,
    // and an empty table is exactly what a bad merge produces.
    expect(offered.length).toBeGreaterThan(10);
    for (const templateId of offered) {
      expect(mintable.has(templateId)).toBe(true);
    }
  });

  it('covers every harm class in all three tables', () => {
    for (const harmClass of HARM_CLASSES) {
      expect(UNDERTAKING_MINTING_RULES[harmClass]).toBeDefined();
      expect(HARM_MAGNITUDE_BY_CLASS[harmClass]).toBeGreaterThan(0);
      expect(HARM_CLASS_LABELS[harmClass]).toBeTruthy();
    }
  });

  /**
   * A witness never inherits somebody else's revenge (THR-1282 §2). They saw a home
   * burn: that is a reason to guard their own or to leave, never a reason to hunt a
   * stranger's enemy.
   */
  it('flags grievances only on victim candidates', () => {
    for (const [harmClass, byRelation] of Object.entries(UNDERTAKING_MINTING_RULES)) {
      for (const [relation, entries] of Object.entries(byRelation)) {
        if (relation === 'victim') continue;
        for (const entry of entries) {
          expect(
            entry.grievance,
            `${harmClass}.${relation} offers a grievance to a non-victim`,
          ).toBeUndefined();
        }
      }
    }
  });

  /**
   * A culprit-less harm cannot mint a vendetta — there is nobody to hold it against.
   */
  it('offers no grievance for the self-facing abandonment class', () => {
    for (const entries of Object.values(UNDERTAKING_MINTING_RULES.undertaking_abandoned)) {
      for (const entry of entries) expect(entry.grievance).toBeUndefined();
    }
  });
});

describe('harmClass authoring on destroy templates', () => {
  /**
   * Every destroy verb registers as some harm, or the undertaking completes and the
   * world does not react — which is the exact silence this whole doc exists to end.
   */
  it('every destroy template authors a harmClass in the union', () => {
    const destroys = getAllStrategicTemplates().filter((t) => t.verb === 'destroy');
    // The population must be real: a registry that failed to load would pass an
    // every-member assertion over zero members.
    expect(destroys.length).toBeGreaterThanOrEqual(9);
    for (const template of destroys) {
      expect(template.harmClass, `${template.id} authors no harmClass`).toBeDefined();
      expect(HARM_CLASSES).toContain(template.harmClass);
    }
  });

  /**
   * `harmClass` is authored, never inferred — but a template that authors one while
   * carrying no `motiveGate` would let a motiveless harm mint a grievance, which is the
   * counter-play gate (THR-1297 §2) leaking through a side door.
   */
  it('every harm-carrying template is also motive-gated', () => {
    const harmful = getAllStrategicTemplates().filter((t) => t.harmClass);
    expect(harmful.length).toBeGreaterThanOrEqual(9);
    for (const template of harmful) {
      expect(
        template.motiveGate?.length ?? 0,
        `${template.id} carries a harmClass but no motiveGate`,
      ).toBeGreaterThan(0);
    }
  });
});
