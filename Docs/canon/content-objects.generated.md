---
domain: content-objects
status: generated
generator: npm run generate-content-objects
---

# Content objects — generated catalogue

> **GENERATED — do not hand-edit.** Rendered by `npm run generate-content-objects` from the registry (`src/data/content-objects.ts`) and a static census of the catalogs it names. The hand page — what the kinds mean and how to add one — is [`content-objects.md`](content-objects.md).

12 kinds · 1138 claimed entries across 32 catalogs.

## Drift

No drift: every catalog id is claimed by a kind, and every kind's prefixes claim entries in its own catalogs.

**Ungated kinds — 10 of 12.** Counted, not fatal: most content kinds have no machine gate yet, and closing that is what the later slices of THR-1481 are judged by.

- `action_template`
- `item_template`
- `legendary_template`
- `condition_template`
- `power_template`
- `agreement_template`
- `companion_template`
- `ambition_template`
- `omen_template`
- `nudge_card`

## Kinds

| Kind | Game word | Entries | Catalogs (claimed/total) | Instantiates as | Gate | Owning system | Badge |
|---|---|---|---|---|---|---|---|
| `encounter_template` | Encounter | 510 | `UNIFIED_ACTION_TEMPLATES` (510/697)<br>`LOCATION_BRANCHING_ENCOUNTER_TEMPLATES` (47/47) | `encounter_template` | `npm run check:encounter` | Encounters & Dilemmas | 🟢 LIVE |
| `action_template` | Action | 187 | `UNIFIED_ACTION_TEMPLATES` (187/697)<br>`LOCATION_BRANCHING_ENCOUNTER_TEMPLATES` (0/47)<br>`THREAD_CREATION_TEMPLATES` (6/6)<br>`THREAD_MANAGEMENT_TEMPLATES` (2/2)<br>`AGENT_INTERVENTION_TEMPLATES` (44/44) | `action_template` | — | Encounters & Dilemmas | 🟢 LIVE |
| `undertaking_template` | Undertaking | 116 | `MERCHANT_STRATEGIC_TEMPLATES` (6/6)<br>`BUILDER_STRATEGIC_TEMPLATES` (9/9)<br>`SCHOLAR_STRATEGIC_TEMPLATES` (7/7)<br>`ZEALOT_STRATEGIC_TEMPLATES` (6/6)<br>`COURT_STRATEGIC_TEMPLATES` (15/15)<br>`WARLORD_STRATEGIC_TEMPLATES` (9/9)<br>`WANDERER_STRATEGIC_TEMPLATES` (4/4)<br>`FACTORY_STRATEGIC_TEMPLATES` (0/0)<br>`UNDERTAKING_CELL_TEMPLATES` (60/60) | `undertaking` | `npm run check:undertaking` | Ambitions & Undertakings | 🟢 LIVE |
| `item_template` | Item | 134 | `REWARD_POSSESSIONS` (111/111)<br>`TREASURE_MAPS` (5/5)<br>`STARTER_POSSESSIONS` (8/8)<br>`ANOMALY_SIGNATURE_ARTIFACTS` (10/10) | `item` | — | Attachments, Items & Possessions | 🟢 LIVE |
| `legendary_template` | Legendary artifact | 3 | `ARTIFACT_TEMPLATES` (3/3) | `legendary_artifact` | — | Attachments, Items & Possessions | 🟢 LIVE |
| `condition_template` | Condition | 46 | `REWARD_CONDITIONS` (35/35)<br>`STARTER_CONDITIONS` (5/5)<br>`ANOMALY_CONDITIONS` (6/6) | `condition` | — | Effects & Conditions | 🟢 LIVE |
| `power_template` | Power | 25 | `REWARD_BESTOWED_POWERS` (12/12)<br>`ANOMALY_BESTOWED_POWERS` (8/8)<br>`SPELL_TEMPLATES` (5/5) | `power` | — | Attachments, Items & Possessions | 🟢 LIVE |
| `agreement_template` | Agreement | 7 | `AGREEMENT_REWARD_TEMPLATES` (7/7) | `agreement` | — | Secrets & Favors | 🟢 LIVE |
| `companion_template` | Companion | 9 | `COMPANION_TEMPLATES` (9/9) | `companion` | — | Attachments, Items & Possessions | 🟢 LIVE |
| `ambition_template` | Ambition | 20 | `AMBITION_TEMPLATES` (10/10)<br>`GRIEVANCE_AMBITION_TEMPLATES` (3/3)<br>`EVENT_MINTED_AMBITION_TEMPLATES` (7/7) | `ambition` | — | Ambitions & Undertakings | 🟢 LIVE |
| `omen_template` | Omen | 44 | `OMEN_TEMPLATES` (44/44) | _(nothing)_ | — | Omens & Atmospheric Pressure | 🟢 LIVE |
| `nudge_card` | Card | 37 | `NUDGE_CARD_LIBRARY` (37/37) | _(nothing)_ | — | Encounters & Dilemmas | 🟢 LIVE |

