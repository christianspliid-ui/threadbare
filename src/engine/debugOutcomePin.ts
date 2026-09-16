/**
 * Outcome-band review pin — THR-1030.
 *
 * The director's ask was "I would like to test all the different aftermaths."
 * There was no lever for it: `?spawn=<templateId>` stages an encounter and
 * `?testavatar` balances the actor, but the outcome is still rolled by fate at
 * resolution, so reaching a `critical_failure` ending meant replaying until the
 * dice gave you one — and on a balanced avatar the tails are the *rare* bands by
 * design, which makes the endings that most need review the hardest to reach.
 *
 * This module pins the resolved outcome of one named template so a reviewer can
 * ask for a band by URL: `?spawn=encounter.slice.unsafe_bridge&outcome=critical_failure`.
 *
 * ─── Why the pin sits at the END of step resolution ─────────────────
 * The alternative — rendering each authored `AftermathVariant` in a preview
 * surface without running the encounter — was rejected in the ticket, and the
 * reason is the failure this lever must catch: *"this authored band is
 * unreachable"*. A preview renders the authored model and would report a band as
 * fine whether or not any resolution can ever produce it. So the pin is applied
 * after the real roll, the real probability floors, resist, and the nudge riders
 * have all run and been traced; it overrides only the final `StepOutcome`, and
 * every downstream consequence (`step.onSuccess`/`onFailure` ops, step effects,
 * prose band, aftermath band, capability growth, KPI) then fires for real off the
 * pinned band. The roll and probability reported in traces stay honest — they are
 * what actually happened, which is why {@link OutcomePinVerdict} reports the
 * requested band separately rather than pretending the dice produced it.
 *
 * ─── The anti-vacuity half ──────────────────────────────────────────
 * A lever that cannot fail is not evidence. Pinning a band the template never
 * authored would silently render the *base* variant while the URL claimed a band,
 * which launders exactly the defect THR-989 and THR-973 exist to find. So every
 * pinned resolution records a {@link OutcomePinVerdict} saying whether the band
 * was authored, whether the action actually landed on the requested band, and —
 * when it did not — why. `unauthored_band` and `outcome_diverged` both warn on the
 * console and are readable from `window.__DEBUG.getOutcomePinVerdict()`.
 *
 * ─── Authorship is measured per PATH, not per template (THR-1509) ────
 * A band is *reached* on exactly one aftermath path: `resolveAftermathVariant`
 * picks the `variants[choiceId]` the choice history names (else `fallback`) and
 * layers `byOutcome[band]` from **that variant only**. A band authored on the
 * other arm of a fork does nothing for the player standing on this one. The
 * first cut of this verdict unioned the band keys across every variant, so on
 * `encounter.slice.swindler_found` — whose two arms authored *disjoint* band
 * sets — pinning `critical_failure` on the law path printed *"Showing the
 * authored critical_failure ending"* while the base ending was on screen. The
 * diagnostic was not merely silent; it reported the opposite of the surface.
 * {@link recordOutcomePinVerdict} therefore takes the choice history and judges
 * against {@link authoredOutcomeBandsOnPath}; the per-template union survives
 * as {@link authoredOutcomeBands} for the corpus gates that ask "does this
 * template author the band anywhere", and the verdict reports both so the
 * message can name what exists elsewhere.
 *
 * ─── Why this is not gated on `import.meta.env.DEV` ─────────────────
 * Deliberate, and it follows the `?forceencounters` (THR-878) and `?spawn=`
 * (THR-883) precedent rather than the `window.__DEBUG` one: the Done-when names
 * the *deployed build*, and `__DEBUG` is stripped from production bundles. The
 * module is inert unless a URL flag calls {@link setOutcomePin} — module state
 * that no caller sets costs one boolean check per resolved step.
 *
 * ─── Fail-soft (NFP #4) ─────────────────────────────────────────────
 * | Failure case                        | Behaviour                          |
 * |-------------------------------------|------------------------------------|
 * | Unknown band string in the URL      | Pin refused, one warn, game proceeds |
 * | Template never resolves             | No verdict recorded; nothing throws  |
 * | Band authored on no variant         | Base ending renders, verdict warns   |
 * | Band authored only on another path  | Base ending renders, verdict warns   |
 * | Requested band ≠ landed band        | Real ending renders, verdict warns   |
 * | Config whose variant lookup throws  | Judged as the `fallback` path        |
 */

import type {
  AftermathVariant,
  StepOutcome,
  UnifiedActionOutcome,
  UnifiedActionTemplate,
} from '../types/unifiedAction';
import { isActionStepBranch, resolveAftermathVariant } from '../types/unifiedAction';
import type { EncounterChoiceMemory } from '../types/encounter';

