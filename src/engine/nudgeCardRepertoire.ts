/**
 * The Repertoire — which library cards a god actually holds, and why. THR-887.
 *
 * Three questions, one module:
 *
 * 1. **Access** — is this card's type signed by a sphere the god has? Universal
 *    core always, primary sphere at full strength, secondary discounted,
 *    off-sphere locked (plan Decision 7.1).
 * 2. **Unlock** — has the god earned this member yet? Milestones ride the
 *    existing `unlockedActionIds` grant set; god-traits ride THR-791 when it lands.
 * 3. **Echo** — which card did the finished run belong to, and how does it come
 *    back (plan Decision 7.4).
 *
 * Everything here is **pure over run state** (NFP #3): same ascendant identity,
 * same unlock set, same chronicle ⇒ same repertoire and the same echo card,
 * every time. No PRNG draws — the echo card is *selected*, never rolled.
 *
 * Deliberately its own module rather than more of `nudges.ts`: that file is the
 * per-encounter hand path (partition an authored step's cards into
 * playable/dimmed/hidden). This is the per-*run* library path. They meet at
 * exactly one seam — {@link repertoireCardCost} quotes a price that
 * `effectiveNudgeCost` then charges — and keeping them separate is what stops a
 * repertoire question being answered with an encounter's data.
 *
 * Plan: `Docs/plans/2026-07-30-nudge-card-repertoire.md`
 */

import type { SphereName } from '../types/index';
import type { HungerId } from '../types/hunger';
import type { EchoDefinition } from '../types/echo';
import type { HarvestType } from '../types/worldSoul';
import type { NudgeCardMember, NudgeCardTypeId } from '../data/nudge-card-library';
import {
  BAND_FRAGMENTS,
  HUNGER_UNIQUE_CARDS,
  NUDGE_CARD_LIBRARY,
  PLAY_PROFILES,
  SPHERE_SIGNATURES,
  UNIVERSAL_CORE_TYPES,
  nudgeCardMember,
} from '../data/nudge-card-library';
import {
  DEAL_FAILURE_BAND_OUTCOMES,
  ECHO_CARD_SCAR_DISCOUNT,
  ECHO_CARD_SCAR_PENALTY,
  SECONDARY_SPHERE_DISCOUNT,
  SPHERE_ATTUNEMENT_THRESHOLDS,
} from '../data/nudge-constants';
import type { EssenceEarnedBySphere } from '../types/influence';
import type { StepOutcome } from '../types/unifiedAction';

// ─── Warnings ────────────────────────────────────────────────────────

const warned = new Set<string>();

function warnOnce(key: string, message: string): void {
  if (warned.has(key)) return;
  warned.add(key);
  console.warn(`[repertoire] ${message}`);
}

/** Test seam — clears the one-warn memo. */
export function resetRepertoireWarnings(): void {
  warned.clear();
}

// ─── Access ──────────────────────────────────────────────────────────

/**
 * How freely a god may play a card type.
 *
 * `full` — universal core, or signed by the primary sphere. Authored price.
 * `discounted` — signed by the secondary sphere. {@link SECONDARY_SPHERE_DISCOUNT} off.
 * `locked` — signed only by spheres this god does not hold. Not dealt at all.
 */
export type CardAccess = 'full' | 'discounted' | 'locked';

/**
 * Access a card can carry once it is *in* a repertoire.
 *
 * `buildRepertoire` drops locked members before pushing, so an entry's access is
 * never `locked` — stating that in the type rather than the prose is what lets a
 * surface render access without a dead branch for a state it cannot receive.
 */
export type HeldCardAccess = Exclude<CardAccess, 'locked'>;

/** The god's sphere identity, as the repertoire needs to read it. */
export interface AscendantSpheres {
  readonly primary?: SphereName;
  readonly secondary?: SphereName;
}

/** Types a single sphere signs. Empty for a sphere with no signatures. */
export function signatureTypesFor(sphere: SphereName | undefined): readonly NudgeCardTypeId[] {
  if (!sphere) return [];
  return SPHERE_SIGNATURES[sphere] ?? [];
}

/**
 * Access level for one card type.
 *
 * **Universal core wins over everything**, checked first and unconditionally.
 * That ordering is the fail-soft guarantee in plan's table: a god whose sphere
 * keys resolve to nothing still holds Boost, Insurance, Mercy and trait cards,
 * so a broken identity degrades to a plain hand rather than an empty one.
 *
 * A type signed by *both* the primary and secondary sphere resolves `full` —
 * the better of the two, never the sum. Access does not stack.
 */
