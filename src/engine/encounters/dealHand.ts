/**
 * The dealer — the Repertoire fills an encounter's hand. THR-1247.
 *
 * Until now every encounter authored its whole 4–8 card hand from scratch, even
 * though the cards became generic and reusable at the THR-883 pivot and even
 * though the Repertoire (THR-887/1180) already knows exactly which cards *this*
 * god holds. Three costs compounded: authoring a hand was the most expensive
 * part of writing an encounter; hands drifted toward each author's favourite
 * three types; and the god's repertoire progression stayed invisible in play,
 * because an encounter only ever showed the cards its author happened to write.
 *
 * Dealing inverts that. The encounter authors its **specials** — the 0–2 cards
 * only it could offer — and declares a fill; this module supplies the rest from
 * cards the player already holds. A hand starts reading as *your god's* hand in
 * any scene.
 *
 * ─── Two properties this module is built around ─────────────────────
 *
 * **1. A minted card is an ordinary `StepNudge`.** Every downstream system —
 * hand partition, commit, dispatch, riders, forecast, echo harvest — is
 * unchanged and unaware that dealing exists. If anything downstream of assembly
 * ever branches on a `dealt.` id, the design has been violated: the entire cost
 * argument is that only assembly changes.
 *
 * **2. No PRNG, ever.** Dealing is pure over (repertoire, declaration, world
 * state), which preserves WS0's zero-rng hand property and makes a dealt hand
 * replayable from a save exactly as an authored one is. Variety across
 * encounters comes from context tags and the god's evolving repertoire, not
 * dice. Shuffle-feel is a *new decision* needing a seeded stream — named here
 * so nobody adds `Math.random()` in passing.
 *
 * Plan: `Docs/plans/2026-08-25-thr-1247-dealt-hands.md`
 */

import type { ActionStep, DealContextTag, StepNudge } from '../../types/unifiedAction';
import type { SphereName } from '../../types/index';
import type { NudgeCardMember, NudgeCardPlayProfile } from '../../data/nudge-card-library';
import {
  BAND_FRAGMENTS,
  NUDGE_CARD_LIBRARY,
  PLAY_PROFILES,
  cardDisplayTitle,
  nudgeCardType,
} from '../../data/nudge-card-library';
import type { RepertoireEntry } from '../nudgeCardRepertoire';
import { buildRepertoire, echoCardsFromDefinitions } from '../nudgeCardRepertoire';
import type { EssenceEarnedBySphere } from '../../types/influence';
import type { EchoDefinition } from '../../types/echo';
import { toHungerId } from '../../types/hunger';
import {
  DEAL_COMMON_OPTIONS_MIN,
  DEAL_DEFAULT_COUNT,
  DEAL_HAND_MAX,
  DEAL_HAND_MAX_TOTAL_DELTA,
  DEAL_PROVENANCE_BONUS,
  DEAL_SPHERE_COMMON_WEIGHT,
  DEAL_SPHERE_COVERAGE_MIN,
  DEAL_SPHERE_PRIMARY_WEIGHT,
  DEAL_SPHERE_SECONDARY_WEIGHT,
  DEAL_TAG_MATCH_WEIGHT,
} from '../../data/nudge-constants';

/** Namespace every minted id carries, so a dealt card can never collide with an authored one. */
export const DEALT_NUDGE_ID_PREFIX = 'dealt.';

const LIBRARY_BY_ID: ReadonlyMap<string, NudgeCardMember> = new Map(
  NUDGE_CARD_LIBRARY.map((m) => [m.id, m]),
);

/** True for an id minted by {@link mintDealtNudge}. Diagnostics and reporting only — never control flow. */
export function isDealtNudgeId(id: string): boolean {
  return id.startsWith(DEALT_NUDGE_ID_PREFIX);
}

/**
 * What the dealer knows about the god and the scene.
 *
 * Everything here is already computed by the caller for other reasons — the
 * dealer derives nothing on its own, which is what keeps it pure and cheap.
 */
