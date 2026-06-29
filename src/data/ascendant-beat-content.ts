/**
 * Ascendant Beats — content + tunables (THR-500)
 *
 * The cadence constants (NFP #1 — every magic number is a named constant) plus the
 * Director's beat catalogue: the scripted spine and the cadence-gated pool.
 *
 * SPINE SCOPE (THR-504): the scripted onboarding spine is the full five-beat arc
 * (Beats 0–4) — each a turn-gated `spine`/`selection` beat granting the run's first
 * action cards, with authored Threadbare-voice presentation in
 * {@link SPINE_BEAT_PRESENTATION}. The cadence-gated pool library lives below
 * (THR-505). Keeping the catalogue here means "what fires when" is a single, tunable
 * authoring surface.
 *
 * GRAPH-SEEDING NOTE. The resolve path (`resolvePendingBeat`, THR-517) grants action
 * cards; THR-520 added the plan's §4.1 vision on top — a beat carrying a `seedsGraph`
 * tag *also* seeds the promised graph state on resolution, so the opening hands the
 * player a live throne and a threaded artifact without firing the granted card manually.
 * Beat 1 ("The Seat") tags `home_seat`; Beat 2 ("A Thing Left Behind") tags
 * `threaded_artifact`. The seeding logic lives in `src/engine/ascendantBeatSeeding.ts`;
 * Beat 0 deliberately carries no tag — `MeetingEncounter` already threads The First.
 */

import type { BeatDefinition, BeatKind } from '../types/ascendantBeat';
import type { ReachDomain } from '../types/traits';

// ─── Cadence constants (NFP #1) ──────────────────────────────────────────────

/** Cadence between pool beats, in turns. */
export const BEAT_BASE_INTERVAL = 9;
/** Seeded jitter applied to the interval (± this many turns). */
export const BEAT_INTERVAL_JITTER = 2;
/** Hard floor between any two beats, in turns. */
export const BEAT_MIN_GAP = 4;
/** Max simultaneously offered beats (max-one-pending invariant). */
export const BEAT_MAX_PENDING = 1;
/** Earliest turn each spine beat may fire. */
export const SPINE_TRIGGER_TURNS: readonly number[] = [0, 2, 4, 6, 8];
/** Pool-draw mix weights by beat kind. */
export const BEAT_KIND_WEIGHTS: Partial<Record<BeatKind, number>> = {
  introduction: 3,
  investment: 4,
  selection: 1,
  delivery: 2,
};
/**
 * Initial `lastBeatTurn`. Lower than any real turn so the cadence gate never
 * blocks the very first pool beat purely because of init state; the spine carries
 * the opening and updates `lastBeatTurn` on every offer regardless.
 */
export const BEAT_INIT_LAST_BEAT_TURN = 0;

// ─── Identity-bias tuning (THR-516, plan §3.2) ────────────────────────────────

/**
 * The cadence pool draw multiplies a beat's base weight (`BEAT_KIND_WEIGHTS[kind] ×
 * weight`) by the ascendant's affinity for the beat's declared reach/sphere
 * (`BeatDefinition.identity`), so a god draws its identity-aligned beats more often
 * (plan §3.2/§4.2). A beat that declares no `identity` is unbiased (multiplier 1).
 *
 * Reach: multiplier = `BEAT_REACH_BIAS_BASE + BEAT_REACH_BIAS_SLOPE × affinity`, where
 * affinity is `domainAffinities[reach]` (∈ [0..1] in practice). At affinity 0 the beat
 * is neither boosted nor penalised; at affinity 1 it draws ×(base+slope) more.
 * Sphere: a flat bonus when the beat's sphere matches the ascendant's primary/secondary.
 */
/** Floor reach multiplier at zero affinity (no boost, no penalty). */
export const BEAT_REACH_BIAS_BASE = 1;
/** Extra reach multiplier per unit of reach affinity (affinity 1 → ×(base+slope)). */
export const BEAT_REACH_BIAS_SLOPE = 2;
/** Sphere multiplier when the beat's sphere is the ascendant's primary. */
export const BEAT_SPHERE_BIAS_PRIMARY = 1.5;
/** Sphere multiplier when the beat's sphere is the ascendant's secondary. */
export const BEAT_SPHERE_BIAS_SECONDARY = 1.25;
/** Sphere multiplier when the beat's sphere matches neither (or no ascendant). */
export const BEAT_SPHERE_BIAS_NONE = 1;

