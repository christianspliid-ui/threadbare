/**
 * Context-fragment resolution — Tier-2 surface generators (THR-573).
 *
 * A template's authored prose multiplies across the same context axes the selection
 * engine already keys surface identity on (`computeSurfaceKey`, THR-475). One authored
 * skeleton plus a handful of fragments becomes ~20 distinct player-facing scenes,
 * without the prose and the surface key ever drifting apart.
 *
 * Two kinds of axes (see `Docs/plans/2026-07-23-encounter-context-multiplication-grammar.md`):
 *   - **Identity axes** (here) create distinct surfaces: `place`, `counterpartRole`.
 *   - **Coloration axes** (elsewhere, already live) vary the reading without creating
 *     identity: sphere/omen vocabulary, `{cast:*}` continuity, `{intel:*}`, relationship forks.
 *
 * Resolution is a deterministic lookup — no PRNG (NFP #3). Same surface, same words,
 * every run. Every failure path degrades to the `'*'` default or to today's render and
 * never throws (NFP #4).
 */

import type { ContextFragmentSet, UnifiedActionTemplate } from '../types/unifiedAction';

// ─── Constants (NFP #1) ────────────────────────────────────────────

/**
 * Identity axes that may carry fragment tables.
 *
 * `setting` (THR-884) is the setting-envelope axis: the `SettingClass` of the
 * location the scene plays out in. It is deliberately the *same* mechanism as the
 * v1 axes rather than a parallel one — per-class openings and per-card fiction are
 * the same "one authored skeleton, several authored variants, one deterministic
 * lookup" shape, and a second resolver would give them a second fallback chain to
 * drift from.
 */
export const SURFACE_FRAGMENT_AXES = ['place', 'counterpartRole', 'setting'] as const;

export type SurfaceFragmentAxis = (typeof SURFACE_FRAGMENT_AXES)[number];

/** Required default key in every variants map — the declared-default invariant. */
export const FRAGMENT_DEFAULT_KEY = '*';

/** Compactness cap: how many slots one template may declare. */
export const MAX_FRAGMENT_SLOTS_PER_TEMPLATE = 4;

/** Authoring cap per slot (cardinality discipline). */
export const MAX_VARIANTS_PER_SLOT = 8;

/** Cap from the parent volume design; enumeration flags templates that exceed it. */
export const MAX_SURFACES_PER_TEMPLATE = 24;

/**
 * Reserved seed offset for a future multi-variant-per-axis-value path.
 * Unused in v1 — named here so the offset is reserved rather than improvised
 * if rotating variants are ever added (they would widen the value type to
 * `string | readonly string[]` without a schema break).
 */
export const FRAGMENT_SEED_OFFSET = 9301;

// ─── Types ─────────────────────────────────────────────────────────

/** The context axis values a rendering action is bound to. Absent → the `'*'` path. */
export interface BoundFragmentAxes {
  /** `sublocationTypeId` of the location the scene plays out in. */
  readonly place?: string | null;
  /** `npcRole` of the social counterpart, null for non-social templates. */
  readonly counterpartRole?: string | null;
  /**
   * `SettingClass` of the location the scene plays out in (THR-884). Null for the
   * ~30 worldgen overlay subtypes outside the authorable set, which take the `'*'`
   * path exactly as an unbound `place` does.
   */
  readonly setting?: string | null;
}

/** One resolved slot: which fragment won, and whether it fell back to the default. */
export interface FragmentBinding {
  readonly slot: string;
  readonly axis: SurfaceFragmentAxis;
  /** The bound axis value, or `'*'` when the default was used. */
  readonly value: string;
  readonly usedDefault: boolean;
  readonly text: string;
}

/** Static surface count for one template, derived from its authored fragment tables. */
export interface SurfaceEnumeration {
  readonly templateId: string;
  /** Non-default authored values per axis. */
  readonly axisValues: Readonly<Record<SurfaceFragmentAxis, readonly string[]>>;
  /** Product of the per-axis factors — the template's authored surface count. */
  readonly surfaceCount: number;
  /** True when `surfaceCount` exceeds {@link MAX_SURFACES_PER_TEMPLATE}. */
  readonly exceedsCap: boolean;
  /** Authoring errors found during enumeration (missing `'*'`, over-cap slots, bad axis). */
  readonly problems: readonly string[];
}

