/**
 * The Repertoire — library liveness, sphere gating, unlock determinism, and
 * echo-card selection. THR-887.
 *
 * The liveness tests here are deliberately written so they can *fail*: each one
 * asserts a non-zero population before asserting the property over it. A sweep
 * that matched nothing and printed PASS is the failure mode these gates exist
 * to catch, not a shape they are allowed to take.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import type { NudgeCardMember } from '../../data/nudge-card-library';
import {
  BAND_FRAGMENTS,
  HUNGER_UNIQUE_CARDS,
  NUDGE_CARD_LIBRARY,
  NUDGE_CARD_TYPES,
  PLAY_PROFILES,
  SPHERE_SIGNATURES,
  UNIVERSAL_CORE_TYPES,
  cardDisplayTitle,
  dealableMembers,
  nudgeCardFamily,
  nudgeCardMember,
  nudgeCardType,
  profiledCardCount,
  unauthoredCardCount,
} from '../../data/nudge-card-library';
import {
  buildCardEcho,
  buildRepertoire,
  cardTypeAccess,
  echoCardsFromDefinitions,
  isMemberUnlocked,
  memberAccess,
  repertoireCardCost,
  resetRepertoireWarnings,
  selectEchoCard,
  startingRepertoire,
  validateRepertoire,
} from '../nudgeCardRepertoire';
import {
  DEAL_FAILURE_BAND_OUTCOMES,
  ECHO_CARD_SCAR_DISCOUNT,
  ECHO_CARD_SCAR_PENALTY,
  SECONDARY_SPHERE_DISCOUNT,
} from '../../data/nudge-constants';
import {
  NUDGE_BIG_DELTA,
  NUDGE_WORD_BUDGETS,
} from '../../data/content-eval/nudgeAuthoringConstants';
import { buildNudgeHand } from '../encounters/nudges';
import { SPHERE_NAMES } from '../../types/index';
import type { HungerId } from '../../types/hunger';
import type { EchoDefinition } from '../../types/echo';

beforeEach(() => {
  resetRepertoireWarnings();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ─── Library liveness ────────────────────────────────────────────────

describe('library liveness', () => {
  it('sweeps a non-empty key set and finds every key live', () => {
    const report = validateRepertoire();

    // Guard the guard: a zero here would make the two assertions below vacuous.
    expect(report.checkedKeys).toBeGreaterThan(20);
    expect(report.deadHungerCards).toEqual([]);
    expect(report.unbuiltSignatureTypes).toEqual([]);
  });

  it('hunger uniques cover every live hunger, one card each, all distinct', () => {
    const entries = Object.entries(HUNGER_UNIQUE_CARDS) as [HungerId, string][];
    expect(entries.length).toBeGreaterThan(0);

    // Pinned as a closed set: adding a HungerId member without its unique card
    // must fail here rather than silently shipping a hungerless god. THR-891
    // closed the 10-vs-12 gap in favour of 12 — the number the remembrance
    // catalog, the meeting prose register, the plan doc and the wiki page all
    // already used.
    expect(entries.map(([h]) => h).sort()).toEqual([
      'bind', 'consume', 'gather', 'haunt', 'illuminate', 'kindle',
      'preserve', 'reclaim', 'reshape', 'sever', 'wander', 'witness',
    ]);

    const ids = entries.map(([, id]) => id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const [hunger, id] of entries) {
      const member = nudgeCardMember(id);
      expect(member, `hunger '${hunger}' names unbuilt card '${id}'`).toBeDefined();
      expect(member!.hunger).toBe(hunger);
    }
  });

  it('every sphere signs at least one type, and every signed type is built', () => {
    expect(SPHERE_NAMES.length).toBe(12);
    const built = new Set(NUDGE_CARD_LIBRARY.map((m) => m.typeId));

    for (const sphere of SPHERE_NAMES) {
      const types = SPHERE_SIGNATURES[sphere];
      expect(types.length, `sphere '${sphere}' signs nothing`).toBeGreaterThan(0);
      for (const typeId of types) {
        expect(nudgeCardType(typeId), `'${typeId}' is not a card type`).toBeDefined();
        expect(built.has(typeId), `'${typeId}' signed but unbuilt`).toBe(true);
      }
    }
  });

  it('library member ids are unique and every member names a real type', () => {
    expect(NUDGE_CARD_LIBRARY.length).toBeGreaterThan(20);
    const ids = NUDGE_CARD_LIBRARY.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const member of NUDGE_CARD_LIBRARY) {
      expect(nudgeCardType(member.typeId), `${member.id} → ${member.typeId}`).toBeDefined();
    }
  });

  it('carries all 21 player-facing types, with unique ids', () => {
    expect(NUDGE_CARD_TYPES.length).toBe(21);
    const ids = NUDGE_CARD_TYPES.map((t) => t.id);
    expect(new Set(ids).size).toBe(21);
  });

  // THR-1178 workstream B authored every member, so the library no longer
  // supplies an unauthored exerciser. The three tests below replace the single
  // pre-B test that asserted one existed: the corpus is complete, every face
  // meets the locked THR-883 format, and the keyword fallback still works for
  // the member that has not been written yet.

  it('every library member is authored — no keyword-only cards ship', () => {
    expect(NUDGE_CARD_LIBRARY.length).toBeGreaterThan(20);
    // Named per member so a regression says *which* card lost its face.
    const unauthored = NUDGE_CARD_LIBRARY.filter(
      (m) => m.title === undefined || m.quote === undefined,
    ).map((m) => m.id);
    expect(unauthored).toEqual([]);
    expect(unauthoredCardCount()).toBe(0);
    // The render path, not just the data: every card now prints its authored
    // title rather than its type keyword. Asserting presence alone would pass
    // even if `withContent` were dropped from the assembly.
    for (const member of NUDGE_CARD_LIBRARY) {
      expect(cardDisplayTitle(member), member.id).toBe(member.title);
      expect(cardDisplayTitle(member), `${member.id} still reads as its keyword`).not.toBe(
        nudgeCardType(member.typeId)!.keyword,
      );
    }
  });

  it('every authored face meets the locked card-face format', () => {
    expect(NUDGE_CARD_LIBRARY.length).toBeGreaterThan(20);
    for (const member of NUDGE_CARD_LIBRARY) {
      const words = member.title!.trim().split(/\s+/);
      // 2–4 generic words (spec § card face). A one-word title is a keyword,
      // not a name; a five-word title is a sentence pretending to be a label.
      expect(words.length, `${member.id} title "${member.title}"`).toBeGreaterThanOrEqual(2);
      expect(words.length, `${member.id} title "${member.title}"`).toBeLessThanOrEqual(4);
      // The quote is one short line — never a paragraph, never multi-line.
      expect(member.quote!.trim().length, `${member.id} quote`).toBeGreaterThan(0);
      expect(member.quote!, `${member.id} quote is one line`).not.toMatch(/\n/);
      expect(member.quote!.length, `${member.id} quote length`).toBeLessThanOrEqual(80);
    }
  });

  it('authored faces are distinct — no two cards share a title or a quote', () => {
    const titles = NUDGE_CARD_LIBRARY.map((m) => m.title!);
    const quotes = NUDGE_CARD_LIBRARY.map((m) => m.quote!);
    expect(titles.length).toBeGreaterThan(20);
    expect(new Set(titles).size, 'duplicate card title').toBe(titles.length);
    expect(new Set(quotes).size, 'duplicate card quote').toBe(quotes.length);
  });

  it('the keyword fallback still carries a member with no authored title', () => {
    // Synthetic rather than drawn from the library: the fallback is a fail-soft
    // path for a member added *later* without content, and after workstream B
    // the library deliberately holds no example of it. Reading the exerciser
    // from the corpus would make this test silently vacuous the day the corpus
    // is complete — which is today.
    const unauthored: NudgeCardMember = { id: 'card.boost.test_only', typeId: 'boost' };
    expect(unauthored.title).toBeUndefined();
    expect(cardDisplayTitle(unauthored)).toBe(nudgeCardType('boost')!.keyword);
  });

  it('a family gathers every member sharing its type', () => {
    // Insurance is signed by `order` *and* universal core, so its family has to
    // hold more than one member — the case that would break a 1:1 assumption.
    const family = nudgeCardFamily('insurance');
    expect(family.length).toBeGreaterThan(1);
    expect(family.every((m) => m.typeId === 'insurance')).toBe(true);
  });
});

// ─── The dealt-hand corpus (THR-1248) ────────────────────────────────

/**
 * Placeholders `enrichProse` actually resolves in an appended band fragment.
 *
 * Hardcoded rather than imported because it is a *content* rule, not a mirror
 * of the resolver: the corpus is written to the pronoun/actor subset, and the
 * scene-scoped placeholders (`{location}`, `{faction}`, `{group}`, the omen and
 * economy families) are exactly what a generic fragment must never reach for —
 * a fragment naming a location reads wrong in the other forty encounters it
 * gets appended to.
 *
 * The gate exists because the failure is silent: an unresolved placeholder is
 * not an error, it renders literally, so `{theirs}` would have shipped as the
 * four characters `{the` … in front of a player. It was caught by hand during
 * authoring; this is what catches the next one.
 */