/**
 * The bands a reviewer may ask for.
 *
 * Deliberately the six-value `StepOutcome` domain, because that is what the pin
 * overrides — NOT the seven-value `UnifiedActionOutcome` that keys `byOutcome`.
 * The two are related by `computeFinalActionOutcome`, not equal, and the gap is
 * real: a pinned `failure` step only reaches a `failure` *action* outcome when the
 * step's `failBehavior` is `fail_action`; otherwise the action aggregates to
 * `success_at_cost`. That divergence is reported rather than hidden — see
 * `outcome_diverged` in {@link OutcomePinVerdict}.
 */
export const REVIEWABLE_OUTCOME_BANDS: readonly StepOutcome[] = [
  'critical_success',
  'success',
  'success_at_cost',
  'near_miss',
  'failure',
  'critical_failure',
];

/**
 * The `variants` key reported for a path that resolved to `fallback` — either
 * because no choice was recorded at `branchOnStep`, or because the config has
 * no `variants` at all (the choice-less shape, e.g. `encounter.slice.unsafe_bridge`).
 */
export const FALLBACK_PATH_KEY = 'fallback';

export interface OutcomePin {
  /** The template whose steps this pin overrides. Other templates resolve normally. */
  readonly templateId: string;
  /** The step outcome forced on every step of that template. */
  readonly band: StepOutcome;
}

/** Why a pinned review did — or did not — show the band the URL asked for. */
export type OutcomePinStatus =
  /** The requested band was authored on the resolved path and the action landed on it. The ending on screen is the band. */
  | 'band_rendered'
  /** The action landed on the requested band, but the path it resolved on authors no `byOutcome[band]` — that path's base ending is on screen. */
  | 'unauthored_band'
  /** The pin held at step level but the action aggregated to a different outcome — see `actualOutcome`. */
  | 'outcome_diverged'
  /** The template has no `aftermathConfig` at all, so there is no authored ending to review. */
  | 'no_aftermath_config';

export interface OutcomePinVerdict {
  readonly templateId: string;
  /** The band the reviewer asked for, in `StepOutcome` terms. */
  readonly requestedBand: StepOutcome;
  /** The outcome the action actually resolved to, in `UnifiedActionOutcome` terms. */
  readonly actualOutcome: UnifiedActionOutcome;
  readonly status: OutcomePinStatus;
  /**
   * The aftermath path the action resolved on: a `variants` key, or
   * {@link FALLBACK_PATH_KEY}. This is the path `authoredBands` was read from.
   */
  readonly variantKey: string;
  /**
   * Every `UnifiedActionOutcome` the **resolved path** authors a band for
   * (THR-1509). Before THR-1509 this was the per-template union, which is now
   * `templateBands`; the verdict is judged against this list, never that one.
   */
  readonly authoredBands: readonly UnifiedActionOutcome[];
  /** Every `UnifiedActionOutcome` any variant of this template authors a band for. */
  readonly templateBands: readonly UnifiedActionOutcome[];
  /** One plain sentence, the same text written to the console. */
  readonly message: string;
}

/** The bands authored on one aftermath path — the variant the player actually lands on. */
export interface PathOutcomeBands {
  /** The `variants` key the path resolved to, or {@link FALLBACK_PATH_KEY}. */
  readonly variantKey: string;
  readonly bands: readonly UnifiedActionOutcome[];
}

let activePin: OutcomePin | null = null;
let lastVerdict: OutcomePinVerdict | null = null;

/** Is `value` a band a reviewer may pin? Narrowing guard for untrusted URL input. */
export function isReviewableOutcomeBand(value: string): value is StepOutcome {
  return (REVIEWABLE_OUTCOME_BANDS as readonly string[]).includes(value);
}

/**
 * Arm the pin. Returns false and warns once on an unknown band rather than
 * throwing — a mistyped URL must never stop the game loading (NFP #4).
 */
export function setOutcomePin(templateId: string, band: string): boolean {
  if (!isReviewableOutcomeBand(band)) {
    console.warn(
      `[?outcome] "${band}" is not a reviewable band. Expected one of: ` +
      `${REVIEWABLE_OUTCOME_BANDS.join(', ')}. Resolving normally.`,
    );
    return false;
  }
  activePin = { templateId, band };
  lastVerdict = null;
  return true;
}

export function clearOutcomePin(): void {
  activePin = null;
  lastVerdict = null;
}

export function getOutcomePin(): OutcomePin | null {
  return activePin;
}

/**
 * The band pinned for this template, or undefined when nothing is pinned for it.
 *
 * Scoped by `templateId` on purpose: a global pin would force every agent's every
 * step across the whole world, which both wrecks the surrounding simulation and
 * makes the reviewed ending unrepresentative of the one a player would reach.
 */
