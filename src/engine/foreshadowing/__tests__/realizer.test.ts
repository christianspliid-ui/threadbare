import { describe, it, expect } from 'vitest';
import { conjugate, pronounNumber, realize } from '../realizer';

describe('pronounNumber', () => {
  it('maps he/she/it to singular and they to plural', () => {
    expect(pronounNumber('he')).toBe('singular');
    expect(pronounNumber('She')).toBe('singular');
    expect(pronounNumber('they')).toBe('plural');
    expect(pronounNumber('They')).toBe('plural');
  });
});

describe('conjugate', () => {
  it('handles irregular verbs', () => {
    expect(conjugate('be', 'singular')).toBe('is');
    expect(conjugate('be', 'plural')).toBe('are');
    expect(conjugate('have', 'singular')).toBe('has');
    expect(conjugate('have', 'plural')).toBe('have');
    expect(conjugate('do', 'singular')).toBe('does');
    expect(conjugate('go', 'singular')).toBe('goes');
  });

  it('adds -s / -es / -ies for regular 3rd-person singular', () => {
    expect(conjugate('believe', 'singular')).toBe('believes');
    expect(conjugate('mean', 'singular')).toBe('means');
    expect(conjugate('watch', 'singular')).toBe('watches');
    expect(conjugate('carry', 'singular')).toBe('carries');
    expect(conjugate('expect', 'singular')).toBe('expects');
  });

  it('uses the base form for plural', () => {
    expect(conjugate('believe', 'plural')).toBe('believe');
    expect(conjugate('carry', 'plural')).toBe('carry');
    expect(conjugate('mean', 'plural')).toBe('mean');
  });
});

describe('realize', () => {
  const slots = { name: 'Kael', subject: 'they', Subject: 'They', matter: 'what stirs at Ashmarket' };

  it('conjugates verb slots by number and fills noun slots', () => {
    expect(realize('{Subject} {v:believe} {subject} can help.', { number: 'plural', slots }))
      .toBe('They believe they can help.');
    expect(realize('{Subject} {v:believe} {subject} can help.', {
      number: 'singular',
      slots: { subject: 'she', Subject: 'She' },
    })).toBe('She believes she can help.');
  });

  it('never produces the historical agreement bug', () => {
    // The old fallback rendered "They believes" — verify the realizer cannot.
    expect(realize('{Subject} {v:believe}.', { number: 'plural', slots: { Subject: 'They' } }))
      .toBe('They believe.');
    expect(realize('{Subject} {v:believe}.', { number: 'singular', slots: { Subject: 'He' } }))
      .toBe('He believes.');
  });

  it('collapses whitespace and stray spaces before punctuation from empty slots', () => {
    expect(realize('{Subject} {v:go} {place}.', { number: 'singular', slots: { Subject: 'She' } }))
      .toBe('She goes.');
  });

  it('emits an unknown verb lemma unconjugated rather than throwing', () => {
    expect(realize('{Subject} {v:zzz}.', { number: 'plural', slots: { Subject: 'They' } }))
      .toBe('They zzz.');
  });
});