const RESOLVABLE_FRAGMENT_PLACEHOLDERS: ReadonlySet<string> = new Set([
  '{actor}', '{Actor}',
  '{they}', '{They}',
  '{them}', '{Them}',
  '{their}', '{Their}',
  '{themselves}', '{s}',
]);

describe('dealt-hand corpus', () => {
  it('every library member carries a play profile', () => {
    expect(NUDGE_CARD_LIBRARY.length).toBeGreaterThan(20);
    // Named per member so a regression says *which* card lost its profile,
    // exactly as the `unauthoredCardCount()` gate above does for faces.
    const unprofiled = NUDGE_CARD_LIBRARY.filter((m) => PLAY_PROFILES[m.id] === undefined).map(
      (m) => m.id,
    );
    expect(unprofiled).toEqual([]);
    expect(profiledCardCount()).toBe(NUDGE_CARD_LIBRARY.length);
  });

  it('every library member is actually dealable — profile and payoff prose both', () => {
    // `dealableMembers()` is the dealer's own candidate universe, so this
    // asserts the property through the function the engine consults rather than
    // re-deriving it. A member that is profiled but unpayable is invisible at
    // runtime; that is the shape this pins against.
    expect(dealableMembers().length).toBe(NUDGE_CARD_LIBRARY.length);

    const report = validateRepertoire();
    expect(report.unpayableProfiles).toEqual([]);
    expect(report.profilelessFragments).toEqual([]);
    expect(report.winOnlyFragments).toEqual([]);
  });

  it('every member pays off in at least one failure band', () => {
    let checked = 0;
    for (const member of NUDGE_CARD_LIBRARY) {
      const bands = Object.keys(BAND_FRAGMENTS[member.id] ?? {});
      expect(bands.length, `${member.id} has no band fragments`).toBeGreaterThan(0);
      expect(
        bands.some((b) => DEAL_FAILURE_BAND_OUTCOMES.includes(b as never)),
        `${member.id} narrates only its wins`,
      ).toBe(true);
      checked++;
    }
    // Guard the guard: an empty library would make the loop above vacuous.
    expect(checked).toBe(NUDGE_CARD_LIBRARY.length);
    expect(checked).toBeGreaterThan(20);
  });

  it('a big-delta member reads its failure at both depths', () => {
    const big = NUDGE_CARD_LIBRARY.filter(
      (m) => PLAY_PROFILES[m.id]!.forecastDelta >= NUDGE_BIG_DELTA,
    );
    // Non-vacuous by construction: if the corpus ever holds no big-delta member
    // this assertion fails rather than passing over an empty set.
    expect(big.length).toBeGreaterThan(0);
    for (const member of big) {
      const bands = BAND_FRAGMENTS[member.id] ?? {};
      expect(bands.failure, `${member.id} moved the odds hard and has no 'failure'`).toBeDefined();
      expect(
        bands.critical_failure,
        `${member.id} moved the odds hard and has no 'critical_failure'`,
      ).toBeDefined();
    }
  });

  it('every fragment uses only placeholders the enricher resolves', () => {
    let scanned = 0;
    for (const [cardId, bands] of Object.entries(BAND_FRAGMENTS)) {
      for (const [band, text] of Object.entries(bands)) {
        for (const found of text.match(/\{[A-Za-z_:|]+\}/g) ?? []) {
          expect(
            RESOLVABLE_FRAGMENT_PLACEHOLDERS.has(found),
            `${cardId}.${band} uses '${found}', which renders literally`,
          ).toBe(true);
        }
        scanned++;
      }
    }
    expect(scanned).toBeGreaterThan(20);
  });

  it('every fragment stays inside the band-fragment word budget', () => {
    let scanned = 0;
    for (const [cardId, bands] of Object.entries(BAND_FRAGMENTS)) {
      for (const [band, text] of Object.entries(bands)) {
        const words = text.trim().split(/\s+/).length;
        expect(
          words,
          `${cardId}.${band} is ${words} words, over ${NUDGE_WORD_BUDGETS.bandFragment}`,
        ).toBeLessThanOrEqual(NUDGE_WORD_BUDGETS.bandFragment);
        scanned++;
      }
    }
    expect(scanned).toBeGreaterThan(20);
  });

  it('every profile carries its own effect line, and none of them names a number', () => {
    let checked = 0;
    for (const member of NUDGE_CARD_LIBRARY) {
      const profile = PLAY_PROFILES[member.id]!;
      expect(profile.effectLine, `${member.id} falls back to its type keyword`).toBeDefined();
      // The nudge law: words, never a numeral. A card that prints a number tells
      // the player what the forecast word is for.
      expect(profile.effectLine, `${member.id} effect line names a number`).not.toMatch(/\d/);
      const words = profile.effectLine!.trim().split(/\s+/).length;
      expect(words, `${member.id} effect line is ${words} words`).toBeLessThanOrEqual(
        NUDGE_WORD_BUDGETS.effectLine,
      );
      checked++;
    }
    expect(checked).toBeGreaterThan(20);
  });

  it('effect lines are distinct, so two members of a family never read alike', () => {
    // The reason `effectLine` exists at all (THR-1248): the type-keyword
    // fallback is identical across a family, so three Boost members would deal
    // as three copies of one sentence and the hand would stop being a decision.
    const lines = NUDGE_CARD_LIBRARY.map((m) => PLAY_PROFILES[m.id]!.effectLine);
    expect(new Set(lines).size).toBe(lines.length);
  });
});

