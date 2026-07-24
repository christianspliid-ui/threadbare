import { describe, it, expect } from 'vitest';
import {
  AMBITION_MINTING_RULES,
  MINT_CLASS_LABELS,
  classifyMintEvent,
  type MintEventClass,
} from '../ambition-minting-rules';
import { EVENT_MINTED_AMBITION_TEMPLATES } from '../ambition-templates';

const MINTED_IDS = new Set(EVENT_MINTED_AMBITION_TEMPLATES.map((t) => t.id));
const CLASSES: MintEventClass[] = ['violence', 'upheaval', 'wonder', 'hardship', 'severance'];

describe('classifyMintEvent', () => {
  it('maps combat reaches to violence', () => {
    expect(classifyMintEvent('iron')).toBe('violence');
    expect(classifyMintEvent('shadow')).toBe('violence');
  });

  it('maps the other classifiable reaches', () => {
    expect(classifyMintEvent('gold')).toBe('upheaval');
    expect(classifyMintEvent('star')).toBe('wonder');
    expect(classifyMintEvent('veil')).toBe('wonder');
    expect(classifyMintEvent('stone')).toBe('hardship');
    expect(classifyMintEvent('heart')).toBe('severance');
  });

  it('returns null for eye and unknown reaches (inert by design)', () => {
    expect(classifyMintEvent('eye')).toBeNull();
    expect(classifyMintEvent(undefined)).toBeNull();
    expect(classifyMintEvent('not_a_reach')).toBeNull();
  });
});

describe('AMBITION_MINTING_RULES', () => {
  it('every referenced template id exists in EVENT_MINTED_AMBITION_TEMPLATES', () => {
    for (const cls of CLASSES) {
      const byRelation = AMBITION_MINTING_RULES[cls];
      for (const entries of Object.values(byRelation)) {
        for (const entry of entries ?? []) {
          expect(MINTED_IDS.has(entry.templateId)).toBe(true);
        }
      }
    }
  });

  it('every rule weight is a positive number', () => {
    for (const cls of CLASSES) {
      for (const entries of Object.values(AMBITION_MINTING_RULES[cls])) {
        for (const entry of entries ?? []) {
          expect(entry.weight).toBeGreaterThan(0);
        }
      }
    }
  });

  it('every event class offers at least one relation with candidates', () => {
    for (const cls of CLASSES) {
      const total = Object.values(AMBITION_MINTING_RULES[cls]).reduce(
        (n, entries) => n + (entries?.length ?? 0),
        0,
      );
      expect(total).toBeGreaterThan(0);
    }
  });

  it('has a prose label for every class', () => {
    for (const cls of CLASSES) {
      expect(typeof MINT_CLASS_LABELS[cls]).toBe('string');
      expect(MINT_CLASS_LABELS[cls].length).toBeGreaterThan(0);
      // No digits — labels are read aloud in receipts.
      expect(/\d/.test(MINT_CLASS_LABELS[cls])).toBe(false);
    }
  });
});
