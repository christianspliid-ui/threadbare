// THR-1630 — one word for kin: readers fold both sides through the alias table.
import { describe, it, expect } from 'vitest';
import { bondBasisMatches, canonicalBondBasis, BOND_BASIS_ALIASES, CANONICAL_BOND_BASES } from '../bond-basis';

describe('bond basis vocabulary', () => {
  it('folds the family words onto kin', () => {
    for (const w of ['lineage', 'heir', 'exile_kin', 'kinship']) expect(canonicalBondBasis(w)).toBe('kin');
    expect(bondBasisMatches('kin', 'lineage')).toBe(true);
    expect(bondBasisMatches('lineage', 'heir')).toBe(true);
  });

  it('folds enemy onto rivalry and spouse onto romantic', () => {
    expect(bondBasisMatches('rivalry', 'enemy')).toBe(true);
    expect(bondBasisMatches('spouse', 'romantic')).toBe(true);
  });

  it('keeps distinct words distinct and refuses non-strings', () => {
    expect(bondBasisMatches('kin', 'friendship')).toBe(false);
    expect(bondBasisMatches(undefined, 'kin')).toBe(false);
    expect(bondBasisMatches('', '')).toBe(false);
  });

  it('aliases always land on a canonical word', () => {
    for (const target of Object.values(BOND_BASIS_ALIASES)) expect(CANONICAL_BOND_BASES).toContain(target);
  });
});