// ─── Sphere gating ───────────────────────────────────────────────────

describe('sphere access', () => {
  it('universal core is full for a god with no spheres at all', () => {
    for (const typeId of UNIVERSAL_CORE_TYPES) {
      expect(cardTypeAccess(typeId, {})).toBe('full');
    }
  });

  it('primary signs at full strength, secondary discounts, off-sphere locks', () => {
    // chaos signs gambit+stumble; life signs balm; force signs heavy_hand.
    expect(cardTypeAccess('gambit', { primary: 'chaos', secondary: 'life' })).toBe('full');
    expect(cardTypeAccess('balm', { primary: 'chaos', secondary: 'life' })).toBe('discounted');
    expect(cardTypeAccess('heavy_hand', { primary: 'chaos', secondary: 'life' })).toBe('locked');
  });

  it('a type signed by both spheres resolves full, never stacked', () => {
    // `order` signs insurance, which is also universal core — the overlap case.
    const access = cardTypeAccess('insurance', { primary: 'order', secondary: 'order' });
    expect(access).toBe('full');
    expect(repertoireCardCost(3, access)).toBe(3);
  });

  it("a signature member of a core type belongs to its sphere, not to everyone", () => {
    // The "⁺" case: `order` signs Insurance and `energy` signs Boost, both of
    // which are *also* universal core types. Reading access off the type alone
    // handed order's signature Insurance to every god in the game.
    const orderSignature = nudgeCardMember('card.insurance.signature.order')!;

    expect(memberAccess(orderSignature, { primary: 'order' })).toBe('full');
    expect(memberAccess(orderSignature, { secondary: 'order' })).toBe('discounted');
    expect(memberAccess(orderSignature, { primary: 'chaos' })).toBe('locked');
    // …while the core Insurance stays universal.
    expect(memberAccess(nudgeCardMember('card.insurance.core')!, { primary: 'chaos' })).toBe('full');
  });

  it('a hunger unique ignores sphere entirely — it is identity, not alignment', () => {
    // witness → a Whisper card, and Whisper is signed by `light`. A chaos/life
    // god must still hold it.
    const witnessCard = nudgeCardMember(HUNGER_UNIQUE_CARDS.witness)!;
    expect(cardTypeAccess(witnessCard.typeId, { primary: 'chaos', secondary: 'life' }))
      .toBe('locked');
    expect(memberAccess(witnessCard, { primary: 'chaos', secondary: 'life' })).toBe('full');
  });

  it('discount comes off a discounted card and off nothing else', () => {
    expect(repertoireCardCost(3, 'discounted')).toBe(3 - SECONDARY_SPHERE_DISCOUNT);
    expect(repertoireCardCost(3, 'full')).toBe(3);
  });

  it('never prices a card below zero', () => {
    expect(repertoireCardCost(0, 'discounted')).toBe(0);
    expect(repertoireCardCost(-5, 'full')).toBe(0);
  });
});

