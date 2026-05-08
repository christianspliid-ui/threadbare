import { describe, it, expect } from 'vitest';
import { rankTerm, searchTerms } from '../ulSearch';
import type { ULTerm } from '../ulDashboardData';

const term = (overrides: Partial<ULTerm>): ULTerm => ({
  shardId: 'cosmology',
  slug: 'reach',
  name: 'Reach',
  aliases: [],
  status: 'canonical',
  oneLiner: 'one of eight action domains',
  body: 'One of eight axes along which actors develop capability.',
  seeAlso: [],
  sourcePath: 'Docs/ubiquitous-language/Cosmology.md#reach',
  contentAdjacent: true,
  ...overrides,
});

describe('rankTerm', () => {
  const t = term({});

  it('ranks exact name match highest', () => {
    expect(rankTerm(t, 'reach')).toBe('name_exact');
    expect(rankTerm(t, 'REACH')).toBe('name_exact');
  });

  it('ranks name prefix higher than substring', () => {
    expect(rankTerm(term({ name: 'Reach Domain' }), 'reach')).toBe(
      'name_prefix',
    );
    expect(rankTerm(term({ name: 'Foo Reach' }), 'reach')).toBe('name_substring');
  });

  it('ranks alias matches below name matches', () => {
    expect(rankTerm(term({ aliases: ['Action Domain'] }), 'action')).toBe(
      'alias_substring',
    );
  });

  it('ranks one-liner above body', () => {
    const cap = term({
      name: 'Capability',
      oneLiner: 'tiered measure of capability',
      body: 'Long body without the search term anywhere else.',
    });
    expect(rankTerm(cap, 'tiered')).toBe('one_liner_substring');
    expect(rankTerm(cap, 'long body')).toBe('body_substring');
  });

  it('returns no_match when term lacks the query', () => {
    expect(rankTerm(t, 'unrelated query xyz')).toBe('no_match');
  });
});

describe('searchTerms', () => {
  const reach = term({ slug: 'reach', name: 'Reach' });
  const sphere = term({ slug: 'sphere', name: 'Sphere', oneLiner: 'cosmic energy' });
  const reachDomain = term({
    slug: 'reach-domain',
    name: 'Reach Domain Alias',
    aliases: ['ReachAlt'],
    oneLiner: 'unrelated',
    body: 'unrelated body',
  });

  it('returns all terms when query is empty', () => {
    const result = searchTerms([reach, sphere, reachDomain], '');
    expect(result).toHaveLength(3);
  });

  it('orders by rank: exact, prefix, substring', () => {
    const result = searchTerms([reachDomain, reach], 'reach');
    expect(result.map((t) => t.slug)).toEqual(['reach', 'reach-domain']);
  });

  it('drops no_match terms', () => {
    const result = searchTerms([reach, sphere], 'reach');
    expect(result.map((t) => t.slug)).toEqual(['reach']);
  });
});
