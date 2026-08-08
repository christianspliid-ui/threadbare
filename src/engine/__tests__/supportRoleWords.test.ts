/**
 * THR-1041 — Law 14 gate for the support-role vocabulary.
 *
 * The load-bearing test is the **corpus sweep**: it enumerates every
 * `supportRole` literal authored anywhere in `src/data`, not a fixture list, so
 * a role added next week is covered the day it is written. A sample-based test
 * here would be exactly the vacuous gate the impediment log keeps recording —
 * green while the surface prints `mct_ledger_clerk`.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { supportRoleWord, __resetSupportRoleWarnings } from '../supportRoleWords';

const here = dirname(fileURLToPath(import.meta.url));
const dataRoot = resolve(here, '../../data');

/** Every `supportRole: '...'` literal authored under `src/data`. */
function authoredSupportRoles(): string[] {
  const found = new Set<string>();
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) { walk(full); continue; }
      if (!entry.endsWith('.ts')) continue;
      for (const match of readFileSync(full, 'utf8').matchAll(/supportRole:\s*'([^']+)'/g)) {
        found.add(match[1]);
      }
    }
  };
  walk(dataRoot);
  return [...found].sort();
}

describe('supportRoleWord (THR-1041)', () => {
  beforeEach(() => { __resetSupportRoleWarnings(); });

  it('the corpus is non-empty — otherwise every sweep below is vacuous', () => {
    expect(authoredSupportRoles().length).toBeGreaterThan(20);
  });

  it('LAW 14: no authored role renders as its raw key', () => {
    const offenders = authoredSupportRoles().filter((role) => supportRoleWord(role) === role);
    expect(offenders).toEqual([]);
  });

  it('LAW 14: no authored role renders with an underscore or a faction prefix', () => {
    for (const role of authoredSupportRoles()) {
      const word = supportRoleWord(role);
      expect(word, `role ${role} -> "${word}"`).not.toMatch(/_/);
      expect(word, `role ${role} -> "${word}"`).not.toMatch(/^(ac|bf|cg|hod|lk|mct|rb|tg|ts|uk) /i);
    }
  });

  it('strips the faction-template prefix', () => {
    expect(supportRoleWord('mct_ledger_clerk')).toBe('Ledger Clerk');
    expect(supportRoleWord('hod_chaplain')).toBe('Chaplain');
  });

  it('keeps a bare role intact', () => {
    expect(supportRoleWord('ferryman')).toBe('Ferryman');
    expect(supportRoleWord('checkpoint_captain')).toBe('Checkpoint Captain');
  });

  it('keeps minor words lower-cased inside a phrase', () => {
    // `person_in_danger` is overridden, so exercise the rule on a raw key.
    expect(supportRoleWord('keeper_of_tolls')).toBe('Keeper of Tolls');
  });

  it('applies an override where the derived form reads wrong', () => {
    expect(supportRoleWord('person_in_danger')).toBe('In danger');
    expect(supportRoleWord('social_onlooker')).toBe('Onlooker');
  });

  it('FAIL-SOFT: an unresolvable role gets a neutral standing and one warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      expect(supportRoleWord('___')).toBe('In the scene');
      expect(supportRoleWord('___')).toBe('In the scene');
      expect(warn).toHaveBeenCalledTimes(1);
    } finally {
      warn.mockRestore();
    }
  });

  it('FAIL-SOFT: an absent role never throws and never renders blank', () => {
    expect(supportRoleWord(undefined)).toBe('In the scene');
  });
});
