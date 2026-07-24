# Action Proposal — Items move capability tiers again (THR-718)

## intent_quote

> lets prepare some more, as i will be away the entire day.

(Session directive 2026-07-24 — groom queued-but-unready work into Ready for Dev. The design content was verdicted by Christian in the 2026-07-23 interface-map chat review, recorded verbatim in THR-718:)

> **User verdict (chat review 2026-07-23):** YES — items move tiers again, via **finishing the migration**: a new `effects[]` primitive that feeds `computeRawScore` (one stat substrate; do NOT resurrect bare `domainContributions` fills). Power-budget note: items already shape resolution rolls via test shapers — tier influence stacks on top, tune deliberately.

> **UI requirement (user, verbatim intent):** a simple magnitude indicator next to the capability prose on the character sheet, using the same symbol language as spheres — dots. Reuse the shared `StepDots` primitive (`src/components/shared/StepDots.tsx`) or the sphere-alignment dot pattern; 1–5 or 1–10 to match whatever the existing sphere display uses.

## scope (what this plan does)

Grooms THR-718 into an executable three-pillar plan: new `stat_contribution` effect primitive + pure `collectStatContributions` collector + additive hook in `computeRawScore`'s existing artifact walk; possession-catalog migration under named power-budget band constants with a build-failing ceiling test; DomainCard magnitude dots via a `StepDots` `variant: 'magnitude'` on the 5-tier scale; `attachment-domain-contributions` re-badged LIVE. Design session only — executor implements.

## scope (what this plan does NOT do — explicit non-goals)

- No bare `domainContributions` fills on possession entries (user verdict verbatim)
- No changes to trait/resource/culture uses of `domainContributions` (legitimate, untouched)
- No conditional/duration composition on stat contributions in v1 (deferred non-goal)
- No edge-modifier path work (THR-723), no on-use triggers (THR-719), no `trait_grant` consumer (THR-737)
- No `AgentDetailPanel.tsx` fixes (orphaned dead code)
- No removal of the legacy node-prop artifact read (additive; content test guards double-dipping)

## impact_class

Reversible — plan doc + Linear transitions; downstream implementation is additive engine math + data migration + one shared-component variant, all CI-gated.

## evidence cited

- **Linear issue:** THR-718 (High, Content Architecture), user verdicts in description
- **Vision premises invoked:** prose-over-numbers, one source of truth, possessions-as-biography — brainstorm §Vision premises
- **UL terms touched:** Domain Capability, Reach, EncounterTemplate-adjacent none; no new terms (effect primitive names are code identifiers, not UL vocabulary)
- **Canon pages consulted:** `Docs/canon/interface-map.generated.md` (row 58 names THR-718), systems-inventory (attachments/personality ACTIVE)
- **Prior plan docs this builds on:** `Docs/plans/2026-07-23-system-interface-map.md` § remediation (a) + § User verdicts; the 2026-04-06 anomaly-catalog migration precedent
- **Rejected approaches considered and dismissed:** bare fills, shaper-channel routing, destructive legacy-read removal, dedicated dot component, 10-dot scale, v1 conditional composition — brainstorm §Alternatives

## load-bearing decisions touched

- **Everything is a graph node/edge** — respected; contributions flow through existing `possesses`/`bonded_to` edges, data lives in the node's `effects[]` bag (internal data, correctly a property)
- **Ascendants use the same prerequisite system** — respected; `computeRawScore` is shared, so item contributions apply uniformly
- No node types, edge types, GameState fields, or rejected approaches touched

## high-impact files touched (from Codesight)

None ≥100 importers: `effects.ts`, `effectQueries.ts`, `domainCapability.ts`, `DomainCard.tsx`, `StepDots.tsx`, five data catalogs, `interface-contracts.ts`. Blast Radius section omitted per template rule. (`domainCapability.ts` is hot-path but not high-importer; perf note + smoke requirement carried in NFP #7.)

## kill criteria

- If the CLI smoke shows a single minor item moving an agent a full tier, the bands are mis-set — lower `ITEM_STAT_BAND_*` (data-only) before shipping.
- If `computeRawScore` shows measurable tick-time regression in the 30-tick smoke, memoize `collectStatContributions` per node — but profile first (NFP #7: budget, not premature optimization).
- If the content sweep finds catalog entries whose flavor promises capability but whose band assignment is contentious, list them in the PR body for Christian's later review rather than guessing high.

## explicit user sign-off

Not required (Reversible). The design decisions are Christian's verbatim verdicts (2026-07-23 chat review, quoted above).

## author notes for the judge

- The user's UI verdict says "match whatever the existing sphere display uses (1–5 or 1–10)". The existing capability-dot language is **5**: `CAPABILITY_DOTS = 5` in the orphaned pre-modal sheet (precedent only), sphere dots in `HexBreadcrumb.tsx`, and DomainCard's 5-tier word scale all corroborate. The interpretive call is resolved by precedent, not a coin flip.
- Passive-only v1 semantics keep the resolver hook trivial; composition wrappers are named as a later extension, not silently dropped.
- The legacy node-prop read is deliberately preserved (NFP #6) with a double-dipping content test as the guard — "finish the migration" governs the *write/authoring* side, not the read tolerance.
