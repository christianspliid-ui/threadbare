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
 * | Requested band ≠ landed band        | Real ending renders, verdict warns   |
 */

import type { StepOutcome, UnifiedActionOutcome, UnifiedActionTemplate } from '../types/unifiedAction';

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

export interface OutcomePin {
  /** The template whose steps this pin overrides. Other templates resolve normally. */
  readonly templateId: string;
  /** The step outcome forced on every step of that template. */
  readonly band: StepOutcome;
}

/** Why a pinned review did — or did not — show the band the URL asked for. */
export type OutcomePinStatus =
  /** The requested band was authored and the action landed on it. The ending on screen is the band. */
  | 'band_rendered'
  /** The action landed on the requested band, but no variant authors `byOutcome[band]` — the base ending is on screen. */
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
  /** Every `UnifiedActionOutcome` any variant of this template authors a band for. */
  readonly authoredBands: readonly UnifiedActionOutcome[];
  /** One plain sentence, the same text written to the console. */
  readonly message: string;
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

/**
 * Every action outcome any variant of `template` authors an outcome band for.
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
    for (const band of Object.keys(variant.byOutcome ?? {})) {
      bands.add(band as UnifiedActionOutcome);
    }
  }
  return [...bands];
}

/**
 * Record — and announce — what a pinned review actually got.
 *
 * Called at aftermath assembly, once per resolved action, and only while a pin is
 * armed for that template. This is the half that keeps the lever from laundering
 * the defect it exists to find: a band nobody authored, or an action that did not
 * land where the URL asked, says so loudly instead of rendering the base ending
 * under the band's name.
 */
export function recordOutcomePinVerdict(
  template: UnifiedActionTemplate,
  actualOutcome: UnifiedActionOutcome,
): OutcomePinVerdict | null {
  const pin = activePin;
  if (!pin || pin.templateId !== template.id) return null;

  const authoredBands = authoredOutcomeBands(template);
  const status = classifyPinStatus(template, pin.band, actualOutcome, authoredBands);
  const verdict: OutcomePinVerdict = {
    templateId: template.id,
    requestedBand: pin.band,
    actualOutcome,
    status,
    authoredBands,
    message: describePinStatus(status, pin.band, actualOutcome, authoredBands),
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
  authoredBands: readonly UnifiedActionOutcome[],
): OutcomePinStatus {
  if (!template.aftermathConfig) return 'no_aftermath_config';
  // `near_miss` has no `UnifiedActionOutcome` counterpart at all — it aggregates
  // to `success_at_cost` — so a pinned near_miss can never equal the action
  // outcome and is always a divergence, correctly.
  if ((requestedBand as string) !== actualOutcome) return 'outcome_diverged';
  if (!authoredBands.includes(actualOutcome)) return 'unauthored_band';
  return 'band_rendered';
}

function describePinStatus(
  status: OutcomePinStatus,
  requestedBand: StepOutcome,
  actualOutcome: UnifiedActionOutcome,
  authoredBands: readonly UnifiedActionOutcome[],
): string {
  const authored = authoredBands.length > 0 ? authoredBands.join(', ') : 'none';
  switch (status) {
    case 'band_rendered':
      return `Showing the authored "${requestedBand}" ending. Bands authored on this encounter: ${authored}.`;
    case 'unauthored_band':
      return `The encounter ended on "${actualOutcome}" as asked, but no variant authors that band — ` +
        `the ending on screen is the base ending, not a "${requestedBand}" one. ` +
        `Bands authored on this encounter: ${authored}.`;
    case 'outcome_diverged':
      return `Asked for "${requestedBand}" but the encounter ended on "${actualOutcome}". ` +
        `Every step was pinned; the action aggregates its steps, so a step band and an ` +
        `action outcome are not always the same word. Bands authored: ${authored}.`;
    case 'no_aftermath_config':
      return `This encounter has no authored aftermath at all, so there is no "${requestedBand}" ` +
        `ending to review — whatever is on screen is engine-generated.`;
  }
}