// ─── The scripted spine (FOUNDATION placeholder — full authoring in follow-ups) ─

/**
 * Ordered spine beats (Beats 0–4 — plan §4.1). The Director offers each in turn once
 * its turn trigger is satisfied, advancing the cursor; the max-one-pending invariant
 * paces the arc at the player's resolution speed, floored by {@link SPINE_TRIGGER_TURNS}.
 * Each beat grants the run's next action card(s); Beat 4 is a `selection` that forks
 * the opening into one of three god-paths. Authored presentation lives in
 * {@link SPINE_BEAT_PRESENTATION}.
 *
 * Every `grantsActionIds` entry is a real, shipping `UnifiedActionTemplate` id (asserted
 * in tests). The threaded actor / throne / artifact the arc narrates are produced when
 * the player fires these granted cards — see the GRAPH-SEEDING NOTE in the module header.
 */
export const ASCENDANT_SPINE: readonly BeatDefinition[] = [
  // Beat 0 — The First: the god's first thread to a single mortal soul.
  {
    beatId: 'beat.spine.opening',
    kind: 'spine',
    trigger: { kind: 'turn', minTurn: SPINE_TRIGGER_TURNS[0] },
    grantsActionIds: ['bind_thread_agent', 'observe_agent'],
  },
  // Beat 1 — The Seat: a place in the world to stand and gather faith into power.
  // Seeds the throne on resolution (THR-520): home seat at The First's settlement.
  {
    beatId: 'beat.spine.the_seat',
    kind: 'spine',
    trigger: { kind: 'turn', minTurn: SPINE_TRIGGER_TURNS[1] },
    grantsActionIds: ['bind_thread_location'],
    seedsGraph: { kind: 'home_seat' },
  },
  // Beat 2 — A Thing Left Behind: the god's first artifact, carrying its will onward.
  // Seeds a sphere-flavored artifact on resolution (THR-520): threaded + borne by The First.
  {
    beatId: 'beat.spine.thing_left_behind',
    kind: 'spine',
    trigger: { kind: 'turn', minTurn: SPINE_TRIGGER_TURNS[2] },
    grantsActionIds: ['action.imbue'],
    seedsGraph: { kind: 'threaded_artifact' },
  },
  // Beat 3 — The First Word: the god's first expressive verb, spoken into a mortal mind.
  {
    beatId: 'beat.spine.the_first_word',
    kind: 'spine',
    trigger: { kind: 'turn', minTurn: SPINE_TRIGGER_TURNS[3] },
    grantsActionIds: ['divine.persuade'],
  },
  // Beat 4 — A Path Opens: choose one of three god-paths (dreamer / prophet / patron).
  {
    beatId: 'beat.spine.a_path_opens',
    kind: 'selection',
    trigger: { kind: 'turn', minTurn: SPINE_TRIGGER_TURNS[4] },
    grantsActionIds: ['divine.dream', 'divine.omen', 'divine.inspire'],
  },
];

// ─── Scripted-spine presentation (plan §4.1, §5.1 — authored Threadbare prose) ──

/** Authored per-beat copy for the scripted spine, surfaced in `AscendantBeatModal`. */
export interface SpineBeatPresentation {
  /** Small uppercase kicker above the title. */
  readonly eyebrow: string;
  /** The beat's display title (overrides the humanized beat id). */
  readonly title: string;
  /** Long-form welcome body — Threadbare voice, player-as-god, read + TTS. */
  readonly prose: string;
  /** Primary-button label for non-selection beats (selection beats use card buttons). */
  readonly cta: string;
}

