/**
 * Contract tests for the Codex incarnation three-state grammar (THR-613 Slice 3b-tail).
 *
 * The invariants that matter:
 *  - the lock keys on `requiresReach` (the real reach gate), never the `reach` tag, so a
 *    universal (no-gate) card is never wrongly "locked this incarnation";
 *  - held/acquirable partition by `unlockedActionIds` (+ starter floor);
 *  - non-ascendant entries carry no state;
 *  - the eight reach signatures are catalogued with `requiresReach` + `isAscendantAction`
 *    (the change that makes "locked this incarnation" legible in the Codex at all);
 *  - the domain set is the same `getAscendantProgress` read the Signatures readout uses.
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../../../engine/graph';
import {
  buildCodexRunContext,
  codexEntryRunState,
  type CodexRunContext,
} from '../codexRunState';
import { getAllCodexEntries } from '../codexRegistry';
import type { CodexEntry } from '../codexRegistry';
import type { GameState } from '../../../types/gameState';
import type { ReachDomain } from '../../../types/traits';

function gameStateWith(opts: {
  domainAffinities?: Partial<Record<ReachDomain, number>>;
  unlockedActionIds?: string[];
  omitAscendant?: boolean;
}): GameState {
  const graph = new WorldGraph();
  if (!opts.omitAscendant) {
    graph.addNode({
      id: 'asc-1',
      type: 'actor',
      name: 'The God',
      properties: {
        actorType: 'ascendant',
        domainAffinities: opts.domainAffinities ?? { iron: 5, gold: 3 },
      },
    });
  }
  return {
    tick: 10,
    seed: 42,
    ascendantId: 'asc-1',
    graph,
    unlockedActionIds: opts.unlockedActionIds ?? [],
  } as unknown as GameState;
}

/** Minimal entry carrying only the fields `codexEntryRunState` reads. */
function entry(partial: Partial<CodexEntry>): CodexEntry {
  return {
    id: 'x',
    name: 'X',
    glyph: '★',
    tier: 1,
    tierName: 'Common',
    tierColor: '#888',
    category: 'divine',
    subcategory: 'divine',
    subtitle: '',
    summary: '',
    tags: [],
    details: [],
    ...partial,
  };
}

describe('buildCodexRunContext', () => {
  it('returns null when there is no ascendant node', () => {
    expect(buildCodexRunContext(gameStateWith({ omitAscendant: true }))).toBeNull();
  });

  it('reads the domain set from affinities and the unlock set from state', () => {
    const ctx = buildCodexRunContext(
      gameStateWith({ domainAffinities: { iron: 5, gold: 3 }, unlockedActionIds: ['divine.dream'] }),
    )!;
    expect([...ctx.domains].sort()).toEqual(['gold', 'iron']);
    expect(ctx.unlockedActionIds.has('divine.dream')).toBe(true);
  });
});

describe('codexEntryRunState — three-state grammar', () => {
  const ctx: CodexRunContext = {
    domains: new Set(['iron', 'gold']),
    unlockedActionIds: new Set(['invest.iron.warhost', 'divine.dream']),
  };

  it('returns null for a non-ascendant entry (mortal action / possession)', () => {
    expect(codexEntryRunState(entry({ id: 'action.trade', isAscendantAction: false }), ctx)).toBeNull();
    expect(codexEntryRunState(entry({ id: 'possession.sword' }), ctx)).toBeNull();
  });

  it('locks a reach-gated card whose requiresReach is outside the domains', () => {
    const e = entry({ id: 'invest.veil.rend_the_gate', isAscendantAction: true, requiresReach: 'veil' });
    expect(codexEntryRunState(e, ctx)).toBe('locked_incarnation');
  });

  it('does NOT lock an in-domain reach-gated card — held if earned, acquirable if not', () => {
    const held = entry({ id: 'invest.iron.warhost', isAscendantAction: true, requiresReach: 'iron' });
    const notYet = entry({ id: 'invest.gold.patronage_network', isAscendantAction: true, requiresReach: 'gold' });
    expect(codexEntryRunState(held, ctx)).toBe('available');
    expect(codexEntryRunState(notYet, ctx)).toBe('acquirable');
  });

  it('never locks a universal (no requiresReach) card, even with an off-domain reach tag', () => {
    // A star/universal divine action tags reach:'star' but declares no requiresReach.
    const universalHeld = entry({ id: 'divine.dream', isAscendantAction: true, tags: ['star'] });
    const universalNotYet = entry({ id: 'divine.omen', isAscendantAction: true, tags: ['star'] });
    expect(codexEntryRunState(universalHeld, ctx)).toBe('available');
    expect(codexEntryRunState(universalNotYet, ctx)).toBe('acquirable');
  });

  it('treats a starter card as held regardless of the unlock set', () => {
    const starter = entry({ id: 'divine.starter', isAscendantAction: true, isStarter: true });
    expect(codexEntryRunState(starter, ctx)).toBe('available');
  });
});

describe('registry integration — the eight signatures are catalogued for the grammar', () => {
  const all = getAllCodexEntries();
  const signatures = all.filter((e) => e.id.startsWith('invest.'));

  it('includes the reach signatures as ascendant divine actions with a gate reach', () => {
    expect(signatures.length).toBeGreaterThanOrEqual(8);
    for (const s of signatures) {
      expect(s.category).toBe('divine');
      expect(s.isAscendantAction).toBe(true);
      expect(typeof s.requiresReach).toBe('string');
    }
  });

  it('partitions the signatures by a two-domain incarnation exactly as the drawer would hide them', () => {
    const ctx: CodexRunContext = { domains: new Set(['iron', 'gold']), unlockedActionIds: new Set() };
    for (const s of signatures) {
      const state = codexEntryRunState(s, ctx);
      if (s.requiresReach === 'iron' || s.requiresReach === 'gold') {
        expect(state).toBe('acquirable'); // in-domain, not yet earned
      } else {
        expect(state).toBe('locked_incarnation'); // off-domain — hidden from the live drawer
      }
    }
  });

  it('generic divine actions carry no gate reach (never locked this incarnation)', () => {
    const generic = all.filter((e) => e.id.startsWith('divine.'));
    expect(generic.length).toBeGreaterThan(0);
    for (const g of generic) expect(g.requiresReach).toBeUndefined();
  });
});
