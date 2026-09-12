/**
 * The content-object registry — every kind of authored content the game hands out,
 * in game words (THR-1485, slice 1 of THR-1481).
 *
 * **The sibling of `world-objects.ts`.** That registry answers *what is in the world*;
 * this one answers *what an author may write, and where it lives*. A world object is
 * minted by the engine; a content object is written by a person (or an authoring
 * agent) into a catalog, and becomes a world object only when something grants it.
 * `instantiatesAs` is the join: `item_template` instantiates as the world object
 * `item`, `nudge_card` instantiates as nothing at all.
 *
 * **Why it exists.** Content references content by literal id today, and literal ids
 * rot — 67 of 115 reveal families matched zero templates before THR-844 aliased them.
 * The fix is to name content by *kind and tags* rather than by id (THR-1481), and that
 * needs one place that says what the kinds are and which catalog holds each. This file
 * is that place. Slice 1 added no behaviour; slice 2 (THR-1486) seated the tag vocabulary
 * against it, filled `requiredAxes` from measured coverage, and gave the six attachment
 * kinds their first machine gate. The content query that reads it arrives in slice 3.
 *
 * **The one-PR rule.** Adding a content kind is a row here *and* a UL term *and* a row
 * on the hand canon page (`Docs/canon/content-objects.md`), in one PR — the world-object
 * registry's rule, unchanged. The generated companion
 * (`Docs/canon/content-objects.generated.md`, `npm run generate-content-objects`)
 * carries the census and fails by name on drift.
 *
 * **Prefixes are claimed, not owned (THR-1485 finding).** The plan asked that every id
 * prefix be claimed by exactly one row. That is true of ten kinds and false of three:
 * `anomaly_spore_*` names an item, a power *and* a condition, and `anomaly_crystal_*`
 * names two of those. The ids were never built to discriminate — the *catalog* is what
 * tells those kinds apart. So the registry claims prefixes for totality (every id in a
 * kind's catalogs starts with one of its prefixes, else the contract test fails by
 * name); two kinds may share a catalog export but never while also sharing a prefix,
 * because then nothing decides which entry is whose; and a
 * prefix genuinely shared between kinds must be declared in `SHARED_ID_PREFIXES` with
 * its reason. An *undeclared* collision still fails. See `Docs/canon/content-objects.md`
 * § Known seams.
 */
import type { WorldObjectKindId } from './world-objects';

// ─── Shapes ─────────────────────────────────────────────────────────

/**
 * The five axes a content tag may sit on (THR-1481). Seated here in slice 1 so the
 * registry's `requiredAxes` column has a vocabulary to name. The tags themselves and
 * their catalog landed in slice 2 (`src/data/content-tags.ts`, THR-1486).
 */
export type ContentTagAxis = 'form' | 'reach' | 'sphere' | 'family' | 'polarity';

/** One exported array that holds entries of a kind. The generator verifies both halves exist. */
export interface ContentCatalogRef {
  /** Module path under `src/`, without extension (`data/artifact-templates`). */
  readonly module: string;
  /** The exported symbol holding the entries. */
  readonly export: string;
}

export type ContentObjectStatus =
  /** authored entries exist and a runtime reader draws from them */
  | 'live'
  /** authored entries exist; no runtime path draws from them on the census seeds */
  | 'dormant'
  /** reader-accepted, superseded by another kind; no new entries authored */
  | 'legacy';

export type ContentObjectKindId =
  | 'encounter_template'
  | 'action_template'
  | 'undertaking_template'
  | 'item_template'
  | 'legendary_template'
  | 'condition_template'
  | 'power_template'
  | 'agreement_template'
  | 'companion_template'
  | 'ambition_template'
  | 'omen_template'
  | 'nudge_card';