/**
 * The scripted onboarding spine's authored presentation, keyed by `beatId`. The modal
 * prefers this over the generic kind-derived placeholder copy so the opening reads as a
 * bespoke, voiced arc rather than five identical "the weave is yours to touch" cards.
 *
 * Voice: second-person, player-as-god, indirect intervention (you lean, you press, you
 * speak a pressure — never command). The spine is deterministic and identical every run,
 * so the prose carries no `enrichProse` placeholders; per-run generated names enter via
 * the pool beats (TODO(THR-514)), not the scripted spine.
 */
export const SPINE_BEAT_PRESENTATION: Readonly<Record<string, SpineBeatPresentation>> = {
  'beat.spine.opening': {
    eyebrow: 'The First Thread',
    title: 'The First',
    prose:
      'Of all the souls below, one burns at a pitch only you can hear. You do not seize it — you lean close, and a single thread spins out between your attention and the mortal world. Watch this one. Whatever kind of god you become, it will be answered first in them.',
    cta: 'Reach Down',
  },
  'beat.spine.the_seat': {
    eyebrow: 'A Place to Stand',
    title: 'The Seat',
    prose:
      'A god adrift is only weather. But the world has left a hollow shaped to your absence — these stones, this height, this hush between walls. Bind a place to yourself and call it your seat, and the faith that gathers there will rise back to you as power, tide after patient tide.',
    cta: 'Take the Seat',
  },
  'beat.spine.thing_left_behind': {
    eyebrow: 'An Object of Power',
    title: 'A Thing Left Behind',
    prose:
      'Mortals outlast themselves through the things they make. Press a sliver of your nature into some humble object and it wakes — carrying your will into hands you will never touch, into years you will not stay to watch. Whoever bears it bears a little of you, knowing or not.',
    cta: 'Leave Your Mark',
  },
  'beat.spine.the_first_word': {
    eyebrow: 'The First Word',
    title: 'The First Word',
    prose:
      'Until now you have only watched. But a god is known by what it asks of the world. Choose your first word and let it fall into a mortal mind — not a command, but a pressure, a leaning, a dream they will mistake for their own. This is how gods are made: one whisper at a time.',
    cta: 'Speak',
  },
  'beat.spine.a_path_opens': {
    eyebrow: 'A Path Opens',
    title: 'A Path Opens',
    prose:
      'Three shapes of devotion lie before you, and the world is still soft enough to take any of them. The dreamer reads the deep water of sleeping minds; the prophet writes warnings across the waking sky; the patron lifts the worthy higher than they could ever climb alone. Choose what kind of god you will be — for now.',
    cta: 'Choose',
  },
};

/** True for any beat belonging to the scripted onboarding spine (modal: present modally, non-dismissable). */
export function isSpineBeatId(beatId: string): boolean {
  return beatId.startsWith('beat.spine.');
}

// ─── The pool (starter library — THR-505) ────────────────────────────────────

