# Undertaking Content Package — format

The package is what the authoring agent hands to `compile:undertaking` (THR-1300 slice 3). It is
**the real template type plus three registration fields** — there is no parallel vocabulary, so an
unknown template field is a `check:typecheck` error on the emitted literal, never a silent drop
(the legacy converter's field-allowlist failure is impossible by construction).

The TypeScript shape is `UndertakingContentPackage` in
`src/data/content-eval/undertakingPackage.ts`; the template type is `StrategicActionTemplate` in
`src/types/strategicAction.ts`. This page is the human reading of both.

## Shape

```jsonc
{
  "slug": "poison-the-well",                       // kebab-case; names the files
  "template": { /* StrategicActionTemplate, verbatim */ },
  "kind": {
    "kindId": "network",                           // a registered kind, or a new one (destroy only)
    "role": "destroy",                             // create | update | destroy — must match the verb
    "row": {                                       // ONLY when opening a new kind with its first destroy
      "tier": 2, "displayName": "…", "objectShape": "…", "ownable": true, "lexicon": "network"
    }
  },
  "profiles": ["ambition.vendetta_ruin"],          // ambition ids that will name the template
  "docComment": ["One or two lines for the file header."]   // optional
}
```

Top-level keys are exactly `slug`, `template`, `kind`, `profiles`, `docComment`. Anything else is
refused by name.

## `template` — the fields the contract reads

The full type is authoritative; these are the ones every block of the Undertaking Contract
(`Docs/canon/undertakings.md`) checks, so a package missing one fails `check:undertaking` after
compile even though it compiled.

| Field | What it is |
|---|---|
| `id` | `strategic_<slug with underscores>` — the compiler enforces the match. |
| `verb` | `create` · `change` · `gather_info` · `control` · `destroy`. `role` follows it: create→create, destroy→destroy, the rest→update. |
| `executionMode` | `multi_tick` for anything with checkpoints (T1+). |
| `displayName`, `activityProse[]`, `completionProse[]` | Prose verbatim — the compiler pins it byte-identically in the emitted test. GM narration, never in situ. |
| `progressRequired`, `difficulty` (or the tier's band fields) | Must land inside the kind row's tier bands (`undertakingConstants.ts`). |
| `motivations[]` | Value-pair tokens composed per the vocabulary lint. |
| `cast[]` | `{ key, persistence: 'must-persist' \| 'may-mint' \| 'bind-only', … }` — a `must-persist` slot is a write the live proof checks. |
| `creationEffects` | `{ onAdvance?, onAtCost?, onCritFailure? }` — at least one band for a `create` verb without a `mutationHint`. |
| `mutationHint` | The completion mutation by type: `create_trade_route`, `create_sublocation`, `create_location`, `create_group`, `record_intelligence`, `mint_masterwork`, … |
| `motiveGate[]`, `harmClass` | Required on every `destroy`. |
| `catalystQuery` | The encounter family the work may seed, by kind and tags: `{ kind: 'encounter_template', tags: ['#consortium_errand'] }`. **This is the field to author** (THR-1488). |
| `catalystEncounterIds[]` | *Deprecated.* Literal encounter ids. Kept one release for un-migrated packs; `check:undertaking` fails an id that names no registered template. |

### Catalysts — author the query, never the list (THR-1488)

Copy the encounter line: name the follow-up by **family**, from the closed tag vocabulary
in `.claude/skills/encounter-pipeline/reference/content-tag-catalog.generated.md`.

The reason is not symmetry, it is a measured failure. Every id the seven shipped packs
spelled was `encounter_<name>` while the corpus spells encounters `encounter.<name>` — so
**all thirty-three catalyst references resolved to nothing**, and every catalyst seed
planted since the feature shipped withered on arrival. The field sat in the substrate
inventory as DORMANT for that whole time, because nothing checked and a withered seed
looks exactly like a feature nobody wired.

**Auto-REVISE triggers** on the critic pass:

- `catalystEncounterIds` authored at all in a new package — the literal form is
  deprecated; rewrite it as a `catalystQuery`.
- A `catalystQuery` whose tag is not seated in the vocabulary, or which resolves to no
  encounter template. `check:undertaking` fails both under the `catalysts` block, so a
  package reaching the gate with either is a wasted stage.
- A catalyst whose family has nothing to do with the work. The family should be the one
  whose errands the undertaking *disturbs* — the Consortium's routes for a trade work,
  the Fellowship's stonework for a building one — not whichever family happened to
  resolve.

The **write set** — `mutationHint` + populated `creationEffects` bands + `harmClass` + the kind row +
`must-persist` cast + catalysts — is what `check:undertaking-live` proves. A package whose write set
is empty compiles, passes the contract's structural blocks, and then reports **vacuous** on the live
proof. That is by design: the work whose only product is a sentence is exactly what the factory
refuses to ship.

## `kind`

- `kindId` names a row in `src/data/undertaking-kinds.ts` (see
  `reference/kind-row-catalog.generated.md`). The compiler appends the template id to the row's
  `<role>TemplateIds` column, once.
- **A kind with no row is opened only by its first destroy.** Any other role on a row-less kind is
  refused: until a kind can be undone it is not a kind. The first destroy carries `kind.row` and the
  compiler writes the row with the id in its destroy column; creates and updates for that kind
  compile afterwards.

## `profiles`

Ambition template ids (any of `AMBITION_TEMPLATES`, `EVENT_MINTED_AMBITION_TEMPLATES`,
`GRIEVANCE_AMBITION_TEMPLATES` in `src/data/ambition-templates.ts`) whose
`strategicProfile.templateIds` gain this id. At least one is required: with no ambition naming it,
the template is unreachable by the board and only the review lever can start it. The named
ambition must already carry a `strategicProfile` — the compiler registers into a profile, it does
not invent one.

## What compile does — and does not

Does: validate; emit `src/data/strategic-packs/factory/<slug>.ts` and
`factory/__tests__/<slug>.test.ts`; register in the factory aggregate, the kind row, and the
profiles — all idempotent, so re-running on an unchanged package changes nothing.

Does not: run the contract, the live proof, or the typecheck. Those are the gates that follow:

```bash
npm run check:typecheck
npm run check:undertaking -- <id>
npm run check:undertaking-live -- <id> --seed 42 --seed 99
npx vitest run src/data/strategic-packs/factory/__tests__/<slug>.test.ts
```

The compiled file is the canonical, hand-editable artifact from then on. Re-compiling over a
hand-edited file needs `--force`, deliberately.
