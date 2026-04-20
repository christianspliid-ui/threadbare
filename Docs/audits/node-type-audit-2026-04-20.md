# Node Type Audit — 2026-04-20

## Summary table

| node type | file:line | class (entity/state/relational/other) | tagging? | recipes? | edges? |
|---|---|---|---|---|---|
| `actor` | `src/types/graph.ts:18` | entity | Yes; current axes plus actor-role (`ActorType`) needed for precision (`src/types/graph.ts:31`). | Yes; primary find/create anchor. | Strong coverage (`relates_to`, `member_of`, `thread`, `located_at`, `pursues`, etc.). |
| `location` | `src/types/graph.ts:19` | entity | Yes; `LocationSubtype` already implies additional location-specific axes (`src/types/index.ts:65`). | Yes; primary context/target node. | Strong coverage (`contains`, `adjacent`, `located_at`, `encounter_at`, `occurred_at`, `knows_of`, etc.). |
| `region` | `src/types/graph.ts:27` | entity | Yes; geography/political tagging likely needed beyond reach/sphere/archetype. | Limited; mostly generated world context. | Partial coverage (`contains`, `adjacent`). |
| `artifact` | `src/types/graph.ts:21` | entity | Yes; tags already used in attachment catalogs. | Yes; reward/find/create targets. | Covered (`possesses`, `thread`, reserved enchantment edges). |
| `artifact_legendary` | `src/types/graph.ts:22` | entity | Yes; same as artifact plus legendary semantics. | Yes; rare create/find outcomes. | Covered (`bonded_to`, `thread`, reserved enchantment edges). |
| `resource` | `src/types/graph.ts:23` | entity | Yes; economy/extraction-specific axes likely needed. | Potentially yes, but current usage appears sparse. | Thin (`controls` only in canonical schema). |
| `trait` | `src/types/graph.ts:20` | state | Yes; explicit trait subcategories already exist (`src/types/traits.ts:11`). | Yes; mostly precondition/effect and grant/remove flows. | Covered by `has_trait`; also indirectly linked via threads and effects. |
| `ambition` | `src/types/graph.ts:28` | state | Yes; goal/intention axes likely needed. | Yes; created/assigned in generation and lifecycle. | Covered (`pursues`). |
| `event` | `src/types/graph.ts:25` | relational | Usually no taxonomy tagging required beyond event metadata. | Yes; emitted as action/encounter outcomes. | Covered (`participated_in`, `occurred_at`, `caused_by`). |
| `action_template` | `src/types/graph.ts:24` | other | Weak candidate for ontology tagging (procedural template, not world entity). | Yes; recipe/action source nodes. | Covered (`performing`, `encounter_at`). |
| `cosmology` | `src/types/graph.ts:26` | other | Uses its own cosmology taxonomy; separate from content tagging. | Not a normal recipe target; usually reference data. | Covered as target (`aligned_with`, `sphere_influence`). |
| `ActorType` (`god|ascendant|faction|culture|group|individual`) | `src/types/graph.ts:31` | entity | Yes; this is effectively a required extra axis for actor classification. | Yes; drives generation/selection logic. | Edge constraints frequently depend on actor subclass semantics. |
| `LocationSubtype` (settlements/wonders/ruins/POIs/etc.) | `src/types/index.ts:65` | entity | Yes; clearly needs subtype-specific tags/axes. | Yes; used heavily in encounter/action filtering. | Indirectly yes; many edges are location-subtype-sensitive. |
| `TraitCategory` (`innate|mastery|reputation|scar|condition|destiny|cultural|bestowed`) | `src/types/traits.ts:11` | state | Yes; this is already a classification axis. | Yes; key to reward, condition, and progression composition. | Yes via `has_trait` semantics and effects wiring. |
| `AttachmentCategory` (`possession|condition|blessing|curse|bestowed_power|agreement|spell`) | `src/types/attachments.ts:145` | state | Yes; category-level tagging is needed. | Yes; explicit reward-pool recipe axis. | Mixed; maps to node+edge patterns rather than one edge family. |
| `CompositionKind` (`faction|agent|event|quest|location|encounter|mandate`) | `src/composition-dsl/schema.ts:5` | other | Yes, but currently free-form in schema (`src/composition-dsl/schema.ts:16`, `:219`). | Yes; this is recipe-level node intent. | Edge semantics are unconstrained string fields in DSL. |
| `WorldNode.kind` (free string) | `src/composition-dsl/validator.ts:31` | other | Not enforced; tagging depends on caller discipline. | Yes in validator simulation. | Edge typing is open string (`src/composition-dsl/validator.ts:19`). |
| `sublocation` (legacy `nodeType`) | `src/engine/strategicGraphOps.ts:85`, `src/engine/hexActionBridge.ts:303` | other | Ambiguous (seems intended as location subtype, not first-class node type). | Yes in legacy graph-op paths. | Partially wired and inconsistent with canonical `NodeType`. |
| `agent` (legacy `nodeType`) | `src/data/action-template-content.ts:82` | other | Ambiguous; likely legacy alias of `actor`. | Yes in legacy action templates. | Edges in same templates use non-canonical names. |
| `attachment` (legacy `nodeType`) | `src/data/action-template-content.ts:304` | other | Ambiguous; likely maps to `artifact`/`trait` split. | Yes in legacy action templates. | Not aligned with canonical edge/node schema. |
| taxonomy categories (`foundation|creation|magic-tradition|terrain|relationship-type`) | `src/types/taxonomy.ts:65` | other | Taxonomy-native tagging, separate from gameplay ontology. | Not direct recipe nodes in world graph runtime. | `relationship-type` is edge-meta, not world entity. |