/**
 * Cadence-gated pool beats: the "living world calls on the god" library the
 * Director draws from once the scripted spine is exhausted (plan §4.2).
 *
 * SCOPE NOTE (THR-505). These are the lightweight *scheduling* descriptors the
 * Director consumes — `kind` + `weight` drive the draw mix (`drawFromPool` weights
 * by `BEAT_KIND_WEIGHTS[kind] × weight`); `grantsActionIds` is catalogue metadata
 * recorded against the beat. The rich, player-facing content each beat resolves
 * into — Threadbare-voice prose, choice cards, aftermath effects, `enrichProse`
 * placeholders for the generated culture/faction/actor/artifact a beat surfaces —
 * lives on a matching `UnifiedActionTemplate` whose authoring + the
 * offer→enter→resolve UI path are a follow-up (TODO(THR-514)). `templateId` is left
 * unset here on purpose (the type marks it optional) so the pool never forward-
 * references a template that does not exist yet; the resolution issue sets it
 * (convention: `templateId === beatId`).
 *
 * GRANT GROUNDING. Every id in `grantsActionIds` is a *real* `UnifiedActionTemplate`
 * id that ships today: the early basics (`bind_thread_agent`, `bind_thread_location`,
 * `observe_agent`, `action.imbue`) plus the §4.4 per-graph expression verbs that have
 * since landed — `action.consecrate` (THR-511, location), `action.bestow` (THR-512,
 * agent), `action.anoint` (THR-513, faction). THR-515 added the three deeper-expression
 * investment beats that grant them. The remaining reach-gated `invest.*` set is still
 * unauthored (no templates exist), so it is NOT granted here — TODO(THR-523) expands the
 * pool + `ASCENDANT_ACTION_BUCKETS` with `reach-gated` entries once those cards ship.
 * Granting an unknown id would be fail-soft (the `unlock_action` aftermath never reveals
 * a card with no template), but seeding vapor ids is avoided so the unlock catalogue
 * stays a truthful map of what actually unlocks.
 *
 * DRAW vs. ELIGIBILITY. As of THR-516 the Director filters this pool by each beat's
 * `eligibility` predicate against world state before drawing, and `drawFromPool` scales
 * each beat's weight by the ascendant's `identity` (reach/sphere) affinity — so an
 * introduction beat is never offered with no un-introduced group to surface, and a god
 * draws its identity-aligned beats more often (plan §3.2/§4.2). Introduction beats carry
 * `{ eligibility: unintroduced_group }`; investment beats carry `{ unthreaded_target }`.
 * Per-beat `identity` reach/sphere tags remain unauthored (a separate content decision);
 * the draw honours them the moment they are set, and falls back to unbiased until then.
 *
 * TEMPLATE-BACKED (THR-514). Each pool beat now sets `templateId === beatId`, naming the
 * matching content template in `ASCENDANT_POOL_BEAT_TEMPLATES`
 * (`ascendant-pool-beat-templates.ts`). `resolvePendingBeat`'s template resolver uses it
 * for the missing-template fail-soft, and `AscendantBeatModal` renders the template's
 * `enrichProse`-laden prose so each beat reads bespoke per run. The unlock itself is still
 * carried by `grantsActionIds` below (the THR-517 resolve contract grants from the
 * descriptor, not template aftermath).
 */
