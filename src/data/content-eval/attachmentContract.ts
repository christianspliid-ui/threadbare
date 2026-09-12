/**
 * The attachment line's contract — THR-1486, slice 2 of THR-1481.
 *
 * The attachment pipeline is the last of the three content lines with **no machine
 * gate**: an author could write a possession with a misspelled tag, a tier outside the
 * rarity range, or a sphere that is not a sphere, and nothing would say so until a
 * query silently matched nothing. `check:attachment` is that gate's first pass, and the
 * closed tag vocabulary is what finally made it writable — before it, "is this tag
 * right?" had no answer to check against.
 *
 * Five blocks, deliberately structural. Prose quality is not here: the encounter line
 * learned that a gate which argues about writing gets argued with, while one that
 * checks whether a key exists gets fixed. Blocks in the order an author meets them:
 *
 *   - `tag_vocabulary` — every authored tag is seated in `CONTENT_TAGS`.
 *   - `required_axes`  — every axis the kind's registry row requires is present.
 *   - `sphere_affinity`— `sphereAffinity`, where authored, names a real sphere.
 *   - `tier_range`     — `tier` is a `RarityTier` (1–4) at runtime, not just in the type.
 *   - `census_tag`     — `censusTag` carries a real scale and no retired `reach`.
 *
 * The ratchet (`contentTagRetrofitPending.ts`) is shared with `contentTags.test.ts`, so
 * the gate and the test cannot disagree about which entries are grandfathered.
 */
import {
  CONTENT_OBJECT_KINDS,
  type ContentObjectKind,
  type ContentObjectKindId,
  type ContentTagAxis,
} from '../content-objects';
import { authoredTags, effectiveTags, entriesOfKind, type ContentCatalogEntry } from '../contentCatalogs';
import { axisOfContentTag, isContentTag } from '../content-tags';
import { SPHERE_NAMES } from '../../types/index';
import { isContentTagRetrofitPending } from './contentTagRetrofitPending';

// ─── Tunable constants (NFP #1) ─────────────────────────────────────

/**
 * The kinds this gate covers — what the attachment pipeline authors. Encounters,
 * actions, undertakings, ambitions, omens and cards have their own gates or are
 * slice 4's; listing the six here rather than gating "everything the registry knows"
 * keeps the gate's scope a decision someone made instead of a side effect.
 */
export const ATTACHMENT_KIND_IDS: readonly ContentObjectKindId[] = [
  'item_template',
  'legendary_template',
  'condition_template',
  'power_template',
  'agreement_template',
  'companion_template',
];

/** Inclusive rarity window every attachment tier must sit in. */
export const ATTACHMENT_TIER_MIN = 1;
export const ATTACHMENT_TIER_MAX = 4;

/** The scales `censusTag` may name. Mirrors `ActionScale`; checked at runtime because catalog literals are data. */
const VALID_SCALES: ReadonlySet<string> = new Set(['cosmic', 'regional', 'local', 'personal']);

const SPHERE_SET: ReadonlySet<string> = new Set(SPHERE_NAMES);

export type AttachmentBlockId =
  | 'tag_vocabulary'
  | 'required_axes'
  | 'sphere_affinity'
  | 'tier_range'
  | 'census_tag';

export interface AttachmentBlock {
  readonly id: AttachmentBlockId;
  readonly passed: boolean;
  /** Empty when passed; one line per offending value otherwise. */
  readonly failures: readonly string[];
}

export interface AttachmentReport {
  readonly entryId: string;
  readonly kindId: ContentObjectKindId;
  readonly blocks: readonly AttachmentBlock[];
  readonly passed: boolean;
  /** True when the entry fails but is grandfathered by the ratchet. */
  readonly ratcheted: boolean;
}

// ─── Blocks ─────────────────────────────────────────────────────────

function readProp(entry: ContentCatalogEntry, field: string): unknown {
  const bag = entry.properties as Record<string, unknown> | undefined;
  const top = entry as unknown as Record<string, unknown>;
  return bag && field in bag ? bag[field] : top[field];
}

function checkTagVocabulary(entry: ContentCatalogEntry): AttachmentBlock {
  const failures = authoredTags(entry)
    .filter(t => !isContentTag(t))
    .map(t => `\`${t}\` is not in the vocabulary — seat it in \`src/data/content-tags.ts\` or use a seated spelling`);
  return { id: 'tag_vocabulary', passed: failures.length === 0, failures };
}