## Per-class sections

### Entity nodes

- `actor`, `location`, `region`, `artifact`, `artifact_legendary`, `resource` are the declared world-graph entity classes (`src/types/graph.ts:18-28`).
- `ActorType` and `LocationSubtype` are load-bearing sub-axes (`src/types/graph.ts:31`, `src/types/index.ts:65`) and should be treated as required secondary classification dimensions in ontology work.
- `resource` is declared as a node type but currently has very thin edge semantics (`controls`), suggesting under-modeled economy/resource lifecycle (`src/types/edgeSchema.ts:95-102`).

### State nodes

- `trait` and `ambition` are canonical state-bearing node types (`src/types/graph.ts:20`, `:28`).
- Conditions and bestowed powers are implemented as `trait` nodes (`src/data/reward-attachment-catalog.ts:2205`, `:2977`; `src/data/starter-attachments.ts:218`).
- Attachment categories in `src/types/attachments.ts:145` function as a state taxonomy that cuts across `artifact` and `trait` representations.

### Relational nodes

- `event` is the primary relational history node (`src/types/graph.ts:25`), with explicit causation and participation edges (`src/types/graph.ts:90-101`).
- Relationship meta also exists in taxonomy as `relationship-type` category (`src/types/taxonomy.ts:70`), but this is outside runtime world-graph node typing.

### Other (explicitly non-entity/state/relational)

- `action_template` and `cosmology` are structural/reference nodes (`src/types/graph.ts:24`, `:26`).
- Composition DSL kinds (`faction|agent|event|quest|location|encounter|mandate`) are recipe-intent labels, not a strict world-graph node registry (`src/composition-dsl/schema.ts:5-16`, `:219`).
- Legacy node-type literals (`agent`, `attachment`, `sublocation`) remain in graph-op/content paths (`src/data/action-template-content.ts:82`, `:304`; `src/engine/strategicGraphOps.ts:85`; `src/engine/hexActionBridge.ts:303`).

## Findings (types that do not fit entity/state/relational cleanly)

1. `action_template` and `cosmology` are meta/structural nodes; they behave as system reference objects rather than narrative entities.
2. DSL kinds (`quest`, `encounter`, `mandate`, etc.) are recipe-scaffold labels and currently do not have a strict one-to-one mapping to canonical `NodeType`.
3. `sublocation`, `agent`, and `attachment` appear as legacy or parallel vocabularies, not normalized into canonical runtime node typing.
4. Taxonomy `relationship-type` is an edge-definition concept, not a world entity node.

## Gaps (proposed follow-up issue seeds)

1. **Node-type drift: `sublocation` is used but missing from canonical `NodeType`.**
   Evidence: `src/engine/strategicGraphOps.ts:85`, `src/engine/hexActionBridge.ts:303`, while `NodeType` excludes it (`src/types/graph.ts:17-28`).
2. **Edge-schema/type mismatch around sublocation and `constructed_by` direction.**
   Evidence: `has_trait` allows `'sublocation'` source (`src/types/edgeSchema.ts:67`) even though `NodeType` does not; `constructed_by` intent differs across declarations/usage (`src/types/graph.ts:93`, `src/types/edgeSchema.ts:309-317`, `src/engine/strategicGraphOps.ts:105-111`).
3. **Legacy GraphOp vocabulary diverges from canonical edge/node registries.**
   Evidence: `nodeType: 'agent'|'attachment'` (`src/data/action-template-content.ts:82`, `:304`), `edgeType: 'commands'|'party_to'|'enchanted_by'` (e.g. `src/data/action-template-content.ts:86`, `:368`, `:661`), `edgeType: 'possessed_by'` (`src/engine/hexActionBridge.ts:262`) not present in `EdgeType` union (`src/types/graph.ts:53-108`).
4. **Declared types appear under-instantiated in runtime paths (`resource`, `cosmology`).**
   Evidence: both are declared in `NodeType` (`src/types/graph.ts:23`, `:26`) and edge constraints, but explicit non-test node creation paths are difficult to find in engine seeding flows.
5. **Composition DSL kind/edge typing is intentionally open-string and can bypass canonical graph contracts.**
   Evidence: `CompositionKind = KnownCompositionKind | string` (`src/composition-dsl/schema.ts:16`), schema validates any non-empty `kind` (`src/composition-dsl/schema.ts:219`), and world-state edges are string-typed (`src/composition-dsl/validator.ts:19`, `:31`).
6. **Tagging axes likely insufficient for location and attachment-heavy state content.**
   Evidence: broad `LocationSubtype` ontology (`src/types/index.ts:65-109`) and rich attachment/trait category systems (`src/types/attachments.ts:145`, `src/types/traits.ts:11`) imply extra axes beyond reach/sphere/archetype for stable differentiation.

## Methodology note

Search strategy used (PowerShell fallback because `rg.exe` is blocked in this runtime):

- Searched recursively under `src/` for: `NodeType`, `EdgeType`, `GraphNode`, `nodeType:`, `edgeType:`, `addNode({`, `type: '...'`, `CompositionKind`, `WorldNode`, `TaxonomyNode`, `LocationSubtype`, `TraitCategory`, `AttachmentCategory`.
- Checked canonical registries first: `src/types/graph.ts`, `src/types/edgeSchema.ts`, `src/types/index.ts`, `src/types/traits.ts`, `src/types/attachments.ts`, `src/composition-dsl/schema.ts`, `src/composition-dsl/validator.ts`, `src/types/taxonomy.ts`.
- Cross-checked runtime/content usage in non-test engine/data files for literal `addNode`/graph-op node and edge type values to detect drift from canonical unions.
