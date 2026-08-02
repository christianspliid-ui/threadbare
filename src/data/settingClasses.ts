/**
 * Setting envelopes — the 8-class location vocabulary encounter authors write against
 * (THR-884, `Docs/plans/2026-07-30-encounter-authoring-frameworks.md` § Decision 2).
 *
 * ═══════════════════════════════════════════════════════════════════
 * CONTENT MANAGER: declare a template's `settings: ['rural', 'wayside']`.
 * Never hand-write the 20-subtype list — that is what produced placeless prose
 * stamped with every subtype, the failure this vocabulary exists to end.
 * ═══════════════════════════════════════════════════════════════════
 *
 * The engine already gates templates per location: `locationSubtypes` on
 * `UnifiedActionTemplate` decides which locations' encounter pools register a
 * template (`encounterCache.ts`). Nothing here changes that filter. This module is
 * purely the authoring vocabulary plus its expansion table — authors declare a
 * *class*, one table expands it to subtypes, and the existing cache filter enforces
 * the result unchanged.
 *
 * Expansion is a pure, deterministic lookup — no PRNG, no world state (NFP #3).
 */

import type { LocationSubtype } from '../types/index';
import type { ContextFragmentSet, UnifiedActionTemplate } from '../types/unifiedAction';
import { FRAGMENT_DEFAULT_KEY, OPENING_FRAGMENT_SLOT } from '../engine/fragmentResolution';

// ─── Vocabulary (NFP #1) ───────────────────────────────────────────

/**
 * The closed setting-class vocabulary. Order is the canonical report order used by
 * the coverage matrix, so it is stable rather than alphabetical.
 */
export const SETTING_CLASSES = [
  'rural',
  'urban',
  'stronghold',
  'sacred',
  'arcane',
  'ruin',
  'wayside',
  'battlefield',
] as const;

export type SettingClass = (typeof SETTING_CLASSES)[number];

/**
 * Class → subtype expansion. The single table the whole framework turns on.
 *
 * **Scope note (load-bearing).** These 20 subtypes are the *encounter-authorable*
 * set — the same list `ALL_LOCATION_SUBTYPES` in `encounter-content.ts` carries, and
 * the set every authored encounter has ever been placed at. `LocationSubtype` itself
 * is far wider (~50 values: sphere-resonant wonders, wilderness interest points,
 * natural anomalies, monster lairs, elder ruins). Those are worldgen overlay kinds
 * that no encounter template targets, so folding them into a class would invent
 * coverage that does not exist — the THR-844 dead-vocabulary failure in a new place.
 * If an encounter is ever authored *at* one of them, add it to a class here and the
 * both-direction test will start counting it.
 */
export const SETTING_CLASS_MAP: Readonly<Record<SettingClass, readonly LocationSubtype[]>> = {
  rural: ['hamlet', 'farmland', 'mining'],
  urban: ['town', 'city', 'capital'],
  stronghold: ['castle', 'fort'],
  sacred: ['shrine', 'temple'],
  arcane: ['tower'],
  ruin: ['ruins', 'ruined_tower', 'ruined_city', 'ruined_village', 'unexplored_poi'],
  wayside: ['camp', 'oasis', 'wilderness'],
  battlefield: ['battleground'],
};

/**
 * Every subtype reachable through the class vocabulary, in class order.
 * Pinned by test against `ALL_LOCATION_SUBTYPES` in both directions.
 */
export const ENCOUNTER_AUTHORABLE_SUBTYPES: readonly LocationSubtype[] =
  SETTING_CLASSES.flatMap(c => SETTING_CLASS_MAP[c]);

/** Reverse index: subtype → the one class that claims it. Built once, at module load. */
const SUBTYPE_TO_CLASS: ReadonlyMap<string, SettingClass> = new Map(
  SETTING_CLASSES.flatMap(c => SETTING_CLASS_MAP[c].map(s => [s as string, c] as const)),
);

// ─── Queries ───────────────────────────────────────────────────────

/** Type guard for an unvalidated string (raw content, script args, debug input). */
export function isSettingClass(value: string): value is SettingClass {
  return (SETTING_CLASSES as readonly string[]).includes(value);
}