export interface DealContext {
  /** The god's primary sphere, if they have a sphere identity at all. */
  readonly primarySphere?: SphereName;
  /** The god's secondary sphere. */
  readonly secondarySphere?: SphereName;
  /** Tags the step declared. Empty ⇒ scoring proceeds on sphere and provenance alone. */
  readonly tags?: readonly DealContextTag[];
}

/** One candidate's scoring, kept for the `__DEBUG` deal report. */
export interface DealCandidateReport {
  readonly cardId: string;
  readonly title: string;
  readonly score: number;
  readonly sphereTerm: number;
  readonly tagTerm: number;
  readonly provenanceTerm: number;
  /** Absent ⇒ dealt. Present ⇒ why it was not. */
  readonly eliminated?: DealEliminationReason;
}

/**
 * Why a candidate did not make the hand.
 *
 * Reported rather than thrown, and reported *by name*: "why did I get this
 * hand" is the question the deal report exists to answer, and an unexplained
 * absence is the one answer it must never give.
 */
export type DealEliminationReason =
  | 'no_profile'
  | 'no_band_fragments'
  | 'type_already_authored'
  | 'type_excluded'
  | 'hand_full'
  | 'delta_budget'
  | 'not_selected';

export interface DealReport {
  /** Every repertoire member the dealer looked at, best score first. */
  readonly candidates: readonly DealCandidateReport[];
  /** Ids actually minted, in hand order. */
  readonly dealt: readonly string[];
  /** Cards asked for, after clamping to what the hand could hold. */
  readonly requested: number;
  /** Authored cards already on the step. */
  readonly authored: number;
}

export interface DealResult {
  readonly nudges: readonly StepNudge[];
  readonly report: DealReport;
}

// ─── The deal report (debug only) ────────────────────────────────────

/**
 * The most recent deal, kept so `window.__DEBUG.getRepertoire()` can answer
 * "why did I get this hand".
 *
 * **Diagnostic state, not a cache**, which is why it sits at module scope
 * despite the standing rule against module-level engine singletons (CLAUDE.md
 * § Load-Bearing Architectural Decisions). Nothing reads it on any gameplay
 * path — no selection, pricing, resolution or dispatch consults it — so a stale
 * entry surviving into a second session can mislead a developer for one call
 * and can never affect a run. It is the same shape, and the same trade, as
 * `resetNudgeWarnings()` next door in `nudges.ts`.
 *
 * The plan deliberately emits no trace for dealing (pure, replayable, and on
 * the render path where a trace would double-fire), so this and the TSV `dealt`
 * column carry the whole of the inspectability requirement (NFP #2).
 */
let _lastDeal: { readonly templateId: string; readonly report: DealReport } | undefined;

/** Record a deal for the debug bridge. No gameplay path reads this. */
export function recordDealReport(templateId: string, report: DealReport): void {
  _lastDeal = { templateId, report };
}

/** The most recent deal, or `undefined` if nothing has been dealt this session. */
export function lastDealReport(): { readonly templateId: string; readonly report: DealReport } | undefined {
  return _lastDeal;
}

/** Drop the recorded deal. Tests and session teardown. */
export function resetDealReport(): void {
  _lastDeal = undefined;
}

/**
 * Mint one library member into an ordinary `StepNudge`.
 *
 * The id is namespaced (`dealt.<memberId>`) so it can never collide with an
 * authored id in the same step, and `libraryCardId` is set so the twilight echo
 * harvest tallies a dealt play exactly as it tallies an authored one.
 *
 * **No `fiction` is surfaced.** Prose Doctrine v2 (THR-1224) retired the flavor
 * quote and no card face draws it; the field is still required on `StepNudge`
 * until the corpus strip (THR-1225), so it is minted empty rather than filled
 * from `CARD_CONTENT.quote` — writing the quote here would re-introduce, on the
 * newest surface in the system, exactly the thing the doctrine just retired.
 */