export function cardTypeAccess(
  typeId: NudgeCardTypeId,
  spheres: AscendantSpheres,
): CardAccess {
  if (UNIVERSAL_CORE_TYPES.includes(typeId)) return 'full';
  if (signatureTypesFor(spheres.primary).includes(typeId)) return 'full';
  if (signatureTypesFor(spheres.secondary).includes(typeId)) return 'discounted';
  return 'locked';
}

/**
 * Access for one *member*, which is not the same question as access to its type.
 *
 * The distinction is the "⁺" in Decision 7.1. `order` signs Insurance and
 * `energy` signs Boost — types that are *also* universal core. Reading access
 * off the type alone would hand `order`'s signature Insurance to every god in
 * the game, because the type resolves `full` for everyone. So a member that
 * declares its own `sphere` is gated on **that sphere**, and only a sphere-less
 * member falls back to its type's access.
 *
 * The core Insurance stays universal; the signature Insurance stays `order`'s.
 */
export function memberAccess(
  member: Pick<NudgeCardMember, 'typeId' | 'sphere' | 'hunger'>,
  spheres: AscendantSpheres,
): CardAccess {
  // A hunger unique is identity, not sphere. It is dealt to its own hunger and
  // to nobody else, and which spheres that god happens to hold is not a
  // question the card asks — the same reasoning as an echo card.
  if (member.hunger !== undefined) return 'full';
  if (member.sphere === undefined) return cardTypeAccess(member.typeId, spheres);
  if (member.sphere === spheres.primary) return 'full';
  if (member.sphere === spheres.secondary) return 'discounted';
  return 'locked';
}

/**
 * Price of a library card at the repertoire layer.
 *
 * Floored at zero, never below: a discount may reach free but may not invert
 * into a card that pays the god to play it.
 */
export function repertoireCardCost(baseCost: number, access: CardAccess): number {
  const base = Math.max(0, baseCost);
  if (access !== 'discounted') return base;
  return Math.max(0, base - SECONDARY_SPHERE_DISCOUNT);
}

// ─── Unlock ──────────────────────────────────────────────────────────

/** What the repertoire needs to know about a god's earned progress. */
export interface RepertoireContext extends AscendantSpheres {
  /** The god's hunger — deals its unique starting card. */
  readonly hunger?: HungerId;
  /**
   * `GameState.unlockedActionIds`. The existing ascendant-progression grant set
   * that `unlock_action` writes — milestone card unlocks read it, they do not
   * mint a second ledger.
   */
  readonly unlockedActionIds?: ReadonlySet<string>;
  /**
   * God-earned trait ids (THR-791). Absent today because god traits do not exist
   * yet, which is exactly why `god_trait` unlocks resolve locked rather than
   * throwing: the hook is live and inert, not missing.
   */
  readonly godTraitIds?: ReadonlySet<string>;
  /**
   * `GameState.essenceEarnedBySphere` — lifetime essence drawn through each
   * sphere (THR-1180). Absent ⇒ all-zero, so `sphere_attunement` members stay
   * locked on a legacy save rather than falling open; the safe direction, and
   * the same one the exhaustiveness guard below takes.
   */
  readonly essenceEarnedBySphere?: EssenceEarnedBySphere;
  /**
   * Echo cards carried in from previous runs — see {@link echoCardsFromDefinitions}.
   * An echo card is held **regardless of sphere**: a dead god's trick does not
   * ask whether the new god is allowed it.
   */
  readonly echoCards?: readonly EchoCardCarry[];
}

/** Has this member's unlock condition been met? */
export function isMemberUnlocked(member: NudgeCardMember, context: RepertoireContext): boolean {
  const unlock = member.unlock ?? { kind: 'starting' as const };
  switch (unlock.kind) {
    case 'starting':
      // A hunger unique is a starting card *for its own hunger only*. Every
      // other god's repertoire simply does not contain it — that uniqueness is
      // the whole point of Decision 7.3.
      if (member.hunger !== undefined) return member.hunger === context.hunger;
      return true;
    case 'milestone':
      return context.unlockedActionIds?.has(unlock.unlockActionId) ?? false;
    case 'god_trait':
      return context.godTraitIds?.has(unlock.traitId) ?? false;
    case 'sphere_attunement':
      // Depth only. Whether the god may touch this family at all was already
      // answered by `memberAccess`, which runs first in `buildRepertoire` — so
      // an attuned god with no claim on the sphere never reaches this line.
      return (context.essenceEarnedBySphere?.[unlock.sphere] ?? 0) >= unlock.threshold;
    default: {
      // Exhaustiveness guard: a new unlock kind that forgets to add a case here
      // reaches this branch, and locking it is the safe direction — an
      // un-earnable card is visibly missing, an accidentally-free one is not.
      const exhaustive: never = unlock;
      warnOnce(
        `unlock:${JSON.stringify(exhaustive)}`,
        `unknown unlock kind on '${member.id}' — treated as locked`,
      );
      return false;
    }
  }
}

