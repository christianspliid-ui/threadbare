# Action proposal — 2026-11-07-thr-1733-scene-picture-speaks-words

## intent_quote

There is no live user ask; this is a bug ticket (agreed under the ways-of-working bug clause). The originating
words are the ticket's own, filed 2026-10-04 during the THR-1725 pickup:

> So every contract-bearing encounter with an `illustrationUrl` gives screen readers (and any broken-image
> fallback) several KB of JSON instead of a description.

> Treat a contract-prefixed `illustrationAlt` as absent when building `alt` (fall back to `Scene from <name>`),
> in both adapters — ideally via one shared helper beside `decodeContractMetadata` in
> `src/engine/encounter-contract-adapter.ts`. Longer term the contract should move off `illustrationAlt` into
> its own field; out of scope here.

The orchestrator's staging comment (2026-11-07) adds: refresh the moved paths, decide whether the stage
models under `src/engine/views/` make this an engine-file change for gate purposes, and state the
three-pillar line.

Christian's standing period focus (chat 2026-11-01): *"get the design lane to focus on UI and UX
improvements for the next period. specifically legibility and usability of the different UI modules"*.

## scope (what this plan does)

Adds one exported predicate in the contract adapter, one helper and one constant in the stage illustration
module, and changes the `alt` expression in the two stage view models to call the helper, so a contract
payload never becomes the scene picture's `aria-label`. Adds a unit test and a catalogue sweep.

## scope (what this plan does NOT do — explicit non-goals)

- Does not move the contract off `illustrationAlt` (ticket says out of scope).
- Does not edit the 23 per-encounter data files or the builder.
- Does not author new per-painting alt descriptions.
- Does not change `EncounterVeil` or any layout, type or colour.

## impact_class

Reversible.

## evidence cited

- **Linear issue:** THR-1733
- **Vision premises invoked:** none changed; UI Laws `Docs/design-system/laws.md` (Law 14, line 49; Law 13 `aria-label` clarification, line 46)
- **UL terms touched:** none
- **Canon pages consulted:** `Docs/canon/encounters.md`, `Docs/design-system/laws.md`, `Docs/canon/verification-gates.md`
- **Prior plan docs this builds on:** THR-1800 (`encounterIllustration.ts` — renderable URL helper)
- **Rejected approaches considered and dismissed:** contract to own field (refactor, out of scope); veil-side guard (wrong layer, unsweepable)

## load-bearing decisions touched

None. No graph, cache, position or awareness change.

## high-impact files touched (from Codesight)

None with ≥100 importers. `encounter-contract-adapter.ts`, `encounterIllustration.ts` and the two stage
models are narrow view/adapter modules.

## kill criteria

See the plan's Kill criteria: road ambush not opening painted → any swept template; import cycle → local
prefix test importing only the constant; any later JSON heard from a picture → a second reader exists, route
it through the helper.

## explicit user sign-off

Not required (Reversible).

## author notes for the judge

Every path and line was measured on `origin/main` `f7f080dd` and is quoted in the plan. The "23" comes from
a grep over `src/data/encounters/` for files that both set `illustrationUrl` and encode the contract into
`illustrationAlt`; the shared builder adds more at runtime, which is why the sweep asserts a floor of 23 rather
than an exact count. The fallback wording `Scene from <name>` is today's existing fallback, kept verbatim.
Player-facing complaint class: **PC-3** (developer text in player prose). The plan quotes the rendered
string (`Scene from Road Ambush`), the empty-name fallback (`An encounter scene`), and a playtest predicate on
the scene picture's accessibility name. Revision 2 after a judge Revise on dimension 12.
