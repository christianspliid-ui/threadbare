# Action Proposal — the dormant kinds I: powers and conditions (THR-1429)

## intent_quote

> the executor list is empty. lets continue

> we need to ensure that we spread out undertakings to interface with all the different systems, and not overcrowd certain parts of the game where we already have a lot of complexity.

> i think a living world has interaction between a variety of agents and systems, the dynamism of a living organic world is hyperconnectivity, so i think we are on the right track here. wouldn't you say?

(Christian in chat, 2026-09-07. The first is the ask — keep the executor lane supplied from the wayfinder map; the second and third are the rulings that set the band order this plan is next in.)

## scope (what this plan does)

Builds the first half of the *dormant kinds* band from the wayfinder map THR-1396: three wanted cells decided on THR-1397. Gives the Power kind the node shape the world-object registry deferred (one shared definition node per spell, class `spell` beside `bestowed`, per THR-1395; `knows_spell` as the known biography, `has_trait` as the wielded, slot-capped set), and the `learn_spell` cell that writes it for casters from their tradition shelf. Adds the one signed `inflict_condition` cell — a blessing on self or an ally, a motive-gated curse on an enemy, a stranger refused — through the catalog's existing condition mint, with a new `afflicted` harm class so the cursed may avenge. Adds `seal_power`, which suppresses a rival's wielded power by minting the catalog's existing Null-Touched condition, read by the live suppression pass. Puts spells and their state on the agent sheet as words. Every cell names its reader in the same commit.

## scope (what this plan does NOT do — explicit non-goals)

- No new spells and no spell generator (the Powers map's, THR-1226 / THR-1232).
- No map-arena spells, no `'cast'` decision family, no seeded knowing at worldgen (THR-1230 / THR-1231 channels 2 and 5 — the Powers map's carve-up).
- No god-side verb: the nudge over casts (THR-1230 ruling 5) is the encounter side's and untouched.
- No unlearning of one's own spell (THR-1397: not worth a work) and no *prepare* verb to swap wielded spells.
- Does not build the Network cells or the plot (the dormant kinds II, THR-1430).
- Does not change what curing does (live) or how conditions decay (live).
- Does not flip `UNDERTAKING_MODEL` (THR-1403).

## impact_class

Reversible. One subtype on `TraitCategory`, one harm class, one catalog entry, three semantics, all additive; nothing removed and `bestowed` untouched. The union changes are guarded by totality and a contract test.

## evidence cited

- **Linear issue:** THR-1429, off map THR-1396; decisions cited inline: THR-1397, THR-1230, THR-1231, THR-1238, THR-1398, THR-1399, THR-1428, THR-1383, THR-1395.
- **Vision premises invoked:** mortal sovereignty; mechanics through prose; the living world / hyperconnectivity (2026-09-07).
- **UL terms touched:** Power, Spell, Bestowal (THR-1238, seated), Condition, undertaking, work, calling, moment. No new term; the *Spell* entry gains a shape line.
- **Canon pages consulted:** `Docs/canon/world-objects.md`, `undertakings.md`, `undertaking-grid.generated.md`, `systems-inventory.md`, `interface-map.generated.md`, `design-governance.md`, `rulebook-quick-reference.md`, `cosmology.md` (spheres as shelves), `Docs/design-system/laws.md`.
- **Prior plan docs this builds on:** `2026-09-03-thr-1392-verb-object-undertakings.md`, `2026-09-03-thr-1394-world-object-model.md`, `2026-08-25-effect-vocabulary-activation.md` (the suppress primitive), `2026-09-07-thr-1428-owed-readers.md`.
- **Rejected approaches considered and dismissed:** a new `spell_template` / `power` node type (load-bearing rule; the edge schema already chose `action_template`); a `wielded` flag on one edge (every attachment reader keys on edge presence); a rolled or parameterised sign (the pillar says not to roll a person's fate on a coin); reusing `property_destroyed` for a curse (wrong prose in the grievance); removing a sealed power (destroys an unlimited biography). Detail in the brainstorm companion.

## load-bearing decisions touched

- **No inventing node types without verification** — respected; the new thing is a *class* (`TraitCategory` member), which the world-object rule names as the permitted variant, landed with its registry row, UL term and canon row in one PR.
- **Relationships are edges** — known (`knows_spell`), wielded (`has_trait`), inflicted-by (an edge property on `has_trait`, additive; the culprit relation the grievance lane reads is the outcome node it already reads).
- **Everything is a graph node/edge** — spell templates become nodes so the edge has a target.
- **The world graph is mutated in place** — the sign is read at proposal on the live graph; no memo.
- **Reaches and Spheres are orthogonal** — the shelf is by Sphere (THR-1230 ruling 4), the caster floor by Reach (Veil); neither subsumes the other.

## high-impact files touched (from Codesight)

`src/types/traits.ts`, `src/types/strategicAction.ts`, `src/types/trace.ts` — union members only; Blast Radius section present with the greps the executor must run.

## kill criteria

- No caster completes `learn_spell` on two seeds in 150 ticks → the shelf or the caster floor is too narrow; constants move, shape stays.
- Curses never fire for want of a co-located motive → the sign rule is right and grievance supply (THR-1383) is the limit; recorded on the map, not loosened here.
- A sealed power still casts → the reader in `use × Power` is wrong; the Done-when guards it.

## explicit user sign-off

Not required (Reversible). The band order and the "keep the pipe supplied" ask are on THR-1399's resolution and in the intent quote.

## author notes for the judge

- The Power shape is the one decision this plan *makes* rather than cites: the registry note explicitly deferred it to "a later ticket", and both maps' recorded rulings constrain it (trait node the resolver reads; known unlimited, wielded capped; `action_template` as the edge target). The plan marks it as decided here, veto invited.
- The `afflicted` harm class is likewise the plan's addition, needed so THR-1397's "motive-gated" curse has a consequence the grievance lane can read; it rides the existing minting funnel.
- After run 1: no catalog entry is authored — the seal mints the existing Null-Touched (two edits); the Power shape follows THR-1395 (one definition node per spell, per-bearer state on the edge); the shelf reads the existing `sphereAffinity`. Everything the plan inflicts already exists.
- Uncertain: the exact ids of the caster mastery trait and the caster npc roles; the plan names them as a starting guess for the executor to correct against the content files.
- The dormant kinds II (THR-1430) is authored next by the same session; the mutex says land this first.