/**
 * The class a location subtype belongs to, or `undefined` for the ~30 worldgen
 * overlay subtypes outside the authorable set (see the scope note above).
 * Callers treat `undefined` as "no setting binding" and fall through to base prose.
 */
export function settingClassForSubtype(subtype: string | null | undefined): SettingClass | undefined {
  if (subtype == null || subtype === '') return undefined;
  return SUBTYPE_TO_CLASS.get(subtype);
}

/**
 * Expand a declared envelope to the subtype list the encounter cache filters on.
 *
 * Deduplicated and returned in canonical class order, so two templates declaring the
 * same envelope in different order produce byte-identical `locationSubtypes` (NFP #3).
 * Unknown classes are skipped here and fail loud in the build-time validation test —
 * a template that named a typo'd class registers nowhere rather than everywhere,
 * which is the safe direction (NFP #4).
 */
export function expandSettings(
  settings: readonly string[] | undefined,
): readonly LocationSubtype[] {
  if (!settings || settings.length === 0) return [];
  const out: LocationSubtype[] = [];
  const seen = new Set<string>();
  // Iterate the vocabulary, not the declaration, so ordering is canonical.
  for (const cls of SETTING_CLASSES) {
    if (!settings.includes(cls)) continue;
    for (const subtype of SETTING_CLASS_MAP[cls]) {
      if (seen.has(subtype)) continue;
      seen.add(subtype);
      out.push(subtype);
    }
  }
  return out;
}

/** The classes named in `settings` that are not part of the vocabulary. */
export function unknownSettingClasses(settings: readonly string[] | undefined): readonly string[] {
  if (!settings) return [];
  return settings.filter(s => !isSettingClass(s));
}

/** The envelope-shaped slice of a template the validator reads. */
export interface SettingEnvelopeView {
  readonly id: string;
  readonly settings?: readonly string[];
  readonly openings?: Readonly<Record<string, string>>;
  readonly locationSubtypes?: readonly string[];
}

// ─── Opening compilation (THR-932) ─────────────────────────────────

/**
 * Compile a template's `openings` table into the reserved `opening` fragment set and
 * **prepend** its token to step 0, so the authored scene-setting paragraph actually
 * reaches the reader.
 *
 * **Why this exists.** `openings` used to be compiled only inside the raw-entry
 * converter (`encounter-content.ts` `toUnifiedTemplate`). A *direct-authored*
 * `UnifiedActionTemplate` — every vertical-slice encounter — had its `openings`
 * validated by {@link validateSettingEnvelope} and then read by nothing at render
 * time: a field with no reader. All eight slice encounters shipped their approved
 * opening paragraph and rendered only the close-up step prose (THR-932).
 *
 * **Prepend, not replace.** The converter's original semantics *replaced* step-0 prose
 * with the opening token, which discards the authored step paragraph. The authoring
 * intent (and Christian's approved slice text) is opening ¶ + step ¶ — the approved
 * Bridge screen is exactly `openings.wayside + '\n\n' + BRIDGE_STEP.narrativeTemplate`.
 * Both paths now run through this one function, so there is a single semantic rather
 * than two that drift. Unifying is behavior-neutral for shipped content: no raw
 * `EncounterEntry` in the corpus authors `openings` (verified 2026-08-01), so the
 * replace path had zero shipped users to change.
 *
 * **Unbound fallback.** The `'*'` default is the opening of the first *declared* class
 * in canonical {@link SETTING_CLASSES} order — for the sole-declared case (all five
 * roster picks) that is simply "the class this template declares". A template only
 * registers at its declared classes' subtypes, so in normal play the axis binds to one
 * of them; the unbound case is the `?spawn` debug route, which places at the agent's
 * current location (e.g. a Sacred Grove). Falling back to a declared opening there is
 * what keeps the debug/review route from reproducing this very bug (NFP #4, #5).
 *
 * Pure, deterministic, and applied once at module load — never per tick (NFP #3).
 * Idempotent and byte-identical for a template that authored no openings (NFP #6), so
 * it is safe on a catalog assembled from several spreads.
 */
