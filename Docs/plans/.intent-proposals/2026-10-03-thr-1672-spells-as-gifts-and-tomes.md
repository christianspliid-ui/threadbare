# Action proposal — spells as divine gifts and found tomes (THR-1672)

## intent_quote

> "I think we have reached a state of the game where you can probably iterate and progress designs without me in many situations, for example where we have agreed on a wayfinder map." — Christian, chat, 2026-09-25 (the design lane's mandate, THR-1611)

The agreed outcome this plan delivers, settled live with Christian in chat on 2026-08-25:

> "**All five acquisition channels exist at the destination**, each kept deliberately shallow (simple triggers, no bespoke UI): 1. **Divine grant** — ruled in on the power-shape ticket (ruling 5): bestowal via the runtime minting path, nudge-card grant vocabulary, and seeded rewards; consequences trace to the god. … 4. **Found tomes** — some generated tomes/scrolls (already the catalog's biggest families) teach a spell when claimed. Deliberate coupling to the Item Generator map: item drops can change who an agent is." — THR-1231 resolution

> "Spells are also grantable content: divine-gift bestowal (runtime minting path exists), nudge-card grant vocabulary, seeded scrolls/rewards. Granted magic's doom and notice trace back to the god's meddling — teaching forbidden magic is a characterful divine act with consequences." — THR-1230 ruling 5

The ticket (filed as a deferral by the power runtime plan, 2026-09-29) asks to design both after THR-1572's plan lands. It landed 2026-09-30.

## scope (what this plan does)

Adds one spell-grant seam (`grantSpell`) and repoints the three existing spell writers onto it with byte-identical edges. Channel 1: a new divine action card, Teach a Spell (the god's spheres, tiers 1–2, falling back to the mortal's tradition); a new aftermath reaction kind `spell_grant` used by one new Cache-family nudge card; doom and detection charged to the god for teaching a transgression spell, and a detection echo plus a god-naming notice on each later cast. Channel 4: a tag predicate selects which books teach (six authored arcane or ancient books plus the generated forbidden book), and a hook at the three possession writers teaches a book's holder once; ancient books may teach tier 3 and prefer elder spells. Sheet provenance lines, card target line, traces, debug levers, constants.

## scope (what this plan does NOT do — explicit non-goals)

- Does not change Bestow Power.
- Does not widen the caster badge (ruling 4); `isCaster` is untouched.
- No new minting point for items (THR-1626's reward-draw share is not touched or depended on).
- No tome-reading action or other bespoke UI surface.
- No new authored books, no catalog edits.
- Gods never teach elder (Foundation) magic.
- Rivals do not teach; mentorship transmission stays fog.
- No per-god detection ledger; no new node or edge type.

## impact_class

Reversible. Both channels sit behind `SPELL_GRANT_ENABLED_DIVINE` / `SPELL_GRANT_ENABLED_TOMES`. The seam refactor is pinned by snapshot tests and its kill criterion reverts it.

## evidence cited

- **Linear issue:** THR-1672 (blocked by THR-1572 — built, PR #2178 unmerged)
- **Vision premises invoked:** `Vision/taste-profile.md` § Elder magic — discovered, not selected; systemic over scripted; narrative over mechanical perfection
- **UL terms touched:** Spell, Bestowal (one sentence each; no new term)
- **Canon pages consulted:** `Docs/canon/rulebook-quick-reference.md`, `Docs/canon/interface-map.md` (via `scripts/interface-contracts.ts`), `Docs/ubiquitous-language/Traits.md`
- **Prior plan docs this builds on:** `Docs/plans/2026-09-29-thr-1571-power-runtime.md`, `Docs/plans/2026-09-30-thr-1572-seeded-spell-generator.md`, `Docs/plans/2026-09-26-thr-1570-seeded-item-generator.md`
- **Census:** `Docs/audits/2026-09-25-living-world-data/readers/spell-gifts-tomes.ts`, output `spell-gifts-tomes-2026-10-03-thr1672.json`; tome reward counts from `reward-minting-2026-10-02-thr1626.json`
- **Rejected approaches considered and dismissed:** turning Bestow Power into a spell grant; routing grants through `attachment_grant`'s per-bearer clone; generated-tomes-only; every tome teaches; a tome-reading action; a 22nd card type; any known spell confers the caster badge (see brainstorm companion)

## load-bearing decisions touched

- **Everything is a graph node/edge** — respected: provenance lives on the `knows_spell` edge; no relationship is encoded as a property except an item's internal `taughtHolderIds` set, justified in the plan (no traversal needs it; the reader's edge carries the traversable direction).
- **Relationships are edges, not property fields** — `grantedBy` and `viaItemId` are edge properties on an existing edge, naming the provenance of that relationship, not a standalone relationship.
- **Ascendants use the same prerequisite system as agents** — the divine pool checks the mortal's own spell prerequisites.
- **No new node types** — none.

## high-impact files touched (from Codesight)

- `src/types/unifiedAction.ts` (624 importers) — one additive union member and one op. Blast Radius section present.
- `src/types/trace.ts` (147 importers) — five additive trace interfaces.

## kill criteria

Tomes flood the world with spells (more than 9 known on a mortal by tick 150, or tome-taught knowers above 15% of individuals): narrow or disable tomes. Dark teaching never priced in a scripted three-teach run against a library with transgressions: fix the provenance read before ship. Any diff in seeded `knows_spell` edges after the seam refactor: revert the repoint.