export const ASCENDANT_BEAT_POOL: readonly BeatDefinition[] = [
  // — Introduction beats (BEAT_KIND_WEIGHTS.introduction): surface a generated
  //   culture or faction; flavor-first, ending on an investment hook. No grant. —
  {
    beatId: 'beat.pool.intro.first_stirring',
    kind: 'introduction',
    trigger: { kind: 'cadence' },
    eligibility: { kind: 'unintroduced_group' },
    templateId: 'beat.pool.intro.first_stirring',
    // A generated culture first crosses into the god's awareness.
  },
  {
    beatId: 'beat.pool.intro.rising_faction',
    kind: 'introduction',
    trigger: { kind: 'cadence' },
    eligibility: { kind: 'unintroduced_group' },
    templateId: 'beat.pool.intro.rising_faction',
    // A faction's ambition grows loud enough to reach the god.
  },
  {
    beatId: 'beat.pool.intro.distant_people',
    kind: 'introduction',
    trigger: { kind: 'cadence' },
    eligibility: { kind: 'unintroduced_group' },
    templateId: 'beat.pool.intro.distant_people',
    // A far-flung culture's rite calls upward, asking to be known.
  },
  {
    beatId: 'beat.pool.intro.zealous_order',
    kind: 'introduction',
    trigger: { kind: 'cadence' },
    eligibility: { kind: 'unintroduced_group' },
    templateId: 'beat.pool.intro.zealous_order',
    // A religious faction seeks a patron among the powers.
  },
  {
    beatId: 'beat.pool.intro.sundered_court',
    kind: 'introduction',
    trigger: { kind: 'cadence' },
    eligibility: { kind: 'unintroduced_group' },
    templateId: 'beat.pool.intro.sundered_court',
    // A fractured faction begs the god to adjudicate its split.
  },
  {
    beatId: 'beat.pool.intro.old_power',
    kind: 'introduction',
    trigger: { kind: 'cadence' },
    eligibility: { kind: 'unintroduced_group' },
    templateId: 'beat.pool.intro.old_power',
    // An ancient culture's buried memory stirs and surfaces.
  },

  // — Investment beats (BEAT_KIND_WEIGHTS.investment): "the world calls" — offer an
  //   initial investment into an actor / location / item. Grants one real card. —
  {
    beatId: 'beat.pool.invest.the_worthy_mortal',
    kind: 'investment',
    trigger: { kind: 'cadence' },
    eligibility: { kind: 'unthreaded_target' },
    templateId: 'beat.pool.invest.the_worthy_mortal',
    grantsActionIds: ['bind_thread_agent'],
  },
  {
    beatId: 'beat.pool.invest.a_place_of_power',
    kind: 'investment',
    trigger: { kind: 'cadence' },
    eligibility: { kind: 'unthreaded_target' },
    templateId: 'beat.pool.invest.a_place_of_power',
    grantsActionIds: ['bind_thread_location'],
  },
  {
    beatId: 'beat.pool.invest.raw_relic',
    kind: 'investment',
    trigger: { kind: 'cadence' },
    eligibility: { kind: 'unthreaded_target' },
    templateId: 'beat.pool.invest.raw_relic',
    grantsActionIds: ['action.imbue'],
  },
  {
    beatId: 'beat.pool.invest.the_restless_soul',
    kind: 'investment',
    trigger: { kind: 'cadence' },
    eligibility: { kind: 'unthreaded_target' },
    templateId: 'beat.pool.invest.the_restless_soul',
    grantsActionIds: ['observe_agent'],
  },
  {
    beatId: 'beat.pool.invest.the_half_faithful',
    kind: 'investment',
    trigger: { kind: 'cadence' },
    eligibility: { kind: 'unthreaded_target' },
    templateId: 'beat.pool.invest.the_half_faithful',
    grantsActionIds: ['bind_thread_agent'],
  },
  {
    beatId: 'beat.pool.invest.claim_the_wild',
    kind: 'investment',
    trigger: { kind: 'cadence' },
    eligibility: { kind: 'unthreaded_target' },
    templateId: 'beat.pool.invest.claim_the_wild',
    grantsActionIds: ['bind_thread_location'],
  },

  // — Deeper-expression investment beats (THR-515): grant the §4.4 per-graph
  //   expression verbs that landed after the starter pool (consecrate/bestow/anoint).
  //   These mirror `raw_relic`'s treatment of `action.imbue` — each of the four
  //   per-graph verbs gets its own investment beat. `unlockable-generic` bucket; the
  //   card's own target filters (subtype / awareness / faction) gate when it surfaces. —
  {
    beatId: 'beat.pool.invest.the_hallowed_place',
    kind: 'investment',
    trigger: { kind: 'cadence' },
    eligibility: { kind: 'unthreaded_target' },
    templateId: 'beat.pool.invest.the_hallowed_place',
    // Learning to hallow ground teaches both ways to sustain it: the steady
    // devotion (`action.consecrate`) and the enshrined relic (`action.consecrate-relic`, THR-518).
    grantsActionIds: ['action.consecrate', 'action.consecrate-relic'],
  },
  {
    beatId: 'beat.pool.invest.the_favored_soul',
    kind: 'investment',
    trigger: { kind: 'cadence' },
    eligibility: { kind: 'unthreaded_target' },
    templateId: 'beat.pool.invest.the_favored_soul',
    grantsActionIds: ['action.bestow'],
  },
  {
    beatId: 'beat.pool.invest.the_chosen_banner',
    kind: 'investment',
    trigger: { kind: 'cadence' },
    eligibility: { kind: 'unthreaded_target' },
    templateId: 'beat.pool.invest.the_chosen_banner',
    grantsActionIds: ['action.anoint'],
  },

  // — Selection beats (BEAT_KIND_WEIGHTS.selection): choose 1-of-N within-run. The
  //   picker offers the listed cards; resolution unlocks the chosen one. —
  {
    beatId: 'beat.pool.select.first_true_gift',
    kind: 'selection',
    trigger: { kind: 'cadence' },
    templateId: 'beat.pool.select.first_true_gift',
    grantsActionIds: ['bind_thread_agent', 'bind_thread_location', 'action.imbue'],
  },
  {
    beatId: 'beat.pool.select.shape_of_devotion',
    kind: 'selection',
    trigger: { kind: 'cadence' },
    templateId: 'beat.pool.select.shape_of_devotion',
    grantsActionIds: ['action.imbue', 'observe_agent'],
  },
];