export function mintDealtNudge(
  member: NudgeCardMember,
  profile: NudgeCardPlayProfile,
): StepNudge {
  const bands = BAND_FRAGMENTS[member.id];
  return {
    id: `${DEALT_NUDGE_ID_PREFIX}${member.id}`,
    libraryCardId: member.id,
    name: cardDisplayTitle(member),
    ...(member.sphere ? { sphere: member.sphere } : {}),
    essenceCost: profile.essenceCost,
    forecastDelta: profile.forecastDelta,
    ...(profile.rider ? { rider: profile.rider } : {}),
    ...(profile.costs ? { costs: profile.costs } : {}),
    ...(profile.grants ? { grants: profile.grants } : {}),
    ...(member.imageTag ? { imageTag: member.imageTag } : {}),
    // Retired by Prose Doctrine v2 — see the doc comment above.
    fiction: '',
    effectLine: effectLineFor(member, profile),
    ...(bands ? { bandProse: { ...bands } } : {}),
  };
}

/**
 * The card's guidance line — words, never a numeral (the nudge law).
 *
 * Falls back to the type's own keyword when a member has no authored effect
 * phrasing, so a profiled member is always legible rather than blank. The
 * per-member phrasing the corpus will carry rides THR-1248; this is the floor
 * that keeps the two reference profiles honest in the meantime.
 */
function effectLineFor(member: NudgeCardMember, profile: NudgeCardPlayProfile): string {
  const type = nudgeCardType(member.typeId);
  const keyword = type?.keyword ?? member.typeId;
  if (profile.forecastDelta > 0) return `${keyword} — leans the odds your way.`;
  if (profile.forecastDelta < 0) return `${keyword} — costs you ground for what it buys.`;
  return `${keyword} — changes what happens, not the odds.`;
}

/** Provenance sources that were *earned* rather than started with. */
const EARNED_SOURCES: ReadonlySet<RepertoireEntry['source']> = new Set([
  'milestone',
  'god_trait',
  'sphere_attunement',
  'hunger',
  'echo',
]);

function sphereTermFor(member: NudgeCardMember, context: DealContext): number {
  if (!member.sphere) return DEAL_SPHERE_COMMON_WEIGHT;
  if (member.sphere === context.primarySphere) return DEAL_SPHERE_PRIMARY_WEIGHT;
  if (member.sphere === context.secondarySphere) return DEAL_SPHERE_SECONDARY_WEIGHT;
  // A signature card of a sphere this god does not hold. It is in the
  // repertoire (so it is legitimately theirs to play) but it argues for
  // nothing about who they are, so it scores below the common pool.
  return 0;
}

function tagTermFor(profile: NudgeCardPlayProfile, context: DealContext): number {
  const declared = context.tags;
  if (!declared || declared.length === 0) return 0;
  const owned = profile.contextTags;
  if (!owned || owned.length === 0) return 0;
  const matches = owned.filter((t) => declared.includes(t)).length;
  return matches * DEAL_TAG_MATCH_WEIGHT;
}

/**
 * Fill a step's hand from the god's repertoire.
 *
 * Pure, total, and zero-PRNG. Given the same repertoire, the same declaration
 * and the same context this returns the same cards in the same order, every
 * time — including after a reload.
 *
 * Selection runs in three passes, and the order is the design:
 *
 * 1. **Eligibility.** A candidate must be in the repertoire, carry a play
 *    profile *and* band fragments, not repeat a type an authored special
 *    already covers (no two cards answering the same question), and not be
 *    excluded by the declaration.
 * 2. **Scoring.** Sphere identity + context-tag match + earned-provenance bonus,
 *    with a deterministic tie-break on member id.
 * 3. **Constrained fill.** Take in score order while the composed hand stays
 *    inside the hand ceiling and under the delta budget. Variety rules (sphere
 *    spread, at least one ungated common card) are applied as *preferences
 *    within* that budget rather than as hard gates, because a hard gate on a
 *    thin repertoire would deal nothing at all — the fail-soft reading of the
 *    plan's "deal what exists".
 */