## Tag axes

Required axes and projections land with the vocabulary in slice 2 (`src/data/content-tags.ts`). Tag coverage per axis is deliberately not rendered here yet — a column of zeroes would read as "no tags authored" rather than "no vocabulary to count against".

| Kind | Required axes | Projections (axis ← typed field) |
|---|---|---|
| `encounter_template` | _(slice 2)_ | reach ← `reach`, sphere ← `sphereAffinity` |
| `action_template` | _(slice 2)_ | reach ← `reach`, sphere ← `sphereAffinity` |
| `undertaking_template` | _(slice 2)_ | — |
| `item_template` | _(slice 2)_ | — |
| `legendary_template` | _(slice 2)_ | — |
| `condition_template` | _(slice 2)_ | — |
| `power_template` | _(slice 2)_ | sphere ← `sphereAffinity` |
| `agreement_template` | _(slice 2)_ | — |
| `companion_template` | _(slice 2)_ | — |
| `ambition_template` | _(slice 2)_ | — |
| `omen_template` | _(slice 2)_ | — |
| `nudge_card` | _(slice 2)_ | — |

## Id prefixes

Prefixes are claimed for **totality**, not ownership: every id in a kind's catalogs starts with one of them. Exclusivity sits on the catalog export. A prefix genuinely shared between kinds is declared below with its reason.

| Kind | Prefixes |
|---|---|
| `encounter_template` | `encounter.` `encounter_` `enc.` `borderland.` `social.` `tavern.` `npc_` `monster.` `army.` `reputation.` `faction.` `mentorship.` `liminal.` `broker.` `healer.` `crafting.` `star.` `stone.` `veil.` `eye.` `gold.` `ag.` `mc.` `tg.` `ac.` `bf.` `cg.` `hod.` `uk.` `rb.` `mct.` `lk.` `ts.` `fa.` |
| `action_template` | `action.` `hex.` `divine.` `loc.` `invest.` `artifact.` `company.` `sub.` `thread.` `bind_` `observe_` `scry_` `whisper_` `dream_` |
| `undertaking_template` | `strategic_` `cell.` |
| `item_template` | `reward_` `starter_` `anomaly_` |
| `legendary_template` | `worldforge_` `heartseed_` `voidgate_` |
| `condition_template` | `reward_` `starter_` `anomaly_` |
| `power_template` | `reward_` `anomaly_` `spell_` |
| `agreement_template` | `agreement.` |
| `companion_template` | `companion.` |
| `ambition_template` | `ambition_` |
| `omen_template` | `omen.` |
| `nudge_card` | `card.` |

### Shared prefixes

- `reward_` — The aftermath reward catalog names items, conditions and powers in one namespace (`reward_arms_*`, `reward_condition_*`, `reward_bestowed_*`). The second segment does discriminate today, but nothing enforces it, so the catalog export is the discriminator and this prefix is shared by declaration.
- `starter_` — Starter attachments name possessions and conditions in one namespace (`starter_iron_blade`, `starter_bruised_ribs`); the second segment is the entity, not the family, so no longer prefix can tell them apart.
- `anomaly_` — The anomaly catalog is the hard case: `anomaly_spore_*` names an item, a power AND a condition, and `anomaly_crystal_*` names two. Irreducibly shared — the catalog export is the only discriminator.

## World-object join

What a granted entry becomes. The reverse pointer — a `content`-status world-object row naming its content kind — is pinned by `contentObjects.test.ts`.

| Content kind | Instantiates as | World-object row status |
|---|---|---|
| `encounter_template` | `encounter_template` | content |
| `action_template` | `action_template` | content |
| `undertaking_template` | `undertaking` | live |
| `item_template` | `item` | live |
| `legendary_template` | `legendary_artifact` | live |
| `condition_template` | `condition` | live |
| `power_template` | `power` | live |
| `agreement_template` | `agreement` | live |
| `companion_template` | `companion` | live |
| `ambition_template` | `ambition` | live |
| `omen_template` | _(nothing — by decision)_ | — |
| `nudge_card` | _(nothing — by decision)_ | — |