export function outcomePinFor(templateId: string): StepOutcome | undefined {
  return activePin?.templateId === templateId ? activePin.band : undefined;
}

/** The band keys one variant authors. Defensive about `byOutcome` being absent. */
function bandsOf(variant: AftermathVariant | undefined): readonly UnifiedActionOutcome[] {
  return Object.keys(variant?.byOutcome ?? {}) as UnifiedActionOutcome[];
}

/**
 * Every action outcome **any** variant of `template` authors an outcome band for
 * — the per-template union.
 *
 * This is the right question for a corpus gate ("does the slice author `failure`
 * anywhere?", THR-1468) and the wrong one for a verdict about what is on screen:
 * a player is on one path, and {@link authoredOutcomeBandsOnPath} is what the
 * `[?outcome]` line judges against (THR-1509).
 *
 * Defensive about the shape rather than trusting the type: templates in the
 * shipped corpus do carry an `aftermathConfig` with no `variants` map (found by
 * this function's own corpus test), and a reviewer's read-only query is the last
 * place that should throw (NFP #4).
 */
export function authoredOutcomeBands(
  template: UnifiedActionTemplate,
): readonly UnifiedActionOutcome[] {
  const config = template.aftermathConfig;
  if (!config) return [];
  const variants = [
    ...Object.values(config.variants ?? {}),
    config.fallback,
  ].filter(Boolean);
  const bands = new Set<UnifiedActionOutcome>();
  for (const variant of variants) {
    for (const band of bandsOf(variant)) bands.add(band);
  }
  return [...bands];
}

/**
 * The bands authored on the path a choice history resolves to (THR-1509).
 *
 * Uses `resolveAftermathVariant` — the same lookup aftermath assembly and the
 * stage adapter use — passed no outcome, which returns the chosen base variant
 * untouched. Sharing the lookup is the point: a second implementation of
 * "which variant did the choice pick" is the shape that silently drifts, and a
 * verdict computed off a drifted copy would judge a path the player is not on.
 *
 * The `variantKey` is recovered by identity against `config.variants`, so a
 * fork whose `fallback` *is* one of its arms reports that arm's key rather than
 * `'fallback'` — the ending on screen is that arm's, whichever door led to it.
 *
 * Fail-soft (NFP #4): a config whose lookup throws (no `variants` map but a
 * recorded choice — the corpus shape the union function guards against) is
 * judged as the fallback path, which is what the engine would have rendered.
 */
export function authoredOutcomeBandsOnPath(
  template: UnifiedActionTemplate,
  choiceHistory?: readonly EncounterChoiceMemory[],
): PathOutcomeBands {
  const config = template.aftermathConfig;
  if (!config) return { variantKey: FALLBACK_PATH_KEY, bands: [] };
  let base: AftermathVariant | undefined;
  try {
    base = resolveAftermathVariant(config, choiceHistory, undefined);
  } catch {
    base = config.fallback;
  }
  const variantKey = Object.entries(config.variants ?? {})
    .find(([, variant]) => variant === base)?.[0] ?? FALLBACK_PATH_KEY;
  return { variantKey, bands: bandsOf(base) };
}

/**
 * The bands authored on one named path — `variants[variantKey]`, or `fallback`
 * for {@link FALLBACK_PATH_KEY} or an unknown key (the engine's own miss rule).
 *
 * The gate-side twin of {@link authoredOutcomeBandsOnPath}: a corpus sweep walks
 * the authored keys rather than fabricating a choice history per arm.
 */
export function authoredOutcomeBandsOnVariant(
  template: UnifiedActionTemplate,
  variantKey: string,
): readonly UnifiedActionOutcome[] {
  const config = template.aftermathConfig;
  if (!config) return [];
  const variant = variantKey === FALLBACK_PATH_KEY
    ? config.fallback
    : (config.variants?.[variantKey] ?? config.fallback);
  return bandsOf(variant);
}

/**
 * The losing action outcomes a path can actually end on (THR-1509) — the bands
 * a path *owes*, because its base ending is written in the success register and
 * would lie on a loss.
 *
 * Derived from `advanceStep`, not restated: a `critical_failure` step ends the
 * action on `critical_failure` whatever its `failBehavior`, so every rolled path
 * can reach it; a `failure` step ends the action on `failure` only when that
 * step's `failBehavior` is `fail_action`, otherwise the action aggregates to
 * `success_at_cost`. A branch step contributes the arm `variantKey` selects
 * (`variants[key] ?? fallback`, the engine's own miss rule).
 *
 * Assumes rolled steps: a difficulty-0 auto-success step never fails, so a path
 * made only of those reaches neither band — no shipped encounter is shaped that
 * way, and a gate over one would over-ask rather than under-ask (fail-loud).
 */
