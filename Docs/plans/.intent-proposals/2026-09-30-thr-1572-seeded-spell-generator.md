# Action proposal — the seeded spell generator (THR-1572)

## intent_quote

> "I think we have reached a state of the game where you can probably iterate and progress designs without me in many situations, for example where we have agreed on a wayfinder map."
> — Christian, 2026-09-25 (THR-1611, the design lane's mandate)

The ticket itself (THR-1572, filed by the Powers & Spellcraft map's closing carve-up on 2026-09-24):

> "This is the second: the generator that gives spellcasters their spells. It can be designed alongside the power-runtime plan, but it is built after it, because a generated spell needs a runtime to be seen."
> Settled input: THR-1230 (the generator axes: agency × arena × price × tier × sphere and tradition); THR-1232 (spells grow around authored cores with seeded variation; free composition limited to one optional rider); THR-1235 (the seeded-table pattern).
> Envelope rules the plan must carry: (1) what each tradition teaches, as a hard rule; (2) a price lean per tradition, which tier windows never override; (3) a price table split by agency; (4) shelves for the four Foundation spheres; (5) word banks per tradition; (6) a home for "notice" — the nearest honest substrate is a hidden mark a later encounter can reveal (the THR-661 pattern); (7) "it changes them" keyed to the tradition's vice; (8) a flavour slot per core, or at least two cores per arena × agency × tier cell.
> Decisions this plan must make: the balance envelope at population scale (about 1000 agents), including a population cap on world-doom prices, because `doom_rate_multiplier` multiplies across every carrier; the required gate: the honest-vocabulary validator plus an engine read-back, as the item prototype did.

## scope (what this plan does)

Designs a pure, seeded spell generator (`src/engine/spellGenerator/`) that builds one spell library per magic tradition in use at worldgen from authored cores ported from the THR-1232 prototype, validates every spell against two honest vocabularies (carried and cast) and an engine read-back, stores each generated template on its shared definition node, and seeds each caster from their tradition's library. It derives a caster's tradition from role and faction (casters have no sphere at worldgen, measured), places a hidden mark as the "notice" half of transgression, forbids world-doom prices, sets a population soul-drain budget, and adds four word lines to the spell row on the attachments tab.

## scope (what this plan does NOT do — explicit non-goals)

- No per-caster unique spells (one library per tradition).
- No spells as divine gifts or found tomes (THR-1672).
- No per-cast channel for modifier-only effects and no ally/enemy target filter (THR-1683); the generator refuses those shapes until it ships.
- Casters are not given spheres at worldgen; traditions are not minted as graph nodes; no tradition page.
- Generated innate powers, monster casts, `transfer` / `compel` executors: out.
- The seven authored spells are unchanged.
- No world-model edit (the Foundation shelves are generator data).

## impact_class

Reversible — a master switch (`SPELL_GEN_ENABLED = false`) restores today's seeding exactly; everything else is additive modules, one optional field on `CastResult`, and a repointing of nine call sites that resolves authored ids identically.

## evidence cited

- **Linear issue:** THR-1572 (carve-up of THR-1226)
- **Vision premises invoked:** systemic over scripted; narrative over mechanical perfection; prose not numbers; god shifts probabilities; taste profile "elder magic: discovered, not selected"
- **UL terms touched:** Spell, Power, Innate Power (unchanged), Strained (THR-1673), **Tradition** (new — proposed as a UL-proposal issue in the build PR)
- **Canon pages consulted:** `Docs/canon/process.md` (rule 4), `Docs/canon/cosmology.md` (spheres), `Docs/canon/systems-inventory.md` (via the substrate grep), `Docs/canon/rulebook.md` § Spells
- **Prior plan docs this builds on:** `Docs/plans/2026-09-29-thr-1571-power-runtime.md` (shipped), `Docs/plans/2026-09-26-thr-1570-seeded-item-generator.md` (shipped), `Docs/audits/2026-09-24-twenty-generated-spells.md`
- **Rejected approaches considered and dismissed:** free composition as the default (THR-1232 ruling); pure LLM-generated content (CLAUDE.md rejected approaches); keying tradition on sphere (measured dead at tick 0)

## load-bearing decisions touched

- **Everything is a graph node/edge:** generated templates live on existing `trait` definition nodes; tradition is recorded on the `knows_spell` edge and on the node, as a catalog id (like a sphere name), not a relationship to a graph entity. No new node or edge type.
- **Relationships are edges, not property fields:** the tradition is not a graph entity (traditions are catalog rows in `world-model.json`, not minted), so storing its id is data, not a relationship. Justified in the plan § Graph nodes.
- **Engine caches owned per session:** the plan rejects a module-level template registry for exactly this reason.
- **No inventing node types:** none invented.

## high-impact files touched (from Codesight)

`src/types/effects.ts` is a ≥100-importer file; the plan adds nothing to it (SpellTemplate already has every field). Blast Radius section present.

## kill criteria

- Gate cannot reach zero read-back failures → shrink the vocabulary; drop cores, never fake them.
- Tradition choice collapses (one tradition > half the casters) → retune role themes / faction lean.
- World reads over-magicked or too dark (notice marks on > 25% of casters) → lower the transgression share or off-role weight.
- Christian calls a thirty-spell sample flat → re-author cores via the CLI review path.
- A veto of any lane decision → one function, constant or table row each.

## explicit user sign-off

N/A — Reversible class.

## author notes for the judge

- The ticket says "tradition shelves" and the prototype drew tradition from sphere. The plan reverses the arrow because the census shows casters have no sphere at worldgen (109/109 all-zero; all seeded via the fallback cantrip). That is the plan's most consequential call and is marked Lane decision 1 with a veto invited.
- "Population cap on world-doom prices" is answered as a cap of zero (never emitted), with the reasoning that a shared library multiplies a carried doom-rate price per bearer. If the judge reads the ticket as requiring a non-zero cap mechanism, that is the point to challenge.
- Lane decision 6 narrows the prototype's deliberate spells (its `duration` riders are modifier-only when cast). This is a deliberate honesty trade: fewer deliberate shapes now, more when THR-1683 ships.
- The runtime ticket said the soul price for transgression lands via `doom_increase` → `spell_price`; the plan relies on that (FB3) rather than on doom-rate.
- Verify at will: `seedSpellKnowing` at `src/engine/seedAttachments.ts:291`, its call at `src/engine/worldSeed.ts:2382`; `executeEffect` modifier-only arms at `src/engine/effectExecutors.ts:904-947`; `phaseDoom.ts:349-355`; `getSpellTemplate` call sites via grep.