export function dealHand(
  step: Pick<ActionStep, 'nudges' | 'deal'>,
  repertoire: readonly RepertoireEntry[],
  context: DealContext,
): DealResult {
  const authored = step.nudges ?? [];
  const declaration = step.deal;
  const emptyReport: DealReport = {
    candidates: [],
    dealt: [],
    requested: 0,
    authored: authored.length,
  };
  if (!declaration) return { nudges: [], report: emptyReport };

  // Room left in the hand after what the encounter authored. A step that
  // already authored a full hand gets no fill rather than an oversized one.
  const room = Math.max(0, DEAL_HAND_MAX - authored.length);
  const asked = Math.max(
    0,
    Math.floor(
      Number.isFinite(declaration.count) ? declaration.count : DEAL_DEFAULT_COUNT,
    ),
  );
  const requested = Math.min(asked || DEAL_DEFAULT_COUNT, room);
  if (requested <= 0) {
    return { nudges: [], report: { ...emptyReport, requested: 0 } };
  }

  const authoredTypes = new Set(
    authored
      .map((n) => (n.libraryCardId ? memberTypeOf(n.libraryCardId) : undefined))
      .filter((t): t is string => t !== undefined),
  );
  const excluded = new Set<string>(declaration.exclude ?? []);

  // ── Pass 1 + 2: eligibility and scoring ──────────────────────────
  interface Scored extends DealCandidateReport {
    readonly member: NudgeCardMember;
    readonly profile: NudgeCardPlayProfile;
  }
  const scored: Scored[] = [];
  const rejected: DealCandidateReport[] = [];

  for (const entry of repertoire) {
    const member = entry.member;
    const profile = PLAY_PROFILES[member.id];
    const title = cardDisplayTitle(member);
    const base = { cardId: member.id, title, score: 0, sphereTerm: 0, tagTerm: 0, provenanceTerm: 0 };

    if (!profile) {
      rejected.push({ ...base, eliminated: 'no_profile' });
      continue;
    }
    if (Object.keys(BAND_FRAGMENTS[member.id] ?? {}).length === 0) {
      rejected.push({ ...base, eliminated: 'no_band_fragments' });
      continue;
    }
    if (excluded.has(member.typeId)) {
      rejected.push({ ...base, eliminated: 'type_excluded' });
      continue;
    }
    if (authoredTypes.has(member.typeId)) {
      rejected.push({ ...base, eliminated: 'type_already_authored' });
      continue;
    }

    const sphereTerm = sphereTermFor(member, context);
    const tagTerm = tagTermFor(profile, context);
    const provenanceTerm = EARNED_SOURCES.has(entry.source) ? DEAL_PROVENANCE_BONUS : 0;
    scored.push({
      cardId: member.id,
      title,
      score: sphereTerm + tagTerm + provenanceTerm,
      sphereTerm,
      tagTerm,
      provenanceTerm,
      member,
      profile,
    });
  }

  // Descending score, then ascending id. The id tie-break is what makes this
  // replayable: two equally-scored cards must always resolve the same way.
  scored.sort((a, b) => (b.score - a.score) || a.cardId.localeCompare(b.cardId));

  // ── Pass 3: constrained fill ─────────────────────────────────────
  const authoredDelta = authored.reduce((sum, n) => sum + n.forecastDelta, 0);
  const taken: Scored[] = [];
  const takenIds = new Set<string>();
  const skipped = new Map<string, DealEliminationReason>();
  let delta = authoredDelta;

  const spheresSoFar = new Set(
    authored.map((n) => n.sphere).filter((s): s is SphereName => s !== undefined),
  );
  let commonSoFar = authored.filter((n) => n.sphere === undefined).length;

  const wouldFit = (c: Scored): boolean =>
    delta + c.profile.forecastDelta <= DEAL_HAND_MAX_TOTAL_DELTA + 1e-9;

  const take = (c: Scored): void => {
    taken.push(c);
    takenIds.add(c.cardId);
    delta += c.profile.forecastDelta;
    if (c.member.sphere) spheresSoFar.add(c.member.sphere);
    else commonSoFar++;
  };

  // Variety first, inside the same budget: one ungated common card so an
  // essence-poor god always has something playable, then breadth of spheres.
  // Both are *preferences* — a repertoire that cannot satisfy them still deals.
  if (commonSoFar < DEAL_COMMON_OPTIONS_MIN) {
    const common = scored.find((c) => !c.member.sphere && wouldFit(c));
    if (common) take(common);
  }
  for (const c of scored) {
    if (taken.length >= requested) break;
    if (spheresSoFar.size >= DEAL_SPHERE_COVERAGE_MIN) break;
    if (takenIds.has(c.cardId)) continue;
    if (!c.member.sphere || spheresSoFar.has(c.member.sphere)) continue;
    if (!wouldFit(c)) continue;
    take(c);
  }

  // Then straight score order for whatever room is left.
  for (const c of scored) {
    if (takenIds.has(c.cardId)) continue;
    if (taken.length >= requested) {
      skipped.set(c.cardId, 'hand_full');
      continue;
    }
    if (!wouldFit(c)) {
      skipped.set(c.cardId, 'delta_budget');
      continue;
    }
    take(c);
  }

  const candidates: DealCandidateReport[] = [
    ...scored.map(({ member: _m, profile: _p, ...rest }) => ({
      ...rest,
      ...(takenIds.has(rest.cardId)
        ? {}
        : { eliminated: skipped.get(rest.cardId) ?? ('not_selected' as const) }),
    })),
    ...rejected,
  ];

  return {
    nudges: taken.map((c) => mintDealtNudge(c.member, c.profile)),
    report: {
      candidates,
      dealt: taken.map((c) => `${DEALT_NUDGE_ID_PREFIX}${c.cardId}`),
      requested,
      authored: authored.length,
    },
  };
}