// ─── Warn-once bookkeeping ─────────────────────────────────────────

/**
 * Authoring errors warn once per template id, never once per render — a per-render warn
 * would flood the trace ring buffer during a normal tick (THR trace-volume rule).
 */
const warnedTemplates = new Set<string>();

/** Test seam: clears the warn-once memo. */
export function resetFragmentWarnings(): void {
  warnedTemplates.clear();
}

function warnOnce(key: string, message: string): void {
  if (warnedTemplates.has(key)) return;
  warnedTemplates.add(key);
  if (import.meta.env?.DEV) {
    console.warn(`[fragmentResolution] ${message}`);
  }
}

// ─── Resolution ────────────────────────────────────────────────────

function isFragmentAxis(axis: string): axis is SurfaceFragmentAxis {
  return (SURFACE_FRAGMENT_AXES as readonly string[]).includes(axis);
}

/**
 * Resolve one named slot against the bound context.
 *
 * Lookup chain: bound axis value → that variant; unknown/absent value → the `'*'`
 * default; slot undeclared or default missing → `null` plus one warn per template.
 * Returning `null` (rather than throwing) is what lets the caller strip the token and
 * render the rest of the paragraph — base behavior is never worse than today.
 */
export function resolveFragment(
  fragments: readonly ContextFragmentSet[] | undefined,
  slot: string,
  bound: BoundFragmentAxes,
  templateId = 'unknown',
): FragmentBinding | null {
  if (!fragments || fragments.length === 0) return null;

  const set = fragments.find(f => f.slot === slot);
  if (!set) {
    warnOnce(
      `${templateId}:slot:${slot}`,
      `{frag:${slot}} on "${templateId}" references a slot the template does not declare.`,
    );
    return null;
  }

  if (!isFragmentAxis(set.axis)) {
    warnOnce(
      `${templateId}:axis:${slot}`,
      `slot "${slot}" on "${templateId}" declares unknown axis "${set.axis}".`,
    );
    return null;
  }

  const boundValue = bound[set.axis];
  const direct = boundValue != null && boundValue !== '' ? set.variants[boundValue] : undefined;
  if (direct != null && direct !== '') {
    return { slot, axis: set.axis, value: boundValue as string, usedDefault: false, text: direct };
  }

  const fallback = set.variants[FRAGMENT_DEFAULT_KEY];
  if (fallback == null || fallback === '') {
    warnOnce(
      `${templateId}:default:${slot}`,
      `slot "${slot}" on "${templateId}" is missing the required "${FRAGMENT_DEFAULT_KEY}" default variant.`,
    );
    return null;
  }

  return {
    slot,
    axis: set.axis,
    value: FRAGMENT_DEFAULT_KEY,
    usedDefault: true,
    text: fallback,
  };
}

/**
 * Resolve every slot a template declares. Used for the aggregate
 * `surface_fragments_bound` trace and the debug read — the prose path itself resolves
 * lazily per referenced token via {@link resolveFragment}.
 */
export function resolveTemplateFragments(
  fragments: readonly ContextFragmentSet[] | undefined,
  bound: BoundFragmentAxes,
  templateId = 'unknown',
): readonly FragmentBinding[] {
  if (!fragments || fragments.length === 0) return [];
  const bindings: FragmentBinding[] = [];
  for (const set of fragments) {
    const binding = resolveFragment(fragments, set.slot, bound, templateId);
    if (binding) bindings.push(binding);
  }
  return bindings;
}

// ─── Setting variants (THR-884) ────────────────────────────────────

/** Reserved slot name the converter compiles a template's `openings` table into. */
export const OPENING_FRAGMENT_SLOT = 'opening';

/**
 * Resolve a per-setting-class variant table against the bound setting.
 *
 * This is **not** a second resolution mechanism — it builds the same
 * {@link ContextFragmentSet} shape the `{frag:*}` path uses (with `base` playing the
 * role of the required `'*'` default) and delegates to {@link resolveFragment}. One
 * lookup chain, one fallback rule, one warn-once memo, whether the variant reached
 * the reader through a prose token or through a card field.
 *
 * Used by per-card `fictionBySetting`, where the variant is a whole field rather
 * than a token spliced into a paragraph. Template-level `openings` take the token
 * route instead: the converter compiles them into a real fragment set on the
 * {@link OPENING_FRAGMENT_SLOT} slot, so they cost nothing extra at render time.
 *
 * Returns `base` unchanged whenever the table is absent, empty, or has no entry for
 * the bound class — so a card that authored no variants reads exactly as it does
 * today (NFP #6), and an unbound setting is a fallback rather than a blank (NFP #4).
 */