export function reachableLosingBandsOnPath(
  template: UnifiedActionTemplate,
  variantKey: string,
): readonly UnifiedActionOutcome[] {
  const canFailAction = (template.steps ?? []).some((entry) => {
    const step = isActionStepBranch(entry)
      ? (entry.variants?.[variantKey] ?? entry.fallback)
      : entry;
    return step?.failBehavior === 'fail_action';
  });
  return canFailAction ? ['critical_failure', 'failure'] : ['critical_failure'];
}

/**
 * Record — and announce — what a pinned review actually got.
 *
 * Called at aftermath assembly, once per resolved action, and only while a pin is
 * armed for that template. This is the half that keeps the lever from laundering
 * the defect it exists to find: a band nobody authored *on the path the action
 * resolved on*, or an action that did not land where the URL asked, says so
 * loudly instead of rendering the base ending under the band's name.
 *
 * `choiceHistory` is the resolved action's — the same value aftermath assembly
 * hands `resolveAftermathVariant` — so the verdict judges the variant on screen
 * (THR-1509). Omitting it judges the fallback path, which is only correct for a
 * choice-less template; every engine call site passes it.
 */
export function recordOutcomePinVerdict(
  template: UnifiedActionTemplate,
  actualOutcome: UnifiedActionOutcome,
  choiceHistory?: readonly EncounterChoiceMemory[],
): OutcomePinVerdict | null {
  const pin = activePin;
  if (!pin || pin.templateId !== template.id) return null;

  const path = authoredOutcomeBandsOnPath(template, choiceHistory);
  const templateBands = authoredOutcomeBands(template);
  const status = classifyPinStatus(template, pin.band, actualOutcome, path.bands);
  const verdict: OutcomePinVerdict = {
    templateId: template.id,
    requestedBand: pin.band,
    actualOutcome,
    status,
    variantKey: path.variantKey,
    authoredBands: path.bands,
    templateBands,
    message: describePinStatus(status, pin.band, actualOutcome, path, templateBands),
  };

  lastVerdict = verdict;
  if (status === 'band_rendered') {
    console.info(`[?outcome] ${verdict.message}`);
  } else {
    console.warn(`[?outcome] ${verdict.message}`);
  }
  return verdict;
}

/** The most recent pinned resolution's verdict, for `window.__DEBUG`. */
export function getOutcomePinVerdict(): OutcomePinVerdict | null {
  return lastVerdict;
}

function classifyPinStatus(
  template: UnifiedActionTemplate,
  requestedBand: StepOutcome,
  actualOutcome: UnifiedActionOutcome,
  pathBands: readonly UnifiedActionOutcome[],
): OutcomePinStatus {
  if (!template.aftermathConfig) return 'no_aftermath_config';
  // `near_miss` has no `UnifiedActionOutcome` counterpart at all — it aggregates
  // to `success_at_cost` — so a pinned near_miss can never equal the action
  // outcome and is always a divergence, correctly.
  if ((requestedBand as string) !== actualOutcome) return 'outcome_diverged';
  if (!pathBands.includes(actualOutcome)) return 'unauthored_band';
  return 'band_rendered';
}

function describePinStatus(
  status: OutcomePinStatus,
  requestedBand: StepOutcome,
  actualOutcome: UnifiedActionOutcome,
  path: PathOutcomeBands,
  templateBands: readonly UnifiedActionOutcome[],
): string {
  const list = (bands: readonly UnifiedActionOutcome[]): string =>
    bands.length > 0 ? bands.join(', ') : 'none';
  const onPath = list(path.bands);
  const elsewhere = list(templateBands.filter((band) => !path.bands.includes(band)));
  switch (status) {
    case 'band_rendered':
      return `Showing the authored "${requestedBand}" ending on the "${path.variantKey}" path. ` +
        `Bands authored on this path: ${onPath}.`;
    case 'unauthored_band':
      return `The encounter ended on "${actualOutcome}" as asked, but the "${path.variantKey}" path it ` +
        `resolved on authors no band for it — the ending on screen is that path's base ending, ` +
        `not a "${requestedBand}" one. Bands authored on this path: ${onPath}; ` +
        `elsewhere on this encounter: ${elsewhere}.`;
    case 'outcome_diverged':
      return `Asked for "${requestedBand}" but the encounter ended on "${actualOutcome}" ` +
        `(on the "${path.variantKey}" path). Every step was pinned; the action aggregates its ` +
        `steps, so a step band and an action outcome are not always the same word. ` +
        `Bands authored on this path: ${onPath}.`;
    case 'no_aftermath_config':
      return `This encounter has no authored aftermath at all, so there is no "${requestedBand}" ` +
        `ending to review — whatever is on screen is engine-generated.`;
  }
}
