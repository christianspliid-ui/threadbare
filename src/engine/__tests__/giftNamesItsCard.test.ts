/**
 * THR-1855 — a gift says what it gave.
 *
 * Warm playtest round 2: 3/3 testers received a gift and could not say what it was.
 * The rung-opening words said "it gives you this one freely" and named nothing; the
 * secondary-signature gift resolves its card per god, so the modal (reading the
 * beat's static `grantsActionIds`) showed no card; and Receive closed silently.
 *
 * These arms are predicates over every rung gift (THR-688 rule A), enumerated from
 * `rungGiftsFor`, so a new key fails here the day it lands without a nameable card.
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import type { GameState } from '../../types/gameState';
import type { PendingBeat } from '../../types/ascendantBeat';
import { rungGiftsFor, rungGiftDefinition } from '../godProgression';
import {
  buildGiftCardsEvent,
  previewReachSignatureGrant,
  resolvePendingBeat,
} from '../ascendantBeat';
import { phaseAscendantProgression } from '../phaseAscendantProgression';
import { ASCENDANT_MILESTONE_BEATS } from '../../data/ascendant-milestone-beats';
import { REACH_SIGNATURE_ID_BY_REACH } from '../../data/reach-signature-content';
import { getUnifiedTemplateById } from '../../data/unified-action-templates';
import { RUNG_BEAT_PRESENTATION } from '../../data/god-progression-content';

/** The name the card face prints: its spell name when it has one. */
function faceName(id: string): string | undefined {
  const t = getUnifiedTemplateById(id);
  return t ? (t.spellName ?? t.name) : undefined;
}

/** The Shepherd: life/spirit, heart/stone/star — stone is the secondary reach. */
const SHEPHERD = {
  actorType: 'ascendant',
  domainAffinities: { heart: 4, stone: 3, star: 2 },
  sphereAlignment: { primary: 'life', secondary: 'spirit' },
};

function makeState(opts: { pending?: PendingBeat; unlocked?: string[]; earned?: Record<string, number> } = {}): GameState {
  const graph = new WorldGraph();
  graph.addNode({ id: 'asc-1', type: 'actor', name: 'God', properties: { ...SHEPHERD, milestoneBeatsFired: ASCENDANT_MILESTONE_BEATS.map(b => b.beatId) } });
  return {
    graph,
    ascendantId: 'asc-1',
    tick: 200,
    ascendantBeats: { spineCursor: -1, pending: opts.pending ?? null, history: [], lastBeatTurn: 0 },
    unlockedActionIds: opts.unlocked ?? [],
    essenceEarnedBySphere: opts.earned ?? {},
    chronicleEntries: [],
    tickEvents: [],
    recentEvents: [],
  } as unknown as GameState;
}

function rungGiftPending(beatId: string): PendingBeat {
  return { beatId, kind: 'rung_gift', offeredTurn: 200, boundNodeIds: ['asc-1'], trigger: { kind: 'turn', minTurn: 200 } } as PendingBeat;
}

/** The card the modal shows for a gift: its static grant, else its resolved signature. */
function shownCard(state: GameState, beatId: string): string | null {
  return rungGiftDefinition(beatId)?.grantsActionIds?.[0] ?? previewReachSignatureGrant(state, beatId);
}

const EVERY_RUNG_GIFT = [2, 3, 4].flatMap(r => rungGiftsFor(r));

describe('THR-1855 — every rung gift names a card before and after Receive', () => {
  it('enumerates enough gifts for the predicates to mean anything', () => {
    expect(EVERY_RUNG_GIFT.length).toBeGreaterThan(3);
    expect(EVERY_RUNG_GIFT).toContain('beat.rung.2.signature.secondary');
  });

  it.each(EVERY_RUNG_GIFT)('%s: the modal has a named card, and Receive raises an event naming it', (beatId) => {
    const state = makeState({ pending: rungGiftPending(beatId) });
    const cardId = shownCard(state, beatId);
    expect(cardId).not.toBeNull();
    const name = faceName(cardId!);
    expect(name).toBeTruthy();

    const result = resolvePendingBeat(state);
    expect(result.resolved).toBe(true);
    // What the modal showed is what the god received.
    expect(result.grantedActionIds).toContain(cardId);
    const events = result.state.tickEvents ?? [];
    const named = events.find(e => e.id.startsWith('beat_cards_') && e.message.includes(name!));
    expect(named).toBeDefined();
    expect(named?.notification?.channel).toBe('toast');
    expect(result.state.recentEvents?.some(e => e.id === named?.id)).toBe(true);
  });

  it('the secondary-signature gift previews the god\'s own second reach', () => {
    const state = makeState();
    expect(previewReachSignatureGrant(state, 'beat.rung.2.signature.secondary')).toBe(REACH_SIGNATURE_ID_BY_REACH.stone);
    expect(previewReachSignatureGrant(state, 'beat.rung.2.action.bestow')).toBeNull();
  });

  it('a gift whose card is already held raises no card event', () => {
    const beatId = 'beat.rung.2.action.bestow';
    const cardId = rungGiftDefinition(beatId)!.grantsActionIds![0];
    const result = resolvePendingBeat(makeState({ pending: rungGiftPending(beatId), unlocked: [cardId] }));
    expect((result.state.tickEvents ?? []).some(e => e.id.startsWith('beat_cards_'))).toBe(false);
  });

  it('names several cards in one line', () => {
    const event = buildGiftCardsEvent('beat.x', ['hex.amplify_flow', 'hex.ward_against_deep'], 5);
    expect(event?.message).toBe(`New cards are yours: ${faceName('hex.amplify_flow')} and ${faceName('hex.ward_against_deep')}.`);
    expect(buildGiftCardsEvent('beat.x', ['no.such.card'], 5)).toBeNull();
  });
});

describe('THR-1855 — the rung-opening words name the gift', () => {
  it.each([2, 3, 4])('rung %i\'s opening words carry a {card} slot', (rung) => {
    expect(RUNG_BEAT_PRESENTATION[rung].prose).toContain('{card}');
  });

  it('the rung-2 chronicle line names the secondary signature, not a raw slot', () => {
    const state = makeState({ earned: { life: 60, spirit: 20 } });
    const patch = phaseAscendantProgression(state);
    expect(patch.ascendantBeats?.pending?.beatId).toBe('beat.rung.2.signature.secondary');
    const line = patch.chronicleEntries?.find(c => c.title === RUNG_BEAT_PRESENTATION[2].title)?.prose ?? '';
    expect(line).not.toContain('{');
    expect(line).toContain(faceName(REACH_SIGNATURE_ID_BY_REACH.stone!)!);
  });
});