export interface ContentObjectKind {
  readonly id: ContentObjectKindId;
  /** The word the game uses. Player-facing where the player meets it at all. */
  readonly gameWord: string;
  /** The UL entry (`Docs/ubiquitous-language/<shard>.md#<anchor>`). */
  readonly ulTerm: string;
  /**
   * Id prefixes this kind's entries carry. **Totality, not ownership**: every id in
   * this kind's catalogs must start with one of these. A prefix shared with another
   * kind must appear in `SHARED_ID_PREFIXES`.
   */
  readonly idPrefixes: readonly string[];
  /** The catalogs that hold this kind's entries. Shareable with a kind whose prefixes are disjoint. */
  readonly catalogs: readonly ContentCatalogRef[];
  /**
   * Tag axes an entry of this kind must carry. Seated by the vocabulary in slice 2
   * (THR-1486) from *measured* coverage — an axis is required only where every entry of
   * the kind already carries it, so the column can only ever grow and never ships red.
   * Empty means the kind is not yet gated on tags, not that it needs none.
   */
  readonly requiredAxes: readonly ContentTagAxis[];
  /**
   * Typed fields that project onto a tag axis at index time, so the tag is never
   * double-authored (slice 2's projection rule). Field name per axis.
   */
  readonly projections: Readonly<Partial<Record<ContentTagAxis, string>>>;
  /** The world object an entry becomes when granted, or null for content never instantiated. */
  readonly instantiatesAs: WorldObjectKindId | null;
  /** The machine gate that validates this kind (`npm run <script>`), or null while none exists. */
  readonly gate: string | null;
  /** Filled by THR-1482 slice 2: the card kind and the sheet a reference to this kind opens. */
  readonly surface: { readonly card: string | null; readonly sheet: string | null };
  /** The systems-inventory subsystem that owns the kind's readers. Verbatim. */
  readonly owningSystem: string;
  readonly status: ContentObjectStatus;
  /** The decision recorded when the kind was seated — the sentence an author needs. */
  readonly note: string;
}

// ─── Declared prefix sharing ────────────────────────────────────────
// The three prefixes the corpus genuinely shares across kinds, each with the reason.
// An undeclared collision fails the contract test; this table is the audit trail for
// the ones we accept. Slice 2's vocabulary does not fix them — an id is not a tag —
// but the content query never reads a prefix, so nothing downstream depends on them.

export const SHARED_ID_PREFIXES: Readonly<Record<string, string>> = {
  reward_:
    'The aftermath reward catalog names items, conditions and powers in one namespace (`reward_arms_*`, `reward_condition_*`, `reward_bestowed_*`). The second segment does discriminate today, but nothing enforces it, so the catalog export is the discriminator and this prefix is shared by declaration.',
  starter_:
    'Starter attachments name possessions and conditions in one namespace (`starter_iron_blade`, `starter_bruised_ribs`); the second segment is the entity, not the family, so no longer prefix can tell them apart.',
  anomaly_:
    'The anomaly catalog is the hard case: `anomaly_spore_*` names an item, a power AND a condition, and `anomaly_crystal_*` names two. Irreducibly shared — the catalog export is the only discriminator.',
};

// ─── The registry ───────────────────────────────────────────────────

const K = (row: ContentObjectKind): ContentObjectKind => row;

