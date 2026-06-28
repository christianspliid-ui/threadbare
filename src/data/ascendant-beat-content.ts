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
 * GRAPH-SEEDING NOTE. The shipped resolve path (`resolvePendingBeat`, THR-517) is
 * catalogue-driven: a beat *grants action cards*; the threaded actor / throne /
 * artifact the onboarding promises are produced when the player *fires* those granted
 * cards (`bind_thread_agent`, `bind_thread_location`, `action.imbue`). The plan's
 * richer §4.1 vision — beat resolution itself running `add_node`/`setHomeSeat`
 * aftermath to auto-seed those nodes — is deferred to TODO(THR-520); it is an engine
 * change to the resolve contract, out of this content issue's scope.
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
  {
    beatId: 'beat.spine.the_seat',
    kind: 'spine',
    trigger: { kind: 'turn', minTurn: SPINE_TRIGGER_TURNS[1] },
    grantsActionIds: ['bind_thread_location'],
  },
  // Beat 2 — A Thing Left Behind: the god's first artifact, carrying its will onward.
  {
    beatId: 'beat.spine.thing_left_behind',
    kind: 'spine',
    trigger: { kind: 'turn', minTurn: SPINE_TRIGGER_TURNS[2] },
    grantsActionIds: ['action.imbue'],
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
 * id that ships today (`bind_thread_agent`, `bind_thread_location`, `observe_agent`,
 * `action.imbue`). The plan's richer investment vocabulary (consecrate / bestow /
 * anoint as ascendant cards, and the reach-gated `invest.*` set) is not authored
 * yet — TODO(THR-515) expands the pool + `ASCENDANT_ACTION_BUCKETS` as those cards
 * land. Granting an unknown id would be fail-soft (the `unlock_action` aftermath
 * never reveals a card with no template), but seeding vapor ids is avoided so the
 * unlock catalogue stays a truthful map of what actually unlocks.
 *
 * DRAW vs. ELIGIBILITY. The shipped `drawFromPool(pool, rng)` takes no world state,
 * so per-beat *eligibility* predicates (e.g. "an un-introduced culture exists") and
 * *identity* (reach/sphere) biasing from plan §3.2/§4.2 cannot be applied at draw
 * time yet — that is an engine change to the Director's draw signature, deferred to
 * TODO(THR-516). Until then the world may offer an introduction beat with nothing
 * new to introduce; the beat's own prose/aftermath fail-soft (a follow-up concern).
 */
export const ASCENDANT_BEAT_POOL: readonly BeatDefinition[] = [
  // — Introduction beats (BEAT_KIND_WEIGHTS.introduction): surface a generated
  //   culture or faction; flavor-first, ending on an investment hook. No grant. —
  {
    beatId: 'beat.pool.intro.first_stirring',
    kind: 'introduction',
    trigger: { kind: 'cadence' },
    // A generated culture first crosses into the god's awareness.
  },
  {
    beatId: 'beat.pool.intro.rising_faction',
    kind: 'introduction',
    trigger: { kind: 'cadence' },
    // A faction's ambition grows loud enough to reach the god.
  },
  {
    beatId: 'beat.pool.intro.distant_people',
    kind: 'introduction',
    trigger: { kind: 'cadence' },
    // A far-flung culture's rite calls upward, asking to be known.
  },
  {
    beatId: 'beat.pool.intro.zealous_order',
    kind: 'introduction',
    trigger: { kind: 'cadence' },
    // A religious faction seeks a patron among the powers.
  },
  {
    beatId: 'beat.pool.intro.sundered_court',
    kind: 'introduction',
    trigger: { kind: 'cadence' },
    // A fractured faction begs the god to adjudicate its split.
  },
  {
    beatId: 'beat.pool.intro.old_power',
    kind: 'introduction',
    trigger: { kind: 'cadence' },
    // An ancient culture's buried memory stirs and surfaces.
  },

  // — Investment beats (BEAT_KIND_WEIGHTS.investment): "the world calls" — offer an
  //   initial investment into an actor / location / item. Grants one real card. —
  {
    beatId: 'beat.pool.invest.the_worthy_mortal',
    kind: 'investment',
    trigger: { kind: 'cadence' },
    grantsActionIds: ['bind_thread_agent'],
  },
  {
    beatId: 'beat.pool.invest.a_place_of_power',
    kind: 'investment',
    trigger: { kind: 'cadence' },
    grantsActionIds: ['bind_thread_location'],
  },
  {
    beatId: 'beat.pool.invest.raw_relic',
    kind: 'investment',
    trigger: { kind: 'cadence' },
    grantsActionIds: ['action.imbue'],
  },
  {
    beatId: 'beat.pool.invest.the_restless_soul',
    kind: 'investment',
    trigger: { kind: 'cadence' },
    grantsActionIds: ['observe_agent'],
  },
  {
    beatId: 'beat.pool.invest.the_half_faithful',
    kind: 'investment',
    trigger: { kind: 'cadence' },
    grantsActionIds: ['bind_thread_agent'],
  },
  {
    beatId: 'beat.pool.invest.claim_the_wild',
    kind: 'investment',
    trigger: { kind: 'cadence' },
    grantsActionIds: ['bind_thread_location'],
  },

  // — Selection beats (BEAT_KIND_WEIGHTS.selection): choose 1-of-N within-run. The
  //   picker (UI follow-up) offers the listed cards; resolution unlocks the chosen. —
  {
    beatId: 'beat.pool.select.first_true_gift',
    kind: 'selection',
    trigger: { kind: 'cadence' },
    grantsActionIds: ['bind_thread_agent', 'bind_thread_location', 'action.imbue'],
  },
  {
    beatId: 'beat.pool.select.shape_of_devotion',
    kind: 'selection',
    trigger: { kind: 'cadence' },
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
 * yet — the reach-gated investment cards are not authored (TODO(THR-515)); the
 * bucket value + `requiresReach` field exist for when they land. The expressive
 * `divine.*` verbs the scripted spine grants (THR-504, Beats 3–4) are
 * `unlockable-generic`: every run can earn them via the opening arc; they are not
 * gated on the ascendant's two domains.
 */
export const ASCENDANT_ACTION_BUCKETS: Readonly<Record<string, ActionBucketEntry>> = {
  bind_thread_agent: { bucket: 'generic' },
  bind_thread_location: { bucket: 'generic' },
  observe_agent: { bucket: 'generic' },
  'action.imbue': { bucket: 'unlockable-generic' },
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