function checkRequiredAxes(kind: ContentObjectKind, entry: ContentCatalogEntry): AttachmentBlock {
  if (kind.requiredAxes.length === 0) {
    return { id: 'required_axes', passed: true, failures: [] };
  }
  const present = new Set<ContentTagAxis>();
  for (const tag of effectiveTags(kind.id, entry)) {
    const axis = axisOfContentTag(tag);
    if (axis) present.add(axis);
  }
  const failures = kind.requiredAxes
    .filter(axis => !present.has(axis))
    .map(axis => `no \`${axis}\` tag — every ${kind.gameWord.toLowerCase()} must carry one`);
  return { id: 'required_axes', passed: failures.length === 0, failures };
}

function checkSphereAffinity(entry: ContentCatalogEntry): AttachmentBlock {
  const value = readProp(entry, 'sphereAffinity');
  if (value === undefined || value === null) {
    return { id: 'sphere_affinity', passed: true, failures: [] };
  }
  const ok = typeof value === 'string' && SPHERE_SET.has(value);
  return {
    id: 'sphere_affinity',
    passed: ok,
    failures: ok ? [] : [`\`sphereAffinity: ${JSON.stringify(value)}\` is not one of the twelve spheres`],
  };
}

function checkTierRange(entry: ContentCatalogEntry): AttachmentBlock {
  const value = readProp(entry, 'tier');
  if (value === undefined || value === null) {
    return { id: 'tier_range', passed: true, failures: [] };
  }
  const ok =
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= ATTACHMENT_TIER_MIN &&
    value <= ATTACHMENT_TIER_MAX;
  return {
    id: 'tier_range',
    passed: ok,
    failures: ok ? [] : [`\`tier: ${JSON.stringify(value)}\` is outside ${ATTACHMENT_TIER_MIN}–${ATTACHMENT_TIER_MAX}`],
  };
}

function checkCensusTag(entry: ContentCatalogEntry): AttachmentBlock {
  const value = readProp(entry, 'censusTag');
  if (value === undefined || value === null) {
    return { id: 'census_tag', passed: true, failures: [] };
  }
  const failures: string[] = [];
  if (typeof value !== 'object') {
    failures.push(`\`censusTag: ${JSON.stringify(value)}\` is not an object`);
  } else {
    const bag = value as Record<string, unknown>;
    if ('reach' in bag) {
      failures.push('`censusTag.reach` retired with THR-1486 — the reach lives on the tag axis now');
    }
    if (bag.scale !== undefined && !VALID_SCALES.has(String(bag.scale))) {
      failures.push(`\`censusTag.scale: ${JSON.stringify(bag.scale)}\` is not a scale`);
    }
  }
  return { id: 'census_tag', passed: failures.length === 0, failures };
}

// ─── Runner ─────────────────────────────────────────────────────────

export function checkAttachmentContract(
  kind: ContentObjectKind,
  entry: ContentCatalogEntry,
): AttachmentReport {
  const blocks: AttachmentBlock[] = [
    checkTagVocabulary(entry),
    checkRequiredAxes(kind, entry),
    checkSphereAffinity(entry),
    checkTierRange(entry),
    checkCensusTag(entry),
  ];
  const passed = blocks.every(b => b.passed);
  return {
    entryId: entry.id,
    kindId: kind.id,
    blocks,
    passed,
    ratcheted: !passed && isContentTagRetrofitPending(entry.id),
  };
}

/** Every entry this gate covers, paired with its kind. Deterministic: registry order, then id. */
export function attachmentCorpus(): ReadonlyArray<{ kind: ContentObjectKind; entry: ContentCatalogEntry }> {
  const out: Array<{ kind: ContentObjectKind; entry: ContentCatalogEntry }> = [];
  for (const kindId of ATTACHMENT_KIND_IDS) {
    const kind = CONTENT_OBJECT_KINDS.find(k => k.id === kindId);
    if (!kind) continue;
    for (const entry of [...entriesOfKind(kindId)].sort((a, b) => a.id.localeCompare(b.id))) {
      out.push({ kind, entry });
    }
  }
  return out;
}

/** The block ids a report failed — the shape a caller prints. */
export function failedBlocks(report: AttachmentReport): readonly AttachmentBlockId[] {
  return report.blocks.filter(b => !b.passed).map(b => b.id);
}