export function resolveSettingVariant(
  bySetting: Readonly<Record<string, string>> | undefined,
  base: string,
  bound: BoundFragmentAxes,
  templateId = 'unknown',
  slot = 'settingVariant',
): string {
  if (!bySetting) return base;
  const keys = Object.keys(bySetting);
  if (keys.length === 0) return base;

  const set: ContextFragmentSet = {
    slot,
    axis: 'setting',
    variants: { ...bySetting, [FRAGMENT_DEFAULT_KEY]: base },
  };
  const binding = resolveFragment([set], slot, bound, templateId);
  return binding?.text ?? base;
}

// ─── Enumeration ───────────────────────────────────────────────────

/**
 * Statically enumerate a template's authored surfaces (Rule 3).
 *
 * Counting rule: per axis, the union of **non-default** authored values across that
 * axis's slots; the axis contributes `max(1, values.length)`; the surface count is the
 * product. The `'*'` default is deliberately **not** counted as a surface — it is the
 * fallback rendering, i.e. what the template already reads like today, so counting it
 * would inflate the library by one per axis. This is what makes the worked example
 * report 5 places × 4 roles = 20 rather than 6 × 5 = 30.
 *
 * Pure and deterministic: two runs over the same tables produce identical output, which
 * is what lets the volume model report *measured* counts instead of asserted ones.
 */
export function enumerateTemplateSurfaces(
  template: Pick<UnifiedActionTemplate, 'id' | 'contextFragments'>,
): SurfaceEnumeration {
  const problems: string[] = [];
  const perAxis: Record<SurfaceFragmentAxis, Set<string>> = {
    place: new Set<string>(),
    counterpartRole: new Set<string>(),
    setting: new Set<string>(),
  };

  const fragments = template.contextFragments ?? [];

  if (fragments.length > MAX_FRAGMENT_SLOTS_PER_TEMPLATE) {
    problems.push(
      `declares ${fragments.length} slots, exceeding MAX_FRAGMENT_SLOTS_PER_TEMPLATE (${MAX_FRAGMENT_SLOTS_PER_TEMPLATE})`,
    );
  }

  const seenSlots = new Set<string>();
  for (const set of fragments) {
    if (seenSlots.has(set.slot)) {
      problems.push(`duplicate slot "${set.slot}"`);
      continue;
    }
    seenSlots.add(set.slot);

    if (!isFragmentAxis(set.axis)) {
      problems.push(`slot "${set.slot}" declares unknown axis "${set.axis}"`);
      continue;
    }

    const keys = Object.keys(set.variants);
    if (!keys.includes(FRAGMENT_DEFAULT_KEY)) {
      problems.push(`slot "${set.slot}" is missing the required "${FRAGMENT_DEFAULT_KEY}" default`);
    }
    if (keys.length > MAX_VARIANTS_PER_SLOT) {
      problems.push(
        `slot "${set.slot}" has ${keys.length} variants, exceeding MAX_VARIANTS_PER_SLOT (${MAX_VARIANTS_PER_SLOT})`,
      );
    }

    for (const key of keys) {
      if (key === FRAGMENT_DEFAULT_KEY) continue;
      const text = set.variants[key];
      if (text == null || text === '') {
        problems.push(`slot "${set.slot}" has an empty variant for "${key}"`);
        continue;
      }
      perAxis[set.axis].add(key);
    }
  }

  const axisValues = {
    place: [...perAxis.place].sort(),
    counterpartRole: [...perAxis.counterpartRole].sort(),
    setting: [...perAxis.setting].sort(),
  };

  const surfaceCount = SURFACE_FRAGMENT_AXES.reduce(
    (product, axis) => product * Math.max(1, axisValues[axis].length),
    1,
  );

  return {
    templateId: template.id,
    axisValues,
    // A template with no fragments has exactly its one authored surface, not zero.
    surfaceCount: fragments.length === 0 ? 1 : surfaceCount,
    exceedsCap: surfaceCount > MAX_SURFACES_PER_TEMPLATE,
    problems,
  };
}