// ─── Unlock determinism ──────────────────────────────────────────────

describe('unlock resolution', () => {
  const milestoneCard = NUDGE_CARD_LIBRARY.find((m) => m.unlock?.kind === 'milestone')!;
  const godTraitCard = NUDGE_CARD_LIBRARY.find((m) => m.unlock?.kind === 'god_trait')!;

  it('has a member for every unlock kind, so none of these tests is vacuous', () => {
    expect(milestoneCard).toBeDefined();
    expect(godTraitCard).toBeDefined();
  });

  it('a milestone card is locked until its grant id is in unlockedActionIds', () => {
    const grantId = (milestoneCard.unlock as { unlockActionId: string }).unlockActionId;
    expect(isMemberUnlocked(milestoneCard, {})).toBe(false);
    expect(isMemberUnlocked(milestoneCard, { unlockedActionIds: new Set([grantId]) })).toBe(true);
  });

  it('a god-trait card stays locked today — the THR-791 hook is live and inert', () => {
    expect(isMemberUnlocked(godTraitCard, {})).toBe(false);
    const traitId = (godTraitCard.unlock as { traitId: string }).traitId;
    expect(isMemberUnlocked(godTraitCard, { godTraitIds: new Set([traitId]) })).toBe(true);
  });

  it('a hunger unique is held only by its own hunger', () => {
    const witnessCard = nudgeCardMember(HUNGER_UNIQUE_CARDS.witness)!;
    expect(isMemberUnlocked(witnessCard, { hunger: 'witness' })).toBe(true);
    expect(isMemberUnlocked(witnessCard, { hunger: 'sever' })).toBe(false);
    expect(isMemberUnlocked(witnessCard, {})).toBe(false);
  });

  it('is deterministic — the same context twice yields the same repertoire', () => {
    const context = {
      primary: 'chaos' as const,
      secondary: 'life' as const,
      hunger: 'witness' as const,
      unlockedActionIds: new Set(['divine.rekindle_thread']),
    };
    const a = buildRepertoire(context).map((e) => e.member.id);
    const b = buildRepertoire(context).map((e) => e.member.id);
    expect(a).toEqual(b);
    expect(a.length).toBeGreaterThan(0);
  });

  it('a milestone grant only ever adds cards — it never takes one away', () => {
    const base = { primary: 'chaos' as const, hunger: 'witness' as const };
    const before = buildRepertoire(base).map((e) => e.member.id);
    const after = buildRepertoire({
      ...base,
      unlockedActionIds: new Set(['divine.rekindle_thread']),
    }).map((e) => e.member.id);

    expect(after.length).toBeGreaterThan(before.length);
    for (const id of before) expect(after).toContain(id);
  });

  it('a starting repertoire holds core + signatures + its hunger unique, and no off-sphere card', () => {
    const entries = startingRepertoire({ primary: 'chaos', secondary: 'life', hunger: 'witness' });
    const ids = entries.map((e) => e.member.id);

    expect(ids).toContain('card.boost.core');
    expect(ids).toContain('card.gambit.signature.chaos');
    expect(ids).toContain(HUNGER_UNIQUE_CARDS.witness);
    // `force` signs heavy_hand and this god holds neither sphere.
    expect(ids).not.toContain('card.heavy_hand.signature.force');
    // Another god's hunger unique is never dealt.
    expect(ids).not.toContain(HUNGER_UNIQUE_CARDS.sever);
  });

  it('a god with no identity at all still holds a playable hand', () => {
    const ids = startingRepertoire({}).map((e) => e.member.id);
    expect(ids.length).toBe(UNIVERSAL_CORE_TYPES.length);
    expect(ids).toContain('card.mercy.core');
  });
});