export const CONTENT_OBJECT_KINDS: readonly ContentObjectKind[] = [
  // ── What a mortal walks into ──
  K({
    id: 'encounter_template',
    gameWord: 'Encounter',
    ulTerm: 'Encounters.md#encounter',
    idPrefixes: [
      'encounter.', 'encounter_', 'enc.', 'borderland.', 'social.', 'tavern.', 'npc_',
      'monster.', 'army.', 'reputation.', 'faction.', 'mentorship.', 'liminal.',
      'broker.', 'healer.', 'crafting.', 'star.', 'stone.', 'veil.', 'eye.', 'gold.',
      // The faction quest families, two-letter by convention (THR-1481 names these
      // `encounterFamily` prefixes as the literal-id rot slice 4 replaces with tags).
      'ag.', 'mc.', 'tg.', 'ac.', 'bf.', 'cg.', 'hod.', 'uk.', 'rb.', 'mct.', 'lk.', 'ts.', 'fa.',
    ],
    catalogs: [
      { module: 'data/unified-action-templates', export: 'UNIFIED_ACTION_TEMPLATES' },
      { module: 'data/unified-action-templates', export: 'LOCATION_BRANCHING_ENCOUNTER_TEMPLATES' },
    ],
    requiredAxes: [],
    projections: { reach: 'reach', sphere: 'sphereAffinity' },
    instantiatesAs: 'encounter_template',
    gate: 'check:encounter',
    surface: { card: null, sheet: null },
    owningSystem: 'Encounters & Dilemmas',
    status: 'live',
    note: 'The curated chapter a mortal meets — branching authored encounters and systemic linear templates, one format (`UnifiedActionTemplate`). Shares its array with the action kind: the two are told apart by id prefix, and the contract test pins that the two prefix sets are disjoint and together cover every id. `check:encounter` scopes to the `encounter.` prefix only, so most of this kind is ungated until slice 4.',
  }),

  // ── What the god and the world play ──
  K({
    id: 'action_template',
    gameWord: 'Action',
    ulTerm: 'Encounters.md#unifiedactiontemplate',
    idPrefixes: [
      'action.', 'hex.', 'divine.', 'loc.', 'invest.', 'artifact.', 'company.', 'sub.',
      'thread.', 'bind_', 'observe_', 'scry_', 'whisper_', 'dream_',
    ],
    catalogs: [
      // Shares the pooled arrays with the encounter kind, which is legal precisely
      // because the two prefix sets partition them — pinned by the contract test.
      { module: 'data/unified-action-templates', export: 'UNIFIED_ACTION_TEMPLATES' },
      { module: 'data/unified-action-templates', export: 'LOCATION_BRANCHING_ENCOUNTER_TEMPLATES' },
      { module: 'data/unified-action-templates', export: 'THREAD_CREATION_TEMPLATES' },
      { module: 'data/unified-action-templates', export: 'THREAD_MANAGEMENT_TEMPLATES' },
      { module: 'data/unified-action-templates', export: 'AGENT_INTERVENTION_TEMPLATES' },
    ],
    requiredAxes: [],
    projections: { reach: 'reach', sphere: 'sphereAffinity' },
    instantiatesAs: 'action_template',
    gate: null,
    surface: { card: null, sheet: null },
    owningSystem: 'Encounters & Dilemmas',
    status: 'live',
    note: 'The verbs the player and the world play rather than walk into — divine interventions, hex workings, location and artifact verbs, the thread cards. Same `UnifiedActionTemplate` shape as an encounter; the difference is who acts, which the id prefix records. It shares the pooled arrays with the encounter kind: the prefix sets partition them, so each row counts its own half and the two halves add up to the pool.',
  }),

  // ── Work a mortal takes on ──
  K({
    id: 'undertaking_template',
    gameWord: 'Undertaking',
    ulTerm: 'Agents.md#undertaking',
    idPrefixes: ['strategic_', 'cell.'],
    catalogs: [
      { module: 'data/strategic-packs/merchantStrategicPack', export: 'MERCHANT_STRATEGIC_TEMPLATES' },
      { module: 'data/strategic-packs/builderStrategicPack', export: 'BUILDER_STRATEGIC_TEMPLATES' },
      { module: 'data/strategic-packs/scholarStrategicPack', export: 'SCHOLAR_STRATEGIC_TEMPLATES' },
      { module: 'data/strategic-packs/zealotStrategicPack', export: 'ZEALOT_STRATEGIC_TEMPLATES' },
      { module: 'data/strategic-packs/courtStrategicPack', export: 'COURT_STRATEGIC_TEMPLATES' },
      { module: 'data/strategic-packs/warlordStrategicPack', export: 'WARLORD_STRATEGIC_TEMPLATES' },
      { module: 'data/strategic-packs/wandererStrategicPack', export: 'WANDERER_STRATEGIC_TEMPLATES' },
      { module: 'data/strategic-packs/factory/index', export: 'FACTORY_STRATEGIC_TEMPLATES' },
      { module: 'data/undertaking-cells', export: 'UNDERTAKING_CELL_TEMPLATES' },
    ],
    requiredAxes: [],
    projections: {},
    instantiatesAs: 'undertaking',
    gate: 'check:undertaking',
    surface: { card: null, sheet: null },
    owningSystem: 'Ambitions & Undertakings',
    status: 'live',
    note: 'A multi-tick work a mortal commits to — the seven authored packs, the factory\'s compiled output, and the synthesised cells (verb × object type) that superseded the hand-written packs under the `cells` model. `catalystEncounterIds` on these templates is the dormant literal-id path slice 4 replaces with a query.',
  }),

  // ── Things a mortal carries or is under ──
  K({
    id: 'item_template',
    gameWord: 'Item',
    ulTerm: 'Traits.md#attachment',
    idPrefixes: ['reward_', 'starter_', 'anomaly_'],
    catalogs: [
      { module: 'data/reward-attachment-catalog', export: 'REWARD_POSSESSIONS' },
      { module: 'data/reward-attachment-catalog', export: 'TREASURE_MAPS' },
      { module: 'data/starter-attachments', export: 'STARTER_POSSESSIONS' },
      { module: 'data/anomaly-reward-catalog', export: 'ANOMALY_SIGNATURE_ARTIFACTS' },
    ],
    // Measured at the vocabulary's landing (THR-1486): every one of the 134 entries carries
    // a family tag, so this axis is required and the gate is not vacuous. `form` (108/134) and
    // `reach` (112/134) are the next two and are deliberately not required yet — requiredAxes
    // only ever grows, and a required axis the corpus does not satisfy is a red gate, not a plan.
    requiredAxes: ['family'],
    // No sphere projection: `PossessionNodeProperties.sphereAffinity` is declared but
    // **no catalog entry carries it** (0 of 134, measured THR-1485). The plan expected
    // to project the item sphere tag from that field and retype it in slice 2; the
    // field has no bearer to retype. Items' sphere tags stay authored until someone
    // authors the field — the same verdict THR-477 reached for their reach.
    projections: {},
    instantiatesAs: 'item',
    gate: 'check:attachment',
    surface: { card: null, sheet: null },
    owningSystem: 'Attachments, Items & Possessions',
    status: 'live',
    note: 'Arms, mounts, tomes, relics, tools, provisions — the possession catalog the reward pool already draws from by tag (`reward_draw`, THR-1146), which makes this the one kind the content query is modelled on rather than added to. Entries are `GraphNode` literals, not a template type, so the tag axes are the only vocabulary they share.',
  }),
  K({
    id: 'legendary_template',
    gameWord: 'Legendary artifact',
    ulTerm: 'Traits.md#attachment',
    idPrefixes: ['worldforge_', 'heartseed_', 'voidgate_'],
    catalogs: [{ module: 'data/artifact-templates', export: 'ARTIFACT_TEMPLATES' }],
    // All three entries carry one.
    requiredAxes: ['family'],
    projections: {},
    instantiatesAs: 'legendary_artifact',
    gate: 'check:attachment',
    surface: { card: null, sheet: null },
    owningSystem: 'Attachments, Items & Possessions',
    status: 'live',
    note: 'An item with its own trait graph, bonded rather than possessed. Three entries, each its own id namespace — the one kind whose prefixes are entity names, because there are too few for a family to have formed. A fourth artifact adds a fourth prefix; when that is tiresome, the kind takes a shared `legendary_` prefix and this note is the reason it did not start with one.',
  }),
  K({
    id: 'condition_template',
    gameWord: 'Condition',
    ulTerm: 'Traits.md#trait-category',
    idPrefixes: ['reward_', 'starter_', 'anomaly_'],
    catalogs: [
      { module: 'data/reward-attachment-catalog', export: 'REWARD_CONDITIONS' },
      { module: 'data/starter-attachments', export: 'STARTER_CONDITIONS' },
      { module: 'data/anomaly-reward-catalog', export: 'ANOMALY_CONDITIONS' },
    ],
    // All 46 entries carry both. Polarity is required here and nowhere else: a condition
    // that does not say whether it helps or harms is the one shape the proxy-event
    // classifier cannot read.
    requiredAxes: ['family', 'polarity'],
    projections: {},
    instantiatesAs: 'condition',
    gate: 'check:attachment',
    surface: { card: null, sheet: null },
    owningSystem: 'Effects & Conditions',
    status: 'live',
    note: 'Wounds, diseases, strains; blessings and curses as signed conditions. Entries are shared `trait` definition nodes with `subcategory: condition | scar` — one node per kind, per-bearer state on the `has_trait` edge (THR-1395). The `#positive` / `#negative` polarity the proxy-event classifier already reads is the seed of slice 2\'s polarity axis.',
  }),
  K({
    id: 'power_template',
    gameWord: 'Power',
    ulTerm: 'Traits.md#power',
    idPrefixes: ['reward_', 'anomaly_', 'spell_'],
    catalogs: [
      { module: 'data/reward-attachment-catalog', export: 'REWARD_BESTOWED_POWERS' },
      { module: 'data/anomaly-reward-catalog', export: 'ANOMALY_BESTOWED_POWERS' },
      { module: 'data/spell-templates', export: 'SPELL_TEMPLATES' },
    ],
    // All 25 entries carry one.
    requiredAxes: ['family'],
    projections: { sphere: 'sphereAffinity' },
    instantiatesAs: 'power',
    gate: 'check:attachment',
    surface: { card: null, sheet: null },
    owningSystem: 'Attachments, Items & Possessions',
    status: 'live',
    note: 'A god\'s gift (`bestowed`) and a spell a mortal learned (`spell`) — two classes of one kind, per THR-1429. The bestowed half is `trait` definition nodes in the reward catalogs; the spell half is `SpellTemplate` literals seeded into the same node shape. Two catalog shapes, one kind, because what a query asks for is "a power", never "a power in the literal form of a trait node".',
  }),
  K({
    id: 'agreement_template',
    gameWord: 'Agreement',
    ulTerm: 'Traits.md#attachment',
    idPrefixes: ['agreement.'],
    catalogs: [{ module: 'data/agreement-reward-catalog', export: 'AGREEMENT_REWARD_TEMPLATES' }],
    // All seven entries carry both.
    requiredAxes: ['reach', 'family'],
    projections: {},
    instantiatesAs: 'agreement',
    gate: 'check:attachment',
    surface: { card: null, sheet: null },
    owningSystem: 'Secrets & Favors',
    status: 'live',
    note: 'A favour owed or a mark held — an edge between two parties, so the template names a relationship rather than a thing. Its `tier` is a bare `number` today where every sibling catalog carries a `RarityTier`; slice 2 retypes it, which is why the content query\'s tier window is specified over `RarityTier` and not over the field.',
  }),
  K({
    id: 'companion_template',
    gameWord: 'Companion',
    ulTerm: 'Agents.md#companion',
    idPrefixes: ['companion.'],
    catalogs: [{ module: 'data/companion-templates', export: 'COMPANION_TEMPLATES' }],
    // All nine entries carry one — the setting class the reward pool filters on.
    requiredAxes: ['family'],
    projections: {},
    instantiatesAs: 'companion',
    gate: 'check:attachment',
    surface: { card: null, sheet: null },
    owningSystem: 'Attachments, Items & Possessions',
    status: 'live',
    note: 'A face that walks with one mortal and grants small always-on bonuses; never an agent. Already tag-bearing, and already drawn by the reward pool — the second kind the content query costs nothing to serve.',
  }),

  // ── Wants and pressure ──
  K({
    id: 'ambition_template',
    gameWord: 'Ambition',
    ulTerm: 'Agents.md#undertaking',
    idPrefixes: ['ambition_'],
    catalogs: [
      { module: 'data/ambition-templates', export: 'AMBITION_TEMPLATES' },
      { module: 'data/ambition-templates', export: 'GRIEVANCE_AMBITION_TEMPLATES' },
      { module: 'data/ambition-templates', export: 'EVENT_MINTED_AMBITION_TEMPLATES' },
    ],
    requiredAxes: [],
    projections: {},
    instantiatesAs: 'ambition',
    gate: null,
    surface: { card: null, sheet: null },
    owningSystem: 'Ambitions & Undertakings',
    status: 'live',
    note: 'What a mortal wants, and the shape of the work it offers. Three catalogs by how one is minted — assigned at seeding, grown from a grievance, or minted by an event — which is a provenance distinction, not a kind distinction, so they share one row.',
  }),
  K({
    id: 'omen_template',
    gameWord: 'Omen',
    ulTerm: 'Encounters.md#omen',
    idPrefixes: ['omen.'],
    catalogs: [{ module: 'data/omenTemplates', export: 'OMEN_TEMPLATES' }],
    requiredAxes: [],
    // No sphere projection: an omen's sphere lives at `sphereTrigger.sphere` and only
    // on the `sphere_surge` category (6 of 44 tracks), so it is a *conditional nested*
    // field, not the flat one a projection reads. A projection that fired for a quarter
    // of the kind and silently skipped the rest would read as "no tags authored".
    projections: {},
    instantiatesAs: null,
    gate: null,
    surface: { card: null, sheet: null },
    owningSystem: 'Omens & Atmospheric Pressure',
    status: 'live',
    note: 'A track of signs the world shows before something breaks — breach, convergence, reckoning, sphere surge, cultural. Instantiates as nothing: an omen track is pressure the doom clock reads, never an object a mortal holds, which is why `instantiatesAs` is null rather than an oversight.',
  }),

  // ── What the god holds ──
  K({
    id: 'nudge_card',
    gameWord: 'Card',
    ulTerm: 'Encounters.md#nudge',
    idPrefixes: ['card.'],
    catalogs: [{ module: 'data/nudge-card-library', export: 'NUDGE_CARD_LIBRARY' }],
    requiredAxes: [],
    projections: {},
    instantiatesAs: null,
    gate: null,
    surface: { card: null, sheet: null },
    owningSystem: 'Encounters & Dilemmas',
    status: 'live',
    note: 'The god\'s repertoire — what a player may commit to a step to lean a roll. Instantiates as nothing: a card is played and spent, never granted as a world object. Its `DealContextTag` vocabulary (`might`, `finesse`, …) is a *card-context* vocabulary and deliberately not a spelling of the eight reaches; slice 2 leaves it alone and records the seam.',
  }),
];

// ─── Readers ────────────────────────────────────────────────────────

export function getContentObjectKind(id: ContentObjectKindId): ContentObjectKind | undefined {
  return CONTENT_OBJECT_KINDS.find(k => k.id === id);
}

/** The kinds whose entries an id could belong to — one for most prefixes, several for a shared one. */
export function contentKindsForId(id: string): readonly ContentObjectKind[] {
  return CONTENT_OBJECT_KINDS.filter(k => k.idPrefixes.some(p => id.startsWith(p)));
}

/** The kinds that instantiate as a given world object, e.g. which content mints an `item`. */
export function contentKindsForWorldObject(worldKind: WorldObjectKindId): readonly ContentObjectKind[] {
  return CONTENT_OBJECT_KINDS.filter(k => k.instantiatesAs === worldKind);
}

/** True when the prefix is one this registry knowingly shares between kinds. */
export function isSharedIdPrefix(prefix: string): boolean {
  return Object.prototype.hasOwnProperty.call(SHARED_ID_PREFIXES, prefix);
}
