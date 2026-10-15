/**
 * The blind state for one encounter (THR-1723, plan Decision 2).
 *
 * The state is the entry's player-facing prose and nothing else: no id, no declared
 * `reach`, `sphereAffinity`, `encounterType` or tags, so the judgment cannot anchor on
 * the author's label it is later compared with. Fields start from the prose collector's
 * sweep (`collectAuthoredProse`) and add the step-level text the collector does not
 * reach (narrative templates, purpose lines, afterimages).
 *
 * Pure and deterministic: same template → same state → same content hash.
 */
import type { ActionStep, UnifiedActionTemplate } from '../../src/types/unifiedAction';
import { runnableStepSites } from '../../src/types/unifiedAction';
import { authoredTags, type ContentCatalogEntry } from '../../src/data/contentEntryTags';
import { axisOfContentTag } from '../../src/data/content-tags';
import { ENCOUNTER_STATE_MAX_CHARS } from './constants';

export interface EncounterState {
  readonly encounter: {
    readonly title: string;
    readonly text: Readonly<Record<string, string>>;
  };
}

export interface DeclaredLabels {
  readonly reach: string;
  readonly encounterType: string | null;
  readonly sphereAffinity: string | null;
  readonly familyTags: readonly string[];
}

export interface BuiltEncounterState {
  readonly id: string;
  readonly state: EncounterState;
  readonly contentHash: string;
  readonly truncated: boolean;
  readonly declared: DeclaredLabels;
  /** Total prose characters in the state's text map. */
  readonly chars: number;
}

/** 32-bit FNV-1a, hex. Used for the cache key and the calibration sample order. */
export function fnv1a(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

/** Step fields that carry player-facing prose. Everything else on a step is mechanical. */
const STEP_PROSE_FIELDS: readonly (keyof ActionStep)[] = [
  'narrativeTemplate',
  'purposeLine',
  'successAfterimage',
  'failureAfterimage',
  'successAtCostAfterimage',
  'criticalSuccessAfterimage',
  'criticalFailureAfterimage',
  'nearMissAfterimage',
];

function isProse(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Ordered prose fields for one encounter: the collector's fields first (minus `name`,
 * which becomes the title), then each runnable step's prose in authored order. A step
 * string identical to one already present is skipped, so a shared afterimage is not
 * sent twice.
 */
export function encounterProseFields(
  template: UnifiedActionTemplate,
  collectorFields: Readonly<Record<string, string>> | undefined,
): Array<[string, string]> {
  const out: Array<[string, string]> = [];
  const seen = new Set<string>();
  const push = (key: string, value: unknown) => {
    if (!isProse(value) || seen.has(value)) return;
    seen.add(value);
    out.push([key, value]);
  };

  if (collectorFields) {
    for (const [key, value] of Object.entries(collectorFields)) {
      if (key === 'name') continue;
      push(key, value);
    }
  } else {
    push('description', template.description);
  }

  for (const site of runnableStepSites(template.steps)) {
    const prefix = site.variantKey ? `step${site.index}.${site.variantKey}` : `step${site.index}`;
    for (const field of STEP_PROSE_FIELDS) {
      push(`${prefix}.${String(field)}`, site.step[field]);
    }
  }
  return out;
}

/** Apply the character cap in field order; the overflowing field is cut, later ones dropped. */
export function capFields(
  fields: ReadonlyArray<[string, string]>,
  maxChars: number = ENCOUNTER_STATE_MAX_CHARS,
): { text: Record<string, string>; truncated: boolean; chars: number } {
  const text: Record<string, string> = {};
  let used = 0;
  for (const [key, value] of fields) {
    const room = maxChars - used;
    if (room <= 0) return { text, truncated: true, chars: used };
    if (value.length > room) {
      text[key] = value.slice(0, room);
      return { text, truncated: true, chars: maxChars };
    }
    text[key] = value;
    used += value.length;
  }
  return { text, truncated: false, chars: used };
}

/** The labels the author declared — kept beside the state, never inside it. */
export function declaredLabels(template: UnifiedActionTemplate): DeclaredLabels {
  const familyTags = authoredTags(template as unknown as ContentCatalogEntry)
    .filter(tag => axisOfContentTag(tag) === 'family');
  return {
    reach: String(template.reach),
    encounterType: template.encounterType ?? null,
    sphereAffinity: template.sphereAffinity ?? null,
    familyTags,
  };
}

export function buildEncounterState(
  template: UnifiedActionTemplate,
  collectorFields: Readonly<Record<string, string>> | undefined,
  maxChars: number = ENCOUNTER_STATE_MAX_CHARS,
): BuiltEncounterState {
  const { text, truncated, chars } = capFields(encounterProseFields(template, collectorFields), maxChars);
  const state: EncounterState = { encounter: { title: template.name, text } };
  return {
    id: template.id,
    state,
    contentHash: fnv1a(JSON.stringify(state)),
    truncated,
    declared: declaredLabels(template),
    chars,
  };
}