// ─── The hand gate ───────────────────────────────────────────────────

describe('repertoire gates the dealt hand', () => {
  const step = {
    nudges: [
      { id: 'n1', libraryCardId: 'card.boost.core', name: 'Held', essenceCost: 0, forecastDelta: 5, fiction: '', effectLine: '' },
      { id: 'n2', libraryCardId: 'card.heavy_hand.signature.force', name: 'Not held', essenceCost: 0, forecastDelta: 5, fiction: '', effectLine: '' },
      { id: 'n3', name: 'One-off', essenceCost: 0, forecastDelta: 5, fiction: '', effectLine: '' },
    ],
  } as Parameters<typeof buildNudgeHand>[0];
  const template = { id: 't1' } as Parameters<typeof buildNudgeHand>[1];
  const base = {
    availableEssence: () => 99,
    accessibleSpheres: [...SPHERE_NAMES],
    unlockedTemplateIds: new Set<string>(),
    heldTraits: new Set<string>(),
  };

  it('withholds a card the god does not hold, keeps the ones it does', () => {
    const repertoireCardIds = new Set(
      buildRepertoire({ primary: 'chaos' }).map((e) => e.member.id),
    );
    // Guard: the fixture only means something if the god really lacks n2's card.
    expect(repertoireCardIds.has('card.boost.core')).toBe(true);
    expect(repertoireCardIds.has('card.heavy_hand.signature.force')).toBe(false);

    const hand = buildNudgeHand(step, template, { ...base, repertoireCardIds });
    expect(hand.playable.map((e) => e.nudge.id)).toEqual(['n1', 'n3']);
    expect(hand.dimmed.map((e) => e.nudge.id)).toEqual(['n2']);
    expect(hand.dimmed[0].blocked).toBe('sphere_locked');
  });

  it('passes every card when no repertoire is supplied (NFP #6)', () => {
    const hand = buildNudgeHand(step, template, base);
    expect(hand.playable.map((e) => e.nudge.id)).toEqual(['n1', 'n2', 'n3']);
    expect(hand.dimmed).toEqual([]);
  });

  it('an echo card unlocks an otherwise off-sphere authored option', () => {
    const repertoireCardIds = new Set(
      buildRepertoire({
        primary: 'chaos',
        echoCards: [{ cardId: 'card.heavy_hand.signature.force', scarred: false }],
      }).map((e) => e.member.id),
    );
    const hand = buildNudgeHand(step, template, { ...base, repertoireCardIds });
    expect(hand.playable.map((e) => e.nudge.id)).toEqual(['n1', 'n2', 'n3']);
  });
});

