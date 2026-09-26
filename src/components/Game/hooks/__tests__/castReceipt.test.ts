import { describe, it, expect } from 'vitest';
import { buildCastReceipt, CAST_RECEIPT_UNNAMED_TARGET } from '../castReceipt';
import { getUnifiedTemplateById } from '../../../../data/unified-action-templates';

// THR-1603 — the cast receipt used to read "Mind — Action Invoked. reaches into the
// sleeping mind": sphere as title, a subjectless predicate, no card, no target.

describe('buildCastReceipt (THR-1603)', () => {
  it('titles a Mind card by its card name and names the target in a full sentence', () => {
    const dream = getUnifiedTemplateById('divine.dream');
    expect(dream?.sphereAffinity).toBe('mind');
    const receipt = buildCastReceipt(dream!, 'Kael Thornweaver');

    expect(receipt.title).toBe('Oneiric Sending');
    expect(receipt.body).toContain('Kael Thornweaver');
    expect(receipt.body).toContain('reaches into the sleeping mind');
    expect(receipt.body).toMatch(/^[A-Z]/);
    expect(receipt.body).toMatch(/\.$/);
    expect(receipt.message).toBe(`Oneiric Sending. ${receipt.body}`);
    expect(receipt.message).not.toContain('Action Invoked');
  });

  it('titles a sphere-less card by its card name, never the literal "Action"', () => {
    const receipt = buildCastReceipt(
      { name: 'Mend', narrativeTemplates: { initiation: 'reaches into mortal flesh', success: 's', failure: 'f' } },
      'Ysolde',
    );
    expect(receipt.title).toBe('Mend');
    expect(receipt.body).toBe('You set it upon Ysolde: it reaches into mortal flesh.');
    expect(receipt.body).toMatch(/^[A-Z]/);
  });

  it('every ascendant card in the catalog yields a card-name title and a capitalised body', () => {
    for (const id of ['divine.dream', 'divine.inspire', 'divine.deceive']) {
      const t = getUnifiedTemplateById(id);
      if (!t) continue;
      const r = buildCastReceipt(t, 'Target Name');
      expect(r.title).toBe(t.spellName ?? t.name);
      expect(r.body).toContain('Target Name');
      expect(r.body.charAt(0)).toBe(r.body.charAt(0).toUpperCase());
    }
  });

  it('falls back to the success line, then a stock line, still naming the target', () => {
    const withSuccess = buildCastReceipt(
      { name: 'Ward', narrativeTemplates: { initiation: '', success: '', failure: '' }, consequenceMessage: { success: 'the ward holds.', failure: 'x' } },
      'Brann',
    );
    expect(withSuccess.body).toBe('You set it upon Brann. The ward holds.');

    const bare = buildCastReceipt({ name: 'Ward', narrativeTemplates: { initiation: '', success: '', failure: '' } }, undefined);
    expect(bare.body).toBe(`You set it upon ${CAST_RECEIPT_UNNAMED_TARGET}. The action ripples outward.`);
  });

  it('reads "yourself" for a self-cast', () => {
    const r = buildCastReceipt({ name: 'Focus', narrativeTemplates: { initiation: 'gathers the will inward', success: '', failure: '' } }, null);
    expect(r.body).toBe('You set it upon yourself: it gathers the will inward.');
  });
});
