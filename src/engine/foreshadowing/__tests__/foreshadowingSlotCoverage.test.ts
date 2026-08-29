/**
 * Foreshadowing clause-pool sweeps (THR-1360).
 *
 * The clause pools in `foreshadowing-content.ts` ship player-facing prose, and
 * until this file existed nothing measured them. `foreshadowing-content.ts` was
 * imported by exactly two composers and their two tests; no `countVagueness`
 * caller touched it. Two whole classes of defect had been sitting in shipped
 * prose as a result:
 *
 *  1. **Evasive vagueness.** Seven clauses used `something`, the canonical
 *     outcome-hider in `EVASIVE_VAGUENESS_TERMS` — enforced at zero in *every*
 *     field class, not just `outcome`.
 *  2. **Unbound slots.** Six clauses opened on `{Matter}` while neither composer
 *     bound a `Matter` key. `NOUN_SLOT` looks keys up case-sensitively and a
 *     miss fails soft to `''`, so those rendered headless — "hums at a pitch
 *     they answer to, and they follow it."
 *
 * Class 2 is the reason the pre-existing `expect(text).not.toMatch(/[{}]/)`
 * assertion in `composeReceipt.test.ts` never caught it: the fail-soft path
 * deletes the braces along with the slot, so a check for *leftover* braces is
 * blind to a slot that was never bound. These sweeps check the opposite
 * direction — that every slot a clause names is one a composer actually binds.
 */
import { describe, it, expect } from 'vitest';
import { realize } from '../realizer';
import { composeReceiptForeshadowing } from '../composeReceipt';
import { countVagueness } from '../../../data/content-eval/nudgeAuditDetectors';
import type { MotiveReceipt, MotiveContributionKind } from '../../../types/foreshadowing';
import * as CONTENT from '../../../data/foreshadowing-content';

/**
 * Keys bound by BOTH composers' `slots` objects — `composeReceipt.ts` and
 * `composeGeneric.ts`. A clause may only name a slot on this list. Keep in sync
 * with those two objects; the live-render arm below is the backstop that fails
 * if this list and the composers ever disagree in the direction that matters.
 */
const BOUND_SLOTS = new Set([
  'name',
  'subject',
  'Subject',
  'object',
  'Object',
  'matter',
  'Matter',
  'place',
]);

const NOUN_SLOT = /\{([A-Za-z]+)\}/g;

interface Clause {
  pool: string;
  text: string;
}

/** Walk any exported pool shape (string[], Record<_, string[]>, nested Records) to leaves. */
function flatten(pool: string, value: unknown, out: Clause[]): void {
  if (typeof value === 'string') {
    out.push({ pool, text: value });
    return;
  }
  if (Array.isArray(value)) {
    for (const entry of value) flatten(pool, entry, out);
    return;
  }
  if (value && typeof value === 'object') {
    for (const entry of Object.values(value)) flatten(pool, entry, out);
  }
}

const CLAUSES: Clause[] = (() => {
  const out: Clause[] = [];
  for (const [name, value] of Object.entries(CONTENT)) {
    if (typeof value === 'function') continue; // matterAtPlace
    flatten(name, value, out);
  }
  return out;
})();

describe('foreshadowing clause pools — corpus', () => {
  it('sweeps a substantial corpus drawn from every exported pool', () => {
    // Guards the vacuous-pass mode: a renamed or emptied export would otherwise
    // make every sweep below pass over nothing at all.
    expect(CLAUSES.length).toBeGreaterThan(150);
    const pools = new Set(CLAUSES.map(c => c.pool));
    for (const required of [
      'KNOWLEDGE_CLAUSES',
      'PULL_CLAUSES',
      'MOTIVE_CLAUSES',
      'MOTIVE_CLAUSES_BY_REACH',
      'EXPECTATION_BY_FORECAST',
      'STAKE_CLAUSES',
    ]) {
      expect(pools, `${required} must be swept`).toContain(required);
    }
  });
});

describe('foreshadowing clause pools — evasive vagueness (THR-1360)', () => {
  it('no clause uses an evasive vagueness term', () => {
    // `scene` class: these are pre-roll motive prose, so the natural indefinites
    // ("someone", used deliberately in the bond pool) stay legal. The evasive set
    // is enforced at zero in every class, which is what this asserts.
    const offenders = CLAUSES.filter(c => countVagueness(c.text, 'scene') > 0).map(
      c => `${c.pool}: ${c.text}`,
    );
    expect(offenders, `evasive terms found:\n${offenders.join('\n')}`).toEqual([]);
  });

  it('the detector fires on the shape this sweep retired', () => {
    // Controlled arm — proves the sweep above can fail. This is the literal
    // pre-THR-1360 text of the `hunch` pool's third clause.
    const retired = 'Something about {matter} sits wrong, or sits right; {subject} could not say which.';
    expect(countVagueness(retired, 'scene')).toBeGreaterThan(0);
  });
});