/**
 * Type of a library member id, for the "no two cards answering the same
 * question" rule.
 *
 * Resolved through the library rather than parsed out of the id string: ids are
 * structured today (`card.<type>.<variant>`) but that is a naming convention,
 * not a contract, and parsing it here would quietly make it load-bearing.
 *
 * An id the library does not know contributes no type — the fail-soft reading,
 * so a stale authored `libraryCardId` cannot suppress a whole family from the
 * fill on its way out.
 */
function memberTypeOf(libraryCardId: string): string | undefined {
  return LIBRARY_BY_ID.get(libraryCardId)?.typeId;
}

/**
 * The slice of `GameState` the deal is derived from.
 *
 * Narrow on purpose: the dealer must stay pure and cheaply testable, and a
 * `GameState` parameter would drag the whole world into a module whose entire
 * value is that it is a function of five fields.
 */
export interface DealStateSlice {
  readonly ascendantIdentity?: {
    readonly sphereAlignment?: { readonly primary?: SphereName; readonly secondary?: SphereName };
    readonly hungerId?: string;
  } | null;
  readonly unlockedActionIds?: readonly string[];
  readonly essenceEarnedBySphere?: EssenceEarnedBySphere;
  readonly echoDefinitions?: readonly EchoDefinition[];
}

/**
 * Compose a step's hand **from world state** — the form both the engine and the
 * stage adapter call.
 *
 * ─── Why this exists, and why it is not adapter-only ────────────────
 * Resolution does not receive the hand the player saw. It re-derives its step
 * with `resolveStepDefinition(template, …)`, which returns the *authored*
 * `nudges` and nothing else, and then looks each committed id up in that list —
 * `collectNudgeModifiers`, `selectActiveRider`, `dispatchNudgeCommitments` and
 * `collectNudgeBandProse` all do exactly that, and all of them skip an id they
 * cannot find (a deliberate fail-soft, and the right one for a retired card).
 *
 * So composing in the adapter alone would have shipped a card that renders,
 * prices, and charges — and then contributes no delta, no rider, no cost
 * channel, no grant and no band prose, because resolution never knew it existed.
 * Shown-but-inert is the precise failure the liveness gates in this system exist
 * to catch, and it would have passed every one of them.
 *
 * **Re-deriving is sound because dealing is pure and zero-PRNG.** Same
 * repertoire, same declaration, same context ⇒ the same cards in the same order,
 * on the render path and at resolution and after a reload. That determinism was
 * a stated property of the design with a kill criterion attached; this is the
 * thing it buys.
 */
