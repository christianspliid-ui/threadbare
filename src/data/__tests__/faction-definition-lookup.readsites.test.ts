/**
 * Tripwire — no engine module resolves a faction definition off the static map.
 *
 * THR-1322 built `getFactionDefinition(id, dynamicDefs?)` so a definition minted
 * at run time resolves like an authored one. The door was only half-hung: 21
 * by-id reads across 12 engine modules still called `FACTION_DEFINITIONS.get(id)`
 * on the static table, so a run-founded faction — and, from THR-1155 slice 2, a
 * Realm — was shut out of ambitions, quests, ladders, reputation and encounter
 * gates. Nobody noticed because a founded faction is rare and
 * `encounterFilterPipeline`'s gate fails *open* on a missing definition: a missed
 * site there hides content rather than throwing.
 *
 * So the sweep cannot be defended by a behavioural test alone — a re-introduced
 * static read would pass every one of them. This asserts the shape instead.
 *
 * **The predicate** (THR-1155 § Engine B): no module under `src/engine`
 * (production only) imports `FACTION_DEFINITIONS` or `ALL_FACTION_DEFINITIONS`
 * from the static tables, with two deliberate exemptions:
 *
 * - `worldSeed.ts` mints *from* the authored roster, which is enumeration, not
 *   an id lookup.
 * - Test files under `src/engine/**\/__tests__/` import the static map on
 *   purpose, to pin authored content.
 *
 * Enumeration consumers that mean *the authored roster* (content-eval chip
 * declarations, sigil coverage) live outside `src/engine` and keep the static
 * map by design — `getFactionDefinitionRoster()` is the live-run equivalent when
 * a caller wants both halves.
 */

import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ENGINE_DIR = join(process.cwd(), 'src', 'engine');

/** Mints from the authored roster rather than looking one up by id. */
const EXEMPT_FILES = new Set(['worldSeed.ts']);

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
 * An *import* of the static table, not a mention of the word. Comments in
 * `factionNetwork.ts` and `monsterFactionSeed.ts` name `FACTION_DEFINITIONS`
 * while explaining why they do not read it, and a substring match would fail on
 * exactly the modules that document the rule.
 */
function importsStaticDefinitions(source: string): boolean {
  const importBlocks = source.match(/import\s+(?:type\s+)?\{[^}]*\}\s*from\s*'[^']*faction-definitions'/gs) ?? [];
  return importBlocks.some(block => /\b(?:ALL_)?FACTION_DEFINITIONS\b/.test(block));
}

describe('faction definition read sites (THR-1155 tripwire)', () => {
  it('no production engine module imports the static definition map', () => {
    const offenders = collectProductionModules(ENGINE_DIR)
      .filter(path => !EXEMPT_FILES.has(path.split(/[\\/]/).pop() as string))
      .filter(path => importsStaticDefinitions(readFileSync(path, 'utf8')))
      .map(path => path.slice(ENGINE_DIR.length + 1).replace(/\\/g, '/'));

    expect(offenders).toEqual([]);
  });

  it('the sweep covered a real population — the scan sees the engine it claims to', () => {
    // Guards the vacuous-probe failure mode: a collector that walked the wrong
    // directory, or a matcher that never matches, would pass the assertion above
    // on an empty set. Both halves are pinned: the corpus is large, and the
    // matcher demonstrably fires on the one module that legitimately imports.
    const modules = collectProductionModules(ENGINE_DIR);
    expect(modules.length).toBeGreaterThan(100);

    const worldSeed = modules.find(p => p.endsWith('worldSeed.ts'));
    expect(worldSeed).toBeDefined();
    expect(importsStaticDefinitions(readFileSync(worldSeed as string, 'utf8'))).toBe(true);
  });

  it('the swept modules resolve through the lookup', () => {
    // The twelve modules the sweep touched. Pinned by name so that deleting a
    // read site (rather than converting it) is visible as a decision.
    const swept = [
      'agentDetail.ts', 'encounterFilterPipeline.ts', 'factionAmbitions.ts',
      'factionMembership.ts', 'factionMemberWork.ts', 'factionOutcome.ts',
      'factionQuestGeneration.ts', 'factionRankBonus.ts', 'factionReputation.ts',
      'npcSeeding.ts', 'phaseReputationTraits.ts', 'socialEncounterGeneration.ts',
    ];

    for (const file of swept) {
      const source = readFileSync(join(ENGINE_DIR, file), 'utf8');
      expect(source, `${file} should import getFactionDefinition`).toMatch(
        /import \{[^}]*getFactionDefinition[^}]*\} from '\.\.\/data\/faction-definition-lookup'/,
      );
    }
  });
});