/**
 * Library members a given sphere/threshold crossing puts within reach.
 *
 * Names what the mark *could* unlock, which is not the same as what any one god
 * gains: the access check still applies, so a chaos-attuned god who does not
 * hold `chaos` crosses the mark and gains nothing. The trace carries this list
 * anyway — the question it exists to answer is "what did that mark mean?", and
 * an empty list there would read as a broken counter rather than a locked
 * sphere.
 */
export function attunementMemberIdsAt(
  sphere: SphereName,
  threshold: number,
): readonly string[] {
  return NUDGE_CARD_LIBRARY.filter(
    (m) =>
      m.unlock?.kind === 'sphere_attunement' &&
      m.unlock.sphere === sphere &&
      m.unlock.threshold === threshold,
  ).map((m) => m.id);
}

/** One card in a god's repertoire, with the price and provenance it carries. */
export interface RepertoireEntry {
  readonly member: NudgeCardMember;
  readonly access: HeldCardAccess;
  /** Why this card is held — surfaced so the UI can explain a hand. */
  readonly source:
    | 'core'
    | 'signature'
    | 'hunger'
    | 'milestone'
    | 'god_trait'
    | 'sphere_attunement'
    | 'echo';
  /** Forecast penalty this card carries (scarred echo cards only). */
  readonly forecastPenalty?: number;
  /** Essence knocked off (scarred echo cards only — see the scar's bargain). */
  readonly costRelief?: number;
}

function sourceFor(member: NudgeCardMember): RepertoireEntry['source'] {
  if (member.hunger !== undefined) return 'hunger';
  const kind = member.unlock?.kind ?? 'starting';
  if (kind === 'milestone') return 'milestone';
  if (kind === 'god_trait') return 'god_trait';
  // Reported ahead of the sphere check below, which would otherwise call every
  // attunement member a plain `signature` — they all carry a `sphere`, and the
  // provenance a surface wants to explain is *how it was earned*, not that it
  // happens to be sphere-signed.
  if (kind === 'sphere_attunement') return 'sphere_attunement';
  return member.sphere !== undefined ? 'signature' : 'core';
}

/**
 * Every card the god currently holds, in library order.
 *
 * Pure and total: no graph reads, no rng, no clock. Given the same context this
 * returns the same list, which is what lets the echo-card selection below be
 * replayed from a saved run.
 */
export function buildRepertoire(context: RepertoireContext): readonly RepertoireEntry[] {
  const entries: RepertoireEntry[] = [];

  for (const member of NUDGE_CARD_LIBRARY) {
    const access = memberAccess(member, context);
    if (access === 'locked') continue;
    if (!isMemberUnlocked(member, context)) continue;
    entries.push({ member, access, source: sourceFor(member) });
  }

  // Echo cards append last and bypass access entirely — including the locked
  // check above, which is why they are added here rather than filtered in.
  for (const carry of context.echoCards ?? []) {
    const member = nudgeCardMember(carry.cardId);
    if (!member) {
      // Fail-soft (plan's table): a retired card id drops with one warn and the
      // rest of the harvest stands. A dead echo must never take a run with it.
      warnOnce(`echo:${carry.cardId}`, `echo card '${carry.cardId}' no longer exists — dropped`);
      continue;
    }
    if (entries.some((e) => e.member.id === member.id)) continue;
    entries.push({
      member,
      access: carry.scarred ? 'discounted' : 'full',
      source: 'echo',
      ...(carry.scarred
        ? { forecastPenalty: ECHO_CARD_SCAR_PENALTY, costRelief: ECHO_CARD_SCAR_DISCOUNT }
        : {}),
    });
  }

  return entries;
}

/** The starting repertoire — a god at turn one, before any milestone. */
export function startingRepertoire(
  context: Omit<RepertoireContext, 'unlockedActionIds' | 'godTraitIds'>,
): readonly RepertoireEntry[] {
  return buildRepertoire({ ...context, unlockedActionIds: undefined, godTraitIds: undefined });
}

// ─── The echo card ───────────────────────────────────────────────────

/** An echo card carried between runs. */
export interface EchoCardCarry {
  /** Library id of the preserved card. */
  readonly cardId: string;
  /** Somber age ⇒ scarred: cheaper, and carrying a penalty pip. */
  readonly scarred: boolean;
}

