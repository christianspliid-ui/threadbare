/**
 * The content catalogs, materialised (THR-1485, slice 1 of THR-1481).
 *
 * `content-objects.ts` *names* each kind's catalogs as `{ module, export }` strings —
 * grep-able, renderable, and readable by a doc generator without importing anything.
 * This file is the other half: the static imports that turn those names into entries,
 * so the contract test and the generator can count, census and query them.
 *
 * **Two lists, one truth.** The registry's refs and this file's keys are pinned against
 * each other in both directions by `contentObjects.test.ts` — a catalog named in the
 * registry with no loader entry fails by name, and so does a loader entry no registry
 * row claims. The duplication is deliberate: static imports cannot be built from
 * strings under esbuild's bundler, and a dynamic `import()` would make the registry
 * unreadable to the generator without booting the whole data layer.
 *
 * Entries are typed as `ContentCatalogEntry` — the intersection every catalog actually
 * shares, which is an `id` and nothing else. Anything narrower would be a lie: an item
 * is a `GraphNode`, an encounter a `UnifiedActionTemplate`, a card a `NudgeCardMember`.
 * Slice 2's tag vocabulary is what gives them a second shared field.
 */
import { UNIFIED_ACTION_TEMPLATES, LOCATION_BRANCHING_ENCOUNTER_TEMPLATES, THREAD_CREATION_TEMPLATES, THREAD_MANAGEMENT_TEMPLATES, AGENT_INTERVENTION_TEMPLATES } from './unified-action-templates';
import { MERCHANT_STRATEGIC_TEMPLATES } from './strategic-packs/merchantStrategicPack';
import { BUILDER_STRATEGIC_TEMPLATES } from './strategic-packs/builderStrategicPack';
import { SCHOLAR_STRATEGIC_TEMPLATES } from './strategic-packs/scholarStrategicPack';
import { ZEALOT_STRATEGIC_TEMPLATES } from './strategic-packs/zealotStrategicPack';
import { COURT_STRATEGIC_TEMPLATES } from './strategic-packs/courtStrategicPack';
import { WARLORD_STRATEGIC_TEMPLATES } from './strategic-packs/warlordStrategicPack';
import { WANDERER_STRATEGIC_TEMPLATES } from './strategic-packs/wandererStrategicPack';
import { FACTORY_STRATEGIC_TEMPLATES } from './strategic-packs/factory/index';
import { UNDERTAKING_CELL_TEMPLATES } from './undertaking-cells';
import { REWARD_POSSESSIONS, REWARD_CONDITIONS, REWARD_BESTOWED_POWERS, TREASURE_MAPS } from './reward-attachment-catalog';
import { ANOMALY_SIGNATURE_ARTIFACTS, ANOMALY_BESTOWED_POWERS, ANOMALY_CONDITIONS } from './anomaly-reward-catalog';
import { STARTER_POSSESSIONS, STARTER_CONDITIONS } from './starter-attachments';
import { ARTIFACT_TEMPLATES } from './artifact-templates';
import { COMPANION_TEMPLATES } from './companion-templates';
import { AGREEMENT_REWARD_TEMPLATES } from './agreement-reward-catalog';
import { AMBITION_TEMPLATES, GRIEVANCE_AMBITION_TEMPLATES, EVENT_MINTED_AMBITION_TEMPLATES } from './ambition-templates';
import { OMEN_TEMPLATES } from './omenTemplates';
import { NUDGE_CARD_LIBRARY } from './nudge-card-library';
import { SPELL_TEMPLATES } from './spell-templates';

import { CONTENT_OBJECT_KINDS, type ContentCatalogRef, type ContentObjectKindId } from './content-objects';

/**
 * The fields every catalog entry shares. `id` is the only one guaranteed; `tags` and
 * `properties.tags` are the two shapes the corpus actually writes tags in — a template
 * type carries them at the top level, a `GraphNode` literal carries them in its property
 * bag — and both are optional because three kinds carry none at all (slice 2, THR-1486).
 *
 * Read them through {@link authoredTags}, never directly: an entry may legally use
 * either shape and a caller that picks one silently halves the corpus.
 */