// ─── Unlock catalogue (plan §4.3) ─────────────────────────────────────────────

/**
 * Bucket classification for a granted action card. The authoring source of truth
 * for *what kind of gate* a card sits behind (plan §3.5):
 *  - `generic`            — the early basics; gate is the within-run unlock only.
 *  - `unlockable-generic` — richer cards earned later in the run; unlock gate only.
 *  - `reach-gated`        — unlock gate **and** the ascendant's two-domain reach gate
 *                           (`requiresReach`); permanently hidden for runs whose two
 *                           domains exclude that reach (two-domain lock, plan §3.10).
 */
export type ActionBucket = 'generic' | 'unlockable-generic' | 'reach-gated';

export interface ActionBucketEntry {
  readonly bucket: ActionBucket;
  /** Required reach for `reach-gated` cards; unset otherwise. */
  readonly requiresReach?: ReachDomain;
}

/**
 * `actionId → bucket` for every action a beat can grant (spine + pool). This is the
 * single authoring surface for "what unlocks where"; `beatId → grantedActionIds`
 * is carried directly on each `BeatDefinition.grantsActionIds` (derive it via
 * {@link collectGrantedActionIds} rather than maintaining a second, drift-prone map).
 *
 * Only real, shipping `UnifiedActionTemplate` ids appear. No `reach-gated` entries
 * yet — the reach-gated investment cards are not authored (TODO(THR-523)); the
 * bucket value + `requiresReach` field exist for when they land. The expressive
 * `divine.*` verbs the scripted spine grants (THR-504, Beats 3–4) are
 * `unlockable-generic`: every run can earn them via the opening arc; they are not
 * gated on the ascendant's two domains. The §4.4 per-graph expression verbs
 * (`action.imbue` / `consecrate` / `bestow` / `anoint`, THR-508/511/512/513, granted
 * by their investment beats) are likewise `unlockable-generic` — universal verbs whose
 * power is flavored by the ascendant's domain/sphere, not gated on the two-domain lock.
 */
export const ASCENDANT_ACTION_BUCKETS: Readonly<Record<string, ActionBucketEntry>> = {
  bind_thread_agent: { bucket: 'generic' },
  bind_thread_location: { bucket: 'generic' },
  observe_agent: { bucket: 'generic' },
  'action.imbue': { bucket: 'unlockable-generic' },
  // Per-graph expression verbs (THR-511/512/513, granted by the deeper-expression
  // investment beats — THR-515): location / agent / faction analogues of imbue.
  'action.consecrate': { bucket: 'unlockable-generic' },
  // THR-518: the relic variant of consecrate — same bucket, granted by the same beat.
  'action.consecrate-relic': { bucket: 'unlockable-generic' },
  'action.bestow': { bucket: 'unlockable-generic' },
  'action.anoint': { bucket: 'unlockable-generic' },
  // Spine-granted expressive verbs (THR-504): The First Word + the three god-paths.
  'divine.persuade': { bucket: 'unlockable-generic' },
  'divine.dream': { bucket: 'unlockable-generic' },
  'divine.omen': { bucket: 'unlockable-generic' },
  'divine.inspire': { bucket: 'unlockable-generic' },
};

/**
 * Collect the de-duplicated set of action ids any beat (spine or pool) can grant.
 * The `beatId → grantedActionIds` half of the unlock catalogue, derived from the
 * `grantsActionIds` already declared on each `BeatDefinition` so the two halves
 * can never drift. Every id returned here must have an {@link ASCENDANT_ACTION_BUCKETS}
 * entry and resolve to a real `UnifiedActionTemplate` (asserted in tests).
 */
export function collectGrantedActionIds(): readonly string[] {
  const ids = new Set<string>();
  for (const beat of [...ASCENDANT_SPINE, ...ASCENDANT_BEAT_POOL]) {
    for (const id of beat.grantsActionIds ?? []) ids.add(id);
  }
  return [...ids];
}
