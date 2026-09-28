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
 *   - **Coloration axes** vary the reading without creating identity: sphere/omen
 *     vocabulary, `{cast:*}` continuity, `{intel:*}`, relationship forks — and, here since
 *     THR-1635, the place's culture `foundation` and dominant `sphere`, which choose the
 *     one stated-fact line the reserved `{frag:place_fact}` slot adds to an opening.
 *     Coloration axes never enter surface enumeration or `computeSurfaceKey`.
 *
 * Resolution is a deterministic lookup — no PRNG (NFP #3). Same surface, same words,
 * every run. Every failure path degrades to the `'*'` default or to today's render and
 * never throws (NFP #4).
 */

import type { ContextFragmentSet, UnifiedActionTemplate } from '../types/unifiedAction';
import type { ReachDomain } from '../types/traits';
import type { SphereName } from '../types/index';
import { FOUNDATION_SPHERE_NAMES } from '../types/index';
import {
  COLORATION_CULTURE_FIRST,
  CULTURE_CUSTOMS,
  SPHERE_FACT_MIN_SHARE,
  SPHERE_FACTS,
  type CultureFoundation,
} from '../data/culture-sphere-lines';
import { hashSeed } from './naming/workNames';

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

/**
 * Coloration axes (THR-1635) — vary how a scene reads without making it a different
 * surface. `foundation` is the social contract of the culture that holds the town the
 * scene plays out in; `sphere` is that place's dominant sphere. One encounter at a
 * light-foundation town and the same encounter at a darkness town are the same surface,
 * read differently — so these never feed surface enumeration or `computeSurfaceKey`.
 */
export const COLORATION_FRAGMENT_AXES = ['foundation', 'sphere'] as const;

export type ColorationFragmentAxis = (typeof COLORATION_FRAGMENT_AXES)[number];

/** Every axis a fragment set may declare. */
export type FragmentAxis = SurfaceFragmentAxis | ColorationFragmentAxis;

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
  /** Coloration (THR-1635): the foundation of the culture holding the scene's town. */
  readonly foundation?: string | null;
  /** Coloration (THR-1635): the scene place's dominant sphere. */
  readonly sphere?: string | null;
  /** Coloration (THR-1635): the dominant sphere's share of the place's sphere score, 0–1. */
  readonly sphereShare?: number | null;
  /** Coloration (THR-1635): the town culture's `customVariant` stamp. */
  readonly cultureVariant?: number | null;
}

/** One resolved slot: which fragment won, and whether it fell back to the default. */
export interface FragmentBinding {
  readonly slot: string;
  readonly axis: FragmentAxis;
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

function isSurfaceFragmentAxis(axis: string): axis is SurfaceFragmentAxis {
  return (SURFACE_FRAGMENT_AXES as readonly string[]).includes(axis);
}

function isColorationFragmentAxis(axis: string): axis is ColorationFragmentAxis {
  return (COLORATION_FRAGMENT_AXES as readonly string[]).includes(axis);
}

/** Either family — what `resolveFragment` accepts. Enumeration counts identity axes only. */
function isFragmentAxis(axis: string): axis is FragmentAxis {
  return isSurfaceFragmentAxis(axis) || isColorationFragmentAxis(axis);
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

// ─── Opening coloration (THR-1635) ─────────────────────────────────

/** Reserved slot the coloration compile pass writes into step 0. */
export const COLORATION_FRAGMENT_SLOT = 'place_fact';

/** The compiled token, exactly as it appears in step-0 prose. */
export const COLORATION_TOKEN = `{frag:${COLORATION_FRAGMENT_SLOT}}`;

/**
 * Templates the compile pass skips. The five vertical-slice encounters are held out
 * while Christian's integrated-slice playthrough is open — changing their openings
 * under him would muddy that verdict. Releasing them is this one constant.
 */
// TODO(THR-1220): release the slice once the checkpoint closes
export const COLORATION_EXCLUDED_TEMPLATE_PREFIXES: readonly string[] = ['encounter.slice.'];

/** Why a line was or was not chosen — the `opening_coloration_bound` trace's `reason`. */
export type OpeningColorationReason =
  | 'culture'
  | 'sphere'
  | 'no_place'
  | 'no_culture'
  | 'unknown_foundation'
  | 'culture_cell_unauthored'
  | 'sphere_below_share'
  | 'sphere_cell_unauthored'
  | 'no_reach';

/** What the render path knows about the scene's place, gathered by `gatherNarrativeContext`. */
export interface OpeningColorationInput {
  /** The rendering template's reach. */
  readonly reach?: string | null;
  /** The Location-tier node the scene's culture is read from (a Place walks up to its town). */
  readonly placeLocationId?: string | null;
  /** Location-tier name, for `{place}`. */
  readonly placeName?: string | null;
  readonly foundation?: string | null;
  readonly cultureId?: string | null;
  readonly cultureName?: string | null;
  /** The culture's `customVariant` stamp (or the same ordinal derived for a pre-stamp save). */
  readonly cultureVariant?: number | null;
  readonly demonym?: string | null;
  readonly dominantSphere?: string | null;
  readonly sphereShare?: number | null;
}

/** One resolution of the reserved slot. `text` is filled except for `{actor}`; `''` for none. */
export interface OpeningColoration {
  readonly kind: 'culture' | 'sphere' | 'none';
  readonly reason: OpeningColorationReason;
  readonly text: string;
  /** Table cell address, e.g. `culture.light.stone` — present when a cell was looked up. */
  readonly cell?: string;
  /** Index of the chosen variant within its cell. */
  readonly variant?: number;
  /** The normal fragment binding, so traces and debug reads see the usual shape. */
  readonly binding?: FragmentBinding;
}

const NONE = (reason: OpeningColorationReason, cell?: string): OpeningColoration => ({
  kind: 'none',
  reason,
  text: '',
  ...(cell ? { cell } : {}),
});

function isCultureFoundation(value: string): value is CultureFoundation {
  return (FOUNDATION_SPHERE_NAMES as readonly string[]).includes(value);
}

function fillColorationLine(line: string, input: OpeningColorationInput): string {
  const demonym = input.demonym || input.cultureName || 'local';
  const place = input.placeName || 'the town';
  // `{place}` may open a sentence; a Location name is already capitalised, the fallback is not.
  return line
    .replace(/\{demonym\}/g, demonym)
    .replace(/^\{place\}/, place.charAt(0).toUpperCase() + place.slice(1))
    .replace(/\{place\}/g, place);
}

/** Wrap a picked line in the ordinary fragment machinery (one lookup chain, one fallback rule). */
function bindColoration(
  axis: ColorationFragmentAxis,
  value: string,
  text: string,
  templateId: string,
): FragmentBinding | undefined {
  const set: ContextFragmentSet = {
    slot: COLORATION_FRAGMENT_SLOT,
    axis,
    variants: { [value]: text, [FRAGMENT_DEFAULT_KEY]: text },
  };
  return resolveFragment([set], COLORATION_FRAGMENT_SLOT, { [axis]: value }, templateId) ?? undefined;
}

function resolveCultureLine(
  reach: ReachDomain,
  input: OpeningColorationInput,
  templateId: string,
): OpeningColoration {
  if (!input.placeLocationId) return NONE('no_place');
  if (!input.foundation) return NONE('no_culture');
  if (!isCultureFoundation(input.foundation)) return NONE('unknown_foundation');
  const cell = `culture.${input.foundation}.${reach}`;
  const lines = CULTURE_CUSTOMS[input.foundation][reach];
  if (!lines || lines.length === 0) return NONE('culture_cell_unauthored', cell);
  const variant = Math.abs(Math.trunc(input.cultureVariant ?? 0)) % lines.length;
  const text = fillColorationLine(lines[variant], input);
  return {
    kind: 'culture',
    reason: 'culture',
    text,
    cell,
    variant,
    binding: bindColoration('foundation', input.foundation, text, templateId),
  };
}

function resolveSphereLine(
  reach: ReachDomain,
  input: OpeningColorationInput,
  templateId: string,
): OpeningColoration {
  const sphere = input.dominantSphere;
  if (!sphere || (input.sphereShare ?? 0) < SPHERE_FACT_MIN_SHARE) return NONE('sphere_below_share');
  const cell = `sphere.${sphere}.${reach}`;
  const lines = SPHERE_FACTS[sphere as SphereName]?.[reach];
  if (!lines || lines.length === 0) return NONE('sphere_cell_unauthored', cell);
  // A stable hash of the place id — same place, same line, every run, no PRNG (NFP #3).
  const variant = hashSeed(input.placeLocationId ?? '') % lines.length;
  const text = fillColorationLine(lines[variant], input);
  return {
    kind: 'sphere',
    reason: 'sphere',
    text,
    cell,
    variant,
    binding: bindColoration('sphere', sphere, text, templateId),
  };
}

/**
 * Choose the one stated-fact line an opening adds (THR-1635).
 *
 * 1. The town's culture, when its foundation is one of the four and the
 *    `CULTURE_CUSTOMS[foundation][reach]` cell is authored — variant = the culture's
 *    stamp modulo the cell length, so two same-foundation cultures read different customs.
 * 2. Else the place's dominant sphere, when its share clears `SPHERE_FACT_MIN_SHARE` and
 *    the `SPHERE_FACTS[sphere][reach]` cell is authored — variant by a stable place-id hash.
 * 3. Else nothing, and the paragraph reads exactly as authored.
 *
 * `COLORATION_CULTURE_FIRST` flips 1 and 2. Like {@link resolveSettingVariant}, this is not
 * a second mechanism: the chosen line is bound through {@link resolveFragment}. Pure and
 * total — every missing input is a `'none'` with its reason, never a throw (NFP #4).
 */
export function resolveOpeningColoration(
  input: OpeningColorationInput,
  templateId = 'unknown',
): OpeningColoration {
  const reach = input.reach as ReachDomain | null | undefined;
  if (!reach) return NONE('no_reach');

  const culture = resolveCultureLine(reach, input, templateId);
  const sphere = resolveSphereLine(reach, input, templateId);
  const [first, second] = COLORATION_CULTURE_FIRST ? [culture, sphere] : [sphere, culture];
  if (first.kind !== 'none') return first;
  if (second.kind !== 'none') return second;

  // Neither fired: report the most informative miss. A culture that was present but
  // unusable says more than "no strong sphere"; a sphere that cleared the share but has
  // no authored cell says more than "no culture".
  if (culture.reason === 'unknown_foundation' || culture.reason === 'culture_cell_unauthored') return culture;
  if (sphere.reason === 'sphere_cell_unauthored') return sphere;
  if (culture.reason === 'no_place') return culture;
  return input.dominantSphere ? sphere : culture;
}

/**
 * Why the compile pass leaves a template alone, or `null` when it applies.
 * Shared by {@link compileOpeningColoration} and the corpus guard test, so the guard's
 * exemptions are exactly the compile pass's.
 */
export function colorationSkipReason(
  template: Pick<UnifiedActionTemplate, 'id' | 'reach' | 'steps'>,
): 'excluded_prefix' | 'no_reach' | 'branch_first' | 'no_prose' | null {
  if (COLORATION_EXCLUDED_TEMPLATE_PREFIXES.some(prefix => template.id.startsWith(prefix))) {
    return 'excluded_prefix';
  }
  if (!template.reach) return 'no_reach';
  const firstStep = template.steps?.[0];
  if (!firstStep || !('narrativeTemplate' in firstStep)) return 'branch_first';
  if (!firstStep.narrativeTemplate || firstStep.narrativeTemplate.trim() === '') return 'no_prose';
  return null;
}

/** The opening-envelope token a paragraph may consist of alone (THR-884 prepend). */
const OPENING_ENVELOPE_PARAGRAPH = '{frag:opening}';

/**
 * Put the reserved {@link COLORATION_TOKEN} into step 0 (THR-1635), sibling of
 * `compileOpeningEnvelope`.
 *
 * Placement: the end of the first paragraph of the step's own prose — the situation and
 * complication beat (P2) — skipping a paragraph that is only the envelope's
 * `{frag:opening}` prepend. With no paragraph break, the end of the prose. A template
 * whose author already placed the token keeps it where it is.
 *
 * The token is written flush against the paragraph's last character: the resolver
 * supplies the leading space with the line, so a place with no line renders byte for
 * byte as authored today (NFP #6).
 *
 * Pure, idempotent, and applied once at module load at the catalog assembly points,
 * never per tick (NFP #3). A skipped template (see {@link colorationSkipReason}) is
 * returned as the same object.
 */
export function compileOpeningColoration<T extends UnifiedActionTemplate>(template: T): T {
  if (colorationSkipReason(template) !== null) return template;
  const firstStep = template.steps[0] as { narrativeTemplate?: string };
  const prose = firstStep.narrativeTemplate ?? '';
  if (prose.includes(COLORATION_TOKEN)) return template;

  const paragraphs = prose.split('\n\n');
  let target = paragraphs.findIndex(p => p.trim() !== '' && p.trim() !== OPENING_ENVELOPE_PARAGRAPH);
  if (target < 0) target = paragraphs.length - 1;
  paragraphs[target] = paragraphs[target].replace(/\s*$/, trailing => `${COLORATION_TOKEN}${trailing}`);
  const narrativeTemplate = paragraphs.join('\n\n');

  const steps = template.steps.map((step, index) =>
    index === 0 ? { ...step, narrativeTemplate } : step,
  );
  return { ...template, steps };
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

    // Coloration axes (THR-1635) never count as surfaces. In v1 the shared
    // culture/sphere tables are their only source, so a template authoring its own
    // coloration slot is reported rather than silently counted or ignored.
    if (isColorationFragmentAxis(set.axis)) {
      problems.push(
        `slot "${set.slot}" authors coloration axis "${set.axis}" — coloration lines come from the shared culture/sphere tables only`,
      );
      continue;
    }

    if (!isSurfaceFragmentAxis(set.axis)) {
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