describe('foreshadowing clause pools — slot binding (THR-1360)', () => {
  it('every slot a clause names is bound by the composers', () => {
    const offenders: string[] = [];
    for (const clause of CLAUSES) {
      for (const match of clause.text.matchAll(NOUN_SLOT)) {
        const key = match[1];
        if (key.startsWith('v:')) continue;
        if (!BOUND_SLOTS.has(key)) offenders.push(`${clause.pool}: {${key}} in "${clause.text}"`);
      }
    }
    expect(offenders, `unbound slots found:\n${offenders.join('\n')}`).toEqual([]);
  });

  it('an unbound slot is detected rather than silently erased', () => {
    // Controlled arm, and a restatement of the fail-soft trap: `realize` drops
    // the unknown slot entirely, so the rendered text carries no brace for a
    // leftover-brace assertion to catch. Only the allowlist sweep sees it.
    const bad = '{Nowhere} follows from what {subject} began.';
    const rendered = realize(bad, { number: 'plural', slots: { subject: 'they' } });
    expect(rendered).not.toMatch(/[{}]/); // the trap: looks clean
    expect(rendered).toBe('follows from what they began.'); // but it is headless
    const unbound = [...bad.matchAll(NOUN_SLOT)]
      .map(m => m[1])
      .filter(k => !k.startsWith('v:') && !BOUND_SLOTS.has(k));
    expect(unbound).toEqual(['Nowhere']);
  });
});

describe('foreshadowing clause pools — live render (THR-1360)', () => {
  const KINDS: MotiveContributionKind[] = [
    'ambition',
    'personality',
    'intel',
    'mark',
    'divine',
    'bond',
    'reputation',
    'resonance',
    'rarity',
    'hunch',
    'doom_identity',
    'chain',
    'exploration',
    'proximity',
  ];

  function receipt(kind: MotiveContributionKind, tick: number): MotiveReceipt {
    return {
      templateId: 'encounter.plague_outbreak',
      locationId: 'loc-1',
      contributions: [{ kind, weight: 0.8 }],
      intelTier: 'briefed',
      expectation: 'perilous',
      dominantReach: 'iron',
      decidedAtTick: tick,
    };
  }

  it('every sentence of every composed passage begins with a capital', () => {
    // The end-to-end backstop. A clause opening on an unbound slot renders
    // headless, and the surviving first word is lowercase — which is exactly how
    // the six `{Matter}` clauses shipped. Sweeping ticks walks the rng across
    // each pool's variants rather than sampling one.
    const offenders: string[] = [];
    for (const kind of KINDS) {
      for (let tick = 0; tick < 40; tick += 1) {
        const { prose } = composeReceiptForeshadowing(
          {
            agentId: 'agent-1',
            encounterId: 'encounter.plague_outbreak',
            agentName: 'Kael Thornweaver',
            subjectPronoun: 'they',
            locationName: 'Ashmarket',
          },
          receipt(kind, tick),
        );
        for (const sentence of prose.split(/(?<=[.?!])\s+/).filter(Boolean)) {
          if (!/^[A-Z]/.test(sentence)) offenders.push(`${kind}@${tick}: "${sentence}"`);
        }
      }
    }
    expect(offenders, `headless sentences:\n${offenders.slice(0, 10).join('\n')}`).toEqual([]);
  });

  it('composed passages carry no evasive vagueness either', () => {
    const offenders: string[] = [];
    for (const kind of KINDS) {
      for (let tick = 0; tick < 40; tick += 1) {
        const { prose } = composeReceiptForeshadowing(
          {
            agentId: 'agent-1',
            encounterId: 'encounter.plague_outbreak',
            agentName: 'Kael Thornweaver',
            subjectPronoun: 'they',
            locationName: 'Ashmarket',
          },
          receipt(kind, tick),
        );
        if (countVagueness(prose, 'scene') > 0) offenders.push(`${kind}@${tick}: "${prose}"`);
      }
    }
    expect(offenders, `evasive prose:\n${offenders.slice(0, 5).join('\n')}`).toEqual([]);
  });
});