// ─── Echo card ───────────────────────────────────────────────────────

describe('echo card selection', () => {
  it('picks the most-played card', () => {
    const picked = selectEchoCard([
      { cardId: 'card.boost.core', timesPlayed: 2, peakSignificance: 0.9 },
      { cardId: 'card.mercy.core', timesPlayed: 7, peakSignificance: 0.1 },
    ]);
    expect(picked?.cardId).toBe('card.mercy.core');
  });

  it('breaks a play-count tie on the more storied moment', () => {
    const picked = selectEchoCard([
      { cardId: 'card.boost.core', timesPlayed: 3, peakSignificance: 0.2 },
      { cardId: 'card.mercy.core', timesPlayed: 3, peakSignificance: 0.8 },
    ]);
    expect(picked?.cardId).toBe('card.mercy.core');
  });

  it('breaks a total tie on card id, so a saved run replays identically', () => {
    const tied = [
      { cardId: 'card.mercy.core', timesPlayed: 3, peakSignificance: 0.5 },
      { cardId: 'card.boost.core', timesPlayed: 3, peakSignificance: 0.5 },
    ];
    expect(selectEchoCard(tied)?.cardId).toBe('card.boost.core');
    // Same set, opposite enumeration order — the whole point of the tie-break.
    expect(selectEchoCard([...tied].reverse())?.cardId).toBe('card.boost.core');
  });

  it('returns nothing for a god who never played a card', () => {
    expect(selectEchoCard([])).toBeUndefined();
    expect(selectEchoCard([
      { cardId: 'card.boost.core', timesPlayed: 0, peakSignificance: 0 },
    ])).toBeUndefined();
  });
});