/** What the harvest knows about how a run played its cards. */
export interface CardPlayRecord {
  readonly cardId: string;
  /** Times committed across the run. */
  readonly timesPlayed: number;
  /**
   * Significance of the most storied moment this card was played at — the
   * chronicle's own score, not a second opinion about it. `0` for a card that
   * never appeared in a chronicled beat.
   */
  readonly peakSignificance: number;
}

/**
 * The run's defining card: most played, ties broken by the biggest moment, then
 * by card id (plan Decision 7.4).
 *
 * The final id tie-break is what makes this **deterministic** rather than
 * merely usually-stable — two cards played the same number of times at equally
 * storied moments would otherwise resolve to whichever the tally happened to
 * enumerate first, and a saved run would not replay.
 *
 * Returns `undefined` for a run that played no cards at all, which is a real
 * state (a god who never nudged) and not an error.
 */
export function selectEchoCard(
  plays: readonly CardPlayRecord[],
): CardPlayRecord | undefined {
  const played = plays.filter((p) => p.timesPlayed > 0);
  if (played.length === 0) return undefined;

  return played.reduce((best, candidate) => {
    if (candidate.timesPlayed !== best.timesPlayed) {
      return candidate.timesPlayed > best.timesPlayed ? candidate : best;
    }
    if (candidate.peakSignificance !== best.peakSignificance) {
      return candidate.peakSignificance > best.peakSignificance ? candidate : best;
    }
    return candidate.cardId < best.cardId ? candidate : best;
  });
}

/**
 * Harvest types that return the echo card **scarred**.
 *
 * A somber age gives the card back cheaper and wrong. `bittersweet` returns it
 * whole: the design's scar is the price of a *failed* age, not a mixed one.
 */
const SCARRING_HARVESTS: ReadonlySet<HarvestType> = new Set<HarvestType>(['somber']);

/**
 * Build the echo-card echo for a finished run, or `undefined` when there is
 * nothing to preserve.
 *
 * Rides {@link EchoDefinition} rather than minting a parallel carry structure,
 * so the card echo degrades, fades, and threads through the chronicle on the
 * same paths as Legacy, Monument, and Relic. `originNodeId` holds the *library
 * card id* for this echo type — a card is not a graph node, and the field is
 * documented at its declaration as meaning "what this echo is of".
 */
export function buildCardEcho(
  cardId: string,
  harvestType: HarvestType,
  originCycle: number,
  significance: number,
  sphereAffinities: readonly SphereName[],
): EchoDefinition | undefined {
  const member = nudgeCardMember(cardId);
  if (!member) {
    warnOnce(`harvest:${cardId}`, `harvest named unknown card '${cardId}' — no echo card`);
    return undefined;
  }

  const scarred = SCARRING_HARVESTS.has(harvestType);

  return {
    id: `echo_card_${originCycle}_${cardId}`,
    echoType: 'card',
    source: 'divine',
    originNodeId: cardId,
    originCycle,
    name: member.title ?? member.typeId,
    summary: scarred
      ? `A trick the last god died holding, come back wrong.`
      : `A trick the last god was known for.`,
    sphereAffinities: [...sphereAffinities],
    significance,
    injection: {
      injectionType: 'quest_seed',
      description: scarred
        ? `Deals '${cardId}' into the next god's repertoire, scarred.`
        : `Deals '${cardId}' into the next god's repertoire.`,
    },
    cardEcho: { cardId, scarred },
  };
}

/**
 * Echo cards to carry into a new run, read off the surviving echo definitions.
 *
 * Reads `cardEcho` rather than re-deriving from `originNodeId`, so an echo that
 * predates this field (or any non-card echo) is simply skipped instead of being
 * misread as a card id.
 */
export function echoCardsFromDefinitions(
  definitions: readonly EchoDefinition[],
): readonly EchoCardCarry[] {
  const carries: EchoCardCarry[] = [];
  for (const def of definitions) {
    if (def.echoType !== 'card' || !def.cardEcho) continue;
    carries.push(def.cardEcho);
  }
  return carries;
}

// ─── Liveness ────────────────────────────────────────────────────────