export function compileOpeningEnvelope<T extends UnifiedActionTemplate>(template: T): T {
  const openings = template.openings;
  if (!openings) return template;

  const authored = Object.entries(openings).filter(([, text]) => text != null && text !== '');
  if (authored.length === 0) return template;

  // Idempotence: a template that already carries a compiled opening slot is returned
  // untouched, so applying this at more than one assembly point cannot double-prepend.
  const existing = template.contextFragments ?? [];
  if (existing.some(set => set.slot === OPENING_FRAGMENT_SLOT)) return template;

  // `steps[0]` is an `ActionStepOrBranch`; only the plain-step arm carries prose, and a
  // branch has no step-0 paragraph to prepend to. Returning unchanged rather than
  // guessing keeps this fail-loud: the corpus guard in `settingClasses.test.ts` asserts
  // every openings-authoring template ends up with the token, so such a template fails
  // the suite instead of silently dropping its opening the way THR-932 did.
  const firstStep = template.steps[0];
  if (!firstStep || !('narrativeTemplate' in firstStep)) return template;

  // Canonical-order fallback, so two templates declaring the same classes in different
  // order compile to byte-identical variants (NFP #3).
  const fallbackClass = SETTING_CLASSES.find(cls => {
    const text = openings[cls];
    return text != null && text !== '';
  });
  const fallbackText = fallbackClass ? openings[fallbackClass] : undefined;

  const openingSet: ContextFragmentSet = {
    slot: OPENING_FRAGMENT_SLOT,
    axis: 'setting',
    variants: {
      ...Object.fromEntries(authored),
      // A missing default is an authoring error the resolver warns on; an authored
      // fallback is always available here because `authored` is non-empty.
      [FRAGMENT_DEFAULT_KEY]: fallbackText ?? '',
    },
  };

  const token = `{frag:${OPENING_FRAGMENT_SLOT}}`;
  const stepProse = firstStep.narrativeTemplate ?? '';
  // Already tokenized (a hand-authored opening reference) → compile the table but leave
  // the author's placement alone.
  const narrativeTemplate = stepProse.includes(token)
    ? stepProse
    : stepProse === ''
      ? token
      : `${token}\n\n${stepProse}`;

  const steps = template.steps.map((step, index) =>
    index === 0 ? { ...step, narrativeTemplate } : step,
  );

  return { ...template, steps, contextFragments: [...existing, openingSet] };
}

/**
 * Every authoring error in one template's setting envelope, as human-readable lines.
 *
 * Extracted as its own function — rather than inlined in the test that sweeps the
 * corpus — because that sweep is **vacuous today**: no template declares `settings`
 * yet (content is paused behind THR-883), so a loop over the corpus would print PASS
 * while checking nothing. A validator with its own falsification cases proves the
 * rule works *now*, and the corpus sweep becomes a live regression guard the moment
 * the first migrated template lands.
 *
 * Four rules, each a way a wide envelope stops being honest:
 *   1. an unknown class — a typo that registers the template nowhere;
 *   2. a declared class with no opening — a real place whose scene was never written;
 *   3. an opening for an undeclared class — prose that can never render;
 *   4. no placement at all — a template invisible to every location pool.
 */
export function validateSettingEnvelope(template: SettingEnvelopeView): readonly string[] {
  const problems: string[] = [];

  const unknown = unknownSettingClasses(template.settings);
  if (unknown.length > 0) {
    problems.push(`declares unknown setting class(es): ${unknown.join(', ')}`);
  }

  if ((template.locationSubtypes?.length ?? 0) === 0) {
    problems.push('registers at no location subtype (declare `settings` or `locationTypes`)');
  }

  const openings = template.openings;
  if (openings && Object.keys(openings).length > 0) {
    const declared = (template.settings ?? []).filter(isSettingClass);
    const missing = declared.filter(cls => {
      const text = openings[cls];
      return text == null || text === '';
    });
    if (missing.length > 0) {
      problems.push(`declares class(es) with no authored opening: ${missing.join(', ')}`);
    }
    const declaredSet = new Set<string>(declared);
    const unreachable = Object.keys(openings).filter(cls => !declaredSet.has(cls));
    if (unreachable.length > 0) {
      problems.push(`authors opening(s) for class(es) the envelope never declares: ${unreachable.join(', ')}`);
    }
  }

  return problems;
}