describe('echo card carry', () => {
  it('a triumphant age returns the card whole', () => {
    const echo = buildCardEcho('card.boost.core', 'triumphant', 3, 0.8, ['chaos']);
    expect(echo?.echoType).toBe('card');
    expect(echo?.cardEcho).toEqual({ cardId: 'card.boost.core', scarred: false });
  });

  it('a somber age returns it scarred; a bittersweet one does not', () => {
    expect(buildCardEcho('card.boost.core', 'somber', 3, 0.8, [])?.cardEcho?.scarred).toBe(true);
    expect(buildCardEcho('card.boost.core', 'bittersweet', 3, 0.8, [])?.cardEcho?.scarred).toBe(false);
  });

  it('fails soft on a retired card id — one warn, no echo, no throw', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(buildCardEcho('card.retired.gone', 'triumphant', 3, 0.8, [])).toBeUndefined();
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('deals a carried card in regardless of sphere', () => {
    // `force` signs heavy_hand; this god holds chaos only, so the card would be
    // locked if the echo respected access — it must not.
    const entries = buildRepertoire({
      primary: 'chaos',
      echoCards: [{ cardId: 'card.heavy_hand.signature.force', scarred: false }],
    });
    const echoed = entries.find((e) => e.member.id === 'card.heavy_hand.signature.force');
    expect(echoed?.source).toBe('echo');
    expect(echoed?.forecastPenalty).toBeUndefined();
  });

  it('a scarred card comes back cheaper, carrying its penalty', () => {
    const entries = buildRepertoire({
      primary: 'chaos',
      echoCards: [{ cardId: 'card.heavy_hand.signature.force', scarred: true }],
    });
    const echoed = entries.find((e) => e.member.id === 'card.heavy_hand.signature.force')!;
    expect(echoed.access).toBe('discounted');
    expect(echoed.forecastPenalty).toBe(ECHO_CARD_SCAR_PENALTY);
    expect(echoed.costRelief).toBe(ECHO_CARD_SCAR_DISCOUNT);
  });

  it('never duplicates a card the god already holds', () => {
    const entries = buildRepertoire({
      echoCards: [{ cardId: 'card.boost.core', scarred: false }],
    });
    expect(entries.filter((e) => e.member.id === 'card.boost.core')).toHaveLength(1);
  });

  it('drops a retired echo id at world-seed with one warn, harvest otherwise intact', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const entries = buildRepertoire({
      echoCards: [
        { cardId: 'card.retired.gone', scarred: false },
        { cardId: 'card.heavy_hand.signature.force', scarred: false },
      ],
    });
    expect(warn).toHaveBeenCalledTimes(1);
    expect(entries.some((e) => e.member.id === 'card.heavy_hand.signature.force')).toBe(true);
  });

  it('reads carries off card echoes only, ignoring node-derived ones', () => {
    const defs = [
      {
        id: 'e1', echoType: 'relic', source: 'cosmic', originNodeId: 'artifact_1',
        originCycle: 1, name: 'A blade', summary: '', sphereAffinities: [], significance: 0.5,
        injection: { injectionType: 'quest_seed', description: '' },
      },
      {
        id: 'e2', echoType: 'card', source: 'divine', originNodeId: 'card.boost.core',
        originCycle: 1, name: 'Boost', summary: '', sphereAffinities: [], significance: 0.5,
        injection: { injectionType: 'quest_seed', description: '' },
        cardEcho: { cardId: 'card.boost.core', scarred: true },
      },
    ] as EchoDefinition[];

    expect(echoCardsFromDefinitions(defs)).toEqual([
      { cardId: 'card.boost.core', scarred: true },
    ]);
  });
});