export interface ContentCatalogEntry {
  readonly id: string;
  /** Template-shaped entries (`ArtifactTemplate`, `CompanionTemplate`, …). */
  readonly tags?: readonly string[];
  /** `GraphNode`-shaped entries (items, conditions, powers). */
  readonly properties?: {
    readonly tags?: readonly string[];
    readonly [key: string]: unknown;
  };
}

/** `module#export`, the key shape both halves agree on. */
export function catalogKey(ref: ContentCatalogRef): string {
  return `${ref.module}#${ref.export}`;
}

export const CONTENT_CATALOGS: Readonly<Record<string, readonly ContentCatalogEntry[]>> = {
  'data/unified-action-templates#UNIFIED_ACTION_TEMPLATES': UNIFIED_ACTION_TEMPLATES,
  'data/unified-action-templates#LOCATION_BRANCHING_ENCOUNTER_TEMPLATES': LOCATION_BRANCHING_ENCOUNTER_TEMPLATES,
  'data/unified-action-templates#THREAD_CREATION_TEMPLATES': THREAD_CREATION_TEMPLATES,
  'data/unified-action-templates#THREAD_MANAGEMENT_TEMPLATES': THREAD_MANAGEMENT_TEMPLATES,
  'data/unified-action-templates#AGENT_INTERVENTION_TEMPLATES': AGENT_INTERVENTION_TEMPLATES,
  'data/strategic-packs/merchantStrategicPack#MERCHANT_STRATEGIC_TEMPLATES': MERCHANT_STRATEGIC_TEMPLATES,
  'data/strategic-packs/builderStrategicPack#BUILDER_STRATEGIC_TEMPLATES': BUILDER_STRATEGIC_TEMPLATES,
  'data/strategic-packs/scholarStrategicPack#SCHOLAR_STRATEGIC_TEMPLATES': SCHOLAR_STRATEGIC_TEMPLATES,
  'data/strategic-packs/zealotStrategicPack#ZEALOT_STRATEGIC_TEMPLATES': ZEALOT_STRATEGIC_TEMPLATES,
  'data/strategic-packs/courtStrategicPack#COURT_STRATEGIC_TEMPLATES': COURT_STRATEGIC_TEMPLATES,
  'data/strategic-packs/warlordStrategicPack#WARLORD_STRATEGIC_TEMPLATES': WARLORD_STRATEGIC_TEMPLATES,
  'data/strategic-packs/wandererStrategicPack#WANDERER_STRATEGIC_TEMPLATES': WANDERER_STRATEGIC_TEMPLATES,
  'data/strategic-packs/factory/index#FACTORY_STRATEGIC_TEMPLATES': FACTORY_STRATEGIC_TEMPLATES,
  'data/undertaking-cells#UNDERTAKING_CELL_TEMPLATES': UNDERTAKING_CELL_TEMPLATES,
  'data/reward-attachment-catalog#REWARD_POSSESSIONS': REWARD_POSSESSIONS,
  'data/reward-attachment-catalog#TREASURE_MAPS': TREASURE_MAPS,
  'data/reward-attachment-catalog#REWARD_CONDITIONS': REWARD_CONDITIONS,
  'data/reward-attachment-catalog#REWARD_BESTOWED_POWERS': REWARD_BESTOWED_POWERS,
  'data/anomaly-reward-catalog#ANOMALY_SIGNATURE_ARTIFACTS': ANOMALY_SIGNATURE_ARTIFACTS,
  'data/anomaly-reward-catalog#ANOMALY_BESTOWED_POWERS': ANOMALY_BESTOWED_POWERS,
  'data/anomaly-reward-catalog#ANOMALY_CONDITIONS': ANOMALY_CONDITIONS,
  'data/starter-attachments#STARTER_POSSESSIONS': STARTER_POSSESSIONS,
  'data/starter-attachments#STARTER_CONDITIONS': STARTER_CONDITIONS,
  'data/artifact-templates#ARTIFACT_TEMPLATES': ARTIFACT_TEMPLATES,
  'data/companion-templates#COMPANION_TEMPLATES': COMPANION_TEMPLATES,
  'data/agreement-reward-catalog#AGREEMENT_REWARD_TEMPLATES': AGREEMENT_REWARD_TEMPLATES,
  'data/ambition-templates#AMBITION_TEMPLATES': AMBITION_TEMPLATES,
  'data/ambition-templates#GRIEVANCE_AMBITION_TEMPLATES': GRIEVANCE_AMBITION_TEMPLATES,
  'data/ambition-templates#EVENT_MINTED_AMBITION_TEMPLATES': EVENT_MINTED_AMBITION_TEMPLATES,
  'data/omenTemplates#OMEN_TEMPLATES': OMEN_TEMPLATES,
  'data/nudge-card-library#NUDGE_CARD_LIBRARY': NUDGE_CARD_LIBRARY,
  'data/spell-templates#SPELL_TEMPLATES': SPELL_TEMPLATES,
};