export interface RepertoireLivenessReport {
  /** Hunger keys naming a card the library does not build. */
  readonly deadHungerCards: readonly string[];
  /** Signature types no library member actually implements. */
  readonly unbuiltSignatureTypes: readonly string[];
  /**
   * Attunement members naming a mark `SPHERE_ATTUNEMENT_THRESHOLDS` does not
   * contain — a card that can never unlock, because nothing ever emits that
   * crossing. Unlike the signature check above this one *can* fail: `threshold`
   * is a `number`, so the type system has nothing to say about it (THR-1180).
   */
  readonly unreachableAttunementMembers: readonly string[];
  /**
   * THR-1247 — members carrying a play profile but no band fragments.
   *
   * **Undealable, and that is the point of naming them.** The payoff-at-every-band
   * law says a card the god played must be traceable in the prose of how it
   * landed; a profiled member with nothing to say in any band would deal, spend
   * the player's essence, move the odds, and then vanish from the account of
   * what happened. `dealHand` skips them, and this row is what stops that skip
   * from being silent — a prose hole reported by name rather than a card that
   * mysteriously never appears.
   */
  readonly unpayableProfiles: readonly string[];
  /**
   * THR-1247 — members carrying band fragments but no play profile.
   *
   * The mirror defect and the cheaper one: authored prose that can never be
   * reached, because nothing can deal the card it belongs to. Harmless at
   * runtime, which is exactly why it needs a report — it is invisible otherwise,
   * and it means someone's authoring went nowhere.
   */
  readonly profilelessFragments: readonly string[];
  /**
   * THR-1247 — profiled members whose fragments cover no failure band.
   *
   * A hand that only narrates its wins teaches the player that the god's touch
   * is free. This is the library-side restatement of the rule
   * `checkNudgeHand` enforces per authored card.
   */
  readonly winOnlyFragments: readonly string[];
  /** Keys swept, so a caller can tell "all live" from "matched nothing". */
  readonly checkedKeys: number;
}

/*
 * No "signature names a type that is not a card type" check exists here on
 * purpose. `SPHERE_SIGNATURES` is typed `Record<SphereName, NudgeCardTypeId[]>`,
 * so that failure is a compile error and a runtime sweep for it could only ever
 * report zero — a probe that cannot fail is not evidence.
 */

/**
 * Sweep every key in the constant tables against what the library actually
 * builds. Structural only — an *unauthored* card (no title, no quote) is live
 * here, because content is THR-883's job and its absence is planned.
 *
 * Returns a report rather than throwing; the test that owns the gate decides
 * a dead key is fatal.
 */
export function validateRepertoire(): RepertoireLivenessReport {
  let checkedKeys = 0;

  const deadHungerCards: string[] = [];
  for (const [hunger, cardId] of Object.entries(HUNGER_UNIQUE_CARDS)) {
    checkedKeys++;
    if (!nudgeCardMember(cardId)) deadHungerCards.push(`${hunger} → ${cardId}`);
  }

  const builtTypes = new Set(NUDGE_CARD_LIBRARY.map((m) => m.typeId));
  const unbuiltSignatureTypes: string[] = [];
  for (const [sphere, typeIds] of Object.entries(SPHERE_SIGNATURES)) {
    for (const typeId of typeIds) {
      checkedKeys++;
      if (!builtTypes.has(typeId)) unbuiltSignatureTypes.push(`${sphere} → ${typeId}`);
    }
  }

  const marks = new Set(SPHERE_ATTUNEMENT_THRESHOLDS);
  const unreachableAttunementMembers: string[] = [];
  for (const member of NUDGE_CARD_LIBRARY) {
    if (member.unlock?.kind !== 'sphere_attunement') continue;
    checkedKeys++;
    if (!marks.has(member.unlock.threshold)) {
      unreachableAttunementMembers.push(`${member.id} → ${member.unlock.threshold}`);
    }
  }

  // THR-1247 — the two library tables that make a member *dealable* must agree
  // with each other. Neither half is checkable by the type system: both are
  // `Record<string, …>` keyed on member ids, so a typo, a rename, or a
  // half-finished authoring pass produces a silently undealable card (or
  // silently unreachable prose) that nothing else would ever report.
  const unpayableProfiles: string[] = [];
  const profilelessFragments: string[] = [];
  const winOnlyFragments: string[] = [];
  for (const member of NUDGE_CARD_LIBRARY) {
    checkedKeys++;
    const profile = PLAY_PROFILES[member.id];
    const bands = Object.keys(BAND_FRAGMENTS[member.id] ?? {}) as StepOutcome[];
    if (profile && bands.length === 0) {
      unpayableProfiles.push(member.id);
      continue;
    }
    if (!profile && bands.length > 0) {
      profilelessFragments.push(member.id);
      continue;
    }
    if (profile && !bands.some((b) => DEAL_FAILURE_BAND_OUTCOMES.includes(b))) {
      winOnlyFragments.push(member.id);
    }
  }

  return {
    deadHungerCards,
    unbuiltSignatureTypes,
    unreachableAttunementMembers,
    unpayableProfiles,
    profilelessFragments,
    winOnlyFragments,
    checkedKeys,
  };
}
