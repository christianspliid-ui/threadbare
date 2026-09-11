/**
 * Tripwire — no production module reads `factionDefId` off a meta row directly.
 *
 * `FACTION_ENCOUNTER_META` answers *which faction is this encounter about*. For the
 * ~150 authored guild rows the answer is a constant; for a Realm it is not, because the
 * definition is minted per world (THR-1155 slice 3). A class-scoped row therefore parks
 * `CLASS_SCOPED_META_DEF_ID` in the field and the real answer comes from
 * `resolveMetaFactionDefId`.
 *
 * A re-introduced direct read would pass every behavioural test in the repo. The guild
 * rows resolve to themselves either way, and a realm row read directly resolves to
 * *nothing* — so the symptom is not an exception but a court that quietly stops paying
 * standing, which is the exact failure mode slice 3 exists to remove. The shape is what
 * has to be asserted.
 *
 * **The predicate:** no production file under `src/engine` or `src/data` dereferences
 * `.factionDefId` on an identifier whose name ends in `meta` or `Meta`, with two
 * deliberate exemptions — `factionMetaScope.ts` *is* the resolver, and
 * `faction-encounter-content.ts` holds `metaBelongsToDefinitionId`, the enumeration-side
 * half of the same rule for callers that hold a definition id and no agent.
 *
 * The matcher is deliberately coarse. It fires on any `<something>meta.factionDefId`
 * rather than on the handful of spellings the sweep happened to find, because a narrower
 * regex is precise about the sites that exist today and blind to the one nobody thought
 * of — the lesson slice 2's `controls` participation test paid for.
 */

import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOTS = [
  join(process.cwd(), 'src', 'engine'),
  join(process.cwd(), 'src', 'data'),
];

/** The two files that own the rule rather than obey it. */
const EXEMPT_FILES = new Set(['factionMetaScope.ts', 'faction-encounter-content.ts']);

function collectProductionModules(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry === '__tests__') continue;
      collectProductionModules(full, acc);
      continue;
    }
    if (!entry.endsWith('.ts') && !entry.endsWith('.tsx')) continue;
    if (entry.endsWith('.test.ts') || entry.endsWith('.test.tsx')) continue;
    acc.push(full);
  }
  return acc;
}

/**
 * A dereference, not a mention. Comments in the swept modules name the field while
 * explaining the rule, and `factionMetaScope.ts`'s own doc block quotes it — a substring
 * match would fail on exactly the files that document why the rule exists.
 */
function readsMetaDefIdDirectly(source: string): boolean {
  const withoutComments = source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/[^\n]*/g, '');
  return /\b\w*[mM]eta\.factionDefId\b/.test(withoutComments);
}

describe('faction encounter meta read sites (THR-1155 tripwire)', () => {
  it('no production module dereferences a meta row\'s factionDefId', () => {
    const offenders = ROOTS.flatMap(root => collectProductionModules(root)
      .filter(path => !EXEMPT_FILES.has(path.split(/[\\/]/).pop() as string))
      .filter(path => readsMetaDefIdDirectly(readFileSync(path, 'utf8')))
      .map(path => path.slice(root.length + 1).replace(/\\/g, '/')));

    expect(offenders).toEqual([]);
  });

  it('the scan sees the corpus it claims to, and the matcher fires', () => {
    // The vacuous-probe guard: a collector that walked the wrong directory, or a matcher
    // that never matches, passes the assertion above over an empty set. Both halves are
    // pinned — the corpus is large, and the matcher demonstrably fires on the resolver
    // itself, the one production file that legitimately reads the field.
    const modules = ROOTS.flatMap(root => collectProductionModules(root));
    expect(modules.length).toBeGreaterThan(100);

    const resolver = modules.find(p => p.endsWith('factionMetaScope.ts'));
    expect(resolver).toBeDefined();
    expect(readsMetaDefIdDirectly(readFileSync(resolver as string, 'utf8'))).toBe(true);

    // And the comment-stripper is load-bearing: a swept module that only *mentions* the
    // field in prose must not read as an offender.
    expect(readsMetaDefIdDirectly('// meta.factionDefId is read through the resolver\n')).toBe(false);
  });

  it('the swept modules route through the resolver', () => {
    // The five modules the sweep touched, pinned by name. Deleting a call rather than
    // replacing it would leave the assertion above green — nothing to read directly
    // means nothing to catch — so the positive side is asserted too.
    const SWEPT = [
      'encounterFilterPipeline.ts',
      'factionOutcome.ts',
      'factionRankBonus.ts',
      'factionReputation.ts',
    ];
    for (const name of SWEPT) {
      const source = readFileSync(join(process.cwd(), 'src', 'engine', name), 'utf8');
      expect(source, name).toContain('resolveMetaFactionDefId');
    }

    // The enumeration side: a caller holding a definition id and no agent asks the
    // predicate instead.
    const quests = readFileSync(
      join(process.cwd(), 'src', 'engine', 'factionQuestGeneration.ts'), 'utf8');
    expect(quests).toContain('metaBelongsToDefinitionId');
  });
});