/** The entries a registry ref names, or `undefined` when the loader has no such key. */
export function entriesFor(ref: ContentCatalogRef): readonly ContentCatalogEntry[] | undefined {
  return CONTENT_CATALOGS[catalogKey(ref)];
}

/**
 * Every entry of a kind, de-duplicated by id across its catalogs and **narrowed to the
 * ids that kind's prefixes claim**. The narrowing is what lets the encounter and action
 * kinds share `UNIFIED_ACTION_TEMPLATES`: the array holds both, and the prefix sets —
 * pinned disjoint by the contract test — say which half is whose.
 */
// ─── Tags (THR-1486) ────────────────────────────────────────────────

/**
 * The tags an author wrote on the entry, from whichever of the two shapes it uses.
 * De-duplicated, order preserved. Never projected — see {@link effectiveTags}.
 */
export function authoredTags(entry: ContentCatalogEntry): readonly string[] {
  const out: string[] = [];
  for (const t of entry.tags ?? []) if (!out.includes(t)) out.push(t);
  for (const t of entry.properties?.tags ?? []) if (!out.includes(t)) out.push(t);
  return out;
}

/**
 * The tags derived from an entry's typed fields, per the kind's `projections` column —
 * `reach: 'iron'` yields `#iron`, `sphereAffinity: 'entropy'` yields `#entropy`.
 *
 * **Projection beats authoring** (THR-1481): where a typed field exists the tag is never
 * double-authored, and `contentTags.test.ts` fails an authored tag on a projected axis
 * that contradicts the field. Only the fields the registry names are read, so a kind
 * with an empty `projections` column projects nothing — which is the honest answer for
 * items (no entry carries `sphereAffinity`) and omens (the field is nested and
 * conditional), both measured in slice 1 and recorded on those rows.
 */
export function projectedTags(kindId: ContentObjectKindId, entry: ContentCatalogEntry): readonly string[] {
  const kind = CONTENT_OBJECT_KINDS.find(k => k.id === kindId);
  if (!kind) return [];
  const bag = entry.properties ?? (entry as unknown as Record<string, unknown>);
  const out: string[] = [];
  for (const field of Object.values(kind.projections)) {
    if (!field) continue;
    const value = (bag as Record<string, unknown>)[field] ?? (entry as unknown as Record<string, unknown>)[field];
    if (typeof value !== 'string' || value.length === 0) continue;
    const tag = `#${value}`;
    if (!out.includes(tag)) out.push(tag);
  }
  return out;
}

/** `authored ∪ projected` — what a query actually matches against. */
export function effectiveTags(kindId: ContentObjectKindId, entry: ContentCatalogEntry): readonly string[] {
  const out = [...authoredTags(entry)];
  for (const t of projectedTags(kindId, entry)) if (!out.includes(t)) out.push(t);
  return out;
}

export function entriesOfKind(kindId: ContentObjectKindId): readonly ContentCatalogEntry[] {
  const kind = CONTENT_OBJECT_KINDS.find(k => k.id === kindId);
  if (!kind) return [];
  const seen = new Map<string, ContentCatalogEntry>();
  for (const ref of kind.catalogs) {
    for (const entry of entriesFor(ref) ?? []) {
      if (!kind.idPrefixes.some(p => entry.id.startsWith(p))) continue;
      if (!seen.has(entry.id)) seen.set(entry.id, entry);
    }
  }
  return [...seen.values()];
}