export function composeDealtStepFromState<T extends Pick<ActionStep, 'nudges' | 'deal'>>(
  step: T,
  state: DealStateSlice | undefined,
): { readonly step: T; readonly report?: DealReport };
export function composeDealtStepFromState<T extends Pick<ActionStep, 'nudges' | 'deal'>>(
  step: T | undefined,
  state: DealStateSlice | undefined,
): { readonly step: T | undefined; readonly report?: DealReport };
// Overloaded so a caller holding a non-optional step keeps one. The runtime
// guard still tolerates `undefined`, because `resolveStepDefinition` is typed
// `ActionStep` while genuinely returning `undefined` for an out-of-range index —
// a pre-existing inaccuracy its own callers guard against, and one this wrapper
// must not convert into a throw on the resolution path (NFP #4).
export function composeDealtStepFromState<T extends Pick<ActionStep, 'nudges' | 'deal'>>(
  step: T | undefined,
  state: DealStateSlice | undefined,
): { readonly step: T | undefined; readonly report?: DealReport } {
  if (!step?.deal) return { step };
  const identity = state?.ascendantIdentity;
  // Absent identity ⇒ absent repertoire ⇒ no dealing, exactly as THR-887's
  // authored-card gate treats a legacy archetype run. A god with no sphere
  // identity has no repertoire to deal *from*; defaulting to "deal anyway"
  // would hand out cards nobody earned.
  if (!identity) return { step };
  const repertoire = buildRepertoire({
    primary: identity.sphereAlignment?.primary,
    secondary: identity.sphereAlignment?.secondary,
    hunger: toHungerId(identity.hungerId),
    unlockedActionIds: new Set(state?.unlockedActionIds ?? []),
    essenceEarnedBySphere: state?.essenceEarnedBySphere,
    echoCards: echoCardsFromDefinitions(state?.echoDefinitions ?? []),
  });
  return composeDealtStep(step, repertoire, {
    primarySphere: identity.sphereAlignment?.primary,
    secondarySphere: identity.sphereAlignment?.secondary,
    tags: step.deal.tags,
  });
}

/**
 * Compose a step's authored hand with its dealt fill.
 *
 * The pure form: hand out a step whose `nudges` is `[...authored, ...dealt]`,
 * which `buildNudgeHand` then partitions exactly as it partitions a
 * fully-authored one. A step with no declaration comes back **identical by
 * reference**, so the no-dealing path allocates nothing and cannot change
 * behavior (NFP #6).
 */
export function composeDealtStep<T extends Pick<ActionStep, 'nudges' | 'deal'>>(
  step: T,
  repertoire: readonly RepertoireEntry[] | undefined,
  context: DealContext,
): { readonly step: T; readonly report?: DealReport } {
  if (!step.deal || !repertoire || repertoire.length === 0) return { step };
  const result = dealHand(step, repertoire, context);
  if (result.nudges.length === 0) return { step, report: result.report };
  return {
    step: { ...step, nudges: [...(step.nudges ?? []), ...result.nudges] },
    report: result.report,
  };
}