## Notes

- **Encounter** (`encounter_template`, UL `Encounters.md#encountertemplate`) — The curated chapter a mortal meets — branching authored encounters and systemic linear templates, one format (`UnifiedActionTemplate`). Shares its array with the action kind: the two are told apart by id prefix, and the contract test pins that the two prefix sets are disjoint and together cover every id. `check:encounter` scopes to the `encounter.` prefix only, so most of this kind is ungated until slice 4.
- **Action** (`action_template`, UL `Encounters.md#unifiedactiontemplate`) — The verbs the player and the world play rather than walk into — divine interventions, hex workings, location and artifact verbs, the thread cards. Same `UnifiedActionTemplate` shape as an encounter; the difference is who acts, which the id prefix records. It shares the pooled arrays with the encounter kind: the prefix sets partition them, so each row counts its own half and the two halves add up to the pool.
- **Undertaking** (`undertaking_template`, UL `Agents.md#undertaking`) — A multi-tick work a mortal commits to — the seven authored packs, the factory's compiled output, and the synthesised cells (verb × object type) that superseded the hand-written packs under the `cells` model. `catalystEncounterIds` on these templates is the dormant literal-id path slice 4 replaces with a query.
- **Item** (`item_template`, UL `Traits.md#attachment`) — Arms, mounts, tomes, relics, tools, provisions — the possession catalog the reward pool already draws from by tag (`reward_draw`, THR-1146), which makes this the one kind the content query is modelled on rather than added to. Entries are `GraphNode` literals, not a template type, so the tag axes are the only vocabulary they share.
- **Legendary artifact** (`legendary_template`, UL `Traits.md#attachment`) — An item with its own trait graph, bonded rather than possessed. Three entries, each its own id namespace — the one kind whose prefixes are entity names, because there are too few for a family to have formed. A fourth artifact adds a fourth prefix; when that is tiresome, the kind takes a shared `legendary_` prefix and this note is the reason it did not start with one.
- **Condition** (`condition_template`, UL `Traits.md#trait-category`) — Wounds, diseases, strains; blessings and curses as signed conditions. Entries are shared `trait` definition nodes with `subcategory: condition | scar` — one node per kind, per-bearer state on the `has_trait` edge (THR-1395). The `#positive` / `#negative` polarity the proxy-event classifier already reads is the seed of slice 2's polarity axis.
- **Power** (`power_template`, UL `Traits.md#power`) — A god's gift (`bestowed`) and a spell a mortal learned (`spell`) — two classes of one kind, per THR-1429. The bestowed half is `trait` definition nodes in the reward catalogs; the spell half is `SpellTemplate` literals seeded into the same node shape. Two catalog shapes, one kind, because what a query asks for is "a power", never "a power in the literal form of a trait node".
- **Agreement** (`agreement_template`, UL `Traits.md#attachment`) — A favour owed or a mark held — an edge between two parties, so the template names a relationship rather than a thing. Its `tier` is a bare `number` today where every sibling catalog carries a `RarityTier`; slice 2 retypes it, which is why the content query's tier window is specified over `RarityTier` and not over the field.
- **Companion** (`companion_template`, UL `Agents.md#companion`) — A face that walks with one mortal and grants small always-on bonuses; never an agent. Already tag-bearing, and already drawn by the reward pool — the second kind the content query costs nothing to serve.
- **Ambition** (`ambition_template`, UL `Agents.md#undertaking`) — What a mortal wants, and the shape of the work it offers. Three catalogs by how one is minted — assigned at seeding, grown from a grievance, or minted by an event — which is a provenance distinction, not a kind distinction, so they share one row.
- **Omen** (`omen_template`, UL `Encounters.md#omen`) — A track of signs the world shows before something breaks — breach, convergence, reckoning, sphere surge, cultural. Instantiates as nothing: an omen track is pressure the doom clock reads, never an object a mortal holds, which is why `instantiatesAs` is null rather than an oversight.
- **Card** (`nudge_card`, UL `Encounters.md#nudge`) — The god's repertoire — what a player may commit to a step to lean a roll. Instantiates as nothing: a card is played and spent, never granted as a world object. Its `DealContextTag` vocabulary (`might`, `finesse`, …) is a *card-context* vocabulary and deliberately not a spelling of the eight reaches; slice 2 leaves it alone and records the seam.
